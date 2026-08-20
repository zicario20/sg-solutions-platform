# Module PRD — Automation and Observability

- Owner: Codex Architecture Agent
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M068, M072, M073, M097 (documentary references only; not implementation authorization)

Goal: coordinate recoverable background work and diagnose failures without leaking client data.

In scope: durable job rows, Inngest coordination, bounded retries, idempotency keys, structured logs, traces, Sentry and minimized PostHog events. Out of scope: Inngest as source of truth and unrestricted portal replay/autocapture.

Requirements: every job has durable Postgres state, an idempotency key, retry limit and manual recovery path; Inngest coordinates but never owns business state. Telemetry rejects documents, identifiers, tax/credit data, case notes, free text and raw bodies. Provider outages do not corrupt operational state. Cyber Neo reviews logging, secrets, dependencies and CI configuration read-only.
