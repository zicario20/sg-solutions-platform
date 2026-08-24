import { AdminDashboardView } from "@atlas/ui";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { loadConfiguredAdminDashboard } from "../../lib/admin-dashboard/runtime.ts";
import { DASHBOARD_SESSION_COOKIE } from "../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../lib/dashboard/locale.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function AdminDashboardPage() {
  const store = await cookies();
  const locale = resolveDashboardLocale(
    store.get("atlas_locale")?.value,
    process.env.ATLAS_DEFAULT_LOCALE,
  );
  const sessionHandle = store.get(DASHBOARD_SESSION_COOKIE)?.value;
  if (!sessionHandle) redirect("/client/sign-in");
  const result = await loadConfiguredAdminDashboard({ sessionHandle, locale });
  if (result.kind !== "authorized") notFound();
  return <AdminDashboardView dto={result.dto} />;
}
