import type { AuthAccountStatus } from "./contracts.ts";

export type AuthAccountRecord = Readonly<{
  id: string;
  subject: string;
  status: AuthAccountStatus;
  version: number;
}>;

export class MemoryAuthAccountRepository {
  private readonly accounts = new Map<string, AuthAccountRecord>();
  private readonly invitations = new Map<
    string,
    { readonly receipt: string; consumed: boolean; revoked: boolean }
  >();

  async createProspect(subject: string): Promise<AuthAccountRecord> {
    const existing = this.accounts.get(subject);
    if (existing) return existing;
    const account = Object.freeze({
      id: `account_${subject}`,
      subject,
      status: "pending_verification" as const,
      version: 1,
    });
    this.accounts.set(subject, account);
    return account;
  }

  async issueInvitation(id: string, intendedMembershipReceipt: string): Promise<void> {
    this.invitations.set(id, {
      receipt: intendedMembershipReceipt,
      consumed: false,
      revoked: false,
    });
  }

  async consumeInvitation(id: string): Promise<"consumed" | "replay_denied"> {
    const invitation = this.invitations.get(id);
    if (!invitation || invitation.consumed || invitation.revoked) return "replay_denied";
    invitation.consumed = true;
    return "consumed";
  }
}
