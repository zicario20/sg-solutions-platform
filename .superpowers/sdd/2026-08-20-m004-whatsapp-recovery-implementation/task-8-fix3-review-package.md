# Task 8 fix round 3

## Commits
35c865f fix(database): normalize contact withdrawal evidence

## Stat
 .../0013_m004_contact_withdrawal_evidence.sql      |   48 +
 .../workspace/drizzle/meta/0013_snapshot.json      | 4290 ++++++++++++++++++++
 .../workspace/drizzle/meta/_journal.json           |    7 +
 .../database/src/postgres-communications-store.ts  |  157 +-
 .../workspace/packages/database/src/schema.ts      |   33 +-
 .../domain/src/communications/memory-repository.ts |   10 +
 .../communications-postgres.integration.test.ts    |   57 +-
 .../tests/m004/communications-repository.test.ts   |   17 +
 .../tests/m004/communications-schema.test.ts       |    7 +-
 .../communications-repository-conformance.ts       |  134 +-
 10 files changed, 4699 insertions(+), 61 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/drizzle/0013_m004_contact_withdrawal_evidence.sql b/blueprints/project-atlas/workspace/drizzle/0013_m004_contact_withdrawal_evidence.sql
new file mode 100644
index 0000000..08da86b
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0013_m004_contact_withdrawal_evidence.sql
@@ -0,0 +1,48 @@
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_kind_valid";--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_authority_valid";--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_receipt_valid";--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_state_shape_valid";--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ALTER COLUMN "evidence_receipt_id" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ALTER COLUMN "receipt_kind" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ALTER COLUMN "owning_domain" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ALTER COLUMN "authority_role" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ALTER COLUMN "correlation_id" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD COLUMN "contact_evidence_event_id" text;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_id_binding_unique" UNIQUE("id","binding_id");--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_contact_binding_fk" FOREIGN KEY ("contact_evidence_event_id","binding_id") REFERENCES "public"."communication_contact_evidence_events"("id","binding_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+WITH legacy AS MATERIALIZED (
+	SELECT event.id, event.binding_id, event.purpose, event.consent_state,
+		event.fence_state, event.authority_version, event.occurred_at, event.created_at,
+		(SELECT max(candidate.sequence) FROM communication_contact_evidence_events candidate
+		 WHERE candidate.binding_id = event.binding_id) AS base_sequence,
+		row_number() OVER (PARTITION BY event.binding_id ORDER BY event.sequence, event.id) AS projection_ordinal
+	FROM communication_contact_evidence_events event
+	WHERE event.event_kind = 'consent_withdrawn' AND event.evidence_receipt_id IS NOT NULL
+), contact_events AS (
+	UPDATE communication_contact_evidence_events event
+	SET event_kind = 'contact_withdrawal_recorded', purpose = NULL, consent_state = NULL,
+		fence_state = NULL, authority_version = NULL
+	FROM legacy
+	WHERE event.id = legacy.id
+	RETURNING event.id
+)
+INSERT INTO communication_contact_evidence_events (
+	id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+	binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
+	owning_domain, authority_role, authority_version, contact_evidence_event_id,
+	triggering_event_id, policy_version, correlation_id, receipt_issued_at,
+	receipt_valid_until, occurred_at, created_at
+)
+SELECT legacy.id || '_purpose_' || md5(legacy.purpose), legacy.binding_id,
+	legacy.base_sequence + legacy.projection_ordinal, 'consent_withdrawn', legacy.purpose,
+	legacy.consent_state, legacy.fence_state, NULL, NULL, NULL, NULL, NULL, NULL,
+	legacy.authority_version, legacy.id, NULL, NULL, NULL, NULL, NULL,
+	legacy.occurred_at, legacy.created_at
+FROM legacy
+JOIN contact_events ON contact_events.id = legacy.id;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_contact_link_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."contact_evidence_event_id" is not null) or ("communication_contact_evidence_events"."event_kind" <> 'consent_withdrawn' and "communication_contact_evidence_events"."contact_evidence_event_id" is null));--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_receipt_owner_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."evidence_receipt_id" is null and "communication_contact_evidence_events"."receipt_kind" is null and "communication_contact_evidence_events"."owning_domain" is null and "communication_contact_evidence_events"."authority_role" is null and "communication_contact_evidence_events"."correlation_id" is null and "communication_contact_evidence_events"."receipt_issued_at" is null and "communication_contact_evidence_events"."receipt_valid_until" is null) or ("communication_contact_evidence_events"."event_kind" <> 'consent_withdrawn' and "communication_contact_evidence_events"."evidence_receipt_id" is not null and "communication_contact_evidence_events"."receipt_kind" is not null and "communication_contact_evidence_events"."owning_domain" is not null and "communication_contact_evidence_events"."authority_role" is not null and "communication_contact_evidence_events"."correlation_id" is not null));--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_kind_valid" CHECK ("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'contact_withdrawal_recorded', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated'));--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_authority_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_regranted') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."event_kind" = 'contact_withdrawal_recorded' and (("communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."owning_domain" = 'M004' and "communication_contact_evidence_events"."authority_role" = 'channel_policy_detection'))) or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."owning_domain" is null and "communication_contact_evidence_events"."authority_role" is null) or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'contact_review') or ("communication_contact_evidence_events"."event_kind" in ('binding_suspended', 'binding_revalidated') and "communication_contact_evidence_events"."authority_role" = 'binding_verification'));--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_receipt_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_regranted') and "communication_contact_evidence_events"."receipt_kind" = 'consent_evidence') or ("communication_contact_evidence_events"."event_kind" = 'contact_withdrawal_recorded' and "communication_contact_evidence_events"."receipt_kind" = 'contact_withdrawal') or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."receipt_kind" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."receipt_kind" = 'ambiguous_opt_out_detection') or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."receipt_kind" = 'ambiguous_opt_out_resolution') or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."receipt_kind" = 'binding_suspension') or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."receipt_kind" = 'binding_revalidation'));--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_state_shape_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_granted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_regranted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'contact_withdrawal_recorded' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and (("communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."triggering_event_id" is null) or ("communication_contact_evidence_events"."owning_domain" = 'M004' and "communication_contact_evidence_events"."triggering_event_id" is not null)) and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'opt_out_pending' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_cleared' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'clear' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'withdraw' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'suspended' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'reverified' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null));
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0013_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0013_snapshot.json
new file mode 100644
index 0000000..23b9817
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0013_snapshot.json
@@ -0,0 +1,4290 @@
+{
+  "id": "50c60227-f6f3-41a6-86a8-49ff736094a4",
+  "prevId": "779bccb9-a199-415b-966c-f6c4110b17eb",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.communication_audit_events": {
+      "name": "communication_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_type": {
+          "name": "aggregate_type",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_id": {
+          "name": "aggregate_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_audit_events_aggregate_idx": {
+          "name": "communication_audit_events_aggregate_idx",
+          "columns": [
+            {
+              "expression": "aggregate_type",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "aggregate_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_audit_events_conversation_channel_fk": {
+          "name": "communication_audit_events_conversation_channel_fk",
+          "tableFrom": "communication_audit_events",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_audit_events_conversation_sequence_unique": {
+          "name": "communication_audit_events_conversation_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ]
+        }
+      },
+      "policies": {
+        "communication_audit_events_public_chat_scope": {
+          "name": "communication_audit_events_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_audit_events_communications_scope": {
+          "name": "communication_audit_events_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_audit_events_channel_valid": {
+          "name": "communication_audit_events_channel_valid",
+          "value": "\"communication_audit_events\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_audit_events_sequence_positive": {
+          "name": "communication_audit_events_sequence_positive",
+          "value": "\"communication_audit_events\".\"sequence\" > 0"
+        },
+        "communication_audit_events_locale_valid": {
+          "name": "communication_audit_events_locale_valid",
+          "value": "\"communication_audit_events\".\"locale\" is null or \"communication_audit_events\".\"locale\" in ('es', 'en')"
+        },
+        "communication_audit_events_purpose_valid": {
+          "name": "communication_audit_events_purpose_valid",
+          "value": "\"communication_audit_events\".\"purpose\" is null or \"communication_audit_events\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_audit_events_aggregate_valid": {
+          "name": "communication_audit_events_aggregate_valid",
+          "value": "\"communication_audit_events\".\"aggregate_type\" in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')"
+        },
+        "communication_audit_events_result_valid": {
+          "name": "communication_audit_events_result_valid",
+          "value": "\"communication_audit_events\".\"result_code\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')"
+        },
+        "communication_audit_events_version_positive": {
+          "name": "communication_audit_events_version_positive",
+          "value": "\"communication_audit_events\".\"version\" > 0"
+        },
+        "communication_audit_events_policy_version_positive": {
+          "name": "communication_audit_events_policy_version_positive",
+          "value": "\"communication_audit_events\".\"policy_version\" is null or \"communication_audit_events\".\"policy_version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_channel_connections": {
+      "name": "communication_channel_connections",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "adapter_key": {
+          "name": "adapter_key",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "readiness_state": {
+          "name": "readiness_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "configured_at": {
+          "name": "configured_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verified_at": {
+          "name": "verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_channel_connections_readiness_idx": {
+          "name": "communication_channel_connections_readiness_idx",
+          "columns": [
+            {
+              "expression": "readiness_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_channel_connections_id_channel_unique": {
+          "name": "communication_channel_connections_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        }
+      },
+      "policies": {
+        "communication_channel_connections_communications_scope": {
+          "name": "communication_channel_connections_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_channel_connections_channel_valid": {
+          "name": "communication_channel_connections_channel_valid",
+          "value": "\"communication_channel_connections\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_channel_connections_adapter_valid": {
+          "name": "communication_channel_connections_adapter_valid",
+          "value": "\"communication_channel_connections\".\"adapter_key\" = 'meta_cloud'"
+        },
+        "communication_channel_connections_readiness_valid": {
+          "name": "communication_channel_connections_readiness_valid",
+          "value": "\"communication_channel_connections\".\"readiness_state\" in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')"
+        },
+        "communication_channel_connections_version_positive": {
+          "name": "communication_channel_connections_version_positive",
+          "value": "\"communication_channel_connections\".\"version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_bindings": {
+      "name": "communication_contact_bindings",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest": {
+          "name": "endpoint_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest_key_version": {
+          "name": "endpoint_digest_key_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "trust_state": {
+          "name": "trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "contact_policy_version": {
+          "name": "contact_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "verification_receipt_id": {
+          "name": "verification_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "endpoint_verified_at": {
+          "name": "endpoint_verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verification_expires_at": {
+          "name": "verification_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "wrong_person_reported_at": {
+          "name": "wrong_person_reported_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reassignment_risk_at": {
+          "name": "reassignment_risk_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_bindings_trust_idx": {
+          "name": "communication_contact_bindings_trust_idx",
+          "columns": [
+            {
+              "expression": "trust_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_bindings_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_contact_bindings_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_contact_bindings",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_contact_bindings_connection_channel_fk": {
+          "name": "communication_contact_bindings_connection_channel_fk",
+          "tableFrom": "communication_contact_bindings",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_bindings_id_connection_channel_unique": {
+          "name": "communication_contact_bindings_id_connection_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ]
+        },
+        "communication_contact_bindings_id_channel_unique": {
+          "name": "communication_contact_bindings_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        },
+        "communication_contact_bindings_endpoint_unique": {
+          "name": "communication_contact_bindings_endpoint_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "endpoint_digest_key_version",
+            "endpoint_digest"
+          ]
+        }
+      },
+      "policies": {
+        "communication_contact_bindings_communications_scope": {
+          "name": "communication_contact_bindings_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_bindings_channel_valid": {
+          "name": "communication_contact_bindings_channel_valid",
+          "value": "\"communication_contact_bindings\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_contact_bindings_trust_valid": {
+          "name": "communication_contact_bindings_trust_valid",
+          "value": "\"communication_contact_bindings\".\"trust_state\" in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')"
+        },
+        "communication_contact_bindings_locale_valid": {
+          "name": "communication_contact_bindings_locale_valid",
+          "value": "\"communication_contact_bindings\".\"locale\" in ('es', 'en')"
+        },
+        "communication_contact_bindings_endpoint_digest_valid": {
+          "name": "communication_contact_bindings_endpoint_digest_valid",
+          "value": "\"communication_contact_bindings\".\"endpoint_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_contact_bindings_policy_version_positive": {
+          "name": "communication_contact_bindings_policy_version_positive",
+          "value": "\"communication_contact_bindings\".\"contact_policy_version\" > 0"
+        },
+        "communication_contact_bindings_version_positive": {
+          "name": "communication_contact_bindings_version_positive",
+          "value": "\"communication_contact_bindings\".\"version\" > 0"
+        },
+        "communication_contact_bindings_verification_window_valid": {
+          "name": "communication_contact_bindings_verification_window_valid",
+          "value": "\"communication_contact_bindings\".\"verification_expires_at\" is null or (\"communication_contact_bindings\".\"endpoint_verified_at\" is not null and \"communication_contact_bindings\".\"verification_expires_at\" > \"communication_contact_bindings\".\"endpoint_verified_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_evidence_events": {
+      "name": "communication_contact_evidence_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_trust_state": {
+          "name": "binding_trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "review_resolution": {
+          "name": "review_resolution",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "receipt_kind": {
+          "name": "receipt_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "authority_role": {
+          "name": "authority_role",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "authority_version": {
+          "name": "authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "contact_evidence_event_id": {
+          "name": "contact_evidence_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "triggering_event_id": {
+          "name": "triggering_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "receipt_issued_at": {
+          "name": "receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "receipt_valid_until": {
+          "name": "receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_evidence_events_binding_idx": {
+          "name": "communication_contact_evidence_events_binding_idx",
+          "columns": [
+            {
+              "expression": "binding_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "sequence",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_contact_evidence_events_contact_binding_fk": {
+          "name": "communication_contact_evidence_events_contact_binding_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "tableTo": "communication_contact_evidence_events",
+          "columnsFrom": [
+            "contact_evidence_event_id",
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id",
+            "binding_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_evidence_events_binding_sequence_unique": {
+          "name": "communication_contact_evidence_events_binding_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "sequence"
+          ]
+        },
+        "communication_contact_evidence_events_receipt_unique": {
+          "name": "communication_contact_evidence_events_receipt_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "evidence_receipt_id"
+          ]
+        },
+        "communication_contact_evidence_events_id_binding_unique": {
+          "name": "communication_contact_evidence_events_id_binding_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "binding_id"
+          ]
+        }
+      },
+      "policies": {
+        "communication_contact_evidence_events_communications_select": {
+          "name": "communication_contact_evidence_events_communications_select",
+          "as": "PERMISSIVE",
+          "for": "SELECT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true"
+        },
+        "communication_contact_evidence_events_communications_insert": {
+          "name": "communication_contact_evidence_events_communications_insert",
+          "as": "PERMISSIVE",
+          "for": "INSERT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_evidence_events_kind_valid": {
+          "name": "communication_contact_evidence_events_kind_valid",
+          "value": "\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'contact_withdrawal_recorded', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')"
+        },
+        "communication_contact_evidence_events_authority_valid": {
+          "name": "communication_contact_evidence_events_authority_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" = 'contact_withdrawal_recorded' and ((\"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"owning_domain\" = 'M004' and \"communication_contact_evidence_events\".\"authority_role\" = 'channel_policy_detection'))) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"owning_domain\" is null and \"communication_contact_evidence_events\".\"authority_role\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+        },
+        "communication_contact_evidence_events_receipt_valid": {
+          "name": "communication_contact_evidence_events_receipt_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'contact_withdrawal_recorded' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
+        },
+        "communication_contact_evidence_events_state_shape_valid": {
+          "name": "communication_contact_evidence_events_state_shape_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'contact_withdrawal_recorded' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and ((\"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"triggering_event_id\" is null) or (\"communication_contact_evidence_events\".\"owning_domain\" = 'M004' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null)) and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
+        },
+        "communication_contact_evidence_events_contact_link_valid": {
+          "name": "communication_contact_evidence_events_contact_link_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"contact_evidence_event_id\" is not null) or (\"communication_contact_evidence_events\".\"event_kind\" <> 'consent_withdrawn' and \"communication_contact_evidence_events\".\"contact_evidence_event_id\" is null)"
+        },
+        "communication_contact_evidence_events_receipt_owner_valid": {
+          "name": "communication_contact_evidence_events_receipt_owner_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"evidence_receipt_id\" is null and \"communication_contact_evidence_events\".\"receipt_kind\" is null and \"communication_contact_evidence_events\".\"owning_domain\" is null and \"communication_contact_evidence_events\".\"authority_role\" is null and \"communication_contact_evidence_events\".\"correlation_id\" is null and \"communication_contact_evidence_events\".\"receipt_issued_at\" is null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" <> 'consent_withdrawn' and \"communication_contact_evidence_events\".\"evidence_receipt_id\" is not null and \"communication_contact_evidence_events\".\"receipt_kind\" is not null and \"communication_contact_evidence_events\".\"owning_domain\" is not null and \"communication_contact_evidence_events\".\"authority_role\" is not null and \"communication_contact_evidence_events\".\"correlation_id\" is not null)"
+        },
+        "communication_contact_evidence_events_sequence_positive": {
+          "name": "communication_contact_evidence_events_sequence_positive",
+          "value": "\"communication_contact_evidence_events\".\"sequence\" > 0"
+        },
+        "communication_contact_evidence_events_receipt_window_valid": {
+          "name": "communication_contact_evidence_events_receipt_window_valid",
+          "value": "(\"communication_contact_evidence_events\".\"receipt_issued_at\" is null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is null) or (\"communication_contact_evidence_events\".\"receipt_issued_at\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" > \"communication_contact_evidence_events\".\"receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_policies": {
+      "name": "communication_contact_policies",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "decision_code": {
+          "name": "decision_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fence": {
+          "name": "fence",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "evaluated_at": {
+          "name": "evaluated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_policies_fence_idx": {
+          "name": "communication_contact_policies_fence_idx",
+          "columns": [
+            {
+              "expression": "fence_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_policies_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_policies_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_policies",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_policies_binding_purpose_unique": {
+          "name": "communication_contact_policies_binding_purpose_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "purpose"
+          ]
+        }
+      },
+      "policies": {
+        "communication_contact_policies_communications_scope": {
+          "name": "communication_contact_policies_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_policies_purpose_valid": {
+          "name": "communication_contact_policies_purpose_valid",
+          "value": "\"communication_contact_policies\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_contact_policies_consent_valid": {
+          "name": "communication_contact_policies_consent_valid",
+          "value": "\"communication_contact_policies\".\"consent_state\" in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')"
+        },
+        "communication_contact_policies_fence_valid": {
+          "name": "communication_contact_policies_fence_valid",
+          "value": "\"communication_contact_policies\".\"fence_state\" in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')"
+        },
+        "communication_contact_policies_decision_valid": {
+          "name": "communication_contact_policies_decision_valid",
+          "value": "\"communication_contact_policies\".\"decision_code\" is null or \"communication_contact_policies\".\"decision_code\" in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')"
+        },
+        "communication_contact_policies_version_positive": {
+          "name": "communication_contact_policies_version_positive",
+          "value": "\"communication_contact_policies\".\"version\" > 0"
+        },
+        "communication_contact_policies_fence_nonnegative": {
+          "name": "communication_contact_policies_fence_nonnegative",
+          "value": "\"communication_contact_policies\".\"fence\" >= 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_conversations": {
+      "name": "communication_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_conversations_activity_idx": {
+          "name": "communication_conversations_activity_idx",
+          "columns": [
+            {
+              "expression": "channel_kind",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "last_activity_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "communication_conversations_reconciliation_idx": {
+          "name": "communication_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_conversations_id_channel_unique": {
+          "name": "communication_conversations_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        }
+      },
+      "policies": {
+        "communication_conversations_public_chat_scope": {
+          "name": "communication_conversations_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_conversations_communications_scope": {
+          "name": "communication_conversations_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_conversations_channel_valid": {
+          "name": "communication_conversations_channel_valid",
+          "value": "\"communication_conversations\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_conversations_locale_valid": {
+          "name": "communication_conversations_locale_valid",
+          "value": "\"communication_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "communication_conversations_status_valid": {
+          "name": "communication_conversations_status_valid",
+          "value": "\"communication_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "communication_conversations_version_positive": {
+          "name": "communication_conversations_version_positive",
+          "value": "\"communication_conversations\".\"version\" > 0"
+        },
+        "communication_conversations_expiry_valid": {
+          "name": "communication_conversations_expiry_valid",
+          "value": "\"communication_conversations\".\"expires_at\" is null or \"communication_conversations\".\"expires_at\" > \"communication_conversations\".\"created_at\""
+        },
+        "communication_conversations_public_expiry_required": {
+          "name": "communication_conversations_public_expiry_required",
+          "value": "\"communication_conversations\".\"channel_kind\" <> 'public_web' or \"communication_conversations\".\"expires_at\" is not null"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_dispatch_attempts": {
+      "name": "communication_dispatch_attempts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "attempt_ordinal": {
+          "name": "attempt_ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_idempotency": {
+          "name": "request_idempotency",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference_capability": {
+          "name": "stable_reference_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_lookup_capability": {
+          "name": "message_lookup_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status_reconciliation_capability": {
+          "name": "status_reconciliation_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "media_references_capability": {
+          "name": "media_references_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "template_projection_capability": {
+          "name": "template_projection_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "capability_observed_at": {
+          "name": "capability_observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_digest": {
+          "name": "request_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference": {
+          "name": "stable_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_capability_hash": {
+          "name": "provider_io_capability_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_started_at": {
+          "name": "provider_io_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_owner_hash": {
+          "name": "lease_owner_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_version": {
+          "name": "lease_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_reference_digest": {
+          "name": "provider_reference_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "started_at": {
+          "name": "started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_dispatch_attempts_recovery_idx": {
+          "name": "communication_dispatch_attempts_recovery_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "completed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_dispatch_attempts_command_connection_fk": {
+          "name": "communication_dispatch_attempts_command_connection_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id",
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_dispatch_attempts_command_ordinal_unique": {
+          "name": "communication_dispatch_attempts_command_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "command_id",
+            "attempt_ordinal"
+          ]
+        },
+        "communication_dispatch_attempts_id_command_unique": {
+          "name": "communication_dispatch_attempts_id_command_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "command_id"
+          ]
+        },
+        "communication_dispatch_attempts_external_reference_unique": {
+          "name": "communication_dispatch_attempts_external_reference_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "external_message_reference"
+          ]
+        }
+      },
+      "policies": {
+        "communication_dispatch_attempts_communications_scope": {
+          "name": "communication_dispatch_attempts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_attempts_ordinal_positive": {
+          "name": "communication_dispatch_attempts_ordinal_positive",
+          "value": "\"communication_dispatch_attempts\".\"attempt_ordinal\" > 0"
+        },
+        "communication_dispatch_attempts_request_digest_valid": {
+          "name": "communication_dispatch_attempts_request_digest_valid",
+          "value": "\"communication_dispatch_attempts\".\"request_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_lease_owner_hash_valid": {
+          "name": "communication_dispatch_attempts_lease_owner_hash_valid",
+          "value": "\"communication_dispatch_attempts\".\"lease_owner_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_lease_version_positive": {
+          "name": "communication_dispatch_attempts_lease_version_positive",
+          "value": "\"communication_dispatch_attempts\".\"lease_version\" > 0"
+        },
+        "communication_dispatch_attempts_lease_window_valid": {
+          "name": "communication_dispatch_attempts_lease_window_valid",
+          "value": "\"communication_dispatch_attempts\".\"lease_expires_at\" > \"communication_dispatch_attempts\".\"started_at\""
+        },
+        "communication_dispatch_attempts_provider_reference_digest_valid": {
+          "name": "communication_dispatch_attempts_provider_reference_digest_valid",
+          "value": "\"communication_dispatch_attempts\".\"provider_reference_digest\" is null or \"communication_dispatch_attempts\".\"provider_reference_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_policy_version_positive": {
+          "name": "communication_dispatch_attempts_policy_version_positive",
+          "value": "\"communication_dispatch_attempts\".\"expected_policy_version\" > 0"
+        },
+        "communication_dispatch_attempts_state_valid": {
+          "name": "communication_dispatch_attempts_state_valid",
+          "value": "\"communication_dispatch_attempts\".\"state\" in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_dispatch_attempts_result_valid": {
+          "name": "communication_dispatch_attempts_result_valid",
+          "value": "\"communication_dispatch_attempts\".\"result_code\" is null or \"communication_dispatch_attempts\".\"result_code\" in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')"
+        },
+        "communication_dispatch_attempts_completion_valid": {
+          "name": "communication_dispatch_attempts_completion_valid",
+          "value": "\"communication_dispatch_attempts\".\"completed_at\" is null or \"communication_dispatch_attempts\".\"completed_at\" >= \"communication_dispatch_attempts\".\"started_at\""
+        },
+        "communication_dispatch_attempts_provider_io_capability_valid": {
+          "name": "communication_dispatch_attempts_provider_io_capability_valid",
+          "value": "(\"communication_dispatch_attempts\".\"provider_io_capability_hash\" is null and \"communication_dispatch_attempts\".\"provider_io_started_at\" is null) or (\"communication_dispatch_attempts\".\"provider_io_capability_hash\" ~ '^[0-9a-f]{64}$' and \"communication_dispatch_attempts\".\"provider_io_started_at\" is not null and \"communication_dispatch_attempts\".\"provider_io_started_at\" >= \"communication_dispatch_attempts\".\"started_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_dispatch_reconciliation_receipts": {
+      "name": "communication_dispatch_reconciliation_receipts",
+      "schema": "",
+      "columns": {
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "receipt_digest": {
+          "name": "receipt_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "attempt_id": {
+          "name": "attempt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source": {
+          "name": "source",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "outcome": {
+          "name": "outcome",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "issued_at": {
+          "name": "issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "communication_dispatch_reconciliation_receipts_attempt_command_fk": {
+          "name": "communication_dispatch_reconciliation_receipts_attempt_command_fk",
+          "tableFrom": "communication_dispatch_reconciliation_receipts",
+          "tableTo": "communication_dispatch_attempts",
+          "columnsFrom": [
+            "attempt_id",
+            "command_id"
+          ],
+          "columnsTo": [
+            "id",
+            "command_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_dispatch_reconciliation_receipts_command_binding_fk": {
+          "name": "communication_dispatch_reconciliation_receipts_command_binding_fk",
+          "tableFrom": "communication_dispatch_reconciliation_receipts",
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id",
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id",
+            "binding_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_dispatch_reconciliation_receipts_communications_scope": {
+          "name": "communication_dispatch_reconciliation_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_dispatch_reconciliation_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )",
+          "withCheck": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_dispatch_reconciliation_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_reconciliation_receipts_digest_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_digest_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"receipt_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_reconciliation_receipts_source_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_source_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"source\" in ('provider_lookup', 'manual_authority')"
+        },
+        "communication_dispatch_reconciliation_receipts_outcome_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_outcome_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"outcome\" in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')"
+        },
+        "communication_dispatch_reconciliation_receipts_window_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_window_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"expires_at\" > \"communication_dispatch_reconciliation_receipts\".\"issued_at\" and \"communication_dispatch_reconciliation_receipts\".\"created_at\" >= \"communication_dispatch_reconciliation_receipts\".\"issued_at\" and \"communication_dispatch_reconciliation_receipts\".\"created_at\" < \"communication_dispatch_reconciliation_receipts\".\"expires_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_event_envelopes": {
+      "name": "communication_event_envelopes",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "canonical_text": {
+          "name": "canonical_text",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "delivery_state": {
+          "name": "delivery_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_kind": {
+          "name": "interactive_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_id": {
+          "name": "interactive_id",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_title": {
+          "name": "interactive_title",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_external_reference": {
+          "name": "media_external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_declared_kind": {
+          "name": "media_declared_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_mime_type": {
+          "name": "media_mime_type",
+          "type": "varchar(160)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_checksum": {
+          "name": "media_checksum",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_id": {
+          "name": "template_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_state": {
+          "name": "template_authority_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_version": {
+          "name": "template_authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_updated_at": {
+          "name": "template_authority_updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_reference": {
+          "name": "template_provider_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_locale": {
+          "name": "template_locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_category": {
+          "name": "template_category",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_state": {
+          "name": "template_provider_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_version": {
+          "name": "template_provider_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_timestamp": {
+          "name": "template_provider_timestamp",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_components": {
+          "name": "template_components",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "unsupported_reason": {
+          "name": "unsupported_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_event_envelopes_conversation_idx": {
+          "name": "communication_event_envelopes_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_event_envelopes_receipt_connection_fk": {
+          "name": "communication_event_envelopes_receipt_connection_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "receipt_id",
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_conversation_channel_fk": {
+          "name": "communication_event_envelopes_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_participant_conversation_channel_fk": {
+          "name": "communication_event_envelopes_participant_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_message_conversation_fk": {
+          "name": "communication_event_envelopes_message_conversation_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_messages",
+          "columnsFrom": [
+            "message_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_binding_connection_channel_fk": {
+          "name": "communication_event_envelopes_binding_connection_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_event_envelopes_receipt_id_unique": {
+          "name": "communication_event_envelopes_receipt_id_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "receipt_id"
+          ]
+        }
+      },
+      "policies": {
+        "communication_event_envelopes_communications_scope": {
+          "name": "communication_event_envelopes_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_event_envelopes_kind_valid": {
+          "name": "communication_event_envelopes_kind_valid",
+          "value": "\"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_event_envelopes_channel_valid": {
+          "name": "communication_event_envelopes_channel_valid",
+          "value": "\"communication_event_envelopes\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_event_envelopes_schema_version_valid": {
+          "name": "communication_event_envelopes_schema_version_valid",
+          "value": "\"communication_event_envelopes\".\"schema_version\" = 'meta-envelope.v1'"
+        },
+        "communication_event_envelopes_retention_valid": {
+          "name": "communication_event_envelopes_retention_valid",
+          "value": "\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null"
+        },
+        "communication_event_envelopes_typed_shape_valid": {
+          "name": "communication_event_envelopes_typed_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
+        },
+        "communication_event_envelopes_field_ownership_valid": {
+          "name": "communication_event_envelopes_field_ownership_valid",
+          "value": "(\"communication_event_envelopes\".\"binding_id\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"canonical_text\" is null or \"communication_event_envelopes\".\"event_kind\" = 'text_message') and (\"communication_event_envelopes\".\"delivery_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"interactive_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_title\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"media_external_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_declared_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_mime_type\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"template_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_updated_at\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_key\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_locale\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_category\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_timestamp\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_components\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"unsupported_reason\" is null or \"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified')"
+        },
+        "communication_event_envelopes_reference_shape_valid": {
+          "name": "communication_event_envelopes_reference_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_reference\" is null or (char_length(\"communication_event_envelopes\".\"message_reference\") <= 128 and \"communication_event_envelopes\".\"message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or (char_length(\"communication_event_envelopes\".\"external_message_reference\") <= 128 and \"communication_event_envelopes\".\"external_message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"media_external_reference\" is null or (char_length(\"communication_event_envelopes\".\"media_external_reference\") <= 128 and \"communication_event_envelopes\".\"media_external_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"template_provider_reference\" is null or (char_length(\"communication_event_envelopes\".\"template_provider_reference\") <= 128 and \"communication_event_envelopes\".\"template_provider_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))"
+        },
+        "communication_event_envelopes_media_checksum_valid": {
+          "name": "communication_event_envelopes_media_checksum_valid",
+          "value": "\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"media_checksum\" ~ '^[0-9a-f]{64}$'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_handoffs": {
+      "name": "communication_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "assigned_participant_id": {
+          "name": "assigned_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "accepted_at": {
+          "name": "accepted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_handoffs_state_idx": {
+          "name": "communication_handoffs_state_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_handoffs_conversation_channel_fk": {
+          "name": "communication_handoffs_conversation_channel_fk",
+          "tableFrom": "communication_handoffs",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_handoffs_assignee_conversation_fk": {
+          "name": "communication_handoffs_assignee_conversation_fk",
+          "tableFrom": "communication_handoffs",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "assigned_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_handoffs_public_chat_scope": {
+          "name": "communication_handoffs_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_handoffs_communications_scope": {
+          "name": "communication_handoffs_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_handoffs_channel_valid": {
+          "name": "communication_handoffs_channel_valid",
+          "value": "\"communication_handoffs\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_handoffs_state_valid": {
+          "name": "communication_handoffs_state_valid",
+          "value": "\"communication_handoffs\".\"state\" in ('requested', 'queued', 'accepted', 'closed', 'unavailable')"
+        },
+        "communication_handoffs_reason_valid": {
+          "name": "communication_handoffs_reason_valid",
+          "value": "\"communication_handoffs\".\"reason_code\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_message_templates": {
+      "name": "communication_message_templates",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_source": {
+          "name": "definition_source",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_version": {
+          "name": "definition_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "variable_keys": {
+          "name": "variable_keys",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "internally_approved": {
+          "name": "internally_approved",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "approval_receipt_id": {
+          "name": "approval_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_issued_at": {
+          "name": "approval_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_valid_until": {
+          "name": "approval_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_reference": {
+          "name": "external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "projection_version": {
+          "name": "projection_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_id": {
+          "name": "provider_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_correlation_id": {
+          "name": "provider_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_issued_at": {
+          "name": "provider_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_valid_until": {
+          "name": "provider_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "category": {
+          "name": "category",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "observed_at": {
+          "name": "observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_message_templates_projection_idx": {
+          "name": "communication_message_templates_projection_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "observed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_message_templates_definition_unique": {
+          "name": "communication_message_templates_definition_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "template_key",
+            "locale",
+            "definition_version"
+          ]
+        }
+      },
+      "policies": {
+        "communication_message_templates_communications_scope": {
+          "name": "communication_message_templates_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_message_templates_locale_valid": {
+          "name": "communication_message_templates_locale_valid",
+          "value": "\"communication_message_templates\".\"locale\" in ('es', 'en')"
+        },
+        "communication_message_templates_purpose_valid": {
+          "name": "communication_message_templates_purpose_valid",
+          "value": "\"communication_message_templates\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_message_templates_source_valid": {
+          "name": "communication_message_templates_source_valid",
+          "value": "\"communication_message_templates\".\"definition_source\" in ('synthetic_test_fixture', 'approved_policy')"
+        },
+        "communication_message_templates_state_valid": {
+          "name": "communication_message_templates_state_valid",
+          "value": "\"communication_message_templates\".\"state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')"
+        },
+        "communication_message_templates_variables_valid": {
+          "name": "communication_message_templates_variables_valid",
+          "value": "jsonb_typeof(\"communication_message_templates\".\"variable_keys\") = 'array'"
+        },
+        "communication_message_templates_definition_version_positive": {
+          "name": "communication_message_templates_definition_version_positive",
+          "value": "\"communication_message_templates\".\"definition_version\" > 0"
+        },
+        "communication_message_templates_projection_version_positive": {
+          "name": "communication_message_templates_projection_version_positive",
+          "value": "\"communication_message_templates\".\"projection_version\" is null or \"communication_message_templates\".\"projection_version\" > 0"
+        },
+        "communication_message_templates_approval_valid": {
+          "name": "communication_message_templates_approval_valid",
+          "value": "(\"communication_message_templates\".\"internally_approved\" = false and \"communication_message_templates\".\"approval_receipt_id\" is null and \"communication_message_templates\".\"approval_receipt_issued_at\" is null and \"communication_message_templates\".\"approval_receipt_valid_until\" is null) or (\"communication_message_templates\".\"internally_approved\" = true and \"communication_message_templates\".\"approval_receipt_id\" is not null and \"communication_message_templates\".\"approval_receipt_issued_at\" is not null and \"communication_message_templates\".\"approval_receipt_valid_until\" > \"communication_message_templates\".\"approval_receipt_issued_at\")"
+        },
+        "communication_message_templates_provider_receipt_valid": {
+          "name": "communication_message_templates_provider_receipt_valid",
+          "value": "(\"communication_message_templates\".\"provider_receipt_id\" is null and \"communication_message_templates\".\"provider_correlation_id\" is null and \"communication_message_templates\".\"provider_receipt_issued_at\" is null and \"communication_message_templates\".\"provider_receipt_valid_until\" is null) or (\"communication_message_templates\".\"provider_receipt_id\" is not null and \"communication_message_templates\".\"provider_correlation_id\" is not null and \"communication_message_templates\".\"provider_receipt_issued_at\" is not null and \"communication_message_templates\".\"provider_receipt_valid_until\" > \"communication_message_templates\".\"provider_receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_messages": {
+      "name": "communication_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "direction": {
+          "name": "direction",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sender_participant_id": {
+          "name": "sender_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "recipient_participant_id": {
+          "name": "recipient_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_messages_conversation_idx": {
+          "name": "communication_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "ordinal",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "communication_messages_external_reference_idx": {
+          "name": "communication_messages_external_reference_idx",
+          "columns": [
+            {
+              "expression": "external_message_reference",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_messages_conversation_channel_fk": {
+          "name": "communication_messages_conversation_channel_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_messages_sender_conversation_fk": {
+          "name": "communication_messages_sender_conversation_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "sender_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_messages_recipient_conversation_fk": {
+          "name": "communication_messages_recipient_conversation_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "recipient_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_messages_id_conversation_unique": {
+          "name": "communication_messages_id_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id"
+          ]
+        },
+        "communication_messages_conversation_ordinal_unique": {
+          "name": "communication_messages_conversation_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ]
+        }
+      },
+      "policies": {
+        "communication_messages_public_chat_scope": {
+          "name": "communication_messages_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_messages_communications_scope": {
+          "name": "communication_messages_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_messages_channel_valid": {
+          "name": "communication_messages_channel_valid",
+          "value": "\"communication_messages\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_messages_ordinal_positive": {
+          "name": "communication_messages_ordinal_positive",
+          "value": "\"communication_messages\".\"ordinal\" > 0"
+        },
+        "communication_messages_direction_valid": {
+          "name": "communication_messages_direction_valid",
+          "value": "\"communication_messages\".\"direction\" in ('inbound', 'outbound', 'system')"
+        },
+        "communication_messages_locale_valid": {
+          "name": "communication_messages_locale_valid",
+          "value": "\"communication_messages\".\"locale\" in ('es', 'en')"
+        },
+        "communication_messages_kind_valid": {
+          "name": "communication_messages_kind_valid",
+          "value": "\"communication_messages\".\"kind\" in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')"
+        },
+        "communication_messages_state_valid": {
+          "name": "communication_messages_state_valid",
+          "value": "\"communication_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "communication_messages_body_retention_valid": {
+          "name": "communication_messages_body_retention_valid",
+          "value": "(\"communication_messages\".\"body_retention_policy\" = 'metadata_only' and \"communication_messages\".\"body_stored\" = false and \"communication_messages\".\"body\" is null) or (\"communication_messages\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_messages\".\"body_stored\" = true and \"communication_messages\".\"body\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_outbound_commands": {
+      "name": "communication_outbound_commands",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_definition_version": {
+          "name": "template_definition_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "destination_key": {
+          "name": "destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_body_digest": {
+          "name": "message_body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_id": {
+          "name": "owning_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_operation": {
+          "name": "owning_operation",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_reference": {
+          "name": "owning_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_binding_id": {
+          "name": "owning_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_destination_key": {
+          "name": "owning_destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_receipt_issued_at": {
+          "name": "owning_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_receipt_valid_until": {
+          "name": "owning_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "required_fence": {
+          "name": "required_fence",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "endpoint_digests": {
+          "name": "endpoint_digests",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fingerprint": {
+          "name": "fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "failure_code": {
+          "name": "failure_code",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scheduled_at": {
+          "name": "scheduled_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_outbound_commands_work_idx": {
+          "name": "communication_outbound_commands_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "scheduled_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_outbound_commands_conversation_channel_fk": {
+          "name": "communication_outbound_commands_conversation_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_outbound_commands_binding_connection_channel_fk": {
+          "name": "communication_outbound_commands_binding_connection_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_outbound_commands_id_connection_unique": {
+          "name": "communication_outbound_commands_id_connection_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id"
+          ]
+        },
+        "communication_outbound_commands_id_binding_unique": {
+          "name": "communication_outbound_commands_id_binding_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "binding_id"
+          ]
+        },
+        "communication_outbound_commands_binding_key_unique": {
+          "name": "communication_outbound_commands_binding_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "communication_outbound_commands_communications_scope": {
+          "name": "communication_outbound_commands_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_outbound_commands_channel_valid": {
+          "name": "communication_outbound_commands_channel_valid",
+          "value": "\"communication_outbound_commands\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_outbound_commands_fingerprint_valid": {
+          "name": "communication_outbound_commands_fingerprint_valid",
+          "value": "\"communication_outbound_commands\".\"fingerprint\" is null or \"communication_outbound_commands\".\"fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_message_body_digest_valid": {
+          "name": "communication_outbound_commands_message_body_digest_valid",
+          "value": "\"communication_outbound_commands\".\"message_body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_token_hash_valid": {
+          "name": "communication_outbound_commands_lease_token_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_token_hash\" is null or \"communication_outbound_commands\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_owner_hash_valid": {
+          "name": "communication_outbound_commands_lease_owner_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_owner_id\" is null or \"communication_outbound_commands\".\"lease_owner_id\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_locale_valid": {
+          "name": "communication_outbound_commands_locale_valid",
+          "value": "\"communication_outbound_commands\".\"locale\" in ('es', 'en')"
+        },
+        "communication_outbound_commands_purpose_valid": {
+          "name": "communication_outbound_commands_purpose_valid",
+          "value": "\"communication_outbound_commands\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_outbound_commands_state_valid": {
+          "name": "communication_outbound_commands_state_valid",
+          "value": "\"communication_outbound_commands\".\"state\" in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_outbound_commands_policy_version_positive": {
+          "name": "communication_outbound_commands_policy_version_positive",
+          "value": "\"communication_outbound_commands\".\"expected_policy_version\" is null or \"communication_outbound_commands\".\"expected_policy_version\" > 0"
+        },
+        "communication_outbound_commands_required_fence_valid": {
+          "name": "communication_outbound_commands_required_fence_valid",
+          "value": "\"communication_outbound_commands\".\"required_fence\" is null or \"communication_outbound_commands\".\"required_fence\" >= 0"
+        },
+        "communication_outbound_commands_endpoint_digests_valid": {
+          "name": "communication_outbound_commands_endpoint_digests_valid",
+          "value": "jsonb_typeof(\"communication_outbound_commands\".\"endpoint_digests\") = 'array'"
+        },
+        "communication_outbound_commands_version_nonnegative": {
+          "name": "communication_outbound_commands_version_nonnegative",
+          "value": "\"communication_outbound_commands\".\"version\" >= 0"
+        },
+        "communication_outbound_commands_owning_receipt_window_valid": {
+          "name": "communication_outbound_commands_owning_receipt_window_valid",
+          "value": "(\"communication_outbound_commands\".\"owning_receipt_id\" is null and \"communication_outbound_commands\".\"owning_domain\" is null and \"communication_outbound_commands\".\"owning_operation\" is null and \"communication_outbound_commands\".\"owning_reference\" is null and \"communication_outbound_commands\".\"owning_binding_id\" is null and \"communication_outbound_commands\".\"owning_destination_key\" is null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" is null) or (\"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"owning_domain\" = 'communications' and \"communication_outbound_commands\".\"owning_operation\" = 'outbound_dispatch' and \"communication_outbound_commands\".\"owning_reference\" is not null and \"communication_outbound_commands\".\"owning_binding_id\" = \"communication_outbound_commands\".\"binding_id\" and \"communication_outbound_commands\".\"owning_destination_key\" = \"communication_outbound_commands\".\"destination_key\" and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is not null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\")"
+        },
+        "communication_outbound_commands_finalization_valid": {
+          "name": "communication_outbound_commands_finalization_valid",
+          "value": "\"communication_outbound_commands\".\"state\" = 'draft' or (\"communication_outbound_commands\".\"fingerprint\" is not null and \"communication_outbound_commands\".\"expected_policy_version\" is not null and \"communication_outbound_commands\".\"required_fence\" is not null and \"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"destination_key\" is not null)"
+        },
+        "communication_outbound_commands_destination_reference_opaque": {
+          "name": "communication_outbound_commands_destination_reference_opaque",
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or \"communication_outbound_commands\".\"destination_key\" ~ '^endpoint_ref:[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_owning_destination_valid": {
+          "name": "communication_outbound_commands_owning_destination_valid",
+          "value": "\"communication_outbound_commands\".\"owning_destination_key\" is null or \"communication_outbound_commands\".\"owning_destination_key\" ~ '^endpoint_ref:[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_owning_reference_valid": {
+          "name": "communication_outbound_commands_owning_reference_valid",
+          "value": "\"communication_outbound_commands\".\"owning_reference\" is null or \"communication_outbound_commands\".\"owning_reference\" ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'"
+        },
+        "communication_outbound_commands_lease_valid": {
+          "name": "communication_outbound_commands_lease_valid",
+          "value": "(\"communication_outbound_commands\".\"lease_owner_id\" is null and \"communication_outbound_commands\".\"lease_token_hash\" is null and \"communication_outbound_commands\".\"lease_expires_at\" is null) or (\"communication_outbound_commands\".\"lease_owner_id\" is not null and \"communication_outbound_commands\".\"lease_token_hash\" is not null and \"communication_outbound_commands\".\"lease_expires_at\" is not null)"
+        },
+        "communication_outbound_commands_expiry_valid": {
+          "name": "communication_outbound_commands_expiry_valid",
+          "value": "\"communication_outbound_commands\".\"expires_at\" is null or \"communication_outbound_commands\".\"expires_at\" > \"communication_outbound_commands\".\"created_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_participants": {
+      "name": "communication_participants",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_binding_id": {
+          "name": "channel_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "joined_at": {
+          "name": "joined_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "left_at": {
+          "name": "left_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_participants_conversation_idx": {
+          "name": "communication_participants_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "joined_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_participants_conversation_channel_fk": {
+          "name": "communication_participants_conversation_channel_fk",
+          "tableFrom": "communication_participants",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_participants_binding_channel_fk": {
+          "name": "communication_participants_binding_channel_fk",
+          "tableFrom": "communication_participants",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "channel_binding_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_participants_id_conversation_unique": {
+          "name": "communication_participants_id_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id"
+          ]
+        },
+        "communication_participants_id_conversation_channel_unique": {
+          "name": "communication_participants_id_conversation_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ]
+        }
+      },
+      "policies": {
+        "communication_participants_public_chat_scope": {
+          "name": "communication_participants_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_participants_communications_scope": {
+          "name": "communication_participants_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_participants_channel_valid": {
+          "name": "communication_participants_channel_valid",
+          "value": "\"communication_participants\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_participants_kind_valid": {
+          "name": "communication_participants_kind_valid",
+          "value": "\"communication_participants\".\"kind\" in ('external', 'automated', 'human', 'system')"
+        },
+        "communication_participants_membership_window_valid": {
+          "name": "communication_participants_membership_window_valid",
+          "value": "\"communication_participants\".\"left_at\" is null or \"communication_participants\".\"left_at\" >= \"communication_participants\".\"joined_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_provider_event_receipts": {
+      "name": "communication_provider_event_receipts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "external_event_reference": {
+          "name": "external_event_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body_digest": {
+          "name": "body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "signature_verified": {
+          "name": "signature_verified",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "outcome_reason": {
+          "name": "outcome_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "processing_version": {
+          "name": "processing_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "received_at": {
+          "name": "received_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "persisted_at": {
+          "name": "persisted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "processed_at": {
+          "name": "processed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_provider_event_receipts_work_idx": {
+          "name": "communication_provider_event_receipts_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "received_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_provider_event_receipts_connection_channel_fk": {
+          "name": "communication_provider_event_receipts_connection_channel_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_provider_event_receipts_id_connection_unique": {
+          "name": "communication_provider_event_receipts_id_connection_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id"
+          ]
+        },
+        "communication_provider_event_receipts_identity_unique": {
+          "name": "communication_provider_event_receipts_identity_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "external_event_reference"
+          ]
+        }
+      },
+      "policies": {
+        "communication_provider_event_receipts_communications_scope": {
+          "name": "communication_provider_event_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_provider_event_receipts_kind_valid": {
+          "name": "communication_provider_event_receipts_kind_valid",
+          "value": "\"communication_provider_event_receipts\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_provider_event_receipts_state_valid": {
+          "name": "communication_provider_event_receipts_state_valid",
+          "value": "\"communication_provider_event_receipts\".\"state\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')"
+        },
+        "communication_provider_event_receipts_signature_valid": {
+          "name": "communication_provider_event_receipts_signature_valid",
+          "value": "\"communication_provider_event_receipts\".\"signature_verified\" = true"
+        },
+        "communication_provider_event_receipts_channel_valid": {
+          "name": "communication_provider_event_receipts_channel_valid",
+          "value": "\"communication_provider_event_receipts\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_provider_event_receipts_schema_version_valid": {
+          "name": "communication_provider_event_receipts_schema_version_valid",
+          "value": "\"communication_provider_event_receipts\".\"schema_version\" = 'meta-envelope.v1'"
+        },
+        "communication_provider_event_receipts_external_event_reference_valid": {
+          "name": "communication_provider_event_receipts_external_event_reference_valid",
+          "value": "\"communication_provider_event_receipts\".\"external_event_reference\" ~ '^meta_evt_[0-9a-f]{32,64}$'"
+        },
+        "communication_provider_event_receipts_body_digest_valid": {
+          "name": "communication_provider_event_receipts_body_digest_valid",
+          "value": "\"communication_provider_event_receipts\".\"body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_lease_token_hash_valid": {
+          "name": "communication_provider_event_receipts_lease_token_hash_valid",
+          "value": "\"communication_provider_event_receipts\".\"lease_token_hash\" is null or \"communication_provider_event_receipts\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_processing_version_nonnegative": {
+          "name": "communication_provider_event_receipts_processing_version_nonnegative",
+          "value": "\"communication_provider_event_receipts\".\"processing_version\" >= 0"
+        },
+        "communication_provider_event_receipts_lease_valid": {
+          "name": "communication_provider_event_receipts_lease_valid",
+          "value": "(\"communication_provider_event_receipts\".\"lease_owner_id\" is null and \"communication_provider_event_receipts\".\"lease_token_hash\" is null and \"communication_provider_event_receipts\".\"lease_expires_at\" is null) or (\"communication_provider_event_receipts\".\"lease_owner_id\" is not null and \"communication_provider_event_receipts\".\"lease_token_hash\" is not null and \"communication_provider_event_receipts\".\"lease_expires_at\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_provider_status_receipts": {
+      "name": "communication_provider_status_receipts",
+      "schema": "",
+      "columns": {
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_event_id": {
+          "name": "provider_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk": {
+          "name": "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk",
+          "tableFrom": "communication_provider_status_receipts",
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {
+        "communication_provider_status_receipts_command_event_pk": {
+          "name": "communication_provider_status_receipts_command_event_pk",
+          "columns": [
+            "command_id",
+            "provider_event_id"
+          ]
+        }
+      },
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_provider_status_receipts_communications_scope": {
+          "name": "communication_provider_status_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_provider_status_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )",
+          "withCheck": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_provider_status_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )"
+        }
+      },
+      "checkConstraints": {
+        "communication_provider_status_receipts_status_valid": {
+          "name": "communication_provider_status_receipts_status_valid",
+          "value": "\"communication_provider_status_receipts\".\"status\" in ('sent', 'delivered', 'read', 'failed')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_citations": {
+      "name": "public_chat_citations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_id": {
+          "name": "source_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "title": {
+          "name": "title",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "path": {
+          "name": "path",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "summary": {
+          "name": "summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "disclosure": {
+          "name": "disclosure",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_kind": {
+          "name": "source_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_citations_message_id_communication_messages_id_fk": {
+          "name": "public_chat_citations_message_id_communication_messages_id_fk",
+          "tableFrom": "public_chat_citations",
+          "tableTo": "communication_messages",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_citations_message_source_unique": {
+          "name": "public_chat_citations_message_source_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "message_id",
+            "source_id"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_citations_server_gateway_only": {
+          "name": "public_chat_citations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "exists (\n    select 1\n    from communication_messages message\n    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id\n    where message.id = \"public_chat_citations\".\"message_id\"\n      and message.channel_kind = 'public_web'\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "exists (\n    select 1\n    from communication_messages message\n    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id\n    where message.id = \"public_chat_citations\".\"message_id\"\n      and message.channel_kind = 'public_web'\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_citations_locale_valid": {
+          "name": "public_chat_citations_locale_valid",
+          "value": "\"public_chat_citations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_citations_source_kind_valid": {
+          "name": "public_chat_citations_source_kind_valid",
+          "value": "\"public_chat_citations\".\"source_kind\" is null or \"public_chat_citations\".\"source_kind\" = 'provider'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversation_sessions": {
+      "name": "public_chat_conversation_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'public_web'"
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversation_sessions_session_idx": {
+          "name": "public_chat_conversation_sessions_session_idx",
+          "columns": [
+            {
+              "expression": "session_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "public_chat_sessions",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "public_chat_conversation_sessions_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "public_chat_conversation_sessions_participant_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_participant_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversation_sessions_conversation_unique": {
+          "name": "public_chat_conversation_sessions_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id"
+          ]
+        },
+        "public_chat_conversation_sessions_session_start_key_unique": {
+          "name": "public_chat_conversation_sessions_session_start_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_conversation_sessions_public_chat_scope": {
+          "name": "public_chat_conversation_sessions_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')",
+          "withCheck": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversation_sessions_start_fingerprint_valid": {
+          "name": "public_chat_conversation_sessions_start_fingerprint_valid",
+          "value": "\"public_chat_conversation_sessions\".\"start_fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "public_chat_conversation_sessions_channel_valid": {
+          "name": "public_chat_conversation_sessions_channel_valid",
+          "value": "\"public_chat_conversation_sessions\".\"channel_kind\" = 'public_web'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_idempotency": {
+      "name": "public_chat_idempotency",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_kind": {
+          "name": "command_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_fingerprint": {
+          "name": "command_fingerprint",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_version": {
+          "name": "expected_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result": {
+          "name": "result",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_idempotency_lease_idx": {
+          "name": "public_chat_idempotency_lease_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_idempotency_conversation_id_communication_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_communication_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_idempotency_conversation_key_unique": {
+          "name": "public_chat_idempotency_conversation_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_idempotency_server_gateway_only": {
+          "name": "public_chat_idempotency_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"public_chat_idempotency\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"public_chat_idempotency\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_idempotency_state_valid": {
+          "name": "public_chat_idempotency_state_valid",
+          "value": "\"public_chat_idempotency\".\"state\" in ('in_progress', 'completed')"
+        },
+        "public_chat_idempotency_command_kind_valid": {
+          "name": "public_chat_idempotency_command_kind_valid",
+          "value": "\"public_chat_idempotency\".\"command_kind\" in ('message', 'handoff', 'locale', 'close')"
+        },
+        "public_chat_idempotency_completion_valid": {
+          "name": "public_chat_idempotency_completion_valid",
+          "value": "(\"public_chat_idempotency\".\"state\" = 'completed' and \"public_chat_idempotency\".\"result\" is not null and \"public_chat_idempotency\".\"completed_at\" is not null) or (\"public_chat_idempotency\".\"state\" = 'in_progress' and \"public_chat_idempotency\".\"completed_at\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_rate_limits": {
+      "name": "public_chat_rate_limits",
+      "schema": "",
+      "columns": {
+        "bucket_hash": {
+          "name": "bucket_hash",
+          "type": "char(64)",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "count": {
+          "name": "count",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "window_started_at": {
+          "name": "window_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_rate_limits_expiry_idx": {
+          "name": "public_chat_rate_limits_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_rate_limits_server_gateway_only": {
+          "name": "public_chat_rate_limits_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_rate_limits_count_positive": {
+          "name": "public_chat_rate_limits_count_positive",
+          "value": "\"public_chat_rate_limits\".\"count\" > 0"
+        },
+        "public_chat_rate_limits_window_valid": {
+          "name": "public_chat_rate_limits_window_valid",
+          "value": "\"public_chat_rate_limits\".\"expires_at\" > \"public_chat_rate_limits\".\"window_started_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_sessions": {
+      "name": "public_chat_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_hash": {
+          "name": "session_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "csrf_hash": {
+          "name": "csrf_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revoked_at": {
+          "name": "revoked_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_sessions_expiry_idx": {
+          "name": "public_chat_sessions_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_sessions_session_hash_unique": {
+          "name": "public_chat_sessions_session_hash_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_hash"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_sessions_server_gateway_only": {
+          "name": "public_chat_sessions_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {},
+      "isRLSEnabled": true
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "views": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
index 4ce159c..d84e309 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -85,13 +85,20 @@
       "when": 1787254199495,
       "tag": "0011_m004_receipt_security_hardening",
       "breakpoints": true
     },
     {
       "idx": 12,
       "version": "7",
       "when": 1787255710919,
       "tag": "0012_m004_inbound_processing_version_parity",
       "breakpoints": true
+    },
+    {
+      "idx": 13,
+      "version": "7",
+      "when": 1787256657727,
+      "tag": "0013_m004_contact_withdrawal_evidence",
+      "breakpoints": true
     }
   ]
 }
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
index 84b04f7..1bcbfc0 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -1236,60 +1236,102 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       if (evidence.source === "inbound_event") {
         const source = await query<{ valid: boolean }>(
           tx,
           `select true as valid from communication_event_envelopes envelope
            join communication_provider_event_receipts receipt on receipt.id = envelope.receipt_id
            where receipt.id = $1 and envelope.binding_id = $2 and receipt.correlation_id = $3`,
           [evidence.receipt.eventId, input.bindingId, receipt.correlationId],
         );
         if (!source[0]) return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
       }
+      const storedEvidence = (
+        await query<{
+          id: string;
+          binding_id: string;
+          owning_domain: string;
+          authority_role: string;
+          triggering_event_id: string | null;
+          correlation_id: string;
+          receipt_issued_at: Date;
+          receipt_valid_until: Date;
+        }>(
+          tx,
+          `select id, binding_id, owning_domain, authority_role, triggering_event_id,
+             correlation_id, receipt_issued_at, receipt_valid_until
+           from communication_contact_evidence_events
+           where evidence_receipt_id = $1 and event_kind = 'contact_withdrawal_recorded'
+           for update`,
+          [receipt.receiptId],
+        )
+      )[0];
+      const expectedDomain = evidence.source === "inbound_event" ? "M004" : "M078";
+      const expectedRole = evidence.source === "inbound_event" ? "channel_policy_detection" : "consent";
+      const expectedEventId = evidence.source === "inbound_event" ? evidence.receipt.eventId : null;
+      const storedEvidenceMatches = storedEvidence &&
+        storedEvidence.binding_id === input.bindingId &&
+        storedEvidence.owning_domain === expectedDomain &&
+        storedEvidence.authority_role === expectedRole &&
+        storedEvidence.triggering_event_id === expectedEventId &&
+        storedEvidence.correlation_id === receipt.correlationId &&
+        storedEvidence.receipt_issued_at.getTime() === receipt.issuedAt.getTime() &&
+        storedEvidence.receipt_valid_until.getTime() === receipt.expiresAt.getTime();
+      if (storedEvidence && !storedEvidenceMatches) {
+        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
+      }
       if (policies.length > 0 && policies.every((policy) => policy.fence_state === "withdrawn")) {
         return {
           status: "duplicate",
           state: "withdrawn",
           policyVersion: policies[0]!.version,
           fence: policies[0]!.fence,
           cancelledCommandIds: [],
         } as const;
       }
       const evidencePolicies = policies.filter((policy) => policy.fence_state !== "withdrawn");
       if (evidencePolicies.length === 0) {
         return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
       }
+      if (storedEvidence) {
+        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
+      }
+      const contactEvidence = await this.appendContactWithdrawalEvidence(tx, {
+        bindingId: input.bindingId,
+        receiptId: receipt.receiptId,
+        owningDomain: expectedDomain,
+        authorityRole: expectedRole,
+        triggeringEventId: expectedEventId ?? undefined,
+        correlationId: receipt.correlationId,
+        issuedAt: receipt.issuedAt,
+        expiresAt: receipt.expiresAt,
+        occurredAt: input.now,
+      });
+      if (!contactEvidence) {
+        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
+      }
       for (const evidencePolicy of evidencePolicies) {
         const latestConsent = (
-          await query<{ authority_version: number }>(
+          await query<{ authority_version: number; consent_state: string }>(
             tx,
-            `select authority_version from communication_contact_evidence_events
+            `select authority_version, consent_state from communication_contact_evidence_events
              where binding_id = $1 and purpose = $2
                and event_kind in ('consent_granted', 'consent_regranted', 'consent_withdrawn')
              order by sequence desc limit 1 for update`,
             [input.bindingId, evidencePolicy.purpose],
           )
         )[0];
-        await this.appendEvidence(tx, {
+        if (!latestConsent || latestConsent.consent_state !== "granted") continue;
+        await this.appendConsentWithdrawalProjection(tx, {
           bindingId: input.bindingId,
-          eventKind: "consent_withdrawn",
           purpose: evidencePolicy.purpose,
-          consentState: "withdrawn",
-          fenceState: "withdrawn",
-          receiptId: receipt.receiptId,
-          receiptKind: "contact_withdrawal",
-          owningDomain: evidence.source === "inbound_event" ? "M004" : "M078",
-          authorityRole: evidence.source === "inbound_event" ? "channel_policy_detection" : "consent",
-          authorityVersion: (latestConsent?.authority_version ?? 0) + 1,
-          correlationId: receipt.correlationId,
-          issuedAt: receipt.issuedAt,
-          expiresAt: receipt.expiresAt,
+          authorityVersion: latestConsent.authority_version + 1,
+          contactEvidenceEventId: contactEvidence.id,
           occurredAt: input.now,
-          triggeringEventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
         });
       }
       const cancelled = await query<{ id: string }>(
         tx,
         `update communication_outbound_commands set state = 'cancelled',
            failure_code = 'contact_policy_denied', version = version + 1, updated_at = $2
          where binding_id = $1 and state = 'queued' returning id`,
         [input.bindingId, input.now],
       );
       await query(
@@ -1747,21 +1789,21 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       const [inbound, outbound, attempts, policies, bindings, consentHistory, templates, statuses, withdrawals] =
         await Promise.all([
           query<Record<string, unknown>>(tx, `select receipt.id as "eventId", receipt.state, receipt.processing_version as "leaseVersion", message.ordinal from communication_provider_event_receipts receipt join communication_event_envelopes envelope on envelope.receipt_id = receipt.id join communication_messages message on message.id = envelope.message_id order by receipt.id`),
           query<Record<string, unknown>>(tx, `select id as "commandId", state, version as "leaseVersion", failure_code as "failureCode" from communication_outbound_commands order by id`),
           query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, case result_code when 'failed' then 'known_failure' when 'dispatch_unknown' then 'unknown' else result_code end as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
           query<Record<string, unknown>>(tx, `select id as "policyId", binding_id as "bindingId", fence_state as state, version, fence, updated_at as "updatedAt" from communication_contact_policies order by id`),
           query<Record<string, unknown>>(tx, `select id as "bindingId", channel_kind as channel, trust_state as "trustState", verification_expires_at as "freshUntil", created_at as "createdAt", updated_at as "updatedAt" from communication_contact_bindings order by id`),
           query<Record<string, unknown>>(tx, `select binding_id as "bindingId", purpose, consent_state as state, authority_version as version, case when event_kind = 'consent_withdrawn' then null else evidence_receipt_id end as "authorityReceiptId", occurred_at as "changedAt" from communication_contact_evidence_events where purpose is not null order by binding_id, sequence`),
           query<Record<string, unknown>>(tx, `select template_key as "templateId", locale, definition_version as "definitionVersion", internally_approved as "internallyApproved", approval_receipt_id as "approvalReceiptId", provider_receipt_id as "providerReceiptId", provider_correlation_id as "providerCorrelationId", state as "providerState", projection_version as "providerVersion", updated_at as "updatedAt" from communication_message_templates order by template_key, locale`),
           query<Record<string, unknown>>(tx, `select command_id as "commandId", provider_event_id as "providerEventId", status, occurred_at as "occurredAt" from communication_provider_status_receipts order by command_id, provider_event_id`),
-          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", triggering_event_id as "eventId", correlation_id as "correlationId", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'consent_withdrawn' order by binding_id, sequence`),
+          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", triggering_event_id as "eventId", correlation_id as "correlationId", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'contact_withdrawal_recorded' order by binding_id, sequence`),
         ]);
       return {
         inbound,
         outbound,
         attempts,
         policies: policies as unknown as CommunicationsReferenceState["policies"],
         bindings: bindings as unknown as CommunicationsReferenceState["bindings"],
         consentHistory: consentHistory.map((record) =>
           record.authorityReceiptId === null
             ? { ...record, authorityReceiptId: undefined }
@@ -2039,11 +2081,94 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
         input.authorityRole,
         input.authorityVersion,
         input.triggeringEventId ?? null,
         input.correlationId,
         input.issuedAt,
         input.expiresAt,
         input.occurredAt,
       ],
     );
   }
+
+  private async appendContactWithdrawalEvidence(
+    tx: TransactionSql,
+    input: {
+      bindingId: string;
+      receiptId: string;
+      owningDomain: string;
+      authorityRole: string;
+      triggeringEventId?: string;
+      correlationId: string;
+      issuedAt: Date;
+      expiresAt: Date;
+      occurredAt: Date;
+    },
+  ): Promise<{ id: string } | undefined> {
+    const sequence = (
+      await query<{ sequence: number }>(
+        tx,
+        `select coalesce(max(sequence), 0)::integer + 1 as sequence
+         from communication_contact_evidence_events where binding_id = $1`,
+        [input.bindingId],
+      )
+    )[0]?.sequence ?? 1;
+    const id = `evidence_${sha256(`${input.bindingId}:${input.receiptId}:contact`).slice(0, 24)}`;
+    return (
+      await query<{ id: string }>(
+        tx,
+        `insert into communication_contact_evidence_events (
+          id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+          binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
+          owning_domain, authority_role, authority_version, contact_evidence_event_id,
+          triggering_event_id, policy_version, correlation_id, receipt_issued_at,
+          receipt_valid_until, occurred_at, created_at
+        ) values ($1, $2, $3, 'contact_withdrawal_recorded', null, null, null,
+          null, null, $4, 'contact_withdrawal', $5, $6, null, null, $7, null,
+          $8, $9, $10, $11, $11)
+        on conflict (evidence_receipt_id) do nothing returning id`,
+        [id, input.bindingId, sequence, input.receiptId, input.owningDomain,
+          input.authorityRole, input.triggeringEventId ?? null, input.correlationId,
+          input.issuedAt, input.expiresAt, input.occurredAt],
+      )
+    )[0];
+  }
+
+  private async appendConsentWithdrawalProjection(
+    tx: TransactionSql,
+    input: {
+      bindingId: string;
+      purpose: string;
+      authorityVersion: number;
+      contactEvidenceEventId: string;
+      occurredAt: Date;
+    },
+  ): Promise<void> {
+    const sequence = (
+      await query<{ sequence: number }>(
+        tx,
+        `select coalesce(max(sequence), 0)::integer + 1 as sequence
+         from communication_contact_evidence_events where binding_id = $1`,
+        [input.bindingId],
+      )
+    )[0]?.sequence ?? 1;
+    await query(
+      tx,
+      `insert into communication_contact_evidence_events (
+        id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+        binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
+        owning_domain, authority_role, authority_version, contact_evidence_event_id,
+        triggering_event_id, policy_version, correlation_id, receipt_issued_at,
+        receipt_valid_until, occurred_at, created_at
+      ) values ($1, $2, $3, 'consent_withdrawn', $4, 'withdrawn', 'withdrawn',
+        null, null, null, null, null, null, $5, $6, null, null, null, null, null, $7, $7)`,
+      [
+        `evidence_${sha256(`${input.bindingId}:${sequence}`).slice(0, 24)}`,
+        input.bindingId,
+        sequence,
+        input.purpose,
+        input.authorityVersion,
+        input.contactEvidenceEventId,
+        input.occurredAt,
+      ],
+    );
+  }
 }
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index 01de2d0..d474510 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -468,54 +468,69 @@ export const communicationContactEvidenceEvents = pgTable(
     bindingId: text("binding_id")
       .notNull()
       .references(() => communicationContactBindings.id, { onDelete: "cascade" }),
     sequence: bigint("sequence", { mode: "number" }).notNull(),
     eventKind: varchar("event_kind", { length: 40 }).notNull(),
     purpose: varchar("purpose", { length: 24 }),
     consentState: varchar("consent_state", { length: 24 }),
     fenceState: varchar("fence_state", { length: 24 }),
     bindingTrustState: varchar("binding_trust_state", { length: 32 }),
     reviewResolution: varchar("review_resolution", { length: 16 }),
-    evidenceReceiptId: text("evidence_receipt_id").notNull(),
-    receiptKind: varchar("receipt_kind", { length: 40 }).notNull(),
-    owningDomain: varchar("owning_domain", { length: 80 }).notNull(),
-    authorityRole: varchar("authority_role", { length: 32 }).notNull(),
+    evidenceReceiptId: text("evidence_receipt_id"),
+    receiptKind: varchar("receipt_kind", { length: 40 }),
+    owningDomain: varchar("owning_domain", { length: 80 }),
+    authorityRole: varchar("authority_role", { length: 32 }),
     authorityVersion: integer("authority_version"),
+    contactEvidenceEventId: text("contact_evidence_event_id"),
     triggeringEventId: text("triggering_event_id"),
     policyVersion: varchar("policy_version", { length: 80 }),
-    correlationId: text("correlation_id").notNull(),
+    correlationId: text("correlation_id"),
     receiptIssuedAt: timestamp("receipt_issued_at", { withTimezone: true, mode: "date" }),
     receiptValidUntil: timestamp("receipt_valid_until", { withTimezone: true, mode: "date" }),
     occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     unique("communication_contact_evidence_events_binding_sequence_unique").on(
       table.bindingId,
       table.sequence,
     ),
     unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId),
+    unique("communication_contact_evidence_events_id_binding_unique").on(table.id, table.bindingId),
+    foreignKey({
+      name: "communication_contact_evidence_events_contact_binding_fk",
+      columns: [table.contactEvidenceEventId, table.bindingId],
+      foreignColumns: [table.id, table.bindingId],
+    }).onDelete("restrict"),
     check(
       "communication_contact_evidence_events_kind_valid",
-      sql`${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')`,
+      sql`${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'contact_withdrawal_recorded', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')`,
     ),
     check(
       "communication_contact_evidence_events_authority_valid",
-      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} = 'consent_withdrawn' and ((${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.owningDomain} = 'M004' and ${table.authorityRole} = 'channel_policy_detection'))) or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
+      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} = 'contact_withdrawal_recorded' and ((${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.owningDomain} = 'M004' and ${table.authorityRole} = 'channel_policy_detection'))) or (${table.eventKind} = 'consent_withdrawn' and ${table.owningDomain} is null and ${table.authorityRole} is null) or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
     ),
     check(
       "communication_contact_evidence_events_receipt_valid",
-      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.receiptKind} = 'consent_evidence') or (${table.eventKind} = 'consent_withdrawn' and ${table.receiptKind} = 'contact_withdrawal') or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.receiptKind} = 'ambiguous_opt_out_detection') or (${table.eventKind} in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.receiptKind} = 'ambiguous_opt_out_resolution') or (${table.eventKind} = 'binding_suspended' and ${table.receiptKind} = 'binding_suspension') or (${table.eventKind} = 'binding_revalidated' and ${table.receiptKind} = 'binding_revalidation')`,
+      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.receiptKind} = 'consent_evidence') or (${table.eventKind} = 'contact_withdrawal_recorded' and ${table.receiptKind} = 'contact_withdrawal') or (${table.eventKind} = 'consent_withdrawn' and ${table.receiptKind} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.receiptKind} = 'ambiguous_opt_out_detection') or (${table.eventKind} in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.receiptKind} = 'ambiguous_opt_out_resolution') or (${table.eventKind} = 'binding_suspended' and ${table.receiptKind} = 'binding_suspension') or (${table.eventKind} = 'binding_revalidated' and ${table.receiptKind} = 'binding_revalidation')`,
     ),
     check(
       "communication_contact_evidence_events_state_shape_valid",
-      sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ((${table.owningDomain} = 'M078' and ${table.triggeringEventId} is null) or (${table.owningDomain} = 'M004' and ${table.triggeringEventId} is not null)) and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
+      sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'contact_withdrawal_recorded' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.authorityVersion} is null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ((${table.owningDomain} = 'M078' and ${table.triggeringEventId} is null) or (${table.owningDomain} = 'M004' and ${table.triggeringEventId} is not null)) and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
+    ),
+    check(
+      "communication_contact_evidence_events_contact_link_valid",
+      sql`(${table.eventKind} = 'consent_withdrawn' and ${table.contactEvidenceEventId} is not null) or (${table.eventKind} <> 'consent_withdrawn' and ${table.contactEvidenceEventId} is null)`,
+    ),
+    check(
+      "communication_contact_evidence_events_receipt_owner_valid",
+      sql`(${table.eventKind} = 'consent_withdrawn' and ${table.evidenceReceiptId} is null and ${table.receiptKind} is null and ${table.owningDomain} is null and ${table.authorityRole} is null and ${table.correlationId} is null and ${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.eventKind} <> 'consent_withdrawn' and ${table.evidenceReceiptId} is not null and ${table.receiptKind} is not null and ${table.owningDomain} is not null and ${table.authorityRole} is not null and ${table.correlationId} is not null)`,
     ),
     check("communication_contact_evidence_events_sequence_positive", sql`${table.sequence} > 0`),
     check(
       "communication_contact_evidence_events_receipt_window_valid",
       sql`(${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.receiptIssuedAt} is not null and ${table.receiptValidUntil} is not null and ${table.receiptValidUntil} > ${table.receiptIssuedAt})`,
     ),
     index("communication_contact_evidence_events_binding_idx").on(table.bindingId, table.sequence),
     pgPolicy("communication_contact_evidence_events_communications_select", {
       as: "permissive",
       for: "select",
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 2df0204..3451b44 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -1082,20 +1082,30 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         receipt.operation !== "inbound_opt_out" ||
         !inbound ||
         inbound.envelope.event.bindingId !== input.bindingId ||
         receipt.correlationId !== inbound.envelope.event.correlationId
       ) {
         return { status: "denied", code: "withdrawal_evidence_invalid" };
       }
     } else if (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal") {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
+    const prior = this.withdrawalHistory.find((record) => record.receiptId === receipt.receiptId);
+    if (
+      prior &&
+      (prior.bindingId !== input.bindingId ||
+        prior.source !== evidence.source ||
+        prior.correlationId !== receipt.correlationId ||
+        prior.eventId !== (evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined))
+    ) {
+      return { status: "denied", code: "withdrawal_evidence_invalid" };
+    }
     return {
       status: "allowed",
       record: {
         bindingId: input.bindingId,
         source: evidence.source,
         receiptId: receipt.receiptId,
         eventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
         correlationId: receipt.correlationId,
         changedAt: input.now,
       },
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
index c8b7cf1..4d4571d 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
@@ -35,59 +35,64 @@ async function seedScenario(scenario: string): Promise<void> {
         id, channel_kind, adapter_key, readiness_state, policy_version, version,
         configured_at, verified_at, suspended_at, created_at, updated_at
       ) values (
         ${ids.connectionId}, 'whatsapp', 'meta_cloud', 'active', 'synthetic.v1', 1,
         ${primaryBinding.createdAt}, ${primaryBinding.createdAt}, null,
         ${primaryBinding.createdAt}, ${primaryBinding.updatedAt}
       ) on conflict (id) do nothing
     `;
     for (const [index, binding] of seed.bindings!.entries()) {
       const policy = seed.policies![index]!;
-      const consent = seed.consents![index]!;
+      const consents = seed.consents!.filter((consent) => consent.bindingId === binding.bindingId);
     await tx`
       insert into communication_contact_bindings (
         id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
         trust_state, locale, contact_policy_version, version, verification_receipt_id,
         endpoint_verified_at, verification_expires_at, wrong_person_reported_at,
         reassignment_risk_at, suspended_at, created_at, updated_at
       ) values (
         ${binding.bindingId}, ${ids.connectionId}, 'whatsapp', ${"b".repeat(64)},
         'endpoint.v1', ${binding.trustState}, 'en', ${policy.version}, 1,
         ${`verification_${ids.bindingId}`}, ${binding.createdAt}, ${binding.freshUntil},
         null, null, null, ${binding.createdAt}, ${binding.updatedAt}
       ) on conflict (id) do nothing
     `;
-    await tx`
-      insert into communication_contact_policies (
-        id, binding_id, purpose, consent_state, fence_state, decision_code,
-        evidence_receipt_id, version, fence, evaluated_at, created_at, updated_at
-      ) values (
-        ${policy.policyId}, ${binding.bindingId}, 'transactional', ${consent.state},
-        ${policy.state}, 'allowed', ${consent.receipt!.receiptId}, ${policy.version},
-        ${policy.fence}, ${policy.updatedAt}, ${binding.createdAt}, ${policy.updatedAt}
-      ) on conflict (binding_id, purpose) do nothing
-    `;
-    await tx`
-      insert into communication_contact_evidence_events (
-        id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
-        binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
-        owning_domain, authority_role, authority_version, triggering_event_id,
-        policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
-        occurred_at, created_at
-      ) values (
-        ${`evidence_${ids.bindingId}`}, ${binding.bindingId}, 1, 'consent_granted',
-        'transactional', 'granted', 'normal', null, null, ${consent.receipt!.receiptId},
-        'consent_evidence', 'M078', 'consent', ${consent.version}, null, null,
-        ${`consent_correlation_${ids.bindingId}`}, ${consent.receipt!.issuedAt},
-        ${consent.receipt!.expiresAt}, ${consent.changedAt}, ${consent.changedAt}
-      ) on conflict (evidence_receipt_id) do nothing
-    `;
+      for (const [consentIndex, consent] of consents.entries()) {
+        await tx`
+          insert into communication_contact_policies (
+            id, binding_id, purpose, consent_state, fence_state, decision_code,
+            evidence_receipt_id, version, fence, evaluated_at, created_at, updated_at
+          ) values (
+            ${`${policy.policyId}_${consent.purpose}`}, ${binding.bindingId}, ${consent.purpose},
+            ${consent.state}, ${policy.state}, 'allowed', ${consent.receipt!.receiptId},
+            ${policy.version}, ${policy.fence}, ${policy.updatedAt}, ${binding.createdAt},
+            ${policy.updatedAt}
+          ) on conflict (binding_id, purpose) do nothing
+        `;
+        await tx`
+          insert into communication_contact_evidence_events (
+            id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+            binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
+            owning_domain, authority_role, authority_version, triggering_event_id,
+            policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+            occurred_at, created_at
+          ) values (
+            ${`evidence_${ids.bindingId}_${consent.purpose}`}, ${binding.bindingId},
+            ${consentIndex + 1}, 'consent_granted', ${consent.purpose}, 'granted', 'normal',
+            null, null, ${consent.receipt!.receiptId}, 'consent_evidence', 'M078',
+            'consent', ${consent.version}, null, null,
+            ${`consent_correlation_${ids.bindingId}_${consent.purpose}`},
+            ${consent.receipt!.issuedAt}, ${consent.receipt!.expiresAt},
+            ${consent.changedAt}, ${consent.changedAt}
+          ) on conflict (evidence_receipt_id) do nothing
+        `;
+      }
     }
     await tx`
       insert into communication_message_templates (
         id, template_key, locale, purpose, definition_source, definition_version,
         variable_keys, state, internally_approved, approval_receipt_id,
         approval_receipt_issued_at, approval_receipt_valid_until, external_reference,
         projection_version, provider_receipt_id, provider_correlation_id,
         provider_receipt_issued_at, provider_receipt_valid_until, category,
         observed_at, created_at, updated_at
       ) values (
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
index 2733c68..b9b9f37 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
@@ -98,20 +98,37 @@ describe("Postgres communications transaction contract", () => {
   });
 
   it("uses exhaustive domain-to-database outcome and reconciliation vocabularies", () => {
     expect(storeSource).toContain('known_failure: { state: "failed", resultCode: "failed" }');
     expect(storeSource).toContain('unknown: { state: "dispatch_unknown", resultCode: "dispatch_unknown" }');
     expect(schemaSource).toContain("('provider_lookup', 'manual_authority')");
     expect(schemaSource).toContain("('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')");
     expect(storeSource.match(/evaluateOutboundPolicy\(/gu)).toHaveLength(2);
   });
 
+  it("owns each contact withdrawal receipt once and links purpose-local projections", () => {
+    const withdrawSource = storeSource.slice(
+      storeSource.indexOf("async withdrawContact("),
+      storeSource.indexOf("async resolveAmbiguousOptOutFromReceipt("),
+    );
+    expect(schemaSource).toContain('contactEvidenceEventId: text("contact_evidence_event_id")');
+    expect(schemaSource).toContain("'contact_withdrawal_recorded'");
+    expect(schemaSource).toContain(
+      'unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId)',
+    );
+    expect(schemaSource).toContain("communication_contact_evidence_events_contact_binding_fk");
+    expect(withdrawSource.match(/appendContactWithdrawalEvidence\(/gu)).toHaveLength(1);
+    expect(withdrawSource).toContain("contactEvidenceEventId: contactEvidence.id");
+    expect(storeSource).toContain("on conflict (evidence_receipt_id) do nothing");
+    expect(storeSource).toContain("where event_kind = 'contact_withdrawal_recorded'");
+  });
+
   it("hardens both receipt tables with scoped policy, FORCE RLS, revokes, and least privilege", () => {
     expect(schemaSource).toContain("communicationsCommandScope(table.commandId)");
     const securityMigration = readFileSync(
       fileURLToPath(new URL("../../drizzle/0011_m004_receipt_security_hardening.sql", import.meta.url)),
       "utf8",
     );
     for (const table of [
       "communication_provider_status_receipts",
       "communication_dispatch_reconciliation_receipts",
     ]) {
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
index 0c2abe3..87562e7 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -284,20 +284,22 @@ describe("M004 canonical communications Drizzle schema", () => {
       communicationContactPolicies: [
         "communication_contact_policies_purpose_valid",
         "communication_contact_policies_consent_valid",
         "communication_contact_policies_fence_valid",
       ],
       communicationContactEvidenceEvents: [
         "communication_contact_evidence_events_kind_valid",
         "communication_contact_evidence_events_authority_valid",
         "communication_contact_evidence_events_receipt_valid",
         "communication_contact_evidence_events_state_shape_valid",
+        "communication_contact_evidence_events_contact_link_valid",
+        "communication_contact_evidence_events_receipt_owner_valid",
         "communication_contact_evidence_events_sequence_positive",
       ],
       communicationConversations: [
         "communication_conversations_channel_valid",
         "communication_conversations_locale_valid",
         "communication_conversations_status_valid",
         "communication_conversations_version_positive",
       ],
       communicationParticipants: ["communication_participants_kind_valid"],
       communicationMessages: [
@@ -557,30 +559,31 @@ describe("M004 canonical communications Drizzle schema", () => {
   });
 });
 
 describe("M004 generated migration authority and canonical cutover", () => {
   it("records generated metadata for bootstrap, backfill, guarded cutover and canonical structure", () => {
     const migrations = currentM004Migrations();
     const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
     const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
       entries: Array<{ idx: number; tag: string }>;
     };
-    expect(journal.entries.slice(-7).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
+    expect(journal.entries.slice(-8).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
       { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
       { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
       { idx: 8, tag: "0008_m004_communications_backfill" },
       { idx: 9, tag: "0009_m004_communications_cutover_guard" },
       { idx: 10, tag: "0010_m004_communications_canonical_cutover" },
       { idx: 11, tag: "0011_m004_receipt_security_hardening" },
       { idx: 12, tag: "0012_m004_inbound_processing_version_parity" },
+      { idx: 13, tag: "0013_m004_contact_withdrawal_evidence" },
     ]);
-    for (const index of ["0006", "0007", "0008", "0009", "0010", "0011", "0012"]) {
+    for (const index of ["0006", "0007", "0008", "0009", "0010", "0011", "0012", "0013"]) {
       expect(
         existsSync(
           fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
         ),
       ).toBe(true);
     }
   });
 
   it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
     const { bootstrap, structural, backfill } = currentM004Migrations();
diff --git a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
index fc54101..ae33909 100644
--- a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
+++ b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
@@ -51,40 +51,48 @@ export function communicationsConformanceSeed(scenario: string): CommunicationsS
     updatedAt: CONFORMANCE_NOW,
   });
   const policy = (bindingId: string, discriminator: string) => ({
     policyId: `policy_${discriminator}_${suffix(scenario)}`,
     bindingId,
     state: "normal" as const,
     version: 7,
     fence: 42,
     updatedAt: CONFORMANCE_NOW,
   });
-  const consent = (bindingId: string, discriminator: string) => ({
+  const consent = (
+    bindingId: string,
+    discriminator: string,
+    purpose: "transactional" | "service" = "transactional",
+  ) => ({
     bindingId,
-    purpose: "transactional" as const,
+    purpose,
     state: "granted" as const,
     version: 1,
     receipt: {
-      receiptId: `consent_${discriminator}_${suffix(scenario)}`,
+      receiptId: `consent_${discriminator}_${purpose}_${suffix(scenario)}`,
       owner: "consent" as const,
       operation: "consent_confirmation" as const,
       bindingId,
       issuedAt: CONFORMANCE_NOW,
       expiresAt: CONFORMANCE_TOMORROW,
     },
-    authorityReceiptId: `consent_${discriminator}_${suffix(scenario)}`,
+    authorityReceiptId: `consent_${discriminator}_${purpose}_${suffix(scenario)}`,
     changedAt: CONFORMANCE_NOW,
   });
   return {
     bindings: [binding(value.bindingId), binding(value.secondaryBindingId)],
     policies: [policy(value.bindingId, "primary"), policy(value.secondaryBindingId, "secondary")],
-    consents: [consent(value.bindingId, "primary"), consent(value.secondaryBindingId, "secondary")],
+    consents: [
+      consent(value.bindingId, "primary"),
+      consent(value.bindingId, "primary", "service"),
+      consent(value.secondaryBindingId, "secondary"),
+    ],
     connections: [{ channel: "whatsapp", state: "active" }],
     templates: [
       {
         templateId: `template_${suffix(scenario)}`,
         locale: "en",
         definitionVersion: 1,
         internallyApproved: true,
         providerState: "provider_approved",
         providerVersion: 1,
         updatedAt: CONFORMANCE_NOW,
@@ -153,21 +161,25 @@ async function withHarness<T>(
   work: (harness: CommunicationsRepositoryHarness) => Promise<T>,
 ): Promise<T> {
   const harness = await factory(scenario);
   try {
     return await work(harness);
   } finally {
     await harness.close?.();
   }
 }
 
-async function queueOutbound(repository: CommunicationsRepository, scenario: string) {
+async function queueOutbound(
+  repository: CommunicationsRepository,
+  scenario: string,
+  policy = { version: 7, fence: 42 },
+) {
   const value = communicationsConformanceIds(scenario);
   const templateId = `template_${suffix(scenario)}`;
   await repository.acceptInbound(inbound(scenario));
   const draft = {
     command: {
       commandId: value.commandId,
       channel: "whatsapp",
       locale: "en",
       conversationId: value.conversationId,
       bindingId: value.bindingId,
@@ -195,22 +207,22 @@ async function queueOutbound(repository: CommunicationsRepository, scenario: str
   const created = await repository.createOutbound(draft);
   expect(created).toEqual({
     status: "created",
     commandId: value.commandId,
     messageId: value.outboundMessageId,
   });
   await expect(
     repository.finalizeOutbound({
       commandId: value.commandId,
       fingerprint: "c".repeat(64),
-      requiredPolicyVersion: 7,
-      requiredFence: 42,
+      requiredPolicyVersion: policy.version,
+      requiredFence: policy.fence,
       endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
       authorizationReceipt: {
         receiptId: `dispatch_${suffix(scenario)}`,
         owner: "communications",
         operation: "outbound_dispatch",
         bindingId: value.bindingId,
         destinationKey: `endpoint_ref:${"b".repeat(64)}`,
         issuedAt: CONFORMANCE_NOW,
         expiresAt: CONFORMANCE_TOMORROW,
       },
@@ -825,12 +837,118 @@ export function runCommunicationsRepositoryConformance(
             ]);
           expect(state.withdrawalHistory.at(-1)).toMatchObject({
             bindingId: value.bindingId,
             source: "inbound_event",
             receiptId: inboundReceipt.receiptId,
             eventId: inboundReceipt.eventId,
           });
         }
       });
     });
+
+    it("atomically withdraws multiple purpose histories from one contact evidence receipt", async () => {
+      await withHarness(factory, `${label}-contact-withdrawal`, async ({ repository, inspectState }) => {
+        const scenario = `${label}-contact-withdrawal`;
+        const value = communicationsConformanceIds(scenario);
+        for (const purpose of ["transactional", "service"] as const) {
+          await expect(repository.grantConsentFromReceipt({
+            bindingId: value.bindingId,
+            purpose,
+            operation: "consent_grant",
+            receipt: {
+              receiptId: `grant_${purpose}_${suffix(scenario)}`,
+              owner: "consent",
+              operation: "consent_grant",
+              bindingId: value.bindingId,
+              issuedAt: CONFORMANCE_NOW,
+              expiresAt: CONFORMANCE_TOMORROW,
+            },
+            now: CONFORMANCE_NOW,
+          })).resolves.toMatchObject({ status: "changed", version: 2 });
+        }
+        await expect(repository.grantConsentFromReceipt({
+          bindingId: value.bindingId,
+          purpose: "transactional",
+          operation: "consent_grant",
+          receipt: {
+            receiptId: `grant_transactional_next_${suffix(scenario)}`,
+            owner: "consent",
+            operation: "consent_grant",
+            bindingId: value.bindingId,
+            issuedAt: CONFORMANCE_NOW,
+            expiresAt: CONFORMANCE_TOMORROW,
+          },
+          now: CONFORMANCE_NOW,
+        })).resolves.toMatchObject({ status: "changed", version: 3 });
+        const preQueue = await repository.referenceState();
+        const policy = preQueue.policies
+          .filter((record) => record.bindingId === value.bindingId)
+          .reduce((latest, record) => record.version > latest.version ? record : latest);
+        const queued = await queueOutbound(repository, scenario, {
+          version: policy.version,
+          fence: policy.fence,
+        });
+        const receipt = {
+          receiptId: `contact_withdrawal_${suffix(scenario)}`,
+          owner: "consent" as const,
+          operation: "contact_withdrawal" as const,
+          bindingId: value.bindingId,
+          issuedAt: CONFORMANCE_NOW,
+          expiresAt: CONFORMANCE_TOMORROW,
+          correlationId: `withdrawal_${suffix(scenario)}`,
+        };
+        await expect(repository.withdrawContact({
+          bindingId: value.bindingId,
+          evidence: { source: "authority", receipt },
+          now: CONFORMANCE_NOW,
+        })).resolves.toMatchObject({
+          status: "changed",
+          cancelledCommandIds: [queued.commandId],
+        });
+        const after = inspectState ? await inspectState() : await repository.referenceState();
+        for (const [purpose, version] of [["transactional", 4], ["service", 3]] as const) {
+          expect(after.consentHistory
+            .filter((record) => record.bindingId === value.bindingId && record.purpose === purpose)
+            .at(-1))
+            .toMatchObject({
+              state: "withdrawn",
+              version,
+              authorityReceiptId: undefined,
+            });
+        }
+        expect(after.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
+          .toEqual([
+            expect.objectContaining({
+              bindingId: value.bindingId,
+              source: "authority",
+              receiptId: receipt.receiptId,
+              correlationId: receipt.correlationId,
+            }),
+          ]);
+        expect(after.policies
+          .filter((record) => record.bindingId === value.bindingId)
+          .every((record) => record.state === "withdrawn"))
+          .toBe(true);
+        expect(after.outbound).toContainEqual(expect.objectContaining({
+          commandId: queued.commandId,
+          state: "cancelled",
+        }));
+        await expect(repository.withdrawContact({
+          bindingId: value.bindingId,
+          evidence: { source: "authority", receipt },
+          now: CONFORMANCE_NOW,
+        })).resolves.toMatchObject({ status: "duplicate", cancelledCommandIds: [] });
+        await expect(repository.withdrawContact({
+          bindingId: value.bindingId,
+          evidence: {
+            source: "authority",
+            receipt: { ...receipt, correlationId: `${receipt.correlationId}_mismatch` },
+          },
+          now: CONFORMANCE_NOW,
+        })).resolves.toEqual({ status: "denied", code: "withdrawal_evidence_invalid" });
+        const finalState = inspectState ? await inspectState() : await repository.referenceState();
+        expect(finalState.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
+          .toHaveLength(1);
+      });
+    });
   });
 }
```
