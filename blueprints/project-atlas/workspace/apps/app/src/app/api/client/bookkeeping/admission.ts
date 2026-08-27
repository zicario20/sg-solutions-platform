import {
  type BookkeepingRuntime,
  createConfiguredBookkeepingRuntime,
} from "../../../../lib/bookkeeping/runtime.ts";
import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_CSRF_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  readDashboardCookie,
} from "../../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../../lib/dashboard/locale.ts";

export const bookkeepingHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export const bookkeepingResponse = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: bookkeepingHeaders });

export async function admitBookkeepingRequest(
  request: Request,
  runtime: BookkeepingRuntime = createConfiguredBookkeepingRuntime(),
) {
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

export const admitClientBookkeepingRequest = admitBookkeepingRequest;

export function validBookkeepingMutationProof(
  request: Request,
  input:
    | Extract<Awaited<ReturnType<typeof admitBookkeepingRequest>>, { kind: "authorized" }>
    | Extract<BookkeepingRuntime, { kind: "ready" }>,
) {
  const runtime = input.kind === "ready" ? input : input.runtime;
  const sessionHandle =
    input.kind === "ready"
      ? readDashboardCookie(request, DASHBOARD_SESSION_COOKIE)
      : input.sessionHandle;
  const token = request.headers.get("x-atlas-csrf") ?? "";
  if (!sessionHandle) return false;
  return (
    request.headers.get("origin") === runtime.canonicalOrigin &&
    token.length > 0 &&
    token === readDashboardCookie(request, DASHBOARD_CSRF_COOKIE) &&
    runtime.verifyCsrf(sessionHandle, token)
  );
}

export async function readBookkeepingCommand(request: Request) {
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json")
    return { kind: "unsupported" as const };
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > 2048) return { kind: "too_large" as const };
  try {
    const text = await request.text();
    if (text.length > 2048) return { kind: "too_large" as const };
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? { kind: "ok" as const, value: value as Record<string, unknown> }
      : { kind: "invalid" as const };
  } catch {
    return { kind: "invalid" as const };
  }
}
