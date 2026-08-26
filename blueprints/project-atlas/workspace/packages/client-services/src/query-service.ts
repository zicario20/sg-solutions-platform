import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";
import { isClientServiceAuthorized } from "./authorization.ts";
import {
  CLIENT_SERVICE_LIST_LIMIT,
  CLIENT_SERVICE_REF_PATTERN,
  CLIENT_SERVICE_SECTION_NAMES,
  type ClientServiceCardDto,
  type ClientServiceDetailDto,
  type ClientServiceListDto,
  type ClientServicePublicContextDto,
  parseClientServiceDetailDto,
  parseClientServiceListDto,
} from "./contracts.ts";
import type {
  AuthorizedServiceChoice,
  AuthorizedServiceChoiceCandidate,
  ClientServiceFinalFence,
  ClientServiceRootProjection,
  ClientServiceSectionLoadResult,
  ClientServiceSectionPort,
  ClientServiceSectionPorts,
  ClientServicesAuthPort,
  ClientServicesSourcePort,
} from "./ports.ts";
import { resolveClientServicePublicState } from "./status-policy.ts";

export type ClientServicesQueryResult<T> =
  | { kind: "ok"; dto: T }
  | { kind: "denied" }
  | { kind: "not_found" }
  | { kind: "retry_required" }
  | { kind: "unavailable" };
export interface ClientServicesQueryDependencies {
  auth: ClientServicesAuthPort;
  source: ClientServicesSourcePort;
  sections: ClientServiceSectionPorts;
  now?: () => Date;
  ownerTimeoutMs?: number;
}

const localized = (root: ClientServiceRootProjection, locale: "es" | "en") => root.displays[locale];
const criticalUnavailable = (root: ClientServiceRootProjection) =>
  Object.values(root.criticalSources).some((state) => state === "unavailable");
