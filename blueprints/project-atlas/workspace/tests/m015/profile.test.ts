import {
  calculatePreliminaryDti,
  MemoryProfileRepository,
  ProfileService,
  validBusinessOwnership,
} from "@atlas/client-profile";
import { describe, expect, it } from "vitest";

const quality = {
  source: "client" as const,
  support: "self_reported" as const,
  verification: "verified" as const,
  freshness: "current" as const,
  assertedAt: "2026-08-23T00:00:00.000Z",
};
const actor = {
  accountId: "account-a",
  clientRef: "client-a",
  contextRef: "ctx-a",
  authorizationEpoch: "1",
  policyEpoch: "1",
  selfProfileGrant: true,
  consentGranted: true,
  allowedPurposes: [
    "self_service",
    "credit_preparation",
    "home_buying_preparation",
    "business_funding",
  ] as const,
};
function seeded() {
  const repo = new MemoryProfileRepository();
  repo.seed({
    root: {
      profileRef: "profile-a",
      clientRef: "client-a",
      ownerAccountId: "account-a",
      contextRef: "ctx-a",
      authorizationEpoch: "1",
      policyEpoch: "1",
      locale: "es",
      revision: 2,
    },
    basic: { preferredName: "Maria", stateCode: "IL", quality },
    employment: [{ employmentRef: "employment-a", category: "employed", quality }],
    incomes: [
      { incomeRef: "income-a", cadence: "monthly", amountMinor: 500000, currency: "USD", quality },
    ],
    businesses: [
      { businessRef: "business-a", organizationRef: "org-a", ownershipBasisPoints: 6000, quality },
    ],
    goals: [{ goalRef: "goal-a", purpose: "credit_preparation", label: "Prepararse", quality }],
  });
  return repo;
}
describe("M015 purpose-bound profile foundation", () => {
  it("fails closed for a different account or context", async () => {
    const service = new ProfileService(seeded());
    expect(await service.basic({ ...actor, accountId: "account-b" })).toBeUndefined();
    expect(
      await service.projection({ ...actor, contextRef: "ctx-b" }, "credit_preparation"),
    ).toBeUndefined();
  });
  it("creates a reviewable correction instead of overwriting a verified fact", async () => {
    const service = new ProfileService(seeded());
    const correction = await service.proposeBasicCorrection(actor, 2, {
      preferredName: "Maria P.",
    });
    expect(correction?.state).toBe("submitted");
    expect((await service.basic(actor))?.preferredName).toBe("Maria");
    expect((await service.basic(actor))?.status).toBe("review_required");
  });
  it("uses deterministic preliminary calculations and rejects impossible ownership", () => {
    expect(calculatePreliminaryDti(150000, 500000)).toMatchObject({
      kind: "available",
      ratioBasisPoints: 3000,
      preliminary: true,
    });
    expect(calculatePreliminaryDti(1, 0)).toMatchObject({ kind: "unavailable", preliminary: true });
    expect(validBusinessOwnership([6000, 4000])).toBe(true);
    expect(validBusinessOwnership([6000, 4001])).toBe(false);
  });
  it("returns a minimized service projection rather than a full profile", async () => {
    const projection = await new ProfileService(seeded()).projection(
      actor,
      "home_buying_preparation",
    );
    expect(projection).toMatchObject({
      purpose: "home_buying_preparation",
      monthlyIncomeMinor: 500000,
      status: "preliminary",
    });
    expect(projection).not.toHaveProperty("businesses");
  });
});
