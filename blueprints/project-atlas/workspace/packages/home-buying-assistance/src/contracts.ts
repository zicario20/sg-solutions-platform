/** M036: preparation and coordination only; lenders, programs and closing parties retain their decisions. */
export type Money = Readonly<{ amountCents: number; currency: string }>;
export type SourceReference = Readonly<{
  sourceType:
    | "client_intake"
    | "document"
    | "organization"
    | "bookkeeping"
    | "tax"
    | "provider"
    | "partner"
    | "official_program_source"
    | "manual_review";
  sourceId: string;
  observedAt: string;
  verificationStatus:
    | "unverified"
    | "client_declared"
    | "document_verified"
    | "system_verified"
    | "professional_reviewed"
    | "conflicted"
    | "stale"
    | "unknown";
  freshnessStatus: "current" | "aging" | "stale" | "unknown" | "not_applicable";
}>;

export type HomebuyerServiceType =
  | "homebuyer_readiness_assessment"
  | "purchase_preparation"
  | "program_preparation"
  | "financial_document_preparation"
  | "lender_matching"
  | "property_readiness"
  | "closing_readiness"
  | "homebuyer_referral"
  | "custom_homebuyer_service";
export type DeliveryModel =
  | "sg_education_preparation"
  | "sg_managed_with_partner"
  | "marketplace_referral"
  | "education_only"
  | "client_self_apply"
  | "future_direct_integration";
export type HomebuyerCaseStatus =
  | "draft"
  | "intake_pending"
  | "profile_review"
  | "documents_pending"
  | "financial_review"
  | "readiness_review"
  | "client_action_required"
  | "program_screening"
  | "lender_matching"
  | "referral_ready"
  | "referred"
  | "preapproval_in_progress"
  | "property_search"
  | "under_contract"
  | "closing_preparation"
  | "closed"
  | "paused"
  | "cancelled"
  | "completed"
  | "archived";
export type ReadinessStatus =
  | "ready"
  | "mostly_ready"
  | "needs_work"
  | "blocked"
  | "not_evaluated"
  | "not_applicable";

