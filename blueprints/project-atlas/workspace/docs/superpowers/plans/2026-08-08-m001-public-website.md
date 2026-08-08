# M001 Public Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the complete M001 bilingual public presentation surface in Astro without
implementing the lead, scheduling, payment, authentication, CRM or marketplace behaviors owned by
other modules.

**Architecture:** One static-first Astro application renders a typed repository-backed content model
through shared layouts and components. A route registry creates Spanish-primary and English-equivalent
pages, while pure helpers govern localized paths, SEO metadata and safe CTA destinations. M001 emits
no business state and introduces no client framework.

**Tech Stack:** Astro 7, TypeScript 6, Tailwind CSS 4, Vitest 4, Playwright 1.62, Biome 2, pnpm 11,
Turborepo 2.

## Global Constraints

- Work only on `feature/m001-public-website` in its isolated worktree.
- Use the supplied SG Solutions raster logo without redrawing, recoloring, stretching or adding
  effects; the banner is research only.
- Use Manrope for headings and Inter for body/UI with system fallbacks; no remote font requests.
- Use `#0A2540`, `#0B63CE`, `#00A3E0`, `#2E7D32`, `#B7791F`, `#F7F9FC` through semantic tokens.
- Spanish is `/`; English is `/en/`; every required page has a direct equivalent.
- Primary CTA is evaluation; quote is secondary. Missing destinations render an honest fallback.
- Never invent contact facts, testimonials, credentials, prices, partner relationships or legal
  approval.
- Do not add Sanity, Supabase, Stripe, Google, PostHog, chat or CRM calls.
- Core content and navigation must work without client JavaScript.
- Meet WCAG 2.2 AA, visible focus, reduced motion, 44 px targets and 200% zoom reflow.

---

## File map

- `apps/www/src/domain/public-site.ts`: public content and route types.
- `apps/www/src/content/site-content.ts`: bilingual approved repository content.
- `apps/www/src/lib/routes.ts`: route registry, lookup and alternate-locale helpers.
- `apps/www/src/lib/actions.ts`: allowlisted action resolution and safe fallbacks.
- `apps/www/src/lib/seo.ts`: canonical, alternate and structured-data projections.
- `apps/www/src/layouts/BaseLayout.astro`: document shell, metadata and global landmarks.
- `apps/www/src/components/*.astro`: focused presentational components.
- `apps/www/src/pages/index.astro`, `[...slug].astro`, `404.astro`: public pages.
- `apps/www/src/pages/health.ts`, `robots.txt.ts`, `sitemap.xml.ts`: operational/static endpoints.
- `apps/www/src/styles/global.css`: token layers and accessible responsive styling.
- `apps/www/public/brand/sg-solutions-logo.jpg`: exact approved logo reference.
- `apps/www/vercel.json`: security headers for the public deployment.
- `packages/design-tokens/src/index.ts`: shared primitive/semantic M001 token exports.
- `packages/i18n/src/index.ts`: supported-locale contract.
- `tests/m001/*.test.ts`: domain/content/route/SEO/action contracts.
- `tests/e2e/m001-public.spec.ts`: representative browser acceptance.
- `playwright.www.config.ts`: isolated M001 browser runner.

---

### Task 1: Typed bilingual content and route contract

**Files:**
- Create: `apps/www/src/domain/public-site.ts`
- Create: `apps/www/src/content/site-content.ts`
- Create: `apps/www/src/lib/routes.ts`
- Modify: `packages/i18n/src/index.ts`
- Test: `tests/m001/content-contract.test.ts`
- Test: `tests/m001/route-contract.test.ts`

**Interfaces:**
- Produces: `Locale = "es" | "en"`, `RouteKey`, `PublicPage`, `PublicService`,
  `PUBLIC_PAGES`, `PUBLIC_SERVICES`, `getPageByPath(pathname)`, `getAlternatePath(routeKey, locale)`.
