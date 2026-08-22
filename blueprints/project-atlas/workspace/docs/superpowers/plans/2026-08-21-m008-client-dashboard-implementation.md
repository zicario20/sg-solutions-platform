# M008 Client Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, bilingual and responsive `/client` home that composes authorized owner projections, selects one deterministic next action and never invents provider data.

**Architecture:** `@atlas/dashboard` is a read-only application package with typed ports, minimized DTOs, M007 authorization fences, deterministic priority and explicit partial failure. `apps/app` composes it; `@atlas/ui` and `@atlas/i18n` render without data or command authority.

**Tech Stack:** Existing Node `24.18.1`, pnpm `11.18.0`, TypeScript `6.0.3`, Next.js `16.2.12`, React `19.2.8`, Vitest `4.1.10`, Tailwind `4.3.3` and workspace packages. Do not upgrade dependencies.

## Global Constraints

- Work only in `codex/m008-client-dashboard-rebuild`; never on the default branch.
- Providers, live DB, credentials, external traffic and real client data remain disabled.
- Synthetic records are test-only and cannot be imported by configured runtime code.
- Do not create a second portal, user system, dashboard truth table or raw-owner API.
- Identity, context, grants, entitlements and resources are backend-authoritative through M007.
- Personalized responses are `private, no-store`; critical state bypasses every cache.
- Dashboard CTAs navigate/delegate; owner domains reauthorize and execute commands.
- Public copy is ES/EN in `@atlas/i18n`; code identifiers are English.
- Run only each task's focused tests/typechecks; no full suite or full build.

## File map

```text
packages/dashboard/src/{contracts,ports,authorization,priority,cache,aggregation,index}.ts
apps/app/src/lib/dashboard/{auth-context,owner-ports,configured-runtime,http}.ts
apps/app/src/app/api/client/dashboard/route.ts
apps/app/src/app/api/client/dashboard/context/route.ts
apps/app/src/app/client/{page,loading,error}.tsx
packages/ui/src/dashboard/{ClientPortalShell,DashboardView,DashboardStates,PriorityActionCard,DashboardWidgets}.tsx
packages/i18n/src/dashboard.ts
packages/observability/src/dashboard.ts
tests/m008/*.test.ts
```

No M008 migration is planned: the dashboard owns no canonical business state and its cache adapter is disabled.

---

### Task 1: Safe DTO contracts and closed owner registry

**Files:**
- Create: `packages/dashboard/package.json`
- Create: `packages/dashboard/tsconfig.json`
- Create: `packages/dashboard/src/contracts.ts`
- Create: `packages/dashboard/src/ports.ts`
- Create: `packages/dashboard/src/index.ts`
- Test: `tests/m008/dashboard-contracts.test.ts`

**Interfaces:**
- Produces: `DashboardAuthorizationSnapshot`, `DashboardSection<T>`, `DashboardOwnerPort<T>`, `DashboardDto`, `DashboardRouteKey`, `DASHBOARD_OWNER_CODES`, `DASHBOARD_SECTION_LIMITS`, `parseDashboardFragment`.

- [ ] **Step 1: Write the failing test**

```ts
expect(DASHBOARD_OWNER_CODES).toEqual(["security", "services", "tasks", "documents", "appointments", "payments", "messages", "notifications", "help"]);
expect(DASHBOARD_SECTION_LIMITS).toMatchObject({ services: 4, tasks: 5, documents: 3 });
expect(() => parseDashboardFragment({ owner: "payments", state: "fresh", data: { stripeCustomerId: "cus_x" } })).toThrow();
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-contracts.test.ts`
Expected: FAIL because `@atlas/dashboard` does not exist.

- [ ] **Step 3: Implement contracts**

Define the exact design types, owner-specific allowlisted fields, closed route keys and limits. Unknown fields/owners throw `DashboardContractError`; no permissive index signature is allowed.

