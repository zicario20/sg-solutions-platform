import { describe, expect, it } from "vitest";
import {
  type BindingTrustState,
  type ChannelAuditEvent,
  type ChannelConnectionState,
  type ChannelContactPolicy,
  type ChannelConversation,
  type ChannelHandoffReceipt,
  type ChannelKind,
  type ChannelLocale,
  type ChannelMessage,
  type ChannelParticipant,
  type ContactChannelBinding,
  type ContactConsentState,
  type ContactPolicyState,
  type ConversationOwnershipState,
  type DomainReceipt,
  type InboundChannelEvent,
  type MessageTemplateProjection,
  type OutboundCommandState,
  type OutboundDispatchAttempt,
  type OutboundMessageCommand,
  type ProviderCapabilitySnapshot,
  type ProviderEventState,
  type TemplateLifecycleState,
  transitionBindingTrust,
  transitionConnection,
  transitionContactConsent,
  transitionContactPolicy,
  transitionConversationOwnership,
  transitionInboundEvent,
  transitionOutboundCommand,
  transitionTemplateLifecycle,
} from "../../packages/domain/src/communications/index.ts";

type Transition<T extends string> = (from: T, to: T) => { state: T; code: string };

function expectLifecycle<T extends string>(input: {
  name: string;
  states: readonly T[];
  allowed: Readonly<Record<T, readonly T[]>>;
  terminal: readonly T[];
  transition: Transition<T>;
  forbiddenCode?: (from: T, to: T) => string | undefined;
}) {
  for (const from of input.states) {
    for (const to of input.states) {
      const expectedCode =
        from === to
          ? "duplicate"
          : input.forbiddenCode?.(from, to) ??
            (input.terminal.includes(from)
              ? "terminal"
              : input.allowed[from].includes(to)
                ? "transitioned"
                : "invalid_transition");
      const expectedState = expectedCode === "transitioned" ? to : from;

      expect(input.transition(from, to), `${input.name}: ${from} -> ${to}`).toEqual({
        state: expectedState,
        code: expectedCode,
      });
    }
  }
}

