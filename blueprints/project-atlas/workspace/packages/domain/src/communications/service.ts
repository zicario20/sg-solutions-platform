import type {
  ChannelKind,
  ChannelLocale,
  ChannelMessage,
} from "./contracts.ts";
import type {
  AcceptInboundResult,
  CanonicalInboundEnvelope,
  CommunicationsRepository,
  EndpointDigest,
  EvaluateTemplateEligibility,
  MessageTemplateService,
  ReconcileOutboundCommand,
  ReconcileOutboundResult,
  ReconcileTemplateCommand,
  RegisterTemplateDefinition,
  ApproveTemplateDefinition,
  TemplateEligibilityResult,
  TemplateResult,
} from "./repository.ts";

export type EndpointDigestKey = {
  purpose: "communications_endpoint_digest";
  version: string;
  key: string;
};

export interface EndpointDigestKeyResolver {
  resolve(): Promise<
    | {
        status: "available";
        active: EndpointDigestKey;
        prior: readonly EndpointDigestKey[];
      }
    | { status: "unavailable" }
  >;
}

export interface KeyedDigestPort {
  digest(input: { key: string; payload: string }): Promise<string>;
}

export interface DestinationResolutionPort {
  resolve(input: { bindingId: string }): Promise<
    | { status: "resolved"; endpoint: string }
    | { status: "unavailable" }
  >;
}

export interface BoundedExecutor {
  run<T>(operation: string, timeoutMs: number, action: () => Promise<T>): Promise<T>;
}

export interface OutboundProviderPort {
  dispatch(input: {
    commandId: string;
    attemptId: string;
    destination: string;
    message: ChannelMessage;
  }): Promise<
    | { status: "accepted"; providerReference?: string }
    | { status: "failed"; code: string }
    | { status: "unavailable" }
  >;
}

export interface ContentPolicyPort {
  evaluate(input: { text: string }):
    | { allowed: true; code: "allowed" }
    | { allowed: false; code: string };
}

export type CommunicationsServiceDependencies = {
  repository: CommunicationsRepository;
  clock: { now(): Date };
  ids: { next(kind: string): string };
  endpointDigestKeys: EndpointDigestKeyResolver;
  keyedDigest: KeyedDigestPort;
  destinationResolver: DestinationResolutionPort;
  boundedExecutor: BoundedExecutor;
  provider: OutboundProviderPort;
  providerTimeoutMs: number;
};

export type AcceptInboundApplicationCommand = {
  connectionId: string;
  providerEventId: string;
  providerBodyDigest: string;
  endpoint: string;
  envelope: CanonicalInboundEnvelope;
  optOutSignal: "none" | "pending";
};

export type QueueOutboundApplicationCommand = {
  channel: ChannelKind;
  locale: ChannelLocale;
  conversationId: string;
  bindingId: string;
  body: string;
  purpose: import("./contracts.ts").ContactPurpose;
  templateId: string;
  idempotencyKey: string;
  fingerprint: string;
  requiredPolicyVersion: number;
  requiredFence: number;
  authorizationReceipt?: import("./channel-policy.ts").OutboundAuthorizationReceipt;
  correlationId: string;
};

type EndpointResolution =
  | { status: "available"; endpoint: string; digests: readonly EndpointDigest[] }
  | {
      status: "unavailable";
      code:
        | "destination_unavailable"
        | "endpoint_digest_key_unavailable"
        | "endpoint_digest_key_invalid";
    };

const KEY_VERSION = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const ENDPOINT_DIGEST_DOMAIN = "communications:endpoint-digest:v1\u0000";
const MAX_PRIOR_ENDPOINT_KEYS = 3;

export class CommunicationsService {
  constructor(private readonly dependencies: CommunicationsServiceDependencies) {}

  async acceptInbound(
    input: AcceptInboundApplicationCommand,
  ): Promise<
    | AcceptInboundResult
    | {
        status: "unavailable";
        code: "endpoint_digest_key_unavailable" | "endpoint_digest_key_invalid";
      }
  > {
    const resolved = await this.digestEndpoint(input.endpoint);
    if (resolved.status === "unavailable") {
      return {
        status: "unavailable",
        code:
          resolved.code === "destination_unavailable"
            ? "endpoint_digest_key_unavailable"
            : resolved.code,
      };
    }
    return this.dependencies.repository.acceptInbound({
      connectionId: input.connectionId,
      providerEventId: input.providerEventId,
      providerBodyDigest: input.providerBodyDigest,
      endpointDigests: resolved.digests,
      envelope: input.envelope,
      optOutSignal: input.optOutSignal,
    });
  }

