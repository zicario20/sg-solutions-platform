import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const marketplaceAssistantConfigurations = pgTable(
  "marketplace_assistant_configurations",
  {
    id: uuid("id").primaryKey().notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull(),
    providerCallsEnabled: boolean("provider_calls_enabled").notNull().default(false),
    referralCreationEnabled: boolean("referral_creation_enabled").notNull().default(false),
    configuration: jsonb("configuration"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
);

export const marketplaceAssistantSessions = pgTable(
  "marketplace_assistant_sessions",
  {
    id: uuid("id").primaryKey().notNull(),
    publicReference: text("public_reference").notNull().unique(),
    clientReference: text("client_reference"),
    surface: text("surface").notNull(),
    identityAssurance: text("identity_assurance").notNull(),
    purposeAuthorized: boolean("purpose_authorized").notNull().default(false),
    personalizationRequested: boolean("personalization_requested").notNull().default(false),
    personalizationAuthorization: text("personalization_authorization").notNull(),
    serviceScopedContextRequested: boolean("service_scoped_context_requested")
      .notNull()
      .default(false),
    serviceEntitled: boolean("service_entitled").notNull().default(false),
    clientContextReference: text("client_context_reference"),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("marketplace_assistant_sessions_client_idx").on(table.clientReference),
    index("marketplace_assistant_sessions_surface_idx").on(table.surface),
  ],
);

export const marketplaceAssistantListingReferences = pgTable(
  "marketplace_assistant_listing_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    listingReference: text("listing_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    rawClientContextStored: boolean("raw_client_context_stored").notNull().default(false),
    providerCredentialStored: boolean("provider_credential_stored").notNull().default(false),
    providerLookupPerformed: boolean("provider_lookup_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("marketplace_assistant_listing_refs_session_idx").on(table.sessionId)],
);

export const marketplaceAssistantCandidateSets = pgTable(
  "marketplace_assistant_candidate_sets",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    listingReferenceIds: jsonb("listing_reference_ids").notNull(),
    rankingEvidenceReferences: jsonb("ranking_evidence_references").notNull(),
    sponsoredListingReferenceIds: jsonb("sponsored_listing_reference_ids").notNull(),
    sponsorshipDisclosureLabelsPresent: boolean("sponsorship_disclosure_labels_present")
      .notNull()
      .default(false),
    status: text("status").notNull().default("candidate_only"),
    recommendationIssued: boolean("recommendation_issued").notNull().default(false),
    eligibilityDetermined: boolean("eligibility_determined").notNull().default(false),
    providerApprovalInferred: boolean("provider_approval_inferred").notNull().default(false),
    compensationInfluencedCoreFitScore: boolean("compensation_influenced_core_fit_score")
      .notNull()
      .default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("marketplace_assistant_candidates_session_idx").on(table.sessionId)],
);

export const marketplaceAssistantNeutralityAssessments = pgTable(
  "marketplace_assistant_neutrality_assessments",
  {
    id: uuid("id").primaryKey().notNull(),
    candidateSetId: uuid("candidate_set_id").notNull(),
    status: text("status").notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    sponsoredPlacementPermitted: boolean("sponsored_placement_permitted")
      .notNull()
      .default(false),
    recommendationPermitted: boolean("recommendation_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("marketplace_assistant_neutrality_candidate_idx").on(table.candidateSetId)],
);

export const marketplaceAssistantReferralIntents = pgTable(
  "marketplace_assistant_referral_intents",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    listingReferenceId: uuid("listing_reference_id").notNull(),
    providerReference: text("provider_reference").notNull(),
    disclosureAccepted: boolean("disclosure_accepted").notNull().default(false),
    consentCurrent: boolean("consent_current").notNull().default(false),
    specialistReviewRequired: boolean("specialist_review_required").notNull().default(true),
    status: text("status").notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    redirectGenerated: boolean("redirect_generated").notNull().default(false),
    referralCreated: boolean("referral_created").notNull().default(false),
    applicationStarted: boolean("application_started").notNull().default(false),
    providerStatusInferred: boolean("provider_status_inferred").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("marketplace_assistant_referrals_session_idx").on(table.sessionId)],
);

export const marketplaceAssistantHandoffs = pgTable(
  "marketplace_assistant_handoffs",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    route: text("route").notNull(),
    reason: text("reason").notNull(),
    dispatchPermitted: boolean("dispatch_permitted").notNull().default(false),
    externalActionPermitted: boolean("external_action_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("marketplace_assistant_handoffs_session_idx").on(table.sessionId)],
);

export const marketplaceAssistantRuntimeExecutions = pgTable(
  "marketplace_assistant_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("marketplace_assistant_runtime_correlation_idx").on(table.correlationId)],
);

export const marketplaceAssistantAuditEvents = pgTable(
  "marketplace_assistant_audit_events",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    eventType: text("event_type").notNull(),
    actorReference: text("actor_reference").notNull(),
    correlationId: text("correlation_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("marketplace_assistant_audit_session_idx").on(table.sessionId),
    index("marketplace_assistant_audit_correlation_idx").on(table.correlationId),
  ],
);
