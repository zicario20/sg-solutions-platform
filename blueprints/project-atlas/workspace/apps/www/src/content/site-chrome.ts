import type { Locale, Surface } from "../domain/public-site";

export interface SurfaceChromeCopy {
  assistance: string;
  portal: string;
  menu: string;
  close: string;
  primaryNavLabel: string;
  mobileNavLabel: string;
  mobileNavTitle: string;
  nav: Array<{ label: string; href: string }>;
  footerSummary: string;
  footerServices: string;
  footerCompany: string;
  footerPolicies: string;
  footerLinks: {
    services: Array<{ label: string; href: string }>;
    company: Array<{ label: string; href: string }>;
    policies: Array<{ label: string; href: string }>;
  };
}

export interface SiteChromeCopy {
  skip: string;
  assistance: string;
  portal: string;
  menu: string;
  close: string;
  language: string;
  primaryAction: string;
  secondaryAction: string;
  breadcrumbLabel: string;
  breadcrumbHome: string;
  breadcrumbServices: string;
  growthPlan: string;
  growthNextStep: string;
  heroExploreServices: string;
  heroNote: string;
  sectionEyebrow: string;
  learnMore: string;
  reviewTitle: string;
  reviewBody: string;
  integrationEyebrow: string;
  finalEyebrow: string;
  finalHeading: string;
  finalBody: string;
  trustLabel: string;
  trustItems: string[];
  footerSummary: string;
  footerServices: string;
  footerCompany: string;
  footerPolicies: string;
  footerLinks: {
    services: Array<{ label: string; href: string }>;
    company: Array<{ label: string; href: string }>;
    policies: Array<{ label: string; href: string }>;
  };
  unavailableTitle: string;
  unavailableBody: string;
  notFoundTitle: string;
  notFoundHeading: string;
  notFoundBody: string;
  notFoundHome: string;
  notFoundServices: string;
  disclosure: string;
  nav: Array<{ label: string; href: string }>;
}

const ES_PUBLIC_NAV: SurfaceChromeCopy["nav"] = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios/" },
  { label: "Portal del cliente", href: "/client/acceso/" },
  { label: "Centro de ayuda", href: "/centro-de-ayuda/" },
  { label: "Academia", href: "/academia/" },
  { label: "Nosotros", href: "/nosotros/" },
  { label: "Contacto", href: "/contacto/" },
];

const EN_PUBLIC_NAV: SurfaceChromeCopy["nav"] = [
  { label: "Home", href: "/en/" },
  { label: "Services", href: "/en/services/" },
  { label: "Client portal", href: "/en/client/access/" },
  { label: "Help Center", href: "/en/help-center/" },
  { label: "Academy", href: "/en/academy/" },
  { label: "About", href: "/en/about/" },
  { label: "Contact", href: "/en/contact/" },
];

const ES_CLIENT_NAV: SurfaceChromeCopy["nav"] = [
  { label: "Inicio", href: "/client/dashboard/" },
  { label: "Mis servicios", href: "/client/mis-servicios/" },
  { label: "Estado de mi proceso", href: "/client/estado-de-proceso/" },
  { label: "Documentos", href: "/client/documentos/" },
  { label: "Citas", href: "/client/citas/" },
  { label: "Mensajes", href: "/client/mensajeria/" },
  { label: "Pagos", href: "/client/facturacion/" },
  { label: "Centro de ayuda", href: "/centro-de-ayuda/" },
  { label: "Configuración", href: "/client/perfil-financiero/" },
];

const EN_CLIENT_NAV: SurfaceChromeCopy["nav"] = [
  { label: "Home", href: "/en/client/dashboard/" },
  { label: "My services", href: "/en/client/my-services/" },
  { label: "Process status", href: "/en/client/process-status/" },
  { label: "Documents", href: "/en/client/documents/" },
  { label: "Appointments", href: "/en/client/appointments/" },
  { label: "Messages", href: "/en/client/secure-messaging/" },
  { label: "Billing", href: "/en/client/billing/" },
  { label: "Help Center", href: "/en/help-center/" },
  { label: "Settings", href: "/en/client/financial-profile/" },
];

