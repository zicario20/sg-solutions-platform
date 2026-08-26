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

/** CRM evidence is issued and looked up server-side; browser requests carry only this opaque ID. */
export interface CrmEvidenceStore {
  loadCrmReceipt(
    evidenceId: string,
  ): Promise<{ readonly evidenceId: string; readonly verifiedAt: number } | undefined>;
}

export class PartyLinkingService {
  constructor(
    private readonly owner?: PartyResolutionPort,
    private readonly evidence?: CrmEvidenceStore,
  ) {}
  async resolve(resolution: PartyResolution): Promise<AccountPartyLinkDecision> {
    if (resolution.kind === "linked") return resolution;
    if (resolution.kind === "unavailable") return { kind: "limited" };
    return { kind: "manual_review" };
  }

  async link(input: { accountId: string; evidenceId: string }): Promise<AccountPartyLinkDecision> {
    if (!this.owner || !this.evidence || !input.accountId || !input.evidenceId)
      return { kind: "manual_review" };
    const receipt = await this.evidence.loadCrmReceipt(input.evidenceId);
    if (!receipt) return { kind: "manual_review" };
    return this.resolve(await this.owner.resolve(receipt));
  }
}
