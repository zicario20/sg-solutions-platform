import type {
  ClientServiceLocale,
  ClientServicePublicState,
  ClientServiceSectionName,
} from "@atlas/client-services";

export interface ClientServicesCopy {
  title: string;
  eyebrow: string;
  intro: string;
  searchLabel: string;
  searchPlaceholder: string;
  filterLabel: string;
  allStatuses: string;
  apply: string;
  clear: string;
  open: string;
  openFor: (service: string, reference: string) => string;
  back: string;
  reference: string;
  updated: string;
  nextStep: string;
  context: string;
  milestone: string;
  progress: string;
  emptyTitle: string;
  emptyBody: string;
  filterEmptyTitle: string;
  filterEmptyBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  partialTitle: string;
  staleTitle: string;
  sectionEmpty: string;
  sectionUnavailable: string;
  sectionStale: string;
  states: Record<ClientServicePublicState, string>;
  sections: Record<ClientServiceSectionName, string>;
  axes: { commercial: string; financial: string; activation: string; fulfillment: string };
}

const es: ClientServicesCopy = {
  title: "Mis servicios",
  eyebrow: "Tu trabajo con SG Solutions",
  intro:
    "Consulta el estado público, los próximos pasos y la información disponible de cada servicio autorizado.",
  searchLabel: "Buscar servicios",
  searchPlaceholder: "Referencia o servicio",
  filterLabel: "Filtrar por estado",
  allStatuses: "Todos los estados",
  apply: "Aplicar",
  clear: "Limpiar",
  open: "Ver detalle",
  openFor: (service, reference) => `Ver detalle de ${service}, ${reference}`,
  back: "Volver a Mis servicios",
  reference: "Referencia",
  updated: "Verificado",
  nextStep: "Próximo paso",
  context: "Contexto",
  milestone: "Hito actual",
  progress: "Progreso de hitos",
  emptyTitle: "Aún no hay servicios disponibles",
  emptyBody: "Cuando exista un servicio autorizado para este contexto, aparecerá aquí.",
  filterEmptyTitle: "No hay resultados para estos filtros",
  filterEmptyBody: "Cambia la búsqueda o el estado para ver otros servicios.",
  unavailableTitle: "No podemos mostrar tus servicios ahora",
  unavailableBody: "Tus datos permanecen protegidos. Inténtalo de nuevo más tarde.",
  partialTitle: "Parte de la información no está disponible",
  staleTitle: "La información necesita actualizarse",
  sectionEmpty: "No hay elementos disponibles en esta sección.",
  sectionUnavailable: "Esta sección no está disponible en este momento.",
  sectionStale: "Esta información necesita actualizarse y no se mostrará hasta entonces.",
  states: {
    preliminary: "Preliminar",
    payment_pending: "Pago pendiente",
    pending_review: "En revisión",
    approved_to_start: "Aprobado para iniciar",
    in_progress: "En curso",
    waiting_client: "Esperando tu acción",
    waiting_external: "Esperando a un tercero",
    completed: "Completado",
    cancelled: "Cancelado",
    partially_refunded: "Reembolso parcial",
    refunded: "Reembolsado",
    disputed: "En disputa",
    unconfirmed: "Por confirmar",
  },
  sections: {
    timeline: "Cronología",
    tasks: "Tareas",
    documents: "Documentos",
    payments: "Pagos",
    appointments: "Citas",
    messages: "Mensajes",
    agreements: "Acuerdos",
    deliverables: "Entregables",
  },
  axes: {
    commercial: "Comercial",
    financial: "Financiero",
    activation: "Activación",
    fulfillment: "Ejecución",
  },
};

const en: ClientServicesCopy = {
  title: "My services",
  eyebrow: "Your work with SG Solutions",
  intro:
    "Review the public status, next steps, and available information for each authorized service.",
  searchLabel: "Search services",
  searchPlaceholder: "Reference or service",
  filterLabel: "Filter by status",
  allStatuses: "All statuses",
  apply: "Apply",
  clear: "Clear",
  open: "View details",
  openFor: (service, reference) => `View details for ${service}, ${reference}`,
  back: "Back to My services",
  reference: "Reference",
  updated: "Verified",
  nextStep: "Next step",
  context: "Context",
  milestone: "Current milestone",
  progress: "Milestone progress",
  emptyTitle: "No services are available yet",
  emptyBody: "When an authorized service exists for this context, it will appear here.",
  filterEmptyTitle: "No services match these filters",
  filterEmptyBody: "Change the search or status to view other services.",
  unavailableTitle: "We cannot show your services right now",
  unavailableBody: "Your data remains protected. Please try again later.",
  partialTitle: "Some information is unavailable",
  staleTitle: "Information needs to be refreshed",
  sectionEmpty: "No items are available in this section.",
  sectionUnavailable: "This section is not available right now.",
  sectionStale: "This information must be refreshed before it can be shown.",
  states: {
    preliminary: "Preliminary",
    payment_pending: "Payment pending",
    pending_review: "Under review",
    approved_to_start: "Approved to start",
    in_progress: "In progress",
    waiting_client: "Waiting for you",
    waiting_external: "Waiting for a third party",
    completed: "Completed",
    cancelled: "Cancelled",
    partially_refunded: "Partially refunded",
    refunded: "Refunded",
    disputed: "Disputed",
    unconfirmed: "Unconfirmed",
  },
  sections: {
    timeline: "Timeline",
    tasks: "Tasks",
    documents: "Documents",
    payments: "Payments",
    appointments: "Appointments",
    messages: "Messages",
    agreements: "Agreements",
    deliverables: "Deliverables",
  },
  axes: {
    commercial: "Commercial",
    financial: "Financial",
    activation: "Activation",
    fulfillment: "Fulfillment",
  },
};

export function getClientServicesCopy(locale: ClientServiceLocale): ClientServicesCopy {
  return locale === "en" ? en : es;
}
