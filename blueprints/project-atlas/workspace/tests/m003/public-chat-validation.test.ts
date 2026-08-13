import { describe, expect, it } from "vitest";
import {
  inspectProhibitedChatContent,
  parseChatMessage,
  parseHandoffRequest,
  parseStartConversation,
} from "../../packages/validation/src/public-chat.ts";

describe("public chat validation", () => {
  it.each(["es", "en"] as const)("accepts the supported %s locale", (locale) => {
    expect(
      parseStartConversation({
        locale,
        noticeVersion: "public-chat-notice-v1",
        noticeAcknowledged: true,
      }),
    ).toEqual({ locale, noticeVersion: "public-chat-notice-v1", noticeAcknowledged: true });
  });

  it("rejects an unsupported locale instead of silently defaulting", () => {
    expect(() =>
      parseStartConversation({
        locale: "fr",
        noticeVersion: "public-chat-notice-v1",
        noticeAcknowledged: true,
      }),
    ).toThrow();
  });

  it("requires affirmative notice acknowledgement", () => {
    expect(() =>
      parseStartConversation({
        locale: "es",
        noticeVersion: "public-chat-notice-v1",
        noticeAcknowledged: false,
      }),
    ).toThrow();
  });

  it("normalizes Unicode and line endings before accepting a message", () => {
    expect(
      parseChatMessage({
        text: "  ¿Co\u0301mo funciona?\r\n",
        idempotencyKey: "msg_1234567890",
        expectedVersion: 2,
      }),
    ).toEqual({
      text: "¿Cómo funciona?",
      idempotencyKey: "msg_1234567890",
      expectedVersion: 2,
    });
  });

  it.each([
    { text: "", label: "blank" },
    { text: "\u0000hello", label: "NUL" },
    { text: "hello\u202Eworld", label: "bidirectional override" },
    { text: "a".repeat(2_001), label: "more than 2,000 Unicode characters" },
  ])("rejects $label message input", ({ text }) => {
    expect(() =>
      parseChatMessage({ text, idempotencyKey: "msg_1234567890", expectedVersion: 1 }),
    ).toThrow();
  });

  it("counts Unicode code points rather than UTF-16 code units", () => {
    expect(
      parseChatMessage({
        text: "🙂".repeat(2_000),
        idempotencyKey: "msg_1234567890",
        expectedVersion: 1,
      }).text,
    ).toHaveLength(4_000);
  });

  it.each([
    {
      text: ["000", "12", "3456"].join("-"),
      reason: "government_identifier",
      label: "SSN-shaped identifier",
    },
    {
      text: ["4111", "1111", "1111", "1111"].join(" "),
      reason: "payment_card",
      label: "payment-card-shaped value",
    },
    {
      text: `routing ${["0210", "0002", "1"].join("")}`,
      reason: "bank_account",
      label: "routing number",
    },
    {
      text: `api_key=${"sk"}_${"example".repeat(5)}`,
      reason: "credential",
      label: "API credential",
    },
    {
      text: "password: example-private-value",
      reason: "credential",
      label: "password",
    },
  ])("rejects a $label without returning its value", ({ text, reason }) => {
    const result = inspectProhibitedChatContent(text);
    expect(result).toEqual({ allowed: false, reason });
    expect(JSON.stringify(result)).not.toContain(text);
  });

  it("returns normalized safe text for allowed public questions", () => {
    expect(inspectProhibitedChatContent("  ¿Qué servicios ofrecen?\r\n")).toEqual({
      allowed: true,
      normalized: "¿Qué servicios ofrecen?",
    });
  });

  it("accepts only closed handoff reasons and optimistic versions", () => {
    expect(
      parseHandoffRequest({
        reason: "visitor_requested",
        idempotencyKey: "handoff_1234567890",
        expectedVersion: 3,
      }),
    ).toEqual({
      reason: "visitor_requested",
      idempotencyKey: "handoff_1234567890",
      expectedVersion: 3,
    });
    expect(() =>
      parseHandoffRequest({
        reason: "custom_user_text",
        idempotencyKey: "handoff_1234567890",
        expectedVersion: 3,
      }),
    ).toThrow();
  });
});
