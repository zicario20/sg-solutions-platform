# M049 Reception Agent Architecture

## Purpose

M049 is the limited public reception boundary for SG Solutions. It turns a public channel interaction
into a minimized, deterministic classification and a prepared next-step request. It is not a public
expert, case portal, CRM writer, scheduler, payment system, or autonomous agent.

Existing public channel or M003 public chat
  -> M049 session and digest-only interaction boundary
  -> deterministic intent, risk, and sensitivity classification
  -> public-knowledge-only decision OR prepared request
  -> M050 intake / M051 scheduling / M052 authenticated support / M048 supervisor / human queue
  -> separately authorized owner adapter in a future activation

## Ownership and integration

- M003 remains the public-chat transport and conversation owner.
- M047 owns AI manifests, prompts, tool policies, release gates, providers, and model controls.
- M048 owns cross-specialist routing and prepared supervisor plans.
- M020 owns durable leads and CRM records.
- M022/M050 own intake content and submissions.
- M013/M051 own appointment availability and booking.
- M011 owns documents, M043/M044 own payments, and M052 owns authenticated client support.

M049 stores no raw visitor messages, reports, credentials, payment information, tax information, or
documents. It retains only opaque references, source references, bounded classifications, and
SHA-256 interaction digests. Public high-risk or sensitive input routes to a secure channel or human
review rather than an automated next step.

## Execution posture

Every M049 decision and request has executionPermitted=false. The disabled runtime has no network,
provider, CRM, appointment, messaging, payment, document, or link-generation adapter. Tool policy
allows preparation only; tools that create records, send content, issue a link, book an appointment,
change pricing, approve, grant an entitlement, or execute a service are rejected.

## Persistence posture

The M049 schema uses tenant-scoped records with RLS enabled. Migration 0059 forces RLS and applies
a restrictive deny-all policy to every M049 table. It is authored only and must not be applied without
the normal backup, authorization, migration, security-review, and deployment evidence.
