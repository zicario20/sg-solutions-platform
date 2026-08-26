import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getClientServicesCopy } from "../../packages/i18n/src/client-services";
import { ClientServicesDirectory } from "../../packages/ui/src/client-services/ClientServicesDirectory";
import { syntheticM009Card } from "./fixtures";

describe("M009 directory UI", () => {
  it("renders accessible search and opaque links", () => {
    const item = syntheticM009Card(),
      html = renderToStaticMarkup(
        <ClientServicesDirectory locale="es" state="ready" context={item.context} items={[item]} />,
      );
    expect(html).toContain('method="get"');
    expect(html).toContain('aria-label="Buscar servicios"');
    expect(html).toContain(`/client/services/${item.opaqueRef}`);
    expect(html).not.toContain("internalResourceId");
  });
  it("has ES/EN parity", () => {
    expect(getClientServicesCopy("es").title).toBe("Mis servicios");
    expect(getClientServicesCopy("en").title).toBe("My services");
  });
});
