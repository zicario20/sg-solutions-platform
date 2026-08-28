import { describe, expect, it } from "vitest";

import {
  createAuthorizationAction,
  createAuthorizationDecisionRequest,
  createAuthorizationRole,
  createAuthorizationSubject,
  evaluateAuthorizationDecision,
  registerAuthorizationResource,
  requestRoleAssignment,
} from "../../packages/authorization/src/index";

describe("M081 authorization controlled foundation", () => {
  it("fails closed when policy evaluation is disabled", () => {
    const subject = createAuthorizationSubject({
      permission: "authorization.subject.create",
      subjectReference: "principal:client-1",
      type: "client",
    });
    const resource = registerAuthorizationResource({
      permission: "authorization.resource.register",
      resourceReference: "document:document-1",
      resourceType: "document",
      sensitiveClassificationReference: "classification:restricted",
    });
    const action = createAuthorizationAction({
      permission: "authorization.action.create",
      code: "DOCUMENT_READ",
      class: "read",
    });
    const decision = evaluateAuthorizationDecision({
      permission: "authorization.decision.evaluate",
      request: createAuthorizationDecisionRequest({
        permission: "authorization.decision.evaluate",
        requestId: "decision-1",
        subject,
        resource,
        action,
        purposeReference: "purpose:client-document-view",
      }),
    });

    expect(decision.status).toBe("deny");
    expect(decision.allowed).toBe(false);
    expect(decision.enforcementApplied).toBe(false);
  });

  it("prevents AI self-elevation", () => {
    const agent = createAuthorizationSubject({
      permission: "authorization.subject.create",
      subjectReference: "agent:supervisor",
      type: "ai",
    });
    const role = createAuthorizationRole({
      permission: "authorization.role.create",
      code: "ADMINISTRATOR",
      name: "Administrator",
    });

    expect(() =>
      requestRoleAssignment({
        permission: "authorization.assignment.request",
        requestId: "assignment-1",
        subject: agent,
        role,
        requestedByType: "ai",
      }),
    ).toThrow("cannot assign roles to themselves");
  });

  it("rejects broad PII and private reasoning from authorization context", () => {
    const subject = createAuthorizationSubject({
      permission: "authorization.subject.create",
      subjectReference: "principal:staff-1",
      type: "human",
    });
    const resource = registerAuthorizationResource({
      permission: "authorization.resource.register",
      resourceReference: "case:case-1",
      resourceType: "case",
    });
    const action = createAuthorizationAction({
      permission: "authorization.action.create",
      code: "CASE_READ",
      class: "read",
    });

    expect(() =>
      createAuthorizationDecisionRequest({
        permission: "authorization.decision.evaluate",
        requestId: "decision-2",
        subject,
        resource,
        action,
        includesBroadPii: true,
      }),
    ).toThrow("broad PII");
  });
});
