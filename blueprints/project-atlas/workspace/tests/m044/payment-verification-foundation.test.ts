import type {
  PaymentObligation,
  PaymentVerificationCandidate,
  PaymentVerificationEvidence,
} from "@atlas/payment-verification";
import {
  bindM043PaymentVerificationCandidate,
  createDefaultPaymentVerificationPolicy,
  hashPaymentVerificationValue,
  MemoryPaymentVerificationRepository,
  PaymentVerificationService,
} from "@atlas/payment-verification";
import { describe, expect, it } from "vitest";

const at = "2026-08-26T12:00:00.000Z";
const actor = { actorType: "system" as const, purpose: "payment_verification" as const };

function obligation(overrides: Partial<PaymentObligation> = {}): PaymentObligation {
  return {
    id: "obligation-001",
    clientId: "client-001",
    serviceOrderId: "service-order-001",
    quoteId: "quote-001",
    obligationType: "full_payment",
    amountDueMinor: 29_900,
    currency: "USD",
    dueStage: "before_start",
    pricingSnapshotId: "pricing-001",
    status: "active",
    version: 1,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

function evidence(
  overrides: Partial<PaymentVerificationEvidence> = {},
): PaymentVerificationEvidence {
  return {
    id: "evidence-001",
    source: "provider_adapter",
    sourceVersion: "v1",
    provider: "test-provider",
    providerEnvironment: "test",
    evidenceType: "verified_provider_event",
    providerObjectReference: "provider-object-001",
    providerEventReference: "provider-event-001",
    status: "verified",
    freshness: "current",
    trustTier: 1,
    integrityHash: hashPaymentVerificationValue("evidence-001"),
    relationship: {
      clientId: "client-001",
      paymentObligationId: "obligation-001",
      paymentTransactionId: "transaction-001",
      serviceOrderId: "service-order-001",
      quoteId: "quote-001",
      providerStateVersion: "provider-state-001",
      amountMinor: 29_900,
      currency: "USD",
    },
    observedAt: at,
    receivedAt: at,
    ...overrides,
  };
}

function candidate(
  overrides: Partial<PaymentVerificationCandidate> = {},
): PaymentVerificationCandidate {
  return {
    id: "candidate-001",
    sourceModule: "provider_adapter",
    provider: "test-provider",
    providerEnvironment: "test",
    candidateType: "payment_success_candidate",
    paymentObligationId: "obligation-001",
    clientId: "client-001",
    serviceOrderId: "service-order-001",
    quoteId: "quote-001",
    paymentTransactionIds: ["transaction-001"],
    expectedAmountMinor: 29_900,
    observedAmountMinor: 29_900,
    currency: "USD",
    providerStateVersion: "provider-state-001",
    evidence: [evidence()],
    correlationId: "correlation-001",
    receivedAt: at,
    ...overrides,
  };
}

describe("M044 payment verification controlled foundation", () => {
  it("verifies matching current provider evidence and leaves the start gate pending human approval", () => {
    const repository = new MemoryPaymentVerificationRepository();
    const result = new PaymentVerificationService(repository).evaluate({
      candidate: candidate(),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });

    expect(result.decision.status).toBe("verified_paid");
    expect(result.sufficiency.status).toBe("satisfied");
    expect(result.paymentStartGate.status).toBe("payment_satisfied_pending_human_approval");
    expect(result.manualReview).toBeUndefined();
    expect(repository.outbox.every((event) => event.dispatchState === "blocked")).toBe(true);
  });

  it("deduplicates the same obligation, provider state, policy and evidence without creating a second decision", () => {
    const repository = new MemoryPaymentVerificationRepository();
    const service = new PaymentVerificationService(repository);
    const first = service.evaluate({
      candidate: candidate(),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });
    const replay = service.evaluate({
      candidate: candidate(),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });

    expect(first.idempotent).toBe(false);
    expect(replay.idempotent).toBe(true);
    expect(replay.decision.id).toBe(first.decision.id);
    expect(repository.decisions.size).toBe(1);
  });

  it("blocks a client ownership mismatch instead of using amount coincidence as proof", () => {
    const result = new PaymentVerificationService(
      new MemoryPaymentVerificationRepository(),
    ).evaluate({
      candidate: candidate({
        clientId: "client-other",
        providerStateVersion: "provider-state-cross-client",
      }),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });

    expect(result.decision.status).toBe("conflicting");
    expect(result.paymentStartGate.status).toBe("payment_not_satisfied");
    expect(result.manualReview?.queue).toBe("amount_currency_mismatch");
  });

  it("keeps the historical paid decision and supersedes it when a verified refund changes the payment fact", () => {
    const repository = new MemoryPaymentVerificationRepository();
    const service = new PaymentVerificationService(repository);
    const paid = service.evaluate({
      candidate: candidate(),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });
    const refunded = service.evaluate({
      candidate: candidate({
        id: "candidate-refund-001",
        candidateType: "refund_adjustment_candidate",
        observedAmountMinor: 10_000,
        providerStateVersion: "provider-refund-001",
        evidence: [
          evidence({
            id: "evidence-refund-001",
            integrityHash: hashPaymentVerificationValue("refund-evidence"),
            relationship: {
              clientId: "client-001",
              paymentObligationId: "obligation-001",
              paymentTransactionId: "transaction-001",
              serviceOrderId: "service-order-001",
              quoteId: "quote-001",
              providerStateVersion: "provider-refund-001",
              amountMinor: 10_000,
              currency: "USD",
            },
          }),
        ],
      }),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: "2026-08-26T12:05:00.000Z",
    });

    expect(paid.decision.status).toBe("verified_paid");
    expect(repository.decisions.get(paid.decision.id)?.status).toBe("verified_paid");
    expect(refunded.decision.status).toBe("verified_refunded_partial");
    expect(refunded.decision.supersedesDecisionId).toBe(paid.decision.id);
    expect(refunded.paymentStartGate.status).toBe("blocked_by_refund_or_dispute");
  });

  it("records partial and overpaid amounts separately without treating either as normal full payment", () => {
    const partialEvidence = evidence({
      id: "evidence-partial-001",
      integrityHash: hashPaymentVerificationValue("partial"),
      relationship: {
        clientId: "client-001",
        paymentObligationId: "obligation-001",
        paymentTransactionId: "transaction-001",
        serviceOrderId: "service-order-001",
        quoteId: "quote-001",
        providerStateVersion: "provider-partial-001",
        amountMinor: 10_000,
        currency: "USD",
      },
    });
    const partial = new PaymentVerificationService(
      new MemoryPaymentVerificationRepository(),
    ).evaluate({
      candidate: candidate({
        observedAmountMinor: 10_000,
        providerStateVersion: "provider-partial-001",
        evidence: [partialEvidence],
      }),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });
    const overpaidEvidence = evidence({
      id: "evidence-overpaid-001",
      integrityHash: hashPaymentVerificationValue("overpaid"),
      relationship: {
        clientId: "client-001",
        paymentObligationId: "obligation-001",
        paymentTransactionId: "transaction-001",
        serviceOrderId: "service-order-001",
        quoteId: "quote-001",
        providerStateVersion: "provider-overpaid-001",
        amountMinor: 35_000,
        currency: "USD",
      },
    });
    const overpaid = new PaymentVerificationService(
      new MemoryPaymentVerificationRepository(),
    ).evaluate({
      candidate: candidate({
        observedAmountMinor: 35_000,
        providerStateVersion: "provider-overpaid-001",
        evidence: [overpaidEvidence],
      }),
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });

    expect(partial.decision.status).toBe("verified_partial");
    expect(partial.sufficiency.status).toBe("partially_satisfied");
    expect(overpaid.decision.status).toBe("verified_overpaid");
    expect(overpaid.decision.unappliedAmountMinor).toBe(5_100);
  });

  it("maps M043 evidence only as limited unknown-freshness evidence, requiring reconciliation before verification", () => {
    const mapped = bindM043PaymentVerificationCandidate(
      {
        id: "pvc_event-001",
        sourceModule: "m043",
        eventRecordId: "event-001",
        paymentTransactionId: "transaction-001",
        candidateType: "payment_succeeded",
        status: "candidate_created",
        evidence: [
          {
            provider: "stripe",
            environment: "test",
            objectKind: "payment_intent",
            providerObjectId: "pi_001",
            createdAt: at,
          },
        ],
        expectedAmountMinor: 29_900,
        observedAmountMinor: 29_900,
        currency: "USD",
        correlationId: "correlation-001",
        createdAt: at,
      },
      {
        paymentObligationId: "obligation-001",
        clientId: "client-001",
        serviceOrderId: "service-order-001",
        quoteId: "quote-001",
        providerStateVersion: "event-001",
      },
    );
    const result = new PaymentVerificationService(
      new MemoryPaymentVerificationRepository(),
    ).evaluate({
      candidate: mapped,
      obligation: obligation(),
      policy: createDefaultPaymentVerificationPolicy(),
      actor,
      evaluatedAt: at,
    });

    expect(mapped.evidence[0]?.status).toBe("verified_with_limitations");
    expect(mapped.evidence[0]?.freshness).toBe("unknown");
    expect(result.decision.status).toBe("insufficient_evidence");
    expect(result.manualReview?.queue).toBe("evidence_refresh");
  });
});
