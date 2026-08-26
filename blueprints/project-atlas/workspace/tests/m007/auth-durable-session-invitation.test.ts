import { createDurableInvitationService, createDurableSessionService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 durable sessions and invitations", () => {
  it("rotates a durable session and revokes its family when an old handle replays", async () => {
    const rows = new Map<string, { familyId: string; state: string }>();
    const sessions = createDurableSessionService({
      create: async (input) => {
        rows.set(input.handleDigest, { familyId: input.familyId, state: "active" });
      },
      rotate: async (input) => {
        const row = rows.get(input.handleDigest);
        if (!row || row.state !== "active") return "family_revoked";
        row.state = "rotated";
        rows.set(input.next.handleDigest, { familyId: row.familyId, state: "active" });
        return "rotated";
      },
      revokeCurrent: async () => true,
      revokeOthers: async () => true,
      listActive: async () => [],
    });
    const issued = await sessions.create({ accountId: "a", assurance: "aal1" });
    const rotated = await sessions.rotate({ handle: issued.handle });
    expect(rotated.kind).toBe("rotated");
    await expect(sessions.rotate({ handle: issued.handle })).resolves.toEqual({
      kind: "family_revoked",
    });
  });

  it("consumes an invitation only once through the bound durable invitation repository", async () => {
    let used = false;
    const invitations = createDurableInvitationService({
      issue: async () => undefined,
      consume: async (input) => {
        const canConsume =
          input.id.length > 0 &&
          input.proofDigest.length > 0 &&
          input.sessionHandleDigest.length > 0 &&
          !used;
        if (!canConsume) return { kind: "manual_review" };
        used = true;
        return { kind: "consumed" };
      },
    });
    const invitation = await invitations.issue({
      contactId: "contact-1",
      scope: "org:read",
      inviterAccountId: "inviter",
      expectedProviderSubject: "subject-1",
    });
    await expect(
      invitations.consume({ ...invitation, sessionHandle: "session-1" }),
    ).resolves.toEqual({ kind: "consumed" });
    await expect(
      invitations.consume({ ...invitation, sessionHandle: "session-1" }),
    ).resolves.toEqual({ kind: "manual_review" });
  });
});
