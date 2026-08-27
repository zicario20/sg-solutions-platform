import type { AgentManifest } from "@atlas/ai-control-plane";
import { createSupervisorTaskEnvelope, type SupervisorTaskEnvelope } from "@atlas/supervisor-agent";

export const RECEPTION_PROHIBITED_TOOLS = [
  "approve_service_start",
  "apply_manual_discount",
  "book_appointment",
  "change_price",
  "confirm_payment",
  "create_lead",
  "execute_workflow",
  "grant_entitlement",
  "issue_payment_link",
  "issue_secure_link",
  "publish_service",
  "send_credit_dispute",
  "share_documents",
  "submit_filing",
  "submit_tax_return",
] as const;

export type ReceptionChannel =
  | "web_chat"
  | "whatsapp_public"
  | "voice_public"
  | "public_contact_form"
  | "public_service_page"
  | "public_help_center"
  | "campaign_entry";
export type ReceptionLocale = "es" | "en";
export type ReceptionAuthentication = "anonymous" | "authenticated_client" | "staff";
export type ReceptionStage =
  | "greeting"
  | "language_selection"
  | "intent_discovery"
  | "clarification"
  | "service_discovery"
  | "minimum_data_collection"
  | "lead_capture"
  | "appointment_offer"
  | "secure_link_offer"
  | "handoff_preparation"
  | "human_transfer"
  | "confirmation"
  | "follow_up_pending"
  | "completed"
  | "blocked";
export type ReceptionIntent =
  | "general_service_information"
  | "credit_service_information"
  | "tax_service_information"
  | "business_formation_information"
  | "business_funding_information"
  | "home_buying_information"
  | "marketplace_information"
  | "appointment_request"
  | "lead_or_evaluation_request"
  | "payment_or_quote_access"
  | "secure_document_access"
  | "authenticated_support"
  | "human_support"
  | "complaint_or_safety"
  | "unknown";
export type ReceptionRisk = "low" | "moderate" | "high";
export type ReceptionDisposition =
  | "public_knowledge_only"
  | "lead_capture_requested"
  | "intake_handoff_requested"
  | "appointment_handoff_requested"
  | "authenticated_support_required"
  | "human_transfer_required"
  | "secure_channel_required";
export type ReceptionHandoffTarget =
  | "intake_agent"
  | "scheduling"
  | "authenticated_support"
  | "supervisor"
  | "human";
export type ReceptionSecureLinkType =
  | "login"
  | "identity_verification"
  | "client_portal"
  | "intake"
  | "appointment"
  | "document_upload"
  | "payment"
  | "quote"
  | "help_article"
  | "consent"
  | "human_support";
export type ReceptionTool =
  | "retrieve_public_knowledge"
  | "prepare_lead_capture"
  | "prepare_intake_handoff"
  | "prepare_appointment_handoff"
  | "prepare_authenticated_support_handoff"
  | "prepare_human_transfer"
  | "prepare_secure_link_request"
  | "prepare_supervisor_handoff";
export type ReceptionToolRequestName = ReceptionTool | (typeof RECEPTION_PROHIBITED_TOOLS)[number];

export interface ReceptionAgentBinding {
  readonly manifestReference: string;
  readonly manifest?: AgentManifest;
  readonly status: "draft" | "approved_disabled" | "released_disabled" | "retired";
  readonly publicKnowledgeReferences: readonly string[];
  readonly policyReference: string;
}

export interface ReceptionSession {
  readonly id: string;
  readonly tenantReference: string;
  readonly channel: ReceptionChannel;
  readonly locale: ReceptionLocale;
  readonly authentication: ReceptionAuthentication;
  readonly publicSessionReference: string;
  readonly consentReference: string | null;
  readonly currentStage: ReceptionStage;
  readonly startedAt: string;
  readonly expiresAt: string;
}

export interface ReceptionInteractionRecord {
  readonly id: string;
  readonly sessionReference: string;
  readonly stage: ReceptionStage;
  readonly inputDigest: string;
  readonly intentReference: string;
  readonly sourceReferences: readonly string[];
  readonly createdAt: string;
}

export interface ReceptionIntentClassification {
  readonly intent: ReceptionIntent;
  readonly risk: ReceptionRisk;
  readonly disposition: ReceptionDisposition;
  readonly reasonCodes: readonly string[];
  readonly requiresAuthentication: boolean;
  readonly requiresHumanReview: boolean;
}

export interface ReceptionPolicy {
  readonly code: string;
  readonly publicKnowledgeAvailable: boolean;
  readonly intakeAgentAvailable: boolean;
  readonly schedulingAvailable: boolean;
  readonly authenticatedSupportAvailable: boolean;
  readonly supervisorAvailable: boolean;
}

export type ReceptionNextAction =
  | "public_knowledge_only"
  | "lead_capture_prepared"
  | "handoff_prepared"
  | "human_transfer_required"
  | "secure_channel_required";

export interface ReceptionRoutingDecision {
  readonly sessionId: string;
  readonly intent: ReceptionIntent;
  readonly nextAction: ReceptionNextAction;
  readonly target: ReceptionHandoffTarget | null;
  readonly reasonCodes: readonly string[];
  readonly executionPermitted: false;
  readonly createdAt: string;
}

