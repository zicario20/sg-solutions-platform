export const USER_ADMINISTRATION_MODULE = "M091" as const;

export const USER_ADMINISTRATION_PERMISSIONS = [
  "user_administration.record.create",
  "user_administration.membership.request",
  "user_administration.invitation.create",
  "user_administration.provisioning.request",
  "user_administration.role_assignment.request",
  "user_administration.suspension.request",
  "user_administration.session_revocation.request",
  "user_administration.mfa_reset.request",
  "user_administration.reactivation.request",
  "user_administration.impersonation.request",
] as const;

export type UserAdministrationPermission = (typeof USER_ADMINISTRATION_PERMISSIONS)[number];

export const USER_ADMINISTRATION_RUNTIME = {
  directoryQuery: false,
  invitationDelivery: false,
  provisioning: false,
  roleGrantApplication: false,
  suspensionExecution: false,
  sessionRevocation: false,
  mfaReset: false,
  reactivation: false,
  impersonation: false,
  identityProviderConnection: false,
  telemetry: false,
} as const;

export type AdministrativeUserType = "client" | "staff" | "owner_admin" | "contractor" | "support" | "service_operator";
export type MembershipType = "workspace_member" | "team_member" | "sponsored_contractor";
export type SessionHandling = "retain_until_review" | "revoke_all" | "revoke_scoped";

export interface UserAdministrationConfiguration {
  readonly module: typeof USER_ADMINISTRATION_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly iamOwner: "M080";
  readonly authorizationOwner: "M081";
}

export interface UserAdministrationRecord {
  readonly userReference: string;
  readonly configurationCode: string;
  readonly userType: AdministrativeUserType;
  readonly status: "draft";
  readonly active: false;
  readonly defaultRoleAssigned: false;
}

export interface UserWorkspaceMembership {
  readonly membershipCode: string;
  readonly userReference: string;
  readonly workspaceReference: string;
  readonly type: MembershipType;
  readonly status: "draft";
  readonly active: false;
  readonly roleGrantApplied: false;
}

export interface UserInvitation {
  readonly invitationCode: string;
  readonly targetContactReference: string;
  readonly intendedUserType: AdministrativeUserType;
  readonly workspaceReference: string;
  readonly tokenReference: string;
  readonly status: "draft";
  readonly sent: false;
  readonly accepted: false;
  readonly accessReady: false;
  readonly rawTokenStored: false;
}

export interface UserProvisioningRequest {
  readonly requestCode: string;
  readonly userReference: string;
  readonly workspaceReference: string;
  readonly status: "draft";
  readonly processed: false;
  readonly accessGranted: false;
  readonly iamOperationRequested: false;
  readonly authorizationOperationRequested: false;
}

export interface UserRoleAssignmentRequest {
  readonly requestCode: string;
  readonly userReference: string;
  readonly workspaceReference: string;
  readonly roleTemplateReference: string;
  readonly scopeReference: string;
  readonly status: "draft";
  readonly grantApplied: false;
  readonly authorizationOwner: "M081";
}

export interface UserSuspensionRequest {
  readonly requestCode: string;
  readonly userReference: string;
  readonly sessionHandling: SessionHandling;
  readonly status: "draft";
  readonly suspended: false;
  readonly historyDeleted: false;
}

export interface SessionRevocationRequest {
  readonly requestCode: string;
  readonly userReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly revoked: false;
  readonly iamOperationRequested: false;
}

export interface MfaResetRequest {
  readonly requestCode: string;
  readonly userReference: string;
  readonly status: "review_required";
  readonly resetPerformed: false;
  readonly accessGranted: false;
  readonly rawAuthenticatorMaterialStored: false;
}

