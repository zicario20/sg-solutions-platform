import { defineConfig } from "drizzle-kit";

const directDatabaseUrl = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env?.DIRECT_DATABASE_URL;

if (!directDatabaseUrl) {
  throw new Error("DIRECT_DATABASE_URL is required by Drizzle CLI");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/database/src/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: directDatabaseUrl },
});
