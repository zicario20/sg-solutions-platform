import { ClientPortalShell } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../lib/dashboard/page-context.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page() {
  const { locale } = await requireDashboardPageContext();
  const copy =
    locale === "es"
      ? {
          title: "Pagos y facturación",
          body: "Consulta obligaciones, comprobantes autorizados y estados verificados directamente con el proveedor.",
          notice: "Los pagos en línea aún no están habilitados. No se ha realizado ningún cobro.",
          heading: "Antes de pagar",
          detail:
            "Un pago confirmado no inicia un servicio automáticamente. SG Solutions revisa por separado los requisitos y la autorización interna.",
          action: "Contactar facturación",
        }
      : {
          title: "Payments and billing",
          body: "Review obligations, authorized receipts, and statuses verified directly with the provider.",
          notice: "Online payments are not enabled yet. No charge has been made.",
          heading: "Before paying",
          detail:
            "A confirmed payment does not start a service automatically. SG Solutions separately reviews requirements and internal authorization.",
          action: "Contact billing",
        };
  return (
    <ClientPortalShell locale={locale} activeRoute="payments">
      <section aria-labelledby="billing-title">
        <p>SG Solutions</p>
        <h1 id="billing-title">{copy.title}</h1>
        <p>{copy.body}</p>
        <section className="dashboard-notice dashboard-notice-unconfirmed" role="status">
          <span className="dashboard-notice-icon" aria-hidden="true">
            i
          </span>
          <p>{copy.notice}</p>
        </section>
        <section className="dashboard-support" aria-labelledby="billing-guidance">
          <span aria-hidden="true">$</span>
          <div>
            <h2 id="billing-guidance">{copy.heading}</h2>
            <p>{copy.detail}</p>
            <a href="/client/messages">{copy.action}</a>
          </div>
        </section>
      </section>
    </ClientPortalShell>
  );
}
