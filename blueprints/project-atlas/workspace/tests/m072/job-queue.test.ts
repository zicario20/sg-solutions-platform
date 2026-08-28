import { describe, expect, it } from "vitest";
import { JOB_QUEUE_PERMISSIONS, createJobDefinition, createJobDefinitionVersion, createJobPayloadContract, createJobRequest, recordUnknownJobOutcome, requestSafeJobRequeue } from "../../packages/job-queue/src/index";

const actor = { actorId: "staff-1", tenantId: "tenant-1", permissions: Object.values(JOB_QUEUE_PERMISSIONS) } as const;

describe("M072 job queue foundation", () => {
  it("records a versioned job request without dispatching it or asserting a business outcome", () => {
    const definition = createJobDefinition(actor, { code: "DOCUMENT_PROCESSING", displayName: "Document processing", ownerModule: "M065", riskClass: "medium", handlerType: "module_adapter" });
    const version = createJobDefinitionVersion(actor, { jobCode: definition.code, version: "1.0.0", inputContractCode: "DOCUMENT_INPUT", outputContractCode: "DOCUMENT_OUTPUT" });
    const payload = createJobPayloadContract(actor, { code: "DOCUMENT_INPUT", referenceKeys: ["document-reference"] });
    const request = createJobRequest(actor, { requestCode: "DOCUMENT_JOB_001", tenantId: "tenant-1", jobCode: definition.code, jobVersion: version.version, payloadContractCode: payload.code, idempotencyKey: "operation-1" });
    expect(request.dispatched).toBe(false);
    expect(request.businessOutcomeAsserted).toBe(false);
  });
  it("rejects raw secrets from queue payload contracts", () => {
    expect(() => createJobPayloadContract(actor, { code: "UNSAFE_INPUT", referenceKeys: [], containsRawSecret: true })).toThrow("never secrets");
  });
  it("blocks requeue while an external outcome remains unknown", () => {
    const unknown = recordUnknownJobOutcome(actor, { requestCode: "DOCUMENT_JOB_001", operationReference: "operation-1" });
    expect(() => requestSafeJobRequeue(actor, unknown)).toThrow("reconciled");
  });
});
