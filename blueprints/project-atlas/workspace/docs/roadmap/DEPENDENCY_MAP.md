# Dependency Map

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Approved conceptual dependency baseline
- Update rule: actualizar antes de cambiar una dependencia de catálogo o límite de dominio

## Capas

```text
Product definition + module governance
                ↓
Platform primitives + IAM + consent + audit + providers
                ↓
Catalog + pricing + payments + entitlements
                ↓
Public acquisition + internal operations + client portal
                ↓
Business Formation first vertical
                ↓
Credit / Tax / Funding / Home Buying / Marketplace
                ↓
Knowledge / Automation / AI
                ↓
Measured scale, hybrid infrastructure and mobile expansion
```

## Reglas de dependencia

1. Toda vertical depende de `Client`, `Person`, `Organization` o `Business`, `ServiceOrder`, `CaseFile`, `Document`, `Task`, `Appointment`, `Message`, `Payment`, `Consent`, `Approval`, `AuditEvent` y `Workflow` según corresponda.
2. Una vertical añade extensiones y reglas propias; no crea versiones paralelas de las primitivas.
3. Public Website, Client Portal y Admin/Internal consumen las mismas capacidades de dominio por límites autorizados; ninguna superficie posee reglas duplicadas.
4. `M041 Abstracción de proveedores` precede integraciones concretas. Los adapters externos no invaden el dominio.
5. `M042 Catálogo de servicios` y `M046 Precios, descuentos y promociones` preceden publicación, cotización y entitlements. Publicación permanece off hasta aprobación del Product Owner.
6. `M043 Stripe Payments` y `M044 Verificación de pago` dependen de auditoría, idempotencia y reconciliación. Pago confirmado no concede una aprobación humana ni un entitlement por sí solo.
7. `M045 Entitlements` depende de pago verificado y de las aprobaciones aplicables, pero no los sustituye.
8. Automatización e IA dependen de estados duraderos, permisos, consentimientos y rutas humanas; nunca son fuente de verdad ni autoridad.
9. El centro de ayuda R1.2 usa contenido público básico; Knowledge Base/R6 lo enriquece sin bloquear captación.
10. Portal de documentos, mensajería segura y firma electrónica se apoyan en IAM, auditoría, consentimiento y Storage; el procesamiento documental R6 los amplía posteriormente.
11. Las recomendaciones de marketplace usan metadata de oferta para fuente/vigencia hasta que R6 aporte gestión de fuentes ampliada.
12. Voice Gateway pertenece a R7 junto con comunicaciones; homelab, nodos locales/GPU y operación híbrida dependen de métricas, ADR y controles cloud ya operativos.
13. M003, M004, M005 y futuros canales reutilizan una sola frontera de conversación, `Message`,
    consentimiento, handoff y auditoría. Cada canal aporta transporte/adapters y estados externos;
    nunca crea clientes, leads, expedientes, pagos, citas o autorización paralelos. Un número o
    endpoint de canal no equivale a identidad autenticada ni acceso delegado.
14. M005 owns voice reception policy, durable call state and domain-tool orchestration. M096 may own
    only the specialized real-time provider/media runtime and ephemeral audio session. It depends on
    M041 provider abstractions, M025 communications, M077 audit and M084 integration security; it
    never owns leads, clients, appointments, payments, consent or authorization.
15. M006 owns public form projection/session/submission UX and receipt. M020 owns leads/deduplication,
    M078 owns consent, M077 owns audit, and M013, M042–M045, M011, M026 and M040 own their
    optional handoffs. `apps/www` public ingress has no direct database/provider authority and a
    public submission never becomes a client/case/service order by implication.
16. M007 owns client invitation, authentication, recovery, account-security UX and identity-linking
    orchestration. M080/M081 own IAM/RBAC policy, M091 owns staff user administration, M045 owns
    entitlements and ADR 004 owns case/resource inheritance. Supabase identity, active account,
    membership, role/permission, entitlement and resource grant remain separate checks; email,
    phone, payment and CRM status never collapse them.
17. M008 owns only the Client Portal Home aggregation, deterministic priority and partial-failure
    experience. M009/M010 own detailed service/process views; M011–M014 and their internal domains
    own documents, messages, appointments and payments; M067 owns signature state. M008 consumes
    typed client projections under one complete M007 authorization snapshot and proposed ADR 012.
    Its closed priority-source registry explicitly covers security, signatures and every other
    active action producer; M008 does not duplicate state, mutate an owning domain, query providers
    from the browser or treat a missing/unavailable source as zero/no action.
18. M009 owns the authorized contracted-service directory and detail shell. `ServiceOrder` remains
    commercial root, `CaseFile` operational root and M010–M014 owning workflow surfaces. Explicit
    service/case grants—not client/participant/email/payment relationships—control visibility. The
    order binds accepted service-definition/workflow/pricing versions, and a versioned policy maps
    canonically owned commercial, financial, human-activation and fulfillment subfacts without making M009 a source of
    truth or mutation authority.
