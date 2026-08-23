import type { Locale, RelatedLink, ServicePageContent } from "../domain/public-site";

export type ServiceRoute =
  | "service-credit"
  | "service-credit-monitoring"
  | "service-taxes"
  | "service-business-formation"
  | "service-ein"
  | "service-business-compliance"
  | "service-business-credit"
  | "service-business-funding"
  | "service-loan-preparation"
  | "service-home-buying"
  | "marketplace";
type ServicePair = Record<Locale, ServicePageContent>;
export type ServiceContentCatalog = Record<ServiceRoute, ServicePair>;

const resources: Record<Locale, RelatedLink[]> = {
  es: [
    {
      title: "Centro de ayuda",
      description: "Respuestas iniciales y rutas seguras para continuar.",
      href: "/centro-de-ayuda/",
    },
    {
      title: "Academia financiera",
      description: "Conceptos educativos para preparar mejores preguntas.",
      href: "/academia/",
    },
  ],
  en: [
    {
      title: "Help Center",
      description: "Initial answers and safe paths to continue.",
      href: "/en/help-center/",
    },
    {
      title: "Financial Academy",
      description: "Educational concepts for preparing better questions.",
      href: "/en/academy/",
    },
  ],
};

const link = (title: string, description: string, href: string): RelatedLink => ({
  title,
  description,
  href,
});
const define = (
  serviceId: ServiceRoute,
  es: Omit<ServicePageContent, "serviceId" | "locale">,
  en: Omit<ServicePageContent, "serviceId" | "locale">,
): ServicePair => ({
  es: { serviceId, locale: "es", ...es },
  en: { serviceId, locale: "en", ...en },
});

const credit = define(
  "service-credit",
  {
    hero: {
      eyebrow: "Crédito con próximos pasos claros",
      heading: "Crédito y asistencia de reparación de crédito",
      summary:
        "Revisa tus reportes, entiende los factores que influyen en tu perfil y organiza acciones responsables cuando encuentres información potencialmente incorrecta.",
      primaryCta: "Agenda una evaluación de crédito",
      secondaryCta: "Solicita una cotización de crédito",
    },
    audience: [
      {
        title: "Te preocupa lo que aparece en tus reportes",
        body: "Quieres distinguir datos correctos, posibles errores y asuntos que requieren contexto.",
      },
      {
        title: "Te preparas para vivienda o financiamiento",
        body: "Necesitas entender tu perfil antes de conversar con un lender o proveedor.",
      },
      {
        title: "Quieres un plan educativo",
        body: "Buscas organizar hábitos, documentos y preguntas sin atajos ni identidades alternativas.",
      },
    ],
    problems: [
      {
        title: "Reportes difíciles de interpretar",
        body: "Las cuentas, fechas, balances y estados pueden verse distintos entre agencias.",
      },
      {
        title: "Información posiblemente inexacta",
        body: "Nombres, cuentas, límites, balances o estados pueden requerir verificación.",
      },
      {
        title: "Factores que compiten entre sí",
        body: "Pagos, utilización, antigüedad y mezcla de cuentas deben entenderse como conceptos relacionados, no como fórmulas universales.",
      },
    ],
    overview: [
      {
        title: "Educación antes de acción",
        body: "La asistencia combina lectura organizada de reportes, explicación de conceptos y preparación de próximos pasos basados en información confirmada.",
      },
      {
        title: "Disputas con fundamento",
        body: "Cuando corresponde legalmente, ayudamos a organizar una disputa sobre información que el cliente identifica como inexacta o incompleta y a conservar evidencia.",
      },
    ],
    whatWeDo: [
      {
        title: "Organizamos reportes",
        body: "Creamos una vista comprensible de cuentas, fechas, balances, límites y observaciones.",
      },
      {
        title: "Explicamos factores",
        body: "Revisamos historial de pagos, utilización, antigüedad y mezcla como conceptos educativos.",
      },
      {
        title: "Preparamos evidencia",
        body: "Identificamos qué documentos podrían respaldar una pregunta o disputa legítima.",
      },
      {
        title: "Damos seguimiento",
        body: "Registramos respuestas, pendientes y responsabilidad del cliente sin alterar los datos originales.",
      },
    ],
    process: [
      {
        title: "Define tu objetivo",
        body: "Aclaramos si buscas comprender reportes, revisar posibles errores o prepararte para otra meta.",
      },
      {
        title: "Reúne reportes autorizados",
        body: "El cliente obtiene y comparte información mediante el canal seguro indicado después de la evaluación.",
      },
      {
        title: "Revisión y clasificación",
        body: "Separamos datos confirmados, preguntas, posibles inexactitudes y factores educativos.",
      },
      {
        title: "Plan y asistencia",
        body: "Acordamos acciones responsables, disputas fundamentadas cuando correspondan y tareas del cliente.",
      },
      {
        title: "Seguimiento educativo",
        body: "Revisamos respuestas y cambios sin prometer un resultado o plazo universal.",
      },
    ],
    preparation: [
      {
        title: "Reportes recientes",
        body: "Permiten revisar la información que realmente está siendo reportada; no los envíes por un canal público.",
      },
      {
        title: "Identificación de objetivos",
        body: "Ayuda a priorizar si la meta es vivienda, financiamiento o claridad general.",
      },
      {
        title: "Evidencia relacionada",
        body: "Estados de cuenta, cartas o comprobantes pueden dar contexto a una posible inexactitud.",
      },
      {
        title: "Participación del cliente",
        body: "El cliente debe confirmar hechos, responder solicitudes y mantener prácticas responsables.",
      },
    ],
    expectations: [
      {
        title: "Explicaciones comprensibles",
        body: "Recibirás contexto sobre lo observado y por qué cada próximo paso puede ser relevante.",
      },
      {
        title: "Revisión humana",
        body: "Las decisiones importantes no se delegan automáticamente a software o IA.",
      },
      {
        title: "Progreso basado en hechos",
        body: "El seguimiento refleja respuestas y acciones reales, no porcentajes inventados.",
      },
    ],
    limitations: [
      {
        title: "Sin garantías de score o eliminación",
        body: "No prometemos aumentos, eliminaciones, préstamos ni un plazo universal.",
      },
      {
        title: "La información correcta permanece",
        body: "No intentamos eliminar información exacta mediante engaño ni recomendamos declaraciones falsas.",
      },
      {
        title: "Sin CPN ni identidades alternativas",
        body: "No creamos CPN, perfiles sintéticos ni sustitutos de identidad.",
      },
      {
        title: "El proveedor decide",
        body: "Lenders y otros terceros toman sus propias decisiones de aprobación y términos.",
      },
    ],
    faq: [
      {
        question: "¿Pueden garantizar que mi score subirá?",
        answer: "No. Los scores dependen de modelos, datos y cambios que SG Solutions no controla.",
      },
      {
        question: "¿Pueden eliminar cualquier cuenta negativa?",
        answer:
          "No. La información negativa que sea correcta y vigente no se elimina legítimamente solo porque perjudique el perfil.",
      },
      {
        question: "¿Qué ocurre si encuentro un error?",
        answer:
          "Se revisa el dato, la evidencia disponible y el proceso apropiado para disputar información inexacta o incompleta.",
      },
      {
        question: "¿El monitoreo repara el crédito?",
        answer:
          "No. Monitorear ayuda a observar cambios; no corrige información ni crea hábitos por sí solo.",
      },
      {
        question: "¿Necesito compartir mi SSN en esta página?",
        answer:
          "No. Nunca envíes SSN, credenciales o reportes completos mediante una página pública.",
      },
      {
        question: "¿Cuánto tarda la reparación?",
        answer:
          "No existe un plazo universal. Depende de los datos, las respuestas de terceros y las acciones del cliente.",
      },
      {
        question: "¿Esto garantiza una hipoteca o préstamo?",
        answer:
          "No. La evaluación ayuda a prepararte; cada lender decide elegibilidad, aprobación y términos.",
      },
      {
        question: "¿Cuál es mi responsabilidad?",
        answer:
          "Confirmar hechos, aportar evidencia de forma segura, responder a tiempo y evitar información falsa o nueva deuda irresponsable.",
      },
    ],
    relatedServices: [
      link(
        "Monitoreo de crédito",
        "Observa cambios autorizados después de establecer un punto de partida.",
        "/servicios/monitoreo-de-credito/",
      ),
      link(
        "Preparación para comprar casa",
        "Conecta crédito, presupuesto y documentación con una meta de vivienda.",
        "/servicios/comprar-casa/",
      ),
      link(
        "Preparación para financiamiento",
        "Organiza información antes de solicitar financiamiento.",
        "/servicios/preparacion-para-financiamiento/",
      ),
    ],
    relatedResources: resources.es,
    disclosures: [
      "La reparación de crédito no garantiza resultados.",
      "El cliente puede disputar información inexacta directamente y sin costo ante las agencias correspondientes.",
    ],
    sourceRefs: ["FTC-CREDIT-REPAIR", "CFPB-CREDIT-DISPUTES", "CFPB-CREDIT-ERRORS"],
    seo: {
      searchIntent: "Ayuda para entender y reparar crédito de forma responsable",
      title: "Reparación de crédito y orientación | SG Solutions",
      description:
        "Organiza reportes, entiende factores de crédito y recibe asistencia responsable con posibles errores, sin promesas de resultados.",
    },
  },
  {
    hero: {
      eyebrow: "Credit with clear next steps",
      heading: "Credit guidance and credit repair assistance",
      summary:
        "Review your reports, understand factors that influence your profile, and organize responsible action when you identify potentially inaccurate information.",
      primaryCta: "Schedule a credit evaluation",
      secondaryCta: "Request a credit quote",
    },
    audience: [
      {
        title: "You are concerned about your reports",
        body: "You want to separate accurate data, potential errors, and items that need context.",
      },
      {
        title: "You are preparing for housing or financing",
        body: "You need to understand your profile before speaking with a lender or provider.",
      },
      {
        title: "You want an educational plan",
        body: "You want to organize habits, documents, and questions without shortcuts or alternative identities.",
      },
    ],
    problems: [
      {
        title: "Reports are difficult to interpret",
        body: "Accounts, dates, balances, and statuses may differ across reporting companies.",
      },
      {
        title: "Potentially inaccurate information",
        body: "Names, accounts, limits, balances, or statuses may require verification.",
      },
      {
        title: "Connected credit factors",
        body: "Payments, utilization, age, and account mix should be understood as related concepts, not universal formulas.",
      },
    ],
    overview: [
      {
        title: "Education before action",
        body: "Assistance combines organized report review, concept education, and next steps based on confirmed information.",
      },
      {
        title: "Supported disputes",
        body: "When legally appropriate, we help organize a dispute about information the client identifies as inaccurate or incomplete and preserve supporting evidence.",
      },
    ],
    whatWeDo: [
      {
        title: "Organize reports",
        body: "Create a clearer view of accounts, dates, balances, limits, and observations.",
      },
      {
        title: "Explain factors",
        body: "Review payment history, utilization, age, and mix as educational concepts.",
      },
      {
        title: "Prepare evidence",
        body: "Identify documents that may support a legitimate question or dispute.",
      },
      {
        title: "Follow through",
        body: "Track responses, open items, and client responsibilities without changing original data.",
      },
    ],
    process: [
      {
        title: "Define your goal",
        body: "Clarify whether you want report understanding, potential-error review, or preparation for another goal.",
      },
      {
        title: "Gather authorized reports",
        body: "The client obtains and shares information through the secure channel provided after evaluation.",
      },
      {
        title: "Review and classify",
        body: "Separate confirmed data, questions, potential inaccuracies, and educational factors.",
      },
      {
        title: "Plan and assistance",
        body: "Agree on responsible actions, supported disputes when appropriate, and client tasks.",
      },
      {
        title: "Educational follow-up",
        body: "Review responses and changes without promising a result or universal timeline.",
      },
    ],
    preparation: [
      {
        title: "Recent reports",
        body: "They show what is currently being reported; never send them through a public channel.",
      },
      {
        title: "Your goals",
        body: "Goals help prioritize housing, financing, or general clarity.",
      },
      {
        title: "Related evidence",
        body: "Statements, letters, or receipts can provide context for a potential inaccuracy.",
      },
      {
        title: "Client participation",
        body: "The client confirms facts, responds to requests, and maintains responsible practices.",
      },
    ],
    expectations: [
      {
        title: "Understandable explanations",
        body: "You receive context about observations and why a next step may matter.",
      },
      {
        title: "Human review",
        body: "Important decisions are not delegated automatically to software or AI.",
      },
      {
        title: "Fact-based progress",
        body: "Follow-up reflects real responses and actions, not invented percentages.",
      },
    ],
    limitations: [
      {
        title: "No score or deletion guarantees",
        body: "We do not promise increases, deletions, loans, or a universal timeline.",
      },
      {
        title: "Accurate information remains",
        body: "We do not try to remove accurate information through deception or recommend false statements.",
      },
      {
        title: "No CPNs or alternative identities",
        body: "We do not create CPNs, synthetic profiles, or identity substitutes.",
      },
      {
        title: "Providers decide",
        body: "Lenders and other third parties make their own approval and term decisions.",
      },
    ],
    faq: [
      {
        question: "Can you guarantee my score will increase?",
        answer: "No. Scores depend on models, data, and changes SG Solutions does not control.",
      },
      {
        question: "Can you remove any negative account?",
        answer:
          "No. Accurate, current negative information cannot legitimately be removed simply because it hurts a profile.",
      },
      {
        question: "What happens if I find an error?",
        answer:
          "We review the data, available evidence, and the appropriate process for disputing inaccurate or incomplete information.",
      },
      {
        question: "Does monitoring repair credit?",
        answer:
          "No. Monitoring helps observe changes; it does not correct data or build habits by itself.",
      },
      {
        question: "Should I share my SSN on this page?",
        answer: "No. Never send an SSN, credentials, or complete reports through a public page.",
      },
      {
        question: "How long does credit repair take?",
        answer:
          "There is no universal timeline. It depends on the data, third-party responses, and client action.",
      },
      {
        question: "Does this guarantee a mortgage or loan?",
        answer:
          "No. An evaluation helps you prepare; each lender decides eligibility, approval, and terms.",
      },
      {
        question: "What is my responsibility?",
        answer:
          "Confirm facts, provide evidence securely, respond on time, and avoid false information or irresponsible new debt.",
      },
    ],
    relatedServices: [
      link(
        "Credit monitoring",
        "Observe authorized changes after establishing a starting point.",
        "/en/services/credit-monitoring/",
      ),
      link(
        "Home buying preparation",
        "Connect credit, budget, and documentation to a housing goal.",
        "/en/services/home-buying/",
      ),
      link(
        "Financing preparation",
        "Organize information before seeking financing.",
        "/en/services/financing-preparation/",
      ),
    ],
    relatedResources: resources.en,
    disclosures: [
      "Credit repair does not guarantee results.",
      "Clients may dispute inaccurate information directly and at no cost with the relevant reporting companies.",
    ],
    sourceRefs: ["FTC-CREDIT-REPAIR", "CFPB-CREDIT-DISPUTES", "CFPB-CREDIT-ERRORS"],
    seo: {
      searchIntent: "Responsible help understanding and repairing credit",
      title: "Credit repair assistance and guidance | SG Solutions",
      description:
        "Organize reports, understand credit factors, and receive responsible assistance with potential errors without result promises.",
    },
  },
);

