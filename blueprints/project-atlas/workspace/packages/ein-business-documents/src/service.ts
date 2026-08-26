import { createHash } from "node:crypto";

import type {
  EinApplicationDraft,
  EinAuditEvent,
  EinCase,
  EinCaseStatus,
  EinClientAuthorization,
  EinDocumentIndexEntry,
  EinHandoffDestination,
  EinHandoffPlan,
  EinIssuanceRecord,
  EinProviderConfiguration,
  EinReadyToSubmitEvaluation,
  EinRequirement,
  EinRequirementSnapshot,
  EinRevealAuthorization,
  EinReviewFinding,
  EinSubmissionAttempt,
  EinSubmissionOutcome,
  EinSubmissionPreparation,
  ExistingEinGate,
  ExistingEinStatus,
  OrganizationIdentitySnapshot,
  ResponsiblePartyRecord,
} from "./contracts.ts";

const hashPattern = /^[a-f0-9]{64}$/u;
const idempotencyPattern = /^[A-Za-z0-9_.:-]{1,128}$/u;
const sensitiveAuditKey =
  /(?:full[_-]?ein|tax[_-]?identifier|ssn|credential|secret|document[_-]?content|address[_-]?line)/iu;

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const sha256 = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
const validInstant = (value: string) => Number.isFinite(Date.parse(value));

export function createEinCase(
  input: Omit<EinCase, "status" | "version" | "externalSubmissionAllowed">,
): EinCase {
  if (
    !input.caseId ||
    !input.caseNumber ||
    !input.clientRef ||
    !input.organizationRef ||
    !input.serviceOrderRef ||
    !validInstant(input.createdAt)
  )
    throw new Error("EIN_CASE_IDENTIFIERS_REQUIRED");
  if (input.deliveryModel === "education_only" || input.deliveryModel === "future_or_conditional")
    throw new Error("EIN_DELIVERY_MODEL_NOT_EXECUTABLE");
  return { ...input, status: "intake_pending", version: 1, externalSubmissionAllowed: false };
}

export function createOrganizationIdentitySnapshot(
  input: Omit<OrganizationIdentitySnapshot, "snapshotHash">,
): OrganizationIdentitySnapshot {
  if (
    !input.organizationRef ||
    !input.legalName ||
    !input.formationJurisdiction ||
    !validInstant(input.capturedAt)
  )
    throw new Error("EIN_ORGANIZATION_SNAPSHOT_INVALID");
  if (input.sourceRefs.length === 0 || input.sourceRefs.some((reference) => !reference))
    throw new Error("EIN_ORGANIZATION_SNAPSHOT_EVIDENCE_REQUIRED");
  return {
    ...input,
    sourceRefs: Object.freeze([...input.sourceRefs]),
    snapshotHash: sha256(input),
  };
}

export function validateResponsibleParty(input: ResponsiblePartyRecord): ResponsiblePartyRecord {
  if (!input.responsiblePartyRef || !input.personRef || !input.identifierSecureRef)
    throw new Error("EIN_RESPONSIBLE_PARTY_REFERENCE_REQUIRED");
  if (input.verificationStatus !== "verified") throw new Error("EIN_RESPONSIBLE_PARTY_UNVERIFIED");
  if (input.verifiedAt !== undefined && !validInstant(input.verifiedAt))
    throw new Error("EIN_RESPONSIBLE_PARTY_VERIFICATION_TIME_INVALID");
  return { ...input };
}

export function evaluateExistingEin(status: ExistingEinStatus): ExistingEinGate {
  if (status === "none") return { kind: "clear" };
  if (status === "verified") return { kind: "blocked", reason: "EXISTING_EIN_VERIFIED" };
  return {
    kind: "manual_review_required",
    reason: status === "suspected" ? "EXISTING_EIN_SUSPECTED" : "EIN_REPORTED",
  };
}

