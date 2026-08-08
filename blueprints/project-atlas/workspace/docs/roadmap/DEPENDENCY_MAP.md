# Dependency Map

- Owner: Product Architect
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

## Fronteras de extracción

El default es monolito modular y base transaccional central. Extraer un microservicio requiere ADR que demuestre al menos una frontera real: escala, seguridad, despliegue, hardware, aislamiento de fallos o runtime. Preferencia tecnológica no es justificación suficiente.
