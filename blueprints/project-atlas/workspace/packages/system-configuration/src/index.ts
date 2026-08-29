export const SYSTEM_CONFIGURATION_MODULE = "M090" as const;

export const SYSTEM_CONFIGURATION_PERMISSIONS = [
  "system_configuration.definition.create",
  "system_configuration.value.propose",
  "system_configuration.change_set.create",
  "system_configuration.feature_flag.create",
  "system_configuration.sourced_fact.create",
  "system_configuration.validation.request",
  "system_configuration.activation.request",
] as const;

export type SystemConfigurationPermission = (typeof SYSTEM_CONFIGURATION_PERMISSIONS)[number];

export const SYSTEM_CONFIGURATION_RUNTIME = {
  valueResolution: false,
  featureFlagEvaluation: false,
  sourcedFactRefresh: false,
  validationExecution: false,
  approvalVerification: false,
  activation: false,
  rollout: false,
  rollback: false,
  telemetry: false,
} as const;

export type ConfigurationScope =
  | "global"
  | "environment"
  | "surface"
  | "module"
  | "service"
  | "provider_profile"
  | "jurisdiction"
  | "workspace"
  | "role_presentation"
  | "user_preference_bridge";
export type ConfigurationValueType = "boolean" | "integer" | "string" | "enum" | "json" | "duration" | "secret_reference";
export type ConfigurationSensitivity = "standard" | "sensitive_reference" | "restricted";

export interface SystemConfiguration {
  readonly module: typeof SYSTEM_CONFIGURATION_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly runtimeResolutionEnabled: false;
}

export interface ConfigurationDefinition {
  readonly configurationKey: string;
  readonly configurationCode: string;
  readonly scope: ConfigurationScope;
  readonly valueType: ConfigurationValueType;
  readonly sensitivity: ConfigurationSensitivity;
  readonly status: "draft";
  readonly active: false;
  readonly acceptsRawSecret: false;
}

export interface ConfigurationValueCandidate {
  readonly candidateCode: string;
  readonly configurationKey: string;
  readonly valueReference: string;
  readonly status: "draft";
  readonly validationExecuted: false;
  readonly runtimeResolved: false;
  readonly rawSecretStored: false;
}

export interface ConfigurationChangeSet {
  readonly changeSetCode: string;
  readonly configurationCode: string;
  readonly status: "draft";
  readonly validationCompleted: false;
  readonly approvalVerified: false;
  readonly activationExecuted: false;
}

export interface FeatureFlagDefinition {
  readonly flagCode: string;
  readonly configurationCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly evaluated: false;
  readonly grantsAuthorization: false;
  readonly killSwitchTriggered: false;
}

export interface SourcedConfigurationFact {
  readonly factCode: string;
  readonly configurationCode: string;
  readonly sourceReference: string;
  readonly status: "review_required";
  readonly freshnessVerified: false;
  readonly rawSourceDataStored: false;
}

export interface ConfigurationActivationResult {
  readonly changeSetCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly activated: false;
  readonly approvalsRevalidated: false;
  readonly dependenciesRevalidated: false;
  readonly secretsResolved: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: SystemConfigurationPermission): void {
  if (!SYSTEM_CONFIGURATION_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported system-configuration permission: ${permission}.`);
  }
}

export function createSystemConfiguration(input: {
  readonly permission: SystemConfigurationPermission;
  readonly code: string;
}): SystemConfiguration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "System configuration code");

  return {
    module: SYSTEM_CONFIGURATION_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    runtimeResolutionEnabled: false,
  };
}

export function createConfigurationDefinition(input: {
  readonly permission: SystemConfigurationPermission;
  readonly configurationKey: string;
  readonly configuration: SystemConfiguration;
  readonly scope: ConfigurationScope;
  readonly valueType: ConfigurationValueType;
  readonly sensitivity: ConfigurationSensitivity;
}): ConfigurationDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.configurationKey, "Configuration key");
  if (!/^[a-z][a-z0-9_.-]*$/.test(input.configurationKey)) {
    throw new Error("Configuration key must use a stable lowercase namespace.");
  }

  return {
    configurationKey: input.configurationKey,
    configurationCode: input.configuration.code,
    scope: input.scope,
    valueType: input.valueType,
    sensitivity: input.sensitivity,
    status: "draft",
    active: false,
    acceptsRawSecret: false,
  };
}

export function proposeConfigurationValue(input: {
  readonly permission: SystemConfigurationPermission;
  readonly candidateCode: string;
  readonly definition: ConfigurationDefinition;
  readonly valueReference: string;
  readonly includesRawSecret?: boolean;
  readonly includesExecutableCode?: boolean;
}): ConfigurationValueCandidate {
  requirePermission(input.permission);
  requireIdentifier(input.candidateCode, "Configuration value candidate code");
  requireIdentifier(input.valueReference, "Configuration value reference");
  if (input.includesRawSecret || input.includesExecutableCode) {
    throw new Error("Configuration candidates store safe references, not raw secrets or executable code.");
  }

  return {
    candidateCode: input.candidateCode,
    configurationKey: input.definition.configurationKey,
    valueReference: input.valueReference,
    status: "draft",
    validationExecuted: false,
    runtimeResolved: false,
    rawSecretStored: false,
  };
}

export function createConfigurationChangeSet(input: {
  readonly permission: SystemConfigurationPermission;
  readonly changeSetCode: string;
  readonly configuration: SystemConfiguration;
}): ConfigurationChangeSet {
  requirePermission(input.permission);
  requireIdentifier(input.changeSetCode, "Configuration change-set code");

  return {
    changeSetCode: input.changeSetCode,
    configurationCode: input.configuration.code,
    status: "draft",
    validationCompleted: false,
    approvalVerified: false,
    activationExecuted: false,
  };
}

export function createFeatureFlagDefinition(input: {
  readonly permission: SystemConfigurationPermission;
  readonly flagCode: string;
  readonly configuration: SystemConfiguration;
  readonly grantsAuthorization?: boolean;
}): FeatureFlagDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.flagCode, "Feature flag code");
  if (input.grantsAuthorization) {
    throw new Error("Feature flags cannot grant authorization, consent or approval.");
  }

  return {
    flagCode: input.flagCode,
    configurationCode: input.configuration.code,
    status: "draft",
    active: false,
    evaluated: false,
    grantsAuthorization: false,
    killSwitchTriggered: false,
  };
}

export function createSourcedConfigurationFact(input: {
  readonly permission: SystemConfigurationPermission;
  readonly factCode: string;
  readonly configuration: SystemConfiguration;
  readonly sourceReference: string;
  readonly includesRawSourceData?: boolean;
}): SourcedConfigurationFact {
  requirePermission(input.permission);
  requireIdentifier(input.factCode, "Sourced configuration fact code");
  requireIdentifier(input.sourceReference, "Sourced configuration fact reference");
  if (input.includesRawSourceData) {
    throw new Error("Sourced configuration facts store evidence references, not raw source data.");
  }

  return {
    factCode: input.factCode,
    configurationCode: input.configuration.code,
    sourceReference: input.sourceReference,
    status: "review_required",
    freshnessVerified: false,
    rawSourceDataStored: false,
  };
}

export function requestConfigurationActivation(input: {
  readonly permission: SystemConfigurationPermission;
  readonly changeSet: ConfigurationChangeSet;
}): ConfigurationActivationResult {
  requirePermission(input.permission);

  return {
    changeSetCode: input.changeSet.changeSetCode,
    status: "blocked_runtime_disabled",
    activated: false,
    approvalsRevalidated: false,
    dependenciesRevalidated: false,
    secretsResolved: false,
  };
}