export function selectCurrentEinRequirements(input: {
  requirements: readonly EinRequirement[];
  at: string;
  einCaseRef: string;
}): EinRequirementSnapshot {
  if (!input.einCaseRef || !validInstant(input.at))
    throw new Error("EIN_REQUIREMENT_SCOPE_INVALID");
  const time = Date.parse(input.at);
  const requirements = input.requirements
    .filter(
      (requirement) =>
        requirement.verificationStatus === "verified" &&
        requirement.sourceReference.length > 0 &&
        validInstant(requirement.effectiveFrom) &&
        Date.parse(requirement.effectiveFrom) <= time &&
        (requirement.effectiveTo === undefined ||
          (validInstant(requirement.effectiveTo) && Date.parse(requirement.effectiveTo) > time)),
    )
    .sort((left, right) => left.requirementId.localeCompare(right.requirementId));
  if (requirements.length === 0) throw new Error("EIN_REQUIREMENTS_NOT_VERIFIED");
  return {
    einCaseRef: input.einCaseRef,
    requirementIds: Object.freeze(requirements.map((requirement) => requirement.requirementId)),
    capturedAt: input.at,
    snapshotHash: sha256({ einCaseRef: input.einCaseRef, at: input.at, requirements }),
  };
}

export function createEinApplicationDraft(input: {
  einCase: EinCase;
  formVersion: string;
  organizationSnapshot: OrganizationIdentitySnapshot;
  requirementSnapshot: EinRequirementSnapshot;
  responsibleParty: ResponsiblePartyRecord;
  nonSensitiveApplicationData: Readonly<Record<string, unknown>>;
  createdAt: string;
}): EinApplicationDraft {
  if (!input.formVersion || !validInstant(input.createdAt))
    throw new Error("EIN_APPLICATION_METADATA_INVALID");
  if (input.organizationSnapshot.organizationRef !== input.einCase.organizationRef)
    throw new Error("EIN_APPLICATION_ORGANIZATION_MISMATCH");
  if (input.requirementSnapshot.einCaseRef !== input.einCase.caseId)
    throw new Error("EIN_APPLICATION_REQUIREMENT_MISMATCH");
  validateResponsibleParty(input.responsibleParty);
  const applicationHash = sha256({
    einCaseRef: input.einCase.caseId,
    formVersion: input.formVersion,
    organizationSnapshotHash: input.organizationSnapshot.snapshotHash,
    requirementSnapshotHash: input.requirementSnapshot.snapshotHash,
    responsiblePartyRef: input.responsibleParty.responsiblePartyRef,
    nonSensitiveApplicationData: input.nonSensitiveApplicationData,
  });
  return {
    applicationId: `eapp_${applicationHash.slice(0, 32)}`,
    einCaseRef: input.einCase.caseId,
    formVersion: input.formVersion,
    organizationSnapshotHash: input.organizationSnapshot.snapshotHash,
    requirementSnapshotHash: input.requirementSnapshot.snapshotHash,
    responsiblePartyRef: input.responsibleParty.responsiblePartyRef,
    applicationHash,
    state: "draft",
    createdAt: input.createdAt,
  };
}

export function evaluateEinConsistency(input: {
  organizationSnapshot: OrganizationIdentitySnapshot;
  application: EinApplicationDraft;
  existingEin: ExistingEinStatus;
  requirementsCurrent: boolean;
}): readonly EinReviewFinding[] {
  const findings: EinReviewFinding[] = [];
  if (!input.organizationSnapshot.legalName || !input.organizationSnapshot.formationJurisdiction)
    findings.push({
      code: "MISSING_DATA",
      severity: "blocking",
      clientVisibleMessage: "We need more organization information.",
    });
  if (input.application.organizationSnapshotHash !== input.organizationSnapshot.snapshotHash)
    findings.push({
      code: "FORMATION_MISMATCH",
      severity: "blocking",
      clientVisibleMessage: "Your organization information needs review.",
    });
  if (!input.requirementsCurrent)
    findings.push({
      code: "STALE_REQUIREMENT",
      severity: "blocking",
      clientVisibleMessage: "Current requirements need review.",
    });
  if (input.existingEin !== "none")
    findings.push({
      code: "EXISTING_EIN_RISK",
      severity: input.existingEin === "verified" ? "blocking" : "warning",
      clientVisibleMessage: "We need to review whether the organization already has an EIN.",
    });
  return Object.freeze(findings);
}

