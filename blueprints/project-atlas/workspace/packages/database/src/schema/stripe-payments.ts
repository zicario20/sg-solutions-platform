import { sql } from "drizzle-orm";
import {
  bigint,
  char,
  check,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { billingGatewayRole, paymentTransactions } from "./billing.ts";

const only = (name: string) =>
  pgPolicy(`${name}_stripe_payments_gateway_only`, {
    as: "permissive",
    for: "all",
    to: billingGatewayRole,
    using: sql.raw("true"),
    withCheck: sql.raw("true"),
  });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

const money = (name: string) => bigint(name, { mode: "number" }).notNull();
const currency = (name: string) => varchar(name, { length: 3 }).notNull();

export const stripeApiVersionPolicies = pgTable(
  "stripe_api_version_policies",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull().unique(),
    pinnedApiVersion: varchar("pinned_api_version", { length: 32 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (_table) => [
    check(
      "stripe_api_version_policies_status_valid",
      sql.raw("status in ('draft','approved','retired')"),
    ),
    only("stripe_api_version_policies"),
  ],
).enableRLS();

export const stripeCredentialProfiles = pgTable(
  "stripe_credential_profiles",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull().unique(),
    environment: varchar("environment", { length: 8 }).notNull(),
    secretKeyReference: text("secret_key_reference").notNull(),
    webhookSecretReference: text("webhook_secret_reference").notNull(),
    rotatedWebhookSecretReference: text("rotated_webhook_secret_reference"),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (_table) => [
    check(
      "stripe_credential_profiles_environment_valid",
      sql.raw("environment in ('test','live')"),
    ),
    check(
      "stripe_credential_profiles_status_valid",
      sql.raw("status in ('draft','approved','disabled')"),
    ),
    check(
      "stripe_credential_profiles_reference_only",
      sql.raw(
        "secret_key_reference !~ '^(sk_|rk_)' and webhook_secret_reference !~ '^whsec_' and (rotated_webhook_secret_reference is null or rotated_webhook_secret_reference !~ '^whsec_')",
      ),
    ),
    only("stripe_credential_profiles"),
  ],
).enableRLS();

export const stripeAccountProfiles = pgTable(
  "stripe_account_profiles",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull().unique(),
    environment: varchar("environment", { length: 8 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    accountReference: text("account_reference").notNull(),
    apiVersionPolicyId: text("api_version_policy_id")
      .notNull()
      .references(() => stripeApiVersionPolicies.id, { onDelete: "restrict" }),
    credentialProfileId: text("credential_profile_id")
      .notNull()
      .references(() => stripeCredentialProfiles.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    check("stripe_account_profiles_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_account_profiles_status_valid",
      sql.raw("status in ('draft','approved','disabled')"),
    ),
    unique("stripe_account_profiles_environment_account_unique").on(
      table.environment,
      table.accountReference,
    ),
    only("stripe_account_profiles"),
  ],
).enableRLS();

export const stripeCustomerMappings = pgTable(
  "stripe_customer_mappings",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    accountProfileId: text("account_profile_id")
      .notNull()
      .references(() => stripeAccountProfiles.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerCustomerRef: text("provider_customer_ref").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_customer_mappings_client_environment_unique").on(
      table.clientId,
      table.environment,
    ),
    unique("stripe_customer_mappings_provider_customer_unique").on(
      table.environment,
      table.providerCustomerRef,
    ),
    check("stripe_customer_mappings_environment_valid", sql.raw("environment in ('test','live')")),
    only("stripe_customer_mappings"),
  ],
).enableRLS();

export const stripePaymentTransactionContexts = pgTable(
  "stripe_payment_transaction_contexts",
  {
    transactionId: text("transaction_id")
      .primaryKey()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    accountProfileId: text("account_profile_id")
      .notNull()
      .references(() => stripeAccountProfiles.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    clientId: text("client_id").notNull(),
    commercialOrderId: text("commercial_order_id").notNull(),
    catalogSnapshot: jsonb("catalog_snapshot").notNull(),
    pricingSnapshot: jsonb("pricing_snapshot").notNull(),
    state: varchar("state", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    ...timestamps,
  },
  (_table) => [
    check(
      "stripe_payment_transaction_contexts_environment_valid",
      sql.raw("environment in ('test','live')"),
    ),
    check(
      "stripe_payment_transaction_contexts_state_valid",
      sql.raw(
        "state in ('draft','checkout_requested','provider_processing','provider_succeeded_pending_verification','provider_failed','refund_requested','refund_processing','refund_provider_confirmed_pending_verification','dispute_open','closed')",
      ),
    ),
    only("stripe_payment_transaction_contexts"),
  ],
).enableRLS();

export const stripeCheckoutSessions = pgTable(
  "stripe_checkout_sessions",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    customerMappingId: text("customer_mapping_id").references(() => stripeCustomerMappings.id, {
      onDelete: "restrict",
    }),
    environment: varchar("environment", { length: 8 }).notNull(),
    checkoutProfileCode: varchar("checkout_profile_code", { length: 96 }).notNull(),
    providerCheckoutRef: text("provider_checkout_ref"),
    expectedAmountMinor: money("expected_amount_minor"),
    currency: currency("currency"),
    status: varchar("status", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("stripe_checkout_sessions_provider_ref_unique").on(
      table.environment,
      table.providerCheckoutRef,
    ),
    index("stripe_checkout_sessions_transaction_idx").on(table.transactionId),
    check("stripe_checkout_sessions_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_checkout_sessions_status_valid",
      sql.raw(
        "status in ('draft','provider_creation_pending','provider_created','expired','cancelled','provider_succeeded_pending_verification')",
      ),
    ),
    check(
      "stripe_checkout_sessions_money_valid",
      sql.raw("expected_amount_minor >= 0 and currency = 'USD'"),
    ),
    only("stripe_checkout_sessions"),
  ],
).enableRLS();

export const stripePaymentIntents = pgTable(
  "stripe_payment_intents",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerIntentRef: text("provider_intent_ref"),
    expectedAmountMinor: money("expected_amount_minor"),
    currency: currency("currency"),
    captureMethod: varchar("capture_method", { length: 16 }).notNull(),
    status: varchar("status", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_payment_intents_provider_ref_unique").on(
      table.environment,
      table.providerIntentRef,
    ),
    check("stripe_payment_intents_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_payment_intents_capture_method_valid",
      sql.raw("capture_method in ('automatic','manual')"),
    ),
    check(
      "stripe_payment_intents_status_valid",
      sql.raw(
        "status in ('not_requested','provider_created','provider_processing','provider_succeeded_pending_verification','provider_failed','cancelled')",
      ),
    ),
    check(
      "stripe_payment_intents_money_valid",
      sql.raw("expected_amount_minor >= 0 and currency = 'USD'"),
    ),
    only("stripe_payment_intents"),
  ],
).enableRLS();

export const stripeSetupIntents = pgTable(
  "stripe_setup_intents",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerSetupIntentRef: text("provider_setup_intent_ref"),
    consentReference: text("consent_reference").notNull(),
    status: varchar("status", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_setup_intents_provider_ref_unique").on(
      table.environment,
      table.providerSetupIntentRef,
    ),
    check("stripe_setup_intents_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_setup_intents_status_valid",
      sql.raw(
        "status in ('not_requested','provider_created','provider_succeeded_pending_verification','provider_failed','cancelled')",
      ),
    ),
    only("stripe_setup_intents"),
  ],
).enableRLS();

export const stripePaymentMethodReferences = pgTable(
  "stripe_payment_method_references",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerPaymentMethodRef: text("provider_payment_method_ref").notNull(),
    consentReference: text("consent_reference").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_payment_method_references_provider_unique").on(
      table.environment,
      table.providerPaymentMethodRef,
    ),
    check(
      "stripe_payment_method_references_environment_valid",
      sql.raw("environment in ('test','live')"),
    ),
    check(
      "stripe_payment_method_references_status_valid",
      sql.raw("status in ('active','detached','expired','revoked')"),
    ),
    only("stripe_payment_method_references"),
  ],
).enableRLS();

export const stripeInvoices = pgTable(
  "stripe_invoices",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerInvoiceRef: text("provider_invoice_ref"),
    invoiceNumber: varchar("invoice_number", { length: 128 }),
    status: varchar("status", { length: 48 }).notNull(),
    amountDueMinor: money("amount_due_minor"),
    amountPaidMinor: money("amount_paid_minor"),
    currency: currency("currency"),
    receiptReference: text("receipt_reference"),
    ...timestamps,
  },
  (table) => [
    unique("stripe_invoices_provider_ref_unique").on(table.environment, table.providerInvoiceRef),
    check("stripe_invoices_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_invoices_status_valid",
      sql.raw(
        "status in ('draft','provider_created','open','paid_pending_verification','void','uncollectible')",
      ),
    ),
    check(
      "stripe_invoices_money_valid",
      sql.raw(
        "amount_due_minor >= 0 and amount_paid_minor >= 0 and amount_paid_minor <= amount_due_minor and currency = 'USD'",
      ),
    ),
    only("stripe_invoices"),
  ],
).enableRLS();

export const stripeInvoiceLineSnapshots = pgTable(
  "stripe_invoice_line_snapshots",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => stripeInvoices.id, { onDelete: "cascade" }),
    lineType: varchar("line_type", { length: 32 }).notNull(),
    description: text("description").notNull(),
    amountMinor: money("amount_minor"),
    quantity: integer("quantity").notNull(),
    catalogSnapshot: jsonb("catalog_snapshot"),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "stripe_invoice_line_snapshots_type_valid",
      sql.raw("line_type in ('service_fee','external_fee','addon','discount','tax','adjustment')"),
    ),
    check(
      "stripe_invoice_line_snapshots_value_valid",
      sql.raw("quantity > 0 and amount_minor >= 0 and display_order >= 0"),
    ),
    unique("stripe_invoice_line_snapshots_invoice_order_unique").on(
      table.invoiceId,
      table.displayOrder,
    ),
    only("stripe_invoice_line_snapshots"),
  ],
).enableRLS();

