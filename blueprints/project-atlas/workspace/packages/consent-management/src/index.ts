export const CONSENT_MANAGEMENT_MODULE = "M078" as const;

export const CONSENT_PERMISSIONS = [
  "consent.definition.create",
  "consent.version.create",
  "consent.presentation.record",
  "consent.decision.record",
  "consent.withdrawal.request",
  "consent.check.evaluate",
  "consent.governance.manage",
] as const;

export type ConsentPermission = (typeof CONSENT_PERMISSIONS)[number];

export const CONSENT_RUNTIME = {
  presentationDelivery: false,
  decisionCapture: false,
  effectiveGrantActivation: false,
  withdrawalPropagation: false,
  preActionGating: false,
  notificationDelivery: false,
  eventDispatch: false,
  retentionExecution: false,
} as const;

export type ConsentType =
  | "communication"
  | "data_sharing"
  | "ai_assistance"
  | "recording"
  | "electronic_delivery"
  | "service_specific"
  | "acknowledgment";

export type ConsentActorKind = "subject" | "authorized_representative" | "human_staff" | "ai" | "service" | "unknown";
export type ConsentDecisionType = "grant" | "decline" | "withdraw";

export interface ConsentDefinition {
  readonly module: typeof CONSENT_MANAGEMENT_MODULE;
  readonly code: string;
  readonly name: string;
  readonly type: ConsentType;
  readonly status: "draft";
  readonly active: false;
}

export interface ConsentDefinitionVersion {
  readonly definitionCode: string;
  readonly version: number;
  readonly presentationReference: string;
  readonly status: "draft";
  readonly immutable: true;
  readonly active: false;
}

export interface ConsentScope {
  readonly purposes: readonly string[];
  readonly dataCategoryReferences: readonly string[];
  readonly recipientReferences: readonly string[];
  readonly channelReferences: readonly string[];
  readonly effectiveForDataSharing: false;
}

export interface ConsentSubject {
  readonly subjectReference: string;
  readonly subjectType: "client" | "contact" | "organization" | "representative" | "unknown";
  readonly identityBindingVerified: false;
}

export interface ConsentPresentation {
  readonly presentationId: string;
  readonly definitionVersion: ConsentDefinitionVersion;
  readonly subject: ConsentSubject;
  readonly status: "not_presented_runtime_disabled";
  readonly presented: false;
  readonly evidenceCaptured: false;
}

export interface ConsentDecisionCandidate {
  readonly decisionId: string;
  readonly decisionType: ConsentDecisionType;
  readonly subject: ConsentSubject;
  readonly actorKind: Exclude<ConsentActorKind, "ai" | "service">;
  readonly status: "recording_blocked_runtime_disabled";
  readonly effective: false;
  readonly validConsentEstablished: false;
}

export interface ConsentGrant {
  readonly grantId: string;
  readonly decisionId: string;
  readonly status: "not_effective_runtime_disabled";
  readonly effective: false;
  readonly allowsDataSharing: false;
  readonly allowsPreAction: false;
}

export interface ConsentWithdrawal {
  readonly withdrawalId: string;
  readonly decisionId: string;
  readonly status: "blocked_runtime_disabled";
  readonly propagationCompleted: false;
  readonly downstreamActionsStopped: false;
}

