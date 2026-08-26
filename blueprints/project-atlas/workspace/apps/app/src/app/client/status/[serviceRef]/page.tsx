import { CLIENT_SERVICE_REF_PATTERN } from "@atlas/client-services";
import { ClientPortalShell, ProcessStatusState, ProcessStatusView } from "@atlas/ui";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getConfiguredProcessStatusRuntime } from "../../../../lib/process-status/configured-runtime.ts";
import { loadProcessStatusPage } from "../../../../lib/process-status/page-context.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ serviceRef: string }>;
  searchParams: Promise<{ timelineCursor?: string }>;
}) {
  const { serviceRef } = await params;
  if (!CLIENT_SERVICE_REF_PATTERN.test(serviceRef)) notFound();
  const query = await searchParams,
    store = await cookies(),
    locale = store.get("atlas_locale")?.value === "en" ? "en" : "es",
    url = new URL(
      (process.env.AUTH_CANONICAL_ORIGIN ?? "https://localhost") +
        "/client/status/" +
        encodeURIComponent(serviceRef),
    );
  if (query.timelineCursor) url.searchParams.set("timelineCursor", query.timelineCursor);
  const result = await loadProcessStatusPage(
    new Request(url, { headers: await headers() }),
    await getConfiguredProcessStatusRuntime(),
    serviceRef,
  );
  if (result.kind === "denied") redirect("/client/sign-in");
  if (result.kind === "not_found") notFound();
  if (result.kind !== "ok" || result.dto.schemaVersion !== "m010.detail.v1")
    return (
      <ClientPortalShell locale={locale} activeRoute="status">
        <ProcessStatusState locale={locale} state="unavailable" />
      </ClientPortalShell>
    );
  return (
    <ClientPortalShell locale={locale} activeRoute="status" contextType={result.dto.context.type}>
      <ProcessStatusView locale={locale} dto={result.dto} />
    </ClientPortalShell>
  );
}
