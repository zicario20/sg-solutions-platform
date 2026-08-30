import { describe, expect, it } from "vitest";
import { CODEX_DEVELOPER_GUIDE_RUNTIME, createCodexDeveloperGuideSystem, createDeveloperGuideSection, linkDeveloperGuideReference, requestDeveloperGuideAction, evaluateDeveloperGuideReadiness } from "../../packages/codex-developer-guide/src/index.ts";

describe("M110 codex-developer-guide", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createCodexDeveloperGuideSystem({ permission: "codex-developer-guide.system.configure", code: "CODEX_DEVELOPER_GUIDE_SYSTEM" });
    const record = createDeveloperGuideSection({ permission: "codex-developer-guide.record.create", code: "CODEX_DEVELOPER_GUIDE_SAMPLE", system, domain: "developer_governance", title: "Bounded developer-guide section", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:110"], controlReferences: ["control:review"] });
    const evidence = linkDeveloperGuideReference({ permission: "codex-developer-guide.evidence.link", code: "CODEX_DEVELOPER_GUIDE_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestDeveloperGuideAction({ permission: "codex-developer-guide.action.request", code: "CODEX_DEVELOPER_GUIDE_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(CODEX_DEVELOPER_GUIDE_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateDeveloperGuideReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createCodexDeveloperGuideSystem({ permission: "codex-developer-guide.system.configure", code: "CODEX_DEVELOPER_GUIDE_SYSTEM" });
    expect(() => createDeveloperGuideSection({ permission: "codex-developer-guide.record.create", code: "CODEX_DEVELOPER_GUIDE_UNSAFE", system, domain: "developer_governance", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:110"] })).toThrow();
  });
});
