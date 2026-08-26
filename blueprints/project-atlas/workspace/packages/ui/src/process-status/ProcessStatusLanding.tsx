import type { ClientProcessLandingDto, ProcessLocale } from "@atlas/client-process-status";
import { getProcessStatusCopy } from "@atlas/i18n";
import { ProcessStatusState } from "./ProcessStatusStates.tsx";
import "./ProcessStatus.module.css";
export function ProcessStatusLanding({
  locale,
  dto,
}: {
  locale: ProcessLocale;
  dto: ClientProcessLandingDto;
}) {
  const copy = getProcessStatusCopy(locale);
  return (
    <main className="m010-process">
      <header className="m010-hero">
        <span>{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <p>
          <strong>{copy.context}:</strong> {dto.context.label}
        </p>
      </header>
      {dto.availability !== "fresh" ? (
        <ProcessStatusState
          locale={locale}
          state={
            dto.availability === "empty"
              ? "empty"
              : dto.availability === "unavailable"
                ? "unavailable"
                : dto.availability === "partial"
                  ? "partial"
                  : dto.availability === "stale"
                    ? "stale"
                    : "unconfirmed"
          }
        />
      ) : (
        <section aria-labelledby="m010-choose">
          <h2 id="m010-choose">{copy.choose}</h2>
          <ul className="m010-choice-grid">
            {dto.choices.map((choice) => (
              <li key={choice.serviceRef}>
                <article>
                  <p>{choice.context.label}</p>
                  <h3>{choice.serviceLabel}</h3>
                  {choice.instanceLabel ? <p>{choice.instanceLabel}</p> : null}
                  <a
                    href={"/client/status/" + encodeURIComponent(choice.serviceRef)}
                    aria-label={
                      copy.view +
                      ": " +
                      choice.serviceLabel +
                      (choice.instanceLabel ? ", " + choice.instanceLabel : "")
                    }
                  >
                    {copy.view}
                  </a>
                </article>
              </li>
            ))}
          </ul>
          {dto.hasMore && dto.cursor ? (
            <a
              className="m010-more"
              href={"/client/status?cursor=" + encodeURIComponent(dto.cursor)}
            >
              {copy.loadMore}
            </a>
          ) : null}
        </section>
      )}
    </main>
  );
}
