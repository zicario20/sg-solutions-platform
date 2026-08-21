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
  submissionRef?: string;
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

export type FormDraftRecord = Readonly<{
  draftReference: string;
  scopeDigest: string;
  sessionBindingDigest: string;
  formCode: string;
  formVersion: string;
  locale: PublicFormLocale;
  ciphertext: string;
  keyReference: string;
  state: "active" | "expired" | "deleted";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

export type ConsentRevocationRecord = Readonly<{
  revocationId: string;
  submissionReceiptId: string;
  submissionId?: string;
  consentType: string;
  consentVersion: string;
  sessionBindingDigest: string;
  idempotencyDigest: string;
  commandDigest: string;
  evidenceReference: string;
  occurredAt: Date;
  outbox: readonly FormOutboxCommand[];
}>;

export type ConsentRevocationRepositoryResult =
  | Readonly<{ status: "revoked" | "replayed"; revocationId: string }>
  | Readonly<{ status: "denied" | "conflict" }>;

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
  saveDraft(input: FormDraftRecord): Promise<"saved" | "denied">;
  loadDraft(input: {
    scopeDigest: string;
    sessionBindingDigest: string;
    now: Date;
  }): Promise<FormDraftRecord | undefined>;
  expireDraft(input: {
    scopeDigest: string;
    sessionBindingDigest: string;
    now: Date;
  }): Promise<"expired" | "denied">;
  revokeConsent(input: ConsentRevocationRecord): Promise<ConsentRevocationRepositoryResult>;
}

type MemoryReservation = {
  commandDigest: string;
  reservationId: string;
  receipt: FormReceipt;
  committed: boolean;
};

export class MemoryPublicFormsRepository implements PublicFormsRepository {
  readonly acceptedSubmissions: AcceptedFormSubmission[] = [];
  readonly drafts: FormDraftRecord[] = [];
  readonly consentRevocations: ConsentRevocationRecord[] = [];
  private readonly definitions = new Map<string, FormDefinitionVersion>();
  private readonly reservations = new Map<string, MemoryReservation>();
  private readonly draftIndexes = new Map<string, number>();
  private readonly submissionScopes = new Map<string, string>();

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
    this.submissionScopes.set(input.submission.submissionId, input.scope);
    reservation.committed = true;
    reservation.receipt = Object.freeze({
      ...reservation.receipt,
      submissionRef: input.submission.submissionId,
    });
    return reservation.receipt;
  }

  async abandonReservation(input: { scope: string; reservationId: string }): Promise<void> {
    const reservation = this.reservations.get(input.scope);
    if (reservation && !reservation.committed && reservation.reservationId === input.reservationId) {
      this.reservations.delete(input.scope);
    }
  }

  async saveDraft(input: FormDraftRecord): Promise<"saved" | "denied"> {
    const index = this.draftIndexes.get(input.scopeDigest);
    if (index !== undefined) {
      const existing = this.drafts[index];
      if (
        !existing ||
        existing.sessionBindingDigest !== input.sessionBindingDigest ||
        existing.state !== "active"
      ) {
        return "denied";
      }
      this.drafts[index] = Object.freeze({ ...input, createdAt: existing.createdAt });
      return "saved";
    }
    this.draftIndexes.set(input.scopeDigest, this.drafts.length);
    this.drafts.push(Object.freeze({ ...input }));
    return "saved";
  }

  async loadDraft(input: {
    scopeDigest: string;
    sessionBindingDigest: string;
    now: Date;
  }): Promise<FormDraftRecord | undefined> {
    const index = this.draftIndexes.get(input.scopeDigest);
    if (index === undefined) return undefined;
    const draft = this.drafts[index];
    if (!draft || draft.sessionBindingDigest !== input.sessionBindingDigest) return undefined;
    if (draft.state === "active" && draft.expiresAt.getTime() <= input.now.getTime()) {
      this.drafts[index] = Object.freeze({ ...draft, state: "expired", updatedAt: input.now });
    }
    return this.drafts[index];
  }

  async expireDraft(input: {
    scopeDigest: string;
    sessionBindingDigest: string;
    now: Date;
  }): Promise<"expired" | "denied"> {
    const index = this.draftIndexes.get(input.scopeDigest);
    if (index === undefined) return "denied";
    const draft = this.drafts[index];
    if (!draft || draft.sessionBindingDigest !== input.sessionBindingDigest) return "denied";
    this.drafts[index] = Object.freeze({ ...draft, state: "expired", updatedAt: input.now });
    return "expired";
  }

  async revokeConsent(input: ConsentRevocationRecord): Promise<ConsentRevocationRepositoryResult> {
    const existingIdempotency = this.consentRevocations.find(
      (record) => record.idempotencyDigest === input.idempotencyDigest,
    );
    if (existingIdempotency) {
      return existingIdempotency.commandDigest === input.commandDigest
        ? { status: "replayed", revocationId: existingIdempotency.revocationId }
        : { status: "conflict" };
    }
    const submission = this.acceptedSubmissions.find(
      (candidate) => candidate.receipt.receiptId === input.submissionReceiptId,
    );
    if (
      !submission ||
      submission.sessionBindingDigest !== input.sessionBindingDigest ||
      !this.submissionScopes.has(submission.submissionId) ||
      !submission.consents.some(
        (consent) =>
          consent.consentType === input.consentType &&
          consent.version === input.consentVersion &&
          consent.granted,
      )
    ) {
      return { status: "denied" };
    }
    const existingConsent = this.consentRevocations.find(
      (record) =>
        record.submissionReceiptId === input.submissionReceiptId &&
        record.consentType === input.consentType &&
        record.consentVersion === input.consentVersion,
    );
    if (existingConsent) return { status: "replayed", revocationId: existingConsent.revocationId };
    const stored = Object.freeze({ ...input, submissionId: submission.submissionId });
    this.consentRevocations.push(stored);
    return { status: "revoked", revocationId: input.revocationId };
  }
}

export type AnswerProtectionPort = {
  protect(input: {
    fieldCode: string;
    value: PublicAnswerValue;
    sensitivity: string;
  }): Promise<{ ciphertext: string; keyReference: string; matchDigest?: string }>;
};

export type DraftProtectionPort = {
  seal(input: {
    plaintext: string;
    context: string;
  }): Promise<{ ciphertext: string; keyReference: string }>;
  open(input: { ciphertext: string; keyReference: string; context: string }): Promise<string>;
};
