import { createHash } from "node:crypto";

import { assertReceptionText, assertReceptionVersionReference } from "./contracts.js";

export type ReceptionChangeType =
  | "manifest_change"
  | "knowledge_policy_change"
  | "reception_policy_change"
  | "runtime_activation"
  | "tool_policy_change";

export interface ReceptionChangeRequest {
  readonly type: ReceptionChangeType;
  readonly actorType: "agent" | "owner" | "staff" | "system";
  readonly humanApprovalReference: string | null;
  readonly changeReference: string;
}

export interface ReceptionAuditEventInput {
  readonly id: string;
  readonly eventType: string;
  readonly resourceReference: string;
  readonly occurredAt: string;
  readonly previousHash: string | null;
}

export interface ReceptionAuditEvent extends ReceptionAuditEventInput {
  readonly hash: string;
}

export function validateReceptionChangeRequest(
  value: ReceptionChangeRequest,
): ReceptionChangeRequest {
  if (value.actorType === "agent")
    throw new TypeError("agent changes to reception governance are prohibited");
  if (value.actorType === "system")
    throw new TypeError("system changes to reception governance require human ownership");
  if (value.humanApprovalReference === null)
    throw new TypeError("reception governance changes require human approval");
  assertReceptionVersionReference(
    value.humanApprovalReference,
    "reception human approval reference",
  );
  assertReceptionVersionReference(value.changeReference, "reception change reference");
  return Object.freeze({ ...value });
}

export function createReceptionAuditEvent(value: ReceptionAuditEventInput): ReceptionAuditEvent {
  assertReceptionText(value.id, "reception audit id", 160);
  assertReceptionText(value.eventType, "reception audit event type", 160);
  assertReceptionVersionReference(value.resourceReference, "reception audit resource reference");
  if (Number.isNaN(Date.parse(value.occurredAt)))
    throw new TypeError("reception audit occurredAt must be a date");
  if (value.previousHash !== null && !/^[a-f0-9]{64}$/u.test(value.previousHash))
    throw new TypeError("reception audit previous hash must be SHA-256");

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
