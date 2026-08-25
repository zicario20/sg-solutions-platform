import type {
  BalanceSheetSnapshot,
  CashFlowSnapshot,
  ChartAccount,
  ClientReportPackage,
  GeneralLedgerLine,
  PeriodCloseReadiness,
  PostedJournalEntry,
  ProfitAndLossComparison,
  ProfitAndLossSnapshot,
  TrialBalanceLine,
  TrialBalanceSnapshot,
  VarianceAnalysis,
} from "./contracts.ts";

export function buildTrialBalance(
  entries: readonly PostedJournalEntry[],
  accounts: readonly ChartAccount[],
): TrialBalanceSnapshot {
  const accountMap = new Map(accounts.map((account) => [account.code, account]));
  const balances = new Map<string, { debitMinor: number; creditMinor: number }>();
  for (const entry of entries) {
    if (entry.status !== "posted") continue;
    for (const line of entry.lines) {
      const account = accountMap.get(line.accountCode);
      if (!account) throw new Error(`CHART_ACCOUNT_NOT_FOUND:${line.accountCode}`);
      const current = balances.get(line.accountCode) ?? { debitMinor: 0, creditMinor: 0 };
      balances.set(line.accountCode, {
        debitMinor: current.debitMinor + line.debitMinor,
        creditMinor: current.creditMinor + line.creditMinor,
      });
    }
  }
  const lines: TrialBalanceLine[] = [...balances.entries()]
    .map(([accountCode, balance]) => {
      const account = accountMap.get(accountCode);
      if (!account) {
        throw new Error(`CHART_ACCOUNT_NOT_FOUND:${accountCode}`);
      }

      return {
        accountCode,
        category: account.category,
        ...balance,
      };
    })
    .sort((left, right) => left.accountCode.localeCompare(right.accountCode));
  const totalDebitMinor = lines.reduce((sum, line) => sum + line.debitMinor, 0);
  const totalCreditMinor = lines.reduce((sum, line) => sum + line.creditMinor, 0);
  return {
    lines: Object.freeze(lines),
    totalDebitMinor,
    totalCreditMinor,
    balanced: totalDebitMinor === totalCreditMinor,
  };
}

export function buildProfitAndLoss(trialBalance: TrialBalanceSnapshot): ProfitAndLossSnapshot {
  let incomeMinor = 0;
  let expenseMinor = 0;
  for (const line of trialBalance.lines) {
    if (line.category === "income") incomeMinor += line.creditMinor - line.debitMinor;
    if (line.category === "expense") expenseMinor += line.debitMinor - line.creditMinor;
  }
  return { incomeMinor, expenseMinor, netIncomeMinor: incomeMinor - expenseMinor };
}

export function buildCashFlowSnapshot(input: {
  operatingCashFlowMinor: number;
  investingCashFlowMinor: number;
  financingCashFlowMinor: number;
}): CashFlowSnapshot {
  const values = [
    input.operatingCashFlowMinor,
    input.investingCashFlowMinor,
    input.financingCashFlowMinor,
  ];
  if (values.some((value) => !Number.isSafeInteger(value)))
    throw new Error("CASH_FLOW_MINOR_UNITS_REQUIRED");
  return {
    ...input,
    netCashFlowMinor: values.reduce((sum, value) => sum + value, 0),
  };
}

export function compareProfitAndLoss(
  current: ProfitAndLossSnapshot,
  prior: ProfitAndLossSnapshot,
): ProfitAndLossComparison {
  return {
    current,
    prior,
    netIncomeVarianceMinor: current.netIncomeMinor - prior.netIncomeMinor,
    requiresHumanReview: true,
  };
}

export function analyzeVariance(input: {
  currentMinor: number;
  priorMinor: number;
  materialityMinor: number;
}): VarianceAnalysis {
  if (
    !Number.isSafeInteger(input.currentMinor) ||
    !Number.isSafeInteger(input.priorMinor) ||
    !Number.isSafeInteger(input.materialityMinor) ||
    input.materialityMinor < 0
  )
    throw new Error("VARIANCE_MINOR_UNITS_REQUIRED");
  const varianceMinor = input.currentMinor - input.priorMinor;
  return {
    varianceMinor,
    state:
      Math.abs(varianceMinor) > input.materialityMinor ? "review_required" : "within_threshold",
    requiresHumanReview: true,
  };
}

export function createClientReportPackage(input: {
  reportPackageId: string;
  accountingBookId: string;
  reportReferences: readonly string[];
}): ClientReportPackage {
  if (!input.reportPackageId || !input.accountingBookId)
    throw new Error("CLIENT_REPORT_PACKAGE_IDENTIFIERS_REQUIRED");
  const reportReferences = [
    ...new Set(input.reportReferences.map((reference) => reference.trim())),
  ].filter(Boolean);
  if (reportReferences.length === 0) throw new Error("CLIENT_REPORT_PACKAGE_REPORTS_REQUIRED");
  return {
    ...input,
    reportReferences: Object.freeze(reportReferences),
    status: "review_required",
    clientVisible: false,
    canExportExternally: false,
  };
}

export function buildGeneralLedger(entries: readonly PostedJournalEntry[]): GeneralLedgerLine[] {
  return entries
    .filter((entry) => entry.status === "posted")
    .flatMap((entry) =>
      entry.lines.map((line) => ({
        entryId: entry.entryId,
        periodId: entry.periodId,
        accountCode: line.accountCode,
        debitMinor: line.debitMinor,
        creditMinor: line.creditMinor,
        postedAt: entry.postedAt,
      })),
    )
    .sort(
      (left, right) =>
        left.accountCode.localeCompare(right.accountCode) ||
        left.entryId.localeCompare(right.entryId),
    );
}

export function buildBalanceSheet(trialBalance: TrialBalanceSnapshot): BalanceSheetSnapshot {
  let assetMinor = 0;
  let liabilityMinor = 0;
  let equityMinor = 0;
  let currentPeriodEarningsMinor = 0;
  for (const line of trialBalance.lines) {
    if (line.category === "asset") assetMinor += line.debitMinor - line.creditMinor;
    if (line.category === "liability") liabilityMinor += line.creditMinor - line.debitMinor;
    if (line.category === "equity") equityMinor += line.creditMinor - line.debitMinor;
    if (line.category === "income")
      currentPeriodEarningsMinor += line.creditMinor - line.debitMinor;
    if (line.category === "expense")
      currentPeriodEarningsMinor -= line.debitMinor - line.creditMinor;
  }
  return {
    assetMinor,
    liabilityMinor,
    equityMinor,
    currentPeriodEarningsMinor,
    balanced: assetMinor === liabilityMinor + equityMinor + currentPeriodEarningsMinor,
  };
}

export function evaluatePeriodClose(input: {
  reconciliationsComplete: boolean;
  suspenseBalanceMinor: number;
  reviewFindingsResolved: boolean;
  humanReviewCompleted: boolean;
}): PeriodCloseReadiness {
  const blockers: string[] = [];
  if (!input.reconciliationsComplete) blockers.push("reconciliations_required");
  if (input.suspenseBalanceMinor !== 0) blockers.push("suspense_cleanup_required");
  if (!input.reviewFindingsResolved) blockers.push("review_findings_required");
  if (!input.humanReviewCompleted) blockers.push("human_close_review_required");
  return blockers.length === 0
    ? { state: "review_required", blockers: Object.freeze([]) }
    : { state: "blocked", blockers: Object.freeze(blockers) };
}
