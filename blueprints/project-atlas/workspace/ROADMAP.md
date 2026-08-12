# Roadmap de SG Solutions Platform

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Approved Release 1A/1B baseline (Product Owner instruction, 2026-08-08)
- Update rule: cambiar alcance u orden mediante decisión registrada y sincronizar catálogo, estado y dependencias

El roadmap entrega una sola plataforma por cortes compatibles. Ningún release es un producto
independiente y ningún elemento del roadmap autoriza implementación por sí mismo.

## Active authorized delivery

- **M001 Public Website:** `PO Acceptance`; implementation and local verification are complete.
- **M002 Help Center:** `PO Acceptance`; implementation, full local verification and independent
  review are complete under Decisions 014–015; merge/deployment remain Product Owner decisions.
- Scope: integrated bilingual public Help Center, governed content projection, static search,
  categories/types, freshness, SEO/accessibility, feedback event boundary and tests.
- Excluded: private knowledge, RAG/AI answers, chat/channel behavior, authenticated portal context,
  live CMS credentials and unapproved analytics transport.
- Exit: Product Owner acceptance and merge/deployment decision. No next module is authorized by this
  completion.
- **M003 Public Chat:** Product/Architecture documentation is active under Decision 016. The target
  is an implementation-ready, provider-neutral design with human handoff, consent, moderation,
  security, M002 knowledge reuse and explicit fallbacks. No M003 Build gate or live connection is
  authorized by this architecture work. The final documentary candidate passed independent and
  Cyber Neo review and now awaits Product Owner approval of the PRD/design, ADR 007 and transcript
  boundary.
- **M004 WhatsApp Business:** Product/Architecture documentation is active under Decision 017. The
  target is an official provider-neutral channel adapter over the shared M003/M025 communication
  kernel, with verified durable webhooks, consent/opt-out, bilingual templates, idempotent
  inbox/outbox, secure portal handoffs and manual recovery. No M004 Build gate, account, number,
  credential, template submission, live message or campaign is authorized. Direct Meta versus an
  approved BSP and every operational policy remain activation decisions. The final documentary
  candidate passed independent review and Cyber Neo at risk 0/100 and now awaits Product Owner
  approval of the PRD/design and proposed ADR 008.
- **M005 Voice Agent:** Product/Architecture documentation is active under Decision 018. The target
  is a provider-neutral bilingual receptionist whose durable policy/state stays in the modular
  monolith and whose proposed M096 boundary handles only real-time media and scoped speech adapters.
  Caller ID is never identity, recording/transcription remain disabled, and client-specific work
  defaults to the secure portal. No Build gate, runtime/provider dependency, account, number,
  credential, real call or deployment is authorized. The final candidate passed independent
  architecture review with zero open findings and Cyber Neo at documentary risk 0/100 after all
  security/consistency findings were remediated. It now awaits Product Owner approval or revision of
  the PRD/design and proposed ADR 009.
- **M006 Public Forms:** Product/Architecture documentation is active under Decision 019. The target
  is a bilingual, versioned, accessible public capture capability using a narrow same-origin Astro
  gateway and durable domain acceptance before generic success. It delegates leads/deduplication to
  M020 and consent to M078, keeps detailed intake in the portal, and rejects public uploads/
  persistent Confidential drafts in Release 1A. No Build, fields/copy approval, route, provider,
  cookie, real submission or deployment is authorized. Independent architecture review closed with
  zero open findings and Cyber Neo closed at documentary risk 0/100 after origin/proxy, parser,
  prohibited-data, digest, nonce, risk-review and cross-channel authority remediation. The candidate
  now awaits Product Owner approval or revision of the PRD/design and proposed ADR 010.
- **M007 Client Authentication and Account:** Product/Architecture documentation is active under
  Decision 020. The candidate is invitation-first and separates Supabase identity, SG Solutions
  account status, membership, role/permission, entitlement and case/resource grants. Email/password
  and future-activated Google are methods of one identity; matching email/phone/payment/CRM state
  grants nothing. Proposed ADR 011 uses a server-mediated PKCE/session boundary with a mandatory
  pinned-version compatibility proof before Build. The independent review closed all 14
  architecture/consistency findings and Cyber Neo closed CN-001–CN-010 at documentary risk 0/100.
  The candidate awaits Product Owner approval or revision. No `GENERATE`, route, schema/RLS policy,
  Supabase/Google/email/MFA configuration, real account/session, merge or deployment is authorized.
