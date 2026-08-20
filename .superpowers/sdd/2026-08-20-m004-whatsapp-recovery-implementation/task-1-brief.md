# Task 1 brief: Add fail-closed M004 runtime configuration

Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md
Spec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md
Base: 05d85283632bf05d74c866b5f1a4ceb9eb5d3f70

## Files
- Create lueprints/project-atlas/workspace/packages/config/src/whatsapp.ts
- Modify lueprints/project-atlas/workspace/packages/config/src/index.ts
- Modify lueprints/project-atlas/workspace/.env.example
- Modify lueprints/project-atlas/workspace/turbo.json
- Create lueprints/project-atlas/workspace/tests/m004/whatsapp-config.test.ts
- Modify lueprints/project-atlas/workspace/tests/contract/production-gate.test.ts

## Required contract
`	s
export type WhatsAppRuntimeState = "disabled" | "local" | "staging";
export type WhatsAppProvider = "meta_cloud";
export type WhatsAppConfig = {
  enabled: boolean;
  runtimeState: WhatsAppRuntimeState;
  provider: WhatsAppProvider;
  graphApiVersion: string | null;
  webhookMaxBytes: number;
  webhookReadTimeoutMilliseconds: number;
  webhookTotalTimeoutMilliseconds: number;
  webhookConcurrencyLimit: number;
  webhookRateLimitPerMinute: number;
  mediaDownloadEnabled: false;
  marketingEnabled: false;
  preliminaryIntakeEnabled: false;
  providerTrafficAllowed: false;
};
export function readWhatsAppConfig(env: Readonly<Record<string, string | undefined>>): WhatsAppConfig;
`

## Acceptance
- Disabled defaults fail closed.
- Only local/staging application behavior can be enabled.
- providerTrafficAllowed is literal false and cannot be changed by environment.
- Provider is only meta_cloud; fakes are dependency-injected in tests.
- Graph API version matches ^v[1-9][0-9]*\.[0-9]+$, has no guessed default and may be absent only when disabled.
- Secrets and account/number IDs are absent from config and .env.example values.
- Numeric webhook bounds are validated.
- Production-gate assertions preserve provider-disabled state.
- Follow RED, GREEN, refactor; run focused tests, typecheck and complete suite; commit only Task 1 files.
- Candidate commit 3592ed4 is reference material, not authority. Inspect it and selectively reproduce only compliant behavior.
- No provider calls, credentials, activation, deployment, merge or work outside this worktree.

## Report
Write .superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-1-report.md containing files changed, RED evidence, GREEN evidence, full-suite evidence, self-review, commit SHA and concerns. Return only status, commit SHA, one-line test summary and concerns.