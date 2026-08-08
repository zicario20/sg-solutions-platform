import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import { buildSearchIndex } from "../../apps/www/src/lib/help-search";
import { GET as getEnglishIndex } from "../../apps/www/src/pages/en/resources/search-index.json";
import { GET as getSpanishIndex } from "../../apps/www/src/pages/recursos/indice-busqueda.json";

const at = new Date("2026-08-08T12:00:00.000Z");

describe("M002 minimized search index", () => {
  it("contains only the allowlisted searchable projection", () => {
    const [document] = buildSearchIndex(HELP_CONTENT, "es", at);
    expect(Object.keys(document ?? {}).sort()).toEqual([
      "category",
      "id",
      "keywords",
      "locale",
      "path",
      "reviewedAt",
      "summary",
      "title",
      "type",
    ]);
    expect(document).not.toHaveProperty("blocks");
    expect(document).not.toHaveProperty("sources");
    expect(document).not.toHaveProperty("authorId");
  });

  it("emits independent Spanish and English JSON endpoints", async () => {
    const spanish = (await (getSpanishIndex as () => Response)()).clone();
    const english = (await (getEnglishIndex as () => Response)()).clone();
    const spanishBody = (await spanish.json()) as Array<{ locale: string; path: string }>;
    const englishBody = (await english.json()) as Array<{ locale: string; path: string }>;

    expect(spanish.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(english.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(spanishBody.every((entry) => entry.locale === "es" && entry.path.startsWith("/recursos/"))).toBe(true);
    expect(englishBody.every((entry) => entry.locale === "en" && entry.path.startsWith("/en/resources/"))).toBe(true);
  });
});
