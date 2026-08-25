# M031 Bookkeeping Provider-Disabled Foundation

M031 owns the bookkeeping domain boundary: bookkeeping engagements, chart of accounts, controlled period transitions, balanced journal-entry validation, source-transaction proposals, reconciliation review, close checklists, reproducible reporting, tax-team handoff and accounting-integration gating.

The foundation uses integer USD minor units, never mutates a posted entry, preserves source transaction identity for idempotent import and requires human review for classification, duplicate candidates, receipt matching, splits, transfer matches, reconciliation, close and tax handoff. It produces trial-balance, general-ledger, profit-and-loss and balance-sheet snapshots only from supplied posted entries. AI output remains a reviewable suggestion and cannot post entries or determine tax deductibility. Financial exports require MFA and human approval, while audit evidence intentionally excludes financial payloads.

## Capability boundary

Implemented locally: domain contracts and deterministic policy functions for accounting books, limited-scope cases, unconnected financial-account registry entries, engagements, charts, periods, journal-entry validation, controlled transaction proposals, close checklists, reporting snapshots, tax-ready handoff, provider readiness, audit references, AI safety and export gating.

Disabled by design: financial account connections, bank feeds, QuickBooks, Xero, provider credentials, file ingestion, journal persistence, real client financial data, tax calculation, tax filing, invoices, payments, actual exports and external reporting.

Pending an approved Build gate: database schema and repositories, APIs, authorization wiring, audit-service integration, document evidence, admin/client workspaces, provider adapters, migrations, backups, operational runbooks and end-to-end provider validation.

The M031 operational Build Gate must record the approved data classification, retention, recovery, provider scope, sandbox isolation, rollout and rollback evidence before any financial record or provider credential is introduced.
