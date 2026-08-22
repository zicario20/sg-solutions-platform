import type { ClientDashboardQueryRequest, ClientDashboardQueryResult } from "@atlas/dashboard";
import type { DashboardHttpDependencies } from "./configured-runtime.ts";

export type AdmittedDashboardResult = ClientDashboardQueryResult | Readonly<{ kind: "rate_limited" }>;

export function createDashboardSsrAdmissionRequest(source: Pick<Headers, "get">, canonicalOrigin: string): Request {
  const trustedCandidates = new Headers();
  for (const name of ["x-forwarded-for", "x-real-ip"] as const) {
    const value = source.get(name);
    if (value) trustedCandidates.set(name, value);
  }
  return new Request(canonicalOrigin || "https://dashboard.invalid", { headers: trustedCandidates });
}

export async function loadAdmittedClientDashboard(
  input: ClientDashboardQueryRequest,
  runtime: DashboardHttpDependencies,
  admissionRequest: Request,
): Promise<AdmittedDashboardResult> {
  if (!runtime.admit) return { kind: "rate_limited" };
  try {
    if (await runtime.admit("dashboard_ssr", admissionRequest) !== "accepted") return { kind: "rate_limited" };
    return await runtime.query(input);
  } catch {
    return { kind: "rate_limited" };
  }
}
