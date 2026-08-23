import { ClientPortalShell } from "@atlas/ui";
import { cookies } from "next/headers";
import { DASHBOARD_CSRF_COOKIE } from "../../../lib/dashboard/auth-context.ts";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";
import { AppointmentsClient } from "./appointments-client.tsx";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page() {
  const { locale } = await requireDashboardPageContext();
  const csrfToken = (await cookies()).get(DASHBOARD_CSRF_COOKIE)?.value;
  const copy =
    locale === "es"
      ? {
          title: "Citas",
          body: "Revisa tus citas, consulta horarios disponibles y administra cambios permitidos desde un solo lugar.",
          action: "Contactar soporte",
        }
      : {
          title: "Appointments",
          body: "Review your appointments, see available times, and manage permitted changes in one place.",
          action: "Contact support",
        };
  return (
    <ClientPortalShell locale={locale} activeRoute="appointments">
      <section aria-labelledby="appointments-title">
        <p>SG Solutions</p>
        <h1 id="appointments-title">{copy.title}</h1>
        <p>{copy.body}</p>
        <AppointmentsClient locale={locale} csrfToken={csrfToken} />
        <a href="/client/messages">{copy.action}</a>
      </section>
    </ClientPortalShell>
  );
}
