import type { DashboardAuthPort } from "@atlas/dashboard";

export const DASHBOARD_SESSION_COOKIE = "__Host-atlas_auth";
export const DASHBOARD_CONTEXT_COOKIE = "__Host-atlas_context";
export const DASHBOARD_CSRF_COOKIE = "__Host-atlas_csrf";

export function readDashboardCookie(request: Request, name: string): string | undefined {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!raw) return undefined;
  try {
    const value = decodeURIComponent(raw);
    return value && value.length <= 256 && !/[\r\n;]/u.test(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function createDashboardContextCookie(handle: string): string {
  if (!handle || handle.length > 256 || /[\r\n;]/u.test(handle))
    throw new Error("DASHBOARD_CONTEXT_HANDLE_INVALID");
  return `${DASHBOARD_CONTEXT_COOKIE}=${encodeURIComponent(handle)}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function createUnavailableDashboardAuthPort(): DashboardAuthPort {
  return Object.freeze({
    authorize: async () => ({ kind: "denied" as const }),
    revalidate: async () => ({ kind: "denied" as const }),
    selectContext: async () => ({ kind: "denied" as const }),
  });
}
