export type AccountingBookStatus = "setup" | "active" | "soft_closed" | "hard_closed" | "archived";
export type AccountingPeriodStatus = "open" | "soft_closed" | "hard_closed";
export type AccountCategory = "asset" | "liability" | "equity" | "income" | "expense";
export type JournalStatus = "draft" | "proposed" | "posted" | "voided";
export type TransactionClassification =
  | "unclassified"
  | "proposed"
  | "client_question"
  | "review_required"
  | "approved";
export type ReconciliationStatus =
  | "draft"
  | "in_progress"
  | "difference_detected"
  | "review_required"
  | "completed"
  | "locked";

export interface ChartAccount {
  code: string;
  name: string;
  category: AccountCategory;
  active: boolean;
  systemAccount: boolean;
}
export interface JournalEntryLine {
  accountCode: string;
  debitMinor: number;
  creditMinor: number;
  memo?: string;
}
export interface JournalEntryDraft {
  entryId: string;
  bookId: string;
  periodId: string;
  periodStatus: AccountingPeriodStatus;
  status: JournalStatus;
  currency: "USD";
  lines: readonly JournalEntryLine[];
  sourceReference?: string;
}
export interface PostedJournalEntry extends JournalEntryDraft {
  status: "posted";
  postedAt: string;
}
export interface AdjustingJournalEntryProposal {
  entry: JournalEntryDraft;
  adjustmentReason: string;
  evidenceReference: string;
  requiresHumanApproval: true;
  canPostAutomatically: false;
}
export interface SourceTransaction {
  sourceId: string;
  accountReference: string;
  occurredOn: string;
  amountMinor: number;
  currency: "USD";
  direction: "inflow" | "outflow";
  description: string;
  pending: boolean;
}
export interface TransactionProposal {
  sourceId: string;
  classification: TransactionClassification;
  suggestedAccountCode?: string;
  confidence: number;
  requiresHumanReview: boolean;
}
export type EconomicTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "loan_proceeds"
  | "loan_principal_payment"
  | "credit_card_payment"
  | "reimbursement"
  | "refund"
  | "owner_contribution"
  | "owner_draw"
  | "unknown";
export interface MerchantNormalization {
  originalDescription: string;
  normalizedMerchant: string;
  confidence: number;
  requiresHumanReview: true;
}
export interface CategorizationRule {
  ruleId: string;
  priority: number;
  match: "description_contains" | "merchant_equals";
  expectedValue: string;
  accountCode: string;
  active: boolean;
}
export interface ClientTransactionQuestion {
  questionId: string;
  sourceTransactionId: string;
  prompt: string;
  status: "open" | "answered" | "resolved";
  requiresHumanReview: true;
}
export interface ReconciliationInput {
  statementEndingBalanceMinor: number;
  clearedLedgerBalanceMinor: number;
  outstandingDebitMinor: number;
  outstandingCreditMinor: number;
}
export interface ReconciliationResult {
  status: ReconciliationStatus;
  differenceMinor: number;
}
export interface BookkeepingIntegration {
  providerCode: "quickbooks" | "xero" | "bank_feed" | "file_import";
  status: "disabled" | "sandbox_pending" | "enabled" | "paused";
  secretReferenceConfigured: boolean;
  ownerApproved: boolean;
  killSwitchEnabled: boolean;
}
export type AccountingIntegrationProviderType =
  | "quickbooks_online"
  | "xero"
  | "quickbooks_desktop_import"
  | "generic_csv"
  | "generic_api"
  | "custom_provider";
export type AccountingIntegrationSyncMode =
  | "import_only"
  | "export_only"
  | "bidirectional"
  | "read_only_mirror"
  | "manual_sync"
  | "controlled_export";
export type AccountingDataSourceOfTruth =
  | "sg_solutions"
  | "external_provider"
  | "hybrid_with_field_ownership";
export type AccountingIntegrationConnectionStatus =
  | "not_connected"
  | "connecting"
  | "active"
  | "syncing"
  | "reauthentication_required"
  | "degraded"
  | "paused"
  | "disconnected"
  | "failed";

