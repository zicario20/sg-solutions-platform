# Registro de activaciones externas pendientes

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Active living register
- Last updated: 2026-08-12
- Update rule: actualizar al aprobar una arquitectura, seleccionar un proveedor, obtener una cuenta o
  contrato, completar una prueba de activación o cambiar una dependencia externa

Este archivo registra las capacidades que pueden diseñarse y construirse con límites definitivos,
pero que no pueden declararse operativas hasta que SG Solutions tenga la entidad, cuenta, contrato,
credenciales, configuración o aprobación necesaria. Es el registro solicitado por el Product Owner
para no perder ninguna conexión pendiente durante la construcción de la plataforma.

No es un registro de secretos. Nunca se guardarán aquí API keys, tokens, números de cuenta, URLs
privadas, credenciales, documentos legales ni datos personales.

## Regla de interpretación

Cada capacidad mantiene tres dimensiones distintas:

1. **Arquitectura:** PRD, límites de dominio, datos, contratos, autorización, eventos, fallbacks y
   criterios de aceptación.
2. **Construcción local:** comportamiento implementado y verificado usando contratos, dobles de
   prueba o adaptadores inactivos autorizados; nunca respuestas falsas presentadas como reales.
3. **Activación externa:** cuenta real, acuerdo comercial, credenciales, webhooks, configuración,
   pruebas de sandbox/producción, runbook y aprobación del Product Owner.

Una arquitectura puede quedar aprobada y una implementación local puede quedar verificada mientras
la activación externa permanece diferida. Eso no convierte al módulo en `Operational`. El catálogo
mantiene el estado general definido en `docs/roadmap/STATUS_MODEL.md`; este registro añade evidencia
de readiness externa sin sustituirlo.

## Estados de activación

| Estado | Significado |
|---|---|
| `Not required` | La capacidad no necesita una conexión externa para su alcance aprobado. |
| `External activation deferred` | Falta una condición comercial, legal, de cuenta o proveedor. |
| `Activation ready` | Prerrequisitos y configuración están disponibles; falta validar/autorizar. |
| `Sandbox verified` | El contrato fue probado contra un entorno externo no productivo. |
| `Production verified` | La conexión productiva fue probada con evidencia controlada. |
| `Operational` | Runbook, monitoreo, recuperación y aceptación del Product Owner están registrados. |

## Condiciones empresariales transversales

| ID | Condición pendiente | Afecta principalmente | Trabajo permitido ahora | Evidencia para cerrar |
|---|---|---|---|---|
| BIZ-001 | Estructura legal y datos definitivos de la LLC | M032–M034, M042–M046, M076, M078, M085, páginas legales/comerciales | Arquitectura, campos configurables, contratos y contenido marcado como no aprobado | Documentos de entidad y decisión del Product Owner sobre los datos publicables |
| BIZ-002 | Cuenta bancaria y readiness financiero | M014, M043–M046 | Modelo financiero, idempotencia, reconciliación, adapters y pruebas locales | Cuenta autorizada, verificación del proveedor y prueba financiera controlada |
| BIZ-003 | Precios, depósitos, descuentos, reembolsos y políticas comerciales | M014, M021, M042–M046 | Motor configurable y modos `public`/`from`/`quote`/`consultation` sin inventar montos | Decisión registrada por servicio y evidencia de configuración |
| BIZ-004 | Contratos, licencias, seguros, disclosures y límites profesionales aplicables | M027–M040, M076, M078, M085 | Arquitectura, controles, contenido educativo y marcadores de decisión | Revisión profesional aplicable y aprobación del Product Owner |

## Canales públicos y comunicaciones

| Módulo(s) | Dependencia externa pendiente | Estado | Se completa ahora | Se difiere hasta activación | Fallback seguro |
|---|---|---|---|---|---|
| M003 Chat público | Proveedores de modelo, moderación y traducción opcional; en fases posteriores, CRM, agenda, pagos y canales internos habilitados | `External activation deferred` | PRD, UX, contrato de conversación, moderación, consentimiento, handoff, providers y pruebas locales autorizadas | Selección, presupuesto, DPA/términos de datos, región, retención/no-training, credenciales, modelos productivos, tráfico real, webhooks y pruebas operativas | Centro de ayuda, formulario y solicitud explícita de atención humana |
| M004 WhatsApp Business | Meta Business, WhatsApp Business Account, número aprobado, plantillas y webhook | `External activation deferred` | Direct Meta Cloud API adapter, contratos de canal, consentimiento, plantillas conceptuales, idempotencia y handoff | Alta/verificación de Meta, número, plantillas aprobadas y prueba real | Email/formulario/portal autorizado |
| M005 y M096 Telefonía/Voice Gateway | Twilio y número institucional, configuración STT/modelo/TTS y política de grabación/transcripción | `External activation deferred` | Twilio adapter, arquitectura de gateway, consentimiento, transferencia, herramientas limitadas y fallback | Cuenta/número/runtime aprobados, credenciales, pruebas de llamada, políticas y disclosures | Mensaje/transferencia manual y devolución de llamada |
| M006 Formularios públicos | Email/transporte productivo, CRM y destinos de consentimiento | `External activation deferred` | Esquemas, validación, anti-spam, minimización y contrato de lead | Entrega productiva, cuenta remitente, dominio y pruebas end-to-end reales | Instrucciones de contacto verificadas |
| M025–M026 Comunicaciones y notificaciones | Email, SMS y canales contratados | `External activation deferred` | Modelo unificado, preferencias, plantillas, outbox y adapters | Cuentas, remitentes, números, webhooks, deliverability y opt-out reales | Cola/manual con aviso al operador |

### Decisiones y configuración pendientes de M003

| ID | Prerrequisito | Estado | Bloquea | Evidencia para cerrar |
|---|---|---|---|---|
| CHAT-001 | Retención, eliminación y legal hold del transcript oficial | `External activation deferred` | Persistencia productiva del cuerpo del transcript | Decisión del Product Owner después de revisión Illinois/legal y pruebas de eliminación |
| CHAT-002 | Copy de privacidad, identidad automatizada, limitaciones y consentimientos de contacto/marketing | `External activation deferred` | Publicación del chat y captación de contacto | Versiones ES/EN aprobadas y registro de consentimiento validado |
| CHAT-003 | Horarios, destinos de handoff y lenguaje de expectativa/SLA | `External activation deferred` | Afirmar disponibilidad o tiempo de respuesta humano | Configuración aprobada, inbox/destino probado y fallback documentado |
| CHAT-004 | Modelo, moderación y traducción opcional: proveedor, presupuesto y términos | `External activation deferred` | Llamadas externas de IA/moderación/traducción | Selección aprobada, DPA/términos, región, retención/no-training, evals y seguridad |
| CHAT-005 | Reanudación anónima en el mismo dispositivo | `External activation deferred` | Recuperación después de cerrar el navegador | Decisión de privacidad/UX, TTL y pruebas de revocación; cross-device requiere autenticación |
| CHAT-006 | Preguntas de estado permitidas en chat autenticado | `External activation deferred` | Adaptador portal-safe de estado/tareas/documentos/citas/pago | Alcance aprobado, M007/grants y pruebas negativas de autorización |
| CHAT-007 | Enlaces seguros de pago y recibos autenticados | `External activation deferred` | Payment-link/receipt adapter | M043–M045 activos, quote/service order/precio autorizado, expiración e idempotencia probadas |

### Decisiones y configuración pendientes de M004

| ID | Prerrequisito | Estado | Bloquea | Evidencia para cerrar |
|---|---|---|---|---|
| WA-001 | Selección entre Meta Cloud API directa o Business Solution Provider autorizado | `External activation deferred` | Adapter productivo y contrato/soporte operativo | Comparación de costo, soporte, portabilidad, términos/datos y decisión del Product Owner |
| WA-002 | Meta Business/WABA, identidad institucional, propietarios y recuperación | `External activation deferred` | Alta productiva del canal | Cuenta verificada, custodios/recuperación institucional y evidencia no sensible aprobada |
| WA-003 | Número, display name y coexistencia con voz/SMS/M005/M096 | `External activation deferred` | Registro/migración del número | Propiedad, carrier/capacidad, coexistencia/portabilidad y prueba controlada aprobadas |
| WA-004 | Copy ES/EN de identidad automatizada, privacidad, contacto, servicio, marketing, opt-out y re-consent | `External activation deferred` | Publicar conversación o iniciar mensajes | Versiones legales/operativas aprobadas, hashes/versiones y pruebas de evidencia/withdrawal |
| WA-005 | Plantillas iniciales, categorías, variables, destinos y versiones bilingües | `External activation deferred` | Mensajes iniciados fuera de la ruta conversacional permitida | Aprobación interna, aprobación del provider y prueba de locale/variables/links |
| WA-006 | Retención, eliminación y legal hold para mensajes, receipts, bindings y payload temporal | `External activation deferred` | Persistencia productiva del canal | Política aprobada después de revisión aplicable y pruebas de eliminación/hold |
| WA-007 | Destino del inbox, horarios, escalaciones y lenguaje de expectativa/SLA | `External activation deferred` | Confirmar handoff o disponibilidad humana | Configuración aprobada, destino probado y fallback manual documentado |
| WA-008 | Política de media entrante y activación del M011 quarantine/scan handoff | `External activation deferred` | Descargar o promover adjuntos del provider | Decisión reject-all versus PDF/JPEG/PNG, M011 activo, scanner y pruebas de cuarentena |
| WA-009 | Cadencia, quiet hours, recordatorios y límites de frecuencia | `External activation deferred` | Automatizar recordatorios/outbound programado | Configuración aprobada por propósito/zona y pruebas de retry/opt-out/no-duplicate |
| WA-010 | Alcance de status autenticado directo por WhatsApp | `External activation deferred` | Exponer estado de caso/pago/documento en mensaje | Proyección aprobada, binding de alta confianza, M007/grants y pruebas negativas; default es portal link |
| WA-011 | Campañas promocionales | `External activation deferred` | Cualquier marketing iniciado por SG Solutions | Gate separado del Product Owner, audiencia/consentimiento/copy/cadencia/disclosures aprobados |
| WA-012 | Credenciales, challenge/signature, webhook, reconciliación, costos y runbooks | `External activation deferred` | Tráfico sandbox/producción | Secret store, pruebas oficiales, monitoreo, suspensión/rotación/recovery y revisión independiente |
| WA-013 | Intake preliminar estructurado por WhatsApp | `External activation deferred` | Pedir o persistir campos M003 dentro del canal | Decisión del Product Owner, provider/DPA, aviso/consentimiento ES/EN, allowlist, TTL/eliminación, alternativa segura y pruebas negativas |
| WA-014 | Frescura y revalidación del número/contact binding | `External activation deferred` | Mensajes transaccionales o client-associated | Método/evidencia, TTL, cadencia, wrong-person/reassigned-number policy y pruebas de suspensión/revalidación aprobadas |

### Decisiones y configuración pendientes de M005/M096

