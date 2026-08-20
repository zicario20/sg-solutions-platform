ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_id_binding_unique";--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_contact_binding_fk";
--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD COLUMN "contact_evidence_event_kind" varchar(40) DEFAULT 'contact_withdrawal_recorded' NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_id_binding_kind_unique" UNIQUE("id","binding_id","event_kind");--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_typed_contact_binding_fk" FOREIGN KEY ("contact_evidence_event_id","binding_id","contact_evidence_event_kind") REFERENCES "public"."communication_contact_evidence_events"("id","binding_id","event_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_contact_kind_valid" CHECK ("communication_contact_evidence_events"."contact_evidence_event_kind" = 'contact_withdrawal_recorded');
