import { createOpaqueValue, digestOpaqueProof } from "./crypto.ts";
export type DurableSessionRepository = Readonly<{
  create(input: {
    accountId: string;
    handleDigest: string;
    familyId: string;
    generation: number;
    assurance: "aal1" | "aal2";
    now: Date;
    idleExpiresAt: Date;
    absoluteExpiresAt: Date;
  }): Promise<void>;
  rotate(input: {
    handleDigest: string;
    next: { handleDigest: string; idleExpiresAt: Date };
    now: Date;
  }): Promise<"rotated" | "family_revoked">;
  revokeCurrent(handleDigest: string, now: Date): Promise<boolean>;
  revokeOthers(handleDigest: string, now: Date): Promise<boolean>;
  listActive(
    handleDigest: string,
    now: Date,
  ): Promise<
    readonly { id: string; createdAt: Date; idleExpiresAt: Date; assurance: "aal1" | "aal2" }[]
  >;
}>;

export function createDurableSessionService(
  repository: DurableSessionRepository,
  now = () => new Date(),
) {
  const expiry = (issued: Date) => ({
    idleExpiresAt: new Date(issued.getTime() + 30 * 60_000),
    absoluteExpiresAt: new Date(issued.getTime() + 8 * 60 * 60_000),
  });
  return {
    async create(input: { accountId: string; assurance: "aal1" | "aal2" }) {
      const issued = now();
      const handle = createOpaqueValue();
      const familyId = createOpaqueValue();
      await repository.create({
        accountId: input.accountId,
        handleDigest: digestOpaqueProof(handle),
        familyId,
        generation: 1,
        assurance: input.assurance,
        now: issued,
        ...expiry(issued),
      });
      return { handle };
    },
    async rotate(input: { handle: string }) {
      const issued = now();
      const handle = createOpaqueValue();
      const result = await repository.rotate({
        handleDigest: digestOpaqueProof(input.handle),
        next: {
          handleDigest: digestOpaqueProof(handle),
          idleExpiresAt: expiry(issued).idleExpiresAt,
        },
        now: issued,
      });
      return result === "rotated"
        ? { kind: "rotated" as const, handle }
        : { kind: "family_revoked" as const };
    },
    async revokeCurrent(handle: string) {
      return repository.revokeCurrent(digestOpaqueProof(handle), now());
    },
    async revokeOthers(handle: string) {
      return repository.revokeOthers(digestOpaqueProof(handle), now());
    },
    async listActive(handle: string) {
      return repository.listActive(digestOpaqueProof(handle), now());
    },
  };
}
type SessionRecord = {
  accountId: string;
  familyId: string;
  handleDigest: string;
  generation: number;
  state: "active" | "rotated" | "revoked";
  idleExpiresAt: number;
  absoluteExpiresAt: number;
};

export class MemorySessionStore {
  readonly sessions = new Map<string, SessionRecord>();
  create(
    accountId: string,
    familyId = createOpaqueValue(),
    generation = 1,
  ): { handle: string; record: SessionRecord } {
    const handle = createOpaqueValue();
    const record: SessionRecord = {
      accountId,
      familyId,
      handleDigest: digestOpaqueProof(handle),
      generation,
      state: "active",
      idleExpiresAt: Date.now() + 30 * 60_000,
      absoluteExpiresAt: Date.now() + 8 * 60 * 60_000,
    };
    this.sessions.set(handle, record);
    return { handle, record };
  }

  revokeFamily(familyId: string): void {
    for (const record of this.sessions.values())
      if (record.familyId === familyId) record.state = "revoked";
  }
}

export class ApplicationSessionService {
  constructor(private readonly store: MemorySessionStore) {}

  async establish(input: { readonly accountId: string }): Promise<{ readonly handle: string }> {
    return { handle: this.store.create(input.accountId).handle };
  }

  async refresh(
    handle: string,
  ): Promise<
    { readonly kind: "refreshed"; readonly handle: string } | { readonly kind: "family_revoked" }
  > {
    const current = this.store.sessions.get(handle);
    if (
      !current ||
      current.state !== "active" ||
      current.idleExpiresAt <= Date.now() ||
      current.absoluteExpiresAt <= Date.now()
    ) {
      if (current) this.store.revokeFamily(current.familyId);
      return { kind: "family_revoked" };
    }
    current.state = "rotated";
    return {
      kind: "refreshed",
      handle: this.store.create(current.accountId, current.familyId, current.generation + 1).handle,
    };
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
