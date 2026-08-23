import { describe, expect, it } from "vitest";
import {
  SERVICE_PAGE_CONTENT,
  SERVICE_ROUTE_KEYS,
} from "../../apps/www/src/content/service-content";
import { PUBLIC_PAGES } from "../../apps/www/src/content/site-content";

const majorServices = new Set([
  "service-credit",
  "service-taxes",
  "service-business-formation",
  "service-business-funding",
  "service-home-buying",
]);

describe("M001 content depth remediation", () => {
  it("publishes every approved service with equivalent typed content", () => {
    expect(SERVICE_ROUTE_KEYS).toHaveLength(11);
    for (const serviceId of SERVICE_ROUTE_KEYS) {
      const pair = SERVICE_PAGE_CONTENT[serviceId];
      for (const locale of ["es", "en"] as const) {
        const content = pair[locale];
        expect(content.serviceId).toBe(serviceId);
        expect(content.locale).toBe(locale);
        expect(content.audience.length).toBeGreaterThanOrEqual(3);
        expect(content.problems.length).toBeGreaterThanOrEqual(3);
        expect(content.overview.length).toBeGreaterThan(0);
        expect(content.whatWeDo.length).toBeGreaterThanOrEqual(4);
        expect(content.process.length).toBeGreaterThanOrEqual(4);
        expect(content.preparation.length).toBeGreaterThanOrEqual(3);
        expect(content.expectations.length).toBeGreaterThanOrEqual(3);
        expect(content.limitations.length).toBeGreaterThanOrEqual(3);
        expect(content.faq.length).toBeGreaterThanOrEqual(majorServices.has(serviceId) ? 8 : 5);
        expect(content.hero.primaryCta).toBeTruthy();
        expect(content.hero.secondaryCta).toBeTruthy();
        expect(content.seo.title).toBeTruthy();
        expect(content.seo.description.length).toBeGreaterThan(50);
      }
    }
  });

  it("prevents service pages from regressing to shells", () => {
    const servicePages = PUBLIC_PAGES.filter((page) => page.kind === "service");
    expect(servicePages).toHaveLength(22);
    for (const page of servicePages) {
      expect(page.sections.length).toBeGreaterThanOrEqual(10);
      const ids = new Set(page.sections.map((section) => section.id));
      for (const required of [
        "audience",
        "overview",
        "what-we-do",
        "process",
        "preparation",
        "expectations",
        "limitations",
        "faq",
      ]) {
        expect(ids.has(required)).toBe(true);
      }
      expect(
        page.sections.find((section) => section.id === "process")?.items.length,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("uses a service-specific process instead of one generic sequence", () => {
    for (const locale of ["es", "en"] as const) {
      const processes = SERVICE_ROUTE_KEYS.map((key) =>
        SERVICE_PAGE_CONTENT[key][locale].process.map((step) => step.body).join("|"),
      );
      expect(new Set(processes).size).toBe(processes.length);
    }
  });

  it("keeps substantive copy unique except approved shared resources", () => {
    for (const locale of ["es", "en"] as const) {
      const bodies = SERVICE_ROUTE_KEYS.flatMap((key) => {
        const content = SERVICE_PAGE_CONTENT[key][locale];
        return [
          ...content.audience,
          ...content.problems,
          ...content.overview,
          ...content.whatWeDo,
          ...content.process,
          ...content.preparation,
          ...content.expectations,
          ...content.limitations,
        ].map((item) => item.body.trim().toLowerCase());
      });
      const duplicates = bodies.filter(
        (body, index) => body.length > 35 && bodies.indexOf(body) !== index,
      );
      expect(duplicates).toEqual([]);
    }
  });

  it("contains no visible placeholders, fabricated activation, or prohibited promises", () => {
    const text = JSON.stringify(SERVICE_PAGE_CONTENT);
    expect(text).not.toMatch(/\bTODO\b|\bTBD\b/);
    expect(text).not.toMatch(/lorem ipsum|coming soon/i);
    expect(text).not.toMatch(
      /guaranteed approval|aprobación garantizada|guaranteed score|score garantizado/i,
    );
    expect(text).not.toMatch(/\$\s*\d+/);
    expect(SERVICE_PAGE_CONTENT.marketplace.es.overview[0]?.body).toContain("no hay ofertas");
    expect(SERVICE_PAGE_CONTENT.marketplace.en.overview[0]?.body).toContain("no active offers");
  });

  it("keeps titles and metadata unique within each locale", () => {
    for (const locale of ["es", "en"] as const) {
      const pages = PUBLIC_PAGES.filter(
        (page) => page.surface === "public" && page.locale === locale,
      );
      expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
      expect(new Set(pages.map((page) => page.description)).size).toBe(pages.length);
    }
  });
});
