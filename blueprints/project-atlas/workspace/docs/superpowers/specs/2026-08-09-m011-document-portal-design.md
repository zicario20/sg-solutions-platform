# M011 Portal de documentos — UX/UI and experience specification

- Owner: Codex Architecture Agent with UI/UX Pro Max design guidance
- Final approver: Product Owner
- Status: Design candidate; no Build gate
- Surface: Client Portal `/client/documents` and service-scoped document views
- Related requirements: `docs/modules/m011-document-portal.md`
- Proposed architecture decision: ADR 015

This document defines the branded, responsive and accessible M011 experience. It is not a Figma
file, route, component implementation, copy approval, storage/scanner activation or authorization
to handle real client files.

## 1. Experience objective

Within the first viewport, a client should understand:

1. which document needs attention first;
2. why SG Solutions needs it and for which authorized service;
3. what format/quality is acceptable;
4. whether a prior upload is transferring, processing, under review, accepted or needs correction;
5. the one safe next action.

The portal should feel like a calm guided checklist, not a file manager, shared drive or security
dashboard. Complexity remains behind progressive disclosure.

## 2. Brand and art direction

Use the approved SG Solutions logo exactly as supplied. Do not redraw, regenerate, recolor or place
the banner artwork behind protected client content.

- Premium, trustworthy financial-services clarity with generous white space.
- Strong information hierarchy, restrained blue/cyan accents and green only for verified acceptance.
- Gold signals attention/correction with explicit text; it never means malware or panic.
- No metallic/glass surfaces, fake folder trees, paperclip wallpaper, decorative lock overload or
  animated upload theatrics.
- Subtle progress/state transitions only; reduced motion preserves identical meaning.

| Role | Token/value | Use |
|---|---|---|
| Heading | Manrope | Page, request and state headings |
| Body/control | Inter | Instructions, metadata and controls |
| Primary ink | Navy `#0A2540` | Structural text |
| Primary action | Cobalt `#0B63CE` | Upload/open/recovery controls |
| Information | Cyan `#00A3E0` | Neutral processing/received accents |
| Verified accepted | Green `#2E7D32` | Only staff-accepted/final states |
| Attention | Gold `#B7791F` | Pending/correction with text/icon |
| App surface | `#F7F9FC` | Portal background |

Light mode ships first. Dark tokens remain unpublished in Release 1A.

## 3. Information architecture

`Documentos` remains the fourth primary portal destination:

1. Inicio
2. Mis servicios
3. Estado de procesos
4. Documentos
5. Citas
6. Mensajes
7. Pagos
8. Centro de ayuda
9. Configuración

Routes use opaque public references and approved `/client` conventions:

- `/client/documents` — cross-service authorized landing;
- `/client/services/[publicServiceRef]/documents` — one authorized service context;
- document detail opens as a full route on small screens and an optional responsive detail panel on
  wide screens; both reauthorize independently.

Internal operations reuse the same domain but a separate authorized Admin surface:

- `/admin/documents` — role/resource-scoped review and recovery queues;
- `/admin/cases/[publicCaseRef]/documents` — one authorized case workspace;
- no staff route implies global access, and aggregate counts are authorization-filtered before
  serialization.

Suggested client groupings are not separate security scopes:

- `Necesitan atención`: requested, overdue or correction required;
- `En proceso`: transferring, received, safety processing or staff review;
- `Disponibles`: accepted client-visible documents and final deliverables;
- `Historial`: authorized superseded/archived items only when policy allows.

Filters are secondary. Authorization/visibility happens server-side before grouping, counts or
pagination. The browser never receives hidden rows or exact totals for unauthorized resources.

## 4. Page anatomy

1. Portal header and current authorized context.
2. Page title, short security guidance and optional service filter.
3. One priority-action panel driven by authorized request facts.
4. Compact status/filter controls and accessible result summary.
5. Request/document cards or table rows.
6. Progressive detail/preview region.
7. Help and secure-support handoff.

The page does not expose bucket, object key, scanner, checksum, internal classification, review
notes or provider diagnostics.

## 5. Priority action panel

The panel shows at most one document action selected by the owning approved policy:

- friendly document type/title;
- related service/context label;
- factual due date only when authoritative;
- one reason/instruction summary;
- one primary CTA: `Subir documento`, `Reemplazar archivo`, `Revisar corrección` or `Ver documento`;
- state freshness and help link.

