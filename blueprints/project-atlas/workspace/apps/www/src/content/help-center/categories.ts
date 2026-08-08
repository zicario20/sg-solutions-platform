import type { HelpCategoryId, KnowledgeType } from "../../domain/help-center";
import type { Locale } from "../../domain/public-site";

interface LocalizedLabel {
  title: string;
  description: string;
}

export interface HelpCategoryDefinition {
  id: HelpCategoryId;
  es: LocalizedLabel;
  en: LocalizedLabel;
}

export interface HelpCollectionDefinition {
  type: KnowledgeType;
  es: LocalizedLabel & { pathSegment: string };
  en: LocalizedLabel & { pathSegment: string };
}

export const HELP_CATEGORIES: HelpCategoryDefinition[] = [
  category("getting-started", "Empezar con SG Solutions", "Cómo funciona el primer paso y qué esperar.", "Getting started", "How the first step works and what to expect."),
  category("account-access", "Cuenta y acceso", "Información general sobre acceso y cuenta.", "Account and access", "General information about account access."),
  category("payments", "Pagos y facturación", "Pagos, recibos y límites antes de comenzar.", "Payments and billing", "Payments, receipts and start-of-service boundaries."),
  category("appointments", "Citas", "Preparación, disponibilidad y próximos pasos.", "Appointments", "Preparation, availability and next steps."),
  category("documents", "Documentos", "Entrega segura, formatos y confirmaciones.", "Documents", "Secure delivery, formats and confirmation."),
  category("credit", "Crédito", "Conceptos generales, límites y preparación.", "Credit", "General concepts, limits and preparation."),
  category("credit-monitoring", "Monitoreo de crédito", "Información general sobre monitoreo autorizado.", "Credit monitoring", "General information about authorized monitoring."),
  category("tradelines", "Tradelines", "Qué son y qué no pueden garantizar.", "Tradelines", "What they are and what they cannot guarantee."),
  category("taxes", "Taxes", "Preparación tributaria y documentación general.", "Taxes", "Tax preparation and general documentation."),
  category("business-formation", "Formación empresarial", "LLC, estructura y preparación inicial.", "Business formation", "LLCs, structure and initial preparation."),
  category("ein", "EIN", "Información general sobre identificación empresarial.", "EIN", "General business identification information."),
  category("business-funding", "Business Funding", "Preparación financiera y opciones de terceros.", "Business funding", "Financial preparation and third-party options."),
  category("home-buying", "Comprar casa", "Preparación, programas y conversación con prestamistas.", "Home buying", "Preparation, programs and lender conversations."),
  category("marketplace", "Marketplace financiero", "Productos de partners y divulgaciones.", "Financial marketplace", "Partner products and disclosures."),
  category("privacy-security", "Privacidad y seguridad", "Cómo se limita y protege la información.", "Privacy and security", "How information is limited and protected."),
  category("contact-support", "Contacto y soporte", "Cuándo hablar con una persona.", "Contact and support", "When to speak with a person."),
];

export const HELP_COLLECTIONS: HelpCollectionDefinition[] = [
  collection("faq", "Preguntas frecuentes", "Respuestas breves para comenzar con claridad.", "preguntas-frecuentes", "Frequently asked questions", "Short answers for a clear start.", "faq"),
  collection("article", "Artículos", "Explicaciones generales y revisadas.", "articulos", "Articles", "Reviewed general explanations.", "articles"),
  collection("guide", "Guías", "Pasos para prepararte sin sustituir una evaluación.", "guias", "Guides", "Preparation steps that do not replace an evaluation.", "guides"),
  collection("checklist", "Listas", "Recordatorios prácticos y accesibles.", "listas", "Checklists", "Practical, accessible reminders.", "checklists"),
  collection("glossary", "Glosario", "Términos financieros y empresariales en lenguaje claro.", "glosario", "Glossary", "Financial and business terms in plain language.", "glossary"),
  collection("program", "Programas", "Fuentes oficiales y límites de elegibilidad.", "programas", "Programs", "Official sources and eligibility limits.", "programs"),
];

export function getCategoryCopy(locale: Locale, id: HelpCategoryId): LocalizedLabel {
  const category = HELP_CATEGORIES.find((entry) => entry.id === id);
  if (!category) throw new Error(`Unknown help category: ${id}`);
  return category[locale];
}

export function getCollectionCopy(locale: Locale, type: KnowledgeType) {
  const collection = HELP_COLLECTIONS.find((entry) => entry.type === type);
  if (!collection) throw new Error(`Unknown help collection: ${type}`);
  return collection[locale];
}

function category(
  id: HelpCategoryId,
  esTitle: string,
  esDescription: string,
  enTitle: string,
  enDescription: string,
): HelpCategoryDefinition {
  return { id, es: { title: esTitle, description: esDescription }, en: { title: enTitle, description: enDescription } };
}

function collection(
  type: KnowledgeType,
  esTitle: string,
  esDescription: string,
  esPathSegment: string,
  enTitle: string,
  enDescription: string,
  enPathSegment: string,
): HelpCollectionDefinition {
  return {
    type,
    es: { title: esTitle, description: esDescription, pathSegment: esPathSegment },
    en: { title: enTitle, description: enDescription, pathSegment: enPathSegment },
  };
}
