import type { EinCase, EinIssuanceRecord } from "./contracts.ts";
import { clientEinStatusLabel } from "./service.ts";

export function toClientEinSummary(input: {
  einCase: EinCase;
  issuance?: EinIssuanceRecord;
  locale: "en" | "es";
}) {
  const nextStep = input.issuance
    ? input.locale === "es"
      ? "Revisa tus documentos finales en el portal seguro."
      : "Review your final documents in the secure portal."
    : input.locale === "es"
      ? "Mantén tu información actualizada; el equipo te avisará si necesita algo."
      : "Keep your information current; our team will let you know if anything is needed.";
  return {
    caseReference: input.einCase.caseNumber,
    status: clientEinStatusLabel(input.einCase.status, input.locale),
    nextStep,
    issuanceVerified: input.issuance?.verificationStatus === "verified",
    fullEinAvailable: false,
  } as const;
}
