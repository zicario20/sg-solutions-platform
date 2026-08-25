import type { ComplianceObligation } from "./contracts.ts";

export function toClientComplianceSummary(input: {
  obligations: readonly ComplianceObligation[];
  locale: "en" | "es";
}) {
  const actionable = input.obligations.filter((obligation) =>
    ["action_required", "client_action_required", "overdue"].includes(obligation.status),
  );
  const next = [...input.obligations]
    .filter((obligation) => obligation.status !== "completed" && obligation.status !== "superseded")
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
  const health = actionable.some((obligation) => obligation.status === "overdue")
    ? "attention_needed"
    : actionable.length > 0
      ? "action_needed"
      : next
        ? "monitoring"
        : "review_required";
  return {
    health,
    healthLabel:
      input.locale === "es"
        ? health === "attention_needed"
          ? "Necesita atención"
          : health === "action_needed"
            ? "Acción necesaria"
            : health === "monitoring"
              ? "En monitoreo"
              : "Revisión necesaria"
        : health === "attention_needed"
          ? "Needs attention"
          : health === "action_needed"
            ? "Action needed"
            : health === "monitoring"
              ? "Monitoring"
              : "Review needed",
    openObligationCount: input.obligations.filter(
      (obligation) => obligation.status !== "completed" && obligation.status !== "superseded",
    ).length,
    nextDueDate: next?.dueDate,
    statement:
      input.locale === "es"
        ? "Este resumen no es una conclusión legal y se basa en requisitos actualmente verificados."
        : "This summary is not a legal conclusion and is based on currently verified requirements.",
  } as const;
}
