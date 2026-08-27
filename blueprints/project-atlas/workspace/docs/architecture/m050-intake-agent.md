# M050 Intake Agent Architecture

## Architectural decision

M050 is a structured intake boundary, not a general-purpose form engine or specialist agent. It
uses opaque references for potential sensitive values and preserves exact definition, rule, policy,
answer, completion, readiness, and handoff references.

    M49 prepared reception handoff
      -> M050 public pre-intake session
      -> exact M42 intake binding and M22 form authority
      -> purpose-limited participant answers
      -> deterministic validation and readiness assessment
      -> prepared scoped specialist handoff
      -> M68-owned workflow gate

## Non-negotiable boundaries

- M50 never turns an intake answer into a verified fact.
- Completion is not readiness; readiness is not eligibility, approval, payment confirmation, or service start.
- Public pre-intake cannot request sensitive, highly sensitive, restricted, or prohibited data.
- M50 cannot dispatch handoffs, create authoritative records, issue secure links, call providers, or execute AI.
- M50 does not own forms, documents, consent, signatures, CRM, cases, orders, payments, entitlements, or workflow state.
- Each handoff contains only scoped references and has dispatchPermitted false.
- Published intake versions and submitted snapshots must be immutable in an activated implementation.

## Data design

The prepared tables store references, configuration snapshots, status, version, hashes, and audit
metadata. Raw sensitive answers, document bytes, secrets, signed URLs, provider credentials, and
private reasoning are outside this foundation.

The migration is additive and is not an authorization to execute a production migration.

## Runtime design

createIntakeRuntime has one outcome: a disabled response. This allows callers to detect that the
capability exists in architecture while preventing a false impression that intake submissions or
handoffs are operational.

## Future adapter shape

An authorized runtime may introduce adapters for:

- M22 form rendering and submission.
- M11 secure upload-path requests.
- M58 extraction-event consumption.
- M78 consent references.
- M67 signature status.
- M20 lead candidates.
- M21/M22 order and case candidates.
- M53-M60 specialist packages.
- M68 event publication.

Every adapter must revalidate identity, tenant, participant authority, purpose, version, consent,
entitlement, payment, and workflow stage server-side.