| ID | Prerrequisito | Estado | Bloquea | Evidencia para cerrar |
|---|---|---|---|---|
| VOICE-001 | Proveedor oficial de telefonía, número institucional, ownership, portabilidad y recuperación | `External activation deferred` | Adapter, número y tráfico sandbox/productivo | Comparación de cobertura/costo/soporte/datos, cuenta institucional, custodios y decisión del Product Owner |
| VOICE-002 | Política aplicable de grabación y transcripción por jurisdicción | `External activation deferred` | Cualquier grabación o transcripción | Revisión aplicable, notice/consent ES/EN, configuración fail-closed y pruebas de inicio/parada; default es deshabilitado |
| VOICE-003 | Retención, eliminación, legal hold y acceso de metadata, provider-event quarantine, audio, voicemail, transcript, summary y verification evidence | `External activation deferred` | Persistencia productiva más allá de metadata operacional mínima o cuarentena técnica | Plazos por clase/finalidad, TTL de cuarentena, jobs de eliminación, permisos, auditoría, backup implications y restore/delete/hold tests |
| VOICE-004 | Proveedores y términos STT, modelo de voz y TTS | `External activation deferred` | Tráfico de audio/texto a proveedores externos | Evaluación bilingüe/latencia/costo, DPA/términos, región, retención/no-training, credenciales y decisión aprobada |
| VOICE-005 | Identidad, voz, personalidad y copy bilingüe del asistente | `External activation deferred` | Experiencia pública de llamada | Guiones ES/EN aprobados, disclosure automatizado, pronunciaciones y pruebas de comprensión/accesibilidad |
| VOICE-006 | Horarios, festivos, colas, destinos, intentos y fallback de transferencia/plataforma caída | `External activation deferred` | Afirmar disponibilidad, transferir o usar recovery del provider | Configuración aprobada, destinos allowlisted, fallback provider-level probado fuera/dentro de horario; M096 no persiste intake/transcript/recovery envelope |
| VOICE-007 | Método de verificación de identidad por voz y matriz purpose-to-projection | `External activation deferred` | Cualquier dato específico de cliente | Métodos/attempt limits/TTL/recovery aprobados, M007/grants y pruebas negativas; caller ID nunca basta |
| VOICE-008 | Estados coarse de caso/pago/documento/tarea que podrían hablarse | `External activation deferred` | Respuesta client-specific por voz | Proyección exacta aprobada y pruebas de autorización/minimización; default es secure portal link |
| VOICE-009 | Alcance de llamadas salientes/callbacks, consentimiento, suppression y calling windows | `External activation deferred` | Automatización outbound | Propósito/cadencia/quiet hours/opt-out/identidad aprobados y revisión aplicable; outbound deshabilitado |
| VOICE-010 | Guiones y escalación para crisis, fraude, amenazas, abuso y legal threats | `External activation deferred` | Respuestas sensibles automatizadas | Política y rutas humanas/externas aprobadas y evaluaciones; el modelo no improvisa |
| VOICE-011 | SLO y presupuesto de latencia, disponibilidad, calidad bilingüe, handoff y costo | `External activation deferred` | Selección final de proveedores y claim operativo | Métricas/umbrales aprobados y pruebas controladas con fallback/kill switch |
| VOICE-012 | Uso de audio/transcript real para QA, evaluación o entrenamiento | `External activation deferred` | Cualquier corpus real o entrenamiento | Consentimiento/finalidad/minimización/redacción/acceso/retención aprobados; default es synthetic-only |
| VOICE-013 | Campos mínimos del intake M006 permitidos por voz | `External activation deferred` | Preguntar, transmitir a STT/modelo, procesar o persistir preliminary intake de una llamada | Allowlist, purpose/consent/TTL/confirmación, provider/DPA/no-training y pruebas de rechazo/zero-propagation de campos sensibles |
| VOICE-014 | Alcance de pago por teléfono | `External activation deferred` | Cualquier captura/procesamiento financiero por voz | Decisión futura separada, PRD/ADR/compliance/gate; baseline M005 lo excluye y solo entrega enlaces escritos seguros |

### Decisiones y configuración pendientes de M006

| ID | Prerrequisito | Estado | Bloquea | Evidencia para cerrar |
|---|---|---|---|---|
| FORM-001 | Inventario Release 1A, propietarios/routing, horarios y expectativa bilingüe de respuesta | `External activation deferred` | Publicar un formulario o prometer seguimiento | Lista/copy/destinos ES/EN aprobados, owner/cola probados y fallback manual; no SLA por defecto |
| FORM-002 | Allowlist exacto de fields/options/free text y clasificación por form/purpose | `External activation deferred` | Preguntar, procesar o persistir answers públicos | Schema/version aprobados, data minimization y pruebas de rechazo de campos desconocidos/sensibles |
| FORM-003 | Modelo de publicación: configuración code-reviewed o admin publisher | `External activation deferred` | Cambiar/publicar definiciones productivas | Decisión, permisos/separation of duties, parity/hash/version audit y rollback probados; nunca arbitrary executable rules |
| FORM-004 | Copy ES/EN de privacidad, procesamiento, contacto, marketing y partner consent/withdrawal | `External activation deferred` | Captar datos/consentimiento o contactar | Versiones/purposes/hashes aprobados tras revisión aplicable y pruebas de decline/withdrawal/evidence |
| FORM-005 | Retención, eliminación y legal hold de sessions, submissions, metadata de rechazo/risk-review, respuestas Confidential aprobadas, motivo content-free de incidentes, consent, attribution, risk, scoped HMAC, idempotency y dedupe; la cuarentena raw de Highly Sensitive queda prohibida en Release 1A | `External activation deferred` | Persistencia productiva más allá del receipt técnico mínimo | Plazos/TTL por clase, jobs, permisos, backup implications y restore/delete/hold tests aprobados |
| FORM-006 | Anti-spam/rate policy, network-evidence TTL, challenge provider/cookies/fingerprinting y alternativa accesible | `External activation deferred` | Activar challenge externo o evidence ampliado | Thresholds/privacy/vendor terms/consent/fallback aprobados y pruebas de bypass, outage y accesibilidad |
| FORM-007 | Draft/resume anónimo en browser/server | `External activation deferred` | Persistir/reanudar answers antes de final submit | Fields, encryption/token, TTL, shared-device warning, revocation/deletion y pruebas aprobadas; default no persistence |
| FORM-008 | Recuperación de formularios abandonados | `External activation deferred` | Email/SMS/WhatsApp reminder o lead parcial | Consent qualifying, delay/cadence/suppression/fields/deletion y provider destinations aprobados; default disabled |
| FORM-009 | Upload público y handoff a M011 | `External activation deferred` | Mostrar/aceptar archivo o upload token público | File allowlist/size/purpose/consent, M011 quarantine/scan, expiry/deletion and incident tests; default reject-all |
| FORM-010 | Scheduling posterior al submit versus callback/redirect | `External activation deferred` | Mostrar slots o afirmar booking | Form/version allowlist, M013 activo, timezone/concurrency/fallback y receipts probados; M024 no es autoridad de booking |
| FORM-011 | Quote/payment handoff posterior al submit | `External activation deferred` | Crear link/cobro o mostrar monto/producto | Form/service allowlist, M042–M045 activos, catalog/price/copy/idempotency/reconciliation probados |
| FORM-012 | Partner/Marketplace sharing or application | `External activation deferred` | Transmitir cualquier answer a partner | Agreement, exact fields/purpose/disclosure/consent/revocation/evidence y adapter tests; default no sharing |
| FORM-013 | Attribution, cookies/consent mode, ad click IDs y conversion destinations | `External activation deferred` | External analytics/pixels/Conversion API o identifiers | Field allowlist, retention, privacy review, consent mode, payload/redaction tests; default first-party minimal only |
| FORM-014 | AI classification/summary of accepted submissions | `External activation deferred` | Enviar answers a model o usar AI output | Field allowlist, provider/DPA/region/no-training/retention, evals/human review and kill switch; default deterministic/manual |

## Identidad, agenda y pagos

### Decisiones y configuración pendientes de M007

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| IAM-001 | Proyecto Supabase, regiones/entornos, dominios, redirect allowlists y Auth configuration | `External activation deferred` | Cualquier autenticación real | Cuenta aprobada, separación dev/staging/prod, configuración exportable, redirect/callback tests y rollback |
| IAM-002 | Compatibilidad del adapter Supabase/Next con cookie opaca, vault server-side cifrado, PKCE, refresh fencing y no-store | `External activation deferred` | Implementación del boundary propuesto por ADR 011 | Spike con versiones fijadas, KMS/custody aprobado, threat review, pruebas de cookie/token/vault/cache/prefetch/replay y decisión ADR/PO si no cumple |
| IAM-003 | Remitente, dominio y plantillas transaccionales bilingües | `External activation deferred` | Invitación, verificación, recovery y alertas reales | Dominio/remitente verificado, copy ES/EN aprobado, DKIM/SPF/DMARC según aplique, ingress GET/HEAD inerte con POST/OTP explícito, scanner/prefetch/clean-redirect tests, delivery/bounce/retry test y no-secret payload review |
| IAM-004 | Google sign-in | `External activation deferred` | Mostrar/usar Google en producción | OAuth client por entorno, consent screen, exact redirect URIs, scopes mínimos, transacción browser-bound de un uso, contención de auto-link, convergencia link/conflict/revoke tests y Product Owner approval |
| IAM-005 | Staff MFA, recovery factors y sole-owner break-glass | `External activation deferred` | Acceso privilegiado productivo | TOTP/factor config, recovery-code custody, custodian named, tabletop, revoke/lost-device tests and audited runbook |
| IAM-006 | Client MFA/step-up policy | `External activation deferred` | Exigir u ofrecer MFA al cliente | Acción→assurance matrix, factor/recovery policy, copy ES/EN y positive/negative tests aprobados |
| IAM-007 | Session, remembered-session, inactivity, absolute expiry, lock and risk thresholds | `External activation deferred` | Publicar tiempos o activar enforcement productivo | Durations/thresholds approved, rate/lock/recovery/load tests, monitoring and rollback |
| IAM-008 | Account linking, duplicate/conflict and manual recovery policy | `External activation deferred` | Link/merge/recovery de identidad real | Exact evidence/actors/permissions, no-email-only tests, notification copy, audit and manual queue/runbook |
| IAM-009 | Role/permission matrix M080/M081 and M091 admin actions | `External activation deferred` | User administration and privileged portal access | Product Owner-approved matrix, separation-of-duty review, RLS/domain parity and escalation tests |
| IAM-010 | Retention/deletion of invitations, session/device/IP evidence, identity links and security events | `External activation deferred` | Persistencia productiva de metadata sensible | Periods, legal hold/deletion authority, minimization, backup impact and deletion/restore tests approved |
| IAM-011 | Account closure, export, reactivation and regulated-record retention | `External activation deferred` | Mostrar closure/export controls | Policy/legal review, exact projection, step-up, async job, audit and safe-download/deletion tests |
| IAM-012 | Phone verification/OTP and purpose-specific use | `External activation deferred` | Enviar OTP o usar teléfono en recovery/MFA | Provider, consent/purpose, E.164/VoIP policy, rate/abuse/reassigned-number tests and fallback approved |
| IAM-013 | Risk/CAPTCHA provider and accessible alternative | `External activation deferred` | Adaptive challenge in production | Provider/data/DPA review, field allowlist, thresholds, accessibility alternative, outage and false-positive tests |
| IAM-014 | Security telemetry, incident alerts and coarse device/location evidence | `External activation deferred` | Claims of detection/alerts and retained telemetry | Event schema, redaction tests, retention/view permissions, destinations, alert runbook and Product Owner approval |

### Decisiones y configuración pendientes de M008

M008 no necesita un proveedor propio, pero depende de políticas y proyecciones de módulos todavía
no activados. Estas filas conservan cada decisión para que una arquitectura aprobada no se confunda
con un dashboard operativo ni se complete con supuestos.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| DASH-001 | Vocabulario público de estados, mapping interno y copy ES/EN | `External activation deferred` | Mostrar estados de servicio/caso | Matriz versionada aprobada por Product Owner, revisión de significado y parity tests |
| DASH-002 | Ventanas `due soon`/`imminent`, prioridades de workflow y política final de desempate | `External activation deferred` | Activar el motor de `PriorityAction` | Política versionada aprobada y matriz determinista/edge-case tests |
| DASH-003 | Montos, saldos y detalles de factura permitidos en el resumen | `External activation deferred` | Mostrar datos financieros en Home | Campos M014 aprobados, autorización, reconciliación/freshness y pruebas de minimización |
| DASH-004 | Nombre/contacto del responsable visible al cliente | `External activation deferred` | Mostrar asesor o disponibilidad | Política de asignación/contacto, copy y pruebas de privacidad/cambio de responsable |
| DASH-005 | Defaults, dismissal y canales de notificaciones | `External activation deferred` | Avisos o promesas de entrega | Política M026 y consentimiento aprobados, plantillas ES/EN, retries/fallbacks probados |
| DASH-006 | Freshness/staleness por sección y copy `partial/unconfirmed` | `External activation deferred` | Mostrar o accionar sobre información stale | Presupuestos aprobados, clock/reconciliation tests, acciones deshabilitadas y copy ES/EN |
| DASH-007 | Experiencia de prospecto autenticado sin relación activa | `External activation deferred` | Cualquier dashboard para registered prospect | Alcance y autorización aprobados; default R1A es no crear dashboard/caso/acceso |
| DASH-008 | Contextos de representante/household y delegación | `External activation deferred` | Activar context switch adicional | Policy M007/IAM, evidencia de relación, grants/revocation y pruebas cross-context |
| DASH-009 | Preferencias de widgets/orden | `External activation deferred` | Persistir personalización | Campos/ownership/TTL aprobados, migración compatible y accesibilidad probada |
| DASH-010 | Recomendaciones o cross-sell contextual | `External activation deferred` | Mostrar ofertas en Home | Consent/disclosures/relevancia/suppression y tracking minimizado aprobados; ausente en R1A |
| DASH-011 | Staff `view as client` | `External activation deferred` | Proyección de soporte | Roles, reason, TTL, banner, read-only deny matrix y auditoría aprobados |
| DASH-012 | Eventos de analytics, retención y acceso a métricas | `External activation deferred` | Emitir telemetría del dashboard | Allowlist/redaction/retention/view policy y tests sin PII/contenido |
| DASH-013 | Canales, horario y promesa de respuesta de soporte | `External activation deferred` | Publicar disponibilidad o SLA | Canales operativos y copy ES/EN aprobados; default sin promesa temporal |
| DASH-014 | Máximo/orden de cards y previews en Release 1A | `External activation deferred` | Congelar densidad/layout final | Pruebas UX con datos sintéticos, decisión Product Owner y contratos de límites |

