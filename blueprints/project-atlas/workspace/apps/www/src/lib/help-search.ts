import { getCollectionCopy } from "../content/help-center/categories";
import type {
  HelpCategoryId,
  HelpContentFilters,
  KnowledgeRecord,
  KnowledgeType,
} from "../domain/help-center";
import type { Locale } from "../domain/public-site";
import { listPublishedKnowledge } from "./help-content";

export interface PublicSearchDocument {
  id: string;
  locale: Locale;
  type: KnowledgeType;
  category: HelpCategoryId;
  title: string;
  summary: string;
  path: string;
  keywords: string[];
  reviewedAt: string;
}

export interface RankedSearchDocument extends PublicSearchDocument {
  score: number;
}

const QUERY_EXPANSIONS: Record<Locale, Record<string, string[]>> = {
  es: {
    "prestamo rural cero inicial": ["usda", "direct", "guaranteed", "rural", "vivienda"],
    "comprar casa": ["vivienda", "hipoteca", "home buying"],
    impuestos: ["taxes", "w-2", "1099"],
  },
  en: {
    "rural zero down": ["usda", "direct", "guaranteed", "rural", "housing"],
    "buy a home": ["housing", "mortgage", "home buying"],
    impuestos: ["taxes", "w-2", "1099"],
  },
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildSearchIndex(
  records: KnowledgeRecord[],
  locale: Locale,
  at: Date,
): PublicSearchDocument[] {
  return listPublishedKnowledge(records, locale, {}, at).map((record) => ({
    id: record.id,
    locale: record.locale,
    type: record.type,
    category: record.category,
    title: record.title,
    summary: record.summary,
    path: createSearchDocumentPath(record.locale, record.type, record.slug),
    keywords: record.keywords,
    reviewedAt: record.reviewedAt,
  }));
}

export function searchHelp(
  index: PublicSearchDocument[],
  query: string,
  filters: HelpContentFilters,
): RankedSearchDocument[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const locale = index[0]?.locale ?? "en";
  const expandedTokens = expandQuery(normalizedQuery, locale);

  return index
    .filter((document) => !filters.type || document.type === filters.type)
    .filter((document) => !filters.category || document.category === filters.category)
    .map((document) => ({
      ...document,
      score: scoreDocument(document, normalizedQuery, expandedTokens),
    }))
    .filter((document) => document.score > 0)
    .sort(
      (left, right) => right.score - left.score || left.title.localeCompare(right.title, locale),
    );
}

function createSearchDocumentPath(locale: Locale, type: KnowledgeType, slug: string): string {
  const base = locale === "es" ? "/recursos" : "/en/resources";
  return `${base}/${getCollectionCopy(locale, type).pathSegment}/${slug}/`;
}

function expandQuery(query: string, locale: Locale): string[] {
  const tokens = new Set(query.split(" "));
  for (const [phrase, expansion] of Object.entries(QUERY_EXPANSIONS[locale])) {
    if (query.includes(phrase)) {
      for (const token of expansion.flatMap((value) => normalizeSearchText(value).split(" "))) {
        if (token) tokens.add(token);
      }
    }
  }
  return [...tokens];
}

function scoreDocument(
  document: PublicSearchDocument,
  query: string,
  queryTokens: string[],
): number {
  const title = normalizeSearchText(document.title);
  const summary = normalizeSearchText(document.summary);
  const category = normalizeSearchText(document.category);
  const keywords = document.keywords.map(normalizeSearchText);
  const titleTokens = new Set(title.split(" "));
  let score = title === query ? 100 : title.includes(query) ? 50 : 0;

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 30;
    if (keywords.some((keyword) => keyword === token || keyword.includes(token))) score += 20;
    if (category.includes(token)) score += 12;
    if (summary.includes(token)) score += 5;
  }

  return score;
}
