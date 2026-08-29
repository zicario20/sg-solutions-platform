# M087 - Design System

## Status

Controlled foundation implemented. Runtime activation, component distribution, visual testing and Product Owner acceptance remain pending.

## Implemented contract

- `@atlas/design-system` provides typed configuration, token-set, component, pattern and release-request contracts.
- The contract references the existing `@atlas/design-tokens` source rather than copying or replacing the approved Manrope, Inter and light-first visual baseline.
- Components require an accessibility-contract reference and remain inactive until a future reviewed release.
- Design patterns describe presentation only. They cannot modify routes, domain behavior, authorization or business state.
- Release requests remain `review_required`; no token bundle, theme, component registry or presentation asset is activated.

## Security and accessibility boundaries

- Hidden, disabled or variant styling never substitutes M081 backend authorization.
- No current component is rendered, migrated or registered by this module.
- The package does not claim completed visual, accessibility, responsive or localization validation.
- Telemetry, screenshot capture and visual-regression execution remain disabled.

## Persistence preparation

`packages/database/src/schema/design-system.ts` prepares configurations, token sets, components, patterns and release requests. It stores references and lifecycle metadata only; it contains no CSS bundle, secret, client data or business record.

## Future activation prerequisites

1. Product Owner approves a versioned design release and visual scope.
2. Accessibility, responsive, localization and visual-regression evidence is collected.
3. Authorization remains enforced by M081 and canonical domain modules.
4. A reviewed component registry and rollback plan are approved.

## Test coverage added

`tests/m087/design-system.test.ts` captures inactive defaults, the authorization-styling prohibition and blocked rendering. The test file has been added but not executed in this change.
