import { digestOpaqueProof } from "./crypto.ts";
import { createOpaqueValue } from "./crypto.ts";

type Transaction = { state: string; nonce: string; pkceVerifierDigest: string; browserBinding: string; returnIntent: string; consumed: boolean };

export class OAuthTransactionService {
  private readonly transactions = new Map<string, Transaction>();
  private sequence = 0;

  async begin(input: { readonly browserBinding: string; readonly returnIntent: string }): Promise<{ readonly id: string; readonly state: string; readonly nonce: string; readonly pkceVerifierDigest: string; readonly browserBinding: string; readonly returnIntent: string }> {
    if (!input.returnIntent.startsWith("/")) throw new Error("OAUTH_RETURN_INTENT_DENIED");
    const id = `oauth_${++this.sequence}`;
    const state = `state_${id}`;
    const nonce = `nonce_${id}`;
    const transaction = { state, nonce, pkceVerifierDigest: digestOpaqueProof(`pkce_${id}`), browserBinding: input.browserBinding, returnIntent: input.returnIntent, consumed: false };
    this.transactions.set(id, transaction);
    return { id, ...transaction };
  }

  async consume(input: { readonly id: string; readonly state: string; readonly nonce: string; readonly pkceVerifierDigest: string; readonly browserBinding: string; readonly returnIntent: string }): Promise<{ readonly kind: "consumed" | "denied" | "replay_denied" }> {
    const transaction = this.transactions.get(input.id);
    if (!transaction || transaction.state !== input.state || transaction.nonce !== input.nonce || transaction.pkceVerifierDigest !== input.pkceVerifierDigest || transaction.browserBinding !== input.browserBinding || transaction.returnIntent !== input.returnIntent) return { kind: "denied" };
    if (transaction.consumed) return { kind: "replay_denied" };
    transaction.consumed = true;
    return { kind: "consumed" };
  }
}

type SecureTransaction = { provider: "google"; purpose: "sign_in" | "link"; callbackUrl: string; returnIntent: string; browserBindingDigest: string; stateDigest: string; nonceDigest: string; pkceVerifierDigest: string; expiresAt: number; consumed: boolean };
export function createSecureOAuthTransactionService() {
  const transactions = new Map<string, SecureTransaction>();
  return {
    async begin(input: { provider: "google"; purpose: "sign_in" | "link"; callbackUrl: string; returnIntent: string; browserBinding: string }) {
      if (!/^https:\/\/[^/?#]+\/api\/auth\/oauth\/google\/callback$/u.test(input.callbackUrl) || !/^\/(?!\/)[^\r\n]*$/u.test(input.returnIntent)) throw new Error("OAUTH_RETURN_INTENT_DENIED");
      const state = createOpaqueValue(); const nonce = createOpaqueValue(); const pkceVerifier = createOpaqueValue(); const id = createOpaqueValue();
      transactions.set(id, { provider: input.provider, purpose: input.purpose, callbackUrl: input.callbackUrl, returnIntent: input.returnIntent, browserBindingDigest: digestOpaqueProof(input.browserBinding), stateDigest: digestOpaqueProof(state), nonceDigest: digestOpaqueProof(nonce), pkceVerifierDigest: digestOpaqueProof(pkceVerifier), expiresAt: Date.now() + 10 * 60_000, consumed: false });
      return { id, state, nonce, pkceVerifier };
    },
    async consume(input: { id: string; state: string; nonce: string; pkceVerifier: string; browserBinding: string }) {
      const transaction = transactions.get(input.id);
      if (!transaction || transaction.consumed || transaction.expiresAt <= Date.now()) return { kind: "replay_denied" as const };
      if (transaction.stateDigest !== digestOpaqueProof(input.state) || transaction.nonceDigest !== digestOpaqueProof(input.nonce) || transaction.pkceVerifierDigest !== digestOpaqueProof(input.pkceVerifier) || transaction.browserBindingDigest !== digestOpaqueProof(input.browserBinding)) return { kind: "denied" as const };
      transaction.consumed = true; return { kind: "consumed" as const };
    },
  };
}
