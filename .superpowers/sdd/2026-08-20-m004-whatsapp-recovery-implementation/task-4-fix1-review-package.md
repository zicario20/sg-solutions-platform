# Task 4 fix round 1

## Commits
1522d10 fix(domain): harden communications recovery fences

## Stat
 .../domain/src/communications/memory-repository.ts | 425 ++++++++++++---
 .../domain/src/communications/repository.ts        | 145 ++++-
 .../packages/domain/src/communications/service.ts  | 106 +++-
 .../tests/m004/communications-concurrency.test.ts  | 583 ++++++++++++++++++++-
 .../tests/m004/communications-service.test.ts      | 197 ++++++-
 5 files changed, 1335 insertions(+), 121 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 8467264..8a47973 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -8,39 +8,44 @@ import type {
   ClaimOutboundCommand,
   CommunicationsReferenceState,
   CommunicationsRepository,
   CommunicationsSeed,
   CompleteInboundCommand,
   ConsentChangeResult,
   ConsentRecord,
   CreateOutboundCommand,
   CreateOutboundResult,
   EvaluateTemplateEligibility,
+  FailOutboundDraftCommand,
+  FinalizeOutboundCommand,
   GrantConsentCommand,
   InboundClaimResult,
   MarkDispatchOutcomeCommand,
   OutboundClaimResult,
   ProviderStatusResult,
   RecoveryCandidate,
   RecoveryQuery,
+  ReconcileOutboundCommand,
+  ReconcileOutboundResult,
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
+  WithdrawalHistoryRecord,
 } from "./repository.ts";
 import type {
   ChannelConnectionState,
   ChannelContactPolicy,
   ChannelKind,
   ContactChannelBinding,
   OutboundCommandState,
   OutboundDispatchAttempt,
 } from "./contracts.ts";
 
@@ -49,36 +54,57 @@ type InboundRecord = {
   providerBodyDigest: string;
   endpointDigests: AcceptInboundCommand["endpointDigests"];
   envelope: AcceptInboundCommand["envelope"];
   state: "persisted" | "applied" | "manual_review" | "dead_letter";
   leaseOwner?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
 };
 
 type OutboundRecord = CreateOutboundCommand & {
+  fingerprint?: string;
+  requiredPolicyVersion?: number;
+  requiredFence?: number;
+  endpointDigests?: FinalizeOutboundCommand["endpointDigests"];
+  authorizationReceipt?: FinalizeOutboundCommand["authorizationReceipt"];
+  failureCode?: FailOutboundDraftCommand["code"];
   state: OutboundCommandState;
   leaseOwner?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
   blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
 };
 
 type AttemptRecord = OutboundDispatchAttempt & {
   leaseOwner: string;
   leaseVersion: number;
+  leaseExpiresAt: Date;
   providerReference?: string;
 };
 
+type ReconciledCommandState = Extract<
+  ReconcileOutboundResult,
+  { commandState: unknown }
+>["commandState"];
+
+type StoredReconciliationResult = {
+  status: "reconciled";
+  commandState: ReconciledCommandState;
+};
+
 type LockOperation =
   | "accept_inbound"
+  | "claim_inbound"
   | "claim_outbound"
+  | "complete_outbound"
+  | "apply_provider_status"
+  | "reconcile_outbound"
   | "withdraw_contact"
   | "grant_consent"
   | "resolve_opt_out"
   | "suspend_binding"
   | "revalidate_binding";
 
 export type MemoryCommunicationsRepositoryOptions = CommunicationsSeed & {
   lockBoundary?: (input: { bindingId: string; operation: LockOperation }) => Promise<void>;
 };
 
@@ -116,20 +142,22 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     ContactChannelBinding & { freshUntil: Date }
   >();
   private readonly consents = new Map<string, ConsentRecord>();
   private readonly consentHistory: ConsentRecord[] = [];
   private readonly connections = new Map<
     string,
     { channel: ChannelKind; state: ChannelConnectionState }
   >();
   private readonly templates = new Map<string, TemplateRecord>();
   private readonly providerStatuses = new Map<string, ApplyProviderStatusCommand>();
+  private readonly withdrawalHistory: WithdrawalHistoryRecord[] = [];
+  private readonly reconciliationReceipts = new Map<string, StoredReconciliationResult>();
   private readonly bindingLockTails = new Map<string, Promise<void>>();
   private readonly lockBoundary?: MemoryCommunicationsRepositoryOptions["lockBoundary"];
 
   constructor(options: MemoryCommunicationsRepositoryOptions = {}) {
     this.lockBoundary = options.lockBoundary;
     for (const binding of options.bindings ?? []) {
       this.bindings.set(binding.bindingId, clone(binding));
     }
     for (const policy of options.policies ?? []) {
       this.policies.set(policy.bindingId, clone(policy));
@@ -193,84 +221,117 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         eventId: input.envelope.event.eventId,
         endpointDigestVersion: activeDigest.version,
         endpointDigest: activeDigest.digest,
       };
     });
   }
 
   async claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult> {
     const record = this.inboundById.get(input.eventId);
     if (!record) return { status: "not_claimed", code: "not_found" };
-    if (record.state !== "persisted") {
-      return { status: "not_claimed", code: "already_completed" };
-    }
-    const policy = this.policies.get(record.envelope.event.bindingId);
-    if (!policy || policy.version !== input.requiredPolicyVersion) {
-      return { status: "not_claimed", code: "policy_version_mismatch" };
-    }
-    if (record.leaseOwner && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
-      return { status: "not_claimed", code: "lease_conflict" };
-    }
-    record.leaseOwner = input.leaseOwner;
-    record.leaseVersion += 1;
-    record.leaseExpiresAt = input.leaseExpiresAt;
-    return {
-      status: "claimed",
-      eventId: input.eventId,
-      leaseVersion: record.leaseVersion,
-      envelope: clone(record.envelope),
-      policyState: policy.state,
-    };
+    return this.withBindingLock(record.envelope.event.bindingId, "claim_inbound", async () => {
+      if (record.state !== "persisted") {
+        return { status: "not_claimed", code: "already_completed" };
+      }
+      const policy = this.policies.get(record.envelope.event.bindingId);
+      if (!policy || policy.version !== input.requiredPolicyVersion) {
+        return { status: "not_claimed", code: "policy_version_mismatch" };
+      }
+      if (record.leaseOwner && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
+        return { status: "not_claimed", code: "lease_conflict" };
+      }
+      record.leaseOwner = input.leaseOwner;
+      record.leaseVersion += 1;
+      record.leaseExpiresAt = input.leaseExpiresAt;
+      return {
+        status: "claimed",
+        eventId: input.eventId,
+        leaseVersion: record.leaseVersion,
+        envelope: clone(record.envelope),
+        policyState: policy.state,
+      };
+    });
   }
 
   async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
     const record = this.inboundById.get(input.eventId);
     if (
       !record ||
       record.state !== "persisted" ||
       record.leaseOwner !== input.leaseOwner ||
-      record.leaseVersion !== input.leaseVersion
+      record.leaseVersion !== input.leaseVersion ||
+      !this.validLeaseCompletion(input.now, record.leaseExpiresAt)
     ) {
       return "conflict";
     }
     record.state = input.outcome;
     record.leaseOwner = undefined;
     record.leaseExpiresAt = undefined;
     return "completed";
   }
 
   async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
     const existing = this.outboundByIdempotency.get(input.command.idempotencyKey);
     if (existing) {
-      return existing.fingerprint === input.fingerprint
+      return this.sameOutboundDraft(existing, input)
         ? {
             status: "duplicate",
             commandId: existing.command.commandId,
             messageId: existing.message.id,
           }
         : { status: "conflict", code: "idempotency_mismatch" };
     }
     const record: OutboundRecord = {
       ...clone(input),
-      state: "queued",
+      state: "draft",
       leaseVersion: 0,
     };
-    record.command.state = "queued";
+    record.command.state = "draft";
     this.outboundById.set(record.command.commandId, record);
     this.outboundByIdempotency.set(record.command.idempotencyKey, record);
     return {
       status: "created",
       commandId: record.command.commandId,
       messageId: record.message.id,
     };
   }
 
