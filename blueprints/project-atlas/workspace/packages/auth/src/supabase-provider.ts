import { createDisabledIdentityProvider } from "./disabled-provider.ts";

export type OfficialSupabaseIdentity = Readonly<{
  issuer: string;
  audience: string;
  subject: string;
  emailVerified: true;
  expiresAt: number;
  transactionId: string;
  provider: "google";
}>;
export function createOfficialSupabaseIdentityProvider(options: {
  runtimeState: "disabled" | "enabled";
  issuer?: string;
  audience?: string;
  verifyWithJwks?: (input: {
    state: string;
    nonce: string;
    pkceVerifier: string;
  }) => Promise<OfficialSupabaseIdentity | undefined>;
  consumeTransaction?: (input: {
    state: string;
    nonce: string;
    pkceVerifier: string;
  }) => Promise<{ kind: "consumed" | "denied" | "replay_denied" }>;
}) {
  return {
    async completeGoogle(input: {
      state?: string;
      nonce?: string;
      pkceVerifier?: string;
    }): Promise<
      | { kind: "unavailable"; reason: "provider_disabled" }
      | { kind: "denied" }
      | { kind: "verified"; subject: string }
    > {
      if (options.runtimeState !== "enabled")
        return { kind: "unavailable", reason: "provider_disabled" };
      if (
        !input.state ||
        !input.nonce ||
        !input.pkceVerifier ||
        !options.issuer ||
        !options.audience ||
        !options.verifyWithJwks ||
        !options.consumeTransaction
      )
        return { kind: "denied" };
      const transaction = await options.consumeTransaction({
        state: input.state,
        nonce: input.nonce,
        pkceVerifier: input.pkceVerifier,
      });
      if (transaction.kind !== "consumed") return { kind: "denied" };
      const identity = await options.verifyWithJwks({
        state: input.state,
        nonce: input.nonce,
        pkceVerifier: input.pkceVerifier,
      });
      if (
        identity?.provider !== "google" ||
        identity.issuer !== options.issuer ||
        identity.audience !== options.audience ||
        !identity.subject ||
        !identity.emailVerified ||
        identity.expiresAt <= Date.now()
      )
        return { kind: "denied" };
      return { kind: "verified", subject: identity.subject };
    },
  };
}

/** Compatibility name for the official adapter. It accepts only server-owned verifier/transaction ports. */
export const createSupabaseIdentityProvider = createOfficialSupabaseIdentityProvider;

export class SupabaseIdentityProvider {
  async beginGoogle(): Promise<{
    readonly kind: "unavailable";
    readonly reason: "provider_disabled";
  }> {
    return { kind: "unavailable", reason: "provider_disabled" };
  }

  async completeGoogle() {
    return createDisabledIdentityProvider().signInWithPassword({
      email: "disabled@example.invalid",
      password: "disabled",
    });
  }
}
