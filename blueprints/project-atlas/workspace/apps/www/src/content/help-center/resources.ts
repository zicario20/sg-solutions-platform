import type {
  ContentRisk,
  HelpCategoryId,
  KnowledgeBlock,
  KnowledgeRecord,
  KnowledgeSourceReference,
  KnowledgeType,
} from "../../domain/help-center";

interface ResourceCopy {
  title: string;
  summary: string;
  blocks: KnowledgeBlock[];
  keywords: string[];
  disclosure: string;
}

interface ResourceSeed {
  key: string;
  type: Exclude<KnowledgeType, "faq">;
  category: HelpCategoryId;
  es: ResourceCopy;
  en: ResourceCopy;
  relatedKeys?: string[];
  riskLevel?: ContentRisk;
  sources?: KnowledgeSourceReference[];
  jurisdiction?: string;
  nextReviewAt?: string;
}

const GENERAL_ES = "Información general; confirma el alcance aplicable durante una evaluación.";
const GENERAL_EN = "General information; confirm the applicable scope during an evaluation.";

const RESOURCE_SEEDS: ResourceSeed[] = [
  resource(
    "how-sg-works",
    "article",
    "getting-started",
    "Cómo funciona SG Solutions",
    "Una explicación clara del recorrido desde la exploración pública hasta un servicio autorizado.",
    [
      paragraph(
        "Primero exploras información pública y seleccionas el área que se relaciona con tu objetivo.",
      ),
      steps([
        ["Evaluación", "Se aclaran el objetivo, el alcance y la información inicial."],
        ["Cotización o acuerdo", "Se presentan términos y costos aprobados antes del pago."],
        [
          "Revisión",
          "Una persona autorizada confirma pago, documentos y autorización para comenzar.",
        ],
        [
          "Seguimiento",
          "El expediente muestra tareas y próximos pasos cuando los módulos correspondientes están activos.",
        ],
      ]),
    ],
    ["proceso", "servicio", "evaluación"],
    "How SG Solutions works",
    "A clear explanation of the journey from public exploration to an authorized service.",
    [
      paragraph("First, you explore public information and select the area related to your goal."),
      steps([
        ["Evaluation", "Your goal, scope and initial information are clarified."],
        ["Quote or agreement", "Approved terms and costs are presented before payment."],
        ["Review", "An authorized person confirms payment, documents and permission to begin."],
        [
          "Follow-up",
          "The case shows tasks and next steps when the corresponding modules are active.",
        ],
      ]),
    ],
    ["process", "service", "evaluation"],
    ["prepare-evaluation"],
  ),
  resource(
    "prepare-evaluation",
    "guide",
    "getting-started",
    "Cómo prepararte para una evaluación",
    "Organiza tu objetivo y preguntas sin enviar información sensible por canales públicos.",
    [
      steps([
        ["Define tu objetivo", "Describe qué quieres lograr y qué servicio estás explorando."],
        ["Anota preguntas", "Prioriza las dudas que requieren una conversación humana."],
        ["Identifica documentos", "Haz una lista; no cargues documentos en el sitio público."],
        ["Revisa el siguiente paso", "Usa únicamente el canal seguro que aparezca como activo."],
      ]),
    ],
    ["evaluación", "preparación", "preguntas"],
    "How to prepare for an evaluation",
    "Organize your goal and questions without sending sensitive information through public channels.",
    [
      steps([
        [
          "Define your goal",
          "Describe what you want to accomplish and which service you are exploring.",
        ],
        ["Write down questions", "Prioritize questions that require a human conversation."],
        ["Identify documents", "Make a list; do not upload documents to the public website."],
        ["Review the next step", "Use only the secure channel shown as active."],
      ]),
    ],
    ["evaluation", "preparation", "questions"],
    ["evaluation-checklist", "how-sg-works"],
  ),
  resource(
    "prepare-documents",
    "guide",
    "documents",
    "Cómo preparar documentos de forma segura",
    "Reúne archivos legibles y espera una solicitud segura antes de transmitir información sensible.",
    [
      steps([
        ["Reúne", "Ubica los archivos solicitados sin enviarlos todavía."],
        ["Revisa", "Confirma que cada archivo sea legible, completo y corresponda a la solicitud."],
        ["Verifica el canal", "Usa el portal privado o enlace seguro indicado por SG Solutions."],
        [
          "Confirma recepción",
          "Conserva el estado o comprobante mostrado por el flujo autorizado.",
        ],
      ]),
    ],
    ["documentos", "seguridad", "portal"],
    "How to prepare documents securely",
    "Gather readable files and wait for a secure request before transmitting sensitive information.",
    [
      steps([
        ["Gather", "Locate the requested files without sending them yet."],
        ["Review", "Confirm each file is readable, complete and responsive to the request."],
        ["Verify the channel", "Use the private portal or secure link identified by SG Solutions."],
        ["Confirm receipt", "Keep the status or confirmation shown by the authorized flow."],
      ]),
    ],
    ["documents", "security", "portal"],
    ["secure-documents-checklist"],
  ),
  resource(
    "evaluation-checklist",
    "checklist",
    "getting-started",
    "Lista para tu evaluación",
    "Una lista breve para llegar a la primera conversación con un objetivo y preguntas claras.",
    [
      list([
        "Objetivo principal",
        "Servicio que deseas explorar",
        "Preguntas prioritarias",
        "Lista de documentos disponibles",
        "Disponibilidad general para una cita",
      ]),
    ],
    ["lista", "evaluación", "objetivo"],
    "Evaluation checklist",
    "A short checklist for arriving at the first conversation with a clear goal and questions.",
    [
      list([
        "Primary goal",
        "Service you want to explore",
        "Priority questions",
        "List of available documents",
        "General availability for an appointment",
      ]),
    ],
    ["checklist", "evaluation", "goal"],
    ["prepare-evaluation"],
  ),
  resource(
    "secure-documents-checklist",
    "checklist",
    "documents",
    "Lista para documentos seguros",
    "Comprueba el archivo y el canal antes de compartir información personal o financiera.",
    [
      list([
        "Solicitud verificada",
        "Archivo legible y completo",
        "Extensión original",
        "Sin ejecutables ni archivos desconocidos",
        "Portal o enlace seguro",
        "Confirmación de recepción",
      ]),
    ],
    ["lista", "documentos", "seguridad"],
    "Secure document checklist",
    "Check the file and channel before sharing personal or financial information.",
    [
      list([
        "Verified request",
        "Readable and complete file",
        "Original extension",
        "No executables or unknown files",
        "Private portal or secure link",
        "Receipt confirmation",
      ]),
    ],
    ["checklist", "documents", "security"],
    ["prepare-documents"],
  ),
  glossary(
    "apr",
    "APR",
    "Tasa porcentual anual usada para expresar ciertos costos del crédito de forma anual; su cálculo depende del producto y divulgación.",
    ["APR", "crédito"],
    "APR",
    "Annual percentage rate used to express certain credit costs on an annual basis; its calculation depends on the product and disclosure.",
    ["APR", "credit"],
  ),
  glossary(
    "dti",
    "DTI",
    "Relación entre pagos mensuales de deuda e ingreso mensual bruto; los prestamistas pueden calcularla y aplicarla de manera distinta.",
    ["DTI", "deuda"],
    "DTI",
    "Ratio of monthly debt payments to gross monthly income; lenders may calculate and apply it differently.",
    ["DTI", "debt"],
  ),
  glossary(
    "ein",
    "EIN",
    "Número de identificación asignado por el IRS a determinadas entidades o actividades; no crea por sí solo una empresa.",
    ["EIN", "IRS"],
    "EIN",
    "Identification number assigned by the IRS to certain entities or activities; it does not create a business by itself.",
    ["EIN", "IRS"],
  ),
  glossary(
    "fcra",
    "FCRA",
    "Ley federal relacionada con información de crédito del consumidor; una definición general no sustituye una interpretación jurídica.",
    ["FCRA", "crédito"],
    "FCRA",
    "Federal law related to consumer credit information; a general definition does not replace legal interpretation.",
    ["FCRA", "credit"],
  ),
  glossary(
    "charge-off",
    "Charge-off",
    "Clasificación contable de una deuda por parte del acreedor; no significa automáticamente que la obligación dejó de existir.",
    ["charge-off", "deuda"],
    "Charge-off",
    "An accounting classification of a debt by the creditor; it does not automatically mean the obligation ceased to exist.",
    ["charge-off", "debt"],
  ),
  glossary(
    "tradeline",
    "Tradeline",
    "Registro de una cuenta de crédito en un reporte; su presencia no garantiza un score o resultado específico.",
    ["tradeline", "reporte"],
    "Tradeline",
    "Record of a credit account on a report; its presence does not guarantee a particular score or outcome.",
    ["tradeline", "report"],
  ),
  glossary(
    "registered-agent",
    "Registered agent",
    "Persona o entidad designada para recibir determinadas comunicaciones oficiales de una empresa conforme a reglas estatales.",
    ["registered agent", "empresa"],
    "Registered agent",
    "Person or entity designated to receive certain official communications for a business under state rules.",
    ["registered agent", "business"],
  ),
  glossary(
    "escrow",
    "Escrow",
    "Acuerdo en el que dinero o documentos se mantienen y liberan según condiciones definidas; el uso exacto depende de la transacción.",
    ["escrow", "vivienda"],
    "Escrow",
    "Arrangement in which money or documents are held and released under defined conditions; exact use depends on the transaction.",
    ["escrow", "housing"],
  ),
  glossary(
    "schedule-c",
    "Schedule C",
    "Formulario federal usado generalmente para reportar ingresos o pérdidas de ciertos negocios operados por una persona.",
    ["Schedule C", "taxes"],
    "Schedule C",
    "Federal form generally used to report income or loss from certain businesses operated by an individual.",
    ["Schedule C", "taxes"],
  ),
  glossary(
    "underwriting",
    "Underwriting",
    "Proceso mediante el cual un proveedor evalúa información y riesgo para decidir sobre un producto; SG Solutions no controla esa decisión.",
    ["underwriting", "aprobación"],
    "Underwriting",
    "Process through which a provider evaluates information and risk to decide on a product; SG Solutions does not control that decision.",
    ["underwriting", "approval"],
  ),
  {
    key: "usda-housing-navigation",
    type: "program",
    category: "home-buying",
    es: {
      title: "Cómo orientarte entre programas de vivienda USDA",
      summary:
        "USDA Rural Development mantiene programas Direct y Guaranteed con canales y requisitos distintos.",
      blocks: [
        paragraph(
          "Direct y Guaranteed no son el mismo proceso. La información oficial de USDA identifica quién administra la solicitud, la elegibilidad general y las herramientas vigentes.",
        ),
        callout(
          "Verifica antes de actuar",
          "Las reglas, límites, disponibilidad y elegibilidad pueden cambiar. Consulta la fuente oficial y un profesional autorizado para tu situación.",
        ),
      ],
      keywords: ["USDA", "Direct", "Guaranteed", "vivienda"],
      disclosure:
        "SG Solutions no es USDA ni un prestamista y no determina elegibilidad o aprobación.",
    },
    en: {
      title: "How to navigate USDA housing programs",
      summary:
        "USDA Rural Development maintains Direct and Guaranteed programs with different channels and requirements.",
      blocks: [
        paragraph(
          "Direct and Guaranteed are not the same process. Official USDA information identifies who handles the application, general eligibility and current tools.",
        ),
        callout(
          "Verify before acting",
          "Rules, limits, availability and eligibility can change. Consult the official source and an authorized professional for your situation.",
        ),
      ],
      keywords: ["USDA", "Direct", "Guaranteed", "housing"],
      disclosure:
        "SG Solutions is not USDA or a lender and does not determine eligibility or approval.",
    },
    riskLevel: "medium",
    jurisdiction: "United States",
    nextReviewAt: "2026-09-08",
    sources: [
      {
        title: "Single Family Housing Direct Home Loans",
        authority: "USDA Rural Development",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-direct-home-loans",
        retrievedAt: "2026-08-08",
      },
      {
        title: "Single Family Housing Guaranteed Loan Program",
        authority: "USDA Rural Development",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program",
        retrievedAt: "2026-08-08",
      },
    ],
  },
];

