import type { Locale } from "../../domain/public-site";

type LocalizedSlugs = Record<Locale, string>;

/**
 * Published Help Center slugs are an explicit compatibility contract. Editing visible copy must
 * never rename a public URL implicitly; intentional route changes require an approved redirect.
 */
const HELP_SLUGS: Record<string, LocalizedSlugs> = {
  "faq-what-is-sg": { es: "que-es-sg-solutions", en: "what-is-sg-solutions" },
  "faq-services-offered": { es: "que-servicios-ofrecen", en: "what-services-do-you-offer" },
  "faq-spanish-support": { es: "atienden-en-espanol", en: "do-you-provide-service-in-spanish" },
  "faq-how-to-start": { es: "como-comienzo", en: "how-do-i-get-started" },
  "faq-account-required": { es: "necesito-crear-una-cuenta", en: "do-i-need-to-create-an-account" },
  "faq-schedule-appointment": {
    es: "como-agendo-una-cita",
    en: "how-do-i-schedule-an-appointment",
  },
  "faq-contact-person": { es: "como-contacto-a-una-persona", en: "how-do-i-contact-a-person" },
  "faq-how-to-pay": { es: "como-pago", en: "how-do-i-pay" },
  "faq-payment-methods": { es: "que-metodos-aceptan", en: "what-payment-methods-do-you-accept" },
  "faq-payment-starts-service": {
    es: "pagar-inicia-automaticamente-el-servicio",
    en: "does-payment-automatically-start-the-service",
  },
  "faq-where-is-receipt": { es: "donde-veo-mi-recibo", en: "where-can-i-find-my-receipt" },
  "faq-request-refund": { es: "como-solicito-un-reembolso", en: "how-do-i-request-a-refund" },
  "faq-payment-failed": {
    es: "que-sucede-si-el-pago-falla",
    en: "what-happens-if-a-payment-fails",
  },
  "faq-upload-documents": { es: "como-subo-documentos", en: "how-do-i-upload-documents" },
  "faq-document-formats": { es: "que-formatos-aceptan", en: "what-file-formats-do-you-accept" },
  "faq-protect-information": {
    es: "como-protegen-mi-informacion",
    en: "how-do-you-protect-my-information",
  },
  "faq-document-received": {
    es: "como-se-si-recibieron-un-documento",
    en: "how-do-i-know-whether-a-document-was-received",
  },
  "faq-delete-document": { es: "puedo-eliminar-un-documento", en: "can-i-delete-a-document" },
  "faq-remove-any-negative": {
    es: "pueden-eliminar-cualquier-cuenta-negativa",
    en: "can-you-remove-any-negative-account",
  },
  "faq-score-guarantee": {
    es: "garantizan-aumento-del-score",
    en: "do-you-guarantee-a-score-increase",
  },
  "faq-what-is-dispute": { es: "que-es-una-disputa", en: "what-is-a-dispute" },
  "faq-what-is-utilization": { es: "que-es-utilizacion", en: "what-is-utilization" },
  "faq-credit-report-needed": { es: "necesito-un-reporte", en: "do-i-need-a-credit-report" },
  "faq-what-is-identityiq": { es: "que-es-identityiq", en: "what-is-identityiq" },
  "faq-what-is-tradeline": { es: "que-es-una-tradeline", en: "what-is-a-tradeline" },
  "faq-tradeline-how-work": {
    es: "como-funcionan-las-tradelines-de-usuario-autorizado",
    en: "how-do-authorized-user-tradelines-work",
  },
  "faq-tradeline-authorized-user": {
    es: "que-significa-ser-usuario-autorizado",
    en: "what-does-authorized-user-mean",
  },
  "faq-seasoned-tradeline": {
    es: "que-es-una-tradeline-con-antiguedad",
    en: "what-is-a-seasoned-tradeline",
  },
  "faq-tradeline-risk": {
    es: "una-tradeline-puede-perjudicar-mi-credito",
    en: "can-a-tradeline-hurt-my-credit",
  },
  "faq-tradeline-age-limit": {
    es: "que-importa-mas-la-antiguedad-o-el-limite",
    en: "what-matters-more-account-age-or-credit-limit",
  },
  "faq-tradeline-quantity": {
    es: "cuantas-tradelines-necesito",
    en: "how-many-tradelines-do-i-need",
  },
  "faq-tradeline-bureaus": {
    es: "una-tradeline-aparece-en-los-tres-buros",
    en: "will-a-tradeline-appear-at-all-three-bureaus",
  },
  "faq-tradeline-freeze-alert": {
    es: "una-alerta-de-fraude-o-congelamiento-puede-afectar-el-reporte",
    en: "can-a-fraud-alert-or-credit-freeze-affect-reporting",
  },
  "faq-tradeline-duration": {
    es: "cuanto-tiempo-permanece-una-tradeline-en-el-reporte",
    en: "how-long-does-a-tradeline-stay-on-a-credit-report",
  },
  "faq-tradeline-guarantee": {
    es: "una-tradeline-garantiza-un-score-o-una-aprobacion",
    en: "does-a-tradeline-guarantee-a-score-or-approval",
  },
  "faq-tax-documents": {
    es: "que-documentos-necesito-para-taxes",
    en: "what-tax-documents-do-i-need",
  },
  "faq-w2-1099": { es: "trabajan-con-w-2-y-1099", en: "do-you-work-with-w-2-and-1099-forms" },
  "faq-schedule-c": { es: "preparan-schedule-c", en: "do-you-prepare-schedule-c" },
  "faq-refund-guarantee": { es: "garantizan-refund", en: "do-you-guarantee-a-refund" },
  "faq-tax-signature": { es: "como-firmo", en: "how-do-i-sign" },
  "faq-return-accepted": {
    es: "como-se-si-mi-return-fue-aceptado",
    en: "how-do-i-know-whether-my-return-was-accepted",
  },
  "faq-what-is-llc": { es: "que-es-una-llc", en: "what-is-an-llc" },
  "faq-registered-agent": { es: "que-es-un-registered-agent", en: "what-is-a-registered-agent" },
  "faq-what-is-ein": { es: "que-es-un-ein", en: "what-is-an-ein" },
  "faq-formation-time": { es: "cuanto-tarda", en: "how-long-does-it-take" },
  "faq-state-fee": {
    es: "el-precio-incluye-la-tarifa-estatal",
    en: "does-the-price-include-the-state-fee",
  },
  "faq-payment-files-immediately": {
    es: "pagar-significa-que-se-presenta-inmediatamente",
    en: "does-payment-mean-the-filing-happens-immediately",
  },
  "faq-operating-agreement": {
    es: "necesito-operating-agreement",
    en: "do-i-need-an-operating-agreement",
  },
  "faq-funding-guarantee": {
    es: "garantizan-aprobacion-business-funding",
    en: "do-you-guarantee-approval-business-funding",
  },
  "faq-fundability": { es: "que-es-fundability", en: "what-is-fundability" },
  "faq-funding-documents": {
    es: "que-documentos-necesito-para-financiamiento-empresarial",
    en: "what-business-funding-documents-do-i-need",
  },
  "faq-what-is-sba": { es: "que-es-sba", en: "what-is-the-sba" },
  "faq-what-is-dscr": { es: "que-es-dscr", en: "what-is-dscr" },
  "faq-does-sg-lend": { es: "sg-solutions-presta-dinero", en: "does-sg-solutions-lend-money" },
  "faq-usda-direct": { es: "que-es-usda-direct", en: "what-is-usda-direct" },
  "faq-usda-guaranteed": { es: "que-es-usda-guaranteed", en: "what-is-usda-guaranteed" },
  "faq-fha-difference": { es: "que-diferencia-hay-con-fha", en: "how-is-it-different-from-fha" },
  "faq-what-is-dti": { es: "que-es-dti", en: "what-is-dti" },
  "faq-rural-eligibility": {
    es: "que-significa-elegibilidad-rural",
    en: "what-does-rural-eligibility-mean",
  },
  "faq-home-approval-guarantee": {
    es: "garantizan-aprobacion-comprar-casa",
    en: "do-you-guarantee-approval-home-buying",
  },
  "faq-is-sg-lender": { es: "sg-solutions-es-un-lender", en: "is-sg-solutions-a-lender" },
  "faq-home-documents": {
    es: "que-documentos-necesito-para-comprar-casa",
    en: "what-home-buying-documents-do-i-need",
  },
  "faq-marketplace-ownership": {
    es: "los-productos-son-de-sg-solutions",
    en: "are-the-products-offered-by-sg-solutions",
  },
  "faq-marketplace-commission": { es: "reciben-comision", en: "do-you-receive-a-commission" },
  "faq-recommendation-guarantee": {
    es: "una-recomendacion-garantiza-aprobacion",
    en: "does-a-recommendation-guarantee-approval",
  },
  "faq-marketplace-data": { es: "como-protegen-mis-datos", en: "how-do-you-protect-my-data" },
  "faq-share-with-partners": {
    es: "se-comparte-mi-informacion-con-partners",
    en: "is-my-information-shared-with-partners",
  },
  "resource-how-sg-works": { es: "como-funciona-sg-solutions", en: "how-sg-solutions-works" },
  "resource-prepare-evaluation": {
    es: "como-prepararte-para-una-evaluacion",
    en: "how-to-prepare-for-an-evaluation",
  },
  "resource-prepare-documents": {
    es: "como-preparar-documentos-de-forma-segura",
    en: "how-to-prepare-documents-securely",
  },
  "resource-evaluation-checklist": { es: "lista-para-tu-evaluacion", en: "evaluation-checklist" },
  "resource-secure-documents-checklist": {
    es: "lista-para-documentos-seguros",
    en: "secure-document-checklist",
  },
  "resource-apr": { es: "apr", en: "apr" },
  "resource-dti": { es: "dti", en: "dti" },
  "resource-ein": { es: "ein", en: "ein" },
  "resource-fcra": { es: "fcra", en: "fcra" },
  "resource-charge-off": { es: "charge-off", en: "charge-off" },
  "resource-tradeline": { es: "tradeline", en: "tradeline" },
  "resource-registered-agent": { es: "registered-agent", en: "registered-agent" },
  "resource-escrow": { es: "escrow", en: "escrow" },
  "resource-schedule-c": { es: "schedule-c", en: "schedule-c" },
  "resource-underwriting": { es: "underwriting", en: "underwriting" },
  "resource-usda-housing-navigation": {
    es: "como-orientarte-entre-programas-de-vivienda-usda",
    en: "how-to-navigate-usda-housing-programs",
  },
};

export function getStableHelpSlug(translationGroupId: string, locale: Locale): string {
  const slug = HELP_SLUGS[translationGroupId]?.[locale];
  if (!slug) throw new Error(`Missing stable help slug: ${translationGroupId}:${locale}`);
  return slug;
}
