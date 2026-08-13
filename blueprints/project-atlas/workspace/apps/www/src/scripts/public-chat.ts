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
  notice: string;
  greeting: string;
  quickActions: {
    services: string;
    credit: string;
    taxes: string;
    business: string;
    homeBuying: string;
    human: string;
  };
  errors: {
    invalidMessage: string;
    sensitiveData: string;
    temporarilyUnavailable: string;
    sessionExpired: string;
    conflict: string;
    responseNotRetained: string;
  };
  handoff: { requested: string; queued: string; unavailable: string };
  ui: {
    launcher: string;
    title: string;
    automated: string;
    close: string;
    language: string;
    acknowledge: string;
    start: string;
    placeholder: string;
    send: string;
    sending: string;
    statusReady: string;
    sources: string;
    helpCenter: string;
    fullPage: string;
    newConversation: string;
    characterCount: string;
  };
};
type ExperienceConfig = {
  locale: Locale;
  copy: Copy;
  paths: { help: string; contact: string; alternate: string; fullPage?: string };
  localizations: Record<
    Locale,
    {
      copy: Copy;
      paths: { help: string; contact: string; alternate: string; fullPage: string };
    }
  >;
  messageLimit: number;
};
type SuccessEnvelope = {
  ok: true;
  data: Projection;
  replayed: boolean;
  correlationId: string;
  csrfToken?: string;
};
type FailureEnvelope = { ok: false; code: string; data?: Projection; correlationId: string };

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
    return (value.locale === "es" || value.locale === "en") &&
      Number.isSafeInteger(value.messageLimit) &&
      value.messageLimit > 0
      ? value
      : null;
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
  const messageLimit = config.messageLimit;
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
  const title = required<HTMLElement>(root, "[data-public-chat-title]");
  const kicker = required<HTMLElement>(root, "[data-public-chat-kicker]");
  const noticeCopy = required<HTMLElement>(root, "[data-public-chat-notice-copy]");
  const acknowledgeCopy = required<HTMLElement>(root, "[data-public-chat-acknowledge-copy]");
  const inputLabel = required<HTMLElement>(root, "[data-public-chat-input-label]");
  const sourcesHeading = required<HTMLElement>(root, "[data-public-chat-sources-heading]");
  const help = required<HTMLAnchorElement>(root, "[data-public-chat-help]");
  const fullPage = element<HTMLAnchorElement>(root, "[data-public-chat-full-page]");

  let csrfToken: string | null = null;
  let projection: Projection | null = null;
  let pending = false;
  let returnFocus: HTMLElement | null = null;
  let closeController: AbortController | null = null;
  let closingRequest: Promise<void> | null = null;
  let conversationGeneration = 0;
  let activeCommandController: AbortController | null = null;
  let renderedConversationId: string | null = null;
  let pendingStart: { key: string; locale: Locale; noticeVersion: string } | null = null;
  let pendingMessage: { text: string; key: string; version: number } | null = null;
  let pendingHandoff: { reason: string; key: string; version: number } | null = null;
  let pendingLocale: { locale: Locale; key: string; version: number } | null = null;
  const renderedMessageIds = new Set<string>();

  function updateFullPageTransfer(): void {
    if (!fullPage) return;
    const target = new URL(config.paths.fullPage ?? "/chat/", window.location.origin);
    if (projection && csrfToken) {
      target.hash = new URLSearchParams({
        conversation: projection.id,
        csrf: csrfToken,
      }).toString();
    }
    fullPage.href = `${target.pathname}${target.search}${target.hash}`;
  }

  function applyLocalization(locale: Locale): void {
    const localized = config.localizations[locale];
    config.locale = locale;
    config.copy = localized.copy;
    config.paths = localized.paths;
    root.lang = locale;
    title.textContent = localized.copy.ui.title;
    kicker.textContent = localized.copy.ui.automated;
    noticeCopy.textContent = localized.copy.notice;
    acknowledgeCopy.textContent = localized.copy.ui.acknowledge;
    start.textContent = localized.copy.ui.start;
    language.textContent = localized.copy.ui.language;
    language.href = localized.paths.alternate;
    language.hreflang = locale === "es" ? "en" : "es";
    input.placeholder = localized.copy.ui.placeholder;
    inputLabel.textContent = localized.copy.ui.placeholder;
    send.textContent = pending ? localized.copy.ui.sending : localized.copy.ui.send;
    count.textContent = `${Math.max(0, messageLimit - [...input.value].length)} ${localized.copy.ui.characterCount}`;
    human.textContent = localized.copy.quickActions.human;
    help.textContent = localized.copy.ui.helpCenter;
    help.href = localized.paths.help;
    sourcesHeading.textContent = localized.copy.ui.sources;
    if (fullPage) {
      fullPage.textContent = localized.copy.ui.fullPage;
      updateFullPageTransfer();
    }
    for (const quickAction of root.querySelectorAll<HTMLButtonElement>(
      "[data-public-chat-prompt-key]",
    )) {
      const key = quickAction.dataset.publicChatPromptKey as "services" | "credit" | "taxes";
      const text = localized.copy.quickActions[key];
      quickAction.textContent = text;
      quickAction.dataset.publicChatPrompt = text;
    }
    for (const actor of root.querySelectorAll<HTMLElement>("[data-public-chat-actor]")) {
      actor.textContent =
        actor.dataset.publicChatActor === "visitor"
          ? locale === "es"
            ? "Tú"
            : "You"
          : localized.copy.ui.automated;
    }
    transcript.setAttribute("aria-label", localized.copy.ui.automated);
  }

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
    const terminal =
      projection?.status === "restricted" ||
      projection?.status === "closed" ||
      projection?.status === "expired";
    const handoffPending =
      projection?.status === "human_requested" ||
      projection?.status === "waiting_for_human" ||
      projection?.status === "human_active";
    const unavailable = terminal || handoffPending;
    start.disabled = value || !acknowledge.checked;
    input.disabled = value || unavailable;
    send.disabled = value || unavailable;
    human.disabled = value || terminal;
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
    csrfOverride?: string,
  ): Promise<SuccessEnvelope | FailureEnvelope> {
    const headers = new Headers({ accept: "application/json" });
    const init: RequestInit = { credentials: "same-origin", headers, signal };
    if (body !== undefined) {
      init.method = "POST";
      headers.set("content-type", "application/json");
      const requestCsrfToken = csrfOverride ?? csrfToken;
      if (requestCsrfToken) headers.set("x-atlas-chat-csrf", requestCsrfToken);
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
    updateFullPageTransfer();
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
      actor.dataset.publicChatActor = message.actor;
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
    const terminal =
      next.status === "restricted" || next.status === "closed" || next.status === "expired";
    const handoffPending =
      next.status === "human_requested" ||
      next.status === "waiting_for_human" ||
      next.status === "human_active";
    composer.hidden = terminal || handoffPending;
    actions.hidden = terminal || handoffPending;
    human.disabled = terminal;
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
    pendingStart = null;
    pendingMessage = null;
    pendingHandoff = null;
    pendingLocale = null;
    updateFullPageTransfer();
    renderedMessageIds.clear();
    input.value = "";
    input.disabled = false;
    send.disabled = false;
    send.textContent = config.copy.ui.send;
    human.disabled = false;
    count.textContent = `${messageLimit} ${config.copy.ui.characterCount}`;
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
    pendingStart ??= {
      key: idempotencyKey("start"),
      locale: config.locale,
      noticeVersion: "public-chat-notice.v1",
    };
    const command = pendingStart;
    try {
      const value = await request(
        "/api/public/chat/conversations",
        {
          locale: command.locale,
          noticeVersion: command.noticeVersion,
          noticeAcknowledged: true,
          idempotencyKey: command.key,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (value.ok) {
        pendingStart = null;
        renderProjection(value.data);
        announce(config.copy.ui.statusReady);
        input.focus();
      } else {
        if (value.code !== "command_in_progress") pendingStart = null;
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
    if (pending || !projection || !normalized || [...normalized].length > messageLimit) {
      announceError(config.copy.errors.invalidMessage);
      return;
    }
    setPending(true);
    const { controller, operationGeneration } = beginCommand();
    const command =
      pendingMessage?.text === normalized && pendingMessage.version === projection.version
        ? pendingMessage
        : { text: normalized, key: idempotencyKey("message"), version: projection.version };
    pendingMessage = command;
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(projection.id)}/messages`,
        {
          text: normalized,
          idempotencyKey: command.key,
          expectedVersion: command.version,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (value.ok) {
        const recoveredBody = value.data.messages.some(
          (message) => message.body && !renderedMessageIds.has(message.id),
        );
        renderProjection(value.data);
        pendingMessage = null;
        if (value.replayed && !recoveredBody) {
          announceError(config.copy.errors.responseNotRetained);
        } else {
          input.value = "";
          count.textContent = `${messageLimit} ${config.copy.ui.characterCount}`;
          announce(config.copy.ui.statusReady);
        }
      } else {
        if (value.code !== "command_in_progress") pendingMessage = null;
        if (value.data) renderProjection(value.data);
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
    if (
      projection.status === "human_requested" ||
      projection.status === "waiting_for_human" ||
      projection.status === "human_active"
    ) {
      window.location.assign(config.paths.contact);
      return;
    }
    setPending(true);
    announce(config.copy.handoff.requested);
    const { controller, operationGeneration } = beginCommand();
    const reason = "visitor_requested";
    const command =
      pendingHandoff?.reason === reason && pendingHandoff.version === projection.version
        ? pendingHandoff
        : { reason, key: idempotencyKey("handoff"), version: projection.version };
    pendingHandoff = command;
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(projection.id)}/handoff`,
        {
          reason: command.reason,
          idempotencyKey: command.key,
          expectedVersion: command.version,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (value.ok) {
        pendingHandoff = null;
        renderProjection(value.data);
        announce(config.copy.handoff.queued);
      } else {
        if (value.code !== "command_in_progress") pendingHandoff = null;
        if (value.data) renderProjection(value.data);
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

  const delay = (milliseconds: number) =>
    new Promise<void>((resolveDelay) => window.setTimeout(resolveDelay, milliseconds));

  async function closeConversation(
    active: Projection,
    closingCsrfToken: string,
    controller: AbortController,
  ): Promise<void> {
    let command = {
      key: idempotencyKey("close"),
      version: active.version,
    };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const value = await request(
          `/api/public/chat/conversations/${encodeURIComponent(active.id)}/close`,
          {
            idempotencyKey: command.key,
            expectedVersion: command.version,
          },
          controller.signal,
          closingCsrfToken,
        );
        if (value.ok || value.code === "revoked" || value.code === "expired") return;
        if (value.code === "conflict") {
          let currentProjection = value.data;
          if (!currentProjection) {
            const current = await request(
              `/api/public/chat/conversations/${encodeURIComponent(active.id)}`,
              undefined,
              controller.signal,
              closingCsrfToken,
            );
            if (!current.ok) return;
            currentProjection = current.data;
          }
          command = { key: idempotencyKey("close"), version: currentProjection.version };
        } else if (value.code !== "command_in_progress") {
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      await delay(75 * (attempt + 1));
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
      const timer = window.setTimeout(() => controller.abort(), 3_000);
      closingRequest = closeConversation(active, closingCsrfToken, controller).finally(() => {
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
    if (pending) return;
    const targetLocale: Locale = config.locale === "es" ? "en" : "es";
    if (!projection) {
      if (pendingStart) {
        await startConversation();
        if (!projection) return;
      } else {
        applyLocalization(targetLocale);
        announce(config.copy.ui.statusReady);
        return;
      }
    }
    const active = projection;
    setPending(true);
    const { controller, operationGeneration } = beginCommand();
    const command =
      pendingLocale?.locale === targetLocale && pendingLocale.version === active.version
        ? pendingLocale
        : { locale: targetLocale, key: idempotencyKey("locale"), version: active.version };
    pendingLocale = command;
    try {
      const value = await request(
        `/api/public/chat/conversations/${encodeURIComponent(active.id)}/language`,
        {
          locale: command.locale,
          idempotencyKey: command.key,
          expectedVersion: command.version,
        },
        controller.signal,
      );
      if (operationGeneration !== conversationGeneration) return;
      if (!value.ok) {
        if (value.code !== "command_in_progress") pendingLocale = null;
        if (value.data) renderProjection(value.data);
        announceError(errorText(config.copy, value.code));
        return;
      }
      pendingLocale = null;
      applyLocalization(value.data.locale);
      renderProjection(value.data);
      announce(config.copy.ui.statusReady);
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
    count.textContent = `${Math.max(0, messageLimit - [...input.value].length)} ${config.copy.ui.characterCount}`;
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
