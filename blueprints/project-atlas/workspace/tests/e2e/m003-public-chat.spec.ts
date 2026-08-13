import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

type Locale = "es" | "en";
const INITIAL_CSRF = `csrf_${"a".repeat(44)}`;

const projection = (version: number, locale: Locale, status = "ai_active") => ({
  id: "conversation_1",
  version,
  locale,
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
                title: locale === "es" ? "Orientación sobre crédito" : "Credit guidance",
                path:
                  locale === "es"
                    ? "/recursos/categorias/credito/"
                    : "/en/resources/categories/credit/",
              },
            ],
            actions: [
              { key: "help_center", path: locale === "es" ? "/recursos/" : "/en/resources/" },
            ],
          },
        ],
});

async function mockPublicChat(
  page: Page,
  options?: { slowClose?: boolean; slowMessage?: boolean },
): Promise<void> {
  let current = projection(1, "es", "new");
  await page.route("**/api/public/chat/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { "content-type": "application/json" };
    if (path.endsWith("/bootstrap")) {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ ok: true, csrfToken: INITIAL_CSRF, correlationId: "corr_1" }),
      });
      return;
    }
    if (path.endsWith("/resume")) {
      expect(request.method()).toBe("POST");
      expect(request.headers()["x-atlas-chat-csrf"]).toBe(INITIAL_CSRF);
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          data: current,
          csrfToken: "csrf_token_resume",
          correlationId: "corr_1",
        }),
      });
      return;
    }
    if (path.endsWith("/close") && options?.slowClose) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 4_000));
    }
    if (path.endsWith("/messages") && options?.slowMessage) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 600));
    }
    const body = request.postDataJSON() as {
      expectedVersion?: number;
      locale?: Locale;
      text?: string;
    } | null;
    if (path.endsWith("/messages") && body?.text === "blocked-test-message") {
      await route.fulfill({
        status: 422,
        headers,
        body: JSON.stringify({ ok: false, code: "content_rejected", correlationId: "corr_1" }),
      });
      return;
    }
    if (path.endsWith("/language")) {
      current = projection((body?.expectedVersion ?? current.version) + 1, body?.locale ?? "en");
    } else if (path.endsWith("/messages")) {
      current = projection(2, current.locale);
    } else if (path.endsWith("/handoff")) {
      current = projection(
        (body?.expectedVersion ?? current.version) + 1,
        current.locale,
        "waiting_human",
      );
    } else if (path.endsWith("/conversations")) {
      current = projection(1, body?.locale ?? "es", "new");
    } else if (path.endsWith("/close")) {
      current = projection(
        (body?.expectedVersion ?? current.version) + 1,
        current.locale,
        "closed",
      );
    }
    await route.fulfill({
      status: path.endsWith("/conversations") ? 201 : 200,
      headers,
      body: JSON.stringify({
        ok: true,
        data: current,
        correlationId: "corr_1",
        ...(path.endsWith("/handoff") ? { csrfToken: "csrf_token_2" } : {}),
      }),
    });
  });
}

async function startAndSend(page: Page, locale: Locale): Promise<void> {
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: locale === "es" ? "Empezar conversación" : "Start conversation" })
    .click();
  const message = page.getByPlaceholder(
    locale === "es"
      ? "Escribe tu pregunta sin información sensible"
      : "Write your question without sensitive information",
  );
  await message.fill("Necesito orientación sobre crédito");
  await page.getByRole("button", { name: locale === "es" ? "Enviar" : "Send" }).click();
}

test.describe("M003 Public Chat", () => {
  test("offers consent-first Spanish and English orientation with governed citations", async ({
    page,
  }) => {
    await mockPublicChat(page);
    await page.goto("/chat/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Cómo podemos orientarte?");
    await expect(page.getByText(/No envíes números de identificación/)).toBeVisible();
    await startAndSend(page, "es");
    await expect(page.getByRole("log")).toContainText(
      "Consulta esta guía pública para conocer los próximos pasos.",
    );
    await expect(page.getByRole("link", { name: "Orientación sobre crédito" })).toHaveAttribute(
      "href",
      "/recursos/categorias/credito/",
    );

    await page.goto("/en/chat/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await startAndSend(page, "en");
    await expect(page.getByRole("link", { name: "Credit guidance" })).toHaveAttribute(
      "href",
      "/en/resources/categories/credit/",
    );
  });

  test("preserves an active conversation when switching languages", async ({ page }) => {
    await mockPublicChat(page);
    await page.goto("/chat/");
    await startAndSend(page, "es");
    await page
      .getByRole("dialog", { name: "Asistente de SG Solutions" })
      .getByRole("link", { name: "English" })
      .click();
    await expect(page.getByRole("log")).toContainText("Necesito orientación sobre crédito");
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
    await expect(page).toHaveURL(/\/en\/chat\/$/u);
  });

  test("closes immediately during a slow request and reopens as a fresh usable chat", async ({
    page,
  }) => {
    await mockPublicChat(page, { slowClose: true });
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Abrir asistente de SG Solutions" });
    await launcher.click();
    await startAndSend(page, "es");
    await page.getByRole("button", { name: "Cerrar chat" }).click();
    await expect(page.getByRole("dialog", { name: "Asistente de SG Solutions" })).toBeHidden({
      timeout: 500,
    });
    await expect(launcher).toBeFocused();
    await launcher.click();
    await expect(page.getByRole("button", { name: "Empezar conversación" })).toBeDisabled({
      timeout: 3_000,
    });
    await expect(page.getByRole("log")).toContainText("Hola.");
  });

  test("ignores a delayed message response after the visitor closes the chat", async ({ page }) => {
    await mockPublicChat(page, { slowMessage: true });
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Abrir asistente de SG Solutions" });
    await launcher.click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Empezar conversaciÃ³n" }).click();
    await page
      .getByPlaceholder("Escribe tu pregunta sin informaciÃ³n sensible")
      .fill("Mensaje que no debe reaparecer");
    await page.getByRole("button", { name: "Enviar" }).click();
    await page.getByRole("button", { name: "Cerrar chat" }).click();
    await expect(page.getByRole("dialog", { name: "Asistente de SG Solutions" })).toBeHidden();
    await page.waitForTimeout(800);
    await launcher.click();
    await expect(page.getByRole("log")).not.toContainText("Mensaje que no debe reaparecer");
    await expect(page.getByRole("log")).toContainText("Hola.");
  });

  test("announces answers politely, blocking errors assertively, and traps visible focus only", async ({
    page,
  }) => {
    await mockPublicChat(page);
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Abrir asistente de SG Solutions" });
    await launcher.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Asistente de SG Solutions" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("log")).toHaveAttribute("aria-live", "polite");
    await expect(page.getByRole("button", { name: "Cerrar chat" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Empezar conversación" }).click();
    await page
      .getByPlaceholder("Escribe tu pregunta sin información sensible")
      .fill("blocked-test-message");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("alert")).toContainText("No envíes información sensible");
  });

  test("supports 320px, landscape, zoom-like scaling and reduced motion without overflow", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 568 });
    await mockPublicChat(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir asistente de SG Solutions" }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole("dialog")).toHaveCSS("animation-name", "none");
    await page.setViewportSize({ width: 568, height: 320 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeGreaterThanOrEqual(
      1.9,
    );
    await expect(page.getByRole("button", { name: "Cerrar chat" })).toBeVisible();
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
