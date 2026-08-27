import type { BusinessFundingIdentityAssurance, BusinessFundingSessionInput } from "./contracts.ts";

export const M056_BUSINESS_FUNDING_AGENT_FLAGS = {
  providerCallsEnabled: false,
  financialDocumentIngestionEnabled: false,
  fundingDataNormalizationEnabled: false,
  providerRequirementEvaluationEnabled: false,
  productMatchingEnabled: false,
  underwritingEnabled: false,
  recommendationScoringEnabled: false,
  applicationPreparationEnabled: false,
  signatureActionsEnabled: false,
  applicationSubmissionEnabled: false,
  offerIngestionEnabled: false,
  fundsActionsEnabled: false,
  partnerHandoffDispatchEnabled: false,
  personalCreditRetrievalEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const BUSINESS_FUNDING_CANONICAL_BOUNDARIES = [
  {
    module: "M035",
    responsibility: "Canonical business-funding cases and funding lifecycle.",
  },
  {
    module: "M037-M040",
    responsibility: "Marketplace, recommendation, broker integration, and partner management.",
  },
  {
    module: "M041",
    responsibility: "Lender, provider, and referral-partner abstraction.",
  },
  {
    module: "M042",
    responsibility: "Service catalog and commercial requirements.",
  },
  {
    module: "M047",
    responsibility: "AI control-plane policy and agent governance.",
  },
  {
    module: "M053",
    responsibility: "Authorized credit-specialist context.",
  },
  {
    module: "M054-M055",
    responsibility: "Authorized tax and formation context.",
  },
  {
    module: "M058",
    responsibility: "Secure document processing.",
  },
  {
    module: "M060",
    responsibility: "Compliance review and escalation.",
  },
  {
    module: "M064",
    responsibility: "Versioned financial, provider, and regulatory source material.",
  },
  {
    module: "M066-M068",
    responsibility: "Documents, signatures, and workflow execution.",
  },
  {
    module: "M074-M075",
    responsibility: "Approval policy and human-in-the-loop records.",
  },
  {
    module: "M078",
    responsibility: "Consent evidence and revocation handling.",
  },
] as const;

export const BUSINESS_FUNDING_PROHIBITED_ACTIONS = [
  "retrieve_provider_or_credit_data",
  "store_raw_financial_document",
  "estimate_missing_revenue_or_cash_flow",
  "make_underwriting_decision",
  "confirm_eligibility_or_prequalification",
  "recommend_or_guarantee_offer",
  "represent_sg_solutions_as_lender",
  "prepare_or_sign_application",
  "submit_application_or_multiple_applications",
  "accept_or_disburse_funds",
  "share_data_without_separate_provider_authorization",
  "infer_personal_guarantor_or_credit_authorization",
  "override_human_or_compliance_approval",
] as const;

const verifiedIdentityLevels = new Set<BusinessFundingIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertBusinessFundingAccess(input: BusinessFundingSessionInput): void {
  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Business funding access requires verified identity.");
  }

  if (input.fundingDataAuthorization !== "valid") {
    throw new Error("Business funding access requires current authorization.");
  }

  if (!input.businessAuthorityAuthorized) {
    throw new Error("Business funding access requires authorized business authority.");
  }

  if (!input.purposeAuthorized) {
    throw new Error("Business funding access requires an authorized purpose.");
  }

  if (!input.serviceEntitled) {
    throw new Error("Business funding access requires an active service entitlement.");
  }

  if (input.personalGuarantorInScope && input.personalGuarantorAuthorization !== "valid") {
    throw new Error("Business funding access requires separate personal-guarantor authorization.");
  }

  if (input.personalCreditInScope && input.personalCreditAuthorization !== "valid") {
    throw new Error("Business funding access requires separate personal-credit authorization.");
  }

  if (input.personalCreditInScope && !input.personalCreditPurposeAuthorized) {
    throw new Error("Business funding access requires a separate personal-credit purpose.");
  }
}

export function isBusinessFundingRuntimeEnabled(): false {
  return false;
}
