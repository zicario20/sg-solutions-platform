import { describe, expect, it } from "vitest";
import { IDEAS_RUNTIME, captureIdea, createIdeaScorecard, createIdeasSystem, evaluateIdeaReadiness, requestIdeaPromotion, triageIdea } from "../../packages/ideas/src/index";

describe("M102 controlled ideas", () => {
  it("captures and evaluates an idea without promoting it", () => {
    const system = createIdeasSystem({ permission: "ideas.record.create", code: "IDEAS_SYSTEM" });
    const idea = captureIdea({ permission: "ideas.record.create", code: "IDEA_CREDIT_PORTAL", system, sourceType: "manual", domain: "product_ux", scope: "module", title: "Improve client portal clarity", problemReference: "PROBLEM_PORTAL_CLARITY", opportunityReference: "OPPORTUNITY_PORTAL_CLARITY" });
    const scorecard = createIdeaScorecard({ permission: "ideas.scorecard.manage", code: "IDEA_SCORECARD", idea, strategicFit: 3, customerValue: 4, businessValue: 3, feasibility: 2, risk: 2 });
    const triage = triageIdea({ permission: "ideas.triage.manage", code: "IDEA_TRIAGE", idea, outcome: "promote_candidate" });
    const promotion = requestIdeaPromotion({ permission: "ideas.promotion.request", code: "IDEA_PROMOTION", idea, destination: "technical_roadmap", destinationReference: "M100_ROADMAP", precheckReferences: ["M076_REVIEW_GATE"] });
    expect(IDEAS_RUNTIME.promotionWrites).toBe(false);
    expect(scorecard.ranked).toBe(false);
    expect(promotion.destinationWriteExecuted).toBe(false);
    expect(evaluateIdeaReadiness({ idea, triage }).ready).toBe(false);
  });
});