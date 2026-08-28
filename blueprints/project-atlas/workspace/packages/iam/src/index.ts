export const IAM_MODULE = "M080" as const;

export const IAM_PERMISSIONS = [
  "iam.principal.create",
  "iam.identity.create",
  "iam.account.create",
  "iam.authenticator.enroll",
  "iam.authentication.request",
  "iam.session.create",
  "iam.service_identity.create",
  "iam.access.delegation.request",
] as const;

export type IamPermission = (typeof IAM_PERMISSIONS)[number];

export const IAM_RUNTIME = {
  accountProvisioning: false,
  passwordAuthentication: false,
  passwordlessAuthentication: false,
  mfaVerification: false,
  sessionIssuance: false,
  tokenValidation: false,
  serviceIdentityActivation: false,
  federation: false,
  recovery: false,
  delegation: false,
  revocationPropagation: false,
} as const;

export type PrincipalType = "client" | "staff" | "administrator" | "service" | "agent" | "external_provider" | "unknown";
export type AuthenticatorType = "password_reference" | "passkey_reference" | "totp_reference" | "hardware_key_reference" | "federated_reference" | "unknown";

export interface IamPrincipal {
  readonly module: typeof IAM_MODULE;
  readonly principalReference: string;
  readonly type: PrincipalType;
  readonly status: "draft";
  readonly active: false;
}

export interface HumanIdentity {
  readonly identityReference: string;
  readonly principalReference: string;
  readonly status: "unverified";
  readonly identityAssurance: "unknown";
}

export interface UserAccount {
  readonly accountReference: string;
  readonly principalReference: string;
  readonly status: "provisioning_disabled";
  readonly active: false;
  readonly authorizationGranted: false;
}

export interface LoginIdentifier {
  readonly identifierReference: string;
  readonly accountReference: string;
  readonly verified: false;
  readonly rawIdentifierStored: false;
}

export interface Authenticator {
  readonly authenticatorReference: string;
  readonly accountReference: string;
  readonly type: AuthenticatorType;
  readonly status: "not_enrolled_runtime_disabled";
  readonly credentialMaterialStored: false;
}

export interface AuthenticationAttempt {
  readonly attemptId: string;
  readonly accountReference: string;
  readonly status: "received_runtime_disabled";
  readonly secretMaterialAccepted: false;
}

export interface AuthenticationResult {
  readonly attemptId: string;
  readonly status: "blocked_runtime_disabled";
  readonly authenticated: false;
  readonly mfaSatisfied: false;
  readonly sessionIssued: false;
  readonly tokenIssued: false;
}

export interface SessionCandidate {
  readonly sessionReference: string;
  readonly accountReference: string;
  readonly status: "not_issued_runtime_disabled";
  readonly active: false;
  readonly tokenStored: false;
}

export interface ServiceIdentity {
  readonly serviceIdentityReference: string;
  readonly principalReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly credentialIssued: false;
}

