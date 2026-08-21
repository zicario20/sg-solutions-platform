# M006 Public Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the provider-disabled, bilingual M006 public-form engine that accepts minimal public requests into durable, auditable submissions and exposes mock owner integrations without starting a service.

**Architecture:** Astro renders a server-supplied public definition and owns only same-origin transport. A restricted facade invokes a pure TypeScript domain service and Drizzle repository that atomically persist versioned submissions, consent evidence, receipts and outbox entries. All CRM, scheduling, payments, channels, analytics and notifications are typed synthetic ports.

**Tech Stack:** Astro, TypeScript, Zod, Vitest, Drizzle/Postgres, existing workspace CSS/data-attribute UI conventions, Playwright/axe where the current test harness supports it.

## Global Constraints

- Work only under `blueprints/project-atlas/workspace`; preserve Node `24.18.1`, pnpm `11.18.0`, Astro public website and Next.js facade boundaries.
- Provider-disabled: no live Stripe, calendar, CRM, email, SMS, WhatsApp, voice, upload, analytics, CAPTCHA, credentials, deployment, merge or service activation.
- Frontend validation improves UX only; the domain reloads definition/version and validates all input authoritatively.
- Public schemas accept no SSN/ITIN, identity document, credential, account/card, tax document, full credit report, upload or sensitive intake field.
- Published definitions and consent/disclosure evidence are immutable. ES and EN require structural parity.
- No invented business/legal copy: use approved content identifiers and test fixtures; unpublished preview text is explicitly synthetic.
- Keep anonymous values out of URLs, browser storage, telemetry and ordinary logs. Focused tests only; do not run the full workspace suite.

## File map

| Path | Responsibility |
| --- | --- |
| `packages/domain/src/public-forms/{contracts,definition,service,ports,repository}.ts` | Canonical types, closed conditional evaluator, commands/results, owner ports and domain state machine. |
| `packages/validation/src/public-forms.ts` | Zod ingress/definition schemas and normalization helpers. |
| `packages/database/src/{public-forms-repository.ts,schema/public-forms.ts}` | Drizzle persistence and guarded repository implementation. |
| `drizzle/0019_m006_public_forms.sql` | Generated additive schema/RLS migration and journal metadata. |
| `apps/app/src/lib/public-forms/facade.ts` | Least-privilege bridge from Astro ingress to domain service. |
| `apps/www/src/pages/{forms/[formCode].astro,en/forms/[formCode].astro,api/public/forms/*.ts}` | Bilingual public routes, bootstrap and submit endpoints. |
| `apps/www/src/components/forms/*`, `apps/www/src/scripts/public-form.ts`, `apps/www/src/styles/public-form.css` | Accessible progressive renderer, review and mobile-first styling using existing visual tokens. |
| `apps/app/src/app/admin/forms/preview/page.tsx` | Staff-only unpublished, synthetic preview with no mutation capability. |
| `tests/m006/*.test.ts` | Focused contracts, domain, persistence, gateway, UI, security and synthetic integration evidence. |

### Task 1: Canonical definitions, versioning and validation

**Files:** Create `packages/domain/src/public-forms/{contracts,definition,index}.ts`, `packages/validation/src/public-forms.ts`, `tests/m006/public-forms-definition.test.ts`; modify package index exports.

**Interfaces:** Produces `FormDefinitionVersion`, `PublicFieldSensitivity`, `ConditionNode`, `evaluateVisibility(definition, answers)`, `validatePublishedDefinition(definition)`, and `parsePublicSubmissionEnvelope(value)`.

- [ ] **Step 1: Write failing definition/parity tests.**

```ts
expect(() => validatePublishedDefinition(identityField)).toThrow("PUBLIC_FIELD_SENSITIVITY_FORBIDDEN");
expect(() => validatePublishedDefinition(unpairedSpanishVersion)).toThrow("LOCALE_PARITY_REQUIRED");
expect(evaluateVisibility(definition, { selfEmployed: true }).visible).toContain("businessType");
```

