import type { Locale, PageHero, PublicPage, PublicSection, RouteKey } from "../domain/public-site";
import { getGeneralPageSections } from "./general-content";
import type { ServiceRoute } from "./service-content";
import {
  isServiceContentRoute,
  type ServiceContentRepository,
  serviceContentRepository,
} from "./service-content-repository";

interface ExperienceInput {
  routeKey: RouteKey;
  kind: PublicPage["kind"];
  locale: Locale;
  title: string;
  description: string;
  serviceContentRepository?: ServiceContentRepository;
}

const localized = {
  es: {
    eyebrow: {
      home: "Claridad para avanzar",
      services: "Servicios conectados",
      service: "Orientación personalizada",
      standard: "Información clara",
      policy: "Transparencia y confianza",
    },
    serviceSection: {
      help: "Cómo podemos ayudarte a organizarte",
      helpIntro: "Comenzamos por entender tu situación y separar lo importante de lo urgente.",
      process: "Un proceso claro, de principio a fin",
      prepare: "Qué conviene preparar",
      limits: "Alcance y expectativas",
      limitsBody:
        "La evaluación no garantiza resultados, aprobación, tasas ni decisiones de terceros. Cada situación depende de la información disponible y de las reglas aplicables.",
    },
  },
  en: {
    eyebrow: {
      home: "Clarity to move forward",
      services: "Connected services",
      service: "Personalized guidance",
      standard: "Clear information",
      policy: "Transparency and trust",
    },
    serviceSection: {
      help: "How we help you get organized",
      helpIntro:
        "We start by understanding your situation and separating what matters from what is urgent.",
      process: "A clear process from start to finish",
      prepare: "What to prepare",
      limits: "Scope and expectations",
      limitsBody:
        "An evaluation does not guarantee results, approval, rates or third-party decisions. Every situation depends on available information and applicable rules.",
    },
  },
} as const;

const REMEDIATED_GENERAL_ROUTES = new Set<RouteKey>([
  "home",
  "services",
  "about",
  "pricing",
  "faq",
  "help-center",
  "academy",
  "contact",
]);

export function createPageExperience(input: ExperienceInput): {
  hero: PageHero;
  sections: PublicSection[];
  publicationState: PublicPage["publicationState"];
} {
  const copy = localized[input.locale];
  const contentRepository = input.serviceContentRepository ?? serviceContentRepository;
  const heading = ensureHeadingLength(
    input.title.replace(/^SG Solutions \| /, "").replace(/ \| SG Solutions$/, ""),
    input.locale,
  );
  const hero = {
    eyebrow: copy.eyebrow[input.kind],
    heading,
    summary: ensureSummaryLength(input.description, input.locale),
  };

  if (input.kind === "service" && isServiceContentRoute(input.routeKey)) {
    const serviceContent = contentRepository.get(input.routeKey, input.locale);
    return {
      hero: serviceContent.hero,
      sections: createServiceSections(input.routeKey, input.locale, contentRepository),
      publicationState: "review-required",
    };
  }

  if (input.kind === "policy") {
    return {
      hero,
      sections: createPolicySections(input.routeKey, input.locale),
      publicationState: "review-required",
    };
  }

  return {
    hero,
    sections: createGeneralSections(input.routeKey, input.locale),
    publicationState: REMEDIATED_GENERAL_ROUTES.has(input.routeKey)
      ? "review-required"
      : "published",
  };
}

function createServiceSections(
  routeKey: ServiceRoute,
  locale: Locale,
  contentRepository: ServiceContentRepository,
): PublicSection[] {
  const content = contentRepository.get(routeKey, locale);
  const labels =
    locale === "es"
      ? {
          audience: "Este servicio puede ser para ti si...",
          problems: "Situaciones que podemos ayudarte a organizar",
          overview: "Qué es este servicio",
          actions: "Qué hace SG Solutions",
          process: "Cómo funciona el proceso",
          preparation: "Qué conviene preparar",
          expectations: "Qué puedes esperar",
          limitations: "Qué no hace SG Solutions",
          faq: "Preguntas frecuentes",
          related: "Servicios relacionados",
          resources: "Recursos relacionados",
          disclosures: "Divulgaciones importantes",
        }
      : {
          audience: "This service may be right for you if...",
          problems: "Situations we can help you organize",
          overview: "What this service is",
          actions: "What SG Solutions does",
          process: "How the process works",
          preparation: "What to prepare",
          expectations: "What you can expect",
          limitations: "What SG Solutions does not do",
          faq: "Frequently asked questions",
          related: "Related services",
          resources: "Related resources",
          disclosures: "Important disclosures",
        };
  return [
    { id: "audience", title: labels.audience, variant: "cards", items: content.audience },
    { id: "problems", title: labels.problems, variant: "cards", items: content.problems },
    { id: "overview", title: labels.overview, variant: "prose", items: content.overview },
    { id: "what-we-do", title: labels.actions, variant: "cards", items: content.whatWeDo },
    { id: "process", title: labels.process, variant: "steps", items: content.process },
    {
      id: "preparation",
      title: labels.preparation,
      variant: "checklist",
      items: content.preparation,
    },
    {
      id: "expectations",
      title: labels.expectations,
      variant: "cards",
      items: content.expectations,
    },
    {
      id: "limitations",
      title: labels.limitations,
      variant: "feature",
      items: content.limitations,
    },
    {
      id: "faq",
      title: labels.faq,
      variant: "faq",
      items: content.faq.map(({ question, answer }) => ({ title: question, body: answer })),
    },
    {
      id: "related-services",
      title: labels.related,
      variant: "cards",
      items: content.relatedServices.map(({ title, description, href }) => ({
        title,
        body: description,
        href,
      })),
    },
    {
      id: "related-resources",
      title: labels.resources,
      variant: "cards",
      items: content.relatedResources.map(({ title, description, href }) => ({
        title,
        body: description,
        href,
      })),
    },
    {
      id: "disclosures",
      title: labels.disclosures,
      variant: "feature",
      items: content.disclosures.map((body, index) => ({
        title: locale === "es" ? `Divulgación ${index + 1}` : `Disclosure ${index + 1}`,
        body,
      })),
    },
  ];
}
function createGeneralSections(routeKey: RouteKey, locale: Locale): PublicSection[] {
  const approvedContent = getGeneralPageSections(routeKey, locale);
  if (approvedContent) return approvedContent;
  const isSpanish = locale === "es";
  if (routeKey === "home") return createHomeSections(locale);
  if (routeKey === "services") return createServicesSections(locale);
  if (routeKey === "pricing") {
    return [
      {
        id: "modes",
        title: isSpanish
          ? "Una forma de precio para cada tipo de servicio"
          : "A pricing mode for each type of service",
        variant: "cards",
        items: isSpanish
          ? [
              {
                title: "Evaluación",
                body: "Primero entendemos el alcance antes de definir una propuesta.",
              },
              {
                title: "Cotización",
                body: "El precio se prepara con base en el trabajo y los documentos necesarios.",
              },
              {
                title: "Consulta",
                body: "Una conversación inicial ayuda a aclarar el punto de partida.",
              },
            ]
          : [
              {
                title: "Evaluation",
                body: "We first understand the scope before defining a proposal.",
              },
              { title: "Quote", body: "Pricing is prepared from the work and documents required." },
              {
                title: "Consultation",
                body: "An initial conversation helps clarify the starting point.",
              },
            ],
      },
      createNextStepSection(locale),
    ];
  }
  if (routeKey === "faq") return createFaqSections(locale);
  if (routeKey === "help-center") return createHelpCenterSections(locale);
  if (routeKey === "academy") return createAcademySections(locale);
  if (routeKey === "admin-contacts") return createAdminContactsSections(locale);
  if (routeKey === "public-forms") return createPublicFormsSections(locale);
  if (routeKey === "portal-auth") return createPortalAuthSections(locale);
  if (routeKey === "customer-dashboard") return createCustomerDashboardSections(locale);
  if (routeKey === "my-services") return createMyServicesSections(locale);
  if (routeKey === "process-status") return createProcessStatusSections(locale);
  if (routeKey === "about") {
    return [
      {
        id: "principles",
        title: isSpanish ? "La claridad es parte del servicio" : "Clarity is part of the service",
        variant: "cards",
        items: isSpanish
          ? [
              {
                title: "Educar además de vender",
                body: "Explicamos conceptos y límites para que el próximo paso tenga contexto.",
              },
              {
                title: "Seguimiento humano",
                body: "La tecnología organiza; las decisiones importantes siguen bajo responsabilidad humana.",
              },
              {
                title: "Privacidad primero",
                body: "La información sensible no se solicita en páginas o canales públicos.",
              },
            ]
          : [
              {
                title: "Educate, not only sell",
                body: "We explain concepts and limits so each next step has context.",
              },
              {
                title: "Human follow-up",
                body: "Technology organizes; important decisions remain a human responsibility.",
              },
              {
                title: "Privacy first",
                body: "Sensitive information is not requested on public pages or channels.",
              },
            ],
      },
      createNextStepSection(locale),
    ];
  }
  if (routeKey === "contact") {
    return [
      {
        id: "safe-contact",
        title: isSpanish ? "Empieza con información general" : "Start with general information",
        variant: "checklist",
        items: isSpanish
          ? [
              {
                title: "Servicio de interés",
                body: "Indica el área en la que necesitas orientación.",
              },
              {
                title: "Tu objetivo",
                body: "Resume qué quieres lograr sin incluir datos sensibles.",
              },
              {
                title: "Canal seguro después",
                body: "Documentos e identificadores se solicitarán únicamente dentro de un flujo autorizado.",
              },
            ]
          : [
              { title: "Service of interest", body: "Identify the area where you need guidance." },
              {
                title: "Your goal",
                body: "Summarize what you want to accomplish without sensitive data.",
              },
              {
                title: "Secure channel next",
                body: "Documents and identifiers are requested only within an authorized flow.",
              },
            ],
      },
      createNextStepSection(locale),
    ];
  }
  return [createNextStepSection(locale), createTrustSection(locale)];
}

function createHomeSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  const serviceMap = createServicesSections(locale).find((section) => section.id === "service-map");
  if (!serviceMap) throw new Error(`Missing ${locale} service map`);
  return [
    serviceMap,
    {
      id: "process",
      title: isSpanish ? "De una pregunta a un plan claro" : "From one question to a clear plan",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "Cuéntanos qué necesitas",
              body: "Selecciona el servicio y comparte contexto general.",
            },
            {
              title: "Revisamos tu situación",
              body: "Aclaramos alcance, documentos y preguntas importantes.",
            },
            {
              title: "Definimos próximos pasos",
              body: "Recibes una ruta comprensible antes de comenzar.",
            },
            {
              title: "Te acompañamos",
              body: "Puedes seguir estado, tareas y decisiones cuando los módulos correspondientes estén activos.",
            },
          ]
        : [
            { title: "Tell us what you need", body: "Choose a service and share general context." },
            {
              title: "We review your situation",
              body: "We clarify scope, documents and important questions.",
            },
            {
              title: "Define next steps",
              body: "You receive an understandable path before work begins.",
            },
            {
              title: "Follow through together",
              body: "You can follow status, tasks and decisions when the corresponding modules are active.",
            },
          ],
    },
    {
      id: "home-buying",
      title: isSpanish
        ? "Tu primera casa comienza mucho antes del cierre"
        : "Your first home starts well before closing",
      intro: isSpanish
        ? "Crédito, presupuesto, documentos y preguntas pueden organizarse antes de hablar con un prestamista."
        : "Credit, budget, documents and questions can be organized before speaking with a lender.",
      variant: "feature",
      items: [
        {
          title: isSpanish ? "Prepárate con contexto" : "Prepare with context",
          body: isSpanish
            ? "La disponibilidad de programas depende de tu perfil, el prestamista, la propiedad y las condiciones aplicables."
            : "Program availability depends on your profile, lender, property and applicable conditions.",
          href: isSpanish ? "/servicios/comprar-casa/" : "/en/services/home-buying/",
        },
      ],
    },
    createTrustSection(locale),
  ];
}

function createServicesSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "service-map",
      title: isSpanish ? "Encuentra el punto de partida adecuado" : "Find the right starting point",
      intro: isSpanish
        ? "Una necesidad puede tocar varias áreas; comenzamos por la que hoy requiere más claridad."
        : "One need may touch several areas; we start with the one that needs the most clarity today.",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Crédito",
              body: "Comprende tu perfil y organiza próximos pasos.",
              href: "/servicios/credito/",
            },
            {
              title: "Taxes",
              body: "Prepara información y documentos para revisión.",
              href: "/servicios/taxes/",
            },
            {
              title: "Empresas",
              body: "Forma, identifica y mantén organizada tu empresa.",
              href: "/servicios/formacion-de-negocios/",
            },
            {
              title: "Funding",
              body: "Evalúa preparación antes de explorar opciones.",
              href: "/servicios/financiamiento-empresarial/",
            },
            {
              title: "Comprar casa",
              body: "Organiza crédito, presupuesto y documentación.",
              href: "/servicios/comprar-casa/",
            },
            {
              title: "Marketplace",
              body: "Conoce categorías de productos de terceros.",
              href: "/marketplace/",
            },
          ]
        : [
            {
              title: "Credit",
              body: "Understand your profile and organize next steps.",
              href: "/en/services/credit/",
            },
            {
              title: "Taxes",
              body: "Prepare information and documents for review.",
              href: "/en/services/taxes/",
            },
            {
              title: "Business",
              body: "Form, identify and keep your company organized.",
              href: "/en/services/business-formation/",
            },
            {
              title: "Funding",
              body: "Evaluate readiness before exploring options.",
              href: "/en/services/business-funding/",
            },
            {
              title: "Home buying",
              body: "Organize credit, budget and documents.",
              href: "/en/services/home-buying/",
            },
            {
              title: "Marketplace",
              body: "Explore third-party product categories.",
              href: "/en/marketplace/",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createAdminContactsSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "admin-contacts-overview",
      title: isSpanish ? "Centros de contacto operativo" : "Operational contact hubs",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Contacto por chat",
              body: "Canal de clasificación inicial y siguiente paso para cada solicitud.",
            },
            {
              title: "WhatsApp Business",
              body: "Seguimiento de mensajes, recordatorios y derivación a especialista.",
            },
            {
              title: "Agente telefónico",
              body: "Recepción inicial de llamada con clasificación y gestión de disponibilidad.",
            },
          ]
        : [
            {
              title: "Chat contact",
              body: "Initial classification channel and next-step routing for each request.",
            },
            {
              title: "WhatsApp Business",
              body: "Message follow-up, reminders and escalation to specialist support.",
            },
            {
              title: "Phone agent",
              body: "Incoming call intake with classification and availability handling.",
            },
          ],
    },
    {
      id: "admin-contacts-purpose",
      title: isSpanish ? "Alcance del panel administrativo" : "Administrative panel scope",
      variant: "feature",
      items: isSpanish
        ? [
            {
              title: "Sin información sensible",
              body: "Este módulo organiza canales y estados, y no procesa datos sensibles.",
            },
            {
              title: "Escalado a humano",
              body: "Cuando el caso requiere validación, se registra para seguimiento interno.",
            },
          ]
        : [
            {
              title: "No sensitive data",
              body: "This module organizes channels and states, and does not process sensitive data.",
            },
            {
              title: "Human escalation",
              body: "When review is required, cases are logged for internal follow-up.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createChatSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "chat-purpose",
      title: isSpanish ? "Qué hace el chat hoy" : "What the chat does today",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Orientación de entrada",
              body: "Ayuda a ordenar tu situación y clarifica qué servicio puede corresponder a tu caso.",
            },
            {
              title: "Respuestas educativas",
              body: "Responde preguntas comunes con contexto y límites explícitos.",
            },
            {
              title: "Siguiente paso seguro",
              body: "Te propone un camino de evaluación o cotización antes de pedir datos sensibles.",
            },
          ]
        : [
            {
              title: "Initial orientation",
              body: "Helps organize your situation and clarify which service may fit your case.",
            },
            {
              title: "Educational responses",
              body: "Answers common questions with clear context and explicit boundaries.",
            },
            {
              title: "Safe next step",
              body: "It recommends evaluation or quote flow before asking for sensitive data.",
            },
          ],
    },
    {
      id: "chat-flow",
      title: isSpanish ? "Flujo sugerido" : "Suggested flow",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "1) Define tu objetivo",
              body: "Especifica si necesitas ayuda con crédito, taxes, negocios o compra de casa.",
            },
            {
              title: "2) Detecta servicio",
              body: "Identifica el área inicial más probable y captura el estado actual.",
            },
            {
              title: "3) Recopila contexto",
              body: "Solicitamos solo información general y preguntas, no datos sensibles.",
            },
            {
              title: "4) Deriva a especialista",
              body: "Si procede, se activa revisión humana antes de recopilar información sensible o iniciar acciones.",
            },
          ]
        : [
            {
              title: "1) Define your goal",
              body: "Specify whether you need help with credit, taxes, business, or home buying.",
            },
            {
              title: "2) Detect service",
              body: "Identify the most likely service area and capture current status.",
            },
            {
              title: "3) Collect context",
              body: "Only general details and questions are requested, not sensitive data.",
            },
            {
              title: "4) Handoff to specialist",
              body: "If appropriate, human review is triggered before sensitive collection or action starts.",
            },
          ],
    },
    {
      id: "chat-intake",
      title: isSpanish ? "Información útil para empezar" : "Helpful starter information",
      variant: "checklist",
      items: isSpanish
        ? [
            { title: "Objetivo principal", body: "Qué quieres lograr en el corto plazo." },
            {
              title: "Área de urgencia",
              body: "Por ejemplo: aprobación, orden fiscal, apertura o financiamiento.",
            },
            { title: "Disponibilidad", body: "Plazo esperado, país y contexto general." },
          ]
        : [
            { title: "Main goal", body: "What you want to achieve in the short term." },
            {
              title: "Priority area",
              body: "Example: approval, tax organization, setup, or funding.",
            },
            { title: "Availability", body: "Expected timeline, country, and general context." },
          ],
    },
    {
      id: "chat-boundaries",
      title: isSpanish ? "Límites del chat" : "Chat boundaries",
      variant: "feature",
      items: [
        {
          title: isSpanish ? "No reemplaza a un especialista" : "Not a specialist replacement",
          body: isSpanish
            ? "No ejecuta servicios profesionales, no llena formularios ni da decisiones finales."
            : "It does not perform professional services, complete forms, or make final decisions.",
        },
        {
          title: isSpanish ? "Sin promesas" : "No guarantees",
          body: isSpanish
            ? "No se prometen resultados, tasas o aprobaciones."
            : "No outcomes, rates, or approvals are promised.",
        },
      ],
    },
    {
      id: "chat-handoff",
      title: isSpanish ? "Transferencia humana activa" : "Active human handoff",
      variant: "feature",
      items: [
        {
          title: isSpanish ? "Cuándo escalar" : "When to scale",
          body: isSpanish
            ? "Si el caso requiere verificación legal, financiera o documentación personal, pasa a un humano."
            : "If the case requires legal, financial, or personal documentation review, it escalates to a human.",
        },
        {
          title: isSpanish ? "Pago y agendado" : "Payment and scheduling",
          body: isSpanish
            ? "Tras validar el alcance, el equipo define si se activa cotización o enlace de pago."
            : "After scope validation, the team defines if quotation or payment link activation is needed.",
        },
      ],
    },
    {
      id: "chat-questions",
      title: isSpanish ? "Preguntas de contexto frecuentes" : "Frequent contextual questions",
      variant: "faq",
      items: isSpanish
        ? [
            {
              title: "¿Puedo empezar hoy?",
              body: "Sí, compartiendo solo contexto general.",
            },
            {
              title: "¿Da resultados o aprobación?",
              body: "No. La aprobación depende de evaluación humana y de terceros.",
            },
            {
              title: "¿Qué pasa si no encaja mi caso?",
              body: "Se sugiere otra ruta del sitio y una revisión humana para recalibrar.",
            },
          ]
        : [
            {
              title: "Can I start today?",
              body: "Yes, by sharing only general context.",
            },
            {
              title: "Does this provide results or approval?",
              body: "No. Approval depends on human review and third parties.",
            },
            {
              title: "What if my case does not match?",
              body: "A different site path and human review are suggested to recalibrate.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createWhatsAppSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "whatsapp-purpose",
      title: isSpanish ? "Qué hace WhatsApp Business hoy" : "What WhatsApp Business does today",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Atención inicial",
              body: "Resolvemos dudas de orientación y guiamos el siguiente paso para cada caso.",
            },
            {
              title: "Seguimiento activo",
              body: "En este módulo se puede gestionar recordatorios y estado general del contacto.",
            },
            {
              title: "Derivación humana",
              body: "Cuando el caso requiere revisión o decisión, pasa a un especialista.",
            },
          ]
        : [
            {
              title: "Initial guidance",
              body: "We handle initial orientation questions and guide the next action for each case.",
            },
            {
              title: "Active follow-up",
              body: "This module can track reminders and a visible contact status.",
            },
            {
              title: "Human escalation",
              body: "When a case requires review or decision, it escalates to a specialist.",
            },
          ],
    },
    {
      id: "whatsapp-steps",
      title: isSpanish ? "Flujo operativo" : "Operational flow",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "1) Inicio por mensaje",
              body: "Abres el canal compartiendo contexto general y objetivo.",
            },
            {
              title: "2) Clasificación inicial",
              body: "Se identifica si es una consulta, seguimiento, duda rápida o solicitud de cita.",
            },
            {
              title: "3) Seguimiento",
              body: "Se programan recordatorios y se deja claro el siguiente paso cuando hay disponibilidad.",
            },
            {
              title: "4) Derivación",
              body: "Si requiere revisión profesional o información adicional, se transfiere a humano.",
            },
          ]
        : [
            {
              title: "1) Message opens channel",
              body: "You start by sharing general context and your objective.",
            },
            {
              title: "2) Initial classification",
              body: "The request is identified as inquiry, follow-up, quick question, or appointment request.",
            },
            {
              title: "3) Follow-up",
              body: "Reminders and contact status become visible while a clear next step is kept.",
            },
            {
              title: "4) Escalation",
              body: "If review or professional input is needed, it is handed to a specialist.",
            },
          ],
    },
    {
      id: "whatsapp-safe-links",
      title: isSpanish ? "Enlaces y seguridad" : "Links and safety",
      variant: "feature",
      items: [
        {
          title: isSpanish ? "Enlaces de pago seguros" : "Secure payment links",
          body: isSpanish
            ? "Se compartirán solo cuando esté autorizado y el flujo lo requiera."
            : "Secure links are shared only when authorized and requested by the flow.",
        },
        {
          title: isSpanish ? "Verificación de identidad" : "Identity verification",
          body: isSpanish
            ? "No se asume identidad dentro del chat público; se valida por canal seguro cuando aplique."
            : "Identity is not assumed in public messaging; it is verified through secure channels when needed.",
        },
      ],
    },
    {
      id: "whatsapp-availability",
      title: isSpanish ? "Qué puedes pedir hoy" : "What you can ask today",
      variant: "checklist",
      items: isSpanish
        ? [
            { title: "Agendar", body: "Apertura de primera interacción y orientación inicial." },
            {
              title: "Preguntas frecuentes",
              body: "Dudas iniciales sobre crédito, taxes, negocio o vivienda.",
            },
            {
              title: "Recordatorios",
              body: "Estado general y próximos pasos, sin tratar información sensible aquí.",
            },
          ]
        : [
            { title: "Schedule", body: "Opening interaction and initial orientation." },
            { title: "FAQ", body: "Basic questions on credit, taxes, business, or home buying." },
            {
              title: "Reminders",
              body: "General status and next steps, without sensitive information handling here.",
            },
          ],
    },
    {
      id: "whatsapp-notifications",
      title: isSpanish ? "Notificaciones y agenda" : "Notifications and scheduling",
      variant: "checklist",
      items: isSpanish
        ? [
            {
              title: "Recordatorios de seguimiento",
              body: "Se enviarán avisos cuando haya cambios de estado en tus próximos pasos.",
            },
            {
              title: "Confirmación de citas",
              body: "Se notificará fecha, hora y canal asignado antes de la reunión.",
            },
            {
              title: "Límite de alcance",
              body: "Los recordatorios no sustituyen la revisión humana ni el consentimiento del caso.",
            },
          ]
        : [
            {
              title: "Follow-up reminders",
              body: "Notifications are sent when your next-step status changes.",
            },
            {
              title: "Appointment confirmations",
              body: "Date, time and assigned channel are shared before the scheduled meeting.",
            },
            {
              title: "Scope boundary",
              body: "Reminders never replace human review or case-level consent.",
            },
          ],
    },
    {
      id: "whatsapp-faqs",
      title: isSpanish ? "Preguntas frecuentes" : "Frequently asked questions",
      variant: "faq",
      items: isSpanish
        ? [
            {
              title: "¿Ya está activo este canal?",
              body: "La experiencia está construida; la conexión a la plataforma WhatsApp Business se deja para próxima fase.",
            },
            {
              title: "¿Puedo enviar documentos sensibles?",
              body: "No, aquí no se recopila ni procesa información sensible en esta etapa.",
            },
            {
              title: "¿Cuándo se transfiere a humano?",
              body: "Siempre que haya necesidad de revisión, citas complejas o decisión especializada.",
            },
          ]
        : [
            {
              title: "Is this channel already active?",
              body: "The experience is built; WhatsApp Business platform connection is planned for the next phase.",
            },
            {
              title: "Can I send sensitive documents?",
              body: "No, sensitive information is not collected or processed in this stage.",
            },
            {
              title: "When does it escalate to a person?",
              body: "Any case requiring review, complex scheduling, or specialist decision is escalated.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createPhoneAgentSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "phone-purpose",
      title: isSpanish ? "Qué hace el agente telefónico" : "What the phone agent does",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Respuesta inicial",
              body: "Atiende la llamada y dirige la conversación hacia el siguiente paso.",
            },
            {
              title: "Detección de idioma",
              body: "Identifica si la interacción inicial es en español o inglés y ajusta el canal.",
            },
            {
              title: "Clasificación rápida",
              body: "Distingue prospecto de cliente y detecta el motivo principal de la llamada.",
            },
          ]
        : [
            {
              title: "Initial response",
              body: "The call is answered and guided toward the correct next step.",
            },
            {
              title: "Language detection",
              body: "The initial interaction is detected as Spanish or English and routed consistently.",
            },
            {
              title: "Fast classification",
              body: "Prospect versus client is identified and call intent is captured.",
            },
          ],
    },
    {
      id: "phone-process",
      title: isSpanish ? "Flujo operativo" : "Operational flow",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "1) Identificación",
              body: "Se confirma el contexto y se clasifica el motivo.",
            },
            {
              title: "2) Toma de mensajes",
              body: "Si no hay disponibilidad, se captura un mensaje y resumen para seguimiento.",
            },
            {
              title: "3) Agenda",
              body: "Se consulta disponibilidad y se ofrece cita cuando aplica.",
            },
            {
              title: "4) Derivación",
              body: "Casos que requieren revisión se transfieren a humano sin ejecutar trámites.",
            },
            {
              title: "5) Cierre seguro",
              body: "Se registran estado visible y siguientes pasos sin solicitar información sensible.",
            },
          ]
        : [
            { title: "1) Identify", body: "Context is confirmed and call intent is classified." },
            {
              title: "2) Take messages",
              body: "If unavailable, a message and summary are recorded for follow-up.",
            },
            {
              title: "3) Schedule",
              body: "Availability is checked and appointment is offered when possible.",
            },
            {
              title: "4) Escalate",
              body: "Cases requiring review are transferred to a human; no complex transactions are run.",
            },
            {
              title: "5) Safe close",
              body: "Status and next step are summarized without collecting sensitive data.",
            },
          ],
    },
    {
      id: "phone-capabilities",
      title: isSpanish ? "Capacidades" : "Capabilities",
      variant: "checklist",
      items: isSpanish
        ? [
            {
              title: "Crear leads",
              body: "Registra información de contacto inicial para seguimiento.",
            },
            {
              title: "Motivo de contacto",
              body: "Captura la necesidad principal de forma breve y útil.",
            },
            {
              title: "Consultar agenda",
              body: "Permite informar disponibilidad sin exponer reglas internas.",
            },
            {
              title: "Notificar estados",
              body: "Entrega estado general posterior a validar identidad.",
            },
          ]
        : [
            { title: "Create leads", body: "Captures initial contact details for follow-up." },
            {
              title: "Capture intent",
              body: "Records the core reason for the call in a concise format.",
            },
            {
              title: "Check schedule",
              body: "Can share availability without exposing internal rules.",
            },
            {
              title: "Share status",
              body: "Provides general status updates after identity validation.",
            },
          ],
    },
    {
      id: "phone-faqs",
      title: isSpanish ? "Preguntas frecuentes" : "Frequently asked questions",
      variant: "faq",
      items: isSpanish
        ? [
            {
              title: "¿Ya está activo este canal?",
              body: "La experiencia web está documentada; la integración telefónica real queda para una fase posterior.",
            },
            {
              title: "¿Podría pedir asesoría completa por llamada?",
              body: "No. La llamada inicial sirve para clasificar y guiar, no para realizar trámites.",
            },
            {
              title: "¿Puedo dejar un mensaje?",
              body: "Sí. El sistema puede guardar mensaje, motivo y resumen para retorno por canal seguro.",
            },
          ]
        : [
            {
              title: "Is this channel already active?",
              body: "The web experience is documented; live telephone integration is planned for a later phase.",
            },
            {
              title: "Can I request full advisory service on call?",
              body: "No. The call intake supports classification and triage, not full execution.",
            },
            {
              title: "Can I leave a message?",
              body: "Yes. The system can store a message, intent, and summary for follow-up through a secure channel.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createPublicFormsSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "forms-purpose",
      title: isSpanish ? "Qué cubren los formularios públicos" : "What public forms cover",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Contacto inicial",
              body: "Permiten compartir contexto general para derivar al módulo correcto.",
            },
            {
              title: "Solicitud de asesoría",
              body: "Recolectan intención, prioridad y preferencia de idioma sin pedir datos sensibles.",
            },
            {
              title: "Consentimiento básico",
              body: "Guarda intención y fuente para una continuidad responsable.",
            },
          ]
        : [
            {
              title: "Initial contact",
              body: "They capture general context to route to the right module.",
            },
            {
              title: "Guidance request",
              body: "Capture intent, priority and language preference without sensitive data.",
            },
            {
              title: "Basic consent",
              body: "Stores intent and source for responsible continuation.",
            },
          ],
    },
    {
      id: "forms-process",
      title: isSpanish ? "Flujo de recepción" : "Submission flow",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "1) Selección de objetivo",
              body: "El visitante elige si busca asesoría, evaluación o información adicional.",
            },
            {
              title: "2) Validaciones",
              body: "Se validan campos mínimos para evitar ruido y mejorar trazabilidad.",
            },
            {
              title: "3) Consentimiento",
              body: "Se solicita permiso para contacto y seguimiento según reglas de privacidad.",
            },
            {
              title: "4) Estado de lead",
              body: "La información habilita un estado inicial de seguimiento y revisión humana.",
            },
          ]
        : [
            {
              title: "1) Select goal",
              body: "Visitor chooses if they seek advisory, evaluation or general information.",
            },
            {
              title: "2) Validation",
              body: "Minimum fields are validated to reduce noise and improve traceability.",
            },
            {
              title: "3) Consent",
              body: "Permission is collected for contact and follow-up under privacy rules.",
            },
            {
              title: "4) Lead status",
              body: "Data enables an initial follow-up status and human review.",
            },
          ],
    },
    {
      id: "forms-controls",
      title: isSpanish ? "Controles de seguridad" : "Safety controls",
      variant: "checklist",
      items: isSpanish
        ? [
            {
              title: "Validación de formato",
              body: "Números y correos verificables antes de avanzar.",
            },
            {
              title: "Spam y abusos",
              body: "Filtros y reglas para proteger el canal y evitar entradas inválidas.",
            },
            {
              title: "Conversión a lead",
              body: "La derivación ocurre con contexto útil, sin exponer datos sensibles.",
            },
          ]
        : [
            { title: "Format validation", body: "Phone and email checks run before progression." },
            { title: "Spam prevention", body: "Filters and rules protect the channel from abuse." },
            {
              title: "Lead conversion",
              body: "Escalation is created with useful context and no sensitive data exposure.",
            },
          ],
    },
    {
      id: "forms-faqs",
      title: isSpanish ? "Preguntas frecuentes" : "Frequently asked questions",
      variant: "faq",
      items: isSpanish
        ? [
            {
              title: "¿Puedo enviar documentos en este formulario?",
              body: "No, esta etapa no incluye carga de documentos en público.",
            },
            {
              title: "¿Qué pasa si no completo un campo?",
              body: "Se permite avanzar solo con la información mínima requerida.",
            },
            {
              title: "¿La información se usa para algo legal?",
              body: "Se usa para organizar seguimiento y derivación conforme a límites de privacidad.",
            },
          ]
        : [
            {
              title: "Can I upload documents in this form?",
              body: "No, this stage does not support public document upload.",
            },
            {
              title: "What if I miss a field?",
              body: "You may only proceed when required minimum information is complete.",
            },
            {
              title: "Is the information used for legal action?",
              body: "It is used to organize follow-up and routing under privacy boundaries.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createPortalAuthSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "portal-entry",
      title: isSpanish ? "Ingreso al portal del cliente" : "Client portal access",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Email y contraseña",
              body: "Opciones iniciales para mantener acceso identificado en futuras fases.",
            },
            {
              title: "Login social",
              body: "Diseño preparado para inicio con proveedor externo cuando aplique.",
            },
            {
              title: "Recuperación y verificación",
              body: "Recuperación de cuenta y validación de email como base de seguridad.",
            },
          ]
        : [
            {
              title: "Email and password",
              body: "Initial options for maintaining identified access in later phases.",
            },
            {
              title: "Social login",
              body: "Design prepared for identity provider login where applicable.",
            },
            {
              title: "Recovery and verification",
              body: "Account recovery and email verification as security foundations.",
            },
          ],
    },
    {
      id: "portal-auth-process",
      title: isSpanish ? "Gestión de cuenta" : "Account management",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "1) Creación o ingreso",
              body: "Se inicia con una identidad de cliente verificada.",
            },
            {
              title: "2) Sesiones activas",
              body: "Se registra sesión y dispositivos para continuidad controlada.",
            },
            {
              title: "3) Perfil del cliente",
              body: "Idioma y datos no sensibles disponibles para personalizar la experiencia.",
            },
            {
              title: "4) Seguridad progresiva",
              body: "MFA y validaciones adicionales solo se habilitan en operaciones críticas.",
            },
          ]
        : [
            { title: "1) Sign in or create", body: "Starts with a verified client identity." },
            {
              title: "2) Active sessions",
              body: "Session and devices are tracked for controlled continuity.",
            },
            {
              title: "3) Client profile",
              body: "Language and non-sensitive settings are available to personalize experience.",
            },
            {
              title: "4) Progressive security",
              body: "MFA and extra checks are enabled only for sensitive actions.",
            },
          ],
    },
    {
      id: "portal-auth-controls",
      title: isSpanish ? "Límites y protección" : "Limits and protection",
      variant: "feature",
      items: [
        {
          title: isSpanish ? "Sin acceso parcial sin login" : "No partial access without login",
          body: isSpanish
            ? "Funciones sensibles del cliente se reservan para sesiones válidas."
            : "Sensitive client functions are reserved for valid authenticated sessions.",
        },
        {
          title: isSpanish ? "Privacidad del perfil" : "Profile privacy",
          body: isSpanish
            ? "Se minimiza el almacenamiento y no se usa información sensible fuera de su contexto."
            : "Storage is minimized and sensitive information is not used outside intended context.",
        },
      ],
    },
    createNextStepSection(locale),
  ];
}

function createCustomerDashboardSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "dashboard-overview",
      title: isSpanish ? "Qué mostrará el dashboard" : "What the dashboard will show",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Servicios contratados",
              body: "Estado visible por servicio y fase de avance.",
            },
            { title: "Pagos", body: "Visión de pagos solicitados, pendientes y confirmados." },
            {
              title: "Documentos",
              body: "Pendientes y estado de revisión antes de continuar.",
            },
          ]
        : [
            {
              title: "Purchased services",
              body: "Visible state by service and progress phase.",
            },
            { title: "Payments", body: "View requested, pending and confirmed payments." },
            { title: "Documents", body: "Pending items and review status before continuation." },
          ],
    },
    {
      id: "dashboard-actions",
      title: isSpanish ? "Acciones principales" : "Primary actions",
      variant: "checklist",
      items: isSpanish
        ? [
            { title: "Próximos pasos", body: "Lista priorizada por servicio y urgencia." },
            { title: "Tareas", body: "Seguimiento de tareas internas y cliente-aprobadas." },
            { title: "Notificaciones", body: "Estado general del proceso y recordatorios." },
          ]
        : [
            { title: "Next steps", body: "Priority list by service and urgency." },
            { title: "Tasks", body: "Follow-up on internal and client-approved tasks." },
            { title: "Notifications", body: "Process-wide status and reminders." },
          ],
    },
    {
      id: "dashboard-availability",
      title: isSpanish ? "Disponibilidad operativa" : "Operational availability",
      variant: "feature",
      items: isSpanish
        ? [
            {
              title: "No promesas automáticas",
              body: "El avance mostrado refleja estado real y no implica aprobación garantizada.",
            },
            {
              title: "Sin datos sensibles públicos",
              body: "La vista final queda protegida detrás del acceso autenticado.",
            },
          ]
        : [
            {
              title: "No automatic guarantees",
              body: "Visible progress reflects actual state and does not imply guaranteed approval.",
            },
            {
              title: "No public sensitive data",
              body: "Final dashboard is protected behind authenticated access.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createMyServicesSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "my-services-structure",
      title: isSpanish ? "Qué mostrará Mis servicios" : "What My Services shows",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "1) Lista de servicios",
              body: "Nombre del servicio, estado actual y responsable asignado.",
            },
            {
              title: "2) Cronología",
              body: "Notas clave y estado de cada etapa de revisión.",
            },
            {
              title: "3) Requisitos",
              body: "Qué se espera del cliente y qué viene del equipo interno.",
            },
            {
              title: "4) Próximo paso",
              body: "Acción recomendada por servicio para evitar estancamiento.",
            },
          ]
        : [
            { title: "1) Services list", body: "Service name, current status and assigned owner." },
            {
              title: "2) Timeline",
              body: "Key notes and status per review stage.",
            },
            {
              title: "3) Requirements",
              body: "What is expected from client and what comes from internal team.",
            },
            {
              title: "4) Next step",
              body: "Service-specific recommended action to avoid stalling.",
            },
          ],
    },
    {
      id: "my-services-statuses",
      title: isSpanish ? "Estados por servicio" : "Service statuses",
      variant: "checklist",
      items: isSpanish
        ? [
            { title: "En curso", body: "Evaluación y preparación activas." },
            { title: "Documentos pendientes", body: "Información adicional esperada del cliente." },
            { title: "Esperando revisión", body: "Requiere validación interna o externa." },
          ]
        : [
            { title: "In progress", body: "Evaluation and preparation active." },
            { title: "Pending documents", body: "Additional client information is expected." },
            { title: "Awaiting review", body: "Requires internal or external validation." },
          ],
    },
    {
      id: "my-services-safe-boundaries",
      title: isSpanish ? "Límites de alcance" : "Scope boundaries",
      variant: "feature",
      items: isSpanish
        ? [
            {
              title: "No trámites automáticos",
              body: "Cada decisión importante conserva revisión humana.",
            },
            {
              title: "Información mínima",
              body: "No se mostrará nada sensible hasta el canal seguro correspondiente.",
            },
          ]
        : [
            {
              title: "No automatic filing",
              body: "Important decisions remain under human review.",
            },
            {
              title: "Minimum exposure",
              body: "No sensitive details are shown until the secure flow is active.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createProcessStatusSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "process-status-overview",
      title: isSpanish ? "Estados del proceso" : "Process statuses",
      variant: "checklist",
      items: isSpanish
        ? [
            { title: "intake iniciado", body: "La solicitud entró y fue clasificada." },
            {
              title: "información incompleta",
              body: "Esperamos datos o documentos no sensibles para continuar.",
            },
            {
              title: "pago pendiente",
              body: "No avanza a autorización sin confirmar flujo financiero.",
            },
          ]
        : [
            { title: "intake started", body: "Request arrived and was classified." },
            {
              title: "information incomplete",
              body: "Awaiting non-sensitive details or follow-up to continue.",
            },
            {
              title: "payment pending",
              body: "Does not move to authorization until flow is confirmed.",
            },
          ],
    },
    {
      id: "process-status-details",
      title: isSpanish ? "Más estados clave" : "Additional key statuses",
      variant: "cards",
      items: isSpanish
        ? [
            { title: "pago confirmado", body: "Condición habilitante para continuar en el flujo." },
            { title: "pendiente de revisión", body: "Revisión humana activa antes de avanzar." },
            {
              title: "autorizado para comenzar",
              body: "Listo para iniciar el trabajo correspondiente.",
            },
            {
              title: "en progreso / esperando respuesta",
              body: "Progreso operativo con requerimientos de partes internas o externas.",
            },
          ]
        : [
            { title: "payment confirmed", body: "Required condition to continue in some flows." },
            { title: "pending review", body: "Human review is active before moving on." },
            { title: "authorized to start", body: "Ready to begin the contracted work." },
            {
              title: "in progress / awaiting response",
              body: "Operational progress with internal or external dependency responses.",
            },
          ],
    },
    {
      id: "process-status-notes",
      title: isSpanish ? "Notas para el cliente" : "Notes for the client",
      variant: "feature",
      items: isSpanish
        ? [
            {
              title: "Estado visible, no determinista",
              body: "La etiqueta describe estado operativo y no garantiza resultados.",
            },
            {
              title: "Siguiente acción",
              body: "Cada cambio significativo propone un próximo paso claro y verificable.",
            },
          ]
        : [
            {
              title: "Visible status, not deterministic",
              body: "The label describes operational state and does not guarantee outcomes.",
            },
            {
              title: "Next action",
              body: "Each significant change should suggest one clear, verifiable next step.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createHelpCenterSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "help-paths",
      title: isSpanish ? "Encuentra la salida que te toca" : "Find the path that fits your case",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Crédito",
              body: "Qué revisar primero y cómo preparar la conversación con prestamistas.",
              href: "/servicios/credito/",
            },
            {
              title: "Taxes",
              body: "Qué documentos reúnen mayor impacto antes de una revisión organizada.",
              href: "/servicios/taxes/",
            },
            {
              title: "Negocios",
              body: "Cómo ordenar formación, cumplimiento y financiamiento empresarial.",
              href: "/servicios/formacion-de-negocios/",
            },
            {
              title: "Comenzar con preguntas",
              body: "Plantéate tus dudas con el formato correcto para avanzar rápido.",
              href: "/preguntas-frecuentes/",
            },
          ]
        : [
            {
              title: "Credit",
              body: "What to review first and how to prepare lender conversations.",
              href: "/en/services/credit/",
            },
            {
              title: "Taxes",
              body: "Which documents give the best starting point for an organized review.",
              href: "/en/services/taxes/",
            },
            {
              title: "Business",
              body: "How to organize formation, compliance and business funding priorities.",
              href: "/en/services/business-formation/",
            },
            {
              title: "Start with questions",
              body: "Ask with structure so you get clear answers faster.",
              href: "/en/faq/",
            },
          ],
    },
    {
      id: "help-search",
      title: isSpanish ? "Buscar dentro de este centro" : "Search inside this center",
      variant: "feature",
      items: isSpanish
        ? [
            {
              title: "Preguntas rápidas por tema",
              body: "Por ahora usa la navegación por secciones para filtrar dudas por servicio o tipo de proceso.",
            },
            {
              title: "Búsqueda IA (previa fase)",
              body: "Está planificada para conectar después, una vez tengamos el sistema de recuperación activo.",
            },
          ]
        : [
            {
              title: "Quick topic search",
              body: "Use section-based navigation for now to narrow questions by service or process type.",
            },
            {
              title: "AI search (upcoming)",
              body: "Planned for the next phase, after the retrieval system is available.",
            },
          ],
    },
    {
      id: "help-knowledge",
      title: isSpanish ? "Artículos y guías" : "Articles and guides",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Guía inicial de evaluación",
              body: "Cómo preparar la primera conversación sin prisa y sin enviar datos sensibles.",
              href: "/centro-de-ayuda/?recurso=guia-evaluacion",
            },
            {
              title: "Checklist de crédito antes de avanzar",
              body: "Qué revisar primero en reporte, gastos y cronogramas para ganar claridad.",
              href: "/centro-de-ayuda/?recurso=checklist-credito",
            },
            {
              title: "Checklist tributaria básica",
              body: "Cómo organizar ingresos y documentos para una revisión inicial ordenada.",
              href: "/centro-de-ayuda/?recurso=checklist-taxes",
            },
            {
              title: "Guía para iniciar negocio",
              body: "Conoce el orden recomendado entre formación, compliance y continuidad operativa.",
              href: "/centro-de-ayuda/?recurso=guia-negocio",
            },
          ]
        : [
            {
              title: "Initial evaluation guide",
              body: "How to prepare a first conversation without sharing sensitive data.",
              href: "/en/help-center/?resource=initial-evaluation-guide",
            },
            {
              title: "Credit readiness checklist",
              body: "What to review first in reports, spending and timeline to get clearer next steps.",
              href: "/en/help-center/?resource=credit-checklist",
            },
            {
              title: "Basic tax checklist",
              body: "How to organize income and documents for an orderly first review.",
              href: "/en/help-center/?resource=tax-checklist",
            },
            {
              title: "Business setup guide",
              body: "Understand the recommended sequence between formation, compliance and operations.",
              href: "/en/help-center/?resource=business-guide",
            },
          ],
    },
    {
      id: "help-tutorials",
      title: isSpanish ? "Tutoriales y videos" : "Tutorials and videos",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Qué esperar en una primera evaluación",
              body: "Video corto sobre alcance, límites y próximos pasos de la conversación inicial.",
            },
            {
              title: "Cómo organizar documentos en 5 pasos",
              body: "Guía visual para evitar recolección incompleta y mantener historial ordenado.",
            },
            {
              title: "Checklist de compra de vivienda",
              body: "Introducción a presupuesto, crédito y documentación para conversaciones con prestamistas.",
            },
          ]
        : [
            {
              title: "What to expect in the first evaluation",
              body: "Short walkthrough on scope, limits and clear next steps for the initial consult.",
            },
            {
              title: "How to organize documents in 5 steps",
              body: "Visual guide to avoid incomplete collection and keep an orderly history.",
            },
            {
              title: "Home-buying checklist",
              body: "A quick intro to budget, credit and documentation before lender conversations.",
            },
          ],
    },
    {
      id: "help-tools",
      title: isSpanish ? "Herramientas de apoyo" : "Support tools",
      variant: "checklist",
      items: isSpanish
        ? [
            {
              title: "Calculadora inicial (en desarrollo)",
              body: "Comparará variables de situación para sugerir qué tipo de asesoría pedir en una segunda fase.",
            },
            {
              title: "Asistente conversacional (en desarrollo)",
              body: "Atiende preguntas de contexto con respuestas educativas y límites claros de alcance.",
            },
            {
              title: "Búsqueda semántica (en desarrollo)",
              body: "Se habilitará cuando el inventario de contenidos tenga metadatos y estado de publicación.",
            },
          ]
        : [
            {
              title: "Starter calculator (in development)",
              body: "Will compare your inputs to suggest the most relevant intake path in a future phase.",
            },
            {
              title: "Conversational assistant (in development)",
              body: "Will answer educational questions with clear scope boundaries and safe defaults.",
            },
            {
              title: "Semantic search (in development)",
              body: "Will activate once the content inventory has publishing metadata and states.",
            },
          ],
    },
    {
      id: "help-questions",
      title: isSpanish
        ? "Preguntas frecuentes de contexto"
        : "Contextual frequently asked questions",
      variant: "faq",
      items: isSpanish
        ? [
            {
              title: "¿Qué necesito para pedir una evaluación?",
              body: "Un contexto realista del objetivo y la situación actual; no se requieren datos sensibles en esta etapa.",
            },
            {
              title: "¿Cuánto cuesta la evaluación?",
              body: "El costo se define según el alcance y siempre se explica antes de compartir documentos sensibles.",
            },
            {
              title: "¿Cuándo me conviene avanzar?",
              body: "Cuando tienes una meta clara y una lista de documentos base para organizar.",
            },
          ]
        : [
            {
              title: "What do I need to request an evaluation?",
              body: "A realistic overview of your goal and current situation; sensitive data is not required at this stage.",
            },
            {
              title: "How much does evaluation cost?",
              body: "Cost is scoped by service needs and always explained before sensitive documents are requested.",
            },
            {
              title: "When should I proceed?",
              body: "When you have a clear target and a starter document list to organize the next steps.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createAcademySections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "academy-path",
      title: isSpanish ? "Rutas de aprendizaje público" : "Public learning paths",
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "Preparación inicial",
              body: "Resumen de conceptos clave para decidir si necesitas evaluación o asesoría.",
            },
            {
              title: "Documentación y control",
              body: "Plantillas para organizar fechas, notas y preguntas antes de cualquier conversación.",
            },
            {
              title: "Seguimiento y riesgos",
              body: "Checklist para detectar retrasos, cambios o información faltante.",
            },
          ]
        : [
            {
              title: "Initial preparation",
              body: "Concept summary to decide whether evaluation or advisory guidance is needed.",
            },
            {
              title: "Documents and control",
              body: "Templates to organize dates, notes and questions before any conversation.",
            },
            {
              title: "Follow-up and risks",
              body: "A checklist to identify delays, changes or missing information.",
            },
          ],
    },
    {
      id: "academy-resources",
      title: isSpanish ? "Recursos de la academia" : "Academy resources",
      variant: "cards",
      items: isSpanish
        ? [
            {
              title: "Guía de vocabulario financiero",
              body: "Términos clave para entender avisos de reporte, cumplimiento y costos.",
              href: "/preguntas-frecuentes/",
            },
            {
              title: "Checklist de evaluación",
              body: "Qué preparar antes de compartir cualquier detalle operativo.",
              href: "/preguntas-frecuentes/",
            },
            {
              title: "Checklist de seguimiento",
              body: "Cómo documentar avances sin prometer resultados de aprobación.",
              href: "/contacto/?intent=evaluacion",
            },
          ]
        : [
            {
              title: "Financial glossary",
              body: "Key terms to understand reports, compliance and cost communications.",
              href: "/en/faq/",
            },
            {
              title: "Evaluation checklist",
              body: "What to prepare before sharing any operational details.",
              href: "/en/faq/",
            },
            {
              title: "Follow-up checklist",
              body: "How to track progress without guaranteeing approval outcomes.",
              href: "/en/contact/?intent=evaluation",
            },
          ],
    },
    {
      id: "academy-updates",
      title: isSpanish ? "Actualización y revisión continua" : "Continuous update and review",
      variant: "prose",
      items: [
        {
          title: isSpanish ? "Revisión periódica" : "Periodic review",
          body: isSpanish
            ? "El contenido se revisa con un ciclo de actualización para mantener fechas, reglas y ejemplos alineados."
            : "Content is reviewed on a regular cadence to keep dates, rules and examples aligned.",
        },
      ],
    },
  ];
}

