import type {
  ClientActionDto,
  DashboardAuthorizationSnapshot,
  DashboardPriorityInput,
  DashboardPrioritySource,
} from "@atlas/dashboard";
import { isProcessRootAuthorized } from "./authorization.ts";
import {
  type ClientProcessDetailDto,
  type ClientProcessLandingDto,
  PROCESS_LANDING_CURSOR_PATTERN,
  PROCESS_ROUTE_KEYS,
  PROCESS_SECTION_NAMES,
  PROCESS_TIMELINE_CURSOR_PATTERN,
  type ProcessActionDto,
  type ProcessBlockerDto,
  parseClientProcessDetailDto,
  parseClientProcessLandingDto,
} from "./contracts.ts";
import { isFreshAuthoritativeEligibility, isProcessEligible } from "./eligibility.ts";
import type {
  AuthorizedProcessRoot,
  ProcessEligibilityPolicySnapshot,
  ProcessFactFence,
  ProcessOwnerPort,
  ProcessOwnerResult,
  ProcessQueryDependencies,
  ProcessQueryResult,
  ProcessSourceCode,
  ProcessSourceDefinition,
  ProcessTimelineContinuation,
  ProcessTimelineCursorBinding,
} from "./ports.ts";
import { selectProcessPriority } from "./priority-policy.ts";
import { PROCESS_SOURCE_CAPABILITIES, REQUIRED_PROCESS_SOURCE_CODES } from "./source-registry.ts";
import { PROCESS_STATUS_POLICY_VERSION, resolveClientProcessStatus } from "./status-policy.ts";
import { derivePublicProcessTimeline } from "./timeline-policy.ts";

const unavailable = (
    code: ProcessSourceCode,
    entry?: ProcessSourceDefinition,
    registryVersion = "",
    readCut = "",
  ): ProcessOwnerResult => ({
    state: "unavailable",
    sourceCode: code,
    ownerVersion: entry?.ownerVersion ?? "unavailable",
    registryVersion,
    readCut,
    sourceVersion: "unavailable",
    bindingMode: "none",
    resourceFences: [],
  }),
  priorityBands: Record<keyof DashboardPriorityInput, number> = {
    security: 1,
    payments: 2,
    documents: 3,
    tasks: 4,
    appointments: 5,
    services: 6,
    notifications: 7,
  };
