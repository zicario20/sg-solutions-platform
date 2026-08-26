import type { DashboardLocale } from "@atlas/dashboard";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_CONTEXT_COOKIE, DASHBOARD_SESSION_COOKIE } from "./auth-context.ts";
import {
  createConfiguredDashboardRuntime,
  type DashboardHttpDependencies,
} from "./configured-runtime.ts";
import { resolveDashboardLocale } from "./locale.ts";
import {
  createDashboardSsrAdmissionRequest,
  loadAdmittedClientDashboard,
} from "./ssr-admission.ts";

export async function authorizeDashboardPageAccess(
  input: Readonly<{ sessionHandle?: string; requestedContext?: string; locale: DashboardLocale }>,
  runtime: DashboardHttpDependencies,
  admissionRequest: Request,
): Promise<
  | Readonly<{ kind: "authorized"; locale: DashboardLocale }>
  | Readonly<{ kind: "denied" | "unavailable" }>
> {
  if (!input.sessionHandle) return { kind: "denied" };
  try {
    const result = await loadAdmittedClientDashboard(
      {
        sessionHandle: input.sessionHandle,
        ...(input.requestedContext ? { requestedContext: input.requestedContext } : {}),
        locale: input.locale,
      },
      runtime,
      admissionRequest,
    );
    if (result.kind === "rate_limited") return { kind: "unavailable" };
    return result.kind === "ok"
      ? { kind: "authorized", locale: result.dto.locale }
      : { kind: "denied" };
  } catch {
    return { kind: "unavailable" };
  }
}

export async function requireDashboardPageContext(
  runtime: DashboardHttpDependencies = createConfiguredDashboardRuntime(),
) {
  const store = await cookies();
  const locale = resolveDashboardLocale(
    store.get("atlas_locale")?.value,
    runtime.defaultLocale ?? process.env.ATLAS_DEFAULT_LOCALE,
  );
  const access = await authorizeDashboardPageAccess(
    {
      sessionHandle: store.get(DASHBOARD_SESSION_COOKIE)?.value,
      requestedContext: store.get(DASHBOARD_CONTEXT_COOKIE)?.value,
      locale,
    },
    runtime,
    createDashboardSsrAdmissionRequest(await headers(), runtime.canonicalOrigin),
  );
  if (access.kind === "unavailable") redirect("/client?availability=unavailable");
  if (access.kind !== "authorized") redirect("/client/sign-in");
  return Object.freeze({ locale: access.locale });
}
