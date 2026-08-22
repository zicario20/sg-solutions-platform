import { DashboardErrorView, DashboardView } from "@atlas/ui";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_CONTEXT_COOKIE, DASHBOARD_CSRF_COOKIE, DASHBOARD_SESSION_COOKIE } from "../../lib/dashboard/auth-context.ts";
import { createConfiguredDashboardRuntime } from "../../lib/dashboard/configured-runtime.ts";
import { resolveDashboardLocale } from "../../lib/dashboard/locale.ts";
import { createDashboardAnalyticsConfig } from "../../lib/dashboard/dashboard-analytics-config.ts";
import { DashboardAnalytics } from "./DashboardAnalytics.tsx";
import { createDashboardSsrAdmissionRequest, loadAdmittedClientDashboard } from "../../lib/dashboard/ssr-admission.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClientPage({ searchParams }: { searchParams: Promise<{ availability?: string }> }) {
  const cookieStore = await cookies();
  const locale = resolveDashboardLocale(cookieStore.get("atlas_locale")?.value, process.env.ATLAS_DEFAULT_LOCALE);
  if ((await searchParams).availability === "unavailable") return <DashboardErrorView locale={locale} />;
  const sessionHandle = cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value;
  if (!sessionHandle) redirect("/client/sign-in");
  const requestedContext = cookieStore.get(DASHBOARD_CONTEXT_COOKIE)?.value;
  const runtime = createConfiguredDashboardRuntime();
  const result = await loadAdmittedClientDashboard({ sessionHandle, ...(requestedContext ? { requestedContext } : {}), locale }, runtime, createDashboardSsrAdmissionRequest(await headers(), runtime.canonicalOrigin));
  if (result.kind === "rate_limited") return <DashboardErrorView locale={locale} />;
  if (result.kind === "denied") redirect("/client/sign-in");
  if (result.kind === "retry_required") return <DashboardErrorView locale={locale} />;
  const csrfToken = cookieStore.get(DASHBOARD_CSRF_COOKIE)?.value;
  return <><DashboardView dto={result.dto} csrfToken={csrfToken} />{csrfToken ? <DashboardAnalytics csrfToken={csrfToken} events={createDashboardAnalyticsConfig(result.dto)} /> : null}</>;
}
