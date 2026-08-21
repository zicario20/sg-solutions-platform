import type {
  FormDefinitionVersion,
  PublicAnswerValue,
  PublicFormLocale,
} from "./contracts.ts";
import type { FormOutboxCommand } from "./ports.ts";

export type FormReceipt = Readonly<{
  status: "accepted";
  receiptId: string;
  issuedAt: Date;
}>;

export type ReviewReceipt = Readonly<{
  status: "request_received_for_review";
  receiptId: string;
  issuedAt: Date;
}>;

export type ProtectedFormAnswer = Readonly<{
  fieldCode: string;
  valueType: "string" | "number" | "boolean";
  sensitivity: string;
  ciphertext: string;
  keyReference: string;
  matchDigest?: string;
}>;

export type FormConsentEvidence = Readonly<{
  consentType: string;
  version: string;
  disclosureReference: string;
  granted: boolean;
  source: "public_form";
  sessionBindingDigest: string;
  occurredAt: Date;
}>;

export type FormAttributionRecord = Readonly<{
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  partnerCode?: string;
}>;

export type AcceptedFormSubmission = Readonly<{
  submissionId: string;
  receipt: FormReceipt;
  formCode: string;
  formVersion: string;
  locale: PublicFormLocale;
  sessionBindingDigest: string;
  nonceDigest: string;
  commandDigest: string;
  answers: readonly ProtectedFormAnswer[];
  consents: readonly FormConsentEvidence[];
  attribution?: FormAttributionRecord;
  outbox: readonly FormOutboxCommand[];
  acceptedAt: Date;
}>;

export type ReserveFormReceiptInput = Readonly<{
  scope: string;
  commandDigest: string;
  reservationId: string;
  proposedReceipt: FormReceipt;
}>;

export type ReserveFormReceiptResult =
  | { status: "reserved"; reservationId: string }
  | { status: "replay"; receipt: FormReceipt }
  | { status: "conflict" | "in_progress"; receipt: FormReceipt };

export interface PublicFormsRepository {
  loadPublishedDefinition(input: {
    formCode: string;
    version: string;
    locale: PublicFormLocale;
  }): Promise<FormDefinitionVersion | undefined>;
  reserveOrReplay(input: ReserveFormReceiptInput): Promise<ReserveFormReceiptResult>;
  commitAcceptedSubmission(input: {
    scope: string;
    reservationId: string;
    submission: AcceptedFormSubmission;
  }): Promise<FormReceipt>;
  abandonReservation(input: { scope: string; reservationId: string }): Promise<void>;
}

type MemoryReservation = {
  commandDigest: string;
  reservationId: string;
  receipt: FormReceipt;
  committed: boolean;
};

export class MemoryPublicFormsRepository implements PublicFormsRepository {
  readonly acceptedSubmissions: AcceptedFormSubmission[] = [];
  private readonly definitions = new Map<string, FormDefinitionVersion>();
  private readonly reservations = new Map<string, MemoryReservation>();

  constructor(input: { definitions: readonly FormDefinitionVersion[] }) {
    for (const definition of input.definitions) {
      this.definitions.set(
        `${definition.formCode}\u0000${definition.version}\u0000${definition.locale}`,
        definition,
      );
    }
  }

  async loadPublishedDefinition(input: {
    formCode: string;
    version: string;
    locale: PublicFormLocale;
  }): Promise<FormDefinitionVersion | undefined> {
    const definition = this.definitions.get(
      `${input.formCode}\u0000${input.version}\u0000${input.locale}`,
    );
    return definition?.status === "published" ? definition : undefined;
  }

  async reserveOrReplay(input: ReserveFormReceiptInput): Promise<ReserveFormReceiptResult> {
    const existing = this.reservations.get(input.scope);
    if (existing) {
      if (existing.commandDigest !== input.commandDigest) {
        return { status: "conflict", receipt: existing.receipt };
      }
      return existing.committed
        ? { status: "replay", receipt: existing.receipt }
        : { status: "in_progress", receipt: existing.receipt };
    }
    this.reservations.set(input.scope, {
      commandDigest: input.commandDigest,
      reservationId: input.reservationId,
      receipt: input.proposedReceipt,
      committed: false,
    });
    return { status: "reserved", reservationId: input.reservationId };
  }

  async commitAcceptedSubmission(input: {
    scope: string;
    reservationId: string;
    submission: AcceptedFormSubmission;
  }): Promise<FormReceipt> {
    const reservation = this.reservations.get(input.scope);
    if (!reservation || reservation.reservationId !== input.reservationId) {
      throw new Error("FORM_RESERVATION_CONFLICT");
    }
    if (reservation.committed) return reservation.receipt;
    this.acceptedSubmissions.push(Object.freeze(input.submission));
    reservation.committed = true;
    return reservation.receipt;
  }

  async abandonReservation(input: { scope: string; reservationId: string }): Promise<void> {
    const reservation = this.reservations.get(input.scope);
    if (reservation && !reservation.committed && reservation.reservationId === input.reservationId) {
      this.reservations.delete(input.scope);
    }
  }
}

export type AnswerProtectionPort = {
  protect(input: {
    fieldCode: string;
    value: PublicAnswerValue;
    sensitivity: string;
  }): Promise<{ ciphertext: string; keyReference: string; matchDigest?: string }>;
};
