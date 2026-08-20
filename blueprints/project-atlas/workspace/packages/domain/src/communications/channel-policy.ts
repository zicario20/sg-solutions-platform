import type {
  BindingTrustState,
  ChannelConnectionState,
  ContactConsentState,
  ContactPolicyState,
  ContactPurpose,
} from "./contracts.ts";

export type ChannelCopyKey =
  | "automated_identity"
  | "sensitive_data_refusal"
  | "unsupported_media"
  | "portal_fallback"
  | "provider_unavailable"
  | "human_unavailable"
  | "opt_out_receipt"
  | "reconsent_guidance";
export type ChannelCopyCatalog = Readonly<
  Partial<Record<ChannelCopyKey, Readonly<Partial<Record<"es" | "en", string>>>>>
>;

export type OwningAuthorityOperation =
  | "reconsent"
  | "consent_grant"
  | "ambiguous_opt_out_resolution"
  | "binding_revalidation";
export type OwningAuthorityReceipt = {
  receiptId: string;
  owner: "identity" | "consent";
  operation: OwningAuthorityOperation;
  bindingId: string;
  issuedAt: Date;
  expiresAt: Date;
};
export type ConsentReceipt = {
  receiptId: string;
  owner: "consent";
  operation: "consent_confirmation";
  bindingId: string;
  issuedAt: Date;
  expiresAt: Date;
};
export type OutboundAuthorizationReceipt = {
  receiptId: string;
  owner: "communications";
  operation: "outbound_dispatch";
  bindingId: string;
  destinationKey: string;
  issuedAt: Date;
  expiresAt: Date;
};

export type OutboundPolicyInput = {
  purpose: ContactPurpose;
  binding: { bindingId: string; trustState: BindingTrustState; freshUntil: Date };
  contactPolicy: { state: ContactPolicyState; version: number; fence: number };
  requiredPolicyVersion: number;
  requiredFence: number;
  consent: { state: ContactConsentState; receipt?: ConsentReceipt };
  connectionState: ChannelConnectionState;
  template: { eligible: boolean };
  authorizationReceipt?: OutboundAuthorizationReceipt;
  destinationKey: string;
  now: Date;
};
export type OutboundPolicyDecision =
  | { allowed: true; code: "allowed" }
  | {
      allowed: false;
      code:
        | "marketing_denied"
        | "binding_not_reverified"
        | "binding_stale"
        | "contact_policy_denied"
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

function isCurrent(receipt: { issuedAt: Date; expiresAt: Date }, now: Date): boolean {
  return (
    Number.isFinite(receipt.issuedAt.getTime()) &&
    Number.isFinite(receipt.expiresAt.getTime()) &&
    receipt.issuedAt <= now &&
    receipt.expiresAt > now
  );
}

export function evaluateOutboundPolicy(input: OutboundPolicyInput): OutboundPolicyDecision {
  if (input.purpose === "marketing") return { allowed: false, code: "marketing_denied" };
  if (input.binding.trustState !== "reverified") {
    return { allowed: false, code: "binding_not_reverified" };
  }
  if (input.binding.freshUntil <= input.now) return { allowed: false, code: "binding_stale" };
  if (input.contactPolicy.state !== "normal" && input.contactPolicy.state !== "normal_after_review") {
    return { allowed: false, code: "contact_policy_denied" };
  }
  if (input.consent.state !== "granted") return { allowed: false, code: "consent_not_granted" };
  if (!input.consent.receipt) return { allowed: false, code: "consent_receipt_missing" };
  if (
    input.consent.receipt.owner !== "consent" ||
    input.consent.receipt.operation !== "consent_confirmation" ||
    input.consent.receipt.bindingId !== input.binding.bindingId ||
    !isCurrent(input.consent.receipt, input.now)
  ) {
    return { allowed: false, code: "consent_receipt_invalid" };
  }
  if (input.contactPolicy.version !== input.requiredPolicyVersion) {
    return { allowed: false, code: "policy_version_mismatch" };
  }
  if (input.contactPolicy.fence !== input.requiredFence) {
    return { allowed: false, code: "policy_fence_mismatch" };
  }
  if (input.connectionState !== "active") return { allowed: false, code: "connection_not_ready" };
  if (!input.template.eligible) return { allowed: false, code: "template_ineligible" };
  if (!input.authorizationReceipt) return { allowed: false, code: "authority_receipt_missing" };
  if (
    input.authorizationReceipt.owner !== "communications" ||
    input.authorizationReceipt.operation !== "outbound_dispatch" ||
    input.authorizationReceipt.bindingId !== input.binding.bindingId ||
    !isCurrent(input.authorizationReceipt, input.now)
  ) {
    return { allowed: false, code: "authority_receipt_invalid" };
  }
  if (
    !input.destinationKey ||
    input.authorizationReceipt.destinationKey !== input.destinationKey
  ) {
    return { allowed: false, code: "destination_mismatch" };
  }
  return { allowed: true, code: "allowed" };
}

export function evaluateAuthorityChange(input: {
  operation: OwningAuthorityOperation;
  bindingId: string;
  receipt?: OwningAuthorityReceipt;
  now: Date;
}): { allowed: true; code: "allowed" } | { allowed: false; code: "authority_receipt_missing" | "authority_receipt_invalid" } {
  if (!input.receipt) return { allowed: false, code: "authority_receipt_missing" };
  const expectedOwner = input.operation === "binding_revalidation" ? "identity" : "consent";
  if (
    input.receipt.owner !== expectedOwner ||
    input.receipt.operation !== input.operation ||
    input.receipt.bindingId !== input.bindingId ||
    !isCurrent(input.receipt, input.now)
  ) {
    return { allowed: false, code: "authority_receipt_invalid" };
  }
  return { allowed: true, code: "allowed" };
}

export type OptOutMatch = "matched" | "not_matched" | "ambiguous";
export type OptOutMatcher = { lexiconVersion: string; match(text: string): OptOutMatch };
export type ApprovedOptOutPolicy = { policyId: "WA-004"; version: string; lexiconVersion: string };
export type OptOutClassification =
  | { action: "none"; code: "opt_out_policy_disabled" | "opt_out_not_matched" }
  | { action: "withdrawal_requested"; consentMutation: "none"; code: "opt_out_matched" }
  | { action: "manual_review"; consentMutation: "none"; code: "opt_out_ambiguous" };

export function classifyInboundOptOut(input: {
  text: string;
  policy?: ApprovedOptOutPolicy;
  matcher: OptOutMatcher;
}): OptOutClassification {
  if (!input.policy || input.policy.lexiconVersion !== input.matcher.lexiconVersion) {
    return { action: "none", code: "opt_out_policy_disabled" };
  }
  switch (input.matcher.match(input.text)) {
    case "matched":
      return { action: "withdrawal_requested", consentMutation: "none", code: "opt_out_matched" };
    case "ambiguous":
      return { action: "manual_review", consentMutation: "none", code: "opt_out_ambiguous" };
    default:
      return { action: "none", code: "opt_out_not_matched" };
  }
}
