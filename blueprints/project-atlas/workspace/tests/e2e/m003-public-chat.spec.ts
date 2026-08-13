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
  options?: {
    slowClose?: boolean;
    slowMessage?: boolean;
    loseFirstStartResponse?: boolean;
    loseFirstMessageResponse?: boolean;
    messageInProgressOnce?: boolean;
    loseFirstHandoffResponse?: boolean;
    loseFirstLocaleResponse?: boolean;
  },
): Promise<{
  startKeys: string[];
  startLocales: Locale[];
  messageKeys: string[];
  handoffKeys: string[];
  localeKeys: string[];
  closeKeys: string[];
  closeVersions: number[];
}> {
  let current = projection(1, "es", "new");
  const startKeys: string[] = [];
  const startLocales: Locale[] = [];
  const messageKeys: string[] = [];
  const handoffKeys: string[] = [];
  const localeKeys: string[] = [];
  const closeKeys: string[] = [];
  const closeVersions: number[] = [];
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
    const body = request.postDataJSON() as {
      expectedVersion?: number;
      locale?: Locale;
      text?: string;
      idempotencyKey?: string;
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
      localeKeys.push(body?.idempotencyKey ?? "");
      const duplicate = localeKeys.slice(0, -1).includes(body?.idempotencyKey ?? "");
      if (!duplicate) {
        current = {
          ...projection((body?.expectedVersion ?? current.version) + 1, body?.locale ?? "en"),
          messages: projection(
            (body?.expectedVersion ?? current.version) + 1,
            body?.locale ?? "en",
          ).messages.map((message) => ({ ...message, body: null })),
        };
      }
      if (options?.loseFirstLocaleResponse && localeKeys.length === 1) {
        await route.abort("failed");
        return;
      }
    } else if (path.endsWith("/messages")) {
      messageKeys.push(body?.idempotencyKey ?? "");
      if (options?.messageInProgressOnce && messageKeys.length === 1) {
        await route.fulfill({
          status: 409,
          headers,
          body: JSON.stringify({ ok: false, code: "command_in_progress", correlationId: "corr_1" }),
        });
        return;
      }
      const duplicate = messageKeys.slice(0, -1).includes(body?.idempotencyKey ?? "");
      if (!duplicate) current = projection(2, current.locale);
      if (options?.slowMessage) {
        await new Promise((resolveWait) => setTimeout(resolveWait, 600));
      }
      if (options?.loseFirstMessageResponse && messageKeys.length === 1) {
        current = {
          ...current,
          messages: current.messages.map((message) => ({ ...message, body: null })),
        };
        await route.abort("failed");
        return;
      }
    } else if (path.endsWith("/handoff")) {
      handoffKeys.push(body?.idempotencyKey ?? "");
      const duplicate = handoffKeys.slice(0, -1).includes(body?.idempotencyKey ?? "");
      if (!duplicate) {
        current = projection(
          (body?.expectedVersion ?? current.version) + 1,
          current.locale,
          "waiting_for_human",
        );
      }
      if (options?.loseFirstHandoffResponse && handoffKeys.length === 1) {
        await route.abort("failed");
        return;
      }
    } else if (path.endsWith("/conversations")) {
      startKeys.push(body?.idempotencyKey ?? "");
      startLocales.push(body?.locale ?? "es");
      current = projection(1, body?.locale ?? "es", "new");
      if (options?.loseFirstStartResponse && startKeys.length === 1) {
        await route.abort("failed");
        return;
      }
    } else if (path.endsWith("/close")) {
      closeKeys.push(body?.idempotencyKey ?? "");
      closeVersions.push(body?.expectedVersion ?? -1);
      if (body?.expectedVersion !== current.version) {
        await route.fulfill({
          status: 409,
          headers,
          body: JSON.stringify({
            ok: false,
            code: "conflict",
            correlationId: "corr_1",
          }),
        });
        return;
      }
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
        replayed:
          path.endsWith("/messages") &&
          messageKeys.slice(0, -1).includes(body?.idempotencyKey ?? ""),
        correlationId: "corr_1",
      }),
    });
  });
  return {
    startKeys,
    startLocales,
    messageKeys,
    handoffKeys,
    localeKeys,
    closeKeys,
    closeVersions,
  };
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
    await expect(page.locator("[data-public-chat-root]")).toHaveAttribute("lang", "en");
    await expect(page).toHaveURL(/\/chat\/$/u);
  });

  test("reuses the start idempotency key after a lost response", async ({ page }) => {
    const controls = await mockPublicChat(page, { loseFirstStartResponse: true });
    await page.goto("/chat/");
    await page.getByRole("checkbox").check();
    const start = page.getByRole("button", { name: "Empezar conversación" });
    await start.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await start.click();
    await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible();
    expect(controls.startKeys).toHaveLength(2);
    expect(controls.startKeys[0]).toMatch(/^start_[a-f0-9]{32}$/u);
    expect(controls.startKeys[1]).toBe(controls.startKeys[0]);
  });

  test("recovers a lost start before applying a requested language change", async ({ page }) => {
    const controls = await mockPublicChat(page, { loseFirstStartResponse: true });
    await page.goto("/chat/");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /^Empezar/u }).click();
    await expect(page.getByRole("alert")).toBeVisible();

    await page.locator("[data-public-chat-language]").click();

    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
    expect(controls.startKeys).toHaveLength(2);
    expect(controls.startKeys[1]).toBe(controls.startKeys[0]);
    expect(controls.startLocales).toEqual(["es", "es"]);
    expect(controls.localeKeys).toHaveLength(1);
  });

  test("retries a lost message safely and explains metadata-only recovery", async ({ page }) => {
    const controls = await mockPublicChat(page, { loseFirstMessageResponse: true });
    await page.goto("/chat/");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Empezar conversación" }).click();
    const input = page.getByPlaceholder("Escribe tu pregunta sin información sensible");
    await input.fill("Necesito orientación sobre crédito");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "La respuesta anterior no se conserva por privacidad",
    );
    await expect(input).toHaveValue("Necesito orientación sobre crédito");
    expect(controls.messageKeys).toHaveLength(2);
    expect(controls.messageKeys[1]).toBe(controls.messageKeys[0]);
  });

  test("reuses the same message key while the original command is still in progress", async ({
    page,
  }) => {
    const controls = await mockPublicChat(page, { messageInProgressOnce: true });
    await page.goto("/chat/");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /^Empezar/u }).click();
    const input = page.getByPlaceholder(/^Escribe tu pregunta/u);
    await input.fill("Necesito orientacion sobre credito");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Enviar" }).click();
    expect(controls.messageKeys[1]).toBe(controls.messageKeys[0]);
  });

  test("keeps handoff and locale idempotency keys across lost responses", async ({ page }) => {
    const controls = await mockPublicChat(page, {
      loseFirstHandoffResponse: true,
      loseFirstLocaleResponse: true,
    });
    await page.goto("/chat/");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /^Empezar/u }).click();
    const language = page.locator("[data-public-chat-language]");
    await language.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await language.click();
    expect(controls.localeKeys[1]).toBe(controls.localeKeys[0]);

    const human = page.getByRole("button", { name: "Talk to a person" });
    await human.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await human.click();
    expect(controls.handoffKeys[1]).toBe(controls.handoffKeys[0]);
  });

  test("switches language before consent and starts with the selected locale", async ({ page }) => {
    await mockPublicChat(page);
    await page.goto("/chat/");
    await page.locator("[data-public-chat-language]").click();
    await expect(page.getByRole("button", { name: "Start conversation" })).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Start conversation" }).click();
    await expect(page.locator("[data-public-chat-root]")).toHaveAttribute("lang", "en");
  });

  test("transfers a floating conversation to the full-page chat without losing continuity", async ({
    page,
  }) => {
    await mockPublicChat(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir asistente de SG Solutions" }).click();
    await startAndSend(page, "es");
    await page.locator("[data-public-chat-full-page]").click();
    await expect(page).toHaveURL(/\/chat\/$/u);
    await expect(page.getByRole("log")).toContainText(/Necesito orientaci/u);
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
    const controls = await mockPublicChat(page, { slowMessage: true });
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Abrir asistente de SG Solutions" });
    await launcher.click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /^Empezar/u }).click();
    await page.getByPlaceholder(/^Escribe tu pregunta/u).fill("Mensaje que no debe reaparecer");
    await page.getByRole("button", { name: "Enviar" }).click();
    await page.getByRole("button", { name: "Cerrar chat" }).click();
    await expect(page.getByRole("dialog", { name: "Asistente de SG Solutions" })).toBeHidden();
    await page.waitForTimeout(800);
    await launcher.click();
    await expect(page.getByRole("log")).not.toContainText("Mensaje que no debe reaparecer");
    await expect(page.getByRole("log")).toContainText("Hola.");
    expect(controls.closeKeys).toHaveLength(2);
    expect(controls.closeKeys[1]).not.toBe(controls.closeKeys[0]);
    expect(controls.closeVersions).toEqual([1, 2]);
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
