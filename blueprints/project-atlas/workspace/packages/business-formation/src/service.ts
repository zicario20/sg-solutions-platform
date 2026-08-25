import { createHash } from "node:crypto";

import type {
  ClientFilingAuthorization,
  FilingAttempt,
  FilingOutcome,
  FilingOutcomeRecord,
  FilingPreparationResult,
  FormationAiSuggestion,
  FormationAuditEvent,
  FormationCase,
  FormationCaseStatus,
  FormationEntityType,
  FormationFeeBreakdown,
  FormationHandoffDestination,
  FormationHandoffPlan,
  FormationPackage,
  FormationParty,
  FormationProviderConfiguration,
  FormationReadiness,
  FormationReadinessInput,
  FormationTransitionEvaluation,
  JurisdictionRequirement,
  OwnershipEvaluation,
  RequirementSnapshot,
} from "./contracts.ts";

const supportedEntityTypes = new Set(["limited_liability_company", "corporation"]);
const hashPattern = /^[a-f0-9]{64}$/u;
const idempotencyPattern = /^[A-Za-z0-9_.:-]{1,128}$/u;

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

export function createFormationCase(
  input: Omit<FormationCase, "status" | "version" | "filingAllowed">,
): FormationCase {
  if (
    !input.caseId ||
    !input.caseNumber ||
    !input.clientRef ||
    !input.serviceOrderRef ||
    !input.productCode ||
    !input.formationJurisdiction
  )
    throw new Error("FORMATION_CASE_IDENTIFIERS_REQUIRED");
  if (!supportedEntityTypes.has(input.entityType))
    throw new Error("FORMATION_ENTITY_TYPE_UNSUPPORTED");
  if (input.deliveryModel === "education_only" || input.deliveryModel === "future_or_conditional")
    throw new Error("FORMATION_DELIVERY_MODEL_NOT_EXECUTABLE");
  return { ...input, status: "intake_pending", version: 1, filingAllowed: false };
}

export function evaluateOwnership(parties: readonly FormationParty[]): OwnershipEvaluation {
  const owners = parties.filter((party) => party.ownershipPercent !== undefined);
  if (owners.length === 0) throw new Error("FORMATION_OWNERSHIP_REQUIRED");
  const refs = new Set<string>();
  let total = 0;
  for (const party of owners) {
    if (!party.partyRef || refs.has(party.partyRef))
      throw new Error("FORMATION_OWNERSHIP_PARTY_INVALID");
    refs.add(party.partyRef);
    if (
      !Number.isFinite(party.ownershipPercent) ||
      party.ownershipPercent === undefined ||
      party.ownershipPercent <= 0 ||
      party.ownershipPercent > 100
    )
      throw new Error("FORMATION_OWNERSHIP_PERCENT_INVALID");
    total += party.ownershipPercent;
  }
  if (Math.round(total * 100) !== 10_000) throw new Error("FORMATION_OWNERSHIP_TOTAL_INVALID");
  return { valid: true, totalOwnershipPercent: 100, parties: Object.freeze([...parties]) };
}

export function evaluateFormationManagement(input: {
  model: "member_managed" | "manager_managed" | "director_managed";
  parties: readonly FormationParty[];
}): Readonly<{ valid: true; model: typeof input.model }> {
  const hasResponsibleParty = input.parties.some((party) =>
    input.model === "member_managed"
      ? party.managementRole === "member_managed"
      : input.model === "manager_managed"
        ? party.role === "manager" || party.managementRole === "manager_managed"
        : party.role === "director" || party.managementRole === "director",
  );
  if (!hasResponsibleParty) throw new Error("FORMATION_MANAGEMENT_PARTY_REQUIRED");
  return { valid: true, model: input.model };
}

export function selectCurrentRequirement(
  requirements: readonly JurisdictionRequirement[],
  at: string,
): JurisdictionRequirement {
  if (!validInstant(at)) throw new Error("FORMATION_REQUIREMENT_TIME_INVALID");
  const atTime = Date.parse(at);
  const candidates = requirements.filter(
    (requirement) =>
      requirement.verificationStatus === "verified" &&
      validInstant(requirement.effectiveFrom) &&
      Date.parse(requirement.effectiveFrom) <= atTime &&
      (requirement.effectiveTo === undefined ||
        (validInstant(requirement.effectiveTo) && Date.parse(requirement.effectiveTo) > atTime)) &&
      requirement.sourceReference.length > 0,
  );
  if (candidates.length === 0) throw new Error("FORMATION_REQUIREMENT_NOT_VERIFIED");
  const currentRequirement = [...candidates].sort(
    (left, right) =>
      Date.parse(right.effectiveFrom) - Date.parse(left.effectiveFrom) ||
      right.version - left.version,
  )[0];
  if (!currentRequirement) throw new Error("FORMATION_REQUIREMENT_NOT_VERIFIED");
  return currentRequirement;
}

