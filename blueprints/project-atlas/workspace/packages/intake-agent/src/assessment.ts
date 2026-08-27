import type {
  IntakeCompletionAssessment,
  IntakeCompletionStatus,
  IntakeReadinessAssessment,
  IntakeReadinessDestination,
  IntakeRequiredItem,
} from "./contracts.js";

export function evaluateIntakeCompletion(input: {
  readonly requiredItems: readonly IntakeRequiredItem[];
}): IntakeCompletionAssessment {
  const requiredItems = input.requiredItems.filter((item) => item.status !== "not_applicable");
  const missingItemIds = requiredItems
    .filter((item) => item.status === "missing")
    .map((item) => item.id);
  const blockingItemIds = requiredItems
    .filter((item) => item.status === "blocked")
    .map((item) => item.id);
  const warningItemIds = requiredItems
    .filter((item) => item.status === "warning")
    .map((item) => item.id);
  const completedRequiredCount = requiredItems.filter((item) => item.status === "satisfied").length;
  let status: IntakeCompletionStatus = "complete";
  if (blockingItemIds.length > 0) {
    status = "blocked";
  } else if (missingItemIds.length > 0) {
    status = "incomplete";
  } else if (warningItemIds.length > 0) {
    status = "complete_with_conditions";
  }
  return {
    status,
    missingItemIds,
    blockingItemIds,
    warningItemIds,
    completedRequiredCount,
    totalRequiredCount: requiredItems.length,
    assessmentScope: "intake_only",
    serviceStartPermitted: false,
  };
}

export function assessIntakeReadiness(input: {
  readonly completionStatus: IntakeCompletionStatus;
  readonly destination: IntakeReadinessDestination;
  readonly requiredDocumentsCurrent: boolean;
  readonly requiredConsentCurrent: boolean;
  readonly paymentGateSatisfied?: boolean;
  readonly humanApprovalPresent?: boolean;
}): IntakeReadinessAssessment {
  const blockingReasons: string[] = [];
  if (
    input.completionStatus !== "complete" &&
    input.completionStatus !== "complete_with_conditions"
  ) {
    blockingReasons.push("intake_completion_not_satisfied");
  }
  if (!input.requiredDocumentsCurrent) {
    blockingReasons.push("required_documents_not_current");
  }
  if (!input.requiredConsentCurrent) {
    blockingReasons.push("required_consent_not_current");
  }
  if (input.destination === "workflow_start_review") {
    if (!input.paymentGateSatisfied) {
      blockingReasons.push("payment_gate_not_satisfied");
    }
    if (!input.humanApprovalPresent) {
      blockingReasons.push("human_approval_required");
    }
  }
  if (input.destination === "external_submission_review") {
    blockingReasons.push("external_submission_requires_authorized_owner");
  }
  return {
    destination: input.destination,
    status: blockingReasons.length > 0 ? "not_ready" : "ready",
    blockingReasons,
    assessmentScope: "destination_readiness_only",
    workflowMutationPermitted: false,
    externalSubmissionPermitted: false,
  };
}
