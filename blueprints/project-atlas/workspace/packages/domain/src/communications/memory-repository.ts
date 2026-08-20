import { evaluateAuthorityChange, evaluateOutboundPolicy } from "./channel-policy.ts";
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
  EvaluateTemplateEligibility,
  GrantConsentCommand,
  InboundClaimResult,
  MarkDispatchOutcomeCommand,
  OutboundClaimResult,
  ProviderStatusResult,
  RecoveryCandidate,
  RecoveryQuery,
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
  state: "persisted" | "applied" | "manual_review" | "dead_letter";
  leaseOwner?: string;
  leaseVersion: number;
  leaseExpiresAt?: Date;
};

type OutboundRecord = CreateOutboundCommand & {
  state: OutboundCommandState;
  leaseOwner?: string;
  leaseVersion: number;
  leaseExpiresAt?: Date;
  blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
};

type AttemptRecord = OutboundDispatchAttempt & {
  leaseOwner: string;
  leaseVersion: number;
  providerReference?: string;
};

type LockOperation =
  | "accept_inbound"
  | "claim_outbound"
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

function clone<T>(value: T): T {
  return structuredClone(value);
}

function currentReceipt(input: {
  issuedAt: Date;
  expiresAt: Date;
}, now: Date): boolean {
  return (
    Number.isFinite(input.issuedAt.getTime()) &&
    Number.isFinite(input.expiresAt.getTime()) &&
    input.issuedAt <= now &&
    input.expiresAt > now
  );
}

export class MemoryCommunicationsRepository implements CommunicationsRepository {
  private readonly inboundByReplay = new Map<string, InboundRecord>();
  private readonly inboundById = new Map<string, InboundRecord>();
  private readonly outboundById = new Map<string, OutboundRecord>();
  private readonly outboundByIdempotency = new Map<string, OutboundRecord>();
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly policies = new Map<string, ChannelContactPolicy & { fence: number }>();
  private readonly bindings = new Map<
    string,
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
  private readonly bindingLockTails = new Map<string, Promise<void>>();
  private readonly lockBoundary?: MemoryCommunicationsRepositoryOptions["lockBoundary"];

  constructor(options: MemoryCommunicationsRepositoryOptions = {}) {
    this.lockBoundary = options.lockBoundary;
    for (const binding of options.bindings ?? []) {
      this.bindings.set(binding.bindingId, clone(binding));
    }
    for (const policy of options.policies ?? []) {
      this.policies.set(policy.bindingId, clone(policy));
    }
    for (const consent of options.consents ?? []) {
      this.consents.set(this.consentKey(consent.bindingId, consent.purpose), clone(consent));
    }
    for (const connection of options.connections ?? []) {
      this.connections.set(connection.channel, clone(connection));
    }
    for (const template of options.templates ?? []) {
      this.templates.set(this.templateKey(template.templateId, template.locale), clone(template));
    }
  }

