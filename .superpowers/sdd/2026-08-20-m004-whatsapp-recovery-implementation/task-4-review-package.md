# Review package Task 4

## Commits
5aac723 feat(domain): add canonical communications repository

## Stat
 .../packages/domain/src/communications/index.ts    |   4 +
 .../domain/src/communications/memory-repository.ts | 756 +++++++++++++++++++++
 .../domain/src/communications/repository.ts        | 384 +++++++++++
 .../packages/domain/src/communications/service.ts  | 535 +++++++++++++++
 .../tests/m004/communications-concurrency.test.ts  | 379 +++++++++++
 .../tests/m004/communications-service.test.ts      | 606 +++++++++++++++++
 6 files changed, 2664 insertions(+)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
index f0870c2..2fd9408 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
@@ -1,2 +1,6 @@
 export * from "./contracts.ts";
 export * from "./state-machines.ts";
+export * from "./channel-policy.ts";
+export * from "./repository.ts";
+export * from "./memory-repository.ts";
+export * from "./service.ts";
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
new file mode 100644
index 0000000..8467264
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -0,0 +1,756 @@
+import { evaluateAuthorityChange, evaluateOutboundPolicy } from "./channel-policy.ts";
+import type {
+  AcceptInboundCommand,
+  AcceptInboundResult,
+  ApplyProviderStatusCommand,
+  BindingChangeResult,
+  ClaimInboundCommand,
+  ClaimOutboundCommand,
+  CommunicationsReferenceState,
+  CommunicationsRepository,
+  CommunicationsSeed,
+  CompleteInboundCommand,
+  ConsentChangeResult,
+  ConsentRecord,
+  CreateOutboundCommand,
+  CreateOutboundResult,
+  EvaluateTemplateEligibility,
+  GrantConsentCommand,
+  InboundClaimResult,
+  MarkDispatchOutcomeCommand,
+  OutboundClaimResult,
+  ProviderStatusResult,
+  RecoveryCandidate,
+  RecoveryQuery,
+  ReconcileTemplateCommand,
+  RegisterTemplateDefinition,
+  ApproveTemplateDefinition,
+  ResolveOptOutCommand,
+  RevalidateBindingCommand,
+  SuspendBindingCommand,
+  TemplateEligibilityResult,
+  TemplateRecord,
+  TemplateReconciliationResult,
+  TemplateResult,
+  WithdrawContactCommand,
+  WithdrawContactResult,
+} from "./repository.ts";
+import type {
+  ChannelConnectionState,
+  ChannelContactPolicy,
+  ChannelKind,
+  ContactChannelBinding,
+  OutboundCommandState,
+  OutboundDispatchAttempt,
+} from "./contracts.ts";
+
+type InboundRecord = {
+  replayKey: string;
+  providerBodyDigest: string;
+  endpointDigests: AcceptInboundCommand["endpointDigests"];
+  envelope: AcceptInboundCommand["envelope"];
+  state: "persisted" | "applied" | "manual_review" | "dead_letter";
+  leaseOwner?: string;
+  leaseVersion: number;
+  leaseExpiresAt?: Date;
+};
+
+type OutboundRecord = CreateOutboundCommand & {
+  state: OutboundCommandState;
+  leaseOwner?: string;
+  leaseVersion: number;
+  leaseExpiresAt?: Date;
+  blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
+};
+
+type AttemptRecord = OutboundDispatchAttempt & {
+  leaseOwner: string;
+  leaseVersion: number;
+  providerReference?: string;
+};
+
+type LockOperation =
+  | "accept_inbound"
+  | "claim_outbound"
+  | "withdraw_contact"
+  | "grant_consent"
+  | "resolve_opt_out"
+  | "suspend_binding"
+  | "revalidate_binding";
+
+export type MemoryCommunicationsRepositoryOptions = CommunicationsSeed & {
+  lockBoundary?: (input: { bindingId: string; operation: LockOperation }) => Promise<void>;
+};
+
+const DELIVERY_RANK: Readonly<Record<"sent" | "delivered" | "read", number>> = {
+  sent: 1,
+  delivered: 2,
+  read: 3,
+};
+
+function clone<T>(value: T): T {
+  return structuredClone(value);
+}
+
+function currentReceipt(input: {
+  issuedAt: Date;
+  expiresAt: Date;
+}, now: Date): boolean {
+  return (
+    Number.isFinite(input.issuedAt.getTime()) &&
+    Number.isFinite(input.expiresAt.getTime()) &&
+    input.issuedAt <= now &&
+    input.expiresAt > now
+  );
+}
+
+export class MemoryCommunicationsRepository implements CommunicationsRepository {
+  private readonly inboundByReplay = new Map<string, InboundRecord>();
+  private readonly inboundById = new Map<string, InboundRecord>();
+  private readonly outboundById = new Map<string, OutboundRecord>();
+  private readonly outboundByIdempotency = new Map<string, OutboundRecord>();
+  private readonly attempts = new Map<string, AttemptRecord>();
+  private readonly policies = new Map<string, ChannelContactPolicy & { fence: number }>();
+  private readonly bindings = new Map<
+    string,
+    ContactChannelBinding & { freshUntil: Date }
+  >();
+  private readonly consents = new Map<string, ConsentRecord>();
+  private readonly consentHistory: ConsentRecord[] = [];
+  private readonly connections = new Map<
+    string,
+    { channel: ChannelKind; state: ChannelConnectionState }
+  >();
+  private readonly templates = new Map<string, TemplateRecord>();
+  private readonly providerStatuses = new Map<string, ApplyProviderStatusCommand>();
+  private readonly bindingLockTails = new Map<string, Promise<void>>();
+  private readonly lockBoundary?: MemoryCommunicationsRepositoryOptions["lockBoundary"];
+
+  constructor(options: MemoryCommunicationsRepositoryOptions = {}) {
+    this.lockBoundary = options.lockBoundary;
+    for (const binding of options.bindings ?? []) {
+      this.bindings.set(binding.bindingId, clone(binding));
+    }
+    for (const policy of options.policies ?? []) {
+      this.policies.set(policy.bindingId, clone(policy));
+    }
+    for (const consent of options.consents ?? []) {
+      this.consents.set(this.consentKey(consent.bindingId, consent.purpose), clone(consent));
+    }
+    for (const connection of options.connections ?? []) {
+      this.connections.set(connection.channel, clone(connection));
+    }
+    for (const template of options.templates ?? []) {
+      this.templates.set(this.templateKey(template.templateId, template.locale), clone(template));
+    }
+  }
+
+  async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
+    return this.withBindingLock(input.envelope.event.bindingId, "accept_inbound", async () => {
+      const replayKey = `${input.connectionId}\u0000${input.providerEventId}`;
+      const existing = this.inboundByReplay.get(replayKey);
+      if (existing) {
+        if (existing.providerBodyDigest !== input.providerBodyDigest) {
+          return { status: "replay_mismatch", code: "provider_replay_mismatch" };
+        }
+        const activeDigest = existing.endpointDigests[0];
+        if (!activeDigest) {
+          return { status: "replay_mismatch", code: "provider_replay_mismatch" };
+        }
+        return {
+          status: "duplicate",
+          eventId: existing.envelope.event.eventId,
+          endpointDigestVersion: activeDigest.version,
+          endpointDigest: activeDigest.digest,
+        };
+      }
+
+      const activeDigest = input.endpointDigests[0];
+      if (!activeDigest || this.inboundById.has(input.envelope.event.eventId)) {
+        return { status: "replay_mismatch", code: "provider_replay_mismatch" };
+      }
+      if (input.optOutSignal === "pending") {
+        const policy = this.requirePolicy(input.envelope.event.bindingId, input.envelope.event.receivedAt);
+        if (policy.state !== "opt_out_pending" && policy.state !== "withdrawn") {
+          policy.state = "opt_out_pending";
+          policy.version += 1;
+          policy.fence += 1;
+          policy.updatedAt = input.envelope.event.receivedAt;
+        }
+      }
+      const record: InboundRecord = {
+        replayKey,
+        providerBodyDigest: input.providerBodyDigest,
+        endpointDigests: clone(input.endpointDigests),
+        envelope: clone(input.envelope),
+        state: "persisted",
+        leaseVersion: 0,
+      };
+      this.inboundByReplay.set(replayKey, record);
+      this.inboundById.set(input.envelope.event.eventId, record);
+      return {
+        status: "accepted",
+        eventId: input.envelope.event.eventId,
+        endpointDigestVersion: activeDigest.version,
+        endpointDigest: activeDigest.digest,
+      };
+    });
+  }
+
+  async claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult> {
+    const record = this.inboundById.get(input.eventId);
+    if (!record) return { status: "not_claimed", code: "not_found" };
+    if (record.state !== "persisted") {
+      return { status: "not_claimed", code: "already_completed" };
+    }
+    const policy = this.policies.get(record.envelope.event.bindingId);
+    if (!policy || policy.version !== input.requiredPolicyVersion) {
+      return { status: "not_claimed", code: "policy_version_mismatch" };
+    }
+    if (record.leaseOwner && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
+      return { status: "not_claimed", code: "lease_conflict" };
+    }
+    record.leaseOwner = input.leaseOwner;
+    record.leaseVersion += 1;
+    record.leaseExpiresAt = input.leaseExpiresAt;
+    return {
+      status: "claimed",
+      eventId: input.eventId,
+      leaseVersion: record.leaseVersion,
+      envelope: clone(record.envelope),
+      policyState: policy.state,
+    };
+  }
+
+  async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
+    const record = this.inboundById.get(input.eventId);
+    if (
+      !record ||
+      record.state !== "persisted" ||
+      record.leaseOwner !== input.leaseOwner ||
+      record.leaseVersion !== input.leaseVersion
+    ) {
+      return "conflict";
+    }
+    record.state = input.outcome;
+    record.leaseOwner = undefined;
+    record.leaseExpiresAt = undefined;
+    return "completed";
+  }
+
+  async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
+    const existing = this.outboundByIdempotency.get(input.command.idempotencyKey);
+    if (existing) {
+      return existing.fingerprint === input.fingerprint
+        ? {
+            status: "duplicate",
+            commandId: existing.command.commandId,
+            messageId: existing.message.id,
+          }
+        : { status: "conflict", code: "idempotency_mismatch" };
+    }
+    const record: OutboundRecord = {
+      ...clone(input),
+      state: "queued",
+      leaseVersion: 0,
+    };
+    record.command.state = "queued";
+    this.outboundById.set(record.command.commandId, record);
+    this.outboundByIdempotency.set(record.command.idempotencyKey, record);
+    return {
+      status: "created",
+      commandId: record.command.commandId,
+      messageId: record.message.id,
+    };
+  }
+
+  async claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult> {
+    const found = this.outboundById.get(input.commandId);
+    if (!found) return { status: "not_claimed", code: "not_found" };
+    return this.withBindingLock(found.command.bindingId, "claim_outbound", async () => {
+      const record = this.outboundById.get(input.commandId);
+      if (!record) return { status: "not_claimed", code: "not_found" };
+      if (record.state === "dispatch_unknown" || record.state === "reconciliation_required") {
+        return { status: "not_claimed", code: "dispatch_unknown_non_retryable" };
+      }
+      if (record.state === "cancelled" && record.blockedCode) {
+        return { status: "not_claimed", code: record.blockedCode };
+      }
+      if (record.state === "dispatching") {
+        return { status: "not_claimed", code: "lease_conflict" };
+      }
+      if (record.state !== "queued") {
+        return { status: "not_claimed", code: "already_completed" };
+      }
+      const binding = this.bindings.get(record.command.bindingId);
+      if (!binding) return { status: "not_claimed", code: "binding_not_found" };
+      const policy = this.policies.get(record.command.bindingId);
+      if (!policy) return { status: "not_claimed", code: "policy_not_found" };
+      const consent = this.consents.get(this.consentKey(record.command.bindingId, record.purpose));
+      if (!consent) return { status: "not_claimed", code: "consent_not_found" };
+      const connection = this.connections.get(record.command.channel);
+      const template = this.templates.get(this.templateKey(record.templateId, record.command.locale));
+      const activeDigest = record.endpointDigests[0];
+      if (!activeDigest) return { status: "not_claimed", code: "destination_mismatch" };
+      const decision = evaluateOutboundPolicy({
+        purpose: record.purpose,
+        binding: {
+          bindingId: binding.bindingId,
+          trustState: binding.trustState,
+          freshUntil: binding.freshUntil,
+        },
+        contactPolicy: {
+          state: policy.state,
+          version: policy.version,
+          fence: policy.fence,
+        },
+        requiredPolicyVersion: record.requiredPolicyVersion,
+        requiredFence: record.requiredFence,
+        consent: { state: consent.state, receipt: consent.receipt },
+        connectionState: connection?.state ?? "disabled",
+        template: {
+          eligible: Boolean(
+            template?.internallyApproved && template.providerState === "provider_approved",
+          ),
+        },
+        authorizationReceipt: record.authorizationReceipt,
+        destinationKey: activeDigest.digest,
+        now: input.now,
+      });
+      if (!decision.allowed) return { status: "not_claimed", code: decision.code };
+
+      record.state = "dispatching";
+      record.command.state = "dispatching";
+      record.leaseOwner = input.leaseOwner;
+      record.leaseVersion += 1;
+      record.leaseExpiresAt = input.leaseExpiresAt;
+      const attempt: AttemptRecord = {
+        attemptId: input.attemptId,
+        commandId: input.commandId,
+        ordinal: [...this.attempts.values()].filter(
+          (candidate) => candidate.commandId === input.commandId,
+        ).length + 1,
+        state: "dispatching",
+        startedAt: input.now,
+        correlationId: record.command.correlationId,
+        leaseOwner: input.leaseOwner,
+        leaseVersion: record.leaseVersion,
+      };
+      this.attempts.set(input.attemptId, attempt);
+      return {
+        status: "claimed",
+        command: clone(record.command),
+        message: clone(record.message),
+        attempt: clone(attempt),
+        destinationDigest: clone(activeDigest),
+      };
+    });
+  }
+
+  async markDispatchOutcome(
+    input: MarkDispatchOutcomeCommand,
+  ): Promise<"completed" | "conflict"> {
+    const record = this.outboundById.get(input.commandId);
+    const attempt = this.attempts.get(input.attemptId);
+    if (
+      !record ||
+      !attempt ||
+      record.state !== "dispatching" ||
+      attempt.state !== "dispatching" ||
+      record.leaseOwner !== input.leaseOwner ||
+      record.leaseVersion !== input.leaseVersion ||
+      attempt.leaseOwner !== input.leaseOwner ||
+      attempt.leaseVersion !== input.leaseVersion
+    ) {
+      return "conflict";
+    }
+    const state: OutboundCommandState =
+      input.outcome === "accepted"
+        ? "provider_accepted"
+        : input.outcome === "unknown"
+          ? "dispatch_unknown"
+          : "failed";
+    record.state = state;
+    record.command.state = state;
+    record.leaseOwner = undefined;
+    record.leaseExpiresAt = undefined;
+    attempt.state = state;
+    attempt.completedAt = input.now;
+    attempt.providerReference = input.providerReference;
+    return "completed";
+  }
+
+  async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
+    const record = this.outboundById.get(input.commandId);
+    if (!record) return { status: "not_found" };
+    const eventKey = `${input.commandId}\u0000${input.providerEventId}`;
+    if (this.providerStatuses.has(eventKey)) {
+      return { status: "duplicate", commandState: record.state };
+    }
+    this.providerStatuses.set(eventKey, clone(input));
+    if (input.status === "failed") {
+      if (["provider_accepted", "dispatching", "queued"].includes(record.state)) {
+        record.state = "failed";
+        record.command.state = "failed";
+        return { status: "applied", commandState: "failed" };
+      }
+      return { status: "regressive", commandState: record.state };
+    }
+    const currentRank =
+      record.state === "sent" || record.state === "delivered" || record.state === "read"
+        ? DELIVERY_RANK[record.state]
+        : 0;
+    if (DELIVERY_RANK[input.status] <= currentRank) {
+      return { status: "regressive", commandState: record.state };
+    }
+    if (["failed", "expired", "cancelled", "manual_review"].includes(record.state)) {
+      return { status: "regressive", commandState: record.state };
+    }
+    record.state = input.status;
+    record.command.state = input.status;
+    return { status: "applied", commandState: input.status };
+  }
+
+  async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
+    return this.withBindingLock(input.bindingId, "grant_consent", async () => {
+      const authority = evaluateAuthorityChange({
+        operation: input.operation,
+        bindingId: input.bindingId,
+        receipt: input.receipt,
+        now: input.now,
+      });
+      if (!authority.allowed) return { status: "denied", code: authority.code };
+      const key = this.consentKey(input.bindingId, input.purpose);
+      const current = this.consents.get(key);
+      if (current?.state === "withdrawn" && input.operation !== "reconsent") {
+        return { status: "denied", code: "reconsent_receipt_required" };
+      }
+      if (current?.state === "granted" && current.authorityReceiptId === input.receipt?.receiptId) {
+        return { status: "duplicate", state: "granted", version: current.version };
+      }
+      const next: ConsentRecord = {
+        bindingId: input.bindingId,
+        purpose: input.purpose,
+        state: "granted",
+        version: (current?.version ?? 0) + 1,
+        receipt: {
+          receiptId: input.receipt!.receiptId,
+          owner: "consent",
+          operation: "consent_confirmation",
+          bindingId: input.bindingId,
+          issuedAt: input.receipt!.issuedAt,
+          expiresAt: input.receipt!.expiresAt,
+        },
+        authorityReceiptId: input.receipt!.receiptId,
+        changedAt: input.now,
+      };
+      this.consents.set(key, next);
+      this.consentHistory.push(clone(next));
+      return { status: "changed", state: "granted", version: next.version };
+    });
+  }
+
+  async withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult> {
+    return this.withBindingLock(input.bindingId, "withdraw_contact", async () => {
+      const policy = this.requirePolicy(input.bindingId, input.now);
+      if (policy.state === "withdrawn") {
+        return {
+          status: "duplicate",
+          state: "withdrawn",
+          policyVersion: policy.version,
+          fence: policy.fence,
+          cancelledCommandIds: [],
+        };
+      }
+      policy.state = "withdrawn";
+      policy.version += 1;
+      policy.fence += 1;
+      policy.updatedAt = input.now;
+      for (const [key, consent] of this.consents) {
+        if (consent.bindingId !== input.bindingId || consent.state !== "granted") continue;
+        const withdrawn: ConsentRecord = {
+          ...clone(consent),
+          state: "withdrawn",
+          version: consent.version + 1,
+          receipt: undefined,
+          authorityReceiptId: undefined,
+          changedAt: input.now,
+        };
+        this.consents.set(key, withdrawn);
+        this.consentHistory.push(clone(withdrawn));
+      }
+      const cancelledCommandIds: string[] = [];
+      for (const outbound of this.outboundById.values()) {
+        if (outbound.command.bindingId !== input.bindingId || outbound.state !== "queued") continue;
+        outbound.state = "cancelled";
+        outbound.command.state = "cancelled";
+        outbound.blockedCode = "contact_policy_denied";
+        cancelledCommandIds.push(outbound.command.commandId);
+      }
+      return {
+        status: "changed",
+        state: "withdrawn",
+        policyVersion: policy.version,
+        fence: policy.fence,
+        cancelledCommandIds,
+      };
+    });
+  }
+
+  async resolveAmbiguousOptOutFromReceipt(
+    input: ResolveOptOutCommand,
+  ): Promise<ConsentChangeResult> {
+    return this.withBindingLock(input.bindingId, "resolve_opt_out", async () => {
+      const authority = evaluateAuthorityChange({
+        operation: "ambiguous_opt_out_resolution",
+        bindingId: input.bindingId,
+        receipt: input.receipt,
+        now: input.now,
+      });
+      if (!authority.allowed) return { status: "denied", code: authority.code };
+      const policy = this.requirePolicy(input.bindingId, input.now);
+      if (policy.state !== "opt_out_pending" && policy.state !== "withdrawn") {
+        return { status: "denied", code: "policy_state_invalid" };
+      }
+      policy.state = "normal_after_review";
+      policy.version += 1;
+      policy.fence += 1;
+      policy.updatedAt = input.now;
+      return { status: "changed", state: "granted", version: policy.version };
+    });
+  }
+
+  async suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult> {
+    return this.withBindingLock(input.bindingId, "suspend_binding", async () => {
+      const binding = this.bindings.get(input.bindingId);
+      if (!binding) return { status: "denied", code: "binding_not_found" };
+      if (binding.trustState === "suspended") {
+        return { status: "duplicate", trustState: "suspended" };
+      }
+      binding.trustState = "suspended";
+      binding.updatedAt = input.now;
+      binding.freshUntil = input.now;
+      return { status: "changed", trustState: "suspended" };
+    });
+  }
+
+  async revalidateBindingFromReceipt(
+    input: RevalidateBindingCommand,
+  ): Promise<BindingChangeResult> {
+    return this.withBindingLock(input.bindingId, "revalidate_binding", async () => {
+      const binding = this.bindings.get(input.bindingId);
+      if (!binding) return { status: "denied", code: "binding_not_found" };
+      const authority = evaluateAuthorityChange({
+        operation: "binding_revalidation",
+        bindingId: input.bindingId,
+        receipt: input.receipt,
+        now: input.now,
+      });
+      if (!authority.allowed) return { status: "denied", code: authority.code };
+      if (!Number.isFinite(input.freshUntil.getTime()) || input.freshUntil <= input.now) {
+        return { status: "denied", code: "freshness_invalid" };
+      }
+      binding.trustState = "reverified";
+      binding.updatedAt = input.now;
+      binding.freshUntil = input.freshUntil;
+      return { status: "changed", trustState: "reverified" };
+    });
+  }
+
+  async registerTemplateDefinition(
+    input: RegisterTemplateDefinition & { now: Date },
+  ): Promise<TemplateResult> {
+    const key = this.templateKey(input.templateId, input.locale);
+    const existing = this.templates.get(key);
+    if (existing) {
+      if (existing.definitionVersion !== input.definitionVersion) {
+        return { status: "denied", code: "definition_conflict" };
+      }
+      return { status: "duplicate", ...clone(existing) };
+    }
+    const template: TemplateRecord = {
+      templateId: input.templateId,
+      locale: input.locale,
+      definitionVersion: input.definitionVersion,
+      internallyApproved: false,
+      providerState: "draft",
+      providerVersion: 0,
+      updatedAt: input.now,
+    };
+    this.templates.set(key, template);
+    return { status: "registered", ...clone(template) };
+  }
+
+  async approveTemplateDefinition(
+    input: ApproveTemplateDefinition & { now: Date },
+  ): Promise<TemplateResult> {
+    const receipt = input.receipt;
+    if (!receipt) return { status: "denied", code: "approval_receipt_missing" };
+    if (
+      receipt.owner !== "communications" ||
+      receipt.operation !== "template_internal_approval" ||
+      receipt.resourceId !== input.templateId ||
+      !currentReceipt(receipt, input.now)
+    ) {
+      return { status: "denied", code: "approval_receipt_invalid" };
+    }
+    const template = [...this.templates.values()].find(
+      (candidate) => candidate.templateId === input.templateId,
+    );
+    if (!template) return { status: "not_found", code: "template_not_found" };
+    if (template.internallyApproved && template.approvalReceiptId === receipt.receiptId) {
+      return { status: "duplicate", ...clone(template) };
+    }
+    template.internallyApproved = true;
+    template.approvalReceiptId = receipt.receiptId;
+    template.updatedAt = input.now;
+    return { status: "approved", ...clone(template) };
+  }
+
+  async reconcileTemplate(
+    input: ReconcileTemplateCommand,
+  ): Promise<TemplateReconciliationResult> {
+    const template = this.templates.get(this.templateKey(input.templateId, input.locale));
+    if (!template) return { status: "not_found", code: "template_not_found" };
+    if (input.providerVersion < template.providerVersion) {
+      return { status: "regressive", ...clone(template) };
+    }
+    if (input.providerVersion === template.providerVersion) {
+      return { status: "duplicate", ...clone(template) };
+    }
+    template.providerState = input.providerState;
+    template.providerVersion = input.providerVersion;
+    template.updatedAt = input.now;
+    return { status: "applied", ...clone(template) };
+  }
+
+  async evaluateTemplateEligibility(
+    input: EvaluateTemplateEligibility,
+  ): Promise<TemplateEligibilityResult> {
+    const template = this.templates.get(this.templateKey(input.templateId, input.locale));
+    if (!template) return { eligible: false, code: "template_not_found" };
+    if (!template.internallyApproved) {
+      return { eligible: false, code: "internal_approval_required" };
+    }
+    if (template.providerState !== "provider_approved") {
+      return { eligible: false, code: "provider_not_approved" };
+    }
+    return { eligible: true, code: "eligible" };
+  }
+
+  async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
+    const candidates: RecoveryCandidate[] = [];
+    for (const outbound of this.outboundById.values()) {
+      const attempt = [...this.attempts.values()]
+        .filter((candidate) => candidate.commandId === outbound.command.commandId)
+        .at(-1);
+      if (!attempt) continue;
+      if (outbound.state === "dispatch_unknown") {
+        candidates.push({
+          kind: "outbound_dispatch_unknown",
+          commandId: outbound.command.commandId,
+          attemptId: attempt.attemptId,
+        });
+      } else if (
+        outbound.state === "dispatching" &&
+        outbound.leaseExpiresAt &&
+        outbound.leaseExpiresAt <= input.now
+      ) {
+        candidates.push({
+          kind: "outbound_lease_expired",
+          commandId: outbound.command.commandId,
+          attemptId: attempt.attemptId,
+        });
+      }
+    }
+    for (const inbound of this.inboundById.values()) {
+      if (
+        inbound.state === "persisted" &&
+        inbound.leaseExpiresAt &&
+        inbound.leaseExpiresAt <= input.now
+      ) {
+        candidates.push({ kind: "inbound_lease_expired", eventId: inbound.envelope.event.eventId });
+      }
+    }
+    return candidates.slice(0, Math.max(0, Math.min(input.limit, 100)));
+  }
+
+  referenceState(): CommunicationsReferenceState {
+    return clone({
+      inbound: [...this.inboundById.values()].map((record) => ({
+        eventId: record.envelope.event.eventId,
+        endpointDigests: record.endpointDigests,
+        envelope: record.envelope,
+        state: record.state,
+        leaseVersion: record.leaseVersion,
+      })),
+      outbound: [...this.outboundById.values()].map((record) => ({
+        ...record.command,
+        message: record.message,
+        purpose: record.purpose,
+        templateId: record.templateId,
+        fingerprint: record.fingerprint,
+        requiredPolicyVersion: record.requiredPolicyVersion,
+        requiredFence: record.requiredFence,
+        endpointDigests: record.endpointDigests,
+        state: record.state,
+        leaseVersion: record.leaseVersion,
+      })),
+      attempts: [...this.attempts.values()],
+      policies: [...this.policies.values()],
+      bindings: [...this.bindings.values()],
+      consentHistory: this.consentHistory,
+      templates: [...this.templates.values()],
+      providerStatuses: [...this.providerStatuses.values()],
+    });
+  }
+
+  private consentKey(bindingId: string, purpose: string): string {
+    return `${bindingId}\u0000${purpose}`;
+  }
+
+  private templateKey(templateId: string, locale: string): string {
+    return `${templateId}\u0000${locale}`;
+  }
+
+  private requirePolicy(
+    bindingId: string,
+    now: Date,
+  ): ChannelContactPolicy & { fence: number } {
+    const existing = this.policies.get(bindingId);
+    if (existing) return existing;
+    const created: ChannelContactPolicy & { fence: number } = {
+      policyId: `policy_${bindingId}`,
+      bindingId,
+      state: "normal",
+      version: 0,
+      fence: 0,
+      updatedAt: now,
+    };
+    this.policies.set(bindingId, created);
+    return created;
+  }
+
+  private async withBindingLock<T>(
+    bindingId: string,
+    operation: LockOperation,
+    action: () => Promise<T>,
+  ): Promise<T> {
+    const previous = this.bindingLockTails.get(bindingId) ?? Promise.resolve();
+    let release!: () => void;
+    const current = new Promise<void>((resolve) => {
+      release = resolve;
+    });
+    this.bindingLockTails.set(bindingId, current);
+    await previous;
+    try {
+      await this.lockBoundary?.({ bindingId, operation });
+      return await action();
+    } finally {
+      release();
+      if (this.bindingLockTails.get(bindingId) === current) {
+        this.bindingLockTails.delete(bindingId);
+      }
+    }
+  }
+}
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
new file mode 100644
index 0000000..cc203a2
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -0,0 +1,384 @@
+import type {
+  ChannelConnectionState,
+  ChannelContactPolicy,
+  ChannelConversation,
+  ChannelKind,
+  ChannelLocale,
+  ChannelMessage,
+  ChannelParticipant,
+  ContactChannelBinding,
+  ContactConsentState,
+  ContactPurpose,
+  DomainReceipt,
+  InboundChannelEvent,
+  OutboundCommandState,
+  OutboundDispatchAttempt,
+  OutboundMessageCommand,
+  TemplateLifecycleState,
+} from "./contracts.ts";
+import type {
+  OutboundAuthorizationReceipt,
+  OwningAuthorityReceipt,
+} from "./channel-policy.ts";
+
+export type EndpointDigest = {
+  version: string;
+  digest: string;
+};
+
+export type CanonicalInboundEnvelope = {
+  event: InboundChannelEvent;
+  conversation: ChannelConversation;
+  participant: ChannelParticipant;
+  message: ChannelMessage;
+};
+
+export type AcceptInboundCommand = {
+  connectionId: string;
+  providerEventId: string;
+  providerBodyDigest: string;
+  endpointDigests: readonly EndpointDigest[];
+  envelope: CanonicalInboundEnvelope;
+  optOutSignal: "none" | "pending";
+};
+
+export type AcceptInboundResult =
+  | {
+      status: "accepted" | "duplicate";
+      eventId: string;
+      endpointDigestVersion: string;
+      endpointDigest: string;
+    }
+  | { status: "replay_mismatch"; code: "provider_replay_mismatch" };
+
+export type ClaimInboundCommand = {
+  eventId: string;
+  leaseOwner: string;
+  leaseExpiresAt: Date;
+  now: Date;
+  requiredPolicyVersion: number;
+};
+
+export type InboundClaimResult =
+  | {
+      status: "claimed";
+      eventId: string;
+      leaseVersion: number;
+      envelope: CanonicalInboundEnvelope;
+      policyState: ChannelContactPolicy["state"];
+    }
+  | {
+      status: "not_claimed";
+      code:
+        | "not_found"
+        | "already_completed"
+        | "lease_conflict"
+        | "policy_version_mismatch";
+    };
+
+export type CompleteInboundCommand = {
+  eventId: string;
+  leaseOwner: string;
+  leaseVersion: number;
+  outcome: "applied" | "manual_review" | "dead_letter";
+  now: Date;
+};
+
+export type CreateOutboundCommand = {
+  command: OutboundMessageCommand;
+  message: ChannelMessage;
+  purpose: ContactPurpose;
+  templateId: string;
+  fingerprint: string;
+  requiredPolicyVersion: number;
+  requiredFence: number;
+  endpointDigests: readonly EndpointDigest[];
+  authorizationReceipt?: OutboundAuthorizationReceipt;
+};
+
+export type CreateOutboundResult =
+  | { status: "created" | "duplicate"; commandId: string; messageId: string }
+  | { status: "conflict"; code: "idempotency_mismatch" };
+
+export type ClaimOutboundCommand = {
+  commandId: string;
+  attemptId: string;
+  leaseOwner: string;
+  leaseExpiresAt: Date;
+  now: Date;
+};
+
+export type OutboundClaimResult =
+  | {
+      status: "claimed";
+      command: OutboundMessageCommand;
+      message: ChannelMessage;
+      attempt: OutboundDispatchAttempt & { leaseVersion: number };
+      destinationDigest: EndpointDigest;
+    }
+  | {
+      status: "not_claimed";
+      code:
+        | "not_found"
+        | "lease_conflict"
+        | "dispatch_unknown_non_retryable"
+        | "already_completed"
+        | "binding_not_found"
+        | "policy_not_found"
+        | "consent_not_found"
+        | "contact_policy_denied"
+        | "marketing_denied"
+        | "binding_not_reverified"
+        | "binding_freshness_invalid"
+        | "binding_stale"
+        | "consent_not_granted"
+        | "consent_receipt_missing"
+        | "consent_receipt_invalid"
+        | "policy_version_mismatch"
+        | "policy_fence_mismatch"
+        | "connection_not_ready"
+        | "template_ineligible"
+        | "authority_receipt_missing"
+        | "authority_receipt_invalid"
+        | "destination_mismatch";
+    };
+
+export type MarkDispatchOutcomeCommand = {
+  commandId: string;
+  attemptId: string;
+  leaseOwner: string;
+  leaseVersion: number;
+  outcome: "accepted" | "known_failure" | "unknown";
+  now: Date;
+  providerReference?: string;
+};
+
+export type ApplyProviderStatusCommand = {
+  commandId: string;
+  providerEventId: string;
+  status: "sent" | "delivered" | "read" | "failed";
+  occurredAt: Date;
+};
+
+export type ProviderStatusResult =
+  | {
+      status: "applied" | "duplicate" | "regressive";
+      commandState: OutboundCommandState;
+    }
+  | { status: "not_found" };
+
+export type ConsentRecord = {
+  bindingId: string;
+  purpose: ContactPurpose;
+  state: ContactConsentState;
+  version: number;
+  receipt?: import("./channel-policy.ts").ConsentReceipt;
+  authorityReceiptId?: string;
+  changedAt: Date;
+};
+
+export type GrantConsentCommand = {
+  bindingId: string;
+  purpose: ContactPurpose;
+  operation: "consent_grant" | "reconsent";
+  receipt?: OwningAuthorityReceipt;
+  now: Date;
+};
+
+export type ConsentChangeResult =
+  | { status: "changed" | "duplicate"; state: ContactConsentState; version: number }
+  | {
+      status: "denied";
+      code:
+        | "authority_receipt_missing"
+        | "authority_receipt_invalid"
+        | "reconsent_receipt_required"
+        | "policy_state_invalid";
+    };
+
+export type WithdrawContactCommand = {
+  bindingId: string;
+  now: Date;
+};
+
+export type WithdrawContactResult = {
+  status: "changed" | "duplicate";
+  state: "withdrawn";
+  policyVersion: number;
+  fence: number;
+  cancelledCommandIds: readonly string[];
+};
+
+export type ResolveOptOutCommand = {
+  bindingId: string;
+  receipt?: OwningAuthorityReceipt;
+  now: Date;
+};
+
+export type SuspendBindingCommand = {
+  bindingId: string;
+  reason: "expired" | "wrong_person" | "reassigned" | "invalid_recipient";
+  now: Date;
+};
+
+export type BindingChangeResult =
+  | {
+      status: "changed" | "duplicate";
+      trustState: ContactChannelBinding["trustState"];
+    }
+  | {
+      status: "denied";
+      code:
+        | "binding_not_found"
+        | "authority_receipt_missing"
+        | "authority_receipt_invalid"
+        | "freshness_invalid";
+    };
+
+export type RevalidateBindingCommand = {
+  bindingId: string;
+  freshUntil: Date;
+  receipt?: OwningAuthorityReceipt;
+  now: Date;
+};
+
+export type TemplateProviderState = Extract<
+  TemplateLifecycleState,
+  "provider_approved" | "provider_rejected" | "paused" | "disabled"
+>;
+
+export type TemplateAuthorityReceipt = {
+  receiptId: string;
+  owner: "communications";
+  operation: "template_internal_approval";
+  resourceId: string;
+  issuedAt: Date;
+  expiresAt: Date;
+};
+
+export type TemplateRecord = {
+  templateId: string;
+  locale: ChannelLocale;
+  definitionVersion: number;
+  internallyApproved: boolean;
+  approvalReceiptId?: string;
+  providerState: TemplateLifecycleState;
+  providerVersion: number;
+  updatedAt: Date;
+};
+
+export type RegisterTemplateDefinition = {
+  templateId: string;
+  locale: ChannelLocale;
+  definitionVersion: number;
+  synthetic: boolean;
+};
+
+export type ApproveTemplateDefinition = {
+  templateId: string;
+  receipt?: TemplateAuthorityReceipt;
+};
+
+export type ReconcileTemplateCommand = {
+  templateId: string;
+  locale: ChannelLocale;
+  providerState: TemplateProviderState;
+  providerVersion: number;
+  now: Date;
+};
+
+export type TemplateReconciliationResult =
+  | ({ status: "applied" | "duplicate" | "regressive" } & TemplateRecord)
+  | { status: "not_found"; code: "template_not_found" };
+
+export type TemplateResult =
+  | ({ status: "registered" | "approved" } & TemplateRecord)
+  | TemplateReconciliationResult
+  | {
+      status: "denied";
+      code:
+        | "approval_receipt_missing"
+        | "approval_receipt_invalid"
+        | "definition_conflict";
+    }
+  | { status: "unavailable"; code: "runtime_registration_disabled" };
+
+export type EvaluateTemplateEligibility = {
+  templateId: string;
+  locale: ChannelLocale;
+};
+
+export type TemplateEligibilityResult =
+  | { eligible: true; code: "eligible" }
+  | {
+      eligible: false;
+      code: "template_not_found" | "internal_approval_required" | "provider_not_approved";
+    };
+
+export type RecoveryQuery = { now: Date; limit: number };
+
+export type RecoveryCandidate =
+  | {
+      kind: "outbound_dispatch_unknown" | "outbound_lease_expired";
+      commandId: string;
+      attemptId: string;
+    }
+  | { kind: "inbound_lease_expired"; eventId: string };
+
+export interface CommunicationsRepository {
+  acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult>;
+  claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult>;
+  completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict">;
+  createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult>;
+  claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult>;
+  markDispatchOutcome(
+    input: MarkDispatchOutcomeCommand,
+  ): Promise<"completed" | "conflict">;
+  applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult>;
+  grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult>;
+  withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult>;
+  resolveAmbiguousOptOutFromReceipt(input: ResolveOptOutCommand): Promise<ConsentChangeResult>;
+  suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult>;
+  revalidateBindingFromReceipt(input: RevalidateBindingCommand): Promise<BindingChangeResult>;
+  reconcileTemplate(input: ReconcileTemplateCommand): Promise<TemplateReconciliationResult>;
+  findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]>;
+  registerTemplateDefinition(input: RegisterTemplateDefinition & { now: Date }): Promise<TemplateResult>;
+  approveTemplateDefinition(
+    input: ApproveTemplateDefinition & { now: Date },
+  ): Promise<TemplateResult>;
+  evaluateTemplateEligibility(
+    input: EvaluateTemplateEligibility,
+  ): Promise<TemplateEligibilityResult>;
+}
+
+export interface MessageTemplateService {
+  registerInternalDefinition(input: RegisterTemplateDefinition): Promise<TemplateResult>;
+  recordInternalApproval(input: ApproveTemplateDefinition): Promise<TemplateResult>;
+  applyProviderProjection(input: ReconcileTemplateCommand): Promise<TemplateResult>;
+  evaluateEligibility(
+    input: EvaluateTemplateEligibility,
+  ): Promise<TemplateEligibilityResult>;
+}
+
+export type CommunicationsReferenceState = {
+  inbound: readonly Record<string, unknown>[];
+  outbound: readonly Record<string, unknown>[];
+  attempts: readonly Record<string, unknown>[];
+  policies: readonly (ChannelContactPolicy & { fence: number })[];
+  bindings: readonly (ContactChannelBinding & { freshUntil: Date })[];
+  consentHistory: readonly ConsentRecord[];
+  templates: readonly TemplateRecord[];
+  providerStatuses: readonly ApplyProviderStatusCommand[];
+};
+
+export type CommunicationsSeed = {
+  bindings?: readonly (ContactChannelBinding & { freshUntil: Date })[];
+  policies?: readonly (ChannelContactPolicy & { fence: number })[];
+  consents?: readonly ConsentRecord[];
+  connections?: readonly { channel: ChannelKind; state: ChannelConnectionState }[];
+  templates?: readonly TemplateRecord[];
+};
+
+export type HandoffRequestResult =
+  | { status: "queued"; receipt?: DomainReceipt }
+  | { status: "unavailable" };
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
new file mode 100644
index 0000000..25f3d4f
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
@@ -0,0 +1,535 @@
+import type {
+  ChannelKind,
+  ChannelLocale,
+  ChannelMessage,
+  DomainReceipt,
+} from "./contracts.ts";
+import type {
+  AcceptInboundResult,
+  CanonicalInboundEnvelope,
+  CommunicationsRepository,
+  EndpointDigest,
+  EvaluateTemplateEligibility,
+  HandoffRequestResult,
+  MessageTemplateService,
+  ReconcileTemplateCommand,
+  RegisterTemplateDefinition,
+  ApproveTemplateDefinition,
+  TemplateEligibilityResult,
+  TemplateResult,
+} from "./repository.ts";
+
+export type EndpointDigestKey = {
+  purpose: "communications_endpoint_digest";
+  version: string;
+  key: string;
+};
+
+export interface EndpointDigestKeyResolver {
+  resolve(): Promise<
+    | {
+        status: "available";
+        active: EndpointDigestKey;
+        prior: readonly EndpointDigestKey[];
+      }
+    | { status: "unavailable" }
+  >;
+}
+
+export interface KeyedDigestPort {
+  digest(input: { key: string; payload: string }): Promise<string>;
+}
+
+export interface DestinationResolutionPort {
+  resolve(input: { bindingId: string }): Promise<
+    | { status: "resolved"; endpoint: string }
+    | { status: "unavailable" }
+  >;
+}
+
+export interface BoundedExecutor {
+  run<T>(operation: string, timeoutMs: number, action: () => Promise<T>): Promise<T>;
+}
+
+export interface OutboundProviderPort {
+  dispatch(input: {
+    commandId: string;
+    attemptId: string;
+    destination: string;
+    message: ChannelMessage;
+  }): Promise<
+    | { status: "accepted"; providerReference?: string }
+    | { status: "failed"; code: string }
+    | { status: "unavailable" }
+  >;
+}
+
+export interface PublicKnowledgePort {
+  answer(input: { prompt: string; locale: ChannelLocale }): Promise<
+    | { status: "available"; text: string; sourceReceipt?: string }
+    | { status: "unavailable" }
+  >;
+}
+
+export interface ContentPolicyPort {
+  evaluate(input: { text: string }):
+    | { allowed: true; code: "allowed" }
+    | { allowed: false; code: string };
+}
+
+export interface HandoffPort {
+  request(input: {
+    conversationId: string;
+    idempotencyKey: string;
+  }): Promise<HandoffRequestResult>;
+}
+
+export type CommunicationsServiceDependencies = {
+  repository: CommunicationsRepository;
+  clock: { now(): Date };
+  ids: { next(kind: string): string };
+  endpointDigestKeys: EndpointDigestKeyResolver;
+  keyedDigest: KeyedDigestPort;
+  destinationResolver: DestinationResolutionPort;
+  boundedExecutor: BoundedExecutor;
+  provider: OutboundProviderPort;
+  publicKnowledge: PublicKnowledgePort;
+  contentPolicy: ContentPolicyPort;
+  handoff: HandoffPort;
+  providerTimeoutMs: number;
+  knowledgeTimeoutMs: number;
+  handoffTimeoutMs: number;
+};
+
+export type AcceptInboundApplicationCommand = {
+  connectionId: string;
+  providerEventId: string;
+  providerBodyDigest: string;
+  endpoint: string;
+  envelope: CanonicalInboundEnvelope;
+  optOutSignal: "none" | "pending";
+};
+
+export type QueueOutboundApplicationCommand = {
+  channel: ChannelKind;
+  locale: ChannelLocale;
+  conversationId: string;
+  bindingId: string;
+  body: string;
+  purpose: import("./contracts.ts").ContactPurpose;
+  templateId: string;
+  idempotencyKey: string;
+  fingerprint: string;
+  requiredPolicyVersion: number;
+  requiredFence: number;
+  authorizationReceipt?: import("./channel-policy.ts").OutboundAuthorizationReceipt;
+  correlationId: string;
+};
+
+type EndpointResolution =
+  | { status: "available"; endpoint: string; digests: readonly EndpointDigest[] }
+  | {
+      status: "unavailable";
+      code:
+        | "destination_unavailable"
+        | "endpoint_digest_key_unavailable"
+        | "endpoint_digest_key_invalid";
+    };
+
+const KEY_VERSION = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
+const RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
+const ENDPOINT_DIGEST_DOMAIN = "communications:endpoint-digest:v1\u0000";
+const MAX_PRIOR_ENDPOINT_KEYS = 3;
+
+function validDate(value: Date): boolean {
+  return Number.isFinite(value.getTime());
+}
+
+function validHandoffReceipt(
+  receipt: DomainReceipt | undefined,
+  input: { conversationId: string; idempotencyKey: string; now: Date },
+): boolean {
+  return Boolean(
+    receipt &&
+      receipt.owner === "communications" &&
+      receipt.operation === "handoff" &&
+      RECEIPT_ID.test(receipt.receiptId) &&
+      receipt.resourceId === input.conversationId &&
+      receipt.idempotencyKey === input.idempotencyKey &&
+      validDate(receipt.issuedAt) &&
+      validDate(receipt.expiresAt) &&
+      receipt.issuedAt <= input.now &&
+      receipt.expiresAt > input.now,
+  );
+}
+
+export class CommunicationsService {
+  constructor(private readonly dependencies: CommunicationsServiceDependencies) {}
+
+  async acceptInbound(
+    input: AcceptInboundApplicationCommand,
+  ): Promise<
+    | AcceptInboundResult
+    | {
+        status: "unavailable";
+        code: "endpoint_digest_key_unavailable" | "endpoint_digest_key_invalid";
+      }
+  > {
+    const resolved = await this.digestEndpoint(input.endpoint);
+    if (resolved.status === "unavailable") {
+      return {
+        status: "unavailable",
+        code:
+          resolved.code === "destination_unavailable"
+            ? "endpoint_digest_key_unavailable"
+            : resolved.code,
+      };
+    }
+    return this.dependencies.repository.acceptInbound({
+      connectionId: input.connectionId,
+      providerEventId: input.providerEventId,
+      providerBodyDigest: input.providerBodyDigest,
+      endpointDigests: resolved.digests,
+      envelope: input.envelope,
+      optOutSignal: input.optOutSignal,
+    });
+  }
+
+  async queueOutbound(input: QueueOutboundApplicationCommand): Promise<Record<string, unknown>> {
+    const copy = this.dependencies.contentPolicy.evaluate({ text: input.body });
+    if (!copy.allowed) return { status: "unavailable", code: "prohibited_content" };
+    const resolved = await this.resolveDestination(input.bindingId);
+    if (resolved.status === "unavailable") {
+      return { status: "unavailable", code: resolved.code };
+    }
+    const now = this.dependencies.clock.now();
+    const commandId = this.dependencies.ids.next("outbound_command");
+    const messageId = this.dependencies.ids.next("outbound_message");
+    return this.dependencies.repository.createOutbound({
+      command: {
+        commandId,
+        channel: input.channel,
+        locale: input.locale,
+        conversationId: input.conversationId,
+        bindingId: input.bindingId,
+        messageId,
+        idempotencyKey: input.idempotencyKey,
+        state: "queued",
+        createdAt: now,
+        correlationId: input.correlationId,
+      },
+      message: {
+        id: messageId,
+        conversationId: input.conversationId,
+        channel: input.channel,
+        direction: "outbound",
+        senderParticipantId: "system",
+        locale: input.locale,
+        kind: "text",
+        body: input.body,
+        createdAt: now,
+      },
+      purpose: input.purpose,
+      templateId: input.templateId,
+      fingerprint: input.fingerprint,
+      requiredPolicyVersion: input.requiredPolicyVersion,
+      requiredFence: input.requiredFence,
+      endpointDigests: resolved.digests,
+      authorizationReceipt: input.authorizationReceipt,
+    });
+  }
+
+  async dispatchOutbound(input: {
+    commandId: string;
+    leaseOwner: string;
+    leaseExpiresAt: Date;
+  }): Promise<Record<string, unknown>> {
+    const now = this.dependencies.clock.now();
+    const attemptId = this.dependencies.ids.next("dispatch_attempt");
+    const claim = await this.dependencies.repository.claimOutbound({
+      commandId: input.commandId,
+      attemptId,
+      leaseOwner: input.leaseOwner,
+      leaseExpiresAt: input.leaseExpiresAt,
+      now,
+    });
+    if (claim.status === "not_claimed") {
+      return { status: "not_dispatched", code: claim.code };
+    }
+
+    const resolved = await this.resolveDestination(claim.command.bindingId);
+    if (resolved.status === "unavailable") {
+      await this.dependencies.repository.markDispatchOutcome({
+        commandId: input.commandId,
+        attemptId,
+        leaseOwner: input.leaseOwner,
+        leaseVersion: claim.attempt.leaseVersion,
+        outcome: "known_failure",
+        now: this.dependencies.clock.now(),
+      });
+      return { status: "not_dispatched", code: resolved.code, attemptId };
+    }
+    const matchingDigest = resolved.digests.some(
+      (candidate) => candidate.digest === claim.destinationDigest.digest,
+    );
+    if (!matchingDigest) {
+      await this.dependencies.repository.markDispatchOutcome({
+        commandId: input.commandId,
+        attemptId,
+        leaseOwner: input.leaseOwner,
+        leaseVersion: claim.attempt.leaseVersion,
+        outcome: "known_failure",
+        now: this.dependencies.clock.now(),
+      });
+      return { status: "not_dispatched", code: "destination_mismatch", attemptId };
+    }
+
+    try {
+      const providerResult = await this.dependencies.boundedExecutor.run(
+        "communications_provider_dispatch",
+        this.dependencies.providerTimeoutMs,
+        () =>
+          this.dependencies.provider.dispatch({
+            commandId: input.commandId,
+            attemptId,
+            destination: resolved.endpoint,
+            message: claim.message,
+          }),
+      );
+      if (providerResult.status === "accepted") {
+        await this.dependencies.repository.markDispatchOutcome({
+          commandId: input.commandId,
+          attemptId,
+          leaseOwner: input.leaseOwner,
+          leaseVersion: claim.attempt.leaseVersion,
+          outcome: "accepted",
+          providerReference: providerResult.providerReference,
+          now: this.dependencies.clock.now(),
+        });
+        return { status: "accepted", attemptId };
+      }
+      await this.dependencies.repository.markDispatchOutcome({
+        commandId: input.commandId,
+        attemptId,
+        leaseOwner: input.leaseOwner,
+        leaseVersion: claim.attempt.leaseVersion,
+        outcome: "known_failure",
+        now: this.dependencies.clock.now(),
+      });
+      return {
+        status: "not_dispatched",
+        code: providerResult.status === "unavailable" ? "provider_unavailable" : "provider_rejected",
+        attemptId,
+      };
+    } catch {
+      await this.dependencies.repository.markDispatchOutcome({
+        commandId: input.commandId,
+        attemptId,
+        leaseOwner: input.leaseOwner,
+        leaseVersion: claim.attempt.leaseVersion,
+        outcome: "unknown",
+        now: this.dependencies.clock.now(),
+      });
+      return { status: "dispatch_unknown", code: "provider_outcome_ambiguous", attemptId };
+    }
+  }
+
+  async processInbound(input: {
+    eventId: string;
+    leaseOwner: string;
+    leaseExpiresAt: Date;
+    requiredPolicyVersion: number;
+    action: "public_knowledge" | "handoff";
+    prompt?: string;
+    idempotencyKey?: string;
+  }): Promise<Record<string, unknown>> {
+    const claim = await this.dependencies.repository.claimInbound({
+      eventId: input.eventId,
+      leaseOwner: input.leaseOwner,
+      leaseExpiresAt: input.leaseExpiresAt,
+      requiredPolicyVersion: input.requiredPolicyVersion,
+      now: this.dependencies.clock.now(),
+    });
+    if (claim.status === "not_claimed") {
+      return { status: "conflict", code: claim.code };
+    }
+    if (claim.policyState === "opt_out_pending" || claim.policyState === "withdrawn") {
+      await this.completeInbound(claim, input, "applied");
+      return { status: "opt_out_pending", eventId: input.eventId };
+    }
+    if (input.action === "handoff") {
+      const idempotencyKey = input.idempotencyKey ?? "";
+      try {
+        const result = await this.dependencies.boundedExecutor.run(
+          "communications_handoff",
+          this.dependencies.handoffTimeoutMs,
+          () =>
+            this.dependencies.handoff.request({
+              conversationId: claim.envelope.conversation.id,
+              idempotencyKey,
+            }),
+        );
+        if (result.status !== "queued") {
+          await this.completeInbound(claim, input, "manual_review");
+          return { status: "manual", code: "handoff_unavailable" };
+        }
+        if (
+          !validHandoffReceipt(result.receipt, {
+            conversationId: claim.envelope.conversation.id,
+            idempotencyKey,
+            now: this.dependencies.clock.now(),
+          })
+        ) {
+          await this.completeInbound(claim, input, "manual_review");
+          return { status: "manual", code: "handoff_receipt_missing" };
+        }
+        await this.completeInbound(claim, input, "applied");
+        return { status: "handoff_queued", receiptId: result.receipt!.receiptId };
+      } catch {
+        await this.completeInbound(claim, input, "manual_review");
+        return { status: "manual", code: "handoff_unavailable" };
+      }
+    }
+
+    try {
+      const answer = await this.dependencies.boundedExecutor.run(
+        "communications_public_knowledge",
+        this.dependencies.knowledgeTimeoutMs,
+        () =>
+          this.dependencies.publicKnowledge.answer({
+            prompt: input.prompt ?? "",
+            locale: claim.envelope.event.locale,
+          }),
+      );
+      if (answer.status !== "available") {
+        await this.completeInbound(claim, input, "manual_review");
+        return { status: "manual", code: "knowledge_unavailable" };
+      }
+      if (!answer.sourceReceipt) {
+        await this.completeInbound(claim, input, "manual_review");
+        return { status: "manual", code: "knowledge_receipt_missing" };
+      }
+      const decision = this.dependencies.contentPolicy.evaluate({ text: answer.text });
+      if (!decision.allowed) {
+        await this.completeInbound(claim, input, "manual_review");
+        return { status: "manual", code: "prohibited_content" };
+      }
+      await this.completeInbound(claim, input, "applied");
+      return {
+        status: "answered",
+        text: answer.text,
+        sourceReceipt: answer.sourceReceipt,
+      };
+    } catch {
+      await this.completeInbound(claim, input, "manual_review");
+      return { status: "manual", code: "knowledge_unavailable" };
+    }
+  }
+
+  private async completeInbound(
+    claim: Extract<Awaited<ReturnType<CommunicationsRepository["claimInbound"]>>, { status: "claimed" }>,
+    input: { eventId: string; leaseOwner: string },
+    outcome: "applied" | "manual_review" | "dead_letter",
+  ): Promise<void> {
+    await this.dependencies.repository.completeInbound({
+      eventId: input.eventId,
+      leaseOwner: input.leaseOwner,
+      leaseVersion: claim.leaseVersion,
+      outcome,
+      now: this.dependencies.clock.now(),
+    });
+  }
+
+  private async resolveDestination(bindingId: string): Promise<EndpointResolution> {
+    try {
+      const destination = await this.dependencies.destinationResolver.resolve({ bindingId });
+      if (destination.status !== "resolved" || !destination.endpoint) {
+        return { status: "unavailable", code: "destination_unavailable" };
+      }
+      return this.digestEndpoint(destination.endpoint);
+    } catch {
+      return { status: "unavailable", code: "destination_unavailable" };
+    }
+  }
+
+  private async digestEndpoint(endpoint: string): Promise<EndpointResolution> {
+    let ring: Awaited<ReturnType<EndpointDigestKeyResolver["resolve"]>>;
+    try {
+      ring = await this.dependencies.endpointDigestKeys.resolve();
+    } catch {
+      return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
+    }
+    if (ring.status !== "available") {
+      return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
+    }
+    const keys = [ring.active, ...ring.prior];
+    const versions = new Set<string>();
+    if (
+      ring.prior.length > MAX_PRIOR_ENDPOINT_KEYS ||
+      keys.some(
+        (candidate) =>
+          candidate.purpose !== "communications_endpoint_digest" ||
+          !KEY_VERSION.test(candidate.version) ||
+          !candidate.key ||
+          versions.has(candidate.version) ||
+          (versions.add(candidate.version), false),
+      )
+    ) {
+      return { status: "unavailable", code: "endpoint_digest_key_invalid" };
+    }
+    try {
+      const payload = `${ENDPOINT_DIGEST_DOMAIN}${endpoint}`;
+      const digests: EndpointDigest[] = [];
+      for (const candidate of keys) {
+        const digest = await this.dependencies.keyedDigest.digest({
+          key: candidate.key,
+          payload,
+        });
+        if (!digest) {
+          return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
+        }
+        digests.push({ version: candidate.version, digest });
+      }
+      return { status: "available", endpoint, digests };
+    } catch {
+      return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
+    }
+  }
+}
+
+export class CanonicalMessageTemplateService implements MessageTemplateService {
+  constructor(
+    private readonly dependencies: {
+      repository: CommunicationsRepository;
+      clock: { now(): Date };
+      allowSyntheticDefinitions?: boolean;
+    },
+  ) {}
+
+  async registerInternalDefinition(input: RegisterTemplateDefinition): Promise<TemplateResult> {
+    if (!this.dependencies.allowSyntheticDefinitions || !input.synthetic) {
+      return { status: "unavailable", code: "runtime_registration_disabled" };
+    }
+    return this.dependencies.repository.registerTemplateDefinition({
+      ...input,
+      now: this.dependencies.clock.now(),
+    });
+  }
+
+  async recordInternalApproval(input: ApproveTemplateDefinition): Promise<TemplateResult> {
+    return this.dependencies.repository.approveTemplateDefinition({
+      ...input,
+      now: this.dependencies.clock.now(),
+    });
+  }
+
+  async applyProviderProjection(input: ReconcileTemplateCommand): Promise<TemplateResult> {
+    return this.dependencies.repository.reconcileTemplate(input);
+  }
+
+  async evaluateEligibility(
+    input: EvaluateTemplateEligibility,
+  ): Promise<TemplateEligibilityResult> {
+    return this.dependencies.repository.evaluateTemplateEligibility(input);
+  }
+}
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
new file mode 100644
index 0000000..ec88b5f
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
@@ -0,0 +1,379 @@
+import { describe, expect, it } from "vitest";
+import * as communicationsModule from "../../packages/domain/src/communications/index.ts";
+
+const NOW = new Date("2026-08-20T12:00:00.000Z");
+const LATER = new Date("2026-08-20T12:05:00.000Z");
+const TOMORROW = new Date("2026-08-21T12:00:00.000Z");
+
+type RuntimeApi = {
+  MemoryCommunicationsRepository: new (options?: Record<string, unknown>) => any;
+  CommunicationsService: new (dependencies: Record<string, unknown>) => any;
+};
+
+function runtimeApi(): RuntimeApi {
+  expect(communicationsModule).toHaveProperty("MemoryCommunicationsRepository");
+  expect(communicationsModule).toHaveProperty("CommunicationsService");
+  return communicationsModule as unknown as RuntimeApi;
+}
+
+function deferred() {
+  let resolve!: () => void;
+  const promise = new Promise<void>((done) => {
+    resolve = done;
+  });
+  return { promise, resolve };
+}
+
+function repositoryOptions(overrides: Record<string, unknown> = {}) {
+  return {
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
+    consents: [
+      {
+        bindingId: "binding_1",
+        purpose: "transactional",
+        state: "granted",
+        version: 1,
+        receipt: {
+          receiptId: "consent_receipt_1",
+          owner: "consent",
+          operation: "consent_confirmation",
+          bindingId: "binding_1",
+          issuedAt: NOW,
+          expiresAt: TOMORROW,
+        },
+        changedAt: NOW,
+      },
+    ],
+    connections: [{ channel: "whatsapp", state: "active" }],
+    templates: [
+      {
+        templateId: "template_1",
+        locale: "en",
+        definitionVersion: 1,
+        internallyApproved: true,
+        providerState: "provider_approved",
+        providerVersion: 1,
+        updatedAt: NOW,
+      },
+    ],
+    ...overrides,
+  };
+}
+
+function createRepository(overrides: Record<string, unknown> = {}) {
+  const { MemoryCommunicationsRepository } = runtimeApi();
+  return new MemoryCommunicationsRepository(repositoryOptions(overrides));
+}
+
+function createService(repository: any, provider: Record<string, unknown>) {
+  const { CommunicationsService } = runtimeApi();
+  let id = 0;
+  return new CommunicationsService({
+    repository,
+    clock: { now: () => NOW },
+    ids: { next: (kind: string) => `${kind}_${++id}` },
+    endpointDigestKeys: {
+      resolve: async () => ({
+        status: "available",
+        active: {
+          purpose: "communications_endpoint_digest",
+          version: "v1",
+          key: "SERVER_KEY",
+        },
+        prior: [],
+      }),
+    },
+    keyedDigest: { digest: async () => "endpoint_digest_v1" },
+    destinationResolver: {
+      resolve: async () => ({ status: "resolved", endpoint: "raw:endpoint:synthetic" }),
+    },
+    boundedExecutor: {
+      run: async (_operation: string, _timeoutMs: number, action: () => Promise<unknown>) =>
+        action(),
+    },
+    provider,
+    publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
+    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
+    handoff: { request: async () => ({ status: "unavailable" }) },
+    providerTimeoutMs: 2_000,
+    knowledgeTimeoutMs: 500,
+    handoffTimeoutMs: 500,
+  });
+}
+
+async function queueOutbound(service: any) {
+  return service.queueOutbound({
+    channel: "whatsapp",
+    locale: "en",
+    conversationId: "conversation_1",
+    bindingId: "binding_1",
+    body: "Synthetic outbound message",
+    purpose: "transactional",
+    templateId: "template_1",
+    idempotencyKey: "outbound_key_1",
+    fingerprint: "outbound_fingerprint_1",
+    requiredPolicyVersion: 7,
+    requiredFence: 42,
+    authorizationReceipt: {
+      receiptId: "dispatch_receipt_1",
+      owner: "communications",
+      operation: "outbound_dispatch",
+      bindingId: "binding_1",
+      destinationKey: "endpoint_digest_v1",
+      issuedAt: NOW,
+      expiresAt: TOMORROW,
+    },
+    correlationId: "correlation_out_1",
+  });
+}
+
+describe("atomic opt-out and dispatch fencing", () => {
+  it("uses a controlled binding lock so withdrawal wins before a queued dispatch claim", async () => {
+    const withdrawalEntered = deferred();
+    const releaseWithdrawal = deferred();
+    const repository = createRepository({
+      lockBoundary: async ({ operation }: { operation: string }) => {
+        if (operation === "withdraw_contact") {
+          withdrawalEntered.resolve();
+          await releaseWithdrawal.promise;
+        }
+      },
+    });
+    let providerCalls = 0;
+    const service = createService(repository, {
+      dispatch: async () => {
+        providerCalls += 1;
+        return { status: "accepted", providerReference: "provider_ref_1" };
+      },
+    });
+    const queued = await queueOutbound(service);
+    expect(queued).toMatchObject({ status: "created" });
+
+    const withdrawal = repository.withdrawContact({ bindingId: "binding_1", now: NOW });
+    await withdrawalEntered.promise;
+    const dispatch = service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    releaseWithdrawal.resolve();
+
+    await expect(withdrawal).resolves.toMatchObject({ status: "changed", state: "withdrawn" });
+    await expect(dispatch).resolves.toEqual({ status: "not_dispatched", code: "contact_policy_denied" });
+    expect(providerCalls).toBe(0);
+    expect(repository.referenceState().outbound[0]).toMatchObject({ state: "cancelled" });
+  });
+});
+
+describe("durable leases, attempts and recovery", () => {
+  it("persists the dispatch attempt before provider I/O and gates completion by owner/version", async () => {
+    const repository = createRepository();
+    let durableAttemptObserved = false;
+    const service = createService(repository, {
+      dispatch: async ({ attemptId }: { attemptId: string }) => {
+        durableAttemptObserved = repository
+          .referenceState()
+          .attempts.some((attempt: { attemptId: string; state: string }) =>
+            attempt.attemptId === attemptId && attempt.state === "dispatching");
+        return { status: "accepted", providerReference: "provider_ref_1" };
+      },
+    });
+    const queued = await queueOutbound(service);
+
+    const result = await service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+
+    expect(durableAttemptObserved).toBe(true);
+    expect(result).toMatchObject({ status: "accepted", attemptId: "dispatch_attempt_3" });
+    const state = repository.referenceState();
+    expect(state.attempts[0]).toMatchObject({ state: "provider_accepted", leaseVersion: 1 });
+    expect(
+      await repository.markDispatchOutcome({
+        commandId: queued.commandId,
+        attemptId: result.attemptId,
+        leaseOwner: "wrong_worker",
+        leaseVersion: 1,
+        outcome: "known_failure",
+        now: LATER,
+      }),
+    ).toBe("conflict");
+    expect(repository.referenceState().outbound[0]).toMatchObject({ state: "provider_accepted" });
+  });
+
+  it("records ambiguous dispatch as non-retryable recovery work", async () => {
+    const repository = createRepository();
+    const service = createService(repository, {
+      dispatch: async () => {
+        throw new Error("private provider timeout detail");
+      },
+    });
+    const queued = await queueOutbound(service);
+
+    const first = await service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+    const retry = await service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_2",
+      leaseExpiresAt: TOMORROW,
+    });
+
+    expect(first).toMatchObject({ status: "dispatch_unknown", code: "provider_outcome_ambiguous" });
+    expect(JSON.stringify(first)).not.toContain("private provider timeout detail");
+    expect(retry).toEqual({ status: "not_dispatched", code: "dispatch_unknown_non_retryable" });
+    expect(await repository.findRecoveryWork({ now: LATER, limit: 10 })).toEqual([
+      expect.objectContaining({
+        kind: "outbound_dispatch_unknown",
+        commandId: queued.commandId,
+        attemptId: first.attemptId,
+      }),
+    ]);
+  });
+
+  it("rejects stale inbound lease completion without changing canonical state", async () => {
+    const repository = createRepository();
+    const accepted = await repository.acceptInbound({
+      connectionId: "connection_1",
+      providerEventId: "provider_event_1",
+      providerBodyDigest: "body_digest_1",
+      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
+      envelope: {
+        event: {
+          eventId: "event_1",
+          channel: "whatsapp",
+          locale: "en",
+          connectionState: "active",
+          bindingId: "binding_1",
+          conversationId: "conversation_1",
+          messageId: "message_1",
+          receivedAt: NOW,
+          state: "persisted",
+          correlationId: "correlation_1",
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
+          id: "message_1",
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
+    expect(accepted).toMatchObject({ status: "accepted" });
+    const claim = await repository.claimInbound({
+      eventId: "event_1",
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+      now: NOW,
+      requiredPolicyVersion: 7,
+    });
+    expect(claim).toMatchObject({ status: "claimed", leaseVersion: 1 });
+
+    expect(
+      await repository.completeInbound({
+        eventId: "event_1",
+        leaseOwner: "worker_2",
+        leaseVersion: 1,
+        outcome: "applied",
+        now: LATER,
+      }),
+    ).toBe("conflict");
+    expect(repository.referenceState().inbound[0]).toMatchObject({ state: "persisted" });
+  });
+});
+
+describe("monotonic exactly-once provider statuses", () => {
+  it("ignores duplicate and delayed regressive statuses without moving backward", async () => {
+    const repository = createRepository();
+    const service = createService(repository, {
+      dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
+    });
+    const queued = await queueOutbound(service);
+    await service.dispatchOutbound({
+      commandId: queued.commandId,
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+    });
+
+    expect(
+      await repository.applyProviderStatus({
+        commandId: queued.commandId,
+        providerEventId: "status_event_2",
+        status: "delivered",
+        occurredAt: LATER,
+      }),
+    ).toMatchObject({ status: "applied", commandState: "delivered" });
+    expect(
+      await repository.applyProviderStatus({
+        commandId: queued.commandId,
+        providerEventId: "status_event_2",
+        status: "delivered",
+        occurredAt: LATER,
+      }),
+    ).toMatchObject({ status: "duplicate", commandState: "delivered" });
+    expect(
+      await repository.applyProviderStatus({
+        commandId: queued.commandId,
+        providerEventId: "status_event_1",
+        status: "sent",
+        occurredAt: NOW,
+      }),
+    ).toMatchObject({ status: "regressive", commandState: "delivered" });
+    expect(
+      await repository.applyProviderStatus({
+        commandId: queued.commandId,
+        providerEventId: "status_event_3",
+        status: "read",
+        occurredAt: TOMORROW,
+      }),
+    ).toMatchObject({ status: "applied", commandState: "read" });
+    expect(repository.referenceState().providerStatuses).toHaveLength(3);
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
new file mode 100644
index 0000000..d009473
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
@@ -0,0 +1,606 @@
+import { describe, expect, it } from "vitest";
+import * as communicationsModule from "../../packages/domain/src/communications/index.ts";
+
+const NOW = new Date("2026-08-20T12:00:00.000Z");
+const LATER = new Date("2026-08-20T12:05:00.000Z");
+const TOMORROW = new Date("2026-08-21T12:00:00.000Z");
+
+type RuntimeApi = {
+  MemoryCommunicationsRepository: new (options?: Record<string, unknown>) => any;
+  CommunicationsService: new (dependencies: Record<string, unknown>) => any;
+  CanonicalMessageTemplateService: new (dependencies: Record<string, unknown>) => any;
+};
+
+function runtimeApi(): RuntimeApi {
+  expect(communicationsModule).toHaveProperty("MemoryCommunicationsRepository");
+  expect(communicationsModule).toHaveProperty("CommunicationsService");
+  expect(communicationsModule).toHaveProperty("CanonicalMessageTemplateService");
+  return communicationsModule as unknown as RuntimeApi;
+}
+
+function envelope(overrides: Record<string, unknown> = {}) {
+  return {
+    event: {
+      eventId: "event_1",
+      channel: "whatsapp",
+      locale: "en",
+      connectionState: "active",
+      bindingId: "binding_1",
+      conversationId: "conversation_1",
+      messageId: "message_in_1",
+      receivedAt: NOW,
+      state: "persisted",
+      correlationId: "correlation_1",
+    },
+    conversation: {
+      id: "conversation_1",
+      channel: "whatsapp",
+      locale: "en",
+      status: "new",
+      participantIds: ["participant_1"],
+      version: 1,
+      createdAt: NOW,
+      updatedAt: NOW,
+      lastActivityAt: NOW,
+    },
+    participant: {
+      participantId: "participant_1",
+      conversationId: "conversation_1",
+      bindingId: "binding_1",
+      role: "external_contact",
+      createdAt: NOW,
+    },
+    message: {
+      id: "message_in_1",
+      conversationId: "conversation_1",
+      channel: "whatsapp",
+      direction: "inbound",
+      senderParticipantId: "participant_1",
+      locale: "en",
+      kind: "text",
+      body: "Synthetic public question",
+      createdAt: NOW,
+    },
+    ...overrides,
+  };
+}
+
+function validConsentReceipt(operation: "consent_grant" | "reconsent" = "consent_grant") {
+  return {
+    receiptId: `receipt_${operation}_1`,
+    owner: "consent",
+    operation,
+    bindingId: "binding_1",
+    issuedAt: NOW,
+    expiresAt: TOMORROW,
+  };
+}
+
+function validBindingReceipt() {
+  return {
+    receiptId: "receipt_binding_1",
+    owner: "identity",
+    operation: "binding_revalidation",
+    bindingId: "binding_1",
+    issuedAt: NOW,
+    expiresAt: TOMORROW,
+  };
+}
+
+function validTemplateReceipt(templateId = "template_1") {
+  return {
+    receiptId: "receipt_template_1",
+    owner: "communications",
+    operation: "template_internal_approval",
+    resourceId: templateId,
+    issuedAt: NOW,
+    expiresAt: TOMORROW,
+  };
+}
+
+function createRepository(overrides: Record<string, unknown> = {}) {
+  const { MemoryCommunicationsRepository } = runtimeApi();
+  return new MemoryCommunicationsRepository({
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
+    consents: [
+      {
+        bindingId: "binding_1",
+        purpose: "transactional",
+        state: "granted",
+        version: 1,
+        receipt: {
+          receiptId: "consent_receipt_1",
+          owner: "consent",
+          operation: "consent_confirmation",
+          bindingId: "binding_1",
+          issuedAt: NOW,
+          expiresAt: TOMORROW,
+        },
+        changedAt: NOW,
+      },
+    ],
+    connections: [{ channel: "whatsapp", state: "active" }],
+    templates: [
+      {
+        templateId: "template_1",
+        locale: "en",
+        definitionVersion: 1,
+        internallyApproved: true,
+        providerState: "provider_approved",
+        providerVersion: 1,
+        updatedAt: NOW,
+      },
+    ],
+    ...overrides,
+  });
+}
+
+function createService(options: Record<string, unknown> = {}) {
+  const { CommunicationsService } = runtimeApi();
+  const repository = (options.repository as any) ?? createRepository();
+  const digestCalls: Array<{ key: string; payload: string }> = [];
+  let id = 0;
+  const dependencies = {
+    repository,
+    clock: { now: () => NOW },
+    ids: { next: (kind: string) => `${kind}_${++id}` },
+    endpointDigestKeys: {
+      resolve: async () => ({
+        status: "available",
+        active: {
+          purpose: "communications_endpoint_digest",
+          version: "v2",
+          key: "SERVER_KEY_V2",
+        },
+        prior: [
+          {
+            purpose: "communications_endpoint_digest",
+            version: "v1",
+            key: "SERVER_KEY_V1",
+          },
+        ],
+      }),
+    },
+    keyedDigest: {
+      digest: async ({ key, payload }: { key: string; payload: string }) => {
+        digestCalls.push({ key, payload });
+        return key.endsWith("V2") ? "endpoint_digest_v2" : "endpoint_digest_v1";
+      },
+    },
+    destinationResolver: {
+      resolve: async () => ({ status: "resolved", endpoint: "raw:endpoint:synthetic" }),
+    },
+    boundedExecutor: {
+      run: async (_operation: string, _timeoutMs: number, action: () => Promise<unknown>) =>
+        action(),
+    },
+    provider: {
+      dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
+    },
+    publicKnowledge: {
+      answer: async () => ({
+        status: "available",
+        text: "Synthetic public answer",
+        sourceReceipt: "knowledge_receipt_1",
+      }),
+    },
+    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
+    handoff: {
+      request: async () => ({
+        status: "queued",
+        receipt: {
+          receiptId: "handoff_receipt_1",
+          owner: "communications",
+          operation: "handoff",
+          resourceId: "conversation_1",
+          idempotencyKey: "handoff_key_1",
+          issuedAt: NOW,
+          expiresAt: TOMORROW,
+        },
+      }),
+    },
+    providerTimeoutMs: 2_000,
+    knowledgeTimeoutMs: 500,
+    handoffTimeoutMs: 500,
+    ...options,
+    repository,
+  };
+  return {
+    repository,
+    service: new CommunicationsService(dependencies),
+    digestCalls,
+  };
+}
+
+async function acceptInbound(service: any, overrides: Record<string, unknown> = {}) {
+  return service.acceptInbound({
+    connectionId: "connection_1",
+    providerEventId: "provider_event_1",
+    providerBodyDigest: "provider_body_digest_1",
+    endpoint: "raw:endpoint:synthetic",
+    envelope: envelope(),
+    optOutSignal: "none",
+    ...overrides,
+  });
+}
+
+async function queueOutbound(service: any, overrides: Record<string, unknown> = {}) {
+  return service.queueOutbound({
+    channel: "whatsapp",
+    locale: "en",
+    conversationId: "conversation_1",
+    bindingId: "binding_1",
+    body: "Synthetic outbound message",
+    purpose: "transactional",
+    templateId: "template_1",
+    idempotencyKey: "outbound_key_1",
+    fingerprint: "outbound_fingerprint_1",
+    requiredPolicyVersion: 7,
+    requiredFence: 42,
+    authorizationReceipt: {
+      receiptId: "dispatch_receipt_1",
+      owner: "communications",
+      operation: "outbound_dispatch",
+      bindingId: "binding_1",
+      destinationKey: "endpoint_digest_v2",
+      issuedAt: NOW,
+      expiresAt: TOMORROW,
+    },
+    correlationId: "correlation_out_1",
+    ...overrides,
+  });
+}
+
+describe("canonical inbound and application behavior", () => {
+  it("persists one replayable canonical envelope and fails closed on mismatched replay", async () => {
+    const { repository, service } = createService();
+
+    const accepted = await acceptInbound(service);
+    const duplicate = await acceptInbound(service);
+    const mismatch = await acceptInbound(service, { providerBodyDigest: "different_digest" });
+
+    expect(accepted).toMatchObject({ status: "accepted", eventId: "event_1" });
+    expect(duplicate).toMatchObject({ status: "duplicate", eventId: "event_1" });
+    expect(mismatch).toEqual({ status: "replay_mismatch", code: "provider_replay_mismatch" });
+    expect(repository.referenceState().inbound).toHaveLength(1);
+    expect(repository.referenceState().inbound[0]?.envelope).toEqual(envelope());
+  });
+
+  it("establishes opt_out_pending atomically and prioritizes it before knowledge", async () => {
+    let knowledgeCalls = 0;
+    const fixture = createService({
+      publicKnowledge: {
+        answer: async () => {
+          knowledgeCalls += 1;
+          return { status: "available", text: "must not be used", sourceReceipt: "receipt" };
+        },
+      },
+    });
+    await acceptInbound(fixture.service, { optOutSignal: "pending" });
+
+    const result = await fixture.service.processInbound({
+      eventId: "event_1",
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+      requiredPolicyVersion: 8,
+      action: "public_knowledge",
+      prompt: "Synthetic question",
+    });
+
+    expect(result).toEqual({ status: "opt_out_pending", eventId: "event_1" });
+    expect(knowledgeCalls).toBe(0);
+    expect(fixture.repository.referenceState().policies[0]).toMatchObject({
+      state: "opt_out_pending",
+      version: 8,
+      fence: 43,
+    });
+  });
+
+  it("rejects processing against a stale policy version", async () => {
+    const fixture = createService();
+    await acceptInbound(fixture.service);
+
+    await expect(
+      fixture.service.processInbound({
+        eventId: "event_1",
+        leaseOwner: "worker_1",
+        leaseExpiresAt: LATER,
+        requiredPolicyVersion: 6,
+        action: "public_knowledge",
+        prompt: "Synthetic question",
+      }),
+    ).resolves.toEqual({ status: "conflict", code: "policy_version_mismatch" });
+  });
+
+  it("maps disabled knowledge and absent handoff receipts to honest manual outcomes", async () => {
+    const disabled = createService({
+      publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
+    });
+    await acceptInbound(disabled.service);
+    expect(
+      await disabled.service.processInbound({
+        eventId: "event_1",
+        leaseOwner: "worker_1",
+        leaseExpiresAt: LATER,
+        requiredPolicyVersion: 7,
+        action: "public_knowledge",
+        prompt: "Synthetic question",
+      }),
+    ).toEqual({ status: "manual", code: "knowledge_unavailable" });
+
+    const noReceipt = createService({
+      handoff: { request: async () => ({ status: "queued" }) },
+    });
+    await acceptInbound(noReceipt.service);
+    expect(
+      await noReceipt.service.processInbound({
+        eventId: "event_1",
+        leaseOwner: "worker_2",
+        leaseExpiresAt: LATER,
+        requiredPolicyVersion: 7,
+        action: "handoff",
+        idempotencyKey: "handoff_key_1",
+      }),
+    ).toEqual({ status: "manual", code: "handoff_receipt_missing" });
+  });
+
+  it("rejects prohibited generated copy without persisting an outbound command", async () => {
+    const fixture = createService({
+      publicKnowledge: {
+        answer: async () => ({
+          status: "available",
+          text: "Send private identity and payment details here",
+          sourceReceipt: "knowledge_receipt_1",
+        }),
+      },
+      contentPolicy: { evaluate: () => ({ allowed: false, code: "protected_content" }) },
+    });
+    await acceptInbound(fixture.service);
+
+    const result = await fixture.service.processInbound({
+      eventId: "event_1",
+      leaseOwner: "worker_1",
+      leaseExpiresAt: LATER,
+      requiredPolicyVersion: 7,
+      action: "public_knowledge",
+      prompt: "Synthetic question",
+    });
+
+    expect(result).toEqual({ status: "manual", code: "prohibited_content" });
+    expect(fixture.repository.referenceState().outbound).toEqual([]);
+  });
+});
+
+describe("receipt-gated consent, binding and template behavior", () => {
+  it("requires receipts for consent grant and re-consent after withdrawal", async () => {
+    const repository = createRepository({ consents: [] });
+
+    expect(
+      await repository.grantConsentFromReceipt({
+        bindingId: "binding_1",
+        purpose: "transactional",
+        operation: "consent_grant",
+        now: NOW,
+      }),
+    ).toEqual({ status: "denied", code: "authority_receipt_missing" });
+    expect(
+      await repository.grantConsentFromReceipt({
+        bindingId: "binding_1",
+        purpose: "transactional",
+        operation: "consent_grant",
+        receipt: validConsentReceipt(),
+        now: NOW,
+      }),
+    ).toMatchObject({ status: "changed", state: "granted", version: 1 });
+    await repository.withdrawContact({ bindingId: "binding_1", now: LATER });
+    expect(
+      await repository.grantConsentFromReceipt({
+        bindingId: "binding_1",
+        purpose: "transactional",
+        operation: "consent_grant",
+        receipt: validConsentReceipt(),
+        now: LATER,
+      }),
+    ).toEqual({ status: "denied", code: "reconsent_receipt_required" });
+    expect(
+      await repository.grantConsentFromReceipt({
+        bindingId: "binding_1",
+        purpose: "transactional",
+        operation: "reconsent",
+        receipt: { ...validConsentReceipt("reconsent"), issuedAt: LATER },
+        now: LATER,
+      }),
+    ).toMatchObject({ status: "changed", state: "granted", version: 3 });
+    expect(repository.referenceState().consentHistory).toHaveLength(3);
+  });
+
+  it("suspends expired or reassigned bindings and clears suspension only from identity receipt", async () => {
+    const repository = createRepository();
+
+    expect(
+      await repository.suspendBinding({
+        bindingId: "binding_1",
+        reason: "reassigned",
+        now: LATER,
+      }),
+    ).toMatchObject({ status: "changed", trustState: "suspended" });
+    expect(
+      await repository.revalidateBindingFromReceipt({
+        bindingId: "binding_1",
+        freshUntil: TOMORROW,
+        now: LATER,
+      }),
+    ).toEqual({ status: "denied", code: "authority_receipt_missing" });
+    expect(
+      await repository.revalidateBindingFromReceipt({
+        bindingId: "binding_1",
+        freshUntil: TOMORROW,
+        receipt: { ...validBindingReceipt(), issuedAt: LATER },
+        now: LATER,
+      }),
+    ).toMatchObject({ status: "changed", trustState: "reverified" });
+  });
+
+  it("requires an approval receipt and keeps provider template projections monotonic", async () => {
+    const { CanonicalMessageTemplateService } = runtimeApi();
+    const repository = createRepository({ templates: [] });
+    const templates = new CanonicalMessageTemplateService({
+      repository,
+      clock: { now: () => NOW },
+      allowSyntheticDefinitions: true,
+    });
+
+    expect(
+      await templates.registerInternalDefinition({
+        templateId: "template_1",
+        locale: "en",
+        definitionVersion: 1,
+        synthetic: true,
+      }),
+    ).toMatchObject({ status: "registered", internallyApproved: false });
+    expect(
+      await templates.recordInternalApproval({ templateId: "template_1" }),
+    ).toEqual({ status: "denied", code: "approval_receipt_missing" });
+    expect(
+      await templates.applyProviderProjection({
+        templateId: "template_1",
+        locale: "en",
+        providerState: "provider_approved",
+        providerVersion: 2,
+        now: NOW,
+      }),
+    ).toMatchObject({ status: "applied", internallyApproved: false });
+    expect(
+      await templates.evaluateEligibility({ templateId: "template_1", locale: "en" }),
+    ).toEqual({ eligible: false, code: "internal_approval_required" });
+    expect(
+      await templates.recordInternalApproval({
+        templateId: "template_1",
+        receipt: validTemplateReceipt(),
+      }),
+    ).toMatchObject({ status: "approved", internallyApproved: true });
+    expect(
+      await templates.applyProviderProjection({
+        templateId: "template_1",
+        locale: "en",
+        providerState: "paused",
+        providerVersion: 3,
+        now: LATER,
+      }),
+    ).toMatchObject({ status: "applied", providerState: "paused", providerVersion: 3 });
+    expect(
+      await templates.applyProviderProjection({
+        templateId: "template_1",
+        locale: "en",
+        providerState: "provider_approved",
+        providerVersion: 2,
+        now: LATER,
+      }),
+    ).toMatchObject({ status: "regressive", providerState: "paused", providerVersion: 3 });
+  });
+
+  it("keeps runtime template registration closed when policy/copy gates are unresolved", async () => {
+    const { CanonicalMessageTemplateService } = runtimeApi();
+    const templates = new CanonicalMessageTemplateService({
+      repository: createRepository({ templates: [] }),
+      clock: { now: () => NOW },
+    });
+
+    await expect(
+      templates.registerInternalDefinition({
+        templateId: "runtime_template",
+        locale: "en",
+        definitionVersion: 1,
+        synthetic: false,
+      }),
+    ).resolves.toEqual({ status: "unavailable", code: "runtime_registration_disabled" });
+  });
+});
+
+describe("endpoint digest isolation and fail-closed dependencies", () => {
+  it("uses active and bounded prior endpoint keys with communications-only domain separation", async () => {
+    const fixture = createService();
+
+    const result = await acceptInbound(fixture.service);
+
+    expect(result).toMatchObject({
+      status: "accepted",
+      endpointDigestVersion: "v2",
+      endpointDigest: "endpoint_digest_v2",
+    });
+    expect(fixture.digestCalls).toHaveLength(2);
+    expect(fixture.digestCalls.map((call) => call.payload)).toEqual([
+      "communications:endpoint-digest:v1\u0000raw:endpoint:synthetic",
+      "communications:endpoint-digest:v1\u0000raw:endpoint:synthetic",
+    ]);
+    const serialized = JSON.stringify({ result, state: fixture.repository.referenceState() });
+    expect(serialized).not.toContain("SERVER_KEY");
+    expect(serialized).not.toContain("raw:endpoint:synthetic");
+  });
+
+  it.each([
+    [{ status: "unavailable" }, "endpoint_digest_key_unavailable"],
+    [
+      {
+        status: "available",
+        active: { purpose: "webhook_signature", version: "v2", key: "wrong" },
+        prior: [],
+      },
+      "endpoint_digest_key_invalid",
+    ],
+    [
+      {
+        status: "available",
+        active: {
+          purpose: "communications_endpoint_digest",
+          version: "v2",
+          key: "active",
+        },
+        prior: [
+          {
+            purpose: "communications_endpoint_digest",
+            version: "v2",
+            key: "duplicate_version",
+          },
+        ],
+      },
+      "endpoint_digest_key_invalid",
+    ],
+  ] as const)("fails closed for unavailable or invalid digest key rings", async (resolved, code) => {
+    const fixture = createService({ endpointDigestKeys: { resolve: async () => resolved } });
+
+    expect(await acceptInbound(fixture.service)).toEqual({ status: "unavailable", code });
+    expect(fixture.repository.referenceState().inbound).toEqual([]);
+  });
+
+  it("fails closed when destination resolution is disabled", async () => {
+    const fixture = createService({
+      destinationResolver: { resolve: async () => ({ status: "unavailable" }) },
+    });
+
+    expect(await queueOutbound(fixture.service)).toEqual({
+      status: "unavailable",
+      code: "destination_unavailable",
+    });
+    expect(fixture.repository.referenceState().outbound).toEqual([]);
+  });
+});
```