export const HELP_RESOURCE_CONTENT: KnowledgeRecord[] = RESOURCE_SEEDS.flatMap((seed) => [
  makeResourceRecord(seed, "es"),
  makeResourceRecord(seed, "en"),
]);

function resource(
  key: string,
  type: Exclude<KnowledgeType, "faq" | "program">,
  category: HelpCategoryId,
  esTitle: string,
  esSummary: string,
  esBlocks: KnowledgeBlock[],
  esKeywords: string[],
  enTitle: string,
  enSummary: string,
  enBlocks: KnowledgeBlock[],
  enKeywords: string[],
  relatedKeys: string[] = [],
): ResourceSeed {
  return {
    key,
    type,
    category,
    es: {
      title: esTitle,
      summary: esSummary,
      blocks: esBlocks,
      keywords: esKeywords,
      disclosure: GENERAL_ES,
    },
    en: {
      title: enTitle,
      summary: enSummary,
      blocks: enBlocks,
      keywords: enKeywords,
      disclosure: GENERAL_EN,
    },
    relatedKeys,
  };
}

function glossary(
  key: string,
  esTitle: string,
  esDefinition: string,
  esKeywords: string[],
  enTitle: string,
  enDefinition: string,
  enKeywords: string[],
): ResourceSeed {
  return resource(
    key,
    "glossary",
    glossaryCategory(key),
    esTitle,
    esDefinition,
    [paragraph(esDefinition)],
    esKeywords,
    enTitle,
    enDefinition,
    [paragraph(enDefinition)],
    enKeywords,
  );
}

