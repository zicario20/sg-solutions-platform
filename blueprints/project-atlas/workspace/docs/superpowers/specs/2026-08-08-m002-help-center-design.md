# M002 Help Center — Design Specification

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Approved for implementation by the Product Owner instruction to complete M002
- Date: 2026-08-08
- Base: verified M001 Public Website commit `850cf16`

## Outcome

M002 turns the small M001 FAQ page into a professional, bilingual Help Center that belongs to the
same SG Solutions public website. Visitors can browse by category or content type, search approved
content, understand the limit between general education and individualized advice, and move to a
clear next action. The implementation remains static-first and preserves the M001 visual language,
performance model and no-JavaScript reading experience.

## Approaches considered

### 1. Static-first governed content with a Sanity-compatible boundary — selected

Repository-backed approved content generates public pages and locale-specific search indexes at
build time. A typed repository contract and a bounded Sanity adapter projection allow the source to
change later without rewriting routes or components. Search and filters use progressive enhancement
and never send query text to analytics.

This approach is testable without external credentials, preserves M001 reliability and implements
the public M002 responsibility without pulling later private knowledge or AI modules forward.

### 2. Live Sanity dependency from the first M002 build — rejected for this slice

This would make every local and deployment build depend on an unprovisioned Sanity project,
dataset, roles and credentials. The content contract remains ready for Sanity, but activation waits
for approved production configuration and editorial identities.

### 3. Postgres/RAG-backed knowledge application — rejected

This would conflate M002 with M061–M064, introduce operational data and background processing before
their gates, and weaken the approved rule that Sanity contains public editorial content only.

## Information architecture

Canonical Spanish routes live under `/recursos/`; English routes live under `/en/resources/`.

- Hub: `/recursos/` and `/en/resources/`
- FAQ: `/recursos/preguntas-frecuentes/` and `/en/resources/faq/`
- Guides: `/recursos/guias/` and `/en/resources/guides/`
- Articles: `/recursos/articulos/` and `/en/resources/articles/`
- Checklists: `/recursos/listas/` and `/en/resources/checklists/`
- Glossary: `/recursos/glosario/` and `/en/resources/glossary/`
- Programs (reserved until public content exists): `/recursos/programas/` and
  `/en/resources/programs/`
- Search: `/recursos/buscar/` and `/en/resources/search/`
- Categories: `/recursos/categorias/{categoria}/` and
  `/en/resources/categories/{category}/`
- Detail pages remain nested under the localized content-type collection.

Published category and detail segments are stored in an explicit route manifest. Visible editorial
copy may change without silently renaming public URLs. Empty categories or collection types are not
linked, generated or indexed until they contain approved public content.

The existing `/preguntas-frecuentes/` and `/en/faq/` URLs remain compatibility aliases that point to
the new canonical FAQ pages. Existing approved FAQ copy is migrated into the knowledge records; it
is not duplicated as an independent source.

## Content model and publication boundary

Every record has a stable ID, translation group, locale, type, category, title, summary, body,
keywords, audience, status, version, risk level, review metadata, optional sources/disclosure and SEO
metadata. Public projections accept only records that are:

- `published`;
- addressed to the `public` audience;
- current at the build or query time;
- not blocked by a stale medium/high-risk review date;
- valid for the requested locale.

The initial adapter is repository-backed approved content. `ContentQueryService` is source-neutral.
The Sanity projection is allowlisted and excludes client, case, tax-return, credit-report, document,
payment and internal-procedure fields.

Time-sensitive program records remain in the editorial inventory but do not enter public routes,
search, language alternates or the sitemap until Product Owner/domain approval. Repository and
Sanity content use the same provenance, approved-source, date, risk and freshness gate.

Commercial-provider references are category-scoped and distinct from government sources. Tradeline
Supply is permitted only as an exact-host `provider` source for Tradelines records; the UI includes
a no-partnership/no-endorsement/no-guarantee disclosure anywhere provider-derived answer text is
shown, FAQ JSON-LD matches that visible disclosure, and expired provider-dependent records fail
closed from public projection.

## Search and discovery

Astro emits one minimized JSON search index per locale containing only public projection fields.
Its tenth field is a bounded `sourceKind` value (`provider` or `null`) used solely to render the
required external-provider disclosure; names, source URLs and editorial provenance stay out of the
browser index.
The browser uses a small first-party script to normalize case and diacritics, expand a bounded
bilingual synonym map, rank title/category/keyword/body matches and filter by category or type.
Core category and content navigation works without JavaScript. A no-results state offers categories,
contact, evaluation and the future chat entry without claiming that a lead or booking was created.

Search query text remains in the browser. Analytics may receive only a boolean result state, locale,
category/type filter and result-count bucket after the approved consent/telemetry layer exists.

## Experience design

M002 extends the “Financial Clarity” direction from M001:

- calm navy/cobalt/cyan surfaces with restrained green/gold status accents;
- generous whitespace, Manrope headings and Inter reading text;
- a prominent search region that does not overpower orientation and disclosures;
- category cards with plain-language descriptions and counts;
- compact content cards exposing type, estimated reading time and last review date;
- article pages with a readable measure, breadcrumb, contents navigation when useful, sources,
  review metadata, related content and a clear next step;
- accessible native FAQ accordions and glossary anchors;
- responsive layouts at 320–1440 CSS px, 200% zoom and reduced motion.

The experience does not use a dense “knowledge base dashboard,” does not mimic a chatbot and does
not expose editorial or infrastructure complexity to visitors.

## Feedback and analytics boundary

Helpful/not-helpful controls are progressively enhanced. They emit a minimized first-party event
contract containing content ID, locale and boolean helpful state only. The UI never asks for free
text in this slice. If the approved consent-aware analytics sink is absent, the control reports that
feedback transmission is unavailable rather than pretending it was stored.

No query text, URL query string, contact data, document data or individualized question enters
analytics. M002 defines events but does not install an unapproved vendor script.

## Integration boundaries

- M003 public chat may retrieve only the public/current projection in a future gate.
- M007–M015 client-portal context and private knowledge remain out of M002.
- M047–M060 AI agents may not answer from drafts or stale/private records.
- M061–M064 own broader knowledge administration, RAG, embeddings, source review and private
  retrieval.
- M092 and the observability layer own durable analytics transport.

M002 supplies stable content/search/feedback contracts for those modules without implementing or
simulating their behavior.

## Error handling

- Missing translation: no mixed-language fallback; show the localized collection with an explicit
  availability message.
- Missing or unpublished slug: localized 404.
- Stale medium/high-risk content: remove it from public indexes and expose a build validation error
  for required launch content.
- Search script failure: browse links and server-rendered content remain usable.
- Sanity unavailable after activation: use the last verified static artifact; never expose drafts.
- Analytics unavailable: retain no feedback and state that it was not transmitted.

## Verification design

Unit/contract tests prove publication filtering, freshness, translation pairing, route parity,
search normalization/ranking, synonym behavior, source/disclosure requirements, Sanity allowlisting,
metadata and analytics minimization. Browser tests cover Spanish/English discovery, keyboard search,
filters, FAQ accordions, detail pages, no-results recovery, compatibility routes, mobile layouts,
reduced motion and automated accessibility scans. The complete M001 suite remains green.

## Scope boundary

M002 is complete when the public Help Center behavior and its governed content contracts are
implemented and verified. Live Sanity provisioning, private procedures, RAG, chat answers, portal
context, durable feedback storage and production analytics activation require their own approved
providers or modules and are not represented as working M002 behavior.
