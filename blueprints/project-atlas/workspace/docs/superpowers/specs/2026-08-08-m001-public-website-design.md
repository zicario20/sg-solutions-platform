# M001 Public Website — UX/UI Design Specification

- Product: SG Solutions Platform / Project Atlas
- Surface: Public Website
- Design owner: Codex using UI/UX Pro Max
- Product owner: SG Solutions Product Owner
- Status: Approved-baseline execution specification
- Date: 2026-08-08

## Design decision

M001 uses the recommended **Financial Clarity** direction: a premium, calm financial-services
experience with generous white space, precise typography and subtle motion. It keeps the visual DNA
of the supplied SG Solutions logo—growth, business, housing and blue professionalism—without
copying the dense advertising composition of the supplied banner.

The visual result should feel like a coherent meeting point between the restraint of Apple, the
product clarity of Stripe and Intuit, the trust of American Express and the guided conversion of a
modern mortgage service. Those references guide quality, not imitation.

## Considered directions

### A. Financial Clarity — selected

White and soft-blue surfaces, navy editorial hierarchy, cobalt actions, restrained cyan light,
green progress cues and rare gold emphasis. The logo appears intact on white. Abstract arcs,
ascending bars and architectural linework echo its meaning. This direction offers the strongest
balance of brand recognition, trust, accessibility and conversion.

### B. Corporate Trust

Mostly navy, gray and white with minimal illustration and compact enterprise layouts. It is highly
credible but too conservative for social and advertising traffic and underuses the growth and home
signals in the current logo.

### C. Dynamic Growth

Brighter gradients, larger 3D financial imagery and more visible motion. It resembles the supplied
banner most closely, but it increases cognitive load and risks looking like generic credit
advertising. It is rejected for the primary site and may inform limited campaign art later.

## Brand translation

### Logo

- Use the supplied stacked full-color logo exactly as provided.
- Present it only on white or the light surface token.
- Do not stretch, recolor, redraw, add shadows or crop any visible mark.
- Because the asset contains white canvas, a fixed overflow frame may remove empty canvas visually
  while preserving the original pixels and aspect ratio.
- Header target: approximately 156–184 px visual width; footer target: 132–156 px.
- Until the Product Owner approves a derivative mark, use a simple text fallback for favicon and
  very small contexts; do not invent a new icon.

### Color roles

| Role | Token | Value | Use |
|---|---|---:|---|
| Brand ink | `brand.navy` | `#0A2540` | headings, footer, high-trust surfaces |
| Primary action | `brand.cobalt` | `#0B63CE` | primary CTA, links, focus support |
| Light energy | `brand.cyan` | `#00A3E0` | restrained gradient/illustration accent |
| Progress | `brand.green` | `#2E7D32` | positive progress and growth cues |
| Premium accent | `brand.gold` | `#B7791F` | small eyebrow/rule accents only |
| Page surface | `surface.canvas` | `#FFFFFF` | page background |
| Soft surface | `surface.subtle` | `#F7F9FC` | alternate sections and cards |
| Body text | `text.body` | `#334155` | paragraphs |
| Border | `border.subtle` | `#D9E2EC` | dividers and cards |

Gold and green never replace semantic status colors without text/icon reinforcement. White text is
used only on combinations that pass WCAG AA.

### Typography

- Manrope: display headings, 600–700.
- Inter: body, navigation, controls and labels, 400–700.
- Fluid H1: 40 px at small viewports to 64 px at large viewports, line-height 1.05–1.12.
- Body: 16–18 px, line-height 1.6, maximum 68 characters.
- Eyebrows: 12–14 px, 700, modest letter spacing; avoid long all-caps copy.

Fonts use local or privacy-preserving hosted assets in production. System fallbacks prevent layout
failure.

### Shape, depth and motion

- Cards: 16–24 px radius, 1 px border, soft short shadow only on raised interactive cards.
- Buttons: 12 px radius, minimum 44 px height, clear hover/active/focus states.
- Decorative geometry: one sweeping arc, ascending bars and simplified building/home outlines.
- Motion: 160–280 ms for UI states; 500–700 ms for optional section reveal; no parallax or perpetual
  animation.
- Reduced-motion mode removes reveal transforms and decorative movement.

## Information architecture

### Spanish-primary routes

- `/` — Inicio
- `/servicios/`
- `/servicios/credito/`
- `/servicios/taxes/`
- `/servicios/formacion-de-negocios/`
- `/servicios/financiamiento-empresarial/`
- `/servicios/comprar-casa/`
- `/marketplace/`
- `/precios/`
- `/preguntas-frecuentes/`
- `/nosotros/`
- `/contacto/`
- `/privacidad/`, `/terminos/`, `/accesibilidad/`, `/divulgaciones/`

### English routes

Every route has an equivalent under `/en/`, including `/en/services/credit/`,
`/en/services/taxes/`, `/en/services/business-formation/`, `/en/services/business-funding/`,
`/en/services/home-buying/`, `/en/marketplace/`, `/en/pricing/`, `/en/faq/`, `/en/about/`,
`/en/contact/` and equivalent policy routes.

Desktop navigation groups service pages under Services and keeps top-level choices to Home,
Services, Resources, About, Contact, language and Client portal. The evaluation CTA is visually
dominant. Mobile navigation uses one disclosure panel and no more than two hierarchy levels.

## Page compositions

### Home