function createFaqSections(locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "common-questions",
      title: isSpanish ? "Respuestas antes de comenzar" : "Answers before you begin",
      variant: "faq",
      items: isSpanish
        ? [
            {
              title: "¿Tengo que crear una cuenta primero?",
              body: "No. El proceso comercial comienza con una evaluación o cotización; la cuenta llega cuando corresponde.",
            },
            {
              title: "¿Publican todos los precios?",
              body: "No. Algunos servicios requieren una evaluación o cotización según el alcance.",
            },
            {
              title: "¿Puedo enviar documentos por la web pública?",
              body: "No. Los documentos sensibles deben utilizar el canal privado que se indique durante el proceso.",
            },
            {
              title: "¿SG Solutions garantiza resultados?",
              body: "No. Los resultados y decisiones dependen de información, terceros y condiciones aplicables.",
            },
            {
              title: "¿El centro de ayuda funciona en español e inglés?",
              body: "Sí. Cada bloque principal tiene versión bilingüe y se mantiene en paralelo.",
            },
            {
              title: "¿Habrá buscador y videos aquí mismo?",
              body: "Sí, están previstos para la siguiente fase dentro del alcance del módulo de experiencia pública.",
            },
          ]
        : [
            {
              title: "Do I need to create an account first?",
              body: "No. The commercial process starts with an evaluation or quote; an account follows when appropriate.",
            },
            {
              title: "Are all prices public?",
              body: "No. Some services require an evaluation or quote based on scope.",
            },
            {
              title: "Can I upload documents on the public site?",
              body: "No. Sensitive documents must use the private channel identified during the process.",
            },
            {
              title: "Does SG Solutions guarantee results?",
              body: "No. Results and decisions depend on information, third parties and applicable conditions.",
            },
            {
              title: "Is the help center bilingual?",
              body: "Yes. Every major help block is maintained in parallel in Spanish and English.",
            },
            {
              title: "Will search and videos be available here?",
              body: "Yes, they are planned for the next phase within the public experience module scope.",
            },
          ],
    },
    createNextStepSection(locale),
  ];
}

