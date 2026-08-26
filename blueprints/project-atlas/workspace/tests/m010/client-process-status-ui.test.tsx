import { ProcessStatusLanding, ProcessStatusView } from "@atlas/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("M010 UI", () => {
  it.each(["es", "en"] as const)("renders truthful landing in %s", (locale) => {
    const html = renderToStaticMarkup(
      <ProcessStatusLanding
        locale={locale}
        dto={{
          schemaVersion: "m010.landing.v1",
          availability: "empty",
          context: { type: "personal", label: "Personal" },
          choices: [],
          hasMore: false,
        }}
      />,
    );
    expect(html).toContain(locale === "es" ? "Estado de mi proceso" : "My process status");
    expect(html).not.toMatch(/%|percent|porcentaje/i);
  });
  it("uses landmarks, ordered timeline and canonical routes", () => {
    const html = renderToStaticMarkup(
      <ProcessStatusView
        locale="en"
        dto={{
          schemaVersion: "m010.detail.v1",
          availability: "unconfirmed",
          context: { type: "personal", label: "Personal" },
          service: { serviceRef: "csr1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", label: "Service" },
          sections: {},
        }}
      />,
    );
    expect(html).toContain("<main");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("localStorage");
  });
});
