import { createHash } from "node:crypto";

import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import {
  admitClientBookkeepingRequest,
  validBookkeepingMutationProof,
} from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};
const legalEntityTypes = new Set([
  "individual",
  "sole_proprietorship",
  "llc",
  "corporation",
  "partnership",
  "other",
]);
const classifications = new Set(["business", "personal", "mixed", "unknown"]);

const optionalReference = (value: unknown) =>
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
  const idempotencyKey = optionalReference(value.idempotencyKey);
  const displayName = typeof value.displayName === "string" ? value.displayName.trim() : "";
  const legalEntityType = typeof value.legalEntityType === "string" ? value.legalEntityType : "";
  const classification = typeof value.classification === "string" ? value.classification : "";
  const fiscalYearEndMonth =
    typeof value.fiscalYearEndMonth === "number" ? value.fiscalYearEndMonth : 0;
  if (
    !idempotencyKey ||
    !legalEntityTypes.has(legalEntityType) ||
    !classifications.has(classification) ||
    !Number.isInteger(fiscalYearEndMonth) ||
    fiscalYearEndMonth < 1 ||
    fiscalYearEndMonth > 12 ||
    displayName.length < 1 ||
    displayName.length > 160
  )
    return invalid();

  const accountingEntityRef = `ae_${createHash("sha256")
    .update(`${admitted.actor.accountId}:${admitted.actor.contextRef}:${idempotencyKey}`)
    .digest("hex")
    .slice(0, 24)}`;
  const result = await runtime.gateway.createAccountingEntity({
    actor: admitted.actor,
    accountingEntityRef,
    organizationRef: optionalReference(value.organizationRef),
    legalEntityType: legalEntityType as
      | "individual"
      | "sole_proprietorship"
      | "llc"
      | "corporation"
      | "partnership"
      | "other",
    classification: classification as "business" | "personal" | "mixed" | "unknown",
    displayName,
    taxIdentifierTokenRef: optionalReference(value.taxIdentifierTokenRef),
    baseJurisdiction: optionalReference(value.baseJurisdiction),
    fiscalYearEndMonth,
  });
  if (result.kind === "invalid") return invalid();
  return Response.json(
    { accountingEntityRef: result.accountingEntityRef, status: "setup" },
    { status: result.kind === "created" ? 201 : 200, headers: privateHeaders },
  );
}
