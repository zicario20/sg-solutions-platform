export const CLIENT_SERVICES_ANALYTICS_EVENTS = ["client_services_health_list", "client_services_health_detail", "client_services_health_filtered", "client_services_health_unavailable"] as const;
export type ClientServicesAnalyticsEventName = (typeof CLIENT_SERVICES_ANALYTICS_EVENTS)[number];
export type ClientServicesAnalyticsOutcome = "available" | "empty" | "unavailable" | "not_found" | "denied" | "retry_required";
export interface ClientServicesAnalyticsMetadata { locale?: "es" | "en"; outcome: ClientServicesAnalyticsOutcome; filterUsed?: boolean }
export interface ClientServicesAnalyticsEvent extends ClientServicesAnalyticsMetadata { event: ClientServicesAnalyticsEventName }

export function createClientServicesAnalyticsEvent(event: ClientServicesAnalyticsEventName, metadata: ClientServicesAnalyticsMetadata): ClientServicesAnalyticsEvent {
  if (!CLIENT_SERVICES_ANALYTICS_EVENTS.includes(event)) throw new TypeError("Unsupported M009 analytics event");
  const input = metadata as unknown as Record<string, unknown>;
  for (const key of Object.keys(input)) if (!["locale", "outcome", "filterUsed"].includes(key)) throw new TypeError(`Analytics field ${key} is not allowed`);
  if (metadata.locale !== undefined && metadata.locale !== "es" && metadata.locale !== "en") throw new TypeError("Invalid locale");
  if (!["available", "empty", "unavailable", "not_found", "denied", "retry_required"].includes(metadata.outcome)) throw new TypeError("Invalid outcome");
  if (metadata.filterUsed !== undefined && typeof metadata.filterUsed !== "boolean") throw new TypeError("Invalid filter flag");
  return { event, ...(metadata.locale ? { locale: metadata.locale } : {}), outcome: metadata.outcome, ...(metadata.filterUsed === undefined ? {} : { filterUsed: metadata.filterUsed }) };
}
