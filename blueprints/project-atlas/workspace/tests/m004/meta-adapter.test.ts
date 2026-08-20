import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createFailClosedMetaCredentialResolver } from "../../apps/app/src/lib/whatsapp/credentials.ts";
import { createMetaCloudAdapter } from "../../apps/app/src/lib/whatsapp/meta-adapter.ts";
import type {
  ProviderDispatchCommand,
  VerifiedWebhookContext,
} from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
import { verifyMetaWebhook } from "../../apps/app/src/lib/whatsapp/meta-webhook.ts";

const APP_SECRET = "synthetic-meta-app-secret-task5";
const ACCESS_TOKEN = "synthetic-meta-access-token-task5";
const CONNECTION_ID = "connection_synthetic_meta";
const BUSINESS_ACCOUNT_ID = "100000000000001";
const PHONE_NUMBER_ID = "200000000000002";
const OBSERVED_AT = new Date("2026-08-13T23:15:00.000Z");

function rawJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function verifiedContext(
  raw: Uint8Array,
  overrides: Partial<{
    connectionId: string;
    businessAccountId: string;
    phoneNumberId: string;
  }> = {},
): VerifiedWebhookContext {
  const result = verifyMetaWebhook({
    raw,
    signatureHeader: `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`,
    appSecret: APP_SECRET,
    connectionId: overrides.connectionId ?? CONNECTION_ID,
    businessAccountId: overrides.businessAccountId ?? BUSINESS_ACCOUNT_ID,
    phoneNumberId: overrides.phoneNumberId ?? PHONE_NUMBER_ID,
    correlationId: "correlation_synthetic_meta",
    verifiedAt: OBSERVED_AT,
    maxRawBodyBytes: 64 * 1024,
  });
  if (result.status !== "verified") throw new Error("synthetic fixture failed verification");
  return result.context;
}

function messagePayload(message: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: BUSINESS_ACCOUNT_ID,
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15550000000",
            phone_number_id: PHONE_NUMBER_ID,
          },
          contacts: [{ profile: { name: "Synthetic Person" }, wa_id: "15550000001" }],
          messages: [message],
        },
      }],
    }],
  };
}

function statusPayload(status: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: BUSINESS_ACCOUNT_ID,
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: { phone_number_id: PHONE_NUMBER_ID },
          statuses: [status],
        },
      }],
    }],
  };
}

function templatePayload(
  overrides: Record<string, unknown> = {},
  entryTime: number = 1_786_661_700,
) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: BUSINESS_ACCOUNT_ID,
      time: entryTime,
      changes: [{
        field: "message_template_status_update",
        value: {
          event: "APPROVED",
          message_template_id: "300000000000003",
          message_template_name: "synthetic_appointment_notice",
          message_template_language: "en_US",
          message_template_category: "UTILITY",
          message_template_components: [
            { type: "HEADER", format: "TEXT", text: "Synthetic header" },
            { type: "BODY", text: "Synthetic body" },
            { type: "FOOTER", text: "Synthetic footer" },
          ],
          message_template_version: "3",
          ...overrides,
        },
      }],
    }],
  };
}

function credentials(overrides: Record<string, string> = {}) {
  return {
    resolveVerificationSecret: async () => ({
      appSecret: APP_SECRET,
      verifyToken: "synthetic-meta-verify-token-task5",
    }),
    resolveDispatchSecret: async () => ({
      accessToken: ACCESS_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      graphApiVersion: "v25.0",
      ...overrides,
    }),
  };
}

function createAdapter(
  fetchImplementation: typeof fetch = vi.fn(async () => {
    throw new Error("fetch was not configured");
  }),
  resolver = credentials(),
) {
  return createMetaCloudAdapter({
    credentials: resolver,
    fetch: fetchImplementation,
    capabilityObservedAt: OBSERVED_AT,
    maxNormalizedPayloadBytes: 64 * 1024,
    maxProviderResponseBytes: 16 * 1024,
  });
}

