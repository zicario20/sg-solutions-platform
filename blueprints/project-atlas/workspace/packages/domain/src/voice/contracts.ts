export type VoiceLocale = "es" | "en";
export type VoiceProviderMode = "disabled" | "mock";

export type VoiceCallLifecycle =
  | "received"
  | "greeting"
  | "language_selected"
  | "routing"
  | "active"
  | "handoff"
  | "voicemail"
  | "callback_pending"
  | "completed"
  | "failed";

export type VoiceVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed"
  | "expired"
  | "locked";

export type VoiceTransferStatus =
  | "none"
  | "requested"
  | "queued"
  | "connected"
  | "unavailable"
  | "completed";

export type VoiceCall = Readonly<{
  callId: string;
  correlationId: string;
  providerMode: VoiceProviderMode;
  providerConnectionId: string;
  providerCallReferenceDigest: string;
  locale: VoiceLocale;
  lifecycle: VoiceCallLifecycle;
  verificationStatus: VoiceVerificationStatus;
  transferStatus: VoiceTransferStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export const VOICE_COMMAND_OPERATIONS = [
  "select_language",
  "lookup_caller_hint",
  "provide_public_information",
  "request_availability",
  "create_lead",
  "request_appointment",
  "request_callback",
  "take_message",
  "request_transfer",
  "request_voicemail",
  "send_approved_link",
  "safe_status",
  "payment_projection",
  "missing_documents",
  "next_appointment",
  "secure_message",
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
] as const;

export type VoiceCommandOperation = (typeof VOICE_COMMAND_OPERATIONS)[number];

export type VoiceCommand = Readonly<{
  commandId: string;
  callId: string;
  idempotencyKey: string;
  operation: VoiceCommandOperation;
  locale: VoiceLocale;
  correlationId: string;
  requestedAt: Date;
  confirmed: boolean;
}>;

export type VoiceCommandReceipt = Readonly<{
  receiptId: string;
  callId: string;
  commandId: string;
  idempotencyKey: string;
  operation: VoiceCommandOperation;
  state: "reserved" | "completed" | "failed";
  issuedAt: Date;
}>;

export function makeVoiceCallReceipt(command: VoiceCommand): VoiceCommandReceipt {
  return Object.freeze({
    receiptId: `voice_receipt_${command.commandId}`,
    callId: command.callId,
    commandId: command.commandId,
    idempotencyKey: command.idempotencyKey,
    operation: command.operation,
    state: "reserved",
    issuedAt: new Date(command.requestedAt),
  });
}
