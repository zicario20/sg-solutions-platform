export const COMPLIANCE_MODULE = "M076" as const;

export const COMPLIANCE_PERMISSIONS = [
  "compliance.requirement.create",
  "compliance.policy.create",
  "compliance.control.create",
  "compliance.assessment.create",
  "compliance.evidence.create",
  "compliance.finding.create",
  "compliance.exception.request",
] as const;

export type CompliancePermission = (typeof COMPLIANCE_PERMISSIONS)[number];

export const COMPLIANCE_RUNTIME = {
  sourceRefresh: false,
  applicabilityResolution: false,
  assessmentExecution: false,
  findingClosure: false,
  exceptionApproval: false,
  workflowGateConsumption: false,
  monitoring: false,
} as const;

export type ComplianceRequirementStatus = "draft" | "under_review" | "active" | "retired";
export type ComplianceAssessmentStatus = "unknown" | "insufficient_evidence" | "review_required" | "blocked_runtime_disabled";
export type ComplianceActorKind = "human" | "service" | "ai" | "system" | "unknown";

export interface ComplianceRequirement {
  readonly module: typeof COMPLIANCE_MODULE;
  readonly code: string;
  readonly version: number;
  readonly sourceReferences: readonly string[];
  readonly status: "draft";
  readonly active: false;
  readonly legalConclusionProvided: false;
}

export interface CompliancePolicy {
  readonly code: string;
  readonly version: number;
  readonly status: "draft";
  readonly active: false;
}

export interface ComplianceControl {
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
}

export interface ComplianceSubjectContext {
  readonly subjectReference: string;
  readonly jurisdictionReference: string | null;
  readonly asOfDate: string;
  readonly minimized: true;
  readonly containsRawPii: false;
}

export interface ComplianceApplicabilityResult {
  readonly requirementCode: string;
  readonly subjectReference: string;
  readonly status: "unknown";
  readonly ruleApplied: false;
  readonly runtimeEnabled: false;
}

export interface ComplianceEvidence {
  readonly evidenceReference: string;
  readonly checksumReference: string | null;
  readonly verificationStatus: "unverified";
  readonly containsRawSecrets: false;
  readonly containsBroadPii: false;
}

export interface ComplianceRequirementAssessmentResult {
  readonly requirementCode: string;
  readonly satisfaction: "unknown";
  readonly evidenceSufficient: false;
  readonly legalConclusionProvided: false;
}

export interface ComplianceAssessment {
  readonly assessmentId: string;
  readonly subject: ComplianceSubjectContext;
  readonly status: "blocked_runtime_disabled";
  readonly overallStatus: "unknown";
  readonly legalConclusionProvided: false;
  readonly workflowGateUpdated: false;
}

export interface ComplianceFinding {
  readonly findingId: string;
  readonly assessmentId: string;
  readonly status: "draft";
  readonly closed: false;
  readonly automaticallyRemediated: false;
}

export interface ComplianceExceptionRequest {
  readonly exceptionId: string;
  readonly requirementCode: string;
  readonly status: "draft";
  readonly approved: false;
  readonly changesRequirement: false;
  readonly establishesCompliance: false;
}

