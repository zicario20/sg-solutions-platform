import { describe, expect, it } from "vitest";
import {
  evaluateVisibility,
  type FormDefinitionVersion,
  validatePublishedDefinition,
} from "@atlas/domain";
import { parsePublicSubmissionEnvelope } from "@atlas/validation";

const fields: FormDefinitionVersion["fields"] = [
  {
    fieldCode: "email",
    fieldType: "email",
    step: 1,
    required: true,
    sensitivity: "basic_personal",
    labelId: "forms.contact.email",
  },
  {
    fieldCode: "self_employed",
    fieldType: "boolean",
    step: 2,
    required: true,
    sensitivity: "public",
    labelId: "forms.contact.self_employed",
  },
  {
    fieldCode: "business_type",
    fieldType: "select",
    step: 2,
    required: true,
    sensitivity: "public",
    labelId: "forms.contact.business_type",
    optionCodes: ["sole_proprietor", "llc"],
    visibleWhen: { operator: "equals", fieldCode: "self_employed", value: true },
  },
];

function version(locale: "es" | "en", overrides: Partial<FormDefinitionVersion> = {}): FormDefinitionVersion {
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
    approvedActions: ["lead_candidate"],
    fields,
    ...overrides,
  };
}

describe("M006 public form definitions", () => {
  it("rejects fields that public forms may never collect", () => {
    const unsafe = version("es", {
      fields: [
        ...fields,
        {
          fieldCode: "ssn",
          fieldType: "text",
          step: 3,
          required: true,
          sensitivity: "identity",
          labelId: "synthetic.ssn",
        },
      ],
    });

    expect(() => validatePublishedDefinition({ es: unsafe, en: version("en") })).toThrow(
      "PUBLIC_FIELD_SENSITIVITY_FORBIDDEN",
    );
  });

  it("requires structurally identical Spanish and English versions", () => {
    const english = version("en", { fields: fields.slice(0, 2) });
    expect(() => validatePublishedDefinition({ es: version("es"), en: english })).toThrow(
      "LOCALE_PARITY_REQUIRED",
    );
  });

  it("evaluates only the closed conditional rule tree", () => {
    const result = evaluateVisibility(version("es"), { self_employed: true });
    expect(result.visible).toContain("business_type");
    expect(evaluateVisibility(version("es"), { self_employed: false }).hidden).toContain(
      "business_type",
    );
  });

  it("parses and normalizes only the public submission envelope", () => {
    const parsed = parsePublicSubmissionEnvelope({
      formCode: " CONTACT ",
      formVersion: "1.0.0",
      locale: "ES",
      nonce: "nonce_0123456789abcdef",
      idempotencyKey: "idem_0123456789abcdef",
      answers: { email: " Person@Example.COM ", self_employed: true },
      consents: { service_contact: true, email_marketing: false },
      attribution: { utmSource: "newsletter", landingPage: "/contact" },
    });

    expect(parsed).toMatchObject({ formCode: "contact", locale: "es" });
    expect(parsed.answers.email).toBe("Person@Example.COM");
    expect(() =>
      parsePublicSubmissionEnvelope({
        ...parsed,
        price: 1,
      }),
    ).toThrow();
  });

  it("rejects dangerous answer keys and unsupported answer values", () => {
    expect(() =>
      parsePublicSubmissionEnvelope({
        formCode: "contact",
        formVersion: "1.0.0",
        locale: "en",
        nonce: "nonce_0123456789abcdef",
        idempotencyKey: "idem_0123456789abcdef",
        answers: { __proto__: "polluted" },
        consents: {},
      }),
    ).toThrow();
  });
});
