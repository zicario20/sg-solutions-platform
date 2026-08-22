import {
  createDashboardAuthorizationSnapshot,
  revalidateDashboardAuthorization,
  type DashboardAuthPort,
} from "./authorization.ts";
import {
  DASHBOARD_OWNER_CODES,
  DASHBOARD_SECTION_LIMITS,
  parseDashboardFragment,
  type DashboardDto,
  type DashboardLocale,
  type DashboardOwnerCode,
  type DashboardOwnerDataMap,
  type DashboardOwnerFragment,
  type DashboardSection,
  type SecurityDashboardData,
} from "./contracts.ts";
import type { DashboardOwnerPorts } from "./ports.ts";
import { sanitizeDashboardDtoForSerialization } from "./serialization.ts";
import {
  selectDashboardPriority,
  type DashboardPriorityInput,
  type PrioritySourceCode,
} from "./priority.ts";

export type ClientDashboardQueryRequest = Readonly<{
  sessionHandle: string;
  requestedContext?: string;
  locale: DashboardLocale;
}>;

export type ClientDashboardQueryResult =
  | Readonly<{ kind: "ok"; dto: DashboardDto }>
  | Readonly<{ kind: "denied" }>
  | Readonly<{ kind: "retry_required" }>;

type ServiceOptions = Readonly<{
  authPort: DashboardAuthPort;
  ownerPorts: DashboardOwnerPorts;
  timeoutMs?: number;
  maxConcurrency?: number;
}>;

const unavailable = (owner: DashboardOwnerCode, snapshotId: string): DashboardOwnerFragment => Object.freeze({
  owner,
  snapshotId,
  sourceVersion: `${owner}.unavailable.v1`,
  classification: "client_safe",
  state: "unavailable",
  safeReason: "source_unavailable",
});

function snapshotId(parts: readonly string[]): string {
  return parts.map((part) => `${part.length}:${part}`).join("|");
}

