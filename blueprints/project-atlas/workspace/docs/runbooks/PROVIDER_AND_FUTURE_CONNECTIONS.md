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
| M043 | Stripe payment boundary | Stripe through the disabled M041-compatible adapter | M046 price snapshot, M044 verification, M045 entitlement contract, M024 refund approval, M077 audit, M078 consent, M083 secrets, sandbox/reconciliation/RLS/rollback evidence |
| M015 | Financial/business profile | KMS, OCR, AI only after policy approval | PFL policy values, encryption/key custody, purpose checks, retention, human review |
| M016 | Admin dashboard | M017-M026/M042-M046 owner projections | Staff authorization, count-inference controls, private cache, owner availability evidence |
| M017 | CRM | Canonical M018-M023 owners; future import/export/channel/AI adapters | Purpose binding, dedup/merge controls, audit, retention, export authorization |
| M018 | Client management | Identity/contact verification and approved partner adapters | Identity proof policy, representative authorization, sensitive-data controls |
| M019 | Organization management | Filing/business-verification adapter when approved | Jurisdiction policy, authority evidence, reauthentication, external reconciliation |
| M031 | Bookkeeping and accounting | QuickBooks Online, Xero, bank-data, receipt, payroll, commerce, expense and tax-platform adapters | Separate provider approval, scoped secrets, internal-ledger source-of-truth policy, RLS/migration evidence, signed ingress, idempotent reconciliation, kill switch, security review and rollback |
| M057 | Home Buying Assistance Agent | Approved mortgage/program/property/provider adapters through M041; M064 current sources | Service-role/lending boundary, co-applicant consent, source freshness, specialist/compliance approvals, sandbox, rollback |
| M058 | Document Specialist Agent | M011/M065 document processing, private storage, OCR/parser, M066/M067 delivery/signature owners | Quarantine, malware, retention, provenance, secure delivery, human review, security review, rollback |
| M059 | Marketplace Assistant | M037/M038 plus approved M039-M041 provider, partner, referral, and redirect adapters | Disclosures, consent, data minimization, neutrality, source freshness, open-redirect protection, specialist review, rollback |

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

## M041 - Provider Abstraction

- Status: disabled foundation.
- Providers: no live provider enabled.
- Capabilities: canonical contracts only.
- External network calls: blocked.
- Webhooks, polling and file exchange: not implemented.
- Credentials: secret references only; no values committed.
- Activation: requires separate Product Owner approval.

## M043 - Stripe Payments

- Status: disabled controlled foundation.
- Provider: StripePaymentAdapter has no enabled capabilities and rejects external operations.
- Secrets: account and credential references only; no key, webhook secret or raw card data is committed.
- Payment boundary: M043 creates provider evidence and M044 alone verifies payment. Browser returns
  and Stripe events do not start work or grant entitlements.
- Activation: requires a separately approved Stripe sandbox plan, M046/M044/M045 integration,
  M024 approval policy, M077 audit, M078 consent, M083 secret management, migration/RLS evidence,
  reconciliation, security review and rollback plan.

## M044 - Payment Verification

- Status: disabled controlled foundation.
- Owner: M044 is the sole authority for verified SG Solutions payment facts, payment sufficiency
  and the payment-start gate; it is provider neutral.
- Input boundary: M043 and future approved adapters contribute evidence candidates only. Browser
  returns, amount matches, client assertions and AI are not verification evidence.
- Activation: requires Product Owner payment-policy approval, M043 current/signed evidence, M046
  obligation/price references, M024/M074 approval, M045/M068 handoff contracts, M077 audit, M078
  consent, M083 secrets, migration/RLS evidence, sandbox reconciliation, recovery test and
  independent finance/security review.

## M045 Service Entitlements
<!-- M045_SERVICE_ENTITLEMENTS_PROVIDER_DISABLED -->

Status: provider disabled. M045 has no external provider integration and must not
receive raw payment processor data, invoke partners, or dispatch workflow actions.
Future M044, approval, document, consent, identity, and M068 adapters require separate
Product Owner approval, security review, durable repository evidence, and rollback
planning before any flag can be enabled.

