import type {
  ChannelConnectionState,
  ChannelContactPolicy,
  ChannelConversation,
  ChannelKind,
  ChannelLocale,
  ChannelMessage,
  ChannelParticipant,
  ContactChannelBinding,
  ContactConsentState,
  ContactPurpose,
  DomainReceipt,
  InboundChannelEvent,
  OutboundCommandState,
  OutboundDispatchAttempt,
  OutboundMessageCommand,
  TemplateLifecycleState,
} from "./contracts.ts";
import type {
  OutboundAuthorizationReceipt,
  OwningAuthorityReceipt,
} from "./channel-policy.ts";
import type {
  VerifiedProviderStatusReceipt,
  VerifiedProviderStatusReceiptRecord,
} from "./provider-status.ts";

export type EndpointDigest = {
  version: string;
  digest: string;
};

export type CanonicalInboundEnvelope = {
  event: InboundChannelEvent;
  conversation: ChannelConversation;
  participant: ChannelParticipant;
  message: ChannelMessage;
};

export type AcceptInboundCommand = {
  connectionId: string;
  providerEventId: string;
  providerBodyDigest: string;
  endpointDigests: readonly EndpointDigest[];
  envelope: CanonicalInboundEnvelope;
  optOutSignal: "none" | "pending";
};

export type AcceptInboundResult =
  | {
      status: "accepted" | "duplicate";
      eventId: string;
      endpointDigestVersion: string;
      endpointDigest: string;
    }
  | { status: "replay_mismatch"; code: "provider_replay_mismatch" };

export type ClaimInboundCommand = {
  eventId: string;
  leaseOwner: string;
  leaseExpiresAt: Date;
  now: Date;
  requiredPolicyVersion: number;
};

export type InboundClaimResult =
  | {
      status: "claimed";
      eventId: string;
      leaseVersion: number;
      envelope: CanonicalInboundEnvelope;
      policyState: ChannelContactPolicy["state"];
    }
  | {
      status: "not_claimed";
      code:
        | "not_found"
        | "already_completed"
        | "lease_conflict"
        | "policy_version_mismatch";
    };

export type CompleteInboundCommand = {
  eventId: string;
  leaseOwner: string;
  leaseVersion: number;
  outcome: "applied" | "manual_review" | "dead_letter";
  now: Date;
};

export type CreateOutboundCommand = {
  command: OutboundMessageCommand;
  message: ChannelMessage;
  purpose: ContactPurpose;
  templateId: string;
};

export type FinalizeOutboundCommand = {
  commandId: string;
  fingerprint: string;
  requiredPolicyVersion: number;
  requiredFence: number;
  endpointDigests: readonly EndpointDigest[];
  authorizationReceipt?: OutboundAuthorizationReceipt;
  now: Date;
};

export type FailOutboundDraftCommand = {
  commandId: string;
  code:
    | "destination_unavailable"
    | "endpoint_digest_key_unavailable"
    | "endpoint_digest_key_invalid";
  now: Date;
};

export type OutboundDuplicateReason =
  | FailOutboundDraftCommand["code"]
  | "outbound_draft_unresolved"
  | "outbound_dispatch_in_progress"
  | "outbound_reconciliation_required"
  | "outbound_command_failed"
  | "outbound_command_cancelled"
  | "outbound_confirmed_not_sent"
  | "outbound_command_completed";

export type CreateOutboundResult =
  | { status: "created"; commandId: string; messageId: string }
  | {
      status: "duplicate";
      commandId: string;
      messageId: string;
      commandState: OutboundCommandState;
      reason?: OutboundDuplicateReason;
    }
  | { status: "conflict"; code: "idempotency_mismatch" };

export type ClaimOutboundCommand = {
  commandId: string;
  attemptId: string;
  leaseOwner: string;
  leaseExpiresAt: Date;
  now: Date;
};

export type OutboundClaimResult =
  | {
      status: "claimed";
      command: OutboundMessageCommand;
      message: ChannelMessage;
      attempt: OutboundDispatchAttempt & { leaseVersion: number };
      destinationDigest: EndpointDigest;
    }
  | {
      status: "not_claimed";
      code:
        | "not_found"
        | "lease_conflict"
        | "dispatch_unknown_non_retryable"
        | "already_completed"
        | "binding_not_found"
        | "policy_not_found"
        | "consent_not_found"
        | "contact_policy_denied"
        | "marketing_denied"
        | "binding_not_reverified"
        | "binding_freshness_invalid"
        | "binding_stale"
        | "consent_not_granted"
        | "consent_receipt_missing"
        | "consent_receipt_invalid"
        | "policy_version_mismatch"
        | "policy_fence_mismatch"
        | "connection_not_ready"
        | "template_ineligible"
        | "authority_receipt_missing"
        | "authority_receipt_invalid"
        | "destination_mismatch";
    };

export type MarkDispatchOutcomeCommand = {
  commandId: string;
  attemptId: string;
  leaseOwner: string;
  leaseVersion: number;
  outcome: "accepted" | "known_failure" | "unknown";
  now: Date;
  providerReference?: string;
};

export type ApplyProviderStatusCommand = {
  commandId: string;
  attemptId: string;
  receipt: VerifiedProviderStatusReceipt;
};

