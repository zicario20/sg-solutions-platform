import type { PublicCitation, PublicKnowledgeProvider } from "@atlas/domain";
import type { KnowledgeRecord } from "../../domain/help-center.ts";
import { evaluateFreshness, toPublicKnowledge } from "../help-content.ts";
import { hasExternalProviderSource } from "../help-provider.ts";
import { getHelpDetailPath } from "../help-routes.ts";
import { buildSearchIndex, searchHelp } from "../help-search.ts";

const SEARCH_RESULT_LIMIT = 3;

function selectCurrentRecords(
  records: KnowledgeRecord[],
  locale: "es" | "en",
  now: Date,
): KnowledgeRecord[] {
  return records.filter(
    (record) =>
      record.locale === locale &&
      record.status === "published" &&
      record.audiences.includes("public") &&
      evaluateFreshness(record, now) === "current",
  );
}

function toCitation(record: KnowledgeRecord, now: Date): PublicCitation | null {
  const publicRecord = toPublicKnowledge(record, now);
  if (!publicRecord) return null;
  const sourceKind = hasExternalProviderSource(publicRecord) ? "provider" : null;
  if (sourceKind === "provider" && !publicRecord.disclosure.trim()) {
    throw new Error(`Provider disclosure is required: ${publicRecord.id}`);
  }
  return {
    sourceId: publicRecord.id,
    title: publicRecord.title,
    path: getHelpDetailPath(publicRecord.locale, publicRecord.type, publicRecord.slug),
    locale: publicRecord.locale,
    summary: publicRecord.summary,
    disclosure: publicRecord.disclosure,
    sourceKind,
  };
}

export function createM002KnowledgeProvider(
  records: KnowledgeRecord[],
  clock: Date | (() => Date),
): PublicKnowledgeProvider {
  const now = () => (clock instanceof Date ? new Date(clock) : clock());
  const current = (locale: "es" | "en", at: Date) => selectCurrentRecords(records, locale, at);
  const citationsById = (locale: "es" | "en", at: Date) =>
    new Map(
      current(locale, at).flatMap((record) => {
        const citation = toCitation(record, at);
        return citation ? [[citation.sourceId, citation] as const] : [];
      }),
    );

  return {
    async search({ locale, query }) {
      const at = now();
      const eligibleRecords = current(locale, at);
      const ranked = searchHelp(buildSearchIndex(eligibleRecords, locale, at), query, {});
      const byId = citationsById(locale, at);
      return ranked.slice(0, SEARCH_RESULT_LIMIT).flatMap((document) => {
        const citation = byId.get(document.id);
        return citation ? [citation] : [];
      });
    },

    async getByIds({ locale, ids }) {
      const byId = citationsById(locale, now());
      const seen = new Set<string>();
      return ids.flatMap((id) => {
        if (seen.has(id)) return [];
        seen.add(id);
        const citation = byId.get(id);
        return citation ? [citation] : [];
      });
    },
  };
}
