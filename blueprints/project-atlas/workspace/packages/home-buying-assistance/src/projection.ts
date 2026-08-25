import type {
  HomebuyerCase,
  HomebuyerMatchCandidate,
  HomebuyerReadinessDimension,
} from "./contracts.ts";
export type HomebuyerLocale = "es" | "en";
export type ClientHomebuyerSummary = Readonly<{
  caseReference: string;
  status: string;
  nextStep: string;
  readiness: readonly Readonly<{ dimension: string; status: string; action: string }>[];
  potentialPrograms: readonly Readonly<{ matchBand: string; explanation: string }>[];
  disclaimer: string;
}>;
const label = (status: HomebuyerCase["status"], locale: HomebuyerLocale) => {
  const es: Record<HomebuyerCase["status"], string> = {
    draft: "Preparación inicial",
    intake_pending: "Información pendiente",
    profile_review: "Revisión del perfil",
    documents_pending: "Documentos pendientes",
    financial_review: "Revisión financiera",
    readiness_review: "Revisión de preparación",
    client_action_required: "Acción requerida",
    program_screening: "Programas en revisión",
    lender_matching: "Opciones de lender en revisión",
    referral_ready: "Listo para revisión de referencia",
    referred: "Conectado con un tercero",
    preapproval_in_progress: "Proceso con lender",
    property_search: "Búsqueda de propiedad",
    under_contract: "Bajo contrato",
    closing_preparation: "Preparación de cierre",
    closed: "Cierre verificado",
    paused: "En pausa",
    cancelled: "Cancelado",
    completed: "Completado",
    archived: "Archivado",
  };
  const en: Record<HomebuyerCase["status"], string> = {
    draft: "Initial preparation",
    intake_pending: "Information needed",
    profile_review: "Profile review",
    documents_pending: "Documents needed",
    financial_review: "Financial review",
    readiness_review: "Readiness review",
    client_action_required: "Action needed",
    program_screening: "Programs under review",
    lender_matching: "Lender options under review",
    referral_ready: "Ready for referral review",
    referred: "Connected with a third party",
    preapproval_in_progress: "Lender process",
    property_search: "Property search",
    under_contract: "Under contract",
    closing_preparation: "Closing preparation",
    closed: "Closing verified",
    paused: "Paused",
    cancelled: "Cancelled",
    completed: "Completed",
    archived: "Archived",
  };
  return locale === "es" ? es[status] : en[status];
};
export const toClientHomebuyerSummary = (
  input: Readonly<{
    homebuyerCase: HomebuyerCase;
    readiness: readonly HomebuyerReadinessDimension[];
    matches: readonly HomebuyerMatchCandidate[];
    locale: HomebuyerLocale;
  }>,
): ClientHomebuyerSummary => ({
  caseReference: input.homebuyerCase.caseNumber,
  status: label(input.homebuyerCase.status, input.locale),
  nextStep:
    input.homebuyerCase.status === "client_action_required"
      ? input.locale === "es"
        ? "Revisa las acciones solicitadas para continuar."
        : "Review the requested actions to continue."
      : input.locale === "es"
        ? "Te avisaremos cuando exista un próximo paso confirmado."
        : "We will notify you when a next confirmed step is available.",
  readiness: input.readiness.map((item) => ({
    dimension: item.code.replaceAll("_", " "),
    status: item.status.replaceAll("_", " "),
    action:
      item.recommendedActions[0] ??
      (input.locale === "es" ? "Sin acción pendiente" : "No action pending"),
  })),
  potentialPrograms: input.matches
    .filter((item) => item.matchBand !== "not_matched")
    .map((item) => ({
      matchBand: item.matchBand.replaceAll("_", " "),
      explanation: item.explanation,
    })),
  disclaimer:
    input.locale === "es"
      ? "Los programas u opciones potenciales no son una aprobación ni una garantía. Los lenders, programas y otras partes autorizadas determinan requisitos y resultados."
      : "Potential programs or options are not an approval or guarantee. Lenders, programs, and other authorized parties determine requirements and outcomes.",
});
