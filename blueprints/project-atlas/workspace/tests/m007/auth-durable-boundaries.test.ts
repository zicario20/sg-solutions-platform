import { AccountService, createDurableOAuthTransactionService, PartyLinkingService } from "@atlas/auth";
import { resolveAuthLocale } from "@atlas/i18n";
import { describe, expect, it } from "vitest";

describe("M007 durable server boundaries", () => {
  it("persists OAuth digests and atomically denies a second callback", async () => {
    let issued: Record<string, unknown> | undefined;
    let consumed = false;
    const oauth = createDurableOAuthTransactionService({
      issue: async (input) => { issued = input; },
      consume: async (input) => {
        if (!issued || consumed || input.stateDigest !== issued.stateDigest || input.nonceDigest !== issued.nonceDigest || input.pkceVerifierDigest !== issued.pkceVerifierDigest) return { kind: "replay_denied" as const };
        consumed = true; return { kind: "consumed" as const };
      },
    });
    const transaction = await oauth.begin({ provider: "google", purpose: "sign_in", callbackUrl: "https://portal.example/api/auth/oauth/google/callback", returnIntent: "/client", browserBinding: "browser-cookie" });
    expect(issued?.stateDigest).not.toBe(transaction.state);
    const callback = { state: transaction.state, nonce: transaction.nonce, pkceVerifier: transaction.pkceVerifier, browserBinding: "browser-cookie", callbackUrl: "https://portal.example/api/auth/oauth/google/callback" };
    await expect(oauth.consume(callback)).resolves.toEqual({ kind: "consumed" });
    await expect(oauth.consume(callback)).resolves.toEqual({ kind: "replay_denied" });
  });

  it("loads immutable server evidence by ID and never accepts a request-shaped receipt", async () => {
    let created = 0;
    const accounts = new AccountService({ createProspect: async (subject: string) => { created += 1; return { id: "a", subject, status: "pending_verification" as const }; } } as never, { loadSupabaseReceipt: async (id) => id === "supabase-1" ? { subject: "subject-1", verifiedAt: Date.now(), issuer: "supabase" } : undefined });
    await expect(accounts.registerProspect({ subject: "subject-1", evidenceId: "fabricated", verifiedSubjectReceipt: { subject: "subject-1", verifiedAt: Date.now() } })).resolves.toEqual({ kind: "denied" });
    await expect(accounts.registerProspect({ subject: "subject-1", evidenceId: "supabase-1" })).resolves.toMatchObject({ status: "pending_verification" });
    expect(created).toBe(1);
    const linking = new PartyLinkingService({ resolve: async () => ({ kind: "linked" as const, relationshipReceipt: "crm-link" }) }, { loadCrmReceipt: async (id) => id === "crm-1" ? { evidenceId: id, verifiedAt: Date.now() } : undefined });
    await expect(linking.link({ accountId: "a", evidenceId: "fabricated" })).resolves.toEqual({ kind: "manual_review" });
    await expect(linking.link({ accountId: "a", evidenceId: "crm-1" })).resolves.toEqual({ kind: "linked", relationshipReceipt: "crm-link" });
  });

  it("only derives a supported auth locale and defaults safely", () => {
    expect(resolveAuthLocale("en-US,en;q=0.9")).toBe("en");
    expect(resolveAuthLocale("es-MX")).toBe("es");
    expect(resolveAuthLocale("<script>")).toBe("es");
  });
});
