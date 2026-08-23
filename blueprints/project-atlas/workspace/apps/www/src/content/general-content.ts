import type { Locale, PublicSection, RouteKey } from "../domain/public-site";

type GeneralRoute = Extract<
  RouteKey,
  "home" | "services" | "about" | "pricing" | "faq" | "help-center" | "academy" | "contact"
>;
type Pair = Record<Locale, PublicSection[]>;

const section = (
  id: string,
  title: string,
  variant: PublicSection["variant"],
  items: Array<[string, string, string?]>,
  intro?: string,
): PublicSection => ({
  id,
  title,
  intro,
  variant,
  items: items.map(([itemTitle, body, href]) => ({ title: itemTitle, body, href })),
});

const home: Pair = {
  es: [
    section("credit-priority", "Crédito como punto de partida", "feature", [
      [
        "Entiende antes de actuar",
        "La asistencia de reparación de crédito es un punto de partida principal: revisamos reportes, explicamos factores y organizamos ayuda responsable con posibles inexactitudes.",
        "/servicios/credito/",
      ],
    ]),
    section("service-map", "Un mapa de servicios conectados", "cards", [
      ["Crédito", "Reportes, educación y asistencia responsable.", "/servicios/credito/"],
      ["Taxes", "W-2, 1099, self-employed y pequeños negocios.", "/servicios/taxes/"],
      [
        "Negocios",
        "Formación, EIN, compliance y business credit.",
        "/servicios/formacion-de-negocios/",
      ],
      [
        "Funding",
        "Preparación financiera antes de hablar con proveedores.",
        "/servicios/financiamiento-empresarial/",
      ],
      [
        "Comprar casa",
        "Crédito, presupuesto, documentos y preguntas para lenders.",
        "/servicios/comprar-casa/",
      ],
    ]),
    section("who-we-serve", "A quién ayudamos", "cards", [
      ["Personas", "Quienes necesitan organizar crédito, taxes o una meta de vivienda."],
      ["Emprendedores", "Quienes están formando o estructurando un negocio."],
      [
        "Pequeños negocios",
        "Quienes necesitan records, compliance, business credit o preparación de funding.",
      ],
    ]),
    section("needs", "Problemas que ayudamos a organizar", "checklist", [
      [
        "Información dispersa",
        "Reunimos preguntas y próximos pasos sin pedir datos sensibles públicamente.",
      ],
      ["Procesos confusos", "Separamos educación, preparación, revisión y decisiones de terceros."],
      [
        "Metas conectadas",
        "Mostramos cómo crédito, taxes, negocio y vivienda pueden relacionarse sin mezclarlos.",
      ],
    ]),
    section("process", "De una pregunta a un plan claro", "steps", [
      ["Comparte tu objetivo", "Empieza con contexto general."],
      ["Revisamos alcance", "Aclaramos qué puede hacer SG Solutions."],
      ["Preparamos información", "Organizamos documentos y preguntas por canal seguro."],
      ["Confirmamos próximos pasos", "Nada operativo comienza sin alcance y autorización."],
    ]),
    section("trust", "Confianza construida con límites visibles", "cards", [
      ["Educación", "Explicamos conceptos antes de pedir una decisión."],
      [
        "Revisión humana",
        "La tecnología organiza; las decisiones importantes siguen bajo responsabilidad humana.",
      ],
      ["Privacidad", "No pedimos SSN, credenciales ni documentos completos en la web pública."],
      ["Sin promesas", "No inventamos resultados, precios, partners, licencias o tiempos."],
    ]),
    section("home-buying", "Tu primera casa comienza con preparación", "feature", [
      [
        "Crédito, presupuesto y documentos",
        "Organiza preguntas sobre preapproval, programas, closing costs y próximos pasos sin asumir elegibilidad.",
        "/servicios/comprar-casa/",
      ],
    ]),
    section("education", "Recursos para llegar mejor preparado", "cards", [
      ["Centro de ayuda", "Encuentra respuestas iniciales y rutas seguras.", "/centro-de-ayuda/"],
      ["Academia financiera", "Explora conceptos educativos por tema.", "/academia/"],
      [
        "Preguntas frecuentes",
        "Aclara alcance, documentos, precios y privacidad.",
        "/preguntas-frecuentes/",
      ],
    ]),
  ],
  en: [
    section("credit-priority", "Credit as a starting point", "feature", [
      [
        "Understand before acting",
        "Credit repair assistance is a primary starting point: we review reports, explain factors, and organize responsible help with potential inaccuracies.",
        "/en/services/credit/",
      ],
    ]),
    section("service-map", "A connected service map", "cards", [
      ["Credit", "Reports, education, and responsible assistance.", "/en/services/credit/"],
      ["Taxes", "W-2, 1099, self-employed, and small business preparation.", "/en/services/taxes/"],
      [
        "Business",
        "Formation, EIN, compliance, and business credit.",
        "/en/services/business-formation/",
      ],
      [
        "Funding",
        "Financial preparation before provider conversations.",
        "/en/services/business-funding/",
      ],
      [
        "Home buying",
        "Credit, budget, documents, and lender questions.",
        "/en/services/home-buying/",
      ],
    ]),
    section("who-we-serve", "Who we help", "cards", [
      ["Individuals", "People organizing credit, taxes, or a housing goal."],
      ["Entrepreneurs", "People forming or structuring a business."],
      [
        "Small businesses",
        "Teams needing records, compliance, business credit, or funding preparation.",
      ],
    ]),
    section("needs", "Problems we help organize", "checklist", [
      [
        "Scattered information",
        "We bring questions and next steps together without requesting sensitive data publicly.",
      ],
      [
        "Confusing processes",
        "We separate education, preparation, review, and third-party decisions.",
      ],
      [
        "Connected goals",
        "We show how credit, taxes, business, and housing may relate without mixing them.",
      ],
    ]),
    section("process", "From one question to a clear plan", "steps", [
      ["Share your goal", "Start with general context."],
      ["Review scope", "Clarify what SG Solutions can do."],
      ["Prepare information", "Organize documents and questions through a secure channel."],
      ["Confirm next steps", "No operational work begins without scope and authorization."],
    ]),
    section("trust", "Trust built through visible boundaries", "cards", [
      ["Education", "We explain concepts before requesting a decision."],
      ["Human review", "Technology organizes; important decisions remain a human responsibility."],
      ["Privacy", "We do not request SSNs, credentials, or full documents on the public site."],
      ["No promises", "We do not invent outcomes, prices, partners, licenses, or timelines."],
    ]),
    section("home-buying", "Your first home starts with preparation", "feature", [
      [
        "Credit, budget, and documents",
        "Organize questions about preapproval, programs, closing costs, and next steps without assuming eligibility.",
        "/en/services/home-buying/",
      ],
    ]),
    section("education", "Resources for better preparation", "cards", [
      ["Help Center", "Find initial answers and safe paths.", "/en/help-center/"],
      ["Financial Academy", "Explore educational concepts by topic.", "/en/academy/"],
      ["Frequently asked questions", "Clarify scope, documents, pricing, and privacy.", "/en/faq/"],
    ]),
  ],
};

