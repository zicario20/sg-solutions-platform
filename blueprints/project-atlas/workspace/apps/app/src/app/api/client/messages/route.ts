import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  readDashboardCookie,
} from "../../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../../lib/dashboard/locale.ts";
import { createConfiguredSecureMessagingRuntime } from "../../../../lib/secure-messaging/runtime.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const response = (body: unknown, status = 200) => Response.json(body, { status, headers });
async function actorFor(request: Request) {
  const runtime = createConfiguredSecureMessagingRuntime();
  const sessionHandle = readDashboardCookie(request, DASHBOARD_SESSION_COOKIE);
  if (runtime.kind !== "ready") return { runtime, kind: "unavailable" as const };
  if (!sessionHandle) return { runtime, kind: "denied" as const };
  const actor = await runtime.resolveActor({
    sessionHandle,
    requestedContext: readDashboardCookie(request, DASHBOARD_CONTEXT_COOKIE),
    locale: resolveDashboardLocale(undefined, process.env.ATLAS_DEFAULT_LOCALE),
  });
  return actor.kind === "authorized"
    ? { runtime, kind: "authorized" as const, sessionHandle, actor: actor.actor }
    : { runtime, kind: "denied" as const };
}
export async function GET(request: Request) {
  const admission = await actorFor(request);
  if (admission.kind === "unavailable") return response({ error: "temporarily_unavailable" }, 503);
  if (admission.kind !== "authorized") return response({ error: "not_found" }, 404);
  const conversationRef = new URL(request.url).searchParams.get("conversation");
  if (conversationRef) {
    const result = await admission.runtime.service.getClientConversation({
      actor: admission.actor,
      conversationRef,
    });
    return result.kind === "found" ? response(result) : response({ error: "not_found" }, 404);
  }
  return response(await admission.runtime.service.listClientInbox({ actor: admission.actor }));
}
export async function POST(request: Request) {
  const admission = await actorFor(request);
  if (admission.kind === "unavailable") return response({ error: "temporarily_unavailable" }, 503);
  if (admission.kind !== "authorized") return response({ error: "not_found" }, 404);
  const token = request.headers.get("x-csrf-token") ?? "";
  if (
    request.headers.get("origin") !== admission.runtime.canonicalOrigin ||
    !admission.runtime.verifyCsrf(admission.sessionHandle, token)
  )
    return response({ error: "invalid_request" }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json")
    return response({ error: "invalid_request" }, 415);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return response({ error: "invalid_request" }, 400);
  }
  if (!payload || typeof payload !== "object") return response({ error: "invalid_request" }, 400);
  const input = payload as {
    action?: string;
    subject?: string;
    reason?: import("@atlas/secure-messaging").ConversationReason;
    conversationRef?: string;
    body?: string;
    documentRef?: string;
  };
  if (input.action === "create" && typeof input.subject === "string" && input.reason) {
    try {
      return response(
        await admission.runtime.service.createConversation({
          actor: admission.actor,
          subject: input.subject,
          reason: input.reason,
          locale: "en",
        }),
        201,
      );
    } catch {
      return response({ error: "invalid_request" }, 400);
    }
  }
  if (
    input.action === "send" &&
    typeof input.conversationRef === "string" &&
    typeof input.body === "string"
  )
    return response(
      await admission.runtime.service.sendClientMessage({
        actor: admission.actor,
        conversationRef: input.conversationRef,
        body: input.body,
      }),
    );
  if (
    input.action === "attach_document" &&
    typeof input.conversationRef === "string" &&
    typeof input.documentRef === "string"
  )
    return response(
      await admission.runtime.service.attachDocumentReference({
        actor: admission.actor,
        conversationRef: input.conversationRef,
        documentRef: input.documentRef,
      }),
    );
  return response({ error: "invalid_request" }, 400);
}