function createPolicySections(routeKey: RouteKey, locale: Locale): PublicSection[] {
  const isSpanish = locale === "es";
  return [
    {
      id: "review-status",
      title: isSpanish
        ? "Contenido pendiente de revisión calificada"
        : "Content pending qualified review",
      variant: "feature",
      items: [
        {
          title: isSpanish ? "Estado previo al lanzamiento" : "Pre-launch status",
          body: isSpanish
            ? "Esta página describe la intención del producto, pero no sustituye una política o divulgación aprobada por profesionales calificados."
            : "This page describes product intent but does not replace a policy or disclosure approved by qualified professionals.",
        },
      ],
    },
    {
      id: "current-boundary",
      title: isSpanish ? "Límite vigente del sitio" : "Current website boundary",
      variant: "prose",
      items: [
        {
          title: isSpanish ? "Superficie informativa" : "Informational surface",
          body: policyBoundary(routeKey, locale),
        },
      ],
    },
  ];
}

function createNextStepSection(locale: Locale): PublicSection {
  const isSpanish = locale === "es";
  return {
    id: "next-step",
    title: isSpanish ? "Tu próximo paso debe sentirse claro" : "Your next step should feel clear",
    variant: "feature",
    items: [
      {
        title: isSpanish ? "Agenda una evaluación" : "Schedule an evaluation",
        body: isSpanish
          ? "Cuando el canal esté activo, podrás comenzar con contexto general y sin compartir documentos sensibles."
          : "When the channel is active, you can begin with general context and without sharing sensitive documents.",
        href: isSpanish ? "/contacto/?intent=evaluacion" : "/en/contact/?intent=evaluation",
      },
    ],
  };
}

