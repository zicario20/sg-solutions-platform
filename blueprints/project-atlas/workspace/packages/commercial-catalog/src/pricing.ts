import { calculateLegacyCatalogPrice, type LegacyCatalogPriceSnapshot } from "@atlas/pricing";

/**
 * M021 compatibility surface.
 *
 * M046 is the authoritative pricing owner. Existing catalog consumers retain
 * this narrow adapter while they migrate to the typed pricing contracts.
 */
export type CatalogPriceSnapshot = LegacyCatalogPriceSnapshot;

export function calculateCatalogPrice(input: unknown, snapshot: CatalogPriceSnapshot) {
  return calculateLegacyCatalogPrice(input, snapshot);
}
