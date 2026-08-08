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
  sources: [
    {
      title: "Official program page",
      authority: "Agency",
      url: "https://example.gov/program",
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
    expect(() => mapSanityPublicContent({ ...base, [key]: "private" }, new Date("2026-08-08"))).toThrow(
      `Forbidden public content field: ${key}`,
    );
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
        { ...base, sources: [{ ...base.sources[0], url: "http://example.gov/program" }] },
        new Date("2026-08-08"),
      ),
    ).toThrow("Public source URL must use HTTPS");
  });
});
