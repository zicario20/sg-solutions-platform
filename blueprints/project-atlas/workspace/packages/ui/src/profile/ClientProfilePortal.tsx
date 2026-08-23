import { type ClientProfileLocale, clientProfileCopy } from "@atlas/i18n";
export function ClientProfilePortal({ locale }: { locale: ClientProfileLocale }) {
  const copy = clientProfileCopy[locale];
  return (
    <section className="profile-portal" aria-labelledby="profile-title">
      <header>
        <p>{copy.eyebrow}</p>
        <h1 id="profile-title">{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <section className="profile-notice" aria-live="polite">
        <h2>{copy.noticeTitle}</h2>
        <p>{copy.notice}</p>
      </section>
      <section aria-label={copy.title}>
        <ul className="profile-steps">
          {copy.sections.map((item, index) => (
            <li key={item}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </section>
      <aside className="profile-safety">
        <h2>{copy.avoidTitle}</h2>
        <p>{copy.avoid}</p>
      </aside>
      <footer>
        <a className="portal-cta" href="/client/help">
          {copy.support}
        </a>
        <a href="/client/settings/account">{copy.back}</a>
      </footer>
    </section>
  );
}
