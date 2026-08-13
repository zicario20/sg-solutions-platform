import type {
  AuditEvent,
  AuditPort,
  ChatCommandFailure,
  ChatCommandResult,
  ChatCommandSuccess,
  ChatLocale,
  Clock,
  CommandFingerprintPort,
  ConversationRepository,
  IdFactory,
  PublicChatAction,
  PublicChatConversation,
  PublicChatMessage,
  PublicChatProjection,
  PublicCitation,
  PublicSessionContext,
} from "./contracts.ts";
import type {
  ChatModelProvider,
  HandoffReason,
  HandoffResult,
  HumanHandoffPort,
  ModelResponse,
  ModerationProvider,
  ModerationReason,
  ModerationResult,
  PublicKnowledgeProvider,
} from "./providers.ts";
import { canTransitionConversation } from "./state-machine.ts";

export type ConversationServiceDependencies = {
  repository: ConversationRepository;
  knowledge: PublicKnowledgeProvider;
  moderation: ModerationProvider;
  model: ChatModelProvider;
  handoff: HumanHandoffPort;
  audit: AuditPort;
  clock: Clock;
  ids: IdFactory;
  commandFingerprint: CommandFingerprintPort;
  sessionTtlSeconds: number;
  absoluteLifetimeSeconds: number;
  maxConversationMessages: number;
  commandLeaseSeconds: number;
  commandWaitMilliseconds: number;
  providerTimeoutMilliseconds: number;
};

type OwnedConversationResult =
  | { ok: true; conversation: PublicChatConversation }
  | { ok: false; result: ChatCommandFailure };

type ClaimedConversationResult =
  | { kind: "ready"; conversation: PublicChatConversation; leaseToken: string }
  | { kind: "result"; result: ChatCommandResult };

const MODEL_RESPONSE_MAX_CHARACTERS = 4_000;
const MODEL_MARKUP = /(?:<\/?[a-z][^>]{0,512}>|<!--|<!doctype\b|<\?xml\b)/iu;
const MODERATION_REASONS = new Set<ModerationReason>([
  "ambiguous",
  "government_identifier",
  "payment_card",
  "bank_account",
  "credential",
  "markup",
  "abuse",
  "safety",
  "policy_required",
  "complaint",
  "unknown",
]);
const HANDOFF_REASONS = new Set<HandoffReason>([
  "visitor_requested",
  "complaint",
  "safety",
  "policy_required",
  "assistant_unavailable",
]);
const PROVIDER_TIMEOUT = Symbol("provider_timeout");
const PROVIDER_CALLS_PER_MESSAGE = 4;
const COMMAND_COMPLETION_MARGIN_MILLISECONDS = 5_000;

async function withProviderTimeout<T>(
  timeoutMilliseconds: number,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T | typeof PROVIDER_TIMEOUT> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<typeof PROVIDER_TIMEOUT>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(PROVIDER_TIMEOUT);
        }, timeoutMilliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function project(conversation: PublicChatConversation): PublicChatProjection {
  return {
    id: conversation.id,
    version: conversation.version,
    locale: conversation.locale,
    status: conversation.status,
    messages: structuredClone(conversation.messages),
    expiresAt: conversation.expiresAt,
  };
}

function appendMessage(
  conversation: PublicChatConversation,
  message: PublicChatMessage,
): PublicChatConversation {
  return { ...conversation, messages: [...conversation.messages, message] };
}

function withActivity(
  conversation: PublicChatConversation,
  now: Date,
  sessionTtlSeconds: number,
  absoluteLifetimeSeconds: number,
): PublicChatConversation {
  const slidingDeadline = now.getTime() + sessionTtlSeconds * 1_000;
  const absoluteDeadline = conversation.createdAt.getTime() + absoluteLifetimeSeconds * 1_000;
  return {
    ...conversation,
    version: conversation.version + 1,
    updatedAt: now,
    lastActivityAt: now,
    expiresAt: new Date(Math.min(slidingDeadline, absoluteDeadline)),
  };
}

