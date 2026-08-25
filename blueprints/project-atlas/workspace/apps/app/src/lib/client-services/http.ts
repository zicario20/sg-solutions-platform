import { CLIENT_SERVICE_REF_PATTERN, type ClientServiceDetailDto, type ClientServiceListDto, type ClientServicesQueryResult } from "@atlas/client-services";
import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";
import { createClientServicesAnalyticsEvent, type ClientServicesAnalyticsEvent } from "@atlas/observability";

import type { ClientServicesAdmissionAction } from "./admission.ts";

interface ClientServicesHttpQuery {
  list(input: { request: unknown; query?: string; status?: string; limit?: number }): Promise<ClientServicesQueryResult<ClientServiceListDto>>;
  listAuthorized(input: { snapshot: DashboardAuthorizationSnapshot; query?: string; status?: string; limit?: number }): Promise<ClientServicesQueryResult<ClientServiceListDto>>;
  detail(input: { request: unknown; opaqueRef: string }): Promise<ClientServicesQueryResult<ClientServiceDetailDto>>;
}

export interface ClientServicesHttpDependencies {
  admit(action: ClientServicesAdmissionAction, request: Request): Promise<boolean>;
  query?: ClientServicesHttpQuery;
  emitAnalytics?(event: ClientServicesAnalyticsEvent): Promise<void> | void;
}

const PRIVATE_HEADERS = { "cache-control": "private, no-store, max-age=0", "content-type": "application/json; charset=utf-8", pragma: "no-cache" };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: PRIVATE_HEADERS });
}

function hasBody(request: Request): boolean {
  const length = request.headers.get("content-length");
  return length !== null && length !== "0" || request.headers.has("transfer-encoding");
}

function clean(value: string | null, max: number): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= max ? normalized : undefined;
}

async function admitted(action: ClientServicesAdmissionAction, request: Request, dependencies: ClientServicesHttpDependencies): Promise<Response | undefined> {
  try {
    return await dependencies.admit(action, request) ? undefined : json(429, { error: "temporarily_unavailable" });
  } catch {
    return json(429, { error: "temporarily_unavailable" });
  }
}

function result<T>(value: ClientServicesQueryResult<T>): Response {
  if (value.kind === "ok") return json(200, value.dto);
  if (value.kind === "denied") return json(404, { error: "not_found" });
  if (value.kind === "not_found") return json(404, { error: "not_found" });
  if (value.kind === "retry_required") return json(409, { error: "retry_required" });
  return json(503, { error: "temporarily_unavailable" });
}

export async function handleClientServicesListGet(request: Request, dependencies: ClientServicesHttpDependencies): Promise<Response> {
  if (request.method !== "GET") return json(405, { error: "method_not_allowed" });
  if (hasBody(request)) return json(413, { error: "request_too_large" });
  const gate = await admitted("client_services_list_get", request, dependencies);
  if (gate) return gate;
  if (!dependencies.query) return json(503, { error: "temporarily_unavailable" });
  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q"), 80);
  const status = clean(url.searchParams.get("status"), 32);
  const allowedStatuses = ["preliminary", "payment_pending", "pending_review", "approved_to_start", "in_progress", "waiting_client", "waiting_external", "completed", "cancelled", "partially_refunded", "refunded", "disputed", "unconfirmed"];
  if (url.searchParams.get("q") && !query || url.searchParams.get("status") && (!status || !allowedStatuses.includes(status)) || url.searchParams.has("cursor")) return json(400, { error: "invalid_request" });
  const queried = await dependencies.query.list({ request, query, status, limit: 24 });
  const value = queried.kind === "ok" && status ? { kind: "ok" as const, dto: { ...queried.dto, items: queried.dto.items.filter((item) => item.publicState === status) } } : queried;
  const outcome = value.kind === "ok" ? value.dto.items.length ? "available" : "empty" : value.kind === "not_found" ? "not_found" : value.kind;
  try { await dependencies.emitAnalytics?.(createClientServicesAnalyticsEvent(query || status ? "client_services_health_filtered" : "client_services_health_list", { outcome, filterUsed: Boolean(query || status) })); } catch { /* operational health metrics never change the response */ }
  return result(value);
}

export async function handleClientServiceDetailGet(request: Request, opaqueRef: string, dependencies: ClientServicesHttpDependencies): Promise<Response> {
  if (request.method !== "GET") return json(405, { error: "method_not_allowed" });
  if (hasBody(request)) return json(413, { error: "request_too_large" });
  const gate = await admitted("client_services_detail_get", request, dependencies);
  if (gate) return gate;
  if (!dependencies.query) return json(503, { error: "temporarily_unavailable" });
  if (!CLIENT_SERVICE_REF_PATTERN.test(opaqueRef)) return json(404, { error: "not_found" });
  const value = await dependencies.query.detail({ request, opaqueRef });
  const outcome = value.kind === "ok" ? "available" : value.kind;
  try { await dependencies.emitAnalytics?.(createClientServicesAnalyticsEvent(value.kind === "unavailable" ? "client_services_health_unavailable" : "client_services_health_detail", { outcome })); } catch { /* operational health metrics never change the response */ }
  return result(value);
}
