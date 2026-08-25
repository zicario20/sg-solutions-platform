/**
 * M035 is a preparation, education, comparison and referral domain. It is not
 * a lender, underwriting engine or external application executor.
 */

export type FundingServiceType =
  | "funding_readiness_assessment"
  | "business_funding_preparation"
  | "business_credit_readiness"
  | "loan_document_preparation"
  | "lender_matching"
  | "sba_preparation"
  | "microloan_preparation"
  | "line_of_credit_preparation"
  | "term_loan_preparation"
  | "equipment_financing_preparation"
  | "business_card_readiness"
  | "funding_referral"
  | "custom_funding_service";

export type FundingDeliveryModel =
  | "sg_advisory_preparation"
  | "sg_managed_with_partner"
  | "marketplace_referral"
  | "education_only"
  | "client_self_apply"
  | "future_direct_integration";

export type FundingCaseStatus =
  | "draft"
  | "intake_pending"
  | "profile_review"
  | "documents_pending"
  | "financial_review"
  | "readiness_review"
  | "client_action_required"
  | "product_matching"
  | "package_preparation"
  | "ready_for_referral"
  | "referred"
  | "application_in_progress"
  | "offers_available"
  | "decision_pending"
  | "funded"
  | "declined"
  | "paused"
  | "cancelled"
  | "completed"
  | "archived";

export type FundingReadinessStatus =
  | "ready"
  | "mostly_ready"
  | "needs_work"
  | "blocked"
  | "not_evaluated"
  | "not_applicable";

export type FundabilityBand =
  | "foundation_incomplete"
  | "early_stage"
  | "developing"
  | "application_ready_for_selected_products"
  | "stronger_profile"
  | "manual_review_required";

export type VerificationStatus =
  | "unverified"
  | "client_declared"
  | "document_verified"
  | "system_verified"
  | "professional_reviewed"
  | "conflicted"
  | "stale"
  | "unknown";

export type FreshnessStatus = "current" | "aging" | "stale" | "unknown" | "not_applicable";

export type Money = Readonly<{ amountCents: number; currency: string }>;

export type FundingSourceReference = Readonly<{
  sourceType:
    | "client_intake"
    | "organization"
    | "bookkeeping"
    | "tax"
    | "document"
    | "provider"
    | "partner"
    | "manual_review"
    | "approved_public_source";
  sourceId: string;
  observedAt: string;
  verificationStatus: VerificationStatus;
  freshnessStatus: FreshnessStatus;
}>;

