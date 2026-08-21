export type PublicFormTelemetryOperation = "dispatch" | "reconciliation";
export type PublicFormTelemetryResult =
  | "completed"
  | "partial"
  | "retry_scheduled"
  | "duplicate"
  | "failed";
export type PublicFormTelemetryStatus =
  | "owner_follow_up"
  | "manual_follow_up"
  | "retry_scheduled"
  | "no_action";
export type PublicFormDurationBucket =
  | "under_100ms"
  | "under_500ms"
  | "under_2s"
  | "under_10s"
  | "over_10s"
  | "not_applicable";

export type PublicFormTelemetryEvent = Readonly<{
  operation: PublicFormTelemetryOperation;
  result: PublicFormTelemetryResult;
  locale: "es" | "en";
  formCode:
    | "contact"
    | "consultation"
    | "callback"
    | "credit_interest"
    | "taxes_interest"
    | "business_formation_interest"
    | "business_funding_interest"
    | "home_buying_interest"
    | "marketplace_interest";
  status: PublicFormTelemetryStatus;
  durationBucket: PublicFormDurationBucket;
  correlationId: string;
}>;

const OPERATIONS = new Set<PublicFormTelemetryOperation>(["dispatch", "reconciliation"]);
const RESULTS = new Set<PublicFormTelemetryResult>([
  "completed",
  "partial",
  "retry_scheduled",
  "duplicate",
  "failed",
]);
const FORM_CODES = new Set<PublicFormTelemetryEvent["formCode"]>([
  "contact",
  "consultation",
  "callback",
  "credit_interest",
  "taxes_interest",
  "business_formation_interest",
  "business_funding_interest",
  "home_buying_interest",
  "marketplace_interest",
]);
const STATUSES = new Set<PublicFormTelemetryStatus>([
  "owner_follow_up",
  "manual_follow_up",
  "retry_scheduled",
  "no_action",
]);
const DURATION_BUCKETS = new Set<PublicFormDurationBucket>([
  "under_100ms",
  "under_500ms",
  "under_2s",
  "under_10s",
  "over_10s",
  "not_applicable",
]);
const ALLOWED_KEYS = new Set([
  "operation",
  "result",
  "locale",
  "formCode",
  "status",
  "durationBucket",
  "correlationId",
]);
const REQUIRED_KEYS = [...ALLOWED_KEYS];
const CORRELATION_ID = /^form_correlation_[0-9a-f]{32}$/u;

function invalid(): never {
  throw new Error("PUBLIC_FORM_TELEMETRY_INVALID");
}

export function recordPublicFormTelemetry(input: unknown): PublicFormTelemetryEvent {
  if (!input || typeof input !== "object" || Array.isArray(input)) invalid();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) invalid();

  const record = input as Record<string, unknown>;
  const keys = Reflect.ownKeys(record);
  if (
    keys.length !== ALLOWED_KEYS.size ||
    keys.some((key) => typeof key !== "string" || !ALLOWED_KEYS.has(key)) ||
    REQUIRED_KEYS.some((key) => !Object.hasOwn(record, key))
  ) {
    invalid();
  }
  const descriptors = Object.getOwnPropertyDescriptors(record);
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) invalid();

  if (
    typeof record.operation !== "string" ||
    !OPERATIONS.has(record.operation as PublicFormTelemetryOperation) ||
    typeof record.result !== "string" ||
    !RESULTS.has(record.result as PublicFormTelemetryResult) ||
    (record.locale !== "es" && record.locale !== "en") ||
    typeof record.formCode !== "string" ||
    !FORM_CODES.has(record.formCode as PublicFormTelemetryEvent["formCode"]) ||
    typeof record.status !== "string" ||
    !STATUSES.has(record.status as PublicFormTelemetryStatus) ||
    typeof record.durationBucket !== "string" ||
    !DURATION_BUCKETS.has(record.durationBucket as PublicFormDurationBucket) ||
    typeof record.correlationId !== "string" ||
    !CORRELATION_ID.test(record.correlationId)
  ) {
    invalid();
  }

  return Object.freeze({
    operation: record.operation as PublicFormTelemetryOperation,
    result: record.result as PublicFormTelemetryResult,
    locale: record.locale,
    formCode: record.formCode as PublicFormTelemetryEvent["formCode"],
    status: record.status as PublicFormTelemetryStatus,
    durationBucket: record.durationBucket as PublicFormDurationBucket,
    correlationId: record.correlationId,
  });
}