- [ ] **Step 2: Run the focused test.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-definition.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement closed schemas.** Define only `all|any|not|equals|present` condition nodes, reject executable/unknown rules, normalize locale/version/form code and reject duplicate/unknown answer keys.
- [ ] **Step 4: Re-run and typecheck.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-definition.test.ts && corepack pnpm --filter @atlas/domain typecheck` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): add versioned public form definitions"`.

### Task 2: Domain service, receipt idempotency and owner ports

**Files:** Create `packages/domain/src/public-forms/{service,ports,repository}.ts`, `tests/m006/public-forms-service.test.ts`; modify domain exports.

**Interfaces:** Consumes Task 1. Produces `PublicFormsService.accept(command)`, `FormReceipt`, `LeadCandidatePort`, `ConsentEvidencePort`, `AppointmentIntentPort`, `PaymentHandoffPort`, `ChannelHandoffPort`, `AnalyticsPort`, and `NotificationPort`.

- [ ] **Step 1: Write failing state tests.**

```ts
await expect(service.accept(command)).resolves.toMatchObject({ status: "accepted" });
await expect(service.accept(command)).resolves.toEqual(firstReceipt);
expect(ports.payment.requests).toHaveLength(0);
expect(ports.leads.requests[0]).toMatchObject({ status: "pending" });
```

- [ ] **Step 2: Run the focused test.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-service.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement atomic semantic flow.** Bind receipt to form/version/locale/nonce/idempotency scope; persist required/optional consent evidence separately; append only minimized port outbox commands after acceptance; return generic receipt for replay, risk review and unavailable owners.
- [ ] **Step 4: Re-run and typecheck.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-service.test.ts && corepack pnpm --filter @atlas/domain typecheck` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): add authoritative submission service"`.

### Task 3: Drizzle schema, encrypted repository and retention/RLS contracts

**Files:** Create `packages/database/src/{public-forms-repository.ts,schema/public-forms.ts}`, `tests/m006/public-forms-{repository,schema}.test.ts`; modify schema/index exports; generate `drizzle/0019_m006_public_forms.sql` and Drizzle metadata.

**Interfaces:** Consumes Tasks 1-2. Produces `PostgresPublicFormsRepository`, `reserveOrReplay`, `commitAcceptedSubmission`, `expireDrafts`, and staff-only read projections.

- [ ] **Step 1: Write failing persistence/security tests.**

```ts
await expect(repository.commitAcceptedSubmission(input)).resolves.toMatchObject({ replayed: false });
await expect(repository.commitAcceptedSubmission(input)).resolves.toMatchObject({ replayed: true });
expect(migration).toContain("FORCE ROW LEVEL SECURITY");
expect(migration).not.toMatch(/anon.*USING \(true\)/s);
```

- [ ] **Step 2: Run focused repository/schema tests.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-repository.test.ts tests/m006/public-forms-schema.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement additive tables.** Persist immutable definition versions, ciphertext/key references, answer metadata, consent evidence, attribution, opaque receipt, nonce/draft expiry and transactional outbox. Generate migration through Drizzle, enforce RLS, and expose no anonymous direct policy.
- [ ] **Step 4: Re-run and typecheck.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-repository.test.ts tests/m006/public-forms-schema.test.ts && corepack pnpm --filter @atlas/database typecheck` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): persist secure public submissions"`.

### Task 4: Same-origin admission gateway and restricted facade

**Files:** Create `apps/app/src/lib/public-forms/facade.ts`, `apps/www/src/pages/api/public/forms/{bootstrap,submit}.ts`, `apps/www/src/lib/public-forms/{admission,runtime}.ts`, `tests/m006/public-forms-gateway.test.ts`.

**Interfaces:** Consumes Tasks 1-3. Produces `issueFormBootstrap(request)`, `submitPublicForm(request)`, and facade method `acceptPublicSubmission(command)`.

