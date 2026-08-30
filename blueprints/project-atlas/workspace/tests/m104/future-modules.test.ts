import { describe, expect, it } from "vitest";
import { FUTURE_MODULES_RUNTIME, createFutureModulesSystem, captureFutureModule, linkFutureModuleEvidence, requestFutureModuleAction, evaluateFutureModuleReadiness } from "../../packages/future-modules/src/index.ts";

describe("M104 future-modules", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createFutureModulesSystem({ permission: "future-modules.system.configure", code: "FUTURE_MODULES_SYSTEM" });
    const record = captureFutureModule({ permission: "future-modules.record.create", code: "FUTURE_MODULES_SAMPLE", system, domain: "portfolio", title: "Bounded future-module candidate", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:104"], controlReferences: ["control:review"] });
    const evidence = linkFutureModuleEvidence({ permission: "future-modules.evidence.link", code: "FUTURE_MODULES_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestFutureModuleAction({ permission: "future-modules.action.request", code: "FUTURE_MODULES_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(FUTURE_MODULES_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateFutureModuleReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createFutureModulesSystem({ permission: "future-modules.system.configure", code: "FUTURE_MODULES_SYSTEM" });
    expect(() => captureFutureModule({ permission: "future-modules.record.create", code: "FUTURE_MODULES_UNSAFE", system, domain: "portfolio", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:104"] })).toThrow();
  });
});
