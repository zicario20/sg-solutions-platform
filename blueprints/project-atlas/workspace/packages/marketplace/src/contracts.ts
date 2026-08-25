export type MarketplacePartnerStatus =
  | "prospective"
  | "under_review"
  | "active"
  | "limited"
  | "paused"
  | "suspended"
  | "terminated"
  | "archived";
export type MarketplaceReferralStatus =
  | "interest_created"
  | "disclosure_pending"
  | "consent_pending"
  | "ready_to_refer"
  | "provider_disabled"
  | "redirected"
  | "unknown"
  | "cancelled"
  | "expired";
export type DataSharingMode =
  | "no_data_shared"
  | "client_redirect_only"
  | "basic_contact"
  | "prequalification_data"
  | "financial_summary"
  | "document_package";
export interface MarketplaceProductSnapshot {
  productCode: string;
  productVersion: string;
  partnerCode: string;
  partnerStatus: MarketplacePartnerStatus;
  publicVisible: boolean;
  disclosureRequired: boolean;
  consentRequired: boolean;
  dataSharingMode: DataSharingMode;
  allowedRedirectHosts: readonly string[];
}
export interface ReferralRequest {
  clientReference: string;
  sourceChannel: "website" | "client_portal" | "admin_portal" | "staff";
  disclosureAccepted: boolean;
  consentAccepted: boolean;
}
export interface MarketplaceReferralDraft {
  publicReference: string;
  productCode: string;
  productVersion: string;
  partnerCode: string;
  status: MarketplaceReferralStatus;
  dataSharingMode: DataSharingMode;
  providerStatus: "unknown";
}
export interface PartnerProviderCapabilities {
  supportsCatalogSync: boolean;
  supportsReferralCreation: boolean;
  supportsLeadSubmission: boolean;
  supportsStatusTracking: boolean;
  supportsCommissionTracking: boolean;
  supportsWebhooks: boolean;
  supportsDocuments: boolean;
}

export type MarketplaceSourceReference = Readonly<{
  sourceType:
    | "provider"
    | "partner_agreement"
    | "official"
    | "internal_review"
    | "client"
    | "system";
  sourceId: string;
  observedAt: string;
  freshness: "current" | "aging" | "stale" | "unknown";
  verification: "unverified" | "reviewed" | "provider_verified" | "official_verified" | "stale";
}>;

export type MarketplaceProviderLifecycleStatus =
  | "draft"
  | "under_review"
  | "approved_not_enabled"
  | "enabled"
  | "paused"
  | "suspended"
  | "retired"
  | "archived";
export type MarketplaceItemType =
  | "referral_offer"
  | "affiliate_link"
  | "informational_listing"
  | "education_resource"
  | "service_provider"
  | "future_embedded_offer";
export type MarketplaceListingStatus =
  | "draft"
  | "under_review"
  | "published"
  | "limited"
  | "paused"
  | "retired"
  | "archived";
export type MarketplaceAvailabilityStatus =
  | "available"
  | "limited"
  | "unavailable"
  | "provider_disabled"
  | "stale"
  | "unknown";
export type MarketplacePotentialFit =
  | "not_evaluated"
  | "potential_fit"
  | "needs_information"
  | "manual_review"
  | "not_available";
export type MarketplaceJourneyStatus =
  | "interest_created"
  | "disclosure_pending"
  | "consent_pending"
  | "ready_for_handoff"
  | "provider_disabled"
  | "redirected"
  | "submitted_externally"
  | "provider_processing"
  | "completed"
  | "unknown_external_outcome"
  | "cancelled"
  | "expired";
export type MarketplaceCommissionStatus =
  | "candidate"
  | "pending_verification"
  | "earned"
  | "paid"
  | "reversed"
  | "disputed"
  | "cancelled";

export type MarketplaceProviderProfile = Readonly<{
  id: string;
  organizationId: string;
  code: string;
  publicName: string;
  providerType: string;
  status: MarketplaceProviderLifecycleStatus;
  publicSupportUrl: string | null;
  allowedRedirectHosts: readonly string[];
  capabilities: PartnerProviderCapabilities;
  agreementReference: string | null;
  verificationDueAt: string | null;
  verifiedAt: string | null;
  sources: readonly MarketplaceSourceReference[];
  createdAt: string;
  updatedAt: string;
}>;

export type MarketplaceCategory = Readonly<{
  id: string;
  code: string;
  parentCategoryId: string | null;
  translations: Readonly<Record<"en" | "es", Readonly<{ name: string; description: string }>>>;
  status: "active" | "inactive" | "archived";
  sortOrder: number;
}>;

