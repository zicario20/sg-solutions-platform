import { digestOpaqueProof } from "./crypto.ts";

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
