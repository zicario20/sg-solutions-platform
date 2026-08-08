import type {
  ContentFreshness,
  HelpContentFilters,
  KnowledgeRecord,
  KnowledgeType,
  PublicKnowledgeRecord,
} from "../domain/help-center";
import type { Locale } from "../domain/public-site";

export function evaluateFreshness(record: KnowledgeRecord, at: Date): ContentFreshness {
  if (!record.nextReviewAt) return "current";

  const reviewAt = parseDate(record.nextReviewAt, "nextReviewAt");
  if (reviewAt.getTime() >= startOfUtcDay(at).getTime()) return "current";
  return record.riskLevel === "low" ? "review_due" : "stale";
}

export function toPublicKnowledge(
  record: KnowledgeRecord,
  at: Date,
): PublicKnowledgeRecord | null {
  if (record.status !== "published" || !record.audiences.includes("public")) return null;
  if (evaluateFreshness(record, at) === "stale") return null;

  return {
    id: record.id,
    translationGroupId: record.translationGroupId,
    locale: record.locale,
    type: record.type,
    category: record.category,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    blocks: record.blocks,
    keywords: record.keywords,
    version: record.version,
    riskLevel: record.riskLevel,
    reviewedAt: record.reviewedAt,
    nextReviewAt: record.nextReviewAt,
    relatedIds: record.relatedIds,
    disclosure: record.disclosure,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    sources: record.sources,
    jurisdiction: record.jurisdiction,
    readingMinutes: record.readingMinutes,
    publishedAt: record.publishedAt,
  };
}

export function listPublishedKnowledge(
  records: KnowledgeRecord[],
  locale: Locale,
  filters: HelpContentFilters,
  at: Date,
): PublicKnowledgeRecord[] {
  return records
    .filter((record) => record.locale === locale)
    .map((record) => toPublicKnowledge(record, at))
    .filter((record): record is PublicKnowledgeRecord => record !== null)
    .filter((record) => !filters.category || record.category === filters.category)
    .filter((record) => !filters.type || record.type === filters.type)
    .sort((left, right) => left.title.localeCompare(right.title, locale));
}

export function getPublishedKnowledgeBySlug(
  records: KnowledgeRecord[],
  locale: Locale,
  collection: KnowledgeType,
  slug: string,
  at: Date,
): PublicKnowledgeRecord | null {
  const match = records.find(
    (record) => record.locale === locale && record.type === collection && record.slug === slug,
  );
  return match ? toPublicKnowledge(match, at) : null;
}

function parseDate(value: string, field: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${field}: ${value}`);
  return parsed;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
