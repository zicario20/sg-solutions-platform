import {
  type ServiceDefinition,
  type ServiceOrderCatalogSnapshot,
  type ServiceVersion,
  validateServicePublication,
} from "./service-registry.ts";

export type CatalogDataQualityFinding = Readonly<{
  type:
    | "duplicate_service_code"
    | "invalid_publication"
    | "duplicate_canonical_path"
    | "retired_service_orderable"
    | "active_order_snapshot_missing";
  severity: "warning" | "blocking";
  serviceDefinitionId: string;
  serviceVersionId: string | null;
  message: string;
}>;

export type CatalogDriftFinding = Readonly<{
  type: "configuration_hash" | "public_field_exposure" | "missing_public_field";
  severity: "warning" | "blocking";
  field: string;
  message: string;
}>;

export type CatalogMetricDefinition = Readonly<{
  metricName: string;
  definition: string;
  numerator: string;
  denominator: string;
  filters: readonly string[];
  timeWindow: string;
  owner: string;
  version: string;
  sourceTables: readonly string[];
  lastValidatedAt: string;
}>;

export type CatalogRecoveryVerification = Readonly<{
  safeToResume: boolean;
  checks: readonly Readonly<{
    name: "active_order_snapshots" | "catalog_versions" | "publication_readiness";
    passed: boolean;
  }>[];
}>;

export type ServiceCatalogLineage = Readonly<{
  serviceDefinitionId: string;
  serviceVersionId: string;
  configurationHash: string;
  relatedReferences: readonly string[];
}>;

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z"))
    throw new TypeError(label + " invalid");
}

export function evaluateCatalogDataQuality(
  records: readonly Readonly<{
    definition: ServiceDefinition;
    version: ServiceVersion;
    activeOrderSnapshotCount: number;
  }>[],
): readonly CatalogDataQualityFinding[] {
  const findings: CatalogDataQualityFinding[] = [];
  const codes = new Set<string>();
  const canonicalPaths = new Set<string>();
  for (const record of records) {
    const { definition, version } = record;
    if (codes.has(definition.code))
      findings.push({
        type: "duplicate_service_code",
        severity: "blocking",
        serviceDefinitionId: definition.id,
        serviceVersionId: version.id,
        message: "Service codes must be unique across catalog definitions.",
      });
    codes.add(definition.code);
    if (
      version.publicationStatus === "published" &&
      validateServicePublication(definition, version).kind !== "ready"
    )
      findings.push({
        type: "invalid_publication",
        severity: "blocking",
        serviceDefinitionId: definition.id,
        serviceVersionId: version.id,
        message: "Published service version does not satisfy catalog readiness.",
      });
    if (version.seo !== null) {
      if (canonicalPaths.has(version.seo.canonicalPath))
        findings.push({
          type: "duplicate_canonical_path",
          severity: "blocking",
          serviceDefinitionId: definition.id,
          serviceVersionId: version.id,
          message: "Canonical public paths must be unique.",
        });
      canonicalPaths.add(version.seo.canonicalPath);
    }
    if (definition.lifecycleStatus === "retired" && record.activeOrderSnapshotCount > 0)
      findings.push({
        type: "retired_service_orderable",
        severity: "warning",
        serviceDefinitionId: definition.id,
        serviceVersionId: version.id,
        message: "Retirement requires preserved active-order support and a manual review.",
      });
  }
  return Object.freeze(findings);
}

export function detectCatalogDrift(
  expected: Readonly<{ configurationHash: string; publicFields: readonly string[] }>,
  rendered: Readonly<{ configurationHash: string; publicFields: readonly string[] }>,
): readonly CatalogDriftFinding[] {
  const findings: CatalogDriftFinding[] = [];
  if (expected.configurationHash !== rendered.configurationHash)
    findings.push({
      type: "configuration_hash",
      severity: "blocking",
      field: "configurationHash",
      message: "Rendered catalog content does not match the approved configuration hash.",
    });
  const expectedFields = new Set(expected.publicFields);
  const restrictedFields = [
    "commercialProfile",
    "workflowBinding",
    "providerRequirements",
    "partnerRequirements",
    "internalDescription",
    "staffAssignment",
  ];
  for (const field of rendered.publicFields) {
    if (restrictedFields.includes(field))
      findings.push({
        type: "public_field_exposure",
        severity: "blocking",
        field,
        message: "Restricted catalog field appeared on a public surface.",
      });
  }
  for (const field of expectedFields) {
    if (!rendered.publicFields.includes(field))
      findings.push({
        type: "missing_public_field",
        severity: "warning",
        field,
        message: "Expected public catalog field is missing from the rendered surface.",
      });
  }
  return Object.freeze(findings);
}

export function createCatalogMetricDefinition(
  value: CatalogMetricDefinition,
): CatalogMetricDefinition {
  if (
    value.metricName.trim().length === 0 ||
    value.definition.trim().length === 0 ||
    value.numerator.trim().length === 0 ||
    value.denominator.trim().length === 0 ||
    value.owner.trim().length === 0 ||
    value.sourceTables.length === 0
  )
    throw new TypeError("catalog metric definition incomplete");
  assertIso(value.lastValidatedAt, "catalog metric lastValidatedAt");
  return Object.freeze({
    ...structuredClone(value),
    filters: Object.freeze([...value.filters]),
    sourceTables: Object.freeze([...value.sourceTables]),
  });
}

export function buildServiceCatalogLineage(
  definition: ServiceDefinition,
  version: ServiceVersion,
): ServiceCatalogLineage {
  return Object.freeze({
    serviceDefinitionId: definition.id,
    serviceVersionId: version.id,
    configurationHash: version.configurationHash,
    relatedReferences: Object.freeze(
      [
        version.commercialProfile.pricingReference,
        version.commercialProfile.depositPolicyReference,
        version.documentRequirementSetReference,
        version.disclosureSetReference,
        version.intakeDefinitionReference,
        version.workflowBinding?.workflowCode ?? null,
        version.jurisdictionRuleSetReference,
      ].filter((reference): reference is string => reference !== null),
    ),
  });
}

export function verifyCatalogRecovery(
  activeOrderSnapshots: readonly ServiceOrderCatalogSnapshot[],
  retainedVersions: readonly ServiceVersion[],
): CatalogRecoveryVerification {
  const versionIds = new Set(retainedVersions.map((version) => version.id));
  const snapshotsPresent = activeOrderSnapshots.every((snapshot) =>
    versionIds.has(snapshot.serviceVersionId),
  );
  const versionsPresent = retainedVersions.length > 0;
  const readinessPresent = retainedVersions.every(
    (version) => version.configurationHash.trim().length > 0,
  );
  return Object.freeze({
    safeToResume: snapshotsPresent && versionsPresent && readinessPresent,
    checks: Object.freeze([
      Object.freeze({ name: "active_order_snapshots" as const, passed: snapshotsPresent }),
      Object.freeze({ name: "catalog_versions" as const, passed: versionsPresent }),
      Object.freeze({ name: "publication_readiness" as const, passed: readinessPresent }),
    ]),
  });
}
