# Module PRD — M002 Help Center and Frequently Asked Questions

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Surface: Public
- Domain: Growth / Public Knowledge
- Release: R1.2 / Release 1A
- Status: PO Acceptance — implementation, verification and independent review complete
- Last updated: 2026-08-08

## 1. Purpose

Provide the public and reusable source of approved general information about SG Solutions, its
services and common processes. M002 helps visitors find an answer quickly while making the boundary
between education and individualized professional advice explicit.

## 2. Business value

- Reduce repetitive questions and prepare prospects before an evaluation.
- Increase trust and organic discovery with clear bilingual education.
- Improve conversion by attaching an honest next action to every useful answer.
- Establish governed public content that future search, chat and RAG capabilities can consume.
- Preserve provenance, translation parity and freshness instead of scattering FAQ copy across pages.

## 3. Scope

- Integrated Help Center hub in the existing Astro public website.
- Bilingual categories, FAQ, articles, guides, checklists, glossary and program-information indexes.
- Public content detail pages and related-content navigation.
- Repository-backed approved content implementing a source-neutral content repository contract.
- Static locale-specific search indexes with text search, bounded synonyms, filters and ranking.
- Publication, audience, risk, source, review-date and freshness enforcement.
- SEO metadata, canonical/hreflang, Breadcrumb/Article/FAQ structured data where valid.
- Accessible helpful/not-helpful interface and minimized event contract.
- Sanity-compatible public projection and activation boundary.
- Server-rendered category routes that remain complete without JavaScript.
- Tests, security review, documentation and Phase Completion Report.

## 4. Explicit out of scope

- Individualized legal, tax, credit, lending, mortgage or financial advice.
- Client/case/document/payment data, private procedures or authenticated knowledge in Sanity.
- Live chat, WhatsApp, telephony, portal context or CRM lookup.
- Embeddings, vector search, private RAG, AI answer generation or automatic publication.
- Editorial admin application, live Sanity project provisioning or production credentials.
- Durable analytics/feedback transport before consent-aware observability is authorized.
- User comments, community content, personalized recommendations and unapproved program/rate claims.

## 5. Actors

Public visitor, prospect, client reading public guidance, search crawler, future content author,
domain/compliance reviewer, Product Owner/publisher, repository content adapter, future Sanity
adapter and future public-search/chat consumer.

## 6. User journeys

1. A visitor opens the Help Center, searches or selects a category and reaches a concise answer.
2. A visitor filters FAQ by service, reads the general limitation and follows an evaluation CTA.
3. A visitor opens a guide/checklist, reviews its date and source metadata and navigates to related
   content without losing locale.
4. A bilingual visitor switches language and reaches the paired content or a clear availability
   state; the site never mixes languages silently.
5. A visitor searches with accents, without accents or a supported synonym and receives ranked
   public/current results.
6. A search with no results presents categories and safe human-contact/evaluation options without
   claiming that data was submitted.
7. An editor later publishes through Sanity; the same allowlisted projection supplies the existing
   routes without presentation rewrites.

## 7. States and transitions

Editorial lifecycle: `idea → draft → in_review → changes_requested → approved → scheduled|published
→ review_due → stale → unpublished|superseded → archived`.

Only `published` records are eligible for public projection. A future scheduled item stays private
until its publication instant. Medium/high-risk content becomes non-discoverable when its required
review date expires. Archived, stale, draft and internal records never enter public routes/search.

## 8. Business rules

- M002 answers general “how SG Solutions works” questions, not “what should I do in my case.”
- Every public answer uses plain language, states relevant limits and provides a next step.
- No result, approval, score increase, refund, timing, eligibility, program or savings is guaranteed.
- Payment confirmation does not equal human authorization to begin a sensitive service.
- SG Solutions services and third-party/partner products are labeled distinctly.
- Time-sensitive claims require an authoritative source, jurisdiction, as-of/effective date and next
  review date.
- AI may propose future drafts but may not publish.
- Existing M001 FAQ content is migrated to the M002 source and is not maintained in parallel.
- Public URLs remain stable; compatibility routes canonicalize to the M002 FAQ.

## 9. Authorization rules

