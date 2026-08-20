import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

export const communicationsRuntimeRoleNames = Object.freeze({
  gateway: "atlas_communications_gateway",
  runtime: "atlas_communications_runtime",
});

export function assertLoopbackCommunicationsDatabaseUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!new Set(["127.0.0.1", "localhost", "::1", "[::1]"]).has(url.hostname)) {
    throw new Error("COMMUNICATIONS_LOCAL_PROVISION_REQUIRES_LOOPBACK_DATABASE");
  }
  return url;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function provisionCommunicationsRuntime(input: {
  adminUrl: string;
  runtimePassword: string;
}): Promise<void> {
  assertLoopbackCommunicationsDatabaseUrl(input.adminUrl);
  if (input.runtimePassword.length < 32) {
    throw new Error("ATLAS_COMMUNICATIONS_RUNTIME_PASSWORD_MUST_HAVE_AT_LEAST_32_CHARACTERS");
  }

  const sql = postgres(input.adminUrl, { max: 1, prepare: false });
  try {
    const gateway = await sql<
      Array<{
        exists: boolean;
        rolcanlogin: boolean | null;
        rolbypassrls: boolean | null;
        rolsuper: boolean | null;
      }>
    >`
      select
        count(*) = 1 as exists,
        bool_or(rolcanlogin) as rolcanlogin,
        bool_or(rolbypassrls) as rolbypassrls,
        bool_or(rolsuper) as rolsuper
      from pg_roles
      where rolname = ${communicationsRuntimeRoleNames.gateway}
    `;
    const gatewayRole = gateway[0];
    if (
      !gatewayRole?.exists ||
      gatewayRole.rolcanlogin ||
      gatewayRole.rolbypassrls ||
      gatewayRole.rolsuper
    ) {
      throw new Error("COMMUNICATIONS_GATEWAY_ROLE_NOT_MIGRATED_OR_UNSAFE");
    }

    const runtime = await sql<Array<{ exists: boolean }>>`
      select exists(
        select 1 from pg_roles where rolname = ${communicationsRuntimeRoleNames.runtime}
      ) as exists
    `;
    const runtimeName = quoteIdentifier(communicationsRuntimeRoleNames.runtime);
    const password = quoteLiteral(input.runtimePassword);
    if (!runtime[0]?.exists) {
      await sql.unsafe(
        `CREATE ROLE ${runtimeName} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
      );
    } else {
      await sql.unsafe(
        `ALTER ROLE ${runtimeName} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
      );
    }

    const databases = await sql<Array<{ database_name: string }>>`
      select current_database() as database_name
    `;
    const databaseName = databases[0]?.database_name;
    if (!databaseName) throw new Error("COMMUNICATIONS_DATABASE_NAME_UNAVAILABLE");
    const database = quoteIdentifier(databaseName);
    const gatewayName = quoteIdentifier(communicationsRuntimeRoleNames.gateway);

    const directMemberships = await sql<Array<{ member_name: string; role_name: string }>>`
      select member.rolname as member_name, granted.rolname as role_name
      from pg_auth_members membership
      join pg_roles member on member.oid = membership.member
      join pg_roles granted on granted.oid = membership.roleid
      where member.rolname in (
        ${communicationsRuntimeRoleNames.runtime},
        ${communicationsRuntimeRoleNames.gateway}
      )
    `;
    for (const membership of directMemberships) {
      await sql.unsafe(
        `REVOKE ${quoteIdentifier(membership.role_name)} FROM ${quoteIdentifier(membership.member_name)}`,
      );
    }

    await sql.unsafe(`REVOKE ALL ON DATABASE ${database} FROM ${runtimeName}`);
    await sql.unsafe(`GRANT CONNECT ON DATABASE ${database} TO ${runtimeName}`);
    await sql.unsafe(`REVOKE ALL ON SCHEMA public FROM ${runtimeName}`);
    await sql.unsafe(`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${runtimeName}`);
    await sql.unsafe(`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${runtimeName}`);
    await sql.unsafe(`GRANT ${gatewayName} TO ${runtimeName}`);
    await sql.unsafe(`REVOKE ADMIN OPTION FOR ${gatewayName} FROM ${runtimeName}`);

    const publicGateway = await sql<Array<{ exists: boolean }>>`
      select exists(select 1 from pg_roles where rolname = 'atlas_public_chat_gateway') as exists
    `;
    if (publicGateway[0]?.exists) {
      await sql.unsafe(`REVOKE "atlas_public_chat_gateway" FROM ${runtimeName}`);
    }

    const closure = await sql<Array<{ admin_path: boolean; role_name: string }>>`
      with recursive role_closure(roleid, admin_path, path) as (
        select membership.roleid, membership.admin_option,
          array[membership.member, membership.roleid]::oid[]
        from pg_auth_members membership
        where membership.member = (
          select oid from pg_roles where rolname = ${communicationsRuntimeRoleNames.runtime}
        )
        union all
        select membership.roleid,
          role_closure.admin_path or membership.admin_option,
          role_closure.path || membership.roleid
        from role_closure
        join pg_auth_members membership on membership.member = role_closure.roleid
        where not membership.roleid = any(role_closure.path)
      )
      select granted.rolname as role_name, bool_or(role_closure.admin_path) as admin_path
      from role_closure
      join pg_roles granted on granted.oid = role_closure.roleid
      group by granted.rolname
      order by granted.rolname
    `;
    if (
      closure.length !== 1 ||
      closure[0]?.role_name !== communicationsRuntimeRoleNames.gateway ||
      closure[0].admin_path
    ) {
      throw new Error("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
    }

    const gatewayClosure = await sql<Array<{ role_name: string }>>`
      with recursive role_closure(roleid, path) as (
        select membership.roleid, array[membership.member, membership.roleid]::oid[]
        from pg_auth_members membership
        where membership.member = (
          select oid from pg_roles where rolname = ${communicationsRuntimeRoleNames.gateway}
        )
        union all
        select membership.roleid, role_closure.path || membership.roleid
        from role_closure
        join pg_auth_members membership on membership.member = role_closure.roleid
        where not membership.roleid = any(role_closure.path)
      )
      select granted.rolname as role_name
      from role_closure
      join pg_roles granted on granted.oid = role_closure.roleid
    `;
    if (gatewayClosure.length !== 0) {
      throw new Error("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && resolve(entry) === resolve(fileURLToPath(import.meta.url)));
}

if (isMainModule()) {
  const environment = process.env;
  const adminUrl = environment.DIRECT_DATABASE_URL;
  const runtimePassword = environment.ATLAS_COMMUNICATIONS_RUNTIME_PASSWORD;
  if (!adminUrl) throw new Error("DIRECT_DATABASE_URL_REQUIRED");
  if (!runtimePassword) throw new Error("ATLAS_COMMUNICATIONS_RUNTIME_PASSWORD_REQUIRED");
  await provisionCommunicationsRuntime({ adminUrl, runtimePassword });
  console.log("COMMUNICATIONS_LOCAL_RUNTIME_ROLE_PROVISIONED");
}
