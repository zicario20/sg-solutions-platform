import type {
  DscrCalculation,
  FinancialPackage,
  FinancialProfile,
  FundabilityAssessment,
  FundingApplication,
  FundingApplicationPackage,
  FundingCase,
  FundingClientSelection,
  FundingConsent,
  FundingEngagement,
  FundingFinding,
  FundingMatchCandidate,
  FundingMatchingRun,
  FundingOffer,
  FundingOfferComparison,
  FundingProduct,
  FundingProductScreening,
  FundingProductVersion,
  FundingProfile,
  FundingReferral,
  FundingScreeningStatus,
  FundingSourceReference,
  Money,
  UnderwritingReadiness,
} from "./contracts.ts";

export class FundingDomainError extends Error {
  public constructor(
    public readonly code:
      | "INVALID_MONEY"
      | "MISSING_SOURCE_LINEAGE"
      | "STALE_PRODUCT"
      | "INVALID_CASE_STATE"
      | "INVALID_PROFILE_VERSION"
      | "INVALID_PURPOSE_ALLOCATION"
      | "CONSENT_REQUIRED"
      | "CONSENT_INACTIVE"
      | "PROVIDER_DISABLED"
      | "HUMAN_APPROVAL_REQUIRED"
      | "UNVERIFIED_EXTERNAL_RESULT"
      | "INVALID_OFFER"
      | "SENSITIVE_AUDIT_DATA",
    message: string,
  ) {
    super(message);
    this.name = "FundingDomainError";
  }
}

export type FundingScreeningFacts = Readonly<
  Record<string, string | number | boolean | readonly string[] | null>
>;

const currentSource = (source: FundingSourceReference): boolean =>
  source.freshnessStatus === "current" &&
  source.verificationStatus !== "unverified" &&
  source.verificationStatus !== "unknown" &&
  source.verificationStatus !== "stale";

const assertCents = (money: Money | null): void => {
  if (
    money !== null &&
    (!Number.isInteger(money.amountCents) || money.amountCents < 0 || money.currency.length === 0)
  ) {
    throw new FundingDomainError(
      "INVALID_MONEY",
      "Funding amounts must use non-negative integer minor units and a currency.",
    );
  }
};

const assertSources = (sources: readonly FundingSourceReference[]): void => {
  if (sources.length === 0) {
    throw new FundingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "Funding records require source lineage.",
    );
  }
};

const isConsentActive = (consent: FundingConsent, now: string): boolean =>
  consent.status === "accepted" &&
  consent.acceptedAt !== null &&
  (consent.expiresAt === null || consent.expiresAt > now);

export const createFundingEngagement = (input: FundingEngagement): FundingEngagement => {
  if (
    input.clientId.length === 0 ||
    input.organizationId.length === 0 ||
    input.serviceOrderId.length === 0
  ) {
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      "A funding engagement needs a client, organization and service order.",
    );
  }
  return input;
};

export const createFundingCase = (
  input: FundingCase,
  engagement: FundingEngagement,
): FundingCase => {
  if (
    engagement.status !== "active" ||
    input.engagementId !== engagement.id ||
    input.clientId !== engagement.clientId
  ) {
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      "A funding case can only be opened under its active engagement.",
    );
  }
  assertCents(input.requestedAmount);
  return input;
};

export const createFundingProfile = (
  input: FundingProfile,
  previous: FundingProfile | null,
): FundingProfile => {
  assertSources(input.sourceReferences);
  assertCents(input.fundingNeed.requestedAmount);
  for (const purpose of [
    input.fundingNeed.primaryPurpose,
    ...input.fundingNeed.secondaryPurposes,
  ]) {
    assertCents(purpose.amount);
  }
  const total = [input.fundingNeed.primaryPurpose, ...input.fundingNeed.secondaryPurposes].reduce(
    (sum, purpose) => sum + purpose.amount.amountCents,
    0,
  );
  if (total !== input.fundingNeed.requestedAmount.amountCents) {
    throw new FundingDomainError(
      "INVALID_PURPOSE_ALLOCATION",
      "Use-of-funds allocations must reconcile to the requested amount.",
    );
  }
  if (
    previous !== null &&
    (previous.fundingCaseId !== input.fundingCaseId ||
      input.profileVersion !== previous.profileVersion + 1)
  ) {
    throw new FundingDomainError(
      "INVALID_PROFILE_VERSION",
      "Funding profile changes require the next immutable version for the same case.",
    );
  }
  return input;
};