### Decisiones y configuración pendientes de M009

M009 no activa un proveedor directo. Estas filas controlan la política comercial, de acceso y
presentación que debe existir antes de mostrar servicios reales; arquitectura y pruebas sintéticas
no prueban operación ni autorizan `GENERATE`.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| MYSVC-001 | Mapping público de combinaciones comercial, financiera, aprobación humana y fulfillment, con copy ES/EN coordinado con M008/M010 | `External activation deferred` | Mostrar estado de servicio real | Matriz versionada aprobada, parity/semantic review y pruebas cartesianas que preserven pago ≠ aprobación ≠ inicio y la coexistencia de cancelación de orden/pago/caso, refund y dispute |
| MYSVC-002 | Estados preliminares visibles antes de existir `CaseFile` | `External activation deferred` | Mostrar quote/payment/review preliminar en Mis servicios | Estados y grant path aprobados; pruebas que interés/form/chat/recommendation no crean servicio |
| MYSVC-003 | Inventario Release 1A y milestones públicos versionados por tipo de servicio | `External activation deferred` | Publicar progreso o detalle por vertical | ServiceDefinition/workflow versions, milestones/copy ES/EN y pruebas de historia/no porcentaje falso |
| MYSVC-004 | Orden, filtros, search fields, page size y límites de previews | `External activation deferred` | Congelar directory query/layout | UX tests con datos sintéticos, límites/paginación aprobados y hidden-count/cursor tests |
| MYSVC-005 | Campos financieros permitidos en M009 versus M014 | `External activation deferred` | Mostrar precio, depósito, saldo, factura o refund | Field allowlist, autorización, reconciliación/freshness y pruebas de minimización aprobadas |
| MYSVC-006 | Equipo o persona responsable visible y política de contacto/reasignación | `External activation deferred` | Mostrar responsable/disponibilidad | Roles/copy/privacy/availability aprobados y pruebas de reassignment/stale contact |
| MYSVC-007 | Solicitud de cancelación o cambio de servicio | `External activation deferred` | Mostrar un control de cancel/change | Elegibilidad, reviewer, reasons, consecuencias, audit y copy/resultados ES/EN aprobados; default support-only |
| MYSVC-008 | Servicios recurrentes, renovación, auto-renewal y cancelación | `External activation deferred` | Mostrar renewal/subscription controls | Billing/catalog/consent policy, reminder/suppression, Stripe readiness y pruebas de failure/cancel aprobadas |
| MYSVC-009 | Entregables/acuerdos, revocación y retención | `External activation deferred` | Mostrar disponibilidad o enlace de documento/firma | M011/M067 activos, grants/assurance, retention/revocation/download audit y copy aprobados |
| MYSVC-010 | Eventos y reason codes client-safe para preview/timeline | `External activation deferred` | Mostrar historial de servicio | Allowlist/public mapping M010, privacy review y negative tests de notas/risk/technical events |
| MYSVC-011 | Participantes, spouse/household/business member/representative y delegación | `External activation deferred` | Mostrar/switch context o compartir servicio | Relationship evidence, explicit grants, expiry/revocation, notification and cross-context tests approved |
| MYSVC-012 | Partner/referral status visible en related products | `External activation deferred` | Mostrar partner/referral en M009 | Partner activo, source/freshness, consent/disclosure/no-guarantee copy y unknown/fallback tests |
| MYSVC-013 | Soporte, horarios y cualquier promesa de respuesta | `External activation deferred` | Publicar disponibilidad o SLA | Canal operativo, horario/capacidad y copy ES/EN aprobados; default sin promesa temporal |
| MYSVC-014 | Analytics M009, retención y acceso | `External activation deferred` | Emitir telemetría de directory/detail | Event allowlist, redaction/no-identifiers, retention/view policy y payload tests aprobados |
| MYSVC-015 | Freshness/staleness y copy partial/unconfirmed por sección | `External activation deferred` | Accionar sobre o presentar datos stale | Budgets por owner, final-fence/reconciliation tests, disabled-action rules y copy ES/EN aprobados |

### Decisiones y configuración pendientes de M010

M010 no activa un proveedor directo. Estas filas controlan la política de presentación del proceso
y deben resolverse antes de mostrar hechos reales; los defaults documentales fallan cerrados y no
inventan fechas, estados, actores ni garantías.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| PROC-001 | Vocabulario público, matriz de cuatro dimensiones y copy ES/EN | `External activation deferred` | Publicar el estado actual | Matriz versionada aprobada, revisión semántica bilingüe y pruebas de combinaciones/unknown que preserven pago ≠ aprobación ≠ fulfillment |
| PROC-002 | Servicios Release 1A, eligibility policy y milestone sets aceptados | `External activation deferred` | Activar proceso por vertical | Inventario, accepted definition/workflow criteria, policy version, pre-pagination eligibility tests y pruebas de historia/no porcentaje falso aprobados |
| PROC-003 | Allowlist de eventos/reasons públicos, correcciones y retención | `External activation deferred` | Publicar timeline | Event/mapping versions, privacy review, correction/retraction tests y retención aprobadas |
| PROC-004 | Categorías de responsable y nombres staff/partner visibles | `External activation deferred` | Mostrar quién tiene el próximo paso | Field/copy allowlist, privacidad, reassignment/freshness tests aprobados |
| PROC-005 | Prioridad/ties/conflictos del próximo paso local | `External activation deferred` | Mostrar acción definitiva | Política alineada con M008, source registry y pruebas de missing/outranking source aprobadas |
| PROC-006 | Categorías, prioridad y detalle público de blockers | `External activation deferred` | Mostrar bloqueos | Taxonomía/copy/visibility y negative tests de notas/reasons internos aprobados |
| PROC-007 | Deadlines/estimates, provenance, expiry y disclaimers | `External activation deferred` | Mostrar fechas no factuales | Source/jurisdiction/range policy, freshness y no-guarantee copy ES/EN aprobados |
| PROC-008 | Lenguaje de delay/on-hold, escalamiento y expectativas de respuesta | `External activation deferred` | Publicar promesa o ruta de escalamiento | Capacidad/canal/SLA policy y semantic review aprobados; default sin SLA |
| PROC-009 | Historia de completed/cancelled/reopened/restarted | `External activation deferred` | Mostrar estados terminales/reapertura | Reglas de owner, timeline/correction y pruebas de no-overwrite aprobadas |
| PROC-010 | Campos de payment/invoice/refund permitidos en M010 versus solo M014 | `External activation deferred` | Mostrar referencia, monto, saldo, depósito, due date, método, recibo o refund detail | Field allowlist, grants, reconciliation/freshness, unavailable≠paid y minimización aprobadas; default solo semantic state + freshness + M014 route |
| PROC-011 | Nombres, estados y provenance de partners/terceros | `External activation deferred` | Mostrar dependencia externa | Partner activo, consent/disclosure, source/freshness y no-guarantee tests aprobados |
| PROC-012 | Tareas: prioridad, due/overdue e historial completado | `External activation deferred` | Mostrar resumen de tareas | M023 mapping, route/authorization y copy ES/EN aprobados |
| PROC-013 | Campos públicos de documentos, entregables, conversación segura, firmas y citas | `External activation deferred` | Mostrar summaries/handoffs | Allowlists M011–M013/M067, grants, minimization, stale/failure and route tests approved |
| PROC-014 | Alcance Help Center/IA y fallback humano | `External activation deferred` | Activar explicación contextual | Knowledge scope, permissions, evals/redaction y soporte operativo aprobados |
| PROC-015 | Analytics M010, viewers, retention y freshness budgets | `External activation deferred` | Emitir telemetría o usar stale facts | Event/source allowlists, no-identifiers, retention/view/freshness policies y payload tests aprobados |
| PROC-016 | Disambiguador seguro bilingüe para instancias repetidas del mismo servicio/contexto | `External activation deferred` | Mostrar selector inequívoco cuando existen órdenes repetidas | Field/copy key allowlist, privacy/semantic/a11y review y tests same-label EN/ES sin IDs internos aprobados |

### Decisiones y configuración pendientes de M011

M011 no activa Storage, scanner, OCR, firma, canales ni partners. Estas filas controlan los límites
que deben resolverse antes de aceptar archivos reales; el default documental rechaza o mantiene en
cuarentena y nunca confunde seguridad, recepción, revisión, visibilidad o finalización.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| DOC-001 | Allowlist PDF/JPEG/PNG, 25 MiB, páginas/imágenes y cuotas | `External activation deferred` | Aceptar cualquier archivo real | Matriz tipo/limit/parser versionada, threat review, UX ES/EN y pruebas de spoof/polyglot/bomb/oversize; HEIC/Office siguen fuera |
| DOC-002 | Estados/reglas de solicitudes/checklists, required/waived y due dates | `External activation deferred` | Publicar solicitudes reales | State graph, template/version owner, due authority, reminders y pruebas de no-auto-completion aprobados |
| DOC-003 | Vocabulario/copy público de upload, seguridad, revisión, corrección y rechazo | `External activation deferred` | Mostrar estado/razón al cliente | Codes/reasons allowlist, semantic/legal/privacy review ES/EN y negative tests de scanner/internal detail |
| DOC-004 | Matriz de tipo/categoría/clasificación y metadata visible | `External activation deferred` | Mostrar títulos, filename, versión o source | Field allowlist, classification mapping, redaction, locale y tests de metadata/no-hidden-context aprobados |
| DOC-005 | Categorías Highly Sensitive con grant directo y step-up | `External activation deferred` | Heredar/leer/descargar contenido sensible | Category/assurance matrix, staff/client roles, RLS/Storage/final-fence tests y access audit aprobados |
| DOC-006 | TTL y semántica de upload intent, resumable/multiple, cuotas/cancel y duplicados | `External activation deferred` | Emitir capacidad de upload | Expiry/count/concurrency/idempotency/CAS policy, interruption/cancel tests y scoped no-cross-client duplicate UX |
| DOC-007 | Malware scanner, versión/región, retry/excepción y quarantine/orphan TTL | `External activation deferred` | Promover objeto de cuarentena | Provider/DPA/security review, signed verdict contract, outage/timeout/malware/manual recovery and cleanup tests |
| DOC-008 | Preview/download, signed URL TTL, watermark, headers, reauth y bulk export | `External activation deferred` | Mostrar preview o descargar | Field/action/assurance policy, CSP/sandbox/Content-Disposition, URL leakage/expiry/revocation tests y audit semantics |
| DOC-009 | Roles y segregación para review/accept/correction/reject/classification/visibility | `External activation deferred` | Decidir uso/visibilidad documental | Permission matrix, expected-version/two-person rules, client/internal comment separation y audit tests |
| DOC-010 | Current/superseded history y reuse/linking multi-context | `External activation deferred` | Reemplazar/reutilizar documento | Lineage/current-pointer policy, context-link authorization, CAS races, classification/no-cross-context tests |
| DOC-011 | Comentarios client/internal/compliance y copy/notificación | `External activation deferred` | Publicar comentario/razón | Separate field/permission schema, copy allowlist, notification fallback and negative serialization tests |
| DOC-012 | Retention, deletion, legal hold, backup purge y quarantine/orphan cleanup | `External activation deferred` | Eliminar/purgar/retener archivo real | Illinois/legal review, periods/authorities, hold/delete/backup/restore/orphan runbooks and tests |
| DOC-013 | Upload temporal para prospecto/tercero | `External activation deferred` | Emitir enlace sin portal | Identity/purpose/consent/expiry/count/revocation policy, no-list/read capability and abuse tests |
| DOC-014 | Ingesta email/WhatsApp/chat/partner | `External activation deferred` | Descargar/promover attachment de canal | Channel/type/consent/source allowlist, same quarantine pipeline, provider tests y secure-portal fallback |
| DOC-015 | M065 OCR/extraction/quality y AI/redaction | `External activation deferred` | Procesar/enviar contenido a modelo | Processor/DPA/region/version, field/retention/redaction/confidence/human-validation policy and evals |
| DOC-016 | M066 generación, templates, input snapshot y approval | `External activation deferred` | Generar/publicar documento | Template/version ownership, input provenance, draft/final review, hash and negative publication tests |
| DOC-017 | M067 firma electrónica y evidencia | `External activation deferred` | Enviar/finalizar firma | Provider/DPA, eligible types, signer/order/auth/reminder/certificate/retention and obsolete-version tests |
| DOC-018 | Sharing con partners/terceros | `External activation deferred` | Compartir/exportar documento | Contract, purpose, recipient, consent, allowlist, expiry/revocation/delivery evidence and audit tests |
| DOC-019 | Analytics/métricas operativas M011 | `External activation deferred` | Emitir telemetría | Event/viewer/retention allowlist, zero-content/filename/ID payload tests and PostHog disabled-default proof |
| DOC-020 | Notificaciones M011, canales, preferencias y timing | `External activation deferred` | Enviar aviso documental | Event/copy/channel/preference policy, no-PII payload, durable-state ordering and failure/fallback tests |

