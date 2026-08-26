import { ClientPortalShell, ProcessStatusLanding } from "@atlas/ui";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getConfiguredProcessStatusRuntime } from "../../../lib/process-status/configured-runtime.ts";
import { loadProcessStatusPage } from "../../../lib/process-status/page-context.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const store = await cookies(),
    locale = store.get("atlas_locale")?.value === "en" ? "en" : "es",
    params = await searchParams,
    url = new URL(`${process.env.AUTH_CANONICAL_ORIGIN ?? "https://localhost"}/client/status`);
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  const result = await loadProcessStatusPage(
    new Request(url, { headers: await headers() }),
    await getConfiguredProcessStatusRuntime(),
  );
  if (result.kind === "denied") redirect("/client/sign-in");
  const dto =
    result.kind === "ok" && result.dto.schemaVersion === "m010.landing.v1"
      ? result.dto
      : {
          schemaVersion: "m010.landing.v1" as const,
          availability: "unavailable" as const,
          context: { type: "personal" as const, label: locale === "en" ? "Personal" : "Personal" },
          choices: [],
          hasMore: false,
        };
  return (
    <ClientPortalShell locale={locale} activeRoute="status" contextType={dto.context.type}>
      <ProcessStatusLanding locale={locale} dto={dto} />
    </ClientPortalShell>
  );
}
