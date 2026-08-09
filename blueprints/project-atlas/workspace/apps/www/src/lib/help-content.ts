import type {
  ContentFreshness,
  HelpCategoryId,
  HelpContentFilters,
  KnowledgeRecord,
  KnowledgeSourceKind,
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

export function toPublicKnowledge(record: KnowledgeRecord, at: Date): PublicKnowledgeRecord | null {
  if (record.status !== "published" || !record.audiences.includes("public")) return null;
  assertKnowledgeRecordValid(record);
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
    nextAction: record.nextAction,
  };
}

const APPROVED_PUBLIC_AUTHORITY_HOSTS = new Set([
  "consumerfinance.gov",
  "hud.gov",
  "sba.gov",
  "usda.gov",
]);

const CATEGORY_SCOPED_SOURCE_HOSTS: Partial<Record<HelpCategoryId, Set<string>>> = {
  tradelines: new Set(["tradelinesupply.com"]),
};

export function assertKnowledgeRecordValid(record: KnowledgeRecord): void {
  parseDate(record.reviewedAt, "reviewedAt");
  if (record.nextReviewAt) parseDate(record.nextReviewAt, "nextReviewAt");
  if (record.publishedAt) parseDate(record.publishedAt, "publishedAt");
  for (const source of record.sources ?? []) {
    parseDate(source.retrievedAt, "source retrievedAt");
    if (source.effectiveDate) parseDate(source.effectiveDate, "source effectiveDate");
    assertApprovedPublicSourceUrl(source.url, record.category, source.sourceKind);
  }

  if (
    record.status === "published" &&
    record.audiences.includes("public") &&
    record.riskLevel !== "low"
  ) {
    const missing = [
      !record.sources?.length && "sources",
      !record.jurisdiction && "jurisdiction",
      !record.nextReviewAt && "nextReviewAt",
      !record.authorId && "authorId",
      !record.reviewerId && "reviewerId",
      !record.approverId && "approverId",
    ].filter(Boolean);
    if (missing.length) {
      throw new Error(
        `Published medium/high-risk content requires ${missing.join(", ")}: ${record.id}`,
      );
    }
  }
}

export function assertKnowledgeRegistryValid(records: KnowledgeRecord[], at: Date): void {
  const ids = new Set<string>();
  const routes = new Set<string>();
  const translationGroups = new Map<string, KnowledgeRecord[]>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate knowledge ID: ${record.id}`);
    ids.add(record.id);
    const routeKey = `${record.locale}:${record.type}:${record.slug}`;
    if (routes.has(routeKey)) throw new Error(`Duplicate knowledge route: ${routeKey}`);
    routes.add(routeKey);
    translationGroups.set(record.translationGroupId, [
      ...(translationGroups.get(record.translationGroupId) ?? []),
      record,
    ]);
    assertKnowledgeRecordValid(record);

    if (record.requiredForLaunch) {
      if (evaluateFreshness(record, at) === "stale") {
        throw new Error(`Required launch content is stale: ${record.id}`);
      }
      if (record.status !== "published" || !record.audiences.includes("public")) {
        throw new Error(`Required launch content is not public: ${record.id}`);
      }
    }
  }

  for (const [groupId, group] of translationGroups) {
    const locales = new Set(group.map((record) => record.locale));
    const types = new Set(group.map((record) => record.type));
    const categories = new Set(group.map((record) => record.category));
    if (
      group.length !== 2 ||
      locales.size !== 2 ||
      !locales.has("es") ||
      !locales.has("en") ||
      types.size !== 1 ||
      categories.size !== 1
    ) {
      throw new Error(`Invalid translation pair: ${groupId}`);
    }
  }

  for (const record of records) {
    for (const relatedId of record.relatedIds) {
      if (!ids.has(relatedId)) throw new Error(`Unknown related knowledge ID: ${relatedId}`);
    }
  }
}

export function assertApprovedPublicSourceUrl(
  value: string,
  category?: HelpCategoryId,
  sourceKind?: KnowledgeSourceKind,
): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Public source URL must use an approved authority host");
  }
  const hostname = url.hostname.toLowerCase();
  const approvedAuthorityHost = [...APPROVED_PUBLIC_AUTHORITY_HOSTS].some(
    (root) => hostname === root || hostname.endsWith(`.${root}`),
  );
  const approvedCategoryHost =
    CATEGORY_SCOPED_SOURCE_HOSTS[category ?? "getting-started"]?.has(hostname);
  const categoryScopedHost = Object.values(CATEGORY_SCOPED_SOURCE_HOSTS).some((hosts) =>
    hosts?.has(hostname),
  );
  if (
    url.protocol !== "https:" ||
    (!approvedAuthorityHost && !approvedCategoryHost) ||
    url.username ||
    url.password ||
    url.port
  ) {
    if (url.protocol !== "https:") throw new Error("Public source URL must use HTTPS");
    if (categoryScopedHost && !approvedCategoryHost) {
      throw new Error(`Public source URL is not approved for category: ${category ?? "unknown"}`);
    }
    throw new Error("Public source URL must use an approved authority host");
  }
  const expectedKind: KnowledgeSourceKind = approvedCategoryHost ? "provider" : "government";
  if (sourceKind && sourceKind !== expectedKind) {
    throw new Error("Public source kind does not match approved host policy");
  }
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid ${field}: ${value}`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  return parsed;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
