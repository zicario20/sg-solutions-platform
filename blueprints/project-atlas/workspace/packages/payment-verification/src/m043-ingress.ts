import type { PaymentVerificationCandidate as M043PaymentVerificationCandidate } from "@atlas/billing";

import type { PaymentVerificationCandidate, PaymentVerificationEvidenceType } from "./contracts.ts";
import { hashPaymentVerificationValue } from "./policy.ts";

export interface M043PaymentVerificationBinding {
  readonly paymentObligationId: string;
  readonly clientId: string;
  readonly serviceOrderId?: string;
  readonly quoteId?: string;
  readonly invoiceId?: string;
  readonly providerStateVersion: string;
}

/**
 * Anti-corruption mapper only. It does not verify a payment and emits limited, unknown-freshness
 * evidence so M043 alone cannot produce a verified-paid decision.
 */
export function mapM043PaymentVerificationCandidate(
  candidate: M043PaymentVerificationCandidate,
): PaymentVerificationCandidate {
  return {
    id: `m044_${candidate.id}`,
    sourceModule: "m043",
    provider: "stripe",
    providerEnvironment: candidate.evidence[0]?.environment ?? "unknown",
    candidateType: mapCandidateType(candidate.candidateType),
    paymentTransactionIds: candidate.paymentTransactionId ? [candidate.paymentTransactionId] : [],
    expectedAmountMinor: candidate.expectedAmountMinor,
    observedAmountMinor: candidate.observedAmountMinor,
    currency: candidate.currency,
    providerStateVersion: candidate.eventRecordId,
    evidence: candidate.evidence.map((item) => ({
      id: `m044_evidence_${item.providerObjectId}`,
      source: "m043",
      sourceVersion: "m043.v1",
      provider: "stripe",
      providerEnvironment: item.environment,
      evidenceType: mapEvidenceType(item.objectKind),
      providerObjectReference: item.providerObjectId,
      providerEventReference: candidate.eventRecordId,
      status: "verified_with_limitations",
      freshness: "unknown",
      trustTier: 3,
      integrityHash: hashPaymentVerificationValue(
        [candidate.id, candidate.eventRecordId, item.providerObjectId].join(":"),
      ),
      relationship: {
        paymentTransactionId: candidate.paymentTransactionId,
        providerStateVersion: candidate.eventRecordId,
        amountMinor: candidate.observedAmountMinor,
        currency: candidate.currency,
      },
      observedAt: candidate.createdAt,
      receivedAt: candidate.createdAt,
    })),
    correlationId: candidate.correlationId,
    receivedAt: candidate.createdAt,
  };
}

export function bindM043PaymentVerificationCandidate(
  candidate: M043PaymentVerificationCandidate,
  binding: M043PaymentVerificationBinding,
): PaymentVerificationCandidate {
  const mapped = mapM043PaymentVerificationCandidate(candidate);
  return {
    ...mapped,
    paymentObligationId: binding.paymentObligationId,
    clientId: binding.clientId,
    serviceOrderId: binding.serviceOrderId,
    quoteId: binding.quoteId,
    invoiceId: binding.invoiceId,
    providerStateVersion: binding.providerStateVersion,
    evidence: mapped.evidence.map((item) => ({
      ...item,
      relationship: {
        ...item.relationship,
        paymentObligationId: binding.paymentObligationId,
        clientId: binding.clientId,
        serviceOrderId: binding.serviceOrderId,
        quoteId: binding.quoteId,
        invoiceId: binding.invoiceId,
        providerStateVersion: binding.providerStateVersion,
      },
    })),
  };
}

function mapCandidateType(
  candidateType: M043PaymentVerificationCandidate["candidateType"],
): PaymentVerificationCandidate["candidateType"] {
  switch (candidateType) {
    case "payment_succeeded":
      return "payment_success_candidate";
    case "payment_failed":
      return "payment_failure_candidate";
    case "refund_succeeded":
      return "refund_adjustment_candidate";
    case "dispute_opened":
      return "dispute_adjustment_candidate";
    case "invoice_paid":
      return "invoice_paid_candidate";
  }
}

function mapEvidenceType(objectKind: string): PaymentVerificationEvidenceType {
  switch (objectKind) {
    case "payment_intent":
      return "payment_intent";
    case "charge":
      return "charge";
    case "checkout_session":
      return "checkout_session";
    case "invoice":
      return "invoice";
    case "refund":
      return "refund";
    case "dispute":
      return "dispute";
    case "balance_transaction":
      return "balance_transaction";
    default:
      return "other";
  }
}
