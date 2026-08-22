import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DASHBOARD_OWNER_CODES, type DashboardOwnerCode } from "@atlas/dashboard";
import { describe, expect, it } from "vitest";
import { createDashboardSsrAdmissionRequest, loadAdmittedClientDashboard } from "../../apps/app/src/lib/dashboard/ssr-admission.ts";
import type { DashboardHttpDependencies } from "../../apps/app/src/lib/dashboard/configured-runtime.ts";
import { dto } from "./fixtures.ts";

const origin = "https://portal.example.test";

describe("CN-002 SSR dashboard admission", () => {
  it("denies an arbitrary cookie before M007 or any owner is invoked", async () => {
    const counters = countersForQuery();
    const runtime = runtimeFor(counters, "rate_limited");
    const result = await loadAdmittedClientDashboard(
      { sessionHandle: "attacker-controlled-cookie", locale: "es" },
      runtime,
      createDashboardSsrAdmissionRequest(new Headers({ "x-forwarded-for": "203.0.113.8", cookie: "secret=ignored" }), origin),
    );
    expect(result).toEqual({ kind: "rate_limited" });
    expect(counters.admission).toBe(1);
    expect(counters.m007).toBe(0);
    expect([...counters.owners.values()].reduce((sum, value) => sum + value, 0)).toBe(0);
  });

  it("charges one SSR admission and invokes M007 and each owner once when admitted", async () => {
    const counters = countersForQuery();
    const result = await loadAdmittedClientDashboard(
      { sessionHandle: "server-validated-later", locale: "en" },
      runtimeFor(counters, "accepted"),
      createDashboardSsrAdmissionRequest(new Headers({ "x-real-ip": "198.51.100.9" }), origin),
    );
    expect(result.kind).toBe("ok");
    expect(counters.admission).toBe(1);
    expect(counters.m007).toBe(1);
    expect([...counters.owners.values()].every((value) => value === 1)).toBe(true);
  });

  it("routes every SSR loader through the common admitted boundary", () => {
    const page = readFileSync(join(process.cwd(), "apps", "app", "src", "app", "client", "page.tsx"), "utf8");
    const guard = readFileSync(join(process.cwd(), "apps", "app", "src", "lib", "dashboard", "page-context.ts"), "utf8");
    const admission = readFileSync(join(process.cwd(), "apps", "app", "src", "lib", "dashboard", "ssr-admission.ts"), "utf8");
    expect(page).toContain("loadAdmittedClientDashboard");
    expect(page).not.toMatch(/\bloadClientDashboard\s*\(/u);
    expect(guard).toContain("loadAdmittedClientDashboard");
    expect(admission).toContain('"dashboard_ssr"');
  });
});

function countersForQuery() {
  const owners = new Map<DashboardOwnerCode, number>();
  return { admission: 0, m007: 0, owners };
}

function runtimeFor(counters: ReturnType<typeof countersForQuery>, outcome: "accepted" | "rate_limited"): DashboardHttpDependencies {
  return {
    canonicalOrigin: origin,
    query: async () => { counters.m007 += 1; for (const code of DASHBOARD_OWNER_CODES) counters.owners.set(code, (counters.owners.get(code) ?? 0) + 1); return { kind: "ok", dto: dto() }; },
    selectContext: async () => ({ kind: "denied" }),
    verifyCsrf: () => false,
    admit: async (action) => { counters.admission += 1; expect(action).toBe("dashboard_ssr"); return outcome; },
  };
}
