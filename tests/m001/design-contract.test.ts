import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { designTokens, toCssVariables } from "@atlas/design-tokens";
import { describe, expect, it } from "vitest";

describe("M001 design contract", () => {
  it("maps the approved brand palette to semantic roles", () => {
    expect(designTokens.primitive.color).toMatchObject({
      navy: "#0A2540",
      cobalt: "#0B63CE",
      cyan: "#00A3E0",
      green: "#2E7D32",
      gold: "#B7791F",
      surface: "#F7F9FC",
    });
    expect(designTokens.semantic).toMatchObject({
      text: { heading: "#0A2540" },
      action: { primary: "#0B63CE" },
      progress: { positive: "#2E7D32" },
    });
  });

  it("serializes semantic tokens into stable CSS custom properties", () => {
    expect(toCssVariables()).toContain("--color-action-primary: #0B63CE;");
    expect(toCssVariables()).toContain(
      '--font-heading: "Manrope Variable", Manrope, "Inter Variable", Inter, system-ui, sans-serif;',
    );
    expect(toCssVariables()).toContain("--control-min-size: 44px;");
  });

  it("preserves the exact Product Owner supplied logo bytes", () => {
    const asset = readFileSync("apps/www/public/brand/sg-solutions-logo.jpg");
    expect(asset.byteLength).toBe(96166);
    expect(createHash("sha256").update(asset).digest("hex").toUpperCase()).toBe(
      "9C9C29ADB8AEAD143756FA155FAFBC1DC0B9A90BA6F44D308EF37C51EF45C918",
    );
  });

  it("defers below-the-fold layout without removing content from the document", () => {
    const styles = readFileSync("apps/www/src/styles/global.css", "utf8");
    expect(styles).toContain("content-visibility: auto;");
    expect(styles).toContain("contain-intrinsic-size:");
  });

  it("gives compact navigation and text links the approved minimum target size", () => {
    const styles = readFileSync("apps/www/src/styles/global.css", "utf8");

    for (const selector of [
      ".action-link--text",
      ".utility-bar .action-link",
      ".breadcrumbs a",
      ".text-link",
      ".site-footer a",
    ]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(styles).toMatch(
        new RegExp(`${escaped}\\s*\\{[^}]*min-height:\\s*var\\(--control-min-size\\)`, "s"),
      );
    }
  });
});
