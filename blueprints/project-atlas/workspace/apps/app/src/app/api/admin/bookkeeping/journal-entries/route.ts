import * as crypto from "node:crypto";

import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import {
  admitClientBookkeepingRequest,
  validBookkeepingMutationProof,
} from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

type JournalLine = {
  accountRef: string;
  debitMinor: number;
  creditMinor: number;
  memo?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJournalLine = (value: unknown): value is JournalLine => {
  if (!isRecord(value)) return false;
  return (
    typeof value.accountRef === "string" &&
    Number.isSafeInteger(value.debitMinor) &&
    Number.isSafeInteger(value.creditMinor) &&
    (value.memo === undefined || typeof value.memo === "string")
  );
};

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
    permission: "admin.bookkeeping.post",
  });
  if (permission.kind !== "allowed") {
    return Response.json({ error: "forbidden" }, { status: 403, headers: privateHeaders });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || !Array.isArray(body.lines) || body.lines.length > 100) return invalid();
  if (
    typeof body.bookRef !== "string" ||
    typeof body.periodRef !== "string" ||
    typeof body.idempotencyKey !== "string" ||
    !/^[A-Za-z0-9_.:-]{1,128}$/u.test(body.idempotencyKey) ||
    (body.memo !== undefined && typeof body.memo !== "string") ||
    !body.lines.every(isJournalLine)
  )
    return invalid();

  const idempotencyHash = crypto
    .createHash("sha256")
    .update(
      `${admitted.actor.accountId}:${admitted.actor.contextRef}:${body.bookRef}:${body.periodRef}:${body.idempotencyKey}`,
    )
    .digest("hex");
  const entryRef = `je_${idempotencyHash.slice(0, 32)}`;
  const correlationId = `m031_post_${idempotencyHash.slice(0, 32)}`;
  const result = await runtime.gateway.postJournalEntry({
    actor: admitted.actor,
    entryRef,
    bookRef: body.bookRef,
    periodRef: body.periodRef,
    correlationId,
    memo: body.memo,
    lines: body.lines,
  });

  const status = result.kind === "posted" ? 201 : result.kind === "invalid" ? 400 : 409;
  return Response.json(result, { status, headers: privateHeaders });
}
