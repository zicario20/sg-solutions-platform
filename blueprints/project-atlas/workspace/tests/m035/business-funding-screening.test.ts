import {
  buildFundingMatchCandidate,
  evaluateFundingProductScreening,
  type FundingProduct,
  type FundingProductVersion,
  publishFundingProduct,
} from "@atlas/business-funding";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source = {
  sourceType: "approved_public_source" as const,
  sourceId: "source-35",
  observedAt: now,
  verificationStatus: "professional_reviewed" as const,
  freshnessStatus: "current" as const,
};
const product: FundingProduct = {
  id: "product-35",
  code: "TERM_PREP",
  providerId: null,
  partnerId: null,
  family: "term_loan",
  deliveryModel: "education_only",
  status: "draft",
  currentVersionId: null,
  createdAt: now,
  updatedAt: now,
};
const version: FundingProductVersion = {
  id: "product-v-35",
  productId: "product-35",
  version: 1,
  publicName: "Term preparation",
  availability: "available",
  amountRange: { minimum: null, maximum: null },
  termMonths: { minimum: null, maximum: null },
  repaymentFrequencies: ["monthly"],
  requiredDisclosures: ["not_a_lender"],
  sourceReferences: [source],
  verifiedAt: now,
  nextReviewAt: "2026-09-25T00:00:00.000Z",
  status: "published",
};

describe("M035 products and matching", () => {
  it("publishes only a current source-backed product and returns preliminary screening", () => {
    expect(publishFundingProduct(product, version, now).currentVersionId).toBe("product-v-35");
    const screening = evaluateFundingProductScreening({
      id: "screen-35",
      fundingCaseId: "case-35",
      productVersion: version,
      profileVersion: 1,
      financialProfileVersion: null,
      facts: { months_in_business: 24 },
      rules: [
        {
          id: "rule-35",
          productVersionId: "product-v-35",
          code: "TIME",
          factKey: "months_in_business",
          operator: "greater_than_or_equal",
          expectedValue: 12,
          ruleStrength: "hard",
          publicExplanation: "Time in business is reviewed.",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          sourceReferences: [source],
          status: "active",
        },
      ],
      evaluatedAt: now,
    });
    expect(screening.status).toBe("potential_fit");
    expect(buildFundingMatchCandidate(screening, ["Current product rule"], []).matchBand).toBe(
      "potential",
    );
  });
  it("does not treat missing facts as a denial or approval", () => {
    const screening = evaluateFundingProductScreening({
      id: "screen-unknown",
      fundingCaseId: "case-35",
      productVersion: version,
      profileVersion: 1,
      financialProfileVersion: null,
      facts: {},
      rules: [
        {
          id: "rule-unknown",
          productVersionId: "product-v-35",
          code: "REVENUE",
          factKey: "annual_revenue",
          operator: "greater_than_or_equal",
          expectedValue: 100,
          ruleStrength: "hard",
          publicExplanation: "Revenue is reviewed.",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          sourceReferences: [source],
          status: "active",
        },
      ],
      evaluatedAt: now,
    });
    expect(screening.status).toBe("needs_information");
  });
});
