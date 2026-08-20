# Task 9 Final Fix Review
```diff
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
index edd80dd..247068a 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -1750,80 +1750,122 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
   }
 
   async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
     const limit = Math.max(0, Math.min(input.limit, 100));
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const rows = await query<{
         kind: RecoveryCandidate["kind"];
         command_id: string | null;
         attempt_id: string | null;
         event_id: string | null;
         attempts: number | null;
       }>(
         tx,
         `select * from (
           select case when command.state = 'dispatch_unknown'
             then 'outbound_dispatch_unknown' else 'outbound_lease_expired' end as kind,
             command.id as command_id, attempt.id as attempt_id, null::text as event_id,
             null::integer as attempts,
             coalesce(attempt.completed_at, attempt.started_at) as recovery_at
           from communication_outbound_commands command
           join lateral (select * from communication_dispatch_attempts
             where command_id = command.id order by attempt_ordinal desc limit 1) attempt on true
           where command.state = 'dispatch_unknown'
              or (command.state = 'dispatching' and command.lease_expires_at <= $1)
           union all
           select 'inbound_lease_expired', null, null, receipt.id, receipt.processing_version,
             receipt.lease_expires_at
           from communication_provider_event_receipts receipt
           where receipt.state = 'persisted' and receipt.lease_expires_at <= $1
         ) work order by recovery_at asc limit $2`,
         [input.now, limit],
       );
       return rows.map((row) =>
         row.kind === "inbound_lease_expired"
           ? { kind: row.kind, eventId: row.event_id!, attempts: row.attempts! }
           : { kind: row.kind, commandId: row.command_id!, attemptId: row.attempt_id! },
       );
     });
   }
 
+  async deadLetterExpiredInbound(
+    input: import("@atlas/domain").DeadLetterExpiredInboundCommand,
+  ): Promise<import("@atlas/domain").DeadLetterExpiredInboundResult> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const updated = await query<{ id: string }>(
+        tx,
+        `update communication_provider_event_receipts
+         set state = 'dead_letter', outcome_reason = 'retry_exhausted',
+             processing_version = processing_version + 1,
+             lease_owner_id = null, lease_token_hash = null, lease_expires_at = null,
+             processed_at = $3, updated_at = $3
+         where id = $1 and state = 'persisted' and processing_version = $2
+           and lease_expires_at <= $3
+         returning id`,
+        [input.eventId, input.expectedAttempts, input.now],
+      );
+      if (updated[0]) return { status: "dead_lettered" } as const;
+
+      const current = (
+        await query<{
+          state: string;
+          processing_version: number;
+          lease_expires_at: Date | null;
+        }>(
+          tx,
+          `select state, processing_version, lease_expires_at
+           from communication_provider_event_receipts where id = $1`,
+          [input.eventId],
+        )
+      )[0];
+      if (!current) return { status: "conflict", code: "not_found" } as const;
+      if (current.state === "dead_letter") return { status: "already_terminal" } as const;
+      if (current.state !== "persisted") {
+        return { status: "conflict", code: "state_changed" } as const;
+      }
+      if (current.processing_version !== input.expectedAttempts) {
+        return { status: "conflict", code: "version_mismatch" } as const;
+      }
+      return { status: "conflict", code: "lease_not_expired" } as const;
+    });
+  }
+
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
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
index 9470120..2095dfb 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/jobs.ts
@@ -1,48 +1,47 @@
 import type { HandoffReason, HumanHandoffPort } from "../public-chat/providers.ts";
 import type { ContentPolicyPort } from "./service.ts";
 import type {
   CommunicationsRepository,
   ContactWithdrawalEvidence,
   DispatchReconciliationReceipt,
   ReconcileTemplateCommand,
-  RecoveryCandidate,
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
   owner: "appointments" | "documents" | "leads" | "payments";
   operation:
     | "book_appointment"
     | "capture_lead"
     | "issue_payment_link"
@@ -111,84 +110,84 @@ export type ProcessInboundInput = {
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
-  maxInboundAttempts: number;
 };
 
 const RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
+const INBOUND_RECOVERY_ATTEMPT_LIMIT = 3;
 const OWNER_ACTION = {
   appointment: ["appointments", "book_appointment"],
   document_upload: ["documents", "issue_upload_link"],
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
@@ -496,79 +495,88 @@ export async function dispatchOutboundMessage(input: DispatchOutboundInput): Pro
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
 
-function recoveryDisposition(
-  candidate: RecoveryCandidate,
-  maxInboundAttempts: number,
-): "dead_letter" | "manual_review" | "retry_allowed" {
-  if (candidate.kind !== "inbound_lease_expired") return "manual_review";
-  return candidate.attempts >= maxInboundAttempts ? "dead_letter" : "retry_allowed";
-}
-
 export async function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult> {
   if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100) {
     return { status: "rejected", code: "recovery_limit_invalid" };
   }
-  if (
-    !Number.isSafeInteger(input.maxInboundAttempts) ||
-    input.maxInboundAttempts < 1 ||
-    input.maxInboundAttempts > 10
-  ) {
-    return { status: "rejected", code: "inbound_retry_limit_invalid" };
-  }
   const candidates = await input.repository.findRecoveryWork({ now: input.now, limit: input.limit });
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
+  const work: Record<string, unknown>[] = [];
+  for (const candidate of candidates) {
+    if (candidate.kind !== "inbound_lease_expired") {
+      work.push({ ...candidate, disposition: "manual_review", terminal: true });
+      continue;
+    }
+    if (candidate.attempts < INBOUND_RECOVERY_ATTEMPT_LIMIT) {
+      work.push({ ...candidate, disposition: "retry_allowed", terminal: false });
+      continue;
+    }
+    const persisted = await input.repository.deadLetterExpiredInbound({
+      eventId: candidate.eventId,
+      expectedAttempts: candidate.attempts,
+      reason: "retry_exhausted",
+      now: input.now,
+    });
+    if (persisted.status === "conflict") {
+      work.push({
+        ...candidate,
+        disposition: "manual_review",
+        terminal: false,
+        code: persisted.code,
+      });
+      continue;
+    }
+    work.push({ ...candidate, disposition: "dead_letter", terminal: true });
+  }
   return {
     status: "completed",
     code: candidates.length === 0 ? "no_recovery_work" : "recovery_work_found",
-    work: candidates.map((candidate) => {
-      const disposition = recoveryDisposition(candidate, input.maxInboundAttempts);
-      return { ...candidate, disposition, terminal: disposition !== "retry_allowed" };
-    }),
+    work,
   };
 }
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 8811d2f..7458c06 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -1,60 +1,62 @@
 import {
   canonicalEndpointReference,
   evaluateAuthorityChange,
   evaluateOutboundPolicy,
 } from "./channel-policy.ts";
 import type {
   AcceptInboundCommand,
   AcceptInboundResult,
   ApplyProviderStatusCommand,
   BindingChangeResult,
   ClaimInboundCommand,
   ClaimOutboundCommand,
   CommunicationsReferenceState,
   CommunicationsRepository,
   CommunicationsSeed,
   CompleteInboundCommand,
   ConsentChangeResult,
   ConsentRecord,
   CreateOutboundCommand,
   CreateOutboundResult,
+  DeadLetterExpiredInboundCommand,
+  DeadLetterExpiredInboundResult,
   EvaluateTemplateEligibility,
   FailOutboundDraftCommand,
   FinalizeOutboundCommand,
   GrantConsentCommand,
   InboundClaimResult,
   MarkDispatchOutcomeCommand,
   OutboundClaimResult,
   ProviderStatusResult,
   RecoveryCandidate,
   RecoveryQuery,
   ReconcileOutboundCommand,
   ReconcileOutboundResult,
   ReconcileTemplateCommand,
   RegisterTemplateDefinition,
   ApproveTemplateDefinition,
   ResolveOptOutCommand,
   RevalidateBindingCommand,
   SuspendBindingCommand,
   TemplateEligibilityResult,
   TemplateRecord,
   TemplateReconciliationResult,
   TemplateResult,
   WithdrawContactCommand,
   WithdrawContactResult,
   WithdrawalHistoryRecord,
 } from "./repository.ts";
 import type {
   ChannelConnectionState,
   ChannelContactPolicy,
   ChannelKind,
   ContactChannelBinding,
   OutboundCommandState,
   OutboundDispatchAttempt,
 } from "./contracts.ts";
 
 type InboundRecord = {
   replayKey: string;
   providerBodyDigest: string;
   endpointDigests: AcceptInboundCommand["endpointDigests"];
   envelope: AcceptInboundCommand["envelope"];
@@ -70,80 +72,81 @@ type OutboundRecord = CreateOutboundCommand & {
   fingerprint?: string;
   requiredPolicyVersion?: number;
   requiredFence?: number;
   endpointDigests?: FinalizeOutboundCommand["endpointDigests"];
   authorizationReceipt?: FinalizeOutboundCommand["authorizationReceipt"];
   failureCode?: FailOutboundDraftCommand["code"];
   state: OutboundCommandState;
   leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
   blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
 };
 
 type AttemptRecord = OutboundDispatchAttempt & {
   resultCode?: MarkDispatchOutcomeCommand["outcome"];
   leaseOwnerHash: string;
   leaseVersion: number;
   leaseExpiresAt: Date;
 };
 
 type ReconciledCommandState = Extract<
   ReconcileOutboundResult,
   { commandState: unknown }
 >["commandState"];
 
 type StoredReconciliationResult = {
   status: "reconciled";
   commandState: ReconciledCommandState;
 };
 
 type StoredReconciliationReceipt = {
   identity: string;
   result: StoredReconciliationResult;
 };
 
 type LockOperation =
   | "accept_inbound"
   | "claim_inbound"
   | "claim_outbound"
   | "complete_outbound"
+  | "dead_letter_inbound"
   | "apply_provider_status"
   | "reconcile_outbound"
   | "withdraw_contact"
   | "grant_consent"
   | "resolve_opt_out"
   | "suspend_binding"
   | "revalidate_binding";
 
 export type MemoryCommunicationsRepositoryOptions = CommunicationsSeed & {
   lockBoundary?: (input: { bindingId: string; operation: LockOperation }) => Promise<void>;
 };
 
 const DELIVERY_RANK: Readonly<Record<"sent" | "delivered" | "read", number>> = {
   sent: 1,
   delivered: 2,
   read: 3,
 };
 
 const MAX_LEASE_MILLISECONDS = 15 * 60_000;
 
 async function sha256(value: string): Promise<string> {
   const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
   return [...new Uint8Array(digest)]
     .map((byte) => byte.toString(16).padStart(2, "0"))
     .join("");
 }
 
 function validClaimLease(now: Date, expiresAt: Date): boolean {
   return (
     Number.isFinite(now.getTime()) &&
     Number.isFinite(expiresAt.getTime()) &&
     expiresAt > now &&
     expiresAt.getTime() - now.getTime() <= MAX_LEASE_MILLISECONDS
   );
 }
 
 function metadataOnlyEnvelope(
   envelope: AcceptInboundCommand["envelope"],
 ): AcceptInboundCommand["envelope"] {
   return { ...clone(envelope), message: { ...clone(envelope.message), body: null } };
@@ -283,80 +286,117 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       const policy = this.policies.get(record.envelope.event.bindingId);
       if (!policy || policy.version !== input.requiredPolicyVersion) {
         return { status: "not_claimed", code: "policy_version_mismatch" };
       }
       if (!validClaimLease(input.now, input.leaseExpiresAt)) {
         return { status: "not_claimed", code: "lease_conflict" };
       }
       if (record.leaseOwnerHash && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
         return { status: "not_claimed", code: "lease_conflict" };
       }
       record.leaseOwnerHash = await sha256(input.leaseOwner);
       record.leaseVersion += 1;
       record.leaseExpiresAt = input.leaseExpiresAt;
       return {
         status: "claimed",
         eventId: input.eventId,
         leaseVersion: record.leaseVersion,
         envelope: clone(record.envelope),
         policyState: policy.state,
       };
     });
   }
 
   async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
     const record = this.inboundById.get(input.eventId);
     if (
       !record ||
       record.state !== "persisted" ||
       record.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
       record.leaseVersion !== input.leaseVersion ||
       !this.validLeaseCompletion(input.now, record.leaseExpiresAt)
     ) {
       return "conflict";
     }
     record.state = input.outcome;
     record.leaseOwnerHash = undefined;
     record.leaseExpiresAt = undefined;
     return "completed";
   }
 
+  async deadLetterExpiredInbound(
+    input: DeadLetterExpiredInboundCommand,
+  ): Promise<DeadLetterExpiredInboundResult> {
+    const found = this.inboundById.get(input.eventId);
+    if (!found) return { status: "conflict", code: "not_found" };
+    return this.withBindingLock<DeadLetterExpiredInboundResult>(
+      found.envelope.event.bindingId,
+      "dead_letter_inbound",
+      async () => {
+      const record = this.inboundById.get(input.eventId);
+      if (!record) return { status: "conflict", code: "not_found" };
+      if (record.state === "dead_letter") return { status: "already_terminal" };
+      if (record.state !== "persisted") return { status: "conflict", code: "state_changed" };
+      if (
+        !Number.isSafeInteger(input.expectedAttempts) ||
+        input.expectedAttempts < 1 ||
+        record.leaseVersion !== input.expectedAttempts
+      ) {
+        return { status: "conflict", code: "version_mismatch" };
+      }
+      if (
+        input.reason !== "retry_exhausted" ||
+        !Number.isFinite(input.now.getTime()) ||
+        !record.leaseExpiresAt ||
+        record.leaseExpiresAt > input.now
+      ) {
+        return { status: "conflict", code: "lease_not_expired" };
+      }
+      record.state = "dead_letter";
+      record.leaseVersion += 1;
+      record.leaseOwnerHash = undefined;
+      record.leaseExpiresAt = undefined;
+        return { status: "dead_lettered" };
+      },
+    );
+  }
+
   async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
     const messageBodyDigest = await sha256(JSON.stringify(input.message.body));
     const idempotencyScope = this.outboundIdempotencyKey(
       input.command.bindingId,
       input.command.idempotencyKey,
     );
     const existing = this.outboundByIdempotency.get(idempotencyScope);
     if (existing) {
       if (!this.sameOutboundDraft(existing, input, messageBodyDigest)) {
         return { status: "conflict", code: "idempotency_mismatch" };
       }
       const reason = this.outboundDuplicateReason(existing);
       return {
         status: "duplicate",
         commandId: existing.command.commandId,
         messageId: existing.message.id,
         commandState: existing.state,
         ...(reason ? { reason } : {}),
       };
     }
     const record: OutboundRecord = {
       ...clone(input),
       message: metadataOnlyMessage(input.message),
       messageBodyDigest,
       state: "draft",
       leaseVersion: 0,
     };
     record.command.state = "draft";
     this.outboundById.set(record.command.commandId, record);
     this.outboundByIdempotency.set(idempotencyScope, record);
     return {
       status: "created",
       commandId: record.command.commandId,
       messageId: record.message.id,
     };
   }
 
   async finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult> {
     const record = this.outboundById.get(input.commandId);
     const activeDigest = input.endpointDigests[0];
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
index 8f16db7..7763348 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -406,151 +406,168 @@ export type TemplateReconciliationResult =
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
   | { kind: "inbound_lease_expired"; eventId: string; attempts: number };
 
+export type DeadLetterExpiredInboundCommand = {
+  eventId: string;
+  expectedAttempts: number;
+  reason: "retry_exhausted";
+  now: Date;
+};
+
+export type DeadLetterExpiredInboundResult =
+  | { status: "dead_lettered" | "already_terminal" }
+  | {
+      status: "conflict";
+      code: "not_found" | "state_changed" | "version_mismatch" | "lease_not_expired";
+    };
+
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
 
 export interface CommunicationsRepository {
   acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult>;
   claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult>;
   completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict">;
   createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult>;
   finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult>;
   failOutboundDraft(input: FailOutboundDraftCommand): Promise<"completed" | "conflict">;
   claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult>;
   markDispatchOutcome(
     input: MarkDispatchOutcomeCommand,
   ): Promise<"completed" | "conflict">;
   applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult>;
   grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult>;
   withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult>;
   resolveAmbiguousOptOutFromReceipt(
     input: ResolveOptOutCommand,
   ): Promise<AmbiguousOptOutResolutionResult>;
   suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult>;
   revalidateBindingFromReceipt(input: RevalidateBindingCommand): Promise<BindingChangeResult>;
   reconcileTemplate(input: ReconcileTemplateCommand): Promise<TemplateReconciliationResult>;
   reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult>;
   findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]>;
+  deadLetterExpiredInbound(
+    input: DeadLetterExpiredInboundCommand,
+  ): Promise<DeadLetterExpiredInboundResult>;
   registerTemplateDefinition(input: RegisterTemplateDefinition & { now: Date }): Promise<TemplateResult>;
   approveTemplateDefinition(
     input: ApproveTemplateDefinition & { now: Date },
   ): Promise<TemplateResult>;
   evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult>;
 }
 
 export interface MessageTemplateService {
   registerInternalDefinition(input: RegisterTemplateDefinition): Promise<TemplateResult>;
   recordInternalApproval(input: ApproveTemplateDefinition): Promise<TemplateResult>;
   applyProviderProjection(input: ReconcileTemplateCommand): Promise<TemplateResult>;
   evaluateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult>;
 }
 
 export type CommunicationsReferenceState = {
   inbound: readonly Record<string, unknown>[];
   outbound: readonly Record<string, unknown>[];
   attempts: readonly Record<string, unknown>[];
   policies: readonly (ChannelContactPolicy & { fence: number })[];
   bindings: readonly (ContactChannelBinding & { freshUntil: Date })[];
   consentHistory: readonly ConsentRecord[];
   templates: readonly TemplateRecord[];
   providerStatuses: readonly ApplyProviderStatusCommand[];
   withdrawalHistory: readonly WithdrawalHistoryRecord[];
 };
 
 export type CommunicationsSeed = {
   bindings?: readonly (ContactChannelBinding & { freshUntil: Date })[];
   policies?: readonly (ChannelContactPolicy & { fence: number })[];
   consents?: readonly ConsentRecord[];
   connections?: readonly { channel: ChannelKind; state: ChannelConnectionState }[];
   templates?: readonly TemplateRecord[];
 };
 
 export type HandoffRequestResult =
   | { status: "queued"; receipt?: DomainReceipt }
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
index c9a6379..ea60157 100644
--- a/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-reconciliation.test.ts
@@ -17,54 +17,147 @@ function templateReceipt(version: number, state: "provider_approved" | "paused")
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
         { kind: "inbound_lease_expired" as const, eventId: "event_retry", attempts: 1 },
         { kind: "inbound_lease_expired" as const, eventId: "event_exhausted", attempts: 3 },
       ],
+      deadLetterExpiredInbound: async () => ({ status: "dead_lettered" as const }),
     } as unknown as MemoryCommunicationsRepository;
-    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4, maxInboundAttempts: 11 })).toEqual({ status: "rejected", code: "inbound_retry_limit_invalid" });
-    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4, maxInboundAttempts: 3 })).toEqual({
+    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4 })).toEqual({
       status: "completed",
       code: "recovery_work_found",
       work: [
         { kind: "outbound_dispatch_unknown", commandId: "command_1", attemptId: "attempt_1", disposition: "manual_review", terminal: true },
         { kind: "outbound_lease_expired", commandId: "command_2", attemptId: "attempt_2", disposition: "manual_review", terminal: true },
         { kind: "inbound_lease_expired", eventId: "event_retry", attempts: 1, disposition: "retry_allowed", terminal: false },
         { kind: "inbound_lease_expired", eventId: "event_exhausted", attempts: 3, disposition: "dead_letter", terminal: true },
       ],
     });
   });
+
+  it("persists exhausted inbound recovery once and never reopens it under a later higher caller limit", async () => {
+    const repository = new MemoryCommunicationsRepository({
+      policies: [{
+        policyId: "policy_recovery",
+        bindingId: "binding_recovery",
+        state: "normal",
+        version: 7,
+        fence: 1,
+        updatedAt: NOW,
+      }],
+    });
+    await repository.acceptInbound({
+      connectionId: "connection_recovery",
+      providerEventId: "provider_event_recovery",
+      providerBodyDigest: "body_digest_recovery",
+      endpointDigests: [{ version: "v1", digest: "endpoint_digest_recovery" }],
+      optOutSignal: "none",
+      envelope: {
+        event: {
+          eventId: "event_recovery",
+          channel: "whatsapp",
+          locale: "en",
+          connectionState: "active",
+          bindingId: "binding_recovery",
+          conversationId: "conversation_recovery",
+          messageId: "message_recovery",
+          receivedAt: NOW,
+          state: "persisted",
+          correlationId: "correlation_recovery",
+        },
+        conversation: {
+          id: "conversation_recovery",
+          channel: "whatsapp",
+          locale: "en",
+          status: "new",
+          participantIds: ["participant_recovery"],
+          version: 1,
+          createdAt: NOW,
+          updatedAt: NOW,
+          lastActivityAt: NOW,
+        },
+        participant: {
+          participantId: "participant_recovery",
+          conversationId: "conversation_recovery",
+          bindingId: "binding_recovery",
+          role: "external_contact",
+          createdAt: NOW,
+        },
+        message: {
+          id: "message_recovery",
+          conversationId: "conversation_recovery",
+          channel: "whatsapp",
+          direction: "inbound",
+          senderParticipantId: "participant_recovery",
+          locale: "en",
+          kind: "text",
+          body: "Synthetic recovery input",
+          createdAt: NOW,
+        },
+      },
+    });
+    for (let attempt = 0; attempt < 3; attempt += 1) {
+      const claimAt = new Date(NOW.getTime() + attempt * 120_000);
+      await expect(repository.claimInbound({
+        eventId: "event_recovery",
+        leaseOwner: `worker_${attempt}`,
+        leaseExpiresAt: new Date(claimAt.getTime() + 60_000),
+        now: claimAt,
+        requiredPolicyVersion: 7,
+      })).resolves.toMatchObject({ status: "claimed", leaseVersion: attempt + 1 });
+    }
+
+    const expiredAt = new Date(NOW.getTime() + 6 * 60_000);
+    await expect(expireChannelRecoveryState({ repository, now: expiredAt, limit: 10 })).resolves.toMatchObject({
+      status: "completed",
+      work: [{ eventId: "event_recovery", attempts: 3, disposition: "dead_letter", terminal: true }],
+    });
+    expect(repository.referenceState().inbound[0]).toMatchObject({
+      eventId: "event_recovery",
+      state: "dead_letter",
+      leaseVersion: 4,
+    });
+
+    await expect(
+      (expireChannelRecoveryState as (input: Record<string, unknown>) => Promise<unknown>)({
+        repository,
+        now: new Date(expiredAt.getTime() + 60_000),
+        limit: 10,
+        maxInboundAttempts: 99,
+      }),
+    ).resolves.toEqual({ status: "completed", code: "no_recovery_work", work: [] });
+  });
 });
```
