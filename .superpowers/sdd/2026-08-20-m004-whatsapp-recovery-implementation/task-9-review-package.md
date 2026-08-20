# Task 9 Review
Base: e16204c1c8af5b0596c6268637f683171b1cc506
Head: 12b6f5a
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/jobs.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/jobs.ts
new file mode 100644
index 0000000..b62bc5f
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/jobs.ts
@@ -0,0 +1,38 @@
+import {
+  dispatchOutboundMessage as dispatchDomainOutboundMessage,
+  expireChannelRecoveryState as expireDomainChannelRecoveryState,
+  processInboundChannelEvent as processDomainInboundChannelEvent,
+  reconcileMessageTemplate as reconcileDomainMessageTemplate,
+  reconcileUnknownDispatch as reconcileDomainUnknownDispatch,
+  type DispatchOutboundInput,
+  type ExpireRecoveryInput,
+  type JobResult,
+  type ProcessInboundInput,
+  type ReconcileDispatchInput,
+  type ReconcileTemplateInput,
+} from "@atlas/domain";
+
+export function processInboundChannelEvent(input: ProcessInboundInput): Promise<JobResult> {
+  return processDomainInboundChannelEvent(input);
+}
+
+export function dispatchOutboundMessage(
+  input: DispatchOutboundInput & { providerTrafficAllowed: boolean },
+): Promise<JobResult> {
+  if (!input.providerTrafficAllowed) {
+    return Promise.resolve({ status: "unavailable", code: "provider_disabled" });
+  }
+  return dispatchDomainOutboundMessage(input);
+}
+
+export function reconcileUnknownDispatch(input: ReconcileDispatchInput): Promise<JobResult> {
+  return reconcileDomainUnknownDispatch(input);
+}
+
+export function reconcileMessageTemplate(input: ReconcileTemplateInput): Promise<JobResult> {
+  return reconcileDomainMessageTemplate(input);
+}
+
+export function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult> {
+  return expireDomainChannelRecoveryState(input);
+}
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
index 2fd9408..b3adf5a 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
@@ -1,6 +1,7 @@
 export * from "./contracts.ts";
 export * from "./state-machines.ts";
 export * from "./channel-policy.ts";
 export * from "./repository.ts";
 export * from "./memory-repository.ts";
 export * from "./service.ts";
