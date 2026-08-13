DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "public_chat_idempotency" LIMIT 1) THEN
    RAISE EXCEPTION 'M003 command_fingerprint migration requires an empty pre-activation idempotency table; sensitive command payloads cannot be fingerprinted retroactively';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD COLUMN "command_fingerprint" varchar(64) NOT NULL;
