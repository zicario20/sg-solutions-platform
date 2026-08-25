import { createHash } from "node:crypto";

import type {
  ComplianceAiSuggestion,
  ComplianceApplicabilityRecord,
  ComplianceAuditEvent,
  ComplianceAuthorization,
  ComplianceAutomationAction,
  ComplianceCase,
  ComplianceChangeRequest,
  ComplianceCompletionRecord,
  ComplianceDeadlineRule,
  ComplianceEngagement,
  ComplianceFilingAttempt,
  ComplianceFilingPackage,
  ComplianceHandoffDestination,
  ComplianceHandoffPlan,
  ComplianceNotice,
  ComplianceObligation,
  ComplianceProfile,
  ComplianceProviderConfiguration,
  ComplianceReminder,
  ComplianceReportPreparation,
  ComplianceRequirement,
  ComplianceSnapshot,
  DeadlineCalculationRecord,
  OfficialComplianceUpdate,
  OwnershipReportingEvaluation,
} from "./contracts.ts";

const idempotencyPattern = /^[A-Za-z0-9_.:-]{1,128}$/u;
const sensitiveAuditKey =
  /(?:tax[_-]?identifier|ssn|ein|document[_-]?content|address[_-]?line|credential|secret|token)/iu;

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
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const dateString = (value: Date) => value.toISOString().slice(0, 10);

export function createComplianceEngagement(input: ComplianceEngagement): ComplianceEngagement {
  if (
    !input.engagementId ||
    !input.clientRef ||
    !input.organizationRef ||
    !input.serviceOrderRef ||
    !validInstant(input.openedAt)
  )
    throw new Error("COMPLIANCE_ENGAGEMENT_IDENTIFIERS_REQUIRED");
  if (input.deliveryModel === "education_only" || input.deliveryModel === "future_or_conditional")
    throw new Error("COMPLIANCE_ENGAGEMENT_NOT_EXECUTABLE");
  return { ...input };
}

export function createComplianceCase(
  input: Omit<ComplianceCase, "status" | "version" | "externalFilingAllowed">,
): ComplianceCase {
  if (
    !input.caseId ||
    !input.caseNumber ||
    !input.organizationRef ||
    !input.engagementRef ||
    !input.jurisdictionCode ||
    !validInstant(input.createdAt)
  )
    throw new Error("COMPLIANCE_CASE_IDENTIFIERS_REQUIRED");
  return { ...input, status: "draft", version: 1, externalFilingAllowed: false };
}

export function createComplianceProfile(
  input: Omit<ComplianceProfile, "profileHash">,
): ComplianceProfile {
  if (
    !input.organizationRef ||
    !input.formationJurisdiction ||
    !validDate(input.formationDate) ||
    !validInstant(input.capturedAt)
  )
    throw new Error("COMPLIANCE_PROFILE_INVALID");
  if (
    input.version < 1 ||
    input.sourceReferences.length === 0 ||
    input.sourceReferences.some((reference) => !reference)
  )
    throw new Error("COMPLIANCE_PROFILE_SOURCE_REQUIRED");
  return {
    ...input,
    activityCodes: Object.freeze([...input.activityCodes]),
    businessLocationJurisdictions: Object.freeze([...input.businessLocationJurisdictions]),
    employeeStates: Object.freeze([...input.employeeStates]),
    taxJurisdictions: Object.freeze([...input.taxJurisdictions]),
    sourceReferences: Object.freeze([...input.sourceReferences]),
    profileHash: sha256(input),
  };
}

export function createComplianceSnapshot(input: {
  profile: ComplianceProfile;
  requirementSetVersion: string;
  evaluatedAt: string;
}): ComplianceSnapshot {
  if (!input.requirementSetVersion || !validInstant(input.evaluatedAt))
    throw new Error("COMPLIANCE_SNAPSHOT_INVALID");
  const snapshotHash = sha256({
    profileHash: input.profile.profileHash,
    requirementSetVersion: input.requirementSetVersion,
    evaluatedAt: input.evaluatedAt,
  });
  return {
    snapshotId: `csnap_${snapshotHash.slice(0, 32)}`,
    organizationRef: input.profile.organizationRef,
    profileVersion: input.profile.version,
    requirementSetVersion: input.requirementSetVersion,
    sourceReferences: input.profile.sourceReferences,
    snapshotHash,
    evaluatedAt: input.evaluatedAt,
  };
}

