import type {
  PaymentObligation,
  PaymentObligationStatus,
  PaymentStartGate,
  PaymentSufficiencyAssessment,
  PaymentSufficiencyStatus,
  PaymentVerificationActor,
  PaymentVerificationCandidate,
  PaymentVerificationCase,
  PaymentVerificationDecision,
  PaymentVerificationEvidence,
  PaymentVerificationManualReviewQueue,
  PaymentVerificationOverride,
  PaymentVerificationPolicy,
  PaymentVerificationResult,
  PaymentVerificationRuleOutcome,
  PaymentVerificationRuleType,
  PaymentVerificationStatus,
} from "./contracts.ts";
import {
  assertActivePaymentVerificationPolicy,
  assertOptionalMinorAmount,
  assertPaymentObligation,
  createPaymentVerificationIdempotencyKey,
  hashPaymentVerificationDecision,
  hashPaymentVerificationEvidence,
  hashPaymentVerificationValue,
} from "./policy.ts";
import type { PaymentVerificationRepository } from "./repository.ts";

export interface EvaluatePaymentVerificationCommand {
  readonly candidate: PaymentVerificationCandidate;
  readonly obligation: PaymentObligation;
  readonly policy: PaymentVerificationPolicy;
  readonly actor: PaymentVerificationActor;
  readonly evaluatedAt: string;
}

export interface RequestPaymentVerificationOverrideCommand {
  readonly verificationCaseId: string;
  readonly decisionId: string;
  readonly requestedBy: PaymentVerificationActor;
  readonly approvalReference: string;
  readonly reasonCode: string;
  readonly expiresAt: string;
  readonly requestedAt: string;
}

type RuleCheck = Readonly<{
  ruleType: PaymentVerificationRuleType;
  outcome: PaymentVerificationRuleOutcome;
  reasonCode: string;
  summary: string;
}>;

const positiveCandidates: readonly PaymentVerificationCandidate["candidateType"][] = [
  "payment_success_candidate",
  "deposit_satisfied_candidate",
  "invoice_paid_candidate",
  "partial_payment_candidate",
];

const adverseStatuses: readonly PaymentVerificationStatus[] = [
  "verified_refunded_partial",
  "verified_refunded_full",
  "verified_disputed",
  "verified_reversed",
];

export class PaymentVerificationService {
  constructor(private readonly repository: PaymentVerificationRepository) {}

