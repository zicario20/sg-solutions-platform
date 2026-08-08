import type { PublicPage, PublicService } from "../domain/public-site";

interface PageDefinition {
  routeKey: PublicPage["routeKey"];
  kind: PublicPage["kind"];
  es: Omit<PublicPage, "routeKey" | "kind" | "locale">;
  en: Omit<PublicPage, "routeKey" | "kind" | "locale">;
}

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

export const PUBLIC_PAGES: PublicPage[] = pageDefinitions.flatMap((definition) => [
  {
    routeKey: definition.routeKey,
    kind: definition.kind,
    locale: "es",
    ...definition.es,
  },
  {
    routeKey: definition.routeKey,
    kind: definition.kind,
    locale: "en",
    ...definition.en,
  },
]);

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