export type ProviderStatusResult =
  | {
      status: "applied" | "duplicate" | "regressive";
      commandState: OutboundCommandState;
    }
  | { status: "not_found" }
  | {
      status: "denied";
      code: "verified_receipt_invalid" | "provider_status_binding_mismatch";
    }
  | { status: "conflict"; code: "provider_status_replay_mismatch" };

export type ConsentRecord = {
  bindingId: string;
  purpose: ContactPurpose;
  state: ContactConsentState;
  version: number;
  receipt?: import("./channel-policy.ts").ConsentReceipt;
  authorityReceiptId?: string;
  changedAt: Date;
};

export type GrantConsentCommand = {
  bindingId: string;
  purpose: ContactPurpose;
  operation: "consent_grant" | "reconsent";
  receipt?: OwningAuthorityReceipt;
  now: Date;
};

export type ConsentChangeResult =
  | {
      status: "changed" | "duplicate" | "unchanged";
      state: ContactConsentState;
      version: number;
    }
  | {
      status: "denied";
      code:
        | "authority_receipt_missing"
        | "authority_receipt_invalid"
        | "reconsent_receipt_required"
        | "policy_state_invalid";
    };

export type AmbiguousOptOutResolutionResult =
  | {
      status: "changed";
      policyState: "normal_after_review";
      policyVersion: number;
    }
  | {
      status: "denied";
      code: "authority_receipt_missing" | "authority_receipt_invalid" | "policy_state_invalid";
    };

export type WithdrawContactCommand = {
  bindingId: string;
  evidence?: ContactWithdrawalEvidence;
  now: Date;
};

export type ContactWithdrawalEvidence =
  | {
      source: "inbound_event";
      receipt: {
        receiptId: string;
        owner: "communications";
        operation: "inbound_opt_out";
        bindingId: string;
        eventId: string;
        issuedAt: Date;
        expiresAt: Date;
        correlationId: string;
      };
    }
  | {
      source: "authority";
      receipt: {
        receiptId: string;
        owner: "consent";
        operation: "contact_withdrawal";
        bindingId: string;
        issuedAt: Date;
        expiresAt: Date;
        correlationId: string;
      };
    };

export type WithdrawalHistoryRecord = {
  bindingId: string;
  source: ContactWithdrawalEvidence["source"];
  receiptId: string;
  owner: ContactWithdrawalEvidence["receipt"]["owner"];
  operation: ContactWithdrawalEvidence["receipt"]["operation"];
  eventId?: string;
  correlationId: string;
  issuedAt: Date;
  expiresAt: Date;
  changedAt: Date;
};

export type WithdrawContactResult =
  | {
      status: "changed" | "duplicate";
      state: "withdrawn";
      policyVersion: number;
      fence: number;
      cancelledCommandIds: readonly string[];
    }
  | {
      status: "denied";
      code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid";
    };

export type ResolveOptOutCommand = {
  bindingId: string;
  receipt?: OwningAuthorityReceipt;
  now: Date;
};

export type SuspendBindingCommand = {
  bindingId: string;
  reason: "expired" | "wrong_person" | "reassigned" | "invalid_recipient";
  now: Date;
};

export type BindingChangeResult =
  | {
      status: "changed" | "duplicate";
      trustState: ContactChannelBinding["trustState"];
    }
  | {
      status: "denied";
      code:
        | "binding_not_found"
        | "authority_receipt_missing"
        | "authority_receipt_invalid"
        | "freshness_invalid";
    };

export type RevalidateBindingCommand = {
  bindingId: string;
  freshUntil: Date;
  receipt?: OwningAuthorityReceipt;
  now: Date;
};

export type TemplateProviderState = Extract<
  TemplateLifecycleState,
  "provider_approved" | "provider_rejected" | "paused" | "disabled"
>;

export type TemplateAuthorityReceipt = {
  receiptId: string;
  owner: "communications";
  operation: "template_internal_approval";
  resourceId: string;
  locale: ChannelLocale;
  definitionVersion: number;
  issuedAt: Date;
  expiresAt: Date;
};

export type TemplateProviderReconciliationReceipt = {
  receiptId: string;
  owner: "communications";
  operation: "template_provider_reconciliation";
  templateId: string;
  locale: ChannelLocale;
  definitionVersion: number;
  providerVersion: number;
  providerState: TemplateProviderState;
  issuedAt: Date;
  expiresAt: Date;
  correlationId: string;
};

export type TemplateRecord = {
  templateId: string;
  locale: ChannelLocale;
  definitionVersion: number;
  internallyApproved: boolean;
  approvalReceiptId?: string;
  providerReceiptId?: string;
  providerCorrelationId?: string;
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
  locale: ChannelLocale;
  definitionVersion: number;
  receipt?: TemplateAuthorityReceipt;
};

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
  | { kind: "inbound_lease_expired"; eventId: string; attempts: number };

export type DeadLetterExpiredInboundCommand = {
  eventId: string;
  expectedAttempts: number;
  reason: "retry_exhausted";
  now: Date;
};

export type DeadLetterExpiredInboundResult =
  | { status: "dead_lettered" | "already_terminal" }
  | {
      status: "conflict";
      code: "not_found" | "state_changed" | "version_mismatch" | "lease_not_expired";
    };

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
  deadLetterExpiredInbound(
    input: DeadLetterExpiredInboundCommand,
  ): Promise<DeadLetterExpiredInboundResult>;
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
  providerStatuses: readonly VerifiedProviderStatusReceiptRecord[];
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
  | { status: "unavailable" };
