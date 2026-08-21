import { defineConfig } from "drizzle-kit";

const directDatabaseUrl = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env?.DIRECT_DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: ["./packages/database/src/schema.ts", "./packages/database/src/schema/public-forms.ts"],
  out: "./drizzle",
  ...(directDatabaseUrl ? { dbCredentials: { url: directDatabaseUrl } } : {}),
});
