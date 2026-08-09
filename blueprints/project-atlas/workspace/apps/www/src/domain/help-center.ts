import type { Locale } from "./public-site";

export type KnowledgeStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "review_due"
  | "stale"
  | "unpublished"
  | "superseded"
  | "archived";

export type KnowledgeAudience =
  | "public"
  | "authenticated_client"
  | "internal_staff"
  | "ai_public"
  | "ai_internal";

export type KnowledgeType = "faq" | "article" | "guide" | "checklist" | "glossary" | "program";

export type HelpCategoryId =
  | "getting-started"
  | "account-access"
  | "payments"
  | "appointments"
  | "documents"
  | "credit"
  | "credit-monitoring"
  | "tradelines"
  | "taxes"
  | "business-formation"
  | "ein"
  | "business-funding"
  | "home-buying"
  | "marketplace"
  | "privacy-security"
  | "contact-support";

export type ContentRisk = "low" | "medium" | "high";
export type KnowledgeNextAction = "evaluation" | "quote";
export type KnowledgeSourceKind = "government" | "provider";

export type KnowledgeBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: Array<{ title: string; text: string }> }
  | { type: "callout"; tone: "info" | "caution"; title: string; text: string };

export interface KnowledgeSourceReference {
  title: string;
  authority: string;
  sourceKind: KnowledgeSourceKind;
  url: string;
  retrievedAt: string;
  effectiveDate?: string;
}

export interface KnowledgeRecord {
  id: string;
  translationGroupId: string;
  locale: Locale;
  type: KnowledgeType;
  category: HelpCategoryId;
  slug: string;
  title: string;
  summary: string;
  blocks: KnowledgeBlock[];
  keywords: string[];
  audiences: KnowledgeAudience[];
  status: KnowledgeStatus;
  version: number;
  riskLevel: ContentRisk;
  reviewedAt: string;
  nextReviewAt?: string;
  relatedIds: string[];
  disclosure: string;
  seoTitle: string;
  seoDescription: string;
  sources?: KnowledgeSourceReference[];
  jurisdiction?: string;
  readingMinutes?: number;
  publishedAt?: string;
  authorId?: string;
  reviewerId?: string;
  approverId?: string;
  nextAction: KnowledgeNextAction;
  requiredForLaunch?: boolean;
}

export type PublicKnowledgeRecord = Pick<
  KnowledgeRecord,
  | "id"
  | "translationGroupId"
  | "locale"
  | "type"
  | "category"
  | "slug"
  | "title"
  | "summary"
  | "blocks"
  | "keywords"
  | "version"
  | "riskLevel"
  | "reviewedAt"
  | "nextReviewAt"
  | "relatedIds"
  | "disclosure"
  | "seoTitle"
  | "seoDescription"
  | "sources"
  | "jurisdiction"
  | "readingMinutes"
  | "publishedAt"
  | "nextAction"
>;

export interface HelpContentFilters {
  category?: HelpCategoryId;
  type?: KnowledgeType;
}

export type ContentFreshness = "current" | "review_due" | "stale";