## M046 Pricing, Discounts, and Promotions

- Status: disabled controlled foundation.
- Provider: no payment, tax, promotion, checkout, invoice, refund, or external-fee
  provider is connected by M046.
- Authority: `@atlas/pricing` calculates only from versioned internal configuration;
  M043 consumes an approved snapshot later and M044 remains payment-verification owner.
- Data: no real prices, payment data, customer quote, provider credential, or external
  fee source is committed. Snapshot and schema contracts use references and integer
  amounts only.
- Activation: requires Product Owner commercial-policy approval, M042/M043/M044/M045/M068
  integration evidence, approved authorization/RLS and migration plan, sandbox evidence,
  reconciliation/rollback runbook, and independent finance/security review.

## M047 Internal AI Hub

- Status: disabled controlled foundation.
- Providers: no local Ollama/Qwen, cloud model, vector/RAG, skill, tool, node, job, or secret provider is connected by M047.
- Local model path: `ollama_local` is a metadata-only future provider kind. It is not a configured endpoint, credential, runtime, or authorization to call a local model.
- Data: no provider credential, raw prompt, private reasoning, document bytes, customer context, or actual model output is committed. The schema stores minimized references and policy/evidence records only.
- Activation: requires Product Owner AI policy; M041/M061-M064/M072/M076/M083/M094/M095 owner approval; exact model/prompt/tool/knowledge policy; sandbox/red-team/privacy/evaluation evidence; approved migration/RLS/rollback; independent AI/security review; and a limited rollout plan.

## M048 Supervisor Agent

| Provider or capability | Status | Connection requirement |
| --- | --- | --- |
| Supervisor runtime | Disabled | Product Owner release gate, routing policy, M047 asset release, security and staging evidence |
| Specialist delegation | Disabled | Authorized specialist manifests, consent/ownership checks, human queue, and rollback plan |
| Model provider calls | Disabled | M047 provider approval and separate provider configuration |
| Automatic rerouting and parallel execution | Disabled | Bounded budget/SLA/fallback policy and operational approval |

## M060-M062 - Compliance, Skills, and Knowledge

| Module | Provider or capability | Status | Connection requirement |
| --- | --- | --- | --- |
| M060 | Compliance source lookup, policy evaluation, release, and external actions | Disabled | M064 source authority, M076 canonical controls, M074/M075 approvals, immutable audit, security evidence, and Product Owner authorization |
| M061 | Model invocation, skill execution, tools, jobs, workflows, cache, fallback, and external writes | Disabled | M047 control-plane binding, IAM/resource enforcement, release/audit controls, staging evidence, and Product Owner authorization |
| M062 | Source ingestion, publication, delivery, retrieval, indexing, AI drafting, and export | Disabled | M063 retrieval, M064 source authority, editorial/domain/compliance approval, projection controls, staging evidence, and Product Owner authorization |

## M063-M065 - Retrieval, Sources, and Document Processing

| Module | Provider or capability | Status | Connection requirement |
| --- | --- | --- | --- |
| M063 | Embeddings, vector/lexical retrieval, ranking, context delivery, cache, jobs, and AI | Disabled | M062 projections, M064 freshness, tenant/projection isolation, M072/M068 controls, evaluation, security review, and Product Owner authorization |
| M064 | Source discovery, fetch, connectors, parsing handoff, snapshot promotion, refresh jobs, and source-direct retrieval | Disabled | Approved source governance, allowlisted connectors, SSRF protections, M065, M072/M068, audit, and Product Owner authorization |
| M065 | File bytes, parsing, rendering, OCR, conversion, redaction, archive extraction, malware scanning, jobs, and delivery | Disabled | Sandbox, quarantine, M011/M058/M064 boundaries, PII/retention controls, M072/M068, security review, and Product Owner authorization |
| M066 | Document renderer, PDF/DOCX conversion, remote assets, source refresh, AI drafting, delivery, and signature handoff | Disabled | Contracts only; activation requires sandboxing, governance, M65/M67/M68/M72 integration, security review, staging evidence, rollback, and Product Owner authorization. |
| M067 | DocuSeal and all electronic-signature provider calls, signing sessions, webhooks, reminders, downloads, and reconciliation | Disabled | Provider-agnostic contracts only; requires agreement, secrets, verification, audit, staging evidence, rollback, and Product Owner authorization. |
| M068 | Workflow scheduler, timers, signals, M72 jobs, n8n, agents, outbox publication, and side effects | Disabled | Durable orchestration contracts only; requires migrations, transactional outbox/inbox, authorization, audit, M72/M74/M75 integrations, staging evidence, rollback, and Product Owner authorization. |

