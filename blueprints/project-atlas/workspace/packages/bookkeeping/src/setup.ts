import type {
  AccountingPeriodTransitionInput,
  AccountingPeriodTransitionResult,
  BookkeepingEngagement,
  ChartAccount,
} from "./contracts.ts";

export function createBookkeepingEngagement(
  input: Pick<
    BookkeepingEngagement,
    | "engagementId"
    | "clientId"
    | "accountingEntityId"
    | "serviceType"
    | "bookkeepingFrequency"
    | "accountingBasis"
    | "bookStartOn"
    | "fiscalYearEndMonth"
    | "reportingFrequency"
  >,
): BookkeepingEngagement {
  if (!input.engagementId || !input.clientId || !input.accountingEntityId)
    throw new Error("BOOKKEEPING_ENGAGEMENT_IDENTIFIERS_REQUIRED");
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(input.bookStartOn))
    throw new Error("BOOKKEEPING_ENGAGEMENT_BOOK_START_DATE_INVALID");
  if (
    !Number.isInteger(input.fiscalYearEndMonth) ||
    input.fiscalYearEndMonth < 1 ||
    input.fiscalYearEndMonth > 12
  )
    throw new Error("BOOKKEEPING_ENGAGEMENT_FISCAL_YEAR_MONTH_INVALID");
  return {
    ...input,
    status: "setup_in_progress",
    providerConnectionsEnabled: false,
    taxIntegrationEnabled: false,
    externalAccountingSystem: "disabled",
    requiresHumanSetupReview: true,
  };
}

export function validateChartOfAccounts(accounts: readonly ChartAccount[]): string[] {
  const issues: string[] = [];
  const codes = new Set<string>();
  for (const account of accounts) {
    const code = account.code.trim();
    if (!code) issues.push("chart_account_code_required");
    else if (codes.has(code)) issues.push("chart_account_codes_must_be_unique");
    else codes.add(code);
    if (account.systemAccount && !account.active)
      issues.push("system_chart_account_must_be_active");
  }
  return [...new Set(issues)];
}

export function transitionAccountingPeriod(
  input: AccountingPeriodTransitionInput,
): AccountingPeriodTransitionResult {
  if (input.targetStatus === "open" && input.currentStatus !== "open")
    return { allowed: false, reason: "REOPENING_REQUIRES_SEPARATE_WORKFLOW" };
  if (input.targetStatus === "soft_closed" && !input.closeReviewApproved)
    return { allowed: false, reason: "CLOSE_REVIEW_REQUIRED" };
  if (input.targetStatus === "hard_closed") {
    if (input.unresolvedReconciliationDifferences > 0)
      return { allowed: false, reason: "RECONCILIATION_DIFFERENCES_OPEN" };
    if (!input.closeReviewApproved) return { allowed: false, reason: "CLOSE_REVIEW_REQUIRED" };
    if (!input.hardCloseApprovalGranted)
      return { allowed: false, reason: "HARD_CLOSE_APPROVAL_REQUIRED" };
    if (input.currentStatus !== "soft_closed")
      return { allowed: false, reason: "SOFT_CLOSE_REQUIRED" };
  }
  return { allowed: true };
}
