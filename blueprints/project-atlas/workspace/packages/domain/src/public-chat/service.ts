import type {
  AuditPort,
  ChatCommandFailure,
  ChatCommandResult,
  ChatCommandSuccess,
  ChatLocale,
  Clock,
  ConversationRepository,
  IdFactory,
  PublicChatConversation,
  PublicChatMessage,
  PublicChatProjection,
  PublicCitation,
  PublicSessionContext,
} from "./contracts.ts";
import type {
  ChatModelProvider,
  HandoffResult,
  HumanHandoffPort,
  ModelResponse,
  ModerationProvider,
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
  sessionTtlSeconds: number;
};

type OwnedConversationResult =
  | { ok: true; conversation: PublicChatConversation }
  | { ok: false; result: ChatCommandFailure };

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

function withVersion(conversation: PublicChatConversation, now: Date): PublicChatConversation {
  return {
    ...conversation,
    version: conversation.version + 1,
    updatedAt: now,
    lastActivityAt: now,
  };
}

async function classifySafely(
  provider: ModerationProvider,
  input: { text: string; locale: ChatLocale },
): Promise<ModerationResult> {
  try {
    return await provider.classify(input);
  } catch {
    return { decision: "unavailable" };
  }
}

async function searchSafely(
  provider: PublicKnowledgeProvider,
  input: { locale: ChatLocale; query: string },
) {
  try {
    return await provider.search(input);
  } catch {
    return { status: "unavailable" } as const;
  }
}

async function respondSafely(
  provider: ChatModelProvider,
  input: { locale: ChatLocale; message: string; sources: PublicCitation[] },
): Promise<ModelResponse> {
  try {
    return await provider.respond(input);
  } catch {
    return { status: "unavailable", reason: "provider_error" };
  }
}

