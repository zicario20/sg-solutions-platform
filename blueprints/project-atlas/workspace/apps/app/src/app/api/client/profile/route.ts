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
const MAX_BODY_BYTES = 2048;
const isSafeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);
async function readBoundedJson(
  request: Request,
): Promise<Readonly<{ kind: "ok"; value: unknown }> | Readonly<{ kind: "invalid" | "too_large" }>> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) return { kind: "invalid" };
    if (length > MAX_BODY_BYTES) return { kind: "too_large" };
  }
  if (!request.body) return { kind: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { kind: "too_large" };
      }
      chunks.push(next.value);
    }
  } catch {
    return { kind: "invalid" };
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { kind: "ok", value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { kind: "invalid" };
  }
}
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
  return result
    ? respond({
        ...result,
        homeBuyingFinancialAvailable: input.runtime.homeBuyingFinancialAvailable,
      })
    : respond({ error: "not_found" }, 404);
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
  const parsed = await readBoundedJson(request);
  if (parsed.kind === "too_large") return respond({ error: "invalid_request" }, 413);
  if (parsed.kind !== "ok") return respond({ error: "invalid_request" }, 400);
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body))
    return respond({ error: "invalid_request" }, 400);
  const value = body as {
    action?: unknown;
    goalCode?: unknown;
    noticeVersion?: unknown;
    noticeAccepted?: unknown;
    monthlyGrossIncomeMinor?: unknown;
    monthlyRecurringDebtMinor?: unknown;
    currency?: unknown;
    cadence?: unknown;
    acknowledgementVersion?: unknown;
    acknowledgementAccepted?: unknown;
  };
  if (value.action === "submit_home_buying_financial_proposal") {
    if (!input.runtime.homeBuyingFinancialAvailable)
      return respond({ error: "temporarily_unavailable" }, 503);
    if (
      !isSafeInteger(value.monthlyGrossIncomeMinor) ||
      !isSafeInteger(value.monthlyRecurringDebtMinor) ||
      value.currency !== "USD" ||
      value.cadence !== "monthly" ||
      value.acknowledgementVersion !== "m015-home-buying-financial-v1" ||
      value.acknowledgementAccepted !== true
    )
      return respond({ error: "invalid_request" }, 400);
    const result = await input.runtime.service.submitHomeBuyingFinancialProposal(
      input.actor,
      {
        monthlyGrossIncomeMinor: value.monthlyGrossIncomeMinor,
        monthlyRecurringDebtMinor: value.monthlyRecurringDebtMinor,
        currency: "USD",
        cadence: "monthly",
        acknowledgementVersion: "m015-home-buying-financial-v1",
      },
      resolveDashboardLocale(undefined, process.env.ATLAS_DEFAULT_LOCALE),
    );
    return result ? respond(result, 201) : respond({ error: "invalid_request" }, 400);
  }
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
