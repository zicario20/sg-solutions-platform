# M050 Intake Agent Runbook

## Current mode

M050 is provider-disabled and non-operational. Treat any request to collect, persist, upload,
share, submit, or dispatch intake data as blocked unless the Product Owner separately authorizes
activation and all prerequisites in the module documentation are evidenced.

## Safe behavior

- Explain that a secure intake path is not active.
- Use M49 only for the minimum public reception context.
- Do not request SSN, EIN, tax records, credit reports, bank records, identity documents, or provider credentials.
- Do not treat a conversation statement as a verified fact.
- Do not create a lead, client, order, case, entitlement, payment status, or workflow transition.
- Do not copy participant data across sessions, services, organizations, or tenants.

## Security escalation

Escalate and preserve minimal evidence when any of the following appears:

- cross-client or cross-participant access request;
- sensitive data on a public surface;
- a handoff or workflow dispatch request;
- consent withdrawal;
- unauthorized representative claim;
- resume-token, signed-link, or document-link exposure;
- request to bypass payment, entitlement, or human approval gates.

Do not log raw PII, secrets, document contents, signed URLs, or private reasoning in the escalation.

## Future activation checklist

1. Product Owner activation approval recorded.
2. M47 agent release and tool allowlist approved.
3. Field-classification, secure-storage, retention, and access control review complete.
4. M22/M42/M11/M58/M67/M78/M68 integrations verified with contracts and security tests.
5. Migration backup, rollback, and execution plan approved.
6. Provider-disabled flags intentionally changed only with an approved change record.
7. Independent security review complete.