export interface ReceptionLeadCaptureRequest {
  readonly id: string;
  readonly sessionReference: string;
  readonly idempotencyKey: string;
  readonly purpose: "evaluation_request" | "quote_request" | "contact_request";
  readonly contactFieldReferences: readonly string[];
  readonly consentReference: string;
  readonly status: "prepared";
  readonly executionPermitted: false;
  readonly createdAt: string;
}

export interface ReceptionSecureLinkRequest {
  readonly id: string;
  readonly sessionReference: string;
  readonly idempotencyKey: string;
  readonly linkType: ReceptionSecureLinkType;
  readonly requesterAuthenticated: boolean;
  readonly purpose: string;
  readonly destinationOwner:
    | "m003_public_chat"
    | "m011_documents"
    | "m013_appointments"
    | "m043_stripe_payments"
    | "m050_intake_agent"
    | "m052_client_support"
    | "m078_consents";
  readonly expiresAt: string;
  readonly status: "prepared";
  readonly executionPermitted: false;
  readonly createdAt: string;
}

export interface ReceptionHandoffPackage {
  readonly id: string;
  readonly sessionReference: string;
  readonly target: ReceptionHandoffTarget;
  readonly intent: ReceptionIntent;
  readonly locale: ReceptionLocale;
  readonly factReferences: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly expiresAt: string;
  readonly status: "prepared";
  readonly executionPermitted: false;
  readonly createdAt: string;
}

const PRIVATE_REASONING_PATTERN =
  /chain[-\s]?of[-\s]?thought|hidden reasoning|internal reasoning|private reasoning/iu;
const SENSITIVE_REFERENCE_PATTERN =
  /\b(?:ssn|social security|ein|bank(?:ing)?|card(?: number)?|credential|password|tax return)\b/iu;
const VERSION_REFERENCE_PATTERN =
  /^[a-z][a-z0-9_-]*:[a-zA-Z0-9._/-]+@(?:[1-9]\d*|v?[a-zA-Z0-9._-]+)$/u;
const IDEMPOTENCY_KEY_PATTERN = /^[a-z][a-z0-9:_-]*@(?:[1-9]\d*|v?[a-zA-Z0-9._-]+)$/u;

export function freezeReception<T>(value: T): T {
  return Object.freeze(structuredClone(value));
}

export function assertReceptionText(value: string, label: string, maximumLength = 240): void {
  if (value.trim().length === 0 || value.length > maximumLength)
    throw new TypeError(`${label} must be between 1 and ${maximumLength} characters`);
  if (PRIVATE_REASONING_PATTERN.test(value))
    throw new TypeError(`${label} must not contain private reasoning`);
}

export function assertReceptionReference(value: string, label: string): void {
  assertReceptionText(value, label);
  if (SENSITIVE_REFERENCE_PATTERN.test(value))
    throw new TypeError(`${label} must not identify sensitive content`);
}

export function assertReceptionVersionReference(value: string, label: string): void {
  assertReceptionReference(value, label);
  if (!VERSION_REFERENCE_PATTERN.test(value))
    throw new TypeError(`${label} must be an exact version reference`);
}

export function assertReceptionIdempotencyKey(value: string, label: string): void {
  assertReceptionReference(value, label);
  if (!IDEMPOTENCY_KEY_PATTERN.test(value))
    throw new TypeError(`${label} must be a versioned idempotency key`);
}

export function assertReceptionIso(value: string, label: string): void {
  assertReceptionText(value, label, 64);
  if (!value.endsWith("Z") || Number.isNaN(Date.parse(value)))
    throw new TypeError(`${label} must be an ISO timestamp`);
}

function assertNonEmptyReferences(values: readonly string[], label: string): void {
  if (values.length === 0) throw new TypeError(`${label} is required`);
  values.forEach((value) => {
    assertReceptionVersionReference(value, label);
  });
}

export function createReceptionAgentBinding(value: ReceptionAgentBinding): ReceptionAgentBinding {
  assertReceptionVersionReference(value.manifestReference, "reception manifest reference");
  assertReceptionVersionReference(value.policyReference, "reception policy reference");
  assertNonEmptyReferences(value.publicKnowledgeReferences, "reception public knowledge reference");
  return freezeReception(value);
}

export function createReceptionSession(
  value: Omit<ReceptionSession, "currentStage"> & {
    readonly currentStage?: ReceptionStage;
  },
): ReceptionSession {
  assertReceptionText(value.id, "reception session id", 160);
  assertReceptionReference(value.tenantReference, "reception tenant reference");
  assertReceptionReference(value.publicSessionReference, "reception public session reference");
  if (value.consentReference !== null)
    assertReceptionVersionReference(value.consentReference, "reception consent reference");
  assertReceptionIso(value.startedAt, "reception session startedAt");
  assertReceptionIso(value.expiresAt, "reception session expiresAt");
  if (Date.parse(value.expiresAt) <= Date.parse(value.startedAt))
    throw new TypeError("reception session expiry must be after start");
  return freezeReception({ ...value, currentStage: value.currentStage ?? "greeting" });
}

