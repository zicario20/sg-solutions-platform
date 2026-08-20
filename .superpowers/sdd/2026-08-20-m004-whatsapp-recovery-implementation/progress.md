# SDD ledger — plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md

Base: 05d85283632bf05d74c866b5f1a4ceb9eb5d3f70
Worktree: D:\SG Solutions\SG Solutions\.worktrees\m004-whatsapp-recovery
Execution: sequential only; one implementer and one independent reviewer per task.
Model ruling: GPT-5.3-Codex-Spark unavailable by usage limit; use GPT-5.6-Luna for mechanical tasks, Terra for integration/reviews, Sol for final architecture review.

## Preflight task consistency

| Task | Produces / consumes | Ruling |
|---|---|---|
| 1 | Runtime config consumed by Tasks 5, 6, 9 and 11 | Consistent; providerTrafficAllowed remains literal false. |
| 2 | Canonical contracts consumed by Tasks 3-10 | Consistent; M003 compatibility is load-bearing. |
| 3 | Validation and policy consumed by Tasks 4, 6 and 9 | Consistent; synthetic copy never becomes production policy. |
| 4 | Repository contract consumed by Tasks 8 and 9 | Consistent; memory conformance is the reference. |
| 5 | Meta adapter consumed by Tasks 6, 9 and 11 | Consistent; adapter remains incapable of live traffic. |
| 6 | Webhook ingress consumes Tasks 1, 3-5 | Consistent; ACK follows durable canonical persistence. |
| 7 | Preparatory schema consumed by Task 8 | Consistent; migration history must remain forward-only. |
| 8 | Postgres repository consumes Tasks 2, 4 and 7 | Consistent; RLS and M003 compatibility are mandatory. |
| 9 | Jobs consume Tasks 3-5 and 8 | Consistent; no owning-domain receipt means unavailable. |
| 10 | Observability consumes canonical contracts | Consistent; exact schemas exclude arbitrary attributes. |
| 11 | Integration consumes Tasks 1-10 | Consistent; zero external egress is a negative gate. |
| 12 | Closure consumes executed evidence from all tasks | Consistent; deferred Postgres gates prevent a false complete claim. |

## Shared-file/interface scan

| Tasks | Shared boundary | Ruling |
|---|---|---|
| 1/5/6/11 | WhatsApp runtime configuration | Task 1 contract is authoritative; later tasks may inject fakes only in tests. |
| 2/3/4/8/9/10 | communications domain exports | Additive evolution only; provider names stay outside domain. |
| 2/8 | M003 compatibility | Preserve M003 observable behavior and canonicalize storage only after parity. |
| 3/4/9 | consent, opt-out and binding policy | Receipt-gated authority and opt-out fence remain atomic. |
| 4/8 | repository conformance | Both implementations must pass the same suite. |
| 5/6/9 | provider envelope and dispatch | Infrastructure translates exhaustively; domain sees canonical types. |
| 7/8 | Drizzle migration chain | No applied migration is rewritten; use a forward migration if attestation fails. |
| 9/11 | provider-disabled integration | No live success, no network egress, no protected-domain access. |
| 10/12 | telemetry and security evidence | Sanitized summaries only; Cyber Neo remains read-only. |

Ruling: Recovery may transport candidate code only after task-scoped review; historical tests are not fresh evidence. Cost if wrong: rework the affected task from the clean M003 base.
Task 1: fix round 1/5 (1 addressed, 1 open; commits f56a715..07413d8)
Task 1: fix round 2/5 (1 addressed, 0 open; commits 07413d8..8e907a8)
Task 1: complete (commits 05d8528..8e907a8, review clean)
Task 1 limitation: Turbo spawn UNKNOWN and Node 24.19.0 vs 24.18.1; sequential 11/11 workspace typechecks are the accepted local evidence.


Task 2 Ruling: The plan listed linked_prospect/linked_client, but the approved spec prohibits client facts in the communications domain. Replace both with neutral linked_contact; CRM/client classification remains owned elsewhere. Cost if wrong: channel policy loses a local prospect/client distinction and must consume an owning-domain receipt/projection instead.


Task 2: fix round 1/5 (2 addressed, 0 open; commits 4a2c824..70179d3)
Task 2: complete (commits 8e907a8..70179d3, review clean)


Task 3 Ruling: No public/runtime API may activate caller-supplied opt-out lexicon or bilingual copy during the provider-disabled gate. Synthetic algorithms remain outside the package public runtime surface until an owning-authority receipt design is separately approved. Cost if wrong: future activation needs an additive API change instead of pre-wired injection.


Task 3: fix round 1/5 (4 addressed, 0 open; commits 8ec3341..69a97d1)
Task 3: complete (commits 70179d3..69a97d1, review clean)


Task 4 minor (deferred): NUL-delimited composite map keys should use tuple-safe encoding or input rejection; final review must triage.
Task 4 minor (deferred): tests use s any, reducing compile-time contract coverage; final review must triage.


Task 4: fix round 1/5 (7 addressed, 2 open, 2 new; commits 5aac723..1522d10)
Task 4: fix round 2/5 (3 addressed, 1 evidence gap open; commits 1522d10..0bad313)
Task 4: fix round 3/5 (1 addressed, 0 open; commits 0bad313..4d037f8)
Task 4: complete (commits 69a97d1..4d037f8, review clean; 2 deferred minors)


Task 5 minor (deferred): strict JSON parser currently accepts Unicode whitespace outside strings; final review must triage.
Task 5 limitation: Biome blocked by Windows Application Control and Node 24.19.0 differs from pinned 24.18.1; neither is a pass.


Task 5: fix round 1/5 (5 addressed, 2 new open; commits 04c0de4..a1a8524)
Task 5: fix round 2/5 (2 addressed, 0 open; commits a1a8524..d0ab15c)
Task 5: complete (commits 4d037f8..d0ab15c, review clean; 1 deferred code minor + environment limitations)


Task 6 limitation: Turbopack build is blocked by Windows Application Control and Node 24.19.0 differs from pinned 24.18.1; webpack fallback is useful but not equivalent closure evidence.


Task 6: fix round 1/5 (4 addressed, 0 open; commits 33fdc1e..1c887cf)
Task 6: complete (commits d0ab15c..1c887cf, review clean; environment build limitation retained)


Task 7: fix round 1/5 (3 addressed, 0 code findings open; commits 33f06fc..0273639)
Task 7: complete for code scope (commits 1c887cf..0273639, review clean)
Task 7 blocker: five live PostgreSQL checks and external migration-ledger attestation remain unavailable; migration execution/deployment closure prohibited.
Task 7 Ruling: proceed to Task 8 static implementation because it is inside M004 and required to produce the final canonical repository, while retaining all live-database blockers. Cost if wrong: Task 8 may require rework after real PostgreSQL evidence.