function createTrustSection(locale: Locale): PublicSection {
  const isSpanish = locale === "es";
  return {
    id: "trust",
    title: isSpanish ? "Confianza construida con claridad" : "Trust built through clarity",
    variant: "cards",
    items: isSpanish
      ? [
          { title: "Bilingüe", body: "Información esencial en español e inglés." },
          { title: "Humano", body: "Las decisiones importantes permanecen bajo revisión humana." },
          { title: "Privado", body: "Los datos sensibles no pertenecen a la web pública." },
        ]
      : [
          { title: "Bilingual", body: "Essential information in Spanish and English." },
          { title: "Human", body: "Important decisions remain under human review." },
          { title: "Private", body: "Sensitive data does not belong on the public website." },
        ],
  };
}

function policyBoundary(routeKey: RouteKey, locale: Locale): string {
  const isSpanish = locale === "es";
  const boundaries: Partial<Record<RouteKey, [string, string]>> = {
    privacy: [
      "M001 no activa formularios, uploads ni analítica de terceros. Ninguna información personal se considera enviada por visitar estas páginas.",
      "M001 does not activate forms, uploads or third-party analytics. No personal information is considered submitted by visiting these pages.",
    ],
    terms: [
      "El contenido es informativo y no crea por sí solo una relación profesional, una contratación o una garantía de resultado.",
      "Content is informational and does not by itself create a professional relationship, engagement or outcome guarantee.",
    ],
    accessibility: [
      "La experiencia se diseña para WCAG 2.2 AA, navegación por teclado, zoom y movimiento reducido; los hallazgos se corrigen con pruebas de regresión.",
      "The experience targets WCAG 2.2 AA, keyboard navigation, zoom and reduced motion; findings are corrected with regression tests.",
    ],
    disclosures: [
      "Los servicios y productos de terceros dependen del perfil, proveedor, jurisdicción y condiciones aplicables. No se garantiza aprobación.",
      "Third-party services and products depend on profile, provider, jurisdiction and applicable conditions. Approval is not guaranteed.",
    ],
  };
  return (
    boundaries[routeKey]?.[isSpanish ? 0 : 1] ??
    (isSpanish
      ? "La versión final requiere revisión y aprobación antes de publicarse en producción."
      : "The final version requires review and approval before production publication.")
  );
}

function ensureSummaryLength(description: string, locale: Locale): string {
  const suffix =
    locale === "es"
      ? " Conoce el alcance, la preparación y el próximo paso antes de compartir información sensible."
      : " Understand scope, preparation and the next step before sharing sensitive information.";
  return description.length > 80 ? description : `${description}${suffix}`;
}

function ensureHeadingLength(heading: string, locale: Locale): string {
  if (heading.length > 12) return heading;
  return locale === "es" ? `${heading} con claridad` : `${heading} with clarity`;
}
