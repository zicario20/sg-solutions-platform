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
