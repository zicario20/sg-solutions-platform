import type { AuthAccountRecord, MemoryAuthAccountRepository } from "./memory-repository.ts";

export type SupabaseEvidenceStore = Readonly<{ loadSupabaseReceipt(evidenceId: string): Promise<{ readonly subject: string; readonly verifiedAt: number; readonly issuer: "supabase" } | undefined> }>;

export class AccountService {
  constructor(private readonly repository: MemoryAuthAccountRepository, private readonly evidence?: SupabaseEvidenceStore) {}

  async registerProspect(command: { readonly subject: string; readonly evidenceId: string }): Promise<(AuthAccountRecord & { readonly resourceGrants: readonly string[] }) | { readonly kind: "denied" }> {
    const receipt = this.evidence && command.evidenceId ? await this.evidence.loadSupabaseReceipt(command.evidenceId) : undefined;
    if (!receipt || receipt.subject !== command.subject || !Number.isFinite(receipt.verifiedAt)) return { kind: "denied" };
    const account = await this.repository.createProspect(receipt.subject);
    return { ...account, resourceGrants: [] };
  }
}