export type HomebuyerEngagement = Readonly<{
  id: string;
  clientId: string;
  serviceOrderId: string;
  serviceType: HomebuyerServiceType;
  deliveryModel: DeliveryModel;
  assignedSpecialistId: string | null;
  reviewerId: string | null;
  status: "active" | "paused" | "completed" | "cancelled";
  openedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;
export type HomebuyerCase = Readonly<{
  id: string;
  caseNumber: string;
  engagementId: string;
  clientId: string;
  homebuyerProfileId: string | null;
  status: HomebuyerCaseStatus;
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo: string | null;
  reviewerId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}>;
export type HouseholdMember = Readonly<{
  personId: string;
  role:
    | "primary_applicant"
    | "co_applicant"
    | "non_borrowing_household_member"
    | "dependent"
    | "other";
  includedInProgramHousehold: "program_specific" | "included" | "not_included" | "unknown";
  sources: readonly SourceReference[];
}>;
export type PurchaseGoal = Readonly<{
  purchasePurpose: "primary_residence" | "second_home" | "investment" | "unknown";
  occupancyIntent: "owner_occupied" | "not_owner_occupied" | "unknown";
  targetStates: readonly string[];
  targetCounties: readonly string[];
  propertyTypes: readonly (
    | "single_family"
    | "condo"
    | "townhome"
    | "manufactured"
    | "multi_unit"
    | "other"
  )[];
  units: number | null;
  priceRange: Readonly<{ minimum: Money | null; maximum: Money | null }>;
  timeline: "immediate" | "within_90_days" | "within_6_months" | "more_than_6_months" | "unknown";
}>;
export type HomebuyerProfile = Readonly<{
  id: string;
  homebuyerCaseId: string;
  profileVersion: number;
  household: readonly HouseholdMember[];
  currentHousingStatus: "renting" | "owning" | "living_with_family" | "temporary" | "unknown";
  currentHousingExpense: Money | null;
  homeownershipHistory: "first_time_context_pending" | "prior_homeownership" | "unknown";
  purchaseGoal: PurchaseGoal;
  sources: readonly SourceReference[];
  verificationStatus: SourceReference["verificationStatus"];
  createdAt: string;
  updatedAt: string;
}>;
export type HomebuyerReadinessDimension = Readonly<{
  code:
    | "identity"
    | "household"
    | "purchase_goal"
    | "income"
    | "assets"
    | "liabilities"
    | "credit_context"
    | "documents"
    | "program_requirements"
    | "property_readiness";
  status: ReadinessStatus;
  reason: string;
  sources: readonly SourceReference[];
  missingItems: readonly string[];
  recommendedActions: readonly string[];
}>;
export type HomebuyerReadinessAssessment = Readonly<{
  id: string;
  homebuyerCaseId: string;
  profileVersion: number;
  assessmentVersion: number;
  dimensions: readonly HomebuyerReadinessDimension[];
  overallBand:
    | "foundation_incomplete"
    | "planning"
    | "preparation_in_progress"
    | "ready_for_selected_program_screening"
    | "ready_for_lender_conversation"
    | "manual_review_required";
  blockers: readonly string[];
  sources: readonly SourceReference[];
  status: "draft" | "requires_review" | "reviewed";
  createdAt: string;
}>;
export type HomebuyerFinancialProfile = Readonly<{
  id: string;
  homebuyerCaseId: string;
  profileVersion: number;
  periodStart: string;
  periodEnd: string;
  grossMonthlyIncome: Money | null;
  verifiedAssets: Money | null;
  monthlyLiabilities: Money | null;
  employmentStatus: "documented" | "partial" | "unknown";
  incomeStatus: "documented" | "partial" | "unknown";
  assetsStatus: "documented" | "partial" | "unknown";
  liabilitiesStatus: "documented" | "partial" | "unknown";
  sources: readonly SourceReference[];
  verificationStatus: SourceReference["verificationStatus"];
  createdAt: string;
}>;
export type DtiCalculation = Readonly<{
  id: string;
  homebuyerCaseId: string;
  methodologyCode: "internal_education" | "program_specific" | "lender_specific";
  grossMonthlyIncome: Money;
  monthlyDebt: Money;
  estimatedHousingPayment: Money | null;
  frontEndDti: number | null;
  backEndDti: number | null;
  dataQuality: "sufficient" | "partial" | "insufficient";
  sources: readonly SourceReference[];
  createdAt: string;
}>;
export type AffordabilityScenario = Readonly<{
  id: string;
  homebuyerCaseId: string;
  scenarioVersion: number;
  purchasePrice: Money;
  downPayment: Money;
  estimatedRate: number | null;
  rateSource: SourceReference | null;
  loanTermMonths: number | null;
  estimatedPrincipalInterest: Money | null;
  estimatedTaxes: Money | null;
  estimatedInsurance: Money | null;
  estimatedHoa: Money | null;
  estimatedMortgageInsurance: Money | null;
  totalEstimatedHousingPayment: Money | null;
  status: "educational_estimate" | "needs_current_quote" | "not_calculable";
  createdAt: string;
}>;

export type HousingProgramFamily =
  | "conventional"
  | "fha"
  | "va"
  | "usda_guaranteed"
  | "usda_direct"
  | "state_hfa"
  | "county_city_assistance"
  | "down_payment_assistance"
  | "community_employer_assistance"
  | "other";
export type ProgramStatus = "draft" | "under_review" | "published" | "paused" | "retired" | "stale";
export type HousingProgram = Readonly<{
  id: string;
  code: string;
  family: HousingProgramFamily;
  jurisdiction: "national" | "state" | "county" | "city" | "custom";
  status: ProgramStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}>;
export type HousingProgramVersion = Readonly<{
  id: string;
  programId: string;
  version: number;
  publicName: string;
  availability: "available" | "limited" | "unavailable" | "stale" | "unknown";
  sources: readonly SourceReference[];
  verifiedAt: string | null;
  nextReviewAt: string | null;
  requiredDisclosures: readonly string[];
  status: ProgramStatus;
}>;
export type HousingProgramRule = Readonly<{
  id: string;
  programVersionId: string;
  code: string;
  factKey: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than_or_equal"
    | "less_than_or_equal"
    | "exists";
  expectedValue: string | number | boolean | readonly string[];
  strength: "hard" | "soft";
  publicExplanation: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sources: readonly SourceReference[];
  status: "active" | "inactive";
}>;
export type ProgramScreening = Readonly<{
  id: string;
  homebuyerCaseId: string;
  programVersionId: string;
  profileVersion: number;
  financialProfileVersion: number | null;
  status:
    | "potential_fit"
    | "needs_information"
    | "not_a_preliminary_fit"
    | "manual_review"
    | "not_available";
  matchedRules: readonly string[];
  unmetRules: readonly string[];
  unknownFacts: readonly string[];
  explanation: string;
  evaluatedAt: string;
}>;
export type HomebuyerMatchCandidate = Readonly<{
  programVersionId: string;
  screeningId: string;
  matchBand: "potential" | "possible_with_information" | "manual_review" | "not_matched";
  explanation: string;
  rankingReasons: readonly string[];
  riskFlags: readonly string[];
}>;
export type HomebuyerMatchingRun = Readonly<{
  id: string;
  homebuyerCaseId: string;
  profileVersion: number;
  financialProfileVersion: number | null;
  candidates: readonly HomebuyerMatchCandidate[];
  status: "draft" | "completed" | "stale" | "requires_review";
  createdAt: string;
}>;
export type HomebuyerConsent = Readonly<{
  id: string;
  homebuyerCaseId: string;
  partnerId: string | null;
  purpose:
    | "lender_referral"
    | "prequalification"
    | "document_sharing"
    | "credit_data"
    | "agent_referral";
  dataCategories: readonly string[];
  disclosureVersionIds: readonly string[];
  status: "pending" | "accepted" | "withdrawn" | "expired" | "superseded";
  acceptedAt: string | null;
  expiresAt: string | null;
  withdrawnAt: string | null;
}>;
export type LenderReferral = Readonly<{
  id: string;
  homebuyerCaseId: string;
  lenderId: string;
  programVersionId: string | null;
  consentId: string;
  trackingReference: string;
  status:
    | "draft"
    | "ready"
    | "sent"
    | "received"
    | "accepted"
    | "declined_by_lender"
    | "client_action_required"
    | "closed"
    | "failed";
  createdAt: string;
}>;
export type PreapprovalRecord = Readonly<{
  id: string;
  homebuyerCaseId: string;
  lenderId: string;
  externalReference: string;
  status: "received" | "active" | "expired" | "withdrawn" | "unknown";
  amount: Money | null;
  expiresAt: string | null;
  sourceDocumentId: string | null;
  verifiedAt: string;
}>;
export type PropertyCandidate = Readonly<{
  id: string;
  homebuyerCaseId: string;
  addressReference: string;
  listingReference: string | null;
  price: Money | null;
  status:
    | "saved"
    | "reviewing"
    | "not_eligible"
    | "potentially_eligible"
    | "under_contract"
    | "closed"
    | "removed";
  sources: readonly SourceReference[];
  createdAt: string;
}>;
export type PurchaseOffer = Readonly<{
  id: string;
  homebuyerCaseId: string;
  propertyCandidateId: string;
  offerAmount: Money;
  earnestMoney: Money | null;
  status:
    | "draft"
    | "client_prepared"
    | "submitted_externally"
    | "accepted_externally"
    | "declined_externally"
    | "withdrawn";
  externalReference: string | null;
  verifiedAt: string | null;
}>;
export type ClosingRecord = Readonly<{
  id: string;
  homebuyerCaseId: string;
  propertyCandidateId: string;
  closingStatus: "not_started" | "preparing" | "scheduled" | "completed" | "failed" | "unknown";
  closingDate: string | null;
  finalCashToClose: Money | null;
  sourceDocumentId: string | null;
  verifiedAt: string | null;
}>;
export type HomebuyerAuditEvent = Readonly<{
  id: string;
  homebuyerCaseId: string | null;
  action: string;
  actorType: "client" | "staff" | "lender" | "partner" | "system" | "ai";
  actorId: string | null;
  correlationId: string;
  occurredAt: string;
  safeMetadata: Readonly<Record<string, string | number | boolean | null>>;
}>;
