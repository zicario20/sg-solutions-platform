import {
  createConfiguredProfileRuntime,
  resolveProfileActor,
} from "../../../../lib/client-profile/runtime.ts";
import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_CSRF_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  readDashboardCookie,
} from "../../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../../lib/dashboard/locale.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const headers = {
  "cache-control": "private, no-store, max-age=0",
  pragma: "no-cache",
  vary: "Cookie",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers });
async function admission(request: Request) {
  const runtime = createConfiguredProfileRuntime();
  if (runtime.kind !== "ready") return { kind: "unavailable" as const, runtime };
  const sessionHandle = readDashboardCookie(request, DASHBOARD_SESSION_COOKIE);
  if (!sessionHandle) return { kind: "denied" as const, runtime };
  const actor = await resolveProfileActor(runtime, {
    sessionHandle,
    requestedContext: readDashboardCookie(request, DASHBOARD_CONTEXT_COOKIE),
    locale: resolveDashboardLocale(undefined, process.env.ATLAS_DEFAULT_LOCALE),
  });
  return actor
    ? { kind: "authorized" as const, runtime, actor, sessionHandle }
    : { kind: "denied" as const, runtime };
}
export async function GET(request: Request) {
  const input = await admission(request);
  if (input.kind === "unavailable") return respond({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return respond({ error: "not_found" }, 404);
  const result = await input.runtime.service.selfService(input.actor);
  return result ? respond(result) : respond({ error: "not_found" }, 404);
}
export async function POST(request: Request) {
  const input = await admission(request);
  if (input.kind === "unavailable") return respond({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return respond({ error: "not_found" }, 404);
  const csrf = request.headers.get("x-atlas-csrf") ?? "";
  if (
    request.headers.get("origin") !== input.runtime.canonicalOrigin ||
    readDashboardCookie(request, DASHBOARD_CSRF_COOKIE) !== csrf ||
    !input.runtime.dashboard.verifyCsrf(input.sessionHandle, csrf)
  )
    return respond({ error: "invalid_request" }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json")
    return respond({ error: "invalid_request" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 2048)
    return respond({ error: "invalid_request" }, 413);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ error: "invalid_request" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return respond({ error: "invalid_request" }, 400);
  const value = body as {
    action?: unknown;
    goalCode?: unknown;
    noticeVersion?: unknown;
    noticeAccepted?: unknown;
  };
  if (
    value.action !== "submit_goal" ||
    typeof value.goalCode !== "string" ||
    value.noticeVersion !== "m015-self-service-v1" ||
    value.noticeAccepted !== true
  )
    return respond({ error: "invalid_request" }, 400);
  const result = await input.runtime.service.submitSelfServiceGoal(
    input.actor,
    resolveDashboardLocale(undefined, process.env.ATLAS_DEFAULT_LOCALE),
    value.goalCode as import("@atlas/client-profile").SelfServiceGoalCode,
    value.noticeVersion,
  );
  return result ? respond(result, 201) : respond({ error: "invalid_request" }, 400);
}
