import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const DASHBOARD_RATE_ACTIONS = ["dashboard_get", "dashboard_context", "dashboard_analytics", "dashboard_ssr", "client_services_list_get", "client_services_detail_get", "client_services_ssr"] as const;
export type DashboardRateAction = (typeof DASHBOARD_RATE_ACTIONS)[number];
export type DashboardAdmissionResult = "accepted" | "rate_limited";

export type DashboardAdmissionRepository = Readonly<{
  admitDashboard(input: Readonly<{ action: DashboardRateAction; keyDigests: readonly string[]; now: Date }>): Promise<boolean>;
}>;

export function buildDashboardTrustedRateKeys(
  request: Request,
  action: DashboardRateAction,
  configuration: Readonly<{ hmacKey?: string; trustProxy: boolean }>,
): readonly string[] {
  if (!configuration.trustProxy || !configuration.hmacKey || configuration.hmacKey.length < 32) return [];
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const direct = request.headers.get("x-real-ip")?.trim();
  const network = validNetworkAddress(forwarded) ? forwarded : validNetworkAddress(direct) ? direct : undefined;
  if (!network) return [];
  return Object.freeze([createHmac("sha256", configuration.hmacKey).update(`m008-rate\0${action}\0network\0${network}`, "utf8").digest("base64url")]);
}

function validNetworkAddress(value: string | undefined): value is string { return value !== undefined && value.length <= 64 && isIP(value) !== 0; }
