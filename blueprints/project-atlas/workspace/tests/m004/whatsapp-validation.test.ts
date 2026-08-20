import {
  EMPTY_CHANNEL_COPY_CATALOG,
  parseWhatsAppInboundInput,
  parseWhatsAppText,
  resolveChannelCopy,
} from "@atlas/validation";
import { validateSyntheticChannelCopyCatalog } from "../../packages/validation/src/whatsapp.ts";
import { describe, expect, it } from "vitest";

describe("WhatsApp validation", () => {
  it("accepts bounded canonical, provider-neutral input", () => {
    const receivedAt = "2026-08-20T12:00:00.000Z";
    expect(
      parseWhatsAppInboundInput({
        eventId: "event_123",
        bindingId: "binding_123",
        conversationId: "conversation_123",
        messageId: "message_123",
        locale: "es",
        receivedAt,
        text: "  Necesito ayuda general.  ",
        interactiveReplyId: "reply_123",
        media: {
          mediaReferenceId: "media_123",
          contentType: "image/jpeg",
          byteLength: 1024,
          checksum: "a".repeat(64),
        },
      }),
    ).toEqual({
      eventId: "event_123",
      bindingId: "binding_123",
      conversationId: "conversation_123",
      messageId: "message_123",
      locale: "es",
      receivedAt: new Date(receivedAt),
      text: "Necesito ayuda general.",
      interactiveReplyId: "reply_123",
      media: {
        mediaReferenceId: "media_123",
        contentType: "image/jpeg",
        byteLength: 1024,
        checksum: "a".repeat(64),
      },
    });
  });

  it("requires a canonical timestamp for an inbound event", () => {
    expect(() => parseWhatsAppInboundInput({ eventId: "event_123" })).toThrow(
      "WHATSAPP_INPUT_INVALID",
    );
  });

  it.each([
    ["canonical identifier", () => parseWhatsAppInboundInput({ eventId: "bad id" })],
    ["timestamp", () => parseWhatsAppInboundInput({ eventId: "event_1", receivedAt: "tomorrow" })],
    ["interactive reply identifier", () => parseWhatsAppInboundInput({ eventId: "event_1", interactiveReplyId: "reply id" })],
    [
      "provider-neutral media metadata",
      () =>
        parseWhatsAppInboundInput({
          eventId: "event_1",
          media: { mediaReferenceId: "media_1", contentType: "image/jpeg", byteLength: 0, checksum: "a".repeat(64) },
        }),
    ],
  ])("rejects malformed %s without echoing protected input", (_label, parse) => {
    const protectedInput = "SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR";
    expect(() => parse()).toThrow("WHATSAPP_INPUT_INVALID");
    expect(() => parse()).not.toThrow(protectedInput);
  });

  it.each([
    "\u202eSENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR",
    "\u0007SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR",
    "api key: sk_abcdefghijklmnopqrstuvwxyz123456",
    "<script>SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR</script>",
  ])("rejects prohibited text variants without echoing content", (text) => {
    expect(() => parseWhatsAppText(text)).toThrow("WHATSAPP_TEXT_REJECTED");
    expect(() => parseWhatsAppText(text)).not.toThrow(text);
  });

  it("does not treat benign Spanish and English words as opt-out policy", () => {
    expect(parseWhatsAppText("Quiero actualizar mi cuenta")).toBe("Quiero actualizar mi cuenta");
    expect(parseWhatsAppText("Please update my account")).toBe("Please update my account");
  });
});

describe("channel safe-copy contracts", () => {
  it("keeps the runtime catalog empty and fail-closed", () => {
    expect(EMPTY_CHANNEL_COPY_CATALOG).toEqual({});
    expect(resolveChannelCopy()).toEqual({
      available: false,
      code: "copy_unavailable",
    });
  });

  it("does not resolve a partially localized catalog", () => {
    expect(
      Reflect.apply(resolveChannelCopy, undefined, [
        { provider_unavailable: { en: "Channel unavailable" } },
        "en",
        "provider_unavailable",
      ]),
    ).toEqual({ available: false, code: "copy_unavailable" });
  });

  it("does not activate a complete caller-supplied catalog while the runtime gate is closed", () => {
    const catalog = {
      automated_identity: { es: "Asistente automatizado", en: "Automated assistant" },
      sensitive_data_refusal: { es: "No envie datos sensibles", en: "Do not send sensitive data" },
      unsupported_media: { es: "Use el portal", en: "Use the portal" },
      portal_fallback: { es: "Portal seguro", en: "Secure portal" },
      provider_unavailable: { es: "Canal no disponible", en: "Channel unavailable" },
      human_unavailable: { es: "Equipo no disponible", en: "Team unavailable" },
      opt_out_receipt: { es: "Solicitud recibida", en: "Request received" },
      reconsent_guidance: { es: "Solicite consentimiento", en: "Request consent" },
    } as const;

    expect(Reflect.apply(resolveChannelCopy, undefined, [catalog, "en", "provider_unavailable"])).toEqual({
      available: false,
      code: "copy_unavailable",
    });
  });

  it("requires complete Spanish and English parity in injected fixture copy", () => {
    const fixture = {
      automated_identity: { es: "Asistente automatizado", en: "Automated assistant" },
      sensitive_data_refusal: { es: "No envie datos sensibles", en: "Do not send sensitive data" },
      unsupported_media: { es: "Use el portal", en: "Use the portal" },
      portal_fallback: { es: "Portal seguro", en: "Secure portal" },
      provider_unavailable: { es: "Canal no disponible", en: "Channel unavailable" },
      human_unavailable: { es: "Equipo no disponible", en: "Team unavailable" },
      opt_out_receipt: { es: "Solicitud recibida", en: "Request received" },
      reconsent_guidance: { es: "Solicite consentimiento", en: "Request consent" },
    } as const;

    expect(validateSyntheticChannelCopyCatalog(fixture)).toEqual({ valid: true });
    expect(
      validateSyntheticChannelCopyCatalog({
        ...fixture,
        provider_unavailable: { en: "Channel unavailable" },
      }),
    ).toEqual({ valid: false, code: "copy_locale_missing" });
  });

  it("does not export synthetic copy validation through the runtime package", async () => {
    const runtime = await import("@atlas/validation");
    expect(runtime).not.toHaveProperty("validateChannelCopyCatalog");
  });
});
