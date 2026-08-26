import { describe, expect, it } from "vitest";
import {
  dispatchFormOutbox,
  KnownNoEffectFormOwnerError,
  reconcileFormOutbox,
  reconcileUnknownPersistedFormOutbox,
} from "../../packages/domain/src/public-forms/jobs.ts";
import type { FormOutboxCommand } from "../../packages/domain/src/public-forms/ports.ts";
import type {
  AcceptedFormSubmission,
  FormConsentEvidence,
} from "../../packages/domain/src/public-forms/repository.ts";
import {
  createProviderDisabledPublicFormPorts,
  SyntheticFormOutboxStore,
} from "../../packages/domain/src/public-forms/synthetic-ports.ts";
import {
  type PublicFormTelemetryEvent,
  recordPublicFormTelemetry,
} from "../../packages/observability/src/public-forms.ts";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const CORRELATION_ID = "form_correlation_0123456789abcdef0123456789abcdef";

function consent(consentType: string): FormConsentEvidence {
  return Object.freeze({
    consentType,
    version: "1.0.0",
    disclosureReference: `disclosure:${consentType}:1.0.0:es`,
    granted: true,
    source: "public_form",
    sessionBindingDigest: "session_digest_01",
    occurredAt: NOW,
  });
}

function command(
  owner: FormOutboxCommand["owner"],
  operation: string,
  suffix: string,
  channel?: FormOutboxCommand["channel"],
): FormOutboxCommand {
  return Object.freeze({
    commandId: `form_outbox_${suffix}`,
    owner,
    operation,
    submissionRef: "form_submission_01",
    formCode: "contact",
    locale: "es",
    serviceCode: "general_contact",
    ...(channel ? { channel } : {}),
    idempotencyKey: `form_submission_01:${owner}:${operation}:${channel ?? suffix}`,
    state: "pending",
  });
}

function acceptedSubmission(input?: {
  consents?: readonly FormConsentEvidence[];
  outbox?: readonly FormOutboxCommand[];
}): AcceptedFormSubmission {
  return Object.freeze({
    submissionId: "form_submission_01",
    receipt: Object.freeze({ status: "accepted", receiptId: "form_receipt_01", issuedAt: NOW }),
    formCode: "contact",
    formVersion: "1.0.0",
    locale: "es",
    sessionBindingDigest: "session_digest_01",
    nonceDigest: "nonce_digest_01",
    commandDigest: "command_digest_01",
    answers: Object.freeze([]),
    consents: Object.freeze(
      input?.consents ?? [
        consent("privacy_policy"),
        consent("service_contact"),
        consent("electronic_communications"),
        consent("whatsapp_contact"),
        consent("financial_product_referral"),
      ],
    ),
    outbox: Object.freeze(
      input?.outbox ?? [
        command("lead", "accept_candidate", "lead"),
        command("appointment", "request_preference", "calendar"),
        command("payment", "request_handoff", "payment"),
        command("channel", "queue_handoff", "whatsapp", "whatsapp"),
        command("channel", "request_chat_handoff", "chat"),
        command("channel", "request_voice_handoff", "voice"),
        command("notification", "send_confirmation", "notification", "email"),
        command("analytics", "form_accepted", "analytics"),
      ],
    ),
    acceptedAt: NOW,
  });
}

