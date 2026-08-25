import { ClientPortalShell, ClientProfilePortal } from "@atlas/ui";
import { cookies } from "next/headers";
import { DASHBOARD_CSRF_COOKIE } from "../../../lib/dashboard/auth-context.ts";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";
export default async function ClientProfilePage() {
  const { locale } = await requireDashboardPageContext();
  return (
    <ClientPortalShell locale={locale} activeRoute="settings">
      <ClientProfilePortal
        locale={locale}
        csrfToken={(await cookies()).get(DASHBOARD_CSRF_COOKIE)?.value}
      />
    </ClientPortalShell>
  );
}
