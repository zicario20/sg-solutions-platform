import { describe, expect, it } from "vitest";
import {
  mapSanityPublicContent,
  SANITY_PUBLIC_CONTENT_PROJECTION,
} from "../../apps/www/src/integrations/sanity/public-content";

const at = new Date("2026-08-08T12:00:00.000Z");
const document = {
  _id: "help-guide-en",
  translationGroupId: "help-guide",
  locale: "en",
  type: "guide",
  category: "getting-started",
  slug: "safe-guide",
  title: "Safe guide",
  summary: "Public summary",
  blocks: [{ type: "paragraph", text: "Public guidance." }],
  keywords: ["guide"],
  audiences: ["public"],
  status: "published",
  version: 1,
  riskLevel: "low",
  reviewedAt: "2026-08-08",
  nextReviewAt: "2027-02-08",
  relatedIds: [],
  disclosure: "General information.",
  seoTitle: "Safe guide | SG Solutions",
  seoDescription: "Public summary from SG Solutions.",
  readingMinutes: 1,
  publishedAt: "2026-08-08",
  nextAction: "evaluation",
};

describe("M002 Sanity public-content boundary", () => {
  it("requires published, public and localized documents in the projection", () => {
    expect(SANITY_PUBLIC_CONTENT_PROJECTION).toContain('status == "published"');
    expect(SANITY_PUBLIC_CONTENT_PROJECTION).toContain('"public" in audiences');
    expect(SANITY_PUBLIC_CONTENT_PROJECTION).toContain('locale in ["es", "en"]');
    expect(SANITY_PUBLIC_CONTENT_PROJECTION).not.toMatch(
      /clientId|caseId|ssn|internalNotes|creditReport|payment/i,
    );
  });

  it("maps only the allowlisted public projection", () => {
    expect(mapSanityPublicContent(document, at)).toMatchObject({
      id: "help-guide-en",
      locale: "en",
      title: "Safe guide",
      blocks: [{ type: "paragraph", text: "Public guidance." }],
    });
  });

  it.each(["draft", "in_review", "archived"])("rejects %s content", (status) => {
    expect(mapSanityPublicContent({ ...document, status }, at)).toBeNull();
  });

  it("rejects a document without public audience or a supported locale", () => {
    expect(mapSanityPublicContent({ ...document, audiences: ["internal_staff"] }, at)).toBeNull();
    expect(() => mapSanityPublicContent({ ...document, locale: "fr" }, at)).toThrow(
      "Invalid public content locale",
    );
  });
});
