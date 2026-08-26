import { authCopy, resolveAuthPageLocale } from "@atlas/i18n";
import { describe, expect, it } from "vitest";
import { createAuthLocaleHandler, RootDocument } from "../../apps/app/src/lib/auth/locale.ts";

describe("AR-008 auth locale routing", () => {
  it("uses only allowlisted route or cookie locales and keeps translation keys in parity", () => {
    expect(resolveAuthPageLocale("en", "es")).toBe("en");
    expect(resolveAuthPageLocale("<script>", "en")).toBe("en");
    expect(resolveAuthPageLocale(undefined, "invalid")).toBe("es");
    expect(Object.keys(authCopy.es).sort()).toEqual(Object.keys(authCopy.en).sort());
  });

  it("sets a validated locale cookie and redirects once only to a safe portal route", async () => {
    const handler = createAuthLocaleHandler();
    const response = await handler(
      new Request("https://portal.example/api/auth/locale", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "locale=en&return_to=%2Fclient%2Fsecurity",
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://portal.example/client/security");
    expect(response.headers.get("set-cookie")).toContain("atlas_locale=en");
    const loop = await handler(
      new Request("https://portal.example/api/auth/locale", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "locale=xx&return_to=%2Fapi%2Fauth%2Flocale",
      }),
    );
    expect(loop.headers.get("location")).toBe("https://portal.example/client/sign-in");
  });

  it("renders the validated document locale as html lang", () => {
    const document = RootDocument({ locale: "en", children: "portal" });
    expect(typeof document).toBe("object");
    expect(document.type).toBe("html");
    expect(document.props.lang).toBe("en");
  });
});
