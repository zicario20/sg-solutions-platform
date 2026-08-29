export const HOMELAB_MODULE = "M093" as const;

export const HOMELAB_PERMISSIONS = [
  "homelab.topology.create",
  "homelab.site.create",
  "homelab.hardware.create",
  "homelab.node.create",
  "homelab.network_zone.create",
  "homelab.remote_access.create",
  "homelab.provisioning.request",
  "homelab.readiness.evaluate",
] as const;

export type HomelabPermission = (typeof HOMELAB_PERMISSIONS)[number];

export const HOMELAB_RUNTIME = {
  nodeEnrollment: false,
  networkProvisioning: false,
  storageProvisioning: false,
  remoteAccess: false,
  managementPlane: false,
  containerRuntime: false,
  powerControl: false,
  thermalControl: false,
  hardwareDiscovery: false,
  telemetry: false,
} as const;

export type HomelabEnvironment = "local" | "development" | "test" | "staging" | "production";
export type HomelabNodeClass = "management" | "lightweight_ai" | "gpu_ai" | "storage" | "network" | "voice_gateway" | "worker" | "utility" | "development" | "other";
export type NetworkTrustClass = "management" | "workload" | "storage" | "untrusted" | "guest";

export interface HomelabTopology {
  readonly module: typeof HOMELAB_MODULE;
  readonly topologyCode: string;
  readonly siteReference: string;
  readonly environment: HomelabEnvironment;
  readonly status: "draft";
  readonly active: false;
  readonly controlPlaneConnected: false;
}

export interface HomelabSite {
  readonly siteCode: string;
  readonly environment: HomelabEnvironment;
  readonly status: "draft";
  readonly active: false;
  readonly physicalSecurityReviewed: false;
}

export interface HardwareProfile {
  readonly hardwareProfileCode: string;
  readonly capacityReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly rawSerialStored: false;
}

export interface HomelabNode {
  readonly nodeCode: string;
  readonly siteCode: string;
  readonly nodeClass: HomelabNodeClass;
  readonly hardwareProfileCode: string;
  readonly status: "draft";
  readonly enrolled: false;
  readonly reachable: false;
  readonly workloadAuthorized: false;
}

export interface HomelabNetworkZone {
  readonly zoneCode: string;
  readonly purpose: string;
  readonly trustClass: NetworkTrustClass;
  readonly status: "draft";
  readonly active: false;
  readonly defaultDenyRequired: true;
  readonly segmentationApplied: false;
}

export interface HomelabRemoteAccessProfile {
  readonly profileCode: string;
  readonly siteCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly identityMfaRequired: true;
  readonly remoteAccessGranted: false;
  readonly applicationAuthorizationGranted: false;
  readonly publicManagementExposed: false;
}

export interface HomelabNodeProvisioningRequest {
  readonly requestCode: string;
  readonly nodeCode: string;
  readonly status: "draft";
  readonly provisioningExecuted: false;
  readonly networkConfigured: false;
  readonly storageConfigured: false;
}

