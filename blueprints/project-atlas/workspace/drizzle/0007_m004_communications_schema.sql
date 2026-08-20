CREATE TABLE "communication_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"sequence" bigint NOT NULL,
	"conversation_id" text NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"event_name" varchar(64) NOT NULL,
	"aggregate_type" varchar(24) NOT NULL,
	"aggregate_id" text NOT NULL,
	"result_code" varchar(32) NOT NULL,
	"reason_code" varchar(48),
	"version" integer NOT NULL,
	"locale" varchar(2),
	"purpose" varchar(24),
	"policy_version" integer,
	"correlation_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_audit_events_conversation_sequence_unique" UNIQUE("conversation_id","sequence"),
	CONSTRAINT "communication_audit_events_channel_valid" CHECK ("communication_audit_events"."channel_kind" in ('public_web', 'whatsapp')),
	CONSTRAINT "communication_audit_events_sequence_positive" CHECK ("communication_audit_events"."sequence" > 0),
	CONSTRAINT "communication_audit_events_locale_valid" CHECK ("communication_audit_events"."locale" is null or "communication_audit_events"."locale" in ('es', 'en')),
	CONSTRAINT "communication_audit_events_purpose_valid" CHECK ("communication_audit_events"."purpose" is null or "communication_audit_events"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
	CONSTRAINT "communication_audit_events_aggregate_valid" CHECK ("communication_audit_events"."aggregate_type" in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')),
	CONSTRAINT "communication_audit_events_result_valid" CHECK ("communication_audit_events"."result_code" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')),
	CONSTRAINT "communication_audit_events_version_positive" CHECK ("communication_audit_events"."version" > 0),
	CONSTRAINT "communication_audit_events_policy_version_positive" CHECK ("communication_audit_events"."policy_version" is null or "communication_audit_events"."policy_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "communication_audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_channel_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"adapter_key" varchar(32) NOT NULL,
	"readiness_state" varchar(32) NOT NULL,
	"policy_version" varchar(80) NOT NULL,
	"version" integer NOT NULL,
	"configured_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_channel_connections_id_channel_unique" UNIQUE("id","channel_kind"),
	CONSTRAINT "communication_channel_connections_channel_valid" CHECK ("communication_channel_connections"."channel_kind" = 'whatsapp'),
	CONSTRAINT "communication_channel_connections_adapter_valid" CHECK ("communication_channel_connections"."adapter_key" = 'meta_cloud'),
	CONSTRAINT "communication_channel_connections_readiness_valid" CHECK ("communication_channel_connections"."readiness_state" in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')),
	CONSTRAINT "communication_channel_connections_version_positive" CHECK ("communication_channel_connections"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "communication_channel_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_contact_bindings" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"endpoint_digest" char(64) NOT NULL,
	"endpoint_digest_key_version" varchar(80) NOT NULL,
	"trust_state" varchar(32) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"contact_policy_version" integer NOT NULL,
	"version" integer NOT NULL,
	"verification_receipt_id" text,
	"endpoint_verified_at" timestamp with time zone,
	"verification_expires_at" timestamp with time zone,
	"wrong_person_reported_at" timestamp with time zone,
	"reassignment_risk_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_contact_bindings_id_connection_channel_unique" UNIQUE("id","connection_id","channel_kind"),
	CONSTRAINT "communication_contact_bindings_id_channel_unique" UNIQUE("id","channel_kind"),
	CONSTRAINT "communication_contact_bindings_endpoint_unique" UNIQUE("connection_id","endpoint_digest_key_version","endpoint_digest"),
	CONSTRAINT "communication_contact_bindings_channel_valid" CHECK ("communication_contact_bindings"."channel_kind" = 'whatsapp'),
	CONSTRAINT "communication_contact_bindings_trust_valid" CHECK ("communication_contact_bindings"."trust_state" in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')),
	CONSTRAINT "communication_contact_bindings_locale_valid" CHECK ("communication_contact_bindings"."locale" in ('es', 'en')),
	CONSTRAINT "communication_contact_bindings_endpoint_digest_valid" CHECK ("communication_contact_bindings"."endpoint_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_contact_bindings_policy_version_positive" CHECK ("communication_contact_bindings"."contact_policy_version" > 0),
	CONSTRAINT "communication_contact_bindings_version_positive" CHECK ("communication_contact_bindings"."version" > 0),
	CONSTRAINT "communication_contact_bindings_verification_window_valid" CHECK ("communication_contact_bindings"."verification_expires_at" is null or ("communication_contact_bindings"."endpoint_verified_at" is not null and "communication_contact_bindings"."verification_expires_at" > "communication_contact_bindings"."endpoint_verified_at"))
);
--> statement-breakpoint
ALTER TABLE "communication_contact_bindings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_contact_evidence_events" (
	"id" text PRIMARY KEY NOT NULL,
	"binding_id" text NOT NULL,
	"sequence" bigint NOT NULL,
	"event_kind" varchar(40) NOT NULL,
	"purpose" varchar(24),
	"consent_state" varchar(24),
	"fence_state" varchar(24),
	"binding_trust_state" varchar(32),
	"review_resolution" varchar(16),
	"evidence_receipt_id" text NOT NULL,
	"receipt_kind" varchar(40) NOT NULL,
	"owning_domain" varchar(80) NOT NULL,
	"authority_role" varchar(32) NOT NULL,
	"authority_version" integer,
	"triggering_event_id" text,
	"policy_version" varchar(80),
	"correlation_id" text NOT NULL,
	"receipt_issued_at" timestamp with time zone,
	"receipt_valid_until" timestamp with time zone,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_contact_evidence_events_binding_sequence_unique" UNIQUE("binding_id","sequence"),
	CONSTRAINT "communication_contact_evidence_events_receipt_unique" UNIQUE("evidence_receipt_id"),
	CONSTRAINT "communication_contact_evidence_events_kind_valid" CHECK ("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')),
	CONSTRAINT "communication_contact_evidence_events_authority_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'contact_review') or ("communication_contact_evidence_events"."event_kind" in ('binding_suspended', 'binding_revalidated') and "communication_contact_evidence_events"."authority_role" = 'binding_verification')),
	CONSTRAINT "communication_contact_evidence_events_receipt_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_regranted') and "communication_contact_evidence_events"."receipt_kind" = 'consent_evidence') or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."receipt_kind" = 'contact_withdrawal') or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."receipt_kind" = 'ambiguous_opt_out_detection') or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."receipt_kind" = 'ambiguous_opt_out_resolution') or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."receipt_kind" = 'binding_suspension') or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."receipt_kind" = 'binding_revalidation')),
	CONSTRAINT "communication_contact_evidence_events_state_shape_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_granted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_regranted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'opt_out_pending' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_cleared' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'clear' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'withdraw' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'suspended' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'reverified' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null)),
	CONSTRAINT "communication_contact_evidence_events_sequence_positive" CHECK ("communication_contact_evidence_events"."sequence" > 0),
	CONSTRAINT "communication_contact_evidence_events_receipt_window_valid" CHECK (("communication_contact_evidence_events"."receipt_issued_at" is null and "communication_contact_evidence_events"."receipt_valid_until" is null) or ("communication_contact_evidence_events"."receipt_issued_at" is not null and "communication_contact_evidence_events"."receipt_valid_until" is not null and "communication_contact_evidence_events"."receipt_valid_until" > "communication_contact_evidence_events"."receipt_issued_at"))
);
--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_contact_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"binding_id" text NOT NULL,
	"purpose" varchar(24) NOT NULL,
	"consent_state" varchar(24) NOT NULL,
	"fence_state" varchar(24) NOT NULL,
	"decision_code" varchar(32),
	"evidence_receipt_id" text,
	"version" integer NOT NULL,
	"evaluated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_contact_policies_binding_purpose_unique" UNIQUE("binding_id","purpose"),
	CONSTRAINT "communication_contact_policies_purpose_valid" CHECK ("communication_contact_policies"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
	CONSTRAINT "communication_contact_policies_consent_valid" CHECK ("communication_contact_policies"."consent_state" in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')),
	CONSTRAINT "communication_contact_policies_fence_valid" CHECK ("communication_contact_policies"."fence_state" in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')),
	CONSTRAINT "communication_contact_policies_decision_valid" CHECK ("communication_contact_policies"."decision_code" is null or "communication_contact_policies"."decision_code" in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')),
	CONSTRAINT "communication_contact_policies_version_positive" CHECK ("communication_contact_policies"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "communication_contact_policies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"status" varchar(32) NOT NULL,
	"version" integer NOT NULL,
	"correlation_id" text NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"reconciliation_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_conversations_id_channel_unique" UNIQUE("id","channel_kind"),
	CONSTRAINT "communication_conversations_channel_valid" CHECK ("communication_conversations"."channel_kind" in ('public_web', 'whatsapp')),
	CONSTRAINT "communication_conversations_locale_valid" CHECK ("communication_conversations"."locale" in ('es', 'en')),
	CONSTRAINT "communication_conversations_status_valid" CHECK ("communication_conversations"."status" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')),
	CONSTRAINT "communication_conversations_version_positive" CHECK ("communication_conversations"."version" > 0),
	CONSTRAINT "communication_conversations_expiry_valid" CHECK ("communication_conversations"."expires_at" is null or "communication_conversations"."expires_at" > "communication_conversations"."created_at"),
	CONSTRAINT "communication_conversations_public_expiry_required" CHECK ("communication_conversations"."channel_kind" <> 'public_web' or "communication_conversations"."expires_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "communication_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_dispatch_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"command_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"attempt_ordinal" integer NOT NULL,
	"request_idempotency" boolean NOT NULL,
	"stable_reference_capability" boolean NOT NULL,
	"message_lookup_capability" boolean NOT NULL,
	"status_reconciliation_capability" boolean NOT NULL,
	"media_references_capability" boolean NOT NULL,
	"template_projection_capability" boolean NOT NULL,
	"capability_observed_at" timestamp with time zone NOT NULL,
	"expected_policy_version" integer NOT NULL,
	"request_digest" char(64) NOT NULL,
	"stable_reference" text,
	"external_message_reference" text,
	"state" varchar(32) NOT NULL,
	"result_code" varchar(32),
	"provider_io_capability_hash" char(64),
	"provider_io_started_at" timestamp with time zone,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_dispatch_attempts_command_ordinal_unique" UNIQUE("command_id","attempt_ordinal"),
	CONSTRAINT "communication_dispatch_attempts_external_reference_unique" UNIQUE("connection_id","external_message_reference"),
	CONSTRAINT "communication_dispatch_attempts_ordinal_positive" CHECK ("communication_dispatch_attempts"."attempt_ordinal" > 0),
	CONSTRAINT "communication_dispatch_attempts_request_digest_valid" CHECK ("communication_dispatch_attempts"."request_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_dispatch_attempts_policy_version_positive" CHECK ("communication_dispatch_attempts"."expected_policy_version" > 0),
	CONSTRAINT "communication_dispatch_attempts_state_valid" CHECK ("communication_dispatch_attempts"."state" in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')),
	CONSTRAINT "communication_dispatch_attempts_result_valid" CHECK ("communication_dispatch_attempts"."result_code" is null or "communication_dispatch_attempts"."result_code" in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')),
	CONSTRAINT "communication_dispatch_attempts_completion_valid" CHECK ("communication_dispatch_attempts"."completed_at" is null or "communication_dispatch_attempts"."completed_at" >= "communication_dispatch_attempts"."started_at"),
	CONSTRAINT "communication_dispatch_attempts_provider_io_capability_valid" CHECK (("communication_dispatch_attempts"."provider_io_capability_hash" is null and "communication_dispatch_attempts"."provider_io_started_at" is null) or ("communication_dispatch_attempts"."provider_io_capability_hash" ~ '^[0-9a-f]{64}$' and "communication_dispatch_attempts"."provider_io_started_at" is not null and "communication_dispatch_attempts"."provider_io_started_at" >= "communication_dispatch_attempts"."started_at"))
);
--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_event_envelopes" (
	"id" text PRIMARY KEY NOT NULL,
	"receipt_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"channel_kind" varchar(16) DEFAULT 'whatsapp' NOT NULL,
	"event_kind" varchar(32) NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"conversation_id" text,
	"participant_id" text,
	"binding_id" text,
	"message_id" text,
	"message_reference" text,
	"external_message_reference" text,
	"canonical_text" text,
	"delivery_state" varchar(24),
	"interactive_kind" varchar(16),
	"interactive_id" varchar(240),
	"interactive_title" varchar(240),
	"media_external_reference" text,
	"media_declared_kind" varchar(16),
	"media_mime_type" varchar(160),
	"media_checksum" char(64),
	"template_id" text,
	"template_authority_state" varchar(32),
	"template_authority_version" integer,
	"template_authority_updated_at" timestamp with time zone,
	"template_provider_reference" text,
	"template_key" varchar(120),
	"template_locale" varchar(2),
	"template_category" varchar(24),
	"template_provider_state" varchar(32),
	"template_provider_version" varchar(80),
	"template_provider_timestamp" timestamp with time zone,
	"template_components" jsonb,
	"unsupported_reason" varchar(48),
	"body_retention_policy" varchar(24) DEFAULT 'metadata_only' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_event_envelopes_receipt_id_unique" UNIQUE("receipt_id"),
	CONSTRAINT "communication_event_envelopes_kind_valid" CHECK ("communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')),
	CONSTRAINT "communication_event_envelopes_channel_valid" CHECK ("communication_event_envelopes"."channel_kind" = 'whatsapp'),
	CONSTRAINT "communication_event_envelopes_retention_valid" CHECK (("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null) or ("communication_event_envelopes"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_event_envelopes"."canonical_text" is not null)),
	CONSTRAINT "communication_event_envelopes_typed_shape_valid" CHECK (("communication_event_envelopes"."event_kind" = 'text_message' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and (("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null) or ("communication_event_envelopes"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_event_envelopes"."canonical_text" is not null)) and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'interactive_reply' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."interactive_kind" is not null and "communication_event_envelopes"."interactive_kind" in ('button', 'list') and "communication_event_envelopes"."interactive_id" is not null and "communication_event_envelopes"."interactive_title" is not null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'message_status' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is not null and "communication_event_envelopes"."delivery_state" is not null and "communication_event_envelopes"."delivery_state" in ('sent', 'delivered', 'read', 'failed') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'media_reference' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."media_external_reference" is not null and "communication_event_envelopes"."media_declared_kind" is not null and "communication_event_envelopes"."media_declared_kind" in ('image', 'document', 'audio', 'sticker', 'video') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'template_projection' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."template_id" is not null and "communication_event_envelopes"."template_authority_state" is not null and "communication_event_envelopes"."template_authority_state" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and "communication_event_envelopes"."template_authority_version" is not null and "communication_event_envelopes"."template_authority_version" > 0 and "communication_event_envelopes"."template_authority_updated_at" is not null and "communication_event_envelopes"."template_provider_reference" is not null and "communication_event_envelopes"."template_key" is not null and "communication_event_envelopes"."template_locale" is not null and "communication_event_envelopes"."template_locale" in ('es', 'en') and "communication_event_envelopes"."template_category" is not null and "communication_event_envelopes"."template_category" in ('authentication', 'marketing', 'utility') and "communication_event_envelopes"."template_provider_state" is not null and "communication_event_envelopes"."template_provider_state" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and "communication_event_envelopes"."template_provider_version" is not null and "communication_event_envelopes"."template_provider_timestamp" is not null and "communication_event_envelopes"."template_components" is not null and jsonb_typeof("communication_event_envelopes"."template_components") = 'array' and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'unsupported_verified' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."unsupported_reason" is not null and "communication_event_envelopes"."unsupported_reason" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null)),
	CONSTRAINT "communication_event_envelopes_field_ownership_valid" CHECK (("communication_event_envelopes"."binding_id" is null or "communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'media_reference')) and ("communication_event_envelopes"."message_reference" is null or "communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'media_reference')) and ("communication_event_envelopes"."external_message_reference" is null or "communication_event_envelopes"."event_kind" = 'message_status') and ("communication_event_envelopes"."canonical_text" is null or "communication_event_envelopes"."event_kind" = 'text_message') and ("communication_event_envelopes"."delivery_state" is null or "communication_event_envelopes"."event_kind" = 'message_status') and ("communication_event_envelopes"."interactive_kind" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."interactive_id" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."interactive_title" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."media_external_reference" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_declared_kind" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_mime_type" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_checksum" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."template_id" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_state" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_version" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_updated_at" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_reference" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_key" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_locale" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_category" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_state" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_version" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_timestamp" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_components" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."unsupported_reason" is null or "communication_event_envelopes"."event_kind" = 'unsupported_verified')),
	CONSTRAINT "communication_event_envelopes_reference_shape_valid" CHECK (("communication_event_envelopes"."participant_id" is null or "communication_event_envelopes"."conversation_id" is not null) and ("communication_event_envelopes"."message_id" is null or "communication_event_envelopes"."conversation_id" is not null)),
	CONSTRAINT "communication_event_envelopes_media_checksum_valid" CHECK ("communication_event_envelopes"."media_checksum" is null or "communication_event_envelopes"."media_checksum" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_handoffs" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"state" varchar(24) NOT NULL,
	"reason_code" varchar(48) NOT NULL,
	"receipt_id" text,
	"correlation_id" text NOT NULL,
	"assigned_participant_id" text,
	"requested_at" timestamp with time zone NOT NULL,
	"queued_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_handoffs_channel_valid" CHECK ("communication_handoffs"."channel_kind" in ('public_web', 'whatsapp')),
	CONSTRAINT "communication_handoffs_state_valid" CHECK ("communication_handoffs"."state" in ('requested', 'queued', 'accepted', 'closed', 'unavailable')),
	CONSTRAINT "communication_handoffs_reason_valid" CHECK ("communication_handoffs"."reason_code" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown'))
);
--> statement-breakpoint
ALTER TABLE "communication_handoffs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_message_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"template_key" varchar(120) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"purpose" varchar(24) NOT NULL,
	"definition_source" varchar(32) NOT NULL,
	"definition_version" integer NOT NULL,
	"variable_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" varchar(32) NOT NULL,
	"internally_approved" boolean DEFAULT false NOT NULL,
	"approval_receipt_id" text,
	"approval_receipt_issued_at" timestamp with time zone,
	"approval_receipt_valid_until" timestamp with time zone,
	"external_reference" text,
	"projection_version" integer,
	"provider_receipt_id" text,
	"provider_correlation_id" text,
	"provider_receipt_issued_at" timestamp with time zone,
	"provider_receipt_valid_until" timestamp with time zone,
	"category" varchar(48),
	"observed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_message_templates_definition_unique" UNIQUE("template_key","locale","definition_version"),
	CONSTRAINT "communication_message_templates_locale_valid" CHECK ("communication_message_templates"."locale" in ('es', 'en')),
	CONSTRAINT "communication_message_templates_purpose_valid" CHECK ("communication_message_templates"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
	CONSTRAINT "communication_message_templates_source_valid" CHECK ("communication_message_templates"."definition_source" in ('synthetic_test_fixture', 'approved_policy')),
	CONSTRAINT "communication_message_templates_state_valid" CHECK ("communication_message_templates"."state" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')),
	CONSTRAINT "communication_message_templates_variables_valid" CHECK (jsonb_typeof("communication_message_templates"."variable_keys") = 'array'),
	CONSTRAINT "communication_message_templates_definition_version_positive" CHECK ("communication_message_templates"."definition_version" > 0),
	CONSTRAINT "communication_message_templates_projection_version_positive" CHECK ("communication_message_templates"."projection_version" is null or "communication_message_templates"."projection_version" > 0),
	CONSTRAINT "communication_message_templates_approval_valid" CHECK (("communication_message_templates"."internally_approved" = false and "communication_message_templates"."approval_receipt_id" is null and "communication_message_templates"."approval_receipt_issued_at" is null and "communication_message_templates"."approval_receipt_valid_until" is null) or ("communication_message_templates"."internally_approved" = true and "communication_message_templates"."approval_receipt_id" is not null and "communication_message_templates"."approval_receipt_issued_at" is not null and "communication_message_templates"."approval_receipt_valid_until" > "communication_message_templates"."approval_receipt_issued_at")),
	CONSTRAINT "communication_message_templates_provider_receipt_valid" CHECK (("communication_message_templates"."provider_receipt_id" is null and "communication_message_templates"."provider_correlation_id" is null and "communication_message_templates"."provider_receipt_issued_at" is null and "communication_message_templates"."provider_receipt_valid_until" is null) or ("communication_message_templates"."provider_receipt_id" is not null and "communication_message_templates"."provider_correlation_id" is not null and "communication_message_templates"."provider_receipt_issued_at" is not null and "communication_message_templates"."provider_receipt_valid_until" > "communication_message_templates"."provider_receipt_issued_at"))
);
--> statement-breakpoint
ALTER TABLE "communication_message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"ordinal" integer NOT NULL,
	"direction" varchar(16) NOT NULL,
	"sender_participant_id" text NOT NULL,
	"recipient_participant_id" text,
	"locale" varchar(2) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"state" varchar(24) NOT NULL,
	"body" text,
	"body_stored" boolean DEFAULT false NOT NULL,
	"body_retention_policy" varchar(24) DEFAULT 'metadata_only' NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rejection_reason" varchar(48),
	"external_message_reference" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_messages_id_conversation_unique" UNIQUE("id","conversation_id"),
	CONSTRAINT "communication_messages_conversation_ordinal_unique" UNIQUE("conversation_id","ordinal"),
	CONSTRAINT "communication_messages_channel_valid" CHECK ("communication_messages"."channel_kind" in ('public_web', 'whatsapp')),
	CONSTRAINT "communication_messages_ordinal_positive" CHECK ("communication_messages"."ordinal" > 0),
	CONSTRAINT "communication_messages_direction_valid" CHECK ("communication_messages"."direction" in ('inbound', 'outbound', 'system')),
	CONSTRAINT "communication_messages_locale_valid" CHECK ("communication_messages"."locale" in ('es', 'en')),
	CONSTRAINT "communication_messages_kind_valid" CHECK ("communication_messages"."kind" in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')),
	CONSTRAINT "communication_messages_state_valid" CHECK ("communication_messages"."state" in ('accepted', 'answered', 'failed', 'handoff_required')),
	CONSTRAINT "communication_messages_body_retention_valid" CHECK (("communication_messages"."body_retention_policy" = 'metadata_only' and "communication_messages"."body_stored" = false and "communication_messages"."body" is null) or ("communication_messages"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_messages"."body_stored" = true and "communication_messages"."body" is not null))
);
--> statement-breakpoint
ALTER TABLE "communication_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_outbound_commands" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"binding_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"purpose" varchar(24) NOT NULL,
	"message_reference" text,
	"template_key" varchar(120),
	"template_definition_version" varchar(80),
	"destination_key" varchar(120),
	"owning_receipt_id" text NOT NULL,
	"owning_domain" varchar(80) NOT NULL,
	"owning_reference" text NOT NULL,
	"owning_receipt_issued_at" timestamp with time zone NOT NULL,
	"owning_receipt_valid_until" timestamp with time zone NOT NULL,
	"owning_receipt_correlation_id" text NOT NULL,
	"expected_policy_version" integer NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"fingerprint" char(64) NOT NULL,
	"correlation_id" text NOT NULL,
	"state" varchar(32) NOT NULL,
	"version" integer NOT NULL,
	"lease_owner_id" text,
	"lease_token_hash" char(64),
	"lease_expires_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_outbound_commands_id_connection_unique" UNIQUE("id","connection_id"),
	CONSTRAINT "communication_outbound_commands_binding_key_unique" UNIQUE("binding_id","idempotency_key"),
	CONSTRAINT "communication_outbound_commands_channel_valid" CHECK ("communication_outbound_commands"."channel_kind" = 'whatsapp'),
	CONSTRAINT "communication_outbound_commands_fingerprint_valid" CHECK ("communication_outbound_commands"."fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_outbound_commands_lease_token_hash_valid" CHECK ("communication_outbound_commands"."lease_token_hash" is null or "communication_outbound_commands"."lease_token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_outbound_commands_locale_valid" CHECK ("communication_outbound_commands"."locale" in ('es', 'en')),
	CONSTRAINT "communication_outbound_commands_purpose_valid" CHECK ("communication_outbound_commands"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
	CONSTRAINT "communication_outbound_commands_state_valid" CHECK ("communication_outbound_commands"."state" in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')),
	CONSTRAINT "communication_outbound_commands_policy_version_positive" CHECK ("communication_outbound_commands"."expected_policy_version" > 0),
	CONSTRAINT "communication_outbound_commands_version_positive" CHECK ("communication_outbound_commands"."version" > 0),
	CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid" CHECK ("communication_outbound_commands"."owning_receipt_valid_until" > "communication_outbound_commands"."owning_receipt_issued_at"),
	CONSTRAINT "communication_outbound_commands_destination_reference_opaque" CHECK ("communication_outbound_commands"."destination_key" is null or (char_length("communication_outbound_commands"."destination_key") <= 120 and "communication_outbound_commands"."destination_key" ~ '^(portal\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')),
	CONSTRAINT "communication_outbound_commands_lease_valid" CHECK (("communication_outbound_commands"."lease_owner_id" is null and "communication_outbound_commands"."lease_token_hash" is null and "communication_outbound_commands"."lease_expires_at" is null) or ("communication_outbound_commands"."lease_owner_id" is not null and "communication_outbound_commands"."lease_token_hash" is not null and "communication_outbound_commands"."lease_expires_at" is not null)),
	CONSTRAINT "communication_outbound_commands_expiry_valid" CHECK ("communication_outbound_commands"."expires_at" is null or "communication_outbound_commands"."expires_at" > "communication_outbound_commands"."created_at")
);
--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"channel_kind" varchar(16) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"channel_binding_id" text,
	"joined_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_participants_id_conversation_unique" UNIQUE("id","conversation_id"),
	CONSTRAINT "communication_participants_id_conversation_channel_unique" UNIQUE("id","conversation_id","channel_kind"),
	CONSTRAINT "communication_participants_channel_valid" CHECK ("communication_participants"."channel_kind" in ('public_web', 'whatsapp')),
	CONSTRAINT "communication_participants_kind_valid" CHECK ("communication_participants"."kind" in ('external', 'automated', 'human', 'system')),
	CONSTRAINT "communication_participants_membership_window_valid" CHECK ("communication_participants"."left_at" is null or "communication_participants"."left_at" >= "communication_participants"."joined_at")
);
--> statement-breakpoint
ALTER TABLE "communication_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_provider_event_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"channel_kind" varchar(16) DEFAULT 'whatsapp' NOT NULL,
	"external_event_reference" text NOT NULL,
	"body_digest" char(64) NOT NULL,
	"event_kind" varchar(32) NOT NULL,
	"state" varchar(32) NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"signature_verified" boolean NOT NULL,
	"correlation_id" text NOT NULL,
	"outcome_reason" varchar(48),
	"processing_version" integer NOT NULL,
	"lease_owner_id" text,
	"lease_token_hash" char(64),
	"lease_expires_at" timestamp with time zone,
	"received_at" timestamp with time zone NOT NULL,
	"persisted_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_provider_event_receipts_id_connection_unique" UNIQUE("id","connection_id"),
	CONSTRAINT "communication_provider_event_receipts_identity_unique" UNIQUE("connection_id","external_event_reference"),
	CONSTRAINT "communication_provider_event_receipts_kind_valid" CHECK ("communication_provider_event_receipts"."event_kind" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')),
	CONSTRAINT "communication_provider_event_receipts_state_valid" CHECK ("communication_provider_event_receipts"."state" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')),
	CONSTRAINT "communication_provider_event_receipts_signature_valid" CHECK ("communication_provider_event_receipts"."signature_verified" = true),
	CONSTRAINT "communication_provider_event_receipts_channel_valid" CHECK ("communication_provider_event_receipts"."channel_kind" = 'whatsapp'),
	CONSTRAINT "communication_provider_event_receipts_body_digest_valid" CHECK ("communication_provider_event_receipts"."body_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_provider_event_receipts_lease_token_hash_valid" CHECK ("communication_provider_event_receipts"."lease_token_hash" is null or "communication_provider_event_receipts"."lease_token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_provider_event_receipts_version_positive" CHECK ("communication_provider_event_receipts"."processing_version" > 0),
	CONSTRAINT "communication_provider_event_receipts_lease_valid" CHECK (("communication_provider_event_receipts"."lease_owner_id" is null and "communication_provider_event_receipts"."lease_token_hash" is null and "communication_provider_event_receipts"."lease_expires_at" is null) or ("communication_provider_event_receipts"."lease_owner_id" is not null and "communication_provider_event_receipts"."lease_token_hash" is not null and "communication_provider_event_receipts"."lease_expires_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "communication_provider_event_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_conversation_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"channel_kind" varchar(16) DEFAULT 'public_web' NOT NULL,
	"session_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"notice_version" varchar(80) NOT NULL,
	"start_idempotency_key" varchar(128) NOT NULL,
	"start_fingerprint" char(64) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_conversation_sessions_conversation_unique" UNIQUE("conversation_id"),
	CONSTRAINT "public_chat_conversation_sessions_session_start_key_unique" UNIQUE("session_id","start_idempotency_key"),
	CONSTRAINT "public_chat_conversation_sessions_start_fingerprint_valid" CHECK ("public_chat_conversation_sessions"."start_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "public_chat_conversation_sessions_channel_valid" CHECK ("public_chat_conversation_sessions"."channel_kind" = 'public_web')
);
--> statement-breakpoint
ALTER TABLE "public_chat_conversation_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "communication_audit_events" ADD CONSTRAINT "communication_audit_events_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contact_bindings" ADD CONSTRAINT "communication_contact_bindings_connection_id_communication_channel_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."communication_channel_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contact_bindings" ADD CONSTRAINT "communication_contact_bindings_connection_channel_fk" FOREIGN KEY ("connection_id","channel_kind") REFERENCES "public"."communication_channel_connections"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."communication_contact_bindings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contact_policies" ADD CONSTRAINT "communication_contact_policies_binding_id_communication_contact_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."communication_contact_bindings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."communication_channel_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_command_connection_fk" FOREIGN KEY ("command_id","connection_id") REFERENCES "public"."communication_outbound_commands"("id","connection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_receipt_connection_fk" FOREIGN KEY ("receipt_id","connection_id") REFERENCES "public"."communication_provider_event_receipts"("id","connection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_participant_conversation_channel_fk" FOREIGN KEY ("participant_id","conversation_id","channel_kind") REFERENCES "public"."communication_participants"("id","conversation_id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_message_conversation_fk" FOREIGN KEY ("message_id","conversation_id") REFERENCES "public"."communication_messages"("id","conversation_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_binding_connection_channel_fk" FOREIGN KEY ("binding_id","connection_id","channel_kind") REFERENCES "public"."communication_contact_bindings"("id","connection_id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_handoffs" ADD CONSTRAINT "communication_handoffs_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_handoffs" ADD CONSTRAINT "communication_handoffs_assignee_conversation_fk" FOREIGN KEY ("assigned_participant_id","conversation_id") REFERENCES "public"."communication_participants"("id","conversation_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_conversation_fk" FOREIGN KEY ("sender_participant_id","conversation_id") REFERENCES "public"."communication_participants"("id","conversation_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_recipient_conversation_fk" FOREIGN KEY ("recipient_participant_id","conversation_id") REFERENCES "public"."communication_participants"("id","conversation_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_binding_connection_channel_fk" FOREIGN KEY ("binding_id","connection_id","channel_kind") REFERENCES "public"."communication_contact_bindings"("id","connection_id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_participants" ADD CONSTRAINT "communication_participants_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_participants" ADD CONSTRAINT "communication_participants_binding_channel_fk" FOREIGN KEY ("channel_binding_id","channel_kind") REFERENCES "public"."communication_contact_bindings"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_provider_event_receipts" ADD CONSTRAINT "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."communication_channel_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_provider_event_receipts" ADD CONSTRAINT "communication_provider_event_receipts_connection_channel_fk" FOREIGN KEY ("connection_id","channel_kind") REFERENCES "public"."communication_channel_connections"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_conversation_sessions" ADD CONSTRAINT "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."public_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_conversation_sessions" ADD CONSTRAINT "public_chat_conversation_sessions_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_conversation_sessions" ADD CONSTRAINT "public_chat_conversation_sessions_participant_conversation_channel_fk" FOREIGN KEY ("participant_id","conversation_id","channel_kind") REFERENCES "public"."communication_participants"("id","conversation_id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communication_audit_events_aggregate_idx" ON "communication_audit_events" USING btree ("aggregate_type","aggregate_id","occurred_at");--> statement-breakpoint
CREATE INDEX "communication_channel_connections_readiness_idx" ON "communication_channel_connections" USING btree ("readiness_state","updated_at");--> statement-breakpoint
CREATE INDEX "communication_contact_bindings_trust_idx" ON "communication_contact_bindings" USING btree ("trust_state","updated_at");--> statement-breakpoint
CREATE INDEX "communication_contact_evidence_events_binding_idx" ON "communication_contact_evidence_events" USING btree ("binding_id","sequence");--> statement-breakpoint
CREATE INDEX "communication_contact_policies_fence_idx" ON "communication_contact_policies" USING btree ("fence_state","updated_at");--> statement-breakpoint
CREATE INDEX "communication_conversations_activity_idx" ON "communication_conversations" USING btree ("channel_kind","last_activity_at");--> statement-breakpoint
CREATE INDEX "communication_conversations_reconciliation_idx" ON "communication_conversations" USING btree ("reconciliation_required","updated_at");--> statement-breakpoint
CREATE INDEX "communication_dispatch_attempts_recovery_idx" ON "communication_dispatch_attempts" USING btree ("state","completed_at");--> statement-breakpoint
CREATE INDEX "communication_event_envelopes_conversation_idx" ON "communication_event_envelopes" USING btree ("conversation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "communication_handoffs_state_idx" ON "communication_handoffs" USING btree ("state","updated_at");--> statement-breakpoint
CREATE INDEX "communication_message_templates_projection_idx" ON "communication_message_templates" USING btree ("state","observed_at");--> statement-breakpoint
CREATE INDEX "communication_messages_conversation_idx" ON "communication_messages" USING btree ("conversation_id","ordinal");--> statement-breakpoint
CREATE INDEX "communication_messages_external_reference_idx" ON "communication_messages" USING btree ("external_message_reference");--> statement-breakpoint
CREATE INDEX "communication_outbound_commands_work_idx" ON "communication_outbound_commands" USING btree ("state","lease_expires_at","scheduled_at");--> statement-breakpoint
CREATE INDEX "communication_participants_conversation_idx" ON "communication_participants" USING btree ("conversation_id","joined_at");--> statement-breakpoint
CREATE INDEX "communication_provider_event_receipts_work_idx" ON "communication_provider_event_receipts" USING btree ("state","lease_expires_at","received_at");--> statement-breakpoint
CREATE INDEX "public_chat_conversation_sessions_session_idx" ON "public_chat_conversation_sessions" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE POLICY "communication_audit_events_public_chat_scope" ON "communication_audit_events" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_audit_events"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_audit_events"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK ("communication_audit_events"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_audit_events"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));--> statement-breakpoint
CREATE POLICY "communication_audit_events_communications_scope" ON "communication_audit_events" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_audit_events"."channel_kind" = 'whatsapp') WITH CHECK ("communication_audit_events"."channel_kind" = 'whatsapp');--> statement-breakpoint
CREATE POLICY "communication_channel_connections_communications_scope" ON "communication_channel_connections" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_contact_bindings_communications_scope" ON "communication_contact_bindings" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_contact_evidence_events_communications_select" ON "communication_contact_evidence_events" AS PERMISSIVE FOR SELECT TO "atlas_communications_gateway" USING (true);--> statement-breakpoint
CREATE POLICY "communication_contact_evidence_events_communications_insert" ON "communication_contact_evidence_events" AS PERMISSIVE FOR INSERT TO "atlas_communications_gateway" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_contact_policies_communications_scope" ON "communication_contact_policies" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_conversations_public_chat_scope" ON "communication_conversations" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_conversations"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_conversations"."id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK ("communication_conversations"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_conversations"."id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));--> statement-breakpoint
CREATE POLICY "communication_conversations_communications_scope" ON "communication_conversations" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_conversations"."channel_kind" = 'whatsapp') WITH CHECK ("communication_conversations"."channel_kind" = 'whatsapp');--> statement-breakpoint
CREATE POLICY "communication_dispatch_attempts_communications_scope" ON "communication_dispatch_attempts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_event_envelopes_communications_scope" ON "communication_event_envelopes" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_handoffs_public_chat_scope" ON "communication_handoffs" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_handoffs"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_handoffs"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK ("communication_handoffs"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_handoffs"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));--> statement-breakpoint
CREATE POLICY "communication_handoffs_communications_scope" ON "communication_handoffs" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_handoffs"."channel_kind" = 'whatsapp') WITH CHECK ("communication_handoffs"."channel_kind" = 'whatsapp');--> statement-breakpoint
CREATE POLICY "communication_message_templates_communications_scope" ON "communication_message_templates" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_messages_public_chat_scope" ON "communication_messages" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_messages"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_messages"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK ("communication_messages"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_messages"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));--> statement-breakpoint
CREATE POLICY "communication_messages_communications_scope" ON "communication_messages" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_messages"."channel_kind" = 'whatsapp') WITH CHECK ("communication_messages"."channel_kind" = 'whatsapp');--> statement-breakpoint
CREATE POLICY "communication_outbound_commands_communications_scope" ON "communication_outbound_commands" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "communication_participants_public_chat_scope" ON "communication_participants" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_participants"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_participants"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK ("communication_participants"."channel_kind" = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "communication_participants"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));--> statement-breakpoint
CREATE POLICY "communication_participants_communications_scope" ON "communication_participants" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_participants"."channel_kind" = 'whatsapp') WITH CHECK ("communication_participants"."channel_kind" = 'whatsapp');--> statement-breakpoint
CREATE POLICY "communication_provider_event_receipts_communications_scope" ON "communication_provider_event_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_conversation_sessions_public_chat_scope" ON "public_chat_conversation_sessions" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("public_chat_conversation_sessions"."session_id" = nullif(current_setting('atlas.public_chat_session_id', true), '')) WITH CHECK ("public_chat_conversation_sessions"."session_id" = nullif(current_setting('atlas.public_chat_session_id', true), ''));