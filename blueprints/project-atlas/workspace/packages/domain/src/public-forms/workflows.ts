import type { PublicAnswerValue, PublicFormLocale } from "./contracts.ts";
import type { FormOutboxCommand } from "./ports.ts";
import type {
  ConsentRevocationRecord,
  DraftProtectionPort,
  FormDraftRecord,
  PublicFormsRepository,
} from "./repository.ts";
import { normalizePublicFormDraftAnswers } from "./service.ts";

type WorkflowDependencies = Readonly<{
  repository: PublicFormsRepository;
  clock: { now(): Date };
  ids: { next(kind: string): string };
  digest: { digest(value: string): Promise<string> };
  draftProtection: DraftProtectionPort;
  draftTtlMs: number;
}>;

export type SavePublicFormDraftCommand = Readonly<{
  formCode: string;
  formVersion: string;
  locale: PublicFormLocale;
  sessionBinding: string;
  answers: Readonly<Record<string, PublicAnswerValue>>;
  draftReference?: string;
}>;

export type SavePublicFormDraftResult =
  | Readonly<{ status: "saved"; draftReference: string; expiresAt: Date }>
  | Readonly<{ status: "rejected" | "unavailable" }>;

export type ResumePublicFormDraftResult =
  | Readonly<{
      status: "resumed";
      draftReference: string;
      formCode: string;
      formVersion: string;
      locale: PublicFormLocale;
      answers: Readonly<Record<string, PublicAnswerValue>>;
      expiresAt: Date;
    }>
  | Readonly<{ status: "denied" | "expired" | "unavailable" }>;

export type RevokePublicFormConsentCommand = Readonly<{
  submissionReceiptId: string;
  sessionBinding: string;
  consentType: string;
  consentVersion: string;
  idempotencyKey: string;
}>;

export type RevokePublicFormConsentResult =
  | Readonly<{ status: "revoked" | "replayed"; revocationId: string }>
  | Readonly<{ status: "denied" | "conflict" | "unavailable" }>;

const DRAFT_REFERENCE = /^form_draft_[A-Za-z0-9_-]{16,128}$/u;
const SAFE_CODE = /^[a-z][a-z0-9_]{1,63}$/u;
const SAFE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const IDEMPOTENCY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;
const COMMUNICATION_CONSENTS = new Set([
  "sms_contact",
  "whatsapp_contact",
  "electronic_communications",
  "email_marketing",
  "service_contact",
]);

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function revocationChannel(consentType: string): FormOutboxCommand["channel"] | undefined {
  if (consentType === "whatsapp_contact") return "whatsapp";
  if (consentType === "sms_contact") return "sms";
  if (consentType === "electronic_communications" || consentType === "email_marketing") return "email";
  return undefined;
}

export class PublicFormsLifecycleService {
  constructor(private readonly dependencies: WorkflowDependencies) {
    if (
      !Number.isSafeInteger(dependencies.draftTtlMs) ||
      dependencies.draftTtlMs < 60_000 ||
      dependencies.draftTtlMs > 30 * 24 * 60 * 60 * 1_000
    ) {
      throw new Error("PUBLIC_FORM_DRAFT_TTL_INVALID");
    }
  }

  async saveDraft(command: SavePublicFormDraftCommand): Promise<SavePublicFormDraftResult> {
    try {
      if (!SAFE_CODE.test(command.formCode) || !SAFE_VERSION.test(command.formVersion)) {
        return { status: "rejected" };
      }
      const definition = await this.dependencies.repository.loadPublishedDefinition({
        formCode: command.formCode,
        version: command.formVersion,
        locale: command.locale,
      });
      if (!definition) return { status: "unavailable" };
      const answers = normalizePublicFormDraftAnswers(definition, command.answers);
      const draftReference = command.draftReference ?? this.dependencies.ids.next("form_draft");
      if (!DRAFT_REFERENCE.test(draftReference)) return { status: "rejected" };
      const scopeDigest = await this.dependencies.digest.digest(
        `public-forms:draft-scope:v1\u0000${draftReference}`,
      );
      const sessionBindingDigest = await this.dependencies.digest.digest(
        `public-forms:session:v1\u0000${command.sessionBinding}`,
      );
      const now = this.dependencies.clock.now();
      const expiresAt = new Date(now.getTime() + this.dependencies.draftTtlMs);
      const plaintext = stable({
        formCode: definition.formCode,
        formVersion: definition.version,
        locale: definition.locale,
        answers,
      });
      const protectedDraft = await this.dependencies.draftProtection.seal({
        plaintext,
        context: scopeDigest,
      });
      const record: FormDraftRecord = Object.freeze({
        draftReference,
        scopeDigest,
        sessionBindingDigest,
        formCode: definition.formCode,
        formVersion: definition.version,
        locale: definition.locale,
        ...protectedDraft,
        state: "active",
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });
      const saved = await this.dependencies.repository.saveDraft(record);
      return saved === "saved"
        ? Object.freeze({ status: "saved", draftReference, expiresAt })
        : { status: "rejected" };
    } catch {
      return { status: "unavailable" };
    }
  }

