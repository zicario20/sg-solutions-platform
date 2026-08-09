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

Design specifications live under `superpowers/specs/`. The status in each specification header is
authoritative: `Draft for Product Owner review` is not approved, while an approved specification
still does not authorize implementation without its separate Build gate.

The active bundle entry point is [blueprint.md](../../blueprint.md). Superseded E1–E3 planning lives under `../../archive/pre-roadmap-2026-08-02/` and is non-executable. There is no active task queue during Phase 0 documentary review.
