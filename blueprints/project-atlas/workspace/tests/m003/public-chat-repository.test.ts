import { describe, expect, it } from "vitest";
import {
  deserializePublicChatCommandResult,
  isValidPublicChatAdvanceVersion,
  isValidPublicChatCompletionVersion,
  resolvePublicChatCompletionAuditEvent,
  serializePublicChatCommandResult,
} from "../../packages/database/src/postgres-public-chat-store.ts";
import {
  createMemoryPublicChatStore,
  createPostgresConversationRepository,
} from "../../packages/database/src/public-chat-repository.ts";
import type {
  ChatCommandResult,
  PublicChatConversation,
} from "../../packages/domain/src/public-chat/index.ts";

const NOW = new Date("2026-08-12T18:00:00.000Z");
const FINGERPRINT = "a".repeat(64);

function conversation(overrides: Partial<PublicChatConversation> = {}): PublicChatConversation {
  return {
    id: "conversation_1",
    version: 1,
    locale: "es",
    status: "new",
    sessionHash: "session_hash_owner",
    noticeVersion: "notice.v1",
    correlationId: "correlation_1",
    startIdempotencyKey: "start_repository_0001",
    startFingerprint: "c".repeat(64),
    createdAt: NOW,
    updatedAt: NOW,
    lastActivityAt: NOW,
    expiresAt: new Date("2026-08-12T18:30:00.000Z"),
    messages: [],
    ...overrides,
  };
}

function repository() {
  const store = createMemoryPublicChatStore();
  return {
    store,
    repository: createPostgresConversationRepository(store, {
      transcriptPersistence: "metadata_only",
    }),
  };
}

