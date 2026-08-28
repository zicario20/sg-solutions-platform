import { describe, expect, it } from "vitest";

import {
  createAuditEventCandidate,
  createAuditEventCorrectionCandidate,
} from "../../packages/audit/src/index";

describe("M077 audit controlled foundation", () => {
  it("creates a non-persisted candidate instead of asserting business truth", () => {
    const event = createAuditEventCandidate({
      permission: "audit.event.append",
      event: {
        eventId: "audit-event-1",
        eventType: "human_task.requested",
        eventVersion: 1,
        actor: { type: "human_user", reference: "user:staff-1" },
        resources: [{ resourceType: "human_task", resourceReference: "task:task-1" }],
      },
    });

    expect(event.appended).toBe(false);
    expect(event.businessTruthAsserted).toBe(false);
    expect(event.persistenceState).toBe("blocked_runtime_disabled");
  });

  it("rejects prohibited raw audit payload categories", () => {
    expect(() =>
      createAuditEventCandidate({
        permission: "audit.event.append",
        event: {
          eventId: "audit-event-2",
          eventType: "payment.created",
          eventVersion: 1,
          actor: { type: "service_account", reference: "service:billing" },
          resources: [{ resourceType: "payment", resourceReference: "payment:payment-1" }],
          includesRawSecret: true,
        },
      }),
    ).toThrow("raw secrets");
  });

  it("models a correction as a new candidate instead of mutating the original", () => {
    const original = createAuditEventCandidate({
      permission: "audit.event.append",
      event: {
        eventId: "audit-event-3",
        eventType: "workflow.transition.requested",
        eventVersion: 1,
        actor: { type: "background_worker", reference: "worker:workflow" },
        resources: [{ resourceType: "workflow", resourceReference: "workflow:workflow-1" }],
      },
    });
    const correction = createAuditEventCorrectionCandidate({
      permission: "audit.event.append",
      correctionId: "audit-correction-1",
      original,
    });

    expect(correction.originalEventId).toBe(original.eventId);
    expect(correction.originalMutated).toBe(false);
  });
});
