/**
 * M071: jurisdiction automation resolves only source-grounded candidates.
 * It never supplies legal advice, final legal determinations, or submissions.
 */
export const JURISDICTION_AUTOMATION_MODULE = "M071" as const;

export const JURISDICTION_AUTOMATION_PERMISSIONS = {
  JURISDICTION_MANAGE: "jurisdiction.manage",
  SOURCE_BUNDLE_MANAGE: "jurisdiction.source_bundle.manage",
  RULE_PACK_MANAGE: "jurisdiction.rule_pack.manage",
  RESOLUTION_REQUEST_CREATE: "jurisdiction.resolution.request.create",
  RESOLUTION_RUN: "jurisdiction.resolution.run",
  CONFLICT_MANAGE: "jurisdiction.conflict.manage",
  PORTAL_BINDING_MANAGE: "jurisdiction.portal_binding.manage",
} as const;

export type JurisdictionAutomationPermission =
  (typeof JURISDICTION_AUTOMATION_PERMISSIONS)[keyof typeof JURISDICTION_AUTOMATION_PERMISSIONS];

export interface JurisdictionAutomationActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly JurisdictionAutomationPermission[];
}

export interface JurisdictionAutomationRuntimePolicy {
  rulePublication: false;
  jurisdictionResolution: false;
  sourceRefresh: false;
  portalSelection: false;
  browserBindingDispatch: false;
  backgroundJobs: false;
}

export const JURISDICTION_AUTOMATION_RUNTIME_POLICY: JurisdictionAutomationRuntimePolicy = Object.freeze({
  rulePublication: false,
  jurisdictionResolution: false,
  sourceRefresh: false,
  portalSelection: false,
  browserBindingDispatch: false,
  backgroundJobs: false,
});

export interface Jurisdiction {
  code: string;
  displayName: string;
  level: "federal" | "state" | "county" | "city" | "agency" | "custom";
  status: "draft";
  activeForResolution: false;
  createdBy: string;
}

export interface JurisdictionSourceBundle {
  code: string;
  jurisdictionCode: string;
  sourceSnapshotReferences: readonly string[];
  freshnessStatus: "unknown";
  approvedForAutomation: false;
  status: "draft";
  createdBy: string;
}

export interface JurisdictionRulePack {
  code: string;
  jurisdictionCode: string;
  sourceBundleCode: string;
  version: string;
  status: "draft";
  sourceGrounded: false;
  approvedForUse: false;
  immutableAfterApproval: true;
  createdBy: string;
}

export interface JurisdictionFactState {
  code: string;
  state: "known" | "unknown" | "conflicted";
}

export interface JurisdictionResolutionRequest {
  requestCode: string;
  serviceCode: string;
  asOfDate: string;
  subjectReferences: readonly string[];
  factStates: readonly JurisdictionFactState[];
  containsPreciseLocation: false;
  status: "captured";
  createdBy: string;
}

export interface JurisdictionResolution {
  requestCode: string;
  rulePackCode: string;
  status: "blocked_runtime_disabled";
  applicability: "unknown";
  legalAdviceProvided: false;
  finalLegalDetermination: false;
  portalSubmissionAuthorized: false;
  sourceFreshness: "unknown";
  missingFactCodes: readonly string[];
  needsHumanReview: true;
}

export interface JurisdictionConflict {
  code: string;
  requestCode: string;
  conflictingSourceReferences: readonly string[];
  status: "review_required";
  resolvedHeuristically: false;
  createdBy: string;
}

export interface JurisdictionPortalBinding {
  code: string;
  jurisdictionCode: string;
  rulePackCode: string;
  status: "draft";
  portalSelected: false;
  browserDispatchAuthorized: false;
  submissionAuthorized: false;
  createdBy: string;
}

export interface JurisdictionAutomationRuntimeStatus {
  module: typeof JURISDICTION_AUTOMATION_MODULE;
  state: "provider_disabled";
  policy: JurisdictionAutomationRuntimePolicy;
  sourceAuthority: "M064";
  workflowAuthority: "M068";
  browserAuthority: "M070";
}

export function getJurisdictionAutomationRuntimeStatus(): JurisdictionAutomationRuntimeStatus {
  return {
    module: JURISDICTION_AUTOMATION_MODULE,
    state: "provider_disabled",
    policy: JURISDICTION_AUTOMATION_RUNTIME_POLICY,
    sourceAuthority: "M064",
    workflowAuthority: "M068",
    browserAuthority: "M070",
  };
}

export function createJurisdiction(
  actor: JurisdictionAutomationActorContext,
  input: { code: string; displayName: string; level: Jurisdiction["level"] },
): Jurisdiction {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.JURISDICTION_MANAGE);
  assertJurisdictionCode(input.code, "jurisdiction");

  return {
    code: input.code,
    displayName: requireText(input.displayName, "displayName"),
    level: input.level,
    status: "draft",
    activeForResolution: false,
    createdBy: actor.actorId,
  };
}

