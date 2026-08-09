# ADR 006: Architecture-first delivery with deferred external activation

- Status: Accepted
- Date: 2026-08-09
- Decider: Product Owner
- Owner: Codex Architecture Agent

## Context

SG Solutions todavía no dispone de todas las condiciones empresariales y cuentas necesarias para
activar proveedores como Stripe, WhatsApp Business, partners financieros, telefonía, Google
Calendar, firma electrónica o infraestructura propia. La ausencia actual de esas conexiones no debe
forzar prototipos desechables, inventar políticas o bloquear el diseño coherente de la plataforma.

Al mismo tiempo, un mock, una interface o una prueba local no demuestran que una integración real
funciona. Confundir arquitectura con activación produciría estados falsos, riesgos operativos y una
lista de tareas externas que podría perderse entre módulos.

## Decision

Project Atlas seguirá una estrategia **architecture first, external activation later**:

1. Cada módulo puede completar primero su PRD, modelo de dominio, provider abstraction, contratos,
   controles, UX, eventos, idempotencia, reconciliación, observabilidad y fallback manual.
2. La construcción autorizada usará límites definitivos y pruebas controladas. No se crearán
   respuestas engañosas ni integraciones falsas presentadas como operativas.
3. Cuentas, credenciales, acuerdos, catálogos, números, dominios, webhooks y pruebas productivas se
   activarán únicamente cuando existan los prerrequisitos empresariales y el Product Owner lo
   autorice.
4. `EXTERNAL_ACTIVATION_REGISTER.md` es la autoridad de readiness externa y debe actualizarse al
   diseñar, construir, habilitar o retirar una dependencia externa.
5. El estado de activación es una dimensión adicional; no reemplaza el estado del módulo. Un módulo
   no alcanza `Operational` si una conexión incluida en su alcance operativo sigue diferida.
6. Todo provider debe fallar cerrado, ofrecer una ruta manual segura y conservar el estado durable
   en la autoridad aprobada del dominio. El provider externo nunca se convierte silenciosamente en
   autoridad del negocio.
7. Ningún documento de readiness contendrá secretos o datos sensibles.

## Activation gate

Una conexión externa requiere, como mínimo:

- prerrequisito empresarial/contractual confirmado;
- cuenta institucional y propietario definidos;
- secretos administrados fuera del repositorio;
- sandbox o prueba controlada cuando exista;
- controles de OAuth/webhook, idempotencia, replay y revocación aplicables;
- fallback, reconciliación, observabilidad minimizada y runbook;
- revisión de seguridad independiente;
- evidencia no sensible y aprobación del Product Owner.

## Consequences

### Positive

- La arquitectura puede avanzar sin inventar cuentas, precios o acuerdos.
- Los módulos evolucionan mediante adapters y extensiones compatibles.
- Las activaciones pendientes quedan visibles y verificables.
- El estado del repositorio no exagera la preparación operativa.

### Costs and constraints

- Algunas pruebas end-to-end reales solo podrán ejecutarse al activar el proveedor.
- El equipo deberá mantener contratos y dobles de prueba alineados con APIs externas cambiantes.
- La aceptación de arquitectura o implementación local no equivale a release productivo.

## Rejected alternatives

- **Esperar todas las cuentas antes de diseñar:** paraliza la arquitectura y mezcla dependencias
  comerciales con decisiones técnicas.
- **Crear integraciones temporales específicas:** contradice la foundation compatible y aumenta
  reescrituras.
- **Marcar mocks como integración completada:** produce evidencia falsa y riesgos de operación.
- **Guardar pendientes solo en conversaciones:** rompe la continuidad del repositorio.

## Follow-up

- Mantener el registro vivo con cada PRD y PCR.
- Añadir al plan de cada módulo los criterios de construcción local y activación externa por
  separado.
- No cerrar el gate `Release` de una capacidad dependiente hasta completar su activación aplicable.
