import type {
  DashboardAuthorizationSnapshot,
  DashboardOwnerCode,
  DashboardOwnerDataMap,
  DashboardOwnerFragment,
} from "./contracts.ts";

export type DashboardOwnerPort<K extends DashboardOwnerCode = DashboardOwnerCode> = Readonly<{
  owner: K;
  query(input: Readonly<{
    snapshot: DashboardAuthorizationSnapshot;
    snapshotId: string;
    limit: number;
    signal: AbortSignal;
  }>): Promise<DashboardOwnerFragment<K>>;
}>;

export type DashboardOwnerPorts = Readonly<{
  [K in DashboardOwnerCode]: DashboardOwnerPort<K>;
}>;

export type DashboardOwnerProjection<K extends DashboardOwnerCode> = DashboardOwnerDataMap[K];
