import { createOpaqueValue, digestOpaqueProof, hmacIdentifier } from "./crypto.ts";

export type VerifiedIdentityReceipt = Readonly<{
  issuer: string;
  audience: string;
  subject: string;
  expiresAt: number;
  verifiedAt: number;
}>;
type Session = {
  handleDigest: string;
  csrfDigest: string;
  familyId: string;
  subject: string | null;
  state: "preauth" | "active" | "rotated" | "revoked";
  generation: number;
  idleExpiresAt: number;
  absoluteExpiresAt: number;
  version: number;
};
export type DurableAuthTransaction = {
  sessions: Map<string, Session>;
  rates: Map<string, number>;
  audit: { event: string }[];
  outbox: { id: string; purpose: string; state: "pending" }[];
};
export interface DurableAuthRepository {
  transaction<T>(operation: (transaction: DurableAuthTransaction) => Promise<T>): Promise<T>;
}

export class MemoryDurableAuthRepository implements DurableAuthRepository {
  readonly sessions = new Map<string, Session>();
  readonly rates = new Map<string, number>();
  readonly auditEvents: { event: string }[] = [];
  readonly outboxCommands: { id: string; purpose: string; state: "pending" }[] = [];
  async transaction<T>(operation: (transaction: DurableAuthTransaction) => Promise<T>): Promise<T> {
    return operation({
      sessions: this.sessions,
      rates: this.rates,
      audit: this.auditEvents,
      outbox: this.outboxCommands,
    });
  }
}

export class AuthControlPlane {
  private readonly hmacKey: string;
  constructor(
    private readonly repository: DurableAuthRepository,
    options: { hmacKey?: string; issuer?: string; audience?: string } = {},
  ) {
    this.hmacKey = options.hmacKey ?? createOpaqueValue();
    this.issuer = options.issuer ?? "https://issuer.example";
    this.audience = options.audience ?? "atlas-app";
  }
  private readonly issuer: string;
  private readonly audience: string;

  async bootstrap(): Promise<{ handle: string; csrf: string }> {
    const handle = createOpaqueValue();
    const csrf = createOpaqueValue();
    const now = Date.now();
    await this.repository.transaction(async (transaction) => {
      transaction.sessions.set(digestOpaqueProof(handle), {
        handleDigest: digestOpaqueProof(handle),
        csrfDigest: digestOpaqueProof(csrf),
        familyId: createOpaqueValue(),
        subject: null,
        state: "preauth",
        generation: 0,
        idleExpiresAt: now + 15 * 60_000,
        absoluteExpiresAt: now + 15 * 60_000,
        version: 1,
      });
    });
    return { handle, csrf };
  }

  async establish(
    receipt: VerifiedIdentityReceipt,
    bootstrap: { handle: string; csrf: string },
  ): Promise<{ handle: string; csrf: string }> {
    if (
      receipt.issuer !== this.issuer ||
      receipt.audience !== this.audience ||
      !receipt.subject ||
      receipt.expiresAt <= Date.now() ||
      receipt.verifiedAt > Date.now()
    )
      throw new Error("IDENTITY_RECEIPT_DENIED");
    return this.repository.transaction(async (transaction) => {
      const previous = transaction.sessions.get(digestOpaqueProof(bootstrap.handle));
      if (
        !previous ||
        previous.state !== "preauth" ||
        previous.csrfDigest !== digestOpaqueProof(bootstrap.csrf) ||
        previous.absoluteExpiresAt <= Date.now()
      )
        throw new Error("PREAUTH_DENIED");
      previous.state = "revoked";
      const handle = createOpaqueValue();
      const csrf = createOpaqueValue();
      const now = Date.now();
      transaction.sessions.set(digestOpaqueProof(handle), {
        handleDigest: digestOpaqueProof(handle),
        csrfDigest: digestOpaqueProof(csrf),
        familyId: previous.familyId,
        subject: receipt.subject,
        state: "active",
        generation: 1,
        idleExpiresAt: now + 30 * 60_000,
        absoluteExpiresAt: now + 8 * 60 * 60_000,
        version: 1,
      });
      return { handle, csrf };
    });
  }

  async refresh(input: {
    handle: string;
    csrf: string;
  }): Promise<{ kind: "rotated"; handle: string; csrf: string } | { kind: "family_revoked" }> {
    return this.repository.transaction(async (transaction) => {
      const current = transaction.sessions.get(digestOpaqueProof(input.handle));
      const now = Date.now();
      if (
        !current ||
        current.csrfDigest !== digestOpaqueProof(input.csrf) ||
        current.state !== "active" ||
        current.idleExpiresAt <= now ||
        current.absoluteExpiresAt <= now
      ) {
        if (current) this.revokeFamily(transaction, current.familyId);
        return { kind: "family_revoked" };
      }
      current.state = "rotated";
      current.version += 1;
      const handle = createOpaqueValue();
      const csrf = createOpaqueValue();
      transaction.sessions.set(digestOpaqueProof(handle), {
        ...current,
        handleDigest: digestOpaqueProof(handle),
        csrfDigest: digestOpaqueProof(csrf),
        state: "active",
        generation: current.generation + 1,
        idleExpiresAt: now + 30 * 60_000,
        version: 1,
      });
      return { kind: "rotated", handle, csrf };
    });
  }

  async revoke(input: { handle: string; csrf: string }): Promise<{ kind: "revoked" | "denied" }> {
    return this.repository.transaction(async (transaction) => {
      const current = transaction.sessions.get(digestOpaqueProof(input.handle));
      if (!current || current.csrfDigest !== digestOpaqueProof(input.csrf))
        return { kind: "denied" };
      this.revokeFamily(transaction, current.familyId);
      return { kind: "revoked" };
    });
  }
  async authorize(input: {
    handle: string;
    csrf: string;
  }): Promise<{ kind: "allowed" | "denied" }> {
    return this.repository.transaction(async (transaction) => {
      const session = transaction.sessions.get(digestOpaqueProof(input.handle));
      return session?.state === "active" &&
        session.csrfDigest === digestOpaqueProof(input.csrf) &&
        session.idleExpiresAt > Date.now() &&
        session.absoluteExpiresAt > Date.now()
        ? { kind: "allowed" }
        : { kind: "denied" };
    });
  }
  async admit(input: {
    purpose: string;
    identifier: string;
  }): Promise<{ kind: "accepted" | "rate_limited" }> {
    return this.repository.transaction(async (transaction) => {
      const bucket = hmacIdentifier(this.hmacKey, input.purpose, input.identifier);
      const count = (transaction.rates.get(bucket) ?? 0) + 1;
      transaction.rates.set(bucket, count);
      if (count > 10) return { kind: "rate_limited" };
      transaction.audit.push({ event: `${input.purpose}_accepted` });
      transaction.outbox.push({
        id: createOpaqueValue(),
        purpose: input.purpose,
        state: "pending",
      });
      return { kind: "accepted" };
    });
  }
  private revokeFamily(transaction: DurableAuthTransaction, familyId: string): void {
    for (const session of transaction.sessions.values())
      if (session.familyId === familyId) session.state = "revoked";
  }
}
