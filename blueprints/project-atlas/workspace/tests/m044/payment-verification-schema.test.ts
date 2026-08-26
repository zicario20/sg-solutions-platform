import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../drizzle/0054_m044_payment_verification_controlled_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const schema = readFileSync(
  new URL("../../packages/database/src/schema/payment-verification.ts", import.meta.url),
  "utf8",
);

describe("M044 payment verification schema", () => {
  it("models immutable decisions, payment gates, inbox/outbox and deny-by-default RLS", () => {
    expect(schema).toContain("paymentVerificationDecisions");
    expect(schema).toContain("paymentStartGates");
    expect(schema).toContain("paymentVerificationInbox");
    expect(schema).toContain("paymentVerificationOutbox");
    expect(migration).toContain("supersedes_decision_id");
    expect(migration).toContain("payment_sufficiency_assessments");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("payment_verification_deny_all");
  });

  it("does not create a provider call, entitlement grant or workflow start in the migration", () => {
    expect(migration).not.toContain("stripe.");
    expect(migration).not.toContain("grant_entitlement");
    expect(migration).not.toContain("start_operational_workflow");
  });
});
