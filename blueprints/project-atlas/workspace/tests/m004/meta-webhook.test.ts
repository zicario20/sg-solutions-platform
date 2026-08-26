import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  verifyMetaChallenge,
  verifyMetaWebhook,
  verifyMetaWebhookSignature,
} from "../../apps/app/src/lib/whatsapp/meta-webhook.ts";

const APP_SECRET = "synthetic-meta-app-secret-task5";
const VERIFY_TOKEN = "synthetic-meta-verify-token-task5";

function sign(raw: Uint8Array): string {
  return `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;
}

function webhookInput(raw: Uint8Array, signatureHeader: string | undefined = sign(raw)) {
  return {
    raw,
    signatureHeader,
    appSecret: APP_SECRET,
    maxRawBodyBytes: 64 * 1024,
    connectionId: "connection_synthetic_meta",
    businessAccountId: "100000000000001",
    phoneNumberId: "200000000000002",
    correlationId: "correlation_synthetic_meta",
    verifiedAt: new Date("2026-08-13T23:00:00.000Z"),
  } as const;
}

describe("Meta webhook verification", () => {
  it("returns only the bounded challenge for exact subscribe mode and token", () => {
    const query = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "123456789",
    });

    expect(verifyMetaChallenge(query, VERIFY_TOKEN)).toEqual({
      accepted: true,
      challenge: "123456789",
    });
  });

  it.each([
    [
      "wrong mode",
      { "hub.mode": "SUBSCRIBE", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "1" },
    ],
    [
      "wrong token",
      { "hub.mode": "subscribe", "hub.verify_token": "PRIVATE-TOKEN", "hub.challenge": "1" },
    ],
    [
      "empty challenge",
      { "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "" },
    ],
    [
      "control character",
      { "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "1\n2" },
    ],
    [
      "oversized challenge",
      {
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "1".repeat(513),
      },
    ],
  ])("rejects %s without reflecting query values", (_label, values) => {
    const result = verifyMetaChallenge(new URLSearchParams(values), VERIFY_TOKEN);

    expect(result).toEqual({ accepted: false, reason: "verification_rejected" });
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });

  it("rejects duplicate verification fields as ambiguous", () => {
    const query = new URLSearchParams();
    query.append("hub.mode", "subscribe");
    query.append("hub.mode", "subscribe");
    query.append("hub.verify_token", VERIFY_TOKEN);
    query.append("hub.challenge", "1234");

    expect(verifyMetaChallenge(query, VERIFY_TOKEN)).toEqual({
      accepted: false,
      reason: "verification_rejected",
    });
  });

  it("verifies lowercase sha256 HMAC over untouched raw bytes", () => {
    const raw = new TextEncoder().encode('{"message":"á","escaped":"\\u00e1"}');
    const reencoded = new TextEncoder().encode('{"message":"á","escaped":"á"}');

    expect(verifyMetaWebhookSignature(raw, sign(raw), APP_SECRET)).toBe(true);
    expect(verifyMetaWebhookSignature(reencoded, sign(raw), APP_SECRET)).toBe(false);
  });

  it.each([
    undefined,
    "",
    "sha1=0123456789abcdef",
    `SHA256=${"a".repeat(64)}`,
    `sha256=${"A".repeat(64)}`,
    "sha256=abc",
    `sha256=${"a".repeat(66)}`,
    `sha256=${"g".repeat(64)}`,
  ])("rejects malformed signatures", (signatureHeader) => {
    const raw = new TextEncoder().encode('{"safe":true}');
    expect(verifyMetaWebhookSignature(raw, signatureHeader, APP_SECRET)).toBe(false);
  });

  it("verifies before parse and returns an opaque context without raw or credentials", () => {
    const marker = "PRIVATE-INVALID-JSON";
    const raw = new TextEncoder().encode(`{${marker}`);
    const result = verifyMetaWebhook(webhookInput(raw));

    expect(result.status).toBe("verified");
    expect(JSON.stringify(result)).not.toContain(marker);
    expect(JSON.stringify(result)).not.toContain(APP_SECRET);
    if (result.status === "verified") {
      expect(result.context).toEqual({ kind: "verified_meta_webhook" });
      expect(Object.isFrozen(result.context)).toBe(true);
      expect(JSON.stringify(result.context)).not.toContain("100000000000001");
      expect(JSON.stringify(result.context)).not.toContain("200000000000002");
    }
  });

  it("returns one minimized invalid-signature result without parsing, logging, or reflecting content", () => {
    const marker = "PRIVATE-INVALID-SIGNATURE-BODY";
    const raw = new TextEncoder().encode(`{${marker}`);
    const logSpies = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];
    try {
      const result = verifyMetaWebhook(webhookInput(raw, `sha256=${"0".repeat(64)}`));
      expect(result).toEqual({ status: "rejected", reason: "signature_rejected" });
      expect(JSON.stringify(result)).not.toContain(marker);
      expect(JSON.stringify(result)).not.toContain(APP_SECRET);
      expect(logSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    } finally {
      for (const spy of logSpies) spy.mockRestore();
    }
  });

  it("fails closed on malformed verification metadata without echoing it", () => {
    const raw = new TextEncoder().encode('{"safe":true}');
    const result = verifyMetaWebhook({
      ...webhookInput(raw),
      connectionId: "../PRIVATE-CONNECTION",
    });

    expect(result).toEqual({ status: "rejected", reason: "verification_rejected" });
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY])(
    "requires a positive safe-integer raw-body limit instead of treating %s as configured",
    (maxRawBodyBytes) => {
      const raw = new TextEncoder().encode('{"safe":true}');

      expect(verifyMetaWebhook({ ...webhookInput(raw), maxRawBodyBytes })).toEqual({
        status: "rejected",
        reason: "verification_rejected",
      });
    },
  );

  it("rejects an oversized body before copying or hashing its bytes", () => {
    const raw = new Uint8Array(32);
    Object.defineProperty(raw, Symbol.iterator, {
      value: () => {
        throw new Error("raw bytes were copied before the size gate");
      },
    });

    expect(
      verifyMetaWebhook({
        ...webhookInput(raw, `sha256=${"0".repeat(64)}`),
        maxRawBodyBytes: 31,
      }),
    ).toEqual({ status: "rejected", reason: "verification_rejected" });
  });
});
