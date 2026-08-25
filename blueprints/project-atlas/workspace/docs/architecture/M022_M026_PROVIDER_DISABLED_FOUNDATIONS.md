# M022-M026 Provider-Disabled Foundation Architecture

## Decision

The Product Owner authorized sequential foundation work for M022 through M026. This decision does not activate a provider, create production data, deploy infrastructure, execute an external action, or grant Product Owner final acceptance.

## Boundaries

| Module | Bounded foundation | Explicitly excluded |
| --- | --- | --- |
| M022 | Versioned intake-definition lifecycle over M006 | Client data, sensitive uploads, signature, persistence, CRM/service dispatch |
| M023 | Task state, dependency and deterministic assignment policy | Durable queues, staff assignment, SLA, notifications, client task activation |
| M024 | Approval decision and payload-binding policy | Real reviewer identities, signatures, filing/refund/export execution |
| M025 | Agent scope and tool policy control plane | Model providers, Ollama, RAG, prompts, browser/voice/social automation |
| M026 | Provider activation gates and operations policy | Docker/Dokploy, Cloudflare, DNS, Tunnel, backups, deployment, GPU runtime |

## Shared safety rules

- No module may create an active service, case, payment, referral, appointment or provider request from a local contract.
- All external actions remain disabled by default and fail closed.
- Human approval binds a reviewed payload hash; it is never inferred from an AI run, payment event or frontend state.
- M006 remains the only public form renderer/submission authority. M022 composes it instead of replacing it.
- M021 remains the owner of commercial state and marketplace safety; M023, M024 and M025 supply reusable policy boundaries only.
- Durable tables, migrations, RLS and application routes require a separate approved implementation/activation gate.

## Provider-disabled status

All current adapter modes are disabled. Unit contracts and test fixtures, when executed later, are local evidence only and never demonstrate a live integration.