export function validateComplianceRequirement(
  input: ComplianceRequirement,
  at: string,
): ComplianceRequirement {
  if (
    !input.requirementId ||
    !input.requirementCode ||
    !input.jurisdictionCode ||
    input.entityTypes.length === 0 ||
    !validInstant(at)
  )
    throw new Error("COMPLIANCE_REQUIREMENT_INVALID");
  if (
    !input.source.authority ||
    !input.source.reference ||
    !validInstant(input.source.retrievedAt) ||
    !validInstant(input.source.verifiedAt)
  )
    throw new Error("COMPLIANCE_REQUIREMENT_SOURCE_INVALID");
  if (
    !validInstant(input.effectiveFrom) ||
    (input.effectiveTo !== undefined && !validInstant(input.effectiveTo))
  )
    throw new Error("COMPLIANCE_REQUIREMENT_EFFECTIVE_DATE_INVALID");
  if (input.version < 1) throw new Error("COMPLIANCE_REQUIREMENT_VERSION_INVALID");
  if (
    input.status !== "active" ||
    input.freshness === "stale" ||
    input.freshness === "unknown" ||
    input.freshness === "verification_due"
  )
    throw new Error("COMPLIANCE_REQUIREMENT_NOT_CURRENT");
  const now = Date.parse(at);
  if (
    Date.parse(input.effectiveFrom) > now ||
    (input.effectiveTo !== undefined && Date.parse(input.effectiveTo) <= now)
  )
    throw new Error("COMPLIANCE_REQUIREMENT_NOT_EFFECTIVE");
  return {
    ...input,
    entityTypes: Object.freeze([...input.entityTypes]),
    ...(input.activityCodes ? { activityCodes: Object.freeze([...input.activityCodes]) } : {}),
  };
}

export function evaluateComplianceApplicability(input: {
  profile: ComplianceProfile;
  snapshot: ComplianceSnapshot;
  requirement: ComplianceRequirement;
  at: string;
}): ComplianceApplicabilityRecord {
  const base = {
    organizationRef: input.profile.organizationRef,
    requirementRef: input.requirement.requirementId,
    snapshotRef: input.snapshot.snapshotId,
    evaluatedAt: input.at,
  };
  try {
    validateComplianceRequirement(input.requirement, input.at);
  } catch {
    return {
      applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
      ...base,
      status: "professional_review_required",
      reasonCode: "REQUIREMENT_NOT_CURRENT",
      confidence: "unknown",
    };
  }
  if (input.snapshot.organizationRef !== input.profile.organizationRef)
    throw new Error("COMPLIANCE_SNAPSHOT_ORGANIZATION_MISMATCH");
  if (input.profile.verificationStatus !== "verified")
    return {
      applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
      ...base,
      status: "insufficient_information",
      reasonCode: "PROFILE_NOT_VERIFIED",
      confidence: "review_required",
    };
  if (
    input.requirement.jurisdictionCode !== input.profile.formationJurisdiction &&
    !input.profile.businessLocationJurisdictions.includes(input.requirement.jurisdictionCode)
  )
    return {
      applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
      ...base,
      status: "not_applicable",
      reasonCode: "JURISDICTION_MISMATCH",
      confidence: "verified",
    };
  if (!input.requirement.entityTypes.includes(input.profile.entityType))
    return {
      applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
      ...base,
      status: "not_applicable",
      reasonCode: "ENTITY_MISMATCH",
      confidence: "verified",
    };
  if (input.requirement.activityCodes && input.requirement.activityCodes.length > 0) {
    if (input.profile.activityCodes.length === 0)
      return {
        applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
        ...base,
        status: "insufficient_information",
        reasonCode: "ACTIVITY_INFORMATION_MISSING",
        confidence: "review_required",
      };
    if (!input.requirement.activityCodes.some((code) => input.profile.activityCodes.includes(code)))
      return {
        applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
        ...base,
        status: "not_applicable",
        reasonCode: "ACTIVITY_INFORMATION_MISSING",
        confidence: "verified",
      };
  }
  if (input.requirement.requiresProfessionalReview)
    return {
      applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
      ...base,
      status: "professional_review_required",
      reasonCode: "PROFESSIONAL_REVIEW_REQUIRED",
      confidence: "review_required",
    };
  return {
    applicabilityId: `capp_${sha256(base).slice(0, 32)}`,
    ...base,
    status: "applicable",
    reasonCode: "MATCHED",
    confidence: "verified",
  };
}