- [ ] **Step 4: Verify**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-contracts.test.ts && corepack pnpm --filter @atlas/dashboard typecheck`
Expected: PASS.

**Acceptance:** WHEN a fragment contains an unknown owner, field or unbounded list, THE SYSTEM SHALL reject it before aggregation.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard tests/m008/dashboard-contracts.test.ts pnpm-lock.yaml
git commit -m "feat(dashboard): define M008 safe contracts"
```

### Task 2: M007 authorization snapshot and context switching

**Files:**
- Create: `packages/dashboard/src/authorization.ts`
- Create: `apps/app/src/lib/dashboard/auth-context.ts`
- Test: `tests/m008/dashboard-authorization.test.ts`

**Interfaces:**
- Produces: `createDashboardAuthorizationSnapshot`, `revalidateDashboardAuthorization`, `selectDashboardContext`, `DashboardAuthPort`.

- [ ] **Step 1: Write failing denial/fence tests**

```ts
expect(await createDashboardAuthorizationSnapshot({ sessionHandle: "opaque", requestedContext: "foreign", locale: "es" }, denyingPort)).toEqual({ kind: "denied" });
for (const fence of ["session", "membership", "resourceGrant", "entitlement", "policy"] as const) {
  expect(await revalidateDashboardAuthorization(snapshot, changedFencePort(fence))).toEqual({ kind: "retry_required" });
}
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-authorization.test.ts`
Expected: FAIL for missing functions.

- [ ] **Step 3: Implement server-derived authorization**

Ignore browser roles/user/company IDs. Derive actor and fences from M007. Context selection requires exact origin, M007 CSRF and active relationship; issue only an opaque secure handle after success.

- [ ] **Step 4: Verify**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-authorization.test.ts && corepack pnpm --filter @atlas/dashboard typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS.

**Acceptance:** WHEN any authorization fence changes during aggregation, THE SYSTEM SHALL discard the assembled response.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard/src/authorization.ts apps/app/src/lib/dashboard/auth-context.ts tests/m008/dashboard-authorization.test.ts
git commit -m "feat(dashboard): enforce M007 context fences"
```

### Task 3: Deterministic priority policy

**Files:**
- Create: `packages/dashboard/src/priority.ts`
- Test: `tests/m008/dashboard-priority.test.ts`

**Interfaces:**
- Produces: `selectDashboardPriority`, `PRIORITY_POLICY_VERSION`, `PRIORITY_SOURCE_REGISTRY`.

- [ ] **Step 1: Write failing policy tests**

```ts
expect(selectDashboardPriority(securityPaymentTaskFixture())).toMatchObject({ kind: "action", action: { type: "security_identity" } });
expect(selectDashboardPriority(paymentWithUnavailableSecurity())).toEqual({ kind: "unconfirmed", safeReason: "required_source_unavailable", policyVersion: "m008.v1" });
expect(() => selectDashboardPriority(unknownRouteFixture())).toThrow();
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-priority.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement closed bands and tie-breaks**

Use security, blocking payment, expired document, signature, due task, imminent appointment, missing information and general action. Tie-break by blocking, due time, workflow priority, creation time and opaque ID. Missing higher/equal sources yield `unconfirmed`.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-priority.test.ts && corepack pnpm --filter @atlas/dashboard typecheck`
Expected: PASS.

**Acceptance:** WHEN identical validated input/policy is supplied, THE SYSTEM SHALL select the same action without AI or UI order.

```bash
git add packages/dashboard/src/priority.ts tests/m008/dashboard-priority.test.ts
git commit -m "feat(dashboard): add deterministic priority policy"
```

### Task 4: Bounded aggregation and partial failure

**Files:**
- Create: `packages/dashboard/src/aggregation.ts`
- Create: `apps/app/src/lib/dashboard/owner-ports.ts`
- Test: `tests/m008/dashboard-aggregation.test.ts`

**Interfaces:**
- Produces: `ClientDashboardQueryService.query`, `createUnavailableDashboardOwnerPorts`.

- [ ] **Step 1: Write failing aggregation tests**

```ts
const partial = await serviceWith({ services: freshServices, messages: unavailable }).query(request);
expect(partial.dto?.services.state).toBe("fresh");
expect(partial.dto?.messages.state).toBe("unavailable");
expect(await revokingService.query(request)).toEqual({ kind: "retry_required" });
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-aggregation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement bounded fan-out**

