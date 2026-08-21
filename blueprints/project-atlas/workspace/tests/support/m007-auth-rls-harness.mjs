import { createCipheriv, createHash, randomBytes } from "node:crypto";

export const M007_MIGRATION_FILES = [
  "0023_m007_auth_account.sql",
  "0024_m007_auth_rls_hardening.sql",
  "0025_m007_auth_context_rls.sql",
  "0026_m007_auth_all_table_rls.sql",
  "0027_m007_auth_force_rls_all_tables.sql",
  "0028_m007_auth_preauth_functions.sql",
  "0029_m007_durable_invitations.sql",
  "0030_m007_oauth_crm_identity_evidence.sql",
  "0031_m007_durable_auth_controls.sql",
  "0032_m007_final_auth_trust_boundaries.sql",
  "0033_m007_auth_provider_protocols.sql",
  "0034_m007_cyber_neo_auth_remediation.sql",
];

const sealHarnessOAuthSecret = (value) => {
  const key = createHash("sha256").update("m007-rls-harness-oauth-secret", "utf8").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
};

export const isM007HarnessAuthorized = (env) => Boolean(env.DATABASE_URL && env.M007_RLS_HARNESS === "authorized");

const denied = async (operation) => {
  try { await operation(); return false; } catch { return true; }
};

export async function runM007RlsHarness({ executor, migrationSources }) {
  if (migrationSources.length !== M007_MIGRATION_FILES.length) throw new Error("M007_MIGRATION_SET_INCOMPLETE");
  await executor.execute("apply_migrations", migrationSources);
  if (await executor.execute("cross_account_read") !== 0) throw new Error("M007_CROSS_ACCOUNT_READ_VISIBLE");
  if (await executor.execute("cross_account_write") !== "denied") throw new Error("M007_CROSS_ACCOUNT_WRITE_ALLOWED");
  if (await executor.execute("preauth_allow") !== true) throw new Error("M007_PREAUTH_ALLOW_FAILED");
  if (await executor.execute("preauth_deny") !== false) throw new Error("M007_PREAUTH_DENY_FAILED");
  if (await executor.execute("global_table_access") !== "denied") throw new Error("M007_GLOBAL_TABLE_VISIBLE");
  if (await executor.execute("gateway_ddl") !== "denied") throw new Error("M007_GATEWAY_DDL_ALLOWED");
  if (await executor.execute("audit_policy") !== true) throw new Error("M007_AUDIT_POLICY_FAILED");
  if (await executor.execute("outbox_policy") !== true) throw new Error("M007_OUTBOX_POLICY_FAILED");
  if (executor.supportsFinalRepositories === true) {
    for (const operation of ["repository_oauth_as_preauth", "repository_identity_as_preauth", "repository_invitation_as_gateway", "repository_controls_as_preauth", "repository_outbox_as_worker", "invitation_subject_match"]) {
      if (await executor.execute(operation) !== true) throw new Error(`M007_${operation.toUpperCase()}_FAILED`);
    }
    if (await executor.execute("invitation_subject_mismatch") !== "manual_review") throw new Error("M007_INVITATION_BINDING_FAILED");
    if (await executor.execute("gateway_direct_dml_denied") !== "denied") throw new Error("M007_GATEWAY_DIRECT_DML_ALLOWED");
    if (await executor.execute("legacy_oauth_function_denied") !== true) throw new Error("M007_LEGACY_OAUTH_FUNCTION_ALLOWED");
  }
  return { kind: "passed", migrationsApplied: migrationSources.length };
}

