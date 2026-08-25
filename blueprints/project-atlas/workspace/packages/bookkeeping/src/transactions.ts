import type {
  CategorizationRule,
  ClientTransactionQuestion,
  DuplicateDetectionCandidate,
  DuplicateDetectionResult,
  EconomicTransactionType,
  MerchantNormalization,
  ReceiptMatchProposal,
  ReconciliationInput,
  ReconciliationResult,
  SourceTransaction,
  TransactionImportBatch,
  TransactionProposal,
  TransactionSplitProposal,
  TransferMatchProposal,
} from "./contracts.ts";

export function sourceTransactionIdempotencyKey(transaction: SourceTransaction): string {
  return `${transaction.accountReference}:${transaction.sourceId}:${transaction.occurredOn}:${transaction.amountMinor}:${transaction.direction}`;
}
export function proposeTransactionClassification(
  transaction: SourceTransaction,
  suggestedAccountCode: string | undefined,
  confidence: number,
): TransactionProposal {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    throw new Error("CLASSIFICATION_CONFIDENCE_INVALID");
  if (transaction.pending)
    return {
      sourceId: transaction.sourceId,
      classification: "unclassified",
      confidence,
      requiresHumanReview: true,
    };
  if (!suggestedAccountCode || confidence < 0.9)
    return {
      sourceId: transaction.sourceId,
      classification: "review_required",
      confidence,
      requiresHumanReview: true,
    };
  return {
    sourceId: transaction.sourceId,
    classification: "proposed",
    suggestedAccountCode,
    confidence,
    requiresHumanReview: true,
  };
}

export function normalizeMerchant(input: {
  description: string;
  aliases?: Readonly<Record<string, string>>;
}): MerchantNormalization {
  const originalDescription = input.description.trim();
  if (!originalDescription) throw new Error("MERCHANT_DESCRIPTION_REQUIRED");
  const normalizedKey = originalDescription.replace(/\s+/gu, " ").toUpperCase();
  const normalizedMerchant = input.aliases?.[normalizedKey] ?? normalizedKey;
  return {
    originalDescription,
    normalizedMerchant,
    confidence: input.aliases?.[normalizedKey] ? 1 : 0.5,
    requiresHumanReview: true,
  };
}

export function classifyEconomicTransaction(input: {
  direction: SourceTransaction["direction"];
  hint?: EconomicTransactionType;
}): EconomicTransactionType {
  const hint = input.hint ?? "unknown";
  const allowed = new Set<EconomicTransactionType>([
    "income",
    "expense",
    "transfer",
    "loan_proceeds",
    "loan_principal_payment",
    "credit_card_payment",
    "reimbursement",
    "refund",
    "owner_contribution",
    "owner_draw",
    "unknown",
  ]);
  if (!allowed.has(hint)) throw new Error("ECONOMIC_TRANSACTION_TYPE_INVALID");
  if (
    (hint === "income" ||
      hint === "loan_proceeds" ||
      hint === "reimbursement" ||
      hint === "refund" ||
      hint === "owner_contribution") &&
    input.direction !== "inflow"
  )
    return "unknown";
  if (
    (hint === "expense" ||
      hint === "loan_principal_payment" ||
      hint === "credit_card_payment" ||
      hint === "owner_draw") &&
    input.direction !== "outflow"
  )
    return "unknown";
  return hint;
}

export function proposeCategorizationFromRules(input: {
  transaction: SourceTransaction;
  merchant: MerchantNormalization;
  rules: readonly CategorizationRule[];
}): TransactionProposal {
  const description = input.transaction.description.trim().toLowerCase();
  const merchant = input.merchant.normalizedMerchant.trim().toLowerCase();
  const matched = [...input.rules]
    .filter((rule) => rule.active && rule.expectedValue.trim() && rule.accountCode.trim())
    .sort(
      (left, right) => left.priority - right.priority || left.ruleId.localeCompare(right.ruleId),
    )
    .find((rule) =>
      rule.match === "description_contains"
        ? description.includes(rule.expectedValue.trim().toLowerCase())
        : merchant === rule.expectedValue.trim().toLowerCase(),
    );
  return proposeTransactionClassification(
    input.transaction,
    matched?.accountCode,
    matched ? Math.min(0.99, input.merchant.confidence) : 0,
  );
}

