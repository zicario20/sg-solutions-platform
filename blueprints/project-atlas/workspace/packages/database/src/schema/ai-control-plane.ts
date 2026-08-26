import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
};

export const aiHubWorkspaces = pgTable(
  "ai_hub_workspaces",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    workspaceCode: varchar("workspace_code", { length: 96 }).notNull(),
    environment: varchar("environment", { length: 32 }).notNull(),
    productionDataAccess: boolean("production_data_access").notNull().default(false),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_hub_workspaces_tenant_code_unique").on(table.tenantId, table.workspaceCode),
  ],
).enableRLS();

export const aiAssetDefinitions = pgTable(
  "ai_asset_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    assetType: varchar("asset_type", { length: 64 }).notNull(),
    assetCode: varchar("asset_code", { length: 96 }).notNull(),
    ownerReference: varchar("owner_reference", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_asset_definitions_workspace_code_unique").on(
      table.workspaceId,
      table.assetCode,
    ),
    index("ai_asset_definitions_tenant_status_index").on(table.tenantId, table.status),
  ],
).enableRLS();

export const aiAgentDefinitions = pgTable(
  "ai_agent_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    agentCode: varchar("agent_code", { length: 96 }).notNull(),
    displayName: varchar("display_name", { length: 180 }).notNull(),
    agentType: varchar("agent_type", { length: 64 }).notNull(),
    lifecycleStatus: varchar("lifecycle_status", { length: 32 }).notNull(),
    deploymentStatus: varchar("deployment_status", { length: 32 }).notNull(),
    ownerReference: varchar("owner_reference", { length: 160 }).notNull(),
    riskTier: varchar("risk_tier", { length: 32 }).notNull(),
    purpose: text("purpose").notNull(),
    scopeBoundary: text("scope_boundary").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_agent_definitions_workspace_code_unique").on(
      table.workspaceId,
      table.agentCode,
    ),
    index("ai_agent_definitions_tenant_lifecycle_index").on(table.tenantId, table.lifecycleStatus),
  ],
).enableRLS();

export const aiAgentVersions = pgTable(
  "ai_agent_versions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentDefinitionId: uuid("agent_definition_id").notNull(),
    version: integer("version").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    capabilities: jsonb("capabilities").notNull(),
    configurationHash: varchar("configuration_hash", { length: 128 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_agent_versions_definition_version_unique").on(
      table.agentDefinitionId,
      table.version,
    ),
    index("ai_agent_versions_tenant_status_index").on(table.tenantId, table.status),
  ],
).enableRLS();

export const aiAgentManifests = pgTable(
  "ai_agent_manifests",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    references: jsonb("references").notNull(),
    configurationHash: varchar("configuration_hash", { length: 128 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_agent_manifests_version_hash_unique").on(
      table.agentVersionId,
      table.configurationHash,
    ),
  ],
).enableRLS();

export const aiAgentSurfaceBindings = pgTable(
  "ai_agent_surface_bindings",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    surface: varchar("surface", { length: 32 }).notNull(),
    capabilityCodes: jsonb("capability_codes").notNull(),
    requiredPermissions: jsonb("required_permissions").notNull(),
    requiredEntitlements: jsonb("required_entitlements").notNull(),
    ownershipRequired: boolean("ownership_required").notNull().default(false),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_agent_surface_bindings_version_surface_index").on(
      table.agentVersionId,
      table.surface,
    ),
  ],
).enableRLS();

export const aiModelProviderProfiles = pgTable(
  "ai_model_provider_profiles",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    providerCode: varchar("provider_code", { length: 96 }).notNull(),
    providerKind: varchar("provider_kind", { length: 64 }).notNull(),
    environment: varchar("environment", { length: 32 }).notNull(),
    endpointReference: text("endpoint_reference").notNull(),
    secretReference: varchar("secret_reference", { length: 240 }),
    status: varchar("status", { length: 32 }).notNull(),
    health: varchar("health", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_model_provider_profiles_workspace_code_env_unique").on(
      table.workspaceId,
      table.providerCode,
      table.environment,
    ),
  ],
).enableRLS();

