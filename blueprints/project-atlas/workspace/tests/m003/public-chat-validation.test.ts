import { describe, expect, it } from "vitest";
import {
  inspectProhibitedChatContent,
  parseChangeChatLocale,
  parseChatMessage,
  parseHandoffRequest,
  parseStartConversation,
} from "../../packages/validation/src/public-chat.ts";

describe("public chat validation", () => {
  it("accepts only a supported locale with an idempotent optimistic command", () => {
    expect(
      parseChangeChatLocale({
        locale: "en",
        idempotencyKey: "locale_change_0001",
        expectedVersion: 2,
      }),
    ).toEqual({ locale: "en", idempotencyKey: "locale_change_0001", expectedVersion: 2 });
    expect(() =>
      parseChangeChatLocale({
        locale: "fr",
        idempotencyKey: "locale_change_0001",
        expectedVersion: 2,
      }),
    ).toThrow();
  });

  it.each(["es", "en"] as const)("accepts the supported %s locale", (locale) => {
    expect(
      parseStartConversation({
        locale,
        noticeVersion: "public-chat-notice-v1",
        noticeAcknowledged: true,
        idempotencyKey: "start_request_0001",
      }),
    ).toEqual({
      locale,
      noticeVersion: "public-chat-notice-v1",
      noticeAcknowledged: true,
      idempotencyKey: "start_request_0001",
    });
  });

  it("rejects an unsupported locale instead of silently defaulting", () => {
    expect(() =>
      parseStartConversation({
        locale: "fr",
        noticeVersion: "public-chat-notice-v1",
        noticeAcknowledged: true,
        idempotencyKey: "start_request_0001",
      }),
    ).toThrow();
  });

  it("requires affirmative notice acknowledgement", () => {
    expect(() =>
      parseStartConversation({
        locale: "es",
        noticeVersion: "public-chat-notice-v1",
        noticeAcknowledged: false,
        idempotencyKey: "start_request_0001",
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
    { text: "hello\u0085world", label: "C1 next-line control" },
    { text: "hello\u200Eworld", label: "left-to-right mark" },
    { text: "hello\u061Cworld", label: "Arabic letter mark" },
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

  it("enforces the configured server-side message limit", () => {
    expect(
      parseChatMessage(
        {
          text: "a".repeat(1_600),
          idempotencyKey: "msg_1234567890",
          expectedVersion: 1,
        },
        1_600,
      ).text,
    ).toHaveLength(1_600);
    expect(() =>
      parseChatMessage(
        {
          text: "a".repeat(1_601),
          idempotencyKey: "msg_1234567890",
          expectedVersion: 1,
        },
        1_600,
      ),
    ).toThrowError("CHAT_MESSAGE_TEXT must contain at most 1600 characters");
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
    {
      text: "<script>example()</script>",
      reason: "markup",
      label: "script markup",
    },
  ])("rejects a $label without returning its value", ({ text, reason }) => {
    const result = inspectProhibitedChatContent(text);
    expect(result).toEqual({ allowed: false, reason });
    expect(JSON.stringify(result)).not.toContain(text);
  });

  it.each(["123-45-6789", "123 45 6789", "123456789", "１２３－４５－６７８９", "١٢٣ ٤٥ ٦٧٨٩"])(
    "rejects the SSN/ITIN-shaped variant %s",
    (text) => {
      const result = inspectProhibitedChatContent(`Identifier: ${text}`);
      expect(result).toEqual({ allowed: false, reason: "government_identifier" });
      expect(JSON.stringify(result)).not.toContain(text);
    },
  );

  it.each([
    ["fullwidth payment card", "４１１１ １１１１ １１１１ １１１１", "payment_card"],
    ["Arabic-Indic payment card", "٤١١١ ١١١١ ١١١١ ١١١١", "payment_card"],
    ["fullwidth routing number", "routing ０２１００００２１", "bank_account"],
    ["Arabic-Indic account number", "account ١٢٣٤٥٦٧٨٩", "bank_account"],
  ])("rejects a %s before any provider can receive it", (_label, text, reason) => {
    const result = inspectProhibitedChatContent(text);
    expect(result).toEqual({ allowed: false, reason });
    expect(JSON.stringify(result)).not.toContain(text);
  });

  it.each(["Order 12345678", "Phone 3125550199", "Years 1234 and 56789"])(
    "does not classify the legitimate numeric text %s as a nine-digit identifier",
    (text) => {
      expect(inspectProhibitedChatContent(text)).toEqual({ allowed: true, normalized: text });
    },
  );

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

  it.each([2_147_483_648, Number.MAX_SAFE_INTEGER + 1])(
    "rejects optimistic version %s outside the Postgres integer boundary",
    (expectedVersion) => {
      expect(() =>
        parseChatMessage({
          text: "Hello",
          idempotencyKey: "msg_1234567890",
          expectedVersion,
        }),
      ).toThrow();
    },
  );
});