export const createFundabilityAssessment = (
  input: FundabilityAssessment,
): FundabilityAssessment => {
  assertSources(input.sourceReferences);
  if (input.dimensions.length === 0) {
    throw new FundingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "A fundability assessment requires explained readiness dimensions.",
    );
  }
  return input;
};

export const createFundingFinding = (input: FundingFinding): FundingFinding => {
  assertSources(input.sourceReferences);
  return input;
};

export const createFinancialProfile = (
  input: FinancialProfile,
  previous: FinancialProfile | null,
): FinancialProfile => {
  assertSources(input.sourceReferences);
  for (const amount of [
    input.revenue,
    input.expenses,
    input.grossProfit,
    input.operatingIncome,
    input.netIncome,
  ]) {
    assertCents(amount);
  }
  if (
    previous !== null &&
    (previous.fundingCaseId !== input.fundingCaseId ||
      input.profileVersion !== previous.profileVersion + 1)
  ) {
    throw new FundingDomainError(
      "INVALID_PROFILE_VERSION",
      "Financial profile changes require the next immutable version for the same case.",
    );
  }
  return input;
};

export const calculateDscr = (input: Omit<DscrCalculation, "dscr">): DscrCalculation => {
  assertCents(input.cashFlowAvailable);
  assertCents(input.debtService);
  assertSources(input.sourceReferences);
  const dscr =
    input.debtService.amountCents > 0
      ? input.cashFlowAvailable.amountCents / input.debtService.amountCents
      : null;
  return { ...input, dscr };
};

export const checkBalanceSheetEquation = (
  input: Readonly<{ totalAssets: Money; totalLiabilities: Money; equity: Money }>,
) => {
  assertCents(input.totalAssets);
  assertCents(input.totalLiabilities);
  assertCents(input.equity);
  return {
    balanced:
      input.totalAssets.amountCents ===
      input.totalLiabilities.amountCents + input.equity.amountCents,
    differenceCents:
      input.totalAssets.amountCents - input.totalLiabilities.amountCents - input.equity.amountCents,
  };
};

export const createFinancialPackage = (
  input: FinancialPackage,
  previous: FinancialPackage | null,
): FinancialPackage => {
  if (input.documentIds.length === 0) {
    throw new FundingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "A financial package must reference approved documents rather than copy their contents.",
    );
  }
  if (
    previous !== null &&
    (previous.fundingCaseId !== input.fundingCaseId || input.version !== previous.version + 1)
  ) {
    throw new FundingDomainError(
      "INVALID_PROFILE_VERSION",
      "Financial package changes require immutable versioning.",
    );
  }
  return input;
};

export const createUnderwritingReadiness = (input: UnderwritingReadiness): UnderwritingReadiness =>
  input;

export const publishFundingProduct = (
  product: FundingProduct,
  version: FundingProductVersion,
  now: string,
): FundingProduct => {
  if (
    version.productId !== product.id ||
    version.status !== "published" ||
    version.availability === "stale" ||
    version.verifiedAt === null ||
    version.verifiedAt > now ||
    version.sourceReferences.length === 0 ||
    !version.sourceReferences.every(currentSource)
  ) {
    throw new FundingDomainError(
      "STALE_PRODUCT",
      "Only current, source-backed funding product versions may be published.",
    );
  }
  return { ...product, status: "published", currentVersionId: version.id, updatedAt: now };
};

const compareRule = (
  actual: FundingScreeningFacts[string] | undefined,
  operator: string,
  expected: unknown,
): boolean | null => {
  if (actual === undefined || actual === null) return null;
  if (operator === "equals") return actual === expected;
  if (operator === "not_equals") return actual !== expected;
  if (operator === "exists") return actual !== null;
  if (operator === "greater_than_or_equal")
    return typeof actual === "number" && typeof expected === "number" ? actual >= expected : false;
  if (operator === "less_than_or_equal")
    return typeof actual === "number" && typeof expected === "number" ? actual <= expected : false;
  if (operator === "in")
    return Array.isArray(expected) && typeof actual === "string"
      ? expected.includes(actual)
      : false;
  if (operator === "not_in")
    return Array.isArray(expected) && typeof actual === "string"
      ? !expected.includes(actual)
      : false;
  return false;
};

