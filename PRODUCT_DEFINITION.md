# Definición canónica del producto

- Owner: Product Owner
- Status: Approved product definition
- Update rule: cualquier cambio requiere decisión numerada, actualización del Master PRD y aprobación del Product Owner

## Producto

**SG Solutions Platform** es una aplicación web profesional para vender y operar los servicios de SG Solutions. La marca pública es **SG Solutions**. `Project Atlas` y `SG Solutions Operating System` son nombres internos y una metáfora organizativa; no describen un sistema operativo real.

La plataforma no es un SaaS comercial licenciado a terceros, una aplicación instalable, 110 aplicaciones ni 110 microservicios. Sirve exclusivamente a SG Solutions, su equipo y sus clientes con acceso delegado. No incluye multi-tenancy ni white-label.

## Tres superficies de una misma plataforma

| Superficie | Ruta lógica | Propósito | Navegación |
|---|---|---|---|
| Public Website | `/` | Vender, educar, captar leads, recibir formularios, orientar, agendar y admitir pagos iniciales. | Inicio; About/SG Solutions; Servicios; Precios; FAQ/Help Center; Contacto; Public Forms; Public Chat. Bajo **Servicios** viven Crédito, Credit Monitoring, Taxes, Business Formation, EIN, Business Compliance, Business Funding, Home Buying Assistance y Financial Marketplace. |
| Client Portal | `/client` | Dar seguimiento y colaboración segura al cliente. | Inicio; Mis servicios; Estado de procesos; Documentos; Citas; Mensajes; Pagos; Centro de ayuda; Configuración. Tareas vive dentro de Inicio, Mis servicios o Estado; Perfil vive dentro de Configuración. |
| Admin/Internal | `/admin` | Operar la empresa y controlar personas, trabajo, dinero, riesgos y resultados. | Dashboard; Clientes; CRM; Servicios; Marketplace; Documentos; Calendario; Comunicaciones; AI Hub; Aprobaciones; Reportes; Configuración. Leads, Businesses, Service Orders, Cases, Tasks, Payments, Appointments, Credit, Taxes, Business Formation, Business Funding, Home Buying, Partners y Administration se anidan bajo estas áreas. |

La separación física aprobada se mantiene: Astro en `apps/www` para el sitio público y Next.js App Router en `apps/app` para las superficies autenticadas. El edge o hosting puede enrutar `/client` y `/admin`; esto no transforma las superficies en productos independientes.

## Modelo de producto y operación

- Organización única: SG Solutions LLC, inicialmente operada por su dueño en Illinois.
- CTA principal: **Agenda una evaluación**. CTA secundario: **Solicita una cotización**.
- La cuenta del cliente nace de una relación comercial; no es la primera conversión.
- Stripe gestiona cobros de servicios, no una suscripción para usar la plataforma.
- La primera familia de entrega es **Release 1 — Production Foundation**, dividida en **Release 1A — Minimum Real-Client Operations** y **Release 1B — Operational Maturity**. 1A es funcionalmente acotada, apta para clientes reales y extensible hacia 1B sin reescritura desechable.
- El primer vertical completo al cierre de Release 1B es **Business Formation**; Release 1A lo opera de forma manual y segura sobre las primitivas comunes.

## Arquitectura de producto

El sistema es un **monolito modular** con límites de dominio claros y una base transaccional central. Las capacidades compartidas son primitivas de plataforma: `Client`, `Person`, `Household`, `Organization`, `Business`, `ServiceOrder`, `CaseFile`, `Document`, `Task`, `Appointment`, `Message`, `Payment`, `Consent`, `Approval`, `AuditEvent` y `Workflow`.

Cada vertical extiende estas primitivas y conserva sus reglas específicas; no duplica clientes, expedientes, documentos, tareas, pagos ni auditoría. Un microservicio solo podrá proponerse mediante ADR si existe una frontera demostrable de escala, seguridad, despliegue, hardware, aislamiento de fallos o runtime.

Las integraciones se conectan por interfaces de proveedor y adapters reemplazables. Postgres conserva el estado operacional. Stripe es la autoridad financiera externa. La confirmación de un pago no equivale a una autorización humana. La IA es una capacidad asistiva: nunca es autoridad de negocio, cumplimiento, desembolso, aprobación o acceso.

## Precios y partners

El motor de precios nace en la foundation. Cada servicio usa uno de cuatro modos:

- `public`: precio exacto aprobado para publicación.
- `from`: precio inicial aprobado, acompañado de condiciones.
- `quote`: cotización personalizada.
- `consultation`: evaluación previa sin precio público.

La publicación está desactivada por defecto. El Product Owner activa cada precio o modalidad pública. Los partners pueden mostrar tasas o precios solo con fuente, fecha de vigencia y disclosures aplicables. Esta política supera la prohibición absoluta histórica de Decision 002 sin borrar su registro.

## Horizonte

Los 110 elementos del catálogo son módulos conceptuales, no aplicaciones independientes. La ejecución es cloud-first. Homelab, nodos locales, GPU y operación híbrida quedan para una fase posterior. Marketplace, partners y provider abstractions se reservan desde el diseño inicial para evitar acoplamiento, pero no amplían el alcance de Release 1.

## Autoridad documental

Este documento resuelve ambigüedades de definición del producto. `MASTER_PRD.md` gobierna requisitos; `ARCHITECTURE.md` gobierna estructura técnica; `docs/roadmap/MODULE_CATALOG.md` gobierna inventario y estado. Registrar un módulo no autoriza su implementación.
