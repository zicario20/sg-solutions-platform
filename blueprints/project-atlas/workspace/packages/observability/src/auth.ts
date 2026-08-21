const allowedKeys = new Set(["event", "outcome", "policy", "latencyMs", "correlationId"]);
const allowedAuditMetadataKeys = new Set(["outcome", "riskClass", "provider", "channel", "reasonCode", "policyVersion"]);

export function sanitizeAuthAuditMetadata(input: Record<string, unknown>): Readonly<Record<string, string | number | boolean>> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowedAuditMetadataKeys.has(key)) throw new Error("AUTH_AUDIT_METADATA_FIELD_DENIED");
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") throw new Error("AUTH_AUDIT_METADATA_VALUE_DENIED");
    if (typeof value === "string" && (value.length > 128 || /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|bearer\s|password|secret|api[_-]?key|eyJ[A-Za-z0-9_-]{10,}/iu.test(value))) throw new Error("AUTH_AUDIT_METADATA_VALUE_DENIED");
    result[key] = value;
  }
  return Object.freeze(result);
}
export function recordAuthTelemetry(input: Record<string, unknown>) {
  for (const key of Object.keys(input)) if (!allowedKeys.has(key)) throw new Error("AUTH_TELEMETRY_FIELD_DENIED");
  if (typeof input.event !== "string" || typeof input.outcome !== "string" || typeof input.correlationId !== "string") throw new Error("AUTH_TELEMETRY_INVALID");
  return { event: input.event, outcome: input.outcome, correlationId: input.correlationId };
}
