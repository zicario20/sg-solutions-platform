import { createHash } from "node:crypto";

import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import {
  admitClientBookkeepingRequest,
  validBookkeepingMutationProof,
} from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};
const safeReference = (value: unknown) =>
  typeof value === "string" && /^[A-Za-z0-9_.:-]{1,128}$/u.test(value) ? value : undefined;
const invalid = () =>
  Response.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });

export async function POST(request: Request) {
  const runtime = resolveBookkeepingRuntime();
  if (runtime.kind !== "ready")
    return Response.json(
      { error: "bookkeeping_unavailable" },
      { status: 503, headers: privateHeaders },
    );
  if (!(await validBookkeepingMutationProof(request, runtime)))
    return Response.json({ error: "forbidden" }, { status: 403, headers: privateHeaders });
  const admitted = await admitClientBookkeepingRequest(request, runtime);
  if (admitted.kind !== "authorized")
    return Response.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  const permission = await runtime.permissions.authorize({
    accountId: admitted.actor.accountId,
    assurance: admitted.actor.assurance,
    permission: "admin.bookkeeping.manage",
  });
  if (permission.kind !== "allowed")
    return Response.json({ error: "forbidden" }, { status: 403, headers: privateHeaders });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  const idempotencyKey = safeReference(value.idempotencyKey);
  const engagementRef = safeReference(value.engagementRef);
  const bookRef = safeReference(value.bookRef);
  const caseNumber = safeReference(value.caseNumber);
  if (!idempotencyKey || !engagementRef || !bookRef || !caseNumber) return invalid();

  const caseRef = `bc_${createHash("sha256")
    .update(`${admitted.actor.accountId}:${admitted.actor.contextRef}:${idempotencyKey}`)
    .digest("hex")
    .slice(0, 24)}`;
  const correlationId = `m031_case:${caseRef}`;
  const result = await runtime.gateway.createBookkeepingCase({
    actor: admitted.actor,
    caseRef,
    caseNumber,
    engagementRef,
    bookRef,
    organizationRef: safeReference(value.organizationRef),
    serviceOrderRef: safeReference(value.serviceOrderRef),
    assignedBookkeeperRef: safeReference(value.assignedBookkeeperRef),
    assignedReviewerRef: safeReference(value.assignedReviewerRef),
    correlationId,
  });
  if (result.kind === "invalid") return invalid();
  if (result.kind === "not_found")
    return Response.json(
      { error: "prerequisite_not_found" },
      { status: 404, headers: privateHeaders },
    );
  return Response.json(
    { caseRef: result.caseRef, status: "setup_pending", correlationId },
    { status: result.kind === "created" ? 201 : 200, headers: privateHeaders },
  );
}