const services: Pair = {
  es: [
    section("choose", "Elige por la necesidad que tienes hoy", "cards", [
      [
        "Necesito mejorar u organizar mi crédito",
        "Empieza con reportes, factores y posibles inexactitudes.",
        "/servicios/credito/",
      ],
      [
        "Necesito preparar taxes",
        "Organiza W-2, 1099, ingresos, gastos y records.",
        "/servicios/taxes/",
      ],
      [
        "Quiero abrir una LLC",
        "Prepara nombre, miembros, dirección y jurisdicción.",
        "/servicios/formacion-de-negocios/",
      ],
      [
        "Quiero organizar business credit",
        "Separa banca, identidad y records del negocio.",
        "/servicios/credito-empresarial/",
      ],
      [
        "Busco financiamiento",
        "Aclara uso, capacidad, documentos y preguntas.",
        "/servicios/preparacion-para-financiamiento/",
      ],
      [
        "Quiero comprar mi primera casa",
        "Conecta crédito, presupuesto y documentos.",
        "/servicios/comprar-casa/",
      ],
    ]),
    section("compare", "Qué cambia entre los puntos de partida", "cards", [
      [
        "Educación y revisión",
        "Crédito, monitoreo y vivienda comienzan por comprender información.",
      ],
      [
        "Preparación documental",
        "Taxes, EIN y formation requieren datos consistentes antes de cualquier acción.",
      ],
      [
        "Decisión externa",
        "Funding, loans y vivienda dependen de proveedores, lenders o autoridades.",
      ],
      ["Seguimiento", "Compliance y monitoreo ayudan a mantener cambios y fechas visibles."],
    ]),
    section("connected", "Servicios que pueden relacionarse", "prose", [
      [
        "Crédito y vivienda",
        "Preparar el perfil no garantiza una hipoteca, pero ayuda a formular mejores preguntas.",
      ],
      ["Formation, EIN y compliance", "Son pasos relacionados con alcances distintos."],
      [
        "Business credit y funding",
        "Una base organizada ayuda a prepararse, pero el proveedor decide.",
      ],
    ]),
    section("start", "Cómo comenzar", "steps", [
      ["Identifica tu necesidad principal", "No necesitas elegir todos los servicios."],
      ["Agenda una evaluación", "Comparte contexto general, no documentos sensibles."],
      ["Confirma alcance", "Recibe claridad antes de autorizar trabajo."],
      [
        "Continúa por canal seguro",
        "Los datos privados se solicitan después cuando sean necesarios.",
      ],
    ]),
  ],
  en: [
    section("choose", "Choose based on today's need", "cards", [
      [
        "I need to improve or organize credit",
        "Start with reports, factors, and potential inaccuracies.",
        "/en/services/credit/",
      ],
      [
        "I need to prepare taxes",
        "Organize W-2s, 1099s, income, expenses, and records.",
        "/en/services/taxes/",
      ],
      [
        "I want to open an LLC",
        "Prepare name, members, address, and jurisdiction.",
        "/en/services/business-formation/",
      ],
      [
        "I want to organize business credit",
        "Separate business banking, identity, and records.",
        "/en/services/business-credit/",
      ],
      [
        "I am seeking financing",
        "Clarify use, capacity, documents, and questions.",
        "/en/services/financing-preparation/",
      ],
      [
        "I want to buy my first home",
        "Connect credit, budget, and documents.",
        "/en/services/home-buying/",
      ],
    ]),
    section("compare", "How starting points differ", "cards", [
      [
        "Education and review",
        "Credit, monitoring, and housing start with understanding information.",
      ],
      ["Document preparation", "Taxes, EIN, and formation require consistent data before action."],
      [
        "External decision",
        "Funding, loans, and housing depend on providers, lenders, or authorities.",
      ],
      ["Follow-up", "Compliance and monitoring help keep changes and dates visible."],
    ]),
    section("connected", "Services that may connect", "prose", [
      [
        "Credit and housing",
        "Preparing a profile does not guarantee a mortgage, but supports better questions.",
      ],
      ["Formation, EIN, and compliance", "They are related steps with different scopes."],
      [
        "Business credit and funding",
        "An organized foundation supports preparation, but the provider decides.",
      ],
    ]),
    section("start", "How to start", "steps", [
      ["Identify your primary need", "You do not need to choose every service."],
      ["Schedule an evaluation", "Share general context, not sensitive documents."],
      ["Confirm scope", "Receive clarity before authorizing work."],
      ["Continue securely", "Private data is requested later only when necessary."],
    ]),
  ],
};

