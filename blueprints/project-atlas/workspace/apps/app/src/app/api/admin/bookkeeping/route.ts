import {
  admitBookkeepingRequest,
  bookkeepingResponse,
  readBookkeepingCommand,
  validBookkeepingMutationProof,
} from "../../client/bookkeeping/admission.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const text = (value: unknown, maximum = 256) =>
  typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\r\n]/u.test(value)
    ? value
    : undefined;

async function authorize(
  input: Extract<Awaited<ReturnType<typeof admitBookkeepingRequest>>, { kind: "authorized" }>,
  permission: "admin.bookkeeping.report" | "admin.bookkeeping.close",
) {
  return input.runtime.permissions.authorize({
    accountId: input.actor.accountId,
    assurance: input.actor.assurance,
    permission,
  });
}

export async function GET(request: Request) {
  const input = await admitBookkeepingRequest(request);
  if (input.kind === "unavailable")
    return bookkeepingResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return bookkeepingResponse({ error: "not_found" }, 404);
  if ((await authorize(input, "admin.bookkeeping.report")).kind !== "allowed")
    return bookkeepingResponse({ error: "not_found" }, 404);
  const bookRef = new URL(request.url).searchParams.get("bookRef");
  return bookRef
    ? bookkeepingResponse(
        await input.runtime.gateway.getTrialBalance({ actor: input.actor, bookRef }),
      )
    : bookkeepingResponse({
        items: await input.runtime.gateway.listAuthorizedBooks({ actor: input.actor }),
      });
}

export async function POST(request: Request) {
  const input = await admitBookkeepingRequest(request);
  if (input.kind === "unavailable")
    return bookkeepingResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return bookkeepingResponse({ error: "not_found" }, 404);
  if (!validBookkeepingMutationProof(request, input))
    return bookkeepingResponse({ error: "invalid_request" }, 403);
  if ((await authorize(input, "admin.bookkeeping.close")).kind !== "allowed")
    return bookkeepingResponse({ error: "not_found" }, 404);
  const command = await readBookkeepingCommand(request);
  if (command.kind !== "ok") return bookkeepingResponse({ error: "invalid_request" }, 400);
  const action = text(command.value.action, 32);
  if (action === "request_close") {
    const bookRef = text(command.value.bookRef, 128);
    const periodRef = text(command.value.periodRef, 128);
    const reason = text(command.value.reason, 512);
    if (!bookRef || !periodRef) return bookkeepingResponse({ error: "invalid_request" }, 400);
    return bookkeepingResponse(
      await input.runtime.gateway.requestPeriodClose({
        actor: input.actor,
        requestRef: crypto.randomUUID(),
        bookRef,
        periodRef,
        reason,
      }),
      201,
    );
  }
  if (action === "approve_close") {
    const requestRef = text(command.value.requestRef, 128);
    const correlationId = text(command.value.correlationId, 128);
    if (!requestRef || !correlationId)
      return bookkeepingResponse({ error: "invalid_request" }, 400);
    return bookkeepingResponse(
      await input.runtime.gateway.approvePeriodClose({
        actor: input.actor,
        requestRef,
        reviewerAccountId: input.actor.accountId,
        correlationId,
      }),
    );
  }
  return bookkeepingResponse({ error: "invalid_request" }, 400);
}
