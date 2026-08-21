import { evaluateVisibility } from "./definition.ts";
import type {
  FormDefinitionVersion,
  FormFieldDefinition,
  PublicAnswerValue,
  PublicFormLocale,
} from "./contracts.ts";
import type { FormOutboxCommand, FormOwner } from "./ports.ts";
import type {
  AcceptedFormSubmission,
  AnswerProtectionPort,
  FormAttributionRecord,
  FormConsentEvidence,
  FormReceipt,
  ProtectedFormAnswer,
  PublicFormsRepository,
  ReviewReceipt,
} from "./repository.ts";

export type AcceptPublicFormCommand = Readonly<{
  formCode: string;
  formVersion: string;
  locale: PublicFormLocale;
  nonce: string;
  sessionBinding: string;
  idempotencyKey: string;
  correlationId: string;
  answers: Readonly<Record<string, PublicAnswerValue>>;
  consents: Readonly<Record<string, boolean>>;
  attribution?: FormAttributionRecord;
}>;

export type PublicFormsServiceDependencies = Readonly<{
  repository: PublicFormsRepository;
  clock: { now(): Date };
  ids: { next(kind: string): string };
  digest: { digest(value: string): Promise<string> };
  answerProtection: AnswerProtectionPort;
}>;

export type AcceptPublicFormResult =
  | FormReceipt
  | ReviewReceipt
  | Readonly<{ status: "rejected" | "unavailable"; code: "invalid_request" | "form_unavailable" }>;

const SAFE_RECORD_KEYS = /^[a-z][a-z0-9_]{1,63}$/u;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeAnswer(field: FormFieldDefinition, value: PublicAnswerValue): PublicAnswerValue {
  if (field.fieldType === "boolean" || field.fieldType === "checkbox") {
    if (typeof value !== "boolean") throw new Error("invalid");
    return value;
  }
  if (field.fieldType === "number" || field.fieldType === "currency") {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("invalid");
    if (field.minimum !== undefined && value < field.minimum) throw new Error("invalid");
    if (field.maximum !== undefined && value > field.maximum) throw new Error("invalid");
    return value;
  }
  if (typeof value !== "string") throw new Error("invalid");
  const text = value.trim();
  if (/\p{Cc}/u.test(text) || /<\/?[a-z][^>]*>/iu.test(text)) throw new Error("invalid");
  if (field.maxLength !== undefined && [...text].length > field.maxLength) throw new Error("invalid");
  if (field.fieldType === "email") {
    const normalized = text.toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)) {
      throw new Error("invalid");
    }
    return normalized;
  }
  if (field.fieldType === "tel") {
    const compact = text.replace(/[\s().-]/gu, "");
    const normalized = compact.startsWith("+") ? compact : `+1${compact}`;
    if (!/^\+[1-9]\d{7,14}$/u.test(normalized)) throw new Error("invalid");
    return normalized;
  }
  if (field.fieldType === "state") {
    const normalized = text.toUpperCase();
    if (!/^[A-Z]{2}$/u.test(normalized)) throw new Error("invalid");
    return normalized;
  }
  if (field.fieldType === "date" && !/^\d{4}-\d{2}-\d{2}$/u.test(text)) {
    throw new Error("invalid");
  }
  if ((field.fieldType === "select" || field.fieldType === "radio") && !field.optionCodes?.includes(text)) {
    throw new Error("invalid");
  }
  return text;
}

function present(value: PublicAnswerValue | undefined): boolean {
  return value !== undefined && (typeof value !== "string" || value.length > 0);
}

function validateAndNormalizeAnswers(
  definition: FormDefinitionVersion,
  input: Readonly<Record<string, PublicAnswerValue>>,
): Readonly<Record<string, PublicAnswerValue>> {
  if (!isPlainRecord(input) || Object.keys(input).some((key) => !SAFE_RECORD_KEYS.test(key))) {
    throw new Error("invalid");
  }
  const fields = new Map(definition.fields.map((field) => [field.fieldCode, field]));
  if (Object.keys(input).some((fieldCode) => !fields.has(fieldCode))) throw new Error("invalid");
  const initialVisibility = evaluateVisibility(definition, input);
  if (initialVisibility.hidden.some((fieldCode) => Object.hasOwn(input, fieldCode))) {
    throw new Error("invalid");
  }
  const normalized: Record<string, PublicAnswerValue> = Object.create(null);
  for (const fieldCode of initialVisibility.visible) {
    const field = fields.get(fieldCode);
    if (!field) throw new Error("invalid");
    const raw = input[fieldCode];
    if (!present(raw)) {
      if (field.required) throw new Error("invalid");
      continue;
    }
    normalized[fieldCode] = normalizeAnswer(field, raw as PublicAnswerValue);
  }
  const finalVisibility = evaluateVisibility(definition, normalized);
  for (const fieldCode of finalVisibility.visible) {
    const field = fields.get(fieldCode);
    if (field?.required && !present(normalized[fieldCode])) throw new Error("invalid");
  }
  return Object.freeze(normalized);
}

