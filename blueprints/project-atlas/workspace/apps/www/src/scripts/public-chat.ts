type Locale = "es" | "en";

type Citation = { sourceId: string; title: string; path: string };
type Action = { key: "help_center" | "human_support"; path: string };
type Message = {
  id: string;
  actor: "visitor" | "assistant" | "human" | "system";
  body: string | null;
  citations: Citation[];
  actions: Action[];
};
type Projection = {
  id: string;
  version: number;
  status: string;
  messages: Message[];
};
type Copy = {
  greeting: string;
  quickActions: { human: string };
  errors: {
    invalidMessage: string;
    sensitiveData: string;
    temporarilyUnavailable: string;
    sessionExpired: string;
    conflict: string;
  };
  handoff: { requested: string; queued: string; unavailable: string };
  ui: {
    automated: string;
    send: string;
    sending: string;
    statusReady: string;
    characterCount: string;
  };
};
type ExperienceConfig = {
  locale: Locale;
  copy: Copy;
  paths: { help: string; contact: string };
};
type SuccessEnvelope = {
  ok: true;
  data: Projection;
  correlationId: string;
  csrfToken?: string;
};
type FailureEnvelope = { ok: false; code: string; correlationId: string };

const MESSAGE_LIMIT = 2_000;
const ROOT_SELECTOR = "[data-public-chat-root]";

function element<T extends Element>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const match = element<T>(root, selector);
  if (!match) throw new Error(`PUBLIC_CHAT_UI_CONTRACT_MISSING:${selector}`);
  return match;
}

