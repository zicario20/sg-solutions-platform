import { documentCopy } from "@atlas/i18n";
import { describe, expect, it } from "vitest";

describe("M011 document portal UI", () => {
  it.each(["es", "en"] as const)("keeps %s upload guidance safe and customer-facing", (locale) => {
    const copy = documentCopy[locale];
    expect(copy.title).toBe(locale === "es" ? "Documentos" : "Documents");
    expect(copy.allowedBody).toContain("PDF");
    expect(copy.allowedBody).toContain("25 MB");
    expect(JSON.stringify(copy)).not.toMatch(/quarantine|accepted_key|scanner|localStorage/i);
  });
});
