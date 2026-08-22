import {
  DisabledDashboardCache,
  buildDashboardCacheKey,
  isDashboardSectionCacheable,
  type DashboardAuthorizationSnapshot,
} from "@atlas/dashboard";
import { recordDashboardEvent } from "@atlas/observability";
import { describe, expect, it } from "vitest";

const snapshot = (changes: Partial<DashboardAuthorizationSnapshot> = {}): DashboardAuthorizationSnapshot => ({
  accountId: "account-private-a",
  sessionFamilyId: "family-private-a",
  userId: "user-private-a",
  context: { type: "personal", opaqueRef: "context-private-a" },
  membershipFence: "membership-1",
  resourceGrantFence: "grant-1",
  entitlementFence: "entitlement-1",
  policyVersion: "policy-1",
  locale: "es",
  capturedAt: new Date("2026-08-21T12:00:00.000Z"),
  ...changes,
});

describe("M008 cache and observability privacy", () => {
  it("always bypasses critical dashboard sections", () => {
    for (const section of ["security", "priority", "payments", "tasks", "documents", "appointments"] as const) {
      expect(isDashboardSectionCacheable(section)).toBe(false);
    }
    expect(isDashboardSectionCacheable("help")).toBe(true);
  });

  it("segments future cache keys by every authorization boundary without plaintext IDs", () => {
    const first = buildDashboardCacheKey(snapshot(), "help");
    for (const changed of [
      snapshot({ sessionFamilyId: "family-private-b" }),
      snapshot({ userId: "user-private-b" }),
      snapshot({ context: { type: "organization", opaqueRef: "context-private-b" } }),
      snapshot({ membershipFence: "membership-2" }),
      snapshot({ resourceGrantFence: "grant-2" }),
      snapshot({ entitlementFence: "entitlement-2" }),
      snapshot({ policyVersion: "policy-2" }),
      snapshot({ locale: "en" }),
    ]) expect(buildDashboardCacheKey(changed, "help")).not.toBe(first);
    expect(first).not.toMatch(/account-private|family-private|user-private|context-private/);
  });

  it("keeps the release cache disabled", async () => {
    const cache = new DisabledDashboardCache();
    await cache.set("key", { private: true });
    await expect(cache.get("key")).resolves.toBeUndefined();
  });

  it("drops PII, amounts and unapproved analytics fields", () => {
    expect(recordDashboardEvent("client_dashboard_viewed", {
      locale: "es",
      email: "x@example.com",
      amount: 500,
      organizationName: "Private org",
    })).toEqual({ event: "client_dashboard_viewed", properties: { locale: "es" } });
  });
});