const about: Pair = {
  es: [
    section("mission", "Misión", "feature", [
      [
        "Claridad para avanzar",
        "Ayudar a personas, emprendedores y pequeños negocios a organizar decisiones financieras y empresariales con educación, límites y seguimiento humano.",
      ],
    ]),
    section("vision", "Visión", "prose", [
      [
        "Servicios conectados, no confusos",
        "Una experiencia bilingüe donde el cliente entiende qué está pasando, qué debe preparar y quién toma cada decisión.",
      ],
    ]),
    section("approach", "Nuestro enfoque", "cards", [
      [
        "Educativo",
        "Explicamos conceptos sin presentar contenido general como recomendación individual.",
      ],
      ["Humano", "Las decisiones importantes reciben revisión humana."],
      [
        "Responsable con tecnología",
        "La tecnología ayuda a organizar, no inventa hechos ni reemplaza autoridades.",
      ],
      ["Privado", "La web pública recopila solo contexto general."],
    ]),
    section("audience", "A quién servimos", "cards", [
      ["Personas", "Crédito, taxes, financiamiento y vivienda."],
      ["Emprendedores", "Formación y organización inicial."],
      ["Pequeños negocios", "Records, compliance, business credit y funding."],
    ]),
    section("connections", "Cómo se relacionan los servicios", "prose", [
      [
        "Una meta, varios contextos",
        "Podemos identificar relaciones entre servicios sin venderlos como obligatorios ni ejecutar módulos futuros.",
      ],
    ]),
  ],
  en: [
    section("mission", "Mission", "feature", [
      [
        "Clarity to move forward",
        "Help individuals, entrepreneurs, and small businesses organize financial and business decisions through education, boundaries, and human follow-up.",
      ],
    ]),
    section("vision", "Vision", "prose", [
      [
        "Connected, understandable services",
        "A bilingual experience where clients understand what is happening, what to prepare, and who makes each decision.",
      ],
    ]),
    section("approach", "Our approach", "cards", [
      [
        "Educational",
        "We explain concepts without presenting general content as individual advice.",
      ],
      ["Human", "Important decisions receive human review."],
      [
        "Responsible technology",
        "Technology helps organize and does not invent facts or replace authorities.",
      ],
      ["Private", "The public site collects only general context."],
    ]),
    section("audience", "Who we serve", "cards", [
      ["Individuals", "Credit, taxes, financing, and housing."],
      ["Entrepreneurs", "Formation and initial organization."],
      ["Small businesses", "Records, compliance, business credit, and funding."],
    ]),
    section("connections", "How services connect", "prose", [
      [
        "One goal, several contexts",
        "We can identify relationships among services without presenting them as mandatory or executing future modules.",
      ],
    ]),
  ],
};

