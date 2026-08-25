import type { ClientServiceListDto, ClientServicesQueryResult } from "@atlas/client-services";
import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";

interface ListQuery {
  list(input: { request: unknown; limit: number }): Promise<ClientServicesQueryResult<ClientServiceListDto>>;
}
interface AuthorizedListQuery {
  listAuthorized(input: { snapshot: DashboardAuthorizationSnapshot; limit: number }): Promise<ClientServicesQueryResult<ClientServiceListDto>>;
}

function dashboardFragment(result: ClientServicesQueryResult<ClientServiceListDto>) {
  if (result.kind !== "ok") return { state: "unavailable" as const, classification: "client_safe" as const, safeReason: "source_unavailable" as const };
  if (result.dto.items.length === 0) return { state: "empty" as const, classification: "client_safe" as const, generatedAt: new Date() };
  return { state: "fresh" as const, classification: "client_safe" as const, generatedAt: new Date(), data: result.dto.items.slice(0, 4).map((item) => ({ opaqueRef: item.opaqueRef, title: item.serviceName, statusLabel: item.publicStateLabel, publicState: item.publicState, nextStepLabel: item.nextStepLabel, cta: { routeKey: "services" as const } })) };
}

export async function loadClientServicesDashboardFragment(query: ListQuery, request: unknown) {
  const result = await query.list({ request, limit: 4 });
  return dashboardFragment(result);
}

export async function loadAuthorizedClientServicesDashboardFragment(query: AuthorizedListQuery, snapshot: DashboardAuthorizationSnapshot, limit: number) { return dashboardFragment(await query.listAuthorized({ snapshot, limit })); }

export function createClientServicesDashboardOwnerPort(load: (input: { snapshot: DashboardAuthorizationSnapshot; signal: AbortSignal; limit: number }) => ReturnType<typeof loadClientServicesDashboardFragment>) {
  return Object.freeze({ owner: "services" as const, query: async ({ snapshot, snapshotId, signal, limit }: { readonly snapshot: DashboardAuthorizationSnapshot; readonly snapshotId: string; readonly signal: AbortSignal; readonly limit: number }) => {
    const fragment = await load({ snapshot, signal, limit });
    return Object.freeze({ owner: "services" as const, snapshotId, sourceVersion: "m009.service-order.v2", ...fragment });
  } });
}