Use the fixed registry, record caps, abortable timeouts and global concurrency budget. Validate snapshot/classification/source version, map errors safely, calculate priority after completeness, then revalidate authorization before returning a body.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-aggregation.test.ts && corepack pnpm --filter @atlas/dashboard typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS.

**Acceptance:** WHEN an optional port fails, THE SYSTEM SHALL preserve healthy sections; WHEN a required source/fence fails, THE SYSTEM SHALL not claim a definitive action.

```bash
git add packages/dashboard/src/aggregation.ts apps/app/src/lib/dashboard/owner-ports.ts tests/m008/dashboard-aggregation.test.ts
git commit -m "feat(dashboard): aggregate bounded owner projections"
```

### Task 5: Cache and telemetry privacy boundaries

**Files:**
- Create: `packages/dashboard/src/cache.ts`
- Create: `packages/observability/src/dashboard.ts`
- Modify: `packages/observability/src/index.ts`
- Test: `tests/m008/dashboard-cache-observability.test.ts`

**Interfaces:**
- Produces: `buildDashboardCacheKey`, `DisabledDashboardCache`, `isDashboardSectionCacheable`, `recordDashboardEvent`.

- [ ] **Step 1: Write failing privacy tests**

```ts
for (const section of ["security", "priority", "payments", "tasks", "documents", "appointments"]) expect(isDashboardSectionCacheable(section)).toBe(false);
expect(buildDashboardCacheKey(snapshotA, "help")).not.toBe(buildDashboardCacheKey(snapshotB, "help"));
expect(recordDashboardEvent("client_dashboard_viewed", { locale: "es", email: "x@example.com", amount: 500 })).toEqual({ event: "client_dashboard_viewed", properties: { locale: "es" } });
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-cache-observability.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement disabled cache and allowlists**

Keys include session family, user, context, locale and all fences. Only approved help/preferences can be cacheable. Default cache always misses. Telemetry keeps only approved codes/buckets.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-cache-observability.test.ts && corepack pnpm --filter @atlas/dashboard typecheck && corepack pnpm --filter @atlas/observability typecheck`
Expected: PASS.

**Acceptance:** WHEN critical/differently fenced data reaches cache or analytics, THE SYSTEM SHALL bypass cache and drop non-allowlisted properties.

```bash
git add packages/dashboard/src/cache.ts packages/observability/src/dashboard.ts packages/observability/src/index.ts tests/m008/dashboard-cache-observability.test.ts
git commit -m "feat(dashboard): protect cache and telemetry boundaries"
```

### Task 6: Fail-closed Next.js runtime and endpoints

**Files:**
- Create: `apps/app/src/lib/dashboard/configured-runtime.ts`
- Create: `apps/app/src/lib/dashboard/http.ts`
- Create: `apps/app/src/app/api/client/dashboard/route.ts`
- Create: `apps/app/src/app/api/client/dashboard/context/route.ts`
- Test: `tests/m008/dashboard-http.test.ts`

**Interfaces:**
- Produces: `loadClientDashboard`, `dashboardGet`, `dashboardContextPost`.

- [ ] **Step 1: Write failing HTTP tests**

