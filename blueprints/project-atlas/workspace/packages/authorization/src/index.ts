export const AUTHORIZATION_MODULE = "M081" as const;

export const AUTHORIZATION_PERMISSIONS = [
  "authorization.subject.create",
  "authorization.resource.register",
  "authorization.action.create",
  "authorization.permission.create",
  "authorization.role.create",
  "authorization.assignment.request",
  "authorization.deny.create",
  "authorization.decision.evaluate",
  "authorization.access_review.request",
] as const;

export type AuthorizationPermission = (typeof AUTHORIZATION_PERMISSIONS)[number];

export const AUTHORIZATION_RUNTIME = {
  policyActivation: false,
  grantActivation: false,
  decisionEvaluation: false,
  enforcement: false,
  delegation: false,
  justInTimeAccess: false,
  breakGlass: false,
  decisionCache: false,
  revocationPropagation: false,
} as const;

export type AuthorizationSubjectType = "human" | "client" | "service" | "ai" | "worker" | "external_provider" | "unknown";
export type AuthorizationDecisionStatus = "deny" | "review_required" | "unknown";

export interface AuthorizationSubject {
  readonly subjectReference: string;
  readonly type: AuthorizationSubjectType;
  readonly identityAuthenticated: false;
}

export interface AuthorizationResource {
  readonly resourceReference: string;
  readonly resourceType: string;
  readonly tenantReference: string | null;
  readonly sensitiveClassificationReference: string | null;
}

export interface AuthorizationAction {
  readonly code: string;
  readonly class: "read" | "write" | "export" | "share" | "approve" | "execute" | "admin";
  readonly status: "draft";
  readonly active: false;
}

export interface AuthorizationPermissionDefinition {
  readonly code: string;
  readonly actionCode: string;
  readonly resourceType: string;
  readonly status: "draft";
  readonly active: false;
}

export interface AuthorizationRole {
  readonly module: typeof AUTHORIZATION_MODULE;
  readonly code: string;
  readonly name: string;
  readonly status: "draft";
  readonly active: false;
}

export interface AuthorizationRoleVersion {
  readonly roleCode: string;
  readonly version: number;
  readonly status: "draft";
  readonly immutable: true;
  readonly active: false;
}

export interface RoleAssignmentRequest {
  readonly requestId: string;
  readonly subjectReference: string;
  readonly roleCode: string;
  readonly status: "draft";
  readonly effective: false;
  readonly selfElevationPrevented: true;
}

export interface DirectAccessGrantRequest {
  readonly requestId: string;
  readonly subjectReference: string;
  readonly permissionCode: string;
  readonly status: "draft";
  readonly effective: false;
}

export interface ExplicitDenyDefinition {
  readonly denyId: string;
  readonly subjectReference: string;
  readonly status: "draft";
  readonly active: false;
}

export interface AuthorizationDecisionRequest {
  readonly requestId: string;
  readonly subject: AuthorizationSubject;
  readonly resource: AuthorizationResource;
  readonly action: AuthorizationAction;
  readonly purposeReference: string | null;
  readonly contextMinimized: true;
  readonly containsBroadPii: false;
  readonly containsPrivateReasoning: false;
}