export interface HomelabNodeReadinessResult {
  readonly nodeCode: string;
  readonly status: "review_required";
  readonly ready: false;
  readonly hardwareVerified: false;
  readonly networkVerified: false;
  readonly storageVerified: false;
  readonly workloadEnabled: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: HomelabPermission): void {
  if (!HOMELAB_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported homelab permission: ${permission}.`);
  }
}

export function createHomelabSite(input: {
  readonly permission: HomelabPermission;
  readonly siteCode: string;
  readonly environment: HomelabEnvironment;
}): HomelabSite {
  requirePermission(input.permission);
  requireIdentifier(input.siteCode, "Homelab site code");

  return { siteCode: input.siteCode, environment: input.environment, status: "draft", active: false, physicalSecurityReviewed: false };
}

export function createHomelabTopology(input: {
  readonly permission: HomelabPermission;
  readonly topologyCode: string;
  readonly site: HomelabSite;
}): HomelabTopology {
  requirePermission(input.permission);
  requireIdentifier(input.topologyCode, "Homelab topology code");

  return {
    module: HOMELAB_MODULE,
    topologyCode: input.topologyCode,
    siteReference: input.site.siteCode,
    environment: input.site.environment,
    status: "draft",
    active: false,
    controlPlaneConnected: false,
  };
}

export function createHardwareProfile(input: {
  readonly permission: HomelabPermission;
  readonly hardwareProfileCode: string;
  readonly capacityReference: string;
  readonly includesRawSerial?: boolean;
}): HardwareProfile {
  requirePermission(input.permission);
  requireIdentifier(input.hardwareProfileCode, "Hardware profile code");
  requireIdentifier(input.capacityReference, "Hardware capacity reference");
  if (input.includesRawSerial) {
    throw new Error("Homelab hardware profiles store safe inventory references, not raw serial numbers.");
  }

  return { hardwareProfileCode: input.hardwareProfileCode, capacityReference: input.capacityReference, status: "draft", active: false, rawSerialStored: false };
}

export function createHomelabNode(input: {
  readonly permission: HomelabPermission;
  readonly nodeCode: string;
  readonly site: HomelabSite;
  readonly nodeClass: HomelabNodeClass;
  readonly hardwareProfile: HardwareProfile;
}): HomelabNode {
  requirePermission(input.permission);
  requireIdentifier(input.nodeCode, "Homelab node code");

  return {
    nodeCode: input.nodeCode,
    siteCode: input.site.siteCode,
    nodeClass: input.nodeClass,
    hardwareProfileCode: input.hardwareProfile.hardwareProfileCode,
    status: "draft",
    enrolled: false,
    reachable: false,
    workloadAuthorized: false,
  };
}

export function createHomelabNetworkZone(input: {
  readonly permission: HomelabPermission;
  readonly zoneCode: string;
  readonly purpose: string;
  readonly trustClass: NetworkTrustClass;
  readonly treatsAllNodesAsSameTrust?: boolean;
}): HomelabNetworkZone {
  requirePermission(input.permission);
  requireIdentifier(input.zoneCode, "Homelab network zone code");
  requireIdentifier(input.purpose, "Homelab network zone purpose");
  if (input.treatsAllNodesAsSameTrust) {
    throw new Error("Homelab zones cannot treat every node as one flat trust zone.");
  }

  return {
    zoneCode: input.zoneCode,
    purpose: input.purpose,
    trustClass: input.trustClass,
    status: "draft",
    active: false,
    defaultDenyRequired: true,
    segmentationApplied: false,
  };
}

export function createHomelabRemoteAccessProfile(input: {
  readonly permission: HomelabPermission;
  readonly profileCode: string;
  readonly site: HomelabSite;
  readonly exposesPublicManagement?: boolean;
}): HomelabRemoteAccessProfile {
  requirePermission(input.permission);
  requireIdentifier(input.profileCode, "Homelab remote access profile code");
  if (input.exposesPublicManagement) {
    throw new Error("Homelab remote access cannot expose the management plane publicly.");
  }

  return {
    profileCode: input.profileCode,
    siteCode: input.site.siteCode,
    status: "draft",
    active: false,
    identityMfaRequired: true,
    remoteAccessGranted: false,
    applicationAuthorizationGranted: false,
    publicManagementExposed: false,
  };
}

export function requestHomelabNodeProvisioning(input: {
  readonly permission: HomelabPermission;
  readonly requestCode: string;
  readonly node: HomelabNode;
}): HomelabNodeProvisioningRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Homelab node provisioning request code");

  return {
    requestCode: input.requestCode,
    nodeCode: input.node.nodeCode,
    status: "draft",
    provisioningExecuted: false,
    networkConfigured: false,
    storageConfigured: false,
  };
}

export function evaluateHomelabNodeReadiness(input: {
  readonly permission: HomelabPermission;
  readonly node: HomelabNode;
}): HomelabNodeReadinessResult {
  requirePermission(input.permission);

  return {
    nodeCode: input.node.nodeCode,
    status: "review_required",
    ready: false,
    hardwareVerified: false,
    networkVerified: false,
    storageVerified: false,
    workloadEnabled: false,
  };
}
