import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";
import type {
  ClientServiceAxesDto,
  ClientServiceLocale,
  ClientServicePublicContextDto,
  ClientServicePublicMilestoneDto,
  ClientServiceSectionDto,
  ClientServiceSectionName,
} from "./contracts.ts";
export interface ClientServicesAuthorizationRequest {
  request: unknown;
  contextOpaqueRef?: string;
}
export type ClientServicesAuthorizationResult =
  | { kind: "authorized"; snapshot: DashboardAuthorizationSnapshot }
  | { kind: "denied" }
  | { kind: "unavailable" };
export interface ClientServicesAuthPort {
  authorize(input: ClientServicesAuthorizationRequest): Promise<ClientServicesAuthorizationResult>;
  revalidate(snapshot: DashboardAuthorizationSnapshot): Promise<boolean>;
}
export interface ClientServiceLocalizedDisplay {
  contextLabel: string;
  serviceName: string;
  categoryLabel: string;
  scopeLabel: string;
  publicStateLabels: Record<string, string>;
  axisLabels: {
    commercial: Record<string, string>;
    financial: Record<string, string>;
    activation: Record<string, string>;
    fulfillment: Record<string, string>;
  };
  nextStepLabel?: string;
  milestones: readonly ClientServicePublicMilestoneDto[];
}
export interface ClientServiceRootProjection {
  serviceOrderId: string;
  ownerAccountId: string;
  ownerContextOpaqueRef: string;
  resourceEpoch: number;
  acceptedDefinitionVersionId: string;
  acceptedDefinitionEpoch: number;
  opaqueRef: string;
  publicReference: string;
  contextType: "personal" | "organization";
  axes: ClientServiceAxesDto;
  ownerFacts: {
    financial: { sourceVersion: string; resourceEpoch: number };
    activation: { sourceVersion: string; resourceEpoch: number };
    fulfillment: { sourceVersion: string; resourceEpoch: number };
  };
  displays: Record<ClientServiceLocale, ClientServiceLocalizedDisplay>;
  currentMilestoneIndex?: number;
  completedMilestones: number;
  criticalSources: {
    tasks: "fresh" | "empty" | "unavailable";
    documents: "fresh" | "empty" | "unavailable";
    payments: "fresh" | "empty" | "unavailable";
  };
  updatedAt: Date;
  grant: {
    permission: "client.service.read";
    state: "active" | "revoked";
    accountId: string;
    contextOpaqueRef: string;
    authorizationEpoch: number;
    policyEpoch: number;
    resourceEpoch: number;
    expiresAt?: string;
  };
}
export type ClientServiceSourceListResult =
  | { state: "fresh"; generatedAt: Date; items: readonly ClientServiceRootProjection[] }
  | { state: "empty"; generatedAt: Date; context: ClientServicePublicContextDto }
  | { state: "unavailable" };
export type ClientServiceSourceDetailResult =
  | { state: "fresh"; generatedAt: Date; root: ClientServiceRootProjection }
  | { state: "not_found" }
  | { state: "unavailable" };
export interface ClientServiceResourceFence {
  internalResourceId: string;
  resourceEpoch: number;
  sourceVersion: string;
}
export interface ClientServiceFinalFence {
  serviceOrderId: string;
  rootEpoch: number;
  definitionVersionId: string;
  definitionEpoch: number;
  grantAuthorizationEpoch: number;
  grantPolicyEpoch: number;
  grantResourceEpoch: number;
  ownerFacts: ClientServiceRootProjection["ownerFacts"];
  childResources: readonly ClientServiceResourceFence[];
}
export interface ClientServicesSourcePort {
  list(input: {
    snapshot: DashboardAuthorizationSnapshot;
    query?: string;
    status?: string;
    limit: number;
  }): Promise<ClientServiceSourceListResult>;
  detail(input: {
    snapshot: DashboardAuthorizationSnapshot;
    opaqueRef: string;
  }): Promise<ClientServiceSourceDetailResult>;
  verifyFinalFence(input: {
    snapshot: DashboardAuthorizationSnapshot;
    fence: ClientServiceFinalFence;
  }): Promise<boolean>;
}
export interface ClientServiceSectionLoadResult {
  section: ClientServiceSectionDto;
  sourceVersion: string;
  bindingMode: "resource_fences" | "absence_fence" | "none";
  resourceFences: readonly ClientServiceResourceFence[];
}
export interface ClientServiceSectionPort {
  load(input: {
    snapshot: DashboardAuthorizationSnapshot;
    root: ClientServiceRootProjection;
    signal: AbortSignal;
  }): Promise<ClientServiceSectionLoadResult>;
}
export type ClientServiceSectionPorts = Partial<
  Record<ClientServiceSectionName, ClientServiceSectionPort>
>;
export interface AuthorizedServiceChoice {
  serviceRef: string;
  serviceLabel: string;
  instanceLabel?: string;
  context: ClientServicePublicContextDto;
  definitionVersion: string;
  workflowVersion: string;
  rootEpoch: number;
  rootFence?: ClientServiceResourceFence;
}
export interface AuthorizedServiceChoiceCandidate {
  choice: AuthorizedServiceChoice;
  authorized: boolean;
  eligible: boolean;
  tombstoned: boolean;
}
export type AuthorizedServiceChoiceResult =
  | {
      state: "fresh" | "empty";
      context: ClientServicePublicContextDto;
      choices: readonly AuthorizedServiceChoice[];
      hasMore: boolean;
      cursor?: string;
      absenceFence?: ClientServiceResourceFence;
    }
  | { state: "restart" }
  | { state: "unavailable" };
export interface AuthorizedServiceChoicePort {
  list(input: {
    snapshot: DashboardAuthorizationSnapshot;
    limit: number;
    cursor?: string;
  }): Promise<AuthorizedServiceChoiceResult>;
  verify(input: {
    snapshot: DashboardAuthorizationSnapshot;
    fences: readonly ClientServiceResourceFence[];
  }): Promise<boolean>;
}
export type AuthorizedServiceRootResult<T> =
  | { state: "fresh"; root: T }
  | { state: "hidden" }
  | { state: "unavailable" };
export interface AuthorizedServiceRootPort<T> {
  resolve(input: {
    snapshot: DashboardAuthorizationSnapshot;
    serviceRef: string;
  }): Promise<AuthorizedServiceRootResult<T>>;
  verify(input: {
    snapshot: DashboardAuthorizationSnapshot;
    rootFence: ClientServiceResourceFence;
    childFences: readonly ClientServiceResourceFence[];
    eligibilityPolicyVersion: string;
    entitlementVersion?: string;
    registryVersion?: string;
    mappingPolicyVersion?: string;
    definitionVersion?: string;
    workflowVersion?: string;
    permission?: "client.service.read";
    readCut: string;
  }): Promise<boolean>;
}
