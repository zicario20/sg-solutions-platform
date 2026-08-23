import { ClientPortalShell } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page() {
  const { locale } = await requireDashboardPageContext();
  const copy =
    locale === "es"
      ? {
          title: "Citas",
          body: "Tu agenda mostrará citas confirmadas, pendientes y pasadas cuando la fuente de agenda autorizada esté configurada.",
          action: "Contactar soporte",
        }
      : {
          title: "Appointments",
          body: "Your schedule will show confirmed, pending, and past appointments when the authorized scheduling source is configured.",
          action: "Contact support",
        };
  return (
    <ClientPortalShell locale={locale} activeRoute="appointments">
      <section aria-labelledby="appointments-title">
        <p>SG Solutions</p>
        <h1 id="appointments-title">{copy.title}</h1>
        <p>{copy.body}</p>
        <div role="status">
          <p>
            {locale === "es"
              ? "No hay citas confirmadas para mostrar en este momento."
              : "There are no confirmed appointments to show right now."}
          </p>
        </div>
        <a href="/client/messages">{copy.action}</a>
      </section>
    </ClientPortalShell>
  );
}