describe("canonical communications state machines", () => {
  it("allows only the documented connection transitions", () => {
    const states: readonly ChannelConnectionState[] = [
      "disabled",
      "configured",
      "sandbox_verified",
      "production_verified",
      "active",
      "suspended",
      "retired",
    ];
    expectLifecycle({
      name: "connection",
      states,
      terminal: ["retired"],
      transition: transitionConnection,
      allowed: {
        disabled: ["configured"],
        configured: ["disabled", "sandbox_verified", "retired"],
        sandbox_verified: ["production_verified", "suspended", "retired"],
        production_verified: ["active", "suspended", "retired"],
        active: ["suspended", "retired"],
        suspended: ["configured", "retired"],
        retired: [],
      },
    });
  });

  it("allows only the documented inbound receipt transitions and keeps quarantine disabled", () => {
    const states: readonly ProviderEventState[] = [
      "received",
      "signature_verified",
      "bounded_normalization",
      "persisted",
      "applied",
      "ignored_duplicate",
      "manual_review",
      "rejected_invalid",
      "quarantined",
      "dead_letter",
    ];
    expectLifecycle({
      name: "inbound",
      states,
      terminal: [
        "applied",
        "ignored_duplicate",
        "manual_review",
        "rejected_invalid",
        "quarantined",
        "dead_letter",
      ],
      transition: (from, to) => transitionInboundEvent(from, to, { quarantineEnabled: true }),
      allowed: {
        received: ["signature_verified", "rejected_invalid"],
        signature_verified: ["bounded_normalization", "rejected_invalid"],
        bounded_normalization: ["persisted", "rejected_invalid", "quarantined"],
        persisted: ["applied", "ignored_duplicate", "manual_review", "dead_letter"],
        applied: [],
        ignored_duplicate: [],
        manual_review: [],
        rejected_invalid: [],
        quarantined: [],
        dead_letter: [],
      },
    });

    expect(
      transitionInboundEvent("bounded_normalization", "quarantined", {
        quarantineEnabled: false,
      }),
    ).toEqual({ state: "bounded_normalization", code: "disabled" });
  });

  it("allows only the documented outbound transitions and rejects regressive delivery callbacks", () => {
    const states: readonly OutboundCommandState[] = [
      "draft",
      "policy_checked",
      "queued",
      "dispatching",
      "provider_accepted",
      "dispatch_unknown",
      "reconciliation_required",
      "reconciled_accepted",
      "confirmed_not_sent",
      "sent",
      "delivered",
      "read",
      "failed",
      "expired",
      "cancelled",
      "manual_review",
    ];
    expectLifecycle({
      name: "outbound",
      states,
      terminal: ["read", "failed", "expired", "cancelled", "manual_review"],
      transition: transitionOutboundCommand,
      forbiddenCode: (from, to) => {
        const deliveryPrecedence = ["sent", "delivered", "read"] as const;
        const fromPrecedence = deliveryPrecedence.indexOf(from as (typeof deliveryPrecedence)[number]);
        const toPrecedence = deliveryPrecedence.indexOf(to as (typeof deliveryPrecedence)[number]);
        return fromPrecedence > toPrecedence && toPrecedence >= 0 ? "regressive" : undefined;
      },
      allowed: {
        draft: ["policy_checked", "cancelled", "manual_review"],
        policy_checked: ["queued", "cancelled", "manual_review"],
        queued: ["dispatching", "cancelled", "expired", "manual_review"],
        dispatching: ["provider_accepted", "dispatch_unknown", "failed", "manual_review"],
        provider_accepted: ["sent", "failed", "manual_review"],
        dispatch_unknown: ["reconciliation_required", "manual_review"],
        reconciliation_required: ["reconciled_accepted", "confirmed_not_sent", "manual_review"],
        reconciled_accepted: ["sent", "manual_review"],
        confirmed_not_sent: ["queued", "cancelled", "expired", "manual_review"],
        sent: ["delivered", "read", "manual_review"],
        delivered: ["read", "manual_review"],
        read: [],
        failed: [],
        expired: [],
        cancelled: [],
        manual_review: [],
      },
    });

    expect(transitionOutboundCommand("delivered", "sent")).toEqual({
      state: "delivered",
      code: "regressive",
    });
    expect(transitionOutboundCommand("read", "delivered")).toEqual({
      state: "read",
      code: "regressive",
    });
    expect(transitionOutboundCommand("sent", "sent")).toEqual({
      state: "sent",
      code: "duplicate",
    });
  });

  it("allows only the documented consent, policy, template and binding transitions", () => {
    const consentStates: readonly ContactConsentState[] = [
      "not_requested",
      "granted",
      "withdrawn",
      "expired",
      "superseded",
    ];
    expectLifecycle({
      name: "consent",
      states: consentStates,
      terminal: ["withdrawn", "expired", "superseded"],
      transition: transitionContactConsent,
      allowed: {
        not_requested: ["granted", "superseded"],
        granted: ["withdrawn", "expired", "superseded"],
        withdrawn: [],
        expired: [],
        superseded: [],
      },
    });

    const policyStates: readonly ContactPolicyState[] = [
      "normal",
      "opt_out_pending",
      "withdrawn",
      "normal_after_review",
    ];
    expectLifecycle({
      name: "contact policy",
      states: policyStates,
      terminal: [],
      transition: transitionContactPolicy,
      allowed: {
        normal: ["opt_out_pending", "withdrawn"],
        opt_out_pending: ["withdrawn"],
        withdrawn: ["normal_after_review"],
        normal_after_review: ["opt_out_pending", "withdrawn"],
      },
    });

    const templateStates: readonly TemplateLifecycleState[] = [
      "draft",
      "internally_approved",
      "submitted",
      "provider_approved",
      "provider_rejected",
      "paused",
      "disabled",
      "superseded",
    ];
    expectLifecycle({
      name: "template",
      states: templateStates,
      terminal: ["provider_rejected", "disabled", "superseded"],
      transition: transitionTemplateLifecycle,
      allowed: {
        draft: ["internally_approved", "disabled", "superseded"],
        internally_approved: ["submitted", "disabled", "superseded"],
        submitted: ["provider_approved", "provider_rejected", "disabled", "superseded"],
        provider_approved: ["paused", "disabled", "superseded"],
        provider_rejected: [],
        paused: ["provider_approved", "disabled", "superseded"],
        disabled: [],
        superseded: [],
      },
    });

    const bindingStates: readonly BindingTrustState[] = [
      "unlinked",
      "candidate_match",
      "linked_prospect",
      "linked_client",
      "verification_due",
      "reverified",
      "reassignment_suspected",
      "suspended",
      "revoked",
    ];
    expectLifecycle({
      name: "binding",
      states: bindingStates,
      terminal: ["reassignment_suspected", "revoked"],
      transition: transitionBindingTrust,
      allowed: {
        unlinked: ["candidate_match"],
        candidate_match: ["unlinked", "linked_prospect", "linked_client"],
        linked_prospect: ["verification_due", "suspended", "revoked"],
        linked_client: ["verification_due", "suspended", "revoked"],
        verification_due: ["reverified", "suspended", "revoked"],
        reverified: ["verification_due", "suspended", "revoked"],
        reassignment_suspected: [],
        suspended: ["verification_due", "revoked"],
        revoked: [],
      },
    });
  });

  it("preserves every M003 ownership transition through the canonical kernel", () => {
    const states: readonly ConversationOwnershipState[] = [
      "new",
      "ai_active",
      "human_requested",
      "waiting_for_human",
      "human_active",
      "returned_to_ai",
      "closed",
      "expired",
      "restricted",
    ];
    expectLifecycle({
      name: "conversation ownership",
      states,
      terminal: ["closed", "expired", "restricted"],
      transition: transitionConversationOwnership,
      allowed: {
        new: ["ai_active", "human_requested", "closed", "expired", "restricted"],
        ai_active: ["human_requested", "closed", "expired", "restricted"],
        human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
        waiting_for_human: ["human_active", "closed", "expired", "restricted"],
        human_active: ["returned_to_ai", "closed", "expired", "restricted"],
        returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
        closed: [],
        expired: [],
        restricted: [],
      },
    });
  });
});

