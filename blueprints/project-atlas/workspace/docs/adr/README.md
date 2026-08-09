# Architecture Decision Records

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Active index

| ADR | Decision |
|---|---|
| [001](001-authentication.md) | Supabase identity with domain/RLS/Storage authorization. |
| [002](002-database.md) | Supabase Postgres with Drizzle-only schema/migrations. |
| [003](003-storage.md) | Private Storage, quarantine and upload isolation. |
| [004](004-authorization-inheritance.md) | Secure case-based client authorization inheritance. |
| [005](005-encryption.md) | Application-level envelope encryption boundaries and key custody. |
| [006](006-architecture-first-external-activation.md) | Complete durable architecture first and track external activation separately. |
| [007](007-public-chat-gateway-runtime.md) | Proposed same-origin Astro runtime and hardened session boundary for M003. |
| [008](008-whatsapp-channel-adapter.md) | Proposed official provider-neutral WhatsApp adapter, durable ingress/outbox and secure identity boundary for M004. |
| [009](009-voice-gateway-runtime-boundary.md) | Proposed specialized real-time Voice Gateway with business state and authorization retained in the modular monolith. |
| [010](010-public-form-schema-and-submission-boundary.md) | Proposed immutable form registry and narrow same-origin Astro submission gateway with domain-owned durable acceptance. |
| [011](011-client-authentication-linking-and-session-boundary.md) | Proposed invitation-first client authentication, explicit identity linking and server-mediated session boundary for M007. |
| [012](012-client-dashboard-aggregation-priority-and-freshness.md) | Proposed request-scoped M008 aggregation, deterministic next-action policy, freshness and private/no-store boundary. |

ADRs are tool-neutral. Supersede a decision with a new numbered ADR; do not erase historical
rationale.