### Decisiones y configuración pendientes de M012

M012 no activa proveedores, IA, notificaciones ni canales externos. Estas filas controlan las
políticas necesarias antes de aceptar conversaciones reales; el default documental es mensajería
humana, texto plano limitado, adjuntos deshabilitados y ninguna promesa de respuesta.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| MSG-001 | Tipos/motivos de conversación y contextos account/service/case donde cliente o staff pueden iniciar | `External activation deferred` | Crear conversación real | Matriz de eligibility/root/grant, copy ES/EN y pruebas de no-case-data desde account support aprobadas |
| MSG-002 | Lifecycle/responsibility, cierre/reapertura e inactividad | `External activation deferred` | Publicar estados o permitir transiciones | State graphs, actores, timers, CAS/idempotency y semantic parity tests aprobados |
| MSG-003 | Representantes/participantes delegados | `External activation deferred` | Añadir participante distinto al cliente invitado | Relationship evidence, explicit grants, expiry/revocation/notification y cross-context tests aprobados |
| MSG-004 | Edición/retiro de mensajes | `External activation deferred` | Mostrar edit/withdraw | Ventana, contenido inelegible, immutable revisions/reasons, retention/hold y race tests aprobados; default immutable |
| MSG-005 | Tipos/permisos de notas internal/compliance | `External activation deferred` | Crear o revisar nota privada real | Role/assurance/two-person matrix, separate DTO/event/UI y negative client/channel serialization tests |
| MSG-006 | Límites de texto/rate/spam y enlaces externos | `External activation deferred` | Aceptar texto/link real | Byte/character/line/rate policy, Unicode/XSS/phishing/open-redirect/no-unfurl tests y copy ES/EN aprobados |
| MSG-007 | Propósito/cantidad de adjuntos y gates M011 | `External activation deferred` | Mostrar `Attach securely` | DOC policies activas, intent/context binding, scan/authorization/failure tests y no-byte/no-signed-URL proof |
| MSG-008 | Sensibilidad, clasificación, grant directo y step-up | `External activation deferred` | Leer/enviar conversaciones tax/credit/identity/security/legal | Category/assurance/role matrix, envelope encryption, RLS/final-fence and access-audit tests approved |
| MSG-009 | Colas, roles, routing/asignación, prioridad, tags, escalation y recovery | `External activation deferred` | Operar inbox/assignment/prioridad/tags reales | Queue ownership, priority bands/ties/change authority, tag taxonomy, human/rule/AI-suggestion acceptance, conflicts, CAS, coverage/manual recovery y no-global-staff-access/no-ungated-tag tests aprobados |
| MSG-010 | IA autenticada, knowledge/tools, evals y handoff | `External activation deferred` | Permitir respuesta de IA | Model/provider/DPA, context/tool allowlist, prompt-injection/evals, human-takeover race y fallback approved; default human-only |
| MSG-011 | Plantillas bilingües y variables | `External activation deferred` | Enviar template real | Version/approval/expiry/variable allowlist, no-sensitive interpolation and ES/EN tests approved |
| MSG-012 | Traducción asistida | `External activation deferred` | Enviar transcript a traductor/modelo | Provider/DPA/region/data-class review, provenance/original preservation, human review and restricted-term tests |
| MSG-013 | Eventos/canales/preferencias/quiet hours de notificación | `External activation deferred` | Enviar aviso fuera del portal | M026 policy, content-free/direct-contact-PII-free copy, purpose-bound opaque recipient/event refs only, consent/preferences, ordering/retry/fallback and schema rejection tests approved |
| MSG-014 | Horario, first-response/resolution objectives y SLA | `External activation deferred` | Publicar disponibilidad o promesa temporal | Capacity/coverage/escalation evidence, monitoring and copy ES/EN approved; default no time promise |
| MSG-015 | Retention, hold, redaction, export y deletion | `External activation deferred` | Retener/exportar/redactar/purgar transcript real | Illinois/legal review, periods/authorities, immutable evidence, backup/restore and incident tests approved |
| MSG-016 | Read receipts y typing/presence | `External activation deferred` | Mostrar que staff/client leyó o escribe | Exact evidence/privacy/expiry/copy, reconnect/race and accessibility tests; default hidden |
| MSG-017 | Search/indexing/encryption | `External activation deferred` | Buscar body o indexar transcript | Field/role/retention design, key/search leakage threat review, cross-client tests; default metadata-only |
| MSG-018 | M092/PostHog product analytics y reporting M012 | `External activation deferred` | Emitir analytics de producto/reporting a M092/PostHog | Event/viewer/retention allowlist, zero-body/subject/ID/DOM/session-replay payload tests and PostHog disabled-default proof; M097 operational/security telemetry remains separately governed |
| MSG-019 | Continuidad portal/chat/WhatsApp/call/email | `External activation deferred` | Vincular o copiar conversación entre canales | Identity/contact evidence, purpose/consent, explicit link/unlink, no-auto-merge and protected-copy tests approved |
| MSG-020 | Abuse/blocking/complaint/security escalation | `External activation deferred` | Bloquear contacto o ejecutar incident path | Reason/role/scope/appeal policy, threat handling, evidence minimization, channel impact and runbook tests approved |

### Decisiones y configuración pendientes de M013

M013 no activa Google Calendar, proveedores de reuniones, recordatorios, pagos ni citas reales. Las
siguientes filas controlan una a una las políticas necesarias antes de un Build o activación; el
default documental es agenda interna/manual, sin calendario externo, sin dirección pública, sin
round-robin, sin pago para citas, sin analytics de producto y sin autoridad de IA.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| APT-001 | Tipos Release 1A, nombres ES/EN, duración, buffers, modalidades y audience | `External activation deferred` | Publicar tipo o derivar slots reales | Type/version matrix, localized copy, eligibility/modality and buffer tests approved |
| APT-002 | Quién reserva, verificación y representantes; herencia service/case | `External activation deferred` | Reservar/leer/gestionar cita real | Identity/grant/representative matrix, expiry/revocation and cross-client/IDOR tests approved |
| APT-003 | Business hours, zona base, holidays/closures/vacation/emergency blocks | `External activation deferred` | Publicar disponibilidad real | Approved schedule/exception sources, versioning, DST/closure and manual-block tests |
| APT-004 | Minimum notice, horizon, slot granularity, hold y receipt TTL | `External activation deferred` | Crear hold o confirmar slot | Trusted-time policy, capacity/expiry/idempotency/concurrency tests and ES/EN copy |
| APT-005 | Cancel/reschedule windows, limits, late/no-show, reasons y override | `External activation deferred` | Mostrar/ejecutar change/no-show | State/actor/version/reason/exception matrix, atomic reschedule and audit tests |
| APT-006 | Intake/document/manual approval/payment prerequisites | `External activation deferred` | Confirmar cita con requisito | Owner-evidence contracts; decisión retained-capacity+deadline vs release+fresh hold; duplicate/out-of-order/expiry/race and no-payment/no-service implication tests |
| APT-007 | Public fields, consent/verification y prospect management capability | `External activation deferred` | Aceptar booking público o habilitar gestión sin portal | Scheduling-only M020/M078 reservation/finalization; code format/entropy + purpose-keyed HMAC/pepper/key rotation + distributed attempt controls; opaque contact+short-TTL encrypted vault ref→M026 scoped delivery→no-store POST→host-only session; DPA/provider retention/wrong-recipient/forwarding/retry/expiry/purge/backup and zero-URL/log tests |
| APT-008 | Staff/team eligibility, visible identity, assignment/round-robin y override assurance | `External activation deferred` | Asignar/mostrar staff o activar capacity routing | Role/credential/language/capacity rules, conflict/override evidence and no-leak tests; default manual |
| APT-009 | Google calendars/directions/scopes/account, conflict policy, watch, sync horizon y alias staff-facing no-PII | `External activation deferred` | Leer busy o proyectar evento | Per-source calendar/query/cursor/coverage allowlist and independently reviewed alias copy that cannot echo email/ID/URI; OAuth session/account binding; pending-watch ID/token/request then authenticated response resource bind; raw URI minimization, Google 410/full pagination, sync-before-response, recurrence, renewal, dropped notice, restore and disconnect tests |
| APT-010 | Confirmations/reminders: event, timing, channel, quiet hours, preference y copy | `External activation deferred` | Enviar aviso real | M026 consent/preference/template policy; maximum proposed payload generic appointment label + instant + display zone; tests reject type/service/case/staff/note/contact/meeting-management link, enforce idempotency/suppression/fallback |
| APT-011 | Phone responsibility, Meeting provider activation/link window e in-person location | `External activation deferred` | Publicar modalidad/instrucción real o conectar tráfico Meeting | Phone-default policy; provider/location/accessibility copy; Meeting account ownership, env separation, exact API permissions/scopes where applicable, credential custody/rotation, DPA/terms/retention, sandbox-to-prod rehearsal, monitoring/rollback; vault/JIT launch exact HTTPS origin/path, authorization, history exposure, gate-off cleanup and outage fallback evidence; modality copy alone cannot activate traffic |
| APT-012 | CRM/service/case linkage, activities, outcomes y follow-up | `External activation deferred` | Crear owner handoff/action | Closed result/next-action/tag codes, human review, typed at-least-once delivery + owner inbox/idempotency for one logical effect; duplicate/out-of-order/crash/no-free-text/no-auto-service tests |
| APT-013 | Appointment/client-specific instructions/notes, internal/compliance notes y AI summary/transcript | `External activation deferred` | Persistir/publicar contenido específico de la cita | Separate from generic APT-001/011 type/modality copy; owner/DTO/event rules, human review, encryption/retention and negative serialization tests |
| APT-014 | External event/ICS title/body/attendees/organizer/update copy/confidentiality | `External activation deferred` | Crear evento/invitación/ICS externo | Default zero attendees + provider mail suppressed; coordinated APT-010 invitation owner/consent/wrong-recipient semantics; generic no-store non-revocable ICS allowlist and injection/provider-payload tests |
| APT-015 | Retention/deletion/hold para cita, hold, token, cursor, reminder, note, audit, intervalos `external_busy`, coverage y source projection | `External activation deferred` | Retener/purgar datos reales o patrones de disponibilidad del staff | Illinois/legal review, periods/authorities, backup expiry/purge, restore/provider-deletion, export/telemetry exclusion and legal-hold tests |
| APT-016 | M092/PostHog analytics y appointment reporting | `External activation deferred` | Emitir analytics de producto | Metric/viewer/field/retention allowlist, zero-contact/time/token/DOM/session-replay tests; default off |
| APT-017 | Rate/CAPTCHA/verification y abuso de booking/cancel | `External activation deferred` | Aplicar bloqueo/review | Threshold/scope/duration, purpose-keyed network digest/TTL, provider sharing, distributed attempts, NAT/shared IP, no raw IP/device analytics, review/deletion/appeal and false-positive tests |
| APT-018 | No-availability callback/alternate/human/waitlist | `External activation deferred` | Publicar fallback o waitlist | Priority/fields/consent/notification/expiry policy and no-SLA/no-invented-slot tests |
| APT-019 | Herramientas de agenda por agente IA | `External activation deferred` | Permitir AI scheduling action | Agent/action/type allowlist, explicit confirmation, tool receipt, eval/handoff and no-invention tests |
| APT-020 | Activación productiva Google Calendar | `External activation deferred` | Conectar cuenta/calendario/push real | Account ownership; env/OAuth session/account/scope/callback binding; secrets/rotation; HTTPS endpoint; channel-token custody/renewal; dropped-notification monitoring; sync/reconciliation rehearsal and rollback approved |