export type MarketplaceListing = Readonly<{
  id: string;
  code: string;
  providerId: string;
  categoryId: string;
  itemType: MarketplaceItemType;
  status: MarketplaceListingStatus;
  publicVisibility: "public" | "authenticated" | "client_only" | "internal";
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type MarketplaceListingVersion = Readonly<{
  id: string;
  listingId: string;
  version: number;
  translations: Readonly<
    Record<
      "en" | "es",
      Readonly<{
        name: string;
        summary: string;
        eligibilitySummary: string;
        pricingSummary: string;
        disclosureSummary: string;
        primaryCta: string;
      }>
    >
  >;
  disclosures: readonly string[];
  pricingStatus: "provider_quote_required" | "provider_published" | "not_applicable";
  availabilityStatus: MarketplaceAvailabilityStatus;
  sourceSnapshot: readonly MarketplaceSourceReference[];
  reviewedAt: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: "draft" | "approved" | "published" | "retired";
}>;

export type MarketplaceAvailability = Readonly<{
  listingVersionId: string;
  status: MarketplaceAvailabilityStatus;
  states: readonly string[];
  audiences: readonly string[];
  availableFrom: string | null;
  availableTo: string | null;
  sourceSnapshot: readonly MarketplaceSourceReference[];
  evaluatedAt: string;
}>;

export type MarketplaceConsent = Readonly<{
  id: string;
  clientId: string;
  providerId: string;
  listingVersionId: string;
  purpose: "personalization" | "referral" | "redirect" | "data_sharing";
  dataCategories: readonly string[];
  disclosureVersionIds: readonly string[];
  status: "pending" | "accepted" | "withdrawn" | "expired" | "superseded";
  acceptedAt: string | null;
  expiresAt: string | null;
  withdrawnAt: string | null;
}>;

export type MarketplaceEligibilityContext = Readonly<{
  id: string;
  clientId: string | null;
  purpose: "anonymous_browse" | "potential_fit" | "personalization" | "referral_readiness";
  facts: Readonly<Record<string, string | number | boolean | null>>;
  sources: readonly MarketplaceSourceReference[];
  consentId: string | null;
  createdAt: string;
  expiresAt: string | null;
}>;

export type MarketplaceMatch = Readonly<{
  id: string;
  listingVersionId: string;
  contextId: string;
  potentialFit: MarketplacePotentialFit;
  reasons: readonly string[];
  unknownFactors: readonly string[];
  rankingVersion: string;
  personalizationUsed: boolean;
  explanation: string;
  expiresAt: string | null;
}>;

export type MarketplaceComparison = Readonly<{
  id: string;
  clientId: string | null;
  listingVersionIds: readonly string[];
  fields: readonly Readonly<{
    code: string;
    values: readonly string[];
    provenance: string;
    comparable: boolean;
  }>[];
  createdAt: string;
}>;

export type MarketplaceJourney = Readonly<{
  id: string;
  idempotencyKey: string;
  clientId: string;
  providerId: string;
  listingVersionId: string;
  sourceChannel: "website" | "client_portal" | "admin_portal" | "staff";
  status: MarketplaceJourneyStatus;
  consentId: string | null;
  attribution: Readonly<{ source: string; campaign: string | null; advisorId: string | null }>;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}>;

export type MarketplaceConversion = Readonly<{
  id: string;
  journeyId: string;
  providerId: string;
  eventReference: string;
  eventType:
    | "referral_sent"
    | "provider_received"
    | "application_started"
    | "application_submitted"
    | "converted";
  verified: boolean;
  occurredAt: string;
  receivedAt: string;
}>;

export type MarketplaceCommission = Readonly<{
  id: string;
  providerId: string;
  journeyId: string;
  conversionId: string;
  contractReference: string;
  calculationRuleVersion: string;
  amountCents: number | null;
  currency: string;
  status: MarketplaceCommissionStatus;
  createdAt: string;
  earnedAt: string | null;
  reversedAt: string | null;
}>;

export type MarketplaceCommissionAdjustment = Readonly<{
  id: string;
  commissionId: string;
  reason: string;
  amountDeltaCents: number;
  createdAt: string;
}>;

export type MarketplacePartnerAction = Readonly<{
  id: string;
  providerId: string;
  journeyId: string;
  actorProviderId: string;
  action: "acknowledge" | "accept" | "decline" | "status_update";
  externalReference: string;
  occurredAt: string;
}>;

export type MarketplaceClientProjection = Readonly<{
  locale: "en" | "es";
  listings: readonly Readonly<{
    code: string;
    name: string;
    providerName: string;
    availability: MarketplaceAvailabilityStatus;
    ctaEnabled: boolean;
    notice: string | null;
  }>[];
  journeys: readonly Readonly<{
    reference: string;
    providerName: string;
    status: string;
    nextStep: string;
  }>[];
}>;