export function createClientTransactionQuestion(input: {
  questionId: string;
  sourceTransactionId: string;
  prompt: string;
}): ClientTransactionQuestion {
  if (!input.questionId || !input.sourceTransactionId || !input.prompt.trim())
    throw new Error("CLIENT_TRANSACTION_QUESTION_REQUIRED");
  if (input.prompt.length > 500) throw new Error("CLIENT_TRANSACTION_QUESTION_TOO_LONG");
  return { ...input, prompt: input.prompt.trim(), status: "open", requiresHumanReview: true };
}
export function reconcile(input: ReconciliationInput): ReconciliationResult {
  const expected =
    input.clearedLedgerBalanceMinor + input.outstandingDebitMinor - input.outstandingCreditMinor;
  const differenceMinor = input.statementEndingBalanceMinor - expected;
  if (differenceMinor !== 0) return { status: "difference_detected", differenceMinor };
  return { status: "review_required", differenceMinor: 0 };
}

export function buildImportBatch(
  input: Omit<TransactionImportBatch, "idempotencyKey" | "status" | "requiresHumanReview">,
): TransactionImportBatch {
  if (!input.bookId || !input.accountRegistryId || !input.sourceDigest)
    throw new Error("IMPORT_BATCH_IDENTIFIERS_REQUIRED");
  if (input.importedTransactionCount < 0 || input.duplicateCandidateCount < 0)
    throw new Error("IMPORT_BATCH_COUNTS_INVALID");
  return {
    ...input,
    idempotencyKey: `bookkeeping-import:${input.bookId}:${input.accountRegistryId}:${input.source}:${input.sourceDigest}`,
    status: "review_required",
    requiresHumanReview: true,
  };
}
export function detectPotentialDuplicates(
  candidates: readonly DuplicateDetectionCandidate[],
): DuplicateDetectionResult[] {
  const groups = new Map<string, DuplicateDetectionCandidate[]>();
  for (const candidate of candidates) {
    const key = [
      candidate.accountRegistryId,
      candidate.postedOn,
      candidate.amountMinor,
      candidate.currency,
      candidate.normalizedDescription.trim().toLowerCase(),
    ].join(":");
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      duplicateCandidateIds: group.map((candidate) => candidate.id).sort(),
      requiresHumanReview: true,
      automaticDeletionAllowed: false,
    }));
}
export function proposeReceiptMatch(input: {
  sourceTransactionId: string;
  receiptDocumentId: string;
  confidence: number;
}): ReceiptMatchProposal {
  if (!input.sourceTransactionId || !input.receiptDocumentId)
    throw new Error("RECEIPT_MATCH_REFERENCES_REQUIRED");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
    throw new Error("RECEIPT_MATCH_CONFIDENCE_INVALID");
  return {
    ...input,
    status: input.confidence >= 0.9 ? "requires_review" : "proposed",
    requiresHumanReview: true,
  };
}

export function createTransactionSplit(input: {
  sourceTransactionId: string;
  sourceAmountMinor: number;
  allocations: TransactionSplitProposal["allocations"];
}): TransactionSplitProposal {
  if (!input.sourceTransactionId || input.sourceAmountMinor === 0)
    throw new Error("TRANSACTION_SPLIT_SOURCE_REQUIRED");
  if (input.allocations.length < 2)
    throw new Error("TRANSACTION_SPLIT_MULTIPLE_ALLOCATIONS_REQUIRED");
  const allocatedAmountMinor = input.allocations.reduce(
    (sum, allocation) => sum + allocation.amountMinor,
    0,
  );
  if (allocatedAmountMinor !== input.sourceAmountMinor)
    throw new Error("TRANSACTION_SPLIT_MUST_BALANCE_SOURCE");
  if (
    input.allocations.some((allocation) => !allocation.accountCode || allocation.amountMinor === 0)
  )
    throw new Error("TRANSACTION_SPLIT_ALLOCATION_INVALID");
  return {
    sourceTransactionId: input.sourceTransactionId,
    allocations: Object.freeze([...input.allocations]),
    status: "review_required",
    requiresHumanReview: true,
  };
}

export function proposeTransferMatch(input: {
  first: Pick<SourceTransaction, "sourceId" | "amountMinor" | "direction">;
  second: Pick<SourceTransaction, "sourceId" | "amountMinor" | "direction">;
}): TransferMatchProposal {
  const sourceTransactionIds = [input.first.sourceId, input.second.sourceId].sort();
  const isCandidate =
    input.first.sourceId !== input.second.sourceId &&
    input.first.direction !== input.second.direction &&
    input.first.amountMinor === input.second.amountMinor;
  return {
    status: isCandidate ? "proposed" : "not_a_match",
    sourceTransactionIds,
    requiresHumanReview: true,
  };
}
