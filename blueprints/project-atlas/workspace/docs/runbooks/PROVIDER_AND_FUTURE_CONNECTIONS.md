# Provider and Future Connections Map

- Owner: Product Owner
- Status: Planning inventory only
- Updated: 2026-08-24
- Scope: Known provider-disabled foundations M003-M019 and future connection families

## Rules before any connection

This document is a checklist, not activation authority. A provider remains disabled until the Product Owner approves its module activation, secrets, data handling, contracts, monitoring, rollback and evidence. No row below authorizes production traffic, persistence, payments, appointments, messages, filings, credit actions or data sharing.

## Current provider-disabled foundations

| Module | Capability | Provider or owner to connect later | Minimum activation evidence |
| --- | --- | --- | --- |
| M003 | Public chat | Approved LLM/orchestration adapter | Consent, safe prompt boundary, rate limit, retention, human fallback |
| M004 | WhatsApp | Meta WhatsApp Business API | Approved number, templates, opt-in, webhook verification, delivery reconciliation |
| M005 | Voice agent | Approved telephony/voice adapter | Number ownership, recording policy, consent, webhook replay protection, takeover procedure |
| M006 | Public forms | Postgres/CRM owner, anti-spam, Calendar, Stripe only when scoped | Server validation, consent ledger, abuse controls, duplicate policy, durable queue |
| M007 | Client authentication | Self-hosted Supabase Auth preferred; Google OAuth; SMTP; future MFA | Secure cookies, redirect allowlist, email verification, session revocation, audit evidence |
| M008 | Client dashboard | M009-M014 and future canonical owner projections | Per-owner authorization, private cache, partial-failure evidence, no direct provider reads |
| M009 | My services | M021 service-order canonical owner | Entitlements, resource authorization, public DTO contract, authoritative read model |
| M010 | Process status | Case/workflow/document/payment/task canonical owners | Read fences, status policy, timeline source ownership, no inferred operational state |
| M011 | Document portal | Self-hosted Supabase Storage preferred; AV scan; KMS/key custody | Private buckets, signed URLs, malware status, retention, audit, restore test |
| M012 | Secure messaging | Message persistence owner; approved delivery channels when authorized | Participant authorization, immutable audit, consent, delivery reconciliation, retention |
| M013 | Client appointments | Google Calendar adapter or approved calendar provider | OAuth scopes, availability source, timezone, webhook/reconciliation, cancellation policy |
| M014 | Client payments | Stripe | Server-created checkout, signed webhooks, reconciliation, PCI boundary, financial audit |
| M015 | Financial/business profile | KMS, OCR, AI only after policy approval | PFL policy values, encryption/key custody, purpose checks, retention, human review |
| M016 | Admin dashboard | M017-M026/M042-M046 owner projections | Staff authorization, count-inference controls, private cache, owner availability evidence |
| M017 | CRM | Canonical M018-M023 owners; future import/export/channel/AI adapters | Purpose binding, dedup/merge controls, audit, retention, export authorization |
| M018 | Client management | Identity/contact verification and approved partner adapters | Identity proof policy, representative authorization, sensitive-data controls |
| M019 | Organization management | Filing/business-verification adapter when approved | Jurisdiction policy, authority evidence, reauthentication, external reconciliation |

## Future provider families

These families are expected planning areas for M020-M110. The canonical module catalog and each approved PRD decide the exact module owner. Do not select or connect a vendor merely because it appears here.

| Future family | Candidate connection | Product Owner decision still required |
| --- | --- | --- |
| Core hosting and data | Dokploy, Docker/OCI, self-hosted Supabase/PostgreSQL, Cloudflare edge | Server, domains, backups, access controls, migration timing |
| Email and notifications | Transactional email provider, SMS, WhatsApp, push | Deliverability, opt-in, templates, retention, cost |
| Calendar and meetings | Google Calendar or approved replacement | OAuth ownership, scopes, availability, reconciliation |
| Payments and billing | Stripe and approved financial processors | Jurisdiction, products, pricing authority, disputes/refunds workflow |
| Private documents | Object storage, malware scanning, KMS/HSM, OCR | Data classification, key custody, retention, human review |
| AI and automation | Local Ollama models, approved hosted models, n8n | Allowed data classes, human approval, logs, model/provider policy |
| Credit and identity data | IdentityIQ, credit-monitoring providers, identity verification | Contracts, permissible purpose, consent, adverse-action/legal review |
| Government and filing systems | IRS, state agencies, court or regulatory portals | Legal authority, licensed workflow, human verification, no automated filing by default |
| Marketplace and partners | Financial providers, affiliate/referral partners, partner APIs | Partner contracts, disclosures, consent, ranking policy, no invented offers |
| Observability and security | Sentry/PostHog alternatives, monitoring, SIEM, backups | Data minimization, self-host versus managed cost, incident response |

## Recommended activation order

1. Establish self-hosted data, backup and secret-management evidence.
2. Activate identity and authorization only after M007 security gates.
3. Connect canonical operational owners before client dashboard aggregations.
4. Activate documents, calendar, messaging and payments one bounded provider at a time.
5. Add regulated credit, tax, government, marketplace and AI integrations only after their dedicated policy and compliance gates.

## Product Owner decisions pending

- Which provider, account owner and environment are approved for each row.
- Whether the integration is self-hosted, managed or deferred.
- Which data classification and retention period apply.
- Who owns support, monitoring, incident response and reconciliation.
- Whether a staging proof and an independent security review are required before activation.