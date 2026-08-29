import { describe, expect, it } from "vitest";
import { TECHNICAL_ROADMAP_RUNTIME, createTechnicalDecisionGate, createTechnicalInitiative, createTechnicalMilestone, createTechnicalRoadmap, createTechnicalRoadmapVersion, requestTechnicalReview } from "../../packages/technical-roadmap/src/index";

describe("M100 controlled technical roadmap", () => {
  it("keeps milestones, gates and reviews evidence-led", () => {
    const roadmap = createTechnicalRoadmap({ permission: "technical_roadmap.create", code: "TECHNICAL_ROADMAP", title: "Technical roadmap" });
    const version = createTechnicalRoadmapVersion({ permission: "technical_roadmap.version.manage", code: "TECHNICAL_ROADMAP_V1", roadmap, versionNumber: 1, changeSummary: "Initial controlled version" });
    const initiative = createTechnicalInitiative({ permission: "technical_roadmap.initiative.manage", code: "DEPLOYMENT_ENABLEMENT", version, horizon: "enablement", ownerModuleReferences: ["M099"], dependencyReferences: ["M093", "M097", "M098"] });
    const milestone = createTechnicalMilestone({ permission: "technical_roadmap.initiative.manage", code: "DEPLOYMENT_EVIDENCE_GATE", initiative, definitionOfDoneReferences: ["M099_ACCEPTANCE" ] });
    const gate = createTechnicalDecisionGate({ permission: "technical_roadmap.decision_gate.manage", code: "DEPLOYMENT_OWNER_GATE", version, decisionReference: "PRODUCT_OWNER_DEPLOYMENT_DECISION", affectedInitiativeReferences: [initiative.code] });
    const review = requestTechnicalReview({ permission: "technical_roadmap.review.request", code: "TECHNICAL_REVIEW", version });
    expect(TECHNICAL_ROADMAP_RUNTIME.deploymentOrchestration).toBe(false);
    expect(milestone.complete).toBe(false);
    expect(gate.executionAuthorized).toBe(false);
    expect(review.reviewPerformed).toBe(false);
  });
});