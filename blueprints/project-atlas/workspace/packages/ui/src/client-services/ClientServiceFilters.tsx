import type { ClientServicesCopy } from "@atlas/i18n";
import { CLIENT_SERVICE_PUBLIC_STATES } from "@atlas/client-services";

export function ClientServiceFilters({ copy, query = "", status = "" }: { copy: ClientServicesCopy; query?: string; status?: string }) {
  return <form className="m009-filters" method="get" action="/client/services" role="search"><label><span>{copy.searchLabel}</span><input name="q" defaultValue={query} maxLength={80} placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} /></label><label><span>{copy.filterLabel}</span><select name="status" defaultValue={status} aria-label={copy.filterLabel}><option value="">{copy.allStatuses}</option>{CLIENT_SERVICE_PUBLIC_STATES.map((state)=><option key={state} value={state}>{copy.states[state]}</option>)}</select></label><button type="submit">{copy.apply}</button><a href="/client/services">{copy.clear}</a></form>;
}
