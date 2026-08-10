# Documentation Index

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Active
- Update rule: every specialized document must name its owner, status and update trigger

ADRs preserve architectural decisions. Module documents define bounded requirements. Phase reports preserve completion evidence. User-flow, wireframe, API, diagram, branding, legal and meeting-note folders contain only reviewed artifacts relevant to their named concern.

Roadmap authorities:

- [Module Catalog](roadmap/MODULE_CATALOG.md)
- [Release Horizons](roadmap/RELEASE_HORIZONS.md)
- [Dependency Map](roadmap/DEPENDENCY_MAP.md)
- [Status Model and Gates](roadmap/STATUS_MODEL.md)
- [External Activation Register](../EXTERNAL_ACTIVATION_REGISTER.md)

Research inputs and compatibility analyses are indexed in [Research](research/README.md). Research
is informative until the Product Owner approves its conclusions into the applicable authority.

Security and recovery authorities:

- [Data Classification](../DATA_CLASSIFICATION.md)
- [File Upload Security](../FILE_UPLOAD_SECURITY.md)
- [Backup and Recovery](../BACKUP_AND_RECOVERY.md)
- [Private Storage ADR](adr/003-storage.md)
- [Authorization Inheritance ADR](adr/004-authorization-inheritance.md)
- [Encryption ADR](adr/005-encryption.md)
- [Architecture-first External Activation ADR](adr/006-architecture-first-external-activation.md)
- [M003 Public Chat Gateway Runtime ADR](adr/007-public-chat-gateway-runtime.md)
- [M004 WhatsApp Channel Adapter ADR](adr/008-whatsapp-channel-adapter.md)
- [M005 Voice Gateway Runtime Boundary ADR](adr/009-voice-gateway-runtime-boundary.md)
- [M006 Public Form Schema and Submission Boundary ADR](adr/010-public-form-schema-and-submission-boundary.md)
- [M007 Client Authentication, Linking and Session Boundary ADR](adr/011-client-authentication-linking-and-session-boundary.md)
- [M008 Client Dashboard Aggregation, Priority and Freshness ADR](adr/012-client-dashboard-aggregation-priority-and-freshness.md)
- [M009 Client Service Projection, State and Version ADR](adr/013-client-service-projection-state-and-version-boundary.md)
- [M010 Client Process Status and Public Timeline ADR](adr/014-client-process-status-and-public-timeline-boundary.md)
- [M011 Document Authority, Quarantine, Version and Delivery ADR](adr/015-document-authority-quarantine-version-and-delivery-boundary.md)
- [M012 Secure Messaging Content, Visibility, Ordering and Handoff ADR](adr/016-secure-messaging-content-visibility-ordering-and-handoff-boundary.md)
- [M013 Appointment Authority, Availability, Concurrency and Calendar Projection ADR](adr/017-appointment-authority-availability-concurrency-and-calendar-projection.md)

M001 delivery evidence:

- [UX and Accessibility Review](reviews/M001-UX-ACCESSIBILITY-REVIEW.md)
- [Security Review](reviews/M001-SECURITY-REVIEW.md)
- [Public Website Runbook](runbooks/M001-public-website.md)
- [M001 Phase Completion Report](phases/PCR-M001-public-website.md)

M002 delivery evidence:

- [M002 UX and Accessibility Review](reviews/M002-UX-ACCESSIBILITY-REVIEW.md)
- [M002 Security Review](reviews/M002-SECURITY-REVIEW.md)
- [M002 Help Center Runbook](runbooks/M002-help-center.md)
- [M002 Phase Completion Report](phases/M002_PHASE_COMPLETION_REPORT.md)

M003 architecture evidence:

- [M003 Independent Architecture Review](reviews/M003-ARCHITECTURE-REVIEW.md)
- [M003 Security Architecture Review](reviews/M003-SECURITY-REVIEW.md)
- [M003 Public Chat PRD](modules/m003-public-chat.md)
- [M003 Public Chat Design](superpowers/specs/2026-08-09-m003-public-chat-design.md)