  evaluate(command: EvaluatePaymentVerificationCommand): PaymentVerificationResult {
    assertDecisionActor(command.actor);
    assertPaymentObligation(command.obligation);
    assertActivePaymentVerificationPolicy(command.policy);
    assertOptionalMinorAmount(command.candidate.expectedAmountMinor, "candidate expected amount");
    assertOptionalMinorAmount(command.candidate.observedAmountMinor, "candidate observed amount");

    const evidenceHash = hashPaymentVerificationEvidence(command.candidate.evidence);
    const idempotencyKey = createPaymentVerificationIdempotencyKey(
      command.candidate,
      command.policy,
      evidenceHash,
    );
    const existing = this.repository.findDecisionByIdempotencyKey(idempotencyKey);
    if (existing) {
      const sufficiency = this.repository.findSufficiencyByDecisionId(existing.id);
      const gate = this.repository.findGateByDecisionId(existing.id);
      const verificationCase = this.repository.findCaseByObligationId(command.obligation.id);
      if (!sufficiency || !gate || !verificationCase) {
        throw new Error("M044 idempotency record is incomplete and requires reconciliation.");
      }
      return {
        idempotent: true,
        paymentObligation:
          this.repository.findPaymentObligation(command.obligation.id) ?? command.obligation,
        verificationCase,
        decision: existing,
        ruleEvaluations: this.repository.ruleEvaluationsForDecision(existing.id),
        sufficiency,
        paymentStartGate: gate,
      };
    }

    const priorDecision = this.repository.findLatestDecisionByObligationId(command.obligation.id);
    const verificationCase = this.ensureCase(
      command.obligation,
      command.candidate,
      command.policy,
      command.evaluatedAt,
    );
    const runId = `pvr_${hashPaymentVerificationValue(idempotencyKey).slice(0, 24)}`;
    this.repository.saveCandidate(command.candidate);
    for (const evidence of command.candidate.evidence) {
      this.repository.saveEvidence(evidence);
    }
    this.repository.saveRun({
      id: runId,
      caseId: verificationCase.id,
      paymentObligationId: command.obligation.id,
      policyId: command.policy.id,
      policyVersion: command.policy.version,
      candidateId: command.candidate.id,
      evidenceHash,
      idempotencyKey,
      status: "evaluating",
      initiatedBy: command.actor,
      startedAt: command.evaluatedAt,
    });

    const checks = evaluateRules(command.candidate, command.obligation);
    const status = determineVerificationStatus(
      command.candidate,
      command.obligation,
      command.policy,
      checks,
      priorDecision,
    );
    const reasonCodes = deriveReasonCodes(status, checks, command.candidate);
    const amounts = calculateDecisionAmounts(
      status,
      command.candidate,
      command.obligation,
      priorDecision,
    );
    const decisionId = `pvd_${hashPaymentVerificationValue(idempotencyKey).slice(0, 24)}`;
    const decisionWithoutHash: Omit<PaymentVerificationDecision, "decisionHash"> = {
      id: decisionId,
      caseId: verificationCase.id,
      paymentObligationId: command.obligation.id,
      paymentTransactionIds: command.candidate.paymentTransactionIds,
      verificationRunId: runId,
      policyId: command.policy.id,
      policyVersion: command.policy.version,
      status,
      verifiedAmountMinor: amounts.verifiedAmountMinor,
      adjustmentAmountMinor: amounts.adjustmentAmountMinor,
      unappliedAmountMinor: amounts.unappliedAmountMinor,
      currency: command.obligation.currency,
      evidenceHash,
      idempotencyKey,
      reasonCodes,
      supersedesDecisionId: priorDecision?.id,
      decidedBy: command.actor,
      decidedAt: command.evaluatedAt,
    };
    const decision: PaymentVerificationDecision = {
      ...decisionWithoutHash,
      decisionHash: hashPaymentVerificationDecision(decisionWithoutHash),
    };
    this.repository.saveDecision(decision);

    const ruleEvaluations = checks.map((check, index) =>
      this.repository.saveRuleEvaluation({
        id: `${decision.id}:rule:${String(index + 1)}`,
        decisionId: decision.id,
        ruleType: check.ruleType,
        outcome: check.outcome,
        reasonCode: check.reasonCode,
        summary: check.summary,
        createdAt: command.evaluatedAt,
      }),
    );
    const sufficiency = this.repository.saveSufficiency(
      createSufficiencyAssessment(decision, command.obligation, command.evaluatedAt),
    );
    const gate = this.repository.saveGate(
      createPaymentStartGate(decision, command.obligation, sufficiency, command.evaluatedAt),
    );
    const paymentObligation = {
      ...command.obligation,
      status: obligationStatusFor(sufficiency.status),
      updatedAt: command.evaluatedAt,
    };
    this.repository.savePaymentObligation(paymentObligation);
    const updatedCase = {
      ...verificationCase,
      status: caseStatusFor(decision.status),
      currentVerificationDecisionId: decision.id,
      updatedAt: command.evaluatedAt,
    };
    this.repository.saveCase(updatedCase);

    const manualReview = requiresManualReview(status, command.candidate, checks)
      ? this.repository.saveManualReview({
          id: `pvmr_${decision.id}`,
          caseId: updatedCase.id,
          decisionId: decision.id,
          queue: queueFor(status, command.candidate),
          status: "open",
          reasonCodes,
          requiresFourEyes:
            command.candidate.candidateType === "manual_external_evidence_candidate" ||
            command.candidate.evidence.some((item) => item.source === "manual_external"),
          createdAt: command.evaluatedAt,
        })
      : undefined;

    this.repository.appendOutbox({
      id: `pvo_${decision.id}`,
      eventType: "payment_verification_decided",
      aggregateId: decision.id,
      correlationId: command.candidate.correlationId,
      idempotencyKey: `m044:decision:${decision.id}`,
      dispatchState: "blocked",
      createdAt: command.evaluatedAt,
    });
    this.repository.appendOutbox({
      id: `pvo_gate_${gate.id}`,
      eventType: "payment_start_gate_evaluated",
      aggregateId: gate.id,
      correlationId: command.candidate.correlationId,
      idempotencyKey: `m044:gate:${gate.id}`,
      dispatchState: "blocked",
      createdAt: command.evaluatedAt,
    });
    if (manualReview) {
      this.repository.appendOutbox({
        id: `pvo_review_${manualReview.id}`,
        eventType: "payment_verification_manual_review_requested",
        aggregateId: manualReview.id,
        correlationId: command.candidate.correlationId,
        idempotencyKey: `m044:review:${manualReview.id}`,
        dispatchState: "blocked",
        createdAt: command.evaluatedAt,
      });
    }
    this.repository.appendAudit({
      id: `pva_${decision.id}`,
      action: "verification_evaluated",
      actor: command.actor,
      resourceType: "verification_decision",
      resourceId: decision.id,
      result: manualReview ? "manual_review" : "accepted",
      correlationId: command.candidate.correlationId,
      occurredAt: command.evaluatedAt,
    });
    this.repository.appendAudit({
      id: `pva_gate_${gate.id}`,
      action: "gate_evaluated",
      actor: command.actor,
      resourceType: "gate",
      resourceId: gate.id,
      result: gate.status === "payment_satisfied_pending_human_approval" ? "accepted" : "blocked",
      correlationId: command.candidate.correlationId,
      occurredAt: command.evaluatedAt,
    });

    return {
      idempotent: false,
      paymentObligation,
      verificationCase: updatedCase,
      decision,
      ruleEvaluations,
      sufficiency,
      paymentStartGate: gate,
      manualReview,
    };
  }

