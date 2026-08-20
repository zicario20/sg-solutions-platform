# Task 9 Fix Review
```diff
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
index b83ac4b..edd80dd 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -1710,122 +1710,125 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
           receipt.expiresAt,
           input.now,
         ],
       );
       await query(
         tx,
         `update communication_outbound_commands set state = $2, lease_owner_id = null,
            lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
         [input.commandId, commandState, input.now],
       );
       await query(
         tx,
         `update communication_dispatch_attempts set state = $2, completed_at = $3,
            updated_at = $3 where id = $1 and command_id = $4`,
         [input.attemptId, commandState, input.now, input.commandId],
       );
       return { status: "reconciled", commandState };
     });
   }
 
   async evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const row = (
         await query<{ internally_approved: boolean; state: string }>(
           tx,
           `select internally_approved, state from communication_message_templates
            where template_key = $1 and locale = $2`,
           [input.templateId, input.locale],
         )
       )[0];
       if (!row) return { eligible: false, code: "template_not_found" } as const;
       if (!row.internally_approved) {
         return { eligible: false, code: "internal_approval_required" } as const;
       }
       return row.state === "provider_approved"
         ? { eligible: true, code: "eligible" }
         : { eligible: false, code: "provider_not_approved" };
     });
   }
 
   async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
     const limit = Math.max(0, Math.min(input.limit, 100));
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const rows = await query<{
         kind: RecoveryCandidate["kind"];
         command_id: string | null;
         attempt_id: string | null;
         event_id: string | null;
+        attempts: number | null;
       }>(
         tx,
         `select * from (
           select case when command.state = 'dispatch_unknown'
             then 'outbound_dispatch_unknown' else 'outbound_lease_expired' end as kind,
             command.id as command_id, attempt.id as attempt_id, null::text as event_id,
+            null::integer as attempts,
             coalesce(attempt.completed_at, attempt.started_at) as recovery_at
           from communication_outbound_commands command
           join lateral (select * from communication_dispatch_attempts
             where command_id = command.id order by attempt_ordinal desc limit 1) attempt on true
           where command.state = 'dispatch_unknown'
              or (command.state = 'dispatching' and command.lease_expires_at <= $1)
           union all
-          select 'inbound_lease_expired', null, null, receipt.id, receipt.lease_expires_at
+          select 'inbound_lease_expired', null, null, receipt.id, receipt.processing_version,
+            receipt.lease_expires_at
           from communication_provider_event_receipts receipt
           where receipt.state = 'persisted' and receipt.lease_expires_at <= $1
         ) work order by recovery_at asc limit $2`,
         [input.now, limit],
       );
       return rows.map((row) =>
         row.kind === "inbound_lease_expired"
-          ? { kind: row.kind, eventId: row.event_id! }
+          ? { kind: row.kind, eventId: row.event_id!, attempts: row.attempts! }
           : { kind: row.kind, commandId: row.command_id!, attemptId: row.attempt_id! },
       );
     });
   }
 
   async referenceState(): Promise<CommunicationsReferenceState> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const [inbound, outbound, attempts, policies, bindings, consentHistory, templates, statuses, withdrawals] =
         await Promise.all([
           query<Record<string, unknown>>(tx, `select receipt.id as "eventId", receipt.state, receipt.processing_version as "leaseVersion", message.ordinal from communication_provider_event_receipts receipt join communication_event_envelopes envelope on envelope.receipt_id = receipt.id join communication_messages message on message.id = envelope.message_id order by receipt.id`),
           query<Record<string, unknown>>(tx, `select id as "commandId", state, version as "leaseVersion", failure_code as "failureCode" from communication_outbound_commands order by id`),
           query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, case result_code when 'failed' then 'known_failure' when 'dispatch_unknown' then 'unknown' else result_code end as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
           query<Record<string, unknown>>(tx, `select id as "policyId", binding_id as "bindingId", fence_state as state, version, fence, updated_at as "updatedAt" from communication_contact_policies order by id`),
           query<Record<string, unknown>>(tx, `select id as "bindingId", channel_kind as channel, trust_state as "trustState", verification_expires_at as "freshUntil", created_at as "createdAt", updated_at as "updatedAt" from communication_contact_bindings order by id`),
           query<Record<string, unknown>>(tx, `select binding_id as "bindingId", purpose, consent_state as state, authority_version as version, case when event_kind = 'consent_withdrawn' then null else evidence_receipt_id end as "authorityReceiptId", occurred_at as "changedAt" from communication_contact_evidence_events where purpose is not null order by binding_id, sequence`),
           query<Record<string, unknown>>(tx, `select template_key as "templateId", locale, definition_version as "definitionVersion", internally_approved as "internallyApproved", approval_receipt_id as "approvalReceiptId", provider_receipt_id as "providerReceiptId", provider_correlation_id as "providerCorrelationId", state as "providerState", projection_version as "providerVersion", updated_at as "updatedAt" from communication_message_templates order by template_key, locale`),
           query<Record<string, unknown>>(tx, `select command_id as "commandId", provider_event_id as "providerEventId", status, occurred_at as "occurredAt" from communication_provider_status_receipts order by command_id, provider_event_id`),
           query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", case when owning_domain = 'M004' then 'communications' else 'consent' end as owner, case when owning_domain = 'M004' then 'inbound_opt_out' else 'contact_withdrawal' end as operation, triggering_event_id as "eventId", correlation_id as "correlationId", receipt_issued_at as "issuedAt", receipt_valid_until as "expiresAt", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'contact_withdrawal_recorded' order by binding_id, sequence`),
         ]);
       return {
         inbound,
         outbound,
         attempts,
         policies: policies as unknown as CommunicationsReferenceState["policies"],
         bindings: bindings as unknown as CommunicationsReferenceState["bindings"],
         consentHistory: consentHistory.map((record) =>
           record.authorityReceiptId === null
             ? { ...record, authorityReceiptId: undefined }
             : record,
         ) as unknown as CommunicationsReferenceState["consentHistory"],
         templates: templates as unknown as CommunicationsReferenceState["templates"],
         providerStatuses: statuses as unknown as CommunicationsReferenceState["providerStatuses"],
         withdrawalHistory: withdrawals as unknown as CommunicationsReferenceState["withdrawalHistory"],
       };
     });
   }
 
   private async loadInbound(tx: TransactionSql, eventId: string): Promise<InboundRow | undefined> {
     return (
       await query<InboundRow>(
         tx,
         `select receipt.id as event_id, envelope.binding_id, envelope.conversation_id,
           envelope.message_id, envelope.participant_id,
           connection.readiness_state as connection_state, conversation.locale,
           receipt.correlation_id, receipt.received_at, receipt.state as event_state,
           conversation.status as conversation_status, conversation.version as conversation_version,
           conversation.created_at as conversation_created_at,
           conversation.updated_at as conversation_updated_at,
           conversation.last_activity_at, conversation.closed_at,
           participant.kind as participant_role, participant.created_at as participant_created_at,
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
index cb54236..9470120 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
@@ -1,206 +1,207 @@
+import type { HandoffReason, HumanHandoffPort } from "../public-chat/providers.ts";
 import type { ContentPolicyPort } from "./service.ts";
 import type {
   CommunicationsRepository,
   ContactWithdrawalEvidence,
   DispatchReconciliationReceipt,
   ReconcileTemplateCommand,
   RecoveryCandidate,
   TemplateProviderReconciliationReceipt,
 } from "./repository.ts";
 
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
   answer(input: { prompt: string; locale: "en" | "es"; correlationId: string }): Promise<
     | { status: "available"; text: string; receipt?: M002SourceReceipt }
     | { status: "unavailable" }
   >;
 }
 
 export type OwningDomainReceipt = {
   receiptId: string;
-  owner: "appointments" | "communications" | "documents" | "leads" | "payments";
+  owner: "appointments" | "documents" | "leads" | "payments";
   operation:
     | "book_appointment"
     | "capture_lead"
     | "issue_payment_link"
-    | "issue_upload_link"
-    | "request_handoff";
+    | "issue_upload_link";
   bindingId: string;
   resourceId: string;
   idempotencyKey: string;
   result: "succeeded";
   issuedAt: Date;
   expiresAt: Date;
   correlationId: string;
 };
 
 export type OwningActionIntent =
   | "appointment"
   | "document_upload"
-  | "handoff"
   | "lead"
   | "payment_link";
 
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
+  humanHandoff?: HumanHandoffPort;
+  handoffReason?: HandoffReason;
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
+  maxInboundAttempts: number;
 };
 
 const RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
 const OWNER_ACTION = {
   appointment: ["appointments", "book_appointment"],
   document_upload: ["documents", "issue_upload_link"],
-  handoff: ["communications", "request_handoff"],
   lead: ["leads", "capture_lead"],
   payment_link: ["payments", "issue_payment_link"],
 } as const satisfies Record<OwningActionIntent, readonly [OwningDomainReceipt["owner"], OwningDomainReceipt["operation"]]>;
 
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
@@ -286,219 +287,288 @@ export async function processInboundChannelEvent(input: ProcessInboundInput): Pr
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
 
+  if (input.intent === "handoff") {
+    const idempotencyKey = input.idempotencyKey ?? "";
+    if (!input.humanHandoff || !idempotencyKey) {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "handoff_unavailable",
+      });
+    }
+    try {
+      const handoff = await input.executor.run(
+        "communications_handoff",
+        input.ownerTimeoutMs,
+        () =>
+          input.humanHandoff!.enqueue({
+            conversationId: claim.envelope.conversation.id,
+            locale: claim.envelope.event.locale,
+            reason: input.handoffReason ?? "visitor_requested",
+            correlationId: claim.envelope.event.correlationId,
+            idempotencyKey,
+          }),
+      );
+      if (
+        handoff.status !== "queued" ||
+        !RECEIPT_ID.test(handoff.receiptId) ||
+        !(handoff.queuedAt instanceof Date) ||
+        !Number.isFinite(handoff.queuedAt.getTime())
+      ) {
+        return finishInbound(input, claim, "manual_review", {
+          status: "manual_review",
+          code: "handoff_unavailable",
+        });
+      }
+      return finishInbound(input, claim, "applied", {
+        status: "handoff_queued",
+        receiptId: handoff.receiptId,
+        queuedAt: handoff.queuedAt,
+      });
+    } catch {
+      return finishInbound(input, claim, "manual_review", {
+        status: "manual_review",
+        code: "handoff_unavailable",
+      });
+    }
+  }
+
   if (input.intent === "public_orientation") {
     if (!input.publicOrientation) {
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
           input.publicOrientation!.answer({
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
-    const resourceId = intent === "handoff" ? claim.envelope.conversation.id : input.resourceId ?? "";
+    const resourceId = input.resourceId ?? "";
     const idempotencyKey = input.idempotencyKey ?? "";
     if (!input.owningAction || !resourceId || !idempotencyKey) {
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
           input.owningAction!.execute({
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
           code: action.status === "replay_mismatch" ? "owner_receipt_mismatch" : "owner_receipt_invalid",
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
 
-function recoveryDisposition(candidate: RecoveryCandidate): "manual_review" | "retry_allowed" {
-  return candidate.kind === "inbound_lease_expired" ? "retry_allowed" : "manual_review";
+function recoveryDisposition(
+  candidate: RecoveryCandidate,
+  maxInboundAttempts: number,
+): "dead_letter" | "manual_review" | "retry_allowed" {
+  if (candidate.kind !== "inbound_lease_expired") return "manual_review";
+  return candidate.attempts >= maxInboundAttempts ? "dead_letter" : "retry_allowed";
 }
 
 export async function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult> {
   if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100) {
     return { status: "rejected", code: "recovery_limit_invalid" };
   }
+  if (
+    !Number.isSafeInteger(input.maxInboundAttempts) ||
+    input.maxInboundAttempts < 1 ||
+    input.maxInboundAttempts > 10
+  ) {
+    return { status: "rejected", code: "inbound_retry_limit_invalid" };
+  }
   const candidates = await input.repository.findRecoveryWork({ now: input.now, limit: input.limit });
+  if (
+    candidates.length > input.limit ||
+    candidates.some(
+      (candidate) =>
+        candidate.kind === "inbound_lease_expired" &&
+        (!Number.isSafeInteger(candidate.attempts) || candidate.attempts < 1),
+    )
+  ) {
+    return { status: "manual_review", code: "recovery_state_invalid" };
+  }
   return {
     status: "completed",
     code: candidates.length === 0 ? "no_recovery_work" : "recovery_work_found",
-    work: candidates.map((candidate) => ({ ...candidate, disposition: recoveryDisposition(candidate) })),
+    work: candidates.map((candidate) => {
+      const disposition = recoveryDisposition(candidate, input.maxInboundAttempts);
+      return { ...candidate, disposition, terminal: disposition !== "retry_allowed" };
+    }),
   };
 }
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 8bfc552..8811d2f 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -902,101 +902,105 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       this.reconciliationReceipts.set(input.receipt.receiptId, { identity, result });
       return result;
     });
   }
 
   async evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult> {
     const template = this.templates.get(this.templateKey(input.templateId, input.locale));
     if (!template) return { eligible: false, code: "template_not_found" };
     if (!template.internallyApproved) {
       return { eligible: false, code: "internal_approval_required" };
     }
     if (template.providerState !== "provider_approved") {
       return { eligible: false, code: "provider_not_approved" };
     }
     return { eligible: true, code: "eligible" };
   }
 
   async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
     const candidates: RecoveryCandidate[] = [];
     for (const outbound of this.outboundById.values()) {
       const attempt = [...this.attempts.values()]
         .filter((candidate) => candidate.commandId === outbound.command.commandId)
         .at(-1);
       if (!attempt) continue;
       if (outbound.state === "dispatch_unknown") {
         candidates.push({
           kind: "outbound_dispatch_unknown",
           commandId: outbound.command.commandId,
           attemptId: attempt.attemptId,
         });
       } else if (
         outbound.state === "dispatching" &&
         outbound.leaseExpiresAt &&
         outbound.leaseExpiresAt <= input.now
       ) {
         candidates.push({
           kind: "outbound_lease_expired",
           commandId: outbound.command.commandId,
           attemptId: attempt.attemptId,
         });
       }
     }
     for (const inbound of this.inboundById.values()) {
       if (
         inbound.state === "persisted" &&
         inbound.leaseExpiresAt &&
         inbound.leaseExpiresAt <= input.now
       ) {
-        candidates.push({ kind: "inbound_lease_expired", eventId: inbound.envelope.event.eventId });
+        candidates.push({
+          kind: "inbound_lease_expired",
+          eventId: inbound.envelope.event.eventId,
+          attempts: inbound.leaseVersion,
+        });
       }
     }
     return candidates.slice(0, Math.max(0, Math.min(input.limit, 100)));
   }
 
   referenceState(): CommunicationsReferenceState {
     return clone({
       inbound: [...this.inboundById.values()].map((record) => ({
         eventId: record.envelope.event.eventId,
         endpointDigests: record.endpointDigests,
         envelope: record.envelope,
         ordinal: record.ordinal,
         state: record.state,
         leaseVersion: record.leaseVersion,
       })),
       outbound: [...this.outboundById.values()].map((record) => ({
         ...record.command,
         message: record.message,
         purpose: record.purpose,
         templateId: record.templateId,
         fingerprint: record.fingerprint,
         requiredPolicyVersion: record.requiredPolicyVersion,
         requiredFence: record.requiredFence,
         endpointDigests: record.endpointDigests,
         failureCode: record.failureCode,
         state: record.state,
         leaseVersion: record.leaseVersion,
       })),
       attempts: [...this.attempts.values()],
       policies: [...this.policies.values()],
       bindings: [...this.bindings.values()],
       consentHistory: this.consentHistory,
       templates: [...this.templates.values()],
       providerStatuses: [...this.providerStatuses.values()],
       withdrawalHistory: this.withdrawalHistory,
     });
   }
 
   private consentKey(bindingId: string, purpose: string): string {
     return `${bindingId}\u0000${purpose}`;
   }
 
   private outboundIdempotencyKey(bindingId: string, idempotencyKey: string): string {
     return `${bindingId}\u0000${idempotencyKey}`;
   }
 
   private templateKey(templateId: string, locale: string): string {
     return `${templateId}\u0000${locale}`;
   }
 
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
index 8c29e2f..8f16db7 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -394,101 +394,101 @@ export type ApproveTemplateDefinition = {
 export type ReconcileTemplateCommand = {
   templateId: string;
   locale: ChannelLocale;
   providerState: TemplateProviderState;
   providerVersion: number;
   correlationId: string;
   receipt?: TemplateProviderReconciliationReceipt;
   now: Date;
 };
 
 export type TemplateReconciliationResult =
   | ({ status: "applied" | "duplicate" | "regressive" } & TemplateRecord)
   | { status: "not_found"; code: "template_not_found" }
   | {
       status: "denied";
       code: "provider_receipt_missing" | "provider_receipt_invalid";
     };
 
 export type TemplateResult =
   | ({ status: "registered" | "approved" } & TemplateRecord)
   | TemplateReconciliationResult
   | {
       status: "denied";
       code:
         | "approval_receipt_missing"
         | "approval_receipt_invalid"
         | "definition_conflict";
     }
   | { status: "unavailable"; code: "runtime_registration_disabled" };
 
 export type EvaluateTemplateEligibility = {
   templateId: string;
   locale: ChannelLocale;
 };
 
 export type TemplateEligibilityResult =
   | { eligible: true; code: "eligible" }
   | {
       eligible: false;
       code: "template_not_found" | "internal_approval_required" | "provider_not_approved";
     };
 
 export type RecoveryQuery = { now: Date; limit: number };
 
 export type RecoveryCandidate =
   | {
       kind: "outbound_dispatch_unknown" | "outbound_lease_expired";
       commandId: string;
       attemptId: string;
     }
-  | { kind: "inbound_lease_expired"; eventId: string };
+  | { kind: "inbound_lease_expired"; eventId: string; attempts: number };
 
 export type DispatchReconciliationOutcome =
   | "reconciled_accepted"
   | "confirmed_not_sent"
   | "terminal_failure";
 
 export type DispatchReconciliationReceipt = {
   receiptId: string;
   owner: "communications";
   operation: "dispatch_reconciliation";
   source: "provider_lookup" | "manual_authority";
   bindingId: string;
   commandId: string;
   attemptId: string;
   outcome: DispatchReconciliationOutcome;
   issuedAt: Date;
   expiresAt: Date;
   correlationId: string;
 };
 
 export type ReconcileOutboundCommand = {
   commandId: string;
   attemptId: string;
   receipt?: DispatchReconciliationReceipt;
   now: Date;
 };
 
 export type ReconcileOutboundResult =
   | {
       status: "reconciled" | "duplicate";
       commandState: "reconciled_accepted" | "confirmed_not_sent" | "failed";
     }
   | {
       status: "denied";
       code:
         | "reconciliation_receipt_missing"
         | "reconciliation_receipt_invalid"
         | "reconciliation_state_invalid";
     }
   | {
       status: "conflict";
       code: "reconciliation_receipt_mismatch" | "reconciliation_binding_mismatch";
     }
   | {
       status: "conflict";
       code: "reconciliation_already_settled";
       commandState: "reconciled_accepted" | "confirmed_not_sent" | "failed";
     }
   | { status: "not_found" };
 
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts
index 394593a..ae0bb00 100644
--- a/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-inbound-processing.test.ts
@@ -195,51 +195,83 @@ describe("WhatsApp inbound processing job", () => {
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
+
+  it("uses the approved shared human handoff authority instead of a communications-owned receipt", async () => {
+    const repository = await fixture("handoff");
+    let ownerActionCalls = 0;
+    const result = await processInboundChannelEvent(
+      input(repository, "handoff", {
+        intent: "handoff",
+        idempotencyKey: "handoff_key_1",
+        owningAction: {
+          execute: async () => {
+            ownerActionCalls += 1;
+            return { status: "unavailable" };
+          },
+        },
+        humanHandoff: {
+          enqueue: async (request) => {
+            expect(request).toMatchObject({
+              conversationId: "conversation_handoff",
+              locale: "en",
+              reason: "visitor_requested",
+              correlationId: "correlation_handoff",
+              idempotencyKey: "handoff_key_1",
+            });
+            return { status: "queued", receiptId: "handoff_receipt_1", queuedAt: NOW };
+          },
+        },
+      }),
+    );
+
+    expect(result).toMatchObject({ status: "handoff_queued", receiptId: "handoff_receipt_1" });
+    expect(ownerActionCalls).toBe(0);
+  });
 });
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
index a65650d..c9a6379 100644
--- a/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
@@ -4,65 +4,67 @@ import {
   MemoryCommunicationsRepository,
   reconcileMessageTemplate,
   reconcileUnknownDispatch,
 } from "@atlas/domain";
 
 const NOW = new Date("2026-08-20T12:00:00.000Z");
 const TOMORROW = new Date("2026-08-21T12:00:00.000Z");
 
 function templateReceipt(version: number, state: "provider_approved" | "paused") {
   return {
     receiptId: `receipt_template_${version}`,
     owner: "communications" as const,
     operation: "template_provider_reconciliation" as const,
     templateId: "template_1",
     locale: "en" as const,
     definitionVersion: 1,
     providerVersion: version,
     providerState: state,
     issuedAt: NOW,
     expiresAt: TOMORROW,
     correlationId: `correlation_${version}`,
   };
 }
 
 describe("WhatsApp reconciliation and recovery jobs", () => {
   it("keeps template projections monotonic and capability-gated", async () => {
     const repository = new MemoryCommunicationsRepository({
       templates: [{ templateId: "template_1", locale: "en", definitionVersion: 1, internallyApproved: true, providerState: "provider_approved", providerVersion: 3, updatedAt: NOW }],
     });
     expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: false }, templateId: "template_1", locale: "en", providerState: "paused", providerVersion: 4, correlationId: "correlation_4", receipt: templateReceipt(4, "paused"), now: NOW })).toEqual({ status: "manual_review", code: "template_reconciliation_unsupported" });
     expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: true }, templateId: "template_1", locale: "en", providerState: "paused", providerVersion: 4, correlationId: "correlation_4", receipt: templateReceipt(4, "paused"), now: NOW })).toMatchObject({ status: "applied", providerVersion: 4, providerState: "paused" });
     expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: true }, templateId: "template_1", locale: "en", providerState: "provider_approved", providerVersion: 3, correlationId: "correlation_3", receipt: templateReceipt(3, "provider_approved"), now: NOW })).toMatchObject({ status: "regressive", providerVersion: 4, providerState: "paused" });
   });
 
   it("forbids automatic resend and requires explicit dispatch reconciliation", async () => {
     let calls = 0;
     const repository = {
       reconcileOutbound: async () => { calls += 1; return { status: "not_found" as const }; },
     } as unknown as MemoryCommunicationsRepository;
     expect(await reconcileUnknownDispatch({ repository, commandId: "command_1", attemptId: "attempt_1", now: NOW, automaticResend: true })).toEqual({ status: "manual_review", code: "automatic_resend_forbidden" });
     expect(calls).toBe(0);
     expect(await reconcileUnknownDispatch({ repository, commandId: "command_1", attemptId: "attempt_1", now: NOW })).toEqual({ status: "not_found" });
     expect(calls).toBe(1);
   });
 
   it("bounds recovery discovery and marks ambiguous outbound work manual-only", async () => {
     const repository = {
       findRecoveryWork: async () => [
         { kind: "outbound_dispatch_unknown" as const, commandId: "command_1", attemptId: "attempt_1" },
         { kind: "outbound_lease_expired" as const, commandId: "command_2", attemptId: "attempt_2" },
-        { kind: "inbound_lease_expired" as const, eventId: "event_1" },
+        { kind: "inbound_lease_expired" as const, eventId: "event_retry", attempts: 1 },
+        { kind: "inbound_lease_expired" as const, eventId: "event_exhausted", attempts: 3 },
       ],
     } as unknown as MemoryCommunicationsRepository;
-    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 101 })).toEqual({ status: "rejected", code: "recovery_limit_invalid" });
-    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 3 })).toEqual({
+    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4, maxInboundAttempts: 11 })).toEqual({ status: "rejected", code: "inbound_retry_limit_invalid" });
+    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4, maxInboundAttempts: 3 })).toEqual({
       status: "completed",
       code: "recovery_work_found",
       work: [
-        { kind: "outbound_dispatch_unknown", commandId: "command_1", attemptId: "attempt_1", disposition: "manual_review" },
-        { kind: "outbound_lease_expired", commandId: "command_2", attemptId: "attempt_2", disposition: "manual_review" },
-        { kind: "inbound_lease_expired", eventId: "event_1", disposition: "retry_allowed" },
+        { kind: "outbound_dispatch_unknown", commandId: "command_1", attemptId: "attempt_1", disposition: "manual_review", terminal: true },
+        { kind: "outbound_lease_expired", commandId: "command_2", attemptId: "attempt_2", disposition: "manual_review", terminal: true },
+        { kind: "inbound_lease_expired", eventId: "event_retry", attempts: 1, disposition: "retry_allowed", terminal: false },
+        { kind: "inbound_lease_expired", eventId: "event_exhausted", attempts: 3, disposition: "dead_letter", terminal: true },
       ],
     });
   });
 });
```
