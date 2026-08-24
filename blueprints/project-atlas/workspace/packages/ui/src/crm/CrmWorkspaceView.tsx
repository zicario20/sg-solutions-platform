import type { CrmLocale, CrmWorkspaceDto } from "@atlas/crm";

const copy = {
  es: {
    eyebrow: "OPERACIONES COMERCIALES",
    title: "CRM",
    subtitle: "Relaciones comerciales, oportunidades y seguimiento autorizado.",
    navigation: "Navegacion administrativa",
    overview: "Resumen",
    relationships: "Relaciones",
    pipeline: "Pipeline",
    activities: "Actividad",
    duplicates: "Posibles duplicados",
    unavailable: "La fuente autorizada no esta disponible. No se muestran valores estimados.",
    suppressed: "No tienes permiso para ver esta seccion.",
    reviewOnly: "Revision requerida. No se fusiona automaticamente.",
    updated: "Actualizado",
  },
  en: {
    eyebrow: "COMMERCIAL OPERATIONS",
    title: "CRM",
    subtitle: "Authorized commercial relationships, opportunities, and follow-up.",
    navigation: "Administrative navigation",
    overview: "Overview",
    relationships: "Relationships",
    pipeline: "Pipeline",
    activities: "Activity",
    duplicates: "Potential duplicates",
    unavailable: "The authorized source is unavailable. No estimated values are shown.",
    suppressed: "You do not have permission to view this section.",
    reviewOnly: "Review required. No automatic merge occurs.",
    updated: "Updated",
  },
} as const;
function sectionCopy(locale: CrmLocale, title: string) {
  const selected = copy[locale];
  return selected[title as keyof typeof selected] ?? title;
}
export function CrmWorkspaceView({ dto }: Readonly<{ dto: CrmWorkspaceDto }>) {
  const language = copy[dto.locale];
  return (
    <main className="atlas-crm" aria-label={language.title}>
      <style>{styles}</style>
      <div className="atlas-crm-shell">
        <aside className="atlas-crm-sidebar" aria-label={language.navigation}>
          <a className="atlas-crm-brand" href="/admin">
            <span aria-hidden="true">◆</span> SG Solutions
          </a>
          <nav>
            <a href="#overview">{language.overview}</a>
            <a href="#relationships">{language.relationships}</a>
            <a href="#pipeline">{language.pipeline}</a>
            <a href="#activities">{language.activities}</a>
            <a href="#duplicates">{language.duplicates}</a>
          </nav>
        </aside>
        <div className="atlas-crm-content">
          <header className="atlas-crm-header" id="overview">
            <p>{language.eyebrow}</p>
            <h1>{language.title}</h1>
            <span>{language.subtitle}</span>
          </header>
          <div className="atlas-crm-grid">
            {dto.sections.map((section) => (
              <section
                className={`atlas-crm-panel atlas-crm-panel--${section.section}`}
                id={section.section}
                key={section.section}
                aria-labelledby={`crm-${section.section}`}
              >
                <header>
                  <h2 id={`crm-${section.section}`}>{sectionCopy(dto.locale, section.title)}</h2>
                  {section.asOf ? (
                    <small>
                      {language.updated}: {section.asOf}
                    </small>
                  ) : null}
                </header>
                {section.state === "unavailable" || section.state === "stale" ? (
                  <p className="atlas-crm-state" role="status">
                    {language.unavailable}
                  </p>
                ) : null}
                {section.state === "suppressed" ? (
                  <p className="atlas-crm-state" role="status">
                    {language.suppressed}
                  </p>
                ) : null}
                {section.items?.length ? (
                  <ol>
                    {section.items.map((item, index) => {
                      const row = item as Record<string, unknown>;
                      return (
                        <li
                          key={String(
                            row.relationshipRef ??
                              row.opportunityRef ??
                              row.activityRef ??
                              row.candidateRef ??
                              index,
                          )}
                        >
                          <strong>
                            {String(
                              row.displayLabel ??
                                row.targetLabel ??
                                row.candidateLabel ??
                                row.typeLabel ??
                                "",
                            )}
                          </strong>
                          <span>
                            {String(
                              row.nextActionLabel ??
                                row.stageLabel ??
                                row.occurredLabel ??
                                row.matchBasis ??
                                "",
                            )}
                          </span>
                          {row.reviewOnly === true ? <small>{language.reviewOnly}</small> : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
const styles = `.atlas-crm{--ink:#eaf2ed;--muted:#9bac9f;--line:rgba(157,189,170,.17);--panel:rgba(10,27,20,.9);--green:#39cf78;min-height:100vh;background:radial-gradient(circle at 92% 0,#1a5439 0,transparent 29%),linear-gradient(135deg,#06120d,#0d2119 54%,#07130e);color:var(--ink);font-family:var(--font-manrope,Manrope,sans-serif);padding:24px}.atlas-crm *{box-sizing:border-box}.atlas-crm-shell{max-width:1500px;margin:auto;display:grid;grid-template-columns:218px minmax(0,1fr);gap:24px}.atlas-crm-sidebar{border:1px solid var(--line);background:rgba(4,14,10,.74);border-radius:20px;padding:20px;min-height:calc(100vh - 48px)}.atlas-crm-brand{display:flex;gap:10px;align-items:center;color:#fff;text-decoration:none;font-weight:800;margin:2px 0 32px}.atlas-crm-brand span{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:linear-gradient(135deg,#50dc8d,#167444);color:#041b0c}.atlas-crm-sidebar nav{display:grid;gap:5px}.atlas-crm-sidebar nav a{color:var(--muted);text-decoration:none;padding:11px 12px;border-radius:10px;font-size:14px}.atlas-crm-sidebar nav a:first-child{background:linear-gradient(90deg,#117442,#174e32);color:#fff;font-weight:700}.atlas-crm-content{min-width:0}.atlas-crm-header{margin:8px 0 24px}.atlas-crm-header p{margin:0 0 5px;color:var(--green);font-size:12px;font-weight:800;letter-spacing:.12em}.atlas-crm-header h1{margin:0;font-size:clamp(30px,4vw,46px);letter-spacing:-.06em}.atlas-crm-header span{display:block;margin-top:7px;color:var(--muted)}.atlas-crm-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.atlas-crm-panel{grid-column:span 6;border:1px solid var(--line);background:linear-gradient(145deg,rgba(20,43,33,.96),var(--panel));border-radius:17px;padding:18px;box-shadow:0 16px 48px rgba(0,0,0,.16)}.atlas-crm-panel header{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:12px}.atlas-crm-panel h2{margin:0;font-size:15px}.atlas-crm-panel small{color:var(--muted);font-size:12px}.atlas-crm-panel ol{list-style:none;margin:13px 0 0;padding:0;display:grid;gap:9px}.atlas-crm-panel li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;padding:11px;border-radius:10px;background:rgba(4,18,12,.5);border:1px solid rgba(157,189,170,.1)}.atlas-crm-panel li strong{font-size:14px}.atlas-crm-panel li span{color:var(--muted);font-size:13px;text-align:right}.atlas-crm-panel li small{grid-column:1/-1;color:#f3c866}.atlas-crm-state{margin:14px 0 0;color:var(--muted);line-height:1.5}.atlas-crm-panel--relationships{grid-column:span 7}.atlas-crm-panel--pipeline{grid-column:span 5}.atlas-crm-panel--activities{grid-column:span 8}.atlas-crm-panel--duplicates{grid-column:span 4}@media (max-width:800px){.atlas-crm{padding:12px}.atlas-crm-shell{grid-template-columns:1fr}.atlas-crm-sidebar{min-height:auto}.atlas-crm-sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr))}.atlas-crm-panel,.atlas-crm-panel--relationships,.atlas-crm-panel--pipeline,.atlas-crm-panel--activities,.atlas-crm-panel--duplicates{grid-column:1/-1}}@media (prefers-reduced-motion:reduce){.atlas-crm *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}`;
