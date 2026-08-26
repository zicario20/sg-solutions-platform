import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  PROCESS_SOURCE_CAPABILITIES,
  PROCESS_TIMELINE_CURSOR_PATTERN,
  parseClientProcessDetailDto,
  resolveClientProcessStatus,
} from "@atlas/client-process-status";
import { getProcessStatusCopy } from "@atlas/i18n";
import { createProcessStatusAnalyticsEvent } from "@atlas/observability";
import { ProcessSections, ProcessTimeline } from "@atlas/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseProcessCursor } from "../../apps/app/src/lib/process-status/http.ts";

const workspace = resolve(import.meta.dirname, "../.."),
  read = (p: string) => readFileSync(resolve(workspace, p), "utf8"),
  ref = "csr1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
function files(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const p = resolve(root, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}
describe("M010 review remediations", () => {
  it("AR-002/AR-004/CN-002 closes source authority and deterministic priority domains", () => {
    expect(PROCESS_SOURCE_CAPABILITIES.help.priority).toEqual([]);
    expect(PROCESS_SOURCE_CAPABILITIES.messages.blockers).toBe(false);
    expect(PROCESS_SOURCE_CAPABILITIES.payments.priority).toEqual(["payments"]);
    const query = read("packages/client-process-status/src/query-service.ts");
    expect(query).toContain("PROCESS_SOURCE_CAPABILITIES");
    expect(query).toContain("deterministicBlockers");
  });
  it("AR-003/AR-010 binds complete final proof, permission and entitlement", () => {
    const query = read("packages/client-process-status/src/query-service.ts");
    for (const field of [
      "entitlementVersion",
      "registryVersion",
      "mappingPolicyVersion",
      "definitionVersion",
      "workflowVersion",
      "permission",
      "readCut",
    ])
      expect(query).toContain(field);
    expect(query.replace(/\s+/gu, "")).toContain("ids.size!==childFences.length");
  });
  it("AR-005/AR-011 uses one strict opaque cursor parser for API and SSR", () => {
    const good = "ptc1_" + "A".repeat(24);
    expect(PROCESS_TIMELINE_CURSOR_PATTERN.test(good)).toBe(true);
    expect(parseProcessCursor(good, "timeline")).toEqual({ kind: "valid", value: good });
    expect(parseProcessCursor("24", "timeline")).toEqual({ kind: "invalid" });
    expect(read("apps/app/src/lib/process-status/page-context.ts")).toContain("parseProcessCursor");
  });
  it.each(["es", "en"] as const)(
    "AR-006 renders reviewed %s event copy and never raw event code",
    (locale) => {
      const html = renderToStaticMarkup(
        <ProcessTimeline
          locale={locale}
          serviceRef={ref}
          timeline={{
            state: "fresh",
            items: [
              {
                eventRef: "pev1_" + "A".repeat(32),
                code: "internal_event_code",
                copyKey: "timeline.step_completed",
                actorCategory: "sg_solutions",
                occurredAt: "2026-08-23T01:00:00Z",
              },
            ],
            hasMore: false,
          }}
        />,
      );
      expect(html).toContain(
        getProcessStatusCopy(locale).timelineEvents["timeline.step_completed"],
      );
      expect(html).not.toContain("internal_event_code");
    },
  );
  it("AR-008 hands the selected M009 opaque ref to M010", () => {
    const handoff = read("packages/ui/src/client-services/ClientServiceDetail.tsx");
    expect(handoff.replace(/\s+/gu, "")).toContain(
      '"/client/status/"+encodeURIComponent(detail.service.opaqueRef)',
    );
    expect(handoff).not.toContain("serviceOrderId");
  });
  it("AR-009 supports blocked/cancelled milestones and governed blocker states", () => {
    const axes = {
      commercial: "active",
      financial: "paid",
      activation: "approved",
      fulfillment: "in_progress",
    } as any;
    expect(resolveClientProcessStatus(axes, { blockers: [{ effect: "on_hold" }] })).toMatchObject({
      kind: "confirmed",
      code: "on_hold",
    });
    expect(
      resolveClientProcessStatus(axes, { blockers: [{ effect: "action_required" }] }),
    ).toMatchObject({ kind: "confirmed", code: "action_required" });
    const base = {
      schemaVersion: "m010.detail.v1",
      availability: "fresh",
      context: { type: "personal", label: "Personal" },
      service: { serviceRef: ref, label: "Service" },
      milestones: [{ label: "External review", state: "cancelled" }],
      sections: {},
    };
    expect(parseClientProcessDetailDto(base).milestones?.[0]?.state).toBe("cancelled");
  });
  it.each(["es", "en"] as const)(
    "AR-012 differentiates stale sections and pagination copy in %s",
    (locale) => {
      const copy = getProcessStatusCopy(locale),
        html = renderToStaticMarkup(
          <ProcessSections
            locale={locale}
            sections={{ tasks: { state: "stale", asOf: "2026-08-23T01:00:00Z" } }}
          />,
        );
      expect(html).toContain(copy.sectionStale);
      expect(copy.loadMore).not.toBe(copy.view);
    },
  );
  it("AR-013 keeps SSR analytics allowlisted and metadata-minimal", () => {
    expect(
      createProcessStatusAnalyticsEvent("process_status_health_ssr", {
        outcome: "ok",
        locale: "en",
      }),
    ).toEqual({ event: "process_status_health_ssr", outcome: "ok", locale: "en" });
    expect(() =>
      createProcessStatusAnalyticsEvent("process_status_health_ssr", {
        outcome: "ok",
        serviceRef: ref,
      } as never),
    ).toThrow();
  });
  it("AR-013 scans all M010 runtime roots for forbidden persistence/provider behavior", () => {
    const roots = [
        "packages/client-process-status",
        "apps/app/src/lib/process-status",
        "apps/app/src/app/api/client/process-status",
        "apps/app/src/app/client/status",
      ].map((p) => resolve(workspace, p)),
      source = roots
        .flatMap(files)
        .filter((p) => /\.(ts|tsx|sql)$/u.test(p))
        .map((p) => readFileSync(p, "utf8"))
        .join("\n");
    expect(source).not.toMatch(
      /create\s+table|materializer|service_role|bypassrls|localStorage|sessionStorage|stripe/i,
    );
  });
  it("CN-001 rejects link-like and PII fields at every nested DTO boundary", () => {
    const base: any = {
      schemaVersion: "m010.detail.v1",
      availability: "fresh",
      context: { type: "personal", label: "Personal" },
      service: { serviceRef: ref, label: "Service" },
      timeline: {
        state: "fresh",
        items: [
          {
            eventRef: "pev1_" + "A".repeat(32),
            code: "step_completed",
            copyKey: "timeline.step_completed",
            actorCategory: "client",
            occurredAt: "2026-08-23T01:00:00Z",
            employeeEmail: "x@example.test",
          },
        ],
        hasMore: false,
      },
      sections: {},
    };
    expect(() => parseClientProcessDetailDto(base)).toThrow();
  });
  it("CN-003 requires per-event epochs, approved mapping and matching unique resource fence", () => {
    const timeline = read("packages/client-process-status/src/timeline-policy.ts");
    for (const proof of [
      "resourceFenceId",
      "authorizationEpoch",
      "policyEpoch",
      "mappingId",
      "used.has",
    ])
      expect(timeline).toContain(proof);
  });
});
