# Roadmap de SG Solutions Platform

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Approved Release 1A/1B baseline (Product Owner instruction, 2026-08-08)
- Update rule: cambiar alcance u orden mediante decisión registrada y sincronizar catálogo, estado y dependencias

El roadmap entrega una sola plataforma por cortes compatibles. Ningún release es un producto
independiente y ningún elemento del roadmap autoriza implementación por sí mismo.

## Active authorized delivery

- **M001 Public Website:** `PO Acceptance`; implementation and local verification are complete.
- **M002 Help Center:** `In Progress` under Decision 014.
- Scope: integrated bilingual public Help Center, governed content projection, static search,
  categories/types, freshness, SEO/accessibility, feedback event boundary and tests.
- Excluded: private knowledge, RAG/AI answers, chat/channel behavior, authenticated portal context,
  live CMS credentials and unapproved analytics transport.
- Exit: M002 quality gate, independent review, Cyber Neo review, PCR and Product Owner acceptance.

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
