import { describe, expect, it } from "vitest";
import {
  type AuditEvent,
  type ChatCommandResult,
  type ChatModelProvider,
  type ClaimedCommandAdvance,
  type CommandCompletion,
  type CommandReservation,
  type ConversationRepository,
  canTransitionConversation,
  createConversationService,
  type HumanHandoffPort,
  type ModerationProvider,
  type PublicChatConversation,
  type PublicKnowledgeProvider,
} from "../../packages/domain/src/public-chat/index.ts";

const NOW = new Date("2026-08-12T18:00:00.000Z");

class MemoryConversationRepository implements ConversationRepository {
  readonly records = new Map<string, PublicChatConversation>();
  readonly results = new Map<string, ChatCommandResult>();
  readonly reservations = new Map<
    string,
    { leaseToken: string; waiters: Array<(result: ChatCommandResult) => void> }
  >();
  readonly statusWrites: Array<{ status: string; version: number }> = [];
  commitCount = 0;

  async create(conversation: PublicChatConversation): Promise<void> {
    this.records.set(conversation.id, structuredClone(conversation));
  }

  async findOwned(
    conversationId: string,
    sessionHash: string,
  ): Promise<PublicChatConversation | null> {
    const value = this.records.get(conversationId);
    return value?.sessionHash === sessionHash ? structuredClone(value) : null;
  }

  async findCommandResult(
    conversationId: string,
    idempotencyKey: string,
  ): Promise<ChatCommandResult | null> {
    return structuredClone(this.results.get(`${conversationId}:${idempotencyKey}`) ?? null);
  }

  async claimCommand(command: CommandReservation) {
    const resultKey = `${command.conversationId}:${command.idempotencyKey}`;
    const result = this.results.get(resultKey);
    if (result) return { status: "completed", result: structuredClone(result) } as const;
    if (this.reservations.has(resultKey)) return { status: "in_progress" } as const;

    const current = this.records.get(command.conversationId);
    if (!current || current.version !== command.expectedVersion)
      return { status: "conflict" } as const;
    const leaseToken = `lease:${resultKey}`;
    this.reservations.set(resultKey, { leaseToken, waiters: [] });
    return { status: "claimed", leaseToken } as const;
  }

  async waitForCommandResult(conversationId: string, idempotencyKey: string) {
    const resultKey = `${conversationId}:${idempotencyKey}`;
    const completed = this.results.get(resultKey);
    if (completed) return structuredClone(completed);
    const reservation = this.reservations.get(resultKey);
    if (!reservation) return null;
    return new Promise<ChatCommandResult>((resolve) => reservation.waiters.push(resolve));
  }

  async advanceClaimedCommand(command: ClaimedCommandAdvance) {
    const resultKey = `${command.conversation.id}:${command.idempotencyKey}`;
    const reservation = this.reservations.get(resultKey);
    const current = this.records.get(command.conversation.id);
    if (
      !reservation ||
      reservation.leaseToken !== command.leaseToken ||
      !current ||
      current.version !== command.expectedVersion
    ) {
      return "conflict" as const;
    }
    this.commitCount += 1;
    this.records.set(command.conversation.id, structuredClone(command.conversation));
    this.statusWrites.push({
      status: command.conversation.status,
      version: command.conversation.version,
    });
    return "advanced" as const;
  }

  async completeCommand(command: CommandCompletion) {
    const resultKey = `${command.conversation.id}:${command.idempotencyKey}`;
    const reservation = this.reservations.get(resultKey);
    const current = this.records.get(command.conversation.id);
    if (
      !reservation ||
      reservation.leaseToken !== command.leaseToken ||
      !current ||
      current.version !== command.expectedVersion
    ) {
      return "conflict" as const;
    }
    this.commitCount += 1;
    this.records.set(command.conversation.id, structuredClone(command.conversation));
    this.results.set(resultKey, structuredClone(command.result));
    this.statusWrites.push({
      status: command.conversation.status,
      version: command.conversation.version,
    });
    for (const waiter of reservation.waiters) waiter(structuredClone(command.result));
    this.reservations.delete(resultKey);
    return "completed" as const;
  }
}