async function queryOwner(
  owner: DashboardOwnerCode,
  ports: DashboardOwnerPorts,
  snapshot: Parameters<DashboardOwnerPorts[DashboardOwnerCode]["query"]>[0]["snapshot"],
  frozenSnapshotId: string,
  timeoutMs: number,
): Promise<DashboardOwnerFragment> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("DASHBOARD_OWNER_TIMEOUT"));
      }, timeoutMs);
    });
    const raw = await Promise.race([
      ports[owner].query({ snapshot, snapshotId: frozenSnapshotId, limit: DASHBOARD_SECTION_LIMITS[owner], signal: controller.signal }),
      timeout,
    ]);
    const parsed = parseDashboardFragment(raw);
    if (parsed.owner !== owner || parsed.snapshotId !== frozenSnapshotId || !parsed.sourceVersion.startsWith(`${owner}.`)) throw new Error("DASHBOARD_OWNER_MISMATCH");
    return parsed;
  } catch {
    return unavailable(owner, frozenSnapshotId);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function boundedOwners(
  ports: DashboardOwnerPorts,
  snapshot: Parameters<DashboardOwnerPorts[DashboardOwnerCode]["query"]>[0]["snapshot"],
  frozenSnapshotId: string,
  timeoutMs: number,
  maxConcurrency: number,
): Promise<Readonly<Record<DashboardOwnerCode, DashboardOwnerFragment>>> {
  const results = new Map<DashboardOwnerCode, DashboardOwnerFragment>();
  let cursor = 0;
  const worker = async () => {
    while (cursor < DASHBOARD_OWNER_CODES.length) {
      const owner = DASHBOARD_OWNER_CODES[cursor++];
      if (owner) results.set(owner, await queryOwner(owner, ports, snapshot, frozenSnapshotId, timeoutMs));
    }
  };
  await Promise.all(Array.from({ length: Math.min(maxConcurrency, DASHBOARD_OWNER_CODES.length) }, worker));
  return Object.fromEntries(DASHBOARD_OWNER_CODES.map((owner) => [owner, results.get(owner) ?? unavailable(owner, frozenSnapshotId)])) as Record<DashboardOwnerCode, DashboardOwnerFragment>;
}

function section<K extends DashboardOwnerCode>(fragment: DashboardOwnerFragment): DashboardSection<DashboardOwnerDataMap[K]> {
  return Object.freeze({
    state: fragment.state,
    ...(fragment.asOf === undefined ? {} : { asOf: fragment.asOf }),
    ...(fragment.safeReason === undefined ? {} : { safeReason: fragment.safeReason }),
    ...(fragment.state !== "fresh" || fragment.data === undefined ? {} : { data: fragment.data as DashboardOwnerDataMap[K] }),
  });
}

const prioritySources: readonly PrioritySourceCode[] = ["security", "payments", "documents", "tasks", "appointments", "services", "notifications"];

function candidates(owner: PrioritySourceCode, fragment: DashboardOwnerFragment): DashboardPriorityInput[PrioritySourceCode]["candidates"] {
  if (fragment.data === undefined) return [];
  if (owner === "security" && !Array.isArray(fragment.data)) return (fragment.data as SecurityDashboardData).actions;
  if (!Array.isArray(fragment.data)) return [];
  return fragment.data.flatMap((item) => "action" in item && item.action ? [item.action] : []);
}

function priorityInput(fragments: Readonly<Record<DashboardOwnerCode, DashboardOwnerFragment>>): DashboardPriorityInput {
  return Object.fromEntries(prioritySources.map((owner) => [owner, {
    state: fragments[owner].state,
    candidates: candidates(owner, fragments[owner]),
  }])) as DashboardPriorityInput;
}

export class ClientDashboardQueryService {
  readonly #authPort: DashboardAuthPort;
  readonly #ownerPorts: DashboardOwnerPorts;
  readonly #timeoutMs: number;
  readonly #maxConcurrency: number;

  constructor(options: ServiceOptions) {
    this.#authPort = options.authPort;
    this.#ownerPorts = options.ownerPorts;
    this.#timeoutMs = Math.max(10, Math.min(options.timeoutMs ?? 500, 2_000));
    this.#maxConcurrency = Math.max(1, Math.min(options.maxConcurrency ?? 3, 4));
  }

  async query(request: ClientDashboardQueryRequest): Promise<ClientDashboardQueryResult> {
    const authorization = await createDashboardAuthorizationSnapshot(request, this.#authPort);
    if (authorization.kind !== "authorized") return { kind: "denied" };
    const snapshot = authorization.snapshot;
    const frozenSnapshotId = snapshotId([
      snapshot.accountId,
      snapshot.sessionId,
      snapshot.sessionFamilyId,
      snapshot.userId,
      snapshot.context.type,
      snapshot.context.opaqueRef,
      snapshot.membershipFence,
      snapshot.resourceGrantFence,
      snapshot.entitlementFence,
      snapshot.authenticationEpoch,
      snapshot.authorizationEpoch,
      snapshot.policyEpoch,
      snapshot.policyVersion,
      snapshot.locale,
      snapshot.capturedAt.toISOString(),
    ]);
    const fragments = await boundedOwners(this.#ownerPorts, snapshot, frozenSnapshotId, this.#timeoutMs, this.#maxConcurrency);
    const priority = selectDashboardPriority(priorityInput(fragments));
    const revalidated = await revalidateDashboardAuthorization(snapshot, this.#authPort);
    if (revalidated.kind !== "authorized") return { kind: "retry_required" };
    const dto: DashboardDto = Object.freeze({
      locale: snapshot.locale,
      context: Object.freeze({ type: snapshot.context.type, selectedOpaqueRef: snapshot.context.opaqueRef, options: snapshot.contextOptions }),
      priority,
      importantAlerts: section<"notifications">(fragments.notifications),
      security: section<"security">(fragments.security),
      services: section<"services">(fragments.services),
      tasks: section<"tasks">(fragments.tasks),
      documents: section<"documents">(fragments.documents),
      appointments: section<"appointments">(fragments.appointments),
      payments: section<"payments">(fragments.payments),
      messages: section<"messages">(fragments.messages),
      notifications: section<"notifications">(fragments.notifications),
      help: section<"help">(fragments.help),
    });
    return Object.freeze({ kind: "ok", dto: sanitizeDashboardDtoForSerialization(dto) });
  }
}
