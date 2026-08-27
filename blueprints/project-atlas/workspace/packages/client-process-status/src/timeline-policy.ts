import { createHash } from "node:crypto";
import {
  PROCESS_TIMELINE_COPY_KEYS,
  type ProcessResponsibleParty,
  type ProcessRouteKey,
  type ProcessTimelineItemDto,
} from "./contracts.ts";
import type { ProcessFactFence } from "./ports.ts";
export interface ProcessTimelineScope {
  serviceOrderId: string;
  contextRef: string;
  workflowVersion: string;
}
export interface ProcessTimelineKeyset {
  occurredAt: string;
  recordedAt: string;
  sourceKey: string;
}
export interface ProcessEventMapping {
  mappingId: string;
  producer: string;
  aggregateType: string;
  eventType: string;
  schemaVersion: string;
  publicCode: string;
  copyKey: (typeof PROCESS_TIMELINE_COPY_KEYS)[number];
  routeKey?: ProcessRouteKey;
}
export interface ProcessOwnerEvent {
  producer: string;
  aggregateType: string;
  aggregateId: string;
  sourceEventId: string;
  eventType: string;
  schemaVersion: string;
  mappingId: string;
  resourceFenceId: string;
  sourceVersion: string;
  scope: ProcessTimelineScope;
  occurredAt: string;
  recordedAt: string;
  actorCategory: ProcessResponsibleParty;
  authorizationEpoch: string | number;
  policyEpoch: string | number;
  critical?: boolean;
  correctsSourceEventId?: string;
  chainVersion?: number;
  expectedTargetChainVersion?: number;
}
export interface TimelineFence {
  resourceId: string;
  resourceEpoch: number;
  sourceVersion: string;
}
const hasControlCharacter = (value: string) =>
    Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f),
  utc = (v: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(v) &&
    Number.isFinite(Date.parse(v)),
  bounded = (v: string, m = 160) => Boolean(v) && v.length <= m && !hasControlCharacter(v),
  closed = () => ({
    state: "unconfirmed" as const,
    items: [] as readonly ProcessTimelineItemDto[],
    fences: [] as readonly string[],
    hasMore: false,
  });
export function canonicalProcessSourceKey(parts: readonly string[]) {
  return `pkey1_${createHash("sha256").update(JSON.stringify(parts)).digest("base64url")}`;
}
function eventKey(
  event: Pick<ProcessOwnerEvent, "producer" | "aggregateType" | "aggregateId" | "sourceEventId">,
) {
  return canonicalProcessSourceKey([
    event.producer,
    event.aggregateType,
    event.aggregateId,
    event.sourceEventId,
  ]);
}
function compare(a: ProcessTimelineKeyset, b: ProcessTimelineKeyset) {
  return (
    Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
    Date.parse(b.recordedAt) - Date.parse(a.recordedAt) ||
    a.sourceKey.localeCompare(b.sourceKey, "en")
  );
}
export function derivePublicProcessTimeline(input: {
  scope: ProcessTimelineScope;
  events: readonly ProcessOwnerEvent[];
  mappings: readonly ProcessEventMapping[];
  resourceFences?: readonly ProcessFactFence[];
  authorizationEpoch?: string | number;
  policyEpoch?: string | number;
  sourceVersion?: string;
  readCut?: string;
  highWatermark?: string;
  absenceFence?: TimelineFence;
  limit?: number;
  after?: ProcessTimelineKeyset;
}) {
  if (input.events.length === 0)
    return input.absenceFence
      ? {
          state: "empty" as const,
          items: [] as readonly ProcessTimelineItemDto[],
          fences: [input.absenceFence.resourceId],
          hasMore: false,
        }
      : {
          state: "unavailable" as const,
          items: [] as readonly ProcessTimelineItemDto[],
          fences: [] as readonly string[],
          hasMore: false,
        };
  if (
    input.authorizationEpoch === undefined ||
    input.policyEpoch === undefined ||
    !input.sourceVersion ||
    !input.readCut ||
    !input.resourceFences?.length ||
    !input.highWatermark ||
    !utc(input.highWatermark) ||
    (input.after &&
      (!utc(input.after.occurredAt) ||
        !utc(input.after.recordedAt) ||
        !/^pkey1_[A-Za-z0-9_-]{43}$/u.test(input.after.sourceKey)))
  )
    return closed();
  const fenceById = new Map<string, ProcessFactFence>(),
    fenceSignatures = new Map<string, string>(),
    factSignatures = new Map<string, string>();
  for (const fence of input.resourceFences) {
    const signature = JSON.stringify([
        fence.internalResourceId,
        fence.resourceEpoch,
        fence.sourceVersion,
        fence.sourceCode,
        fence.factKind,
        fence.factRef,
        fence.readCut,
        fence.registryVersion,
      ]),
      knownId = fenceSignatures.get(fence.internalResourceId),
      knownFact = factSignatures.get(fence.factRef);
    if (knownId === signature && knownFact === signature) continue;
    if (knownId || knownFact) return closed();
    fenceSignatures.set(fence.internalResourceId, signature);
    factSignatures.set(fence.factRef, signature);
    fenceById.set(fence.internalResourceId, fence);
  }
  const used = new Set<string>(),
    identities = new Map<string, string>(),
    eventsByKey = new Map<string, ProcessOwnerEvent>(),
    projected: { item: ProcessTimelineItemDto; keyset: ProcessTimelineKeyset }[] = [];
  for (const event of input.events) {
    const key = eventKey(event),
      content = JSON.stringify([
        event.eventType,
        event.schemaVersion,
        event.mappingId,
        event.resourceFenceId,
        event.sourceVersion,
        event.scope,
        event.occurredAt,
        event.recordedAt,
        event.actorCategory,
        String(event.authorizationEpoch),
        String(event.policyEpoch),
        event.correctsSourceEventId ?? null,
        event.chainVersion ?? 1,
        event.expectedTargetChainVersion ?? null,
      ]),
      previous = identities.get(key);
    if (previous === content) continue;
    if (previous) return closed();
    const fence = fenceById.get(event.resourceFenceId);
    if (
      !fence ||
      used.has(event.resourceFenceId) ||
      fence.sourceCode !== "timeline" ||
      fence.factKind !== "events" ||
      fence.sourceVersion !== event.sourceVersion ||
      fence.sourceVersion !== input.sourceVersion ||
      fence.readCut !== input.readCut ||
      String(event.authorizationEpoch) !== String(input.authorizationEpoch) ||
      String(event.policyEpoch) !== String(input.policyEpoch) ||
      !bounded(event.producer, 64) ||
      !bounded(event.aggregateType, 64) ||
      !bounded(event.aggregateId) ||
      !bounded(event.sourceEventId) ||
      !utc(event.occurredAt) ||
      !utc(event.recordedAt) ||
      Date.parse(event.occurredAt) > Date.parse(event.recordedAt) ||
      Date.parse(event.recordedAt) > Date.parse(input.highWatermark) ||
      event.scope.serviceOrderId !== input.scope.serviceOrderId ||
      event.scope.contextRef !== input.scope.contextRef ||
      event.scope.workflowVersion !== input.scope.workflowVersion
    )
      return closed();
    identities.set(key, content);
    eventsByKey.set(key, event);
    used.add(event.resourceFenceId);
  }
  for (const [key, event] of eventsByKey) {
    if (event.correctsSourceEventId) {
      if (event.correctsSourceEventId === event.sourceEventId) return closed();
      const targetKey = canonicalProcessSourceKey([
          event.producer,
          event.aggregateType,
          event.aggregateId,
          event.correctsSourceEventId,
        ]),
        target = eventsByKey.get(targetKey);
      if (!target || event.expectedTargetChainVersion !== (target.chainVersion ?? 1))
        return closed();
      const visited = new Set([event.sourceEventId]);
      let cursor: ProcessOwnerEvent | undefined = target;
      while (cursor?.correctsSourceEventId) {
        if (visited.has(cursor.sourceEventId)) return closed();
        visited.add(cursor.sourceEventId);
        cursor = eventsByKey.get(
          canonicalProcessSourceKey([
            cursor.producer,
            cursor.aggregateType,
            cursor.aggregateId,
            cursor.correctsSourceEventId,
          ]),
        );
      }
    }
    const mapping = input.mappings.find(
      (v) =>
        v.mappingId === event.mappingId &&
        v.producer === event.producer &&
        v.aggregateType === event.aggregateType &&
        v.eventType === event.eventType &&
        v.schemaVersion === event.schemaVersion,
    );
    if (!mapping || !PROCESS_TIMELINE_COPY_KEYS.includes(mapping.copyKey)) {
      if (event.critical) return closed();
      continue;
    }
    projected.push({
      keyset: { occurredAt: event.occurredAt, recordedAt: event.recordedAt, sourceKey: key },
      item: {
        eventRef: `pev1_${createHash("sha256").update(key).digest("base64url").slice(0, 32)}`,
        code: mapping.publicCode,
        copyKey: mapping.copyKey,
        actorCategory: event.actorCategory,
        occurredAt: event.occurredAt,
        ...(mapping.routeKey ? { routeKey: mapping.routeKey } : {}),
      },
    });
  }
  projected.sort((a, b) => compare(a.keyset, b.keyset));
  const after = input.after;
  const eligible = after
      ? projected.filter((value) => compare(value.keyset, after) > 0)
      : projected,
    limit = Math.min(Math.max(input.limit ?? 20, 1), 20),
    page = eligible.slice(0, limit),
    hasMore = eligible.length > limit;
  return {
    state: "fresh" as const,
    items: Object.freeze(page.map((v) => v.item)),
    fences: Object.freeze([...used]),
    hasMore,
    ...(hasMore && page.length ? { nextKeyset: page[page.length - 1]?.keyset } : {}),
  };
}
