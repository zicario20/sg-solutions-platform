import { readFile } from "node:fs/promises";
import process from "node:process";
import {
  createPostgresM007Executor,
  isM007HarnessAuthorized,
  M007_MIGRATION_FILES,
  runM007RlsHarness,
} from "./m007-auth-rls-harness.mjs";

if (!isM007HarnessAuthorized(process.env)) {
  console.log(
    "SKIP: set DATABASE_URL and M007_RLS_HARNESS=authorized for the disposable, approved PostgreSQL RLS harness.",
  );
  process.exit(0);
}

const migrationSources = await Promise.all(
  M007_MIGRATION_FILES.map(async (name) => ({
    name,
    sql: await readFile(new URL(`../../drizzle/${name}`, import.meta.url), "utf8"),
  })),
);
const { default: postgres } = await import("postgres");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const result = await runM007RlsHarness({
    executor: createPostgresM007Executor(sql),
    migrationSources,
  });
  console.log(
    `PASS: M007 applied ${result.migrationsApplied} migrations and enforced tenant, pre-auth, audit, outbox, and gateway least-privilege boundaries.`,
  );
} finally {
  await sql.end({ timeout: 5 });
}
