export function evaluateAvailability(
  input: Readonly<{ state?: string }>,
  rule: Readonly<{ supportedStates: readonly string[]; excludedStates: readonly string[] }>,
) {
  if (input.state === undefined)
    return Object.freeze({ kind: "unknown" as const, reason: "state_required" as const });
  if (rule.excludedStates.includes(input.state))
    return Object.freeze({ kind: "not_available" as const, reason: "state_excluded" as const });
  return rule.supportedStates.includes(input.state)
    ? Object.freeze({ kind: "available" as const })
    : Object.freeze({ kind: "not_available" as const, reason: "state_not_supported" as const });
}
