# SG Solutions Platform — agent instructions

- Owner: Product Architect
- Status: Active documentary and delivery contract
- Update rule: synchronize with product definition, roadmap, status model and quality gates

## Read first

1. `PRODUCT_DEFINITION.md`, `PROJECT_CONTEXT.md` and `PROJECT_STATE.md`.
2. `MASTER_PRD.md`, `ROADMAP.md` and `docs/roadmap/MODULE_CATALOG.md`.
3. The approved module PRD and applicable ADRs.
4. `docs/roadmap/STATUS_MODEL.md` and applicable path-scoped rules.

## Product boundary

This is one web platform for SG Solutions with Public `/`, Client `/client` and Admin `/admin` surfaces. It is not licensed SaaS, a real operating system, multi-tenant software, 110 applications or 110 microservices. Astro `apps/www` plus Next `apps/app` is a physical implementation split, not a product split.

## Non-negotiable architecture

1. Default to a modular monolith and one transactional Postgres database.
2. Reuse shared primitives; verticals extend them and never duplicate them.
3. A microservice requires an approved ADR with a demonstrated boundary.
4. Integrations use provider abstractions/adapters.
5. Supabase Auth identifies; domain + RLS + Storage authorize exact resources.
6. Drizzle alone owns schema/migrations; Sanity holds public content only.
7. Stripe is external financial authority; Postgres is operational truth.
8. Payment confirmation and AI output never equal human authorization.

## Authorization to work

- `Registered` does not authorize implementation.
- No product code before an approved module PRD, satisfied dependencies and explicit Build gate.
- Important screens require approved UI/UX handoff before implementation.
- Cyber Neo is an independent, strictly read-only security auditor; it reports but never fixes its findings.
- Skills and agents are subordinate to Product Owner decisions, Master PRD, ADRs and this contract.

Required sequence after future authorization: approved PRD/architecture → UI/UX approval when visual → isolated, test-driven implementation → automated verification → independent code audit → Cyber Neo when sensitive or pre-release → separate correction → retest/re-audit → Product Owner gate.

## Module completion

Every module reaching `Operational` must produce a PCR and update `PROJECT_STATE.md`, append `PROJECT_MEMORY.md`, update `DECISIONS.md` when a decision changed and update `CHANGELOG.md`. Never self-certify or mark completion without fresh evidence.

## Current restriction

Phase 0 documentary roadmap review is the only active work. Implementation is not started and not authorized. The former E1–E3 queue is archived under `../archive/pre-roadmap-2026-08-02/`, is incomplete relative to R1.1–R1.5 and must not be executed. No active task queue exists; only the Product Owner may authorize the Build gate that permits a future queue derived from approved PRDs.
