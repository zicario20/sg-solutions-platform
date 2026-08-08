import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES, PUBLIC_SERVICES } from "../../apps/www/src/content/site-content";

describe("M001 bilingual content contract", () => {
  it("publishes every approved page in both languages", () => {
    expect(PUBLIC_PAGES.filter((page) => page.locale === "es")).toHaveLength(19);
    expect(PUBLIC_PAGES.filter((page) => page.locale === "en")).toHaveLength(19);
  });

  it("keeps paths and localized route identities unique", () => {
    expect(new Set(PUBLIC_PAGES.map((page) => page.path)).size).toBe(PUBLIC_PAGES.length);

    for (const routeKey of new Set(PUBLIC_PAGES.map((page) => page.routeKey))) {
      expect(PUBLIC_PAGES.filter((page) => page.routeKey === routeKey)).toHaveLength(2);
    }
  });

  it("describes every service in both languages without numeric prices", () => {
    expect(PUBLIC_SERVICES.filter((service) => service.locale === "es")).toHaveLength(9);
    expect(PUBLIC_SERVICES.filter((service) => service.locale === "en")).toHaveLength(9);

    for (const service of PUBLIC_SERVICES) {
      expect(service.title.trim().length).toBeGreaterThan(2);
      expect(service.summary.trim().length).toBeGreaterThan(40);
      expect(service.priceMode).toMatch(/^(consultation|quote)$/);
      expect(`${service.title} ${service.summary}`).not.toMatch(/\$\s*\d|guarantee|garantiz/i);
    }
  });

  it("gives every page a complete hero and structured sections", () => {
    for (const page of PUBLIC_PAGES) {
      expect(page.hero.eyebrow.trim().length).toBeGreaterThan(2);
      expect(page.hero.heading.trim().length).toBeGreaterThan(12);
      expect(page.hero.summary.trim().length).toBeGreaterThan(60);
      expect(page.sections.length).toBeGreaterThanOrEqual(page.kind === "service" ? 4 : 2);
      expect(page.sections.every((section) => section.title.trim().length > 4)).toBe(true);
    }
  });

  it("marks policy pages as pending qualified review instead of approved legal advice", () => {
    const policyPages = PUBLIC_PAGES.filter((page) => page.kind === "policy");
    expect(policyPages).toHaveLength(8);
    expect(policyPages.every((page) => page.publicationState === "review-required")).toBe(true);
  });
});