function normalizeModerationReason(reason: unknown): ModerationReason {
  return typeof reason === "string" && MODERATION_REASONS.has(reason as ModerationReason)
    ? (reason as ModerationReason)
    : "unknown";
}

function normalizeHandoffReason(reason: unknown): HandoffReason {
  return typeof reason === "string" && HANDOFF_REASONS.has(reason as HandoffReason)
    ? (reason as HandoffReason)
    : "policy_required";
}

function normalizeModelReason(reason: unknown): "disabled" | "timeout" | "provider_error" {
  return reason === "disabled" || reason === "timeout" || reason === "provider_error"
    ? reason
    : "provider_error";
}

function hasUnsafeControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined &&
      ((codePoint >= 0 && codePoint <= 8) ||
        codePoint === 11 ||
        codePoint === 12 ||
        (codePoint >= 14 && codePoint <= 31) ||
        (codePoint >= 127 && codePoint <= 159) ||
        codePoint === 0x061c ||
        codePoint === 0x200e ||
        codePoint === 0x200f ||
        (codePoint >= 0x202a && codePoint <= 0x202e) ||
        (codePoint >= 0x2066 && codePoint <= 0x2069))
    );
  });
}

function validateModelText(value: string): string | null {
  const normalized = value.replace(/\r\n?/gu, "\n").normalize("NFC").trim();
  if (
    !normalized ||
    [...normalized].length > MODEL_RESPONSE_MAX_CHARACTERS ||
    hasUnsafeControlCharacter(normalized) ||
    MODEL_MARKUP.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function resolvePublicActions(
  actions: PublicChatAction[] | undefined,
  locale: ChatLocale,
): PublicChatAction[] {
  const catalog: Record<PublicChatAction["key"], Record<ChatLocale, string>> = {
    help_center: { es: "/recursos/", en: "/en/resources/" },
    human_support: { es: "/contacto/", en: "/en/contact/" },
  };
  const keys = (actions ?? []).flatMap((action) => {
    if (!action || typeof action !== "object" || !("key" in action)) return [];
    const key = action.key;
    return key === "help_center" || key === "human_support" ? [key] : [];
  });
  return [...new Set(keys)].map((key) => ({ key, path: catalog[key][locale] }));
}

async function classifySafely(
  provider: ModerationProvider,
  input: { text: string; locale: ChatLocale },
  timeoutMilliseconds: number,
): Promise<ModerationResult> {
  try {
    const result = await withProviderTimeout(timeoutMilliseconds, (signal) =>
      provider.classify({ ...input, signal }),
    );
    if (result === PROVIDER_TIMEOUT) return { decision: "unavailable" };
    switch (result.decision) {
      case "allow":
      case "unavailable":
        return result;
      case "clarify":
      case "handoff":
      case "reject":
        return { ...result, reason: normalizeModerationReason(result.reason) };
      default:
        return { decision: "unavailable" };
    }
  } catch {
    return { decision: "unavailable" };
  }
}

async function searchSafely(
  provider: PublicKnowledgeProvider,
  input: { locale: ChatLocale; query: string },
  timeoutMilliseconds: number,
) {
  try {
    const result = await withProviderTimeout(timeoutMilliseconds, (signal) =>
      provider.search({ ...input, signal }),
    );
    return result === PROVIDER_TIMEOUT ? ({ status: "unavailable" } as const) : result;
  } catch {
    return { status: "unavailable" } as const;
  }
}

async function respondSafely(
  provider: ChatModelProvider,
  input: { locale: ChatLocale; message: string; sources: PublicCitation[] },
  timeoutMilliseconds: number,
): Promise<ModelResponse> {
  try {
    const result = await withProviderTimeout(timeoutMilliseconds, (signal) =>
      provider.respond({ ...input, signal }),
    );
    if (result === PROVIDER_TIMEOUT) return { status: "unavailable", reason: "timeout" };
    if (result.status === "unavailable") {
      return { status: "unavailable", reason: normalizeModelReason(result.reason) };
    }
    if (
      result.status !== "answered" ||
      typeof result.text !== "string" ||
      !Array.isArray(result.citations)
    ) {
      return { status: "unavailable", reason: "provider_error" };
    }
    return {
      status: "answered",
      text: result.text,
      citations: result.citations.filter(
        (citation) => citation && typeof citation.sourceId === "string",
      ),
      actions: Array.isArray(result.actions) ? result.actions : [],
    };
  } catch {
    return { status: "unavailable", reason: "provider_error" };
  }
}

async function enqueueSafely(
  provider: HumanHandoffPort,
  input: Parameters<HumanHandoffPort["enqueue"]>[0],
  timeoutMilliseconds: number,
): Promise<HandoffResult> {
  try {
    const result = await withProviderTimeout(timeoutMilliseconds, (signal) =>
      provider.enqueue({ ...input, signal }),
    );
    if (result === PROVIDER_TIMEOUT) return { status: "unavailable" };
    if (
      result.status === "queued" &&
      typeof result.receiptId === "string" &&
      result.receiptId.length > 0 &&
      result.queuedAt instanceof Date &&
      !Number.isNaN(result.queuedAt.getTime())
    ) {
      return result;
    }
    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

async function recordAuditSafely(port: AuditPort, event: AuditEvent): Promise<void> {
  try {
    await port.record(event);
  } catch {
    // The durable repository/outbox becomes authoritative in Task 5. Never leak adapter errors.
  }
}

async function loadOwned(
  dependencies: ConversationServiceDependencies,
  conversationId: string,
  sessionHash: string,
): Promise<OwnedConversationResult> {
  const conversation = await dependencies.repository.findOwned(conversationId, sessionHash);
  if (!conversation) return { ok: false, result: { ok: false, code: "not_found" } };
  if (conversation.revokedAt) return { ok: false, result: { ok: false, code: "revoked" } };
  if (conversation.expiresAt.getTime() <= dependencies.clock.now().getTime()) {
    return { ok: false, result: { ok: false, code: "expired" } };
  }
  return { ok: true, conversation };
}

function replay(result: ChatCommandResult): ChatCommandResult {
  return result.ok ? { ...result, replayed: true } : result;
}

async function claimCommand(
  dependencies: ConversationServiceDependencies,
  input: {
    context: PublicSessionContext;
    conversationId: string;
    idempotencyKey: string;
    expectedVersion: number;
    kind: "message" | "handoff" | "locale" | "close";
    fingerprintPayload: string;
  },
): Promise<ClaimedConversationResult> {
  const fingerprint = dependencies.commandFingerprint.digest(input.fingerprintPayload);
  const conversation = await dependencies.repository.findOwned(
    input.conversationId,
    input.context.sessionHash,
  );
  if (!conversation) return { kind: "result", result: { ok: false, code: "not_found" } };
  if (conversation.revokedAt) return { kind: "result", result: { ok: false, code: "revoked" } };
  if (conversation.expiresAt.getTime() <= dependencies.clock.now().getTime()) {
    return { kind: "result", result: { ok: false, code: "expired" } };
  }

  const prior = await dependencies.repository.findCommandResult(
    input.conversationId,
    input.idempotencyKey,
    input.kind,
    fingerprint,
  );
  if (prior === "command_mismatch") {
    return { kind: "result", result: { ok: false, code: "conflict" } };
  }
  if (prior) return { kind: "result", result: replay(prior) };

  const claim = await dependencies.repository.claimCommand({
    kind: input.kind,
    fingerprint,
    conversationId: input.conversationId,
    idempotencyKey: input.idempotencyKey,
    expectedVersion: input.expectedVersion,
    leaseExpiresAt: new Date(
      dependencies.clock.now().getTime() + dependencies.commandLeaseSeconds * 1_000,
    ),
  });
  if (claim.status === "completed") return { kind: "result", result: replay(claim.result) };
  if (claim.status === "conflict") {
    return { kind: "result", result: { ok: false, code: "conflict" } };
  }
  if (claim.status === "in_progress") {
    const completed = await dependencies.repository.waitForCommandResult(
      input.conversationId,
      input.idempotencyKey,
      input.kind,
      fingerprint,
      new Date(dependencies.clock.now().getTime() + dependencies.commandWaitMilliseconds),
    );
    return {
      kind: "result",
      result: completed ? replay(completed) : { ok: false, code: "command_in_progress" },
    };
  }
  return { kind: "ready", conversation, leaseToken: claim.leaseToken };
}

async function completeCommand(
  dependencies: ConversationServiceDependencies,
  input: {
    kind: "message" | "handoff" | "locale" | "close";
    previous: PublicChatConversation;
    next: PublicChatConversation;
    idempotencyKey: string;
    leaseToken: string;
    result: ChatCommandResult;
  },
): Promise<ChatCommandResult> {
  const outcome = await dependencies.repository.completeCommand({
    kind: input.kind,
    conversation: input.next,
    expectedVersion: input.previous.version,
    idempotencyKey: input.idempotencyKey,
    leaseToken: input.leaseToken,
    result: input.result,
  });
  return outcome === "completed" ? input.result : { ok: false, code: "conflict" };
}

export function createConversationService(dependencies: ConversationServiceDependencies) {
  const minimumLeaseMilliseconds =
    dependencies.providerTimeoutMilliseconds * PROVIDER_CALLS_PER_MESSAGE +
    Math.max(COMMAND_COMPLETION_MARGIN_MILLISECONDS, dependencies.commandWaitMilliseconds);
  if (dependencies.commandLeaseSeconds * 1_000 <= minimumLeaseMilliseconds) {
    throw new Error("PUBLIC_CHAT_COMMAND_LEASE_BUDGET_INVALID");
  }

  async function finishUnchanged(
    conversation: PublicChatConversation,
    leaseToken: string,
    idempotencyKey: string,
    result: ChatCommandFailure,
    kind: "message" | "handoff" | "locale" | "close",
  ): Promise<ChatCommandResult> {
    return completeCommand(dependencies, {
      kind,
      previous: conversation,
      next: conversation,
      idempotencyKey,
      leaseToken,
      result,
    });
  }

  return {
    async start(input: {
      context: PublicSessionContext;
      locale: ChatLocale;
      noticeVersion: string;
      idempotencyKey: string;
    }): Promise<ChatCommandResult> {
      const now = dependencies.clock.now();
      const startFingerprint = dependencies.commandFingerprint.digest(
        JSON.stringify(["start", input.locale, input.noticeVersion]),
      );
      const conversation: PublicChatConversation = {
        id: dependencies.ids.next("conversation"),
        version: 1,
        locale: input.locale,
        status: "new",
        sessionHash: input.context.sessionHash,
        noticeVersion: input.noticeVersion,
        correlationId: input.context.correlationId,
        startIdempotencyKey: input.idempotencyKey,
        startFingerprint,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        expiresAt: new Date(
          now.getTime() +
            Math.min(dependencies.sessionTtlSeconds, dependencies.absoluteLifetimeSeconds) * 1_000,
        ),
        messages: [],
      };
      const created = await dependencies.repository.create(conversation);
      if (created === "conflict") return { ok: false, code: "conflict" };
      if (created !== "created") {
        return { ok: true, projection: project(created.replayed), replayed: true };
      }
      await recordAuditSafely(dependencies.audit, {
        name: "chat_conversation_started",
        conversationId: conversation.id,
        correlationId: input.context.correlationId,
        version: conversation.version,
        locale: conversation.locale,
      });
      return { ok: true, projection: project(conversation), replayed: false };
    },

    async get(input: { conversationId: string; sessionHash: string }): Promise<ChatCommandResult> {
      const owned = await loadOwned(dependencies, input.conversationId, input.sessionHash);
      return owned.ok
        ? { ok: true, projection: project(owned.conversation), replayed: false }
        : owned.result;
    },

    async acceptMessage(input: {
      context: PublicSessionContext;
      conversationId: string;
      text: string;
      idempotencyKey: string;
      expectedVersion: number;
    }): Promise<ChatCommandResult> {
      const claimed = await claimCommand(dependencies, {
        ...input,
        kind: "message",
        fingerprintPayload: JSON.stringify(["message", input.text]),
      });
      if (claimed.kind === "result") return claimed.result;
      const previous = claimed.conversation;
      const finish = (result: ChatCommandFailure) =>
        finishUnchanged(previous, claimed.leaseToken, input.idempotencyKey, result, "message");

      if (previous.status === "human_active" || previous.status === "waiting_for_human") {
        return finish({ ok: false, code: "human_active" });
      }
      if (
        !(
          previous.status === "new" ||
          previous.status === "ai_active" ||
          previous.status === "returned_to_ai"
        )
      ) {
        return finish({ ok: false, code: "invalid_transition" });
      }

      if (previous.messages.length + 2 > dependencies.maxConversationMessages) {
        const now = dependencies.clock.now();
        const next = withActivity(
          { ...previous, status: "restricted", revokedAt: now },
          now,
          dependencies.sessionTtlSeconds,
          dependencies.absoluteLifetimeSeconds,
        );
        const result: ChatCommandFailure = {
          ok: false,
          code: "conversation_limit_reached",
          projection: project(next),
        };
        return completeCommand(dependencies, {
          kind: "message",
          previous,
          next,
          idempotencyKey: input.idempotencyKey,
          leaseToken: claimed.leaseToken,
          result,
        });
      }

      const moderation = await classifySafely(
        dependencies.moderation,
        { text: input.text, locale: previous.locale },
        dependencies.providerTimeoutMilliseconds,
      );
      if (moderation.decision === "unavailable") {
        return finish({ ok: false, code: "moderation_unavailable" });
      }
      if (moderation.decision === "reject") {
        const result = await finish({
          ok: false,
          code: "content_rejected",
          reason: moderation.reason,
        });
        await recordAuditSafely(dependencies.audit, {
          name: "chat_message_rejected",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: previous.version,
          locale: previous.locale,
          reason: moderation.reason,
        });
        return result;
      }
      if (moderation.decision === "clarify") {
        return finish({
          ok: false,
          code: "clarification_required",
          reason: moderation.reason,
        });
      }
      if (moderation.decision === "handoff") {
        return finish({ ok: false, code: "handoff_required", reason: moderation.reason });
      }

      const sources = await searchSafely(
        dependencies.knowledge,
        { locale: previous.locale, query: input.text },
        dependencies.providerTimeoutMilliseconds,
      );
      if (!Array.isArray(sources)) return finish({ ok: false, code: "knowledge_unavailable" });

      const response = await respondSafely(
        dependencies.model,
        { locale: previous.locale, message: input.text, sources },
        dependencies.providerTimeoutMilliseconds,
      );
      const now = dependencies.clock.now();
      const visitorMessage: PublicChatMessage = {
        id: dependencies.ids.next("message"),
        actor: "visitor",
        body: input.text,
        state: response.status === "answered" ? "accepted" : "failed",
        citations: [],
        actions: [],
        createdAt: now,
      };
      let next = appendMessage(previous, visitorMessage);

      if (response.status === "unavailable") {
        next = withActivity(
          next,
          now,
          dependencies.sessionTtlSeconds,
          dependencies.absoluteLifetimeSeconds,
        );
        const result: ChatCommandFailure = {
          ok: false,
          code: "assistant_unavailable",
          reason: normalizeModelReason(response.reason),
          projection: project(next),
        };
        return completeCommand(dependencies, {
          kind: "message",
          previous,
          next,
          idempotencyKey: input.idempotencyKey,
          leaseToken: claimed.leaseToken,
          result,
        });
      }

      const safeResponse = validateModelText(response.text);
      const outputModeration = safeResponse
        ? await classifySafely(
            dependencies.moderation,
            { text: safeResponse, locale: previous.locale },
            dependencies.providerTimeoutMilliseconds,
          )
        : { decision: "reject" as const, reason: "markup" as const };
      if (!safeResponse || outputModeration.decision !== "allow") {
        next = withActivity(
          {
            ...next,
            messages: [...previous.messages, { ...visitorMessage, state: "failed" }],
          },
          now,
          dependencies.sessionTtlSeconds,
          dependencies.absoluteLifetimeSeconds,
        );
        const result: ChatCommandFailure = {
          ok: false,
          code: "assistant_unavailable",
          reason: safeResponse ? "response_rejected" : "response_invalid",
          projection: project(next),
        };
        return completeCommand(dependencies, {
          kind: "message",
          previous,
          next,
          idempotencyKey: input.idempotencyKey,
          leaseToken: claimed.leaseToken,
          result,
        });
      }

      next = appendMessage(next, {
        id: dependencies.ids.next("message"),
        actor: "assistant",
        body: safeResponse,
        state: "answered",
        citations: sources.filter((source) =>
          response.citations.some((citation) => citation.sourceId === source.sourceId),
        ),
        actions: resolvePublicActions(response.actions, previous.locale),
        createdAt: now,
      });
      const targetStatus = previous.status === "new" ? "ai_active" : previous.status;
      if (
        targetStatus !== previous.status &&
        !canTransitionConversation(previous.status, targetStatus)
      ) {
        return finish({ ok: false, code: "invalid_transition" });
      }
      next = withActivity(
        { ...next, status: targetStatus },
        now,
        dependencies.sessionTtlSeconds,
        dependencies.absoluteLifetimeSeconds,
      );
      const result: ChatCommandSuccess = {
        ok: true,
        projection: project(next),
        replayed: false,
      };
      const completed = await completeCommand(dependencies, {
        kind: "message",
        previous,
        next,
        idempotencyKey: input.idempotencyKey,
        leaseToken: claimed.leaseToken,
        result,
      });
      if (completed.ok) {
        await recordAuditSafely(dependencies.audit, {
          name: "chat_message_accepted",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: next.version,
          locale: previous.locale,
        });
      }
      return completed;
    },

    async requestHandoff(input: {
      context: PublicSessionContext;
      conversationId: string;
      reason: HandoffReason;
      idempotencyKey: string;
      expectedVersion: number;
    }): Promise<ChatCommandResult> {
      const claimed = await claimCommand(dependencies, {
        ...input,
        kind: "handoff",
        fingerprintPayload: JSON.stringify(["handoff", input.reason]),
      });
      if (claimed.kind === "result") return claimed.result;
      const previous = claimed.conversation;
      const reason = normalizeHandoffReason(input.reason);
      if (!canTransitionConversation(previous.status, "human_requested")) {
        return finishUnchanged(
          previous,
          claimed.leaseToken,
          input.idempotencyKey,
          {
            ok: false,
            code: "invalid_transition",
          },
          "handoff",
        );
      }

      const now = dependencies.clock.now();
      const requested = withActivity(
        { ...previous, status: "human_requested", handoffReason: reason },
        now,
        dependencies.sessionTtlSeconds,
        dependencies.absoluteLifetimeSeconds,
      );
      const advanced = await dependencies.repository.advanceClaimedCommand({
        kind: "handoff",
        conversation: requested,
        expectedVersion: previous.version,
        idempotencyKey: input.idempotencyKey,
        leaseToken: claimed.leaseToken,
      });
      if (advanced === "conflict") return { ok: false, code: "conflict" };

      await recordAuditSafely(dependencies.audit, {
        name: "chat_handoff_requested",
        conversationId: previous.id,
        correlationId: input.context.correlationId,
        version: requested.version,
        locale: previous.locale,
        reason,
      });
      const receipt = await enqueueSafely(
        dependencies.handoff,
        {
          conversationId: previous.id,
          locale: previous.locale,
          reason,
          correlationId: input.context.correlationId,
          idempotencyKey: input.idempotencyKey,
        },
        dependencies.providerTimeoutMilliseconds,
      );

      if (receipt.status === "unavailable") {
        const result: ChatCommandFailure = {
          ok: false,
          code: "handoff_unavailable",
          projection: project(requested),
        };
        return completeCommand(dependencies, {
          kind: "handoff",
          previous: requested,
          next: requested,
          idempotencyKey: input.idempotencyKey,
          leaseToken: claimed.leaseToken,
          result,
        });
      }

      if (!canTransitionConversation(requested.status, "waiting_for_human")) {
        return completeCommand(dependencies, {
          kind: "handoff",
          previous: requested,
          next: requested,
          idempotencyKey: input.idempotencyKey,
          leaseToken: claimed.leaseToken,
          result: { ok: false, code: "invalid_transition" },
        });
      }
      const waiting = withActivity(
        {
          ...requested,
          status: "waiting_for_human",
          handoffReceiptId: receipt.receiptId,
          handoffQueuedAt: receipt.queuedAt,
        },
        dependencies.clock.now(),
        dependencies.sessionTtlSeconds,
        dependencies.absoluteLifetimeSeconds,
      );
      const result: ChatCommandSuccess = {
        ok: true,
        projection: project(waiting),
        replayed: false,
      };
      const completed = await completeCommand(dependencies, {
        kind: "handoff",
        previous: requested,
        next: waiting,
        idempotencyKey: input.idempotencyKey,
        leaseToken: claimed.leaseToken,
        result,
      });
      if (completed.ok) {
        await recordAuditSafely(dependencies.audit, {
          name: "chat_handoff_queued",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: waiting.version,
          locale: previous.locale,
          reason,
        });
      }
      return completed;
    },

    async changeLocale(input: {
      context: PublicSessionContext;
      conversationId: string;
      locale: ChatLocale;
      idempotencyKey: string;
      expectedVersion: number;
    }): Promise<ChatCommandResult> {
      const claimed = await claimCommand(dependencies, {
        ...input,
        kind: "locale",
        fingerprintPayload: JSON.stringify(["locale", input.locale]),
      });
      if (claimed.kind === "result") return claimed.result;
      const previous = claimed.conversation;
      if (
        previous.status === "closed" ||
        previous.status === "expired" ||
        previous.status === "restricted"
      ) {
        return finishUnchanged(
          previous,
          claimed.leaseToken,
          input.idempotencyKey,
          {
            ok: false,
            code: "invalid_transition",
          },
          "locale",
        );
      }
      const now = dependencies.clock.now();
      const next =
        previous.locale === input.locale
          ? previous
          : withActivity(
              { ...previous, locale: input.locale },
              now,
              dependencies.sessionTtlSeconds,
              dependencies.absoluteLifetimeSeconds,
            );
      const result: ChatCommandSuccess = {
        ok: true,
        projection: project(next),
        replayed: false,
      };
      const completed = await completeCommand(dependencies, {
        kind: "locale",
        previous,
        next,
        idempotencyKey: input.idempotencyKey,
        leaseToken: claimed.leaseToken,
        result,
      });
      if (completed.ok && previous.locale !== input.locale) {
        await recordAuditSafely(dependencies.audit, {
          name: "chat_locale_changed",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: next.version,
          locale: next.locale,
        });
      }
      return completed;
    },

    async close(input: {
      context: PublicSessionContext;
      conversationId: string;
      idempotencyKey: string;
      expectedVersion: number;
    }): Promise<ChatCommandResult> {
      const claimed = await claimCommand(dependencies, {
        ...input,
        kind: "close",
        fingerprintPayload: JSON.stringify(["close"]),
      });
      if (claimed.kind === "result") return claimed.result;
      const previous = claimed.conversation;
      if (!canTransitionConversation(previous.status, "closed")) {
        return finishUnchanged(
          previous,
          claimed.leaseToken,
          input.idempotencyKey,
          {
            ok: false,
            code: "invalid_transition",
          },
          "close",
        );
      }
      const now = dependencies.clock.now();
      const next = withActivity(
        { ...previous, status: "closed", closedAt: now, revokedAt: now },
        now,
        dependencies.sessionTtlSeconds,
        dependencies.absoluteLifetimeSeconds,
      );
      const result: ChatCommandSuccess = {
        ok: true,
        projection: project(next),
        replayed: false,
      };
      const completed = await completeCommand(dependencies, {
        kind: "close",
        previous,
        next,
        idempotencyKey: input.idempotencyKey,
        leaseToken: claimed.leaseToken,
        result,
      });
      if (completed.ok) {
        await recordAuditSafely(dependencies.audit, {
          name: "chat_conversation_closed",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: next.version,
          locale: previous.locale,
        });
      }
      return completed;
    },
  };
}
