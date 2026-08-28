export const SECRETS_MANAGEMENT_MODULE = "M083" as const;

export const SECRETS_PERMISSIONS = [
  "secret.identity.create",
  "secret.provider_ref.create",
  "secret.version.reference.create",
  "secret.consumer.bind",
  "secret.retrieval.request",
  "secret.lease.request",
  "secret.rotation.request",
  "secret.revocation.request",
  "secret.scan.finding.create",
] as const;

export type SecretsPermission = (typeof SECRETS_PERMISSIONS)[number];

export const SECRETS_RUNTIME = {
  providerBinding: false,
  secretRetrieval: false,
  secretInjection: false,
  leaseIssuance: false,
  dynamicCredentialIssuance: false,
  rotationExecution: false,
  revocationExecution: false,
  scanning: false,
  cache: false,
} as const;

export type SecretType = "api_key" | "oauth_client" | "webhook" | "database" | "signing_key" | "provider_credential" | "other";
export type SecretRequesterType = "human" | "service_identity" | "worker" | "ai" | "external_provider" | "unknown";

export interface SecretIdentity {
  readonly module: typeof SECRETS_MANAGEMENT_MODULE;
  readonly code: string;
  readonly type: SecretType;
  readonly environment: "development" | "test" | "staging" | "production" | "unknown";
  readonly status: "draft";
  readonly active: false;
}

export interface SecretProviderReference {
  readonly providerReference: string;
  readonly secretCode: string;
  readonly status: "draft";
  readonly bound: false;
  readonly connectionEstablished: false;
}

export interface SecretVersionReference {
  readonly versionReference: string;
  readonly secretCode: string;
  readonly fingerprintReference: string | null;
  readonly status: "draft";
  readonly rawSecretStored: false;
}

export interface SecretConsumerBinding {
  readonly bindingId: string;
  readonly secretCode: string;
  readonly consumerReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly valueVisibleToConsumer: false;
}

export interface SecretRetrievalRequest {
  readonly requestId: string;
  readonly secretCode: string;
  readonly requesterType: Exclude<SecretRequesterType, "ai">;
  readonly status: "blocked_runtime_disabled";
  readonly valueReturned: false;
  readonly injectionPerformed: false;
}

export interface SecretLeaseRequest {
  readonly requestId: string;
  readonly secretCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly leaseIssued: false;
  readonly dynamicCredentialIssued: false;
}

export interface SecretRotationRequest {
  readonly requestId: string;
  readonly secretCode: string;
  readonly status: "draft";
  readonly rotationExecuted: false;
  readonly oldVersionRevoked: false;
}

export interface SecretRevocationRequest {
  readonly requestId: string;
  readonly secretCode: string;
  readonly status: "draft";
  readonly revocationExecuted: false;
  readonly auditHistoryErased: false;
}

