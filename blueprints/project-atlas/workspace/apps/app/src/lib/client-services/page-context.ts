import {
  CLIENT_SERVICE_PUBLIC_STATES,
  type ClientServiceDetailDto,
  type ClientServiceListDto,
  type ClientServicesQueryResult,
} from "@atlas/client-services";
import type { ClientServicesHttpDependencies } from "./http.ts";

export type ClientServicesPageResult =
  | ClientServicesQueryResult<ClientServiceListDto | ClientServiceDetailDto>
  | { kind: "rate_limited" };
export type ClientServicesListFilters = Readonly<{ query?: string; status?: string }>;
export function parseClientServicesListFilters(params: URLSearchParams): ClientServicesListFilters {
  const rawQuery = params.get("q")?.trim();
  const rawStatus = params.get("status") ?? "";
  const query = rawQuery && rawQuery.length <= 80 ? rawQuery : undefined;
  const status = CLIENT_SERVICE_PUBLIC_STATES.includes(
    rawStatus as (typeof CLIENT_SERVICE_PUBLIC_STATES)[number],
  )
    ? rawStatus
    : undefined;
  return { ...(query ? { query } : {}), ...(status ? { status } : {}) };
}
export async function loadClientServicesPage(
  request: Request,
  runtime: ClientServicesHttpDependencies,
  serviceRef?: string,
  filters?: ClientServicesListFilters,
): Promise<ClientServicesPageResult> {
  try {
    if (!(await runtime.admit("client_services_ssr", request))) return { kind: "rate_limited" };
    if (!runtime.query) return { kind: "unavailable" };
    const normalized = filters ?? parseClientServicesListFilters(new URL(request.url).searchParams);
    return serviceRef
      ? runtime.query.detail({ request, opaqueRef: serviceRef })
      : runtime.query.list({ request, limit: 24, ...normalized });
  } catch {
    return { kind: "unavailable" };
  }
}
