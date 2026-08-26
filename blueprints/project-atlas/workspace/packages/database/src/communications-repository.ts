import type {
  CommunicationsRepository,
  VerifiedProviderStatusReceiptResolver,
} from "@atlas/domain";
import {
  type CommunicationsSql,
  PostgresCommunicationsRepository,
} from "./postgres-communications-store.ts";

export function createPostgresCommunicationsRepository(
  sql: CommunicationsSql,
  providerStatusReceiptResolver?: VerifiedProviderStatusReceiptResolver,
): CommunicationsRepository & Pick<PostgresCommunicationsRepository, "referenceState"> {
  return new PostgresCommunicationsRepository(sql, providerStatusReceiptResolver);
}

export * from "./postgres-communications-store.ts";
