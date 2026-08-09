import type { PublicKnowledgeRecord } from "../domain/help-center";
import type { Locale } from "../domain/public-site";

export interface ProviderDisclosureCopy {
  label: string;
  notice: string;
}

const PROVIDER_DISCLOSURE: Record<Locale, ProviderDisclosureCopy> = {
  es: {
    label: "Fuente del proveedor externo: Tradeline Supply",
    notice:
      "Esta referencia explica información publicada por Tradeline Supply. Su inclusión no implica asociación, recomendación ni garantía de SG Solutions.",
  },
  en: {
    label: "External provider source: Tradeline Supply",
    notice:
      "This reference explains information published by Tradeline Supply. Its inclusion does not imply an SG Solutions partnership, endorsement or guarantee.",
  },
};

export function getProviderDisclosureCopy(locale: Locale): ProviderDisclosureCopy {
  return PROVIDER_DISCLOSURE[locale];
}

export function hasExternalProviderSource(record: Pick<PublicKnowledgeRecord, "sources">): boolean {
  return record.sources?.some((source) => source.sourceKind === "provider") ?? false;
}
