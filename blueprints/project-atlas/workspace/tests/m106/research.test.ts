import { describe, expect, it } from "vitest";
import { RESEARCH_RUNTIME, createResearchSystem, createResearchRecord, linkResearchEvidence, requestResearchAction, evaluateResearchReadiness } from "../../packages/research/src/index.ts";

describe("M106 research", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createResearchSystem({ permission: "research.system.configure", code: "RESEARCH_SYSTEM" });
    const record = createResearchRecord({ permission: "research.record.create", code: "RESEARCH_SAMPLE", system, domain: "research", title: "Bounded research record", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:106"], controlReferences: ["control:review"] });
    const evidence = linkResearchEvidence({ permission: "research.evidence.link", code: "RESEARCH_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestResearchAction({ permission: "research.action.request", code: "RESEARCH_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(RESEARCH_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateResearchReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createResearchSystem({ permission: "research.system.configure", code: "RESEARCH_SYSTEM" });
    expect(() => createResearchRecord({ permission: "research.record.create", code: "RESEARCH_UNSAFE", system, domain: "research", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:106"] })).toThrow();
  });
});
