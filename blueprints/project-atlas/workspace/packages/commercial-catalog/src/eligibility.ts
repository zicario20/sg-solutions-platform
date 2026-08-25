type Rule = Readonly<{
  field: string;
  operator: "in";
  values: readonly string[];
  result: "potentially_eligible" | "requires_review" | "not_eligible";
  message: string;
}>;
export function evaluateEligibility(input: Record<string, unknown>, rules: readonly Rule[]) {
  for (const rule of rules)
    if (typeof input[rule.field] === "string" && rule.values.includes(input[rule.field] as string))
      return Object.freeze({ kind: rule.result, message: rule.message });
  return Object.freeze({
    kind: "unknown" as const,
    message: "More information is required before a preliminary review.",
  });
}
