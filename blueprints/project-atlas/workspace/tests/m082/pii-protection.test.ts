import { describe, expect, it } from "vitest";

import {
  createDataCategory,
  createDataClassification,
  createDataPurpose,
  createSensitiveFieldPolicy,
  evaluatePiiAccess,
  registerSensitiveField,
  requestPiiExport,
} from "../../packages/pii-protection/src/index";

describe("M082 PII protection controlled foundation", () => {
  it("does not release a sensitive field while policy enforcement is disabled", () => {
    const classification = createDataClassification({
      permission: "pii.classification.create",
      code: "RESTRICTED",
      level: "restricted",
    });
    const category = createDataCategory({
      permission: "pii.category.create",
      code: "TAX_IDENTIFIER",
      classification,
    });
    const policy = createSensitiveFieldPolicy({
      permission: "pii.field_policy.create",
      code: "TAX_IDENTIFIER_POLICY",
      category,
    });
    const field = registerSensitiveField({
      permission: "pii.field.register",
      fieldReference: "client.taxIdentifier",
      policy,
    });
    const result = evaluatePiiAccess({
      permission: "pii.access.evaluate",
      subjectReference: "principal:staff-1",
      field,
      action: "display",
      purpose: createDataPurpose({ purposeReference: "purpose:tax-preparation" }),
    });

    expect(result.status).toBe("review_required");
    expect(result.allowed).toBe(false);
    expect(result.fieldValueReleased).toBe(false);
  });

  it("does not allow raw values in the sensitive-field registry", () => {
    const classification = createDataClassification({
      permission: "pii.classification.create",
      code: "CONFIDENTIAL",
      level: "confidential",
    });
    const category = createDataCategory({
      permission: "pii.category.create",
      code: "IDENTITY",
      classification,
    });
    const policy = createSensitiveFieldPolicy({
      permission: "pii.field_policy.create",
      code: "IDENTITY_POLICY",
      category,
    });

    expect(() =>
      registerSensitiveField({
        permission: "pii.field.register",
        fieldReference: "client.ssn",
        policy,
        includesRawValue: true,
      }),
    ).toThrow("never raw PII values");
  });

  it("keeps exports blocked", () => {
    const request = requestPiiExport({
      permission: "pii.export.request",
      requestId: "export-1",
      subjectReference: "principal:staff-2",
    });

    expect(request.delivered).toBe(false);
    expect(request.rawDataIncluded).toBe(false);
  });
});
