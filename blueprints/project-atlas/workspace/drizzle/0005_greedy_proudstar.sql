DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "public_chat_conversations" LIMIT 1) THEN
    RAISE EXCEPTION 'M003 start idempotency migration requires an empty pre-activation conversation table; prior start requests cannot be reconstructed safely';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD COLUMN "start_idempotency_key" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD COLUMN "start_fingerprint" char(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_session_start_key_unique" UNIQUE("session_id","start_idempotency_key");
