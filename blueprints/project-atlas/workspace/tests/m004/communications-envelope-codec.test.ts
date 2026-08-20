import { describe, expect, it } from "vitest";
import type {
  CanonicalProviderEnvelope,
  UnsupportedVerifiedEnvelope,
} from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
import {
  deserializeMetaCanonicalEnvelopeRecord,
  serializeMetaCanonicalEnvelope,
} from "../../apps/app/src/lib/whatsapp/provider-envelope-persistence.ts";
import {
  SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS,
  validateCommunicationEventRecord,
} from "../../packages/database/src/communication-event-envelope.ts";

const occurredAt = new Date("2026-08-14T10:00:00.000Z");
const receivedAt = new Date("2026-08-14T10:00:01.000Z");
const base = {
  connectionId: "connection_synthetic",
  externalEventReference: "meta_evt_0123456789abcdef0123456789abcdef",
  correlationId: "correlation_synthetic",
  receivedAt,
};

const providerFixtures = [
  {
    ...base,
    kind: "text_message",
    messageReference: "wamid.SYNTHETICMESSAGETEXT0001",
    senderEndpoint: "sender_endpoint_synthetic_text",
    text: "synthetic text",
    occurredAt,
  },
  {
    ...base,
    kind: "interactive_reply",
    messageReference: "wamid.SYNTHETICMESSAGEINTERACTIVE0001",
    senderEndpoint: "sender_endpoint_synthetic_interactive",
    replyKind: "button",
    replyId: "service_credit",
    replyTitle: "Credit",
    occurredAt,
  },
  {
    ...base,
    kind: "message_status",
    externalMessageReference: "wamid.SYNTHETICMESSAGESTATUS0001",
    status: "delivered",
    occurredAt,
  },
  {
    ...base,
    kind: "media_reference",
    messageReference: "wamid.SYNTHETICMESSAGEMEDIA0001",
    senderEndpoint: "sender_endpoint_synthetic_media",
    occurredAt,
    media: {
      externalReference: "123456789012345",
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
      providerReference: "987654321098765",
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
      });
      expect(validateCommunicationEventRecord(record)).toBe(record);
      expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual(
        event.kind === "text_message"
          ? { status: "not_reversible", eventKind: "text_message", reason: "metadata_only" }
          : { status: "available", envelope: safeExpected[index] },
      );
      expect(JSON.stringify(record)).not.toContain("sender_endpoint_synthetic");
      expect(JSON.stringify(record)).not.toContain("synthetic text");
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
    expect(status.externalMessageReference).toBe("wamid.SYNTHETICMESSAGESTATUS0001");
    expect(status.messageReference).toBeNull();

    const template = serializeMetaCanonicalEnvelope(providerFixtures[4], {
      schemaVersion: "meta-envelope.v1",
    });
    expect(template).toMatchObject({
      templateId: "template_synthetic",
      templateAuthorityState: "internally_approved",
      templateAuthorityVersion: 3,
      templateAuthorityUpdatedAt: occurredAt,
      templateProviderReference: "987654321098765",
      templateProviderState: "provider_approved",
      templateProviderVersion: "provider.synthetic.v1",
      templateProviderTimestamp: occurredAt,
    });
  });

  it("always persists text as metadata-only without retaining canonical text", () => {
    const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
      schemaVersion: "meta-envelope.v1",
      senderBindingId: "binding_synthetic",
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
    expect(JSON.stringify(record)).not.toContain("synthetic text");
  });

  it.each(["approved", "synthetic_local_text"])(
    "rejects the removed caller-selectable %s retention mode",
    (textRetentionPolicy) => {
      expect(() =>
        serializeMetaCanonicalEnvelope(providerFixtures[0], {
          schemaVersion: "meta-envelope.v1",
          senderBindingId: "binding_synthetic",
          textRetentionPolicy,
        } as never),
      ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
    },
  );

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
      }),
    ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
  });

  it("requires a safe binding reference instead of retaining a raw sender endpoint", () => {
    expect(() =>
      serializeMetaCanonicalEnvelope(providerFixtures[0], {
        schemaVersion: "meta-envelope.v1",
      }),
    ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
  });

  const referenceTargets = [
    {
      label: "event",
      fixture: providerFixtures[0],
      wrongShape: "event_0123456789abcdef0123456789abcdef",
      persistedField: "externalEventReference",
    },
    {
      label: "message",
      fixture: providerFixtures[0],
      wrongShape: "meta_message_0123456789abcdef",
      persistedField: "messageReference",
    },
    {
      label: "status message",
      fixture: providerFixtures[2],
      wrongShape: "message_status_0123456789abcdef",
      persistedField: "externalMessageReference",
    },
    {
      label: "media",
      fixture: providerFixtures[3],
      wrongShape: "meta_media_0123456789abcdef",
      persistedField: "mediaExternalReference",
    },
    {
      label: "template",
      fixture: providerFixtures[4],
      wrongShape: "meta_template_0123456789abcdef",
      persistedField: "templateProviderReference",
    },
  ] as const;

  function withProviderReference(
    label: (typeof referenceTargets)[number]["label"],
    fixture: (typeof providerFixtures)[number],
    reference: string,
  ): unknown {
    switch (label) {
      case "event":
        return { ...fixture, externalEventReference: reference };
      case "message":
        return { ...fixture, messageReference: reference };
      case "status message":
        return { ...fixture, externalMessageReference: reference };
      case "media":
        return {
          ...fixture,
          media: {
            ...(fixture as Extract<CanonicalProviderEnvelope, { kind: "media_reference" }>).media,
            externalReference: reference,
          },
        };
      case "template":
        return {
          ...fixture,
          projection: {
            ...(fixture as Extract<CanonicalProviderEnvelope, { kind: "template_projection" }>).projection,
            providerReference: reference,
          },
        };
    }
  }

  const hostileOpaqueReferences = [
    "https://graph.facebook.com/object",
    "https://access-token@example.test/object?token=secret",
    "+15551234567",
    "155-512-34567",
    "reference?token=secret",
    "reference with whitespace",
    "reference\u0000control",
    `reference_${"a".repeat(256)}`,
  ] as const;

  for (const target of referenceTargets) {
    it.each([...hostileOpaqueReferences, target.wrongShape])(
      `rejects an invalid ${target.label} provider reference %j before conversion`,
      (reference) => {
        expect(() =>
          serializeMetaCanonicalEnvelope(
            withProviderReference(target.label, target.fixture, reference) as CanonicalProviderEnvelope,
            { schemaVersion: "meta-envelope.v1", senderBindingId: "binding_synthetic" },
          ),
        ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      },
    );
  }

  it.each(referenceTargets)(
    "independently rejects unsafe canonical $label references at database validation",
    (target) => {
      const record = serializeMetaCanonicalEnvelope(target.fixture, {
        schemaVersion: "meta-envelope.v1",
        senderBindingId: "binding_synthetic",
      });
      for (const reference of hostileOpaqueReferences) {
        expect(() =>
          validateCommunicationEventRecord({
            ...record,
            [target.persistedField]: reference,
          }),
        ).toThrowError("COMMUNICATION_EVENT_RECORD_INVALID");
      }
    },
  );

  it("shares one exact supported envelope schema version across both validators", () => {
    expect(SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS).toEqual(["meta-envelope.v1"]);
    const valid = serializeMetaCanonicalEnvelope(providerFixtures[0], {
      schemaVersion: "meta-envelope.v1",
      senderBindingId: "binding_synthetic",
    });
    for (const schemaVersion of ["", "meta-envelope.v2", "META-ENVELOPE.V1", " meta-envelope.v1"] as const) {
      expect(() =>
        serializeMetaCanonicalEnvelope(providerFixtures[0], {
          schemaVersion: schemaVersion as "meta-envelope.v1",
          senderBindingId: "binding_synthetic",
        }),
      ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      expect(() => validateCommunicationEventRecord({ ...valid, schemaVersion })).toThrowError(
        "COMMUNICATION_EVENT_RECORD_INVALID",
      );
    }
  });

  it.each([
    ["text_message", "messageReference"],
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
    });
    expect(() => validateCommunicationEventRecord({ ...record, [field]: null })).toThrowError(
      "COMMUNICATION_EVENT_RECORD_INVALID",
    );
  });
});
