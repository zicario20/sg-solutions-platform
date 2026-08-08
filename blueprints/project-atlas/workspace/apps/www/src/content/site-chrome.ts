import type { Locale } from "../domain/public-site";

export interface SiteChromeCopy {
  skip: string;
  assistance: string;
  portal: string;
  menu: string;
  close: string;
  language: string;
  primaryAction: string;
  secondaryAction: string;
  primaryNavLabel: string;
  mobileNavLabel: string;
  mobileNavTitle: string;
  nav: Array<{ label: string; href: string }>;
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
}

export const SITE_CHROME: Record<Locale, SiteChromeCopy> = {
  es: {
    skip: "Saltar al contenido principal",
    assistance: "Orientación bilingüe para personas y pequeños negocios",
    portal: "Portal del cliente",
    menu: "Abrir navegación",
    close: "Cerrar navegación",
    language: "English",
    primaryAction: "Agenda una evaluación",
    secondaryAction: "Solicita una cotización",
    primaryNavLabel: "Navegación principal",
    mobileNavLabel: "Navegación móvil",
    mobileNavTitle: "Navegación",
    nav: [
      { label: "Inicio", href: "/" },
      { label: "Servicios", href: "/servicios/" },
      { label: "Recursos", href: "/recursos/" },
      { label: "Nosotros", href: "/nosotros/" },
      { label: "Contacto", href: "/contacto/" },
    ],
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
    footerSummary:
      "Orientación clara para organizar decisiones financieras y empresariales con seguimiento humano.",
    footerServices: "Servicios",
    footerCompany: "SG Solutions",
    footerPolicies: "Información",
    footerLinks: {
      services: [
        { label: "Crédito", href: "/servicios/credito/" },
        { label: "Taxes", href: "/servicios/taxes/" },
        { label: "Formación de negocios", href: "/servicios/formacion-de-negocios/" },
        { label: "Financiamiento", href: "/servicios/financiamiento-empresarial/" },
        { label: "Comprar casa", href: "/servicios/comprar-casa/" },
      ],
      company: [
        { label: "Nosotros", href: "/nosotros/" },
        { label: "Contacto", href: "/contacto/" },
        { label: "Precios", href: "/precios/" },
        { label: "FAQ", href: "/recursos/preguntas-frecuentes/" },
      ],
      policies: [
        { label: "Privacidad", href: "/privacidad/" },
        { label: "Términos", href: "/terminos/" },
        { label: "Accesibilidad", href: "/accesibilidad/" },
        { label: "Divulgaciones", href: "/divulgaciones/" },
      ],
    },
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
  },
  en: {
    skip: "Skip to main content",
    assistance: "Bilingual guidance for individuals and small businesses",
    portal: "Client portal",
    menu: "Open navigation",
    close: "Close navigation",
    language: "Español",
    primaryAction: "Schedule an evaluation",
    secondaryAction: "Request a quote",
    primaryNavLabel: "Primary navigation",
    mobileNavLabel: "Mobile navigation",
    mobileNavTitle: "Navigation",
    nav: [
      { label: "Home", href: "/en/" },
      { label: "Services", href: "/en/services/" },
      { label: "Resources", href: "/en/resources/" },
      { label: "About", href: "/en/about/" },
      { label: "Contact", href: "/en/contact/" },
    ],
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
    footerSummary:
      "Clear guidance for organizing financial and business decisions with human follow-up.",
    footerServices: "Services",
    footerCompany: "SG Solutions",
    footerPolicies: "Information",
    footerLinks: {
      services: [
        { label: "Credit", href: "/en/services/credit/" },
        { label: "Taxes", href: "/en/services/taxes/" },
        { label: "Business formation", href: "/en/services/business-formation/" },
        { label: "Business funding", href: "/en/services/business-funding/" },
        { label: "Home buying", href: "/en/services/home-buying/" },
      ],
      company: [
        { label: "About", href: "/en/about/" },
        { label: "Contact", href: "/en/contact/" },
        { label: "Pricing", href: "/en/pricing/" },
        { label: "FAQ", href: "/en/resources/faq/" },
      ],
      policies: [
        { label: "Privacy", href: "/en/privacy/" },
        { label: "Terms", href: "/en/terms/" },
        { label: "Accessibility", href: "/en/accessibility/" },
        { label: "Disclosures", href: "/en/disclosures/" },
      ],
    },
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
  },
};