const pricing: Pair = {
  es: [
    section("why-evaluate", "Por qué algunos servicios requieren evaluación", "prose", [
      [
        "El alcance cambia",
        "Documentos, complejidad, jurisdicción y objetivo influyen en el trabajo; por eso no existe un precio universal.",
      ],
    ]),
    section("terms", "Consulta, cotización, depósito y pago no son lo mismo", "cards", [
      ["Consulta o evaluación", "Aclara la necesidad y el alcance."],
      ["Cotización", "Describe el trabajo y costo propuestos sin autorizarlo todavía."],
      ["Depósito", "Solo aplica cuando exista acuerdo y política confirmada."],
      ["Pago", "Se procesa únicamente mediante un flujo autorizado; esta página no cobra."],
    ]),
    section("quote-factors", "Qué puede influir en una cotización", "checklist", [
      ["Servicio y alcance", "Qué trabajo se solicita realmente."],
      ["Complejidad y documentos", "Qué revisión o preparación es necesaria."],
      ["Jurisdicción y terceros", "Qué reglas o proveedores intervienen."],
      ["Urgencia real", "Qué fechas están confirmadas, sin prometer tiempos no verificados."],
    ]),
    section("clarity", "Claridad antes de autorizar", "feature", [
      [
        "Sin montos ocultos en el copy",
        "El cliente debe recibir alcance, límites y próximos pasos antes de autorizar trabajo.",
      ],
    ]),
  ],
  en: [
    section("why-evaluate", "Why some services require evaluation", "prose", [
      [
        "Scope varies",
        "Documents, complexity, jurisdiction, and objective affect the work, so there is no universal price.",
      ],
    ]),
    section("terms", "Consultation, quote, deposit, and payment are different", "cards", [
      ["Consultation or evaluation", "Clarifies the need and scope."],
      ["Quote", "Describes proposed work and cost without authorizing it yet."],
      ["Deposit", "Applies only when an agreement and policy are confirmed."],
      ["Payment", "Runs only through an authorized flow; this page does not charge."],
    ]),
    section("quote-factors", "What can influence a quote", "checklist", [
      ["Service and scope", "The work actually requested."],
      ["Complexity and documents", "The review or preparation required."],
      ["Jurisdiction and third parties", "The rules or providers involved."],
      ["Real urgency", "Confirmed dates without unverified timeline promises."],
    ]),
    section("clarity", "Clarity before authorization", "feature", [
      [
        "No hidden amounts in copy",
        "Clients should receive scope, boundaries, and next steps before authorizing work.",
      ],
    ]),
  ],
};