export const stripeRefundRequests = pgTable(
  "stripe_refund_requests",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    paymentOrderId: text("payment_order_id").notNull(),
    requestedAmountMinor: money("requested_amount_minor"),
    currency: currency("currency"),
    reasonCode: varchar("reason_code", { length: 64 }).notNull(),
    approvalRequestId: text("approval_request_id").notNull(),
    requestedBy: text("requested_by").notNull(),
    status: varchar("status", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (_table) => [
    check(
      "stripe_refund_requests_status_valid",
      sql.raw(
        "status in ('requested','awaiting_approval','approved_for_provider_submission','provider_submission_pending','provider_confirmed_pending_verification','declined','cancelled')",
      ),
    ),
    check(
      "stripe_refund_requests_money_valid",
      sql.raw("requested_amount_minor > 0 and currency = 'USD'"),
    ),
    only("stripe_refund_requests"),
  ],
).enableRLS();

export const stripeRefunds = pgTable(
  "stripe_refunds",
  {
    id: text("id").primaryKey(),
    refundRequestId: text("refund_request_id")
      .notNull()
      .references(() => stripeRefundRequests.id, { onDelete: "restrict" }),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerRefundRef: text("provider_refund_ref"),
    amountMinor: money("amount_minor"),
    currency: currency("currency"),
    status: varchar("status", { length: 48 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_refunds_provider_ref_unique").on(table.environment, table.providerRefundRef),
    check("stripe_refunds_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_refunds_status_valid",
      sql.raw(
        "status in ('not_submitted','provider_pending','provider_succeeded_pending_verification','provider_failed','cancelled')",
      ),
    ),
    check("stripe_refunds_money_valid", sql.raw("amount_minor > 0 and currency = 'USD'")),
    only("stripe_refunds"),
  ],
).enableRLS();

export const stripeDisputes = pgTable(
  "stripe_disputes",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerDisputeRef: text("provider_dispute_ref").notNull(),
    amountMinor: money("amount_minor"),
    currency: currency("currency"),
    status: varchar("status", { length: 32 }).notNull(),
    evidencePackageReference: text("evidence_package_reference"),
    openedAt: timestamp("opened_at", { withTimezone: true, mode: "date" }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("stripe_disputes_provider_ref_unique").on(table.environment, table.providerDisputeRef),
    check("stripe_disputes_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_disputes_status_valid",
      sql.raw("status in ('open','needs_response','under_review','won','lost','closed')"),
    ),
    check("stripe_disputes_money_valid", sql.raw("amount_minor > 0 and currency = 'USD'")),
    only("stripe_disputes"),
  ],
).enableRLS();

export const stripeInvoicePayments = pgTable(
  "stripe_invoice_payments",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => stripeInvoices.id, { onDelete: "restrict" }),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    providerPaymentReference: text("provider_payment_reference"),
    amountMinor: money("amount_minor"),
    currency: currency("currency"),
    status: varchar("status", { length: 48 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_invoice_payments_provider_ref_unique").on(table.providerPaymentReference),
    check(
      "stripe_invoice_payments_status_valid",
      sql.raw(
        "status in ('planned','provider_pending','provider_succeeded_pending_verification','provider_failed','reconciled')",
      ),
    ),
    check("stripe_invoice_payments_money_valid", sql.raw("amount_minor > 0 and currency = 'USD'")),
    only("stripe_invoice_payments"),
  ],
).enableRLS();

export const stripeInstallmentSchedules = pgTable(
  "stripe_installment_schedules",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => paymentTransactions.id, { onDelete: "restrict" }),
    installmentNumber: integer("installment_number").notNull(),
    amountMinor: money("amount_minor"),
    currency: currency("currency"),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }).notNull(),
    status: varchar("status", { length: 48 }).notNull(),
    pricingSnapshot: jsonb("pricing_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("stripe_installment_schedules_transaction_number_unique").on(
      table.transactionId,
      table.installmentNumber,
    ),
    check(
      "stripe_installment_schedules_status_valid",
      sql.raw("status in ('planned','due','paid_pending_verification','overdue','cancelled')"),
    ),
    check(
      "stripe_installment_schedules_value_valid",
      sql.raw("installment_number > 0 and amount_minor > 0 and currency = 'USD'"),
    ),
    only("stripe_installment_schedules"),
  ],
).enableRLS();

