import type {
  CreateCheckoutRequest,
  NormalizedStripeEvent,
  PaymentRefundRequest,
  PaymentTransactionRecord,
  PaymentVerificationCandidate,
  StripeAuditRecord,
  StripeCheckoutSessionRecord,
  StripeInboundEventRecord,
  StripeInvoiceRecord,
  StripeReconciliationFinding,
} from "./m043-contracts.ts";
import {
  assertCheckoutRedirectProfile,
  assertOpaqueReference,
  assertPricingSnapshotIsAuthoritative,
} from "./m043-controls.ts";

export interface StripePaymentsRepository {
  findCheckoutByIdempotencyKey(key: string): StripeCheckoutSessionRecord | undefined;
  saveCheckout(checkout: StripeCheckoutSessionRecord): void;
  findTransactionByIdempotencyKey(key: string): PaymentTransactionRecord | undefined;
  findTransactionById(id: string): PaymentTransactionRecord | undefined;
  saveTransaction(transaction: PaymentTransactionRecord): void;
  findInboundEvent(
    environment: StripeInboundEventRecord["environment"],
    providerEventId: string,
  ): StripeInboundEventRecord | undefined;
  saveInboundEvent(event: StripeInboundEventRecord): void;
  findCandidateByEventRecordId(eventRecordId: string): PaymentVerificationCandidate | undefined;
  saveCandidate(candidate: PaymentVerificationCandidate): void;
  saveRefundRequest(request: PaymentRefundRequest): void;
  saveInvoice(invoice: StripeInvoiceRecord): void;
  saveReconciliationFinding(finding: StripeReconciliationFinding): void;
  appendAudit(record: StripeAuditRecord): void;
}

export class MemoryStripePaymentsRepository implements StripePaymentsRepository {
  readonly checkouts = new Map<string, StripeCheckoutSessionRecord>();
  readonly transactions = new Map<string, PaymentTransactionRecord>();
  readonly inboundEvents = new Map<string, StripeInboundEventRecord>();
  readonly candidates = new Map<string, PaymentVerificationCandidate>();
  readonly refundRequests = new Map<string, PaymentRefundRequest>();
  readonly invoices = new Map<string, StripeInvoiceRecord>();
  readonly reconciliationFindings = new Map<string, StripeReconciliationFinding>();
  readonly audits: StripeAuditRecord[] = [];

  findCheckoutByIdempotencyKey(key: string): StripeCheckoutSessionRecord | undefined {
    return [...this.checkouts.values()].find((checkout) => checkout.idempotencyKey === key);
  }

  saveCheckout(checkout: StripeCheckoutSessionRecord): void {
    this.checkouts.set(checkout.id, checkout);
  }

  findTransactionByIdempotencyKey(key: string): PaymentTransactionRecord | undefined {
    return [...this.transactions.values()].find(
      (transaction) => transaction.idempotencyKey === key,
    );
  }

  findTransactionById(id: string): PaymentTransactionRecord | undefined {
    return this.transactions.get(id);
  }

  saveTransaction(transaction: PaymentTransactionRecord): void {
    this.transactions.set(transaction.id, transaction);
  }

  findInboundEvent(
    environment: StripeInboundEventRecord["environment"],
    providerEventId: string,
  ): StripeInboundEventRecord | undefined {
    return this.inboundEvents.get(`${environment}:${providerEventId}`);
  }

  saveInboundEvent(event: StripeInboundEventRecord): void {
    this.inboundEvents.set(`${event.environment}:${event.providerEventId}`, event);
  }

  findCandidateByEventRecordId(eventRecordId: string): PaymentVerificationCandidate | undefined {
    return [...this.candidates.values()].find(
      (candidate) => candidate.eventRecordId === eventRecordId,
    );
  }

  saveCandidate(candidate: PaymentVerificationCandidate): void {
    this.candidates.set(candidate.id, candidate);
  }

  saveRefundRequest(request: PaymentRefundRequest): void {
    this.refundRequests.set(request.id, request);
  }

  saveInvoice(invoice: StripeInvoiceRecord): void {
    this.invoices.set(invoice.id, invoice);
  }

  saveReconciliationFinding(finding: StripeReconciliationFinding): void {
    this.reconciliationFindings.set(finding.id, finding);
  }

  appendAudit(record: StripeAuditRecord): void {
    this.audits.push(record);
  }
}

