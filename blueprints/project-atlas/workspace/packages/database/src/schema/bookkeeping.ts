import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const bookkeepingGatewayRole = pgRole("atlas_bookkeeping_gateway").existing();

const gatewayOnly = (name: string) =>
  pgPolicy(`${name}_server_gateway_only`, {
    as: "permissive",
    for: "all",
    to: bookkeepingGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });

const ownership = {
  ownerAccountId: text("owner_account_id").notNull(),
  contextRef: text("context_ref").notNull(),
  authorizationEpoch: bigint("authorization_epoch", { mode: "number" }).notNull(),
  policyEpoch: bigint("policy_epoch", { mode: "number" }).notNull(),
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const bookkeepingEngagements = pgTable(
  "bookkeeping_engagements",
  {
    id: text("id").primaryKey(),
    ...ownership,
    accountingEntityRef: text("accounting_entity_ref")
      .notNull()
      .references(() => accountingEntities.id, { onDelete: "restrict" }),
    serviceType: varchar("service_type", { length: 32 }).notNull(),
    bookkeepingFrequency: varchar("bookkeeping_frequency", { length: 16 }).notNull(),
    accountingBasis: varchar("accounting_basis", { length: 16 }).notNull(),
    bookStartOn: timestamp("book_start_on", { withTimezone: true, mode: "date" }).notNull(),
    fiscalYearEndMonth: integer("fiscal_year_end_month").notNull(),
    monthlyTransactionAllowance: integer("monthly_transaction_allowance"),
    reportingFrequency: varchar("reporting_frequency", { length: 16 }).notNull(),
    closePolicyRef: varchar("close_policy_ref", { length: 128 }),
    externalAccountingSystem: varchar("external_accounting_system", { length: 24 })
      .notNull()
      .default("disabled"),
    status: varchar("status", { length: 32 }).notNull(),
    providerConnectionsEnabled: boolean("provider_connections_enabled").notNull().default(false),
    taxIntegrationEnabled: boolean("tax_integration_enabled").notNull().default(false),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("bookkeeping_engagements_owner_entity_unique").on(
      table.ownerAccountId,
      table.contextRef,
      table.accountingEntityRef,
    ),
    index("bookkeeping_engagements_owner_context_idx").on(
      table.ownerAccountId,
      table.contextRef,
      table.updatedAt,
    ),
    check(
      "bookkeeping_engagements_service_type_valid",
      sql`${table.serviceType} in ('monthly_bookkeeping','quarterly_bookkeeping','annual_cleanup','catch_up_bookkeeping','cleanup_bookkeeping','bookkeeping_cleanup','tax_ready_books','transaction_categorization','bank_reconciliation','financial_reporting','custom_bookkeeping_service')`,
    ),
    check(
      "bookkeeping_engagements_status_valid",
      sql`${table.status} in ('setup_in_progress','active','paused','closed')`,
    ),
    check(
      "bookkeeping_engagements_frequency_valid",
      sql`${table.bookkeepingFrequency} in ('monthly','quarterly','annual','custom') and ${table.reportingFrequency} in ('monthly','quarterly','annual','custom')`,
    ),
    check(
      "bookkeeping_engagements_basis_valid",
      sql`${table.accountingBasis} in ('cash','accrual')`,
    ),
    check(
      "bookkeeping_engagements_fiscal_year_end_month_valid",
      sql`${table.fiscalYearEndMonth} between 1 and 12`,
    ),
    check(
      "bookkeeping_engagements_allowance_valid",
      sql`${table.monthlyTransactionAllowance} is null or ${table.monthlyTransactionAllowance}>=0`,
    ),
    check(
      "bookkeeping_engagements_external_accounting_disabled",
      sql`${table.externalAccountingSystem}='disabled'`,
    ),
    check("bookkeeping_engagements_version_positive", sql`${table.version}>0`),
    check(
      "bookkeeping_engagements_provider_disabled",
      sql`${table.providerConnectionsEnabled}=false and ${table.taxIntegrationEnabled}=false`,
    ),
    gatewayOnly("bookkeeping_engagements"),
  ],
).enableRLS();

export const accountingBooks = pgTable(
  "accounting_books",
  {
    id: text("id").primaryKey(),
    engagementId: text("engagement_id")
      .notNull()
      .references(() => bookkeepingEngagements.id, { onDelete: "restrict" }),
    ...ownership,
    accountingEntityRef: text("accounting_entity_ref")
      .notNull()
      .references(() => accountingEntities.id, { onDelete: "restrict" }),
    accountingBasis: varchar("accounting_basis", { length: 16 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    fiscalYearStartMonth: integer("fiscal_year_start_month").notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("accounting_books_engagement_entity_unique").on(
      table.engagementId,
      table.accountingEntityRef,
    ),
    index("accounting_books_owner_context_idx").on(table.ownerAccountId, table.contextRef),
    check("accounting_books_basis_valid", sql`${table.accountingBasis} in ('cash','accrual')`),
    check("accounting_books_currency_usd", sql`${table.currency}='USD'`),
    check(
      "accounting_books_fiscal_month_valid",
      sql`${table.fiscalYearStartMonth} between 1 and 12`,
    ),
    check(
      "accounting_books_status_valid",
      sql`${table.status} in ('setup','active','soft_closed','hard_closed','archived')`,
    ),
    check("accounting_books_version_positive", sql`${table.version}>0`),
    gatewayOnly("accounting_books"),
  ],
).enableRLS();

export const accountingPeriods = pgTable(
  "accounting_periods",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    ...ownership,
    periodStart: timestamp("period_start", { withTimezone: true, mode: "date" }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true, mode: "date" }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("accounting_periods_book_start_unique").on(table.bookId, table.periodStart),
    index("accounting_periods_book_status_idx").on(table.bookId, table.status, table.periodEnd),
    check("accounting_periods_window_valid", sql`${table.periodEnd}>${table.periodStart}`),
    check(
      "accounting_periods_status_valid",
      sql`${table.status} in ('open','soft_closed','hard_closed')`,
    ),
    check("accounting_periods_version_positive", sql`${table.version}>0`),
    gatewayOnly("accounting_periods"),
  ],
).enableRLS();

export const chartAccounts = pgTable(
  "chart_accounts",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    ...ownership,
    code: varchar("code", { length: 64 }).notNull(),
    name: text("name").notNull(),
    category: varchar("category", { length: 16 }).notNull(),
    active: boolean("active").notNull(),
    systemAccount: boolean("system_account").notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("chart_accounts_book_code_unique").on(table.bookId, table.code),
    index("chart_accounts_book_category_idx").on(table.bookId, table.category, table.active),
    check(
      "chart_accounts_category_valid",
      sql`${table.category} in ('asset','liability','equity','income','expense')`,
    ),
    check(
      "chart_accounts_system_active",
      sql`${table.systemAccount}=false or ${table.active}=true`,
    ),
    check("chart_accounts_version_positive", sql`${table.version}>0`),
    gatewayOnly("chart_accounts"),
  ],
).enableRLS();

export const financialAccountRegistry = pgTable(
  "financial_account_registry",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    ...ownership,
    accountName: text("account_name").notNull(),
    accountType: varchar("account_type", { length: 24 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    providerConnectionStatus: varchar("provider_connection_status", { length: 24 }).notNull(),
    active: boolean("active").notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    index("financial_account_registry_book_active_idx").on(table.bookId, table.active),
    check(
      "financial_account_registry_type_valid",
      sql`${table.accountType} in ('bank','credit_card','loan','cash','other')`,
    ),
    check("financial_account_registry_currency_usd", sql`${table.currency}='USD'`),
    check(
      "financial_account_registry_provider_disabled",
      sql`${table.providerConnectionStatus} in ('not_connected','disabled')`,
    ),
    check("financial_account_registry_version_positive", sql`${table.version}>0`),
    gatewayOnly("financial_account_registry"),
  ],
).enableRLS();

export const sourceTransactions = pgTable(
  "source_transactions",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    financialAccountId: text("financial_account_id")
      .notNull()
      .references(() => financialAccountRegistry.id, { onDelete: "restrict" }),
    ...ownership,
    sourceReference: varchar("source_reference", { length: 128 }).notNull(),
    occurredOn: timestamp("occurred_on", { withTimezone: true, mode: "date" }).notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    direction: varchar("direction", { length: 16 }).notNull(),
    description: text("description").notNull(),
    pending: boolean("pending").notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("source_transactions_account_source_unique").on(
      table.financialAccountId,
      table.sourceReference,
    ),
    index("source_transactions_book_occurred_idx").on(table.bookId, table.occurredOn),
    check("source_transactions_amount_nonzero", sql`${table.amountMinor}<>0`),
    check("source_transactions_direction_valid", sql`${table.direction} in ('inflow','outflow')`),
    check(
      "source_transactions_state_valid",
      sql`${table.state} in ('imported','review_required','reconciled','excluded')`,
    ),
    check("source_transactions_version_positive", sql`${table.version}>0`),
    gatewayOnly("source_transactions"),
  ],
).enableRLS();

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    periodId: text("period_id")
      .notNull()
      .references(() => accountingPeriods.id, { onDelete: "restrict" }),
    ...ownership,
    sourceTransactionId: text("source_transaction_id").references(() => sourceTransactions.id, {
      onDelete: "restrict",
    }),
    status: varchar("status", { length: 16 }).notNull(),
    memo: text("memo"),
    postedAt: timestamp("posted_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    index("journal_entries_book_period_idx").on(table.bookId, table.periodId, table.status),
    check(
      "journal_entries_status_valid",
      sql`${table.status} in ('draft','proposed','posted','voided')`,
    ),
    check(
      "journal_entries_posted_time_valid",
      sql`(${table.status}='posted' and ${table.postedAt} is not null) or (${table.status}<>'posted' and ${table.postedAt} is null)`,
    ),
    check("journal_entries_version_positive", sql`${table.version}>0`),
    gatewayOnly("journal_entries"),
  ],
).enableRLS();

