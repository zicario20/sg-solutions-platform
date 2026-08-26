export const PAYMENT_VERIFICATION_PACKAGE_ID = "@atlas/payment-verification";

export type PaymentCurrency = "USD";
export type PaymentObligationType =
  | "full_payment"
  | "deposit"
  | "installment"
  | "invoice"
  | "adjustment";
export type PaymentObligationStatus =
  | "draft"
  | "active"
  | "partially_satisfied"
  | "satisfied"
  | "overpaid"
  | "cancelled"
  | "superseded"
  | "written_off_future"
  | "unknown";
export type PaymentVerificationStatus =
  | "not_verified"
  | "verification_pending"
  | "processing"
  | "requires_client_action"
  | "verified_partial"
  | "verified_paid"
  | "verified_overpaid"
  | "verified_failed"
  | "verified_cancelled"
  | "verified_refunded_partial"
  | "verified_refunded_full"
  | "verified_disputed"
  | "verified_reversed"
  | "conflicting"
  | "insufficient_evidence"
  | "unknown";
export type PaymentVerificationCandidateType =
  | "payment_success_candidate"
  | "payment_failure_candidate"
  | "payment_processing_candidate"
  | "payment_requires_action_candidate"
  | "deposit_satisfied_candidate"
  | "invoice_paid_candidate"
  | "partial_payment_candidate"
  | "refund_adjustment_candidate"
  | "dispute_adjustment_candidate"
  | "reversal_candidate"
  | "unknown_outcome_candidate"
  | "manual_external_evidence_candidate";
export type PaymentVerificationEvidenceType =
  | "verified_provider_event"
  | "retrieved_provider_object"
  | "payment_intent"
  | "charge"
  | "checkout_session"
  | "invoice"
  | "invoice_payment"
  | "refund"
  | "dispute"
  | "balance_transaction"
  | "bank_confirmation_future"
  | "manual_external_receipt"
  | "reconciliation_result"
  | "idempotency_record"
  | "other";
export type PaymentVerificationEvidenceStatus =
  | "unverified"
  | "verified"
  | "verified_with_limitations"
  | "stale"
  | "conflicting"
  | "rejected"
  | "unavailable"
  | "unknown";
export type PaymentVerificationEvidenceFreshness = "current" | "stale" | "unknown";
export type PaymentVerificationEvidenceTrustTier = 1 | 2 | 3 | 4 | 5 | 6;
export type PaymentVerificationRuleType =
  | "provider_identity"
  | "environment"
  | "object_relationship"
  | "client_ownership"
  | "service_order_relationship"
  | "amount_match"
  | "currency_match"
  | "status_match"
  | "event_verification"
  | "evidence_freshness"
  | "refund_adjustment"
  | "dispute_adjustment"
  | "reversal"
  | "manual_review";
export type PaymentVerificationRuleOutcome = "passed" | "failed" | "unknown";
export type PaymentVerificationPolicyStatus = "draft" | "approved" | "active" | "retired";
export type PaymentVerificationCaseStatus =
  | "open"
  | "verification_pending"
  | "manual_review"
  | "verified"
  | "attention_required"
  | "closed";
export type PaymentVerificationRunStatus =
  | "queued"
  | "evaluating"
  | "decided"
  | "manual_review_required"
  | "failed"
  | "cancelled";
export type PaymentSufficiencyStatus =
  | "not_satisfied"
  | "partially_satisfied"
  | "satisfied"
  | "overpaid"
  | "indeterminate"
  | "not_applicable";
export type PaymentStartGateStatus =
  | "not_evaluated"
  | "payment_not_satisfied"
  | "payment_satisfied_pending_human_approval"
  | "blocked_by_refund_or_dispute"
  | "unavailable";
export type PaymentVerificationManualReviewQueue =
  | "verification_pending"
  | "evidence_refresh"
  | "unknown_outcome"
  | "manual_external_payment"
  | "amount_currency_mismatch"
  | "ownership_security_review"
  | "duplicate_payment"
  | "overpayment"
  | "refund_reverification"
  | "dispute_reverification"
  | "override_review"
  | "gate_handoff_failure"
  | "policy_review"
  | "security_incident";
export type PaymentVerificationManualReviewStatus =
  | "open"
  | "assigned"
  | "in_review"
  | "resolved"
  | "cancelled";
