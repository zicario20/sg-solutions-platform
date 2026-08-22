import {
  DASHBOARD_OWNER_CODES,
  type DashboardOwnerCode,
  type DashboardOwnerPorts,
} from "@atlas/dashboard";

export function createUnavailableDashboardOwnerPorts(): DashboardOwnerPorts {
  return Object.fromEntries(DASHBOARD_OWNER_CODES.map((owner: DashboardOwnerCode) => [owner, Object.freeze({
    owner,
    query: async ({ snapshotId }: { readonly snapshotId: string }) => Object.freeze({
      owner,
      snapshotId,
      sourceVersion: `${owner}.provider-disabled.v1`,
      classification: "client_safe" as const,
      state: "unavailable" as const,
      safeReason: "provider_disabled" as const,
    }),
  })])) as unknown as DashboardOwnerPorts;
}