### Decisiones y configuración pendientes de M014

M014 no activa precios, Stripe, Checkout, facturas, cobros, reembolsos, disputas, impuestos,
notificaciones ni registros financieros reales. Las filas siguientes controlan una a una la política,
seguridad y activación necesarias. El default documental es cotización/registro pendiente y revisión
manual: ningún retorno, captura, cliente, agente o empleado puede fabricar una confirmación Stripe.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| PAY-001 | Inventario Release 1A de servicios, modos canónicos `public|from|quote|consultation`, line items y publicación independiente | `External activation deferred` | Mostrar monto/precio o crear obligación real | Service/price/version matrix, owner/type of every fee, exact-enum/alias-rejection tests, off-by-default per-service approval/publication evidence, integer-money and no-hardcode tests |
| PAY-002 | Validez, términos, aceptación, supersession y cancelación de cotizaciones | `External activation deferred` | Enviar/aceptar quote real | ES/EN terms/disclosure versions, actor/capability/expiry/version evidence and stale/race/idempotency tests |
| PAY-003 | Depósito/saldo: monto o fórmula, refundability y qué habilita | `External activation deferred` | Cobrar/mostrar depósito o satisfacer prerequisite | Per-service policy, pre-payment copy, allocation/service-prerequisite matrix and tests proving deposit ≠ approval/start |
| PAY-004 | Numeración, emisión, vencimiento, void/uncollectible y documento de invoice | `External activation deferred` | Emitir/mostrar invoice real | Numbering/immutability/terms/locale/document-access policy and duplicate/void/restore tests |
| PAY-005 | Descuentos, cupones, promociones y waivers; autoridad y límites | `External activation deferred` | Aplicar ajuste o publicar promoción | Eligibility/use/expiry/amount/role/approval/reason matrix and tamper/concurrency/audit tests |
| PAY-006 | Refund/void: elegibilidad, razones, límites, doble aprobación e impacto | `External activation deferred` | Solicitar/aprobar/enviar refund o cambiar entitlement | Policy/role/amount/service-impact matrix, separation-of-duty, idempotency, uncertain-response and provider-confirmation tests |
| PAY-007 | Disputas: ownership, evidencia, lenguaje y decisiones sobre servicio | `External activation deferred` | Operar o mostrar dispute | Finance/compliance roles, evidence/retention/client-copy and no-auto-fraud/no-auto-sanction tests |
| PAY-008 | Métodos externos, evidencia, reviewer, separación de funciones y appeal | `External activation deferred` | Registrar/confirmar efectivo/cheque/transferencia/partner | Allowed-source/evidence/independent-verification matrix, fraud/rejection/appeal and no-Stripe-label tests |
| PAY-009 | Métodos, moneda/geografía Release 1A, Customer reuse y Customer Portal | `External activation deferred` | Habilitar moneda/geografía/método o portal de facturación real | Exact currency/country/method allowlist, fail-closed and cross-currency rejection tests, Stripe risk/return policy, account-link/non-grant proof and lifecycle/outage tests |
| PAY-010 | Tratamiento de sales tax | `External activation deferred` | Calcular/cobrar/afirmar taxability/exemption | Revisión profesional aplicable, product/jurisdiction/configuration evidence and deterministic calculation/report tests |
| PAY-011 | LLC/banco/Stripe institucional, ownership, recuperación y ambientes | `External activation deferred` | Crear objetos o tráfico Stripe sandbox/productivo | Entity/bank/account verification, institutional custodians, least privilege, environment separation and recovery evidence |
| PAY-012 | Endpoints/eventos, API/webhook secrets, firma, rotación, replay, provider-destination policy y monitoreo | `External activation deferred` | Recibir webhook o mutar Stripe | Exact event/endpoint/version inventory with canonical-object retrieval per event, raw-body signature tests, account/environment/event and object/fact dedupe, recoverable/deterministic provider-token custody/rotation, operation-correlation lookup, exact HTTPS host/path/object handoff allowlist, idempotency-window/out-of-order/retry monitoring and rollback |
| PAY-013 | Retención, eliminación y hold de quote/invoice/transaction/webhook/idempotency/reconciliation/audit | `External activation deferred` | Retener/purgar datos financieros reales o raw incident material | Illinois/legal review, class/period/authority matrix, encrypted raw-event exception if any, exact provider-token/key-version recovery retention, backup/restore/delete/hold tests |
| PAY-014 | Campos Client/Public/Staff, masking, receipt/invoice access, freshness y copy | `External activation deferred` | Mostrar datos financieros/client DTOs reales | Field/class/role/source/freshness matrix, exact provider HTTPS host/path/object handoff policy and cross-client/minimization/no-store/open-redirect tests |
| PAY-015 | Plantillas/canales/cadencia/quiet hours/suppression y expectativa de soporte | `External activation deferred` | Enviar aviso/recordatorio real | M026 consent/preference, generic ES/EN copy, timing/retry/duplicate/suppression/privacy tests; no amount/card/service-sensitive lock-screen content |
| PAY-016 | Prospect quote/payment capability, delivery, return y account-linking | `External activation deferred` | Permitir aceptación/Checkout/estado sin portal | Separate entry/return one-resource purpose/version/use/expiry/environment/recovery capabilities; inert GET/HEAD; explicit POST/OTP + Origin/Fetch-Metadata/CSRF bootstrap; host-only session; clean redirect/history/no-referrer and edge-log/analytics/cache/service-worker redaction; scanner/prefetch/forwarding/replay/concurrency/provider-exposure/recovery/no-grant tests |
| PAY-017 | Payment plans/subscriptions Release 1B | `External activation deferred` | Crear cuota, recurring charge, renewal o dunning | Eligibility/schedule/fee/authorization/retry/grace/cancel/refund/notice/entitlement policy and lifecycle tests |
| PAY-018 | Tarifas gubernamentales/proveedor: cobro, custodia, pago y evidencia | `External activation deferred` | Cobrar/pagar filing/provider fee | Approved model per workflow, authorization/custody/accounting/disclosure/evidence and no-card-by-channel tests |
| PAY-019 | Referral/partner commission/payment separation | `External activation deferred` | Mostrar/cobrar/pagar comisión o atribuir partner | Contract/disclosure/consent/statement/attribution/accounting matrix and tests separating client payment from commission |
| PAY-020 | Readiness productiva Stripe | `External activation deferred` | Declarar M014/M043–M045 Operational | Sandbox contract/security/reconciliation/restore-cutover (events on both sides), lost-response/idempotency-expiry/ambiguous-correlation, incident/monitoring/rollback runbooks, independent review and Product Owner-approved controlled live payment |

### Decisiones y configuración pendientes de M015

M015 no activa campos, perfiles, proveedores, IA, cifrado ni datos reales. Estas filas controlan el
alcance y las políticas necesarias antes de un Build. El default documental recopila nada: ningún
rol, relación, caso, documento, proveedor o agente recibe un perfil completo ni convierte una
sugerencia en dato verificado.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| PFL-001 | Propósito(s), secciones y campos Release 1A; required/optional/prohibited | `External activation deferred` | Crear campo/perfil/requirement real | Inventory versionada por servicio/propósito, clasificación, validación y minimization review; tests de no-overcollection |
| PFL-002 | Ruta, label y ubicación de Perfil en navegación | `External activation deferred` | Crear/publicar ruta o navegación | IA ES/EN, role/route authorization, mobile/a11y tests y Product Owner visual approval |
| PFL-003 | Campos editables inmediatos vs propuesta/revisión/evidencia | `External activation deferred` | Aceptar cambio real | Field-class/quality/actor matrix, immutable revision/CAS/idempotency and no-silent-overwrite tests |
| PFL-004 | Roles, assignment, purpose y field-class staff access; segregation | `External activation deferred` | Leer/revisar/verificar datos reales por staff | Permission/resource/purpose/assurance matrix, RLS/final-fence/cross-client and two-person tests where required |
| PFL-005 | Household/dependent/spouse/co-applicant/representative scope | `External activation deferred` | Crear/vincular/mostrar persona relacionada | Identity/relationship/consent/grant/expiry/revocation matrix and cross-person/no-inference tests |
| PFL-006 | Business relationship, ownership/effective periods y M015/M019 edit boundary | `External activation deferred` | Crear/vincular/editar perfil empresarial | Canonical organization/relationship authority, matching/review, ownership-period constraints and cross-business tests |
| PFL-007 | Verification methods, reviewers, evidence, expiry y two-person rules | `External activation deferred` | Marcar hecho verified/document-supported | Method/policy/version/evidence/role matrix and false-verification/expiry/revocation tests |
| PFL-008 | Conflict materiality, reviewer, resolution y client outcome | `External activation deferred` | Resolver conflicto real | Typed comparison rules, immutable competing revisions, reason/copy and race/audit tests |
| PFL-009 | Freshness periods and expiry behavior by purpose/field/source | `External activation deferred` | Treat data as current or satisfy requirement | Versioned freshness matrix, mid-process expiry policy and stale/missing/no-zero tests |
| PFL-010 | Completeness rules, percentage/copy and visibility | `External activation deferred` | Show completion/result | Purpose/field/quality policy, no-eligibility/no-pressure semantics and incomplete-source tests |
| PFL-011 | Deterministic calculations, units/currency/rounding/disclaimers | `External activation deferred` | Calculate/display income normalization, DTI or other metric | Formula/version/input-quality matrix and deterministic/missing/currency/rounding tests; no approval inference |
| PFL-012 | Sensitive reveal, reauthentication, roles, duration and display/export controls | `External activation deferred` | Decrypt/show full protected value | Assurance/action/TTL/copy policy, backend mask, no-DOM/no-cache and enhanced audit tests |
| PFL-013 | KMS/key custody, rotation/recovery and exact encrypted fields | `External activation deferred` | Persist any app-encrypted field | Approved ADR 005 provider/custodians, envelope/rotation/backup/plaintext-absence and KMS-outage tests |
| PFL-014 | Retention, deletion, legal hold, history/conflict and backup expiry | `External activation deferred` | Retain/purge real profile data | Illinois/federal/legal review, class/period/authority matrix and delete/hold/restore/crypto-shred tests |
| PFL-015 | Client export scope, exclusions, format, delivery and third-party treatment | `External activation deferred` | Generate/deliver export | Reauth/field/recipient/TTL/redaction policy, M011 delivery, forwarding/revocation/audit tests |
| PFL-016 | Consent/purpose for prefill, secondary service reuse, household/business, AI and partner disclosure | `External activation deferred` | Reuse/share data across purpose | Versioned disclosure/consent/revocation/recipient/field matrix and no-secondary-use tests |
| PFL-017 | Document/OCR/provider imports, fields, region, confidence and review | `External activation deferred` | Import/propose external value | Provider/DPA/contracts, field/source/version allowlist, suggestion-only and outage/revocation tests |
| PFL-018 | AI model/provider, allowed tools/fields, redaction, retention and evals | `External activation deferred` | Send profile context to AI or accept AI suggestion | Data-processing review, DTO/tool allowlist, prompt-injection/overexposure/eval/human-review tests; default off |
| PFL-019 | Profile request/update notifications, channels, quiet hours and copy | `External activation deferred` | Send external notification | M026 event/template/preference/consent policy and zero-value/zero-sensitive-context payload tests |
| PFL-020 | Metrics, viewers, retention and product analytics schema | `External activation deferred` | Emit PostHog/profile analytics | Coarse event allowlist, zero-value/ID/free-text/DOM/replay tests and default-off proof |

