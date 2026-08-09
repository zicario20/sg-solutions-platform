# Data Classification

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Security architecture baseline
- Update rule: classify every new data element before implementation; stricter module rules prevail

Every record, field, document, event and backup receives the highest applicable classification. A
mixed payload inherits the most restrictive class it contains.

## Public

- **Examples:** approved marketing pages, public service descriptions, published academy content,
  public FAQs, approved prices and disclosures.
- **Allowed storage:** Sanity public datasets/CDN, public web assets and Postgres metadata when useful.
- **Encryption:** TLS in transit; managed encryption at rest where stored.
- **Access:** public read only after editorial approval; authenticated publishing.
- **Logging/analytics/tracing:** page identifiers and coarse events allowed; never include form text
  or data from a higher class.
- **Retention/deletion:** retained while published or historically required; unpublish and purge CDN
  caches through the editorial process.

## Internal

- **Examples:** internal procedures, non-client configuration, feature flags, non-sensitive system
  metrics, draft public content and operational runbooks.
- **Allowed storage:** private repository, Postgres, private Sanity drafts or approved configuration
  stores according to purpose.
- **Encryption:** TLS and managed encryption at rest.
- **Access:** authenticated staff with job need; not client-visible by inheritance.
- **Logging/analytics/tracing:** identifiers and bounded metadata allowed; free text minimized.
- **Retention/deletion:** business need plus documented cleanup; remove obsolete drafts/configuration.

## Confidential

- **Examples:** client contact details, appointment details, service/case metadata, internal notes,
  invoices, consent evidence, partner contracts and operational reports.
- **Allowed storage:** Postgres, private Storage and approved provider systems with contracts;
  prohibited from public Sanity datasets.
- **Encryption:** TLS, managed encryption at rest and application-level encryption when ADR 005 or a
  module threat model requires it.
- **Access:** least-privilege staff role plus resource scope; clients only through active delegated
  access to client-visible resources.
- **Logging/analytics/tracing:** opaque identifiers and result codes only; no notes, addresses,
  amounts tied to identity, message bodies or document content.
- **Retention/deletion:** governed by service, legal and consent rules; deletion is auditable and
  backups expire on their normal protected schedule.

## Highly Sensitive

- **Examples:** SSN/ITIN, tax returns, credit reports, government IDs, bank account/routing data,
  income/debt evidence, authentication secrets, encryption keys and identity-verification artifacts.
- **Allowed storage:** approved private Postgres fields with required application-level encryption,
  private quarantined/promoted Storage, or a purpose-specific provider. Never Sanity, client-side
  persistence, analytics or general-purpose logs.
- **Encryption:** TLS; managed encryption at rest; application-level envelope encryption for the
  structured fields named by ADR 005; keys remain outside the database and application repository.
- **Access:** explicit purpose, least privilege, session assurance and resource scope; highly
  sensitive documents may require an additional explicit grant. Staff reads/downloads are audited.
- **Logging/analytics/tracing:** values and content prohibited. Only opaque resource IDs, operation,
  result, policy version and correlation ID may be emitted after redaction.
- **Retention/deletion:** shortest approved legal/business period, legal-hold support, scheduled
  deletion and verifiable object/metadata cleanup.

## Universal prohibitions

- Never store full payment-card numbers, CVV or magnetic-stripe data.
- Never infer protection from a field suffix such as `_encrypted`.
- Never downgrade a classification to improve analytics, search or developer convenience.
- Never copy Confidential or Highly Sensitive content into tickets, developer/agent chat histories,
  test fixtures, error reports or an unapproved external messaging system.
- A purpose-specific first-party production conversation store may retain `Confidential` content
  only when its approved module PRD defines purpose, consent/identity conditions, least-privilege
  access, provider-sharing limits, retention, legal hold, deletion and audit. This exception does not
  allow `Highly Sensitive` content in public chat and does not authorize production retention before
  its Product Owner/legal decision.

[NEEDS PRODUCT OWNER DECISION: approve service-specific retention periods and legal-hold authority
after Illinois/legal counsel review.]
