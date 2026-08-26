import type { HandoffReason, HumanHandoffPort } from "../public-chat/providers.ts";
import type {
  CommunicationsRepository,
  ContactWithdrawalEvidence,
  DispatchReconciliationReceipt,
  ReconcileTemplateCommand,
  TemplateProviderReconciliationReceipt,
} from "./repository.ts";
import type { ContentPolicyPort } from "./service.ts";

export type JobResult = {
  readonly status: string;
  readonly code?: string;
  readonly [key: string]: unknown;
};

export interface JobBoundedExecutor {
  run<T>(operation: string, timeoutMs: number, action: () => Promise<T>): Promise<T>;
}

export type M002SourceReceipt = {
  receiptId: string;
  owner: "public_knowledge";
  source: "M002";
  sourceId: string;
  sourceVersion: string;
  reviewVersion: string;
  disclosureVersion: string;
  issuedAt: Date;
  expiresAt: Date;
  correlationId: string;
};

export interface PublicOrientationPort {
  answer(input: {
    prompt: string;
    locale: "en" | "es";
    correlationId: string;
  }): Promise<
    { status: "available"; text: string; receipt?: M002SourceReceipt } | { status: "unavailable" }
  >;
}

export type OwningDomainReceipt = {
  receiptId: string;
  owner: "appointments" | "documents" | "leads" | "payments";
  operation: "book_appointment" | "capture_lead" | "issue_payment_link" | "issue_upload_link";
  bindingId: string;
  resourceId: string;
  idempotencyKey: string;
  result: "succeeded";
  issuedAt: Date;
  expiresAt: Date;
  correlationId: string;
};

export type OwningActionIntent = "appointment" | "document_upload" | "lead" | "payment_link";

