import { describe, expect, it } from "vitest";
import { CHANGELOG_RUNTIME, createChangelogSystem, createChangelogEntry, linkChangelogVerification, requestChangelogAction, evaluateChangelogReadiness } from "../../packages/changelog/src/index.ts";

describe("M109 changelog", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createChangelogSystem({ permission: "changelog.system.configure", code: "CHANGELOG_SYSTEM" });
    const record = createChangelogEntry({ permission: "changelog.record.create", code: "CHANGELOG_SAMPLE", system, domain: "change_management", title: "Bounded changelog entry draft", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:109"], controlReferences: ["control:review"] });
    const evidence = linkChangelogVerification({ permission: "changelog.evidence.link", code: "CHANGELOG_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestChangelogAction({ permission: "changelog.action.request", code: "CHANGELOG_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(CHANGELOG_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateChangelogReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createChangelogSystem({ permission: "changelog.system.configure", code: "CHANGELOG_SYSTEM" });
    expect(() => createChangelogEntry({ permission: "changelog.record.create", code: "CHANGELOG_UNSAFE", system, domain: "change_management", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:109"] })).toThrow();
  });
});