const itemTitle = (body: string) => {
  const phrase = body.split(/[.;:]/u)[0] ?? body;
  return phrase.split(/\s+/u).slice(0, 8).join(" ");
};

const compactBody = (
  body: string,
  locale: Locale,
  kind: "audience" | "problem" | "action" | "process" | "preparation" | "expectation" | "limit",
  serviceName: string,
) => {
  if (body.length >= 90) return body;
  const subject = itemTitle(body);
  const context = {
    es: {
      audience: `El escenario "${subject}" se contrasta con el alcance de ${serviceName} durante la evaluación inicial.`,
      problem: `Al revisar "${subject}" dentro de ${serviceName}, separamos hechos confirmados, preguntas y próximos pasos.`,
      action: `Para "${subject}", el alcance de ${serviceName} se confirma antes de solicitar información adicional o autorizar trabajo.`,
      process: `La etapa "${subject}" queda documentada dentro de ${serviceName} y no activa acciones externas sin autorización.`,
      preparation: `La categoría "${subject}" se revisa para ${serviceName}; los datos sensibles se solicitan después y por un canal seguro.`,
      expectation: `En "${subject}", la comunicación de ${serviceName} distingue avances confirmados, pendientes y decisiones de terceros.`,
      limit: `El límite "${subject}" define lo que ${serviceName} no controla y evita promesas sobre resultados.`,
    },
    en: {
      audience: `The "${subject}" scenario is checked against the scope of ${serviceName} during the initial evaluation.`,
      problem: `When reviewing "${subject}" within ${serviceName}, we separate confirmed facts, open questions, and next steps.`,
      action: `For "${subject}", the scope of ${serviceName} is confirmed before requesting more information or authorizing work.`,
      process: `The "${subject}" stage is documented within ${serviceName} and triggers no external action without authorization.`,
      preparation: `The "${subject}" category is reviewed for ${serviceName}; sensitive data is requested later through a secure channel.`,
      expectation: `For "${subject}", ${serviceName} communication separates confirmed progress, pending items, and third-party decisions.`,
      limit: `The "${subject}" boundary defines what ${serviceName} does not control and prevents promises about outcomes.`,
    },
  } as const;
  return `${body} ${context[locale][kind]}`;
};

const compactService = (
  serviceId: ServiceRoute,
  es: {
    heading: string;
    summary: string;
    audience: string[];
    problems: string[];
    overview: string;
    actions: string[];
    process: string[];
    preparation: string[];
    expectations: string[];
    limits: string[];
    faq: Array<[string, string]>;
    related: RelatedLink[];
    seoTitle: string;
    seoDescription: string;
    sources: string[];
    primary?: string;
    secondary?: string;
    disclosure?: string;
  },
  en: {
    heading: string;
    summary: string;
    audience: string[];
    problems: string[];
    overview: string;
    actions: string[];
    process: string[];
    preparation: string[];
    expectations: string[];
    limits: string[];
    faq: Array<[string, string]>;
    related: RelatedLink[];
    seoTitle: string;
    seoDescription: string;
    sources: string[];
    primary?: string;
    secondary?: string;
    disclosure?: string;
  },
): ServicePair => {
  const build = (
    locale: Locale,
    value: typeof es,
  ): Omit<ServicePageContent, "serviceId" | "locale"> => ({
    hero: {
      eyebrow: locale === "es" ? "Preparación con contexto" : "Preparation with context",
      heading: value.heading,
      summary: value.summary,
      primaryCta:
        value.primary ?? (locale === "es" ? "Agenda una evaluación" : "Schedule an evaluation"),
      secondaryCta:
        value.secondary ?? (locale === "es" ? "Solicita una cotización" : "Request a quote"),
    },
    audience: value.audience.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "audience", value.heading),
    })),
    problems: value.problems.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "problem", value.heading),
    })),
    overview: [{ title: value.heading, body: value.overview }],
    whatWeDo: value.actions.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "action", value.heading),
    })),
    process: value.process.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "process", value.heading),
    })),
    preparation: value.preparation.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "preparation", value.heading),
    })),
    expectations: value.expectations.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "expectation", value.heading),
    })),
    limitations: value.limits.map((body) => ({
      title: itemTitle(body),
      body: compactBody(body, locale, "limit", value.heading),
    })),
    faq: value.faq.map(([question, answer]) => ({ question, answer })),
    relatedServices: value.related,
    relatedResources: resources[locale],
    disclosures: [
      value.disclosure ??
        (locale === "es"
          ? "La evaluación no garantiza resultados ni decisiones de terceros."
          : "An evaluation does not guarantee results or third-party decisions."),
    ],
    sourceRefs: value.sources,
    seo: { searchIntent: value.heading, title: value.seoTitle, description: value.seoDescription },
  });
  return define(serviceId, build("es", es), build("en", en));
};

