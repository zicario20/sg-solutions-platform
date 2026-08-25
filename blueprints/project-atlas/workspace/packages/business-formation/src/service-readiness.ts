export type FormationServiceReadiness = Readonly<{
  ready: boolean;
  missing: readonly string[];
}>;

export function evaluateFormationServiceReadiness(
  input: Readonly<{
    requirementsConfigured: boolean;
    intakeConfigured: boolean;
    documentsConfigured: boolean;
    approvalConfigured: boolean;
    paymentConfigured: boolean;
    filingMethodConfigured: boolean;
    providerDisabled: boolean;
  }>,
): FormationServiceReadiness {
  const checks = {
    requirements: input.requirementsConfigured,
    intake: input.intakeConfigured,
    documents: input.documentsConfigured,
    approval: input.approvalConfigured,
    payment: input.paymentConfigured,
    filing_method: input.filingMethodConfigured,
  };
  const missing = Object.entries(checks)
    .filter(([, configured]) => !configured)
    .map(([code]) => code);
  return { ready: missing.length === 0, missing: Object.freeze(missing) };
}
