import { MemoryCommunicationsRepository } from "@atlas/domain";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
  const storeSource = readFileSync(
    fileURLToPath(new URL("../../packages/database/src/postgres-communications-store.ts", import.meta.url)),
    "utf8",
  );
  const schemaSource = readFileSync(
    fileURLToPath(new URL("../../packages/database/src/schema.ts", import.meta.url)),
    "utf8",
  );
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

  it("keeps deterministic SQL compatible with nonnegative versions, scoped locking, and canonical references", () => {
    const acceptInboundSource = storeSource.slice(
      storeSource.indexOf("async acceptInbound("),
      storeSource.indexOf("async claimInbound("),
    );
    const createOutboundSource = storeSource.slice(
      storeSource.indexOf("async createOutbound("),
      storeSource.indexOf("async finalizeOutbound("),
    );
    expect(storeSource).toMatch(/processing_version[^;]+null, 0, null/su);
    expect(storeSource).toContain("processing_version = processing_version + 1");
    expect(storeSource).toContain("select id from communication_conversations where id = $1 for update");
    expect(storeSource).toContain("coalesce(max(ordinal), 0)::integer + 1 as ordinal");
    expect(storeSource).toContain("canonicalEndpointReference(");
    expect(storeSource).toContain("then 'inbound_event' else 'authority' end as source");
    expect(acceptInboundSource.match(/for update of receipt/gu)).toHaveLength(2);
    expect(acceptInboundSource).not.toMatch(/limit 1 for update[`\r\n]/u);
    expect(createOutboundSource.indexOf("COMMUNICATIONS_TRANSACTION_SQL.lockBinding")).toBeLessThan(
      createOutboundSource.indexOf("where binding_id = $1 and idempotency_key = $2"),
    );
    expect(createOutboundSource).toContain("existing.locale !== input.command.locale");
    expect(createOutboundSource).toContain("raced.locale !== input.command.locale");
    expect(schemaSource).toContain("sql`${table.processingVersion} >= 0`");
    expect(schemaSource).toContain('messageBodyDigest: char("message_body_digest", { length: 64 })');
  });

  it("uses exhaustive domain-to-database outcome and reconciliation vocabularies", () => {
    expect(storeSource).toContain('known_failure: { state: "failed", resultCode: "failed" }');
    expect(storeSource).toContain('unknown: { state: "dispatch_unknown", resultCode: "dispatch_unknown" }');
    expect(schemaSource).toContain("('provider_lookup', 'manual_authority')");
    expect(schemaSource).toContain("('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')");
    expect(storeSource.match(/evaluateOutboundPolicy\(/gu)).toHaveLength(2);
  });

  it("owns each contact withdrawal receipt once and links purpose-local projections", () => {
    const withdrawSource = storeSource.slice(
      storeSource.indexOf("async withdrawContact("),
      storeSource.indexOf("async resolveAmbiguousOptOutFromReceipt("),
    );
    expect(schemaSource).toContain('contactEvidenceEventId: text("contact_evidence_event_id")');
    expect(schemaSource).toContain("'contact_withdrawal_recorded'");
    expect(schemaSource).toContain(
      'unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId)',
    );
    expect(schemaSource).toContain("communication_contact_evidence_events_contact_binding_fk");
    expect(withdrawSource.match(/appendContactWithdrawalEvidence\(/gu)).toHaveLength(1);
    expect(withdrawSource).toContain("contactEvidenceEventId: contactEvidence.id");
    expect(storeSource).toContain("on conflict (evidence_receipt_id) do nothing");
    expect(storeSource).toContain("where event_kind = 'contact_withdrawal_recorded'");
  });

  it("hardens both receipt tables with scoped policy, FORCE RLS, revokes, and least privilege", () => {
    expect(schemaSource).toContain("communicationsCommandScope(table.commandId)");
    const securityMigration = readFileSync(
      fileURLToPath(new URL("../../drizzle/0011_m004_receipt_security_hardening.sql", import.meta.url)),
      "utf8",
    );
    for (const table of [
      "communication_provider_status_receipts",
      "communication_dispatch_reconciliation_receipts",
    ]) {
      expect(securityMigration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      expect(securityMigration).toContain(`"${table}" FROM PUBLIC`);
    }
    expect(securityMigration).toContain("'anon', 'authenticated', 'atlas_migration_runtime'");
    expect(securityMigration).toContain("GRANT SELECT, INSERT ON TABLE");
    expect(securityMigration).not.toContain("GRANT UPDATE");
    expect(securityMigration).not.toContain("GRANT DELETE");
  });
});
