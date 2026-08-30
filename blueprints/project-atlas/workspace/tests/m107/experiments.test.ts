import { describe, expect, it } from "vitest";
import { EXPERIMENTS_RUNTIME, createExperimentsSystem, createExperimentRecord, linkExperimentEvidence, requestExperimentAction, evaluateExperimentReadiness } from "../../packages/experiments/src/index.ts";

describe("M107 experiments", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createExperimentsSystem({ permission: "experiments.system.configure", code: "EXPERIMENTS_SYSTEM" });
    const record = createExperimentRecord({ permission: "experiments.record.create", code: "EXPERIMENTS_SAMPLE", system, domain: "experimentation", title: "Bounded experiment proposal", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:107"], controlReferences: ["control:review"] });
    const evidence = linkExperimentEvidence({ permission: "experiments.evidence.link", code: "EXPERIMENTS_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestExperimentAction({ permission: "experiments.action.request", code: "EXPERIMENTS_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(EXPERIMENTS_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateExperimentReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createExperimentsSystem({ permission: "experiments.system.configure", code: "EXPERIMENTS_SYSTEM" });
    expect(() => createExperimentRecord({ permission: "experiments.record.create", code: "EXPERIMENTS_UNSAFE", system, domain: "experimentation", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:107"] })).toThrow();
  });
});
