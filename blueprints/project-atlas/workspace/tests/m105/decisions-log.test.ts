import { describe, expect, it } from "vitest";
import { DECISIONS_LOG_RUNTIME, createDecisionsLogSystem, createDecisionRecord, linkDecisionEvidence, requestDecisionAction, evaluateDecisionReadiness } from "../../packages/decisions-log/src/index.ts";

describe("M105 decisions-log", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createDecisionsLogSystem({ permission: "decisions-log.system.configure", code: "DECISIONS_LOG_SYSTEM" });
    const record = createDecisionRecord({ permission: "decisions-log.record.create", code: "DECISIONS_LOG_SAMPLE", system, domain: "governance", title: "Bounded decision proposal", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:105"], controlReferences: ["control:review"] });
    const evidence = linkDecisionEvidence({ permission: "decisions-log.evidence.link", code: "DECISIONS_LOG_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestDecisionAction({ permission: "decisions-log.action.request", code: "DECISIONS_LOG_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(DECISIONS_LOG_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateDecisionReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createDecisionsLogSystem({ permission: "decisions-log.system.configure", code: "DECISIONS_LOG_SYSTEM" });
    expect(() => createDecisionRecord({ permission: "decisions-log.record.create", code: "DECISIONS_LOG_UNSAFE", system, domain: "governance", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:105"] })).toThrow();
  });
});