export type FundingEngagement = Readonly<{
  id: string;
  clientId: string;
  organizationId: string;
  serviceOrderId: string;
  serviceType: FundingServiceType;
  deliveryModel: FundingDeliveryModel;
  assignedFundingSpecialistId: string | null;
  assignedReviewerId: string | null;
  status: "active" | "paused" | "completed" | "cancelled";
  openedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type FundingCase = Readonly<{
  id: string;
  caseNumber: string;
  engagementId: string;
  clientId: string;
  organizationId: string;
  fundingProfileId: string | null;
  requestedAmount: Money | null;
  fundingPurpose: string | null;
  status: FundingCaseStatus;
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo: string | null;
  reviewerId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}>;

export type FundingPurposeAllocation = Readonly<{
  purposeCode:
    | "working_capital"
    | "inventory"
    | "equipment"
    | "expansion"
    | "marketing"
    | "refinance"
    | "payroll"
    | "commercial_real_estate"
    | "vehicle"
    | "other";
  description: string;
  amount: Money;
  timing: "immediate" | "within_30_days" | "within_90_days" | "planned" | "unknown";
  vendorOrAssetReference: string | null;
  supportingDocumentIds: readonly string[];
  clientConfirmed: boolean;
}>;

export type FundingNeed = Readonly<{
  requestedAmount: Money;
  minimumUsefulAmount: Money | null;
  idealAmount: Money | null;
  maximumDesiredAmount: Money | null;
  timingNeed: "immediate" | "within_30_days" | "within_90_days" | "more_than_90_days" | "unknown";
  urgency: "low" | "normal" | "high" | "urgent";
  primaryPurpose: FundingPurposeAllocation;
  secondaryPurposes: readonly FundingPurposeAllocation[];
}>;

export type FundingProfile = Readonly<{
  id: string;
  fundingCaseId: string;
  organizationId: string;
  profileVersion: number;
  businessIdentity: "complete" | "incomplete" | "conflicted" | "needs_review";
  ownershipSummary: "complete" | "incomplete" | "conflicted" | "not_collected";
  businessAge: Readonly<{
    basisDate: string | null;
    asOfDate: string;
    monthsInBusiness: number | null;
  }>;
  industry: Readonly<{
    category: string;
    activity: string;
    naicsCode: string | null;
    riskContext:
      | "commonly_supported"
      | "product_dependent"
      | "restricted_by_some_providers"
      | "special_review"
      | "unknown";
  }>;
  businessLocations: readonly string[];
  fundingNeed: FundingNeed;
  bankingSummary: "documented" | "partial" | "missing" | "unknown";
  creditContext: "not_requested" | "consent_required" | "client_declared" | "reviewed" | "unknown";
  complianceSummary: "current" | "needs_review" | "issue_identified" | "unknown";
  sourceReferences: readonly FundingSourceReference[];
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type FundingReadinessDimension = Readonly<{
  dimensionCode:
    | "business_identity"
    | "ownership"
    | "time_in_business"
    | "industry"
    | "banking"
    | "revenue_documentation"
    | "financial_statements"
    | "debt_documentation"
    | "tax_documents"
    | "compliance"
    | "use_of_funds"
    | "credit_context";
  status: FundingReadinessStatus;
  reason: string;
  sourceReferences: readonly FundingSourceReference[];
  missingItems: readonly string[];
  recommendedActions: readonly string[];
}>;

export type FundabilityAssessment = Readonly<{
  id: string;
  organizationId: string;
  fundingCaseId: string;
  profileVersion: number;
  assessmentVersion: number;
  dimensions: readonly FundingReadinessDimension[];
  overallBand: FundabilityBand;
  blockingFactors: readonly string[];
  improvementOpportunities: readonly string[];
  sourceReferences: readonly FundingSourceReference[];
  reviewStatus: "draft" | "requires_review" | "reviewed";
  createdAt: string;
}>;

export type FundingFinding = Readonly<{
  id: string;
  fundingCaseId: string;
  findingType: string;
  severity: "information" | "low" | "medium" | "high" | "critical";
  description: string;
  affectedFields: readonly string[];
  sourceReferences: readonly FundingSourceReference[];
  blocking: boolean;
  status:
    | "open"
    | "under_review"
    | "client_action_required"
    | "resolved"
    | "accepted_with_documented_reason"
    | "not_applicable";
  assignedTo: string | null;
  createdAt: string;
  resolvedAt: string | null;
}>;

export type FundingClientAction = Readonly<{
  id: string;
  fundingCaseId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: "pending" | "submitted" | "under_review" | "completed" | "cancelled";
  sourceFindingId: string | null;
}>;

export type FundingPreferenceProfile = Readonly<{
  fundingCaseId: string;
  preferredAmount: Money | null;
  minimumAmount: Money | null;
  maximumAcceptablePayment: Money | null;
  preferredTermMonths: number | null;
  speedPriority: "lowest_cost" | "balanced" | "speed" | "flexibility";
  collateralPreference: "preferred" | "not_preferred" | "not_willing" | "unknown";
  personalGuaranteePreference: "willing" | "not_preferred" | "not_willing" | "unknown";
  excludedProductTypes: readonly FundingProductFamily[];
}>;

export type FinancialProfile = Readonly<{
  id: string;
  organizationId: string;
  fundingCaseId: string;
  profileVersion: number;
  periodStart: string;
  periodEnd: string;
  accountingBasis: "cash" | "accrual" | "unknown";
  currency: string;
  revenue: Money | null;
  expenses: Money | null;
  grossProfit: Money | null;
  operatingIncome: Money | null;
  netIncome: Money | null;
  cashFlowSummary: "documented" | "partial" | "missing" | "unknown";
  debtSummary: "documented" | "partial" | "missing" | "unknown";
  liquiditySummary: "documented" | "partial" | "missing" | "unknown";
  sourceReferences: readonly FundingSourceReference[];
  verificationStatus: VerificationStatus;
  createdAt: string;
}>;

export type RevenueRecord = Readonly<{
  periodStart: string;
  periodEnd: string;
  grossRevenue: Money;
  netRevenue: Money | null;
  source: FundingSourceReference;
}>;

export type DebtScheduleItem = Readonly<{
  id: string;
  creditorReference: string;
  debtType:
    | "term_loan"
    | "line_of_credit"
    | "credit_card"
    | "equipment"
    | "lease"
    | "merchant_advance"
    | "other";
  originalAmount: Money | null;
  currentBalance: Money | null;
  monthlyPayment: Money | null;
  maturityDate: string | null;
  verificationStatus: VerificationStatus;
  sourceReferences: readonly FundingSourceReference[];
}>;

export type DscrCalculation = Readonly<{
  id: string;
  fundingCaseId: string;
  methodologyCode:
    | "internal_standard"
    | "lender_specific"
    | "sba_related_when_current"
    | "custom_partner";
  periodStart: string;
  periodEnd: string;
  cashFlowAvailable: Money;
  debtService: Money;
  dscr: number | null;
  dataQuality: "sufficient" | "partial" | "insufficient";
  sourceReferences: readonly FundingSourceReference[];
  calculationVersion: number;
  reviewStatus: "draft" | "requires_review" | "reviewed";
  createdAt: string;
}>;

export type FinancialPackage = Readonly<{
  id: string;
  fundingCaseId: string;
  version: number;
  documentIds: readonly string[];
  profileVersions: Readonly<{ fundingProfileVersion: number; financialProfileVersion: number }>;
  verificationStatus: VerificationStatus;
  status: "draft" | "in_review" | "ready_for_selected_products" | "stale" | "archived";
  createdAt: string;
}>;

export type UnderwritingReadiness = Readonly<{
  id: string;
  fundingCaseId: string;
  financialPackageId: string;
  status:
    | "not_evaluated"
    | "needs_documents"
    | "needs_reconciliation"
    | "ready_for_preliminary_screening"
    | "professional_review_required";
  findings: readonly string[];
  sourceReferences: readonly FundingSourceReference[];
  reviewedAt: string | null;
}>;

export type FundingProductFamily =
  | "sba_related"
  | "microloan"
  | "line_of_credit"
  | "term_loan"
  | "equipment_financing"
  | "vehicle_financing"
  | "business_credit_card"
  | "revenue_based_financing"
  | "merchant_cash_advance"
  | "invoice_financing"
  | "factoring"
  | "purchase_order_financing"
  | "startup_financing"
  | "community_program"
  | "grant_or_non_debt"
  | "other";

export type FundingProductStatus =
  | "draft"
  | "under_review"
  | "published"
  | "paused"
  | "retired"
  | "stale";

export type FundingProduct = Readonly<{
  id: string;
  code: string;
  providerId: string | null;
  partnerId: string | null;
  family: FundingProductFamily;
  deliveryModel: FundingDeliveryModel;
  status: FundingProductStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type FundingProductVersion = Readonly<{
  id: string;
  productId: string;
  version: number;
  publicName: string;
  availability: "available" | "limited" | "unavailable" | "stale" | "unknown";
  amountRange: Readonly<{ minimum: Money | null; maximum: Money | null }>;
  termMonths: Readonly<{ minimum: number | null; maximum: number | null }>;
  repaymentFrequencies: readonly ("daily" | "weekly" | "biweekly" | "monthly" | "other")[];
  requiredDisclosures: readonly string[];
  sourceReferences: readonly FundingSourceReference[];
  verifiedAt: string | null;
  nextReviewAt: string | null;
  status: FundingProductStatus;
}>;

export type FundingEligibilityRule = Readonly<{
  id: string;
  productVersionId: string;
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
  ruleStrength: "hard" | "soft";
  publicExplanation: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReferences: readonly FundingSourceReference[];
  status: "active" | "inactive";
}>;

export type FundingScreeningStatus =
  | "potential_fit"
  | "needs_information"
  | "not_a_preliminary_fit"
  | "manual_review"
  | "not_available";

export type FundingProductScreening = Readonly<{
  id: string;
  fundingCaseId: string;
  productVersionId: string;
  profileVersion: number;
  financialProfileVersion: number | null;
  status: FundingScreeningStatus;
  matchedRules: readonly string[];
  unmetRules: readonly string[];
  unknownFacts: readonly string[];
  explanation: string;
  evaluatedAt: string;
}>;

export type FundingMatchCandidate = Readonly<{
  productVersionId: string;
  screeningId: string;
  matchBand: "potential" | "possible_with_information" | "manual_review" | "not_matched";
  explanation: string;
  rankingReasons: readonly string[];
  riskFlags: readonly string[];
}>;

export type FundingMatchingRun = Readonly<{
  id: string;
  fundingCaseId: string;
  profileVersion: number;
  financialProfileVersion: number | null;
  preferenceSnapshot: FundingPreferenceProfile | null;
  candidates: readonly FundingMatchCandidate[];
  status: "draft" | "completed" | "stale" | "requires_review";
  createdAt: string;
}>;

export type FundingConsent = Readonly<{
  id: string;
  fundingCaseId: string;
  providerId: string | null;
  partnerId: string | null;
  purpose:
    | "preliminary_screening"
    | "referral"
    | "application_package"
    | "credit_data"
    | "document_sharing";
  dataCategories: readonly string[];
  disclosureVersionIds: readonly string[];
  status: "pending" | "accepted" | "withdrawn" | "expired" | "superseded";
  acceptedAt: string | null;
  expiresAt: string | null;
  withdrawnAt: string | null;
}>;

export type FundingApplicationPackage = Readonly<{
  id: string;
  fundingCaseId: string;
  providerId: string;
  productVersionId: string;
  financialPackageId: string | null;
  consentId: string;
  documentIds: readonly string[];
  permittedDataCategories: readonly string[];
  profileVersion: number;
  status: "draft" | "ready_for_review" | "approved_for_referral" | "shared" | "withdrawn" | "stale";
  createdAt: string;
}>;

export type FundingReferral = Readonly<{
  id: string;
  fundingCaseId: string;
  providerId: string;
  partnerId: string | null;
  productVersionId: string;
  applicationPackageId: string;
  consentId: string;
  referralTrackingId: string;
  status:
    | "draft"
    | "ready"
    | "sent"
    | "received"
    | "accepted"
    | "declined_by_provider"
    | "client_action_required"
    | "converted_to_application"
    | "closed"
    | "failed";
  createdAt: string;
  acceptedAt: string | null;
}>;

export type FundingApplication = Readonly<{
  id: string;
  fundingCaseId: string;
  providerId: string;
  productVersionId: string;
  applicationPackageId: string;
  externalApplicationId: string | null;
  applicationChannel:
    | "provider_api"
    | "partner_api"
    | "secure_referral_link"
    | "embedded_application_future"
    | "manual_partner_portal"
    | "client_self_apply"
    | "staff_assisted";
  status:
    | "draft"
    | "ready_for_submission"
    | "submitted"
    | "provider_processing"
    | "more_information_needed"
    | "decision_received"
    | "withdrawn"
    | "unknown"
    | "failed";
  idempotencyKey: string;
  submittedAt: string | null;
  decisionAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type FundingDecision = Readonly<{
  id: string;
  applicationId: string;
  decisionType:
    | "approved"
    | "conditional_approval"
    | "declined"
    | "more_information_needed"
    | "withdrawn"
    | "expired"
    | "unknown";
  decisionSource: "provider" | "partner";
  rawDecisionReference: string;
  decisionDate: string;
  reasonCodes: readonly string[];
  verifiedAt: string;
}>;

export type FundingOffer = Readonly<{
  id: string;
  applicationId: string;
  providerId: string;
  productVersionId: string;
  offerAmount: Money;
  upfrontFees: Money;
  otherKnownDeductions: Money;
  paymentAmount: Money | null;
  paymentFrequency: "daily" | "weekly" | "biweekly" | "monthly" | "other" | null;
  termMonths: number | null;
  rateType: "apr" | "interest_rate" | "factor_rate" | "unknown";
  rate: number | null;
  aprWhenProvided: number | null;
  factorRateWhenApplicable: number | null;
  collateralRequirement: "required" | "not_required" | "unknown";
  personalGuaranteeRequirement: "required" | "not_required" | "unknown";
  prepaymentTerms: string | null;
  offerExpiration: string | null;
  sourceDocumentId: string | null;
  verifiedAt: string;
  status: "active" | "expired" | "withdrawn" | "selected" | "declined_by_client";
}>;

export type FundingOfferComparison = Readonly<{
  id: string;
  fundingCaseId: string;
  offerIds: readonly string[];
  normalizationVersion: number;
  comparisonDate: string;
  createdBy: string;
}>;

export type FundingClientSelection = Readonly<{
  id: string;
  fundingCaseId: string;
  selectedOfferId: string;
  decision: "selected" | "declined_all" | "needs_more_information";
  acknowledgmentVersion: string;
  selectedAt: string;
}>;

export type FundingConfirmation = Readonly<{
  id: string;
  fundingCaseId: string;
  applicationId: string;
  providerId: string;
  fundedAmount: Money;
  fundedAt: string;
  providerReference: string;
  verifiedAt: string;
}>;

export type FundingDisclosure = Readonly<{
  id: string;
  code: string;
  disclosureType:
    | "sg_role"
    | "not_a_lender"
    | "no_guarantee"
    | "partner_referral"
    | "compensation"
    | "data_sharing"
    | "credit_pull"
    | "pricing_estimate"
    | "high_cost_product"
    | "daily_or_weekly_payment"
    | "collateral"
    | "personal_guarantee";
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: "draft" | "active" | "retired";
}>;

export type FundingCommission = Readonly<{
  id: string;
  fundingCaseId: string;
  partnerId: string;
  providerId: string;
  referralId: string | null;
  applicationId: string | null;
  productVersionId: string;
  commissionType:
    | "flat_referral_fee"
    | "percentage_of_funded_amount"
    | "percentage_of_revenue"
    | "tiered"
    | "marketing_fee"
    | "other_contractual"
    | "none";
  expectedAmount: Money | null;
  earnedAmount: Money | null;
  paidAmount: Money | null;
  status: "estimated" | "eligible" | "earned" | "paid" | "reversed" | "unknown";
  createdAt: string;
}>;

export type FundingPostFundingPlan = Readonly<{
  id: string;
  fundingCaseId: string;
  fundingConfirmationId: string;
  paymentStartDate: string | null;
  expectedMaturityDate: string | null;
  reportingTasks: readonly string[];
  financialMonitoringTasks: readonly string[];
  renewalEligibilityDate: string | null;
  refinanceReviewDate: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  createdAt: string;
}>;

export type FundingAuditEvent = Readonly<{
  id: string;
  fundingCaseId: string | null;
  action: string;
  actorType: "client" | "staff" | "provider" | "partner" | "system" | "ai";
  actorId: string | null;
  correlationId: string;
  occurredAt: string;
  safeMetadata: Readonly<Record<string, string | number | boolean | null>>;
}>;