describe("M006 synthetic owner integration flow", () => {
  it("keeps CRM, calendar and payment truthful when every provider is disabled", async () => {
    const store = new SyntheticFormOutboxStore();
    const ports = createProviderDisabledPublicFormPorts();
    const events: PublicFormTelemetryEvent[] = [];

    const result = await dispatchFormOutbox(acceptedSubmission(), {
      store,
      ports,
      now: () => NOW,
      correlationId: CORRELATION_ID,
      telemetry: (event) => events.push(recordPublicFormTelemetry(event)),
    });

    expect(result).toMatchObject({
      lead: "pending",
      calendar: "unavailable",
      payment: "unavailable",
      nextAction: "manual_follow_up",
    });
    expect(result.serviceStarted).toBeUndefined();
    expect(ports.receipts.map((receipt) => receipt.boundary)).toEqual([
      "crm_lead_contact_activity",
      "calendar_availability",
      "stripe_preliminary_order_checkout_intent",
      "whatsapp_handoff",
      "chat_handoff",
      "voice_handoff",
      "notification",
      "analytics",
    ]);
    expect(ports.receipts.every((receipt) => receipt.effect === "none")).toBe(true);
    expect(JSON.stringify(ports.receipts)).not.toMatch(/slots|amount|price|paid|serviceStarted/iu);
    expect(events).toEqual([
      {
        operation: "dispatch",
        result: "partial",
        locale: "es",
        formCode: "contact",
        status: "manual_follow_up",
        durationBucket: "not_applicable",
        correlationId: CORRELATION_ID,
      },
    ]);
    expect(JSON.stringify(events)).not.toMatch(/email|phone|answers|ciphertext/iu);
  });

  it("blocks payment and communication effects when their separate consent is absent", async () => {
    const store = new SyntheticFormOutboxStore();
    const ports = createProviderDisabledPublicFormPorts();
    const submission = acceptedSubmission({
      consents: [consent("privacy_policy")],
      outbox: [
        command("lead", "accept_candidate", "lead"),
        command("payment", "request_handoff", "payment"),
        command("channel", "queue_handoff", "whatsapp", "whatsapp"),
        command("channel", "request_chat_handoff", "chat"),
        command("channel", "request_voice_handoff", "voice"),
        command("notification", "send_confirmation", "notification", "email"),
      ],
    });

    const result = await dispatchFormOutbox(submission, {
      store,
      ports,
      now: () => NOW,
      correlationId: CORRELATION_ID,
    });

    expect(
      result.commandReceipts
        .filter((receipt) => receipt.status === "blocked")
        .map((receipt) => receipt.operation),
    ).toEqual([
      "request_handoff",
      "queue_handoff",
      "request_chat_handoff",
      "request_voice_handoff",
      "send_confirmation",
    ]);
    expect(ports.receipts.map((receipt) => receipt.boundary)).toEqual([
      "crm_lead_contact_activity",
    ]);
    expect(result.payment).toBe("blocked");
    expect(result.serviceStarted).toBeUndefined();
  });

  it("leases a transient failure for bounded reconciliation without duplicating the effect", async () => {
    let currentTime = NOW;
    let failFirstAttempt = true;
    const store = new SyntheticFormOutboxStore();
    const disabled = createProviderDisabledPublicFormPorts();
    const ports = {
      ...disabled,
      lead: {
        async accept(commandValue: FormOutboxCommand) {
          if (failFirstAttempt) {
            failFirstAttempt = false;
            throw new KnownNoEffectFormOwnerError("synthetic transient owner failure");
          }
          return Object.freeze({
            status: "linked" as const,
            receiptId: `crm_receipt_${commandValue.commandId}`,
          });
        },
      },
    };
    const submission = acceptedSubmission({
      outbox: [command("lead", "accept_candidate", "lead")],
    });

    const first = await dispatchFormOutbox(submission, {
      store,
      ports,
      now: () => currentTime,
      retryDelayMs: 1_000,
      correlationId: CORRELATION_ID,
    });
    expect(first).toMatchObject({ lead: "retry_scheduled", nextAction: "retry_scheduled" });

    currentTime = new Date(NOW.getTime() + 1_001);
    const reconciled = await reconcileFormOutbox(submission, {
      store,
      ports,
      now: () => currentTime,
      retryDelayMs: 1_000,
      correlationId: CORRELATION_ID,
    });
    expect(reconciled).toMatchObject({ lead: "linked", nextAction: "owner_follow_up" });

    const replay = await dispatchFormOutbox(submission, {
      store,
      ports,
      now: () => currentTime,
      correlationId: CORRELATION_ID,
    });
    expect(replay.lead).toBe("linked");
    expect(store.snapshot("form_submission_01")).toEqual([
      expect.objectContaining({
        attempts: 2,
        idempotencyKey: "form_submission_01:lead:accept_candidate:lead",
        state: "completed",
        receipt: expect.objectContaining({ status: "linked" }),
      }),
    ]);
  });

  it("does not retry an ambiguous owner result that may already have produced an effect", async () => {
    const store = new SyntheticFormOutboxStore();
    const disabled = createProviderDisabledPublicFormPorts();
    const ports = {
      ...disabled,
      lead: {
        async accept() {
          throw new Error("ambiguous synthetic timeout");
        },
      },
    };
    const submission = acceptedSubmission({
      outbox: [command("lead", "accept_candidate", "lead")],
    });

    const first = await dispatchFormOutbox(submission, {
      store,
      ports,
      now: () => NOW,
      correlationId: CORRELATION_ID,
    });
    const replay = await dispatchFormOutbox(submission, {
      store,
      ports,
      now: () => new Date(NOW.getTime() + 60_000),
      correlationId: CORRELATION_ID,
    });

    expect(first).toMatchObject({ lead: "unknown", nextAction: "manual_follow_up" });
    expect(replay.lead).toBe("unknown");
    expect(store.snapshot("form_submission_01")).toEqual([
      expect.objectContaining({ state: "unknown", attempts: 1 }),
    ]);
  });

  it("propagates a verified channel revocation once while ordinary channel work remains consent-gated", async () => {
    const store = new SyntheticFormOutboxStore();
    const ports = createProviderDisabledPublicFormPorts();
    const revocation = Object.freeze({
      ...command("channel", "apply_consent_revocation", "revoke_whatsapp", "whatsapp"),
      consentType: "whatsapp_contact",
      revocationId: "form_consent_revocation_01",
    });
    const ordinary = command("channel", "queue_handoff", "ordinary_whatsapp", "whatsapp");
    const result = await dispatchFormOutbox(
      acceptedSubmission({ consents: [consent("privacy_policy")], outbox: [revocation, ordinary] }),
      { store, ports, now: () => NOW, correlationId: CORRELATION_ID },
    );

    expect(
      ports.receipts
        .filter((receipt) => receipt.owner === "channel")
        .map((receipt) => receipt.operation),
    ).toEqual(["apply_consent_revocation"]);
    expect(
      result.commandReceipts.find((receipt) => receipt.operation === "queue_handoff")?.status,
    ).toBe("blocked");
  });

  it("claims unknown work only to query the owner and never blind-redispatches it", async () => {
    const store = new SyntheticFormOutboxStore();
    const disabled = createProviderDisabledPublicFormPorts();
    let dispatched = 0;
    const ports = {
      ...disabled,
      lead: {
        async accept() {
          dispatched += 1;
          throw new Error("ambiguous");
        },
        async queryByIdempotency(commandValue: FormOutboxCommand) {
          return Object.freeze({
            status: "linked" as const,
            receiptId: `query_${commandValue.idempotencyKey}`,
          });
        },
      },
    };
    const submission = acceptedSubmission({
      outbox: [command("lead", "accept_candidate", "unknown_query")],
    });
    await dispatchFormOutbox(submission, {
      store,
      ports,
      now: () => NOW,
      correlationId: CORRELATION_ID,
    });
    const reconciled = await reconcileUnknownPersistedFormOutbox(
      {
        submissionRef: submission.submissionId,
        formCode: submission.formCode,
        locale: submission.locale,
      },
      { store, ports, now: () => NOW, correlationId: CORRELATION_ID },
    );

    expect(dispatched).toBe(1);
    expect(reconciled.lead).toBe("linked");
  });
});