- [ ] **Step 1: Write failing transport-abuse tests.**

```ts
await expect(postSubmit({ origin: foreignOrigin })).resolves.toMatchObject({ code: "invalid_request" });
await expect(postSubmit({ csrf: "wrong" })).resolves.toMatchObject({ code: "invalid_request" });
await expect(postSubmit({ honeypot: "filled" })).resolves.toMatchObject({ code: "request_received_for_review" });
expect(facade.received).not.toContainEqual(expect.objectContaining({ price: expect.anything() }));
```

- [ ] **Step 2: Run the focused gateway test.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-gateway.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement admission controls.** Use separate HttpOnly/SameSite nonce scope, CSRF header, exact origin/fetch metadata checks, bounded JSON/content length, duplicate-key rejection, constant-shape generic failures, privacy-preserving rate buckets and honeypot. Permit no mass-assigned status/routing/owner/payment fields.
- [ ] **Step 4: Re-run and typecheck.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-gateway.test.ts && corepack pnpm --filter @atlas/www typecheck` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): add public form admission gateway"`.

### Task 5: Accessible bilingual progressive renderer and ephemeral drafts

**Files:** Create `apps/www/src/pages/forms/[formCode].astro`, `apps/www/src/pages/en/forms/[formCode].astro`, `apps/www/src/components/forms/{PublicFormExperience,FormStep,FormReview}.astro`, `apps/www/src/scripts/public-form.ts`, `apps/www/src/styles/public-form.css`, `tests/m006/public-forms-ui.test.ts`.

**Interfaces:** Consumes public definition projection/Task 4 bootstrap. Produces `data-public-form-root` UI contract and no-storage, page-memory state with optional opaque server draft resume.

- [ ] **Step 1: Write failing UI/a11y tests.**

```ts
expect(markup).toContain('aria-live="polite"');
expect(markup).toContain("<fieldset");
expect(script).not.toMatch(/localStorage|sessionStorage/);
expect(enProjection.fieldCodes).toEqual(esProjection.fieldCodes);
```

- [ ] **Step 2: Run focused UI test.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-ui.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement renderer.** Use visible labels, semantic groups, inline errors plus focused summary, explicit review, back/next controls, mobile-first existing CSS tokens, `textContent` rendering only, focus restoration and reduced-motion behavior. Drafts use only opaque server session references and configured expiry.
- [ ] **Step 4: Re-run focused UI test.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-ui.test.ts` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): render accessible bilingual public forms"`.

### Task 6: Approved form inventory, preview and consent/attribution policy

**Files:** Create `packages/domain/src/public-forms/registry.ts`, `apps/app/src/app/admin/forms/preview/page.tsx`, `tests/m006/public-forms-{registry,preview}.test.ts`; modify i18n/config exports only as necessary.

**Interfaces:** Consumes Tasks 1 and 5. Produces `publicFormRegistry`, `getPublishedProjection(formCode, locale)`, and `renderSyntheticPreview(definition)`.

- [ ] **Step 1: Write failing inventory/privacy tests.**

```ts
expect(publicFormRegistry.codes).toEqual(expect.arrayContaining(["contact", "consultation", "callback"]));
expect(registryProjection).not.toContain("ssn");
expect(consents).toEqual(expect.arrayContaining(["service_contact", "sms_contact", "partner_data_sharing"]));
expect(preview).toContain("synthetic preview");
```

- [ ] **Step 2: Run focused registry/preview tests.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-registry.test.ts tests/m006/public-forms-preview.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement approved codes only.** Register minimal contact/consultation/callback/service-interest forms with external approved-copy IDs, purpose-separated unchecked optional consents and minimized attribution. Preview must require staff policy, render synthetic values and have no publish/mutate endpoint.
- [ ] **Step 4: Re-run and typecheck.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-registry.test.ts tests/m006/public-forms-preview.test.ts && corepack pnpm --filter @atlas/app typecheck` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): add governed public form inventory"`.

