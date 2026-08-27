import type {
  BusinessFormationIdentityAssurance,
  BusinessFormationSessionInput,
} from "./contracts.ts";

export const M055_BUSINESS_FORMATION_AGENT_FLAGS = {
  providerCallsEnabled: false,
  formationDocumentIngestionEnabled: false,
  formationDataNormalizationEnabled: false,
  jurisdictionRuleEvaluationEnabled: false,
  entityComparisonEnabled: false,
  nameSearchEnabled: false,
  nameReservationEnabled: false,
  registeredAgentActionsEnabled: false,
  filingPackageAssemblyEnabled: false,
  signatureActionsEnabled: false,
  filingSubmissionEnabled: false,
  einActionsEnabled: false,
  bankingHandoffDispatchEnabled: false,
  complianceHandoffDispatchEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const BUSINESS_FORMATION_CANONICAL_BOUNDARIES = [
  {
    module: "M032",
    responsibility: "Canonical business-formation entities, filings, and lifecycle.",
  },
  {
    module: "M033",
    responsibility: "EIN workflow and business-document ownership.",
  },
  {
    module: "M034",
    responsibility: "Business compliance lifecycle.",
  },
  {
    module: "M041",
    responsibility: "State, filing, registered-agent, and provider abstraction.",
  },
  {
    module: "M042",
    responsibility: "Service catalog, requirements, and commercial configuration.",
  },
  {
    module: "M047",
    responsibility: "AI control-plane policy and agent governance.",
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
    responsibility: "Versioned state, legal, and regulatory source material.",
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

export const BUSINESS_FORMATION_PROHIBITED_ACTIONS = [
  "retrieve_state_portal_data",
  "store_raw_formation_document",
  "make_legal_or_tax_recommendation",
  "invent_state_requirement_or_fee",
  "confirm_name_availability",
  "reserve_business_name",
  "authorize_registered_agent",
  "prepare_or_sign_filing",
  "submit_state_filing",
  "request_or_issue_ein",
  "alter_state_or_provider_acceptance_record",
  "override_human_or_compliance_approval",
] as const;

const verifiedIdentityLevels = new Set<BusinessFormationIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertBusinessFormationAccess(input: BusinessFormationSessionInput): void {
  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Business formation access requires verified identity.");
  }

  if (input.formationDataAuthorization !== "valid") {
    throw new Error("Business formation access requires current authorization.");
  }

  if (!input.ownershipAuthorized) {
    throw new Error("Business formation access requires authorized ownership.");
  }

  if (!input.purposeAuthorized) {
    throw new Error("Business formation access requires an authorized purpose.");
  }

  if (!input.serviceEntitled) {
    throw new Error("Business formation access requires an active service entitlement.");
  }
}

export function isBusinessFormationRuntimeEnabled(): false {
  return false;
}