export interface DelegatedAccessRequest {
  readonly requestId: string;
  readonly delegatorReference: string;
  readonly delegateReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly impersonationEnabled: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: IamPermission): void {
  if (!IAM_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported IAM permission: ${permission}.`);
  }
}

export function createIamPrincipal(input: {
  readonly permission: IamPermission;
  readonly principalReference: string;
  readonly type: PrincipalType;
}): IamPrincipal {
  requirePermission(input.permission);
  requireIdentifier(input.principalReference, "IAM principal reference");

  return {
    module: IAM_MODULE,
    principalReference: input.principalReference,
    type: input.type,
    status: "draft",
    active: false,
  };
}

export function createHumanIdentity(input: {
  readonly permission: IamPermission;
  readonly identityReference: string;
  readonly principal: IamPrincipal;
}): HumanIdentity {
  requirePermission(input.permission);
  requireIdentifier(input.identityReference, "Human identity reference");

  return {
    identityReference: input.identityReference,
    principalReference: input.principal.principalReference,
    status: "unverified",
    identityAssurance: "unknown",
  };
}

export function createUserAccount(input: {
  readonly permission: IamPermission;
  readonly accountReference: string;
  readonly principal: IamPrincipal;
}): UserAccount {
  requirePermission(input.permission);
  requireIdentifier(input.accountReference, "User account reference");

  return {
    accountReference: input.accountReference,
    principalReference: input.principal.principalReference,
    status: "provisioning_disabled",
    active: false,
    authorizationGranted: false,
  };
}

export function createLoginIdentifier(input: {
  readonly account: UserAccount;
  readonly identifierReference: string;
  readonly includesRawIdentifier?: boolean;
}): LoginIdentifier {
  requireIdentifier(input.identifierReference, "Login identifier reference");
  if (input.includesRawIdentifier) {
    throw new Error("IAM stores login-identifier references, not raw login identifiers.");
  }

  return {
    identifierReference: input.identifierReference,
    accountReference: input.account.accountReference,
    verified: false,
    rawIdentifierStored: false,
  };
}

export function enrollAuthenticator(input: {
  readonly permission: IamPermission;
  readonly account: UserAccount;
  readonly authenticatorReference: string;
  readonly type: AuthenticatorType;
  readonly includesCredentialMaterial?: boolean;
}): Authenticator {
  requirePermission(input.permission);
  requireIdentifier(input.authenticatorReference, "Authenticator reference");
  if (input.includesCredentialMaterial) {
    throw new Error("IAM foundation cannot receive or store credential material.");
  }

  return {
    authenticatorReference: input.authenticatorReference,
    accountReference: input.account.accountReference,
    type: input.type,
    status: "not_enrolled_runtime_disabled",
    credentialMaterialStored: false,
  };
}

export function recordAuthenticationAttempt(input: {
  readonly permission: IamPermission;
  readonly attemptId: string;
  readonly account: UserAccount;
  readonly includesSecretMaterial?: boolean;
}): AuthenticationAttempt {
  requirePermission(input.permission);
  requireIdentifier(input.attemptId, "Authentication attempt ID");
  if (input.includesSecretMaterial) {
    throw new Error("IAM foundation cannot receive authentication secret material.");
  }

  return {
    attemptId: input.attemptId,
    accountReference: input.account.accountReference,
    status: "received_runtime_disabled",
    secretMaterialAccepted: false,
  };
}

export function evaluateAuthenticationAttempt(input: {
  readonly attempt: AuthenticationAttempt;
}): AuthenticationResult {
  return {
    attemptId: input.attempt.attemptId,
    status: "blocked_runtime_disabled",
    authenticated: false,
    mfaSatisfied: false,
    sessionIssued: false,
    tokenIssued: false,
  };
}

export function createSessionCandidate(input: {
  readonly permission: IamPermission;
  readonly sessionReference: string;
  readonly account: UserAccount;
}): SessionCandidate {
  requirePermission(input.permission);
  requireIdentifier(input.sessionReference, "Session reference");

  return {
    sessionReference: input.sessionReference,
    accountReference: input.account.accountReference,
    status: "not_issued_runtime_disabled",
    active: false,
    tokenStored: false,
  };
}

export function createServiceIdentity(input: {
  readonly permission: IamPermission;
  readonly serviceIdentityReference: string;
  readonly principal: IamPrincipal;
}): ServiceIdentity {
  requirePermission(input.permission);
  requireIdentifier(input.serviceIdentityReference, "Service identity reference");

  return {
    serviceIdentityReference: input.serviceIdentityReference,
    principalReference: input.principal.principalReference,
    status: "draft",
    active: false,
    credentialIssued: false,
  };
}

export function requestDelegatedAccess(input: {
  readonly permission: IamPermission;
  readonly requestId: string;
  readonly delegatorReference: string;
  readonly delegateReference: string;
}): DelegatedAccessRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Delegated access request ID");
  requireIdentifier(input.delegatorReference, "Delegator reference");
  requireIdentifier(input.delegateReference, "Delegate reference");

  return {
    requestId: input.requestId,
    delegatorReference: input.delegatorReference,
    delegateReference: input.delegateReference,
    status: "draft",
    active: false,
    impersonationEnabled: false,
  };
}
