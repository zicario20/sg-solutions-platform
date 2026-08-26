import { createHash } from "node:crypto";

import type {
  PaymentObligation,
  PaymentVerificationCandidate,
  PaymentVerificationDecision,
  PaymentVerificationEvidence,
  PaymentVerificationPolicy,
  PaymentVerificationRuleType,
} from "./contracts.ts";

export const DEFAULT_PAYMENT_VERIFICATION_RULE_TYPES: readonly PaymentVerificationRuleType[] = [
  "provider_identity",
  "environment",
  "object_relationship",
  "client_ownership",
  "service_order_relationship",
  "amount_match",
  "currency_match",
  "status_match",
  "event_verification",
  "evidence_freshness",
];

export function createDefaultPaymentVerificationPolicy(
  overrides: Partial<PaymentVerificationPolicy> = {},
): PaymentVerificationPolicy {
  return {
    id: "payment-verification-policy-default",
    code: "PAYMENT_VERIFICATION_DEFAULT",
    version: 1,
    status: "active",
    requiredRuleTypes: DEFAULT_PAYMENT_VERIFICATION_RULE_TYPES,
    acceptedTrustTiers: [1, 2],
    maximumEvidenceAgeSeconds: 900,
    requiresCurrentEvidenceForPositiveDecision: true,
    permitsManualExternalEvidence: false,
    requiresFourEyesForOverrides: true,
    createdAt: "1970-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function assertActivePaymentVerificationPolicy(policy: PaymentVerificationPolicy): void {
  if (policy.status !== "active") {
    throw new Error("M044 requires an active payment verification policy.");
  }
  if (!Number.isInteger(policy.version) || policy.version <= 0) {
    throw new Error("M044 payment verification policy versions must be positive integers.");
  }
  if (
    !Number.isInteger(policy.maximumEvidenceAgeSeconds) ||
    policy.maximumEvidenceAgeSeconds <= 0
  ) {
    throw new Error("M044 policy evidence freshness must be a positive integer.");
  }
}

export function assertPaymentObligation(obligation: PaymentObligation): void {
  if (!Number.isSafeInteger(obligation.amountDueMinor) || obligation.amountDueMinor < 0) {
    throw new Error("M044 payment obligation amounts must be non-negative integer minor units.");
  }
  if (obligation.currency !== "USD") {
    throw new Error("M044 currently permits only USD payment obligations.");
  }
  if (!Number.isInteger(obligation.version) || obligation.version <= 0) {
    throw new Error("M044 payment obligation versions must be positive integers.");
  }
}

export function assertOptionalMinorAmount(amount: number | undefined, label: string): void {
  if (amount !== undefined && (!Number.isSafeInteger(amount) || amount < 0)) {
    throw new Error(`M044 ${label} must be a non-negative integer number of minor units.`);
  }
}

export function hashPaymentVerificationValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPaymentVerificationEvidence(
  evidence: readonly PaymentVerificationEvidence[],
): string {
  const normalized = evidence
    .map((item) =>
      [
        item.id,
        item.integrityHash,
        item.provider,
        item.providerEnvironment,
        item.evidenceType,
        item.status,
        item.freshness,
        String(item.trustTier),
        item.relationship.paymentObligationId ?? "",
        item.relationship.paymentTransactionId ?? "",
        item.relationship.providerStateVersion ?? "",
      ].join(":"),
    )
    .sort()
    .join("|");
  return hashPaymentVerificationValue(normalized);
}

export function createPaymentVerificationIdempotencyKey(
  candidate: PaymentVerificationCandidate,
  policy: PaymentVerificationPolicy,
  evidenceHash: string,
): string {
  return [
    "m044",
    candidate.paymentObligationId ?? "unbound",
    candidate.provider,
    candidate.providerStateVersion,
    String(policy.version),
    evidenceHash,
  ].join(":");
}

export function hashPaymentVerificationDecision(
  decision: Omit<PaymentVerificationDecision, "decisionHash">,
): string {
  return hashPaymentVerificationValue(
    [
      decision.id,
      decision.caseId,
      decision.paymentObligationId,
      decision.paymentTransactionIds.join(","),
      decision.verificationRunId,
      decision.policyId,
      String(decision.policyVersion),
      decision.status,
      String(decision.verifiedAmountMinor),
      String(decision.adjustmentAmountMinor),
      String(decision.unappliedAmountMinor),
      decision.currency,
      decision.evidenceHash,
      decision.idempotencyKey,
      decision.reasonCodes.join(","),
      decision.supersedesDecisionId ?? "",
      decision.decidedBy.actorType,
      decision.decidedBy.actorId ?? "",
      decision.decidedAt,
    ].join("|"),
  );
}
