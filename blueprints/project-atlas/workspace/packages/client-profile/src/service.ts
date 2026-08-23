import { randomUUID } from "node:crypto";
import type {
  BasicClientProfileDto,
  BasicProfileSection,
  BusinessFormationProfileDto,
  BusinessFundingProfileDto,
  CreditProfileDto,
  HomeBuyingProfileDto,
  PreliminaryDti,
  ProfileActor,
  ProfileCorrection,
  ProfileGoal,
  ProfileLocale,
  ProfileProjection,
  ProfilePurpose,
  ProfileRepository,
  ProfileRoot,
  ProfileSnapshot,
  SelfServiceGoalCode,
  SelfServiceProfileDto,
  TaxProfileDto,
} from "./contracts.ts";
import { SELF_SERVICE_GOAL_CODES } from "./contracts.ts";

function authorized(actor: ProfileActor, root: ProfileRoot, purpose: ProfilePurpose): boolean {
  return (
    actor.selfProfileGrant &&
    (purpose === "self_service" || actor.consentGranted) &&
    actor.accountId === root.ownerAccountId &&
    actor.clientRef === root.clientRef &&
    actor.contextRef === root.contextRef &&
    actor.authorizationEpoch === root.authorizationEpoch &&
    actor.policyEpoch === root.policyEpoch &&
    actor.allowedPurposes.includes(purpose)
  );
}
function basicStatus(
  section: BasicProfileSection,
  corrections: readonly ProfileCorrection[],
): BasicClientProfileDto["status"] {
  if (corrections.some((item) => item.state === "submitted" || item.state === "under_review"))
    return "review_required";
  return section.preferredName || section.stateCode ? "in_progress" : "empty";
}
function monthlyIncome(snapshot: ProfileSnapshot): {
  monthlyIncomeMinor?: number;
  currency?: string;
} {
  const current = snapshot.incomes.filter(
    (item) =>
      item.quality.freshness !== "outdated" &&
      Number.isSafeInteger(item.amountMinor) &&
      (item.amountMinor ?? 0) > 0,
  );
  const income = current.length === 1 ? current[0] : undefined;
  if (!income) return {};
  const multiplier = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, annual: 1 }[
    income.cadence
  ];
  return {
    monthlyIncomeMinor: Math.round(((income.amountMinor as number) * multiplier) / 12),
    currency: income.currency,
  };
}
export class ProfileService {
  public constructor(private readonly repository: ProfileRepository) {}
  public async basic(actor: ProfileActor): Promise<BasicClientProfileDto | undefined> {
    const snapshot = await this.repository.find(actor.clientRef, actor.contextRef);
    if (!snapshot || !authorized(actor, snapshot.root, "self_service")) return undefined;
    const corrections = await this.repository.listCorrections(snapshot.root.profileRef);
    return Object.freeze({
      profileRef: snapshot.root.profileRef,
      locale: snapshot.root.locale,
      preferredName: snapshot.basic.preferredName,
      stateCode: snapshot.basic.stateCode,
      revision: snapshot.root.revision,
      status: basicStatus(snapshot.basic, corrections),
      updatedAt: snapshot.basic.quality.reviewedAt ?? snapshot.basic.quality.assertedAt,
    });
  }
  public async projection(
    actor: ProfileActor,
    purpose: Exclude<ProfilePurpose, "self_service">,
  ): Promise<ProfileProjection | undefined> {
    const snapshot = await this.repository.find(actor.clientRef, actor.contextRef);
    if (!snapshot || !authorized(actor, snapshot.root, purpose)) return undefined;
    const employmentCategories = Object.freeze(snapshot.employment.map((item) => item.category));
    const goalLabels = Object.freeze(
      snapshot.goals.filter((item) => item.purpose === purpose).map((item) => item.label),
    );
    const businesses = Object.freeze(
      snapshot.businesses.map(({ businessRef, organizationRef, activity }) =>
        Object.freeze({ businessRef, organizationRef, activity }),
      ),
    );
    const income = monthlyIncome(snapshot);
    if (purpose === "credit_preparation")
      return Object.freeze({
        profileRef: snapshot.root.profileRef,
        purpose,
        employmentCategories,
        goalLabels,
        status: employmentCategories.length || goalLabels.length ? "ready_for_review" : "empty",
      } satisfies CreditProfileDto);
    if (purpose === "tax_preparation")
      return Object.freeze({
        profileRef: snapshot.root.profileRef,
        purpose,
        employmentCategories,
        status: employmentCategories.length ? "ready_for_review" : "empty",
      } satisfies TaxProfileDto);
    if (purpose === "home_buying_preparation")
      return Object.freeze({
        profileRef: snapshot.root.profileRef,
        purpose,
        ...income,
        status: income.monthlyIncomeMinor ? "preliminary" : "empty",
      } satisfies HomeBuyingProfileDto);
    if (purpose === "business_formation")
      return Object.freeze({
        profileRef: snapshot.root.profileRef,
        purpose,
        businesses,
        status: businesses.length ? "ready_for_review" : "empty",
      } satisfies BusinessFormationProfileDto);
    return Object.freeze({
      profileRef: snapshot.root.profileRef,
      purpose,
      businesses,
      ...income,
      status: businesses.length || income.monthlyIncomeMinor ? "preliminary" : "empty",
    } satisfies BusinessFundingProfileDto);
  }
  public async proposeBasicCorrection(
    actor: ProfileActor,
    expectedRevision: number,
    requested: Readonly<{ preferredName?: string; stateCode?: string }>,
  ): Promise<ProfileCorrection | undefined> {
    const snapshot = await this.repository.find(actor.clientRef, actor.contextRef);
    if (
      !snapshot ||
      !authorized(actor, snapshot.root, "self_service") ||
      snapshot.root.revision !== expectedRevision
    )
      return undefined;
    const correction = Object.freeze({
      correctionRef: `pc_${randomUUID()}`,
      profileRef: snapshot.root.profileRef,
      submittedBy: actor.accountId,
      expectedRevision,
      state: "submitted" as const,
      requested: Object.freeze({ ...requested }),
      submittedAt: new Date().toISOString(),
    });
    await this.repository.saveCorrection(correction);
    return correction;
  }
  public async selfService(actor: ProfileActor): Promise<SelfServiceProfileDto | undefined> {
    if (actor.contextType !== "personal") return undefined;
    const snapshot = await this.repository.find(actor.clientRef, actor.contextRef);
    if (!snapshot || !authorized(actor, snapshot.root, "self_service")) return undefined;
    return Object.freeze({
      profileRef: snapshot.root.profileRef,
      locale: snapshot.root.locale,
      revision: snapshot.root.revision,
      goals: Object.freeze(
        snapshot.goals
          .filter((goal): goal is ProfileGoal & { goalCode: SelfServiceGoalCode } =>
            Boolean(goal.goalCode && SELF_SERVICE_GOAL_CODES.includes(goal.goalCode)),
          )
          .map((goal) =>
            Object.freeze({
              goalRef: goal.goalRef,
              code: goal.goalCode,
              state: goal.state ?? "submitted",
              submittedAt: goal.submittedAt ?? goal.quality.assertedAt,
            }),
          ),
      ),
    });
  }
  public async submitSelfServiceGoal(
    actor: ProfileActor,
    locale: ProfileLocale,
    code: SelfServiceGoalCode,
    noticeVersion: string,
  ): Promise<SelfServiceProfileDto | undefined> {
    if (
      actor.contextType !== "personal" ||
      !actor.selfProfileGrant ||
      !actor.allowedPurposes.includes("self_service") ||
      !SELF_SERVICE_GOAL_CODES.includes(code) ||
      noticeVersion !== "m015-self-service-v1"
    )
      return undefined;
    const snapshot = await this.repository.ensureSelfServiceRoot(actor, locale);
    if (!authorized(actor, snapshot.root, "self_service")) return undefined;
    const now = new Date().toISOString();
    const goal: ProfileGoal = {
      goalRef: `goal:${snapshot.root.profileRef}:${randomUUID()}`,
      purpose: "self_service",
      label: code,
      goalCode: code,
      state: "submitted",
      noticeVersion,
      submittedAt: now,
      quality: {
        source: "client",
        support: "self_reported",
        verification: "not_verified",
        freshness: "not_evaluated",
        assertedAt: now,
      },
    };
    await this.repository.saveGoal(Object.freeze(goal));
    return this.selfService(actor);
  }
}
export function calculatePreliminaryDti(
  monthlyDebtMinor: number | undefined,
  monthlyIncomeMinor: number | undefined,
): PreliminaryDti {
  if (
    !Number.isSafeInteger(monthlyDebtMinor) ||
    !Number.isSafeInteger(monthlyIncomeMinor) ||
    (monthlyDebtMinor ?? 0) < 0 ||
    (monthlyIncomeMinor ?? 0) <= 0
  )
    return Object.freeze({
      kind: "unavailable",
      reason: "missing_or_invalid_income",
      preliminary: true,
    });
  return Object.freeze({
    kind: "available",
    ratioBasisPoints: Math.round(
      ((monthlyDebtMinor as number) * 10000) / (monthlyIncomeMinor as number),
    ),
    formulaVersion: "m015.dti.v1",
    preliminary: true,
  });
}
export function validBusinessOwnership(ownershipBasisPoints: readonly number[]): boolean {
  return (
    ownershipBasisPoints.every((item) => Number.isInteger(item) && item >= 0 && item <= 10000) &&
    ownershipBasisPoints.reduce((total, item) => total + item, 0) <= 10000
  );
}
