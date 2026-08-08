# ADR 004 — Client Authorization Inheritance

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Accepted architecture baseline
- Update rule: supersede only after security review and Product Owner approval

## Context

Requiring a separate manual grant for every ordinary client-visible child resource would be brittle
and operationally expensive. Granting access from email association or client status would be
unsafe.

## Decision

1. Client membership links an authenticated identity to a client record but grants no case access.
2. An explicit, revocable case grant permits access to child resources only when each resource is
   marked client-visible and belongs to that case.
3. Internal notes, internal messages, audit records and staff-only tasks never inherit visibility.
4. Highly Sensitive documents may require an additional explicit resource grant.
5. Any child resource may set `inheritance_blocked` and remains inaccessible without an explicit
   grant.
6. Revoking a case grant invalidates derived access immediately; signed URLs remain bounded by their
   short expiry and are not reusable as authority.
7. Domain services make the authorization decision before I/O. Postgres RLS and Storage policies
   enforce the same model as defense in depth.
8. Grant, revocation, inherited decision and sensitive download events are audited without content.

## Consequences

Normal case collaboration does not require grant sprawl, while internal and Highly Sensitive data
remain fail-closed. Policy tests must cover cross-client isolation, inheritance blocks, revocation,
resource movement and stale sessions.

## Rejected alternatives

- Email-based association: vulnerable to mistaken identity linkage.
- UI-only filtering: not an authorization control.
- Mandatory per-resource grants: excessive operational burden for ordinary client-visible content.
