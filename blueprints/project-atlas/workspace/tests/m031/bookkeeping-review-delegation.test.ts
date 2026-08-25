import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gateway = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);
const authSchema = readFileSync(
  resolve(process.cwd(), "packages/database/src/schema/auth.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(process.cwd(), "drizzle/0039_m007_purpose_bound_bookkeeping_review_delegation.sql"),
  "utf8",
);
const delegationRepository = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-auth-purpose-delegations.ts"),
  "utf8",
);

describe("M031 purpose-bound close-review delegation", () => {
  it("requires an M007 delegation before a different reviewer can approve a client-owned close", () => {
    expect(gateway).toContain("atlas_auth_verify_bookkeeping_review_delegation");
    expect(gateway).toContain("input.reviewerAccountId !== input.actor.accountId");
    expect(gateway).toContain("input.reviewerAccountId === request.requested_by_account_id");
  });

  it("binds the grant to the accounting entity, both epoch fences, revocation and expiry", () => {
    expect(authSchema).toContain("authPurposeDelegations");
    expect(authSchema).toContain("delegateAuthorizationEpoch");
    expect(authSchema).toContain("ownerAuthorizationEpoch");
    expect(migration).toContain("auth_purpose_delegations");
    expect(migration).toContain("atlas_auth_verify_bookkeeping_review_delegation");
    expect(migration).toContain("set_config('atlas.auth_context_verified','1',true)");
    expect(migration).toContain("delegation.expires_at>p_now");
    expect(migration).toContain("delegation.state='active'");
    expect(delegationRepository).toContain("withAuthTransaction");
  });
});
