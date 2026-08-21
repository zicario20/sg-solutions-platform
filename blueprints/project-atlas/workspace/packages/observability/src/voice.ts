export type VoiceTelemetryOperation =
  | "provider_admission"
  | "media_admission"
  | "reception_turn"
  | "facade_command"
  | "fallback";

export type VoiceTelemetryOutcome =
  | "accepted"
  | "rejected"
  | "completed"
  | "verification_required"
  | "confirmation_required"
  | "denied"
  | "unavailable"
  | "callback_requested"
  | "transfer_requested"
  | "ended"
  | "redacted";

export type VoiceDurationBucket =
  | "under_100ms"
  | "under_500ms"
  | "under_2s"
  | "under_10s"
  | "over_10s"
  | "not_applicable";

export type VoiceFailureClass =
  | "authentication"
  | "binding"
  | "replay"
  | "timeout"
  | "provider"
  | "media"
  | "facade"
  | "policy"
  | "protected_input";

declare const voiceCorrelationIdBrand: unique symbol;

export type VoiceCorrelationId = Readonly<{
  [voiceCorrelationIdBrand]: true;
}>;

export type VoiceTelemetryEvent = Readonly<{
  operation: VoiceTelemetryOperation;
  outcome: VoiceTelemetryOutcome;
  correlationId: string;
  locale?: "es" | "en";
  durationBucket: VoiceDurationBucket;
  redactionMarker: "metadata_only";
  failureClass?: VoiceFailureClass;
}>;

const OPERATIONS = new Set<VoiceTelemetryOperation>([
  "provider_admission",
  "media_admission",
  "reception_turn",
  "facade_command",
  "fallback",
]);
const OUTCOMES = new Set<VoiceTelemetryOutcome>([
  "accepted",
  "rejected",
  "completed",
  "verification_required",
  "confirmation_required",
  "denied",
  "unavailable",
  "callback_requested",
  "transfer_requested",
  "ended",
  "redacted",
]);
const DURATION_BUCKETS = new Set<VoiceDurationBucket>([
  "under_100ms",
  "under_500ms",
  "under_2s",
  "under_10s",
  "over_10s",
  "not_applicable",
]);
const FAILURE_CLASSES = new Set<VoiceFailureClass>([
  "authentication",
  "binding",
  "replay",
  "timeout",
  "provider",
  "media",
  "facade",
  "policy",
  "protected_input",
]);
const ALLOWED_KEYS = new Set([
  "operation",
  "outcome",
  "correlationId",
  "locale",
  "durationBucket",
  "redactionMarker",
  "failureClass",
]);
const REQUIRED_KEYS = [
  "operation",
  "outcome",
  "correlationId",
  "durationBucket",
  "redactionMarker",
] as const;
const CORRELATION_ID = /^voice_correlation_[0-9a-f]{32}$/u;
const CORRELATION_VALUES = new WeakMap<object, string>();

export function createVoiceCorrelationId(): VoiceCorrelationId {
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
    throw new Error("VOICE_CORRELATION_UNAVAILABLE");
  }
  const value = `voice_correlation_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
  if (!CORRELATION_ID.test(value)) throw new Error("VOICE_CORRELATION_UNAVAILABLE");
  const token = Object.freeze(Object.create(null)) as VoiceCorrelationId;
  CORRELATION_VALUES.set(token, value);
  return token;
}

function invalid(): never {
  throw new Error("VOICE_TELEMETRY_INVALID");
}

export function projectVoiceTelemetry(input: unknown): VoiceTelemetryEvent {
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
    !OPERATIONS.has(record.operation as VoiceTelemetryOperation) ||
    typeof record.outcome !== "string" ||
    !OUTCOMES.has(record.outcome as VoiceTelemetryOutcome) ||
    correlationId === undefined ||
    typeof record.durationBucket !== "string" ||
    !DURATION_BUCKETS.has(record.durationBucket as VoiceDurationBucket) ||
    record.redactionMarker !== "metadata_only" ||
    (Object.hasOwn(record, "locale") &&
      record.locale !== "es" &&
      record.locale !== "en") ||
    (Object.hasOwn(record, "failureClass") &&
      (typeof record.failureClass !== "string" ||
        !FAILURE_CLASSES.has(record.failureClass as VoiceFailureClass)))
  ) {
    invalid();
  }
  return Object.freeze({
    operation: record.operation as VoiceTelemetryOperation,
    outcome: record.outcome as VoiceTelemetryOutcome,
    correlationId,
    ...(record.locale === undefined ? {} : { locale: record.locale as "es" | "en" }),
    durationBucket: record.durationBucket as VoiceDurationBucket,
    redactionMarker: "metadata_only",
    ...(record.failureClass === undefined
      ? {}
      : { failureClass: record.failureClass as VoiceFailureClass }),
  });
}

export function recordVoiceTelemetry(input: unknown): VoiceTelemetryEvent {
  return projectVoiceTelemetry(input);
}
