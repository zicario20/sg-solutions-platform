import { getCollectionCopy } from "../content/help-center/categories";
import type { KnowledgeRecord, KnowledgeType } from "../domain/help-center";
import type { Locale } from "../domain/public-site";

export const HELP_LEGACY_REDIRECTS = {
  "/preguntas-frecuentes/": "/recursos/preguntas-frecuentes/",
  "/en/faq/": "/en/resources/faq/",
} as const;

export function getHelpHubPath(locale: Locale): string {
  return locale === "es" ? "/recursos/" : "/en/resources/";
}

export function getHelpSearchPath(locale: Locale): string {
  return locale === "es" ? "/recursos/buscar/" : "/en/resources/search/";
}

export function getHelpCollectionPath(locale: Locale, type: KnowledgeType): string {
  return `${getHelpHubPath(locale)}${getCollectionCopy(locale, type).pathSegment}/`;
}

export function getHelpDetailPath(locale: Locale, type: KnowledgeType, slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid help slug: ${slug}`);
  return `${getHelpCollectionPath(locale, type)}${slug}/`;
}

export function getHelpAlternatePath(record: KnowledgeRecord, records: KnowledgeRecord[]): string {
  const alternateLocale = record.locale === "es" ? "en" : "es";
  const pair = records.find(
    (candidate) =>
      candidate.translationGroupId === record.translationGroupId &&
      candidate.locale === alternateLocale &&
      candidate.type === record.type,
  );
  if (!pair) throw new Error(`Missing ${alternateLocale} translation for ${record.id}`);
  return getHelpDetailPath(pair.locale, pair.type, pair.slug);
}