const creditMonitoring = compactService(
  "service-credit-monitoring",
  {
    heading: "Monitoreo de crédito con consentimiento",
    summary:
      "Observa cambios autorizados, entiende alertas y decide qué revisar sin confundir monitoreo con reparación.",
    audience: [
      "Quieres observar cambios después de revisar tu crédito.",
      "Necesitas un historial organizado de alertas.",
      "Quieres saber qué hacer cuando aparece una variación.",
    ],
    problems: [
      "Una alerta puede carecer de contexto.",
      "Los cambios pueden no reflejarse de inmediato en todos los servicios.",
      "Monitorear no corrige información por sí solo.",
    ],
    overview:
      "El monitoreo reúne alertas autorizadas y ayuda a convertirlas en preguntas y acciones responsables.",
    actions: [
      "Confirmamos consentimiento y alcance.",
      "Organizamos alertas por fecha y fuente.",
      "Explicamos qué conviene verificar.",
      "Conectamos hallazgos con educación o revisión de crédito.",
    ],
    process: [
      "Definir qué se observará.",
      "Activar únicamente un acceso autorizado.",
      "Revisar alertas y cambios.",
      "Escalar dudas o posibles errores por el canal adecuado.",
    ],
    preparation: [
      "Consentimiento explícito y revocable.",
      "Objetivo del seguimiento.",
      "Acceso gestionado mediante el proveedor autorizado, nunca por contraseña compartida.",
    ],
    expectations: [
      "Alertas organizadas.",
      "Explicación de próximos pasos.",
      "Seguimiento sin promesas de detección inmediata.",
    ],
    limits: [
      "No evita fraude.",
      "No garantiza detectar cada cambio de inmediato.",
      "No repara el crédito por sí solo.",
    ],
    faq: [
      ["¿El monitoreo sube mi score?", "No."],
      [
        "¿Evita el robo de identidad?",
        "No; puede alertar sobre ciertos cambios, pero no impide fraude.",
      ],
      ["¿Qué hago con una alerta?", "Verifica la fuente, el dato y si reconoces la actividad."],
      ["¿Necesito consentimiento?", "Sí, todo acceso debe ser autorizado."],
      ["¿Debo compartir contraseñas?", "No; usa el acceso seguro del proveedor."],
      ["¿Se conecta con reparación?", "Puede aportar contexto, pero son funciones distintas."],
    ],
    related: [
      link(
        "Reparación de crédito",
        "Revisa posibles inexactitudes y organiza próximos pasos.",
        "/servicios/credito/",
      ),
    ],
    seoTitle: "Monitoreo de crédito responsable | SG Solutions",
    seoDescription:
      "Comprende alertas y cambios autorizados sin confundir monitoreo con reparación o prevención de fraude.",
    sources: ["CFPB-CREDIT-MONITORING"],
    primary: "Agenda una evaluación de monitoreo",
  },
  {
    heading: "Credit monitoring with consent",
    summary:
      "Observe authorized changes, understand alerts, and decide what to review without confusing monitoring with repair.",
    audience: [
      "You want to observe changes after reviewing credit.",
      "You need an organized alert history.",
      "You want to know what to do when something changes.",
    ],
    problems: [
      "An alert may lack context.",
      "Changes may not appear immediately across services.",
      "Monitoring does not correct information by itself.",
    ],
    overview:
      "Monitoring brings authorized alerts together and helps turn them into responsible questions and actions.",
    actions: [
      "Confirm consent and scope.",
      "Organize alerts by date and source.",
      "Explain what should be verified.",
      "Connect findings to education or credit review.",
    ],
    process: [
      "Define what will be observed.",
      "Activate only authorized access.",
      "Review alerts and changes.",
      "Escalate questions or potential errors through the appropriate channel.",
    ],
    preparation: [
      "Explicit, revocable consent.",
      "A monitoring objective.",
      "Provider-managed access, never a shared password.",
    ],
    expectations: [
      "Organized alerts.",
      "Next-step explanations.",
      "Follow-up without immediate-detection promises.",
    ],
    limits: [
      "It does not prevent fraud.",
      "It cannot guarantee immediate detection of every change.",
      "It does not repair credit by itself.",
    ],
    faq: [
      ["Does monitoring raise my score?", "No."],
      [
        "Does it stop identity theft?",
        "No; it may alert you to some changes but does not prevent fraud.",
      ],
      [
        "What should I do with an alert?",
        "Verify the source, the data, and whether you recognize the activity.",
      ],
      ["Is consent required?", "Yes, all access must be authorized."],
      ["Should I share passwords?", "No; use the provider's secure access."],
      ["Does it connect to repair?", "It can provide context, but they are different functions."],
    ],
    related: [
      link(
        "Credit repair assistance",
        "Review potential inaccuracies and organize next steps.",
        "/en/services/credit/",
      ),
    ],
    seoTitle: "Responsible credit monitoring | SG Solutions",
    seoDescription:
      "Understand authorized alerts and changes without confusing monitoring with repair or fraud prevention.",
    sources: ["CFPB-CREDIT-MONITORING"],
    primary: "Schedule a monitoring evaluation",
  },
);

const taxes = compactService(
  "service-taxes",
  {
    heading: "Preparación de taxes con revisión humana",
    summary:
      "Organiza W-2, 1099, ingresos, gastos y records antes de cualquier filing, con preguntas adaptadas a tu situación.",
    audience: [
      "Recibiste W-2 o 1099.",
      "Eres freelancer, contractor o self-employed.",
      "Administras un pequeño negocio y necesitas ordenar records.",
    ],
    problems: [
      "Faltan documentos o declaraciones previas.",
      "Ingresos y gastos están mezclados.",
      "No está claro qué gasto podría ser deducible.",
    ],
    overview:
      "El servicio organiza el intake, revisa documentos y aclara preguntas antes de preparar o presentar una declaración autorizada.",
    actions: [
      "Clasificamos fuentes de ingreso.",
      "Organizamos gastos y soportes.",
      "Identificamos información faltante.",
      "Realizamos revisión humana antes de filing.",
    ],
    process: [
      "Intake del año y situación.",
      "Lista segura de documentos.",
      "Revisión de ingresos, gastos y records.",
      "Aclaración y autorización antes de filing.",
      "Confirmación y próximos pasos.",
    ],
    preparation: [
      "W-2, 1099 y otros comprobantes de ingreso.",
      "Records de gastos con fecha, monto y propósito.",
      "Declaraciones previas cuando aporten contexto.",
      "Información de dependientes y cambios relevantes por canal seguro.",
    ],
    expectations: [
      "Preguntas sobre datos faltantes.",
      "Revisión individual antes de presentar.",
      "Explicación de supuestos y próximos pasos.",
    ],
    limits: [
      "No se garantiza reembolso.",
      "No todo gasto es deducible; depende de hechos y reglas.",
      "No inventamos gastos ni alteramos información.",
    ],
    faq: [
      ["¿Trabajan con W-2?", "Sí, dentro del alcance confirmado."],
      ["¿Y con 1099?", "Sí; se revisan ingresos y records aplicables."],
      ["¿Atienden self-employed?", "Sí, con revisión individual del negocio y documentos."],
      [
        "¿Todo gasto del negocio es deducible?",
        "No; debe evaluarse según hechos y reglas vigentes.",
      ],
      ["¿Garantizan refund?", "No."],
      ["¿Debo enviar documentos aquí?", "No; se indicará un canal seguro."],
      ["¿Presentan sin mi revisión?", "No; la información debe confirmarse antes del filing."],
      [
        "¿El contenido web es consejo fiscal individual?",
        "No; la recomendación individual requiere revisión de tu situación.",
      ],
    ],
    related: [
      link(
        "Formación de negocios",
        "Organiza la entidad y sus records desde el inicio.",
        "/servicios/formacion-de-negocios/",
      ),
      link("EIN", "Prepara información de identificación fiscal empresarial.", "/servicios/ein/"),
    ],
    seoTitle: "Preparación de taxes para W-2, 1099 y negocios | SG Solutions",
    seoDescription:
      "Organiza ingresos, gastos y records con revisión humana antes de cualquier filing, sin promesas de reembolso.",
    sources: ["IRS-PUB-334", "IRS-RECORDKEEPING"],
    primary: "Agenda una evaluación de taxes",
  },
  {
    heading: "Tax preparation with human review",
    summary:
      "Organize W-2s, 1099s, income, expenses, and records before any filing, with questions adapted to your situation.",
    audience: [
      "You received a W-2 or 1099.",
      "You are a freelancer, contractor, or self-employed.",
      "You run a small business and need organized records.",
    ],
    problems: [
      "Documents or prior returns are missing.",
      "Income and expenses are mixed together.",
      "It is unclear whether an expense may be deductible.",
    ],
    overview:
      "The service organizes intake, reviews documents, and clarifies questions before preparing or filing an authorized return.",
    actions: [
      "Classify income sources.",
      "Organize expenses and support.",
      "Identify missing information.",
      "Provide human review before filing.",
    ],
    process: [
      "Year and situation intake.",
      "Secure document list.",
      "Income, expense, and record review.",
      "Clarification and authorization before filing.",
      "Confirmation and next steps.",
    ],
    preparation: [
      "W-2s, 1099s, and other income records.",
      "Expense records with date, amount, and purpose.",
      "Prior returns when relevant.",
      "Dependent information and material changes through a secure channel.",
    ],
    expectations: [
      "Questions about missing data.",
      "Individual review before filing.",
      "Explanation of assumptions and next steps.",
    ],
    limits: [
      "No refund guarantee.",
      "Not every expense is deductible; facts and rules control.",
      "We do not invent expenses or alter information.",
    ],
    faq: [
      ["Do you work with W-2s?", "Yes, within confirmed scope."],
      ["What about 1099s?", "Yes; applicable income and records are reviewed."],
      [
        "Do you serve self-employed clients?",
        "Yes, with individual review of the business and documents.",
      ],
      ["Is every business expense deductible?", "No; facts and current rules must be evaluated."],
      ["Do you guarantee a refund?", "No."],
      ["Should I send documents here?", "No; a secure channel will be provided."],
      ["Will you file without my review?", "No; information must be confirmed before filing."],
      [
        "Is website content individual tax advice?",
        "No; individual recommendations require review of your situation.",
      ],
    ],
    related: [
      link(
        "Business formation",
        "Organize the entity and records from the beginning.",
        "/en/services/business-formation/",
      ),
      link("EIN", "Prepare business tax identification information.", "/en/services/ein/"),
    ],
    seoTitle: "Tax preparation for W-2, 1099, and business clients | SG Solutions",
    seoDescription:
      "Organize income, expenses, and records with human review before filing and without refund promises.",
    sources: ["IRS-PUB-334", "IRS-RECORDKEEPING"],
    primary: "Schedule a tax evaluation",
  },
);

