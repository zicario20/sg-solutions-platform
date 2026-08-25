import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = resolve(
  import.meta.dirname,
  "../../packages/database/src/postgres-bookkeeping.ts",
);

describe("M031 PostgreSQL bookkeeping gateway", () => {
  it("uses transaction locks and owner/context/epoch fences", () => {
    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain("export class PostgresBookkeepingGateway");
    expect(source).toContain("this.sql.begin");
    expect(source).toContain("pg_advisory_xact_lock");
    expect(source).toContain("owner_account_id=$" + "{input.actor.accountId}");
    expect(source).toContain("context_ref=$" + "{input.actor.contextRef}");
    expect(source).toContain("authorization_epoch=$" + "{Number(input.actor.authorizationEpoch)}");
    expect(source).toContain("policy_epoch=$" + "{Number(input.actor.policyEpoch)}");
    expect(source).not.toMatch(/quickbooks|xero|bank[_ -]?feed|credential/iu);
  });
});
