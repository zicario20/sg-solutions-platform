import { expect, test } from "@playwright/test";

const representativePages = [
  { path: "/", name: "home-es" },
  { path: "/en/", name: "home-en" },
  { path: "/servicios/formacion-de-negocios/", name: "business-formation" },
  { path: "/marketplace/", name: "marketplace" },
  { path: "/contacto/", name: "contact" },
];

test("captures representative M001 pages without overflow", async ({ page }, testInfo) => {
  for (const target of representativePages) {
    await page.goto(target.path);
    await page.screenshot({
      path: testInfo.outputPath(`${target.name}-${testInfo.project.name}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
    ).toBe(false);
  }
});

test("meets visible focus, type and touch-target contracts", async ({ page }) => {
  await page.goto("/");
  const primary = page.locator('.hero a[data-action="evaluation"]').first();
  const size = await primary.boundingBox();
  expect(size?.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", "#main-content");
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
    "none",
  );

  expect(
    await page.locator("h1").evaluate((element) => getComputedStyle(element).fontFamily),
  ).toMatch(/Manrope/);
  expect(
    await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily),
  ).toMatch(/Inter/);
});

test("keeps every visible interactive target at least 44 by 44 CSS pixels", async ({ page }) => {
  for (const target of ["/", "/servicios/credito/", "/preguntas-frecuentes/", "/en/"]) {
    const response = await page.goto(target);
    expect(response?.ok(), `${target} must be a real representative page`).toBe(true);
    await page.waitForLoadState("networkidle");
    const controls = await page.locator("a[href], button, summary").evaluateAll((elements) =>
      elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          box.width === 0 ||
          box.height === 0
        ) {
          return [];
        }
        return [
          {
            label: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "",
            width: box.width,
            height: box.height,
          },
        ];
      }),
    );

    for (const control of controls) {
      expect
        .soft(control.width, `${target} target width: ${control.label}`)
        .toBeGreaterThanOrEqual(44);
      expect
        .soft(control.height, `${target} target height: ${control.label}`)
        .toBeGreaterThanOrEqual(44);
    }
  }
});

test("removes nonessential motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const transitionDuration = await page
    .locator('a[data-action="evaluation"]')
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.00001);
});
