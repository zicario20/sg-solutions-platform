import { createHash } from "node:crypto";

import type {
  AcceptPublicFormCommand,
  FormConsentRequirement,
  FormDefinitionVersion,
  FormFieldDefinition,
} from "../../packages/domain/src/public-forms/index.ts";
import {
  MemoryPublicFormsRepository,
  PublicFormsService,
} from "../../packages/domain/src/public-forms/index.ts";

export const REVIEW_NOW = new Date("2026-08-20T12:00:00.000Z");

export function reviewDefinition(
  input: {
    fields?: readonly FormFieldDefinition[];
    consents?: readonly FormConsentRequirement[];
    approvedActions?: FormDefinitionVersion["approvedActions"];
  } = {},
): FormDefinitionVersion {
  return Object.freeze({
    formCode: "contact",
    version: "1.0.0",
    locale: "es",
    audience: "public",
    purpose: "lead_request",
    status: "published",
    serviceCode: "general_contact",
    retentionClass: "public_lead_90d",
    schemaHash: "a".repeat(64),
    uiHash: "b".repeat(64),
    disclosureReferences: Object.freeze(["privacy:1.0.0:es"]),
    approvedActions: input.approvedActions ?? Object.freeze(["lead_candidate"]),
    consentRequirements:
      input.consents ??
      Object.freeze([
        Object.freeze({
          consentType: "privacy_policy",
          version: "1.0.0",
          disclosureReference: "privacy:1.0.0:es",
          required: true,
        }),
      ]),
    fields:
      input.fields ??
      Object.freeze([
        Object.freeze({
          fieldCode: "name",
          fieldType: "text",
          step: 1,
          required: true,
          sensitivity: "basic_personal",
          labelId: "forms.contact.name",
          maxLength: 80,
        }),
      ]),
  });
}

export function createReviewService(definition = reviewDefinition()) {
  const repository = new MemoryPublicFormsRepository({ definitions: [definition] });
  let sequence = 0;
  const service = new PublicFormsService({
    repository,
    clock: { now: () => REVIEW_NOW },
    ids: { next: (kind) => `${kind}_${String(++sequence).padStart(2, "0")}` },
    digest: {
      digest: async (value) => createHash("sha256").update(value).digest("hex"),
    },
    answerProtection: {
      protect: async ({ value }) => ({
        ciphertext: Buffer.from(JSON.stringify(value), "utf8").toString("base64url"),
        keyReference: "test-key-v1",
        encryptionContextVersion: "m006.answer.v1" as const,
      }),
    },
  });
  return { repository, service };
}

export function reviewCommand(
  input: {
    answers?: AcceptPublicFormCommand["answers"];
    consents?: AcceptPublicFormCommand["consents"];
    sessionBinding?: string;
    idempotencyKey?: string;
  } = {},
): AcceptPublicFormCommand {
  return Object.freeze({
    formCode: "contact",
    formVersion: "1.0.0",
    locale: "es",
    nonce: "nonce_review_01",
    sessionBinding: input.sessionBinding ?? "session-review-a",
    idempotencyKey: input.idempotencyKey ?? "idem_review_01",
    correlationId: "form_correlation_0123456789abcdef0123456789abcdef",
    answers: input.answers ?? Object.freeze({ name: "Sami" }),
    consents: input.consents ?? Object.freeze({ privacy_policy: true }),
  });
}
