export type PartyResolution =
  | { readonly kind: "linked"; readonly relationshipReceipt: string }
  | { readonly kind: "possible_match" }
  | { readonly kind: "conflict" }
  | { readonly kind: "unavailable" };

export type AccountPartyLinkDecision =
  | { readonly kind: "linked"; readonly relationshipReceipt: string }
  | { readonly kind: "manual_review" }
  | { readonly kind: "limited" };

export interface PartyResolutionPort {
  resolve(evidence: unknown): Promise<PartyResolution>;
}

export class PartyLinkingService {
  constructor(private readonly owner?: PartyResolutionPort) {}
  async resolve(resolution: PartyResolution): Promise<AccountPartyLinkDecision> {
    if (resolution.kind === "linked") return resolution;
    if (resolution.kind === "unavailable") return { kind: "limited" };
    return { kind: "manual_review" };
  }

  async link(input: { accountId: string; evidence: unknown }): Promise<AccountPartyLinkDecision> {
    if (!this.owner || !input.accountId) return { kind: "manual_review" };
    return this.resolve(await this.owner.resolve(input.evidence));
  }
}