Anonymous visitors can read only records with public audience, published state and current
freshness. Preview/draft/editorial credentials are never shipped to the browser. Future authors,
reviewers and publishers act through Sanity roles; only the Product Owner or delegated publisher
may publish. Public consumers receive an allowlisted projection, never the raw document.

## 10. Data requirements

Stable ID, translation-group ID, locale, slug, type, category/subcategory, title, summary, bounded
body blocks, keywords/tags, audience, status, version, risk level, author/reviewer/approver reference,
jurisdiction, source references, effective/review dates, disclosure, CTA, related IDs, reading time,
SEO title/description/canonical, image alt/caption and publish/archive timestamps.

The M002 public record contains no client identifier, email, phone, free-text question, tax/credit
data, document reference, payment record or case relationship.

## 11. API or service contracts

- `ContentQueryService.getPublishedBySlug(locale, collection, slug, at)`.
- `ContentQueryService.listPublished(locale, filters, at)`.
- `ContentQueryService.getRelated(contentId, locale, at)`.
- `ContentFreshnessService.evaluate(record, at) → current|review_due|stale`.
- `PublicSearchIndexBuilder.build(locale, at) → PublicSearchDocument[]`.
- `PublicSearchService.search(index, query, filters) → ranked results`.
- `HelpFeedbackEvent { contentId, locale, helpful }`.
- Future `SanityPublicContentAdapter` returns the same allowlisted public contract.

## 12. Events and background jobs

M002 defines `help_center_viewed`, `help_search_completed`, `help_search_no_results`,
`help_content_viewed`, `help_related_selected`, `help_feedback_selected`, `help_contact_selected` and
`help_evaluation_selected`. Payloads exclude query text and PII. No vendor transport is installed by
M002. Future freshness/rebuild/index jobs are coordinated outside the browser and never publish
automatically.

## 13. Error states and recovery

Missing locale pair, duplicate slug, invalid source URL, absent required disclosure/source, stale
high-risk content and invalid related ID fail validation. Missing public slug returns a localized
404. Search script failure leaves all server-rendered browse paths usable. No-results offers
categories and human/evaluation routes. If a feedback transport is absent, the UI explicitly says
the response was not transmitted. A future Sanity outage is recovered by redeploying the last
verified static artifact.

## 14. Security and privacy requirements

- Sanitize/escape all content and render only allowlisted blocks; no arbitrary HTML.
- Validate outbound URLs and use safe link relationships.
- Accept citations only from an explicit HTTPS source policy. Government roots may allow their
  official subdomains; commercial providers require an approved category and exact host. Reject
  credentials, custom ports, lookalikes, unapproved subdomains and unbounded source lists.
- Classify every source as `government` or `provider`; provider-derived answers carry the localized
  third-party disclosure on detail, FAQ, category/card and search surfaces, remain aligned with FAQ
  structured data and never render under “official sources.”
- Reject malformed/oversized Sanity documents with strict enums, natural-slug syntax, bounded
  strings/arrays/blocks, maximum nesting depth and maximum node count.
- Never expose drafts, internal audiences, tokens, preview parameters or Sanity write credentials.
- Static search indexes include only minimal public projection fields.
- Search query text stays client-side and is excluded from URL-independent telemetry payloads.
- No unapproved third-party script, prompt content, upload or free-text feedback.
- CSP and hosting headers remain at least as strict as M001.
- Build/contract tests prove that operational client-field names cannot enter the public schema.

## 15. UX and accessibility requirements

Prominent labeled search, plain categories, readable cards, breadcrumbs, one H1, ordered headings,
meaningful links, visible dates/sources/disclosures, native keyboard-operable FAQ accordions, status
messages announced with appropriate ARIA semantics and no color-only meaning. Touch targets are at
least 44×44 CSS px. The layout works at 320, 375, 768, 1024, 1280 and 1440 px and 200% zoom without
horizontal overflow. Motion is subtle and removed with reduced-motion preferences.

## 16. Bilingual requirements

Spanish is canonical under `/recursos/`; English is under `/en/resources/`. Every launch record has
a translation-group relationship, language-specific natural copy, route, metadata, CTA and
disclosure. The language switcher targets the paired record. High-risk missing translations remain
unpublished; no critical content silently falls back to another language. Search normalizes accents
and uses a reviewed, bounded locale-specific synonym map.

