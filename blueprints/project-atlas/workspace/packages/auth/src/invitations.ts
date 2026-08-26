import { createOpaqueValue, digestOpaqueProof } from "./crypto.ts";
import type { MemoryAuthAccountRepository } from "./memory-repository.ts";

export type DurableInvitationRepository = Readonly<{
  issue(input: {
    id: string;
    proofDigest: string;
    contactId: string;
    scope: string;
    inviterAccountId: string;
    expectedProviderSubject: string;
    expiresAt: Date;
    now: Date;
  }): Promise<void>;
  consume(input: {
    id: string;
    proofDigest: string;
    sessionHandleDigest: string;
    now: Date;
  }): Promise<{ kind: "consumed" | "manual_review" }>;
}>;
export function createDurableInvitationService(
  repository: DurableInvitationRepository,
  now = () => new Date(),
) {
  return {
    async issue(input: {
      contactId: string;
      scope: string;
      inviterAccountId: string;
      expectedProviderSubject: string;
    }) {
      const id = createOpaqueValue();
      const proof = createOpaqueValue();
      const issued = now();
      await repository.issue({
        id,
        proofDigest: digestOpaqueProof(proof),
        ...input,
        expiresAt: new Date(issued.getTime() + 15 * 60_000),
        now: issued,
      });
      return { id, proof };
    },
    async consume(input: { id: string; proof: string; sessionHandle: string }) {
      return repository.consume({
        id: input.id,
        proofDigest: digestOpaqueProof(input.proof),
        sessionHandleDigest: digestOpaqueProof(input.sessionHandle),
        now: now(),
      });
    },
  };
}

export class InvitationService {
  private sequence = 0;

  constructor(private readonly repository: MemoryAuthAccountRepository) {}

  async issue(command: {
    readonly intendedMembershipReceipt: string;
  }): Promise<{ readonly id: string }> {
    const id = `invite_${++this.sequence}`;
    await this.repository.issueInvitation(id, command.intendedMembershipReceipt);
    return { id };
  }

  async consume(command: {
    readonly invitationId: string;
    readonly method: "GET" | "HEAD" | "POST";
  }): Promise<{ readonly kind: "inert" | "consumed" | "replay_denied" }> {
    if (command.method !== "POST") return { kind: "inert" };
    return { kind: await this.repository.consumeInvitation(command.invitationId) };
  }
}

export function createSecureInvitationService() {
  const invitations = new Map<
    string,
    { proofDigest: string; expiresAt: number; consumed: boolean; intendedReceipt: string }
  >();
  return {
    async issue(input: { intendedMembershipReceipt: string }) {
      const proof = createOpaqueValue();
      const id = createOpaqueValue();
      invitations.set(id, {
        proofDigest: digestOpaqueProof(proof),
        expiresAt: Date.now() + 15 * 60_000,
        consumed: false,
        intendedReceipt: input.intendedMembershipReceipt,
      });
      return { id, proof };
    },
    async consume(input: { id: string; proof: string; method: "POST" | "GET" }) {
      const invitation = invitations.get(input.id);
      if (input.method !== "POST") return { kind: "inert" as const };
      if (
        !invitation ||
        invitation.consumed ||
        invitation.expiresAt <= Date.now() ||
        invitation.proofDigest !== digestOpaqueProof(input.proof)
      )
        return { kind: "replay_denied" as const };
      invitation.consumed = true;
      return { kind: "consumed" as const };
    },
  };
}