const faqItems = {
  es: {
    General: [
      [
        "¿Qué hace SG Solutions?",
        "Educa, prepara y organiza próximos pasos dentro de un alcance confirmado.",
      ],
      ["¿Garantizan resultados?", "No."],
      [
        "¿Debo crear una cuenta primero?",
        "No; el primer paso público es una evaluación o cotización.",
      ],
    ],
    Crédito: [
      ["¿Pueden borrar información correcta?", "No."],
      ["¿Crean CPN?", "No."],
      ["¿El monitoreo repara crédito?", "No."],
      ["¿Garantizan aumento de score?", "No."],
    ],
    Taxes: [
      ["¿Garantizan refund?", "No."],
      ["¿Todo gasto es deducible?", "No; depende de hechos y reglas."],
      ["¿Atienden W-2, 1099 y self-employed?", "Sí, según alcance y revisión individual."],
    ],
    "LLC y EIN": [
      ["¿Una LLC reduce impuestos automáticamente?", "No."],
      ["¿Quién emite el EIN?", "El IRS."],
      ["¿Presentan sin autorización?", "No."],
    ],
    "Business Credit y Funding": [
      ["¿Un EIN garantiza crédito?", "No."],
      ["¿SG Solutions es lender?", "No."],
      ["¿Garantizan monto o tasa?", "No."],
    ],
    Vivienda: [
      ["¿SG Solutions aprueba hipotecas?", "No; el lender decide."],
      [
        "¿Puede existir cero down payment?",
        "Algunos programas pueden permitirlo a compradores y propiedades elegibles.",
      ],
      ["¿Preapproval es aprobación final?", "No."],
      ["¿Garantizan seller concessions?", "No."],
    ],
    Citas: [
      [
        "¿La web agenda una cita real?",
        "Solo cuando exista un destino configurado; de lo contrario muestra contacto seguro.",
      ],
      ["¿Puedo reprogramar aquí?", "No en M001."],
    ],
    Precios: [
      ["¿Por qué no hay precios?", "El alcance varía y debe evaluarse."],
      ["¿Una cotización inicia trabajo?", "No; requiere autorización."],
    ],
    Documentos: [
      ["¿Puedo enviar SSN o taxes por contacto público?", "No."],
      ["¿Cómo comparto documentos?", "Después se indicará un canal seguro."],
    ],
    "Portal y privacidad": [
      ["¿El portal está activo?", "No se afirma disponibilidad hasta su activación aprobada."],
      ["¿Comparten datos con partners?", "No sin consentimiento explícito y un partner aprobado."],
      ["¿La IA decide mi caso?", "No."],
    ],
  },
  en: {
    General: [
      [
        "What does SG Solutions do?",
        "It educates, prepares, and organizes next steps within confirmed scope.",
      ],
      ["Are results guaranteed?", "No."],
      ["Must I create an account first?", "No; the first public step is an evaluation or quote."],
    ],
    Credit: [
      ["Can accurate information be erased?", "No."],
      ["Do you create CPNs?", "No."],
      ["Does monitoring repair credit?", "No."],
      ["Do you guarantee a score increase?", "No."],
    ],
    Taxes: [
      ["Do you guarantee a refund?", "No."],
      ["Is every expense deductible?", "No; facts and rules control."],
      [
        "Do you serve W-2, 1099, and self-employed clients?",
        "Yes, subject to scope and individual review.",
      ],
    ],
    "LLC and EIN": [
      ["Does an LLC automatically reduce taxes?", "No."],
      ["Who issues an EIN?", "The IRS."],
      ["Do you file without authorization?", "No."],
    ],
    "Business Credit and Funding": [
      ["Does an EIN guarantee credit?", "No."],
      ["Is SG Solutions a lender?", "No."],
      ["Do you guarantee amount or rate?", "No."],
    ],
    "Home Buying": [
      ["Does SG Solutions approve mortgages?", "No; the lender decides."],
      [
        "Can zero down payment be available?",
        "Some programs may allow it for eligible buyers and properties.",
      ],
      ["Is preapproval final approval?", "No."],
      ["Are seller concessions guaranteed?", "No."],
    ],
    Appointments: [
      [
        "Does this site book a real appointment?",
        "Only when a destination is configured; otherwise it provides a safe contact path.",
      ],
      ["Can I reschedule here?", "Not in M001."],
    ],
    Pricing: [
      ["Why are prices not listed?", "Scope varies and must be evaluated."],
      ["Does a quote start work?", "No; authorization is required."],
    ],
    Documents: [
      ["Can I send an SSN or tax records through public contact?", "No."],
      ["How do I share documents?", "A secure channel is provided later."],
    ],
    "Portal and privacy": [
      ["Is the portal active?", "Availability is not claimed until approved activation."],
      ["Is data shared with partners?", "Not without explicit consent and an approved partner."],
      ["Does AI decide my case?", "No."],
    ],
  },
} as const;