export function selectFormationRequirement(input: {
  jurisdiction: string;
  entityType: FormationEntityType;
  at: string;
  requirements: readonly JurisdictionRequirement[];
}): JurisdictionRequirement {
  if (!input.jurisdiction) throw new Error("FORMATION_REQUIREMENT_SCOPE_INVALID");
  return selectCurrentRequirement(
    input.requirements.filter(
      (requirement) =>
        requirement.jurisdiction === input.jurisdiction &&
        requirement.entityType === input.entityType,
    ),
    input.at,
  );
}

export function createRequirementSnapshot(input: {
  formationCaseRef: string;
  requirements: readonly JurisdictionRequirement[];
  capturedAt: string;
}): RequirementSnapshot {
  if (!input.formationCaseRef || !validInstant(input.capturedAt) || input.requirements.length === 0)
    throw new Error("FORMATION_REQUIREMENT_SNAPSHOT_INVALID");
  const requirements = [...input.requirements].sort((left, right) =>
    left.requirementId.localeCompare(right.requirementId),
  );
  if (requirements.some((requirement) => requirement.verificationStatus !== "verified"))
    throw new Error("FORMATION_REQUIREMENT_SNAPSHOT_UNVERIFIED");
  return {
    formationCaseRef: input.formationCaseRef,
    capturedAt: input.capturedAt,
    requirementIds: Object.freeze(requirements.map((requirement) => requirement.requirementId)),
    snapshotHash: sha256({
      formationCaseRef: input.formationCaseRef,
      capturedAt: input.capturedAt,
      requirements,
    }),
  };
}

export function buildFormationReadiness(input: FormationReadinessInput): FormationReadiness {
  const checks: Readonly<Record<string, boolean>> = {
    ...(input.identityComplete === undefined ? {} : { identity: input.identityComplete }),
    entity: input.entitySelected,
    jurisdiction: input.jurisdictionSelected,
    name: input.nameReady,
    ownership: input.ownershipComplete,
    management: input.managementComplete,
    registered_agent: input.registeredAgentComplete,
    addresses: input.addressesComplete,
    documents: input.requiredDocumentsAvailable,
  };
  const missing = Object.entries(checks)
    .filter(([, complete]) => !complete)
    .map(([key]) => key);
  const total = Object.keys(checks).length;
  return {
    score: Math.round(((total - missing.length) / total) * 100),
    complete: missing.length === 0,
    missing: Object.freeze(missing),
  };
}

export function generateFormationPackage(input: {
  formationCase: FormationCase;
  readiness: FormationReadiness;
  requirementSnapshotHash: string;
  formationData: Readonly<Record<string, unknown>>;
  templateVersion: string;
  generatedAt: string;
}): FormationPackage {
  if (!input.readiness.complete) throw new Error("FORMATION_PACKAGE_NOT_READY");
  if (!hashPattern.test(input.requirementSnapshotHash))
    throw new Error("FORMATION_PACKAGE_REQUIREMENT_SNAPSHOT_INVALID");
  if (!input.templateVersion || !validInstant(input.generatedAt))
    throw new Error("FORMATION_PACKAGE_METADATA_INVALID");
  const documentHash = sha256({
    formationCaseRef: input.formationCase.caseId,
    entityType: input.formationCase.entityType,
    jurisdiction: input.formationCase.formationJurisdiction,
    requirementSnapshotHash: input.requirementSnapshotHash,
    templateVersion: input.templateVersion,
    formationData: input.formationData,
  });
  return {
    packageId: `fp_${documentHash.slice(0, 32)}`,
    formationCaseRef: input.formationCase.caseId,
    templateVersion: input.templateVersion,
    requirementSnapshotHash: input.requirementSnapshotHash,
    documentHash,
    generatedAt: input.generatedAt,
    state: "prepared",
  };
}

