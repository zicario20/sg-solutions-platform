import { OrganizationManagementWorkspaceView } from "@atlas/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("M019 organization management UI", () => {
  it("renders an accessible organization workspace without sensitive identifiers", () => {
    const html = renderToStaticMarkup(
      <OrganizationManagementWorkspaceView
        dto={{
          locale: "es",
          generatedAt: "2026-08-24T00:00:00.000Z",
          sections: [
            {
              section: "organization",
              title: "organization",
              state: "complete",
              items: [
                {
                  organizationRef: "org-r",
                  publicReference: "ORG-1028",
                  legalNameLabel: "Entidad autorizada",
                  state: "active",
                  stateLabel: "Activa",
                  evidenceState: "complete",
                },
              ],
            },
            {
              section: "relationships",
              title: "relationships",
              state: "complete",
              items: [
                {
                  relationshipRef: "org-rel",
                  roleLabel: "Representante",
                  scopeLabel: "Revision",
                  accessState: "review_required",
                  evidenceState: "complete",
                },
              ],
            },
            {
              section: "compliance",
              title: "compliance",
              state: "suppressed",
              safeReason: "policy_suppressed",
            },
            {
              section: "operations",
              title: "operations",
              state: "unavailable",
              safeReason: "source_unavailable",
            },
          ],
        }}
      />,
    );
    expect(html).toContain("GESTION DE ORGANIZACIONES");
    expect(html).toContain(
      "Las relaciones de propiedad y acceso requieren evidencia y revision autorizada.",
    );
    expect(html).toContain("prefers-reduced-motion");
    expect(html).not.toContain("12-3456789");
  });
});