## 17. Acceptance criteria

- Help Center hub, type collections, search, FAQ and detail routes work in both locales.
- Only public/published/current records reach pages, search indexes or future public consumers.
- Search handles case/diacritic normalization, supported synonyms, filters and no-results recovery.
- Existing FAQ paths remain safe compatibility entries with correct canonical destinations.
- Initial approved public FAQ inventory covers the source specification categories without invented
  prices, policies, contact facts or guarantees.
- Every detail page exposes type/category, review metadata, disclosure/next step and valid SEO data.
- Structured data is emitted only when its visible content and schema requirements are satisfied.
- Feedback controls are keyboard accessible and never pretend persistence when no transport exists.
- M001 routes and quality checks remain green.
- Unit, contract, build and desktop/mobile browser tests pass; Cyber Neo and independent review have
  no unresolved material finding.

## 18. Negative acceptance criteria

- No draft, stale sensitive, internal or private record appears publicly.
- No search index contains operational/private fields or user query text.
- No AI answer, chat success, lead, appointment, feedback persistence or CMS publication is
  simulated.
- No raw machine translation, mixed-language page, duplicate FAQ source or broken canonical pair.
- No unsourced current program/rate/eligibility claim, guarantee or individualized recommendation.
- No arbitrary rich HTML, unvalidated URL, vendor telemetry or client-side secret.

## 19. Dependencies

Verified M001 website/design system, content and SEO guidelines, Product Owner Build gate, public
content PRD, Astro route/content contracts and future Sanity production configuration. Later
consumers include M003, M061–M064 and M092; they are not implementation dependencies for M002.

## 20. Risks

Content drift, accidental advice, stale rules, translation divergence, thin SEO pages, public/private
leakage and fake feedback success. Mitigations are one canonical content source, allowlisted
projection, review metadata, conservative initial content, validation tests, honest unavailable
states and human publication authority.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve production Sanity project/dataset and editorial identities
  before live CMS activation.]
- [NEEDS PRODUCT OWNER DECISION: approve any public phone, email, WhatsApp or business-hours facts
  before they appear in Help Center answers.]
- [NEEDS PRODUCT OWNER DECISION: approve exact refund/cancellation policy and public payment methods
  before publishing definitive policy answers.]
- [NEEDS PRODUCT OWNER DECISION: approve time-sensitive program content and its review interval
  after qualified domain/compliance review.]
- [NEEDS PRODUCT OWNER DECISION: approve consent-aware PostHog feedback/analytics activation.]

These decisions block specific production content/provider activation, not implementation and local
verification of the bounded M002 public module.

## Implementation record

The repository source contains 83 records per locale: 67 FAQ records and 16 resources. The public
projection currently emits 77 per locale: 62 FAQ records and 15 resources. Five time-sensitive FAQ
pairs (`what-is-sba`, `usda-direct`, `usda-guaranteed`, `fha-difference` and
`rural-eligibility`) plus the USDA program-navigation resource pair remain `approved` for internal
review and are absent from routes, search indexes, alternates and the sitemap until the Product
Owner decision above is recorded.

Published detail and category slugs live in an explicit route manifest; editing visible copy cannot
rename a URL implicitly. Ten populated categories and five populated collection types have
server-rendered route families; empty definitions are not linked, generated or indexed. The public
search remains an optional client-side enhancement. Every public detail carries an explicit
evaluation/quote next-action value, and the build registry fails on duplicate routes, invalid
relationships, incomplete bilingual pairs, invalid dates/sources and any required launch record
that is stale or non-public.

The Tradelines category contains eleven neutral FAQ records per locale. Their links point to the
Product Owner-selected Tradeline Supply FAQ/source pages for provenance, but the copy does not claim
an active partnership, adopt provider terms as universal rules or promise reporting, score changes,
funding or approvals. The exact host is permitted only for the Tradelines category; references are
labeled as external-provider sources and carry a no-partnership/no-endorsement/no-guarantee
disclosure everywhere their answer or summary is presented. The minimized search projection exposes
only `provider` or `null`, not source names, URLs or editorial metadata. FAQ structured answers append
the same visible disclosure. All eleven pairs are medium-risk and leave the public projection after
2026-11-08 unless reviewed.
