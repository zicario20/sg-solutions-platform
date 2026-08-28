export const RISK_MANAGEMENT_MODULE = "M079" as const;

export const RISK_PERMISSIONS = [
  "risk.taxonomy.create",
  "risk.register.create",
  "risk.item.create",
  "risk.assessment.create",
  "risk.evidence.create",
  "risk.treatment.create",
  "risk.acceptance.request",
] as const;

export type RiskPermission = (typeof RISK_PERMISSIONS)[number];

export const RISK_RUNTIME = {
  assessmentExecution: false,
  scoreCalculation: false,
  appetiteEvaluation: false,
  acceptanceApproval: false,
  treatmentExecution: false,
  kriMonitoring: false,
  workflowGating: false,
  eventDispatch: false,
} as const;

export type RiskActorKind = "human" | "ai" | "service" | "system" | "unknown";
export type RiskCategory = "security" | "privacy" | "compliance" | "operational" | "financial" | "provider" | "model" | "other";

export interface RiskTaxonomy {
  readonly module: typeof RISK_MANAGEMENT_MODULE;
  readonly code: string;
  readonly name: string;
  readonly status: "draft";
  readonly active: false;
}

export interface RiskRegister {
  readonly code: string;
  readonly taxonomyCode: string;
  readonly status: "draft";
  readonly active: false;
}

export interface RiskItem {
  readonly riskId: string;
  readonly registerCode: string;
  readonly category: RiskCategory;
  readonly status: "draft";
  readonly ownerAssigned: false;
  readonly operationalBlockApplied: false;
}

export interface RiskContext {
  readonly subjectReference: string;
  readonly evidenceReferences: readonly string[];
  readonly minimized: true;
  readonly containsRawSecrets: false;
  readonly containsBroadPii: false;
}

export interface RiskEvidence {
  readonly evidenceReference: string;
  readonly checksumReference: string | null;
  readonly verificationStatus: "unverified";
  readonly containsRawSecrets: false;
  readonly containsBroadPii: false;
}

export interface RiskAssessment {
  readonly assessmentId: string;
  readonly risk: RiskItem;
  readonly context: RiskContext;
  readonly status: "blocked_runtime_disabled";
  readonly inherentRisk: "unknown";
  readonly residualRisk: "unknown";
  readonly score: null;
  readonly workflowGateUpdated: false;
  readonly authorizationDecisionMade: false;
}

export interface RiskTreatmentPlan {
  readonly treatmentId: string;
  readonly riskId: string;
  readonly strategy: "mitigate" | "avoid" | "transfer" | "monitor" | "unknown";
  readonly status: "draft";
  readonly actionsExecuted: false;
}

export interface RiskAcceptanceRequest {
  readonly requestId: string;
  readonly riskId: string;
  readonly status: "draft";
  readonly accepted: false;
  readonly approvalGranted: false;
  readonly authorizationDecisionMade: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: RiskPermission): void {
  if (!RISK_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported risk permission: ${permission}.`);
  }
}

export function createRiskTaxonomy(input: {
  readonly permission: RiskPermission;
  readonly code: string;
  readonly name: string;
}): RiskTaxonomy {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Risk taxonomy code");
  requireIdentifier(input.name, "Risk taxonomy name");

  return { module: RISK_MANAGEMENT_MODULE, code: input.code, name: input.name, status: "draft", active: false };
}

export function createRiskRegister(input: {
  readonly permission: RiskPermission;
  readonly code: string;
  readonly taxonomy: RiskTaxonomy;
}): RiskRegister {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Risk register code");

  return { code: input.code, taxonomyCode: input.taxonomy.code, status: "draft", active: false };
}

export function createRiskItem(input: {
  readonly permission: RiskPermission;
  readonly riskId: string;
  readonly register: RiskRegister;
  readonly category: RiskCategory;
}): RiskItem {
  requirePermission(input.permission);
  requireIdentifier(input.riskId, "Risk item ID");

  return {
    riskId: input.riskId,
    registerCode: input.register.code,
    category: input.category,
    status: "draft",
    ownerAssigned: false,
    operationalBlockApplied: false,
  };
}

export function createRiskContext(input: {
  readonly subjectReference: string;
  readonly evidenceReferences: readonly string[];
  readonly includesRawSecret?: boolean;
  readonly includesBroadPii?: boolean;
}): RiskContext {
  requireIdentifier(input.subjectReference, "Risk subject reference");
  if (input.includesRawSecret || input.includesBroadPii) {
    throw new Error("Risk context cannot contain raw secrets or broad PII.");
  }

  return {
    subjectReference: input.subjectReference,
    evidenceReferences: [...input.evidenceReferences],
    minimized: true,
    containsRawSecrets: false,
    containsBroadPii: false,
  };
}

export function createRiskEvidence(input: {
  readonly permission: RiskPermission;
  readonly evidenceReference: string;
  readonly checksumReference?: string;
  readonly includesRawSecret?: boolean;
  readonly includesBroadPii?: boolean;
}): RiskEvidence {
  requirePermission(input.permission);
  requireIdentifier(input.evidenceReference, "Risk evidence reference");
  if (input.includesRawSecret || input.includesBroadPii) {
    throw new Error("Risk evidence cannot contain raw secrets or broad PII.");
  }

  return {
    evidenceReference: input.evidenceReference,
    checksumReference: input.checksumReference ?? null,
    verificationStatus: "unverified",
    containsRawSecrets: false,
    containsBroadPii: false,
  };
}

export function createRiskAssessment(input: {
  readonly permission: RiskPermission;
  readonly assessmentId: string;
  readonly risk: RiskItem;
  readonly context: RiskContext;
}): RiskAssessment {
  requirePermission(input.permission);
  requireIdentifier(input.assessmentId, "Risk assessment ID");

  return {
    assessmentId: input.assessmentId,
    risk: input.risk,
    context: input.context,
    status: "blocked_runtime_disabled",
    inherentRisk: "unknown",
    residualRisk: "unknown",
    score: null,
    workflowGateUpdated: false,
    authorizationDecisionMade: false,
  };
}

export function createRiskTreatmentPlan(input: {
  readonly permission: RiskPermission;
  readonly treatmentId: string;
  readonly risk: RiskItem;
  readonly strategy: RiskTreatmentPlan["strategy"];
}): RiskTreatmentPlan {
  requirePermission(input.permission);
  requireIdentifier(input.treatmentId, "Risk treatment ID");

  return {
    treatmentId: input.treatmentId,
    riskId: input.risk.riskId,
    strategy: input.strategy,
    status: "draft",
    actionsExecuted: false,
  };
}

export function requestRiskAcceptance(input: {
  readonly permission: RiskPermission;
  readonly requestId: string;
  readonly risk: RiskItem;
  readonly actorKind: RiskActorKind;
}): RiskAcceptanceRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Risk acceptance request ID");
  if (input.actorKind === "ai") {
    throw new Error("AI may suggest risk information but cannot request or accept risk acceptance.");
  }

  return {
    requestId: input.requestId,
    riskId: input.risk.riskId,
    status: "draft",
    accepted: false,
    approvalGranted: false,
    authorizationDecisionMade: false,
  };
}