const faq: Pair = {
  es: Object.entries(faqItems.es).map(([category, items], index) =>
    section(
      `faq-${index + 1}`,
      category,
      "faq",
      items.map(([question, answer]) => [question, answer]),
    ),
  ),
  en: Object.entries(faqItems.en).map(([category, items], index) =>
    section(
      `faq-${index + 1}`,
      category,
      "faq",
      items.map(([question, answer]) => [question, answer]),
    ),
  ),
};

const helpAcademyContact: Record<"help-center" | "academy" | "contact", Pair> = {
  "help-center": {
    es: [
      section("start", "Empieza por tu necesidad", "cards", [
        ["Crédito", "Reportes, errores y próximos pasos.", "/servicios/credito/"],
        ["Taxes", "Documentos e intake.", "/servicios/taxes/"],
        ["Negocios", "Formation, EIN y compliance.", "/servicios/formacion-de-negocios/"],
        ["Vivienda", "Preparación para hablar con lenders.", "/servicios/comprar-casa/"],
      ]),
      section("safe", "Qué puedes resolver aquí", "checklist", [
        ["Entender alcance", "Consulta explicaciones aprobadas."],
        ["Encontrar una ruta", "Abre el servicio o FAQ relacionado."],
        ["Proteger tus datos", "No envíes información sensible públicamente."],
      ]),
      section("future", "Contenido en expansión", "feature", [
        [
          "Estado honesto",
          "El Centro de ayuda ofrece rutas iniciales; no simula un CMS ni archivos descargables inexistentes.",
        ],
      ]),
    ],
    en: [
      section("start", "Start with your need", "cards", [
        ["Credit", "Reports, errors, and next steps.", "/en/services/credit/"],
        ["Taxes", "Documents and intake.", "/en/services/taxes/"],
        ["Business", "Formation, EIN, and compliance.", "/en/services/business-formation/"],
        ["Housing", "Preparation for lender conversations.", "/en/services/home-buying/"],
      ]),
      section("safe", "What you can resolve here", "checklist", [
        ["Understand scope", "Read approved explanations."],
        ["Find a path", "Open the related service or FAQ."],
        ["Protect your data", "Do not send sensitive information publicly."],
      ]),
      section("future", "Growing content", "feature", [
        [
          "Honest status",
          "The Help Center provides initial paths and does not simulate a CMS or nonexistent downloads.",
        ],
      ]),
    ],
  },
  academy: {
    es: [
      section("categories", "Rutas educativas iniciales", "cards", [
        [
          "Fundamentos de crédito",
          "Factores, reportes y disputas responsables.",
          "/servicios/credito/",
        ],
        ["Organización fiscal", "Ingresos, gastos y records.", "/servicios/taxes/"],
        [
          "Base empresarial",
          "Formation, EIN, compliance y business credit.",
          "/servicios/formacion-de-negocios/",
        ],
        [
          "Preparación para vivienda",
          "Presupuesto, documentos y roles.",
          "/servicios/comprar-casa/",
        ],
      ]),
      section("use", "Cómo usar la Academia", "steps", [
        ["Elige una meta", "No necesitas leer todo."],
        ["Aprende conceptos", "Distingue educación de recomendación individual."],
        ["Prepara preguntas", "Llévalas a tu evaluación."],
        ["Verifica cambios", "Consulta fuentes oficiales cuando una regla pueda cambiar."],
      ]),
      section("status", "Estado de los recursos", "feature", [
        [
          "Biblioteca inicial",
          "Solo se muestran rutas que existen; no hay descargas ni cursos activos simulados.",
        ],
      ]),
    ],
    en: [
      section("categories", "Initial learning paths", "cards", [
        [
          "Credit foundations",
          "Factors, reports, and responsible disputes.",
          "/en/services/credit/",
        ],
        ["Tax organization", "Income, expenses, and records.", "/en/services/taxes/"],
        [
          "Business foundation",
          "Formation, EIN, compliance, and business credit.",
          "/en/services/business-formation/",
        ],
        ["Home buying preparation", "Budget, documents, and roles.", "/en/services/home-buying/"],
      ]),
      section("use", "How to use the Academy", "steps", [
        ["Choose a goal", "You do not need to read everything."],
        ["Learn concepts", "Separate education from individual advice."],
        ["Prepare questions", "Bring them to your evaluation."],
        ["Verify changes", "Use official sources when a rule may change."],
      ]),
      section("status", "Resource status", "feature", [
        [
          "Initial library",
          "Only existing paths are shown; no downloads or active courses are simulated.",
        ],
      ]),
    ],
  },
  contact: {
    es: [
      section("share", "Qué información general compartir", "checklist", [
        ["Servicio de interés", "Indica crédito, taxes, negocio, funding o vivienda."],
        ["Objetivo", "Resume qué quieres organizar."],
        ["Estado o jurisdicción", "Solo cuando sea relevante para orientar el alcance."],
        ["Preferencia de contacto", "Indica el canal general sin enviar credenciales."],
      ]),
      section("never-send", "Qué no enviar públicamente", "feature", [
        [
          "Protege información sensible",
          "No envíes SSN, números de cuenta, reportes completos, taxes, identificaciones, contraseñas o tarjetas.",
        ],
      ]),
      section("paths", "Elige el próximo paso", "cards", [
        ["Agenda una evaluación", "Para entender alcance y preparación."],
        ["Solicita una cotización", "Para un servicio y alcance identificados."],
        [
          "Canal seguro después",
          "Los documentos se comparten únicamente cuando se proporcione un canal autorizado.",
        ],
      ]),
    ],
    en: [
      section("share", "General information to share", "checklist", [
        ["Service of interest", "Identify credit, taxes, business, funding, or housing."],
        ["Goal", "Summarize what you want to organize."],
        ["State or jurisdiction", "Only when relevant to scope."],
        ["Contact preference", "Identify a general channel without credentials."],
      ]),
      section("never-send", "What not to send publicly", "feature", [
        [
          "Protect sensitive information",
          "Do not send SSNs, account numbers, complete reports, tax records, IDs, passwords, or cards.",
        ],
      ]),
      section("paths", "Choose the next step", "cards", [
        ["Schedule an evaluation", "To understand scope and preparation."],
        ["Request a quote", "For an identified service and scope."],
        [
          "Secure channel later",
          "Documents are shared only after an authorized channel is provided.",
        ],
      ]),
    ],
  },
};

export const GENERAL_PAGE_SECTIONS: Record<GeneralRoute, Pair> = {
  home,
  services,
  about,
  pricing,
  faq,
  "help-center": helpAcademyContact["help-center"],
  academy: helpAcademyContact.academy,
  contact: helpAcademyContact.contact,
};

export function getGeneralPageSections(
  routeKey: RouteKey,
  locale: Locale,
): PublicSection[] | undefined {
  return GENERAL_PAGE_SECTIONS[routeKey as GeneralRoute]?.[locale];
}
