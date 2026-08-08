import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SITE_CHROME } from "../../apps/www/src/content/site-chrome";
import { PUBLIC_PAGES, PUBLIC_SERVICES } from "../../apps/www/src/content/site-content";

describe("M001 bilingual content contract", () => {
  it("publishes every approved page in both languages", () => {
    expect(PUBLIC_PAGES.filter((page) => page.locale === "es")).toHaveLength(18);
    expect(PUBLIC_PAGES.filter((page) => page.locale === "en")).toHaveLength(18);
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
      expect(page.hero.heading).not.toContain("|");
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

  it("keeps all shared visual and recovery copy localized in the typed chrome layer", () => {
    expect(SITE_CHROME.es).toMatchObject({
      growthPlan: "Plan claro",
      growthNextStep: "Próximo paso",
      notFoundHeading: "No encontramos esa página",
      notFoundHome: "Volver al inicio",
      notFoundServices: "Explorar servicios",
    });
    expect(SITE_CHROME.en).toMatchObject({
      growthPlan: "Clear plan",
      growthNextStep: "Next step",
      notFoundHeading: "We could not find that page",
      notFoundHome: "Return home",
      notFoundServices: "Explore services",
    });
    for (const locale of ["es", "en"] as const) {
      const copy = SITE_CHROME[locale];
      expect(copy.trustItems).toHaveLength(4);
      expect(copy.footerLinks.services.length).toBeGreaterThanOrEqual(5);
      expect(copy.footerLinks.company.length).toBeGreaterThanOrEqual(4);
      expect(copy.footerLinks.policies.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("does not embed shared client-facing copy in presentation components", () => {
    const source = [
      "SiteHeader.astro",
      "GrowthPathVisual.astro",
      "Breadcrumbs.astro",
      "Hero.astro",
      "ContentSection.astro",
      "PageRenderer.astro",
      "TrustRail.astro",
      "SiteFooter.astro",
    ]
      .map((file) => readFileSync(`apps/www/src/components/${file}`, "utf8"))
      .concat(readFileSync("apps/www/src/layouts/BaseLayout.astro", "utf8"))
      .join("\n");

    for (const literal of [
      "Navegación principal",
      "Primary navigation",
      "Plan Claro",
      "Próximo paso",
      "Explore services",
      "Designed to move forward",
      "Review required",
      "The next step",
      "Privacy first",
    ]) {
      expect(source).not.toContain(literal);
    }
  });

  it("sources the skip-link copy from the typed chrome registry", () => {
    const layout = readFileSync("apps/www/src/layouts/BaseLayout.astro", "utf8");
    expect(layout).toContain("SITE_CHROME[page.locale]");
    expect(layout).toContain("{copy.skip}");
  });
});
