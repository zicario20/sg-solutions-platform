import type { ClientServiceCardDto, ClientServiceLocale } from "@atlas/client-services";
import { getClientServicesCopy } from "@atlas/i18n";
import { ClientServiceCard } from "./ClientServiceCard.tsx";
import { ClientServiceFilters } from "./ClientServiceFilters.tsx";
import { ClientServiceState } from "./ClientServiceStates.tsx";
import "./ClientServices.module.css";

export function ClientServicesDirectory({ locale, state, context, items = [], query, status }: { locale: ClientServiceLocale; state: "ready" | "empty" | "filter-empty" | "partial" | "stale" | "unavailable"; context?: {type:"personal"|"organization";label:string};items?: readonly ClientServiceCardDto[]; query?: string; status?: string }) { const copy = getClientServicesCopy(locale); return <main className="m009-services"><header className="m009-hero"><span className="m009-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p>{context?<p className="m009-context"><strong>{copy.context}:</strong> {context.label}</p>:null}</header><ClientServiceFilters copy={copy} query={query} status={status} />{state === "ready" || state==="partial" ? <>{state==="partial"?<ClientServiceState locale={locale} state="partial"/>:null}<section className="m009-grid" aria-label={copy.title}>{items.map((item) => <ClientServiceCard key={item.opaqueRef} item={item} locale={locale} />)}</section></> : <ClientServiceState locale={locale} state={state} />}</main>; }
