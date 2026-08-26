import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardCacheEnvelope,
  canServeDashboardCacheEnvelope,
  createDashboardAuthorizationSnapshot,
  DASHBOARD_CACHE_SCHEMA_VERSION,
  type DashboardAuthorizationSnapshot,
  parseDashboardFragment,
} from "@atlas/dashboard";
import { DASHBOARD_EVENT_NAMES, recordDashboardEvent } from "@atlas/observability";
import { ClientPortalShell, DashboardView } from "@atlas/ui";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { resolveDashboardLocale } from "../../apps/app/src/lib/dashboard/locale.ts";
import {
  createM007DashboardAuthPort,
  type M007DashboardAuthProjection,
  type M007DashboardAuthRepository,
} from "../../apps/app/src/lib/dashboard/m007-auth-adapter.ts";
import { dto, snapshot } from "./fixtures.ts";

const workspace = process.cwd();

function activeProjection(): M007DashboardAuthProjection {
  const now = Date.now();
  return {
    sessionId: "session-server-id",
    accountId: "account-server-id",
    sessionFamilyId: "family-server-id",
    sessionStatus: "active",
    accountStatus: "active",
    assurance: "aal1",
    idleExpiresAt: new Date(now + 60_000),
    absoluteExpiresAt: new Date(now + 120_000),
    authenticationEpoch: 7,
    authorizationEpoch: 11,
    policyEpoch: 13,
    partyLinkState: "active",
    partyLinkVersion: 3,
    organizations: [
      { organizationId: "org-internal", membershipVersion: 5, entitlementVersion: 8 },
    ],
    preferredOrganizationId: "org-internal",
  };
}

function repository(projection = activeProjection(), persist = true): M007DashboardAuthRepository {
  return {
    loadBySessionHandleDigest: async () => projection,
    loadBySessionId: async () => projection,
    persistPreferredContext: async () => persist,
  };
}