```ts
expect((await dashboardGet(requestWithoutSession)).status).toBe(401);
expect((await configuredGet(validRequest)).headers.get("cache-control")).toBe("private, no-store, max-age=0");
expect((await dashboardContextPost(crossOriginRequest)).status).toBe(403);
expect(await configuredOwnerStates()).toMatchObject({ payments: "unavailable", appointments: "unavailable" });
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-http.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement runtime composition**

Read only M007 HttpOnly session/context handles. Configure unavailable ports and prohibit fixture imports. Map outcomes neutrally, validate context body/origin/CSRF and set private no-store headers.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-http.test.ts && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS.

**Acceptance:** WHEN owners/providers are unconfigured, THE SYSTEM SHALL return safe unavailable state and never synthetic business data.

```bash
git add apps/app/src/lib/dashboard apps/app/src/app/api/client/dashboard tests/m008/dashboard-http.test.ts
git commit -m "feat(dashboard): add fail-closed client endpoint"
```

### Task 7: Reusable ES/EN portal shell

**Files:**
- Create: `packages/i18n/src/dashboard.ts`
- Modify: `packages/i18n/src/index.ts`
- Create: `packages/ui/src/dashboard/ClientPortalShell.tsx`
- Create: `packages/ui/src/dashboard/DashboardStates.tsx`
- Create: `packages/ui/src/dashboard/PriorityActionCard.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/app/src/app/globals.css`
- Test: `tests/m008/dashboard-ui.test.ts`

- [ ] **Step 1: Write failing i18n/accessibility test**

```ts
const html = renderToStaticMarkup(<ClientPortalShell locale="es" activeRoute="home"><DashboardStateNotice state="unavailable" /></ClientPortalShell>);
expect(html).toContain("<nav");
expect(html).toContain("aria-current=\"page\"");
expect(html).not.toMatch(/Temporarily unavailable/);
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-ui.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement shell/copy/states**

Use landmarks, skip link, current navigation, 44px controls, visible focus, icon plus text, reduced motion and one-language copy. Include all status/error/empty/support strings in both locales.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-ui.test.ts && corepack pnpm --filter @atlas/ui typecheck && corepack pnpm --filter @atlas/i18n typecheck`
Expected: PASS.

**Acceptance:** WHEN rendered in ES/EN at 320px or keyboard-only, THE SYSTEM SHALL preserve landmarks, visible focus, textual status and 44px targets.

```bash
git add packages/i18n packages/ui apps/app/src/app/globals.css tests/m008/dashboard-ui.test.ts
git commit -m "feat(dashboard): add bilingual client portal shell"
```

### Task 8: Dashboard widgets and `/client` states

**Files:**
- Create: `packages/ui/src/dashboard/DashboardView.tsx`
- Create: `packages/ui/src/dashboard/DashboardWidgets.tsx`
- Create: `apps/app/src/app/client/page.tsx`
- Create: `apps/app/src/app/client/loading.tsx`
- Create: `apps/app/src/app/client/error.tsx`
- Modify: `apps/app/src/app/globals.css`
- Extend: `tests/m008/dashboard-ui.test.ts`

- [ ] **Step 1: Add failing order/state tests**

```ts
const html = renderDashboard(providerDisabledDto);
expect(html.indexOf("data-widget=\"priority\"")).toBeLessThan(html.indexOf("data-widget=\"services\""));
expect(html).not.toMatch(/\$|paid|pagado/i);
expect(renderDashboard(activeServiceDto)).not.toContain("% complete");
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-ui.test.ts`
Expected: FAIL for missing view/widgets/page.

- [ ] **Step 3: Implement bounded widgets**

Render only DTO data and allowlisted route keys. Respect preview limits. Show explicit unavailable/stale state where hiding could imply no obligation. Skeletons contain no realistic PII/amounts; error UI contains no exception detail.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-ui.test.ts && corepack pnpm --filter @atlas/ui typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS.

**Acceptance:** WHEN DTO state is loaded/empty/partial/unavailable, THE SYSTEM SHALL show correctly ordered widgets without internal data, fake percentages or unavailable actions.

```bash
git add packages/ui/src/dashboard apps/app/src/app/client apps/app/src/app/globals.css tests/m008/dashboard-ui.test.ts
git commit -m "feat(dashboard): render M008 client home"
```

### Task 9: Synthetic integration and security regression

**Files:**
- Create: `tests/m008/fixtures.ts`
- Create: `tests/m008/dashboard-security.integration.test.ts`
- Modify only when proven: files created in Tasks 1-8

- [ ] **Step 1: Write the denial matrix**

```ts
for (const request of [foreignUser, foreignContext, revokedOrganization, expiredSession, manipulatedRoute]) {
  const response = await harness.get(request);
  expect([401, 403, 409]).toContain(response.status);
  expect(await response.text()).not.toMatch(/exists|organization|case|payment|document/i);
}
expect(await configuredRuntimeImports()).not.toContain("tests/m008/fixtures");
```

- [ ] **Step 2: Run RED**

Run: `corepack pnpm exec vitest run tests/m008/dashboard-security.integration.test.ts`
Expected: FAIL only for concrete integration/security gaps.

- [ ] **Step 3: Apply minimal M008 remediation**

Fix only session/context/resource fences, DTO filtering, priority completeness, safe errors, cache bypass, route allowlist, origin/CSRF or fixture separation proven by tests.

- [ ] **Step 4: Verify focused M008 slice**

Run: `corepack pnpm exec vitest run tests/m008 && corepack pnpm --filter @atlas/dashboard typecheck && corepack pnpm --filter @atlas/ui typecheck && corepack pnpm --filter @atlas/i18n typecheck && corepack pnpm --filter @atlas/observability typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS.

