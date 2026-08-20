import { afterAll, describe, expect, it } from "vitest";
import {
  createPostgresPublicChatStore,
  createPublicChatSql,
  registerPublicChatSession,
} from "../../packages/database/src/postgres-public-chat-store.ts";
import { createPostgresConversationRepository } from "../../packages/database/src/public-chat-repository.ts";
import type { PublicChatConversation } from "../../packages/domain/src/public-chat/index.ts";

const integrationUrl = process.env.M003_POSTGRES_INTEGRATION_URL;
const sql = integrationUrl ? createPublicChatSql(integrationUrl) : null;

afterAll(async () => {
  if (sql) await sql.end({ timeout: 5 });
});

describe("M003 real Postgres contract", () => {
  it.runIf(Boolean(integrationUrl))(
    "enforces the runtime role and binds idempotency keys to kind and fingerprint",
    async () => {
      if (!sql) throw new Error("M003_POSTGRES_INTEGRATION_URL_REQUIRED");
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60_000);
      const suffix = crypto.randomUUID().replaceAll("-", "");
      const sessionHash = `${"d".repeat(32)}${suffix}`;
      const sessionId = `session_${suffix}`;
      await registerPublicChatSession(sql, {
        id: sessionId,
        sessionHash,
        csrfHash: "e".repeat(64),
        correlationId: "correlation_integration_1",
        expiresAt,
        now,
      });
      const conversation: PublicChatConversation = {
        id: `conversation_${suffix}`,
        version: 1,
        locale: "es",
        status: "new",
        sessionHash,
        noticeVersion: "public-chat-notice.v1",
        correlationId: "correlation_integration_1",
        startIdempotencyKey: `start_${suffix}`,
        startFingerprint: "f".repeat(64),
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        expiresAt,
        messages: [],
      };
      const repository = createPostgresConversationRepository(createPostgresPublicChatStore(sql), {
        transcriptPersistence: "metadata_only",
      });
      await expect(repository.create(conversation)).resolves.toBe("created");

      const messageClaim = await repository.claimCommand({
        kind: "message",
        fingerprint: "1".repeat(64),
        conversationId: conversation.id,
        idempotencyKey: `command_${suffix}`,
        expectedVersion: 1,
        leaseExpiresAt: new Date(now.getTime() + 60_000),
      });
      expect(messageClaim.status).toBe("claimed");
      await expect(
        repository.claimCommand({
          kind: "close",
          fingerprint: "1".repeat(64),
          conversationId: conversation.id,
          idempotencyKey: `command_${suffix}`,
          expectedVersion: 1,
          leaseExpiresAt: new Date(now.getTime() + 60_000),
        }),
      ).resolves.toEqual({ status: "conflict" });
      await expect(
        repository.claimCommand({
          kind: "message",
          fingerprint: "2".repeat(64),
          conversationId: conversation.id,
          idempotencyKey: `command_${suffix}`,
          expectedVersion: 1,
          leaseExpiresAt: new Date(now.getTime() + 60_000),
        }),
      ).resolves.toEqual({ status: "conflict" });

      await sql.begin(async (tx) => {
        await tx.unsafe("set local role atlas_public_chat_gateway");
        await tx`
          update public_chat_sessions set revoked_at = current_timestamp,
            updated_at = current_timestamp
          where id = ${sessionId}
        `;
      });
      await expect(
        repository.claimCommand({
          kind: "message",
          fingerprint: "3".repeat(64),
          conversationId: conversation.id,
          idempotencyKey: `revoked_${suffix}`,
          expectedVersion: 1,
          leaseExpiresAt: new Date(now.getTime() + 60_000),
        }),
      ).resolves.toEqual({ status: "conflict" });
    },
  );
});
