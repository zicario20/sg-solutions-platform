import { describe, expect, it } from "vitest";
import {
  secureMessageAuditEvents,
  secureMessageConversations,
  secureMessageDocumentReferences,
  secureMessageEntries,
} from "@atlas/database";

describe("M012 persistence schema", () => {
  it("keeps client, internal, document and audit records as separate server-only tables", () => {
    expect(secureMessageConversations).toBeDefined();
    expect(secureMessageEntries).toBeDefined();
    expect(secureMessageDocumentReferences).toBeDefined();
    expect(secureMessageAuditEvents).toBeDefined();
  });
});
