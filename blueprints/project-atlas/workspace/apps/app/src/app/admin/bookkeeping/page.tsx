import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createConfiguredBookkeepingRuntime } from "../../../lib/bookkeeping/runtime.ts";
import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_SESSION_COOKIE,
} from "../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../lib/dashboard/locale.ts";
import { BookkeepingAdminClient } from "./BookkeepingAdminClient.tsx";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookkeepingAdminPage() {
  const store = await cookies();
  const sessionHandle = store.get(DASHBOARD_SESSION_COOKIE)?.value;
  if (!sessionHandle) redirect("/client/sign-in");
  const runtime = createConfiguredBookkeepingRuntime();
  if (runtime.kind !== "ready") notFound();
  const locale = resolveDashboardLocale(
    store.get("atlas_locale")?.value,
    process.env.ATLAS_DEFAULT_LOCALE,
  );
  const decision = await runtime.resolveActor({
    sessionHandle,
    requestedContext: store.get(DASHBOARD_CONTEXT_COOKIE)?.value,
    locale,
  });
  if (decision.kind !== "authorized") notFound();
  const access = await runtime.permissions.authorize({
    accountId: decision.actor.accountId,
    assurance: decision.actor.assurance,
    permission: "admin.bookkeeping.report",
  });
  if (access.kind !== "allowed") notFound();
  return <BookkeepingAdminClient locale={locale} />;
}
