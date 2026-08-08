import { describe, expect, it } from "vitest";
import {
  HELP_CATEGORIES,
  HELP_COLLECTIONS,
  HELP_CONTENT,
} from "../../apps/www/src/content/help-center";

const requiredFaqCounts = {
  "getting-started": 7,
  payments: 6,
  documents: 5,
  credit: 7,
  taxes: 6,
  "business-formation": 7,
  "business-funding": 6,
  "home-buying": 8,
  marketplace: 5,
} as const;

describe("M002 bilingual launch inventory", () => {
  it("publishes the complete 57-question FAQ inventory in each locale", () => {
    for (const locale of ["es", "en"] as const) {
      const faqs = HELP_CONTENT.filter((item) => item.locale === locale && item.type === "faq");
      expect(faqs).toHaveLength(57);
      for (const [category, count] of Object.entries(requiredFaqCounts)) {
        expect(faqs.filter((item) => item.category === category)).toHaveLength(count);
      }
    }
  });

  it("pairs every launch record with exactly one natural-language translation", () => {
    const groups = Map.groupBy(HELP_CONTENT, (item) => item.translationGroupId);
    expect(groups.size).toBeGreaterThanOrEqual(73);

    for (const records of groups.values()) {
      expect(records).toHaveLength(2);
      expect(records.map((item) => item.locale).sort()).toEqual(["en", "es"]);
      expect(new Set(records.map((item) => item.type)).size).toBe(1);
      expect(new Set(records.map((item) => item.category)).size).toBe(1);
    }
  });

  it("covers every approved public category and content type in both languages", () => {
    expect(HELP_CATEGORIES).toHaveLength(16);
    expect(HELP_COLLECTIONS).toHaveLength(6);

    for (const locale of ["es", "en"] as const) {
      expect(HELP_CATEGORIES.every((category) => category[locale].title.length > 2)).toBe(true);
      expect(HELP_COLLECTIONS.every((collection) => collection[locale].title.length > 2)).toBe(
        true,
      );
      for (const type of ["article", "guide", "checklist", "glossary", "program"] as const) {
        expect(HELP_CONTENT.some((item) => item.locale === locale && item.type === type)).toBe(
          true,
        );
      }
    }
  });

  it("keeps content identifiers, localized slugs and relationships valid", () => {
    expect(new Set(HELP_CONTENT.map((item) => item.id)).size).toBe(HELP_CONTENT.length);
    expect(
      new Set(HELP_CONTENT.map((item) => `${item.locale}:${item.type}:${item.slug}`)).size,
    ).toBe(HELP_CONTENT.length);

    const ids = new Set(HELP_CONTENT.map((item) => item.id));
    for (const item of HELP_CONTENT) {
      expect(item.title.trim().length).toBeGreaterThan(2);
      expect(item.summary.trim().length).toBeGreaterThan(35);
      expect(item.blocks.length).toBeGreaterThan(0);
      expect(item.keywords.length).toBeGreaterThanOrEqual(2);
      expect(item.disclosure.trim().length).toBeGreaterThan(25);
      expect(item.seoTitle).toMatch(/SG Solutions$/);
      expect(item.seoDescription.length).toBeGreaterThanOrEqual(50);
      expect(item.relatedIds.every((id) => ids.has(id))).toBe(true);
    }
  });

  it("requires authoritative metadata for medium and high risk records", () => {
    for (const item of HELP_CONTENT.filter((record) => record.riskLevel !== "low")) {
      expect(item.jurisdiction).toBeTruthy();
      expect(item.nextReviewAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.sources?.length).toBeGreaterThan(0);
      expect(item.sources?.every((source) => source.url.startsWith("https://"))).toBe(true);
    }
  });

  it("does not publish unresolved policy, prices, guarantees or contact facts", () => {
    const text = HELP_CONTENT.map((item) =>
      [
        item.title,
        item.summary,
        item.disclosure,
        ...item.blocks.map((block) => JSON.stringify(block)),
      ].join(" "),
    ).join(" ");

    expect(text).not.toMatch(/\$\s*\d/);
    expect(text).not.toMatch(/garantizamos|we guarantee|siempre aprobad|always approved/i);
    expect(text).not.toMatch(/\b\d{3}[-.) ]\d{3}[-. ]\d{4}\b/);
    expect(text).not.toMatch(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  });
});
