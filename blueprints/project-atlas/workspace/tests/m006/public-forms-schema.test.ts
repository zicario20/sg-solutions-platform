import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspace = fileURLToPath(new URL("../../", import.meta.url));

describe("M006 public forms schema contract", () => {
  it("forces RLS without anonymous or open access", () => {
    const migration = readFileSync(`${workspace}drizzle/0019_m006_public_forms.sql`, "utf8");
    const tables = [
      "form_definitions",
      "form_definition_versions",
      "form_field_definitions",
      "form_submissions",
      "form_responses",
      "form_consent_evidence",
      "form_attribution",
      "form_submission_receipts",
      "form_drafts",
      "form_outbox",
      "form_audit_events",
    ];
    for (const table of tables) {
      expect(migration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    }
    expect(migration).not.toMatch(/\bTO\s+(?:PUBLIC|anon)\b/iu);
    expect(migration).not.toMatch(/USING\s*\(true\)/iu);
  });

  it("stores response envelopes rather than plaintext answer columns", () => {
    const source = readFileSync(`${workspace}packages/database/src/schema/public-forms.ts`, "utf8");
    expect(source).toContain('ciphertext: text("ciphertext")');
    expect(source).toContain('keyReference: text("key_reference")');
    expect(source).not.toMatch(/plaintext|raw_answer|answer_value/iu);
  });
});
