import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import { getStableHelpSlug } from "../../apps/www/src/content/help-center/route-manifest";
import {
  getHelpAlternatePath,
  getHelpCategoryPath,
  getHelpCollectionPath,
  getHelpDetailPath,
  getHelpHubPath,
  getHelpSearchPath,
  HELP_LEGACY_REDIRECTS,
} from "../../apps/www/src/lib/help-routes";

describe("M002 route contract", () => {
  it("uses stable localized hub, collection and search paths", () => {
    expect(getHelpHubPath("es")).toBe("/recursos/");
    expect(getHelpHubPath("en")).toBe("/en/resources/");
    expect(getHelpCollectionPath("es", "faq")).toBe("/recursos/preguntas-frecuentes/");
    expect(getHelpCollectionPath("en", "checklist")).toBe("/en/resources/checklists/");
    expect(getHelpSearchPath("es")).toBe("/recursos/buscar/");
    expect(getHelpSearchPath("en")).toBe("/en/resources/search/");
    expect(getHelpCategoryPath("es", "home-buying")).toBe("/recursos/categorias/comprar-casa/");
    expect(getHelpCategoryPath("en", "home-buying")).toBe("/en/resources/categories/home-buying/");
  });

  it("creates localized detail paths without user-controlled fragments", () => {
    expect(getHelpDetailPath("es", "guide", "como-prepararte-para-una-evaluacion")).toBe(
      "/recursos/guias/como-prepararte-para-una-evaluacion/",
    );
    expect(getHelpDetailPath("en", "glossary", "dti")).toBe("/en/resources/glossary/dti/");
    expect(() => getHelpDetailPath("en", "guide", "../unsafe")).toThrow("Invalid help slug");
  });

  it("keeps every detail slug in the explicit route manifest", () => {
    for (const record of HELP_CONTENT) {
      expect(record.slug).toBe(getStableHelpSlug(record.translationGroupId, record.locale));
    }
    expect(() => getStableHelpSlug("missing-group", "es")).toThrow("Missing stable help slug");
  });

  it("pairs every knowledge detail with its exact alternate language path", () => {
    for (const record of HELP_CONTENT.filter(
      (candidate) => candidate.status === "published" && candidate.audiences.includes("public"),
    )) {
      const alternate = getHelpAlternatePath(record, HELP_CONTENT, new Date("2026-08-08"));
      const otherLocale = record.locale === "es" ? "en" : "es";
      const pair = HELP_CONTENT.find(
        (candidate) =>
          candidate.translationGroupId === record.translationGroupId &&
          candidate.locale === otherLocale,
      );
      expect(pair).toBeDefined();
      if (!pair) throw new Error(`Missing ${otherLocale} pair for ${record.id}`);
      expect(alternate).toBe(getHelpDetailPath(otherLocale, pair.type, pair.slug));
    }
  });

  it("fails closed when the paired detail is not public", () => {
    const record = HELP_CONTENT.find((item) => item.id === "faq-what-is-sg-es");
    if (!record) throw new Error("Missing route fixture");
    const records = HELP_CONTENT.map((item) =>
      item.translationGroupId === record.translationGroupId && item.locale === "en"
        ? { ...item, status: "draft" as const }
        : item,
    );

    expect(() => getHelpAlternatePath(record, records, new Date("2026-08-08"))).toThrow(
      "Missing public en translation",
    );
  });

  it("preserves legacy FAQ URLs as permanent canonical redirects", () => {
    expect(HELP_LEGACY_REDIRECTS).toEqual({
      "/preguntas-frecuentes/": "/recursos/preguntas-frecuentes/",
      "/en/faq/": "/en/resources/faq/",
    });
  });
});
