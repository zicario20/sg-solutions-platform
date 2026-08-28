import { describe, expect, it } from "vitest";

import {
  BROWSER_AUTOMATION_PERMISSIONS,
  createBrowserActionContract,
  createBrowserNavigationRequest,
  createBrowserNetworkPolicy,
  createBrowserSession,
} from "../../packages/browser-automation/src/index";

const actor = {
  actorId: "staff-1",
  tenantId: "tenant-1",
  permissions: [
    BROWSER_AUTOMATION_PERMISSIONS.NETWORK_POLICY_MANAGE,
    BROWSER_AUTOMATION_PERMISSIONS.SESSION_CREATE,
    BROWSER_AUTOMATION_PERMISSIONS.NAVIGATION_REQUEST,
    BROWSER_AUTOMATION_PERMISSIONS.ACTION_CONTRACT_CREATE,
  ],
} as const;

describe("M070 browser automation foundation", () => {
  it("does not launch a browser or load cookies for a draft session", () => {
    const session = createBrowserSession(actor, {
      sessionCode: "BROWSER_SESSION_001",
      profileCode: "JURISDICTION_PROFILE",
      workerCode: "ISOLATED_BROWSER_WORKER",
    });

    expect(session.browserLaunched).toBe(false);
    expect(session.cookiesLoaded).toBe(false);
    expect(session.credentialsInjected).toBe(false);
  });

  it("requires an approved HTTPS origin but still blocks navigation", () => {
    const policy = createBrowserNetworkPolicy(actor, {
      code: "OFFICIAL_PORTAL_POLICY",
      allowedOrigins: ["https://portal.example.test"],
    });
    const request = createBrowserNavigationRequest(actor, {
      requestCode: "NAVIGATION_REQUEST_001",
      profileCode: "JURISDICTION_PROFILE",
      networkPolicy: policy,
      destination: "https://portal.example.test/filing?token=not-recorded",
    });

    expect(request.destinationOrigin).toBe("https://portal.example.test");
    expect(request.destinationPathRecorded).toBe(false);
    expect(request.navigationAttempted).toBe(false);
    expect(() =>
      createBrowserNavigationRequest(actor, {
        requestCode: "NAVIGATION_REQUEST_002",
        profileCode: "JURISDICTION_PROFILE",
        networkPolicy: policy,
        destination: "https://untrusted.example.test/",
      }),
    ).toThrow("not approved");
  });

  it("does not grant a side-effecting action execution authority", () => {
    const contract = createBrowserActionContract(actor, {
      code: "SUBMIT_ACTION",
      workflowInstanceReference: "workflow-instance-1",
      actionType: "side_effecting",
      purpose: "Proposed filing submission",
    });

    expect(contract.authorizedByWorkflow).toBe(false);
    expect(contract.executionAllowed).toBe(false);
  });
});