If priority-critical facts are missing/stale, show an honest unavailable/unconfirmed state and
support path. Never choose from a partial list or imply that no documents are needed.

## 6. Request and document cards

Each card/row uses a stable semantic order:

1. document type/title;
2. service/context;
3. status badge with icon and text;
4. due/received/updated fact when approved;
5. one concise explanation;
6. primary action and secondary details.

Original filenames are not the primary label and appear only if DOC-004 permits. Version numbers,
source channel and internal classification are hidden by default.

Desktop may use a table at high density only when headers remain clear and rows retain 44px targets.
Mobile always uses stacked cards.

## 7. Upload entry

Upload should start from a named request. The preflight panel shows:

- what document is expected and why;
- supported types and maximum size from the server policy;
- photo/scan quality examples in plain text;
- privacy reminder and secure-channel explanation;
- whether one or several files are permitted;
- `Seleccionar archivo` plus camera/gallery choices when supported.

There is no broad generic drop zone until the Product Owner approves destination/classification
rules. No raw policy, scanner or storage terminology appears.

## 8. File selection and review

- Native file input is always available; drag-and-drop is enhancement only.
- Selected items show escaped filename locally, type/size and remove control before submission.
- Do not thumbnail-render untrusted bytes before a safe browser-local policy permits it; server
  preview waits for promotion.
- Explain unsupported HEIC/Office clearly and offer a safe conversion/support path without asking
  the client to email sensitive files.
- Multiple selection is disabled until DOC-006 approves count/order semantics.
- Changing service/request after selection clears or reauthorizes the selection; it never silently
  rebinds bytes.

## 9. Transfer and processing feedback

Separate three meanings visually and verbally:

1. `Subiendo` — bytes are transferring;
2. `Recibido para revisión de seguridad` — durable quarantine receipt exists;
3. `En revisión por SG Solutions` — safe promotion occurred and staff review is pending.

The progress bar has numeric text when knowable, a live-region announcement at meaningful intervals
and a cancel control whose copy does not promise server deletion until confirmed. After transfer,
switch to step-based processing rather than a fake 100% completion bar.

## 10. Success, correction and rejection

- `Recibido` never uses the green final treatment.
- Green `Aceptado` or `Documento final disponible` requires real staff/workflow evidence.
- Correction state uses gold, a structured client-safe reason, exact resubmission guidance and one
  replacement CTA.
- Safety rejection uses neutral protective language and a retry path without malware signature,
  parser or vendor detail.
- Operational rejection and safety rejection are distinct; copy does not accuse the client.
- A replacement success says `Nueva versión recibida`, not that the old document was erased.

## 11. Client detail and staff review workspace

### Client detail

Detail presents:

- friendly title/type and authorized service;
- semantic status and explanation;
- requested/received/reviewed dates when approved;
- current client-visible version label if approved;
- client-visible instructions/comment only;
- available preview/download action after fresh authorization;
- replacement/history controls only when policy permits.

It never lists hidden links, internal versions, staff actor, checksum, storage provider/key,
unapproved/raw provider filename, classification code, scanner output, OCR text or internal/
compliance comments. A protected display filename may appear only under the approved DOC-004 field
policy and never becomes the primary label, locator or authorization input.

### Staff review workspace

The Admin workspace is a case-scoped operational tool, not a universal file explorer. It provides:

- an authorization-filtered queue with `Safety processing`, `Ready for review`, `Correction`,
  `Final/deliverable` and restricted `Recovery` categories;
- exact client/service/case context without links to ungranted contexts;
- safe promoted preview only after the current version passes the M011 safety boundary;
- structured review action and expected-version conflict handling;
- three visually distinct comment zones: client-visible, internal and compliance-only;
- version lineage/compare metadata without editing prior bytes;
- classification, client visibility, deliverable, legal-hold/share/disposition controls only for
  roles and assurance approved by DOC-005/DOC-009/DOC-012/DOC-018;
- minimized audit/history codes and human recovery tasks.

Ordinary reviewers never open quarantine, malicious or unknown bytes. Security/recovery staff see
only the bounded metadata/reason needed for their job; scanner signatures, raw provider payloads,
keys and client content do not appear merely because an upload failed.

