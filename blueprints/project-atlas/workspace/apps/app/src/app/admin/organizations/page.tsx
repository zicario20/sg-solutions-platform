import { OrganizationManagementWorkspaceView } from "@atlas/ui";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DASHBOARD_SESSION_COOKIE } from "../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../lib/dashboard/locale.ts";
import { loadConfiguredOrganizationManagement } from "../../../lib/organization-management/runtime.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function OrganizationManagementPage() {
  const store = await cookies();
  const sessionHandle = store.get(DASHBOARD_SESSION_COOKIE)?.value;
  if (!sessionHandle) redirect("/client/sign-in");
  const locale = resolveDashboardLocale(
    store.get("atlas_locale")?.value,
    process.env.ATLAS_DEFAULT_LOCALE,
  );
  const result = await loadConfiguredOrganizationManagement({ sessionHandle, locale });
  if (result.kind !== "authorized") notFound();
  return <OrganizationManagementWorkspaceView dto={result.dto} />;
}
