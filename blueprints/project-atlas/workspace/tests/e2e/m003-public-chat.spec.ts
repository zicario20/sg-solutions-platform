import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const projection = (version: number, status = "active") => ({
  id: "conversation_1",
  version,
  locale: "es",
  status,
  expiresAt: "2026-08-13T01:00:00.000Z",
  messages:
    version < 2
      ? []
      : [
          {
            id: "message_visitor_1",
            actor: "visitor",
            body: "Necesito orientación sobre crédito",
            citations: [],
            actions: [],
          },
          {
            id: "message_assistant_1",
            actor: "assistant",
            body: "Consulta esta guía pública para conocer los próximos pasos.",
            citations: [
              {
                sourceId: "help_credit_1",
                title: "Orientación sobre crédito",
                path: "/recursos/categorias/credito/",
              },
            ],
            actions: [{ key: "help_center", path: "/recursos/" }],
          },
        ],
});

async function mockPublicChat(page: Page): Promise<void> {
  await page.route("**/api/public/chat/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { "content-type": "application/json" };
    if (path.endsWith("/bootstrap")) {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ ok: true, csrfToken: "csrf_token_1", correlationId: "corr_1" }),
      });
      return;
    }
    const body = request.postDataJSON() as { expectedVersion?: number } | null;
    const version = path.endsWith("/messages") ? 2 : (body?.expectedVersion ?? 0) + 1;
    await route.fulfill({
      status: path.endsWith("/conversations") ? 201 : 200,
      headers,
      body: JSON.stringify({
        ok: true,
        data: projection(version, path.endsWith("/handoff") ? "waiting_human" : "active"),
        correlationId: "corr_1",
        ...(path.endsWith("/handoff") ? { csrfToken: "csrf_token_2" } : {}),
      }),
    });
  });
}

test.describe("M003 Public Chat", () => {
  test("offers a bilingual, consent-first orientation journey with governed citations", async ({
    page,
  }) => {
    await mockPublicChat(page);
    await page.goto("/chat/");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Cómo podemos orientarte?");
    await expect(page.getByText(/No envíes números de identificación/)).toBeVisible();
    const start = page.getByRole("button", { name: "Empezar conversación" });
    await expect(start).toBeDisabled();
    await page.getByRole("checkbox").check();
    await start.click();

    const message = page.getByPlaceholder("Escribe tu pregunta sin información sensible");
    await message.fill("Necesito orientación sobre crédito");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(
      page.getByText("Consulta esta guía pública para conocer los próximos pasos."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Orientación sobre crédito" })).toHaveAttribute(
      "href",
      "/recursos/categorias/credito/",
    );
    await expect(
      page
        .getByRole("dialog", { name: "Asistente de SG Solutions" })
        .getByRole("link", { name: "English" }),
    ).toHaveAttribute("href", "/en/chat/");
  });

  test("keeps the floating experience focused, keyboard reachable, and responsive", async ({
    page,
  }) => {
    await mockPublicChat(page);
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Abrir asistente de SG Solutions" });
    await expect(launcher).toBeVisible();
    await launcher.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Asistente de SG Solutions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar chat" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Asistente de SG Solutions" })).toBeHidden();
    await expect(launcher).toBeFocused();
  });

  test("has no automatically detectable WCAG A/AA violations", async ({ page }) => {
    await mockPublicChat(page);
    await page.goto("/chat/");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
});
