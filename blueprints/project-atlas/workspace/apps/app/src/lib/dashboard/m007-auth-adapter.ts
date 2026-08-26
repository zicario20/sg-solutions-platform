import { createHmac, timingSafeEqual } from "node:crypto";
import { digestOpaqueProof } from "@atlas/auth";
import type {
  DashboardAuthorizationEvidence,
  DashboardAuthorizationSnapshot,
  DashboardAuthPort,
  DashboardContextOption,
  DashboardLocale,
} from "@atlas/dashboard";

export type M007DashboardOrganization = Readonly<{
  organizationId: string;
  membershipVersion: number;
  entitlementVersion: number;
}>;
export type M007DashboardAuthProjection = Readonly<{
  sessionId: string;
  accountId: string;
  sessionFamilyId: string;
  sessionStatus: "active" | "rotating" | "rotated" | "revoked" | "expired" | "risk_blocked";
  accountStatus: "pending_verification" | "limited" | "active" | "suspended" | "closed";
  assurance: "aal1" | "aal2";
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  authenticationEpoch: number;
  authorizationEpoch: number;
  policyEpoch: number;
  partyLinkState: "active" | "manual_review" | "conflict" | "revoked";
  partyLinkVersion: number;
  organizations: readonly M007DashboardOrganization[];
  preferredOrganizationId?: string;
}>;
export type M007DashboardAuthRepository = Readonly<{
  loadBySessionHandleDigest(
    handleDigest: string,
    now: Date,
  ): Promise<M007DashboardAuthProjection | undefined>;
  loadBySessionId(sessionId: string, now: Date): Promise<M007DashboardAuthProjection | undefined>;
  persistPreferredContext(
    input: Readonly<{
      sessionId: string;
      accountId: string;
      organizationId?: string;
      authenticationEpoch: number;
      authorizationEpoch: number;
      policyEpoch: number;
      now: Date;
    }>,
  ): Promise<boolean>;
  admitDashboard?(
    input: Readonly<{
      action: "dashboard_get" | "dashboard_context" | "dashboard_analytics" | "dashboard_ssr";
      keyDigests: readonly string[];
      now: Date;
    }>,
  ): Promise<boolean>;
}>;

