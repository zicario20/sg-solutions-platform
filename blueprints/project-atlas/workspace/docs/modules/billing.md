# Module PRD — Billing

- Owner: Product Architect
- Status: Approved baseline (Product Owner, 2026-08-02); implementation remains withheld pending Phase 0 acceptance and module readiness
- Update rule: synchronize with quote, invoice, Stripe and reconciliation contracts

Support a foundation price engine with `public`, `from`, `quote` and `consultation` modes plus personalized quotes, deposits, one-time payments, payment plans, invoices and service-linked subscriptions. Publication is off by default and requires per-service Product Owner activation. Partner prices/rates require source, effective date and disclosures. Stripe is external financial authority; Postgres holds operational snapshots and recovery records. Payment confirmation does not grant human approval automatically.
