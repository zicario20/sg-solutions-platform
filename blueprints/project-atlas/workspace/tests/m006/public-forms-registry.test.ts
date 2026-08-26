import {
  getPublishedProjection,
  publicFormRegistry,
  validatePublishedDefinition,
} from "@atlas/domain";
import { describe, expect, it } from "vitest";

const forbidden =
  /ssn|itin|password|credential|account_number|card_number|tax_document|credit_report|upload/iu;

describe("M006 governed public form inventory", () => {
  it("publishes the approved reusable inventory in both locales", () => {
    expect(publicFormRegistry.codes).toEqual([
      "contact",
      "consultation",
      "callback",
      "credit_interest",
      "taxes_interest",
      "business_formation_interest",
      "business_funding_interest",
      "home_buying_interest",
      "marketplace_interest",
    ]);
    for (const formCode of publicFormRegistry.codes) {
      const pair = publicFormRegistry.get(formCode);
      expect(pair).toBeDefined();
      expect(() => validatePublishedDefinition(pair!)).not.toThrow();
      expect(getPublishedProjection(formCode, "es")?.locale).toBe("es");
      expect(getPublishedProjection(formCode, "en")?.locale).toBe("en");
    }
  });

  it("contains no restricted, upload or direct payment authority", () => {
    for (const formCode of publicFormRegistry.codes) {
      for (const locale of ["es", "en"] as const) {
        const projection = getPublishedProjection(formCode, locale)!;
        expect(
          projection.fields.every((field) =>
            ["public", "basic_personal", "financial"].includes(field.sensitivity),
          ),
        ).toBe(true);
        expect(projection.fields.map((field) => field.fieldCode).join(" ")).not.toMatch(forbidden);
        expect(projection.fields.map((field) => field.fieldType)).not.toContain("file");
        expect(projection.approvedActions).not.toContain("service_start");
      }
    }
  });

  it("keeps consent purposes separated and supports governed conditional rules", () => {
    const consentTypes = new Set(
      publicFormRegistry.codes.flatMap((code) =>
        getPublishedProjection(code, "en")!.consentRequirements.map(
          (consent) => consent.consentType,
        ),
      ),
    );
    expect([...consentTypes]).toEqual(
      expect.arrayContaining([
        "service_contact",
        "sms_contact",
        "whatsapp_contact",
        "email_marketing",
        "partner_data_sharing",
      ]),
    );
    expect(
      getPublishedProjection("taxes_interest", "en")!.fields.some((field) => field.visibleWhen),
    ).toBe(true);
  });
});
