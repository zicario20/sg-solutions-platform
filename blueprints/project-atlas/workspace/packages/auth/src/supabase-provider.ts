import { createDisabledIdentityProvider } from "./disabled-provider.ts";

type VerifiedGoogleIdentity = { issuer: string; audience: string; subject: string; emailVerified: boolean; expiresAt: number; signatureValid: boolean; stateValid: boolean; nonceValid: boolean; pkceValid: boolean; redirectValid: boolean };
type SupabaseAdapterOptions = { runtimeState: "disabled" | "enabled"; issuer?: string; audience?: string; verifyGoogleIdentity?: (input: unknown) => Promise<VerifiedGoogleIdentity | undefined> };

export function createSupabaseIdentityProvider(options: SupabaseAdapterOptions) {
  return {
    async completeGoogle(input: unknown): Promise<{ kind: "unavailable"; reason: "provider_disabled" } | { kind: "denied" } | { kind: "verified"; subject: string }> {
      if (options.runtimeState !== "enabled") return { kind: "unavailable", reason: "provider_disabled" };
      const verified = await options.verifyGoogleIdentity?.(input);
      if (!verified || !options.issuer || !options.audience || verified.issuer !== options.issuer || verified.audience !== options.audience || !verified.subject || !verified.emailVerified || !verified.signatureValid || !verified.stateValid || !verified.nonceValid || !verified.pkceValid || !verified.redirectValid || verified.expiresAt <= Date.now()) return { kind: "denied" };
      return { kind: "verified", subject: verified.subject };
    },
  };
}

export type OfficialSupabaseIdentity = Readonly<{ issuer: string; audience: string; subject: string; emailVerified: true; expiresAt: number; transactionId: string; provider: "google" }>;
export function createOfficialSupabaseIdentityProvider(options: { runtimeState: "disabled" | "enabled"; issuer?: string; audience?: string; verifyWithJwks?: (input: { state: string; nonce: string; pkceVerifier: string }) => Promise<OfficialSupabaseIdentity | undefined>; consumeTransaction?: (input: { state: string; nonce: string; pkceVerifier: string }) => Promise<{ kind: "consumed" | "denied" | "replay_denied" }> }) {
  return {
    async completeGoogle(input: { state?: string; nonce?: string; pkceVerifier?: string }): Promise<{ kind: "unavailable"; reason: "provider_disabled" } | { kind: "denied" } | { kind: "verified"; subject: string }> {
      if (options.runtimeState !== "enabled") return { kind: "unavailable", reason: "provider_disabled" };
      if (!input.state || !input.nonce || !input.pkceVerifier || !options.issuer || !options.audience || !options.verifyWithJwks || !options.consumeTransaction) return { kind: "denied" };
      const transaction = await options.consumeTransaction({ state: input.state, nonce: input.nonce, pkceVerifier: input.pkceVerifier });
      if (transaction.kind !== "consumed") return { kind: "denied" };
      const identity = await options.verifyWithJwks({ state: input.state, nonce: input.nonce, pkceVerifier: input.pkceVerifier });
      if (!identity || identity.provider !== "google" || identity.issuer !== options.issuer || identity.audience !== options.audience || !identity.subject || !identity.emailVerified || identity.expiresAt <= Date.now()) return { kind: "denied" };
      return { kind: "verified", subject: identity.subject };
    },
  };
}

export class SupabaseIdentityProvider {
  async beginGoogle(): Promise<{ readonly kind: "unavailable"; readonly reason: "provider_disabled" }> {
    return { kind: "unavailable", reason: "provider_disabled" };
  }

  async completeGoogle() {
    return createDisabledIdentityProvider().signInWithPassword({ email: "disabled@example.invalid", password: "disabled" });
  }
}