export function evaluateEinReadyToSubmit(input: {
  einCase: EinCase;
  application: EinApplicationDraft;
  authorization?: EinClientAuthorization;
  responsibleParty: ResponsiblePartyRecord;
  existingEin: ExistingEinStatus;
  requirementsCurrent: boolean;
  reviewFindings: readonly EinReviewFinding[];
  operationalApproval: boolean;
  provider: EinProviderConfiguration;
}): EinReadyToSubmitEvaluation {
  if (
    input.einCase.status !== "authorization_pending" &&
    input.einCase.status !== "ready_to_submit"
  )
    return { allowed: false, reason: "INVALID_STATE" };
  if (evaluateExistingEin(input.existingEin).kind !== "clear")
    return { allowed: false, reason: "EXISTING_EIN_BLOCK" };
  if (input.responsibleParty.verificationStatus !== "verified")
    return { allowed: false, reason: "RESPONSIBLE_PARTY_UNVERIFIED" };
  if (!input.requirementsCurrent) return { allowed: false, reason: "REQUIREMENT_SNAPSHOT_STALE" };
  if (input.reviewFindings.some((finding) => finding.severity === "blocking"))
    return { allowed: false, reason: "APPLICATION_REVIEW_REQUIRED" };
  if (
    input.authorization?.status !== "valid" ||
    input.authorization.applicationHash !== input.application.applicationHash
  )
    return { allowed: false, reason: "CLIENT_AUTHORIZATION_REQUIRED" };
  if (!input.operationalApproval)
    return { allowed: false, reason: "OPERATIONAL_APPROVAL_REQUIRED" };
  if (
    input.provider.killSwitchEnabled ||
    input.provider.status !== "enabled" ||
    !input.provider.supportsSubmission
  )
    return { allowed: false, reason: "PROVIDER_UNAVAILABLE" };
  return { allowed: true };
}

export function prepareEinSubmission(input: {
  readiness: EinReadyToSubmitEvaluation;
  einCase: EinCase;
  application: EinApplicationDraft;
  authorization: EinClientAuthorization;
  provider: EinProviderConfiguration;
  idempotencyKey: string;
  existingAttempts: readonly EinSubmissionAttempt[];
}): EinSubmissionPreparation {
  if (input.existingAttempts.some((attempt) => attempt.status === "unknown_outcome"))
    return { kind: "blocked", reason: "UNKNOWN_OUTCOME_REQUIRES_REVIEW" };
  if (!input.readiness.allowed) return { kind: "blocked", reason: "NOT_READY_TO_SUBMIT" };
  if (input.authorization.applicationHash !== input.application.applicationHash)
    return { kind: "blocked", reason: "AUTHORIZATION_MISMATCH" };
  if (!idempotencyPattern.test(input.idempotencyKey))
    throw new Error("EIN_IDEMPOTENCY_KEY_INVALID");
  if (input.provider.killSwitchEnabled || input.provider.status === "disabled")
    return { kind: "blocked", reason: "PROVIDER_DISABLED" };
  if (input.provider.status !== "enabled" || !input.provider.supportsSubmission)
    return { kind: "blocked", reason: "SUBMISSION_CHANNEL_UNAVAILABLE" };
  return {
    kind: "prepared",
    attempt: {
      attemptId: `eins_${sha256({ einCaseRef: input.einCase.caseId, idempotencyKey: input.idempotencyKey }).slice(0, 32)}`,
      einCaseRef: input.einCase.caseId,
      applicationHash: input.application.applicationHash,
      idempotencyKey: input.idempotencyKey,
      providerCode: input.provider.providerCode,
      status: "prepared",
      immutable: true,
    },
  };
}

