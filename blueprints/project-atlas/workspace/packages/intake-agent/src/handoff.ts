import type { IntakeSpecialistHandoff } from "./contracts.js";

export function createIntakeSpecialistHandoff(input: {
  readonly intakeSessionId: string;
  readonly target: IntakeSpecialistHandoff["target"];
  readonly locale: "en" | "es";
  readonly participantReferences: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly documentReferences: readonly string[];
  readonly consentReferences: readonly string[];
  readonly readinessSnapshotReference: string;
  readonly openUnknowns: readonly string[];
  readonly createdAt?: string;
}): IntakeSpecialistHandoff {
  const sourceReferences = [...new Set(input.sourceReferences)].filter(
    (reference) => reference.startsWith("answer:") || reference.startsWith("normalized:"),
  );
  return {
    id: "intake-handoff:" + input.intakeSessionId + ":" + input.target,
    intakeSessionId: input.intakeSessionId,
    target: input.target,
    locale: input.locale,
    participantReferences: [...new Set(input.participantReferences)],
    allowedDataReferences: sourceReferences,
    documentReferences: [...new Set(input.documentReferences)],
    consentReferences: [...new Set(input.consentReferences)],
    readinessSnapshotReference: input.readinessSnapshotReference,
    openUnknowns: [...new Set(input.openUnknowns)],
    sourceReferences,
    status: "prepared",
    dispatchPermitted: false,
    executionPermitted: false,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