export interface ImpersonationRequest {
  readonly requestCode: string;
  readonly targetUserReference: string;
  readonly status: "review_required";
  readonly sessionStarted: false;
  readonly unrestricted: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: UserAdministrationPermission): void {
  if (!USER_ADMINISTRATION_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported user-administration permission: ${permission}.`);
  }
}

export function createUserAdministrationConfiguration(input: {
  readonly permission: UserAdministrationPermission;
  readonly code: string;
}): UserAdministrationConfiguration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "User administration configuration code");

  return {
    module: USER_ADMINISTRATION_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    iamOwner: "M080",
    authorizationOwner: "M081",
  };
}

export function createUserAdministrationRecord(input: {
  readonly permission: UserAdministrationPermission;
  readonly userReference: string;
  readonly configuration: UserAdministrationConfiguration;
  readonly userType: AdministrativeUserType;
}): UserAdministrationRecord {
  requirePermission(input.permission);
  requireIdentifier(input.userReference, "User reference");

  return {
    userReference: input.userReference,
    configurationCode: input.configuration.code,
    userType: input.userType,
    status: "draft",
    active: false,
    defaultRoleAssigned: false,
  };
}

export function createUserWorkspaceMembership(input: {
  readonly permission: UserAdministrationPermission;
  readonly membershipCode: string;
  readonly user: UserAdministrationRecord;
  readonly workspaceReference: string;
  readonly type: MembershipType;
}): UserWorkspaceMembership {
  requirePermission(input.permission);
  requireIdentifier(input.membershipCode, "User membership code");
  requireIdentifier(input.workspaceReference, "Workspace reference");

  return {
    membershipCode: input.membershipCode,
    userReference: input.user.userReference,
    workspaceReference: input.workspaceReference,
    type: input.type,
    status: "draft",
    active: false,
    roleGrantApplied: false,
  };
}

export function createUserInvitation(input: {
  readonly permission: UserAdministrationPermission;
  readonly invitationCode: string;
  readonly targetContactReference: string;
  readonly intendedUserType: AdministrativeUserType;
  readonly workspaceReference: string;
  readonly tokenReference: string;
  readonly includesRawToken?: boolean;
}): UserInvitation {
  requirePermission(input.permission);
  requireIdentifier(input.invitationCode, "User invitation code");
  requireIdentifier(input.targetContactReference, "Invitation target contact reference");
  requireIdentifier(input.workspaceReference, "Invitation workspace reference");
  requireIdentifier(input.tokenReference, "Invitation token reference");
  if (input.includesRawToken) {
    throw new Error("User invitations store safe token references, not raw invitation tokens.");
  }

  return {
    invitationCode: input.invitationCode,
    targetContactReference: input.targetContactReference,
    intendedUserType: input.intendedUserType,
    workspaceReference: input.workspaceReference,
    tokenReference: input.tokenReference,
    status: "draft",
    sent: false,
    accepted: false,
    accessReady: false,
    rawTokenStored: false,
  };
}

export function createUserProvisioningRequest(input: {
  readonly permission: UserAdministrationPermission;
  readonly requestCode: string;
  readonly user: UserAdministrationRecord;
  readonly workspaceReference: string;
}): UserProvisioningRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "User provisioning request code");
  requireIdentifier(input.workspaceReference, "Provisioning workspace reference");

  return {
    requestCode: input.requestCode,
    userReference: input.user.userReference,
    workspaceReference: input.workspaceReference,
    status: "draft",
    processed: false,
    accessGranted: false,
    iamOperationRequested: false,
    authorizationOperationRequested: false,
  };
}

export function createUserRoleAssignmentRequest(input: {
  readonly permission: UserAdministrationPermission;
  readonly requestCode: string;
  readonly user: UserAdministrationRecord;
  readonly workspaceReference: string;
  readonly roleTemplateReference: string;
  readonly scopeReference: string;
}): UserRoleAssignmentRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Role assignment request code");
  requireIdentifier(input.workspaceReference, "Role assignment workspace reference");
  requireIdentifier(input.roleTemplateReference, "Role template reference");
  requireIdentifier(input.scopeReference, "Role assignment scope reference");

  return {
    requestCode: input.requestCode,
    userReference: input.user.userReference,
    workspaceReference: input.workspaceReference,
    roleTemplateReference: input.roleTemplateReference,
    scopeReference: input.scopeReference,
    status: "draft",
    grantApplied: false,
    authorizationOwner: "M081",
  };
}

export function createUserSuspensionRequest(input: {
  readonly permission: UserAdministrationPermission;
  readonly requestCode: string;
  readonly user: UserAdministrationRecord;
  readonly sessionHandling: SessionHandling;
}): UserSuspensionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "User suspension request code");

  return {
    requestCode: input.requestCode,
    userReference: input.user.userReference,
    sessionHandling: input.sessionHandling,
    status: "draft",
    suspended: false,
    historyDeleted: false,
  };
}

export function requestSessionRevocation(input: {
  readonly permission: UserAdministrationPermission;
  readonly requestCode: string;
  readonly user: UserAdministrationRecord;
}): SessionRevocationRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Session revocation request code");

  return {
    requestCode: input.requestCode,
    userReference: input.user.userReference,
    status: "blocked_runtime_disabled",
    revoked: false,
    iamOperationRequested: false,
  };
}

export function requestMfaReset(input: {
  readonly permission: UserAdministrationPermission;
  readonly requestCode: string;
  readonly user: UserAdministrationRecord;
  readonly includesRawAuthenticatorMaterial?: boolean;
}): MfaResetRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "MFA reset request code");
  if (input.includesRawAuthenticatorMaterial) {
    throw new Error("MFA reset requests cannot store authenticator secrets or recovery material.");
  }

  return {
    requestCode: input.requestCode,
    userReference: input.user.userReference,
    status: "review_required",
    resetPerformed: false,
    accessGranted: false,
    rawAuthenticatorMaterialStored: false,
  };
}

export function requestScopedImpersonation(input: {
  readonly permission: UserAdministrationPermission;
  readonly requestCode: string;
  readonly targetUserReference: string;
  readonly unrestricted?: boolean;
}): ImpersonationRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Impersonation request code");
  requireIdentifier(input.targetUserReference, "Impersonation target user reference");
  if (input.unrestricted) {
    throw new Error("Unrestricted impersonation is prohibited.");
  }

  return {
    requestCode: input.requestCode,
    targetUserReference: input.targetUserReference,
    status: "review_required",
    sessionStarted: false,
    unrestricted: false,
  };
}
