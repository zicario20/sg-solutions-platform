import type { OrganizationLocale, OrganizationManagementDto } from "@atlas/organization-management";

const copy = {
  es: {
    eyebrow: "GESTION DE ORGANIZACIONES",
    title: "Organizaciones",
    subtitle: "Entidad, relaciones y contexto operativo autorizado.",
    navigation: "Navegacion de organizaciones",
    organization: "Organizacion",
    relationships: "Relaciones",
    compliance: "Cumplimiento",
    operations: "Resumen operativo",
    unavailable: "La fuente autorizada no esta disponible. No se muestran valores estimados.",
    suppressed: "No tienes permiso para ver esta seccion.",
    review: "Las relaciones de propiedad y acceso requieren evidencia y revision autorizada.",
    updated: "Actualizado",
  },
  en: {
    eyebrow: "ORGANIZATION MANAGEMENT",
    title: "Organizations",
    subtitle: "Entity, relationships, and authorized operational context.",
    navigation: "Organization navigation",
    organization: "Organization",
    relationships: "Relationships",
    compliance: "Compliance",
    operations: "Operations summary",
    unavailable: "The authorized source is unavailable. No estimated values are shown.",
    suppressed: "You do not have permission to view this section.",
    review: "Ownership and access relationships require authorized evidence and review.",
    updated: "Updated",
  },
} as const;
function label(locale: OrganizationLocale, key: string) {
  const selected = copy[locale];
  return selected[key as keyof typeof selected] ?? key;
}
export function OrganizationManagementWorkspaceView({
  dto,
}: Readonly<{ dto: OrganizationManagementDto }>) {
  const language = copy[dto.locale];
  return (
    <main className="atlas-organization" aria-label={language.title}>
      <style>{styles}</style>
      <div className="atlas-organization-shell">
        <aside aria-label={language.navigation}>
          <a href="/admin" className="atlas-organization-brand">
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
          <div className="atlas-organization-grid">
            {dto.sections.map((section) => (
              <section
                id={section.section}
                key={section.section}
                aria-labelledby={`organization-${section.section}`}
              >
                <header>
                  <h2 id={`organization-${section.section}`}>{label(dto.locale, section.title)}</h2>
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
                            row.organizationRef ?? row.relationshipRef ?? row.opaqueRef ?? index,
                          )}
                        >
                          <strong>
                            {String(
                              row.legalNameLabel ??
                                row.publicReference ??
                                row.roleLabel ??
                                row.label ??
                                "",
                            )}
                          </strong>
                          <span>
                            {String(row.stateLabel ?? row.scopeLabel ?? row.category ?? "")}
                          </span>
                          {row.accessState === "review_required" || row.ownershipPercentLabel ? (
                            <small>{language.review}</small>
                          ) : null}
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
const styles = `.atlas-organization{--ink:#eef3ed;--muted:#a2ada2;--line:rgba(172,190,159,.18);--lime:#b8e567;min-height:100vh;background:radial-gradient(circle at 90% 0,#3d5023 0,transparent 31%),linear-gradient(135deg,#0b1308,#1b2514);color:var(--ink);font-family:var(--font-manrope,Manrope,sans-serif);padding:24px}.atlas-organization *{box-sizing:border-box}.atlas-organization-shell{display:grid;grid-template-columns:218px minmax(0,1fr);gap:24px;max-width:1500px;margin:auto}.atlas-organization aside,.atlas-organization section{border:1px solid var(--line);background:rgba(15,27,10,.9);border-radius:18px}.atlas-organization aside{padding:20px;min-height:calc(100vh - 48px)}.atlas-organization-brand{display:flex;gap:10px;align-items:center;color:#fff;font-weight:800;text-decoration:none;margin:2px 0 30px}.atlas-organization-brand span{display:grid;place-items:center;background:linear-gradient(135deg,#d1ef77,#618a2c);color:#16220b;width:31px;height:31px;border-radius:10px}.atlas-organization nav{display:grid;gap:5px}.atlas-organization nav a{padding:11px 12px;border-radius:10px;text-decoration:none;color:var(--muted);font-size:14px}.atlas-organization nav a:first-child{background:linear-gradient(90deg,#617e2e,#3e5821);color:#fff;font-weight:700}.atlas-organization>div>div>header{margin:8px 0 24px}.atlas-organization header p{margin:0 0 6px;color:var(--lime);font-size:12px;font-weight:800;letter-spacing:.12em}.atlas-organization h1{margin:0;font-size:clamp(30px,4vw,46px);letter-spacing:-.06em}.atlas-organization>div>div>header span{display:block;color:var(--muted);margin-top:7px}.atlas-organization-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.atlas-organization section{grid-column:span 6;padding:18px;background:linear-gradient(145deg,rgba(42,55,25,.95),rgba(14,27,9,.92))}.atlas-organization section:nth-child(1){grid-column:span 7}.atlas-organization section:nth-child(2){grid-column:span 5}.atlas-organization section header{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:12px}.atlas-organization h2{margin:0;font-size:15px}.atlas-organization small{color:var(--muted);font-size:12px}.atlas-organization section>p{color:var(--muted);line-height:1.5}.atlas-organization ol{list-style:none;padding:0;margin:13px 0 0;display:grid;gap:9px}.atlas-organization li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;padding:11px;border:1px solid rgba(172,190,159,.12);background:rgba(9,19,6,.48);border-radius:10px}.atlas-organization li strong{font-size:14px}.atlas-organization li span{font-size:13px;color:var(--muted);text-align:right}.atlas-organization li small{grid-column:1/-1;color:#e1c46d}@media(max-width:800px){.atlas-organization{padding:12px}.atlas-organization-shell{grid-template-columns:1fr}.atlas-organization aside{min-height:auto}.atlas-organization nav{grid-template-columns:repeat(2,minmax(0,1fr))}.atlas-organization section,.atlas-organization section:nth-child(1),.atlas-organization section:nth-child(2){grid-column:1/-1}}@media(prefers-reduced-motion:reduce){.atlas-organization *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