export type PaymentVerificationActorType = "system" | "staff" | "service_account" | "ai";

export interface PaymentVerificationActor {
  readonly actorType: PaymentVerificationActorType;
  readonly actorId?: string;
  readonly purpose: "payment_verification" | "reconciliation" | "security_review";
}

export interface PaymentObligation {
  readonly id: string;
  readonly clientId: string;
  readonly serviceOrderId?: string;
  readonly quoteId?: string;
  readonly invoiceId?: string;
  readonly obligationType: PaymentObligationType;
  readonly amountDueMinor: number;
  readonly currency: PaymentCurrency;
  readonly dueStage: string;
  readonly pricingSnapshotId: string;
  readonly status: PaymentObligationStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaymentVerificationEvidenceRelationship {
  readonly clientId?: string;
  readonly paymentObligationId?: string;
  readonly paymentTransactionId?: string;
  readonly serviceOrderId?: string;
  readonly quoteId?: string;
  readonly invoiceId?: string;
  readonly providerStateVersion?: string;
  readonly amountMinor?: number;
  readonly currency?: PaymentCurrency;
}

export interface PaymentVerificationEvidence {
  readonly id: string;
  readonly source: "m043" | "provider_adapter" | "reconciliation" | "manual_external";
  readonly sourceVersion: string;
  readonly provider: string;
  readonly providerEnvironment: "test" | "live" | "unknown";
  readonly evidenceType: PaymentVerificationEvidenceType;
  readonly providerObjectReference?: string;
  readonly providerEventReference?: string;
  readonly status: PaymentVerificationEvidenceStatus;
  readonly freshness: PaymentVerificationEvidenceFreshness;
  readonly trustTier: PaymentVerificationEvidenceTrustTier;
  readonly integrityHash: string;
  readonly relationship: PaymentVerificationEvidenceRelationship;
  readonly observedAt: string;
  readonly receivedAt: string;
  readonly expiresAt?: string;
}

export interface PaymentVerificationCandidate {
  readonly id: string;
  readonly sourceModule: "m043" | "provider_adapter" | "reconciliation" | "manual_external";
  readonly provider: string;
  readonly providerEnvironment: "test" | "live" | "unknown";
  readonly candidateType: PaymentVerificationCandidateType;
  readonly paymentObligationId?: string;
  readonly clientId?: string;
  readonly serviceOrderId?: string;
  readonly quoteId?: string;
  readonly invoiceId?: string;
  readonly paymentTransactionIds: readonly string[];
  readonly expectedAmountMinor?: number;
  readonly observedAmountMinor?: number;
  readonly currency?: PaymentCurrency;
  readonly providerStateVersion: string;
  readonly evidence: readonly PaymentVerificationEvidence[];
  readonly correlationId: string;
  readonly receivedAt: string;
}

export interface PaymentVerificationPolicy {
  readonly id: string;
  readonly code: string;
  readonly version: number;
  readonly status: PaymentVerificationPolicyStatus;
  readonly requiredRuleTypes: readonly PaymentVerificationRuleType[];
  readonly acceptedTrustTiers: readonly PaymentVerificationEvidenceTrustTier[];
  readonly maximumEvidenceAgeSeconds: number;
  readonly requiresCurrentEvidenceForPositiveDecision: boolean;
  readonly permitsManualExternalEvidence: boolean;
  readonly requiresFourEyesForOverrides: boolean;
  readonly createdAt: string;
  readonly approvedAt?: string;
  readonly retiredAt?: string;
}

export interface PaymentVerificationCase {
  readonly id: string;
  readonly paymentObligationId: string;
  readonly paymentTransactionIds: readonly string[];
  readonly verificationPolicyId: string;
  readonly status: PaymentVerificationCaseStatus;
  readonly currentVerificationDecisionId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaymentVerificationRun {
  readonly id: string;
  readonly caseId: string;
  readonly paymentObligationId: string;
  readonly policyId: string;
  readonly policyVersion: number;
  readonly candidateId: string;
  readonly evidenceHash: string;
  readonly idempotencyKey: string;
  readonly status: PaymentVerificationRunStatus;
  readonly initiatedBy: PaymentVerificationActor;
  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface PaymentVerificationDecision {
  readonly id: string;
  readonly caseId: string;
  readonly paymentObligationId: string;
  readonly paymentTransactionIds: readonly string[];
  readonly verificationRunId: string;
  readonly policyId: string;
  readonly policyVersion: number;
  readonly status: PaymentVerificationStatus;
  readonly verifiedAmountMinor: number;
  readonly adjustmentAmountMinor: number;
  readonly unappliedAmountMinor: number;
  readonly currency: PaymentCurrency;
  readonly evidenceHash: string;
  readonly idempotencyKey: string;
  readonly reasonCodes: readonly string[];
  readonly supersedesDecisionId?: string;
  readonly decisionHash: string;
  readonly decidedBy: PaymentVerificationActor;
  readonly decidedAt: string;
}

export interface PaymentVerificationRuleEvaluation {
  readonly id: string;
  readonly decisionId: string;
  readonly ruleType: PaymentVerificationRuleType;
  readonly outcome: PaymentVerificationRuleOutcome;
  readonly reasonCode: string;
  readonly summary: string;
  readonly createdAt: string;
}

export interface PaymentSufficiencyAssessment {
  readonly id: string;
  readonly paymentObligationId: string;
  readonly decisionId: string;
  readonly status: PaymentSufficiencyStatus;
  readonly amountDueMinor: number;
  readonly verifiedAmountMinor: number;
  readonly outstandingAmountMinor: number;
  readonly unappliedAmountMinor: number;
  readonly currency: PaymentCurrency;
  readonly assessedAt: string;
}

export interface PaymentStartGate {
  readonly id: string;
  readonly paymentObligationId: string;
  readonly serviceOrderId?: string;
  readonly decisionId: string;
  readonly sufficiencyAssessmentId: string;
  readonly status: PaymentStartGateStatus;
  readonly reasonCodes: readonly string[];
  readonly evaluatedAt: string;
}

export interface PaymentVerificationManualReview {
  readonly id: string;
  readonly caseId: string;
  readonly decisionId: string;
  readonly queue: PaymentVerificationManualReviewQueue;
  readonly status: PaymentVerificationManualReviewStatus;
  readonly reasonCodes: readonly string[];
  readonly requiresFourEyes: boolean;
  readonly createdAt: string;
  readonly resolvedAt?: string;
}

export interface PaymentVerificationOverride {
  readonly id: string;
  readonly verificationCaseId: string;
  readonly decisionId: string;
  readonly requestedBy: PaymentVerificationActor;
  readonly approvalReference: string;
  readonly reasonCode: string;
  readonly status: "requested" | "approved" | "rejected" | "expired";
  readonly expiresAt: string;
  readonly createdAt: string;
}

export interface PaymentVerificationOutboxEvent {
  readonly id: string;
  readonly eventType:
    | "payment_verification_decided"
    | "payment_start_gate_evaluated"
    | "payment_verification_manual_review_requested";
  readonly aggregateId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly dispatchState: "blocked" | "pending" | "dispatched" | "dead_lettered";
  readonly createdAt: string;
}

export interface PaymentVerificationAuditEvent {
  readonly id: string;
  readonly action:
    | "candidate_admitted"
    | "verification_evaluated"
    | "manual_review_requested"
    | "override_requested"
    | "gate_evaluated"
    | "runtime_operation_blocked";
  readonly actor: PaymentVerificationActor;
  readonly resourceType:
    | "payment_obligation"
    | "verification_case"
    | "verification_decision"
    | "gate";
  readonly resourceId: string;
  readonly result: "accepted" | "rejected" | "manual_review" | "blocked";
  readonly correlationId: string;
  readonly occurredAt: string;
}

export interface PaymentVerificationResult {
  readonly idempotent: boolean;
  readonly paymentObligation: PaymentObligation;
  readonly verificationCase: PaymentVerificationCase;
  readonly decision: PaymentVerificationDecision;
  readonly ruleEvaluations: readonly PaymentVerificationRuleEvaluation[];
  readonly sufficiency: PaymentSufficiencyAssessment;
  readonly paymentStartGate: PaymentStartGate;
  readonly manualReview?: PaymentVerificationManualReview;
}

export interface PaymentVerificationHandoff {
  readonly target: "m045" | "m068";
  readonly sourceDecisionId: string;
  readonly status: "dormant";
  readonly reason: "activation_not_authorized";
}
