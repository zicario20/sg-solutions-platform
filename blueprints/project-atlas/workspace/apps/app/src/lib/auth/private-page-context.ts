import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createConfiguredDashboardRuntime } from "../dashboard/configured-runtime.ts";
import { authorizeDashboardPageAccess } from "../dashboard/page-context.ts";
import { createDashboardSsrAdmissionRequest } from "../dashboard/ssr-admission.ts";
import { readAuthPageContext } from "./locale.ts";

export async function requirePrivateAuthPageContext(routeLocale?: string | null, outcome?: string | null) {
  const context = await readAuthPageContext(routeLocale, outcome);
  const runtime = createConfiguredDashboardRuntime();
  const access = await authorizeDashboardPageAccess(
    { sessionHandle: context.sessionHandle, locale: context.locale },
    runtime,
    createDashboardSsrAdmissionRequest(await headers(), runtime.canonicalOrigin),
  );
  if (access.kind === "unavailable") redirect("/client?availability=unavailable");
  if (access.kind !== "authorized") redirect("/client/sign-in");
  return context;
}