M004 architecture evidence:

- [M004 Independent Architecture Review](reviews/M004-ARCHITECTURE-REVIEW.md)
- [M004 Security Architecture Review](reviews/M004-SECURITY-REVIEW.md)
- [M004 WhatsApp Business PRD](modules/m004-whatsapp-business.md)
- [M004 WhatsApp Business Design](superpowers/specs/2026-08-09-m004-whatsapp-business-design.md)
- [M004 WhatsApp Channel Adapter ADR](adr/008-whatsapp-channel-adapter.md)

M005 architecture evidence:

- [M005 Independent Architecture Review](reviews/M005-ARCHITECTURE-REVIEW.md)
- [M005 Voice Agent PRD](modules/m005-voice-agent.md)
- [M005 Voice Agent Design](superpowers/specs/2026-08-09-m005-voice-agent-design.md)
- [M005 Voice Gateway Runtime Boundary ADR](adr/009-voice-gateway-runtime-boundary.md)
- [M005 Security Architecture Review](reviews/M005-SECURITY-REVIEW.md)

M006 architecture evidence:

- [M006 Independent Architecture Review](reviews/M006-ARCHITECTURE-REVIEW.md)
- [M006 Public Forms PRD](modules/m006-public-forms.md)
- [M006 Public Forms Design](superpowers/specs/2026-08-09-m006-public-forms-design.md)
- [M006 Public Form Boundary ADR](adr/010-public-form-schema-and-submission-boundary.md)
- [M006 Security Architecture Review](reviews/M006-SECURITY-REVIEW.md)
- Independent architecture review is approved with zero open findings and Cyber Neo is
  `SECURITY-CLEAR` at documentary risk `0/100`. Neither result authorizes Build or activation.

M007 architecture candidate:

- [M007 Independent Architecture Review](reviews/M007-ARCHITECTURE-REVIEW.md)
- [M007 Security Architecture Review](reviews/M007-SECURITY-REVIEW.md)
- [M007 Client Authentication and Account PRD](modules/m007-client-authentication-account.md)
- [M007 Client Authentication and Account Design](superpowers/specs/2026-08-09-m007-client-authentication-account-design.md)
- [M007 Client Authentication, Linking and Session Boundary ADR](adr/011-client-authentication-linking-and-session-boundary.md)
- Independent architecture review is approved with zero open findings and Cyber Neo is
  `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build or provider activation is authorized.

M008 architecture candidate:

- [M008 Independent Architecture Review](reviews/M008-ARCHITECTURE-REVIEW.md)
- [M008 Security Architecture Review](reviews/M008-SECURITY-REVIEW.md)
- [M008 Client Dashboard PRD](modules/m008-client-dashboard.md)
- [M008 Client Dashboard Design](superpowers/specs/2026-08-09-m008-client-dashboard-design.md)
- [M008 Dashboard Aggregation, Priority and Freshness ADR](adr/012-client-dashboard-aggregation-priority-and-freshness.md)
- Independent architecture review is approved with zero open findings and Cyber Neo is
  `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema, provider traffic or production behavior is
  authorized.

M009 architecture candidate:

- [M009 Independent Architecture Review](reviews/M009-ARCHITECTURE-REVIEW.md)
- [M009 Security Architecture Review](reviews/M009-SECURITY-REVIEW.md)
- [M009 Mis servicios PRD](modules/m009-my-services.md)
- [M009 Mis servicios Design](superpowers/specs/2026-08-09-m009-my-services-design.md)
- [M009 Client Service Projection, State and Version ADR](adr/013-client-service-projection-state-and-version-boundary.md)
- Independent architecture review is approved with zero open findings and Cyber Neo is
  `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema, provider traffic or production behavior is
  authorized.

M010 architecture candidate:

- [M010 Independent Architecture Review](reviews/M010-ARCHITECTURE-REVIEW.md)
- [M010 Security Architecture Review](reviews/M010-SECURITY-REVIEW.md)
- [M010 Estado de mi proceso PRD](modules/m010-process-status.md)
- [M010 Estado de mi proceso Design](superpowers/specs/2026-08-09-m010-process-status-design.md)
- [M010 Client Process Status and Public Timeline ADR](adr/014-client-process-status-and-public-timeline-boundary.md)
- Independent architecture/accessibility review is approved with zero open findings and Cyber Neo
  is `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema, provider traffic or production behavior is
  authorized.

