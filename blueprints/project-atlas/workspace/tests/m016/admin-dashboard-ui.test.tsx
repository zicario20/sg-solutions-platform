import { AdminDashboardView } from "@atlas/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("M016 administrative dashboard UI", () => {
  it("renders an accessible bilingual operations surface without customer PII", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView
        dto={{
          locale: "es",
          generatedAt: "2026-08-24T00:00:00.000Z",
          widgets: [
            {
              code: "priority_work",
              title: "priorityWork",
              state: "complete",
              data: {
                items: [
                  {
                    opaqueRef: "opaque",
                    title: "Revisar aprobación",
                    category: "Cumplimiento",
                    severity: "high",
                    destination: "approvals",
                    priorityScore: 400,
                  },
                ],
              },
            },
            {
              code: "integrations",
              title: "integrations",
              state: "complete",
              data: { integrations: [{ code: "calendar", label: "Calendar", state: "unknown" }] },
            },
          ],
        }}
      />,
    );
    expect(html).toContain("Centro de operaciones");
    expect(html).toContain("Navegación administrativa");
    expect(html).toContain("Revisar aprobación");
    expect(html).not.toContain("person@example.com");
    expect(html).toContain("prefers-reduced-motion");
  });
});
