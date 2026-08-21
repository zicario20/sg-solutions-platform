import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type SupabaseIdentity = Readonly<{
  issuer: string;
  audience: string;
  subject: string;
  emailVerified: true;
  expiresAt: number;
  transactionId: string;
  provider: "google";
}>;

type CrmResolution =
  | { readonly kind: "linked"; readonly relationshipReceipt: string; readonly partyId: string }
  | { readonly kind: "possible_match" | "conflict"; readonly partyId?: string }
  | { readonly kind: "unavailable" };

const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[] = []) =>
  transaction.unsafe<T>(statement, parameters);

/** Durable identity evidence and account linking. No raw session handle enters this repository. */
export class PostgresAuthIdentityRepository {
  constructor(private readonly sql: AuthSql) {}

  async storeSupabaseEvidence(input: { readonly id: string; readonly identity: SupabaseIdentity; readonly verifiedAt: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction,
      `insert into auth_supabase_identity_evidence (id, provider, provider_subject, issuer, audience, email_verified, provider_transaction_id, verified_at, expires_at, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$8)`,
      [input.id, input.identity.provider, input.identity.subject, input.identity.issuer, input.identity.audience, input.identity.emailVerified, input.identity.transactionId, input.verifiedAt, new Date(input.identity.expiresAt)],
    ));
  }

  async storeCrmEvidence(input: { readonly id: string; readonly supabaseEvidenceId: string; readonly resolution: CrmResolution; readonly verifiedAt: Date; readonly expiresAt: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction,
      `insert into auth_crm_party_evidence (id, supabase_evidence_id, party_id, resolution, relationship_receipt, verified_at, expires_at, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$6)`,
      [input.id, input.supabaseEvidenceId, "partyId" in input.resolution ? input.resolution.partyId ?? null : null, input.resolution.kind, "relationshipReceipt" in input.resolution ? input.resolution.relationshipReceipt : null, input.verifiedAt, input.expiresAt],
    ));
  }

  async authenticate(input: {
    readonly supabaseEvidenceId: string;
    readonly crmEvidenceId: string;
    readonly expectedIssuer: string;
    readonly expectedAudience: string;
    readonly accountId: string;
    readonly externalIdentityId: string;
    readonly partyLinkId: string;
    readonly conflictId: string;
    readonly session: { readonly id: string; readonly handleDigest: string; readonly familyId: string; readonly assurance: "aal1"; readonly idleExpiresAt: Date; readonly absoluteExpiresAt: Date };
    readonly now: Date;
  }): Promise<{ readonly kind: "authenticated"; readonly accountId: string } | { readonly kind: "denied" | "manual_review" }> {
    return this.sql.begin(async (transaction) => {
      const identities = await query<readonly { id: string; provider_subject: string }[]>(transaction,
        `select id, provider_subject from auth_supabase_identity_evidence
         where id=$1 and provider='google' and issuer=$2 and audience=$3 and email_verified=true and verified_at<=$4 and expires_at>$4 for update`,
        [input.supabaseEvidenceId, input.expectedIssuer, input.expectedAudience, input.now],
      );
      const identity = identities[0];
      if (!identity) return { kind: "denied" as const };

      const crmRows = await query<readonly { id: string; resolution: "linked" | "possible_match" | "conflict" | "unavailable"; relationship_receipt: string | null }[]>(transaction,
        `select id, resolution, relationship_receipt from auth_crm_party_evidence
         where id=$1 and supabase_evidence_id=$2 and verified_at<=$3 and expires_at>$3 for update`,
        [input.crmEvidenceId, identity.id, input.now],
      );
      const crm = crmRows[0];
      if (!crm) return { kind: "denied" as const };

      const accountRows = await query<readonly { id: string; status: string }[]>(transaction,
        `insert into auth_accounts (id, supabase_subject, status, authentication_epoch, access_epoch, policy_epoch, version, created_at, updated_at)
         values ($1,$2,$3,1,1,1,1,$4,$4)
         on conflict (supabase_subject) do update set updated_at=excluded.updated_at
         returning id, status`,
        [input.accountId, identity.provider_subject, crm.resolution === "linked" ? "active" : "limited", input.now],
      );
      const account = accountRows[0];
      if (!account) throw new Error("auth_account_persistence_failed");

      const externalRows = await query<readonly { id: string; account_id?: string }[]>(transaction,
        `insert into auth_external_identities (id, account_id, provider, provider_subject, state, linked_at, version, created_at, updated_at)
         values ($1,$2,'google',$3,'active',$4,1,$4,$4)
         on conflict (provider, provider_subject) do update set updated_at=excluded.updated_at
         returning id, account_id`,
        [input.externalIdentityId, account.id, identity.provider_subject, input.now],
      );
      const external = externalRows[0];
      if (!external) throw new Error("auth_external_identity_persistence_failed");

      const conflict = crm.resolution !== "linked" || !crm.relationship_receipt || (external.account_id !== undefined && external.account_id !== account.id);
      if (conflict) {
        await query(transaction,
          `insert into auth_identity_conflicts (id, account_id, external_identity_id, supabase_evidence_id, crm_evidence_id, reason, state, created_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,'manual_review',$7,$7)`,
          [input.conflictId, account.id, external.id, identity.id, crm.id, crm.resolution, input.now],
        );
        return { kind: "manual_review" as const };
      }

      await query(transaction,
        `insert into auth_party_links (id, account_id, relationship_receipt, state, access_version, created_at, updated_at)
         values ($1,$2,$3,'active',1,$4,$4)
         on conflict (relationship_receipt) do update set updated_at=excluded.updated_at`,
        [input.partyLinkId, account.id, crm.relationship_receipt, input.now],
      );
      await query(transaction,
        `insert into auth_sessions (id, account_id, handle_digest, family_id, generation, assurance, state, idle_expires_at, absolute_expires_at, version, created_at, updated_at)
         values ($1,$2,$3,$4,1,$5,'active',$6,$7,1,$8,$8)`,
        [input.session.id, account.id, input.session.handleDigest, input.session.familyId, input.session.assurance, input.session.idleExpiresAt, input.session.absoluteExpiresAt, input.now],
      );
      return { kind: "authenticated" as const, accountId: account.id };
    });
  }
}
