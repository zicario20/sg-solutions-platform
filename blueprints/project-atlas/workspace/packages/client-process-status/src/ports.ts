import type {
  AuthorizedServiceChoice,
  AuthorizedServiceChoicePort,
  AuthorizedServiceRootPort,
  ClientServiceAxesDto,
  ClientServiceResourceFence,
} from "@atlas/client-services";
import type { DashboardAuthorizationSnapshot, DashboardPriorityInput } from "@atlas/dashboard";
import type { ProcessBlockerDto, ProcessMilestoneDto, ProcessSectionItemDto } from "./contracts.ts";
import type {
  ProcessEventMapping,
  ProcessOwnerEvent,
  ProcessTimelineKeyset,
} from "./timeline-policy.ts";
export type ProcessAuthorizationResult =
  | { kind: "authorized"; snapshot: DashboardAuthorizationSnapshot }
  | { kind: "denied" }
  | { kind: "unavailable" };
export interface ProcessAuthPort {
  authorize(input: { request: unknown; contextRef?: string }): Promise<ProcessAuthorizationResult>;
  revalidate(snapshot: DashboardAuthorizationSnapshot): Promise<boolean>;
}
export type ProcessSourceCode =
  | "workflow"
  | "tasks"
  | "documents"
  | "payments"
  | "appointments"
  | "messages"
  | "dependencies"
  | "help"
  | "deliverables"
  | "timeline";
export type ProcessFactKind =
  | "items"
  | "milestones"
  | "blockers"
  | "priority"
  | "events"
  | "absence";
export interface ProcessSourceDefinition {
  code: ProcessSourceCode;
  ownerVersion: string;
  critical: boolean;
  freshnessMs: number;
  highestPriorityBand: number;
}
export interface ProcessSourceRegistry {
  version: string;
  mappingPolicyVersion: string;
  acceptedDefinitionVersions: readonly string[];
  acceptedWorkflowVersions: readonly string[];
  entries: readonly ProcessSourceDefinition[];
  eventMappings: readonly ProcessEventMapping[];
}
export interface ProcessFactFence extends ClientServiceResourceFence {
  sourceCode: ProcessSourceCode;
  factKind: ProcessFactKind;
  factRef: string;
  readCut: string;
  registryVersion: string;
}
export interface ProcessTimelineContinuation {
  timelineSourceVersion: string;
  highWatermark: string;
  after: ProcessTimelineKeyset;
}
export interface ProcessOwnerResult {
  state: "fresh" | "empty" | "stale" | "unavailable";
  sourceCode: ProcessSourceCode;
  ownerVersion: string;
  registryVersion: string;
  readCut: string;
  asOf?: string;
  highWatermark?: string;
  sourceVersion: string;
  bindingMode: "resource_fences" | "absence_fence" | "none";
  resourceFences: readonly ProcessFactFence[];
  items?: readonly ProcessSectionItemDto[];
  milestones?: readonly ProcessMilestoneDto[];
  blockers?: readonly ProcessBlockerDto[];
  events?: readonly ProcessOwnerEvent[];
  priority?: Partial<DashboardPriorityInput>;
}
export interface ProcessOwnerPort {
  load(input: {
    snapshot: DashboardAuthorizationSnapshot;
    root: AuthorizedProcessRoot;
    readCut: string;
    timelineContinuation?: ProcessTimelineContinuation;
    signal: AbortSignal;
  }): Promise<ProcessOwnerResult>;
}
export type ProcessOwnerPorts = Partial<Record<ProcessSourceCode, ProcessOwnerPort>>;
export interface ProcessEligibilityPolicySnapshot {
  version: string;
  sourceVersion: string;
  registryVersion: string;
  entitlementVersion: string;
  permission: "client.service.read";
  entitlementState: "active" | "revoked";
  authorizationEpoch: string;
  policyEpoch: string;
  issuedAt: string;
  expiresAt: string;
  acceptedDefinitionVersions: readonly string[];
  acceptedWorkflowVersions: readonly string[];
}
export type ProcessEligibilityResult =
  | { kind: "eligible"; policy: ProcessEligibilityPolicySnapshot }
  | { kind: "ineligible" }
  | { kind: "unavailable" };
export interface ProcessEligibilityPolicyPort {
  evaluate(input: {
    snapshot: DashboardAuthorizationSnapshot;
    serviceRef: string;
    definitionVersion: string;
    workflowVersion: string;
    expectedPolicyVersion: string;
    expectedRegistryVersion: string;
    expectedEntitlementVersion: string;
  }): Promise<ProcessEligibilityResult>;
  verifyLanding(input: {
    snapshot: DashboardAuthorizationSnapshot;
    choices: readonly AuthorizedServiceChoice[];
    fences: readonly ClientServiceResourceFence[];
  }): Promise<boolean>;
  revalidate(input: {
    snapshot: DashboardAuthorizationSnapshot;
    policy: ProcessEligibilityPolicySnapshot;
  }): Promise<boolean>;
}
export interface ProcessTimelineCursorBinding {
  accountId: string;
  contextRef: string;
  serviceRef: string;
  rootEpoch: number;
  authorizationEpoch: string;
  policyEpoch: string;
  eligibilityPolicyVersion: string;
  entitlementVersion: string;
  registryVersion: string;
  mappingPolicyVersion: string;
  readCut: string;
}
export interface ProcessTimelineCursorPort {
  open(input: {
    cursor: string;
    binding: ProcessTimelineCursorBinding;
    now: string;
  }): Promise<
    | { kind: "valid"; continuation: ProcessTimelineContinuation }
    | { kind: "invalid" | "unavailable" }
  >;
  seal(input: {
    binding: ProcessTimelineCursorBinding;
    continuation: ProcessTimelineContinuation;
    expiresAt: string;
  }): Promise<{ kind: "sealed"; cursor: string } | { kind: "unavailable" }>;
}
export interface AuthorizedProcessRoot {
  serviceOrderId: string;
  ownerAccountId: string;
  ownerContextRef: string;
  serviceRef: string;
  serviceLabel: string;
  instanceLabel?: string;
  context: { type: "personal" | "organization"; label: string };
  definitionVersion: string;
  workflowVersion: string;
  eligibilityPolicyVersion: string;
  sourceRegistryVersion: string;
  readCut: string;
  axes: ClientServiceAxesDto;
  updatedAt: string;
  entitlement: {
    state: "active" | "revoked";
    version: string;
    authorizationEpoch: string;
    policyEpoch: string;
    expiresAt?: string;
  };
  grant: {
    permission: "client.service.read";
    state: "active" | "revoked";
    authorizationEpoch: string;
    policyEpoch: string;
    minimumAssurance: "aal1" | "aal2";
    expiresAt?: string;
  };
  rootFence: ClientServiceResourceFence;
}
export interface ProcessQueryDependencies {
  auth: ProcessAuthPort;
  choices: AuthorizedServiceChoicePort;
  roots: AuthorizedServiceRootPort<AuthorizedProcessRoot>;
  registry?: ProcessSourceRegistry;
  owners?: ProcessOwnerPorts;
  eligibility?: ProcessEligibilityPolicyPort;
  timelineCursors?: ProcessTimelineCursorPort;
  ownerTimeoutMs?: number;
  now?: () => Date;
}
export type ProcessQueryResult<T> =
  | { kind: "ok"; dto: T }
  | { kind: "denied" }
  | { kind: "not_found" }
  | { kind: "retry_required" }
  | { kind: "unavailable" };
export type { AuthorizedServiceChoicePort, AuthorizedServiceRootPort };
