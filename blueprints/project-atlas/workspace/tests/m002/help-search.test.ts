import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import {
  buildSearchIndex,
  normalizeSearchText,
  searchHelp,
} from "../../apps/www/src/lib/help-search";

const at = new Date("2026-08-08T12:00:00.000Z");

describe("M002 public search", () => {
  it("normalizes case, punctuation and Spanish diacritics", () => {
    expect(normalizeSearchText("  ¿CRÉDITO, utilización?  ")).toBe("credito utilizacion");
  });

  it("finds the same credit answer with and without accents", () => {
    const index = buildSearchIndex(HELP_CONTENT, "es", at);
    const withAccent = searchHelp(index, "utilización", {});
    const withoutAccent = searchHelp(index, "utilizacion", {});

    expect(withAccent[0]?.id).toBe("faq-what-is-utilization-es");
    expect(withoutAccent[0]?.id).toBe("faq-what-is-utilization-es");
  });

  it("routes a rural zero-down query to safe guidance while gated program copy stays private", () => {
    const index = buildSearchIndex(HELP_CONTENT, "es", at);
    const results = searchHelp(index, "préstamo rural cero inicial", {});

    expect(results.slice(0, 3).map((result) => result.category)).toContain("home-buying");
    expect(results.some((result) => result.title.includes("USDA"))).toBe(false);
  });

  it("uses deterministic title-first ranking and filters", () => {
    const index = buildSearchIndex(HELP_CONTENT, "en", at);
    const exact = searchHelp(index, "What is DTI?", {});
    const filtered = searchHelp(index, "documents", { type: "checklist", category: "documents" });

    expect(exact[0]?.id).toBe("faq-what-is-dti-en");
    expect(filtered.map((result) => result.id)).toEqual(["resource-secure-documents-checklist-en"]);
  });

  it("returns no results for an empty or unrelated query", () => {
    const index = buildSearchIndex(HELP_CONTENT, "en", at);
    expect(searchHelp(index, "", {})).toEqual([]);
    expect(searchHelp(index, "quantum banana telescope", {})).toEqual([]);
  });

  it("marks only external-provider records in the minimized public index", () => {
    const index = buildSearchIndex(HELP_CONTENT, "en", at);

    expect(index.find((document) => document.id === "faq-what-is-tradeline-en")).toMatchObject({
      sourceKind: "provider",
    });
    expect(index.find((document) => document.id === "faq-what-is-dti-en")).toMatchObject({
      sourceKind: null,
    });
  });
});
