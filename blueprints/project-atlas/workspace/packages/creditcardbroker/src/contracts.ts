export type CcbSource = Readonly<{
  id: string;
  sourceType:
    | "partner_rule"
    | "partner_export"
    | "api_snapshot"
    | "manual_verified_entry"
    | "statement";
  sourceUrl: string | null;
  contentHash: string;
  retrievedAt: string;
  verification: "unverified" | "reviewed" | "partner_verified" | "stale";
}>;
export type CcbRuleSnapshot = Readonly<{
  id: string;
  sourceUrl: string;
  sourceType: "partner_terms" | "program_rules" | "api_documentation" | "marketing_guidance";
  ruleVersion: string;
  retrievedAt: string;
  effectiveAt: string | null;
  contentHash: string;
  status: "draft" | "reviewed" | "superseded" | "expired";
  reviewedBy: string | null;
  reviewedAt: string | null;
}>;
export type CcbIntegrationMode = Readonly<{
  id: string;
  mode: "approved_javascript" | "api" | "hosted_landing_page" | "custom_marketing";
  authorizationStatus:
    | "not_requested"
    | "requested"
    | "approved"
    | "limited"
    | "suspended"
    | "revoked"
    | "expired"
    | "unknown";
  approvedDomains: readonly string[];
  approvedSurfaces: readonly string[];
  capabilities: readonly string[];
  sourceRuleSnapshotId: string;
  status: "configured" | "provider_disabled" | "retired";
}>;
export type CcbAdvertiser = Readonly<{
  id: string;
  networkProviderId: string;
  externalAdvertiserId: string | null;
  legalName: string;
  displayName: string;
  providerType: "issuer" | "lender" | "bank" | "financial_provider" | "other";
  status: "active" | "limited" | "paused" | "retired" | "unknown";
  source: CcbSource;
}>;
export type CcbOfferSource = Readonly<{
  id: string;
  externalOfferId: string;
  externalCategory: string | null;
  advertiserId: string;
  sourceMethod:
    | "api_snapshot"
    | "automated_feed_snapshot"
    | "approved_javascript_metadata"
    | "hosted_landing_page_metadata"
    | "manual_partner_export"
    | "manual_verified_entry";
  sourcePayloadReference: string;
  rawPayloadHash: string;
  sourceVersion: string;
  retrievedAt: string;
  status: "received" | "validated" | "rejected" | "superseded";
}>;
export type CcbOffer = Readonly<{
  id: string;
  externalOfferId: string;
  advertiserId: string;
  sourceId: string;
  sourceVersion: string;
  productFamily:
    | "consumer_credit_card"
    | "secured_credit_card"
    | "business_credit_card"
    | "personal_loan"
    | "auto_loan"
    | "mortgage_related"
    | "business_loan"
    | "credit_monitoring"
    | "credit_builder"
    | "rental_reporting"
    | "checking"
    | "savings"
    | "merchant_services"
    | "insurance"
    | "other_financial_product";
  status:
    | "draft"
    | "active"
    | "limited"
    | "paused"
    | "expired"
    | "retired"
    | "verification_required";
  freshnessStatus: "current" | "aging" | "stale" | "unknown";
  createdAt: string;
  updatedAt: string;
}>;
export type CcbContent = Readonly<{
  id: string;
  offerId: string;
  locale: "en" | "es";
  headline: string;
  bodyCopy: string;
  disclosureText: string;
  sourceId: string;
  sourceVersion: string;
  contentMode: "partner_supplied" | "human_verified_translation";
  status: "draft" | "reviewed" | "blocked" | "superseded";
}>;
export type CcbTerms = Readonly<{
  id: string;
  offerId: string;
  sourceId: string;
  sourceVersion: string;
  values: Readonly<Record<string, string | number | null>>;
  importantTermsUrl: string | null;
  retrievedAt: string;
  status: "current" | "stale" | "unknown";
}>;
export type CcbAffiliateLink = Readonly<{
  id: string;
  offerId: string;
  externalTrackingUrl: string;
  destinationHost: string;
  trackingParameterNames: readonly string[];
  sourceId: string;
  sourceVersion: string;
  status: "draft" | "verified" | "blocked" | "expired";
}>;
export type CcbMarketplaceMapping = Readonly<{
  id: string;
  offerId: string;
  marketplaceListingId: string;
  marketplaceListingVersionId: string;
  mappingVersion: number;
  status: "draft" | "reviewed" | "blocked";
  createdAt: string;
}>;
export type CcbJourney = Readonly<{
  id: string;
  marketplaceJourneyId: string;
  offerId: string;
  displayId: string;
  clientReference: string | null;
  consentId: string | null;
  status: "provider_disabled" | "unknown_external_outcome" | "closed";
  createdAt: string;
  updatedAt: string;
}>;
export type CcbDecision = Readonly<{
  id: string;
  journeyId: string;
  sourceId: string;
  status: "unknown" | "reported_approved" | "reported_declined" | "reported_pending";
  verification: "unverified" | "network_reported" | "partner_verified";
  receivedAt: string;
}>;
export type CcbConversionDefinition = Readonly<{
  id: string;
  code:
    | "click"
    | "application_started"
    | "application_submitted"
    | "approved"
    | "activated"
    | "funded"
    | "purchased";
  version: number;
  qualifyingEvidenceTypes: readonly (
    | "partner_event"
    | "signed_statement"
    | "human_verified_export"
  )[];
  status: "draft" | "active" | "retired";
  sourceId: string;
}>;
export type CcbConversion = Readonly<{
  id: string;
  journeyId: string;
  definitionId: string;
  externalEventReference: string;
  status: "reported" | "verified" | "unknown" | "reversed";
  evidenceType:
    | "partner_event"
    | "signed_statement"
    | "human_verified_export"
    | "client_report"
    | null;
  evidenceReference: string | null;
  receivedAt: string;
}>;
export type CcbCommissionRule = Readonly<{
  id: string;
  partnerAccountId: string;
  version: number;
  conversionDefinitionId: string;
  calculationType: "fixed" | "percentage" | "external_statement_only";
  amountCents: number | null;
  basisPoints: number | null;
  currency: "USD";
  status: "draft" | "reviewed" | "active" | "retired";
  sourceId: string;
}>;
export type CcbCommission = Readonly<{
  id: string;
  conversionId: string;
  ruleId: string;
  status: "candidate" | "expected" | "earned" | "paid" | "reversed" | "disputed";
  amountCents: number | null;
  currency: "USD";
  qualifyingEvidenceReference: string | null;
  createdAt: string;
  updatedAt: string;
}>;
export type CcbFinding = Readonly<{
  id: string;
  type:
    | "unapproved_content"
    | "unapproved_surface"
    | "stale_offer"
    | "terms_mismatch"
    | "invalid_affiliate_link"
    | "missing_disclosure"
    | "unauthorized_api_use"
    | "third_party_script_risk"
    | "unsupported_ai_claim"
    | "privacy_scope_issue";
  resourceType: string;
  resourceId: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "under_review" | "remediation" | "resolved";
  blocking: boolean;
  createdAt: string;
}>;
export type CcbAiDraft = Readonly<{
  id: string;
  offerId: string;
  sourceIds: readonly string[];
  claims: readonly Readonly<{ text: string; sourceId: string }>[];
  content: string;
  status: "requires_review";
  createdAt: string;
}>;
export class CreditCardBrokerDomainError extends Error {
  constructor(
    readonly code:
      | "PROVIDER_DISABLED"
      | "INVALID_SOURCE"
      | "INVALID_LINK"
      | "PII_IN_TRACKING"
      | "INVALID_STATE"
      | "UNSUPPORTED_CLAIM"
      | "DUPLICATE_EVENT"
      | "INVALID_COMMISSION",
    message: string,
  ) {
    super(message);
    this.name = "CreditCardBrokerDomainError";
  }
}
