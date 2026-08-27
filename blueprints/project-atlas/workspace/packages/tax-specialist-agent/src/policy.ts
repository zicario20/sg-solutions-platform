import type { TaxSpecialistIdentityAssurance, TaxSpecialistSessionInput } from "./contracts.ts";

export const M054_TAX_SPECIALIST_AGENT_FLAGS = {
  providerCallsEnabled: false,
  taxDocumentIngestionEnabled: false,
  taxDataNormalizationEnabled: false,
  taxRuleEvaluationEnabled: false,
  calculationEnabled: false,
  returnAssemblyEnabled: false,
  signatureActionsEnabled: false,
  eFileEnabled: false,
  paymentActionsEnabled: false,
  refundActionsEnabled: false,
  noticeActionsEnabled: false,
  specialistHandoffDispatchEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const TAX_SPECIALIST_CANONICAL_BOUNDARIES = [
  {
    module: "M030",
    responsibility: "Canonical tax cases, returns, filings, and tax records.",
  },
  {
    module: "M031",
    responsibility: "Bookkeeping records and bookkeeping snapshots.",
  },
  {
    module: "M041",
    responsibility: "Tax, e-file, payment, document, and other provider abstraction.",
  },
  {
    module: "M047",
    responsibility: "AI control-plane policy and agent governance.",
  },
  {
    module: "M058",
    responsibility: "Document processing and secure document handling.",
  },
  {
    module: "M060",
    responsibility: "Tax compliance review and escalation.",
  },
  {
    module: "M064",
    responsibility: "Versioned legal, regulatory, and tax-rule sources.",
  },
  {
    module: "M066-M067",
    responsibility: "Document generation and signature workflows.",
  },
  {
    module: "M068",
    responsibility: "Canonical workflow execution.",
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

export const TAX_SPECIALIST_PROHIBITED_ACTIONS = [
  "retrieve_tax_document_from_provider",
  "store_raw_tax_document",
  "store_tax_identifier",
  "normalize_tax_data_automatically",
  "confirm_tax_fact_automatically",
  "select_filing_status",
  "determine_deduction_or_credit",
  "perform_authoritative_calculation",
  "prepare_or_sign_return",
  "submit_return_or_efile",
  "alter_provider_acceptance_record",
  "make_payment_or_issue_refund",
  "override_human_or_compliance_approval",
] as const;

const verifiedIdentityLevels = new Set<TaxSpecialistIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertTaxSpecialistAccess(input: TaxSpecialistSessionInput): void {
  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Tax specialist access requires verified identity.");
  }

  if (input.taxDataAuthorization !== "valid") {
    throw new Error("Tax specialist access requires current authorization.");
  }

  if (!input.ownershipAuthorized) {
    throw new Error("Tax specialist access requires authorized ownership.");
  }

  if (!input.purposeAuthorized) {
    throw new Error("Tax specialist access requires an authorized purpose.");
  }

  if (!input.serviceEntitled) {
    throw new Error("Tax specialist access requires an active service entitlement.");
  }
}

export function isTaxSpecialistRuntimeEnabled(): false {
  return false;
}
