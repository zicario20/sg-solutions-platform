export const PROFILE_PURPOSES = [
  "self_service",
  "credit_preparation",
  "tax_preparation",
  "home_buying_preparation",
  "business_formation",
  "business_funding",
] as const;
export type ProfilePurpose = (typeof PROFILE_PURPOSES)[number];
export type ProfileLocale = "es" | "en";
export type ProfileSensitivity =
  | "basic_personal"
  | "financial"
  | "tax"
  | "credit"
  | "identity"
  | "restricted";
export type ProfileSource =
  | "client"
  | "authorized_representative"
  | "employee"
  | "document"
  | "provider"
  | "imported"
  | "calculated"
  | "ai_extracted";
export type ProfileSupport = "unknown" | "self_reported" | "imported" | "document_supported";
export type ProfileVerification =
  | "not_verified"
  | "verified"
  | "unable_to_verify"
  | "verification_expired";
export type ProfileFreshness = "not_evaluated" | "current" | "outdated";
export type ProfileCorrectionState =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "partially_accepted";
export type ProfileActor = Readonly<{
  accountId: string;
  clientRef: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
  selfProfileGrant: boolean;
  consentGranted: boolean;
  allowedPurposes: readonly ProfilePurpose[];
}>;
export type ProfileRoot = Readonly<{
  profileRef: string;
  clientRef: string;
  ownerAccountId: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
  locale: ProfileLocale;
  revision: number;
}>;
export type ProfileQuality = Readonly<{
  source: ProfileSource;
  support: ProfileSupport;
  verification: ProfileVerification;
  freshness: ProfileFreshness;
  assertedAt: string;
  reviewedAt?: string;
}>;
export type BasicProfileSection = Readonly<{
  preferredName?: string;
  stateCode?: string;
  quality: ProfileQuality;
}>;
export type EmploymentProfile = Readonly<{
  employmentRef: string;
  category: "employed" | "self_employed" | "retired" | "student" | "other";
  quality: ProfileQuality;
}>;
export type IncomeProfile = Readonly<{
  incomeRef: string;
  cadence: "weekly" | "biweekly" | "semimonthly" | "monthly" | "annual";
  amountMinor?: number;
  currency?: string;
  quality: ProfileQuality;
}>;
export type BusinessProfile = Readonly<{
  businessRef: string;
  organizationRef: string;
  activity?: string;
  ownershipBasisPoints?: number;
  quality: ProfileQuality;
}>;
export type ProfileGoal = Readonly<{
  goalRef: string;
  purpose: ProfilePurpose;
  label: string;
  quality: ProfileQuality;
}>;
export type ProfileSnapshot = Readonly<{
  root: ProfileRoot;
  basic: BasicProfileSection;
  employment: readonly EmploymentProfile[];
  incomes: readonly IncomeProfile[];
  businesses: readonly BusinessProfile[];
  goals: readonly ProfileGoal[];
}>;
export type BasicClientProfileDto = Readonly<{
  profileRef: string;
  locale: ProfileLocale;
  preferredName?: string;
  stateCode?: string;
  revision: number;
  status: "empty" | "in_progress" | "review_required";
  updatedAt: string;
}>;
export type CreditProfileDto = Readonly<{
  profileRef: string;
  purpose: "credit_preparation";
  employmentCategories: readonly EmploymentProfile["category"][];
  goalLabels: readonly string[];
  status: "empty" | "ready_for_review";
}>;
export type TaxProfileDto = Readonly<{
  profileRef: string;
  purpose: "tax_preparation";
  employmentCategories: readonly EmploymentProfile["category"][];
  status: "empty" | "ready_for_review";
}>;
export type HomeBuyingProfileDto = Readonly<{
  profileRef: string;
  purpose: "home_buying_preparation";
  monthlyIncomeMinor?: number;
  currency?: string;
  status: "empty" | "preliminary";
}>;
export type BusinessFormationProfileDto = Readonly<{
  profileRef: string;
  purpose: "business_formation";
  businesses: readonly Readonly<{
    businessRef: string;
    organizationRef: string;
    activity?: string;
  }>[];
  status: "empty" | "ready_for_review";
}>;
export type BusinessFundingProfileDto = Readonly<{
  profileRef: string;
  purpose: "business_funding";
  businesses: readonly Readonly<{
    businessRef: string;
    organizationRef: string;
    activity?: string;
  }>[];
  monthlyIncomeMinor?: number;
  currency?: string;
  status: "empty" | "preliminary";
}>;
export type ProfileProjection =
  | BasicClientProfileDto
  | CreditProfileDto
  | TaxProfileDto
  | HomeBuyingProfileDto
  | BusinessFormationProfileDto
  | BusinessFundingProfileDto;
export type ProfileCorrection = Readonly<{
  correctionRef: string;
  profileRef: string;
  submittedBy: string;
  expectedRevision: number;
  state: ProfileCorrectionState;
  requested: Readonly<{ preferredName?: string; stateCode?: string }>;
  submittedAt: string;
}>;
export type PreliminaryDti =
  | Readonly<{
      kind: "available";
      ratioBasisPoints: number;
      formulaVersion: "m015.dti.v1";
      preliminary: true;
    }>
  | Readonly<{ kind: "unavailable"; reason: "missing_or_invalid_income"; preliminary: true }>;
export type ProfileRepository = Readonly<{
  find(clientRef: string): Promise<ProfileSnapshot | undefined>;
  saveCorrection(correction: ProfileCorrection): Promise<void>;
  listCorrections(profileRef: string): Promise<readonly ProfileCorrection[]>;
}>;
