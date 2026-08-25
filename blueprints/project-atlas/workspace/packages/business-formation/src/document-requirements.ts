export type FormationDocumentCondition = Readonly<{
  field: string;
  equals: string | number | boolean;
}>;

export type FormationDocumentRequirementRule = Readonly<{
  code: string;
  required: boolean;
  when?: FormationDocumentCondition;
}>;

export type FormationDocumentRequirementResult = Readonly<{
  requiredCodes: readonly string[];
  missingCodes: readonly string[];
}>;

const codePattern = /^[A-Z][A-Z0-9_]{1,79}$/u;

export function evaluateFormationDocumentRequirements(
  input: Readonly<{
    answers: Readonly<Record<string, string | number | boolean>>;
    rules: readonly FormationDocumentRequirementRule[];
    satisfiedCodes?: readonly string[];
  }>,
): FormationDocumentRequirementResult {
  const required = new Set<string>();
  for (const rule of input.rules) {
    if (!codePattern.test(rule.code))
      throw new Error("FORMATION_DOCUMENT_REQUIREMENT_CODE_INVALID");
    const applies = rule.when === undefined || input.answers[rule.when.field] === rule.when.equals;
    if (rule.required && applies) required.add(rule.code);
  }
  const requiredCodes = [...required].sort();
  const satisfied = new Set(input.satisfiedCodes ?? []);
  return {
    requiredCodes: Object.freeze(requiredCodes),
    missingCodes: Object.freeze(requiredCodes.filter((code) => !satisfied.has(code))),
  };
}
