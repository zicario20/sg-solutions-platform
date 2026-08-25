import type {
  QueueAssignmentInput,
  TaskCommand,
  TaskSnapshot,
  TaskState,
  TaskTransitionResult,
} from "./contracts.ts";

const accept = (state: TaskState, event: string): TaskTransitionResult => ({
  accepted: true,
  state,
  event,
});
const reject = (state: TaskState, reason: string): TaskTransitionResult => ({
  accepted: false,
  state,
  reason,
});
const allPrerequisitesComplete = (task: TaskSnapshot) =>
  task.prerequisiteTaskIds.every((id) => task.completedPrerequisiteTaskIds.includes(id));
export function transitionTask(task: TaskSnapshot, command: TaskCommand): TaskTransitionResult {
  switch (command) {
    case "assign":
      return task.state === "open" && task.assignedTo
        ? accept("assigned", "TaskAssigned.v1")
        : reject(task.state, "An open task needs a concrete assignee.");
    case "start":
      return ["assigned", "open"].includes(task.state) && allPrerequisitesComplete(task)
        ? accept("in_progress", "TaskStarted.v1")
        : reject(task.state, "Task prerequisites or assignment are incomplete.");
    case "block":
      return ["assigned", "in_progress", "awaiting_client"].includes(task.state)
        ? accept("blocked", "TaskBlocked.v1")
        : reject(task.state, "Only active tasks can be blocked.");
    case "await_client":
      return task.ownerType === "client" || task.clientVisible
        ? accept("awaiting_client", "TaskClientActionRequested.v1")
        : reject(task.state, "Internal-only tasks cannot await client action.");
    case "complete":
      return ["in_progress", "awaiting_client"].includes(task.state) &&
        allPrerequisitesComplete(task)
        ? accept("completed", "TaskCompleted.v1")
        : reject(task.state, "Only unblocked tasks with complete prerequisites can finish.");
    case "cancel":
      return ["completed", "cancelled", "superseded"].includes(task.state)
        ? reject(task.state, "Final tasks cannot be cancelled.")
        : accept("cancelled", "TaskCancelled.v1");
    case "supersede":
      return ["completed", "cancelled", "superseded"].includes(task.state)
        ? reject(task.state, "Final tasks cannot be superseded.")
        : accept("superseded", "TaskSuperseded.v1");
    case "reopen":
      return task.state === "blocked"
        ? accept("open", "TaskReopened.v1")
        : reject(task.state, "Only blocked tasks can be reopened through the standard path.");
  }
}
export function chooseLeastLoadedAssignee(input: QueueAssignmentInput): string | undefined {
  return [...input.candidateStaffIds].sort(
    (a, b) =>
      (input.activeAssignmentCounts[a] ?? 0) - (input.activeAssignmentCounts[b] ?? 0) ||
      a.localeCompare(b),
  )[0];
}
