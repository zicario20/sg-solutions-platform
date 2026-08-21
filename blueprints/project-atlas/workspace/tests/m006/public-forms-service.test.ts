import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  MemoryPublicFormsRepository,
  PublicFormsService,
  type FormDefinitionVersion,
  type PublicFormsServiceDependencies,
} from "@atlas/domain";

function definition(locale: "es" | "en"): FormDefinitionVersion {
  return {
    formCode: "contact",
    version: "1.0.0",
    locale,
    audience: "public",
    purpose: "lead_request",
    status: "published",
    retentionClass: "public_lead_request",
    schemaHash: "a".repeat(64),
    uiHash: "b".repeat(64),
    disclosureReferences: ["privacy_policy_v1"],
    approvedActions: ["lead_candidate", "payment_handoff"],
    consentRequirements: [
      {
        consentType: "service_contact",
        version: "1.0.0",
        disclosureReference: "service_contact_v1",
        required: true,
      },
      {
        consentType: "email_marketing",
        version: "1.0.0",
        disclosureReference: "email_marketing_v1",
        required: false,
      },
    ],
    fields: [
      {
        fieldCode: "email",
        fieldType: "email",
        step: 1,
        required: true,
        sensitivity: "basic_personal",
        labelId: `forms.contact.${locale}.email`,
      },
      {
        fieldCode: "message",
        fieldType: "textarea",
        step: 1,
        required: false,
        sensitivity: "public",
        labelId: `forms.contact.${locale}.message`,
        maxLength: 500,
      },
    ],
  };
}

function harness() {
  const repository = new MemoryPublicFormsRepository({
    definitions: [definition("es"), definition("en")],
  });
  let sequence = 0;
  const dependencies: PublicFormsServiceDependencies = {
    repository,
    clock: { now: () => new Date("2026-08-20T20:00:00.000Z") },
    ids: { next: (kind) => `${kind}_${String(++sequence).padStart(16, "0")}` },
    digest: {
      digest: async (value) => createHash("sha256").update(value).digest("hex"),
    },
    answerProtection: {
      protect: async ({ fieldCode, value }) => ({
        ciphertext: `ciphertext:${fieldCode}:${String(value).length}`,
        keyReference: "forms_key_v1",
      }),
    },
  };
  return { repository, service: new PublicFormsService(dependencies) };
}

const command = {
  formCode: "contact",
  formVersion: "1.0.0",
  locale: "es" as const,
  nonce: "nonce_0123456789abcdef",
  sessionBinding: "session_0123456789abcdef",
  idempotencyKey: "idem_0123456789abcdef",
  correlationId: "form_correlation_0123456789abcdef",
  answers: { email: " PERSON@Example.com ", message: "Necesito orientación" },
  consents: { service_contact: true, email_marketing: false },
  attribution: { landingPage: "/contact", utmSource: "newsletter" },
};

describe("M006 authoritative submission service", () => {
  it("accepts once and returns the same generic receipt on replay", async () => {
    const { repository, service } = harness();
    const first = await service.accept(command);
    const replay = await service.accept(command);

    expect(first).toMatchObject({ status: "accepted" });
    expect(replay).toEqual(first);
    expect(repository.acceptedSubmissions).toHaveLength(1);
  });

  it("persists protected answers, separated consent evidence and minimized owner commands", async () => {
    const { repository, service } = harness();
    await service.accept(command);

    const accepted = repository.acceptedSubmissions[0];
    expect(accepted?.answers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldCode: "email", ciphertext: expect.stringContaining("ciphertext") }),
      ]),
    );
    expect(JSON.stringify(accepted)).not.toContain("PERSON@Example.com");
    expect(accepted?.consents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ consentType: "service_contact", granted: true, version: "1.0.0" }),
        expect.objectContaining({ consentType: "email_marketing", granted: false, version: "1.0.0" }),
      ]),
    );
    expect(accepted?.outbox.filter((entry) => entry.owner === "lead")).toHaveLength(1);
    expect(accepted?.outbox.filter((entry) => entry.owner === "payment")).toHaveLength(0);
    expect(accepted).not.toHaveProperty("serviceStarted");
  });

  it("does not overwrite an idempotency scope when the command changes", async () => {
    const { repository, service } = harness();
    await service.accept(command);
    const conflict = await service.accept({
      ...command,
      answers: { ...command.answers, message: "Un mensaje diferente" },
    });

    expect(conflict).toMatchObject({ status: "request_received_for_review" });
    expect(repository.acceptedSubmissions).toHaveLength(1);
  });

  it("revalidates required answers and consent in the domain", async () => {
    const { service } = harness();
    await expect(
      service.accept({ ...command, answers: { email: "not-an-email" } }),
    ).resolves.toEqual({ status: "rejected", code: "invalid_request" });
    await expect(
      service.accept({ ...command, consents: { service_contact: false } }),
    ).resolves.toEqual({ status: "rejected", code: "invalid_request" });
  });
});
