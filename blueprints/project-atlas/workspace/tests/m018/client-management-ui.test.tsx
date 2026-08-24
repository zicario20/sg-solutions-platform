import { ClientManagementWorkspaceView } from "@atlas/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("M018 client management UI", () => {
  it("renders an accessible Client 360 surface without client contact details", () => {
    const html = renderToStaticMarkup(
      <ClientManagementWorkspaceView
        dto={{
          locale: "en",
          generatedAt: "2026-08-24T00:00:00.000Z",
          sections: [
            {
              section: "relationship",
              title: "relationship",
              state: "complete",
              items: [
                {
                  clientRelationshipRef: "client-r",
                  publicReference: "CL-1028",
                  state: "active",
                  stateLabel: "Active",
                  clientTypeLabel: "Individual",
                  evidenceState: "complete",
                },
              ],
            },
            {
              section: "onboarding",
              title: "onboarding",
              state: "suppressed",
              safeReason: "policy_suppressed",
            },
            {
              section: "representatives",
              title: "representatives",
              state: "complete",
              items: [
                {
                  representativeRef: "person-r",
                  displayLabel: "Authorized representative",
                  state: "pending_approval",
                  scopeLabel: "Review",
                  reviewRequired: true,
                  evidenceState: "complete",
                },
              ],
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
    expect(html).toContain("CLIENT MANAGEMENT");
    expect(html).toContain("An invitation grants no access until approval and activation.");
    expect(html).toContain("prefers-reduced-motion");
    expect(html).not.toContain("person@example.com");
  });
});
