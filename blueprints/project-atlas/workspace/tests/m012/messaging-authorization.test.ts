import { describe, expect, it } from "vitest";
import { authorizeConversation, SecureMessagingService, MemoryMessagingRepository } from "@atlas/secure-messaging";

const actor = { accountId: "account-a", contextRef: "ctx-a", assurance: "aal2" as const, authorizationEpoch: "2", policyEpoch: "3" };

describe("M012 secure messaging authorization", () => {
  it("denies another client even when it knows the conversation reference", () => {
    expect(authorizeConversation({ ...actor, accountId: "account-b" }, { ownerAccountId: "account-a", contextRef: "ctx-a", authorizationEpoch: "2", policyEpoch: "3", clientVisible: true })).toBe(false);
  });

  it("never projects an internal note into the client conversation", async () => {
    const service = new SecureMessagingService({ repository: new MemoryMessagingRepository(), now: () => new Date("2026-08-23T12:00:00.000Z") });
    const conversation = await service.createConversation({ actor, subject: "Document question", reason: "document_question", locale: "en" });
    await service.addInternalNote({ actorAccountId: "staff-a", conversationRef: conversation.opaqueRef, body: "Do not expose this note" });
    await service.sendClientMessage({ actor, conversationRef: conversation.opaqueRef, body: "Can you help me?" });
    const projection = await service.getClientConversation({ actor, conversationRef: conversation.opaqueRef });
    expect(projection.kind).toBe("found");
    if (projection.kind === "found") expect(JSON.stringify(projection)).not.toContain("Do not expose");
  });
});