export const journalEntryLines = pgTable(
  "journal_entry_lines",
  {
    id: text("id").primaryKey(),
    journalEntryId: text("journal_entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "restrict" }),
    accountId: text("account_id")
      .notNull()
      .references(() => chartAccounts.id, { onDelete: "restrict" }),
    ...ownership,
    ordinal: integer("ordinal").notNull(),
    debitMinor: bigint("debit_minor", { mode: "number" }).notNull(),
    creditMinor: bigint("credit_minor", { mode: "number" }).notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("journal_entry_lines_entry_ordinal_unique").on(table.journalEntryId, table.ordinal),
    index("journal_entry_lines_account_idx").on(table.accountId, table.createdAt),
    check("journal_entry_lines_ordinal_positive", sql`${table.ordinal}>0`),
    check(
      "journal_entry_lines_amount_valid",
      sql`${table.debitMinor}>=0 and ${table.creditMinor}>=0 and ((${table.debitMinor}>0 and ${table.creditMinor}=0) or (${table.creditMinor}>0 and ${table.debitMinor}=0))`,
    ),
    gatewayOnly("journal_entry_lines"),
  ],
).enableRLS();

export const reconciliationSessions = pgTable(
  "reconciliation_sessions",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    financialAccountId: text("financial_account_id")
      .notNull()
      .references(() => financialAccountRegistry.id, { onDelete: "restrict" }),
    periodId: text("period_id")
      .notNull()
      .references(() => accountingPeriods.id, { onDelete: "restrict" }),
    ...ownership,
    statementEndingBalanceMinor: bigint("statement_ending_balance_minor", {
      mode: "number",
    }).notNull(),
    differenceMinor: bigint("difference_minor", { mode: "number" }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("reconciliation_sessions_account_period_unique").on(
      table.financialAccountId,
      table.periodId,
    ),
    index("reconciliation_sessions_book_status_idx").on(
      table.bookId,
      table.status,
      table.updatedAt,
    ),
    check(
      "reconciliation_sessions_status_valid",
      sql`${table.status} in ('draft','in_progress','difference_detected','review_required','completed','locked')`,
    ),
    check("reconciliation_sessions_version_positive", sql`${table.version}>0`),
    gatewayOnly("reconciliation_sessions"),
  ],
).enableRLS();

export const bookkeepingAuditEvents = pgTable(
  "bookkeeping_audit_events",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    ...ownership,
    eventType: varchar("event_type", { length: 80 }).notNull(),
    resourceReference: text("resource_reference").notNull(),
    correlationId: varchar("correlation_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("bookkeeping_audit_events_book_created_idx").on(table.bookId, table.createdAt),
    check("bookkeeping_audit_events_type_nonempty", sql`char_length(${table.eventType})>0`),
    gatewayOnly("bookkeeping_audit_events"),
  ],
).enableRLS();

export const bookkeepingOutbox = pgTable(
  "bookkeeping_outbox",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    ...ownership,
    eventType: varchar("event_type", { length: 80 }).notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    claimedAt: timestamp("claimed_at", { withTimezone: true, mode: "date" }),
    lastErrorCode: varchar("last_error_code", { length: 80 }),
    correlationId: varchar("correlation_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("bookkeeping_outbox_state_created_idx").on(table.state, table.createdAt),
    check(
      "bookkeeping_outbox_state_valid",
      sql`${table.state} in ('pending','processing','delivered','failed')`,
    ),
    check("bookkeeping_outbox_attempt_count_valid", sql`${table.attemptCount} between 0 and 3`),
    gatewayOnly("bookkeeping_outbox"),
  ],
).enableRLS();

export const accountingCloseRequests = pgTable(
  "accounting_close_requests",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    periodId: text("period_id")
      .notNull()
      .references(() => accountingPeriods.id, { onDelete: "restrict" }),
    ...ownership,
    requestedByAccountId: text("requested_by_account_id").notNull(),
    reviewerAccountId: text("reviewer_account_id"),
    status: varchar("status", { length: 16 }).notNull(),
    reason: text("reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("accounting_close_requests_period_unique").on(table.periodId),
    index("accounting_close_requests_book_status_idx").on(table.bookId, table.status),
    check(
      "accounting_close_requests_status_valid",
      sql`${table.status} in ('requested','approved','rejected')`,
    ),
    check("accounting_close_requests_version_positive", sql`${table.version}>0`),
    gatewayOnly("accounting_close_requests"),
  ],
).enableRLS();

export const accountingEntities = pgTable(
  "accounting_entities",
  {
    id: text("id").primaryKey(),
    ...ownership,
    organizationRef: text("organization_ref"),
    legalEntityType: varchar("legal_entity_type", { length: 32 }).notNull(),
    classification: varchar("classification", { length: 16 }).notNull(),
    displayName: text("display_name").notNull(),
    taxIdentifierTokenRef: text("tax_identifier_token_ref"),
    currency: varchar("currency", { length: 3 }).notNull(),
    country: varchar("country", { length: 2 }).notNull(),
    baseJurisdiction: varchar("base_jurisdiction", { length: 16 }),
    fiscalYearEndMonth: integer("fiscal_year_end_month").notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("accounting_entities_owner_context_id_unique").on(
      table.ownerAccountId,
      table.contextRef,
      table.id,
    ),
    index("accounting_entities_owner_context_status_idx").on(
      table.ownerAccountId,
      table.contextRef,
      table.status,
    ),
    check(
      "accounting_entities_legal_type_valid",
      sql`${table.legalEntityType} in ('individual','sole_proprietorship','llc','corporation','partnership','other')`,
    ),
    check(
      "accounting_entities_classification_valid",
      sql`${table.classification} in ('business','personal','mixed','unknown')`,
    ),
    check("accounting_entities_currency_usd", sql`${table.currency}='USD'`),
    check("accounting_entities_country_us", sql`${table.country}='US'`),
    check(
      "accounting_entities_fiscal_year_end_month_valid",
      sql`${table.fiscalYearEndMonth} between 1 and 12`,
    ),
    check(
      "accounting_entities_status_valid",
      sql`${table.status} in ('setup','active','archived')`,
    ),
    check("accounting_entities_version_positive", sql`${table.version}>0`),
    gatewayOnly("accounting_entities"),
  ],
).enableRLS();

export const bookkeepingCases = pgTable(
  "bookkeeping_cases",
  {
    id: text("id").primaryKey(),
    caseNumber: varchar("case_number", { length: 64 }).notNull(),
    engagementId: text("engagement_id")
      .notNull()
      .references(() => bookkeepingEngagements.id, { onDelete: "restrict" }),
    accountingBookId: text("accounting_book_id")
      .notNull()
      .references(() => accountingBooks.id, { onDelete: "restrict" }),
    currentPeriodId: text("current_period_id").references(() => accountingPeriods.id, {
      onDelete: "restrict",
    }),
    ...ownership,
    accountingEntityRef: text("accounting_entity_ref")
      .notNull()
      .references(() => accountingEntities.id, { onDelete: "restrict" }),
    organizationRef: text("organization_ref"),
    serviceOrderRef: text("service_order_ref"),
    assignedBookkeeperRef: text("assigned_bookkeeper_ref"),
    assignedReviewerRef: text("assigned_reviewer_ref"),
    status: varchar("status", { length: 32 }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("bookkeeping_cases_case_number_unique").on(table.caseNumber),
    unique("bookkeeping_cases_engagement_book_unique").on(
      table.engagementId,
      table.accountingBookId,
    ),
    index("bookkeeping_cases_owner_context_status_idx").on(
      table.ownerAccountId,
      table.contextRef,
      table.status,
    ),
    check(
      "bookkeeping_cases_status_valid",
      sql`${table.status} in ('draft','setup_pending','opening_balances_pending','active','period_processing','questions_pending','review_pending','client_action_required','paused','completed','cancelled','archived')`,
    ),
    check(
      "bookkeeping_cases_closed_at_valid",
      sql`(${table.status} in ('completed','cancelled','archived')) = (${table.closedAt} is not null)`,
    ),
    check("bookkeeping_cases_version_positive", sql`${table.version}>0`),
    gatewayOnly("bookkeeping_cases"),
  ],
).enableRLS();
