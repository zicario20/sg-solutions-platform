import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import { getHelpAlternatePath, getHelpDetailPath } from "../../apps/www/src/lib/help-routes";
import {
  createFaqPageStructuredData,
  createHelpSeo,
  createHelpStructuredData,
} from "../../apps/www/src/lib/help-seo";
import { serializeStructuredData } from "../../apps/www/src/lib/seo";

const origin = "https://www.sgsllc.com";

function requireRecord(id: string) {
  const record = HELP_CONTENT.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Missing fixture ${id}`);
  return record;
}

describe("M002 SEO contract", () => {
  it("creates exact canonical and alternate URLs for a paired detail", () => {
    const record = requireRecord("resource-prepare-evaluation-es");
    const seo = createHelpSeo(record, origin, getHelpAlternatePath(record, HELP_CONTENT));

    expect(seo).toMatchObject({
      canonical: "https://www.sgsllc.com/recursos/guias/prepare-evaluation/",
      alternate: "https://www.sgsllc.com/en/resources/guides/prepare-evaluation/",
      locale: "es",
      alternateLocale: "en",
    });
  });

  it("emits Article data that matches visible metadata without ratings or offers", () => {
    const record = requireRecord("resource-how-sg-works-en");
    const path = getHelpDetailPath(record.locale, record.type, record.slug);
    const json = JSON.stringify(createHelpStructuredData(record, origin, path));

    expect(json).toContain('"@type":"Article"');
    expect(json).toContain('"dateModified":"2026-08-08"');
    expect(json).toContain('"inLanguage":"en"');
    expect(json).not.toMatch(/AggregateRating|Review|Offer|price/);
  });

  it("emits FAQPage data only for the supplied visible published questions", () => {
    const records = [requireRecord("faq-what-is-sg-es"), requireRecord("faq-how-to-pay-es")];
    const data = createFaqPageStructuredData(
      records,
      origin,
      "/recursos/preguntas-frecuentes/",
    ) as { mainEntity: unknown[] };

    expect(data.mainEntity).toHaveLength(2);
    expect(JSON.stringify(data)).toContain("¿Qué es SG Solutions?");
    expect(JSON.stringify(data)).not.toContain("owner-internal-id");
  });

  it("keeps Help Center JSON-LD safe for inline serialization", () => {
    const serialized = serializeStructuredData({ value: "</script><script>unsafe()</script>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
