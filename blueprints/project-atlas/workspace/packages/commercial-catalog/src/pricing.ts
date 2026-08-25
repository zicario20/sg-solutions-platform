type PriceSnapshot = Readonly<{
  version: string;
  currency: "USD";
  serviceFeeMinor: number;
  externalFeesMinor: number;
  addons: readonly Readonly<{ code: string; amountMinor: number; requiresServiceCode: string }>[];
  promotion?: Readonly<{ code: string; percentageBasisPoints: number; stackable: boolean }>;
}>;
function money(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} invalid`);
  return value;
}
export function calculateCatalogPrice(input: unknown, snapshot: PriceSnapshot) {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("price input invalid");
  const source = input as Record<string, unknown>;
  for (const key of Object.keys(source))
    if (!["serviceCode", "addonCodes", "promotionCode"].includes(key))
      throw new TypeError(`${key} is not allowed`);
  if (source.serviceCode !== undefined && typeof source.serviceCode !== "string")
    throw new TypeError("serviceCode invalid");
  const addons = source.addonCodes === undefined ? [] : source.addonCodes;
  if (
    !Array.isArray(addons) ||
    addons.some((code) => typeof code !== "string") ||
    new Set(addons).size !== addons.length
  )
    throw new TypeError("addonCodes invalid");
  const selected = snapshot.addons.filter((addon) => addons.includes(addon.code));
  if (
    selected.length !== addons.length ||
    selected.some((addon) => addon.requiresServiceCode !== source.serviceCode)
  )
    throw new TypeError("addon dependency invalid");
  const serviceFeeMinor = money(snapshot.serviceFeeMinor, "serviceFeeMinor"),
    externalFeesMinor = money(snapshot.externalFeesMinor, "externalFeesMinor"),
    addonMinor = selected.reduce(
      (sum, addon) => sum + money(addon.amountMinor, "addon.amountMinor"),
      0,
    );
  let discountMinor = 0;
  if (source.promotionCode !== undefined) {
    if (
      typeof source.promotionCode !== "string" ||
      snapshot.promotion?.code !== source.promotionCode
    )
      throw new TypeError("promotionCode invalid");
    discountMinor = Math.floor(
      ((serviceFeeMinor + addonMinor) * snapshot.promotion.percentageBasisPoints) / 10_000,
    );
  }
  return Object.freeze({
    currency: "USD" as const,
    serviceFeeMinor,
    externalFeesMinor,
    addonMinor,
    discountMinor,
    totalMinor: serviceFeeMinor + externalFeesMinor + addonMinor - discountMinor,
    pricingVersion: snapshot.version,
  });
}
