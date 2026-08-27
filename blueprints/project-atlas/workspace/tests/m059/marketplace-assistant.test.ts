import { describe, expect, it } from "vitest";

import {
  assessMarketplaceNeutrality,
  createMarketplaceCandidateSet,
  createMarketplaceAssistantRuntime,
  createMarketplaceReferralIntent,
  createMarketplaceSession,
  createMarketplaceSpecialistHandoff,
  M059_MARKETPLACE_ASSISTANT_FLAGS,
  registerMarketplaceListingReference,
} from "../../packages/marketplace-assistant/src/index.ts";

const publicSessionInput = {
  id: "marketplace-session-public-001",
  surface: "public" as const,
  identityAssurance: "anonymous" as const,
  purposeAuthorized: false,
  personalizationRequested: false,
  personalizationAuthorization: "not_provided" as const,
  serviceScopedContextRequested: false,
  serviceEntitled: false,
  rawSensitiveContextIncluded: false,
  locale: "en" as const,
  createdAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-27T21:00:00.000Z",
};

const personalizedSessionInput = {
  ...publicSessionInput,
  id: "marketplace-session-client-001",
  clientReference: "client-ref-001",
  surface: "authenticated_client" as const,
  identityAssurance: "step_up_verified" as const,
  purposeAuthorized: true,
  personalizationRequested: true,
  personalizationAuthorization: "valid" as const,
  serviceScopedContextRequested: true,
  serviceEntitled: true,
  clientContextReference: "marketplace-context-ref-001",
};

