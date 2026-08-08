# Security

- Owner: Security Owner role, initially the Product Owner
- Status: Approved baseline
- Update rule: update for every auth, authorization, storage, payment or sensitive-data change

Identity, internal role and resource access are separate controls. Email matching never grants access. Client resources require explicit, revocable grants enforced in domain logic, RLS and Storage policies. Private files use short-lived signed URLs.

Secrets remain in provider environment stores. Logs, analytics and traces exclude documents, tax data, identifiers, notes, credit reports and portal free text. Sensitive changes require the launch gates in blueprint §20.1.
