import type { VoiceCommand, VoiceCommandReceipt } from "./contracts.ts";

export const VOICE_COMPLETION_OUTCOMES = [
  "language_selected",
  "contact_hint_processed",
  "public_information_ready",
  "availability_ready",
  "lead_created",
  "appointment_requested",
  "callback_requested",
  "message_recorded",
  "transfer_requested",
  "voicemail_requested",
  "approved_link_requested",
  "portal_required",
  "safe_status_ready",
  "payment_projection_ready",
  "missing_documents_ready",
  "next_appointment_ready",
  "secure_message_recorded",
] as const;

export type VoiceCompletionOutcome = (typeof VOICE_COMPLETION_OUTCOMES)[number];

export type VoiceOperationResult =
  | { kind: "completed"; outcome: VoiceCompletionOutcome; receiptId: string }
  | { kind: "verification_required" }
  | { kind: "confirmation_required" }
  | { kind: "denied" }
  | { kind: "unavailable" };

export type StoredVoiceCommandReceipt = Readonly<{
  receiptId: string;
  callId: string;
  commandId: string;
  idempotencyKey: string;
  commandDigest: string;
  operation: VoiceCommand["operation"];
  state: "reserved" | "completed" | "failed";
  result?: VoiceOperationResult;
  issuedAt: Date;
  completedAt?: Date;
}>;

export type VoiceReceiptReservation =
  | { status: "reserved"; receipt: StoredVoiceCommandReceipt }
  | { status: "replay"; receipt: StoredVoiceCommandReceipt; result: VoiceOperationResult }
  | { status: "in_progress"; receipt: StoredVoiceCommandReceipt }
  | { status: "conflict" };

export interface VoiceCommandReceiptRepository {
  reserve(input: {
    receipt: VoiceCommandReceipt;
    commandDigest: string;
  }): Promise<VoiceReceiptReservation>;
  complete(
    receiptId: string,
    result: VoiceOperationResult,
    completedAt: Date,
  ): Promise<StoredVoiceCommandReceipt>;
  find(callId: string, idempotencyKey: string): Promise<StoredVoiceCommandReceipt | undefined>;
}
