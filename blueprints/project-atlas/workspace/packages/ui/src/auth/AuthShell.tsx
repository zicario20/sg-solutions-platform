import type { ReactNode } from "react";
export function AuthShell({
  title,
  intro,
  brand = "SG Solutions",
  tagline = "",
  skipLabel = "Skip to content",
  languageSelector,
  children,
}: {
  title: string;
  intro?: string;
  brand?: string;
  tagline?: string;
  skipLabel?: string;
  languageSelector?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <a className="skip-link" href="#auth-main">
        {skipLabel}
      </a>
      <main id="auth-main" className="auth-shell">
        <aside className="auth-rail">
          <span className="auth-mark" aria-hidden="true">
            SG
          </span>
          <p className="auth-brand">{brand}</p>
          <p className="auth-tagline">{tagline}</p>
          <span className="auth-rail-line" aria-hidden="true" />
        </aside>
        <section className="auth-stage">
          <div className="auth-toolbar">{languageSelector}</div>
          <article className="auth-card">
            <header className="auth-header">
              <p className="auth-kicker">{brand}</p>
              <h1>{title}</h1>
              {intro ? <p>{intro}</p> : null}
            </header>
            {children}
          </article>
        </section>
      </main>
    </div>
  );
}
