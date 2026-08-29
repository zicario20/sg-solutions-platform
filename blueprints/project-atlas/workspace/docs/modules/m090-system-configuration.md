# M090 - System Configuration

## Status

Controlled foundation implemented. Runtime value resolution, feature-flag evaluation, sourced-fact refresh, activation, rollout and rollback remain disabled. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/system-configuration` defines configuration definitions, safe candidate-value references, change sets, feature flags, sourced facts and activation requests.
- Definitions support explicit scope, type and sensitivity metadata without becoming a new authorization, consent, compliance or domain-truth source.
- Candidate values store safe references only. Raw secrets, executable code and raw source payloads are rejected.
- Feature flags are presentation/availability controls only; they cannot grant authorization, consent or approval.
- Activation requests remain `blocked_runtime_disabled`; no configuration is resolved, applied, promoted, rolled out or rolled back.

## Security boundaries

- M083 remains the exclusive owner of raw secret material; M090 can retain only safe references.
- M081, M074, M076, M078, M084 and M085 retain their authorization, approval, compliance, consent, integration and retention responsibilities.
- No change set validates, approves, schedules or activates runtime behavior in this module.
- No provider profile is connected and no environment configuration can select a real endpoint.

## Persistence preparation

`packages/database/src/schema/system-configuration.ts` prepares configuration metadata, value references, change-set lifecycle, feature flags and sourced-fact evidence. No resolved value, secret or executable configuration is persisted.

## Future activation prerequisites

1. Product Owner approves the configuration scope and lifecycle controls.
2. M074 approval, M081 authorization, M083 secret resolution and M084 provider compatibility are wired and tested.
3. Validation, canary, rollback, audit and production environment segregation evidence is approved.

## Test coverage added

`tests/m090/system-configuration.test.ts` captures secret/code rejection, the feature-flag authorization boundary and blocked activation. The test file was added but not executed in this change.
