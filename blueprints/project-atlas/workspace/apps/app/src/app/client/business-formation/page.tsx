import { ProviderDisabledPortalPage } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Formation is intentionally not exposed as an executable client workflow until
 * its provider, requirements registry, approvals, and filing controls are live.
 */
export default async function BusinessFormationPage() {
  const { locale } = await requireDashboardPageContext();
  return <ProviderDisabledPortalPage locale={locale} route="services" />;
}