export interface AuthorizationDecision {
  readonly requestId: string;
  readonly status: "deny";
  readonly allowed: false;
  readonly policyEvaluated: false;
  readonly enforcementApplied: false;
  readonly reason: "runtime_evaluation_disabled";
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: AuthorizationPermission): void {
  if (!AUTHORIZATION_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported authorization permission: ${permission}.`);
  }
}

export function createAuthorizationSubject(input: {
  readonly permission: AuthorizationPermission;
  readonly subjectReference: string;
  readonly type: AuthorizationSubjectType;
}): AuthorizationSubject {
  requirePermission(input.permission);
  requireIdentifier(input.subjectReference, "Authorization subject reference");

  return { subjectReference: input.subjectReference, type: input.type, identityAuthenticated: false };
}

export function registerAuthorizationResource(input: {
  readonly permission: AuthorizationPermission;
  readonly resourceReference: string;
  readonly resourceType: string;
  readonly tenantReference?: string;
  readonly sensitiveClassificationReference?: string;
}): AuthorizationResource {
  requirePermission(input.permission);
  requireIdentifier(input.resourceReference, "Authorization resource reference");
  requireIdentifier(input.resourceType, "Authorization resource type");

  return {
    resourceReference: input.resourceReference,
    resourceType: input.resourceType,
    tenantReference: input.tenantReference ?? null,
    sensitiveClassificationReference: input.sensitiveClassificationReference ?? null,
  };
}

export function createAuthorizationAction(input: {
  readonly permission: AuthorizationPermission;
  readonly code: string;
  readonly class: AuthorizationAction["class"];
}): AuthorizationAction {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Authorization action code");

  return { code: input.code, class: input.class, status: "draft", active: false };
}

export function createPermissionDefinition(input: {
  readonly permission: AuthorizationPermission;
  readonly code: string;
  readonly action: AuthorizationAction;
  readonly resourceType: string;
}): AuthorizationPermissionDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Permission definition code");
  requireIdentifier(input.resourceType, "Permission resource type");

  return {
    code: input.code,
    actionCode: input.action.code,
    resourceType: input.resourceType,
    status: "draft",
    active: false,
  };
}

export function createAuthorizationRole(input: {
  readonly permission: AuthorizationPermission;
  readonly code: string;
  readonly name: string;
}): AuthorizationRole {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Authorization role code");
  requireIdentifier(input.name, "Authorization role name");

  return {
    module: AUTHORIZATION_MODULE,
    code: input.code,
    name: input.name,
    status: "draft",
    active: false,
  };
}

export function createAuthorizationRoleVersion(input: {
  readonly permission: AuthorizationPermission;
  readonly role: AuthorizationRole;
  readonly version: number;
}): AuthorizationRoleVersion {
  requirePermission(input.permission);
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error("Authorization role version must be a positive integer.");
  }

  return { roleCode: input.role.code, version: input.version, status: "draft", immutable: true, active: false };
}

export function requestRoleAssignment(input: {
  readonly permission: AuthorizationPermission;
  readonly requestId: string;
  readonly subject: AuthorizationSubject;
  readonly role: AuthorizationRole;
  readonly requestedByType: AuthorizationSubjectType;
}): RoleAssignmentRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Role assignment request ID");
  if (input.requestedByType === "ai" && input.subject.type === "ai") {
    throw new Error("AI principals cannot assign roles to themselves.");
  }

  return {
    requestId: input.requestId,
    subjectReference: input.subject.subjectReference,
    roleCode: input.role.code,
    status: "draft",
    effective: false,
    selfElevationPrevented: true,
  };
}

export function requestDirectAccessGrant(input: {
  readonly permission: AuthorizationPermission;
  readonly requestId: string;
  readonly subject: AuthorizationSubject;
  readonly permissionDefinition: AuthorizationPermissionDefinition;
}): DirectAccessGrantRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Direct access grant request ID");

  return {
    requestId: input.requestId,
    subjectReference: input.subject.subjectReference,
    permissionCode: input.permissionDefinition.code,
    status: "draft",
    effective: false,
  };
}

export function createExplicitDenyDefinition(input: {
  readonly permission: AuthorizationPermission;
  readonly denyId: string;
  readonly subject: AuthorizationSubject;
}): ExplicitDenyDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.denyId, "Explicit deny ID");

  return { denyId: input.denyId, subjectReference: input.subject.subjectReference, status: "draft", active: false };
}

export function createAuthorizationDecisionRequest(input: {
  readonly permission: AuthorizationPermission;
  readonly requestId: string;
  readonly subject: AuthorizationSubject;
  readonly resource: AuthorizationResource;
  readonly action: AuthorizationAction;
  readonly purposeReference?: string;
  readonly includesBroadPii?: boolean;
  readonly includesPrivateReasoning?: boolean;
}): AuthorizationDecisionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Authorization decision request ID");
  if (input.includesBroadPii || input.includesPrivateReasoning) {
    throw new Error("Authorization context must be minimized and cannot contain broad PII or private reasoning.");
  }

  return {
    requestId: input.requestId,
    subject: input.subject,
    resource: input.resource,
    action: input.action,
    purposeReference: input.purposeReference ?? null,
    contextMinimized: true,
    containsBroadPii: false,
    containsPrivateReasoning: false,
  };
}

export function evaluateAuthorizationDecision(input: {
  readonly permission: AuthorizationPermission;
  readonly request: AuthorizationDecisionRequest;
}): AuthorizationDecision {
  requirePermission(input.permission);

  return {
    requestId: input.request.requestId,
    status: "deny",
    allowed: false,
    policyEvaluated: false,
    enforcementApplied: false,
    reason: "runtime_evaluation_disabled",
  };
}
