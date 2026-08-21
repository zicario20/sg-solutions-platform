import type {
  VoiceCommand,
  VoiceCompletionOutcome,
  VoiceVerificationStatus,
} from "@atlas/domain";

export type OwnerCommandInput = Readonly<{
  callId: string;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
  locale: VoiceCommand["locale"];
}>;

export type OwnerReceipt = Readonly<{
  receiptId: string;
  outcome: VoiceCompletionOutcome;
}>;

export type OwnerVerificationRecord = Readonly<{
  callId: string;
  status: VoiceVerificationStatus;
  callerKind: "unknown" | "prospect" | "client";
  receiptId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
}>;

type OwnerOperation = (input: OwnerCommandInput) => Promise<OwnerReceipt>;

export interface OwnerPorts {
  resolveVerification(input: { callId: string; now: Date }): Promise<OwnerVerificationRecord>;
  lookupContactHint: OwnerOperation;
  getApprovedInformation: OwnerOperation;
  getAvailability: OwnerOperation;
  createLead: OwnerOperation;
  requestAppointment: OwnerOperation;
  requestCallback: OwnerOperation;
  takeMessage: OwnerOperation;
  requestTransfer: OwnerOperation;
  requestVoicemail: OwnerOperation;
  requestApprovedLink: OwnerOperation;
  getSafeStatus: OwnerOperation;
  getPaymentProjection: OwnerOperation;
  getMissingDocuments: OwnerOperation;
  getNextAppointment: OwnerOperation;
  sendSecureMessage: OwnerOperation;
}

export function createFailClosedOwnerPorts(): OwnerPorts {
  const unavailable: OwnerOperation = async () => {
    throw new Error("VOICE_OWNER_PORT_UNAVAILABLE");
  };
  return {
    resolveVerification: async ({ callId }) => ({
      callId,
      status: "unverified",
      callerKind: "unknown",
    }),
    lookupContactHint: unavailable,
    getApprovedInformation: unavailable,
    getAvailability: unavailable,
    createLead: unavailable,
    requestAppointment: unavailable,
    requestCallback: unavailable,
    takeMessage: unavailable,
    requestTransfer: unavailable,
    requestVoicemail: unavailable,
    requestApprovedLink: unavailable,
    getSafeStatus: unavailable,
    getPaymentProjection: unavailable,
    getMissingDocuments: unavailable,
    getNextAppointment: unavailable,
    sendSecureMessage: unavailable,
  };
}
