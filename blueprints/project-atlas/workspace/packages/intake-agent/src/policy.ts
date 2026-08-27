import type {
  IntakeCollectionGateInput,
  IntakeCollectionGateResult,
  IntakeDataClassification,
  IntakeIdentityAssurance,
  IntakeSurface,
} from "./contracts.js";

export const M050_INTAKE_AGENT_FLAGS = {
  M050_INTAKE_AGENT_ENABLED: false,
  M050_INTAKE_AUTOSAVE_WRITES_ENABLED: false,
  M050_INTAKE_PROVIDER_CALLS_ENABLED: false,
  M050_INTAKE_DOCUMENT_REQUEST_DISPATCH_ENABLED: false,
  M050_INTAKE_CONSENT_REQUEST_DISPATCH_ENABLED: false,
  M050_INTAKE_HANDOFF_DISPATCH_ENABLED: false,
  M050_INTAKE_LEAD_MAPPING_WRITES_ENABLED: false,
  M050_INTAKE_ORDER_CASE_CANDIDATE_WRITES_ENABLED: false,
  M050_INTAKE_WORKFLOW_EVENT_DISPATCH_ENABLED: false,
  M050_INTAKE_AI_EXECUTION_ENABLED: false,
} as const;

export const M050_CANONICAL_BOUNDARIES = {
  agentControlPlane: "M47 Internal AI Hub",
  reception: "M49 Reception Agent",
  forms: "M22 Intake Forms",
  serviceBinding: "M42 Service Catalog",
  documents: "M11 Document Portal and M58 Document Specialist",
  consent: "M78 Consent Management",
  signatures: "M67 E-Signature",
  leads: "M20 CRM Leads",
  clients: "M18 Client Management",
  serviceOrders: "M21 Service Orders",
  caseFiles: "M22 Case Files",
  entitlements: "M45 Service Entitlements",
  payments: "M44 Payment Verification",
  workflows: "M68 Workflow Engine",
} as const;

export const M050_PROHIBITED_ACTIONS = [
  "infer_or_enter_participant_answers",
  "verify_user_assertions",
  "approve_eligibility_or_professional_outcomes",
  "create_authoritative_service_order_or_case",
  "grant_entitlements",
  "confirm_payments",
  "modify_pricing",
  "submit_external_applications_or_filings",
  "dispatch_handoffs_or_workflow_events",
  "share_partner_data_without_consent",
  "auto_waive_requirements",
  "store_private_chain_of_thought",
] as const;

const authenticatedSurfaces = new Set<IntakeSurface>([
  "client_portal",
  "admin_assisted",
  "agent_assisted",
  "backend_event",
]);

const highAssuranceLevels = new Set<IntakeIdentityAssurance>([
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

function requiresAuthenticatedSurface(classification: IntakeDataClassification): boolean {
  return (
    classification === "sensitive" ||
    classification === "highly_sensitive" ||
    classification === "restricted"
  );
}

export function resolveIntakeCollectionGate(
  input: IntakeCollectionGateInput,
): IntakeCollectionGateResult {
  if (input.dataClassification === "prohibited") {
    return {
      allowed: false,
      reasonCode: "prohibited_data_class",
      requiresSecureStorage: false,
    };
  }
  if (!input.purposeAuthorized) {
    return {
      allowed: false,
      reasonCode: "purpose_not_authorized",
      requiresSecureStorage: false,
    };
  }
  if (!input.participantAuthorized) {
    return {
      allowed: false,
      reasonCode: "participant_not_authorized",
      requiresSecureStorage: false,
    };
  }
  if (input.surface === "partner_assisted_future") {
    return {
      allowed: false,
      reasonCode: "partner_assisted_intake_not_enabled",
      requiresSecureStorage: false,
    };
  }
  if (
    requiresAuthenticatedSurface(input.dataClassification) &&
    !authenticatedSurfaces.has(input.surface)
  ) {
    return {
      allowed: false,
      reasonCode: "sensitive_data_requires_authenticated_surface",
      requiresSecureStorage: false,
    };
  }
  if (
    (input.dataClassification === "highly_sensitive" ||
      input.dataClassification === "restricted") &&
    !highAssuranceLevels.has(input.identityAssurance)
  ) {
    return {
      allowed: false,
      reasonCode: "identity_assurance_insufficient",
      requiresSecureStorage: true,
    };
  }
  if (
    input.dataClassification === "sensitive" &&
    (input.identityAssurance === "anonymous" ||
      input.identityAssurance === "contact_provided_unverified" ||
      input.identityAssurance === "unknown")
  ) {
    return {
      allowed: false,
      reasonCode: "identity_assurance_insufficient",
      requiresSecureStorage: true,
    };
  }
  return {
    allowed: true,
    reasonCode: "allowed",
    requiresSecureStorage: requiresAuthenticatedSurface(input.dataClassification),
  };
}

export function assertM050RuntimeDisabled(): void {
  if (Object.values(M050_INTAKE_AGENT_FLAGS).some((flag) => flag)) {
    throw new Error("M050 intake-agent execution flags must remain disabled.");
  }
}
