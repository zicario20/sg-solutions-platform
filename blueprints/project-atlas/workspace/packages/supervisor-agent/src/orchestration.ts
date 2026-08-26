import {
  assertExactVersionReference,
  assertNoPrivateReasoning,
  assertSupervisorText,
  type SupervisorRisk,
} from "./contracts.js";

export type SupervisorOrchestrationStrategy = "parallel" | "sequential";
export type SupervisorWorkUnitKind = "analysis" | "information_request" | "review" | "synthesis";
export type SupervisorWorkUnitStatus = "blocked" | "prepared" | "waiting_for_review";

export interface SupervisorWorkUnitDefinition {
  readonly code: string;
  readonly specialistCode: string;
  readonly kind: SupervisorWorkUnitKind;
  readonly risk: SupervisorRisk;
  readonly dependsOn: readonly string[];
  readonly contextScope: readonly string[];
  readonly independentlyExecutable: boolean;
}

export interface SupervisorOrchestrationPlanInput {
  readonly id: string;
  readonly taskReference: string;
  readonly routingDecisionReference: string;
  readonly strategy: SupervisorOrchestrationStrategy;
  readonly maximumDelegationDepth: number;
  readonly workUnits: readonly SupervisorWorkUnitDefinition[];
  readonly parallelPlanningApproved: boolean;
  readonly createdAt: string;
}

export interface SupervisorOrchestrationPlan extends SupervisorOrchestrationPlanInput {
  readonly status: "prepared";
  readonly executionPermitted: false;
}

export interface SpecialistContextPackage {
  readonly taskReference: string;
  readonly workUnitCode: string;
  readonly recipientSpecialistCode: string;
  readonly purpose: string;
  readonly factReferences: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly expiresAt: string;
}

export interface SpecialistResult {
  readonly workUnitCode: string;
  readonly status: "completed" | "failed" | "partial";
  readonly conclusion: string;
  readonly evidenceReferences: readonly string[];
  readonly confidence: "low" | "medium" | "high";
}

export interface SupervisorMergedResult {
  readonly status: "completed" | "partial" | "requires_review";
  readonly clientSafeSummary: string;
  readonly evidenceReferences: readonly string[];
  readonly conflictingWorkUnitCodes: readonly string[];
}

function assertNoDependencyCycle(workUnits: readonly SupervisorWorkUnitDefinition[]): void {
  const graph = new Map(workUnits.map((workUnit) => [workUnit.code, workUnit.dependsOn]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (code: string): void => {
    if (visiting.has(code)) throw new TypeError("orchestration plan contains a dependency cycle");
    if (visited.has(code)) return;
    visiting.add(code);
    (graph.get(code) ?? []).forEach((dependency) => {
      if (!graph.has(dependency))
        throw new TypeError(`unknown work unit dependency: ${dependency}`);
      visit(dependency);
    });
    visiting.delete(code);
    visited.add(code);
  };
  [...graph.keys()].forEach((code) => {
    visit(code);
  });
}

export function createOrchestrationPlan(
  value: SupervisorOrchestrationPlanInput,
): SupervisorOrchestrationPlan {
  assertSupervisorText(value.id, "orchestration plan id", 160);
  assertExactVersionReference(value.taskReference, "orchestration task reference");
  assertExactVersionReference(value.routingDecisionReference, "routing decision reference");
  if (!Number.isInteger(value.maximumDelegationDepth) || value.maximumDelegationDepth < 0)
    throw new TypeError("maximum delegation depth must be a non-negative integer");
  if (value.workUnits.length === 0) throw new TypeError("orchestration plan requires work units");

  const workUnitCodes = new Set<string>();
  value.workUnits.forEach((workUnit) => {
    assertSupervisorText(workUnit.code, "work unit code", 96);
    assertSupervisorText(workUnit.specialistCode, "work unit specialist code", 96);
    if (workUnitCodes.has(workUnit.code))
      throw new TypeError("orchestration work unit codes must be unique");
    workUnitCodes.add(workUnit.code);
    if (workUnit.contextScope.length === 0)
      throw new TypeError("work unit context scope is required");
    workUnit.contextScope.forEach((field) => {
      assertNoPrivateReasoning(field, "work unit context field");
    });
  });
  assertNoDependencyCycle(value.workUnits);

  if (value.strategy === "parallel") {
    if (!value.parallelPlanningApproved)
      throw new TypeError("parallel planning requires explicit approval");
    value.workUnits.forEach((workUnit) => {
      if (workUnit.risk !== "low" || !workUnit.independentlyExecutable)
        throw new TypeError("parallel work units must be isolated and low risk");
    });
  }

  return Object.freeze({
    ...value,
    status: "prepared" as const,
    executionPermitted: false as const,
  });
}

export function createSpecialistContextPackage(
  value: SpecialistContextPackage,
): SpecialistContextPackage {
  assertExactVersionReference(value.taskReference, "context task reference");
  assertSupervisorText(value.workUnitCode, "context work unit code", 96);
  assertSupervisorText(value.recipientSpecialistCode, "context recipient specialist code", 96);
  assertNoPrivateReasoning(value.purpose, "context purpose");
  if (value.factReferences.length === 0 || value.sourceReferences.length === 0)
    throw new TypeError("context package requires minimized facts and sources");
  [...value.factReferences, ...value.sourceReferences].forEach((reference) => {
    assertNoPrivateReasoning(reference, "context reference");
  });
  if (Number.isNaN(Date.parse(value.expiresAt)))
    throw new TypeError("context expiry must be a date");
  return Object.freeze({
    ...value,
    factReferences: Object.freeze([...value.factReferences]),
    sourceReferences: Object.freeze([...value.sourceReferences]),
  });
}

export function mergeSpecialistResults(input: {
  readonly policy: "require_review_on_conflict" | "summarize_consistent_results";
  readonly results: readonly SpecialistResult[];
}): SupervisorMergedResult {
  if (input.results.length === 0) throw new TypeError("specialist results are required");
  input.results.forEach((result) => {
    assertSupervisorText(result.workUnitCode, "specialist result work unit code", 96);
    assertNoPrivateReasoning(result.conclusion, "specialist result conclusion");
    if (result.evidenceReferences.length === 0)
      throw new TypeError("specialist result evidence is required");
  });

  const completed = input.results.filter((result) => result.status === "completed");
  const conclusions = new Set(completed.map((result) => result.conclusion.trim().toLowerCase()));
  const conflicting = conclusions.size > 1;
  const evidenceReferences = input.results.flatMap((result) => result.evidenceReferences);

  if (conflicting && input.policy === "require_review_on_conflict") {
    return {
      status: "requires_review",
      clientSafeSummary:
        "The available information needs human review before a response is finalized.",
      evidenceReferences,
      conflictingWorkUnitCodes: completed.map((result) => result.workUnitCode),
    };
  }

  return {
    status: completed.length === input.results.length ? "completed" : "partial",
    clientSafeSummary: "The supervisor prepared a bounded summary for authorized human review.",
    evidenceReferences,
    conflictingWorkUnitCodes: [],
  };
}
