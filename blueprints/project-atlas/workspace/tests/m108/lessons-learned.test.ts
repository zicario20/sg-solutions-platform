import { describe, expect, it } from "vitest";
import { LESSONS_LEARNED_RUNTIME, createLessonsLearnedSystem, createLessonRecord, linkLessonEvidence, requestLessonAction, evaluateLessonReadiness } from "../../packages/lessons-learned/src/index.ts";

describe("M108 lessons-learned", () => {
  it("keeps its controlled boundary disabled", () => {
    const system = createLessonsLearnedSystem({ permission: "lessons-learned.system.configure", code: "LESSONS_LEARNED_SYSTEM" });
    const record = createLessonRecord({ permission: "lessons-learned.record.create", code: "LESSONS_LEARNED_SAMPLE", system, domain: "learning", title: "Bounded lesson candidate", summary: "This record requires evidence and human review before any action.", ownerReference: "owner:product", sourceReferences: ["module:108"], controlReferences: ["control:review"] });
    const evidence = linkLessonEvidence({ permission: "lessons-learned.evidence.link", code: "LESSONS_LEARNED_EVIDENCE", record, reference: "evidence:sample", kind: "technical" });
    const action = requestLessonAction({ permission: "lessons-learned.action.request", code: "LESSONS_LEARNED_ACTION", record, destinationReference: "destination:pending", preconditionReferences: ["review:required"] });
    expect(LESSONS_LEARNED_RUNTIME.externalWrites).toBe(false);
    expect(evidence.fetchExecuted).toBe(false);
    expect(action.executed).toBe(false);
    expect(evaluateLessonReadiness({ record }).ready).toBe(false);
  });

  it("rejects unsafe text", () => {
    const system = createLessonsLearnedSystem({ permission: "lessons-learned.system.configure", code: "LESSONS_LEARNED_SYSTEM" });
    expect(() => createLessonRecord({ permission: "lessons-learned.record.create", code: "LESSONS_LEARNED_UNSAFE", system, domain: "learning", title: "Unsafe candidate", summary: "Bearer sample-token", ownerReference: "owner:product", sourceReferences: ["module:108"] })).toThrow();
  });
});
