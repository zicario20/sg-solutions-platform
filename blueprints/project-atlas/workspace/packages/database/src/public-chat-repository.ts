import type {
  ChatCommandResult,
  ClaimedCommandAdvance,
  CommandCompletion,
  CommandReservation,
  ConversationRepository,
  PublicChatAction,
  PublicChatConversation,
} from "@atlas/domain";

export type TranscriptPersistence = "metadata_only" | "approved";

type StoredCommand = {
  conversationId: string;
  idempotencyKey: string;
  state: "in_progress" | "completed";
  expectedVersion: number;
  leaseTokenHash: string;
  leaseExpiresAt: Date;
  result: ChatCommandResult | null;
  waiters: Array<(result: ChatCommandResult | null) => void>;
};

export type StoredMessageRow = {
  id: string;
  conversationId: string;
  ordinal: number;
  actor: string;
  state: string;
  body: string | null;
  bodyStored: boolean;
  actions: PublicChatAction[];
  createdAt: Date;
};

export type StoredCitationRow = {
  id: string;
  messageId: string;
  sourceId: string;
  title: string;
  path: string;
  locale: string;
  summary: string;
  disclosure: string;
  sourceKind: "provider" | null;
};

export type StoredHandoffRow = {
  id: string;
  conversationId: string;
  status: string;
  reason: string;
  receiptId: string | null;
  requestedAt: Date;
  queuedAt: Date | null;
  updatedAt: Date;
};

export interface PublicChatTransactionalStore {
  createConversation(conversation: PublicChatConversation): Promise<void>;
  findOwnedConversation(
    conversationId: string,
    sessionHash: string,
  ): Promise<PublicChatConversation | null>;
  findCommandResult(
    conversationId: string,
    idempotencyKey: string,
  ): Promise<ChatCommandResult | null>;
  claimCommand(
    command: CommandReservation,
    leaseToken: string,
    leaseTokenHash: string,
  ): Promise<
    | { status: "claimed" }
    | { status: "completed"; result: ChatCommandResult }
    | { status: "in_progress" }
    | { status: "conflict" }
  >;
  waitForCommandResult(
    conversationId: string,
    idempotencyKey: string,
    waitUntil: Date,
  ): Promise<ChatCommandResult | null>;
  advanceCommand(
    command: ClaimedCommandAdvance,
    leaseTokenHash: string,
    transcriptPersistence: TranscriptPersistence,
  ): Promise<"advanced" | "conflict">;
  completeCommand(
    command: CommandCompletion,
    leaseTokenHash: string,
    transcriptPersistence: TranscriptPersistence,
  ): Promise<"completed" | "conflict">;
}

export type MemoryPublicChatStore = PublicChatTransactionalStore & {
  readonly conversations: Map<string, PublicChatConversation>;
  readonly commands: Map<string, StoredCommand>;
  readonly messages: StoredMessageRow[];
  readonly citations: StoredCitationRow[];
  readonly handoffs: StoredHandoffRow[];
};

function commandKey(conversationId: string, idempotencyKey: string): string {
  return `${conversationId}:${idempotencyKey}`;
}

function cloneConversation(conversation: PublicChatConversation): PublicChatConversation {
  return structuredClone(conversation);
}

function durableConversation(
  conversation: PublicChatConversation,
  transcriptPersistence: TranscriptPersistence,
): PublicChatConversation {
  const cloned = cloneConversation(conversation);
  if (transcriptPersistence === "metadata_only") {
    cloned.messages = cloned.messages.map((message) => ({ ...message, body: null }));
  }
  return cloned;
}

function normalizeRows(
  store: Pick<MemoryPublicChatStore, "messages" | "citations" | "handoffs">,
  conversation: PublicChatConversation,
  transcriptPersistence: TranscriptPersistence,
): void {
  const removedMessageIds = new Set(
    store.messages
      .filter((message) => message.conversationId === conversation.id)
      .map((message) => message.id),
  );
  store.messages.splice(
    0,
    store.messages.length,
    ...store.messages.filter((row) => row.conversationId !== conversation.id),
  );
  store.citations.splice(
    0,
    store.citations.length,
    ...store.citations.filter((row) => !removedMessageIds.has(row.messageId)),
  );

  conversation.messages.forEach((message, ordinal) => {
    const bodyStored = transcriptPersistence === "approved";
    store.messages.push({
      id: message.id,
      conversationId: conversation.id,
      ordinal,
      actor: message.actor,
      state: message.state,
      body: bodyStored ? message.body : null,
      bodyStored,
      actions: structuredClone(message.actions),
      createdAt: message.createdAt,
    });
    for (const citation of message.citations) {
      store.citations.push({
        id: `${message.id}:${citation.sourceId}`,
        messageId: message.id,
        sourceId: citation.sourceId,
        title: citation.title,
        path: citation.path,
        locale: citation.locale,
        summary: citation.summary,
        disclosure: citation.disclosure,
        sourceKind: citation.sourceKind,
      });
    }
  });

  store.handoffs.splice(
    0,
    store.handoffs.length,
    ...store.handoffs.filter((row) => row.conversationId !== conversation.id),
  );
  if (conversation.status === "human_requested" || conversation.status === "waiting_for_human") {
    store.handoffs.push({
      id: `handoff:${conversation.id}`,
      conversationId: conversation.id,
      status: conversation.status,
      reason: conversation.handoffReason ?? "policy_required",
      receiptId: conversation.handoffReceiptId ?? null,
      requestedAt: conversation.updatedAt,
      queuedAt: conversation.handoffReceiptId ? conversation.updatedAt : null,
      updatedAt: conversation.updatedAt,
    });
  }
}

