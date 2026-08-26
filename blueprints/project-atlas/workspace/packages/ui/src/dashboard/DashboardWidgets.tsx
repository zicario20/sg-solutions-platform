import type {
  AppointmentDashboardItem,
  DashboardContextOption,
  DashboardLocale,
  DashboardRouteKey,
  DashboardSection,
  DocumentDashboardItem,
  HelpDashboardItem,
  MessageDashboardItem,
  NotificationDashboardItem,
  PaymentDashboardItem,
  ServiceDashboardItem,
  TaskDashboardItem,
} from "@atlas/dashboard";
import { dashboardCopy } from "@atlas/i18n";
import type { ReactNode } from "react";
import { DASHBOARD_ROUTE_HREFS } from "./ClientPortalShell.tsx";
import { DashboardStateNotice } from "./DashboardStates.tsx";

type WidgetCode =
  | "services"
  | "tasks"
  | "documents"
  | "appointments"
  | "payments"
  | "messages"
  | "notifications"
  | "help";
const clickEvent: Readonly<Record<WidgetCode, string>> = Object.freeze({
  services: "client_dashboard_service_card_clicked",
  tasks: "client_dashboard_task_clicked",
  documents: "client_dashboard_document_upload_clicked",
  appointments: "client_dashboard_appointment_clicked",
  payments: "client_dashboard_payment_clicked",
  messages: "client_dashboard_message_clicked",
  notifications: "client_dashboard_widget_state",
  help: "client_dashboard_help_resource_clicked",
});
function WidgetCard({
  locale,
  code,
  section,
  children,
}: Readonly<{
  locale: DashboardLocale;
  code: WidgetCode;
  section: DashboardSection<unknown>;
  children?: ReactNode;
}>) {
  const copy = dashboardCopy[locale];
  const titleId = `dashboard-${code}-title`;
  const notice =
    section.state === "empty" || section.state === "unavailable" || section.state === "stale"
      ? section.state
      : undefined;
  return (
    <section
      className={`dashboard-widget widget-${code}`}
      data-widget={code}
      data-section-state={section.state}
      aria-labelledby={titleId}
    >
      <header>
        <h2 id={titleId}>{copy.widgets[code]}</h2>
        {section.asOf ? <small>{copy.labels.updated}</small> : null}
      </header>
      {notice ? <DashboardStateNotice locale={locale} state={notice} compact /> : children}
    </section>
  );
}
function ItemLink({
  href,
  event,
  widget,
  children,
}: Readonly<{ href: string; event: string; widget: WidgetCode; children: ReactNode }>) {
  return (
    <a
      className="dashboard-item-link"
      href={href}
      data-dashboard-event={event}
      data-dashboard-widget={widget}
    >
      {children}
      <span aria-hidden="true">-&gt;</span>
    </a>
  );
}
function Meta({ label, value }: Readonly<{ label: string; value?: string | number }>) {
  return value === undefined ? null : (
    <span>
      <b>{label}:</b> {value}
    </span>
  );
}
function route(item: { routeKey: DashboardRouteKey; cta?: { routeKey: DashboardRouteKey } }) {
  return DASHBOARD_ROUTE_HREFS[item.cta?.routeKey ?? item.routeKey];
}
export function ServicesWidget({
  locale,
  section,
}: Readonly<{
  locale: DashboardLocale;
  section: DashboardSection<readonly ServiceDashboardItem[]>;
}>) {
  const copy = dashboardCopy[locale];
  return (
    <WidgetCard locale={locale} code="services" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.services} widget="services">
                <strong>{item.title}</strong>
                <Meta label={copy.labels.status} value={item.statusLabel} />
                <Meta label={copy.labels.nextStep} value={item.nextStepLabel} />
                <Meta label={copy.labels.started} value={item.startDate} />
                <Meta label={copy.labels.pendingTasks} value={item.pendingTaskCount} />
                <Meta label={copy.labels.documents} value={item.documentSummaryLabel} />
                <Meta label={copy.labels.payment} value={item.paymentSummaryLabel} />
                {item.milestoneLabels?.length ? (
                  <span>
                    <b>{copy.labels.milestones}:</b> {item.milestoneLabels.join(" / ")}
                  </span>
                ) : null}
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function TasksWidget({
  locale,
  section,
}: Readonly<{ locale: DashboardLocale; section: DashboardSection<readonly TaskDashboardItem[]> }>) {
  const copy = dashboardCopy[locale];
  return (
    <WidgetCard locale={locale} code="tasks" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.tasks} widget="tasks">
                <strong>{item.title}</strong>
                <Meta label={copy.labels.status} value={item.statusLabel} />
                <Meta label={copy.labels.priority} value={item.priorityLabel} />
                <Meta label={copy.labels.due} value={item.dueLabel} />
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function DocumentsWidget({
  locale,
  section,
}: Readonly<{
  locale: DashboardLocale;
  section: DashboardSection<readonly DocumentDashboardItem[]>;
}>) {
  const copy = dashboardCopy[locale];
  return (
    <WidgetCard locale={locale} code="documents" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.documents} widget="documents">
                <strong>{item.title}</strong>
                <Meta label={copy.labels.status} value={item.statusLabel} />
                <Meta label={copy.labels.reason} value={item.reasonLabel} />
                <Meta label={copy.labels.due} value={item.dueLabel} />
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function AppointmentsWidget({
  locale,
  section,
}: Readonly<{
  locale: DashboardLocale;
  section: DashboardSection<readonly AppointmentDashboardItem[]>;
}>) {
  const copy = dashboardCopy[locale];
  return (
    <WidgetCard locale={locale} code="appointments" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.appointments} widget="appointments">
                <strong>{item.dateLabel}</strong>
                <Meta label={copy.labels.status} value={item.statusLabel} />
                <Meta label={copy.labels.timeZone} value={item.timeZoneLabel} />
                <Meta label={copy.labels.type} value={item.typeLabel} />
                <Meta label={copy.labels.specialist} value={item.specialistLabel} />
                <Meta label={copy.labels.modality} value={item.modalityLabel} />
                <Meta label={copy.labels.instructions} value={item.instructionsLabel} />
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function PaymentsWidget({
  locale,
  section,
}: Readonly<{
  locale: DashboardLocale;
  section: DashboardSection<readonly PaymentDashboardItem[]>;
}>) {
  const copy = dashboardCopy[locale];
  return (
    <WidgetCard locale={locale} code="payments" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.payments} widget="payments">
                <strong>{item.orderLabel ?? item.statusLabel}</strong>
                <Meta label={copy.labels.status} value={item.statusLabel} />
                <Meta
                  label={copy.labels.amount}
                  value={
                    item.amountLabel
                      ? `${item.amountLabel}${item.currencyCode ? ` ${item.currencyCode}` : ""}`
                      : undefined
                  }
                />
                <Meta label={copy.labels.due} value={item.dateLabel} />
                <Meta label={copy.labels.balance} value={item.balanceLabel} />
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function MessagesWidget({
  locale,
  section,
}: Readonly<{
  locale: DashboardLocale;
  section: DashboardSection<readonly MessageDashboardItem[]>;
}>) {
  const copy = dashboardCopy[locale];
  return (
    <WidgetCard locale={locale} code="messages" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.messages} widget="messages">
                <strong>{item.subject}</strong>
                <span>
                  {item.receivedLabel}
                  {item.unread ? ` - ${copy.labels.unread}` : ""}
                </span>
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function NotificationsWidget({
  locale,
  section,
}: Readonly<{
  locale: DashboardLocale;
  section: DashboardSection<readonly NotificationDashboardItem[]>;
}>) {
  return (
    <WidgetCard locale={locale} code="notifications" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.notifications} widget="notifications">
                <strong>{item.title}</strong>
                <span>{item.statusLabel}</span>
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function HelpWidget({
  locale,
  section,
}: Readonly<{ locale: DashboardLocale; section: DashboardSection<readonly HelpDashboardItem[]> }>) {
  return (
    <WidgetCard locale={locale} code="help" section={section}>
      {section.state === "fresh" && section.data ? (
        <ul className="dashboard-list">
          {section.data.map((item) => (
            <li key={item.opaqueRef}>
              <ItemLink href={route(item)} event={clickEvent.help} widget="help">
                <strong>{item.title}</strong>
                {item.description ? <span>{item.description}</span> : null}
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetCard>
  );
}
export function SupportWidget({ locale }: Readonly<{ locale: DashboardLocale }>) {
  const copy = dashboardCopy[locale];
  return (
    <aside
      className="dashboard-support"
      data-widget="support"
      aria-labelledby="dashboard-support-title"
    >
      <span aria-hidden="true">?</span>
      <div>
        <h2 id="dashboard-support-title">{copy.widgets.support}</h2>
        <p>{copy.support}</p>
        <a
          href={DASHBOARD_ROUTE_HREFS.support}
          data-dashboard-event="client_dashboard_help_resource_clicked"
          data-dashboard-widget="support"
        >
          {copy.actions.support}
        </a>
      </div>
    </aside>
  );
}
export function ContextSwitchControl({
  locale,
  csrfToken,
  activeContext,
  options,
}: Readonly<{
  locale: DashboardLocale;
  csrfToken: string;
  activeContext: string;
  options: readonly DashboardContextOption[];
}>) {
  const copy = dashboardCopy[locale];
  const bounded = options.slice(0, 10);
  return (
    <form className="context-switch" action="/api/client/dashboard/context" method="post">
      <label htmlFor="dashboard-context">{copy.context.switchLabel}</label>
      <select id="dashboard-context" name="context" defaultValue={activeContext}>
        {bounded.map((option) => (
          <option value={option.opaqueRef} key={option.opaqueRef}>
            {option.label}
          </option>
        ))}
      </select>
      <input type="hidden" name="csrf" value={csrfToken} />
      <button type="submit">{copy.context.switchLabel}</button>
    </form>
  );
}
