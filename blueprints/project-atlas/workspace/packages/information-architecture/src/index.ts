export const INFORMATION_ARCHITECTURE_MODULE = "M086" as const;

export const INFORMATION_ARCHITECTURE_PERMISSIONS = [
  "ia.surface.create",
  "ia.namespace.create",
  "ia.route.create",
  "ia.navigation.create",
  "ia.taxonomy.create",
  "ia.alias.create",
  "ia.resolve",
] as const;

export type InformationArchitecturePermission = (typeof INFORMATION_ARCHITECTURE_PERMISSIONS)[number];

export const INFORMATION_ARCHITECTURE_RUNTIME = {
  routeRegistryActivation: false,
  navigationComposition: false,
  permissionAwareResolution: false,
  aliasRedirects: false,
  localeLabels: false,
  telemetry: false,
  cache: false,
} as const;

export type InformationSurfaceType = "public" | "client" | "admin" | "internal";
export type RouteResolutionStatus = "not_found" | "forbidden" | "review_required";

export interface InformationSurface {
  readonly module: typeof INFORMATION_ARCHITECTURE_MODULE;
  readonly code: string;
  readonly type: InformationSurfaceType;
  readonly status: "draft";
  readonly active: false;
}

export interface RouteNamespace {
  readonly code: string;
  readonly surfaceCode: string;
  readonly pathPrefix: string;
  readonly status: "draft";
  readonly active: false;
}

export interface CanonicalRoute {
  readonly routeCode: string;
  readonly namespaceCode: string;
  readonly pathTemplate: string;
  readonly status: "draft";
  readonly active: false;
  readonly authorizationEnforced: false;
}

export interface NavigationTree {
  readonly treeCode: string;
  readonly surfaceCode: string;
  readonly status: "draft";
  readonly active: false;
}

export interface NavigationItem {
  readonly itemCode: string;
  readonly treeCode: string;
  readonly routeCode: string;
  readonly status: "draft";
  readonly visible: false;
}

export interface InformationTaxonomy {
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
}

export interface RouteAlias {
  readonly aliasCode: string;
  readonly sourcePath: string;
  readonly targetRouteCode: string;
  readonly status: "draft";
  readonly redirectEnabled: false;
}

export interface RouteResolutionResult {
  readonly requestedPath: string;
  readonly status: "review_required";
  readonly routeResolved: false;
  readonly navigationExposed: false;
  readonly redirectPerformed: false;
}

export interface NavigationCompositionResult {
  readonly treeCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly items: readonly [];
  readonly authorizationEvaluated: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: InformationArchitecturePermission): void {
  if (!INFORMATION_ARCHITECTURE_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported information-architecture permission: ${permission}.`);
  }
}

function requireSafePath(value: string, field: string): void {
  requireIdentifier(value, field);
  if (!value.startsWith("/") || value.includes("?") || /(?:token|secret|ssn|password|key)=/i.test(value)) {
    throw new Error(`${field} must be a stable path without query data or sensitive parameters.`);
  }
}

export function createInformationSurface(input: {
  readonly permission: InformationArchitecturePermission;
  readonly code: string;
  readonly type: InformationSurfaceType;
}): InformationSurface {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Information surface code");

  return { module: INFORMATION_ARCHITECTURE_MODULE, code: input.code, type: input.type, status: "draft", active: false };
}

export function createRouteNamespace(input: {
  readonly permission: InformationArchitecturePermission;
  readonly code: string;
  readonly surface: InformationSurface;
  readonly pathPrefix: string;
}): RouteNamespace {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Route namespace code");
  requireSafePath(input.pathPrefix, "Route namespace path prefix");

  return { code: input.code, surfaceCode: input.surface.code, pathPrefix: input.pathPrefix, status: "draft", active: false };
}

export function createCanonicalRoute(input: {
  readonly permission: InformationArchitecturePermission;
  readonly routeCode: string;
  readonly namespace: RouteNamespace;
  readonly pathTemplate: string;
}): CanonicalRoute {
  requirePermission(input.permission);
  requireIdentifier(input.routeCode, "Canonical route code");
  requireSafePath(input.pathTemplate, "Canonical route path template");

  return {
    routeCode: input.routeCode,
    namespaceCode: input.namespace.code,
    pathTemplate: input.pathTemplate,
    status: "draft",
    active: false,
    authorizationEnforced: false,
  };
}

export function createNavigationTree(input: {
  readonly permission: InformationArchitecturePermission;
  readonly treeCode: string;
  readonly surface: InformationSurface;
}): NavigationTree {
  requirePermission(input.permission);
  requireIdentifier(input.treeCode, "Navigation tree code");

  return { treeCode: input.treeCode, surfaceCode: input.surface.code, status: "draft", active: false };
}

export function createNavigationItem(input: {
  readonly permission: InformationArchitecturePermission;
  readonly itemCode: string;
  readonly tree: NavigationTree;
  readonly route: CanonicalRoute;
}): NavigationItem {
  requirePermission(input.permission);
  requireIdentifier(input.itemCode, "Navigation item code");

  return { itemCode: input.itemCode, treeCode: input.tree.treeCode, routeCode: input.route.routeCode, status: "draft", visible: false };
}

export function createInformationTaxonomy(input: {
  readonly permission: InformationArchitecturePermission;
  readonly code: string;
}): InformationTaxonomy {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Information taxonomy code");

  return { code: input.code, status: "draft", active: false };
}

export function createRouteAlias(input: {
  readonly permission: InformationArchitecturePermission;
  readonly aliasCode: string;
  readonly sourcePath: string;
  readonly targetRoute: CanonicalRoute;
}): RouteAlias {
  requirePermission(input.permission);
  requireIdentifier(input.aliasCode, "Route alias code");
  requireSafePath(input.sourcePath, "Route alias source path");

  return {
    aliasCode: input.aliasCode,
    sourcePath: input.sourcePath,
    targetRouteCode: input.targetRoute.routeCode,
    status: "draft",
    redirectEnabled: false,
  };
}

export function resolveRoute(input: {
  readonly permission: InformationArchitecturePermission;
  readonly requestedPath: string;
}): RouteResolutionResult {
  requirePermission(input.permission);
  requireSafePath(input.requestedPath, "Requested route path");

  return {
    requestedPath: input.requestedPath,
    status: "review_required",
    routeResolved: false,
    navigationExposed: false,
    redirectPerformed: false,
  };
}

export function composeNavigation(input: {
  readonly permission: InformationArchitecturePermission;
  readonly tree: NavigationTree;
}): NavigationCompositionResult {
  requirePermission(input.permission);

  return {
    treeCode: input.tree.treeCode,
    status: "blocked_runtime_disabled",
    items: [],
    authorizationEvaluated: false,
  };
}