  requestOverride(command: RequestPaymentVerificationOverrideCommand): PaymentVerificationOverride {
    assertDecisionActor(command.requestedBy);
    if (command.requestedBy.actorType !== "staff") {
      throw new Error("M044 payment verification overrides require an authorized staff actor.");
    }
    if (!command.approvalReference || !command.reasonCode) {
      throw new Error("M044 override requests require an approval reference and a reason.");
    }
    const override: PaymentVerificationOverride = {
      id:
        "pvoverride_" +
        hashPaymentVerificationValue(
          [command.verificationCaseId, command.decisionId, command.approvalReference].join(":"),
        ).slice(0, 24),
      verificationCaseId: command.verificationCaseId,
      decisionId: command.decisionId,
      requestedBy: command.requestedBy,
      approvalReference: command.approvalReference,
      reasonCode: command.reasonCode,
      status: "requested",
      expiresAt: command.expiresAt,
      createdAt: command.requestedAt,
    };
    this.repository.saveOverride(override);
    this.repository.appendAudit({
      id: `pva_override_${override.id}`,
      action: "override_requested",
      actor: command.requestedBy,
      resourceType: "verification_case",
      resourceId: command.verificationCaseId,
      result: "manual_review",
      correlationId: command.approvalReference,
      occurredAt: command.requestedAt,
    });
    return override;
  }

