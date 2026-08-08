import { describe, expect, it } from "vitest";
import type { KnowledgeRecord } from "../../apps/www/src/domain/help-center";
import {
  evaluateFreshness,
  getPublishedKnowledgeBySlug,
  listPublishedKnowledge,
  toPublicKnowledge,
} from "../../apps/www/src/lib/help-content";

const at = new Date("2026-08-08T12:00:00.000Z");

function record(overrides: Partial<KnowledgeRecord> = {}): KnowledgeRecord {
  return {
    id: "faq-getting-started-es",
    translationGroupId: "faq-getting-started",
    locale: "es",
    type: "faq",
    category: "getting-started",
    slug: "como-comenzar",
    title: "¿Cómo comienzo?",
    summary: "Comienza con una evaluación para aclarar alcance y próximos pasos.",
    blocks: [{ type: "paragraph", text: "Explora los servicios y agenda una evaluación." }],
    keywords: ["comenzar", "evaluación"],
    audiences: ["public", "ai_public"],
    status: "published",
    version: 1,
    riskLevel: "low",
    reviewedAt: "2026-08-01",
    nextReviewAt: "2027-02-01",
    relatedIds: [],
    disclosure: "La evaluación no garantiza un resultado específico.",
    seoTitle: "Cómo comenzar | SG Solutions",
    seoDescription: "Conoce cómo comenzar con SG Solutions y qué esperar del primer paso.",
    ...overrides,
  };
}

describe("M002 public content gate", () => {
  it("projects only allowlisted fields from a current public record", () => {
    const result = toPublicKnowledge(
      record({
        authorId: "owner-internal-id",
        reviewerId: "reviewer-internal-id",
        approverId: "approver-internal-id",
      }),
      at,
    );

    expect(result).toMatchObject({
      id: "faq-getting-started-es",
      locale: "es",
      type: "faq",
      title: "¿Cómo comienzo?",
    });
    expect(result).not.toHaveProperty("authorId");
    expect(result).not.toHaveProperty("reviewerId");
    expect(result).not.toHaveProperty("approverId");
  });

  it.each([
    ["draft", record({ status: "draft" })],
    ["internal", record({ audiences: ["internal_staff"] })],
    ["archived", record({ status: "archived" })],
  ])("rejects a %s record from the public projection", (_label, candidate) => {
    expect(toPublicKnowledge(candidate, at)).toBeNull();
  });

  it("suppresses stale medium and high risk records while allowing dated low-risk guidance", () => {
    const staleMedium = record({
      id: "medium",
      riskLevel: "medium",
      nextReviewAt: "2026-07-01",
    });
    const staleLow = record({ id: "low", riskLevel: "low", nextReviewAt: "2026-07-01" });

    expect(evaluateFreshness(staleMedium, at)).toBe("stale");
    expect(toPublicKnowledge(staleMedium, at)).toBeNull();
    expect(evaluateFreshness(staleLow, at)).toBe("review_due");
    expect(toPublicKnowledge(staleLow, at)?.id).toBe("low");
  });

  it("filters published records by locale, category and type", () => {
    const records = [
      record(),
      record({ id: "payments", category: "payments", slug: "como-pago" }),
      record({ id: "guide", type: "guide", slug: "preparar-evaluacion" }),
      record({ id: "english", locale: "en", slug: "how-to-start" }),
    ];

    expect(listPublishedKnowledge(records, "es", { category: "payments" }, at)).toHaveLength(1);
    expect(listPublishedKnowledge(records, "es", { type: "guide" }, at)).toHaveLength(1);
    expect(listPublishedKnowledge(records, "en", {}, at).map((item) => item.id)).toEqual(["english"]);
  });

  it("returns a published slug only within its requested locale and collection", () => {
    const records = [record(), record({ id: "draft", status: "draft", slug: "oculto" })];

    expect(getPublishedKnowledgeBySlug(records, "es", "faq", "como-comenzar", at)?.id).toBe(
      "faq-getting-started-es",
    );
    expect(getPublishedKnowledgeBySlug(records, "en", "faq", "como-comenzar", at)).toBeNull();
    expect(getPublishedKnowledgeBySlug(records, "es", "faq", "oculto", at)).toBeNull();
  });
});
