import { describe, expect, it } from "vitest";
import { mapSanityPublicContent } from "../../apps/www/src/integrations/sanity/public-content";

const base = {
  _id: "help-program-en",
  translationGroupId: "help-program",
  locale: "en",
  type: "program",
  category: "home-buying",
  slug: "program-overview",
  title: "Program overview",
  summary: "General public information.",
  blocks: [{ type: "paragraph", text: "Review current official requirements." }],
  keywords: ["program"],
  audiences: ["public"],
  status: "published",
  version: 1,
  riskLevel: "medium",
  reviewedAt: "2026-08-08",
  nextReviewAt: "2026-09-08",
  relatedIds: [],
  disclosure: "Eligibility depends on official requirements.",
  seoTitle: "Program overview | SG Solutions",
  seoDescription: "General program information.",
  jurisdiction: "United States",
  authorId: "editorial-author",
  reviewerId: "domain-reviewer",
  approverId: "product-owner-decision",
  nextAction: "evaluation",
  sources: [
    {
      title: "Official program page",
      authority: "USDA Rural Development",
      sourceKind: "government",
      url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs",
      retrievedAt: "2026-08-08",
    },
  ],
};

describe("M002 public-content security", () => {
  it.each([
    "clientId",
    "caseId",
    "ssn",
    "ein",
    "tax",
    "creditReport",
    "document",
    "payment",
    "internalNotes",
  ])("rejects forbidden operational key %s", (key) => {
    expect(() =>
      mapSanityPublicContent({ ...base, [key]: "private" }, new Date("2026-08-08")),
    ).toThrow(`Forbidden public content field: ${key}`);
  });

  it("rejects raw HTML and active markup in public copy", () => {
    expect(() =>
      mapSanityPublicContent(
        { ...base, blocks: [{ type: "paragraph", text: "<script>alert(1)</script>" }] },
        new Date("2026-08-08"),
      ),
    ).toThrow("Raw HTML is not accepted");
  });

  it("rejects non-HTTPS source URLs", () => {
    expect(() =>
      mapSanityPublicContent(
        { ...base, sources: [{ ...base.sources[0], url: "http://www.rd.usda.gov/program" }] },
        new Date("2026-08-08"),
      ),
    ).toThrow("Public source URL must use HTTPS");
  });

  it.each([
    "https://evil.example/program",
    "https://irs.gov.evil.example/program",
    "https://user:password@www.rd.usda.gov/program",
    "https://127.0.0.1/program",
  ])("rejects an unapproved official-source URL %s", (url) => {
    expect(() =>
      mapSanityPublicContent(
        { ...base, sources: [{ ...base.sources[0], url }] },
        new Date("2026-08-08"),
      ),
    ).toThrow("approved authority host");
  });

  it("limits the Product Owner-approved Tradeline Supply source to Tradelines content", () => {
    const source = {
      ...base.sources[0],
      authority: "Tradeline Supply Company, LLC",
      sourceKind: "provider",
      url: "https://tradelinesupply.com/faq/",
    };
    expect(
      mapSanityPublicContent(
        { ...base, type: "faq", category: "tradelines", sources: [source] },
        new Date("2026-08-08"),
      ),
    ).not.toBeNull();
    expect(() =>
      mapSanityPublicContent({ ...base, sources: [source] }, new Date("2026-08-08")),
    ).toThrow("not approved for category");
    expect(() =>
      mapSanityPublicContent(
        {
          ...base,
          type: "faq",
          category: "tradelines",
          sources: [{ ...source, url: "https://tradelinesupply.com.evil.example/faq/" }],
        },
        new Date("2026-08-08"),
      ),
    ).toThrow("approved authority host");
    expect(() =>
      mapSanityPublicContent(
        {
          ...base,
          type: "faq",
          category: "tradelines",
          sources: [{ ...source, url: "https://promo.tradelinesupply.com/faq/" }],
        },
        new Date("2026-08-08"),
      ),
    ).toThrow("approved authority host");
  });

  it("binds source kind to the approved host policy", () => {
    const providerSource = {
      ...base.sources[0],
      authority: "Tradeline Supply Company, LLC",
      sourceKind: "provider",
      url: "https://tradelinesupply.com/faq/",
    };
    expect(() =>
      mapSanityPublicContent(
        {
          ...base,
          type: "faq",
          category: "tradelines",
          sources: [{ ...providerSource, sourceKind: "government" }],
        },
        new Date("2026-08-08"),
      ),
    ).toThrow("source kind does not match");
    expect(() =>
      mapSanityPublicContent(
        {
          ...base,
          sources: [{ ...base.sources[0], sourceKind: "provider" }],
        },
        new Date("2026-08-08"),
      ),
    ).toThrow("source kind does not match");
  });

  it.each(["sources", "jurisdiction", "nextReviewAt", "authorId", "reviewerId", "approverId"])(
    "rejects published medium-risk content without %s",
    (field) => {
      const candidate = { ...base } as Record<string, unknown>;
      delete candidate[field];
      expect(() => mapSanityPublicContent(candidate, new Date("2026-08-08"))).toThrow(
        "Published medium/high-risk content requires",
      );
    },
  );

  it.each([
    ["category", "unknown-category"],
    ["slug", "../unsafe"],
    ["slug", "UPPERCASE"],
  ])("rejects invalid %s values", (field, value) => {
    expect(() =>
      mapSanityPublicContent({ ...base, [field]: value }, new Date("2026-08-08")),
    ).toThrow(`Invalid public content ${field}`);
  });

  it("rejects oversized and deeply nested CMS payloads without overflowing", () => {
    expect(() =>
      mapSanityPublicContent({ ...base, title: "x".repeat(2_001) }, new Date("2026-08-08")),
    ).toThrow("exceeds maximum length");

    let nested: Record<string, unknown> = {};
    for (let index = 0; index < 20; index += 1) nested = { child: nested };
    expect(() =>
      mapSanityPublicContent({ ...base, extension: nested }, new Date("2026-08-08")),
    ).toThrow("maximum nesting depth");
  });
});