function validDate(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
function factCounts(result: ProcessOwnerResult) {
  const priority = Object.values(result.priority ?? {}).reduce(
    (n, value) => n + (value?.candidates.length ?? 0),
    0,
  );
  return {
    items: result.items?.length ?? 0,
    milestones: result.milestones?.length ?? 0,
    blockers: result.blockers?.length ?? 0,
    priority,
    events: result.events?.length ?? 0,
  };
}
export function canonicalizeProcessFactFences(
  fences: readonly ProcessFactFence[],
): readonly ProcessFactFence[] | undefined {
  const byId = new Map<string, string>(),
    byFact = new Map<string, string>(),
    result: ProcessFactFence[] = [];
  for (const fence of fences) {
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
      knownId = byId.get(fence.internalResourceId),
      knownFact = byFact.get(fence.factRef);
    if (knownId === signature && knownFact === signature) continue;
    if (knownId || knownFact) return undefined;
    byId.set(fence.internalResourceId, signature);
    byFact.set(fence.factRef, signature);
    result.push(fence);
  }
  return Object.freeze(result);
}
function validOwner(
  entry: ProcessSourceDefinition,
  result: ProcessOwnerResult,
  registryVersion: string,
  readCut: string,
  now: Date,
  continuation?: ProcessTimelineContinuation,
) {
  if (
    result.sourceCode !== entry.code ||
    result.ownerVersion !== entry.ownerVersion ||
    result.registryVersion !== registryVersion ||
    result.readCut !== readCut ||
    !result.sourceVersion.trim() ||
    (continuation &&
      (entry.code !== "timeline" ||
        result.sourceVersion !== continuation.timelineSourceVersion ||
        result.highWatermark !== continuation.highWatermark))
  )
    return false;
  const capabilities = PROCESS_SOURCE_CAPABILITIES[entry.code],
    priorityKeys = Object.keys(result.priority ?? {}) as (keyof DashboardPriorityInput)[];
  if (
    priorityKeys.some(
      (key) =>
        !capabilities.priority.includes(key) || priorityBands[key] < entry.highestPriorityBand,
    ) ||
    (!capabilities.blockers && Boolean(result.blockers?.length))
  )
    return false;
  if (result.state === "stale" || result.state === "unavailable")
    return (
      result.bindingMode === "none" &&
      result.resourceFences.length === 0 &&
      !result.items?.length &&
      !result.milestones?.length &&
      !result.blockers?.length &&
      !result.events?.length &&
      !priorityKeys.length
    );
  if (result.state === "empty") {
    const fence = result.resourceFences[0];
    if (!fence) return false;
    return (
      !continuation &&
      result.bindingMode === "absence_fence" &&
      result.resourceFences.length === 1 &&
      fence.factKind === "absence" &&
      fence.sourceCode === entry.code &&
      fence.sourceVersion === result.sourceVersion &&
      fence.registryVersion === registryVersion &&
      fence.readCut === readCut &&
      Boolean(fence.internalResourceId) &&
      Boolean(fence.factRef) &&
      Number.isSafeInteger(fence.resourceEpoch) &&
      fence.resourceEpoch >= 0 &&
      !result.items?.length &&
      !result.milestones?.length &&
      !result.blockers?.length &&
      !result.events?.length &&
      !priorityKeys.length
    );
  }
  const asOf = result.asOf;
  if (
    result.bindingMode !== "resource_fences" ||
    !validDate(asOf) ||
    Date.parse(asOf) > now.getTime() ||
    now.getTime() - Date.parse(asOf) > entry.freshnessMs
  )
    return false;
  if (entry.code === "timeline") {
    const highWatermark = result.highWatermark;
    if (
      !validDate(highWatermark) ||
      result.events?.some((event) => Date.parse(event.recordedAt) > Date.parse(highWatermark))
    )
      return false;
  }
  const counts = factCounts(result),
    expected = Object.entries(counts).filter(([, count]) => count > 0) as [
      Exclude<keyof typeof counts, never>,
      number,
    ][];
  if (!expected.length || expected.some(([kind]) => !capabilities.facts.includes(kind)))
    return false;
  const seenIds = new Set<string>(),
    seenRefs = new Set<string>();
  for (const fence of result.resourceFences) {
    if (
      seenIds.has(fence.internalResourceId) ||
      seenRefs.has(fence.factRef) ||
      fence.sourceCode !== entry.code ||
      fence.sourceVersion !== result.sourceVersion ||
      fence.registryVersion !== registryVersion ||
      fence.readCut !== readCut ||
      !capabilities.facts.includes(fence.factKind) ||
      !fence.internalResourceId ||
      !fence.factRef ||
      !Number.isSafeInteger(fence.resourceEpoch) ||
      fence.resourceEpoch < 0
    )
      return false;
    seenIds.add(fence.internalResourceId);
    seenRefs.add(fence.factRef);
  }
  return (
    expected.every(
      ([kind, count]) => result.resourceFences.filter((f) => f.factKind === kind).length === count,
    ) && result.resourceFences.length === expected.reduce((n, [, count]) => n + count, 0)
  );
}
async function bounded(
  port: ProcessOwnerPort | undefined,
  entry: ProcessSourceDefinition,
  input: {
    snapshot: DashboardAuthorizationSnapshot;
    root: AuthorizedProcessRoot;
    readCut: string;
    timelineContinuation?: ProcessTimelineContinuation;
  },
  registryVersion: string,
  timeout: number,
  now: Date,
) {
  if (!port) return unavailable(entry.code, entry, registryVersion, input.readCut);
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), timeout);
  try {
    const result = await Promise.race([
        port.load({ ...input, signal: controller.signal }),
        new Promise<ProcessOwnerResult>((resolve) =>
          controller.signal.addEventListener(
            "abort",
            () => resolve(unavailable(entry.code, entry, registryVersion, input.readCut)),
            { once: true },
          ),
        ),
      ]),
      resourceFences = canonicalizeProcessFactFences(result.resourceFences);
    if (!resourceFences) return unavailable(entry.code, entry, registryVersion, input.readCut);
    const normalized = { ...result, resourceFences };
    return validOwner(
      entry,
      normalized,
      registryVersion,
      input.readCut,
      now,
      input.timelineContinuation,
    )
      ? normalized
      : unavailable(entry.code, entry, registryVersion, input.readCut);
  } catch {
    return unavailable(entry.code, entry, registryVersion, input.readCut);
  } finally {
    clearTimeout(timer);
  }
}
const emptyPriority = (
  state: DashboardPrioritySource["state"] = "unavailable",
): DashboardPrioritySource => ({ state, candidates: [] });
function processPriority(
  entries: readonly ProcessSourceDefinition[],
  loaded: ReadonlyMap<ProcessSourceCode, ProcessOwnerResult>,
): { kind: "none" | "unconfirmed" } | { kind: "action"; action: ProcessActionDto } {
  const input: Record<keyof DashboardPriorityInput, DashboardPrioritySource> = {
    security: emptyPriority("empty"),
    payments: emptyPriority(),
    documents: emptyPriority(),
    tasks: emptyPriority(),
    appointments: emptyPriority(),
    services: emptyPriority(),
    notifications: emptyPriority("empty"),
  };
  for (const entry of entries) {
    const value = loaded.get(entry.code);
    for (const key of PROCESS_SOURCE_CAPABILITIES[entry.code].priority) {
      const priority = value?.priority?.[key];
      if (!value || value.state === "stale" || value.state === "unavailable")
        input[key] = emptyPriority();
      else if (value.state === "empty" || !priority) input[key] = emptyPriority("empty");
      else input[key] = priority;
    }
  }
  try {
    const selected = selectProcessPriority(input);
    if (selected.kind !== "action") return { kind: selected.kind };
    const action = selected.action;
    if (!PROCESS_ROUTE_KEYS.includes(action.routeKey as never)) return { kind: "unconfirmed" };
    const types: Record<ClientActionDto["type"], ProcessActionDto["type"]> = {
      security_identity: "security_identity",
      blocking_payment: "blocking_payment",
      expired_document: "blocking_document",
      pending_signature: "signature",
      due_task: "due_task",
      imminent_appointment: "immediate_appointment",
      missing_information: "missing_information",
      general_action: "general_action",
    };
    return {
      kind: "action",
      action: {
        type: types[action.type],
        label: action.title,
        responsibleParty: action.type === "general_action" ? "sg_solutions" : "client",
        routeKey: action.routeKey as ProcessActionDto["routeKey"],
      },
    };
  } catch {
    return { kind: "unconfirmed" };
  }
}
function deterministicBlockers(
  entries: readonly ProcessSourceDefinition[],
  loaded: ReadonlyMap<ProcessSourceCode, ProcessOwnerResult>,
): readonly ProcessBlockerDto[] {
  const rows = entries.flatMap((entry) => {
    const value = loaded.get(entry.code);
    return value?.state === "fresh" && PROCESS_SOURCE_CAPABILITIES[entry.code].blockers
      ? [...(value.blockers ?? [])]
      : [];
  });
  rows.sort(
    (a, b) =>
      a.effect.localeCompare(b.effect, "en") ||
      a.code.localeCompare(b.code, "en") ||
      a.label.localeCompare(b.label, "en") ||
      a.responsibleParty.localeCompare(b.responsibleParty, "en"),
  );
  const seen = new Set<string>();
  return Object.freeze(
    rows
      .filter((row) => {
        const key = [
          row.effect,
          row.code,
          row.label,
          row.responsibleParty,
          row.routeKey ?? "",
        ].join("\0");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12),
  );
}
function policyMatches(
  policy: ProcessEligibilityPolicySnapshot,
  root: AuthorizedProcessRoot,
  registryVersion: string,
  snapshot: DashboardAuthorizationSnapshot,
  now: Date,
) {
  return (
    policy.version === root.eligibilityPolicyVersion &&
    policy.registryVersion === registryVersion &&
    policy.entitlementVersion === root.entitlement.version &&
    isFreshAuthoritativeEligibility(policy, snapshot, now) &&
    isProcessEligible(
      {
        definitionVersion: root.definitionVersion,
        workflowVersion: root.workflowVersion,
        tombstoned: false,
      },
      policy,
    )
  );
}
function cursorBinding(
  snapshot: DashboardAuthorizationSnapshot,
  root: AuthorizedProcessRoot,
  policy: ProcessEligibilityPolicySnapshot,
  mappingPolicyVersion: string,
): ProcessTimelineCursorBinding {
  return {
    accountId: String(snapshot.accountId),
    contextRef: root.ownerContextRef,
    serviceRef: root.serviceRef,
    rootEpoch: root.rootFence.resourceEpoch,
    authorizationEpoch: String(snapshot.authorizationEpoch),
    policyEpoch: String(snapshot.policyEpoch),
    eligibilityPolicyVersion: policy.version,
    entitlementVersion: policy.entitlementVersion,
    registryVersion: policy.registryVersion,
    mappingPolicyVersion,
    readCut: root.readCut,
  };
}
export class ClientProcessStatusQueryService {
  constructor(private readonly d: ProcessQueryDependencies) {}
  async landing(input: {
    request: unknown;
    contextRef?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ProcessQueryResult<ClientProcessLandingDto>> {
    const auth = await this.d.auth.authorize({
      request: input.request,
      contextRef: input.contextRef,
    });
    if (auth.kind !== "authorized") return auth;
    if (!this.d.eligibility) return { kind: "unavailable" };
    if (input.cursor && !PROCESS_LANDING_CURSOR_PATTERN.test(input.cursor))
      return { kind: "unavailable" };
    const result = await this.d.choices.list({
      snapshot: auth.snapshot,
      limit: Math.min(Math.max(input.limit ?? 12, 1), 24),
      ...(input.cursor ? { cursor: input.cursor } : {}),
    });
    if (result.state === "unavailable" || result.state === "restart")
      return { kind: "unavailable" };
    const fences =
      result.state === "empty"
        ? result.absenceFence
          ? [result.absenceFence]
          : []
        : result.choices.flatMap((choice) => (choice.rootFence ? [choice.rootFence] : []));
    if (
      (result.state === "empty" && fences.length !== 1) ||
      (result.state === "fresh" && fences.length !== result.choices.length)
    )
      return { kind: "unavailable" };
    if (
      !(await this.d.eligibility.verifyLanding({
        snapshot: auth.snapshot,
        choices: result.choices,
        fences,
      })) ||
      !(await this.d.choices.verify({ snapshot: auth.snapshot, fences })) ||
      !(await this.d.auth.revalidate(auth.snapshot))
    )
      return { kind: "retry_required" };
    try {
      return {
        kind: "ok",
        dto: parseClientProcessLandingDto({
          schemaVersion: "m010.landing.v1",
          availability: result.state === "empty" ? "empty" : "fresh",
          context: result.context,
          choices: result.choices.map((choice) => ({
            serviceRef: choice.serviceRef,
            serviceLabel: choice.serviceLabel,
            ...(choice.instanceLabel ? { instanceLabel: choice.instanceLabel } : {}),
            context: choice.context,
          })),
          hasMore: result.hasMore,
          ...(result.cursor ? { cursor: result.cursor } : {}),
        }),
      };
    } catch {
      return { kind: "unavailable" };
    }
  }
  async detail(input: {
    request: unknown;
    serviceRef: string;
    contextRef?: string;
    timelineCursor?: string;
  }): Promise<ProcessQueryResult<ClientProcessDetailDto>> {
    const auth = await this.d.auth.authorize({
      request: input.request,
      contextRef: input.contextRef,
    });
    if (auth.kind !== "authorized") return auth;
    if (!this.d.eligibility || !this.d.registry?.entries.length) return { kind: "unavailable" };
    if (input.timelineCursor && !PROCESS_TIMELINE_CURSOR_PATTERN.test(input.timelineCursor))
      return { kind: "not_found" };
    const selected = await this.d.roots.resolve({
      snapshot: auth.snapshot,
      serviceRef: input.serviceRef,
    });
    if (selected.state === "unavailable") return { kind: "unavailable" };
    const now = this.d.now?.() ?? new Date();
    if (selected.state === "hidden" || !isProcessRootAuthorized(auth.snapshot, selected.root, now))
      return { kind: "not_found" };
    const root = selected.root,
      registry = this.d.registry;
    if (
      root.sourceRegistryVersion !== registry.version ||
      !registry.acceptedDefinitionVersions.includes(root.definitionVersion) ||
      !registry.acceptedWorkflowVersions.includes(root.workflowVersion)
    )
      return { kind: "not_found" };
    const eligibility = await this.d.eligibility.evaluate({
      snapshot: auth.snapshot,
      serviceRef: root.serviceRef,
      definitionVersion: root.definitionVersion,
      workflowVersion: root.workflowVersion,
      expectedPolicyVersion: root.eligibilityPolicyVersion,
      expectedRegistryVersion: registry.version,
      expectedEntitlementVersion: root.entitlement.version,
    });
    if (eligibility.kind === "unavailable") return { kind: "unavailable" };
    if (
      eligibility.kind === "ineligible" ||
      !policyMatches(eligibility.policy, root, registry.version, auth.snapshot, now)
    )
      return { kind: "not_found" };
    const binding = cursorBinding(
      auth.snapshot,
      root,
      eligibility.policy,
      registry.mappingPolicyVersion,
    );
    let continuation: ProcessTimelineContinuation | undefined;
    if (input.timelineCursor) {
      if (!this.d.timelineCursors) return { kind: "unavailable" };
      const opened = await this.d.timelineCursors.open({
        cursor: input.timelineCursor,
        binding,
        now: now.toISOString(),
      });
      if (opened.kind !== "valid")
        return { kind: opened.kind === "invalid" ? "retry_required" : "unavailable" };
      continuation = opened.continuation;
    }
    const loaded = new Map<ProcessSourceCode, ProcessOwnerResult>();
    await Promise.all(
      registry.entries.map(async (entry) =>
        loaded.set(
          entry.code,
          await bounded(
            this.d.owners?.[entry.code],
            entry,
            {
              snapshot: auth.snapshot,
              root,
              readCut: root.readCut,
              ...(entry.code === "timeline" && continuation
                ? { timelineContinuation: continuation }
                : {}),
            },
            registry.version,
            this.d.ownerTimeoutMs ?? 400,
            now,
          ),
        ),
      ),
    );
    const childFences = [...loaded.values()].flatMap((value) => value.resourceFences),
      ids = new Set(childFences.map((f) => f.internalResourceId));
    if (ids.size !== childFences.length) return { kind: "retry_required" };
    const blockers = deterministicBlockers(registry.entries, loaded),
      requiredEntries = REQUIRED_PROCESS_SOURCE_CODES.map((code) =>
        registry.entries.find((entry) => entry.code === code),
      ),
      criticalComplete = requiredEntries.every(
        (entry) =>
          entry?.critical === true &&
          (loaded.get(entry.code)?.state === "fresh" || loaded.get(entry.code)?.state === "empty"),
      ),
      status = criticalComplete
        ? resolveClientProcessStatus(root.axes, { blockers })
        : { kind: "unconfirmed" as const, policyVersion: PROCESS_STATUS_POLICY_VERSION },
      priority = criticalComplete
        ? processPriority(registry.entries, loaded)
        : { kind: "unconfirmed" as const };
    const sections: ClientProcessDetailDto["sections"] = {};
    for (const name of PROCESS_SECTION_NAMES) {
      const value = loaded.get(name);
      const asOf = value?.asOf;
      sections[name] =
        value?.state === "fresh" && value.items?.length && validDate(asOf)
          ? { state: "fresh", asOf, items: value.items }
          : value?.state === "empty" && validDate(asOf)
            ? { state: "empty", asOf }
            : value?.state === "stale" && validDate(value.asOf)
              ? { state: "stale", asOf: value.asOf }
              : { state: "unavailable" };
    }
    const workflow = loaded.get("workflow"),
      timelineOwner = loaded.get("timeline");
    if (continuation && timelineOwner?.state !== "fresh") return { kind: "retry_required" };
    let timeline: ClientProcessDetailDto["timeline"];
    if (timelineOwner?.state === "fresh" || timelineOwner?.state === "empty") {
      const timelineFence = timelineOwner.resourceFences[0],
        derived = derivePublicProcessTimeline({
          scope: {
            serviceOrderId: root.serviceOrderId,
            contextRef: root.ownerContextRef,
            workflowVersion: root.workflowVersion,
          },
          events: timelineOwner.events ?? [],
          mappings: registry.eventMappings,
          resourceFences: timelineOwner.resourceFences,
          authorizationEpoch: auth.snapshot.authorizationEpoch,
          policyEpoch: auth.snapshot.policyEpoch,
          sourceVersion: timelineOwner.sourceVersion,
          readCut: root.readCut,
          highWatermark: timelineOwner.highWatermark,
          ...(continuation ? { after: continuation.after } : {}),
          ...(timelineOwner.state === "empty" && timelineFence
            ? {
                absenceFence: {
                  resourceId: timelineFence.internalResourceId,
                  resourceEpoch: timelineFence.resourceEpoch,
                  sourceVersion: timelineFence.sourceVersion,
                },
              }
            : {}),
        });
      let cursor: string | undefined;
      if (derived.hasMore) {
        if (
          !this.d.timelineCursors ||
          !("nextKeyset" in derived) ||
          derived.nextKeyset === undefined ||
          !timelineOwner.highWatermark
        )
          timeline = { state: "unconfirmed", items: [], hasMore: false };
        else {
          const sealed = await this.d.timelineCursors.seal({
            binding,
            continuation: {
              timelineSourceVersion: timelineOwner.sourceVersion,
              highWatermark: timelineOwner.highWatermark,
              after: derived.nextKeyset,
            },
            expiresAt: new Date(now.getTime() + 300000).toISOString(),
          });
          if (sealed.kind === "sealed" && PROCESS_TIMELINE_CURSOR_PATTERN.test(sealed.cursor))
            cursor = sealed.cursor;
          else timeline = { state: "unconfirmed", items: [], hasMore: false };
        }
      }
      if (!timeline)
        timeline = {
          state: derived.state,
          items: derived.items,
          hasMore: Boolean(cursor),
          ...(cursor ? { cursor } : {}),
        };
    } else if (timelineOwner) timeline = { state: "unavailable", items: [], hasMore: false };
    if (
      !(await this.d.roots.verify({
        snapshot: auth.snapshot,
        rootFence: root.rootFence,
        childFences,
        eligibilityPolicyVersion: eligibility.policy.version,
        entitlementVersion: eligibility.policy.entitlementVersion,
        registryVersion: registry.version,
        mappingPolicyVersion: registry.mappingPolicyVersion,
        definitionVersion: root.definitionVersion,
        workflowVersion: root.workflowVersion,
        permission: "client.service.read",
        readCut: root.readCut,
      })) ||
      !(await this.d.eligibility.revalidate({
        snapshot: auth.snapshot,
        policy: eligibility.policy,
      })) ||
      !(await this.d.auth.revalidate(auth.snapshot))
    )
      return { kind: "retry_required" };
    const incomplete = [...loaded.values()].some(
        (v) => v.state === "unavailable" || v.state === "stale",
      ),
      availability =
        status.kind === "unconfirmed" || priority.kind === "unconfirmed"
          ? "unconfirmed"
          : incomplete
            ? "partial"
            : "fresh";
    try {
      return {
        kind: "ok",
        dto: parseClientProcessDetailDto({
          schemaVersion: "m010.detail.v1",
          availability,
          context: root.context,
          service: {
            serviceRef: root.serviceRef,
            label: root.serviceLabel,
            ...(root.instanceLabel ? { instanceLabel: root.instanceLabel } : {}),
          },
          ...(status.kind === "confirmed"
            ? { status: { code: status.code }, lastConfirmedAt: root.updatedAt }
            : {}),
          ...(priority.kind === "action"
            ? { nextAction: priority.action, responsibleParty: priority.action.responsibleParty }
            : {}),
          ...(blockers.length ? { blockers } : {}),
          ...(workflow?.state === "fresh" && workflow.milestones?.length
            ? { milestones: workflow.milestones }
            : {}),
          ...(timeline ? { timeline } : {}),
          sections,
        }),
      };
    } catch {
      return { kind: "unavailable" };
    }
  }
}
