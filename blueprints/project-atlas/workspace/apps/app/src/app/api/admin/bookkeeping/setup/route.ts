import { createHash } from "node:crypto";

import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import {
  admitClientBookkeepingRequest,
  validBookkeepingMutationProof,
} from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};
const serviceTypes = new Set([
  "monthly_bookkeeping",
  "quarterly_bookkeeping",
  "annual_cleanup",
  "catch_up_bookkeeping",
  "cleanup_bookkeeping",
  "bookkeeping_cleanup",
  "tax_ready_books",
  "transaction_categorization",
  "bank_reconciliation",
  "financial_reporting",
  "custom_bookkeeping_service",
]);
const frequencies = new Set(["monthly", "quarterly", "annual", "custom"]);
const bases = new Set(["cash", "accrual"]);
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
  const accountingEntityRef = safeReference(value.accountingEntityRef);
  const serviceType = typeof value.serviceType === "string" ? value.serviceType : "";
  const bookkeepingFrequency =
    typeof value.bookkeepingFrequency === "string" ? value.bookkeepingFrequency : "";
  const reportingFrequency =
    typeof value.reportingFrequency === "string" ? value.reportingFrequency : "";
  const accountingBasis = typeof value.accountingBasis === "string" ? value.accountingBasis : "";
  const bookStartOn = typeof value.bookStartOn === "string" ? value.bookStartOn : "";
  const fiscalYearEndMonth =
    typeof value.fiscalYearEndMonth === "number" ? value.fiscalYearEndMonth : 0;
  const fiscalYearStartMonth =
    typeof value.fiscalYearStartMonth === "number" ? value.fiscalYearStartMonth : 0;
  const monthlyTransactionAllowance =
    typeof value.monthlyTransactionAllowance === "number"
      ? value.monthlyTransactionAllowance
      : undefined;
  if (
    !idempotencyKey ||
    !accountingEntityRef ||
    !serviceTypes.has(serviceType) ||
    !frequencies.has(bookkeepingFrequency) ||
    !frequencies.has(reportingFrequency) ||
    !bases.has(accountingBasis) ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(bookStartOn) ||
    !Number.isInteger(fiscalYearEndMonth) ||
    fiscalYearEndMonth < 1 ||
    fiscalYearEndMonth > 12 ||
    !Number.isInteger(fiscalYearStartMonth) ||
    fiscalYearStartMonth < 1 ||
    fiscalYearStartMonth > 12 ||
    (monthlyTransactionAllowance !== undefined &&
      (!Number.isSafeInteger(monthlyTransactionAllowance) || monthlyTransactionAllowance < 0))
  )
    return invalid();
  const bookStartDate = new Date(`${bookStartOn}T00:00:00.000Z`);
  if (
    !Number.isFinite(bookStartDate.getTime()) ||
    bookStartDate.toISOString().slice(0, 10) !== bookStartOn
  )
    return invalid();

  const prefix = `${admitted.actor.accountId}:${admitted.actor.contextRef}:${accountingEntityRef}:${idempotencyKey}`;
  const digest = createHash("sha256").update(prefix).digest("hex");
  const engagementRef = `be_${digest.slice(0, 24)}`;
  const bookRef = `ab_${digest.slice(24, 48)}`;
  const engagement = await runtime.gateway.createEngagement({
    actor: admitted.actor,
    engagementRef,
    accountingEntityRef,
    serviceType: serviceType as
      | "monthly_bookkeeping"
      | "quarterly_bookkeeping"
      | "annual_cleanup"
      | "catch_up_bookkeeping"
      | "cleanup_bookkeeping"
      | "bookkeeping_cleanup"
      | "tax_ready_books"
      | "transaction_categorization"
      | "bank_reconciliation"
      | "financial_reporting"
      | "custom_bookkeeping_service",
    bookkeepingFrequency: bookkeepingFrequency as "monthly" | "quarterly" | "annual" | "custom",
    accountingBasis: accountingBasis as "cash" | "accrual",
    bookStartOn: bookStartDate,
    fiscalYearEndMonth,
    monthlyTransactionAllowance,
    reportingFrequency: reportingFrequency as "monthly" | "quarterly" | "annual" | "custom",
    closePolicyRef: safeReference(value.closePolicyRef),
  });
  if (engagement.kind === "invalid") return invalid();
  if (engagement.kind === "not_found")
    return Response.json(
      { error: "accounting_entity_not_found" },
      { status: 404, headers: privateHeaders },
    );
  if (!engagement.engagementRef)
    return Response.json(
      { error: "engagement_not_available" },
      { status: 409, headers: privateHeaders },
    );
  const book = await runtime.gateway.createBook({
    actor: admitted.actor,
    bookRef,
    engagementRef: engagement.engagementRef,
    accountingEntityRef,
    accountingBasis: accountingBasis as "cash" | "accrual",
    fiscalYearStartMonth,
  });
  if (book.kind === "invalid") return invalid();
  if (book.kind === "not_found")
    return Response.json(
      { error: "setup_prerequisite_not_found" },
      { status: 404, headers: privateHeaders },
    );
  return Response.json(
    { engagementRef: engagement.engagementRef, bookRef: book.bookRef, status: "setup" },
    {
      status: engagement.kind === "created" || book.kind === "created" ? 201 : 200,
      headers: privateHeaders,
    },
  );
}
