export const CLIENT_SERVICES_CACHE_SCHEMA_VERSION = "m009.cache.v1" as const;
export const CLIENT_SERVICES_CACHE_RUNTIME_ENABLED = false as const;

export interface ClientServicesCacheKey {
  schemaVersion: typeof CLIENT_SERVICES_CACHE_SCHEMA_VERSION;
  userId: string;
  accountId: string;
  contextOpaqueRef: string;
  authorizationEpoch: number;
  policyEpoch: number;
  resourceGrantFence: string;
}

export interface ClientServicesCacheEnvelope<T> {
  key: ClientServicesCacheKey;
  generatedAt: string;
  expiresAt: string;
  ttlSeconds: number;
  freshness: "fresh" | "expired";
  sourceStatus: "fresh" | "empty" | "unavailable";
  data?: T;
}

export const CLIENT_SERVICES_NEVER_STALE_SECTIONS = ["tasks", "documents", "payments"] as const;