const formation = compactService(
  "service-business-formation",
  {
    heading: "Formación de negocios y preparación de LLC",
    summary:
      "Organiza nombre, miembros, dirección, actividad, jurisdicción y próximos pasos antes de autorizar una presentación.",
    audience: [
      "Estás iniciando un negocio.",
      "Necesitas separar una actividad personal de una entidad.",
      "Quieres entender la secuencia antes de formar una LLC.",
    ],
    problems: [
      "No está definido el nombre o propósito.",
      "Falta claridad sobre miembros y administración.",
      "Se confunden formación, impuestos, EIN y cumplimiento.",
    ],
    overview:
      "La formación prepara información y documentos para la jurisdicción aplicable; una LLC no sustituye asesoría legal, fiscal ni disciplina operativa.",
    actions: [
      "Organizamos información de nombre y actividad.",
      "Confirmamos miembros, dirección y administración.",
      "Explicamos registered agent y documentos de formación.",
      "Preparamos recordkeeping y próximos pasos posteriores.",
    ],
    process: [
      "Definir objetivo y jurisdicción.",
      "Reunir información empresarial.",
      "Revisar nombre, miembros y documentos.",
      "Autorizar la presentación aplicable.",
      "Organizar EIN, banca y cumplimiento posterior.",
    ],
    preparation: [
      "Opciones de nombre y actividad.",
      "Miembros, managers y direcciones.",
      "Registered agent elegible en la jurisdicción.",
      "Plan para separar finanzas y conservar records.",
    ],
    expectations: [
      "Explicación del alcance.",
      "Revisión antes de presentar.",
      "Lista de pasos posteriores a la formación.",
    ],
    limits: [
      "Una LLC no reduce impuestos automáticamente.",
      "No protege absolutamente todos los activos.",
      "No garantiza funding ni business credit.",
    ],
    faq: [
      [
        "¿Qué es una LLC?",
        "Es una estructura empresarial creada bajo ley estatal; su efecto depende de hechos y jurisdicción.",
      ],
      [
        "¿Necesito registered agent?",
        "Depende de la jurisdicción; por ejemplo, Illinois exige mantener uno elegible.",
      ],
      [
        "¿SG Solutions decide mi estructura fiscal?",
        "No sin revisión individual y alcance autorizado.",
      ],
      ["¿La LLC garantiza protección total?", "No."],
      ["¿Incluye EIN?", "Es un paso relacionado, pero el alcance debe confirmarse."],
      [
        "¿Puedo mezclar dinero personal y empresarial?",
        "Separar finanzas y records ayuda a mantener claridad operativa.",
      ],
      ["¿Presentan automáticamente?", "No; la información y autorización se revisan primero."],
      [
        "¿Las reglas son iguales en todos los estados?",
        "No; deben verificarse en la jurisdicción aplicable.",
      ],
    ],
    related: [
      link(
        "EIN",
        "Prepara el identificador fiscal después de la formación cuando corresponda.",
        "/servicios/ein/",
      ),
      link(
        "Cumplimiento empresarial",
        "Organiza reportes, cambios y renovaciones.",
        "/servicios/cumplimiento-empresarial/",
      ),
    ],
    seoTitle: "Formación de LLC y negocios | SG Solutions",
    seoDescription:
      "Organiza nombre, miembros, registered agent, documentos y próximos pasos sin promesas fiscales o de financiamiento.",
    sources: ["ILSOS-LLC"],
    primary: "Agenda una evaluación para formar tu negocio",
    secondary: "Solicita una cotización de formación",
  },
  {
    heading: "Business formation and LLC preparation",
    summary:
      "Organize name, members, address, activity, jurisdiction, and next steps before authorizing a filing.",
    audience: [
      "You are starting a business.",
      "You need to separate personal activity from an entity.",
      "You want to understand the sequence before forming an LLC.",
    ],
    problems: [
      "The name or purpose is not defined.",
      "Members and management are unclear.",
      "Formation, taxes, EIN, and compliance are being confused.",
    ],
    overview:
      "Formation prepares information and documents for the applicable jurisdiction; an LLC does not replace legal or tax advice or operating discipline.",
    actions: [
      "Organize name and activity information.",
      "Confirm members, address, and management.",
      "Explain registered agents and formation documents.",
      "Prepare recordkeeping and post-formation next steps.",
    ],
    process: [
      "Define the goal and jurisdiction.",
      "Gather business information.",
      "Review name, members, and documents.",
      "Authorize the applicable filing.",
      "Organize EIN, banking, and ongoing compliance.",
    ],
    preparation: [
      "Name options and business activity.",
      "Members, managers, and addresses.",
      "An eligible registered agent in the jurisdiction.",
      "A plan to separate finances and keep records.",
    ],
    expectations: [
      "Scope explanation.",
      "Review before filing.",
      "A post-formation next-step list.",
    ],
    limits: [
      "An LLC does not automatically reduce taxes.",
      "It does not absolutely protect every asset.",
      "It does not guarantee funding or business credit.",
    ],
    faq: [
      [
        "What is an LLC?",
        "It is a business structure created under state law; its effect depends on facts and jurisdiction.",
      ],
      [
        "Do I need a registered agent?",
        "It depends on the jurisdiction; Illinois, for example, requires an eligible one.",
      ],
      [
        "Does SG Solutions decide my tax classification?",
        "Not without individual review and authorized scope.",
      ],
      ["Does an LLC guarantee complete protection?", "No."],
      ["Is EIN included?", "It is a related step, but scope must be confirmed."],
      [
        "Can I mix personal and business money?",
        "Separating finances and records supports operational clarity.",
      ],
      ["Do you file automatically?", "No; information and authorization are reviewed first."],
      ["Are rules the same in every state?", "No; the applicable jurisdiction must be verified."],
    ],
    related: [
      link(
        "EIN",
        "Prepare the tax identifier after formation when appropriate.",
        "/en/services/ein/",
      ),
      link(
        "Business compliance",
        "Organize reports, changes, and renewals.",
        "/en/services/business-compliance/",
      ),
    ],
    seoTitle: "LLC and business formation | SG Solutions",
    seoDescription:
      "Organize name, members, registered agent, documents, and next steps without tax or financing promises.",
    sources: ["ILSOS-LLC"],
    primary: "Schedule a business formation evaluation",
    secondary: "Request a formation quote",
  },
);