## M069-M071 automation foundations

| Module | Provider or capability | Current status | Required activation work |
| --- | --- | --- | --- |
| M069 | n8n instance, workflows, webhooks, credentials, callbacks, jobs, and AI-triggered adapter actions | Disabled | Deploy approved n8n, configure secrets outside Git, signed webhooks, typed contracts, reconciliation, isolation, backups, monitoring, and Product Owner approval. |
| M070 | Browser workers, browser binaries, portal navigation, authentication state, cookies, uploads, downloads, screenshots, and side-effecting actions | Disabled | Approve a specific portal use case, worker isolation, network allowlist, secrets, action gates, evidence, reconciliation, legal/security review, and Product Owner approval. |
| M071 | Source refresh, rule-pack publication, jurisdiction resolution, portal selection, browser binding dispatch, and external submissions | Disabled | Validate official sources and freshness, approve versioned rules, compliance review, M064/M068 integration, tests, rollback, and Product Owner approval. |

## M072-M074 orchestration foundations

| Module | Provider or capability | Current status | Required activation work |
| --- | --- | --- | --- |
| M072 | Queue backend, worker pools, leases, scheduling, retries, dead-letter consumers, result delivery | Disabled | Select and secure a durable backend, configure isolated workers and least privilege, implement outbox/inbox, idempotency, reconciliation, backups, monitoring, and Product Owner approval. |
| M073 | Health probes, circuit breakers, target connections, automatic failover/failback, degraded-mode enforcement, fallback dispatch | Disabled | Approve target equivalence and hard gates, implement health/reconciliation/idempotency controls, integrate owner modules, test recovery, and obtain Product Owner approval. |
| M074 | Approval policy activation, human decision authority, MFA/step-up, notification delivery, M068 consumption, quorum/delegation workflows | Disabled | Integrate IAM and MFA, approve policies/SoD/quorum/expiry rules, configure durable events/audit/notifications, validate stale-context controls, and obtain Product Owner approval. |

## M075-M077 control foundations

| Module | Capability | Status | Activation requirements |
| --- | --- | --- | --- |
| M075 | Human task review, handback, and reviewer assignment | Provider disabled | IAM and reviewer eligibility, approved task definitions, M068 workflow bindings, M074 approvals, M077 audit, review UX, notification and escalation policy. |
| M076 | Compliance applicability, assessment, findings, exceptions, and monitoring | Provider disabled | M064 approved sources, M071 jurisdiction rules, legal/compliance ownership, M068 gates, M074 approvals, M075 review, M077 audit, retention and escalation policy. |
| M077 | Material audit append, ingestion, search, integrity, export, and retention | Provider disabled | Durable append-only store, KMS/integrity design, IAM/export controls, retention/hold policy, backup/restore validation, M080-M085 data controls, M097 observability boundary. |
## M078-M080 control foundations

| Module | Capability | Status | Activation requirements |
| --- | --- | --- | --- |
| M078 | Consent presentation, grant, withdrawal, data sharing, and pre-action checks | Provider disabled | M080 identity binding, M081 authorization, approved consent copy/versioning, M067 signatures where needed, M068 gates, M075/M076 review, M077 audit, M082/M085 privacy and retention controls. |
| M079 | Risk assessment, scoring, treatment, acceptance, KRI monitoring, and gates | Provider disabled | Product Owner-approved taxonomy, score/appetite/tolerance policy, M074 approvals, M075 review, M076 compliance, M077 audit, M078 consent, M080/M081 security, M068 workflow and M097 observability. |
| M080 | Identity, authentication, MFA, sessions, service identities, federation, and delegation | Provider disabled | Product Owner-approved auth provider and lifecycle, M081 least privilege, M077 audit, M079 risk, M082 PII, M083 secrets, M084 integration security, M085 retention, M091 administration, and independent security review. |
## M081-M083 control foundations