export function recordEinSubmissionOutcome(input: EinSubmissionOutcome): EinSubmissionOutcome {
  if (!input.attemptId || !validInstant(input.occurredAt))
    throw new Error("EIN_SUBMISSION_OUTCOME_INVALID");
  if (input.kind === "issued" && (!input.officialReference || !input.evidenceDocumentRef))
    throw new Error("EIN_ISSUANCE_EVIDENCE_REQUIRED");
  if (input.kind === "rejected" && !input.reason) throw new Error("EIN_REJECTION_REASON_REQUIRED");
  return { ...input };
}

export function createEinResubmission(input: {
  previousAttempt: EinSubmissionAttempt;
  correctedApplicationHash: string;
  idempotencyKey: string;
}): EinSubmissionAttempt {
  if (input.previousAttempt.status !== "rejected") throw new Error("EIN_RESUBMISSION_NOT_ALLOWED");
  if (
    !hashPattern.test(input.correctedApplicationHash) ||
    !idempotencyPattern.test(input.idempotencyKey)
  )
    throw new Error("EIN_RESUBMISSION_INVALID");
  if (input.idempotencyKey === input.previousAttempt.idempotencyKey)
    throw new Error("EIN_RESUBMISSION_IDEMPOTENCY_REUSED");
  return {
    attemptId: `eins_${sha256({ previousAttempt: input.previousAttempt.attemptId, idempotencyKey: input.idempotencyKey }).slice(0, 32)}`,
    einCaseRef: input.previousAttempt.einCaseRef,
    applicationHash: input.correctedApplicationHash,
    idempotencyKey: input.idempotencyKey,
    providerCode: input.previousAttempt.providerCode,
    status: "prepared",
    immutable: true,
  };
}

export function createEinIssuanceRecord(input: {
  einCaseRef: string;
  outcome: EinSubmissionOutcome;
  fullEinSecureRef: string;
}): EinIssuanceRecord {
  if (
    input.outcome.kind !== "issued" ||
    !input.outcome.evidenceDocumentRef ||
    !input.fullEinSecureRef
  )
    throw new Error("EIN_ISSUANCE_NOT_VERIFIABLE");
  return {
    issuanceId: `eiss_${sha256({ einCaseRef: input.einCaseRef, outcome: input.outcome }).slice(0, 32)}`,
    einCaseRef: input.einCaseRef,
    issuanceEvidenceDocumentRef: input.outcome.evidenceDocumentRef,
    fullEinSecureRef: input.fullEinSecureRef,
    verificationStatus: "verified",
    issuedAt: input.outcome.occurredAt,
    immutable: true,
  };
}

export function authorizeFullEinReveal(input: {
  issuance: EinIssuanceRecord;
  actorCanReveal: boolean;
  purpose: string;
  reauthenticated: boolean;
  now: string;
  ttlSeconds: number;
}): EinRevealAuthorization {
  if (
    !input.actorCanReveal ||
    !input.purpose ||
    !input.reauthenticated ||
    !validInstant(input.now) ||
    input.ttlSeconds < 1
  )
    throw new Error("EIN_REVEAL_NOT_AUTHORIZED");
  return {
    kind: "authorized",
    issuanceRef: input.issuance.issuanceId,
    fullEinSecureRef: input.issuance.fullEinSecureRef,
    expiresAt: new Date(Date.parse(input.now) + input.ttlSeconds * 1000).toISOString(),
    auditRequired: true,
  };
}

export function indexEinDocument(
  input: Omit<EinDocumentIndexEntry, "immutable">,
): EinDocumentIndexEntry {
  if (!input.documentRef || !input.einCaseRef || !hashPattern.test(input.contentHash))
    throw new Error("EIN_DOCUMENT_INDEX_INVALID");
  return { ...input, immutable: input.documentType === "official_confirmation" };
}

