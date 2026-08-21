import process from "node:process";

if (!process.env.DATABASE_URL) {
  console.log("SKIP: DATABASE_URL is required for the authorized M007 PostgreSQL RLS harness.");
  process.exit(0);
}

console.log("M007 RLS harness requires an explicitly provisioned disposable DATABASE_URL; execute migrations and role-policy assertions only in that authorized environment.");
process.exit(2);
