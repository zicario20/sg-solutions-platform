import postgres from "postgres";

const RUNTIME_ROLE = "atlas_public_chat_runtime";
const GATEWAY_ROLE = "atlas_public_chat_gateway";

export function assertLoopbackDatabaseUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!new Set(["127.0.0.1", "localhost", "::1", "[::1]"]).has(url.hostname)) {
    throw new Error("PUBLIC_CHAT_LOCAL_PROVISION_REQUIRES_LOOPBACK_DATABASE");
  }
  return url;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

const environment = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env;
const adminUrl = environment?.DIRECT_DATABASE_URL;
const runtimePassword = environment?.ATLAS_CHAT_RUNTIME_PASSWORD;
if (!adminUrl) throw new Error("DIRECT_DATABASE_URL_REQUIRED");
if (!runtimePassword || runtimePassword.length < 32) {
  throw new Error("ATLAS_CHAT_RUNTIME_PASSWORD_MUST_HAVE_AT_LEAST_32_CHARACTERS");
}
assertLoopbackDatabaseUrl(adminUrl);

const sql = postgres(adminUrl, { max: 1, prepare: false });
try {
  const gateway = await sql<Array<{ exists: boolean }>>`
    select exists(select 1 from pg_roles where rolname = ${GATEWAY_ROLE}) as exists
  `;
  if (!gateway[0]?.exists) throw new Error("PUBLIC_CHAT_GATEWAY_ROLE_NOT_MIGRATED");

  const runtime = await sql<Array<{ exists: boolean }>>`
    select exists(select 1 from pg_roles where rolname = ${RUNTIME_ROLE}) as exists
  `;
  const password = quoteLiteral(runtimePassword);
  if (!runtime[0]?.exists) {
    await sql.unsafe(
      `CREATE ROLE ${RUNTIME_ROLE} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
    );
  } else {
    await sql.unsafe(
      `ALTER ROLE ${RUNTIME_ROLE} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
    );
  }

  const databases = await sql<Array<{ database_name: string }>>`
    select current_database() as database_name
  `;
  const databaseName = databases[0]?.database_name;
  if (!databaseName) throw new Error("PUBLIC_CHAT_DATABASE_NAME_UNAVAILABLE");
  const database = quoteIdentifier(databaseName);
  await sql.unsafe(`REVOKE ALL ON DATABASE ${database} FROM ${RUNTIME_ROLE}`);
  await sql.unsafe(`GRANT CONNECT ON DATABASE ${database} TO ${RUNTIME_ROLE}`);
  await sql.unsafe(`REVOKE ALL ON SCHEMA public FROM ${RUNTIME_ROLE}`);
  await sql.unsafe(`GRANT ${GATEWAY_ROLE} TO ${RUNTIME_ROLE}`);
  console.log("PUBLIC_CHAT_LOCAL_RUNTIME_ROLE_PROVISIONED");
} finally {
  await sql.end({ timeout: 5 });
}