function addMonths(date: Date, months: number) {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()),
  );
  return result;
}

export function calculateComplianceDeadline(input: {
  obligationRef: string;
  rule: ComplianceDeadlineRule;
  ruleVersion: string;
  inputDates: Readonly<Record<string, string>>;
  calculatedAt: string;
}): DeadlineCalculationRecord {
  if (
    !input.obligationRef ||
    !input.ruleVersion ||
    !validInstant(input.calculatedAt) ||
    !input.rule.timezone
  )
    throw new Error("COMPLIANCE_DEADLINE_INPUT_INVALID");
  const base =
    input.inputDates.baseDate ?? input.inputDates.formationDate ?? input.inputDates.eventDate;
  let dueDate: string | undefined;
  if (input.rule.ruleType === "manual_verified") dueDate = input.inputDates.manualDueDate;
  if (input.rule.ruleType === "fixed_date") {
    const periodDate = input.inputDates.periodEnd;
    if (periodDate && input.rule.month !== undefined && input.rule.day !== undefined) {
      const date = asDate(periodDate);
      dueDate = dateString(
        new Date(Date.UTC(date.getUTCFullYear(), input.rule.month - 1, input.rule.day)),
      );
    }
  }
  if (input.rule.ruleType === "anniversary" && base && input.rule.intervalMonths !== undefined)
    dueDate = dateString(addMonths(asDate(base), input.rule.intervalMonths));
  if (input.rule.ruleType === "days_after_event" && base && input.rule.offsetDays !== undefined) {
    const date = asDate(base);
    date.setUTCDate(date.getUTCDate() + input.rule.offsetDays);
    dueDate = dateString(date);
  }
  if (
    (input.rule.ruleType === "months_after_event" || input.rule.ruleType === "periodic_interval") &&
    base &&
    input.rule.intervalMonths !== undefined
  )
    dueDate = dateString(addMonths(asDate(base), input.rule.intervalMonths));
  if (!dueDate || !validDate(dueDate)) throw new Error("COMPLIANCE_DEADLINE_UNRESOLVED");
  const confidence = input.rule.weekendHolidayAdjustment === "none" ? "high" : "review_required";
  return {
    calculationId: `cdl_${sha256({ obligationRef: input.obligationRef, ruleVersion: input.ruleVersion, inputDates: input.inputDates }).slice(0, 32)}`,
    obligationRef: input.obligationRef,
    ruleVersion: input.ruleVersion,
    inputDates: { ...input.inputDates },
    dueDate,
    timezone: input.rule.timezone,
    trace: `${input.rule.ruleType}:${input.ruleVersion}`,
    confidence,
    calculatedAt: input.calculatedAt,
  };
}

