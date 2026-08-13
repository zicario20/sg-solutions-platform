# M003 Public Chat Runbook

- Owner: SG Solutions operator
- Technical owner: Codex Architecture Agent
- Scope: provider-disabled local/staging M003 only
- Status: Build-verified; external activation and production deployment deferred

## Purpose

Operate, validate, disable and recover the public chat without implying that an external AI,
staffed inbox or production provider is active. Postgres owns durable conversation metadata;
message bodies remain disabled under `metadata_only` until the Product Owner approves CHAT-001.

## Required configuration

Use server-only secret storage. Never put values in a browser-visible variable or commit them.

- `PUBLIC_CHAT_STATE=local|staging`; other states remain disabled under Decision 028.
- `PUBLIC_CHAT_ENABLED=true` only in the approved local/staging environment.
- `PUBLIC_CHAT_CANONICAL_ORIGIN` is the exact origin.
- `DIRECT_DATABASE_URL` uses the migration owner and is never used by the application runtime.
- `CHAT_DATABASE_URL` uses the distinct `atlas_public_chat_runtime` login. It is a member of the
  `NOLOGIN`, `NOINHERIT`, `NOBYPASSRLS` gateway role and must not be a superuser or migration owner.
- `ATLAS_CHAT_RUNTIME_PASSWORD` is a local-only provisioning input of at least 32 characters. Do
  not reuse a production secret or commit it.
- `CHAT_RATE_LIMIT_SECRET` and `CHAT_COMMAND_FINGERPRINT_SECRET` are independent random secrets of at
  least 32 characters. Rotate through a documented maintenance window; rotation invalidates stable
  buckets/fingerprints for pending retries.
- Session/message/lifetime caps remain inside the approved config bounds.

## Start and health checks

1. Confirm the environment is not production and no provider credentials are present.
2. Install with the frozen lockfile.
3. Apply Drizzle migrations with `DIRECT_DATABASE_URL` through `pnpm db:migrate`; never edit
   Supabase manually. Standard PostgreSQL and Supabase are both supported: browser-role revocation
   is conditional when `anon` or `authenticated` does not exist.
4. For the loopback-only local database, provision the separate runtime principal with
   `pnpm db:chat:provision-local`; the command refuses non-loopback databases. Production role
   provisioning requires a separately approved infrastructure procedure.
5. Set `CHAT_DATABASE_URL` to the runtime login and run `pnpm db:chat:validate-runtime`. The check
   must prove direct table access is denied and access works only after `SET LOCAL ROLE
   atlas_public_chat_gateway`.
6. Run M003 unit, real-Postgres integration, type, lint/format, public build and desktop/mobile
   browser checks.
7. Verify `/health`, `/chat/`, `/en/chat/` and a disabled external handoff fallback.
8. Confirm no transcript bodies, sensitive values or raw network identifiers appear in database,
   logs, traces or analytics.

Migrations 0003–0005 intentionally fail closed when preactivation M003 conversation/idempotency
tables contain rows because prior command kinds/fingerprints cannot be inferred safely. This is
valid before activation only. If rows exist, stop; do not bypass the guard or fabricate a backfill.

## Expected behavior

- The visitor sees the automated-assistant/privacy notice before starting.
- Spanish/English changes occur in the active document and preserve visible in-memory messages.
- Durable storage keeps message metadata/citations but no body.
- Lost start/message responses retry with the same idempotency key.
- A replay whose body was intentionally not retained explains that it cannot recover the answer.
- Sensitive-input rejection occurs before knowledge/model work.
- Human handoff remains unconfirmed without a durable receipt and falls back to contact.

## Disable and rollback

Set `PUBLIC_CHAT_ENABLED=false` or `PUBLIC_CHAT_STATE=disabled`, rebuild the approved environment and
verify the launcher is unavailable while the Help Center/contact paths remain usable. Do not roll
back destructive schema changes. Roll back application code compatibly and preserve migrations;
restore data only through the approved backup/recovery process.

## Incident triage

1. Disable chat if isolation, sensitive-data leakage, replay corruption or false provider success
   is suspected.
2. Preserve bounded correlation IDs, audit metadata and deployment revision; never copy transcript
   bodies or secrets into tickets/chats.
3. Classify whether the issue is session/origin/CSRF, rate limit, database, content filter,
   deterministic knowledge, handoff or UI/accessibility.
4. Escalate security/privacy events to the Product Owner and independent security reviewer.
5. Correct with a regression test, rerun the complete gate and document the incident/outcome.

## External activation gate

Do not connect model/moderation/translation, CRM, scheduling, payments or staffed communications
until CHAT-001–CHAT-007 have the applicable Product Owner decisions, contracts, credentials,
sandbox evidence, observability/reconciliation and independent security approval. Only a separate
production PCR may support `Operational` status.