function createFixture(overrides?: {
  knowledge?: PublicKnowledgeProvider;
  moderation?: ModerationProvider;
  model?: ChatModelProvider;
  handoff?: HumanHandoffPort;
}) {
  const repository = new MemoryConversationRepository();
  const auditEvents: AuditEvent[] = [];
  let sequence = 0;
  let modelCalls = 0;
  let currentNow = new Date(NOW);

  const knowledge: PublicKnowledgeProvider =
    overrides?.knowledge ??
    ({
      search: async ({ locale }) => [
        {
          sourceId: "faq_public_1",
          title: locale === "es" ? "Servicios de SG Solutions" : "SG Solutions services",
          path: locale === "es" ? "/recursos" : "/en/resources",
          locale,
          summary: "Approved summary",
          disclosure: "General information only.",
          sourceKind: null,
        },
      ],
      getByIds: async () => [],
    } as const);
  const moderation: ModerationProvider =
    overrides?.moderation ?? ({ classify: async () => ({ decision: "allow" }) } as const);
  const model: ChatModelProvider =
    overrides?.model ??
    ({
      respond: async ({ locale, sources }) => {
        modelCalls += 1;
        return {
          status: "answered",
          text:
            locale === "es"
              ? "Puedo orientarte con información general."
              : "I can help with general information.",
          citations: sources,
        };
      },
    } as const);
  const handoff: HumanHandoffPort =
    overrides?.handoff ??
    ({
      enqueue: async () => ({
        status: "queued",
        receiptId: "handoff_receipt_1",
        queuedAt: NOW,
      }),
    } as const);

  const service = createConversationService({
    repository,
    knowledge,
    moderation,
    model,
    handoff,
    audit: { record: async (event) => void auditEvents.push(structuredClone(event)) },
    clock: { now: () => new Date(currentNow) },
    ids: { next: (prefix) => `${prefix}_${++sequence}` },
    sessionTtlSeconds: 1_800,
    commandLeaseSeconds: 30,
    commandWaitMilliseconds: 5_000,
  });

  return {
    service,
    repository,
    auditEvents,
    getModelCalls: () => modelCalls,
    setNow: (value: Date) => {
      currentNow = new Date(value);
    },
  };
}

function requireRecord(repository: MemoryConversationRepository, conversationId: string) {
  const record = repository.records.get(conversationId);
  if (!record) throw new Error(`Missing test conversation ${conversationId}`);
  return record;
}

async function startConversation(fixture: ReturnType<typeof createFixture>) {
  const result = await fixture.service.start({
    context: { sessionHash: "session_hash_a", correlationId: "correlation_1" },
    locale: "es",
    noticeVersion: "public-chat-notice.v1",
  });
  if (!result.ok) throw new Error(`Unexpected start failure: ${result.code}`);
  return result.projection;
}

describe("M003 conversation state machine", () => {
  it("rejects the mutation that skips the durable human-requested transition", () => {
    expect(canTransitionConversation("ai_active", "waiting_for_human")).toBe(false);
    expect(canTransitionConversation("ai_active", "human_requested")).toBe(true);
    expect(canTransitionConversation("human_requested", "waiting_for_human")).toBe(true);
  });

  it("allows active conversations to close but never reopens terminal states", () => {
    expect(canTransitionConversation("returned_to_ai", "closed")).toBe(true);
    expect(canTransitionConversation("closed", "ai_active")).toBe(false);
    expect(canTransitionConversation("expired", "closed")).toBe(false);
  });
});