export interface AccountingIntegrationConfiguration {
  integrationId: string;
  accountingBookId: string;
  providerType: AccountingIntegrationProviderType;
  providerConnectionReference?: string;
  externalCompanyReference?: string;
  syncMode: AccountingIntegrationSyncMode;
  sourceOfTruth: AccountingDataSourceOfTruth;
  supportedCapabilities: readonly [];
  status: "not_connected";
  killSwitchEnabled: true;
  providerActivationAllowed: false;
}
export interface TaxReadyPackage {
  state: "not_ready" | "review_required" | "ready_for_tax_team";
  reason: string;
}
export interface TrialBalanceLine {
  accountCode: string;
  category: AccountCategory;
  debitMinor: number;
  creditMinor: number;
}
export interface TrialBalanceSnapshot {
  lines: readonly TrialBalanceLine[];
  totalDebitMinor: number;
  totalCreditMinor: number;
  balanced: boolean;
}
export interface ProfitAndLossSnapshot {
  incomeMinor: number;
  expenseMinor: number;
  netIncomeMinor: number;
}
export interface CashFlowSnapshot {
  operatingCashFlowMinor: number;
  investingCashFlowMinor: number;
  financingCashFlowMinor: number;
  netCashFlowMinor: number;
}
export interface ProfitAndLossComparison {
  current: ProfitAndLossSnapshot;
  prior: ProfitAndLossSnapshot;
  netIncomeVarianceMinor: number;
  requiresHumanReview: true;
}
export interface VarianceAnalysis {
  varianceMinor: number;
  state: "within_threshold" | "review_required";
  requiresHumanReview: true;
}
export interface ClientReportPackage {
  reportPackageId: string;
  accountingBookId: string;
  reportReferences: readonly string[];
  status: "review_required";
  clientVisible: false;
  canExportExternally: false;
}
export interface PeriodCloseReadiness {
  state: "blocked" | "review_required";
  blockers: readonly string[];
}

export interface FinancialAccountRegistryEntry {
  id: string;
  bookId: string;
  accountName: string;
  accountType: "bank" | "credit_card" | "loan" | "cash" | "other";
  currency: "USD";
  providerConnectionStatus: "not_connected" | "disabled" | "connected" | "attention_required";
  lastImportAt?: string;
  active: boolean;
}
export interface TransactionImportBatch {
  idempotencyKey: string;
  bookId: string;
  accountRegistryId: string;
  source: "csv" | "ofx" | "provider_feed" | "manual";
  sourceDigest: string;
  status: "draft" | "review_required" | "completed" | "failed";
  importedTransactionCount: number;
  duplicateCandidateCount: number;
  requiresHumanReview: true;
}
export interface DuplicateDetectionCandidate {
  id: string;
  accountRegistryId: string;
  postedOn: string;
  amountMinor: number;
  currency: "USD";
  normalizedDescription: string;
}
export interface DuplicateDetectionResult {
  duplicateCandidateIds: readonly string[];
  requiresHumanReview: true;
  automaticDeletionAllowed: false;
}
export interface ReceiptMatchProposal {
  sourceTransactionId: string;
  receiptDocumentId: string;
  confidence: number;
  status: "proposed" | "requires_review";
  requiresHumanReview: true;
}
export type BookkeepingServiceType =
  | "monthly_bookkeeping"
  | "quarterly_bookkeeping"
  | "annual_cleanup"
  | "catch_up_bookkeeping"
  | "cleanup_bookkeeping"
  | "bookkeeping_cleanup"
  | "tax_ready_books"
  | "transaction_categorization"
  | "bank_reconciliation"
  | "financial_reporting"
  | "custom_bookkeeping_service";
export type BookkeepingFrequency = "monthly" | "quarterly" | "annual" | "custom";
export type BookkeepingCaseStatus =
  | "draft"
  | "setup_pending"
  | "opening_balances_pending"
  | "active"
  | "period_processing"
  | "questions_pending"
  | "review_pending"
  | "client_action_required"
  | "paused"
  | "completed"
  | "cancelled"
  | "archived";
export type AccountingEntityClassification = "business" | "personal" | "mixed" | "unknown";
export type AccountingEntityLegalType =
  | "individual"
  | "sole_proprietorship"
  | "llc"
  | "corporation"
  | "partnership"
  | "other";

export interface AccountingEntity {
  accountingEntityId: string;
  organizationReference?: string;
  legalEntityType: AccountingEntityLegalType;
  classification: AccountingEntityClassification;
  displayName: string;
  taxIdentifierTokenReference?: string;
  currency: "USD";
  country: "US";
  baseJurisdiction?: string;
  fiscalYearEndMonth: number;
  status: "setup" | "active" | "archived";
}

