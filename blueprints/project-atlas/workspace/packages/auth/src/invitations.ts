import type { MemoryAuthAccountRepository } from "./memory-repository.ts";

export class InvitationService {
  private sequence = 0;

  constructor(private readonly repository: MemoryAuthAccountRepository) {}

  async issue(command: { readonly intendedMembershipReceipt: string }): Promise<{ readonly id: string }> {
    const id = `invite_${++this.sequence}`;
    await this.repository.issueInvitation(id, command.intendedMembershipReceipt);
    return { id };
  }

  async consume(command: { readonly invitationId: string; readonly method: "GET" | "HEAD" | "POST" }): Promise<{ readonly kind: "inert" | "consumed" | "replay_denied" }> {
    if (command.method !== "POST") return { kind: "inert" };
    return { kind: await this.repository.consumeInvitation(command.invitationId) };
  }
}
