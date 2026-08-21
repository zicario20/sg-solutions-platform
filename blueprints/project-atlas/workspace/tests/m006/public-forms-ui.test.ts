import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspace = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${workspace}${path}`, "utf8");

describe("M006 accessible progressive public form UI", () => {
  it("renders semantic steps, progress, live status and a focused error summary", () => {
    const experience = read("apps/www/src/components/forms/PublicFormExperience.astro");
    const step = read("apps/www/src/components/forms/FormStep.astro");
    expect(experience).toContain('data-public-form-root');
    expect(experience).toContain('aria-live="polite"');
    expect(experience).toContain('data-form-error-summary');
    expect(experience).toContain('tabindex="-1"');
    expect(experience).toContain('role="progressbar"');
    expect(step).toContain("<fieldset");
    expect(step).toContain("<legend");
    expect(step).toContain("aria-describedby");
  });

  it("keeps answers in page memory and renders review values as text", () => {
    const script = read("apps/www/src/scripts/public-form.ts");
    expect(script).not.toMatch(/localStorage|sessionStorage|innerHTML|document\.cookie/u);
    expect(script).toContain("textContent");
    expect(script).toContain("focus()");
    expect(script).toContain("credentials: \"same-origin\"");
  });

  it("uses existing brand tokens with mobile reflow and reduced motion", () => {
    const styles = read("apps/www/src/styles/public-form.css");
    expect(styles).toContain("var(--color-brand-navy)");
    expect(styles).toContain("var(--color-brand-cobalt)");
    expect(styles).toContain("@media (max-width: 560px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).not.toMatch(/font-family:\s*(?:Arial|Roboto|Inter);/u);
  });

  it("provides parallel Spanish and English route shells", () => {
    const es = read("apps/www/src/pages/forms/[formCode].astro");
    const en = read("apps/www/src/pages/en/forms/[formCode].astro");
    expect(es).toContain("PublicFormExperience");
    expect(en).toContain("PublicFormExperience");
    expect(es).toContain("BaseLayout");
    expect(en).toContain("BaseLayout");
  });
});
