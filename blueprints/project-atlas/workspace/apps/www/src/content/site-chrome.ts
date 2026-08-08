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
  nav: Array<{ label: string; href: string }>;
  footerSummary: string;
  footerServices: string;
  footerCompany: string;
  footerPolicies: string;
  unavailableTitle: string;
  unavailableBody: string;
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
    nav: [
      { label: "Inicio", href: "/" },
      { label: "Servicios", href: "/servicios/" },
      { label: "Recursos", href: "/preguntas-frecuentes/" },
      { label: "Nosotros", href: "/nosotros/" },
      { label: "Contacto", href: "/contacto/" },
    ],
    footerSummary:
      "Orientación clara para organizar decisiones financieras y empresariales con seguimiento humano.",
    footerServices: "Servicios",
    footerCompany: "SG Solutions",
    footerPolicies: "Información",
    unavailableTitle: "Este canal todavía no está activo",
    unavailableBody:
      "No has enviado información ni reservado una cita. Puedes explorar los servicios mientras activamos el flujo seguro correspondiente.",
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
    nav: [
      { label: "Home", href: "/en/" },
      { label: "Services", href: "/en/services/" },
      { label: "Resources", href: "/en/faq/" },
      { label: "About", href: "/en/about/" },
      { label: "Contact", href: "/en/contact/" },
    ],
    footerSummary:
      "Clear guidance for organizing financial and business decisions with human follow-up.",
    footerServices: "Services",
    footerCompany: "SG Solutions",
    footerPolicies: "Information",
    unavailableTitle: "This channel is not active yet",
    unavailableBody:
      "No information was submitted and no appointment was booked. You can explore services while the corresponding secure flow is activated.",
    disclosure:
      "Availability, eligibility and results depend on each situation and third-party decisions. SG Solutions does not guarantee approval or specific results.",
  },
};
