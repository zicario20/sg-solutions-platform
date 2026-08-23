# Module PRD — M001 Public Website

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Surface: Public
- Domain: Growth
- Release: R1.2 / Release 1A
- Status: Content remediation implemented; verification and Product Owner acceptance pending
- Last updated: 2026-08-23

## 1. Purpose

Create the professional, bilingual public website through which prospects understand SG Solutions,
identify an appropriate service and move to a truthful next action. The website is the public entry
surface of SG Solutions Platform; it is not a separate product and must not expose internal platform
complexity.

## 2. Business value

- Establish trust before a prospect shares personal information.
- Explain SG Solutions services in plain Spanish and English.
- Give every visitor a clear path to an evaluation, quote or appropriate resource.
- Support acquisition from Google and Meta advertising and organic social content with stable,
  indexable landing routes.
- Establish durable visual, content, accessibility and SEO foundations for future public modules.
- Route prospects toward M006 lead capture, M013 scheduling and M043 payments without duplicating
  those domains.

## 3. Scope

M001 includes:

- the Astro public application shell, global header, footer, language switcher and mobile navigation;
- Spanish-primary and English-equivalent route families;
- Home, Services, Credit, Credit Monitoring, Taxes, Business Formation, EIN, Business Compliance,
  Business Credit, Business Funding, Loan/Financing Preparation, Home Buying Assistance,
  Marketplace, About, Pricing, Contact, general FAQ and
  required policy/disclosure entry pages;
- reusable public components, layout primitives and M001 design tokens;
- typed bilingual content records with a boundary that can later be backed by Sanity;
- service discovery, “how it works,” trust, disclosure and conversion sections;
- primary CTA “Agenda una evaluación” / “Schedule an evaluation” and secondary CTA “Solicita una
  cotización” / “Request a quote”;
- honest integration fallbacks when lead capture or scheduling is not configured;
- semantic metadata, canonical URLs, alternate-language links, Open Graph data, sitemap and robots;
- responsive behavior, keyboard operation, reduced-motion support and WCAG 2.2 AA targets;
- automated unit/contract, build and browser acceptance coverage for M001-owned behavior.

## 4. Explicit out of scope

M001 does not implement:

- lead persistence, consent records, spam scoring or CRM handoff (M006/M020/M017);
- a scheduling engine or Google Calendar synchronization (M013/M024);
- public chat, WhatsApp or voice agents (M003–M005);
- authentication, account creation or the client portal (M007/M008 and related modules);
- quotes, Stripe Checkout, invoices, payment state or refunds (M042–M046);
- a searchable Help Center or Financial Academy CMS (M002/M009/M062–M064);
- marketplace recommendations, referrals or partner integrations (M037–M041);
- publication of unapproved prices, testimonials, credentials, outcomes or legal claims;
- personalized financial, credit, tax, lending, mortgage or legal advice;
- dark mode in v1.

The site may present links or safe unavailable states for dependent capabilities, but it must never
simulate a successful submission, booking, payment, portal login or partner application.

## 5. Actors

- Spanish-speaking prospect.
- English-speaking prospect.
- Returning client looking for the client portal.
- Prospective partner or referral source.
- Search crawler and social-link preview crawler.
- Content editor after the Sanity integration is authorized.
- SG Solutions Owner reviewing public messaging and activation settings.

## 6. User journeys

### Service discovery

1. A visitor lands from search, an advertisement or social content.
2. Within the hero and first service section, the visitor understands what SG Solutions offers.
3. The visitor opens a service page and reviews fit, process, preparation and disclosures.
4. The visitor chooses the configured evaluation action or requests a quote.
5. If the dependent integration is unavailable, the site clearly explains that no information was
   submitted and offers a safe navigation alternative.

### Language continuity

1. A visitor chooses English or Spanish from any page.
2. The switcher opens the equivalent page in the other language when it exists.
3. Navigation, metadata, disclosures and calls to action remain in the selected language.

### Returning client

1. A returning client uses the persistent “Client portal” entry.
2. The link transfers to the configured authenticated application URL.
3. M001 does not collect credentials or imply a session state.

### Partner-product discovery

1. A visitor enters the Marketplace overview.
2. The page distinguishes SG Solutions services from third-party products.
3. It explains that availability and approval depend on the provider and applicant profile.
4. No product recommendation, application or referral event occurs within M001.

## 7. States and transitions

### Page state

`draft content → approved content → published → superseded|withdrawn`

M001 initially ships repository-backed approved copy. A future Sanity adapter may supply the same
content contract without changing page URLs or presentation components.