describe("M003 Postgres repository behavior", () => {
  it("returns not-found semantics for a valid conversation owned by another session", async () => {
    const fixture = repository();
    await fixture.repository.create(conversation());

    await expect(
      fixture.repository.findOwned("conversation_1", "session_hash_other"),
    ).resolves.toBeNull();
  });

  it("claims one idempotency key and replays its completed result", async () => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      kind: "message",
      fingerprint: FINGERPRINT,
      conversationId: original.id,
      idempotencyKey: "message_key_0001",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
    });
    expect(claim.status).toBe("claimed");
    if (claim.status !== "claimed") throw new Error("Expected command claim");

    await expect(
      fixture.repository.claimCommand({
        kind: "message",
        fingerprint: FINGERPRINT,
        conversationId: original.id,
        idempotencyKey: "message_key_0001",
        expectedVersion: 1,
        leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
      }),
    ).resolves.toEqual({ status: "in_progress" });

    await expect(
      fixture.repository.claimCommand({
        kind: "close",
        fingerprint: FINGERPRINT,
        conversationId: original.id,
        idempotencyKey: "message_key_0001",
        expectedVersion: 1,
        leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
      }),
    ).resolves.toEqual({ status: "conflict" });

    await expect(
      fixture.repository.claimCommand({
        kind: "message",
        fingerprint: "b".repeat(64),
        conversationId: original.id,
        idempotencyKey: "message_key_0001",
        expectedVersion: 1,
        leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
      }),
    ).resolves.toEqual({ status: "conflict" });

    const next = conversation({ version: 2, status: "ai_active" });
    const result: ChatCommandResult = {
      ok: true,
      projection: {
        id: next.id,
        version: 2,
        locale: "es",
        status: "ai_active",
        messages: [],
        expiresAt: next.expiresAt,
      },
      replayed: false,
    };
    await expect(
      fixture.repository.completeCommand({
        kind: "message",
        conversation: next,
        expectedVersion: 1,
        idempotencyKey: "message_key_0001",
        leaseToken: claim.leaseToken,
        result,
      }),
    ).resolves.toBe("completed");
    await expect(
      fixture.repository.findCommandResult(original.id, "message_key_0001", "message", FINGERPRINT),
    ).resolves.toEqual(result);
    await expect(
      fixture.repository.findCommandResult(
        original.id,
        "message_key_0001",
        "message",
        "b".repeat(64),
      ),
    ).resolves.toBe("command_mismatch");
  });

  it("uses compare-and-swap versions and rejects stale completion without partial state", async () => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      kind: "message",
      fingerprint: FINGERPRINT,
      conversationId: original.id,
      idempotencyKey: "message_key_0002",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
    });
    if (claim.status !== "claimed") throw new Error("Expected command claim");

    await expect(
      fixture.repository.completeCommand({
        kind: "message",
        conversation: conversation({ version: 3 }),
        expectedVersion: 2,
        idempotencyKey: "message_key_0002",
        leaseToken: claim.leaseToken,
        result: { ok: false, code: "conflict" },
      }),
    ).resolves.toBe("conflict");
    expect((await fixture.repository.findOwned(original.id, original.sessionHash))?.version).toBe(
      1,
    );
  });

  it("omits transcript bodies in metadata-only mode while preserving citations and handoff receipt", async () => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      kind: "message",
      fingerprint: FINGERPRINT,
      conversationId: original.id,
      idempotencyKey: "message_key_0003",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
    });
    if (claim.status !== "claimed") throw new Error("Expected command claim");
    const next = conversation({
      version: 2,
      status: "waiting_for_human",
      handoffReceiptId: "handoff_receipt_1",
      handoffQueuedAt: new Date("2026-08-12T18:00:17.000Z"),
      messages: [
        {
          id: "message_1",
          actor: "assistant",
          body: "Confidential response body",
          state: "answered",
          createdAt: NOW,
          citations: [
            {
              sourceId: "faq_1",
              title: "Public FAQ",
              path: "/recursos/preguntas-frecuentes/faq-1/",
              locale: "es",
              summary: "Public summary",
              disclosure: "General information only.",
              sourceKind: null,
            },
          ],
          actions: [],
        },
      ],
    });

    await fixture.repository.completeCommand({
      kind: "handoff",
      conversation: next,
      expectedVersion: 1,
      idempotencyKey: "message_key_0003",
      leaseToken: claim.leaseToken,
      result: { ok: false, code: "handoff_unavailable" },
    });

    expect(fixture.store.messages[0]?.body).toBeNull();
    expect(fixture.store.citations[0]?.sourceId).toBe("faq_1");
    expect(fixture.store.handoffs[0]?.receiptId).toBe("handoff_receipt_1");
    expect(fixture.store.handoffs[0]?.queuedAt).toEqual(new Date("2026-08-12T18:00:17.000Z"));
    expect(JSON.stringify(fixture.store)).not.toContain("Confidential response body");
  });

  it("retains normalized metadata while durable message bodies remain absent", async () => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      kind: "message",
      fingerprint: FINGERPRINT,
      conversationId: original.id,
      idempotencyKey: "message_key_first",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T23:59:00.000Z"),
    });
    if (claim.status !== "claimed") throw new Error("Expected claim");
    const next = conversation({
      version: 2,
      status: "ai_active",
      messages: [
        {
          id: "message_first",
          actor: "assistant",
          body: "Sensitive first transcript",
          state: "answered",
          actions: [{ key: "help_center", path: "/recursos/" }],
          citations: [
            {
              sourceId: "source_first",
              title: "First",
              path: "/recursos/guias/first/",
              locale: "es",
              summary: "Summary",
              disclosure: "Educational only",
              sourceKind: null,
            },
          ],
          createdAt: NOW,
        },
      ],
    });
    await fixture.repository.completeCommand({
      kind: "message",
      fingerprint: FINGERPRINT,
      conversation: next,
      expectedVersion: 1,
      idempotencyKey: "message_key_first",
      leaseToken: claim.leaseToken,
      result: { ok: false, code: "conflict" },
    });

    const reloaded = await fixture.repository.findOwned(next.id, next.sessionHash);
    expect(reloaded?.messages).toEqual([
      expect.objectContaining({
        id: "message_first",
        body: null,
        actions: [{ key: "help_center", path: "/recursos/" }],
        citations: [expect.objectContaining({ sourceId: "source_first" })],
      }),
    ]);
    expect(JSON.stringify(fixture.store.messages)).not.toContain("Sensitive first transcript");
  });

  it("persists a restricted conversation revocation while retaining idempotent replay", async () => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      kind: "message",
      fingerprint: FINGERPRINT,
      conversationId: original.id,
      idempotencyKey: "message_limit_repository",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
    });
    if (claim.status !== "claimed") throw new Error("Expected command claim");
    const restricted = conversation({ version: 2, status: "restricted", revokedAt: NOW });
    const result: ChatCommandResult = {
      ok: false,
      code: "conversation_limit_reached",
      projection: {
        id: restricted.id,
        version: restricted.version,
        locale: restricted.locale,
        status: restricted.status,
        messages: [],
        expiresAt: restricted.expiresAt,
      },
    };
    await expect(
      fixture.repository.completeCommand({
        kind: "message",
        conversation: restricted,
        expectedVersion: 1,
        idempotencyKey: "message_limit_repository",
        leaseToken: claim.leaseToken,
        result,
      }),
    ).resolves.toBe("completed");
    expect(
      (await fixture.repository.findOwned(original.id, original.sessionHash))?.revokedAt,
    ).toEqual(NOW);
    expect(
      await fixture.repository.findCommandResult(
        original.id,
        "message_limit_repository",
        "message",
        FINGERPRINT,
      ),
    ).toEqual(result);
  });

  it.each([
    "visitor_requested",
    "complaint",
    "safety",
    "policy_required",
    "assistant_unavailable",
  ] as const)("persists the exact bounded handoff reason %s", async (reason) => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      kind: "handoff",
      fingerprint: FINGERPRINT,
      conversationId: original.id,
      idempotencyKey: `handoff_${reason}`,
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T23:59:00.000Z"),
    });
    if (claim.status !== "claimed") throw new Error("Expected claim");
    const requested = conversation({
      version: 2,
      status: "human_requested",
      handoffReason: reason,
    });
    await fixture.repository.advanceClaimedCommand({
      kind: "handoff",
      conversation: requested,
      expectedVersion: 1,
      idempotencyKey: `handoff_${reason}`,
      leaseToken: claim.leaseToken,
    });
    expect(fixture.store.handoffs).toEqual([expect.objectContaining({ reason })]);
  });

  it("round-trips versioned JSON results and fails closed on corrupted shapes", () => {
    const result: ChatCommandResult = {
      ok: true,
      replayed: false,
      projection: {
        id: "conversation_1",
        version: 2,
        locale: "es",
        status: "ai_active",
        messages: [
          {
            id: "message_1",
            actor: "assistant",
            body: "Sensitive transcript",
            state: "answered",
            actions: [],
            citations: [],
            createdAt: NOW,
          },
        ],
        expiresAt: new Date("2026-08-12T23:00:00.000Z"),
      },
    };
    const serialized = serializePublicChatCommandResult(result, "metadata_only");
    const json = JSON.parse(JSON.stringify(serialized)) as unknown;
    expect(JSON.stringify(json)).not.toContain("Sensitive transcript");
    const decoded = deserializePublicChatCommandResult(json);
    expect(decoded.ok && decoded.projection.expiresAt).toBeInstanceOf(Date);
    expect(decoded.ok && decoded.projection.messages[0]?.createdAt).toBeInstanceOf(Date);
    expect(() =>
      deserializePublicChatCommandResult({ schemaVersion: 1, result: { ok: true } }),
    ).toThrowError("PUBLIC_CHAT_COMMAND_RESULT_INVALID");
  });

  it("requires exactly one version advance while completion permits unchanged failure results", () => {
    const base = conversation({ version: 2 });
    const command = {
      kind: "message" as const,
      conversation: base,
      expectedVersion: 1,
      idempotencyKey: "message_key_version",
      leaseToken: "lease",
      result: { ok: false, code: "conflict" } as const,
    };
    expect(isValidPublicChatAdvanceVersion(1, command)).toBe(true);
    expect(
      isValidPublicChatAdvanceVersion(1, {
        ...command,
        conversation: conversation({ version: 1 }),
      }),
    ).toBe(false);
    expect(
      isValidPublicChatAdvanceVersion(1, {
        ...command,
        conversation: conversation({ version: 3 }),
      }),
    ).toBe(false);
    expect(isValidPublicChatCompletionVersion(1, command)).toBe(true);
    expect(
      isValidPublicChatCompletionVersion(1, {
        ...command,
        conversation: conversation({ version: 1 }),
        result: { ok: false, code: "conflict" },
      }),
    ).toBe(true);
  });

  it("classifies a changed locale as a durable locale audit event and omits a no-op", () => {
    const changed = conversation({ version: 2, locale: "en" });
    const result: ChatCommandResult = {
      ok: true,
      replayed: false,
      projection: {
        id: changed.id,
        version: changed.version,
        locale: changed.locale,
        status: changed.status,
        messages: [],
        expiresAt: changed.expiresAt,
      },
    };
    expect(
      resolvePublicChatCompletionAuditEvent({
        kind: "locale",
        conversation: changed,
        expectedVersion: 1,
        idempotencyKey: "locale_key_changed",
        leaseToken: "lease_locale_changed",
        result,
      }),
    ).toEqual({ eventName: "chat_locale_changed" });
    expect(
      resolvePublicChatCompletionAuditEvent({
        kind: "locale",
        conversation: conversation({ version: 1 }),
        expectedVersion: 1,
        idempotencyKey: "locale_key_unchanged",
        leaseToken: "lease_locale_unchanged",
        result: {
          ...result,
          projection: { ...result.projection, version: 1, locale: "es" },
        },
      }),
    ).toBeNull();
  });
});