const ES_ADMIN_NAV: SurfaceChromeCopy["nav"] = [
  { label: "Dashboard", href: "/admin/dashboard/" },
  { label: "Clientes", href: "/admin/clientes/" },
  { label: "CRM", href: "/admin/crm/" },
  { label: "Contactos", href: "/admin/contactos/" },
  { label: "Empresas", href: "/admin/empresas/" },
  { label: "Leads", href: "/admin/leads/" },
  { label: "Órdenes de servicio", href: "/admin/ordenes-de-servicio/" },
  { label: "Comunicaciones", href: "/admin/contactos/" },
  { label: "AI Hub", href: "/admin/ai-hub/" },
  { label: "Aprobaciones", href: "/admin/aprobaciones/" },
  { label: "Reportes", href: "/admin/analitica/" },
  { label: "Configuración", href: "/admin/gobernanza/" },
];

const EN_ADMIN_NAV: SurfaceChromeCopy["nav"] = [
  { label: "Dashboard", href: "/en/admin/dashboard/" },
  { label: "Clients", href: "/en/admin/client-management/" },
  { label: "CRM", href: "/en/admin/crm/" },
  { label: "Contacts", href: "/en/admin/contacts/" },
  { label: "Companies", href: "/en/admin/companies/" },
  { label: "Leads", href: "/en/admin/leads/" },
  { label: "Service orders", href: "/en/admin/service-orders/" },
  { label: "Communications", href: "/en/admin/contacts/" },
  { label: "AI Hub", href: "/en/admin/ai-hub/" },
  { label: "Approvals", href: "/en/admin/approvals/" },
  { label: "Reports", href: "/en/admin/analytics/" },
  { label: "Settings", href: "/en/admin/governance/" },
];

const ES_FOOTER_SERVICES: SurfaceChromeCopy["footerLinks"]["services"] = [
  { label: "Crédito", href: "/servicios/credito/" },
  { label: "Taxes", href: "/servicios/taxes/" },
  { label: "Formación de negocios", href: "/servicios/formacion-de-negocios/" },
  { label: "Financiamiento", href: "/servicios/financiamiento-empresarial/" },
  { label: "Comprar casa", href: "/servicios/comprar-casa/" },
];

const EN_FOOTER_SERVICES: SurfaceChromeCopy["footerLinks"]["services"] = [
  { label: "Credit", href: "/en/services/credit/" },
  { label: "Taxes", href: "/en/services/taxes/" },
  { label: "Business formation", href: "/en/services/business-formation/" },
  { label: "Business funding", href: "/en/services/business-funding/" },
  { label: "Home buying", href: "/en/services/home-buying/" },
];

