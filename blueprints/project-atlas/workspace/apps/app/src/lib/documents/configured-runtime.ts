export type DocumentRuntimeState = Readonly<{ kind: "provider_disabled" | "ready" }>;

export function getConfiguredDocumentRuntime(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): DocumentRuntimeState {
  const configured =
    environment.M011_DOCUMENTS_ENABLED === "true" &&
    Boolean(environment.M011_MINIO_ENDPOINT) &&
    Boolean(environment.M011_MINIO_BUCKET) &&
    Boolean(environment.M011_CLAMAV_ENDPOINT) &&
    Boolean(environment.DATABASE_URL);
  return configured ? { kind: "ready" } : { kind: "provider_disabled" };
}
