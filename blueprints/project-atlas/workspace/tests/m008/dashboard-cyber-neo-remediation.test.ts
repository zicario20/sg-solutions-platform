import { readFileSync } from "node:fs";
import { join } from "node:path";
import { digestOpaqueProof } from "@atlas/auth";
import { createDashboardAuthorizationSnapshot } from "@atlas/dashboard";
import { describe, expect, it } from "vitest";
import { toSafeAuthSessionRows } from "../../apps/app/src/lib/auth/safe-session-rows.ts";
import { buildDashboardTrustedRateKeys } from "../../apps/app/src/lib/dashboard/dashboard-admission.ts";
import {
  dashboardAnalyticsPost,
  dashboardContextPost,
  dashboardGet,
} from "../../apps/app/src/lib/dashboard/http.ts";
import {
  createM007DashboardAuthPort,
  type M007DashboardAuthProjection,
  type M007DashboardAuthRepository,
} from "../../apps/app/src/lib/dashboard/m007-auth-adapter.ts";

const workspace = process.cwd();
const origin = "https://portal.example.test";
const validHandle = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("M008 Cyber Neo remediation", () => {
  it("requires the authoritative M007 page guard and denies forged or invalid evidence", async () => {
    for (const route of ["settings/account", "security"]) {
      const source = readFileSync(
        join(workspace, "apps", "app", "src", "app", "client", ...route.split("/"), "page.tsx"),
        "utf8",
      );
      expect(source).toContain("requirePrivateAuthPageContext");
      expect(source).not.toContain("readAuthPageContext");
    }

    const base = projection();
    await expect(pageAccess(base, "FORGED_FORGED_FORGED_FORGED_FORGED_FORGED_1")).resolves.toEqual({
      kind: "denied",
    });
    for (const invalid of [
      { ...base, idleExpiresAt: new Date(0) },
      { ...base, absoluteExpiresAt: new Date(0) },
      { ...base, sessionStatus: "revoked" },
      { ...base, sessionStatus: "risk_blocked" },
      { ...base, accountStatus: "suspended" },
      { ...base, partyLinkState: "revoked" },
      { ...base, authenticationEpoch: 0 },
      { ...base, authorizationEpoch: 0 },
      { ...base, policyEpoch: 0 },
    ] as M007DashboardAuthProjection[]) {
      await expect(pageAccess(invalid, validHandle)).resolves.toEqual({ kind: "denied" });
    }
    await expect(pageAccess(base, validHandle)).resolves.toEqual({
      kind: "authorized",
      locale: "es",
    });
  });

  it("rate-limits before aggregation and rejects oversized or unsupported bodies before parsing", async () => {
    let queries = 0;
    const base = {
      canonicalOrigin: origin,
      query: async () => {
        queries += 1;
        return { kind: "denied" as const };
      },
      selectContext: async () => ({ kind: "denied" as const }),
      verifyCsrf: () => true,
    };
    const getLimited = await dashboardGet(authRequest("/api/client/dashboard"), {
      ...base,
      admit: async (action: string) =>
        action === "dashboard_get" ? ("rate_limited" as const) : ("accepted" as const),
    });
    expect(getLimited.status).toBe(429);
    expect(queries).toBe(0);

    const contextLarge = await dashboardContextPost(
      authRequest(
        "/api/client/dashboard/context",
        "POST",
        "x".repeat(1025),
        "application/json",
        "1025",
      ),
      { ...base, admit: async () => "accepted" as const },
    );
    expect(contextLarge.status).toBe(413);
    const contextUnsupported = await dashboardContextPost(
      authRequest("/api/client/dashboard/context", "POST", "context=x", "multipart/form-data", "9"),
      { ...base, admit: async () => "accepted" as const },
    );
    expect(contextUnsupported.status).toBe(415);
    const analyticsLarge = await dashboardAnalyticsPost(
      authRequest(
        "/api/client/dashboard/analytics",
        "POST",
        "x".repeat(2049),
        "application/json",
        "2049",
      ),
      { ...base, admit: async () => "accepted" as const },
    );
    expect(analyticsLarge.status).toBe(413);
  });

  it("uses only explicitly trusted proxy network evidence and fails closed with zero keys", () => {
    const request = new Request(`${origin}/api/client/dashboard`, {
      headers: { "x-forwarded-for": "203.0.113.7", "x-real-ip": "198.51.100.4" },
    });
    expect(
      buildDashboardTrustedRateKeys(request, "dashboard_get", {
        hmacKey: "0123456789abcdef0123456789abcdef",
        trustProxy: false,
      }),
    ).toEqual([]);
    const trusted = buildDashboardTrustedRateKeys(request, "dashboard_get", {
      hmacKey: "0123456789abcdef0123456789abcdef",
      trustProxy: true,
    });
    expect(trusted).toHaveLength(1);
    expect(trusted[0]).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(trusted[0]).not.toContain("203.0.113.7");
  });

  it("hardens every M008 SECURITY DEFINER function and its grants", () => {
    const sql = readFileSync(
      join(workspace, "drizzle", "0036_m008_dashboard_auth_projection.sql"),
      "utf8",
    );
    expect(sql).toContain("SET search_path=pg_catalog");
    expect(sql).not.toMatch(/SET search_path\s*=\s*pg_catalog\s*,\s*public/iu);
    expect(sql).not.toMatch(
      /\b(?:FROM|JOIN|UPDATE|INSERT INTO|DELETE FROM|REFERENCES)\s+(?:auth_|client_)/iu,
    );
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.atlas_m008_dashboard_auth_projection");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.atlas_m008_dashboard_select_context");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.atlas_m008_dashboard_admit");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.atlas_m008_dashboard_admit");
    expect(sql).not.toMatch(/\bEXECUTE\s+(?:format|immediate)\b/iu);
  });

  it("never renders the internal auth session primary key", () => {
    const rows = toSafeAuthSessionRows(
      [{ id: "internal-session-primary-key", current: true, createdAtLabel: "Today" }],
      "Session",
    );
    expect(JSON.stringify(rows)).not.toContain("internal-session-primary-key");
    const view = readFileSync(
      join(workspace, "packages", "ui", "src", "auth", "AuthPortalViews.tsx"),
      "utf8",
    );
    expect(view).not.toMatch(/session\.id|\{session\.id\}/u);
    expect(view).toContain("session.label");
    const authHttp = readFileSync(
      join(workspace, "apps", "app", "src", "lib", "auth", "http.ts"),
      "utf8",
    );
    expect(authHttp).not.toContain("{ sessions: await adapter.sessions.list(handle) }");
    expect(authHttp).toContain("displayRef: `session-${index + 1}`");
  });
});