export function evaluateFormationTransition(input: {
  current: FormationCaseStatus;
  target: FormationCaseStatus;
  readiness: FormationReadiness;
  reviewApproved: boolean;
  clientAuthorization?: ClientFilingAuthorization;
  requirementSnapshotCurrent: boolean;
  paymentReady: boolean;
  filingChannelReady: boolean;
}): FormationTransitionEvaluation {
  if (input.target !== "ready_to_file") return { allowed: false, reason: "INVALID_TRANSITION" };
  if (
    input.current !== "internal_review" &&
    input.current !== "client_review" &&
    input.current !== "signature_pending" &&
    input.current !== "payment_pending"
  )
    return { allowed: false, reason: "INVALID_TRANSITION" };
  if (!input.readiness.complete) return { allowed: false, reason: "READINESS_INCOMPLETE" };
  if (!input.reviewApproved) return { allowed: false, reason: "INTERNAL_REVIEW_REQUIRED" };
  if (!input.clientAuthorization || !hashPattern.test(input.clientAuthorization.documentHash))
    return { allowed: false, reason: "CLIENT_AUTHORIZATION_REQUIRED" };
  if (!input.requirementSnapshotCurrent)
    return { allowed: false, reason: "REQUIREMENT_SNAPSHOT_STALE" };
  if (!input.paymentReady) return { allowed: false, reason: "PAYMENT_NOT_READY" };
  if (!input.filingChannelReady) return { allowed: false, reason: "FILING_CHANNEL_UNAVAILABLE" };
  return { allowed: true };
}

export function prepareFilingAttempt(input: {
  formationCase: FormationCase;
  packageForFiling: FormationPackage;
  reviewApproved: boolean;
  clientAuthorization?: ClientFilingAuthorization;
  requirementSnapshotCurrent: boolean;
  paymentReady: boolean;
  provider: FormationProviderConfiguration;
  idempotencyKey: string;
}): FilingPreparationResult {
  if (input.formationCase.status !== "ready_to_file")
    return { kind: "blocked", reason: "NOT_READY_TO_FILE" };
  if (input.packageForFiling.formationCaseRef !== input.formationCase.caseId)
    return { kind: "blocked", reason: "PACKAGE_MISMATCH" };
  if (!input.reviewApproved || !input.clientAuthorization)
    return { kind: "blocked", reason: "AUTHORIZATION_MISMATCH" };
  if (input.clientAuthorization.documentHash !== input.packageForFiling.documentHash)
    return { kind: "blocked", reason: "AUTHORIZATION_MISMATCH" };
  if (!input.requirementSnapshotCurrent)
    return { kind: "blocked", reason: "REQUIREMENT_SNAPSHOT_STALE" };
  if (!input.paymentReady) return { kind: "blocked", reason: "PAYMENT_NOT_READY" };
  if (!idempotencyPattern.test(input.idempotencyKey))
    throw new Error("FORMATION_FILING_IDEMPOTENCY_KEY_INVALID");
  if (input.provider.killSwitchEnabled || input.provider.status === "disabled")
    return { kind: "blocked", reason: "PROVIDER_DISABLED" };
  if (!input.provider.supportsSubmission || input.provider.status !== "enabled")
    return { kind: "blocked", reason: "FILING_CHANNEL_UNAVAILABLE" };
  return {
    kind: "prepared",
    attempt: {
      attemptId: `fa_${sha256({ formationCaseRef: input.formationCase.caseId, idempotencyKey: input.idempotencyKey }).slice(0, 32)}`,
      formationCaseRef: input.formationCase.caseId,
      packageHash: input.packageForFiling.documentHash,
      idempotencyKey: input.idempotencyKey,
      providerCode: input.provider.providerCode,
      status: "prepared",
      immutable: true,
    },
  };
}

export function createFormationResubmission(input: {
  previousAttempt: FilingAttempt;
  newPackageHash: string;
  idempotencyKey: string;
}): FilingAttempt {
  if (input.previousAttempt.status !== "rejected")
    throw new Error("FORMATION_RESUBMISSION_PREVIOUS_ATTEMPT_INVALID");
  if (!hashPattern.test(input.newPackageHash) || !idempotencyPattern.test(input.idempotencyKey))
    throw new Error("FORMATION_RESUBMISSION_INVALID");
  if (input.idempotencyKey === input.previousAttempt.idempotencyKey)
    throw new Error("FORMATION_RESUBMISSION_IDEMPOTENCY_REUSED");
  return {
    attemptId: `fa_${sha256({
      previousAttemptId: input.previousAttempt.attemptId,
      idempotencyKey: input.idempotencyKey,
    }).slice(0, 32)}`,
    formationCaseRef: input.previousAttempt.formationCaseRef,
    packageHash: input.newPackageHash,
    idempotencyKey: input.idempotencyKey,
    providerCode: input.previousAttempt.providerCode,
    status: "prepared",
    immutable: true,
  };
}

