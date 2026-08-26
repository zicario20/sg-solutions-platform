import type {
  PaymentObligation,
  PaymentStartGate,
  PaymentSufficiencyAssessment,
  PaymentVerificationAuditEvent,
  PaymentVerificationCandidate,
  PaymentVerificationCase,
  PaymentVerificationDecision,
  PaymentVerificationEvidence,
  PaymentVerificationManualReview,
  PaymentVerificationOutboxEvent,
  PaymentVerificationOverride,
  PaymentVerificationRuleEvaluation,
  PaymentVerificationRun,
} from "./contracts.ts";

export interface PaymentVerificationRepository {
  findPaymentObligation(id: string): PaymentObligation | undefined;
  savePaymentObligation(obligation: PaymentObligation): PaymentObligation;
  findCaseByObligationId(paymentObligationId: string): PaymentVerificationCase | undefined;
  saveCase(verificationCase: PaymentVerificationCase): PaymentVerificationCase;
  saveCandidate(candidate: PaymentVerificationCandidate): PaymentVerificationCandidate;
  saveEvidence(evidence: PaymentVerificationEvidence): PaymentVerificationEvidence;
  saveRun(run: PaymentVerificationRun): PaymentVerificationRun;
  findDecisionByIdempotencyKey(idempotencyKey: string): PaymentVerificationDecision | undefined;
  findLatestDecisionByObligationId(
    paymentObligationId: string,
  ): PaymentVerificationDecision | undefined;
  saveDecision(decision: PaymentVerificationDecision): PaymentVerificationDecision;
  saveRuleEvaluation(
    evaluation: PaymentVerificationRuleEvaluation,
  ): PaymentVerificationRuleEvaluation;
  ruleEvaluationsForDecision(decisionId: string): readonly PaymentVerificationRuleEvaluation[];
  findSufficiencyByDecisionId(decisionId: string): PaymentSufficiencyAssessment | undefined;
  saveSufficiency(assessment: PaymentSufficiencyAssessment): PaymentSufficiencyAssessment;
  findGateByDecisionId(decisionId: string): PaymentStartGate | undefined;
  saveGate(gate: PaymentStartGate): PaymentStartGate;
  saveManualReview(review: PaymentVerificationManualReview): PaymentVerificationManualReview;
  saveOverride(override: PaymentVerificationOverride): PaymentVerificationOverride;
  appendOutbox(event: PaymentVerificationOutboxEvent): PaymentVerificationOutboxEvent;
  appendAudit(event: PaymentVerificationAuditEvent): PaymentVerificationAuditEvent;
}

/**
 * Controlled-foundation repository only. A future PostgreSQL gateway must save an obligation update,
 * immutable decision, rule evaluations, sufficiency, gate, outbox and audit in one transaction.
 */
export class MemoryPaymentVerificationRepository implements PaymentVerificationRepository {
  readonly obligations = new Map<string, PaymentObligation>();
  readonly cases = new Map<string, PaymentVerificationCase>();
  readonly candidates = new Map<string, PaymentVerificationCandidate>();
  readonly evidence = new Map<string, PaymentVerificationEvidence>();
  readonly runs = new Map<string, PaymentVerificationRun>();
  readonly decisions = new Map<string, PaymentVerificationDecision>();
  readonly decisionsByIdempotencyKey = new Map<string, PaymentVerificationDecision>();
  readonly decisionIdsByObligation = new Map<string, string[]>();
  readonly ruleEvaluations = new Map<string, PaymentVerificationRuleEvaluation>();
  readonly sufficiencies = new Map<string, PaymentSufficiencyAssessment>();
  readonly sufficienciesByDecision = new Map<string, PaymentSufficiencyAssessment>();
  readonly gates = new Map<string, PaymentStartGate>();
  readonly gatesByDecision = new Map<string, PaymentStartGate>();
  readonly manualReviews = new Map<string, PaymentVerificationManualReview>();
  readonly overrides = new Map<string, PaymentVerificationOverride>();
  readonly outbox: PaymentVerificationOutboxEvent[] = [];
  readonly audits: PaymentVerificationAuditEvent[] = [];

