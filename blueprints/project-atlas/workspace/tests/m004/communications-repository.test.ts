import { MemoryCommunicationsRepository } from "@atlas/domain";
import {
  assertRestrictedCommunicationsPrincipal,
  COMMUNICATIONS_TRANSACTION_SQL,
} from "../../packages/database/src/postgres-communications-store.ts";
import { describe, expect, it } from "vitest";
import {
  communicationsConformanceSeed,
  runCommunicationsRepositoryConformance,
} from "../support/communications-repository-conformance.ts";

runCommunicationsRepositoryConformance("memory", async (scenario) => {
  const repository = new MemoryCommunicationsRepository(communicationsConformanceSeed(scenario));
  return {
    repository,
    inspectState: () => repository.referenceState(),
  };
});

describe("Postgres communications transaction contract", () => {
  const safePrincipal = {
    principal_name: "atlas_communications_runtime",
    is_member: true,
    closure_count: 1,
    admin_path: false,
    gateway_closure_count: 0,
    rolbypassrls: false,
    rolinherit: false,
    rolsuper: false,
  };

  it("accepts only the restricted non-inheriting gateway member", () => {
    expect(() => assertRestrictedCommunicationsPrincipal(safePrincipal)).not.toThrow();
    for (const unsafePrincipal of [
      { ...safePrincipal, principal_name: "postgres" },
      { ...safePrincipal, is_member: false },
      { ...safePrincipal, closure_count: 2 },
      { ...safePrincipal, admin_path: true },
      { ...safePrincipal, gateway_closure_count: 1 },
      { ...safePrincipal, rolbypassrls: true },
      { ...safePrincipal, rolinherit: true },
      { ...safePrincipal, rolsuper: true },
    ]) {
      expect(() => assertRestrictedCommunicationsPrincipal(unsafePrincipal)).toThrowError(
        "COMMUNICATIONS_DATABASE_PRINCIPAL_UNSAFE",
      );
    }
  });

  it("sets one local role and claims both queues with skip-locked row ownership", () => {
    expect(COMMUNICATIONS_TRANSACTION_SQL.setLocalRole).toBe(
      "set local role atlas_communications_gateway",
    );
    expect(COMMUNICATIONS_TRANSACTION_SQL.claimInbound).toContain(
      "for update of receipt skip locked",
    );
    expect(COMMUNICATIONS_TRANSACTION_SQL.claimOutbound).toContain(
      "for update skip locked",
    );
    expect(COMMUNICATIONS_TRANSACTION_SQL.lockBinding).toContain("for update");
    expect(COMMUNICATIONS_TRANSACTION_SQL.lockPolicy).toContain("for update");
  });
});
