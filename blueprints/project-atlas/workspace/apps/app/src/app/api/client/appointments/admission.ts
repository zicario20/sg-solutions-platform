import { createConfiguredAppointmentRuntime } from "../../../../lib/appointments/runtime.ts";
import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_CSRF_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  readDashboardCookie,
} from "../../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../../lib/dashboard/locale.ts";

export const appointmentHeaders = {
  "cache-control": "private, no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};
export const appointmentResponse = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: appointmentHeaders });

export async function admitAppointmentRequest(request: Request) {
  const runtime = createConfiguredAppointmentRuntime();
  const sessionHandle = readDashboardCookie(request, DASHBOARD_SESSION_COOKIE);
  if (runtime.kind !== "ready") return { kind: "unavailable" as const };
  if (!sessionHandle) return { kind: "denied" as const };
  const decision = await runtime.resolveActor({
    sessionHandle,
    requestedContext: readDashboardCookie(request, DASHBOARD_CONTEXT_COOKIE),
    locale: resolveDashboardLocale(
      readDashboardCookie(request, "atlas_locale"),
      process.env.ATLAS_DEFAULT_LOCALE,
    ),
  });
  return decision.kind === "authorized"
    ? {
        kind: "authorized" as const,
        runtime,
        sessionHandle,
        csrfCookie: readDashboardCookie(request, DASHBOARD_CSRF_COOKIE),
        actor: decision.actor,
      }
    : { kind: "denied" as const };
}

export function validMutationProof(
  request: Request,
  input: Extract<Awaited<ReturnType<typeof admitAppointmentRequest>>, { kind: "authorized" }>,
) {
  const token = request.headers.get("x-atlas-csrf") ?? "";
  return (
    request.headers.get("origin") === input.runtime.canonicalOrigin &&
    token.length > 0 &&
    token === input.csrfCookie &&
    input.runtime.verifyCsrf(input.sessionHandle, token)
  );
}

export async function readAppointmentCommand(request: Request) {
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json")
    return { kind: "unsupported" as const };
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > 4096) return { kind: "too_large" as const };
  try {
    const text = await request.text();
    if (text.length > 4096) return { kind: "too_large" as const };
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? { kind: "ok" as const, value: value as Record<string, unknown> }
      : { kind: "invalid" as const };
  } catch {
    return { kind: "invalid" as const };
  }
}
