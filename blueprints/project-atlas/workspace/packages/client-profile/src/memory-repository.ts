import type {
  HomeBuyingFinancialProposalRecord,
  ProfileActor,
  ProfileCorrection,
  ProfileGoal,
  ProfileLocale,
  ProfileRepository,
  ProfileSnapshot,
} from "./contracts.ts";
export class MemoryProfileRepository implements ProfileRepository {
  private readonly snapshots = new Map<string, ProfileSnapshot>();
  private readonly corrections = new Map<string, ProfileCorrection[]>();
  private readonly homeBuyingFinancialProposals: HomeBuyingFinancialProposalRecord[] = [];
  public seed(snapshot: ProfileSnapshot): void {
    this.snapshots.set(snapshot.root.clientRef, snapshot);
  }
  public async find(clientRef: string, contextRef: string): Promise<ProfileSnapshot | undefined> {
    const snapshot = this.snapshots.get(clientRef);
    return snapshot?.root.contextRef === contextRef ? snapshot : undefined;
  }
  public async ensureSelfServiceRoot(
    actor: ProfileActor,
    locale: ProfileLocale,
  ): Promise<ProfileSnapshot> {
    const existing = await this.find(actor.clientRef, actor.contextRef);
    if (existing) return existing;
    const assertedAt = new Date().toISOString();
    const snapshot: ProfileSnapshot = {
      root: {
        profileRef: `profile_${actor.clientRef}`,
        clientRef: actor.clientRef,
        ownerAccountId: actor.accountId,
        contextRef: actor.contextRef,
        authorizationEpoch: actor.authorizationEpoch,
        policyEpoch: actor.policyEpoch,
        locale,
        revision: 1,
      },
      basic: {
        quality: {
          source: "client",
          support: "unknown",
          verification: "not_verified",
          freshness: "not_evaluated",
          assertedAt,
        },
      },
      employment: [],
      incomes: [],
      businesses: [],
      goals: [],
    };
    this.seed(snapshot);
    return snapshot;
  }
  public async saveGoal(goal: ProfileGoal): Promise<void> {
    const profileId = goal.goalRef.split(":")[1];
    const snapshot = [...this.snapshots.values()].find(
      (item) => item.root.profileRef === profileId,
    );
    if (!snapshot) throw new Error("PROFILE_NOT_FOUND");
    const next: ProfileSnapshot = {
      ...snapshot,
      root: { ...snapshot.root, revision: snapshot.root.revision + 1 },
      goals: [...snapshot.goals, goal],
    };
    this.snapshots.set(snapshot.root.clientRef, next);
  }
  public async saveHomeBuyingFinancialProposal(
    record: HomeBuyingFinancialProposalRecord,
  ): Promise<void> {
    this.homeBuyingFinancialProposals.push(record);
  }
  public async saveCorrection(correction: ProfileCorrection): Promise<void> {
    const items = this.corrections.get(correction.profileRef) ?? [];
    this.corrections.set(correction.profileRef, [...items, correction]);
  }
  public async listCorrections(profileRef: string): Promise<readonly ProfileCorrection[]> {
    return Object.freeze([...(this.corrections.get(profileRef) ?? [])]);
  }
}
