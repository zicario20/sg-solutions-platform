import type { AuthAccountRecord, MemoryAuthAccountRepository } from "./memory-repository.ts";

export class AccountService {
  constructor(private readonly repository: MemoryAuthAccountRepository) {}

  async registerProspect(command: { readonly subject: string; readonly verifiedSubjectReceipt?: { readonly subject: string; readonly verifiedAt: number } }): Promise<(AuthAccountRecord & { readonly resourceGrants: readonly string[] }) | { readonly kind: "denied" }> {
    if (!command.verifiedSubjectReceipt || command.verifiedSubjectReceipt.subject !== command.subject || !Number.isFinite(command.verifiedSubjectReceipt.verifiedAt)) return { kind: "denied" };
    const account = await this.repository.createProspect(command.verifiedSubjectReceipt.subject);
    return { ...account, resourceGrants: [] };
  }
}
