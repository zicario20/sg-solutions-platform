import type {
  CreditSpecialistIdentityAssurance,
  CreditSpecialistSessionInput,
} from "./contracts.ts";

export const M053_CREDIT_SPECIALIST_AGENT_FLAGS = {
  providerCallsEnabled: false,
  creditReportIngestionEnabled: false,
  documentExtractionIngressEnabled: false,
  analysisExecutionEnabled: false,
  disputeCandidateDispatchEnabled: false,
  disputeSubmissionEnabled: false,
  monitoringIngressEnabled: false,
  tradelineActionsEnabled: false,
  specialistHandoffDispatchEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const CREDIT_SPECIALIST_CANONICAL_BOUNDARIES = [
  {
    module: "M027",
    responsibility: "Credit repair case lifecycle and controlled service execution.",
  },
  {
    module: "M028",
    responsibility: "Credit monitoring consent, provider status, and monitoring operations.",
  },
  {
    module: "M029",
    responsibility: "Tradeline operations and any authorized partner coordination.",
  },
  {
    module: "M041",
    responsibility: "Provider abstraction and provider activation governance.",
  },
  {
    module: "M060",
    responsibility: "Compliance review for sensitive credit-service actions.",
  },
  {
    module: "M074-M075",
    responsibility: "Approval policy and human approval records.",
  },
  {
    module: "M078",
    responsibility: "Consent evidence and revocation handling.",
  },
] as const;

export const CREDIT_SPECIALIST_PROHIBITED_ACTIONS = [
  "retrieve_credit_report_from_provider",
  "store_raw_credit_report_content",
  "verify_report_facts_automatically",
  "guarantee_score_change",
  "infer_financing_approval",
  "submit_credit_dispute",
  "send_external_dispute_message",
  "create_cpn_or_alternative_identity",
  "recommend_identity_fraud",
  "perform_monitoring_operation",
  "perform_tradeline_operation",
  "override_human_or_compliance_approval",
] as const;

const verifiedIdentityLevels = new Set<CreditSpecialistIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertCreditSpecialistAccess(input: CreditSpecialistSessionInput): void {
  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Credit specialist access requires verified identity.");
  }

  if (input.creditDataAuthorization !== "valid") {
    throw new Error("Credit specialist access requires current authorization.");
  }

  if (!input.ownershipAuthorized) {
    throw new Error("Credit specialist access requires authorized ownership.");
  }

  if (!input.purposeAuthorized) {
    throw new Error("Credit specialist access requires an authorized purpose.");
  }
}

export function isCreditSpecialistRuntimeEnabled(): false {
  return false;
}
