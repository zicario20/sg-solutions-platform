# Module PRD — Public Content and Financial Academy

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M002, M061–M064 (Release 1A uses public editorial content only)

## 1. Purpose

Publish trustworthy bilingual service education, Help Center and Financial Academy content that
supports conversion without becoming individualized professional advice.

## 2. Business value

Build organic acquisition and client trust through durable education while giving public chat/search
a governed future knowledge source.

## 3. Scope

Sanity public schemas; English/Spanish pages; service pages; FAQ/Help Center; Academy categories,
guides, checklists, videos, templates and approved downloads; author/reviewer/publish workflow;
version/provenance; SEO metadata/schema/hreflang; search index feed; content expiry/review and CTAs.

## 4. Explicit out of scope

Client/case/tax/credit data in Sanity, individualized advice, guaranteed outcomes, unreviewed AI-
generated publication, authenticated course progress, internal procedure knowledge, RAG over private
records and user-generated community content.

## 5. Actors

Public visitor, prospect, client reading public help, author/editor, Product Owner/content approver,
legal/compliance reviewer where required, Sanity adapter and future public search/chat consumer.

## 6. User journeys

1. Author creates a locale-specific draft with source/effective/review metadata.
2. Reviewer checks accuracy, disclosures, SEO/accessibility and translation parity.
3. Product Owner or delegated approver publishes/schedules content.
4. Visitor finds an article through search/social, learns and follows an approved CTA.
5. Expiry/review job flags outdated programs/rates/rules and removes unsafe content from discovery.
6. Staff supersedes content while preserving version/provenance history.

## 7. States and transitions

`draft → in_review → changes_requested → approved → scheduled|published → stale → unpublished|
superseded → archived`. A locale may remain unpublished if its critical translation is not approved.
Stale time-sensitive content is excluded from recommendations/search until reviewed.

## 8. Business rules

- Sanity contains public editorial content only.
- Every claim about programs, deadlines, rates, eligibility or law records authoritative source,
  jurisdiction, effective/as-of date and next review.
- Content educates and states uncertainty; it does not guarantee credit, loan, tax, funding or home-
  buying results.
- English/Spanish critical content receives equivalent review, not raw machine translation.
- Primary CTA remains evaluation; quote is secondary; conversion never hides disclosures.
- AI may draft/retrieve later, but only an authorized human publishes.

## 9. Authorization rules

Public reads only published content. Authors edit drafts; reviewers approve content within assigned
domain; only Product Owner/delegated publisher publishes. Sanity credentials are server/build scoped.
Public chat/search receives only published, current, locale/jurisdiction-appropriate records.

## 10. Data requirements

Content ID/type/slug; locale and translation group; title/summary/body; category/service/topic;
author/reviewer/approver; state/version; source URL/authority/jurisdiction/effective/review dates;
disclosures; CTA; SEO title/description/canonical/hreflang/schema; media alt text/captions/transcript;
download provenance/hash; publish/unpublish timestamps. No operational client identifiers.

## 11. API or service contracts

- `ContentQueryService.getPublishedBySlug(locale, slug, at)`.
- `ContentQueryService.list/search(filters, locale, jurisdiction)`.
- `EditorialService.submitForReview|approve|publish|unpublish|supersede`.
- `ContentFreshnessService.evaluate(contentId, at) → current|review_due|stale`.
- Webhooks trigger bounded rebuild/index refresh after signature validation.

## 12. Events and background jobs

`content.submitted`, `content.approved`, `content.published`, `content.review_due`, `content.stale`,
`content.unpublished` and `search_index.refresh_requested`. Jobs check review dates, link integrity and
locale parity; they never publish automatically or ingest private content.

## 13. Error states and recovery

Missing translation/source/disclosure, slug collision, invalid schema, stale content, Sanity outage,
failed rebuild/webhook, broken download and search-index lag. Last known published content may remain
available only if still current; stale high-risk content is suppressed and routed for review.

## 14. Security and privacy requirements

Sanity public-only enforcement, role-based editorial access, signed webhooks, sanitized rich content,
safe outbound links/downloads, CSP/media controls, no private identifiers, source provenance and
audit of publish/unpublish. Analytics remains page/event-level and excludes form/portal data.

## 15. UX and accessibility requirements

Readable short sections, strong hierarchy, generous whitespace, accessible heading order, keyboard
navigation, alt text, captions/transcripts, meaningful link text, printable checklists, responsive
tables/calculators when later approved, visible updated/source/disclosure information and clear CTA.

The visual direction follows three-layer tokens, Manrope/Inter, approved palette, light-first,
subtle/reduced motion and WCAG 2.2 AA.

## 16. Bilingual requirements

Locale routes, hreflang and translation groups are explicit. Critical disclosures, CTA intent,
eligibility caveats and accessibility alternatives require approved semantic parity. Missing
translation never silently falls back for high-risk guidance; the UI states availability clearly.

## 17. Acceptance criteria

- Only approved/published/current content is public or available to public AI/search.
- Sanity schemas/queries contain no client/case/tax/credit operational data.
- Time-sensitive claims expose source, jurisdiction, as-of and review date.
- English/Spanish pages emit correct locale/canonical/hreflang relationships.
- Media/downloads include accessibility/provenance metadata.
- Stale high-risk content is removed from recommendation/search and creates a review task.

## 18. Negative acceptance criteria

- No direct AI publication or individualized advice.
- No guaranteed outcomes, fabricated testimonials or unsourced program/rate claims.
- No private Storage object reference or client data in Sanity.
- No SEO keyword density that harms clarity/disclosures/accessibility.
- No critical video-only guidance without transcript/text equivalent.

## 19. Dependencies

Public website/design system, content guidelines, SEO strategy, legal review, Sanity provider,
marketing leads/consent, audit/activity and future knowledge/RAG PRDs.

## 20. Risks

Outdated financial/legal information, translation drift, accidental advice, private-content leakage,
weak provenance and SEO pressure overriding trust. Mitigate with editorial gates, dated sources,
staleness automation, schema boundaries and Product Owner approval.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the Release 1A Academy categories and initial content
  inventory.]
- [NEEDS PRODUCT OWNER DECISION: designate author, domain reviewer, translation reviewer and
  publisher responsibilities while the owner operates alone.]
- [NEEDS PRODUCT OWNER DECISION: approve review intervals by content risk and jurisdiction.]
- [NEEDS PRODUCT OWNER DECISION: decide whether any Academy content is authenticated in Release 1B.]
