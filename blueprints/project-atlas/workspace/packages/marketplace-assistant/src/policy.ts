import type { MarketplaceIdentityAssurance, MarketplaceSessionInput } from "./contracts.ts";

export const M059_MARKETPLACE_ASSISTANT_FLAGS = {
  providerCallsEnabled: false,
  listingSynchronizationEnabled: false,
  availabilityLookupEnabled: false,
  recommendationExecutionEnabled: false,
  clientProfilingEnabled: false,
  personalizedRankingEnabled: false,
  referralCreationEnabled: false,
  redirectGenerationEnabled: false,
  applicationSubmissionEnabled: false,
  providerStatusReconciliationEnabled: false,
  commissionHandlingEnabled: false,
  accountingHandoffDispatchEnabled: false,
  aiExecutionEnabled: false,
} as const;

export const MARKETPLACE_ASSISTANT_CANONICAL_BOUNDARIES = [
  {
    module: "M037",
    responsibility: "Canonical marketplace listings, journeys, and client-safe marketplace state.",
  },
  {
    module: "M038",
    responsibility: "Recommendation infrastructure and scoring governance.",
  },
  {
    module: "M039-M041",
    responsibility: "CreditCardBroker integration, partners, and provider abstraction.",
  },
  {
    module: "M042-M046",
    responsibility: "SG service catalog, pricing, discounts, and promotions.",
  },
  {
    module: "M047",
    responsibility: "AI control-plane policy and agent governance.",
  },
  {
    module: "M053-M057",
    responsibility: "Specialist analysis and service-domain reasoning.",
  },
  {
    module: "M060",
    responsibility: "Compliance review and escalation.",
  },
  {
    module: "M063-M064",
    responsibility: "Source material, provenance, and freshness.",
  },
  {
    module: "M068",
    responsibility: "Workflow execution.",
  },
  {
    module: "M074-M075",
    responsibility: "Approval policy and human-in-the-loop records.",
  },
] as const;

export const MARKETPLACE_ASSISTANT_PROHIBITED_ACTIONS = [
  "read_or_store_raw_sensitive_client_context",
  "determine_eligibility_or_provider_approval",
  "use_compensation_to_change_client_fit",
  "hide_sponsorship_or_material_alternatives",
  "create_referral_or_redirect",
  "start_or_submit_provider_application",
  "infer_provider_status",
  "record_or_book_commission",
  "share_data_with_provider",
  "override_specialist_or_compliance_hold",
] as const;

const verifiedIdentityLevels = new Set<MarketplaceIdentityAssurance>([
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
]);

export function assertMarketplaceAccess(input: MarketplaceSessionInput): void {
  if (input.rawSensitiveContextIncluded) {
    throw new Error("Marketplace sessions cannot accept raw sensitive client context.");
  }

  if (input.surface === "public") {
    if (input.personalizationRequested || input.clientContextReference) {
      throw new Error("Public marketplace sessions cannot use personalized client context.");
    }
    if (input.serviceScopedContextRequested) {
      throw new Error("Public marketplace sessions cannot request service-scoped context.");
    }
    return;
  }

  if (!verifiedIdentityLevels.has(input.identityAssurance)) {
    throw new Error("Personalized marketplace access requires verified identity.");
  }
  if (!input.purposeAuthorized) {
    throw new Error("Personalized marketplace access requires an authorized purpose.");
  }
  if (input.personalizationRequested) {
    if (input.personalizationAuthorization !== "valid") {
      throw new Error("Personalized marketplace access requires current authorization.");
    }
    if (!input.clientContextReference) {
      throw new Error("Personalized marketplace access requires a scoped context reference.");
    }
  } else if (input.clientContextReference) {
    throw new Error("Marketplace context cannot be supplied when personalization is not requested.");
  }
  if (input.serviceScopedContextRequested && !input.serviceEntitled) {
    throw new Error("Service-scoped marketplace context requires an active service entitlement.");
  }
}

export function isMarketplaceAssistantRuntimeEnabled(): false {
  return false;
}