const ES_PUBLIC_COMPANY_LINKS: SurfaceChromeCopy["footerLinks"]["company"] = [
  { label: "Nosotros", href: "/nosotros/" },
  { label: "Contactos", href: "/contacto/" },
  { label: "Centro de ayuda", href: "/centro-de-ayuda/" },
  { label: "Academia", href: "/academia/" },
  { label: "Blog", href: "/" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes/" },
];

const EN_PUBLIC_COMPANY_LINKS: SurfaceChromeCopy["footerLinks"]["company"] = [
  { label: "About", href: "/en/about/" },
  { label: "Contact", href: "/en/contact/" },
  { label: "Help Center", href: "/en/help-center/" },
  { label: "Academy", href: "/en/academy/" },
  { label: "FAQ", href: "/en/faq/" },
];

const ES_CLIENT_COMPANY_LINKS: SurfaceChromeCopy["footerLinks"]["company"] = [
  { label: "Mis servicios", href: "/client/mis-servicios/" },
  { label: "Estado de mi proceso", href: "/client/estado-de-proceso/" },
  { label: "Documentos", href: "/client/documentos/" },
  { label: "Citas", href: "/client/citas/" },
  { label: "Mensajería", href: "/client/mensajeria/" },
  { label: "Pagos", href: "/client/facturacion/" },
  { label: "Configuración", href: "/client/perfil-financiero/" },
  { label: "Centro de ayuda", href: "/centro-de-ayuda/" },
];

const EN_CLIENT_COMPANY_LINKS: SurfaceChromeCopy["footerLinks"]["company"] = [
  { label: "My services", href: "/en/client/my-services/" },
  { label: "Process status", href: "/en/client/process-status/" },
  { label: "Documents", href: "/en/client/documents/" },
  { label: "Appointments", href: "/en/client/appointments/" },
  { label: "Messages", href: "/en/client/secure-messaging/" },
  { label: "Billing", href: "/en/client/billing/" },
  { label: "Settings", href: "/en/client/financial-profile/" },
  { label: "Help Center", href: "/en/help-center/" },
];

const ES_ADMIN_COMPANY_LINKS: SurfaceChromeCopy["footerLinks"]["company"] = [
  { label: "Dashboard", href: "/admin/dashboard/" },
  { label: "Clientes", href: "/admin/clientes/" },
  { label: "CRM", href: "/admin/crm/" },
  { label: "Órdenes", href: "/admin/ordenes-de-servicio/" },
  { label: "Aprobaciones", href: "/admin/aprobaciones/" },
  { label: "AI Hub", href: "/admin/ai-hub/" },
  { label: "Analítica", href: "/admin/analitica/" },
  { label: "Gobernanza", href: "/admin/gobernanza/" },
];

const EN_ADMIN_COMPANY_LINKS: SurfaceChromeCopy["footerLinks"]["company"] = [
  { label: "Dashboard", href: "/en/admin/dashboard/" },
  { label: "Clients", href: "/en/admin/client-management/" },
  { label: "CRM", href: "/en/admin/crm/" },
  { label: "Service orders", href: "/en/admin/service-orders/" },
  { label: "Approvals", href: "/en/admin/approvals/" },
  { label: "AI Hub", href: "/en/admin/ai-hub/" },
  { label: "Analytics", href: "/en/admin/analytics/" },
  { label: "Governance", href: "/en/admin/governance/" },
];

const ES_POLICIES: SurfaceChromeCopy["footerLinks"]["policies"] = [
  { label: "Privacidad", href: "/privacidad/" },
  { label: "Términos", href: "/terminos/" },
  { label: "Accesibilidad", href: "/accesibilidad/" },
  { label: "Divulgaciones", href: "/divulgaciones/" },
];

const EN_POLICIES: SurfaceChromeCopy["footerLinks"]["policies"] = [
  { label: "Privacy", href: "/en/privacy/" },
  { label: "Terms", href: "/en/terms/" },
  { label: "Accessibility", href: "/en/accessibility/" },
  { label: "Disclosures", href: "/en/disclosures/" },
];

const SURFACE_CHROME: Record<Locale, Record<Surface, SurfaceChromeCopy>> = {
  es: {
    public: {
      assistance: "Orientación bilingüe para personas y pequeños negocios",
      portal: "Portal del cliente",
      menu: "Abrir navegación",
      close: "Cerrar navegación",
      primaryNavLabel: "Navegación principal",
      mobileNavLabel: "Navegación móvil",
      mobileNavTitle: "Navegación",
      nav: ES_PUBLIC_NAV,
      footerSummary:
        "Orientación clara para organizar decisiones financieras y empresariales con seguimiento humano.",
      footerServices: "Servicios",
      footerCompany: "SG Solutions",
      footerPolicies: "Información",
      footerLinks: {
        services: ES_FOOTER_SERVICES,
        company: ES_PUBLIC_COMPANY_LINKS,
        policies: ES_POLICIES,
      },
    },
    client: {
      assistance: "Tu panel del cliente para seguir tu caso con claridad.",
      portal: "Mi cuenta",
      menu: "Abrir menú del portal",
      close: "Cerrar menú",
      primaryNavLabel: "Navegación del cliente",
      mobileNavLabel: "Navegación cliente",
      mobileNavTitle: "Cliente",
      nav: ES_CLIENT_NAV,
      footerSummary: "Tu progreso, tareas y próximos pasos en un solo lugar.",
      footerServices: "Servicios activos",
      footerCompany: "Cliente",
      footerPolicies: "Soporte",
      footerLinks: {
        services: ES_FOOTER_SERVICES,
        company: ES_CLIENT_COMPANY_LINKS,
        policies: ES_POLICIES,
      },
    },
    admin: {
      assistance: "Panel interno para operaciones y activación de casos.",
      portal: "Portal administrativo",
      menu: "Abrir menú interno",
      close: "Cerrar menú",
      primaryNavLabel: "Navegación interna",
      mobileNavLabel: "Navegación admin",
      mobileNavTitle: "Administración",
      nav: ES_ADMIN_NAV,
      footerSummary: "Operaciones de negocio, cumplimiento y seguimiento de casos.",
      footerServices: "Operación",
      footerCompany: "Administración",
      footerPolicies: "Gobierno",
      footerLinks: {
        services: ES_FOOTER_SERVICES,
        company: ES_ADMIN_COMPANY_LINKS,
        policies: ES_POLICIES,
      },
    },
  },
  en: {
    public: {
      assistance: "Bilingual guidance for people and small businesses",
      portal: "Client portal",
      menu: "Open navigation",
      close: "Close navigation",
      primaryNavLabel: "Primary navigation",
      mobileNavLabel: "Mobile navigation",
      mobileNavTitle: "Navigation",
      nav: EN_PUBLIC_NAV,
      footerSummary:
        "Clear guidance for organizing financial and business decisions with human follow-up.",
      footerServices: "Services",
      footerCompany: "SG Solutions",
      footerPolicies: "Information",
      footerLinks: {
        services: EN_FOOTER_SERVICES,
        company: EN_PUBLIC_COMPANY_LINKS,
        policies: EN_POLICIES,
      },
    },
    client: {
      assistance: "Your client dashboard to keep your case updated.",
      portal: "My account",
      menu: "Open client menu",
      close: "Close menu",
      primaryNavLabel: "Client navigation",
      mobileNavLabel: "Mobile client navigation",
      mobileNavTitle: "Client area",
      nav: EN_CLIENT_NAV,
      footerSummary: "Your active services, tasks and next steps in one place.",
      footerServices: "Active services",
      footerCompany: "Client",
      footerPolicies: "Support",
      footerLinks: {
        services: EN_FOOTER_SERVICES,
        company: EN_CLIENT_COMPANY_LINKS,
        policies: EN_POLICIES,
      },
    },
    admin: {
      assistance: "Internal control panel for operations and readiness.",
      portal: "Admin portal",
      menu: "Open admin menu",
      close: "Close menu",
      primaryNavLabel: "Internal navigation",
      mobileNavLabel: "Mobile admin navigation",
      mobileNavTitle: "Admin area",
      nav: EN_ADMIN_NAV,
      footerSummary: "Internal operations, approvals, and operational controls.",
      footerServices: "Operations",
      footerCompany: "Administration",
      footerPolicies: "Governance",
      footerLinks: {
        services: EN_FOOTER_SERVICES,
        company: EN_ADMIN_COMPANY_LINKS,
        policies: EN_POLICIES,
      },
    },
  },
};

export const SITE_CHROME: Record<Locale, SiteChromeCopy> = {
  es: {
    skip: "Saltar al contenido principal",
    assistance: SURFACE_CHROME.es.public.assistance,
    portal: SURFACE_CHROME.es.public.portal,
    menu: SURFACE_CHROME.es.public.menu,
    close: SURFACE_CHROME.es.public.close,
    language: "English",
    primaryAction: "Agenda una evaluación",
    secondaryAction: "Solicita una cotización",
    breadcrumbLabel: "Migas de pan",
    breadcrumbHome: "Inicio",
    breadcrumbServices: "Servicios",
    growthPlan: "Plan claro",
    growthNextStep: "Próximo paso",
    heroExploreServices: "Explora los servicios",
    heroNote: "Sin promesas. Con contexto, alcance y próximos pasos visibles.",
    sectionEyebrow: "Diseñado para avanzar",
    learnMore: "Conoce más",
    reviewTitle: "Revisión requerida",
    reviewBody: "Este contenido no está aprobado para publicación legal en producción.",
    integrationEyebrow: "Canal seguro",
    finalEyebrow: "El siguiente paso",
    finalHeading: "Empieza con una conversación clara",
    finalBody:
      "Primero entendemos tu objetivo. Después definimos alcance, información y próximos pasos.",
    trustLabel: "Principios de confianza",
    trustItems: ["Atención bilingüe", "Proceso claro", "Seguimiento humano", "Privacidad primero"],
    footerSummary: SURFACE_CHROME.es.public.footerSummary,
    footerServices: SURFACE_CHROME.es.public.footerServices,
    footerCompany: SURFACE_CHROME.es.public.footerCompany,
    footerPolicies: SURFACE_CHROME.es.public.footerPolicies,
    footerLinks: SURFACE_CHROME.es.public.footerLinks,
    unavailableTitle: "Este canal todavía no está activo",
    unavailableBody:
      "No has enviado información ni reservado una cita. Puedes explorar los servicios mientras activamos el flujo seguro correspondiente.",
    notFoundTitle: "Página no encontrada | SG Solutions",
    notFoundHeading: "No encontramos esa página",
    notFoundBody:
      "La dirección pudo cambiar. Regresa al inicio o explora los servicios disponibles.",
    notFoundHome: "Volver al inicio",
    notFoundServices: "Explorar servicios",
    disclosure:
      "La disponibilidad, elegibilidad y resultados dependen de cada situación y de las decisiones de terceros. SG Solutions no garantiza aprobación ni resultados específicos.",
    nav: ES_PUBLIC_NAV,
  },
  en: {
    skip: "Skip to main content",
    assistance: SURFACE_CHROME.en.public.assistance,
    portal: SURFACE_CHROME.en.public.portal,
    menu: SURFACE_CHROME.en.public.menu,
    close: SURFACE_CHROME.en.public.close,
    language: "Español",
    primaryAction: "Schedule an evaluation",
    secondaryAction: "Request a quote",
    breadcrumbLabel: "Breadcrumbs",
    breadcrumbHome: "Home",
    breadcrumbServices: "Services",
    growthPlan: "Clear plan",
    growthNextStep: "Next step",
    heroExploreServices: "Explore services",
    heroNote: "No promises. Clear context, scope and next steps.",
    sectionEyebrow: "Designed to move forward",
    learnMore: "Learn more",
    reviewTitle: "Review required",
    reviewBody: "This content is not approved for production legal publication.",
    integrationEyebrow: "Secure channel",
    finalEyebrow: "The next step",
    finalHeading: "Start with a clear conversation",
    finalBody: "We first understand your goal. Then we define scope, information and next steps.",
    trustLabel: "Trust principles",
    trustItems: ["Bilingual support", "Clear process", "Human follow-up", "Privacy first"],
    footerSummary: SURFACE_CHROME.en.public.footerSummary,
    footerServices: SURFACE_CHROME.en.public.footerServices,
    footerCompany: SURFACE_CHROME.en.public.footerCompany,
    footerPolicies: SURFACE_CHROME.en.public.footerPolicies,
    footerLinks: SURFACE_CHROME.en.public.footerLinks,
    unavailableTitle: "This channel is not active yet",
    unavailableBody:
      "No information was submitted and no appointment was booked. You can explore services while the corresponding secure flow is activated.",
    notFoundTitle: "Page not found | SG Solutions",
    notFoundHeading: "We could not find that page",
    notFoundBody: "The address may have changed. Return home or explore the available services.",
    notFoundHome: "Return home",
    notFoundServices: "Explore services",
    disclosure:
      "Availability, eligibility and results depend on each situation and third-party decisions. SG Solutions does not guarantee approval or specific results.",
    nav: EN_PUBLIC_NAV,
  },
};

export const getChromeBySurface = (locale: Locale, surface: Surface = "public") => {
  const base = SITE_CHROME[locale];
  const surfaceChrome = SURFACE_CHROME[locale][surface] ?? SURFACE_CHROME[locale].public;

  return {
    ...base,
    ...surfaceChrome,
    nav: surfaceChrome.nav,
    footerSummary: surfaceChrome.footerSummary,
    footerServices: surfaceChrome.footerServices,
    footerCompany: surfaceChrome.footerCompany,
    footerPolicies: surfaceChrome.footerPolicies,
    footerLinks: surfaceChrome.footerLinks,
  };
};
