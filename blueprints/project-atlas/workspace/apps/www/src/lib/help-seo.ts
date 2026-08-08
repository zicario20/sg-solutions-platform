import type { PublicKnowledgeRecord } from "../domain/help-center";
import { getHelpDetailPath } from "./help-routes";

export interface HelpSeoProjection {
  title: string;
  description: string;
  canonical: string;
  alternate: string;
  locale: "es" | "en";
  alternateLocale: "es" | "en";
}

export function createHelpSeo(
  record: PublicKnowledgeRecord,
  origin: string,
  alternatePath: string,
): HelpSeoProjection {
  const base = normalizeOrigin(origin);
  return {
    title: record.seoTitle,
    description: record.seoDescription,
    canonical: new URL(getHelpDetailPath(record.locale, record.type, record.slug), base).toString(),
    alternate: new URL(alternatePath, base).toString(),
    locale: record.locale,
    alternateLocale: record.locale === "es" ? "en" : "es",
  };
}

export function createHelpStructuredData(
  record: PublicKnowledgeRecord,
  origin: string,
  path: string,
): object {
  return {
    "@context": "https://schema.org",
    "@type": record.type === "glossary" ? "DefinedTerm" : "Article",
    headline: record.title,
    description: record.summary,
    url: new URL(path, normalizeOrigin(origin)).toString(),
    inLanguage: record.locale,
    datePublished: record.publishedAt,
    dateModified: record.reviewedAt,
    author: {
      "@type": "Organization",
      name: "SG Solutions LLC",
      url: normalizeOrigin(origin),
    },
  };
}

export function createFaqPageStructuredData(
  records: PublicKnowledgeRecord[],
  origin: string,
  path: string,
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: new URL(path, normalizeOrigin(origin)).toString(),
    inLanguage: records[0]?.locale,
    mainEntity: records.map((record) => ({
      "@type": "Question",
      name: record.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: blocksToPlainText(record),
      },
    })),
  };
}

function blocksToPlainText(record: PublicKnowledgeRecord): string {
  return record.blocks
    .flatMap((block) => {
      if (block.type === "paragraph") return [block.text];
      if (block.type === "list") return block.items;
      if (block.type === "steps") return block.items.map((item) => `${item.title}: ${item.text}`);
      return [block.title, block.text];
    })
    .join(" ");
}

function normalizeOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Public origin must use https");
  }
  return `${url.origin}/`;
}
