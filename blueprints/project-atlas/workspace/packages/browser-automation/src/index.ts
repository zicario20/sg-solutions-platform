/**
 * M070: browser automation is a mechanically isolated provider adapter.
 * A browser observation or click never changes canonical business state.
 */
export const BROWSER_AUTOMATION_MODULE = "M070" as const;

export const BROWSER_AUTOMATION_PERMISSIONS = {
  PROFILE_CREATE: "browser.profile.create",
  NETWORK_POLICY_MANAGE: "browser.network_policy.manage",
  SESSION_CREATE: "browser.session.create",
  NAVIGATION_REQUEST: "browser.navigation.request",
  ACTION_CONTRACT_CREATE: "browser.action.contract.create",
  ACTION_PLAN: "browser.action.plan",
  EVIDENCE_CREATE: "browser.evidence.create",
} as const;

export type BrowserAutomationPermission =
  (typeof BROWSER_AUTOMATION_PERMISSIONS)[keyof typeof BROWSER_AUTOMATION_PERMISSIONS];

export interface BrowserAutomationActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly BrowserAutomationPermission[];
}

export interface BrowserAutomationRuntimePolicy {
  workerRuntime: false;
  browserLaunch: false;
  navigation: false;
  credentialInjection: false;
  fileTransfer: false;
  screenshotCapture: false;
  actionExecution: false;
  humanTakeover: false;
}

export const BROWSER_AUTOMATION_RUNTIME_POLICY: BrowserAutomationRuntimePolicy = Object.freeze({
  workerRuntime: false,
  browserLaunch: false,
  navigation: false,
  credentialInjection: false,
  fileTransfer: false,
  screenshotCapture: false,
  actionExecution: false,
  humanTakeover: false,
});

export interface BrowserWorkerProfile {
  code: string;
  displayName: string;
  status: "disabled";
  isolatedRuntimeConfigured: false;
  browserInstalled: false;
  createdBy: string;
}

export interface BrowserProfile {
  code: string;
  workerCode: string;
  status: "draft";
  authenticatedIdentityBound: false;
  cookiesPersisted: false;
  createdBy: string;
}

export interface BrowserNetworkPolicy {
  code: string;
  allowedOrigins: readonly string[];
  status: "draft";
  egressActive: false;
  createdBy: string;
}

export interface BrowserSession {
  sessionCode: string;
  profileCode: string;
  workerCode: string;
  status: "blocked_runtime_disabled";
  browserLaunched: false;
  cookiesLoaded: false;
  credentialsInjected: false;
  createdBy: string;
}

export interface BrowserNavigationRequest {
  requestCode: string;
  profileCode: string;
  networkPolicyCode: string;
  destinationOrigin: string;
  destinationPathRecorded: false;
  status: "blocked_runtime_disabled";
  navigationAttempted: false;
  pageTrusted: false;
  createdBy: string;
}

export interface BrowserActionContract {
  code: string;
  workflowInstanceReference: string;
  actionType: "read_only" | "side_effecting";
  purpose: string;
  authorizedByWorkflow: false;
  executionAllowed: false;
  createdBy: string;
}

export interface BrowserActionPlan {
  planCode: string;
  actionContractCode: string;
  status: "blocked_runtime_disabled";
  externalActionAttempted: false;
  requiresReconciliationBeforeRetry: true;
  result: "not_started";
  createdBy: string;
}

export interface BrowserEvidenceRecord {
  evidenceCode: string;
  actionContractCode: string;
  artifactReference: string;
  trustLevel: "untrusted";
  canonicalFact: false;
  screenshotStored: false;
  createdBy: string;
}

export interface BrowserAutomationRuntimeStatus {
  module: typeof BROWSER_AUTOMATION_MODULE;
  state: "provider_disabled";
  policy: BrowserAutomationRuntimePolicy;
  canonicalWorkflowAuthority: "M068";
  jurisdictionAuthority: "M071";
}

export function getBrowserAutomationRuntimeStatus(): BrowserAutomationRuntimeStatus {
  return {
    module: BROWSER_AUTOMATION_MODULE,
    state: "provider_disabled",
    policy: BROWSER_AUTOMATION_RUNTIME_POLICY,
    canonicalWorkflowAuthority: "M068",
    jurisdictionAuthority: "M071",
  };
}

export function createBrowserWorkerProfile(
  actor: BrowserAutomationActorContext,
  input: { code: string; displayName: string },
): BrowserWorkerProfile {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.PROFILE_CREATE);
  assertStableCode(input.code, "browser worker");

  return {
    code: input.code,
    displayName: requireText(input.displayName, "displayName"),
    status: "disabled",
    isolatedRuntimeConfigured: false,
    browserInstalled: false,
    createdBy: actor.actorId,
  };
}

export function createBrowserProfile(
  actor: BrowserAutomationActorContext,
  input: { code: string; workerCode: string },
): BrowserProfile {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.PROFILE_CREATE);
  assertStableCode(input.code, "browser profile");
  assertStableCode(input.workerCode, "browser worker");

  return {
    code: input.code,
    workerCode: input.workerCode,
    status: "draft",
    authenticatedIdentityBound: false,
    cookiesPersisted: false,
    createdBy: actor.actorId,
  };
}

