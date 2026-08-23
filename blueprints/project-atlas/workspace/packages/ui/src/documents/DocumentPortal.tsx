import type { DashboardLocale } from "@atlas/dashboard";
import { documentCopy } from "@atlas/i18n";

export type DocumentPortalRow = Readonly<{
  opaqueRef: string;
  title: string;
  status: "received" | "processing" | "correction";
  legalHold?: boolean;
}>;

export function DocumentPortal({
  locale,
  state,
  documents,
}: Readonly<{
  locale: DashboardLocale;
  state: "ready" | "empty" | "unavailable";
  documents: readonly DocumentPortalRow[];
}>) {
  const copy = documentCopy[locale];
  return (
    <main className="document-portal" aria-labelledby="documents-title">
      <header className="document-portal-header">
        <p>{copy.eyebrow}</p>
        <h1 id="documents-title">{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <section className="document-guidance" aria-labelledby="document-guidance-title">
        <h2 id="document-guidance-title">{copy.allowedTitle}</h2>
        <p>{copy.allowedBody}</p>
      </section>
      {state === "unavailable" ? (
        <section className="document-notice" role="status" aria-live="polite">
          <h2>{copy.unavailableTitle}</h2>
          <p>{copy.unavailableBody}</p>
        </section>
      ) : null}
      {state === "empty" ? (
        <section className="document-empty" role="status">
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.emptyBody}</p>
        </section>
      ) : null}
      {documents.length > 0 ? (
        <section aria-label={copy.title}>
          <ul className="document-list">
            {documents.map((document) => (
              <li key={document.opaqueRef}>
                <div>
                  <h2>{document.title}</h2>
                  <p>
                    {document.status === "received"
                      ? copy.received
                      : document.status === "processing"
                        ? copy.processing
                        : copy.correction}
                  </p>
                  {document.legalHold ? <p>{copy.legalHold}</p> : null}
                </div>
                <button type="button" disabled={state !== "ready"}>
                  {copy.upload}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
