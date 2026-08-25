import type { FormationCase } from "./contracts.ts";

export type FormationClientLocale = "es" | "en";

export type FormationClientSummary = Readonly<{
  formationCaseRef: string;
  statusLabel: string;
  nextStepLabel: string;
  state: "awaiting_client" | "in_progress" | "completed" | "cancelled";
}>;

const awaitingClient = new Set([
  "draft",
  "intake_pending",
  "intake_in_progress",
  "formation_data_pending",
  "client_review",
  "signature_pending",
  "payment_pending",
  "state_action_required",
  "rejected",
]);

export function toClientFormationSummary(
  formationCase: FormationCase,
  locale: FormationClientLocale,
): FormationClientSummary {
  if (formationCase.status === "signature_pending") {
    return locale === "es"
      ? {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Firma pendiente",
          nextStepLabel: "Revisa y firma los documentos solicitados.",
          state: "awaiting_client",
        }
      : {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Signature required",
          nextStepLabel: "Review and sign the requested documents.",
          state: "awaiting_client",
        };
  }
  if (formationCase.status === "completed" || formationCase.status === "archived") {
    return locale === "es"
      ? {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Completado",
          nextStepLabel: "Tu proceso esta completado.",
          state: "completed",
        }
      : {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Completed",
          nextStepLabel: "Your process is complete.",
          state: "completed",
        };
  }
  if (formationCase.status === "cancelled") {
    return locale === "es"
      ? {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Cancelado",
          nextStepLabel: "Comunicate con soporte si necesitas ayuda.",
          state: "cancelled",
        }
      : {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Cancelled",
          nextStepLabel: "Contact support if you need help.",
          state: "cancelled",
        };
  }
  if (awaitingClient.has(formationCase.status)) {
    return locale === "es"
      ? {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Accion requerida",
          nextStepLabel: "Revisa la informacion o los documentos solicitados.",
          state: "awaiting_client",
        }
      : {
          formationCaseRef: formationCase.caseId,
          statusLabel: "Action required",
          nextStepLabel: "Review the requested information or documents.",
          state: "awaiting_client",
        };
  }
  return locale === "es"
    ? {
        formationCaseRef: formationCase.caseId,
        statusLabel: "En proceso",
        nextStepLabel: "Te avisaremos cuando haya una actualizacion.",
        state: "in_progress",
      }
    : {
        formationCaseRef: formationCase.caseId,
        statusLabel: "In progress",
        nextStepLabel: "We will notify you when there is an update.",
        state: "in_progress",
      };
}
