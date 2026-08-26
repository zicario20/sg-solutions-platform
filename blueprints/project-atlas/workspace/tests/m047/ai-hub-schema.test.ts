import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = resolve(import.meta.dirname, "../..");

describe("M047 AI Hub persistence boundary", () => {
  it("defines provider-disabled RLS tables without a public AI surface", () => {
    const schema = readFileSync(
      resolve(workspace, "packages/database/src/schema/ai-control-plane.ts"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(workspace, "drizzle/0057_m047_internal_ai_hub_controlled_foundation.sql"),
      "utf8",
    );
    for (const table of [
      "ai_hub_workspaces",
      "ai_agent_definitions",
      "ai_agent_versions",
      "ai_agent_manifests",
      "ai_model_provider_profiles",
      "ai_prompt_versions",
      "ai_tool_definitions",
      "ai_knowledge_bindings",
      "ai_agent_runs",
      "ai_release_gates",
    ])
      expect(schema).toContain(table);
    expect(schema.match(/\.enableRLS\(\)/g)?.length).toBeGreaterThanOrEqual(10);
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("USING (false)");
    expect(migration).toContain("WITH CHECK (false)");
    expect(migration).not.toContain("ollama");
    expect(migration).not.toContain("api_key");
    expect(migration).not.toContain("chain_of_thought");
  });
});
