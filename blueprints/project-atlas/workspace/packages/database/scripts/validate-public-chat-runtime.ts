import postgres from "postgres";

const environment = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env;
const runtimeUrl = environment?.CHAT_DATABASE_URL;
if (!runtimeUrl) throw new Error("CHAT_DATABASE_URL_REQUIRED");
const parsed = new URL(runtimeUrl);
if (!new Set(["127.0.0.1", "localhost", "::1", "[::1]"]).has(parsed.hostname)) {
  throw new Error("PUBLIC_CHAT_LOCAL_VALIDATION_REQUIRES_LOOPBACK_DATABASE");
}

const sql = postgres(runtimeUrl, { max: 1, prepare: false });
try {
  const principals = await sql<
    Array<{
      current_user: string;
      is_member: boolean;
      rolbypassrls: boolean;
      rolsuper: boolean;
    }>
  >`
    select
      current_user,
      pg_has_role(current_user, 'atlas_public_chat_gateway', 'member') as is_member,
      rolbypassrls,
      rolsuper
    from pg_roles
    where rolname = current_user
  `;
  const principal = principals[0];
  if (
    principal?.current_user !== "atlas_public_chat_runtime" ||
    !principal.is_member ||
    principal.rolbypassrls ||
    principal.rolsuper
  ) {
    throw new Error("PUBLIC_CHAT_RUNTIME_PRINCIPAL_UNSAFE");
  }

  let directAccessDenied = false;
  try {
    await sql`select count(*) from public_chat_sessions`;
  } catch {
    directAccessDenied = true;
  }
  if (!directAccessDenied) throw new Error("PUBLIC_CHAT_RUNTIME_HAS_UNSCOPED_DIRECT_ACCESS");

  await sql.begin(async (tx) => {
    await tx.unsafe("set local role atlas_public_chat_gateway");
    await tx`select count(*) from public_chat_sessions`;
    await tx`select count(*) from public_chat_rate_limits`;
  });
  console.log("PUBLIC_CHAT_RUNTIME_PRINCIPAL_VALID");
} finally {
  await sql.end({ timeout: 5 });
}
