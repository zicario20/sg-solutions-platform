import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const hardenedTables = [
  ["public.partner_relationships", "m040_partner_relationships_deny_all"],
  ["public.partner_onboardings", "m040_partner_onboardings_deny_all"],
  ["public.partner_due_diligence", "m040_partner_due_diligence_deny_all"],
  ["public.partner_contacts", "m040_partner_contacts_deny_all"],
  ["public.partner_documents", "m040_partner_documents_deny_all"],
  ["public.provider_interfaces", "m041_provider_interfaces_deny_all"],
  ["public.provider_capability_definitions", "m041_provider_capability_definitions_deny_all"],
  ["public.provider_capabilities", "m041_provider_capabilities_deny_all"],
  ["public.provider_schemas", "m041_provider_schemas_deny_all"],
  ["public.provider_adapters", "m041_provider_adapters_deny_all"],
  ["public.provider_endpoints", "m041_provider_endpoints_deny_all"],
  ["public.provider_health", "m041_provider_health_deny_all"],
  ["public.provider_routes", "m041_provider_routes_deny_all"],
] as const;

describe("M040/M041 RLS audit hardening", () => {
  it("closes direct access to every previously unprotected provider and partner table", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "drizzle/0051_audit_m040_m041_rls_hardening.sql"),
      "utf8",
    );

    for (const [table, policy] of hardenedTables) {
      expect(migration).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      expect(migration).toContain(
        `CREATE POLICY ${policy} ON ${table} AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);`,
      );
    }
  });
});
