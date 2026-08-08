import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const deploymentConfig = JSON.parse(readFileSync("apps/www/vercel.json", "utf8")) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const productionCsp = deploymentConfig.headers
  .find((entry) => entry.source === "/(.*)")
  ?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

test.describe("M002 Help Center", () => {
  test("Spanish hub provides organized discovery and a safe next action", async ({ page }) => {
    const response = await page.goto("/recursos/");
    expect(response?.ok()).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Respuestas claras para avanzar",
    );
    await expect(page.getByRole("link", { name: /Pagos y facturación/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Preguntas frecuentes/ }).first()).toHaveAttribute(
      "href",
      "/recursos/preguntas-frecuentes/",
    );
    await expect(page.locator('a[data-action="evaluation"]').last()).toHaveAttribute(
      "data-action-available",
      "false",
    );
  });

  test("FAQ collection renders all approved answers in accessible native accordions", async ({
    page,
  }) => {
    await page.goto("/recursos/preguntas-frecuentes/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Preguntas frecuentes");
    await expect(page.locator("details[data-help-faq]")).toHaveCount(57);
    const firstQuestion = page.getByText("¿Qué es SG Solutions?", { exact: true });
    await firstQuestion.click();
    await expect(page.getByText(/ofrece orientación y servicios/)).toBeVisible();
    expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain(
      "FAQPage",
    );
  });

  test("English detail exposes reviewed metadata, disclosure, related content and exact language pair", async ({
    page,
  }) => {
    await page.goto("/en/resources/guides/prepare-evaluation/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "How to prepare for an evaluation",
    );
    await expect(page.getByText("Reviewed August 8, 2026")).toBeVisible();
    await expect(page.getByText(/General information; confirm the applicable scope/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Español" }).first()).toHaveAttribute(
      "href",
      "/recursos/guias/prepare-evaluation/",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://www.sgsllc.com/en/resources/guides/prepare-evaluation/",
    );
  });

  test("core Help Center reading remains available without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en/resources/articles/how-sg-works/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("How SG Solutions works");
    await expect(page.getByText("Evaluation", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Guides" })).toBeVisible();
    await context.close();
  });

  test("search stays client-side and announces ranked results", async ({ page }) => {
    const observedRequests: string[] = [];
    page.on("request", (request) => observedRequests.push(request.url()));
    await page.goto("/recursos/buscar/");
    await page.getByLabel("Buscar en el centro de ayuda").fill("utilización de crédito");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByRole("status")).toContainText(/resultado/);
    await expect(page.getByRole("link", { name: "¿Qué es utilización?" }).first()).toBeVisible();
    expect(observedRequests.some((url) => /utilizaci|credito/i.test(url))).toBe(false);
  });

  test("no-results and feedback states remain honest", async ({ page }) => {
    await page.goto("/en/resources/search/");
    await page.getByLabel("Search the Help Center").fill("quantum banana telescope");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("No matching answers were found.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Help Center" })).toBeVisible();

    await page.goto("/en/resources/guides/prepare-evaluation/");
    await page.getByRole("button", { name: "Yes" }).click();
    await expect(page.getByRole("status")).toContainText("was not transmitted");
  });

  test("search and feedback enhancements operate under the production CSP", async ({ page }) => {
    expect(productionCsp).toBeTruthy();
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": productionCsp ?? "" },
      });
    });
    await page.goto("/en/resources/search/");
    await page.getByLabel("Search the Help Center").fill("DTI");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("link", { name: "What is DTI?" }).first()).toBeVisible();
  });

  test("legacy aliases, sitemap and public index preserve their boundaries", async ({
    page,
    request,
  }) => {
    await page.goto("/preguntas-frecuentes/");
    await expect(page).toHaveURL(/\/recursos\/preguntas-frecuentes\/$/);

    const sitemap = await request.get("/sitemap.xml");
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("https://www.sgsllc.com/recursos/guias/prepare-evaluation/");
    expect(sitemapBody).toContain("https://www.sgsllc.com/en/resources/faq/");
    expect(sitemapBody).not.toContain("https://www.sgsllc.com/recursos/buscar/");

    const indexResponse = await request.get("/en/resources/search-index.json");
    const index = (await indexResponse.json()) as Array<Record<string, unknown>>;
    expect(index).toHaveLength(73);
    expect(Object.keys(index[0] ?? {}).sort()).toEqual([
      "category",
      "id",
      "keywords",
      "locale",
      "path",
      "reviewedAt",
      "summary",
      "title",
      "type",
    ]);
  });

  test("key Help Center surfaces pass automated WCAG 2.2 AA checks", async ({ page }) => {
    for (const route of [
      "/recursos/",
      "/recursos/preguntas-frecuentes/",
      "/en/resources/guides/prepare-evaluation/",
      "/en/resources/search/",
    ]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, `${route}: ${JSON.stringify(results.violations)}`).toEqual([]);
    }
  });

  test("the experience remains usable at 320 CSS pixels and reduced motion", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/recursos/");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
    ).toBe(false);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const target = page.getByRole("link", { name: /Preguntas frecuentes/ }).first();
    const box = await target.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("responsive reflow holds across approved widths and a 200 percent zoom equivalent", async ({
    page,
  }) => {
    for (const width of [375, 640, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/en/resources/search/");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
        `horizontal overflow at ${width}px${width === 640 ? " (1280px at 200% zoom equivalent)" : ""}`,
      ).toBe(false);
    }
  });
});

test.afterEach(async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