function safePublicPath(path: unknown, fallback: string): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return fallback;
  try {
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

function readConfig(root: HTMLElement): ExperienceConfig | null {
  const node = element<HTMLScriptElement>(root, "[data-public-chat-copy]");
  try {
    const value = JSON.parse(node?.textContent ?? "") as ExperienceConfig;
    return value.locale === "es" || value.locale === "en" ? value : null;
  } catch {
    return null;
  }
}

function errorText(copy: Copy, code: string): string {
  if (code === "content_rejected") return copy.errors.sensitiveData;
  if (code === "expired" || code === "revoked" || code === "session_invalid") {
    return copy.errors.sessionExpired;
  }
  if (code === "conflict" || code === "command_in_progress") return copy.errors.conflict;
  if (code === "invalid_request" || code === "clarification_required") {
    return copy.errors.invalidMessage;
  }
  return copy.errors.temporarilyUnavailable;
}

function idempotencyKey(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

function initExperience(root: HTMLElement): void {
  const parsedConfig = readConfig(root);
  if (!parsedConfig) return;
  const config: ExperienceConfig = parsedConfig;
  const panel = required<HTMLElement>(root, "[data-public-chat-panel]");
  const launcher = element<HTMLButtonElement>(root, "[data-public-chat-launcher]");
  const dismiss = element<HTMLButtonElement>(root, "[data-public-chat-dismiss]");
  const consent = required<HTMLElement>(root, "[data-public-chat-consent]");
  const acknowledge = required<HTMLInputElement>(root, "[data-public-chat-acknowledge]");
  const start = required<HTMLButtonElement>(root, "[data-public-chat-start]");
  const transcript = required<HTMLElement>(root, "[data-public-chat-transcript]");
  const composer = required<HTMLFormElement>(root, "[data-public-chat-composer]");
  const input = required<HTMLTextAreaElement>(root, "[data-public-chat-input]");
  const send = required<HTMLButtonElement>(root, "[data-public-chat-send]");
  const count = required<HTMLElement>(root, "[data-public-chat-count]");
  const status = required<HTMLElement>(root, "[data-public-chat-status]");
  const actions = required<HTMLElement>(root, "[data-public-chat-actions]");
  const human = required<HTMLButtonElement>(root, "[data-public-chat-human]");
  const sources = required<HTMLElement>(root, "[data-public-chat-sources]");
  const sourceList = required<HTMLUListElement>(root, "[data-public-chat-source-list]");

  let csrfToken: string | null = null;
  let projection: Projection | null = null;
  let pending = false;
  let returnFocus: HTMLElement | null = null;

  const announce = (message: string) => {
    status.textContent = message;
  };

  const setPending = (value: boolean) => {
    pending = value;
    start.disabled = value || !acknowledge.checked;
    input.disabled = value;
    send.disabled = value;
    human.disabled = value || !projection;
    send.textContent = value ? config.copy.ui.sending : config.copy.ui.send;
  };

  async function request(path: string, body?: unknown): Promise<SuccessEnvelope | FailureEnvelope> {
    const headers = new Headers({ accept: "application/json" });
    const init: RequestInit = { credentials: "same-origin", headers };
    if (body !== undefined) {
      init.method = "POST";
      headers.set("content-type", "application/json");
      if (csrfToken) headers.set("x-atlas-chat-csrf", csrfToken);
      init.body = JSON.stringify(body);
    }
    const response = await fetch(path, init);
    const value = (await response.json()) as SuccessEnvelope | FailureEnvelope;
    return value;
  }

  async function ensureBootstrap(): Promise<boolean> {
    if (csrfToken) return true;
    try {
      const value = (await request("/api/public/chat/bootstrap")) as
        | { ok: true; csrfToken: string; correlationId: string }
        | FailureEnvelope;
      if (!value.ok) {
        announce(errorText(config.copy, value.code));
        return false;
      }
      if (typeof value.csrfToken !== "string") return false;
      csrfToken = value.csrfToken;
      return true;
    } catch {
      announce(config.copy.errors.temporarilyUnavailable);
      return false;
    }
  }

  function renderSources(messages: Message[]): void {
    sourceList.replaceChildren();
    const latest = [...messages].reverse().find((message) => message.citations.length > 0);
    if (!latest) {
      sources.hidden = true;
      return;
    }
    for (const citation of latest.citations) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = safePublicPath(citation.path, config.paths.help);
      link.textContent = citation.title;
      item.append(link);
      sourceList.append(item);
    }
    sources.hidden = false;
  }

  function renderProjection(next: Projection): void {
    projection = next;
    transcript.replaceChildren();
    for (const message of next.messages) {
      if (!message.body) continue;
      const article = document.createElement("article");
      article.className = `public-chat-message public-chat-message--${message.actor}`;
      const actor = document.createElement("p");
      actor.className = "public-chat-message__actor";
      actor.textContent =
        message.actor === "visitor"
          ? config.locale === "es"
            ? "Tú"
            : "You"
          : config.copy.ui.automated;
      const body = document.createElement("p");
      body.textContent = message.body;
      article.append(actor, body);
      for (const action of message.actions) {
        const link = document.createElement("a");
        link.href = safePublicPath(
          action.path,
          action.key === "human_support" ? config.paths.contact : config.paths.help,
        );
        link.textContent =
          action.key === "human_support"
            ? config.copy.quickActions.human
            : config.copy.ui.helpCenter;
        article.append(link);
      }
      transcript.append(article);
    }
    renderSources(next.messages);
    transcript.scrollTop = transcript.scrollHeight;
    consent.hidden = true;
    composer.hidden = false;
    actions.hidden = false;
    human.disabled = false;
  }

  async function startConversation(): Promise<void> {
    if (pending || !acknowledge.checked || !(await ensureBootstrap())) return;
    setPending(true);
    try {
      const value = await request("/api/public/chat/conversations", {
        locale: config.locale,
        noticeVersion: "public-chat-notice.v1",
        noticeAcknowledged: true,
      });
      if (value.ok) {
        renderProjection(value.data);
        announce(config.copy.ui.statusReady);
        input.focus();
      } else {
        announce(errorText(config.copy, value.code));
      }
    } catch {
      announce(config.copy.errors.temporarilyUnavailable);
    } finally {
      setPending(false);
    }
  }

  async function sendMessage(text: string): Promise<void> {
    const normalized = text.normalize("NFC").trim();
    if (pending || !projection || !normalized || [...normalized].length > MESSAGE_LIMIT) {
      announce(config.copy.errors.invalidMessage);
      return;
    }
    setPending(true);
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(projection.id)}/messages`,
        {
          text: normalized,
          idempotencyKey: idempotencyKey("message"),
          expectedVersion: projection.version,
        },
      );
      if (value.ok) {
        input.value = "";
        count.textContent = `${MESSAGE_LIMIT} ${config.copy.ui.characterCount}`;
        renderProjection(value.data);
        announce(config.copy.ui.statusReady);
      } else {
        announce(errorText(config.copy, value.code));
      }
    } catch {
      announce(config.copy.errors.temporarilyUnavailable);
    } finally {
      setPending(false);
      input.focus();
    }
  }

  async function requestHuman(): Promise<void> {
    if (pending || !projection) {
      window.location.assign(config.paths.contact);
      return;
    }
    setPending(true);
    announce(config.copy.handoff.requested);
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(projection.id)}/handoff`,
        {
          reason: "visitor_requested",
          idempotencyKey: idempotencyKey("handoff"),
          expectedVersion: projection.version,
        },
      );
      if (value.ok) {
        if (value.csrfToken) csrfToken = value.csrfToken;
        renderProjection(value.data);
        announce(config.copy.handoff.queued);
      } else {
        announce(config.copy.handoff.unavailable);
      }
    } catch {
      announce(config.copy.handoff.unavailable);
    } finally {
      setPending(false);
    }
  }

  async function closePanel(): Promise<void> {
    if (projection && csrfToken) {
      try {
        await request(`/api/public/chat/conversations/${encodeURIComponent(projection.id)}/close`, {
          idempotencyKey: idempotencyKey("close"),
          expectedVersion: projection.version,
        });
      } catch {
        // The visible panel still closes; the server-side session expires independently.
      }
    }
    csrfToken = null;
    projection = null;
    if (panel.dataset.publicChatMode === "floating") panel.hidden = true;
    launcher?.setAttribute("aria-expanded", "false");
    returnFocus?.focus();
  }

  async function openPanel(): Promise<void> {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.hidden = false;
    launcher?.setAttribute("aria-expanded", "true");
    dismiss?.focus();
    await ensureBootstrap();
  }

  launcher?.addEventListener("click", () => void openPanel());
  dismiss?.addEventListener("click", () => void closePanel());
  acknowledge.addEventListener("change", () => {
    start.disabled = pending || !acknowledge.checked;
  });
  start.addEventListener("click", () => void startConversation());
  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    void sendMessage(input.value);
  });
  input.addEventListener("input", () => {
    count.textContent = `${Math.max(0, MESSAGE_LIMIT - [...input.value].length)} ${config.copy.ui.characterCount}`;
  });
  for (const quickAction of root.querySelectorAll<HTMLButtonElement>("[data-public-chat-prompt]")) {
    quickAction.addEventListener(
      "click",
      () => void sendMessage(quickAction.dataset.publicChatPrompt ?? ""),
    );
  }
  human.addEventListener("click", () => void requestHuman());
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.dataset.publicChatMode === "floating") {
      event.preventDefault();
      void closePanel();
      return;
    }
    if (event.key !== "Tab" || panel.dataset.publicChatMode !== "floating") return;
    const focusable = [
      ...panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((node) => !node.hidden);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (panel.dataset.publicChatMode === "page") void ensureBootstrap();
}

for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initExperience(root);