+  async finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult> {
+    const record = this.outboundById.get(input.commandId);
+    if (!record || record.state !== "draft" || !input.endpointDigests[0]) {
+      return { status: "conflict", code: "idempotency_mismatch" };
+    }
+    record.fingerprint = input.fingerprint;
+    record.requiredPolicyVersion = input.requiredPolicyVersion;
+    record.requiredFence = input.requiredFence;
+    record.endpointDigests = clone(input.endpointDigests);
+    record.authorizationReceipt = clone(input.authorizationReceipt);
+    record.state = "queued";
+    record.command.state = "queued";
+    return {
+      status: "created",
+      commandId: record.command.commandId,
+      messageId: record.message.id,
+    };
+  }
+
+  async failOutboundDraft(
+    input: FailOutboundDraftCommand,
+  ): Promise<"completed" | "conflict"> {
+    const record = this.outboundById.get(input.commandId);
+    if (!record || record.state !== "draft") return "conflict";
+    record.state = "failed";
+    record.command.state = "failed";
+    record.failureCode = input.code;
+    return "completed";
+  }
+
   async claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult> {
     const found = this.outboundById.get(input.commandId);
     if (!found) return { status: "not_claimed", code: "not_found" };
     return this.withBindingLock(found.command.bindingId, "claim_outbound", async () => {
       const record = this.outboundById.get(input.commandId);
       if (!record) return { status: "not_claimed", code: "not_found" };
       if (record.state === "dispatch_unknown" || record.state === "reconciliation_required") {
         return { status: "not_claimed", code: "dispatch_unknown_non_retryable" };
       }
       if (record.state === "cancelled" && record.blockedCode) {
@@ -283,36 +344,36 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         return { status: "not_claimed", code: "already_completed" };
       }
       const binding = this.bindings.get(record.command.bindingId);
       if (!binding) return { status: "not_claimed", code: "binding_not_found" };
       const policy = this.policies.get(record.command.bindingId);
       if (!policy) return { status: "not_claimed", code: "policy_not_found" };
       const consent = this.consents.get(this.consentKey(record.command.bindingId, record.purpose));
       if (!consent) return { status: "not_claimed", code: "consent_not_found" };
       const connection = this.connections.get(record.command.channel);
       const template = this.templates.get(this.templateKey(record.templateId, record.command.locale));
-      const activeDigest = record.endpointDigests[0];
+      const activeDigest = record.endpointDigests?.[0];
       if (!activeDigest) return { status: "not_claimed", code: "destination_mismatch" };
       const decision = evaluateOutboundPolicy({
         purpose: record.purpose,
         binding: {
           bindingId: binding.bindingId,
           trustState: binding.trustState,
           freshUntil: binding.freshUntil,
         },
         contactPolicy: {
           state: policy.state,
           version: policy.version,
           fence: policy.fence,
         },
-        requiredPolicyVersion: record.requiredPolicyVersion,
-        requiredFence: record.requiredFence,
+        requiredPolicyVersion: record.requiredPolicyVersion!,
+        requiredFence: record.requiredFence!,
         consent: { state: consent.state, receipt: consent.receipt },
         connectionState: connection?.state ?? "disabled",
         template: {
           eligible: Boolean(
             template?.internallyApproved && template.providerState === "provider_approved",
           ),
         },
         authorizationReceipt: record.authorizationReceipt,
         destinationKey: activeDigest.digest,
         now: input.now,
@@ -328,94 +389,111 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         attemptId: input.attemptId,
         commandId: input.commandId,
         ordinal: [...this.attempts.values()].filter(
           (candidate) => candidate.commandId === input.commandId,
         ).length + 1,
         state: "dispatching",
         startedAt: input.now,
         correlationId: record.command.correlationId,
         leaseOwner: input.leaseOwner,
         leaseVersion: record.leaseVersion,
+        leaseExpiresAt: input.leaseExpiresAt,
       };
       this.attempts.set(input.attemptId, attempt);
       return {
         status: "claimed",
         command: clone(record.command),
         message: clone(record.message),
         attempt: clone(attempt),
         destinationDigest: clone(activeDigest),
       };
     });
   }
 
   async markDispatchOutcome(
     input: MarkDispatchOutcomeCommand,
   ): Promise<"completed" | "conflict"> {
-    const record = this.outboundById.get(input.commandId);
-    const attempt = this.attempts.get(input.attemptId);
-    if (
-      !record ||
-      !attempt ||
-      record.state !== "dispatching" ||
-      attempt.state !== "dispatching" ||
-      record.leaseOwner !== input.leaseOwner ||
-      record.leaseVersion !== input.leaseVersion ||
-      attempt.leaseOwner !== input.leaseOwner ||
-      attempt.leaseVersion !== input.leaseVersion
-    ) {
-      return "conflict";
-    }
-    const state: OutboundCommandState =
-      input.outcome === "accepted"
-        ? "provider_accepted"
-        : input.outcome === "unknown"
-          ? "dispatch_unknown"
-          : "failed";
-    record.state = state;
-    record.command.state = state;
-    record.leaseOwner = undefined;
-    record.leaseExpiresAt = undefined;
-    attempt.state = state;
-    attempt.completedAt = input.now;
-    attempt.providerReference = input.providerReference;
-    return "completed";
+    const found = this.outboundById.get(input.commandId);
+    if (!found) return "conflict";
+    return this.withBindingLock(found.command.bindingId, "complete_outbound", async () => {
+      const record = this.outboundById.get(input.commandId);
+      const attempt = this.attempts.get(input.attemptId);
+      if (
+        !record ||
+        !attempt ||
+        attempt.leaseOwner !== input.leaseOwner ||
+        attempt.leaseVersion !== input.leaseVersion ||
+        !this.validLeaseCompletion(input.now, attempt.leaseExpiresAt)
+      ) {
+        return "conflict";
+      }
+      if (attempt.state !== "dispatching") {
+        return input.outcome === "accepted" &&
+          ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
+          ["provider_accepted", "sent", "delivered", "read"].includes(record.state)
+          ? "completed"
+          : "conflict";
+      }
+      if (
+        record.state !== "dispatching" ||
+        record.leaseOwner !== input.leaseOwner ||
+        record.leaseVersion !== input.leaseVersion
+      ) {
+        return "conflict";
+      }
+      const state: OutboundCommandState =
+        input.outcome === "accepted"
+          ? "provider_accepted"
+          : input.outcome === "unknown"
+            ? "dispatch_unknown"
+            : "failed";
+      record.state = state;
+      record.command.state = state;
+      record.leaseOwner = undefined;
+      record.leaseExpiresAt = undefined;
+      attempt.state = state;
+      attempt.completedAt = input.now;
+      attempt.providerReference = input.providerReference;
+      return "completed";
+    });
   }
 
   async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
-    const record = this.outboundById.get(input.commandId);
-    if (!record) return { status: "not_found" };
-    const eventKey = `${input.commandId}\u0000${input.providerEventId}`;
-    if (this.providerStatuses.has(eventKey)) {
-      return { status: "duplicate", commandState: record.state };
-    }
-    this.providerStatuses.set(eventKey, clone(input));
-    if (input.status === "failed") {
-      if (["provider_accepted", "dispatching", "queued"].includes(record.state)) {
-        record.state = "failed";
-        record.command.state = "failed";
-        return { status: "applied", commandState: "failed" };
-      }
-      return { status: "regressive", commandState: record.state };
-    }
-    const currentRank =
-      record.state === "sent" || record.state === "delivered" || record.state === "read"
-        ? DELIVERY_RANK[record.state]
-        : 0;
-    if (DELIVERY_RANK[input.status] <= currentRank) {
-      return { status: "regressive", commandState: record.state };
-    }
-    if (["failed", "expired", "cancelled", "manual_review"].includes(record.state)) {
-      return { status: "regressive", commandState: record.state };
-    }
-    record.state = input.status;
-    record.command.state = input.status;
-    return { status: "applied", commandState: input.status };
+    const found = this.outboundById.get(input.commandId);
+    if (!found) return { status: "not_found" };
+    return this.withBindingLock(found.command.bindingId, "apply_provider_status", async () => {
+      const record = this.outboundById.get(input.commandId)!;
+      const eventKey = `${input.commandId}\u0000${input.providerEventId}`;
+      if (this.providerStatuses.has(eventKey)) {
+        return { status: "duplicate", commandState: record.state };
+      }
+      this.providerStatuses.set(eventKey, clone(input));
+      if (input.status === "failed") {
+        if (["provider_accepted", "dispatching", "queued"].includes(record.state)) {
+          this.closeActiveAttempt(record, "failed", input.occurredAt);
+          return { status: "applied", commandState: "failed" };
+        }
+        return { status: "regressive", commandState: record.state };
+      }
+      const currentRank =
+        record.state === "sent" || record.state === "delivered" || record.state === "read"
+          ? DELIVERY_RANK[record.state]
+          : 0;
+      if (DELIVERY_RANK[input.status] <= currentRank) {
+        return { status: "regressive", commandState: record.state };
+      }
+      if (["failed", "expired", "cancelled", "manual_review"].includes(record.state)) {
+        return { status: "regressive", commandState: record.state };
+      }
+      this.closeActiveAttempt(record, input.status, input.occurredAt);
+      return { status: "applied", commandState: input.status };
+    });
   }
 
   async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
     return this.withBindingLock(input.bindingId, "grant_consent", async () => {
       const authority = evaluateAuthorityChange({
         operation: input.operation,
         bindingId: input.bindingId,
         receipt: input.receipt,
         now: input.now,
       });
@@ -445,34 +523,37 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         changedAt: input.now,
       };
       this.consents.set(key, next);
       this.consentHistory.push(clone(next));
       return { status: "changed", state: "granted", version: next.version };
     });
   }
 
   async withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult> {
     return this.withBindingLock(input.bindingId, "withdraw_contact", async () => {
+      const evidence = this.validateWithdrawalEvidence(input);
+      if (evidence.status === "denied") return evidence;
       const policy = this.requirePolicy(input.bindingId, input.now);
       if (policy.state === "withdrawn") {
         return {
           status: "duplicate",
           state: "withdrawn",
           policyVersion: policy.version,
           fence: policy.fence,
           cancelledCommandIds: [],
         };
       }
       policy.state = "withdrawn";
       policy.version += 1;
       policy.fence += 1;
       policy.updatedAt = input.now;
+      this.withdrawalHistory.push(evidence.record);
       for (const [key, consent] of this.consents) {
         if (consent.bindingId !== input.bindingId || consent.state !== "granted") continue;
         const withdrawn: ConsentRecord = {
           ...clone(consent),
           state: "withdrawn",
           version: consent.version + 1,
           receipt: undefined,
           authorityReceiptId: undefined,
           changedAt: input.now,
         };
@@ -509,21 +590,28 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       });
       if (!authority.allowed) return { status: "denied", code: authority.code };
       const policy = this.requirePolicy(input.bindingId, input.now);
       if (policy.state !== "opt_out_pending" && policy.state !== "withdrawn") {
         return { status: "denied", code: "policy_state_invalid" };
       }
       policy.state = "normal_after_review";
       policy.version += 1;
       policy.fence += 1;
       policy.updatedAt = input.now;
-      return { status: "changed", state: "granted", version: policy.version };
+      const currentConsent = [...this.consents.values()]
+        .filter((consent) => consent.bindingId === input.bindingId)
+        .sort((left, right) => right.version - left.version)[0];
+      return {
+        status: "unchanged",
+        state: currentConsent?.state ?? "not_requested",
+        version: currentConsent?.version ?? 0,
+      };
     });
   }
 
   async suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult> {
     return this.withBindingLock(input.bindingId, "suspend_binding", async () => {
       const binding = this.bindings.get(input.bindingId);
       if (!binding) return { status: "denied", code: "binding_not_found" };
       if (binding.trustState === "suspended") {
         return { status: "duplicate", trustState: "suspended" };
       }
@@ -583,54 +671,118 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
 
   async approveTemplateDefinition(
     input: ApproveTemplateDefinition & { now: Date },
   ): Promise<TemplateResult> {
     const receipt = input.receipt;
     if (!receipt) return { status: "denied", code: "approval_receipt_missing" };
     if (
       receipt.owner !== "communications" ||
       receipt.operation !== "template_internal_approval" ||
       receipt.resourceId !== input.templateId ||
+      receipt.locale !== input.locale ||
+      receipt.definitionVersion !== input.definitionVersion ||
       !currentReceipt(receipt, input.now)
     ) {
       return { status: "denied", code: "approval_receipt_invalid" };
     }
-    const template = [...this.templates.values()].find(
-      (candidate) => candidate.templateId === input.templateId,
-    );
+    const template = this.templates.get(this.templateKey(input.templateId, input.locale));
     if (!template) return { status: "not_found", code: "template_not_found" };
+    if (template.definitionVersion !== input.definitionVersion) {
+      return { status: "denied", code: "approval_receipt_invalid" };
+    }
     if (template.internallyApproved && template.approvalReceiptId === receipt.receiptId) {
       return { status: "duplicate", ...clone(template) };
     }
     template.internallyApproved = true;
     template.approvalReceiptId = receipt.receiptId;
     template.updatedAt = input.now;
     return { status: "approved", ...clone(template) };
   }
 
   async reconcileTemplate(
     input: ReconcileTemplateCommand,
   ): Promise<TemplateReconciliationResult> {
+    if (!input.receipt) return { status: "denied", code: "provider_receipt_missing" };
     const template = this.templates.get(this.templateKey(input.templateId, input.locale));
     if (!template) return { status: "not_found", code: "template_not_found" };
+    if (
+      input.receipt.owner !== "communications" ||
+      input.receipt.operation !== "template_provider_reconciliation" ||
+      input.receipt.templateId !== input.templateId ||
+      input.receipt.locale !== input.locale ||
+      input.receipt.definitionVersion !== template.definitionVersion ||
+      input.receipt.providerVersion !== input.providerVersion ||
+      input.receipt.providerState !== input.providerState ||
+      input.receipt.correlationId !== input.correlationId ||
+      !currentReceipt(input.receipt, input.now)
+    ) {
+      return { status: "denied", code: "provider_receipt_invalid" };
+    }
     if (input.providerVersion < template.providerVersion) {
       return { status: "regressive", ...clone(template) };
     }
     if (input.providerVersion === template.providerVersion) {
       return { status: "duplicate", ...clone(template) };
     }
     template.providerState = input.providerState;
     template.providerVersion = input.providerVersion;
+    template.providerReceiptId = input.receipt.receiptId;
+    template.providerCorrelationId = input.receipt.correlationId;
     template.updatedAt = input.now;
     return { status: "applied", ...clone(template) };
   }
 
+  async reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult> {
+    const found = this.outboundById.get(input.commandId);
+    if (!found) return { status: "not_found" };
+    return this.withBindingLock(found.command.bindingId, "reconcile_outbound", async () => {
+      if (!input.receipt) {
+        return { status: "denied", code: "reconciliation_receipt_missing" };
+      }
+      const prior = this.reconciliationReceipts.get(input.receipt.receiptId);
+      if (prior) return { status: "duplicate", commandState: prior.commandState };
+      const record = this.outboundById.get(input.commandId);
+      const attempt = this.attempts.get(input.attemptId);
+      if (!record || !attempt) return { status: "not_found" };
+      if (!this.validReconciliationReceipt(input, input.receipt, record.command.correlationId)) {
+        return { status: "denied", code: "reconciliation_receipt_invalid" };
+      }
+      const expiredDispatch =
+        record.state === "dispatching" &&
+        record.leaseExpiresAt !== undefined &&
+        Number.isFinite(input.now.getTime()) &&
+        input.now >= record.leaseExpiresAt;
+      if (
+        record.state !== "dispatch_unknown" &&
+        record.state !== "reconciliation_required" &&
+        !expiredDispatch
+      ) {
+        return { status: "denied", code: "reconciliation_state_invalid" };
+      }
+      const commandState =
+        input.receipt.outcome === "reconciled_accepted"
+          ? "reconciled_accepted"
+          : input.receipt.outcome === "confirmed_not_sent"
+            ? "confirmed_not_sent"
+            : "failed";
+      record.state = commandState;
+      record.command.state = commandState;
+      record.leaseOwner = undefined;
+      record.leaseExpiresAt = undefined;
+      attempt.state = commandState;
+      attempt.completedAt = input.now;
+      const result: StoredReconciliationResult = { status: "reconciled", commandState };
+      this.reconciliationReceipts.set(input.receipt.receiptId, result);
+      return result;
+    });
+  }
+
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
@@ -686,29 +838,31 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
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
+        failureCode: record.failureCode,
         state: record.state,
         leaseVersion: record.leaseVersion,
       })),
       attempts: [...this.attempts.values()],
       policies: [...this.policies.values()],
       bindings: [...this.bindings.values()],
       consentHistory: this.consentHistory,
       templates: [...this.templates.values()],
       providerStatuses: [...this.providerStatuses.values()],