function textCommand(overrides: Partial<ProviderDispatchCommand> = {}): ProviderDispatchCommand {
  return {
    connectionId: CONNECTION_ID,
    recipientEndpoint: "+15550000001",
    correlationId: "correlation_dispatch_synthetic",
    idempotencyKey: "idempotency_dispatch_synthetic",
    content: { kind: "text", body: "Synthetic hello" },
    ...overrides,
  };
}

function controlledUnreadResponse(status: number) {
  const marker = `PRIVATE-UNREAD-STATUS-${String(status)}`;
  const cancel = vi.fn(async () => undefined);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(marker));
    },
    cancel,
  });
  const getReader = vi.spyOn(body, "getReader");
  return {
    response: { status, body } as unknown as Response,
    cancel,
    getReader,
    marker,
  };
}

describe("inactive Meta Cloud adapter normalization", () => {
  it("binds normalization to the exact immutable raw bytes that were verified", async () => {
    const signedRaw = rawJson(messagePayload({
      from: "15550000001",
      id: "wamid.synthetic.signed",
      timestamp: "1786661700",
      type: "text",
      text: { body: "signed-private-marker" },
    }));
    const substitutedRaw = rawJson(messagePayload({
      from: "15550000001",
      id: "wamid.synthetic.substituted",
      timestamp: "1786661700",
      type: "text",
      text: { body: "substituted-private-marker" },
    }));

    const result = await createAdapter().normalizeVerifiedEvent(
      substitutedRaw,
      verifiedContext(signedRaw),
    );

    expect(result).toMatchObject({ kind: "unsupported_verified", reason: "unverified_context" });
    expect(JSON.stringify(result)).not.toContain("private-marker");
  });

  it("rejects a copied verification capability", async () => {
    const raw = rawJson(messagePayload({
      from: "15550000001",
      id: "wamid.synthetic.forged",
      timestamp: "1786661700",
      type: "text",
      text: { body: "safe" },
    }));
    const forged = { ...verifiedContext(raw) } as VerifiedWebhookContext;

    await expect(createAdapter().normalizeVerifiedEvent(raw, forged)).resolves.toMatchObject({
      kind: "unsupported_verified",
      reason: "unverified_context",
    });
  });

  it("returns a deeply immutable capability snapshot", () => {
    const adapter = createAdapter();
    const snapshot = adapter.capabilities();

    expect(snapshot).toEqual({
      requestIdempotency: false,
      stableReference: false,
      messageLookup: false,
      statusReconciliation: false,
      mediaReferences: true,
      templateProjection: true,
      observedAt: OBSERVED_AT,
      supportedInboundKinds: [
        "text_message",
        "interactive_reply",
        "message_status",
        "media_reference",
        "template_projection",
      ],
      supportedStatusKinds: ["sent", "delivered", "read", "failed"],
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.supportedInboundKinds)).toBe(true);
    snapshot.observedAt.setUTCFullYear(1999);
    expect(adapter.capabilities().observedAt.toISOString()).toBe("2026-08-13T23:15:00.000Z");
  });

  it("normalizes a supported text message into canonical fields", async () => {
    const raw = rawJson(messagePayload({
      from: "15550000001",
      id: "wamid.synthetic.text.1",
      timestamp: "1786661700",
      type: "text",
      text: { body: "Necesito información" },
    }));

    await expect(createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw))).resolves.toEqual({
      kind: "text_message",
      connectionId: CONNECTION_ID,
      externalEventReference: "wamid.synthetic.text.1",
      messageReference: "wamid.synthetic.text.1",
      senderEndpoint: "+15550000001",
      text: "Necesito información",
      occurredAt: new Date("2026-08-13T22:55:00.000Z"),
      receivedAt: OBSERVED_AT,
      correlationId: "correlation_synthetic_meta",
    });
  });

  it.each([
    ["interactive button", {
      from: "15550000001", id: "wamid.synthetic.button", timestamp: "1786661700", type: "interactive",
      interactive: { type: "button_reply", button_reply: { id: "service_credit", title: "Credit" } },
    }, { replyKind: "button", replyId: "service_credit", replyTitle: "Credit" }],
    ["interactive list", {
      from: "15550000001", id: "wamid.synthetic.list", timestamp: "1786661700", type: "interactive",
      interactive: { type: "list_reply", list_reply: { id: "service_tax", title: "Taxes", description: "Synthetic" } },
    }, { replyKind: "list", replyId: "service_tax", replyTitle: "Taxes" }],
    ["template quick reply", {
      from: "15550000001", id: "wamid.synthetic.template-button", timestamp: "1786661700", type: "button",
      button: { payload: "service_credit", text: "Credit" },
    }, { replyKind: "button", replyId: "service_credit", replyTitle: "Credit" }],
  ])("normalizes one supported %s", async (_label, message, expected) => {
    const raw = rawJson(messagePayload(message));
    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
    expect(result).toMatchObject({
      kind: "interactive_reply",
      connectionId: CONNECTION_ID,
      senderEndpoint: "+15550000001",
      ...expected,
    });
  });

  it.each(["image", "audio", "video", "document", "sticker"])(
    "normalizes only %s media-reference metadata",
    async (type) => {
      const marker = "PRIVATE-CAPTION-OR-FILENAME";
      const raw = rawJson(messagePayload({
        from: "15550000001",
        id: `wamid.synthetic.${type}`,
        timestamp: "1786661700",
        type,
        [type]: {
          id: `media.synthetic.${type}`,
          mime_type: type === "document" ? "application/pdf" : `${type}/synthetic`,
          sha256: "a".repeat(64),
          caption: marker,
          filename: marker,
        },
      }));
      const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
      expect(result).toMatchObject({
        kind: "media_reference",
        media: {
          externalReference: `media.synthetic.${type}`,
          declaredKind: type,
          checksum: "a".repeat(64),
        },
      });
      expect(JSON.stringify(result)).not.toContain(marker);
    },
  );

  it.each(["sent", "delivered", "read", "failed"])(
    "normalizes the supported %s status without recipient or provider errors",
    async (status) => {
      const raw = rawJson(statusPayload({
        id: "wamid.synthetic.outbound.1",
        status,
        timestamp: "1786661700",
        recipient_id: "15550000001",
        errors: [{ code: 13_100, title: "PRIVATE-PROVIDER-ERROR" }],
      }));
      const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
      expect(result).toMatchObject({
        kind: "message_status",
        externalMessageReference: "wamid.synthetic.outbound.1",
        status,
      });
      expect(JSON.stringify(result)).not.toContain("15550000001");
      expect(JSON.stringify(result)).not.toContain("PRIVATE-PROVIDER-ERROR");
    },
  );

  it("normalizes the exact complete approved template callback into a canonical projection", async () => {
    const raw = rawJson(templatePayload());

    await expect(createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw))).resolves.toEqual({
      kind: "template_projection",
      connectionId: CONNECTION_ID,
      externalEventReference: "300000000000003:APPROVED:3",
      receivedAt: OBSERVED_AT,
      correlationId: "correlation_synthetic_meta",
      projection: {
        templateId: "synthetic_appointment_notice",
        locale: "en",
        state: "provider_approved",
        version: 3,
        updatedAt: new Date("2026-08-13T22:55:00.000Z"),
        providerReference: "300000000000003",
        templateKey: "synthetic_appointment_notice",
        category: "utility",
        components: [
          { type: "header", format: "text", text: "Synthetic header" },
          { type: "body", text: "Synthetic body" },
          { type: "footer", text: "Synthetic footer" },
        ],
        status: "provider_approved",
        providerVersion: "3",
        providerTimestamp: new Date("2026-08-13T22:55:00.000Z"),
      },
    });
  });

  it.each([
    ["REJECTED", "provider_rejected"],
    ["PAUSED", "paused"],
    ["DISABLED", "disabled"],
  ])("normalizes complete %s template callback without activating it", async (event, state) => {
    const raw = rawJson(templatePayload({ event }));

    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
    expect(result).toMatchObject({
      kind: "template_projection",
      projection: { state, status: state },
    });
    expect(result).not.toMatchObject({ projection: { state: "provider_approved" } });
  });

  it.each([
    ["unknown status", { event: "MYSTERY_STATUS" }, 1_786_661_700],
    ["regressive pending status", { event: "PENDING" }, 1_786_661_700],
    ["zero provider version", { message_template_version: "0" }, 1_786_661_700],
    ["missing components", { message_template_components: undefined }, 1_786_661_700],
    ["non-canonical locale", { message_template_language: "en-US" }, 1_786_661_700],
    ["millisecond entry time", {}, 1_786_661_700_000],
    ["far-future entry time", {}, 4_102_444_800],
  ])("keeps %s template callback minimized for manual review", async (_label, overrides, time) => {
    const raw = rawJson(templatePayload(overrides, time));
    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
    expect(result).toEqual({
      kind: "unsupported_verified",
      connectionId: CONNECTION_ID,
      reason: "template_manual_review",
      receivedAt: OBSERVED_AT,
      correlationId: "correlation_synthetic_meta",
    });
    expect(JSON.stringify(result)).not.toContain("MYSTERY_STATUS");
    expect(JSON.stringify(result)).not.toContain("synthetic_appointment_notice");
  },
  );

  it.each([
    ["millisecond timestamp", "1786661700000"],
    ["overflow timestamp", "99999999999999999999"],
    ["pre-plausibility timestamp", "0999999999"],
    ["far-future timestamp", "4102444800"],
    ["beyond receipt skew", "1786663201"],
  ])("rejects an official message carrying a %s", async (_label, timestamp) => {
    const raw = rawJson(messagePayload({
      from: "15550000001",
      id: "wamid.synthetic.timestamp",
      timestamp,
      type: "text",
      text: { body: "safe" },
    }));

    await expect(createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw))).resolves.toMatchObject({
      kind: "unsupported_verified",
      reason: "malformed_payload",
    });
  });

  it.each([
    ["account", { businessAccountId: "999999999999999", phoneNumberId: PHONE_NUMBER_ID }],
    ["phone", { businessAccountId: BUSINESS_ACCOUNT_ID, phoneNumberId: "999999999999999" }],
  ])("rejects %s mapping mismatch without reflecting identifiers", async (_label, mismatch) => {
    const raw = rawJson(messagePayload({
      from: "15550000001", id: "wamid.synthetic.mismatch", timestamp: "1786661700", type: "text", text: { body: "safe" },
    }));
    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw, mismatch));
    expect(result).toMatchObject({ kind: "unsupported_verified", reason: "connection_mismatch" });
    expect(JSON.stringify(result)).not.toContain("999999999999999");
  });

  it.each([
    ["duplicate JSON key", new TextEncoder().encode('{"object":"whatsapp_business_account","object":"other","entry":[]}')],
    ["multiple entries", rawJson({ object: "whatsapp_business_account", entry: [{ id: BUSINESS_ACCOUNT_ID }, { id: BUSINESS_ACCOUNT_ID }] })],
    ["unsupported event", rawJson({ object: "whatsapp_business_account", entry: [{ id: BUSINESS_ACCOUNT_ID, marker: "PRIVATE-RAW" }] })],
  ])("returns a minimized unsupported envelope for %s", async (_label, raw) => {
    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
    expect(result).toMatchObject({ kind: "unsupported_verified" });
    expect(JSON.stringify(result)).not.toContain("PRIVATE-RAW");
  });
});

