import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_SERVICE_PUBLIC_STATES, parseClientServiceListDto } from "@atlas/client-services";
import { ClientServicesDirectory } from "../../packages/ui/src/client-services/ClientServicesDirectory.tsx";

const card = { opaqueRef: "csr1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", publicReference: "SR-1", context: { type: "organization", label: "Acme LLC" }, serviceName: "Tax preparation", categoryLabel: "Advisory", publicState: "in_progress", publicStateLabel: "In progress", axes: { commercial: "active", financial: "paid", activation: "approved", fulfillment: "in_progress" }, axisLabels: { commercial: "Active", financial: "Paid", activation: "Approved", fulfillment: "In progress" }, currentMilestone: { label: "Documents reviewed", stateLabel: "Completed" }, milestones: { completed: 1, total: 3 }, nextStepLabel: "Review the request", updatedAt: "2026-08-21T15:00:00.000Z" } as const;

describe("M009 public context, milestones and accessibility", () => {
  it("accepts public display content and rejects internal keys", () => {
    expect(parseClientServiceListDto({ schemaVersion: "m009.list.v2", context: card.context, items: [card] }).items[0]?.serviceName).toBe("Tax preparation");
    expect(() => parseClientServiceListDto({ schemaVersion: "m009.list.v2", context: card.context, items: [{ ...card, definitionKey: "service.tax" }] })).toThrow();
  });

  it("renders organization context, milestones, canonical routes and unique focusable actions", () => {
    const html = renderToStaticMarkup(<ClientServicesDirectory locale="en" state="ready" context={card.context} items={[card]} />);
    expect(html).toContain("Acme LLC");
    expect(html).toContain("Documents reviewed");
    expect(html).toContain('aria-label="View details for Tax preparation, SR-1"');
    expect(html).not.toMatch(/service\.[a-z]|category\.[a-z]|next\.[a-z]/);
    expect(readFileSync(resolve(import.meta.dirname,"../../packages/ui/src/client-services/ClientServices.module.css"),"utf8")).toContain(":focus-visible");
  });

  it.each([["es", "personal", "Personal", "Mis servicios"], ["es", "organization", "Empresa", "Mis servicios"], ["en", "personal", "Personal", "My services"], ["en", "organization", "Company", "My services"]] as const)("renders %s %s context", (locale, type, label, title) => {
    const item = { ...card, context: { type, label } } as never;
    const html = renderToStaticMarkup(<ClientServicesDirectory locale={locale} state="ready" context={{ type, label }} items={[item]} />);
    expect(html).toContain(title);
    expect(html).toContain(label);
  });

  it.each(["empty", "filter-empty", "partial", "stale", "unavailable"] as const)("renders the %s route state in ES and EN", (state) => {
    for (const locale of ["es", "en"] as const) {
      const html = renderToStaticMarkup(<ClientServicesDirectory locale={locale} state={state} context={{ type: "personal", label: "Personal" }} items={state === "partial" ? [card] : []} />);
      expect(html).toContain(locale === "es" ? "Mis servicios" : "My services");
    }
  });

  it("offers every approved public status", () => {
    const html = renderToStaticMarkup(<ClientServicesDirectory locale="en" state="empty" />);
    for (const state of CLIENT_SERVICE_PUBLIC_STATES) expect(html).toContain(`value="${state}"`);
  });
});
