import { derivePublicProcessTimeline } from "@atlas/client-process-status";
import { describe, expect, it } from "vitest";

const scope = { serviceOrderId: "order", contextRef: "ctx", workflowVersion: "flow.v1" },
  mapping = {
    mappingId: "map.step.v1",
    producer: "case",
    aggregateType: "case",
    eventType: "step.completed",
    schemaVersion: "1",
    publicCode: "step_completed",
    copyKey: "timeline.step_completed",
  },
  watermark = "2026-08-23T04:00:00Z";
function event(id: number, hour: number) {
  return {
    producer: "case",
    aggregateType: "case",
    aggregateId: `case-${id}`,
    sourceEventId: `event-${id}`,
    eventType: "step.completed",
    schemaVersion: "1",
    mappingId: "map.step.v1",
    resourceFenceId: `resource-${id}`,
    sourceVersion: "events.snapshot.v1",
    scope,
    occurredAt: `2026-08-23T0${hour}:00:00Z`,
    recordedAt: `2026-08-23T0${hour}:01:00Z`,
    actorCategory: "sg_solutions",
    authorizationEpoch: "7",
    policyEpoch: "9",
  };
}
function fence(id: number) {
  return {
    internalResourceId: `resource-${id}`,
    resourceEpoch: 1,
    sourceVersion: "events.snapshot.v1",
    sourceCode: "timeline",
    factKind: "events",
    factRef: `event-${id}`,
    readCut: "cut-1",
    registryVersion: "sources.v1",
  };
}
function derive(events: any[], extra: any = {}) {
  return derivePublicProcessTimeline({
    scope,
    events,
    mappings: [mapping],
    resourceFences: events.map((value) => fence(Number(value.sourceEventId.split("-")[1]))),
    authorizationEpoch: "7",
    policyEpoch: "9",
    sourceVersion: "events.snapshot.v1",
    readCut: "cut-1",
    highWatermark: watermark,
    ...extra,
  } as any);
}
describe("M010 idempotent canonical keyset timeline", () => {
  it("deduplicates exact events and exact fences before cardinality checks", () => {
    const original = event(1, 1),
      result = derive([original, { ...original }]);
    expect(result.state).toBe("fresh");
    expect(result.items).toHaveLength(1);
  });
  it("rejects same event identity or fence identity with conflicting content", () => {
    const original = event(1, 1);
    expect(derive([original, { ...original, occurredAt: "2026-08-23T00:30:00Z" }]).state).toBe(
      "unconfirmed",
    );
    expect(
      derivePublicProcessTimeline({
        scope,
        events: [original],
        mappings: [mapping],
        resourceFences: [fence(1), { ...fence(1), resourceEpoch: 2 }],
        authorizationEpoch: "7",
        policyEpoch: "9",
        sourceVersion: "events.snapshot.v1",
        readCut: "cut-1",
        highWatermark: watermark,
      } as any).state,
    ).toBe("unconfirmed");
  });
  it("uses a NUL-free canonical sourceKey accepted by the next cursor page", () => {
    const events = [event(3, 3), event(2, 2), event(1, 1)],
      first = derive(events, { limit: 2 });
    expect(first.nextKeyset?.sourceKey).toMatch(/^pkey1_[A-Za-z0-9_-]{43}$/u);
    expect(first.nextKeyset?.sourceKey).not.toContain("\0");
    const second = derive(events, { limit: 2, after: first.nextKeyset });
    expect(second.items).toHaveLength(1);
    expect(new Set([...first.items, ...second.items].map((item) => item.eventRef)).size).toBe(3);
  });
  it("rejects append beyond watermark and source/epoch drift", () => {
    expect(
      derive([{ ...event(4, 4), recordedAt: "2026-08-23T05:00:00Z" }, event(3, 3)]).state,
    ).toBe("unconfirmed");
    expect(derive([{ ...event(1, 1), sourceVersion: "events.snapshot.v2" }]).state).toBe(
      "unconfirmed",
    );
    expect(derive([{ ...event(1, 1), authorizationEpoch: "6" }]).state).toBe("unconfirmed");
  });
});
