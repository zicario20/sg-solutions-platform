-- Custom SQL migration file, put your code below! --
-- Drizzle custom migration generated with:
-- drizzle-kit generate --custom --name m004_receipt_security_hardening
--
-- The structural migration owns tables and policies. This forward-only security migration
-- matches the 0008 FORCE-RLS and least-privilege grant boundary for both new receipt tables.

ALTER TABLE "communication_provider_status_receipts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_provider_status_receipts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_dispatch_reconciliation_receipts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_dispatch_reconciliation_receipts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "communication_provider_status_receipts" FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON TABLE "communication_dispatch_reconciliation_receipts" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE runtime_role text; receipt_table text;
BEGIN
  FOREACH runtime_role IN ARRAY ARRAY['anon', 'authenticated', 'atlas_migration_runtime'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = runtime_role) THEN
      FOREACH receipt_table IN ARRAY ARRAY[
        'communication_provider_status_receipts',
        'communication_dispatch_reconciliation_receipts'
      ] LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', receipt_table, runtime_role);
      END LOOP;
    END IF;
  END LOOP;
END
$$;
--> statement-breakpoint
REVOKE ALL ON TABLE
  "communication_provider_status_receipts",
  "communication_dispatch_reconciliation_receipts"
FROM atlas_public_chat_gateway, atlas_communications_gateway;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE
  "communication_provider_status_receipts",
  "communication_dispatch_reconciliation_receipts"
TO atlas_communications_gateway;
