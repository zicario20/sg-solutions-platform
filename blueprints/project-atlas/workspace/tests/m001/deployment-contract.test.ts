import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface HeaderRecord {
  key: string;
  value: string;
}

interface VercelConfig {
  headers: Array<{ source: string; headers: HeaderRecord[] }>;
  routes?: Array<{
    handle?: string;
    src?: string;
    status?: number;
    dest?: string;
  }>;
}

describe("M001 public deployment contract", () => {
  it("applies the required security headers to every public route", () => {
    const config = JSON.parse(readFileSync("apps/www/vercel.json", "utf8")) as VercelConfig;
    const global = config.headers.find((entry) => entry.source === "/(.*)");
    expect(global).toBeDefined();
    const headers = new Map(global?.headers.map((header) => [header.key, header.value]));

    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("does not grant third-party script, frame, form or network access", () => {
    const config = JSON.parse(readFileSync("apps/www/vercel.json", "utf8")) as VercelConfig;
    const csp = config.headers
      .find((entry) => entry.source === "/(.*)")
      ?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toMatch(/unsafe-inline|https:\/\/|\*/);
  });

  it("loads the mobile-navigation enhancement as a same-origin external script", () => {
    const header = readFileSync("apps/www/src/components/SiteHeader.astro", "utf8");
    const layout = readFileSync("apps/www/src/layouts/BaseLayout.astro", "utf8");

    expect(header).not.toMatch(/<script(?:\s|>)/);
    expect(layout).toContain(
      '<script is:inline src="/scripts/mobile-navigation.js" defer></script>',
    );
    expect(existsSync("apps/www/public/scripts/mobile-navigation.js")).toBe(true);
    expect(header).toContain('aria-controls="mobile-navigation-panel"');
    expect(header).toContain('aria-expanded="false"');
    expect(header).toContain('id="mobile-navigation-panel"');
  });

  it("uses Vercel high-level routing with a CSP-safe localized SSG 404", () => {
    const config = JSON.parse(readFileSync("apps/www/vercel.json", "utf8")) as VercelConfig;
    const notFound = readFileSync("apps/www/src/components/NotFoundPage.astro", "utf8");

    expect(config.routes).toBeUndefined();
    expect(notFound).toContain('src="/scripts/localized-404.js"');
    expect(notFound).toContain("<noscript>");
    expect(notFound).toContain('lang="en"');
    expect(existsSync("apps/www/public/scripts/localized-404.js")).toBe(true);
    expect(existsSync("apps/www/src/pages/en/404.astro")).toBe(true);
  });

  it("prevents common private key and credential files from being committed", () => {
    const gitignore = readFileSync(".gitignore", "utf8");

    for (const pattern of [
      "*.pem",
      "*.key",
      "*.p12",
      "*.pfx",
      "*.jks",
      "credentials*.json",
      "service-account*.json",
    ]) {
      expect(gitignore).toContain(pattern);
    }
  });

  it("documents every M001 activation setting without shipping a destination", () => {
    const environmentExample = readFileSync(".env.example", "utf8");

    for (const setting of [
      "PUBLIC_EVALUATION_URL=",
      "PUBLIC_QUOTE_URL=",
      "PUBLIC_CLIENT_PORTAL_URL=",
      "PUBLIC_ACTION_ALLOWED_HOSTS=",
    ]) {
      expect(environmentExample).toContain(setting);
    }
  });
});