function card(
  root: ClientServiceRootProjection,
  locale: "es" | "en",
  unsafe = false,
): ClientServiceCardDto {
  const copy = localized(root, locale);
  const state =
    unsafe || criticalUnavailable(root)
      ? "unconfirmed"
      : resolveClientServicePublicState(root.axes);
  const current =
    root.currentMilestoneIndex === undefined
      ? undefined
      : copy.milestones[root.currentMilestoneIndex];
  return {
    opaqueRef: root.opaqueRef,
    publicReference: root.publicReference,
    context: { type: root.contextType, label: copy.contextLabel },
    serviceName: copy.serviceName,
    categoryLabel: copy.categoryLabel,
    publicState: state,
    publicStateLabel:
      copy.publicStateLabels[state] ?? copy.publicStateLabels.unconfirmed ?? "Unconfirmed",
    axes: root.axes,
    axisLabels: {
      commercial: copy.axisLabels.commercial[root.axes.commercial] ?? "Unconfirmed",
      financial: copy.axisLabels.financial[root.axes.financial] ?? "Unconfirmed",
      activation: copy.axisLabels.activation[root.axes.activation] ?? "Unconfirmed",
      fulfillment: copy.axisLabels.fulfillment[root.axes.fulfillment] ?? "Unconfirmed",
    },
    ...(current ? { currentMilestone: current } : {}),
    milestones: { completed: root.completedMilestones, total: copy.milestones.length },
    ...(!unsafe && !criticalUnavailable(root) && copy.nextStepLabel
      ? { nextStepLabel: copy.nextStepLabel }
      : {}),
    updatedAt: root.updatedAt.toISOString(),
  };
}
function unavailable(
  reason: "provider_disabled" | "source_unavailable" | "timeout" = "source_unavailable",
): ClientServiceSectionLoadResult {
  return {
    section: { state: "unavailable", generatedAt: new Date(0).toISOString(), reason },
    sourceVersion: "unavailable",
    bindingMode: "none",
    resourceFences: [],
  };
}
function hasValidFreshProof(result: ClientServiceSectionLoadResult): boolean {
  if (result.section.state !== "fresh" && result.section.state !== "empty") return true;
  const expectedMode = result.section.state === "fresh" ? "resource_fences" : "absence_fence";
  const expectedFenceCount =
    result.section.state === "fresh" ? Math.max(1, result.section.data.length) : 1;
  if (
    result.bindingMode !== expectedMode ||
    !result.sourceVersion.trim() ||
    result.resourceFences.length !== expectedFenceCount
  )
    return false;
  const identities = new Set<string>();
  for (const resource of result.resourceFences) {
    if (
      !resource.internalResourceId.trim() ||
      !Number.isSafeInteger(resource.resourceEpoch) ||
      resource.resourceEpoch < 0 ||
      resource.sourceVersion !== result.sourceVersion ||
      identities.has(resource.internalResourceId)
    )
      return false;
    identities.add(resource.internalResourceId);
  }
  return true;
}
export async function loadBoundedClientServiceSection(
  port: ClientServiceSectionPort,
  snapshot: DashboardAuthorizationSnapshot,
  root: ClientServiceRootProjection,
  timeoutMs: number,
): Promise<ClientServiceSectionLoadResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      port.load({ snapshot, root, signal: controller.signal }),
      new Promise<ClientServiceSectionLoadResult>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(unavailable("timeout"));
        }, timeoutMs);
      }),
    ]);
    return hasValidFreshProof(result) ? result : unavailable();
  } catch {
    return unavailable();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function fence(
  root: ClientServiceRootProjection,
  children: readonly ClientServiceSectionLoadResult[],
): ClientServiceFinalFence {
  return {
    serviceOrderId: root.serviceOrderId,
    rootEpoch: root.resourceEpoch,
    definitionVersionId: root.acceptedDefinitionVersionId,
    definitionEpoch: root.acceptedDefinitionEpoch,
    grantAuthorizationEpoch: root.grant.authorizationEpoch,
    grantPolicyEpoch: root.grant.policyEpoch,
    grantResourceEpoch: root.grant.resourceEpoch,
    ownerFacts: root.ownerFacts,
    childResources: children.flatMap((child) => child.resourceFences),
  };
}
function hasDuplicateChildFence(children: readonly ClientServiceSectionLoadResult[]): boolean {
  const seen = new Set<string>();
  for (const child of children)
    for (const resource of child.resourceFences) {
      if (seen.has(resource.internalResourceId)) return true;
      seen.add(resource.internalResourceId);
    }
  return false;
}
async function verifyFinal(
  dependencies: ClientServicesQueryDependencies,
  snapshot: DashboardAuthorizationSnapshot,
  proof: ClientServiceFinalFence,
): Promise<boolean> {
  return (
    (await dependencies.source.verifyFinalFence({ snapshot, fence: proof })) &&
    (await dependencies.auth.revalidate(snapshot))
  );
}
function snapshotContext(snapshot: DashboardAuthorizationSnapshot) {
  const type =
    snapshot.context.type === "organization" ? ("organization" as const) : ("personal" as const);
  const selected = snapshot.contextOptions.find(
    (option) => option.opaqueRef === snapshot.context.opaqueRef,
  );
  const fallback =
    snapshot.locale === "es"
      ? type === "organization"
        ? "Organización"
        : "Personal"
      : type === "organization"
        ? "Organization"
        : "Personal";
  return { type, label: selected?.label ?? fallback };
}

export class ClientServicesQueryService {
  constructor(private readonly dependencies: ClientServicesQueryDependencies) {}
  async list(input: {
    request: unknown;
    contextOpaqueRef?: string;
    query?: string;
    status?: string;
    limit?: number;
  }): Promise<ClientServicesQueryResult<ClientServiceListDto>> {
    const auth = await this.dependencies.auth.authorize({
      request: input.request,
      contextOpaqueRef: input.contextOpaqueRef,
    });
    if (auth.kind !== "authorized") return auth;
    return this.listAuthorized({
      snapshot: auth.snapshot,
      query: input.query,
      status: input.status,
      limit: input.limit,
    });
  }
  async listAuthorized(input: {
    snapshot: DashboardAuthorizationSnapshot;
    query?: string;
    status?: string;
    limit?: number;
  }): Promise<ClientServicesQueryResult<ClientServiceListDto>> {
    const source = await this.dependencies.source.list({
      snapshot: input.snapshot,
      query: input.query,
      status: input.status,
      limit: Math.min(
        Math.max(input.limit ?? CLIENT_SERVICE_LIST_LIMIT, 1),
        CLIENT_SERVICE_LIST_LIMIT,
      ),
    });
    if (source.state === "unavailable") return { kind: "unavailable" };
    const query = input.query?.trim().toLocaleLowerCase(input.snapshot.locale);
    const roots = (
      source.state === "fresh"
        ? source.items.filter((root) =>
            isClientServiceAuthorized(
              input.snapshot,
              root,
              this.dependencies.now?.() ?? new Date(),
            ),
          )
        : []
    ).filter((root) => {
      const item = card(root, input.snapshot.locale);
      return (
        (!input.status || item.publicState === input.status) &&
        (!query ||
          [item.publicReference, item.serviceName, item.categoryLabel].some((value) =>
            value.toLocaleLowerCase(input.snapshot.locale).includes(query),
          ))
      );
    });
    for (const root of roots)
      if (!(await verifyFinal(this.dependencies, input.snapshot, fence(root, []))))
        return { kind: "retry_required" };
    const context = roots[0]
      ? card(roots[0], input.snapshot.locale).context
      : source.state === "empty"
        ? source.context
        : snapshotContext(input.snapshot);
    return {
      kind: "ok",
      dto: parseClientServiceListDto({
        schemaVersion: "m009.list.v2",
        context,
        items: roots.map((root) => card(root, input.snapshot.locale)),
      }),
    };
  }
  async detail(input: {
    request: unknown;
    opaqueRef: string;
    contextOpaqueRef?: string;
  }): Promise<ClientServicesQueryResult<ClientServiceDetailDto>> {
    const auth = await this.dependencies.auth.authorize({
      request: input.request,
      contextOpaqueRef: input.contextOpaqueRef,
    });
    if (auth.kind !== "authorized") return auth;
    const source = await this.dependencies.source.detail({
      snapshot: auth.snapshot,
      opaqueRef: input.opaqueRef,
    });
    if (source.state === "unavailable") return { kind: "unavailable" };
    if (
      source.state === "not_found" ||
      !isClientServiceAuthorized(
        auth.snapshot,
        source.root,
        this.dependencies.now?.() ?? new Date(),
      )
    )
      return { kind: "not_found" };
    const children = await Promise.all(
      CLIENT_SERVICE_SECTION_NAMES.map((name) =>
        this.dependencies.sections[name]
          ? loadBoundedClientServiceSection(
              this.dependencies.sections[name]!,
              auth.snapshot,
              source.root,
              this.dependencies.ownerTimeoutMs ?? 250,
            )
          : Promise.resolve(unavailable("provider_disabled")),
      ),
    );
    if (hasDuplicateChildFence(children)) return { kind: "retry_required" };
    if (!(await verifyFinal(this.dependencies, auth.snapshot, fence(source.root, children))))
      return { kind: "retry_required" };
    const unsafe = ["tasks", "documents", "payments"].some((name) => {
      const section =
        children[
          CLIENT_SERVICE_SECTION_NAMES.indexOf(
            name as (typeof CLIENT_SERVICE_SECTION_NAMES)[number],
          )
        ]?.section;
      return section?.state === "unavailable" || section?.state === "stale";
    });
    const copy = localized(source.root, auth.snapshot.locale);
    const service = card(source.root, auth.snapshot.locale, unsafe);
    return {
      kind: "ok",
      dto: parseClientServiceDetailDto({
        schemaVersion: "m009.detail.v2",
        context: service.context,
        service,
        scopeLabel: copy.scopeLabel,
        milestones: copy.milestones,
        sections: Object.fromEntries(
          CLIENT_SERVICE_SECTION_NAMES.map((name, index) => [name, children[index]!.section]),
        ),
      }),
    };
  }
}

export function selectAuthorizedServiceChoices(input: {
  candidates: readonly AuthorizedServiceChoiceCandidate[];
  limit: number;
  offset: number;
}): {
  state: "fresh" | "empty" | "unavailable";
  choices: readonly AuthorizedServiceChoice[];
  hasMore: boolean;
  nextOffset?: number;
} {
  const limit = Math.min(Math.max(input.limit, 1), CLIENT_SERVICE_LIST_LIMIT);
  if (!Number.isSafeInteger(input.offset) || input.offset < 0)
    return { state: "unavailable", choices: [], hasMore: false };
  const eligible = input.candidates.filter(
    (item) =>
      item.authorized &&
      item.eligible &&
      !item.tombstoned &&
      CLIENT_SERVICE_REF_PATTERN.test(item.choice.serviceRef),
  );
  const groups = new Map<string, AuthorizedServiceChoice[]>();
  for (const item of eligible) {
    const key = `${item.choice.context.type}\0${item.choice.context.label}\0${item.choice.serviceLabel}`;
    groups.set(key, [...(groups.get(key) ?? []), item.choice]);
  }
  for (const values of groups.values())
    if (values.length > 1) {
      const labels = values.map((value) => value.instanceLabel?.trim()).filter(Boolean) as string[];
      if (labels.length !== values.length || new Set(labels).size !== labels.length)
        return { state: "unavailable", choices: [], hasMore: false };
    }
  const ordered = eligible
    .map((item) => item.choice)
    .sort(
      (a, b) =>
        a.serviceLabel.localeCompare(b.serviceLabel, "en") ||
        (a.instanceLabel ?? "").localeCompare(b.instanceLabel ?? "", "en") ||
        a.serviceRef.localeCompare(b.serviceRef, "en"),
    );
  const page = ordered.slice(input.offset, input.offset + limit),
    hasMore = input.offset + limit < ordered.length;
  return {
    state: page.length ? "fresh" : "empty",
    choices: Object.freeze(page),
    hasMore,
    ...(hasMore ? { nextOffset: input.offset + limit } : {}),
  };
}
