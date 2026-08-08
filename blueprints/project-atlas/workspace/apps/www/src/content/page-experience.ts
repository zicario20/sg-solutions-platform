import type { Locale, PageHero, PublicPage, PublicSection, RouteKey } from "../domain/public-site";

interface ExperienceInput {
  routeKey: RouteKey;
  kind: PublicPage["kind"];
  locale: Locale;
  title: string;
  description: string;
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

const serviceDetails: Record<
  Extract<RouteKey, `service-${string}`> | "marketplace",
  Record<Locale, { helps: string[]; prepare: string[] }>
> = {
  "service-credit": {
    es: {
      helps: [
        "Reunir información de tus reportes y objetivos.",
        "Identificar factores que merecen una revisión más cuidadosa.",
        "Convertir observaciones en próximos pasos educativos y verificables.",
      ],
      prepare: ["Reportes disponibles", "Objetivos y fechas importantes", "Preguntas específicas"],
    },
    en: {
      helps: [
        "Bring your available reports and goals together.",
        "Identify factors that deserve closer review.",
        "Turn observations into educational, verifiable next steps.",
      ],
      prepare: ["Available reports", "Goals and important dates", "Specific questions"],
    },
  },
  "service-credit-monitoring": {
    es: {
      helps: [
        "Aclarar qué información puede observarse con autorización.",
        "Mantener un historial comprensible de cambios relevantes.",
        "Preparar preguntas cuando una variación requiere contexto adicional.",
      ],
      prepare: ["Consentimiento aplicable", "Acceso autorizado", "Objetivo del seguimiento"],
    },
    en: {
      helps: [
        "Clarify what information may be observed with authorization.",
        "Maintain an understandable history of relevant changes.",
        "Prepare questions when a change needs additional context.",
      ],
      prepare: ["Applicable consent", "Authorized access", "Monitoring objective"],
    },
  },
  "service-taxes": {
    es: {
      helps: [
        "Organizar documentos por año y tipo de ingreso.",
        "Detectar información faltante antes de la revisión.",
        "Mantener visibles preguntas, decisiones y próximos pasos.",
      ],
      prepare: [
        "Documentos de ingresos",
        "Información de dependientes",
        "Gastos y soportes aplicables",
      ],
    },
    en: {
      helps: [
        "Organize documents by year and income type.",
        "Identify missing information before review.",
        "Keep questions, decisions and next steps visible.",
      ],
      prepare: ["Income documents", "Dependent information", "Applicable expenses and support"],
    },
  },
  "service-business-formation": {
    es: {
      helps: [
        "Definir la información inicial de la empresa.",
        "Organizar miembros, dirección y documentos requeridos.",
        "Entender la secuencia desde la preparación hasta los comprobantes.",
      ],
      prepare: ["Nombre propuesto", "Información de miembros", "Dirección y actividad del negocio"],
    },
    en: {
      helps: [
        "Define the business's initial information.",
        "Organize members, address and required documents.",
        "Understand the sequence from preparation to final records.",
      ],
      prepare: ["Proposed name", "Member information", "Business address and activity"],
    },
  },
  "service-ein": {
    es: {
      helps: [
        "Reunir datos de la entidad y la persona responsable.",
        "Revisar la información antes de una solicitud autorizada.",
        "Organizar la evidencia y la carta final cuando corresponda.",
      ],
      prepare: ["Datos de la entidad", "Responsible party", "Autorización aplicable"],
    },
    en: {
      helps: [
        "Gather entity and responsible-party information.",
        "Review information before an authorized application.",
        "Organize evidence and the final letter when applicable.",
      ],
      prepare: ["Entity details", "Responsible party", "Applicable authorization"],
    },
  },
  "service-business-compliance": {
    es: {
      helps: [
        "Mantener reportes y renovaciones en una vista organizada.",
        "Registrar fechas y requisitos que hayan sido confirmados.",
        "Preparar cambios de información con revisión humana.",
      ],
      prepare: ["Documentos de formación", "Fechas conocidas", "Cambios recientes de la empresa"],
    },
    en: {
      helps: [
        "Keep reports and renewals in an organized view.",
        "Record confirmed dates and requirements.",
        "Prepare information changes with human review.",
      ],
      prepare: ["Formation documents", "Known dates", "Recent business changes"],
    },
  },
  "service-business-funding": {
    es: {
      helps: [
        "Revisar preparación, flujo de caja y objetivos.",
        "Organizar documentos que un proveedor podría solicitar.",
        "Comparar categorías sin presentar una aprobación como segura.",
      ],
      prepare: ["Objetivo y monto estimado", "Ingresos y flujo de caja", "Documentos del negocio"],
    },
    en: {
      helps: [
        "Review readiness, cash flow and goals.",
        "Organize documents a provider may request.",
        "Compare categories without presenting approval as certain.",
      ],
      prepare: ["Goal and estimated amount", "Revenue and cash flow", "Business documents"],
    },
  },
  "service-home-buying": {
    es: {
      helps: [
        "Organizar crédito, ingresos, deudas y presupuesto.",
        "Preparar documentos y preguntas antes de hablar con un prestamista.",
        "Entender conceptos y etapas sin prometer elegibilidad.",
      ],
      prepare: ["Objetivo de vivienda", "Ingresos y deudas", "Ahorros y documentos disponibles"],
    },
    en: {
      helps: [
        "Organize credit, income, debts and budget.",
        "Prepare documents and questions before speaking with a lender.",
        "Understand concepts and stages without promising eligibility.",
      ],
      prepare: ["Housing goal", "Income and debts", "Savings and available documents"],
    },
  },
  marketplace: {
    es: {
      helps: [
        "Explicar diferencias entre categorías de productos.",
        "Mostrar requisitos y divulgaciones disponibles de cada proveedor.",
        "Separar información educativa de una recomendación individual.",
      ],
      prepare: [
        "Objetivo financiero",
        "Preguntas sobre categorías",
        "Consentimiento antes de compartir datos",
      ],
    },
    en: {
      helps: [
        "Explain differences between product categories.",
        "Show available provider requirements and disclosures.",
        "Separate educational information from an individual recommendation.",
      ],
      prepare: ["Financial goal", "Category questions", "Consent before data sharing"],
    },
  },
};

export function createPageExperience(input: ExperienceInput): {
  hero: PageHero;
  sections: PublicSection[];
  publicationState: PublicPage["publicationState"];
} {
  const copy = localized[input.locale];
  const heading = ensureHeadingLength(input.title.replace(/ \| SG Solutions$/, ""), input.locale);
  const hero = {
    eyebrow: copy.eyebrow[input.kind],
    heading,
    summary: ensureSummaryLength(input.description, input.locale),
  };

  if (input.kind === "service") {
    return {
      hero,
      sections: createServiceSections(input.routeKey as keyof typeof serviceDetails, input.locale),
      publicationState: "published",
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
    publicationState: "published",
  };
}

function createServiceSections(
  routeKey: keyof typeof serviceDetails,
  locale: Locale,
): PublicSection[] {
  const copy = localized[locale].serviceSection;
  const details = serviceDetails[routeKey][locale];
  const isSpanish = locale === "es";
  const helpTitles = isSpanish
    ? ["Entender", "Organizar", "Avanzar"]
    : ["Understand", "Organize", "Move forward"];
  return [
    {
      id: "help",
      title: copy.help,
      intro: copy.helpIntro,
      variant: "cards",
      items: details.helps.map((body, index) => ({
        title: helpTitles[index] ?? helpTitles[0] ?? "Clarity",
        body,
      })),
    },
    {
      id: "process",
      title: copy.process,
      variant: "steps",
      items: isSpanish
        ? [
            {
              title: "Cuéntanos tu objetivo",
              body: "Comenzamos con contexto general y sin pedir datos sensibles en público.",
            },
            {
              title: "Revisamos el alcance",
              body: "Aclaramos qué puede cubrir el servicio y qué requiere otro profesional.",
            },
            {
              title: "Organizamos el plan",
              body: "Definimos información, documentos y próximos pasos visibles.",
            },
            {
              title: "Damos seguimiento",
              body: "Las decisiones importantes permanecen bajo revisión humana.",
            },
          ]
        : [
            {
              title: "Tell us your goal",
              body: "We start with general context and do not request sensitive data in public.",
            },
            {
              title: "Review the scope",
              body: "We clarify what the service may cover and what requires another professional.",
            },
            {
              title: "Organize the plan",
              body: "We define information, documents and visible next steps.",
            },
            { title: "Follow through", body: "Important decisions remain under human review." },
          ],
    },
    {
      id: "prepare",
      title: copy.prepare,
      variant: "checklist",
      items: details.prepare.map((title) => ({
        title,
        body: isSpanish
          ? "Compártelo únicamente mediante el canal seguro indicado durante tu proceso."
          : "Share it only through the secure channel identified during your process.",
      })),
    },
    {
      id: "limits",
      title: copy.limits,
      variant: "feature",
      items: [
        {
          title: isSpanish ? "Decisiones informadas" : "Informed decisions",
          body: copy.limitsBody,
        },
      ],
    },
  ];
}

function createGeneralSections(routeKey: RouteKey, locale: Locale): PublicSection[] {
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
