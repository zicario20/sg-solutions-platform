export const PRICING_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/u;
export const PRICING_CURRENCY_PATTERN = /^[A-Z]{3}$/u;

export type CurrencyCode = "USD";
export type PricingModel =
  | "fixed"
  | "starting_at"
  | "range"
  | "quote_required"
  | "no_charge"
  | "unit_based"
  | "tiered"
  | "usage_based_future"
  | "subscription_future"
  | "bundle_based"
  | "custom_review"
  | "unknown"
  | "pending_definition";
export type PricingStatus =
  | "draft"
  | "testing"
  | "review"
  | "approved"
  | "active"
  | "limited"
  | "scheduled"
  | "paused"
  | "deprecated"
  | "retired";
export type PricingDisplayMode =
  | "exact_price"
  | "starting_at"
  | "range"
  | "quote_required"
  | "contact_for_pricing"
  | "price_pending"
  | "not_public";
export type PricingCalculationStatus =
  | "authoritative"
  | "quote_required"
  | "pending_definition"
  | "unknown"
  | "blocked"
  | "manual_review_required";

export type PricingActor = Readonly<{
  actorType: "client" | "staff" | "system" | "service_account" | "ai";
  actorId: string;
  purpose: string;
}>;

export type CurrencyDefinition = Readonly<{
  currencyCode: CurrencyCode;
  minorUnitDigits: number;
  displaySymbol: string;
  displayName: string;
  roundingContext: "commercial" | "provider" | "tax_future";
  status: "active" | "disabled" | "review_required";
  source: string;
  lastVerifiedAt: string | null;
}>;

export type PricingDefinition = Readonly<{
  id: string;
  pricingCode: string;
  name: string;
  description: string;
  ownerDomain: string;
  pricingType: "service" | "bundle" | "consultation" | "internal";
  lifecycleStatus: "draft" | "under_review" | "approved" | "active" | "paused" | "retired";
  createdAt: string;
  updatedAt: string;
}>;

export type PriceComponentDefinition = Readonly<{
  componentCode: string;
  name: string;
  componentType:
    | "base_service"
    | "additional_unit"
    | "filing_fee"
    | "government_fee"
    | "provider_fee"
    | "expedite_fee"
    | "document_fee"
    | "consultation_fee"
    | "deposit"
    | "discount"
    | "promotion"
    | "credit"
    | "surcharge"
    | "tax_estimate_future"
    | "other";
  calculationMethod: "fixed" | "per_unit" | "percentage_future";
  amountMinor: number;
  required: boolean;
  clientVisible: boolean;
  discountEligible: boolean;
  source?: string;
  sourceVersion?: string;
  verificationStatus?: "verified" | "estimated" | "unknown";
  sortOrder: number;
}>;

export type DepositPricingPolicy = Readonly<{
  id: string;
  version: number;
  depositType:
    | "none"
    | "fixed_amount"
    | "percentage"
    | "minimum_amount"
    | "full_payment"
    | "custom"
    | "pending_definition";
  fixedAmountMinor?: number;
  percentageBasisPoints?: number;
  minimumAmountMinor?: number;
  basis: "base_subtotal" | "discounted_subtotal" | "specific_components" | "full_amount";
  dueStage: "on_acceptance" | "before_start" | "before_checkout" | "custom";
  status: "draft" | "approved" | "active" | "paused" | "retired";
}>;

export type PricingProfile = Readonly<{
  id: string;
  pricingDefinitionId: string;
  profileCode: string;
  version: number;
  pricingModel: PricingModel;
  currency: CurrencyCode;
  baseAmountMinor: number | null;
  minimumAmountMinor?: number | null;
  maximumAmountMinor?: number | null;
  internalCostMinor?: number | null;
  components: readonly PriceComponentDefinition[];
  depositPolicy: DepositPricingPolicy | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: PricingStatus;
}>;

export type PriceBook = Readonly<{
  id: string;
  priceBookCode: string;
  name: string;
  currency: CurrencyCode;
  marketContext: string;
  jurisdictionContext?: string | null;
  audienceContext?: string | null;
  channelContext?: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: PricingStatus;
  version: number;
}>;

