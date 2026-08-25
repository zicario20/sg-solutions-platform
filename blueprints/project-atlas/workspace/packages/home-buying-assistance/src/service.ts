import type {
  AffordabilityScenario,
  ClosingRecord,
  DtiCalculation,
  HomebuyerCase,
  HomebuyerConsent,
  HomebuyerEngagement,
  HomebuyerMatchCandidate,
  HomebuyerMatchingRun,
  HomebuyerProfile,
  HomebuyerReadinessAssessment,
  HousingProgram,
  HousingProgramRule,
  HousingProgramVersion,
  LenderReferral,
  Money,
  PreapprovalRecord,
  ProgramScreening,
  PurchaseOffer,
  SourceReference,
} from "./contracts.ts";

export class HomebuyingDomainError extends Error {
  public constructor(
    public readonly code:
      | "INVALID_MONEY"
      | "MISSING_SOURCE_LINEAGE"
      | "INVALID_VERSION"
      | "INVALID_CASE_STATE"
      | "STALE_PROGRAM"
      | "CONSENT_REQUIRED"
      | "PROVIDER_DISABLED"
      | "HUMAN_APPROVAL_REQUIRED"
      | "UNVERIFIED_EXTERNAL_RESULT"
      | "SENSITIVE_AUDIT_DATA",
    message: string,
  ) {
    super(message);
    this.name = "HomebuyingDomainError";
  }
}

export type ProgramFacts = Readonly<
  Record<string, string | number | boolean | readonly string[] | null>
>;
const isCurrent = (source: SourceReference) =>
  source.freshnessStatus === "current" &&
  !["unverified", "unknown", "stale"].includes(source.verificationStatus);
const requireSources = (sources: readonly SourceReference[]) => {
  if (sources.length === 0) {
    throw new HomebuyingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "Homebuying records require source lineage.",
    );
  }
};
const assertMoney = (amount: Money | null) => {
  if (
    amount !== null &&
    (!Number.isInteger(amount.amountCents) ||
      amount.amountCents < 0 ||
      amount.currency.length === 0)
  ) {
    throw new HomebuyingDomainError(
      "INVALID_MONEY",
      "Amounts must use non-negative integer minor units and a currency.",
    );
  }
};
const consentActive = (consent: HomebuyerConsent, now: string) =>
  consent.status === "accepted" &&
  consent.acceptedAt !== null &&
  (consent.expiresAt === null || consent.expiresAt > now);