- **M008 Client Dashboard:** Product/Architecture documentation is active under Decision 021. The
  candidate defines `/client` Home as one request-scoped, client-safe read model over typed owning-
  domain projections. One complete M007 authorization snapshot and a consistent read cut govern the
  response; proposed ADR 012 uses a closed source registry to select one deterministic priority
  action, and any missing registered source that could tie or outrank the result yields
  `unconfirmed`, not a false zero/no-action state. Release 1A has no monolithic dashboard snapshot,
  live provider fan-out or personalized shared cache. No `GENERATE`, route, schema/RLS policy,
  provider traffic, real dashboard, merge or deployment is authorized. Independent architecture
  review has zero open findings and Cyber Neo is security-clear at documentary risk 0/100; the
  candidate now awaits Product Owner approval or revision.
- **M009 Mis servicios:** Product/Architecture documentation is active under Decision 022. The
  candidate defines the authorized contracted-service directory and detail shell over real
  `ServiceOrder`/`CaseFile` records, explicit resource grants and accepted definition/workflow
  versions. It keeps canonically owned commercial, financial, human-activation and fulfillment
  subfacts separate, uses typed bounded
  M010–M014 projections and performs no mutation or provider fan-out. No `GENERATE`, route, schema,
  RLS/Storage policy, real service record, merge or deployment is authorized. Independent
  architecture review has zero open findings and Cyber Neo is security-clear at documentary risk
  0/100; the candidate now awaits Product Owner approval or revision.
- **M010 Estado de mi proceso:** Product/Architecture documentation is active under Decision 023.
  The candidate defines one read-only process projection beneath an explicitly granted service,
  preserves ServiceOrder/Billing/Case/workflow state ownership, binds milestones to the accepted
  workflow version and derives its client timeline only from allowlisted real source events. A
  closed source registry and M008-compatible priority policy fail incomplete critical facts to
  `unconfirmed`; a complete M007–M009 snapshot plus per-resource final fence prevents revoked or
  mixed state from reaching body, counts, cursors or routes. No `GENERATE`, route, schema/RLS
  policy, public-event materialization, provider traffic, real process view, merge or deployment is
  authorized. Independent architecture review has zero open findings and Cyber Neo is
  security-clear at documentary risk 0/100; the candidate now awaits Product Owner approval or
  revision. M011 may open only from the clean committed M010 worktree.
- **M011 Portal de documentos:** Product/Architecture documentation is active under Decision 024.
  The candidate defines one document authority over Postgres metadata/state and approved Supabase
  private Storage bytes, with bounded upload intents, quarantine, content/parser validation,
  checksum, malware scan, proven promotion, immutable versions, explicit review/visibility and
  authorized preview/download. Safety, business review, request satisfaction, visibility and
  retention/legal hold remain separate. M065 OCR/extraction, M066 generation, M067 signature,
  channel ingestion and partner sharing stay separately gated. No `GENERATE`, route, schema,
  RLS/Storage policy, bucket, scanner/provider traffic, real file, merge or deployment is
  authorized. Independent architecture/accessibility review now has zero open findings and Cyber
  Neo is security-clear at documentary risk 0/100. Twenty Build/live policies remain explicit
  `DOC-001`–`DOC-020` Product Owner decisions. M011 awaits Product Owner review. Decision 025 now
  permits the separate M012 worktree to proceed from the clean audited M011 commit.
- **M012 Mensajería segura:** Product/Architecture documentation is complete and independently
  audited under Decision 025. The
  candidate defines one authenticated secure-portal messaging authority over the shared
  conversation kernel, explicit account/service/case roots, separate client-message and internal-
  note records/commands/DTOs/events, separate Client/staff order/version domains, atomic encrypted
  revision/current-pointer/idempotency receipts, typed owner references and human/AI handoff. M011
  owns attachment bytes/access; M025 owns a content-free unified-inbox projection; M026 owns
  notifications; M047–M060 own AI behavior subordinate to M076 compliance/human decisions. No `GENERATE`, route, schema/RLS policy, provider, AI,
  notification, real message, merge or deployment is authorized. Independent architecture review
  has zero open findings and Cyber Neo is security-clear at documentary risk 0/100; twenty Build/live
  policies remain explicit `MSG-001`–`MSG-020` Product Owner decisions. M013 may open only after the
  final validated M012 commit.
- **M013 Client Appointments:** Product/Architecture documentation is complete and independently
  audited under Decision 025 from M012 commit `4fcbf425`. The candidate defines one Postgres
  appointment authority, M013/M024 owner split, versioned availability, IANA/DST evidence, single-use
  holds, database conflict protection, atomic rescheduling, separate lifecycle/prerequisite/
  attendance/provider/reminder axes and independently gated minimized Google/Meeting projections.
  Twenty Build/live policies remain explicit one-to-one `APT-001`–`APT-020` Product Owner decisions.
  Independent review has zero open findings and Cyber Neo is security-clear at documentary risk
  `0/100`; full scaffold/build/hygiene validation passes. No `GENERATE`, route, schema/RLS policy,
  OAuth/calendar/meeting provider, notification/payment traffic, real appointment, merge or
  deployment is authorized. M014 may open only after the final clean M013 commit.
