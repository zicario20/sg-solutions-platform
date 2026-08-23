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
  ProfileProjection,
  ProfilePurpose,
  ProfileRepository,
  ProfileRoot,
  ProfileSnapshot,
  TaxProfileDto,
} from "./contracts.ts";

function authorized(actor: ProfileActor, root: ProfileRoot, purpose: ProfilePurpose): boolean {
  return (
    actor.selfProfileGrant &&
    actor.consentGranted &&
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
function monthlyIncome(snapshot: ProfileSnapshot): { amountMinor?: number; currency?: string } {
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
    amountMinor: Math.round(((income.amountMinor as number) * multiplier) / 12),
    currency: income.currency,
  };
}
export class ProfileService {
  public constructor(private readonly repository: ProfileRepository) {}
  public async basic(actor: ProfileActor): Promise<BasicClientProfileDto | undefined> {
    const snapshot = await this.repository.find(actor.clientRef);
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
    const snapshot = await this.repository.find(actor.clientRef);
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
        status: income.amountMinor ? "preliminary" : "empty",
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
      status: businesses.length || income.amountMinor ? "preliminary" : "empty",
    } satisfies BusinessFundingProfileDto);
  }
  public async proposeBasicCorrection(
    actor: ProfileActor,
    expectedRevision: number,
    requested: Readonly<{ preferredName?: string; stateCode?: string }>,
  ): Promise<ProfileCorrection | undefined> {
    const snapshot = await this.repository.find(actor.clientRef);
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