export const createHomebuyerEngagement = (input: HomebuyerEngagement): HomebuyerEngagement => {
  if (input.clientId.length === 0 || input.serviceOrderId.length === 0) {
    throw new HomebuyingDomainError(
      "INVALID_CASE_STATE",
      "A homebuyer engagement needs a client and service order.",
    );
  }
  return input;
};
export const createHomebuyerCase = (
  input: HomebuyerCase,
  engagement: HomebuyerEngagement,
): HomebuyerCase => {
  if (
    engagement.status !== "active" ||
    input.engagementId !== engagement.id ||
    input.clientId !== engagement.clientId
  ) {
    throw new HomebuyingDomainError(
      "INVALID_CASE_STATE",
      "A case must belong to its active engagement.",
    );
  }
  return input;
};
export const createHomebuyerProfile = (
  input: HomebuyerProfile,
  previous: HomebuyerProfile | null,
): HomebuyerProfile => {
  requireSources(input.sources);
  assertMoney(input.currentHousingExpense);
  assertMoney(input.purchaseGoal.priceRange.minimum);
  assertMoney(input.purchaseGoal.priceRange.maximum);
  if (
    previous !== null &&
    (previous.homebuyerCaseId !== input.homebuyerCaseId ||
      input.profileVersion !== previous.profileVersion + 1)
  ) {
    throw new HomebuyingDomainError(
      "INVALID_VERSION",
      "Material profile changes require the next immutable version.",
    );
  }
  return input;
};
export const createReadinessAssessment = (
  input: HomebuyerReadinessAssessment,
): HomebuyerReadinessAssessment => {
  requireSources(input.sources);
  if (input.dimensions.length === 0) {
    throw new HomebuyingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "Readiness needs explained dimensions.",
    );
  }
  return input;
};
export const calculateDti = (
  input: Omit<DtiCalculation, "frontEndDti" | "backEndDti">,
): DtiCalculation => {
  assertMoney(input.grossMonthlyIncome);
  assertMoney(input.monthlyDebt);
  assertMoney(input.estimatedHousingPayment);
  requireSources(input.sources);
  const income = input.grossMonthlyIncome.amountCents;
  return {
    ...input,
    frontEndDti:
      income > 0 && input.estimatedHousingPayment !== null
        ? input.estimatedHousingPayment.amountCents / income
        : null,
    backEndDti:
      income > 0 && input.estimatedHousingPayment !== null
        ? (input.monthlyDebt.amountCents + input.estimatedHousingPayment.amountCents) / income
        : null,
  };
};
export const createAffordabilityScenario = (
  input: AffordabilityScenario,
): AffordabilityScenario => {
  for (const amount of [
    input.purchasePrice,
    input.downPayment,
    input.estimatedPrincipalInterest,
    input.estimatedTaxes,
    input.estimatedInsurance,
    input.estimatedHoa,
    input.estimatedMortgageInsurance,
    input.totalEstimatedHousingPayment,
  ])
    assertMoney(amount);
  if (input.estimatedRate !== null && input.rateSource === null) {
    throw new HomebuyingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "An educational rate assumption must show a source.",
    );
  }
  return input;
};
export const publishHousingProgram = (
  program: HousingProgram,
  version: HousingProgramVersion,
  now: string,
): HousingProgram => {
  if (
    version.programId !== program.id ||
    version.status !== "published" ||
    version.availability === "stale" ||
    version.verifiedAt === null ||
    version.verifiedAt > now ||
    !version.sources.every(isCurrent)
  ) {
    throw new HomebuyingDomainError(
      "STALE_PROGRAM",
      "Only current official-source program versions may be published.",
    );
  }
  return { ...program, status: "published", currentVersionId: version.id, updatedAt: now };
};
const evaluateRule = (
  actual: ProgramFacts[string] | undefined,
  rule: HousingProgramRule,
): boolean | null => {
  if (actual === undefined || actual === null) return null;
  if (rule.operator === "equals") return actual === rule.expectedValue;
  if (rule.operator === "not_equals") return actual !== rule.expectedValue;
  if (rule.operator === "exists") return actual !== null;
  if (rule.operator === "greater_than_or_equal") {
    return typeof actual === "number" && typeof rule.expectedValue === "number"
      ? actual >= rule.expectedValue
      : false;
  }
  if (rule.operator === "less_than_or_equal") {
    return typeof actual === "number" && typeof rule.expectedValue === "number"
      ? actual <= rule.expectedValue
      : false;
  }
  if (rule.operator === "in") {
    return Array.isArray(rule.expectedValue) && typeof actual === "string"
      ? rule.expectedValue.includes(actual)
      : false;
  }
  if (rule.operator === "not_in") {
    return Array.isArray(rule.expectedValue) && typeof actual === "string"
      ? !rule.expectedValue.includes(actual)
      : false;
  }
  return false;
};
export const evaluateProgramScreening = (
  input: Readonly<{
    id: string;
    homebuyerCaseId: string;
    programVersion: HousingProgramVersion;
    profileVersion: number;
    financialProfileVersion: number | null;
    rules: readonly HousingProgramRule[];
    facts: ProgramFacts;
    evaluatedAt: string;
  }>,
): ProgramScreening => {
  const unavailable = {
    id: input.id,
    homebuyerCaseId: input.homebuyerCaseId,
    programVersionId: input.programVersion.id,
    profileVersion: input.profileVersion,
    financialProfileVersion: input.financialProfileVersion,
    status: "not_available" as const,
    matchedRules: [],
    unmetRules: [],
    unknownFacts: [],
    explanation: "This program is not currently available for preliminary screening.",
    evaluatedAt: input.evaluatedAt,
  };
  if (
    input.programVersion.status !== "published" ||
    input.programVersion.availability !== "available" ||
    input.programVersion.verifiedAt === null ||
    !input.programVersion.sources.every(isCurrent)
  )
    return unavailable;
  const matchedRules: string[] = [];
  const unmetRules: string[] = [];
  const unknownFacts: string[] = [];
  let hardFail = false;
  let softFail = false;
  for (const rule of input.rules.filter(
    (candidate) =>
      candidate.status === "active" &&
      candidate.effectiveFrom <= input.evaluatedAt &&
      (candidate.effectiveTo === null || candidate.effectiveTo > input.evaluatedAt),
  )) {
    const result = evaluateRule(input.facts[rule.factKey], rule);
    if (result === null) {
      unknownFacts.push(rule.factKey);
      continue;
    }
    if (result) matchedRules.push(rule.code);
    else {
      unmetRules.push(rule.code);
      if (rule.strength === "hard") hardFail = true;
      else softFail = true;
    }
  }
  const status: ProgramScreening["status"] = hardFail
    ? "not_a_preliminary_fit"
    : unknownFacts.length > 0
      ? "needs_information"
      : softFail
        ? "manual_review"
        : "potential_fit";
  return {
    id: input.id,
    homebuyerCaseId: input.homebuyerCaseId,
    programVersionId: input.programVersion.id,
    profileVersion: input.profileVersion,
    financialProfileVersion: input.financialProfileVersion,
    status,
    matchedRules,
    unmetRules,
    unknownFacts,
    explanation:
      "This is preliminary program screening. Programs, lenders and authorized parties make final decisions.",
    evaluatedAt: input.evaluatedAt,
  };
};
export const buildHomebuyerMatch = (
  screening: ProgramScreening,
  rankingReasons: readonly string[],
  riskFlags: readonly string[],
): HomebuyerMatchCandidate => ({
  programVersionId: screening.programVersionId,
  screeningId: screening.id,
  matchBand:
    screening.status === "potential_fit"
      ? "potential"
      : screening.status === "needs_information"
        ? "possible_with_information"
        : screening.status === "manual_review"
          ? "manual_review"
          : "not_matched",
  explanation: screening.explanation,
  rankingReasons,
  riskFlags,
});
export const createHomebuyerMatchingRun = (input: HomebuyerMatchingRun): HomebuyerMatchingRun => {
  if (
    input.candidates.some(
      (candidate) => candidate.matchBand === "not_matched" && candidate.rankingReasons.length > 0,
    )
  ) {
    throw new HomebuyingDomainError(
      "INVALID_CASE_STATE",
      "Excluded programs cannot be ranked as matches.",
    );
  }
  return input;
};
export const createLenderReferralDraft = (
  input: LenderReferral,
  consent: HomebuyerConsent,
  now: string,
): LenderReferral => {
  if (
    !consentActive(consent, now) ||
    consent.id !== input.consentId ||
    consent.purpose !== "lender_referral" ||
    consent.partnerId !== input.lenderId
  ) {
    throw new HomebuyingDomainError(
      "CONSENT_REQUIRED",
      "A current lender-specific referral consent is required.",
    );
  }
  return { ...input, status: "draft" };
};
export const submitLenderReferral = (): never => {
  throw new HomebuyingDomainError(
    "PROVIDER_DISABLED",
    "Lender referral is disabled until an approved provider adapter, agreement and human release are active.",
  );
};
export const recordPreapproval = (input: PreapprovalRecord): PreapprovalRecord => {
  assertMoney(input.amount);
  if (input.externalReference.length === 0 || input.verifiedAt.length === 0) {
    throw new HomebuyingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "Preapproval records must be verified lender evidence.",
    );
  }
  return input;
};
export const recordPurchaseOffer = (input: PurchaseOffer): PurchaseOffer => {
  assertMoney(input.offerAmount);
  assertMoney(input.earnestMoney);
  if (
    ["submitted_externally", "accepted_externally", "declined_externally"].includes(input.status) &&
    input.verifiedAt === null
  ) {
    throw new HomebuyingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "External offer outcomes require verified evidence.",
    );
  }
  return input;
};
export const recordClosing = (input: ClosingRecord): ClosingRecord => {
  assertMoney(input.finalCashToClose);
  if (
    input.closingStatus === "completed" &&
    (input.verifiedAt === null || input.sourceDocumentId === null)
  ) {
    throw new HomebuyingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "Closing completion requires verified external evidence.",
    );
  }
  return input;
};
