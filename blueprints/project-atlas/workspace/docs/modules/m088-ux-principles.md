# M088 - UX Principles

## Status

Controlled foundation implemented. No user journey, review process, feedback delivery or telemetry runtime is active. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/ux-principles` defines typed configurations, principles, journey stages, experience states, interaction contracts and review requests.
- The UX contract references M087 for presentation while preserving the current approved visual identity.
- Experience states distinguish local loading, backend processing, provider wait, human review, completion and failure without claiming that any application screen currently renders them.
- Journeys cannot bypass canonical workflow state, and interaction confirmations cannot substitute approval or authorization.
- Reviews remain `review_required`; no user research, usability review, accessibility review or product approval is fabricated.

## Boundaries

- M088 does not authenticate, authorize, change routes, invoke workflows, alter payments or record an approval.
- A UI acknowledgement is not M074 approval, M078 consent, M081 authorization or a provider decision.
- No raw user data, messages or private reasoning is read by the runtime contract.
- No actual visual or interaction behavior is changed by this module.

## Persistence preparation

`packages/database/src/schema/ux-principles.ts` prepares configuration, principle, journey, state, interaction-contract and review-request lifecycle records. It does not store user research responses or personal data.

## Future activation prerequisites

1. Product Owner approves a journey and surface scope.
2. The owning domain defines canonical states and transitions.
3. UI/UX, accessibility, responsive and bilingual evidence is reviewed.
4. M081 authorization and M086 route ownership are integrated at runtime.

## Test coverage added

`tests/m088/ux-principles.test.ts` captures the confirmation/approval separation, explicit async state vocabulary and disabled evaluation behavior. The test file has been added but not executed in this change.
