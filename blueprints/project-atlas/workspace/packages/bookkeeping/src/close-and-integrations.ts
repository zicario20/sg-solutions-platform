import type {
  AccountingIntegrationAuthority,
  AccountingIntegrationConfiguration,
  AccountingPeriodStatus,
  BookkeepingIntegration,
  BookkeepingTaxHandoff,
  TaxMappingProposal,
  TaxReadyPackage,
} from "./contracts.ts";

export function createDisabledAccountingIntegration(input: {
  integrationId: string;
  accountingBookId: string;
  providerType: AccountingIntegrationConfiguration["providerType"];
}): AccountingIntegrationConfiguration {
  if (!input.integrationId || !input.accountingBookId)
    throw new Error("ACCOUNTING_INTEGRATION_IDENTIFIERS_REQUIRED");
  return {
    ...input,
    syncMode: "manual_sync",
    sourceOfTruth: "sg_solutions",
    supportedCapabilities: Object.freeze([]),
    status: "not_connected",
    killSwitchEnabled: true,
    providerActivationAllowed: false,
  };
}

export function resolveAccountingIntegrationAuthority(
  configuration: AccountingIntegrationConfiguration,
): AccountingIntegrationAuthority {
  if (
    configuration.sourceOfTruth !== "sg_solutions" ||
    configuration.status !== "not_connected" ||
    !configuration.killSwitchEnabled ||
    configuration.providerActivationAllowed
  )
    throw new Error("ACCOUNTING_INTEGRATION_CONFIGURATION_NOT_ALLOWED");
  return {
    sourceOfTruth: "sg_solutions",
    canReadExternal: false,
    canWriteExternal: false,
    canSynchronize: false,
  };
}

export function evaluateTaxReadyPackage(input: {
  periodsHardClosed: boolean;
  reconciliationsComplete: boolean;
  suspenseBalanceMinor: number;
  humanReviewCompleted: boolean;
}): TaxReadyPackage {
  if (
    !input.periodsHardClosed ||
    !input.reconciliationsComplete ||
    input.suspenseBalanceMinor !== 0
  )
    return {
      state: "not_ready",
      reason: "Period close, reconciliation and suspense cleanup are required.",
    };
  if (!input.humanReviewCompleted)
    return {
      state: "review_required",
      reason: "A human bookkeeping review is required before tax handoff.",
    };
  return {
    state: "ready_for_tax_team",
    reason: "Prepared books may be handed to the tax team; this does not authorize tax filing.",
  };
}

export function proposeTaxMapping(input: {
  accountCode: string;
  taxCategoryReference: string;
}): TaxMappingProposal {
  if (!input.accountCode || !input.taxCategoryReference)
    throw new Error("TAX_MAPPING_REFERENCES_REQUIRED");
  return { ...input, status: "review_required", canDetermineDeductibility: false };
}

export function createBookkeepingTaxHandoff(input: {
  taxCaseReference: string;
  readiness: TaxReadyPackage;
}): BookkeepingTaxHandoff {
  if (!input.taxCaseReference) throw new Error("TAX_HANDOFF_CASE_REQUIRED");
  return {
    taxCaseReference: input.taxCaseReference,
    status: input.readiness.state === "ready_for_tax_team" ? "ready_for_review" : "blocked",
    canFileTaxReturn: false,
  };
}

export function evaluateIntegrationUse(integration: BookkeepingIntegration): readonly string[] {
  const blockers: string[] = [];
  if (integration.status !== "enabled") blockers.push("integration_disabled");
  if (!integration.secretReferenceConfigured) blockers.push("secret_reference_required");
  if (!integration.ownerApproved) blockers.push("owner_approval_required");
  if (!integration.killSwitchEnabled) blockers.push("kill_switch_required");
  return Object.freeze(blockers);
}

export function evaluateExternalPosting(_input: {
  providerCode: BookkeepingIntegration["providerCode"];
  integrationEnabled: boolean;
  humanApprovalGranted: boolean;
}): { allowed: false; reason: "EXTERNAL_POSTING_DISABLED" } {
  return { allowed: false, reason: "EXTERNAL_POSTING_DISABLED" };
}

export function detectIntegrationConflict(input: {
  periodStatus: AccountingPeriodStatus;
  incomingChangeReference: string;
}): {
  state: "blocked" | "review_required";
  reason: "HARD_CLOSED_PERIOD_PROTECTED" | "INTEGRATION_CHANGE_REQUIRES_REVIEW";
} {
  if (!input.incomingChangeReference) throw new Error("INTEGRATION_CHANGE_REFERENCE_REQUIRED");
  return input.periodStatus === "hard_closed"
    ? { state: "blocked", reason: "HARD_CLOSED_PERIOD_PROTECTED" }
    : { state: "review_required", reason: "INTEGRATION_CHANGE_REQUIRES_REVIEW" };
}
