import type {
  AccountingIntegrationHealth,
  AccountingIntegrationHealthInput,
  BookkeepingAuditEvent,
  CloseChecklist,
  CloseChecklistItem,
} from "./contracts.ts";

export function createCloseChecklist(input: {
  periodId: string;
  requiredItems: readonly CloseChecklistItem[];
}): CloseChecklist {
  if (!input.periodId) throw new Error("CLOSE_CHECKLIST_PERIOD_REQUIRED");
  const blockers = input.requiredItems.filter((item) => !item.completed).map((item) => item.code);
  return {
    periodId: input.periodId,
    state: blockers.length > 0 ? "blocked" : "review_required",
    blockers,
    requiresHumanApproval: true,
  };
}

export function evaluateAccountingIntegrationHealth(
  input: AccountingIntegrationHealthInput,
): AccountingIntegrationHealth {
  if (input.status === "disabled" || input.killSwitchEnabled)
    return { state: "disabled", canSync: false };
  if (input.status === "paused" || input.lastSyncState === "failed")
    return { state: "attention_required", canSync: false };
  return { state: "review_required", canSync: false };
}

export function createBookkeepingAuditEvent(
  input: Omit<BookkeepingAuditEvent, "financialPayloadIncluded">,
): BookkeepingAuditEvent {
  if (!input.eventType || !input.actorReference || !input.resourceReference || !input.correlationId)
    throw new Error("BOOKKEEPING_AUDIT_REFERENCES_REQUIRED");
  return { ...input, financialPayloadIncluded: false };
}

export function evaluateAiBookkeepingSuggestion(input: {
  suggestionType: "category" | "merchant_normalization" | "anomaly";
  confidence: number;
}): import("./contracts.ts").AiBookkeepingSuggestionResult {
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
    throw new Error("AI_BOOKKEEPING_CONFIDENCE_INVALID");
  return {
    state: "requires_human_review",
    canPost: false,
    canDetermineTaxDeductibility: false,
  };
}

export function createFinancialExportRequest(input: {
  requesterReference: string;
  purpose: "client_requested_copy" | "authorized_review" | "tax_handoff";
  mfaVerified: boolean;
  humanApprovalGranted: boolean;
}): import("./contracts.ts").FinancialExportRequestResult {
  if (!input.requesterReference) throw new Error("FINANCIAL_EXPORT_REQUESTER_REQUIRED");
  if (!input.mfaVerified) return { state: "blocked", reason: "MFA_REQUIRED" };
  if (!input.humanApprovalGranted)
    return { state: "pending_human_approval", reason: "HUMAN_APPROVAL_REQUIRED" };
  return { state: "pending_human_approval" };
}