export const evaluateFundingProductScreening = (
  input: Readonly<{
    id: string;
    fundingCaseId: string;
    productVersion: FundingProductVersion;
    profileVersion: number;
    financialProfileVersion: number | null;
    rules: readonly import("./contracts.ts").FundingEligibilityRule[];
    facts: FundingScreeningFacts;
    evaluatedAt: string;
  }>,
): FundingProductScreening => {
  if (
    input.productVersion.status !== "published" ||
    input.productVersion.availability !== "available" ||
    input.productVersion.verifiedAt === null ||
    !input.productVersion.sourceReferences.every(currentSource)
  ) {
    return {
      id: input.id,
      fundingCaseId: input.fundingCaseId,
      productVersionId: input.productVersion.id,
      profileVersion: input.profileVersion,
      financialProfileVersion: input.financialProfileVersion,
      status: "not_available",
      matchedRules: [],
      unmetRules: [],
      unknownFacts: [],
      explanation: "This product is not currently available for preliminary screening.",
      evaluatedAt: input.evaluatedAt,
    };
  }
  const matchedRules: string[] = [];
  const unmetRules: string[] = [];
  const unknownFacts: string[] = [];
  let hardFailure = false;
  let manualReview = false;
  for (const rule of input.rules.filter(
    (candidate) =>
      candidate.status === "active" &&
      candidate.effectiveFrom <= input.evaluatedAt &&
      (candidate.effectiveTo === null || candidate.effectiveTo > input.evaluatedAt),
  )) {
    const result = compareRule(input.facts[rule.factKey], rule.operator, rule.expectedValue);
    if (result === null) {
      unknownFacts.push(rule.factKey);
      continue;
    }
    if (result) matchedRules.push(rule.code);
    else {
      unmetRules.push(rule.code);
      if (rule.ruleStrength === "hard") hardFailure = true;
      else manualReview = true;
    }
  }
  const status: FundingScreeningStatus = hardFailure
    ? "not_a_preliminary_fit"
    : unknownFacts.length > 0
      ? "needs_information"
      : manualReview
        ? "manual_review"
        : "potential_fit";
  return {
    id: input.id,
    fundingCaseId: input.fundingCaseId,
    productVersionId: input.productVersion.id,
    profileVersion: input.profileVersion,
    financialProfileVersion: input.financialProfileVersion,
    status,
    matchedRules,
    unmetRules,
    unknownFacts,
    explanation:
      "Preliminary screening applies current documented product rules; the provider makes every final decision.",
    evaluatedAt: input.evaluatedAt,
  };
};

export const createMatchingRun = (input: FundingMatchingRun): FundingMatchingRun => {
  if (
    input.candidates.some(
      (candidate) => candidate.matchBand === "not_matched" && candidate.rankingReasons.length > 0,
    )
  ) {
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      "Excluded candidates cannot be ranked as matches.",
    );
  }
  return input;
};

export const createApplicationPackage = (
  input: FundingApplicationPackage,
  consent: FundingConsent,
  now: string,
): FundingApplicationPackage => {
  if (
    !isConsentActive(consent, now) ||
    consent.id !== input.consentId ||
    consent.providerId !== input.providerId ||
    consent.purpose !== "application_package"
  ) {
    throw new FundingDomainError(
      "CONSENT_REQUIRED",
      "A current, provider-specific application package consent is required.",
    );
  }
  if (
    input.permittedDataCategories.some((category) => !consent.dataCategories.includes(category))
  ) {
    throw new FundingDomainError(
      "CONSENT_INACTIVE",
      "The application package exceeds the consented data categories.",
    );
  }
  return input;
};

