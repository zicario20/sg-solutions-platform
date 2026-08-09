import { HELP_CATEGORIES, HELP_COLLECTIONS } from "../content/help-center";
import type {
  HelpCategoryId,
  KnowledgeRecord,
  KnowledgeType,
  PublicKnowledgeRecord,
} from "../domain/help-center";
import type { Locale, PublicPage } from "../domain/public-site";
import { listPublishedKnowledge } from "./help-content";
import {
  getHelpCategoryPath,
  getHelpCollectionPath,
  getHelpDetailPath,
  getHelpHubPath,
} from "./help-routes";

export interface HelpPageShellInput {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  heading: string;
  summary: string;
}

export interface HelpDetailEntry {
  path: string;
  record: PublicKnowledgeRecord;
}

export interface HelpCollectionEntry {
  type: KnowledgeType;
  path: string;
  records: PublicKnowledgeRecord[];
}

export interface HelpCategoryEntry {
  category: HelpCategoryId;
  path: string;
  records: PublicKnowledgeRecord[];
}

export function createHelpPageShell(input: HelpPageShellInput): PublicPage {
  return {
    routeKey: "about",
    locale: input.locale,
    path: input.path,
    kind: "standard",
    title: input.title,
    description: input.description,
    hero: {
      eyebrow: input.locale === "es" ? "Centro de ayuda" : "Help Center",
      heading: input.heading,
      summary: input.summary,
    },
    sections: [],
    publicationState: "published",
  };
}

export function getHelpDetailEntries(
  records: KnowledgeRecord[],
  locale: Locale,
  at: Date,
): HelpDetailEntry[] {
  return listPublishedKnowledge(records, locale, {}, at).map((record) => ({
    record,
    path: getHelpDetailPath(record.locale, record.type, record.slug),
  }));
}

export function getHelpCollectionEntries(
  records: KnowledgeRecord[],
  locale: Locale,
  at: Date,
): HelpCollectionEntry[] {
  return HELP_COLLECTIONS.map(({ type }) => ({
    type,
    path: getHelpCollectionPath(locale, type),
    records: listPublishedKnowledge(records, locale, { type }, at),
  })).filter((entry) => entry.records.length > 0);
}

export function getHelpCategoryEntries(
  records: KnowledgeRecord[],
  locale: Locale,
  at: Date,
): HelpCategoryEntry[] {
  return HELP_CATEGORIES.map(({ id }) => ({
    category: id,
    path: getHelpCategoryPath(locale, id),
    records: listPublishedKnowledge(records, locale, { category: id }, at),
  })).filter((entry) => entry.records.length > 0);
}

export function getHelpSitemapPaths(records: KnowledgeRecord[], at: Date): string[] {
  const paths = new Set<string>();
  for (const locale of ["es", "en"] as const) {
    paths.add(getHelpHubPath(locale));
    for (const collection of getHelpCollectionEntries(records, locale, at)) {
      paths.add(collection.path);
    }
    for (const category of getHelpCategoryEntries(records, locale, at)) {
      paths.add(category.path);
    }
    for (const detail of getHelpDetailEntries(records, locale, at)) {
      paths.add(detail.path);
    }
  }
  return [...paths];
}
