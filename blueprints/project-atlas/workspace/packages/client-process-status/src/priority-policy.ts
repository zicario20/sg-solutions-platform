import { type DashboardPriorityInput, selectDashboardPriority } from "@atlas/dashboard";
export const PROCESS_PRIORITY_POLICY_VERSION = "m010.priority.m008.v1" as const;
export function selectProcessPriority(input: DashboardPriorityInput) {
  return selectDashboardPriority(input);
}
