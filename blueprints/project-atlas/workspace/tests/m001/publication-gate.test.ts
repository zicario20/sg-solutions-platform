import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES } from "../../apps/www/src/content/site-content";

const remediatedGeneralRoutes = new Set([
  "home",
  "services",
  "about",
  "pricing",
  "faq",
  "help-center",
  "academy",
  "contact",
]);

describe("M001 Product Owner publication gate", () => {
  it("keeps remediated public content in review until Product Owner acceptance", () => {
    const remediatedPages = PUBLIC_PAGES.filter(
      (page) => page.serviceContent || remediatedGeneralRoutes.has(page.routeKey),
    );

    expect(remediatedPages.length).toBeGreaterThan(0);
    expect(remediatedPages.every((page) => page.publicationState === "review-required")).toBe(true);
  });
});
