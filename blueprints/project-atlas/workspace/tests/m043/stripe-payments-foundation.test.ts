import { createHmac } from "node:crypto";

import {
  MemoryStripePaymentsRepository,
  StripePaymentAdapter,
  StripePaymentsService,
  verifyStripeSignature,
  verifyStripeSignatureWithRotation,
} from "@atlas/billing";
import { describe, expect, it } from "vitest";

const createdAt = "2026-08-26T12:00:00.000Z";

const checkoutInput = {
  operationRef: "operation-001",
  paymentOrder: {
    paymentOrderId: "payment-order-001",
    commercialOrderId: "commercial-order-001",
    serviceOrderId: "service-order-001",
    commercialState: "payment_pending" as const,
  },
  clientId: "client-001",
  environment: "test" as const,
  catalog: {
    sourceModule: "m042" as const,
    serviceDefinitionId: "service-001",
    serviceDefinitionVersionId: "service-version-001",
    serviceCode: "CREDIT_REVIEW",
  },
  pricingSnapshot: {
    sourceModule: "m046" as const,
    quoteId: "quote-001",
    pricingVersion: "2026.08.1",
    currency: "USD" as const,
    totalAmountMinor: 29_900,
    checksum: "pricing-checksum",
    calculatedAt: createdAt,
  },
  checkoutProfile: {
    code: "client-payment-v1",
    successPath: "/client/payments/return",
    cancelPath: "/client/payments",
    allowedLocales: ["en", "es"] as const,
    collectBillingAddress: true,
    allowPromotionCodes: false,
  },
  locale: "es" as const,
  correlationId: "corr-001",
  idempotencyKey: "checkout:payment-order-001:v1",
  createdAt,
};

describe("M043 Stripe payments controlled foundation", () => {
  it("creates an idempotent local checkout plan from an M046 pricing snapshot", () => {
    const repository = new MemoryStripePaymentsRepository();
    const service = new StripePaymentsService(repository);

    const first = service.prepareCheckout(checkoutInput);
    const second = service.prepareCheckout(checkoutInput);

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(first.transaction.amountMinor).toBe(29_900);
    expect(first.transaction.state).toBe("checkout_requested");
    expect(first.checkout.status).toBe("provider_creation_pending");
    expect(repository.audits).toHaveLength(1);
  });

  it("rejects non-authoritative pricing input rather than trusting a caller amount", () => {
    const service = new StripePaymentsService(new MemoryStripePaymentsRepository());

    expect(() =>
      service.prepareCheckout({
        ...checkoutInput,
        pricingSnapshot: {
          ...checkoutInput.pricingSnapshot,
          sourceModule: "m042" as unknown as "m046",
        },
      }),
    ).toThrow("M043 only accepts pricing snapshots issued by M046");
  });

  it("rejects a provider checkout redirect that is not an approved application path", () => {
    const service = new StripePaymentsService(new MemoryStripePaymentsRepository());

    expect(() =>
      service.prepareCheckout({
        ...checkoutInput,
        checkoutProfile: {
          ...checkoutInput.checkoutProfile,
          successPath: "https://untrusted.example/return",
        },
      }),
    ).toThrow("M043 checkout destinations must be approved application-relative paths");
  });

  it("creates a verification candidate without marking payment verified or starting work", () => {
    const repository = new MemoryStripePaymentsRepository();
    const service = new StripePaymentsService(repository);
    const prepared = service.prepareCheckout(checkoutInput);
    const event = service.recordVerifiedInboundEvent({
      id: "event-record-001",
      environment: "test",
      providerEventId: "evt_001",
      eventType: "payment_intent.succeeded",
      payloadHash: "hash",
      occurredAt: createdAt,
      receivedAt: createdAt,
      signatureVersion: "v1",
      status: "normalized",
      correlationId: "corr-001",
    });
    const candidate = service.createPaymentVerificationCandidate({
      eventRecordId: event.event.id,
      providerEventId: event.event.providerEventId,
      environment: "test",
      eventType: "payment_intent.succeeded",
      providerObjectReference: {
        provider: "stripe",
        environment: "test",
        objectKind: "payment_intent",
        providerObjectId: "pi_001",
        createdAt,
      },
      transactionId: prepared.transaction.id,
      amountMinor: 29_900,
      currency: "USD",
      occurredAt: createdAt,
      correlationId: "corr-001",
    });

    expect(candidate?.status).toBe("candidate_created");
    expect(repository.transactions.get(prepared.transaction.id)?.state).toBe("checkout_requested");
    expect(repository.candidates.size).toBe(1);
  });

  it("deduplicates inbound provider events and leaves the first evidence intact", () => {
    const service = new StripePaymentsService(new MemoryStripePaymentsRepository());
    const first = service.recordVerifiedInboundEvent({
      id: "event-record-001",
      environment: "test",
      providerEventId: "evt_duplicate",
      eventType: "checkout.session.completed",
      payloadHash: "first",
      occurredAt: createdAt,
      receivedAt: createdAt,
      signatureVersion: "v1",
      status: "signature_verified",
      correlationId: "corr-001",
    });
    const duplicate = service.recordVerifiedInboundEvent({
      ...first.event,
      id: "event-record-002",
      payloadHash: "different",
    });

    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.event.payloadHash).toBe("first");
  });

  it("requires a separate approval before a refund can ever reach the provider", () => {
    const repository = new MemoryStripePaymentsRepository();
    const service = new StripePaymentsService(repository);
    const prepared = service.prepareCheckout(checkoutInput);

    const request = service.requestRefund({
      id: "refund-request-001",
      paymentTransactionId: prepared.transaction.id,
      paymentOrderId: "payment-order-001",
      requestedAmountMinor: 10_000,
      currency: "USD",
      reasonCode: "client_request",
      requestedBy: "staff-001",
      requestedAt: createdAt,
      approvalRequestId: "approval-001",
      idempotencyKey: "refund:payment-order-001:1",
    });

    expect(request.status).toBe("awaiting_approval");
    expect(repository.refundRequests.get(request.id)?.status).toBe("awaiting_approval");
  });

  it("fails closed for every Stripe provider action", async () => {
    const adapter = new StripePaymentAdapter();

    await expect(adapter.createCheckoutSession(checkoutInput)).rejects.toThrow(
      "M043 Stripe provider operations are disabled",
    );
    expect(adapter.runtimeState).toBe("provider_disabled");
    expect(adapter.capabilities.supportsCheckout).toBe(false);
  });

  it("verifies raw signed payloads including a rotated signing secret", () => {
    const body = new TextEncoder().encode('{"id":"evt_001"}');
    const timestamp = 1_000;
    const currentSecret = "whsec_current_signing_secret";
    const previousSecret = "whsec_previous_signing_secret";
    const signature = createHmac("sha256", previousSecret)
      .update(`${String(timestamp)}.{"id":"evt_001"}`)
      .digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(verifyStripeSignature(body, header, previousSecret, timestamp)).toBe(true);
    expect(
      verifyStripeSignatureWithRotation(body, header, [currentSecret, previousSecret], timestamp),
    ).toBe(true);
    expect(verifyStripeSignature(body, header, currentSecret, timestamp)).toBe(false);
  });
});
