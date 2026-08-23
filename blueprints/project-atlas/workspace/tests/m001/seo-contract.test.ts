import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES } from "../../apps/www/src/content/site-content";
import {
  createSeoProjection,
  createStructuredData,
  serializeStructuredData,
} from "../../apps/www/src/lib/seo";

const origin = "https://www.sgsllc.com";

function requirePage(routeKey: string, locale?: "es" | "en") {
  const page = PUBLIC_PAGES.find(
    (candidate) => candidate.routeKey === routeKey && (!locale || candidate.locale === locale),
  );
  if (!page) throw new Error(`Missing test page ${routeKey}/${locale ?? "any"}`);
  return page;
}

describe("M001 SEO projection", () => {
  it("projects canonical and equivalent alternate URLs", () => {
    const page = requirePage("service-credit", "en");
    expect(createSeoProjection(page, origin)).toMatchObject({
      canonical: "https://www.sgsllc.com/en/services/credit/",
      alternate: "https://www.sgsllc.com/servicios/credito/",
      alternateLocale: "es",
      locale: "en",
    });
  });

  it("strips query and fragment data from the configured origin", () => {
    const page = requirePage("home");
    expect(
      createSeoProjection(page, "https://www.sgsllc.com/?campaign=private#hero").canonical,
    ).toBe("https://www.sgsllc.com/");
  });

  it("never emits fabricated ratings or offers", () => {
    const page = requirePage("service-business-funding", "es");
    const json = JSON.stringify(createStructuredData(page, origin));
    expect(json).toContain('"@type":"Service"');
    expect(json).not.toMatch(/AggregateRating|Review|Offer|price/);
    expect(json).not.toMatch(/areaServed|serviceArea|availableAtOrFrom/);
  });

  it("emits service breadcrumbs and only visible FAQ structured data", () => {
    const page = requirePage("service-credit", "es");
    const json = JSON.stringify(createStructuredData(page, origin));
    expect(json).toContain('"@type":"BreadcrumbList"');
    expect(json).toContain('"@type":"FAQPage"');
    for (const faq of page.serviceContent?.faq ?? []) {
      expect(json).toContain(JSON.stringify(faq.question).slice(1, -1));
    }
  });

  it("emits FAQPage only from visible categorized FAQ content", () => {
    const page = requirePage("faq", "en");
    const data = createStructuredData(page, origin) as { mainEntity?: unknown[] };
    expect(data.mainEntity).toHaveLength(29);
  });

  it("escapes script-breaking characters in structured data", () => {
    const serialized = serializeStructuredData({
      value: "</script><script>alert('unsafe')</script>\u2028\u2029",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("\u2028");
    expect(serialized).not.toContain("\u2029");
    expect(serialized).toContain("\\u003c/script>");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });
});
