import type { PublicPage, PublicService } from "../domain/public-site";
import { createPageExperience } from "./page-experience";
import {
  createServiceContentRepository,
  isServiceContentRoute,
  materializeServiceContentSnapshot,
  type ServiceContentProvider,
  type ServiceContentRepository,
  serviceContentRepository,
} from "./service-content-repository";

interface PageDefinition {
  routeKey: PublicPage["routeKey"];
  kind: PublicPage["kind"];
  es: Pick<PublicPage, "path" | "title" | "description">;
  en: Pick<PublicPage, "path" | "title" | "description">;
}

export const CLIENT_ROUTE_KEYS = new Set<PublicPage["routeKey"]>([
  "portal-auth",
  "customer-dashboard",
  "my-services",
  "process-status",
  "portal-documents",
  "secure-messaging",
  "client-appointments",
  "client-billing",
  "financial-profile",
]);

export const ADMIN_ROUTE_KEYS = new Set<PublicPage["routeKey"]>([
  "admin-contacts",
  "admin-dashboard",
  "crm",
  "client-management",
  "company-management",
  "lead-management",
  "service-orders",
  "admin-forms",
  "admin-work-queues",
  "admin-approvals",
  "admin-ai-hub",
  "admin-operations",
  "admin-governance",
  "admin-analytics",
  "admin-tradelines",
  "admin-bookkeeping",
  "admin-tax-services",
  "admin-recommendation-engine",
  "admin-creditcardbroker-integration",
  "admin-partner-management",
  "admin-provider-abstraction",
]);

const resolveSurface = (routeKey: PublicPage["routeKey"]): PublicPage["surface"] => {
  if (CLIENT_ROUTE_KEYS.has(routeKey)) return "client";
  if (ADMIN_ROUTE_KEYS.has(routeKey)) return "admin";
  return "public";
};

const ensureSearchIndex = (
  surface: PublicPage["surface"],
  publicationState: PublicPage["publicationState"],
) => (surface === "public" ? publicationState : "review-required");

const buildLocalePage = (
  definition: PageDefinition,
  locale: PublicPage["locale"],
  contentRepository: ServiceContentRepository,
) => {
  const surface = resolveSurface(definition.routeKey);
  const copy = locale === "es" ? definition.es : definition.en;
  const experience = createPageExperience({
    routeKey: definition.routeKey,
    kind: definition.kind,
    locale,
    title: copy.title,
    description: copy.description,
    serviceContentRepository: contentRepository,
  });
  const serviceContent = isServiceContentRoute(definition.routeKey)
    ? contentRepository.get(definition.routeKey, locale)
    : undefined;
  return {
    routeKey: definition.routeKey,
    surface,
    kind: definition.kind,
    locale,
    ...copy,
    ...(serviceContent
      ? { title: serviceContent.seo.title, description: serviceContent.seo.description }
      : {}),
    ...experience,
    serviceContent,
    publicationState: ensureSearchIndex(surface, experience.publicationState),
  } satisfies PublicPage;
};

