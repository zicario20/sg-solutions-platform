# Task 8 Fix Round 4 Review Package

Base: 35c865ffc3cee25fd424df2cb523a831a068cdcf
Head: aa361074437355a27f90d1f25460f9aadb46fd01

## Commit
```
aa36107 (HEAD -> codex/m004-whatsapp-recovery) fix(database): enforce withdrawal receipt integrity
 .../0014_m004_typed_withdrawal_evidence.sql        |    7 +
 .../workspace/drizzle/meta/0014_snapshot.json      | 4304 ++++++++++++++++++++
 .../workspace/drizzle/meta/_journal.json           |    7 +
 .../database/src/postgres-communications-store.ts  |    2 +-
 .../workspace/packages/database/src/schema.ts      |   19 +-
 .../domain/src/communications/memory-repository.ts |   10 +-
 .../domain/src/communications/repository.ts        |    4 +
 .../tests/m004/communications-repository.test.ts   |    5 +-
 .../tests/m004/communications-schema.test.ts       |  116 +-
 .../communications-repository-conformance.ts       |   34 +
 10 files changed, 4498 insertions(+), 10 deletions(-)
```

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql b/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql
new file mode 100644
index 0000000..f9fcebf
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql
@@ -0,0 +1,7 @@
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_id_binding_unique";--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_contact_binding_fk";
+--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD COLUMN "contact_evidence_event_kind" varchar(40) DEFAULT 'contact_withdrawal_recorded' NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_id_binding_kind_unique" UNIQUE("id","binding_id","event_kind");--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_typed_contact_binding_fk" FOREIGN KEY ("contact_evidence_event_id","binding_id","contact_evidence_event_kind") REFERENCES "public"."communication_contact_evidence_events"("id","binding_id","event_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_contact_kind_valid" CHECK ("communication_contact_evidence_events"."contact_evidence_event_kind" = 'contact_withdrawal_recorded');
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0014_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0014_snapshot.json
new file mode 100644
index 0000000..e631ecc
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0014_snapshot.json
@@ -0,0 +1,4304 @@
+{
+  "id": "7c3a20bd-8874-4766-99f2-25d574de4782",
+  "prevId": "50c60227-f6f3-41a6-86a8-49ff736094a4",
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
+        "contact_evidence_event_kind": {
+          "name": "contact_evidence_event_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'contact_withdrawal_recorded'"
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
+        "communication_contact_evidence_events_typed_contact_binding_fk": {
+          "name": "communication_contact_evidence_events_typed_contact_binding_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "tableTo": "communication_contact_evidence_events",
+          "columnsFrom": [
+            "contact_evidence_event_id",
+            "binding_id",
+            "contact_evidence_event_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "binding_id",
+            "event_kind"
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
+        "communication_contact_evidence_events_id_binding_kind_unique": {
+          "name": "communication_contact_evidence_events_id_binding_kind_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "binding_id",
+            "event_kind"
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
+        "communication_contact_evidence_events_contact_kind_valid": {
+          "name": "communication_contact_evidence_events_contact_kind_valid",
+          "value": "\"communication_contact_evidence_events\".\"contact_evidence_event_kind\" = 'contact_withdrawal_recorded'"
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
index d84e309..e80b850 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -22,83 +22,90 @@
       "when": 1786595722135,
       "tag": "0002_green_tempest",
       "breakpoints": true
     },
     {
       "idx": 3,
       "version": "7",
       "when": 1786635907453,
       "tag": "0003_clean_the_hood",
       "breakpoints": true
     },
     {
       "idx": 4,
       "version": "7",
       "when": 1786636914096,
       "tag": "0004_lazy_gressill",
       "breakpoints": true
     },
     {
       "idx": 5,
       "version": "7",
       "when": 1786637266730,
       "tag": "0005_greedy_proudstar",
       "breakpoints": true
     },
     {
       "idx": 6,
       "version": "7",
       "when": 1787247871684,
       "tag": "0006_m004_communications_role_bootstrap",
       "breakpoints": true
     },
     {
       "idx": 7,
       "version": "7",
       "when": 1787249878408,
       "tag": "0007_m004_communications_schema",
       "breakpoints": true
     },
     {
       "idx": 8,
       "version": "7",
       "when": 1787249879081,
       "tag": "0008_m004_communications_backfill",
       "breakpoints": true
     },
     {
       "idx": 9,
       "version": "7",
       "when": 1787251995592,
       "tag": "0009_m004_communications_cutover_guard",
       "breakpoints": true
     },
     {
       "idx": 10,
       "version": "7",
       "when": 1787254194838,
       "tag": "0010_m004_communications_canonical_cutover",
       "breakpoints": true
     },
     {
       "idx": 11,
       "version": "7",
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
     },
     {
       "idx": 13,
       "version": "7",
       "when": 1787256657727,
       "tag": "0013_m004_contact_withdrawal_evidence",
       "breakpoints": true
+    },
+    {
+      "idx": 14,
+      "version": "7",
+      "when": 1787257764344,
+      "tag": "0014_m004_typed_withdrawal_evidence",
+      "breakpoints": true
     }
   ]
 }
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
index 1bcbfc0..b83ac4b 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -1719,161 +1719,161 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       );
       await query(
         tx,
         `update communication_dispatch_attempts set state = $2, completed_at = $3,
            updated_at = $3 where id = $1 and command_id = $4`,
         [input.attemptId, commandState, input.now, input.commandId],
       );
       return { status: "reconciled", commandState };
     });
   }
 
   async evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const row = (
         await query<{ internally_approved: boolean; state: string }>(
           tx,
           `select internally_approved, state from communication_message_templates
            where template_key = $1 and locale = $2`,
           [input.templateId, input.locale],
         )
       )[0];
       if (!row) return { eligible: false, code: "template_not_found" } as const;
       if (!row.internally_approved) {
         return { eligible: false, code: "internal_approval_required" } as const;
       }
       return row.state === "provider_approved"
         ? { eligible: true, code: "eligible" }
         : { eligible: false, code: "provider_not_approved" };
     });
   }
 
   async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
     const limit = Math.max(0, Math.min(input.limit, 100));
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const rows = await query<{
         kind: RecoveryCandidate["kind"];
         command_id: string | null;
         attempt_id: string | null;
         event_id: string | null;
       }>(
         tx,
         `select * from (
           select case when command.state = 'dispatch_unknown'
             then 'outbound_dispatch_unknown' else 'outbound_lease_expired' end as kind,
             command.id as command_id, attempt.id as attempt_id, null::text as event_id,
             coalesce(attempt.completed_at, attempt.started_at) as recovery_at
           from communication_outbound_commands command
           join lateral (select * from communication_dispatch_attempts
             where command_id = command.id order by attempt_ordinal desc limit 1) attempt on true
           where command.state = 'dispatch_unknown'
              or (command.state = 'dispatching' and command.lease_expires_at <= $1)
           union all
           select 'inbound_lease_expired', null, null, receipt.id, receipt.lease_expires_at
           from communication_provider_event_receipts receipt
           where receipt.state = 'persisted' and receipt.lease_expires_at <= $1
         ) work order by recovery_at asc limit $2`,
         [input.now, limit],
       );
       return rows.map((row) =>
         row.kind === "inbound_lease_expired"
           ? { kind: row.kind, eventId: row.event_id! }
           : { kind: row.kind, commandId: row.command_id!, attemptId: row.attempt_id! },
       );
     });
   }
 
   async referenceState(): Promise<CommunicationsReferenceState> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
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
-          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", triggering_event_id as "eventId", correlation_id as "correlationId", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'contact_withdrawal_recorded' order by binding_id, sequence`),
+          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", case when owning_domain = 'M004' then 'communications' else 'consent' end as owner, case when owning_domain = 'M004' then 'inbound_opt_out' else 'contact_withdrawal' end as operation, triggering_event_id as "eventId", correlation_id as "correlationId", receipt_issued_at as "issuedAt", receipt_valid_until as "expiresAt", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'contact_withdrawal_recorded' order by binding_id, sequence`),
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
             : record,
         ) as unknown as CommunicationsReferenceState["consentHistory"],
         templates: templates as unknown as CommunicationsReferenceState["templates"],
         providerStatuses: statuses as unknown as CommunicationsReferenceState["providerStatuses"],
         withdrawalHistory: withdrawals as unknown as CommunicationsReferenceState["withdrawalHistory"],
       };
     });
   }
 
   private async loadInbound(tx: TransactionSql, eventId: string): Promise<InboundRow | undefined> {
     return (
       await query<InboundRow>(
         tx,
         `select receipt.id as event_id, envelope.binding_id, envelope.conversation_id,
           envelope.message_id, envelope.participant_id,
           connection.readiness_state as connection_state, conversation.locale,
           receipt.correlation_id, receipt.received_at, receipt.state as event_state,
           conversation.status as conversation_status, conversation.version as conversation_version,
           conversation.created_at as conversation_created_at,
           conversation.updated_at as conversation_updated_at,
           conversation.last_activity_at, conversation.closed_at,
           participant.kind as participant_role, participant.created_at as participant_created_at,
           message.direction as message_direction, message.recipient_participant_id,
           message.kind as message_kind, message.created_at as message_created_at
         from communication_provider_event_receipts receipt
         join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
         join communication_channel_connections connection on connection.id = receipt.connection_id
         join communication_conversations conversation on conversation.id = envelope.conversation_id
         join communication_participants participant on participant.id = envelope.participant_id
         join communication_messages message on message.id = envelope.message_id
         where receipt.id = $1 and conversation.channel_kind = 'whatsapp' limit 1`,
         [eventId],
       )
     )[0];
   }
 
   private async inboundNotClaimed(
     tx: TransactionSql,
     input: ClaimInboundCommand,
   ): Promise<InboundClaimResult> {
     const row = (
       await query<{ state: string; policy_version: number | null }>(
         tx,
         `select receipt.state, policy.version as policy_version
          from communication_provider_event_receipts receipt
          left join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
          left join communication_contact_policies policy
            on policy.binding_id = envelope.binding_id and policy.purpose = 'transactional'
          where receipt.id = $1`,
         [input.eventId],
       )
     )[0];
     if (!row) return { status: "not_claimed", code: "not_found" };
     if (row.state !== "persisted") return { status: "not_claimed", code: "already_completed" };
     if (row.policy_version !== input.requiredPolicyVersion) {
       return { status: "not_claimed", code: "policy_version_mismatch" };
     }
     return { status: "not_claimed", code: "lease_conflict" };
   }
 
   private async outboundNotClaimed(
     tx: TransactionSql,
     commandId: string,
   ): Promise<OutboundClaimResult> {
     const row = (
       await query<{ state: OutboundCommandState; failure_code: string | null }>(
         tx,
         `select state, failure_code from communication_outbound_commands where id = $1`,
         [commandId],
       )
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index d474510..8ecce09 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -404,200 +404,211 @@ export const communicationContactBindings = pgTable(
     endpointVerifiedAt: timestamp("endpoint_verified_at", { withTimezone: true, mode: "date" }),
     verificationExpiresAt: timestamp("verification_expires_at", {
       withTimezone: true,
       mode: "date",
     }),
     wrongPersonReportedAt: timestamp("wrong_person_reported_at", {
       withTimezone: true,
       mode: "date",
     }),
     reassignmentRiskAt: timestamp("reassignment_risk_at", {
       withTimezone: true,
       mode: "date",
     }),
     suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
     ...timestamps,
   },
   (table) => [
     foreignKey({
       name: "communication_contact_bindings_connection_channel_fk",
       columns: [table.connectionId, table.channelKind],
       foreignColumns: [
         communicationChannelConnections.id,
         communicationChannelConnections.channelKind,
       ],
     }).onDelete("restrict"),
     unique("communication_contact_bindings_id_connection_channel_unique").on(
       table.id,
       table.connectionId,
       table.channelKind,
     ),
     unique("communication_contact_bindings_id_channel_unique").on(table.id, table.channelKind),
     unique("communication_contact_bindings_endpoint_unique").on(
       table.connectionId,
       table.endpointDigestKeyVersion,
       table.endpointDigest,
     ),
     check("communication_contact_bindings_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
     check(
       "communication_contact_bindings_trust_valid",
       sql`${table.trustState} in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')`,
     ),
     check("communication_contact_bindings_locale_valid", sql`${table.locale} in ('es', 'en')`),
     check(
       "communication_contact_bindings_endpoint_digest_valid",
       sql`${table.endpointDigest} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_contact_bindings_policy_version_positive",
       sql`${table.contactPolicyVersion} > 0`,
     ),
     check("communication_contact_bindings_version_positive", sql`${table.version} > 0`),
     check(
       "communication_contact_bindings_verification_window_valid",
       sql`${table.verificationExpiresAt} is null or (${table.endpointVerifiedAt} is not null and ${table.verificationExpiresAt} > ${table.endpointVerifiedAt})`,
     ),
     index("communication_contact_bindings_trust_idx").on(table.trustState, table.updatedAt),
     communicationsOnly("communication_contact_bindings"),
   ],
 ).enableRLS();
 
 export const communicationContactEvidenceEvents = pgTable(
   "communication_contact_evidence_events",
   {
     id: text("id").primaryKey(),
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
     evidenceReceiptId: text("evidence_receipt_id"),
     receiptKind: varchar("receipt_kind", { length: 40 }),
     owningDomain: varchar("owning_domain", { length: 80 }),
     authorityRole: varchar("authority_role", { length: 32 }),
     authorityVersion: integer("authority_version"),
     contactEvidenceEventId: text("contact_evidence_event_id"),
+    contactEvidenceEventKind: varchar("contact_evidence_event_kind", { length: 40 })
+      .notNull()
+      .default("contact_withdrawal_recorded"),
     triggeringEventId: text("triggering_event_id"),
     policyVersion: varchar("policy_version", { length: 80 }),
     correlationId: text("correlation_id"),
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
-    unique("communication_contact_evidence_events_id_binding_unique").on(table.id, table.bindingId),
+    unique("communication_contact_evidence_events_id_binding_kind_unique").on(
+      table.id,
+      table.bindingId,
+      table.eventKind,
+    ),
     foreignKey({
-      name: "communication_contact_evidence_events_contact_binding_fk",
-      columns: [table.contactEvidenceEventId, table.bindingId],
-      foreignColumns: [table.id, table.bindingId],
+      name: "communication_contact_evidence_events_typed_contact_binding_fk",
+      columns: [table.contactEvidenceEventId, table.bindingId, table.contactEvidenceEventKind],
+      foreignColumns: [table.id, table.bindingId, table.eventKind],
     }).onDelete("restrict"),
     check(
       "communication_contact_evidence_events_kind_valid",
       sql`${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'contact_withdrawal_recorded', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')`,
     ),
     check(
       "communication_contact_evidence_events_authority_valid",
       sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} = 'contact_withdrawal_recorded' and ((${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.owningDomain} = 'M004' and ${table.authorityRole} = 'channel_policy_detection'))) or (${table.eventKind} = 'consent_withdrawn' and ${table.owningDomain} is null and ${table.authorityRole} is null) or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
     ),
     check(
       "communication_contact_evidence_events_receipt_valid",
       sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.receiptKind} = 'consent_evidence') or (${table.eventKind} = 'contact_withdrawal_recorded' and ${table.receiptKind} = 'contact_withdrawal') or (${table.eventKind} = 'consent_withdrawn' and ${table.receiptKind} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.receiptKind} = 'ambiguous_opt_out_detection') or (${table.eventKind} in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.receiptKind} = 'ambiguous_opt_out_resolution') or (${table.eventKind} = 'binding_suspended' and ${table.receiptKind} = 'binding_suspension') or (${table.eventKind} = 'binding_revalidated' and ${table.receiptKind} = 'binding_revalidation')`,
     ),
     check(
       "communication_contact_evidence_events_state_shape_valid",
       sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'contact_withdrawal_recorded' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.authorityVersion} is null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ((${table.owningDomain} = 'M078' and ${table.triggeringEventId} is null) or (${table.owningDomain} = 'M004' and ${table.triggeringEventId} is not null)) and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
     ),
     check(
       "communication_contact_evidence_events_contact_link_valid",
       sql`(${table.eventKind} = 'consent_withdrawn' and ${table.contactEvidenceEventId} is not null) or (${table.eventKind} <> 'consent_withdrawn' and ${table.contactEvidenceEventId} is null)`,
     ),
+    check(
+      "communication_contact_evidence_events_contact_kind_valid",
+      sql`${table.contactEvidenceEventKind} = 'contact_withdrawal_recorded'`,
+    ),
     check(
       "communication_contact_evidence_events_receipt_owner_valid",
       sql`(${table.eventKind} = 'consent_withdrawn' and ${table.evidenceReceiptId} is null and ${table.receiptKind} is null and ${table.owningDomain} is null and ${table.authorityRole} is null and ${table.correlationId} is null and ${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.eventKind} <> 'consent_withdrawn' and ${table.evidenceReceiptId} is not null and ${table.receiptKind} is not null and ${table.owningDomain} is not null and ${table.authorityRole} is not null and ${table.correlationId} is not null)`,
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
       to: communicationsGatewayRole,
       using: sql`true`,
     }),
     pgPolicy("communication_contact_evidence_events_communications_insert", {
       as: "permissive",
       for: "insert",
       to: communicationsGatewayRole,
       withCheck: sql`true`,
     }),
   ],
 ).enableRLS();
 
 export const communicationContactPolicies = pgTable(
   "communication_contact_policies",
   {
     id: text("id").primaryKey(),
     bindingId: text("binding_id")
       .notNull()
       .references(() => communicationContactBindings.id, { onDelete: "cascade" }),
     purpose: varchar("purpose", { length: 24 }).notNull(),
     consentState: varchar("consent_state", { length: 24 }).notNull(),
     fenceState: varchar("fence_state", { length: 24 }).notNull(),
     decisionCode: varchar("decision_code", { length: 32 }),
     evidenceReceiptId: text("evidence_receipt_id"),
     version: integer("version").notNull(),
     fence: integer("fence").notNull().default(0),
     evaluatedAt: timestamp("evaluated_at", { withTimezone: true, mode: "date" }).notNull(),
     ...timestamps,
   },
   (table) => [
     unique("communication_contact_policies_binding_purpose_unique").on(
       table.bindingId,
       table.purpose,
     ),
     check(
       "communication_contact_policies_purpose_valid",
       sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
     ),
     check(
       "communication_contact_policies_consent_valid",
       sql`${table.consentState} in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')`,
     ),
     check(
       "communication_contact_policies_fence_valid",
       sql`${table.fenceState} in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')`,
     ),
     check(
       "communication_contact_policies_decision_valid",
       sql`${table.decisionCode} is null or ${table.decisionCode} in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')`,
     ),
     check("communication_contact_policies_version_positive", sql`${table.version} > 0`),
     check("communication_contact_policies_fence_nonnegative", sql`${table.fence} >= 0`),
     index("communication_contact_policies_fence_idx").on(table.fenceState, table.updatedAt),
     communicationsOnly("communication_contact_policies"),
   ],
 ).enableRLS();
 
 export const communicationConversations = pgTable(
   "communication_conversations",
   {
     id: text("id").primaryKey(),
     channelKind: varchar("channel_kind", { length: 16 }).notNull(),
     locale: varchar("locale", { length: 2 }).notNull(),
     status: varchar("status", { length: 32 }).notNull(),
     version: integer("version").notNull(),
     correlationId: text("correlation_id").notNull(),
     lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: "date" }).notNull(),
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 3451b44..b7f44c0 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -1017,173 +1017,181 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     this.policies.set(bindingId, created);
     return created;
   }
 
   private validLeaseCompletion(now: Date, leaseExpiresAt: Date | undefined): boolean {
     return Boolean(
       leaseExpiresAt &&
         Number.isFinite(now.getTime()) &&
         Number.isFinite(leaseExpiresAt.getTime()) &&
         now < leaseExpiresAt,
     );
   }
 
   private sameOutboundDraft(
     existing: OutboundRecord,
     input: CreateOutboundCommand,
     messageBodyDigest: string,
   ): boolean {
     return (
       existing.command.bindingId === input.command.bindingId &&
       existing.command.conversationId === input.command.conversationId &&
       existing.command.channel === input.command.channel &&
       existing.command.locale === input.command.locale &&
       existing.messageBodyDigest === messageBodyDigest &&
       existing.purpose === input.purpose &&
       existing.templateId === input.templateId
     );
   }
 
   private closeActiveAttempt(
     record: OutboundRecord,
     state: "sent" | "delivered" | "read" | "failed",
     completedAt: Date,
   ): void {
     record.state = state;
     record.command.state = state;
     const attempt = [...this.attempts.values()].find(
       (candidate) => candidate.commandId === record.command.commandId && candidate.state === "dispatching",
     );
     if (attempt) {
       attempt.state = state;
       attempt.completedAt = completedAt;
     }
     record.leaseOwnerHash = undefined;
     record.leaseExpiresAt = undefined;
   }
 
   private validateWithdrawalEvidence(input: WithdrawContactCommand):
     | { status: "allowed"; record: WithdrawalHistoryRecord }
     | { status: "denied"; code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid" } {
     const evidence = input.evidence;
     if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
     const receipt = evidence.receipt;
     if (
       receipt.bindingId !== input.bindingId ||
       !receipt.receiptId ||
       !receipt.correlationId ||
       !currentReceipt(receipt, input.now)
     ) {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
     if (evidence.source === "inbound_event") {
       const inbound = this.inboundById.get(evidence.receipt.eventId);
       if (
         receipt.owner !== "communications" ||
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
     const prior = this.withdrawalHistory.find((record) => record.receiptId === receipt.receiptId);
     if (
       prior &&
       (prior.bindingId !== input.bindingId ||
         prior.source !== evidence.source ||
+        prior.owner !== receipt.owner ||
+        prior.operation !== receipt.operation ||
         prior.correlationId !== receipt.correlationId ||
-        prior.eventId !== (evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined))
+        prior.eventId !== (evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined) ||
+        prior.issuedAt.getTime() !== receipt.issuedAt.getTime() ||
+        prior.expiresAt.getTime() !== receipt.expiresAt.getTime())
     ) {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
     return {
       status: "allowed",
       record: {
         bindingId: input.bindingId,
         source: evidence.source,
         receiptId: receipt.receiptId,
+        owner: receipt.owner,
+        operation: receipt.operation,
         eventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
         correlationId: receipt.correlationId,
+        issuedAt: receipt.issuedAt,
+        expiresAt: receipt.expiresAt,
         changedAt: input.now,
       },
     };
   }
 
   private validReconciliationReceipt(
     input: ReconcileOutboundCommand,
     receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
     bindingId: string,
     correlationId: string,
   ): boolean {
     return (
       receipt.owner === "communications" &&
       receipt.operation === "dispatch_reconciliation" &&
       (receipt.source === "provider_lookup" || receipt.source === "manual_authority") &&
       receipt.bindingId === bindingId &&
       receipt.commandId === input.commandId &&
       receipt.attemptId === input.attemptId &&
       receipt.correlationId === correlationId &&
       Boolean(receipt.receiptId) &&
       currentReceipt(receipt, input.now)
     );
   }
 
   private reconciliationReceiptIdentity(
     receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
   ): string {
     return JSON.stringify([
       receipt.receiptId,
       receipt.owner,
       receipt.operation,
       receipt.source,
       receipt.bindingId,
       receipt.commandId,
       receipt.attemptId,
       receipt.outcome,
       receipt.issuedAt.toISOString(),
       receipt.expiresAt.toISOString(),
       receipt.correlationId,
     ]);
   }
 
   private outboundDuplicateReason(
     record: OutboundRecord,
   ): Extract<CreateOutboundResult, { status: "duplicate" }>["reason"] {
     if (record.state === "queued") return undefined;
     if (record.state === "draft") return "outbound_draft_unresolved";
     if (record.state === "dispatching") return "outbound_dispatch_in_progress";
     if (record.state === "dispatch_unknown" || record.state === "reconciliation_required") {
       return "outbound_reconciliation_required";
     }
     if (record.state === "failed") return record.failureCode ?? "outbound_command_failed";
     if (record.state === "cancelled") return "outbound_command_cancelled";
     if (record.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
     return "outbound_command_completed";
   }
 
   private async withBindingLock<T>(
     bindingId: string,
     operation: LockOperation,
     action: () => Promise<T>,
   ): Promise<T> {
     const previous = this.bindingLockTails.get(bindingId) ?? Promise.resolve();
     let release!: () => void;
     const current = new Promise<void>((resolve) => {
       release = resolve;
     });
     this.bindingLockTails.set(bindingId, current);
     await previous;
     try {
       await this.lockBoundary?.({ bindingId, operation });
       return await action();
     } finally {
       release();
       if (this.bindingLockTails.get(bindingId) === current) {
         this.bindingLockTails.delete(bindingId);
       }
     }
   }
 }
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
index d92732a..8c29e2f 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -202,162 +202,166 @@ export type ConsentRecord = {
   bindingId: string;
   purpose: ContactPurpose;
   state: ContactConsentState;
   version: number;
   receipt?: import("./channel-policy.ts").ConsentReceipt;
   authorityReceiptId?: string;
   changedAt: Date;
 };
 
 export type GrantConsentCommand = {
   bindingId: string;
   purpose: ContactPurpose;
   operation: "consent_grant" | "reconsent";
   receipt?: OwningAuthorityReceipt;
   now: Date;
 };
 
 export type ConsentChangeResult =
   | {
       status: "changed" | "duplicate" | "unchanged";
       state: ContactConsentState;
       version: number;
     }
   | {
       status: "denied";
       code:
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "reconsent_receipt_required"
         | "policy_state_invalid";
     };
 
 export type AmbiguousOptOutResolutionResult =
   | {
       status: "changed";
       policyState: "normal_after_review";
       policyVersion: number;
     }
   | {
       status: "denied";
       code: "authority_receipt_missing" | "authority_receipt_invalid" | "policy_state_invalid";
     };
 
 export type WithdrawContactCommand = {
   bindingId: string;
   evidence?: ContactWithdrawalEvidence;
   now: Date;
 };
 
 export type ContactWithdrawalEvidence =
   | {
       source: "inbound_event";
       receipt: {
         receiptId: string;
         owner: "communications";
         operation: "inbound_opt_out";
         bindingId: string;
         eventId: string;
         issuedAt: Date;
         expiresAt: Date;
         correlationId: string;
       };
     }
   | {
       source: "authority";
       receipt: {
         receiptId: string;
         owner: "consent";
         operation: "contact_withdrawal";
         bindingId: string;
         issuedAt: Date;
         expiresAt: Date;
         correlationId: string;
       };
     };
 
 export type WithdrawalHistoryRecord = {
   bindingId: string;
   source: ContactWithdrawalEvidence["source"];
   receiptId: string;
+  owner: ContactWithdrawalEvidence["receipt"]["owner"];
+  operation: ContactWithdrawalEvidence["receipt"]["operation"];
   eventId?: string;
   correlationId: string;
+  issuedAt: Date;
+  expiresAt: Date;
   changedAt: Date;
 };
 
 export type WithdrawContactResult =
   | {
       status: "changed" | "duplicate";
       state: "withdrawn";
       policyVersion: number;
       fence: number;
       cancelledCommandIds: readonly string[];
     }
   | {
       status: "denied";
       code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid";
     };
 
 export type ResolveOptOutCommand = {
   bindingId: string;
   receipt?: OwningAuthorityReceipt;
   now: Date;
 };
 
 export type SuspendBindingCommand = {
   bindingId: string;
   reason: "expired" | "wrong_person" | "reassigned" | "invalid_recipient";
   now: Date;
 };
 
 export type BindingChangeResult =
   | {
       status: "changed" | "duplicate";
       trustState: ContactChannelBinding["trustState"];
     }
   | {
       status: "denied";
       code:
         | "binding_not_found"
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "freshness_invalid";
     };
 
 export type RevalidateBindingCommand = {
   bindingId: string;
   freshUntil: Date;
   receipt?: OwningAuthorityReceipt;
   now: Date;
 };
 
 export type TemplateProviderState = Extract<
   TemplateLifecycleState,
   "provider_approved" | "provider_rejected" | "paused" | "disabled"
 >;
 
 export type TemplateAuthorityReceipt = {
   receiptId: string;
   owner: "communications";
   operation: "template_internal_approval";
   resourceId: string;
   locale: ChannelLocale;
   definitionVersion: number;
   issuedAt: Date;
   expiresAt: Date;
 };
 
 export type TemplateProviderReconciliationReceipt = {
   receiptId: string;
   owner: "communications";
   operation: "template_provider_reconciliation";
   templateId: string;
   locale: ChannelLocale;
   definitionVersion: number;
   providerVersion: number;
   providerState: TemplateProviderState;
   issuedAt: Date;
   expiresAt: Date;
   correlationId: string;
 };
 
 export type TemplateRecord = {
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
index b9b9f37..d856d93 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
@@ -38,106 +38,109 @@ describe("Postgres communications transaction contract", () => {
     rolinherit: false,
     rolsuper: false,
   };
 
   it("accepts only the restricted non-inheriting gateway member", () => {
     expect(() => assertRestrictedCommunicationsPrincipal(safePrincipal)).not.toThrow();
     for (const unsafePrincipal of [
       { ...safePrincipal, principal_name: "postgres" },
       { ...safePrincipal, is_member: false },
       { ...safePrincipal, closure_count: 2 },
       { ...safePrincipal, admin_path: true },
       { ...safePrincipal, gateway_closure_count: 1 },
       { ...safePrincipal, rolbypassrls: true },
       { ...safePrincipal, rolinherit: true },
       { ...safePrincipal, rolsuper: true },
     ]) {
       expect(() => assertRestrictedCommunicationsPrincipal(unsafePrincipal)).toThrowError(
         "COMMUNICATIONS_DATABASE_PRINCIPAL_UNSAFE",
       );
     }
   });
 
   it("sets one local role and claims both queues with skip-locked row ownership", () => {
     expect(COMMUNICATIONS_TRANSACTION_SQL.setLocalRole).toBe(
       "set local role atlas_communications_gateway",
     );
     expect(COMMUNICATIONS_TRANSACTION_SQL.claimInbound).toContain(
       "for update of receipt skip locked",
     );
     expect(COMMUNICATIONS_TRANSACTION_SQL.claimOutbound).toContain(
       "for update skip locked",
     );
     expect(COMMUNICATIONS_TRANSACTION_SQL.lockBinding).toContain("for update");
     expect(COMMUNICATIONS_TRANSACTION_SQL.lockPolicy).toContain("for update");
   });
 
   it("keeps deterministic SQL compatible with nonnegative versions, scoped locking, and canonical references", () => {
     const acceptInboundSource = storeSource.slice(
       storeSource.indexOf("async acceptInbound("),
       storeSource.indexOf("async claimInbound("),
     );
     const createOutboundSource = storeSource.slice(
       storeSource.indexOf("async createOutbound("),
       storeSource.indexOf("async finalizeOutbound("),
     );
     expect(storeSource).toMatch(/processing_version[^;]+null, 0, null/su);
     expect(storeSource).toContain("processing_version = processing_version + 1");
     expect(storeSource).toContain("select id from communication_conversations where id = $1 for update");
     expect(storeSource).toContain("coalesce(max(ordinal), 0)::integer + 1 as ordinal");
     expect(storeSource).toContain("canonicalEndpointReference(");
     expect(storeSource).toContain("then 'inbound_event' else 'authority' end as source");
     expect(acceptInboundSource.match(/for update of receipt/gu)).toHaveLength(2);
     expect(acceptInboundSource).not.toMatch(/limit 1 for update[`\r\n]/u);
     expect(createOutboundSource.indexOf("COMMUNICATIONS_TRANSACTION_SQL.lockBinding")).toBeLessThan(
       createOutboundSource.indexOf("where binding_id = $1 and idempotency_key = $2"),
     );
     expect(createOutboundSource).toContain("existing.locale !== input.command.locale");
     expect(createOutboundSource).toContain("raced.locale !== input.command.locale");
     expect(schemaSource).toContain("sql`${table.processingVersion} >= 0`");
     expect(schemaSource).toContain('messageBodyDigest: char("message_body_digest", { length: 64 })');
   });
 
   it("uses exhaustive domain-to-database outcome and reconciliation vocabularies", () => {
     expect(storeSource).toContain('known_failure: { state: "failed", resultCode: "failed" }');
     expect(storeSource).toContain('unknown: { state: "dispatch_unknown", resultCode: "dispatch_unknown" }');
     expect(schemaSource).toContain("('provider_lookup', 'manual_authority')");
     expect(schemaSource).toContain("('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')");
     expect(storeSource.match(/evaluateOutboundPolicy\(/gu)).toHaveLength(2);
   });
 
   it("owns each contact withdrawal receipt once and links purpose-local projections", () => {
     const withdrawSource = storeSource.slice(
       storeSource.indexOf("async withdrawContact("),
       storeSource.indexOf("async resolveAmbiguousOptOutFromReceipt("),
     );
     expect(schemaSource).toContain('contactEvidenceEventId: text("contact_evidence_event_id")');
     expect(schemaSource).toContain("'contact_withdrawal_recorded'");
     expect(schemaSource).toContain(
       'unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId)',
     );
-    expect(schemaSource).toContain("communication_contact_evidence_events_contact_binding_fk");
+    expect(schemaSource).toContain(
+      "communication_contact_evidence_events_typed_contact_binding_fk",
+    );
+    expect(schemaSource).toContain("table.contactEvidenceEventKind");
     expect(withdrawSource.match(/appendContactWithdrawalEvidence\(/gu)).toHaveLength(1);
     expect(withdrawSource).toContain("contactEvidenceEventId: contactEvidence.id");
     expect(storeSource).toContain("on conflict (evidence_receipt_id) do nothing");
     expect(storeSource).toContain("where event_kind = 'contact_withdrawal_recorded'");
   });
 
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
       expect(securityMigration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
       expect(securityMigration).toContain(`"${table}" FROM PUBLIC`);
     }
     expect(securityMigration).toContain("'anon', 'authenticated', 'atlas_migration_runtime'");
     expect(securityMigration).toContain("GRANT SELECT, INSERT ON TABLE");
     expect(securityMigration).not.toContain("GRANT UPDATE");
     expect(securityMigration).not.toContain("GRANT DELETE");
   });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
index 87562e7..9aaabe7 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -215,453 +215,497 @@ async function seedSyntheticM003(sql: PublicChatSql): Promise<void> {
 describe("M004 canonical communications Drizzle schema", () => {
   it("defines every preparatory table with RLS and an opaque primary key", () => {
     for (const exportName of REQUIRED_TABLE_EXPORTS) {
       const config = tableConfig(exportName);
       expect(config.enableRLS, `${config.name} must enable RLS`).toBe(true);
       expect(config.columns.find((column) => column.name === "id")?.primary).toBe(true);
     }
   });
 
   it("has no raw endpoint, credential, URL, provider-payload, or payment-card column", () => {
     const prohibited = new Set([
       "phone",
       "phone_number",
       "access_token",
       "verify_token",
       "credential",
       "secret",
       "url",
       "raw_payload",
       "provider_payload",
       "pan",
       "cvv",
       "card_number",
     ]);
     for (const exportName of REQUIRED_TABLE_EXPORTS) {
       const columns = tableConfig(exportName).columns.map((column) => column.name);
       expect(columns.filter((column) => prohibited.has(column))).toEqual([]);
     }
 
     const bindingColumns = tableConfig("communicationContactBindings").columns.map(
       (column) => column.name,
     );
     expect(bindingColumns).toEqual(
       expect.arrayContaining(["endpoint_digest", "endpoint_digest_key_version"]),
     );
 
     const messageColumns = tableConfig("communicationMessages").columns.map(
       (column) => column.name,
     );
     expect(messageColumns).toEqual(
       expect.arrayContaining(["body", "body_stored", "body_retention_policy"]),
     );
     const envelopeColumns = tableConfig("communicationEventEnvelopes").columns.map(
       (column) => column.name,
     );
     expect(envelopeColumns).toEqual(
       expect.arrayContaining([
         "canonical_text",
         "body_retention_policy",
         "schema_version",
         "external_message_reference",
         "template_provider_reference",
         "template_provider_version",
         "template_provider_timestamp",
       ]),
     );
   });
 
   it("enforces exact discriminator checks and durable identity invariants", () => {
     const expectedChecks: Record<string, readonly string[]> = {
       communicationChannelConnections: [
         "communication_channel_connections_channel_valid",
         "communication_channel_connections_readiness_valid",
       ],
       communicationContactBindings: [
         "communication_contact_bindings_channel_valid",
         "communication_contact_bindings_trust_valid",
         "communication_contact_bindings_locale_valid",
       ],
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
         "communication_contact_evidence_events_contact_link_valid",
+        "communication_contact_evidence_events_contact_kind_valid",
         "communication_contact_evidence_events_receipt_owner_valid",
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
         "communication_messages_channel_valid",
         "communication_messages_direction_valid",
         "communication_messages_locale_valid",
         "communication_messages_kind_valid",
         "communication_messages_state_valid",
         "communication_messages_body_retention_valid",
       ],
       communicationProviderEventReceipts: [
         "communication_provider_event_receipts_kind_valid",
         "communication_provider_event_receipts_state_valid",
         "communication_provider_event_receipts_schema_version_valid",
         "communication_provider_event_receipts_external_event_reference_valid",
         "communication_provider_event_receipts_processing_version_nonnegative",
       ],
       communicationEventEnvelopes: [
         "communication_event_envelopes_kind_valid",
         "communication_event_envelopes_schema_version_valid",
         "communication_event_envelopes_retention_valid",
         "communication_event_envelopes_typed_shape_valid",
         "communication_event_envelopes_reference_shape_valid",
       ],
       communicationMessageTemplates: [
         "communication_message_templates_locale_valid",
         "communication_message_templates_purpose_valid",
         "communication_message_templates_state_valid",
       ],
       communicationOutboundCommands: [
         "communication_outbound_commands_channel_valid",
         "communication_outbound_commands_locale_valid",
         "communication_outbound_commands_purpose_valid",
         "communication_outbound_commands_state_valid",
       ],
       communicationDispatchAttempts: [
         "communication_dispatch_attempts_state_valid",
         "communication_dispatch_attempts_result_valid",
       ],
       communicationHandoffs: [
         "communication_handoffs_state_valid",
         "communication_handoffs_reason_valid",
       ],
       communicationAuditEvents: [
         "communication_audit_events_channel_valid",
         "communication_audit_events_locale_valid",
         "communication_audit_events_purpose_valid",
         "communication_audit_events_aggregate_valid",
         "communication_audit_events_result_valid",
       ],
     };
     for (const [exportName, names] of Object.entries(expectedChecks)) {
       const checks = tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
         (constraint) => constraint.name,
       );
       expect(checks).toEqual(expect.arrayContaining(names));
     }
 
     expect(
       tableConfig("communicationContactBindings").uniqueConstraints.map(
         (constraint) => constraint.name,
       ),
     ).toEqual(
       expect.arrayContaining([
         "communication_contact_bindings_endpoint_unique",
         "communication_contact_bindings_id_channel_unique",
       ]),
     );
     expect(
       tableConfig("communicationProviderEventReceipts").uniqueConstraints.map(
         (constraint) => constraint.name,
       ),
     ).toContain("communication_provider_event_receipts_identity_unique");
     expect(
       tableConfig("communicationOutboundCommands").uniqueConstraints.map(
         (constraint) => constraint.name,
       ),
     ).toContain("communication_outbound_commands_binding_key_unique");
     expect(
       tableConfig("communicationDispatchAttempts").uniqueConstraints.map(
         (constraint) => constraint.name,
       ),
     ).toContain("communication_dispatch_attempts_command_ordinal_unique");
     expect(
       tableConfig("communicationMessages").uniqueConstraints.map((constraint) => constraint.name),
     ).toContain("communication_messages_conversation_ordinal_unique");
     expect(
       tableConfig("communicationAuditEvents").uniqueConstraints.map(
         (constraint) => constraint.name,
       ),
     ).toContain("communication_audit_events_conversation_sequence_unique");
+    expect(
+      tableConfig("communicationContactEvidenceEvents").uniqueConstraints.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("communication_contact_evidence_events_id_binding_kind_unique");
 
     expect(
       tableConfig("communicationParticipants").foreignKeys.map((key) => key.getName()),
     ).toEqual(
       expect.arrayContaining([
         "communication_participants_conversation_channel_fk",
         "communication_participants_binding_channel_fk",
       ]),
     );
     expect(tableConfig("communicationMessages").foreignKeys.map((key) => key.getName())).toEqual(
       expect.arrayContaining([
         "communication_messages_conversation_channel_fk",
         "communication_messages_sender_conversation_fk",
         "communication_messages_recipient_conversation_fk",
       ]),
     );
     expect(
       tableConfig("publicChatConversationSessions").foreignKeys.map((key) => key.getName()),
     ).toEqual(
       expect.arrayContaining([
         "public_chat_conversation_sessions_conversation_channel_fk",
         "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
         "public_chat_conversation_sessions_participant_conversation_channel_fk",
       ]),
     );
     expect(tableConfig("communicationHandoffs").foreignKeys.map((key) => key.getName())).toEqual(
       expect.arrayContaining([
         "communication_handoffs_conversation_channel_fk",
         "communication_handoffs_assignee_conversation_fk",
       ]),
     );
     expect(
       tableConfig("communicationOutboundCommands").foreignKeys.map((key) => key.getName()),
     ).toEqual(
       expect.arrayContaining([
         "communication_outbound_commands_conversation_channel_fk",
         "communication_outbound_commands_binding_connection_channel_fk",
       ]),
     );
     expect(
       tableConfig("communicationDispatchAttempts").foreignKeys.map((key) => key.getName()),
     ).toContain("communication_dispatch_attempts_command_connection_fk");
     expect(
       tableConfig("communicationEventEnvelopes").foreignKeys.map((key) => key.getName()),
     ).toEqual(
       expect.arrayContaining([
         "communication_event_envelopes_receipt_connection_fk",
         "communication_event_envelopes_conversation_channel_fk",
         "communication_event_envelopes_participant_conversation_channel_fk",
         "communication_event_envelopes_message_conversation_fk",
         "communication_event_envelopes_binding_connection_channel_fk",
       ]),
     );
+    expect(
+      tableConfig("communicationContactEvidenceEvents").foreignKeys.map((key) => key.getName()),
+    ).toContain("communication_contact_evidence_events_typed_contact_binding_fk");
     expect(
       tableConfig("communicationConversations").indexes.map((value) => value.config.name),
     ).toEqual(
       expect.arrayContaining([
         "communication_conversations_activity_idx",
         "communication_conversations_reconciliation_idx",
       ]),
     );
     expect(
       tableConfig("communicationProviderEventReceipts").indexes.map((value) => value.config.name),
     ).toContain("communication_provider_event_receipts_work_idx");
     expect(
       tableConfig("communicationOutboundCommands").indexes.map((value) => value.config.name),
     ).toContain("communication_outbound_commands_work_idx");
   });
 
   it("declares separate least-privilege policies for public-chat and communications scopes", () => {
     for (const exportName of SHARED_TABLE_EXPORTS) {
       const policies = tableConfig(exportName).policies;
       expect(policies.map((policy) => policy.name)).toEqual(
         expect.arrayContaining([
           `${tableConfig(exportName).name}_public_chat_scope`,
           `${tableConfig(exportName).name}_communications_scope`,
         ]),
       );
       expect(policies.some((policy) => policy.name.endsWith("_public_chat_insert"))).toBe(false);
       expect(policies.flatMap((policy) => [policy.to].flat().map(policyRoleName))).toEqual(
         expect.arrayContaining(["atlas_public_chat_gateway", "atlas_communications_gateway"]),
       );
     }
     for (const exportName of M004_ONLY_TABLE_EXPORTS) {
       const policies = tableConfig(exportName).policies;
       expect(policies).toHaveLength(1);
       expect([policies[0]?.to].flat().map(policyRoleName)).toEqual([
         "atlas_communications_gateway",
       ]);
     }
     const publicSessionPolicies = tableConfig("publicChatConversationSessions").policies;
     expect(publicSessionPolicies).toHaveLength(1);
     expect([publicSessionPolicies[0]?.to].flat().map(policyRoleName)).toEqual([
       "atlas_public_chat_gateway",
     ]);
 
     const evidencePolicies = tableConfig("communicationContactEvidenceEvents").policies;
     expect(evidencePolicies.map((policy) => policy.name)).toEqual([
       "communication_contact_evidence_events_communications_select",
       "communication_contact_evidence_events_communications_insert",
     ]);
   });
 
   it("stores a deterministic allowlisted envelope shape for every canonical event kind", () => {
     const columns = tableConfig("communicationEventEnvelopes").columns.map((column) => column.name);
     expect(columns).toEqual(
       expect.arrayContaining([
         "connection_id",
         "channel_kind",
         "delivery_state",
         "interactive_kind",
         "interactive_id",
         "interactive_title",
         "external_message_reference",
         "media_external_reference",
         "media_declared_kind",
         "media_mime_type",
         "media_checksum",
         "template_provider_reference",
         "template_key",
         "template_locale",
         "template_category",
         "template_provider_state",
         "template_provider_version",
         "template_provider_timestamp",
         "unsupported_reason",
       ]),
     );
     expect(columns).not.toEqual(
       expect.arrayContaining([
         "raw_payload",
         "provider_payload",
         "provider_error",
         "sender_endpoint",
         "control_kind",
       ]),
     );
     expect(tableConfig("communicationEventEnvelopes").checks.map((value) => value.name)).toContain(
       "communication_event_envelopes_field_ownership_valid",
     );
   });
 
   it("requires exact hexadecimal digests and positive durable ordering values", () => {
     const expectedChecks: Record<string, readonly string[]> = {
       communicationContactBindings: ["communication_contact_bindings_endpoint_digest_valid"],
       communicationProviderEventReceipts: [
         "communication_provider_event_receipts_body_digest_valid",
         "communication_provider_event_receipts_lease_token_hash_valid",
       ],
       communicationEventEnvelopes: ["communication_event_envelopes_media_checksum_valid"],
       communicationOutboundCommands: [
         "communication_outbound_commands_fingerprint_valid",
         "communication_outbound_commands_lease_token_hash_valid",
       ],
       communicationDispatchAttempts: ["communication_dispatch_attempts_request_digest_valid"],
       communicationMessages: ["communication_messages_ordinal_positive"],
       communicationAuditEvents: ["communication_audit_events_sequence_positive"],
     };
     for (const [exportName, checks] of Object.entries(expectedChecks)) {
       expect(
         tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
           (value) => value.name,
         ),
       ).toEqual(expect.arrayContaining(checks));
     }
   });
 });
 
 describe("M004 generated migration authority and canonical cutover", () => {
   it("records generated metadata for bootstrap, backfill, guarded cutover and canonical structure", () => {
     const migrations = currentM004Migrations();
     const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
     const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
       entries: Array<{ idx: number; tag: string }>;
     };
-    expect(journal.entries.slice(-8).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
+    expect(journal.entries.slice(-9).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
       { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
       { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
       { idx: 8, tag: "0008_m004_communications_backfill" },
       { idx: 9, tag: "0009_m004_communications_cutover_guard" },
       { idx: 10, tag: "0010_m004_communications_canonical_cutover" },
       { idx: 11, tag: "0011_m004_receipt_security_hardening" },
       { idx: 12, tag: "0012_m004_inbound_processing_version_parity" },
       { idx: 13, tag: "0013_m004_contact_withdrawal_evidence" },
+      { idx: 14, tag: "0014_m004_typed_withdrawal_evidence" },
     ]);
-    for (const index of ["0006", "0007", "0008", "0009", "0010", "0011", "0012", "0013"]) {
+    for (const index of [
+      "0006",
+      "0007",
+      "0008",
+      "0009",
+      "0010",
+      "0011",
+      "0012",
+      "0013",
+      "0014",
+    ]) {
       expect(
         existsSync(
           fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
         ),
       ).toBe(true);
     }
   });
 
+  it("generates a typed composite relation for consent-withdrawal evidence", () => {
+    const path = fileURLToPath(
+      new URL("../../drizzle/0014_m004_typed_withdrawal_evidence.sql", import.meta.url),
+    );
+    const sql = readFileSync(path, "utf8");
+    expect(sql).toContain(
+      'ADD COLUMN "contact_evidence_event_kind" varchar(40) DEFAULT \'contact_withdrawal_recorded\' NOT NULL',
+    );
+    expect(sql).toContain(
+      'CONSTRAINT "communication_contact_evidence_events_contact_kind_valid" CHECK ("communication_contact_evidence_events"."contact_evidence_event_kind" = \'contact_withdrawal_recorded\')',
+    );
+    expect(sql).toContain(
+      'CONSTRAINT "communication_contact_evidence_events_id_binding_kind_unique" UNIQUE("id","binding_id","event_kind")',
+    );
+    expect(sql).toContain(
+      'CONSTRAINT "communication_contact_evidence_events_typed_contact_binding_fk" FOREIGN KEY ("contact_evidence_event_id","binding_id","contact_evidence_event_kind") REFERENCES "public"."communication_contact_evidence_events"("id","binding_id","event_kind")',
+    );
+    expect(
+      sql.indexOf("communication_contact_evidence_events_id_binding_kind_unique"),
+    ).toBeLessThan(
+      sql.indexOf("communication_contact_evidence_events_typed_contact_binding_fk"),
+    );
+  });
+
   it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
     const { bootstrap, structural, backfill } = currentM004Migrations();
     const sql = [bootstrap, structural, backfill]
       .map((file) =>
         readFileSync(fileURLToPath(new URL(`../../drizzle/${file}`, import.meta.url)), "utf8"),
       )
       .join("\n");
     for (const exportName of REQUIRED_TABLE_EXPORTS) {
       const name = tableConfig(exportName).name;
       expect(sql).toContain(`ALTER TABLE "${name}" FORCE ROW LEVEL SECURITY`);
       expect(sql).toContain(`"${name}"`);
     }
     expect(sql).toContain("REVOKE ALL ON TABLE");
     expect(sql).toContain("atlas_communications_gateway");
     expect(sql).toContain("NOSUPERUSER");
     expect(sql).toContain("NOBYPASSRLS");
     expect(sql).toContain("NOLOGIN");
     expect(sql).toContain("ARRAY['anon', 'authenticated']");
     expect(sql).not.toContain("FROM PUBLIC, anon, authenticated");
     expect(sql).not.toMatch(/GRANT\s+[^;]*DELETE/iu);
     expect(sql).toContain('GRANT SELECT ON TABLE "public_chat_conversation_sessions"');
     expect(sql).not.toContain('GRANT SELECT, INSERT ON TABLE "public_chat_conversation_sessions"');
   });
 
   it("bootstraps the cluster-global role idempotently before per-database structural DDL", () => {
     const { bootstrap, structural } = currentM004Migrations();
     const bootstrapSql = readFileSync(`${migrationDirectory()}${bootstrap}`, "utf8");
     const structuralSql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
     expect(bootstrapSql).toContain("IF NOT EXISTS");
     expect(bootstrapSql).toContain("CREATE ROLE atlas_communications_gateway");
     expect(bootstrapSql).toContain("ALTER ROLE atlas_communications_gateway");
     expect(structuralSql).not.toMatch(/CREATE\s+ROLE\s+"?atlas_communications_gateway"?/iu);
   });
 
   it("generates the real Meta envelope columns, explicit required checks and binding-channel FK", () => {
     const { structural } = currentM004Migrations();
     const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
     for (const column of [
       "external_message_reference",
       "template_provider_reference",
       "template_provider_version",
       "template_provider_timestamp",
     ]) {
       expect(sql).toContain(`"${column}"`);
     }
     expect(sql).toContain(
       'CONSTRAINT "communication_event_envelopes_schema_version_valid" CHECK ("communication_event_envelopes"."schema_version" = \'meta-envelope.v1\')',
     );
     expect(sql).toContain(
       'CONSTRAINT "communication_event_envelopes_retention_valid" CHECK ("communication_event_envelopes"."body_retention_policy" = \'metadata_only\' and "communication_event_envelopes"."canonical_text" is null)',
     );
     expect(sql).toContain("communication_contact_bindings_id_channel_unique");
     expect(sql).toContain("communication_participants_binding_channel_fk");
     expect(sql).toContain('"consent_state" is not null');
     expect(sql).toContain('"authority_version" is not null');
     expect(sql).toContain('"template_provider_timestamp" is not null');
     expect(sql).not.toContain('"control_kind"');
     expect(sql).not.toContain('"sender_endpoint"');
   });
 
   it("installs one narrowly-scoped audited public-chat bootstrap function", () => {
     const { backfill } = currentM004Migrations();
     const sql = readFileSync(`${migrationDirectory()}${backfill}`, "utf8");
     expect(sql).toContain("atlas_bootstrap_public_chat_conversation");
     expect(sql).toContain("SECURITY DEFINER");
     expect(sql).toContain("SET search_path = pg_catalog, public");
     expect(sql).toContain("REVOKE ALL ON FUNCTION");
     expect(sql).toContain("GRANT EXECUTE ON FUNCTION");
     expect(sql).toContain("public_chat_session_id");
     expect(sql).toContain("M004_BOOTSTRAP_DEFINER_CANNOT_BYPASS_FORCED_RLS");
     expect(sql).toContain("rolbypassrls");
   });
 
   it("backfills M003 exactly and leaves its read/write path and foreign keys intact", () => {
     const { backfill } = currentM004Migrations();
     const sql = readFileSync(
       fileURLToPath(new URL(`../../drizzle/${backfill}`, import.meta.url)),
       "utf8",
     );
     const normalizedSql = sql.toLowerCase();
@@ -872,193 +916,259 @@ describe.sequential("M004 disposable real-Postgres migration and RLS contract",
             channel_kind: "public_web",
             id: "conversation_m004_upgrade",
             status: "waiting_for_human",
             version: 3,
           },
         ]);
         const messages = await sql<Array<{ id: string; ordinal: number; state: string }>>`
           select id, ordinal, state
           from communication_messages
           where conversation_id = 'conversation_m004_upgrade'
           order by ordinal
         `;
         expect(messages).toEqual([
           { id: "message_m004_upgrade_1", ordinal: 1, state: "accepted" },
           { id: "message_m004_upgrade_2", ordinal: 2, state: "answered" },
           { id: "message_m004_upgrade_3", ordinal: 3, state: "failed" },
           { id: "message_m004_upgrade_4", ordinal: 4, state: "handoff_required" },
         ]);
         const participants = await sql<Array<{ kind: string }>>`
           select kind from communication_participants
           where conversation_id = 'conversation_m004_upgrade'
           order by kind
         `;
         expect(participants).toEqual([
           { kind: "automated" },
           { kind: "external" },
           { kind: "human" },
           { kind: "system" },
         ]);
         const audits = await sql<
           Array<{
             aggregate_id: string;
             aggregate_type: string;
             event_name: string;
             occurred_at: Date;
             result_code: string;
           }>
         >`
           select event_name, aggregate_type, aggregate_id, result_code, occurred_at
           from communication_audit_events
           where conversation_id = 'conversation_m004_upgrade'
           order by sequence
         `;
         expect(audits).toHaveLength(8);
         expect(audits.map(({ event_name }) => event_name)).toEqual([
           "chat_conversation_started",
           "chat_message_accepted",
           "chat_message_rejected",
           "chat_response_failed",
           "chat_handoff_requested",
           "chat_handoff_queued",
           "chat_locale_changed",
           "chat_conversation_closed",
         ]);
         expect(
           audits.every(({ aggregate_id, aggregate_type, occurred_at, result_code }) =>
             Boolean(aggregate_id && aggregate_type && occurred_at && result_code),
           ),
         ).toBe(true);
         const parity = await sql<
           Array<{ audits: number; handoffs: number; messages: number; sessions: number }>
         >`
           select
             (select count(*)::int from communication_messages
               where conversation_id = 'conversation_m004_upgrade') as messages,
             (select count(*)::int from communication_handoffs
               where conversation_id = 'conversation_m004_upgrade') as handoffs,
             (select count(*)::int from communication_audit_events
               where conversation_id = 'conversation_m004_upgrade') as audits,
             (select count(*)::int from public_chat_conversation_sessions
               where conversation_id = 'conversation_m004_upgrade') as sessions
         `;
         expect(parity).toEqual([{ audits: 8, handoffs: 1, messages: 4, sessions: 1 }]);
       } finally {
         await sql.end({ timeout: 5 });
       }
     },
   );
 
   it.runIf(Boolean(freshPostgresUrl))(
-    "rejects PostgreSQL NULL bypasses and a public participant linked to a WhatsApp binding",
+    "rejects PostgreSQL NULL bypasses, untyped withdrawal evidence, and cross-channel bindings",
     async () => {
       if (!freshPostgresUrl) throw new Error("M004_POSTGRES_FRESH_URL_REQUIRED");
       assertDisposablePostgresUrl(freshPostgresUrl);
       const sql = createPublicChatSql(freshPostgresUrl);
       const suffix = crypto.randomUUID().replaceAll("-", "");
       const connectionId = `connection_null_contract_${suffix}`;
       const bindingId = `binding_null_contract_${suffix}`;
+      const contactWithdrawalEventId = `contact_withdrawal_${suffix}`;
+      const consentGrantEventId = `consent_grant_${suffix}`;
       const now = new Date();
       const expiresAt = new Date(now.getTime() + 30 * 60_000);
       try {
         await sql.begin(async (tx) => {
           await tx.unsafe("set local role atlas_communications_gateway");
           await tx`
             insert into communication_channel_connections (
               id, channel_kind, adapter_key, readiness_state, policy_version, version,
               created_at, updated_at
             ) values (
               ${connectionId}, 'whatsapp', 'meta_cloud', 'disabled', 'wa-policy.synthetic.v1', 1,
               ${now}, ${now}
             )
           `;
           await tx`
             insert into communication_contact_bindings (
               id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
               trust_state, locale, contact_policy_version, version, created_at, updated_at
             ) values (
               ${bindingId}, ${connectionId}, 'whatsapp', ${"a".repeat(64)}, 'digest.synthetic.v1',
               'linked_contact', 'en', 1, 1, ${now}, ${now}
             )
           `;
+          await tx`
+            insert into communication_contact_evidence_events (
+              id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+              evidence_receipt_id, receipt_kind, owning_domain, authority_role,
+              authority_version, contact_evidence_event_id, triggering_event_id,
+              policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+              occurred_at, created_at
+            ) values (
+              ${contactWithdrawalEventId}, ${bindingId}, 1, 'contact_withdrawal_recorded',
+              null, null, null, ${`withdrawal_receipt_${suffix}`}, 'contact_withdrawal',
+              'M078', 'consent', null, null, null, null, ${`withdrawal_correlation_${suffix}`},
+              ${now}, ${expiresAt}, ${now}, ${now}
+            )
+          `;
+          await tx`
+            insert into communication_contact_evidence_events (
+              id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+              evidence_receipt_id, receipt_kind, owning_domain, authority_role,
+              authority_version, contact_evidence_event_id, triggering_event_id,
+              policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+              occurred_at, created_at
+            ) values (
+              ${consentGrantEventId}, ${bindingId}, 2, 'consent_granted', 'transactional',
+              'granted', 'normal', ${`grant_receipt_${suffix}`}, 'consent_evidence',
+              'M078', 'consent', 1, null, null, null, ${`grant_correlation_${suffix}`},
+              ${now}, ${expiresAt}, ${now}, ${now}
+            )
+          `;
+          await tx`
+            insert into communication_contact_evidence_events (
+              id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+              evidence_receipt_id, receipt_kind, owning_domain, authority_role,
+              authority_version, contact_evidence_event_id, triggering_event_id,
+              policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+              occurred_at, created_at
+            ) values (
+              ${`valid_projection_${suffix}`}, ${bindingId}, 3, 'consent_withdrawn',
+              'transactional', 'withdrawn', 'withdrawn', null, null, null, null, 2,
+              ${contactWithdrawalEventId}, null, null, null, null, null, ${now}, ${now}
+            )
+          `;
         });
 
+        for (const kind of ["grant", "self"] as const) {
+          await expect(
+            sql.begin(async (tx) => {
+              await tx.unsafe("set local role atlas_communications_gateway");
+              const projectionId = `invalid_projection_${kind}_${suffix}`;
+              await tx`
+                insert into communication_contact_evidence_events (
+                  id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+                  evidence_receipt_id, receipt_kind, owning_domain, authority_role,
+                  authority_version, contact_evidence_event_id, triggering_event_id,
+                  policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+                  occurred_at, created_at
+                ) values (
+                  ${projectionId}, ${bindingId}, 4, 'consent_withdrawn', 'service',
+                  'withdrawn', 'withdrawn', null, null, null, null, 2,
+                  ${kind === "self" ? projectionId : consentGrantEventId}, null, null, null,
+                  null, null, ${now}, ${now}
+                )
+              `;
+            }),
+          ).rejects.toThrow();
+        }
+
         const invalidEnvelopeCases = [
           {
             eventKind: "text_message",
             receiptId: `receipt_text_${suffix}`,
             statement: `insert into communication_event_envelopes
             (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
              message_reference, canonical_text, body_retention_policy, occurred_at, created_at,
              updated_at)
            values ('envelope_text_${suffix}', 'receipt_text_${suffix}', '${connectionId}',
              'text_message', 'meta-envelope.v1', '${bindingId}', 'message_text', null, 'approved',
              now(), now(), now())`,
           },
           {
             eventKind: "interactive_reply",
             receiptId: `receipt_interactive_${suffix}`,
             statement: `insert into communication_event_envelopes
             (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
              message_reference, interactive_kind, interactive_id, interactive_title,
              occurred_at, created_at, updated_at)
            values ('envelope_interactive_${suffix}', 'receipt_interactive_${suffix}',
              '${connectionId}', 'interactive_reply', 'meta-envelope.v1', '${bindingId}',
              'message_interactive', null, 'reply', 'Reply', now(), now(), now())`,
           },
           {
             eventKind: "message_status",
             receiptId: `receipt_status_${suffix}`,
             statement: `insert into communication_event_envelopes
             (id, receipt_id, connection_id, event_kind, schema_version,
              external_message_reference, delivery_state, occurred_at, created_at, updated_at)
            values ('envelope_status_${suffix}', 'receipt_status_${suffix}', '${connectionId}',
              'message_status', 'meta-envelope.v1', null, 'delivered', now(), now(), now())`,
           },
           {
             eventKind: "media_reference",
             receiptId: `receipt_media_${suffix}`,
             statement: `insert into communication_event_envelopes
             (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
              message_reference, media_external_reference, media_declared_kind,
              occurred_at, created_at, updated_at)
            values ('envelope_media_${suffix}', 'receipt_media_${suffix}', '${connectionId}',
              'media_reference', 'meta-envelope.v1', '${bindingId}', 'message_media', null,
              'document', now(), now(), now())`,
           },
           {
             eventKind: "template_projection",
             receiptId: `receipt_template_${suffix}`,
             statement: `insert into communication_event_envelopes
             (id, receipt_id, connection_id, event_kind, schema_version,
              template_provider_reference, template_key, template_locale, template_category,
              template_provider_state, template_provider_version, template_provider_timestamp, template_components,
              occurred_at, created_at, updated_at)
            values ('envelope_template_${suffix}', 'receipt_template_${suffix}', '${connectionId}',
              'template_projection', 'meta-envelope.v1', null, 'template_key', 'en', 'utility',
              'provider_approved', 'provider.v1', now(), '[]'::jsonb, now(), now(), now())`,
           },
           {
             eventKind: "unsupported_verified",
             receiptId: `receipt_unsupported_${suffix}`,
             statement: `insert into communication_event_envelopes
             (id, receipt_id, connection_id, event_kind, schema_version, unsupported_reason,
              occurred_at, created_at, updated_at)
            values ('envelope_unsupported_${suffix}', 'receipt_unsupported_${suffix}',
              '${connectionId}', 'unsupported_verified', 'meta-envelope.v1', null,
              now(), now(), now())`,
           },
         ];
         for (const { eventKind, receiptId, statement } of invalidEnvelopeCases) {
           await expect(
             sql.begin(async (tx) => {
               await tx.unsafe("set local role atlas_communications_gateway");
               await tx.unsafe(`insert into communication_provider_event_receipts
                 (id, connection_id, channel_kind, external_event_reference, body_digest,
                  event_kind, state, schema_version, signature_verified, correlation_id,
                  processing_version, received_at, persisted_at, created_at, updated_at)
                 values ('${receiptId}', '${connectionId}', 'whatsapp',
                  'meta_evt_${suffix}', '${"b".repeat(64)}', '${eventKind}', 'persisted',
                  'meta-envelope.v1', true, 'correlation_${eventKind}_${suffix}', 1,
                  now(), now(), now(), now())`);
               await tx.unsafe(statement);
             }),
diff --git a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
index ae33909..4807b5e 100644
--- a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
+++ b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
@@ -860,95 +860,129 @@ export function runCommunicationsRepositoryConformance(
               operation: "consent_grant",
               bindingId: value.bindingId,
               issuedAt: CONFORMANCE_NOW,
               expiresAt: CONFORMANCE_TOMORROW,
             },
             now: CONFORMANCE_NOW,
           })).resolves.toMatchObject({ status: "changed", version: 2 });
         }
         await expect(repository.grantConsentFromReceipt({
           bindingId: value.bindingId,
           purpose: "transactional",
           operation: "consent_grant",
           receipt: {
             receiptId: `grant_transactional_next_${suffix(scenario)}`,
             owner: "consent",
             operation: "consent_grant",
             bindingId: value.bindingId,
             issuedAt: CONFORMANCE_NOW,
             expiresAt: CONFORMANCE_TOMORROW,
           },
           now: CONFORMANCE_NOW,
         })).resolves.toMatchObject({ status: "changed", version: 3 });
         const preQueue = await repository.referenceState();
         const policy = preQueue.policies
           .filter((record) => record.bindingId === value.bindingId)
           .reduce((latest, record) => record.version > latest.version ? record : latest);
         const queued = await queueOutbound(repository, scenario, {
           version: policy.version,
           fence: policy.fence,
         });
         const receipt = {
           receiptId: `contact_withdrawal_${suffix(scenario)}`,
           owner: "consent" as const,
           operation: "contact_withdrawal" as const,
           bindingId: value.bindingId,
           issuedAt: CONFORMANCE_NOW,
           expiresAt: CONFORMANCE_TOMORROW,
           correlationId: `withdrawal_${suffix(scenario)}`,
         };
         await expect(repository.withdrawContact({
           bindingId: value.bindingId,
           evidence: { source: "authority", receipt },
           now: CONFORMANCE_NOW,
         })).resolves.toMatchObject({
           status: "changed",
           cancelledCommandIds: [queued.commandId],
         });
         const after = inspectState ? await inspectState() : await repository.referenceState();
         for (const [purpose, version] of [["transactional", 4], ["service", 3]] as const) {
           expect(after.consentHistory
             .filter((record) => record.bindingId === value.bindingId && record.purpose === purpose)
             .at(-1))
             .toMatchObject({
               state: "withdrawn",
               version,
               authorityReceiptId: undefined,
             });
         }
         expect(after.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
           .toEqual([
             expect.objectContaining({
               bindingId: value.bindingId,
               source: "authority",
               receiptId: receipt.receiptId,
               correlationId: receipt.correlationId,
             }),
           ]);
         expect(after.policies
           .filter((record) => record.bindingId === value.bindingId)
           .every((record) => record.state === "withdrawn"))
           .toBe(true);
         expect(after.outbound).toContainEqual(expect.objectContaining({
           commandId: queued.commandId,
           state: "cancelled",
         }));
         await expect(repository.withdrawContact({
           bindingId: value.bindingId,
           evidence: { source: "authority", receipt },
           now: CONFORMANCE_NOW,
         })).resolves.toMatchObject({ status: "duplicate", cancelledCommandIds: [] });
+        const alteredWindowResults = await Promise.all([
+          repository.withdrawContact({
+            bindingId: value.bindingId,
+            evidence: {
+              source: "authority",
+              receipt: {
+                ...receipt,
+                issuedAt: new Date(receipt.issuedAt.getTime() - 1),
+              },
+            },
+            now: CONFORMANCE_NOW,
+          }),
+          repository.withdrawContact({
+            bindingId: value.bindingId,
+            evidence: {
+              source: "authority",
+              receipt: {
+                ...receipt,
+                expiresAt: new Date(receipt.expiresAt.getTime() + 1),
+              },
+            },
+            now: CONFORMANCE_NOW,
+          }),
+        ]);
+        expect(alteredWindowResults).toEqual([
+          { status: "denied", code: "withdrawal_evidence_invalid" },
+          { status: "denied", code: "withdrawal_evidence_invalid" },
+        ]);
         await expect(repository.withdrawContact({
           bindingId: value.bindingId,
           evidence: {
             source: "authority",
             receipt: { ...receipt, correlationId: `${receipt.correlationId}_mismatch` },
           },
           now: CONFORMANCE_NOW,
         })).resolves.toEqual({ status: "denied", code: "withdrawal_evidence_invalid" });
         const finalState = inspectState ? await inspectState() : await repository.referenceState();
         expect(finalState.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
           .toHaveLength(1);
+        expect(finalState.withdrawalHistory.at(-1)).toMatchObject({
+          owner: receipt.owner,
+          operation: receipt.operation,
+          issuedAt: receipt.issuedAt,
+          expiresAt: receipt.expiresAt,
+        });
       });
     });
   });
 }
```
