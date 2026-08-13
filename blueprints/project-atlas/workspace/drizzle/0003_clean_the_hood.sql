DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "public_chat_idempotency" LIMIT 1) THEN
    RAISE EXCEPTION 'M003 command_kind migration requires an empty pre-activation idempotency table; existing command kinds cannot be inferred safely';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD COLUMN "command_kind" varchar(16) NOT NULL;--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_command_kind_valid" CHECK ("public_chat_idempotency"."command_kind" in ('message', 'handoff', 'locale', 'close'));