describe("canonical communications contracts", () => {
  it("serializes canonical records without provider, phone, credential, URL, case or payment fields", () => {
    const receivedAt = new Date("2026-08-20T00:00:00.000Z");
    const locale: ChannelLocale = "en";
    const channel: ChannelKind = "whatsapp";
    const inbound: InboundChannelEvent = {
      eventId: "event_1",
      channel,
      locale,
      connectionState: "configured",
      bindingId: "binding_1",
      conversationId: "conversation_1",
      messageId: "message_1",
      receivedAt,
      state: "received",
      correlationId: "correlation_1",
    };
    const command: OutboundMessageCommand = {
      commandId: "command_1",
      channel,
      locale,
      conversationId: "conversation_1",
      bindingId: "binding_1",
      messageId: "message_2",
      idempotencyKey: "idempotency_1",
      state: "queued",
      createdAt: receivedAt,
      correlationId: "correlation_1",
    };
    const attempt: OutboundDispatchAttempt = {
      attemptId: "attempt_1",
      commandId: "command_1",
      ordinal: 1,
      state: "dispatching",
      startedAt: receivedAt,
      correlationId: "correlation_1",
    };
    const policy: ChannelContactPolicy = {
      policyId: "policy_1",
      bindingId: "binding_1",
      state: "normal",
      version: 1,
      updatedAt: receivedAt,
    };
    const binding: ContactChannelBinding = {
      bindingId: "binding_1",
      channel,
      trustState: "candidate_match",
      createdAt: receivedAt,
      updatedAt: receivedAt,
    };
    const conversation: ChannelConversation = {
      id: "conversation_1",
      channel,
      locale,
      status: "ai_active",
      participantIds: ["participant_1"],
      version: 1,
      createdAt: receivedAt,
      updatedAt: receivedAt,
      lastActivityAt: receivedAt,
    };
    const message: ChannelMessage = {
      id: "message_1",
      conversationId: "conversation_1",
      channel,
      direction: "inbound",
      senderParticipantId: "participant_1",
      locale,
      kind: "text",
      body: "Synthetic public message",
      createdAt: receivedAt,
    };
    const participant: ChannelParticipant = {
      participantId: "participant_1",
      conversationId: "conversation_1",
      bindingId: "binding_1",
      role: "external_contact",
      createdAt: receivedAt,
    };
    const handoff: ChannelHandoffReceipt = {
      receiptId: "receipt_1",
      conversationId: "conversation_1",
      state: "queued",
      issuedAt: receivedAt,
    };
    const receipt: DomainReceipt = {
      receiptId: "receipt_2",
      owner: "communications",
      operation: "handoff",
      resourceId: "conversation_1",
      idempotencyKey: "idempotency_1",
      issuedAt: receivedAt,
      expiresAt: receivedAt,
    };
    const capabilities: ProviderCapabilitySnapshot = {
      channel,
      connectionState: "configured",
      supportsTemplates: false,
      supportsMedia: false,
      capturedAt: receivedAt,
    };
    const template: MessageTemplateProjection = {
      templateId: "template_1",
      locale,
      state: "draft",
      version: 1,
      updatedAt: receivedAt,
    };
    const audit: ChannelAuditEvent = {
      event: "outbound_queued",
      channel,
      correlationId: "correlation_1",
      occurredAt: receivedAt,
      reasonCode: "policy_checked",
    };

    const serialized = JSON.stringify({
      inbound,
      command,
      attempt,
      policy,
      binding,
      conversation,
      message,
      participant,
      handoff,
      receipt,
      capabilities,
      template,
      audit,
    });

    expect(serialized).not.toMatch(/meta|waba|graph|phone|authorization|credential|url|case|payment/iu);
  });
});