## 12. Preview and download

- Preview does not load automatically for Highly Sensitive content.
- A placeholder explains the document type and asks for explicit open action/step-up when required.
- PDF/image controls are keyboard reachable and labeled; page/zoom/rotate are optional enhancements.
- A textual fallback and authorized download are available when preview fails and policy allows.
- Embedded content runs from a dedicated credentialless preview origin inside an opaque-origin
  iframe sandbox, never from the authenticated application origin. It receives no application
  cookies/storage, never combines `allow-scripts` with `allow-same-origin`, and applies the ADR 015
  minimum CSP. Uploaded HTML/SVG/active content is never rendered; if the approved PDF/image viewer
  or rasterizer has not passed Build security tests, preview stays disabled and the policy-approved
  authorized download fallback is used.
- Download copy says access is temporary, not that a URL is single-use or instantly revocable
  unless implementation evidence proves it.
- Bulk download/export is absent until DOC-008 approval.

## 13. Responsive behavior

### Wide desktop

- 12-column shell with max readable content width.
- 7/5 list-and-detail arrangement when a preview/detail is open.
- Sticky filter/action bar only if it does not obscure zoom/focus.
- Table option for authorized staff; client defaults to spacious rows/cards.
- Admin uses a 3/5/4 queue → safe preview → structured review layout when width permits; each panel
  collapses independently and authorization changes close the complete workspace.

### Tablet

- Single list with detail drawer/full panel; no compressed permanent split view.
- Filters collapse into an accessible dialog/sheet with applied-count text.

### Mobile, including 320px

- Linear order: priority action → attention cards → processing → available.
- Full-width 44px+ controls and bottom-safe spacing.
- Native camera/gallery/file picker with clear supported-format text.
- Upload progress remains visible without blocking navigation; interrupted state has explicit retry.
- Detail/preview is a separate route/screen; no tiny side panel or horizontal table.
- Admin reflows queue → metadata/detail → credentialless safe preview → structured review into
  sequential full-width routes/panels; no horizontal table or compressed three-panel workspace.
- The Admin context header, classification and current immutable version remain visible on each
  step. Back/focus restoration preserves authorized filters and unsaved structured input, while a
  version/grant conflict closes privileged content and presents a reload/recovery action.

## 14. Accessibility

- Semantic headings/landmarks and one page `h1`.
- Native file input remains in the accessibility tree; custom drop area forwards label/instructions.
- Drag events have keyboard-equivalent controls and no timing-only requirement.
- Status uses text plus icon; color never carries the only meaning.
- Progress uses `aria-valuenow` when determinate and a polite live region without noisy per-byte
  announcements.
- Error summary receives focus and links to the affected file/request; field errors use described-by.
- Cards/tables have meaningful accessible names without internal references.
- Dialogs/drawers trap and restore focus; escape behavior never discards an active upload silently.
- Preview controls, replacement confirmation and pagination work keyboard-only and with screen
  readers.
- 200% zoom, high contrast, reduced motion and 320px reflow are required.

## 15. Bilingual content model

All system-owned content uses stable copy keys with paired Spanish/English review:

- navigation and group headings;
- document type/request labels and instructions;
- allowed types/limits and photo-quality guidance;
- transfer, quarantine, review, accepted and correction states;
- error/recovery and consent/privacy text;
- preview/download/replacement and notification copy;
- accessible labels/live announcements.

Original filenames/comments are not translated. Missing critical locale copy suppresses the action
and offers support; it never silently mixes languages.

## 16. State presentation matrix

| Durable fact | Client presentation | Treatment |
|---|---|---|
| Request published, no upload | Document needed | Gold attention + upload CTA |
| Bytes transferring | Uploading | Cobalt progress |
| Durable quarantine receipt | Received for security review | Cyan neutral, no final check |
| Scanner delayed | Processing is taking longer | Cyan/gold, no threat detail |
| Safe promoted, staff review pending | Under review | Cyan neutral |
| Staff accepted | Accepted | Green verified |
| Correction requested | Needs correction | Gold action + structured reason |
| Safety rejected | File could not be accepted safely | Neutral error + retry |
| Final client-visible deliverable | Final document available | Green + authorized view/download |
| Source inaccessible/stale | Temporarily unavailable | Neutral recovery/support |