### Dependent CTA state

`unconfigured → configured → temporarily unavailable → restored`

- Unconfigured actions render an honest guided fallback.
- Configured actions use a validated `https:` URL or an approved internal route.
- Temporarily unavailable actions do not claim success and do not retain sensitive data.

### Navigation state

Desktop navigation is always visible at the approved breakpoint. Mobile navigation transitions
between `closed` and `open`, returns focus to its trigger, closes with Escape and never exceeds two
levels.

## 8. Business rules

- The public website sells and explains services; it does not advertise internal AI or infrastructure
  as the product.
- The dominant CTA is evaluation; quote request is secondary.
- Account creation is never the primary acquisition path.
- Prices use the approved modes `public`, `from`, `quote` or `consultation`. Numeric publication is
  disabled unless the Product Owner approves the exact offer.
- No outcome, approval, score increase, refund, turnaround or savings is guaranteed.
- Testimonials, ratings, partner logos and credentials require verifiable source and approval.
- Partner products are visibly labeled as third-party offers and never as guaranteed approvals.
- No public page asks for SSN, tax documents, credit reports, bank data or government ID.
- Core content works without client JavaScript; scripts may enhance navigation and motion only.
- The logo is not redrawn, recolored, stretched, shadowed or placed on a busy background.
- The supplied banner is visual research only and is not a page template.

## 9. Authorization rules

Published M001 pages are anonymous read-only resources. Anonymous users may not mutate business
state through M001. Editorial mutation belongs to future authenticated Sanity workflows. Preview,
draft and activation controls must not be exposed by public routes. Dependent action URLs are
allowlisted configuration, not user-controlled redirects.

## 10. Data requirements

M001 owns no production client or lead records. Its bounded public data consists of:

- locale and route key;
- page title, summary, sections and disclosure references;
- service identifier, title, short description, audience fit, process, preparation items and price
  display mode;
- navigation and footer records;
- SEO title, description, canonical path, alternate path and share-image reference;
- activation configuration for evaluation, quote and client-portal destinations;
- non-identifying, consent-compatible analytics event name and page context when analytics is later
  enabled.

No analytics payload may include free text, contact details, financial information or URL query data.

## 11. API or service contracts

M001 uses compile-time contracts rather than business APIs:

- `PublicContentRepository.getPage(locale, routeKey) → PublicPage`.
- `PublicContentRepository.listServices(locale) → PublicService[]`.
- `PublicRouteRepository.getAlternate(locale, routeKey) → URLPath`.
- `PublicActionResolver.resolve(action, locale) → available destination | safe fallback`.

The initial adapter is repository-backed. A future `SanityPublicContentAdapter` may implement the
same interface. M001 must not call CRM, Stripe, Supabase or Google Calendar directly.

## 12. Events and background jobs

M001 creates no durable business events and requires no background jobs. Future analytics may emit
minimized events such as `public_page_viewed`, `service_cta_selected` and `language_changed` only
after PostHog consent/telemetry controls are authorized. Lead, appointment and payment events belong
to their owning modules.

## 13. Error states and recovery

- Missing route: localized 404 with navigation to Home and Services.
- Missing translation: build fails for required launch routes; production does not silently mix
  languages.
- Invalid CTA URL: build/config validation fails and the safe unavailable state renders.
- Missing approved logo asset: build fails for production mode.
- Dependent service unavailable: clear message says no action was completed and provides another
  safe path.
- Content adapter unavailable: use the last approved repository content; never expose raw errors.
- JavaScript unavailable: content, links and language routes remain usable.

Recovery instructions live with the M001 runbook and rollback is a redeploy of the last verified
static artifact.

## 14. Security and privacy requirements

- Static-first output; no secret or privileged credential may enter browser bundles.
- Content Security Policy, Referrer Policy, Permissions Policy, `X-Content-Type-Options` and frame
  protections must be defined at the hosting boundary.
- External links use validated destinations and appropriate `rel` values.
- No HTML injection from content records; rich content uses a bounded renderer.
- Query strings are excluded from telemetry and no PII is logged.
- Forms are not activated until M006 supplies server-side validation, consent versioning, rate
  limiting, spam controls and idempotent persistence.
- The public surface never accepts document uploads.
- Third-party scripts are denied by default and require an approved purpose, data map and CSP change.

## 15. UX and accessibility requirements

