import { describe, expect, it } from "vitest";

import {
  createHumanTaskContextSnapshot,
  createHumanTaskDefinition,
  createHumanTaskDefinitionVersion,
  createHumanTaskRequest,
  createHumanTaskScope,
  submitHumanTaskResult,
} from "../../packages/human-in-the-loop/src/index";

describe("M075 human-in-the-loop controlled foundation", () => {
  it("does not treat a task request as an approval or workflow completion", () => {
    const definition = createHumanTaskDefinition({
      permission: "human_task.definition.create",
      code: "CREDIT_REVIEW",
      name: "Credit review",
    });
    const version = createHumanTaskDefinitionVersion({
      permission: "human_task.version.create",
      definition,
      version: 1,
    });
    const request = createHumanTaskRequest({
      permission: "human_task.request.create",
      requestId: "human-task-1",
      definitionVersion: version,
      scope: createHumanTaskScope(["review"]),
      contextSnapshot: createHumanTaskContextSnapshot({
        snapshotReference: "snapshot-1",
        allowedResourceReferences: ["case:case-1"],
      }),
    });

    expect(request.approvalGranted).toBe(false);
    expect(request.workflowCompleted).toBe(false);
    expect(request.canonicalMutationApplied).toBe(false);
  });

  it("rejects non-minimized context", () => {
    expect(() =>
      createHumanTaskContextSnapshot({
        snapshotReference: "snapshot-2",
        allowedResourceReferences: ["case:case-2"],
        includesRawSecret: true,
      }),
    ).toThrow("raw secrets");
  });

  it("does not allow AI to submit a human review", () => {
    const definition = createHumanTaskDefinition({
      permission: "human_task.definition.create",
      code: "DOCUMENT_REVIEW",
      name: "Document review",
    });
    const request = createHumanTaskRequest({
      permission: "human_task.request.create",
      requestId: "human-task-2",
      definitionVersion: createHumanTaskDefinitionVersion({
        permission: "human_task.version.create",
        definition,
        version: 1,
      }),
      scope: createHumanTaskScope(["classify"]),
      contextSnapshot: createHumanTaskContextSnapshot({
        snapshotReference: "snapshot-3",
        allowedResourceReferences: ["document:document-1"],
      }),
    });

    expect(() =>
      submitHumanTaskResult({
        permission: "human_task.result.submit",
        request,
        actor: { id: "agent-1", kind: "ai" },
      }),
    ).toThrow("Only an authenticated human");
  });
});