export function createReceptionInteractionRecord(
  value: ReceptionInteractionRecord,
): ReceptionInteractionRecord {
  assertReceptionText(value.id, "reception interaction id", 160);
  assertReceptionReference(value.sessionReference, "reception interaction session reference");
  if (!/^[a-f0-9]{64}$/u.test(value.inputDigest))
    throw new TypeError("reception interaction input digest must be SHA-256");
  assertReceptionVersionReference(value.intentReference, "reception interaction intent reference");
  assertNonEmptyReferences(value.sourceReferences, "reception interaction source reference");
  assertReceptionIso(value.createdAt, "reception interaction createdAt");
  return freezeReception(value);
}

export function createReceptionLeadCaptureRequest(
  value: Omit<ReceptionLeadCaptureRequest, "executionPermitted" | "status">,
): ReceptionLeadCaptureRequest {
  assertReceptionText(value.id, "reception lead request id", 160);
  assertReceptionReference(value.sessionReference, "reception lead session reference");
  assertReceptionIdempotencyKey(value.idempotencyKey, "reception lead idempotency key");
  assertNonEmptyReferences(value.contactFieldReferences, "reception contact field reference");
  assertReceptionVersionReference(value.consentReference, "reception contact consent reference");
  assertReceptionIso(value.createdAt, "reception lead createdAt");
  return freezeReception({
    ...value,
    status: "prepared" as const,
    executionPermitted: false as const,
  });
}

export function createReceptionSecureLinkRequest(
  value: Omit<ReceptionSecureLinkRequest, "executionPermitted" | "status">,
): ReceptionSecureLinkRequest {
  assertReceptionText(value.id, "reception secure link request id", 160);
  assertReceptionReference(value.sessionReference, "reception secure link session reference");
  assertReceptionIdempotencyKey(value.idempotencyKey, "reception secure link idempotency key");
  assertReceptionText(value.purpose, "reception secure link purpose", 160);
  assertReceptionIso(value.expiresAt, "reception secure link expiresAt");
  assertReceptionIso(value.createdAt, "reception secure link createdAt");
  if (Date.parse(value.expiresAt) <= Date.parse(value.createdAt))
    throw new TypeError("reception secure link expiry must be after creation");
  const privateTypes: readonly ReceptionSecureLinkType[] = [
    "identity_verification",
    "client_portal",
    "document_upload",
    "payment",
    "quote",
  ];
  if (privateTypes.includes(value.linkType) && !value.requesterAuthenticated)
    throw new TypeError("authentication is required for this secure link request");
  return freezeReception({
    ...value,
    status: "prepared" as const,
    executionPermitted: false as const,
  });
}

export function createReceptionHandoffPackage(
  value: Omit<ReceptionHandoffPackage, "executionPermitted" | "status">,
): ReceptionHandoffPackage {
  assertReceptionText(value.id, "reception handoff id", 160);
  assertReceptionReference(value.sessionReference, "reception handoff session reference");
  assertNonEmptyReferences(value.factReferences, "reception handoff fact reference");
  assertNonEmptyReferences(value.sourceReferences, "reception handoff source reference");
  assertReceptionIso(value.expiresAt, "reception handoff expiresAt");
  assertReceptionIso(value.createdAt, "reception handoff createdAt");
  if (Date.parse(value.expiresAt) <= Date.parse(value.createdAt))
    throw new TypeError("reception handoff expiry must be after creation");
  return freezeReception({
    ...value,
    status: "prepared" as const,
    executionPermitted: false as const,
  });
}

export function createReceptionSupervisorTask(value: {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly sessionReference: string;
  readonly tenantReference: string;
  readonly locale: ReceptionLocale;
  readonly intent: ReceptionIntent;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
}): SupervisorTaskEnvelope {
  assertReceptionText(value.id, "reception supervisor task id", 160);
  assertReceptionIdempotencyKey(value.idempotencyKey, "reception supervisor idempotency key");
  assertReceptionReference(value.sessionReference, "reception supervisor session reference");
  assertReceptionReference(value.tenantReference, "reception supervisor tenant reference");
  if (value.reasonCodes.length === 0)
    throw new TypeError("reception supervisor reason code is required");
  value.reasonCodes.forEach((reason) => {
    assertReceptionText(reason, "reception supervisor reason code", 96);
  });
  assertReceptionIso(value.createdAt, "reception supervisor createdAt");
  return createSupervisorTaskEnvelope({
    id: value.id,
    idempotencyKey: value.idempotencyKey,
    source: "public_intake",
    surface: "public_indirect",
    tenantReference: value.tenantReference,
    resourceReferences: [value.sessionReference],
    locale: value.locale,
    classification: {
      intents: [value.intent],
      domains: ["reception"],
      requestedOutcomes: ["human_review"],
      risk: "moderate",
      dataSensitivity: "public",
      urgency: "normal",
      complexity: "simple",
      ambiguity: "clarification_required",
    },
    authorization: {
      authenticated: false,
      resourceOwnershipVerified: false,
      consentReferences: [],
      entitlementReferences: [],
    },
    createdAt: value.createdAt,
  });
}
