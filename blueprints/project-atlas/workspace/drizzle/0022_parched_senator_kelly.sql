ALTER TABLE "form_outbox" ADD COLUMN "lease_purpose" varchar(16) DEFAULT 'dispatch' NOT NULL;--> statement-breakpoint
UPDATE "form_outbox" SET "lease_purpose" = 'reconcile' WHERE "state" = 'unknown';--> statement-breakpoint
ALTER TABLE "form_outbox" ADD CONSTRAINT "form_outbox_lease_purpose_valid" CHECK ("form_outbox"."lease_purpose" in ('dispatch', 'reconcile'));
