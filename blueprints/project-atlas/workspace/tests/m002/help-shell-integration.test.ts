import { describe, expect, it } from "vitest";
import { SITE_CHROME } from "../../apps/www/src/content/site-chrome";
import { PUBLIC_PAGES } from "../../apps/www/src/content/site-content";
import { createSeoProjection } from "../../apps/www/src/lib/seo";

describe("M002 integration with the M001 shell", () => {
  it("makes the Help Center the only canonical FAQ content source", () => {
    expect(PUBLIC_PAGES.some((page) => page.routeKey === "faq")).toBe(false);
    expect(PUBLIC_PAGES.filter((page) => page.locale === "es")).toHaveLength(18);
    expect(PUBLIC_PAGES.filter((page) => page.locale === "en")).toHaveLength(18);
  });

  it("points global resource navigation to the localized Help Center hub", () => {
    expect(SITE_CHROME.es.nav.find((item) => item.label === "Recursos")?.href).toBe("/recursos/");
    expect(SITE_CHROME.en.nav.find((item) => item.label === "Resources")?.href).toBe(
      "/en/resources/",
    );
    expect(SITE_CHROME.es.footerLinks.company.find((item) => item.label === "FAQ")?.href).toBe(
      "/recursos/preguntas-frecuentes/",
    );
    expect(SITE_CHROME.en.footerLinks.company.find((item) => item.label === "FAQ")?.href).toBe(
      "/en/resources/faq/",
    );
  });

  it("allows an exact alternate path without changing existing M001 route lookup", () => {
    const page = PUBLIC_PAGES.find(
      (candidate) => candidate.routeKey === "about" && candidate.locale === "es",
    );
    if (!page) throw new Error("Missing about fixture");

    expect(
      createSeoProjection(page, "https://www.sgsllc.com", "/en/resources/articles/example/")
        .alternate,
    ).toBe("https://www.sgsllc.com/en/resources/articles/example/");
    expect(createSeoProjection(page, "https://www.sgsllc.com").alternate).toBe(
      "https://www.sgsllc.com/en/about/",
    );
  });

  it("configures permanent build-time redirects for the two legacy FAQ URLs", async () => {
    const { PUBLIC_REDIRECTS } = await import("../../apps/www/public-redirects.mjs");
    expect(PUBLIC_REDIRECTS).toEqual({
      "/preguntas-frecuentes": "/recursos/preguntas-frecuentes/",
      "/en/faq": "/en/resources/faq/",
    });
  });
});