export function createComplianceObligation(input: {
  profile: ComplianceProfile;
  requirement: ComplianceRequirement;
  applicability: ComplianceApplicabilityRecord;
  periodStart: string;
  periodEnd: string;
  deadline: DeadlineCalculationRecord;
  responsibility: ComplianceObligation["responsibility"];
  createdAt: string;
}): ComplianceObligation {
  if (input.applicability.status !== "applicable")
    throw new Error("COMPLIANCE_OBLIGATION_NOT_APPLICABLE");
  if (input.deadline.confidence === "unknown")
    throw new Error("COMPLIANCE_OBLIGATION_DUE_DATE_UNKNOWN");
  if (
    !validDate(input.periodStart) ||
    !validDate(input.periodEnd) ||
    !validInstant(input.createdAt)
  )
    throw new Error("COMPLIANCE_OBLIGATION_PERIOD_INVALID");
  const uniquenessKey = `${input.profile.organizationRef}:${input.requirement.requirementCode}:${input.requirement.jurisdictionCode}:${input.periodStart}:${input.periodEnd}`;
  const obligationId = `cobl_${sha256({ uniquenessKey, requirementVersion: input.requirement.version }).slice(0, 32)}`;
  return {
    obligationId,
    organizationRef: input.profile.organizationRef,
    requirementRef: input.requirement.requirementId,
    requirementCode: input.requirement.requirementCode,
    requirementType: input.requirement.requirementType,
    jurisdictionCode: input.requirement.jurisdictionCode,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    dueDate: input.deadline.dueDate,
    dueDateConfidence: input.deadline.confidence,
    status: "scheduled",
    responsibility: input.responsibility,
    serviceScope: input.requirement.serviceScopeDefault,
    sourceReference: input.requirement.source.reference,
    uniquenessKey,
    createdAt: input.createdAt,
  };
}

export function createComplianceReminder(input: {
  obligation: ComplianceObligation;
  policyCode: string;
  offsetDays: number;
  channel: ComplianceReminder["channel"];
  recipientRef: string;
}): ComplianceReminder {
  if (!input.policyCode || !input.recipientRef || !Number.isInteger(input.offsetDays))
    throw new Error("COMPLIANCE_REMINDER_INVALID");
  const due = asDate(input.obligation.dueDate);
  due.setUTCDate(due.getUTCDate() - input.offsetDays);
  const idempotencyKey = `${input.obligation.obligationId}:${input.policyCode}:${input.offsetDays}:${input.channel}:${input.recipientRef}`;
  return {
    reminderId: `crem_${sha256({ idempotencyKey }).slice(0, 32)}`,
    obligationRef: input.obligation.obligationId,
    policyCode: input.policyCode,
    channel: input.channel,
    recipientRef: input.recipientRef,
    scheduledAt: due.toISOString(),
    idempotencyKey,
    sensitiveDetailsIncluded: false,
  };
}

export function createReportPreparation(input: {
  obligation: ComplianceObligation;
  requirement: ComplianceRequirement;
  nonSensitiveReportData: Readonly<Record<string, unknown>>;
  formVersion: string;
  createdAt: string;
}): ComplianceReportPreparation {
  validateComplianceRequirement(input.requirement, input.createdAt);
  if (
    input.obligation.requirementRef !== input.requirement.requirementId ||
    !input.formVersion ||
    !validInstant(input.createdAt)
  )
    throw new Error("COMPLIANCE_REPORT_PREPARATION_INVALID");
  const reportDataHash = sha256({
    obligationRef: input.obligation.obligationId,
    formVersion: input.formVersion,
    data: input.nonSensitiveReportData,
  });
  return {
    preparationId: `crpt_${reportDataHash.slice(0, 32)}`,
    obligationRef: input.obligation.obligationId,
    requirementVersion: `${input.requirement.requirementCode}:v${input.requirement.version}`,
    reportDataHash,
    formVersion: input.formVersion,
    state: "draft",
    createdAt: input.createdAt,
  };
}

