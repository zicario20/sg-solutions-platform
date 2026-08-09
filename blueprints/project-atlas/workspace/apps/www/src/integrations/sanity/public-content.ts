import type {
  ContentRisk,
  HelpCategoryId,
  KnowledgeAudience,
  KnowledgeBlock,
  KnowledgeNextAction,
  KnowledgeRecord,
  KnowledgeSourceKind,
  KnowledgeSourceReference,
  KnowledgeStatus,
  KnowledgeType,
  PublicKnowledgeRecord,
} from "../../domain/help-center";
import type { Locale } from "../../domain/public-site";
import { assertApprovedPublicSourceUrl, toPublicKnowledge } from "../../lib/help-content";

export const SANITY_PUBLIC_CONTENT_PROJECTION = `
*[
  _type == "helpContent" &&
  status == "published" &&
  "public" in audiences &&
  locale in ["es", "en"]
]{
  "id": _id,
  translationGroupId,
  locale,
  type,
  category,
  "slug": slug.current,
  title,
  summary,
  blocks,
  keywords,
  audiences,
  status,
  version,
  riskLevel,
  reviewedAt,
  nextReviewAt,
  relatedIds,
  disclosure,
  seoTitle,
  seoDescription,
  sources[]{title, authority, sourceKind, url, retrievedAt, effectiveDate},
  jurisdiction,
  readingMinutes,
  publishedAt,
  authorId,
  reviewerId,
  approverId,
  nextAction
}
`;

export type SanityPublicContentDocument = Record<string, unknown>;

const FORBIDDEN_KEYS = new Set([
  "clientId",
  "caseId",
  "ssn",
  "ein",
  "tax",
  "creditReport",
  "document",
  "payment",
  "internalNotes",
]);
const STATUSES = new Set<KnowledgeStatus>([
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "review_due",
  "stale",
  "unpublished",
  "superseded",
  "archived",
]);
const TYPES = new Set<KnowledgeType>([
  "faq",
  "article",
  "guide",
  "checklist",
  "glossary",
  "program",
]);
const RISKS = new Set<ContentRisk>(["low", "medium", "high"]);
const SOURCE_KINDS = new Set<KnowledgeSourceKind>(["government", "provider"]);
const NEXT_ACTIONS = new Set<KnowledgeNextAction>(["evaluation", "quote"]);
const CATEGORIES = new Set<HelpCategoryId>([
  "getting-started",
  "account-access",
  "payments",
  "appointments",
  "documents",
  "credit",
  "credit-monitoring",
  "tradelines",
  "taxes",
  "business-formation",
  "ein",
  "business-funding",
  "home-buying",
  "marketplace",
  "privacy-security",
  "contact-support",
]);
const MAX_PUBLIC_STRING_LENGTH = 2_000;
const MAX_NESTING_DEPTH = 12;
const MAX_DOCUMENT_NODES = 500;

export function mapSanityPublicContent(
  document: SanityPublicContentDocument,
  at: Date,
): PublicKnowledgeRecord | null {
  rejectForbiddenFields(document, 0, { count: 0 });
  const locale = readLocale(document.locale);
  const status = readEnum(document.status, STATUSES, "status");
  const audiences = readStringArray(document.audiences, "audiences") as KnowledgeAudience[];
  if (status !== "published" || !audiences.includes("public")) return null;
  const category = readEnum(document.category, CATEGORIES, "category");

  const record: KnowledgeRecord = {
    id: readString(document._id ?? document.id, "id"),
    translationGroupId: readString(document.translationGroupId, "translationGroupId"),
    locale,
    type: readEnum(document.type, TYPES, "type"),
    category,
    slug: readSlug(document.slug),
    title: readSafeText(document.title, "title"),
    summary: readSafeText(document.summary, "summary"),
    blocks: readBlocks(document.blocks),
    keywords: readStringArray(document.keywords, "keywords"),
    audiences,
    status,
    version: readPositiveInteger(document.version, "version"),
    riskLevel: readEnum(document.riskLevel, RISKS, "riskLevel"),
    reviewedAt: readDate(document.reviewedAt, "reviewedAt"),
    nextReviewAt: readOptionalDate(document.nextReviewAt, "nextReviewAt"),
    relatedIds: readStringArray(document.relatedIds, "relatedIds"),
    disclosure: readSafeText(document.disclosure, "disclosure"),
    seoTitle: readSafeText(document.seoTitle, "seoTitle"),
    seoDescription: readSafeText(document.seoDescription, "seoDescription"),
    sources: readSources(document.sources, category),
    jurisdiction: readOptionalSafeText(document.jurisdiction, "jurisdiction"),
    readingMinutes: readOptionalPositiveInteger(document.readingMinutes, "readingMinutes"),
    publishedAt: readOptionalDate(document.publishedAt, "publishedAt"),
    authorId: readOptionalString(document.authorId, "authorId"),
    reviewerId: readOptionalString(document.reviewerId, "reviewerId"),
    approverId: readOptionalString(document.approverId, "approverId"),
    nextAction: readEnum(document.nextAction, NEXT_ACTIONS, "nextAction"),
  };
  return toPublicKnowledge(record, at);
}

