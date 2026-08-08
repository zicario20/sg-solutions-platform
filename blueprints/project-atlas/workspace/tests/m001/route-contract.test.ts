import { SUPPORTED_LOCALES } from "@atlas/i18n";
import { describe, expect, it } from "vitest";
import {
  getAlternatePath,
  getPageByPath,
  getStaticPageEntries,
} from "../../apps/www/src/lib/routes";

describe("M001 route contract", () => {
  it("supports Spanish and English in the approved order", () => {
    expect(SUPPORTED_LOCALES).toEqual(["es", "en"]);
  });

  it("maps equivalent service routes directly", () => {
    expect(getAlternatePath("service-credit", "en")).toBe("/en/services/credit/");
    expect(getAlternatePath("service-credit", "es")).toBe("/servicios/credito/");
    expect(getAlternatePath("service-business-compliance", "en")).toBe(
      "/en/services/business-compliance/",
    );
  });

  it("normalizes a missing trailing slash without changing page identity", () => {
    expect(getPageByPath("/en/services/credit")?.routeKey).toBe("service-credit");
    expect(getPageByPath("/en/services/credit/")?.routeKey).toBe("service-credit");
  });

  it("keeps the root page out of the rest-parameter static list", () => {
    const entries = getStaticPageEntries();
    expect(entries).toHaveLength(37);
    expect(entries.some((entry) => entry.params.slug === undefined)).toBe(false);
    expect(entries.some((entry) => entry.params.slug === "en/services/credit")).toBe(true);
  });
});