- **M014 Client Payments and Billing:** Product/Architecture documentation is complete and
  independently audited under Decision
  025 from clean M013 commit `f50b71b`. The candidate defines M014 as the client projection/action
  boundary over one shared Billing context; M021 owns ServiceOrder/human approval, M042 catalog, M043
  provider integration, M044 verification/reconciliation, M045 entitlements and M046 pricing. It
  specifies canonical price presentation with separate off-by-default publication, currency-policy
  fail-closed activation, atomic quote/order/obligation acceptance, immutable money snapshots,
  recoverable provider idempotency/correlation, signed generation-bound webhook invalidations with
  canonical retrieval, orthogonal payment/approval/fulfillment axes, explicit access roots and safe
  public/browser handoffs. Twenty Build/live policies remain `PAY-001`–`PAY-020`. Initial independent
  findings were remediated; final independent review has zero open material findings and Cyber Neo is
  security-clear at documentary risk `0/100`.
  No `GENERATE`, route, schema/RLS policy, Stripe onboarding/secret/endpoint/event, price, payment,
  merge or deployment is authorized. Decision 026 now authorizes M015 documentary work from this
  audited snapshot.
- **M015 Financial and Business Profile:** Product/Architecture documentation is active under
  Decision 026 from audited M014 commit `1f70598` with the M008 evidence correction carried forward.
  The candidate defines one purpose-bound reusable profile fact authority: typed personal,
  household, financial and business extensions with provenance, freshness, immutable revisions,
  governed corrections/conflicts and minimal service DTOs. M007/M011/M017–M022 and specialist
  service domains retain their canonical records; forms, documents, providers and AI submit
  proposals only. Explicit profile or service/case grants combine with role, purpose/consent,
  sensitivity, assurance, RLS and final fences. Twenty Build/live policies remain
  `PFL-001`–`PFL-020`. Independent architecture review has zero open material findings and Cyber Neo
  is security-clear at documentary risk `0/100`; the candidate now awaits Product Owner documentary
  review. No `GENERATE`, route, schema/migration/RLS policy, KMS/provider/AI activation, real profile
  data, merge or deployment is authorized.
- **M016 Administrative Dashboard:** Product/Architecture documentation is active under Decision
  027 from audited M015 commit `015ab3b`. The candidate defines one read-oriented, role-scoped
  aggregation/BFF boundary in the existing Admin surface. Owner modules retain operational truth and
  commands; M016 owns widget definitions, deterministic priority composition, explicit source/
  period/freshness/coverage/partial-failure semantics and disposable preferences/snapshots. Every
  widget is authorized server-side and every drill-down reauthorizes in its owner; zero never means
  unavailable or incomplete. Twenty Build/live policies remain `ADM-001`–`ADM-020`. Independent
  architecture review has zero open P0–P3 findings and Cyber Neo is security-clear at documentary
  risk `0/100`; the candidate awaits Product Owner documentary review. No `GENERATE`, route,
  schema/RLS policy, metric/widget activation, real dashboard, merge or deployment is authorized.
  M017 may open only after a clean audited M016 commit.
- **M017 CRM:** Product/Architecture documentation is complete and independently audited under
  Decision 027 from audited M016
  commit `de4e35b`. The candidate defines the Admin commercial-relationship workspace while M018
  Person/Client, M019 Organization, M020 Lead, M021 ServiceOrder, M022 CaseFile and M023 Task remain
  canonical. M017 owns CRM relationships, opportunities, versioned pipelines, assignments and
  bounded CRM activity. Opportunity `won`, client activation, payment, entitlement, approval and
  case progress remain independent. Proposed ADR 021 controls typed owner projections, idempotent
  conversion and reviewed canonical resolution; no automatic merge. Independent architecture
  review has zero open P0–P3 and Cyber Neo is security-clear at documentary risk `0/100`.
  Twenty-three Build/live policies remain `CRM-001`–`CRM-023`. No `GENERATE`, route, schema/RLS
  policy, data, merge, import/export, automation, provider connection or deployment is authorized.
  M018 opens only after the clean audited M017 commit.

## Architecture-first activation policy

Modules may complete their durable architecture and later authorized local implementation before SG
Solutions has every external account or commercial agreement. Live activation remains a separate
gate governed by `EXTERNAL_ACTIVATION_REGISTER.md` and ADR 006.

- Do not create disposable provider-specific logic merely to demonstrate a flow.
- Do not block architecture on credentials that are not needed to define a safe contract.
- Do not report adapters, mocks or local tests as operational external connections.
- Preserve a secure manual fallback and fail closed when a provider is unavailable.
- Require Product Owner approval and non-sensitive activation evidence before `Operational`.

