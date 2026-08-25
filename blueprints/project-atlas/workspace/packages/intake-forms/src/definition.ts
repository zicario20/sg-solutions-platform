import { validatePublishedDefinition } from "@atlas/domain";
import type {
  IntakeDefinitionStatus,
  IntakeFormDefinition,
  IntakePublishResult,
  IntakeSubmissionActionPlan,
} from "./contracts.ts";

const CODE = /^[a-z][a-z0-9_]{1,63}$/u;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const legalTransitions: Readonly<
  Record<IntakeDefinitionStatus, readonly IntakeDefinitionStatus[]>
> = {
  draft: ["under_review", "archived"],
  under_review: ["draft", "approved", "archived"],
  approved: ["published", "draft", "archived"],
  published: ["paused", "retired"],
  paused: ["published", "retired"],
  retired: ["archived"],
  archived: [],
};
export function validateIntakeDefinition(definition: IntakeFormDefinition): IntakeFormDefinition {
  if (
    !CODE.test(definition.code) ||
    !SEMVER.test(definition.version) ||
    definition.submissionActions.length === 0 ||
    definition.requiredDisclosureCodes.length === 0
  )
    throw new Error("INTAKE_DEFINITION_INVALID");
  if (new Set(definition.submissionActions).size !== definition.submissionActions.length)
    throw new Error("INTAKE_ACTION_DUPLICATE");
  if (
    new Set(definition.requiredDisclosureCodes).size !==
      definition.requiredDisclosureCodes.length ||
    definition.requiredDisclosureCodes.some((code) => !CODE.test(code))
  )
    throw new Error("INTAKE_DISCLOSURE_INVALID");
  validatePublishedDefinition(definition.publicDefinition);
  return definition;
}
export function evaluateIntakePublication(definition: IntakeFormDefinition): IntakePublishResult {
  const blockers: string[] = [];
  try {
    validateIntakeDefinition(definition);
  } catch {
    blockers.push("definition_invalid");
  }
  if (definition.status !== "approved" && definition.status !== "published")
    blockers.push("approval_required");
  return { publishable: blockers.length === 0, blockers: Object.freeze(blockers) };
}
export function transitionIntakeDefinition(
  definition: IntakeFormDefinition,
  next: IntakeDefinitionStatus,
): IntakeFormDefinition {
  if (!legalTransitions[definition.status].includes(next))
    throw new Error("INTAKE_TRANSITION_FORBIDDEN");
  if (next === "published" && !evaluateIntakePublication(definition).publishable)
    throw new Error("INTAKE_PUBLICATION_BLOCKED");
  return { ...definition, status: next };
}
export function planIntakeSubmission(definition: IntakeFormDefinition): IntakeSubmissionActionPlan {
  if (definition.status !== "published") throw new Error("INTAKE_FORM_UNAVAILABLE");
  return {
    status: "pending_owner_dispatch",
    formCode: definition.code,
    formVersion: definition.version,
    actions: Object.freeze([...definition.submissionActions]),
  };
}
