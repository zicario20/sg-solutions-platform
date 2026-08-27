import type { HomeBuyingIdentityAssurance, HomeBuyingSessionInput } from "./contracts.ts";

export const M057_HOME_BUYING_ASSISTANCE_AGENT_FLAGS = {
  providerCallsEnabled: false,
  programRuleLookupEnabled: false,
  lenderOverlayLookupEnabled: false,
  geographicEligibilityLookupEnabled: false,
  propertyEligibilityLookupEnabled: false,
  automatedAffordabilityEnabled: false,
  creditRetrievalEnabled: false,
  documentIngestionEnabled: false,
  applicationPreparationEnabled: false,
  signatureActionsEnabled: false,
  providerHandoffEnabled: false,
  mortgageSubmissionEnabled: false,
  prequalificationStatusIngestionEnabled: false,
  preapprovalStatusIngestionEnabled: false,
  underwritingStatusIngestionEnabled: false,
  closingStatusIngestionEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const HOME_BUYING_CANONICAL_BOUNDARIES = [
  {
    module: "M036",
    responsibility: "Canonical home-buying cases, lifecycle, and client-safe projections.",
  },
  {
    module: "M037-M041",
    responsibility: "Marketplace, recommendations, partners, and provider abstraction.",
  },
  {
    module: "M047",
    responsibility: "AI control-plane policy and agent governance.",
  },
  {
    module: "M053-M056",
    responsibility: "Specialist credit, tax, formation, and funding context.",
  },
  {
    module: "M058",
    responsibility: "Secure document processing and evidence handling.",
  },
  {
    module: "M060",
    responsibility: "Compliance review and escalation.",
  },
  {
    module: "M064",
    responsibility: "Versioned official, provider, and program source material.",
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

export const HOME_BUYING_PROHIBITED_ACTIONS = [
  "retrieve_or_store_raw_home_buying_data",
  "infer_mortgage_eligibility",
  "determine_lender_underwriting",
  "confirm_program_eligibility",
  "confirm_prequalification_or_preapproval",
  "confirm_final_approval_or_clear_to_close",
  "give_real_estate_or_mortgage_broker_advice",
  "calculate_or_quote_provider_terms",
  "prepare_or_submit_mortgage_application",
  "collect_signature",
  "send_provider_handoff",
  "change_provider_or_property_status",
  "override_human_or_compliance_approval",
] as const;

const verifiedIdentityLevels = new Set<HomeBuyingIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertHomeBuyingAccess(input: HomeBuyingSessionInput): void {
  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Home-buying access requires verified identity.");
  }
  if (input.homeBuyingDataAuthorization !== "valid") {
    throw new Error("Home-buying access requires current authorization.");
  }
  if (!input.primaryApplicantAuthorized) {
    throw new Error("Home-buying access requires primary applicant authorization.");
  }
  if (
    input.coApplicantContextRequested &&
    input.coApplicantDataAuthorization !== "valid"
  ) {
    throw new Error("Co-applicant context requires separate current authorization.");
  }
  if (!input.purposeAuthorized) {
    throw new Error("Home-buying access requires an authorized purpose.");
  }
  if (!input.serviceEntitled) {
    throw new Error("Home-buying access requires an active service entitlement.");
  }
}

export function isHomeBuyingRuntimeEnabled(): false {
  return false;
}
