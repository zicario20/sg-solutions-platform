import type { ClientServicesAuthPort } from "@atlas/client-services";
import {
  createDashboardAuthorizationSnapshot,
  type DashboardAuthorizationSnapshot,
  type DashboardAuthPort,
  revalidateDashboardAuthorization,
} from "@atlas/dashboard";
import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  readDashboardCookie,
} from "../dashboard/auth-context.ts";

function locale(request: Request): "es" | "en" {
  return readDashboardCookie(request, "atlas_locale") === "en" ? "en" : "es";
}
export function createM007M008ClientServicesAuthAdapter(
  authPort: DashboardAuthPort,
): ClientServicesAuthPort {
  return {
    async authorize({ request, contextOpaqueRef }) {
      if (!(request instanceof Request)) return { kind: "denied" };
      const sessionHandle = readDashboardCookie(request, DASHBOARD_SESSION_COOKIE);
      if (!sessionHandle) return { kind: "denied" };
      const requestedContext =
        contextOpaqueRef ?? readDashboardCookie(request, DASHBOARD_CONTEXT_COOKIE);
      const result = await createDashboardAuthorizationSnapshot(
        {
          sessionHandle,
          ...(requestedContext ? { requestedContext } : {}),
          locale: locale(request),
        },
        authPort,
      );
      return result.kind === "authorized" ? result : { kind: "denied" };
    },
    async revalidate(snapshot: DashboardAuthorizationSnapshot) {
      return (await revalidateDashboardAuthorization(snapshot, authPort)).kind === "authorized";
    },
  };
}