1. Utility strip: bilingual assistance and client-portal entry.
2. Header: logo, navigation, locale switch and primary CTA.
3. Hero: value proposition, concise support copy, primary and secondary CTA, visual “growth path.”
4. Trust rail: bilingual, clear process, human follow-up, privacy-first.
5. Service navigator: six focused cards with audience result and link.
6. Process: Tell us what you need → Evaluation → Clear next steps → Follow-up.
7. Home Buying spotlight: a high-intent but non-guaranteed guided path.
8. Education/FAQ preview: credible answers, no individualized advice.
9. Final conversion band with disclosure.
10. Footer with services, company, policies and language.

### Services index

Intro plus comparison-oriented service cards. Group own services separately from Marketplace
products. Each card says who it may fit, the first step and whether the next action is evaluation or
quote.

### Service detail template

Breadcrumb; category eyebrow; problem/outcome hero; fit/not-fit guidance; what SG Solutions helps
organize; four-step process; preparation checklist; limitations/disclosure; related resources; CTA.
No service page promises approval or results.

### Marketplace

Explains categories and provider relationships, distinguishes education from recommendation and
shows a non-active product discovery preview. No provider logo, rate, commission or product appears
without approval.

### Pricing

Explains the four approved price modes. Until a Product Owner activates a numeric offer, service
cards show “Evaluation,” “Quote” or “Consultation,” never invented amounts.

### Contact and FAQ

Contact explains what information is safe to share and renders only configured destinations. FAQ
answers general process questions and directs individualized questions to evaluation. Search,
submission persistence and help-center workflows remain owned by later modules.

### Policy entry pages

Use a readable editorial layout with last-reviewed status. Content that requires counsel remains
explicitly not activated for production; no agent-authored copy is presented as legal approval.

## Component inventory

- `SiteHeader`, `DesktopNavigation`, `MobileNavigation`, `LanguageSwitcher`.
- `LogoLockup`, `SiteFooter`, `Breadcrumbs`.
- `Hero`, `GrowthPathVisual`, `TrustRail`, `SectionHeading`.
- `ServiceCard`, `ServiceGrid`, `ProcessSteps`, `PreparationChecklist`.
- `PrimaryAction`, `SecondaryAction`, `ActionUnavailableNotice`.
- `Disclosure`, `FAQList`, `ResourcePreview`, `PricingModeCard`.
- `PolicyLayout`, `EmptyIntegrationState`, localized `NotFound`.
- `SeoHead`/base layout metadata contract.

Astro components remain server-rendered. Small framework-free scripts may power the menu; React is
not introduced for static presentation.

## Responsive behavior

- 320–639 px: single column, 20 px page gutters, 44 px controls, stacked CTA, disclosure navigation.
- 640–1023 px: two-column service cards and selected split sections.
- 1024–1279 px: desktop header, split hero, three-column service grid.
- 1280 px+: content max width 1200 px; decorative shapes may extend within the viewport but never
  create horizontal overflow.
- At 200% zoom the layout reflows, navigation remains accessible and no action is clipped.

## Content and conversion rules

- Primary message: SG Solutions helps individuals and small businesses turn complex financial and
  business next steps into a clearer, organized plan.
- Supporting messages: bilingual guidance, clear process, human follow-up and privacy-aware handling.
- CTA hierarchy is consistent; no section contains competing primary actions.
- No fabricated social proof. Trust is built through process clarity, scope, disclosures and useful
  information until verified evidence is approved.
- Spanish and English are authored as natural equivalents and live in typed records, not component
  literals.

## Accessibility handoff

- Semantic landmarks, skip link, one H1 and ordered headings.
- Visible `:focus-visible` state with a minimum 3:1 contrast boundary.
- Mobile disclosure button exposes state through `aria-expanded` and `aria-controls` and closes on
  Escape.
- Decorative SVG is hidden from assistive technology; meaningful images have localized alt text.
- Link purpose is understandable out of context.
- Motion honors `prefers-reduced-motion`; forced-colors remains usable.
- Verification includes keyboard-only use, 200% zoom, automated axe checks and contrast tests.

## SEO and performance handoff

- Static Astro pages with minimal JavaScript and shared assets.
- Unique localized title/description and canonical/alternate links per route.
- `Organization`, `WebSite`, `Service` and `BreadcrumbList` structured data only when fields are
  factual and applicable; no fake review/rating schema.
- Responsive images have explicit dimensions; the logo is decoded asynchronously and never used as
  a layout-shifting hero background.
- Performance target: Lighthouse ≥95 for performance, accessibility, best practices and SEO on the
  representative Home and Service page, subject to the documented test environment.

## Security and integration handoff

- No client secret or privileged API in `apps/www`.
- All external action URLs are configuration-validated and use an allowlist.
- No public form posts until M006 is authorized.
- No third-party analytics, chat or embeds in M001.
- CSP and security headers are represented in deployment configuration and verified where the local
  preview supports them.

## Validation matrix

| Area | Evidence |
|---|---|
| Content | Required route/locale parity and no prohibited claims |
| Brand | Exact logo, approved palette/fonts and no banner-template reuse |
| Functional | Navigation, language equivalents, CTA resolution and honest fallbacks |
| Accessibility | axe, keyboard, focus, motion, contrast, zoom and heading order |
| Responsive | screenshots at 375, 768, 1024 and 1440 px |
| SEO | metadata, canonicals, hreflang, schema, sitemap and robots tests |
| Performance | production build size and Lighthouse representative pages |
| Security | no secrets/PII, URL allowlist, headers and Cyber Neo read-only audit |

## Self-review

The specification preserves M001 as a public presentation surface, not a substitute for lead,
scheduling, payments, authentication or CRM modules. It uses the approved logo and palette while
rejecting the banner’s density. It provides a stable bilingual route and content model that can
evolve to Sanity without rewriting the public component system. Open business facts remain explicit
activation dependencies and are not invented.
