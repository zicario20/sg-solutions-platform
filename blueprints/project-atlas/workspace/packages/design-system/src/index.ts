export const DESIGN_SYSTEM_MODULE = "M087" as const;

export const DESIGN_SYSTEM_PERMISSIONS = [
  "design.system.configure",
  "design.token.create",
  "design.component.create",
  "design.pattern.create",
  "design.release.request",
  "design.component.render",
] as const;

export type DesignSystemPermission = (typeof DESIGN_SYSTEM_PERMISSIONS)[number];

export const DESIGN_SYSTEM_RUNTIME = {
  tokenDistribution: false,
  themeApplication: false,
  componentRegistry: false,
  componentRendering: false,
  releaseActivation: false,
  visualTesting: false,
  telemetry: false,
} as const;

export type DesignSurface = "public" | "client" | "admin" | "internal";
export type DesignComponentCategory = "primitive" | "form" | "navigation" | "feedback" | "overlay" | "data_display";

export interface DesignSystemConfiguration {
  readonly module: typeof DESIGN_SYSTEM_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly tokenSource: "@atlas/design-tokens";
  readonly currentVisualSystemPreserved: true;
}

export interface DesignTokenSet {
  readonly tokenSetCode: string;
  readonly configurationCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly distributionEnabled: false;
}

export interface DesignComponentDefinition {
  readonly componentCode: string;
  readonly configurationCode: string;
  readonly category: DesignComponentCategory;
  readonly status: "draft";
  readonly active: false;
  readonly implementationRegistered: false;
  readonly accessibilityContractRequired: true;
}

export interface DesignPatternDefinition {
  readonly patternCode: string;
  readonly configurationCode: string;
  readonly surface: DesignSurface;
  readonly status: "draft";
  readonly active: false;
  readonly routeOrDomainBehaviorChanged: false;
}

export interface DesignReleaseRequest {
  readonly releaseCode: string;
  readonly configurationCode: string;
  readonly status: "review_required";
  readonly packageActivated: false;
  readonly tokenBundleDistributed: false;
  readonly visualReviewCompleted: false;
  readonly accessibilityReviewCompleted: false;
}

export interface ComponentRenderPreparation {
  readonly componentCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly rendered: false;
  readonly authorizationDecisionMade: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: DesignSystemPermission): void {
  if (!DESIGN_SYSTEM_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported design-system permission: ${permission}.`);
  }
}

export function createDesignSystemConfiguration(input: {
  readonly permission: DesignSystemPermission;
  readonly code: string;
}): DesignSystemConfiguration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Design system configuration code");

  return {
    module: DESIGN_SYSTEM_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    tokenSource: "@atlas/design-tokens",
    currentVisualSystemPreserved: true,
  };
}

export function createDesignTokenSet(input: {
  readonly permission: DesignSystemPermission;
  readonly tokenSetCode: string;
  readonly configuration: DesignSystemConfiguration;
}): DesignTokenSet {
  requirePermission(input.permission);
  requireIdentifier(input.tokenSetCode, "Design token set code");

  return {
    tokenSetCode: input.tokenSetCode,
    configurationCode: input.configuration.code,
    status: "draft",
    active: false,
    distributionEnabled: false,
  };
}

export function createDesignComponentDefinition(input: {
  readonly permission: DesignSystemPermission;
  readonly componentCode: string;
  readonly configuration: DesignSystemConfiguration;
  readonly category: DesignComponentCategory;
  readonly accessibilityContractReference: string;
  readonly usesVisualStateAsAuthorization?: boolean;
}): DesignComponentDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.componentCode, "Design component code");
  requireIdentifier(input.accessibilityContractReference, "Accessibility contract reference");
  if (input.usesVisualStateAsAuthorization) {
    throw new Error("Design-system styling cannot substitute authorization.");
  }

  return {
    componentCode: input.componentCode,
    configurationCode: input.configuration.code,
    category: input.category,
    status: "draft",
    active: false,
    implementationRegistered: false,
    accessibilityContractRequired: true,
  };
}

export function createDesignPatternDefinition(input: {
  readonly permission: DesignSystemPermission;
  readonly patternCode: string;
  readonly configuration: DesignSystemConfiguration;
  readonly surface: DesignSurface;
  readonly changesRouteOrDomainBehavior?: boolean;
}): DesignPatternDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.patternCode, "Design pattern code");
  if (input.changesRouteOrDomainBehavior) {
    throw new Error("Design patterns cannot change routes or domain behavior.");
  }

  return {
    patternCode: input.patternCode,
    configurationCode: input.configuration.code,
    surface: input.surface,
    status: "draft",
    active: false,
    routeOrDomainBehaviorChanged: false,
  };
}

export function requestDesignRelease(input: {
  readonly permission: DesignSystemPermission;
  readonly releaseCode: string;
  readonly configuration: DesignSystemConfiguration;
}): DesignReleaseRequest {
  requirePermission(input.permission);
  requireIdentifier(input.releaseCode, "Design release code");

  return {
    releaseCode: input.releaseCode,
    configurationCode: input.configuration.code,
    status: "review_required",
    packageActivated: false,
    tokenBundleDistributed: false,
    visualReviewCompleted: false,
    accessibilityReviewCompleted: false,
  };
}

export function prepareComponentRender(input: {
  readonly permission: DesignSystemPermission;
  readonly component: DesignComponentDefinition;
}): ComponentRenderPreparation {
  requirePermission(input.permission);

  return {
    componentCode: input.component.componentCode,
    status: "blocked_runtime_disabled",
    rendered: false,
    authorizationDecisionMade: false,
  };
}