| Module | Capability | Status | Activation requirements |
| --- | --- | --- | --- |
| M081 | RBAC, policy evaluation/enforcement, scopes, grants, denies, JIT, delegation, and break-glass | Provider disabled | M080 identity/authentication, Product Owner-approved role/permission catalog and SoD policy, M074-M079 controls, M082-M084 security boundaries, M091 administration, audit, security review, rollback plan. |
| M082 | PII classification, field protection, filtering, masking, tokenization, redaction, export, sharing, and AI data release | Provider disabled | Product Owner-approved taxonomy/field policies, M078 consent, M080/M081 access controls, M076 compliance, M077 audit, M083/M084 security, M085 retention, M065 technical redaction, M097 observability. |
| M083 | Vault/provider binding, secret retrieval/injection, leases, dynamic credentials, rotation, revocation, scanning, and cache | Provider disabled | Product Owner-approved vault/KMS, service identities, M081 policy, environment separation, rotation/revocation/incident runbooks, secret scanning, audit, backup/recovery, M080/M082/M084/M085 controls. |
## M084-M086 control foundations

| Module | Capability | Status | Activation requirements |
| --- | --- | --- | --- |
| M084 | Provider/onboarding, allowlists, outbound egress, webhooks, signing, replay, retries, reconciliation, and provider health | Provider disabled | Product Owner-approved provider inventory/endpoints, M080-M083 controls, webhook and egress policy, PII/secret rules, provider capabilities, M068/M069/M070/M072 runtimes, audit/risk/compliance review, incident runbooks. |
| M085 | Retention classes/policies, holds, archival, deletion, purge, provider deletion, tombstones, and backup reconciliation | Provider disabled | Approved legal/compliance retention policy and sources, hold/subject-request process, M064/M071/M076, M068 workflows, M077 audit, M082-M084 controls, backup lifecycle, provider deletion/recovery verification. |
| M086 | Route registry, navigation composition, locale labels, aliases/redirects, permission-aware resolution, and IA telemetry | Provider disabled | Product Owner-approved surface/route/navigation map, M081 authorization mapping, M087/M088 UX/design review, M089/M090 integration, existing-route compatibility, redirect and telemetry privacy policy. |
## M087-M089 - Provider and runtime activation register

| Module | Capability | Current status | Activation prerequisite |
| --- | --- | --- | --- |
| M087 Design System | Token distribution, themes, component registry, visual testing and telemetry | Disabled | Product Owner-approved versioned release, visual/accessibility evidence and rollback plan |
| M088 UX Principles | Journey runtime, state rendering, feedback delivery, reviews and telemetry | Disabled | Product Owner-approved journey scope, canonical domain state integration and UX/accessibility evidence |
| M089 Global Search | Search provider, indexing, lexical/semantic retrieval, autocomplete and telemetry | Disabled | Product Owner-approved corpus/provider, M081/M082/M085 policy validation, indexing/deletion tests and security review |
## M090-M092 - Provider and runtime activation register

| Module | Capability | Current status | Activation prerequisite |
| --- | --- | --- | --- |
| M090 System Configuration | Runtime resolution, feature flags, sourced-fact refresh, validation, activation, rollout and rollback | Disabled | Product Owner-approved lifecycle, M074/M081/M083/M084 integration, validation and rollback evidence |
| M091 User Administration | Directory, invitations, provisioning, grants, suspension, session revocation, MFA reset and identity-provider actions | Disabled | Product Owner-approved lifecycle, M080/M081 integration, step-up controls, M074 approval policy and M077 audit evidence |
| M092 Reports and Analytics | Analytical provider, query planning/execution, refresh, materialization, delivery, export and telemetry | Disabled | Product Owner-approved datasets/metrics/providers, M081/M082/M085 policy validation, export controls and audit evidence |
## M093-M095 - Provider and runtime activation register