export interface OwningDomainActionPort {
  execute(input: {
    intent: OwningActionIntent;
    bindingId: string;
    conversationId: string;
    resourceId: string;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<
    | { status: "completed" | "duplicate"; receipt?: OwningDomainReceipt }
    | { status: "replay_mismatch" | "unavailable" }
  >;
}

export type InboundJobIntent =
  | "appointment"
  | "case_status"
  | "document_question"
  | "document_upload"
  | "handoff"
  | "lead"
  | "media"
  | "opt_out"
  | "payment_link"
  | "payment_question"
  | "preliminary_intake"
  | "public_orientation"
  | "reassigned_number"
  | "sensitive"
  | "verification_expired"
  | "wrong_person";

export type ProcessInboundInput = {
  repository: CommunicationsRepository;
  executor: JobBoundedExecutor;
  contentPolicy: ContentPolicyPort;
  publicOrientation?: PublicOrientationPort;
  owningAction?: OwningDomainActionPort;
  humanHandoff?: HumanHandoffPort;
  handoffReason?: HandoffReason;
  eventId: string;
  leaseOwner: string;
  leaseExpiresAt: Date;
  requiredPolicyVersion: number;
  intent: InboundJobIntent;
  now: Date;
  prompt?: string;
  resourceId?: string;
  idempotencyKey?: string;
  withdrawalEvidence?: ContactWithdrawalEvidence;
  knowledgeTimeoutMs: number;
  ownerTimeoutMs: number;
};

export type DispatchOutboundInput = {
  service: {
    dispatchOutbound(input: {
      commandId: string;
      leaseOwner: string;
      leaseExpiresAt: Date;
    }): Promise<Record<string, unknown>>;
  };
  commandId: string;
  leaseOwner: string;
  leaseExpiresAt: Date;
};

export type ReconcileDispatchInput = {
  repository: CommunicationsRepository;
  commandId: string;
  attemptId: string;
  receipt?: DispatchReconciliationReceipt;
  now: Date;
  automaticResend?: boolean;
};

export type ReconcileTemplateInput = Omit<ReconcileTemplateCommand, "receipt"> & {
  repository: CommunicationsRepository;
  capability: { templateProjection: boolean };
  receipt?: TemplateProviderReconciliationReceipt;
};

export type ExpireRecoveryInput = {
  repository: CommunicationsRepository;
  now: Date;
  limit: number;
};

const RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
const INBOUND_RECOVERY_ATTEMPT_LIMIT = 3;
const OWNER_ACTION = {
  appointment: ["appointments", "book_appointment"],
  document_upload: ["documents", "issue_upload_link"],
  lead: ["leads", "capture_lead"],
  payment_link: ["payments", "issue_payment_link"],
} as const satisfies Record<
  OwningActionIntent,
  readonly [OwningDomainReceipt["owner"], OwningDomainReceipt["operation"]]
>;

function currentReceipt(receipt: { issuedAt: Date; expiresAt: Date }, now: Date): boolean {
  return (
    Number.isFinite(receipt.issuedAt.getTime()) &&
    Number.isFinite(receipt.expiresAt.getTime()) &&
    receipt.issuedAt <= now &&
    receipt.expiresAt > now
  );
}

function validM002Receipt(
  receipt: M002SourceReceipt | undefined,
  correlationId: string,
  now: Date,
): receipt is M002SourceReceipt {
  return Boolean(
    receipt &&
      RECEIPT_ID.test(receipt.receiptId) &&
      receipt.owner === "public_knowledge" &&
      receipt.source === "M002" &&
      receipt.sourceId &&
      receipt.sourceVersion &&
      receipt.reviewVersion &&
      receipt.disclosureVersion &&
      receipt.correlationId === correlationId &&
      currentReceipt(receipt, now),
  );
}

function validOwnerReceipt(
  receipt: OwningDomainReceipt | undefined,
  expected: {
    owner: OwningDomainReceipt["owner"];
    operation: OwningDomainReceipt["operation"];
    bindingId: string;
    resourceId: string;
    idempotencyKey: string;
    correlationId: string;
  },
  now: Date,
): receipt is OwningDomainReceipt {
  return Boolean(
    receipt &&
      RECEIPT_ID.test(receipt.receiptId) &&
      receipt.owner === expected.owner &&
      receipt.operation === expected.operation &&
      receipt.bindingId === expected.bindingId &&
      receipt.resourceId === expected.resourceId &&
      receipt.idempotencyKey === expected.idempotencyKey &&
      receipt.result === "succeeded" &&
      receipt.correlationId === expected.correlationId &&
      currentReceipt(receipt, now),
  );
}

async function finishInbound(
  input: ProcessInboundInput,
  claim: Extract<
    Awaited<ReturnType<CommunicationsRepository["claimInbound"]>>,
    { status: "claimed" }
  >,
  outcome: "applied" | "manual_review" | "dead_letter",
  result: JobResult,
): Promise<JobResult> {
  const completed = await input.repository.completeInbound({
    eventId: input.eventId,
    leaseOwner: input.leaseOwner,
    leaseVersion: claim.leaseVersion,
    outcome,
    now: input.now,
  });
  return completed === "completed"
    ? result
    : { status: "recovery_required", code: "inbound_completion_conflict", eventId: input.eventId };
}

export async function processInboundChannelEvent(input: ProcessInboundInput): Promise<JobResult> {
  const claim = await input.repository.claimInbound({
    eventId: input.eventId,
    leaseOwner: input.leaseOwner,
    leaseExpiresAt: input.leaseExpiresAt,
    requiredPolicyVersion: input.requiredPolicyVersion,
    now: input.now,
  });
  if (claim.status === "not_claimed") {
    return claim.code === "already_completed"
      ? { status: "duplicate", eventId: input.eventId }
      : { status: "recovery_required", code: claim.code, eventId: input.eventId };
  }

  if (
    claim.policyState === "opt_out_pending" ||
    claim.policyState === "withdrawn" ||
    input.intent === "opt_out"
  ) {
    if (claim.policyState === "withdrawn") {
      return finishInbound(input, claim, "applied", {
        status: "completed",
        code: "contact_already_withdrawn",
        eventId: input.eventId,
      });
    }
    if (!input.withdrawalEvidence) {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "opt_out_evidence_required",
        eventId: input.eventId,
      });
    }
    const withdrawal = await input.repository.withdrawContact({
      bindingId: claim.envelope.event.bindingId,
      evidence: input.withdrawalEvidence,
      now: input.now,
    });
    if (withdrawal.status === "denied") {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: withdrawal.code,
        eventId: input.eventId,
      });
    }
    return finishInbound(input, claim, "applied", {
      status: "completed",
      code: "contact_withdrawn",
      eventId: input.eventId,
    });
  }

  const suspensionReason =
    input.intent === "wrong_person"
      ? "wrong_person"
      : input.intent === "reassigned_number"
        ? "reassigned"
        : input.intent === "verification_expired"
          ? "expired"
          : undefined;
  if (suspensionReason) {
    const suspended = await input.repository.suspendBinding({
      bindingId: claim.envelope.event.bindingId,
      reason: suspensionReason,
      now: input.now,
    });
    return finishInbound(
      input,
      claim,
      suspended.status === "denied" ? "manual_review" : "applied",
      suspended.status === "denied"
        ? { status: "manual_review", code: suspended.code, eventId: input.eventId }
        : { status: "completed", code: "binding_suspended", eventId: input.eventId },
    );
  }

  if (input.intent === "media") {
    return finishInbound(input, claim, "applied", {
      status: "portal_safe",
      code: "media_fetch_disabled",
      route: "secure_upload_portal",
    });
  }
  if (input.intent === "preliminary_intake") {
    return finishInbound(input, claim, "applied", {
      status: "portal_safe",
      code: "preliminary_intake_disabled",
      route: "secure_portal",
    });
  }
  if (
    input.intent === "case_status" ||
    input.intent === "payment_question" ||
    input.intent === "document_question" ||
    input.intent === "sensitive"
  ) {
    return finishInbound(input, claim, "applied", {
      status: "portal_safe",
      code: "protected_intent",
      route: "secure_portal",
    });
  }

  if (input.intent === "handoff") {
    const idempotencyKey = input.idempotencyKey ?? "";
    const humanHandoff = input.humanHandoff;
    if (!humanHandoff || !idempotencyKey) {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "handoff_unavailable",
      });
    }
    try {
      const handoff = await input.executor.run("communications_handoff", input.ownerTimeoutMs, () =>
        humanHandoff.enqueue({
          conversationId: claim.envelope.conversation.id,
          locale: claim.envelope.event.locale,
          reason: input.handoffReason ?? "visitor_requested",
          correlationId: claim.envelope.event.correlationId,
          idempotencyKey,
        }),
      );
      if (
        handoff.status !== "queued" ||
        !RECEIPT_ID.test(handoff.receiptId) ||
        !(handoff.queuedAt instanceof Date) ||
        !Number.isFinite(handoff.queuedAt.getTime())
      ) {
        return finishInbound(input, claim, "manual_review", {
          status: "manual_review",
          code: "handoff_unavailable",
        });
      }
      return finishInbound(input, claim, "applied", {
        status: "handoff_queued",
        receiptId: handoff.receiptId,
        queuedAt: handoff.queuedAt,
      });
    } catch {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "handoff_unavailable",
      });
    }
  }

  if (input.intent === "public_orientation") {
    const publicOrientation = input.publicOrientation;
    if (!publicOrientation) {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "knowledge_unavailable",
      });
    }
    try {
      const answer = await input.executor.run(
        "communications_public_orientation",
        input.knowledgeTimeoutMs,
        () =>
          publicOrientation.answer({
            prompt: input.prompt ?? "",
            locale: claim.envelope.event.locale,
            correlationId: claim.envelope.event.correlationId,
          }),
      );
      if (answer.status !== "available") {
        return finishInbound(input, claim, "manual_review", {
          status: "manual_review",
          code: "knowledge_unavailable",
        });
      }
      if (!validM002Receipt(answer.receipt, claim.envelope.event.correlationId, input.now)) {
        return finishInbound(input, claim, "manual_review", {
          status: "manual_review",
          code: "knowledge_receipt_invalid",
        });
      }
      const policy = input.contentPolicy.evaluate({ text: answer.text });
      if (!policy.allowed) {
        return finishInbound(input, claim, "manual_review", {
          status: "manual_review",
          code: "prohibited_content",
        });
      }
      return finishInbound(input, claim, "applied", {
        status: "answered",
        text: answer.text,
        sourceReceipt: answer.receipt,
      });
    } catch {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "knowledge_unavailable",
      });
    }
  }

  if (Object.hasOwn(OWNER_ACTION, input.intent)) {
    const intent = input.intent as OwningActionIntent;
    const [owner, operation] = OWNER_ACTION[intent];
    const resourceId = input.resourceId ?? "";
    const idempotencyKey = input.idempotencyKey ?? "";
    const owningAction = input.owningAction;
    if (!owningAction || !resourceId || !idempotencyKey) {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "owning_service_unavailable",
      });
    }
    try {
      const action = await input.executor.run(
        `communications_owner_${intent}`,
        input.ownerTimeoutMs,
        () =>
          owningAction.execute({
            intent,
            bindingId: claim.envelope.event.bindingId,
            conversationId: claim.envelope.conversation.id,
            resourceId,
            idempotencyKey,
            correlationId: claim.envelope.event.correlationId,
          }),
      );
      if (
        (action.status !== "completed" && action.status !== "duplicate") ||
        !validOwnerReceipt(
          action.receipt,
          {
            owner,
            operation,
            bindingId: claim.envelope.event.bindingId,
            resourceId,
            idempotencyKey,
            correlationId: claim.envelope.event.correlationId,
          },
          input.now,
        )
      ) {
        return finishInbound(input, claim, "manual_review", {
          status: "manual_review",
          code:
            action.status === "replay_mismatch"
              ? "owner_receipt_mismatch"
              : "owner_receipt_invalid",
        });
      }
      return finishInbound(input, claim, "applied", {
        status: "owner_action_completed",
        receiptId: action.receipt.receiptId,
      });
    } catch {
      return finishInbound(input, claim, "manual_review", {
        status: "manual_review",
        code: "owning_service_unavailable",
      });
    }
  }

  return finishInbound(input, claim, "manual_review", {
    status: "manual_review",
    code: "unsupported_intent",
  });
}

