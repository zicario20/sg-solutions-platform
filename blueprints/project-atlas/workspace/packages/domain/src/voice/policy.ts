import {
  VOICE_COMMAND_OPERATIONS,
  type VoiceCommand,
  type VoiceProviderMode,
  type VoiceVerificationStatus,
} from "./contracts.ts";

export type ReceptionContext = Readonly<{
  verificationStatus: VoiceVerificationStatus;
  callerKind: "unknown" | "prospect" | "client";
  providerMode: VoiceProviderMode;
}>;

export type ReceptionDecision =
  | { kind: "allow" }
  | { kind: "deny" }
  | { kind: "verification_required" }
  | { kind: "confirmation_required" };

const knownOperations = new Set<string>(VOICE_COMMAND_OPERATIONS);

const prohibitedOperations = new Set<string>([
  "professional_filing",
  "tax_action",
  "dispute_action",
  "loan_action",
  "card_action",
  "refund",
  "payment_mutation",
  "pricing_change",
  "service_approval",
  "signature",
  "partner_share",
  "browser_action",
  "database_access",
  "internal_agent",
]);

const verifiedOperations = new Set<string>([
  "safe_status",
  "payment_projection",
  "missing_documents",
  "next_appointment",
  "secure_message",
]);

const confirmedOperations = new Set<string>([
  "create_lead",
  "request_appointment",
  "request_callback",
  "take_message",
]);

export function evaluateReceptionCommand(
  command: VoiceCommand,
  context: ReceptionContext,
): ReceptionDecision {
  if (
    context.providerMode !== "mock" ||
    !knownOperations.has(command.operation) ||
    prohibitedOperations.has(command.operation)
  ) {
    return { kind: "deny" };
  }
  if (
    verifiedOperations.has(command.operation) &&
    (context.callerKind !== "client" || context.verificationStatus !== "verified")
  ) {
    return { kind: "verification_required" };
  }
  if (confirmedOperations.has(command.operation) && !command.confirmed) {
    return { kind: "confirmation_required" };
  }
  return { kind: "allow" };
}
