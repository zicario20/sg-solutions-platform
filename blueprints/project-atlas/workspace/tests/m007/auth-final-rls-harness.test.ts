import { describe, expect, it } from "vitest";
import {
  M007_MIGRATION_FILES,
  runM007RlsHarness,
} from "../support/m007-auth-rls-harness.mjs";

describe("AR-009 restricted-role harness contract", () => {
  it("applies the final forward-only migration and exercises final repositories without direct DML", async () => {
    const operations: string[] = [];
    const executor = { supportsFinalRepositories: true, execute: async (operation: string) => {
      operations.push(operation);
      if (operation === "cross_account_read") return 0;
      if (operation === "cross_account_write") return "denied";
      if (operation === "preauth_allow") return true;
      if (operation === "preauth_deny") return false;
      if (operation === "global_table_denied" || operation === "global_table_access") return "denied";
      if (operation === "gateway_direct_dml_denied") return "denied";
      if (operation === "gateway_ddl_denied" || operation === "gateway_ddl") return "denied";
      if (operation === "invitation_subject_mismatch") return "manual_review";
      return true;
    } };

    await runM007RlsHarness({ executor, migrationSources: M007_MIGRATION_FILES.map((file) => ({ file, sql: "select 1" })) });

    expect(M007_MIGRATION_FILES.at(-1)).toBe("0032_m007_final_auth_trust_boundaries.sql");
    expect(operations).toEqual(expect.arrayContaining([
      "repository_oauth_as_preauth",
      "repository_identity_as_preauth",
      "repository_invitation_as_gateway",
      "repository_controls_as_preauth",
      "repository_outbox_as_worker",
      "invitation_subject_match",
      "invitation_subject_mismatch",
      "gateway_direct_dml_denied",
    ]));
  });
});
