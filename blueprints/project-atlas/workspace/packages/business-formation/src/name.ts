export type FormationNameCandidateResult = Readonly<{
  normalizedCandidate: string;
  formatValid: true;
  requiresOfficialConfirmation: true;
}>;

export function evaluateFormationNameCandidate(
  input: Readonly<{
    candidate: string;
    maxLength: number;
  }>,
): FormationNameCandidateResult {
  const normalizedCandidate = input.candidate.trim().replace(/\s+/gu, " ");
  const containsControlCharacter = [...normalizedCandidate].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 31 || code === 127;
  });
  if (
    !Number.isInteger(input.maxLength) ||
    input.maxLength < 1 ||
    normalizedCandidate.length === 0 ||
    normalizedCandidate.length > input.maxLength ||
    containsControlCharacter
  ) {
    throw new Error("FORMATION_NAME_CANDIDATE_INVALID");
  }
  return { normalizedCandidate, formatValid: true, requiresOfficialConfirmation: true };
}
