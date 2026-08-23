import { ClientPortalShell, DocumentPortal } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";
import { getConfiguredDocumentRuntime } from "../../../lib/documents/configured-runtime.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const { locale } = await requireDashboardPageContext();
  const runtime = getConfiguredDocumentRuntime();
  return (
    <ClientPortalShell locale={locale} activeRoute="documents">
      <DocumentPortal
        locale={locale}
        state={runtime.kind === "ready" ? "empty" : "unavailable"}
        documents={[]}
      />
    </ClientPortalShell>
  );
}
