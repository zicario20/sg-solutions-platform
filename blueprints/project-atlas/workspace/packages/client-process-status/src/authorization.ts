import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";
import type { AuthorizedProcessRoot } from "./ports.ts";
export function isProcessRootAuthorized(
  snapshot: DashboardAuthorizationSnapshot,
  root: Pick<AuthorizedProcessRoot, "ownerAccountId" | "ownerContextRef" | "grant" | "entitlement">,
  now = new Date(),
): boolean {
  const rank = { aal1: 1, aal2: 2 } as const;
  return (
    snapshot.accountStatus === "active" &&
    snapshot.sessionStatus === "active" &&
    Date.parse(snapshot.sessionExpiresAt) > now.getTime() &&
    root.ownerAccountId === snapshot.accountId &&
    root.ownerContextRef === snapshot.context.opaqueRef &&
    root.grant.permission === "client.service.read" &&
    root.grant.state === "active" &&
    root.entitlement.state === "active" &&
    String(root.grant.authorizationEpoch) === String(snapshot.authorizationEpoch) &&
    String(root.grant.policyEpoch) === String(snapshot.policyEpoch) &&
    String(root.entitlement.authorizationEpoch) === String(snapshot.authorizationEpoch) &&
    String(root.entitlement.policyEpoch) === String(snapshot.policyEpoch) &&
    rank[snapshot.assurance] >= rank[root.grant.minimumAssurance] &&
    (!root.grant.expiresAt || Date.parse(root.grant.expiresAt) > now.getTime()) &&
    (!root.entitlement.expiresAt || Date.parse(root.entitlement.expiresAt) > now.getTime())
  );
}
