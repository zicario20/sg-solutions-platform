import { createServerEmailAuthService, openServerSecret, sealServerSecret } from "@atlas/auth";
import { createPostgresAuthSql, PostgresEmailAuthRepository, type AuthSql } from "@atlas/database";
import { createSupabaseServerAuthProvider } from "./supabase-server-auth.ts";

export function createConfiguredEmailAuth(env: Record<string, string | undefined>, dependencies: { sql?: AuthSql; provider?: ReturnType<typeof createSupabaseServerAuthProvider> } = {}) {
  const issuer = env.SUPABASE_ISSUER ?? env.SUPABASE_AUTH_ISSUER; const audience = env.SUPABASE_AUDIENCE ?? env.SUPABASE_AUTH_AUDIENCE; const secret = env.AUTH_PROVIDER_TOKEN_KEY;
  if (env.SUPABASE_EMAIL_AUTH_ENABLED !== "true" || !env.DATABASE_URL || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !issuer || !audience || !secret) return undefined;
  const sql = dependencies.sql ?? createPostgresAuthSql(env.DATABASE_URL); const provider = dependencies.provider ?? createSupabaseServerAuthProvider(env);
  return createServerEmailAuthService({ provider, repository: new PostgresEmailAuthRepository(sql), sealProviderToken: (value) => sealServerSecret(secret, value), openProviderToken: (value) => openServerSecret(secret, value) });
}
