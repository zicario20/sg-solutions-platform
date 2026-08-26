import { ClientPortalShell, ClientServicesDirectory } from "@atlas/ui";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getConfiguredClientServicesRuntime } from "../../../lib/client-services/configured-runtime.ts";
import {
  loadClientServicesPage,
  parseClientServicesListFilters,
} from "../../../lib/client-services/page-context.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const store = await cookies(),
    locale = store.get("atlas_locale")?.value === "en" ? "en" : "es",
    params = await searchParams,
    filters = parseClientServicesListFilters(new URLSearchParams(params)),
    request = new Request(
      `${process.env.AUTH_CANONICAL_ORIGIN ?? "https://localhost"}/client/services?${new URLSearchParams({ ...(filters.query ? { q: filters.query } : {}), ...(filters.status ? { status: filters.status } : {}) }).toString()}`,
      { headers: await headers() },
    ),
    result = await loadClientServicesPage(
      request,
      await getConfiguredClientServicesRuntime(),
      undefined,
      filters,
    );
  if (result.kind === "denied") redirect("/client/sign-in");
  if (result.kind !== "ok" || result.dto.schemaVersion !== "m009.list.v2")
    return (
      <ClientPortalShell locale={locale} activeRoute="services" contextType="personal">
        <ClientServicesDirectory locale={locale} state="unavailable" />
      </ClientPortalShell>
    );
  const state = result.dto.items.length
    ? "ready"
    : filters.query || filters.status
      ? "filter-empty"
      : "empty";
  return (
    <ClientPortalShell locale={locale} activeRoute="services" contextType={result.dto.context.type}>
      <ClientServicesDirectory
        locale={locale}
        state={state}
        context={result.dto.context}
        items={result.dto.items}
        query={filters.query}
        status={filters.status}
      />
    </ClientPortalShell>
  );
}
