import type { ProcessActionDto, ProcessLocale } from "@atlas/client-process-status";
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
export function ProcessNextAction({
  locale,
  action,
}: {
  locale: ProcessLocale;
  action: ProcessActionDto;
}) {
  const copy = getProcessStatusCopy(locale);
  return (
    <section className="m010-next" aria-labelledby="m010-next">
      <h2 id="m010-next">{copy.nextAction}</h2>
      <strong>{action.label}</strong>
      <p>
        {copy.responsible}: {copy.parties[action.responsibleParty]}
      </p>
      <a href={href[action.routeKey]}>{action.label}</a>
    </section>
  );
}
