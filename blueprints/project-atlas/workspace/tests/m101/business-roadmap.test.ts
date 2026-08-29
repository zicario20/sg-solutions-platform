import { describe, expect, it } from "vitest";
import { BUSINESS_ROADMAP_RUNTIME, createBusinessDecisionGate, createBusinessExecutionWave, createBusinessOfferReadiness, createBusinessRoadmap, createBusinessRoadmapVersion, createBusinessSegmentHypothesis } from "../../packages/business-roadmap/src/index";

describe("M101 controlled business roadmap", () => {
  it("keeps business planning, readiness and outcomes non-operational", () => {
    const roadmap = createBusinessRoadmap({ permission: "business_roadmap.create", code: "BUSINESS_ROADMAP", title: "Business roadmap" });
    const version = createBusinessRoadmapVersion({ permission: "business_roadmap.version.manage", code: "BUSINESS_ROADMAP_V1", roadmap, versionNumber: 1, changeSummary: "Initial controlled version" });
    const wave = createBusinessExecutionWave({ permission: "business_roadmap.wave.manage", code: "WAVE_0", version, objectiveReference: "BUSINESS_FOUNDATION_OBJECTIVE", readinessGateReferences: ["M076_COMPLIANCE_GATE"], kpiReferences: ["M092_KPI_REFERENCE"] });
    const segment = createBusinessSegmentHypothesis({ permission: "business_roadmap.wave.manage", code: "CORE_PROSPECT_HYPOTHESIS", version, segmentReference: "SEGMENT_PROSPECTS", problemReference: "PROBLEM_CREDIT_ORGANIZATION" });
    const readiness = createBusinessOfferReadiness({ permission: "business_roadmap.wave.manage", code: "OFFER_READINESS", version, catalogReference: "M042_SERVICE_CATALOG", operationalReadinessReference: "M068_WORKFLOW_READY", complianceReadinessReference: "M076_COMPLIANCE_READY", technicalReadinessReference: "M100_TECHNICAL_READY" });
    const gate = createBusinessDecisionGate({ permission: "business_roadmap.decision_gate.manage", code: "BUSINESS_OWNER_GATE", version, decisionReference: "PRODUCT_OWNER_COMMERCIAL_DECISION", affectedWaveReferences: [wave.code] });
    expect(BUSINESS_ROADMAP_RUNTIME.commercialOfferChanges).toBe(false);
    expect(segment.evidenceStatus).toBe("unvalidated");
    expect(readiness.publicSaleEnabled).toBe(false);
    expect(gate.commercialActionAuthorized).toBe(false);
  });
});