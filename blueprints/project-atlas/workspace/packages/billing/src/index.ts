export const BILLING_PACKAGE_ID = "@atlas/billing";
export * from "./m043-adapter.ts";
export * from "./m043-contracts.ts";
export * from "./m043-controls.ts";
export * from "./m043-service.ts";
export * from "./m043-views.ts";
export * from "./providers.ts";
export * from "./stripe.ts";
export type BillingActor = Readonly<{
  accountId: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
}>;
export type PaymentState =
  | "open"
  | "processing"
  | "provider_succeeded_pending_verification"
  | "provider_refund_pending_verification"
  | "provider_dispute_pending_review"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "unconfirmed";
export type BillingObligation = Readonly<{
  paymentRef: string;
  serviceOrderRef: string;
  ownerAccountId: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
  label: string;
  amountMinor: number;
  currency: "USD";
  state: PaymentState;
  version: number;
}>;
/**
 * Provider evidence is deliberately not a verified payment. M044 is the sole
 * authority that may later confirm payment state after its own validation.
 */
export type ProviderPaymentEventEvidence = Readonly<{
  eventId: string;
  type:
    | "checkout.session.completed"
    | "checkout.session.expired"
    | "payment_intent.payment_failed"
    | "charge.refunded"
    | "charge.dispute.created";
  checkoutRef: string;
  amountMinor?: number;
  currency?: string;
}>;
/** @deprecated Use ProviderPaymentEventEvidence. */
export type VerifiedPaymentEvent = ProviderPaymentEventEvidence;
const key = (value: string) => /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u.test(value);
export class MemoryBillingRepository {
  private readonly obligations = new Map<string, BillingObligation>();
  private readonly checkouts = new Map<string, string>();
  private readonly events = new Set<string>();
  seed(value: BillingObligation) {
    if (!Number.isSafeInteger(value.amountMinor) || value.amountMinor <= 0)
      throw new Error("BILLING_AMOUNT_INVALID");
    this.obligations.set(value.paymentRef, value);
  }
  async list(actor: BillingActor) {
    return [...this.obligations.values()].filter(
      (x) =>
        x.ownerAccountId === actor.accountId &&
        x.contextRef === actor.contextRef &&
        x.authorizationEpoch === actor.authorizationEpoch &&
        x.policyEpoch === actor.policyEpoch,
    );
  }
  async checkout(actor: BillingActor, paymentRef: string, idempotencyKey: string) {
    if (!key(paymentRef) || !key(idempotencyKey)) return { kind: "invalid" as const };
    const item = (await this.list(actor)).find((x) => x.paymentRef === paymentRef);
    if (item?.state !== "open") return { kind: "not_found" as const };
    const existing = this.checkouts.get(`${paymentRef}:${idempotencyKey}`);
    if (existing) return { kind: "ready" as const, checkoutRef: existing };
    const checkoutRef = `checkout_${this.checkouts.size + 1}`;
    this.checkouts.set(`${paymentRef}:${idempotencyKey}`, checkoutRef);
    return { kind: "ready" as const, checkoutRef };
  }
  async apply(event: VerifiedPaymentEvent) {
    if (this.events.has(event.eventId)) return "duplicate" as const;
    this.events.add(event.eventId);
    const entry = [...this.checkouts.entries()].find(([, ref]) => ref === event.checkoutRef),
      paymentRef = entry?.[0].split(":", 1)[0];
    if (!paymentRef) return "unconfirmed" as const;
    const item = this.obligations.get(paymentRef);
    if (!item) return "unconfirmed" as const;
    const state: PaymentState =
      event.type === "checkout.session.completed"
        ? event.amountMinor === item.amountMinor && event.currency === item.currency
          ? "provider_succeeded_pending_verification"
          : "unconfirmed"
        : event.type === "checkout.session.expired"
          ? "cancelled"
          : event.type === "payment_intent.payment_failed"
            ? "failed"
            : event.type === "charge.refunded"
              ? "provider_refund_pending_verification"
              : "provider_dispute_pending_review";
    if (item.state === "paid" && ["open", "processing"].includes(state))
      return "unconfirmed" as const;
    this.obligations.set(paymentRef, { ...item, state, version: item.version + 1 });
    return "applied" as const;
  }
}