export type PriceBookEntry = Readonly<{
  id: string;
  priceBookId: string;
  serviceDefinitionId: string;
  serviceVersionId: string;
  pricingProfileId: string;
  pricingProfileVersion: number;
  currency: CurrencyCode;
  displayMode: PricingDisplayMode;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: PricingStatus;
}>;

export type PricingRule = Readonly<{
  id: string;
  ruleCode: string;
  version: number;
  priority: number;
  actionType:
    | "set_base_amount"
    | "add_component"
    | "apply_fixed_adjustment"
    | "apply_percentage_adjustment"
    | "set_deposit"
    | "require_quote"
    | "set_display_mode"
    | "block_pricing"
    | "manual_review_required";
  conditions: Readonly<{
    jurisdictions?: readonly string[];
    channels?: readonly string[];
    audiences?: readonly string[];
  }>;
  amountMinor?: number;
  percentageBasisPoints?: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: PricingStatus;
}>;

export type PromotionDefinition = Readonly<{
  id: string;
  promotionCode: string;
  name: string;
  promotionType:
    | "seasonal"
    | "launch"
    | "limited_time"
    | "service_specific"
    | "bundle"
    | "referral"
    | "loyalty"
    | "reactivation"
    | "educational_campaign"
    | "partner_campaign"
    | "manual_invitation"
    | "other";
  discount: Readonly<{
    discountType: "fixed" | "percentage" | "component_waiver";
    amountMinor?: number;
    percentageBasisPoints?: number;
    scope: "entire_order" | "eligible_components" | "specific_component" | "bundle_only";
  }>;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: PricingStatus;
  version: number;
}>;

export type PromotionCode = Readonly<{
  id: string;
  normalizedCode: string;
  codeHash: string;
  promotionId: string;
  status: "draft" | "active" | "paused" | "expired" | "retired";
  effectiveFrom: string;
  effectiveTo: string | null;
  maximumUses: number | null;
  maximumUsesPerClient: number | null;
}>;

export type PromotionRedemption = Readonly<{
  id: string;
  promotionCodeId: string;
  operationId: string;
  clientId: string | null;
  organizationId: string | null;
  status: "reserved" | "applied" | "consumed" | "released" | "reversed" | "expired" | "rejected";
  reservedAt: string;
  expiresAt: string | null;
  consumedAt: string | null;
}>;

export type PricingCalculationRequest = Readonly<{
  id: string;
  tenantId: string;
  serviceDefinitionId: string;
  serviceVersionId: string;
  clientId?: string;
  organizationId?: string;
  quoteId?: string;
  channel: string;
  audience: string;
  jurisdiction: string;
  quantity: number;
  calculationDate: string;
  currencyPreference: CurrencyCode;
  correlationId: string;
  idempotencyKey: string;
  actor: PricingActor;
}>;

export type PricingLineItem = Readonly<{
  lineCode: string;
  componentCode: string;
  description: string;
  quantity: number;
  unitAmountMinor: number;
  lineAmountMinor: number;
  currency: CurrencyCode;
  clientVisible: boolean;
  sortOrder: number;
  sourceRuleId?: string;
}>;

export type PricingFinding = Readonly<{
  type:
    | "inactive_price_book"
    | "inactive_pricing_profile"
    | "profile_binding_mismatch"
    | "pricing_not_effective"
    | "promotion_not_eligible"
    | "discount_exceeds_floor"
    | "rule_blocked"
    | "manual_review_required";
  severity: "information" | "warning" | "blocking";
  message: string;
}>;

export type PricingCalculationResult = Readonly<{
  id: string;
  requestId: string;
  status: PricingCalculationStatus;
  pricingDefinitionId: string;
  pricingProfileId: string;
  pricingProfileVersion: number;
  priceBookId: string;
  priceBookVersion: number;
  serviceDefinitionId: string;
  serviceVersionId: string;
  currency: CurrencyCode;
  displayMode: PricingDisplayMode;
  lineItems: readonly PricingLineItem[];
  baseAmountMinor: number | null;
  discountTotalMinor: number;
  promotionTotalMinor: number;
  depositAmountMinor: number | null;
  amountDueNowMinor: number | null;
  remainingAmountMinor: number | null;
  totalAmountMinor: number | null;
  ruleVersions: readonly string[];
  findings: readonly PricingFinding[];
  warnings: readonly string[];
  createdAt: string;
}>;

