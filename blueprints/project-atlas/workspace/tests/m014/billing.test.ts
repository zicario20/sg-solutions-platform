import { createHmac } from "node:crypto";
import { MemoryBillingRepository, verifyStripeSignature } from "@atlas/billing";
import { describe, expect, it } from "vitest";

const actor = {
  accountId: "account-a",
  contextRef: "ctx-a",
  authorizationEpoch: "1",
  policyEpoch: "1",
};
describe("M014 billing", () => {
  it("uses a server-owned integer obligation and keeps payment separate from service execution", async () => {
    const repo = new MemoryBillingRepository();
    repo.seed({
      paymentRef: "payment-1",
      serviceOrderRef: "order-1",
      ownerAccountId: "account-a",
      contextRef: "ctx-a",
      authorizationEpoch: "1",
      policyEpoch: "1",
      label: "Consultation",
      amountMinor: 12500,
      currency: "USD",
      state: "open",
      version: 1,
    });
    const checkout = await repo.checkout(actor, "payment-1", "checkout-1");
    if (checkout.kind !== "ready") throw new Error("checkout");
    expect(
      await repo.apply({
        eventId: "evt-1",
        type: "checkout.session.completed",
        checkoutRef: checkout.checkoutRef,
        amountMinor: 12500,
        currency: "USD",
      }),
    ).toBe("applied");
    expect((await repo.list(actor))[0]).toMatchObject({
      state: "provider_succeeded_pending_verification",
      serviceOrderRef: "order-1",
    });
  });
  it("rejects an invalid Stripe signature", () => {
    const body = "{}",
      secret = "stripe_test_secret_1234",
      now = 1700000000,
      signature = createHmac("sha256", secret).update(`${now}.${body}`).digest("hex");
    expect(verifyStripeSignature(body, `t=${now},v1=${signature}`, secret, now)).toBe(true);
    expect(verifyStripeSignature(body, `t=${now},v1=00`, secret, now)).toBe(false);
  });
});
describe("M014 webhook replay", () => {
  it("processes a provider event only once", async () => {
    const repo = new MemoryBillingRepository();
    repo.seed({
      paymentRef: "payment-2",
      serviceOrderRef: "order-2",
      ownerAccountId: "account-a",
      contextRef: "ctx-a",
      authorizationEpoch: "1",
      policyEpoch: "1",
      label: "Consultation",
      amountMinor: 100,
      currency: "USD",
      state: "open",
      version: 1,
    });
    const checkout = await repo.checkout(actor, "payment-2", "checkout-2");
    if (checkout.kind !== "ready") throw new Error("checkout");
    const event = {
      eventId: "evt-replay",
      type: "checkout.session.completed" as const,
      checkoutRef: checkout.checkoutRef,
      amountMinor: 100,
      currency: "USD",
    };
    expect(await repo.apply(event)).toBe("applied");
    expect(await repo.apply(event)).toBe("duplicate");
    expect((await repo.list(actor))[0]?.version).toBe(2);
  });
});
