export type CommunicationsTelemetryOperation =
  | "webhook"
  | "inbound_job"
  | "dispatch"
  | "reconciliation";

export type CommunicationsTelemetryResult =
  | "accepted"
  | "applied"
  | "blocked"
  | "duplicate"
  | "failed"
  | "manual_review"
  | "rejected"
  | "unavailable"
  | "unknown";

export type CommunicationsConnectionState =
  | "disabled"
  | "configured"
  | "sandbox_verified"
  | "production_verified"
  | "active"
  | "suspended"
  | "retired";

export type CommunicationsDurationBucket =
  | "under_100ms"
  | "under_500ms"
  | "under_2s"
  | "under_10s"
  | "over_10s"
  | "not_applicable";

declare const communicationsCorrelationIdBrand: unique symbol;

export type CommunicationsCorrelationId = Readonly<{
  [communicationsCorrelationIdBrand]: true;
}>;

export type CommunicationsTelemetryEvent = Readonly<{
  operation: CommunicationsTelemetryOperation;
  result: CommunicationsTelemetryResult;
  correlationId: string;
  durationBucket: CommunicationsDurationBucket;
  connectionState?: CommunicationsConnectionState;
}>;

const OPERATIONS = new Set<CommunicationsTelemetryOperation>([
  "webhook",
  "inbound_job",
  "dispatch",
  "reconciliation",
]);
const RESULTS = new Set<CommunicationsTelemetryResult>([
  "accepted",
  "applied",
  "blocked",
  "duplicate",
  "failed",
  "manual_review",
  "rejected",
  "unavailable",
  "unknown",
]);
const CONNECTION_STATES = new Set<CommunicationsConnectionState>([
  "disabled",
  "configured",
  "sandbox_verified",
  "production_verified",
  "active",
  "suspended",
  "retired",
]);
const DURATION_BUCKETS = new Set<CommunicationsDurationBucket>([
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
  "correlationId",
  "durationBucket",
  "connectionState",
]);
const REQUIRED_KEYS = ["operation", "result", "correlationId", "durationBucket"] as const;
const CORRELATION_ID = /^correlation_[0-9a-f]{32}$/u;
const CORRELATION_VALUES = new WeakMap<object, string>();

export function createCommunicationsCorrelationId(): CommunicationsCorrelationId {
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
    throw new Error("COMMUNICATIONS_CORRELATION_UNAVAILABLE");
  }
  const value = `correlation_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
  if (!CORRELATION_ID.test(value)) {
    throw new Error("COMMUNICATIONS_CORRELATION_UNAVAILABLE");
  }
  const token = Object.freeze(Object.create(null)) as CommunicationsCorrelationId;
  CORRELATION_VALUES.set(token, value);
  return token;
}

function invalid(): never {
  throw new Error("COMMUNICATIONS_TELEMETRY_INVALID");
}

export function projectCommunicationsTelemetryEvent(
  input: unknown,
): CommunicationsTelemetryEvent {
  if (!input || typeof input !== "object" || Array.isArray(input)) invalid();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) invalid();

  const record = input as Record<string, unknown>;
  const keys = Reflect.ownKeys(record);
  if (
    keys.some((key) => typeof key !== "string" || !ALLOWED_KEYS.has(key)) ||
    REQUIRED_KEYS.some((key) => !Object.hasOwn(record, key))
  ) {
    invalid();
  }
  const descriptors = Object.getOwnPropertyDescriptors(record);
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) invalid();

  const correlationId =
    record.correlationId !== null && typeof record.correlationId === "object"
      ? CORRELATION_VALUES.get(record.correlationId)
      : undefined;

  if (
    typeof record.operation !== "string" ||
    !OPERATIONS.has(record.operation as CommunicationsTelemetryOperation) ||
    typeof record.result !== "string" ||
    !RESULTS.has(record.result as CommunicationsTelemetryResult) ||
    correlationId === undefined ||
    typeof record.durationBucket !== "string" ||
    !DURATION_BUCKETS.has(record.durationBucket as CommunicationsDurationBucket) ||
    (Object.hasOwn(record, "connectionState") &&
      (typeof record.connectionState !== "string" ||
        !CONNECTION_STATES.has(record.connectionState as CommunicationsConnectionState)))
  ) {
    invalid();
  }

  return Object.freeze({
    operation: record.operation as CommunicationsTelemetryOperation,
    result: record.result as CommunicationsTelemetryResult,
    correlationId,
    durationBucket: record.durationBucket as CommunicationsDurationBucket,
    ...(record.connectionState === undefined
      ? {}
      : { connectionState: record.connectionState as CommunicationsConnectionState }),
  });
}

export function recordCommunicationsTelemetryEvent(
  input: unknown,
): CommunicationsTelemetryEvent {
  return projectCommunicationsTelemetryEvent(input);
}
