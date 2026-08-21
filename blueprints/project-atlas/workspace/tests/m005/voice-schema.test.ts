import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as databaseSchema from "../../packages/database/src/schema.ts";

const VOICE_TABLE_EXPORTS = [
  "voiceCalls",
  "voiceInteractions",
  "voiceVerificationAttempts",
  "voiceEscalations",
  "voiceCallbackRequests",
  "voiceArtifacts",
  "voiceCommandReceipts",
] as const;

function tableConfig(exportName: (typeof VOICE_TABLE_EXPORTS)[number]) {
  const table = (databaseSchema as Record<string, unknown>)[exportName];
  expect(table, `${exportName} must be exported by the Drizzle schema`).toBeDefined();
  return databaseSchema.getPublicChatTableConfig(
    table as Parameters<typeof databaseSchema.getPublicChatTableConfig>[0],
  );
}

describe("M005 metadata-only voice schema", () => {
  it("exports the complete durable aggregate with RLS enabled", () => {
    for (const exportName of VOICE_TABLE_EXPORTS) {
      expect(tableConfig(exportName).enableRLS).toBe(true);
    }
  });

  it("stores metadata without caller, audio, transcript or arbitrary content columns", () => {
    const forbidden = /phone|caller_number|audio|transcript|recording_url|body|content|payload|prompt/iu;
    for (const exportName of VOICE_TABLE_EXPORTS) {
      const columns = tableConfig(exportName).columns.map((column) => column.name);
      expect(columns.join(" ")).not.toMatch(forbidden);
    }
  });

  it("generates a forward lease and scoped forced-RLS migration through Drizzle", () => {
    const workspace = fileURLToPath(new URL("../../", import.meta.url));
    const journal = JSON.parse(
      readFileSync(`${workspace}drizzle/meta/_journal.json`, "utf8"),
    ) as { entries: Array<{ idx: number; tag: string }> };
    const latest = journal.entries.at(-1);
    expect(latest?.idx).toBeGreaterThanOrEqual(18);
    const sql = readFileSync(`${workspace}drizzle/${latest?.tag}.sql`, "utf8");
    for (const table of [
      "voice_calls",
      "voice_interactions",
      "voice_verification_attempts",
      "voice_escalations",
      "voice_callback_requests",
      "voice_artifacts",
      "voice_command_receipts",
    ]) {
      expect(sql).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      expect(sql).toContain(`ON "${table}"`);
    }
    expect(sql).toContain('ADD COLUMN "lease_expires_at"');
    expect(sql).toContain('ADD COLUMN "reservation_version"');
    expect(sql).toContain("current_setting('atlas.voice_call_id', true)");
    expect(sql).toContain("GRANT SELECT");
    expect(sql).not.toMatch(/voice_[^;]+USING \(true\)/u);
  });

  it("models finite receipt leases and optimistic reconciliation metadata", () => {
    const columns = tableConfig("voiceCommandReceipts").columns.map(
      (column) => column.name,
    );
    expect(columns).toEqual(
      expect.arrayContaining(["lease_expires_at", "reservation_version"]),
    );
  });
});