const ein = compactService(
  "service-ein",
  {
    heading: "Preparación para solicitar un EIN",
    summary:
      "Entiende qué es un EIN y organiza entidad, responsible party y evidencia antes de una solicitud autorizada al IRS.",
    audience: [
      "Formaste o estás formando una entidad.",
      "Necesitas identificación fiscal para una obligación o proceso empresarial.",
      "Quieres corregir o localizar evidencia de un EIN.",
    ],
    problems: [
      "La entidad todavía no está formada.",
      "No está identificada la responsible party.",
      "El nombre o dirección no coincide con documentos.",
    ],
    overview:
      "Un EIN es un número federal de identificación tributaria emitido por el IRS; SG Solutions ayuda a preparar información, no lo emite.",
    actions: [
      "Confirmamos si el EIN puede ser necesario.",
      "Organizamos datos de entidad y responsible party.",
      "Revisamos consistencia antes de solicitar.",
      "Ayudamos a conservar la confirmación o carta.",
    ],
    process: [
      "Confirmar entidad y necesidad.",
      "Reunir datos exactos.",
      "Revisar y autorizar.",
      "Solicitar al IRS por el canal aplicable.",
      "Guardar evidencia y próximos pasos.",
    ],
    preparation: [
      "Documentos que respaldan la formación y estructura inicial.",
      "Nombre legal, dirección y actividad.",
      "Responsible party real y autorizada.",
    ],
    expectations: [
      "Revisión antes de solicitud.",
      "Explicación del estado real.",
      "Organización de evidencia cuando se reciba.",
    ],
    limits: [
      "Solo el IRS emite el EIN.",
      "La emisión no está garantizada.",
      "Nunca se inventa responsible party o información.",
    ],
    faq: [
      ["¿Qué es un EIN?", "Un identificador tributario federal para negocios y otras entidades."],
      ["¿SG Solutions lo emite?", "No; lo emite el IRS."],
      [
        "¿Debo formar la entidad primero?",
        "El IRS indica formar primero una entidad legal cuando corresponda.",
      ],
      [
        "¿Quién es responsible party?",
        "La persona que posee o controla efectivamente la entidad según las reglas del IRS.",
      ],
      ["¿Está garantizado?", "No."],
      ["¿Debo publicar mi SSN aquí?", "No; los identificadores se manejan por canal seguro."],
    ],
    related: [
      link(
        "Formación de negocios",
        "Confirma la entidad antes del EIN.",
        "/servicios/formacion-de-negocios/",
      ),
      link("Taxes", "Conecta el identificador con obligaciones tributarias.", "/servicios/taxes/"),
    ],
    seoTitle: "Preparación de EIN para negocios | SG Solutions",
    seoDescription:
      "Organiza entidad y responsible party antes de una solicitud autorizada; el IRS es quien emite el EIN.",
    sources: ["IRS-EIN", "IRS-RESPONSIBLE-PARTY"],
    primary: "Agenda una evaluación de EIN",
  },
  {
    heading: "EIN application preparation",
    summary:
      "Understand what an EIN is and organize the entity, responsible party, and evidence before an authorized IRS application.",
    audience: [
      "You formed or are forming an entity.",
      "You need a tax identifier for a business obligation or process.",
      "You want to correct or locate EIN evidence.",
    ],
    problems: [
      "The entity is not yet formed.",
      "The responsible party is unclear.",
      "The name or address does not match documents.",
    ],
    overview:
      "An EIN is a federal tax identification number issued by the IRS; SG Solutions helps prepare information and does not issue it.",
    actions: [
      "Confirm whether an EIN may be needed.",
      "Organize entity and responsible-party data.",
      "Review consistency before application.",
      "Help preserve the confirmation or letter.",
    ],
    process: [
      "Confirm entity and need.",
      "Gather accurate data.",
      "Review and authorize.",
      "Apply through the applicable IRS channel.",
      "Store evidence and next steps.",
    ],
    preparation: [
      "Documents supporting the initial formation and structure.",
      "Legal name, address, and activity.",
      "The real, authorized responsible party.",
    ],
    expectations: [
      "Review before application.",
      "Explanation of actual status.",
      "Organized evidence when received.",
    ],
    limits: [
      "Only the IRS issues an EIN.",
      "Issuance is not guaranteed.",
      "Responsible-party or other information is never fabricated.",
    ],
    faq: [
      ["What is an EIN?", "A federal tax identifier for businesses and other entities."],
      ["Does SG Solutions issue it?", "No; the IRS does."],
      [
        "Should I form the entity first?",
        "The IRS directs legal entities to form first when applicable.",
      ],
      [
        "Who is the responsible party?",
        "The individual who ultimately owns or effectively controls the entity under IRS rules.",
      ],
      ["Is issuance guaranteed?", "No."],
      ["Should I post my SSN here?", "No; identifiers belong in a secure channel."],
    ],
    related: [
      link(
        "Business formation",
        "Confirm the entity before EIN.",
        "/en/services/business-formation/",
      ),
      link("Taxes", "Connect the identifier to tax obligations.", "/en/services/taxes/"),
    ],
    seoTitle: "Business EIN preparation | SG Solutions",
    seoDescription:
      "Organize the entity and responsible party before an authorized application; the IRS issues the EIN.",
    sources: ["IRS-EIN", "IRS-RESPONSIBLE-PARTY"],
    primary: "Schedule an EIN evaluation",
  },
);

const compliance = compactService(
  "service-business-compliance",
  {
    heading: "Organización de cumplimiento empresarial",
    summary:
      "Mantén documentos, cambios, reportes y fechas confirmadas visibles sin depender de obligaciones genéricas o desactualizadas.",
    audience: [
      "Tu empresa ya está formada.",
      "Cambió la dirección, administración o información empresarial.",
      "Necesitas ordenar recordatorios y evidencia.",
    ],
    problems: [
      "Fechas dispersas.",
      "Documentos y cambios sin registrar.",
      "Requisitos confundidos entre jurisdicciones.",
    ],
    overview:
      "El servicio crea un calendario documental basado en la entidad y jurisdicción verificadas; las reglas cambiantes se consultan en fuentes oficiales.",
    actions: [
      "Inventariamos documentos.",
      "Registramos cambios confirmados.",
      "Organizamos reportes y renovaciones.",
      "Preparamos preguntas para la autoridad o profesional adecuado.",
    ],
    process: [
      "Identificar entidad y jurisdicción.",
      "Reunir documentos vigentes.",
      "Verificar obligaciones actuales.",
      "Crear calendario y responsables.",
      "Actualizar evidencia después de cada acción.",
    ],
    preparation: [
      "Documentos vigentes de formación y registro.",
      "Cambios empresariales recientes.",
      "Avisos oficiales y fechas conocidas.",
    ],
    expectations: [
      "Vista organizada.",
      "Recordatorios basados en datos confirmados.",
      "Revisión periódica de requisitos.",
    ],
    limits: [
      "No publicamos fechas universales.",
      "Obligaciones y tarifas pueden cambiar.",
      "Un recordatorio no sustituye confirmar con la autoridad.",
    ],
    faq: [
      ["¿Qué se organiza?", "Documentos, cambios, reportes, renovaciones y evidencia aplicables."],
      ["¿Las fechas son iguales para todos?", "No."],
      [
        "¿Incluye BOI?",
        "Cualquier obligación cambiante debe verificarse antes de incluirse en alcance.",
      ],
      ["¿Presentan automáticamente?", "No."],
      ["¿Por qué importa la jurisdicción?", "Porque requisitos y procesos varían."],
      [
        "¿Qué pasa si cambia mi empresa?",
        "Se documenta el cambio y se verifica el trámite aplicable.",
      ],
    ],
    related: [
      link(
        "Formación de negocios",
        "Revisa la información original de la entidad.",
        "/servicios/formacion-de-negocios/",
      ),
      link("EIN", "Mantén coherencia con registros federales.", "/servicios/ein/"),
    ],
    seoTitle: "Cumplimiento empresarial organizado | SG Solutions",
    seoDescription:
      "Organiza reportes, cambios, documentos y fechas verificadas según entidad y jurisdicción.",
    sources: ["ILSOS-LLC"],
    primary: "Agenda una evaluación de cumplimiento",
  },
  {
    heading: "Business compliance organization",
    summary:
      "Keep documents, changes, reports, and confirmed dates visible without relying on generic or outdated obligations.",
    audience: [
      "Your business is already formed.",
      "The address, management, or business information changed.",
      "You need organized reminders and evidence.",
    ],
    problems: [
      "Dates are scattered.",
      "Documents and changes are unrecorded.",
      "Requirements are confused across jurisdictions.",
    ],
    overview:
      "The service creates a document calendar based on a verified entity and jurisdiction; changing rules are checked against official sources.",
    actions: [
      "Inventory documents.",
      "Record confirmed changes.",
      "Organize reports and renewals.",
      "Prepare questions for the appropriate authority or professional.",
    ],
    process: [
      "Identify entity and jurisdiction.",
      "Gather current documents.",
      "Verify current obligations.",
      "Create a calendar and owners.",
      "Update evidence after each action.",
    ],
    preparation: [
      "Current formation and registration documents.",
      "Recent business changes.",
      "Official notices and known dates.",
    ],
    expectations: [
      "An organized view.",
      "Reminders based on confirmed data.",
      "Periodic requirement review.",
    ],
    limits: [
      "We do not publish universal dates.",
      "Obligations and fees can change.",
      "A reminder does not replace authority verification.",
    ],
    faq: [
      ["What is organized?", "Applicable documents, changes, reports, renewals, and evidence."],
      ["Are dates the same for everyone?", "No."],
      [
        "Does this include BOI?",
        "Any changing obligation must be verified before it enters scope.",
      ],
      ["Do you file automatically?", "No."],
      ["Why does jurisdiction matter?", "Requirements and processes vary."],
      [
        "What if my business changes?",
        "The change is documented and the applicable process is verified.",
      ],
    ],
    related: [
      link(
        "Business formation",
        "Review the entity's original information.",
        "/en/services/business-formation/",
      ),
      link("EIN", "Maintain consistency with federal records.", "/en/services/ein/"),
    ],
    seoTitle: "Organized business compliance | SG Solutions",
    seoDescription:
      "Organize reports, changes, documents, and verified dates based on entity and jurisdiction.",
    sources: ["ILSOS-LLC"],
    primary: "Schedule a compliance evaluation",
  },
);

