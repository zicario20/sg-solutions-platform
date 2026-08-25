import type postgres from "postgres";

export type BookkeepingAdministrativePermission =
  | "admin.bookkeeping.manage"
  | "admin.bookkeeping.post"
  | "admin.bookkeeping.close"
  | "admin.bookkeeping.report";

export class PostgresBookkeepingPermissionGateway {
  constructor(private readonly sql: postgres.Sql) {}

  async authorize(input: {
    accountId: string;
    assurance: "aal1" | "aal2";
    permission: BookkeepingAdministrativePermission;
  }) {
    if (input.assurance !== "aal2") return { kind: "denied" as const };
    const grants = await this.sql<{ allowed: boolean }[]>`
      select true as allowed
      from auth_role_assignments assignment
      join auth_role_permissions permission on permission.role_id=assignment.role_id
      where assignment.account_id=${input.accountId} and assignment.state='active'
        and permission.permission=${input.permission}
      limit 1
    `;
    return grants[0]?.allowed ? { kind: "allowed" as const } : { kind: "denied" as const };
  }
}
