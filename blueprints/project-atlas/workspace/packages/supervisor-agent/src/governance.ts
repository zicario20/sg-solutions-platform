import { createHash } from "node:crypto";

import { assertExactVersionReference, assertSupervisorText } from "./contracts.js";

export type SupervisorChangeType =
  | "budget_policy_change"
  | "routing_policy_change"
  | "self_approve"
  | "self_modify"
  | "specialist_registry_change";

export interface SupervisorChangeRequest {
  readonly type: SupervisorChangeType;
  readonly actorType: "agent" | "owner" | "staff" | "system";
  readonly humanApprovalReference: string | null;
  readonly changeReference: string;
}

export interface SupervisorAuditEventInput {
  readonly id: string;
  readonly eventType: string;
  readonly resourceReference: string;
  readonly occurredAt: string;
  readonly previousHash: string | null;
}

export interface SupervisorAuditEvent extends SupervisorAuditEventInput {
  readonly hash: string;
}

export function validateSupervisorChangeRequest(
  value: SupervisorChangeRequest,
): SupervisorChangeRequest {
  if (value.type === "self_modify")
    throw new TypeError("supervisor self-modification is prohibited");
  if (value.type === "self_approve") throw new TypeError("supervisor self-approval is prohibited");
  if (value.actorType === "agent")
    throw new TypeError("agents cannot change supervisor governance");
  if (value.humanApprovalReference === null)
    throw new TypeError("supervisor governance changes require human approval");
  assertExactVersionReference(value.humanApprovalReference, "supervisor human approval reference");
  assertExactVersionReference(value.changeReference, "supervisor governance change reference");
  return Object.freeze({ ...value });
}

export function createSupervisorAuditEvent(value: SupervisorAuditEventInput): SupervisorAuditEvent {
  assertSupervisorText(value.id, "supervisor audit id", 160);
  assertSupervisorText(value.eventType, "supervisor audit event type", 160);
  assertExactVersionReference(value.resourceReference, "supervisor audit resource reference");
  if (Number.isNaN(Date.parse(value.occurredAt)))
    throw new TypeError("supervisor audit occurredAt must be a date");
  if (value.previousHash !== null && !/^[a-f0-9]{64}$/.test(value.previousHash))
    throw new TypeError("supervisor audit previous hash must be SHA-256");

  const canonicalPayload = JSON.stringify({
    eventType: value.eventType,
    id: value.id,
    occurredAt: value.occurredAt,
    previousHash: value.previousHash,
    resourceReference: value.resourceReference,
  });
  return Object.freeze({
    ...value,
    hash: createHash("sha256").update(canonicalPayload).digest("hex"),
  });
}