const pageDefinitions: PageDefinition[] = [
  {
    routeKey: "home",
    kind: "home",
    es: {
      path: "/",
      title: "SG Solutions | Orientación financiera y empresarial",
      description:
        "Organiza tus próximos pasos de crédito, taxes, negocio, financiamiento y compra de vivienda con orientación bilingüe.",
    },
    en: {
      path: "/en/",
      title: "SG Solutions | Financial and business guidance",
      description:
        "Organize your next steps for credit, taxes, business, funding and home buying with bilingual guidance.",
    },
  },
  {
    routeKey: "services",
    kind: "services",
    es: {
      path: "/servicios/",
      title: "Servicios | SG Solutions",
      description:
        "Explora los servicios de SG Solutions y encuentra un punto de partida claro para tu situación personal o empresarial.",
    },
    en: {
      path: "/en/services/",
      title: "Services | SG Solutions",
      description:
        "Explore SG Solutions services and find a clear starting point for your personal or business situation.",
    },
  },
  {
    routeKey: "service-credit",
    kind: "service",
    es: {
      path: "/servicios/credito/",
      title: "Orientación de crédito | SG Solutions",
      description:
        "Comprende tu perfil de crédito, organiza información y prepara próximos pasos sin promesas de resultados garantizados.",
    },
    en: {
      path: "/en/services/credit/",
      title: "Credit guidance | SG Solutions",
      description:
        "Understand your credit profile, organize information and prepare next steps without promises of guaranteed results.",
    },
  },
  {
    routeKey: "service-credit-monitoring",
    kind: "service",
    es: {
      path: "/servicios/monitoreo-de-credito/",
      title: "Monitoreo de crédito | SG Solutions",
      description:
        "Conoce cómo el monitoreo autorizado puede ayudarte a observar cambios y mantener un seguimiento responsable.",
    },
    en: {
      path: "/en/services/credit-monitoring/",
      title: "Credit monitoring | SG Solutions",
      description:
        "Learn how authorized monitoring can help you observe changes and maintain a responsible follow-up process.",
    },
  },
  {
    routeKey: "service-taxes",
    kind: "service",
    es: {
      path: "/servicios/taxes/",
      title: "Preparación de taxes | SG Solutions",
      description:
        "Organiza documentos e información tributaria con un proceso claro y revisión humana antes de cualquier presentación.",
    },
    en: {
      path: "/en/services/taxes/",
      title: "Tax preparation | SG Solutions",
      description:
        "Organize tax documents and information through a clear process with human review before any filing.",
    },
  },
  {
    routeKey: "service-business-formation",
    kind: "service",
    es: {
      path: "/servicios/formacion-de-negocios/",
      title: "Formación de negocios | SG Solutions",
      description:
        "Prepara la formación de tu empresa con información organizada, documentos claros y seguimiento de próximos pasos.",
    },
    en: {
      path: "/en/services/business-formation/",
      title: "Business formation | SG Solutions",
      description:
        "Prepare your business formation with organized information, clear documents and guided next steps.",
    },
  },
  {
    routeKey: "service-ein",
    kind: "service",
    es: {
      path: "/servicios/ein/",
      title: "Preparación para EIN | SG Solutions",
      description:
        "Organiza la información requerida para un EIN y revisa el proceso antes de una solicitud autorizada.",
    },
    en: {
      path: "/en/services/ein/",
      title: "EIN preparation | SG Solutions",
      description:
        "Organize required EIN information and understand the process before an authorized application.",
    },
  },
  {
    routeKey: "service-business-compliance",
    kind: "service",
    es: {
      path: "/servicios/cumplimiento-empresarial/",
      title: "Cumplimiento empresarial | SG Solutions",
      description:
        "Mantén visibles fechas, documentos y próximos pasos de cumplimiento aplicables a tu empresa.",
    },
    en: {
      path: "/en/services/business-compliance/",
      title: "Business compliance | SG Solutions",
      description:
        "Keep applicable business compliance dates, documents and next steps visible and organized.",
    },
  },
  {
    routeKey: "service-business-funding",
    kind: "service",
    es: {
      path: "/servicios/financiamiento-empresarial/",
      title: "Preparación para financiamiento empresarial | SG Solutions",
      description:
        "Evalúa preparación, documentos y opciones de financiamiento sin garantizar aprobación ni condiciones.",
    },
    en: {
      path: "/en/services/business-funding/",
      title: "Business funding preparation | SG Solutions",
      description:
        "Review readiness, documents and funding options without guaranteeing approval or terms.",
    },
  },
  {
    routeKey: "service-business-credit",
    kind: "service",
    es: {
      path: "/servicios/credito-empresarial/",
      title: "Preparación de business credit | SG Solutions",
      description:
        "Organiza identidad, banca, records y pagos del negocio antes de buscar productos de crédito empresarial.",
    },
    en: {
      path: "/en/services/business-credit/",
      title: "Business credit preparation | SG Solutions",
      description:
        "Organize business identity, banking, records and payments before seeking business credit products.",
    },
  },
  {
    routeKey: "service-loan-preparation",
    kind: "service",
    es: {
      path: "/servicios/preparacion-para-financiamiento/",
      title: "Preparación para préstamos y financiamiento | SG Solutions",
      description:
        "Organiza capacidad de pago, ingresos, obligaciones, crédito y documentos antes de solicitar financiamiento.",
    },
    en: {
      path: "/en/services/financing-preparation/",
      title: "Loan and financing preparation | SG Solutions",
      description:
        "Organize repayment capacity, income, obligations, credit and documents before seeking financing.",
    },
  },
  {
    routeKey: "service-home-buying",
    kind: "service",
    es: {
      path: "/servicios/comprar-casa/",
      title: "Preparación para comprar casa | SG Solutions",
      description:
        "Organiza crédito, presupuesto, documentos y preguntas para conversar con profesionales y prestamistas.",
    },
    en: {
      path: "/en/services/home-buying/",
      title: "Home buying preparation | SG Solutions",
      description:
        "Organize credit, budget, documents and questions for conversations with professionals and lenders.",
    },
  },
  {
    routeKey: "marketplace",
    kind: "service",
    es: {
      path: "/marketplace/",
      title: "Marketplace financiero | SG Solutions",
      description:
        "Conoce categorías de productos de terceros con divulgaciones claras y sin garantías de aprobación.",
    },
    en: {
      path: "/en/marketplace/",
      title: "Financial marketplace | SG Solutions",
      description:
        "Explore third-party product categories with clear disclosures and no approval guarantees.",
    },
  },
  {
    routeKey: "pricing",
    kind: "standard",
    es: {
      path: "/precios/",
      title: "Cómo funcionan los precios | SG Solutions",
      description:
        "Conoce cuándo un servicio requiere evaluación, consulta o cotización antes de publicar un precio.",
    },
    en: {
      path: "/en/pricing/",
      title: "How pricing works | SG Solutions",
      description:
        "Learn when a service requires an evaluation, consultation or quote before a price is published.",
    },
  },
  {
    routeKey: "help-center",
    kind: "standard",
    es: {
      path: "/centro-de-ayuda/",
      title: "Centro de ayuda | SG Solutions",
      description:
        "Guías prácticas y respuestas organizadas para avanzar paso a paso en crédito, taxes, negocios y cumplimiento.",
    },
    en: {
      path: "/en/help-center/",
      title: "Help Center | SG Solutions",
      description:
        "Practical guides and organized answers to move forward step by step in credit, taxes, business and compliance.",
    },
  },
  {
    routeKey: "academy",
    kind: "standard",
    es: {
      path: "/academia/",
      title: "Academia financiera | SG Solutions",
      description:
        "Material educativo público con listas de verificación, glosarios y rutas de preparación para decisiones financieras y empresariales.",
    },
    en: {
      path: "/en/academy/",
      title: "Financial Academy | SG Solutions",
      description:
        "Public educational material with checklists, glossaries and preparation paths for financial and business decisions.",
    },
  },
  {
    routeKey: "faq",
    kind: "standard",
    es: {
      path: "/preguntas-frecuentes/",
      title: "Preguntas frecuentes | SG Solutions",
      description:
        "Respuestas generales sobre evaluaciones, servicios, documentos, precios y próximos pasos.",
    },
    en: {
      path: "/en/faq/",
      title: "Frequently asked questions | SG Solutions",
      description:
        "General answers about evaluations, services, documents, pricing and next steps.",
    },
  },
  {
    routeKey: "about",
    kind: "standard",
    es: {
      path: "/nosotros/",
      title: "Acerca de SG Solutions",
      description:
        "Conoce la visión de una experiencia bilingüe que educa, organiza procesos y mantiene próximos pasos visibles.",
    },
    en: {
      path: "/en/about/",
      title: "About SG Solutions",
      description:
        "Learn about a bilingual experience designed to educate, organize processes and keep next steps visible.",
    },
  },
  {
    routeKey: "contact",
    kind: "standard",
    es: {
      path: "/contacto/",
      title: "Contacto | SG Solutions",
      description:
        "Elige un próximo paso seguro para conversar sobre el servicio que necesitas sin compartir información sensible.",
    },
    en: {
      path: "/en/contact/",
      title: "Contact | SG Solutions",
      description:
        "Choose a safe next step to discuss the service you need without sharing sensitive information.",
    },
  },
  {
    routeKey: "admin-contacts",
    kind: "standard",
    es: {
      path: "/admin/contactos/",
      title: "Contactos | SG Solutions",
      description: "Panel de contacto para operaciones con Chat, WhatsApp y agente telefónico.",
    },
    en: {
      path: "/en/admin/contacts/",
      title: "Contacts | SG Solutions",
      description: "Administrative contacts panel with chat, WhatsApp and phone agent tools.",
    },
  },
  {
    routeKey: "public-forms",
    kind: "standard",
    es: {
      path: "/formularios/",
      title: "Formularios públicos | SG Solutions",
      description:
        "Canales para solicitar contacto, asesoría inicial y cuestionarios con validación y protección básica.",
    },
    en: {
      path: "/en/forms/",
      title: "Public forms | SG Solutions",
      description:
        "Public request channels for contact, advisory intake, and questionnaires with validation and basic protection.",
    },
  },
  {
    routeKey: "portal-auth",
    kind: "standard",
    es: {
      path: "/client/acceso/",
      title: "Acceso del cliente | SG Solutions",
      description:
        "Punto de entrada al portal con opciones de cuenta, sesiones y preferencias del cliente.",
    },
    en: {
      path: "/en/client/access/",
      title: "Client access | SG Solutions",
      description: "Client portal entry with account, sessions and preference options.",
    },
  },
  {
    routeKey: "customer-dashboard",
    kind: "standard",
    es: {
      path: "/client/dashboard/",
      title: "Dashboard del cliente | SG Solutions",
      description:
        "Vista central del estado de servicios, pagos, documentos y próximas acciones del cliente.",
    },
    en: {
      path: "/en/client/dashboard/",
      title: "Client dashboard | SG Solutions",
      description: "Client hub for service status, payments, documents and upcoming actions.",
    },
  },
  {
    routeKey: "my-services",
    kind: "standard",
    es: {
      path: "/client/mis-servicios/",
      title: "Mis servicios | SG Solutions",
      description:
        "Resumen de servicios contratados, responsable, estado y próximos hitos por servicio.",
    },
    en: {
      path: "/en/client/my-services/",
      title: "My services | SG Solutions",
      description: "Summary of contracted services, owner, status and key milestones per service.",
    },
  },
  {
    routeKey: "process-status",
    kind: "standard",
    es: {
      path: "/client/estado-de-proceso/",
      title: "Estado de mi proceso | SG Solutions",
      description:
        "Estados operativos para orientar al cliente sobre avance, pendientes y siguientes pasos.",
    },
    en: {
      path: "/en/client/process-status/",
      title: "My process status | SG Solutions",
      description:
        "Operational states to orient the client on progress, pending items and next steps.",
    },
  },
  {
    routeKey: "portal-documents",
    kind: "standard",
    es: {
      path: "/client/documentos/",
      title: "Portal de documentos | SG Solutions",
      description:
        "Carga y consulta documentos del expediente con control de estado, historial y solicitudes por faltantes.",
    },
    en: {
      path: "/en/client/documents/",
      title: "Document hub | SG Solutions",
      description:
        "Upload and view case documents with state control, history and missing-document requests.",
    },
  },
  {
    routeKey: "secure-messaging",
    kind: "standard",
    es: {
      path: "/client/mensajeria/",
      title: "Mensajería segura | SG Solutions",
      description:
        "Canal privado para conversaciones del expediente con historial, adjuntos y derivación.",
    },
    en: {
      path: "/en/client/secure-messaging/",
      title: "Secure messaging | SG Solutions",
      description: "Private case messaging with timeline, attachments and handoff tracking.",
    },
  },
  {
    routeKey: "client-appointments",
    kind: "standard",
    es: {
      path: "/client/citas/",
      title: "Citas del cliente | SG Solutions",
      description: "Agenda, reprograma y da seguimiento a citas con tipo, canal y recordatorios.",
    },
    en: {
      path: "/en/client/appointments/",
      title: "Client appointments | SG Solutions",
      description:
        "Schedule, reschedule and follow client appointments by type, channel and reminders.",
    },
  },
  {
    routeKey: "client-billing",
    kind: "standard",
    es: {
      path: "/client/facturacion/",
      title: "Pagos y facturación | SG Solutions",
      description:
        "Consulta facturas, estado de pagos y opciones de cobro en un flujo de preparación financiera.",
    },
    en: {
      path: "/en/client/billing/",
      title: "Client billing | SG Solutions",
      description: "View invoices, payment state and finance preparation flow for active services.",
    },
  },
  {
    routeKey: "financial-profile",
    kind: "standard",
    es: {
      path: "/client/perfil-financiero/",
      title: "Perfil financiero y empresarial | SG Solutions",
      description:
        "Perfil consolidado por cliente con campos de finanzas, vivienda, negocios y preferencias.",
    },
    en: {
      path: "/en/client/financial-profile/",
      title: "Financial and business profile | SG Solutions",
      description:
        "Consolidated client profile with financial, housing, business fields and preferences.",
    },
  },
  {
    routeKey: "admin-dashboard",
    kind: "standard",
    es: {
      path: "/admin/dashboard/",
      title: "Dashboard administrativo | SG Solutions",
      description: "Panel de operación con métricas de leads, citas, pagos y actividad reciente.",
    },
    en: {
      path: "/en/admin/dashboard/",
      title: "Admin dashboard | SG Solutions",
      description: "Operations panel with lead, appointment, payment and recent activity metrics.",
    },
  },
  {
    routeKey: "crm",
    kind: "standard",
    es: {
      path: "/admin/crm/",
      title: "CRM | SG Solutions",
      description: "Seguimiento comercial de oportunidades, notas, responsable y acción siguiente.",
    },
    en: {
      path: "/en/admin/crm/",
      title: "CRM | SG Solutions",
      description:
        "Commercial pipeline tracking with opportunities, notes, ownership and next action.",
    },
  },
  {
    routeKey: "client-management",
    kind: "standard",
    es: {
      path: "/admin/clientes/",
      title: "Gestión de clientes | SG Solutions",
      description: "Administración de clientes activos, servicios asociados y notas operativas.",
    },
    en: {
      path: "/en/admin/client-management/",
      title: "Client management | SG Solutions",
      description: "Manage active clients, associated services and operational notes.",
    },
  },
  {
    routeKey: "company-management",
    kind: "standard",
    es: {
      path: "/admin/empresas/",
      title: "Gestión de empresas | SG Solutions",
      description: "Control de datos empresariales, estado legal y reportes asociados.",
    },
    en: {
      path: "/en/admin/companies/",
      title: "Company management | SG Solutions",
      description: "Track company records, legal status and linked reports.",
    },
  },
  {
    routeKey: "lead-management",
    kind: "standard",
    es: {
      path: "/admin/leads/",
      title: "Gestión de leads | SG Solutions",
      description:
        "Clasificación, scoring y conversión de leads para priorizar seguimiento comercial.",
    },
    en: {
      path: "/en/admin/leads/",
      title: "Lead management | SG Solutions",
      description: "Lead scoring, classification and conversion workflow to prioritize follow-up.",
    },
  },
  {
    routeKey: "service-orders",
    kind: "standard",
    es: {
      path: "/admin/ordenes-de-servicio/",
      title: "Órdenes de servicio | SG Solutions",
      description:
        "Control de órdenes por cliente, estado, pagos, aprobaciones y cierre operativo.",
    },
    en: {
      path: "/en/admin/service-orders/",
      title: "Service orders | SG Solutions",
      description:
        "Manage client service orders with status, payment, approvals and closure lifecycle.",
    },
  },
  {
    routeKey: "admin-forms",
    kind: "standard",
    es: {
      path: "/admin/formularios/",
      title: "Centro de formularios (demo) | SG Solutions",
      description:
        "Diseña, versiona y administra formularios de intake y cuestionarios por servicio.",
    },
    en: {
      path: "/en/admin/forms/",
      title: "Forms center (demo) | SG Solutions",
      description: "Design, version and manage intake and questionnaire forms by service.",
    },
  },
  {
    routeKey: "admin-work-queues",
    kind: "standard",
    es: {
      path: "/admin/colas-y-tareas/",
      title: "Colas y tareas (demo) | SG Solutions",
      description:
        "Centro de priorización de tareas, seguimiento de colas y estados de operación interna.",
    },
    en: {
      path: "/en/admin/work-queues/",
      title: "Work queues and tasks (demo) | SG Solutions",
      description: "Prioritization hub for tasks, queue tracking and internal work states.",
    },
  },
  {
    routeKey: "admin-approvals",
    kind: "standard",
    es: {
      path: "/admin/aprobaciones/",
      title: "Aprobaciones humanas (demo) | SG Solutions",
      description: "Controles de aprobación humana para acciones sensibles y propuestas de cambio.",
    },
    en: {
      path: "/en/admin/approvals/",
      title: "Human approvals (demo) | SG Solutions",
      description: "Human approval controls for sensitive actions and change proposals.",
    },
  },
  {
    routeKey: "admin-ai-hub",
    kind: "standard",
    es: {
      path: "/admin/ai-hub/",
      title: "AI Hub (demo) | SG Solutions",
      description: "Centro de habilidades especializadas, prompts y trazabilidad de asistencia IA.",
    },
    en: {
      path: "/en/admin/ai-hub/",
      title: "AI Hub (demo) | SG Solutions",
      description: "Specialized skill center, prompts and AI assistant traceability.",
    },
  },
  {
    routeKey: "admin-operations",
    kind: "standard",
    es: {
      path: "/admin/operaciones/",
      title: "Operaciones y despliegue (demo) | SG Solutions",
      description: "Control de estado operativo, readiness y checklist de despliegue local.",
    },
    en: {
      path: "/en/admin/operations/",
      title: "Operations and deployment (demo) | SG Solutions",
      description: "Operational status control, readiness and local deployment checklist.",
    },
  },
  {
    routeKey: "admin-governance",
    kind: "standard",
    es: {
      path: "/admin/gobernanza/",
      title: "Gobernanza y cumplimiento (admin) | SG Solutions",
      description:
        "Catálogo de políticas, controles, riesgos y excepciones con trazabilidad local.",
    },
    en: {
      path: "/en/admin/governance/",
      title: "Governance and compliance (admin) | SG Solutions",
      description:
        "Policy catalog, controls, risks and exception tracking in a local admin workspace.",
    },
  },
  {
    routeKey: "admin-analytics",
    kind: "standard",
    es: {
      path: "/admin/analitica/",
      title: "Analítica operativa y KPIs (admin) | SG Solutions",
      description: "Panel local de métricas, alertas y rendimiento para seguimiento operativo.",
    },
    en: {
      path: "/en/admin/analytics/",
      title: "Operational analytics and KPIs (admin) | SG Solutions",
      description: "Local KPIs, alerts, and performance signal tracking for internal operations.",
    },
  },
  {
    routeKey: "admin-tradelines",
    kind: "standard",
    es: {
      path: "/admin/tradelines/",
      title: "Mercado de tradelines y proveedores (admin) | SG Solutions",
      description:
        "Control local de proveedores, ofertas y control de cumplimiento para productos credit-building.",
    },
    en: {
      path: "/en/admin/tradelines/",
      title: "Tradelines and providers marketplace (admin) | SG Solutions",
      description:
        "Local control of providers, products, and compliance checks for credit-building offers.",
    },
  },
  {
    routeKey: "admin-tax-services",
    kind: "standard",
    es: {
      path: "/admin/servicios-tributarios/",
      title: "Servicios tributarios (admin) | SG Solutions",
      description: "Administración demo de casos de impuestos, integraciones y control pre-filing.",
    },
    en: {
      path: "/en/admin/tax-services/",
      title: "Tax services (admin) | SG Solutions",
      description:
        "Demo administration for tax engagements, cases, readiness and pre-filing controls.",
    },
  },
  {
    routeKey: "admin-bookkeeping",
    kind: "standard",
    es: {
      path: "/admin/bookkeeping/",
      title: "Bookkeeping y contabilidad (admin) | SG Solutions",
      description:
        "Administración demo de engagement, books, chart of accounts, periodos y asientos contables.",
    },
    en: {
      path: "/en/admin/bookkeeping/",
      title: "Bookkeeping and accounting (admin) | SG Solutions",
      description:
        "Local admin workflow for engagement setup, books, chart of accounts, periods and accounting entries.",
    },
  },
  {
    routeKey: "admin-recommendation-engine",
    kind: "standard",
    es: {
      path: "/admin/recomendaciones/",
      title: "Motor de recomendaciones (admin) | SG Solutions",
      description:
        "Panel interno para priorizar candidatos, correr recomendaciones y revisar trazabilidad local.",
    },
    en: {
      path: "/en/admin/recommendation-engine/",
      title: "Recommendation engine (admin) | SG Solutions",
      description:
        "Admin workspace for candidate prioritization, recommendation runs and local traceability.",
    },
  },
  {
    routeKey: "admin-creditcardbroker-integration",
    kind: "standard",
    es: {
      path: "/admin/creditcardbroker/",
      title: "Integración CreditCardBroker (admin) | SG Solutions",
      description:
        "Administración de reglas, offers aprobadas y rutas de atribución de afiliación de forma local.",
    },
    en: {
      path: "/en/admin/creditcardbroker/",
      title: "CreditCardBroker integration (admin) | SG Solutions",
      description:
        "Admin for integration rules, approved offers and affiliate attribution paths in local mode.",
    },
  },
  {
    routeKey: "admin-partner-management",
    kind: "standard",
    es: {
      path: "/admin/partner-management/",
      title: "Gestión de partners (admin) | SG Solutions",
      description: "Panel interno para onboarding, estados y acceso operativo de socios externos.",
    },
    en: {
      path: "/en/admin/partner-management/",
      title: "Partner management (admin) | SG Solutions",
      description:
        "Internal workspace for onboarding, health and operational access of external partners.",
    },
  },
  {
    routeKey: "admin-provider-abstraction",
    kind: "standard",
    es: {
      path: "/admin/provider-abstraction/",
      title: "Abstracción de proveedores (admin) | SG Solutions",
      description:
        "Consola interna para adapters, health checks, límites de capacidad y fallback de proveedores.",
    },
    en: {
      path: "/en/admin/provider-abstraction/",
      title: "Provider abstraction (admin) | SG Solutions",
      description:
        "Internal console for adapters, health checks, capability limits and provider fallback.",
    },
  },
  {
    routeKey: "privacy",
    kind: "policy",
    es: {
      path: "/privacidad/",
      title: "Privacidad | SG Solutions",
      description: "Información pública sobre privacidad y límites de recopilación en este sitio.",
    },
    en: {
      path: "/en/privacy/",
      title: "Privacy | SG Solutions",
      description: "Public information about privacy and collection limits on this website.",
    },
  },
  {
    routeKey: "terms",
    kind: "policy",
    es: {
      path: "/terminos/",
      title: "Términos de uso | SG Solutions",
      description: "Condiciones informativas para el uso del sitio público de SG Solutions.",
    },
    en: {
      path: "/en/terms/",
      title: "Terms of use | SG Solutions",
      description: "Informational terms for using the SG Solutions public website.",
    },
  },
  {
    routeKey: "accessibility",
    kind: "policy",
    es: {
      path: "/accesibilidad/",
      title: "Accesibilidad | SG Solutions",
      description: "Compromiso y características de accesibilidad del sitio público.",
    },
    en: {
      path: "/en/accessibility/",
      title: "Accessibility | SG Solutions",
      description: "Accessibility commitment and features of the public website.",
    },
  },
  {
    routeKey: "disclosures",
    kind: "policy",
    es: {
      path: "/divulgaciones/",
      title: "Divulgaciones | SG Solutions",
      description:
        "Límites, relaciones con terceros y declaraciones importantes sobre los servicios.",
    },
    en: {
      path: "/en/disclosures/",
      title: "Disclosures | SG Solutions",
      description:
        "Important service limitations, third-party relationships and public disclosures.",
    },
  },
];

