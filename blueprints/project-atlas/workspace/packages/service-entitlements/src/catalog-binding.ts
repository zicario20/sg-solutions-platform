/**
 * Provider-neutral contract for the M042 catalog to point at a versioned M045
 * service-entitlement profile. The binding is metadata only: it cannot grant
 * access, trigger M44 ingestion, or authorize M68 workflow execution.
 */
export type CatalogEntitlementProfileBinding = Readonly<{
  entitlementProfileReference: string;
  entitlementProfileVersion: number;
}>;

export function validateCatalogEntitlementProfileBinding(
  binding: CatalogEntitlementProfileBinding,
): CatalogEntitlementProfileBinding {
  if (binding.entitlementProfileReference.trim().length === 0)
    throw new TypeError("entitlementProfileReference is required");
  if (
    !Number.isInteger(binding.entitlementProfileVersion) ||
    binding.entitlementProfileVersion <= 0
  )
    throw new TypeError("entitlementProfileVersion must be a positive integer");
  return Object.freeze(structuredClone(binding));
}
