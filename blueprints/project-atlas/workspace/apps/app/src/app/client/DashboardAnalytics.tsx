"use client";
import {
  DASHBOARD_EVENT_NAMES,
  type DashboardEvent,
  type DashboardEventName,
  recordDashboardEvent,
} from "@atlas/observability";
import { useEffect } from "react";

const names = new Set<string>(DASHBOARD_EVENT_NAMES);
export function DashboardAnalytics({
  csrfToken,
  events,
}: Readonly<{ csrfToken: string; events: readonly DashboardEvent[] }>) {
  useEffect(() => {
    const locale = events.find((item) => item.properties.locale)?.properties.locale;
    const send = (event: DashboardEventName, properties: Readonly<Record<string, unknown>>) => {
      const safe = recordDashboardEvent(event, properties);
      void fetch("/api/client/dashboard/analytics", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "content-type": "application/json", "x-atlas-csrf": csrfToken },
        body: JSON.stringify(safe),
      }).catch(() => undefined);
    };
    for (const event of events) send(event.event, event.properties);
    const clicked = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-dashboard-event]")
          : null;
      const name = target?.dataset.dashboardEvent;
      if (!name || !names.has(name)) return;
      send(name as DashboardEventName, {
        locale,
        widgetCode: target.dataset.dashboardWidget,
        resultCode: "ok",
      });
    };
    document.addEventListener("click", clicked);
    return () => document.removeEventListener("click", clicked);
  }, [csrfToken, events]);
  return null;
}