### Decisiones y configuración pendientes de M016

M016 no activa widgets, métricas, rutas, acciones, exports, realtime, analytics ni datos reales.
Estas filas controlan el alcance y las políticas necesarias antes de un Build. El default documental
es read-only, server-authorized, sin charts decorativos, sin contenido sensible y sin asumir que una
fuente fallida equivale a cero.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| ADM-001 | Roles/presets e inventario exacto de widgets obligatorios/opcionales Release 1A | `External activation deferred` | Renderizar un dashboard real | Role/widget/source/permission matrix, minimization review and role/cross-client tests |
| ADM-002 | Ruta canónica, label y navegación Admin ES/EN | `External activation deferred` | Crear/publicar ruta | Approved IA, route authorization, mobile/a11y tests and Product Owner visual acceptance |
| ADM-003 | Definición/version/source/period/owner de cada métrica | `External activation deferred` | Calcular/mostrar métrica real | Versioned metric registry, formula/source/coverage/rounding tests and owner sign-off |
| ADM-004 | Factores, pesos, desempate y explicación de prioridad | `External activation deferred` | Ordenar trabajo real | Versioned deterministic policy, reason-code/fairness/tie/missing-input tests; no LLM authority |
| ADM-005 | Matriz completa actor/session/auth epoch/assurance/membership/permission/role/team/assignment/grant/access epoch/purpose/classification scope y protección de inferencia | `External activation deferred` | Leer cualquier dato operacional | Canonical fingerprint, domain/RLS/final-fence/minimum-aggregation/timing/cross-scope and per-dimension delayed-invalidation tests |
| ADM-006 | Taxonomía/severidad/SLA/owner y autoridad de acknowledgement/dismissal/resolution de alertas | `External activation deferred` | Mostrar alerta o control acknowledge/dismiss/resolve real | Versioned alert registry, source/freshness/escalation/false-alert/mandatory-visibility and owner-command authority tests |
| ADM-007 | Periodos, custom range, IANA time zone y moneda | `External activation deferred` | Filtrar/comparar métricas | Period/time-zone/DST/currency semantics and boundary tests |
| ADM-008 | Umbrales de freshness y comportamiento partial/stale/unavailable | `External activation deferred` | Presentar estado de resumen | Source-class policy and zero-vs-failure/coverage/recovery tests |
| ADM-009 | Elegibilidad, TTL, fingerprint/keys exactos e invalidación de cache/snapshots | `External activation deferred` | Persistir/reutilizar derivado | Exact canonical-digest matrix, missing/mismatch miss/fail-closed, revocation/policy/source/recovery purge and no-truth tests |
| ADM-010 | Personalización, widgets obligatorios, vistas/filtros guardados y reset | `External activation deferred` | Guardar preferencias | Role/policy boundaries, version/CAS/reset/migration tests and mandatory-alert protection |
| ADM-011 | Quick actions Release 1A y comandos propietarios | `External activation deferred` | Mostrar/ejecutar acción | Allowlist, owner command/authz/idempotency/confirmation/audit and no-local-mutation tests |
| ADM-012 | Dataset/roles/purpose/formato/retención de export | `External activation deferred` | Exportar datos | Reauth/minimization/redaction/expiry/delivery/audit and inference tests |
| ADM-013 | Acciones bulk, batch limit, preview, autorización y rollback | `External activation deferred` | Ejecutar lote | Per-item authz, dry-run/idempotency/partial-failure/audit tests; sensitive bulk defaults off |
| ADM-014 | Existencia y controles de impersonation | `External activation deferred` | Impersonar usuario | Explicit legal/security policy, role/read-only/banner/reason/TTL/audit/no-silent tests; two-person control only when/if Product Owner approves it in ADM-014 |
| ADM-015 | Widgets de integration/AI/system health y roles técnicos | `External activation deferred` | Mostrar salud técnica | Coarse status/role/redaction/source/freshness tests; no logs/secrets/client data |
| ADM-016 | Polling/realtime event classes, transport, rate y fallback | `External activation deferred` | Activar updates automáticos | Provider-neutral contract, duplicate/delay/outage/recovery/manual-refresh tests |
| ADM-017 | Charts, product/operational analytics y telemetry schemas/allowlists, viewers, retention y frontera M016/M092 | `External activation deferred` | Mostrar tendencias/reportes o emitir analytics/telemetry no esencial | Metric/event/privacy/source/viewer/retention/default-off/no-PII-no-DOM tests and M092 ownership proof |
| ADM-018 | Thresholds, minimum aggregation, count suppression y differencing | `External activation deferred` | Mostrar/suprimir un aggregate/count | Versioned rule, subtraction/timing/filter/expiry tests; no alert acknowledgement/dismissal authority |
| ADM-019 | Retención/backup/deletion de preferences/snapshots/audit | `External activation deferred` | Persistir derivados reales | Class/period/legal-hold/recovery-generation/delete/restore tests and M085 review |
| ADM-020 | SLOs de performance/accesibilidad, devices y widget/load budget | `External activation deferred` | Declarar calidad del dashboard | Budgets, WCAG/EN-ES/mobile/performance evidence; no analytics/telemetry activation authority |

### Decisiones y configuración pendientes de M017

M017 no activa rutas, tablas, personas/clientes, pipelines, datos reales, merges, imports/exports,
campañas, analytics, automatización ni IA. Estas filas conservan las decisiones pendientes sin
inventar política comercial. El default es manual, least-privilege, sin comunicación implícita y sin
colapsar oportunidad, cliente, pago, entitlement, aprobación y expediente.

| ID | Dependencia o decisión | Estado | Bloquea | Evidencia de salida requerida |
|---|---|---|---|---|
| CRM-001 | Inventario exacto de entidades, vistas, columnas y acciones Release 1A | `External activation deferred` | Crear/renderizar CRM real | Versioned inventory, source-owner/classification matrix, minimization and no-duplicate-domain tests |
| CRM-002 | Ruta, navegación, labels y jerarquía Admin ES/EN | `External activation deferred` | Crear/publicar ruta | Approved IA, route authorization, mobile/a11y tests and Product Owner visual acceptance |
| CRM-003 | Identity-root state, per-purpose `CrmPurposeBinding` access/engagement lifecycle/owner/next-action, frontera M018, locale/time-zone source y policy organization-only | `External activation deferred` | Persistir relación/contacto/purpose CRM | Concrete-reference/unique-root/purpose CAS+non-overlap+evidence+revocation/locale-source, multi-channel/service/cross-purpose tests, no root-wide assignment/action, placeholder or implicit binding |
| CRM-004 | Evidencia para activar/desactivar relación formal Client | `External activation deferred` | Crear/cambiar Client | M018 policy, reason/evidence/version/idempotency tests; opportunity/payment alone insufficient |
| CRM-005 | Outcomes de oportunidad y prerequisitos de conversión Client/ServiceOrder/CaseFile | `External activation deferred` | Ejecutar conversión | Cross-owner invariant/result matrix, partial-failure/reconcile/no-won-equals-paid tests |
| CRM-006 | Pipelines, commercial opportunity stages/transitions, required fields, close/reopen, loss/cancellation reasons y migraciones de versión | `External activation deferred` | Activar pipeline real o ejecutar migración | Immutable versioned definitions, dry-run/exact-version migration, no-M020-qualification-write, transition/history/concurrency/recovery/localization tests |
| CRM-007 | Matriz role/team/assignment/resource/purpose/field/action y acceso global | `External activation deferred` | Leer/mutar datos CRM | Domain/RLS/list/count/field/export/cross-client tests; default deny |
| CRM-008 | Read-only M020 qualification projection, M017 opportunity-readiness fields, relationship indicator, priority, next-action type/due/zone/responsible/task ref, SLA, hold y stalled rules | `External activation deferred` | Calcular indicador/prioridad/overdue o exigir campos | No-cascade M020/M017 outcomes, versioned rules, UTC/IANA/responsibility/M023-ref, source/explanation, no-credit-risk, missing-input/fairness/manual-fallback tests |
| CRM-009 | Activity types, owner projections, summaries, freshness y retention | `External activation deferred` | Crear/mostrar timeline | Closed source/type registry, no-body-copy, freshness/authorization/retention tests |
| CRM-010 | Note types, roles, encryption, retention, redaction y política AI | `External activation deferred` | Guardar/mostrar nota interna | Field/role/purpose/encryption/XSS/prompt/no-client/no-telemetry/deletion tests |
| CRM-011 | Attribution/source/campaign taxonomy, fields and retention | `External activation deferred` | Persistir attribution/tracking real | Google/Meta/TikTok/Facebook/Instagram/organic/referral allowlist, immutable-original/latest-touch and minimization tests |
| CRM-012 | Duplicate inputs, keyed-token/fingerprint key-rotation policy, score bands y thresholds | `External activation deferred` | Ejecutar matching real | Shared/recycled contact, collision, rotation/restore, server-only domain separation, no-name-only/no-unkeyed-hash tests |
| CRM-013 | Canonical merge authority plus separate Opportunity duplicate keep/link/supersede policy, survivor, preserved history/attribution, downstream conflicts, roles, recovery y revisión adicional | `External activation deferred` | Ejecutar canonical merge u Opportunity resolution real | Dry-run graph; exact bindings/epochs and order/case/task/quote/payment/entitlement/approval refs; IAM-008-only account linkage; no owner-fact rewire; converted/conflict/concurrency/idempotency/audit/revocation/restore tests |
| CRM-014 | Queues, assignment, round-robin/workload, reassignment y inactive-owner behavior | `External activation deferred` | Automatizar asignación | Deterministic policy, concurrency, fairness, disabled-user, override and history tests |
| CRM-015 | Purpose-binding evidence refs y proyecciones/request paths M078 consent/M026 preferences/opt-out/locale/time-zone | `External activation deferred` | Activar binding o enviar comunicación | M017-no-consent-authority, authoritative locale/zone, fresh send-time authority, binding revoke/cursor/job invalidation, channel/purpose/quiet-hours/withdrawal tests |
| CRM-016 | Tags, custom fields, saved lists/views y segment governance | `External activation deferred` | Crear metadata/segments reales | Owner/purpose/classification/schema/version/retention/no-shadow-auth tests |
| CRM-017 | Import formats/limits/mapping, overwrite, duplicates, retention, forward reconciliation y supported compensation | `External activation deferred` | Importar datos | M011 quarantine/scan, parser/zip-bomb/formula, preview, row-auth/idempotency/compensation/no-consent tests; no blanket rollback |
| CRM-018 | Export datasets/fields/roles/reason/step-up/format/limit/delivery/TTL | `External activation deferred` | Exportar datos | Row/field reauth, masking, formula neutralization, private expiry/revocation/audit tests |
| CRM-019 | Deterministic automation, scoring y AI read/proposal tool/input/output/approval policy; cualquier modelo externo incluye processor/provider, account/model/version/region, DPA/no-training/retention y data-use controls | `External activation deferred` | Ejecutar rule/score/model o enviar CRM data a modelo externo | Default-off; provider/account/model pinning, DPA/region/no-training/retention, credential custody, field allowlist/redaction, source/target auth, prompt-injection/tool isolation, eval/fairness, outage/fallback, kill switch, incident/revocation and no-model-command tests; sin esta evidencia sólo deterministic local no-model/manual suggestion |
| CRM-020 | Proyecciones fact/event M017 y definiciones/viewers/retention M092 | `External activation deferred` | Emitir analytics/report real | Fact/metric/source/version/consent/minimum-aggregation/no-PII-no-DOM/no-free-text tests and M092 ownership proof |
| CRM-021 | Targets de performance, accesibilidad, devices, dataset/board budget y readiness | `External activation deferred` | Declarar calidad operacional | WCAG 2.2 AA/EN-ES/mobile/zoom/keyboard/load/concurrency/recovery evidence |
| CRM-022 | Retention, deletion/anonymization, legal hold, alias/tombstone, match-token/fingerprint key, operation receipt, backup expiry y restore/purge para **todo** registro/artefacto M017 de las secciones 10/11 del PRD, incluidas futuras extensiones aprobadas | `External activation deferred` | Persistir datos M017 reales | M085/legal-approved exhaustive versioned inventory including relationship/binding/opportunity, OpportunityRelation, stage/assignment/engagement/next-action histories, activity/note/reveal metadata, source/tag/attribution and definition versions, saved views/lists/custom fields, duplicate/quality, conversion/merge/pipeline migration/import/export/idempotency/recovery receipts; keyed-MAC rotation, purge/crypto-shred/hold/backup/restore tests |
| CRM-023 | Data-quality issue types/severity/lifecycle, rulesets, assignment/review, owner-resolution receipts, retention y targets | `External activation deferred` | Detectar/mostrar/resolver quality issues | Missing/invalid/conflict/stale/source rules, masked evidence, owner correction/revocation, no-cross-owner-write, recheck/retention/quality-target tests |