export async function dispatchOutboundMessage(input: DispatchOutboundInput): Promise<JobResult> {
  return {
    ...(await input.service.dispatchOutbound({
      commandId: input.commandId,
      leaseOwner: input.leaseOwner,
      leaseExpiresAt: input.leaseExpiresAt,
    })),
  } as JobResult;
}

export async function reconcileUnknownDispatch(input: ReconcileDispatchInput): Promise<JobResult> {
  if (input.automaticResend) {
    return { status: "manual_review", code: "automatic_resend_forbidden" };
  }
  return {
    ...(await input.repository.reconcileOutbound({
      commandId: input.commandId,
      attemptId: input.attemptId,
      receipt: input.receipt,
      now: input.now,
    })),
  } as JobResult;
}

export async function reconcileMessageTemplate(input: ReconcileTemplateInput): Promise<JobResult> {
  if (!input.capability.templateProjection) {
    return { status: "manual_review", code: "template_reconciliation_unsupported" };
  }
  return {
    ...(await input.repository.reconcileTemplate({
      templateId: input.templateId,
      locale: input.locale,
      providerState: input.providerState,
      providerVersion: input.providerVersion,
      correlationId: input.correlationId,
      receipt: input.receipt,
      now: input.now,
    })),
  } as JobResult;
}