function validateConsents(
  definition: FormDefinitionVersion,
  input: Readonly<Record<string, boolean>>,
  sessionBindingDigest: string,
  now: Date,
): readonly FormConsentEvidence[] {
  if (!isPlainRecord(input) || Object.values(input).some((value) => typeof value !== "boolean")) {
    throw new Error("invalid");
  }
  const requirements = new Map(
    definition.consentRequirements.map((requirement) => [requirement.consentType, requirement]),
  );
  if (Object.keys(input).some((consentType) => !requirements.has(consentType))) {
    throw new Error("invalid");
  }
  return definition.consentRequirements.map((requirement) => {
    const granted = input[requirement.consentType] === true;
    if (requirement.required && !granted) throw new Error("invalid");
    return Object.freeze({
      consentType: requirement.consentType,
      version: requirement.version,
      disclosureReference: requirement.disclosureReference,
      granted,
      source: "public_form" as const,
      sessionBindingDigest,
      occurredAt: now,
    });
  });
}

function outboxCommand(input: {
  ids: PublicFormsServiceDependencies["ids"];
  owner: FormOwner;
  operation: string;
  submissionId: string;
  definition: FormDefinitionVersion;
  consentType?: string;
  channel?: "sms" | "whatsapp" | "email";
}): FormOutboxCommand {
  const commandId = input.ids.next("form_outbox");
  return Object.freeze({
    commandId,
    owner: input.owner,
    operation: input.operation,
    submissionRef: input.submissionId,
    formCode: input.definition.formCode,
    locale: input.definition.locale,
    ...(input.definition.serviceCode ? { serviceCode: input.definition.serviceCode } : {}),
    ...(input.consentType ? { consentType: input.consentType } : {}),
    ...(input.channel ? { channel: input.channel } : {}),
    idempotencyKey: `${input.submissionId}:${input.owner}:${input.operation}:${input.consentType ?? input.channel ?? "default"}`,
    state: "pending",
  });
}

function buildOutbox(
  definition: FormDefinitionVersion,
  submissionId: string,
  consents: readonly FormConsentEvidence[],
  ids: PublicFormsServiceDependencies["ids"],
): readonly FormOutboxCommand[] {
  const commands: FormOutboxCommand[] = [];
  const add = (owner: FormOwner, operation: string, extra: { consentType?: string; channel?: "sms" | "whatsapp" | "email" } = {}) =>
    commands.push(outboxCommand({ ids, owner, operation, submissionId, definition, ...extra }));
  if (definition.approvedActions.includes("lead_candidate")) add("lead", "accept_candidate");
  if (definition.approvedActions.includes("appointment_intent")) {
    add("appointment", "request_preference");
  }
  if (
    definition.approvedActions.includes("payment_handoff") &&
    consents.some((consent) => consent.consentType === "financial_product_referral" && consent.granted)
  ) {
    add("payment", "request_handoff");
  }
  for (const consent of consents) add("consent", "record_evidence", { consentType: consent.consentType });
  if (definition.approvedActions.includes("channel_handoff")) {
    if (consents.some((consent) => consent.consentType === "sms_contact" && consent.granted)) {
      add("channel", "queue_handoff", { channel: "sms" });
    }
    if (consents.some((consent) => consent.consentType === "whatsapp_contact" && consent.granted)) {
      add("channel", "queue_handoff", { channel: "whatsapp" });
    }
  }
  add("analytics", "form_accepted");
  return Object.freeze(commands);
}

export class PublicFormsService {
  constructor(private readonly dependencies: PublicFormsServiceDependencies) {}

