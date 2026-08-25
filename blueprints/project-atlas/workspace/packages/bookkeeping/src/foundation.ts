import type {
  AccountingBook,
  BookkeepingCase,
  FinancialAccountRegistryEntry,
} from "./contracts.ts";

export function createAccountingBook(
  input: Pick<
    AccountingBook,
    "bookId" | "accountingEntityId" | "accountingBasis" | "fiscalYearStartMonth"
  >,
): AccountingBook {
  if (!input.bookId || !input.accountingEntityId)
    throw new Error("ACCOUNTING_BOOK_IDENTIFIERS_REQUIRED");
  if (
    !Number.isInteger(input.fiscalYearStartMonth) ||
    input.fiscalYearStartMonth < 1 ||
    input.fiscalYearStartMonth > 12
  )
    throw new Error("ACCOUNTING_BOOK_FISCAL_YEAR_MONTH_INVALID");
  return { ...input, currency: "USD", status: "setup" };
}

export function createBookkeepingCase(
  input: Pick<
    BookkeepingCase,
    "caseId" | "caseNumber" | "engagementId" | "accountingEntityId" | "accountingBookId"
  > &
    Partial<
      Pick<
        BookkeepingCase,
        | "organizationReference"
        | "serviceOrderReference"
        | "assignedBookkeeperReference"
        | "assignedReviewerReference"
        | "currentPeriodId"
      >
    >,
): BookkeepingCase {
  if (
    !input.caseId ||
    !input.caseNumber ||
    !input.engagementId ||
    !input.accountingEntityId ||
    !input.accountingBookId
  )
    throw new Error("BOOKKEEPING_CASE_IDENTIFIERS_REQUIRED");
  return { ...input, status: "setup_pending", operationalPostingAllowed: false };
}

export function registerFinancialAccount(
  input: Pick<FinancialAccountRegistryEntry, "id" | "bookId" | "accountName" | "accountType">,
): FinancialAccountRegistryEntry {
  if (!input.id || !input.bookId || !input.accountName)
    throw new Error("FINANCIAL_ACCOUNT_REGISTRY_IDENTIFIERS_REQUIRED");
  return {
    ...input,
    currency: "USD",
    providerConnectionStatus: "not_connected",
    active: true,
  };
}
