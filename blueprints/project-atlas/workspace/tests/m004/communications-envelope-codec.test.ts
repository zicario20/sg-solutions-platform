import { describe, expect, it } from "vitest";
import type {
  CanonicalProviderEnvelope,
  UnsupportedVerifiedEnvelope,
} from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
import {
  deserializeMetaCanonicalEnvelopeRecord,
  serializeMetaCanonicalEnvelope,
} from "../../apps/app/src/lib/whatsapp/provider-envelope-persistence.ts";
import { validateCommunicationEventRecord } from "../../packages/database/src/communication-event-envelope.ts";

const occurredAt = new Date("2026-08-14T10:00:00.000Z");
const receivedAt = new Date("2026-08-14T10:00:01.000Z");
const base = {
  connectionId: "connection_synthetic",
  externalEventReference: "event_synthetic",
  correlationId: "correlation_synthetic",
  receivedAt,
};

const providerFixtures = [
  {
    ...base,
    kind: "text_message",
    messageReference: "message_text",
    senderEndpoint: "sender_endpoint_synthetic_text",
    text: "synthetic text",
    occurredAt,
  },
  {
    ...base,
    kind: "interactive_reply",
    messageReference: "message_interactive",
    senderEndpoint: "sender_endpoint_synthetic_interactive",
    replyKind: "button",
    replyId: "service_credit",
    replyTitle: "Credit",
    occurredAt,
  },
  {
    ...base,
    kind: "message_status",
    externalMessageReference: "message_status",
    status: "delivered",
    occurredAt,
  },
  {
    ...base,
    kind: "media_reference",
    messageReference: "message_media",
    senderEndpoint: "sender_endpoint_synthetic_media",
    occurredAt,
    media: {
      externalReference: "media_synthetic",
      declaredKind: "sticker",
      mimeType: "image/webp",
      checksum: "a".repeat(64),
    },
  },
  {
    ...base,
    kind: "template_projection",
    projection: {
      templateId: "template_synthetic",
      locale: "es",
      state: "internally_approved",
      version: 3,
      updatedAt: occurredAt,
      providerReference: "provider_template_synthetic",
      templateKey: "appointment_notice",
      category: "utility",
      components: [{ type: "body", format: "text", text: "Synthetic" }],
      status: "provider_approved",
      providerVersion: "provider.synthetic.v1",
      providerTimestamp: occurredAt,
    },
  },
  {
    kind: "unsupported_verified",
    connectionId: "connection_synthetic",
    reason: "unsupported_event",
    receivedAt,
    correlationId: "correlation_synthetic",
  },
] satisfies readonly (CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope)[];

