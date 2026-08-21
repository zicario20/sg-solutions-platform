import { createHash } from "node:crypto";
import { createPostgresAuthSql, type AuthSql } from "@atlas/database";
import type { OfficialSupabaseIdentity, CrmPartyResolutionEvidence } from "@atlas/auth";

type Provider = { verifyGoogle(input: { state: string; nonce: string; pkceVerifier: string; code?: string }): Promise<OfficialSupabaseIdentity | undefined> };
type Crm = { resolve(input: { subject: string; supabaseEvidenceId: string }): Promise<CrmPartyResolutionEvidence> };
type Factories = { createSql(databaseUrl: string): AuthSql; createProvider(env: Record<string, string | undefined>): Provider; createCrm(env: Record<string, string | undefined>): Crm };
const required = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "CRM_AUTH_RESOLUTION_URL", "CRM_AUTH_TOKEN", "AUTH_SESSION_CSRF_SECRET"] as const;

const defaults: Factories = {
  createSql: createPostgresAuthSql,
  createProvider: (env) => ({ async verifyGoogle(input) { if (!input.code) return undefined; const tokenResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=pkce`, { method: "POST", headers: { "Content-Type": "application/json", apikey: env.SUPABASE_ANON_KEY! }, body: JSON.stringify({ auth_code: input.code, code_verifier: input.pkceVerifier }) }); if (!tokenResponse.ok) return undefined; const token = await tokenResponse.json() as { access_token?: string; expires_in?: number }; if (!token.access_token) return undefined; const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${token.access_token}` } }); if (!userResponse.ok) return undefined; const user = await userResponse.json() as { id?: string; email_confirmed_at?: string; app_metadata?: { provider?: string } }; if (!user.id || !user.email_confirmed_at || user.app_metadata?.provider !== "google") return undefined; return { provider: "google", issuer: (env.SUPABASE_ISSUER ?? env.SUPABASE_AUTH_ISSUER)!, audience: (env.SUPABASE_AUDIENCE ?? env.SUPABASE_AUTH_AUDIENCE)!, subject: user.id, emailVerified: true, expiresAt: Date.now() + Math.max(1, token.expires_in ?? 60) * 1000, transactionId: createHash("sha256").update(token.access_token).digest("base64url") }; } }),
  createCrm: (env) => ({ async resolve(input) { const response = await fetch(env.CRM_AUTH_RESOLUTION_URL!, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.CRM_AUTH_TOKEN}` }, body: JSON.stringify(input) }); if (!response.ok) return { kind: "unavailable" }; const value = await response.json() as { kind?: string; partyId?: string; relationshipReceipt?: string }; if (value.kind === "linked" && value.partyId && value.relationshipReceipt) return { kind: "linked", partyId: value.partyId, relationshipReceipt: value.relationshipReceipt }; if (value.kind === "possible_match" || value.kind === "conflict") return { kind: value.kind, ...(value.partyId ? { partyId: value.partyId } : {}) }; return { kind: "unavailable" }; } }),
};

export function createConfiguredOAuthDependencies(env: Record<string, string | undefined>, factories: Factories = defaults): { sql: AuthSql; provider: Provider; crm: Crm } | undefined {
  if (required.some((key) => !env[key]) || !(env.SUPABASE_ISSUER ?? env.SUPABASE_AUTH_ISSUER) || !(env.SUPABASE_AUDIENCE ?? env.SUPABASE_AUTH_AUDIENCE)) return undefined;
  return { sql: factories.createSql(env.DATABASE_URL!), provider: factories.createProvider(env), crm: factories.createCrm(env) };
}