### Decisiones y configuración pendientes de M018

| ID | Prerrequisito | Estado | Bloquea | Evidencia para cerrar |
|---|---|---|---|---|
| CLM-001 | Inventario exacto de secciones, campos, columnas, search/filter/sort, alert-source/type y quick-action handoffs Release 1A | `External activation deferred` | Crear/renderizar Client Management real | Closed versioned section/action/alert/query inventory; M007/M011–M015/M017–M019/M021–M023/M025/M026/M040/M042–M046/M074/M078/M080/M089 owner routing; owner/classification/minimization matrix; keyed protected matching, no generic risk/cross-domain execute/shadow authority and denied-source count/cursor/timing tests |
| CLM-002 | Ruta, navegación, labels, jerarquía y aceptación visual Admin ES/EN | `External activation deferred` | Crear/publicar ruta | Approved IA/responsive compositions, route authorization, WCAG 2.2 AA and Product Owner visual acceptance |
| CLM-003 | Evidencia y autoridad para crear/activar/desactivar/reabrir formal Client | `External activation deferred` | Crear/cambiar ClientRelationship | Versioned evidence/role/reason/idempotency matrix; opportunity/account/payment alone insufficient |
| CLM-004 | Autoridad/evidencia canonical Person/ContactMethod/basic Household/member y normalización de tipos, household/co-applicant, individual-with-business y organization-only | `External activation deferred` | Resolver/crear/reutilizar/corregir/verificar/finalizar/sustituir party/contact/household/member o persistir subject modes | Typed M018 PartyDirectory/HouseholdDirectory ports; masked resolution; member add/correct/end; evidence/roles/keyed-match/version/purpose/visibility/access-epoch/final-fence/idempotency/recovery; no caller/direct-table, hidden member/count, membership=grant/consent or verification=identity/consent/account/client; source-label-to-axis; typed M019 relationship; no invalid type, cross-org fallback or duplicate tests; advanced household model remains Future under CLM-022 |
| CLM-005 | Lifecycle normalizado, viewer-safe operational-attention rules, labels/transitions and public mappings | `External activation deferred` | Persistir/calcular/mostrar estados | Versioned axis/state/transition and protected-cause safe-mapping matrix; request-time authorized source derivation, content-free durable dirty receipts, no payment/account/service/case collapse and no denied-source value/order/filter/count/cursor/timing tests |
| CLM-006 | Onboarding definition/item lifecycle, applicability, responsibility, prerequisites, migration and completion evidence per service | `External activation deferred` | Publicar definición o ejecutar/migrar onboarding | M018-owned immutable draft/validate/publish/supersede definitions; item templates/service-subject-context/effective applicability; EN/ES versions; publish/SoD; exact frozen workflow version; migration preview/policy; owner receipts; concurrent publish/stale completion/restore and unknown/unavailable/not-applicable tests |
| CLM-007 | Offboarding definition lifecycle/applicability/migration plus closure/reopen authority, blockers, former-client access and open-item policy | `External activation deferred` | Publicar definición o ejecutar/migrar offboarding/reopen | M018-owned immutable definition/item templates and EN/ES versions; publish/SoD/frozen workflow/migration preview; complete owner inventory, hold/dispute/open-service/case rules, concurrent publish/stale completion/restore, partial-failure and no-account/data-delete implication tests |
| CLM-008 | Assignment types, eligible users/teams, overlap, inactive-owner, escalation and reassignment | `External activation deferred` | Crear/reasignar ownership | Versioned eligibility/interval policy, concurrency, inactive user/team, history and owner-work reevaluation receipts |
| CLM-009 | Representative types, exact scope, evidence, terms, verification, invite TTL, expiry/review and revocation | `External activation deferred` | Invitar/activar/delegar acceso | M007 grant/access-epoch contract, scope/identity/evidence/expiry/concurrent-session/revocation/attribution tests |
| CLM-010 | Flag/restriction/severity/review plus alert source/type/severity/reason/responsible/status/visibility/owner-CTA registry and suspend/block/deceased/reactivate authority, scope, approval and SoD | `External activation deferred` | Persistir/enforce review o lifecycle control; mostrar/accionar alerta | Closed flag/restriction/alert taxonomies; explicit M011 download, M014/M043 payment, M012/M025 messaging, M040/M078 sharing, M007/M080 verification, M021/M022/M045 service-pause and independent M007/M014/M045 receipt/history mappings; owner preview/final fence/stable receipts, unavailable fail-closed, ambiguous reconciliation/manual recovery, no scope-to-whole-client expansion, flag-alert conflation, denied-count, discrimination or AI-execute tests |
| CLM-011 | ClientOperationalNote types, roles, visibility, facts/context/purpose/professional-language policy, sanitizer, encryption, revision/supersession, independent destructive-redaction roles, retention and AI | `External activation deferred` | Guardar/mostrar/revisar/redactar client note | Note-family separation; create/revise versus request/approve/execute/reconcile redaction capabilities; exact note/revision/field/reason/version; M085 hold/retention receipts, SoD/final fence/tombstone/no-hard-delete; concurrent edit/restore; ordinary-author denial; prohibited content, XSS/prompt/no-client/no-telemetry and AI-suggestion-only tests |
| CLM-012 | Authoritative locale/time-zone/accessibility/contact preference and M078 consent/M026 contactability projections plus M026 owner-management flow | `External activation deferred` | Mostrar/usar/administrar preference/contactability | Owner/source/version/freshness/CAS contract, channel propagation receipts/failure, no-verification-or-preference=consent and fresh send-time withdrawal-wins/quiet-hours tests |
| CLM-013 | Portal-admin actions (invite/resend verification/revoke sessions/block/unblock/recovery) and future read-only impersonation roles, reason, TTL, banner and blocked actions | `External activation deferred` | Ejecutar portal admin/impersonation | M007/M080 typed owner receipts, permission/reason/step-up/expected-version/final-fence/epoch, no-secret/no-password-setting, no-silent/pay/sign/security/export/reveal action and audit tests |
| CLM-014 | Protected-field masking/reveal/copy purpose, roles, step-up, TTL and audit policy | `External activation deferred` | Revelar/copiar dato protegido | One-field no-store response, value-free M077 receipt, expiry/revocation/browser/telemetry/screen-reader tests |
| CLM-015 | Export datasets, fields, exclusions, roles, reason, step-up, format, limits, redaction and delivery TTL | `External activation deferred` | Exportar datos de cliente | Actor-owned row/field reauth; default exclusion of internal notes, flag/restriction rationale, security/audit, score/risk/evaluation and AI material; separate M085 legal dataset/SoD; formula neutralization, private M011 delivery, revoke/expiry/restore and audit tests |
| CLM-016 | Exhaustive per-record retention, deletion/anonymization, legal hold, encryption/match-key, backup expiry and restore/purge | `External activation deferred` | Persistir/destruir M018 records | M085/legal-approved inventory for all M018 aggregates/receipts/artifacts, hold/crypto-shred/key/backup/restore tests |
| CLM-017 | AI summary/proposal tools, minimized inputs/outputs, provider/model/data policy, evaluation and approval | `External activation deferred` | Enviar M018 context a IA o usar output | Default-off provider/model/version/region/DPA/no-training/retention/allowlist/redaction/prompt/eval/kill-switch/no-command tests |
| CLM-018 | Operational metric/event definitions, viewers, privacy thresholds, retention and M092 ownership | `External activation deferred` | Emitir analytics/report real | Versioned source/denominator/suppression/minimum-aggregation/no-PII-no-free-text tests |
| CLM-019 | Performance/dataset/device, WCAG/manual evidence and operational readiness targets | `External activation deferred` | Declarar calidad operacional | EN/ES/mobile/zoom/keyboard/screen-reader/reduced-motion/load/concurrency/recovery evidence |
| CLM-020 | Freshness/cache TTL, partial/fallback/reconciliation, query timing and owner timeout policy per section | `External activation deferred` | Activar aggregate/cache o cross-owner query | Owner-specific freshness/result registry; actor/purpose/section/source/access-epoch cache isolation; deterministic cursor/tie-break; owner outage; unavailable-not-zero and denied-source no value/order/filter/count/cursor/timing tests |
| CLM-021 | Public client-reference format, issuance, collision, lookup and communication policy | `External activation deferred` | Emitir/usar client reference | Non-sensitive format/uniqueness/rate-limit/enumeration/no-authorization tests and approved copy |
| CLM-022 | Person/Household matching, canonical merge authority/evidence/thresholds, aliases/tombstones, Organization coordination and keyed-token rotation | `External activation deferred` | Ejecutar matching/merge real | Keyed-token/domain/key-rotation plus complete owner-graph preview, conflict, final-fence, idempotency/recovery/restore and no-name/no-AI tests |
| CLM-023 | One-client temporary staff access request/status/approve/revoke roles, exact section/field/action scope, purpose, reason, approver, SoD, step-up, TTL and review; global/break-glass stays M007/M080-owned | `External activation deferred` | Conceder acceso extraordinario a un cliente | M018 client-bound request/receipt + M007 grant/invalidation owner contract; mandatory clientRef/no wildcard/all-clients, no M018 global/break-glass request or direct grant mutation, default-deny TTL/expiry, epoch/cache/job invalidation, idempotency/reconcile/review and cross-client tests |