export const createFundingReferralDraft = (
  input: FundingReferral,
  consent: FundingConsent,
  now: string,
): FundingReferral => {
  if (
    !isConsentActive(consent, now) ||
    consent.id !== input.consentId ||
    consent.purpose !== "referral"
  ) {
    throw new FundingDomainError(
      "CONSENT_REQUIRED",
      "A current referral consent is required before a provider handoff.",
    );
  }
  return { ...input, status: "draft" };
};

export const createFundingApplicationDraft = (
  input: FundingApplication,
  applicationPackage: FundingApplicationPackage,
): FundingApplication => {
  if (
    applicationPackage.status !== "approved_for_referral" ||
    input.applicationPackageId !== applicationPackage.id
  ) {
    throw new FundingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      "Application packages require an approved human review before an application draft.",
    );
  }
  return { ...input, status: "draft" };
};

export const submitFundingApplication = (
  input: Readonly<{
    application: FundingApplication;
    providerEnabled: boolean;
    providerSupportsSubmission: boolean;
    humanApproved: boolean;
    consent: FundingConsent;
    now: string;
  }>,
): never => {
  if (!input.providerEnabled || !input.providerSupportsSubmission) {
    throw new FundingDomainError(
      "PROVIDER_DISABLED",
      "Funding application submission is disabled until an approved provider adapter is activated.",
    );
  }
  if (!input.humanApproved)
    throw new FundingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      "Funding application submission requires human approval.",
    );
  if (!isConsentActive(input.consent, input.now))
    throw new FundingDomainError("CONSENT_INACTIVE", "Funding application consent is not active.");
  throw new FundingDomainError(
    "PROVIDER_DISABLED",
    "No live funding provider is configured in this controlled foundation.",
  );
};

export const recordProviderDecision = (
  input: import("./contracts.ts").FundingDecision,
): import("./contracts.ts").FundingDecision => {
  if (
    input.decisionSource !== "provider" ||
    input.rawDecisionReference.length === 0 ||
    input.verifiedAt.length === 0
  ) {
    throw new FundingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "Funding decisions must be verified provider records, never inferred outcomes.",
    );
  }
  return input;
};

export const createFundingOffer = (input: FundingOffer): FundingOffer => {
  assertCents(input.offerAmount);
  assertCents(input.upfrontFees);
  assertCents(input.otherKnownDeductions);
  assertCents(input.paymentAmount);
  if (
    input.verifiedAt.length === 0 ||
    input.offerAmount.currency !== input.upfrontFees.currency ||
    input.offerAmount.currency !== input.otherKnownDeductions.currency
  ) {
    throw new FundingDomainError(
      "INVALID_OFFER",
      "Offers require verified current terms and a consistent currency.",
    );
  }
  return input;
};

export const calculateNetProceeds = (offer: FundingOffer): Money => ({
  amountCents: Math.max(
    0,
    offer.offerAmount.amountCents -
      offer.upfrontFees.amountCents -
      offer.otherKnownDeductions.amountCents,
  ),
  currency: offer.offerAmount.currency,
});

export const createOfferComparison = (
  input: FundingOfferComparison,
  offers: readonly FundingOffer[],
): FundingOfferComparison => {
  if (
    offers.length < 2 ||
    new Set(input.offerIds).size !== input.offerIds.length ||
    !offers.every(
      (offer) =>
        input.offerIds.includes(offer.id) &&
        offer.verifiedAt.length > 0 &&
        offer.status === "active",
    )
  ) {
    throw new FundingDomainError(
      "INVALID_OFFER",
      "Only two or more active, verified offers can be compared.",
    );
  }
  return input;
};

export const recordClientOfferSelection = (
  input: FundingClientSelection,
  offer: FundingOffer,
  now: string,
): FundingClientSelection => {
  if (
    input.decision === "selected" &&
    (offer.id !== input.selectedOfferId ||
      offer.status !== "active" ||
      (offer.offerExpiration !== null && offer.offerExpiration <= now))
  ) {
    throw new FundingDomainError(
      "INVALID_OFFER",
      "A client may select only an active, unexpired verified offer.",
    );
  }
  return input;
};

export const buildFundingMatchCandidate = (
  screening: FundingProductScreening,
  rankingReasons: readonly string[],
  riskFlags: readonly string[],
): FundingMatchCandidate => ({
  productVersionId: screening.productVersionId,
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