type ResolvedContext = Readonly<{
  type: "personal" | "organization";
  opaqueRef: string;
  organizationId?: string;
  membershipVersion: number;
  entitlementVersion: number;
}>;
const validEpoch = (value: number) => Number.isSafeInteger(value) && value > 0;
function available(projection: M007DashboardAuthProjection, now: Date): boolean {
  return (
    projection.accountStatus === "active" &&
    projection.sessionStatus === "active" &&
    projection.partyLinkState === "active" &&
    projection.idleExpiresAt.getTime() > now.getTime() &&
    projection.absoluteExpiresAt.getTime() > now.getTime() &&
    (projection.assurance === "aal1" || projection.assurance === "aal2") &&
    validEpoch(projection.authenticationEpoch) &&
    validEpoch(projection.authorizationEpoch) &&
    validEpoch(projection.policyEpoch) &&
    validEpoch(projection.partyLinkVersion)
  );
}
function opaqueContext(
  secret: string,
  type: "personal" | "organization",
  internalId: string,
): string {
  return `ctx_${createHmac("sha256", secret).update(`m008\u0000${type}\u0000${internalId}`, "utf8").digest("base64url")}`;
}
function equalOpaque(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function contexts(
  projection: M007DashboardAuthProjection,
  secret: string,
): readonly ResolvedContext[] {
  const personal: ResolvedContext = {
    type: "personal",
    opaqueRef: opaqueContext(secret, "personal", projection.accountId),
    membershipVersion: projection.partyLinkVersion,
    entitlementVersion: projection.authorizationEpoch,
  };
  const organizations = projection.organizations
    .filter((item) => validEpoch(item.membershipVersion) && validEpoch(item.entitlementVersion))
    .slice(0, 9)
    .map((item) => ({
      type: "organization" as const,
      opaqueRef: opaqueContext(secret, "organization", item.organizationId),
      organizationId: item.organizationId,
      membershipVersion: item.membershipVersion,
      entitlementVersion: item.entitlementVersion,
    }));
  return Object.freeze([personal, ...organizations]);
}
function labels(
  locale: DashboardLocale,
  values: readonly ResolvedContext[],
): readonly DashboardContextOption[] {
  let organization = 0;
  return Object.freeze(
    values.map((value) =>
      Object.freeze({
        opaqueRef: value.opaqueRef,
        type: value.type,
        label:
          value.type === "personal"
            ? locale === "es"
              ? "Personal"
              : "Personal"
            : `${locale === "es" ? "Organización" : "Organization"} ${++organization}`,
      }),
    ),
  );
}
function selectedContext(
  projection: M007DashboardAuthProjection,
  values: readonly ResolvedContext[],
  requested?: string,
): ResolvedContext | undefined {
  if (requested) return values.find((value) => equalOpaque(value.opaqueRef, requested));
  if (projection.preferredOrganizationId) {
    const preferred = values.find(
      (value) => value.organizationId === projection.preferredOrganizationId,
    );
    if (preferred) return preferred;
  }
  return values[0];
}
function evidence(
  projection: M007DashboardAuthProjection,
  secret: string,
  locale: DashboardLocale,
  requested?: string,
): DashboardAuthorizationEvidence | undefined {
  const values = contexts(projection, secret);
  const selected = selectedContext(projection, values, requested);
  if (!selected) return undefined;
  return Object.freeze({
    accountId: projection.accountId,
    sessionId: projection.sessionId,
    sessionFamilyId: projection.sessionFamilyId,
    userId: projection.accountId,
    accountStatus: "active",
    sessionStatus: "active",
    sessionExpiresAt: new Date(
      Math.min(projection.idleExpiresAt.getTime(), projection.absoluteExpiresAt.getTime()),
    ).toISOString(),
    assurance: projection.assurance,
    authenticationEpoch: String(projection.authenticationEpoch),
    authorizationEpoch: String(projection.authorizationEpoch),
    policyEpoch: String(projection.policyEpoch),
    context: Object.freeze({ type: selected.type, opaqueRef: selected.opaqueRef }),
    contextOptions: labels(locale, values),
    membershipFence: `${selected.type}:${selected.membershipVersion}`,
    resourceGrantFence: `party:${projection.partyLinkVersion}:access:${projection.authorizationEpoch}`,
    entitlementFence: `${selected.type}:${selected.entitlementVersion}`,
    policyVersion: `m008.auth.p${projection.policyEpoch}`,
  });
}

export function createM007DashboardAuthPort(
  repository: M007DashboardAuthRepository,
  contextHmacSecret: string,
): DashboardAuthPort {
  if (contextHmacSecret.length < 32) throw new Error("DASHBOARD_CONTEXT_SECRET_INVALID");
  return Object.freeze({
    authorize: async ({ sessionHandle, requestedContext, locale, now }) => {
      const projection = await repository.loadBySessionHandleDigest(
        digestOpaqueProof(sessionHandle),
        now,
      );
      if (!projection || !available(projection, now)) return { kind: "denied" as const };
      const resolved = evidence(projection, contextHmacSecret, locale, requestedContext);
      return resolved
        ? { kind: "authorized" as const, evidence: resolved }
        : { kind: "denied" as const };
    },
    revalidate: async (snapshot: DashboardAuthorizationSnapshot) => {
      const now = new Date();
      const projection = await repository.loadBySessionId(snapshot.sessionId, now);
      if (!projection || !available(projection, now)) return { kind: "denied" as const };
      const resolved = evidence(
        projection,
        contextHmacSecret,
        snapshot.locale,
        snapshot.context.opaqueRef,
      );
      return resolved
        ? { kind: "authorized" as const, evidence: resolved }
        : { kind: "denied" as const };
    },
    selectContext: async ({ sessionHandle, requestedContext, now }) => {
      const projection = await repository.loadBySessionHandleDigest(
        digestOpaqueProof(sessionHandle),
        now,
      );
      if (!projection || !available(projection, now)) return { kind: "denied" as const };
      const selected = selectedContext(
        projection,
        contexts(projection, contextHmacSecret),
        requestedContext,
      );
      if (!selected) return { kind: "denied" as const };
      const persisted = await repository.persistPreferredContext({
        sessionId: projection.sessionId,
        accountId: projection.accountId,
        ...(selected.organizationId ? { organizationId: selected.organizationId } : {}),
        authenticationEpoch: projection.authenticationEpoch,
        authorizationEpoch: projection.authorizationEpoch,
        policyEpoch: projection.policyEpoch,
        now,
      });
      return persisted
        ? { kind: "selected" as const, contextHandle: selected.opaqueRef }
        : { kind: "denied" as const };
    },
  });
}
