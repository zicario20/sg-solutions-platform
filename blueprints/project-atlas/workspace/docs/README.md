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

Research inputs and compatibility analyses are indexed in [Research](research/README.md). Research
is informative until the Product Owner approves its conclusions into the applicable authority.

Security and recovery authorities:

- [Data Classification](../DATA_CLASSIFICATION.md)
- [File Upload Security](../FILE_UPLOAD_SECURITY.md)
- [Backup and Recovery](../BACKUP_AND_RECOVERY.md)
- [Private Storage ADR](adr/003-storage.md)
- [Authorization Inheritance ADR](adr/004-authorization-inheritance.md)
- [Encryption ADR](adr/005-encryption.md)

M001 delivery evidence:

- [UX and Accessibility Review](reviews/M001-UX-ACCESSIBILITY-REVIEW.md)
- [Security Review](reviews/M001-SECURITY-REVIEW.md)
- [Public Website Runbook](runbooks/M001-public-website.md)
- [M001 Phase Completion Report](phases/PCR-M001-public-website.md)

Approved design specifications live under `superpowers/specs/`. A specification documents an approved design; it is not implementation authorization.

The active bundle entry point is [blueprint.md](../../blueprint.md). Superseded E1–E3 planning lives under `../../archive/pre-roadmap-2026-08-02/` and is non-executable. There is no active task queue during Phase 0 documentary review.