const businessCredit = compactService(
  "service-business-credit",
  {
    heading: "Preparación de business credit",
    summary:
      "Organiza identidad, banca, records y hábitos de pago del negocio antes de buscar productos de crédito empresarial.",
    audience: [
      "Tu negocio necesita separar finanzas personales y empresariales.",
      "Quieres revisar consistencia de la identidad del negocio.",
      "Planeas solicitar productos en el futuro.",
    ],
    problems: [
      "Cuentas y gastos están mezclados.",
      "Nombre, dirección o records son inconsistentes.",
      "Se confunde tener EIN con estar aprobado.",
    ],
    overview:
      "Business credit es distinto del crédito personal, aunque algunos proveedores también evalúan al owner; la preparación se enfoca en consistencia y capacidad documentada.",
    actions: [
      "Revisamos identidad y documentos.",
      "Organizamos banca y recordkeeping.",
      "Explicamos perfiles y reportes empresariales.",
      "Preparamos preguntas antes de solicitar.",
    ],
    process: [
      "Definir el objetivo.",
      "Revisar separación financiera.",
      "Verificar consistencia documental.",
      "Organizar pagos y records.",
      "Prepararse antes de aplicar.",
    ],
    preparation: [
      "Documentos de formación y EIN.",
      "Cuenta bancaria y records empresariales.",
      "Ingresos, gastos y obligaciones del negocio.",
    ],
    expectations: [
      "Mapa de preparación.",
      "Lista de inconsistencias por revisar.",
      "Preguntas para proveedores.",
    ],
    limits: [
      "No garantiza líneas ni límites.",
      "No promete aprobación solo con EIN.",
      "No promete resultados mediante tradelines.",
    ],
    faq: [
      [
        "¿Es igual al crédito personal?",
        "No; son perfiles distintos, aunque algunos proveedores revisan ambos.",
      ],
      ["¿Un EIN garantiza aprobación?", "No."],
      [
        "¿Necesito cuenta bancaria empresarial?",
        "Ayuda a separar operaciones y records; los requisitos dependen del proveedor.",
      ],
      ["¿Crean tradelines?", "No prometemos resultados mediante tradelines."],
      ["¿Garantizan límites?", "No."],
      [
        "¿Cómo se relaciona con funding?",
        "La organización puede preparar mejores preguntas, pero el proveedor decide.",
      ],
    ],
    related: [
      link(
        "Business funding",
        "Prepara el negocio para conversaciones de capital.",
        "/servicios/financiamiento-empresarial/",
      ),
      link(
        "Formación de negocios",
        "Confirma la base documental de la entidad.",
        "/servicios/formacion-de-negocios/",
      ),
    ],
    seoTitle: "Preparación de business credit | SG Solutions",
    seoDescription:
      "Organiza identidad, banca, records y pagos del negocio sin promesas de líneas, límites o aprobación.",
    sources: ["SBA-FUNDING-PREP"],
    primary: "Agenda una evaluación de business credit",
  },
  {
    heading: "Business credit preparation",
    summary:
      "Organize business identity, banking, records, and payment practices before seeking business credit products.",
    audience: [
      "Your business needs financial separation.",
      "You want to review business-identity consistency.",
      "You plan to seek products in the future.",
    ],
    problems: [
      "Accounts and expenses are mixed.",
      "Name, address, or records are inconsistent.",
      "Having an EIN is confused with being approved.",
    ],
    overview:
      "Business credit differs from personal credit, although some providers also evaluate owners; preparation focuses on consistency and documented capacity.",
    actions: [
      "Review identity and documents.",
      "Organize banking and records.",
      "Explain business profiles and reports.",
      "Prepare questions before applying.",
    ],
    process: [
      "Define the goal.",
      "Review financial separation.",
      "Verify document consistency.",
      "Organize payments and records.",
      "Prepare before applying.",
    ],
    preparation: [
      "Formation and EIN documents.",
      "Business bank account and records.",
      "Business income, expenses, and obligations.",
    ],
    expectations: [
      "A readiness map.",
      "A list of inconsistencies to review.",
      "Questions for providers.",
    ],
    limits: [
      "No line or limit guarantees.",
      "No approval promise based only on an EIN.",
      "No tradeline result promises.",
    ],
    faq: [
      [
        "Is it the same as personal credit?",
        "No; they are different profiles, although some providers review both.",
      ],
      ["Does an EIN guarantee approval?", "No."],
      [
        "Do I need a business bank account?",
        "It supports separation and records; provider requirements vary.",
      ],
      ["Do you create tradelines?", "We do not promise outcomes through tradelines."],
      ["Do you guarantee limits?", "No."],
      [
        "How does this relate to funding?",
        "Organization can prepare better questions, but the provider decides.",
      ],
    ],
    related: [
      link(
        "Business funding",
        "Prepare the business for capital conversations.",
        "/en/services/business-funding/",
      ),
      link(
        "Business formation",
        "Confirm the entity's document foundation.",
        "/en/services/business-formation/",
      ),
    ],
    seoTitle: "Business credit preparation | SG Solutions",
    seoDescription:
      "Organize identity, banking, records, and payments without promises of lines, limits, or approval.",
    sources: ["SBA-FUNDING-PREP"],
    primary: "Schedule a business credit evaluation",
  },
);

const funding = compactService(
  "service-business-funding",
  {
    heading: "Preparación para business funding",
    summary:
      "Aclara cuánto capital buscas, para qué lo usarás y qué muestran ingresos, cash flow, antigüedad, deudas y documentos.",
    audience: [
      "Un negocio activo busca capital.",
      "Quieres comparar categorías sin asumir aprobación.",
      "Necesitas preparar una conversación con lenders o proveedores.",
    ],
    problems: [
      "El uso de fondos no está definido.",
      "Faltan estados o records.",
      "La capacidad de pago no está clara.",
    ],
    overview:
      "La preparación convierte el objetivo de funding en un caso documentado; SG Solutions orienta y el proveedor decide disponibilidad y términos.",
    actions: [
      "Definimos objetivo y uso de fondos.",
      "Organizamos ingresos, cash flow y deudas.",
      "Revisamos antigüedad y documentos.",
      "Preparamos preguntas de costo, pago y riesgo.",
    ],
    process: [
      "Definir monto y uso.",
      "Reunir historia financiera.",
      "Revisar capacidad y obligaciones.",
      "Comparar categorías generales.",
      "Prepararse para hablar con proveedores.",
    ],
    preparation: [
      "Ingresos y estados financieros.",
      "Cash flow, gastos y deudas.",
      "Documentos de entidad y banca.",
      "Plan de uso y pago de fondos.",
    ],
    expectations: [
      "Resumen de preparación financiera del negocio.",
      "Brechas documentales visibles.",
      "Preguntas para comparar responsablemente.",
    ],
    limits: [
      "No garantizamos aprobación.",
      "No garantizamos tasa o monto.",
      "No presentamos una oferta como disponible sin confirmación del proveedor.",
    ],
    faq: [
      ["¿SG Solutions presta dinero?", "No."],
      ["¿Garantizan aprobación?", "No."],
      ["¿Qué revisan?", "Objetivo, uso, ingresos, cash flow, antigüedad, deudas y documentos."],
      [
        "¿Qué categorías existen?",
        "Pueden existir préstamos, líneas u otras opciones; la disponibilidad debe confirmarse.",
      ],
      [
        "¿Comparan tasas?",
        "Ayudamos a preparar preguntas; las ofertas reales vienen del proveedor.",
      ],
      ["¿Necesito business credit?", "Depende del producto y proveedor."],
      ["¿Puedo aplicar desde esta página?", "No."],
      [
        "¿Qué debo preguntar?",
        "Costo total, pagos, garantías, penalidades, uso permitido y consecuencias de incumplimiento.",
      ],
    ],
    related: [
      link(
        "Business credit",
        "Organiza el perfil empresarial antes de solicitar.",
        "/servicios/credito-empresarial/",
      ),
      link(
        "Preparación para financiamiento",
        "Organiza capacidad y documentos para una meta personal o empresarial.",
        "/servicios/preparacion-para-financiamiento/",
      ),
    ],
    seoTitle: "Preparación para business funding | SG Solutions",
    seoDescription:
      "Organiza uso de fondos, cash flow, ingresos, deudas y documentos antes de hablar con proveedores.",
    sources: ["SBA-FUNDING-PREP"],
    primary: "Agenda una evaluación de funding",
  },
  {
    heading: "Business funding preparation",
    summary:
      "Clarify how much capital you seek, how it will be used, and what revenue, cash flow, time in business, debt, and documents show.",
    audience: [
      "An active business seeks capital.",
      "You want to compare categories without assuming approval.",
      "You need to prepare for a lender or provider conversation.",
    ],
    problems: [
      "Use of funds is undefined.",
      "Statements or records are missing.",
      "Repayment capacity is unclear.",
    ],
    overview:
      "Preparation turns a funding goal into a documented case; SG Solutions provides guidance and the provider decides availability and terms.",
    actions: [
      "Define the goal and use of funds.",
      "Organize revenue, cash flow, and debt.",
      "Review time in business and documents.",
      "Prepare cost, payment, and risk questions.",
    ],
    process: [
      "Define amount and use.",
      "Gather financial history.",
      "Review capacity and obligations.",
      "Compare general categories.",
      "Prepare for provider conversations.",
    ],
    preparation: [
      "Revenue and financial statements.",
      "Cash flow, expenses, and debts.",
      "Entity and banking documents.",
      "A funds-use and repayment plan.",
    ],
    expectations: [
      "A business financial-readiness summary.",
      "Visible document gaps.",
      "Questions for responsible comparison.",
    ],
    limits: [
      "No approval guarantee.",
      "No rate or amount guarantee.",
      "No offer is presented as available without provider confirmation.",
    ],
    faq: [
      ["Does SG Solutions lend money?", "No."],
      ["Do you guarantee approval?", "No."],
      [
        "What do you review?",
        "Goal, use, revenue, cash flow, time in business, debt, and documents.",
      ],
      [
        "What categories exist?",
        "Loans, lines, and other options may exist; availability must be confirmed.",
      ],
      ["Do you compare rates?", "We help prepare questions; actual offers come from providers."],
      ["Do I need business credit?", "It depends on the product and provider."],
      ["Can I apply from this page?", "No."],
      [
        "What should I ask?",
        "Total cost, payments, guarantees, penalties, permitted use, and default consequences.",
      ],
    ],
    related: [
      link(
        "Business credit",
        "Organize the business profile before applying.",
        "/en/services/business-credit/",
      ),
      link(
        "Financing preparation",
        "Organize capacity and documents for a personal or business goal.",
        "/en/services/financing-preparation/",
      ),
    ],
    seoTitle: "Business funding preparation | SG Solutions",
    seoDescription:
      "Organize use of funds, cash flow, revenue, debt, and documents before speaking with providers.",
    sources: ["SBA-FUNDING-PREP"],
    primary: "Schedule a funding evaluation",
  },
);

