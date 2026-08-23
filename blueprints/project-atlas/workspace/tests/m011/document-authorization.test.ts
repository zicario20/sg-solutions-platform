import { authorizeDocumentResource } from "@atlas/documents";
import { describe, expect, it } from "vitest";

const resource = {
  ownerAccountId: "account-a",
  contextRef: "ctx-a",
  clientVisible: true,
  inheritanceBlocked: false,
  authorizationEpoch: "7",
  policyEpoch: "4",
  minimumAssurance: "aal1" as const,
};

describe("M011 document authorization", () => {
  it("denies a matching opaque reference from another authorized account", () => {
    expect(
      authorizeDocumentResource(
        {
          accountId: "account-b",
          contextRef: "ctx-a",
          assurance: "aal2",
          authorizationEpoch: "7",
          policyEpoch: "4",
          sessionExpiresAt: "2026-08-24T00:00:00.000Z",
        },
        resource,
        new Date("2026-08-23T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("denies an internal document even to a matching case context without explicit staff authority", () => {
    expect(
      authorizeDocumentResource(
        {
          accountId: "account-a",
          contextRef: "ctx-a",
          assurance: "aal2",
          authorizationEpoch: "7",
          policyEpoch: "4",
          sessionExpiresAt: "2026-08-24T00:00:00.000Z",
        },
        { ...resource, clientVisible: false },
        new Date("2026-08-23T12:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
