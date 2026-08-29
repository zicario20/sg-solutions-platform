import { describe, expect, it } from "vitest";
import { PARKING_LOT_RUNTIME, createParkingContextSnapshot, createParkingItem, createParkingLotSystem, defineRevisitPolicy, evaluateParkingReadiness, recordParkingDecision, requestReactivation, requestRevisit } from "../../packages/parking-lot/src/index";

describe("M103 controlled parking lot", () => {
  it("preserves a parked item without scheduling or reactivating it", () => {
    const system = createParkingLotSystem({ permission: "parking_lot.system.configure", code: "PARKING_SYSTEM" });
    const item = createParkingItem({ permission: "parking_lot.item.create", code: "PARKED_IDEA", system, sourceReference: "M102_IDEA_PORTAL", scope: "module" });
    const snapshot = createParkingContextSnapshot({ permission: "parking_lot.context.manage", code: "PARKED_SNAPSHOT", item, evidenceReferences: ["EVIDENCE_PORTAL"], dependencyReferences: ["M089_SEARCH"], riskReferences: ["M079_RISK" ] });
    const decision = recordParkingDecision({ permission: "parking_lot.request.manage", code: "PARKING_DECISION", item, reason: "dependency", reasonReference: "M089_SEARCH_DEPENDENCY" });
    const policy = defineRevisitPolicy({ permission: "parking_lot.revisit.request", code: "REVISIT_POLICY", item, triggerTypes: ["dependency", "manual"], triggerReferences: ["M089_SEARCH_READY", "MANUAL_REVIEW"] });
    const revisit = requestRevisit({ permission: "parking_lot.revisit.request", code: "REVISIT_REQUEST", item, triggerType: "dependency", triggerReference: "M089_SEARCH_READY" });
    const reactivation = requestReactivation({ permission: "parking_lot.reactivation.request", code: "REACTIVATION_REQUEST", item, destination: "ideas", destinationReference: "M102_IDEAS", precheckReferences: ["M076_REVIEW_GATE"] });
    expect(PARKING_LOT_RUNTIME.revisitScheduler).toBe(false);
    expect(snapshot.contextRefreshed).toBe(false);
    expect(policy.schedulerRegistered).toBe(false);
    expect(revisit.reviewStarted).toBe(false);
    expect(reactivation.destinationWriteExecuted).toBe(false);
    expect(evaluateParkingReadiness({ item, decision }).ready).toBe(false);
  });
});