+      withdrawalHistory: this.withdrawalHistory,
     });
   }
 
   private consentKey(bindingId: string, purpose: string): string {
     return `${bindingId}\u0000${purpose}`;
   }
 
   private templateKey(templateId: string, locale: string): string {
     return `${templateId}\u0000${locale}`;
   }
@@ -724,20 +878,117 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       bindingId,
       state: "normal",
       version: 0,
       fence: 0,
       updatedAt: now,
     };
     this.policies.set(bindingId, created);
     return created;
   }
 
+  private validLeaseCompletion(now: Date, leaseExpiresAt: Date | undefined): boolean {
+    return Boolean(
+      leaseExpiresAt &&
+        Number.isFinite(now.getTime()) &&
+        Number.isFinite(leaseExpiresAt.getTime()) &&
+        now < leaseExpiresAt,
+    );
+  }
+
+  private sameOutboundDraft(existing: OutboundRecord, input: CreateOutboundCommand): boolean {
+    return (
+      existing.command.bindingId === input.command.bindingId &&
+      existing.command.conversationId === input.command.conversationId &&
+      existing.command.channel === input.command.channel &&
+      existing.command.locale === input.command.locale &&
+      existing.message.body === input.message.body &&
+      existing.purpose === input.purpose &&
+      existing.templateId === input.templateId
+    );
+  }
+
+  private closeActiveAttempt(
+    record: OutboundRecord,
+    state: "sent" | "delivered" | "read" | "failed",
+    completedAt: Date,
+  ): void {
+    record.state = state;
+    record.command.state = state;
+    const attempt = [...this.attempts.values()].find(
+      (candidate) => candidate.commandId === record.command.commandId && candidate.state === "dispatching",
+    );
+    if (attempt) {
+      attempt.state = state;
+      attempt.completedAt = completedAt;
+    }
+    record.leaseOwner = undefined;
+    record.leaseExpiresAt = undefined;
+  }
+
+  private validateWithdrawalEvidence(input: WithdrawContactCommand):
+    | { status: "allowed"; record: WithdrawalHistoryRecord }
+    | { status: "denied"; code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid" } {
+    const evidence = input.evidence;
+    if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
+    const receipt = evidence.receipt;
+    if (
+      receipt.bindingId !== input.bindingId ||
+      !receipt.receiptId ||
+      !receipt.correlationId ||
+      !currentReceipt(receipt, input.now)
+    ) {
+      return { status: "denied", code: "withdrawal_evidence_invalid" };
+    }
+    if (evidence.source === "inbound_event") {
+      const inbound = this.inboundById.get(evidence.receipt.eventId);
+      if (
+        receipt.owner !== "communications" ||
+        receipt.operation !== "inbound_opt_out" ||
+        !inbound ||
+        inbound.envelope.event.bindingId !== input.bindingId ||
+        receipt.correlationId !== inbound.envelope.event.correlationId
+      ) {
+        return { status: "denied", code: "withdrawal_evidence_invalid" };
+      }
+    } else if (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal") {
+      return { status: "denied", code: "withdrawal_evidence_invalid" };
+    }
+    return {
+      status: "allowed",
+      record: {
+        bindingId: input.bindingId,
+        source: evidence.source,
+        receiptId: receipt.receiptId,
+        eventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
+        correlationId: receipt.correlationId,
+        changedAt: input.now,
+      },
+    };
+  }
+
+  private validReconciliationReceipt(
+    input: ReconcileOutboundCommand,
+    receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
+    correlationId: string,
+  ): boolean {
+    return (
+      receipt.owner === "communications" &&
+      receipt.operation === "dispatch_reconciliation" &&
+      (receipt.source === "provider_lookup" || receipt.source === "manual_authority") &&
+      receipt.commandId === input.commandId &&
+      receipt.attemptId === input.attemptId &&
+      receipt.correlationId === correlationId &&
+      Boolean(receipt.receiptId) &&
+      currentReceipt(receipt, input.now)
+    );
+  }
+
   private async withBindingLock<T>(
     bindingId: string,
     operation: LockOperation,
     action: () => Promise<T>,
   ): Promise<T> {
     const previous = this.bindingLockTails.get(bindingId) ?? Promise.resolve();
     let release!: () => void;
     const current = new Promise<void>((resolve) => {
       release = resolve;
     });
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
index cc203a2..64ffabf 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -82,25 +82,39 @@ export type CompleteInboundCommand = {
   leaseVersion: number;
   outcome: "applied" | "manual_review" | "dead_letter";
   now: Date;
 };
 
 export type CreateOutboundCommand = {
   command: OutboundMessageCommand;
   message: ChannelMessage;
   purpose: ContactPurpose;
   templateId: string;
+};
+
+export type FinalizeOutboundCommand = {
+  commandId: string;
   fingerprint: string;
   requiredPolicyVersion: number;
   requiredFence: number;
   endpointDigests: readonly EndpointDigest[];
   authorizationReceipt?: OutboundAuthorizationReceipt;
+  now: Date;
+};
+
+export type FailOutboundDraftCommand = {
+  commandId: string;
+  code:
+    | "destination_unavailable"
+    | "endpoint_digest_key_unavailable"
+    | "endpoint_digest_key_invalid";
+  now: Date;
 };
 
 export type CreateOutboundResult =
   | { status: "created" | "duplicate"; commandId: string; messageId: string }
   | { status: "conflict"; code: "idempotency_mismatch" };
 
 export type ClaimOutboundCommand = {
   commandId: string;
   attemptId: string;
   leaseOwner: string;
@@ -179,43 +193,89 @@ export type ConsentRecord = {
 
 export type GrantConsentCommand = {
   bindingId: string;
   purpose: ContactPurpose;
   operation: "consent_grant" | "reconsent";
   receipt?: OwningAuthorityReceipt;
   now: Date;
 };
 
 export type ConsentChangeResult =
-  | { status: "changed" | "duplicate"; state: ContactConsentState; version: number }
+  | {
+      status: "changed" | "duplicate" | "unchanged";
+      state: ContactConsentState;
+      version: number;
+    }
   | {
       status: "denied";
       code:
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "reconsent_receipt_required"
         | "policy_state_invalid";
     };
 
 export type WithdrawContactCommand = {
   bindingId: string;
+  evidence?: ContactWithdrawalEvidence;
   now: Date;
 };
 
-export type WithdrawContactResult = {
-  status: "changed" | "duplicate";
-  state: "withdrawn";
-  policyVersion: number;
-  fence: number;
-  cancelledCommandIds: readonly string[];
+export type ContactWithdrawalEvidence =
+  | {
+      source: "inbound_event";
+      receipt: {
+        receiptId: string;
+        owner: "communications";
+        operation: "inbound_opt_out";
+        bindingId: string;
+        eventId: string;
+        issuedAt: Date;
+        expiresAt: Date;
+        correlationId: string;
+      };
+    }
+  | {
+      source: "authority";
+      receipt: {
+        receiptId: string;
+        owner: "consent";
+        operation: "contact_withdrawal";
+        bindingId: string;
+        issuedAt: Date;
+        expiresAt: Date;
+        correlationId: string;
+      };
+    };
+
+export type WithdrawalHistoryRecord = {
+  bindingId: string;
+  source: ContactWithdrawalEvidence["source"];
+  receiptId: string;
+  eventId?: string;
+  correlationId: string;
+  changedAt: Date;
 };
 
+export type WithdrawContactResult =
+  | {
+      status: "changed" | "duplicate";
+      state: "withdrawn";
+      policyVersion: number;
+      fence: number;
+      cancelledCommandIds: readonly string[];
+    }
+  | {
+      status: "denied";
+      code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid";
+    };
+
 export type ResolveOptOutCommand = {
   bindingId: string;
   receipt?: OwningAuthorityReceipt;
   now: Date;
 };
 
 export type SuspendBindingCommand = {
   bindingId: string;
   reason: "expired" | "wrong_person" | "reassigned" | "invalid_recipient";
   now: Date;
@@ -245,58 +305,84 @@ export type RevalidateBindingCommand = {
 export type TemplateProviderState = Extract<
   TemplateLifecycleState,
   "provider_approved" | "provider_rejected" | "paused" | "disabled"
 >;
 
 export type TemplateAuthorityReceipt = {
   receiptId: string;
   owner: "communications";
   operation: "template_internal_approval";
   resourceId: string;
+  locale: ChannelLocale;
+  definitionVersion: number;
   issuedAt: Date;
   expiresAt: Date;
 };
 
+export type TemplateProviderReconciliationReceipt = {
+  receiptId: string;
+  owner: "communications";
+  operation: "template_provider_reconciliation";
+  templateId: string;
+  locale: ChannelLocale;
+  definitionVersion: number;
+  providerVersion: number;
+  providerState: TemplateProviderState;
+  issuedAt: Date;
+  expiresAt: Date;
+  correlationId: string;
+};
+
 export type TemplateRecord = {
   templateId: string;
   locale: ChannelLocale;
   definitionVersion: number;
   internallyApproved: boolean;
   approvalReceiptId?: string;
+  providerReceiptId?: string;
+  providerCorrelationId?: string;
   providerState: TemplateLifecycleState;
   providerVersion: number;
   updatedAt: Date;
 };
 
 export type RegisterTemplateDefinition = {
   templateId: string;
   locale: ChannelLocale;
   definitionVersion: number;
   synthetic: boolean;
 };
 
 export type ApproveTemplateDefinition = {
   templateId: string;
+  locale: ChannelLocale;
+  definitionVersion: number;
   receipt?: TemplateAuthorityReceipt;
 };
 
 export type ReconcileTemplateCommand = {
   templateId: string;
   locale: ChannelLocale;
   providerState: TemplateProviderState;
   providerVersion: number;
+  correlationId: string;
+  receipt?: TemplateProviderReconciliationReceipt;
   now: Date;
 };
 
 export type TemplateReconciliationResult =
   | ({ status: "applied" | "duplicate" | "regressive" } & TemplateRecord)
-  | { status: "not_found"; code: "template_not_found" };
+  | { status: "not_found"; code: "template_not_found" }
+  | {
+      status: "denied";
+      code: "provider_receipt_missing" | "provider_receipt_invalid";
+    };
 
 export type TemplateResult =
   | ({ status: "registered" | "approved" } & TemplateRecord)
   | TemplateReconciliationResult
   | {
       status: "denied";
       code:
         | "approval_receipt_missing"
         | "approval_receipt_invalid"
         | "definition_conflict";
@@ -318,36 +404,78 @@ export type TemplateEligibilityResult =
 export type RecoveryQuery = { now: Date; limit: number };
 
 export type RecoveryCandidate =
   | {
       kind: "outbound_dispatch_unknown" | "outbound_lease_expired";
       commandId: string;
       attemptId: string;
     }
   | { kind: "inbound_lease_expired"; eventId: string };
 
+export type DispatchReconciliationOutcome =
+  | "reconciled_accepted"
+  | "confirmed_not_sent"
+  | "terminal_failure";
+
+export type DispatchReconciliationReceipt = {
+  receiptId: string;
+  owner: "communications";
+  operation: "dispatch_reconciliation";
+  source: "provider_lookup" | "manual_authority";
+  commandId: string;
+  attemptId: string;
+  outcome: DispatchReconciliationOutcome;
+  issuedAt: Date;
+  expiresAt: Date;
+  correlationId: string;
+};
+
+export type ReconcileOutboundCommand = {
+  commandId: string;
+  attemptId: string;
+  receipt?: DispatchReconciliationReceipt;
+  now: Date;
+};
+
+export type ReconcileOutboundResult =
+  | {
+      status: "reconciled" | "duplicate";
+      commandState: "reconciled_accepted" | "confirmed_not_sent" | "failed";
+    }
+  | {
+      status: "denied";
+      code:
+        | "reconciliation_receipt_missing"
+        | "reconciliation_receipt_invalid"
+        | "reconciliation_state_invalid";
+    }
+  | { status: "not_found" };
+
 export interface CommunicationsRepository {
   acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult>;
   claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult>;
   completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict">;
   createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult>;
+  finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult>;
+  failOutboundDraft(input: FailOutboundDraftCommand): Promise<"completed" | "conflict">;
   claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult>;
   markDispatchOutcome(
     input: MarkDispatchOutcomeCommand,
   ): Promise<"completed" | "conflict">;
   applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult>;
   grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult>;
   withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult>;
   resolveAmbiguousOptOutFromReceipt(input: ResolveOptOutCommand): Promise<ConsentChangeResult>;
   suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult>;
   revalidateBindingFromReceipt(input: RevalidateBindingCommand): Promise<BindingChangeResult>;
   reconcileTemplate(input: ReconcileTemplateCommand): Promise<TemplateReconciliationResult>;
+  reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult>;
   findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]>;
   registerTemplateDefinition(input: RegisterTemplateDefinition & { now: Date }): Promise<TemplateResult>;
   approveTemplateDefinition(
     input: ApproveTemplateDefinition & { now: Date },
   ): Promise<TemplateResult>;
   evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult>;
 }
 
@@ -362,20 +490,21 @@ export interface MessageTemplateService {
 
 export type CommunicationsReferenceState = {
   inbound: readonly Record<string, unknown>[];
   outbound: readonly Record<string, unknown>[];
   attempts: readonly Record<string, unknown>[];
   policies: readonly (ChannelContactPolicy & { fence: number })[];
   bindings: readonly (ContactChannelBinding & { freshUntil: Date })[];
   consentHistory: readonly ConsentRecord[];
   templates: readonly TemplateRecord[];
   providerStatuses: readonly ApplyProviderStatusCommand[];
+  withdrawalHistory: readonly WithdrawalHistoryRecord[];
 };
 
 export type CommunicationsSeed = {
   bindings?: readonly (ContactChannelBinding & { freshUntil: Date })[];
   policies?: readonly (ChannelContactPolicy & { fence: number })[];
   consents?: readonly ConsentRecord[];
   connections?: readonly { channel: ChannelKind; state: ChannelConnectionState }[];
   templates?: readonly TemplateRecord[];
 };
 
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
index 25f3d4f..160a3f7 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
@@ -5,20 +5,22 @@ import type {
   DomainReceipt,
 } from "./contracts.ts";
 import type {
   AcceptInboundResult,
   CanonicalInboundEnvelope,
   CommunicationsRepository,
   EndpointDigest,
   EvaluateTemplateEligibility,
   HandoffRequestResult,
   MessageTemplateService,
+  ReconcileOutboundCommand,
+  ReconcileOutboundResult,
   ReconcileTemplateCommand,
   RegisterTemplateDefinition,
   ApproveTemplateDefinition,
   TemplateEligibilityResult,
   TemplateResult,
 } from "./repository.ts";
 
 export type EndpointDigestKey = {
   purpose: "communications_endpoint_digest";
   version: string;
@@ -191,28 +193,24 @@ export class CommunicationsService {
       providerBodyDigest: input.providerBodyDigest,
       endpointDigests: resolved.digests,
       envelope: input.envelope,
       optOutSignal: input.optOutSignal,
     });
   }
 
   async queueOutbound(input: QueueOutboundApplicationCommand): Promise<Record<string, unknown>> {
     const copy = this.dependencies.contentPolicy.evaluate({ text: input.body });
     if (!copy.allowed) return { status: "unavailable", code: "prohibited_content" };
-    const resolved = await this.resolveDestination(input.bindingId);
-    if (resolved.status === "unavailable") {
-      return { status: "unavailable", code: resolved.code };
-    }
     const now = this.dependencies.clock.now();
     const commandId = this.dependencies.ids.next("outbound_command");
     const messageId = this.dependencies.ids.next("outbound_message");
-    return this.dependencies.repository.createOutbound({
+    const draft = await this.dependencies.repository.createOutbound({
       command: {
         commandId,
         channel: input.channel,
         locale: input.locale,
         conversationId: input.conversationId,
         bindingId: input.bindingId,
         messageId,
         idempotencyKey: input.idempotencyKey,
         state: "queued",
         createdAt: now,
@@ -224,25 +222,39 @@ export class CommunicationsService {
         channel: input.channel,
         direction: "outbound",
         senderParticipantId: "system",
         locale: input.locale,
         kind: "text",
         body: input.body,
         createdAt: now,
       },
       purpose: input.purpose,
       templateId: input.templateId,
+    });
+    if (draft.status !== "created") return draft;
+    const resolved = await this.resolveDestination(input.bindingId);
+    if (resolved.status === "unavailable") {
+      await this.dependencies.repository.failOutboundDraft({
+        commandId,
+        code: resolved.code,
+        now: this.dependencies.clock.now(),
+      });
+      return { status: "unavailable", code: resolved.code, commandId };
+    }
+    return this.dependencies.repository.finalizeOutbound({
+      commandId,
       fingerprint: input.fingerprint,
       requiredPolicyVersion: input.requiredPolicyVersion,
       requiredFence: input.requiredFence,
       endpointDigests: resolved.digests,
       authorizationReceipt: input.authorizationReceipt,
+      now: this.dependencies.clock.now(),
     });
   }
 
   async dispatchOutbound(input: {
     commandId: string;
     leaseOwner: string;
     leaseExpiresAt: Date;
   }): Promise<Record<string, unknown>> {
     const now = this.dependencies.clock.now();
     const attemptId = this.dependencies.ids.next("dispatch_attempt");
@@ -252,91 +264,96 @@ export class CommunicationsService {
       leaseOwner: input.leaseOwner,
       leaseExpiresAt: input.leaseExpiresAt,
       now,
     });
     if (claim.status === "not_claimed") {
       return { status: "not_dispatched", code: claim.code };
     }
 
     const resolved = await this.resolveDestination(claim.command.bindingId);
     if (resolved.status === "unavailable") {
-      await this.dependencies.repository.markDispatchOutcome({
+      const completion = await this.dependencies.repository.markDispatchOutcome({
         commandId: input.commandId,
         attemptId,
         leaseOwner: input.leaseOwner,
         leaseVersion: claim.attempt.leaseVersion,
         outcome: "known_failure",
         now: this.dependencies.clock.now(),
       });
+      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
       return { status: "not_dispatched", code: resolved.code, attemptId };
     }
     const matchingDigest = resolved.digests.some(
       (candidate) => candidate.digest === claim.destinationDigest.digest,
     );
     if (!matchingDigest) {
-      await this.dependencies.repository.markDispatchOutcome({
+      const completion = await this.dependencies.repository.markDispatchOutcome({
         commandId: input.commandId,
         attemptId,
         leaseOwner: input.leaseOwner,
         leaseVersion: claim.attempt.leaseVersion,
         outcome: "known_failure",
         now: this.dependencies.clock.now(),
       });
+      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
       return { status: "not_dispatched", code: "destination_mismatch", attemptId };
     }
 
     try {
       const providerResult = await this.dependencies.boundedExecutor.run(
         "communications_provider_dispatch",
         this.dependencies.providerTimeoutMs,
         () =>
           this.dependencies.provider.dispatch({
             commandId: input.commandId,
             attemptId,
             destination: resolved.endpoint,
             message: claim.message,
           }),
       );
       if (providerResult.status === "accepted") {
-        await this.dependencies.repository.markDispatchOutcome({
+        const completion = await this.dependencies.repository.markDispatchOutcome({
           commandId: input.commandId,
           attemptId,
           leaseOwner: input.leaseOwner,
           leaseVersion: claim.attempt.leaseVersion,
           outcome: "accepted",
           providerReference: providerResult.providerReference,
           now: this.dependencies.clock.now(),
         });
+        if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
         return { status: "accepted", attemptId };
       }
-      await this.dependencies.repository.markDispatchOutcome({
+      const completion = await this.dependencies.repository.markDispatchOutcome({
         commandId: input.commandId,
         attemptId,
         leaseOwner: input.leaseOwner,
         leaseVersion: claim.attempt.leaseVersion,
         outcome: "known_failure",
         now: this.dependencies.clock.now(),
       });
+      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
       return {
         status: "not_dispatched",
         code: providerResult.status === "unavailable" ? "provider_unavailable" : "provider_rejected",
         attemptId,
       };
     } catch {
-      await this.dependencies.repository.markDispatchOutcome({
+      const completion = await this.dependencies.repository.markDispatchOutcome({
         commandId: input.commandId,
         attemptId,
         leaseOwner: input.leaseOwner,
         leaseVersion: claim.attempt.leaseVersion,
         outcome: "unknown",
         now: this.dependencies.clock.now(),
       });
+      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
       return { status: "dispatch_unknown", code: "provider_outcome_ambiguous", attemptId };
     }
   }
 
   async processInbound(input: {
     eventId: string;
     leaseOwner: string;
     leaseExpiresAt: Date;
     requiredPolicyVersion: number;
     action: "public_knowledge" | "handoff";
@@ -347,106 +364,151 @@ export class CommunicationsService {
       eventId: input.eventId,
       leaseOwner: input.leaseOwner,
       leaseExpiresAt: input.leaseExpiresAt,
       requiredPolicyVersion: input.requiredPolicyVersion,
       now: this.dependencies.clock.now(),
     });
     if (claim.status === "not_claimed") {
       return { status: "conflict", code: claim.code };
     }
     if (claim.policyState === "opt_out_pending" || claim.policyState === "withdrawn") {
-      await this.completeInbound(claim, input, "applied");
+      if (!(await this.completeInbound(claim, input, "applied"))) {
+        return this.inboundCompletionConflict(input.eventId);
+      }
       return { status: "opt_out_pending", eventId: input.eventId };
     }
     if (input.action === "handoff") {
       const idempotencyKey = input.idempotencyKey ?? "";
       try {
         const result = await this.dependencies.boundedExecutor.run(
           "communications_handoff",
           this.dependencies.handoffTimeoutMs,
           () =>
             this.dependencies.handoff.request({
               conversationId: claim.envelope.conversation.id,
               idempotencyKey,
             }),
         );
         if (result.status !== "queued") {
-          await this.completeInbound(claim, input, "manual_review");
+          if (!(await this.completeInbound(claim, input, "manual_review"))) {
+            return this.inboundCompletionConflict(input.eventId);
+          }
           return { status: "manual", code: "handoff_unavailable" };
         }
         if (
           !validHandoffReceipt(result.receipt, {
             conversationId: claim.envelope.conversation.id,
             idempotencyKey,
             now: this.dependencies.clock.now(),
           })
         ) {
-          await this.completeInbound(claim, input, "manual_review");
+          if (!(await this.completeInbound(claim, input, "manual_review"))) {
+            return this.inboundCompletionConflict(input.eventId);
+          }
           return { status: "manual", code: "handoff_receipt_missing" };
         }
-        await this.completeInbound(claim, input, "applied");
+        if (!(await this.completeInbound(claim, input, "applied"))) {
+          return this.inboundCompletionConflict(input.eventId);
+        }
         return { status: "handoff_queued", receiptId: result.receipt!.receiptId };
       } catch {
-        await this.completeInbound(claim, input, "manual_review");
+        if (!(await this.completeInbound(claim, input, "manual_review"))) {
+          return this.inboundCompletionConflict(input.eventId);
+        }
         return { status: "manual", code: "handoff_unavailable" };
       }
     }
 
     try {
       const answer = await this.dependencies.boundedExecutor.run(
         "communications_public_knowledge",
         this.dependencies.knowledgeTimeoutMs,
         () =>
           this.dependencies.publicKnowledge.answer({
             prompt: input.prompt ?? "",
             locale: claim.envelope.event.locale,
           }),
       );
       if (answer.status !== "available") {
-        await this.completeInbound(claim, input, "manual_review");
+        if (!(await this.completeInbound(claim, input, "manual_review"))) {
+          return this.inboundCompletionConflict(input.eventId);
+        }
         return { status: "manual", code: "knowledge_unavailable" };
       }
       if (!answer.sourceReceipt) {
-        await this.completeInbound(claim, input, "manual_review");
+        if (!(await this.completeInbound(claim, input, "manual_review"))) {
+          return this.inboundCompletionConflict(input.eventId);
+        }
         return { status: "manual", code: "knowledge_receipt_missing" };
       }
       const decision = this.dependencies.contentPolicy.evaluate({ text: answer.text });
       if (!decision.allowed) {
-        await this.completeInbound(claim, input, "manual_review");
+        if (!(await this.completeInbound(claim, input, "manual_review"))) {
+          return this.inboundCompletionConflict(input.eventId);
+        }
         return { status: "manual", code: "prohibited_content" };
       }
-      await this.completeInbound(claim, input, "applied");
+      if (!(await this.completeInbound(claim, input, "applied"))) {
+        return this.inboundCompletionConflict(input.eventId);
+      }
       return {
         status: "answered",
         text: answer.text,
         sourceReceipt: answer.sourceReceipt,
       };
     } catch {
-      await this.completeInbound(claim, input, "manual_review");
+      if (!(await this.completeInbound(claim, input, "manual_review"))) {
+        return this.inboundCompletionConflict(input.eventId);
+      }
       return { status: "manual", code: "knowledge_unavailable" };
     }
   }
 
   private async completeInbound(
     claim: Extract<Awaited<ReturnType<CommunicationsRepository["claimInbound"]>>, { status: "claimed" }>,
     input: { eventId: string; leaseOwner: string },
     outcome: "applied" | "manual_review" | "dead_letter",
-  ): Promise<void> {
-    await this.dependencies.repository.completeInbound({
+  ): Promise<boolean> {
+    return (await this.dependencies.repository.completeInbound({
       eventId: input.eventId,
       leaseOwner: input.leaseOwner,
       leaseVersion: claim.leaseVersion,
       outcome,
       now: this.dependencies.clock.now(),
+    })) === "completed";
+  }
+
+  async reconcileOutbound(
+    input: Omit<ReconcileOutboundCommand, "now">,
+  ): Promise<ReconcileOutboundResult> {
+    return this.dependencies.repository.reconcileOutbound({
+      ...input,
+      now: this.dependencies.clock.now(),
     });
   }
 
+  private inboundCompletionConflict(eventId: string): Record<string, unknown> {
+    return { status: "recovery_required", code: "inbound_completion_conflict", eventId };
+  }
+
+  private dispatchCompletionConflict(
+    commandId: string,
+    attemptId: string,
+  ): Record<string, unknown> {
+    return {
+      status: "recovery_required",
+      code: "dispatch_completion_conflict",
+      commandId,
+      attemptId,
+    };
+  }
+
   private async resolveDestination(bindingId: string): Promise<EndpointResolution> {
     try {
       const destination = await this.dependencies.destinationResolver.resolve({ bindingId });
       if (destination.status !== "resolved" || !destination.endpoint) {
         return { status: "unavailable", code: "destination_unavailable" };
       }
       return this.digestEndpoint(destination.endpoint);
     } catch {
       return { status: "unavailable", code: "destination_unavailable" };
     }
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
index ec88b5f..7fd6212 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
@@ -17,20 +17,55 @@ function runtimeApi(): RuntimeApi {
 }
 
 function deferred() {
   let resolve!: () => void;
   const promise = new Promise<void>((done) => {
     resolve = done;
   });
   return { promise, resolve };
 }
 
+function validWithdrawalEvidence(issuedAt = NOW) {
+  return {
+    source: "authority",
+    receipt: {
+      receiptId: "receipt_withdrawal_1",
+      owner: "consent",
+      operation: "contact_withdrawal",
+      bindingId: "binding_1",
+      issuedAt,
+      expiresAt: TOMORROW,
+      correlationId: "withdrawal_correlation_1",
+    },
+  };
+}
+
+function reconciliationReceipt(input: {
+  commandId: string;
+  attemptId: string;
+  outcome: "reconciled_accepted" | "confirmed_not_sent" | "terminal_failure";
+  source?: "provider_lookup" | "manual_authority";
+}) {
+  return {
+    receiptId: `receipt_reconcile_${input.outcome}`,
+    owner: "communications",
+    operation: "dispatch_reconciliation",
+    source: input.source ?? "provider_lookup",
+    commandId: input.commandId,
+    attemptId: input.attemptId,
+    outcome: input.outcome,
+    issuedAt: NOW,
+    expiresAt: TOMORROW,
+    correlationId: "correlation_out_1",
+  };
+}
+
 function repositoryOptions(overrides: Record<string, unknown> = {}) {
   return {
     bindings: [
       {
         bindingId: "binding_1",
         channel: "whatsapp",
         trustState: "reverified",
         freshUntil: TOMORROW,
         createdAt: NOW,
         updatedAt: NOW,
@@ -161,34 +196,81 @@ describe("atomic opt-out and dispatch fencing", () => {
     let providerCalls = 0;
     const service = createService(repository, {
       dispatch: async () => {
         providerCalls += 1;
         return { status: "accepted", providerReference: "provider_ref_1" };
       },
     });
     const queued = await queueOutbound(service);
     expect(queued).toMatchObject({ status: "created" });
 
-    const withdrawal = repository.withdrawContact({ bindingId: "binding_1", now: NOW });
+    const withdrawal = repository.withdrawContact({
+      bindingId: "binding_1",
+      evidence: validWithdrawalEvidence(),
+      now: NOW,
+    });
     await withdrawalEntered.promise;
     const dispatch = service.dispatchOutbound({
       commandId: queued.commandId,
       leaseOwner: "worker_1",
       leaseExpiresAt: LATER,
     });
     releaseWithdrawal.resolve();
 
     await expect(withdrawal).resolves.toMatchObject({ status: "changed", state: "withdrawn" });
     await expect(dispatch).resolves.toEqual({ status: "not_dispatched", code: "contact_policy_denied" });
     expect(providerCalls).toBe(0);
     expect(repository.referenceState().outbound[0]).toMatchObject({ state: "cancelled" });
   });
+
+  it("uses the same lock so a dispatch claim that wins before withdrawal may complete", async () => {
+    const claimEntered = deferred();
+    const releaseClaim = deferred();
+    const providerEntered = deferred();
+    const releaseProvider = deferred();
+    const repository = createRepository({
+      lockBoundary: async ({ operation }: { operation: string }) => {
+        if (operation === "claim_outbound") {
+          claimEntered.resolve();
+          await releaseClaim.promise;
+        }
+      },
+    });
+    const service = createService(repository, {
+      dispatch: async () => {
+        providerEntered.resolve();
+        await releaseProvider.promise;
+        return { status: "accepted", providerReference: "provider_ref_1" };
+      },
+    });
+    const queued = await queueOutbound(service);
+    const dispatch = service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    await claimEntered.promise;
+    const withdrawal = repository.withdrawContact({
+      bindingId: "binding_1",
+      evidence: validWithdrawalEvidence(),
+      now: NOW,
+    });
+    releaseClaim.resolve();
+    await providerEntered.promise;
+    await expect(withdrawal).resolves.toMatchObject({ status: "changed", state: "withdrawn" });
+    releaseProvider.resolve();
+
+    await expect(dispatch).resolves.toMatchObject({ status: "accepted" });
+    expect(repository.referenceState().attempts[0]).toMatchObject({
+      state: "provider_accepted",
+    });
+  });
 });
 
 describe("durable leases, attempts and recovery", () => {
   it("persists the dispatch attempt before provider I/O and gates completion by owner/version", async () => {
     const repository = createRepository();
     let durableAttemptObserved = false;
     const service = createService(repository, {
       dispatch: async ({ attemptId }: { attemptId: string }) => {
         durableAttemptObserved = repository
           .referenceState()
@@ -320,20 +402,256 @@ describe("durable leases, attempts and recovery", () => {
       await repository.completeInbound({
         eventId: "event_1",
         leaseOwner: "worker_2",
         leaseVersion: 1,
         outcome: "applied",
         now: LATER,
       }),
     ).toBe("conflict");
     expect(repository.referenceState().inbound[0]).toMatchObject({ state: "persisted" });
   });
+
+  it("rejects expired or non-finite lease completion for the owning worker", async () => {
+    const repository = createRepository();
+    await repository.acceptInbound({
+      connectionId: "connection_1",
+      providerEventId: "provider_event_expiry",
+      providerBodyDigest: "body_digest_expiry",
+      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
+      envelope: {
+        event: {
+          eventId: "event_expiry",
+          channel: "whatsapp",
+          locale: "en",
+          connectionState: "active",
+          bindingId: "binding_1",
+          conversationId: "conversation_1",
+          messageId: "message_expiry",
+          receivedAt: NOW,
+          state: "persisted",
+          correlationId: "correlation_expiry",
+        },
+        conversation: {
+          id: "conversation_1",
+          channel: "whatsapp",
+          locale: "en",
+          status: "new",
+          participantIds: ["participant_1"],
+          version: 1,
+          createdAt: NOW,
+          updatedAt: NOW,
+          lastActivityAt: NOW,
+        },
+        participant: {
+          participantId: "participant_1",
+          conversationId: "conversation_1",
+          bindingId: "binding_1",
+          role: "external_contact",
+          createdAt: NOW,
+        },
+        message: {
+          id: "message_expiry",
+          conversationId: "conversation_1",
+          channel: "whatsapp",
+          direction: "inbound",
+          senderParticipantId: "participant_1",
+          locale: "en",
+          kind: "text",
+          body: "Synthetic body",
+          createdAt: NOW,
+        },
+      },
+      optOutSignal: "none",
+    });
+    const inboundClaim = await repository.claimInbound({
+      eventId: "event_expiry",
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+      now: NOW,
+      requiredPolicyVersion: 7,
+    });
+    expect(inboundClaim).toMatchObject({ status: "claimed", leaseVersion: 1 });
+    expect(
+      await repository.completeInbound({
+        eventId: "event_expiry",
+        leaseOwner: "worker_1",
+        leaseVersion: 1,
+        outcome: "applied",
+        now: TOMORROW,
+      }),
+    ).toBe("conflict");
+    expect(
+      await repository.completeInbound({
+        eventId: "event_expiry",
+        leaseOwner: "worker_1",
+        leaseVersion: 1,
+        outcome: "applied",
+        now: new Date("invalid"),
+      }),
+    ).toBe("conflict");
+
+    const service = createService(repository, {
+      dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
+    });
+    const queued = await queueOutbound(service);
+    const outboundClaim = await repository.claimOutbound({
+      commandId: queued.commandId,
+      attemptId: "attempt_expiry",
+      leaseOwner: "worker_2",
+      leaseExpiresAt: LATER,
+      now: NOW,
+    });
+    expect(outboundClaim).toMatchObject({ status: "claimed", attempt: { leaseVersion: 1 } });
+    expect(
+      await repository.markDispatchOutcome({
+        commandId: queued.commandId,
+        attemptId: "attempt_expiry",
+        leaseOwner: "worker_2",
+        leaseVersion: 1,
+        outcome: "accepted",
+        now: TOMORROW,
+      }),
+    ).toBe("conflict");
+  });
+
+  it("returns recovery instead of success when inbound or outbound completion loses its lease", async () => {
+    let inboundNow = NOW;
+    const inboundRepository = createRepository();
+    const { CommunicationsService } = runtimeApi();
+    const baseDependencies = {
+      repository: inboundRepository,
+      clock: { now: () => inboundNow },
+      ids: { next: (kind: string) => `${kind}_recovery` },
+      endpointDigestKeys: {
+        resolve: async () => ({
+          status: "available",
+          active: { purpose: "communications_endpoint_digest", version: "v1", key: "key" },
+          prior: [],
+        }),
+      },
+      keyedDigest: { digest: async () => "endpoint_digest_v1" },
+      destinationResolver: {
+        resolve: async () => ({ status: "resolved", endpoint: "raw:endpoint:synthetic" }),
+      },
+      boundedExecutor: {
+        run: async (_operation: string, _timeout: number, action: () => Promise<unknown>) => action(),
+      },
+      provider: { dispatch: async () => ({ status: "accepted" }) },
+      publicKnowledge: {
+        answer: async () => {
+          inboundNow = TOMORROW;
+          return { status: "available", text: "Synthetic answer", sourceReceipt: "receipt_1" };
+        },
+      },
+      contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
+      handoff: { request: async () => ({ status: "unavailable" }) },
+      providerTimeoutMs: 2_000,
+      knowledgeTimeoutMs: 500,
+      handoffTimeoutMs: 500,
+    };
+    const expiringInboundService = new CommunicationsService(baseDependencies);
+    await expiringInboundService.acceptInbound({
+      connectionId: "connection_recovery",
+      providerEventId: "provider_event_recovery",
+      providerBodyDigest: "body_recovery",
+      endpoint: "raw:endpoint:synthetic",
+      envelope: {
+        event: {
+          eventId: "event_recovery",
+          channel: "whatsapp",
+          locale: "en",
+          connectionState: "active",
+          bindingId: "binding_1",
+          conversationId: "conversation_1",
+          messageId: "message_recovery",
+          receivedAt: NOW,
+          state: "persisted",
+          correlationId: "correlation_recovery",
+        },
+        conversation: {
+          id: "conversation_1",
+          channel: "whatsapp",
+          locale: "en",
+          status: "new",
+          participantIds: ["participant_1"],
+          version: 1,
+          createdAt: NOW,
+          updatedAt: NOW,
+          lastActivityAt: NOW,
+        },
+        participant: {
+          participantId: "participant_1",
+          conversationId: "conversation_1",
+          bindingId: "binding_1",
+          role: "external_contact",
+          createdAt: NOW,
+        },
+        message: {
+          id: "message_recovery",
+          conversationId: "conversation_1",
+          channel: "whatsapp",
+          direction: "inbound",
+          senderParticipantId: "participant_1",
+          locale: "en",
+          kind: "text",
+          body: "Synthetic body",
+          createdAt: NOW,
+        },
+      },
+      optOutSignal: "none",
+    });
+    expect(
+      await expiringInboundService.processInbound({
+        eventId: "event_recovery",
+        leaseOwner: "worker_recovery",
+        leaseExpiresAt: LATER,
+        requiredPolicyVersion: 7,
+        action: "public_knowledge",
+        prompt: "Synthetic question",
+      }),
+    ).toEqual({
+      status: "recovery_required",
+      code: "inbound_completion_conflict",
+      eventId: "event_recovery",
+    });
+
+    let outboundNow = NOW;
+    const outboundRepository = createRepository();
+    const expiringOutboundService = new CommunicationsService({
+      ...baseDependencies,
+      repository: outboundRepository,
+      clock: { now: () => outboundNow },
+      ids: (() => {
+        let id = 0;
+        return { next: (kind: string) => `${kind}_${++id}` };
+      })(),
+      provider: {
+        dispatch: async () => {
+          outboundNow = TOMORROW;
+          return { status: "accepted" };
+        },
+      },
+    });
+    const queued = await queueOutbound(expiringOutboundService);
+    expect(
+      await expiringOutboundService.dispatchOutbound({
+        commandId: queued.commandId,
+        leaseOwner: "worker_recovery",
+        leaseExpiresAt: LATER,
+      }),
+    ).toEqual({
+      status: "recovery_required",
+      code: "dispatch_completion_conflict",
+      commandId: queued.commandId,
+      attemptId: "dispatch_attempt_3",
+    });
+  });
 });
 
 describe("monotonic exactly-once provider statuses", () => {
   it("ignores duplicate and delayed regressive statuses without moving backward", async () => {
     const repository = createRepository();
     const service = createService(repository, {
       dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
     });
     const queued = await queueOutbound(service);
     await service.dispatchOutbound({
@@ -369,11 +687,274 @@ describe("monotonic exactly-once provider statuses", () => {
     expect(
       await repository.applyProviderStatus({
         commandId: queued.commandId,
         providerEventId: "status_event_3",
         status: "read",
         occurredAt: TOMORROW,
       }),
     ).toMatchObject({ status: "applied", commandState: "read" });
     expect(repository.referenceState().providerStatuses).toHaveLength(3);
   });
+
+  it("closes the active attempt when provider status arrives before dispatch completion", async () => {
+    const providerEntered = deferred();
+    const releaseProvider = deferred();
+    const repository = createRepository();
+    const service = createService(repository, {
+      dispatch: async () => {
+        providerEntered.resolve();
+        await releaseProvider.promise;
+        return { status: "accepted", providerReference: "provider_ref_1" };
+      },
+    });
+    const queued = await queueOutbound(service);
+    const dispatch = service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    await providerEntered.promise;
+
+    expect(
+      await repository.applyProviderStatus({
+        commandId: queued.commandId,
+        providerEventId: "early_status_1",
+        status: "sent",
+        occurredAt: NOW,
+      }),
+    ).toMatchObject({ status: "applied", commandState: "sent" });
+    expect(repository.referenceState().attempts[0]).toMatchObject({
+      state: "sent",
+      completedAt: NOW,
+    });
+    releaseProvider.resolve();
+
+    await expect(dispatch).resolves.toMatchObject({ status: "accepted" });
+    expect(repository.referenceState().attempts).toEqual([
+      expect.objectContaining({ state: "sent", completedAt: NOW }),
+    ]);
+  });
+});
+
+describe("controlled inbound opt-out and reconciliation races", () => {
+  it("serializes inbound opt-out acceptance before processing a prior event", async () => {
+    let acceptCount = 0;
+    const optOutEntered = deferred();
+    const releaseOptOut = deferred();
+    const repository = createRepository({
+      lockBoundary: async ({ operation }: { operation: string }) => {
+        if (operation === "accept_inbound" && ++acceptCount === 2) {
+          optOutEntered.resolve();
+          await releaseOptOut.promise;
+        }
+      },
+    });
+    const service = createService(repository, {
+      dispatch: async () => ({ status: "accepted" }),
+    });
+    await repository.acceptInbound({
+      connectionId: "connection_1",
+      providerEventId: "provider_event_prior",
+      providerBodyDigest: "body_prior",
+      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
+      envelope: {
+        event: {
+          eventId: "event_prior",
+          channel: "whatsapp",
+          locale: "en",
+          connectionState: "active",
+          bindingId: "binding_1",
+          conversationId: "conversation_1",
+          messageId: "message_prior",
+          receivedAt: NOW,
+          state: "persisted",
+          correlationId: "correlation_prior",
+        },
+        conversation: {
+          id: "conversation_1",
+          channel: "whatsapp",
+          locale: "en",
+          status: "new",
+          participantIds: ["participant_1"],
+          version: 1,
+          createdAt: NOW,
+          updatedAt: NOW,
+          lastActivityAt: NOW,
+        },
+        participant: {
+          participantId: "participant_1",
+          conversationId: "conversation_1",
+          bindingId: "binding_1",
+          role: "external_contact",
+          createdAt: NOW,
+        },
+        message: {
+          id: "message_prior",
+          conversationId: "conversation_1",
+          channel: "whatsapp",
+          direction: "inbound",
+          senderParticipantId: "participant_1",
+          locale: "en",
+          kind: "text",
+          body: "Synthetic body",
+          createdAt: NOW,
+        },
+      },
+      optOutSignal: "none",
+    });
+    const optOutEnvelope = repository.referenceState().inbound[0].envelope as any;
+    const acceptOptOut = repository.acceptInbound({
+      connectionId: "connection_1",
+      providerEventId: "provider_event_opt_out",
+      providerBodyDigest: "body_opt_out",
+      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
+      envelope: {
+        ...optOutEnvelope,
+        event: {
+          ...optOutEnvelope.event,
+          eventId: "event_opt_out",
+          messageId: "message_opt_out",
+          correlationId: "correlation_opt_out",
+        },
+        message: { ...optOutEnvelope.message, id: "message_opt_out", body: null },
+      },
+      optOutSignal: "pending",
+    });
+    await optOutEntered.promise;
+    const processPrior = service.processInbound({
+      eventId: "event_prior",
+      leaseOwner: "worker_prior",
+      leaseExpiresAt: LATER,
+      requiredPolicyVersion: 7,
+      action: "public_knowledge",
+      prompt: "Synthetic question",
+    });
+    releaseOptOut.resolve();
+
+    await expect(acceptOptOut).resolves.toMatchObject({ status: "accepted" });
+    await expect(processPrior).resolves.toEqual({
+      status: "conflict",
+      code: "policy_version_mismatch",
+    });
+  });
+
+  it("reconciles unknown and expired dispatches from typed evidence without resending", async () => {
+    const repository = createRepository();
+    const service = createService(repository, {
+      dispatch: async () => {
+        throw new Error("ambiguous");
+      },
+    });
+    const queued = await queueOutbound(service);
+    const unknown = await service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    expect(repository.reconcileOutbound).toBeTypeOf("function");
+
+    expect(
+      await repository.reconcileOutbound({
+        commandId: queued.commandId,
+        attemptId: unknown.attemptId,
+        now: NOW,
+      }),
+    ).toEqual({ status: "denied", code: "reconciliation_receipt_missing" });
+    expect(
+      await service.reconcileOutbound({
+        commandId: queued.commandId,
+        attemptId: unknown.attemptId,
+        receipt: reconciliationReceipt({
+          commandId: queued.commandId,
+          attemptId: unknown.attemptId,
+          outcome: "reconciled_accepted",
+        }),
+      }),
+    ).toMatchObject({ status: "reconciled", commandState: "reconciled_accepted" });
+    expect(
+      await service.dispatchOutbound({
+        commandId: queued.commandId,
+        leaseOwner: "worker_2",
+        leaseExpiresAt: TOMORROW,
+      }),
+    ).toEqual({ status: "not_dispatched", code: "already_completed" });
+
+    const expiredRepository = createRepository();
+    const expiredService = createService(expiredRepository, {
+      dispatch: async () => ({ status: "accepted" }),
+    });
+    const expiredQueued = await queueOutbound(expiredService);
+    const expiredClaim = await expiredRepository.claimOutbound({
+      commandId: expiredQueued.commandId,
+      attemptId: "attempt_expired_reconcile",
+      leaseOwner: "worker_expired",
+      leaseExpiresAt: LATER,
+      now: NOW,
+    });
+    expect(expiredClaim).toMatchObject({ status: "claimed" });
+    expect(
+      await expiredRepository.reconcileOutbound({
+        commandId: expiredQueued.commandId,
+        attemptId: "attempt_expired_reconcile",
+        receipt: {
+          ...reconciliationReceipt({
+            commandId: expiredQueued.commandId,
+            attemptId: "attempt_expired_reconcile",
+            outcome: "confirmed_not_sent",
+            source: "manual_authority",
+          }),
+          issuedAt: TOMORROW,
+          expiresAt: new Date("2026-08-22T12:00:00.000Z"),
+        },
+        now: TOMORROW,
+      }),
+    ).toMatchObject({ status: "reconciled", commandState: "confirmed_not_sent" });
+  });
+
+  it("serializes competing reconciliation receipts to one converged result", async () => {
+    const reconcileEntered = deferred();
+    const releaseReconcile = deferred();
+    const repository = createRepository({
+      lockBoundary: async ({ operation }: { operation: string }) => {
+        if (operation === "reconcile_outbound") {
+          reconcileEntered.resolve();
+          await releaseReconcile.promise;
+        }
+      },
+    });
+    const service = createService(repository, {
+      dispatch: async () => {
+        throw new Error("ambiguous");
+      },
+    });
+    expect(repository.reconcileOutbound).toBeTypeOf("function");
+    const queued = await queueOutbound(service);
+    const unknown = await service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    const receipt = reconciliationReceipt({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      outcome: "terminal_failure",
+      source: "manual_authority",
+    });
+    const first = repository.reconcileOutbound({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      receipt,
+      now: NOW,
+    });
+    await reconcileEntered.promise;
+    const second = repository.reconcileOutbound({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      receipt,
+      now: NOW,
+    });
+    releaseReconcile.resolve();
+
+    await expect(first).resolves.toMatchObject({ status: "reconciled", commandState: "failed" });
+    await expect(second).resolves.toMatchObject({ status: "duplicate", commandState: "failed" });
+  });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
index d009473..14a8859 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
@@ -86,22 +86,58 @@ function validBindingReceipt() {
     expiresAt: TOMORROW,
   };
 }
 
 function validTemplateReceipt(templateId = "template_1") {
   return {
     receiptId: "receipt_template_1",
     owner: "communications",
     operation: "template_internal_approval",
     resourceId: templateId,
+    locale: "en",
+    definitionVersion: 1,
+    issuedAt: NOW,
+    expiresAt: TOMORROW,
+  };
+}
+
+function validProviderTemplateReceipt(
+  providerVersion: number,
+  providerState: "provider_approved" | "provider_rejected" | "paused" | "disabled",
+) {
+  return {
+    receiptId: `receipt_template_provider_${providerVersion}`,
+    owner: "communications",
+    operation: "template_provider_reconciliation",
+    templateId: "template_1",
+    locale: "en",
+    definitionVersion: 1,
+    providerVersion,
+    providerState,
     issuedAt: NOW,
     expiresAt: TOMORROW,
+    correlationId: `template_correlation_${providerVersion}`,
+  };
+}
+
+function validWithdrawalReceipt(issuedAt = NOW) {
+  return {
+    source: "authority",
+    receipt: {
+      receiptId: "receipt_withdrawal_1",
+      owner: "consent",
+      operation: "contact_withdrawal",
+      bindingId: "binding_1",
+      issuedAt,
+      expiresAt: TOMORROW,
+      correlationId: "withdrawal_correlation_1",
+    },
   };
 }
 
 function createRepository(overrides: Record<string, unknown> = {}) {
   const { MemoryCommunicationsRepository } = runtimeApi();
   return new MemoryCommunicationsRepository({
     bindings: [
       {
         bindingId: "binding_1",
         channel: "whatsapp",
@@ -404,21 +440,25 @@ describe("receipt-gated consent, binding and template behavior", () => {
     ).toEqual({ status: "denied", code: "authority_receipt_missing" });
     expect(
       await repository.grantConsentFromReceipt({
         bindingId: "binding_1",
         purpose: "transactional",
         operation: "consent_grant",
         receipt: validConsentReceipt(),
         now: NOW,
       }),
     ).toMatchObject({ status: "changed", state: "granted", version: 1 });
-    await repository.withdrawContact({ bindingId: "binding_1", now: LATER });
+    await repository.withdrawContact({
+      bindingId: "binding_1",
+      evidence: validWithdrawalReceipt(LATER),
+      now: LATER,
+    });
     expect(
       await repository.grantConsentFromReceipt({
         bindingId: "binding_1",
         purpose: "transactional",
         operation: "consent_grant",
         receipt: validConsentReceipt(),
         now: LATER,
       }),
     ).toEqual({ status: "denied", code: "reconsent_receipt_required" });
     expect(
@@ -471,55 +511,67 @@ describe("receipt-gated consent, binding and template behavior", () => {
 
     expect(
       await templates.registerInternalDefinition({
         templateId: "template_1",
         locale: "en",
         definitionVersion: 1,
         synthetic: true,
       }),
     ).toMatchObject({ status: "registered", internallyApproved: false });
     expect(
-      await templates.recordInternalApproval({ templateId: "template_1" }),
+      await templates.recordInternalApproval({
+        templateId: "template_1",
+        locale: "en",
+        definitionVersion: 1,
+      }),
     ).toEqual({ status: "denied", code: "approval_receipt_missing" });
     expect(
       await templates.applyProviderProjection({
         templateId: "template_1",
         locale: "en",
         providerState: "provider_approved",
         providerVersion: 2,
+        correlationId: "template_correlation_2",
+        receipt: validProviderTemplateReceipt(2, "provider_approved"),
         now: NOW,
       }),
     ).toMatchObject({ status: "applied", internallyApproved: false });
     expect(
       await templates.evaluateEligibility({ templateId: "template_1", locale: "en" }),
     ).toEqual({ eligible: false, code: "internal_approval_required" });
     expect(
       await templates.recordInternalApproval({
         templateId: "template_1",
+        locale: "en",
+        definitionVersion: 1,
         receipt: validTemplateReceipt(),
       }),
     ).toMatchObject({ status: "approved", internallyApproved: true });
     expect(
       await templates.applyProviderProjection({
         templateId: "template_1",
         locale: "en",
         providerState: "paused",
         providerVersion: 3,
+        correlationId: "template_correlation_3",
+        receipt: validProviderTemplateReceipt(3, "paused"),
         now: LATER,
       }),
     ).toMatchObject({ status: "applied", providerState: "paused", providerVersion: 3 });
     expect(
       await templates.applyProviderProjection({
         templateId: "template_1",
         locale: "en",
         providerState: "provider_approved",
         providerVersion: 2,
+        correlationId: "template_correlation_2",
+        receipt: validProviderTemplateReceipt(2, "provider_approved"),
         now: LATER,
       }),
     ).toMatchObject({ status: "regressive", providerState: "paused", providerVersion: 3 });
   });
 
   it("keeps runtime template registration closed when policy/copy gates are unresolved", async () => {
     const { CanonicalMessageTemplateService } = runtimeApi();
     const templates = new CanonicalMessageTemplateService({
       repository: createRepository({ templates: [] }),
       clock: { now: () => NOW },
@@ -527,20 +579,150 @@ describe("receipt-gated consent, binding and template behavior", () => {
 
     await expect(
       templates.registerInternalDefinition({
         templateId: "runtime_template",
         locale: "en",
         definitionVersion: 1,
         synthetic: false,
       }),
     ).resolves.toEqual({ status: "unavailable", code: "runtime_registration_disabled" });
   });
+
+  it("binds internal approval and provider projection receipts to the exact template revision", async () => {
+    const { CanonicalMessageTemplateService } = runtimeApi();
+    const repository = createRepository({ templates: [] });
+    const templates = new CanonicalMessageTemplateService({
+      repository,
+      clock: { now: () => NOW },
+      allowSyntheticDefinitions: true,
+    });
+    await templates.registerInternalDefinition({
+      templateId: "template_1",
+      locale: "en",
+      definitionVersion: 1,
+      synthetic: true,
+    });
+
+    expect(
+      await templates.recordInternalApproval({
+        templateId: "template_1",
+        locale: "en",
+        definitionVersion: 1,
+        receipt: { ...validTemplateReceipt(), locale: "es" },
+      }),
+    ).toEqual({ status: "denied", code: "approval_receipt_invalid" });
+    expect(
+      await templates.applyProviderProjection({
+        templateId: "template_1",
+        locale: "en",
+        providerState: "provider_approved",
+        providerVersion: 2,
+        correlationId: "template_correlation_2",
+        now: NOW,
+      }),
+    ).toEqual({ status: "denied", code: "provider_receipt_missing" });
+    expect(
+      await templates.applyProviderProjection({
+        templateId: "template_1",
+        locale: "en",
+        providerState: "provider_approved",
+        providerVersion: 2,
+        correlationId: "wrong_correlation",
+        receipt: validProviderTemplateReceipt(2, "provider_approved"),
+        now: NOW,
+      }),
+    ).toEqual({ status: "denied", code: "provider_receipt_invalid" });
+  });
+
+  it("rejects withdrawal without owning evidence and preserves that evidence in history", async () => {
+    const repository = createRepository();
+
+    expect(await repository.withdrawContact({ bindingId: "binding_1", now: NOW })).toEqual({
+      status: "denied",
+      code: "withdrawal_evidence_missing",
+    });
+    expect(
+      await repository.withdrawContact({
+        bindingId: "binding_1",
+        evidence: validWithdrawalReceipt(),
+        now: NOW,
+      }),
+    ).toMatchObject({ status: "changed", state: "withdrawn" });
+    expect(repository.referenceState().withdrawalHistory).toEqual([
+      expect.objectContaining({
+        bindingId: "binding_1",
+        source: "authority",
+        receiptId: "receipt_withdrawal_1",
+        correlationId: "withdrawal_correlation_1",
+      }),
+    ]);
+  });
+
+  it("binds inbound withdrawal evidence to the referenced event correlation", async () => {
+    const fixture = createService();
+    await acceptInbound(fixture.service);
+    const receipt = {
+      receiptId: "receipt_inbound_withdrawal_1",
+      owner: "communications",
+      operation: "inbound_opt_out",
+      bindingId: "binding_1",
+      eventId: "event_1",
+      issuedAt: NOW,
+      expiresAt: TOMORROW,
+      correlationId: "wrong_correlation",
+    };
+
+    expect(
+      await fixture.repository.withdrawContact({
+        bindingId: "binding_1",
+        evidence: { source: "inbound_event", receipt },
+        now: NOW,
+      }),
+    ).toEqual({ status: "denied", code: "withdrawal_evidence_invalid" });
+    expect(
+      await fixture.repository.withdrawContact({
+        bindingId: "binding_1",
+        evidence: {
+          source: "inbound_event",
+          receipt: { ...receipt, correlationId: "correlation_1" },
+        },
+        now: NOW,
+      }),
+    ).toMatchObject({ status: "changed", state: "withdrawn" });
+  });
+
+  it("keeps consent withdrawn after ambiguous opt-out review until separate re-consent", async () => {
+    const repository = createRepository();
+    await repository.withdrawContact({
+      bindingId: "binding_1",
+      evidence: validWithdrawalReceipt(),
+      now: NOW,
+    });
+
+    expect(
+      await repository.resolveAmbiguousOptOutFromReceipt({
+        bindingId: "binding_1",
+        receipt: {
+          receiptId: "receipt_opt_out_review_1",
+          owner: "consent",
+          operation: "ambiguous_opt_out_resolution",
+          bindingId: "binding_1",
+          issuedAt: NOW,
+          expiresAt: TOMORROW,
+        },
+        now: NOW,
+      }),
+    ).toEqual({ status: "unchanged", state: "withdrawn", version: 2 });
+    expect(repository.referenceState().policies[0]).toMatchObject({
+      state: "normal_after_review",
+    });
+  });
 });
 
 describe("endpoint digest isolation and fail-closed dependencies", () => {
   it("uses active and bounded prior endpoint keys with communications-only domain separation", async () => {
     const fixture = createService();
 
     const result = await acceptInbound(fixture.service);
 
     expect(result).toMatchObject({
       status: "accepted",
@@ -593,14 +775,23 @@ describe("endpoint digest isolation and fail-closed dependencies", () => {
   });
 
   it("fails closed when destination resolution is disabled", async () => {
     const fixture = createService({
       destinationResolver: { resolve: async () => ({ status: "unavailable" }) },
     });
 
     expect(await queueOutbound(fixture.service)).toEqual({
       status: "unavailable",
       code: "destination_unavailable",
+      commandId: "outbound_command_1",
     });
-    expect(fixture.repository.referenceState().outbound).toEqual([]);
+    expect(fixture.repository.referenceState().outbound).toEqual([
+      expect.objectContaining({
+        commandId: "outbound_command_1",
+        state: "failed",
+        failureCode: "destination_unavailable",
+        fingerprint: undefined,
+        endpointDigests: undefined,
+      }),
+    ]);
   });
 });
```
