export const AUDIT_MODULE = "M077" as const;

export const AUDIT_PERMISSIONS = [
  "audit.configuration.manage",
  "audit.event.append",
  "audit.schema.manage",
  "audit.integrity.review",
  "audit.export.request",
] as const;

export type AuditPermission = (typeof AUDIT_PERMISSIONS)[number];

export const AUDIT_RUNTIME = {
  durableAppend: false,
  externalIngestion: false,
  searchIndex: false,
  exportDelivery: false,
  chainVerification: false,
  retentionExecution: false,
} as const;

export type AuditActorType =
  | "human_user"
  | "client"
  | "service_account"
  | "system_process"
  | "ai_agent"
  | "background_worker"
  | "external_provider"
  | "unknown";

export type AuditOutcome = "requested" | "blocked" | "unknown";

export interface AuditActor {
  readonly type: AuditActorType;
  readonly reference: string;
}

export interface AuditResourceReference {
  readonly resourceType: string;
  readonly resourceReference: string;
}

export interface AuditEventCandidate {
  readonly module: typeof AUDIT_MODULE;
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly actor: AuditActor;
  readonly resources: readonly AuditResourceReference[];
  readonly outcome: AuditOutcome;
  readonly correlationId: string | null;
  readonly causationId: string | null;
  readonly persistenceState: "blocked_runtime_disabled";
  readonly appended: false;
  readonly businessTruthAsserted: false;
  readonly containsRawSecrets: false;
  readonly containsBroadPii: false;
  readonly containsPrivateReasoning: false;
}

export interface AuditEventCandidateInput {
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly actor: AuditActor;
  readonly resources: readonly AuditResourceReference[];
  readonly outcome?: AuditOutcome;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly includesRawSecret?: boolean;
  readonly includesBroadPii?: boolean;
  readonly includesPrivateReasoning?: boolean;
}

export interface AuditEventCorrectionCandidate {
  readonly correctionId: string;
  readonly originalEventId: string;
  readonly status: "draft";
  readonly appendsNewEventWhenActivated: true;
  readonly originalMutated: false;
}

export interface AuditIntegrityCheck {
  readonly checkId: string;
  readonly status: "not_run";
  readonly chainVerified: false;
}

export interface AuditExportRequest {
  readonly requestId: string;
  readonly status: "blocked_runtime_disabled";
  readonly delivered: false;
  readonly authorizationEvaluated: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: AuditPermission): void {
  if (!AUDIT_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported audit permission: ${permission}.`);
  }
}

export function createAuditEventCandidate(input: {
  readonly permission: AuditPermission;
  readonly event: AuditEventCandidateInput;
}): AuditEventCandidate {
  requirePermission(input.permission);
  requireIdentifier(input.event.eventId, "Audit event ID");
  requireIdentifier(input.event.eventType, "Audit event type");
  requireIdentifier(input.event.actor.reference, "Audit actor reference");
  if (!Number.isInteger(input.event.eventVersion) || input.event.eventVersion < 1) {
    throw new Error("Audit event version must be a positive integer.");
  }
  if (input.event.resources.length === 0) {
    throw new Error("Audit events require minimized resource references.");
  }
  if (input.event.includesRawSecret || input.event.includesBroadPii || input.event.includesPrivateReasoning) {
    throw new Error("Audit events cannot contain raw secrets, broad PII, or private reasoning.");
  }

  return {
    module: AUDIT_MODULE,
    eventId: input.event.eventId,
    eventType: input.event.eventType,
    eventVersion: input.event.eventVersion,
    actor: input.event.actor,
    resources: input.event.resources.map((resource) => ({ ...resource })),
    outcome: input.event.outcome ?? "requested",
    correlationId: input.event.correlationId ?? null,
    causationId: input.event.causationId ?? null,
    persistenceState: "blocked_runtime_disabled",
    appended: false,
    businessTruthAsserted: false,
    containsRawSecrets: false,
    containsBroadPii: false,
    containsPrivateReasoning: false,
  };
}

export function createAuditEventCorrectionCandidate(input: {
  readonly permission: AuditPermission;
  readonly correctionId: string;
  readonly original: AuditEventCandidate;
}): AuditEventCorrectionCandidate {
  requirePermission(input.permission);
  requireIdentifier(input.correctionId, "Audit correction ID");

  return {
    correctionId: input.correctionId,
    originalEventId: input.original.eventId,
    status: "draft",
    appendsNewEventWhenActivated: true,
    originalMutated: false,
  };
}

export function requestAuditIntegrityCheck(input: {
  readonly permission: AuditPermission;
  readonly checkId: string;
}): AuditIntegrityCheck {
  requirePermission(input.permission);
  requireIdentifier(input.checkId, "Audit integrity check ID");

  return { checkId: input.checkId, status: "not_run", chainVerified: false };
}

export function requestAuditExport(input: {
  readonly permission: AuditPermission;
  readonly requestId: string;
}): AuditExportRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Audit export request ID");

  return {
    requestId: input.requestId,
    status: "blocked_runtime_disabled",
    delivered: false,
    authorizationEvaluated: false,
  };
}
