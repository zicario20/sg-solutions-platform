# ADR 003 — Private Storage and Upload Isolation

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Accepted baseline; upload limits contain documented open decisions
- Update rule: supersede with a numbered ADR after privacy/security review

## Decision

Use private Supabase Storage with versioned policies, opaque normalized keys and short-lived signed
URLs. Separate quarantine from accepted objects. Postgres stores authoritative metadata, checksum,
scan status, version lineage and resource visibility. Sanity never contains private object
references.

Uploads follow `FILE_UPLOAD_SECURITY.md`: authorize, quarantine, content-validate, checksum, scan,
accept/reject, promote and audit. Scan failure never permits promotion. Client and staff downloads
reauthorize every request.

## Rationale

Quarantine prevents untrusted bytes from entering normal workflows, opaque keys prevent metadata
leakage and authorization-at-download protects against stale UI assumptions.

## Consequences

Storage availability does not imply authorization. Database and object recovery require separate
controls. Scanner/provider selection remains a later approved adapter decision.
