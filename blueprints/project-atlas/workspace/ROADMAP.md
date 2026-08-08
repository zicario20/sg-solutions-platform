# Roadmap de SG Solutions Platform

- Owner: Product Owner
- Status: Approved roadmap baseline
- Update rule: cambiar horizontes, orden o alcance solo mediante decisión registrada; actualizar catálogo, estado y dependencias en el mismo cambio

El roadmap entrega una sola plataforma por horizontes incrementales. Ningún horizonte es un producto independiente. Los módulos concretos se registran en [MODULE_CATALOG.md](docs/roadmap/MODULE_CATALOG.md); los objetivos y criterios de salida se detallan en [RELEASE_HORIZONS.md](docs/roadmap/RELEASE_HORIZONS.md).

## Phase 0 — Blueprint & Design

Definición del producto, arquitectura, catálogo de 110 módulos conceptuales, dependencias, gobierno, PRDs, seguridad y diseño UX/UI. Esta fase es documental y no autoriza código.

## Release 1 — Production Foundation

Primera entrega apta para clientes reales y diseñada para evolución compatible, no para reemplazo.

1. **R1.1 Platform Foundation:** identidad, autorización, datos, provider abstractions, catálogo y motor de precios, seguridad, consentimiento, auditoría y base operativa.
2. **R1.2 Public Sales Engine:** sitio público, contenido, formularios, captación, orientación, CTA y oferta gobernada.
3. **R1.3 Internal Operations Core:** CRM, clientes, empresas, leads, órdenes, expedientes, tareas, calendario, documentos, pagos, configuración y reportes operativos.
4. **R1.4 Business Formation Vertical:** primer vertical completo sobre las primitivas comunes, incluidos EIN, cumplimiento empresarial y firma electrónica.
5. **R1.5 Client Portal & Launch:** seguimiento delegado, documentos, citas, mensajes, pagos y lanzamiento controlado.

## Releases posteriores

- **R2 — Credit Ecosystem:** crédito, monitoring, tradelines y operación especializada.
- **R3 — Taxes & Accounting:** taxes, bookkeeping y contabilidad.
- **R4 — Funding & Home Buying:** business funding y asistencia para compra de vivienda.
- **R5 — Marketplace & Partners:** marketplace, recomendaciones, partners e integraciones financieras.
- **R6 — Knowledge & Documents:** knowledge base, RAG, fuentes y ampliación del procesamiento y generación documental sobre el portal/firma existentes.
- **R7 — Communications & Automation:** canales, voice gateway, workflow engine, n8n, browser automation, colas, fallbacks y aprobaciones operativas.
- **R8 — AI Operations:** AI Hub y agentes especializados bajo human-in-the-loop.
- **R9 — Scale & Hybrid Infrastructure:** escala, homelab, nodos locales/GPU y resiliencia híbrida.
- **R10 — Mobile & Expansion:** experiencia móvil y expansiones aprobadas por evidencia; registrar nuevos módulos antes de especificarlos.

## Reglas de secuenciación

- Cloud-first; homelab e híbrido no bloquean Release 1.
- Business Formation es el primer vertical completo.
- Provider abstractions, marketplace/partners y motor de precios se reservan desde foundation sin construir anticipadamente sus releases completos.
- Cada módulo avanza por el modelo de estados y gates de [STATUS_MODEL.md](docs/roadmap/STATUS_MODEL.md).
- Ningún módulo pasa de `Registered` a trabajo ejecutable sin PRD aprobado y gates previos.
- Cada módulo completado produce un PCR y actualiza `PROJECT_STATE.md`, `PROJECT_MEMORY.md`, `DECISIONS.md` cuando corresponda y `CHANGELOG.md`.
