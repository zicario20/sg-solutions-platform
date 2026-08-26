import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

describe("M048 supervisor persistence and disabled defaults", () => {
  it("defines RLS-protected supervisor records and a deny-by-default migration", async () => {
    const schema = await readFile(
      resolve(root, "packages/database/src/schema/supervisor-agent.ts"),
      "utf8",
    );
    const migration = await readFile(
      resolve(root, "drizzle/0058_m048_supervisor_agent_controlled_foundation.sql"),
      "utf8",
    );

    expect(schema).toContain("supervisorRoutingDecisions");
    expect(schema).toContain("supervisorOrchestrationPlans");
    expect(schema).toContain(".enableRLS()");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("supervisor_audit_events");
    expect(migration).not.toMatch(/grant\s+all/i);
  });

  it("keeps every M048 execution path disabled and contains no provider call expression", async () => {
    const environment = await readFile(resolve(root, ".env.example"), "utf8");
    const source = await readFile(
      resolve(root, "packages/supervisor-agent/src/runtime.ts"),
      "utf8",
    );

    expect(environment).toMatch(/^M048_SUPERVISOR_ENABLED=false$/m);
    expect(environment).toMatch(/^M048_SUPERVISOR_DELEGATION_ENABLED=false$/m);
    expect(environment).toMatch(/^M048_SUPERVISOR_PROVIDER_CALLS_ENABLED=false$/m);
    expect(source).not.toMatch(/\b(fetch|axios|ollama)\s*\(/);
  });
});
