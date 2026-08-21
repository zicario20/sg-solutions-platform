type SessionRecord = { accountId: string; familyId: string; generation: number; state: "active" | "rotated" | "revoked" };

export class MemorySessionStore {
  readonly sessions = new Map<string, SessionRecord>();
  private nextId = 0;

  create(accountId: string, familyId = `family_${++this.nextId}`, generation = 1): { handle: string; record: SessionRecord } {
    const handle = `session_${++this.nextId}`;
    const record: SessionRecord = { accountId, familyId, generation, state: "active" };
    this.sessions.set(handle, record);
    return { handle, record };
  }

  revokeFamily(familyId: string): void {
    for (const record of this.sessions.values()) if (record.familyId === familyId) record.state = "revoked";
  }
}

export class ApplicationSessionService {
  constructor(private readonly store: MemorySessionStore) {}

  async establish(input: { readonly accountId: string }): Promise<{ readonly handle: string }> {
    return { handle: this.store.create(input.accountId).handle };
  }

  async refresh(handle: string): Promise<{ readonly kind: "refreshed"; readonly handle: string } | { readonly kind: "family_revoked" }> {
    const current = this.store.sessions.get(handle);
    if (!current || current.state !== "active") {
      if (current) this.store.revokeFamily(current.familyId);
      return { kind: "family_revoked" };
    }
    current.state = "rotated";
    return { kind: "refreshed", handle: this.store.create(current.accountId, current.familyId, current.generation + 1).handle };
  }

  async revoke(handle: string): Promise<void> {
    const session = this.store.sessions.get(handle);
    if (session) session.state = "revoked";
  }

  async revokeOthers(handle: string): Promise<void> {
    const session = this.store.sessions.get(handle);
    if (!session) return;
    for (const [candidate, record] of this.store.sessions) {
      if (candidate !== handle && record.accountId === session.accountId) record.state = "revoked";
    }
  }
}