M011 architecture candidate:

- [M011 Independent Architecture Review](reviews/M011-ARCHITECTURE-REVIEW.md)
- [M011 Security Architecture Review](reviews/M011-SECURITY-REVIEW.md)
- [M011 Portal de documentos PRD](modules/m011-document-portal.md)
- [M011 Portal de documentos Design](superpowers/specs/2026-08-09-m011-document-portal-design.md)
- [M011 Document Authority, Quarantine, Version and Delivery ADR](adr/015-document-authority-quarantine-version-and-delivery-boundary.md)
- Independent architecture/accessibility review is approved with zero open findings and Cyber Neo
  is `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema/RLS/Storage policy, bucket, provider traffic, real
  file or production behavior is authorized.

M012 architecture candidate:

- [M012 Independent Architecture Review](reviews/M012-ARCHITECTURE-REVIEW.md)
- [M012 Security Architecture Review](reviews/M012-SECURITY-REVIEW.md)
- [M012 Mensajería segura PRD](modules/m012-secure-messaging.md)
- [M012 Mensajería segura Design](superpowers/specs/2026-08-09-m012-secure-messaging-design.md)
- [M012 Secure Messaging Boundary ADR](adr/016-secure-messaging-content-visibility-ordering-and-handoff-boundary.md)
- Independent architecture/accessibility review is approved with zero open findings and Cyber Neo
  is `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema/RLS policy, provider, AI, notification, real message
  or production behavior is authorized.

M013 architecture candidate:

- [M013 Independent Architecture Review](reviews/M013-ARCHITECTURE-REVIEW.md)
- [M013 Security Architecture Review](reviews/M013-SECURITY-REVIEW.md)
- [M013 Client Appointments PRD](modules/m013-client-appointments.md)
- [M013 Client Appointments Design](superpowers/specs/2026-08-09-m013-client-appointments-design.md)
- [M013 Appointment Authority and Calendar Projection ADR](adr/017-appointment-authority-availability-concurrency-and-calendar-projection.md)
- Independent architecture/accessibility review is approved with zero open findings and Cyber Neo
  is `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema/RLS policy, OAuth/calendar/meeting provider,
  notification/payment activation, real appointment or production behavior is authorized.

M014 architecture candidate:

- [M014 Independent Architecture Review](reviews/M014-ARCHITECTURE-REVIEW.md)
- [M014 Security Architecture Review](reviews/M014-SECURITY-REVIEW.md)
- [M014 Client Payments and Billing PRD](modules/m014-client-payments.md)
- [M014 Client Payments and Billing Design](superpowers/specs/2026-08-09-m014-client-payments-design.md)
- [M014 Financial Authority, Idempotency and Reconciliation ADR](adr/018-financial-authority-obligation-snapshot-idempotency-and-reconciliation.md)
- Independent architecture review is approved with zero open material findings and Cyber Neo is
  `SECURITY-CLEAR` at documentary risk `0/100`. The candidate is ready only for Product Owner
  architecture review; no Build, route, schema/RLS policy, Stripe onboarding/secret/endpoint/event,
  real price/payment, merge, deployment or production behavior is authorized.

Design specifications live under `superpowers/specs/`. The status in each specification header is
authoritative: `Draft for Product Owner review` is not approved, while an approved specification
still does not authorize implementation without its separate Build gate.

The active bundle entry point is [blueprint.md](../../blueprint.md). Superseded E1–E3 planning lives under `../../archive/pre-roadmap-2026-08-02/` and is non-executable. There is no active task queue during Phase 0 documentary review.
