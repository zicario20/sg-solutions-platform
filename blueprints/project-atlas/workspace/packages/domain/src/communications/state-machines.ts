import type {
  BindingTrustState,
  ChannelConnectionState,
  ContactConsentState,
  ContactPolicyState,
  ConversationOwnershipState,
  OutboundCommandState,
  ProviderEventState,
  TemplateLifecycleState,
} from "./contracts.ts";

export type StateTransitionCode =
  | "transitioned"
  | "duplicate"
  | "terminal"
  | "invalid_transition"
  | "regressive"
  | "disabled";

export type StateTransitionResult<T extends string> = {
  state: T;
  code: StateTransitionCode;
};

function transition<T extends string>(
  from: T,
  to: T,
  transitions: Readonly<Record<T, readonly T[]>>,
  terminalStates: ReadonlySet<T>,
): StateTransitionResult<T> {
  if (from === to) return { state: from, code: "duplicate" };
  if (terminalStates.has(from)) return { state: from, code: "terminal" };
  return transitions[from].includes(to)
    ? { state: to, code: "transitioned" }
    : { state: from, code: "invalid_transition" };
}

const CONNECTION_TRANSITIONS: Readonly<
  Record<ChannelConnectionState, readonly ChannelConnectionState[]>
> = {
  disabled: ["configured"],
  configured: ["disabled", "sandbox_verified", "retired"],
  sandbox_verified: ["production_verified", "suspended", "retired"],
  production_verified: ["active", "suspended", "retired"],
  active: ["suspended", "retired"],
  suspended: ["configured", "retired"],
  retired: [],
};
const CONNECTION_TERMINAL = new Set<ChannelConnectionState>(["retired"]);

export function transitionConnection(
  from: ChannelConnectionState,
  to: ChannelConnectionState,
): StateTransitionResult<ChannelConnectionState> {
  return transition(from, to, CONNECTION_TRANSITIONS, CONNECTION_TERMINAL);
}

const INBOUND_TRANSITIONS: Readonly<Record<ProviderEventState, readonly ProviderEventState[]>> = {
  received: ["signature_verified", "rejected_invalid"],
  signature_verified: ["bounded_normalization", "rejected_invalid"],
  bounded_normalization: ["persisted", "rejected_invalid", "quarantined"],
  persisted: ["applied", "ignored_duplicate", "manual_review", "dead_letter"],
  applied: [],
  ignored_duplicate: [],
  manual_review: [],
  rejected_invalid: [],
  quarantined: [],
  dead_letter: [],
};
const INBOUND_TERMINAL = new Set<ProviderEventState>([
  "applied",
  "ignored_duplicate",
  "manual_review",
  "rejected_invalid",
  "quarantined",
  "dead_letter",
]);

export function transitionInboundEvent(
  from: ProviderEventState,
  to: ProviderEventState,
  options: { quarantineEnabled: boolean },
): StateTransitionResult<ProviderEventState> {
  if (to === "quarantined" && !options.quarantineEnabled) {
    return { state: from, code: "disabled" };
  }
  return transition(from, to, INBOUND_TRANSITIONS, INBOUND_TERMINAL);
}

const OUTBOUND_TRANSITIONS: Readonly<
  Record<OutboundCommandState, readonly OutboundCommandState[]>
> = {
  draft: ["policy_checked", "cancelled", "manual_review"],
  policy_checked: ["queued", "cancelled", "manual_review"],
  queued: ["dispatching", "cancelled", "expired", "manual_review"],
  dispatching: ["provider_accepted", "dispatch_unknown", "failed", "manual_review"],
  provider_accepted: ["sent", "failed", "manual_review"],
  dispatch_unknown: ["reconciliation_required", "manual_review"],
  reconciliation_required: ["reconciled_accepted", "confirmed_not_sent", "manual_review"],
  reconciled_accepted: ["sent", "manual_review"],
  confirmed_not_sent: ["queued", "cancelled", "expired", "manual_review"],
  sent: ["delivered", "read", "manual_review"],
  delivered: ["read", "manual_review"],
  read: [],
  failed: [],
  expired: [],
  cancelled: [],
  manual_review: [],
};
const OUTBOUND_TERMINAL = new Set<OutboundCommandState>([
  "read",
  "failed",
  "expired",
  "cancelled",
  "manual_review",
]);
const DELIVERY_PRECEDENCE: readonly OutboundCommandState[] = ["sent", "delivered", "read"];

