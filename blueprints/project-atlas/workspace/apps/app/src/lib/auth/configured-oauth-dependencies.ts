import type { CrmPartyResolutionEvidence, OfficialSupabaseIdentity } from "@atlas/auth";
import { type AuthSql, createPostgresAuthSql } from "@atlas/database";
import { createSupabaseServerAuthProvider } from "./supabase-server-auth.ts";

type Provider = {
  authorizationUrl(input: {
    state: string;
    nonce: string;
    codeChallenge: string;
    redirectUri: string;
  }): string;
  exchangeAndVerify(input: {
    code: string;
    pkceVerifier: string;
    expectedNonce: string;
    redirectUri: string;
  }): Promise<OfficialSupabaseIdentity | undefined>;
};
type Crm = {
  resolve(input: {
    subject: string;
    supabaseEvidenceId: string;
  }): Promise<CrmPartyResolutionEvidence>;
};
type Factories = {
  createSql(databaseUrl: string): AuthSql;
  createProvider(env: Record<string, string | undefined>): Provider;
  createCrm(env: Record<string, string | undefined>): Crm;
};
const required = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "CRM_AUTH_RESOLUTION_URL",
  "CRM_AUTH_TOKEN",
  "AUTH_SESSION_CSRF_SECRET",
] as const;

const defaults: Factories = {
  createSql: createPostgresAuthSql,
  createProvider: (env) => createSupabaseServerAuthProvider(env),
  createCrm: (env) => ({
    async resolve(input) {
      const response = await fetch(env.CRM_AUTH_RESOLUTION_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.CRM_AUTH_TOKEN}`,
        },
        body: JSON.stringify(input),
      });
      if (!response.ok) return { kind: "unavailable" };
      const value = (await response.json()) as {
        kind?: string;
        partyId?: string;
        relationshipReceipt?: string;
      };
      if (value.kind === "linked" && value.partyId && value.relationshipReceipt)
        return {
          kind: "linked",
          partyId: value.partyId,
          relationshipReceipt: value.relationshipReceipt,
        };
      if (value.kind === "possible_match" || value.kind === "conflict")
        return { kind: value.kind, ...(value.partyId ? { partyId: value.partyId } : {}) };
      return { kind: "unavailable" };
    },
  }),
};

export function createConfiguredOAuthDependencies(
  env: Record<string, string | undefined>,
  factories: Factories = defaults,
): { sql: AuthSql; provider: Provider; crm: Crm } | undefined {
  if (
    required.some((key) => !env[key]) ||
    !(env.SUPABASE_ISSUER ?? env.SUPABASE_AUTH_ISSUER) ||
    !(env.SUPABASE_AUDIENCE ?? env.SUPABASE_AUTH_AUDIENCE)
  )
    return undefined;
  return {
    sql: factories.createSql(env.DATABASE_URL!),
    provider: factories.createProvider(env),
    crm: factories.createCrm(env),
  };
}
