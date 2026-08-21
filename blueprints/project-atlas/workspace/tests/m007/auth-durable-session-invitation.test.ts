import { createDurableInvitationService, createDurableSessionService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 durable sessions and invitations", () => {
  it("rotates a durable session and revokes its family when an old handle replays", async () => {
    const rows = new Map<string, { familyId: string; state: string }>();
    const sessions = createDurableSessionService({ create: async (input) => { rows.set(input.handleDigest, { familyId: input.familyId, state: "active" }); }, rotate: async (input) => { const row = rows.get(input.handleDigest); if (!row || row.state !== "active") return "family_revoked"; row.state = "rotated"; rows.set(input.next.handleDigest, { familyId: row.familyId, state: "active" }); return "rotated"; }, revokeCurrent: async () => true, revokeOthers: async () => true, listActive: async () => [] });
    const issued = await sessions.create({ accountId: "a", assurance: "aal1" });
    const rotated = await sessions.rotate({ handle: issued.handle });
    expect(rotated.kind).toBe("rotated");
    await expect(sessions.rotate({ handle: issued.handle })).resolves.toEqual({ kind: "family_revoked" });
  });

  it("consumes an invitation only once for the bound identity, contact and scope", async () => {
    let used = false;
    const invitations = createDurableInvitationService({ issue: async () => undefined, consume: async (input) => input.identityEvidenceId === "identity-1" && input.contactId === "contact-1" && input.scope === "org:read" && !used ? (used = true, { kind: "consumed" }) : { kind: "manual_review" } });
    const invitation = await invitations.issue({ contactId: "contact-1", scope: "org:read", inviterAccountId: "inviter" });
    await expect(invitations.consume({ ...invitation, identityEvidenceId: "identity-1", contactId: "contact-1", scope: "org:read" })).resolves.toEqual({ kind: "consumed" });
    await expect(invitations.consume({ ...invitation, identityEvidenceId: "identity-1", contactId: "contact-1", scope: "org:read" })).resolves.toEqual({ kind: "manual_review" });
  });
});
