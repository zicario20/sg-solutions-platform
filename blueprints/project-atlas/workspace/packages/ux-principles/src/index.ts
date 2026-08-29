export const UX_PRINCIPLES_MODULE = "M088" as const;

export const UX_PRINCIPLES_PERMISSIONS = [
  "ux.configuration.create",
  "ux.principle.create",
  "ux.journey.create",
  "ux.state.create",
  "ux.interaction.create",
  "ux.review.request",
  "ux.journey.evaluate",
] as const;

export type UxPrinciplesPermission = (typeof UX_PRINCIPLES_PERMISSIONS)[number];

export const UX_PRINCIPLES_RUNTIME = {
  principleActivation: false,
  journeyRuntime: false,
  experienceStateRendering: false,
  interactionEnforcement: false,
  reviewExecution: false,
  userFeedbackDelivery: false,
  telemetry: false,
} as const;

export type UxPrincipleCategory =
  | "clarity"
  | "progressive_disclosure"
  | "system_status"
  | "error_recovery"
  | "trust"
  | "accessibility"
  | "localization";
export type JourneyStageKind = "entry" | "form" | "review" | "submission" | "async_wait" | "human_review" | "completion" | "failure";
export type ExperienceStateKind = "local_loading" | "backend_processing" | "waiting_on_provider" | "waiting_on_human" | "completed" | "failed";

export interface UxPrinciplesConfiguration {
  readonly module: typeof UX_PRINCIPLES_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly visualSystemReference: "M087";
}

export interface UxPrinciple {
  readonly code: string;
  readonly configurationCode: string;
  readonly category: UxPrincipleCategory;
  readonly status: "draft";
  readonly active: false;
}

export interface UserJourneyDefinition {
  readonly journeyCode: string;
  readonly configurationCode: string;
  readonly stage: JourneyStageKind;
  readonly status: "draft";
  readonly active: false;
  readonly runtimeEnabled: false;
}

export interface ExperienceStateDefinition {
  readonly stateCode: string;
  readonly journeyCode: string;
  readonly kind: ExperienceStateKind;
  readonly status: "draft";
  readonly active: false;
  readonly stateRendered: false;
}

export interface InteractionContract {
  readonly contractCode: string;
  readonly journeyCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly confirmationIsApproval: false;
  readonly canonicalAuthorizationDelegated: true;
}

export interface UxReviewRequest {
  readonly reviewCode: string;
  readonly configurationCode: string;
  readonly status: "review_required";
  readonly researchExecuted: false;
  readonly accessibilityReviewCompleted: false;
  readonly productReviewCompleted: false;
}

export interface JourneyEvaluationResult {
  readonly journeyCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly evaluated: false;
  readonly userDataRead: false;
  readonly telemetryRecorded: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: UxPrinciplesPermission): void {
  if (!UX_PRINCIPLES_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported UX-principles permission: ${permission}.`);
  }
}

export function createUxPrinciplesConfiguration(input: {
  readonly permission: UxPrinciplesPermission;
  readonly code: string;
}): UxPrinciplesConfiguration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "UX principles configuration code");

  return {
    module: UX_PRINCIPLES_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    visualSystemReference: "M087",
  };
}

export function createUxPrinciple(input: {
  readonly permission: UxPrinciplesPermission;
  readonly code: string;
  readonly configuration: UxPrinciplesConfiguration;
  readonly category: UxPrincipleCategory;
}): UxPrinciple {
  requirePermission(input.permission);
  requireIdentifier(input.code, "UX principle code");

  return {
    code: input.code,
    configurationCode: input.configuration.code,
    category: input.category,
    status: "draft",
    active: false,
  };
}

export function createUserJourneyDefinition(input: {
  readonly permission: UxPrinciplesPermission;
  readonly journeyCode: string;
  readonly configuration: UxPrinciplesConfiguration;
  readonly stage: JourneyStageKind;
  readonly bypassesCanonicalWorkflow?: boolean;
}): UserJourneyDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.journeyCode, "User journey code");
  if (input.bypassesCanonicalWorkflow) {
    throw new Error("UX journeys cannot bypass canonical workflow state.");
  }

  return {
    journeyCode: input.journeyCode,
    configurationCode: input.configuration.code,
    stage: input.stage,
    status: "draft",
    active: false,
    runtimeEnabled: false,
  };
}

export function createExperienceStateDefinition(input: {
  readonly permission: UxPrinciplesPermission;
  readonly stateCode: string;
  readonly journey: UserJourneyDefinition;
  readonly kind: ExperienceStateKind;
}): ExperienceStateDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.stateCode, "Experience state code");

  return {
    stateCode: input.stateCode,
    journeyCode: input.journey.journeyCode,
    kind: input.kind,
    status: "draft",
    active: false,
    stateRendered: false,
  };
}

export function createInteractionContract(input: {
  readonly permission: UxPrinciplesPermission;
  readonly contractCode: string;
  readonly journey: UserJourneyDefinition;
  readonly treatsConfirmationAsApproval?: boolean;
}): InteractionContract {
  requirePermission(input.permission);
  requireIdentifier(input.contractCode, "Interaction contract code");
  if (input.treatsConfirmationAsApproval) {
    throw new Error("A UX confirmation cannot substitute approval or authorization.");
  }

  return {
    contractCode: input.contractCode,
    journeyCode: input.journey.journeyCode,
    status: "draft",
    active: false,
    confirmationIsApproval: false,
    canonicalAuthorizationDelegated: true,
  };
}

export function requestUxReview(input: {
  readonly permission: UxPrinciplesPermission;
  readonly reviewCode: string;
  readonly configuration: UxPrinciplesConfiguration;
}): UxReviewRequest {
  requirePermission(input.permission);
  requireIdentifier(input.reviewCode, "UX review code");

  return {
    reviewCode: input.reviewCode,
    configurationCode: input.configuration.code,
    status: "review_required",
    researchExecuted: false,
    accessibilityReviewCompleted: false,
    productReviewCompleted: false,
  };
}

export function evaluateUserJourney(input: {
  readonly permission: UxPrinciplesPermission;
  readonly journey: UserJourneyDefinition;
}): JourneyEvaluationResult {
  requirePermission(input.permission);

  return {
    journeyCode: input.journey.journeyCode,
    status: "blocked_runtime_disabled",
    evaluated: false,
    userDataRead: false,
    telemetryRecorded: false,
  };
}
