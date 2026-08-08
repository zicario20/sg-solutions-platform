import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import {
  getHelpAlternatePath,
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
  });

  it("creates localized detail paths without user-controlled fragments", () => {
    expect(getHelpDetailPath("es", "guide", "prepare-evaluation")).toBe(
      "/recursos/guias/prepare-evaluation/",
    );
    expect(getHelpDetailPath("en", "glossary", "dti")).toBe("/en/resources/glossary/dti/");
    expect(() => getHelpDetailPath("en", "guide", "../unsafe")).toThrow("Invalid help slug");
  });

  it("pairs every knowledge detail with its exact alternate language path", () => {
    for (const record of HELP_CONTENT) {
      const alternate = getHelpAlternatePath(record, HELP_CONTENT);
      const otherLocale = record.locale === "es" ? "en" : "es";
      const pair = HELP_CONTENT.find(
        (candidate) =>
          candidate.translationGroupId === record.translationGroupId && candidate.locale === otherLocale,
      );
      expect(pair).toBeDefined();
      expect(alternate).toBe(getHelpDetailPath(otherLocale, pair!.type, pair!.slug));
    }
  });

  it("preserves legacy FAQ URLs as permanent canonical redirects", () => {
    expect(HELP_LEGACY_REDIRECTS).toEqual({
      "/preguntas-frecuentes/": "/recursos/preguntas-frecuentes/",
      "/en/faq/": "/en/resources/faq/",
    });
  });
});
