import * as crypto from "node:crypto";

import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import {
  admitClientBookkeepingRequest,
  validBookkeepingMutationProof,
} from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

const accountTypes = new Set(["bank", "credit_card", "loan", "cash", "other"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
    typeof body.accountName !== "string" ||
    typeof body.accountType !== "string" ||
    !accountTypes.has(body.accountType) ||
    typeof body.idempotencyKey !== "string" ||
    !/^[A-Za-z0-9_.:-]{1,128}$/u.test(body.idempotencyKey)
  )
    return invalid();

  const referenceHash = crypto
    .createHash("sha256")
    .update(
      `${admitted.actor.accountId}:${admitted.actor.contextRef}:${body.bookRef}:${body.idempotencyKey}`,
    )
    .digest("hex");
  const result = await runtime.gateway.registerFinancialAccount({
    actor: admitted.actor,
    financialAccountRef: `fa_${referenceHash.slice(0, 32)}`,
    bookRef: body.bookRef,
    accountName: body.accountName,
    accountType: body.accountType as "bank" | "credit_card" | "loan" | "cash" | "other",
  });
  const status = result.kind === "created" ? 201 : result.kind === "existing" ? 200 : 400;
  return Response.json(result, { status, headers: privateHeaders });
}
