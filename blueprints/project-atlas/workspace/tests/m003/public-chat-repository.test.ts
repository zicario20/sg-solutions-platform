import { describe, expect, it } from "vitest";
import {
  createMemoryPublicChatStore,
  createPostgresConversationRepository,
} from "../../packages/database/src/public-chat-repository.ts";
import type {
  ChatCommandResult,
  PublicChatConversation,
} from "../../packages/domain/src/public-chat/index.ts";

const NOW = new Date("2026-08-12T18:00:00.000Z");

function conversation(overrides: Partial<PublicChatConversation> = {}): PublicChatConversation {
  return {
    id: "conversation_1",
    version: 1,
    locale: "es",
    status: "new",
    sessionHash: "session_hash_owner",
    noticeVersion: "notice.v1",
    correlationId: "correlation_1",
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
      conversationId: original.id,
      idempotencyKey: "message_key_0001",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
    });
    expect(claim.status).toBe("claimed");
    if (claim.status !== "claimed") throw new Error("Expected command claim");

    await expect(
      fixture.repository.claimCommand({
        conversationId: original.id,
        idempotencyKey: "message_key_0001",
        expectedVersion: 1,
        leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
      }),
    ).resolves.toEqual({ status: "in_progress" });

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
        conversation: next,
        expectedVersion: 1,
        idempotencyKey: "message_key_0001",
        leaseToken: claim.leaseToken,
        result,
      }),
    ).resolves.toBe("completed");
    await expect(
      fixture.repository.findCommandResult(original.id, "message_key_0001"),
    ).resolves.toEqual(result);
  });

  it("uses compare-and-swap versions and rejects stale completion without partial state", async () => {
    const fixture = repository();
    const original = conversation();
    await fixture.repository.create(original);
    const claim = await fixture.repository.claimCommand({
      conversationId: original.id,
      idempotencyKey: "message_key_0002",
      expectedVersion: 1,
      leaseExpiresAt: new Date("2026-08-12T18:00:30.000Z"),
    });
    if (claim.status !== "claimed") throw new Error("Expected command claim");

    await expect(
      fixture.repository.completeCommand({
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
      conversation: next,
      expectedVersion: 1,
      idempotencyKey: "message_key_0003",
      leaseToken: claim.leaseToken,
      result: { ok: false, code: "handoff_unavailable" },
    });

    expect(fixture.store.messages[0]?.body).toBeNull();
    expect(fixture.store.citations[0]?.sourceId).toBe("faq_1");
    expect(fixture.store.handoffs[0]?.receiptId).toBe("handoff_receipt_1");
    expect(JSON.stringify(fixture.store)).not.toContain("Confidential response body");
  });
});
