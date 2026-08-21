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

  it("generates the voice tables through the Drizzle journal", () => {
    const workspace = fileURLToPath(new URL("../../", import.meta.url));
    const journal = JSON.parse(
      readFileSync(`${workspace}drizzle/meta/_journal.json`, "utf8"),
    ) as { entries: Array<{ idx: number; tag: string }> };
    const latest = journal.entries.at(-1);
    expect(latest?.idx).toBeGreaterThanOrEqual(16);
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
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
  });
});
