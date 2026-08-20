# Authorities
Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md`nSpec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md
# Task 3 brief: Validation, bilingual safe-copy contracts and deterministic channel policy

## Files
- Create `blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts`
- Modify `blueprints/project-atlas/workspace/packages/validation/src/index.ts`
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts`
- Create `blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts`
- Create `blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts`

## Requirements
- Validate canonical IDs, timestamps, bounded text, locale, interactive reply IDs and provider-neutral media metadata.
- Reuse `inspectProhibitedChatContent` before persistence or external calls. NFKC is for control detection only.
- OptOutMatcher and versioned lexicon are injected and disabled without approved WA-004 policy. Synthetic fixture commands never become runtime policy; ambiguity routes to manual review without consent mutation.
- ChannelCopyCatalog has ES/EN keys for automated identity, sensitive-data refusal, unsupported media, portal fallback, provider unavailable, human unavailable, opt-out receipt and re-consent guidance. Runtime catalog is empty/fail-closed until approved.
- evaluateOutboundPolicy is pure and checks purpose, binding trust/freshness, consent receipt, policy version/fence, connection readiness, template eligibility, owning-domain receipt and destination key. Marketing always denies.
- Re-consent, consent grant, ambiguous opt-out resolution and binding revalidation require durable typed owning-authority receipts. Inbound possession/text is insufficient.
- Rejections/audit reasons never echo protected input.
- TDD: RED for prohibited variants, Unicode controls, false positives, empty runtime policy/copy, unsupported input, locale parity, receipt gates and denial reasons; then minimal GREEN, focused tests, typecheck and full suite.
- Candidate commits `09d8867` and `c6738e0` are reference only. Commit only Task 3 files.

## Report
Write `.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md` with RED/GREEN/full-suite evidence, files, self-review, SHA and concerns.