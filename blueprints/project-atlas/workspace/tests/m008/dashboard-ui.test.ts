import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ClientPortalShell,
  ContextSwitchControl,
  DashboardSkeleton,
  DashboardStateNotice,
  DashboardView,
} from "@atlas/ui";
import type { DashboardDto, DashboardSection } from "@atlas/dashboard";
import { describe, expect, it } from "vitest";

describe("M008 client portal shell", () => {
  it("renders Spanish landmarks, current navigation and textual status", () => {
    const html = renderToStaticMarkup(createElement(
      ClientPortalShell,
      { locale: "es", activeRoute: "home" },
      createElement(DashboardStateNotice, { locale: "es", state: "unavailable" }),
    ));
    expect(html).toContain("<nav");
    expect(html).toContain("<main");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Inicio");
    expect(html).toContain('role="status"');
    expect(html).not.toMatch(/Temporarily unavailable|Skip to content|Home/);
  });

  it("renders one-language English copy", () => {
    const html = renderToStaticMarkup(createElement(
      ClientPortalShell,
      { locale: "en", activeRoute: "services" },
      createElement(DashboardStateNotice, { locale: "en", state: "empty" }),
    ));
    expect(html).toContain("My services");
    expect(html).toContain("Nothing to show right now");
    expect(html).not.toMatch(/Mis servicios|No hay nada/);
  });
});

const unavailable = (): DashboardSection<never> => ({ state: "unavailable", safeReason: "provider_disabled" });
const providerDisabledDto: DashboardDto = {
  locale: "es",
  context: { type: "personal" },
  priority: { kind: "unconfirmed", safeReason: "required_source_unavailable", policyVersion: "m008.v1" },
  security: unavailable(),
  services: unavailable(),
  tasks: unavailable(),
  documents: unavailable(),
  appointments: unavailable(),
  payments: unavailable(),
  messages: unavailable(),
  notifications: unavailable(),
  help: unavailable(),
};

describe("M008 dashboard widgets", () => {
  it("orders priority before services and never invents payment state", () => {
    const html = renderToStaticMarkup(createElement(DashboardView, { dto: providerDisabledDto }));
    expect(html.indexOf('data-widget="priority"')).toBeLessThan(html.indexOf('data-widget="services"'));
    for (const widget of ["services", "tasks", "documents", "appointments", "payments", "messages", "notifications", "help", "support"]) {
      expect(html).toContain(`data-widget="${widget}"`);
    }
    expect(html).not.toMatch(/\$|paid|pagado/i);
  });

  it("renders real service labels without fabricated completion percentages", () => {
    const dto: DashboardDto = {
      ...providerDisabledDto,
      priority: { kind: "none", policyVersion: "m008.v1" },
      services: { state: "fresh", asOf: "2026-08-21T12:00:00.000Z", data: [{ opaqueRef: "service-a", title: "Tax filing", statusLabel: "Active", routeKey: "services" }] },
    };
    const html = renderToStaticMarkup(createElement(DashboardView, { dto }));
    expect(html).toContain("Tax filing");
    expect(html).not.toContain("% complete");
  });

  it("uses non-realistic skeletons and an opaque POST context control", () => {
    const skeleton = renderToStaticMarkup(createElement(DashboardSkeleton, { locale: "en", rows: 2 }));
    expect(skeleton).not.toMatch(/@|\$|\d{3}[- ]\d{2}[- ]\d{4}/);
    const control = renderToStaticMarkup(createElement(ContextSwitchControl, {
      locale: "en",
      csrfToken: "csrf-token",
      activeContext: "context-a",
      options: [
        { opaqueRef: "context-a", label: "Personal", type: "personal" },
        { opaqueRef: "context-b", label: "Authorized organization", type: "organization" },
      ],
    }));
    expect(control).toContain("Switch context");
    expect(control).not.toContain("context-b?");
    expect(control).not.toContain("localStorage");
  });
});
