import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "../../apps/www/src/content/help-center";
import { getHelpAlternatePath, getHelpDetailPath } from "../../apps/www/src/lib/help-routes";
import {
  createFaqPageStructuredData,
  createHelpCollectionStructuredData,
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
    const seo = createHelpSeo(
      record,
      origin,
      getHelpAlternatePath(record, HELP_CONTENT, new Date("2026-08-08")),
    );

    expect(seo).toMatchObject({
      canonical: "https://www.sgsllc.com/recursos/guias/como-prepararte-para-una-evaluacion/",
      alternate: "https://www.sgsllc.com/en/resources/guides/how-to-prepare-for-an-evaluation/",
      locale: "es",
      alternateLocale: "en",
    });
  });

  it("emits Article data that matches visible metadata without ratings or offers", () => {
    const record = requireRecord("resource-how-sg-works-en");
    const path = getHelpDetailPath(record.locale, record.type, record.slug);
    const data = createHelpStructuredData(record, origin, path) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const json = JSON.stringify(data);

    expect(json).toContain('"@type":"Article"');
    expect(json).toContain('"dateModified":"2026-08-08"');
    expect(json).toContain('"inLanguage":"en"');
    expect(json).not.toContain('"datePublished"');
    expect(json).not.toContain('"author"');
    expect(json).not.toMatch(/AggregateRating|Review|Offer|price/);
    const breadcrumbs = data["@graph"].find((entry) => entry["@type"] === "BreadcrumbList");
    expect(breadcrumbs).toMatchObject({ "@type": "BreadcrumbList" });
  });

  it("uses DefinedTerm name and exact bilingual breadcrumb positions for glossary pages", () => {
    const record = requireRecord("resource-dti-es");
    const path = getHelpDetailPath(record.locale, record.type, record.slug);
    const data = createHelpStructuredData(record, origin, path) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const term = data["@graph"].find((entry) => entry["@type"] === "DefinedTerm");
    const breadcrumbs = data["@graph"].find((entry) => entry["@type"] === "BreadcrumbList") as {
      itemListElement: Array<Record<string, unknown>>;
    };

    expect(term).toMatchObject({ "@type": "DefinedTerm", name: "DTI" });
    expect(term).not.toHaveProperty("headline");
    expect(term).not.toHaveProperty("dateModified");
    expect(term).not.toHaveProperty("datePublished");
    expect(term).not.toHaveProperty("author");
    expect(breadcrumbs.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(JSON.stringify(breadcrumbs)).toContain("/recursos/glosario/dti/");
  });

  it("emits FAQPage data only for the supplied visible published questions", () => {
    const records = [requireRecord("faq-what-is-sg-es"), requireRecord("faq-how-to-pay-es")];
    const data = createFaqPageStructuredData(
      records,
      origin,
      "/recursos/preguntas-frecuentes/",
    ) as { "@graph": Array<Record<string, unknown>> };
    const faqPage = data["@graph"].find((entry) => entry["@type"] === "FAQPage") as {
      mainEntity: unknown[];
    };

    expect(faqPage.mainEntity).toHaveLength(2);
    expect(JSON.stringify(data)).toContain("¿Qué es SG Solutions?");
    expect(JSON.stringify(data)).not.toContain("owner-internal-id");
  });

  it("keeps provider disclosure in FAQ structured answers and out of non-provider answers", () => {
    const provider = requireRecord("faq-what-is-tradeline-en");
    const nonProvider = requireRecord("faq-what-is-dti-en");
    const data = createFaqPageStructuredData(
      [provider, nonProvider],
      origin,
      "/en/resources/faq/",
    ) as { "@graph": Array<Record<string, unknown>> };
    const faqPage = data["@graph"].find((entry) => entry["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    const providerAnswer = faqPage.mainEntity.find(
      (entry) => entry.name === "What is a tradeline?",
    );
    const nonProviderAnswer = faqPage.mainEntity.find((entry) => entry.name === "What is DTI?");

    expect(providerAnswer?.acceptedAnswer.text).toContain(
      "External provider source: Tradeline Supply",
    );
    expect(providerAnswer?.acceptedAnswer.text).toContain(
      "does not imply an SG Solutions partnership, endorsement or guarantee",
    );
    expect(nonProviderAnswer?.acceptedAnswer.text).not.toContain("Tradeline Supply");
  });

  it("adds visible hub and collection breadcrumbs to CollectionPage data", () => {
    const data = createHelpCollectionStructuredData({
      locale: "en",
      name: "Guides",
      description: "Preparation guides.",
      origin,
      path: "/en/resources/guides/",
      parent: { name: "Help Center", path: "/en/resources/" },
    }) as { "@graph": Array<Record<string, unknown>> };
    expect(data["@graph"].map((entry) => entry["@type"])).toEqual([
      "CollectionPage",
      "BreadcrumbList",
    ]);
    expect(JSON.stringify(data)).toContain("/en/resources/guides/");
  });

  it("keeps Help Center JSON-LD safe for inline serialization", () => {
    const serialized = serializeStructuredData({ value: "</script><script>unsafe()</script>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
