# M022 - Forms, Intake and Dynamic Questionnaires

- Owner: Codex Architecture Agent
- Status: Provider-disabled technical foundation in progress; Product Owner acceptance pending
- Reuses: M006 public forms as the sole renderer, validation, consent, encryption, draft and submission authority

M022 adds an administrative intake-definition boundary above M006. It validates bilingual reusable form definitions, requires approval before publication, preserves versioned definitions and returns a `pending_owner_dispatch` action plan rather than creating a Client, ServiceOrder, CaseFile, payment, appointment or provider action.

## Disabled

- Database migrations and persistence for M022 administrative definitions.
- Sensitive uploads, signatures, external invitations and authenticated intake activation.
- CRM, ServiceOrder, CaseFile, Task, Appointment, Billing, Marketplace, AI and provider dispatch.
- Production publication, deployment and real client data.