  private ensureCase(
    obligation: PaymentObligation,
    candidate: PaymentVerificationCandidate,
    policy: PaymentVerificationPolicy,
    timestamp: string,
  ): PaymentVerificationCase {
    const existing = this.repository.findCaseByObligationId(obligation.id);
    if (existing) {
      return this.repository.saveCase({
        ...existing,
        paymentTransactionIds: [
          ...new Set([...existing.paymentTransactionIds, ...candidate.paymentTransactionIds]),
        ],
        updatedAt: timestamp,
      });
    }
    return this.repository.saveCase({
      id: `pvc_${obligation.id}`,
      paymentObligationId: obligation.id,
      paymentTransactionIds: candidate.paymentTransactionIds,
      verificationPolicyId: policy.id,
      status: "verification_pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

function assertDecisionActor(actor: PaymentVerificationActor): void {
  if (actor.actorType === "ai") {
    throw new Error("M044 AI actors cannot issue payment verification decisions or overrides.");
  }
  if (actor.purpose !== "payment_verification" && actor.purpose !== "reconciliation") {
    throw new Error(
      "M044 payment decisions require a payment verification or reconciliation purpose.",
    );
  }
}

function evaluateRules(
  candidate: PaymentVerificationCandidate,
  obligation: PaymentObligation,
): readonly RuleCheck[] {
  const providerMatches =
    candidate.provider !== "unknown" &&
    candidate.evidence.length > 0 &&
    candidate.evidence.every((item) => item.provider === candidate.provider);
  const environmentMatches =
    candidate.providerEnvironment !== "unknown" &&
    candidate.evidence.length > 0 &&
    candidate.evidence.every((item) => item.providerEnvironment === candidate.providerEnvironment);
  const obligationMatches = candidate.evidence.some(
    (item) => item.relationship.paymentObligationId === obligation.id,
  );
  const transactionMatches =
    candidate.paymentTransactionIds.length > 0 &&
    candidate.evidence.some((item) => {
      const transactionId = item.relationship.paymentTransactionId;
      return transactionId !== undefined && candidate.paymentTransactionIds.includes(transactionId);
    });
  const objectMatches =
    obligationMatches &&
    (transactionMatches ||
      (obligation.invoiceId !== undefined &&
        candidate.evidence.some((item) => item.relationship.invoiceId === obligation.invoiceId)));
  const clientMismatch =
    candidate.clientId !== undefined && candidate.clientId !== obligation.clientId;
  const clientMatches =
    candidate.clientId === obligation.clientId &&
    candidate.evidence.some((item) => item.relationship.clientId === obligation.clientId);
  const serviceMismatch =
    obligation.serviceOrderId !== undefined &&
    candidate.serviceOrderId !== undefined &&
    candidate.serviceOrderId !== obligation.serviceOrderId;
  const serviceMatches =
    obligation.serviceOrderId === undefined ||
    (candidate.serviceOrderId === obligation.serviceOrderId &&
      candidate.evidence.some(
        (item) => item.relationship.serviceOrderId === obligation.serviceOrderId,
      ));
  const amountOutcome: PaymentVerificationRuleOutcome =
    candidate.observedAmountMinor === undefined
      ? "unknown"
      : Number.isSafeInteger(candidate.observedAmountMinor) && candidate.observedAmountMinor >= 0
        ? "passed"
        : "failed";
  const currencyOutcome: PaymentVerificationRuleOutcome =
    candidate.currency === undefined
      ? "unknown"
      : candidate.currency === obligation.currency
        ? "passed"
        : "failed";
  const verifiedEvent = candidate.evidence.some(
    (item) =>
      item.evidenceType === "verified_provider_event" &&
      (item.status === "verified" || item.status === "verified_with_limitations"),
  );
  const freshEvidence = candidate.evidence.some((item) => item.freshness === "current");

  return [
    rule("provider_identity", providerMatches ? "passed" : "failed", "provider_identity_checked"),
    rule("environment", environmentMatches ? "passed" : "failed", "environment_checked"),
    rule(
      "object_relationship",
      objectMatches ? "passed" : "unknown",
      objectMatches ? "provider_object_linked" : "provider_object_link_missing",
    ),
    rule(
      "client_ownership",
      clientMismatch ? "failed" : clientMatches ? "passed" : "unknown",
      clientMismatch
        ? "client_mapping_mismatch"
        : clientMatches
          ? "client_mapping_verified"
          : "client_mapping_missing",
    ),
    rule(
      "service_order_relationship",
      serviceMismatch ? "failed" : serviceMatches ? "passed" : "unknown",
      serviceMismatch
        ? "service_order_mapping_mismatch"
        : serviceMatches
          ? "service_order_mapping_verified"
          : "service_order_mapping_missing",
    ),
    rule(
      "amount_match",
      amountOutcome,
      amountOutcome === "passed" ? "amount_observed" : "amount_missing_or_invalid",
    ),
    rule(
      "currency_match",
      currencyOutcome,
      currencyOutcome === "passed" ? "currency_verified" : "currency_missing_or_mismatch",
    ),
    rule("status_match", "passed", "candidate_status_supported"),
    rule(
      "event_verification",
      verifiedEvent ? "passed" : "unknown",
      verifiedEvent ? "verified_event_present" : "verified_event_missing",
    ),
    rule(
      "evidence_freshness",
      freshEvidence ? "passed" : "unknown",
      freshEvidence ? "current_evidence_present" : "current_evidence_missing",
    ),
  ];
}

function rule(
  ruleType: PaymentVerificationRuleType,
  outcome: PaymentVerificationRuleOutcome,
  reasonCode: string,
): RuleCheck {
  return { ruleType, outcome, reasonCode, summary: reasonCode.replaceAll("_", " ") };
}

function determineVerificationStatus(
  candidate: PaymentVerificationCandidate,
  obligation: PaymentObligation,
  policy: PaymentVerificationPolicy,
  checks: readonly RuleCheck[],
  prior: PaymentVerificationDecision | undefined,
): PaymentVerificationStatus {
  const required = checks.filter((item) => policy.requiredRuleTypes.includes(item.ruleType));
  if (required.some((item) => item.outcome === "failed")) return "conflicting";
  if (candidate.candidateType === "payment_processing_candidate") return "processing";
  if (candidate.candidateType === "payment_requires_action_candidate")
    return "requires_client_action";
  if (candidate.candidateType === "unknown_outcome_candidate") return "unknown";
  if (
    candidate.candidateType === "manual_external_evidence_candidate" ||
    candidate.evidence.some((item) => item.source === "manual_external")
  ) {
    return "insufficient_evidence";
  }
  if (required.some((item) => item.outcome !== "passed")) return "insufficient_evidence";
  if (!hasSufficientProviderEvidence(candidate.evidence, policy)) return "insufficient_evidence";
  if (candidate.candidateType === "payment_failure_candidate") return "verified_failed";
  if (candidate.candidateType === "dispute_adjustment_candidate") return "verified_disputed";
  if (candidate.candidateType === "reversal_candidate") return "verified_reversed";
  if (candidate.candidateType === "refund_adjustment_candidate") {
    if (!prior || !isPaidLike(prior.status) || candidate.observedAmountMinor === undefined) {
      return "conflicting";
    }
    if (candidate.observedAmountMinor > prior.verifiedAmountMinor) return "conflicting";
    return candidate.observedAmountMinor === prior.verifiedAmountMinor
      ? "verified_refunded_full"
      : "verified_refunded_partial";
  }
  if (positiveCandidates.includes(candidate.candidateType)) {
    if (candidate.observedAmountMinor === undefined) return "insufficient_evidence";
    if (candidate.observedAmountMinor < obligation.amountDueMinor) return "verified_partial";
    if (candidate.observedAmountMinor > obligation.amountDueMinor) return "verified_overpaid";
    return "verified_paid";
  }
  return "unknown";
}

function hasSufficientProviderEvidence(
  evidence: readonly PaymentVerificationEvidence[],
  policy: PaymentVerificationPolicy,
): boolean {
  return evidence.some(
    (item) =>
      item.status === "verified" &&
      policy.acceptedTrustTiers.includes(item.trustTier) &&
      (!policy.requiresCurrentEvidenceForPositiveDecision || item.freshness === "current"),
  );
}

function isPaidLike(status: PaymentVerificationStatus): boolean {
  return [
    "verified_paid",
    "verified_overpaid",
    "verified_partial",
    "verified_refunded_partial",
  ].includes(status);
}

function calculateDecisionAmounts(
  status: PaymentVerificationStatus,
  candidate: PaymentVerificationCandidate,
  obligation: PaymentObligation,
  prior: PaymentVerificationDecision | undefined,
): Readonly<{
  verifiedAmountMinor: number;
  adjustmentAmountMinor: number;
  unappliedAmountMinor: number;
}> {
  const observed = candidate.observedAmountMinor ?? 0;
  if (status === "verified_paid") {
    return {
      verifiedAmountMinor: obligation.amountDueMinor,
      adjustmentAmountMinor: 0,
      unappliedAmountMinor: 0,
    };
  }
  if (status === "verified_partial") {
    return { verifiedAmountMinor: observed, adjustmentAmountMinor: 0, unappliedAmountMinor: 0 };
  }
  if (status === "verified_overpaid") {
    return {
      verifiedAmountMinor: obligation.amountDueMinor,
      adjustmentAmountMinor: 0,
      unappliedAmountMinor: observed - obligation.amountDueMinor,
    };
  }
  if (status === "verified_refunded_partial") {
    return {
      verifiedAmountMinor: Math.max(0, (prior?.verifiedAmountMinor ?? 0) - observed),
      adjustmentAmountMinor: observed,
      unappliedAmountMinor: 0,
    };
  }
  if (status === "verified_refunded_full" || status === "verified_reversed") {
    return {
      verifiedAmountMinor: 0,
      adjustmentAmountMinor: prior?.verifiedAmountMinor ?? observed,
      unappliedAmountMinor: 0,
    };
  }
  if (status === "verified_disputed") {
    return {
      verifiedAmountMinor: prior?.verifiedAmountMinor ?? 0,
      adjustmentAmountMinor: 0,
      unappliedAmountMinor: 0,
    };
  }
  return { verifiedAmountMinor: 0, adjustmentAmountMinor: 0, unappliedAmountMinor: 0 };
}

function deriveReasonCodes(
  status: PaymentVerificationStatus,
  checks: readonly RuleCheck[],
  candidate: PaymentVerificationCandidate,
): readonly string[] {
  const issues = checks.filter((item) => item.outcome !== "passed").map((item) => item.reasonCode);
  const primary =
    status === "verified_paid"
      ? "payment_verified"
      : status === "verified_partial"
        ? "partial_payment_verified"
        : status === "verified_overpaid"
          ? "overpayment_requires_allocation"
          : status === "verified_refunded_partial"
            ? "refund_requires_payment_gate_reverification"
            : status === "verified_refunded_full"
              ? "full_refund_blocks_payment_gate"
              : status === "verified_disputed"
                ? "dispute_blocks_payment_gate"
                : status === "verified_reversed"
                  ? "reversal_blocks_payment_gate"
                  : status === "insufficient_evidence" &&
                      (candidate.candidateType === "manual_external_evidence_candidate" ||
                        candidate.evidence.some((item) => item.source === "manual_external"))
                    ? "manual_external_evidence_requires_human_review"
                    : status;
  return [...new Set([primary, ...issues])];
}

function createSufficiencyAssessment(
  decision: PaymentVerificationDecision,
  obligation: PaymentObligation,
  assessedAt: string,
): PaymentSufficiencyAssessment {
  const status = sufficiencyStatusFor(decision.status);
  const outstanding =
    status === "satisfied" || status === "overpaid"
      ? 0
      : Math.max(0, obligation.amountDueMinor - decision.verifiedAmountMinor);
  return {
    id: `pvs_${decision.id}`,
    paymentObligationId: obligation.id,
    decisionId: decision.id,
    status,
    amountDueMinor: obligation.amountDueMinor,
    verifiedAmountMinor: decision.verifiedAmountMinor,
    outstandingAmountMinor: outstanding,
    unappliedAmountMinor: decision.unappliedAmountMinor,
    currency: obligation.currency,
    assessedAt,
  };
}

function sufficiencyStatusFor(status: PaymentVerificationStatus): PaymentSufficiencyStatus {
  if (status === "verified_paid") return "satisfied";
  if (status === "verified_overpaid") return "overpaid";
  if (status === "verified_partial" || status === "verified_refunded_partial")
    return "partially_satisfied";
  if (
    [
      "verified_failed",
      "verified_cancelled",
      "verified_refunded_full",
      "verified_reversed",
    ].includes(status)
  ) {
    return "not_satisfied";
  }
  return "indeterminate";
}

function createPaymentStartGate(
  decision: PaymentVerificationDecision,
  obligation: PaymentObligation,
  sufficiency: PaymentSufficiencyAssessment,
  evaluatedAt: string,
): PaymentStartGate {
  const status = adverseStatuses.includes(decision.status)
    ? "blocked_by_refund_or_dispute"
    : sufficiency.status === "satisfied" || sufficiency.status === "overpaid"
      ? "payment_satisfied_pending_human_approval"
      : "payment_not_satisfied";
  return {
    id: `pv_gate_${decision.id}`,
    paymentObligationId: obligation.id,
    serviceOrderId: obligation.serviceOrderId,
    decisionId: decision.id,
    sufficiencyAssessmentId: sufficiency.id,
    status,
    reasonCodes: decision.reasonCodes,
    evaluatedAt,
  };
}

function obligationStatusFor(status: PaymentSufficiencyStatus): PaymentObligationStatus {
  if (status === "satisfied") return "satisfied";
  if (status === "overpaid") return "overpaid";
  if (status === "partially_satisfied") return "partially_satisfied";
  if (status === "not_satisfied") return "active";
  return "unknown";
}

function caseStatusFor(status: PaymentVerificationStatus): PaymentVerificationCase["status"] {
  if (["verified_paid", "verified_overpaid", "verified_partial"].includes(status))
    return "verified";
  if (["insufficient_evidence", "conflicting", "verified_disputed"].includes(status))
    return "manual_review";
  if (["processing", "requires_client_action"].includes(status)) return "verification_pending";
  return "attention_required";
}

function requiresManualReview(
  status: PaymentVerificationStatus,
  candidate: PaymentVerificationCandidate,
  checks: readonly RuleCheck[],
): boolean {
  return (
    ["conflicting", "insufficient_evidence", "unknown", "verified_disputed"].includes(status) ||
    candidate.candidateType === "manual_external_evidence_candidate" ||
    candidate.evidence.some((item) => item.source === "manual_external") ||
    checks.some((item) => item.outcome === "failed")
  );
}

function queueFor(
  status: PaymentVerificationStatus,
  candidate: PaymentVerificationCandidate,
): PaymentVerificationManualReviewQueue {
  if (
    candidate.candidateType === "manual_external_evidence_candidate" ||
    candidate.evidence.some((item) => item.source === "manual_external")
  )
    return "manual_external_payment";
  if (status === "verified_disputed") return "dispute_reverification";
  if (
    status === "verified_refunded_partial" ||
    status === "verified_refunded_full" ||
    candidate.candidateType === "refund_adjustment_candidate"
  )
    return "refund_reverification";
  if (status === "conflicting") return "amount_currency_mismatch";
  if (status === "unknown") return "unknown_outcome";
  return "evidence_refresh";
}
