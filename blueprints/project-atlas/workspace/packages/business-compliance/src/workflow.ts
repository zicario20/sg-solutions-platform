import type { ComplianceCaseStatus, ComplianceProviderConfiguration } from "./contracts.ts";

const transitions: Readonly<Record<ComplianceCaseStatus, readonly ComplianceCaseStatus[]>> = {
  draft: ["monitoring", "upcoming", "cancelled"],
  monitoring: ["upcoming", "action_required", "blocked", "cancelled"],
  upcoming: ["action_required", "client_action_required", "preparing", "overdue", "cancelled"],
  action_required: ["client_action_required", "preparing", "blocked", "overdue", "cancelled"],
  client_action_required: ["preparing", "action_required", "overdue", "cancelled"],
  preparing: ["review_pending", "client_action_required", "blocked", "cancelled"],
  review_pending: ["ready_to_file", "preparing", "blocked", "cancelled"],
  ready_to_file: ["submitted", "preparing", "blocked", "cancelled"],
  submitted: ["processing", "completed", "blocked"],
  processing: ["completed", "blocked"],
  completed: ["archived"],
  overdue: ["action_required", "preparing", "blocked", "cancelled"],
  blocked: ["action_required", "preparing", "cancelled"],
  cancelled: ["archived"],
  archived: [],
};

export function evaluateComplianceWorkflowTransition(input: {
  current: ComplianceCaseStatus;
  target: ComplianceCaseStatus;
  provider?: ComplianceProviderConfiguration;
  operationalApproval?: boolean;
}): Readonly<{
  allowed: boolean;
  reason?: "INVALID_TRANSITION" | "PROVIDER_DISABLED" | "OPERATIONAL_APPROVAL_REQUIRED";
}> {
  if (!transitions[input.current].includes(input.target))
    return { allowed: false, reason: "INVALID_TRANSITION" };
  if (input.target === "submitted") {
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