export const stripeSubscriptions = pgTable(
  "stripe_subscriptions",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    accountProfileId: text("account_profile_id")
      .notNull()
      .references(() => stripeAccountProfiles.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    providerSubscriptionRef: text("provider_subscription_ref"),
    catalogSnapshot: jsonb("catalog_snapshot").notNull(),
    pricingSnapshot: jsonb("pricing_snapshot").notNull(),
    consentReference: text("consent_reference").notNull(),
    status: varchar("status", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    ...timestamps,
  },
  (table) => [
    unique("stripe_subscriptions_provider_ref_unique").on(
      table.environment,
      table.providerSubscriptionRef,
    ),
    check("stripe_subscriptions_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_subscriptions_status_valid",
      sql.raw(
        "status in ('not_enabled','provider_creation_pending','provider_created','active_pending_verification','past_due_pending_verification','cancel_pending_verification','cancelled')",
      ),
    ),
    only("stripe_subscriptions"),
  ],
).enableRLS();

export const stripeBillingPortalSessions = pgTable(
  "stripe_billing_portal_sessions",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    accountProfileId: text("account_profile_id")
      .notNull()
      .references(() => stripeAccountProfiles.id, { onDelete: "restrict" }),
    environment: varchar("environment", { length: 8 }).notNull(),
    returnPath: text("return_path").notNull(),
    providerSessionRef: text("provider_session_ref"),
    status: varchar("status", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 256 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("stripe_billing_portal_sessions_provider_ref_unique").on(
      table.environment,
      table.providerSessionRef,
    ),
    check(
      "stripe_billing_portal_sessions_environment_valid",
      sql.raw("environment in ('test','live')"),
    ),
    check(
      "stripe_billing_portal_sessions_status_valid",
      sql.raw("status in ('not_enabled','provider_creation_pending','provider_created','expired')"),
    ),
    check(
      "stripe_billing_portal_sessions_return_path_valid",
      sql.raw(
        "return_path like '/%' and return_path not like '//%' and position('://' in return_path) = 0",
      ),
    ),
    only("stripe_billing_portal_sessions"),
  ],
).enableRLS();

export const stripeEventInbox = pgTable(
  "stripe_event_inbox",
  {
    id: text("id").primaryKey(),
    environment: varchar("environment", { length: 8 }).notNull(),
    accountProfileId: text("account_profile_id")
      .notNull()
      .references(() => stripeAccountProfiles.id, { onDelete: "restrict" }),
    providerEventId: text("provider_event_id").notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    payloadHash: char("payload_hash", { length: 64 }).notNull(),
    rawPayloadQuarantineReference: text("raw_payload_quarantine_reference"),
    signatureVersion: varchar("signature_version", { length: 16 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    attemptCount: integer("attempt_count").notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
    failureCode: varchar("failure_code", { length: 64 }),
    ...timestamps,
  },
  (table) => [
    unique("stripe_event_inbox_environment_event_unique").on(
      table.environment,
      table.providerEventId,
    ),
    index("stripe_event_inbox_processing_idx").on(table.status, table.receivedAt),
    check("stripe_event_inbox_environment_valid", sql.raw("environment in ('test','live')")),
    check(
      "stripe_event_inbox_status_valid",
      sql.raw(
        "status in ('received','signature_verified','normalized','candidate_created','ignored','failed','dead_lettered')",
      ),
    ),
    check(
      "stripe_event_inbox_hash_valid",
      sql.raw("payload_hash ~ '^[0-9a-f]{64}$' and attempt_count > 0"),
    ),
    only("stripe_event_inbox"),
  ],
).enableRLS();

export const stripePaymentVerificationCandidates = pgTable(
  "stripe_payment_verification_candidates",
  {
    id: text("id").primaryKey(),
    eventInboxId: text("event_inbox_id")
      .notNull()
      .references(() => stripeEventInbox.id, { onDelete: "restrict" })
      .unique(),
    transactionId: text("transaction_id").references(() => paymentTransactions.id, {
      onDelete: "restrict",
    }),
    candidateType: varchar("candidate_type", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    expectedAmountMinor: bigint("expected_amount_minor", { mode: "number" }),
    observedAmountMinor: bigint("observed_amount_minor", { mode: "number" }),
    currency: varchar("currency", { length: 3 }),
    evidenceSnapshot: jsonb("evidence_snapshot").notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (_table) => [
    check(
      "stripe_payment_verification_candidates_type_valid",
      sql.raw(
        "candidate_type in ('payment_succeeded','payment_failed','refund_succeeded','dispute_opened','invoice_paid')",
      ),
    ),
    check(
      "stripe_payment_verification_candidates_status_valid",
      sql.raw("status in ('candidate_created','sent_to_m044','rejected_by_m044')"),
    ),
    check(
      "stripe_payment_verification_candidates_money_valid",
      sql.raw(
        "(expected_amount_minor is null or expected_amount_minor >= 0) and (observed_amount_minor is null or observed_amount_minor >= 0) and (currency is null or currency = 'USD')",
      ),
    ),
    only("stripe_payment_verification_candidates"),
  ],
).enableRLS();

export const stripeEventDeadLetters = pgTable(
  "stripe_event_dead_letters",
  {
    id: text("id").primaryKey(),
    eventInboxId: text("event_inbox_id")
      .notNull()
      .references(() => stripeEventInbox.id, { onDelete: "restrict" })
      .unique(),
    failureCode: varchar("failure_code", { length: 64 }).notNull(),
    failureSummary: text("failure_summary").notNull(),
    attemptCount: integer("attempt_count").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (_table) => [
    check("stripe_event_dead_letters_attempt_count_valid", sql.raw("attempt_count > 0")),
    check(
      "stripe_event_dead_letters_status_valid",
      sql.raw("status in ('open','replaying','resolved','discarded')"),
    ),
    only("stripe_event_dead_letters"),
  ],
).enableRLS();

export const stripeReconciliationRuns = pgTable(
  "stripe_reconciliation_runs",
  {
    id: text("id").primaryKey(),
    environment: varchar("environment", { length: 8 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    initiatedBy: varchar("initiated_by", { length: 24 }).notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (_table) => [
    check(
      "stripe_reconciliation_runs_environment_valid",
      sql.raw("environment in ('test','live')"),
    ),
    check(
      "stripe_reconciliation_runs_status_valid",
      sql.raw("status in ('queued','running','completed','failed')"),
    ),
    check(
      "stripe_reconciliation_runs_initiator_valid",
      sql.raw("initiated_by in ('scheduled_job','staff')"),
    ),
    only("stripe_reconciliation_runs"),
  ],
).enableRLS();

export const stripeReconciliationFindings = pgTable(
  "stripe_reconciliation_findings",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => stripeReconciliationRuns.id, { onDelete: "restrict" }),
    transactionId: text("transaction_id").references(() => paymentTransactions.id, {
      onDelete: "restrict",
    }),
    providerReference: text("provider_reference"),
    severity: varchar("severity", { length: 16 }).notNull(),
    category: varchar("category", { length: 48 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    summary: text("summary").notNull(),
    ...timestamps,
  },
  (table) => [
    index("stripe_reconciliation_findings_open_idx").on(table.status, table.severity),
    check(
      "stripe_reconciliation_findings_severity_valid",
      sql.raw("severity in ('information','warning','critical')"),
    ),
    check(
      "stripe_reconciliation_findings_category_valid",
      sql.raw(
        "category in ('missing_provider_event','amount_mismatch','currency_mismatch','missing_candidate','unknown_provider_object','duplicate_event','stale_transaction')",
      ),
    ),
    check(
      "stripe_reconciliation_findings_status_valid",
      sql.raw("status in ('open','investigating','resolved','accepted_risk')"),
    ),
    only("stripe_reconciliation_findings"),
  ],
).enableRLS();

export const stripePaymentAuditEvents = pgTable(
  "stripe_payment_audit_events",
  {
    id: text("id").primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    actorType: varchar("actor_type", { length: 24 }).notNull(),
    actorId: text("actor_id"),
    resourceType: varchar("resource_type", { length: 64 }).notNull(),
    resourceId: text("resource_id").notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("stripe_payment_audit_events_resource_idx").on(
      table.resourceType,
      table.resourceId,
      table.occurredAt,
    ),
    check(
      "stripe_payment_audit_events_action_valid",
      sql.raw(
        "action in ('checkout_prepared','invoice_prepared','webhook_received','webhook_duplicate_ignored','verification_candidate_created','refund_requested','reconciliation_finding_created','provider_operation_blocked')",
      ),
    ),
    check(
      "stripe_payment_audit_events_actor_type_valid",
      sql.raw("actor_type in ('client','staff','system','service_account')"),
    ),
    only("stripe_payment_audit_events"),
  ],
).enableRLS();
