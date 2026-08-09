import { describe, expect, it } from "vitest";
import type { PublicSearchDocument } from "../../apps/www/src/lib/help-search";
import {
  createHelpFeedbackEvent,
  getFeedbackUnavailableMessage,
} from "../../apps/www/src/scripts/help-feedback";
import { searchPublicHelpDocuments } from "../../apps/www/src/scripts/help-search";

const index: PublicSearchDocument[] = [
  {
    id: "faq-dti-es",
    locale: "es",
    type: "faq",
    category: "home-buying",
    title: "¿Qué es DTI?",
    summary: "Una explicación general.",
    path: "/recursos/preguntas-frecuentes/que-es-dti/",
    keywords: ["deuda", "vivienda"],
    reviewedAt: "2026-08-08",
    sourceKind: null,
  },
];

describe("M002 browser contracts", () => {
  it("searches the already-downloaded public index without creating a network request", () => {
    expect(searchPublicHelpDocuments(index, "dti", {})).toMatchObject([
      { id: "faq-dti-es", path: "/recursos/preguntas-frecuentes/que-es-dti/" },
    ]);
  });

  it("creates a minimized feedback event and an honest unavailable state", () => {
    expect(createHelpFeedbackEvent("resource-prepare-evaluation-es", "es", true)).toEqual({
      name: "help_feedback_selected",
      detail: { contentId: "resource-prepare-evaluation-es", locale: "es", helpful: true },
    });
    expect(getFeedbackUnavailableMessage("es")).toContain("no se envió");
    expect(JSON.stringify(createHelpFeedbackEvent("faq-example-en", "en", false))).not.toMatch(
      /query|email|url/i,
    );
  });
});
