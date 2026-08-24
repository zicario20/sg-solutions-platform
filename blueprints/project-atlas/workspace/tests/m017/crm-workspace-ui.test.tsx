import { CrmWorkspaceView } from "@atlas/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("M017 CRM workspace UI", () => {
  it("renders a bilingual, keyboard-navigable CRM surface without contact details", () => {
    const html = renderToStaticMarkup(
      <CrmWorkspaceView
        dto={{
          locale: "es",
          generatedAt: "2026-08-24T00:00:00.000Z",
          sections: [
            {
              section: "relationships",
              title: "relationships",
              state: "complete",
              items: [
                {
                  relationshipRef: "r1",
                  displayLabel: "Relacion autorizada",
                  purposeLabel: "Consulta",
                  leadHandoffState: "received",
                  evidenceState: "complete",
                },
              ],
            },
            {
              section: "pipeline",
              title: "pipeline",
              state: "complete",
              items: [
                {
                  opportunityRef: "o1",
                  displayLabel: "Evaluacion",
                  stage: "qualified",
                  stageLabel: "Calificada",
                  pipelineVersion: "1",
                  evidenceState: "complete",
                },
              ],
            },
            {
              section: "activities",
              title: "activities",
              state: "suppressed",
              safeReason: "policy_suppressed",
            },
            {
              section: "duplicates",
              title: "duplicates",
              state: "complete",
              items: [
                {
                  candidateRef: "d1",
                  relationshipRef: "r1",
                  candidateLabel: "Coincidencia",
                  matchBasis: "verified_email",
                  confidence: "review_required",
                  reviewOnly: true,
                },
              ],
            },
          ],
        }}
      />,
    );
    expect(html).toContain("OPERACIONES COMERCIALES");
    expect(html).toContain("Revision requerida. No se fusiona automaticamente.");
    expect(html).toContain("prefers-reduced-motion");
    expect(html).not.toContain("person@example.com");
  });
});
