import {
  type ClientProcessDetailDto,
  PROCESS_SECTION_NAMES,
  type ProcessLocale,
} from "@atlas/client-process-status";
import { getProcessStatusCopy } from "@atlas/i18n";

const href = {
  services: "/client/services",
  status: "/client/status",
  documents: "/client/documents",
  appointments: "/client/appointments",
  messages: "/client/messages",
  payments: "/client/payments",
  help: "/client/help",
  support: "/client/help",
} as const;
export function ProcessSections({
  locale,
  sections,
}: {
  locale: ProcessLocale;
  sections: ClientProcessDetailDto["sections"];
}) {
  const copy = getProcessStatusCopy(locale);
  return (
    <div className="m010-sections">
      {PROCESS_SECTION_NAMES.map((name) => {
        const section = sections[name];
        return (
          <section key={name} aria-labelledby={`m010-${name}`}>
            <h2 id={`m010-${name}`}>{copy.sections[name]}</h2>
            {section?.state === "fresh" ? (
              <ul>
                {section.items.map((item) => (
                  <li key={`${item.label}:${item.statusLabel ?? ""}:${item.date ?? ""}`}>
                    <span>{item.label}</span>
                    {item.statusLabel ? <strong>{item.statusLabel}</strong> : null}
                    {item.date ? (
                      <time dateTime={item.date}>
                        {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                          new Date(item.date),
                        )}
                      </time>
                    ) : null}
                    {item.routeKey ? <a href={href[item.routeKey]}>{copy.view}</a> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status">
                {section?.state === "empty"
                  ? copy.sectionEmpty
                  : section?.state === "stale"
                    ? copy.sectionStale
                    : copy.sectionUnavailable}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
