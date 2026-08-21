import type { AuthAccountRecord, MemoryAuthAccountRepository } from "./memory-repository.ts";

export class AccountService {
  constructor(private readonly repository: MemoryAuthAccountRepository) {}

  async registerProspect(command: { readonly subject: string }): Promise<AuthAccountRecord & { readonly resourceGrants: readonly string[] }> {
    const account = await this.repository.createProspect(command.subject);
    return { ...account, resourceGrants: [] };
  }
}