export function evaluateReportReadyToFile(input: {
  requirementCurrent: boolean;
  dueDateVerified: boolean;
  requiredFieldsComplete: boolean;
  clientConfirmationsComplete: boolean;
  reviewApproved: boolean;
  authorization?: ComplianceAuthorization;
  preparation: ComplianceReportPreparation;
  feeCurrent: boolean;
  blockingFindings: boolean;
}): "ready" | "warning" | "blocked" {
  if (
    !input.requirementCurrent ||
    !input.dueDateVerified ||
    !input.requiredFieldsComplete ||
    !input.clientConfirmationsComplete ||
    !input.reviewApproved ||
    !input.feeCurrent ||
    input.blockingFindings
  )
    return "blocked";
  if (
    input.authorization?.status !== "valid" ||
    input.authorization?.reportHash !== input.preparation.reportDataHash
  )
    return "blocked";
  return "ready";
}

export function createComplianceFilingPackage(input: {
  obligation: ComplianceObligation;
  preparation: ComplianceReportPreparation;
  authorization: ComplianceAuthorization;
  readiness: "ready" | "warning" | "blocked";
}): ComplianceFilingPackage {
  if (
    input.readiness !== "ready" ||
    input.authorization.status !== "valid" ||
    input.authorization.reportHash !== input.preparation.reportDataHash
  )
    throw new Error("COMPLIANCE_FILING_PACKAGE_NOT_READY");
  const packageHash = sha256({
    obligationRef: input.obligation.obligationId,
    requirementRef: input.obligation.requirementRef,
    reportHash: input.preparation.reportDataHash,
    authorizationRef: input.authorization.authorizationRef,
  });
  return {
    packageId: `cfp_${packageHash.slice(0, 32)}`,
    obligationRef: input.obligation.obligationId,
    requirementRef: input.obligation.requirementRef,
    reportHash: input.preparation.reportDataHash,
    authorizationRef: input.authorization.authorizationRef,
    packageHash,
    state: "authorized",
    immutable: true,
  };
}

export function prepareComplianceFiling(input: {
  obligation: ComplianceObligation;
  filingPackage: ComplianceFilingPackage;
  provider: ComplianceProviderConfiguration;
  idempotencyKey: string;
  existingAttempts: readonly ComplianceFilingAttempt[];
}):
  | Readonly<{ kind: "prepared"; attempt: ComplianceFilingAttempt }>
  | Readonly<{
      kind: "blocked";
      reason:
        | "NOT_READY_TO_FILE"
        | "PROVIDER_DISABLED"
        | "CHANNEL_UNAVAILABLE"
        | "UNKNOWN_OUTCOME_REQUIRES_REVIEW";
    }> {
  if (
    input.obligation.status !== "ready_to_file" ||
    input.filingPackage.obligationRef !== input.obligation.obligationId
  )
    return { kind: "blocked", reason: "NOT_READY_TO_FILE" };
  if (input.existingAttempts.some((attempt) => attempt.status === "unknown_outcome"))
    return { kind: "blocked", reason: "UNKNOWN_OUTCOME_REQUIRES_REVIEW" };
  if (!idempotencyPattern.test(input.idempotencyKey))
    throw new Error("COMPLIANCE_FILING_IDEMPOTENCY_INVALID");
  if (input.provider.killSwitchEnabled || input.provider.status === "disabled")
    return { kind: "blocked", reason: "PROVIDER_DISABLED" };
  if (input.provider.status !== "enabled" || !input.provider.supportsSubmission)
    return { kind: "blocked", reason: "CHANNEL_UNAVAILABLE" };
  return {
    kind: "prepared",
    attempt: {
      attemptId: `cfa_${sha256({ obligationRef: input.obligation.obligationId, idempotencyKey: input.idempotencyKey }).slice(0, 32)}`,
      obligationRef: input.obligation.obligationId,
      packageHash: input.filingPackage.packageHash,
      providerCode: input.provider.providerCode,
      idempotencyKey: input.idempotencyKey,
      status: "prepared",
      immutable: true,
    },
  };
}

