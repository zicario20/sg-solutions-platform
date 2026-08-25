import type { TaxFilingReadiness, TaxFilingReadinessInput } from "./contracts.ts";
export function evaluateTaxFilingReadiness(input: TaxFilingReadinessInput): TaxFilingReadiness {
  const blockers: string[] = [];
  if (!input.engagementAccepted) blockers.push("engagement_required");
  if (!input.identityVerified) blockers.push("identity_verification_required");
  if (!input.documentsComplete) blockers.push("document_completeness_required");
  if (!input.preparerReviewed) blockers.push("preparer_review_required");
  if (input.independentReviewRequired && !input.independentReviewCompleted)
    blockers.push("independent_review_required");
  if (!input.clientApproved) blockers.push("client_review_required");
  if (!input.signaturesComplete) blockers.push("signatures_required");
  if (!input.humanFilingReleaseGranted) blockers.push("human_filing_release_required");
  if (blockers.length > 0)
    return {
      state: "filing_release_pending",
      readyForProviderTransmission: false,
      blockers: Object.freeze(blockers),
    };
  if (!input.eFileProviderEnabled)
    return {
      state: "provider_disabled",
      readyForProviderTransmission: false,
      blockers: Object.freeze(["efile_provider_disabled"]),
    };
  return {
    state: "filing_release_pending",
    readyForProviderTransmission: false,
    blockers: Object.freeze(["provider_execution_not_implemented"]),
  };
}
