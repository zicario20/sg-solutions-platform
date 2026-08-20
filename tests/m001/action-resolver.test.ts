import { describe, expect, it } from "vitest";
import { resolvePublicAction } from "../../apps/www/src/lib/actions";

describe("M001 public action resolver", () => {
  it("uses an honest localized fallback when evaluation is not configured", () => {
    expect(resolvePublicAction("evaluation", "es", {})).toEqual({
      available: false,
      href: "/contacto/?intent=evaluacion",
      external: false,
    });
    expect(resolvePublicAction("evaluation", "en", {})).toEqual({
      available: false,
      href: "/en/contact/?intent=evaluation",
      external: false,
    });
  });

  it("activates an approved external destination", () => {
    expect(
      resolvePublicAction("evaluation", "en", {
        evaluationUrl: "https://booking.sgsllc.com/evaluation",
        allowedHosts: ["booking.sgsllc.com"],
      }),
    ).toEqual({
      available: true,
      href: "https://booking.sgsllc.com/evaluation",
      external: true,
    });
  });

  it.each([
    "javascript:alert(1)",
    "http://booking.sgsllc.com/evaluation",
    "//evil.example/evaluation",
    "https://evil.example/evaluation",
  ])("rejects unsafe or unapproved destination %s", (evaluationUrl) => {
    expect(() =>
      resolvePublicAction("evaluation", "en", {
        evaluationUrl,
        allowedHosts: ["booking.sgsllc.com"],
      }),
    ).toThrow(/approved https or internal path/);
  });

  it("keeps quote and portal fallbacks distinct", () => {
    expect(resolvePublicAction("quote", "es", {}).href).toBe("/contacto/?intent=cotizacion");
    expect(resolvePublicAction("clientPortal", "es", {})).toEqual({
      available: false,
      href: "/contacto/?intent=portal",
      external: false,
    });
    expect(resolvePublicAction("clientPortal", "en", {})).toEqual({
      available: false,
      href: "/en/contact/?intent=portal",
      external: false,
    });
  });
});
