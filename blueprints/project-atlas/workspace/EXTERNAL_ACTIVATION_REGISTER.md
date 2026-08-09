# Registro de activaciones externas pendientes

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Active living register
- Last updated: 2026-08-09
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
| M004 WhatsApp Business | Meta Business, WhatsApp Business Account, número aprobado, plantillas y webhook | `External activation deferred` | Contratos de canal, consentimiento, plantillas conceptuales, idempotencia y handoff | Alta/verificación de Meta, número, plantillas aprobadas y prueba real | Email/formulario/portal autorizado |
| M005 y M096 Telefonía/Voice Gateway | Proveedor oficial y número institucional, configuración STT/modelo/TTS y política de grabación/transcripción | `External activation deferred` | Arquitectura de gateway, consentimiento, transferencia, herramientas limitadas y fallback | Proveedor/número/runtime aprobados, credenciales, pruebas de llamada, políticas y disclosures | Mensaje/transferencia manual y devolución de llamada |
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
| FORM-010 | Scheduling posterior al submit versus callback/redirect | `External activation deferred` | Mostrar slots o afirmar booking | Form/version allowlist, M013/M024 activo, timezone/concurrency/fallback y receipts probados |
| FORM-011 | Quote/payment handoff posterior al submit | `External activation deferred` | Crear link/cobro o mostrar monto/producto | Form/service allowlist, M042–M045 activos, catalog/price/copy/idempotency/reconciliation probados |
| FORM-012 | Partner/Marketplace sharing or application | `External activation deferred` | Transmitir cualquier answer a partner | Agreement, exact fields/purpose/disclosure/consent/revocation/evidence y adapter tests; default no sharing |
| FORM-013 | Attribution, cookies/consent mode, ad click IDs y conversion destinations | `External activation deferred` | External analytics/pixels/Conversion API o identifiers | Field allowlist, retention, privacy review, consent mode, payload/redaction tests; default first-party minimal only |
| FORM-014 | AI classification/summary of accepted submissions | `External activation deferred` | Enviar answers a model o usar AI output | Field allowlist, provider/DPA/region/no-training/retention, evals/human review and kill switch; default deterministic/manual |

## Identidad, agenda y pagos

| Módulo(s) | Dependencia externa pendiente | Estado | Se completa ahora | Se difiere hasta activación | Fallback seguro |
|---|---|---|---|---|---|
| M007 y M080 IAM | Proyecto Supabase productivo, dominios, email y MFA configurados | `External activation deferred` | Arquitectura Auth/RLS, roles, grants, sesiones y pruebas locales autorizadas | Configuración productiva, remitente, proveedores sociales y pruebas de recuperación/MFA | Alta y soporte manual controlados; sin acceso si falla la verificación |
| M013 y M024 Agenda | Cuenta Google Workspace/Calendar y OAuth | `External activation deferred` | Motor interno definitivo, zonas IANA, concurrencia, buffers y adapter | OAuth, calendario real, webhooks/sync y reconciliación productiva | Agenda interna y bloqueo manual |
| M014 y M043–M045 Pagos | LLC/banco, cuenta Stripe verificada, productos/precios y webhooks | `External activation deferred` | Contratos de Checkout/Invoices, ledger operacional, idempotencia, reconciliación y tests | Onboarding Stripe, credenciales, endpoints, eventos reales, métodos y conciliación controlada | Cotización/registro pendiente; nunca marcar un pago manualmente como confirmado por Stripe |

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
