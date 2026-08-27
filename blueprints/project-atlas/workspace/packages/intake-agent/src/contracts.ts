import type { ReceptionHandoffPackage } from "@atlas/reception-agent";

export type IntakeSurface =
  | "public_pre_intake"
  | "client_portal"
  | "admin_assisted"
  | "agent_assisted"
  | "voice_assisted_future"
  | "partner_assisted_future"
  | "backend_event";

export type IntakeMode =
  | "public_pre_intake"
  | "client_self_service"
  | "staff_assisted"
  | "agent_assisted"
  | "hybrid"
  | "partner_assisted_future"
  | "none";

export type IntakeDataClassification =
  | "public"
  | "internal"
  | "personal"
  | "sensitive"
  | "highly_sensitive"
  | "restricted"
  | "prohibited";

export type IntakeIdentityAssurance =
  | "anonymous"
  | "contact_provided_unverified"
  | "contact_channel_verified"
  | "authenticated_account"
  | "step_up_verified"
  | "staff_verified"
  | "authorized_representative_verified"
  | "unknown";

export type IntakeLifecycleStatus =
  | "draft"
  | "design"
  | "testing"
  | "review"
  | "approved"
  | "active"
  | "limited"
  | "paused"
  | "deprecated"
  | "retired"
  | "archived";

export type IntakePublicationStatus =
  | "not_published"
  | "scheduled"
  | "published"
  | "unpublished"
  | "expired";

export type IntakeSessionStatus =
  | "created"
  | "not_started"
  | "in_progress"
  | "waiting_for_participant"
  | "waiting_for_documents"
  | "clarification_required"
  | "review_required"
  | "ready_for_submission_review"
  | "completed"
  | "completed_with_conditions"
  | "submitted_for_review"
  | "reopened"
  | "cancelled"
  | "abandoned"
  | "expired"
  | "superseded"
  | "blocked";

export type IntakeParticipantRole =
  | "primary_client"
  | "co_client"
  | "spouse_or_household_member"
  | "dependent"
  | "business"
  | "business_owner"
  | "member_or_shareholder"
  | "responsible_party"
  | "authorized_representative"
  | "property_or_transaction_subject"
  | "guarantor_future"
  | "other";

export type IntakeFieldDataType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "date"
  | "date_time"
  | "integer"
  | "decimal_as_string"
  | "money"
  | "percentage"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "address"
  | "person_reference"
  | "organization_reference"
  | "document_reference"
  | "consent_reference"
  | "signature_reference"
  | "identifier_masked"
  | "structured_object"
  | "repeating_group"
  | "calculated_display_only"
  | "other";

export type IntakeAnswerStatus =
  | "unanswered"
  | "answered"
  | "answered_incomplete"
  | "not_applicable"
  | "unknown"
  | "declined_optional"
  | "needs_clarification"
  | "needs_document_support"
  | "under_review"
  | "verified_by_authorized_source"
  | "rejected"
  | "superseded";

export type IntakeVerificationStatus =
  | "user_asserted"
  | "staff_entered_on_behalf"
  | "document_extracted_unconfirmed"
  | "document_supported"
  | "provider_supported"
  | "specialist_reviewed"
  | "authoritative_verified"
  | "conflicting"
  | "rejected"
  | "unknown";

export type IntakeSourceType =
  | "user_entered"
  | "staff_entered_on_behalf"
  | "document_extracted"
  | "provider_imported"
  | "system_derived"
  | "specialist_verified"
  | "migration_imported";

export type IntakeEnteredByType = "participant" | "staff" | "agent" | "system" | "migration";

export type IntakeRequiredness =
  | "required"
  | "conditional"
  | "recommended"
  | "optional"
  | "prohibited_on_surface"
  | "not_applicable";

export type IntakeFieldVisibility =
  | "public"
  | "client"
  | "participant_only"
  | "authorized_representative"
  | "staff"
  | "specialist"
  | "compliance"
  | "system_only"
  | "hidden_calculated";

