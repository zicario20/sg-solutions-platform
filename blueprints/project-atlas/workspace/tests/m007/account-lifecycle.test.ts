import { AccountService, InvitationService, MemoryAuthAccountRepository } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 account lifecycle", () => {
  it("registers a limited prospect without protected resource grants", async () => {
    const repository = new MemoryAuthAccountRepository();
    const service = new AccountService(repository, {
      loadSupabaseReceipt: async () => ({
        subject: "subject-1",
        verifiedAt: Date.now(),
        issuer: "supabase",
      }),
    });

    await expect(
      service.registerProspect({ subject: "subject-1", evidenceId: "supabase-evidence-1" }),
    ).resolves.toMatchObject({
      resourceGrants: [],
      status: "pending_verification",
    });
  });

  it("keeps scanner GET invitation attempts inert", async () => {
    const invitations = new InvitationService(new MemoryAuthAccountRepository());
    const invitation = await invitations.issue({ intendedMembershipReceipt: "receipt-1" });

    await expect(
      invitations.consume({ invitationId: invitation.id, method: "GET" }),
    ).resolves.toEqual({
      kind: "inert",
    });
  });
});