export function transitionOutboundCommand(
  from: OutboundCommandState,
  to: OutboundCommandState,
): StateTransitionResult<OutboundCommandState> {
  if (from === to) return { state: from, code: "duplicate" };
  const fromPrecedence = DELIVERY_PRECEDENCE.indexOf(from);
  const toPrecedence = DELIVERY_PRECEDENCE.indexOf(to);
  if (fromPrecedence > toPrecedence && toPrecedence >= 0) {
    return { state: from, code: "regressive" };
  }
  return transition(from, to, OUTBOUND_TRANSITIONS, OUTBOUND_TERMINAL);
}

const CONSENT_TRANSITIONS: Readonly<Record<ContactConsentState, readonly ContactConsentState[]>> = {
  not_requested: ["granted", "superseded"],
  granted: ["withdrawn", "expired", "superseded"],
  withdrawn: [],
  expired: [],
  superseded: [],
};
const CONSENT_TERMINAL = new Set<ContactConsentState>(["withdrawn", "expired", "superseded"]);

export function transitionContactConsent(
  from: ContactConsentState,
  to: ContactConsentState,
): StateTransitionResult<ContactConsentState> {
  return transition(from, to, CONSENT_TRANSITIONS, CONSENT_TERMINAL);
}

const POLICY_TRANSITIONS: Readonly<Record<ContactPolicyState, readonly ContactPolicyState[]>> = {
  normal: ["opt_out_pending", "withdrawn"],
  opt_out_pending: ["withdrawn"],
  withdrawn: ["normal_after_review"],
  normal_after_review: ["opt_out_pending", "withdrawn"],
};
const POLICY_TERMINAL = new Set<ContactPolicyState>();

export function transitionContactPolicy(
  from: ContactPolicyState,
  to: ContactPolicyState,
): StateTransitionResult<ContactPolicyState> {
  return transition(from, to, POLICY_TRANSITIONS, POLICY_TERMINAL);
}

const TEMPLATE_TRANSITIONS: Readonly<
  Record<TemplateLifecycleState, readonly TemplateLifecycleState[]>
> = {
  draft: ["internally_approved", "disabled", "superseded"],
  internally_approved: ["submitted", "disabled", "superseded"],
  submitted: ["provider_approved", "provider_rejected", "disabled", "superseded"],
  provider_approved: ["paused", "disabled", "superseded"],
  provider_rejected: [],
  paused: ["provider_approved", "disabled", "superseded"],
  disabled: [],
  superseded: [],
};
const TEMPLATE_TERMINAL = new Set<TemplateLifecycleState>([
  "provider_rejected",
  "disabled",
  "superseded",
]);

export function transitionTemplateLifecycle(
  from: TemplateLifecycleState,
  to: TemplateLifecycleState,
): StateTransitionResult<TemplateLifecycleState> {
  return transition(from, to, TEMPLATE_TRANSITIONS, TEMPLATE_TERMINAL);
}

const BINDING_TRANSITIONS: Readonly<Record<BindingTrustState, readonly BindingTrustState[]>> = {
  unlinked: ["candidate_match"],
  candidate_match: ["unlinked", "linked_prospect", "linked_client"],
  linked_prospect: ["verification_due", "suspended", "revoked"],
  linked_client: ["verification_due", "suspended", "revoked"],
  verification_due: ["reverified", "suspended", "revoked"],
  reverified: ["verification_due", "suspended", "revoked"],
  reassignment_suspected: [],
  suspended: ["verification_due", "revoked"],
  revoked: [],
};
const BINDING_TERMINAL = new Set<BindingTrustState>(["reassignment_suspected", "revoked"]);

export function transitionBindingTrust(
  from: BindingTrustState,
  to: BindingTrustState,
): StateTransitionResult<BindingTrustState> {
  return transition(from, to, BINDING_TRANSITIONS, BINDING_TERMINAL);
}

const CONVERSATION_TRANSITIONS: Readonly<
  Record<ConversationOwnershipState, readonly ConversationOwnershipState[]>
> = {
  new: ["ai_active", "human_requested", "closed", "expired", "restricted"],
  ai_active: ["human_requested", "closed", "expired", "restricted"],
  human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
  waiting_for_human: ["human_active", "closed", "expired", "restricted"],
  human_active: ["returned_to_ai", "closed", "expired", "restricted"],
  returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
  closed: [],
  expired: [],
  restricted: [],
};
const CONVERSATION_TERMINAL = new Set<ConversationOwnershipState>([
  "closed",
  "expired",
  "restricted",
]);

export function transitionConversationOwnership(
  from: ConversationOwnershipState,
  to: ConversationOwnershipState,
): StateTransitionResult<ConversationOwnershipState> {
  return transition(from, to, CONVERSATION_TRANSITIONS, CONVERSATION_TERMINAL);
}
