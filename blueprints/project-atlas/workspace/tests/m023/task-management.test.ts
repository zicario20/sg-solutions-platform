import { chooseLeastLoadedAssignee, transitionTask } from "@atlas/task-management";
import { describe, expect, it } from "vitest";

describe("M023 task foundation", () => {
  const open = {
    taskId: "task-1",
    state: "open" as const,
    priority: "normal" as const,
    ownerType: "staff" as const,
    clientVisible: false,
    assignedTo: "staff-a",
    prerequisiteTaskIds: [],
    completedPrerequisiteTaskIds: [],
    version: 1,
  };
  it("does not complete a task before it is in progress", () => {
    expect(transitionTask(open, "complete").accepted).toBe(false);
    expect(transitionTask(open, "start")).toMatchObject({ accepted: true, state: "in_progress" });
  });
  it("chooses deterministically among least-loaded staff", () => {
    expect(
      chooseLeastLoadedAssignee({
        queueCode: "intake",
        candidateStaffIds: ["b", "a"],
        activeAssignmentCounts: { a: 1, b: 1 },
      }),
    ).toBe("a");
  });
});