+export * from "./jobs.ts";
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
new file mode 100644
index 0000000..cb54236
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
@@ -0,0 +1,504 @@
+import type { ContentPolicyPort } from "./service.ts";
+import type {
+  CommunicationsRepository,
+  ContactWithdrawalEvidence,
+  DispatchReconciliationReceipt,
+  ReconcileTemplateCommand,
+  RecoveryCandidate,
+  TemplateProviderReconciliationReceipt,
+} from "./repository.ts";
+
+export type JobResult = {
+  readonly status: string;
+  readonly code?: string;
+  readonly [key: string]: unknown;
+};
+
+export interface JobBoundedExecutor {
+  run<T>(operation: string, timeoutMs: number, action: () => Promise<T>): Promise<T>;
+}
+
+export type M002SourceReceipt = {
+  receiptId: string;
+  owner: "public_knowledge";
+  source: "M002";
+  sourceId: string;
+  sourceVersion: string;
+  reviewVersion: string;
+  disclosureVersion: string;
+  issuedAt: Date;
+  expiresAt: Date;
+  correlationId: string;
+};
+
+export interface PublicOrientationPort {
+  answer(input: { prompt: string; locale: "en" | "es"; correlationId: string }): Promise<
+    | { status: "available"; text: string; receipt?: M002SourceReceipt }
+    | { status: "unavailable" }
+  >;
+}
+
+export type OwningDomainReceipt = {
+  receiptId: string;
+  owner: "appointments" | "communications" | "documents" | "leads" | "payments";
+  operation:
+    | "book_appointment"
+    | "capture_lead"
+    | "issue_payment_link"
+    | "issue_upload_link"
+    | "request_handoff";
+  bindingId: string;
+  resourceId: string;
+  idempotencyKey: string;
+  result: "succeeded";
+  issuedAt: Date;
+  expiresAt: Date;
+  correlationId: string;
+};
+
+export type OwningActionIntent =
+  | "appointment"
+  | "document_upload"
+  | "handoff"
+  | "lead"
+  | "payment_link";
+
+export interface OwningDomainActionPort {
+  execute(input: {
+    intent: OwningActionIntent;
+    bindingId: string;
+    conversationId: string;
+    resourceId: string;
+    idempotencyKey: string;
+    correlationId: string;
+  }): Promise<
+    | { status: "completed" | "duplicate"; receipt?: OwningDomainReceipt }
+    | { status: "replay_mismatch" | "unavailable" }
+  >;
+}
+
+export type InboundJobIntent =
+  | "appointment"
+  | "case_status"
+  | "document_question"
+  | "document_upload"
+  | "handoff"
+  | "lead"
+  | "media"
+  | "opt_out"
+  | "payment_link"
+  | "payment_question"
+  | "preliminary_intake"
+  | "public_orientation"
+  | "reassigned_number"
+  | "sensitive"
+  | "verification_expired"
+  | "wrong_person";
+
+export type ProcessInboundInput = {
+  repository: CommunicationsRepository;
+  executor: JobBoundedExecutor;
+  contentPolicy: ContentPolicyPort;
+  publicOrientation?: PublicOrientationPort;
+  owningAction?: OwningDomainActionPort;
+  eventId: string;
+  leaseOwner: string;
+  leaseExpiresAt: Date;
+  requiredPolicyVersion: number;
+  intent: InboundJobIntent;
+  now: Date;
+  prompt?: string;
+  resourceId?: string;
+  idempotencyKey?: string;
+  withdrawalEvidence?: ContactWithdrawalEvidence;
+  knowledgeTimeoutMs: number;
+  ownerTimeoutMs: number;
+};
+
+export type DispatchOutboundInput = {
+  service: {
+    dispatchOutbound(input: {
+      commandId: string;
+      leaseOwner: string;
+      leaseExpiresAt: Date;
+    }): Promise<Record<string, unknown>>;
+  };
+  commandId: string;
+  leaseOwner: string;
+  leaseExpiresAt: Date;
+};
+
+export type ReconcileDispatchInput = {
+  repository: CommunicationsRepository;
+  commandId: string;
+  attemptId: string;
+  receipt?: DispatchReconciliationReceipt;
+  now: Date;
+  automaticResend?: boolean;
+};
+
+export type ReconcileTemplateInput = Omit<ReconcileTemplateCommand, "receipt"> & {
+  repository: CommunicationsRepository;
+  capability: { templateProjection: boolean };
+  receipt?: TemplateProviderReconciliationReceipt;
+};
+
+export type ExpireRecoveryInput = {
+  repository: CommunicationsRepository;
+  now: Date;
+  limit: number;
+};
+
+const RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
+const OWNER_ACTION = {
+  appointment: ["appointments", "book_appointment"],
+  document_upload: ["documents", "issue_upload_link"],
+  handoff: ["communications", "request_handoff"],
+  lead: ["leads", "capture_lead"],
+  payment_link: ["payments", "issue_payment_link"],
+} as const satisfies Record<OwningActionIntent, readonly [OwningDomainReceipt["owner"], OwningDomainReceipt["operation"]]>;
+
+function currentReceipt(receipt: { issuedAt: Date; expiresAt: Date }, now: Date): boolean {
+  return (
+    Number.isFinite(receipt.issuedAt.getTime()) &&
+    Number.isFinite(receipt.expiresAt.getTime()) &&
+    receipt.issuedAt <= now &&
+    receipt.expiresAt > now
+  );
+}
+
+function validM002Receipt(
+  receipt: M002SourceReceipt | undefined,
+  correlationId: string,
+  now: Date,
+): receipt is M002SourceReceipt {
+  return Boolean(
+    receipt &&
+      RECEIPT_ID.test(receipt.receiptId) &&
+      receipt.owner === "public_knowledge" &&
+      receipt.source === "M002" &&
+      receipt.sourceId &&
+      receipt.sourceVersion &&
+      receipt.reviewVersion &&
+      receipt.disclosureVersion &&
+      receipt.correlationId === correlationId &&
+      currentReceipt(receipt, now),
+  );
+}
+
+function validOwnerReceipt(
+  receipt: OwningDomainReceipt | undefined,
+  expected: {
+    owner: OwningDomainReceipt["owner"];
+    operation: OwningDomainReceipt["operation"];
+    bindingId: string;
+    resourceId: string;
+    idempotencyKey: string;
+    correlationId: string;
+  },
+  now: Date,
+): receipt is OwningDomainReceipt {
+  return Boolean(
+    receipt &&
+      RECEIPT_ID.test(receipt.receiptId) &&
+      receipt.owner === expected.owner &&
+      receipt.operation === expected.operation &&
+      receipt.bindingId === expected.bindingId &&
+      receipt.resourceId === expected.resourceId &&
+      receipt.idempotencyKey === expected.idempotencyKey &&
+      receipt.result === "succeeded" &&
+      receipt.correlationId === expected.correlationId &&
+      currentReceipt(receipt, now),
+  );
+}
+
+async function finishInbound(
+  input: ProcessInboundInput,
+  claim: Extract<Awaited<ReturnType<CommunicationsRepository["claimInbound"]>>, { status: "claimed" }>,
+  outcome: "applied" | "manual_review" | "dead_letter",
+  result: JobResult,
+): Promise<JobResult> {
+  const completed = await input.repository.completeInbound({
+    eventId: input.eventId,
+    leaseOwner: input.leaseOwner,
+    leaseVersion: claim.leaseVersion,
+    outcome,
+    now: input.now,
+  });
+  return completed === "completed"
+    ? result
+    : { status: "recovery_required", code: "inbound_completion_conflict", eventId: input.eventId };
+}
+
+export async function processInboundChannelEvent(input: ProcessInboundInput): Promise<JobResult> {
+  const claim = await input.repository.claimInbound({
+    eventId: input.eventId,
+    leaseOwner: input.leaseOwner,
+    leaseExpiresAt: input.leaseExpiresAt,
+    requiredPolicyVersion: input.requiredPolicyVersion,
+    now: input.now,
+  });
+  if (claim.status === "not_claimed") {
+    return claim.code === "already_completed"
+      ? { status: "duplicate", eventId: input.eventId }
+      : { status: "recovery_required", code: claim.code, eventId: input.eventId };
+  }
+
+  if (
+    claim.policyState === "opt_out_pending" ||
+    claim.policyState === "withdrawn" ||
+    input.intent === "opt_out"
+  ) {
+    if (claim.policyState === "withdrawn") {
+      return finishInbound(input, claim, "applied", {
+        status: "completed",
+        code: "contact_already_withdrawn",
+        eventId: input.eventId,
+      });
+    }
+    if (!input.withdrawalEvidence) {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "opt_out_evidence_required",
+        eventId: input.eventId,
+      });
+    }
+    const withdrawal = await input.repository.withdrawContact({
+      bindingId: claim.envelope.event.bindingId,
+      evidence: input.withdrawalEvidence,
+      now: input.now,
+    });
+    if (withdrawal.status === "denied") {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: withdrawal.code,
+        eventId: input.eventId,
+      });
+    }
+    return finishInbound(input, claim, "applied", {
+      status: "completed",
+      code: "contact_withdrawn",
+      eventId: input.eventId,
+    });
+  }
+
+  const suspensionReason =
+    input.intent === "wrong_person"
+      ? "wrong_person"
+      : input.intent === "reassigned_number"
+        ? "reassigned"
+        : input.intent === "verification_expired"
+          ? "expired"
+          : undefined;
+  if (suspensionReason) {
+    const suspended = await input.repository.suspendBinding({
+      bindingId: claim.envelope.event.bindingId,
+      reason: suspensionReason,
+      now: input.now,
+    });
+    return finishInbound(
+      input,
+      claim,
+      suspended.status === "denied" ? "manual_review" : "applied",
+      suspended.status === "denied"
+        ? { status: "manual_review", code: suspended.code, eventId: input.eventId }
+        : { status: "completed", code: "binding_suspended", eventId: input.eventId },
+    );
+  }
+
+  if (input.intent === "media") {
+    return finishInbound(input, claim, "applied", {
+      status: "portal_safe",
+      code: "media_fetch_disabled",
+      route: "secure_upload_portal",
+    });
+  }
+  if (input.intent === "preliminary_intake") {
+    return finishInbound(input, claim, "applied", {
+      status: "portal_safe",
+      code: "preliminary_intake_disabled",
+      route: "secure_portal",
+    });
+  }
+  if (
+    input.intent === "case_status" ||
+    input.intent === "payment_question" ||
+    input.intent === "document_question" ||
+    input.intent === "sensitive"
+  ) {
+    return finishInbound(input, claim, "applied", {
+      status: "portal_safe",
+      code: "protected_intent",
+      route: "secure_portal",
+    });
+  }
+
+  if (input.intent === "public_orientation") {
+    if (!input.publicOrientation) {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "knowledge_unavailable",
+      });
+    }
+    try {
+      const answer = await input.executor.run(
+        "communications_public_orientation",
+        input.knowledgeTimeoutMs,
+        () =>
+          input.publicOrientation!.answer({
+            prompt: input.prompt ?? "",
+            locale: claim.envelope.event.locale,
+            correlationId: claim.envelope.event.correlationId,
+          }),
+      );
+      if (answer.status !== "available") {
+        return finishInbound(input, claim, "manual_review", {
+          status: "manual_review",
+          code: "knowledge_unavailable",
+        });
+      }
+      if (!validM002Receipt(answer.receipt, claim.envelope.event.correlationId, input.now)) {
+        return finishInbound(input, claim, "manual_review", {
+          status: "manual_review",
+          code: "knowledge_receipt_invalid",
+        });
+      }
+      const policy = input.contentPolicy.evaluate({ text: answer.text });
+      if (!policy.allowed) {
+        return finishInbound(input, claim, "manual_review", {
+          status: "manual_review",
+          code: "prohibited_content",
+        });
+      }
+      return finishInbound(input, claim, "applied", {
+        status: "answered",
+        text: answer.text,
+        sourceReceipt: answer.receipt,
+      });
+    } catch {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "knowledge_unavailable",
+      });
+    }
+  }
+
+  if (Object.hasOwn(OWNER_ACTION, input.intent)) {
+    const intent = input.intent as OwningActionIntent;
+    const [owner, operation] = OWNER_ACTION[intent];
+    const resourceId = intent === "handoff" ? claim.envelope.conversation.id : input.resourceId ?? "";
+    const idempotencyKey = input.idempotencyKey ?? "";
+    if (!input.owningAction || !resourceId || !idempotencyKey) {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "owning_service_unavailable",
+      });
+    }
+    try {
+      const action = await input.executor.run(
+        `communications_owner_${intent}`,
+        input.ownerTimeoutMs,
+        () =>
+          input.owningAction!.execute({
+            intent,
+            bindingId: claim.envelope.event.bindingId,
+            conversationId: claim.envelope.conversation.id,
+            resourceId,
+            idempotencyKey,
+            correlationId: claim.envelope.event.correlationId,
+          }),
+      );
+      if (
+        (action.status !== "completed" && action.status !== "duplicate") ||
+        !validOwnerReceipt(
+          action.receipt,
+          {
+            owner,
+            operation,
+            bindingId: claim.envelope.event.bindingId,
+            resourceId,
+            idempotencyKey,
+            correlationId: claim.envelope.event.correlationId,
+          },
+          input.now,
+        )
+      ) {
+        return finishInbound(input, claim, "manual_review", {
+          status: "manual_review",
+          code: action.status === "replay_mismatch" ? "owner_receipt_mismatch" : "owner_receipt_invalid",
+        });
+      }
+      return finishInbound(input, claim, "applied", {
+        status: "owner_action_completed",
+        receiptId: action.receipt.receiptId,
+      });
+    } catch {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "owning_service_unavailable",
+      });
+    }
+  }
+
+  return finishInbound(input, claim, "manual_review", {
+    status: "manual_review",
+    code: "unsupported_intent",
+  });
+}
+
+export async function dispatchOutboundMessage(input: DispatchOutboundInput): Promise<JobResult> {
+  return {
+    ...(await input.service.dispatchOutbound({
+      commandId: input.commandId,
+      leaseOwner: input.leaseOwner,
+      leaseExpiresAt: input.leaseExpiresAt,
+    })),
+  } as JobResult;
+}
+
+export async function reconcileUnknownDispatch(input: ReconcileDispatchInput): Promise<JobResult> {
+  if (input.automaticResend) {
+    return { status: "manual_review", code: "automatic_resend_forbidden" };
+  }
+  return {
+    ...(await input.repository.reconcileOutbound({
+      commandId: input.commandId,
+      attemptId: input.attemptId,
+      receipt: input.receipt,
+      now: input.now,
+    })),
+  } as JobResult;
+}
+
+export async function reconcileMessageTemplate(input: ReconcileTemplateInput): Promise<JobResult> {
+  if (!input.capability.templateProjection) {
+    return { status: "manual_review", code: "template_reconciliation_unsupported" };
+  }
+  return {
+    ...(await input.repository.reconcileTemplate({
+      templateId: input.templateId,
+      locale: input.locale,
+      providerState: input.providerState,
+      providerVersion: input.providerVersion,
+      correlationId: input.correlationId,
+      receipt: input.receipt,
+      now: input.now,
+    })),
+  } as JobResult;
+}
+
+function recoveryDisposition(candidate: RecoveryCandidate): "manual_review" | "retry_allowed" {
+  return candidate.kind === "inbound_lease_expired" ? "retry_allowed" : "manual_review";
+}
+
+export async function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult> {
+  if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100) {
+    return { status: "rejected", code: "recovery_limit_invalid" };
+  }
+  const candidates = await input.repository.findRecoveryWork({ now: input.now, limit: input.limit });
+  return {
+    status: "completed",
+    code: candidates.length === 0 ? "no_recovery_work" : "recovery_work_found",
+    work: candidates.map((candidate) => ({ ...candidate, disposition: recoveryDisposition(candidate) })),
+  };
+}
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-dispatch.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-dispatch.test.ts
new file mode 100644
index 0000000..eb23af5
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-dispatch.test.ts
@@ -0,0 +1,104 @@
+import { describe, expect, it } from "vitest";
+import {
+  canonicalEndpointReference,
+  CommunicationsService,
+  dispatchOutboundMessage,
+  MemoryCommunicationsRepository,
+} from "@atlas/domain";
+import { dispatchOutboundMessage as dispatchAppOutboundMessage } from "../../apps/app/src/lib/whatsapp/jobs.ts";
+
+const NOW = new Date("2026-08-20T12:00:00.000Z");
+const LATER = new Date("2026-08-20T12:05:00.000Z");
+const TOMORROW = new Date("2026-08-21T12:00:00.000Z");
+
+function fixture(provider: { dispatch(): Promise<{ status: "accepted" }>; calls: number } | { dispatch(): Promise<never>; calls: number }) {
+  const repository = new MemoryCommunicationsRepository({
+    bindings: [{ bindingId: "binding_1", channel: "whatsapp", trustState: "reverified", freshUntil: TOMORROW, createdAt: NOW, updatedAt: NOW }],
+    policies: [{ policyId: "policy_1", bindingId: "binding_1", state: "normal", version: 7, fence: 42, updatedAt: NOW }],
+    consents: [{ bindingId: "binding_1", purpose: "transactional", state: "granted", version: 1, receipt: { receiptId: "consent_receipt_1", owner: "consent", operation: "consent_confirmation", bindingId: "binding_1", issuedAt: NOW, expiresAt: TOMORROW }, changedAt: NOW }],
+    connections: [{ channel: "whatsapp", state: "active" }],
+    templates: [{ templateId: "template_1", locale: "en", definitionVersion: 1, internallyApproved: true, providerState: "provider_approved", providerVersion: 1, updatedAt: NOW }],
+  });
+  let id = 0;
+  const service = new CommunicationsService({
+    repository,
+    clock: { now: () => NOW },
+    ids: { next: (kind) => `${kind}_${++id}` },
+    endpointDigestKeys: { resolve: async () => ({ status: "available", active: { purpose: "communications_endpoint_digest", version: "v1", key: "key" }, prior: [] }) },
+    keyedDigest: { digest: async () => "endpoint_digest" },
+    destinationResolver: { resolve: async () => ({ status: "resolved", endpoint: "+15555550123" }) },
+    boundedExecutor: { run: async (_operation, _timeout, action) => action() },
+    provider,
+    publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
+    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
+    handoff: { request: async () => ({ status: "unavailable" }) },
+    providerTimeoutMs: 2_000,
+    knowledgeTimeoutMs: 500,
+    handoffTimeoutMs: 500,
+  });
+  return { repository, service };
+}
+
+async function queue(service: CommunicationsService) {
+  return service.queueOutbound({
+    channel: "whatsapp",
+    locale: "en",
+    conversationId: "conversation_1",
+    bindingId: "binding_1",
+    body: "Synthetic outbound",
+    purpose: "transactional",
+    templateId: "template_1",
+    idempotencyKey: "outbound_key_1",
+    fingerprint: "fingerprint_1",
+    requiredPolicyVersion: 7,
+    requiredFence: 42,
+    authorizationReceipt: { receiptId: "dispatch_receipt_1", owner: "communications", operation: "outbound_dispatch", bindingId: "binding_1", destinationKey: canonicalEndpointReference("endpoint_digest"), issuedAt: NOW, expiresAt: TOMORROW },
+    correlationId: "correlation_1",
+  });
+}
+
+describe("WhatsApp dispatch job", () => {
+  it("records ambiguous timeout as dispatch_unknown and never blindly retries", async () => {
+    const provider = {
+      calls: 0,
+      async dispatch(): Promise<never> {
+        this.calls += 1;
+        throw new Error("synthetic response loss");
+      },
+    };
+    const { repository, service } = fixture(provider);
+    const queued = await queue(service);
+    const commandId = String(queued.commandId);
+
+    expect(await dispatchOutboundMessage({ service, commandId, leaseOwner: "worker_1", leaseExpiresAt: LATER })).toMatchObject({ status: "dispatch_unknown" });
+    expect(await dispatchOutboundMessage({ service, commandId, leaseOwner: "worker_2", leaseExpiresAt: LATER })).toEqual({ status: "not_dispatched", code: "dispatch_unknown_non_retryable" });
+    expect(provider.calls).toBe(1);
+    expect(repository.referenceState().attempts).toEqual([expect.objectContaining({ state: "dispatch_unknown" })]);
+  });
+
+  it("blocks provider traffic in the app boundary before the service can run", async () => {
+    let calls = 0;
+    const result = await dispatchAppOutboundMessage({
+      providerTrafficAllowed: false,
+      service: { dispatchOutbound: async () => { calls += 1; return { status: "accepted" }; } },
+      commandId: "command_1",
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    expect(result).toEqual({ status: "unavailable", code: "provider_disabled" });
+    expect(calls).toBe(0);
+  });
+
+  it("rechecks policy under the binding lock and cancels a withdrawn send before dispatch", async () => {
+    const provider = { calls: 0, async dispatch() { this.calls += 1; return { status: "accepted" as const }; } };
+    const { repository, service } = fixture(provider);
+    const queued = await queue(service);
+    await repository.withdrawContact({
+      bindingId: "binding_1",
+      evidence: { source: "authority", receipt: { receiptId: "receipt_withdraw_1", owner: "consent", operation: "contact_withdrawal", bindingId: "binding_1", issuedAt: NOW, expiresAt: TOMORROW, correlationId: "correlation_withdraw_1" } },
+      now: NOW,
+    });
+    expect(await dispatchOutboundMessage({ service, commandId: String(queued.commandId), leaseOwner: "worker_1", leaseExpiresAt: LATER })).toEqual({ status: "not_dispatched", code: "contact_policy_denied" });
+    expect(provider.calls).toBe(0);
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts
new file mode 100644
index 0000000..394593a
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts
@@ -0,0 +1,245 @@
+import { describe, expect, it } from "vitest";
+import {
+  MemoryCommunicationsRepository,
+  processInboundChannelEvent,
+  type ProcessInboundInput,
+} from "@atlas/domain";
+
+const NOW = new Date("2026-08-20T12:00:00.000Z");
+const LATER = new Date("2026-08-20T12:05:00.000Z");
+const TOMORROW = new Date("2026-08-21T12:00:00.000Z");
+
+function envelope(eventId: string, bindingId = "binding_1") {
+  return {
+    event: {
+      eventId,
+      channel: "whatsapp" as const,
+      locale: "en" as const,
+      connectionState: "active" as const,
+      bindingId,
+      conversationId: `conversation_${eventId}`,
+      messageId: `message_${eventId}`,
+      receivedAt: NOW,
+      state: "persisted" as const,
+      correlationId: `correlation_${eventId}`,
+    },
+    conversation: {
+      id: `conversation_${eventId}`,
+      channel: "whatsapp" as const,
+      locale: "en" as const,
+      status: "new" as const,
+      participantIds: [`participant_${eventId}`],
+      version: 1,
+      createdAt: NOW,
+      updatedAt: NOW,
+      lastActivityAt: NOW,
+    },
+    participant: {
+      participantId: `participant_${eventId}`,
+      conversationId: `conversation_${eventId}`,
+      bindingId,
+      role: "external_contact" as const,
+      createdAt: NOW,
+    },
+    message: {
+      id: `message_${eventId}`,
+      conversationId: `conversation_${eventId}`,
+      channel: "whatsapp" as const,
+      direction: "inbound" as const,
+      senderParticipantId: `participant_${eventId}`,
+      locale: "en" as const,
+      kind: "text" as const,
+      body: "Synthetic input",
+      createdAt: NOW,
+    },
+  };
+}
+
+async function fixture(eventId: string, optOutSignal: "none" | "pending" = "none") {
+  const repository = new MemoryCommunicationsRepository({
+    bindings: [
+      {
+        bindingId: "binding_1",
+        channel: "whatsapp",
+        trustState: "reverified",
+        freshUntil: TOMORROW,
+        createdAt: NOW,
+        updatedAt: NOW,
+      },
+    ],
+    policies: [
+      {
+        policyId: "policy_1",
+        bindingId: "binding_1",
+        state: "normal",
+        version: 7,
+        fence: 42,
+        updatedAt: NOW,
+      },
+    ],
+  });
+  await repository.acceptInbound({
+    connectionId: "connection_1",
+    providerEventId: `provider_${eventId}`,
+    providerBodyDigest: `digest_${eventId}`,
+    endpointDigests: [{ version: "v1", digest: "endpoint_digest" }],
+    envelope: envelope(eventId),
+    optOutSignal,
+  });
+  return repository;
+}
+
+function input(
+  repository: MemoryCommunicationsRepository,
+  eventId: string,
+  overrides: Partial<ProcessInboundInput> = {},
+): ProcessInboundInput {
+  return {
+    repository,
+    executor: { run: async (_name, _timeout, action) => action() },
+    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
+    eventId,
+    leaseOwner: `worker_${eventId}`,
+    leaseExpiresAt: LATER,
+    requiredPolicyVersion: 7,
+    intent: "public_orientation",
+    now: NOW,
+    knowledgeTimeoutMs: 500,
+    ownerTimeoutMs: 500,
+    ...overrides,
+  };
+}
+
+describe("WhatsApp inbound processing job", () => {
+  it("applies opt-out before orientation and never calls public knowledge", async () => {
+    const repository = await fixture("optout", "pending");
+    let knowledgeCalls = 0;
+    const result = await processInboundChannelEvent(
+      input(repository, "optout", {
+        requiredPolicyVersion: 8,
+        publicOrientation: {
+          answer: async () => {
+            knowledgeCalls += 1;
+            return { status: "unavailable" };
+          },
+        },
+        withdrawalEvidence: {
+          source: "inbound_event",
+          receipt: {
+            receiptId: "receipt_optout_1",
+            owner: "communications",
+            operation: "inbound_opt_out",
+            bindingId: "binding_1",
+            eventId: "optout",
+            issuedAt: NOW,
+            expiresAt: TOMORROW,
+            correlationId: "correlation_optout",
+          },
+        },
+      }),
+    );
+
+    expect(result).toMatchObject({ status: "completed", code: "contact_withdrawn" });
+    expect(knowledgeCalls).toBe(0);
+    expect(repository.referenceState().policies[0]).toMatchObject({ state: "withdrawn" });
+  });
+
+  it("answers only with current M002 provenance and exact disclosure binding", async () => {
+    const repository = await fixture("public");
+    const result = await processInboundChannelEvent(
+      input(repository, "public", {
+        publicOrientation: {
+          answer: async () => ({
+            status: "available",
+            text: "Synthetic M002 answer",
+            receipt: {
+              receiptId: "receipt_m002_1",
+              owner: "public_knowledge",
+              source: "M002",
+              sourceId: "help_topic_1",
+              sourceVersion: "source_v1",
+              reviewVersion: "review_v1",
+              disclosureVersion: "disclosure_v1",
+              issuedAt: NOW,
+              expiresAt: TOMORROW,
+              correlationId: "correlation_public",
+            },
+          }),
+        },
+      }),
+    );
+
+    expect(result).toMatchObject({
+      status: "answered",
+      text: "Synthetic M002 answer",
+      sourceReceipt: { source: "M002", disclosureVersion: "disclosure_v1" },
+    });
+  });
+
+  it.each([
+    ["case_status", "protected_intent", "secure_portal"],
+    ["payment_question", "protected_intent", "secure_portal"],
+    ["document_question", "protected_intent", "secure_portal"],
+    ["preliminary_intake", "preliminary_intake_disabled", "secure_portal"],
+    ["media", "media_fetch_disabled", "secure_upload_portal"],
+  ] as const)("keeps %s portal-safe with no owner or knowledge call", async (intent, code, route) => {
+    const repository = await fixture(intent);
+    let calls = 0;
+    const result = await processInboundChannelEvent(
+      input(repository, intent, {
+        intent,
+        publicOrientation: {
+          answer: async () => {
+            calls += 1;
+            return { status: "unavailable" };
+          },
+        },
+        owningAction: {
+          execute: async () => {
+            calls += 1;
+            return { status: "unavailable" };
+          },
+        },
+      }),
+    );
+    expect(result).toMatchObject({ status: "portal_safe", code, route });
+    expect(calls).toBe(0);
+  });
+
+  it("requires an exact owning-domain receipt and suspends wrong-person bindings", async () => {
+    const appointment = await fixture("appointment");
+    const completed = await processInboundChannelEvent(
+      input(appointment, "appointment", {
+        intent: "appointment",
+        resourceId: "appointment_request_1",
+        idempotencyKey: "booking_key_1",
+        owningAction: {
+          execute: async () => ({
+            status: "completed",
+            receipt: {
+              receiptId: "receipt_booking_1",
+              owner: "appointments",
+              operation: "book_appointment",
+              bindingId: "binding_1",
+              resourceId: "appointment_request_1",
+              idempotencyKey: "booking_key_1",
+              result: "succeeded",
+              issuedAt: NOW,
+              expiresAt: TOMORROW,
+              correlationId: "correlation_appointment",
+            },
+          }),
+        },
+      }),
+    );
+    expect(completed).toEqual({ status: "owner_action_completed", receiptId: "receipt_booking_1" });
+
+    const wrongPerson = await fixture("wrong_person");
+    expect(
+      await processInboundChannelEvent(
+        input(wrongPerson, "wrong_person", { intent: "wrong_person" }),
+      ),
+    ).toMatchObject({ status: "completed", code: "binding_suspended" });
+    expect(wrongPerson.referenceState().bindings[0]).toMatchObject({ trustState: "suspended" });
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
new file mode 100644
index 0000000..a65650d
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
@@ -0,0 +1,68 @@
+import { describe, expect, it } from "vitest";
+import {
+  expireChannelRecoveryState,
+  MemoryCommunicationsRepository,
+  reconcileMessageTemplate,
+  reconcileUnknownDispatch,
+} from "@atlas/domain";
+
+const NOW = new Date("2026-08-20T12:00:00.000Z");
+const TOMORROW = new Date("2026-08-21T12:00:00.000Z");
+
+function templateReceipt(version: number, state: "provider_approved" | "paused") {
+  return {
+    receiptId: `receipt_template_${version}`,
+    owner: "communications" as const,
+    operation: "template_provider_reconciliation" as const,
+    templateId: "template_1",
+    locale: "en" as const,
+    definitionVersion: 1,
+    providerVersion: version,
+    providerState: state,
+    issuedAt: NOW,
+    expiresAt: TOMORROW,
+    correlationId: `correlation_${version}`,
+  };
+}
+
+describe("WhatsApp reconciliation and recovery jobs", () => {
+  it("keeps template projections monotonic and capability-gated", async () => {
+    const repository = new MemoryCommunicationsRepository({
+      templates: [{ templateId: "template_1", locale: "en", definitionVersion: 1, internallyApproved: true, providerState: "provider_approved", providerVersion: 3, updatedAt: NOW }],
+    });
+    expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: false }, templateId: "template_1", locale: "en", providerState: "paused", providerVersion: 4, correlationId: "correlation_4", receipt: templateReceipt(4, "paused"), now: NOW })).toEqual({ status: "manual_review", code: "template_reconciliation_unsupported" });
+    expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: true }, templateId: "template_1", locale: "en", providerState: "paused", providerVersion: 4, correlationId: "correlation_4", receipt: templateReceipt(4, "paused"), now: NOW })).toMatchObject({ status: "applied", providerVersion: 4, providerState: "paused" });
+    expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: true }, templateId: "template_1", locale: "en", providerState: "provider_approved", providerVersion: 3, correlationId: "correlation_3", receipt: templateReceipt(3, "provider_approved"), now: NOW })).toMatchObject({ status: "regressive", providerVersion: 4, providerState: "paused" });
+  });
+
+  it("forbids automatic resend and requires explicit dispatch reconciliation", async () => {
+    let calls = 0;
+    const repository = {
+      reconcileOutbound: async () => { calls += 1; return { status: "not_found" as const }; },
+    } as unknown as MemoryCommunicationsRepository;
+    expect(await reconcileUnknownDispatch({ repository, commandId: "command_1", attemptId: "attempt_1", now: NOW, automaticResend: true })).toEqual({ status: "manual_review", code: "automatic_resend_forbidden" });
+    expect(calls).toBe(0);
+    expect(await reconcileUnknownDispatch({ repository, commandId: "command_1", attemptId: "attempt_1", now: NOW })).toEqual({ status: "not_found" });
+    expect(calls).toBe(1);
+  });
+
+  it("bounds recovery discovery and marks ambiguous outbound work manual-only", async () => {
+    const repository = {
+      findRecoveryWork: async () => [
+        { kind: "outbound_dispatch_unknown" as const, commandId: "command_1", attemptId: "attempt_1" },
+        { kind: "outbound_lease_expired" as const, commandId: "command_2", attemptId: "attempt_2" },
+        { kind: "inbound_lease_expired" as const, eventId: "event_1" },
+      ],
+    } as unknown as MemoryCommunicationsRepository;
+    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 101 })).toEqual({ status: "rejected", code: "recovery_limit_invalid" });
+    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 3 })).toEqual({
+      status: "completed",
+      code: "recovery_work_found",
+      work: [
+        { kind: "outbound_dispatch_unknown", commandId: "command_1", attemptId: "attempt_1", disposition: "manual_review" },
+        { kind: "outbound_lease_expired", commandId: "command_2", attemptId: "attempt_2", disposition: "manual_review" },
+        { kind: "inbound_lease_expired", eventId: "event_1", disposition: "retry_allowed" },
+      ],
+    });
+  });
+});
```
