# Task 4 fix round 2

## Commits
0bad313 fix(communications): close task 4 review gaps round 2

## Stat
 .../domain/src/communications/memory-repository.ts | 121 +++++++++++++++++----
 .../domain/src/communications/repository.ts        |  44 +++++++-
 .../packages/domain/src/communications/service.ts  |  45 +++++++-
 .../tests/m004/communications-concurrency.test.ts  | 120 ++++++++++++++++++--
 .../tests/m004/communications-service.test.ts      |  83 +++++++++++---
 5 files changed, 365 insertions(+), 48 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 8a47973..bec9ba0 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -84,20 +84,25 @@ type AttemptRecord = OutboundDispatchAttempt & {
 type ReconciledCommandState = Extract<
   ReconcileOutboundResult,
   { commandState: unknown }
 >["commandState"];
 
 type StoredReconciliationResult = {
   status: "reconciled";
   commandState: ReconciledCommandState;
 };
 
+type StoredReconciliationReceipt = {
+  identity: string;
+  result: StoredReconciliationResult;
+};
+
 type LockOperation =
   | "accept_inbound"
   | "claim_inbound"
   | "claim_outbound"
   | "complete_outbound"
   | "apply_provider_status"
   | "reconcile_outbound"
   | "withdraw_contact"
   | "grant_consent"
   | "resolve_opt_out"
@@ -143,21 +148,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
   >();
   private readonly consents = new Map<string, ConsentRecord>();
   private readonly consentHistory: ConsentRecord[] = [];
   private readonly connections = new Map<
     string,
     { channel: ChannelKind; state: ChannelConnectionState }
   >();
   private readonly templates = new Map<string, TemplateRecord>();
   private readonly providerStatuses = new Map<string, ApplyProviderStatusCommand>();
   private readonly withdrawalHistory: WithdrawalHistoryRecord[] = [];
-  private readonly reconciliationReceipts = new Map<string, StoredReconciliationResult>();
+  private readonly reconciliationReceipts = new Map<string, StoredReconciliationReceipt>();
   private readonly bindingLockTails = new Map<string, Promise<void>>();
   private readonly lockBoundary?: MemoryCommunicationsRepositoryOptions["lockBoundary"];
 
   constructor(options: MemoryCommunicationsRepositoryOptions = {}) {
     this.lockBoundary = options.lockBoundary;
     for (const binding of options.bindings ?? []) {
       this.bindings.set(binding.bindingId, clone(binding));
     }
     for (const policy of options.policies ?? []) {
       this.policies.set(policy.bindingId, clone(policy));
@@ -265,27 +270,31 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     }
     record.state = input.outcome;
     record.leaseOwner = undefined;
     record.leaseExpiresAt = undefined;
     return "completed";
   }
 
   async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
     const existing = this.outboundByIdempotency.get(input.command.idempotencyKey);
     if (existing) {
-      return this.sameOutboundDraft(existing, input)
-        ? {
-            status: "duplicate",
-            commandId: existing.command.commandId,
-            messageId: existing.message.id,
-          }
-        : { status: "conflict", code: "idempotency_mismatch" };
+      if (!this.sameOutboundDraft(existing, input)) {
+        return { status: "conflict", code: "idempotency_mismatch" };
+      }
+      const reason = this.outboundDuplicateReason(existing);
+      return {
+        status: "duplicate",
+        commandId: existing.command.commandId,
+        messageId: existing.message.id,
+        commandState: existing.state,
+        ...(reason ? { reason } : {}),
+      };
     }
     const record: OutboundRecord = {
       ...clone(input),
       state: "draft",
       leaseVersion: 0,
     };
     record.command.state = "draft";
     this.outboundById.set(record.command.commandId, record);
     this.outboundByIdempotency.set(record.command.idempotencyKey, record);
     return {
@@ -573,44 +582,41 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         state: "withdrawn",
         policyVersion: policy.version,
         fence: policy.fence,
         cancelledCommandIds,
       };
     });
   }
 
   async resolveAmbiguousOptOutFromReceipt(
     input: ResolveOptOutCommand,
-  ): Promise<ConsentChangeResult> {
+  ): Promise<import("./repository.ts").AmbiguousOptOutResolutionResult> {
     return this.withBindingLock(input.bindingId, "resolve_opt_out", async () => {
       const authority = evaluateAuthorityChange({
         operation: "ambiguous_opt_out_resolution",
         bindingId: input.bindingId,
         receipt: input.receipt,
         now: input.now,
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
-      const currentConsent = [...this.consents.values()]
-        .filter((consent) => consent.bindingId === input.bindingId)
-        .sort((left, right) => right.version - left.version)[0];
       return {
-        status: "unchanged",
-        state: currentConsent?.state ?? "not_requested",
-        version: currentConsent?.version ?? 0,
+        status: "changed",
+        policyState: "normal_after_review",
+        policyVersion: policy.version,
       };
     });
   }
 
   async suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult> {
     return this.withBindingLock(input.bindingId, "suspend_binding", async () => {
       const binding = this.bindings.get(input.bindingId);
       if (!binding) return { status: "denied", code: "binding_not_found" };
       if (binding.trustState === "suspended") {
         return { status: "duplicate", trustState: "suspended" };
@@ -726,33 +732,67 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     template.providerState = input.providerState;
     template.providerVersion = input.providerVersion;
     template.providerReceiptId = input.receipt.receiptId;
     template.providerCorrelationId = input.receipt.correlationId;
     template.updatedAt = input.now;
     return { status: "applied", ...clone(template) };
   }
 
   async reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult> {
     const found = this.outboundById.get(input.commandId);
-    if (!found) return { status: "not_found" };
+    const foundAttempt = this.attempts.get(input.attemptId);
+    if (!found || !foundAttempt) return { status: "not_found" };
+    if (foundAttempt.commandId !== input.commandId) {
+      return { status: "conflict", code: "reconciliation_binding_mismatch" };
+    }
     return this.withBindingLock(found.command.bindingId, "reconcile_outbound", async () => {
-      if (!input.receipt) {
-        return { status: "denied", code: "reconciliation_receipt_missing" };
-      }
-      const prior = this.reconciliationReceipts.get(input.receipt.receiptId);
-      if (prior) return { status: "duplicate", commandState: prior.commandState };
       const record = this.outboundById.get(input.commandId);
       const attempt = this.attempts.get(input.attemptId);
       if (!record || !attempt) return { status: "not_found" };
-      if (!this.validReconciliationReceipt(input, input.receipt, record.command.correlationId)) {
+      if (
+        attempt.commandId !== input.commandId ||
+        record.command.bindingId !== found.command.bindingId
+      ) {
+        return { status: "conflict", code: "reconciliation_binding_mismatch" };
+      }
+      if (!input.receipt) {
+        return { status: "denied", code: "reconciliation_receipt_missing" };
+      }
+      if (
+        !this.validReconciliationReceipt(
+          input,
+          input.receipt,
+          record.command.bindingId,
+          record.command.correlationId,
+        )
+      ) {
         return { status: "denied", code: "reconciliation_receipt_invalid" };
       }
+      const identity = this.reconciliationReceiptIdentity(input.receipt);
+      const prior = this.reconciliationReceipts.get(input.receipt.receiptId);
+      if (prior) {
+        if (prior.identity !== identity) {
+          return { status: "conflict", code: "reconciliation_receipt_mismatch" };
+        }
+        return { status: "duplicate", commandState: prior.result.commandState };
+      }
+      if (
+        record.state === "reconciled_accepted" ||
+        record.state === "confirmed_not_sent" ||
+        record.state === "failed"
+      ) {
+        return {
+          status: "conflict",
+          code: "reconciliation_already_settled",
+          commandState: record.state,
+        };
+      }
       const expiredDispatch =
         record.state === "dispatching" &&
         record.leaseExpiresAt !== undefined &&
         Number.isFinite(input.now.getTime()) &&
         input.now >= record.leaseExpiresAt;
       if (
         record.state !== "dispatch_unknown" &&
         record.state !== "reconciliation_required" &&
         !expiredDispatch
       ) {
@@ -764,21 +804,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
           : input.receipt.outcome === "confirmed_not_sent"
             ? "confirmed_not_sent"
             : "failed";
       record.state = commandState;
       record.command.state = commandState;
       record.leaseOwner = undefined;
       record.leaseExpiresAt = undefined;
       attempt.state = commandState;
       attempt.completedAt = input.now;
       const result: StoredReconciliationResult = { status: "reconciled", commandState };
-      this.reconciliationReceipts.set(input.receipt.receiptId, result);
+      this.reconciliationReceipts.set(input.receipt.receiptId, { identity, result });
       return result;
     });
   }
 
   async evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult> {
     const template = this.templates.get(this.templateKey(input.templateId, input.locale));
     if (!template) return { eligible: false, code: "template_not_found" };
     if (!template.internallyApproved) {
@@ -961,34 +1001,69 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         eventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
         correlationId: receipt.correlationId,
         changedAt: input.now,
       },
     };
   }
 
   private validReconciliationReceipt(
     input: ReconcileOutboundCommand,
     receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
+    bindingId: string,
     correlationId: string,
   ): boolean {
     return (
       receipt.owner === "communications" &&
       receipt.operation === "dispatch_reconciliation" &&
       (receipt.source === "provider_lookup" || receipt.source === "manual_authority") &&
+      receipt.bindingId === bindingId &&
       receipt.commandId === input.commandId &&
       receipt.attemptId === input.attemptId &&
       receipt.correlationId === correlationId &&
       Boolean(receipt.receiptId) &&
       currentReceipt(receipt, input.now)
     );
   }
 
+  private reconciliationReceiptIdentity(
+    receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
+  ): string {
+    return JSON.stringify([
+      receipt.receiptId,
+      receipt.owner,
+      receipt.operation,
+      receipt.source,
+      receipt.bindingId,
+      receipt.commandId,
+      receipt.attemptId,
+      receipt.outcome,
+      receipt.issuedAt.toISOString(),
+      receipt.expiresAt.toISOString(),
+      receipt.correlationId,
+    ]);
+  }
+
+  private outboundDuplicateReason(
+    record: OutboundRecord,
+  ): Extract<CreateOutboundResult, { status: "duplicate" }>["reason"] {
+    if (record.state === "queued") return undefined;
+    if (record.state === "draft") return "outbound_draft_unresolved";
+    if (record.state === "dispatching") return "outbound_dispatch_in_progress";
+    if (record.state === "dispatch_unknown" || record.state === "reconciliation_required") {
+      return "outbound_reconciliation_required";
+    }
+    if (record.state === "failed") return record.failureCode ?? "outbound_command_failed";
+    if (record.state === "cancelled") return "outbound_command_cancelled";
+    if (record.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
+    return "outbound_command_completed";
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
index 64ffabf..d92732a 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -103,22 +103,39 @@ export type FinalizeOutboundCommand = {
 
 export type FailOutboundDraftCommand = {
   commandId: string;
   code:
     | "destination_unavailable"
     | "endpoint_digest_key_unavailable"
     | "endpoint_digest_key_invalid";
   now: Date;
 };
 
+export type OutboundDuplicateReason =
+  | FailOutboundDraftCommand["code"]
+  | "outbound_draft_unresolved"
+  | "outbound_dispatch_in_progress"
+  | "outbound_reconciliation_required"
+  | "outbound_command_failed"
+  | "outbound_command_cancelled"
+  | "outbound_confirmed_not_sent"
+  | "outbound_command_completed";
+
 export type CreateOutboundResult =
-  | { status: "created" | "duplicate"; commandId: string; messageId: string }
+  | { status: "created"; commandId: string; messageId: string }
+  | {
+      status: "duplicate";
+      commandId: string;
+      messageId: string;
+      commandState: OutboundCommandState;
+      reason?: OutboundDuplicateReason;
+    }
   | { status: "conflict"; code: "idempotency_mismatch" };
 
 export type ClaimOutboundCommand = {
   commandId: string;
   attemptId: string;
   leaseOwner: string;
   leaseExpiresAt: Date;
   now: Date;
 };
 
@@ -207,20 +224,31 @@ export type ConsentChangeResult =
     }
   | {
       status: "denied";
       code:
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "reconsent_receipt_required"
         | "policy_state_invalid";
     };
 
+export type AmbiguousOptOutResolutionResult =
+  | {
+      status: "changed";
+      policyState: "normal_after_review";
+      policyVersion: number;
+    }
+  | {
+      status: "denied";
+      code: "authority_receipt_missing" | "authority_receipt_invalid" | "policy_state_invalid";
+    };
+
 export type WithdrawContactCommand = {
   bindingId: string;
   evidence?: ContactWithdrawalEvidence;
   now: Date;
 };
 
 export type ContactWithdrawalEvidence =
   | {
       source: "inbound_event";
       receipt: {
@@ -414,20 +442,21 @@ export type RecoveryCandidate =
 export type DispatchReconciliationOutcome =
   | "reconciled_accepted"
   | "confirmed_not_sent"
   | "terminal_failure";
 
 export type DispatchReconciliationReceipt = {
   receiptId: string;
   owner: "communications";
   operation: "dispatch_reconciliation";
   source: "provider_lookup" | "manual_authority";
+  bindingId: string;
   commandId: string;
   attemptId: string;
   outcome: DispatchReconciliationOutcome;
   issuedAt: Date;
   expiresAt: Date;
   correlationId: string;
 };
 
 export type ReconcileOutboundCommand = {
   commandId: string;
@@ -441,37 +470,48 @@ export type ReconcileOutboundResult =
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
+  | {
+      status: "conflict";
+      code: "reconciliation_receipt_mismatch" | "reconciliation_binding_mismatch";
+    }
+  | {
+      status: "conflict";
+      code: "reconciliation_already_settled";
+      commandState: "reconciled_accepted" | "confirmed_not_sent" | "failed";
+    }
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
-  resolveAmbiguousOptOutFromReceipt(input: ResolveOptOutCommand): Promise<ConsentChangeResult>;
+  resolveAmbiguousOptOutFromReceipt(
+    input: ResolveOptOutCommand,
+  ): Promise<AmbiguousOptOutResolutionResult>;
   suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult>;
   revalidateBindingFromReceipt(input: RevalidateBindingCommand): Promise<BindingChangeResult>;
   reconcileTemplate(input: ReconcileTemplateCommand): Promise<TemplateReconciliationResult>;
   reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult>;
   findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]>;
   registerTemplateDefinition(input: RegisterTemplateDefinition & { now: Date }): Promise<TemplateResult>;
   approveTemplateDefinition(
     input: ApproveTemplateDefinition & { now: Date },
   ): Promise<TemplateResult>;
   evaluateTemplateEligibility(
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
index 160a3f7..f90cc32 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
@@ -223,21 +223,64 @@ export class CommunicationsService {
         direction: "outbound",
         senderParticipantId: "system",
         locale: input.locale,
         kind: "text",
         body: input.body,
         createdAt: now,
       },
       purpose: input.purpose,
       templateId: input.templateId,
     });
-    if (draft.status !== "created") return draft;
+    if (draft.status === "conflict") return draft;
+    if (draft.status === "duplicate") {
+      if (draft.commandState === "queued") {
+        return {
+          status: "duplicate",
+          commandId: draft.commandId,
+          messageId: draft.messageId,
+        };
+      }
+      if (draft.reason === "outbound_draft_unresolved") {
+        return {
+          status: "in_progress",
+          code: draft.reason,
+          commandId: draft.commandId,
+        };
+      }
+      if (draft.reason === "outbound_dispatch_in_progress") {
+        return {
+          status: "in_progress",
+          code: draft.reason,
+          commandId: draft.commandId,
+        };
+      }
+      if (draft.reason === "outbound_reconciliation_required") {
+        return {
+          status: "recovery_required",
+          code: draft.reason,
+          commandId: draft.commandId,
+        };
+      }
+      if (draft.reason === "outbound_command_completed") {
+        return {
+          status: "already_completed",
+          commandState: draft.commandState,
+          commandId: draft.commandId,
+          messageId: draft.messageId,
+        };
+      }
+      return {
+        status: "unavailable",
+        code: draft.reason ?? "outbound_command_failed",
+        commandId: draft.commandId,
+      };
+    }
     const resolved = await this.resolveDestination(input.bindingId);
     if (resolved.status === "unavailable") {
       await this.dependencies.repository.failOutboundDraft({
         commandId,
         code: resolved.code,
         now: this.dependencies.clock.now(),
       });
       return { status: "unavailable", code: resolved.code, commandId };
     }
     return this.dependencies.repository.finalizeOutbound({
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
index 7fd6212..9c6679f 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
@@ -37,32 +37,36 @@ function validWithdrawalEvidence(issuedAt = NOW) {
       correlationId: "withdrawal_correlation_1",
     },
   };
 }
 
 function reconciliationReceipt(input: {
   commandId: string;
   attemptId: string;
   outcome: "reconciled_accepted" | "confirmed_not_sent" | "terminal_failure";
   source?: "provider_lookup" | "manual_authority";
+  receiptId?: string;
+  bindingId?: string;
+  correlationId?: string;
 }) {
   return {
-    receiptId: `receipt_reconcile_${input.outcome}`,
+    receiptId: input.receiptId ?? `receipt_reconcile_${input.outcome}`,
     owner: "communications",
     operation: "dispatch_reconciliation",
     source: input.source ?? "provider_lookup",
+    bindingId: input.bindingId ?? "binding_1",
     commandId: input.commandId,
     attemptId: input.attemptId,
     outcome: input.outcome,
     issuedAt: NOW,
     expiresAt: TOMORROW,
-    correlationId: "correlation_out_1",
+    correlationId: input.correlationId ?? "correlation_out_1",
   };
 }
 
 function repositoryOptions(overrides: Record<string, unknown> = {}) {
   return {
     bindings: [
       {
         bindingId: "binding_1",
         channel: "whatsapp",
         trustState: "reverified",
@@ -903,21 +907,21 @@ describe("controlled inbound opt-out and reconciliation races", () => {
             source: "manual_authority",
           }),
           issuedAt: TOMORROW,
           expiresAt: new Date("2026-08-22T12:00:00.000Z"),
         },
         now: TOMORROW,
       }),
     ).toMatchObject({ status: "reconciled", commandState: "confirmed_not_sent" });
   });
 
-  it("serializes competing reconciliation receipts to one converged result", async () => {
+  it("serializes contradictory reconciliation receipts so exactly one settles", async () => {
     const reconcileEntered = deferred();
     const releaseReconcile = deferred();
     const repository = createRepository({
       lockBoundary: async ({ operation }: { operation: string }) => {
         if (operation === "reconcile_outbound") {
           reconcileEntered.resolve();
           await releaseReconcile.promise;
         }
       },
     });
@@ -926,35 +930,133 @@ describe("controlled inbound opt-out and reconciliation races", () => {
         throw new Error("ambiguous");
       },
     });
     expect(repository.reconcileOutbound).toBeTypeOf("function");
     const queued = await queueOutbound(service);
     const unknown = await service.dispatchOutbound({
       commandId: queued.commandId,
       leaseOwner: "worker_1",
       leaseExpiresAt: LATER,
     });
-    const receipt = reconciliationReceipt({
+    const acceptedReceipt = reconciliationReceipt({
       commandId: queued.commandId,
       attemptId: unknown.attemptId,
-      outcome: "terminal_failure",
+      outcome: "reconciled_accepted",
       source: "manual_authority",
     });
+    const notSentReceipt = reconciliationReceipt({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      outcome: "confirmed_not_sent",
+      source: "provider_lookup",
+    });
     const first = repository.reconcileOutbound({
       commandId: queued.commandId,
       attemptId: unknown.attemptId,
-      receipt,
+      receipt: acceptedReceipt,
       now: NOW,
     });
     await reconcileEntered.promise;
     const second = repository.reconcileOutbound({
       commandId: queued.commandId,
       attemptId: unknown.attemptId,
-      receipt,
+      receipt: notSentReceipt,
       now: NOW,
     });
     releaseReconcile.resolve();
 
-    await expect(first).resolves.toMatchObject({ status: "reconciled", commandState: "failed" });
-    await expect(second).resolves.toMatchObject({ status: "duplicate", commandState: "failed" });
+    await expect(first).resolves.toEqual({
+      status: "reconciled",
+      commandState: "reconciled_accepted",
+    });
+    await expect(second).resolves.toEqual({
+      status: "conflict",
+      code: "reconciliation_already_settled",
+      commandState: "reconciled_accepted",
+    });
+    expect(repository.referenceState().outbound[0]).toMatchObject({
+      state: "reconciled_accepted",
+    });
+    expect(repository.referenceState().attempts[0]).toMatchObject({
+      state: "reconciled_accepted",
+    });
+  });
+
+  it("replays an identical reconciliation receipt idempotently", async () => {
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
+    const receipt = reconciliationReceipt({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      outcome: "terminal_failure",
+      source: "manual_authority",
+    });
+
+    await expect(
+      repository.reconcileOutbound({
+        commandId: queued.commandId,
+        attemptId: unknown.attemptId,
+        receipt,
+        now: NOW,
+      }),
+    ).resolves.toEqual({ status: "reconciled", commandState: "failed" });
+    await expect(
+      repository.reconcileOutbound({
+        commandId: queued.commandId,
+        attemptId: unknown.attemptId,
+        receipt,
+        now: NOW,
+      }),
+    ).resolves.toEqual({ status: "duplicate", commandState: "failed" });
+  });
+
+  it("fails closed when a reconciliation receipt id is reused with a different identity", async () => {
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
+    const receipt = reconciliationReceipt({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      outcome: "reconciled_accepted",
+      receiptId: "receipt_reused",
+    });
+    await repository.reconcileOutbound({
+      commandId: queued.commandId,
+      attemptId: unknown.attemptId,
+      receipt,
+      now: NOW,
+    });
+    const settledState = repository.referenceState();
+
+    await expect(
+      repository.reconcileOutbound({
+        commandId: queued.commandId,
+        attemptId: unknown.attemptId,
+        receipt: { ...receipt, outcome: "confirmed_not_sent" },
+        now: NOW,
+      }),
+    ).resolves.toEqual({
+      status: "conflict",
+      code: "reconciliation_receipt_mismatch",
+    });
+    expect(repository.referenceState()).toEqual(settledState);
   });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
index 14a8859..91e943f 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
@@ -690,35 +690,43 @@ describe("receipt-gated consent, binding and template behavior", () => {
     ).toMatchObject({ status: "changed", state: "withdrawn" });
   });
 
   it("keeps consent withdrawn after ambiguous opt-out review until separate re-consent", async () => {
     const repository = createRepository();
     await repository.withdrawContact({
       bindingId: "binding_1",
       evidence: validWithdrawalReceipt(),
       now: NOW,
     });
+    const consentHistoryBeforeReview = repository.referenceState().consentHistory;
 
-    expect(
-      await repository.resolveAmbiguousOptOutFromReceipt({
+    const result = await repository.resolveAmbiguousOptOutFromReceipt({
+      bindingId: "binding_1",
+      receipt: {
+        receiptId: "receipt_opt_out_review_1",
+        owner: "consent",
+        operation: "ambiguous_opt_out_resolution",
         bindingId: "binding_1",
-        receipt: {
-          receiptId: "receipt_opt_out_review_1",
-          owner: "consent",
-          operation: "ambiguous_opt_out_resolution",
-          bindingId: "binding_1",
-          issuedAt: NOW,
-          expiresAt: TOMORROW,
-        },
-        now: NOW,
-      }),
-    ).toEqual({ status: "unchanged", state: "withdrawn", version: 2 });
+        issuedAt: NOW,
+        expiresAt: TOMORROW,
+      },
+      now: NOW,
+    });
+
+    expect(result).toEqual({
+      status: "changed",
+      policyState: "normal_after_review",
+      policyVersion: 9,
+    });
+    expect(result).not.toHaveProperty("state");
+    expect(result).not.toHaveProperty("version");
+    expect(repository.referenceState().consentHistory).toEqual(consentHistoryBeforeReview);
     expect(repository.referenceState().policies[0]).toMatchObject({
       state: "normal_after_review",
     });
   });
 });
 
 describe("endpoint digest isolation and fail-closed dependencies", () => {
   it("uses active and bounded prior endpoint keys with communications-only domain separation", async () => {
     const fixture = createService();
 
@@ -786,12 +794,61 @@ describe("endpoint digest isolation and fail-closed dependencies", () => {
     });
     expect(fixture.repository.referenceState().outbound).toEqual([
       expect.objectContaining({
         commandId: "outbound_command_1",
         state: "failed",
         failureCode: "destination_unavailable",
         fingerprint: undefined,
         endpointDigests: undefined,
       }),
     ]);
+    expect(await queueOutbound(fixture.service)).toEqual({
+      status: "unavailable",
+      code: "destination_unavailable",
+      commandId: "outbound_command_1",
+    });
+  });
+
+  it("reports an unresolved duplicate draft without re-running destination resolution", async () => {
+    let resolverCalls = 0;
+    let enterResolver!: () => void;
+    let releaseResolver!: () => void;
+    const resolverEntered = new Promise<void>((resolve) => {
+      enterResolver = resolve;
+    });
+    const resolverReleased = new Promise<void>((resolve) => {
+      releaseResolver = resolve;
+    });
+    const fixture = createService({
+      destinationResolver: {
+        resolve: async () => {
+          resolverCalls += 1;
+          enterResolver();
+          await resolverReleased;
+          return { status: "resolved", endpoint: "raw:endpoint:synthetic" };
+        },
+      },
+    });
+
+    const first = queueOutbound(fixture.service);
+    await resolverEntered;
+    await expect(queueOutbound(fixture.service)).resolves.toEqual({
+      status: "in_progress",
+      code: "outbound_draft_unresolved",
+      commandId: "outbound_command_1",
+    });
+    expect(resolverCalls).toBe(1);
+    releaseResolver();
+    await expect(first).resolves.toMatchObject({ status: "created", commandId: "outbound_command_1" });
+  });
+
+  it("accepts a duplicate only when the stored outbound command is queued", async () => {
+    const fixture = createService();
+    const first = await queueOutbound(fixture.service);
+
+    await expect(queueOutbound(fixture.service)).resolves.toEqual({
+      status: "duplicate",
+      commandId: first.commandId,
+      messageId: first.messageId,
+    });
   });
 });
```