function projection(): M007DashboardAuthProjection {
  return {
    sessionId: "session-id",
    accountId: "account-id",
    sessionFamilyId: "family-id",
    sessionStatus: "active",
    accountStatus: "active",
    assurance: "aal1",
    idleExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
    absoluteExpiresAt: new Date("2099-01-02T00:00:00.000Z"),
    authenticationEpoch: 1,
    authorizationEpoch: 1,
    policyEpoch: 1,
    partyLinkState: "active",
    partyLinkVersion: 1,
    organizations: [],
  };
}

async function pageAccess(value: M007DashboardAuthProjection, handle: string) {
  const repository: M007DashboardAuthRepository = {
    loadBySessionHandleDigest: async (digest) =>
      digest === digestOpaqueProof(validHandle) ? value : undefined,
    loadBySessionId: async () => value,
    persistPreferredContext: async () => true,
  };
  const decision = await createDashboardAuthorizationSnapshot(
    { sessionHandle: handle, locale: "es" },
    createM007DashboardAuthPort(repository, "0123456789abcdef0123456789abcdef"),
  );
  return decision.kind === "authorized"
    ? { kind: "authorized" as const, locale: decision.snapshot.locale }
    : { kind: "denied" as const };
}

function authRequest(
  path: string,
  method = "GET",
  body?: string,
  contentType?: string,
  contentLength?: string,
): Request {
  const headers = new Headers({
    cookie: `__Host-atlas_auth=${validHandle}; __Host-atlas_csrf=csrf`,
    origin,
    "x-atlas-csrf": "csrf",
  });
  if (contentType) headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);
  return new Request(`${origin}${path}`, { method, headers, body });
}