export type IntakeCompletionStatus =
  | "not_started"
  | "in_progress"
  | "incomplete"
  | "complete"
  | "complete_with_conditions"
  | "review_required"
  | "blocked"
  | "not_applicable"
  | "unknown";

export type IntakeReadinessDestination =
  | "lead_follow_up"
  | "client_onboarding"
  | "service_order_creation_review"
  | "case_file_creation"
  | "specialist_review"
  | "document_processing"
  | "compliance_review"
  | "workflow_start_review"
  | "external_submission_review"
  | "human_review"
  | "other";

export type IntakeReadinessStatus =
  | "not_ready"
  | "ready"
  | "ready_with_conditions"
  | "client_action_required"
  | "participant_action_required"
  | "specialist_review_required"
  | "compliance_review_required"
  | "manual_review_required"
  | "blocked"
  | "unknown";

export type IntakeSpecialistTarget =
  | "credit_specialist"
  | "tax_specialist"
  | "business_formation_specialist"
  | "business_funding_specialist"
  | "home_buying_specialist"
  | "document_specialist"
  | "compliance_reviewer"
  | "human_specialist";

export interface IntakeAgentConfiguration {
  readonly id: string;
  readonly agentDefinitionReference: string;
  readonly agentVersionReference: string;
  readonly intakeRegistryVersion: string;
  readonly serviceBindingPolicyReference: string;
  readonly identityBoundaryPolicyReference: string;
  readonly dataCollectionPolicyReference: string;
  readonly validationPolicySetReference: string;
  readonly documentRequestPolicyReference: string;
  readonly consentPolicyReference: string;
  readonly handoffPolicyReference: string;
  readonly status: "disabled" | "testing" | "approved" | "active";
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
}

