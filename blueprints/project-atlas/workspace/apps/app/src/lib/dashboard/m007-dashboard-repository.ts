import type { AuthSql } from "@atlas/database";
import type {
  M007DashboardAuthProjection,
  M007DashboardAuthRepository,
  M007DashboardOrganization,
} from "./m007-auth-adapter.ts";

type ProjectionRow = Readonly<{
  session_id: string;
  account_id: string;
  family_id: string;
  session_state: M007DashboardAuthProjection["sessionStatus"];
  account_status: M007DashboardAuthProjection["accountStatus"];
  assurance: "aal1" | "aal2";
  idle_expires_at: Date;
  absolute_expires_at: Date;
  authentication_epoch: number;
  authorization_epoch: number;
  policy_epoch: number;
  party_link_state: M007DashboardAuthProjection["partyLinkState"];
  party_link_version: number;
  organization_contexts: unknown;
  preferred_organization_id: string | null;
}>;
function organizationContexts(value: unknown): readonly M007DashboardOrganization[] {
  const parsed = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const organizationId = row.organizationId;
    const membershipVersion = Number(row.membershipVersion);
    const entitlementVersion = Number(row.entitlementVersion);
    return typeof organizationId === "string" &&
      Number.isSafeInteger(membershipVersion) &&
      Number.isSafeInteger(entitlementVersion)
      ? [{ organizationId, membershipVersion, entitlementVersion }]
      : [];
  });
}
function projection(row: ProjectionRow | undefined): M007DashboardAuthProjection | undefined {
  if (!row) return undefined;
  return {
    sessionId: row.session_id,
    accountId: row.account_id,
    sessionFamilyId: row.family_id,
    sessionStatus: row.session_state,
    accountStatus: row.account_status,
    assurance: row.assurance,
    idleExpiresAt: new Date(row.idle_expires_at),
    absoluteExpiresAt: new Date(row.absolute_expires_at),
    authenticationEpoch: Number(row.authentication_epoch),
    authorizationEpoch: Number(row.authorization_epoch),
    policyEpoch: Number(row.policy_epoch),
    partyLinkState: row.party_link_state,
    partyLinkVersion: Number(row.party_link_version),
    organizations: organizationContexts(row.organization_contexts),
    ...(row.preferred_organization_id
      ? { preferredOrganizationId: row.preferred_organization_id }
      : {}),
  };
}
export function createPostgresM007DashboardAuthRepository(
  sql: AuthSql,
): M007DashboardAuthRepository {
  const load = async (lookup: string, bySessionId: boolean, now: Date) =>
    sql.begin(async (transaction) =>
      projection(
        (
          await transaction.unsafe<readonly ProjectionRow[]>(
            "select * from public.atlas_m008_dashboard_auth_projection($1,$2,$3)",
            [lookup, bySessionId, now],
          )
        )[0],
      ),
    );
  return Object.freeze({
    loadBySessionHandleDigest: (digest, now) => load(digest, false, now),
    loadBySessionId: (sessionId, now) => load(sessionId, true, now),
    persistPreferredContext: async (input) =>
      sql.begin(
        async (transaction) =>
          (
            await transaction.unsafe<readonly { selected: boolean }[]>(
              "select public.atlas_m008_dashboard_select_context($1,$2,$3,$4,$5,$6,$7) as selected",
              [
                input.sessionId,
                input.accountId,
                input.organizationId ?? null,
                input.authenticationEpoch,
                input.authorizationEpoch,
                input.policyEpoch,
                input.now,
              ],
            )
          )[0]?.selected === true,
      ),
    admitDashboard: async (input) =>
      input.keyDigests.length > 0 &&
      sql.begin(
        async (transaction) =>
          (
            await transaction.unsafe<readonly { admitted: boolean }[]>(
              "select public.atlas_m008_dashboard_admit($1,$2,$3) as admitted",
              [input.action, input.keyDigests, input.now],
            )
          )[0]?.admitted === true,
      ),
  });
}
