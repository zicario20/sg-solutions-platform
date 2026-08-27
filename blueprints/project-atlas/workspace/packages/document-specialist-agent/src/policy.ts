import type {
  DocumentSpecialistIdentityAssurance,
  DocumentSpecialistSessionInput,
} from "./contracts.ts";

export const M058_DOCUMENT_SPECIALIST_AGENT_FLAGS = {
  documentDownloadEnabled: false,
  documentStorageEnabled: false,
  ocrEnabled: false,
  parserEnabled: false,
  classificationExecutionEnabled: false,
  extractionExecutionEnabled: false,
  normalizationEnabled: false,
  reconciliationEnabled: false,
  duplicateResolutionEnabled: false,
  documentGenerationEnabled: false,
  signatureActionsEnabled: false,
  secureDeliveryEnabled: false,
  domainHandoffDispatchEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const DOCUMENT_SPECIALIST_CANONICAL_BOUNDARIES = [
  {
    module: "M011",
    responsibility: "Client-visible documents, uploads, access, versions, and secure delivery.",
  },
  {
    module: "M047",
    responsibility: "AI control-plane policy and agent governance.",
  },
  {
    module: "M053-M057",
    responsibility: "Specialist domain ownership for credit, tax, formation, funding, and home buying.",
  },
  {
    module: "M060",
    responsibility: "Compliance review and escalation.",
  },
  {
    module: "M063-M065",
    responsibility: "Knowledge/source ownership and canonical document processing.",
  },
  {
    module: "M066-M068",
    responsibility: "Document generation, electronic signature, and workflow execution.",
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

export const DOCUMENT_SPECIALIST_PROHIBITED_ACTIONS = [
  "download_or_store_raw_document",
  "execute_ocr_or_parser",
  "trust_document_or_confirm_classification",
  "convert_extracted_value_to_canonical_fact",
  "silently_deduplicate_or_overwrite_document",
  "bypass_quarantine_or_compliance_review",
  "generate_or_sign_document",
  "deliver_document_or_share_with_third_party",
  "dispatch_domain_handoff",
  "override_human_or_compliance_approval",
] as const;

const verifiedIdentityLevels = new Set<DocumentSpecialistIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertDocumentSpecialistAccess(input: DocumentSpecialistSessionInput): void {
  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Document-specialist access requires verified identity.");
  }
  if (input.documentDataAuthorization !== "valid") {
    throw new Error("Document-specialist access requires current authorization.");
  }
  if (!input.documentAccessAuthorized) {
    throw new Error("Document-specialist access requires document access authorization.");
  }
  if (!input.purposeAuthorized) {
    throw new Error("Document-specialist access requires an authorized purpose.");
  }
  if (!input.serviceEntitled) {
    throw new Error("Document-specialist access requires an active service entitlement.");
  }
}

export function isDocumentSpecialistRuntimeEnabled(): false {
  return false;
}