  async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
    return this.withBindingLock(input.envelope.event.bindingId, "accept_inbound", async () => {
      const replayKey = `${input.connectionId}\u0000${input.providerEventId}`;
      const existing = this.inboundByReplay.get(replayKey);
      if (existing) {
        if (existing.providerBodyDigest !== input.providerBodyDigest) {
          return { status: "replay_mismatch", code: "provider_replay_mismatch" };
        }
        const activeDigest = existing.endpointDigests[0];
        if (!activeDigest) {
          return { status: "replay_mismatch", code: "provider_replay_mismatch" };
        }
        return {
          status: "duplicate",
          eventId: existing.envelope.event.eventId,
          endpointDigestVersion: activeDigest.version,
          endpointDigest: activeDigest.digest,
        };
      }

      const activeDigest = input.endpointDigests[0];
      if (!activeDigest || this.inboundById.has(input.envelope.event.eventId)) {
        return { status: "replay_mismatch", code: "provider_replay_mismatch" };
      }
      if (input.optOutSignal === "pending") {
        const policy = this.requirePolicy(input.envelope.event.bindingId, input.envelope.event.receivedAt);
        if (policy.state !== "opt_out_pending" && policy.state !== "withdrawn") {
          policy.state = "opt_out_pending";
          policy.version += 1;
          policy.fence += 1;
          policy.updatedAt = input.envelope.event.receivedAt;
        }
      }
      const record: InboundRecord = {
        replayKey,
        providerBodyDigest: input.providerBodyDigest,
        endpointDigests: clone(input.endpointDigests),
        envelope: clone(input.envelope),
        state: "persisted",
        leaseVersion: 0,
      };
      this.inboundByReplay.set(replayKey, record);
      this.inboundById.set(input.envelope.event.eventId, record);
      return {
        status: "accepted",
        eventId: input.envelope.event.eventId,
        endpointDigestVersion: activeDigest.version,
        endpointDigest: activeDigest.digest,
      };
    });
  }

  async claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult> {
    const record = this.inboundById.get(input.eventId);
    if (!record) return { status: "not_claimed", code: "not_found" };
    if (record.state !== "persisted") {
      return { status: "not_claimed", code: "already_completed" };
    }
    const policy = this.policies.get(record.envelope.event.bindingId);
    if (!policy || policy.version !== input.requiredPolicyVersion) {
      return { status: "not_claimed", code: "policy_version_mismatch" };
    }
    if (record.leaseOwner && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
      return { status: "not_claimed", code: "lease_conflict" };
    }
    record.leaseOwner = input.leaseOwner;
    record.leaseVersion += 1;
    record.leaseExpiresAt = input.leaseExpiresAt;
    return {
      status: "claimed",
      eventId: input.eventId,
      leaseVersion: record.leaseVersion,
      envelope: clone(record.envelope),
      policyState: policy.state,
    };
  }

  async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
    const record = this.inboundById.get(input.eventId);
    if (
      !record ||
      record.state !== "persisted" ||
      record.leaseOwner !== input.leaseOwner ||
      record.leaseVersion !== input.leaseVersion
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
      return existing.fingerprint === input.fingerprint
        ? {
            status: "duplicate",
            commandId: existing.command.commandId,
            messageId: existing.message.id,
          }
        : { status: "conflict", code: "idempotency_mismatch" };
    }
    const record: OutboundRecord = {
      ...clone(input),
      state: "queued",
      leaseVersion: 0,
    };
    record.command.state = "queued";
    this.outboundById.set(record.command.commandId, record);
    this.outboundByIdempotency.set(record.command.idempotencyKey, record);
    return {
      status: "created",
      commandId: record.command.commandId,
      messageId: record.message.id,
    };
  }

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
        return { status: "not_claimed", code: record.blockedCode };
      }
      if (record.state === "dispatching") {
        return { status: "not_claimed", code: "lease_conflict" };
      }
      if (record.state !== "queued") {
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
      const activeDigest = record.endpointDigests[0];
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
        requiredPolicyVersion: record.requiredPolicyVersion,
        requiredFence: record.requiredFence,
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
      });
      if (!decision.allowed) return { status: "not_claimed", code: decision.code };

      record.state = "dispatching";
      record.command.state = "dispatching";
      record.leaseOwner = input.leaseOwner;
      record.leaseVersion += 1;
      record.leaseExpiresAt = input.leaseExpiresAt;
      const attempt: AttemptRecord = {
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
    const record = this.outboundById.get(input.commandId);
    const attempt = this.attempts.get(input.attemptId);
    if (
      !record ||
      !attempt ||
      record.state !== "dispatching" ||
      attempt.state !== "dispatching" ||
      record.leaseOwner !== input.leaseOwner ||
      record.leaseVersion !== input.leaseVersion ||
      attempt.leaseOwner !== input.leaseOwner ||
      attempt.leaseVersion !== input.leaseVersion
    ) {
      return "conflict";
    }
    const state: OutboundCommandState =
      input.outcome === "accepted"
        ? "provider_accepted"
        : input.outcome === "unknown"
          ? "dispatch_unknown"
          : "failed";
    record.state = state;
    record.command.state = state;
    record.leaseOwner = undefined;
    record.leaseExpiresAt = undefined;
    attempt.state = state;
    attempt.completedAt = input.now;
    attempt.providerReference = input.providerReference;
    return "completed";
  }

  async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
    const record = this.outboundById.get(input.commandId);
    if (!record) return { status: "not_found" };
    const eventKey = `${input.commandId}\u0000${input.providerEventId}`;
    if (this.providerStatuses.has(eventKey)) {
      return { status: "duplicate", commandState: record.state };
    }
    this.providerStatuses.set(eventKey, clone(input));
    if (input.status === "failed") {
      if (["provider_accepted", "dispatching", "queued"].includes(record.state)) {
        record.state = "failed";
        record.command.state = "failed";
        return { status: "applied", commandState: "failed" };
      }
      return { status: "regressive", commandState: record.state };
    }
    const currentRank =
      record.state === "sent" || record.state === "delivered" || record.state === "read"
        ? DELIVERY_RANK[record.state]
        : 0;
    if (DELIVERY_RANK[input.status] <= currentRank) {
      return { status: "regressive", commandState: record.state };
    }
    if (["failed", "expired", "cancelled", "manual_review"].includes(record.state)) {
      return { status: "regressive", commandState: record.state };
    }
    record.state = input.status;
    record.command.state = input.status;
    return { status: "applied", commandState: input.status };
  }

  async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
    return this.withBindingLock(input.bindingId, "grant_consent", async () => {
      const authority = evaluateAuthorityChange({
        operation: input.operation,
        bindingId: input.bindingId,
        receipt: input.receipt,
        now: input.now,
      });
      if (!authority.allowed) return { status: "denied", code: authority.code };
      const key = this.consentKey(input.bindingId, input.purpose);
      const current = this.consents.get(key);
      if (current?.state === "withdrawn" && input.operation !== "reconsent") {
        return { status: "denied", code: "reconsent_receipt_required" };
      }
      if (current?.state === "granted" && current.authorityReceiptId === input.receipt?.receiptId) {
        return { status: "duplicate", state: "granted", version: current.version };
      }
      const next: ConsentRecord = {
        bindingId: input.bindingId,
        purpose: input.purpose,
        state: "granted",
        version: (current?.version ?? 0) + 1,
        receipt: {
          receiptId: input.receipt!.receiptId,
          owner: "consent",
          operation: "consent_confirmation",
          bindingId: input.bindingId,
          issuedAt: input.receipt!.issuedAt,
          expiresAt: input.receipt!.expiresAt,
        },
        authorityReceiptId: input.receipt!.receiptId,
        changedAt: input.now,
      };
      this.consents.set(key, next);
      this.consentHistory.push(clone(next));
      return { status: "changed", state: "granted", version: next.version };
    });
  }

  async withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult> {
    return this.withBindingLock(input.bindingId, "withdraw_contact", async () => {
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
        this.consents.set(key, withdrawn);
        this.consentHistory.push(clone(withdrawn));
      }
      const cancelledCommandIds: string[] = [];
      for (const outbound of this.outboundById.values()) {
        if (outbound.command.bindingId !== input.bindingId || outbound.state !== "queued") continue;
        outbound.state = "cancelled";
        outbound.command.state = "cancelled";
        outbound.blockedCode = "contact_policy_denied";
        cancelledCommandIds.push(outbound.command.commandId);
      }
      return {
        status: "changed",
        state: "withdrawn",
        policyVersion: policy.version,
        fence: policy.fence,
        cancelledCommandIds,
      };
    });
  }

  async resolveAmbiguousOptOutFromReceipt(
    input: ResolveOptOutCommand,
  ): Promise<ConsentChangeResult> {
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
      return { status: "changed", state: "granted", version: policy.version };
    });
  }

  async suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult> {
    return this.withBindingLock(input.bindingId, "suspend_binding", async () => {
      const binding = this.bindings.get(input.bindingId);
      if (!binding) return { status: "denied", code: "binding_not_found" };
      if (binding.trustState === "suspended") {
        return { status: "duplicate", trustState: "suspended" };
      }
      binding.trustState = "suspended";
      binding.updatedAt = input.now;
      binding.freshUntil = input.now;
      return { status: "changed", trustState: "suspended" };
    });
  }

  async revalidateBindingFromReceipt(
    input: RevalidateBindingCommand,
  ): Promise<BindingChangeResult> {
    return this.withBindingLock(input.bindingId, "revalidate_binding", async () => {
      const binding = this.bindings.get(input.bindingId);
      if (!binding) return { status: "denied", code: "binding_not_found" };
      const authority = evaluateAuthorityChange({
        operation: "binding_revalidation",
        bindingId: input.bindingId,
        receipt: input.receipt,
        now: input.now,
      });
      if (!authority.allowed) return { status: "denied", code: authority.code };
      if (!Number.isFinite(input.freshUntil.getTime()) || input.freshUntil <= input.now) {
        return { status: "denied", code: "freshness_invalid" };
      }
      binding.trustState = "reverified";
      binding.updatedAt = input.now;
      binding.freshUntil = input.freshUntil;
      return { status: "changed", trustState: "reverified" };
    });
  }

  async registerTemplateDefinition(
    input: RegisterTemplateDefinition & { now: Date },
  ): Promise<TemplateResult> {
    const key = this.templateKey(input.templateId, input.locale);
    const existing = this.templates.get(key);
    if (existing) {
      if (existing.definitionVersion !== input.definitionVersion) {
        return { status: "denied", code: "definition_conflict" };
      }
      return { status: "duplicate", ...clone(existing) };
    }
    const template: TemplateRecord = {
      templateId: input.templateId,
      locale: input.locale,
      definitionVersion: input.definitionVersion,
      internallyApproved: false,
      providerState: "draft",
      providerVersion: 0,
      updatedAt: input.now,
    };
    this.templates.set(key, template);
    return { status: "registered", ...clone(template) };
  }

  async approveTemplateDefinition(
    input: ApproveTemplateDefinition & { now: Date },
  ): Promise<TemplateResult> {
    const receipt = input.receipt;
    if (!receipt) return { status: "denied", code: "approval_receipt_missing" };
    if (
      receipt.owner !== "communications" ||
      receipt.operation !== "template_internal_approval" ||
      receipt.resourceId !== input.templateId ||
      !currentReceipt(receipt, input.now)
    ) {
      return { status: "denied", code: "approval_receipt_invalid" };
    }
    const template = [...this.templates.values()].find(
      (candidate) => candidate.templateId === input.templateId,
    );
    if (!template) return { status: "not_found", code: "template_not_found" };
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
    const template = this.templates.get(this.templateKey(input.templateId, input.locale));
    if (!template) return { status: "not_found", code: "template_not_found" };
    if (input.providerVersion < template.providerVersion) {
      return { status: "regressive", ...clone(template) };
    }
    if (input.providerVersion === template.providerVersion) {
      return { status: "duplicate", ...clone(template) };
    }
    template.providerState = input.providerState;
    template.providerVersion = input.providerVersion;
    template.updatedAt = input.now;
    return { status: "applied", ...clone(template) };
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
        candidates.push({ kind: "inbound_lease_expired", eventId: inbound.envelope.event.eventId });
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
        state: record.state,
        leaseVersion: record.leaseVersion,
      })),
      attempts: [...this.attempts.values()],
      policies: [...this.policies.values()],
      bindings: [...this.bindings.values()],
      consentHistory: this.consentHistory,
      templates: [...this.templates.values()],
      providerStatuses: [...this.providerStatuses.values()],
    });
  }

  private consentKey(bindingId: string, purpose: string): string {
    return `${bindingId}\u0000${purpose}`;
  }

  private templateKey(templateId: string, locale: string): string {
    return `${templateId}\u0000${locale}`;
  }

  private requirePolicy(
    bindingId: string,
    now: Date,
  ): ChannelContactPolicy & { fence: number } {
    const existing = this.policies.get(bindingId);
    if (existing) return existing;
    const created: ChannelContactPolicy & { fence: number } = {
      policyId: `policy_${bindingId}`,
      bindingId,
      state: "normal",
      version: 0,
      fence: 0,
      updatedAt: now,
    };
    this.policies.set(bindingId, created);
    return created;
  }

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
    this.bindingLockTails.set(bindingId, current);
    await previous;
    try {
      await this.lockBoundary?.({ bindingId, operation });
      return await action();
    } finally {
      release();
      if (this.bindingLockTails.get(bindingId) === current) {
        this.bindingLockTails.delete(bindingId);
      }
    }
  }
}
