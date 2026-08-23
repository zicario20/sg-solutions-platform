import { describe, expect, it } from "vitest";
import {
  createDevelopmentMessageCipher,
  MemoryMessagingRepository,
  SecureMessagingService,
} from "@atlas/secure-messaging";

const actor = {
  accountId: "account-a",
  contextRef: "ctx-a",
  assurance: "aal2" as const,
  authorizationEpoch: "2",
  policyEpoch: "3",
};
describe("M012 inbox and audit", () => {
  it("lists only the caller context and minimizes previews", async () => {
    const service = new SecureMessagingService({
      repository: new MemoryMessagingRepository(),
      cipher: createDevelopmentMessageCipher(),
      now: () => new Date("2026-08-23T12:00:00.000Z"),
    });
    const conversation = await service.createConversation({
      actor,
      subject: "Tax question",
      reason: "general_question",
      locale: "en",
    });
    await service.sendClientMessage({
      actor,
      conversationRef: conversation.opaqueRef,
      body: "My private tax details must not be listed",
    });
    const inbox = await service.listClientInbox({ actor });
    expect(inbox.kind).toBe("found");
    if (inbox.kind === "found") {
      expect(inbox.items).toHaveLength(1);
      expect(inbox.items[0]?.preview).not.toContain("private tax details");
    }
  });
  it("records an audit event and permits only opaque M011 references", async () => {
    const service = new SecureMessagingService({
      repository: new MemoryMessagingRepository(),
      cipher: createDevelopmentMessageCipher(),
    });
    const conversation = await service.createConversation({
      actor,
      subject: "Document",
      reason: "document_question",
      locale: "en",
    });
    await expect(
      service.attachDocumentReference({
        actor,
        conversationRef: conversation.opaqueRef,
        documentRef: "bad-key",
      }),
    ).resolves.toEqual({ kind: "not_found" });
    expect(
      (await service.auditFor(conversation.opaqueRef)).some(
        (event) => event.action === "conversation_created",
      ),
    ).toBe(true);
  });
});