export interface IntakeDefinition {
  readonly id: string;
  readonly intakeCode: string;
  readonly name: string;
  readonly description: string;
  readonly ownerDomain: string;
  readonly intakeType: string;
  readonly primarySubjectType: string;
  readonly currentVersionReference?: string;
  readonly lifecycleStatus: IntakeLifecycleStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IntakeVersion {
  readonly id: string;
  readonly intakeDefinitionId: string;
  readonly version: string;
  readonly purposeStatement: string;
  readonly stepDefinitionReferences: readonly string[];
  readonly fieldDefinitionReferences: readonly string[];
  readonly participantRuleReferences: readonly string[];
  readonly validationRuleSetReference: string;
  readonly documentRequirementBindingReference?: string;
  readonly consentRequirementBindingReference?: string;
  readonly completionPolicyReference: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly publicationStatus: IntakePublicationStatus;
  readonly immutable: boolean;
  readonly createdAt: string;
}

export interface IntakeFieldDefinition {
  readonly fieldCode: string;
  readonly label: Readonly<Record<"en-US" | "es-US", string>>;
  readonly dataType: IntakeFieldDataType;
  readonly requiredness: IntakeRequiredness;
  readonly participantScope: readonly IntakeParticipantRole[];
  readonly dataClassification: IntakeDataClassification;
  readonly visibility: IntakeFieldVisibility;
  readonly sourcePolicy: readonly IntakeSourceType[];
  readonly validationRuleReferences: readonly string[];
  readonly sensitivityGateReference?: string;
}

export interface IntakeSession {
  readonly id: string;
  readonly workspaceReference?: string;
  readonly intakeDefinitionReference: string;
  readonly intakeVersionReference?: string;
  readonly serviceDefinitionReference?: string;
  readonly serviceVersionReference?: string;
  readonly serviceOrderReference?: string;
  readonly caseFileReference?: string;
  readonly leadReference?: string;
  readonly clientReference?: string;
  readonly organizationReference?: string;
  readonly surface: IntakeSurface;
  readonly mode: IntakeMode;
  readonly locale: "en" | "es";
  readonly status: IntakeSessionStatus;
  readonly openedAt: string;
  readonly lastActivityAt: string;
  readonly expiresAt?: string;
  readonly highlySensitiveCollectionPermitted: false;
  readonly sourceHandoffReference?: string;
}

export interface IntakeAnswerRecord {
  readonly id: string;
  readonly intakeSessionId: string;
  readonly participantId: string;
  readonly fieldCode: string;
  readonly fieldVersion: string;
  readonly answerValueReference: string;
  readonly answerStatus: IntakeAnswerStatus;
  readonly verificationStatus: IntakeVerificationStatus;
  readonly sourceType: IntakeSourceType;
  readonly sourceReference?: string;
  readonly enteredByType: IntakeEnteredByType;
  readonly enteredByReference?: string;
  readonly dataClassification: IntakeDataClassification;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly supersedesAnswerReference?: string;
}

export interface IntakeCollectionGateInput {
  readonly surface: IntakeSurface;
  readonly dataClassification: IntakeDataClassification;
  readonly identityAssurance: IntakeIdentityAssurance;
  readonly purposeAuthorized: boolean;
  readonly participantAuthorized: boolean;
}

export interface IntakeCollectionGateResult {
  readonly allowed: boolean;
  readonly reasonCode:
    | "allowed"
    | "prohibited_data_class"
    | "purpose_not_authorized"
    | "participant_not_authorized"
    | "sensitive_data_requires_authenticated_surface"
    | "identity_assurance_insufficient"
    | "partner_assisted_intake_not_enabled";
  readonly requiresSecureStorage: boolean;
}

export interface IntakeRuleDependency {
  readonly source: string;
  readonly target: string;
}

export interface IntakeRuleCycleResult {
  readonly hasCycle: boolean;
  readonly cycle: readonly string[];
}

export interface IntakeRequiredItem {
  readonly id: string;
  readonly type: "field" | "step" | "participant" | "document" | "consent" | "signature";
  readonly status: "satisfied" | "missing" | "blocked" | "warning" | "not_applicable";
}

export interface IntakeCompletionAssessment {
  readonly status: IntakeCompletionStatus;
  readonly missingItemIds: readonly string[];
  readonly blockingItemIds: readonly string[];
  readonly warningItemIds: readonly string[];
  readonly completedRequiredCount: number;
  readonly totalRequiredCount: number;
  readonly assessmentScope: "intake_only";
  readonly serviceStartPermitted: false;
}

export interface IntakeReadinessAssessment {
  readonly destination: IntakeReadinessDestination;
  readonly status: IntakeReadinessStatus;
  readonly blockingReasons: readonly string[];
  readonly assessmentScope: "destination_readiness_only";
  readonly workflowMutationPermitted: false;
  readonly externalSubmissionPermitted: false;
}

export interface IntakeSpecialistHandoff {
  readonly id: string;
  readonly intakeSessionId: string;
  readonly target: IntakeSpecialistTarget;
  readonly locale: "en" | "es";
  readonly participantReferences: readonly string[];
  readonly allowedDataReferences: readonly string[];
  readonly documentReferences: readonly string[];
  readonly consentReferences: readonly string[];
  readonly readinessSnapshotReference: string;
  readonly openUnknowns: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly status: "prepared";
  readonly dispatchPermitted: false;
  readonly executionPermitted: false;
  readonly createdAt: string;
}

export interface IntakeRuntimeResult {
  readonly status: "disabled";
  readonly executionPermitted: false;
  readonly writesPerformed: false;
  readonly dispatchPerformed: false;
  readonly providerCallsPerformed: false;
  readonly requestedAction: string;
  readonly nextSafeAction: "request_authorized_runtime_activation";
}

export interface IntakeRuntime {
  readonly prepareSubmission: (input: {
    readonly intakeSessionReference: string;
    readonly requestedAction: string;
  }) => IntakeRuntimeResult;
}

export interface ReceptionIntakeSessionInput {
  readonly id: string;
  readonly intakeDefinitionReference: string;
  readonly locale: "en" | "es";
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly receptionHandoff: ReceptionHandoffPackage;
}