function rejectForbiddenFields(value: unknown, depth: number, budget: { count: number }): void {
  if (depth > MAX_NESTING_DEPTH) throw new Error("Public content exceeds maximum nesting depth");
  budget.count += 1;
  if (budget.count > MAX_DOCUMENT_NODES)
    throw new Error("Public content exceeds maximum node count");
  if (Array.isArray(value)) {
    for (const item of value) rejectForbiddenFields(item, depth + 1, budget);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Forbidden public content field: ${key}`);
    rejectForbiddenFields(nested, depth + 1, budget);
  }
}

function readLocale(value: unknown): Locale {
  if (value !== "es" && value !== "en") throw new Error("Invalid public content locale");
  return value;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`Invalid public content ${field}`);
  if (value.length > MAX_PUBLIC_STRING_LENGTH) {
    throw new Error(`Public content ${field} exceeds maximum length`);
  }
  return value;
}

function readOptionalString(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : readString(value, field);
}

function readSlug(value: unknown): string {
  const slug = readString(value, "slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Invalid public content slug");
  }
  return slug;
}

function readSafeText(value: unknown, field: string): string {
  const text = readString(value, field);
  if (/<\/?[a-z][^>]*>/i.test(text)) throw new Error("Raw HTML is not accepted");
  return text;
}

function readOptionalSafeText(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : readSafeText(value, field);
}

function readStringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 64 ||
    !value.every((item) => typeof item === "string" && item.length <= MAX_PUBLIC_STRING_LENGTH)
  ) {
    throw new Error(`Invalid public content ${field}`);
  }
  return value;
}

function readEnum<T extends string>(value: unknown, values: Set<T>, field: string): T {
  if (typeof value !== "string" || !values.has(value as T))
    throw new Error(`Invalid public content ${field}`);
  return value as T;
}

function readPositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 1)
    throw new Error(`Invalid public content ${field}`);
  return value as number;
}

function readOptionalPositiveInteger(value: unknown, field: string): number | undefined {
  return value === undefined ? undefined : readPositiveInteger(value, field);
}

function readDate(value: unknown, field: string): string {
  const date = readString(value, field);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`Invalid public content ${field}`);
  }
  return date;
}

function readOptionalDate(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : readDate(value, field);
}

function readBlocks(value: unknown): KnowledgeBlock[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 64) {
    throw new Error("Invalid public content blocks");
  }
  return value.map((block) => {
    if (!block || typeof block !== "object") throw new Error("Invalid public content block");
    const input = block as Record<string, unknown>;
    if (input.type === "paragraph")
      return { type: "paragraph", text: readSafeText(input.text, "block text") };
    if (input.type === "list") {
      return {
        type: "list",
        items: readStringArray(input.items, "block items").map((item) =>
          readSafeText(item, "block item"),
        ),
      };
    }
    if (input.type === "steps" && Array.isArray(input.items)) {
      return {
        type: "steps",
        items: input.items.map((item) => {
          if (!item || typeof item !== "object") throw new Error("Invalid public content step");
          const step = item as Record<string, unknown>;
          return {
            title: readSafeText(step.title, "step title"),
            text: readSafeText(step.text, "step text"),
          };
        }),
      };
    }
    if (input.type === "callout" && (input.tone === "info" || input.tone === "caution")) {
      return {
        type: "callout",
        tone: input.tone,
        title: readSafeText(input.title, "callout title"),
        text: readSafeText(input.text, "callout text"),
      };
    }
    throw new Error("Invalid public content block");
  });
}

function readSources(
  value: unknown,
  category: HelpCategoryId,
): KnowledgeSourceReference[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 12) {
    throw new Error("Invalid public content sources");
  }
  return value.map((source) => {
    if (!source || typeof source !== "object") throw new Error("Invalid public content source");
    const input = source as Record<string, unknown>;
    const url = readString(input.url, "source URL");
    const sourceKind = readEnum(input.sourceKind, SOURCE_KINDS, "source kind");
    assertApprovedPublicSourceUrl(url, category, sourceKind);
    return {
      title: readSafeText(input.title, "source title"),
      authority: readSafeText(input.authority, "source authority"),
      sourceKind,
      url,
      retrievedAt: readDate(input.retrievedAt, "source retrievedAt"),
      effectiveDate: readOptionalDate(input.effectiveDate, "source effectiveDate"),
    };
  });
}
