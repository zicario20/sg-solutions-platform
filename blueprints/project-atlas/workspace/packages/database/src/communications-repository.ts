import type { CommunicationsRepository } from "@atlas/domain";
import {
  type CommunicationsSql,
  PostgresCommunicationsRepository,
} from "./postgres-communications-store.ts";

export function createPostgresCommunicationsRepository(
  sql: CommunicationsSql,
): CommunicationsRepository & Pick<PostgresCommunicationsRepository, "referenceState"> {
  return new PostgresCommunicationsRepository(sql);
}

export * from "./postgres-communications-store.ts";