export interface ComplianceEvidenceInput {
  readonly evidenceReference: string;
  readonly checksumReference?: string;
  readonly includesRawSecret?: boolean;
  readonly includesBroadPii?: boolean;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: CompliancePermission): void {
  if (!COMPLIANCE_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported compliance permission: ${permission}.`);
  }
}

function requireVersion(version: number, field: string): void {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

export function createComplianceRequirement(input: {
  readonly permission: CompliancePermission;
  readonly code: string;
  readonly version: number;
  readonly sourceReferences: readonly string[];
}): ComplianceRequirement {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Compliance requirement code");
  requireVersion(input.version, "Compliance requirement version");
  if (input.sourceReferences.length === 0) {
    throw new Error("Compliance requirements require source references, not hardcoded legal facts.");
  }

  return {
    module: COMPLIANCE_MODULE,
    code: input.code,
    version: input.version,
    sourceReferences: [...input.sourceReferences],
    status: "draft",
    active: false,
    legalConclusionProvided: false,
  };
}

export function createCompliancePolicy(input: {
  readonly permission: CompliancePermission;
  readonly code: string;
  readonly version: number;
}): CompliancePolicy {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Compliance policy code");
  requireVersion(input.version, "Compliance policy version");

  return { code: input.code, version: input.version, status: "draft", active: false };
}

export function createComplianceControl(input: {
  readonly permission: CompliancePermission;
  readonly code: string;
}): ComplianceControl {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Compliance control code");

  return { code: input.code, status: "draft", active: false };
}

export function createComplianceSubjectContext(input: {
  readonly subjectReference: string;
  readonly jurisdictionReference?: string;
  readonly asOfDate: string;
  readonly includesRawPii?: boolean;
}): ComplianceSubjectContext {
  requireIdentifier(input.subjectReference, "Compliance subject reference");
  requireIdentifier(input.asOfDate, "Compliance assessment date");
  if (input.includesRawPii) {
    throw new Error("Compliance subject context must be minimized and cannot contain raw PII.");
  }

  return {
    subjectReference: input.subjectReference,
    jurisdictionReference: input.jurisdictionReference ?? null,
    asOfDate: input.asOfDate,
    minimized: true,
    containsRawPii: false,
  };
}

export function evaluateComplianceApplicability(input: {
  readonly permission: CompliancePermission;
  readonly requirement: ComplianceRequirement;
  readonly subject: ComplianceSubjectContext;
}): ComplianceApplicabilityResult {
  requirePermission(input.permission);

  return {
    requirementCode: input.requirement.code,
    subjectReference: input.subject.subjectReference,
    status: "unknown",
    ruleApplied: false,
    runtimeEnabled: false,
  };
}

export function createComplianceEvidence(input: {
  readonly permission: CompliancePermission;
  readonly evidence: ComplianceEvidenceInput;
}): ComplianceEvidence {
  requirePermission(input.permission);
  requireIdentifier(input.evidence.evidenceReference, "Compliance evidence reference");
  if (input.evidence.includesRawSecret || input.evidence.includesBroadPii) {
    throw new Error("Compliance evidence cannot persist raw secrets or broad PII.");
  }

  return {
    evidenceReference: input.evidence.evidenceReference,
    checksumReference: input.evidence.checksumReference ?? null,
    verificationStatus: "unverified",
    containsRawSecrets: false,
    containsBroadPii: false,
  };
}

export function createComplianceAssessment(input: {
  readonly permission: CompliancePermission;
  readonly assessmentId: string;
  readonly subject: ComplianceSubjectContext;
}): ComplianceAssessment {
  requirePermission(input.permission);
  requireIdentifier(input.assessmentId, "Compliance assessment ID");

  return {
    assessmentId: input.assessmentId,
    subject: input.subject,
    status: "blocked_runtime_disabled",
    overallStatus: "unknown",
    legalConclusionProvided: false,
    workflowGateUpdated: false,
  };
}

export function createRequirementAssessmentResult(input: {
  readonly requirement: ComplianceRequirement;
}): ComplianceRequirementAssessmentResult {
  return {
    requirementCode: input.requirement.code,
    satisfaction: "unknown",
    evidenceSufficient: false,
    legalConclusionProvided: false,
  };
}

export function createComplianceFinding(input: {
  readonly permission: CompliancePermission;
  readonly findingId: string;
  readonly assessment: ComplianceAssessment;
  readonly actorKind: ComplianceActorKind;
}): ComplianceFinding {
  requirePermission(input.permission);
  requireIdentifier(input.findingId, "Compliance finding ID");

  return {
    findingId: input.findingId,
    assessmentId: input.assessment.assessmentId,
    status: "draft",
    closed: false,
    automaticallyRemediated: false,
  };
}

export function requestComplianceException(input: {
  readonly permission: CompliancePermission;
  readonly exceptionId: string;
  readonly requirement: ComplianceRequirement;
}): ComplianceExceptionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.exceptionId, "Compliance exception ID");

  return {
    exceptionId: input.exceptionId,
    requirementCode: input.requirement.code,
    status: "draft",
    approved: false,
    changesRequirement: false,
    establishesCompliance: false,
  };
}
