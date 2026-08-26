import { CLIENT_SERVICE_REF_PATTERN } from "@atlas/client-services";
import { ClientPortalShell, ClientServiceDetail, ClientServiceState } from "@atlas/ui";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getConfiguredClientServicesRuntime } from "../../../../lib/client-services/configured-runtime.ts";
import { loadClientServicesPage } from "../../../../lib/client-services/page-context.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({ params }: { params: Promise<{ serviceRef: string }> }) {
  const { serviceRef } = await params;
  if (!CLIENT_SERVICE_REF_PATTERN.test(serviceRef)) notFound();
  const store = await cookies(),
    locale = store.get("atlas_locale")?.value === "en" ? "en" : "es",
    request = new Request(
      `${process.env.AUTH_CANONICAL_ORIGIN ?? "https://localhost"}/client/services/${encodeURIComponent(serviceRef)}`,
      { headers: await headers() },
    ),
    result = await loadClientServicesPage(
      request,
      await getConfiguredClientServicesRuntime(),
      serviceRef,
    );
  if (result.kind === "denied") redirect("/client/sign-in");
  if (result.kind === "not_found") notFound();
  if (result.kind !== "ok" || result.dto.schemaVersion !== "m009.detail.v2")
    return (
      <ClientPortalShell locale={locale} activeRoute="services" contextType="personal">
        <ClientServiceState locale={locale} state="unavailable" />
      </ClientPortalShell>
    );
  return (
    <ClientPortalShell locale={locale} activeRoute="services" contextType={result.dto.context.type}>
      <ClientServiceDetail locale={locale} detail={result.dto} />
    </ClientPortalShell>
  );
}