  findPaymentObligation(id: string): PaymentObligation | undefined {
    return this.obligations.get(id);
  }
  savePaymentObligation(obligation: PaymentObligation): PaymentObligation {
    this.obligations.set(obligation.id, obligation);
    return obligation;
  }
  findCaseByObligationId(paymentObligationId: string): PaymentVerificationCase | undefined {
    return [...this.cases.values()].find(
      (item) => item.paymentObligationId === paymentObligationId,
    );
  }
  saveCase(verificationCase: PaymentVerificationCase): PaymentVerificationCase {
    this.cases.set(verificationCase.id, verificationCase);
    return verificationCase;
  }
  saveCandidate(candidate: PaymentVerificationCandidate): PaymentVerificationCandidate {
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }
  saveEvidence(evidence: PaymentVerificationEvidence): PaymentVerificationEvidence {
    this.evidence.set(evidence.id, evidence);
    return evidence;
  }
  saveRun(run: PaymentVerificationRun): PaymentVerificationRun {
    this.runs.set(run.id, run);
    return run;
  }
  findDecisionByIdempotencyKey(idempotencyKey: string): PaymentVerificationDecision | undefined {
    return this.decisionsByIdempotencyKey.get(idempotencyKey);
  }
  findLatestDecisionByObligationId(
    paymentObligationId: string,
  ): PaymentVerificationDecision | undefined {
    const ids = this.decisionIdsByObligation.get(paymentObligationId) ?? [];
    const latest = ids.at(-1);
    return latest ? this.decisions.get(latest) : undefined;
  }
  saveDecision(decision: PaymentVerificationDecision): PaymentVerificationDecision {
    const existing = this.decisionsByIdempotencyKey.get(decision.idempotencyKey);
    if (existing) return existing;
    this.decisions.set(decision.id, decision);
    this.decisionsByIdempotencyKey.set(decision.idempotencyKey, decision);
    const ids = this.decisionIdsByObligation.get(decision.paymentObligationId) ?? [];
    this.decisionIdsByObligation.set(decision.paymentObligationId, [...ids, decision.id]);
    return decision;
  }
  saveRuleEvaluation(
    evaluation: PaymentVerificationRuleEvaluation,
  ): PaymentVerificationRuleEvaluation {
    this.ruleEvaluations.set(evaluation.id, evaluation);
    return evaluation;
  }
  ruleEvaluationsForDecision(decisionId: string): readonly PaymentVerificationRuleEvaluation[] {
    return [...this.ruleEvaluations.values()].filter((item) => item.decisionId === decisionId);
  }
  findSufficiencyByDecisionId(decisionId: string): PaymentSufficiencyAssessment | undefined {
    return this.sufficienciesByDecision.get(decisionId);
  }
  saveSufficiency(assessment: PaymentSufficiencyAssessment): PaymentSufficiencyAssessment {
    this.sufficiencies.set(assessment.id, assessment);
    this.sufficienciesByDecision.set(assessment.decisionId, assessment);
    return assessment;
  }
  findGateByDecisionId(decisionId: string): PaymentStartGate | undefined {
    return this.gatesByDecision.get(decisionId);
  }
  saveGate(gate: PaymentStartGate): PaymentStartGate {
    this.gates.set(gate.id, gate);
    this.gatesByDecision.set(gate.decisionId, gate);
    return gate;
  }
  saveManualReview(review: PaymentVerificationManualReview): PaymentVerificationManualReview {
    this.manualReviews.set(review.id, review);
    return review;
  }
  saveOverride(override: PaymentVerificationOverride): PaymentVerificationOverride {
    this.overrides.set(override.id, override);
    return override;
  }
  appendOutbox(event: PaymentVerificationOutboxEvent): PaymentVerificationOutboxEvent {
    const existing = this.outbox.find((item) => item.idempotencyKey === event.idempotencyKey);
    if (existing) return existing;
    this.outbox.push(event);
    return event;
  }
  appendAudit(event: PaymentVerificationAuditEvent): PaymentVerificationAuditEvent {
    this.audits.push(event);
    return event;
  }
}