### Task 7: Synthetic owner integrations, observability and recovery

**Files:** Create `packages/domain/src/public-forms/{jobs,synthetic-ports}.ts`, `packages/observability/src/public-forms.ts`, `tests/m006/public-forms-{integration,observability}.test.ts`; modify exports.

**Interfaces:** Consumes Tasks 2-4. Produces `dispatchFormOutbox`, `reconcileFormOutbox`, disabled port adapters and `recordPublicFormTelemetry(event)`.

- [ ] **Step 1: Write failing synthetic-flow tests.**

```ts
const result = await dispatchFormOutbox(acceptedReceipt);
expect(result).toMatchObject({ lead: "pending", calendar: "unavailable", payment: "unavailable" });
expect(events).not.toContainEqual(expect.objectContaining({ email: expect.anything() }));
expect(result.serviceStarted).toBeUndefined();
```

- [ ] **Step 2: Run focused integration/observability tests.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-integration.test.ts tests/m006/public-forms-observability.test.ts` Expected: failure before implementation.
- [ ] **Step 3: Implement bounded recovery.** Lease and reconcile outbox commands; apply stable idempotency per port; emit only operation/result/locale/form code/status/duration bucket/correlation ID. Disabled owners return truthful unavailable/manual states and never trigger provider traffic.
- [ ] **Step 4: Re-run and typecheck.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-integration.test.ts tests/m006/public-forms-observability.test.ts && corepack pnpm --filter @atlas/observability typecheck` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "feat(forms): add synthetic form integrations"`.

### Task 8: Security/integration gate and M006 closure documentation

**Files:** Create `tests/m006/public-forms-security.test.ts`, `tests/support/run-m006-integration.mjs`, `docs/phases/M006-PHASE-COMPLETION-REPORT.md`; modify module PRD, `PROJECT_STATE.md`, `PROJECT_MEMORY.md`, `DECISIONS.md` and applicable activation register.

**Interfaces:** Consumes all prior tasks. Produces a provider-disabled synthetic integration harness and evidence package; it introduces no activation path.

- [ ] **Step 1: Write failing end-to-end boundary tests.**

```ts
expect(await submitHiddenRestrictedField()).toMatchObject({ code: "invalid_request" });
expect(await replayConcurrentSubmit()).toHaveProperty("receiptId", original.receiptId);
expect(await submitWithoutMarketingConsent()).toMatchObject({ status: "accepted" });
expect(await syntheticFormFlow()).toMatchObject({ payment: "unavailable", appointment: "unavailable" });
```

- [ ] **Step 2: Run focused security and harness tests.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-security.test.ts && node tests/support/run-m006-integration.mjs` Expected: failure before final wiring.
- [ ] **Step 3: Complete evidence/documentation.** Cover CSRF, XSS-safe rendering, payload/field tampering, consent separation, dedupe, retention, RLS static contract, no PII telemetry, ES/EN parity and synthetic handoffs. Record unvalidated live Postgres/provider conditions honestly.
- [ ] **Step 4: Re-run focused evidence.** Run: `corepack pnpm exec vitest run tests/m006/public-forms-security.test.ts && node tests/support/run-m006-integration.mjs` Expected: exit 0.
- [ ] **Step 5: Commit.** `git commit -m "docs(forms): close provider-disabled M006 evidence"`.

## Self-review coverage

All approved M006 requirements map to Tasks 1-8: reusable forms/versioning and conditional logic (1,6), backend validation/normalization/dedupe (1-4), consent/attribution/privacy/retention (2-3,6,8), anti-abuse/CSRF/XSS/mass assignment (4,8), bilingual accessible UI/drafts (5), CRM/calendar/payment/chat/WhatsApp/voice ports (2,7), administration preview (6), analytics and recovery (7), and focused provider-disabled evidence (8). There are no full-suite requirements, provider calls, sensitive uploads, autonomous service starts or unapproved legal/business copy.
