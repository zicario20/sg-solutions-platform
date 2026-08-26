export const BILLING_PACKAGE_ID = "@atlas/billing";
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
export type VerifiedPaymentEvent = Readonly<{
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
    if (!item || item.state !== "open") return { kind: "not_found" as const };
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
          ? "paid"
          : "unconfirmed"
        : event.type === "checkout.session.expired"
          ? "cancelled"
          : event.type === "payment_intent.payment_failed"
            ? "failed"
            : event.type === "charge.refunded"
              ? "refunded"
              : "disputed";
    if (item.state === "paid" && ["open", "processing"].includes(state))
      return "unconfirmed" as const;
    this.obligations.set(paymentRef, { ...item, state, version: item.version + 1 });
    return "applied" as const;
  }
}
