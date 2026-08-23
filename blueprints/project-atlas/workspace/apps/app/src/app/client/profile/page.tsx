import { ClientPortalShell, ClientProfilePortal } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context";
export default async function ClientProfilePage() {
  const { locale } = await requireDashboardPageContext();
  return (
    <ClientPortalShell locale={locale} activeRoute="settings">
      <ClientProfilePortal locale={locale} />
    </ClientPortalShell>
  );
}
