# M036-M038 The Architect Transversal Audit

## Audit method

This is a Codex architecture audit guided by The Architect brownfield review method. It is not an independent Product Owner, legal, compliance, security, or production acceptance. The audit reviewed bounded-context ownership, source-of-truth separation, provider activation paths, consent scope, immutable history, workflow and state safety, financial communication, sensitive data boundaries, schema and migration alignment, and future portability.

## Findings corrected

| ID | Module | Finding | Correction | Result |
| --- | --- | --- | --- | --- |
| ARCH-36-01 | M036 | A back-end DTI could be calculated without a housing-payment estimate, which risked presenting an incomplete ratio as a full homebuying DTI. | Back-end DTI now remains null until an estimated housing payment exists. The test uses an explicit educational estimate. | Corrected |
| ARCH-37-01 | M037 | The legacy referral foundation could label a locally constructed referral as ready even though all providers are disabled. | Legacy drafts now use provider-disabled status; no referral handoff is indicated as ready. | Corrected |
| ARCH-37-02 | M037 | A manually constructed provider object with enabled status could affect projection or handoff readiness even though no current provider may be activated. | Marketplace projection and handoff are now unconditionally provider-disabled in this controlled phase. Submission, redirects, and sharing remain fail-closed. | Corrected |
| ARCH-38-01 | M038 | Explicit personalization preferences were not screened with the same sensitive/compensation exclusion as derived preferences. | Both explicit and derived preferences now reject sensitive and compensation feature identifiers. | Corrected |
| ARCH-38-02 | M038 | A policy could allow a sensitive feature with zero weight, weakening governance even if it did not score. | All allowed feature codes are now screened, not only weighted feature keys. | Corrected |
| ARCH-38-03 | M038 | Candidate/context snapshots were not fully domain-validated before a run, allowing an accidental cross-domain run. | Candidate-set and run creation now validate common domains and published source-backed constraint snapshots. | Corrected |
| ARCH-38-04 | M038 | AI explanation claims had source IDs at record level but no per-claim support reference. | Each claim now declares an allowed source ID and the service rejects unsupported or empty claims. | Corrected |
| ARCH-38-05 | M038 | The authored SQL used composite keys for candidate and constraint snapshots while the Drizzle schema used stable single IDs. | The SQL migration now uses stable single primary keys matching the schema contract. | Corrected |

## Boundary confirmation

- M036 owns homebuying readiness, educational analysis, program-source versions, referrals as drafts, and evidence-tracked milestones. It does not own lender decisions, property transactions, closing authority, payments, or external communication.
- M037 extends the existing Marketplace bounded context. It owns third-party listing metadata, consent records, referral journey state, conversion evidence, and commission lifecycle records. It does not own external products, provider decisions, client billing, or provider credentials.
- M038 owns policy-driven ranking of candidates supplied by authoritative source modules. It does not own eligibility, underwriting, provider terms, external decisions, customer choice, or external execution.
- All external provider behavior is provider-disabled. No database migration has been run and no live provider state exists.

## Residual risks

- Future provider activation needs an approved adapter, agreement, consent language, security and privacy review, sandbox evidence, operational owner, kill switch, and a migration that explicitly removes the current database provider-disabled constraint.
- Homebuying program data, financial educational content, and client-facing disclosures require periodic authoritative review before any public or operational activation.
- Recommendation fairness remains a review and governance capability, not legal compliance certification. Thresholds, sample design, and escalation ownership need Product Owner approval.
- RLS tables intentionally default-deny direct access; future service policies must be implemented alongside a gateway/repository authorization layer before any migration is applied.

## Audit conclusion

The three modules are internally coherent as controlled technical foundations. They are not operational, production-ready, provider-enabled, independently audited, or Product Owner accepted.
