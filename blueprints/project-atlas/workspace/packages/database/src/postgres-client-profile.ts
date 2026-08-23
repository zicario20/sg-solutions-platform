import type {
  HomeBuyingFinancialProposalRecord,
  ProfileActor,
  ProfileCorrection,
  ProfileGoal,
  ProfileLocale,
  ProfileRepository,
  ProfileSnapshot,
} from "@atlas/client-profile";
import type { Sql } from "postgres";

export type PostgresClientProfileClient = Pick<Sql, "unsafe">;
type RootRow = Readonly<{
  id: string;
  owner_account_id: string;
  context_ref: string;
  authorization_epoch: string;
  policy_epoch: string;
  locale: ProfileLocale;
  revision: number;
  created_at: Date;
}>;
type GoalRow = Readonly<{
  id: string;
  goal_code: ProfileGoal["goalCode"];
  state: ProfileGoal["state"];
  notice_version: string;
  asserted_at: Date;
}>;
type CorrectionRow = Readonly<{
  id: string;
  profile_id: string;
  submitted_by: string;
  expected_revision: number;
  state: ProfileCorrection["state"];
  requested_goal_id: string | null;
  requested_goal_code: ProfileGoal["goalCode"] | null;
  submitted_at: Date;
}>;
const quality = (assertedAt: Date) => ({
  source: "client" as const,
  support: "self_reported" as const,
  verification: "not_verified" as const,
  freshness: "not_evaluated" as const,
  assertedAt: assertedAt.toISOString(),
});

export class PostgresProfileRepository implements ProfileRepository {
  public constructor(private readonly client: PostgresClientProfileClient) {}
  public async find(clientRef: string, contextRef: string): Promise<ProfileSnapshot | undefined> {
    const roots = await this.client.unsafe<RootRow[]>(
      "select * from profile_self_service_roots where owner_account_id = $1 and context_ref = $2 limit 1",
      [clientRef, contextRef],
    );
    const root = roots[0];
    if (!root) return undefined;
    const goals = await this.client.unsafe<GoalRow[]>(
      "select id, goal_code, state, notice_version, asserted_at from profile_self_service_goals where profile_id = $1 order by created_at asc",
      [root.id],
    );
    return {
      root: {
        profileRef: root.id,
        clientRef,
        ownerAccountId: root.owner_account_id,
        contextRef: root.context_ref,
        authorizationEpoch: root.authorization_epoch,
        policyEpoch: root.policy_epoch,
        locale: root.locale,
        revision: root.revision,
      },
      basic: { quality: { ...quality(root.created_at), support: "unknown" } },
      employment: [],
      incomes: [],
      businesses: [],
      goals: goals.map((goal) => ({
        goalRef: goal.id,
        purpose: "self_service",
        label: goal.goal_code ?? "general_support",
        goalCode: goal.goal_code,
        state: goal.state,
        noticeVersion: goal.notice_version,
        submittedAt: goal.asserted_at.toISOString(),
        quality: quality(goal.asserted_at),
      })),
    };
  }
  public async ensureSelfServiceRoot(
    actor: ProfileActor,
    locale: ProfileLocale,
  ): Promise<ProfileSnapshot> {
    const current = await this.find(actor.clientRef, actor.contextRef);
    if (current) return current;
    const id = `profile_${crypto.randomUUID()}`;
    await this.client.unsafe(
      "insert into profile_self_service_roots (id,owner_account_id,context_ref,authorization_epoch,policy_epoch,locale,revision,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,1,now(),now()) on conflict (owner_account_id,context_ref) do nothing",
      [id, actor.accountId, actor.contextRef, actor.authorizationEpoch, actor.policyEpoch, locale],
    );
    const created = await this.find(actor.clientRef, actor.contextRef);
    if (!created) throw new Error("PROFILE_ROOT_UNAVAILABLE");
    return created;
  }
  public async saveGoal(goal: ProfileGoal): Promise<void> {
    const profileId = goal.goalRef.split(":")[1];
    if (!profileId || !goal.goalCode || !goal.noticeVersion || !goal.submittedAt)
      throw new Error("PROFILE_GOAL_INVALID");
    const inserted = await this.client.unsafe<Readonly<{ id: string }>[]>(
      "insert into profile_self_service_goals (id,profile_id,goal_code,state,notice_version,asserted_at,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,now(),now()) on conflict (profile_id,goal_code) do nothing returning id",
      [
        goal.goalRef,
        profileId,
        goal.goalCode,
        goal.state ?? "submitted",
        goal.noticeVersion,
        goal.submittedAt,
      ],
    );
    if (!inserted.length) return;
    await this.client.unsafe(
      "update profile_self_service_roots set revision = revision + 1, updated_at = now() where id = $1",
      [profileId],
    );
  }
  public async saveHomeBuyingFinancialProposal(
    record: HomeBuyingFinancialProposalRecord,
  ): Promise<void> {
    await this.client.unsafe(
      "insert into profile_home_buying_financial_proposals (id,profile_id,submitted_by,expected_revision,purpose,acknowledgement_version,ciphertext,encryption_algorithm,key_version,authorization_epoch,policy_epoch,submitted_at,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now())",
      [
        record.proposalRef,
        record.profileRef,
        record.submittedBy,
        record.expectedRevision,
        record.purpose,
        record.acknowledgementVersion,
        record.encryptedPayload.ciphertext,
        record.encryptedPayload.algorithm,
        record.encryptedPayload.keyVersion,
        record.authorizationEpoch,
        record.policyEpoch,
        record.submittedAt,
      ],
    );
  }
  public async saveCorrection(correction: ProfileCorrection): Promise<void> {
    await this.client.unsafe(
      "insert into profile_self_service_corrections (id,profile_id,submitted_by,expected_revision,state,requested_goal_id,requested_goal_code,submitted_at,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())",
      [
        correction.correctionRef,
        correction.profileRef,
        correction.submittedBy,
        correction.expectedRevision,
        correction.state,
        correction.requested.goalRef ?? null,
        correction.requested.goalCode ?? null,
        correction.submittedAt,
      ],
    );
  }
  public async listCorrections(profileRef: string): Promise<readonly ProfileCorrection[]> {
    const rows = await this.client.unsafe<CorrectionRow[]>(
      "select id,profile_id,submitted_by,expected_revision,state,requested_goal_id,requested_goal_code,submitted_at from profile_self_service_corrections where profile_id = $1 order by created_at asc",
      [profileRef],
    );
    return rows.map((row) => ({
      correctionRef: row.id,
      profileRef: row.profile_id,
      submittedBy: row.submitted_by,
      expectedRevision: row.expected_revision,
      state: row.state,
      requested: {
        goalRef: row.requested_goal_id ?? undefined,
        goalCode: row.requested_goal_code ?? undefined,
      },
      submittedAt: row.submitted_at.toISOString(),
    }));
  }
}