| Module | Capability | Current status | Activation prerequisite |
| --- | --- | --- | --- |
| M093 Homelab | Node enrollment, segmentation, management plane, remote access, storage/container runtime, power/thermal control | Disabled | Product Owner-approved topology/site/network/power plan, hardware validation and M080/M081/M083/M084/M097/M098/M099 evidence |
| M094 Lightweight Local AI Node | Local runtime/model, inference gateway, RAG-assisted calls, tools, escalation, fallback and telemetry | Disabled | Product Owner-approved model/runtime/task classes, verified artifacts, M093 readiness, security/tool reviews and rollback evidence |
| M095 GPU Node RTX 3090 Ti | NVIDIA/CUDA/runtime, GPU discovery, model artifacts/load, scheduler, inference, tools and telemetry | Disabled | Product Owner-approved hardware/power/cooling/workload scope, driver/CUDA compatibility, benchmark/certification and rollback evidence |
## M096-M098 - Provider and runtime activation register

| Module | Capability | Current status | Activation prerequisite |
| --- | --- | --- | --- |
| M096 Voice Gateway | Voice providers, numbers, signaling, media, STT/TTS, recording, transcription, transfers and failover | Disabled | Product Owner approval, M078 consent policy, M081/M082 authorization and data review, M083 secret references, M084 provider verification, M093 network evidence, M097 telemetry, sandbox test and rollback evidence |
| M097 Observability | Collector/gateway, ingest, stores, exporters, queries, alerts, dashboards and synthetic probes | Disabled | Product Owner approval, trusted source identity, M081/M082 query access, M083 provider references, redaction/cardinality validation, M085 retention mapping, M098 recovery coverage and alert runbooks |
| M098 Backup / Recovery | Schedules, source adapters, repositories, encryption, backup writes, replication, verification, restore, PITR and promotion | Disabled | Product Owner approval, M081/M082 restore controls, M083 key references, M085 retention rules, M093 repository/failure-domain evidence, M097 monitoring, M099 coordination, isolated restore tests and rollback evidence |
## M099-M101 - Deployment and roadmap activation register

| Module | Capability | Current status | Activation prerequisite |
| --- | --- | --- | --- |
| M099 Deployments | Artifact registry/build links, target discovery, release promotion, rollout, traffic shifting, migration execution, health checks and rollback | Disabled | Product Owner release authorization, M090 config and M083 secret references, verified M093 target readiness, artifact/provenance policy, M097 health evidence, M098 recovery evidence, migration/rollback rehearsal, staging validation and independent security review. |
| M100 Technical Roadmap | Evidence aggregation, prioritization, work creation, provider activation, deployment orchestration and change execution | Disabled | Product Owner-approved roadmap governance, trusted owner-module evidence, authorization/audit boundaries, explicit decision-gate lifecycle and a separately approved operational rollout. |
| M101 Business Roadmap | Market/KPI data access, CRM use, campaign execution, pricing/catalog changes, partner activation, payment actions and experiments | Disabled | Product Owner-approved commercial policy, M042/M046/M092 boundaries, M076 compliance, M077 audit, M078/M081/M082/M085 controls, approved metrics and a bounded rollout with stop conditions. |
## M102-M103 - Ideas and deferred-work activation register

| Module | Capability | Current status | Activation prerequisite |
| --- | --- | --- | --- |
| M102 Ideas | Intake channels, attachments/links, semantic dedupe, search/ranking, workflow/jobs, notifications, destination adapters and analytics | Disabled | Product Owner governance, M081 authorization, M077 audit, M082/M085 privacy/retention, M063/M064 evidence/search controls, M072/M068 orchestration, M074/M075 review, M097 observability and bounded rollout. |
| M103 Parking Lot | Source transfer, revisit scheduling/triggers, context refresh, search, notifications, reactivation/promotion adapters, jobs and analytics | Disabled | Product Owner governance, M102 source coordination, M074/M075 review, M077 audit, M081 authorization, M082/M085 privacy/retention, M064 freshness, M072/M068 scheduler/workflow evidence, M097 observability, M098 recovery and reconciliation tests. |