export interface BookkeepingEngagement {
  engagementId: string;
  clientId: string;
  accountingEntityId: string;
  serviceType: BookkeepingServiceType;
  bookkeepingFrequency: BookkeepingFrequency;
  accountingBasis: "cash" | "accrual";
  bookStartOn: string;
  fiscalYearEndMonth: number;
  reportingFrequency: BookkeepingFrequency;
  monthlyTransactionAllowance?: number;
  closePolicyReference?: string;
  externalAccountingSystem: "disabled";
  status: "setup_in_progress";
  providerConnectionsEnabled: false;
  taxIntegrationEnabled: false;
  requiresHumanSetupReview: true;
}
export interface AccountingPeriodTransitionInput {
  currentStatus: AccountingPeriodStatus;
  targetStatus: AccountingPeriodStatus;
  closeReviewApproved: boolean;
  unresolvedReconciliationDifferences: number;
  hardCloseApprovalGranted: boolean;
}
export interface AccountingPeriodTransitionResult {
  allowed: boolean;
  reason?:
    | "CLOSE_REVIEW_REQUIRED"
    | "RECONCILIATION_DIFFERENCES_OPEN"
    | "HARD_CLOSE_APPROVAL_REQUIRED"
    | "SOFT_CLOSE_REQUIRED"
    | "REOPENING_REQUIRES_SEPARATE_WORKFLOW";
}
export interface CloseChecklistItem {
  code: string;
  completed: boolean;
}
export interface CloseChecklist {
  periodId: string;
  state: "blocked" | "review_required";
  blockers: readonly string[];
  requiresHumanApproval: true;
}
export interface AccountingIntegrationHealthInput {
  providerCode: BookkeepingIntegration["providerCode"];
  status: BookkeepingIntegration["status"];
  lastSyncState: "not_started" | "succeeded" | "failed" | "unknown";
  killSwitchEnabled: boolean;
}
export interface AccountingIntegrationHealth {
  state: "disabled" | "attention_required" | "review_required";
  canSync: false;
}

export interface AccountingIntegrationAuthority {
  sourceOfTruth: "sg_solutions";
  canReadExternal: false;
  canWriteExternal: false;
  canSynchronize: false;
}
export interface BookkeepingAuditEvent {
  eventType: string;
  actorReference: string;
  resourceReference: string;
  correlationId: string;
  financialPayloadIncluded: false;
}
export interface GeneralLedgerLine {
  entryId: string;
  periodId: string;
  accountCode: string;
  debitMinor: number;
  creditMinor: number;
  postedAt: string;
}
export interface BalanceSheetSnapshot {
  assetMinor: number;
  liabilityMinor: number;
  equityMinor: number;
  currentPeriodEarningsMinor: number;
  balanced: boolean;
}
export interface TransactionSplitAllocation {
  accountCode: string;
  amountMinor: number;
}
export interface TransactionSplitProposal {
  sourceTransactionId: string;
  allocations: readonly TransactionSplitAllocation[];
  status: "review_required";
  requiresHumanReview: true;
}
export interface TransferMatchProposal {
  status: "proposed" | "not_a_match";
  sourceTransactionIds: readonly string[];
  requiresHumanReview: true;
}
export interface AiBookkeepingSuggestionResult {
  state: "requires_human_review";
  canPost: false;
  canDetermineTaxDeductibility: false;
}
export interface FinancialExportRequestResult {
  state: "blocked" | "pending_human_approval";
  reason?: "MFA_REQUIRED" | "HUMAN_APPROVAL_REQUIRED";
}
export interface TaxMappingProposal {
  accountCode: string;
  taxCategoryReference: string;
  status: "review_required";
  canDetermineDeductibility: false;
}
export interface BookkeepingTaxHandoff {
  taxCaseReference: string;
  status: "ready_for_review" | "blocked";
  canFileTaxReturn: false;
}
export interface AccountingBook {
  bookId: string;
  accountingEntityId: string;
  accountingBasis: "cash" | "accrual";
  currency: "USD";
  fiscalYearStartMonth: number;
  status: "setup" | "active" | "soft_closed" | "hard_closed" | "archived";
}
export interface BookkeepingCase {
  caseId: string;
  caseNumber: string;
  engagementId: string;
  accountingEntityId: string;
  accountingBookId: string;
  organizationReference?: string;
  serviceOrderReference?: string;
  assignedBookkeeperReference?: string;
  assignedReviewerReference?: string;
  currentPeriodId?: string;
  status: BookkeepingCaseStatus;
  operationalPostingAllowed: false;
}