const safeExpected = [
  {
    ...providerFixtures[0],
    senderEndpoint: undefined,
    senderBindingId: "binding_synthetic",
  },
  {
    ...providerFixtures[1],
    senderEndpoint: undefined,
    senderBindingId: "binding_synthetic",
  },
  providerFixtures[2],
  {
    ...providerFixtures[3],
    senderEndpoint: undefined,
    senderBindingId: "binding_synthetic",
  },
  providerFixtures[4],
  providerFixtures[5],
].map((fixture) => {
  const { senderEndpoint: _discarded, ...safe } = fixture as typeof fixture & {
    senderEndpoint?: string;
  };
  return safe;
});
describe("M004 deterministic Meta envelope persistence codec", () => {
  it.each(providerFixtures.map((event, index) => ({ event, index, kind: event.kind })))(
    "round-trips the real $kind variant into its safe persisted projection",
    ({ event, index }) => {
      const record = serializeMetaCanonicalEnvelope(event, {
        schemaVersion: "meta-envelope.v1",
        senderBindingId: "binding_synthetic",
        textRetentionPolicy: "synthetic_local_text",
      });
      expect(validateCommunicationEventRecord(record)).toBe(record);
      expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual({
        status: "available",
        envelope: safeExpected[index],
      });
      expect(JSON.stringify(record)).not.toContain("sender_endpoint_synthetic");
      expect(Object.keys(record)).not.toEqual(
        expect.arrayContaining([
          "rawPayload",
          "providerPayload",
          "senderEndpoint",
          "providerError",
        ]),
      );
    },
  );

  it("uses the status externalMessageReference and persists every provider template authority field", () => {
    const status = serializeMetaCanonicalEnvelope(providerFixtures[2], {
      schemaVersion: "meta-envelope.v1",
    });
    expect(status.externalMessageReference).toBe("message_status");
    expect(status.messageReference).toBeNull();

    const template = serializeMetaCanonicalEnvelope(providerFixtures[4], {
      schemaVersion: "meta-envelope.v1",
    });
    expect(template).toMatchObject({
      templateId: "template_synthetic",
      templateAuthorityState: "internally_approved",
      templateAuthorityVersion: 3,
      templateAuthorityUpdatedAt: occurredAt,
      templateProviderReference: "provider_template_synthetic",
      templateProviderState: "provider_approved",
      templateProviderVersion: "provider.synthetic.v1",
      templateProviderTimestamp: occurredAt,
    });
  });

  it("accepts metadata-only text without retaining canonical text", () => {
    const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
      schemaVersion: "meta-envelope.v1",
      senderBindingId: "binding_synthetic",
      textRetentionPolicy: "metadata_only",
    });

    expect(record).toMatchObject({
      eventKind: "text_message",
      canonicalText: null,
      bodyRetentionPolicy: "metadata_only",
    });
    expect(validateCommunicationEventRecord(record)).toBe(record);
    expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual({
      status: "not_reversible",
      eventKind: "text_message",
      reason: "metadata_only",
    });
  });

  it("defaults text persistence to metadata-only when no retention gate is supplied", () => {
    const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
      schemaVersion: "meta-envelope.v1",
      senderBindingId: "binding_synthetic",
    });

    expect(record.canonicalText).toBeNull();
    expect(record.bodyRetentionPolicy).toBe("metadata_only");
  });

  it("does not invent an external event reference for unsupported verified input", () => {
    const record = serializeMetaCanonicalEnvelope(providerFixtures[5], {
      schemaVersion: "meta-envelope.v1",
    });
    expect(record.externalEventReference).toBeNull();
  });

  it.each([
    {
      label: "top-level provider key",
      event: { ...providerFixtures[0], rawPayload: "forbidden" },
    },
    {
      label: "nested media key",
      event: {
        ...providerFixtures[3],
        media: {
          ...(
            providerFixtures[3] as Extract<CanonicalProviderEnvelope, { kind: "media_reference" }>
          ).media,
          url: "forbidden",
        },
      },
    },
    {
      label: "nested template component key",
      event: {
        ...providerFixtures[4],
        projection: {
          ...(
            providerFixtures[4] as Extract<
              CanonicalProviderEnvelope,
              { kind: "template_projection" }
            >
          ).projection,
          components: [{ type: "body", format: "text", text: "Synthetic", payload: "forbidden" }],
        },
      },
    },
    {
      label: "unsupported external event reference",
      event: { ...providerFixtures[5], externalEventReference: "invented" },
    },
  ])("rejects an unexpected $label instead of persisting it", ({ event }) => {
    expect(() =>
      serializeMetaCanonicalEnvelope(event as CanonicalProviderEnvelope, {
        schemaVersion: "meta-envelope.v1",
        senderBindingId: "binding_synthetic",
        textRetentionPolicy: "synthetic_local_text",
      }),
    ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
  });

  it("requires a safe binding reference instead of retaining a raw sender endpoint", () => {
    expect(() =>
      serializeMetaCanonicalEnvelope(providerFixtures[0], {
        schemaVersion: "meta-envelope.v1",
        textRetentionPolicy: "synthetic_local_text",
      }),
    ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
  });

  it.each([
    ["text_message", "canonicalText"],
    ["interactive_reply", "interactiveKind"],
    ["message_status", "externalMessageReference"],
    ["media_reference", "mediaExternalReference"],
    ["template_projection", "templateProviderReference"],
    ["unsupported_verified", "unsupportedReason"],
  ] as const)("rejects a PostgreSQL-nullable required field for %s", (kind, field) => {
    const fixture = providerFixtures.find((event) => event.kind === kind);
    if (!fixture) throw new Error("TEST_FIXTURE_NOT_FOUND");
    const record = serializeMetaCanonicalEnvelope(fixture, {
      schemaVersion: "meta-envelope.v1",
      senderBindingId: "binding_synthetic",
      textRetentionPolicy: "synthetic_local_text",
    });
    expect(() => validateCommunicationEventRecord({ ...record, [field]: null })).toThrowError(
      "COMMUNICATION_EVENT_RECORD_INVALID",
    );
  });
});
