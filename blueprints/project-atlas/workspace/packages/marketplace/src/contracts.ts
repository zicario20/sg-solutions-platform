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
