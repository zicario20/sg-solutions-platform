import { evaluateAgentRun } from "@atlas/ai-control-plane";
import { describe, expect, it } from "vitest";

describe("M025 AI control-plane foundation", () => {
  const agent = {
    code: "support",
    version: "1.0.0",
    access: "public" as const,
    enabled: true,
    providerMode: "disabled" as const,
    allowedTools: ["get_service_catalog"] as const,
    requiresHumanReview: false,
  };
  it("fails closed while every provider is disabled", () => {
    expect(
      evaluateAgentRun(agent, {
        agentCode: "support",
        actorScope: "public",
        requestedTool: "get_service_catalog",
        containsSensitiveContent: false,
      }),
    ).toMatchObject({ status: "blocked" });
  });
  it("never permits a globally prohibited tool", () => {
    expect(
      evaluateAgentRun(
        { ...agent, providerMode: "local_future" },
        {
          agentCode: "support",
          actorScope: "public",
          requestedTool: "publish_service",
          containsSensitiveContent: false,
        },
      ),
    ).toMatchObject({ status: "blocked" });
  });
});