- The first viewport communicates service category, audience value and primary next action.
- One dominant CTA per section; secondary actions have lower visual weight.
- Semantic landmarks, one H1, ordered headings, skip link and descriptive link text.
- All controls operate by keyboard and have visible focus; touch targets are at least 44×44 CSS px.
- Text contrast meets WCAG 2.2 AA; focus and component boundaries meet at least 3:1.
- Layout works at 320, 375, 768, 1024, 1280 and 1440 CSS px and at 200% zoom.
- Motion is subtle, nonessential and removed under `prefers-reduced-motion`.
- No horizontal scrolling at supported widths.
- Mobile navigation uses a clear disclosure control and remains two levels or fewer.
- Content uses progressive disclosure, short sections and readable line lengths.

## 16. Bilingual requirements

- Spanish is served at `/`; English uses `/en/`; translated routes keep stable semantic equivalents.
- Every launch route, navigation item, CTA, metadata record, error and disclosure has both locales.
- Language switch links directly to the equivalent page rather than a generic home page.
- `lang`, canonical and `hreflang` values are correct on every page; `x-default` points to `/`.
- Copy is written for natural comprehension, not literal word-for-word translation.
- Dates, numbers and future prices use locale-aware formatting.
- No client-facing string is embedded in a component outside the typed content layer.

## 17. Acceptance criteria

- All scoped Spanish and English routes build and return the intended page.
- Home explains SG Solutions and displays the six approved service groups, including the nested
  Credit Monitoring, EIN and Business Compliance offerings, without fabricated claims.
- Each service page describes fit, process, preparation, limitations and next action.
- Each service page contains a typed, bilingual depth contract with audience, common situations,
  overview, SG Solutions actions, service-specific process, preparation rationale, expectations,
  limits, FAQ, related services, related resources, disclosures and research references.
- Header, footer, mobile menu, language switcher, breadcrumbs and CTAs are consistent.
- The exact supplied logo is displayed without distortion on a calm light surface.
- Unconfigured integrations never claim a submission, appointment, payment or account event.
- Every route has unique title/description, canonical URL, alternate-language links and valid heading
  structure.
- Sitemap and robots output only intended public routes.
- Keyboard, focus, reduced-motion, contrast and responsive checks pass.
- Automated tests cover route parity, content completeness, CTA fallbacks and SEO contracts.
- Astro production build, lint, formatting, typecheck, tests and browser acceptance checks pass.
- No secret, PII, absolute local path or unapproved vendor script is present in the artifact.

## 18. Negative acceptance criteria

M001 is not acceptable if it:

- fabricates a testimonial, credential, price, success metric, partner relationship or contact detail;
- implements or mocks a successful form, booking, payment, login or application;
- hardcodes only one language or sends the language switcher to a non-equivalent route;
- stores contact/financial data in local storage, analytics, logs or URL parameters;
- uses the banner as a crowded hero, modifies the logo or relies on color alone for meaning;
- requires JavaScript to read core content or navigate primary routes;
- introduces React/shadcn dependencies into Astro without a documented interaction need;
- changes the approved stack or creates a second public application.

## 19. Dependencies

Ready dependencies: approved product definition, Astro scaffold, design baseline, content guidelines,
SEO baseline, architecture baseline and M001 Build authorization.

Future integrations: M002 Help Center, M006 forms, M013 scheduling, M017 CRM, M020 consent, M037–M041
Marketplace, M043 Stripe, M062 Knowledge Base and Sanity editorial workflow.

## 20. Risks

- Missing verified contact details can weaken conversion; mitigation is configuration-driven display
  and no invented values.
- The supplied raster logo is not a complete production asset family; mitigation is exact web use at
  safe sizes and a separate approved vectorization handoff.
- Broad service claims can cross professional boundaries; mitigation is plain-language scope and
  service-specific disclosures.
- Static fallback content can diverge from future Sanity records; mitigation is one typed contract,
  parity tests and explicit adapter ownership.
- Ad landing pages may fragment the IA; mitigation is reuse of the same templates and canonical
  route strategy.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: provide and approve public phone, email/WhatsApp, business hours
  and any publishable business address before those facts appear.]
- [NEEDS PRODUCT OWNER DECISION: approve or commission exact vector, horizontal, reversed,
  monochrome and favicon logo variants; the supplied raster remains the only approved mark today.]
- [NEEDS PRODUCT OWNER DECISION: approve final legal/privacy/disclosure copy with qualified counsel
  before production publication.]
- [NEEDS PRODUCT OWNER DECISION: approve any testimonial, credential, partner logo or numeric price
  before publication.]
- [NEEDS PRODUCT OWNER DECISION: approve the production evaluation, quote, client portal and social
  destinations before activation.]

These decisions do not block building and verifying the M001 surface. They block activation of the
specific content or integration that depends on them.
