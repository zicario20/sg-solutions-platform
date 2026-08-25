# M026 - DevSecOps, Infrastructure, Deployment and Operations

- Status: Provider-disabled technical foundation in progress; Product Owner acceptance pending
- Deployment: not started
- Production: not started

## Provider control baseline

Every external capability must have a typed registration, an explicit capability allowlist, Product Owner approval, a configured secret reference, sandbox evidence and an available kill switch before use. The default state is `disabled`; absence of a registration fails closed.

## Operations boundaries

- No Dokploy, Cloudflare, Docker, OCI image, DNS, Tunnel, Supabase self-hosting, PostgreSQL migration, backup agent, GPU node, Ollama runtime, monitoring account or production host was configured.
- No credential, hostname token, provider secret, tunnel credential or client data is present in this module.
- A future deployment must use the existing self-hosting-first strategy and receive separate Product Owner approval.

## Recovery posture

[PROPOSED — REQUIRES PRODUCT OWNER APPROVAL] Establish 3-2-1 encrypted offsite backups, a documented restore exercise, an RPO/RTO by service tier, and a separate recovery environment before operational activation. A backup on the production host alone is not sufficient.
