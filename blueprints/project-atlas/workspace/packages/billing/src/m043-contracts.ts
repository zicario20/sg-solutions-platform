/**
 * Module 043 owns the provider-facing payment boundary only. It does not own
 * pricing (M046), payment verification (M044), entitlements (M045), service
 * execution, or any Stripe runtime activation.
 */

export const STRIPE_PROVIDER_CODE = "stripe" as const;

export type StripeEnvironment = "test" | "live";
export type StripeRuntimeState = "provider_disabled" | "activation_required";
export type StripeObjectKind =
  | "account"
  | "customer"
  | "checkout_session"
  | "payment_intent"
  | "setup_intent"
  | "payment_method"
  | "invoice"
  | "refund"
  | "dispute"
  | "subscription"
  | "event"
  | "balance_transaction"
  | "billing_portal_session";

export interface StripeObjectReference {
  readonly provider: typeof STRIPE_PROVIDER_CODE;
  readonly environment: StripeEnvironment;
  readonly objectKind: StripeObjectKind;
  readonly providerObjectId: string;
  readonly createdAt: string;
}

export interface StripeAccountProfile {
  readonly id: string;
  readonly code: string;
  readonly environment: StripeEnvironment;
  readonly displayName: string;
  readonly accountReference: string;
  readonly apiVersionPolicyId: string;
  readonly credentialProfileId: string;
  readonly status: "draft" | "approved" | "disabled";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeApiVersionPolicy {
  readonly id: string;
  readonly code: string;
  readonly pinnedApiVersion: string;
  readonly status: "draft" | "approved" | "retired";
  readonly approvedAt?: string;
  readonly nextReviewAt?: string;
}

/**
 * Credential references may be stored; secrets themselves must never be
 * persisted, logged, exported, or returned to a browser.
 */
export interface StripeCredentialProfile {
  readonly id: string;
  readonly code: string;
  readonly environment: StripeEnvironment;
  readonly secretKeyReference: string;
  readonly webhookSecretReference: string;
  readonly rotatedWebhookSecretReference?: string;
  readonly status: "draft" | "approved" | "disabled";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeCustomerMapping {
  readonly id: string;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly customer: StripeObjectReference;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CatalogVersionReference {
  readonly sourceModule: "m042";
  readonly serviceDefinitionId: string;
  readonly serviceDefinitionVersionId: string;
  readonly serviceCode: string;
}

/**
 * M043 accepts a server-produced pricing snapshot only. A browser may select
 * an offer, but it must never supply an authoritative amount or discount.
 */
export interface PricingSnapshotReference {
  readonly sourceModule: "m046";
  readonly quoteId: string;
  readonly pricingVersion: string;
  readonly currency: "USD";
  readonly totalAmountMinor: number;
  readonly depositAmountMinor?: number;
  readonly balanceAmountMinor?: number;
  readonly checksum: string;
  readonly calculatedAt: string;
}

export interface PaymentOrderReference {
  readonly paymentOrderId: string;
  readonly commercialOrderId: string;
  readonly serviceOrderId?: string;
  readonly commercialState: "order_draft" | "payment_pending" | "payment_processing";
}

export interface CheckoutRedirectProfile {
  readonly code: string;
  readonly successPath: string;
  readonly cancelPath: string;
  readonly allowedLocales: readonly ("en" | "es")[];
  readonly collectBillingAddress: boolean;
  readonly allowPromotionCodes: boolean;
}

export interface CreateCheckoutRequest {
  readonly operationRef: string;
  readonly paymentOrder: PaymentOrderReference;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly catalog: CatalogVersionReference;
  readonly pricingSnapshot: PricingSnapshotReference;
  readonly checkoutProfile: CheckoutRedirectProfile;
  readonly locale: "en" | "es";
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface StripeCheckoutSessionRecord {
  readonly id: string;
  readonly paymentTransactionId: string;
  readonly operationRef: string;
  readonly environment: StripeEnvironment;
  readonly accountProfileId: string;
  readonly checkoutProfileCode: string;
  readonly customerMappingId?: string;
  readonly expectedAmountMinor: number;
  readonly currency: "USD";
  readonly status:
    | "draft"
    | "provider_creation_pending"
    | "provider_created"
    | "expired"
    | "cancelled"
    | "provider_succeeded_pending_verification";
  readonly providerReference?: StripeObjectReference;
  readonly expiresAt?: string;
  readonly idempotencyKey: string;
  readonly catalog: CatalogVersionReference;
  readonly pricingSnapshot: PricingSnapshotReference;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type PaymentTransactionState =
  | "draft"
  | "checkout_requested"
  | "provider_processing"
  | "provider_succeeded_pending_verification"
  | "provider_failed"
  | "refund_requested"
  | "refund_processing"
  | "refund_provider_confirmed_pending_verification"
  | "dispute_open"
  | "closed";

export interface PaymentTransactionRecord {
  readonly id: string;
  readonly paymentOrder: PaymentOrderReference;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly state: PaymentTransactionState;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly catalog: CatalogVersionReference;
  readonly pricingSnapshot: PricingSnapshotReference;
  readonly providerReferences: readonly StripeObjectReference[];
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripePaymentIntentRecord {
  readonly id: string;
  readonly paymentTransactionId: string;
  readonly environment: StripeEnvironment;
  readonly expectedAmountMinor: number;
  readonly currency: "USD";
  readonly captureMethod: "automatic" | "manual";
  readonly status:
    | "not_requested"
    | "provider_created"
    | "provider_processing"
    | "provider_succeeded_pending_verification"
    | "provider_failed"
    | "cancelled";
  readonly providerReference?: StripeObjectReference;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeSetupIntentRecord {
  readonly id: string;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly status:
    | "not_requested"
    | "provider_created"
    | "provider_succeeded_pending_verification"
    | "provider_failed"
    | "cancelled";
  readonly providerReference?: StripeObjectReference;
  readonly consentReference: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaymentMethodReferenceRecord {
  readonly id: string;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly providerReference: StripeObjectReference;
  readonly consentReference: string;
  readonly status: "active" | "detached" | "expired" | "revoked";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeInvoiceLineSnapshot {
  readonly id: string;
  readonly lineType: "service_fee" | "external_fee" | "addon" | "discount" | "tax" | "adjustment";
  readonly description: string;
  readonly amountMinor: number;
  readonly quantity: number;
  readonly catalogReference?: CatalogVersionReference;
}

export interface StripeInvoiceRecord {
  readonly id: string;
  readonly paymentTransactionId: string;
  readonly environment: StripeEnvironment;
  readonly invoiceNumber?: string;
  readonly status:
    | "draft"
    | "provider_created"
    | "open"
    | "paid_pending_verification"
    | "void"
    | "uncollectible";
  readonly amountDueMinor: number;
  readonly amountPaidMinor: number;
  readonly currency: "USD";
  readonly lineSnapshots: readonly StripeInvoiceLineSnapshot[];
  readonly providerReference?: StripeObjectReference;
  readonly receiptReference?: StripeObjectReference;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeInvoicePaymentRecord {
  readonly id: string;
  readonly invoiceId: string;
  readonly paymentTransactionId: string;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly status:
    | "planned"
    | "provider_pending"
    | "provider_succeeded_pending_verification"
    | "provider_failed"
    | "reconciled";
  readonly providerReference?: StripeObjectReference;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InstallmentScheduleRecord {
  readonly id: string;
  readonly paymentOrderId: string;
  readonly installmentNumber: number;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly dueAt: string;
  readonly status: "planned" | "due" | "paid_pending_verification" | "overdue" | "cancelled";
  readonly pricingSnapshot: PricingSnapshotReference;
}

export interface StripeSubscriptionRecord {
  readonly id: string;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly catalog: CatalogVersionReference;
  readonly pricingSnapshot: PricingSnapshotReference;
  readonly status:
    | "not_enabled"
    | "provider_creation_pending"
    | "provider_created"
    | "active_pending_verification"
    | "past_due_pending_verification"
    | "cancel_pending_verification"
    | "cancelled";
  readonly providerReference?: StripeObjectReference;
  readonly consentReference: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeBillingPortalSessionRecord {
  readonly id: string;
  readonly clientId: string;
  readonly environment: StripeEnvironment;
  readonly returnPath: string;
  readonly status: "not_enabled" | "provider_creation_pending" | "provider_created" | "expired";
  readonly providerReference?: StripeObjectReference;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaymentRefundRequest {
  readonly id: string;
  readonly paymentTransactionId: string;
  readonly paymentOrderId: string;
  readonly requestedAmountMinor: number;
  readonly currency: "USD";
  readonly reasonCode: "client_request" | "duplicate" | "fraudulent" | "service_policy" | "other";
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly approvalRequestId: string;
  readonly status:
    | "requested"
    | "awaiting_approval"
    | "approved_for_provider_submission"
    | "provider_submission_pending"
    | "provider_confirmed_pending_verification"
    | "declined"
    | "cancelled";
  readonly idempotencyKey: string;
}

export interface StripeRefundRecord {
  readonly id: string;
  readonly refundRequestId: string;
  readonly paymentTransactionId: string;
  readonly environment: StripeEnvironment;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly status:
    | "not_submitted"
    | "provider_pending"
    | "provider_succeeded_pending_verification"
    | "provider_failed"
    | "cancelled";
  readonly providerReference?: StripeObjectReference;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeDisputeRecord {
  readonly id: string;
  readonly paymentTransactionId: string;
  readonly environment: StripeEnvironment;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly status: "open" | "needs_response" | "under_review" | "won" | "lost" | "closed";
  readonly providerReference: StripeObjectReference;
  readonly evidencePackageReference?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type StripeInboundEventStatus =
  | "received"
  | "signature_verified"
  | "normalized"
  | "candidate_created"
  | "ignored"
  | "failed"
  | "dead_lettered";

export interface StripeInboundEventRecord {
  readonly id: string;
  readonly environment: StripeEnvironment;
  readonly providerEventId: string;
  readonly eventType: string;
  readonly payloadHash: string;
  readonly occurredAt: string;
  readonly receivedAt: string;
  readonly signatureVersion: string;
  readonly status: StripeInboundEventStatus;
  readonly correlationId: string;
  readonly failureCode?: string;
}

export interface NormalizedStripeEvent {
  readonly eventRecordId: string;
  readonly providerEventId: string;
  readonly environment: StripeEnvironment;
  readonly eventType:
    | "checkout.session.completed"
    | "checkout.session.expired"
    | "payment_intent.succeeded"
    | "payment_intent.payment_failed"
    | "charge.refunded"
    | "charge.dispute.created"
    | "invoice.paid"
    | "invoice.payment_failed"
    | "unknown";
  readonly providerObjectReference: StripeObjectReference;
  readonly transactionId?: string;
  readonly amountMinor?: number;
  readonly currency?: "USD";
  readonly occurredAt: string;
  readonly correlationId: string;
}

/**
 * M043 can create evidence for M044. It cannot mark a payment/refund as
 * verified, mutate a service order, start a workflow, or grant entitlements.
 */
export interface PaymentVerificationCandidate {
  readonly id: string;
  readonly sourceModule: "m043";
  readonly eventRecordId: string;
  readonly paymentTransactionId?: string;
  readonly candidateType:
    | "payment_succeeded"
    | "payment_failed"
    | "refund_succeeded"
    | "dispute_opened"
    | "invoice_paid";
  readonly status: "candidate_created" | "sent_to_m044" | "rejected_by_m044";
  readonly evidence: readonly StripeObjectReference[];
  readonly expectedAmountMinor?: number;
  readonly observedAmountMinor?: number;
  readonly currency?: "USD";
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface StripeDeadLetterRecord {
  readonly id: string;
  readonly eventRecordId: string;
  readonly failureCode: string;
  readonly failureSummary: string;
  readonly attemptCount: number;
  readonly status: "open" | "replaying" | "resolved" | "discarded";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeReconciliationRun {
  readonly id: string;
  readonly environment: StripeEnvironment;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly status: "queued" | "running" | "completed" | "failed";
  readonly initiatedBy: "scheduled_job" | "staff";
  readonly correlationId: string;
}

export interface StripeReconciliationFinding {
  readonly id: string;
  readonly runId: string;
  readonly severity: "information" | "warning" | "critical";
  readonly category:
    | "missing_provider_event"
    | "amount_mismatch"
    | "currency_mismatch"
    | "missing_candidate"
    | "unknown_provider_object"
    | "duplicate_event"
    | "stale_transaction";
  readonly transactionId?: string;
  readonly providerReference?: StripeObjectReference;
  readonly status: "open" | "investigating" | "resolved" | "accepted_risk";
  readonly summary: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StripeAuditRecord {
  readonly id: string;
  readonly action:
    | "checkout_prepared"
    | "invoice_prepared"
    | "webhook_received"
    | "webhook_duplicate_ignored"
    | "verification_candidate_created"
    | "refund_requested"
    | "reconciliation_finding_created"
    | "provider_operation_blocked";
  readonly actorType: "client" | "staff" | "system" | "service_account";
  readonly actorId?: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
}

export interface StripeProviderCapabilities {
  readonly supportsCheckout: boolean;
  readonly supportsPaymentIntents: boolean;
  readonly supportsSetupIntents: boolean;
  readonly supportsInvoices: boolean;
  readonly supportsRefunds: boolean;
  readonly supportsDisputes: boolean;
  readonly supportsSubscriptions: boolean;
  readonly supportsBillingPortal: boolean;
  readonly supportsWebhooks: boolean;
}

export interface StripePaymentProvider {
  readonly providerCode: typeof STRIPE_PROVIDER_CODE;
  readonly runtimeState: StripeRuntimeState;
  readonly capabilities: StripeProviderCapabilities;
  createCustomer(input: {
    readonly clientId: string;
    readonly environment: StripeEnvironment;
    readonly idempotencyKey: string;
  }): Promise<StripeObjectReference>;
  createCheckoutSession(input: CreateCheckoutRequest): Promise<StripeObjectReference>;
  createPaymentIntent(input: {
    readonly paymentTransactionId: string;
    readonly idempotencyKey: string;
  }): Promise<StripeObjectReference>;
  createSetupIntent(input: {
    readonly clientId: string;
    readonly consentReference: string;
    readonly idempotencyKey: string;
  }): Promise<StripeObjectReference>;
  createInvoice(input: {
    readonly paymentTransactionId: string;
    readonly idempotencyKey: string;
  }): Promise<StripeObjectReference>;
  submitRefund(input: {
    readonly refundRequestId: string;
    readonly idempotencyKey: string;
  }): Promise<StripeObjectReference>;
  createBillingPortalSession(input: {
    readonly clientId: string;
    readonly returnPath: string;
    readonly idempotencyKey: string;
  }): Promise<StripeObjectReference>;
}

export interface ClientPaymentListItemDto {
  readonly paymentOrderId: string;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly state:
    | "payment_pending"
    | "processing"
    | "verification_pending"
    | "refund_requested"
    | "dispute_open";
  readonly createdAt: string;
}

export interface ClientPaymentDetailDto extends ClientPaymentListItemDto {
  readonly paymentTransactionId: string;
  readonly checkoutStatus?: StripeCheckoutSessionRecord["status"];
  readonly refundStatus?: PaymentRefundRequest["status"];
  readonly message: string;
}

export interface AdminPaymentOperationsDto {
  readonly paymentTransactionId: string;
  readonly paymentOrderId: string;
  readonly environment: StripeEnvironment;
  readonly state: PaymentTransactionState;
  readonly amountMinor: number;
  readonly currency: "USD";
  readonly providerReferenceCount: number;
  readonly verificationCandidateCount: number;
  readonly reconciliationFindingCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