describe("inactive Meta Cloud adapter dispatch", () => {
  it("uses injected fetch with the exact URL, bearer header, allowlisted text JSON, and caller signal", async () => {
    let captured: { url: string; init?: RequestInit } | undefined;
    const fetchImplementation: typeof fetch = vi.fn(async (input, init) => {
      captured = { url: String(input), init };
      return new Response(JSON.stringify({ messages: [{ id: "wamid.synthetic.accepted.1" }] }), { status: 200 });
    });
    const controller = new AbortController();

    await expect(createAdapter(fetchImplementation).dispatch(textCommand(), controller.signal)).resolves.toEqual({
      status: "accepted",
      externalMessageReference: "wamid.synthetic.accepted.1",
    });
    expect(captured).toEqual({
      url: `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      init: {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: { authorization: `Bearer ${ACCESS_TOKEN}`, "content-type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "15550000001",
          type: "text",
          text: { preview_url: false, body: "Synthetic hello" },
        }),
      },
    });
  });

  it("maps an allowlisted template and quick-reply payload without arbitrary fields", async () => {
    let body: unknown;
    const fetchImplementation: typeof fetch = vi.fn(async (_input, init) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ messages: [{ id: "wamid.synthetic.template.1" }] }), { status: 200 });
    });
    const command = textCommand({
      content: {
        kind: "template",
        providerTemplateName: "synthetic_appointment_notice",
        languageCode: "es_US",
        components: [{
          type: "button",
          subType: "quick_reply",
          index: 0,
          parameters: [{ type: "payload", payload: "service_credit" }],
        }],
      },
    });

    await createAdapter(fetchImplementation).dispatch(command, new AbortController().signal);
    expect(body).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "15550000001",
      type: "template",
      template: {
        name: "synthetic_appointment_notice",
        language: { code: "es_US" },
        components: [{
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [{ type: "payload", payload: "service_credit" }],
        }],
      },
    });
  });

  it.each([
    ["unsafe recipient", { recipientEndpoint: "+1555/../000001" }],
    ["empty text", { content: { kind: "text", body: "" } }],
    ["oversized text", { content: { kind: "text", body: "x".repeat(4_097) } }],
    ["unknown content", { content: { kind: "raw", body: "PRIVATE-BODY" } }],
  ])("rejects %s before credential resolution or fetch", async (_label, overrides) => {
    const resolveDispatchSecret = vi.fn();
    const fetchImplementation = vi.fn();
    const adapter = createAdapter(fetchImplementation as unknown as typeof fetch, {
      resolveVerificationSecret: vi.fn(),
      resolveDispatchSecret,
    });
    const result = await adapter.dispatch(
      textCommand(overrides as Partial<ProviderDispatchCommand>),
      new AbortController().signal,
    );
    expect(result).toEqual({ status: "confirmed_not_sent", reason: "invalid_command" });
    expect(resolveDispatchSecret).not.toHaveBeenCalled();
    expect(fetchImplementation).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });

  it.each([
    ["version traversal", { graphApiVersion: "v25.0/../me" }],
    ["version query", { graphApiVersion: "v25.0?fields=id" }],
    ["phone traversal", { phoneNumberId: "200/../messages" }],
    ["phone query", { phoneNumberId: "200?access_token=PRIVATE" }],
  ])("rejects unsafe %s before fetch without reflection", async (_label, override) => {
    const fetchImplementation = vi.fn();
    const result = await createAdapter(
      fetchImplementation as unknown as typeof fetch,
      credentials(override),
    ).dispatch(textCommand(), new AbortController().signal);
    expect(result).toEqual({ status: "confirmed_not_sent", reason: "invalid_configuration" });
    expect(fetchImplementation).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(Object.values(override)[0]);
  });

  it("does no lookup or I/O when already aborted", async () => {
    const fetchImplementation = vi.fn();
    const resolveDispatchSecret = vi.fn();
    const controller = new AbortController();
    controller.abort();
    const result = await createAdapter(fetchImplementation as unknown as typeof fetch, {
      resolveVerificationSecret: vi.fn(),
      resolveDispatchSecret,
    }).dispatch(textCommand(), controller.signal);
    expect(result).toEqual({ status: "confirmed_not_sent", reason: "aborted_before_dispatch" });
    expect(resolveDispatchSecret).not.toHaveBeenCalled();
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 404, 405, 406, 410, 411, 413, 414, 415, 422])(
    "treats documented pre-acceptance rejection status %s as confirmed_not_sent and cancels unread body",
    async (statusCode) => {
      const { response, cancel, getReader, marker } = controlledUnreadResponse(statusCode);
      const result = await createAdapter(vi.fn(async () => response))
        .dispatch(textCommand(), new AbortController().signal);

      expect(result).toEqual({ status: "confirmed_not_sent", reason: "provider_rejected", statusCode });
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(getReader).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain(marker);
    },
  );

  it.each([0, 199, 302, 408, 409, 418, 429, 500, 503, 599, 600, Number.NaN, 418.5])(
    "treats uncertain HTTP status %s as dispatch_unknown and cancels unread body",
    async (statusCode) => {
      const { response, cancel, getReader, marker } = controlledUnreadResponse(statusCode);
      const result = await createAdapter(vi.fn(async () => response))
        .dispatch(textCommand(), new AbortController().signal);

      expect(result).toEqual({ status: "dispatch_unknown", reason: "acceptance_ambiguous" });
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(getReader).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain(marker);
    },
  );

  it("treats an abort thrown after fetch begins as ambiguous", async () => {
    const controller = new AbortController();
    const fetchImplementation = vi.fn(async () => {
      controller.abort();
      throw new DOMException("PRIVATE-ABORT", "AbortError");
    });

    await expect(createAdapter(fetchImplementation as unknown as typeof fetch)
      .dispatch(textCommand(), controller.signal)).resolves.toEqual({
      status: "dispatch_unknown",
      reason: "acceptance_ambiguous",
    });
  });

  it.each([
    ["network failure", vi.fn(async () => { throw new Error("PRIVATE-NETWORK"); })],
    ["server failure", vi.fn(async () => new Response("PRIVATE-UPSTREAM", { status: 503 }))],
    ["redirect", vi.fn(async () => new Response(null, { status: 302 }))],
    ["empty success", vi.fn(async () => new Response(JSON.stringify({ messages: [] }), { status: 200 }))],
    ["multiple references", vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: "one" }, { id: "two" }] }), { status: 200 }))],
    ["oversized response", vi.fn(async () => new Response("x".repeat(20_000), { status: 200 }))],
  ])("classifies %s as dispatch_unknown and never retries", async (_label, fetchImplementation) => {
    const result = await createAdapter(fetchImplementation as unknown as typeof fetch)
      .dispatch(textCommand(), new AbortController().signal);
    expect(result).toEqual({ status: "dispatch_unknown", reason: "acceptance_ambiguous" });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });

  it("never logs credentials, endpoint, body, or provider response", async () => {
    const spies = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];
    try {
      await createAdapter(vi.fn(async () => new Response("PRIVATE-RAW", { status: 500 })))
        .dispatch(textCommand(), new AbortController().signal);
      expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  it("keeps dispatch, message, and template reconciliation unsupported without provider I/O", async () => {
    const fetchImplementation = vi.fn();
    const adapter = createAdapter(fetchImplementation as unknown as typeof fetch);
    const signal = new AbortController().signal;
    await expect(adapter.reconcile({ connectionId: CONNECTION_ID, attemptId: "attempt_synthetic" }, signal))
      .resolves.toEqual({ status: "unsupported", reason: "activation_review_required" });
    await expect(adapter.reconcileMessages({ connectionId: CONNECTION_ID, cursor: null, limit: 10 }, signal))
      .resolves.toEqual({ status: "unsupported", reason: "activation_review_required" });
    await expect(adapter.reconcileTemplates({ connectionId: CONNECTION_ID, cursor: null, limit: 10 }, signal))
      .resolves.toEqual({ status: "unsupported", reason: "activation_review_required" });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("provides a production resolver that fails closed without echoing connection input", async () => {
    const resolver = createFailClosedMetaCredentialResolver();
    await expect(resolver.resolveVerificationSecret("PRIVATE-CONNECTION")).rejects.toMatchObject({
      name: "MetaCredentialsUnavailableError",
      code: "credentials_unavailable",
    });
    await resolver.resolveDispatchSecret("PRIVATE-CONNECTION").catch((error: unknown) => {
      expect(String(error)).not.toContain("PRIVATE-CONNECTION");
    });
  });
});
