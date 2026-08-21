import { digestOpaqueProof } from "./crypto.ts";
import { createOpaqueValue } from "./crypto.ts";

export type DurableOAuthTransactionRepository = Readonly<{
  issue(input: { readonly id: string; readonly purpose: "sign_in" | "link"; readonly provider: "google"; readonly stateDigest: string; readonly nonceDigest: string; readonly pkceVerifierDigest: string; readonly browserBindingDigest: string; readonly redirectHash: string; readonly returnIntent: string; readonly callbackUrl: string; readonly expiresAt: Date; readonly now: Date }): Promise<void>;
  consume(input: { readonly stateDigest: string; readonly nonceDigest: string; readonly pkceVerifierDigest: string; readonly browserBindingDigest: string; readonly redirectHash: string; readonly now: Date }): Promise<{ readonly kind: "consumed" | "denied" | "replay_denied" }>;
}>;

export function createDurableOAuthTransactionService(repository: DurableOAuthTransactionRepository, now = () => new Date()) {
  return {
    async begin(input: { readonly provider: "google"; readonly purpose: "sign_in" | "link"; readonly callbackUrl: string; readonly returnIntent: string; readonly browserBinding: string }) {
      if (!/^https:\/\/[^/?#]+\/api\/auth\/oauth\/google\/callback$/u.test(input.callbackUrl) || !/^\/(?!\/)[^\r\n]*$/u.test(input.returnIntent)) throw new Error("OAUTH_RETURN_INTENT_DENIED");
      const state = createOpaqueValue(); const nonce = createOpaqueValue(); const pkceVerifier = createOpaqueValue(); const id = createOpaqueValue(); const issuedAt = now();
      await repository.issue({ id, purpose: input.purpose, provider: input.provider, stateDigest: digestOpaqueProof(state), nonceDigest: digestOpaqueProof(nonce), pkceVerifierDigest: digestOpaqueProof(pkceVerifier), browserBindingDigest: digestOpaqueProof(input.browserBinding), redirectHash: digestOpaqueProof(input.callbackUrl), returnIntent: input.returnIntent, callbackUrl: input.callbackUrl, expiresAt: new Date(issuedAt.getTime() + 10 * 60_000), now: issuedAt });
      return { id, state, nonce, pkceVerifier };
    },
    async consume(input: { readonly state: string; readonly nonce: string; readonly pkceVerifier: string; readonly browserBinding: string; readonly callbackUrl: string }) {
      return repository.consume({ stateDigest: digestOpaqueProof(input.state), nonceDigest: digestOpaqueProof(input.nonce), pkceVerifierDigest: digestOpaqueProof(input.pkceVerifier), browserBindingDigest: digestOpaqueProof(input.browserBinding), redirectHash: digestOpaqueProof(input.callbackUrl), now: now() });
    },
  };
}