## Phase 0 — Blueprint & Design

Definición del producto, arquitectura, catálogo conceptual, PRDs, decisiones de seguridad, modelo de
datos, UX/UI, gobierno y reproducibilidad del scaffold. No incluye comportamiento de producto.

## Release 1 — Production Foundation

Release 1 conserva la arquitectura aprobada y se divide en dos cortes desplegables. Release 1A no es
un prototipo: utiliza los identificadores, primitivas, políticas, migraciones y adapters definitivos,
y Release 1B la amplía de forma compatible.

### Release 1A — Minimum Real-Client Operations

Resultado: SG Solutions puede captar, cobrar y operar de forma segura un volumen inicial de clientes
reales con intervención humana explícita.

- identidad central, MFA obligatorio para staff, roles/permisos y acceso delegado;
- registros de clientes/empresas y CRM con pipeline básico;
- service orders, casos, tareas, notas internas, auditoría y próximos pasos;
- Document Center seguro con cuarentena/scan contract y descargas autorizadas;
- sitio público esencial, contenido bilingüe inicial, leads y consentimiento;
- agenda básica con concurrencia segura y proyección Google controlada;
- cotizaciones esenciales, depósitos y pagos únicos con Stripe/reconciliación mínima;
- portal mínimo para servicios, estado, documentos, citas y pagos;
- perfil progresivo mínimo limitado a los campos necesarios para el primer servicio real aprobado,
  con procedencia, revisión, cifrado y acceso por propósito;
- operación manual segura de Business Formation sobre primitivas comunes;
- backups, despliegue, observabilidad y rutas manuales mínimas para operar clientes reales.

### Release 1B — Operational Maturity

Resultado: la misma foundation madura para mayor volumen, recuperación y consistencia operativa sin
reescribir 1A.

- sincronización Google avanzada, recurrencia externa, reconciliación y recovery ampliados;
- payment plans, facturación/reconciliación avanzada, refunds/disputes operativos gobernados;
- atribución y consentimiento ampliados sin datos sensibles;
- automatizaciones durables adicionales y fallbacks operativos;
- observabilidad, restore testing y alertas mejorados;
- más workflows del portal, mensajería/notificaciones y perfil aprobado;
- reporting operativo y workload/conversion insights minimizados;
- Business Formation completo con EIN, compliance y firma electrónica bajo aprobación humana.

## Workstreams de Release 1

Los códigos históricos `R1.1–R1.5` del catálogo son workstreams de capacidad, no entregas separadas:

1. **R1.1 Platform Foundation:** comienza en 1A y madura en 1B.
2. **R1.2 Public Sales Engine:** experiencia/contenido esencial en 1A; amplitud y medición en 1B.
3. **R1.3 Internal Operations Core:** operación mínima en 1A; reporting/automation maturity en 1B.
4. **R1.4 Business Formation Vertical:** operación manual segura en 1A; vertical completo en 1B.
5. **R1.5 Client Portal & Launch:** portal mínimo en 1A; workflows ampliados en 1B.

Esta interpretación preserva el catálogo y evita convertir sus etiquetas en arquitecturas paralelas.

## Releases posteriores

- **R2 — Credit Ecosystem:** crédito, monitoring, tradelines y operación especializada.
- **R3 — Taxes & Accounting:** taxes, bookkeeping y contabilidad.
- **R4 — Funding & Home Buying:** business funding y asistencia para compra de vivienda.
- **R5 — Marketplace & Partners:** marketplace, recomendaciones, partners e integraciones financieras.
- **R6 — Knowledge & Documents:** knowledge base, RAG, fuentes y procesamiento/generación ampliados.
- **R7 — Communications & Automation:** canales, voice gateway, workflow engine, n8n, browser automation, colas, fallbacks y aprobaciones.
- **R8 — AI Operations:** AI Hub y agentes especializados bajo human-in-the-loop.
- **R9 — Scale & Hybrid Infrastructure:** homelab, nodos locales/GPU y resiliencia híbrida cuando las métricas lo justifiquen.
- **R10 — Mobile & Expansion:** experiencia móvil y expansiones aprobadas por evidencia.

## Reglas de secuenciación

- Cloud-first; homelab/híbrido no bloquean Release 1.
- No se construye una versión desechable de una capacidad 1A.
- Business Formation sigue siendo el primer vertical completo al cierre de Release 1B.
- Marketplace, partners y provider abstractions reservan límites desde foundation; no adelantan el comportamiento completo de R5.
- Cada módulo sigue `docs/roadmap/STATUS_MODEL.md` y requiere PRD/gates/decisión del Product Owner.
- Cada módulo Operational produce PCR y sincroniza estado, memoria, decisiones y changelog.
