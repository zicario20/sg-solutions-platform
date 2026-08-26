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
    expect(schema).toContain('boolean("execution_permitted").notNull().default(false)');
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

  it("includes M047 and M048 control switches in Turborepo cache inputs", async () => {
    const turbo = await readFile(resolve(root, "turbo.json"), "utf8");
    const flags = [
      "M047_AI_HUB_ENABLED",
      "M047_MODEL_PROVIDER_CALLS_ENABLED",
      "M047_TOOL_EXECUTION_ENABLED",
      "M047_JOB_DISPATCH_ENABLED",
      "M047_EXTERNAL_EGRESS_ENABLED",
      "M047_AUTOMATIC_MEMORY_WRITES_ENABLED",
      "M047_SUPERVISOR_DELEGATION_ENABLED",
      "M048_SUPERVISOR_ENABLED",
      "M048_SUPERVISOR_DELEGATION_ENABLED",
      "M048_SUPERVISOR_PROVIDER_CALLS_ENABLED",
      "M048_SUPERVISOR_ORCHESTRATION_EXECUTION_ENABLED",
      "M048_SUPERVISOR_AUTO_REROUTING_ENABLED",
      "M048_SUPERVISOR_PARALLEL_EXECUTION_ENABLED",
      "M048_SUPERVISOR_AUTOMATION_ENABLED",
    ];

    for (const flag of flags) {
      expect(turbo).toContain(`"${flag}"`);
    }
  });
});
