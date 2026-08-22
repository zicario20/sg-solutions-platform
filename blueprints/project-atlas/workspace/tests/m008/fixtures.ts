import {
  DASHBOARD_OWNER_CODES,
  type DashboardAuthPort,
  type DashboardAuthorizationEvidence,
  type DashboardAuthorizationSnapshot,
  type DashboardDto,
  type DashboardOwnerCode,
  type DashboardOwnerFragment,
  type DashboardOwnerPorts,
} from "@atlas/dashboard";

export const syntheticEvidence: DashboardAuthorizationEvidence = Object.freeze({
  accountId: "synthetic-account-a",
  sessionId: "synthetic-session-id-a",
  sessionFamilyId: "synthetic-family-a",
  userId: "synthetic-user-a",
  accountStatus: "active",
  sessionStatus: "active",
  sessionExpiresAt: "2099-08-21T13:00:00.000Z",
  assurance: "aal1",
  authenticationEpoch: "1",
  authorizationEpoch: "1",
  policyEpoch: "1",
  context: Object.freeze({ type: "personal" as const, opaqueRef: "synthetic-context-a" }),
  contextOptions: Object.freeze([{ type: "personal" as const, opaqueRef: "synthetic-context-a", label: "Personal" }]),
  membershipFence: "synthetic-membership-1",
  resourceGrantFence: "synthetic-grant-1",
  entitlementFence: "synthetic-entitlement-1",
  policyVersion: "synthetic-policy-1",
});

export function snapshot(): DashboardAuthorizationSnapshot {
  return { schemaVersion: "m008.auth.v2", ...syntheticEvidence, locale: "es", capturedAt: new Date("2026-08-21T12:00:00.000Z") };
}

export function dto(): DashboardDto {
  const unavailable = { state: "unavailable" as const, safeReason: "provider_disabled" as const };
  return { locale: "es", context: { type: "personal", selectedOpaqueRef: "synthetic-context-a", options: syntheticEvidence.contextOptions }, priority: { kind: "none", policyVersion: "m008.v1" }, importantAlerts: unavailable, security: unavailable, services: unavailable, tasks: unavailable, documents: unavailable, appointments: unavailable, payments: unavailable, messages: unavailable, notifications: unavailable, help: unavailable };
}

const emptyFragment = (owner: DashboardOwnerCode, snapshotId: string): DashboardOwnerFragment => Object.freeze({
  owner,
  snapshotId,
  sourceVersion: `${owner}.synthetic.v1`,
  classification: "client_safe",
  state: "empty",
  asOf: "2026-08-21T12:00:00.000Z",
});

export function syntheticOwnerPorts(): DashboardOwnerPorts {
  return Object.fromEntries(DASHBOARD_OWNER_CODES.map((owner) => [owner, Object.freeze({
    owner,
    query: async ({ snapshotId }: { readonly snapshotId: string }) => emptyFragment(owner, snapshotId),
  })])) as unknown as DashboardOwnerPorts;
}

export function syntheticAuthPort(mode: "allowed" | "revoked" = "allowed"): DashboardAuthPort {
  return Object.freeze({
    authorize: async ({ sessionHandle, requestedContext }) =>
      sessionHandle === "valid-session" && (!requestedContext || requestedContext === "synthetic-context-a")
        ? { kind: "authorized" as const, evidence: syntheticEvidence }
        : { kind: "denied" as const },
    revalidate: async (_snapshot: DashboardAuthorizationSnapshot) => mode === "allowed"
      ? { kind: "authorized" as const, evidence: syntheticEvidence }
      : { kind: "denied" as const },
    selectContext: async () => ({ kind: "denied" as const }),
  });
}
