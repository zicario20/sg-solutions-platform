import type { ClientManagementDto, ClientManagementLocale } from "@atlas/client-management";

const copy = {
  es: {
    eyebrow: "GESTION DE CLIENTES",
    title: "Client 360",
    subtitle: "Relacion formal, coordinacion y contexto operativo autorizado.",
    navigation: "Navegacion de clientes",
    relationship: "Relacion",
    onboarding: "Onboarding",
    representatives: "Representantes",
    operations: "Resumen operativo",
    unavailable: "La fuente autorizada no esta disponible. No se muestran valores estimados.",
    suppressed: "No tienes permiso para ver esta seccion.",
    review: "La invitacion no otorga acceso hasta su aprobacion y activacion.",
    updated: "Actualizado",
  },
  en: {
    eyebrow: "CLIENT MANAGEMENT",
    title: "Client 360",
    subtitle: "Formal relationship, coordination, and authorized operational context.",
    navigation: "Client navigation",
    relationship: "Relationship",
    onboarding: "Onboarding",
    representatives: "Representatives",
    operations: "Operations summary",
    unavailable: "The authorized source is unavailable. No estimated values are shown.",
    suppressed: "You do not have permission to view this section.",
    review: "An invitation grants no access until approval and activation.",
    updated: "Updated",
  },
} as const;
function label(locale: ClientManagementLocale, key: string) {
  const selected = copy[locale];
  return selected[key as keyof typeof selected] ?? key;
}
export function ClientManagementWorkspaceView({ dto }: Readonly<{ dto: ClientManagementDto }>) {
  const language = copy[dto.locale];
  return (
    <main className="atlas-client-management" aria-label={language.title}>
      <style>{styles}</style>
      <div className="atlas-client-management-shell">
        <aside aria-label={language.navigation}>
          <a href="/admin" className="atlas-client-management-brand">
            <span aria-hidden="true">◆</span> SG Solutions
          </a>
          <nav>
            {dto.sections.map((section) => (
              <a key={section.section} href={`#${section.section}`}>
                {label(dto.locale, section.title)}
              </a>
            ))}
          </nav>
        </aside>
        <div>
          <header id="overview">
            <p>{language.eyebrow}</p>
            <h1>{language.title}</h1>
            <span>{language.subtitle}</span>
          </header>
          <div className="atlas-client-management-grid">
            {dto.sections.map((section) => (
              <section
                id={section.section}
                key={section.section}
                aria-labelledby={`client-${section.section}`}
              >
                <header>
                  <h2 id={`client-${section.section}`}>{label(dto.locale, section.title)}</h2>
                  {section.asOf ? (
                    <small>
                      {language.updated}: {section.asOf}
                    </small>
                  ) : null}
                </header>
                {section.state === "unavailable" || section.state === "stale" ? (
                  <p role="status">{language.unavailable}</p>
                ) : null}
                {section.state === "suppressed" ? <p role="status">{language.suppressed}</p> : null}
                {section.items?.length ? (
                  <ol>
                    {section.items.map((item, index) => {
                      const row = item as Record<string, unknown>;
                      return (
                        <li
                          key={String(
                            row.clientRelationshipRef ??
                              row.workflowRef ??
                              row.representativeRef ??
                              row.opaqueRef ??
                              index,
                          )}
                        >
                          <strong>
                            {String(
                              row.publicReference ??
                                row.displayLabel ??
                                row.label ??
                                row.stateLabel ??
                                "",
                            )}
                          </strong>
                          <span>
                            {String(
                              row.nextClientActionLabel ??
                                row.nextInternalActionLabel ??
                                row.scopeLabel ??
                                row.category ??
                                row.stateLabel ??
                                "",
                            )}
                          </span>
                          {row.reviewRequired === true ? <small>{language.review}</small> : null}
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
const styles = `.atlas-client-management{--ink:#edf4ef;--muted:#9ead9f;--line:rgba(157,189,170,.17);--green:#38cf77;min-height:100vh;background:radial-gradient(circle at 95% 2%,#17533a 0,transparent 30%),linear-gradient(135deg,#06130d,#0c2118);color:var(--ink);font-family:var(--font-manrope,Manrope,sans-serif);padding:24px}.atlas-client-management *{box-sizing:border-box}.atlas-client-management-shell{display:grid;grid-template-columns:218px minmax(0,1fr);gap:24px;max-width:1500px;margin:auto}.atlas-client-management aside,.atlas-client-management section{border:1px solid var(--line);background:rgba(8,25,17,.88);border-radius:18px}.atlas-client-management aside{padding:20px;min-height:calc(100vh - 48px)}.atlas-client-management-brand{display:flex;gap:10px;align-items:center;color:#fff;font-weight:800;text-decoration:none;margin:2px 0 30px}.atlas-client-management-brand span{display:grid;place-items:center;background:linear-gradient(135deg,#58dc8e,#177547);color:#062010;width:31px;height:31px;border-radius:10px}.atlas-client-management nav{display:grid;gap:5px}.atlas-client-management nav a{padding:11px 12px;border-radius:10px;text-decoration:none;color:var(--muted);font-size:14px}.atlas-client-management nav a:first-child{background:linear-gradient(90deg,#107542,#164d30);color:#fff;font-weight:700}.atlas-client-management>div>div>header{margin:8px 0 24px}.atlas-client-management header p{margin:0 0 6px;color:var(--green);font-size:12px;font-weight:800;letter-spacing:.12em}.atlas-client-management h1{margin:0;font-size:clamp(30px,4vw,46px);letter-spacing:-.06em}.atlas-client-management>div>div>header span{display:block;color:var(--muted);margin-top:7px}.atlas-client-management-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.atlas-client-management section{grid-column:span 6;padding:18px;background:linear-gradient(145deg,rgba(19,43,32,.96),rgba(8,22,16,.91))}.atlas-client-management section:nth-child(1){grid-column:span 7}.atlas-client-management section:nth-child(2){grid-column:span 5}.atlas-client-management section header{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:12px}.atlas-client-management h2{margin:0;font-size:15px}.atlas-client-management small{color:var(--muted);font-size:12px}.atlas-client-management section>p{color:var(--muted);line-height:1.5}.atlas-client-management ol{list-style:none;padding:0;margin:13px 0 0;display:grid;gap:9px}.atlas-client-management li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;padding:11px;border:1px solid rgba(157,189,170,.1);background:rgba(3,17,11,.46);border-radius:10px}.atlas-client-management li strong{font-size:14px}.atlas-client-management li span{font-size:13px;color:var(--muted);text-align:right}.atlas-client-management li small{grid-column:1/-1;color:#f4c767}@media(max-width:800px){.atlas-client-management{padding:12px}.atlas-client-management-shell{grid-template-columns:1fr}.atlas-client-management aside{min-height:auto}.atlas-client-management nav{grid-template-columns:repeat(2,minmax(0,1fr))}.atlas-client-management section,.atlas-client-management section:nth-child(1),.atlas-client-management section:nth-child(2){grid-column:1/-1}}@media(prefers-reduced-motion:reduce){.atlas-client-management *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