**Acceptance:** WHEN a request crosses user/context/resource boundaries or manipulates route/cache inputs, THE SYSTEM SHALL fail closed without data, count or existence leakage.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard packages/ui packages/i18n packages/observability apps/app tests/m008
git commit -m "test(dashboard): prove M008 provider-disabled boundaries"
```

### Task 10: Independent audits and closure

**Files:**
- Modify: `docs/modules/m008-client-dashboard.md`
- Modify: `PROJECT_STATE.md`
- Append: `PROJECT_MEMORY.md`
- Modify: `ROADMAP.md`
- Append if needed: `DECISIONS.md`
- Create: `docs/phases/M008-PHASE-COMPLETION-REPORT.md`
- External reports: `D:\SG Solutions\security-reports\M008_ARCHITECTURE_REVIEW.md`, `D:\SG Solutions\security-reports\M008_CYBER_NEO_2026-08-21.md`

- [ ] **Step 1: Obtain independent architecture review**

Review the exact M008 diff against Decision 038, ADR 012 and the PRD. Findings require severity and file/line evidence. Reviewer is read-only and runs no tests/build/network.

- [ ] **Step 2: Remediate material findings with focused TDD**

For each finding add one `tests/m008` regression, make the smallest correction, run that test plus affected typechecks, commit and request exact re-review.

- [ ] **Step 3: Run read-only Cyber Neo and remediate**

Require final `0 Critical / 0 High / 0 Medium` or explicit Product Owner risk acceptance. Cyber Neo cannot edit the repository or reveal secret values.

- [ ] **Step 4: Write PCR and synchronize authorities**

Record task commits, exact focused evidence, audits and every unexecuted gate. Do not claim full suite/build, live PostgreSQL/RLS, providers, real data, cache activation, merge, deploy, release or Operational without fresh evidence.

- [ ] **Step 5: Obtain documentation-only review**

WHEN documentation is compared with code/evidence, THE SYSTEM SHALL have no contradictory completion, provider, deploy or acceptance claim. Run no tests/build/network.

- [ ] **Step 6: Commit closure**

```bash
git add docs/modules/m008-client-dashboard.md docs/phases/M008-PHASE-COMPLETION-REPORT.md PROJECT_STATE.md PROJECT_MEMORY.md ROADMAP.md DECISIONS.md
git commit -m "docs(dashboard): close M008 provider-disabled phase"
```

**Acceptance:** M008 is acceptance-ready only after architecture/Cyber approval, coherent PCR/docs and scoped secret/path gate. Product Owner acceptance, push, merge, deploy and release remain separate.

## Execution order

Execute Tasks 1-10 sequentially. Do not parallelize tasks sharing M008 state, implement M009, enable providers or use real client data. Use a fresh implementation agent per task or one sequential `executing-plans` session, with architecture review after each committed task.