export function completeComplianceObligation(input: {
  obligation: ComplianceObligation;
  completionType: ComplianceCompletionRecord["completionType"];
  evidenceDocumentRefs: readonly string[];
  verifiedBy: string;
  completedAt: string;
  externalReference?: string;
}): ComplianceCompletionRecord {
  if (
    input.evidenceDocumentRefs.length === 0 ||
    input.evidenceDocumentRefs.some((reference) => !reference) ||
    !input.verifiedBy ||
    !validInstant(input.completedAt)
  )
    throw new Error("COMPLIANCE_COMPLETION_EVIDENCE_REQUIRED");
  return {
    completionId: `ccmp_${sha256({ obligationRef: input.obligation.obligationId, evidenceDocumentRefs: input.evidenceDocumentRefs, completedAt: input.completedAt }).slice(0, 32)}`,
    obligationRef: input.obligation.obligationId,
    completionType: input.completionType,
    evidenceDocumentRefs: Object.freeze([...input.evidenceDocumentRefs]),
    ...(input.externalReference ? { externalReference: input.externalReference } : {}),
    verifiedBy: input.verifiedBy,
    verificationStatus: "verified",
    completedAt: input.completedAt,
    nextRecurrencePlanned: true,
  };
}

export function createComplianceChangeRequest(input: {
  organizationRef: string;
  changeType: ComplianceChangeRequest["changeType"];
  requestedValue: Readonly<Record<string, unknown>>;
  requestedAt: string;
}): ComplianceChangeRequest {
  if (!input.organizationRef || !validInstant(input.requestedAt))
    throw new Error("COMPLIANCE_CHANGE_REQUEST_INVALID");
  return {
    requestId: `cchg_${sha256({ organizationRef: input.organizationRef, changeType: input.changeType, requestedValue: input.requestedValue, requestedAt: input.requestedAt }).slice(0, 32)}`,
    organizationRef: input.organizationRef,
    changeType: input.changeType,
    requestedValueHash: sha256(input.requestedValue),
    state: "review_required",
    requestedAt: input.requestedAt,
  };
}

export function recordOfficialComplianceUpdate(input: {
  request: ComplianceChangeRequest;
  sourceDocumentRef: string;
  officialValue: Readonly<Record<string, unknown>>;
  appliedAt: string;
}): OfficialComplianceUpdate {
  if (!input.sourceDocumentRef || !validInstant(input.appliedAt))
    throw new Error("COMPLIANCE_OFFICIAL_UPDATE_EVIDENCE_REQUIRED");
  return {
    updateId: `coup_${sha256({ requestRef: input.request.requestId, sourceDocumentRef: input.sourceDocumentRef, officialValue: input.officialValue }).slice(0, 32)}`,
    organizationRef: input.request.organizationRef,
    changeRequestRef: input.request.requestId,
    sourceDocumentRef: input.sourceDocumentRef,
    officialValueHash: sha256(input.officialValue),
    verificationStatus: "verified",
    appliedAt: input.appliedAt,
  };
}

export function createComplianceNotice(
  input: Omit<ComplianceNotice, "noticeId">,
): ComplianceNotice {
  if (
    !input.organizationRef ||
    !input.sourceDocumentRef ||
    !input.sourceReference ||
    !validInstant(input.receivedAt)
  )
    throw new Error("COMPLIANCE_NOTICE_SOURCE_REQUIRED");
  if (input.dueDate !== undefined && !validDate(input.dueDate))
    throw new Error("COMPLIANCE_NOTICE_DUE_DATE_INVALID");
  if (input.dueDateConfidence === "verified" && !input.dueDate)
    throw new Error("COMPLIANCE_NOTICE_DUE_DATE_EVIDENCE_REQUIRED");
  return { noticeId: `cnot_${sha256(input).slice(0, 32)}`, ...input };
}

