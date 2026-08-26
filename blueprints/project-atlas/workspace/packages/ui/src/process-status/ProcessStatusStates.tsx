import type { ProcessAvailability, ProcessLocale } from "@atlas/client-process-status";
import { getProcessStatusCopy } from "@atlas/i18n";
export function ProcessStatusState({
  locale,
  state,
}: {
  locale: ProcessLocale;
  state: Extract<
    ProcessAvailability,
    "empty" | "unavailable" | "unconfirmed" | "partial" | "stale"
  >;
}) {
  const copy = getProcessStatusCopy(locale),
    content =
      state === "empty"
        ? [copy.emptyTitle, copy.emptyBody]
        : state === "unavailable"
          ? [copy.unavailableTitle, copy.unavailableBody]
          : state === "unconfirmed"
            ? [copy.unconfirmedTitle, copy.unconfirmedBody]
            : state === "partial"
              ? [copy.partialTitle, copy.partialBody]
              : [copy.staleTitle, copy.staleBody];
  return (
    <section className={"m010-state m010-state-" + state} role="status" aria-live="polite">
      <h2>{content[0]}</h2>
      <p>{content[1]}</p>
      {state === "empty" || state === "unavailable" ? (
        <a href="/client/help">{copy.support}</a>
      ) : null}
    </section>
  );
}
