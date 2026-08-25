export const CATALOG_SERVICE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/u;
export const CATALOG_VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;

export const CATALOG_KINDS = [
  "service",
  "consultation",
  "package",
  "addon",
  "assessment",
  "partner_product",
  "internal_only",
] as const;
export const CATALOG_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "published",
  "paused",
  "unpublished",
  "retired",
  "archived",
] as const;
export const CATALOG_VISIBILITIES = [
  "public",
  "private",
  "hidden",
  "internal",
  "archived",
] as const;
export const PURCHASE_FLOWS = [
  "direct_checkout",
  "quote_required",
  "consultation_required",
  "eligibility_first",
  "invitation_only",
  "partner_redirect",
  "free_enrollment",
] as const;
export const PRICING_MODES = [
  "fixed",
  "starting_at",
  "custom_quote",
  "deposit_then_balance",
  "subscription",
  "free",
  "government_fee_only",
  "manual_authorized",
] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];
export type CatalogVisibility = (typeof CATALOG_VISIBILITIES)[number];
export type PurchaseFlow = (typeof PURCHASE_FLOWS)[number];
export type PricingMode = (typeof PRICING_MODES)[number];
export type CatalogLocale = "es" | "en";

export type CatalogTranslation = Readonly<{ publicName: string; summary: string }>;
export type CatalogPricingPolicy = Readonly<{
  mode: PricingMode;
  currency: "USD";
  amountMinor?: number;
}>;
export type CatalogCommercialConfiguration = Readonly<{
  pricing: CatalogPricingPolicy;
  workflowCode?: string;
  disclosureCodes: readonly string[];
}>;
export type CatalogDefinition = Readonly<{
  code: string;
  version: string;
  kind: CatalogKind;
  status: CatalogStatus;
  visibility: CatalogVisibility;
  purchaseFlow: PurchaseFlow;
  translations: Readonly<Record<CatalogLocale, CatalogTranslation>>;
  commercialConfiguration: CatalogCommercialConfiguration;
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError(`${label} object required`);
  return value as Record<string, unknown>;
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value))
    if (!allowed.has(key)) throw new TypeError(`${label}.${key} is not allowed`);
}

function text(value: unknown, label: string, maximum: number): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximum ||
    value.split("").some((character) => character.charCodeAt(0) < 32)
  )
    throw new TypeError(`${label} invalid`);
  return value.trim();
}

function oneOf<T extends string>(value: unknown, options: readonly T[], label: string): T {
  if (typeof value !== "string" || !options.includes(value as T))
    throw new TypeError(`${label} invalid`);
  return value as T;
}

function translation(value: unknown, locale: CatalogLocale): CatalogTranslation {
  const source = record(value, `translations.${locale}`);
  exact(source, ["publicName", "summary"], `translations.${locale}`);
  return Object.freeze({
    publicName: text(source.publicName, `translations.${locale}.publicName`, 160),
    summary: text(source.summary, `translations.${locale}.summary`, 500),
  });
}

function pricing(value: unknown): CatalogPricingPolicy {
  const source = record(value, "pricing");
  exact(source, ["mode", "currency", "amountMinor"], "pricing");
  const mode = oneOf(source.mode, PRICING_MODES, "pricing.mode");
  if (source.currency !== "USD") throw new TypeError("pricing.currency invalid");
  if (
    source.amountMinor !== undefined &&
    (!Number.isSafeInteger(source.amountMinor) || Number(source.amountMinor) < 0)
  )
    throw new TypeError("pricing.amountMinor invalid");
  if ((mode === "fixed" || mode === "starting_at") && source.amountMinor === undefined)
    throw new TypeError("pricing.amountMinor required");
  if (mode !== "fixed" && mode !== "starting_at" && source.amountMinor !== undefined)
    throw new TypeError("pricing.amountMinor forbidden");
  return Object.freeze({
    mode,
    currency: "USD",
    ...(source.amountMinor === undefined ? {} : { amountMinor: Number(source.amountMinor) }),
  });
}

export function parseCatalogDefinition(value: unknown): CatalogDefinition {
  const source = record(value, "catalogDefinition");
  exact(
    source,
    [
      "code",
      "version",
      "kind",
      "status",
      "visibility",
      "purchaseFlow",
      "translations",
      "commercialConfiguration",
    ],
    "catalogDefinition",
  );
  const code = text(source.code, "code", 64);
  if (!CATALOG_SERVICE_CODE_PATTERN.test(code)) throw new TypeError("code invalid");
  const version = text(source.version, "version", 32);
  if (!CATALOG_VERSION_PATTERN.test(version)) throw new TypeError("version invalid");
  const translations = record(source.translations, "translations");
  exact(translations, ["es", "en"], "translations");
  const configuration = record(source.commercialConfiguration, "commercialConfiguration");
  exact(configuration, ["pricing", "workflowCode", "disclosureCodes"], "commercialConfiguration");
  if (!Array.isArray(configuration.disclosureCodes) || configuration.disclosureCodes.length > 16)
    throw new TypeError("disclosureCodes invalid");
  const disclosureCodes = configuration.disclosureCodes.map((item) => {
    const codeValue = text(item, "disclosureCode", 64);
    if (!CATALOG_SERVICE_CODE_PATTERN.test(codeValue))
      throw new TypeError("disclosureCode invalid");
    return codeValue;
  });
  if (new Set(disclosureCodes).size !== disclosureCodes.length)
    throw new TypeError("disclosureCodes duplicate");
  const workflowCode =
    configuration.workflowCode === undefined
      ? undefined
      : text(configuration.workflowCode, "workflowCode", 64);
  if (workflowCode !== undefined && !CATALOG_SERVICE_CODE_PATTERN.test(workflowCode))
    throw new TypeError("workflowCode invalid");
  return Object.freeze({
    code,
    version,
    kind: oneOf(source.kind, CATALOG_KINDS, "kind"),
    status: oneOf(source.status, CATALOG_STATUSES, "status"),
    visibility: oneOf(source.visibility, CATALOG_VISIBILITIES, "visibility"),
    purchaseFlow: oneOf(source.purchaseFlow, PURCHASE_FLOWS, "purchaseFlow"),
    translations: Object.freeze({
      es: translation(translations.es, "es"),
      en: translation(translations.en, "en"),
    }),
    commercialConfiguration: Object.freeze({
      pricing: pricing(configuration.pricing),
      ...(workflowCode === undefined ? {} : { workflowCode }),
      disclosureCodes: Object.freeze(disclosureCodes),
    }),
  });
}
