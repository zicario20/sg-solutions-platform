export type TaxCaseState =
  | "draft"
  | "engagement_pending"
  | "intake_in_progress"
  | "documents_pending"
  | "preparation"
  | "review"
  | "client_review"
  | "signature_pending"
  | "filing_release_pending"
  | "provider_disabled"
  | "filed"
  | "closed"
  | "cancelled";
export interface TaxFilingReadinessInput {
  taxCaseId: string;
  engagementAccepted: boolean;
  identityVerified: boolean;
  documentsComplete: boolean;
  preparerReviewed: boolean;
  independentReviewRequired: boolean;
  independentReviewCompleted: boolean;
  clientApproved: boolean;
  signaturesComplete: boolean;
  humanFilingReleaseGranted: boolean;
  eFileProviderEnabled: boolean;
}
export interface TaxFilingReadiness {
  state: TaxCaseState;
  readyForProviderTransmission: boolean;
  blockers: readonly string[];
}
