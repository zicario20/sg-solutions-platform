import type { FundingCase, FundingMatchCandidate, FundingReadinessDimension } from "./contracts.ts";

export type FundingLocale = "es" | "en";

export type ClientFundingSummary = Readonly<{
  caseReference: string;
  status: string;
  nextStep: string;
  readiness: readonly Readonly<{ dimension: string; status: string; action: string }>[];
  matches: readonly Readonly<{ matchBand: string; explanation: string; providerName: null }>[];
  disclaimer: string;
}>;

const labels: Readonly<Record<FundingLocale, Readonly<Record<FundingCase["status"], string>>>> = {
  es: {
    draft: "Preparación inicial",
    intake_pending: "Información pendiente",
    profile_review: "Revisión del perfil",
    documents_pending: "Documentos pendientes",
    financial_review: "Revisión financiera",
    readiness_review: "Revisión de preparación",
    client_action_required: "Acción requerida",
    product_matching: "Opciones en revisión",
    package_preparation: "Preparando información",
    ready_for_referral: "Listo para revisión de referencia",
    referred: "Conectado con un proveedor",
    application_in_progress: "Proceso con proveedor",
    offers_available: "Opciones disponibles",
    decision_pending: "Decisión pendiente",
    funded: "Financiamiento confirmado",
    declined: "Resultado informado por proveedor",
    paused: "En pausa",
    cancelled: "Cancelado",
    completed: "Completado",
    archived: "Archivado",
  },
  en: {
    draft: "Initial preparation",
    intake_pending: "Information needed",
    profile_review: "Profile review",
    documents_pending: "Documents needed",
    financial_review: "Financial review",
    readiness_review: "Readiness review",
    client_action_required: "Action needed",
    product_matching: "Options under review",
    package_preparation: "Preparing information",
    ready_for_referral: "Ready for referral review",
    referred: "Connected with a provider",
    application_in_progress: "Provider process",
    offers_available: "Options available",
    decision_pending: "Decision pending",
    funded: "Funding confirmed",
    declined: "Provider result received",
    paused: "Paused",
    cancelled: "Cancelled",
    completed: "Completed",
    archived: "Archived",
  },
};

export const toClientFundingSummary = (
  input: Readonly<{
    fundingCase: FundingCase;
    readiness: readonly FundingReadinessDimension[];
    matches: readonly FundingMatchCandidate[];
    locale: FundingLocale;
  }>,
): ClientFundingSummary => ({
  caseReference: input.fundingCase.caseNumber,
  status: labels[input.locale][input.fundingCase.status],
  nextStep:
    input.fundingCase.status === "client_action_required"
      ? input.locale === "es"
        ? "Revisa las acciones solicitadas para continuar."
        : "Review the requested actions to continue."
      : input.locale === "es"
        ? "SG Solutions te avisará cuando haya un próximo paso confirmado."
        : "SG Solutions will notify you when a next confirmed step is available.",
  readiness: input.readiness.map((dimension) => ({
    dimension: dimension.dimensionCode.replaceAll("_", " "),
    status: dimension.status.replaceAll("_", " "),
    action:
      dimension.recommendedActions[0] ??
      (input.locale === "es" ? "Sin acción pendiente" : "No action pending"),
  })),
  matches: input.matches
    .filter((candidate) => candidate.matchBand !== "not_matched")
    .map((candidate) => ({
      matchBand: candidate.matchBand.replaceAll("_", " "),
      explanation: candidate.explanation,
      providerName: null,
    })),
  disclaimer:
    input.locale === "es"
      ? "Las opciones potenciales no son una aprobación, oferta ni garantía. Los proveedores externos deciden requisitos, términos y resultados."
      : "Potential options are not an approval, offer, or guarantee. External providers decide requirements, terms, and outcomes.",
});