export function createBrowserNetworkPolicy(
  actor: BrowserAutomationActorContext,
  input: { code: string; allowedOrigins: readonly string[] },
): BrowserNetworkPolicy {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.NETWORK_POLICY_MANAGE);
  assertStableCode(input.code, "browser network policy");

  if (input.allowedOrigins.length === 0) {
    throw new Error("At least one approved HTTPS origin is required");
  }

  return {
    code: input.code,
    allowedOrigins: input.allowedOrigins.map(normalizeHttpsOrigin),
    status: "draft",
    egressActive: false,
    createdBy: actor.actorId,
  };
}

export function createBrowserSession(
  actor: BrowserAutomationActorContext,
  input: { sessionCode: string; profileCode: string; workerCode: string },
): BrowserSession {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.SESSION_CREATE);
  assertStableCode(input.sessionCode, "browser session");
  assertStableCode(input.profileCode, "browser profile");
  assertStableCode(input.workerCode, "browser worker");

  return {
    sessionCode: input.sessionCode,
    profileCode: input.profileCode,
    workerCode: input.workerCode,
    status: "blocked_runtime_disabled",
    browserLaunched: false,
    cookiesLoaded: false,
    credentialsInjected: false,
    createdBy: actor.actorId,
  };
}

export function createBrowserNavigationRequest(
  actor: BrowserAutomationActorContext,
  input: {
    requestCode: string;
    profileCode: string;
    networkPolicy: BrowserNetworkPolicy;
    destination: string;
  },
): BrowserNavigationRequest {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.NAVIGATION_REQUEST);
  assertStableCode(input.requestCode, "browser navigation request");
  assertStableCode(input.profileCode, "browser profile");
  const destination = new URL(input.destination);

  if (!input.networkPolicy.allowedOrigins.includes(destination.origin)) {
    throw new Error("Destination origin is not approved by the browser network policy");
  }

  return {
    requestCode: input.requestCode,
    profileCode: input.profileCode,
    networkPolicyCode: input.networkPolicy.code,
    destinationOrigin: destination.origin,
    destinationPathRecorded: false,
    status: "blocked_runtime_disabled",
    navigationAttempted: false,
    pageTrusted: false,
    createdBy: actor.actorId,
  };
}

export function createBrowserActionContract(
  actor: BrowserAutomationActorContext,
  input: {
    code: string;
    workflowInstanceReference: string;
    actionType: "read_only" | "side_effecting";
    purpose: string;
  },
): BrowserActionContract {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.ACTION_CONTRACT_CREATE);
  assertStableCode(input.code, "browser action contract");

  return {
    code: input.code,
    workflowInstanceReference: requireText(input.workflowInstanceReference, "workflowInstanceReference"),
    actionType: input.actionType,
    purpose: requireText(input.purpose, "purpose"),
    authorizedByWorkflow: false,
    executionAllowed: false,
    createdBy: actor.actorId,
  };
}

export function planBrowserAction(
  actor: BrowserAutomationActorContext,
  input: { planCode: string; actionContractCode: string },
): BrowserActionPlan {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.ACTION_PLAN);
  assertStableCode(input.planCode, "browser action plan");
  assertStableCode(input.actionContractCode, "browser action contract");

  return {
    planCode: input.planCode,
    actionContractCode: input.actionContractCode,
    status: "blocked_runtime_disabled",
    externalActionAttempted: false,
    requiresReconciliationBeforeRetry: true,
    result: "not_started",
    createdBy: actor.actorId,
  };
}

export function recordBrowserEvidence(
  actor: BrowserAutomationActorContext,
  input: { evidenceCode: string; actionContractCode: string; artifactReference: string },
): BrowserEvidenceRecord {
  assertPermission(actor, BROWSER_AUTOMATION_PERMISSIONS.EVIDENCE_CREATE);
  assertStableCode(input.evidenceCode, "browser evidence");
  assertStableCode(input.actionContractCode, "browser action contract");

  return {
    evidenceCode: input.evidenceCode,
    actionContractCode: input.actionContractCode,
    artifactReference: requireText(input.artifactReference, "artifactReference"),
    trustLevel: "untrusted",
    canonicalFact: false,
    screenshotStored: false,
    createdBy: actor.actorId,
  };
}

function assertPermission(actor: BrowserAutomationActorContext, permission: BrowserAutomationPermission): void {
  if (!actor.permissions.includes(permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}

function assertStableCode(value: string, label: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) {
    throw new Error(`${label} must use a stable uppercase code`);
  }
}

function normalizeHttpsOrigin(value: string): string {
  const origin = new URL(value);
  if (origin.protocol !== "https:") {
    throw new Error("Browser origins must use HTTPS");
  }

  return origin.origin;
}

function requireText(value: string, label: string): string {
  if (!value.trim()) {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}
