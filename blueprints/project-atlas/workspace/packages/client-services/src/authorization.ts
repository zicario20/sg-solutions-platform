import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";

import type { ClientServiceRootProjection } from "./ports.ts";

export const CLIENT_SERVICE_READ_PERMISSION = "client.service.read" as const;

export function isClientServiceAuthorized(snapshot: DashboardAuthorizationSnapshot, root: ClientServiceRootProjection, now = new Date()): boolean {
  return snapshot.accountStatus === "active"
    && snapshot.sessionStatus === "active"
    && new Date(snapshot.sessionExpiresAt).getTime() > now.getTime()
    && root.grant.permission === CLIENT_SERVICE_READ_PERMISSION
    && root.grant.state === "active"
    && root.ownerAccountId === root.grant.accountId
    && root.ownerContextOpaqueRef === root.grant.contextOpaqueRef
    && root.grant.accountId === snapshot.accountId
    && root.grant.contextOpaqueRef === snapshot.context.opaqueRef
    && String(root.grant.authorizationEpoch) === String(snapshot.authorizationEpoch)
    && String(root.grant.policyEpoch) === String(snapshot.policyEpoch)
    && root.grant.resourceEpoch === root.resourceEpoch
    && (root.grant.expiresAt === undefined || new Date(root.grant.expiresAt).getTime() > now.getTime());
}
