import { describe, expect, it } from "vitest";
import {
  configuredDashboardOwnerStates,
  type DashboardHttpDependencies,
} from "../../apps/app/src/lib/dashboard/configured-runtime.ts";
import { dashboardContextPost, dashboardGet } from "../../apps/app/src/lib/dashboard/http.ts";
import { dto } from "./fixtures.ts";

const origin = "https://portal.example.test";

const deniedDependencies: DashboardHttpDependencies = {
  canonicalOrigin: origin,
  query: async () => ({ kind: "denied" }),
  selectContext: async () => ({ kind: "denied" }),
  verifyCsrf: () => false,
  admit: async () => "accepted",
};

describe("M008 fail-closed HTTP", () => {
  it("returns 401 without an application session", async () => {
    const response = await dashboardGet(
      new Request(`${origin}/api/client/dashboard`),
      deniedDependencies,
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ kind: "denied" });
  });

  it("sets private no-store on configured responses", async () => {
    const response = await dashboardGet(
      new Request(`${origin}/api/client/dashboard`, {
        headers: { cookie: "__Host-atlas_auth=opaque-session" },
      }),
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
  });

  it("rejects context changes from another origin before CSRF verification", async () => {
    let csrfChecked = false;
    const response = await dashboardContextPost(
      new Request(`${origin}/api/client/dashboard/context`, {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "content-type": "application/json",
          cookie: "__Host-atlas_auth=opaque-session; __Host-atlas_csrf=token",
          "x-atlas-csrf": "token",
        },
        body: JSON.stringify({ context: "context-a" }),
      }),
      {
        ...deniedDependencies,
        verifyCsrf: () => {
          csrfChecked = true;
          return true;
        },
      },
    );
    expect(response.status).toBe(403);
    expect(csrfChecked).toBe(false);
  });

  it("accepts a same-origin context form only after CSRF and owner authorization", async () => {
    const body = new URLSearchParams({ context: "context-b", csrf: "csrf-token" });
    const response = await dashboardContextPost(
      new Request(`${origin}/api/client/dashboard/context`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/x-www-form-urlencoded",
          cookie: "__Host-atlas_auth=opaque-session; __Host-atlas_csrf=csrf-token",
        },
        body,
      }),
      {
        ...deniedDependencies,
        verifyCsrf: (session, token) => session === "opaque-session" && token === "csrf-token",
        selectContext: async ({ requestedContext }) =>
          requestedContext === "context-b"
            ? { kind: "selected", contextHandle: "opaque-selected-context" }
            : { kind: "denied" },
        query: async () => ({ kind: "ok", dto: dto() }),
      },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/client");
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-atlas_context=opaque-selected-context",
    );
  });

  it("keeps provider-disabled owner ports unavailable", () => {
    expect(configuredDashboardOwnerStates()).toMatchObject({
      payments: "unavailable",
      appointments: "unavailable",
    });
  });
});
