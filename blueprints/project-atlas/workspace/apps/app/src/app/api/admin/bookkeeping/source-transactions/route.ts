import * as crypto from "node:crypto";

import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import {
  admitClientBookkeepingRequest,
  validBookkeepingMutationProof,
} from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value);

const invalid = () =>
  Response.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });

export async function POST(request: Request) {
  const runtime = resolveBookkeepingRuntime();
  if (runtime.kind !== "ready") {
    return Response.json(
      { error: "bookkeeping_unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
  if (!(await validBookkeepingMutationProof(request, runtime))) {
    return Response.json({ error: "forbidden" }, { status: 403, headers: privateHeaders });
  }

  const admitted = await admitClientBookkeepingRequest(request, runtime);
  if (admitted.kind !== "authorized") {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }
  const permission = await runtime.permissions.authorize({
    accountId: admitted.actor.accountId,
    assurance: admitted.actor.assurance,
    permission: "admin.bookkeeping.manage",
  });
  if (permission.kind !== "allowed") {
    return Response.json({ error: "forbidden" }, { status: 403, headers: privateHeaders });
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    !isRecord(body) ||
    typeof body.bookRef !== "string" ||
    typeof body.financialAccountRef !== "string" ||
    typeof body.sourceReference !== "string" ||
    typeof body.occurredOn !== "string" ||
    !isSafeInteger(body.amountMinor) ||
    typeof body.direction !== "string" ||
    (body.direction !== "inflow" && body.direction !== "outflow") ||
    typeof body.description !== "string"
  )
    return invalid();

  const occurredOn = new Date(body.occurredOn);
  if (!Number.isFinite(occurredOn.getTime())) return invalid();
  const transactionHash = crypto
    .createHash("sha256")
    .update(
      `${admitted.actor.accountId}:${admitted.actor.contextRef}:${body.financialAccountRef}:${body.sourceReference}`,
    )
    .digest("hex");
  const result = await runtime.gateway.recordSourceTransaction({
    actor: admitted.actor,
    transactionRef: `st_${transactionHash.slice(0, 32)}`,
    bookRef: body.bookRef,
    financialAccountRef: body.financialAccountRef,
    sourceReference: body.sourceReference,
    occurredOn,
    amountMinor: body.amountMinor,
    direction: body.direction as "inflow" | "outflow",
    description: body.description,
  });
  const status = result.kind === "created" ? 201 : result.kind === "existing" ? 200 : 400;
  return Response.json(result, { status, headers: privateHeaders });
}
