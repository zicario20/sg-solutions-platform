import type {
  CommercialPricingSnapshot,
  InstallmentSchedule,
  PaymentSchedulePolicy,
  ServiceQuote,
  ServiceQuoteVersion,
} from "./contracts.ts";
import { assertIso, assertMinor, assertText, assertVersion, deepFreeze } from "./policy.ts";

export function createServiceQuote(
  input: Readonly<{
    id: string;
    quoteNumber: string;
    clientId: string | null;
    organizationId: string | null;
    serviceDefinitionId: string;
    serviceVersionId: string;
    createdAt: string;
  }>,
): ServiceQuote {
  if (input.clientId === null && input.organizationId === null)
    throw new TypeError("quote client or organization required");
  return deepFreeze({
    id: assertText(input.id, "quote id", 160),
    quoteNumber: assertText(input.quoteNumber, "quoteNumber", 160),
    clientId: input.clientId,
    organizationId: input.organizationId,
    serviceDefinitionId: assertText(input.serviceDefinitionId, "serviceDefinitionId", 160),
    serviceVersionId: assertText(input.serviceVersionId, "serviceVersionId", 160),
    status: "draft" as const,
    createdAt: assertIso(input.createdAt, "quote createdAt"),
  });
}

export function createServiceQuoteVersion(
  input: Readonly<{
    id: string;
    quoteId: string;
    version: number;
    snapshot: CommercialPricingSnapshot;
    validFrom: string;
    expiresAt: string;
    termsReferences: readonly string[];
    disclosureReferences: readonly string[];
    createdAt: string;
  }>,
): ServiceQuoteVersion {
  const validFrom = assertIso(input.validFrom, "quote validFrom");
  const expiresAt = assertIso(input.expiresAt, "quote expiresAt");
  if (Date.parse(expiresAt) <= Date.parse(validFrom)) throw new TypeError("quote expiry invalid");
  if (input.termsReferences.length === 0 || input.disclosureReferences.length === 0)
    throw new TypeError("quote terms and disclosures required");
  return deepFreeze({
    id: assertText(input.id, "quote version id", 160),
    quoteId: assertText(input.quoteId, "quoteId", 160),
    version: assertVersion(input.version, "quote version"),
    snapshot: deepFreeze(structuredClone(input.snapshot)),
    validFrom,
    expiresAt,
    termsReferences: [...input.termsReferences],
    disclosureReferences: [...input.disclosureReferences],
    status: "draft" as const,
    createdAt: assertIso(input.createdAt, "quote version createdAt"),
  });
}

export function presentServiceQuoteVersion(
  version: ServiceQuoteVersion,
  presentedAt: string,
): ServiceQuoteVersion {
  assertIso(presentedAt, "quote presentedAt");
  if (version.status !== "draft") throw new TypeError("quote version cannot be presented");
  return deepFreeze({ ...version, status: "presented" as const });
}

export function acceptServiceQuoteVersion(
  version: ServiceQuoteVersion,
  input: Readonly<{
    acceptedBy: string;
    acceptedAt: string;
    acceptanceMethod: "client_portal" | "staff_assisted" | "secure_link";
    acknowledgedTerms: readonly string[];
    acknowledgedDisclosures: readonly string[];
  }>,
): ServiceQuoteVersion {
  const acceptedAt = assertIso(input.acceptedAt, "quote acceptedAt");
  if (version.status !== "presented") throw new TypeError("quote version cannot be accepted");
  if (Date.parse(acceptedAt) > Date.parse(version.expiresAt)) throw new TypeError("quote expired");
  if (
    version.termsReferences.some((reference) => !input.acknowledgedTerms.includes(reference)) ||
    version.disclosureReferences.some(
      (reference) => !input.acknowledgedDisclosures.includes(reference),
    )
  )
    throw new TypeError("quote acknowledgments incomplete");
  return deepFreeze({
    ...version,
    status: "accepted" as const,
    acceptedBy: assertText(input.acceptedBy, "acceptedBy", 160),
    acceptedAt,
    acceptanceMethod: input.acceptanceMethod,
    paymentState: "not_paid" as const,
    workflowState: "not_started" as const,
  });
}

export function createInstallmentSchedule(
  input: Readonly<{
    policy: PaymentSchedulePolicy;
    totalAmountMinor: number;
    currency: "USD";
    acceptedAt: string;
  }>,
): InstallmentSchedule {
  assertMinor(input.totalAmountMinor, "schedule totalAmountMinor");
  assertIso(input.acceptedAt, "schedule acceptedAt");
  if (input.policy.status !== "active") throw new TypeError("payment schedule policy not active");
  if (input.policy.installmentCount < 1) throw new TypeError("installmentCount invalid");
  if (input.policy.allocationMethod !== "equal")
    throw new TypeError("payment schedule allocation not activated");
  const base = Math.floor(input.totalAmountMinor / input.policy.installmentCount);
  const remainder = input.totalAmountMinor % input.policy.installmentCount;
  return deepFreeze({
    policyId: input.policy.id,
    policyVersion: input.policy.version,
    currency: input.currency,
    totalAmountMinor: input.totalAmountMinor,
    installments: Array.from({ length: input.policy.installmentCount }, (_, index) =>
      deepFreeze({
        installmentNumber: index + 1,
        amountMinor: base + (index === 0 ? remainder : 0),
        dueRule: input.policy.dueDateRule,
      }),
    ),
  });
}

export function createPricingAmendment(
  input: Readonly<{
    amendmentId: string;
    sourceSnapshot: CommercialPricingSnapshot;
    deltaAmountMinor: number;
    reason: string;
    requestedAt: string;
  }>,
) {
  if (!Number.isSafeInteger(input.deltaAmountMinor)) throw new TypeError("amendment delta invalid");
  return deepFreeze({
    amendmentId: assertText(input.amendmentId, "amendmentId", 160),
    sourceSnapshotId: input.sourceSnapshot.id,
    deltaAmountMinor: input.deltaAmountMinor,
    status: "draft" as const,
    reason: assertText(input.reason, "amendment reason", 500),
    requestedAt: assertIso(input.requestedAt, "amendment requestedAt"),
  });
}
