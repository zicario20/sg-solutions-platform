export const M007_MIGRATION_FILES = ["0023_m007_auth_account.sql", "0024_m007_auth_rls_hardening.sql", "0025_m007_auth_context_rls.sql", "0026_m007_auth_all_table_rls.sql", "0027_m007_auth_force_rls_all_tables.sql", "0028_m007_auth_preauth_functions.sql", "0029_m007_durable_invitations.sql", "0030_m007_oauth_crm_identity_evidence.sql", "0031_m007_durable_auth_controls.sql"];
export const M007_AUTH_TABLES = ["auth_accounts", "auth_external_identities", "auth_supabase_identity_evidence", "auth_crm_party_evidence", "auth_identity_conflicts", "auth_sessions", "auth_provider_vault", "auth_transactions", "auth_proofs", "auth_invitations", "auth_durable_invitations", "auth_party_links", "auth_organizations", "auth_roles", "auth_role_permissions", "auth_role_assignments", "auth_mfa_factors", "auth_service_accounts", "auth_rate_buckets", "auth_security_events", "auth_outbox"];

export function isM007HarnessAuthorized(environment) { return Boolean(environment.DATABASE_URL) && environment.M007_RLS_HARNESS === "authorized"; }

export async function runM007RlsHarness({ executor, migrationSources }) {
  if (migrationSources.length !== M007_MIGRATION_FILES.length) throw new Error("M007_MIGRATION_SET_INCOMPLETE");
  await executor.execute("apply_migrations", migrationSources);
  if (await executor.execute("cross_account_read") !== 0) throw new Error("M007_CROSS_ACCOUNT_READ_VISIBLE");
  if (await executor.execute("cross_account_write") !== "denied") throw new Error("M007_CROSS_ACCOUNT_WRITE_ALLOWED");
  if (await executor.execute("preauth_allow") !== true) throw new Error("M007_PREAUTH_ALLOW_FAILED");
  if (await executor.execute("preauth_deny") !== false) throw new Error("M007_PREAUTH_THRESHOLD_BYPASS");
  if (await executor.execute("global_table_access") !== "denied") throw new Error("M007_GLOBAL_TABLE_VISIBLE");
  if (await executor.execute("gateway_ddl") !== "denied") throw new Error("M007_GATEWAY_EXCESS_PRIVILEGE");
  if (await executor.execute("audit_policy") !== true) throw new Error("M007_AUDIT_POLICY_FAILED");
  if (await executor.execute("outbox_policy") !== true) throw new Error("M007_OUTBOX_POLICY_FAILED");
  return { kind: "passed", migrationsApplied: migrationSources.length };
}

const splitMigration = (source) => source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);

