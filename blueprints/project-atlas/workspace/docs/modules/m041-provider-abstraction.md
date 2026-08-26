# M041 - Provider Abstraction

## Status

Controlled technical foundation implemented. Provider runtime remains disabled. Product Owner activation, vendor onboarding, production configuration, live adapter deployment, webhooks, polling, file exchange, routing and failover are not implemented.

## Scope delivered

- Versioned canonical provider contracts for the initial provider interfaces:
  - \`CreditMonitoringProvider\`
  - \`TradelineProvider\`
  - \`FinancialMarketplaceProvider\`
  - \`TaxFilingProvider\`
  - \`PaymentProvider\`
  - \`TelephonyProvider\`
  - \`MessagingProvider\`
  - \`IdentityProvider\`
  - \`StorageProvider\`
  - \`ModelProvider\`
- Provider, interface, capability, schema, adapter, configuration, endpoint, request, response, route, health and finding persistence models.
- Provider configuration validation that stores secret references only and rejects plaintext secrets.
- HTTPS endpoint and explicit host-allowlist validation.
- Canonical request validation, idempotency tracking and sensitive-field blocking.
- Conservative response normalization. Unmapped external statuses remain \`unknown\`.
- Provider-disabled adapter validation, disabled route selection and blocked external-call guard.
- Provider AI drafts limited to sourced, human-reviewable summaries. They cannot activate, rotate, route, fail over or retire a provider.

## Architecture boundary

M041 is technical provider infrastructure. It is distinct from M040 Partner Management:

- A partner is a commercial or organizational relationship.
- A provider is a technical capability implementation.
- A provider may reference a partner or organization, but neither record replaces the other.
- Domain modules call canonical capabilities. They must not import vendor SDKs, construct vendor URLs, store provider credentials or make direct provider calls.

The first controlled source of truth is \`@atlas/provider-abstraction\`. M035, M036, M037, M039 and M040 remain domain owners for their business data and decisions.

## Security and governance

- No secret values are stored in provider configuration.
- No external request is permitted by the runtime.
- No webhook receiver, polling process, redirect, file transfer, model invocation or production endpoint is active.
- Requests include purpose, resource reference, correlation ID and idempotency key.
- Sensitive fields are rejected before a provider request record is accepted.
- Normalization does not infer an approval, payment, application or filing outcome.
- Provider selection does not activate routing or failover.
- All production activation requires approved Provider Activation documentation, threat review, testing evidence, monitoring, rollback and Product Owner approval.

## Persistence and migration

Migration \`0049_m041_provider_abstraction.sql\` is authored but has not been applied. It creates only controlled metadata and evidence tables. The migration does not create provider credentials or activate an external connection.

## Activation prerequisites

[NEEDS PRODUCT OWNER DECISION: approve a provider activation workflow with owner, permitted environments, legal/commercial review, security review, data classification, consent requirements, cost controls, monitoring, rollback and incident ownership.]

[NEEDS PRODUCT OWNER DECISION: approve capability-specific canonical request and response schemas before a live adapter is built.]

[NEEDS PRODUCT OWNER DECISION: approve the first provider, its agreement, retention policy, credential management location and test evidence before any network call is enabled.]