describe("M003 conversation service", () => {
  it("creates a notice-bound anonymous conversation without exposing its session hash", async () => {
    const fixture = createFixture();
    const projection = await startConversation(fixture);

    expect(projection).toMatchObject({ locale: "es", status: "new", version: 1, messages: [] });
    expect(JSON.stringify(projection)).not.toContain("session_hash_a");
  });

  it("rejects a valid conversation id when the session hash belongs to another visitor", async () => {
    const fixture = createFixture();
    const projection = await startConversation(fixture);

    await expect(
      fixture.service.get({ conversationId: projection.id, sessionHash: "session_hash_other" }),
    ).resolves.toEqual({ ok: false, code: "not_found" });
  });

  it("rejects expired and revoked credentials without returning an old transcript", async () => {
    const expiredFixture = createFixture();
    const expired = await startConversation(expiredFixture);
    const expiredRecord = requireRecord(expiredFixture.repository, expired.id);
    expiredFixture.repository.records.set(expired.id, {
      ...expiredRecord,
      expiresAt: new Date(NOW.getTime() - 1),
    });
    expect(
      await expiredFixture.service.get({
        conversationId: expired.id,
        sessionHash: "session_hash_a",
      }),
    ).toEqual({ ok: false, code: "expired" });

    const revokedFixture = createFixture();
    const revoked = await startConversation(revokedFixture);
    const revokedRecord = requireRecord(revokedFixture.repository, revoked.id);
    revokedFixture.repository.records.set(revoked.id, { ...revokedRecord, revokedAt: NOW });
    expect(
      await revokedFixture.service.get({
        conversationId: revoked.id,
        sessionHash: "session_hash_a",
      }),
    ).toEqual({ ok: false, code: "revoked" });
  });

  it("stores one answer for an idempotency key and replays it without a second model call", async () => {
    const fixture = createFixture();
    const started = await startConversation(fixture);
    const command = {
      context: { sessionHash: "session_hash_a", correlationId: "correlation_2" },
      conversationId: started.id,
      text: "¿Qué servicios ofrecen?",
      idempotencyKey: "message_key_0001",
      expectedVersion: 1,
    };

    const first = await fixture.service.acceptMessage(command);
    const replay = await fixture.service.acceptMessage(command);

    expect(first.ok).toBe(true);
    expect(replay).toEqual(first.ok ? { ...first, replayed: true } : first);
    expect(fixture.getModelCalls()).toBe(1);
    expect(fixture.repository.records.get(started.id)?.messages).toHaveLength(2);
  });

  it("rejects stale optimistic versions without mutating the conversation", async () => {
    const fixture = createFixture();
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_2" },
      conversationId: started.id,
      text: "Hello",
      idempotencyKey: "message_key_0002",
      expectedVersion: 7,
    });

    expect(result).toEqual({ ok: false, code: "conflict" });
    expect(fixture.repository.commitCount).toBe(0);
    expect(fixture.getModelCalls()).toBe(0);
  });

  it("suspends automated answers while a human is active", async () => {
    const fixture = createFixture();
    const started = await startConversation(fixture);
    const record = requireRecord(fixture.repository, started.id);
    fixture.repository.records.set(started.id, { ...record, status: "human_active" });

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_3" },
      conversationId: started.id,
      text: "Are you there?",
      idempotencyKey: "message_key_0003",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "human_active" });
    expect(fixture.getModelCalls()).toBe(0);
  });

  it("does not persist, model, or audit rejected message text", async () => {
    const secret = "secret-sensitive-value";
    let observedByModel = "";
    const fixture = createFixture({
      moderation: { classify: async () => ({ decision: "reject", reason: "credential" }) },
      model: {
        respond: async ({ message }) => {
          observedByModel = message;
          return { status: "unavailable", reason: "disabled" };
        },
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_4" },
      conversationId: started.id,
      text: secret,
      idempotencyKey: "message_key_0004",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "content_rejected", reason: "credential" });
    expect(observedByModel).toBe("");
    expect(fixture.repository.records.get(started.id)?.messages).toEqual([]);
    expect(JSON.stringify(fixture.auditEvents)).not.toContain(secret);
  });

  it("fails closed when moderation is unavailable and never calls the model", async () => {
    const fixture = createFixture({
      moderation: { classify: async () => ({ decision: "unavailable" }) },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "moderation_unavailable" });
    expect(fixture.getModelCalls()).toBe(0);
    expect(requireRecord(fixture.repository, started.id).messages).toEqual([]);
  });

  it("maps an unbounded provider reason to a closed code without leaking its text", async () => {
    const sensitiveReason = "provider copied 111-22-3333 and token_secret_value";
    const fixture = createFixture({
      moderation: {
        classify: async () => ({ decision: "reject", reason: sensitiveReason }) as never,
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5a" },
      conversationId: started.id,
      text: "A normal public question",
      idempotencyKey: "message_key_0005a",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "content_rejected", reason: "unknown" });
    expect(JSON.stringify(result)).not.toContain(sensitiveReason);
    expect(JSON.stringify(fixture.auditEvents)).not.toContain(sensitiveReason);
    expect(JSON.stringify(requireRecord(fixture.repository, started.id))).not.toContain(
      sensitiveReason,
    );
  });

  it("handles clarify as a bounded deterministic action without calling the model", async () => {
    const fixture = createFixture({
      moderation: { classify: async () => ({ decision: "clarify", reason: "ambiguous" }) },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5aa" },
      conversationId: started.id,
      text: "Help",
      idempotencyKey: "message_key_0005aa",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "clarification_required", reason: "ambiguous" });
    expect(fixture.getModelCalls()).toBe(0);
  });

  it("maps a thrown moderation dependency error to a safe unavailable result", async () => {
    const fixture = createFixture({
      moderation: {
        classify: async () => {
          throw new Error("private moderation provider detail");
        },
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5b" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005b",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "moderation_unavailable" });
    expect(JSON.stringify(result)).not.toContain("private moderation provider detail");
  });

  it("fails closed when knowledge is unavailable and never calls the model", async () => {
    const fixture = createFixture({
      knowledge: {
        search: async () => ({ status: "unavailable" }),
        getByIds: async () => [],
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5c" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005c",
      expectedVersion: 1,
    });

    expect(result).toEqual({ ok: false, code: "knowledge_unavailable" });
    expect(fixture.getModelCalls()).toBe(0);
  });

  it("maps a thrown model error to a safe failed response and one durable visitor message", async () => {
    const fixture = createFixture({
      model: {
        respond: async () => {
          throw new Error("private model provider detail");
        },
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5d" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005d",
      expectedVersion: 1,
    });

    expect(result).toMatchObject({ ok: false, code: "assistant_unavailable" });
    expect(JSON.stringify(result)).not.toContain("private model provider detail");
    expect(requireRecord(fixture.repository, started.id).messages).toHaveLength(1);
  });

  it("does not publish a model citation that was not resolved by public knowledge", async () => {
    const fixture = createFixture({
      model: {
        respond: async () => ({
          status: "answered",
          text: "General orientation",
          citations: [
            {
              sourceId: "fabricated",
              title: "Fabricated source",
              path: "https://attacker.example/",
              locale: "es",
              summary: "Fabricated summary",
              disclosure: "Fabricated disclosure",
              sourceKind: null,
            },
          ],
        }),
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5e" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005e",
      expectedVersion: 1,
    });

    expect(result.ok && result.projection.messages[1]?.citations).toEqual([]);
    expect(JSON.stringify(result)).not.toContain("attacker.example");
  });

  it("re-resolves model action paths and ignores malformed action entries", async () => {
    const fixture = createFixture({
      model: {
        respond: async ({ sources }) => ({
          status: "answered",
          text: "General orientation",
          citations: sources,
          actions: [null as never, { key: "help_center", path: "https://attacker.example/" }],
        }),
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5ea" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005ea",
      expectedVersion: 1,
    });

    expect(result.ok && result.projection.messages[1]?.actions).toEqual([
      { key: "help_center", path: "/recursos/" },
    ]);
    expect(JSON.stringify(result)).not.toContain("attacker.example");
  });

  it.each([
    { label: "markup", text: "<script>unsafe()</script>" },
    { label: "control character", text: "unsafe\u0085response" },
    { label: "oversized text", text: "a".repeat(4_001) },
  ])("fails closed before persisting a model response containing $label", async ({ text }) => {
    const fixture = createFixture({
      model: {
        respond: async () => ({ status: "answered", text, citations: [] }),
      },
    });
    const started = await startConversation(fixture);

    const result = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5f" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: `message_key_0005f_${text.length}`,
      expectedVersion: 1,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "assistant_unavailable",
      reason: "response_invalid",
    });
    expect(JSON.stringify(requireRecord(fixture.repository, started.id))).not.toContain(text);
  });

  it("renews expiry from the last confirmed activity instead of using an absolute start deadline", async () => {
    const fixture = createFixture();
    const started = await startConversation(fixture);
    fixture.setNow(new Date("2026-08-12T18:29:00.000Z"));

    const accepted = await fixture.service.acceptMessage({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_5g" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_key_0005g",
      expectedVersion: 1,
    });
    expect(accepted.ok && accepted.projection.expiresAt.toISOString()).toBe(
      "2026-08-12T18:59:00.000Z",
    );

    fixture.setNow(new Date("2026-08-12T18:31:00.000Z"));
    expect(
      (await fixture.service.get({ conversationId: started.id, sessionHash: "session_hash_a" })).ok,
    ).toBe(true);
    fixture.setNow(new Date("2026-08-12T19:00:00.000Z"));
    expect(
      await fixture.service.get({ conversationId: started.id, sessionHash: "session_hash_a" }),
    ).toEqual({ ok: false, code: "expired" });
  });

  it("reserves an idempotency key before model work so concurrent duplicates share one result", async () => {
    let modelCalls = 0;
    let releaseModel: (() => void) | undefined;
    let announceModel: (() => void) | undefined;
    const modelStarted = new Promise<void>((resolve) => {
      announceModel = resolve;
    });
    const modelGate = new Promise<void>((resolve) => {
      releaseModel = resolve;
    });
    const fixture = createFixture({
      model: {
        respond: async ({ sources }) => {
          modelCalls += 1;
          announceModel?.();
          await modelGate;
          return { status: "answered", text: "Bounded answer", citations: sources };
        },
      },
    });
    const started = await startConversation(fixture);
    const command = {
      context: { sessionHash: "session_hash_a", correlationId: "correlation_race_1" },
      conversationId: started.id,
      text: "Can you help?",
      idempotencyKey: "message_race_key_1",
      expectedVersion: 1,
    };

    const firstPromise = fixture.service.acceptMessage(command);
    await modelStarted;
    const secondPromise = fixture.service.acceptMessage(command);
    releaseModel?.();
    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(modelCalls).toBe(1);
    expect(first.ok && first.replayed).toBe(false);
    expect(second).toEqual(first.ok ? { ...first, replayed: true } : first);
  });

  it("claims a queued handoff only after receiving a durable receipt", async () => {
    const fixture = createFixture();
    const started = await startConversation(fixture);
    const record = requireRecord(fixture.repository, started.id);
    fixture.repository.records.set(started.id, { ...record, status: "ai_active" });

    const result = await fixture.service.requestHandoff({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_6" },
      conversationId: started.id,
      reason: "visitor_requested",
      idempotencyKey: "handoff_key_0001",
      expectedVersion: 1,
    });

    expect(result.ok && result.projection.status).toBe("waiting_for_human");
    expect(fixture.repository.records.get(started.id)?.handoffReceiptId).toBe("handoff_receipt_1");
    expect(fixture.repository.statusWrites).toEqual([
      { status: "human_requested", version: 2 },
      { status: "waiting_for_human", version: 3 },
    ]);
  });

  it("keeps handoff unconfirmed when no durable receipt exists", async () => {
    const fixture = createFixture({
      handoff: { enqueue: async () => ({ status: "unavailable" }) },
    });
    const started = await startConversation(fixture);
    const record = requireRecord(fixture.repository, started.id);
    fixture.repository.records.set(started.id, { ...record, status: "ai_active" });

    const result = await fixture.service.requestHandoff({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_7" },
      conversationId: started.id,
      reason: "visitor_requested",
      idempotencyKey: "handoff_key_0002",
      expectedVersion: 1,
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "handoff_unavailable" });
    expect(fixture.repository.records.get(started.id)?.status).toBe("human_requested");
    expect(fixture.repository.records.get(started.id)?.handoffReceiptId).toBeUndefined();
  });

  it("maps a thrown handoff dependency error to an unconfirmed human request", async () => {
    const fixture = createFixture({
      handoff: {
        enqueue: async () => {
          throw new Error("private handoff provider detail");
        },
      },
    });
    const started = await startConversation(fixture);
    const record = requireRecord(fixture.repository, started.id);
    fixture.repository.records.set(started.id, { ...record, status: "ai_active" });

    const result = await fixture.service.requestHandoff({
      context: { sessionHash: "session_hash_a", correlationId: "correlation_7b" },
      conversationId: started.id,
      reason: "visitor_requested",
      idempotencyKey: "handoff_key_0003",
      expectedVersion: 1,
    });

    expect(result).toMatchObject({ ok: false, code: "handoff_unavailable" });
    expect(JSON.stringify(result)).not.toContain("private handoff provider detail");
    expect(requireRecord(fixture.repository, started.id).status).toBe("human_requested");
  });

  it("reserves an idempotency key before handoff so concurrent duplicates enqueue once", async () => {
    let handoffCalls = 0;
    let releaseHandoff: (() => void) | undefined;
    let announceHandoff: (() => void) | undefined;
    const handoffStarted = new Promise<void>((resolve) => {
      announceHandoff = resolve;
    });
    const handoffGate = new Promise<void>((resolve) => {
      releaseHandoff = resolve;
    });
    const fixture = createFixture({
      handoff: {
        enqueue: async () => {
          handoffCalls += 1;
          announceHandoff?.();
          await handoffGate;
          return { status: "queued", receiptId: "handoff_race_receipt", queuedAt: NOW };
        },
      },
    });
    const started = await startConversation(fixture);
    const record = requireRecord(fixture.repository, started.id);
    fixture.repository.records.set(started.id, { ...record, status: "ai_active" });
    const command = {
      context: { sessionHash: "session_hash_a", correlationId: "correlation_race_2" },
      conversationId: started.id,
      reason: "visitor_requested" as const,
      idempotencyKey: "handoff_race_key_1",
      expectedVersion: 1,
    };

    const firstPromise = fixture.service.requestHandoff(command);
    await handoffStarted;
    const secondPromise = fixture.service.requestHandoff(command);
    releaseHandoff?.();
    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(handoffCalls).toBe(1);
    expect(first.ok && first.replayed).toBe(false);
    expect(second).toEqual(first.ok ? { ...first, replayed: true } : first);
  });

  it("closes a conversation idempotently without adding a second transition", async () => {
    const fixture = createFixture();
    const started = await startConversation(fixture);
    const command = {
      context: { sessionHash: "session_hash_a", correlationId: "correlation_8" },
      conversationId: started.id,
      idempotencyKey: "close_key_000001",
      expectedVersion: 1,
    };

    const first = await fixture.service.close(command);
    const replay = await fixture.service.close(command);

    expect(first.ok && first.projection.status).toBe("closed");
    expect(replay).toEqual(first.ok ? { ...first, replayed: true } : first);
    expect(fixture.repository.commitCount).toBe(1);
  });
});
