import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type SupabaseIdentity = Readonly<{ issuer: string; audience: string; subject: string; emailVerified: true; expiresAt: number; transactionId: string; provider: "google" }>;
type CrmResolution = { readonly kind: "linked"; readonly relationshipReceipt: string; readonly partyId: string } | { readonly kind: "possible_match" | "conflict"; readonly partyId?: string } | { readonly kind: "unavailable" };
const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[]) => transaction.unsafe<T>(statement, parameters);

export class PostgresAuthIdentityRepository {
  constructor(private readonly sql: AuthSql) {}
  async storeSupabaseEvidence(input: { readonly id: string; readonly identity: SupabaseIdentity; readonly verifiedAt: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_store_supabase_evidence($1,$2,$3,$4,$5,$6,$7,$8,$9)", [input.id, input.identity.provider, input.identity.subject, input.identity.issuer, input.identity.audience, input.identity.emailVerified, input.identity.transactionId, input.verifiedAt, new Date(input.identity.expiresAt)]));
  }
  async storeCrmEvidence(input: { readonly id: string; readonly supabaseEvidenceId: string; readonly resolution: CrmResolution; readonly verifiedAt: Date; readonly expiresAt: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_store_crm_evidence($1,$2,$3,$4,$5,$6,$7)", [input.id, input.supabaseEvidenceId, "partyId" in input.resolution ? input.resolution.partyId ?? null : null, input.resolution.kind, "relationshipReceipt" in input.resolution ? input.resolution.relationshipReceipt : null, input.verifiedAt, input.expiresAt]));
  }
  async authenticate(input: { readonly supabaseEvidenceId: string; readonly crmEvidenceId: string; readonly expectedIssuer: string; readonly expectedAudience: string; readonly accountId: string; readonly externalIdentityId: string; readonly partyLinkId: string; readonly conflictId: string; readonly session: { readonly id: string; readonly handleDigest: string; readonly familyId: string; readonly assurance: "aal1"; readonly idleExpiresAt: Date; readonly absoluteExpiresAt: Date }; readonly now: Date }): Promise<{ readonly kind: "authenticated"; readonly accountId: string } | { readonly kind: "denied" | "manual_review" }> {
    const rows = await this.sql.begin((transaction) => query<readonly { kind: "authenticated" | "denied" | "manual_review"; account_id: string | null }[]>(transaction, "select * from atlas_auth_authenticate_identity($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)", [input.supabaseEvidenceId, input.crmEvidenceId, input.expectedIssuer, input.expectedAudience, input.accountId, input.externalIdentityId, input.partyLinkId, input.conflictId, input.session.id, input.session.handleDigest, input.session.familyId, input.session.assurance, input.session.idleExpiresAt, input.session.absoluteExpiresAt, input.now]));
    const row = rows[0];
    return row?.kind === "authenticated" && row.account_id ? { kind: "authenticated", accountId: row.account_id } : { kind: row?.kind === "manual_review" ? "manual_review" : "denied" };
  }
}