export function createPostgresM007Executor(sql) {
  const now = new Date("2026-08-21T12:00:00.000Z");
  const asRole = (role, operation) => sql.begin(async (transaction) => {
    await transaction.unsafe(`set local role ${role}`);
    return operation(transaction);
  });
  const call = async (transaction, statement, parameters = []) => transaction.unsafe(statement, parameters);
  return {
    supportsFinalRepositories: true,
    async execute(operation, input) {
      if (operation === "apply_migrations") {
        for (const migration of input) for (const statement of migration.sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) await sql.unsafe(statement);
        await sql.unsafe("insert into auth_accounts(id,supabase_subject,status,authentication_epoch,access_epoch,policy_epoch,version,created_at,updated_at) values ('account-a','subject-a','active',1,1,1,1,$1,$1),('account-b','subject-b','active',1,1,1,1,$1,$1) on conflict do nothing", [now]);
        await sql.unsafe("insert into auth_external_identities(id,account_id,provider,provider_subject,state,linked_at,version,created_at,updated_at) values ('external-a','account-a','google','subject-a','active',$1,1,$1,$1),('external-b','account-b','google','subject-b','active',$1,1,$1,$1) on conflict do nothing", [now]);
        await sql.unsafe("insert into auth_sessions(id,account_id,handle_digest,family_id,generation,assurance,state,idle_expires_at,absolute_expires_at,version,created_at,updated_at) values ('session-a','account-a',repeat('a',43),'family-a',1,'aal1','active',$1+interval '30 minutes',$1+interval '8 hours',1,$1,$1),('session-b','account-b',repeat('b',43),'family-b',1,'aal1','active',$1+interval '30 minutes',$1+interval '8 hours',1,$1,$1) on conflict do nothing", [now]);
        return true;
      }
      if (operation === "cross_account_read") return asRole("atlas_auth_gateway", async (tx) => { await call(tx, "select atlas_auth_initialize_session_context('session-a')"); const rows = await call(tx, "select id from auth_sessions where account_id='account-b'"); return rows.length; });
      if (operation === "cross_account_write") return await denied(() => asRole("atlas_auth_gateway", async (tx) => { await call(tx, "select atlas_auth_initialize_session_context('session-a')"); await call(tx, "update auth_accounts set status='closed' where id='account-b'"); })) ? "denied" : "allowed";
      if (operation === "preauth_allow") return asRole("atlas_auth_preauth", async (tx) => (await call(tx, "select atlas_auth_admit_risk_keys('sign_in',array[repeat('c',32)],1,60,$1) allowed", [now]))[0].allowed);
      if (operation === "preauth_deny") return asRole("atlas_auth_preauth", async (tx) => (await call(tx, "select atlas_auth_admit_risk_keys('sign_in',array[repeat('c',32)],1,60,$1) allowed", [now]))[0].allowed);
      if (operation === "global_table_access") return await denied(() => asRole("atlas_auth_gateway", async (tx) => { await call(tx, "select atlas_auth_initialize_session_context('session-a')"); await call(tx, "select * from auth_roles"); })) ? "denied" : "allowed";
      if (operation === "gateway_ddl") return await denied(() => asRole("atlas_auth_gateway", (tx) => call(tx, "create table m007_gateway_escape(id integer)"))) ? "denied" : "allowed";
      if (operation === "audit_policy") { const rows = await sql.unsafe("select has_function_privilege('atlas_auth_preauth','atlas_auth_append_audit(text,text,text,text,text,jsonb,timestamptz)','EXECUTE') and not has_table_privilege('atlas_auth_preauth','auth_security_events','INSERT') allowed"); return rows[0]?.allowed === true; }
      if (operation === "outbox_policy") { const rows = await sql.unsafe("select has_function_privilege('atlas_auth_worker','atlas_auth_lease_outbox(text,text,integer,timestamptz,timestamptz)','EXECUTE') and not has_table_privilege('atlas_auth_worker','auth_outbox','UPDATE') allowed"); return rows[0]?.allowed === true; }
      if (operation === "legacy_oauth_function_denied") { const rows = await sql.unsafe("select to_regprocedure('atlas_auth_issue_oauth_transaction(text,text,text,text,text,text,text,text,text,text,timestamptz,timestamptz)') is null denied"); return rows[0]?.denied === true; }
        if (operation === "repository_oauth_as_preauth") return asRole("atlas_auth_preauth", async (tx) => {
          const nonceCiphertext = sealHarnessOAuthSecret("m007-harness-oauth-nonce");
          const pkceCiphertext = sealHarnessOAuthSecret("m007-harness-oauth-pkce-verifier");
          await call(tx, "select atlas_auth_issue_oauth_transaction($1,'sign_in','google',repeat('s',32),repeat('n',32),repeat('p',32),repeat('b',32),repeat('r',32),$2,$3,'/client','https://app.example/api/auth/oauth/google/callback',$4,$5)", ["oauth-transaction-0001", nonceCiphertext, pkceCiphertext, new Date(now.getTime()+60000), now]);
          return true;
        });
      if (operation === "repository_identity_as_preauth") return asRole("atlas_auth_preauth", async (tx) => { await call(tx, "select atlas_auth_store_supabase_evidence($1,'google','subject-repository','https://issuer.example','atlas',true,$2,$3,$4)", ["evidence-repository-01","provider-transaction-01",now,new Date(now.getTime()+60000)]); await call(tx, "select atlas_auth_store_crm_evidence($1,$2,'party-1','linked',$3,$4,$5)", ["crm-repository-00001","evidence-repository-01","relationship-receipt-01",now,new Date(now.getTime()+60000)]); return true; });
      if (operation === "repository_invitation_as_gateway") return asRole("atlas_auth_gateway", async (tx) => { await call(tx, "select atlas_auth_issue_invitation($1,repeat('i',32),'contact-a','client','account-a','subject-a',$2,$3)", ["invitation-repository-1",new Date(now.getTime()+60000),now]); return true; });
      if (operation === "repository_controls_as_preauth") return asRole("atlas_auth_preauth", async (tx) => { const rows = await call(tx, "select atlas_auth_admit_and_enqueue('recovery',array[repeat('r',32)],5,60,'event-repository-0001','correlation-repository',null,'{}'::jsonb,'command-repository-01','recovery_email','email','idempotency-repository','{}'::jsonb,$1) allowed", [now]); return rows[0].allowed; });
      if (operation === "repository_outbox_as_worker") return asRole("atlas_auth_worker", async (tx) => { const rows = await call(tx, "select * from atlas_auth_lease_outbox('worker-repository', 'dispatch', 5, $1, $2)", [now,new Date(now.getTime()+30000)]); return rows.length === 1 && rows[0].lease_owner === 'worker-repository' && rows[0].lease_purpose === 'dispatch' && Number(rows[0].lease_version) > 0; });
      if (operation === "invitation_subject_match") return asRole("atlas_auth_gateway", async (tx) => (await call(tx, "select atlas_auth_consume_invitation('invitation-repository-1',repeat('i',32),repeat('a',43),$1) outcome", [now]))[0].outcome === "consumed");
      if (operation === "invitation_subject_mismatch") return asRole("atlas_auth_gateway", async (tx) => { await call(tx, "select atlas_auth_issue_invitation('invitation-mismatch-01',repeat('m',32),'contact-b','client','account-a','subject-b',$1,$2)", [new Date(now.getTime()+60000),now]); return (await call(tx, "select atlas_auth_consume_invitation('invitation-mismatch-01',repeat('m',32),repeat('a',43),$1) outcome", [now]))[0].outcome; });
      if (operation === "gateway_direct_dml_denied") return await denied(() => asRole("atlas_auth_gateway", (tx) => call(tx, "insert into auth_transactions(id,purpose,browser_binding_digest,return_intent,callback_url,state,expires_at,version,created_at,updated_at) values ('direct-dml','sign_in','x','/','https://invalid','pending',$1,1,$1,$1)", [now]))) ? "denied" : "allowed";
      throw new Error(`M007_UNKNOWN_OPERATION:${operation}`);
    },
  };
}
