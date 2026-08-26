import { CatalogControlError } from "./governance.ts";
import {
  type ServiceCatalogLocale,
  type ServiceDefinition,
  type ServiceSurface,
  type ServiceVersion,
  validateServicePublication,
} from "./service-registry.ts";

export type ServiceDiscoveryDocument = Readonly<{
  code: string;
  categoryCode: string;
  canonicalPath: string;
  title: string;
  description: string;
  availability: "available" | "limited" | "waitlist";
  locale: ServiceCatalogLocale;
}>;

export type ServiceSurfaceProjectionRequest = Readonly<{
  surface: ServiceSurface;
  locale: ServiceCatalogLocale;
  authorized: boolean;
  purpose: "public_discovery" | "client_service_detail" | "catalog_administration";
  clientHasServiceGrant: boolean;
}>;

type PublicDiscoveryAvailability = ServiceDiscoveryDocument["availability"];

function isPublicDiscoveryAvailability(
  availability: ServiceDefinition["availability"]["status"],
): availability is PublicDiscoveryAvailability {
  return availability === "available" || availability === "limited" || availability === "waitlist";
}

function isPubliclyDiscoverable(definition: ServiceDefinition, version: ServiceVersion): boolean {
  const availability = definition.availability.status;
  const readiness = validateServicePublication(definition, version);

  return (
    version.publicationStatus === "published" &&
    definition.surfaces.includes("public") &&
    isPublicDiscoveryAvailability(availability) &&
    version.seo !== null &&
    readiness.kind === "ready"
  );
}

export function buildServiceDiscoveryIndex(
  records: readonly Readonly<{ definition: ServiceDefinition; version: ServiceVersion }>[],
): readonly ServiceDiscoveryDocument[] {
  const documents: ServiceDiscoveryDocument[] = [];

  for (const { definition, version } of records) {
    const availability = definition.availability.status;
    if (
      !isPubliclyDiscoverable(definition, version) ||
      !isPublicDiscoveryAvailability(availability)
    ) {
      continue;
    }

    const seo = version.seo;
    if (seo === null) continue;

    const spanish = version.translations.es;
    documents.push(
      Object.freeze({
        code: definition.code,
        categoryCode: definition.categoryCode,
        canonicalPath: seo.canonicalPath,
        title: spanish.name,
        description: spanish.summary,
        availability,
        locale: "es",
      }),
      Object.freeze({
        code: definition.code,
        categoryCode: definition.categoryCode,
        canonicalPath: seo.canonicalPath,
        title: seo.title,
        description: seo.description,
        availability,
        locale: "en",
      }),
    );
  }

  return Object.freeze(documents);
}

export function projectServiceForSurface(
  definition: ServiceDefinition,
  version: ServiceVersion,
  request: ServiceSurfaceProjectionRequest,
): Readonly<Record<string, unknown>> {
  if (!request.authorized) throw new CatalogControlError("authorization required");

  const translation = version.translations[request.locale];

  if (request.surface === "public") {
    if (request.purpose !== "public_discovery")
      throw new CatalogControlError("public purpose required");
    if (!isPubliclyDiscoverable(definition, version))
      throw new CatalogControlError("public service is not discoverable");

    return Object.freeze({
      code: definition.code,
      categoryCode: definition.categoryCode,
      name: translation.name,
      summary: translation.summary,
      benefits: translation.benefits,
      limitations: translation.limitations,
      ctaLabel: translation.ctaLabel,
      availability: definition.availability.status,
      canonicalPath: version.seo?.canonicalPath ?? null,
      duration:
        version.durationProfile === null
          ? null
          : {
              type: version.durationProfile.type,
              unit: version.durationProfile.unit,
              minimum: version.durationProfile.minimum,
              maximum: version.durationProfile.maximum,
              confidence: version.durationProfile.confidence,
            },
    });
  }

  if (request.surface === "client") {
    if (request.purpose !== "client_service_detail" || !request.clientHasServiceGrant)
      throw new CatalogControlError("client service grant required");

    return Object.freeze({
      code: definition.code,
      name: translation.name,
      summary: translation.summary,
      limitations: translation.limitations,
      availability: definition.availability.status,
      documentRequirementSetReference: version.documentRequirementSetReference,
      disclosureSetReference: version.disclosureSetReference,
      durationProfile: version.durationProfile,
    });
  }

  if (request.purpose !== "catalog_administration")
    throw new CatalogControlError("admin purpose required");

  return Object.freeze({
    definition,
    version,
    publicationReadiness:
      definition.availability.status === "unknown" ? "blocked" : "review_required",
  });
}
