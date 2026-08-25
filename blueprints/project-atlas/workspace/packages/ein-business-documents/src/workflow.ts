import type { EinCaseStatus, EinProviderConfiguration } from "./contracts.ts";

const transitions: Readonly<Record<EinCaseStatus, readonly EinCaseStatus[]>> = {
  intake_pending: ["intake_in_progress", "cancelled"],
  intake_in_progress: ["internal_review", "additional_information_required", "cancelled"],
  internal_review: [
    "client_review",
    "authorization_pending",
    "additional_information_required",
    "cancelled",
  ],
  client_review: [
    "authorization_pending",
    "internal_review",
    "additional_information_required",
    "cancelled",
  ],
  authorization_pending: ["ready_to_submit", "client_review", "cancelled"],
  ready_to_submit: ["submission_prepared", "internal_review", "cancelled"],
  submission_prepared: ["submitted", "outcome_review", "correction_required", "cancelled"],
  submitted: ["provider_processing", "outcome_review", "issued", "additional_information_required"],
  provider_processing: ["issued", "outcome_review", "additional_information_required"],
  outcome_review: ["issued", "correction_required", "additional_information_required"],
  additional_information_required: ["internal_review", "client_review", "cancelled"],
  correction_required: ["internal_review", "client_review", "cancelled"],
  issued: ["issuance_verification"],
  issuance_verification: ["completed", "outcome_review"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export function evaluateEinWorkflowTransition(input: {
  current: EinCaseStatus;
  target: EinCaseStatus;
  provider?: EinProviderConfiguration;
  operationalApproval?: boolean;
}): Readonly<{
  allowed: boolean;
  reason?: "INVALID_TRANSITION" | "PROVIDER_DISABLED" | "OPERATIONAL_APPROVAL_REQUIRED";
}> {
  if (!transitions[input.current].includes(input.target))
    return { allowed: false, reason: "INVALID_TRANSITION" };
  if (input.target === "submission_prepared") {
    if (!input.operationalApproval)
      return { allowed: false, reason: "OPERATIONAL_APPROVAL_REQUIRED" };
    if (
      !input.provider ||
      input.provider.killSwitchEnabled ||
      input.provider.status !== "enabled" ||
      !input.provider.supportsSubmission
    )
      return { allowed: false, reason: "PROVIDER_DISABLED" };
  }
  return { allowed: true };
}
