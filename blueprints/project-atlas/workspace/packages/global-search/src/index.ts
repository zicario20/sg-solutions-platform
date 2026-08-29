export const GLOBAL_SEARCH_MODULE = "M089" as const;

export const GLOBAL_SEARCH_PERMISSIONS = [
  "search.configuration.create",
  "search.surface.create",
  "search.index.create",
  "search.resource.create",
  "search.provider.register",
  "search.query.prepare",
  "search.query.execute",
  "search.index.request",
] as const;

export type GlobalSearchPermission = (typeof GLOBAL_SEARCH_PERMISSIONS)[number];

export const GLOBAL_SEARCH_RUNTIME = {
  indexing: false,
  queryExecution: false,
  providerConnections: false,
  lexicalSearch: false,
  semanticSearch: false,
  autocomplete: false,
  recentSearches: false,
  savedSearches: false,
  telemetry: false,
} as const;

export type SearchSurfaceScope = "public" | "client" | "admin" | "internal";
export type SafeSearchProjectionField = "safe_title" | "safe_type" | "safe_status" | "safe_date" | "authorized_identifier";

export interface GlobalSearchConfiguration {
  readonly module: typeof GLOBAL_SEARCH_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly providerConnected: false;
}

export interface SearchSurface {
  readonly surfaceCode: string;
  readonly configurationCode: string;
  readonly scope: SearchSurfaceScope;
  readonly status: "draft";
  readonly active: false;
  readonly authorizationBoundaryRequired: true;
}

export interface SearchIndexSet {
  readonly indexSetCode: string;
  readonly configurationCode: string;
  readonly surfaceCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly providerConnected: false;
  readonly rawPiiIndexed: false;
  readonly semanticSearchEnabled: false;
}

export interface SearchableResourceDefinition {
  readonly resourceCode: string;
  readonly indexSetCode: string;
  readonly projectionFields: readonly SafeSearchProjectionField[];
  readonly status: "draft";
  readonly active: false;
  readonly authorizationProjectionRequired: true;
}

export interface SearchProviderRegistration {
  readonly providerCode: string;
  readonly configurationCode: string;
  readonly status: "draft";
  readonly connected: false;
  readonly credentialsLoaded: false;
}

export interface SearchQueryCandidate {
  readonly queryReference: string;
  readonly surfaceCode: string;
  readonly status: "draft";
  readonly rawQueryStored: false;
  readonly containsSensitiveData: false;
}

export interface GlobalSearchExecutionResult {
  readonly queryReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly results: readonly [];
  readonly queryExecuted: false;
  readonly providerCalled: false;
  readonly authorizationEvaluated: false;
  readonly resultCountDisclosed: false;
  readonly resourceExistenceDisclosed: false;
}

export interface SearchIndexRequest {
  readonly requestCode: string;
  readonly indexSetCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly dispatched: false;
  readonly documentsIndexed: 0;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: GlobalSearchPermission): void {
  if (!GLOBAL_SEARCH_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported global-search permission: ${permission}.`);
  }
}

export function createGlobalSearchConfiguration(input: {
  readonly permission: GlobalSearchPermission;
  readonly code: string;
}): GlobalSearchConfiguration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Global search configuration code");

  return {
    module: GLOBAL_SEARCH_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    providerConnected: false,
  };
}

export function createSearchSurface(input: {
  readonly permission: GlobalSearchPermission;
  readonly surfaceCode: string;
  readonly configuration: GlobalSearchConfiguration;
  readonly scope: SearchSurfaceScope;
}): SearchSurface {
  requirePermission(input.permission);
  requireIdentifier(input.surfaceCode, "Search surface code");

  return {
    surfaceCode: input.surfaceCode,
    configurationCode: input.configuration.code,
    scope: input.scope,
    status: "draft",
    active: false,
    authorizationBoundaryRequired: true,
  };
}

export function createSearchIndexSet(input: {
  readonly permission: GlobalSearchPermission;
  readonly indexSetCode: string;
  readonly configuration: GlobalSearchConfiguration;
  readonly surface: SearchSurface;
  readonly includesRawPii?: boolean;
}): SearchIndexSet {
  requirePermission(input.permission);
  requireIdentifier(input.indexSetCode, "Search index set code");
  if (input.includesRawPii) {
    throw new Error("Search index definitions cannot include raw PII fields.");
  }

  return {
    indexSetCode: input.indexSetCode,
    configurationCode: input.configuration.code,
    surfaceCode: input.surface.surfaceCode,
    status: "draft",
    active: false,
    providerConnected: false,
    rawPiiIndexed: false,
    semanticSearchEnabled: false,
  };
}

export function registerSearchableResourceDefinition(input: {
  readonly permission: GlobalSearchPermission;
  readonly resourceCode: string;
  readonly indexSet: SearchIndexSet;
  readonly projectionFields: readonly SafeSearchProjectionField[];
  readonly includesUnapprovedField?: boolean;
}): SearchableResourceDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.resourceCode, "Searchable resource code");
  if (input.projectionFields.length === 0 || input.includesUnapprovedField) {
    throw new Error("Search resources require non-empty approved metadata projections only.");
  }

  return {
    resourceCode: input.resourceCode,
    indexSetCode: input.indexSet.indexSetCode,
    projectionFields: input.projectionFields,
    status: "draft",
    active: false,
    authorizationProjectionRequired: true,
  };
}

export function registerSearchProvider(input: {
  readonly permission: GlobalSearchPermission;
  readonly providerCode: string;
  readonly configuration: GlobalSearchConfiguration;
  readonly includesCredentialMaterial?: boolean;
}): SearchProviderRegistration {
  requirePermission(input.permission);
  requireIdentifier(input.providerCode, "Search provider code");
  if (input.includesCredentialMaterial) {
    throw new Error("Search provider registration cannot contain credential material.");
  }

  return {
    providerCode: input.providerCode,
    configurationCode: input.configuration.code,
    status: "draft",
    connected: false,
    credentialsLoaded: false,
  };
}

export function createSearchQueryCandidate(input: {
  readonly permission: GlobalSearchPermission;
  readonly queryReference: string;
  readonly surface: SearchSurface;
  readonly includesRawQueryText?: boolean;
  readonly containsSensitiveData?: boolean;
}): SearchQueryCandidate {
  requirePermission(input.permission);
  requireIdentifier(input.queryReference, "Search query reference");
  if (input.includesRawQueryText || input.containsSensitiveData) {
    throw new Error("Global search stores neither raw query text nor sensitive query data.");
  }

  return {
    queryReference: input.queryReference,
    surfaceCode: input.surface.surfaceCode,
    status: "draft",
    rawQueryStored: false,
    containsSensitiveData: false,
  };
}

export function executeGlobalSearch(input: {
  readonly permission: GlobalSearchPermission;
  readonly query: SearchQueryCandidate;
  readonly indexSet: SearchIndexSet;
}): GlobalSearchExecutionResult {
  requirePermission(input.permission);

  return {
    queryReference: input.query.queryReference,
    status: "blocked_runtime_disabled",
    results: [],
    queryExecuted: false,
    providerCalled: false,
    authorizationEvaluated: false,
    resultCountDisclosed: false,
    resourceExistenceDisclosed: false,
  };
}

export function requestSearchIndexing(input: {
  readonly permission: GlobalSearchPermission;
  readonly requestCode: string;
  readonly indexSet: SearchIndexSet;
}): SearchIndexRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Search index request code");

  return {
    requestCode: input.requestCode,
    indexSetCode: input.indexSet.indexSetCode,
    status: "blocked_runtime_disabled",
    dispatched: false,
    documentsIndexed: 0,
  };
}
