import { createHash } from "node:crypto";
import type {
  CurrencyDefinition,
  DepositPricingPolicy,
  PriceBook,
  PriceBookEntry,
  PriceComponentDefinition,
  PricingActor,
  PricingCalculationRequest,
  PricingDefinition,
  PricingProfile,
  PricingRule,
  PromotionCode,
  PromotionDefinition,
} from "./contracts.ts";
import { PRICING_CODE_PATTERN, PRICING_CURRENCY_PATTERN } from "./contracts.ts";

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError(`${label} object required`);
  return value as Record<string, unknown>;
}

function exact(value: Record<string, unknown>, keys: readonly string[]): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value))
    if (!allowed.has(key)) throw new TypeError(`${key} is not allowed`);
}

export function assertText(value: unknown, label: string, maximum = 500): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximum ||
    Array.from(value).some((character) => character.charCodeAt(0) < 32)
  )
    throw new TypeError(`${label} invalid`);
  return value.trim();
}

export function assertIso(value: unknown, label: string): string {
  const candidate = assertText(value, label, 64);
  if (!candidate.endsWith("Z") || !Number.isFinite(Date.parse(candidate)))
    throw new TypeError(`${label} invalid`);
  return candidate;
}

export function assertMinor(value: unknown, label: string, nullable = false): number | null {
  if (nullable && value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new TypeError(`${label} invalid`);
  return Number(value);
}

export function assertVersion(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 1) throw new TypeError(`${label} invalid`);
  return Number(value);
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return `{${Object.keys(source)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(source[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashPricingValue(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function effectiveRange(from: string, to: string | null, label: string): void {
  if (to !== null && Date.parse(to) < Date.parse(from)) throw new TypeError(`${label} invalid`);
}

export function normalizePromotionCode(value: string): string {
  const normalized = value.normalize("NFKC").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{4,64}$/u.test(normalized)) throw new TypeError("promotion code invalid");
  return normalized;
}

export function assertPricingActorAllowed(actor: PricingActor): void {
  assertText(actor.actorId, "actorId", 160);
  assertText(actor.purpose, "purpose", 160);
  if (actor.actorType === "ai")
    throw new Error(
      "AI actors cannot calculate, approve, publish, or override authoritative prices",
    );
}

export function assertPricingContextSafe(value: unknown): void {
  const source = record(value, "pricing context");
  const prohibited = new Set([
    "race",
    "ethnicity",
    "religion",
    "gender",
    "sex",
    "disability",
    "nationalOrigin",
    "national_origin",
    "zipCode",
    "zip_code",
  ]);
  if (source.protectedTraits !== undefined && source.protectedTraits !== null) {
    const traits = record(source.protectedTraits, "protected traits");
    if (Object.keys(traits).some((key) => prohibited.has(key)))
      throw new TypeError("protected trait pricing input forbidden");
  }
  if (Object.keys(source).some((key) => prohibited.has(key)))
    throw new TypeError("protected trait pricing input forbidden");
}

export function assertPricingCalculationRequest(value: unknown): PricingCalculationRequest {
  const source = record(value, "pricing calculation request");
  exact(source, [
    "id",
    "tenantId",
    "serviceDefinitionId",
    "serviceVersionId",
    "clientId",
    "organizationId",
    "quoteId",
    "channel",
    "audience",
    "jurisdiction",
    "quantity",
    "calculationDate",
    "currencyPreference",
    "correlationId",
    "idempotencyKey",
    "actor",
  ]);
  if (!Number.isInteger(source.quantity) || Number(source.quantity) < 1)
    throw new TypeError("quantity invalid");
  if (source.currencyPreference !== "USD") throw new TypeError("currencyPreference invalid");
  const actorSource = record(source.actor, "actor");
  exact(actorSource, ["actorType", "actorId", "purpose"]);
  if (
    !["client", "staff", "system", "service_account", "ai"].includes(String(actorSource.actorType))
  )
    throw new TypeError("actor type invalid");
  const actor: PricingActor = {
    actorType: actorSource.actorType as PricingActor["actorType"],
    actorId: assertText(actorSource.actorId, "actorId", 160),
    purpose: assertText(actorSource.purpose, "purpose", 160),
  };
  assertPricingActorAllowed(actor);
  return deepFreeze({
    id: assertText(source.id, "request id", 160),
    tenantId: assertText(source.tenantId, "tenantId", 160),
    serviceDefinitionId: assertText(source.serviceDefinitionId, "serviceDefinitionId", 160),
    serviceVersionId: assertText(source.serviceVersionId, "serviceVersionId", 160),
    ...(source.clientId === undefined
      ? {}
      : { clientId: assertText(source.clientId, "clientId", 160) }),
    ...(source.organizationId === undefined
      ? {}
      : { organizationId: assertText(source.organizationId, "organizationId", 160) }),
    ...(source.quoteId === undefined
      ? {}
      : { quoteId: assertText(source.quoteId, "quoteId", 160) }),
    channel: assertText(source.channel, "channel", 80),
    audience: assertText(source.audience, "audience", 80),
    jurisdiction: assertText(source.jurisdiction, "jurisdiction", 80),
    quantity: Number(source.quantity),
    calculationDate: assertIso(source.calculationDate, "calculationDate"),
    currencyPreference: "USD" as const,
    correlationId: assertText(source.correlationId, "correlationId", 160),
    idempotencyKey: assertText(source.idempotencyKey, "idempotencyKey", 200),
    actor,
  });
}

export function createCurrencyDefinition(value: CurrencyDefinition): CurrencyDefinition {
  if (!PRICING_CURRENCY_PATTERN.test(value.currencyCode)) throw new TypeError("currency invalid");
  if (
    !Number.isInteger(value.minorUnitDigits) ||
    value.minorUnitDigits < 0 ||
    value.minorUnitDigits > 4
  )
    throw new TypeError("minorUnitDigits invalid");
  if (value.lastVerifiedAt !== null) assertIso(value.lastVerifiedAt, "lastVerifiedAt");
  return deepFreeze(structuredClone(value));
}

export function createPricingDefinition(value: PricingDefinition): PricingDefinition {
  if (!PRICING_CODE_PATTERN.test(value.pricingCode)) throw new TypeError("pricingCode invalid");
  assertText(value.id, "pricing definition id", 160);
  assertText(value.name, "pricing definition name", 200);
  assertText(value.description, "pricing definition description", 1000);
  assertText(value.ownerDomain, "ownerDomain", 120);
  assertIso(value.createdAt, "pricing definition createdAt");
  assertIso(value.updatedAt, "pricing definition updatedAt");
  return deepFreeze(structuredClone(value));
}

export function createPriceBook(value: PriceBook): PriceBook {
  if (!PRICING_CODE_PATTERN.test(value.priceBookCode)) throw new TypeError("priceBookCode invalid");
  if (value.currency !== "USD") throw new TypeError("priceBook currency invalid");
  assertText(value.id, "priceBook id", 160);
  assertText(value.name, "priceBook name", 200);
  assertText(value.marketContext, "marketContext", 120);
  const from = assertIso(value.effectiveFrom, "priceBook effectiveFrom");
  const to =
    value.effectiveTo === null ? null : assertIso(value.effectiveTo, "priceBook effectiveTo");
  effectiveRange(from, to, "priceBook effective range");
  assertVersion(value.version, "priceBook version");
  return deepFreeze(structuredClone(value));
}

function component(value: PriceComponentDefinition): PriceComponentDefinition {
  if (!PRICING_CODE_PATTERN.test(value.componentCode)) throw new TypeError("componentCode invalid");
  assertText(value.name, "component name", 200);
  assertMinor(value.amountMinor, "component amount");
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0)
    throw new TypeError("component sortOrder invalid");
  if (
    ["government_fee", "provider_fee", "filing_fee"].includes(value.componentType) &&
    (!value.source || !value.sourceVersion || !value.verificationStatus)
  )
    throw new TypeError("external fee source required");
  return deepFreeze(structuredClone(value));
}

function deposit(value: DepositPricingPolicy | null): DepositPricingPolicy | null {
  if (value === null) return null;
  assertText(value.id, "deposit id", 160);
  assertVersion(value.version, "deposit version");
  if (value.depositType === "fixed_amount")
    assertMinor(value.fixedAmountMinor, "deposit fixedAmountMinor");
  if (value.depositType === "minimum_amount")
    assertMinor(value.minimumAmountMinor, "deposit minimumAmountMinor");
  if (
    value.depositType === "percentage" &&
    (!Number.isInteger(value.percentageBasisPoints) ||
      Number(value.percentageBasisPoints) < 0 ||
      Number(value.percentageBasisPoints) > 10_000)
  )
    throw new TypeError("deposit percentageBasisPoints invalid");
  return deepFreeze(structuredClone(value));
}

export function createPricingProfile(value: PricingProfile): PricingProfile {
  if (!PRICING_CODE_PATTERN.test(value.profileCode)) throw new TypeError("profileCode invalid");
  if (value.currency !== "USD") throw new TypeError("pricing profile currency invalid");
  assertText(value.id, "pricing profile id", 160);
  assertText(value.pricingDefinitionId, "pricingDefinitionId", 160);
  assertVersion(value.version, "pricing profile version");
  const baseAmountMinor = assertMinor(value.baseAmountMinor, "baseAmountMinor", true);
  if (
    ["fixed", "starting_at", "unit_based", "tiered", "bundle_based"].includes(value.pricingModel) &&
    baseAmountMinor === null
  )
    throw new TypeError("baseAmountMinor required");
  if (
    ["pending_definition", "unknown", "quote_required"].includes(value.pricingModel) &&
    baseAmountMinor !== null
  )
    throw new TypeError("baseAmountMinor forbidden");
  if (value.pricingModel === "no_charge" && baseAmountMinor !== 0)
    throw new TypeError("no charge must be zero");
  if (value.minimumAmountMinor !== undefined && value.minimumAmountMinor !== null)
    assertMinor(value.minimumAmountMinor, "minimumAmountMinor");
  if (value.maximumAmountMinor !== undefined && value.maximumAmountMinor !== null)
    assertMinor(value.maximumAmountMinor, "maximumAmountMinor");
  if (
    value.minimumAmountMinor !== undefined &&
    value.minimumAmountMinor !== null &&
    value.maximumAmountMinor !== undefined &&
    value.maximumAmountMinor !== null &&
    value.minimumAmountMinor > value.maximumAmountMinor
  )
    throw new TypeError("price range invalid");
  const components = value.components.map(component);
  if (new Set(components.map((item) => item.componentCode)).size !== components.length)
    throw new TypeError("components duplicate");
  const from = assertIso(value.effectiveFrom, "pricing profile effectiveFrom");
  const to =
    value.effectiveTo === null ? null : assertIso(value.effectiveTo, "pricing profile effectiveTo");
  effectiveRange(from, to, "pricing profile effective range");
  return deepFreeze({
    ...structuredClone(value),
    baseAmountMinor,
    components,
    depositPolicy: deposit(value.depositPolicy),
  });
}

export function createPriceBookEntry(value: PriceBookEntry): PriceBookEntry {
  assertText(value.id, "priceBook entry id", 160);
  assertText(value.priceBookId, "priceBookId", 160);
  assertText(value.serviceDefinitionId, "serviceDefinitionId", 160);
  assertText(value.serviceVersionId, "serviceVersionId", 160);
  assertText(value.pricingProfileId, "pricingProfileId", 160);
  assertVersion(value.pricingProfileVersion, "pricingProfileVersion");
  if (value.currency !== "USD") throw new TypeError("priceBookEntry currency invalid");
  const from = assertIso(value.effectiveFrom, "priceBook entry effectiveFrom");
  const to =
    value.effectiveTo === null ? null : assertIso(value.effectiveTo, "priceBook entry effectiveTo");
  effectiveRange(from, to, "priceBook entry effective range");
  return deepFreeze(structuredClone(value));
}

export function createPricingRule(value: PricingRule): PricingRule {
  if (!PRICING_CODE_PATTERN.test(value.ruleCode)) throw new TypeError("ruleCode invalid");
  assertVersion(value.version, "rule version");
  if (!Number.isInteger(value.priority) || value.priority < 0)
    throw new TypeError("rule priority invalid");
  if (value.amountMinor !== undefined) assertMinor(value.amountMinor, "rule amountMinor");
  if (
    value.percentageBasisPoints !== undefined &&
    (!Number.isInteger(value.percentageBasisPoints) ||
      value.percentageBasisPoints < -10_000 ||
      value.percentageBasisPoints > 10_000)
  )
    throw new TypeError("rule percentageBasisPoints invalid");
  const from = assertIso(value.effectiveFrom, "rule effectiveFrom");
  const to = value.effectiveTo === null ? null : assertIso(value.effectiveTo, "rule effectiveTo");
  effectiveRange(from, to, "rule effective range");
  return deepFreeze(structuredClone(value));
}

export function createPromotionDefinition(value: PromotionDefinition): PromotionDefinition {
  if (!PRICING_CODE_PATTERN.test(value.promotionCode)) throw new TypeError("promotionCode invalid");
  assertText(value.id, "promotion id", 160);
  assertText(value.name, "promotion name", 200);
  assertVersion(value.version, "promotion version");
  if (value.discount.discountType === "fixed")
    assertMinor(value.discount.amountMinor, "promotion discount amount");
  if (
    value.discount.discountType === "percentage" &&
    (!Number.isInteger(value.discount.percentageBasisPoints) ||
      Number(value.discount.percentageBasisPoints) < 0 ||
      Number(value.discount.percentageBasisPoints) > 10_000)
  )
    throw new TypeError("promotion percentageBasisPoints invalid");
  const from = assertIso(value.effectiveFrom, "promotion effectiveFrom");
  const to =
    value.effectiveTo === null ? null : assertIso(value.effectiveTo, "promotion effectiveTo");
  effectiveRange(from, to, "promotion effective range");
  return deepFreeze(structuredClone(value));
}

export function createPromotionCode(
  value: Omit<PromotionCode, "normalizedCode" | "codeHash"> & Readonly<{ code: string }>,
): PromotionCode {
  const normalizedCode = normalizePromotionCode(value.code);
  assertText(value.id, "promotion code id", 160);
  assertText(value.promotionId, "promotionId", 160);
  if (value.maximumUses !== null) assertVersion(value.maximumUses, "maximumUses");
  if (value.maximumUsesPerClient !== null)
    assertVersion(value.maximumUsesPerClient, "maximumUsesPerClient");
  const from = assertIso(value.effectiveFrom, "promotion code effectiveFrom");
  const to =
    value.effectiveTo === null ? null : assertIso(value.effectiveTo, "promotion code effectiveTo");
  effectiveRange(from, to, "promotion code effective range");
  return deepFreeze({
    id: value.id,
    normalizedCode,
    codeHash: hashPricingValue({ normalizedCode }),
    promotionId: value.promotionId,
    status: value.status,
    effectiveFrom: from,
    effectiveTo: to,
    maximumUses: value.maximumUses,
    maximumUsesPerClient: value.maximumUsesPerClient,
  });
}