export function recordFilingOutcome(input: FilingOutcome): FilingOutcomeRecord {
  if (!input.attemptId || !input.officialReference || !validInstant(input.occurredAt))
    throw new Error("FORMATION_FILING_OUTCOME_INVALID");
  if (input.kind === "rejected" && !input.reason)
    throw new Error("FORMATION_REJECTION_REASON_REQUIRED");
  if (
    input.kind === "approved" &&
    (!input.officialDocumentRefs || input.officialDocumentRefs.length === 0)
  )
    throw new Error("FORMATION_APPROVAL_EVIDENCE_REQUIRED");
  return {
    ...input,
    nextCaseStatus:
      input.kind === "rejected"
        ? "state_action_required"
        : input.kind === "approved"
          ? "post_formation"
          : "state_processing",
    immutable: true,
  };
}

export function planFormationHandoffs(input: {
  formationCaseRef: string;
  approvalReference: string;
  enabledDestinations: readonly FormationHandoffDestination[];
}): readonly FormationHandoffPlan[] {
  if (!input.formationCaseRef || !input.approvalReference)
    throw new Error("FORMATION_HANDOFF_REFERENCE_REQUIRED");
  if (new Set(input.enabledDestinations).size !== input.enabledDestinations.length)
    throw new Error("FORMATION_HANDOFF_DUPLICATE_DESTINATION");
  return Object.freeze(
    input.enabledDestinations.map((destination) => ({
      formationCaseRef: input.formationCaseRef,
      destination,
      approvalReference: input.approvalReference,
      idempotencyKey: `${input.formationCaseRef}:${destination}:${input.approvalReference}`,
      status: "pending" as const,
      canExecuteExternally: false as const,
    })),
  );
}

export function calculateFormationFeeBreakdown(input: {
  sgServiceFeeMinor: number;
  governmentFeeMinor: number;
  partnerFeeMinor?: number;
}): FormationFeeBreakdown {
  const partnerFeeMinor = input.partnerFeeMinor ?? 0;
  for (const amount of [input.sgServiceFeeMinor, input.governmentFeeMinor, partnerFeeMinor]) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("FORMATION_FEE_INVALID");
  }
  return {
    currency: "USD",
    sgServiceFeeMinor: input.sgServiceFeeMinor,
    governmentFeeMinor: input.governmentFeeMinor,
    partnerFeeMinor,
    totalMinor: input.sgServiceFeeMinor + input.governmentFeeMinor + partnerFeeMinor,
  };
}

export function validateFormationExternalFee(input: {
  code: string;
  amountMinor: number;
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo?: string;
}): Readonly<{ valid: true }> {
  if (
    !/^[A-Z][A-Z0-9_]{1,79}$/u.test(input.code) ||
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor < 0 ||
    !input.sourceReference ||
    !validInstant(input.effectiveFrom) ||
    (input.effectiveTo !== undefined &&
      (!validInstant(input.effectiveTo) ||
        Date.parse(input.effectiveTo) <= Date.parse(input.effectiveFrom)))
  ) {
    throw new Error("FORMATION_EXTERNAL_FEE_INVALID");
  }
  return { valid: true };
}

export function evaluateFormationAiSuggestion(input: {
  requirementSnapshotHash: string;
  confidence: number;
}): FormationAiSuggestion {
  if (
    !hashPattern.test(input.requirementSnapshotHash) ||
    !Number.isFinite(input.confidence) ||
    input.confidence < 0 ||
    input.confidence > 1
  )
    throw new Error("FORMATION_AI_SUGGESTION_INVALID");
  return {
    state: "requires_human_review",
    canSelectEntity: false,
    canSubmitFiling: false,
    canIssueLegalOpinion: false,
    requirementSnapshotHash: input.requirementSnapshotHash,
  };
}

export function createFormationAuditEvent(
  input: Omit<FormationAuditEvent, "sensitivePayloadIncluded">,
): FormationAuditEvent {
  if (!input.eventType || !input.actorRef || !input.resourceRef || !input.correlationId)
    throw new Error("FORMATION_AUDIT_REFERENCE_REQUIRED");
  return { ...input, sensitivePayloadIncluded: false };
}

const auditSensitiveKey = /(?:ssn|ein|dob|password|token|document|address|bank|account_number)/iu;

export function createSafeFormationAuditRecord(input: {
  eventType: string;
  actorRef: string;
  resourceRef: string;
  correlationId: string;
  attributes?: Readonly<Record<string, unknown>>;
}): FormationAuditEvent {
  const inspect = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (auditSensitiveKey.test(key)) throw new Error("FORMATION_AUDIT_SENSITIVE_FIELD");
      inspect(nested);
    }
  };
  inspect(input.attributes);
  return createFormationAuditEvent({
    eventType: input.eventType,
    actorRef: input.actorRef,
    resourceRef: input.resourceRef,
    correlationId: input.correlationId,
  });
}