export function createMemoryPublicChatStore(): MemoryPublicChatStore {
  const conversations = new Map<string, PublicChatConversation>();
  const commands = new Map<string, StoredCommand>();
  const messages: StoredMessageRow[] = [];
  const citations: StoredCitationRow[] = [];
  const handoffs: StoredHandoffRow[] = [];

  return {
    conversations,
    commands,
    messages,
    citations,
    handoffs,

    async createConversation(conversation) {
      if (conversations.has(conversation.id)) throw new Error("CONVERSATION_ALREADY_EXISTS");
      conversations.set(conversation.id, cloneConversation(conversation));
    },

    async findOwnedConversation(conversationId, sessionHash) {
      const conversation = conversations.get(conversationId);
      return conversation?.sessionHash === sessionHash ? cloneConversation(conversation) : null;
    },

    async findCommandResult(conversationId, idempotencyKey) {
      const command = commands.get(commandKey(conversationId, idempotencyKey));
      return command?.state === "completed" && command.result
        ? structuredClone(command.result)
        : null;
    },

    async claimCommand(command, _leaseToken, leaseTokenHash) {
      const key = commandKey(command.conversationId, command.idempotencyKey);
      const existing = commands.get(key);
      if (existing?.state === "completed" && existing.result) {
        return { status: "completed", result: structuredClone(existing.result) };
      }
      if (existing) return { status: "in_progress" };
      const conversation = conversations.get(command.conversationId);
      if (!conversation || conversation.version !== command.expectedVersion) {
        return { status: "conflict" };
      }
      commands.set(key, {
        conversationId: command.conversationId,
        idempotencyKey: command.idempotencyKey,
        state: "in_progress",
        expectedVersion: command.expectedVersion,
        leaseTokenHash,
        leaseExpiresAt: command.leaseExpiresAt,
        result: null,
        waiters: [],
      });
      return { status: "claimed" };
    },

    async waitForCommandResult(conversationId, idempotencyKey, waitUntil) {
      const command = commands.get(commandKey(conversationId, idempotencyKey));
      if (!command) return null;
      if (command.state === "completed" && command.result) return structuredClone(command.result);
      const remaining = Math.max(0, waitUntil.getTime() - Date.now());
      return new Promise<ChatCommandResult | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), remaining);
        command.waiters.push((result) => {
          clearTimeout(timeout);
          resolve(result ? structuredClone(result) : null);
        });
      });
    },

    async advanceCommand(command, leaseTokenHash, transcriptPersistence) {
      const stored = commands.get(commandKey(command.conversation.id, command.idempotencyKey));
      const current = conversations.get(command.conversation.id);
      if (
        stored?.state !== "in_progress" ||
        stored.leaseTokenHash !== leaseTokenHash ||
        stored.expectedVersion !== command.expectedVersion ||
        !current ||
        current.version !== command.expectedVersion ||
        command.conversation.version !== command.expectedVersion + 1
      ) {
        return "conflict";
      }
      conversations.set(
        command.conversation.id,
        durableConversation(command.conversation, transcriptPersistence),
      );
      stored.expectedVersion = command.conversation.version;
      normalizeRows({ messages, citations, handoffs }, command.conversation, transcriptPersistence);
      return "advanced";
    },

    async completeCommand(command, leaseTokenHash, transcriptPersistence) {
      const key = commandKey(command.conversation.id, command.idempotencyKey);
      const stored = commands.get(key);
      const current = conversations.get(command.conversation.id);
      const versionIsUnchanged = command.conversation.version === command.expectedVersion;
      const versionAdvancedOne = command.conversation.version === command.expectedVersion + 1;
      if (
        stored?.state !== "in_progress" ||
        stored.leaseTokenHash !== leaseTokenHash ||
        stored.expectedVersion !== command.expectedVersion ||
        !current ||
        current.version !== command.expectedVersion ||
        (!versionIsUnchanged && !versionAdvancedOne)
      ) {
        return "conflict";
      }
      conversations.set(
        command.conversation.id,
        durableConversation(command.conversation, transcriptPersistence),
      );
      normalizeRows({ messages, citations, handoffs }, command.conversation, transcriptPersistence);
      stored.state = "completed";
      stored.result = structuredClone(command.result);
      for (const waiter of stored.waiters) waiter(stored.result);
      stored.waiters.length = 0;
      return "completed";
    },
  };
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createLeaseToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createPostgresConversationRepository(
  store: PublicChatTransactionalStore,
  options: { transcriptPersistence: TranscriptPersistence },
): ConversationRepository {
  return {
    create: (conversation) => store.createConversation(cloneConversation(conversation)),
    findOwned: (conversationId, sessionHash) =>
      store.findOwnedConversation(conversationId, sessionHash),
    findCommandResult: (conversationId, idempotencyKey) =>
      store.findCommandResult(conversationId, idempotencyKey),

    async claimCommand(command) {
      const leaseToken = createLeaseToken();
      const leaseTokenHash = await sha256(leaseToken);
      const claimed = await store.claimCommand(command, leaseToken, leaseTokenHash);
      return claimed.status === "claimed" ? { status: "claimed", leaseToken } : claimed;
    },

    waitForCommandResult: (conversationId, idempotencyKey, waitUntil) =>
      store.waitForCommandResult(conversationId, idempotencyKey, waitUntil),

    async advanceClaimedCommand(command) {
      return store.advanceCommand(
        command,
        await sha256(command.leaseToken),
        options.transcriptPersistence,
      );
    },

    async completeCommand(command) {
      return store.completeCommand(
        command,
        await sha256(command.leaseToken),
        options.transcriptPersistence,
      );
    },
  };
}
