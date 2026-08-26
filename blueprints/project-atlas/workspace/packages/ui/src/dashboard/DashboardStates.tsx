import { type DashboardLocale, dashboardCopy } from "@atlas/i18n";

export type DashboardNoticeState =
  | "empty"
  | "unavailable"
  | "stale"
  | "unconfirmed"
  | "error"
  | "denied";

const symbols: Readonly<Record<DashboardNoticeState, string>> = Object.freeze({
  empty: "-",
  unavailable: "!",
  stale: "~",
  unconfirmed: "?",
  error: "!",
  denied: "!",
});

export function DashboardStateNotice({
  locale,
  state,
  compact = false,
}: Readonly<{ locale: DashboardLocale; state: DashboardNoticeState; compact?: boolean }>) {
  const copy = dashboardCopy[locale];
  return (
    <div
      className={`dashboard-notice dashboard-notice-${state}${compact ? " dashboard-notice-compact" : ""}`}
      role={state === "error" || state === "denied" ? "alert" : "status"}
    >
      <span className="dashboard-notice-icon" aria-hidden="true">
        {symbols[state]}
      </span>
      <span>{copy.states[state]}</span>
    </div>
  );
}

export function DashboardSkeleton({
  locale,
  rows = 3,
}: Readonly<{ locale: DashboardLocale; rows?: number }>) {
  return (
    <section
      className="dashboard-skeleton"
      aria-busy="true"
      aria-label={dashboardCopy[locale].loading}
    >
      <span className="skeleton-title" />
      {["skeleton-row-1", "skeleton-row-2", "skeleton-row-3", "skeleton-row-4", "skeleton-row-5"]
        .slice(0, Math.max(1, Math.min(rows, 5)))
        .map((rowKey) => (
          <span className="skeleton-row" key={rowKey} />
        ))}
    </section>
  );
}