describe("M008 architecture review remediation", () => {
  it("derives authorization and context choices from an active M007 server session", async () => {
    const port = createM007DashboardAuthPort(repository(), "0123456789abcdef0123456789abcdef");
    const result = await createDashboardAuthorizationSnapshot(
      { sessionHandle: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", locale: "en" },
      port,
    );
    expect(result.kind).toBe("authorized");
    if (result.kind !== "authorized") return;
    expect(result.snapshot.accountStatus).toBe("active");
    expect(result.snapshot.authenticationEpoch).toBe("7");
    expect(result.snapshot.contextOptions).toHaveLength(2);
    expect(result.snapshot.context.opaqueRef).not.toContain("org-internal");
    expect(JSON.stringify(result.snapshot.contextOptions)).not.toContain("account-server-id");
  });

  it("denies inactive, expired, and revoked M007 evidence", async () => {
    const base = activeProjection();
    for (const projection of [
      { ...base, accountStatus: "suspended" as const },
      { ...base, idleExpiresAt: new Date(0) },
      { ...base, partyLinkState: "revoked" as const },
    ]) {
      const port = createM007DashboardAuthPort(
        repository(projection),
        "0123456789abcdef0123456789abcdef",
      );
      await expect(
        createDashboardAuthorizationSnapshot(
          { sessionHandle: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", locale: "es" },
          port,
        ),
      ).resolves.toEqual({ kind: "denied" });
    }
  });

  it("persists only a reauthorized context and denies a revoked membership", async () => {
    const port = createM007DashboardAuthPort(repository(), "0123456789abcdef0123456789abcdef");
    const first = await createDashboardAuthorizationSnapshot(
      { sessionHandle: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", locale: "en" },
      port,
    );
    if (first.kind !== "authorized") throw new Error("expected_authorized");
    const organization = first.snapshot.contextOptions.find(
      (option) => option.type === "organization",
    );
    expect(organization).toBeDefined();
    await expect(
      port.selectContext({
        sessionHandle: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        requestedContext: organization?.opaqueRef,
        now: new Date(),
      }),
    ).resolves.toMatchObject({ kind: "selected" });
    const revokedPort = createM007DashboardAuthPort(
      repository({ ...activeProjection(), organizations: [] }),
      "0123456789abcdef0123456789abcdef",
    );
    await expect(
      revokedPort.selectContext({
        sessionHandle: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        requestedContext: organization?.opaqueRef,
        now: new Date(),
      }),
    ).resolves.toEqual({ kind: "denied" });
  });

  it("keeps manifests and workspace lockfile importers synchronized", () => {
    const lock = readFileSync(join(workspace, "pnpm-lock.yaml"), "utf8");
    expect(lock).toContain("  packages/dashboard: {}");
    expect(lock).toMatch(
      /apps\/app:[\s\S]*?'@atlas\/dashboard':[\s\S]*?link:\.\.\/\.\.\/packages\/dashboard/u,
    );
    expect(lock).toMatch(
      /apps\/app:[\s\S]*?'@atlas\/observability':[\s\S]*?link:\.\.\/\.\.\/packages\/observability/u,
    );
  });

  it("accepts minimized public fields for every approved operational widget", () => {
    const fragment = parseDashboardFragment({
      owner: "services",
      snapshotId: "snapshot",
      sourceVersion: "services.v2",
      classification: "client_safe",
      state: "fresh",
      asOf: "2026-08-21T12:00:00.000Z",
      data: [
        {
          opaqueRef: "service-opaque",
          title: "Tax preparation",
          publicState: "in_progress",
          statusLabel: "In progress",
          milestoneLabels: ["Intake", "Review"],
          nextStepLabel: "Upload documents",
          startDate: "2026-08-20",
          pendingTaskCount: 2,
          documentSummaryLabel: "1 requested",
          paymentSummaryLabel: "Unavailable",
          cta: { label: "View service", routeKey: "services" },
          routeKey: "services",
        },
      ],
    });
    expect(fragment.data).toMatchObject([{ publicState: "in_progress", pendingTaskCount: 2 }]);
    expect(JSON.stringify(fragment)).not.toMatch(/caseId|providerId|email|storageKey/u);
  });

  it("publishes route parity and safe mobile disclosure navigation", () => {
    const html = renderToStaticMarkup(
      createElement(
        ClientPortalShell,
        { locale: "en", activeRoute: "home" },
        createElement("p", null, "Safe"),
      ),
    );
    for (const href of [
      "services",
      "status",
      "documents",
      "appointments",
      "messages",
      "payments",
      "help",
    ]) {
      expect(html).toContain(`/client/${href}`);
      expect(
        readFileSync(
          join(workspace, "apps", "app", "src", "app", "client", href, "page.tsx"),
          "utf8",
        ),
      ).toMatch(/ClientPortalShell|ProviderDisabledPortalPage/u);
    }
    expect(html).toContain("<details");
    expect(html).not.toContain(">More</a>");
  });

  it("uses one cookie/default locale path and renders one-language dashboard copy", () => {
    expect(resolveDashboardLocale("en", "es")).toBe("en");
    expect(resolveDashboardLocale(undefined, "es")).toBe("es");
    const html = renderToStaticMarkup(
      createElement(DashboardView, { dto: { ...dto(), locale: "en" } }),
    );
    expect(html).toContain("Your information");
    expect(html).not.toContain("Su información");
  });

  it("allowlists every M008 interaction and strips identifiers and payloads", () => {
    expect(DASHBOARD_EVENT_NAMES).toEqual(
      expect.arrayContaining([
        "client_dashboard_priority_viewed",
        "client_dashboard_priority_clicked",
        "client_dashboard_service_card_clicked",
        "client_dashboard_task_clicked",
        "client_dashboard_document_upload_clicked",
        "client_dashboard_appointment_clicked",
        "client_dashboard_payment_clicked",
        "client_dashboard_message_clicked",
        "client_dashboard_help_resource_clicked",
      ]),
    );
    const event = recordDashboardEvent("client_dashboard_payment_clicked", {
      locale: "en",
      widgetCode: "payments",
      resultCode: "ok",
      contextId: "ctx",
      amount: "100",
      payload: "secret",
    });
    expect(event.properties).toEqual({ locale: "en", widgetCode: "payments", resultCode: "ok" });
  });

  it("defines a disabled future cache envelope with epochs, TTL and critical freshness denial", () => {
    const authorization: DashboardAuthorizationSnapshot = {
      ...snapshot(),
      schemaVersion: "m008.auth.v2",
      accountStatus: "active",
      sessionStatus: "active",
      sessionExpiresAt: "2026-08-21T13:00:00.000Z",
      assurance: "aal1",
      authenticationEpoch: "7",
      authorizationEpoch: "11",
      policyEpoch: "13",
      contextOptions: [],
    };
    const envelope = buildDashboardCacheEnvelope({
      snapshot: authorization,
      section: "help",
      sourceVersion: "help.v2",
      sourceStatus: "fresh",
      generatedAt: "2026-08-21T12:00:00.000Z",
      ttlSeconds: 60,
      value: { state: "fresh" },
    });
    expect(envelope.schemaVersion).toBe(DASHBOARD_CACHE_SCHEMA_VERSION);
    expect(envelope.expiresAt).toBe("2026-08-21T12:01:00.000Z");
    expect(
      canServeDashboardCacheEnvelope(
        envelope,
        authorization,
        "help",
        new Date("2026-08-21T12:00:30.000Z"),
      ),
    ).toBe(true);
    expect(
      canServeDashboardCacheEnvelope(
        { ...envelope, section: "payments" },
        authorization,
        "payments",
        new Date("2026-08-21T12:00:30.000Z"),
      ),
    ).toBe(false);
  });
});
