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
  locale: Locale;
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
    helpCenter: string;
    characterCount: string;
  };
};
type ExperienceConfig = {
  locale: Locale;
  copy: Copy;
  paths: { help: string; contact: string; alternate: string };
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
  const language = required<HTMLAnchorElement>(root, "[data-public-chat-language]");
  const consent = required<HTMLElement>(root, "[data-public-chat-consent]");
  const acknowledge = required<HTMLInputElement>(root, "[data-public-chat-acknowledge]");
  const start = required<HTMLButtonElement>(root, "[data-public-chat-start]");
  const transcript = required<HTMLElement>(root, "[data-public-chat-transcript]");
  const composer = required<HTMLFormElement>(root, "[data-public-chat-composer]");
  const input = required<HTMLTextAreaElement>(root, "[data-public-chat-input]");
  const send = required<HTMLButtonElement>(root, "[data-public-chat-send]");
  const count = required<HTMLElement>(root, "[data-public-chat-count]");
  const status = required<HTMLElement>(root, "[data-public-chat-status]");
  const alert = required<HTMLElement>(root, "[data-public-chat-alert]");
  const actions = required<HTMLElement>(root, "[data-public-chat-actions]");
  const human = required<HTMLButtonElement>(root, "[data-public-chat-human]");
  const sources = required<HTMLElement>(root, "[data-public-chat-sources]");
  const sourceList = required<HTMLUListElement>(root, "[data-public-chat-source-list]");

  let csrfToken: string | null = null;
  let projection: Projection | null = null;
  let pending = false;
  let returnFocus: HTMLElement | null = null;
  let closeController: AbortController | null = null;
  let closingRequest: Promise<void> | null = null;
  let conversationGeneration = 0;
  let activeCommandController: AbortController | null = null;
  let renderedConversationId: string | null = null;
  const renderedMessageIds = new Set<string>();

  const announce = (message: string) => {
    alert.hidden = true;
    alert.textContent = "";
    status.textContent = message;
  };

  const announceError = (message: string) => {
    alert.textContent = message;
    alert.hidden = false;
  };

  const setPending = (value: boolean) => {
    pending = value;
    start.disabled = value || !acknowledge.checked;
    input.disabled = value;
    send.disabled = value;
    human.disabled = value;
    send.textContent = value ? config.copy.ui.sending : config.copy.ui.send;
  };

  function beginCommand(): { controller: AbortController; operationGeneration: number } {
    activeCommandController?.abort();
    const controller = new AbortController();
    activeCommandController = controller;
    return { controller, operationGeneration: conversationGeneration };
  }

  function finishCommand(controller: AbortController, operationGeneration: number): boolean {
    if (operationGeneration !== conversationGeneration) return false;
    if (activeCommandController === controller) activeCommandController = null;
    return true;
  }

  async function request(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<SuccessEnvelope | FailureEnvelope> {
    const headers = new Headers({ accept: "application/json" });
    const init: RequestInit = { credentials: "same-origin", headers, signal };
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
        announceError(errorText(config.copy, value.code));
        return false;
      }
      if (typeof value.csrfToken !== "string") return false;
      csrfToken = value.csrfToken;
      return true;
    } catch {
      announceError(config.copy.errors.temporarilyUnavailable);
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
    if (renderedConversationId !== next.id) {
      transcript.replaceChildren();
      renderedMessageIds.clear();
      renderedConversationId = next.id;
    }
    for (const message of next.messages) {
      if (!message.body || renderedMessageIds.has(message.id)) continue;
      const article = document.createElement("article");
      article.className = `public-chat-message public-chat-message--${message.actor}`;
      article.setAttribute("data-public-chat-message-id", message.id);
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
      renderedMessageIds.add(message.id);
    }
    renderSources(next.messages);
    transcript.scrollTop = transcript.scrollHeight;
    consent.hidden = true;
    composer.hidden = false;
    actions.hidden = false;
    human.disabled = false;
  }

  function resetConversationUi(): void {
    projection = null;
    csrfToken = null;
    pending = false;
    acknowledge.checked = false;
    consent.hidden = false;
    start.disabled = true;
    composer.hidden = true;
    actions.hidden = true;
    sources.hidden = true;
    sourceList.replaceChildren();
    renderedConversationId = null;
    renderedMessageIds.clear();
    input.value = "";
    input.disabled = false;
    send.disabled = false;
    send.textContent = config.copy.ui.send;
    human.disabled = false;
    count.textContent = `${MESSAGE_LIMIT} ${config.copy.ui.characterCount}`;
    transcript.replaceChildren();
    const greeting = document.createElement("article");
    greeting.className = "public-chat-message public-chat-message--assistant";
    const actor = document.createElement("p");
    actor.className = "public-chat-message__actor";
    actor.textContent = config.copy.ui.automated;
    const body = document.createElement("p");
    body.textContent = config.copy.greeting;
    greeting.append(actor, body);
    transcript.append(greeting);
    announce(config.copy.ui.statusReady);
  }

  async function resumeConversation(): Promise<void> {
    if (!window.location.hash.startsWith("#conversation=")) {
      await ensureBootstrap();
      return;
    }
    const transfer = new URLSearchParams(window.location.hash.slice(1));
    const conversationId = transfer.get("conversation");
    const transferToken = transfer.get("csrf");
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (
      transfer.size !== 2 ||
      !conversationId ||
      !/^[a-z][a-z0-9_-]{1,127}$/u.test(conversationId) ||
      !transferToken ||
      !/^[A-Za-z0-9_-]{32,128}$/u.test(transferToken)
    ) {
      await ensureBootstrap();
      return;
    }
    csrfToken = transferToken;
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(conversationId)}/resume`,
        { resume: true },
      );
      if (!value.ok || !value.csrfToken) {
        const message = errorText(config.copy, value.ok ? "session_invalid" : value.code);
        resetConversationUi();
        announceError(message);
        await ensureBootstrap();
        return;
      }
      csrfToken = value.csrfToken;
      renderProjection(value.data);
      announce(config.copy.ui.statusReady);
    } catch {
      resetConversationUi();
      announceError(config.copy.errors.temporarilyUnavailable);
      await ensureBootstrap();
    }
  }

  async function startConversation(): Promise<void> {
    if (pending || !acknowledge.checked || !(await ensureBootstrap())) return;
    setPending(true);
    const { controller, operationGeneration } = beginCommand();
    try {
      const value = await request(
        "/api/public/chat/conversations",
        {
          locale: config.locale,
          noticeVersion: "public-chat-notice.v1",
          noticeAcknowledged: true,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (value.ok) {
        renderProjection(value.data);
        announce(config.copy.ui.statusReady);
        input.focus();
      } else {
        announceError(errorText(config.copy, value.code));
      }
    } catch {
      if (operationGeneration === conversationGeneration) {
        announceError(config.copy.errors.temporarilyUnavailable);
      }
    } finally {
      if (finishCommand(controller, operationGeneration)) setPending(false);
    }
  }

  async function sendMessage(text: string): Promise<void> {
    const normalized = text.normalize("NFC").trim();
    if (pending || !projection || !normalized || [...normalized].length > MESSAGE_LIMIT) {
      announceError(config.copy.errors.invalidMessage);
      return;
    }
    setPending(true);
    const { controller, operationGeneration } = beginCommand();
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(projection.id)}/messages`,
        {
          text: normalized,
          idempotencyKey: idempotencyKey("message"),
          expectedVersion: projection.version,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (value.ok) {
        input.value = "";
        count.textContent = `${MESSAGE_LIMIT} ${config.copy.ui.characterCount}`;
        renderProjection(value.data);
        announce(config.copy.ui.statusReady);
      } else {
        announceError(errorText(config.copy, value.code));
      }
    } catch {
      if (operationGeneration === conversationGeneration) {
        announceError(config.copy.errors.temporarilyUnavailable);
      }
    } finally {
      if (finishCommand(controller, operationGeneration)) {
        setPending(false);
        input.focus();
      }
    }
  }

  async function requestHuman(): Promise<void> {
    if (pending || !projection) {
      window.location.assign(config.paths.contact);
      return;
    }
    setPending(true);
    announce(config.copy.handoff.requested);
    const { controller, operationGeneration } = beginCommand();
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(projection.id)}/handoff`,
        {
          reason: "visitor_requested",
          idempotencyKey: idempotencyKey("handoff"),
          expectedVersion: projection.version,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (value.ok) {
        if (value.csrfToken) csrfToken = value.csrfToken;
        renderProjection(value.data);
        announce(config.copy.handoff.queued);
      } else {
        announceError(config.copy.handoff.unavailable);
      }
    } catch {
      if (operationGeneration === conversationGeneration) {
        announceError(config.copy.handoff.unavailable);
      }
    } finally {
      if (finishCommand(controller, operationGeneration)) setPending(false);
    }
  }

  function closePanel(): void {
    const active = projection;
    const closingCsrfToken = csrfToken;
    conversationGeneration += 1;
    activeCommandController?.abort();
    activeCommandController = null;
    if (active && closingCsrfToken) {
      closeController?.abort();
      closeController = new AbortController();
      const controller = closeController;
      const timer = window.setTimeout(() => controller.abort(), 1_500);
      closingRequest = request(
        `/api/public/chat/conversations/${encodeURIComponent(active.id)}/close`,
        {
          idempotencyKey: idempotencyKey("close"),
          expectedVersion: active.version,
        },
        controller.signal,
      )
        .then(() => undefined)
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(timer);
          if (closeController === controller) closeController = null;
          closingRequest = null;
        });
    }
    resetConversationUi();
    if (panel.dataset.publicChatMode === "floating") panel.hidden = true;
    launcher?.setAttribute("aria-expanded", "false");
    returnFocus?.focus();
  }

  async function openPanel(): Promise<void> {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.hidden = false;
    launcher?.setAttribute("aria-expanded", "true");
    dismiss?.focus();
    if (closingRequest) await closingRequest;
    await ensureBootstrap();
  }

  async function changeConversationLocale(event: MouseEvent): Promise<void> {
    event.preventDefault();
    if (!projection || pending) return;
    const active = projection;
    setPending(true);
    const { controller, operationGeneration } = beginCommand();
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(active.id)}/language`,
        {
          locale: config.locale === "es" ? "en" : "es",
          idempotencyKey: idempotencyKey("locale"),
          expectedVersion: active.version,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (!value.ok) {
        announceError(errorText(config.copy, value.code));
        return;
      }
      const target = new URL(config.paths.alternate, window.location.origin);
      if (!csrfToken) {
        announceError(config.copy.errors.sessionExpired);
        return;
      }
      target.hash = new URLSearchParams({
        conversation: value.data.id,
        csrf: csrfToken,
      }).toString();
      window.location.assign(target.href);
    } catch {
      if (operationGeneration === conversationGeneration) {
        announceError(config.copy.errors.temporarilyUnavailable);
      }
    } finally {
      if (finishCommand(controller, operationGeneration)) setPending(false);
    }
  }

  launcher?.addEventListener("click", () => void openPanel());
  dismiss?.addEventListener("click", () => closePanel());
  language.addEventListener("click", (event) => void changeConversationLocale(event));
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
      closePanel();
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

  if (panel.dataset.publicChatMode === "page") void resumeConversation();
}

for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initExperience(root);
