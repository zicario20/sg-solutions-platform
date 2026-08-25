export type TradelineProductStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "paused"
  | "retired";
export type TradelineReferralState =
  | "interest_created"
  | "education_required"
  | "staff_review_required"
  | "consent_required"
  | "provider_disabled"
  | "referred"
  | "unknown"
  | "cancelled";
export interface TradelineProductSnapshot {
  code: string;
  version: string;
  status: TradelineProductStatus;
  providerCode: string;
  providerEnabled: boolean;
  disclosureAccepted: boolean;
  consentAccepted: boolean;
  noGuaranteeDisclosure: boolean;
}
export interface TradelineReferralDecision {
  state: TradelineReferralState;
  reason: string;
}
export interface ProviderPortalAccess {
  providerCode: string;
  providerTenantId: string;
  requestedTenantId: string;
  providerStatus: "disabled" | "active" | "suspended";
}