export function createJurisdictionSourceBundle(
  actor: JurisdictionAutomationActorContext,
  input: { code: string; jurisdictionCode: string; sourceSnapshotReferences: readonly string[] },
): JurisdictionSourceBundle {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.SOURCE_BUNDLE_MANAGE);
  assertStableCode(input.code, "jurisdiction source bundle");
  assertJurisdictionCode(input.jurisdictionCode, "jurisdiction");

  if (input.sourceSnapshotReferences.length === 0) {
    throw new Error("A jurisdiction source bundle requires at least one source snapshot reference");
  }

  return {
    code: input.code,
    jurisdictionCode: input.jurisdictionCode,
    sourceSnapshotReferences: input.sourceSnapshotReferences.map((reference) =>
      requireText(reference, "sourceSnapshotReference"),
    ),
    freshnessStatus: "unknown",
    approvedForAutomation: false,
    status: "draft",
    createdBy: actor.actorId,
  };
}

export function createJurisdictionRulePack(
  actor: JurisdictionAutomationActorContext,
  input: { code: string; jurisdictionCode: string; sourceBundle: JurisdictionSourceBundle; version: string },
): JurisdictionRulePack {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.RULE_PACK_MANAGE);
  assertStableCode(input.code, "jurisdiction rule pack");
  assertJurisdictionCode(input.jurisdictionCode, "jurisdiction");

  if (input.sourceBundle.jurisdictionCode !== input.jurisdictionCode) {
    throw new Error("The source bundle must belong to the rule pack jurisdiction");
  }

  return {
    code: input.code,
    jurisdictionCode: input.jurisdictionCode,
    sourceBundleCode: input.sourceBundle.code,
    version: requireText(input.version, "version"),
    status: "draft",
    sourceGrounded: false,
    approvedForUse: false,
    immutableAfterApproval: true,
    createdBy: actor.actorId,
  };
}

export function createJurisdictionResolutionRequest(
  actor: JurisdictionAutomationActorContext,
  input: {
    requestCode: string;
    serviceCode: string;
    asOfDate: string;
    subjectReferences: readonly string[];
    factStates: readonly JurisdictionFactState[];
  },
): JurisdictionResolutionRequest {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.RESOLUTION_REQUEST_CREATE);
  assertStableCode(input.requestCode, "jurisdiction resolution request");
  assertStableCode(input.serviceCode, "service");

  if (input.subjectReferences.length === 0) {
    throw new Error("At least one scoped subject reference is required");
  }

  return {
    requestCode: input.requestCode,
    serviceCode: input.serviceCode,
    asOfDate: requireText(input.asOfDate, "asOfDate"),
    subjectReferences: input.subjectReferences.map((reference) => requireText(reference, "subjectReference")),
    factStates: input.factStates.map((fact) => {
      assertStableCode(fact.code, "jurisdiction fact");
      return { code: fact.code, state: fact.state };
    }),
    containsPreciseLocation: false,
    status: "captured",
    createdBy: actor.actorId,
  };
}

export function resolveJurisdictionCandidate(
  actor: JurisdictionAutomationActorContext,
  request: JurisdictionResolutionRequest,
  rulePack: JurisdictionRulePack,
): JurisdictionResolution {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.RESOLUTION_RUN);

  return {
    requestCode: request.requestCode,
    rulePackCode: rulePack.code,
    status: "blocked_runtime_disabled",
    applicability: "unknown",
    legalAdviceProvided: false,
    finalLegalDetermination: false,
    portalSubmissionAuthorized: false,
    sourceFreshness: "unknown",
    missingFactCodes: request.factStates
      .filter((fact) => fact.state !== "known")
      .map((fact) => fact.code),
    needsHumanReview: true,
  };
}

export function createJurisdictionConflict(
  actor: JurisdictionAutomationActorContext,
  input: { code: string; requestCode: string; conflictingSourceReferences: readonly string[] },
): JurisdictionConflict {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.CONFLICT_MANAGE);
  assertStableCode(input.code, "jurisdiction conflict");
  assertStableCode(input.requestCode, "jurisdiction resolution request");

  if (input.conflictingSourceReferences.length < 2) {
    throw new Error("A jurisdiction conflict requires at least two source references");
  }

  return {
    code: input.code,
    requestCode: input.requestCode,
    conflictingSourceReferences: input.conflictingSourceReferences.map((reference) =>
      requireText(reference, "conflictingSourceReference"),
    ),
    status: "review_required",
    resolvedHeuristically: false,
    createdBy: actor.actorId,
  };
}

export function createJurisdictionPortalBinding(
  actor: JurisdictionAutomationActorContext,
  input: { code: string; jurisdictionCode: string; rulePackCode: string },
): JurisdictionPortalBinding {
  assertPermission(actor, JURISDICTION_AUTOMATION_PERMISSIONS.PORTAL_BINDING_MANAGE);
  assertStableCode(input.code, "jurisdiction portal binding");
  assertJurisdictionCode(input.jurisdictionCode, "jurisdiction");
  assertStableCode(input.rulePackCode, "jurisdiction rule pack");

  return {
    code: input.code,
    jurisdictionCode: input.jurisdictionCode,
    rulePackCode: input.rulePackCode,
    status: "draft",
    portalSelected: false,
    browserDispatchAuthorized: false,
    submissionAuthorized: false,
    createdBy: actor.actorId,
  };
}

function assertPermission(
  actor: JurisdictionAutomationActorContext,
  permission: JurisdictionAutomationPermission,
): void {
  if (!actor.permissions.includes(permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}

function assertStableCode(value: string, label: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) {
    throw new Error(`${label} must use a stable uppercase code`);
  }
}

function assertJurisdictionCode(value: string, label: string): void {
  if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(value)) {
    throw new Error(`${label} must use a stable uppercase code`);
  }
}

function requireText(value: string, label: string): string {
  if (!value.trim()) {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}