export interface SecretScanFinding {
  readonly findingId: string;
  readonly repositoryReference: string;
  readonly fingerprintReference: string | null;
  readonly status: "draft";
  readonly rawSecretStored: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: SecretsPermission): void {
  if (!SECRETS_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported secrets-management permission: ${permission}.`);
  }
}

function rejectRawSecret(present: boolean | undefined): void {
  if (present) {
    throw new Error("Secret material must never enter ordinary application contracts or storage.");
  }
}

export function createSecretIdentity(input: {
  readonly permission: SecretsPermission;
  readonly code: string;
  readonly type: SecretType;
  readonly environment: SecretIdentity["environment"];
}): SecretIdentity {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Secret identity code");

  return {
    module: SECRETS_MANAGEMENT_MODULE,
    code: input.code,
    type: input.type,
    environment: input.environment,
    status: "draft",
    active: false,
  };
}

export function createSecretProviderReference(input: {
  readonly permission: SecretsPermission;
  readonly providerReference: string;
  readonly secret: SecretIdentity;
}): SecretProviderReference {
  requirePermission(input.permission);
  requireIdentifier(input.providerReference, "Secret provider reference");

  return {
    providerReference: input.providerReference,
    secretCode: input.secret.code,
    status: "draft",
    bound: false,
    connectionEstablished: false,
  };
}

export function createSecretVersionReference(input: {
  readonly permission: SecretsPermission;
  readonly versionReference: string;
  readonly secret: SecretIdentity;
  readonly fingerprintReference?: string;
  readonly includesRawSecret?: boolean;
}): SecretVersionReference {
  requirePermission(input.permission);
  requireIdentifier(input.versionReference, "Secret version reference");
  rejectRawSecret(input.includesRawSecret);

  return {
    versionReference: input.versionReference,
    secretCode: input.secret.code,
    fingerprintReference: input.fingerprintReference ?? null,
    status: "draft",
    rawSecretStored: false,
  };
}

export function bindSecretConsumer(input: {
  readonly permission: SecretsPermission;
  readonly bindingId: string;
  readonly secret: SecretIdentity;
  readonly consumerReference: string;
}): SecretConsumerBinding {
  requirePermission(input.permission);
  requireIdentifier(input.bindingId, "Secret consumer binding ID");
  requireIdentifier(input.consumerReference, "Secret consumer reference");

  return {
    bindingId: input.bindingId,
    secretCode: input.secret.code,
    consumerReference: input.consumerReference,
    status: "draft",
    active: false,
    valueVisibleToConsumer: false,
  };
}

export function requestSecretRetrieval(input: {
  readonly permission: SecretsPermission;
  readonly requestId: string;
  readonly secret: SecretIdentity;
  readonly requesterType: SecretRequesterType;
}): SecretRetrievalRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Secret retrieval request ID");
  if (input.requesterType === "ai") {
    throw new Error("AI cannot retrieve or display raw secrets; use a future mediated tool boundary.");
  }

  return {
    requestId: input.requestId,
    secretCode: input.secret.code,
    requesterType: input.requesterType,
    status: "blocked_runtime_disabled",
    valueReturned: false,
    injectionPerformed: false,
  };
}

export function requestSecretLease(input: {
  readonly permission: SecretsPermission;
  readonly requestId: string;
  readonly secret: SecretIdentity;
}): SecretLeaseRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Secret lease request ID");

  return {
    requestId: input.requestId,
    secretCode: input.secret.code,
    status: "blocked_runtime_disabled",
    leaseIssued: false,
    dynamicCredentialIssued: false,
  };
}

export function requestSecretRotation(input: {
  readonly permission: SecretsPermission;
  readonly requestId: string;
  readonly secret: SecretIdentity;
}): SecretRotationRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Secret rotation request ID");

  return {
    requestId: input.requestId,
    secretCode: input.secret.code,
    status: "draft",
    rotationExecuted: false,
    oldVersionRevoked: false,
  };
}

export function requestSecretRevocation(input: {
  readonly permission: SecretsPermission;
  readonly requestId: string;
  readonly secret: SecretIdentity;
}): SecretRevocationRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Secret revocation request ID");

  return {
    requestId: input.requestId,
    secretCode: input.secret.code,
    status: "draft",
    revocationExecuted: false,
    auditHistoryErased: false,
  };
}

export function createSecretScanFinding(input: {
  readonly permission: SecretsPermission;
  readonly findingId: string;
  readonly repositoryReference: string;
  readonly fingerprintReference?: string;
  readonly includesRawSecret?: boolean;
}): SecretScanFinding {
  requirePermission(input.permission);
  requireIdentifier(input.findingId, "Secret scan finding ID");
  requireIdentifier(input.repositoryReference, "Secret scan repository reference");
  rejectRawSecret(input.includesRawSecret);

  return {
    findingId: input.findingId,
    repositoryReference: input.repositoryReference,
    fingerprintReference: input.fingerprintReference ?? null,
    status: "draft",
    rawSecretStored: false,
  };
}