  async queueOutbound(input: QueueOutboundApplicationCommand): Promise<Record<string, unknown>> {
    const copy = this.dependencies.contentPolicy.evaluate({ text: input.body });
    if (!copy.allowed) return { status: "unavailable", code: "prohibited_content" };
    const now = this.dependencies.clock.now();
    const commandId = this.dependencies.ids.next("outbound_command");
    const messageId = this.dependencies.ids.next("outbound_message");
    const draft = await this.dependencies.repository.createOutbound({
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
        correlationId: input.correlationId,
      },
      message: {
        id: messageId,
        conversationId: input.conversationId,
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
    });
    if (draft.status === "conflict") return draft;
    if (draft.status === "duplicate") {
      if (draft.commandState === "queued") {
        return {
          status: "duplicate",
          commandId: draft.commandId,
          messageId: draft.messageId,
        };
      }
      if (draft.reason === "outbound_draft_unresolved") {
        return {
          status: "in_progress",
          code: draft.reason,
          commandId: draft.commandId,
        };
      }
      if (draft.reason === "outbound_dispatch_in_progress") {
        return {
          status: "in_progress",
          code: draft.reason,
          commandId: draft.commandId,
        };
      }
      if (draft.reason === "outbound_reconciliation_required") {
        return {
          status: "recovery_required",
          code: draft.reason,
          commandId: draft.commandId,
        };
      }
      if (draft.reason === "outbound_command_completed") {
        return {
          status: "already_completed",
          commandState: draft.commandState,
          commandId: draft.commandId,
          messageId: draft.messageId,
        };
      }
      return {
        status: "unavailable",
        code: draft.reason ?? "outbound_command_failed",
        commandId: draft.commandId,
      };
    }
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
      commandId,
      fingerprint: input.fingerprint,
      requiredPolicyVersion: input.requiredPolicyVersion,
      requiredFence: input.requiredFence,
      endpointDigests: resolved.digests,
      authorizationReceipt: input.authorizationReceipt,
      now: this.dependencies.clock.now(),
    });
  }

  async dispatchOutbound(input: {
    commandId: string;
    leaseOwner: string;
    leaseExpiresAt: Date;
  }): Promise<Record<string, unknown>> {
    const now = this.dependencies.clock.now();
    const attemptId = this.dependencies.ids.next("dispatch_attempt");
    const claim = await this.dependencies.repository.claimOutbound({
      commandId: input.commandId,
      attemptId,
      leaseOwner: input.leaseOwner,
      leaseExpiresAt: input.leaseExpiresAt,
      now,
    });
    if (claim.status === "not_claimed") {
      return { status: "not_dispatched", code: claim.code };
    }

    const resolved = await this.resolveDestination(claim.command.bindingId);
    if (resolved.status === "unavailable") {
      const completion = await this.dependencies.repository.markDispatchOutcome({
        commandId: input.commandId,
        attemptId,
        leaseOwner: input.leaseOwner,
        leaseVersion: claim.attempt.leaseVersion,
        outcome: "known_failure",
        now: this.dependencies.clock.now(),
      });
      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
      return { status: "not_dispatched", code: resolved.code, attemptId };
    }
    const matchingDigest = resolved.digests.some(
      (candidate) => candidate.digest === claim.destinationDigest.digest,
    );
    if (!matchingDigest) {
      const completion = await this.dependencies.repository.markDispatchOutcome({
        commandId: input.commandId,
        attemptId,
        leaseOwner: input.leaseOwner,
        leaseVersion: claim.attempt.leaseVersion,
        outcome: "known_failure",
        now: this.dependencies.clock.now(),
      });
      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
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
        const completion = await this.dependencies.repository.markDispatchOutcome({
          commandId: input.commandId,
          attemptId,
          leaseOwner: input.leaseOwner,
          leaseVersion: claim.attempt.leaseVersion,
          outcome: "accepted",
          providerReference: providerResult.providerReference,
          now: this.dependencies.clock.now(),
        });
        if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
        return { status: "accepted", attemptId };
      }
      const completion = await this.dependencies.repository.markDispatchOutcome({
        commandId: input.commandId,
        attemptId,
        leaseOwner: input.leaseOwner,
        leaseVersion: claim.attempt.leaseVersion,
        outcome: "known_failure",
        now: this.dependencies.clock.now(),
      });
      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
      return {
        status: "not_dispatched",
        code: providerResult.status === "unavailable" ? "provider_unavailable" : "provider_rejected",
        attemptId,
      };
    } catch {
      const completion = await this.dependencies.repository.markDispatchOutcome({
        commandId: input.commandId,
        attemptId,
        leaseOwner: input.leaseOwner,
        leaseVersion: claim.attempt.leaseVersion,
        outcome: "unknown",
        now: this.dependencies.clock.now(),
      });
      if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
      return { status: "dispatch_unknown", code: "provider_outcome_ambiguous", attemptId };
    }
  }

  async reconcileOutbound(
    input: Omit<ReconcileOutboundCommand, "now">,
  ): Promise<ReconcileOutboundResult> {
    return this.dependencies.repository.reconcileOutbound({
      ...input,
      now: this.dependencies.clock.now(),
    });
  }

  private dispatchCompletionConflict(
    commandId: string,
    attemptId: string,
  ): Record<string, unknown> {
    return {
      status: "recovery_required",
      code: "dispatch_completion_conflict",
      commandId,
      attemptId,
    };
  }

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
  }

  private async digestEndpoint(endpoint: string): Promise<EndpointResolution> {
    let ring: Awaited<ReturnType<EndpointDigestKeyResolver["resolve"]>>;
    try {
      ring = await this.dependencies.endpointDigestKeys.resolve();
    } catch {
      return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
    }
    if (ring.status !== "available") {
      return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
    }
    const keys = [ring.active, ...ring.prior];
    const versions = new Set<string>();
    if (
      ring.prior.length > MAX_PRIOR_ENDPOINT_KEYS ||
      keys.some(
        (candidate) =>
          candidate.purpose !== "communications_endpoint_digest" ||
          !KEY_VERSION.test(candidate.version) ||
          !candidate.key ||
          versions.has(candidate.version) ||
          (versions.add(candidate.version), false),
      )
    ) {
      return { status: "unavailable", code: "endpoint_digest_key_invalid" };
    }
    try {
      const payload = `${ENDPOINT_DIGEST_DOMAIN}${endpoint}`;
      const digests: EndpointDigest[] = [];
      for (const candidate of keys) {
        const digest = await this.dependencies.keyedDigest.digest({
          key: candidate.key,
          payload,
        });
        if (!digest) {
          return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
        }
        digests.push({ version: candidate.version, digest });
      }
      return { status: "available", endpoint, digests };
    } catch {
      return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
    }
  }
}

export class CanonicalMessageTemplateService implements MessageTemplateService {
  constructor(
    private readonly dependencies: {
      repository: CommunicationsRepository;
      clock: { now(): Date };
      allowSyntheticDefinitions?: boolean;
    },
  ) {}

  async registerInternalDefinition(input: RegisterTemplateDefinition): Promise<TemplateResult> {
    if (!this.dependencies.allowSyntheticDefinitions || !input.synthetic) {
      return { status: "unavailable", code: "runtime_registration_disabled" };
    }
    return this.dependencies.repository.registerTemplateDefinition({
      ...input,
      now: this.dependencies.clock.now(),
    });
  }

  async recordInternalApproval(input: ApproveTemplateDefinition): Promise<TemplateResult> {
    return this.dependencies.repository.approveTemplateDefinition({
      ...input,
      now: this.dependencies.clock.now(),
    });
  }

  async applyProviderProjection(input: ReconcileTemplateCommand): Promise<TemplateResult> {
    return this.dependencies.repository.reconcileTemplate(input);
  }

  async evaluateEligibility(
    input: EvaluateTemplateEligibility,
  ): Promise<TemplateEligibilityResult> {
    return this.dependencies.repository.evaluateTemplateEligibility(input);
  }
}
