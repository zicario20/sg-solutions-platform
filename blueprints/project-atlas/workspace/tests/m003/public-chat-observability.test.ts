import { describe, expect, it, vi } from "vitest";
import {
  projectPublicChatMetric,
  recordPublicChatMetric,
} from "../../packages/observability/src/public-chat.ts";

const validMetric = {
  event: "faq_answered",
  correlationId: "correlation_0123456789abcdef",
  locale: "es",
  state: "ai_active",
  reason: "answered_from_public_knowledge",
  timingBucket: "under_1s",
} as const;

describe("M003 minimized observability", () => {
  it("projects only the closed, bounded telemetry contract", () => {
    expect(projectPublicChatMetric(validMetric)).toEqual(validMetric);
  });

  it.each(["text", "email", "phone", "prompt", "ip", "providerPayload", "transcript"])(
    "rejects forbidden or unknown key %s rather than silently dropping it",
    (key) => {
      expect(() => projectPublicChatMetric({ ...validMetric, [key]: "private-value" })).toThrow(
        "PUBLIC_CHAT_METRIC_INVALID",
      );
    },
  );

  it("rejects unbounded identifiers, states, reasons, event names and timing values", () => {
    for (const value of [
      { ...validMetric, event: "message_body_saved" },
      { ...validMetric, correlationId: "short" },
      { ...validMetric, locale: "fr" },
      { ...validMetric, state: "x".repeat(49) },
      { ...validMetric, reason: "x".repeat(49) },
      { ...validMetric, timingBucket: "327ms" },
    ]) {
      expect(() => projectPublicChatMetric(value)).toThrow("PUBLIC_CHAT_METRIC_INVALID");
    }
  });

  it("keeps transport disabled unless an approved caller explicitly supplies it", () => {
    expect(recordPublicChatMetric(validMetric)).toEqual(validMetric);
    const transport = vi.fn();
    expect(recordPublicChatMetric(validMetric, transport)).toEqual(validMetric);
    expect(transport).toHaveBeenCalledExactlyOnceWith(validMetric);
  });
});