export const aiModelDefinitions = pgTable(
  "ai_model_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    providerProfileId: uuid("provider_profile_id").notNull(),
    modelCode: varchar("model_code", { length: 96 }).notNull(),
    lifecycleStatus: varchar("lifecycle_status", { length: 32 }).notNull(),
    dataClassifications: jsonb("data_classifications").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_model_definitions_provider_code_unique").on(
      table.providerProfileId,
      table.modelCode,
    ),
  ],
).enableRLS();

export const aiModelVersions = pgTable(
  "ai_model_versions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    modelDefinitionId: uuid("model_definition_id").notNull(),
    exactModelId: varchar("exact_model_id", { length: 240 }).notNull(),
    version: integer("version").notNull(),
    contextWindow: integer("context_window").notNull(),
    maximumOutputTokens: integer("maximum_output_tokens").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_model_versions_definition_version_unique").on(
      table.modelDefinitionId,
      table.version,
    ),
  ],
).enableRLS();

export const aiModelPolicies = pgTable(
  "ai_model_policies",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    policyCode: varchar("policy_code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    configuration: jsonb("configuration").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_model_policies_tenant_code_version_unique").on(
      table.tenantId,
      table.policyCode,
      table.version,
    ),
  ],
).enableRLS();

export const aiPromptVersions = pgTable(
  "ai_prompt_versions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    promptDefinitionId: uuid("prompt_definition_id").notNull(),
    version: integer("version").notNull(),
    templateReference: varchar("template_reference", { length: 240 }).notNull(),
    variableNames: jsonb("variable_names").notNull(),
    locale: varchar("locale", { length: 8 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_prompt_versions_definition_version_unique").on(
      table.promptDefinitionId,
      table.version,
    ),
  ],
).enableRLS();

export const aiToolDefinitions = pgTable(
  "ai_tool_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    toolCode: varchar("tool_code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    sideEffectClass: varchar("side_effect_class", { length: 32 }).notNull(),
    requiredPermissions: jsonb("required_permissions").notNull(),
    requiredApprovals: jsonb("required_approvals").notNull(),
    networkPolicy: varchar("network_policy", { length: 32 }).notNull(),
    idempotencyRequired: boolean("idempotency_required").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_tool_definitions_tenant_code_version_unique").on(
      table.tenantId,
      table.toolCode,
      table.version,
    ),
  ],
).enableRLS();

export const aiToolPermissionPolicies = pgTable(
  "ai_tool_permission_policies",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    policyCode: varchar("policy_code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    configuration: jsonb("configuration").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_tool_permission_policies_tenant_code_version_unique").on(
      table.tenantId,
      table.policyCode,
      table.version,
    ),
  ],
).enableRLS();

export const aiKnowledgeBindings = pgTable(
  "ai_knowledge_bindings",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    collectionReference: varchar("collection_reference", { length: 240 }).notNull(),
    accessScope: varchar("access_scope", { length: 32 }).notNull(),
    surface: varchar("surface", { length: 32 }).notNull(),
    freshnessPolicyReference: varchar("freshness_policy_reference", { length: 240 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_knowledge_bindings_version_surface_index").on(table.agentVersionId, table.surface),
  ],
).enableRLS();

export const aiContextSessions = pgTable(
  "ai_context_sessions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    purpose: varchar("purpose", { length: 160 }).notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    contextFields: jsonb("context_fields").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("ai_context_sessions_tenant_expiry_index").on(table.tenantId, table.expiresAt)],
).enableRLS();

export const aiDatasetVersions = pgTable(
  "ai_dataset_versions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    datasetDefinitionId: uuid("dataset_definition_id").notNull(),
    version: integer("version").notNull(),
    provenanceReferences: jsonb("provenance_references").notNull(),
    dataClassification: varchar("data_classification", { length: 32 }).notNull(),
    split: varchar("split", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_dataset_versions_definition_version_unique").on(
      table.datasetDefinitionId,
      table.version,
    ),
  ],
).enableRLS();

export const aiEvaluationSuites = pgTable(
  "ai_evaluation_suites",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    suiteCode: varchar("suite_code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    dimensions: jsonb("dimensions").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_evaluation_suites_tenant_code_version_unique").on(
      table.tenantId,
      table.suiteCode,
      table.version,
    ),
  ],
).enableRLS();

