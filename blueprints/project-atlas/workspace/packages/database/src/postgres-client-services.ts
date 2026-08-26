export interface PostgresClientServicesClient {
  unsafe<T extends readonly Record<string, unknown>[]>(
    query: string,
    parameters?: readonly unknown[],
  ): Promise<T>;
}
export function createClientServicesSqlPort(client: PostgresClientServicesClient) {
  return {
    query: <T extends Record<string, unknown>>(text: string, values: readonly unknown[]) =>
      client.unsafe<readonly T[]>(text, values),
  };
}