export function planEinHandoffs(input: {
  einCase: EinCase;
  issuance: EinIssuanceRecord;
  destinations: readonly EinHandoffDestination[];
}): readonly EinHandoffPlan[] {
  if (input.einCase.organizationRef === "" || input.destinations.length === 0)
    throw new Error("EIN_HANDOFF_INVALID");
  if (new Set(input.destinations).size !== input.destinations.length)
    throw new Error("EIN_HANDOFF_DUPLICATE_DESTINATION");
  return Object.freeze(
    input.destinations.map((destination) => {
      const idempotencyKey = `ein:${input.issuance.issuanceId}:${destination}:v1`;
      const payloadHash = sha256({
        organizationRef: input.einCase.organizationRef,
        issuanceRef: input.issuance.issuanceId,
        destination,
        verified: input.issuance.verificationStatus === "verified",
      });
      return {
        handoffId: `eh_${sha256({ idempotencyKey }).slice(0, 32)}`,
        sourceCaseRef: input.einCase.caseId,
        destination,
        organizationRef: input.einCase.organizationRef,
        issuanceRef: input.issuance.issuanceId,
        payloadVersion: "v1" as const,
        payloadHash,
        idempotencyKey,
        status: "ready" as const,
        containsFullEin: false as const,
        canExecuteExternally: false as const,
      };
    }),
  );
}

export function createSafeEinAuditEvent(input: {
  eventType: string;
  actorRef: string;
  resourceRef: string;
  purpose: string;
  correlationId: string;
  candidatePayload?: Readonly<Record<string, unknown>>;
}): EinAuditEvent {
  if (
    !input.eventType ||
    !input.actorRef ||
    !input.resourceRef ||
    !input.purpose ||
    !input.correlationId
  )
    throw new Error("EIN_AUDIT_REQUIRED_FIELDS_MISSING");
  if (
    input.candidatePayload &&
    Object.keys(input.candidatePayload).some((key) => sensitiveAuditKey.test(key))
  )
    throw new Error("EIN_AUDIT_SENSITIVE_PAYLOAD_PROHIBITED");
  return {
    eventType: input.eventType,
    actorRef: input.actorRef,
    resourceRef: input.resourceRef,
    purpose: input.purpose,
    correlationId: input.correlationId,
    sensitivePayloadIncluded: false,
  };
}

export function clientEinStatusLabel(status: EinCaseStatus, locale: "en" | "es"): string {
  const labels = {
    en: {
      intake_pending: "Information needed",
      intake_in_progress: "Information in progress",
      internal_review: "Under review",
      client_review: "Your review is needed",
      authorization_pending: "Authorization needed",
      ready_to_submit: "Ready for internal submission review",
      submission_prepared: "Submission preparation complete",
      submitted: "Submitted",
      provider_processing: "Processing with the issuing authority",
      outcome_review: "Outcome under review",
      additional_information_required: "Additional information needed",
      correction_required: "Correction needed",
      issued: "EIN issued",
      issuance_verification: "Issuance verification",
      completed: "Completed",
      cancelled: "Cancelled",
      archived: "Archived",
    },
    es: {
      intake_pending: "Información pendiente",
      intake_in_progress: "Información en proceso",
      internal_review: "En revisión",
      client_review: "Necesitamos tu revisión",
      authorization_pending: "Autorización pendiente",
      ready_to_submit: "Listo para revisión interna de envío",
      submission_prepared: "Preparación de envío completada",
      submitted: "Enviado",
      provider_processing: "En proceso con la autoridad emisora",
      outcome_review: "Resultado en revisión",
      additional_information_required: "Se necesita información adicional",
      correction_required: "Se necesita una corrección",
      issued: "EIN emitido",
      issuance_verification: "Verificación de emisión",
      completed: "Completado",
      cancelled: "Cancelado",
      archived: "Archivado",
    },
  } as const;
  return labels[locale][status];
}
