import { describe, expect, it } from "vitest";

import {
  createWorkflowDefinition,
  createWorkflowDefinitionVersion,
  createWorkflowOutboxRecord,
  createWorkflowStartRequest,
  evaluateWorkflowSignal,
  getWorkflowEngineRuntimeStatus,
} from "../../packages/workflow-engine/src/index";

const actor = {
  actorId: "staff-1",
  tenantId: "tenant-1",
  permissions: [
    "workflow.definition.create",
    "workflow.definition.version.create",
    "workflow.instance.start",
    "workflow.signal.consume",
    "workflow.outbox.create",
  ],
};

describe("M068 workflow engine foundation", () => {
  it("creates immutable draft definitions and versions", () => {
    const definition = createWorkflowDefinition(actor, {
      id: "workflow-1",
      workflowCode: "CLIENT_DOCUMENT_REVIEW",
      displayName: "Client document review",
      purpose: "Coordinate a controlled document review.",
      domainScope: "documents",
      triggerTypes: ["manual"],
    });
    const version = createWorkflowDefinitionVersion(actor, {
      id: "workflow-version-1",
      workflowDefinitionId: definition.id,
      version: "1",
      contentHash: "sha256:workflow",
      steps: [{ stepCode: "WAIT_FOR_REVIEW", stepType: "wait" }],
      transitions: [],
    });
    expect(definition.activeForNewInstances).toBe(false);
    expect(version.immutable).toBe(true);
    expect(version.executable).toBe(false);
  });

  it("blocks starts, signals, and outbox dispatch while runtime is disabled", () => {
    const start = createWorkflowStartRequest(actor, {
      id: "start-1",
      workflowCode: "CLIENT_DOCUMENT_REVIEW",
      definitionVersionId: "workflow-version-1",
      definitionStatus: "active",
      triggerType: "manual",
      subjectReferences: ["document-1"],
      inputSnapshotReference: "snapshot-1",
      idempotencyKey: "start:document-1",
    });
    const signal = evaluateWorkflowSignal(actor, {
      id: "signal-1",
      tenantId: "tenant-1",
      signalType: "document.reviewed",
      correlationStatus: "ambiguous",
      verificationStatus: "verified",
      idempotencyKey: "signal:1",
      duplicate: false,
    });
    const outbox = createWorkflowOutboxRecord(actor, {
      id: "outbox-1",
      workflowInstanceId: "workflow-instance-1",
      eventType: "workflow.wait.registered",
      correlationId: "corr-1",
    });
    expect(start.instanceCreated).toBe(false);
    expect(signal.reason).toBe("correlation_ambiguous");
    expect(outbox.published).toBe(false);
  });

  it("keeps the scheduler, n8n, and side effects disabled", () => {
    expect(getWorkflowEngineRuntimeStatus().enabled).toBe(false);
  });
});