export type CommercialPricingSnapshot = Readonly<{
  id: string;
  serviceDefinitionId: string;
  serviceVersionId: string;
  pricingDefinitionId: string;
  pricingProfileId: string;
  pricingProfileVersion: number;
  priceBookId: string;
  priceBookVersion: number;
  currency: CurrencyCode;
  displayMode: PricingDisplayMode;
  lineItems: readonly PricingLineItem[];
  totalAmountMinor: number;
  discountTotalMinor: number;
  promotionTotalMinor: number;
  depositAmountMinor: number;
  amountDueNowMinor: number;
  remainingAmountMinor: number;
  ruleVersions: readonly string[];
  acceptedAt: string;
  createdAt: string;
  contentHash: string;
}>;

export type PricingCalculationInput = Readonly<{
  request: PricingCalculationRequest;
  pricingDefinition: PricingDefinition;
  priceBook: PriceBook;
  priceBookEntry: PriceBookEntry;
  pricingProfile: PricingProfile;
  pricingRules?: readonly PricingRule[];
  promotions: readonly PromotionDefinition[];
  promotionCode?: string;
  minimumClientPriceMinor?: number | null;
}>;

export type M043PricingSnapshotReference = Readonly<{
  sourceModule: "m046";
  quoteId: string;
  pricingVersion: string;
  currency: "USD";
  totalAmountMinor: number;
  depositAmountMinor: number;
  balanceAmountMinor: number;
  checksum: string;
  calculatedAt: string;
}>;

export type ServiceQuote = Readonly<{
  id: string;
  quoteNumber: string;
  clientId: string | null;
  organizationId: string | null;
  serviceDefinitionId: string;
  serviceVersionId: string;
  status:
    | "draft"
    | "presented"
    | "accepted"
    | "declined"
    | "expired"
    | "cancelled"
    | "superseded"
    | "converted_to_order";
  createdAt: string;
}>;

export type ServiceQuoteVersion = Readonly<{
  id: string;
  quoteId: string;
  version: number;
  snapshot: CommercialPricingSnapshot;
  validFrom: string;
  expiresAt: string;
  termsReferences: readonly string[];
  disclosureReferences: readonly string[];
  status: "draft" | "presented" | "accepted" | "declined" | "expired" | "superseded";
  createdAt: string;
  acceptedBy?: string;
  acceptedAt?: string;
  acceptanceMethod?: "client_portal" | "staff_assisted" | "secure_link";
  paymentState?: "not_paid";
  workflowState?: "not_started";
}>;

export type PaymentSchedulePolicy = Readonly<{
  id: string;
  version: number;
  scheduleType:
    | "one_time"
    | "deposit_then_balance"
    | "installment_schedule"
    | "milestone_based"
    | "custom_approved";
  installmentCount: number;
  allocationMethod:
    | "equal"
    | "percentage_schedule"
    | "fixed_then_balance"
    | "deposit_then_equal"
    | "milestone_based"
    | "custom_approved";
  dueDateRule:
    | "on_acceptance"
    | "relative_to_order_date"
    | "relative_to_service_stage"
    | "fixed_calendar_date"
    | "business_days_after_event"
    | "custom";
  status: "draft" | "approved" | "active" | "paused" | "retired";
}>;

export type InstallmentSchedule = Readonly<{
  policyId: string;
  policyVersion: number;
  currency: CurrencyCode;
  totalAmountMinor: number;
  installments: readonly Readonly<{
    installmentNumber: number;
    amountMinor: number;
    dueRule: PaymentSchedulePolicy["dueDateRule"];
  }>[];
}>;

export type PricingRuntimeControls = Readonly<{
  pricingEnabled: false;
  m043CheckoutHandoffEnabled: false;
  quoteOrderConversionEnabled: false;
  automaticPromotionRedemptionEnabled: false;
  automationEnabled: false;
  aiAssistanceEnabled: false;
  refundExecutionEnabled: false;
}>;

export type LegacyCatalogPriceSnapshot = Readonly<{
  version: string;
  currency: "USD";
  serviceFeeMinor: number;
  externalFeesMinor: number;
  addons: readonly Readonly<{ code: string; amountMinor: number; requiresServiceCode: string }>[];
  promotion?: Readonly<{ code: string; percentageBasisPoints: number; stackable: boolean }>;
}>;
