import process from "node:process";

const tables = ["auth_accounts", "auth_external_identities", "auth_sessions", "auth_provider_vault", "auth_transactions", "auth_proofs", "auth_invitations", "auth_party_links", "auth_organizations", "auth_roles", "auth_role_permissions", "auth_role_assignments", "auth_mfa_factors", "auth_service_accounts", "auth_rate_buckets", "auth_security_events", "auth_outbox"];

if (!process.env.DATABASE_URL || process.env.M007_RLS_HARNESS !== "authorized") {
  console.log("SKIP: set DATABASE_URL and M007_RLS_HARNESS=authorized for the disposable, approved PostgreSQL RLS harness.");
  process.exit(0);
}

const { default: postgres } = await import("postgres");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const state = await sql`select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = any(${tables})`;
  if (state.length !== tables.length || state.some((row) => !row.relrowsecurity || !row.relforcerowsecurity)) throw new Error("M007_RLS_NOT_FORCED_ON_ALL_TABLES");
  const publicGrants = await sql`select table_name from information_schema.role_table_grants where table_schema = 'public' and grantee = 'PUBLIC' and table_name = any(${tables})`;
  if (publicGrants.length) throw new Error("M007_PUBLIC_TABLE_GRANT_PRESENT");
  const policies = await sql`select tablename from pg_policies where schemaname = 'public' and roles @> array['atlas_auth_gateway'] and tablename = any(${tables})`;
  if (new Set(policies.map((row) => row.tablename)).size !== tables.length) throw new Error("M007_GATEWAY_POLICY_MISSING");
  await sql.begin(async (transaction) => {
    await transaction.unsafe("set local role atlas_auth_gateway");
    await transaction.unsafe("set local atlas.auth_context_verified = ''");
    const invisible = await transaction.unsafe("select count(*)::int as count from auth_accounts");
    if (Number(invisible[0]?.count) !== 0) throw new Error("M007_RLS_CONTEXT_BYPASS");
  });
  console.log("PASS: M007 0025/0026/0027 RLS policies and restricted-role context checks hold for all auth tables.");
} finally {
  await sql.end({ timeout: 5 });
}