async function enqueueSafely(
  provider: HumanHandoffPort,
  input: Parameters<HumanHandoffPort["enqueue"]>[0],
): Promise<HandoffResult> {
  try {
    return await provider.enqueue(input);
  } catch {
    return { status: "unavailable" };
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

async function replayOrLoad(
  dependencies: ConversationServiceDependencies,
  input: {
    context: PublicSessionContext;
    conversationId: string;
    idempotencyKey: string;
    expectedVersion: number;
  },
): Promise<
  | { kind: "ready"; conversation: PublicChatConversation }
  | { kind: "result"; result: ChatCommandResult }
> {
  const conversation = await dependencies.repository.findOwned(
    input.conversationId,
    input.context.sessionHash,
  );
  if (!conversation) return { kind: "result", result: { ok: false, code: "not_found" } };

  const prior = await dependencies.repository.findCommandResult(
    input.conversationId,
    input.idempotencyKey,
  );
  if (prior) {
    return {
      kind: "result",
      result: prior.ok ? { ...prior, replayed: true } : prior,
    };
  }
  if (conversation.revokedAt) return { kind: "result", result: { ok: false, code: "revoked" } };
  if (conversation.expiresAt.getTime() <= dependencies.clock.now().getTime()) {
    return { kind: "result", result: { ok: false, code: "expired" } };
  }
  if (conversation.version !== input.expectedVersion) {
    return { kind: "result", result: { ok: false, code: "conflict" } };
  }
  return { kind: "ready", conversation };
}

async function commit(
  dependencies: ConversationServiceDependencies,
  previous: PublicChatConversation,
  next: PublicChatConversation,
  idempotencyKey: string,
  result: ChatCommandResult,
): Promise<ChatCommandResult> {
  const outcome = await dependencies.repository.commit({
    conversation: next,
    expectedVersion: previous.version,
    idempotencyKey,
    result,
  });
  return outcome === "committed" ? result : { ok: false, code: "conflict" };
}

export function createConversationService(dependencies: ConversationServiceDependencies) {
  return {
    async start(input: {
      context: PublicSessionContext;
      locale: ChatLocale;
      noticeVersion: string;
    }): Promise<ChatCommandResult> {
      const now = dependencies.clock.now();
      const conversation: PublicChatConversation = {
        id: dependencies.ids.next("conversation"),
        version: 1,
        locale: input.locale,
        status: "new",
        sessionHash: input.context.sessionHash,
        noticeVersion: input.noticeVersion,
        correlationId: input.context.correlationId,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + dependencies.sessionTtlSeconds * 1_000),
        messages: [],
      };
      await dependencies.repository.create(conversation);
      await dependencies.audit.record({
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
      const loaded = await replayOrLoad(dependencies, input);
      if (loaded.kind === "result") return loaded.result;
      const previous = loaded.conversation;
      if (previous.status === "human_active" || previous.status === "waiting_for_human") {
        return { ok: false, code: "human_active" };
      }
      if (!(["new", "ai_active", "returned_to_ai"] as const).includes(previous.status as never)) {
        return { ok: false, code: "invalid_transition" };
      }

      const moderation = await classifySafely(dependencies.moderation, {
        text: input.text,
        locale: previous.locale,
      });
      if (moderation.decision === "unavailable") {
        return { ok: false, code: "moderation_unavailable" };
      }
      if (moderation.decision === "reject") {
        await dependencies.audit.record({
          name: "chat_message_rejected",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: previous.version,
          locale: previous.locale,
          reason: moderation.reason,
        });
        return { ok: false, code: "content_rejected", reason: moderation.reason };
      }
      if (moderation.decision === "handoff") {
        return { ok: false, code: "handoff_required", reason: moderation.reason };
      }

      const sources = await searchSafely(dependencies.knowledge, {
        locale: previous.locale,
        query: input.text,
      });
      if (!Array.isArray(sources)) return { ok: false, code: "knowledge_unavailable" };

      const response = await respondSafely(dependencies.model, {
        locale: previous.locale,
        message: input.text,
        sources,
      });
      const now = dependencies.clock.now();
      let next = appendMessage(previous, {
        id: dependencies.ids.next("message"),
        actor: "visitor",
        body: input.text,
        state: response.status === "answered" ? "accepted" : "failed",
        citations: [],
        createdAt: now,
      });
      if (response.status === "unavailable") {
        next = withVersion(next, now);
        const result: ChatCommandFailure = {
          ok: false,
          code: "assistant_unavailable",
          reason: response.reason,
          projection: project(next),
        };
        return commit(dependencies, previous, next, input.idempotencyKey, result);
      }

      next = appendMessage(next, {
        id: dependencies.ids.next("message"),
        actor: "assistant",
        body: response.text,
        state: "answered",
        citations: sources.filter((source) =>
          response.citations.some((citation) => citation.sourceId === source.sourceId),
        ),
        createdAt: now,
      });
      const targetStatus = previous.status === "new" ? "ai_active" : previous.status;
      if (
        targetStatus !== previous.status &&
        !canTransitionConversation(previous.status, targetStatus)
      ) {
        return { ok: false, code: "invalid_transition" };
      }
      next = withVersion({ ...next, status: targetStatus }, now);
      const result: ChatCommandSuccess = {
        ok: true,
        projection: project(next),
        replayed: false,
      };
      const committed = await commit(dependencies, previous, next, input.idempotencyKey, result);
      if (committed.ok) {
        await dependencies.audit.record({
          name: "chat_message_accepted",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: next.version,
          locale: previous.locale,
        });
      }
      return committed;
    },

    async requestHandoff(input: {
      context: PublicSessionContext;
      conversationId: string;
      reason: string;
      idempotencyKey: string;
      expectedVersion: number;
    }): Promise<ChatCommandResult> {
      const loaded = await replayOrLoad(dependencies, input);
      if (loaded.kind === "result") return loaded.result;
      const previous = loaded.conversation;
      if (!canTransitionConversation(previous.status, "human_requested")) {
        return { ok: false, code: "invalid_transition" };
      }

      await dependencies.audit.record({
        name: "chat_handoff_requested",
        conversationId: previous.id,
        correlationId: input.context.correlationId,
        version: previous.version,
        locale: previous.locale,
        reason: input.reason,
      });
      const receipt = await enqueueSafely(dependencies.handoff, {
        conversationId: previous.id,
        locale: previous.locale,
        reason: input.reason,
        correlationId: input.context.correlationId,
        idempotencyKey: input.idempotencyKey,
      });
      const now = dependencies.clock.now();
      const status = receipt.status === "queued" ? "waiting_for_human" : "human_requested";
      let next = withVersion({ ...previous, status }, now);
      if (receipt.status === "queued") next = { ...next, handoffReceiptId: receipt.receiptId };

      const result: ChatCommandResult =
        receipt.status === "queued"
          ? { ok: true, projection: project(next), replayed: false }
          : {
              ok: false,
              code: "handoff_unavailable",
              projection: project(next),
            };
      const committed = await commit(dependencies, previous, next, input.idempotencyKey, result);
      if (committed.ok && receipt.status === "queued") {
        await dependencies.audit.record({
          name: "chat_handoff_queued",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: next.version,
          locale: previous.locale,
        });
      }
      return committed;
    },

    async close(input: {
      context: PublicSessionContext;
      conversationId: string;
      idempotencyKey: string;
      expectedVersion: number;
    }): Promise<ChatCommandResult> {
      const loaded = await replayOrLoad(dependencies, input);
      if (loaded.kind === "result") return loaded.result;
      const previous = loaded.conversation;
      if (!canTransitionConversation(previous.status, "closed")) {
        return { ok: false, code: "invalid_transition" };
      }
      const now = dependencies.clock.now();
      const next = withVersion(
        { ...previous, status: "closed", closedAt: now, revokedAt: now },
        now,
      );
      const result: ChatCommandSuccess = {
        ok: true,
        projection: project(next),
        replayed: false,
      };
      const committed = await commit(dependencies, previous, next, input.idempotencyKey, result);
      if (committed.ok) {
        await dependencies.audit.record({
          name: "chat_conversation_closed",
          conversationId: previous.id,
          correlationId: input.context.correlationId,
          version: next.version,
          locale: previous.locale,
        });
      }
      return committed;
    },
  };
}
