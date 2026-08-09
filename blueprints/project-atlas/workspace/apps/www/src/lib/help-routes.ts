import { getCollectionCopy } from "../content/help-center/categories";
import type { HelpCategoryId, KnowledgeRecord, KnowledgeType } from "../domain/help-center";
import type { Locale } from "../domain/public-site";
import { toPublicKnowledge } from "./help-content";

const CATEGORY_SEGMENTS: Record<Locale, Record<HelpCategoryId, string>> = {
  es: {
    "getting-started": "primeros-pasos",
    "account-access": "cuenta-y-acceso",
    payments: "pagos-y-facturacion",
    appointments: "citas",
    documents: "documentos",
    credit: "credito",
    "credit-monitoring": "monitoreo-de-credito",
    tradelines: "tradelines",
    taxes: "taxes",
    "business-formation": "formacion-empresarial",
    ein: "ein",
    "business-funding": "financiamiento-empresarial",
    "home-buying": "comprar-casa",
    marketplace: "marketplace",
    "privacy-security": "privacidad-y-seguridad",
    "contact-support": "contacto-y-soporte",
  },
  en: {
    "getting-started": "getting-started",
    "account-access": "account-and-access",
    payments: "payments-and-billing",
    appointments: "appointments",
    documents: "documents",
    credit: "credit",
    "credit-monitoring": "credit-monitoring",
    tradelines: "tradelines",
    taxes: "taxes",
    "business-formation": "business-formation",
    ein: "ein",
    "business-funding": "business-funding",
    "home-buying": "home-buying",
    marketplace: "marketplace",
    "privacy-security": "privacy-and-security",
    "contact-support": "contact-and-support",
  },
};

export const HELP_LEGACY_REDIRECTS = {
  "/preguntas-frecuentes/": "/recursos/preguntas-frecuentes/",
  "/en/faq/": "/en/resources/faq/",
} as const;

export function getHelpHubPath(locale: Locale): string {
  return locale === "es" ? "/recursos/" : "/en/resources/";
}

export function getHelpSearchPath(locale: Locale): string {
  return locale === "es" ? "/recursos/buscar/" : "/en/resources/search/";
}

export function getHelpCollectionPath(locale: Locale, type: KnowledgeType): string {
  return `${getHelpHubPath(locale)}${getCollectionCopy(locale, type).pathSegment}/`;
}

export function getHelpCollectionSegment(locale: Locale, type: KnowledgeType): string {
  return getCollectionCopy(locale, type).pathSegment;
}

export function getHelpCategoryPath(locale: Locale, category: HelpCategoryId): string {
  const base = locale === "es" ? "/recursos/categorias/" : "/en/resources/categories/";
  return `${base}${getHelpCategorySegment(locale, category)}/`;
}

export function getHelpCategorySegment(locale: Locale, category: HelpCategoryId): string {
  return CATEGORY_SEGMENTS[locale][category];
}

export function getHelpDetailPath(locale: Locale, type: KnowledgeType, slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid help slug: ${slug}`);
  return `${getHelpCollectionPath(locale, type)}${slug}/`;
}

type TranslatableKnowledgeRecord = Pick<
  KnowledgeRecord,
  | "id"
  | "translationGroupId"
  | "locale"
  | "type"
  | "slug"
  | "category"
  | "riskLevel"
  | "requiredForLaunch"
>;

export function getHelpAlternatePath(
  record: TranslatableKnowledgeRecord,
  records: KnowledgeRecord[],
  at: Date = new Date(),
): string {
  const alternateLocale = record.locale === "es" ? "en" : "es";
  const pair = records.find(
    (candidate) =>
      candidate.translationGroupId === record.translationGroupId &&
      candidate.locale === alternateLocale &&
      candidate.type === record.type,
  );
  if (pair && toPublicKnowledge(pair, at)) {
    return getHelpDetailPath(pair.locale, pair.type, pair.slug);
  }
  throw new Error(`Missing public ${alternateLocale} translation for ${record.id}`);
}
