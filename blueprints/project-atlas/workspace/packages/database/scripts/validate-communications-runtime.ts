import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import {
  assertLoopbackCommunicationsDatabaseUrl,
  communicationsRuntimeRoleNames,
} from "./provision-communications-runtime.ts";

export async function validateCommunicationsRuntime(runtimeUrl: string): Promise<void> {
  assertLoopbackCommunicationsDatabaseUrl(runtimeUrl);
  const sql = postgres(runtimeUrl, { max: 1, prepare: false });
  try {
    const principals = await sql<
      Array<{
        current_user: string;
        communications_member: boolean;
        public_chat_member: boolean;
        rolbypassrls: boolean;
        rolinherit: boolean;
        rolsuper: boolean;
      }>
    >`
      select
        current_user,
        pg_has_role(current_user, ${communicationsRuntimeRoleNames.gateway}, 'member')
          as communications_member,
        case
          when exists(select 1 from pg_roles where rolname = 'atlas_public_chat_gateway')
            then pg_has_role(current_user, 'atlas_public_chat_gateway', 'member')
          else false
        end as public_chat_member,
        rolbypassrls,
        rolinherit,
        rolsuper
      from pg_roles
      where rolname = current_user
    `;
    const principal = principals[0];
    if (
      principal?.current_user !== communicationsRuntimeRoleNames.runtime ||
      !principal.communications_member ||
      principal.public_chat_member ||
      principal.rolbypassrls ||
      principal.rolinherit ||
      principal.rolsuper
    ) {
      throw new Error("COMMUNICATIONS_RUNTIME_PRINCIPAL_UNSAFE");
    }

    const closure = await sql<Array<{ admin_path: boolean; role_name: string }>>`
      with recursive role_closure(roleid, admin_path, path) as (
        select membership.roleid, membership.admin_option,
          array[membership.member, membership.roleid]::oid[]
        from pg_auth_members membership
        where membership.member = (
          select oid from pg_roles where rolname = current_user
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

    let directAccessDenied = false;
    try {
      await sql`select count(*) from communication_channel_connections`;
    } catch {
      directAccessDenied = true;
    }
    if (!directAccessDenied) throw new Error("COMMUNICATIONS_RUNTIME_HAS_UNSCOPED_DIRECT_ACCESS");

    await sql.begin(async (tx) => {
      await tx.unsafe(`set local role ${communicationsRuntimeRoleNames.gateway}`);
      const role = await tx<Array<{ current_role: string }>>`select current_role`;
      if (role[0]?.current_role !== communicationsRuntimeRoleNames.gateway) {
        throw new Error("COMMUNICATIONS_RUNTIME_SET_ROLE_FAILED");
      }
      await tx`select count(*) from communication_channel_connections`;
      await tx`select count(*) from communication_conversations`;
    });

    let publicSessionDenied = false;
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${communicationsRuntimeRoleNames.gateway}`);
        await tx`select count(*) from public_chat_sessions`;
      });
    } catch {
      publicSessionDenied = true;
    }
    if (!publicSessionDenied) {
      throw new Error("COMMUNICATIONS_RUNTIME_CAN_ACCESS_PUBLIC_CHAT_SESSIONS");
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
  const runtimeUrl = process.env.COMMUNICATIONS_DATABASE_URL;
  if (!runtimeUrl) throw new Error("COMMUNICATIONS_DATABASE_URL_REQUIRED");
  await validateCommunicationsRuntime(runtimeUrl);
  console.log("COMMUNICATIONS_RUNTIME_PRINCIPAL_VALID");
}
