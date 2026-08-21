CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"supabase_subject" text NOT NULL,
	"status" varchar(32) NOT NULL,
	"authentication_epoch" integer DEFAULT 1 NOT NULL,
	"access_epoch" integer DEFAULT 1 NOT NULL,
	"policy_epoch" integer DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_accounts_supabase_subject_unique" UNIQUE("supabase_subject"),
	CONSTRAINT "auth_accounts_status_valid" CHECK ("auth_accounts"."status" in ('pending_verification', 'limited', 'active', 'suspended', 'closed')),
	CONSTRAINT "auth_accounts_epoch_positive" CHECK ("auth_accounts"."authentication_epoch" > 0 and "auth_accounts"."access_epoch" > 0 and "auth_accounts"."policy_epoch" > 0),
	CONSTRAINT "auth_accounts_version_positive" CHECK ("auth_accounts"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_external_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_subject" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"linked_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_external_identities_provider_subject_unique" UNIQUE("provider","provider_subject"),
	CONSTRAINT "auth_external_identities_provider_valid" CHECK ("auth_external_identities"."provider" in ('email_password', 'google')),
	CONSTRAINT "auth_external_identities_state_valid" CHECK ("auth_external_identities"."state" in ('pending', 'active', 'reconciling', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "auth_external_identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"intended_membership_receipt" text NOT NULL,
	"proof_id" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_invitations_proof_id_unique" UNIQUE("proof_id"),
	CONSTRAINT "auth_invitations_state_valid" CHECK ("auth_invitations"."state" in ('issued', 'accepted', 'revoked', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "auth_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_mfa_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider" varchar(16) NOT NULL,
	"provider_factor_reference" text,
	"state" varchar(24) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_mfa_factors_provider_valid" CHECK ("auth_mfa_factors"."provider" in ('totp', 'passkey')),
	CONSTRAINT "auth_mfa_factors_state_valid" CHECK ("auth_mfa_factors"."state" in ('pending', 'active', 'removed'))
);
--> statement-breakpoint
ALTER TABLE "auth_mfa_factors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"relationship_receipt" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"access_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_organizations_relationship_receipt_unique" UNIQUE("relationship_receipt"),
	CONSTRAINT "auth_organizations_state_valid" CHECK ("auth_organizations"."state" in ('active', 'suspended', 'closed')),
	CONSTRAINT "auth_organizations_version_positive" CHECK ("auth_organizations"."access_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "auth_organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_outbox" (
	"command_id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"purpose" varchar(32) NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"state" varchar(24) NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"lease_owner" text,
	"lease_version" integer DEFAULT 0 NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"available_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"result_code" varchar(64),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_outbox_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "auth_outbox_state_valid" CHECK ("auth_outbox"."state" in ('pending', 'leased', 'completed', 'manual_review'))
);
--> statement-breakpoint
ALTER TABLE "auth_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_party_links" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"relationship_receipt" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"access_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_party_links_relationship_receipt_unique" UNIQUE("relationship_receipt"),
	CONSTRAINT "auth_party_links_state_valid" CHECK ("auth_party_links"."state" in ('active', 'manual_review', 'conflict', 'revoked')),
	CONSTRAINT "auth_party_links_version_positive" CHECK ("auth_party_links"."access_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "auth_party_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_proofs" (
	"id" text PRIMARY KEY NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"proof_digest" text NOT NULL,
	"account_id" text,
	"browser_binding_digest" text,
	"state" varchar(24) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_proofs_proof_digest_unique" UNIQUE("proof_digest"),
	CONSTRAINT "auth_proofs_state_valid" CHECK ("auth_proofs"."state" in ('issued', 'consumed', 'revoked', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "auth_proofs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_provider_vault" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"ciphertext" text NOT NULL,
	"key_reference" text NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_provider_vault_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "auth_provider_vault_version_positive" CHECK ("auth_provider_vault"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "auth_provider_vault" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_rate_buckets" (
	"bucket_digest" text PRIMARY KEY NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"count" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_rate_buckets_count_positive" CHECK ("auth_rate_buckets"."count" > 0),
	CONSTRAINT "auth_rate_buckets_expiry_valid" CHECK ("auth_rate_buckets"."expires_at" > "auth_rate_buckets"."window_started_at")
);
--> statement-breakpoint
ALTER TABLE "auth_rate_buckets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_role_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"role_id" text NOT NULL,
	"organization_id" text,
	"state" varchar(24) NOT NULL,
	"access_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_role_assignments_state_valid" CHECK ("auth_role_assignments"."state" in ('active', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "auth_role_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_role_permissions" (
	"role_id" text NOT NULL,
	"permission" varchar(128) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_role_permissions_role_permission_unique" UNIQUE("role_id","permission")
);
--> statement-breakpoint
ALTER TABLE "auth_role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "auth_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"sequence" bigint NOT NULL,
	"event_name" varchar(80) NOT NULL,
	"outcome" varchar(32) NOT NULL,
	"correlation_id" text NOT NULL,
	"policy_version" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_security_events_account_sequence_unique" UNIQUE("account_id","sequence")
);
--> statement-breakpoint
ALTER TABLE "auth_security_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_service_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" varchar(128) NOT NULL,
	"audience" varchar(128) NOT NULL,
	"scopes" jsonb NOT NULL,
	"state" varchar(24) NOT NULL,
	"access_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_service_accounts_subject_unique" UNIQUE("subject"),
	CONSTRAINT "auth_service_accounts_state_valid" CHECK ("auth_service_accounts"."state" in ('active', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "auth_service_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"handle_digest" text NOT NULL,
	"family_id" text NOT NULL,
	"generation" integer NOT NULL,
	"assurance" varchar(8) NOT NULL,
	"state" varchar(24) NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_sessions_handle_digest_unique" UNIQUE("handle_digest"),
	CONSTRAINT "auth_sessions_family_generation_unique" UNIQUE("family_id","generation"),
	CONSTRAINT "auth_sessions_generation_positive" CHECK ("auth_sessions"."generation" > 0),
	CONSTRAINT "auth_sessions_assurance_valid" CHECK ("auth_sessions"."assurance" in ('aal1', 'aal2')),
	CONSTRAINT "auth_sessions_state_valid" CHECK ("auth_sessions"."state" in ('active', 'rotating', 'revoked', 'expired', 'risk_blocked')),
	CONSTRAINT "auth_sessions_expiry_valid" CHECK ("auth_sessions"."absolute_expires_at" > "auth_sessions"."idle_expires_at")
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"provider" varchar(32),
	"state_digest" text,
	"nonce_digest" text,
	"pkce_verifier_digest" text,
	"browser_binding_digest" text NOT NULL,
	"return_intent" varchar(256) NOT NULL,
	"callback_url" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_transactions_state_digest_unique" UNIQUE("state_digest"),
	CONSTRAINT "auth_transactions_state_valid" CHECK ("auth_transactions"."state" in ('pending', 'consumed', 'expired', 'reconciling')),
	CONSTRAINT "auth_transactions_expiry_valid" CHECK ("auth_transactions"."expires_at" > "auth_transactions"."created_at")
);
--> statement-breakpoint
ALTER TABLE "auth_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_external_identities" ADD CONSTRAINT "auth_external_identities_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_proof_id_auth_proofs_id_fk" FOREIGN KEY ("proof_id") REFERENCES "public"."auth_proofs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_mfa_factors" ADD CONSTRAINT "auth_mfa_factors_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_outbox" ADD CONSTRAINT "auth_outbox_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_party_links" ADD CONSTRAINT "auth_party_links_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_proofs" ADD CONSTRAINT "auth_proofs_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_provider_vault" ADD CONSTRAINT "auth_provider_vault_session_id_auth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auth_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_role_assignments" ADD CONSTRAINT "auth_role_assignments_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_role_assignments" ADD CONSTRAINT "auth_role_assignments_role_id_auth_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."auth_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_role_assignments" ADD CONSTRAINT "auth_role_assignments_organization_id_auth_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."auth_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_role_permissions" ADD CONSTRAINT "auth_role_permissions_role_id_auth_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."auth_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_security_events" ADD CONSTRAINT "auth_security_events_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_outbox_dispatch_idx" ON "auth_outbox" USING btree ("state","available_at","lease_expires_at");--> statement-breakpoint
CREATE INDEX "auth_proofs_expiry_idx" ON "auth_proofs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "auth_role_assignments_account_idx" ON "auth_role_assignments" USING btree ("account_id","state");--> statement-breakpoint
CREATE INDEX "auth_security_events_account_occurred_idx" ON "auth_security_events" USING btree ("account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_account_state_idx" ON "auth_sessions" USING btree ("account_id","state","updated_at");--> statement-breakpoint
CREATE POLICY "auth_accounts_auth_gateway_only" ON "auth_accounts" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_external_identities_auth_gateway_only" ON "auth_external_identities" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_invitations_auth_gateway_only" ON "auth_invitations" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_mfa_factors_auth_gateway_only" ON "auth_mfa_factors" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_organizations_auth_gateway_only" ON "auth_organizations" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_outbox_auth_gateway_only" ON "auth_outbox" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_party_links_auth_gateway_only" ON "auth_party_links" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_proofs_auth_gateway_only" ON "auth_proofs" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_provider_vault_auth_gateway_only" ON "auth_provider_vault" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_rate_buckets_auth_gateway_only" ON "auth_rate_buckets" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_role_assignments_auth_gateway_only" ON "auth_role_assignments" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_role_permissions_auth_gateway_only" ON "auth_role_permissions" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_roles_auth_gateway_only" ON "auth_roles" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_security_events_auth_gateway_only" ON "auth_security_events" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_service_accounts_auth_gateway_only" ON "auth_service_accounts" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_sessions_auth_gateway_only" ON "auth_sessions" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "auth_transactions_auth_gateway_only" ON "auth_transactions" AS PERMISSIVE FOR ALL TO "atlas_auth_gateway" USING (true) WITH CHECK (true);