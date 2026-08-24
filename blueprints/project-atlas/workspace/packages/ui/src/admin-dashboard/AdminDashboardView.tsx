import type {
  AdminDashboardDto,
  AdminDashboardIntegration,
  AdminDashboardWidgetResult,
} from "@atlas/admin-dashboard";
import { type AdminDashboardCopyLocale, adminDashboardCopy } from "@atlas/i18n";

const destinationPath: Readonly<Record<string, string>> = Object.freeze({
  crm: "/admin/crm",
  clients: "/admin/clients",
  services: "/admin/services",
  documents: "/admin/documents",
  calendar: "/admin/calendar",
  communications: "/admin/communications",
  approvals: "/admin/approvals",
  payments: "/admin/payments",
  reports: "/admin/reports",
  settings: "/admin/settings",
});
const icon: Readonly<Record<string, string>> = Object.freeze({
  critical_alerts: "!",
  priority_work: "↗",
  operational_summary: "◈",
  approvals: "✓",
  team_workload: "◫",
  communications: "✦",
  appointments: "◷",
  documents: "▣",
  payments: "$",
  integrations: "⌁",
  recent_activity: "◌",
});
function WidgetState({
  widget,
  locale,
}: Readonly<{ widget: AdminDashboardWidgetResult; locale: AdminDashboardCopyLocale }>) {
  const copy = adminDashboardCopy[locale];
  if (widget.state === "complete" || widget.state === "partial") return null;
  return (
    <p className="atlas-admin-state" role="status">
      {widget.state === "suppressed" ? copy.empty : copy.dataUnavailable}
    </p>
  );
}
function IntegrationRow({
  item,
  locale,
}: Readonly<{ item: AdminDashboardIntegration; locale: AdminDashboardCopyLocale }>) {
  const copy = adminDashboardCopy[locale];
  return (
    <li className="atlas-admin-integration">
      <span className={`atlas-admin-dot atlas-admin-dot--${item.state}`} aria-hidden="true" />
      <span>{item.label}</span>
      <strong>{copy[item.state]}</strong>
    </li>
  );
}
function Widget({
  widget,
  locale,
}: Readonly<{ widget: AdminDashboardWidgetResult; locale: AdminDashboardCopyLocale }>) {
  const copy = adminDashboardCopy[locale];
  const label = copy[widget.title as keyof typeof copy] ?? widget.title;
  const items = widget.data?.items ?? [];
  return (
    <section
      className={`atlas-admin-widget atlas-admin-widget--${widget.code}`}
      aria-labelledby={`widget-${widget.code}`}
    >
      <header>
        <span className="atlas-admin-widget-icon" aria-hidden="true">
          {icon[widget.code]}
        </span>
        <div>
          <h2 id={`widget-${widget.code}`}>{label}</h2>
          {widget.asOf ? (
            <small>
              {copy.updated}: {widget.asOf}
            </small>
          ) : null}
        </div>
      </header>
      <WidgetState widget={widget} locale={locale} />
      {widget.data?.metrics?.length ? (
        <div className="atlas-admin-metric-list">
          {widget.data.metrics.map((metric) => (
            <div key={metric.code}>
              <span>{metric.label}</span>
              <strong>{metric.valueLabel}</strong>
              {metric.detail ? <small>{metric.detail}</small> : null}
            </div>
          ))}
        </div>
      ) : null}
      {items.length ? (
        <ol className="atlas-admin-work-list">
          {items.map((item) => (
            <li key={item.opaqueRef}>
              <span className={`atlas-admin-severity atlas-admin-severity--${item.severity}`}>
                {item.severity}
              </span>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.category}
                  {item.dueLabel ? ` · ${item.dueLabel}` : ""}
                </small>
              </div>
              <a
                href={destinationPath[item.destination] ?? "/admin"}
                aria-label={`${copy.overview}: ${item.title}`}
              >
                →
              </a>
            </li>
          ))}
        </ol>
      ) : null}
      {widget.data?.integrations?.length ? (
        <ul className="atlas-admin-integrations">
          {widget.data.integrations.map((item) => (
            <IntegrationRow key={item.code} item={item} locale={locale} />
          ))}
        </ul>
      ) : null}
      {widget.data?.activity?.length ? (
        <ol className="atlas-admin-activity">
          {widget.data.activity.map((item) => (
            <li key={item.opaqueRef}>
              <span>{item.label}</span>
              <small>{item.occurredLabel}</small>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
const styles = `
.atlas-admin-dashboard{--ink:#eff5f2;--muted:#9eaea7;--panel:rgba(13,27,24,.92);--line:rgba(135,165,151,.18);--green:#35c873;--lime:#a6eb63;--amber:#f2b84b;--red:#fa746a;--blue:#55a6f7;min-height:100vh;background:radial-gradient(circle at 78% -10%,#17442f 0,transparent 30%),linear-gradient(135deg,#07120f,#0c1c17 52%,#07110e);color:var(--ink);font-family:var(--font-manrope,Manrope,sans-serif);padding:24px;box-sizing:border-box}.atlas-admin-dashboard *{box-sizing:border-box}.atlas-admin-shell{max-width:1560px;margin:auto;display:grid;grid-template-columns:218px minmax(0,1fr);gap:24px}.atlas-admin-sidebar{border:1px solid var(--line);background:rgba(4,14,11,.72);border-radius:20px;padding:20px;min-height:calc(100vh - 48px)}.atlas-admin-brand{display:flex;gap:11px;align-items:center;margin-bottom:32px;font-weight:800;letter-spacing:-.04em;font-size:20px}.atlas-admin-brand-mark{display:grid;place-items:center;background:linear-gradient(135deg,var(--green),#12894d);width:34px;height:34px;border-radius:11px;color:#052313}.atlas-admin-sidebar a{display:block;color:var(--muted);padding:11px 12px;border-radius:10px;text-decoration:none;font-size:14px}.atlas-admin-sidebar a:first-of-type{background:linear-gradient(90deg,#107442,#124c30);color:#fff;font-weight:700}.atlas-admin-content{min-width:0}.atlas-admin-top{display:flex;align-items:start;justify-content:space-between;gap:16px;margin:4px 0 22px}.atlas-admin-top p,.atlas-admin-top h1{margin:0}.atlas-admin-top p{color:var(--green);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.atlas-admin-top h1{font-size:clamp(28px,4vw,42px);letter-spacing:-.055em}.atlas-admin-subtitle{color:var(--muted);margin-top:7px!important}.atlas-admin-controls{display:flex;gap:9px;align-items:center}.atlas-admin-controls button,.atlas-admin-controls span{border:1px solid var(--line);background:rgba(11,30,23,.78);color:var(--ink);padding:10px 12px;border-radius:10px;font:inherit;font-size:13px}.atlas-admin-controls button{cursor:pointer}.atlas-admin-alert{border:1px solid rgba(250,116,106,.42);background:linear-gradient(90deg,rgba(112,30,27,.65),rgba(40,19,18,.45));padding:14px 16px;border-radius:14px;margin-bottom:16px;display:flex;gap:10px;color:#ffd9d5}.atlas-admin-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}.atlas-admin-widget{border:1px solid var(--line);background:linear-gradient(145deg,rgba(19,39,32,.95),rgba(8,22,17,.93));border-radius:16px;padding:17px;min-width:0;box-shadow:0 18px 60px rgba(0,0,0,.14)}.atlas-admin-widget header{display:flex;gap:10px;align-items:center;margin-bottom:14px}.atlas-admin-widget h2{font-size:13px;margin:0;letter-spacing:.01em}.atlas-admin-widget header small,.atlas-admin-widget small{color:var(--muted);font-size:11px}.atlas-admin-widget-icon{width:29px;height:29px;border-radius:9px;display:grid;place-items:center;background:rgba(53,200,115,.16);color:var(--lime);font-weight:900}.atlas-admin-widget--critical_alerts,.atlas-admin-widget--priority_work{grid-column:span 6}.atlas-admin-widget--operational_summary{grid-column:span 12}.atlas-admin-widget--approvals,.atlas-admin-widget--team_workload,.atlas-admin-widget--communications{grid-column:span 4}.atlas-admin-widget--appointments,.atlas-admin-widget--documents,.atlas-admin-widget--payments,.atlas-admin-widget--integrations{grid-column:span 3}.atlas-admin-widget--recent_activity{grid-column:span 6}.atlas-admin-metric-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:10px}.atlas-admin-metric-list>div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);padding:11px;border-radius:10px}.atlas-admin-metric-list span,.atlas-admin-metric-list small{display:block;color:var(--muted);font-size:11px}.atlas-admin-metric-list strong{display:block;font-size:23px;letter-spacing:-.04em;margin:4px 0}.atlas-admin-work-list,.atlas-admin-integrations,.atlas-admin-activity{list-style:none;padding:0;margin:0;display:grid;gap:8px}.atlas-admin-work-list li{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}.atlas-admin-work-list li:first-child{border-top:0}.atlas-admin-work-list strong{display:block;font-size:13px}.atlas-admin-work-list a{color:var(--lime);text-decoration:none;font-size:18px}.atlas-admin-severity{font-size:9px;font-weight:800;text-transform:uppercase;padding:4px 6px;border-radius:99px;background:rgba(255,255,255,.08)}.atlas-admin-severity--critical{background:rgba(250,116,106,.2);color:#ffafa7}.atlas-admin-severity--high{background:rgba(242,184,75,.2);color:#ffcf75}.atlas-admin-severity--medium{color:#9fcfff}.atlas-admin-integration{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;border-top:1px solid var(--line);padding:9px 0;font-size:12px}.atlas-admin-integration strong{color:var(--muted);font-size:10px;font-weight:600}.atlas-admin-dot{width:8px;height:8px;border-radius:999px;background:#65736d}.atlas-admin-dot--healthy{background:var(--green);box-shadow:0 0 12px var(--green)}.atlas-admin-dot--degraded{background:var(--amber)}.atlas-admin-dot--error,.atlas-admin-dot--disconnected{background:var(--red)}.atlas-admin-activity li{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-top:1px solid var(--line);font-size:12px}.atlas-admin-state{color:var(--muted);font-size:13px;line-height:1.5;margin:0}.atlas-admin-unavailable{max-width:720px;margin:12vh auto;padding:28px;border:1px solid var(--line);border-radius:20px;background:var(--panel)}@media(max-width:1000px){.atlas-admin-shell{grid-template-columns:1fr}.atlas-admin-sidebar{min-height:auto;display:flex;gap:4px;overflow:auto;padding:10px}.atlas-admin-brand{display:none}.atlas-admin-sidebar a{white-space:nowrap}.atlas-admin-widget--critical_alerts,.atlas-admin-widget--priority_work,.atlas-admin-widget--recent_activity{grid-column:span 12}.atlas-admin-widget--approvals,.atlas-admin-widget--team_workload,.atlas-admin-widget--communications{grid-column:span 6}.atlas-admin-widget--appointments,.atlas-admin-widget--documents,.atlas-admin-widget--payments,.atlas-admin-widget--integrations{grid-column:span 6}}@media(max-width:620px){.atlas-admin-dashboard{padding:12px}.atlas-admin-top{flex-direction:column}.atlas-admin-controls{width:100%;justify-content:space-between}.atlas-admin-widget--approvals,.atlas-admin-widget--team_workload,.atlas-admin-widget--communications,.atlas-admin-widget--appointments,.atlas-admin-widget--documents,.atlas-admin-widget--payments,.atlas-admin-widget--integrations{grid-column:span 12}.atlas-admin-metric-list{grid-template-columns:repeat(2,1fr)}}@media(prefers-reduced-motion:reduce){.atlas-admin-dashboard *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}`;
export function AdminDashboardView({ dto }: Readonly<{ dto: AdminDashboardDto }>) {
  const copy = adminDashboardCopy[dto.locale];
  const critical = dto.widgets.find((widget) => widget.code === "critical_alerts");
  return (
    <main className="atlas-admin-dashboard" id="admin-dashboard">
      <style>{styles}</style>
      <div className="atlas-admin-shell">
        <aside className="atlas-admin-sidebar">
          <div className="atlas-admin-brand">
            <span className="atlas-admin-brand-mark">SG</span>SG Solutions
          </div>
          <nav aria-label={copy.nav}>
            <a href="/admin">{copy.overview}</a>
            <a href="/admin/crm">CRM</a>
            <a href="/admin/services">{copy.operationalSummary}</a>
            <a href="/admin/documents">{copy.documents}</a>
            <a href="/admin/calendar">{copy.appointments}</a>
            <a href="/admin/communications">{copy.communications}</a>
            <a href="/admin/approvals">{copy.approvals}</a>
            <a href="/admin/reports">Reports</a>
            <a href="/admin/settings">Settings</a>
          </nav>
        </aside>
        <div className="atlas-admin-content">
          <header className="atlas-admin-top">
            <div>
              <p>SG Solutions</p>
              <h1>{copy.title}</h1>
              <p className="atlas-admin-subtitle">{copy.subtitle}</p>
            </div>
            <div className="atlas-admin-controls">
              <span>{copy.period}</span>
              <a href="/admin">{copy.refresh}</a>
            </div>
          </header>
          {critical?.state === "complete" && critical.data?.items?.length ? (
            <div className="atlas-admin-alert" role="alert">
              <strong>!</strong>
              <span>
                {critical.data.items.length} {copy.criticalAlerts}
              </span>
            </div>
          ) : null}
          <div className="atlas-admin-grid">
            {dto.widgets.map((widget) => (
              <Widget key={widget.code} widget={widget} locale={dto.locale} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
export function AdminDashboardUnavailableView({
  locale,
}: Readonly<{ locale: AdminDashboardCopyLocale }>) {
  const copy = adminDashboardCopy[locale];
  return (
    <main className="atlas-admin-dashboard">
      <style>{styles}</style>
      <section className="atlas-admin-unavailable">
        <p>SG Solutions</p>
        <h1>{copy.title}</h1>
        <p>{copy.dataUnavailable}</p>
      </section>
    </main>
  );
}
