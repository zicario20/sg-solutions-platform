export const DASHBOARD_EVENT_NAMES = [
  "client_dashboard_viewed",
  "client_dashboard_priority_viewed",
  "client_dashboard_priority_clicked",
  "client_dashboard_service_card_clicked",
  "client_dashboard_task_clicked",
  "client_dashboard_document_upload_clicked",
  "client_dashboard_appointment_clicked",
  "client_dashboard_payment_clicked",
  "client_dashboard_message_clicked",
  "client_dashboard_help_resource_clicked",
  "client_dashboard_widget_state",
  "client_dashboard_priority_navigated",
  "client_dashboard_context_result",
] as const;

export type DashboardEventName = (typeof DASHBOARD_EVENT_NAMES)[number];
export type DashboardEvent = Readonly<{
  event: DashboardEventName;
  properties: Readonly<
    Partial<
      Record<
        | "locale"
        | "contextType"
        | "widgetCode"
        | "actionCode"
        | "routeCode"
        | "sectionState"
        | "durationBucket"
        | "resultCode"
        | "policyVersion",
        string
      >
    >
  >;
}>;

const events = new Set<string>(DASHBOARD_EVENT_NAMES);
const allowedValues = Object.freeze({
  locale: new Set(["es", "en"]),
  contextType: new Set(["personal", "organization"]),
  widgetCode: new Set([
    "priority",
    "security",
    "services",
    "tasks",
    "documents",
    "appointments",
    "payments",
    "messages",
    "notifications",
    "help",
    "support",
  ]),
  actionCode: new Set([
    "security_identity",
    "blocking_payment",
    "expired_document",
    "pending_signature",
    "due_task",
    "imminent_appointment",
    "missing_information",
    "general_action",
  ]),
  routeCode: new Set([
    "home",
    "services",
    "status",
    "documents",
    "appointments",
    "messages",
    "payments",
    "help",
    "settings",
    "security",
    "support",
  ]),
  sectionState: new Set(["fresh", "empty", "stale", "unavailable", "suppressed", "unconfirmed"]),
  durationBucket: new Set(["lt_100ms", "100_499ms", "500_999ms", "gte_1000ms"]),
  resultCode: new Set(["ok", "denied", "unavailable", "retry_required", "selected"]),
});

type AllowedProperty = keyof typeof allowedValues | "policyVersion";

function safePolicyVersion(value: unknown): value is string {
  return typeof value === "string" && /^m008\.v[1-9][0-9]{0,2}$/u.test(value);
}

export function recordDashboardEvent(
  event: DashboardEventName,
  input: Readonly<Record<string, unknown>>,
): DashboardEvent {
  if (!events.has(event)) throw new Error("DASHBOARD_EVENT_DENIED");
  const properties: Partial<Record<AllowedProperty, string>> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "policyVersion") {
      if (safePolicyVersion(value)) properties.policyVersion = value;
      continue;
    }
    if (!(key in allowedValues) || typeof value !== "string") continue;
    const allowed = allowedValues[key as keyof typeof allowedValues];
    if (allowed.has(value)) properties[key as keyof typeof allowedValues] = value;
  }
  return Object.freeze({ event, properties: Object.freeze(properties) });
}
