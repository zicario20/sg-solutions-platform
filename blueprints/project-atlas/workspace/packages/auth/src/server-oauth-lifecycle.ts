type Identity = {
  subject: string;
  emailVerified: boolean;
  issuer: string;
  audience: string;
  expiresAt: number;
};
type Options = {
  enabled: boolean;
  issuer: string;
  audience: string;
  transactions: {
    begin(): Promise<{ state: string; nonce: string; pkceVerifier: string }>;
    consume(input: {
      state: string;
      nonce: string;
      pkceVerifier: string;
    }): Promise<{ kind: "consumed" | "denied" | "replay_denied" }>;
  };
  verify(input: {
    state: string;
    nonce: string;
    pkceVerifier: string;
  }): Promise<Identity | undefined>;
  identities: {
    resolve(identity: Identity): Promise<{ accountId: string; crm: "linked" | "manual_review" }>;
  };
  sessions: {
    create(input: { accountId: string; assurance: "aal1" }): Promise<{ handle: string }>;
  };
};
export function createServerOAuthLifecycle(options: Options) {
  return {
    async start() {
      return options.enabled
        ? { kind: "started" as const, ...(await options.transactions.begin()) }
        : { kind: "unavailable" as const };
    },
    async callback(input: { state: string; nonce: string; pkceVerifier: string }) {
      if (!options.enabled) return { kind: "unavailable" as const };
      const identity = await options.verify(input);
      if (
        !identity?.subject ||
        !identity.emailVerified ||
        identity.issuer !== options.issuer ||
        identity.audience !== options.audience ||
        identity.expiresAt <= Date.now()
      )
        return { kind: "denied" as const };
      const transaction = await options.transactions.consume(input);
      if (transaction.kind !== "consumed") return { kind: "denied" as const };
      const account = await options.identities.resolve(identity);
      if (account.crm !== "linked") return { kind: "manual_review" as const };
      return {
        kind: "authenticated" as const,
        handle: (await options.sessions.create({ accountId: account.accountId, assurance: "aal1" }))
          .handle,
      };
    },
  };
}