export function createPostgresM007Executor(sql) {
  const fixture = { accountA: "m007-harness-account-a", accountB: "m007-harness-account-b", sessionA: "m007-harness-session-a", sessionB: "m007-harness-session-b" };
  const setAccountContext = async (transaction) => { await transaction.unsafe("set local role atlas_auth_gateway"); await transaction.unsafe("select atlas_auth_initialize_session_context($1)", [fixture.sessionA]); };
  const denied = async (operation) => { try { await operation(); return "allowed"; } catch { return "denied"; } };
  const preauthKeys = ["m007_ip_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "m007_account_bbbbbbbbbbbbbbbbbbbbbbbbbbbb", "m007_email_cccccccccccccccccccccccccccc", "m007_phone_dddddddddddddddddddddddddddd", "m007_device_eeeeeeeeeeeeeeeeeeeeeeeeeeee"];
  return { async execute(operation, payload) {
    if (operation === "apply_migrations") {
      for (const migration of payload) for (const statement of splitMigration(migration.sql)) await sql.unsafe(statement);
      const state = await sql.unsafe("select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any($1)", [M007_AUTH_TABLES]);
      if (state.length !== M007_AUTH_TABLES.length || state.some((row) => !row.relrowsecurity || !row.relforcerowsecurity)) throw new Error("M007_RLS_NOT_FORCED_ON_ALL_TABLES");
      const publicGrants = await sql.unsafe("select table_name from information_schema.role_table_grants where table_schema='public' and grantee='PUBLIC' and table_name=any($1)", [M007_AUTH_TABLES]);
      if (publicGrants.length) throw new Error("M007_PUBLIC_TABLE_GRANT_PRESENT");
      const policies = await sql.unsafe("select tablename from pg_policies where schemaname='public' and roles @> array['atlas_auth_gateway'] and tablename=any($1)", [M007_AUTH_TABLES]);
      if (new Set(policies.map((row) => row.tablename)).size !== M007_AUTH_TABLES.length) throw new Error("M007_GATEWAY_POLICY_MISSING");
      const now = new Date(); const idle = new Date(now.getTime() + 30 * 60_000); const absolute = new Date(now.getTime() + 8 * 60 * 60_000);
      await sql.unsafe("insert into auth_accounts (id,supabase_subject,status,authentication_epoch,access_epoch,policy_epoch,version,created_at,updated_at) values ($1,$2,'active',1,1,1,1,$5,$5),($3,$4,'active',1,1,1,1,$5,$5)", [fixture.accountA, "m007-subject-a", fixture.accountB, "m007-subject-b", now]);
      await sql.unsafe("insert into auth_sessions (id,account_id,handle_digest,family_id,generation,assurance,state,idle_expires_at,absolute_expires_at,version,created_at,updated_at) values ($1,$2,$3,$4,1,'aal1','active',$9,$10,1,$11,$11),($5,$6,$7,$8,1,'aal1','active',$9,$10,1,$11,$11)", [fixture.sessionA, fixture.accountA, "m007-handle-a", "m007-family-a", fixture.sessionB, fixture.accountB, "m007-handle-b", "m007-family-b", idle, absolute, now]);
      await sql.unsafe("insert into auth_security_events (id,event_key,account_id,event_name,outcome,correlation_id,policy_version,metadata,occurred_at) values ('m007-audit-a','m007-audit-a',$1,'harness','accepted','m007-cor-a',1,'{}',$3),('m007-audit-b','m007-audit-b',$2,'harness','accepted','m007-cor-b',1,'{}',$3)", [fixture.accountA, fixture.accountB, now]);
      await sql.unsafe("insert into auth_outbox (command_id,account_id,purpose,channel,idempotency_key,state,attempt_count,lease_version,available_at,payload,created_at,updated_at) values ('m007-outbox-a',$1,'security_alert','security_alert','m007-outbox-a','pending',0,0,$3,'{}',$3,$3),('m007-outbox-b',$2,'security_alert','security_alert','m007-outbox-b','pending',0,0,$3,'{}',$3,$3)", [fixture.accountA, fixture.accountB, now]);
      return true;
    }
    if (operation === "cross_account_read") return sql.begin(async (transaction) => { await setAccountContext(transaction); const rows = await transaction.unsafe("select count(*)::int as count from auth_accounts where id=$1", [fixture.accountB]); return Number(rows[0]?.count ?? -1); });
    if (operation === "cross_account_write") return sql.begin(async (transaction) => { await setAccountContext(transaction); const rows = await transaction.unsafe("update auth_accounts set updated_at=now() where id=$1 returning id", [fixture.accountB]); return rows.length === 0 ? "denied" : "allowed"; });
    if (operation === "preauth_allow" || operation === "preauth_deny") return sql.begin(async (transaction) => { await transaction.unsafe("set local role atlas_auth_preauth"); const rows = await transaction.unsafe("select atlas_auth_admit_risk_keys($1,$2,$3,$4,$5) as allowed", ["harness_login", preauthKeys, 1, 900, new Date()]); return rows[0]?.allowed === true; });
    if (operation === "global_table_access") return sql.begin(async (transaction) => { await transaction.unsafe("set local role atlas_auth_gateway"); await transaction.unsafe("set local atlas.auth_context_verified=''"); try { const rows = await transaction.unsafe("select count(*)::int as count from auth_roles"); return Number(rows[0]?.count ?? 0) === 0 ? "denied" : "allowed"; } catch { return "denied"; } });
    if (operation === "gateway_ddl") return denied(() => sql.begin(async (transaction) => { await transaction.unsafe("set local role atlas_auth_gateway"); await transaction.unsafe("create table m007_gateway_must_not_create(id integer)"); }));
    if (operation === "audit_policy" || operation === "outbox_policy") return sql.begin(async (transaction) => { await setAccountContext(transaction); const table = operation === "audit_policy" ? "auth_security_events" : "auth_outbox"; const rows = await transaction.unsafe(`select account_id from ${table} order by account_id`); return rows.length === 1 && rows[0]?.account_id === fixture.accountA; });
    throw new Error(`M007_HARNESS_OPERATION_UNKNOWN:${operation}`);
  } };
}
