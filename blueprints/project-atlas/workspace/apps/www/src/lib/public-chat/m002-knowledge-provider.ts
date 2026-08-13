import type { PublicCitation, PublicKnowledgeProvider } from "@atlas/domain";
import type { KnowledgeRecord } from "../../domain/help-center.ts";
import { evaluateFreshness, toPublicKnowledge } from "../help-content.ts";
import { getHelpDetailPath } from "../help-routes.ts";

const SEARCH_RESULT_LIMIT = 5;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function toCurrentCitation(
  record: KnowledgeRecord,
  locale: "es" | "en",
  now: Date,
): PublicCitation | null {
  if (
    record.locale !== locale ||
    record.status !== "published" ||
    !record.audiences.includes("public") ||
    evaluateFreshness(record, now) !== "current"
  ) {
    return null;
  }
  const publicRecord = toPublicKnowledge(record, now);
  if (!publicRecord) return null;
  return {
    sourceId: publicRecord.id,
    title: publicRecord.title,
    path: getHelpDetailPath(publicRecord.locale, publicRecord.type, publicRecord.slug),
    locale: publicRecord.locale,
  };
}

function scoreRecord(record: KnowledgeRecord, tokens: string[]): number {
  const title = normalizeSearchText(record.title);
  const keywords = record.keywords.map(normalizeSearchText);
  const summary = normalizeSearchText(record.summary);
  return tokens.reduce((score, token) => {
    if (title.includes(token)) return score + 30;
    if (keywords.some((keyword) => keyword.includes(token))) return score + 20;
    if (summary.includes(token)) return score + 10;
    return score;
  }, 0);
}

export function createM002KnowledgeProvider(
  records: KnowledgeRecord[],
  now: Date,
): PublicKnowledgeProvider {
  const currentRecords = (locale: "es" | "en") =>
    records
      .map((record) => ({ record, citation: toCurrentCitation(record, locale, now) }))
      .filter(
        (candidate): candidate is { record: KnowledgeRecord; citation: PublicCitation } =>
          candidate.citation !== null,
      );

  return {
    async search({ locale, query }) {
      const tokens = [...new Set(normalizeSearchText(query).split(" ").filter(Boolean))];
      if (tokens.length === 0) return [];
      return currentRecords(locale)
        .map(({ record, citation }) => ({ citation, score: scoreRecord(record, tokens) }))
        .filter(({ score }) => score > 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            left.citation.title.localeCompare(right.citation.title, locale) ||
            left.citation.sourceId.localeCompare(right.citation.sourceId),
        )
        .slice(0, SEARCH_RESULT_LIMIT)
        .map(({ citation }) => citation);
    },

    async getByIds({ locale, ids }) {
      const byId = new Map(
        currentRecords(locale).map(({ citation }) => [citation.sourceId, citation] as const),
      );
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