export interface PrepareCheckoutResult {
  readonly checkout: StripeCheckoutSessionRecord;
  readonly transaction: PaymentTransactionRecord;
  readonly idempotent: boolean;
}

export class StripePaymentsService {
  constructor(
    private readonly repository: StripePaymentsRepository,
    private readonly accountProfileId = "stripe-account-profile-disabled",
  ) {}

  prepareCheckout(input: CreateCheckoutRequest): PrepareCheckoutResult {
    assertOpaqueReference(input.operationRef, "operation reference");
    assertOpaqueReference(input.idempotencyKey, "idempotency key");
    assertPricingSnapshotIsAuthoritative(input.pricingSnapshot);
    assertCheckoutRedirectProfile(input.checkoutProfile, input.locale);
    if (input.catalog.sourceModule !== "m042") {
      throw new Error("M043 only accepts catalog version references issued by M042.");
    }
    if (
      !["order_draft", "payment_pending", "payment_processing"].includes(
        input.paymentOrder.commercialState,
      )
    ) {
      throw new Error("M043 checkout preparation requires a payment-eligible commercial order.");
    }

    const existingCheckout = this.repository.findCheckoutByIdempotencyKey(input.idempotencyKey);
    const existingTransaction = this.repository.findTransactionByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existingCheckout && existingTransaction) {
      return {
        checkout: existingCheckout,
        transaction: existingTransaction,
        idempotent: true,
      };
    }

    if (existingCheckout || existingTransaction) {
      throw new Error("M043 idempotency key is attached to an incomplete commercial operation.");
    }

    const transaction: PaymentTransactionRecord = {
      id: `ptx_${input.operationRef}`,
      paymentOrder: input.paymentOrder,
      clientId: input.clientId,
      environment: input.environment,
      state: "checkout_requested",
      amountMinor: input.pricingSnapshot.totalAmountMinor,
      currency: input.pricingSnapshot.currency,
      catalog: input.catalog,
      pricingSnapshot: input.pricingSnapshot,
      providerReferences: [],
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    const checkout: StripeCheckoutSessionRecord = {
      id: `cs_local_${input.operationRef}`,
      paymentTransactionId: transaction.id,
      operationRef: input.operationRef,
      environment: input.environment,
      accountProfileId: this.accountProfileId,
      checkoutProfileCode: input.checkoutProfile.code,
      expectedAmountMinor: input.pricingSnapshot.totalAmountMinor,
      currency: input.pricingSnapshot.currency,
      status: "provider_creation_pending",
      expiresAt: input.expiresAt,
      idempotencyKey: input.idempotencyKey,
      catalog: input.catalog,
      pricingSnapshot: input.pricingSnapshot,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };

    this.repository.saveTransaction(transaction);
    this.repository.saveCheckout(checkout);
    this.audit({
      action: "checkout_prepared",
      actorType: "system",
      resourceType: "stripe_checkout_session",
      resourceId: checkout.id,
      correlationId: input.correlationId,
      occurredAt: input.createdAt,
    });

    return { checkout, transaction, idempotent: false };
  }