  async resumeDraft(command: {
    draftReference: string;
    sessionBinding: string;
  }): Promise<ResumePublicFormDraftResult> {
    try {
      if (!DRAFT_REFERENCE.test(command.draftReference)) return { status: "denied" };
      const scopeDigest = await this.dependencies.digest.digest(
        `public-forms:draft-scope:v1\u0000${command.draftReference}`,
      );
      const sessionBindingDigest = await this.dependencies.digest.digest(
        `public-forms:session:v1\u0000${command.sessionBinding}`,
      );
      const now = this.dependencies.clock.now();
      const draft = await this.dependencies.repository.loadDraft({
        scopeDigest,
        sessionBindingDigest,
        now,
      });
      if (!draft) return { status: "denied" };
      if (draft.state !== "active" || draft.expiresAt.getTime() <= now.getTime()) {
        await this.dependencies.repository.expireDraft({ scopeDigest, sessionBindingDigest, now });
        return { status: "expired" };
      }
      const plaintext = await this.dependencies.draftProtection.open({
        ciphertext: draft.ciphertext,
        keyReference: draft.keyReference,
        context: scopeDigest,
      });
      const payload = JSON.parse(plaintext) as unknown;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid");
      const record = payload as Record<string, unknown>;
      if (
        record.formCode !== draft.formCode ||
        record.formVersion !== draft.formVersion ||
        record.locale !== draft.locale ||
        !record.answers ||
        typeof record.answers !== "object" ||
        Array.isArray(record.answers)
      ) {
        throw new Error("invalid");
      }
      return Object.freeze({
        status: "resumed",
        draftReference: draft.draftReference,
        formCode: draft.formCode,
        formVersion: draft.formVersion,
        locale: draft.locale,
        answers: Object.freeze({ ...(record.answers as Record<string, PublicAnswerValue>) }),
        expiresAt: draft.expiresAt,
      });
    } catch {
      return { status: "unavailable" };
    }
  }

  async revokeConsent(
    command: RevokePublicFormConsentCommand,
  ): Promise<RevokePublicFormConsentResult> {
    try {
      if (
        !IDEMPOTENCY.test(command.idempotencyKey) ||
        !SAFE_CODE.test(command.consentType) ||
        !SAFE_VERSION.test(command.consentVersion)
      ) {
        return { status: "denied" };
      }
      const sessionBindingDigest = await this.dependencies.digest.digest(
        `public-forms:session:v1\u0000${command.sessionBinding}`,
      );
      const idempotencyDigest = await this.dependencies.digest.digest(
        `public-forms:consent-revocation-idempotency:v1\u0000${command.idempotencyKey}`,
      );
      const commandDigest = await this.dependencies.digest.digest(
        `public-forms:consent-revocation:v1\u0000${stable({
          submissionReceiptId: command.submissionReceiptId,
          consentType: command.consentType,
          consentVersion: command.consentVersion,
          sessionBindingDigest,
        })}`,
      );
      const revocationId = this.dependencies.ids.next("form_consent_revocation");
      const occurredAt = this.dependencies.clock.now();
      const outbox: FormOutboxCommand[] = [];
      const add = (owner: FormOutboxCommand["owner"], operation: string) => {
        const channel = owner === "channel" ? revocationChannel(command.consentType) : undefined;
        outbox.push(
          Object.freeze({
            commandId: this.dependencies.ids.next("form_outbox"),
            owner,
            operation,
            submissionRef: command.submissionReceiptId,
            formCode: "consent_revocation",
            locale: "es",
            consentType: command.consentType,
            revocationId,
            ...(channel ? { channel } : {}),
            idempotencyKey: `${revocationId}:${owner}:${operation}:${command.consentType}`,
            state: "pending",
          }),
        );
      };
      add("consent", "record_revocation");
      if (COMMUNICATION_CONSENTS.has(command.consentType)) add("channel", "apply_consent_revocation");
      const record: ConsentRevocationRecord = Object.freeze({
        revocationId,
        submissionReceiptId: command.submissionReceiptId,
        consentType: command.consentType,
        consentVersion: command.consentVersion,
        sessionBindingDigest,
        idempotencyDigest,
        commandDigest,
        evidenceReference: `consent-revocation:${command.consentType}:${command.consentVersion}`,
        occurredAt,
        outbox: Object.freeze(outbox),
      });
      return await this.dependencies.repository.revokeConsent(record);
    } catch {
      return { status: "unavailable" };
    }
  }
}
