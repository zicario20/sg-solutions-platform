import { describe, expect, it } from "vitest";

describe("AR-009 live PostgreSQL RLS harness contract", () => {
  it("stays inert without both explicit authorization gates", async () => {
    const { isM007HarnessAuthorized } = await import("../support/m007-auth-rls-harness.mjs");
    expect(isM007HarnessAuthorized({ DATABASE_URL: "postgres://db" })).toBe(false);
    expect(isM007HarnessAuthorized({ M007_RLS_HARNESS: "authorized" })).toBe(false);
    expect(
      isM007HarnessAuthorized({ DATABASE_URL: "postgres://db", M007_RLS_HARNESS: "authorized" }),
    ).toBe(true);
  });

  it("applies every M007 migration and executes least-privilege behavioral checks", async () => {
    const { M007_MIGRATION_FILES, runM007RlsHarness } = await import(
      "../support/m007-auth-rls-harness.mjs"
    );
    const events: string[] = [];
    const executor = {
      execute: async (operation: string) => {
        events.push(operation);
        return operation === "preauth_deny"
          ? false
          : operation === "cross_account_read"
            ? 0
            : operation === "cross_account_write"
              ? "denied"
              : operation === "global_table_access"
                ? "denied"
                : operation === "gateway_ddl"
                  ? "denied"
                  : true;
      },
    };
    await expect(
      runM007RlsHarness({
        executor,
        migrationSources: M007_MIGRATION_FILES.map((file) => ({ file, sql: "select 1" })),
      }),
    ).resolves.toEqual({ kind: "passed", migrationsApplied: M007_MIGRATION_FILES.length });
    expect(events).toEqual([
      "apply_migrations",
      "cross_account_read",
      "cross_account_write",
      "preauth_allow",
      "preauth_deny",
      "global_table_access",
      "gateway_ddl",
      "audit_policy",
      "outbox_policy",
    ]);
  });

  it("fails when cross-account data becomes visible", async () => {
    const { M007_MIGRATION_FILES, runM007RlsHarness } = await import(
      "../support/m007-auth-rls-harness.mjs"
    );
    const executor = {
      execute: async (operation: string) =>
        operation === "cross_account_read"
          ? 1
          : operation === "cross_account_write" ||
              operation === "global_table_access" ||
              operation === "gateway_ddl"
            ? "denied"
            : operation === "preauth_deny"
              ? false
              : true,
    };
    await expect(
      runM007RlsHarness({
        executor,
        migrationSources: M007_MIGRATION_FILES.map((file) => ({ file, sql: "select 1" })),
      }),
    ).rejects.toThrow("M007_CROSS_ACCOUNT_READ_VISIBLE");
  });
});
