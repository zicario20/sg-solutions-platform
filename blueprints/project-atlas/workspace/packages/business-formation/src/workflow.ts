import type { FormationCaseStatus } from "./contracts.ts";

export type FormationWorkflowTransitionInput = Readonly<{
  from: FormationCaseStatus;
  to: FormationCaseStatus;
  hasStartApproval: boolean;
  providerEnabled: boolean;
}>;

export type FormationWorkflowTransitionResult =
  | Readonly<{ allowed: true }>
  | Readonly<{
      allowed: false;
      reason:
        | "FORMATION_TRANSITION_NOT_ALLOWED"
        | "FORMATION_START_APPROVAL_REQUIRED"
        | "FORMATION_PROVIDER_DISABLED";
    }>;

const FORMATION_TRANSITIONS: Readonly<Record<FormationCaseStatus, readonly FormationCaseStatus[]>> =
  {
    draft: ["intake_pending", "cancelled"],
    intake_pending: ["intake_in_progress", "cancelled"],
    intake_in_progress: ["eligibility_review", "formation_data_pending", "cancelled"],
    eligibility_review: ["name_review", "formation_data_pending", "cancelled"],
    name_review: ["formation_data_pending", "cancelled"],
    formation_data_pending: ["document_preparation", "cancelled"],
    document_preparation: ["internal_review", "formation_data_pending", "cancelled"],
    internal_review: ["client_review", "formation_data_pending", "cancelled"],
    client_review: ["signature_pending", "formation_data_pending", "cancelled"],
    signature_pending: ["payment_pending", "client_review", "cancelled"],
    payment_pending: ["ready_to_file", "cancelled"],
    ready_to_file: ["filing_in_progress", "formation_data_pending", "cancelled"],
    filing_in_progress: ["state_processing", "state_action_required", "cancelled"],
    state_processing: ["approved", "rejected", "state_action_required", "cancelled"],
    state_action_required: ["document_preparation", "filing_in_progress", "cancelled"],
    approved: ["post_formation", "cancelled"],
    rejected: ["document_preparation", "cancelled"],
    post_formation: ["completed", "cancelled"],
    completed: ["archived"],
    cancelled: ["archived"],
    archived: [],
  };

export function evaluateFormationWorkflowTransition(
  input: FormationWorkflowTransitionInput,
): FormationWorkflowTransitionResult {
  if (!FORMATION_TRANSITIONS[input.from].includes(input.to)) {
    return { allowed: false, reason: "FORMATION_TRANSITION_NOT_ALLOWED" };
  }
  if (input.to === "filing_in_progress" && !input.hasStartApproval) {
    return { allowed: false, reason: "FORMATION_START_APPROVAL_REQUIRED" };
  }
  if (input.to === "filing_in_progress" && !input.providerEnabled) {
    return { allowed: false, reason: "FORMATION_PROVIDER_DISABLED" };
  }
  return { allowed: true };
}