function makeResourceRecord(seed: ResourceSeed, locale: "es" | "en"): KnowledgeRecord {
  const copy = seed[locale];
  return {
    id: `resource-${seed.key}-${locale}`,
    translationGroupId: `resource-${seed.key}`,
    locale,
    type: seed.type,
    category: seed.category,
    slug: seed.key,
    title: copy.title,
    summary: copy.summary,
    blocks: copy.blocks,
    keywords: copy.keywords,
    audiences: ["public", "ai_public"],
    status: "published",
    version: 1,
    riskLevel: seed.riskLevel ?? "low",
    reviewedAt: "2026-08-08",
    nextReviewAt: seed.nextReviewAt ?? "2027-02-08",
    relatedIds: (seed.relatedKeys ?? []).map((key) => `resource-${key}-${locale}`),
    disclosure: copy.disclosure,
    seoTitle: `${copy.title} | SG Solutions`,
    seoDescription: `${copy.summary} ${locale === "es" ? "Información general de SG Solutions." : "General information from SG Solutions."}`,
    sources: seed.sources,
    jurisdiction: seed.jurisdiction,
    readingMinutes: estimateReadingMinutes(copy.blocks),
    publishedAt: "2026-08-08",
  };
}

function glossaryCategory(key: string): HelpCategoryId {
  if (["ein", "registered-agent"].includes(key)) return "business-formation";
  if (["apr", "fcra", "charge-off", "tradeline"].includes(key)) return "credit";
  if (key === "schedule-c") return "taxes";
  if (["dti", "escrow", "underwriting"].includes(key)) return "home-buying";
  return "getting-started";
}

function paragraph(text: string): KnowledgeBlock {
  return { type: "paragraph", text };
}

function list(items: string[]): KnowledgeBlock {
  return { type: "list", items };
}

function steps(items: Array<[string, string]>): KnowledgeBlock {
  return { type: "steps", items: items.map(([title, text]) => ({ title, text })) };
}

function callout(title: string, text: string): KnowledgeBlock {
  return { type: "callout", tone: "caution", title, text };
}

function estimateReadingMinutes(blocks: KnowledgeBlock[]): number {
  const words = JSON.stringify(blocks).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
