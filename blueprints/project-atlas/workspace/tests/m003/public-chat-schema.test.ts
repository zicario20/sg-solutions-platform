import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getPublicChatTableConfig,
  publicChatAuditEvents,
  publicChatCitations,
  publicChatConversations,
  publicChatHandoffs,
  publicChatIdempotency,
  publicChatMessages,
  publicChatRateLimits,
  publicChatSessions,
} from "../../packages/database/src/schema.ts";

const TABLES = [
  publicChatSessions,
  publicChatConversations,
  publicChatMessages,
  publicChatCitations,
  publicChatHandoffs,
  publicChatIdempotency,
  publicChatAuditEvents,
];

describe("M003 Drizzle schema contract", () => {
  it("defines every required table with RLS and an opaque primary key", () => {
    for (const table of TABLES) {
      const config = getPublicChatTableConfig(table);
      expect(config.enableRLS).toBe(true);
      expect(config.columns.find((column) => column.name === "id")?.primary).toBe(true);
    }
  });

  it("stores only hashed session and CSRF credentials", () => {
    const sessionColumns = getPublicChatTableConfig(publicChatSessions).columns.map(
      (column) => column.name,
    );
    expect(sessionColumns).toEqual(
      expect.arrayContaining([
        "session_hash",
        "csrf_hash",
        "correlation_id",
        "expires_at",
        "revoked_at",
      ]),
    );
    expect(sessionColumns).not.toEqual(expect.arrayContaining(["session_token", "csrf_token"]));
  });

  it("stores only a hashed key for distributed rate-limit buckets", () => {
    const config = getPublicChatTableConfig(publicChatRateLimits);
    expect(config.enableRLS).toBe(true);
    expect(config.columns.find((column) => column.name === "bucket_hash")?.primary).toBe(true);
    expect(config.columns.map((column) => column.name)).not.toEqual(
      expect.arrayContaining(["ip", "ip_address", "session_token"]),
    );
  });

  it("exposes version, expiry, reconciliation, and nullable body columns", () => {
    const conversation = getPublicChatTableConfig(publicChatConversations);
    expect(conversation.columns.find((column) => column.name === "version")?.notNull).toBe(true);
    expect(conversation.indexes.map((index) => index.config.name)).toEqual(
      expect.arrayContaining([
        "public_chat_conversations_expiry_idx",
        "public_chat_conversations_reconciliation_idx",
      ]),
    );

    const body = getPublicChatTableConfig(publicChatMessages).columns.find(
      (column) => column.name === "body",
    );
    expect(body?.notNull).toBe(false);
  });

  it("enforces one idempotency key per conversation and bounded reason fields", () => {
    const idempotency = getPublicChatTableConfig(publicChatIdempotency);
    expect(idempotency.uniqueConstraints.map((constraint) => constraint.name)).toContain(
      "public_chat_idempotency_conversation_key_unique",
    );
    expect(idempotency.indexes.map((index) => index.config.name)).toContain(
      "public_chat_idempotency_lease_idx",
    );

    const reasonColumns = [publicChatMessages, publicChatHandoffs, publicChatAuditEvents].flatMap(
      (table) =>
        getPublicChatTableConfig(table).columns.filter((column) => column.name.includes("reason")),
    );
    expect(reasonColumns.length).toBeGreaterThan(0);
    for (const column of reasonColumns) expect(column.dataType).toBe("string");
  });

  it("forces RLS and revokes direct browser roles in the migration", () => {
    const migration = [
      "0000_abnormal_orphan.sql",
      "0001_thick_riptide.sql",
      "0002_green_tempest.sql",
    ]
      .map((file) =>
        readFileSync(fileURLToPath(new URL(`../../drizzle/${file}`, import.meta.url)), "utf8"),
      )
      .join("\n");
    for (const table of [
      "public_chat_sessions",
      "public_chat_conversations",
      "public_chat_messages",
      "public_chat_citations",
      "public_chat_handoffs",
      "public_chat_idempotency",
      "public_chat_audit_events",
      "public_chat_rate_limits",
    ]) {
      expect(migration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      expect(migration).toContain(
        `REVOKE ALL ON TABLE "${table}" FROM PUBLIC, anon, authenticated`,
      );
    }
    expect(migration).toContain("CREATE ROLE atlas_public_chat_gateway");
    expect(migration).toContain("NOBYPASSRLS");
    expect(migration).toContain("NOLOGIN");
    expect(migration).toContain('TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true)');
  });
});
