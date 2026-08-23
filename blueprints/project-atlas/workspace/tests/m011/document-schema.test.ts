import {
  documentAuditEvents,
  documentRecords,
  documentRequests,
  documentUploadIntents,
  documentVersions,
} from "@atlas/database";
import { describe, expect, it } from "vitest";

describe("M011 document schema", () => {
  it("stores governed metadata and immutable versions without document bytes", () => {
    const recordColumns = Object.keys(documentRecords);
    const versionColumns = Object.keys(documentVersions);
    expect(recordColumns).toEqual(
      expect.arrayContaining([
        "id",
        "ownerAccountId",
        "contextRef",
        "legalHold",
        "lifecycle",
        "version",
      ]),
    );
    expect(versionColumns).toEqual(
      expect.arrayContaining([
        "id",
        "documentId",
        "versionNumber",
        "checksum",
        "quarantineKey",
        "acceptedKey",
        "safetyVerdict",
        "promotionState",
      ]),
    );
    expect([...recordColumns, ...versionColumns]).not.toEqual(
      expect.arrayContaining(["bytes", "content", "fileBytes", "objectData"]),
    );
  });

  it("separates requests, single-use upload intents and append-only audit evidence", () => {
    expect(Object.keys(documentRequests)).toEqual(expect.arrayContaining(["documentId", "state"]));
    expect(Object.keys(documentUploadIntents)).toEqual(
      expect.arrayContaining(["documentId", "objectKey", "consumedAt", "expiresAt"]),
    );
    expect(Object.keys(documentAuditEvents)).toEqual(
      expect.arrayContaining(["documentId", "eventName", "actorAccountId", "createdAt"]),
    );
  });
});