export function evaluateOwnershipReporting(input: {
  requirement?: ComplianceRequirement;
  profile: ComplianceProfile;
  at: string;
}): OwnershipReportingEvaluation {
  if (!input.requirement)
    return { status: "not_applicable", reason: "NO_ACTIVE_REQUIREMENT", canCreateFiling: false };
  try {
    validateComplianceRequirement(input.requirement, input.at);
  } catch {
    return {
      status: "professional_review_required",
      reason: "REQUIREMENT_NOT_CURRENT",
      canCreateFiling: false,
    };
  }
  if (input.profile.verificationStatus !== "verified")
    return {
      status: "professional_review_required",
      reason: "SOURCE_INSUFFICIENT",
      canCreateFiling: false,
    };
  return {
    status: "professional_review_required",
    reason: "REVIEW_REQUIRED",
    canCreateFiling: false,
  };
}

export function planComplianceHandoffs(input: {
  obligation: ComplianceObligation;
  destinations: readonly ComplianceHandoffDestination[];
}): readonly ComplianceHandoffPlan[] {
  if (
    input.destinations.length === 0 ||
    new Set(input.destinations).size !== input.destinations.length
  )
    throw new Error("COMPLIANCE_HANDOFF_DESTINATIONS_INVALID");
  return Object.freeze(
    input.destinations.map((destination) => {
      const idempotencyKey = `compliance:${input.obligation.obligationId}:${destination}:v1`;
      return {
        handoffId: `chnd_${sha256({ idempotencyKey }).slice(0, 32)}`,
        sourceObligationRef: input.obligation.obligationId,
        organizationRef: input.obligation.organizationRef,
        destination,
        payloadVersion: "v1" as const,
        payloadHash: sha256({
          organizationRef: input.obligation.organizationRef,
          obligationRef: input.obligation.obligationId,
          status: input.obligation.status,
          destination,
        }),
        idempotencyKey,
        status: "ready" as const,
        containsSensitiveFields: false as const,
        canExecuteExternally: false as const,
      };
    }),
  );
}

export function evaluateComplianceAutomation(
  action: ComplianceAutomationAction,
): Readonly<{ allowed: boolean; reason?: "HUMAN_GATE_REQUIRED" | "PROHIBITED" }> {
  if (action === "create_task" || action === "schedule_reminder" || action === "refresh_read_model")
    return { allowed: true };
  if (
    action === "submit_filing" ||
    action === "mark_completed" ||
    action === "override_blocker" ||
    action === "share_partner_data"
  )
    return { allowed: false, reason: "HUMAN_GATE_REQUIRED" };
  return { allowed: false, reason: "PROHIBITED" };
}

export function createComplianceAiSuggestion(input: {
  requirementRefs: readonly string[];
  sourceReferences: readonly string[];
}): ComplianceAiSuggestion {
  if (input.requirementRefs.length === 0 || input.sourceReferences.length === 0)
    throw new Error("COMPLIANCE_AI_GROUNDING_REQUIRED");
  return {
    state: "requires_human_review",
    requirementRefs: Object.freeze([...input.requirementRefs]),
    sourceReferences: Object.freeze([...input.sourceReferences]),
    canDeclareCompliance: false,
    canSubmitFiling: false,
    canOverrideBlocker: false,
  };
}

export function createSafeComplianceAuditEvent(input: {
  eventType: string;
  actorRef: string;
  resourceRef: string;
  purpose: string;
  correlationId: string;
  candidatePayload?: Readonly<Record<string, unknown>>;
}): ComplianceAuditEvent {
  if (
    !input.eventType ||
    !input.actorRef ||
    !input.resourceRef ||
    !input.purpose ||
    !input.correlationId
  )
    throw new Error("COMPLIANCE_AUDIT_REQUIRED_FIELDS_MISSING");
  if (
    input.candidatePayload &&
    Object.keys(input.candidatePayload).some((key) => sensitiveAuditKey.test(key))
  )
    throw new Error("COMPLIANCE_AUDIT_SENSITIVE_PAYLOAD_PROHIBITED");
  return {
    eventType: input.eventType,
    actorRef: input.actorRef,
    resourceRef: input.resourceRef,
    purpose: input.purpose,
    correlationId: input.correlationId,
    sensitivePayloadIncluded: false,
  };
}
