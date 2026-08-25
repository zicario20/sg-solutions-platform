import { type AuthSql, type AuthTransactionSql, withAuthTransaction } from "./auth-repository.ts";

export type BookkeepingCloseReviewDelegation = Readonly<{
  delegationRef: string;
  grantedByAccountId: string;
  delegateAccountId: string;
  ownerAccountId: string;
  accountingEntityRef: string;
  ownerContextRef: string;
  ownerAuthorizationEpoch: number;
  ownerPolicyEpoch: number;
  expiresAt: Date;
  now: Date;
}>;

const safeReference = (value: string) => /^[A-Za-z0-9_.:-]{1,128}$/u.test(value);
const query = <T>(
  transaction: AuthTransactionSql,
  statement: string,
  parameters: readonly unknown[],
) => transaction.unsafe<T>(statement, parameters);

/** M007 persistence only. Callers must independently prove their administrative authority. */
export class PostgresAuthPurposeDelegationRepository {
  constructor(
    private readonly sql: AuthSql,
    private readonly activeSessionId: string,
  ) {}

  async grantBookkeepingCloseReview(input: BookkeepingCloseReviewDelegation) {
    const references = [
      input.delegationRef,
      input.grantedByAccountId,
      input.delegateAccountId,
      input.ownerAccountId,
      input.accountingEntityRef,
      input.ownerContextRef,
    ];
    if (
      references.some((reference) => !safeReference(reference)) ||
      !safeReference(this.activeSessionId) ||
      !Number.isSafeInteger(input.ownerAuthorizationEpoch) ||
      input.ownerAuthorizationEpoch < 1 ||
      !Number.isSafeInteger(input.ownerPolicyEpoch) ||
      input.ownerPolicyEpoch < 1 ||
      input.expiresAt.getTime() <= input.now.getTime()
    )
      return { kind: "invalid" as const };
    return withAuthTransaction(this.sql, this.activeSessionId, async (transaction) => {
      const created = await query<readonly { id: string }[]>(
        transaction,
        `insert into public.auth_purpose_delegations (
          id,granted_by_account_id,delegate_account_id,owner_account_id,purpose,resource_type,
          resource_reference,owner_context_ref,owner_authorization_epoch,owner_policy_epoch,
          delegate_authorization_epoch,delegate_policy_epoch,state,expires_at,version,created_at,updated_at
        ) select $1,$2,target.id,$3,'bookkeeping_period_close_review','accounting_entity',$4,$5,$6,$7,
          target.access_epoch,target.policy_epoch,'active',$8,1,$9,$9
        from public.auth_accounts grantor
        join public.auth_accounts target on target.id=$10 and target.status='active'
        where grantor.id=$2 and grantor.status='active'
        on conflict (id) do nothing returning id`,
        [
          input.delegationRef,
          input.grantedByAccountId,
          input.ownerAccountId,
          input.accountingEntityRef,
          input.ownerContextRef,
          input.ownerAuthorizationEpoch,
          input.ownerPolicyEpoch,
          input.expiresAt,
          input.now,
          input.delegateAccountId,
        ],
      );
      if (created[0]) return { kind: "created" as const, delegationRef: created[0].id };
      const existing = await query<readonly { id: string }[]>(
        transaction,
        `select id from public.auth_purpose_delegations
         where id=$1 and granted_by_account_id=$2 and delegate_account_id=$3 and owner_account_id=$4
           and purpose='bookkeeping_period_close_review' and resource_type='accounting_entity'
           and resource_reference=$5 and owner_context_ref=$6 and owner_authorization_epoch=$7
           and owner_policy_epoch=$8 and state='active' and expires_at=$9
         limit 1`,
        [
          input.delegationRef,
          input.grantedByAccountId,
          input.delegateAccountId,
          input.ownerAccountId,
          input.accountingEntityRef,
          input.ownerContextRef,
          input.ownerAuthorizationEpoch,
          input.ownerPolicyEpoch,
          input.expiresAt,
        ],
      );
      return existing[0]
        ? { kind: "existing" as const, delegationRef: existing[0].id }
        : { kind: "conflict_or_unavailable" as const };
    });
  }

  async revokeBookkeepingCloseReview(input: {
    delegationRef: string;
    grantedByAccountId: string;
    now: Date;
  }) {
    if (!safeReference(input.delegationRef) || !safeReference(input.grantedByAccountId))
      return { kind: "invalid" as const };
    const rows = await withAuthTransaction(this.sql, this.activeSessionId, (transaction) =>
      query<readonly { id: string }[]>(
        transaction,
        `update public.auth_purpose_delegations
         set state='revoked',revoked_at=$1,version=version+1,updated_at=$1
         where id=$2 and granted_by_account_id=$3 and state='active'
         returning id`,
        [input.now, input.delegationRef, input.grantedByAccountId],
      ),
    );
    return rows[0]
      ? { kind: "revoked" as const, delegationRef: rows[0].id }
      : { kind: "not_found_or_ineligible" as const };
  }
}
