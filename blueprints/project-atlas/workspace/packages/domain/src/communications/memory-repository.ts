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
  DeadLetterExpiredInboundCommand,
  DeadLetterExpiredInboundResult,
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
import {
  sameVerifiedProviderStatusRecord,
  type VerifiedProviderStatusReceiptRecord,
  type VerifiedProviderStatusReceiptResolver,
} from "./provider-status.ts";
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
  ordinal: number;
  state: "persisted" | "applied" | "manual_review" | "dead_letter";
  leaseOwnerHash?: string;
  leaseVersion: number;
  leaseExpiresAt?: Date;
};

type OutboundRecord = CreateOutboundCommand & {
  messageBodyDigest: string;
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
  | "dead_letter_inbound"
  | "apply_provider_status"
  | "reconcile_outbound"
  | "withdraw_contact"
  | "grant_consent"
  | "resolve_opt_out"
  | "suspend_binding"
  | "revalidate_binding";

export type MemoryCommunicationsRepositoryOptions = CommunicationsSeed & {
  lockBoundary?: (input: { bindingId: string; operation: LockOperation }) => Promise<void>;
  providerStatusReceiptResolver?: VerifiedProviderStatusReceiptResolver;
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
}

function metadataOnlyMessage(
  message: CreateOutboundCommand["message"],
): CreateOutboundCommand["message"] {
  return { ...clone(message), body: null };
}

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
  private readonly providerStatuses = new Map<string, VerifiedProviderStatusReceiptRecord>();
  private readonly withdrawalHistory: WithdrawalHistoryRecord[] = [];
  private readonly reconciliationReceipts = new Map<string, StoredReconciliationReceipt>();
  private readonly bindingLockTails = new Map<string, Promise<void>>();
  private readonly lockBoundary?: MemoryCommunicationsRepositoryOptions["lockBoundary"];
  private readonly providerStatusReceiptResolver: VerifiedProviderStatusReceiptResolver;

  constructor(options: MemoryCommunicationsRepositoryOptions = {}) {
    this.lockBoundary = options.lockBoundary;
    this.providerStatusReceiptResolver = options.providerStatusReceiptResolver ?? {
      resolve: () => null,
    };
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
        if (
          existing.providerBodyDigest !== input.providerBodyDigest ||
          existing.envelope.event.bindingId !== input.envelope.event.bindingId
        ) {
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
        envelope: metadataOnlyEnvelope(input.envelope),
        ordinal:
          [...this.inboundById.values()].filter(
            (candidate) => candidate.envelope.event.conversationId === input.envelope.event.conversationId,
          ).length + 1,
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
    return this.withBindingLock(record.envelope.event.bindingId, "claim_inbound", async () => {
      if (record.state !== "persisted") {
        return { status: "not_claimed", code: "already_completed" };
      }
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

  async deadLetterExpiredInbound(
    input: DeadLetterExpiredInboundCommand,
  ): Promise<DeadLetterExpiredInboundResult> {
    const found = this.inboundById.get(input.eventId);
    if (!found) return { status: "conflict", code: "not_found" };
    return this.withBindingLock<DeadLetterExpiredInboundResult>(
      found.envelope.event.bindingId,
      "dead_letter_inbound",
      async () => {
      const record = this.inboundById.get(input.eventId);
      if (!record) return { status: "conflict", code: "not_found" };
      if (record.state === "dead_letter") return { status: "already_terminal" };
      if (record.state !== "persisted") return { status: "conflict", code: "state_changed" };
      if (
        !Number.isSafeInteger(input.expectedAttempts) ||
        input.expectedAttempts < 1 ||
        record.leaseVersion !== input.expectedAttempts
      ) {
        return { status: "conflict", code: "version_mismatch" };
      }
      if (
        input.reason !== "retry_exhausted" ||
        !Number.isFinite(input.now.getTime()) ||
        !record.leaseExpiresAt ||
        record.leaseExpiresAt > input.now
      ) {
        return { status: "conflict", code: "lease_not_expired" };
      }
      record.state = "dead_letter";
      record.leaseVersion += 1;
      record.leaseOwnerHash = undefined;
      record.leaseExpiresAt = undefined;
        return { status: "dead_lettered" };
      },
    );
  }

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
    if (!record || record.state !== "draft" || !activeDigest) {
      return { status: "conflict", code: "idempotency_mismatch" };
    }
    const binding = this.bindings.get(record.command.bindingId);
    const policy = this.policies.get(record.command.bindingId);
    const consent = this.consents.get(this.consentKey(record.command.bindingId, record.purpose));
    const connection = this.connections.get(record.command.channel);
    const template = this.templates.get(this.templateKey(record.templateId, record.command.locale));
    if (!binding || !policy || !consent) {
      return { status: "conflict", code: "idempotency_mismatch" };
    }
    const decision = evaluateOutboundPolicy({
      purpose: record.purpose,
      binding: {
        bindingId: binding.bindingId,
        trustState: binding.trustState,
        freshUntil: binding.freshUntil,
      },
      contactPolicy: { state: policy.state, version: policy.version, fence: policy.fence },
      requiredPolicyVersion: input.requiredPolicyVersion,
      requiredFence: input.requiredFence,
      consent: { state: consent.state, receipt: consent.receipt },
      connectionState: connection?.state ?? "disabled",
      template: {
        eligible: Boolean(
          template?.internallyApproved && template.providerState === "provider_approved",
        ),
      },
      authorizationReceipt: input.authorizationReceipt,
      destinationKey: canonicalEndpointReference(activeDigest.digest),
      now: input.now,
    });
    if (!decision.allowed) return { status: "conflict", code: "idempotency_mismatch" };
    record.fingerprint = input.fingerprint;
    record.requiredPolicyVersion = input.requiredPolicyVersion;
    record.requiredFence = input.requiredFence;
    record.endpointDigests = clone(input.endpointDigests);
    record.authorizationReceipt = clone(input.authorizationReceipt);
    record.state = "queued";
    record.command.state = "queued";
    return {
      status: "created",
      commandId: record.command.commandId,
      messageId: record.message.id,
    };
  }

  async failOutboundDraft(
    input: FailOutboundDraftCommand,
  ): Promise<"completed" | "conflict"> {
    const record = this.outboundById.get(input.commandId);
    if (!record || record.state !== "draft") return "conflict";
    record.state = "failed";
    record.command.state = "failed";
    record.failureCode = input.code;
    return "completed";
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
      if (!validClaimLease(input.now, input.leaseExpiresAt)) {
        return { status: "not_claimed", code: "lease_conflict" };
      }
      const binding = this.bindings.get(record.command.bindingId);
      if (!binding) return { status: "not_claimed", code: "binding_not_found" };
      const policy = this.policies.get(record.command.bindingId);
      if (!policy) return { status: "not_claimed", code: "policy_not_found" };
      const consent = this.consents.get(this.consentKey(record.command.bindingId, record.purpose));
      if (!consent) return { status: "not_claimed", code: "consent_not_found" };
      const connection = this.connections.get(record.command.channel);
      const template = this.templates.get(this.templateKey(record.templateId, record.command.locale));
      const activeDigest = record.endpointDigests?.[0];
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
        requiredPolicyVersion: record.requiredPolicyVersion!,
        requiredFence: record.requiredFence!,
        consent: { state: consent.state, receipt: consent.receipt },
        connectionState: connection?.state ?? "disabled",
        template: {
          eligible: Boolean(
            template?.internallyApproved && template.providerState === "provider_approved",
          ),
        },
        authorizationReceipt: record.authorizationReceipt,
        destinationKey: canonicalEndpointReference(activeDigest.digest),
        now: input.now,
      });
      if (!decision.allowed) return { status: "not_claimed", code: decision.code };

      record.state = "dispatching";
      record.command.state = "dispatching";
      const leaseOwnerHash = await sha256(input.leaseOwner);
      record.leaseOwnerHash = leaseOwnerHash;
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
        leaseOwnerHash,
        leaseVersion: record.leaseVersion,
        leaseExpiresAt: input.leaseExpiresAt,
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
    const found = this.outboundById.get(input.commandId);
    if (!found) return "conflict";
    return this.withBindingLock(found.command.bindingId, "complete_outbound", async () => {
      const record = this.outboundById.get(input.commandId);
      const attempt = this.attempts.get(input.attemptId);
      if (
        !record ||
        !attempt ||
        attempt.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
        attempt.leaseVersion !== input.leaseVersion ||
        !this.validLeaseCompletion(input.now, attempt.leaseExpiresAt)
      ) {
        return "conflict";
      }
      if (attempt.state !== "dispatching") {
        return input.outcome === "accepted" &&
          ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
          ["provider_accepted", "sent", "delivered", "read"].includes(record.state)
          ? "completed"
          : "conflict";
      }
      if (
        record.state !== "dispatching" ||
        record.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
        record.leaseVersion !== input.leaseVersion
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
      record.leaseOwnerHash = undefined;
      record.leaseExpiresAt = undefined;
      attempt.state = state;
      attempt.resultCode = input.outcome;
      attempt.completedAt = input.now;
      attempt.externalMessageReferenceDigest = input.providerReference
        ? await sha256(input.providerReference)
        : undefined;
      return "completed";
    });
  }

  async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
    const evidence = this.providerStatusReceiptResolver.resolve(input.receipt);
    if (!evidence) return { status: "denied", code: "verified_receipt_invalid" };

    const found = this.outboundById.get(input.commandId);
    if (!found) return { status: "not_found" };
    return this.withBindingLock(found.command.bindingId, "apply_provider_status", async () => {
      const record = this.outboundById.get(input.commandId)!;
      const attempt = this.attempts.get(input.attemptId);
      const connection = this.connections.get(record.command.channel);
      if (!attempt || attempt.commandId !== input.commandId) return { status: "not_found" };
      if (
        !connection ||
        connection.channel !== evidence.connectionId ||
        attempt.externalMessageReferenceDigest !== await sha256(evidence.externalMessageReference)
      ) {
        return { status: "denied", code: "provider_status_binding_mismatch" };
      }

      const receiptRecord: VerifiedProviderStatusReceiptRecord = {
        ...evidence,
        commandId: input.commandId,
        attemptId: input.attemptId,
        externalMessageReferenceDigest: await sha256(evidence.externalMessageReference),
      };
      const eventKey = `${evidence.connectionId}\u0000${evidence.providerEventId}`;
      const prior = this.providerStatuses.get(eventKey);
      if (prior) {
        return sameVerifiedProviderStatusRecord(prior, receiptRecord)
          ? { status: "duplicate", commandState: record.state }
          : { status: "conflict", code: "provider_status_replay_mismatch" };
      }
      this.providerStatuses.set(eventKey, clone(receiptRecord));
      if (evidence.status === "failed") {
        if (["provider_accepted", "dispatching", "queued"].includes(record.state)) {
          record.state = "failed";
          record.command.state = "failed";
          attempt.state = "failed";
          attempt.completedAt = clone(evidence.occurredAt);
          return { status: "applied", commandState: "failed" };
        }
        return { status: "regressive", commandState: record.state };
      }
      const currentRank =
        record.state === "sent" || record.state === "delivered" || record.state === "read"
          ? DELIVERY_RANK[record.state]
          : 0;
      if (DELIVERY_RANK[evidence.status] <= currentRank) {
        return { status: "regressive", commandState: record.state };
      }
      if (["failed", "expired", "cancelled", "manual_review"].includes(record.state)) {
        return { status: "regressive", commandState: record.state };
      }
      record.state = evidence.status;
      record.command.state = evidence.status;
      attempt.state = evidence.status;
      attempt.completedAt = clone(evidence.occurredAt);
      return { status: "applied", commandState: evidence.status };
    });
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
      const evidence = this.validateWithdrawalEvidence(input);
      if (evidence.status === "denied") return evidence;
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
      this.withdrawalHistory.push(evidence.record);
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
  ): Promise<import("./repository.ts").AmbiguousOptOutResolutionResult> {
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
      return {
        status: "changed",
        policyState: "normal_after_review",
        policyVersion: policy.version,
      };
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
      receipt.locale !== input.locale ||
      receipt.definitionVersion !== input.definitionVersion ||
      !currentReceipt(receipt, input.now)
    ) {
      return { status: "denied", code: "approval_receipt_invalid" };
    }
    const template = this.templates.get(this.templateKey(input.templateId, input.locale));
    if (!template) return { status: "not_found", code: "template_not_found" };
    if (template.definitionVersion !== input.definitionVersion) {
      return { status: "denied", code: "approval_receipt_invalid" };
    }
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
    if (!input.receipt) return { status: "denied", code: "provider_receipt_missing" };
    const template = this.templates.get(this.templateKey(input.templateId, input.locale));
    if (!template) return { status: "not_found", code: "template_not_found" };
    if (
      input.receipt.owner !== "communications" ||
      input.receipt.operation !== "template_provider_reconciliation" ||
      input.receipt.templateId !== input.templateId ||
      input.receipt.locale !== input.locale ||
      input.receipt.definitionVersion !== template.definitionVersion ||
      input.receipt.providerVersion !== input.providerVersion ||
      input.receipt.providerState !== input.providerState ||
      input.receipt.correlationId !== input.correlationId ||
      !currentReceipt(input.receipt, input.now)
    ) {
      return { status: "denied", code: "provider_receipt_invalid" };
    }
    if (input.providerVersion < template.providerVersion) {
      return { status: "regressive", ...clone(template) };
    }
    if (input.providerVersion === template.providerVersion) {
      return { status: "duplicate", ...clone(template) };
    }
    template.providerState = input.providerState;
    template.providerVersion = input.providerVersion;
    template.providerReceiptId = input.receipt.receiptId;
    template.providerCorrelationId = input.receipt.correlationId;
    template.updatedAt = input.now;
    return { status: "applied", ...clone(template) };
  }

  async reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult> {
    const found = this.outboundById.get(input.commandId);
    const foundAttempt = this.attempts.get(input.attemptId);
    if (!found || !foundAttempt) return { status: "not_found" };
    if (foundAttempt.commandId !== input.commandId) {
      return { status: "conflict", code: "reconciliation_binding_mismatch" };
    }
    return this.withBindingLock(found.command.bindingId, "reconcile_outbound", async () => {
      const record = this.outboundById.get(input.commandId);
      const attempt = this.attempts.get(input.attemptId);
      if (!record || !attempt) return { status: "not_found" };
      if (
        attempt.commandId !== input.commandId ||
        record.command.bindingId !== found.command.bindingId
      ) {
        return { status: "conflict", code: "reconciliation_binding_mismatch" };
      }
      if (!input.receipt) {
        return { status: "denied", code: "reconciliation_receipt_missing" };
      }
      if (
        !this.validReconciliationReceipt(
          input,
          input.receipt,
          record.command.bindingId,
          record.command.correlationId,
        )
      ) {
        return { status: "denied", code: "reconciliation_receipt_invalid" };
      }
      const identity = this.reconciliationReceiptIdentity(input.receipt);
      const prior = this.reconciliationReceipts.get(input.receipt.receiptId);
      if (prior) {
        if (prior.identity !== identity) {
          return { status: "conflict", code: "reconciliation_receipt_mismatch" };
        }
        return { status: "duplicate", commandState: prior.result.commandState };
      }
      if (
        record.state === "reconciled_accepted" ||
        record.state === "confirmed_not_sent" ||
        record.state === "failed"
      ) {
        return {
          status: "conflict",
          code: "reconciliation_already_settled",
          commandState: record.state,
        };
      }
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
        return { status: "denied", code: "reconciliation_state_invalid" };
      }
      const commandState =
        input.receipt.outcome === "reconciled_accepted"
          ? "reconciled_accepted"
          : input.receipt.outcome === "confirmed_not_sent"
            ? "confirmed_not_sent"
            : "failed";
      record.state = commandState;
      record.command.state = commandState;
      record.leaseOwnerHash = undefined;
      record.leaseExpiresAt = undefined;
      attempt.state = commandState;
      attempt.completedAt = input.now;
      const result: StoredReconciliationResult = { status: "reconciled", commandState };
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
        candidates.push({
          kind: "inbound_lease_expired",
          eventId: inbound.envelope.event.eventId,
          attempts: inbound.leaseVersion,
        });
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

  private validLeaseCompletion(now: Date, leaseExpiresAt: Date | undefined): boolean {
    return Boolean(
      leaseExpiresAt &&
        Number.isFinite(now.getTime()) &&
        Number.isFinite(leaseExpiresAt.getTime()) &&
        now < leaseExpiresAt,
    );
  }

  private sameOutboundDraft(
    existing: OutboundRecord,
    input: CreateOutboundCommand,
    messageBodyDigest: string,
  ): boolean {
    return (
      existing.command.bindingId === input.command.bindingId &&
      existing.command.conversationId === input.command.conversationId &&
      existing.command.channel === input.command.channel &&
      existing.command.locale === input.command.locale &&
      existing.messageBodyDigest === messageBodyDigest &&
      existing.purpose === input.purpose &&
      existing.templateId === input.templateId
    );
  }

  private closeActiveAttempt(
    record: OutboundRecord,
    state: "sent" | "delivered" | "read" | "failed",
    completedAt: Date,
  ): void {
    record.state = state;
    record.command.state = state;
    const attempt = [...this.attempts.values()].find(
      (candidate) => candidate.commandId === record.command.commandId && candidate.state === "dispatching",
    );
    if (attempt) {
      attempt.state = state;
      attempt.completedAt = completedAt;
    }
    record.leaseOwnerHash = undefined;
    record.leaseExpiresAt = undefined;
  }

  private validateWithdrawalEvidence(input: WithdrawContactCommand):
    | { status: "allowed"; record: WithdrawalHistoryRecord }
    | { status: "denied"; code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid" } {
    const evidence = input.evidence;
    if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
    const receipt = evidence.receipt;
    if (
      receipt.bindingId !== input.bindingId ||
      !receipt.receiptId ||
      !receipt.correlationId ||
      !currentReceipt(receipt, input.now)
    ) {
      return { status: "denied", code: "withdrawal_evidence_invalid" };
    }
    if (evidence.source === "inbound_event") {
      const inbound = this.inboundById.get(evidence.receipt.eventId);
      if (
        receipt.owner !== "communications" ||
        receipt.operation !== "inbound_opt_out" ||
        !inbound ||
        inbound.envelope.event.bindingId !== input.bindingId ||
        receipt.correlationId !== inbound.envelope.event.correlationId
      ) {
        return { status: "denied", code: "withdrawal_evidence_invalid" };
      }
    } else if (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal") {
      return { status: "denied", code: "withdrawal_evidence_invalid" };
    }
    const prior = this.withdrawalHistory.find((record) => record.receiptId === receipt.receiptId);
    if (
      prior &&
      (prior.bindingId !== input.bindingId ||
        prior.source !== evidence.source ||
        prior.owner !== receipt.owner ||
        prior.operation !== receipt.operation ||
        prior.correlationId !== receipt.correlationId ||
        prior.eventId !== (evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined) ||
        prior.issuedAt.getTime() !== receipt.issuedAt.getTime() ||
        prior.expiresAt.getTime() !== receipt.expiresAt.getTime())
    ) {
      return { status: "denied", code: "withdrawal_evidence_invalid" };
    }
    return {
      status: "allowed",
      record: {
        bindingId: input.bindingId,
        source: evidence.source,
        receiptId: receipt.receiptId,
        owner: receipt.owner,
        operation: receipt.operation,
        eventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
        correlationId: receipt.correlationId,
        issuedAt: new Date(receipt.issuedAt.getTime()),
        expiresAt: new Date(receipt.expiresAt.getTime()),
        changedAt: input.now,
      },
    };
  }

  private validReconciliationReceipt(
    input: ReconcileOutboundCommand,
    receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
    bindingId: string,
    correlationId: string,
  ): boolean {
    return (
      receipt.owner === "communications" &&
      receipt.operation === "dispatch_reconciliation" &&
      (receipt.source === "provider_lookup" || receipt.source === "manual_authority") &&
      receipt.bindingId === bindingId &&
      receipt.commandId === input.commandId &&
      receipt.attemptId === input.attemptId &&
      receipt.correlationId === correlationId &&
      Boolean(receipt.receiptId) &&
      currentReceipt(receipt, input.now)
    );
  }

  private reconciliationReceiptIdentity(
    receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
  ): string {
    return JSON.stringify([
      receipt.receiptId,
      receipt.owner,
      receipt.operation,
      receipt.source,
      receipt.bindingId,
      receipt.commandId,
      receipt.attemptId,
      receipt.outcome,
      receipt.issuedAt.toISOString(),
      receipt.expiresAt.toISOString(),
      receipt.correlationId,
    ]);
  }

  private outboundDuplicateReason(
    record: OutboundRecord,
  ): Extract<CreateOutboundResult, { status: "duplicate" }>["reason"] {
    if (record.state === "queued") return undefined;
    if (record.state === "draft") return "outbound_draft_unresolved";
    if (record.state === "dispatching") return "outbound_dispatch_in_progress";
    if (record.state === "dispatch_unknown" || record.state === "reconciliation_required") {
      return "outbound_reconciliation_required";
    }
    if (record.state === "failed") return record.failureCode ?? "outbound_command_failed";
    if (record.state === "cancelled") return "outbound_command_cancelled";
    if (record.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
    return "outbound_command_completed";
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