export async function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult> {
  if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100) {
    return { status: "rejected", code: "recovery_limit_invalid" };
  }
  const candidates = await input.repository.findRecoveryWork({
    now: input.now,
    limit: input.limit,
  });
  if (
    candidates.length > input.limit ||
    candidates.some(
      (candidate) =>
        candidate.kind === "inbound_lease_expired" &&
        (!Number.isSafeInteger(candidate.attempts) || candidate.attempts < 1),
    )
  ) {
    return { status: "manual_review", code: "recovery_state_invalid" };
  }
  const work: Record<string, unknown>[] = [];
  for (const candidate of candidates) {
    if (candidate.kind !== "inbound_lease_expired") {
      work.push({ ...candidate, disposition: "manual_review", terminal: true });
      continue;
    }
    if (candidate.attempts < INBOUND_RECOVERY_ATTEMPT_LIMIT) {
      work.push({ ...candidate, disposition: "retry_allowed", terminal: false });
      continue;
    }
    const persisted = await input.repository.deadLetterExpiredInbound({
      eventId: candidate.eventId,
      expectedAttempts: candidate.attempts,
      reason: "retry_exhausted",
      now: input.now,
    });
    if (persisted.status === "conflict") {
      work.push({
        ...candidate,
        disposition: "manual_review",
        terminal: false,
        code: persisted.code,
      });
      continue;
    }
    work.push({ ...candidate, disposition: "dead_letter", terminal: true });
  }
  return {
    status: "completed",
    code: candidates.length === 0 ? "no_recovery_work" : "recovery_work_found",
    work,
  };
}
