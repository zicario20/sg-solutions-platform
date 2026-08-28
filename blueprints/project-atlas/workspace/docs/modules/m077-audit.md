# M077 - Audit

## Status

Controlled foundation implemented. It defines the canonical material-audit event contract, but no durable append-only audit store, ingestion pipeline, search index, export delivery, integrity-chain verification, retention execution, or external event ingestion is active.

## Scope delivered

- Typed audit-event candidate, actor, resource-reference, correction, integrity-check, and export-request contracts.
- Explicit actor types for human users, clients, service accounts, system processes, AI agents, workers, external providers, and unknown actors.
- Drizzle persistence shape for disabled configuration, non-persisted event candidates, correction candidates, integrity checks, and export requests.
- Tests for non-assertion of business truth, sensitive-payload rejection, and append-only correction modeling.

## Safety boundaries

- An application log is not an audit event; an audit event is not a business fact or proof of compliance.
- Candidates carry only minimized references, correlation, causation, action, and outcome metadata.
- Raw credentials, tokens, secret keys, broad PII, full sensitive documents, and private reasoning are rejected.
- Corrections must append a new event when the runtime is approved; originals are never silently mutated.
- Audit access will not imply access to a referenced client, case, document, payment, or other resource.

## Activation prerequisites

- Product Owner-approved durable append-only storage, schema registry, hashing/integrity design, encryption/key management, retention/hold policy, backup/restore evidence, and export authorization model.
- M080/M081 authorization, M082-M085 classification and retention controls, M068-M076 event producers, and M097 operational observability boundaries.

## Not implemented

No audit event is durably appended, externally ingested, searchable, exported, chain-verified, retained, or deleted by this foundation.
