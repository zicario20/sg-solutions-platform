import {
  createDefaultPaymentVerificationPolicy,
  createPaymentVerificationRuntimeControls,
  DisabledPaymentVerificationRuntimeAdapter,
  hashPaymentVerificationValue,
  MemoryPaymentVerificationRepository,
  PaymentVerificationService,
} from "@atlas/payment-verification";
import { describe, expect, it } from "vitest";

const at = "2026-08-26T12:00:00.000Z";

describe("M044 payment verification controls", () => {
  it("fails closed for runtime ingress and downstream handoffs", () => {
    const adapter = new DisabledPaymentVerificationRuntimeAdapter();

    expect(createPaymentVerificationRuntimeControls().runtimeState).toBe("provider_disabled");
    expect(() => adapter.admitProviderCandidate({} as never)).toThrow(
      "M044 payment verification runtime is disabled",
    );
    expect(() => adapter.createHandoff("decision-001", "m045")).toThrow(
      "M044 entitlement and workflow handoffs are disabled",
    );
  });

  it("rejects AI attempts to create a payment decision", () => {
    const service = new PaymentVerificationService(new MemoryPaymentVerificationRepository());

    expect(() =>
      service.evaluate({
        candidate: {
          id: "candidate-001",
          sourceModule: "provider_adapter",
          provider: "test-provider",
          providerEnvironment: "test",
          candidateType: "payment_success_candidate",
          paymentObligationId: "obligation-001",
          clientId: "client-001",
          paymentTransactionIds: ["transaction-001"],
          observedAmountMinor: 100,
          currency: "USD",
          providerStateVersion: "state-001",
          evidence: [
            {
              id: "evidence-001",
              source: "provider_adapter",
              sourceVersion: "v1",
              provider: "test-provider",
              providerEnvironment: "test",
              evidenceType: "verified_provider_event",
              status: "verified",
              freshness: "current",
              trustTier: 1,
              integrityHash: hashPaymentVerificationValue("evidence"),
              relationship: {
                clientId: "client-001",
                paymentObligationId: "obligation-001",
                paymentTransactionId: "transaction-001",
              },
              observedAt: at,
              receivedAt: at,
            },
          ],
          correlationId: "correlation-001",
          receivedAt: at,
        },
        obligation: {
          id: "obligation-001",
          clientId: "client-001",
          obligationType: "full_payment",
          amountDueMinor: 100,
          currency: "USD",
          dueStage: "before_start",
          pricingSnapshotId: "pricing-001",
          status: "active",
          version: 1,
          createdAt: at,
          updatedAt: at,
        },
        policy: createDefaultPaymentVerificationPolicy(),
        actor: { actorType: "ai", purpose: "payment_verification" },
        evaluatedAt: at,
      }),
    ).toThrow("M044 AI actors cannot issue payment verification decisions or overrides.");
  });

  it("records an override request only and never mutates a financial decision", () => {
    const repository = new MemoryPaymentVerificationRepository();
    const override = new PaymentVerificationService(repository).requestOverride({
      verificationCaseId: "case-001",
      decisionId: "decision-001",
      requestedBy: { actorType: "staff", actorId: "staff-001", purpose: "payment_verification" },
      approvalReference: "approval-001",
      reasonCode: "reconciliation_exception",
      expiresAt: "2026-08-27T12:00:00.000Z",
      requestedAt: at,
    });

    expect(override.status).toBe("requested");
    expect(repository.overrides.get(override.id)?.decisionId).toBe("decision-001");
    expect(repository.decisions.size).toBe(0);
  });
});
