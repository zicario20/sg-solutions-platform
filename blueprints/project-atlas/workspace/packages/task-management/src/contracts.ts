export const taskStates = [
  "draft",
  "open",
  "assigned",
  "in_progress",
  "blocked",
  "awaiting_client",
  "completed",
  "cancelled",
  "superseded",
] as const;
export type TaskState = (typeof taskStates)[number];
export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskCommand =
  | "assign"
  | "start"
  | "block"
  | "await_client"
  | "complete"
  | "cancel"
  | "supersede"
  | "reopen";
export interface TaskSnapshot {
  taskId: string;
  state: TaskState;
  priority: TaskPriority;
  ownerType: "client" | "staff" | "system";
  clientVisible: boolean;
  assignedTo?: string;
  prerequisiteTaskIds: readonly string[];
  completedPrerequisiteTaskIds: readonly string[];
  version: number;
}
export interface TaskTransitionResult {
  accepted: boolean;
  state: TaskState;
  reason?: string;
  event?: string;
}
export interface QueueAssignmentInput {
  queueCode: string;
  candidateStaffIds: readonly string[];
  activeAssignmentCounts: Readonly<Record<string, number>>;
}