  async accept(command: AcceptPublicFormCommand): Promise<AcceptPublicFormResult> {
    const definition = await this.dependencies.repository.loadPublishedDefinition({
      formCode: command.formCode,
      version: command.formVersion,
      locale: command.locale,
    });
    if (!definition) return { status: "unavailable", code: "form_unavailable" };

    let normalized: Readonly<Record<string, PublicAnswerValue>>;
    let sessionBindingDigest: string;
    let nonceDigest: string;
    try {
      normalized = validateAndNormalizeAnswers(definition, command.answers);
      sessionBindingDigest = await this.dependencies.digest.digest(
        `public-forms:session:v1\u0000${command.sessionBinding}`,
      );
      nonceDigest = await this.dependencies.digest.digest(`public-forms:nonce:v1\u0000${command.nonce}`);
    } catch {
      return { status: "rejected", code: "invalid_request" };
    }

    const now = this.dependencies.clock.now();
    let consents: readonly FormConsentEvidence[];
    try {
      consents = validateConsents(definition, command.consents, sessionBindingDigest, now);
    } catch {
      return { status: "rejected", code: "invalid_request" };
    }

    const commandDigest = await this.dependencies.digest.digest(
      `public-forms:command:v1\u0000${stable({
        formCode: command.formCode,
        formVersion: command.formVersion,
        locale: command.locale,
        nonceDigest,
        sessionBindingDigest,
        answers: normalized,
        consents: command.consents,
        attribution: command.attribution ?? null,
      })}`,
    );
    const idempotencyDigest = await this.dependencies.digest.digest(
      `public-forms:idempotency:v1\u0000${command.idempotencyKey}`,
    );
    const scope = await this.dependencies.digest.digest(
      `public-forms:scope:v1\u0000${stable({
        formCode: definition.formCode,
        version: definition.version,
        locale: definition.locale,
        sessionBindingDigest,
        idempotencyDigest,
      })}`,
    );
    const reservationId = this.dependencies.ids.next("form_reservation");
    const proposedReceipt: FormReceipt = Object.freeze({
      status: "accepted",
      receiptId: this.dependencies.ids.next("form_receipt"),
      issuedAt: now,
    });
    const reservation = await this.dependencies.repository.reserveOrReplay({
      scope,
      commandDigest,
      reservationId,
      proposedReceipt,
    });
    if (reservation.status === "replay") return reservation.receipt;
    if (reservation.status === "conflict" || reservation.status === "in_progress") {
      return Object.freeze({
        status: "request_received_for_review",
        receiptId: reservation.receipt.receiptId,
        issuedAt: reservation.receipt.issuedAt,
      });
    }

    try {
      const protectedAnswers: ProtectedFormAnswer[] = [];
      const fieldMap = new Map(definition.fields.map((field) => [field.fieldCode, field]));
      for (const [fieldCode, value] of Object.entries(normalized)) {
        const field = fieldMap.get(fieldCode);
        if (!field) throw new Error("invalid");
        const protectedValue = await this.dependencies.answerProtection.protect({
          fieldCode,
          value,
          sensitivity: field.sensitivity,
        });
        protectedAnswers.push(
          Object.freeze({
            fieldCode,
            valueType:
              typeof value === "string"
                ? ("string" as const)
                : typeof value === "number"
                  ? ("number" as const)
                  : ("boolean" as const),
            sensitivity: field.sensitivity,
            ...protectedValue,
          }),
        );
      }
      const submissionId = this.dependencies.ids.next("form_submission");
      const submission: AcceptedFormSubmission = Object.freeze({
        submissionId,
        receipt: proposedReceipt,
        formCode: definition.formCode,
        formVersion: definition.version,
        locale: definition.locale,
        sessionBindingDigest,
        nonceDigest,
        commandDigest,
        answers: Object.freeze(protectedAnswers),
        consents,
        ...(command.attribution ? { attribution: Object.freeze({ ...command.attribution }) } : {}),
        outbox: buildOutbox(definition, submissionId, consents, this.dependencies.ids),
        acceptedAt: now,
      });
      return await this.dependencies.repository.commitAcceptedSubmission({
        scope,
        reservationId,
        submission,
      });
    } catch {
      await this.dependencies.repository.abandonReservation({ scope, reservationId });
      return { status: "unavailable", code: "form_unavailable" };
    }
  }
}
