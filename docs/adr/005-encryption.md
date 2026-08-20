# ADR 005 — Encryption Boundaries and Key Management

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed architecture; KMS provider selection is open
- Update rule: accept or supersede after threat review and key-custody approval

## Decision

Provider-managed TLS and encryption at rest protect all stored data. Selected Highly Sensitive
structured values also use application-level envelope encryption before database persistence:
SSN/ITIN, bank account/routing identifiers, external tax/identity account identifiers and future
fields explicitly classified by threat review. Passwords remain with Supabase Auth; payment-card
data remains with Stripe and is never stored.

Each value uses authenticated encryption with a unique data-encryption key (DEK). A KMS-held
key-encryption key (KEK) wraps DEKs. Ciphertext metadata records algorithm/version and key version,
not plaintext. Encryption occurs inside a narrowly scoped server-side data-protection service after
authorization; decryption occurs only for an authorized purpose and emits a minimized audit event.

## Key ownership and storage

SG Solutions controls access policy and rotation approval. KEKs live in an approved managed KMS,
never source control, Postgres, client code or general environment files. Services receive minimum
temporary decrypt capability. Rotation rewraps DEKs where supported and tracks key versions; it does
not require plaintext bulk export.

[NEEDS PRODUCT OWNER DECISION: select and approve the managed KMS/key-custody provider before any
application-level encrypted field is implemented.]

## Search and indexing

Encrypted plaintext cannot be used in ordinary indexes, full-text search, analytics or logs.
Equality lookup is prohibited by default. If a business-critical exact-match lookup is later
required, use a separately keyed, normalized blind index after an ADR and leakage analysis. Never
index partial SSN or other secrets merely for convenience.

## Backups, redaction and incidents

Backups contain ciphertext and wrapped DEKs but not KEKs; recovery must restore both data and
authorized KMS access. Logs/errors/traces redact protected fields before serialization. A suspected
key exposure triggers access revocation, key rotation/rewrap, audit review, affected-data analysis
and Product Owner/legal escalation.

## Consequences

Application encryption reduces database-compromise exposure but adds availability, rotation,
search and recovery constraints. A column name ending in `_encrypted` is never evidence that these
controls exist; tests must prove plaintext absence and correct boundary behavior.
