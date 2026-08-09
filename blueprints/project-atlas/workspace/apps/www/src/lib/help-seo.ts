import { getCollectionCopy } from "../content/help-center/categories";
import type { PublicKnowledgeRecord } from "../domain/help-center";
import type { Locale } from "../domain/public-site";
import { getProviderDisclosureCopy, hasExternalProviderSource } from "./help-provider";
import { getHelpCollectionPath, getHelpDetailPath, getHelpHubPath } from "./help-routes";

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
  const url = new URL(path, normalizeOrigin(origin)).toString();
  const primary =
    record.type === "glossary"
      ? {
          "@type": "DefinedTerm",
          "@id": `${url}#content`,
          name: record.title,
          description: record.summary,
          url,
          inLanguage: record.locale,
        }
      : {
          "@type": "Article",
          "@id": `${url}#content`,
          headline: record.title,
          description: record.summary,
          url,
          inLanguage: record.locale,
          dateModified: record.reviewedAt,
        };
  return graph(
    primary,
    breadcrumbList(origin, [
      {
        name: record.locale === "es" ? "Centro de ayuda" : "Help Center",
        path: getHelpHubPath(record.locale),
      },
      {
        name: getCollectionCopy(record.locale, record.type).title,
        path: getHelpCollectionPath(record.locale, record.type),
      },
      { name: record.title, path },
    ]),
  );
}

export function createFaqPageStructuredData(
  records: PublicKnowledgeRecord[],
  origin: string,
  path: string,
): object {
  const locale = records[0]?.locale ?? (path.startsWith("/en/") ? "en" : "es");
  const primary = {
    "@type": "FAQPage",
    "@id": `${new URL(path, normalizeOrigin(origin)).toString()}#faq`,
    url: new URL(path, normalizeOrigin(origin)).toString(),
    inLanguage: locale,
    mainEntity: records.map((record) => ({
      "@type": "Question",
      name: record.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: blocksToPlainText(record),
      },
    })),
  };
  return graph(
    primary,
    breadcrumbList(origin, [
      { name: locale === "es" ? "Centro de ayuda" : "Help Center", path: getHelpHubPath(locale) },
      { name: getCollectionCopy(locale, "faq").title, path },
    ]),
  );
}

export interface HelpCollectionStructuredDataInput {
  locale: Locale;
  name: string;
  description: string;
  origin: string;
  path: string;
  parent?: { name: string; path: string };
}

export function createHelpCollectionStructuredData(
  input: HelpCollectionStructuredDataInput,
): object {
  const primary = {
    "@type": "CollectionPage",
    "@id": `${new URL(input.path, normalizeOrigin(input.origin)).toString()}#collection`,
    name: input.name,
    description: input.description,
    url: new URL(input.path, normalizeOrigin(input.origin)).toString(),
    inLanguage: input.locale,
  };
  const items = input.parent
    ? [input.parent, { name: input.name, path: input.path }]
    : [{ name: input.name, path: input.path }];
  return graph(primary, breadcrumbList(input.origin, items));
}

function blocksToPlainText(record: PublicKnowledgeRecord): string {
  const answer = record.blocks
    .flatMap((block) => {
      if (block.type === "paragraph") return [block.text];
      if (block.type === "list") return block.items;
      if (block.type === "steps") return block.items.map((item) => `${item.title}: ${item.text}`);
      return [block.title, block.text];
    })
    .join(" ");
  if (!hasExternalProviderSource(record)) return answer;
  const provider = getProviderDisclosureCopy(record.locale);
  return `${answer} ${provider.label}. ${provider.notice}`;
}

function normalizeOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Public origin must use https");
  }
  return `${url.origin}/`;
}

function graph(primary: object, breadcrumbs: object): object {
  return {
    "@context": "https://schema.org",
    "@graph": [primary, breadcrumbs],
  };
}

function breadcrumbList(origin: string, items: Array<{ name: string; path: string }>): object {
  const base = normalizeOrigin(origin);
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, base).toString(),
    })),
  };
}