| Módulo(s) | Dependencia externa pendiente | Estado | Se completa ahora | Se difiere hasta activación | Fallback seguro |
|---|---|---|---|---|---|
| M007 y M080 IAM | Proyecto Supabase productivo, dominios, email y MFA configurados | `External activation deferred` | Arquitectura Auth/RLS, roles, grants, sesiones y pruebas locales autorizadas | Configuración productiva, remitente, proveedores sociales y pruebas de recuperación/MFA | Alta y soporte manual controlados; sin acceso si falla la verificación |
| M008 Dashboard | M007 activo y proyecciones autorizadas de M009–M014/M018/M021–M026/M042–M045/M067/M080–M081 | `External activation deferred` | PRD, UX, contratos de agregación/prioridad/freshness y pruebas locales autorizadas | Activar solo fuentes registradas con proyección real, política aprobada y evidencia cross-client/partial-failure | Omitir o mostrar `unconfirmed|unavailable`; nunca simular zero/no-action/paid/completed |
| M009 Mis servicios | M007/M008 y proyecciones reales autorizadas de ServiceOrder/Case/M010–M014/M021–M026/M042–M045/M067 | `External activation deferred` | PRD, UX, contratos de grant/state/version/projection y pruebas sintéticas autorizadas | Activar únicamente servicios reales con grant explícito, definition/workflow version, status policy y owners probados | Omitir o mostrar `unconfirmed|unavailable`; nunca convertir interés/pago en servicio/inicio |
| M010 Estado de mi proceso | M007–M009 activos y proyecciones autorizadas de ServiceOrder/Billing/Case/workflow/M011–M014/M023/M067 | `External activation deferred` | PRD, UX, contratos de status/source registry/public timeline/final fence y pruebas sintéticas autorizadas | Activar solo con mappings/event allowlist/milestones/freshness aprobados y owners/projections reales probados | Mostrar `unconfirmed|unavailable` y soporte; nunca inventar estado, timeline, fecha, porcentaje o ausencia de blocker |
| M011 Portal de documentos | M007/M009, Case/ServiceOrder, Supabase private Storage, scanner y políticas DOC-001–DOC-020 | `External activation deferred` | PRD, UX, contratos de quarantine/safety/version/review/access/retention y pruebas sintéticas autorizadas | Activar solo con buckets/policies/scanner/limits/copy/retention aprobados y pruebas cross-client/malicious/restore | Rechazar o mantener cuarentena; revisión/carga manual segura; nunca exponer/promover bytes inciertos |
| M012 Mensajería segura | M007/M009 grants, M011 attachments, M025/M026, retention/encryption y políticas MSG-001–MSG-020 | `External activation deferred` | PRD, UX, contratos de content/visibility/order/handoff y pruebas sintéticas autorizadas | Activar solo con state/role/content/security/retention/notification policies aprobadas y pruebas cross-client/internal-note/race | Soporte humano manual y portal no habilitado; nunca usar email/WhatsApp/IA como sustituto sensible |
| M013 Client Appointments (proyectado en M024) | Cuenta Google Workspace/Calendar, OAuth y políticas APT-001–APT-020 | `External activation deferred` | PRD/UX y arquitectura/contratos del futuro motor interno definitivo, zonas IANA, concurrencia, buffers, owner boundaries y diseño del adapter; M024 sólo consume la proyección UI | Build, citas/datos reales, OAuth, calendario, meeting/reminder/payment providers, webhooks/sync y reconciliación productiva bajo M013 | Agenda interna/manual y bloqueo seguro; nunca inventar disponibilidad ni asumir sync |
| M014 y M042–M046 Pagos | LLC/banco, cuenta Stripe verificada y políticas PAY-001–PAY-020 | `External activation deferred` | PRD/UX, obligación/ledger operacional, provider contracts, idempotencia, reconciliación, autorización y pruebas sintéticas autorizadas | Build, precios/datos reales, onboarding/credenciales/endpoints/eventos/métodos/tráfico y conciliación productiva | Cotización/registro pendiente y revisión manual; nunca marcar una captura/retorno/pago externo como confirmado por Stripe |
| M015 Perfil financiero y empresarial | M007/M011/M017–M022/M077–M085 y políticas PFL-001–PFL-020 | `External activation deferred` | PRD/UX, facts/revisions/provenance/conflicts/purpose DTO contracts y pruebas sintéticas autorizadas | Build, campos/datos reales, KMS, provider/OCR/AI, export/notificación/analytics y políticas productivas | Intake manual mínimo dentro del expediente autorizado; no perfil completo, no sobrescritura ni inferencia de verificación/elegibilidad |
| M016 Dashboard administrativo | M007/M011–M014/M017–M026/M042–M046/M074/M077/M079/M089/M092/M097 y ADM-001–ADM-020 | `External activation deferred` | PRD/UX, aggregation/priority/freshness/coverage/suppression/owner-port contracts y pruebas sintéticas autorizadas | Build, route, widgets/métricas/datos reales, cache/realtime/actions/export/analytics e integración técnica | Operar directamente en módulos propietarios; dashboard no disponible o muestra estado parcial sin fabricar cero/éxito |
| M017 CRM | M007/M018–M026/M042–M046/M077–M085/M089–M092/M097 y políticas CRM-001–CRM-023 | `External activation deferred` | PRD/UX, CRM relationship/opportunity/pipeline/assignment/activity/data-quality, owner-port, conversion, duplicate/merge/import/export contracts y pruebas sintéticas autorizadas | Build, rutas/tablas/RLS/datos reales, merge, imports/exports, campaigns, analytics, automation/AI y provider/channel activation | Seguimiento manual autorizado y trabajo directo en módulos propietarios; no fabricar contacto/cliente/consentimiento/pago ni fusionar registros |
| M018 Gestión de clientes | Core controls M007/M077/M078/M080/M085; read-time section/search/action owners M011–M015/M017/M019/M021–M023/M025/M026/M040/M042–M046/M074/M089; cross-cutting analytics/observability/recovery M092/M097/M098 only; M017/M020/M021 are upstream callers of published M018 ports, not write/runtime dependencies; políticas CLM-001–CLM-023 | `External activation deferred` | PRD/UX, canonical party/formal-client lifecycle, assignment/representative/restriction/onboarding/offboarding/note, closed client-360 owner-port including partner/financial subfact boundaries, idempotency/recovery contracts y pruebas sintéticas autorizadas | Build, rutas/tablas/migraciones/RLS/datos reales, identity resolution/merge, portal grants, reveal/export/impersonation, lifecycle effects, partner/financial projections, analytics/AI/providers and productive retention/restore | Operación manual autorizada directamente en cada módulo propietario; M018 no disponible o muestra fuente parcial/unavailable sin duplicar ni fabricar cliente/estado/acceso/servicio/referral/pago |

## Servicios, marketplace y partners

| Módulo(s) | Dependencia externa pendiente | Estado | Se completa ahora | Se difiere hasta activación | Fallback seguro |
|---|---|---|---|---|---|
| M028 Credit Monitoring | Acuerdo/cuenta/API de IdentityIQ u otro proveedor aprobado | `External activation deferred` | Interface `CreditMonitoringProvider`, consentimiento, import contract y operación manual | Contrato, credenciales, términos, sandbox/producción y webhooks | Carga autorizada de documentos y revisión humana |
| M029 Tradelines | Relación comercial y mecanismo aprobado con Tradeline Supply u otro proveedor | `External activation deferred` | PRD, disclosures, catálogo neutral, `TradelineProvider` y trazabilidad | Acuerdo, catálogo/precios vigentes, tracking, pedidos y callbacks | Contenido educativo con disclosure; sin afirmar partnership ni vender inventario inexistente |
| M030 Taxes | Credenciales profesionales, políticas y proveedor de filing aprobado | `External activation deferred` | Arquitectura de intake, workpapers, revisión humana y `TaxFilingProvider` | E-file/provider, autorizaciones, jurisdicciones y pruebas regulatorias | Preparación/revisión manual dentro del alcance autorizado; sin presentar automáticamente |
| M035–M036 Funding/Home Buying | Lenders, programas, referral agreements y límites profesionales | `External activation deferred` | Perfiles, checklists, evaluación informativa, fuentes y referral contracts | Partners, criterios vigentes, tracking, consentimientos y disclosures finales | Orientación educativa y derivación manual sin garantía |
| M037–M041 Marketplace/Partners | Acuerdos, catálogos, feeds/APIs, comisiones y SLAs | `External activation deferred` | Modelo Partner/Offer/ProviderConnection, adapters, consentimiento y auditoría | Cada partner se activa individualmente con evidencia contractual y técnica | Ocultar la oferta inactiva o mostrar solo educación neutral aprobada |
| M039 CreditCardBroker | Contrato, cuenta, método de integración y tracking aprobados | `External activation deferred` | Adapter, allowlist, disclosures, attribution contract y tests locales | Credenciales/widgets/API, catálogo real y validación de conversiones | Marketplace sin ese proveedor; nunca enlaces no aprobados |
| M067 Firma electrónica | Cuenta y configuración DocuSeal o proveedor aprobado | `External activation deferred` | `E-signProvider`, estados, evidencia y auditoría | Plantillas, credenciales, identidad de firmantes y prueba legal/operativa | Firma manual autorizada y carga del comprobante |

## IA, conocimiento y automatización

| Módulo(s) | Dependencia externa pendiente | Estado | Se completa ahora | Se difiere hasta activación | Fallback seguro |
|---|---|---|---|---|---|
| M047–M060 AI Hub/agentes | Modelo aprobado, presupuesto, evaluaciones, políticas y runtime | `External activation deferred` | Contratos, permisos, tool allowlists, human-in-the-loop, evals y trazas minimizadas | Credenciales/modelos, datos autorizados, evaluación productiva y monitoreo | Flujo humano; ninguna acción sensible automática |
| M062–M066 Knowledge/RAG/documentos | CMS/repositorios, modelo de embeddings/OCR y corpus aprobado | `External activation deferred` | Modelo de fuentes, versiones, acceso, citas, redacción y provider contracts | Conexiones, índices productivos, OCR/modelos y pruebas con datos autorizados | Búsqueda determinista y revisión humana |
| M068–M073 Workflows/automation | Inngest, n8n, portales y workers configurados | `External activation deferred` | Estados durables en Postgres, idempotencia, límites de retry y ruta manual | Cuentas/endpoints/credenciales, portales reales y pruebas de recovery | Tarea humana auditada y reanudación manual |

## Infraestructura y operación

| Módulo(s) | Dependencia externa pendiente | Estado | Se completa ahora | Se difiere hasta activación | Fallback seguro |
|---|---|---|---|---|---|
| M083–M084 Secrets/Integration Security | Secret store y credenciales productivas | `External activation deferred` | Referencias opacas, rotación, firma, rate limits y revocación | Alta del store, custodia, rotación ensayada y accesos productivos | Integración deshabilitada y fail closed |
| M092 Analytics | Cuenta/configuración PostHog y consentimiento aprobado | `External activation deferred` | Taxonomía minimizada, allowlists y pruebas sin PII | Proyecto productivo, consent mode y validación de payloads | Métricas operativas internas mínimas o ninguna captura |
| M093–M095 Homelab/nodos IA | Hardware, red, UPS, almacenamiento y operación disponibles | `External activation deferred` | Arquitectura híbrida futura y adapters sin convertirla en requisito de Release 1 | Compra/configuración, hardening, backups y failover probado | Cloud-first aprobado |
| M097 Observabilidad | Proyectos/cuentas Sentry y stack OTel/Grafana | `External activation deferred` | Instrumentación, redacción, sampling y contratos | DSN/endpoints, alertas, dashboards y prueba de incidente | Logs mínimos redactados y runbook manual |
| M098 Backup/Recovery | Capacidades contratadas/configuradas por proveedor | `External activation deferred` | Política, RPO/RTO propuestos, restore checklist y safeguards | Backups reales, custodia de claves, restauración probada y aprobación | Exportación controlada y procedimiento manual documentado |
| M099 Despliegues | Dominio, Vercel, Supabase, CI/CD y entornos productivos | `External activation deferred` | IaC/configuración, gates, rollback y validación local | Cuentas, dominio/DNS, variables, staging/production y smoke tests | Mantener sin publicar; no simular disponibilidad pública |

## Checklist para cambiar un estado

- [ ] La arquitectura y el PRD aprobado identifican el provider abstraction y su propietario.
- [ ] La dependencia empresarial o contractual existe y fue confirmada por el Product Owner.
- [ ] La cuenta pertenece a SG Solutions y utiliza identidad/recuperación institucional aprobada.
- [ ] Los secretos están en el secret store; ninguno aparece en Git, documentación o logs.
- [ ] Sandbox o entorno controlado validado con evidencia reproducible.
- [ ] Webhooks/OAuth usan firma, state/nonce, idempotencia, replay protection y revocación aplicables.
- [ ] Existe fallback manual seguro y el sistema falla cerrado.
- [ ] Observabilidad minimizada y sin PII/PCI/contenido sensible no permitido.
- [ ] Runbook, recuperación, reconciliación y rollback probados.
- [ ] Revisión de seguridad independiente completada.
- [ ] Product Owner aprobó la activación y el cambio se registró en `DECISIONS.md`.

## Registro de cierres

No hay activaciones externas cerradas todavía. Cada cierre futuro añadirá fecha, módulo, ambiente,
evidencia no sensible, responsable, decisión y limitaciones conocidas.
