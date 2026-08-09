import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import {
  createHelpPageShell,
  getHelpCategoryEntries,
  getHelpCollectionEntries,
  getHelpDetailEntries,
  getHelpSitemapPaths,
} from "../../apps/www/src/lib/help-pages";

const at = new Date("2026-08-08T12:00:00.000Z");

describe("M002 server-rendered page data", () => {
  it("creates one static detail entry for every public launch record in each locale", () => {
    const spanish = getHelpDetailEntries(HELP_CONTENT, "es", at);
    const english = getHelpDetailEntries(HELP_CONTENT, "en", at);

    expect(spanish).toHaveLength(77);
    expect(english).toHaveLength(77);
    expect(new Set([...spanish, ...english].map((entry) => entry.path)).size).toBe(154);
    expect([...spanish, ...english].every((entry) => entry.record.blocks.length > 0)).toBe(true);
  });

  it("creates five non-empty localized collection entries with public records only", () => {
    for (const locale of ["es", "en"] as const) {
      const collections = getHelpCollectionEntries(HELP_CONTENT, locale, at);
      expect(collections).toHaveLength(5);
      expect(collections.find((entry) => entry.type === "faq")?.records).toHaveLength(62);
      expect(
        collections.every((entry) => entry.records.every((record) => record.locale === locale)),
      ).toBe(true);
    }
  });

  it("creates only non-empty localized category listings", () => {
    for (const locale of ["es", "en"] as const) {
      const categories = getHelpCategoryEntries(HELP_CONTENT, locale, at);
      expect(categories.length).toBeLessThan(16);
      expect(categories.every((entry) => entry.records.length > 0)).toBe(true);
      expect(
        categories.find((entry) => entry.category === "home-buying")?.records.length,
      ).toBeGreaterThan(0);
      expect(categories.every((entry) => entry.path.endsWith("/"))).toBe(true);
    }
  });

  it("adapts Help Center metadata to the existing M001 shell without fake sections", () => {
    const page = createHelpPageShell({
      locale: "es",
      path: "/recursos/",
      title: "Centro de ayuda | SG Solutions",
      description: "Encuentra respuestas generales, guías y próximos pasos de SG Solutions.",
      heading: "¿Cómo podemos orientarte?",
      summary: "Busca información general y revisada antes de hablar con una persona.",
    });

    expect(page).toMatchObject({
      locale: "es",
      path: "/recursos/",
      kind: "standard",
      publicationState: "published",
      hero: { heading: "¿Cómo podemos orientarte?" },
    });
    expect(page.sections).toEqual([]);
  });

  it("publishes all browse and detail paths to the sitemap but excludes search utilities", () => {
    const paths = getHelpSitemapPaths(HELP_CONTENT, at);

    expect(paths).toHaveLength(186);
    expect(paths).toContain("/recursos/");
    expect(paths).toContain("/en/resources/guides/how-to-prepare-for-an-evaluation/");
    expect(paths).toContain("/recursos/categorias/comprar-casa/");
    expect(paths).not.toContain("/recursos/buscar/");
    expect(paths).not.toContain("/en/resources/search/");
  });
});
