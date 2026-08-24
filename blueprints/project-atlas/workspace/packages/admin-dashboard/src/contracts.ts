export const ADMIN_DASHBOARD_ROLES = [
  "owner",
  "administrator",
  "support",
  "specialist",
  "compliance_reviewer",
  "auditor",
] as const;
export type AdminDashboardRole = (typeof ADMIN_DASHBOARD_ROLES)[number];
export const ADMIN_DASHBOARD_WIDGET_CODES = [
  "critical_alerts",
  "priority_work",
  "operational_summary",
  "approvals",
  "team_workload",
  "communications",
  "appointments",
  "documents",
  "payments",
  "integrations",
  "recent_activity",
] as const;
export type AdminDashboardWidgetCode = (typeof ADMIN_DASHBOARD_WIDGET_CODES)[number];
export type AdminDashboardLocale = "es" | "en";
export type AdminDashboardEvidenceState =
  | "complete"
  | "partial"
  | "stale"
  | "unavailable"
  | "suppressed";
export type AdminDashboardSeverity = "critical" | "high" | "medium" | "low" | "information";
export type AdminDashboardDestination =
  | "crm"
  | "clients"
  | "services"
  | "documents"
  | "calendar"
  | "communications"
  | "approvals"
  | "payments"
  | "reports"
  | "settings";

export type AdminDashboardAuthorizationSnapshot = Readonly<{
  accountId: string;
  sessionId: string;
  role: AdminDashboardRole;
  permissions: readonly string[];
  teamRefs: readonly string[];
  authorizationEpoch: string;
  policyEpoch: string;
  locale: AdminDashboardLocale;
  capturedAt: Date;
}>;

export type AdminDashboardMetric = Readonly<{
  code: string;
  label: string;
  valueLabel: string;
  detail?: string;
  trendLabel?: string;
}>;
export type AdminDashboardWorkItem = Readonly<{
  opaqueRef: string;
  title: string;
  category: string;
  severity: AdminDashboardSeverity;
  dueLabel?: string;
  ownerLabel?: string;
  destination: AdminDashboardDestination;
  priorityScore: number;
}>;
export type AdminDashboardIntegration = Readonly<{
  code: string;
  label: string;
  state: "healthy" | "degraded" | "disconnected" | "error" | "maintenance" | "unknown";
  detail?: string;
  asOf?: string;
}>;
export type AdminDashboardActivity = Readonly<{
  opaqueRef: string;
  label: string;
  occurredLabel: string;
  destination?: AdminDashboardDestination;
}>;
export type AdminDashboardWidgetData = Readonly<{
  metrics?: readonly AdminDashboardMetric[];
  items?: readonly AdminDashboardWorkItem[];
  integrations?: readonly AdminDashboardIntegration[];
  activity?: readonly AdminDashboardActivity[];
}>;
export type AdminDashboardWidgetResult = Readonly<{
  code: AdminDashboardWidgetCode;
  title: string;
  state: AdminDashboardEvidenceState;
  asOf?: string;
  data?: AdminDashboardWidgetData;
  safeReason?: "source_unavailable" | "policy_suppressed" | "stale_projection";
}>;
export type AdminDashboardDto = Readonly<{
  locale: AdminDashboardLocale;
  generatedAt: string;
  widgets: readonly AdminDashboardWidgetResult[];
}>;

export type AdminDashboardWidgetDefinition = Readonly<{
  code: AdminDashboardWidgetCode;
  titleKey: string;
  permission: string;
  roles: readonly AdminDashboardRole[];
  mandatory?: boolean;
}>;
export const ADMIN_DASHBOARD_WIDGET_DEFINITIONS: readonly AdminDashboardWidgetDefinition[] =
  Object.freeze([
    {
      code: "critical_alerts",
      titleKey: "criticalAlerts",
      permission: "admin.dashboard.alerts.read",
      roles: ["owner", "administrator", "compliance_reviewer"],
      mandatory: true,
    },
    {
      code: "priority_work",
      titleKey: "priorityWork",
      permission: "admin.dashboard.work.read",
      roles: ["owner", "administrator", "support", "specialist", "compliance_reviewer", "auditor"],
      mandatory: true,
    },
    {
      code: "operational_summary",
      titleKey: "operationalSummary",
      permission: "admin.dashboard.summary.read",
      roles: ["owner", "administrator", "specialist", "auditor"],
    },
    {
      code: "approvals",
      titleKey: "approvals",
      permission: "admin.dashboard.approvals.read",
      roles: ["owner", "administrator", "compliance_reviewer"],
    },
    {
      code: "team_workload",
      titleKey: "teamWorkload",
      permission: "admin.dashboard.workload.read",
      roles: ["owner", "administrator"],
    },
    {
      code: "communications",
      titleKey: "communications",
      permission: "admin.dashboard.communications.read",
      roles: ["owner", "administrator", "support", "specialist"],
    },
    {
      code: "appointments",
      titleKey: "appointments",
      permission: "admin.dashboard.appointments.read",
      roles: ["owner", "administrator", "support", "specialist"],
    },
    {
      code: "documents",
      titleKey: "documents",
      permission: "admin.dashboard.documents.read",
      roles: ["owner", "administrator", "specialist", "compliance_reviewer"],
    },
    {
      code: "payments",
      titleKey: "payments",
      permission: "admin.dashboard.payments.read",
      roles: ["owner", "administrator"],
    },
    {
      code: "integrations",
      titleKey: "integrations",
      permission: "admin.dashboard.integrations.read",
      roles: ["owner", "administrator"],
    },
    {
      code: "recent_activity",
      titleKey: "recentActivity",
      permission: "admin.dashboard.activity.read",
      roles: ["owner", "administrator", "support", "specialist", "compliance_reviewer", "auditor"],
    },
  ]);

export class AdminDashboardContractError extends Error {
  constructor(message = "ADMIN_DASHBOARD_CONTRACT_INVALID") {
    super(message);
    this.name = "AdminDashboardContractError";
  }
}

const unsafeKeys = new Set([
  "email",
  "phone",
  "ssn",
  "itin",
  "ein",
  "password",
  "token",
  "secret",
  "document",
  "messagebody",
  "creditreport",
  "taxreturn",
  "bankaccount",
]);
export function assertAdminDashboardSafeData(value: unknown): void {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  )
    return;
  if (typeof value === "string") {
    if (value.length > 280 || [...value].some((character) => (character.codePointAt(0) ?? 0) < 32))
      throw new AdminDashboardContractError();
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 24) throw new AdminDashboardContractError();
    value.forEach(assertAdminDashboardSafeData);
    return;
  }
  if (typeof value !== "object") throw new AdminDashboardContractError();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (unsafeKeys.has(key.replace(/[_-]/gu, "").toLowerCase()))
      throw new AdminDashboardContractError("ADMIN_DASHBOARD_UNSAFE_FIELD");
    assertAdminDashboardSafeData(child);
  }
}

export function authorizedAdminWidgets(
  snapshot: AdminDashboardAuthorizationSnapshot,
): readonly AdminDashboardWidgetDefinition[] {
  return Object.freeze(
    ADMIN_DASHBOARD_WIDGET_DEFINITIONS.filter(
      (widget) =>
        widget.roles.includes(snapshot.role) && snapshot.permissions.includes(widget.permission),
    ),
  );
}
