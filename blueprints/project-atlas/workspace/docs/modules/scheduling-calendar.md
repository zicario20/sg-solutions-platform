# Module PRD — Scheduling and Calendar

- Owner: Product Architect
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M013, M024 (documentary references only; not implementation authorization)

Goal: provide a narrow owned booking engine synchronized safely with Google Calendar.

In scope: appointment types, availability, blocks, booking, cancellation, rescheduling, time zones, Google mapping, ETags and incremental synchronization. Out of scope: a full Calendly replacement and Google as operational source of truth.

Requirements: concurrent booking cannot double-book; internal Postgres state remains durable authority; provider writes use idempotency and conditional updates; expired sync tokens recover deterministically; manual recovery exists for exhausted retries.