  prepareInvoice(input: {
    readonly invoiceId: string;
    readonly transactionId: string;
    readonly createdAt: string;
    readonly lineSnapshots: StripeInvoiceRecord["lineSnapshots"];
  }): StripeInvoiceRecord {
    const transaction = this.requireTransaction(input.transactionId);
    const invoice: StripeInvoiceRecord = {
      id: input.invoiceId,
      paymentTransactionId: transaction.id,
      environment: transaction.environment,
      status: "draft",
      amountDueMinor: transaction.amountMinor,
      amountPaidMinor: 0,
      currency: transaction.currency,
      lineSnapshots: input.lineSnapshots,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.repository.saveInvoice(invoice);
    this.audit({
      action: "invoice_prepared",
      actorType: "system",
      resourceType: "stripe_invoice",
      resourceId: invoice.id,
      correlationId: transaction.correlationId,
      occurredAt: input.createdAt,
    });
    return invoice;
  }

  recordVerifiedInboundEvent(event: StripeInboundEventRecord): {
    readonly event: StripeInboundEventRecord;
    readonly duplicate: boolean;
  } {
    const existing = this.repository.findInboundEvent(event.environment, event.providerEventId);
    if (existing) {
      this.audit({
        action: "webhook_duplicate_ignored",
        actorType: "system",
        resourceType: "stripe_event",
        resourceId: event.providerEventId,
        correlationId: existing.correlationId,
        occurredAt: event.receivedAt,
      });
      return { event: existing, duplicate: true };
    }

    this.repository.saveInboundEvent(event);
    this.audit({
      action: "webhook_received",
      actorType: "system",
      resourceType: "stripe_event",
      resourceId: event.providerEventId,
      correlationId: event.correlationId,
      occurredAt: event.receivedAt,
    });
    return { event, duplicate: false };
  }

  createPaymentVerificationCandidate(
    event: NormalizedStripeEvent,
  ): PaymentVerificationCandidate | undefined {
    const existing = this.repository.findCandidateByEventRecordId(event.eventRecordId);
    if (existing) {
      return existing;
    }

    const candidateType = candidateTypeFor(event.eventType);
    if (!candidateType) {
      return undefined;
    }

    const transaction = event.transactionId
      ? this.repository.findTransactionById(event.transactionId)
      : undefined;
    const candidate: PaymentVerificationCandidate = {
      id: `pvc_${event.eventRecordId}`,
      sourceModule: "m043",
      eventRecordId: event.eventRecordId,
      paymentTransactionId: event.transactionId,
      candidateType,
      status: "candidate_created",
      evidence: [event.providerObjectReference],
      expectedAmountMinor: transaction?.amountMinor,
      observedAmountMinor: event.amountMinor,
      currency: event.currency,
      correlationId: event.correlationId,
      createdAt: event.occurredAt,
    };
    this.repository.saveCandidate(candidate);
    this.audit({
      action: "verification_candidate_created",
      actorType: "system",
      resourceType: "payment_verification_candidate",
      resourceId: candidate.id,
      correlationId: event.correlationId,
      occurredAt: event.occurredAt,
    });
    return candidate;
  }

  requestRefund(input: Omit<PaymentRefundRequest, "status">): PaymentRefundRequest {
    const transaction = this.requireTransaction(input.paymentTransactionId);
    if (transaction.paymentOrder.paymentOrderId !== input.paymentOrderId) {
      throw new Error("M043 refund request does not match the referenced payment order.");
    }
    if (!Number.isInteger(input.requestedAmountMinor) || input.requestedAmountMinor <= 0) {
      throw new Error("M043 refund amount must be a positive integer number of minor units.");
    }
    if (input.requestedAmountMinor > transaction.amountMinor) {
      throw new Error("M043 refund amount cannot exceed the transaction amount.");
    }
    assertOpaqueReference(input.approvalRequestId, "refund approval reference");
    const refundRequest: PaymentRefundRequest = { ...input, status: "awaiting_approval" };
    this.repository.saveRefundRequest(refundRequest);
    this.audit({
      action: "refund_requested",
      actorType: "staff",
      actorId: input.requestedBy,
      resourceType: "payment_refund_request",
      resourceId: refundRequest.id,
      correlationId: transaction.correlationId,
      occurredAt: input.requestedAt,
    });
    return refundRequest;
  }

  createReconciliationFinding(input: StripeReconciliationFinding): StripeReconciliationFinding {
    this.repository.saveReconciliationFinding(input);
    this.audit({
      action: "reconciliation_finding_created",
      actorType: "system",
      resourceType: "stripe_reconciliation_finding",
      resourceId: input.id,
      correlationId: input.runId,
      occurredAt: input.createdAt,
    });
    return input;
  }

  private requireTransaction(transactionId: string): PaymentTransactionRecord {
    const transaction = this.repository.findTransactionById(transactionId);
    if (!transaction) {
      throw new Error("M043 payment transaction was not found.");
    }
    return transaction;
  }

  private audit(input: Omit<StripeAuditRecord, "id">): void {
    this.repository.appendAudit({
      id: `audit_${input.action}_${input.resourceId}_${input.occurredAt}`,
      ...input,
    });
  }
}

function candidateTypeFor(
  eventType: NormalizedStripeEvent["eventType"],
): PaymentVerificationCandidate["candidateType"] | undefined {
  switch (eventType) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      return "payment_succeeded";
    case "payment_intent.payment_failed":
    case "invoice.payment_failed":
      return "payment_failed";
    case "charge.refunded":
      return "refund_succeeded";
    case "charge.dispute.created":
      return "dispute_opened";
    case "invoice.paid":
      return "invoice_paid";
    case "checkout.session.expired":
    case "unknown":
      return undefined;
  }
}
