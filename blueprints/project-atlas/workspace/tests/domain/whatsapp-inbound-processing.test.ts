import { describe, expect, it } from "vitest";
import {
  MemoryCommunicationsRepository,
  processInboundChannelEvent,
  type ProcessInboundInput,
} from "@atlas/domain";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const LATER = new Date("2026-08-20T12:05:00.000Z");
const TOMORROW = new Date("2026-08-21T12:00:00.000Z");

function envelope(eventId: string, bindingId = "binding_1") {
  return {
    event: {
      eventId,
      channel: "whatsapp" as const,
      locale: "en" as const,
      connectionState: "active" as const,
      bindingId,
      conversationId: `conversation_${eventId}`,
      messageId: `message_${eventId}`,
      receivedAt: NOW,
      state: "persisted" as const,
      correlationId: `correlation_${eventId}`,
    },
    conversation: {
      id: `conversation_${eventId}`,
      channel: "whatsapp" as const,
      locale: "en" as const,
      status: "new" as const,
      participantIds: [`participant_${eventId}`],
      version: 1,
      createdAt: NOW,
      updatedAt: NOW,
      lastActivityAt: NOW,
    },
    participant: {
      participantId: `participant_${eventId}`,
      conversationId: `conversation_${eventId}`,
      bindingId,
      role: "external_contact" as const,
      createdAt: NOW,
    },
    message: {
      id: `message_${eventId}`,
      conversationId: `conversation_${eventId}`,
      channel: "whatsapp" as const,
      direction: "inbound" as const,
      senderParticipantId: `participant_${eventId}`,
      locale: "en" as const,
      kind: "text" as const,
      body: "Synthetic input",
      createdAt: NOW,
    },
  };
}

async function fixture(eventId: string, optOutSignal: "none" | "pending" = "none") {
  const repository = new MemoryCommunicationsRepository({
    bindings: [
      {
        bindingId: "binding_1",
        channel: "whatsapp",
        trustState: "reverified",
        freshUntil: TOMORROW,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    policies: [
      {
        policyId: "policy_1",
        bindingId: "binding_1",
        state: "normal",
        version: 7,
        fence: 42,
        updatedAt: NOW,
      },
    ],
  });
  await repository.acceptInbound({
    connectionId: "connection_1",
    providerEventId: `provider_${eventId}`,
    providerBodyDigest: `digest_${eventId}`,
    endpointDigests: [{ version: "v1", digest: "endpoint_digest" }],
    envelope: envelope(eventId),
    optOutSignal,
  });
  return repository;
}

function input(
  repository: MemoryCommunicationsRepository,
  eventId: string,
  overrides: Partial<ProcessInboundInput> = {},
): ProcessInboundInput {
  return {
    repository,
    executor: { run: async (_name, _timeout, action) => action() },
    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
    eventId,
    leaseOwner: `worker_${eventId}`,
    leaseExpiresAt: LATER,
    requiredPolicyVersion: 7,
    intent: "public_orientation",
    now: NOW,
    knowledgeTimeoutMs: 500,
    ownerTimeoutMs: 500,
    ...overrides,
  };
}

describe("WhatsApp inbound processing job", () => {
  it("applies opt-out before orientation and never calls public knowledge", async () => {
    const repository = await fixture("optout", "pending");
    let knowledgeCalls = 0;
    const result = await processInboundChannelEvent(
      input(repository, "optout", {
        requiredPolicyVersion: 8,
        publicOrientation: {
          answer: async () => {
            knowledgeCalls += 1;
            return { status: "unavailable" };
          },
        },
        withdrawalEvidence: {
          source: "inbound_event",
          receipt: {
            receiptId: "receipt_optout_1",
            owner: "communications",
            operation: "inbound_opt_out",
            bindingId: "binding_1",
            eventId: "optout",
            issuedAt: NOW,
            expiresAt: TOMORROW,
            correlationId: "correlation_optout",
          },
        },
      }),
    );

    expect(result).toMatchObject({ status: "completed", code: "contact_withdrawn" });
    expect(knowledgeCalls).toBe(0);
    expect(repository.referenceState().policies[0]).toMatchObject({ state: "withdrawn" });
  });

  it("answers only with current M002 provenance and exact disclosure binding", async () => {
    const repository = await fixture("public");
    const result = await processInboundChannelEvent(
      input(repository, "public", {
        publicOrientation: {
          answer: async () => ({
            status: "available",
            text: "Synthetic M002 answer",
            receipt: {
              receiptId: "receipt_m002_1",
              owner: "public_knowledge",
              source: "M002",
              sourceId: "help_topic_1",
              sourceVersion: "source_v1",
              reviewVersion: "review_v1",
              disclosureVersion: "disclosure_v1",
              issuedAt: NOW,
              expiresAt: TOMORROW,
              correlationId: "correlation_public",
            },
          }),
        },
      }),
    );

    expect(result).toMatchObject({
      status: "answered",
      text: "Synthetic M002 answer",
      sourceReceipt: { source: "M002", disclosureVersion: "disclosure_v1" },
    });
  });

  it.each([
    ["case_status", "protected_intent", "secure_portal"],
    ["payment_question", "protected_intent", "secure_portal"],
    ["document_question", "protected_intent", "secure_portal"],
    ["preliminary_intake", "preliminary_intake_disabled", "secure_portal"],
    ["media", "media_fetch_disabled", "secure_upload_portal"],
  ] as const)("keeps %s portal-safe with no owner or knowledge call", async (intent, code, route) => {
    const repository = await fixture(intent);
    let calls = 0;
    const result = await processInboundChannelEvent(
      input(repository, intent, {
        intent,
        publicOrientation: {
          answer: async () => {
            calls += 1;
            return { status: "unavailable" };
          },
        },
        owningAction: {
          execute: async () => {
            calls += 1;
            return { status: "unavailable" };
          },
        },
      }),
    );
    expect(result).toMatchObject({ status: "portal_safe", code, route });
    expect(calls).toBe(0);
  });

  it("requires an exact owning-domain receipt and suspends wrong-person bindings", async () => {
    const appointment = await fixture("appointment");
    const completed = await processInboundChannelEvent(
      input(appointment, "appointment", {
        intent: "appointment",
        resourceId: "appointment_request_1",
        idempotencyKey: "booking_key_1",
        owningAction: {
          execute: async () => ({
            status: "completed",
            receipt: {
              receiptId: "receipt_booking_1",
              owner: "appointments",
              operation: "book_appointment",
              bindingId: "binding_1",
              resourceId: "appointment_request_1",
              idempotencyKey: "booking_key_1",
              result: "succeeded",
              issuedAt: NOW,
              expiresAt: TOMORROW,
              correlationId: "correlation_appointment",
            },
          }),
        },
      }),
    );
    expect(completed).toEqual({ status: "owner_action_completed", receiptId: "receipt_booking_1" });

    const wrongPerson = await fixture("wrong_person");
    expect(
      await processInboundChannelEvent(
        input(wrongPerson, "wrong_person", { intent: "wrong_person" }),
      ),
    ).toMatchObject({ status: "completed", code: "binding_suspended" });
    expect(wrongPerson.referenceState().bindings[0]).toMatchObject({ trustState: "suspended" });
  });
});
