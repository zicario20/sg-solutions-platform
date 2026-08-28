# M085 - Retention and Deletion

## Status

Controlled foundation implemented. Policy activation, eligibility calculation, archival, deletion, purge, provider-side deletion, backup reconciliation, and disposition events remain disabled.

## Scope delivered

- Typed contracts for retention classes/policies, reference-only records, hold requests, deletion-eligibility results, archive/deletion/purge requests, and provider-deletion requests.
- Drizzle persistence shape for policy and disposition state without raw record data or hardcoded retention durations.
- Tests proving deletion remains review-required and blocked, duration values cannot be hardcoded, and raw record content is rejected.

## Safety boundaries

- Domain modules own their records; M085 owns only whether a record may be retained, held, archived, become eligible, be deleted, or be tombstoned.
- A deletion request is not immediate erasure. Unknown hold, provider, backup, ownership, class, or eligibility state blocks deletion and requires review.
- Holds never grant access; they only constrain disposition.
- Provider-side deletion is separate from platform deletion and cannot be marked complete until confirmed through an approved runtime.
- M083 owns secret-value destruction, M082 supplies PII constraints, M084 owns provider capability/secure requests, M068 will orchestrate workflows, and M077 preserves minimal audit lineage.

## Activation prerequisites

- Product Owner-approved retention classes, jurisdiction/source inputs, legal/security hold policy, subject-request process, backup lifecycle, tombstone policy, provider offboarding/deletion process, and recovery verification.
- M064/M071/M076 policy sources, M068 workflow, M077 audit, M082 PII, M083 secrets, M084 integrations, and M085-specific independent security/compliance review.

## Not implemented

No record is archived, deleted, purged, tombstoned, restored, sent to a provider for deletion, or reconciled with backups by this foundation.
