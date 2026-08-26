import type { DashboardLocale } from "@atlas/dashboard";
export function resolveDashboardLocale(
  cookieLocale?: string,
  configuredDefault?: string,
): DashboardLocale {
  if (cookieLocale === "en" || cookieLocale === "es") return cookieLocale;
  return configuredDefault === "en" ? "en" : "es";
}