export const aiSafetyTestResults = pgTable(
  "ai_safety_test_results",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    evaluationSuiteId: uuid("evaluation_suite_id"),
    scenarioType: varchar("scenario_type", { length: 96 }).notNull(),
    severity: varchar("severity", { length: 32 }).notNull(),
    blocking: boolean("blocking").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    evidenceReference: varchar("evidence_reference", { length: 240 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_safety_test_results_agent_status_index").on(table.agentVersionId, table.status),
  ],
).enableRLS();

export const aiReleaseGates = pgTable(
  "ai_release_gates",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    evaluationSuiteReferences: jsonb("evaluation_suite_references").notNull(),
    safetyTestReferences: jsonb("safety_test_references").notNull(),
    requiredHumanApprovals: jsonb("required_human_approvals").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [index("ai_release_gates_agent_status_index").on(table.agentVersionId, table.status)],
).enableRLS();

export const aiAgentRuns = pgTable(
  "ai_agent_runs",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    invocationType: varchar("invocation_type", { length: 32 }).notNull(),
    invocationAuthorizationReference: varchar("invocation_authorization_reference", {
      length: 240,
    }).notNull(),
    inputSnapshotReference: varchar("input_snapshot_reference", { length: 240 }).notNull(),
    contextSnapshotReference: varchar("context_snapshot_reference", { length: 240 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [index("ai_agent_runs_tenant_status_index").on(table.tenantId, table.status)],
).enableRLS();

export const aiAgentRunSteps = pgTable(
  "ai_agent_run_steps",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    runId: uuid("run_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    stepType: varchar("step_type", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("ai_agent_run_steps_run_ordinal_unique").on(table.runId, table.ordinal)],
).enableRLS();

export const aiAgentHandoffs = pgTable(
  "ai_agent_handoffs",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    sourceRunId: uuid("source_run_id").notNull(),
    targetAgentVersionId: uuid("target_agent_version_id").notNull(),
    purpose: varchar("purpose", { length: 240 }).notNull(),
    factReferences: jsonb("fact_references").notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [index("ai_agent_handoffs_source_status_index").on(table.sourceRunId, table.status)],
).enableRLS();

export const aiHumanApprovals = pgTable(
  "ai_human_approvals",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    runId: uuid("run_id").notNull(),
    actionType: varchar("action_type", { length: 120 }).notNull(),
    parameterHash: varchar("parameter_hash", { length: 240 }).notNull(),
    requiredApproverRoles: jsonb("required_approver_roles").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [index("ai_human_approvals_run_status_index").on(table.runId, table.status)],
).enableRLS();

export const aiToolExecutionRecords = pgTable(
  "ai_tool_execution_records",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    runId: uuid("run_id").notNull(),
    toolDefinitionId: uuid("tool_definition_id").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 240 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    outcomeReference: varchar("outcome_reference", { length: 240 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_tool_execution_records_tenant_idempotency_unique").on(
      table.tenantId,
      table.idempotencyKey,
    ),
  ],
).enableRLS();

export const aiRuntimeIncidents = pgTable(
  "ai_runtime_incidents",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    incidentType: varchar("incident_type", { length: 96 }).notNull(),
    severity: varchar("severity", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    resourceReference: varchar("resource_reference", { length: 240 }).notNull(),
    mitigationReference: varchar("mitigation_reference", { length: 240 }),
    ...timestamps,
  },
  (table) => [index("ai_runtime_incidents_tenant_status_index").on(table.tenantId, table.status)],
).enableRLS();

export const aiAuditEvents = pgTable(
  "ai_audit_events",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 96 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    eventType: varchar("event_type", { length: 120 }).notNull(),
    correlationId: varchar("correlation_id", { length: 160 }).notNull(),
    evidenceReference: varchar("evidence_reference", { length: 240 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_audit_events_tenant_aggregate_index").on(
      table.tenantId,
      table.aggregateType,
      table.aggregateId,
    ),
  ],
).enableRLS();

export const aiOutbox = pgTable(
  "ai_outbox",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    eventType: varchar("event_type", { length: 120 }).notNull(),
    aggregateReference: varchar("aggregate_reference", { length: 240 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 240 }).notNull(),
    payloadReference: varchar("payload_reference", { length: 240 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_outbox_tenant_idempotency_unique").on(table.tenantId, table.idempotencyKey),
  ],
).enableRLS();