const loanPreparation = compactService(
  "service-loan-preparation",
  {
    heading: "Preparación para solicitar financiamiento",
    summary:
      "Organiza objetivo, capacidad de pago, ingresos, obligaciones, crédito y documentos antes de comparar opciones.",
    audience: [
      "Una persona se prepara para un préstamo.",
      "Un negocio necesita ordenar información antes de solicitar.",
      "Quieres comparar responsablemente sin asumir una aprobación.",
    ],
    problems: [
      "No está claro cuánto puedes pagar.",
      "Faltan documentos de ingresos.",
      "Las obligaciones y preguntas no están organizadas.",
    ],
    overview:
      "El servicio prepara información y preguntas; SG Solutions no actúa como lender y una estimación interna no es una decisión real.",
    actions: [
      "Definimos objetivo y uso.",
      "Organizamos ingresos y obligaciones.",
      "Revisamos documentos y crédito como contexto.",
      "Preparamos una comparación responsable.",
    ],
    process: [
      "Definir necesidad.",
      "Revisar capacidad de pago.",
      "Reunir documentos.",
      "Preparar preguntas y comparar.",
      "Hablar con proveedores autorizados.",
    ],
    preparation: [
      "Ingresos y estabilidad.",
      "Obligaciones y pagos mensuales.",
      "Documentos de identidad o negocio por canal seguro.",
      "Objetivo y monto aproximado.",
    ],
    expectations: [
      "Resumen de capacidad de pago y documentación.",
      "Lista de documentos faltantes.",
      "Preguntas sobre costo y términos.",
    ],
    limits: [
      "No somos lender.",
      "No estimamos aprobación como decisión real.",
      "No garantizamos tasa, monto o términos.",
    ],
    faq: [
      ["¿Es una solicitud de préstamo?", "No."],
      ["¿SG Solutions es lender?", "No."],
      [
        "¿Qué significa capacidad de pago?",
        "Es la relación práctica entre ingresos, obligaciones y el pago propuesto.",
      ],
      ["¿Garantizan aprobación?", "No."],
      ["¿Qué documentos se preparan?", "Depende del objetivo, proveedor y tipo de solicitante."],
      [
        "¿Puedo comparar opciones?",
        "Sí, mediante preguntas sobre costo total, pagos, riesgo y términos confirmados.",
      ],
    ],
    related: [
      link("Crédito", "Comprende el perfil antes de buscar financiamiento.", "/servicios/credito/"),
      link(
        "Business funding",
        "Prepara un caso de capital empresarial.",
        "/servicios/financiamiento-empresarial/",
      ),
    ],
    seoTitle: "Preparación para préstamos y financiamiento | SG Solutions",
    seoDescription:
      "Organiza capacidad de pago, ingresos, obligaciones, crédito y documentos antes de solicitar financiamiento.",
    sources: ["SBA-FUNDING-PREP", "CFPB-HOME-PREAPPROVAL"],
    primary: "Agenda una evaluación de financiamiento",
  },
  {
    heading: "Loan and financing preparation",
    summary:
      "Organize your goal, repayment capacity, income, obligations, credit, and documents before comparing options.",
    audience: [
      "An individual is preparing for a loan.",
      "A business needs organized information before applying.",
      "You want responsible comparison without assuming approval.",
    ],
    problems: [
      "Affordable payment is unclear.",
      "Income documents are missing.",
      "Obligations and questions are unorganized.",
    ],
    overview:
      "The service prepares information and questions; SG Solutions is not a lender and an internal estimate is not a real decision.",
    actions: [
      "Define goal and use.",
      "Organize income and obligations.",
      "Review documents and credit as context.",
      "Prepare a responsible comparison.",
    ],
    process: [
      "Define the need.",
      "Review repayment capacity.",
      "Gather documents.",
      "Prepare questions and compare.",
      "Speak with authorized providers.",
    ],
    preparation: [
      "Income and stability.",
      "Obligations and monthly payments.",
      "Identity or business documents through a secure channel.",
      "Goal and approximate amount.",
    ],
    expectations: [
      "A repayment-capacity and documentation summary.",
      "A missing-document list.",
      "Questions about cost and terms.",
    ],
    limits: [
      "We are not a lender.",
      "We do not present approval estimates as real decisions.",
      "We do not guarantee rates, amounts, or terms.",
    ],
    faq: [
      ["Is this a loan application?", "No."],
      ["Is SG Solutions a lender?", "No."],
      [
        "What is repayment capacity?",
        "The practical relationship among income, obligations, and a proposed payment.",
      ],
      ["Do you guarantee approval?", "No."],
      ["Which documents are prepared?", "It depends on the goal, provider, and applicant type."],
      [
        "Can I compare options?",
        "Yes, using questions about total cost, payments, risk, and confirmed terms.",
      ],
    ],
    related: [
      link(
        "Credit guidance",
        "Understand the profile before seeking financing.",
        "/en/services/credit/",
      ),
      link(
        "Business funding",
        "Prepare a business capital case.",
        "/en/services/business-funding/",
      ),
    ],
    seoTitle: "Loan and financing preparation | SG Solutions",
    seoDescription:
      "Organize repayment capacity, income, obligations, credit, and documents before seeking financing.",
    sources: ["SBA-FUNDING-PREP", "CFPB-HOME-PREAPPROVAL"],
    primary: "Schedule a financing evaluation",
  },
);

