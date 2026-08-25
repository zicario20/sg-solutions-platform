import {
  activateEntitlement,
  consumeEntitlement,
  movePaymentToInternalReview,
  transitionCommercialOrder,
} from "@atlas/commercial-workflows";
import { describe, expect, it } from "vitest";

describe("M021 commercial workflow foundation", () => {
  it("requires internal review after payment and before operational work", () => {
    const paid = {
      orderId: "order-1",
      state: "payment_confirmed" as const,
      requiresInternalApproval: true,
      paymentConfirmed: true,
      approvalGranted: false,
      operationalWorkflowAvailable: true,
      version: 1,
    };
    expect(movePaymentToInternalReview(paid)).toMatchObject({
      accepted: true,
      state: "pending_internal_review",
    });
    expect(
      transitionCommercialOrder(
        { ...paid, state: "pending_internal_review" },
        "start_operational_workflow",
      ).accepted,
    ).toBe(false);
  });
  it("activates and consumes an entitlement without allowing overuse", () => {
    const active = activateEntitlement(
      {
        grantId: "grant-1",
        entitlementCode: "CONSULTATION",
        status: "pending",
        quantityGranted: 2,
        quantityUsed: 0,
        effectiveFrom: "2026-08-25",
        sourceOrderId: "order-1",
        sourceVersion: "1.0.0",
      },
      true,
    );
    expect(consumeEntitlement(active, 1)).toMatchObject({
      accepted: true,
      grant: { quantityUsed: 1 },
    });
    expect(consumeEntitlement(active, 3).accepted).toBe(false);
  });
});