describe("M059 marketplace assistant controlled foundation", () => {
  it("keeps provider, recommendation, referral, application, commission, and AI flags disabled", () => {
    expect(
      Object.values(M059_MARKETPLACE_ASSISTANT_FLAGS).every((enabled) => !enabled),
    ).toBe(true);
  });

  it("allows generic public discovery but blocks public personalization and raw sensitive context", () => {
    expect(createMarketplaceSession(publicSessionInput)).toMatchObject({
      personalizationMode: "public_generic",
      providerAccess: "disabled",
      referralAccess: "disabled",
    });

    expect(() =>
      createMarketplaceSession({
        ...publicSessionInput,
        personalizationRequested: true,
      }),
    ).toThrow("Public marketplace sessions cannot use personalized client context");

    expect(() =>
      createMarketplaceSession({
        ...publicSessionInput,
        rawSensitiveContextIncluded: true,
      }),
    ).toThrow("Marketplace sessions cannot accept raw sensitive client context");
  });

  it("requires purpose, consent, and a scoped reference for personalized marketplace context", () => {
    expect(createMarketplaceSession(personalizedSessionInput)).toMatchObject({
      personalizationMode: "reference_only_authorized",
      recommendationExecutionAccess: "disabled",
      applicationAccess: "disabled",
    });

    expect(() =>
      createMarketplaceSession({
        ...personalizedSessionInput,
        personalizationAuthorization: "revoked",
      }),
    ).toThrow("Personalized marketplace access requires current authorization");

    expect(() =>
      createMarketplaceSession({
        ...personalizedSessionInput,
        serviceEntitled: false,
      }),
    ).toThrow("Service-scoped marketplace context requires an active service entitlement");
  });

  it("uses listing references only and does not accept client context or provider credentials", () => {
    const reference = registerMarketplaceListingReference({
      id: "listing-ref-001",
      sessionId: "marketplace-session-client-001",
      listingReference: "marketplace-listing-ref-001",
      sourceKind: "marketplace_listing_reference",
      observedAt: "2026-08-27T20:10:00.000Z",
      rawClientContextIncluded: false,
      providerCredentialIncluded: false,
    });

    expect(reference).toMatchObject({
      storageMode: "reference_only",
      rawClientContextStored: false,
      providerCredentialStored: false,
      providerLookupPerformed: false,
    });

    expect(() =>
      registerMarketplaceListingReference({
        ...reference,
        id: "listing-ref-credential",
        providerCredentialIncluded: true,
      }),
    ).toThrow("Raw client context and provider credentials");
  });

  it("prevents compensation from changing fit and blocks unlabeled sponsorship", () => {
    expect(() =>
      createMarketplaceCandidateSet({
        id: "candidate-set-compensation",
        sessionId: "marketplace-session-client-001",
        listingReferenceIds: ["listing-ref-001"],
        rankingEvidenceReferences: ["recommendation-ref-001"],
        sponsoredListingReferenceIds: [],
        sponsorshipDisclosureLabelsPresent: false,
        rawSensitiveContextIncluded: false,
        compensationInfluencedCoreFitScore: true,
        createdAt: "2026-08-27T20:20:00.000Z",
      }),
    ).toThrow("Partner compensation cannot influence");

    expect(() =>
      createMarketplaceCandidateSet({
        id: "candidate-set-unlabeled",
        sessionId: "marketplace-session-client-001",
        listingReferenceIds: ["listing-ref-001"],
        rankingEvidenceReferences: ["recommendation-ref-001"],
        sponsoredListingReferenceIds: ["listing-ref-001"],
        sponsorshipDisclosureLabelsPresent: false,
        rawSensitiveContextIncluded: false,
        compensationInfluencedCoreFitScore: false,
        createdAt: "2026-08-27T20:20:00.000Z",
      }),
    ).toThrow("Sponsored marketplace listings require visible disclosure labels");

    expect(
      createMarketplaceCandidateSet({
        id: "candidate-set-001",
        sessionId: "marketplace-session-client-001",
        listingReferenceIds: ["listing-ref-001"],
        rankingEvidenceReferences: ["recommendation-ref-001"],
        sponsoredListingReferenceIds: ["listing-ref-001"],
        sponsorshipDisclosureLabelsPresent: true,
        rawSensitiveContextIncluded: false,
        compensationInfluencedCoreFitScore: false,
        createdAt: "2026-08-27T20:20:00.000Z",
      }),
    ).toMatchObject({
      status: "candidate_only",
      recommendationIssued: false,
      eligibilityDetermined: false,
      providerApprovalInferred: false,
      compensationInfluencedCoreFitScore: false,
    });
  });

  it("requires neutrality review and keeps referral actions blocked", () => {
    expect(
      assessMarketplaceNeutrality({
        candidateSetId: "candidate-set-001",
        sponsoredListingReferenceIds: ["listing-ref-001"],
        sponsorshipDisclosureLabelsPresent: true,
        materiallyRelevantAlternativeCoveragePresent: false,
      }),
    ).toMatchObject({
      status: "blocked",
      recommendationPermitted: false,
    });

    expect(
      createMarketplaceReferralIntent({
        id: "referral-intent-001",
        sessionId: "marketplace-session-client-001",
        listingReferenceId: "listing-ref-001",
        providerReference: "provider-ref-001",
        disclosureAccepted: true,
        consentCurrent: true,
        specialistReviewRequired: false,
        createdAt: "2026-08-27T20:30:00.000Z",
      }),
    ).toMatchObject({
      status: "review_required",
      redirectGenerated: false,
      referralCreated: false,
      applicationStarted: false,
      providerStatusInferred: false,
    });
  });

  it("creates non-dispatching specialist handoffs and a disabled runtime", () => {
    expect(
      createMarketplaceSpecialistHandoff({
        id: "marketplace-handoff-001",
        sessionId: "marketplace-session-client-001",
        reason: "Provider terms and marketplace context need controlled specialist review.",
        createdAt: "2026-08-27T20:35:00.000Z",
      }),
    ).toMatchObject({
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createMarketplaceAssistantRuntime()).toMatchObject({
      status: "disabled",
      providerCallsEnabled: false,
      referralCreationEnabled: false,
      applicationSubmissionEnabled: false,
      aiExecutionEnabled: false,
    });
  });
});