export const createPublicPages = (
  contentRepository: ServiceContentRepository = serviceContentRepository,
): PublicPage[] =>
  pageDefinitions.flatMap((definition) => [
    buildLocalePage(definition, "es", contentRepository),
    buildLocalePage(definition, "en", contentRepository),
  ]);

export const loadPublicPages = async (provider: ServiceContentProvider): Promise<PublicPage[]> => {
  const snapshot = await materializeServiceContentSnapshot(provider);
  return createPublicPages(createServiceContentRepository(snapshot));
};

export const PUBLIC_PAGES: PublicPage[] = createPublicPages();

const serviceDefinitions: Array<{
  id: PublicService["id"];
  priceMode: PublicService["priceMode"];
  es: Pick<PublicService, "title" | "summary">;
  en: Pick<PublicService, "title" | "summary">;
}> = [
  {
    id: "service-credit",
    priceMode: "consultation",
    es: {
      title: "Crédito",
      summary:
        "Organiza tu perfil, comprende los factores que observas y prepara próximos pasos con expectativas realistas.",
    },
    en: {
      title: "Credit",
      summary:
        "Organize your profile, understand the factors you observe and prepare realistic next steps.",
    },
  },
  {
    id: "service-credit-monitoring",
    priceMode: "quote",
    es: {
      title: "Monitoreo de crédito",
      summary:
        "Da seguimiento autorizado a cambios relevantes y mantén un historial claro para tus conversaciones de crédito.",
    },
    en: {
      title: "Credit monitoring",
      summary:
        "Follow relevant authorized changes and keep a clear history for your credit conversations.",
    },
  },
  {
    id: "service-taxes",
    priceMode: "quote",
    es: {
      title: "Taxes",
      summary:
        "Reúne información y documentos tributarios mediante un proceso organizado con revisión humana.",
    },
    en: {
      title: "Taxes",
      summary:
        "Gather tax information and documents through an organized process with human review.",
    },
  },
  {
    id: "service-business-formation",
    priceMode: "consultation",
    es: {
      title: "Formación de negocios",
      summary:
        "Aclara la información inicial, los documentos y la secuencia necesaria para comenzar una empresa.",
    },
    en: {
      title: "Business formation",
      summary:
        "Clarify the initial information, documents and sequence needed to start a business.",
    },
  },
  {
    id: "service-ein",
    priceMode: "quote",
    es: {
      title: "EIN",
      summary:
        "Prepara los datos necesarios para revisar una solicitud de EIN antes de cualquier acción autorizada.",
    },
    en: {
      title: "EIN",
      summary:
        "Prepare the information needed to review an EIN application before any authorized action.",
    },
  },
  {
    id: "service-business-compliance",
    priceMode: "quote",
    es: {
      title: "Cumplimiento empresarial",
      summary:
        "Mantén organizados reportes, renovaciones y fechas que puedan aplicar a la operación de tu empresa.",
    },
    en: {
      title: "Business compliance",
      summary:
        "Keep reports, renewals and dates that may apply to your business operations organized.",
    },
  },
  {
    id: "service-business-credit",
    priceMode: "consultation",
    es: {
      title: "Crédito empresarial",
      summary:
        "Organiza identidad, banca, documentación y hábitos responsables antes de buscar productos de crédito para tu negocio.",
    },
    en: {
      title: "Business credit",
      summary:
        "Organize identity, banking, documentation, and responsible habits before seeking business credit products.",
    },
  },
  {
    id: "service-business-funding",
    priceMode: "consultation",
    es: {
      title: "Financiamiento empresarial",
      summary:
        "Revisa preparación, flujo de caja y documentos antes de explorar opciones con proveedores externos.",
    },
    en: {
      title: "Business funding",
      summary:
        "Review readiness, cash flow and documents before exploring options with outside providers.",
    },
  },
  {
    id: "service-loan-preparation",
    priceMode: "consultation",
    es: {
      title: "Preparación para financiamiento",
      summary:
        "Organiza capacidad de pago, ingresos, obligaciones, crédito y preguntas antes de comparar opciones de financiamiento.",
    },
    en: {
      title: "Financing preparation",
      summary:
        "Organize repayment capacity, income, obligations, credit, and questions before comparing financing options.",
    },
  },
  {
    id: "service-home-buying",
    priceMode: "consultation",
    es: {
      title: "Comprar casa",
      summary:
        "Convierte crédito, presupuesto, documentos y preguntas en un plan de preparación más claro.",
    },
    en: {
      title: "Home buying",
      summary: "Turn credit, budget, documents and questions into a clearer preparation plan.",
    },
  },
  {
    id: "marketplace",
    priceMode: "consultation",
    es: {
      title: "Marketplace financiero",
      summary:
        "Conoce categorías de productos de terceros, sus diferencias y las divulgaciones que debes revisar.",
    },
    en: {
      title: "Financial marketplace",
      summary:
        "Explore third-party product categories, their differences and the disclosures you should review.",
    },
  },
];

export const PUBLIC_SERVICES: PublicService[] = serviceDefinitions.flatMap((definition) => [
  {
    id: definition.id,
    priceMode: definition.priceMode,
    locale: "es",
    ...definition.es,
  },
  {
    id: definition.id,
    priceMode: definition.priceMode,
    locale: "en",
    ...definition.en,
  },
]);