Exact codes/copy remain DOC-003 decisions.

## 17. Empty, loading and failure states

- No authorized requests/documents: `No tienes documentos disponibles en este contexto` plus My
  Services/support; do not imply the client will never need documents.
- No attention items but sources confirmed: positive calm state without confetti.
- Loading: skeletons preserve layout and are silent after an accessible loading announcement.
- Partial page source: hide affected counts/actions and mark the section unavailable; do not show
  false zero.
- Session/grant change: discard the page and return to a safe portal entry.
- Storage/scan outage: maintain quarantine language and retry/support path; never say accepted.
- Preview outage: keep metadata and authorized recovery, not a blank embed.
- Offline: no document metadata/content cache; explain that a secure connection is required.

## 18. Components and token contracts

- `DocumentPriorityCard`
- `DocumentStatusBadge`
- `DocumentRequestCard`
- `DocumentListRow`
- `UploadPreflight`
- `AccessibleFilePicker`
- `SelectedFileReview`
- `TransferProgress`
- `ProcessingStepStatus`
- `CorrectionPanel`
- `DocumentDetailPanel`
- `SecurePreviewBoundary`
- `AuthorizedDownloadAction`
- `VersionHistoryDisclosure`
- `DocumentEmptyState`
- `DocumentErrorSummary`
- `AuthorizedReviewQueue`
- `StaffDocumentContextHeader`
- `StructuredReviewDecision`
- `SeparatedReviewComments`
- `RestrictedRecoveryPanel`
- `VersionLineagePanel`

Components consume semantic state/copy keys and audience-specific authorized DTOs only. Client
components never receive internal/compliance comments. Staff review components may receive the
exact structured internal/compliance field allowed by current scope, role, classification and
assurance; they never receive bucket keys, signed URLs before explicit action, raw scanner/provider
payloads, other-scope comments or hidden rows.

## 19. Analytics and privacy boundary

Until DOC-019 is approved, M011 emits no external product analytics. Future events may carry only
coarse route/action/outcome codes and approved performance buckets. Prohibited payloads include:

- document/request title or type if identifying;
- original filename, content, OCR/extraction, comment or correction free text;
- client/service/case/storage identifiers or signed URL;
- classification, SSN/tax/credit/identity details;
- DOM text, input values, session replay, screenshots or autocapture.

Operational safety/audit evidence stays in first-party authorized systems and is not PostHog
analytics.

## 20. Design validation checklist

- [ ] Spanish and English desktop/tablet/mobile flows cover request, upload, processing, correction,
  replacement, accepted deliverable and safe failure.
- [ ] Admin desktop/tablet/mobile flows cover scoped queue, safe promoted preview, structured
  review, separated comments, version conflict, restricted recovery and privileged disposition
  states; Admin also passes 320px reflow and 200% zoom.
- [ ] 320px, 200% zoom, keyboard-only, screen-reader, high-contrast and reduced-motion reviews pass.
- [ ] File selection works without drag/drop or camera.
- [ ] Transfer, durable receipt, safety processing, staff review and acceptance are visually and
  semantically distinct.
- [ ] No internal ID, filename-derived key, hidden count or scanner/provider detail appears. An
  internal comment never enters Client output or a Staff DTO outside its exact permission/scope;
  compliance-only text requires its dedicated authorized role. Cross-audience serialization tests
  prove the separation.
- [ ] Highly Sensitive preview/download/step-up behavior follows approved policy.
- [ ] Unsupported HEIC/Office and scan/storage/preview failures have safe portal recovery.
- [ ] Direct document URLs, every cursor and every action reauthorize.
- [ ] Normal staff cannot list/open quarantine or malicious bytes, hidden cases, security-provider
  details or compliance-only text; all queue counts are post-authorization.
- [ ] No sensitive DOM analytics, browser/offline cache or autoplay preview.
- [ ] All visible states/actions have approved bilingual semantic copy.

## 21. Approval boundary

Product Owner approval is required for this design, the M011 PRD, ADR 015 and DOC-001–DOC-020
policies. Approval of documentation still does not authorize routes, components, database tables,
RLS/Storage policies, buckets, real files, scanner/OCR/signature providers, analytics, deployment or
`GENERATE`.