- Guarantees: one page per required route/locale, unique paths, localized metadata and equivalent
  alternate routes.

- [ ] **Step 1: Write failing content and route tests**

```ts
expect(SUPPORTED_LOCALES).toEqual(["es", "en"]);
expect(PUBLIC_PAGES.filter((page) => page.locale === "es")).toHaveLength(19);
expect(PUBLIC_PAGES.filter((page) => page.locale === "en")).toHaveLength(19);
expect(new Set(PUBLIC_PAGES.map((page) => page.path)).size).toBe(PUBLIC_PAGES.length);
expect(getAlternatePath("service-credit", "en")).toBe("/en/services/credit/");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `corepack pnpm test tests/m001/content-contract.test.ts tests/m001/route-contract.test.ts`

Expected: FAIL because the M001 types, content and route helpers do not exist.

- [ ] **Step 3: Implement the minimal typed model and complete bilingual records**

Define `PageKind`, `RouteKey`, `Locale`, `LocalizedText`, `PublicService`, `PublicPage` and content
section types. Author natural Spanish/English copy for all route keys without numeric prices,
testimonials, credentials or contact facts. Keep strings out of components.

- [ ] **Step 4: Run focused and full unit tests**

Run: `corepack pnpm test tests/m001/content-contract.test.ts tests/m001/route-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/www/src/domain apps/www/src/content apps/www/src/lib/routes.ts packages/i18n tests/m001
git commit -m "feat(www): define bilingual M001 content contract"
```

---

### Task 2: Safe action and SEO projections

**Files:**
- Create: `apps/www/src/lib/actions.ts`
- Create: `apps/www/src/lib/seo.ts`
- Test: `tests/m001/action-resolver.test.ts`
- Test: `tests/m001/seo-contract.test.ts`

**Interfaces:**
- Consumes: `Locale`, `RouteKey`, `PublicPage` from Task 1.
- Produces: `resolvePublicAction(action, locale, env) → PublicActionResolution`,
  `createSeoProjection(page, origin) → SeoProjection`, and `createStructuredData(page, origin)`.

- [ ] **Step 1: Write failing behavior tests**

```ts
expect(resolvePublicAction("evaluation", "es", {})).toMatchObject({
  available: false,
  href: "/contacto/?intent=evaluacion",
});
expect(() =>
  resolvePublicAction("evaluation", "en", { evaluationUrl: "javascript:alert(1)" }),
).toThrow(/approved https or internal path/);
expect(createSeoProjection(englishCreditPage, "https://www.sgsllc.com")).toMatchObject({
  canonical: "https://www.sgsllc.com/en/services/credit/",
  alternate: "https://www.sgsllc.com/servicios/credito/",
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `corepack pnpm test tests/m001/action-resolver.test.ts tests/m001/seo-contract.test.ts`

Expected: FAIL because the action and SEO helpers do not exist.

- [ ] **Step 3: Implement strict pure helpers**

Allow only same-origin internal paths or `https:` destinations whose hostname is listed in
`PUBLIC_ACTION_ALLOWED_HOSTS`. Exclude query strings from analytics/SEO projections. Build canonical,
`hreflang`, Open Graph and factual schema records without ratings or offers.

- [ ] **Step 4: Run focused and full tests**

Run: `corepack pnpm test tests/m001/action-resolver.test.ts tests/m001/seo-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/www/src/lib/actions.ts apps/www/src/lib/seo.ts tests/m001
git commit -m "feat(www): enforce safe actions and localized SEO"
```

---

### Task 3: Design tokens and public visual foundation

**Files:**
- Modify: `packages/design-tokens/src/index.ts`
- Create: `apps/www/src/styles/global.css`
- Create: `apps/www/src/components/LogoLockup.astro`
- Copy: `apps/www/public/brand/sg-solutions-logo.jpg`
- Test: `tests/m001/design-contract.test.ts`

**Interfaces:**
- Produces: `designTokens`, `PUBLIC_TOKEN_CSS`, `.container`, `.button`, `.card`, focus, typography,
  layout and reduced-motion rules; `LogoLockup` component.

- [ ] **Step 1: Write failing token and brand-asset tests**

```ts
expect(designTokens.primitive.color.navy).toBe("#0A2540");
expect(designTokens.semantic.action.primary).toBe("#0B63CE");
expect(readFileSync("apps/www/src/styles/global.css", "utf8")).toMatch(
  /prefers-reduced-motion/,
);
expect(existsSync("apps/www/public/brand/sg-solutions-logo.jpg")).toBe(true);
```

- [ ] **Step 2: Run test and verify RED**

Run: `corepack pnpm test tests/m001/design-contract.test.ts`

Expected: FAIL because token values, stylesheet and brand asset are absent.

- [ ] **Step 3: Implement three-layer tokens and global styling**

Export immutable primitive and semantic tokens. Create light-first CSS using Manrope/Inter system
stacks, fluid typography, 44 px controls, visible focus, responsive grids, subtle arcs and a global
reduced-motion override. Copy the exact supplied logo file and render it through an overflow frame
that removes empty white canvas visually without changing pixels.

- [ ] **Step 4: Run tests and typecheck**

Run: `corepack pnpm test tests/m001/design-contract.test.ts && corepack pnpm typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/design-tokens apps/www/src/styles apps/www/src/components/LogoLockup.astro apps/www/public/brand tests/m001/design-contract.test.ts
git commit -m "feat(www): establish M001 brand and design tokens"
```

---

### Task 4: Accessible shell and reusable public components

**Files:**
- Create: `apps/www/src/layouts/BaseLayout.astro`
- Create: `apps/www/src/components/SiteHeader.astro`
- Create: `apps/www/src/components/SiteFooter.astro`
- Create: `apps/www/src/components/LanguageSwitcher.astro`
- Create: `apps/www/src/components/Breadcrumbs.astro`
- Create: `apps/www/src/components/Hero.astro`
- Create: `apps/www/src/components/GrowthPathVisual.astro`
- Create: `apps/www/src/components/ServiceCard.astro`
- Create: `apps/www/src/components/ProcessSteps.astro`
- Create: `apps/www/src/components/ActionLink.astro`
- Create: `apps/www/src/components/Disclosure.astro`
- Create: `apps/www/src/components/FAQList.astro`
- Create: `apps/www/src/components/PolicyLayout.astro`
- Test: `tests/m001/component-contract.test.ts`

**Interfaces:**
- Consumes: Task 1 content, Task 2 action/SEO projections and Task 3 style/token foundation.
- Produces: semantic Astro components with localized props and no embedded business copy.

- [ ] **Step 1: Write failing source-contract tests**

Assert that the base layout contains a skip link and one `<main id="main-content">`, mobile
navigation exposes `aria-expanded`, the language switch consumes direct alternate paths, decorative
SVG is `aria-hidden`, and components import content/types rather than containing English/Spanish
paragraphs.

- [ ] **Step 2: Run test and verify RED**

Run: `corepack pnpm test tests/m001/component-contract.test.ts`

Expected: FAIL because the component files do not exist.

- [ ] **Step 3: Implement semantic server-rendered components**

Use native `<details>` for no-JavaScript mobile navigation, semantic lists for cards/processes,
`aria-current` for the active route and explicit unavailable-action notices. Add only a small inline
enhancement to close mobile navigation on Escape and restore focus.

- [ ] **Step 4: Run tests and typecheck**

Run: `corepack pnpm test tests/m001/component-contract.test.ts && corepack pnpm typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/www/src/layouts apps/www/src/components tests/m001/component-contract.test.ts
git commit -m "feat(www): add accessible public site components"
```

---

### Task 5: Static pages and operational endpoints

**Files:**
- Create: `apps/www/astro.config.mjs`
- Create: `apps/www/src/pages/index.astro`
- Create: `apps/www/src/pages/[...slug].astro`
- Create: `apps/www/src/pages/404.astro`
- Create: `apps/www/src/pages/health.ts`
- Create: `apps/www/src/pages/robots.txt.ts`
- Create: `apps/www/src/pages/sitemap.xml.ts`
- Create: `apps/www/src/components/PageRenderer.astro`
- Test: `tests/m001/page-generation.test.ts`

**Interfaces:**
- Consumes: all Task 1–4 contracts.
- Produces: the complete static route family, localized 404, health response, robots and sitemap.

- [ ] **Step 1: Write failing page-generation tests**

Assert that `getStaticPaths()` returns every non-root page path, every route maps to one content
record, sitemap includes all indexable canonical URLs and excludes health/404, and robots references
the sitemap.

- [ ] **Step 2: Run test and verify RED**

Run: `corepack pnpm test tests/m001/page-generation.test.ts`

Expected: FAIL because page and endpoint modules are absent.

- [ ] **Step 3: Implement pages and renderers**

Render Home, Services, Service, Marketplace, Pricing, FAQ, About, Contact and policy variants through
bounded layouts. Root uses Spanish Home; all other routes come from `getStaticPaths`. Contact and
conversion components render configured links or explicitly state that no information was sent.

- [ ] **Step 4: Run unit tests, typecheck and production build**

Run: `corepack pnpm test tests/m001 && corepack pnpm typecheck && corepack pnpm --filter @atlas/www build`

Expected: PASS and Astro reports all 38 public pages plus operational assets.

- [ ] **Step 5: Commit**

```bash
git add apps/www/astro.config.mjs apps/www/src/pages apps/www/src/components/PageRenderer.astro tests/m001/page-generation.test.ts
git commit -m "feat(www): generate complete bilingual M001 routes"
```

---

### Task 6: Deployment security and browser acceptance

**Files:**
- Create: `apps/www/vercel.json`
- Create: `playwright.www.config.ts`
- Create: `tests/e2e/m001-public.spec.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Test: `tests/m001/deployment-contract.test.ts`

**Interfaces:**
- Produces: public preview test runner, security-header contract and representative desktop/mobile
  browser acceptance.

- [ ] **Step 1: Write failing deployment and E2E tests**

Contract assertions require CSP, Referrer-Policy, Permissions-Policy, `X-Content-Type-Options` and
frame protection. Browser assertions cover Home/service routes, equivalent locale switching,
navigation, one H1, skip link, honest CTA fallback, no horizontal overflow and reduced-motion CSS.

- [ ] **Step 2: Run tests and verify RED**

Run: `corepack pnpm test tests/m001/deployment-contract.test.ts`

Expected: FAIL because the deployment contract and dedicated browser config are absent.

- [ ] **Step 3: Implement configuration and browser checks**

Add `test:e2e:www`, run only Astro preview on port 4321, and configure desktop Chromium plus Pixel 7.
Headers deny framing, sensors and unapproved scripts while allowing same-origin assets.

- [ ] **Step 4: Run deployment contract and browser acceptance**

Run: `corepack pnpm test tests/m001/deployment-contract.test.ts`

Run: `corepack pnpm --filter @atlas/www build && corepack pnpm test:e2e:www`

Expected: PASS in desktop and mobile projects.

- [ ] **Step 5: Commit**

```bash
git add apps/www/vercel.json playwright.www.config.ts tests/e2e/m001-public.spec.ts tests/m001/deployment-contract.test.ts package.json .gitignore
git commit -m "test(www): verify M001 deployment and browser behavior"
```

---

### Task 7: Visual, accessibility, SEO and security quality gate

**Files:**
- Create: `tests/e2e/m001-visual.spec.ts`
- Create: `docs/reviews/M001-UX-ACCESSIBILITY-REVIEW.md`
- Create: `docs/reviews/M001-SECURITY-REVIEW.md`
- Modify: any M001 file only in response to a reproduced failing test or documented finding.

**Interfaces:**
- Produces: viewport screenshots, audit evidence and regression tests for every confirmed defect.

- [ ] **Step 1: Build and capture representative pages**

Run browser checks at 375×812, 768×1024, 1024×768 and 1440×1000 for Spanish Home, English Home,
one service page, Marketplace, Contact and 404. Save artifacts under ignored test-results.

- [ ] **Step 2: Audit keyboard, focus, zoom and reduced motion**

Verify skip link, full keyboard navigation, focus return, 200% zoom, 44 px targets and no horizontal
overflow. Write a failing regression test before correcting every defect.

- [ ] **Step 3: Audit content, SEO and brand**

Verify bilingual parity, no prohibited claims, unique metadata, canonicals, hreflang, sitemap,
structured data, exact logo use and approved palette.

- [ ] **Step 4: Run Cyber Neo read-only against the M001 worktree**

Record the report outside the target repository. For each material finding, reproduce it with a
failing test, correct it separately, re-run focused checks and then re-run Cyber Neo.

- [ ] **Step 5: Run the full quality gate**

Run: `corepack pnpm install --frozen-lockfile`

Run: `corepack pnpm lint && corepack pnpm format:check && corepack pnpm typecheck && corepack pnpm test`

Run: `corepack pnpm --filter @atlas/www build && corepack pnpm test:e2e:www`

Run: `git diff --check`

Expected: every command exits 0 with no material audit finding unresolved.

- [ ] **Step 6: Commit review evidence and fixes**

```bash
git add blueprints/project-atlas/workspace
git commit -m "fix(www): satisfy M001 quality and security gate"
```

---

### Task 8: M001 completion report and current-state synchronization

**Files:**
- Create: `docs/phases/PCR-M001-public-website.md`
- Create: `docs/runbooks/M001-public-website.md`
- Modify: `PROJECT_STATE.md`
- Modify: `PROJECT_MEMORY.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/roadmap/MODULE_CATALOG.md`

**Interfaces:**
- Produces: complete verification evidence, rollback/runbook, known activation limits and module
  transition to `PO Acceptance` (not `Operational` before Product Owner acceptance).

- [ ] **Step 1: Write the PCR from executed evidence**

Record status, objective, implemented functionality, files, data/API impact, UI, security, tests,
performance, accessibility, SEO, risks, limitations, pending Product Owner decisions, rollback and
the exact final commands/results.

- [ ] **Step 2: Synchronize source-of-truth state**

Set M001 to `PO Acceptance`; leave all other modules unchanged. State that no dependent business
behavior was implemented and list activation decisions without presenting them as code defects.

- [ ] **Step 3: Re-run documentary and repository checks**

Run: `corepack pnpm scaffold:validate && corepack pnpm --filter @atlas/www build && corepack pnpm test:e2e:www`

Run: `git diff --check && git status --short`

Expected: all checks pass; only intended M001 completion files remain staged for the final commit.

- [ ] **Step 4: Commit completion evidence**

```bash
git add blueprints/project-atlas/workspace
git commit -m "docs: complete M001 public website handoff"
```

- [ ] **Step 5: Request independent audit and Product Owner acceptance**

The implementer reports evidence but does not mark M001 `Operational`. ChatGPT or another independent
auditor reviews the complete branch diff; the Product Owner decides acceptance, merge and release.

## Plan self-review

- Spec coverage: all 21 PRD sections map to Tasks 1–8; dependent module behavior remains excluded.
- Placeholder scan: every implementation step is concrete and no business content is invented.
- Type consistency: `Locale`, `RouteKey`, `PublicPage`, action and SEO contracts originate in Tasks
  1–2 and are consumed unchanged by Tasks 3–6.
- Risk check: missing contact/legal/price/testimonial/provider facts have safe inactive states and
  remain Product Owner activation decisions.
