import { describe, expect, it } from "vitest";

import {
  createComplianceChangeRequest,
  createComplianceNotice,
  recordOfficialComplianceUpdate,
} from "../../packages/business-compliance/src/index.ts";
import { now } from "./fixtures.ts";

describe("M034 maintenance and notices", () => {
  it("does not turn client-requested data into official master data without evidence", () => {
    const request = createComplianceChangeRequest({
      organizationRef: "org-34",
      changeType: "registered_agent",
      requestedValue: { candidateRef: "agent-34" },
      requestedAt: now,
    });
    expect(request.state).toBe("review_required");
    const official = recordOfficialComplianceUpdate({
      request,
      sourceDocumentRef: "document-34",
      officialValue: { registeredAgentRef: "agent-34" },
      appliedAt: now,
    });
    expect(official.verificationStatus).toBe("verified");
  });

  it("requires an official source before a notice can drive work", () => {
    expect(() =>
      createComplianceNotice({
        organizationRef: "org-34",
        sourceDocumentRef: "",
        sourceReference: "official",
        status: "received",
        severity: "high",
        dueDateConfidence: "unknown",
        receivedAt: now,
      }),
    ).toThrow("COMPLIANCE_NOTICE_SOURCE_REQUIRED");
  });
});
