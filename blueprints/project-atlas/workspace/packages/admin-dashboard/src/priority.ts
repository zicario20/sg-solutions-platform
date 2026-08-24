import type { AdminDashboardSeverity, AdminDashboardWorkItem } from "./contracts.ts";

const severityWeight: Readonly<Record<AdminDashboardSeverity, number>> = Object.freeze({
  critical: 500,
  high: 300,
  medium: 160,
  low: 60,
  information: 10,
});
export function calculateAdminDashboardPriority(
  input: Readonly<{
    severity: AdminDashboardSeverity;
    overdue?: boolean;
    clientBlocked?: boolean;
    complianceRelated?: boolean;
    ageHours?: number;
  }>,
): number {
  return (
    severityWeight[input.severity] +
    (input.overdue ? 140 : 0) +
    (input.clientBlocked ? 120 : 0) +
    (input.complianceRelated ? 100 : 0) +
    Math.min(Math.max(input.ageHours ?? 0, 0), 72)
  );
}
export function prioritizeAdminWork(
  items: readonly AdminDashboardWorkItem[],
): readonly AdminDashboardWorkItem[] {
  return Object.freeze(
    [...items]
      .sort(
        (left, right) =>
          right.priorityScore - left.priorityScore || left.title.localeCompare(right.title),
      )
      .slice(0, 8),
  );
}
