import { ClientPortalShell } from "@atlas/ui";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createConfiguredBookkeepingRuntime } from "../../../lib/bookkeeping/runtime.ts";
import {
  DASHBOARD_CONTEXT_COOKIE,
  DASHBOARD_SESSION_COOKIE,
} from "../../../lib/dashboard/auth-context.ts";
import { resolveDashboardLocale } from "../../../lib/dashboard/locale.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientBookkeepingPage() {
  const store = await cookies();
  const locale = resolveDashboardLocale(
    store.get("atlas_locale")?.value,
    process.env.ATLAS_DEFAULT_LOCALE,
  );
  const sessionHandle = store.get(DASHBOARD_SESSION_COOKIE)?.value;
  if (!sessionHandle) redirect("/client/sign-in");
  const runtime = createConfiguredBookkeepingRuntime();
  if (runtime.kind !== "ready")
    return (
      <ClientPortalShell locale={locale} activeRoute="services" contextType="personal">
        <BookkeepingUnavailable locale={locale} />
      </ClientPortalShell>
    );
  const decision = await runtime.resolveActor({
    sessionHandle,
    requestedContext: store.get(DASHBOARD_CONTEXT_COOKIE)?.value,
    locale,
  });
  if (decision.kind !== "authorized") redirect("/client/sign-in");
  const items = await runtime.gateway.listAuthorizedBooks({ actor: decision.actor });
  return (
    <ClientPortalShell
      locale={locale}
      activeRoute="services"
      contextType={decision.actor.contextType}
    >
      <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
            {locale === "en" ? "Financial records" : "Registros financieros"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {locale === "en" ? "Your bookkeeping workspace" : "Tu espacio de contabilidad"}
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            {locale === "en"
              ? "View the bookkeeping records that SG Solutions has prepared for your active context."
              : "Consulta los registros contables que SG Solutions ha preparado para tu contexto activo."}
          </p>
        </header>
        <section
          className="rounded-3xl border border-amber-200 bg-amber-50 p-5"
          aria-labelledby="bookkeeping-boundary"
        >
          <h2 id="bookkeeping-boundary" className="font-semibold text-amber-950">
            {locale === "en" ? "Connections are not active" : "Las conexiones no están activas"}
          </h2>
          <p className="mt-2 text-sm text-amber-900">
            {locale === "en"
              ? "Connections stay disabled. This workspace does not connect accounts, submit tax filings, or change financial records from the client portal."
              : "Las conexiones permanecen deshabilitadas. Este espacio no conecta cuentas, presenta declaraciones fiscales ni cambia registros financieros desde el portal del cliente."}
          </p>
        </section>
        {items.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              {locale === "en"
                ? "No bookkeeping records are available yet"
                : "Aún no hay registros contables disponibles"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
              {locale === "en"
                ? "Your team will let you know when a bookkeeping workspace is ready to review."
                : "Tu equipo te avisará cuando un espacio contable esté listo para revisar."}
            </p>
          </section>
        ) : (
          <section aria-labelledby="bookkeeping-books" className="space-y-3">
            <h2 id="bookkeeping-books" className="text-xl font-semibold text-slate-950">
              {locale === "en" ? "Available books" : "Libros disponibles"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item, index) => (
                <article
                  key={item.bookRef}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-sky-700">
                    {locale === "en" ? `Record ${index + 1}` : `Registro ${index + 1}`}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {locale === "en" ? "Bookkeeping record" : "Registro contable"}
                  </h3>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">{locale === "en" ? "Basis" : "Base"}</dt>
                      <dd className="font-medium text-slate-900">
                        {bookkeepingBasisLabel(locale, item.accountingBasis)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{locale === "en" ? "Status" : "Estado"}</dt>
                      <dd className="font-medium text-slate-900">
                        {bookkeepingStatusLabel(locale, item.status)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </ClientPortalShell>
  );
}

function bookkeepingBasisLabel(locale: "es" | "en", basis: "cash" | "accrual") {
  if (locale === "en") return basis === "cash" ? "Cash basis" : "Accrual basis";
  return basis === "cash" ? "Base de efectivo" : "Base devengada";
}

function bookkeepingStatusLabel(locale: "es" | "en", status: string) {
  const labels = {
    setup: locale === "en" ? "Being prepared" : "En preparación",
    active: locale === "en" ? "Active" : "Activo",
    soft_closed: locale === "en" ? "Reviewed period" : "Periodo revisado",
    hard_closed: locale === "en" ? "Closed period" : "Periodo cerrado",
    archived: locale === "en" ? "Archived" : "Archivado",
  };
  return labels[status as keyof typeof labels] ?? (locale === "en" ? "Available" : "Disponible");
}

function BookkeepingUnavailable({ locale }: { locale: "es" | "en" }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">
          {locale === "en"
            ? "Bookkeeping is temporarily unavailable"
            : "La contabilidad no está disponible temporalmente"}
        </h1>
        <p className="mt-3 text-slate-600">
          {locale === "en"
            ? "Please contact SG Solutions if you need help with your records."
            : "Comunícate con SG Solutions si necesitas ayuda con tus registros."}
        </p>
      </section>
    </main>
  );
}