export interface ConsentCheckResult {
  readonly subjectReference: string;
  readonly purposeReference: string;
  readonly status: "unknown";
  readonly allowed: false;
  readonly reason: "runtime_evaluation_disabled";
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: ConsentPermission): void {
  if (!CONSENT_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported consent permission: ${permission}.`);
  }
}

export function createConsentDefinition(input: {
  readonly permission: ConsentPermission;
  readonly code: string;
  readonly name: string;
  readonly type: ConsentType;
}): ConsentDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Consent definition code");
  requireIdentifier(input.name, "Consent definition name");

  return {
    module: CONSENT_MANAGEMENT_MODULE,
    code: input.code,
    name: input.name,
    type: input.type,
    status: "draft",
    active: false,
  };
}

export function createConsentDefinitionVersion(input: {
  readonly permission: ConsentPermission;
  readonly definition: ConsentDefinition;
  readonly version: number;
  readonly presentationReference: string;
}): ConsentDefinitionVersion {
  requirePermission(input.permission);
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error("Consent definition version must be a positive integer.");
  }
  requireIdentifier(input.presentationReference, "Consent presentation reference");

  return {
    definitionCode: input.definition.code,
    version: input.version,
    presentationReference: input.presentationReference,
    status: "draft",
    immutable: true,
    active: false,
  };
}

export function createConsentScope(input: {
  readonly purposes: readonly string[];
  readonly dataCategoryReferences?: readonly string[];
  readonly recipientReferences?: readonly string[];
  readonly channelReferences?: readonly string[];
}): ConsentScope {
  if (input.purposes.length === 0) {
    throw new Error("Consent scope requires at least one specific purpose.");
  }
  input.purposes.forEach((purpose) => requireIdentifier(purpose, "Consent purpose"));

  return {
    purposes: [...new Set(input.purposes)],
    dataCategoryReferences: [...new Set(input.dataCategoryReferences ?? [])],
    recipientReferences: [...new Set(input.recipientReferences ?? [])],
    channelReferences: [...new Set(input.channelReferences ?? [])],
    effectiveForDataSharing: false,
  };
}

export function createConsentSubject(input: {
  readonly subjectReference: string;
  readonly subjectType: ConsentSubject["subjectType"];
}): ConsentSubject {
  requireIdentifier(input.subjectReference, "Consent subject reference");

  return {
    subjectReference: input.subjectReference,
    subjectType: input.subjectType,
    identityBindingVerified: false,
  };
}

export function recordConsentPresentation(input: {
  readonly permission: ConsentPermission;
  readonly presentationId: string;
  readonly definitionVersion: ConsentDefinitionVersion;
  readonly subject: ConsentSubject;
}): ConsentPresentation {
  requirePermission(input.permission);
  requireIdentifier(input.presentationId, "Consent presentation ID");

  return {
    presentationId: input.presentationId,
    definitionVersion: input.definitionVersion,
    subject: input.subject,
    status: "not_presented_runtime_disabled",
    presented: false,
    evidenceCaptured: false,
  };
}

export function recordConsentDecision(input: {
  readonly permission: ConsentPermission;
  readonly decisionId: string;
  readonly decisionType: ConsentDecisionType;
  readonly subject: ConsentSubject;
  readonly actorKind: ConsentActorKind;
}): ConsentDecisionCandidate {
  requirePermission(input.permission);
  requireIdentifier(input.decisionId, "Consent decision ID");
  if (input.actorKind === "ai" || input.actorKind === "service") {
    throw new Error("AI and service actors cannot record consent on behalf of a subject.");
  }

  return {
    decisionId: input.decisionId,
    decisionType: input.decisionType,
    subject: input.subject,
    actorKind: input.actorKind,
    status: "recording_blocked_runtime_disabled",
    effective: false,
    validConsentEstablished: false,
  };
}

export function createConsentGrant(input: {
  readonly decision: ConsentDecisionCandidate;
  readonly grantId: string;
}): ConsentGrant {
  requireIdentifier(input.grantId, "Consent grant ID");
  if (input.decision.decisionType !== "grant") {
    throw new Error("Only a grant decision candidate may create a consent grant record.");
  }

  return {
    grantId: input.grantId,
    decisionId: input.decision.decisionId,
    status: "not_effective_runtime_disabled",
    effective: false,
    allowsDataSharing: false,
    allowsPreAction: false,
  };
}

export function requestConsentWithdrawal(input: {
  readonly permission: ConsentPermission;
  readonly withdrawalId: string;
  readonly decision: ConsentDecisionCandidate;
}): ConsentWithdrawal {
  requirePermission(input.permission);
  requireIdentifier(input.withdrawalId, "Consent withdrawal ID");

  return {
    withdrawalId: input.withdrawalId,
    decisionId: input.decision.decisionId,
    status: "blocked_runtime_disabled",
    propagationCompleted: false,
    downstreamActionsStopped: false,
  };
}

export function evaluateConsentCheck(input: {
  readonly permission: ConsentPermission;
  readonly subject: ConsentSubject;
  readonly purposeReference: string;
}): ConsentCheckResult {
  requirePermission(input.permission);
  requireIdentifier(input.purposeReference, "Consent check purpose reference");

  return {
    subjectReference: input.subject.subjectReference,
    purposeReference: input.purposeReference,
    status: "unknown",
    allowed: false,
    reason: "runtime_evaluation_disabled",
  };
}
