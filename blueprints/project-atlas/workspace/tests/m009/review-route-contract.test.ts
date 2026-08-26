import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ClientServicesQueryService } from "@atlas/client-services";
import { describe, expect, it, vi } from "vitest";
import { loadClientServicesPage } from "../../apps/app/src/lib/client-services/page-context.ts";
import { M009_TEST_NOW, syntheticM009Root, syntheticM009Snapshot } from "./fixtures.ts";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "../..", path), "utf8");
describe("M009 bilingual context and route boundaries", () => {
  it("derives locale/context server-side and renders real list/detail outcomes", () => {
    for (const path of [
      "apps/app/src/app/client/services/page.tsx",
      "apps/app/src/app/client/services/[serviceRef]/page.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain("atlas_locale");
      expect(source).toContain("loadClientServicesPage");
      expect(source).not.toContain('contextType="individual"');
    }
    expect(read("apps/app/src/app/client/services/loading.tsx")).toContain("atlas_locale");
    expect(read("apps/app/src/app/client/services/[serviceRef]/loading.tsx")).toContain(
      "atlas_locale",
    );
  });
  it("forwards normalized SSR filters to the authoritative query", async () => {
    const list = vi.fn().mockResolvedValue({
      kind: "ok",
      dto: {
        schemaVersion: "m009.list.v2",
        context: { type: "personal", label: "Personal" },
        items: [],
      },
    });
    await loadClientServicesPage(
      new Request("https://atlas.test/client/services?q=tax&status=completed"),
      { admit: vi.fn().mockResolvedValue(true), query: { list } } as never,
    );
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ query: "tax", status: "completed", limit: 24 }),
    );
  });
  it("removes nonmatching SSR items and localizes an empty organization context", async () => {
    const snapshot = { ...syntheticM009Snapshot, locale: "es", contextOptions: [] } as never,
      query = new ClientServicesQueryService({
        auth: {
          authorize: vi.fn().mockResolvedValue({ kind: "authorized", snapshot }),
          revalidate: vi.fn().mockResolvedValue(true),
        },
        source: {
          list: vi.fn().mockResolvedValue({
            state: "fresh",
            generatedAt: M009_TEST_NOW,
            items: [syntheticM009Root()],
          }),
          detail: vi.fn(),
          verifyFinalFence: vi.fn().mockResolvedValue(true),
        },
        sections: {},
        now: () => M009_TEST_NOW,
      });
    const filtered = await query.list({ request: {}, query: "no-coincide" });
    expect(filtered.kind).toBe("ok");
    if (filtered.kind === "ok") {
      expect(filtered.dto.items).toHaveLength(0);
      expect(filtered.dto.context.label).toBe("Organización");
    }
  });
  it("ships responsive focus, contrast and reduced-motion rules outside inline style", () => {
    const css = read("packages/ui/src/client-services/ClientServices.module.css"),
      directory = read("packages/ui/src/client-services/ClientServicesDirectory.tsx");
    expect(css).toMatch(/max-width:\s*720px/u);
    expect(css).toContain(":focus-visible");
    expect(css).toContain("forced-colors");
    expect(css).toContain("prefers-reduced-motion");
    expect(directory).not.toContain("<style>");
  });
});
