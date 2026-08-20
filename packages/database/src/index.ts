import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";

import * as schema from "./schema";

export const DATABASE_PACKAGE_ID = "@atlas/database";

const resolveDatabaseUrl = (fallback?: string): string => {
  const explicit = process?.env?.DATABASE_URL ?? process?.env?.TEST_DATABASE_URL ?? process?.env?.DIRECT_DATABASE_URL;
  if (explicit) return explicit;
  if (fallback) return fallback;
  throw new Error("DATABASE_URL is required to initialize a live database connection.");
};

export const createAtlasClient = (url?: string) => {
  const databaseUrl = resolveDatabaseUrl(url);
  const client = postgres(databaseUrl, {
    max: 10,
    connect_timeout: 4,
  });

  return drizzle(client, {
    schema,
  });
};

let cachedClient: ReturnType<typeof createAtlasClient> | null = null;

export const getAtlasDb = (url?: string): ReturnType<typeof createAtlasClient> => {
  if (!cachedClient) {
    cachedClient = createAtlasClient(url);
  }

  return cachedClient;
};

export const clearAtlasDb = () => {
  cachedClient = null;
};

export * as schema from "./schema";
