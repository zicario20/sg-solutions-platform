const allowedKeys = new Set(["event", "outcome", "policy", "latencyMs", "correlationId"]);
export function recordAuthTelemetry(input: Record<string, unknown>) {
  for (const key of Object.keys(input)) if (!allowedKeys.has(key)) throw new Error("AUTH_TELEMETRY_FIELD_DENIED");
  if (typeof input.event !== "string" || typeof input.outcome !== "string" || typeof input.correlationId !== "string") throw new Error("AUTH_TELEMETRY_INVALID");
  return { event: input.event, outcome: input.outcome, correlationId: input.correlationId };
}
