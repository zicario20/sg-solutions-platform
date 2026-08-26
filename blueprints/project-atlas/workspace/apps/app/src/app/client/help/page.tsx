import { ProviderDisabledPortalPage } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";
export default async function Page() {
  const { locale } = await requireDashboardPageContext();
  return <ProviderDisabledPortalPage locale={locale} route="help" />;
}