const homeBuying = compactService(
  "service-home-buying",
  {
    heading: "Preparación para comprar tu primera casa",
    summary:
      "Conecta crédito, ingresos, empleo, deudas, presupuesto y documentos para conversar con lenders y profesionales con mejores preguntas.",
    audience: [
      "Eres comprador de primera vivienda.",
      "No sabes si tu crédito y presupuesto están listos.",
      "Quieres entender programas y costos sin asumir elegibilidad.",
    ],
    problems: [
      "Se confunde preapproval con aprobación final.",
      "No se han considerado closing costs, reservas o mortgage insurance.",
      "Cambios de crédito o movimientos de dinero pueden crear preguntas antes del cierre.",
    ],
    overview:
      "SG Solutions educa y prepara; el lender evalúa crédito, ingresos, deudas, propiedad y programa, mientras agentes y title/closing cumplen funciones distintas.",
    actions: [
      "Organizamos crédito, ingresos, empleo y deudas.",
      "Explicamos DTI, presupuesto, down payment y reservas como conceptos.",
      "Preparamos documentos y preguntas para el lender.",
      "Explicamos inspección, preapproval, escrow, title y closing.",
    ],
    process: [
      "Definir meta, fecha y presupuesto.",
      "Revisar crédito, ingresos, empleo y obligaciones.",
      "Organizar fondos, documentos y preguntas.",
      "Comparar FHA, USDA, VA, Conventional o asistencia solo cuando sean relevantes.",
      "Prepararse para preapproval, búsqueda, contrato, inspección y cierre.",
    ],
    preparation: [
      "Comprobantes de ingresos y empleo.",
      "Deudas, pagos mensuales y presupuesto.",
      "Fondos disponibles, reservas y movimientos grandes documentados.",
      "Documentos que el lender solicite por canal seguro.",
    ],
    expectations: [
      "Mapa de preparación, no una aprobación.",
      "Preguntas para lender, real estate agent y closing/title.",
      "Advertencias sobre nuevas deudas o cambios antes del cierre.",
    ],
    limits: [
      "SG Solutions no es lender.",
      "No es agente inmobiliario sin autorización o licencia explícita.",
      "No garantiza aprobación, programa, tasa, down payment ni seller concessions.",
    ],
    faq: [
      [
        "¿Qué es preapproval?",
        "Una evaluación preliminar del lender sujeta a verificación; no es aprobación final.",
      ],
      [
        "¿Qué es DTI?",
        "Una comparación entre ciertas obligaciones mensuales e ingresos; el lender aplica sus reglas.",
      ],
      [
        "¿Qué son closing costs?",
        "Costos relacionados con originación, evaluación, title, seguros u otros conceptos que varían.",
      ],
      [
        "¿Puede existir cero down payment?",
        "Algunos programas pueden permitirlo a compradores y propiedades elegibles; debe verificarse.",
      ],
      [
        "¿Qué son seller concessions?",
        "Contribuciones negociadas del vendedor sujetas al contrato y reglas del financiamiento.",
      ],
      [
        "¿Qué es escrow?",
        "Un mecanismo de manejo de fondos o pagos que depende de la transacción y jurisdicción.",
      ],
      [
        "¿Debo abrir crédito antes del cierre?",
        "Los cambios de crédito o nuevas deudas pueden afectar la evaluación; consulta al lender antes.",
      ],
      ["¿SG Solutions aprueba la hipoteca?", "No; el lender decide."],
    ],
    related: [
      link(
        "Crédito",
        "Organiza reportes y preguntas antes de la evaluación hipotecaria.",
        "/servicios/credito/",
      ),
      link(
        "Preparación para financiamiento",
        "Revisa capacidad, documentos y comparación responsable.",
        "/servicios/preparacion-para-financiamiento/",
      ),
    ],
    seoTitle: "Ayuda para prepararte a comprar casa | SG Solutions",
    seoDescription:
      "Organiza crédito, presupuesto, documentos y preguntas para lenders sin promesas de elegibilidad o aprobación.",
    sources: ["CFPB-HOME-PREAPPROVAL", "USDA-HOME-LOAN", "VA-HOME-LOAN", "HUD-HOME-BUYING"],
    primary: "Agenda una evaluación para comprar casa",
  },
  {
    heading: "First-time home buying preparation",
    summary:
      "Connect credit, income, employment, debt, budget, and documents so you can speak with lenders and professionals with better questions.",
    audience: [
      "You are a first-time homebuyer.",
      "You are unsure whether credit and budget are ready.",
      "You want to understand programs and costs without assuming eligibility.",
    ],
    problems: [
      "Preapproval is confused with final approval.",
      "Closing costs, reserves, or mortgage insurance were not considered.",
      "Credit changes or large money movements may create questions before closing.",
    ],
    overview:
      "SG Solutions educates and prepares; the lender evaluates credit, income, debt, property, and program, while agents and title/closing professionals have different roles.",
    actions: [
      "Organize credit, income, employment, and debts.",
      "Explain DTI, budget, down payment, and reserves as concepts.",
      "Prepare documents and lender questions.",
      "Explain inspection, preapproval, escrow, title, and closing.",
    ],
    process: [
      "Define goal, timing, and budget.",
      "Review credit, income, employment, and obligations.",
      "Organize funds, documents, and questions.",
      "Compare FHA, USDA, VA, Conventional, or assistance only when relevant.",
      "Prepare for preapproval, search, contract, inspection, and closing.",
    ],
    preparation: [
      "Income and employment records.",
      "Debts, monthly payments, and budget.",
      "Available funds, reserves, and documented large movements.",
      "Lender-requested documents through a secure channel.",
    ],
    expectations: [
      "A readiness map, not an approval.",
      "Questions for the lender, real estate agent, and title/closing team.",
      "Warnings about new debt or changes before closing.",
    ],
    limits: [
      "SG Solutions is not a lender.",
      "It is not a real estate agent without explicit authorization or licensing.",
      "No approval, program, rate, down payment, or seller-concession guarantee.",
    ],
    faq: [
      [
        "What is preapproval?",
        "A lender's preliminary review subject to verification; it is not final approval.",
      ],
      [
        "What is DTI?",
        "A comparison of certain monthly obligations and income; the lender applies its rules.",
      ],
      [
        "What are closing costs?",
        "Costs related to origination, valuation, title, insurance, or other items that vary.",
      ],
      [
        "Can zero down payment be available?",
        "Some programs may allow it for eligible buyers and properties; it must be verified.",
      ],
      [
        "What are seller concessions?",
        "Negotiated seller contributions subject to the contract and financing rules.",
      ],
      [
        "What is escrow?",
        "A mechanism for handling funds or payments that depends on the transaction and jurisdiction.",
      ],
      [
        "Should I open credit before closing?",
        "Credit changes or new debt may affect review; ask the lender first.",
      ],
      ["Does SG Solutions approve the mortgage?", "No; the lender decides."],
    ],
    related: [
      link(
        "Credit guidance",
        "Organize reports and questions before mortgage review.",
        "/en/services/credit/",
      ),
      link(
        "Financing preparation",
        "Review capacity, documents, and responsible comparison.",
        "/en/services/financing-preparation/",
      ),
    ],
    seoTitle: "First-time home buying preparation | SG Solutions",
    seoDescription:
      "Organize credit, budget, documents, and lender questions without eligibility or approval promises.",
    sources: ["CFPB-HOME-PREAPPROVAL", "USDA-HOME-LOAN", "VA-HOME-LOAN", "HUD-HOME-BUYING"],
    primary: "Schedule a home buying evaluation",
  },
);

const marketplace = compactService(
  "marketplace",
  {
    heading: "Marketplace financiero en preparación",
    summary:
      "Conoce cómo se distinguirán SG Solutions y proveedores externos cuando existan ofertas reales, aprobadas y divulgadas.",
    audience: [
      "Quieres entender categorías futuras.",
      "Necesitas distinguir orientación de una oferta.",
      "Quieres saber cómo se manejarían consentimiento y privacidad.",
    ],
    problems: [
      "Una categoría no equivale a disponibilidad.",
      "El proveedor controla precio y aprobación.",
      "Compartir datos requiere consentimiento.",
    ],
    overview:
      "Actualmente no hay ofertas, partners, referrals ni aplicaciones activas publicadas en el marketplace.",
    actions: [
      "Explicamos categorías de forma educativa.",
      "Separamos claramente a cada proveedor.",
      "Mostramos divulgaciones antes de cualquier redirección.",
      "Solicitamos consentimiento antes de compartir datos.",
    ],
    process: [
      "Publicar solo proveedores aprobados.",
      "Mostrar términos y divulgaciones confirmados.",
      "Obtener consentimiento explícito.",
      "Redirigir al proveedor sin simular aprobación.",
    ],
    preparation: [
      "Objetivo general.",
      "Preguntas sobre costo y privacidad.",
      "Consentimiento solo cuando exista una oferta real.",
    ],
    expectations: [
      "Estado honesto de disponibilidad.",
      "Separación de responsabilidades.",
      "Sin recomendaciones individuales automáticas.",
    ],
    limits: [
      "No hay ofertas activas actualmente.",
      "No se inventan partners.",
      "Precio, disponibilidad y aprobación pertenecen al proveedor.",
    ],
    faq: [
      ["¿Hay productos activos?", "No en este momento."],
      [
        "¿SG Solutions es el proveedor?",
        "No necesariamente; se identificaría claramente al tercero.",
      ],
      ["¿Comparten mis datos?", "No sin consentimiento explícito y una finalidad aprobada."],
      ["¿Garantizan aprobación?", "No."],
      ["¿Es una recomendación individual?", "No."],
      ["¿Puedo aplicar aquí?", "No mientras no exista una integración activa y aprobada."],
    ],
    related: [
      link(
        "Preparación para financiamiento",
        "Organiza preguntas antes de considerar productos.",
        "/servicios/preparacion-para-financiamiento/",
      ),
    ],
    seoTitle: "Marketplace financiero | SG Solutions",
    seoDescription:
      "Estado honesto y divulgaciones para futuras categorías de terceros; actualmente no hay ofertas activas.",
    sources: ["SGS-COMPLIANCE-BOUNDARIES"],
    disclosure:
      "Actualmente no existen ofertas, partners ni aplicaciones activas en esta superficie.",
  },
  {
    heading: "Financial marketplace in preparation",
    summary:
      "Learn how SG Solutions and third-party providers will be distinguished when real, approved, disclosed offers exist.",
    audience: [
      "You want to understand future categories.",
      "You need to distinguish guidance from an offer.",
      "You want to know how consent and privacy would work.",
    ],
    problems: [
      "A category does not mean availability.",
      "The provider controls price and approval.",
      "Data sharing requires consent.",
    ],
    overview:
      "There are currently no active offers, partners, referrals, or applications published in the marketplace.",
    actions: [
      "Explain categories educationally.",
      "Clearly separate each provider.",
      "Show disclosures before any redirect.",
      "Request consent before sharing data.",
    ],
    process: [
      "Publish only approved providers.",
      "Show confirmed terms and disclosures.",
      "Obtain explicit consent.",
      "Redirect to the provider without simulating approval.",
    ],
    preparation: [
      "A general objective.",
      "Questions about cost and privacy.",
      "Consent only when a real offer exists.",
    ],
    expectations: [
      "Honest availability status.",
      "Clear responsibility boundaries.",
      "No automatic individual recommendations.",
    ],
    limits: [
      "No active offers exist now.",
      "Partners are not invented.",
      "Price, availability, and approval belong to the provider.",
    ],
    faq: [
      ["Are products active?", "Not at this time."],
      [
        "Is SG Solutions the provider?",
        "Not necessarily; a third party would be clearly identified.",
      ],
      ["Is my data shared?", "Not without explicit consent and an approved purpose."],
      ["Is approval guaranteed?", "No."],
      ["Is this individual advice?", "No."],
      ["Can I apply here?", "Not while no approved active integration exists."],
    ],
    related: [
      link(
        "Financing preparation",
        "Organize questions before considering products.",
        "/en/services/financing-preparation/",
      ),
    ],
    seoTitle: "Financial marketplace | SG Solutions",
    seoDescription:
      "Honest status and disclosures for future third-party categories; no active offers currently exist.",
    sources: ["SGS-COMPLIANCE-BOUNDARIES"],
    disclosure: "There are currently no active offers, partners, or applications on this surface.",
  },
);

export const SERVICE_PAGE_CONTENT: ServiceContentCatalog = {
  "service-credit": credit,
  "service-credit-monitoring": creditMonitoring,
  "service-taxes": taxes,
  "service-business-formation": formation,
  "service-ein": ein,
  "service-business-compliance": compliance,
  "service-business-credit": businessCredit,
  "service-business-funding": funding,
  "service-loan-preparation": loanPreparation,
  "service-home-buying": homeBuying,
  marketplace,
};

export const SERVICE_ROUTE_KEYS = Object.keys(SERVICE_PAGE_CONTENT) as ServiceRoute[];