19. M010 owns only the detailed client-safe process projection. It consumes the same canonical
    ServiceOrder/Billing/Case/workflow facts and M008 priority semantics, binds milestones to the
    accepted workflow version and maps only allowlisted real events into a governed public timeline.
    M011–M014/M023/M067 retain commands and state. A closed source registry and the complete
    M007–M009 authorization/resource-epoch fence prevent missing or revoked state from becoming a
    definitive status, action, count, cursor or route.
20. M010 landing consumes an M009-owned nonrecursive `AuthorizedServiceChoicePort`, not the full
    M009 list/detail that may decorate from M010. Dependency contracts prohibit M009↔M010 recursive
    composition. Release 1A derives timeline events request-scoped from durable owner state; any
    M010 materialized projection or background writer requires a separate ADR and Build gate.
21. M011 consumes M007 identity/context/grants, M009 ServiceOrder/Case scope, M021/M022 canonical
    records, ADRs 003–005 and approved Supabase private Storage. It owns request/upload/safety/
    promotion/version/review/visibility/delivery state but not M023 tasks, M065 OCR/extraction, M066
    generation, M067 signature, M077 audit or M085 retention policy. M008–M010 consume only typed
    client-safe M011 summaries/routes and cannot obtain bytes, keys, filenames, signed URLs,
    comments or provider payloads.
22. M012 consumes M007 identity/context/grants, M009/M010 authorized roots and the shared M003–M005
    conversation vocabulary. It owns authenticated portal messages, conversation-local internal
    notes, participation, durable ordering and handoff; M011 owns attachments, M013/M014/M023/M067
    own typed actions, M025 owns the unified inbox, M026 owns notifications and M047–M060 own AI.
    Participant/contact/message references never grant resource access, and Client/Internal DTOs and
    event namespaces remain structurally separate. M018 owns client/case operational notes; neither
    note authority mutates or copies the other, and only opaque typed links/projections cross the
    boundary. M092 owns analytics/report consumption and MSG-018 gates its minimized M012 facts.
    M097 separately owns required content-free, identifier-free operational/security observability
    under its own readiness/activation policy; neither receives transcript/session replay. M076 owns
    compliance policy/human decisions, M090 system configuration and M091 staff role administration;
    M012 cannot replace or self-grant through any of them.
    M025 receives a content-free list/assignment projection only; protected detail is a fresh
    request-scoped M012 read and is never persisted or cached by M025.
23. M013 owns appointment types/policies, availability derivation, holds, bookings, client/public
    appointment projection, lifecycle/attendance/structured-outcome commands and Google/meeting
    projection/reconciliation. M024 owns the internal calendar UI/cross-domain agenda and M090 the
    Settings placement; neither writes appointment state. M024's R1.3 task/agenda shell has no strict
    dependency on the later R1.5 M013 appointment capability: the M013 projection/commands are an
    optional gated contribution only after M013 approval/activation. M003–M006/M012 are channel clients. M020/
    M078 own scheduling-purpose prospect/consent reservation and finalization; M007/ADR 004 identity/
    resource access; M014/M042–M046 payment prerequisites; M017/M020 CRM activity; M021/M022 service/
    case; M023 tasks; M026 reminder and APT-007 code delivery; M077 audit; M085 retention; M092
    reporting; M097 telemetry. M041 supplies adapter conventions, while M013 owns domain ports.
    After APT-019 only, M051 under M047 may call receipt-bound M013 tools; M076 owns compliance/human
    decisions and AI never acquires availability, payment, attendance, note or authorization authority.
    Provider, payment, requirement, attendance, structured outcome and reminder axes never collapse.
24. M014 owns the Client Billing query/action projection over one shared Billing bounded context.
    M021 retains `ServiceOrder` and human approval-to-start; M042 catalog; M043 Stripe/provider
    objects and mutations; M044 verified-payment/reconciliation; M045 entitlements; M046 prices,
    discounts and waivers. Accepted quotes/obligations are immutable version-bound integer-money
    snapshots. Provider mutations reserve semantic idempotent operations; signed events enter a
    unique inbox and apply monotonic provider facts/journal/allocations/outbox atomically, with
    reconciliation for ambiguity and restore. M007/ADR 004 grants one service-order/case root;
    payment/email/provider customer grants nothing. M008–M010/M013 consume only typed client-safe
    summaries/prerequisite evidence and never call Stripe or infer paid/approval/start. M026 owns
    delivery, M077 audit, M085 retention and M092 reporting. BIZ-001–003/PAY-001–PAY-020 gate all
    business policy, Build, Stripe traffic and Operational status.

## Fronteras de extracción

El default es monolito modular y base transaccional central. Extraer un microservicio requiere ADR que demuestre al menos una frontera real: escala, seguridad, despliegue, hardware, aislamiento de fallos o runtime. Preferencia tecnológica no es justificación suficiente.
