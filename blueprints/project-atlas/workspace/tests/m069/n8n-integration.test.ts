import { describe, expect, it } from "vitest";

import {
  N8N_PERMISSIONS,
  createN8nInstanceProfile,
  recordUnverifiedN8nWebhookCandidate,
  requestN8nExecution,
} from "../../packages/n8n-integration/src/index";

const actor = {
  actorId: "staff-1",
  tenantId: "tenant-1",
  permissions: [N8N_PERMISSIONS.INSTANCE_MANAGE, N8N_PERMISSIONS.EXECUTION_REQUEST],
} as const;

describe("M069 n8n integration foundation", () => {
  it("keeps new instance profiles provider disabled and without credentials", () => {
    const profile = createN8nInstanceProfile(actor, {
      code: "N8N_PRIMARY",
      displayName: "Primary n8n",
    });

    expect(profile.status).toBe("disabled");
    expect(profile.credentialsConfigured).toBe(false);
    expect(profile.connectionTested).toBe(false);
  });

  it("fails closed by recording rather than dispatching execution", () => {
    const request = requestN8nExecution(actor, {
      requestCode: "EXECUTION_REQUEST_001",
      workflowCode: "CLIENT_NOTIFICATION",
      workflowVersion: "1.0.0",
      idempotencyKey: "event-001",
      inputContractCode: "CLIENT_NOTIFICATION_INPUT",
    });

    expect(request.status).toBe("blocked_runtime_disabled");
    expect(request.dispatched).toBe(false);
    expect(request.canonicalStateMutated).toBe(false);
  });

  it("does not accept an unverified webhook or mutate business state", () => {
    const candidate = recordUnverifiedN8nWebhookCandidate({
      eventReference: "event-hash-001",
      workflowCode: "CLIENT_NOTIFICATION",
      idempotencyKey: "event-001",
    });

    expect(candidate.accepted).toBe(false);
    expect(candidate.canonicalStateMutated).toBe(false);
  });
});
