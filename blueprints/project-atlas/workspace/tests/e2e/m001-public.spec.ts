import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const deploymentConfig = JSON.parse(readFileSync("apps/www/vercel.json", "utf8")) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const productionCsp = deploymentConfig.headers
  .find((entry) => entry.source === "/(.*)")
  ?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

test.describe("M001 public website", () => {
  const deepRoutes = [
    "/servicios/",
    "/servicios/credito/",
    "/servicios/taxes/",
    "/servicios/formacion-de-negocios/",
    "/servicios/credito-empresarial/",
    "/servicios/financiamiento-empresarial/",
    "/servicios/preparacion-para-financiamiento/",
    "/servicios/comprar-casa/",
    "/preguntas-frecuentes/",
  ];

  for (const route of deepRoutes) {
    test(`${route} renders substantive public content`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.locator("main section").count()).toBeGreaterThanOrEqual(4);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }

  test("service navigation remains keyboard accessible at mobile size and 200 percent zoom", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/servicios/credito/");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "En esta página" })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("reduced motion keeps deep service content available", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/servicios/comprar-casa/");
    await expect(page.getByRole("heading", { name: "Qué no hace SG Solutions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preguntas frecuentes" })).toBeVisible();
  });
  test("Spanish home communicates the offer and safe next action", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Orientación financiera y empresarial",
    );
    await expect(page.locator('img[alt="SG Solutions LLC"]').first()).toBeVisible();
    await expect(page.locator('a[data-action="evaluation"]').first()).toHaveAttribute(
      "data-action-available",
      "false",
    );
    await expect(page.locator('a[data-action="evaluation"]').first()).toHaveAttribute(
      "href",
      "/contacto/?intent=evaluacion",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://www.sgsllc.com/",
    );
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
      "href",
      "https://www.sgsllc.com/en/",
    );
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      "/brand/sg-solutions-logo.jpg",
    );
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("English home keeps all visual badges in English", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Clear plan", { exact: true })).toBeVisible();
    await expect(page.getByText("Next step", { exact: true })).toBeVisible();
    await expect(page.getByText("Próximo paso", { exact: true })).toHaveCount(0);
  });

  test("approved brand fonts are self-hosted and loaded", async ({ page }) => {
    await page.goto("/");
    const fontState = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        body: getComputedStyle(document.body).fontFamily,
        heading: getComputedStyle(document.querySelector("h1") as HTMLElement).fontFamily,
        loadedFamilies: [...document.fonts]
          .filter((font) => font.status === "loaded")
          .map((font) => font.family.replaceAll('"', "")),
      };
    });
    expect(fontState.body).toContain("Inter Variable");
    expect(fontState.heading).toContain("Manrope Variable");
    expect(fontState.loadedFamilies).toContain("Manrope Variable");
    expect(fontState.loadedFamilies).toContain("Inter Variable");
  });

  test("language switch opens the equivalent English service page", async ({ page }) => {
    await page.goto("/servicios/credito/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Crédito y asistencia de reparación de crédito",
    );
    const switcher = page.locator(".language-switcher").first();
    await expect(switcher).toHaveAttribute("href", "/en/services/credit/");
    await switcher.click();
    await expect(page).toHaveURL(/\/en\/services\/credit\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Credit guidance and credit repair assistance",
    );
  });

  test("an unconfigured client portal leads to an honest localized fallback", async ({ page }) => {
    await page.goto("/en/");
    if (await page.locator(".mobile-nav").isVisible()) {
      await page.locator(".mobile-nav summary").click();
    }
    const portal = page.locator('a[data-action="clientPortal"]:visible').first();
    await expect(portal).toHaveAttribute("data-action-available", "false");
    await expect(portal).toHaveAttribute("href", "/en/contact/?intent=portal");
    await portal.click();
    await expect(page).toHaveURL(/\/en\/contact\/\?intent=portal$/);
    await expect(
      page.getByRole("heading", { name: "This channel is not active yet" }),
    ).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator("form")).toHaveCount(0);
  });

  test("mobile navigation is usable without hiding core content", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const menu = page.locator(".mobile-nav");
    await expect(menu).toBeVisible();
    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await expect(menu.getByRole("link", { name: "Servicios" })).toBeVisible();
    await menu.getByRole("link", { name: "Servicios" }).click();
    await expect(page).toHaveURL(/\/servicios\/$/);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("mobile navigation enhancement works under the production CSP", async ({ page }) => {
    expect(productionCsp).toBeTruthy();
    // Vite injects development styles inline. The deployment contract separately
    // asserts the stricter production style policy; this browser case keeps the
    // production script policy while allowing the local harness to render.
    const browserHarnessCsp = productionCsp?.replace(
      "style-src 'self'",
      "style-src 'self' 'unsafe-inline'",
    );
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": browserHarnessCsp ?? "" },
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menu = page.locator("[data-mobile-navigation]");
    const trigger = menu.locator("summary");
    await expect(trigger).toHaveAttribute("aria-controls", "mobile-navigation-panel");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(menu).toHaveAttribute("open", "");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("policy drafts are transparent and excluded from indexing", async ({ page }) => {
    await page.goto("/privacidad/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
    await expect(page.getByRole("status")).toContainText("Revisión requerida");
    await expect(page.getByText("Contenido pendiente de revisión calificada")).toBeVisible();
  });

  test("health, sitemap, robots and unknown routes behave honestly", async ({ request, page }) => {
    const health = await request.get("/health/");
    expect(health.ok()).toBe(true);
    expect(await health.json()).toEqual({ status: "ok", surface: "public" });

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).not.toContain("https://www.sgsllc.com/en/services/credit/");
    expect(sitemapBody).not.toContain("https://www.sgsllc.com/privacidad/");

    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Sitemap: https://www.sgsllc.com/sitemap.xml");

    const response = await page.goto("/not-a-real-page/");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("No encontramos");

    const missingEnglish = await page.goto("/en/not-a-real-page/");
    expect(missingEnglish?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We could not find that page");

    const english404 = await page.goto("/en/404/");
    expect(english404?.ok()).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We could not find that page");
    await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/en/");
    await expect(page.getByRole("link", { name: "Explore services" })).toHaveAttribute(
      "href",
      "/en/services/",
    );
  });
});

async function hasHorizontalOverflow(page: import("@playwright/test").Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}
