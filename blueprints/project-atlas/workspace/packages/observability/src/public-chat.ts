const EVENTS = new Set([
  "chat_opened",
  "chat_started",
  "language_detected",
  "intent_classified",
  "faq_answered",
  "lead_created",
  "appointment_offered",
  "appointment_booked",
  "payment_link_shared",
  "human_handoff_requested",
  "human_handoff_completed",
  "chat_closed",
  "chat_abandoned",
  "no_answer_found",
]);
const STATES = new Set([
  "new",
  "ai_active",
  "human_requested",
  "waiting_for_human",
  "human_active",
  "returned_to_ai",
  "closed",
  "expired",
  "restricted",
]);
const TIMING_BUCKETS = new Set([
  "under_250ms",
  "under_1s",
  "under_3s",
  "over_3s",
  "not_applicable",
]);
const ALLOWED_KEYS = new Set([
  "event",
  "correlationId",
  "locale",
  "state",
  "reason",
  "timingBucket",
]);

export type PublicChatMetric = {
  event: string;
  correlationId: string;
  locale: "es" | "en";
  state: string;
  reason: string;
  timingBucket: string;
};

function boundedCode(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_]{1,47}$/u.test(value);
}

export function projectPublicChatMetric(input: unknown): PublicChatMetric {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("PUBLIC_CHAT_METRIC_INVALID");
  }
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== ALLOWED_KEYS.size || keys.some((key) => !ALLOWED_KEYS.has(key))) {
    throw new Error("PUBLIC_CHAT_METRIC_INVALID");
  }
  if (
    typeof record.event !== "string" ||
    !EVENTS.has(record.event) ||
    typeof record.correlationId !== "string" ||
    !/^[A-Za-z0-9_-]{16,128}$/u.test(record.correlationId) ||
    (record.locale !== "es" && record.locale !== "en") ||
    typeof record.state !== "string" ||
    !STATES.has(record.state) ||
    !boundedCode(record.reason) ||
    typeof record.timingBucket !== "string" ||
    !TIMING_BUCKETS.has(record.timingBucket)
  ) {
    throw new Error("PUBLIC_CHAT_METRIC_INVALID");
  }
  return {
    event: record.event,
    correlationId: record.correlationId,
    locale: record.locale,
    state: record.state,
    reason: record.reason,
    timingBucket: record.timingBucket,
  };
}

export function recordPublicChatMetric(input: unknown): PublicChatMetric {
  return projectPublicChatMetric(input);
}
