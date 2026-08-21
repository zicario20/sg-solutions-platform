##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
##   
## MÓDULO 22 — CENTRO DE FORMULARIOS, INTAKE Y CUESTIONARIOS DINÁMICOS  
## SG Solutions Operating System  
**Versión:** 1.0.0 **Estado:** Especificación inicial aprobada **Tipo de documento:** Requisitos funcionales, arquitectura de formularios dinámicos, intake, validación, versionado, seguridad, integraciones, auditoría e instrucciones para Codex **Proyecto base:** Aplicación web existente de SG Solutions **Audiencia:** Codex, desarrolladores, diseñadores, responsables de producto, operaciones, especialistas, seguridad y cumplimiento **Idiomas públicos:** Español e inglés **Idioma del código:** Inglés  
   
⸻  
   
## 1. Contexto obligatorio  
Este módulo deberá integrarse dentro de la aplicación web existente de SG Solutions.  
No deberá construirse como:  
* una aplicación de formularios independiente;  
* un segundo sistema de intake;  
* una colección de formularios hardcodeados;  
* una página distinta creada manualmente para cada servicio;  
* una base de datos que almacene todas las respuestas únicamente como JSON libre;  
* un sistema que sobrescriba perfiles automáticamente;  
* un sistema que considere cada respuesta como verificada;  
* una solución que duplique datos del CRM;  
* una solución que duplique el Perfil Financiero y Empresarial;  
* una herramienta que permita al frontend definir campos sensibles;  
* un sistema que permita a la IA crear formularios públicos sin revisión;  
* una plataforma que almacene contraseñas o credenciales de terceros;  
* una vía para recibir números completos de tarjeta;  
* una herramienta que permita adjuntar archivos sin pasar por cuarentena;  
* un sistema sin versionado;  
* una solución donde los cambios en un formulario alteren envíos históricos;  
* una plataforma que exponga respuestas de otros clientes;  
* un sistema que genere un servicio activo por completar un formulario;  
* una interfaz que confunda intake con aprobación;  
* una solución que no permita guardar progreso;  
* un conjunto de formularios sin permisos ni consentimiento;  
* una herramienta de encuestas genérica desconectada de workflows;  
* un sistema que permita editar silenciosamente respuestas ya enviadas;  
* una plataforma donde la IA pueda modificar respuestas firmadas;  
* una solución sin auditoría ni retención.  
Antes de implementar, Codex deberá inspeccionar:  
* formularios actuales;  
* páginas de contacto;  
* formularios de onboarding;  
* cuestionarios de elegibilidad;  
* formularios de crédito;  
* intake tributario;  
* formularios de LLC;  
* formularios de funding;  
* formularios de Home Buying;  
* formularios públicos;  
* formularios autenticados;  
* CRM;  
* perfiles;  
* organizaciones;  
* órdenes de servicio;  
* expedientes;  
* documentos;  
* consentimientos;  
* firmas;  
* pagos;  
* citas;  
* workflows;  
* traducciones;  
* validaciones;  
* campos personalizados;  
* almacenamiento;  
* auditoría;  
* APIs;  
* webhooks;  
* analytics;  
* funcionalidades incompletas.  
Si ya existe una infraestructura de formularios, deberá reutilizarse, normalizarse o refactorizarse.  
No crear un motor paralelo sin necesidad demostrada.  
   
⸻  
   
## 2. Propósito del módulo  
El Centro de Formularios, Intake y Cuestionarios Dinámicos será la infraestructura central para recopilar información de prospectos, clientes, representantes y usuarios internos.  
Deberá permitir:  
1. Crear formularios configurables.  
2. Crear cuestionarios de elegibilidad.  
3. Crear intake por servicio.  
4. Crear onboarding.  
5. Crear formularios internos.  
6. Crear formularios públicos.  
7. Crear formularios por invitación.  
8. Guardar progreso.  
9. Reanudar.  
10. Validar.  
11. Mostrar campos condicionales.  
12. Prellenar información.  
13. Solicitar documentos.  
14. Solicitar consentimientos.  
15. Solicitar firmas.  
16. Crear leads.  
17. Crear oportunidades.  
18. Crear borradores de órdenes.  
19. Proponer actualizaciones al perfil.  
20. Crear tareas.  
21. Evaluar completitud.  
22. Mantener versiones.  
23. Mantener historial.  
24. Proteger información sensible.  
25. Facilitar revisión humana.  
26. Permitir formularios bilingües.  
27. Facilitar cambios sin modificar código.  
28. Integrarse con workflows.  
29. Integrarse con agentes de IA de forma limitada.  
30. Mantener trazabilidad de cada dato.  
El módulo deberá responder:  
¿Qué información necesitamos, por qué la necesitamos, quién la proporcionó y qué puede hacer el sistema después de recibirla?  
   
⸻  
   
## 3. Principio central  
Un formulario no deberá ser únicamente una colección de campos.  
Cada formulario deberá tener:  
* propósito;  
* audiencia;  
* servicio;  
* versión;  
* sensibilidad;  
* estado;  
* reglas;  
* destino de datos;  
* consentimiento;  
* workflow;  
* retención;  
* permisos.  
Ejemplo correcto:  
```
Formulario:
Intake de formación de LLC

Servicio:
Illinois LLC Formation

Versión:
3

Propósito:
Recopilar información necesaria para preparar el expediente.

Resultado:
Crear propuesta de actualización de organización y tarea de revisión interna.

```
Ejemplo incorrecto:  
```
Form 19

```
   
⸻  
   
## 4. Diferencia entre conceptos  
## Form Definition  
Define la estructura y comportamiento.  
## Form Version  
Representa una versión inmutable del formulario.  
## Form Session  
Representa una sesión de llenado.  
## Form Submission  
Representa un envío formal.  
## Form Response  
Representa la respuesta a un campo.  
## Intake  
Proceso de recopilación asociado a un servicio.  
## Questionnaire  
Formulario orientado a evaluación o clasificación.  
## Eligibility Form  
Recopila datos para reglas preliminares.  
## Onboarding Form  
Recopila información necesaria para iniciar la relación.  
## Internal Review Form  
Permite a empleados registrar revisión estructurada.  
Estos conceptos deberán mantenerse separados.  
   
⸻  
   
## 5. Objetivos  
## 5.1 Objetivos principales  
* Centralizar formularios.  
* Evitar duplicación.  
* Permitir configuración.  
* Mantener versiones.  
* Guardar progreso.  
* Mejorar calidad de datos.  
* Facilitar intake.  
* Facilitar elegibilidad.  
* Facilitar onboarding.  
* Proteger información.  
* Mantener trazabilidad.  
* Integrar perfiles y workflows.  
## 5.2 Objetivos secundarios  
* Reducir formularios abandonados.  
* Reducir preguntas repetidas.  
* Facilitar análisis.  
* Facilitar agentes.  
* Facilitar revisión.  
* Facilitar traducciones.  
* Facilitar cambios operativos.  
* Facilitar reportes.  
* Mejorar accesibilidad.  
* Preparar formularios para nuevos servicios.  
   
⸻  
   
## 6. Tipos de formularios  
El sistema deberá soportar:  
```
public_contact
lead_capture
service_interest
eligibility
prequalification
consultation_intake
service_intake
client_onboarding
business_onboarding
tax_intake
credit_intake
business_formation_intake
funding_intake
home_buying_intake
document_collection
profile_update
representative_authorization
consent
signature
review
approval
complaint
support
cancellation
refund_request
renewal
internal_assessment
custom

```
   
⸻  
   
## 7. Audiencias  
```
public
anonymous_visitor
prospect
registered_user
active_client
business_client
authorized_representative
partner
staff
specialist
compliance
invitation_only
custom

```
La audiencia no sustituye autorización.  
   
⸻  
   
## 8. Canales  
Los formularios podrán abrirse desde:  
```
website
client_portal
admin_portal
web_chat
whatsapp_link
email_link
sms_link
phone_agent
social_media
partner_portal
embedded_widget
secure_invitation
internal_workflow

```
No todos los formularios deberán estar disponibles en todos los canales.  
   
⸻  
   
## 9. Estados de definición  
```
draft
under_review
approved
published
paused
unpublished
retired
archived

```
Una definición publicada no deberá editarse directamente.  
Los cambios deberán crear una nueva versión.  
   
⸻  
   
## 10. Estados de sesión  
```
created
started
in_progress
saved
awaiting_verification
awaiting_documents
awaiting_signature
ready_to_submit
submitted
expired
cancelled
locked

```
   
⸻  
   
## 11. Estados de submission  
```
received
processing
validation_failed
under_review
accepted
partially_accepted
correction_required
rejected
superseded
withdrawn
archived

```
Un formulario enviado no deberá considerarse aceptado automáticamente.  
   
⸻  
   
## 12. Alcance funcional  
El módulo incluirá:  
* definiciones;  
* versiones;  
* secciones;  
* campos;  
* reglas;  
* validaciones;  
* prellenado;  
* guardado;  
* reanudación;  
* autosave;  
* uploads;  
* consentimientos;  
* firmas;  
* cálculos;  
* lógica condicional;  
* repeticiones;  
* tablas;  
* revisión;  
* corrección;  
* invitaciones;  
* tokens;  
* expiración;  
* traducciones;  
* accesibilidad;  
* workflows;  
* perfiles;  
* CRM;  
* organizaciones;  
* documentos;  
* tareas;  
* notificaciones;  
* auditoría;  
* analytics;  
* importación;  
* exportación;  
* simulación;  
* testing;  
* fallbacks.  
   
⸻  
   
## 13. Fuera de alcance  
El módulo no deberá:  
* ejecutar servicios sensibles;  
* presentar filings;  
* presentar taxes;  
* enviar disputas;  
* solicitar préstamos;  
* aprobar elegibilidad definitiva;  
* modificar pagos;  
* emitir refunds;  
* almacenar tarjetas;  
* almacenar contraseñas;  
* almacenar credenciales de partners;  
* sustituir Document Service;  
* sustituir CRM;  
* sustituir Perfil Financiero;  
* sustituir workflows;  
* permitir que la IA publique formularios;  
* permitir que respuestas alteren datos verificados sin revisión;  
* permitir que el cliente cambie formularios ya firmados;  
* crear órdenes activas sin workflow;  
* confiar en campos ocultos;  
* aceptar uploads sin validación;  
* exponer datos entre usuarios.  
   
⸻  
   
## 14. Navegación administrativa  
Ruta sugerida:  
```
/admin/forms

```
Subsecciones:  
```
Formularios
Versiones
Envíos
Sesiones incompletas
Plantillas
Campos reutilizables
Reglas
Traducciones
Invitaciones
Calidad de datos
Configuración

```
Detalle:  
```
/admin/forms/[formDefinitionId]
/admin/forms/[formDefinitionId]/versions/[versionId]
/admin/form-submissions/[submissionId]

```
   
⸻  
   
## 15. Navegación pública y del cliente  
Rutas sugeridas:  
```
/forms/[publicSlug]
/forms/invitation/[secureToken]
/account/forms
/account/forms/[formSessionId]
/account/services/[serviceOrderId]/forms

```
La estructura final deberá respetar el routing existente.  
   
⸻  
   
## 16. Form Definition  
Campos conceptuales:  
```
id
code
internalName
publicName
formType
status
audience
serviceDefinitionId
workflowDefinitionId
requiresAuthentication
requiresInvitation
saveProgress
allowMultipleSubmissions
submissionPolicy
expirationPolicy
sensitivity
currentVersionId
createdAt
updatedAt

```
   
⸻  
   
## 17. Código estable  
Ejemplos:  
```
IL_LLC_INTAKE
TAX_1040_INTAKE
CREDIT_REPORT_REVIEW_INTAKE
BUSINESS_FUNDING_READINESS
USDA_HOME_BUYING_ASSESSMENT
CLIENT_ONBOARDING
AUTHORIZED_REPRESENTATIVE_FORM

```
El código no deberá cambiar al modificar el nombre público.  
   
⸻  
   
## 18. Form Version  
Cada versión deberá ser inmutable después de publicarse.  
Campos:  
```
id
formDefinitionId
versionNumber
status
configurationSnapshot
changeSummary
effectiveFrom
effectiveTo
approvedBy
approvedAt
publishedAt
createdAt

```
   
⸻  
   
## 19. Cambios que requieren versión  
* añadir campo;  
* eliminar campo;  
* cambiar required;  
* cambiar validación;  
* cambiar destino;  
* cambiar consentimiento;  
* cambiar disclosure;  
* cambiar lógica;  
* cambiar cálculo;  
* cambiar sensibilidad;  
* cambiar documentos;  
* cambiar firma;  
* cambiar workflow.  
Cambios puramente visuales menores podrán tratarse según política.  
   
⸻  
   
## 20. Secciones  
Cada formulario podrá tener secciones.  
Ejemplos:  
```
Información personal
Información del hogar
Empleo
Ingresos
Deudas
Empresa
Objetivos
Documentos
Consentimientos
Revisión

```
Campos:  
```
id
formVersionId
code
title
description
sortOrder
layoutType
visibilityRuleId
completionRule

```
   
⸻  
   
## 21. Tipos de layout  
```
single_column
two_column
card
step
accordion
table
repeating_group
summary
review

```
El layout no deberá afectar validación backend.  
   
⸻  
   
## 22. Campos  
Tipos soportados:  
```
text
textarea
email
phone
number
integer
decimal
currency
percentage
date
datetime
time
boolean
checkbox
radio
single_select
multi_select
country
state
county
postal_code
address
name
ssn_masked
ein_masked
file_request
document_reference
signature_reference
calculated
read_only
hidden_system
repeating_group
table
relationship_selector
organization_selector
service_selector
appointment_selector

```
   
⸻  
   
## 23. Form Field  
Campos conceptuales:  
```
id
formSectionId
code
fieldType
label
description
placeholder
required
defaultValue
sensitivity
validationRuleSetId
visibilityRuleId
enablementRuleId
dataBinding
optionsSource
helpText
sortOrder

```
   
⸻  
   
## 24. Código del campo  
El código deberá ser estable.  
Ejemplo:  
```
legal_first_name
annual_income_approx
formation_state
target_county
has_self_employment
business_ownership_percentage

```
No depender del label para mapear datos.  
   
⸻  
   
## 25. Sensibilidad del campo  
```
public
basic
personal
confidential
financial
credit
tax
identity
legal
restricted

```
La sensibilidad afectará:  
* cifrado;  
* logs;  
* acceso;  
* prellenado;  
* exportación;  
* IA;  
* retención;  
* reautenticación.  
   
⸻  
   
## 26. Campos sensibles especiales  
Para campos como:  
* SSN;  
* ITIN;  
* EIN;  
* DOB;  
* cuentas;  
* identificadores;  
* información crediticia;  
* información tributaria;  
deberá aplicarse:  
* cifrado;  
* enmascaramiento;  
* mínimo acceso;  
* no analytics;  
* no logs;  
* no URLs;  
* no localStorage;  
* no envío innecesario a IA.  
   
⸻  
   
## 27. Campos ocultos del sistema  
Podrán usarse para:  
* referencia;  
* campaña;  
* source;  
* session ID;  
* service ID;  
* version;  
* secure token.  
No deberán confiarse si provienen del navegador.  
El backend deberá validar su valor.  
   
⸻  
   
## 28. Opciones  
Las opciones podrán provenir de:  
```
static_list
catalog
country_catalog
state_catalog
county_catalog
service_catalog
organization_list
relationship_catalog
partner_catalog
api_source
custom_provider

```
No hardcodear listas importantes en cada formulario.  
   
⸻  
   
## 29. Catálogos compartidos  
Ejemplos:  
* estados;  
* filing status;  
* entity types;  
* employment types;  
* income types;  
* debt types;  
* relationship types;  
* services;  
* document types.  
Los catálogos deberán ser versionados o administrados centralmente cuando corresponda.  
   
⸻  
   
## 30. Validaciones básicas  
Tipos:  
```
required
minimum_length
maximum_length
pattern
email
phone
minimum_value
maximum_value
date_range
allowed_values
file_type
file_size
decimal_precision
custom_domain_rule

```
   
⸻  
   
## 31. Validaciones de dominio  
Ejemplos:  
* ownership no negativo;  
* ownership total razonable;  
* end date posterior a start date;  
* EIN con formato;  
* income frequency válida;  
* state compatible;  
* tax year permitido;  
* edad mínima cuando corresponda;  
* documento vigente;  
* servicio existente.  
Estas validaciones deberán ejecutarse en backend.  
   
⸻  
   
## 32. Validación cruzada  
El sistema deberá validar relaciones entre campos.  
Ejemplos:  
```
IF employment_type = employed
THEN employer_name is required
IF entity_type = multi_member_llc
THEN at least two members required
IF has_self_employment = true
THEN business_income section required

```
   
⸻  
   
## 33. Reglas de visibilidad  
Ejemplo:  
```
IF target_state = IL
THEN show Illinois program section
IF filing_status = married_filing_jointly
THEN show spouse section

```
Las reglas deberán ejecutarse en frontend y backend.  
   
⸻  
   
## 34. Reglas de habilitación  
Un campo puede mostrarse pero permanecer deshabilitado hasta cumplir condiciones.  
Ejemplo:  
```
Document upload enabled
after
consent accepted

```
El backend deberá validar igualmente.  
   
⸻  
   
## 35. Reglas de requerimiento condicional  
Un campo podrá convertirse en obligatorio.  
Ejemplo:  
```
IF owns_business = true
THEN business_legal_name required

```
El estado required no deberá depender únicamente del frontend.  
   
⸻  
   
## 36. Repeating Groups  
El sistema deberá soportar grupos repetibles para:  
* dependientes;  
* ingresos;  
* empleos;  
* deudas;  
* activos;  
* owners;  
* members;  
* estados;  
* formularios fiscales;  
* propiedades;  
* vehículos;  
* cuentas.  
Cada ítem deberá tener ID estable.  
   
⸻  
   
## 37. Límites en grupos repetibles  
Definir:  
* mínimo;  
* máximo;  
* orden;  
* duplicados;  
* validación;  
* eliminación;  
* historial.  
No permitir listas ilimitadas sin control.  
   
⸻  
   
## 38. Tablas dinámicas  
Podrán usarse para:  
* ingresos;  
* gastos;  
* debts;  
* ownership;  
* tax documents;  
* business locations.  
La interfaz móvil deberá ofrecer una alternativa accesible a la tabla.  
   
⸻  
   
## 39. Cálculos  
Los formularios podrán calcular:  
* ingreso anualizado;  
* total de deudas;  
* DTI preliminar;  
* ownership total;  
* saldo;  
* completitud;  
* totals;  
* fechas.  
Los cálculos críticos deberán ejecutarse en backend.  
   
⸻  
   
## 40. Campos calculados  
Cada campo calculado deberá registrar:  
```
formulaCode
formulaVersion
inputFields
calculatedAt
result
precision
disclaimer

```
No usar el LLM para cálculos monetarios deterministas.  
   
⸻  
   
## 41. Prellenado  
Fuentes:  
* CRM;  
* Client Profile;  
* Business Profile;  
* Organization;  
* Service Order;  
* Case;  
* previous submission;  
* authenticated account;  
* approved partner data.  
El prellenado deberá mostrar datos actuales y permitir confirmación cuando corresponda.  
   
⸻  
   
## 42. Reglas de prellenado  
* no prellenar datos sin permiso;  
* no usar valores vencidos sin advertencia;  
* no sobrescribir datos ingresados;  
* mostrar fuente cuando sea importante;  
* evitar prellenar secretos;  
* registrar qué campos fueron prellenados.  
   
⸻  
   
## 43. Propuesta de actualización  
Cuando una respuesta difiera del perfil:  
```
Existing profile value
+ new form response
→ create ProfileUpdateProposal

```
No sobrescribir automáticamente datos verificados.  
   
⸻  
   
## 44. Profile Update Proposal  
Campos:  
```
id
submissionId
profileType
profileId
fieldCode
existingValueReference
proposedValueEncrypted
source
status
reviewedBy
reviewedAt
createdAt

```
Estados:  
```
pending
accepted
rejected
conflict
superseded

```
   
⸻  
   
## 45. Guardado de progreso  
El sistema deberá soportar:  
* autosave;  
* guardar manualmente;  
* reanudar;  
* sesión autenticada;  
* enlace seguro;  
* expiración;  
* múltiples dispositivos controlados.  
No almacenar datos sensibles en localStorage si puede evitarse.  
   
⸻  
   
## 46. Autosave  
El autosave deberá:  
* ser incremental;  
* usar idempotencia;  
* mostrar estado;  
* reintentar;  
* evitar perder datos;  
* manejar conflicto de versión;  
* no disparar workflow final.  
Estados UI:  
```
Guardando
Guardado
Sin conexión
Error al guardar

```
   
⸻  
   
## 47. Sesiones anónimas  
Para formularios públicos:  
* crear token temporal;  
* limitar sensibilidad;  
* evitar datos altamente sensibles;  
* permitir conversión a cuenta;  
* expirar;  
* proteger contra enumeración;  
* aplicar rate limit.  
Los formularios tributarios, crediticios o de identidad deberán preferir autenticación.  
   
⸻  
   
## 48. Invitaciones seguras  
Una invitación deberá:  
* estar firmada;  
* expirar;  
* limitar formulario;  
* limitar destinatario;  
* limitar uso;  
* poder revocarse;  
* registrar apertura;  
* registrar submission;  
* no exponer IDs internos.  
   
⸻  
   
## 49. Form Invitation  
Campos:  
```
id
formDefinitionId
formVersionId
recipientType
recipientId
serviceOrderId
caseId
secureTokenHash
status
expiresAt
maxUses
usedCount
createdBy
createdAt
revokedAt

```
   
⸻  
   
## 50. Estados de invitación  
```
created
sent
opened
in_progress
completed
expired
revoked
cancelled

```
   
⸻  
   
## 51. Expiración  
La política podrá depender de:  
* tipo;  
* sensibilidad;  
* servicio;  
* invitación;  
* estado;  
* workflow.  
Al expirar:  
* bloquear submission;  
* conservar draft según política;  
* permitir nueva invitación;  
* no perder historial;  
* notificar.  
   
⸻  
   
## 52. Reanudación  
El usuario deberá poder reanudar en la última sección válida.  
No deberá saltarse nuevas validaciones si cambió la versión.  
Una sesión iniciada con v1 deberá continuar con v1 salvo migración explícita.  
   
⸻  
   
## 53. Cambio de versión durante una sesión  
Opciones:  
```
continue_existing_version
require_restart
offer_migration
staff_review_required

```
La política deberá definirse por formulario.  
No migrar silenciosamente.  
   
⸻  
   
## 54. Submission  
Una submission deberá incluir:  
```
id
publicReference
formDefinitionId
formVersionId
formSessionId
submitterType
submitterId
clientId
contactId
organizationId
serviceOrderId
caseId
status
language
sourceChannel
submittedAt
createdAt
updatedAt

```
   
⸻  
   
## 55. Form Response  
```
id
submissionId
fieldCode
fieldVersionReference
valueEncrypted
normalizedValue
sensitivity
source
createdAt
updatedAt

```
No todos los valores deberán almacenarse en texto plano.  
   
⸻  
   
## 56. Respuesta original y normalizada  
Ejemplo:  
```
Original:
“55k aproximadamente”

Normalized:
55000 USD annual approximate

```
El valor original deberá conservarse.  
La normalización no deberá reemplazarlo.  
   
⸻  
   
## 57. Edición después del envío  
Políticas posibles:  
```
not_allowed
allowed_until_review
allowed_with_new_version
correction_request_only
staff_unlock_required

```
Los cambios deberán crear historial.  
No sobrescribir la submission original.  
   
⸻  
   
## 58. Corrección  
Cuando se requiera corrección:  
```
Submission reviewed
→ correction requested
→ fields unlocked
→ client updates
→ correction submitted
→ new review

```
Solo los campos autorizados deberán desbloquearse.  
   
⸻  
   
## 59. Form Correction Request  
Campos:  
```
id
submissionId
requestedFields
reasonCodes
clientVisibleMessage
internalNote
requestedBy
requestedAt
dueAt
status
completedAt

```
   
⸻  
   
## 60. Revisión interna  
El reviewer podrá:  
* ver respuestas;  
* ver fuentes;  
* ver conflictos;  
* aceptar;  
* rechazar;  
* solicitar corrección;  
* proponer actualización;  
* crear tarea;  
* vincular documentos;  
* registrar outcome.  
El acceso deberá depender del área y propósito.  
   
⸻  
   
## 61. Estados de revisión  
```
not_started
assigned
in_review
waiting_for_client
waiting_for_document
accepted
partially_accepted
rejected
escalated

```
   
⸻  
   
## 62. Internal Review Form  
Podrá existir un formulario estructurado para empleados.  
Ejemplo:  
```
Identity reviewed
Address reviewed
Service appears in scope
Payment confirmed
Documents sufficient
Escalation required

```
Las decisiones deberán usar campos estructurados.  
   
⸻  
   
## 63. Documentos  
Los uploads deberán usar el Módulo 11.  
El formulario podrá:  
* crear DocumentRequest;  
* mostrar estado;  
* permitir upload;  
* vincular documento;  
* requerir aceptación;  
* mostrar corrección.  
No almacenar archivos directamente dentro del submission.  
   
⸻  
   
## 64. File Request Field  
No deberá representar un blob.  
Deberá crear o vincular:  
```
DocumentRequest
Document
DocumentVersion

```
   
⸻  
   
## 65. Upload durante formulario  
Pipeline:  
```
Select file
→ upload to quarantine
→ validate
→ antivirus
→ create document
→ link to form session
→ show processing state

```
No permitir submit final si un documento obligatorio continúa fallando.  
   
⸻  
   
## 66. Consentimientos  
El formulario podrá incluir:  
* términos;  
* privacidad;  
* electronic communications;  
* partner data sharing;  
* AI-assisted processing;  
* credit monitoring;  
* call recording;  
* marketing;  
* service-specific disclosures.  
Cada consentimiento deberá usar un registro versionado.  
   
⸻  
   
## 67. Consent Field  
No deberá almacenar únicamente true.  
Deberá vincularse a:  
```
ConsentDefinition
ConsentVersion
ConsentRecord

```
y registrar:  
* versión;  
* fecha;  
* idioma;  
* actor;  
* source;  
* IP cuando sea apropiado;  
* user agent;  
* alcance.  
   
⸻  
   
## 68. Firmas  
El formulario podrá iniciar firma mediante DocuSeal u otro proveedor.  
No deberá capturar una firma dibujada sin considerar requisitos del documento.  
La firma deberá vincularse con:  
* template;  
* document;  
* signer;  
* version;  
* evidence;  
* certificate.  
   
⸻  
   
## 69. Firma antes del envío  
Un formulario podrá requerir:  
```
complete form
→ generate document
→ review
→ sign
→ submission complete

```
No marcar como completado si la firma requerida está pendiente.  
   
⸻  
   
## 70. Formularios tributarios  
El intake tributario deberá soportar:  
* tax year;  
* filing status;  
* income types;  
* dependents;  
* state returns;  
* self-employment;  
* notices;  
* prior returns;  
* documents;  
* preparer questions.  
No deberá calcular la declaración final dentro del formulario general.  
   
⸻  
   
## 71. Formularios de crédito  
Podrán recopilar:  
* objetivos;  
* report availability;  
* provider;  
* accounts questioned;  
* identity concerns;  
* addresses;  
* supporting documents;  
* consent.  
No deberán afirmar que una cuenta es disputable solo por selección del cliente.  
   
⸻  
   
## 72. Business Formation Intake  
Podrá recopilar:  
* proposed name;  
* formation state;  
* entity type;  
* business purpose;  
* owners;  
* management;  
* addresses;  
* registered agent;  
* effective date;  
* tax classification preference;  
* EIN information.  
No deberá presentar la empresa ni solicitar EIN directamente.  
   
⸻  
   
## 73. Funding Intake  
Podrá recopilar:  
* organization;  
* funding goal;  
* use of funds;  
* revenue;  
* time in business;  
* bank statements;  
* credit range;  
* debt;  
* requested amount;  
* urgency;  
* partner consent.  
No deberá prometer aprobación.  
   
⸻  
   
## 74. Home Buying Intake  
Podrá recopilar:  
* target state;  
* county;  
* household;  
* income;  
* debts;  
* first-time buyer;  
* savings;  
* employment;  
* property goal;  
* program interests;  
* lender status.  
El resultado deberá ser preliminar.  
   
⸻  
   
## 75. Elegibilidad  
Después del submission, el sistema podrá invocar el Eligibility Engine.  
Salida:  
```
potentially_eligible
requires_review
missing_information
not_available

```
No usar approved salvo confirmación oficial del proveedor.  
   
⸻  
   
## 76. Score de completitud  
Cada formulario podrá mostrar:  
* secciones completas;  
* campos faltantes;  
* documentos faltantes;  
* firmas pendientes.  
No utilizar un porcentaje como score de elegibilidad.  
   
⸻  
   
## 77. Próximo paso  
Después del envío, el sistema deberá determinar:  
* crear lead;  
* crear tarea;  
* solicitar documento;  
* solicitar cita;  
* enviar a revisión;  
* crear quote draft;  
* mostrar recurso;  
* indicar no disponibilidad;  
* crear onboarding item.  
No iniciar automáticamente acciones sensibles.  
   
⸻  
   
## 78. Submission Action  
Valores:  
```
create_lead
update_lead
create_interest
request_review
run_preliminary_eligibility
create_quote_request
create_onboarding
create_document_requests
create_task
schedule_appointment
create_service_order_draft
no_automatic_action
custom_workflow_event

```
   
⸻  
   
## 79. Integración con CRM  
Un formulario podrá:  
* buscar contacto;  
* crear contacto;  
* actualizar datos básicos;  
* crear lead;  
* actualizar intención;  
* registrar source;  
* crear activity;  
* detectar duplicado.  
No crear un nuevo contacto por cada submission.  
   
⸻  
   
## 80. Matching de contacto  
Usar:  
* authenticated user;  
* invitation;  
* verified email;  
* verified phone;  
* existing client;  
* secure token;  
* deduplication engine.  
No vincular únicamente por nombre.  
   
⸻  
   
## 81. Integración con Perfil Financiero  
Las respuestas podrán generar propuestas para:  
* empleo;  
* income;  
* debts;  
* assets;  
* household;  
* housing;  
* business.  
No sobrescribir datos verificados.  
   
⸻  
   
## 82. Integración con Organizations  
El intake empresarial podrá:  
* crear organización propuesta;  
* actualizar propuesta;  
* crear ownership proposals;  
* crear role proposals;  
* solicitar revisión.  
No marcarla activa.  
   
⸻  
   
## 83. Integración con Service Orders  
El formulario podrá vincularse a una orden existente.  
O podrá crear:  
```
ServiceOrderDraft

```
solo cuando el catálogo y workflow lo permitan.  
No crear una orden activa automáticamente.  
   
⸻  
   
## 84. Integración con Case Files  
El formulario podrá vincularse a un expediente.  
Ejemplos:  
* intake inicial;  
* actualización;  
* review form;  
* correction form.  
El submission deberá conservar su referencia.  
   
⸻  
   
## 85. Integración con Tasks  
El módulo deberá usar el motor central de tareas.  
Ejemplos:  
* review submission;  
* request correction;  
* verify document;  
* contact client;  
* prepare quote;  
* schedule consultation.  
   
⸻  
   
## 86. Integración con Appointments  
Un formulario podrá:  
* mostrar opciones;  
* crear cita;  
* requerir cita;  
* registrar preference;  
* crear callback.  
La disponibilidad deberá provenir del Módulo 13.  
   
⸻  
   
## 87. Integración con Billing  
Un formulario podrá:  
* solicitar quote;  
* crear order draft;  
* iniciar checkout después de validación.  
No deberá recibir datos de tarjeta.  
   
⸻  
   
## 88. Integración con Marketplace  
Podrá:  
* recopilar interés;  
* obtener partner consent;  
* crear referral draft;  
* mostrar disclosure.  
No deberá enviar datos sin DataSharingGrant.  
   
⸻  
   
## 89. Integración con AI Hub  
La IA podrá:  
* sugerir preguntas;  
* resumir submission;  
* identificar campos faltantes;  
* clasificar texto libre;  
* proponer mapeos;  
* detectar inconsistencias.  
No podrá:  
* publicar formularios;  
* cambiar respuestas;  
* aceptar submissions;  
* aprobar elegibilidad;  
* otorgar servicios;  
* enviar datos a partners.  
   
⸻  
   
## 90. AI Tools permitidas  
```
get_form_definition()
get_form_session_summary()
identify_missing_fields()
summarize_form_submission()
classify_free_text_response()
propose_profile_updates()
detect_possible_conflicts()
draft_client_correction_message()

```
   
⸻  
   
## 91. AI Tools prohibidas  
```
publish_form()
modify_submitted_response()
approve_submission()
mark_identity_verified()
create_active_service()
share_form_with_partner()
grant_consent()
sign_for_client()
override_validation()

```
   
⸻  
   
## 92. Texto libre  
Los campos abiertos deberán tratarse como datos no confiables.  
Proteger contra:  
* prompt injection;  
* scripts;  
* HTML;  
* SQL fragments;  
* malicious links;  
* oversized content;  
* secrets.  
Sanitizar antes de mostrar.  
   
⸻  
   
## 93. Normalización asistida por IA  
La IA podrá proponer:  
```
Raw response:
“I work at the pork plant in Beardstown”

Suggested employer:
JBS

Suggested location:
Beardstown, Illinois

```
La propuesta deberá requerir confirmación o revisión cuando sea relevante.  
   
⸻  
   
## 94. Traducción asistida  
El formulario deberá tener traducciones aprobadas.  
La IA podrá asistir en borradores internos.  
No traducir dinámicamente textos legales publicados sin revisión.  
   
⸻  
   
## 95. Idioma  
Cada sesión deberá registrar:  
* preferred language;  
* displayed language;  
* submission language;  
* translation version.  
El cliente podrá cambiar entre español e inglés sin perder progreso cuando sea posible.  
   
⸻  
   
## 96. Mensajes de error  
Deben:  
* explicar el problema;  
* indicar el campo;  
* no culpar al usuario;  
* no revelar detalles técnicos;  
* conservar datos;  
* estar traducidos;  
* ser accesibles.  
Ejemplo:  
Introduce una fecha válida en formato mes, día y año.  
   
⸻  
   
## 97. Experiencia por pasos  
Para formularios largos:  
```
Step 1 — Basic information
Step 2 — Service details
Step 3 — Financial information
Step 4 — Documents
Step 5 — Consent
Step 6 — Review

```
Mostrar progreso sin obligar a completarlo todo de una vez.  
   
⸻  
   
## 98. Review Screen  
Antes de enviar:  
* mostrar resumen;  
* ocultar parcialmente datos sensibles;  
* permitir editar;  
* mostrar documentos;  
* mostrar consentimientos;  
* advertir campos faltantes;  
* confirmar envío.  
   
⸻  
   
## 99. Confirmación  
Después de enviar:  
* referencia;  
* estado;  
* siguiente paso;  
* tiempo estimado solo si existe política;  
* enlace al portal;  
* tarea;  
* cita;  
* soporte.  
No presentar el servicio como iniciado si todavía requiere revisión.  
   
⸻  
   
## 100. Notificaciones  
Eventos:  
* invitación;  
* formulario iniciado;  
* progreso guardado;  
* recordatorio;  
* submission recibida;  
* corrección;  
* aceptado;  
* rechazado;  
* expiración;  
* firma pendiente.  
No incluir respuestas sensibles.  
   
⸻  
   
## 101. Recordatorios  
Podrán enviarse por:  
* email;  
* portal;  
* WhatsApp con consentimiento;  
* SMS futuro.  
Reglas:  
* frecuencia limitada;  
* no enviar después de submit;  
* respetar opt-out;  
* evitar contenido sensible;  
* expirar correctamente.  
   
⸻  
   
## 102. Abandono  
El sistema podrá detectar:  
* formulario iniciado;  
* progreso parcial;  
* última actividad;  
* campos completados;  
* expiración.  
No deberá usar esta información para marketing sin consentimiento.  
   
⸻  
   
## 103. Analytics  
Eventos:  
```
form_viewed
form_started
form_step_viewed
form_field_error
form_saved
form_resumed
form_abandoned
form_document_requested
form_document_uploaded
form_review_viewed
form_submitted
form_submission_failed
form_correction_requested
form_correction_completed

```
No enviar valores de campos.  
   
⸻  
   
## 104. Métricas operativas  
* sesiones;  
* completion rate;  
* abandonment rate;  
* tiempo;  
* errores;  
* campos problemáticos;  
* submissions;  
* correcciones;  
* revisión;  
* idiomas;  
* canales;  
* documentos;  
* firmas;  
* formularios vencidos;  
* duplicados.  
   
⸻  
   
## 105. Calidad de datos  
Detectar:  
* campos incompatibles;  
* formato inválido;  
* duplicados;  
* valores extremos;  
* fechas imposibles;  
* ownership inconsistente;  
* income inconsistente;  
* documentos faltantes;  
* respuestas contradictorias;  
* datos vencidos;  
* source desconocida.  
   
⸻  
   
## 106. Panel de calidad  
Mostrar:  
```
Submissions with conflicts
Submissions awaiting review
Forms with high abandonment
Fields with frequent errors
Forms with outdated translations
Invitations expiring
Forms without workflow
Forms without retention policy

```
   
⸻  
   
## 107. Administración de formularios  
El panel deberá permitir:  
* crear;  
* clonar;  
* versionar;  
* añadir secciones;  
* añadir campos;  
* definir reglas;  
* definir validaciones;  
* definir data binding;  
* definir consentimientos;  
* definir documentos;  
* definir firma;  
* previsualizar;  
* simular;  
* traducir;  
* aprobar;  
* publicar;  
* pausar;  
* retirar;  
* comparar versiones;  
* revisar submissions.  
   
⸻  
   
## 108. Editor visual  
El editor podrá permitir drag-and-drop, pero deberá generar configuración estructurada.  
No deberá permitir:  
* scripts personalizados arbitrarios;  
* HTML inseguro;  
* validaciones solo frontend;  
* campos sin código;  
* publicación sin revisión.  
   
⸻  
   
## 109. Campos reutilizables  
Ejemplos:  
* legal name;  
* address;  
* phone;  
* income;  
* employer;  
* organization;  
* ownership;  
* consent.  
Un componente reutilizable deberá poder tener distintas reglas según formulario.  
   
⸻  
   
## 110. Plantillas  
Plantillas iniciales:  
* contact form;  
* lead form;  
* client onboarding;  
* LLC intake;  
* tax intake;  
* credit intake;  
* funding intake;  
* home buying intake;  
* correction form;  
* review form.  
Las plantillas no deberán sustituir definiciones versionadas.  
   
⸻  
   
## 111. Preview  
Deberá permitir:  
* desktop;  
* tablet;  
* mobile;  
* español;  
* inglés;  
* anonymous;  
* authenticated;  
* invitation;  
* prefilled;  
* errors;  
* conditional flows;  
* screen reader labels.  
   
⸻  
   
## 112. Simulador  
Deberá permitir probar:  
* condiciones;  
* validaciones;  
* prefill;  
* autosave;  
* documents;  
* consent;  
* signature;  
* submission;  
* workflow event;  
* profile update proposals.  
Usar datos ficticios.  
   
⸻  
   
## 113. Publicación  
Checklist:  
```
Purpose defined
Audience defined
Translations complete
Fields coded
Validation complete
Conditional logic tested
Data binding reviewed
Sensitivity assigned
Consent linked
Documents linked
Signature linked
Workflow linked
Retention assigned
Permissions reviewed
Mobile tested
Accessibility tested
Security tested

```
   
⸻  
   
## 114. Permisos  
```
forms.definition.read
forms.definition.create
forms.definition.update
forms.definition.submit_review
forms.definition.approve
forms.definition.publish
forms.definition.pause
forms.definition.retire
forms.version.read
forms.session.read
forms.session.manage
forms.submission.read
forms.submission.review
forms.submission.request_correction
forms.submission.accept
forms.submission.reject
forms.invitation.create
forms.invitation.revoke
forms.translation.manage
forms.analytics.read
forms.export

```
   
⸻  
   
## 115. Segregación de funciones  
Idealmente:  
* diseñador crea;  
* especialista revisa contenido;  
* compliance revisa disclosures;  
* seguridad revisa sensibilidad;  
* owner aprueba publicación.  
Si una sola persona cumple varios roles, el owner override deberá auditarse.  
   
⸻  
   
## 116. Autorización por recurso  
Para ver una submission:  
```
User authenticated
AND
User has forms.submission.read
AND
User scope includes client or service
AND
Purpose allows field categories

```
No basta con conocer el ID.  
   
⸻  
   
## 117. Autorización por campo  
Un usuario puede ver la submission, pero no necesariamente todos los campos.  
Ejemplo:  
Support puede ver:  
* contact;  
* status;  
* appointment preference.  
No:  
* SSN;  
* tax income;  
* full credit information.  
El backend deberá filtrar campos.  
   
⸻  
   
## 118. Reautenticación  
Podrá requerirse para:  
* ver SSN;  
* ver EIN;  
* exportar;  
* modificar identity responses;  
* revisar representante;  
* ver submissions restricted;  
* desbloquear edición;  
* retirar consentimiento.  
   
⸻  
   
## 119. Seguridad  
Requisitos:  
* autenticación;  
* authorization backend;  
* CSRF;  
* CSP;  
* rate limiting;  
* anti-bot;  
* CAPTCHA cuando corresponda;  
* secure tokens;  
* encrypted fields;  
* no PII in logs;  
* no sensitive localStorage;  
* upload quarantine;  
* IDOR protection;  
* mass assignment protection;  
* schema validation;  
* safe rendering;  
* audit logging;  
* fail closed.  
   
⸻  
   
## 120. Protección anti-bot  
Aplicar según riesgo:  
* rate limit;  
* CAPTCHA;  
* email verification;  
* phone verification;  
* invitation token;  
* honeypot;  
* behavior analysis;  
* IP risk future.  
No añadir fricción excesiva a formularios autenticados.  
   
⸻  
   
## 121. Protección contra spam  
Detectar:  
* repeated submissions;  
* invalid emails;  
* malicious links;  
* automated text;  
* duplicate payload;  
* excessive size;  
* prohibited files.  
Los submissions sospechosos deberán marcarse, no mezclarse con leads normales.  
   
⸻  
   
## 122. Mass Assignment  
El backend deberá mapear únicamente campos permitidos.  
No permitir que el cliente envíe:  
```
status = accepted
paymentConfirmed = true
identityVerified = true
internalApproval = approved

```
   
⸻  
   
## 123. Prompt Injection  
Todo texto ingresado deberá considerarse no confiable.  
No deberá modificar:  
* prompts;  
* tool permissions;  
* workflows;  
* precio;  
* estado;  
* consentimiento;  
* identidad;  
* aprobación.  
   
⸻  
   
## 124. Cifrado  
Datos sensibles deberán cifrarse a nivel de aplicación cuando corresponda.  
Las claves deberán:  
* administrarse;  
* rotarse;  
* separarse;  
* tener acceso limitado;  
* proteger backups.  
   
⸻  
   
## 125. Logs  
No registrar:  
* respuestas completas;  
* SSN;  
* EIN;  
* DOB;  
* income details;  
* document content;  
* signed tokens;  
* invitation URLs;  
* signatures.  
Registrar:  
* form ID;  
* version;  
* session ID;  
* action;  
* result;  
* actor;  
* error code;  
* correlation ID.  
   
⸻  
   
## 126. Auditoría  
Eventos:  
```
form_definition_created
form_version_created
form_submitted_for_review
form_approved
form_published
form_paused
form_retired
form_session_created
form_started
form_saved
form_resumed
form_invitation_created
form_invitation_opened
form_invitation_revoked
form_submitted
form_submission_viewed
form_submission_reviewed
form_correction_requested
form_correction_submitted
form_submission_accepted
form_submission_rejected
form_sensitive_field_viewed
form_export_requested

```
   
⸻  
   
## 127. Retención  
Cada formulario deberá tener una política.  
Ejemplos:  
* lead capture no convertido;  
* client onboarding;  
* tax intake;  
* credit intake;  
* business formation;  
* rejected submission;  
* draft;  
* signed form.  
No conservar drafts anónimos indefinidamente.  
   
⸻  
   
## 128. Eliminación  
Distinguir:  
* delete draft;  
* expire session;  
* withdraw submission;  
* archive;  
* soft delete;  
* anonymize;  
* purge.  
No eliminar submission vinculada a:  
* servicio;  
* pago;  
* firma;  
* legal hold;  
* filing;  
* tax return;  
* dispute;  
* audit requirement.  
   
⸻  
   
## 129. Exportación  
Una exportación deberá:  
* requerir permiso;  
* aplicar field-level authorization;  
* redactar;  
* registrar motivo;  
* usar enlace temporal;  
* expirar;  
* auditarse.  
No exportar automáticamente toda la submission.  
   
⸻  
   
## 130. Modelo de datos conceptual  
## FormDefinition  
```
id
code
internalName
publicName
formType
status
audience
serviceDefinitionId
workflowDefinitionId
requiresAuthentication
requiresInvitation
saveProgress
allowMultipleSubmissions
submissionPolicy
expirationPolicyId
retentionPolicyId
sensitivity
currentVersionId
createdAt
updatedAt

```
## FormVersion  
```
id
formDefinitionId
versionNumber
status
configurationSnapshot
changeSummary
effectiveFrom
effectiveTo
approvedBy
approvedAt
publishedAt
createdAt

```
## FormSection  
```
id
formVersionId
code
title
description
layoutType
sortOrder
visibilityRuleId
completionRuleId

```
## FormField  
```
id
formSectionId
code
fieldType
label
description
placeholder
required
defaultValue
sensitivity
validationRuleSetId
visibilityRuleId
enablementRuleId
requirementRuleId
dataBinding
optionsSource
sortOrder

```
## FormRule  
```
id
formVersionId
code
ruleType
sourceFieldCode
operator
expectedValue
targetType
targetReference
action
priority

```
## FormSession  
```
id
formDefinitionId
formVersionId
status
submitterType
submitterId
clientId
contactId
organizationId
serviceOrderId
caseId
sourceChannel
language
secureTokenHash
startedAt
lastSavedAt
expiresAt
submittedAt
createdAt
updatedAt

```
## FormDraftResponse  
```
id
formSessionId
fieldCode
valueEncrypted
normalizedValue
sensitivity
updatedAt

```
## FormSubmission  
```
id
publicReference
formDefinitionId
formVersionId
formSessionId
submitterType
submitterId
clientId
contactId
organizationId
serviceOrderId
caseId
status
language
sourceChannel
submittedAt
createdAt
updatedAt

```
## FormResponse  
```
id
submissionId
fieldCode
fieldVersionReference
valueEncrypted
normalizedValue
sensitivity
source
createdAt

```
## FormInvitation  
```
id
formDefinitionId
formVersionId
recipientType
recipientId
serviceOrderId
caseId
secureTokenHash
status
expiresAt
maxUses
usedCount
createdBy
createdAt
revokedAt

```
## FormReview  
```
id
submissionId
reviewerId
status
reviewType
summary
internalNotesEncrypted
reviewedAt
createdAt
updatedAt

```
## FormCorrectionRequest  
```
id
submissionId
requestedFields
reasonCodes
clientVisibleMessage
internalNoteEncrypted
status
requestedBy
requestedAt
dueAt
completedAt

```
## ProfileUpdateProposal  
```
id
submissionId
profileType
profileId
fieldCode
proposedValueEncrypted
source
status
reviewedBy
reviewedAt
createdAt

```
   
⸻  
   
## 131. Arquitectura técnica  
```
Public Site / Client Portal / Admin Portal
        ↓
Form Renderer
        ↓
Forms API
        ↓
Authorization and Validation Layer
        ↓
Forms Service
        ├── Definitions
        ├── Versions
        ├── Sessions
        ├── Responses
        ├── Rules
        ├── Validation
        ├── Invitations
        ├── Submissions
        ├── Reviews
        ├── Corrections
        └── Data Mapping
        ↓
CRM / Profiles / Organizations / Services / Documents / Tasks / Workflows

```
   
⸻  
   
## 132. Form Renderer  
Responsabilidades:  
* cargar definición;  
* renderizar;  
* aplicar idioma;  
* mostrar condiciones;  
* validar UX;  
* autosave;  
* manejar uploads;  
* mostrar progreso;  
* review screen;  
* submit.  
No deberá contener reglas de negocio definitivas.  
   
⸻  
   
## 133. Forms Service  
Responsabilidades:  
* administrar definiciones;  
* administrar versiones;  
* validar;  
* guardar sesiones;  
* guardar submissions;  
* aplicar reglas;  
* mapear datos;  
* emitir eventos;  
* crear proposals;  
* aplicar permisos;  
* mantener auditoría;  
* coordinar integraciones.  
   
⸻  
   
## 134. DTOs  
Crear:  
```
FormDefinitionDto
FormRenderDto
FormSectionDto
FormFieldDto
FormSessionDto
FormSubmissionSummaryDto
FormSubmissionDetailDto
FormReviewDto
FormCorrectionRequestDto

```
Los DTOs deberán filtrar campos por permiso.  
   
⸻  
   
## 135. Eventos de dominio  
```
FormSessionCreated
FormStarted
FormSaved
FormResumed
FormSubmitted
FormValidationFailed
FormReviewStarted
FormCorrectionRequested
FormCorrectionSubmitted
FormSubmissionAccepted
FormSubmissionRejected
ProfileUpdateProposed
FormExpired

```
   
⸻  
   
## 136. Outbox e idempotencia  
Los submissions críticos deberán usar outbox o equivalente.  
Evitar:  
* dos leads;  
* dos tasks;  
* dos order drafts;  
* dos reviews;  
* dos document requests;  
* dos workflow events.  
   
⸻  
   
## 137. Fallbacks  
## CRM no disponible  
* guardar submission;  
* marcar sync pending;  
* no perder datos;  
* no afirmar lead creado.  
## Profile Service no disponible  
* crear proposal pendiente;  
* sincronizar después.  
## Document Service no disponible  
* mantener formulario;  
* bloquear upload requerido;  
* permitir guardar progreso.  
## Workflow no disponible  
* guardar submission;  
* crear alerta;  
* no iniciar servicio.  
## IA no disponible  
* formularios continúan funcionando.  
   
⸻  
   
## 138. Manejo de fallos parciales  
Ejemplo:  
```
Formulario enviado correctamente.
La actualización de tu perfil está pendiente.

```
No mostrar fallo total si el submission fue guardado.  
Tampoco marcar todo como completo si una dependencia crítica falló.  
   
⸻  
   
## 139. Caché  
Puede cachearse:  
* definiciones publicadas;  
* traducciones;  
* catálogos;  
* opciones;  
* layouts.  
No cachear por periodos largos:  
* sesiones;  
* permissions;  
* submissions;  
* invitations;  
* consent state;  
* dynamic availability.  
   
⸻  
   
## 140. Rendimiento  
Requisitos:  
* lazy loading;  
* autosave eficiente;  
* payloads pequeños;  
* compresión;  
* paginación de submissions;  
* índices;  
* no cargar documentos completos;  
* no cargar formularios enteros en listas;  
* mantener buen rendimiento móvil.  
   
⸻  
   
## 141. Accesibilidad  
* teclado;  
* labels;  
* fieldsets;  
* legends;  
* error summaries;  
* focus;  
* announcements;  
* contrast;  
* touch targets;  
* progress accessible;  
* conditional fields announced;  
* tables with mobile alternative;  
* no depender solo de placeholder;  
* no depender solo de color.  
   
⸻  
   
## 142. Internacionalización  
Todo deberá soportar:  
* español;  
* inglés.  
Incluye:  
* labels;  
* descriptions;  
* errors;  
* help text;  
* options;  
* sections;  
* consent;  
* review;  
* confirmation;  
* notifications.  
Los datos introducidos por el usuario no deberán traducirse automáticamente.  
   
⸻  
   
## 143. Testing funcional  
Probar:  
* public form;  
* authenticated form;  
* invitation;  
* autosave;  
* resume;  
* conditional fields;  
* repeating groups;  
* calculations;  
* prefill;  
* profile proposal;  
* documents;  
* consent;  
* signature;  
* submit;  
* correction;  
* review;  
* acceptance;  
* expiration;  
* multiple submissions.  
   
⸻  
   
## 144. Testing de seguridad  
Probar:  
* IDOR;  
* invitation token tampering;  
* expired token;  
* replay;  
* mass assignment;  
* hidden fields;  
* role tampering;  
* field authorization;  
* PII leakage;  
* logs;  
* localStorage;  
* upload malware;  
* XSS;  
* prompt injection;  
* CSRF;  
* bot abuse;  
* enumeration;  
* export access.  
   
⸻  
   
## 145. Testing de datos  
Probar:  
* duplicate responses;  
* conflicting profile data;  
* normalization;  
* ownership;  
* dates;  
* currency;  
* decimals;  
* conditional required fields;  
* missing fields;  
* stale prefill;  
* version mismatch;  
* form migration.  
   
⸻  
   
## 146. Testing de resiliencia  
Probar:  
* DB caída;  
* CRM caído;  
* profile caído;  
* document service caído;  
* workflow caído;  
* notification failure;  
* autosave retry;  
* network disconnect;  
* duplicate submit;  
* out-of-order event.  
   
⸻  
   
## 147. Testing de UX  
Probar:  
* mobile;  
* desktop;  
* tablet;  
* español;  
* inglés;  
* screen reader;  
* keyboard;  
* long forms;  
* slow network;  
* save and resume;  
* error recovery;  
* anonymous conversion;  
* expired invitation.  
   
⸻  
   
## 148. Criterios de aceptación  
El módulo estará listo cuando:  
1. Exista un motor central de formularios.  
2. Los formularios sean configurables.  
3. Los formularios estén versionados.  
4. Las versiones publicadas sean inmutables.  
5. Las sesiones puedan guardarse.  
6. Las sesiones puedan reanudarse.  
7. Los formularios soporten lógica condicional.  
8. Las validaciones ocurran en backend.  
9. Los grupos repetibles funcionen.  
10. Los cálculos sean deterministas.  
11. El prellenado respete permisos.  
12. Los cambios generen proposals.  
13. Los datos verificados no se sobrescriban.  
14. Los uploads usen Document Service.  
15. Los consentimientos estén versionados.  
16. Las firmas usen proveedor aprobado.  
17. Los submissions mantengan historial.  
18. Las correcciones sean controladas.  
19. Exista revisión interna.  
20. Exista autorización por campo.  
21. Se proteja PII.  
22. Se evite mass assignment.  
23. Se limite la IA.  
24. Se integre con CRM.  
25. Se integre con perfiles.  
26. Se integre con organizaciones.  
27. Se integre con Service Orders.  
28. Se integre con Tasks.  
29. Se integre con Workflows.  
30. Exista auditoría.  
31. Exista retención.  
32. Sea bilingüe.  
33. Sea responsive.  
34. Sea accesible.  
35. Pase pruebas de seguridad.  
36. Pase pruebas de calidad de datos.  
37. Maneje fallos parciales.  
38. No inicie servicios sensibles automáticamente.  
39. No trate respuestas como verificadas.  
40. Reutilice la aplicación existente.  
   
⸻  
   
## 149. Plan de implementación  
## Fase 1 — Auditoría  
* formularios actuales;  
* intakes;  
* campos;  
* respuestas;  
* perfiles;  
* workflows;  
* duplicados.  
## Fase 2 — Definiciones  
* FormDefinition;  
* versions;  
* sections;  
* fields;  
* statuses;  
* translations.  
## Fase 3 — Renderer  
* layouts;  
* conditional rules;  
* validation;  
* progress;  
* responsive;  
* accessibility.  
## Fase 4 — Sessions  
* autosave;  
* resume;  
* invitations;  
* expiration;  
* anonymous sessions.  
## Fase 5 — Submissions  
* responses;  
* review;  
* corrections;  
* status;  
* history;  
* authorization.  
## Fase 6 — Data Mapping  
* CRM;  
* profile proposals;  
* organizations;  
* leads;  
* order drafts.  
## Fase 7 — Documents and Consent  
* DocumentRequest;  
* uploads;  
* consent;  
* signature;  
* disclosures.  
## Fase 8 — Workflows  
* events;  
* tasks;  
* eligibility;  
* review;  
* onboarding;  
* next steps.  
## Fase 9 — Administration  
* visual editor;  
* templates;  
* preview;  
* simulation;  
* approvals;  
* publication.  
## Fase 10 — Government and Quality  
* security;  
* retention;  
* auditing;  
* analytics;  
* data quality;  
* testing.  
   
⸻  
   
## 150. Instrucciones finales para Codex  
Antes de implementar:  
1. Lee el contexto maestro.  
2. Lee los módulos 1 al 21.  
3. Lee este documento completo.  
4. Inspecciona formularios existentes.  
5. No crees un segundo motor de intake.  
6. No hardcodees formularios por servicio.  
7. Implementa FormDefinition y FormVersion.  
8. No edites versiones publicadas.  
9. Mantén sesiones y submissions separadas.  
10. Implementa autosave.  
11. Implementa save and resume.  
12. Implementa invitaciones seguras.  
13. Implementa expiración.  
14. Implementa validación backend.  
15. Implementa lógica condicional backend.  
16. Implementa repeating groups.  
17. Usa códigos estables.  
18. Implementa sensibilidad por campo.  
19. No guardes secretos en localStorage.  
20. No registres PII en logs.  
21. Usa Document Service para uploads.  
22. Usa Consent Service para consentimientos.  
23. Usa proveedor aprobado para firmas.  
24. Implementa ProfileUpdateProposal.  
25. No sobrescribas datos verificados.  
26. Implementa revisión.  
27. Implementa correction requests.  
28. Implementa autorización por campo.  
29. Protege invitaciones contra replay.  
30. Protege contra mass assignment.  
31. Protege contra prompt injection.  
32. Limita herramientas de IA.  
33. No permitas que la IA publique.  
34. No permitas que la IA acepte submissions.  
35. No permitas que la IA firme.  
36. No permitas que la IA otorgue consentimiento.  
37. Integra CRM.  
38. Integra perfiles.  
39. Integra organizaciones.  
40. Integra tareas.  
41. Integra workflows.  
42. Implementa outbox e idempotencia.  
43. Incluye pruebas de seguridad.  
44. Incluye pruebas de datos.  
45. Incluye pruebas de accesibilidad.  
46. Documenta migraciones.  
47. No marques como funcional un formulario alimentado por mocks.  
48. No presentes un formulario completado como servicio aprobado.  
49. No trates datos declarados como verificados.  
50. Mantén la aplicación existente como base.  
Antes de entregar, verifica:  
* ¿Cada formulario tiene propósito y versión?  
* ¿Las sesiones pueden reanudarse?  
* ¿Las validaciones se repiten en backend?  
* ¿Los datos sensibles están cifrados?  
* ¿Los uploads pasan por cuarentena?  
* ¿Los consentimientos tienen versión?  
* ¿Las respuestas diferentes generan proposals?  
* ¿Los datos verificados no se sobrescriben?  
* ¿Las submissions históricas conservan su versión?  
* ¿Los empleados ven solo los campos autorizados?  
* ¿La IA puede resumir sin modificar?  
* ¿Completar un formulario no inicia automáticamente un servicio sensible?  
* ¿Los fallos de CRM o Profile Service no pierden el submission?  
* ¿La implementación reutiliza los módulos existentes?  
  
  
  
  
  
  
## MÓDULO 23 — GESTIÓN CENTRAL DE TAREAS, SEGUIMIENTOS Y WORK QUEUES  
## SG Solutions Operating System  
**Versión:** 1.0.0 **Estado:** Especificación inicial aprobada **Tipo de documento:** Requisitos funcionales, arquitectura de tareas, colas de trabajo, asignación, SLA, automatización, seguridad, auditoría e instrucciones para Codex **Proyecto base:** Aplicación web existente de SG Solutions **Audiencia:** Codex, desarrolladores, diseñadores, responsables de producto, operaciones, soporte, especialistas, administración, seguridad y cumplimiento **Idiomas de interfaz:** Español e inglés **Idioma del código:** Inglés  
   
⸻  
   
## 1. Contexto obligatorio  
Este módulo deberá integrarse dentro de la aplicación web existente de SG Solutions.  
No deberá construirse como:  
* una aplicación independiente de project management;  
* un segundo motor de tareas;  
* una lista personal desconectada de servicios;  
* una copia de Trello o Asana sin relación con el dominio;  
* una tabla genérica con título y estado únicamente;  
* una cola diferente por cada módulo;  
* una colección de recordatorios sin responsables;  
* un sistema donde los agentes de IA puedan asignarse acciones sensibles;  
* una interfaz donde cualquier empleado pueda completar tareas ajenas;  
* una herramienta que permita cambiar estados operativos indirectamente sin autorización;  
* un sistema que considere una tarea completada como evidencia de que el servicio fue ejecutado;  
* una solución donde las tareas críticas puedan eliminarse;  
* un sistema donde una tarea vencida desaparezca del dashboard;  
* una implementación que dependa exclusivamente de cron jobs;  
* una cola sin prioridades;  
* una cola sin SLA;  
* una cola sin ownership;  
* una lista donde todas las tareas tengan la misma visibilidad;  
* un sistema que permita almacenar datos sensibles completos en títulos;  
* un motor de automatización sin auditoría;  
* una plataforma que duplique las aprobaciones;  
* un sistema que use notas libres como única definición de trabajo;  
* una solución donde la IA pueda cerrar expedientes mediante una tarea;  
* una herramienta sin idempotencia;  
* una cola donde los reintentos generen tareas duplicadas;  
* una interfaz que permita borrar historial;  
* un sistema que permita asignar tareas a usuarios suspendidos;  
* una solución sin soporte para equipos, colas compartidas o reasignación.  
Antes de implementar, Codex deberá inspeccionar:  
* tareas existentes;  
* recordatorios;  
* seguimientos;  
* asignaciones;  
* Dashboard Administrativo;  
* CRM;  
* Gestión de Clientes;  
* Organizations;  
* Service Orders;  
* Case Files;  
* Workflows;  
* Aprobaciones;  
* Document Service;  
* Billing;  
* Appointments;  
* Communications;  
* AI Hub;  
* usuarios;  
* equipos;  
* roles;  
* permisos;  
* calendarios;  
* notificaciones;  
* SLA;  
* jobs;  
* eventos;  
* colas;  
* prioridades;  
* auditoría;  
* analytics;  
* funcionalidades incompletas;  
* migraciones existentes.  
Si existe una entidad Task, deberá reutilizarse, normalizarse o migrarse.  
No crear un segundo sistema de tareas sin un plan explícito de consolidación.  
   
⸻  
   
## 2. Propósito del módulo  
La Gestión Central de Tareas será el sistema único para representar trabajo pendiente dentro de SG Solutions.  
El módulo deberá permitir:  
1. Crear tareas.  
2. Asignar responsables.  
3. Asignar equipos.  
4. Utilizar colas compartidas.  
5. Priorizar trabajo.  
6. Definir fechas límite.  
7. Definir SLA.  
8. Crear seguimientos.  
9. Crear recordatorios.  
10. Crear subtareas.  
11. Gestionar dependencias.  
12. Gestionar bloqueos.  
13. Gestionar recurrencia.  
14. Gestionar escalamiento.  
15. Gestionar reintentos.  
16. Gestionar handoffs.  
17. Registrar resultados.  
18. Mantener evidencia.  
19. Vincular tareas con clientes.  
20. Vincular tareas con empresas.  
21. Vincular tareas con servicios.  
22. Vincular tareas con expedientes.  
23. Vincular tareas con documentos.  
24. Vincular tareas con pagos.  
25. Vincular tareas con citas.  
26. Vincular tareas con comunicaciones.  
27. Vincular tareas con aprobaciones.  
28. Vincular tareas con agentes de IA.  
29. Mostrar colas operativas.  
30. Facilitar supervisión.  
31. Mantener historial.  
32. Facilitar reportes.  
33. Evitar trabajo perdido.  
34. Facilitar balance de carga.  
35. Mantener permisos y privacidad.  
36. Permitir automatización de bajo riesgo.  
37. Mantener control humano en acciones sensibles.  
El módulo deberá responder:  
¿Qué trabajo falta, quién debe hacerlo, antes de cuándo, qué lo bloquea y qué ocurre cuando termina?  
   
⸻  
   
## 3. Principio central  
Una tarea representa trabajo pendiente.  
No representa automáticamente:  
* aprobación;  
* autorización;  
* pago;  
* filing;  
* submission;  
* firma;  
* resultado profesional;  
* estado legal;  
* conclusión del expediente.  
Ejemplo correcto:  
```
Task completed:
Review LLC intake

Result:
Intake reviewed

Next workflow action:
Create service-start approval

```
Ejemplo incorrecto:  
```
Task completed:
File LLC

Therefore:
LLC approved

```
La finalización de una tarea puede emitir un evento.  
El workflow correspondiente decidirá la transición permitida.  
   
⸻  
   
## 4. Diferencia entre conceptos  
## Task  
Unidad concreta de trabajo.  
## Follow-up  
Tarea orientada a retomar contacto o revisar un evento futuro.  
## Reminder  
Aviso asociado a una tarea, evento o usuario.  
## Work Queue  
Colección de trabajo disponible para un equipo o función.  
## Assignment  
Relación entre tarea y responsable.  
## SLA  
Tiempo esperado para comenzar o completar.  
## Escalation  
Acción tomada cuando se incumple una regla.  
## Dependency  
Relación que impide iniciar o completar hasta que otra condición se cumpla.  
## Blocker  
Condición actual que detiene el trabajo.  
## Approval  
Decisión formal separada de la tarea.  
## Job  
Trabajo técnico ejecutado por un sistema.  
Una tarea humana no deberá confundirse con un job técnico.  
   
⸻  
   
## 5. Objetivos  
## 5.1 Objetivos principales  
* Centralizar trabajo.  
* Evitar tareas duplicadas.  
* Evitar trabajo sin responsable.  
* Mantener prioridades.  
* Mantener fechas.  
* Mantener SLA.  
* Facilitar seguimiento.  
* Facilitar colas.  
* Facilitar asignación.  
* Facilitar escalamiento.  
* Mantener historial.  
* Proteger datos.  
* Integrar workflows.  
## 5.2 Objetivos secundarios  
* Balancear carga.  
* Medir tiempos.  
* Reducir retrasos.  
* Detectar cuellos de botella.  
* Facilitar automatización.  
* Facilitar agentes.  
* Facilitar soporte.  
* Facilitar productividad.  
* Facilitar reporting.  
* Mejorar continuidad entre empleados.  
* Reducir olvidos.  
* Mejorar experiencia del cliente.  
   
⸻  
   
## 6. Tipos de tareas  
El sistema deberá soportar:  
```
general
follow_up
client_contact
document_request
document_review
profile_review
identity_review
payment_review
refund_review
appointment_follow_up
consultation_preparation
service_start_review
approval_preparation
case_work
filing_preparation
tax_preparation
credit_review
credit_dispute_preparation
business_formation
funding_review
home_buying_review
partner_referral
compliance_obligation
security_review
support
quality_review
data_correction
integration_recovery
ai_review
internal_administration
custom

```
Cada tipo podrá tener reglas propias.  
   
⸻  
   
## 7. Tipos de work queues  
```
personal
team
service
department
unassigned
priority
approval_support
document_review
billing_review
support
compliance
security
integration_failure
ai_review
dead_letter_follow_up
custom

```
   
⸻  
   
## 8. Estados de tarea  
Estados sugeridos:  
```
draft
open
unassigned
assigned
accepted
in_progress
waiting_for_client
waiting_for_internal_action
waiting_for_external_party
waiting_for_document
waiting_for_payment
waiting_for_approval
blocked
on_hold
completed
cancelled
failed
expired
superseded
archived

```
Los estados deberán tener reglas explícitas.  
   
⸻  
   
## 9. Estados públicos  
Cuando una tarea sea visible al cliente, usar etiquetas amigables:  
```
open
→ Pendiente

waiting_for_client
→ Necesitamos una acción tuya

in_progress
→ En revisión

completed
→ Completada

cancelled
→ Cancelada

```
No mostrar estados técnicos como:  
```
dead_letter_retry_required

```
   
⸻  
   
## 10. Estado de resultado  
Separar estado y resultado.  
Ejemplo:  
```
Task status:
completed

Task outcome:
document_accepted

```
Resultados posibles:  
```
completed_successfully
information_collected
document_accepted
document_rejected
correction_requested
client_contacted
no_response
appointment_scheduled
payment_verified
approval_requested
escalated
not_applicable
unable_to_complete
cancelled_by_policy
custom

```
   
⸻  
   
## 11. Alcance funcional  
El módulo incluirá:  
* tareas;  
* subtareas;  
* checklists;  
* asignaciones;  
* equipos;  
* colas;  
* prioridades;  
* fechas;  
* SLA;  
* recordatorios;  
* follow-ups;  
* recurrencia;  
* dependencias;  
* blockers;  
* comentarios;  
* notas;  
* attachments mediante Document Service;  
* resultados;  
* evidencia;  
* plantillas;  
* reglas;  
* automatización;  
* handoffs;  
* escalamiento;  
* dashboards;  
* búsqueda;  
* filtros;  
* vistas guardadas;  
* notificaciones;  
* auditoría;  
* analytics;  
* seguridad;  
* internacionalización;  
* accesibilidad;  
* fallbacks;  
* testing.  
   
⸻  
   
## 12. Fuera de alcance  
El módulo no deberá:  
* ejecutar filings;  
* presentar taxes;  
* emitir refunds;  
* modificar pagos;  
* enviar disputas;  
* solicitar financiamiento;  
* cambiar ownership;  
* otorgar entitlements;  
* marcar empresas como activas;  
* aprobar servicios;  
* almacenar archivos;  
* almacenar tarjetas;  
* almacenar contraseñas;  
* sustituir workflows;  
* sustituir approvals;  
* sustituir calendarios;  
* sustituir jobs técnicos;  
* permitir a la IA completar tareas sensibles sin revisión;  
* borrar tareas críticas;  
* crear duplicados mediante reintentos;  
* permitir que un cliente vea tareas internas;  
* permitir que un empleado vea tareas de otro alcance sin permiso.  
   
⸻  
   
## 13. Navegación administrativa  
Ruta sugerida:  
```
/admin/tasks

```
Subsecciones:  
```
Mis tareas
Colas de trabajo
Sin asignar
Vencidas
Bloqueadas
Seguimientos
Recurrentes
Completadas
Plantillas
Reglas de asignación
SLA
Configuración

```
Detalle:  
```
/admin/tasks/[taskId]

```
   
⸻  
   
## 14. Navegación del cliente  
Ruta sugerida:  
```
/account/tasks

```
Subsecciones:  
```
Pendientes
Próximas
Completadas

```
Solo deberán mostrarse tareas marcadas como visibles al cliente.  
   
⸻  
   
## 15. Lista de tareas  
Columnas sugeridas:  
```
Tarea
Cliente o empresa
Servicio
Estado
Prioridad
Responsable
Fecha límite
SLA
Última actualización

```
Filtros:  
* estado;  
* prioridad;  
* responsable;  
* equipo;  
* cola;  
* servicio;  
* cliente;  
* organización;  
* fecha;  
* vencida;  
* bloqueada;  
* visible al cliente;  
* source module;  
* task type.  
   
⸻  
   
## 16. Vista de tarea  
Deberá mostrar:  
1. Título.  
2. Descripción.  
3. Tipo.  
4. Estado.  
5. Prioridad.  
6. Responsable.  
7. Equipo.  
8. Cola.  
9. Cliente.  
10. Organización.  
11. Servicio.  
12. Expediente.  
13. Fecha de creación.  
14. Fecha límite.  
15. SLA.  
16. Dependencias.  
17. Blockers.  
18. Checklist.  
19. Comentarios.  
20. Evidencia.  
21. Historial.  
22. Resultado.  
23. Próxima acción.  
   
⸻  
   
## 17. Título de tarea  
El título deberá ser:  
* breve;  
* orientado a acción;  
* no sensible;  
* específico.  
Ejemplo:  
```
Revisar intake de formación de LLC

```
No:  
```
Revisar SSN y deuda médica de María López

```
   
⸻  
   
## 18. Descripción de tarea  
La descripción podrá incluir:  
* objetivo;  
* contexto;  
* criterio de completitud;  
* instrucciones;  
* dependencias;  
* enlaces internos.  
No deberá almacenar:  
* contraseñas;  
* SSN completo;  
* datos de tarjeta;  
* documentos completos;  
* tokens;  
* secretos.  
   
⸻  
   
## 19. Prioridades  
Niveles:  
```
critical
urgent
high
normal
low
backlog

```
## Critical  
Riesgo inmediato de seguridad, dinero, cumplimiento o fecha legal.  
## Urgent  
Requiere atención inmediata o en el mismo día.  
## High  
Importante y próxima.  
## Normal  
Trabajo regular.  
## Low  
Puede esperar.  
## Backlog  
Sin compromiso inmediato.  
   
⸻  
   
## 20. Reglas de prioridad  
La prioridad podrá derivarse de:  
* deadline;  
* riesgo;  
* blocker;  
* tipo de servicio;  
* SLA;  
* cliente esperando;  
* pago;  
* filing;  
* documento;  
* seguridad;  
* escalamiento.  
La prioridad final deberá ser determinista y explicable.  
La IA podrá sugerir.  
No deberá modificarla sin política.  
   
⸻  
   
## 21. Priority Score  
La arquitectura podrá utilizar un score interno:  
```
Priority Score =
Base Priority
+ Deadline Weight
+ Risk Weight
+ Client Blocker Weight
+ SLA Weight
+ Compliance Weight

```
El score deberá:  
* ser configurable;  
* ser auditable;  
* no contener atributos protegidos;  
* no utilizarse para decisiones crediticias.  
   
⸻  
   
## 22. Fechas  
Una tarea podrá tener:  
```
availableAt
startBy
dueAt
reminderAt
escalateAt
expiresAt
completedAt

```
No todas serán obligatorias.  
   
⸻  
   
## 23. Fecha límite  
La fecha límite deberá considerar:  
* zona horaria;  
* horario comercial;  
* días festivos;  
* weekends;  
* SLA;  
* servicio;  
* dependencia;  
* jurisdicción.  
No almacenar únicamente una fecha sin zona cuando la hora sea relevante.  
   
⸻  
   
## 24. SLA  
Tipos:  
```
response_sla
acceptance_sla
start_sla
completion_sla
client_response_sla
external_party_sla
review_sla
custom

```
   
⸻  
   
## 25. SLA Policy  
Campos:  
```
id
code
name
taskType
serviceDefinitionId
priority
businessCalendarId
responseTargetMinutes
startTargetMinutes
completionTargetMinutes
pauseConditions
escalationPolicyId
status
version

```
   
⸻  
   
## 26. Pausa del SLA  
El SLA podrá pausarse cuando:  
* se espera al cliente;  
* se espera documento;  
* se espera pago;  
* se espera partner;  
* se espera agencia;  
* existe legal hold;  
* la tarea está on hold autorizado.  
La pausa deberá:  
* registrar razón;  
* registrar inicio;  
* registrar fin;  
* estar auditada.  
   
⸻  
   
## 27. SLA del cliente  
Cuando se espere al cliente, podrá existir una fecha sugerida o límite.  
Ejemplo:  
Sube el documento antes del 15 de agosto para evitar retrasos.  
No deberá presentarse como obligación legal salvo que lo sea.  
   
⸻  
   
## 28. Escalamiento  
Puede activarse por:  
* vencimiento;  
* SLA próximo;  
* SLA incumplido;  
* tarea crítica sin owner;  
* blocker prolongado;  
* cliente esperando;  
* fallo repetido;  
* riesgo;  
* compliance deadline.  
   
⸻  
   
## 29. Escalation Policy  
```
id
code
name
triggerType
threshold
actions
notificationTargets
reassignmentRule
priorityChange
approvalRequirement
status
version

```
   
⸻  
   
## 30. Acciones de escalamiento  
Posibles:  
* aumentar prioridad;  
* notificar responsable;  
* notificar supervisor;  
* mover a cola;  
* reasignar;  
* crear alerta;  
* crear incidente;  
* crear tarea secundaria;  
* solicitar aprobación;  
* pausar workflow.  
No todas las escalaciones deberán reasignar.  
   
⸻  
   
## 31. Asignación  
Una tarea podrá asignarse a:  
```
user
team
queue
role
service_account
agent_review_queue
unassigned

```
   
⸻  
   
## 32. Assignment Record  
```
id
taskId
assignmentType
assignedUserId
assignedTeamId
assignedQueueId
assignedRoleCode
status
assignedByType
assignedById
assignedAt
acceptedAt
releasedAt
reason

```
   
⸻  
   
## 33. Estados de asignación  
```
proposed
assigned
accepted
declined
released
reassigned
expired

```
   
⸻  
   
## 34. Aceptación de tarea  
Algunas tareas podrán requerir que el usuario acepte.  
Flujo:  
```
Assigned
→ user accepts
→ task becomes accepted or in_progress

```
Si no se acepta dentro del SLA:  
* recordar;  
* escalar;  
* reasignar;  
* devolver a cola.  
   
⸻  
   
## 35. Tareas sin asignar  
Toda tarea sin owner deberá aparecer en:  
```
Unassigned Queue

```
No deberá quedar invisible.  
Las tareas críticas sin asignar deberán generar alerta.  
   
⸻  
   
## 36. Colas compartidas  
Una cola deberá incluir:  
```
code
name
description
taskTypes
serviceTypes
eligibleTeams
eligibleUsers
assignmentMode
priorityPolicy
slaPolicy
status

```
   
⸻  
   
## 37. Modos de asignación  
```
manual_pick
dispatcher_assign
round_robin
least_loaded
skill_based
priority_based
geography_based
language_based
hybrid
custom_rule

```
   
⸻  
   
## 38. Round-robin  
Deberá considerar:  
* usuarios activos;  
* horario;  
* capacidad;  
* permiso;  
* servicio;  
* idioma;  
* exclusiones;  
* ausencias.  
No asignar a un usuario:  
* suspendido;  
* fuera de scope;  
* sin permiso;  
* en licencia;  
* sobre capacidad definida.  
   
⸻  
   
## 39. Least-loaded  
Podrá considerar:  
* tareas activas;  
* puntos de complejidad;  
* prioridad;  
* vencimientos;  
* horas estimadas;  
* especialidad.  
No deberá medir carga únicamente por cantidad.  
   
⸻  
   
## 40. Skill-based assignment  
La asignación podrá requerir:  
* Credit Specialist;  
* Tax Specialist;  
* Formation Specialist;  
* Funding Specialist;  
* Home Buying Specialist;  
* Compliance Reviewer;  
* Billing Reviewer;  
* Support Agent.  
Las skills deberán configurarse en perfiles internos.  
   
⸻  
   
## 41. Asignación por idioma  
Una tarea podrá requerir:  
```
Spanish
English
Bilingual
Future language

```
La preferencia del cliente deberá respetarse.  
   
⸻  
   
## 42. Asignación por jurisdicción  
Podrá depender de:  
* estado;  
* tax jurisdiction;  
* formation state;  
* property state;  
* service availability;  
* credential requirement.  
   
⸻  
   
## 43. Capacidad  
Un usuario o equipo podrá tener:  
```
maximumActiveTasks
maximumComplexityPoints
maximumCriticalTasks
serviceSpecificCapacity
temporaryCapacityOverride

```
   
⸻  
   
## 44. Handoffs  
Un handoff representa transferencia controlada.  
Ejemplos:  
* Support a Credit Specialist;  
* Intake a Formation Team;  
* IA a humano;  
* Billing a Compliance;  
* Tax preparer a reviewer.  
   
⸻  
   
## 45. Handoff Record  
```
id
taskId
fromAssignmentType
fromAssignmentId
toAssignmentType
toAssignmentId
reasonCode
summary
requiredContext
status
createdAt
acceptedAt
completedAt

```
   
⸻  
   
## 46. Reglas de handoff  
El handoff deberá:  
* incluir contexto;  
* incluir motivo;  
* mantener historial;  
* no copiar datos innecesarios;  
* validar permisos;  
* notificar;  
* mantener SLA o recalcular según política.  
   
⸻  
   
## 47. Dependencias  
Tipos:  
```
finish_to_start
finish_to_finish
start_to_start
requires_event
requires_document
requires_payment
requires_approval
requires_client_action
custom

```
   
⸻  
   
## 48. Task Dependency  
```
id
taskId
dependencyType
dependsOnTaskId
dependsOnResourceType
dependsOnResourceId
conditionCode
status
satisfiedAt
createdAt

```
   
⸻  
   
## 49. Blockers  
Un blocker deberá incluir:  
```
blockerType
reasonCode
publicMessage
internalMessage
responsibleParty
createdAt
expectedResolutionAt
resolvedAt

```
   
⸻  
   
## 50. Tipos de blocker  
```
client_action
internal_action
document
payment
approval
external_party
integration
security
identity
compliance
data_conflict
capacity
unknown

```
   
⸻  
   
## 51. Blocker visible al cliente  
Ejemplo:  
Necesitamos tu comprobante de dirección para continuar.  
No mostrar:  
OCR confidence below 0.72 and identity merge unresolved.  
   
⸻  
   
## 52. Subtareas  
Una tarea podrá tener subtareas.  
Ejemplo:  
```
Review tax intake
├── Verify identity
├── Review W-2
├── Review Schedule C
└── Identify missing documents

```
La tarea principal podrá completarse cuando:  
* todas las subtareas obligatorias estén completas;  
* la completion rule lo permita.  
   
⸻  
   
## 53. Checklists  
Un checklist podrá contener ítems simples.  
Diferencia:  
* subtarea: tiene owner, estado y SLA propios;  
* checklist item: validación dentro de una tarea.  
   
⸻  
   
## 54. Checklist Item  
```
id
taskId
code
title
description
required
status
completedBy
completedAt
evidenceReference
sortOrder

```
   
⸻  
   
## 55. Criterios de completitud  
Cada Task Template deberá definir:  
```
completionRule
requiredOutcome
requiredChecklistItems
requiredEvidence
requiredComment
requiredNextAction

```
No permitir completar tareas sensibles sin los campos requeridos.  
   
⸻  
   
## 56. Evidencia  
Una tarea podrá requerir:  
* documento;  
* review record;  
* provider reference;  
* approval;  
* confirmation;  
* screenshot autorizado;  
* structured outcome;  
* external status.  
No almacenar archivos directamente en la tarea.  
Usar referencias a Document Service.  
   
⸻  
   
## 57. Comentarios  
Los comentarios deberán:  
* tener autor;  
* fecha;  
* visibilidad;  
* historial;  
* menciones;  
* permisos;  
* contenido seguro.  
Tipos de visibilidad:  
```
internal
team
restricted
client_visible
system

```
   
⸻  
   
## 58. Comentarios visibles al cliente  
Por defecto, utilizar Mensajería Segura.  
Un comentario client_visible deberá:  
* requerir permiso;  
* mostrarse claramente;  
* evitar notas internas;  
* mantener auditoría.  
   
⸻  
   
## 59. Menciones  
Podrán utilizarse para:  
* notificar;  
* solicitar ayuda;  
* escalar;  
* incluir supervisor.  
Una mención no deberá cambiar ownership automáticamente.  
   
⸻  
   
## 60. Seguimientos  
Un follow-up deberá incluir:  
* contacto;  
* motivo;  
* canal;  
* fecha;  
* responsable;  
* resultado esperado;  
* número de intentos;  
* stop rule.  
   
⸻  
   
## 61. Follow-up Types  
```
call
email
whatsapp
portal_message
appointment
document_reminder
payment_reminder
quote_follow_up
service_follow_up
partner_follow_up
renewal_follow_up
custom

```
   
⸻  
   
## 62. Intentos de seguimiento  
Registrar:  
```
attemptNumber
channel
occurredAt
result
nextAttemptAt
actor
notes

```
Resultados:  
```
contacted
no_answer
voicemail
message_sent
invalid_contact
client_declined
scheduled
completed
do_not_contact

```
   
⸻  
   
## 63. Stop rules  
Detener seguimientos cuando:  
* cliente responde;  
* opt-out;  
* contacto inválido;  
* servicio cancelado;  
* quote vencida;  
* pago completado;  
* tarea completada;  
* máximo de intentos;  
* queja;  
* seguridad;  
* fallecimiento;  
* cierre.  
   
⸻  
   
## 64. Recurrencia  
Una tarea podrá repetirse:  
* diaria;  
* semanal;  
* mensual;  
* anual;  
* por RRULE;  
* por obligación;  
* por renewal;  
* por calendario empresarial.  
   
⸻  
   
## 65. Recurring Task Definition  
```
id
taskTemplateId
recurrenceRule
startAt
endAt
timeZone
generationWindow
skipPolicy
holidayPolicy
status

```
   
⸻  
   
## 66. Generación de tareas recurrentes  
La generación deberá:  
* ser idempotente;  
* evitar duplicados;  
* conservar definición;  
* permitir excepciones;  
* respetar feriados;  
* registrar origen.  
   
⸻  
   
## 67. Recordatorios  
Un recordatorio podrá dirigirse a:  
* responsable;  
* equipo;  
* cliente;  
* supervisor;  
* queue manager.  
Canales:  
* in-app;  
* email;  
* WhatsApp;  
* SMS futuro;  
* push futuro.  
   
⸻  
   
## 68. Reminder Policy  
```
id
taskType
priority
relativeTo
offset
channel
recipientType
quietHoursPolicy
repeatPolicy
stopConditions
status

```
   
⸻  
   
## 69. Horarios silenciosos  
Las notificaciones al cliente deberán respetar:  
* zona horaria;  
* horario razonable;  
* consentimiento;  
* quiet hours;  
* días especiales.  
Las alertas críticas internas podrán usar políticas diferentes.  
   
⸻  
   
## 70. Notificaciones internas  
Eventos:  
* tarea asignada;  
* tarea aceptada;  
* vencimiento próximo;  
* vencida;  
* blocker;  
* comentario;  
* mención;  
* reasignación;  
* handoff;  
* escalation;  
* completion;  
* failure.  
   
⸻  
   
## 71. Tareas visibles al cliente  
Una tarea deberá declarar:  
```
clientVisibility
clientTitle
clientDescription
clientActionType
clientDueAt
clientCompletionRule

```
No exponer automáticamente el título interno.  
   
⸻  
   
## 72. Acciones del cliente  
Ejemplos:  
```
upload_document
complete_form
make_payment
sign_document
schedule_appointment
send_message
confirm_information
review_document
custom_safe_action

```
   
⸻  
   
## 73. Completion by client  
Cuando el cliente complete una acción:  
```
Client action submitted
→ backend validates
→ task status updated or sent to review

```
No marcar como completada si aún requiere validación.  
Ejemplo:  
```
Document uploaded
→ task becomes waiting_for_internal_action

```
No necesariamente completed.  
   
⸻  
   
## 74. Plantillas de tareas  
Cada Task Template deberá incluir:  
```
id
code
name
taskType
titleTemplate
descriptionTemplate
defaultPriority
defaultQueueId
assignmentRuleId
slaPolicyId
completionRule
clientVisibility
recurrenceAllowed
automationPolicy
status
version

```
   
⸻  
   
## 75. Códigos de plantillas  
Ejemplos:  
```
REVIEW_LLC_INTAKE
REQUEST_PROOF_OF_ADDRESS
VERIFY_PAYMENT
PREPARE_TAX_RETURN_REVIEW
FOLLOW_UP_CREDIT_CLIENT
REVIEW_REFUND_REQUEST
PREPARE_USDA_ASSESSMENT
REVIEW_PARTNER_REFERRAL

```
   
⸻  
   
## 76. Versionado de plantillas  
Una plantilla publicada deberá ser inmutable.  
Las tareas existentes deberán conservar:  
* template version;  
* title snapshot;  
* description snapshot;  
* completion rule;  
* SLA;  
* assignment configuration.  
   
⸻  
   
## 77. Creación manual  
Un usuario autorizado podrá crear tareas manuales.  
Deberá seleccionar:  
* tipo;  
* recurso;  
* responsable o cola;  
* prioridad;  
* fecha;  
* visibilidad;  
* propósito.  
No deberá poder crear tareas para recursos fuera de su alcance.  
   
⸻  
   
## 78. Creación automática  
Las tareas podrán crearse por:  
* workflow;  
* form submission;  
* payment event;  
* document event;  
* appointment event;  
* CRM rule;  
* consent event;  
* security event;  
* partner event;  
* recurring schedule;  
* agent suggestion;  
* manual command.  
   
⸻  
   
## 79. Idempotencia de creación  
Cada creación automática deberá utilizar una clave.  
Ejemplo:  
```
Task type
+ source event
+ resource
+ workflow stage

```
No crear múltiples tareas por el mismo webhook o evento.  
   
⸻  
   
## 80. Detección de duplicados  
Antes de crear:  
* buscar tareas abiertas equivalentes;  
* revisar source event;  
* revisar resource;  
* revisar template;  
* aplicar policy.  
No fusionar automáticamente tareas diferentes solo porque tienen el mismo título.  
   
⸻  
   
## 81. Tareas superseded  
Una tarea podrá quedar superseded cuando:  
* una versión nueva la reemplaza;  
* el workflow cambia;  
* un evento la vuelve irrelevante;  
* se fusionan clientes;  
* se cancela servicio;  
* se resuelve de otra forma.  
No eliminarla.  
   
⸻  
   
## 82. Cancelación  
Una tarea podrá cancelarse cuando:  
* ya no aplica;  
* servicio cancelado;  
* duplicado confirmado;  
* error de creación;  
* workflow cancelado;  
* policy change.  
La cancelación deberá requerir motivo.  
   
⸻  
   
## 83. Reapertura  
Una tarea completada podrá reabrirse cuando:  
* resultado incorrecto;  
* evidencia insuficiente;  
* revisión rechazada;  
* cliente corrige información;  
* provider revierte estado.  
La reapertura deberá mantener historial.  
   
⸻  
   
## 84. Task Outcome Schema  
Cada tipo deberá definir un schema de resultado.  
Ejemplo:  
```
{
  "documentStatus": "accepted",
  "reviewedDocumentId": "DOC-1032",
  "nextAction": "request_service_start_approval"
}

```
No depender únicamente de comentarios libres.  
   
⸻  
   
## 85. Integración con CRM  
El CRM deberá mostrar:  
* tareas abiertas;  
* próxima acción;  
* follow-ups;  
* vencidas;  
* owner.  
No crear un motor de tareas separado en CRM.  
   
⸻  
   
## 86. Integración con Gestión de Clientes  
La ficha del cliente deberá mostrar:  
* tareas internas autorizadas;  
* tareas del cliente;  
* blockers;  
* próxima acción;  
* última tarea completada.  
   
⸻  
   
## 87. Integración con Organizations  
Las tareas empresariales podrán vincularse a:  
* organization;  
* owner;  
* filing;  
* compliance obligation;  
* service;  
* case.  
   
⸻  
   
## 88. Integración con Service Orders  
Cada orden podrá generar:  
* onboarding tasks;  
* payment tasks;  
* document tasks;  
* approval tasks;  
* operational tasks;  
* closing tasks.  
   
⸻  
   
## 89. Integración con Case Files  
Los casos deberán usar tareas para representar trabajo.  
El estado del expediente deberá ser controlado por workflows, no por conteo simple de tareas.  
   
⸻  
   
## 90. Integración con Forms  
Un submission podrá crear:  
* review task;  
* correction task;  
* profile conflict task;  
* quote task;  
* onboarding task.  
   
⸻  
   
## 91. Integración con Documents  
Eventos:  
* documento cargado;  
* scan completado;  
* revisión requerida;  
* corrección;  
* firma;  
* expiración.  
Podrán crear o actualizar tareas.  
   
⸻  
   
## 92. Integración con Billing  
Eventos:  
* pago pendiente;  
* fallo;  
* pago externo;  
* refund;  
* dispute;  
* reconciliation issue.  
Billing seguirá siendo fuente financiera.  
   
⸻  
   
## 93. Integración con Appointments  
Eventos:  
* cita creada;  
* cita próxima;  
* no-show;  
* cita completada;  
* follow-up requerido.  
   
⸻  
   
## 94. Integración con Communications  
Una conversación podrá:  
* crear tarea;  
* asignar follow-up;  
* crear callback;  
* generar handoff;  
* resolver tarea al responder.  
No todos los mensajes deberán crear tareas.  
   
⸻  
   
## 95. Integración con Approvals  
Una aprobación podrá crear una tarea de revisión.  
La tarea no reemplaza el registro de aprobación.  
Ejemplo:  
```
Task:
Review service start request

Approval:
Formal decision record

```
   
⸻  
   
## 96. Integración con AI Hub  
La IA podrá:  
* resumir tarea;  
* proponer prioridad;  
* sugerir owner;  
* redactar respuesta;  
* identificar blocker;  
* preparar checklist;  
* proponer resultado;  
* detectar duplicados.  
No podrá:  
* completar tareas sensibles;  
* aprobar;  
* modificar pagos;  
* presentar;  
* otorgar entitlements;  
* cancelar servicios.  
   
⸻  
   
## 97. AI Tools permitidas  
```
get_task_summary()
get_task_context()
suggest_task_priority()
suggest_task_assignment()
draft_task_response()
identify_task_blockers()
propose_task_outcome()
create_follow_up_task_draft()
summarize_task_history()

```
   
⸻  
   
## 98. AI Tools prohibidas  
```
complete_sensitive_task()
approve_task_result()
submit_filing()
submit_tax_return()
send_credit_dispute()
issue_refund()
mark_payment_verified()
grant_entitlement()
cancel_service()
delete_task()
override_sla()

```
   
⸻  
   
## 99. AI Review Queue  
Los outputs que requieren revisión deberán ir a:  
```
AI Review Queue

```
Estados:  
```
draft
waiting_for_review
approved
rejected
edited
executed
superseded

```
   
⸻  
   
## 100. Task Agent Run  
Cada ejecución deberá registrar:  
```
taskId
agentId
purpose
inputScope
model
promptVersion
toolCalls
outputReference
status
reviewedBy
createdAt
completedAt

```
   
⸻  
   
## 101. Seguridad  
Requisitos:  
* autenticación;  
* MFA para acciones sensibles;  
* autorización backend;  
* resource-level access;  
* purpose-based access;  
* protección IDOR;  
* field-level authorization;  
* CSRF;  
* CSP;  
* rate limiting;  
* secure cookies;  
* audit logging;  
* no PII en títulos;  
* no secretos;  
* cifrado;  
* mínimo privilegio;  
* fail closed;  
* caché segmentada;  
* validación de transiciones.  
   
⸻  
   
## 102. Autorización por recurso  
Para abrir una tarea:  
```
User authenticated
AND
User has task.read
AND
User scope includes linked resource
AND
Purpose allows task type
AND
Visibility permits access

```
   
⸻  
   
## 103. Autorización para completar  
```
User has task.complete
AND
User is assigned or authorized queue member
AND
Task state permits completion
AND
Completion rule is satisfied
AND
Required evidence exists

```
   
⸻  
   
## 104. Acceso de queue managers  
Un queue manager podrá:  
* ver cola;  
* reasignar;  
* cambiar prioridad;  
* escalar;  
* ajustar capacidad;  
* revisar SLA.  
No obtiene acceso automático a datos restringidos del expediente.  
   
⸻  
   
## 105. Purpose-based access  
Un Support Agent puede ver:  
* callback task;  
* client contact;  
* appointment;  
* portal issue.  
No obtiene automáticamente:  
* tax review;  
* credit report;  
* identity evidence;  
* financial application.  
   
⸻  
   
## 106. Visibilidad restringida  
Niveles:  
```
public_client
internal_general
team_only
role_restricted
compliance_restricted
security_restricted
owner_only
system_only

```
   
⸻  
   
## 107. Reautenticación  
Podrá requerirse para:  
* completar tarea de refund;  
* aprobar resultado de filing;  
* acceder a SSN;  
* cambiar restricted task;  
* aplicar override;  
* exportar;  
* reasignar tarea crítica;  
* cerrar security review.  
   
⸻  
   
## 108. Auditoría  
Eventos:  
```
task_created
task_viewed
task_assigned
task_assignment_accepted
task_reassigned
task_started
task_status_changed
task_blocked
task_unblocked
task_priority_changed
task_due_date_changed
task_sla_paused
task_sla_resumed
task_escalated
task_comment_added
task_checklist_updated
task_completed
task_reopened
task_cancelled
task_failed
task_superseded
task_follow_up_created
task_handoff_created
task_handoff_accepted
task_sensitive_data_viewed
task_export_requested

```
   
⸻  
   
## 109. Historial  
Cada cambio deberá registrar:  
* actor;  
* acción;  
* valor anterior;  
* valor nuevo;  
* razón;  
* fecha;  
* correlation ID;  
* source.  
No permitir borrar historial.  
   
⸻  
   
## 110. Modelo de datos conceptual  
## Task  
```
id
publicReference
taskTemplateId
taskTemplateVersion
taskType
title
descriptionEncrypted
status
outcomeCode
priority
priorityScore
visibility
clientVisible
clientTitle
clientDescription
createdByType
createdById
availableAt
startBy
dueAt
expiresAt
startedAt
completedAt
cancelledAt
createdAt
updatedAt
version

```
## TaskResourceLink  
```
id
taskId
resourceType
resourceId
relationshipType
isPrimary
createdAt

```
## TaskAssignment  
```
id
taskId
assignmentType
assignedUserId
assignedTeamId
assignedQueueId
assignedRoleCode
status
assignedByType
assignedById
assignedAt
acceptedAt
releasedAt
reasonCode

```
## WorkQueue  
```
id
code
name
description
queueType
assignmentMode
taskTypeRules
serviceRules
eligibleTeamIds
eligibleRoleCodes
slaPolicyId
priorityPolicyId
status
createdAt
updatedAt

```
## TaskDependency  
```
id
taskId
dependencyType
dependsOnTaskId
dependsOnResourceType
dependsOnResourceId
conditionCode
status
satisfiedAt
createdAt

```
## TaskBlocker  
```
id
taskId
blockerType
reasonCode
publicMessage
internalMessageEncrypted
responsiblePartyType
responsiblePartyId
status
createdAt
expectedResolutionAt
resolvedAt
resolvedBy

```
## TaskChecklistItem  
```
id
taskId
code
title
description
required
status
evidenceReference
completedBy
completedAt
sortOrder

```
## TaskComment  
```
id
taskId
visibility
contentEncrypted
authorType
authorId
createdAt
updatedAt

```
## TaskOutcome  
```
id
taskId
outcomeCode
structuredResult
summary
evidenceReferences
recordedBy
recordedAt

```
## TaskSlaInstance  
```
id
taskId
slaPolicyId
responseDueAt
startDueAt
completionDueAt
pausedDurationSeconds
status
breachedAt
createdAt
updatedAt

```
## TaskSlaPause  
```
id
taskSlaInstanceId
reasonCode
startedAt
endedAt
createdBy

```
## TaskFollowUpAttempt  
```
id
taskId
attemptNumber
channel
result
occurredAt
nextAttemptAt
actorType
actorId
notesEncrypted

```
## TaskHandoff  
```
id
taskId
fromAssignmentType
fromAssignmentId
toAssignmentType
toAssignmentId
reasonCode
summaryEncrypted
status
createdAt
acceptedAt
completedAt

```
## TaskTemplate  
```
id
code
name
taskType
titleTemplate
descriptionTemplate
defaultPriority
defaultQueueId
assignmentRuleId
slaPolicyId
completionRule
clientVisibility
automationPolicy
status
currentVersionId
createdAt
updatedAt

```
## TaskTemplateVersion  
```
id
taskTemplateId
versionNumber
configurationSnapshot
changeSummary
status
approvedBy
approvedAt
effectiveFrom
effectiveTo
createdAt

```
## RecurringTaskDefinition  
```
id
taskTemplateId
recurrenceRule
timeZone
startAt
endAt
generationWindow
holidayPolicy
skipPolicy
status
createdAt
updatedAt

```
   
⸻  
   
## 111. Arquitectura técnica  
```
Admin Portal / Client Portal
        ↓
Task UI
        ↓
Task API
        ↓
Authorization and Purpose Layer
        ↓
Task Management Service
        ├── Tasks
        ├── Templates
        ├── Assignments
        ├── Queues
        ├── Dependencies
        ├── Blockers
        ├── SLA
        ├── Escalations
        ├── Follow-ups
        ├── Recurrence
        ├── Outcomes
        └── History
        ↓
CRM / Services / Cases / Documents / Billing / Appointments / Workflows

```
   
⸻  
   
## 112. Task Management Service  
Responsabilidades:  
* crear tareas;  
* validar duplicados;  
* administrar estados;  
* asignar;  
* reasignar;  
* administrar colas;  
* administrar SLA;  
* administrar blockers;  
* administrar dependencias;  
* administrar follow-ups;  
* administrar recurrencia;  
* validar completitud;  
* registrar outcomes;  
* emitir eventos;  
* mantener auditoría;  
* aplicar permisos.  
No deberá ejecutar acciones profesionales externas.  
   
⸻  
   
## 113. DTOs  
Crear:  
```
TaskListItemDto
TaskSummaryDto
TaskDetailDto
ClientTaskDto
TaskAssignmentDto
TaskQueueSummaryDto
TaskSlaDto
TaskBlockerDto
TaskOutcomeDto
TaskHistoryDto

```
No devolver contexto completo de expedientes.  
   
⸻  
   
## 114. APIs conceptuales  
```
GET /api/tasks
GET /api/tasks/{id}
POST /api/tasks
POST /api/tasks/{id}/assign
POST /api/tasks/{id}/accept
POST /api/tasks/{id}/start
POST /api/tasks/{id}/block
POST /api/tasks/{id}/unblock
POST /api/tasks/{id}/complete
POST /api/tasks/{id}/reopen
POST /api/tasks/{id}/cancel
POST /api/tasks/{id}/handoff
POST /api/tasks/{id}/comments
GET /api/work-queues
GET /api/work-queues/{id}/tasks

```
Las APIs finales deberán respetar la arquitectura del proyecto.  
   
⸻  
   
## 115. Permisos  
```
task.create
task.read
task.update
task.assign
task.reassign
task.accept
task.start
task.complete
task.reopen
task.cancel
task.block
task.unblock
task.comment
task.read_internal_comments
task.read_restricted
task.override
task.priority.change
task.due_date.change
task.sla.pause
task.sla.resume
task.handoff
task.export
task.template.read
task.template.manage
task.queue.read
task.queue.manage
task.assignment_rule.manage
task.sla_policy.manage
task.analytics.read

```
   
⸻  
   
## 116. Reglas de transición  
Ejemplos:  
```
open
→ assigned
→ accepted
→ in_progress
→ completed
in_progress
→ waiting_for_client
→ in_progress
in_progress
→ blocked
→ in_progress

```
No permitir:  
```
draft
→ completed

```
sin permiso y razón de override.  
   
⸻  
   
## 117. Overrides  
Un override deberá requerir:  
* permiso;  
* motivo;  
* impacto;  
* actor;  
* timestamp;  
* auditoría;  
* aprobación adicional según riesgo.  
No deberá ser el flujo normal.  
   
⸻  
   
## 118. Eventos de dominio  
```
TaskCreated
TaskAssigned
TaskAccepted
TaskStarted
TaskBlocked
TaskUnblocked
TaskDueSoon
TaskOverdue
TaskEscalated
TaskCompleted
TaskReopened
TaskCancelled
TaskFailed
TaskHandoffRequested
TaskHandoffAccepted
TaskOutcomeRecorded
TaskSlaBreached

```
   
⸻  
   
## 119. Outbox e inbox  
Los eventos críticos deberán usar outbox o equivalente.  
Los consumidores deberán aplicar idempotencia.  
Ejemplos:  
* task completion;  
* task escalation;  
* client action required;  
* approval task;  
* workflow transition.  
   
⸻  
   
## 120. Jobs programados  
Ejemplos:  
* detectar tareas vencidas;  
* detectar SLA próximo;  
* generar recurrencias;  
* enviar recordatorios;  
* liberar asignaciones expiradas;  
* detectar tareas sin owner;  
* escalar blockers;  
* archivar completadas;  
* revisar follow-ups.  
Cada job deberá tener:  
* owner;  
* métricas;  
* reintentos;  
* dead-letter;  
* idempotencia.  
   
⸻  
   
## 121. Fallbacks  
## CRM no disponible  
* mostrar referencias básicas guardadas;  
* no duplicar contacto;  
* mantener tarea.  
## Workflow no disponible  
* permitir trabajo local;  
* no ejecutar transición;  
* marcar sync pending;  
* crear alerta.  
## Document Service no disponible  
* no afirmar evidencia;  
* permitir comentarios;  
* bloquear completion si evidencia es obligatoria.  
## Notification Service no disponible  
* mantener tarea;  
* reintentar notificación.  
## Assignment Service no disponible  
* enviar a Unassigned Queue.  
## IA no disponible  
* tareas y reglas continúan funcionando.  
   
⸻  
   
## 122. Fallos parciales  
Ejemplo:  
```
Tarea completada.
No pudimos actualizar el workflow todavía.
La sincronización quedó pendiente.

```
No revertir falsamente la tarea si el outcome fue guardado.  
Tampoco afirmar que el workflow avanzó.  
   
⸻  
   
## 123. Caché  
Puede cachearse:  
* Task Templates;  
* queues;  
* catálogos;  
* reglas;  
* vistas agregadas.  
No cachear por periodos largos:  
* assignments;  
* permissions;  
* blockers;  
* status;  
* SLA;  
* critical tasks;  
* client actions.  
   
⸻  
   
## 124. Búsqueda  
Buscar por:  
* título;  
* referencia;  
* cliente;  
* empresa;  
* servicio;  
* expediente;  
* owner;  
* queue;  
* task type;  
* outcome.  
No indexar contenido sensible de comentarios.  
   
⸻  
   
## 125. Vistas guardadas  
Ejemplos:  
```
Mis tareas de hoy
Tareas vencidas de Credit
LLC esperando documentos
Refund reviews
Clientes esperando respuesta
AI outputs por revisar
Tareas críticas sin owner

```
Las vistas deberán respetar permisos actuales.  
   
⸻  
   
## 126. Dashboard de tareas  
Widgets:  
* asignadas a mí;  
* vencen hoy;  
* vencidas;  
* sin asignar;  
* bloqueadas;  
* esperando cliente;  
* SLA próximo;  
* escaladas;  
* completadas;  
* carga por equipo.  
   
⸻  
   
## 127. Analytics  
Eventos:  
```
tasks_page_viewed
task_opened
task_created
task_assigned
task_started
task_completed
task_reopened
task_blocked
task_handoff_started
task_filter_applied
task_saved_view_opened
work_queue_opened

```
No enviar PII.  
   
⸻  
   
## 128. Métricas operativas  
* tareas creadas;  
* completadas;  
* vencidas;  
* SLA breaches;  
* tiempo de aceptación;  
* tiempo de inicio;  
* tiempo de completitud;  
* blockers;  
* escalations;  
* reassignments;  
* handoffs;  
* follow-up attempts;  
* no response;  
* tareas sin owner;  
* carga;  
* throughput.  
   
⸻  
   
## 129. Métricas de calidad  
* tareas reabiertas;  
* completion sin evidencia;  
* outcomes faltantes;  
* tareas duplicadas;  
* tareas canceladas por error;  
* overrides;  
* SLA pausados excesivamente;  
* tareas estancadas;  
* handoffs rechazados;  
* IA outputs rechazados.  
   
⸻  
   
## 130. Reporting  
Reportes:  
* productividad por cola;  
* tiempos por servicio;  
* SLA;  
* blockers;  
* tareas por tipo;  
* carga por equipo;  
* aging;  
* follow-ups;  
* escalations;  
* outcomes;  
* automation impact.  
No usar estas métricas como única evaluación de desempeño individual.  
   
⸻  
   
## 131. Accesibilidad  
* navegación por teclado;  
* tablas accesibles;  
* tarjetas;  
* estados con texto;  
* prioridad no solo por color;  
* focus;  
* modales accesibles;  
* formularios claros;  
* timeline con alternativa;  
* drag-and-drop con alternativa;  
* touch targets;  
* lectores de pantalla.  
   
⸻  
   
## 132. Internacionalización  
La interfaz deberá soportar:  
* español;  
* inglés.  
Incluye:  
* tipos;  
* estados;  
* prioridades;  
* outcomes;  
* blockers;  
* queues;  
* SLA;  
* errores;  
* notificaciones;  
* empty states.  
Los títulos introducidos por usuarios no deberán traducirse automáticamente.  
   
⸻  
   
## 133. Empty states  
## Sin tareas  
No tienes tareas pendientes.  
## Sin tareas vencidas  
No hay tareas vencidas.  
## Cola vacía  
No hay trabajo disponible en esta cola.  
## Sin blockers  
Esta tarea no tiene bloqueos activos.  
   
⸻  
   
## 134. Retención  
La retención deberá considerar:  
* service order;  
* case;  
* payment;  
* approval;  
* filing;  
* tax record;  
* security incident;  
* legal hold;  
* audit.  
Las tareas completadas no deberán eliminarse inmediatamente.  
   
⸻  
   
## 135. Archivo  
Las tareas antiguas podrán archivarse para mejorar rendimiento.  
El archivo deberá mantener:  
* referencia;  
* status;  
* outcome;  
* history;  
* audit;  
* links;  
* evidence references.  
   
⸻  
   
## 136. Exportación  
Una exportación deberá:  
* requerir permiso;  
* aplicar filtros;  
* redactar;  
* excluir comentarios restringidos;  
* registrar motivo;  
* usar enlace temporal;  
* auditarse.  
   
⸻  
   
## 137. Testing funcional  
Probar:  
* manual task;  
* automatic task;  
* assignment;  
* queue;  
* acceptance;  
* start;  
* blocker;  
* dependency;  
* checklist;  
* follow-up;  
* recurrence;  
* handoff;  
* SLA;  
* escalation;  
* completion;  
* reopen;  
* cancellation;  
* superseded;  
* client-visible task.  
   
⸻  
   
## 138. Testing de seguridad  
Probar:  
* IDOR;  
* task ajena;  
* queue ajena;  
* restricted comments;  
* assignment tampering;  
* completion without permission;  
* outcome tampering;  
* SLA override;  
* hidden client data;  
* export;  
* mass assignment;  
* AI escalation;  
* cache leakage;  
* resource-scope bypass;  
* comment XSS;  
* prompt injection.  
   
⸻  
   
## 139. Testing de idempotencia  
Probar:  
* evento duplicado;  
* creación duplicada;  
* recurring job duplicado;  
* completion duplicado;  
* escalation duplicada;  
* notification duplicada;  
* handoff duplicado;  
* workflow retry.  
   
⸻  
   
## 140. Testing de concurrencia  
Probar:  
* dos usuarios aceptan;  
* dos usuarios completan;  
* reasignación durante completion;  
* blocker y completion simultáneos;  
* SLA pause concurrente;  
* queue pick concurrente;  
* duplicate follow-up.  
   
⸻  
   
## 141. Testing de resiliencia  
Probar:  
* DB caída;  
* workflow caído;  
* notification caído;  
* assignment service caído;  
* Document Service caído;  
* queue job fallido;  
* event out-of-order;  
* retry;  
* dead-letter;  
* recovery.  
   
⸻  
   
## 142. Testing de rendimiento  
Probar:  
* miles de tareas;  
* muchas colas;  
* filtros;  
* vistas;  
* SLA jobs;  
* recurrencia;  
* múltiples usuarios;  
* SignalR;  
* dashboard;  
* timeline largo.  
   
⸻  
   
## 143. Testing de UX  
Probar:  
* desktop;  
* móvil;  
* tablet;  
* español;  
* inglés;  
* cola vacía;  
* muchas tareas;  
* tareas críticas;  
* tareas bloqueadas;  
* accesibilidad;  
* slow network;  
* fail partial.  
   
⸻  
   
## 144. Criterios de aceptación  
El módulo estará listo cuando:  
1. Exista un único motor de tareas.  
2. CRM y otros módulos reutilicen el mismo motor.  
3. Las tareas tengan tipos estructurados.  
4. Las tareas tengan estados controlados.  
5. Las tareas mantengan outcomes.  
6. Las tareas puedan asignarse a usuarios.  
7. Las tareas puedan asignarse a equipos.  
8. Existan colas.  
9. Exista Unassigned Queue.  
10. Existan prioridades.  
11. Existan fechas.  
12. Existan SLA.  
13. Existan escalaciones.  
14. Existan blockers.  
15. Existan dependencias.  
16. Existan subtareas y checklists.  
17. Existan follow-ups.  
18. Exista recurrencia.  
19. Existan handoffs.  
20. Exista historial de asignación.  
21. Exista idempotencia.  
22. Se eviten duplicados.  
23. Exista autorización por recurso.  
24. Exista autorización por visibilidad.  
25. Exista purpose-based access.  
26. Existan tareas visibles al cliente.  
27. Las tareas internas permanezcan privadas.  
28. La finalización no sustituya aprobación.  
29. La finalización no sustituya workflow.  
30. Se integre con documentos.  
31. Se integre con pagos.  
32. Se integre con citas.  
33. Se integre con comunicaciones.  
34. Se integre con IA de forma limitada.  
35. Exista auditoría.  
36. Exista analytics.  
37. Sea bilingüe.  
38. Sea responsive.  
39. Sea accesible.  
40. Maneje fallos parciales.  
41. Pase pruebas de seguridad.  
42. Pase pruebas de concurrencia.  
43. Pase pruebas de idempotencia.  
44. No permita que la IA complete acciones sensibles.  
45. Reutilice la aplicación existente.  
   
⸻  
   
## 145. Plan de implementación  
## Fase 1 — Auditoría  
* tareas actuales;  
* colas;  
* recordatorios;  
* owners;  
* SLA;  
* duplicados;  
* integraciones.  
## Fase 2 — Núcleo  
* Task;  
* statuses;  
* outcomes;  
* resource links;  
* transitions;  
* DTOs;  
* permissions.  
## Fase 3 — Assignment  
* users;  
* teams;  
* queues;  
* assignment modes;  
* acceptance;  
* reassignments.  
## Fase 4 — Prioridad y SLA  
* priorities;  
* priority score;  
* SLA policies;  
* business calendars;  
* pauses;  
* escalations.  
## Fase 5 — Dependencias y blockers  
* dependencies;  
* blockers;  
* checklists;  
* subtasks;  
* evidence.  
## Fase 6 — Follow-ups  
* follow-up tasks;  
* attempts;  
* stop rules;  
* reminders;  
* recurrence.  
## Fase 7 — Integraciones  
* CRM;  
* clients;  
* organizations;  
* services;  
* cases;  
* forms;  
* documents;  
* billing;  
* appointments;  
* approvals;  
* communications.  
## Fase 8 — IA  
* suggestions;  
* AI review queue;  
* agent runs;  
* tools;  
* validation.  
## Fase 9 — Administración  
* templates;  
* queues;  
* rules;  
* SLA;  
* views;  
* dashboards;  
* exports.  
## Fase 10 — Gobierno  
* auditing;  
* analytics;  
* retention;  
* security;  
* accessibility;  
* testing.  
   
⸻  
   
## 146. Instrucciones finales para Codex  
Antes de implementar:  
1. Lee el contexto maestro.  
2. Lee los módulos 1 al 22.  
3. Lee este documento completo.  
4. Inspecciona todas las entidades de tareas existentes.  
5. No crees un segundo sistema de tareas.  
6. Migra o consolida implementaciones duplicadas.  
7. Mantén Task y Job separados.  
8. Mantén Task y Approval separados.  
9. Mantén Task y Workflow separados.  
10. Implementa estados controlados.  
11. Implementa outcomes estructurados.  
12. No permitas cambios libres de status.  
13. Implementa recursos vinculados.  
14. Implementa autorización por recurso.  
15. Implementa visibilidad.  
16. Implementa queues.  
17. Implementa Unassigned Queue.  
18. Implementa assignment history.  
19. Implementa acceptance cuando aplique.  
20. Implementa prioridades.  
21. Implementa SLA.  
22. Implementa business calendars.  
23. Implementa pausas auditadas.  
24. Implementa escalations.  
25. Implementa blockers.  
26. Implementa dependencias.  
27. Implementa subtareas.  
28. Implementa checklists.  
29. Implementa completion rules.  
30. Implementa evidence references.  
31. Implementa follow-ups.  
32. Implementa stop rules.  
33. Implementa recurrencia idempotente.  
34. Implementa handoffs.  
35. Implementa task templates versionados.  
36. No edites plantillas publicadas.  
37. Implementa idempotency keys.  
38. Evita tareas duplicadas.  
39. Implementa outbox e inbox o equivalente.  
40. Implementa jobs de mantenimiento.  
41. Implementa dead-letter handling.  
42. Integra todos los módulos con el mismo motor.  
43. Limita las herramientas de IA.  
44. No permitas que la IA apruebe.  
45. No permitas que la IA complete tareas sensibles.  
46. No permitas que la IA cambie pagos.  
47. No permitas que la IA presente filings.  
48. No permitas que la IA otorgue entitlements.  
49. Implementa auditoría.  
50. Implementa pruebas de seguridad.  
51. Implementa pruebas de concurrencia.  
52. Implementa pruebas de idempotencia.  
53. Documenta migraciones.  
54. No marques como completa una integración simulada.  
Antes de entregar, verifica:  
* ¿Existe un solo motor de tareas?  
* ¿Toda tarea tiene responsable o cola?  
* ¿Las tareas críticas sin owner generan alerta?  
* ¿Los SLA pueden pausarse solo con razón?  
* ¿Los blockers son visibles y estructurados?  
* ¿Las dependencias impiden completar trabajo inválido?  
* ¿Las tareas del cliente están separadas de tareas internas?  
* ¿Completar una tarea no aprueba automáticamente una acción?  
* ¿Los outcomes son estructurados?  
* ¿Los eventos duplicados no crean tareas duplicadas?  
* ¿Los handoffs conservan contexto?  
* ¿Las colas respetan permisos y capacidad?  
* ¿La IA puede asistir sin cerrar trabajo sensible?  
* ¿Los fallos de otros módulos no eliminan tareas?  
* ¿La implementación reutiliza la aplicación web existente?  
  
  
  
  
  
  
  
## MÓDULO 24 — CENTRO DE APROBACIONES HUMANAS Y CONTROL DE ACCIONES SENSIBLES  
## SG Solutions Operating System  
**Versión:** 1.0.0 **Estado:** Especificación inicial aprobada **Tipo de documento:** Requisitos funcionales, arquitectura de aprobaciones, control humano, segregación de funciones, riesgo, seguridad, auditoría e instrucciones para Codex **Proyecto base:** Aplicación web existente de SG Solutions **Audiencia:** Codex, desarrolladores, responsables de producto, operaciones, especialistas, administración, seguridad, finanzas y cumplimiento **Idiomas de interfaz:** Español e inglés **Idioma del código:** Inglés  
   
⸻  
   
## 1. Contexto obligatorio  
Este módulo deberá integrarse dentro de la aplicación web existente de SG Solutions.  
No deberá construirse como:  
* una aplicación independiente;  
* una bandeja aislada de solicitudes;  
* un segundo motor de workflows;  
* una lista genérica de botones aprobar o rechazar;  
* un sistema donde cualquier empleado pueda aprobar cualquier acción;  
* una interfaz donde la IA apruebe sus propios resultados;  
* una solución que considere una tarea completada como aprobación;  
* una colección de confirmaciones frontend;  
* un sistema que permita ejecutar primero y aprobar después;  
* una vía alternativa para cambiar estados críticos;  
* una herramienta que permita aprobar sin ver evidencia;  
* una interfaz que muestre información sensible a revisores no autorizados;  
* un sistema donde una aprobación no tenga expiración;  
* una solución donde las aprobaciones puedan reutilizarse para otro recurso;  
* un sistema donde un mismo usuario cree, revise, apruebe y ejecute sin registro;  
* una herramienta que permita modificar el contenido aprobado después de la decisión;  
* un sistema donde las aprobaciones puedan eliminarse;  
* una bandeja sin prioridades;  
* una bandeja sin SLA;  
* una solución que no permita solicitar más información;  
* un sistema donde “aprobado” signifique siempre ejecución inmediata;  
* una interfaz que no distinga aprobación total, parcial o condicional;  
* una herramienta que permita aprobar mediante enlaces inseguros;  
* una solución basada únicamente en notificaciones de email;  
* un sistema donde los webhooks externos puedan crear una aprobación ya resuelta;  
* una arquitectura sin idempotencia;  
* una solución donde una aprobación duplicada cause dos ejecuciones;  
* una pantalla que permita aprobar pagos, taxes, filings o disputas sin reautenticación;  
* una vía para que clientes aprueben acciones internas reservadas al owner;  
* un sistema donde el cliente pueda ordenar directamente a la IA ejecutar servicios;  
* una interfaz que oculte cambios entre la versión revisada y la versión ejecutada.  
Antes de implementar, Codex deberá inspeccionar:  
* workflows;  
* tareas;  
* Service Orders;  
* expedientes;  
* documentos;  
* Billing;  
* refunds;  
* disputas;  
* Business Formation;  
* EIN;  
* Taxes;  
* Credit Services;  
* Business Funding;  
* Home Buying;  
* Marketplace;  
* partner data sharing;  
* contratos;  
* consentimientos;  
* firmas;  
* agentes de IA;  
* browser workers;  
* integraciones externas;  
* usuarios;  
* roles;  
* permisos;  
* MFA;  
* reautenticación;  
* auditoría;  
* estados;  
* colas;  
* notificaciones;  
* dashboards;  
* funcionalidades de aprobación existentes;  
* overrides;  
* excepciones;  
* historial.  
Si ya existe una entidad de aprobación, deberá reutilizarse, normalizarse o migrarse.  
No crear un segundo sistema de aprobaciones sin un plan explícito de consolidación.  
   
⸻  
   
## 2. Propósito del módulo  
El Centro de Aprobaciones Humanas será el sistema único para revisar, autorizar, rechazar, condicionar o devolver acciones sensibles antes de que produzcan efectos internos o externos.  
Deberá controlar acciones como:  
1. Iniciar un servicio.  
2. Aprobar una cotización.  
3. Aprobar un descuento.  
4. Aprobar un waiver.  
5. Aprobar una devolución.  
6. Aprobar una cancelación.  
7. Aprobar un filing.  
8. Aprobar una solicitud de EIN.  
9. Aprobar una tax return.  
10. Aprobar una amended return.  
11. Aprobar una disputa de crédito.  
12. Aprobar una carta.  
13. Aprobar un envío a partner.  
14. Aprobar documentos compartidos.  
15. Aprobar una solicitud de funding.  
16. Aprobar una recomendación sensible.  
17. Aprobar cambios de ownership.  
18. Aprobar cambios de registered agent.  
19. Aprobar cambios de identidad.  
20. Aprobar acceso de representantes.  
21. Aprobar suspensión o bloqueo.  
22. Aprobar una excepción operativa.  
23. Aprobar la publicación de servicios.  
24. Aprobar cambios de precio.  
25. Aprobar automatizaciones de alto riesgo.  
26. Aprobar outputs de agentes de IA.  
27. Aprobar ejecución mediante browser worker.  
28. Aprobar exportaciones sensibles.  
29. Aprobar eliminación o anonimización.  
30. Aprobar migraciones de órdenes.  
31. Aprobar overrides de workflow.  
32. Aprobar acciones por encima de límites financieros.  
33. Aprobar excepciones de elegibilidad.  
34. Aprobar excepciones de documentos.  
35. Aprobar acciones legales o regulatorias.  
36. Mantener evidencia de quién decidió.  
37. Evitar que la IA actúe sin supervisión.  
38. Mantener segregación de funciones.  
39. Facilitar auditoría.  
40. Facilitar escalamiento.  
41. Evitar aprobaciones ambiguas.  
42. Evitar que el contenido cambie después de aprobarse.  
El módulo deberá responder:  
¿Qué acción se desea ejecutar, quién la preparó, qué evidencia existe, qué riesgos tiene y quién está autorizado para decidir?  
   
⸻  
   
## 3. Principio central  
Toda acción sensible deberá seguir:  
```
Preparation
→ Validation
→ Approval Request
→ Human Review
→ Decision
→ Revalidation
→ Controlled Execution
→ Evidence Capture
→ Audit

```
No:  
```
AI prepared action
→ Action executed
→ Human notified afterward

```
La aprobación deberá ocurrir antes del efecto externo, salvo emergencias definidas por política.  
   
⸻  
   
## 4. Separación de conceptos  
## Task  
Representa trabajo de revisión.  
## Approval Request  
Representa la solicitud formal de decisión.  
## Approval Decision  
Representa la decisión de un aprobador.  
## Approval Policy  
Define quién debe aprobar y bajo qué condiciones.  
## Execution Authorization  
Token o registro interno que permite ejecutar exactamente la acción aprobada.  
## Execution Result  
Representa el resultado real posterior.  
## Consent  
Representa autorización del cliente.  
## Signature  
Representa aceptación o firma de una persona.  
## Permission  
Representa capacidad técnica de un usuario.  
## Override  
Representa una excepción controlada.  
Consentimiento, firma, permiso y aprobación no son equivalentes.  
   
⸻  
   
## 5. Objetivos  
## 5.1 Objetivos principales  
* Mantener control humano.  
* Impedir ejecuciones no autorizadas.  
* Centralizar decisiones.  
* Definir políticas.  
* Aplicar segregación de funciones.  
* Mantener evidencia.  
* Proteger información.  
* Controlar expiración.  
* Controlar cambios.  
* Mantener historial.  
* Facilitar revisión.  
* Integrar workflows.  
## 5.2 Objetivos secundarios  
* Reducir errores.  
* Reducir fraude.  
* Reducir acciones duplicadas.  
* Mejorar cumplimiento.  
* Facilitar supervisión.  
* Facilitar auditorías.  
* Facilitar escalamiento.  
* Facilitar revisión de IA.  
* Facilitar métricas.  
* Facilitar crecimiento del equipo.  
* Permitir excepciones controladas.  
* Mejorar calidad del servicio.  
   
⸻  
   
## 6. Acciones que siempre requerirán aprobación humana  
La primera versión deberá exigir aprobación para:  
```
service_start
custom_quote
manual_discount
waiver
refund
payment_adjustment
filing_submission
ein_submission
tax_return_submission
amended_tax_return_submission
credit_dispute_submission
credit_letter_submission
partner_data_sharing
funding_application_submission
mortgage_or_lender_application_submission
ownership_change
registered_agent_change
identity_change
representative_access
client_suspension
client_block
sensitive_export
sensitive_data_deletion
workflow_override
entitlement_exception
catalog_price_change
service_publication
high_risk_agent_execution
browser_worker_execution

```
Las políticas podrán añadir más acciones.  
No deberán reducirse sin revisión formal.  
   
⸻  
   
## 7. Acciones que pueden requerir aprobación según riesgo  
Ejemplos:  
* enviar mensaje delicado;  
* usar información no verificada;  
* aceptar un documento alternativo;  
* extender una fecha límite;  
* aplicar crédito comercial;  
* cambiar una cita crítica;  
* compartir un documento no restringido;  
* reasignar un cliente restringido;  
* ejecutar una automatización fallida manualmente;  
* migrar una orden;  
* cerrar un expediente con excepciones;  
* aceptar un intake incompleto;  
* reabrir un servicio;  
* cambiar un fee externo;  
* crear un producto de partner.  
La política deberá determinar cuándo aplica.  
   
⸻  
   
## 8. Tipos de aprobación  
```
service_start
commercial
pricing
discount
waiver
billing
refund
cancellation
document
identity
credit
tax
business_formation
ein
funding
home_buying
partner_sharing
marketplace
security
compliance
legal
data_governance
catalog
workflow_override
agent_output
browser_execution
entitlement
export
deletion
custom

```
   
⸻  
   
## 9. Estados de solicitud  
```
draft
pending_submission
submitted
validation_failed
pending_assignment
assigned
in_review
waiting_for_information
waiting_for_client
waiting_for_internal_action
waiting_for_external_evidence
approved
approved_with_conditions
partially_approved
rejected
withdrawn
cancelled
expired
superseded
executed
execution_failed
closed

```
La decisión y la ejecución deberán representarse por separado.  
   
⸻  
   
## 10. Estados de decisión  
```
pending
approved
approved_with_conditions
partially_approved
rejected
abstained
recused
expired
superseded

```
   
⸻  
   
## 11. Estados de ejecución  
```
not_authorized
authorized
queued
executing
succeeded
partially_succeeded
failed
compensating
compensated
cancelled
expired
unknown

```
Una aprobación aprobada no implica que la ejecución haya ocurrido.  
   
⸻  
   
## 12. Alcance funcional  
El módulo incluirá:  
* solicitudes;  
* políticas;  
* revisores;  
* roles;  
* colas;  
* prioridades;  
* SLA;  
* evidencia;  
* checklists;  
* decisiones;  
* comentarios;  
* condiciones;  
* aprobaciones múltiples;  
* quorum;  
* secuencia;  
* paralelismo;  
* recusación;  
* delegación;  
* escalamiento;  
* expiración;  
* revocación;  
* revalidación;  
* authorization tokens;  
* ejecución;  
* resultados;  
* compensación;  
* overrides;  
* notificaciones;  
* auditoría;  
* analytics;  
* seguridad;  
* accesibilidad;  
* internacionalización;  
* testing;  
* fallbacks.  
   
⸻  
   
## 13. Fuera de alcance  
El módulo no deberá:  
* preparar taxes;  
* preparar filings;  
* preparar disputas;  
* calcular precios;  
* ejecutar refunds;  
* modificar pagos;  
* almacenar documentos;  
* reemplazar consentimientos;  
* reemplazar firmas;  
* reemplazar tareas;  
* reemplazar workflows;  
* permitir aprobación automática de alto riesgo;  
* permitir a la IA decidir;  
* permitir aprobaciones anónimas;  
* permitir aprobación por enlace sin autenticación reforzada;  
* permitir editar el objeto aprobado;  
* permitir una aprobación para varios recursos no relacionados;  
* permitir reutilizar authorization tokens;  
* ocultar rechazos;  
* eliminar decisiones;  
* inventar evidencia;  
* presentar una solicitud aprobada como ejecución exitosa.  
   
⸻  
   
## 14. Navegación administrativa  
Ruta sugerida:  
```
/admin/approvals

```
Subsecciones:  
```
Pendientes
Asignadas a mí
Urgentes
Esperando información
Aprobadas
Rechazadas
Expiradas
Ejecutadas
Fallidas
Políticas
Colas
Delegaciones
Reportes
Configuración

```
Detalle:  
```
/admin/approvals/[approvalRequestId]

```
   
⸻  
   
## 15. Vista de aprobación  
Deberá incluir:  
1. Acción solicitada.  
2. Recurso.  
3. Cliente u organización.  
4. Servicio.  
5. Riesgo.  
6. Prioridad.  
7. Solicitante.  
8. Preparador.  
9. Agente involucrado.  
10. Evidencia.  
11. Cambios propuestos.  
12. Versión.  
13. Checklist.  
14. Condiciones.  
15. Historial.  
16. Comentarios.  
17. Comparación.  
18. Impacto.  
19. Decisiones anteriores.  
20. CTA de decisión.  
   
⸻  
   
## 16. Lista de solicitudes  
Columnas sugeridas:  
```
Solicitud
Tipo
Cliente u organización
Servicio
Riesgo
Prioridad
Solicitante
Aprobador
Estado
Creada
Vence

```
Filtros:  
* tipo;  
* estado;  
* riesgo;  
* prioridad;  
* equipo;  
* aprobador;  
* servicio;  
* cliente;  
* organización;  
* fecha;  
* IA involucrada;  
* ejecución pendiente;  
* vencida;  
* escalada.  
   
⸻  
   
## 17. Título de aprobación  
El título deberá ser claro y no incluir PII sensible.  
Ejemplo:  
```
Aprobar presentación de LLC en Illinois

```
No:  
```
Aprobar formulario con SSN 123-45-6789

```
   
⸻  
   
## 18. Descripción  
Deberá explicar:  
* qué se desea hacer;  
* por qué;  
* efecto;  
* costo;  
* datos utilizados;  
* evidencia;  
* riesgos;  
* resultado esperado.  
No deberá depender únicamente de una nota generada por IA.  
   
⸻  
   
## 19. Referencia pública  
Cada aprobación deberá tener:  
```
APR-2026-001284

```
La referencia no otorga acceso.  
   
⸻  
   
## 20. Riesgo  
Niveles:  
```
low
moderate
high
critical

```
Factores:  
* dinero;  
* identidad;  
* tax;  
* crédito;  
* filing;  
* datos compartidos;  
* irreversible action;  
* external submission;  
* legal deadline;  
* client impact;  
* automation;  
* novelty;  
* exception;  
* amount.  
   
⸻  
   
## 21. Risk Assessment  
Campos:  
```
riskLevel
riskFactors
irreversibility
financialImpact
privacyImpact
complianceImpact
clientImpact
externalImpact
automationRisk
recommendedApproverRoles

```
El cálculo deberá ser explicable.  
La IA puede sugerir factores.  
No deberá establecer la decisión final.  
   
⸻  
   
## 22. Prioridad  
Niveles:  
```
critical
urgent
high
normal
low

```
La prioridad deberá considerar:  
* deadline;  
* filing date;  
* SLA;  
* pago;  
* cliente bloqueado;  
* riesgo;  
* tiempo en cola;  
* dependencia de workflow;  
* incidencia.  
   
⸻  
   
## 23. Approval Policy  
Cada acción deberá vincularse a una política.  
Campos:  
```
id
code
name
actionType
serviceDefinitionId
riskLevel
minimumApprovers
requiredRoles
allowedApproverRoles
prohibitedApproverRoles
separationOfDuties
amountThreshold
jurisdictionRule
evidenceRequirements
checklistDefinitionId
expirationRule
escalationPolicyId
executionPolicyId
status
version

```
   
⸻  
   
## 24. Códigos de políticas  
Ejemplos:  
```
APPROVE_SERVICE_START
APPROVE_IL_LLC_FILING
APPROVE_EIN_SUBMISSION
APPROVE_TAX_RETURN_SUBMISSION
APPROVE_CREDIT_DISPUTE
APPROVE_REFUND_OVER_100
APPROVE_PARTNER_DOCUMENT_SHARE
APPROVE_CLIENT_SUSPENSION
APPROVE_AGENT_BROWSER_EXECUTION

```
   
⸻  
   
## 25. Política por monto  
Ejemplo:  
```
Refund under $50
→ 1 Billing Reviewer

Refund $50–$500
→ Billing Reviewer + Supervisor

Refund over $500
→ Supervisor + Owner

```
Los límites deberán configurarse en centavos.  
   
⸻  
   
## 26. Política por riesgo  
Ejemplo:  
```
Low:
1 authorized reviewer

High:
2 reviewers

Critical:
Owner + specialist + reauthentication

```
   
⸻  
   
## 27. Política por jurisdicción  
Puede requerir:  
* especialista estatal;  
* tax specialist;  
* reviewer autorizado;  
* responsable de compliance;  
* owner.  
No asumir que un único reviewer puede aprobar acciones nacionales.  
   
⸻  
   
## 28. Policy Versioning  
Las políticas publicadas deberán ser inmutables.  
Cada solicitud deberá guardar:  
```
approvalPolicyVersion

```
Los cambios futuros no modificarán solicitudes existentes, salvo migración explícita.  
   
⸻  
   
## 29. Creación de solicitud  
Podrá originarse desde:  
* workflow;  
* tarea;  
* formulario;  
* documento;  
* Billing;  
* Service Order;  
* agente;  
* browser worker;  
* employee;  
* security event;  
* partner flow;  
* catalog publication;  
* override request.  
   
⸻  
   
## 30. Solicitante  
Tipos:  
```
user
team
workflow
system
agent
service_account
partner_integration

```
Una solicitud creada por IA deberá estar identificada claramente.  
   
⸻  
   
## 31. Preparador  
La persona o sistema que preparó el contenido deberá registrarse por separado.  
Ejemplo:  
```
Requested by:
Business Formation Workflow

Prepared by:
Business Formation Agent

Submitted by:
Assigned Specialist

```
   
⸻  
   
## 32. Prohibición de autoaprobación  
Por defecto:  
```
requester != sole approver
preparer != sole approver
executor != sole approver

```
Las excepciones del owner deberán:  
* requerir confirmación;  
* registrar razón;  
* marcarse como override;  
* auditarse.  
   
⸻  
   
## 33. Segregación de funciones  
El sistema deberá poder exigir:  
```
prepare
review
approve
execute
reconcile

```
por personas o roles distintos.  
Ejemplo:  
```
Tax preparer
→ prepares return

Tax reviewer
→ reviews

Owner
→ authorizes filing

Tax provider
→ submits

Billing
→ reconciles fee

```
   
⸻  
   
## 34. Aprobación de una sola persona  
Permitida para acciones de menor riesgo según política.  
Requisitos:  
* reviewer autorizado;  
* evidencia;  
* checklist;  
* reautenticación cuando aplique;  
* auditoría.  
   
⸻  
   
## 35. Aprobación múltiple  
Tipos:  
```
all_required
minimum_quorum
any_one_of_group
sequential
parallel
conditional

```
   
⸻  
   
## 36. Aprobación secuencial  
Ejemplo:  
```
Specialist review
→ Compliance review
→ Owner approval

```
La siguiente etapa no deberá comenzar antes de la anterior.  
   
⸻  
   
## 37. Aprobación paralela  
Ejemplo:  
```
Billing review
+
Service review
→ Owner decision

```
   
⸻  
   
## 38. Quorum  
Ejemplo:  
```
3 reviewers assigned
2 approvals required
0 critical objections

```
La política deberá definir cómo cuentan:  
* rechazo;  
* abstención;  
* recusación;  
* expiración.  
   
⸻  
   
## 39. Veto  
Algunas políticas podrán definir roles con veto.  
Ejemplo:  
* Security puede detener un data share.  
* Compliance puede detener un filing.  
* Owner puede detener ejecución.  
El veto deberá estar documentado.  
   
⸻  
   
## 40. Recusación  
Un aprobador podrá recusarse por:  
* conflicto de interés;  
* falta de conocimiento;  
* participación previa;  
* relación personal;  
* ausencia;  
* alcance incorrecto.  
La recusación deberá:  
* registrar razón;  
* reasignar;  
* mantener SLA;  
* no contarse como rechazo.  
   
⸻  
   
## 41. Delegación  
Un aprobador podrá delegar temporalmente cuando la política lo permita.  
La delegación deberá incluir:  
```
delegator
delegate
scope
effectiveFrom
expiresAt
reason
approvedBy

```
No permitir delegación general indefinida.  
   
⸻  
   
## 42. Colas de aprobación  
Tipos:  
```
service_start
billing
refund
tax
credit
business_formation
funding
home_buying
marketplace
data_sharing
security
compliance
catalog
ai_output
browser_execution
owner_review
custom

```
   
⸻  
   
## 43. Asignación  
Una aprobación podrá asignarse a:  
* usuario;  
* equipo;  
* rol;  
* cola;  
* grupo;  
* owner.  
La asignación deberá considerar:  
* permiso;  
* riesgo;  
* servicio;  
* jurisdicción;  
* disponibilidad;  
* conflicto;  
* carga;  
* idioma cuando corresponda.  
   
⸻  
   
## 44. Aceptación de revisión  
El aprobador podrá tener que aceptar la solicitud.  
Estados:  
```
assigned
accepted
declined
recused
released
reassigned

```
   
⸻  
   
## 45. SLA  
Tipos:  
```
assignment_sla
acceptance_sla
review_sla
decision_sla
execution_sla

```
   
⸻  
   
## 46. Escalamiento  
Activadores:  
* sin asignar;  
* no aceptada;  
* próxima a vencer;  
* vencida;  
* riesgo elevado;  
* deadline legal;  
* solicitud bloqueada;  
* reviewer ausente;  
* evidencia cambió.  
Acciones:  
* notificar;  
* aumentar prioridad;  
* reasignar;  
* añadir reviewer;  
* escalar al owner;  
* pausar workflow;  
* bloquear ejecución.  
   
⸻  
   
## 47. Evidencia  
Una solicitud deberá vincular evidencia como:  
* formulario;  
* documento;  
* review record;  
* payment record;  
* quote;  
* contract;  
* consent;  
* signature;  
* profile snapshot;  
* filing draft;  
* tax return draft;  
* dispute draft;  
* partner disclosure;  
* system logs;  
* prior approval;  
* agent output.  
No almacenar copias innecesarias.  
   
⸻  
   
## 48. Evidence Requirement  
Cada política deberá definir:  
```
evidenceType
required
minimumVerificationStatus
maximumAge
allowedAlternatives
requiredReviewerRole

```
   
⸻  
   
## 49. Evidencia desactualizada  
La aprobación deberá bloquearse o advertir cuando:  
* documento vencido;  
* profile changed;  
* payment reversed;  
* consent revoked;  
* price changed;  
* filing draft changed;  
* tax calculation changed;  
* client identity changed;  
* partner terms changed.  
   
⸻  
   
## 50. Checklist  
Cada solicitud podrá requerir un checklist.  
Ejemplo para LLC:  
```
✓ Payment confirmed
✓ Client identity reviewed
✓ Formation state confirmed
✓ Legal name confirmed
✓ Owners reviewed
✓ Registered agent reviewed
✓ State fee confirmed
✓ Filing draft matches intake
✓ Client authorization valid

```
   
⸻  
   
## 51. Checklist inmutable después de decisión  
Al aprobar, el estado del checklist deberá formar parte del snapshot.  
No permitir modificarlo retroactivamente.  
   
⸻  
   
## 52. Comparación de cambios  
La interfaz deberá mostrar diferencias.  
Ejemplo:  
```
Business name:
SG Logistics → SG Logistics Group

Owner percentage:
100 % → 50 %

State fee:
$150 → $175

```
Los cambios críticos deberán invalidar decisiones previas.  
   
⸻  
   
## 53. Approval Payload  
La solicitud deberá contener un payload estructurado.  
Ejemplo:  
```
{
  "actionType": "filing_submission",
  "resourceType": "filing_record",
  "resourceId": "FIL-2041",
  "serviceOrderId": "SO-921",
  "requestedAction": {
    "jurisdiction": "IL",
    "filingType": "articles_of_organization",
    "version": 3
  },
  "financialImpact": {
    "serviceFee": 29900,
    "externalFee": 15000,
    "currency": "USD"
  }
}

```
No depender únicamente de texto.  
   
⸻  
   
## 54. Snapshot de aprobación  
Al enviar a revisión, guardar snapshot de:  
* acción;  
* recurso;  
* versión;  
* datos relevantes;  
* documentos;  
* precio;  
* fees;  
* consentimientos;  
* workflow;  
* output de IA;  
* reglas;  
* checklist.  
La aprobación deberá aplicarse al snapshot exacto.  
   
⸻  
   
## 55. Hash de contenido  
Para acciones sensibles deberá generarse:  
```
approvalPayloadHash

```
Antes de ejecutar, volver a calcular.  
Si no coincide:  
```
execution blocked
→ new approval required

```
   
⸻  
   
## 56. Decisiones  
Opciones:  
```
approve
approve_with_conditions
partially_approve
reject
request_information
abstain
recuse

```
   
⸻  
   
## 57. Aprobación total  
Autoriza exactamente la acción solicitada.  
No autoriza cambios posteriores.  
   
⸻  
   
## 58. Aprobación condicional  
Ejemplo:  
```
Aprobado para preparar el filing.
No autorizado para enviarlo hasta recibir proof of address.

```
Las condiciones deberán ser estructuradas.  
   
⸻  
   
## 59. Aprobación parcial  
Ejemplo:  
```
Aprobado:
Service fee refund

No aprobado:
Government fee refund

```
Cada componente deberá tener resultado.  
   
⸻  
   
## 60. Rechazo  
El rechazo deberá incluir:  
* reason code;  
* explicación interna;  
* mensaje público cuando corresponda;  
* si puede reenviarse;  
* requisitos para nueva solicitud.  
No eliminar la solicitud.  
   
⸻  
   
## 61. Request Information  
La solicitud podrá volver al preparador o cliente.  
Estados:  
```
waiting_for_information
waiting_for_client
waiting_for_internal_action

```
El SLA podrá pausarse según política.  
   
⸻  
   
## 62. Reason Codes  
Ejemplos:  
```
missing_information
insufficient_evidence
data_conflict
payment_not_confirmed
consent_missing
document_expired
outside_scope
unsupported_jurisdiction
policy_violation
security_risk
incorrect_amount
incorrect_version
duplicate_request
client_withdrew
other

```
   
⸻  
   
## 63. Comentarios  
Visibilidades:  
```
internal
review_team
restricted
client_visible
system

```
Los comentarios no deberán reemplazar condiciones estructuradas.  
   
⸻  
   
## 64. Solicitud modificada  
Si se corrige contenido:  
```
Original request
→ changes proposed
→ new version created
→ previous approval superseded
→ new approval cycle

```
No editar la solicitud aprobada.  
   
⸻  
   
## 65. Superseded  
Una solicitud quedará superseded cuando:  
* cambia el recurso;  
* cambia el monto;  
* cambia la versión;  
* cambia el documento;  
* cambia el consentimiento;  
* cambia la acción;  
* se crea una solicitud nueva.  
   
⸻  
   
## 66. Expiración  
Una aprobación podrá expirar por:  
* tiempo;  
* cambio de datos;  
* cambio de precio;  
* cambio de fee;  
* cambio de política;  
* cambio de documento;  
* cambio de identidad;  
* cambio de consentimiento;  
* cambio de proveedor;  
* cambio de jurisdicción;  
* cambio de workflow.  
   
⸻  
   
## 67. Revocación  
Una aprobación podrá revocarse antes de ejecutar cuando:  
* aparece evidencia nueva;  
* se detecta fraude;  
* cliente retira autorización;  
* pago se revierte;  
* aprobación fue incorrecta;  
* seguridad bloquea;  
* acción ya no aplica.  
La revocación deberá requerir permiso y razón.  
   
⸻  
   
## 68. Revalidación antes de ejecución  
Antes de ejecutar, comprobar:  
```
approval is valid
approval is not expired
approval is not revoked
payload hash matches
resource version matches
payment state valid
consent valid
documents valid
actor authorized
execution not already performed
idempotency key valid
kill switch off

```
   
⸻  
   
## 69. Execution Authorization  
Después de aprobar, crear un registro limitado.  
Campos:  
```
id
approvalRequestId
actionType
resourceType
resourceId
payloadHash
authorizedExecutorType
authorizedExecutorId
effectiveFrom
expiresAt
maxExecutions
executionCount
status
createdAt
revokedAt

```
   
⸻  
   
## 70. Token de autorización  
Si se utiliza token técnico:  
* firmado;  
* corto;  
* un solo propósito;  
* un recurso;  
* expiración;  
* audiencia;  
* nonce;  
* no reutilizable;  
* no expuesto en logs.  
No deberá ser un token general de sesión.  
   
⸻  
   
## 71. Ejecución  
Puede realizarla:  
* usuario;  
* workflow;  
* service account;  
* browser worker;  
* integración API;  
* agente interno con herramienta limitada.  
La aprobación deberá definir quién puede ejecutar.  
   
⸻  
   
## 72. Idempotencia  
La ejecución deberá usar una clave basada en:  
```
approvalRequestId
+ actionType
+ resourceVersion

```
Una aprobación no deberá causar dos filings, refunds o submissions.  
   
⸻  
   
## 73. Resultado de ejecución  
Registrar:  
```
executor
startedAt
completedAt
status
externalReference
provider
evidenceReference
errorCode
retryable
compensationStatus

```
   
⸻  
   
## 74. Ejecución parcial  
Ejemplo:  
```
Partner data package prepared
but
partner API submission failed

```
El estado deberá ser:  
```
partially_succeeded

```
No succeeded.  
   
⸻  
   
## 75. Fallo de ejecución  
El fallo no deberá cambiar la decisión a rechazado.  
Estados separados:  
```
Approval:
approved

Execution:
failed

```
   
⸻  
   
## 76. Reintento  
El reintento deberá:  
* usar misma autorización si continúa válida;  
* usar idempotencia;  
* respetar máximo;  
* distinguir error temporal;  
* registrar intento;  
* escalar.  
Si cambia el payload, requiere nueva aprobación.  
   
⸻  
   
## 77. Compensación  
Para acciones parcialmente ejecutadas, podrá requerirse:  
* cancelar job;  
* revocar entitlement;  
* revertir share grant;  
* corregir status;  
* abrir support case;  
* procesar refund;  
* crear incidente.  
La compensación podrá requerir otra aprobación.  
   
⸻  
   
## 78. Aprobación de service start  
Deberá revisar:  
* pago;  
* intake;  
* identidad;  
* documentos;  
* contrato;  
* consentimientos;  
* disponibilidad;  
* elegibilidad;  
* asignación;  
* blockers.  
Resultado:  
```
approved_to_start
approved_with_conditions
more_information_required
rejected

```
   
⸻  
   
## 79. Aprobación de cotización  
Revisar:  
* servicio;  
* alcance;  
* precio;  
* fees;  
* descuentos;  
* validez;  
* moneda;  
* condiciones;  
* partner components;  
* margen futuro;  
* documentos.  
   
⸻  
   
## 80. Aprobación de descuento  
Revisar:  
* monto;  
* porcentaje;  
* límite;  
* razón;  
* cliente;  
* servicio;  
* acumulación;  
* impacto;  
* autorización.  
La IA no podrá aplicarlo.  
   
⸻  
   
## 81. Aprobación de refund  
Revisar:  
* pago original;  
* monto;  
* fees;  
* trabajo realizado;  
* refund policy;  
* external fees;  
* entitlements;  
* dispute;  
* provider status;  
* impacto contable.  
   
⸻  
   
## 82. Aprobación de filing  
Revisar:  
* identidad de empresa;  
* jurisdicción;  
* tipo;  
* versión;  
* owners;  
* management;  
* address;  
* registered agent;  
* fee;  
* client authorization;  
* filing draft;  
* deadline;  
* portal readiness.  
   
⸻  
   
## 83. Aprobación de EIN  
Revisar:  
* entidad;  
* responsible party;  
* SSN o ITIN bajo acceso restringido;  
* dirección;  
* tax classification;  
* formation evidence;  
* duplicate EIN risk;  
* authorization;  
* draft.  
El full SSN no deberá mostrarse a todos los reviewers.  
   
⸻  
   
## 84. Aprobación tributaria  
Revisar:  
* return version;  
* tax year;  
* filing status;  
* income sources;  
* dependents;  
* states;  
* calculations;  
* signatures;  
* disclosures;  
* preparer review;  
* client authorization;  
* e-file readiness.  
   
⸻  
   
## 85. Aprobación de disputa de crédito  
Revisar:  
* account;  
* bureau;  
* reason;  
* evidence;  
* client statement;  
* dispute type;  
* legal basis propuesta;  
* letter version;  
* prior disputes;  
* consent;  
* prohibited claims.  
No aprobar disputas frívolas o información falsa.  
   
⸻  
   
## 86. Aprobación de funding application  
Revisar:  
* partner;  
* amount;  
* purpose;  
* business data;  
* income;  
* ownership;  
* consent;  
* documents;  
* application version;  
* data sharing scope;  
* disclosures.  
   
⸻  
   
## 87. Aprobación de Home Buying referral  
Revisar:  
* programa;  
* lender;  
* estado;  
* county;  
* household summary;  
* consent;  
* data shared;  
* documents;  
* disclosure;  
* preliminary status.  
No presentarlo como loan approval.  
   
⸻  
   
## 88. Aprobación de partner data sharing  
Deberá mostrar:  
```
Partner
Product
Purpose
Fields
Documents
Expiration
Consent
Compensation disclosure
Security status

```
   
⸻  
   
## 89. Aprobación de ownership change  
Revisar:  
* empresa;  
* owner actual;  
* owner propuesto;  
* porcentaje;  
* fecha efectiva;  
* evidencia;  
* access impact;  
* tax impact flagged;  
* client authorization;  
* service impact.  
   
⸻  
   
## 90. Aprobación de representante  
Revisar:  
* identidad;  
* relación;  
* scope;  
* servicios;  
* permisos;  
* expiración;  
* evidencia;  
* otorgante;  
* conflicto.  
   
⸻  
   
## 91. Aprobación de suspensión  
Revisar:  
* motivo;  
* evidencia;  
* alcance;  
* riesgo;  
* servicios;  
* pagos;  
* acceso;  
* comunicación;  
* duración;  
* revisión futura.  
No permitir suspensión automática por IA.  
   
⸻  
   
## 92. Aprobación de exportación  
Revisar:  
* solicitante;  
* propósito;  
* campos;  
* clientes;  
* volumen;  
* sensibilidad;  
* redacción;  
* expiración;  
* destino;  
* legal hold.  
   
⸻  
   
## 93. Aprobación de eliminación  
Revisar:  
* categoría;  
* retención;  
* pagos;  
* servicios;  
* legal hold;  
* auditoría;  
* anonymization;  
* purge;  
* backups;  
* obligaciones.  
No prometer borrado total inmediato.  
   
⸻  
   
## 94. Aprobación de output de IA  
La vista deberá mostrar:  
* agente;  
* propósito;  
* modelo;  
* prompt version;  
* fuentes;  
* tools;  
* output;  
* confidence;  
* validations;  
* diferencias;  
* riesgos;  
* PII exposure;  
* reviewer.  
   
⸻  
   
## 95. Estados de output IA  
```
draft
pending_review
approved
approved_with_edits
rejected
superseded
executed

```
   
⸻  
   
## 96. Aprobación con edición  
Cuando el reviewer edite:  
* guardar original;  
* guardar versión editada;  
* registrar autor;  
* recalcular hash;  
* aprobar versión editada;  
* no ocultar el cambio.  
   
⸻  
   
## 97. Browser Worker  
Antes de utilizar automatización de navegador:  
* verificar aprobación;  
* verificar dominio;  
* verificar action scope;  
* verificar credenciales;  
* verificar payload;  
* activar grabación técnica permitida;  
* bloquear pasos no autorizados;  
* capturar evidencia.  
   
⸻  
   
## 98. Browser Worker Execution Plan  
La solicitud deberá incluir:  
```
targetDomain
actionType
allowedPages
allowedFields
prohibitedActions
expectedResult
timeout
screenshotPolicy
credentialReference

```
No permitir navegación libre.  
   
⸻  
   
## 99. Confirmación antes del paso irreversible  
Para filings, refunds o submissions:  
```
worker prepares final page
→ captures review snapshot
→ human confirms
→ worker submits

```
Cuando sea técnicamente viable.  
   
⸻  
   
## 100. Supervisión del owner  
En la primera etapa, el owner podrá ser el principal aprobador.  
El sistema deberá quedar preparado para:  
* especialistas;  
* reviewers;  
* managers;  
* compliance;  
* billing;  
* security;  
* auditors.  
No hardcodear una única cuenta.  
   
⸻  
   
## 101. Owner Override  
Podrá utilizarse cuando:  
* solo existe un operador;  
* urgencia;  
* recuperación;  
* policy exception;  
* migración.  
Requisitos:  
* reautenticación;  
* razón;  
* impacto;  
* advertencia;  
* auditoría;  
* alerta;  
* revisión posterior para riesgo crítico.  
   
⸻  
   
## 102. Break-glass access  
Para emergencias:  
```
BreakGlassAuthorization

```
Requisitos:  
* motivo obligatorio;  
* alcance mínimo;  
* expiración corta;  
* MFA;  
* alerta inmediata;  
* auditoría reforzada;  
* revisión posterior;  
* no disponible para acciones rutinarias.  
   
⸻  
   
## 103. Kill switches  
Antes de ejecutar, verificar kill switches para:  
* filings;  
* EIN;  
* taxes;  
* credit disputes;  
* refunds;  
* partner sharing;  
* browser worker;  
* AI execution;  
* exports;  
* deletions;  
* service publication.  
   
⸻  
   
## 104. Notificaciones  
Al solicitante:  
* recibida;  
* asignada;  
* information requested;  
* aprobada;  
* rechazada;  
* expirada;  
* ejecutada;  
* fallo.  
Al aprobador:  
* asignada;  
* urgente;  
* vence pronto;  
* escalada;  
* evidencia cambió;  
* conflicto.  
No incluir PII sensible.  
   
⸻  
   
## 105. Comunicación al cliente  
Solo cuando corresponda.  
Ejemplos:  
* necesitamos información;  
* acción aprobada;  
* acción no autorizada;  
* filing enviado;  
* refund procesado;  
* representante aprobado.  
No mostrar notas internas.  
   
⸻  
   
## 106. Approval Request Entity  
```
id
publicReference
approvalPolicyId
approvalPolicyVersion
actionType
resourceType
resourceId
serviceOrderId
caseId
clientId
organizationId
requestedByType
requestedById
preparedByType
preparedById
status
riskLevel
priority
payloadSnapshotEncrypted
payloadHash
financialImpact
submittedAt
expiresAt
approvedAt
rejectedAt
executedAt
createdAt
updatedAt
version

```
   
⸻  
   
## 107. Approval Assignment  
```
id
approvalRequestId
assignmentType
assignedUserId
assignedTeamId
assignedRoleCode
assignedQueueId
status
sequenceNumber
required
assignedAt
acceptedAt
completedAt
recusedAt
reasonCode

```
   
⸻  
   
## 108. Approval Decision  
```
id
approvalRequestId
approvalAssignmentId
decision
reasonCode
decisionCommentEncrypted
conditions
approvedPayloadHash
decidedBy
decidedAt
reauthenticationMethod

```
   
⸻  
   
## 109. Approval Condition  
```
id
approvalRequestId
code
description
conditionType
resourceReference
status
satisfiedAt
verifiedBy
expiresAt

```
   
⸻  
   
## 110. Approval Evidence Link  
```
id
approvalRequestId
evidenceType
resourceType
resourceId
resourceVersion
required
verificationStatus
addedBy
addedAt

```
   
⸻  
   
## 111. Approval Checklist Item  
```
id
approvalRequestId
code
title
required
status
evidenceReference
completedBy
completedAt

```
   
⸻  
   
## 112. Execution Authorization  
```
id
approvalRequestId
actionType
resourceType
resourceId
payloadHash
authorizedExecutorType
authorizedExecutorId
status
effectiveFrom
expiresAt
maxExecutions
executionCount
revokedAt
createdAt

```
   
⸻  
   
## 113. Approval Execution  
```
id
executionAuthorizationId
approvalRequestId
executorType
executorId
status
idempotencyKey
provider
externalReference
startedAt
completedAt
errorCode
errorMessageRedacted
evidenceReference
compensationStatus
createdAt
updatedAt

```
   
⸻  
   
## 114. Approval Policy  
```
id
code
name
actionType
serviceDefinitionId
riskLevel
minimumApprovers
approvalMode
requiredRoles
allowedRoles
prohibitedRoles
separationOfDuties
amountThresholds
evidenceRequirements
checklistDefinitionId
expirationRule
revalidationRules
executionPolicy
escalationPolicyId
status
currentVersionId
createdAt
updatedAt

```
   
⸻  
   
## 115. Approval Policy Version  
```
id
approvalPolicyId
versionNumber
configurationSnapshot
changeSummary
status
approvedBy
approvedAt
effectiveFrom
effectiveTo
createdAt

```
   
⸻  
   
## 116. Approval Delegation  
```
id
delegatorUserId
delegateUserId
scope
roleCodes
actionTypes
effectiveFrom
expiresAt
status
approvedBy
reason
createdAt
revokedAt

```
   
⸻  
   
## 117. Approval Override  
```
id
approvalRequestId
overrideType
previousRequirement
newRequirement
reason
impact
requestedBy
approvedBy
createdAt

```
   
⸻  
   
## 118. Approval History  
```
id
approvalRequestId
eventType
previousState
newState
actorType
actorId
reasonCode
metadata
createdAt

```
   
⸻  
   
## 119. Arquitectura técnica  
```
Admin Portal
      ↓
Approval UI
      ↓
Approval API
      ↓
Authorization, Risk and Reauthentication Layer
      ↓
Approval Service
      ├── Requests
      ├── Policies
      ├── Assignments
      ├── Evidence
      ├── Checklists
      ├── Decisions
      ├── Conditions
      ├── Quorum
      ├── Delegations
      ├── Expiration
      ├── Authorization
      ├── Execution
      ├── Escalation
      └── History
      ↓
Workflows / Tasks / Documents / Billing / Agents / External Workers

```
   
⸻  
   
## 120. Approval Service  
Responsabilidades:  
* crear solicitud;  
* seleccionar política;  
* evaluar riesgo;  
* validar evidencia;  
* asignar;  
* manejar decisiones;  
* calcular quorum;  
* manejar condiciones;  
* manejar expiración;  
* emitir authorization;  
* revalidar;  
* registrar ejecución;  
* mantener auditoría;  
* emitir eventos;  
* aplicar permisos.  
No deberá preparar el contenido profesional.  
   
⸻  
   
## 121. DTOs  
Crear:  
```
ApprovalListItemDto
ApprovalSummaryDto
ApprovalDetailDto
ApprovalEvidenceDto
ApprovalChecklistDto
ApprovalDecisionDto
ApprovalConditionDto
ApprovalExecutionDto
ApprovalPolicyDto

```
Los DTOs deberán aplicar redacción según rol.  
   
⸻  
   
## 122. APIs conceptuales  
```
GET /api/approvals
GET /api/approvals/{id}
POST /api/approvals
POST /api/approvals/{id}/submit
POST /api/approvals/{id}/assign
POST /api/approvals/{id}/accept
POST /api/approvals/{id}/request-information
POST /api/approvals/{id}/approve
POST /api/approvals/{id}/approve-with-conditions
POST /api/approvals/{id}/partially-approve
POST /api/approvals/{id}/reject
POST /api/approvals/{id}/recuse
POST /api/approvals/{id}/withdraw
POST /api/approvals/{id}/revoke
POST /api/approvals/{id}/execute
GET /api/approval-policies

```
Las APIs finales deberán respetar la arquitectura existente.  
   
⸻  
   
## 123. Permisos  
```
approval.create
approval.read
approval.read_restricted
approval.submit
approval.assign
approval.accept
approval.review
approval.request_information
approval.approve
approval.approve_conditional
approval.partial_approve
approval.reject
approval.recuse
approval.withdraw
approval.revoke
approval.execute
approval.override
approval.delegate
approval.policy.read
approval.policy.manage
approval.policy.approve
approval.queue.read
approval.queue.manage
approval.history.read
approval.export
approval.analytics.read

```
   
⸻  
   
## 124. Autorización por recurso  
Para ver:  
```
User authenticated
AND
User has approval.read
AND
User scope includes linked resource
AND
User purpose allows approval type
AND
Sensitivity permits evidence access

```
   
⸻  
   
## 125. Autorización para decidir  
```
User has approval.approve
AND
User is assigned or valid policy approver
AND
User is not prohibited by separation rules
AND
User has required role
AND
Request is in reviewable state
AND
Evidence requirements are satisfied
AND
Reauthentication completed when required

```
   
⸻  
   
## 126. Autorización para ejecutar  
```
Valid ExecutionAuthorization
AND
Payload hash matches
AND
Executor allowed
AND
Execution count available
AND
Authorization not expired
AND
Approval not revoked
AND
Kill switch disabled

```
   
⸻  
   
## 127. Field-level authorization  
Un reviewer podrá ver:  
* resumen;  
* checklist;  
* estado.  
Pero no necesariamente:  
* SSN;  
* tax details;  
* credit report;  
* account numbers;  
* identity documents.  
El backend deberá entregar únicamente los campos necesarios.  
   
⸻  
   
## 128. Reautenticación  
Requerida para:  
* approve critical;  
* refunds;  
* filings;  
* tax submissions;  
* disputes;  
* identity changes;  
* data sharing;  
* exports;  
* deletions;  
* suspensions;  
* browser execution;  
* owner override.  
Métodos:  
* password;  
* MFA;  
* passkey futura;  
* step-up authentication.  
   
⸻  
   
## 129. Firma del reviewer  
Para acciones de riesgo alto podrá requerirse:  
```
reviewer attestation

```
Ejemplo:  
Confirmo que revisé la información y que la acción coincide con la versión mostrada.  
No sustituye una firma legal externa.  
   
⸻  
   
## 130. Seguridad  
Requisitos:  
* autenticación;  
* MFA;  
* step-up authentication;  
* autorización backend;  
* resource-level access;  
* purpose-based access;  
* field-level access;  
* separación de funciones;  
* protección IDOR;  
* CSRF;  
* CSP;  
* rate limiting;  
* secure cookies;  
* payload hashing;  
* immutable snapshots;  
* idempotency;  
* audit logging;  
* encryption;  
* secrets manager;  
* fail closed;  
* kill switches;  
* short-lived authorizations;  
* replay protection.  
   
⸻  
   
## 131. Protección contra replay  
La autorización deberá incluir:  
* nonce;  
* idempotency key;  
* expiración;  
* max executions;  
* payload hash.  
Un token usado no deberá ejecutarse otra vez.  
   
⸻  
   
## 132. Protección contra TOCTOU  
Antes de ejecutar:  
* volver a consultar recursos;  
* comprobar versión;  
* comprobar estado;  
* comprobar payment;  
* comprobar consent;  
* comprobar evidence;  
* comprobar policy.  
No confiar únicamente en el estado visto al aprobar.  
   
⸻  
   
## 133. Prompt injection  
Contenido de:  
* documentos;  
* notas;  
* formularios;  
* mensajes;  
* websites;  
* drafts;  
deberá tratarse como no confiable.  
No podrá:  
* cambiar policy;  
* añadir approvers;  
* modificar payload;  
* ejecutar;  
* omitir checklist;  
* aprobar.  
   
⸻  
   
## 134. Auditoría  
Eventos:  
```
approval_request_created
approval_request_submitted
approval_request_assigned
approval_request_accepted
approval_review_started
approval_information_requested
approval_evidence_added
approval_checklist_updated
approval_decision_recorded
approval_approved
approval_conditionally_approved
approval_partially_approved
approval_rejected
approval_recused
approval_withdrawn
approval_expired
approval_revoked
approval_superseded
execution_authorization_created
approval_execution_started
approval_execution_succeeded
approval_execution_failed
approval_execution_compensated
approval_override_used
approval_delegation_created
approval_delegation_revoked
approval_sensitive_evidence_viewed

```
   
⸻  
   
## 135. Historial inmutable  
No permitir:  
* borrar decisión;  
* editar decisión;  
* cambiar timestamp;  
* eliminar rechazo;  
* alterar evidence snapshot;  
* cambiar payload aprobado.  
Las correcciones deberán crear eventos nuevos.  
   
⸻  
   
## 136. Eventos de dominio  
```
ApprovalRequested
ApprovalAssigned
ApprovalAccepted
ApprovalInformationRequested
ApprovalApproved
ApprovalConditionallyApproved
ApprovalPartiallyApproved
ApprovalRejected
ApprovalExpired
ApprovalRevoked
ApprovalSuperseded
ExecutionAuthorized
ApprovalExecutionStarted
ApprovalExecutionSucceeded
ApprovalExecutionFailed

```
   
⸻  
   
## 137. Outbox e inbox  
Eventos críticos deberán usar outbox o equivalente.  
Consumidores deberán aplicar idempotencia.  
Especialmente:  
* execution authorization;  
* refund approval;  
* filing approval;  
* tax approval;  
* dispute approval;  
* data sharing approval;  
* workflow transition.  
   
⸻  
   
## 138. Notificaciones seguras  
No incluir en email o WhatsApp:  
* SSN;  
* EIN completo;  
* tax amounts detallados;  
* credit accounts;  
* documentos;  
* authorization tokens.  
Enviar enlace autenticado.  
   
⸻  
   
## 139. Dashboard de aprobaciones  
Widgets:  
* pendientes;  
* asignadas;  
* urgentes;  
* critical;  
* esperando información;  
* próximas a vencer;  
* expiradas;  
* execution pending;  
* execution failed;  
* overrides;  
* tiempo promedio;  
* carga por reviewer.  
   
⸻  
   
## 140. Métricas operativas  
* solicitudes;  
* aprobadas;  
* rechazadas;  
* condicionadas;  
* parcialmente aprobadas;  
* expiradas;  
* retiradas;  
* tiempo de asignación;  
* tiempo de revisión;  
* tiempo de decisión;  
* tiempo de ejecución;  
* rework;  
* information requests;  
* escalations;  
* overrides;  
* execution failures.  
   
⸻  
   
## 141. Métricas de calidad  
* aprobaciones revocadas;  
* decisiones reabiertas;  
* ejecución con hash mismatch;  
* solicitudes sin evidencia;  
* reviewers que aprueban sus propios requests;  
* excessive overrides;  
* approvals expired before execution;  
* execution retries;  
* conditional approvals not satisfied;  
* approvals superseded;  
* policy violations.  
   
⸻  
   
## 142. Métricas de IA  
* agent outputs enviados;  
* aprobados;  
* editados;  
* rechazados;  
* error reasons;  
* tiempo de revisión;  
* tool execution approval rate;  
* browser execution failures;  
* corrections.  
No usar approval rate como única medida de calidad.  
   
⸻  
   
## 143. Reporting  
Reportes:  
* por tipo;  
* servicio;  
* reviewer;  
* riesgo;  
* outcome;  
* SLA;  
* jurisdiction;  
* amount;  
* agent involvement;  
* overrides;  
* execution;  
* failure;  
* rejection reasons.  
No usar métricas sin contexto para evaluar empleados.  
   
⸻  
   
## 144. Retención  
La retención deberá considerar:  
* servicio;  
* filing;  
* tax;  
* credit;  
* payments;  
* refunds;  
* identity;  
* partner sharing;  
* security;  
* legal hold;  
* audit.  
Las aprobaciones no deberán eliminarse junto con una tarea.  
   
⸻  
   
## 145. Exportación  
Una exportación deberá:  
* requerir permiso;  
* aplicar redacción;  
* incluir decisiones;  
* incluir evidencia permitida;  
* excluir secretos;  
* generar enlace temporal;  
* registrar motivo;  
* auditarse.  
   
⸻  
   
## 146. Fallbacks  
## Task Service no disponible  
* crear approval;  
* marcar review task pending;  
* alertar;  
* no perder solicitud.  
## Document Service no disponible  
* no afirmar evidencia;  
* bloquear decisión si es obligatoria.  
## Workflow no disponible  
* guardar decisión;  
* no emitir ejecución;  
* marcar sync pending;  
* alertar.  
## Identity Service no disponible  
* fail closed para acciones sensibles.  
## MFA no disponible  
* no permitir critical approval.  
## IA no disponible  
* aprobación humana continúa.  
## Browser Worker no disponible  
* approval remains valid until expiration;  
* execution unavailable;  
* permitir proceso manual autorizado.  
   
⸻  
   
## 147. Fallos parciales  
Ejemplo:  
```
La acción fue aprobada.
La ejecución no pudo iniciarse.
No se realizaron cambios externos.

```
No mostrar:  
Completado.  
   
⸻  
   
## 148. Caché  
Puede cachearse:  
* policy definitions;  
* queues;  
* catálogos;  
* list summaries.  
No cachear por periodos largos:  
* decisions;  
* assignments;  
* permissions;  
* evidence status;  
* approvals;  
* execution authorization;  
* revocations;  
* expirations.  
   
⸻  
   
## 149. Accesibilidad  
* teclado;  
* headings;  
* decision buttons claros;  
* confirmaciones accesibles;  
* comparison tables;  
* evidence lists;  
* status with text;  
* focus management;  
* error summaries;  
* no depender de colores;  
* screen-reader announcements;  
* mobile responsive.  
   
⸻  
   
## 150. Internacionalización  
La interfaz deberá soportar:  
* español;  
* inglés.  
Incluye:  
* estados;  
* tipos;  
* riesgos;  
* decisiones;  
* reason codes;  
* condiciones;  
* checklists;  
* mensajes;  
* errores;  
* notificaciones.  
Los documentos legales no deberán traducirse automáticamente sin revisión.  
   
⸻  
   
## 151. Testing funcional  
Probar:  
* create;  
* submit;  
* assign;  
* accept;  
* evidence;  
* checklist;  
* request info;  
* approve;  
* conditional;  
* partial;  
* reject;  
* recuse;  
* delegate;  
* expire;  
* revoke;  
* supersede;  
* execute;  
* retry;  
* failure;  
* compensation;  
* override;  
* quorum;  
* sequential;  
* parallel.  
   
⸻  
   
## 152. Testing de seguridad  
Probar:  
* IDOR;  
* approval ajena;  
* self-approval;  
* role tampering;  
* assignment tampering;  
* evidence access;  
* field leakage;  
* decision replay;  
* token replay;  
* payload alteration;  
* hash mismatch;  
* execution without approval;  
* expired authorization;  
* revoked approval;  
* kill switch;  
* MFA bypass;  
* CSRF;  
* mass assignment;  
* prompt injection;  
* cache leakage.  
   
⸻  
   
## 153. Testing de segregación  
Probar:  
* preparer tries to approve;  
* requester tries to approve;  
* approver tries to execute when prohibited;  
* executor tries to alter payload;  
* owner override;  
* delegate expired;  
* conflict of interest;  
* recusal;  
* quorum.  
   
⸻  
   
## 154. Testing de idempotencia  
Probar:  
* duplicate approve command;  
* duplicate webhook;  
* duplicate execution;  
* retry;  
* duplicate authorization;  
* duplicate refund;  
* duplicate filing submission;  
* duplicate task event.  
   
⸻  
   
## 155. Testing de concurrencia  
Probar:  
* two reviewers decide simultaneously;  
* approval and withdrawal;  
* approval and evidence update;  
* revoke and execute;  
* expire and execute;  
* two executors;  
* quorum reached concurrently.  
   
⸻  
   
## 156. Testing de datos  
Probar:  
* evidence changed;  
* payload changed;  
* fee changed;  
* document replaced;  
* consent revoked;  
* client merged;  
* organization ownership changed;  
* policy version changed;  
* order migrated;  
* stale snapshot.  
   
⸻  
   
## 157. Testing de resiliencia  
Probar:  
* DB failure;  
* workflow failure;  
* Task Service failure;  
* Document Service failure;  
* MFA failure;  
* browser worker failure;  
* provider timeout;  
* event out of order;  
* dead-letter;  
* recovery;  
* compensation.  
   
⸻  
   
## 158. Testing end-to-end  
Escenarios:  
## LLC filing  
```
Draft filing
→ approval request
→ review
→ approve
→ worker prepares
→ final confirmation
→ submit
→ evidence

```
## Tax return  
```
Return prepared
→ specialist review
→ client signature
→ owner authorization
→ provider submission
→ acknowledgement

```
## Credit dispute  
```
Draft dispute
→ evidence review
→ human approval
→ submit
→ confirmation

```
## Refund  
```
Refund request
→ billing review
→ approval
→ Stripe refund
→ webhook
→ entitlement adjustment

```
   
⸻  
   
## 159. Criterios de aceptación  
El módulo estará listo cuando:  
1. Exista un único centro de aprobaciones.  
2. Las acciones sensibles requieran aprobación.  
3. La IA no pueda autoaprobarse.  
4. Tareas y approvals permanezcan separados.  
5. Consentimiento y approval permanezcan separados.  
6. Cada solicitud use una policy versionada.  
7. Exista riesgo.  
8. Exista prioridad.  
9. Exista asignación.  
10. Existan colas.  
11. Exista SLA.  
12. Exista escalamiento.  
13. Exista evidencia.  
14. Exista checklist.  
15. Exista snapshot.  
16. Exista payload hash.  
17. Los cambios invaliden la aprobación.  
18. Exista aprobación total.  
19. Exista aprobación condicional.  
20. Exista aprobación parcial.  
21. Exista rechazo.  
22. Exista request information.  
23. Exista recusación.  
24. Exista delegación.  
25. Exista quorum.  
26. Exista aprobación secuencial.  
27. Exista aprobación paralela.  
28. Exista expiración.  
29. Exista revocación.  
30. Exista revalidación.  
31. Exista Execution Authorization.  
32. La ejecución sea idempotente.  
33. Se evite replay.  
34. Se proteja contra TOCTOU.  
35. Exista segregación de funciones.  
36. Exista owner override auditado.  
37. Exista break-glass.  
38. Existan kill switches.  
39. Exista ejecución registrada.  
40. Los fallos no cambien la decisión.  
41. Exista compensación.  
42. Exista auditoría inmutable.  
43. Exista field-level access.  
44. Exista MFA para riesgo alto.  
45. Sea bilingüe.  
46. Sea responsive.  
47. Sea accesible.  
48. Pase pruebas de seguridad.  
49. Pase pruebas de concurrencia.  
50. Reutilice la aplicación existente.  
   
⸻  
   
## 160. Plan de implementación  
## Fase 1 — Auditoría  
* approvals actuales;  
* tareas;  
* workflows;  
* acciones sensibles;  
* overrides;  
* roles;  
* permisos.  
## Fase 2 — Núcleo  
* ApprovalRequest;  
* statuses;  
* policies;  
* versions;  
* resource links;  
* DTOs.  
## Fase 3 — Assignment  
* queues;  
* reviewers;  
* roles;  
* acceptance;  
* delegation;  
* recusal.  
## Fase 4 — Decisions  
* approve;  
* conditional;  
* partial;  
* reject;  
* information request;  
* quorum.  
## Fase 5 — Evidence  
* links;  
* checklists;  
* snapshots;  
* comparisons;  
* hashing.  
## Fase 6 — Authorization  
* execution authorization;  
* revalidation;  
* tokens;  
* expiration;  
* revocation;  
* idempotency.  
## Fase 7 — Execution  
* workers;  
* service accounts;  
* result;  
* retries;  
* failures;  
* compensation.  
## Fase 8 — Specific Policies  
* service start;  
* refunds;  
* filings;  
* EIN;  
* taxes;  
* credit;  
* funding;  
* partner sharing;  
* identity;  
* suspension.  
## Fase 9 — Security  
* MFA;  
* field access;  
* segregation;  
* break-glass;  
* kill switches;  
* replay protection.  
## Fase 10 — Administration  
* policy editor;  
* queues;  
* dashboards;  
* delegations;  
* reports;  
* audit views.  
## Fase 11 — Testing  
* unit;  
* integration;  
* E2E;  
* concurrency;  
* idempotency;  
* security;  
* resilience.  
   
⸻  
   
## 161. Instrucciones finales para Codex  
Antes de implementar:  
1. Lee el contexto maestro.  
2. Lee los módulos 1 al 23.  
3. Lee este documento completo.  
4. Inspecciona cualquier aprobación existente.  
5. No crees un segundo sistema.  
6. Separa Task, Consent, Signature y Approval.  
7. Define todas las acciones sensibles.  
8. Implementa ApprovalPolicy.  
9. Versiona políticas.  
10. Guarda snapshots.  
11. Implementa payload hash.  
12. No permitas editar una solicitud aprobada.  
13. Implementa asignaciones.  
14. Implementa queues.  
15. Implementa SLA.  
16. Implementa evidence requirements.  
17. Implementa checklists.  
18. Implementa approvals múltiples.  
19. Implementa sequential.  
20. Implementa parallel.  
21. Implementa quorum.  
22. Implementa recusación.  
23. Implementa delegación temporal.  
24. Implementa segregación de funciones.  
25. Bloquea autoaprobación.  
26. Implementa owner override auditado.  
27. Implementa break-glass.  
28. Implementa request information.  
29. Implementa condiciones estructuradas.  
30. Implementa partial approval.  
31. Implementa expiración.  
32. Implementa revocación.  
33. Implementa revalidación.  
34. Implementa ExecutionAuthorization.  
35. Implementa maxExecutions.  
36. Implementa tokens de propósito único.  
37. Implementa idempotencia.  
38. Implementa replay protection.  
39. Implementa protección TOCTOU.  
40. Implementa kill switches.  
41. Implementa MFA.  
42. Implementa field-level authorization.  
43. Limita evidencia por propósito.  
44. No permitas que la IA apruebe.  
45. No permitas que la IA modifique policies.  
46. No permitas que la IA emita authorizations.  
47. No permitas ejecución si cambia el payload.  
48. Registra executor y resultado.  
49. Distingue aprobación y ejecución.  
50. Implementa compensación.  
51. Implementa auditoría inmutable.  
52. Implementa outbox e inbox.  
53. Incluye pruebas de seguridad.  
54. Incluye pruebas de concurrencia.  
55. Incluye pruebas de idempotencia.  
56. Incluye pruebas E2E.  
57. Documenta migraciones.  
58. No marques una acción como ejecutada sin evidencia.  
59. No uses mocks como prueba de ejecución real.  
60. Mantén la aplicación web existente como base.  
Antes de entregar, verifica:  
* ¿La IA únicamente prepara y propone?  
* ¿Toda acción sensible se detiene antes de ejecutar?  
* ¿El reviewer ve exactamente la versión a ejecutar?  
* ¿Un cambio invalida la aprobación?  
* ¿El aprobador no puede aprobarse a sí mismo salvo override?  
* ¿La decisión está separada del resultado?  
* ¿Una aprobación expirada no puede ejecutarse?  
* ¿Una aprobación revocada bloquea el worker?  
* ¿Un token no puede reutilizarse?  
* ¿Dos clics producen una sola ejecución?  
* ¿La evidencia está vinculada y versionada?  
* ¿Los datos sensibles se muestran solo a quien corresponde?  
* ¿Las decisiones rechazadas permanecen auditadas?  
* ¿Los fallos externos no se presentan como éxito?  
* ¿La implementación reutiliza Tasks, Workflows, Documents y Billing?  
  
  
  
  
  
  
  
  
  
  
## MÓDULO 25 — AI HUB, SKILLS ESPECIALIZADAS Y CENTRO DE CONTROL DE AGENTES  
## SG Solutions Operating System  
**Versión:** 1.0.0 **Estado:** Especificación inicial aprobada **Tipo de documento:** Requisitos funcionales, arquitectura de IA, agentes especializados, skills, modelos locales, routing, herramientas, seguridad, supervisión humana, evaluaciones, observabilidad e instrucciones para Codex **Proyecto base:** Aplicación web existente de SG Solutions **Audiencia:** Codex, desarrolladores, responsables de producto, operaciones, especialistas, seguridad, cumplimiento, administración y owner **Idiomas de interacción:** Español e inglés **Idioma del código:** Inglés **Modelo operativo:** IA asistida, supervisada y controlada por permisos **Infraestructura prevista:** Servidor local de bajo consumo, nodo gamer con GPU, proveedores cloud opcionales y arquitectura híbrida  
   
⸻  
   
## 1. Contexto obligatorio  
Este módulo deberá integrarse dentro de la aplicación web existente de SG Solutions.  
No deberá construirse como:  
* una aplicación de IA independiente;  
* un chatbot genérico desconectado del negocio;  
* una colección de prompts;  
* un segundo backend;  
* una interfaz pública para ejecutar agentes internos;  
* una plataforma donde los clientes ordenen acciones sensibles directamente;  
* un sistema donde la IA tenga acceso general a toda la base de datos;  
* una arquitectura donde todos los agentes compartan todas las herramientas;  
* una solución donde el modelo determine sus propios permisos;  
* un sistema donde la IA pueda aprobar sus propios resultados;  
* una plataforma donde el LLM sea la fuente de verdad;  
* una solución que confunda memoria conversacional con datos verificados;  
* una arquitectura que entregue documentos completos a todos los modelos;  
* un sistema que permita ejecutar browser automation sin aprobación;  
* una plataforma donde un modelo pequeño local tenga que realizar todas las tareas;  
* una arquitectura que dependa de que la computadora gamer esté encendida;  
* un sistema que falle completamente cuando el nodo GPU esté apagado;  
* una solución que envíe datos sensibles a proveedores cloud sin política;  
* una plataforma sin routing de modelos;  
* una arquitectura sin límites de costo;  
* una solución sin evaluación de outputs;  
* un sistema sin versionado de prompts;  
* una plataforma donde las skills puedan modificarse en producción sin revisión;  
* una solución donde la IA pueda cambiar precios;  
* una plataforma donde la IA pueda otorgar refunds;  
* una solución donde la IA pueda presentar taxes;  
* una plataforma donde la IA pueda enviar disputas;  
* una solución donde la IA pueda registrar compañías sin aprobación;  
* una plataforma donde la IA pueda enviar aplicaciones de préstamos libremente;  
* una solución que permita acceso directo del modelo a PostgreSQL;  
* una arquitectura sin allowlist de tools;  
* una plataforma sin auditoría de tool calls;  
* una solución que permita prompt injection desde mensajes, documentos o páginas externas;  
* una plataforma que almacene secretos dentro de prompts;  
* una arquitectura que no diferencie agentes públicos, internos y técnicos;  
* una solución donde cada skill tenga su propio sistema de usuarios;  
* una plataforma que replique CRM, Tasks, Approvals o Workflows;  
* una solución donde la IA pueda interpretar silenciosamente leyes desactualizadas como vigentes;  
* una plataforma que garantice resultados fiscales, crediticios, legales o financieros;  
* una solución donde la IA actúe como abogado, CPA, lender o bureau;  
* una plataforma que no permita desactivar agentes rápidamente.  
Antes de implementar, Codex deberá inspeccionar:  
* chat público;  
* mensajería segura;  
* WhatsApp;  
* redes sociales;  
* llamadas;  
* CRM;  
* Gestión de Clientes;  
* Organizations;  
* Service Orders;  
* Case Files;  
* Tasks;  
* Approvals;  
* Documents;  
* Billing;  
* Forms;  
* Marketplace;  
* Workflows;  
* autenticación;  
* roles;  
* permisos;  
* modelos existentes;  
* proveedores de IA;  
* Ollama;  
* llama.cpp;  
* ONNX Runtime;  
* APIs cloud;  
* workers;  
* colas;  
* observabilidad;  
* prompts;  
* RAG;  
* embeddings;  
* base vectorial;  
* knowledge base;  
* logs;  
* costos;  
* GPU;  
* servidor local;  
* backups;  
* funcionalidades incompletas.  
Si ya existe infraestructura de IA, deberá reutilizarse, normalizarse o refactorizarse.  
No crear un sistema paralelo sin un plan de consolidación.  
   
⸻  
   
## 2. Propósito del módulo  
El AI Hub será el centro interno para administrar modelos, agentes, skills, herramientas, knowledge bases, ejecuciones, permisos, evaluaciones y costos de IA.  
Deberá permitir:  
1. Crear agentes especializados.  
2. Crear skills especializadas.  
3. Versionar prompts.  
4. Versionar instrucciones.  
5. Gestionar modelos.  
6. Gestionar proveedores.  
7. Gestionar modelos locales.  
8. Gestionar modelos cloud.  
9. Gestionar routing.  
10. Gestionar fallback.  
11. Gestionar herramientas.  
12. Gestionar scopes.  
13. Gestionar RAG.  
14. Gestionar fuentes.  
15. Gestionar memoria.  
16. Gestionar sesiones.  
17. Gestionar ejecuciones.  
18. Gestionar revisiones humanas.  
19. Gestionar aprobaciones.  
20. Gestionar evaluaciones.  
21. Gestionar costos.  
22. Gestionar límites.  
23. Gestionar riesgos.  
24. Gestionar datasets de prueba.  
25. Gestionar observabilidad.  
26. Gestionar incidentes.  
27. Gestionar feature flags.  
28. Gestionar kill switches.  
29. Gestionar deployments.  
30. Gestionar capacidades por infraestructura.  
31. Coordinar el servidor 24/7.  
32. Coordinar el nodo gamer con GPU.  
33. Coordinar proveedores externos opcionales.  
34. Atender clientes mediante chat y canales públicos.  
35. Responder preguntas de clientes autenticados.  
36. Ayudar al owner y especialistas.  
37. Preparar acciones sensibles.  
38. Enviar acciones al Centro de Aprobaciones.  
39. Ejecutar únicamente cuando exista autorización.  
40. Mantener trazabilidad completa.  
41. Evitar exposición innecesaria de datos.  
42. Mantener operación básica aunque la GPU esté apagada.  
43. Facilitar crecimiento futuro.  
44. Permitir añadir nuevas skills sin reescribir la plataforma.  
45. Servir como base para productos de IA futuros.  
El módulo deberá responder:  
¿Qué agente debe encargarse de esta solicitud, qué modelo necesita, qué información puede ver, qué herramientas puede usar y qué revisión humana requiere?  
   
⸻  
   
## 3. Principio central  
La IA deberá operar como una capa de asistencia y orquestación controlada.  
Arquitectura correcta:  
```
User or System Request
→ Authentication and Context
→ Intent Classification
→ Agent Routing
→ Permission Check
→ Data Scope Construction
→ Model Selection
→ Tool Allowlist
→ Agent Run
→ Output Validation
→ Human Review when required
→ Approval
→ Controlled Execution
→ Audit

```
Arquitectura incorrecta:  
```
User message
→ LLM receives full database
→ LLM decides what to do
→ LLM executes external action

```
   
⸻  
   
## 4. Separación de conceptos  
## AI Hub  
Centro de administración y ejecución.  
## Agent  
Identidad lógica especializada con propósito y herramientas.  
## Skill  
Conjunto reutilizable de conocimiento, instrucciones, reglas, formatos y herramientas.  
## Model  
Motor de inferencia.  
## Provider  
Sistema que ejecuta un modelo.  
## Tool  
Capacidad determinista o integración.  
## Knowledge Base  
Colección de fuentes consultables.  
## RAG  
Proceso de recuperación de contexto.  
## Memory  
Información conversacional o resumida persistida.  
## Agent Run  
Ejecución individual.  
## Tool Call  
Invocación estructurada.  
## Approval  
Decisión humana.  
## Workflow  
Proceso de negocio.  
## Job  
Trabajo técnico.  
## Prompt  
Instrucciones concretas utilizadas durante una ejecución.  
Estos conceptos deberán mantenerse separados.  
   
⸻  
   
## 5. Objetivos  
## 5.1 Objetivos principales  
* Centralizar la IA.  
* Mantener control humano.  
* Limitar accesos.  
* Reutilizar skills.  
* Facilitar modelos locales.  
* Facilitar modelos cloud.  
* Permitir routing.  
* Mantener disponibilidad.  
* Facilitar RAG.  
* Mantener auditoría.  
* Proteger datos.  
* Evaluar calidad.  
* Controlar costos.  
* Integrar workflows.  
## 5.2 Objetivos secundarios  
* Reducir tareas manuales.  
* Mejorar atención.  
* Mejorar consistencia.  
* Facilitar entrenamiento interno.  
* Facilitar programación.  
* Facilitar investigación.  
* Facilitar soporte.  
* Facilitar análisis documental.  
* Facilitar nuevos servicios.  
* Facilitar escalabilidad.  
* Reducir dependencia de un proveedor.  
* Aprovechar la GPU gamer sin depender de ella.  
   
⸻  
   
## 6. Tipos de agentes  
El sistema deberá soportar:  
```
public_support_agent
authenticated_client_agent
internal_assistant
service_specialist_agent
workflow_agent
document_agent
research_agent
coding_agent
data_analysis_agent
voice_agent
social_media_agent
quality_review_agent
security_agent
routing_agent
supervisor_agent
browser_worker_agent
system_maintenance_agent
custom_agent

```
   
⸻  
   
## 7. Categorías de acceso  
## Agente público  
Acceso mínimo.  
Puede:  
* explicar servicios;  
* responder FAQ;  
* crear lead;  
* recopilar intención;  
* agendar;  
* enviar enlaces.  
## Agente del cliente autenticado  
Puede:  
* consultar estado público;  
* consultar tareas del cliente;  
* explicar próximos pasos;  
* solicitar documentos;  
* enviar mensajes.  
## Agente interno  
Puede:  
* ayudar a empleados;  
* resumir casos;  
* preparar documentos;  
* sugerir acciones.  
## Agente especializado  
Opera en un dominio concreto.  
## Agente técnico  
Realiza funciones de infraestructura o programación.  
## Browser Worker  
Ejecuta navegación limitada y aprobada.  
   
⸻  
   
## 8. Agentes iniciales  
La primera versión deberá considerar:  
```
Public Customer Support Agent
Authenticated Client Support Agent
Owner Executive Assistant
Credit Specialist Agent
Tax Specialist Agent
Business Formation Agent
Business Funding Agent
Home Buying Assistance Agent
Marketplace Advisor Agent
Document Intake Agent
Appointment Agent
Voice Reception Agent
Social Media Response Agent
Quality Review Agent
Coding and Automation Agent

```
No todos deberán activarse en producción simultáneamente.  
   
⸻  
   
## 9. Public Customer Support Agent  
Su función será:  
* responder dudas generales;  
* explicar servicios;  
* detectar intención;  
* solicitar información no sensible;  
* crear o actualizar lead;  
* recomendar formulario;  
* ofrecer cita;  
* transferir a humano;  
* enviar enlace de pago autorizado;  
* responder en español o inglés.  
No podrá:  
* acceder a expedientes;  
* acceder a perfiles financieros;  
* acceder a reportes;  
* confirmar pagos sensibles;  
* ejecutar servicios;  
* dar asesoría definitiva;  
* prometer resultados;  
* recibir SSN;  
* recibir tarjetas;  
* compartir datos de clientes.  
   
⸻  
   
## 10. Authenticated Client Support Agent  
Podrá:  
* identificar al cliente mediante sesión;  
* consultar servicios;  
* consultar milestones públicos;  
* consultar tareas visibles;  
* consultar documentos pendientes;  
* consultar citas;  
* consultar estado de pagos resumido;  
* responder preguntas sobre proceso;  
* crear mensaje a especialista;  
* crear follow-up.  
No podrá:  
* mostrar notas internas;  
* mostrar datos de otros clientes;  
* modificar estados;  
* aprobar acciones;  
* ejecutar servicios;  
* mostrar información sensible completa.  
   
⸻  
   
## 11. Owner Executive Assistant  
Será el asistente principal del owner.  
Podrá:  
* consultar dashboards;  
* resumir operaciones;  
* mostrar tareas;  
* mostrar aprobaciones;  
* mostrar clientes bloqueados;  
* preparar reportes;  
* buscar información interna;  
* preparar instrucciones;  
* preparar acciones;  
* abrir workflows;  
* sugerir prioridades;  
* crear tareas;  
* preparar borradores.  
No podrá ejecutar acciones sensibles sin Approval.  
   
⸻  
   
## 12. Credit Specialist Agent  
Deberá especializarse en:  
* educación crediticia;  
* FCRA;  
* FDCPA;  
* FACTA;  
* ECOA;  
* CROA;  
* leyes estatales aplicables;  
* estructura de reportes;  
* bureaus;  
* collections;  
* inquiries;  
* identity theft;  
* dispute workflows;  
* cartas;  
* evidencias;  
* seguimiento;  
* credit monitoring;  
* productos de construcción de crédito.  
Deberá:  
* citar fuentes internas;  
* distinguir reglas federales y estatales;  
* indicar fecha de actualización;  
* distinguir hechos, hipótesis y estrategia;  
* evitar disputas falsas;  
* evitar promesas;  
* enviar cartas y disputas a aprobación.  
   
⸻  
   
## 13. Tax Specialist Agent  
Deberá especializarse en:  
* preparación de tax intake;  
* formularios federales;  
* formularios estatales;  
* filing status;  
* dependientes;  
* W-2;  
* 1099;  
* Schedule C;  
* educación;  
* créditos;  
* deducciones;  
* amended returns;  
* prior-year returns;  
* tax notices;  
* small business taxes;  
* LLC taxation;  
* estimados;  
* documentación.  
Deberá:  
* usar fuentes oficiales;  
* registrar tax year;  
* distinguir reglas vigentes por año;  
* no inventar tasas;  
* no presentar una declaración sin aprobación;  
* preparar cálculos mediante herramientas deterministas;  
* marcar incertidumbre;  
* escalar casos fuera de scope.  
   
⸻  
   
## 14. Business Formation Agent  
Deberá especializarse en:  
* entity types;  
* LLC;  
* corporations;  
* state formation;  
* name checks;  
* registered agent;  
* addresses;  
* members;  
* managers;  
* ownership;  
* operating agreements;  
* EIN;  
* annual reports;  
* amendments;  
* compliance;  
* dissolution;  
* reinstatement;  
* foreign qualification.  
Deberá:  
* distinguir información preliminar y oficial;  
* revisar jurisdicción;  
* preparar filing draft;  
* preparar EIN draft;  
* crear checklist;  
* enviar ejecución a Approval;  
* nunca marcar una empresa como formada sin evidencia.  
   
⸻  
   
## 15. Business Funding Agent  
Deberá especializarse en:  
* funding readiness;  
* business profile;  
* lender categories;  
* SBA;  
* business loans;  
* lines of credit;  
* business cards;  
* documentation;  
* DSCR;  
* revenue;  
* cash flow;  
* personal guarantee;  
* lender matching;  
* business credit preparation.  
No deberá:  
* garantizar aprobación;  
* realizar underwriting definitivo;  
* enviar aplicaciones sin consentimiento y aprobación;  
* inventar términos;  
* seleccionar productos por comisión únicamente.  
   
⸻  
   
## 16. Home Buying Assistance Agent  
Deberá especializarse en:  
* USDA Direct;  
* USDA Guaranteed;  
* FHA;  
* VA cuando aplique;  
* state housing programs;  
* first-time buyer programs;  
* down payment assistance;  
* income limits;  
* rural eligibility;  
* property eligibility;  
* lender preparation;  
* document readiness;  
* prequalification education;  
* closing costs;  
* loan process.  
Deberá:  
* distinguir programa y lender;  
* consultar reglas vigentes;  
* indicar fecha de información;  
* no presentar evaluación preliminar como aprobación;  
* no enviar aplicación sin consentimiento;  
* escalar interpretación compleja.  
   
⸻  
   
## 17. Marketplace Advisor Agent  
Podrá:  
* explicar productos de partners;  
* filtrar disponibilidad;  
* explicar disclosures;  
* mostrar alternativas;  
* crear referral draft;  
* ofrecer staff review;  
* registrar interés.  
No podrá:  
* aprobar productos;  
* enviar aplicación;  
* compartir datos sin consentimiento;  
* ocultar comisión;  
* garantizar aprobación.  
   
⸻  
   
## 18. Document Intake Agent  
Podrá:  
* clasificar documentos;  
* detectar tipo;  
* extraer datos permitidos;  
* identificar faltantes;  
* detectar baja calidad;  
* sugerir nombre;  
* vincular a solicitud;  
* crear review task.  
No podrá:  
* marcar documento verificado;  
* aceptar identidad;  
* modificar el original;  
* borrar documentos;  
* compartirlos externamente.  
   
⸻  
   
## 19. Appointment Agent  
Podrá:  
* identificar tipo de cita;  
* consultar disponibilidad;  
* ofrecer horarios;  
* reservar;  
* reprogramar cuando esté permitido;  
* cancelar según política;  
* crear callback;  
* enviar recordatorios.  
No deberá revelar citas de otros clientes.  
   
⸻  
   
## 20. Voice Reception Agent  
Su función será:  
* contestar llamadas;  
* saludar profesionalmente;  
* detectar idioma;  
* identificar motivo;  
* recopilar datos básicos;  
* crear lead;  
* consultar FAQ;  
* agendar cita;  
* crear callback;  
* transferir a humano;  
* registrar resumen;  
* manejar voicemail.  
No deberá:  
* ejecutar servicios;  
* recibir SSN;  
* solicitar tarjetas;  
* dar asesoría definitiva;  
* engañar al cliente sobre ser humano;  
* grabar sin disclosure cuando sea requerido.  
   
⸻  
   
## 21. Social Media Response Agent  
Podrá:  
* responder preguntas generales;  
* detectar leads;  
* enviar links;  
* mover conversación a canal seguro;  
* escalar quejas;  
* ocultar spam según política;  
* registrar actividad.  
No deberá:  
* discutir casos personales públicamente;  
* pedir PII;  
* confirmar relación de cliente;  
* proporcionar estados de servicio en redes.  
   
⸻  
   
## 22. Coding and Automation Agent  
Este agente podrá utilizar el nodo GPU o proveedor potente para:  
* programar;  
* revisar código;  
* crear pruebas;  
* documentar;  
* analizar errores;  
* preparar migraciones;  
* crear scripts;  
* ayudar a Codex;  
* generar componentes;  
* revisar arquitectura.  
No deberá tener acceso de producción por defecto.  
Los cambios deberán pasar por:  
```
code generation
→ review
→ tests
→ approval
→ deployment

```
   
⸻  
   
## 23. Arquitectura híbrida de infraestructura  
La infraestructura deberá dividirse en:  
```
Always-On Server
├── API
├── Database
├── Queue
├── Small Local Model
├── Embeddings
├── RAG
├── Public Support
├── Routing
├── Monitoring
└── Fallback

GPU Gamer Node
├── Large Local Models
├── Coding Models
├── Complex Reasoning
├── Document Analysis
├── Batch Jobs
└── Model Evaluation

Optional Cloud Providers
├── High-quality fallback
├── Specialized models
├── Temporary burst capacity
└── Emergency fallback

```
   
⸻  
   
## 24. Servidor 24/7  
El servidor permanente deberá poder manejar:  
* chat básico;  
* FAQ;  
* clasificación;  
* routing;  
* CRM actions de bajo riesgo;  
* citas;  
* recordatorios;  
* RAG ligero;  
* embeddings;  
* resúmenes pequeños;  
* colas;  
* health checks;  
* fallback.  
El sistema no deberá depender del nodo gamer para atender clientes.  
   
⸻  
   
## 25. Nodo gamer con GPU  
El nodo GPU podrá manejar:  
* modelos grandes;  
* programación;  
* análisis complejo;  
* revisión profunda;  
* razonamiento multi-documento;  
* generación de documentos;  
* evaluación;  
* tareas batch.  
Cuando esté apagado:  
* las solicitudes deberán esperar;  
* usar fallback;  
* degradarse;  
* enviarse a cloud autorizado;  
* o escalar a humano.  
No perder tareas.  
   
⸻  
   
## 26. Detección de disponibilidad del nodo GPU  
Estados:  
```
online
busy
degraded
offline
maintenance
unknown

```
Métricas:  
* heartbeat;  
* VRAM disponible;  
* RAM;  
* temperatura;  
* carga;  
* modelo cargado;  
* cola;  
* latencia;  
* error rate.  
   
⸻  
   
## 27. Wake-on-LAN futuro  
La arquitectura podrá soportar encendido remoto del nodo gamer.  
Requisitos:  
* red segura;  
* allowlist;  
* VPN;  
* autenticación;  
* horario;  
* costo energético;  
* timeout;  
* apagado seguro;  
* auditoría.  
No será obligatorio para el MVP.  
   
⸻  
   
## 28. Model Provider  
Tipos:  
```
local_server
local_gpu_node
cloud_api
specialized_provider
embedding_provider
speech_provider
vision_provider
fallback_provider

```
   
⸻  
   
## 29. Model Definition  
Campos:  
```
id
code
providerId
modelName
modelFamily
capabilitySet
contextWindow
maxOutputTokens
supportsTools
supportsVision
supportsStructuredOutput
supportsEmbeddings
supportsAudio
deploymentStatus
dataPolicy
costPolicy
latencyClass
qualityTier
createdAt
updatedAt

```
   
⸻  
   
## 30. Capacidades de modelos  
```
chat
classification
summarization
extraction
reasoning
coding
vision
document_analysis
speech_to_text
text_to_speech
embeddings
reranking
tool_use
structured_output
translation
moderation

```
   
⸻  
   
## 31. Niveles de modelo  
```
lightweight
standard
advanced
specialized
experimental

```
## Lightweight  
Chat básico y clasificación.  
## Standard  
Operaciones normales.  
## Advanced  
Razonamiento complejo.  
## Specialized  
Código, voz, visión o dominio.  
## Experimental  
No permitido en producción sin feature flag.  
   
⸻  
   
## 32. Model Routing  
El router deberá considerar:  
* agente;  
* tarea;  
* sensibilidad;  
* complejidad;  
* latencia;  
* disponibilidad;  
* costo;  
* idioma;  
* tools;  
* contexto;  
* privacidad;  
* nivel de riesgo;  
* infraestructura.  
   
⸻  
   
## 33. Routing Policy  
Ejemplo:  
```
Public FAQ
→ small local model

Authenticated process question
→ local standard model

Complex tax analysis
→ GPU advanced model or approved cloud model

Coding request
→ GPU coding model

Sensitive identity task
→ local-only model

```
   
⸻  
   
## 34. Fallback Policy  
Cada ruta deberá definir:  
```
primaryModel
secondaryModel
tertiaryModel
humanFallback
queuePolicy
timeoutPolicy
dataRedactionPolicy

```
No enviar automáticamente datos sensibles a cloud si la política no lo permite.  
   
⸻  
   
## 35. Modo degradado  
Cuando modelos avanzados no estén disponibles:  
* responder FAQ;  
* recopilar datos básicos;  
* crear tarea;  
* informar que requiere revisión;  
* guardar solicitud;  
* no inventar respuesta;  
* no bloquear portal.  
   
⸻  
   
## 36. Proveedores cloud  
El sistema deberá quedar desacoplado.  
Adaptadores conceptuales:  
```
AiModelProvider
├── LocalModelProvider
├── GpuNodeProvider
├── OpenAiProvider
├── AnthropicProvider
├── GoogleProvider
├── SpeechProvider
└── FutureProvider

```
La selección final dependerá de contratos, políticas y costos vigentes.  
   
⸻  
   
## 37. Política de datos por modelo  
Cada modelo deberá declarar:  
```
public_data
internal_non_sensitive
confidential
financial
tax
credit
identity
restricted
local_only

```
Un modelo no podrá recibir categorías superiores a su autorización.  
   
⸻  
   
## 38. Redacción previa  
Antes de enviar a un proveedor externo:  
* eliminar SSN;  
* eliminar EIN;  
* eliminar DOB;  
* eliminar account numbers;  
* eliminar nombres cuando no sean necesarios;  
* eliminar documentos completos;  
* reemplazar IDs;  
* minimizar contexto.  
   
⸻  
   
## 39. Agent Definition  
Campos conceptuales:  
```
id
code
name
description
agentType
audience
status
defaultSkillSetId
modelRoutingPolicyId
toolPolicyId
knowledgePolicyId
memoryPolicyId
approvalPolicyId
dataAccessPolicyId
automationLevel
currentVersionId
createdAt
updatedAt

```
   
⸻  
   
## 40. Estados del agente  
```
draft
under_review
approved
staging
active
degraded
paused
suspended
retired
archived

```
La IA no podrá activar agentes.  
   
⸻  
   
## 41. Agent Version  
Una versión deberá incluir:  
* system prompt;  
* skills;  
* tools;  
* knowledge sources;  
* model policy;  
* safety rules;  
* schemas;  
* output formats;  
* escalation rules;  
* test results;  
* approvals.  
Una versión activa deberá ser inmutable.  
   
⸻  
   
## 42. Skill Definition  
Una skill deberá ser reutilizable y especializada.  
Campos:  
```
id
code
name
description
domain
status
riskLevel
instructionSet
toolRequirements
knowledgeRequirements
inputSchema
outputSchema
evaluationSuiteId
currentVersionId
createdAt
updatedAt

```
   
⸻  
   
## 43. Skills iniciales  
```
customer_service
lead_intake
appointment_scheduling
credit_education
credit_report_analysis
credit_dispute_preparation
tax_intake
tax_form_guidance
tax_return_review
business_formation
ein_preparation
business_compliance
business_funding
home_buying_assistance
marketplace_guidance
document_classification
document_extraction
case_summarization
task_assistance
approval_preparation
voice_reception
social_media_response
coding_assistance
data_analysis

```
   
⸻  
   
## 44. Skill de crédito  
Deberá incluir:  
* alcance;  
* leyes;  
* fuentes;  
* workflows;  
* cartas;  
* reason codes;  
* forbidden claims;  
* escalation;  
* state overlays;  
* evaluation cases;  
* disclaimers.  
No deberá consistir únicamente en un prompt largo.  
   
⸻  
   
## 45. Skill de taxes  
Deberá organizarse por:  
* tax year;  
* federal;  
* state;  
* entity type;  
* form;  
* filing status;  
* income type;  
* credit;  
* deduction;  
* deadline;  
* provider;  
* review level.  
Las reglas deberán versionarse por año.  
   
⸻  
   
## 46. Skill de Business Formation  
Deberá organizarse por:  
* state;  
* entity type;  
* filing type;  
* fees;  
* registered agent;  
* addresses;  
* owners;  
* management;  
* EIN;  
* compliance;  
* evidence.  
   
⸻  
   
## 47. Skill de Funding  
Deberá incluir:  
* lender categories;  
* readiness;  
* required documents;  
* business age;  
* revenue;  
* cash flow;  
* credit;  
* guarantees;  
* use of funds;  
* referrals;  
* disclosures.  
   
⸻  
   
## 48. Skill de Home Buying  
Deberá incluir:  
* USDA;  
* FHA;  
* VA;  
* conventional;  
* state programs;  
* income limits;  
* property requirements;  
* rural eligibility;  
* household;  
* closing costs;  
* lender process;  
* documents;  
* disclaimers.  
   
⸻  
   
## 49. Skill Version  
Cambios que requieren versión:  
* ley;  
* rule;  
* source;  
* workflow;  
* tool;  
* output;  
* disclaimer;  
* prompt;  
* evaluation;  
* jurisdiction;  
* tax year.  
   
⸻  
   
## 50. Skill Composition  
Un agente podrá utilizar varias skills.  
Ejemplo:  
```
Business Formation Agent
├── business_formation
├── ein_preparation
├── document_extraction
├── customer_service
└── approval_preparation

```
Las skills no deberán otorgar tools automáticamente.  
   
⸻  
   
## 51. Tool Definition  
Cada tool deberá incluir:  
```
id
code
name
description
riskLevel
inputSchema
outputSchema
requiredPermissions
allowedAgentTypes
requiresApproval
idempotencyPolicy
timeoutPolicy
rateLimitPolicy
status
version

```
   
⸻  
   
## 52. Tool Categories  
```
read
search
create_draft
update_low_risk
schedule
message
document
payment_read
workflow
approval
external_execution
browser
administration
system

```
   
⸻  
   
## 53. Herramientas de lectura  
Ejemplos:  
```
get_client_summary
get_service_status
get_pending_tasks
get_document_requirements
get_payment_summary
get_appointment_availability
get_organization_summary
search_knowledge_base

```
Cada lectura deberá respetar scope.  
   
⸻  
   
## 54. Herramientas de escritura de bajo riesgo  
Ejemplos:  
```
create_lead
create_follow_up_task
create_appointment
save_internal_draft
create_document_request
create_message_draft
create_approval_request

```
   
⸻  
   
## 55. Herramientas sensibles  
Ejemplos:  
```
submit_filing
submit_ein_application
submit_tax_return
send_credit_dispute
issue_refund
share_partner_documents
submit_funding_application
change_ownership
change_identity
suspend_client

```
Todas deberán requerir Approval y Execution Authorization.  
   
⸻  
   
## 56. Tool Allowlist por agente  
Cada agente deberá tener una allowlist explícita.  
Ejemplo:  
```
Public Support Agent
Allowed:
- search_public_faq
- get_public_service_catalog
- create_lead
- create_appointment
- create_handoff

Denied:
- get_client_record
- get_credit_report
- issue_refund
- submit_filing

```
   
⸻  
   
## 57. Tool Denylist global  
Ningún agente deberá poder:  
* editar roles;  
* crear permisos;  
* cambiar políticas;  
* leer secretos;  
* borrar auditoría;  
* desactivar seguridad;  
* aprobar su output;  
* modificar logs;  
* cambiar precios;  
* alterar modelos en producción;  
* desactivar kill switches.  
   
⸻  
   
## 58. Tool Call Lifecycle  
```
Agent proposes tool call
→ schema validation
→ authentication
→ permission check
→ resource authorization
→ stage validation
→ risk evaluation
→ approval check
→ idempotency check
→ execution
→ output validation
→ audit

```
   
⸻  
   
## 59. Tool Call Status  
```
proposed
validated
waiting_for_approval
approved
executing
succeeded
failed
rejected
expired
cancelled

```
   
⸻  
   
## 60. Tool Input Validation  
Validar:  
* tipos;  
* enums;  
* resource IDs;  
* actor;  
* scope;  
* stage;  
* amount;  
* jurisdiction;  
* date;  
* versions;  
* consent;  
* approval;  
* idempotency.  
No confiar en argumentos del modelo.  
   
⸻  
   
## 61. Tool Output Validation  
Validar:  
* schema;  
* allowed fields;  
* status;  
* amounts;  
* dates;  
* provider references;  
* PII;  
* error codes;  
* confidence;  
* completeness.  
   
⸻  
   
## 62. Structured Output  
Para tareas operativas, requerir JSON o schema.  
Ejemplo:  
```
{
  "status": "requires_review",
  "summary": "LLC intake appears complete.",
  "missingFields": [],
  "proposedNextAction": "request_service_start_approval",
  "sources": [
    "form_submission:FS-1028"
  ]
}

```
No depender de texto libre.  
   
⸻  
   
## 63. Knowledge Base  
El AI Hub deberá administrar bases por dominio:  
```
public_faq
company_policies
credit_law
tax_federal
tax_state
business_formation
funding
home_buying
marketplace
operations
technical_documentation

```
   
⸻  
   
## 64. Fuentes permitidas  
Tipos:  
```
official_web_source
uploaded_document
internal_policy
approved_template
government_form
legal_reference
provider_documentation
training_material
case_precedent_internal
structured_database

```
   
⸻  
   
## 65. Fuente de verdad  
Jerarquía sugerida:  
```
Official current source
→ Approved internal policy
→ Structured system data
→ Reviewed reference material
→ General model knowledge

```
El conocimiento preentrenado no deberá superar fuentes vigentes.  
   
⸻  
   
## 66. Source Record  
Campos:  
```
id
code
title
sourceType
domain
jurisdiction
taxYear
effectiveFrom
effectiveTo
authorityLevel
reviewStatus
reviewedBy
lastVerifiedAt
nextReviewAt
storageReference
contentHash
version

```
   
⸻  
   
## 67. Estados de fuente  
```
draft
pending_review
approved
current
review_due
stale
superseded
revoked
archived

```
Las fuentes stale deberán generar advertencia o bloquear uso en tareas críticas.  
   
⸻  
   
## 68. RAG Pipeline  
```
Request
→ classify domain
→ identify jurisdiction and date
→ build query
→ apply access filter
→ retrieve sources
→ rerank
→ filter stale content
→ construct context
→ generate answer
→ attach citations
→ validate

```
   
⸻  
   
## 69. RAG con permisos  
La búsqueda deberá filtrar por:  
* usuario;  
* agente;  
* cliente;  
* servicio;  
* área;  
* sensibilidad;  
* source type;  
* purpose;  
* jurisdiction.  
No recuperar primero y filtrar después si existe riesgo de exposición.  
   
⸻  
   
## 70. Chunking  
Los documentos deberán fragmentarse con:  
* source reference;  
* page;  
* section;  
* heading;  
* effective date;  
* jurisdiction;  
* sensitivity;  
* permissions;  
* checksum.  
   
⸻  
   
## 71. Embeddings  
Los embeddings deberán:  
* generarse con modelo aprobado;  
* separarse por sensibilidad;  
* evitar secretos;  
* mantener referencia;  
* poder regenerarse;  
* versionarse;  
* soportar eliminación.  
   
⸻  
   
## 72. Vector Store  
Podrá utilizarse:  
* pgvector;  
* Qdrant;  
* Weaviate;  
* otro sistema aprobado.  
La elección deberá respetar la arquitectura existente.  
No crear una base vectorial separada por cada agente sin necesidad.  
   
⸻  
   
## 73. Citations internas  
Los outputs de dominio deberán incluir fuentes.  
Ejemplo:  
```
Source:
IRS Publication, tax year 2026
Internal Tax Policy v3
Client Form Submission FS-1028

```
No mostrar referencias internas sensibles al cliente cuando no corresponda.  
   
⸻  
   
## 74. Freshness  
Las respuestas deberán considerar:  
* effective date;  
* tax year;  
* current year;  
* jurisdiction;  
* source review status;  
* provider update.  
Cuando la información pueda estar desactualizada:  
Esta regla debe verificarse antes de ejecutar porque la fuente está pendiente de revisión.  
   
⸻  
   
## 75. Knowledge Update Workflow  
```
New source detected
→ ingest
→ classify
→ compare
→ specialist review
→ approve
→ index
→ activate
→ retire old source

```
La IA no podrá autoaprobar fuentes legales o fiscales.  
   
⸻  
   
## 76. Memoria  
Tipos:  
```
session_memory
conversation_summary
client_preference_memory
workflow_memory
agent_scratch_memory
long_term_business_memory

```
   
⸻  
   
## 77. Memoria de sesión  
Podrá conservar:  
* intención;  
* idioma;  
* contexto;  
* respuestas recientes;  
* formulario activo.  
Deberá expirar según política.  
   
⸻  
   
## 78. Memoria del cliente  
Podrá conservar únicamente datos útiles y autorizados.  
Ejemplos:  
* idioma;  
* canal preferido;  
* objetivos declarados;  
* último servicio consultado.  
No deberá duplicar perfiles ni guardar PII en texto libre.  
   
⸻  
   
## 79. Memoria interna  
Podrá guardar:  
* resumen de caso;  
* decisiones;  
* blockers;  
* próximas acciones.  
Deberá enlazar fuentes.  
No deberá reemplazar entidades estructuradas.  
   
⸻  
   
## 80. Memory Policy  
Cada agente deberá definir:  
```
memoryEnabled
memoryTypes
retention
sensitivity
writePermissions
readPermissions
clientVisibility
deletionPolicy

```
   
⸻  
   
## 81. Agent Session  
Campos:  
```
id
agentId
agentVersionId
userId
clientId
conversationId
channel
language
status
memoryPolicyId
startedAt
lastActivityAt
endedAt

```
   
⸻  
   
## 82. Agent Run  
Campos:  
```
id
agentSessionId
agentId
agentVersionId
skillVersions
modelProviderId
modelDefinitionId
routingDecisionId
purpose
inputReferences
outputReference
status
riskLevel
startedAt
completedAt
reviewStatus
reviewedBy

```
   
⸻  
   
## 83. Agent Run Status  
```
queued
routing
running
waiting_for_tool
waiting_for_approval
waiting_for_human
completed
completed_with_warning
failed
cancelled
timed_out
blocked

```
   
⸻  
   
## 84. Prompt Management  
El sistema deberá administrar:  
* system prompts;  
* skill prompts;  
* tool instructions;  
* output schemas;  
* safety rules;  
* examples;  
* escalation language;  
* channel tone;  
* language variants.  
   
⸻  
   
## 85. Prompt Definition  
Campos:  
```
id
code
promptType
name
content
language
domain
status
riskLevel
currentVersionId
createdAt
updatedAt

```
   
⸻  
   
## 86. Prompt Versioning  
Cambios deberán crear versión.  
Las ejecuciones deberán guardar:  
```
promptVersionIds

```
No editar prompts activos directamente.  
   
⸻  
   
## 87. Prompts y secretos  
No incluir:  
* API keys;  
* passwords;  
* database credentials;  
* private URLs;  
* tokens;  
* full PII examples;  
* production data.  
   
⸻  
   
## 88. Prompt Injection Defense  
Medidas:  
* separar instrucciones y datos;  
* marcar contenido no confiable;  
* tool allowlist;  
* schema validation;  
* no ejecutar texto como instrucciones;  
* filtrar documentos;  
* detectar patrones;  
* limitar browsing;  
* validar outputs;  
* human review;  
* sandbox.  
   
⸻  
   
## 89. Canales  
El AI Hub deberá soportar:  
```
web_chat
client_portal
admin_portal
whatsapp
instagram
facebook
email
phone
internal_console
workflow
api

```
Cada canal deberá tener política propia.  
   
⸻  
   
## 90. Channel Policy  
Definirá:  
* agente;  
* tono;  
* tools;  
* datos;  
* autenticación;  
* límite;  
* handoff;  
* horario;  
* recording;  
* retention;  
* fallback.  
   
⸻  
   
## 91. WhatsApp  
El agente podrá:  
* responder;  
* crear lead;  
* agendar;  
* enviar links;  
* consultar estado básico autenticado mediante verificación;  
* escalar.  
No deberá:  
* recibir tarjetas;  
* recibir SSN;  
* compartir documentos sensibles directamente;  
* ejecutar servicios.  
   
⸻  
   
## 92. Redes sociales  
La IA deberá mover interacciones sensibles a:  
* portal;  
* WhatsApp;  
* teléfono;  
* secure form.  
No confirmar públicamente que una persona es cliente.  
   
⸻  
   
## 93. Email  
El agente podrá:  
* clasificar;  
* resumir;  
* preparar respuesta;  
* crear tarea;  
* detectar documentos;  
* hacer draft.  
El envío automático deberá limitarse a categorías de bajo riesgo.  
   
⸻  
   
## 94. Voz  
La arquitectura de voz deberá separar:  
```
Telephony Provider
→ Speech-to-Text
→ Voice Session Manager
→ Voice Agent
→ Tools
→ Text-to-Speech

```
   
⸻  
   
## 95. Voice Session  
Campos:  
```
id
callId
channel
phoneNumberMasked
callerContactId
clientId
language
recordingStatus
consentStatus
agentId
handoffStatus
startedAt
endedAt
summaryReference

```
   
⸻  
   
## 96. Disclosure de IA en llamadas  
La llamada deberá informar de forma clara que se trata de un asistente virtual cuando corresponda.  
Ejemplo:  
Hola, soy el asistente virtual de SG Solutions. Puedo ayudarte a identificar el servicio que necesitas o agendar una llamada con nuestro equipo.  
   
⸻  
   
## 97. Grabación  
La grabación deberá depender de:  
* ley aplicable;  
* estado;  
* consentimiento;  
* política;  
* necesidad.  
No grabar automáticamente en todas las jurisdicciones.  
   
⸻  
   
## 98. Voice Handoff  
Condiciones:  
* cliente lo solicita;  
* agente no entiende;  
* queja;  
* seguridad;  
* asesoría compleja;  
* cliente molesto;  
* problema de pago;  
* caso sensible;  
* emergencia.  
   
⸻  
   
## 99. Human Handoff  
Toda conversación deberá poder escalar.  
Handoff record:  
```
reason
summary
urgency
requiredSkill
clientMood
openQuestions
dataCollected
nextAction

```
   
⸻  
   
## 100. Supervisor Agent  
Podrá:  
* revisar outputs;  
* detectar inconsistencias;  
* seleccionar agente;  
* aplicar policies;  
* validar schemas;  
* decidir escalation técnica.  
No podrá sustituir Approval humano para acciones sensibles.  
   
⸻  
   
## 101. Multi-Agent Orchestration  
Podrá utilizarse cuando una tarea requiera varios dominios.  
Ejemplo:  
```
Business Funding Request
→ Intake Agent
→ Organization Agent
→ Document Agent
→ Funding Agent
→ Quality Review Agent
→ Human Specialist

```
No permitir conversaciones libres ilimitadas entre agentes.  
   
⸻  
   
## 102. Agent Plan  
Un plan deberá ser estructurado:  
```
{
  "goal": "Prepare LLC filing draft",
  "steps": [
    "validate intake",
    "validate organization",
    "identify missing fields",
    "prepare filing payload",
    "request human approval"
  ],
  "allowedTools": [
    "get_organization_summary",
    "get_form_submission",
    "create_filing_draft",
    "create_approval_request"
  ]
}

```
   
⸻  
   
## 103. Límites de planificación  
Los agentes no deberán:  
* añadir tools;  
* cambiar permisos;  
* extender scopes;  
* omitir Approval;  
* navegar a dominios no permitidos;  
* modificar el objetivo sin confirmación.  
   
⸻  
   
## 104. Browser Automation  
La automatización de navegador deberá ejecutarse en un servicio separado.  
Arquitectura:  
```
Agent
→ Browser Action Proposal
→ Approval
→ Execution Authorization
→ Browser Worker
→ Evidence
→ Result Review

```
   
⸻  
   
## 105. Browser Worker Sandbox  
Deberá incluir:  
* container aislado;  
* navegador aislado;  
* credenciales protegidas;  
* dominio allowlist;  
* download restrictions;  
* upload restrictions;  
* network policy;  
* timeout;  
* screenshots;  
* video opcional;  
* audit.  
   
⸻  
   
## 106. Browser Action Plan  
Campos:  
```
targetDomain
taskType
allowedUrls
allowedActions
prohibitedActions
inputReferences
expectedOutput
finalSubmissionRequiresConfirmation
timeout
screenshotPolicy

```
   
⸻  
   
## 107. Credenciales para browser worker  
Las credenciales deberán:  
* estar en vault;  
* ser recuperadas por referencia;  
* no mostrarse al modelo;  
* rotarse;  
* limitarse;  
* separarse por proveedor;  
* registrarse su uso.  
   
⸻  
   
## 108. Confirmación final  
Para acciones irreversibles:  
```
worker fills form
→ final screen snapshot
→ human reviews
→ approval confirmed
→ worker submits

```
   
⸻  
   
## 109. AI Review Queue  
Outputs que deberán pasar por revisión:  
* filing drafts;  
* EIN drafts;  
* tax calculations;  
* tax returns;  
* dispute letters;  
* lender applications;  
* partner sharing;  
* legal interpretations;  
* high-risk messages;  
* identity matches;  
* browser plans;  
* code for production.  
   
⸻  
   
## 110. Review Status  
```
not_required
pending
in_review
approved
approved_with_edits
rejected
superseded
executed

```
   
⸻  
   
## 111. Quality Review Agent  
Podrá evaluar:  
* factuality;  
* completeness;  
* source coverage;  
* policy compliance;  
* tone;  
* privacy;  
* hallucination;  
* unsupported claims;  
* required disclaimer;  
* tool output consistency.  
Sus resultados serán sugerencias.  
   
⸻  
   
## 112. Output Validation Pipeline  
```
Model output
→ schema validation
→ policy validation
→ source validation
→ PII validation
→ risk classification
→ quality evaluation
→ human review if required
→ publish or execute

```
   
⸻  
   
## 113. Hallucination Controls  
Medidas:  
* RAG obligatorio para dominios críticos;  
* citations;  
* confidence limits;  
* deterministic tools;  
* no answer cuando no existe evidencia;  
* specialist review;  
* source freshness;  
* test cases;  
* output schemas.  
   
⸻  
   
## 114. Confidence  
El sistema podrá registrar:  
```
high
medium
low
unknown

```
No presentar confidence del modelo como probabilidad real de exactitud.  
   
⸻  
   
## 115. Escalamiento por incertidumbre  
Escalar cuando:  
* fuentes conflictivas;  
* fuente stale;  
* jurisdiction unclear;  
* tax year unclear;  
* missing documents;  
* model low confidence;  
* tool failure;  
* client asks for guarantee;  
* legal interpretation complex;  
* safety concern.  
   
⸻  
   
## 116. Evaluations  
El AI Hub deberá tener evaluaciones para:  
* factuality;  
* citations;  
* tool selection;  
* schema compliance;  
* privacy;  
* refusal;  
* escalation;  
* multilingual quality;  
* domain accuracy;  
* workflow compliance;  
* prompt injection resistance.  
   
⸻  
   
## 117. Evaluation Suite  
Campos:  
```
id
code
name
domain
agentId
skillId
status
datasetId
metrics
thresholds
currentVersionId
createdAt
updatedAt

```
   
⸻  
   
## 118. Evaluation Dataset  
Debe incluir:  
* input;  
* context;  
* expected behavior;  
* allowed tools;  
* prohibited tools;  
* expected output schema;  
* expected escalation;  
* scoring rubric.  
No usar datos reales sin anonimización.  
   
⸻  
   
## 119. Golden Cases  
Ejemplos:  
* cliente pregunta por LLC;  
* tax intake incompleto;  
* disputa falsa;  
* préstamo no disponible;  
* cliente pide garantía;  
* prompt injection en documento;  
* cambio de ownership;  
* refund grande;  
* solicitud de SSN por chat;  
* nodo GPU offline.  
   
⸻  
   
## 120. Red Team Testing  
Probar:  
* jailbreak;  
* prompt injection;  
* tool abuse;  
* data exfiltration;  
* cross-client access;  
* approval bypass;  
* hallucinated law;  
* fake citations;  
* price manipulation;  
* refund manipulation;  
* malicious documents;  
* malicious webpages;  
* voice social engineering.  
   
⸻  
   
## 121. Agent Benchmark  
Métricas:  
* task success;  
* tool accuracy;  
* citation correctness;  
* escalation accuracy;  
* reviewer correction rate;  
* latency;  
* cost;  
* privacy violations;  
* policy violations;  
* human time saved.  
   
⸻  
   
## 122. Deployment Gate  
Una versión de agente no podrá activarse si:  
* evaluaciones fallan;  
* tools no están revisadas;  
* source coverage incompleta;  
* prompts sin aprobación;  
* privacy review pendiente;  
* safety test pendiente;  
* rollback no probado;  
* kill switch inexistente.  
   
⸻  
   
## 123. Rollout  
Estados:  
```
development
sandbox
internal_testing
staff_only
limited_clients
percentage_rollout
production
paused
retired

```
   
⸻  
   
## 124. Feature Flags  
Flags por:  
* agente;  
* skill;  
* model;  
* channel;  
* tool;  
* customer segment;  
* state;  
* service;  
* environment.  
   
⸻  
   
## 125. Kill Switches  
Deberán existir para:  
* agente;  
* modelo;  
* provider;  
* skill;  
* tool;  
* browser automation;  
* voice;  
* WhatsApp;  
* external data sharing;  
* cloud processing;  
* GPU node;  
* automated messaging.  
   
⸻  
   
## 126. Cost Management  
El sistema deberá controlar:  
* tokens;  
* GPU time;  
* cloud cost;  
* speech minutes;  
* embedding cost;  
* vector storage;  
* tool cost;  
* partner API cost.  
   
⸻  
   
## 127. Cost Budget  
Podrá definirse por:  
```
agent
service
client
team
channel
model
provider
day
month

```
   
⸻  
   
## 128. Cost Limits  
Cuando se alcance límite:  
* usar modelo menor;  
* detener tareas no críticas;  
* solicitar aprobación;  
* usar batch;  
* enviar a queue;  
* escalar a humano.  
   
⸻  
   
## 129. Cost Attribution  
Cada Agent Run deberá vincularse con:  
* cliente;  
* servicio;  
* expediente;  
* equipo;  
* canal;  
* purpose;  
* provider.  
   
⸻  
   
## 130. Local GPU Cost  
Aunque no exista costo por token, registrar:  
* tiempo;  
* electricidad estimada;  
* utilización;  
* temperatura;  
* fallos;  
* modelo;  
* VRAM.  
   
⸻  
   
## 131. Performance  
Métricas:  
* time to first token;  
* total latency;  
* queue wait;  
* tool latency;  
* retrieval latency;  
* review time;  
* GPU load;  
* failure rate.  
   
⸻  
   
## 132. Rate Limiting  
Aplicar por:  
* usuario;  
* IP;  
* cliente;  
* agente;  
* channel;  
* tool;  
* provider;  
* model;  
* service.  
   
⸻  
   
## 133. Abuse Prevention  
Detectar:  
* spam;  
* scraping;  
* prompt attacks;  
* repeated requests;  
* resource exhaustion;  
* abusive language;  
* automated calls;  
* mass tool invocation;  
* account sharing.  
   
⸻  
   
## 134. Privacy  
Requisitos:  
* data minimization;  
* purpose limitation;  
* source authorization;  
* encryption;  
* redaction;  
* retention;  
* access control;  
* provider policy;  
* deletion workflows;  
* audit.  
   
⸻  
   
## 135. PII Classification  
```
public
internal
personal
financial
credit
tax
identity
legal
restricted
secret

```
   
⸻  
   
## 136. Data Scope Builder  
Antes de cada run:  
```
User permissions
+ Agent permissions
+ Purpose
+ Resource access
+ Service context
+ Sensitivity
→ Context Scope

```
   
⸻  
   
## 137. No acceso directo a base de datos  
Los agentes deberán usar tools.  
No ejecutar:  
* SQL generado por modelo en producción;  
* consultas arbitrarias;  
* updates directos;  
* deletes directos;  
* schema changes.  
   
⸻  
   
## 138. Database Tools  
Las tools deberán usar servicios de dominio.  
Ejemplo:  
```
get_client_summary()

```
No:  
```
execute_sql("SELECT * FROM clients")

```
   
⸻  
   
## 139. Secrets  
Los agentes no deberán ver secretos.  
La tool podrá usar una referencia segura internamente.  
   
⸻  
   
## 140. Logging  
Registrar:  
* run ID;  
* agent;  
* version;  
* model;  
* purpose;  
* tools;  
* status;  
* cost;  
* latency;  
* reviewer;  
* error;  
* correlation ID.  
No registrar innecesariamente:  
* full prompt;  
* full PII;  
* document content;  
* credentials;  
* access tokens.  
   
⸻  
   
## 141. Audit Events  
```
agent_created
agent_version_created
agent_approved
agent_activated
agent_paused
agent_retired
skill_created
skill_version_created
skill_approved
model_registered
model_routing_changed
tool_registered
tool_policy_changed
knowledge_source_added
knowledge_source_approved
agent_session_started
agent_run_started
agent_tool_proposed
agent_tool_executed
agent_tool_rejected
agent_output_created
agent_output_reviewed
agent_output_approved
agent_output_rejected
agent_handoff_created
agent_cost_limit_reached
agent_kill_switch_used
gpu_node_connected
gpu_node_disconnected

```
   
⸻  
   
## 142. Observability  
Deberá incluir:  
* logs;  
* metrics;  
* traces;  
* dashboards;  
* alerts;  
* health checks;  
* model status;  
* queue status;  
* GPU status;  
* provider status;  
* tool status;  
* cost status.  
   
⸻  
   
## 143. AI Hub Dashboard  
Widgets:  
* agentes activos;  
* runs;  
* runs fallidos;  
* human reviews;  
* tools bloqueadas;  
* costo;  
* GPU status;  
* local server model;  
* cloud usage;  
* queue;  
* stale sources;  
* evaluation failures;  
* prompt injection alerts;  
* kill switches;  
* incidents.  
   
⸻  
   
## 144. Agent Detail View  
Deberá mostrar:  
* propósito;  
* estado;  
* versión;  
* skills;  
* models;  
* tools;  
* knowledge;  
* memory;  
* channels;  
* risks;  
* permissions;  
* evaluation;  
* deployment;  
* runs;  
* cost;  
* incidents.  
   
⸻  
   
## 145. Run Detail View  
Deberá mostrar:  
* request;  
* purpose;  
* scope;  
* routing;  
* model;  
* sources;  
* tools;  
* output;  
* validation;  
* review;  
* cost;  
* latency;  
* errors;  
* audit.  
Los campos sensibles deberán redactarse.  
   
⸻  
   
## 146. Incident Management  
Tipos:  
```
hallucination
privacy
tool_misuse
data_exposure
wrong_client
wrong_action
approval_bypass
prompt_injection
model_failure
provider_failure
cost_spike
voice_failure
browser_failure
stale_knowledge
security

```
   
⸻  
   
## 147. AI Incident  
Campos:  
```
id
agentId
agentVersionId
runId
incidentType
severity
status
title
description
impact
detectedAt
owner
mitigation
resolvedAt
postmortemReference

```
   
⸻  
   
## 148. Incident Response  
```
Detect
→ pause agent or tool
→ preserve evidence
→ identify affected clients
→ block execution
→ notify team
→ mitigate
→ evaluate
→ fix
→ test
→ gradual reactivation

```
   
⸻  
   
## 149. Model Outage  
Cuando un modelo falle:  
* usar fallback;  
* guardar request;  
* enviar a queue;  
* alertar;  
* no perder conversación;  
* no repetir acciones sensibles;  
* no ocultar fallo.  
   
⸻  
   
## 150. Provider Outage  
El sistema deberá distinguir:  
* provider unavailable;  
* rate limited;  
* authentication failure;  
* quota exceeded;  
* model unavailable;  
* region unavailable.  
   
⸻  
   
## 151. GPU Node Offline  
Comportamiento:  
```
Advanced task requested
→ GPU node offline
→ check cloud policy
→ if cloud allowed, route
→ else queue
→ notify internal user
→ allow cancellation

```
   
⸻  
   
## 152. Queue Priority  
```
critical
high
normal
low
batch

```
Las consultas públicas no deberán desplazar acciones críticas internas.  
   
⸻  
   
## 153. AI Jobs  
Tipos:  
* document analysis;  
* embedding;  
* summarization;  
* evaluation;  
* coding;  
* batch extraction;  
* source ingestion;  
* report generation;  
* model warmup.  
   
⸻  
   
## 154. Job Idempotency  
Los reintentos no deberán:  
* duplicar documentos;  
* duplicar tasks;  
* duplicar messages;  
* duplicar approvals;  
* duplicar tool actions.  
   
⸻  
   
## 155. Administration  
El panel deberá permitir:  
* crear agentes;  
* clonar;  
* versionar;  
* añadir skills;  
* configurar routing;  
* configurar tools;  
* configurar knowledge;  
* configurar memory;  
* configurar channels;  
* configurar budgets;  
* configurar evaluations;  
* previsualizar;  
* simular;  
* aprobar;  
* desplegar;  
* pausar;  
* retirar;  
* rollback.  
   
⸻  
   
## 156. No-code Agent Builder  
Podrá existir un editor visual limitado.  
No deberá permitir:  
* tool arbitrary code;  
* permisos libres;  
* secrets;  
* SQL;  
* producción directa;  
* prompts sin revisión;  
* fuentes no aprobadas.  
   
⸻  
   
## 157. Agent Template  
Plantillas:  
```
Public Support Agent
Authenticated Client Agent
Internal Specialist Agent
Voice Reception Agent
Document Agent
Research Agent
Coding Agent

```
Las plantillas deberán ser versionadas.  
   
⸻  
   
## 158. Agent Preview  
Deberá permitir:  
* español;  
* inglés;  
* distintos canales;  
* distintos roles;  
* distintas herramientas;  
* error cases;  
* GPU offline;  
* cloud disabled;  
* prompt injection;  
* handoff;  
* approval required.  
   
⸻  
   
## 159. Agent Simulator  
Usará datos ficticios.  
Podrá simular:  
* tool success;  
* tool failure;  
* missing permission;  
* stale source;  
* low confidence;  
* approval;  
* rejection;  
* timeout;  
* node offline;  
* cost limit;  
* malicious document.  
   
⸻  
   
## 160. Permissions  
Ejemplos:  
```
ai.agent.read
ai.agent.create
ai.agent.update
ai.agent.submit_review
ai.agent.approve
ai.agent.deploy
ai.agent.pause
ai.agent.retire
ai.skill.read
ai.skill.manage
ai.skill.approve
ai.model.read
ai.model.manage
ai.routing.manage
ai.tool.read
ai.tool.manage
ai.knowledge.read
ai.knowledge.manage
ai.knowledge.approve
ai.run.read
ai.run.read_restricted
ai.run.review
ai.output.approve
ai.cost.read
ai.cost.manage
ai.evaluation.read
ai.evaluation.manage
ai.incident.manage
ai.kill_switch.manage

```
   
⸻  
   
## 161. Segregación de funciones  
Idealmente:  
* developer creates;  
* specialist reviews domain;  
* security reviews tools;  
* compliance reviews risk;  
* owner approves deployment.  
En etapa inicial, owner override deberá auditarse.  
   
⸻  
   
## 162. Reautenticación  
Requerida para:  
* deploy agent;  
* change tools;  
* change model data policy;  
* activate cloud processing;  
* enable browser worker;  
* approve high-risk output;  
* use kill switch;  
* export run data;  
* change retention;  
* modify source permissions.  
   
⸻  
   
## 163. Modelo de datos conceptual  
## AiAgent  
```
id
code
name
description
agentType
audience
status
automationLevel
defaultSkillSetId
modelRoutingPolicyId
toolPolicyId
knowledgePolicyId
memoryPolicyId
approvalPolicyId
dataAccessPolicyId
currentVersionId
createdAt
updatedAt

```
## AiAgentVersion  
```
id
agentId
versionNumber
configurationSnapshot
changeSummary
status
approvedBy
approvedAt
deployedAt
effectiveFrom
effectiveTo
createdAt

```
## AiSkill  
```
id
code
name
description
domain
riskLevel
status
currentVersionId
createdAt
updatedAt

```
## AiSkillVersion  
```
id
skillId
versionNumber
instructionSet
inputSchema
outputSchema
toolRequirements
knowledgeRequirements
evaluationSuiteId
status
approvedBy
approvedAt
effectiveFrom
effectiveTo
createdAt

```
## AiModelProvider  
```
id
code
name
providerType
status
dataPolicy
credentialReference
healthStatus
lastHealthCheckAt
createdAt
updatedAt

```
## AiModelDefinition  
```
id
providerId
code
modelName
modelFamily
capabilitySet
contextWindow
maxOutputTokens
supportsTools
supportsVision
supportsAudio
supportsStructuredOutput
qualityTier
latencyClass
dataPolicy
status
createdAt
updatedAt

```
## AiRoutingPolicy  
```
id
code
name
rules
fallbackPolicy
costPolicy
privacyPolicy
status
version
createdAt
updatedAt

```
## AiToolDefinition  
```
id
code
name
description
riskLevel
inputSchema
outputSchema
requiredPermissions
allowedAgentTypes
requiresApproval
idempotencyPolicy
rateLimitPolicy
status
version
createdAt
updatedAt

```
## AiAgentToolGrant  
```
id
agentId
agentVersionId
toolId
allowedActions
resourceScope
purposeScope
effectiveFrom
expiresAt
status
createdAt

```
## AiKnowledgeBase  
```
id
code
name
domain
sensitivity
jurisdiction
status
embeddingModelId
vectorStoreReference
createdAt
updatedAt

```
## AiKnowledgeSource  
```
id
knowledgeBaseId
code
title
sourceType
domain
jurisdiction
taxYear
authorityLevel
reviewStatus
effectiveFrom
effectiveTo
lastVerifiedAt
nextReviewAt
storageReference
contentHash
version
createdAt
updatedAt

```
## AiAgentSession  
```
id
agentId
agentVersionId
userId
clientId
conversationId
channel
language
status
memoryPolicyId
startedAt
lastActivityAt
endedAt

```
## AiAgentRun  
```
id
agentSessionId
agentId
agentVersionId
modelProviderId
modelDefinitionId
routingDecisionId
purpose
riskLevel
inputReferences
outputReference
status
reviewStatus
reviewedBy
startedAt
completedAt
costAmount
costCurrency
latencyMilliseconds

```
## AiToolCall  
```
id
agentRunId
toolDefinitionId
status
inputReference
outputReference
approvalRequestId
idempotencyKey
startedAt
completedAt
errorCode

```
## AiOutput  
```
id
agentRunId
outputType
contentReference
structuredOutput
status
confidenceLabel
sourceReferences
validationResults
createdAt
updatedAt

```
## AiEvaluationSuite  
```
id
code
name
domain
agentId
skillId
status
datasetId
metrics
thresholds
currentVersionId
createdAt
updatedAt

```
## AiEvaluationRun  
```
id
evaluationSuiteId
agentVersionId
modelDefinitionId
status
scores
failureSummary
startedAt
completedAt
createdAt

```
## AiCostRecord  
```
id
agentRunId
providerId
modelId
clientId
serviceOrderId
channel
inputUnits
outputUnits
gpuSeconds
speechSeconds
amount
currency
createdAt

```
## AiIncident  
```
id
agentId
agentVersionId
runId
incidentType
severity
status
title
impact
detectedAt
ownerId
mitigation
resolvedAt
postmortemReference
createdAt
updatedAt

```
## AiNode  
```
id
code
nodeType
hostnameReference
status
capabilitySet
gpuModel
vramBytes
memoryBytes
currentModelId
queueDepth
lastHeartbeatAt
createdAt
updatedAt

```
   
⸻  
   
## 164. Arquitectura técnica  
```
Public Channels / Client Portal / Admin Portal / Workflows
                         ↓
                    AI Gateway
                         ↓
             Authentication and Context
                         ↓
                  Agent Router
                         ↓
              Policy and Scope Engine
                         ↓
                   Agent Runtime
        ├── Skills
        ├── Prompt Manager
        ├── Memory
        ├── RAG
        ├── Tool Gateway
        ├── Model Router
        └── Output Validator
                         ↓
        Local Server / GPU Node / Cloud Providers
                         ↓
              Review and Approval Layer
                         ↓
                 Controlled Execution

```
   
⸻  
   
## 165. AI Gateway  
Responsabilidades:  
* recibir requests;  
* validar canal;  
* autenticar;  
* aplicar rate limits;  
* detectar idioma;  
* crear correlation ID;  
* seleccionar agente;  
* aplicar policy;  
* manejar streaming;  
* manejar fallback;  
* registrar auditoría.  
   
⸻  
   
## 166. Agent Runtime  
Responsabilidades:  
* cargar versión;  
* cargar skills;  
* construir scope;  
* recuperar contexto;  
* seleccionar modelo;  
* ejecutar;  
* manejar tools;  
* validar output;  
* crear handoff;  
* registrar cost.  
   
⸻  
   
## 167. Tool Gateway  
Responsabilidades:  
* validar tool;  
* validar permiso;  
* validar recurso;  
* validar approval;  
* aplicar idempotencia;  
* ejecutar dominio;  
* validar resultado;  
* auditar.  
   
⸻  
   
## 168. Model Router  
Responsabilidades:  
* evaluar tarea;  
* privacidad;  
* disponibilidad;  
* costo;  
* capacidad;  
* fallback;  
* queue;  
* modelo local;  
* nodo GPU;  
* cloud.  
   
⸻  
   
## 169. Knowledge Service  
Responsabilidades:  
* ingest;  
* parsing;  
* chunking;  
* embeddings;  
* access filters;  
* retrieval;  
* reranking;  
* freshness;  
* citations;  
* retirement.  
   
⸻  
   
## 170. AI Review Service  
Responsabilidades:  
* crear review;  
* asignar reviewer;  
* mostrar output;  
* mostrar fuentes;  
* mostrar tools;  
* comparar edits;  
* aprobar;  
* rechazar;  
* crear Approval Request.  
   
⸻  
   
## 171. APIs conceptuales  
```
GET /api/ai/agents
GET /api/ai/agents/{id}
POST /api/ai/agents/{id}/runs
GET /api/ai/runs/{id}
POST /api/ai/runs/{id}/review
POST /api/ai/runs/{id}/cancel
GET /api/ai/skills
GET /api/ai/models
GET /api/ai/nodes
GET /api/ai/knowledge-bases
POST /api/ai/knowledge-sources
POST /api/ai/evaluations/run
POST /api/ai/kill-switches/{code}/activate

```
Las APIs finales deberán respetar la arquitectura existente.  
   
⸻  
   
## 172. Domain Events  
```
AiAgentRunRequested
AiAgentRunStarted
AiAgentRunCompleted
AiAgentRunFailed
AiToolCallProposed
AiToolCallApproved
AiToolCallExecuted
AiToolCallRejected
AiOutputReviewRequested
AiOutputApproved
AiOutputRejected
AiHumanHandoffRequested
AiCostLimitReached
AiModelFallbackUsed
AiNodeOnline
AiNodeOffline
AiKnowledgeSourceStale
AiIncidentCreated

```
   
⸻  
   
## 173. Outbox e idempotencia  
Aplicar en:  
* tool calls;  
* messages;  
* tasks;  
* approvals;  
* document creation;  
* workflow actions;  
* agent jobs.  
   
⸻  
   
## 174. Fallbacks  
## Servidor local model no disponible  
* usar secondary local;  
* cloud permitido;  
* human fallback;  
* queue.  
## GPU node no disponible  
* usar lightweight mode;  
* usar cloud;  
* queue advanced request.  
## Cloud unavailable  
* local model;  
* queue;  
* human fallback.  
## RAG unavailable  
* no responder dominios críticos sin fuente;  
* crear task;  
* ofrecer revisión.  
## Tool unavailable  
* no afirmar acción completada;  
* guardar draft;  
* reintentar;  
* handoff.  
## Approval unavailable  
* detener acción sensible.  
   
⸻  
   
## 175. Manejo de fallos parciales  
Ejemplo:  
```
El borrador fue preparado correctamente.
La consulta del proveedor externo no estuvo disponible.
El resultado quedó pendiente de revisión.

```
No presentar una respuesta parcial como completa.  
   
⸻  
   
## 176. Retención  
Políticas separadas para:  
* public conversations;  
* client conversations;  
* internal runs;  
* tool inputs;  
* tool outputs;  
* prompts;  
* RAG context;  
* voice recordings;  
* transcripts;  
* evaluation data;  
* incidents;  
* costs.  
   
⸻  
   
## 177. Eliminación  
Distinguir:  
* delete session memory;  
* delete conversation;  
* redact run;  
* anonymize evaluation;  
* remove embedding;  
* purge source;  
* retain audit.  
No eliminar evidencia vinculada a acción ejecutada.  
   
⸻  
   
## 178. Exportación  
Una exportación deberá:  
* requerir permiso;  
* aplicar redacción;  
* excluir secretos;  
* excluir otros clientes;  
* registrar propósito;  
* usar enlace temporal;  
* auditarse.  
   
⸻  
   
## 179. Accesibilidad  
* teclado;  
* screen readers;  
* transcripts;  
* captions;  
* voice alternatives;  
* clear agent identity;  
* focus;  
* status announcements;  
* no depender de animaciones;  
* error recovery;  
* bilingual support.  
   
⸻  
   
## 180. Internacionalización  
Los agentes deberán soportar español e inglés.  
Requisitos:  
* mantener idioma elegido;  
* no traducir nombres legales;  
* no traducir formularios oficiales automáticamente;  
* conservar texto original;  
* registrar idioma;  
* evaluar ambos idiomas;  
* permitir handoff bilingüe.  
   
⸻  
   
## 181. Testing funcional  
Probar:  
* public agent;  
* authenticated agent;  
* internal agent;  
* skill routing;  
* model routing;  
* local model;  
* GPU model;  
* cloud fallback;  
* RAG;  
* tools;  
* approvals;  
* handoff;  
* memory;  
* citations;  
* cost limits;  
* kill switches;  
* voice;  
* browser plans.  
   
⸻  
   
## 182. Testing de seguridad  
Probar:  
* prompt injection;  
* data exfiltration;  
* cross-client access;  
* tool escalation;  
* SQL attempts;  
* secret extraction;  
* role tampering;  
* approval bypass;  
* browser domain escape;  
* malicious documents;  
* malicious webpages;  
* tool replay;  
* model routing privacy violation;  
* memory leakage;  
* RAG permission leakage.  
   
⸻  
   
## 183. Testing de dominio  
## Crédito  
* false dispute;  
* identity theft;  
* collection;  
* outdated law;  
* unsupported claim.  
## Taxes  
* wrong tax year;  
* missing income;  
* unsupported deduction;  
* state mismatch;  
* filing request.  
## Business Formation  
* unsupported state;  
* conflicting owners;  
* filing not approved;  
* EIN request.  
## Funding  
* guarantee request;  
* insufficient documents;  
* unsuitable partner.  
## Home Buying  
* program mismatch;  
* rural eligibility unknown;  
* income limit stale;  
* approval language.  
   
⸻  
   
## 184. Testing de routing  
Probar:  
* small task to lightweight;  
* complex task to GPU;  
* GPU offline;  
* cloud blocked;  
* local-only data;  
* budget exceeded;  
* model lacks tools;  
* model timeout.  
   
⸻  
   
## 185. Testing de tools  
Probar:  
* valid call;  
* invalid schema;  
* unauthorized resource;  
* missing approval;  
* duplicate call;  
* timeout;  
* output mismatch;  
* revoked approval;  
* wrong client;  
* forbidden tool.  
   
⸻  
   
## 186. Testing de RAG  
Probar:  
* correct source;  
* stale source;  
* conflicting source;  
* unauthorized source;  
* wrong jurisdiction;  
* wrong tax year;  
* no source;  
* citation mismatch.  
   
⸻  
   
## 187. Testing de memoria  
Probar:  
* session continuity;  
* expiration;  
* deletion;  
* wrong client;  
* cross-channel;  
* opt-out;  
* outdated preference;  
* profile conflict.  
   
⸻  
   
## 188. Testing de voz  
Probar:  
* Spanish;  
* English;  
* noisy audio;  
* interruption;  
* transfer;  
* voicemail;  
* consent;  
* no recording;  
* emergency language;  
* payment request;  
* PII request.  
   
⸻  
   
## 189. Testing de performance  
Probar:  
* simultaneous chats;  
* GPU queue;  
* embeddings;  
* large documents;  
* long sessions;  
* voice concurrency;  
* provider rate limits;  
* model warmup;  
* tool bursts.  
   
⸻  
   
## 190. Testing de resiliencia  
Probar:  
* server restart;  
* GPU restart;  
* network loss;  
* provider outage;  
* queue outage;  
* vector store outage;  
* database outage;  
* tool outage;  
* partial output;  
* duplicate event;  
* delayed approval.  
   
⸻  
   
## 191. Testing de costos  
Probar:  
* daily budget;  
* monthly budget;  
* expensive model;  
* runaway conversation;  
* retry storm;  
* speech overage;  
* GPU batch;  
* cloud fallback.  
   
⸻  
   
## 192. Criterios de aceptación  
El módulo estará listo cuando:  
1. Exista un AI Hub central.  
2. Los agentes sean versionados.  
3. Las skills sean reutilizables.  
4. Las skills sean versionadas.  
5. Los prompts sean versionados.  
6. Los tools sean estructurados.  
7. Cada agente tenga allowlist.  
8. Exista denylist global.  
9. No exista acceso directo a base de datos.  
10. Exista model routing.  
11. Existan modelos locales.  
12. Exista soporte para nodo GPU.  
13. El servidor funcione sin GPU.  
14. Exista fallback.  
15. Exista modo degradado.  
16. Exista política de datos.  
17. Exista redacción.  
18. Exista RAG.  
19. RAG respete permisos.  
20. Existan citas internas.  
21. Exista freshness.  
22. Exista memoria controlada.  
23. Exista human handoff.  
24. Exista AI Review Queue.  
25. Exista output validation.  
26. Existan evaluaciones.  
27. Existan golden cases.  
28. Exista red team testing.  
29. Exista deployment gate.  
30. Exista rollout gradual.  
31. Existan feature flags.  
32. Existan kill switches.  
33. Exista cost management.  
34. Exista rate limiting.  
35. Exista observabilidad.  
36. Exista incident management.  
37. Exista browser worker separado.  
38. Browser worker requiera Approval.  
39. Las credenciales no lleguen al modelo.  
40. Exista control por canal.  
41. Exista voz.  
42. Exista disclosure de asistente virtual.  
43. Exista soporte bilingüe.  
44. La IA pública no vea datos privados.  
45. La IA autenticada vea solo contexto permitido.  
46. La IA interna no pueda autoaprobar.  
47. La IA no pueda cambiar precios.  
48. La IA no pueda emitir refunds.  
49. La IA no pueda enviar filings libremente.  
50. La IA no pueda presentar taxes libremente.  
51. La IA no pueda enviar disputas libremente.  
52. La IA no pueda aplicar a préstamos libremente.  
53. Exista auditoría.  
54. Exista retención.  
55. Exista eliminación controlada.  
56. Pase pruebas de seguridad.  
57. Pase pruebas de dominio.  
58. Pase pruebas de resiliencia.  
59. Pase pruebas de routing.  
60. Reutilice la aplicación existente.  
   
⸻  
   
## 193. Plan de implementación  
## Fase 1 — Auditoría  
* chat;  
* modelos;  
* prompts;  
* tools;  
* RAG;  
* agents;  
* infrastructure;  
* security.  
## Fase 2 — AI Gateway  
* request handling;  
* authentication;  
* channels;  
* routing;  
* rate limits;  
* audit.  
## Fase 3 — Model Providers  
* local server;  
* GPU node;  
* cloud adapters;  
* health;  
* fallback.  
## Fase 4 — Agent Runtime  
* AgentDefinition;  
* versions;  
* sessions;  
* runs;  
* structured outputs.  
## Fase 5 — Skills  
* SkillDefinition;  
* versions;  
* composition;  
* domain skills;  
* evaluations.  
## Fase 6 — Tool Gateway  
* tool registry;  
* grants;  
* schemas;  
* permissions;  
* approval;  
* idempotency.  
## Fase 7 — Knowledge  
* sources;  
* review;  
* chunking;  
* embeddings;  
* vector store;  
* retrieval;  
* citations;  
* freshness.  
## Fase 8 — Memory  
* session;  
* summaries;  
* preferences;  
* retention;  
* deletion.  
## Fase 9 — Public Agents  
* web chat;  
* WhatsApp;  
* social;  
* appointment;  
* authenticated client agent.  
## Fase 10 — Internal Agents  
* owner assistant;  
* credit;  
* tax;  
* formation;  
* funding;  
* home buying;  
* documents.  
## Fase 11 — Voice  
* telephony;  
* STT;  
* session;  
* TTS;  
* handoff;  
* recording policy.  
## Fase 12 — Browser Worker  
* sandbox;  
* vault;  
* action plans;  
* approval;  
* evidence;  
* execution.  
## Fase 13 — Quality  
* validation;  
* review queue;  
* evaluations;  
* golden cases;  
* red team.  
## Fase 14 — Operations  
* dashboards;  
* costs;  
* queues;  
* GPU health;  
* incidents;  
* kill switches.  
## Fase 15 — Rollout  
* internal testing;  
* staging;  
* limited clients;  
* gradual production;  
* monitoring;  
* rollback.  
   
⸻  
   
## 194. Instrucciones finales para Codex  
Antes de implementar:  
1. Lee el contexto maestro.  
2. Lee los módulos 1 al 24.  
3. Lee este documento completo.  
4. Inspecciona toda la infraestructura de IA existente.  
5. No crees una aplicación separada.  
6. Integra el AI Hub en SG Solutions.  
7. Separa agentes, skills, prompts, models y tools.  
8. Versiona todos los componentes.  
9. No edites versiones activas.  
10. Implementa el servidor 24/7 como base.  
11. Implementa el nodo GPU como capacidad adicional.  
12. No dependas del nodo GPU.  
13. Implementa health checks.  
14. Implementa routing.  
15. Implementa fallback.  
16. Implementa modo degradado.  
17. Implementa políticas de datos por modelo.  
18. No envíes datos restringidos a cloud sin autorización.  
19. Implementa redacción.  
20. Implementa AgentDefinition.  
21. Implementa SkillDefinition.  
22. Implementa PromptDefinition.  
23. Implementa ToolDefinition.  
24. Implementa allowlists.  
25. Implementa denylist global.  
26. No permitas SQL arbitrario.  
27. No permitas acceso directo a la base.  
28. Usa servicios de dominio.  
29. Implementa Tool Gateway.  
30. Valida inputs.  
31. Valida outputs.  
32. Implementa idempotencia.  
33. Implementa approvals para tools sensibles.  
34. Implementa RAG.  
35. Implementa permisos en retrieval.  
36. Implementa source freshness.  
37. Implementa citations.  
38. Implementa memory policies.  
39. No dupliques perfiles en memoria.  
40. Implementa human handoff.  
41. Implementa AI Review Queue.  
42. Implementa output validation.  
43. Implementa domain evaluations.  
44. Implementa golden cases.  
45. Implementa red team tests.  
46. Implementa deployment gates.  
47. Implementa feature flags.  
48. Implementa kill switches.  
49. Implementa cost budgets.  
50. Implementa cost attribution.  
51. Implementa GPU metrics.  
52. Implementa incident response.  
53. Implementa Browser Worker separado.  
54. No entregues credenciales al modelo.  
55. Limita dominios.  
56. Requiere Approval antes de ejecución.  
57. Captura evidencia.  
58. Implementa chat público.  
59. Implementa cliente autenticado.  
60. Implementa owner assistant.  
61. Implementa skills de crédito.  
62. Implementa skills de taxes por tax year.  
63. Implementa Business Formation.  
64. Implementa Funding.  
65. Implementa Home Buying.  
66. Implementa Marketplace guidance.  
67. Implementa Voice Reception.  
68. Informa que es asistente virtual.  
69. Aplica políticas de grabación.  
70. Implementa bilingüe.  
71. No permitas que la IA apruebe.  
72. No permitas que la IA publique agentes.  
73. No permitas que la IA cambie tools.  
74. No permitas que la IA cambie precios.  
75. No permitas que la IA otorgue refunds.  
76. No permitas filings sin autorización.  
77. No permitas tax submissions sin autorización.  
78. No permitas credit disputes sin autorización.  
79. No permitas funding applications sin autorización.  
80. No permitas partner data sharing sin autorización.  
81. Implementa auditoría.  
82. Implementa field-level access.  
83. Implementa pruebas de prompt injection.  
84. Implementa pruebas de cross-client access.  
85. Implementa pruebas de tool escalation.  
86. Implementa pruebas de routing.  
87. Implementa pruebas de GPU offline.  
88. Implementa pruebas de cloud blocked.  
89. Implementa pruebas de RAG.  
90. Implementa pruebas de voz.  
91. Implementa pruebas de costos.  
92. Documenta modelos y proveedores.  
93. Documenta cada skill.  
94. Documenta cada tool.  
95. Documenta fuentes.  
96. No marques un agente como listo usando solo mocks.  
97. No marques una integración como terminada sin pruebas reales.  
98. No uses modelos experimentales en producción.  
99. Mantén la aplicación existente como fuente operativa.  
100. Mantén siempre supervisión humana para acciones sensibles.  
Antes de entregar, verifica:  
* ¿El servidor permanente puede atender clientes sin la GPU?  
* ¿El nodo GPU solo se utiliza cuando está disponible?  
* ¿Las solicitudes avanzadas pueden ir a cola?  
* ¿Cada agente tiene un propósito limitado?  
* ¿Cada skill tiene fuentes y evaluaciones?  
* ¿Cada tool tiene permisos y schema?  
* ¿La IA no puede consultar directamente PostgreSQL?  
* ¿El RAG filtra permisos antes de recuperar?  
* ¿Las fuentes fiscales tienen tax year?  
* ¿Las fuentes legales tienen jurisdicción y vigencia?  
* ¿Los outputs críticos incluyen fuentes?  
* ¿Los datos sensibles permanecen locales cuando la política lo exige?  
* ¿La IA pública no puede ver expedientes?  
* ¿El cliente autenticado solo ve estados públicos?  
* ¿El owner puede ordenar acciones sin saltarse Approval?  
* ¿La IA puede preparar, pero no ejecutar libremente?  
* ¿El Browser Worker está aislado?  
* ¿Las credenciales permanecen fuera del modelo?  
* ¿Cada ejecución queda auditada?  
* ¿Los costos pueden limitarse?  
* ¿Existen kill switches?  
* ¿El sistema puede degradarse sin quedar fuera de servicio?  
* ¿Las skills de crédito, taxes, formación, funding y vivienda están separadas?  
* ¿Los agentes pueden escalar a humanos?  
* ¿Las respuestas bilingües mantienen calidad?  
* ¿La implementación reutiliza CRM, Tasks, Approvals, Workflows y Documents?  
  
  
  
  
  
  
  
**MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES**  
  
**Parte 1 — Filosofía Operativa, Arquitectura General e Infraestructura Base**  
  
**Versión:** 1.0.0  
  
**Estado:** Especificación Inicial  
  
**Proyecto:** SG Solutions Platform  
  
**Tipo:** Infraestructura Empresarial  
  
**Audiencia:** Codex, Arquitectos de Software, DevOps Engineers, Backend Developers, AI Engineers, Administradores del Sistema  
  
⸻  
  
**1. Objetivo**  
  
Este módulo define cómo deberá desplegarse, mantenerse, protegerse, monitorearse y escalarse toda la plataforma SG Solutions.  
  
No describe funcionalidades para el cliente.  
  
Describe cómo funcionará el ecosistema tecnológico que soportará todos los módulos del sistema.  
  
El objetivo es que SG Solutions pueda operar como una plataforma SaaS profesional con disponibilidad permanente, alta seguridad, recuperación ante fallos y capacidad de crecimiento durante muchos años.  
  
⸻  
  
**2. Principios Arquitectónicos**  
  
Toda decisión técnica deberá seguir los siguientes principios.  
  
**2.1 Modularidad**  
  
Cada servicio deberá estar completamente desacoplado.  
  
Ejemplos:  
  
* CRM  
* Billing  
* Marketplace  
* AI Hub  
* Authentication  
* File Storage  
* Notifications  
* Workflows  
* Browser Workers  
* Voice Services  
  
deberán poder evolucionar independientemente.  
  
Nunca deberán existir dependencias circulares entre módulos.  
  
⸻  
  
**2.2 Escalabilidad Horizontal**  
  
Todo componente deberá poder escalar mediante la creación de nuevas instancias.  
  
Ejemplo:  
  
1 Backend  
  
↓  
  
4 Backends  
  
↓  
  
10 Backends  
  
sin necesidad de modificar el código.  
  
⸻  
  
**2.3 Alta Disponibilidad**  
  
Siempre que sea posible deberán existir mecanismos de recuperación automática.  
  
Ejemplos:  
  
* reinicio automático de contenedores  
* reintentos automáticos  
* colas persistentes  
* workers redundantes  
* backups automáticos  
  
⸻  
  
**2.4 Desacoplamiento**  
  
Los servicios nunca deberán comunicarse directamente mediante consultas SQL.  
  
Toda comunicación deberá realizarse mediante:  
  
* APIs  
* Eventos  
* Colas  
* Servicios internos  
  
⸻  
  
**2.5 Seguridad por Diseño**  
  
La seguridad no deberá añadirse al final del desarrollo.  
  
Cada componente deberá diseñarse considerando desde el principio:  
  
* autenticación  
* autorización  
* cifrado  
* auditoría  
* registro de eventos  
* protección de secretos  
* aislamiento  
  
⸻  
  
**2.6 Observabilidad**  
  
Todo componente deberá poder responder preguntas como:  
  
¿Qué ocurrió?  
  
¿Cuándo ocurrió?  
  
¿Quién ejecutó la acción?  
  
¿Cuánto tardó?  
  
¿Qué errores aparecieron?  
  
¿Qué versión estaba ejecutándose?  
  
⸻  
  
**2.7 Automatización**  
  
Todo aquello que pueda automatizarse deberá automatizarse.  
  
Ejemplos:  
  
Backups  
  
Deployments  
  
Health Checks  
  
Monitoreo  
  
Alertas  
  
Renovaciones  
  
Actualizaciones  
  
Limpieza de logs  
  
Rotación de claves  
  
⸻  
  
**3. Filosofía DevSecOps**  
  
SG Solutions utilizará una estrategia DevSecOps.  
  
Eso significa integrar:  
  
Desarrollo  
  
↓  
  
Seguridad  
  
↓  
  
Infraestructura  
  
↓  
  
Pruebas  
  
↓  
  
Despliegue  
  
↓  
  
Operación  
  
↓  
  
Monitoreo  
  
↓  
  
Retroalimentación  
  
como un único proceso continuo.  
  
La seguridad deberá existir durante todo el ciclo de vida del software.  
  
⸻  
  
**4. Arquitectura Física**  
  
La plataforma estará dividida en varios nodos especializados.  
  
No todos deberán existir desde el primer día.  
  
La arquitectura deberá permitir agregarlos conforme crezca el negocio.  
  
La infraestructura estará formada por:  
  
**Nodo Principal**  
  
Servidor 24/7  
  
Responsabilidades:  
  
* Backend  
* API  
* Frontend  
* PostgreSQL  
* Redis  
* MinIO  
* AI Gateway  
* Scheduler  
* Queue  
* Workers básicos  
  
⸻  
  
**Nodo IA Permanente**  
  
Servidor de bajo consumo.  
  
Disponible 24 horas.  
  
Responsabilidades:  
  
* modelos pequeños  
* embeddings  
* RAG  
* clasificación  
* chat público  
* routing  
  
Este servidor nunca dependerá de la computadora gamer.  
  
⸻  
  
**Nodo GPU**  
  
Computadora personal del propietario.  
  
Utilizada únicamente para cargas pesadas.  
  
Ejemplos:  
  
* programación  
* generación de documentos largos  
* análisis profundo  
* revisión de expedientes  
* entrenamiento  
* evaluaciones  
  
Si este nodo está apagado:  
  
La plataforma deberá seguir funcionando normalmente.  
  
⸻  
  
**Almacenamiento**  
  
Todo documento deberá almacenarse fuera del backend.  
  
El almacenamiento deberá ser independiente.  
  
Ejemplos:  
  
* documentos  
* imágenes  
* PDFs  
* evidencias  
* grabaciones  
* contratos  
  
⸻  
  
**Base de Datos**  
  
PostgreSQL será la única base de datos relacional principal.  
  
Nunca deberán existir múltiples bases de datos principales con información duplicada.  
  
⸻  
  
**Cache**  
  
Redis será utilizado para:  
  
* sesiones  
* cache  
* colas  
* rate limiting  
* locks  
* eventos temporales  
  
Nunca almacenará información crítica permanente.  
  
⸻  
  
**5. Arquitectura Lógica**  
  
La arquitectura lógica deberá seguir la siguiente estructura:  
  
Usuarios  
  
↓  
  
Frontend  
  
↓  
  
Backend API  
  
↓  
  
Servicios de Dominio  
  
↓  
  
Workflows  
  
↓  
  
AI Hub  
  
↓  
  
Integraciones  
  
↓  
  
Base de Datos  
  
↓  
  
Storage  
  
↓  
  
Logs  
  
Cada capa tendrá responsabilidades claramente definidas.  
  
⸻  
  
**6. Arquitectura por Capas**  
  
La plataforma deberá dividirse en las siguientes capas.  
  
**Presentación**  
  
React  
  
Next.js  
  
Tailwind  
  
Shadcn  
  
⸻  
  
**Aplicación**  
  
Casos de uso.  
  
Orquestación.  
  
Workflows.  
  
Servicios.  
  
⸻  
  
**Dominio**  
  
Reglas del negocio.  
  
No dependerá de frameworks.  
  
⸻  
  
**Infraestructura**  
  
Base de datos.  
  
Redis.  
  
Storage.  
  
Stripe.  
  
Twilio.  
  
IdentityIQ.  
  
Marketplace.  
  
Correo.  
  
SMS.  
  
⸻  
  
**IA**  
  
AI Hub.  
  
Agentes.  
  
Skills.  
  
Modelos.  
  
RAG.  
  
Embeddings.  
  
⸻  
  
**Integraciones**  
  
APIs externas.  
  
Partner APIs.  
  
Automatizaciones.  
  
⸻  
  
**7. Separación de Responsabilidades**  
  
El Frontend nunca implementará reglas del negocio.  
  
El Backend nunca contendrá lógica de presentación.  
  
La Base de Datos nunca contendrá lógica empresarial.  
  
La IA nunca decidirá reglas del negocio.  
  
Los Workflows nunca contendrán lógica de infraestructura.  
  
⸻  
  
**8. Ambientes**  
  
Desde el inicio existirán múltiples ambientes.  
  
Development  
  
Utilizado por desarrolladores.  
  
Testing  
  
Utilizado para pruebas automáticas.  
  
QA  
  
Pruebas funcionales.  
  
Staging  
  
Simulación exacta de producción.  
  
Production  
  
Clientes reales.  
  
Sandbox  
  
Pruebas con APIs externas.  
  
Cada ambiente tendrá:  
  
* variables propias  
* base de datos propia  
* credenciales propias  
* almacenamiento propio  
* llaves propias  
  
Nunca deberán compartirse secretos entre ambientes.  
  
⸻  
  
**9. Principios de Producción**  
  
Producción deberá cumplir:  
  
HTTPS obligatorio.  
  
Backups automáticos.  
  
Monitoreo permanente.  
  
Logs centralizados.  
  
Health Checks.  
  
Protección contra ataques.  
  
Rate Limiting.  
  
Auditoría.  
  
Alta disponibilidad.  
  
Rollback rápido.  
  
Ningún desarrollador deberá modificar directamente la base de datos de producción.  
  
Toda modificación deberá pasar mediante migraciones.  
  
⸻  
  
**10. Instrucciones para Codex**  
  
Antes de escribir cualquier línea de código deberá:  
  
1. Analizar toda la arquitectura existente.  
2. Detectar componentes reutilizables.  
3. No crear servicios duplicados.  
4. No crear nuevas bases de datos innecesarias.  
5. Reutilizar el AI Hub.  
6. Reutilizar Authentication.  
7. Reutilizar CRM.  
8. Reutilizar Workflows.  
9. Reutilizar Billing.  
10. Reutilizar Marketplace.  
11. Mantener una única arquitectura consistente.  
12. Evitar soluciones temporales que generen deuda técnica.  
13. Documentar cada decisión importante de infraestructura.  
14. Priorizar mantenibilidad sobre rapidez de implementación.  
15. Diseñar pensando en una plataforma capaz de atender miles de clientes en el futuro.  
  
  
**MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES**  
**Parte 2 — Contenedores, Docker, Redes, Reverse Proxy y Orquestación**  
**Versión:** 1.0.0  
**Estado:** Especificación Inicial  
**Proyecto:** SG Solutions Platform  
   
⸻  
   
**11. Objetivo**  
Toda la plataforma deberá ejecutarse utilizando contenedores para garantizar:  
* Portabilidad.  
* Consistencia entre ambientes.  
* Facilidad de despliegue.  
* Escalabilidad.  
* Aislamiento.  
* Recuperación rápida.  
* Reproducibilidad.  
El desarrollador nunca deberá depender de configuraciones manuales del sistema operativo para ejecutar la aplicación.  
Todo deberá poder iniciarse desde un repositorio limpio utilizando únicamente los archivos de configuración del proyecto.  
   
⸻  
   
**12. Filosofía de Contenedores**  
Cada componente importante deberá ejecutarse en su propio contenedor.  
Nunca deberá existir un único contenedor gigante que contenga toda la aplicación.  
La separación facilitará:  
* mantenimiento;  
* escalabilidad;  
* actualización;  
* monitoreo;  
* aislamiento;  
* seguridad.  
   
⸻  
   
**13. Docker como estándar**  
Docker será el estándar oficial para ejecutar todos los servicios.  
Todos los desarrolladores deberán trabajar utilizando exactamente la misma infraestructura.  
No deberán existir instrucciones diferentes para Windows, Linux o macOS.  
La experiencia deberá ser idéntica.  
   
⸻  
   
**14. Servicios iniciales**  
Como mínimo existirán los siguientes contenedores:  
```
Frontend (Next.js)

Backend API (.NET)

PostgreSQL

Redis

MinIO

Nginx Reverse Proxy

AI Gateway

Worker Service

Scheduler

Browser Worker

Ollama (Modelos Locales)

Monitoring Stack

Logging Stack

```
La arquitectura deberá permitir agregar nuevos contenedores sin modificar los existentes.  
   
⸻  
   
**15. Responsabilidad de cada contenedor**  
**Frontend**  
Responsable únicamente de:  
* interfaz;  
* navegación;  
* autenticación del cliente;  
* consumo de APIs.  
Nunca contendrá reglas críticas del negocio.  
   
⸻  
   
**Backend**  
Responsable de:  
* lógica empresarial;  
* autorización;  
* workflows;  
* APIs;  
* integraciones.  
Nunca almacenará archivos permanentemente.  
   
⸻  
   
**PostgreSQL**  
Responsable únicamente del almacenamiento relacional.  
Nunca deberá ejecutar lógica empresarial.  
   
⸻  
   
**Redis**  
Responsable de:  
* cache;  
* sesiones;  
* rate limiting;  
* colas ligeras;  
* locks distribuidos.  
Nunca será la fuente oficial de datos.  
   
⸻  
   
**MinIO**  
Responsable del almacenamiento de:  
* PDFs;  
* contratos;  
* fotografías;  
* evidencias;  
* documentos fiscales;  
* grabaciones;  
* archivos cargados por usuarios.  
   
⸻  
   
**AI Gateway**  
Responsable de:  
* routing;  
* selección de modelos;  
* autenticación interna;  
* políticas;  
* acceso a herramientas;  
* control de costos.  
   
⸻  
   
**Worker Service**  
Responsable de tareas asincrónicas.  
Ejemplos:  
* generación de PDFs;  
* envío de emails;  
* sincronización;  
* reportes;  
* procesamiento documental.  
   
⸻  
   
**Scheduler**  
Responsable de:  
* tareas programadas;  
* renovaciones;  
* recordatorios;  
* backups;  
* limpieza;  
* sincronización.  
   
⸻  
   
**Browser Worker**  
Responsable exclusivamente de automatizaciones web autorizadas.  
Nunca deberá compartir sesión con otros servicios.  
   
⸻  
   
**Ollama**  
Responsable de ejecutar modelos locales cuando estén disponibles.  
Nunca será obligatorio para que la plataforma funcione.  
   
⸻  
   
**16. Docker Compose**  
Durante desarrollo se utilizará Docker Compose.  
El archivo deberá iniciar automáticamente toda la infraestructura.  
Ejemplo conceptual:  
```
docker compose up

```
deberá levantar:  
* Frontend  
* Backend  
* PostgreSQL  
* Redis  
* MinIO  
* AI Gateway  
* Worker  
* Scheduler  
* Nginx  
* Ollama (opcional)  
sin pasos adicionales.  
   
⸻  
   
**17. Redes Docker**  
Los contenedores nunca deberán comunicarse mediante direcciones IP fijas.  
Toda comunicación deberá realizarse mediante nombres de servicio.  
Ejemplo:  
Backend  
↓  
postgres  
↓  
redis  
↓  
minio  
↓  
worker  
↓  
scheduler  
No deberán utilizarse direcciones IP codificadas.  
   
⸻  
   
**18. Segmentación de Redes**  
Se recomienda dividir la infraestructura en múltiples redes internas.  
**Public Network**  
Componentes expuestos:  
* Nginx  
* Frontend  
   
⸻  
   
**Application Network**  
Componentes:  
* Backend  
* Workers  
* AI Gateway  
   
⸻  
   
**Data Network**  
Componentes:  
* PostgreSQL  
* Redis  
* MinIO  
Esta red nunca deberá estar expuesta al exterior.  
   
⸻  
   
**AI Network**  
Componentes:  
* Ollama  
* GPU Node Connector  
* Embeddings  
* Browser Worker  
   
⸻  
   
**19. Reverse Proxy**  
Toda solicitud deberá ingresar inicialmente por Nginx.  
Nunca deberán exponerse directamente:  
* Backend  
* PostgreSQL  
* Redis  
* MinIO  
Nginx será responsable de:  
* HTTPS;  
* compresión;  
* redirecciones;  
* seguridad;  
* balanceo;  
* cabeceras;  
* caché estático.  
   
⸻  
   
**20. Balanceador**  
Aunque inicialmente exista un solo backend, la arquitectura deberá permitir múltiples instancias.  
Ejemplo:  
```
Internet

↓

Nginx

↓

Backend 1

Backend 2

Backend 3

```
Sin modificar el frontend.  
   
⸻  
   
**21. Persistencia**  
Los siguientes datos deberán sobrevivir a la destrucción del contenedor.  
Base de datos.  
Documentos.  
Logs.  
Embeddings.  
Configuraciones.  
Nunca deberán almacenarse únicamente dentro del contenedor.  
   
⸻  
   
**22. Volúmenes**  
Cada servicio deberá utilizar volúmenes persistentes cuando corresponda.  
Ejemplos:  
PostgreSQL  
MinIO  
Prometheus  
Grafana  
Logs  
Modelos IA  
Backups  
   
⸻  
   
**23. Variables de Entorno**  
Toda configuración deberá almacenarse mediante variables de entorno.  
Nunca deberán existir:  
* contraseñas;  
* API Keys;  
* Tokens;  
* secretos;  
codificados dentro del repositorio.  
   
⸻  
   
**24. Configuración**  
La configuración deberá dividirse por ambiente.  
Development  
Testing  
QA  
Staging  
Production  
Cada ambiente tendrá:  
* credenciales;  
* dominios;  
* certificados;  
* secretos;  
* APIs;  
* configuración de IA;  
* Stripe;  
* Twilio;  
* OAuth.  
   
⸻  
   
**25. Imágenes Docker**  
Cada servicio deberá generar una imagen independiente.  
Las imágenes deberán ser:  
* pequeñas;  
* reproducibles;  
* versionadas;  
* fáciles de actualizar.  
   
⸻  
   
**26. Multi-stage Build**  
Siempre que sea posible se utilizarán compilaciones multi-stage.  
Objetivos:  
Reducir tamaño.  
Reducir superficie de ataque.  
Acelerar despliegues.  
   
⸻  
   
**27. Health Checks**  
Cada contenedor deberá exponer un endpoint de salud.  
Ejemplos:  
```
/health

/ready

/live

```
El sistema deberá poder determinar automáticamente si un servicio está disponible.  
   
⸻  
   
**28. Reinicio Automático**  
Los servicios críticos deberán reiniciarse automáticamente cuando fallen.  
Ejemplos:  
Backend.  
Workers.  
Scheduler.  
AI Gateway.  
Nunca deberá requerirse intervención manual para errores temporales.  
   
⸻  
   
**29. Dependencias**  
Los servicios no deberán asumir que otros servicios ya están disponibles.  
Cada servicio deberá:  
esperar;  
reintentar;  
registrar el error;  
continuar cuando el servicio aparezca.  
   
⸻  
   
**30. Comunicación entre Servicios**  
Siempre que sea posible deberá realizarse mediante:  
REST APIs.  
Eventos.  
Colas.  
Nunca mediante acceso directo a bases de datos ajenas.  
   
⸻  
   
**31. Service Discovery**  
Los servicios deberán localizarse automáticamente utilizando el nombre del contenedor.  
No deberán configurarse IPs manualmente.  
   
⸻  
   
**32. Logs**  
Todos los contenedores deberán enviar logs estructurados.  
Nunca deberán escribirse únicamente dentro del contenedor.  
   
⸻  
   
**33. Timezone**  
Todos los contenedores deberán utilizar UTC internamente.  
Las conversiones horarias deberán realizarse únicamente en la capa de presentación.  
   
⸻  
   
**34. Codificación**  
Todos los servicios utilizarán UTF-8.  
   
⸻  
   
**35. Recursos**  
Cada contenedor deberá definir límites de:  
CPU.  
RAM.  
Espacio.  
Conexiones.  
Threads.  
Con el objetivo de evitar que un servicio monopolice el servidor.  
   
⸻  
   
**36. Preparación para Kubernetes**  
Aunque el MVP utilizará Docker Compose, toda la arquitectura deberá diseñarse para migrar fácilmente a Kubernetes.  
No deberán utilizarse soluciones incompatibles con una futura orquestación.  
   
⸻  
   
**37. Escalabilidad Horizontal**  
Los siguientes servicios deberán poder replicarse fácilmente:  
Backend.  
Workers.  
AI Gateway.  
Frontend.  
Browser Workers.  
No deberán mantener estado local.  
   
⸻  
   
**38. Estado Compartido**  
Todo estado deberá almacenarse en:  
PostgreSQL.  
Redis.  
Storage.  
Nunca dentro del contenedor.  
   
⸻  
   
**39. Inicio del Sistema**  
El orden recomendado será:  
```
PostgreSQL

↓

Redis

↓

MinIO

↓

Backend

↓

Workers

↓

Scheduler

↓

AI Gateway

↓

Frontend

↓

Nginx

```
Los servicios deberán verificar dependencias antes de iniciar.  
   
⸻  
   
**40. Instrucciones para Codex**  
Antes de implementar cualquier contenedor deberá verificar:  
1. Que no exista ya un servicio equivalente.  
2. Que cada servicio tenga una única responsabilidad.  
3. Que las redes estén correctamente segmentadas.  
4. Que los secretos nunca se almacenen en el repositorio.  
5. Que todos los servicios utilicen variables de entorno.  
6. Que existan volúmenes persistentes para los datos importantes.  
7. Que todos los contenedores implementen Health Checks.  
8. Que el Backend nunca dependa de rutas locales del sistema operativo.  
9. Que la aplicación pueda levantarse completamente mediante Docker Compose.  
10. Que la arquitectura sea compatible con una futura migración a Kubernetes sin requerir una reescritura completa.  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 3 — CI/CD, Control de Versiones, GitHub Actions y Estrategia de Despliegue  
**Versión:** 1.0.0  
**Estado:** Especificación Inicial  
**Proyecto:** SG Solutions Platform  
**Audiencia:** Codex, DevOps Engineers, Backend Developers, Frontend Developers, AI Engineers y Administradores del Sistema.  
   
⸻  
   
## 41. Objetivo  
Este módulo define el ciclo completo de vida del código fuente.  
Desde que un desarrollador escribe una línea de código hasta que esa funcionalidad queda disponible para un cliente en producción.  
El proceso deberá ser:  
* automatizado;  
* seguro;  
* reproducible;  
* auditable;  
* reversible.  
Nunca deberá depender de procesos manuales improvisados.  
   
⸻  
   
## 42. Filosofía CI/CD  
Toda modificación deberá seguir el siguiente flujo:  
```
Developer
        │
        ▼
Git Commit
        │
        ▼
Push Repository
        │
        ▼
Pull Request
        │
        ▼
Automatic Validation
        │
        ▼
Automated Tests
        │
        ▼
Code Review
        │
        ▼
Security Scan
        │
        ▼
Artifact Build
        │
        ▼
Deploy to Staging
        │
        ▼
Acceptance Tests
        │
        ▼
Approval
        │
        ▼
Production Deployment
        │
        ▼
Monitoring
        │
        ▼
Rollback if necessary

```
   
⸻  
   
## 43. Repositorio Oficial  
Todo el código deberá almacenarse en Git.  
GitHub será el repositorio principal.  
No deberá existir código fuera del repositorio oficial.  
   
⸻  
   
## 44. Reglas del Repositorio  
El repositorio será la única fuente de verdad.  
Nunca deberán realizarse cambios directamente sobre producción.  
Todo cambio deberá existir previamente en Git.  
   
⸻  
   
## 45. Organización del Repositorio  
La estructura deberá mantenerse organizada.  
Ejemplo conceptual:  
```
/apps
/frontend

/backend

/ai

/workers

/browser-worker

/packages

/shared

/docs

/infrastructure

/docker

/scripts

/tests

/tools

```
La estructura podrá evolucionar, pero deberá permanecer consistente.  
   
⸻  
   
## 46. Estrategia Git  
Se utilizará Git Flow simplificado.  
Ramas principales:  
```
main

develop

feature/*

hotfix/*

release/*

```
   
⸻  
   
## 47. Rama Main  
Representará producción.  
Nunca deberán desarrollarse funcionalidades directamente sobre esta rama.  
   
⸻  
   
## 48. Rama Develop  
Será la rama principal de integración.  
Las nuevas funcionalidades llegarán primero aquí.  
   
⸻  
   
## 49. Feature Branches  
Cada funcionalidad importante deberá desarrollarse en una rama independiente.  
Ejemplos:  
```
feature/authentication

feature/credit-module

feature/home-buying

feature/tax-center

feature/marketplace

feature/voice-agent

feature/browser-worker

```
   
⸻  
   
## 50. Hotfix  
Las correcciones críticas utilizarán:  
```
hotfix/login-error

hotfix/payment-timeout

hotfix/security-patch

```
Una vez solucionado el problema:  
Deberán fusionarse nuevamente con:  
main  
y  
develop.  
   
⸻  
   
## 51. Release Branch  
Antes de publicar una nueva versión:  
Se creará una Release Branch.  
Allí únicamente podrán realizarse:  
* correcciones;  
* documentación;  
* pruebas finales.  
No podrán añadirse nuevas funcionalidades.  
   
⸻  
   
## 52. Pull Requests  
Todo cambio requerirá Pull Request.  
Nunca deberá hacerse Merge directo sobre:  
main  
ni  
develop.  
   
⸻  
   
## 53. Información mínima del Pull Request  
Todo Pull Request deberá incluir:  
Descripción.  
Objetivo.  
Problema que resuelve.  
Módulos afectados.  
Capturas (cuando aplique).  
Checklist.  
Pruebas realizadas.  
   
⸻  
   
## 54. Code Review  
Todo Pull Request deberá revisarse antes del Merge.  
La revisión deberá verificar:  
* arquitectura;  
* seguridad;  
* mantenibilidad;  
* estilo;  
* rendimiento;  
* documentación;  
* pruebas.  
   
⸻  
   
## 55. Convención de Commits  
Los commits deberán seguir una convención uniforme.  
Ejemplos:  
```
feat:

fix:

refactor:

docs:

test:

perf:

style:

build:

ci:

security:

```
Esto facilitará generar automáticamente el historial de versiones.  
   
⸻  
   
## 56. Semantic Versioning  
Toda versión utilizará Semantic Versioning.  
Ejemplos:  
```
1.0.0

1.0.1

1.1.0

2.0.0

```
Reglas:  
PATCH  
Correcciones.  
MINOR  
Nuevas funcionalidades compatibles.  
MAJOR  
Cambios incompatibles.  
   
⸻  
   
## 57. GitHub Actions  
GitHub Actions será el sistema principal de automatización.  
Responsabilidades:  
* compilación;  
* pruebas;  
* análisis;  
* despliegues;  
* generación de artefactos.  
   
⸻  
   
## 58. Pipeline Principal  
Cada Push ejecutará automáticamente:  
```
Checkout

↓

Restore Dependencies

↓

Compile

↓

Static Analysis

↓

Security Scan

↓

Unit Tests

↓

Integration Tests

↓

Build Docker Images

↓

Artifact Generation

↓

Deploy Staging

```
   
⸻  
   
## 59. Pipeline de Producción  
Producción nunca deberá desplegarse automáticamente desde una Feature Branch.  
Siempre deberá existir aprobación previa.  
   
⸻  
   
## 60. Artefactos  
Los binarios generados deberán almacenarse como artefactos versionados.  
Nunca deberán recompilarse directamente en producción.  
   
⸻  
   
## 61. Build Reproducible  
Una misma versión deberá generar exactamente el mismo resultado.  
No deberán existir dependencias ocultas.  
   
⸻  
   
## 62. Variables Secretas  
GitHub Actions utilizará:  
Secrets.  
Variables protegidas.  
Tokens temporales.  
Nunca deberá almacenarse información sensible dentro del Workflow.  
   
⸻  
   
## 63. Quality Gates  
El Merge deberá bloquearse cuando falle cualquiera de los siguientes elementos:  
Compilación.  
Tests.  
Cobertura mínima.  
Escaneo de seguridad.  
Linting.  
Análisis estático.  
   
⸻  
   
## 64. Static Code Analysis  
Antes del despliegue deberá ejecutarse análisis estático.  
Objetivos:  
Errores.  
Duplicación.  
Complejidad.  
Código muerto.  
Malas prácticas.  
   
⸻  
   
## 65. Linting  
Todo el código deberá cumplir reglas de estilo.  
El Pipeline bloqueará código que incumpla dichas reglas.  
   
⸻  
   
## 66. Unit Tests  
Cada módulo crítico deberá contar con pruebas unitarias.  
Ejemplos:  
Authentication.  
Billing.  
Taxes.  
Credit.  
Marketplace.  
AI Hub.  
Workflows.  
   
⸻  
   
## 67. Integration Tests  
También deberán existir pruebas entre módulos.  
Ejemplos:  
Stripe.  
Twilio.  
IdentityIQ.  
TradelineSupply.  
CreditCardBroker.  
Tax APIs.  
Google OAuth.  
   
⸻  
   
## 68. End-to-End Tests  
Los procesos más importantes deberán probarse automáticamente.  
Ejemplos:  
Registro.  
Login.  
Pago.  
Creación de LLC.  
Solicitud de Tax Service.  
Portal del Cliente.  
Marketplace.  
   
⸻  
   
## 69. Cobertura  
La cobertura mínima deberá definirse por módulo.  
Los módulos críticos deberán mantener una cobertura significativamente superior al resto del sistema.  
   
⸻  
   
## 70. Escaneo de Seguridad  
Antes de desplegar:  
El Pipeline deberá buscar:  
Dependencias vulnerables.  
Secrets filtrados.  
Librerías inseguras.  
Configuraciones peligrosas.  
   
⸻  
   
## 71. Escaneo de Contenedores  
Las imágenes Docker deberán analizarse automáticamente.  
No deberán desplegarse imágenes con vulnerabilidades críticas conocidas.  
   
⸻  
   
## 72. Build Docker  
Cada despliegue generará nuevas imágenes Docker versionadas.  
Nunca deberán reutilizarse imágenes ambiguas.  
   
⸻  
   
## 73. Registro de Imágenes  
Las imágenes deberán almacenarse en un Container Registry.  
Cada imagen tendrá:  
Versión.  
Fecha.  
Hash.  
Commit asociado.  
   
⸻  
   
## 74. Estrategia de Despliegue  
El sistema utilizará Blue/Green Deployment.  
Conceptualmente:  
```
Blue Environment

↓

Clientes Actuales

Green Environment

↓

Nueva Versión

```
Una vez validada:  
El tráfico cambiará al entorno Green.  
   
⸻  
   
## 75. Rollback  
Si se detecta un error:  
La plataforma deberá volver automáticamente a la versión anterior.  
El tiempo objetivo de recuperación deberá ser mínimo.  
   
⸻  
   
## 76. Migraciones  
Las migraciones de Base de Datos deberán:  
Ser versionadas.  
Ser reversibles cuando sea posible.  
Nunca ejecutarse manualmente.  
   
⸻  
   
## 77. Migraciones Compatibles  
Las migraciones deberán diseñarse evitando romper versiones anteriores.  
   
⸻  
   
## 78. Deploy Incremental  
Siempre que sea posible:  
Los despliegues deberán afectar únicamente los servicios modificados.  
No toda la infraestructura.  
   
⸻  
   
## 79. Feature Flags  
Las nuevas funcionalidades podrán publicarse ocultas.  
Esto permitirá:  
Activarlas.  
Desactivarlas.  
Realizar pruebas.  
Sin necesidad de nuevos despliegues.  
   
⸻  
   
## 80. Canary Releases (Futuro)  
La arquitectura deberá permitir publicar nuevas versiones únicamente para un pequeño porcentaje de usuarios.  
No será obligatorio para el MVP.  
   
⸻  
   
## 81. Auditoría del Pipeline  
Cada ejecución deberá registrar:  
Versión.  
Autor.  
Commit.  
Fecha.  
Resultado.  
Duración.  
Errores.  
   
⸻  
   
## 82. Notificaciones  
Cuando un Pipeline falle:  
Se notificará automáticamente al equipo correspondiente.  
No deberá descubrirse un error únicamente después del despliegue.  
   
⸻  
   
## 83. Entornos Aislados  
Los despliegues de Development nunca deberán afectar Staging.  
Staging nunca deberá afectar Producción.  
   
⸻  
   
## 84. Política de Producción  
Ningún desarrollador deberá modificar archivos directamente en producción.  
Toda modificación deberá pasar por el Pipeline oficial.  
   
⸻  
   
## 85. Recuperación  
Si un despliegue falla:  
El sistema deberá:  
Detener la publicación.  
Mantener la versión anterior.  
Registrar el error.  
Notificar.  
Generar evidencia.  
   
⸻  
   
## 86. Checklist previo al Deploy  
Antes de publicar una nueva versión deberá verificarse:  
* Compilación correcta.  
* Tests exitosos.  
* Cobertura suficiente.  
* Seguridad aprobada.  
* Docker generado.  
* Migraciones revisadas.  
* Feature Flags configuradas.  
* Variables de entorno correctas.  
* Backups disponibles.  
* Plan de rollback preparado.  
   
⸻  
   
## 87. Checklist posterior al Deploy  
Después del despliegue:  
Verificar:  
Health Checks.  
Logs.  
Errores.  
Tiempo de respuesta.  
Pagos.  
Autenticación.  
AI Hub.  
Marketplace.  
Portal del Cliente.  
Integraciones.  
   
⸻  
   
## 88. Documentación  
Cada versión deberá incluir:  
Cambios.  
Problemas corregidos.  
Migraciones.  
Nuevas APIs.  
Breaking Changes.  
Fecha de publicación.  
   
⸻  
   
## 89. Instrucciones para Codex  
Antes de implementar el sistema CI/CD deberá:  
1. Diseñar pipelines reutilizables.  
2. Evitar duplicación de Workflows.  
3. Automatizar compilaciones.  
4. Automatizar pruebas.  
5. Automatizar análisis estático.  
6. Automatizar escaneo de seguridad.  
7. Automatizar despliegues.  
8. Automatizar rollback cuando sea posible.  
9. Mantener el repositorio como única fuente de verdad.  
10. Nunca permitir despliegues manuales directamente sobre producción.  
11. Garantizar que cada versión pueda reconstruirse utilizando únicamente el repositorio y los archivos de configuración.  
12. Diseñar el Pipeline pensando en una plataforma empresarial con crecimiento continuo durante muchos años.  
  
  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 4 — Seguridad de Infraestructura, Zero Trust, Secretos, Hardening y Protección Operativa  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 3 **Secciones incluidas:** 90–165 **Audiencia:** Codex, desarrolladores, DevOps, administradores, especialistas de seguridad, responsables de cumplimiento y owner **Idioma del código:** Inglés **Modelo de seguridad:** Defense in Depth, Zero Trust y mínimo privilegio  
   
⸻  
   
## 90. Objetivo  
Esta parte define los controles técnicos y operativos que deberán proteger la infraestructura de SG Solutions.  
La plataforma manejará información potencialmente sensible relacionada con:  
* identidad;  
* impuestos;  
* crédito;  
* empresas;  
* ingresos;  
* documentos;  
* pagos;  
* comunicaciones;  
* solicitudes de vivienda;  
* solicitudes de financiamiento;  
* credenciales de integraciones;  
* ejecuciones de agentes de IA.  
Por tanto, la seguridad deberá formar parte de la arquitectura y no añadirse como una corrección posterior.  
El sistema deberá proteger:  
1. Usuarios.  
2. Clientes.  
3. Empleados.  
4. Administradores.  
5. Servidores.  
6. Contenedores.  
7. Redes.  
8. Bases de datos.  
9. Archivos.  
10. Integraciones.  
11. Modelos de IA.  
12. Workers.  
13. Backups.  
14. Secrets.  
15. Pipelines.  
16. Logs.  
17. Dispositivos administrativos.  
18. Credenciales de terceros.  
19. Tráfico interno.  
20. Tráfico externo.  
   
⸻  
   
## 91. Principio de defensa en profundidad  
Ningún control de seguridad deberá considerarse suficiente por sí solo.  
La seguridad deberá aplicarse mediante múltiples capas:  
```
Usuario
↓
Autenticación
↓
Autorización
↓
Aplicación
↓
API Gateway o Reverse Proxy
↓
Firewall
↓
Red segmentada
↓
Contenedor
↓
Sistema operativo
↓
Base de datos o almacenamiento
↓
Cifrado
↓
Auditoría
↓
Monitoreo y respuesta

```
Si una capa falla, las demás deberán reducir el impacto.  
   
⸻  
   
## 92. Principio Zero Trust  
La plataforma deberá adoptar el principio:  
Nunca confiar automáticamente y verificar cada solicitud.  
No se confiará en una conexión únicamente porque provenga de:  
* la red local;  
* un contenedor interno;  
* un empleado;  
* un servicio conocido;  
* la computadora gamer;  
* una VPN;  
* una IP previamente utilizada;  
* un agente de IA;  
* un worker;  
* un webhook.  
Cada acceso deberá verificar:  
* identidad;  
* permiso;  
* recurso;  
* propósito;  
* contexto;  
* dispositivo cuando aplique;  
* riesgo;  
* vigencia de la sesión.  
   
⸻  
   
## 93. Mínimo privilegio  
Cada usuario, servicio, worker y agente deberá disponer únicamente de los permisos necesarios para su función.  
Ejemplos:  
```
Notification Worker
Puede:
- leer trabajos de notificación;
- enviar mensajes;
- registrar resultados.

No puede:
- leer reportes de crédito;
- cambiar pagos;
- administrar usuarios.
Browser Worker
Puede:
- ejecutar una acción autorizada;
- acceder al dominio aprobado;
- guardar evidencia.

No puede:
- consultar toda la base de datos;
- modificar roles;
- navegar libremente.

```
   
⸻  
   
## 94. Denegación por defecto  
Toda acción deberá estar denegada salvo autorización explícita.  
Esto aplicará a:  
* endpoints;  
* herramientas de IA;  
* buckets;  
* documentos;  
* bases de datos;  
* redes;  
* secretos;  
* colas;  
* paneles;  
* operaciones administrativas;  
* proveedores externos.  
Las fallas del servicio de autorización deberán producir:  
```
fail closed

```
No acceso permisivo.  
   
⸻  
   
## 95. Clasificación de ambientes  
Los ambientes deberán mantenerse completamente separados:  
```
development
testing
qa
staging
production
sandbox

```
Cada ambiente tendrá:  
* cuentas de servicio propias;  
* secretos propios;  
* bases de datos propias;  
* storage propio;  
* certificados propios;  
* webhooks propios;  
* dominios propios;  
* credenciales de partners propias;  
* configuraciones de IA propias.  
Nunca deberán compartirse credenciales de producción con desarrollo.  
   
⸻  
   
## 96. Clasificación de datos  
La infraestructura deberá reconocer las siguientes categorías:  
```
public
internal
personal
confidential
financial
credit
tax
identity
legal
restricted
secret

```
La clasificación deberá afectar:  
* almacenamiento;  
* cifrado;  
* acceso;  
* logging;  
* backup;  
* retención;  
* exportación;  
* proveedores de IA;  
* procesamiento cloud;  
* monitoreo.  
   
⸻  
   
## 97. Datos restringidos  
Podrán incluir:  
* SSN;  
* ITIN;  
* EIN completo;  
* credenciales;  
* números de cuenta;  
* reportes de crédito;  
* declaraciones tributarias;  
* documentos de identidad;  
* firmas;  
* tokens;  
* API keys;  
* secretos de cifrado;  
* datos financieros detallados.  
Estos datos deberán tener controles reforzados.  
   
⸻  
   
## 98. Gestión de identidades  
Toda identidad técnica o humana deberá ser única.  
Tipos:  
```
customer_user
staff_user
owner_user
administrator
service_account
worker_identity
agent_identity
integration_identity
deployment_identity
emergency_identity

```
No deberán compartirse cuentas administrativas.  
   
⸻  
   
## 99. Autenticación administrativa  
Los usuarios con acceso administrativo deberán utilizar:  
* contraseña robusta;  
* MFA;  
* sesiones seguras;  
* reautenticación para operaciones críticas;  
* bloqueo por intentos anómalos;  
* notificación de accesos sospechosos.  
Las cuentas de owner y administradores no deberán depender únicamente de SMS cuando exista una alternativa más segura.  
   
⸻  
   
## 100. Autenticación del cliente  
El cliente podrá autenticarse mediante:  
* email y contraseña;  
* Google OAuth;  
* enlaces seguros para acciones limitadas;  
* MFA opcional o requerido según riesgo;  
* métodos futuros aprobados.  
El acceso mediante Google no deberá eliminar la necesidad de:  
* autorización;  
* revisión de sesión;  
* protección del dispositivo;  
* verificación adicional para acciones sensibles.  
   
⸻  
   
## 101. MFA  
MFA deberá ser obligatorio para:  
* owner;  
* administradores;  
* personal con acceso a información restringida;  
* acceso a producción;  
* gestión de secretos;  
* despliegues;  
* refunds;  
* filings;  
* tax submissions;  
* exportaciones sensibles;  
* cambios de seguridad;  
* break-glass access.  
Métodos preferidos:  
* aplicación autenticadora;  
* passkeys;  
* security keys;  
* métodos resistentes al phishing cuando estén disponibles.  
   
⸻  
   
## 102. Reautenticación  
Aunque la sesión esté activa, deberá solicitarse reautenticación antes de:  
* mostrar SSN completo;  
* mostrar EIN completo;  
* exportar información;  
* aprobar una acción crítica;  
* cambiar permisos;  
* cambiar correo principal;  
* desactivar MFA;  
* modificar secretos;  
* ejecutar un refund;  
* activar browser automation;  
* utilizar break-glass access.  
   
⸻  
   
## 103. Gestión de sesiones  
Las sesiones deberán incluir:  
* identificador seguro;  
* expiración;  
* rotación;  
* revocación;  
* device metadata;  
* última actividad;  
* autenticación utilizada;  
* nivel de seguridad;  
* IP aproximada;  
* risk signals.  
Las sesiones no deberán ser válidas indefinidamente.  
   
⸻  
   
## 104. Cookies  
Las cookies de autenticación deberán utilizar:  
```
HttpOnly
Secure
SameSite

```
No deberán contener:  
* datos personales;  
* permisos completos;  
* secretos;  
* tokens de terceros;  
* información financiera.  
   
⸻  
   
## 105. Protección CSRF  
Toda operación que modifique datos deberá aplicar protección contra CSRF cuando utilice autenticación basada en cookies.  
No deberán aceptarse acciones sensibles mediante solicitudes GET.  
   
⸻  
   
## 106. Autorización  
La autorización deberá combinar:  
```
Role-Based Access Control
+
Resource-Level Authorization
+
Purpose-Based Access
+
Field-Level Authorization
+
Contextual Restrictions

```
Un permiso global no deberá otorgar acceso automático a todos los clientes.  
   
⸻  
   
## 107. Protección contra IDOR  
Todos los endpoints deberán verificar acceso al recurso solicitado.  
No será suficiente:  
* ocultar botones;  
* usar UUID;  
* no mostrar el ID;  
* verificar autenticación.  
El backend deberá comprobar que el usuario puede acceder al cliente, documento, pago, tarea, expediente u organización solicitada.  
   
⸻  
   
## 108. Cuentas de servicio  
Cada componente deberá utilizar una cuenta de servicio independiente.  
Ejemplos:  
```
backend-api
notification-worker
document-worker
scheduler
ai-gateway
browser-worker
backup-service
deployment-service
monitoring-service

```
No utilizar una única cuenta con acceso total.  
   
⸻  
   
## 109. Credenciales de cuentas de servicio  
Las credenciales deberán:  
* tener expiración cuando sea posible;  
* rotarse;  
* estar limitadas por entorno;  
* tener scopes mínimos;  
* almacenarse en Secret Manager;  
* registrar su uso;  
* poder revocarse rápidamente.  
   
⸻  
   
## 110. Gestión de secretos  
Los secretos deberán almacenarse en una solución especializada.  
Podrán utilizarse según la infraestructura elegida:  
* HashiCorp Vault;  
* secret manager del proveedor cloud;  
* Docker Secrets;  
* Kubernetes Secrets protegidos mediante cifrado;  
* solución equivalente aprobada.  
No deberán almacenarse secretos en:  
* repositorio;  
* archivos Markdown;  
* imágenes Docker;  
* variables públicas;  
* logs;  
* prompts;  
* tickets;  
* capturas;  
* frontend;  
* localStorage.  
   
⸻  
   
## 111. Tipos de secretos  
El Secret Manager deberá gestionar:  
* claves de Stripe;  
* claves de Twilio;  
* credenciales de Google;  
* Meta tokens;  
* WhatsApp tokens;  
* partner API keys;  
* Tax API credentials;  
* encryption keys;  
* database passwords;  
* MinIO credentials;  
* signing keys;  
* webhook secrets;  
* AI provider keys;  
* deployment tokens;  
* backup credentials.  
   
⸻  
   
## 112. Rotación de secretos  
Cada secreto deberá tener:  
* owner;  
* fecha de creación;  
* fecha de última rotación;  
* próxima rotación;  
* ambientes permitidos;  
* servicios autorizados;  
* procedimiento de emergencia.  
La rotación deberá automatizarse cuando sea viable.  
   
⸻  
   
## 113. Revocación de secretos  
Si un secreto pudiera haberse expuesto:  
```
Detectar
→ Revocar
→ Generar secreto nuevo
→ Actualizar servicios
→ Reiniciar de forma controlada
→ Revisar logs
→ Identificar alcance
→ Crear incidente

```
No esperar a confirmar abuso antes de revocar un secreto crítico.  
   
⸻  
   
## 114. Variables de entorno  
Las variables de entorno podrán utilizarse para configuración no secreta y referencias a secretos.  
No deberán incluirse secretos directamente en archivos versionados como:  
```
.env.production

```
Los archivos de ejemplo deberán contener únicamente nombres y valores ficticios.  
   
⸻  
   
## 115. Cifrado en tránsito  
Todo tráfico externo deberá utilizar HTTPS.  
La comunicación interna sensible deberá utilizar:  
* TLS;  
* mTLS cuando sea apropiado;  
* conexiones cifradas;  
* certificados internos;  
* túneles seguros.  
No se permitirá tráfico de credenciales mediante HTTP sin cifrado.  
   
⸻  
   
## 116. TLS  
La plataforma deberá:  
* utilizar versiones modernas de TLS;  
* deshabilitar protocolos obsoletos;  
* utilizar certificados válidos;  
* renovar certificados automáticamente;  
* redirigir HTTP a HTTPS;  
* configurar HSTS cuando sea apropiado;  
* supervisar expiraciones.  
   
⸻  
   
## 117. Certificados  
Los certificados deberán gestionarse mediante:  
* proveedor cloud;  
* ACME;  
* Let’s Encrypt;  
* PKI interna;  
* otra autoridad aprobada.  
La renovación no deberá depender de una acción manual repetitiva.  
   
⸻  
   
## 118. mTLS interno  
Podrá utilizarse mTLS para conexiones de alto riesgo como:  
* nodo GPU remoto;  
* browser worker;  
* servicio de backup;  
* despliegue;  
* administración remota;  
* integraciones internas entre redes.  
El uso de mTLS deberá quedar preparado, aunque no sea obligatorio para todo el MVP.  
   
⸻  
   
## 119. Cifrado en reposo  
Deberán cifrarse:  
* discos;  
* bases de datos;  
* object storage;  
* backups;  
* snapshots;  
* dispositivos administrativos;  
* archivos temporales sensibles;  
* volúmenes del nodo GPU cuando almacenen datos.  
   
⸻  
   
## 120. Cifrado a nivel de aplicación  
Algunos campos deberán cifrarse antes de almacenarse en PostgreSQL.  
Ejemplos:  
* SSN;  
* ITIN;  
* EIN;  
* account identifiers;  
* restricted notes;  
* credential references;  
* recovery data.  
El cifrado de disco por sí solo no será suficiente para estos campos.  
   
⸻  
   
## 121. Gestión de claves  
Las claves de cifrado deberán:  
* mantenerse fuera de la base de datos;  
* rotarse;  
* tener versiones;  
* permitir decrypt controlado;  
* registrar acceso;  
* limitarse por servicio;  
* protegerse mediante KMS o Vault.  
No deberá existir una clave maestra expuesta en el código.  
   
⸻  
   
## 122. Tokenización  
Cuando no sea necesario almacenar un valor completo, se utilizará:  
* tokenización;  
* hashing;  
* enmascaramiento;  
* referencias externas.  
Ejemplo:  
```
Stored display value:
***-**-6789

```
El valor completo solo deberá recuperarse mediante un flujo autorizado.  
   
⸻  
   
## 123. Hashing de contraseñas  
Las contraseñas deberán almacenarse mediante algoritmos diseñados para password hashing.  
La configuración deberá permitir aumentar el costo computacional con el tiempo.  
No utilizar:  
* MD5;  
* SHA-1;  
* SHA-256 simple;  
* cifrado reversible de contraseñas.  
   
⸻  
   
## 124. Firewall  
Los servidores deberán aplicar reglas de firewall restrictivas.  
Solo se expondrán los puertos estrictamente necesarios.  
Ejemplo inicial:  
```
80   → redirect a HTTPS
443  → aplicación pública
22   → restringido o eliminado

```
PostgreSQL, Redis, MinIO interno, Ollama y workers no deberán exponerse públicamente.  
   
⸻  
   
## 125. Acceso SSH  
El acceso SSH deberá:  
* usar claves;  
* deshabilitar contraseñas cuando sea viable;  
* deshabilitar acceso root directo;  
* limitar IP o VPN;  
* registrar sesiones;  
* aplicar MFA o controles equivalentes cuando sea posible;  
* tener protección contra intentos repetidos.  
Las claves deberán ser individuales.  
   
⸻  
   
## 126. VPN administrativa  
El acceso a servicios internos podrá requerir VPN o red privada.  
Ejemplos:  
* dashboard de infraestructura;  
* PostgreSQL administrativo;  
* MinIO administrativo;  
* Grafana;  
* Prometheus;  
* Vault;  
* panel de workers;  
* nodo GPU;  
* browser worker console.  
Estos paneles no deberán exponerse abiertamente a Internet.  
   
⸻  
   
## 127. Segmentación de red  
Las redes deberán separarse por función.  
Ejemplo:  
```
Public Network
- Reverse proxy
- Frontend

Application Network
- Backend
- AI Gateway
- Workers

Data Network
- PostgreSQL
- Redis
- MinIO

Management Network
- Monitoring
- Vault
- Administration

Restricted Automation Network
- Browser Worker
- GPU Connector

```
   
⸻  
   
## 128. Reglas de comunicación  
Cada red deberá utilizar allowlists.  
Ejemplo:  
```
Frontend
→ puede comunicarse con Backend.

Frontend
→ no puede comunicarse directamente con PostgreSQL.
Browser Worker
→ puede comunicarse con dominios autorizados.

Browser Worker
→ no puede acceder libremente a la red de administración.

```
   
⸻  
   
## 129. Egress control  
También deberá controlarse el tráfico saliente.  
Un contenedor comprometido no deberá poder comunicarse libremente con cualquier destino.  
Aplicar restricciones especialmente a:  
* browser worker;  
* AI agents;  
* document processors;  
* upload scanner;  
* email renderer;  
* conversion workers.  
   
⸻  
   
## 130. Allowlist de dominios externos  
Las integraciones deberán usar listas de dominios autorizados.  
Ejemplos:  
* Stripe;  
* Twilio;  
* Google;  
* Meta;  
* partner APIs;  
* tax provider;  
* official government domains;  
* AI providers autorizados.  
No aceptar destinos arbitrarios enviados por el frontend o por un modelo.  
   
⸻  
   
## 131. Reverse proxy seguro  
Nginx o el reverse proxy seleccionado deberá aplicar:  
* HTTPS;  
* request size limits;  
* timeouts;  
* rate limiting;  
* security headers;  
* routing;  
* compression segura;  
* bloqueo de rutas internas;  
* protección contra métodos no permitidos;  
* ocultación de versiones del servidor.  
   
⸻  
   
## 132. Security headers  
Configurar según la aplicación:  
```
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Frame-Options o frame-ancestors

```
La configuración deberá probarse para evitar romper integraciones legítimas.  
   
⸻  
   
## 133. Content Security Policy  
La CSP deberá:  
* limitar scripts;  
* limitar frames;  
* limitar imágenes;  
* limitar conexiones;  
* evitar inline scripts cuando sea posible;  
* utilizar nonces o hashes cuando sea necesario;  
* autorizar únicamente proveedores conocidos.  
No deberá añadirse:  
```
unsafe-eval

```
sin justificación y revisión.  
   
⸻  
   
## 134. Protección WAF  
Podrá implementarse un Web Application Firewall delante de la aplicación.  
El WAF deberá ayudar a detectar o bloquear:  
* patrones de inyección;  
* bots;  
* escaneo automatizado;  
* rutas maliciosas;  
* payloads anómalos;  
* abuso de APIs;  
* intentos repetidos.  
El WAF no sustituirá validación en la aplicación.  
   
⸻  
   
## 135. Rate limiting  
El sistema deberá aplicar límites por:  
* IP;  
* usuario;  
* sesión;  
* endpoint;  
* cliente;  
* API key;  
* agente;  
* herramienta;  
* integración;  
* canal.  
Endpoints sensibles requerirán límites más estrictos.  
   
⸻  
   
## 136. Protección contra abuso  
Detectar:  
* credential stuffing;  
* brute force;  
* scraping;  
* spam;  
* account enumeration;  
* OTP abuse;  
* webhook flooding;  
* document upload abuse;  
* AI prompt flooding;  
* resource exhaustion;  
* repeated checkout creation.  
   
⸻  
   
## 137. Protección DDoS  
La plataforma deberá poder utilizar:  
* CDN;  
* protección del proveedor;  
* WAF;  
* rate limiting;  
* caching;  
* connection limits;  
* circuit breakers;  
* autoscaling futuro.  
No será necesario construir una solución DDoS propia.  
   
⸻  
   
## 138. Hardening del sistema operativo  
Los servidores deberán:  
* mantener actualizaciones;  
* eliminar paquetes innecesarios;  
* limitar usuarios;  
* cerrar puertos;  
* desactivar servicios innecesarios;  
* aplicar permisos de archivos;  
* configurar auditoría;  
* proteger acceso root;  
* usar discos cifrados;  
* sincronizar tiempo;  
* aplicar políticas de logs.  
   
⸻  
   
## 139. Actualizaciones de seguridad  
Los parches deberán clasificarse:  
```
critical
high
normal
scheduled

```
Las vulnerabilidades críticas podrán requerir un hotfix fuera del ciclo normal.  
Todo parche deberá probarse antes de producción cuando el riesgo lo permita.  
   
⸻  
   
## 140. Hardening de contenedores  
Los contenedores deberán:  
* ejecutarse sin root cuando sea posible;  
* utilizar imágenes mínimas;  
* tener filesystem read-only cuando sea viable;  
* limitar capabilities;  
* definir CPU y memoria;  
* evitar privileged mode;  
* evitar montar Docker socket;  
* utilizar usuarios dedicados;  
* eliminar herramientas innecesarias;  
* tener health checks.  
   
⸻  
   
## 141. Contenedores privilegiados  
No deberán utilizarse contenedores:  
```
privileged: true

```
salvo necesidad excepcional, documentada y aprobada.  
El browser worker no deberá ser privilegiado únicamente por ejecutar un navegador.  
   
⸻  
   
## 142. Docker socket  
Ningún contenedor de aplicación deberá tener acceso directo a:  
```
/var/run/docker.sock

```
Este acceso podría permitir control completo del host.  
Las operaciones de infraestructura deberán usar un servicio separado y limitado.  
   
⸻  
   
## 143. Imágenes confiables  
Las imágenes base deberán provenir de:  
* repositorios oficiales;  
* registros aprobados;  
* versiones fijadas;  
* imágenes verificadas.  
No utilizar imágenes desconocidas únicamente porque sean convenientes.  
   
⸻  
   
## 144. Pinning de imágenes  
No utilizar en producción referencias ambiguas como:  
```
latest

```
Utilizar:  
* versión;  
* digest;  
* hash verificable.  
Ejemplo conceptual:  
```
backend:1.4.2

```
   
⸻  
   
## 145. Escaneo de imágenes  
Antes del deployment deberán revisarse:  
* vulnerabilidades;  
* malware;  
* secrets;  
* paquetes innecesarios;  
* licencias;  
* configuraciones.  
Una vulnerabilidad crítica deberá bloquear el despliegue salvo excepción aprobada.  
   
⸻  
   
## 146. Firma de artefactos  
Las imágenes y artefactos críticos deberán quedar preparados para:  
* firma;  
* verificación;  
* provenance;  
* asociación con commit;  
* asociación con pipeline.  
Producción no deberá ejecutar artefactos no reconocidos.  
   
⸻  
   
## 147. Software Bill of Materials  
El pipeline deberá poder generar un SBOM con:  
* dependencias;  
* versiones;  
* paquetes;  
* imágenes;  
* librerías.  
Esto permitirá identificar rápidamente componentes afectados por una vulnerabilidad.  
   
⸻  
   
## 148. Seguridad de la cadena de suministro  
La plataforma deberá proteger:  
* repositorio;  
* GitHub Actions;  
* dependencias;  
* package managers;  
* container registry;  
* artefactos;  
* scripts;  
* plugins;  
* extensiones;  
* proveedores de modelos.  
No confiar automáticamente en código generado por IA.  
   
⸻  
   
## 149. Dependencias  
Las dependencias deberán:  
* estar versionadas;  
* revisarse;  
* actualizarse;  
* escanearse;  
* minimizarse;  
* eliminarse cuando no se usen.  
Los lockfiles deberán almacenarse en Git.  
   
⸻  
   
## 150. GitHub Actions  
Las acciones externas deberán:  
* fijarse por commit o versión segura;  
* revisarse;  
* tener permisos mínimos;  
* no recibir secretos innecesarios;  
* separar workflows de Pull Request y producción.  
No utilizar acciones desconocidas sin revisión.  
   
⸻  
   
## 151. Permisos del pipeline  
Los pipelines deberán utilizar permisos mínimos.  
Ejemplo:  
Un workflow de pruebas no necesita:  
* desplegar;  
* modificar secrets;  
* publicar en producción;  
* administrar repositorio.  
Los permisos deberán declararse explícitamente.  
   
⸻  
   
## 152. Protección de ramas  
Las ramas principales deberán requerir:  
* Pull Request;  
* pruebas exitosas;  
* revisión;  
* commits verificados cuando sea viable;  
* prohibición de force push;  
* historial protegido;  
* reglas de aprobación.  
   
⸻  
   
## 153. Secret scanning  
El repositorio deberá analizarse para detectar:  
* API keys;  
* private keys;  
* passwords;  
* tokens;  
* database URLs;  
* webhook secrets;  
* certificados;  
* secretos históricos.  
Un secreto encontrado deberá tratarse como comprometido.  
Eliminarlo del commit no será suficiente; también deberá rotarse.  
   
⸻  
   
## 154. SAST  
El pipeline deberá aplicar análisis estático para detectar:  
* inyección;  
* acceso inseguro;  
* validaciones faltantes;  
* uso peligroso de criptografía;  
* deserialización insegura;  
* path traversal;  
* SSRF;  
* errores de autorización;  
* secretos.  
   
⸻  
   
## 155. DAST  
Staging deberá permitir pruebas dinámicas contra la aplicación ejecutándose.  
Las pruebas podrán revisar:  
* headers;  
* sesiones;  
* autenticación;  
* inyección;  
* endpoints;  
* redirects;  
* uploads;  
* configuración;  
* respuestas de error.  
Las pruebas activas no deberán ejecutarse indiscriminadamente contra producción.  
   
⸻  
   
## 156. Protección contra SSRF  
Toda funcionalidad que reciba URLs deberá:  
* validar esquema;  
* validar dominio;  
* bloquear IP privadas cuando corresponda;  
* bloquear metadata services;  
* resolver DNS de forma segura;  
* aplicar allowlist;  
* limitar redirects;  
* limitar tamaño;  
* limitar tiempo.  
Especialmente:  
* browser worker;  
* webhooks;  
* imports;  
* image retrieval;  
* document retrieval;  
* AI browsing;  
* partner redirects.  
   
⸻  
   
## 157. Protección de uploads  
Los archivos deberán pasar por:  
```
Upload
→ Quarantine
→ Type validation
→ Size validation
→ Malware scan
→ Content inspection
→ Safe storage
→ Processing

```
No confiar únicamente en la extensión.  
   
⸻  
   
## 158. Archivos temporales  
Los archivos temporales deberán:  
* almacenarse en una ubicación aislada;  
* cifrarse cuando sea necesario;  
* eliminarse;  
* no compartirse entre clientes;  
* no utilizar nombres proporcionados directamente por el usuario como ruta;  
* tener límites de tamaño.  
   
⸻  
   
## 159. Protección de PostgreSQL  
PostgreSQL deberá:  
* permanecer en red privada;  
* usar credenciales separadas;  
* utilizar TLS cuando corresponda;  
* limitar conexiones;  
* registrar accesos administrativos;  
* cifrar backups;  
* aplicar roles mínimos;  
* prohibir cuentas compartidas;  
* proteger migraciones;  
* revisar consultas lentas.  
La aplicación no deberá conectarse como superusuario.  
   
⸻  
   
## 160. Protección de Redis  
Redis deberá:  
* permanecer en red privada;  
* requerir autenticación;  
* utilizar TLS cuando sea necesario;  
* limitar comandos peligrosos;  
* restringir memoria;  
* aplicar expiración;  
* no almacenar permanentemente datos críticos;  
* no exponerse a Internet.  
   
⸻  
   
## 161. Protección de MinIO u object storage  
El almacenamiento deberá:  
* bloquear acceso público por defecto;  
* usar buckets separados;  
* usar políticas;  
* generar URLs temporales;  
* registrar accesos;  
* cifrar;  
* versionar objetos críticos;  
* impedir enumeración;  
* aplicar retención.  
Los documentos no deberán exponerse mediante URLs permanentes.  
   
⸻  
   
## 162. Protección del nodo GPU  
El nodo gamer deberá:  
* conectarse por canal privado;  
* utilizar identidad propia;  
* tener mTLS o autenticación equivalente;  
* tener firewall;  
* no exponer Ollama públicamente;  
* cifrar discos;  
* limitar directorios;  
* separar modelos y datos;  
* registrar trabajos;  
* permitir revocación;  
* no mantener copias indefinidas de documentos.  
   
⸻  
   
## 163. Seguridad del Browser Worker  
El Browser Worker deberá:  
* ejecutarse en sandbox;  
* utilizar contenedor aislado;  
* usar perfil de navegador temporal;  
* limitar dominios;  
* limitar downloads;  
* limitar uploads;  
* no compartir cookies;  
* destruir sesiones después del trabajo;  
* usar credenciales mediante vault;  
* registrar acciones;  
* capturar evidencia autorizada;  
* requerir Approval para ejecución sensible.  
   
⸻  
   
## 164. Seguridad de IA  
Los modelos y agentes deberán estar protegidos contra:  
* prompt injection;  
* tool escalation;  
* data exfiltration;  
* cross-client leakage;  
* memory poisoning;  
* malicious documents;  
* malicious webpages;  
* hidden instructions;  
* unauthorized model routing;  
* secret extraction.  
La salida del modelo nunca deberá considerarse confiable sin validación.  
   
⸻  
   
## 165. Instrucciones finales para Codex  
Antes de implementar la seguridad de infraestructura:  
1. Lee los módulos 1 al 25.  
2. Lee las partes 1, 2, 3 y 4 del Módulo 26.  
3. Inspecciona la autenticación existente.  
4. Inspecciona la autorización existente.  
5. Inspecciona los secrets actuales.  
6. Inspecciona los puertos expuestos.  
7. Inspecciona las redes Docker.  
8. Inspecciona las cuentas de servicio.  
9. Inspecciona permisos de PostgreSQL.  
10. Inspecciona permisos de Redis.  
11. Inspecciona permisos de MinIO.  
12. Implementa defensa en profundidad.  
13. Implementa denegación por defecto.  
14. Implementa mínimo privilegio.  
15. Implementa separación de ambientes.  
16. Implementa MFA para roles sensibles.  
17. Implementa reautenticación.  
18. Implementa protección IDOR.  
19. Implementa autorización por recurso.  
20. Implementa autorización por propósito.  
21. Implementa acceso por campo.  
22. Crea cuentas de servicio independientes.  
23. No utilices credenciales compartidas.  
24. Implementa Secret Manager.  
25. Retira secretos del repositorio.  
26. Rota cualquier secreto expuesto.  
27. Implementa TLS.  
28. Implementa cifrado en reposo.  
29. Implementa cifrado a nivel de aplicación para campos restringidos.  
30. Implementa gestión de claves.  
31. No expongas PostgreSQL.  
32. No expongas Redis.  
33. No expongas MinIO administrativo.  
34. No expongas Ollama.  
35. Segmenta las redes.  
36. Implementa egress control en servicios de alto riesgo.  
37. Implementa allowlists.  
38. Configura security headers.  
39. Configura CSP.  
40. Implementa rate limiting.  
41. Implementa protección antiabuso.  
42. Implementa hardening del host.  
43. Ejecuta contenedores sin root.  
44. No utilices privileged mode.  
45. No montes Docker socket en contenedores.  
46. Fija las versiones de imágenes.  
47. Escanea imágenes.  
48. Genera SBOM.  
49. Protege la cadena de suministro.  
50. Protege GitHub Actions.  
51. Protege las ramas.  
52. Implementa secret scanning.  
53. Implementa SAST.  
54. Implementa DAST en staging.  
55. Protege contra SSRF.  
56. Protege uploads mediante cuarentena.  
57. Protege archivos temporales.  
58. Configura roles mínimos en PostgreSQL.  
59. Protege Redis.  
60. Protege object storage.  
61. Protege el nodo GPU.  
62. Aísla el Browser Worker.  
63. Mantén credenciales fuera del modelo.  
64. Implementa controles contra prompt injection.  
65. Implementa logs y alertas de seguridad.  
66. Documenta todas las excepciones.  
67. No desactives controles para resolver problemas de desarrollo.  
68. No marques un control como funcional sin probarlo.  
69. No utilices seguridad únicamente en frontend.  
70. Mantén la infraestructura preparada para crecimiento nacional.  
Antes de entregar, verifica:  
* ¿Producción está separada de desarrollo?  
* ¿Todo usuario administrativo utiliza MFA?  
* ¿Las acciones críticas requieren reautenticación?  
* ¿Cada servicio tiene credenciales propias?  
* ¿Los secrets están fuera del repositorio?  
* ¿Los campos restringidos están cifrados?  
* ¿PostgreSQL, Redis y MinIO permanecen privados?  
* ¿Los contenedores se ejecutan sin root?  
* ¿No existe acceso al Docker socket?  
* ¿Las imágenes están fijadas por versión?  
* ¿El pipeline escanea vulnerabilidades y secretos?  
* ¿Las redes limitan comunicación innecesaria?  
* ¿El nodo GPU no está expuesto públicamente?  
* ¿El Browser Worker está aislado?  
* ¿Las credenciales nunca llegan al modelo?  
* ¿Los uploads pasan por cuarentena?  
* ¿Los endpoints comprueban autorización por recurso?  
* ¿Las fallas de autorización producen denegación?  
* ¿Existe un procedimiento de revocación de secretos?  
* ¿Las excepciones quedan documentadas y auditadas?  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 5 — Monitoreo, Observabilidad, Logs, Métricas, Tracing y Alertas  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 4 **Secciones incluidas:** 166–248 **Audiencia:** Codex, desarrolladores, DevOps, administradores, responsables de seguridad, operaciones y owner **Idioma del código:** Inglés **Modelo operativo:** Observabilidad integral, detección temprana y respuesta basada en evidencia  
   
⸻  
   
## 166. Objetivo  
Esta parte define cómo SG Solutions deberá observar, medir, diagnosticar y supervisar todos sus componentes técnicos y operativos.  
El sistema deberá poder responder rápidamente:  
* ¿La plataforma está disponible?  
* ¿Qué servicio está fallando?  
* ¿Cuándo comenzó el problema?  
* ¿Qué clientes fueron afectados?  
* ¿Qué versión estaba desplegada?  
* ¿Qué integración externa falló?  
* ¿Qué request produjo el error?  
* ¿La causa está en frontend, backend, base de datos, worker, IA o proveedor?  
* ¿Existe pérdida de datos?  
* ¿El problema requiere rollback?  
* ¿Se está incumpliendo un SLA?  
* ¿Existe un incidente de seguridad?  
* ¿Cuánto cuesta la operación?  
* ¿Está creciendo la carga?  
* ¿Se necesita más capacidad?  
La observabilidad no deberá limitarse a guardar logs.  
Deberá combinar:  
```
Logs
+
Metrics
+
Distributed Traces
+
Events
+
Health Checks
+
Business Signals
+
Alerts
+
Incident Context

```
   
⸻  
   
## 167. Principio de observabilidad por diseño  
Todos los servicios deberán diseñarse para ser observables desde su primera versión.  
No deberá añadirse monitoreo únicamente después de un incidente.  
Cada componente deberá exponer:  
* estado;  
* métricas;  
* errores;  
* dependencias;  
* versión;  
* latencia;  
* volumen;  
* consumo de recursos;  
* eventos relevantes.  
   
⸻  
   
## 168. Diferencia entre monitoreo y observabilidad  
## Monitoreo  
Responde preguntas conocidas.  
Ejemplo:  
¿El backend está activo?  
## Observabilidad  
Permite investigar situaciones no previstas.  
Ejemplo:  
¿Por qué los usuarios de español que intentaron pagar un servicio de LLC experimentaron errores después del último deployment?  
Ambos deberán implementarse.  
   
⸻  
   
## 169. Tres pilares técnicos  
La primera versión utilizará tres pilares principales:  
```
Metrics
Logs
Traces

```
Estos deberán compartir:  
* correlation ID;  
* service name;  
* environment;  
* version;  
* deployment ID;  
* request ID;  
* timestamp;  
* resource reference limitada.  
   
⸻  
   
## 170. Arquitectura conceptual de observabilidad  
```
Frontend
Backend
Workers
Scheduler
AI Gateway
Browser Worker
PostgreSQL
Redis
MinIO
Nginx
GPU Node
External Integrations
        ↓
OpenTelemetry Collectors
        ↓
Metrics / Logs / Traces
        ↓
Prometheus / Log Store / Trace Store
        ↓
Grafana
        ↓
Alerts
        ↓
Incident Response

```
La arquitectura final podrá adaptar tecnologías equivalentes, pero deberá conservar estas responsabilidades.  
   
⸻  
   
## 171. Herramientas iniciales recomendadas  
La infraestructura deberá quedar preparada para utilizar:  
```
Prometheus
Grafana
OpenTelemetry
Loki o sistema equivalente de logs
Tempo, Jaeger o sistema equivalente de tracing
Alertmanager
Node Exporter
Container Metrics Exporter
PostgreSQL Exporter
Redis Exporter
GPU Exporter

```
La selección final deberá considerar:  
* costo;  
* infraestructura existente;  
* facilidad de mantenimiento;  
* retención;  
* seguridad;  
* escalabilidad.  
   
⸻  
   
## 172. OpenTelemetry  
OpenTelemetry será la capa estándar recomendada para instrumentación.  
Deberá utilizarse para:  
* traces;  
* metrics;  
* contexto distribuido;  
* propagación de correlation IDs;  
* instrumentación de APIs;  
* instrumentación de workers;  
* instrumentación de tool calls;  
* instrumentación de integraciones.  
La lógica del negocio no deberá depender directamente del proveedor de observabilidad.  
   
⸻  
   
## 173. OpenTelemetry Collector  
El Collector deberá funcionar como intermediario.  
Responsabilidades:  
* recibir telemetría;  
* procesar;  
* filtrar;  
* redactar;  
* agregar metadata;  
* aplicar sampling;  
* exportar a destinos;  
* manejar reintentos;  
* controlar volumen.  
Los servicios no deberán enviar datos directamente a múltiples proveedores sin necesidad.  
   
⸻  
   
## 174. Instrumentación automática y manual  
Se utilizarán dos niveles.  
## Instrumentación automática  
Para:  
* HTTP;  
* database calls;  
* Redis;  
* external requests;  
* queues;  
* runtime;  
* framework;  
* container.  
## Instrumentación manual  
Para:  
* workflows;  
* service orders;  
* approvals;  
* payments;  
* document processing;  
* AI runs;  
* browser executions;  
* partner referrals;  
* tax processing;  
* credit workflows.  
   
⸻  
   
## 175. Convenciones comunes  
Todos los servicios deberán registrar atributos consistentes.  
Ejemplo:  
```
service.name
service.version
deployment.environment
deployment.id
trace.id
span.id
request.id
correlation.id
actor.type
operation.name
resource.type
result.status
error.code

```
No deberán utilizarse nombres diferentes para el mismo concepto en cada módulo.  
   
⸻  
   
## 176. Correlation ID  
Cada solicitud deberá recibir un identificador de correlación.  
El mismo ID deberá propagarse por:  
```
Nginx
→ Frontend Server
→ Backend
→ Workflow
→ Task
→ Worker
→ External Integration
→ Webhook
→ Audit

```
Esto permitirá reconstruir el recorrido completo.  
   
⸻  
   
## 177. Request ID  
Cada request HTTP deberá tener un ID único.  
El requestId identifica una solicitud individual.  
El correlationId podrá vincular varias solicitudes dentro de un mismo proceso.  
   
⸻  
   
## 178. Workflow Correlation  
Los procesos largos deberán utilizar identificadores adicionales:  
```
workflowInstanceId
serviceOrderId
caseId
taskId
approvalRequestId
agentRunId
paymentId
documentId

```
Estos identificadores deberán almacenarse de forma segura y no sustituir autorización.  
   
⸻  
   
## 179. Logs estructurados  
Todos los servicios deberán utilizar logs estructurados.  
Formato conceptual:  
```
{
  "timestamp": "2026-08-06T07:30:00Z",
  "level": "ERROR",
  "service": "billing-service",
  "environment": "production",
  "event": "stripe_webhook_processing_failed",
  "correlationId": "COR-8821",
  "requestId": "REQ-2190",
  "errorCode": "BILLING_WEBHOOK_004",
  "retryable": true
}

```
No depender exclusivamente de mensajes de texto.  
   
⸻  
   
## 180. Niveles de logs  
```
TRACE
DEBUG
INFORMATION
WARNING
ERROR
CRITICAL

```
## TRACE  
Diagnóstico profundo y temporal.  
## DEBUG  
Desarrollo y troubleshooting controlado.  
## INFORMATION  
Eventos normales relevantes.  
## WARNING  
Situación inesperada que no impide operación.  
## ERROR  
Operación fallida.  
## CRITICAL  
Riesgo grave, indisponibilidad o pérdida potencial.  
   
⸻  
   
## 181. Logs por ambiente  
## Development  
Podrá utilizar mayor detalle.  
## Testing  
Deberá facilitar debugging automático.  
## Staging  
Deberá parecerse a producción.  
## Production  
Deberá reducir ruido y proteger datos.  
Los niveles no deberán modificarse manualmente sin control.  
   
⸻  
   
## 182. Información obligatoria en logs  
Cuando corresponda:  
* timestamp UTC;  
* nivel;  
* service name;  
* service version;  
* environment;  
* event code;  
* correlation ID;  
* request ID;  
* actor type;  
* operation;  
* result;  
* latency;  
* error code;  
* retry status;  
* provider;  
* deployment ID.  
   
⸻  
   
## 183. Información prohibida en logs  
No registrar:  
* contraseñas;  
* API keys;  
* tokens;  
* cookies;  
* authorization headers;  
* SSN;  
* ITIN;  
* EIN completo;  
* números completos de cuenta;  
* tarjetas;  
* documentos completos;  
* reportes de crédito;  
* declaraciones tributarias;  
* prompts completos con PII;  
* payloads externos completos;  
* URLs firmadas;  
* secretos de webhook.  
   
⸻  
   
## 184. Redacción automática  
La plataforma deberá aplicar redacción antes de persistir logs.  
Ejemplos:  
```
123-45-6789
→ ***-**-6789
Bearer eyJ...
→ Bearer [REDACTED]

```
La redacción deberá ocurrir centralmente y también en puntos sensibles.  
   
⸻  
   
## 185. Logging de errores  
Los errores deberán incluir suficiente información para diagnóstico, pero sin revelar datos sensibles.  
Formato conceptual:  
```
errorCode
errorType
errorMessageRedacted
stackTraceReference
retryable
dependency
operation

```
Los errores públicos no deberán mostrar stack traces.  
   
⸻  
   
## 186. Stack traces  
Los stack traces podrán almacenarse internamente.  
Deberán:  
* limitarse a personal autorizado;  
* estar protegidos;  
* evitar payloads sensibles;  
* vincularse al deployment;  
* vincularse al commit;  
* tener retención limitada.  
   
⸻  
   
## 187. Logs de auditoría  
Los logs operativos y los logs de auditoría deberán mantenerse separados.  
## Logs operativos  
Ayudan a diagnosticar.  
## Auditoría  
Demuestra quién realizó una acción y qué cambió.  
Un error del sistema de logging operativo no deberá eliminar evidencia de auditoría.  
   
⸻  
   
## 188. Integridad de auditoría  
Los registros de auditoría deberán:  
* ser append-only;  
* impedir edición normal;  
* conservar orden;  
* registrar actor;  
* registrar fecha;  
* registrar acción;  
* registrar recurso;  
* registrar resultado;  
* conservar correlation ID;  
* detectar alteraciones cuando sea viable.  
   
⸻  
   
## 189. Logs de seguridad  
Deberán registrarse eventos como:  
```
login_failed
mfa_failed
account_locked
suspicious_session
permission_denied
idor_attempt_detected
secret_accessed
admin_role_changed
break_glass_used
export_requested
kill_switch_activated
malware_detected
prompt_injection_detected
browser_domain_blocked

```
   
⸻  
   
## 190. Logs de integraciones  
Cada integración deberá registrar:  
* provider;  
* endpoint lógico;  
* operation;  
* status;  
* latency;  
* retry count;  
* provider reference;  
* error code;  
* webhook event ID;  
* idempotency result.  
No registrar el payload completo salvo en almacenamiento seguro y justificado.  
   
⸻  
   
## 191. Logs de IA  
Cada ejecución deberá registrar:  
* agent;  
* agent version;  
* model;  
* provider;  
* purpose;  
* routing decision;  
* tool names;  
* source count;  
* review status;  
* output status;  
* latency;  
* cost;  
* error;  
* incident reference.  
No registrar automáticamente el prompt completo.  
   
⸻  
   
## 192. Logs del Browser Worker  
Deberán incluir:  
* approval reference;  
* execution authorization;  
* target domain;  
* action type;  
* pages visitadas permitidas;  
* pasos realizados;  
* resultado;  
* evidence reference;  
* bloqueo de dominio;  
* timeout;  
* error.  
No deberán incluir credenciales.  
   
⸻  
   
## 193. Logs de pagos  
Deberán incluir:  
* internal payment reference;  
* provider;  
* event type;  
* amount minor units cuando esté permitido;  
* currency;  
* status;  
* reconciliation status;  
* webhook event reference;  
* idempotency status.  
No registrar información completa de tarjeta.  
   
⸻  
   
## 194. Retención de logs  
La retención deberá depender del tipo.  
Ejemplo conceptual:  
```
Debug logs:
Retención corta.

Operational logs:
Retención media.

Security logs:
Retención reforzada.

Audit logs:
Retención según servicio y obligaciones.

Incident evidence:
Retención según severidad y legal hold.

```
Los periodos definitivos deberán configurarse mediante políticas.  
   
⸻  
   
## 195. Rotación de logs  
La plataforma deberá aplicar:  
* rotación;  
* compresión;  
* límites de tamaño;  
* archivado;  
* eliminación controlada;  
* protección contra llenar discos.  
Un disco lleno por logs no deberá detener toda la plataforma.  
   
⸻  
   
## 196. Centralización de logs  
Los logs no deberán depender únicamente del filesystem del contenedor.  
Todos los contenedores deberán enviar sus logs a una plataforma central.  
Esto permitirá:  
* búsqueda;  
* correlación;  
* dashboards;  
* alertas;  
* retención;  
* acceso controlado.  
   
⸻  
   
## 197. Acceso a logs  
El acceso deberá separarse por función.  
Ejemplo:  
## Support  
Puede consultar eventos básicos de una interacción.  
## Developer  
Puede consultar errores técnicos.  
## Security  
Puede consultar eventos de seguridad.  
## Owner  
Puede consultar dashboards y resúmenes.  
No todos deberán poder ver logs restringidos.  
   
⸻  
   
## 198. Protección contra log injection  
Los valores externos deberán escaparse o estructurarse.  
Un usuario no deberá poder insertar líneas falsas en logs mediante:  
* saltos de línea;  
* JSON manipulado;  
* encabezados;  
* campos de formulario;  
* mensajes;  
* nombres de archivo.  
   
⸻  
   
## 199. Métricas  
Las métricas deberán ser numéricas y agregables.  
Categorías:  
```
Infrastructure Metrics
Application Metrics
Database Metrics
Queue Metrics
Integration Metrics
AI Metrics
Security Metrics
Business Operational Metrics

```
   
⸻  
   
## 200. Tipos de métricas  
```
Counter
Gauge
Histogram
Summary

```
La selección deberá corresponder al comportamiento medido.  
   
⸻  
   
## 201. Métricas RED  
Para servicios HTTP se recomienda medir:  
```
Rate
Errors
Duration

```
Es decir:  
* volumen;  
* errores;  
* latencia.  
   
⸻  
   
## 202. Métricas USE  
Para recursos de infraestructura:  
```
Utilization
Saturation
Errors

```
Aplicará a:  
* CPU;  
* RAM;  
* discos;  
* red;  
* GPU;  
* pools;  
* conexiones;  
* threads.  
   
⸻  
   
## 203. Métricas del host  
Cada servidor deberá exponer:  
* CPU;  
* RAM;  
* swap;  
* espacio;  
* IOPS;  
* network throughput;  
* load average;  
* procesos;  
* temperatura cuando esté disponible;  
* uptime;  
* clock drift.  
   
⸻  
   
## 204. Métricas de contenedores  
Por contenedor:  
* CPU;  
* memory;  
* restart count;  
* health;  
* filesystem;  
* network;  
* throttling;  
* open files;  
* process count;  
* uptime.  
   
⸻  
   
## 205. Métricas de Nginx o reverse proxy  
* requests;  
* status codes;  
* request duration;  
* active connections;  
* rejected requests;  
* rate-limit blocks;  
* upstream errors;  
* TLS errors;  
* response sizes.  
   
⸻  
   
## 206. Métricas del Backend  
* requests por endpoint;  
* latencia;  
* errores;  
* exceptions;  
* authentication failures;  
* authorization denials;  
* active requests;  
* thread pool;  
* database calls;  
* cache hits;  
* external calls;  
* timeouts.  
   
⸻  
   
## 207. Métricas del Frontend  
Cuando sea apropiado:  
* page load;  
* Web Vitals;  
* navigation failures;  
* JavaScript errors;  
* API failures;  
* form abandonment técnico;  
* upload errors;  
* authentication loops;  
* hydration failures.  
No enviar PII a analytics técnicos.  
   
⸻  
   
## 208. Métricas de PostgreSQL  
* conexiones;  
* conexiones disponibles;  
* query latency;  
* queries lentas;  
* transactions;  
* locks;  
* deadlocks;  
* replication lag futuro;  
* cache hit;  
* database size;  
* table growth;  
* index usage;  
* vacuum status;  
* backup status.  
   
⸻  
   
## 209. Métricas de Redis  
* memory;  
* connected clients;  
* hit rate;  
* misses;  
* evictions;  
* expired keys;  
* command latency;  
* blocked clients;  
* replication futuro;  
* rejected connections.  
   
⸻  
   
## 210. Métricas de MinIO u object storage  
* storage used;  
* objects;  
* upload rate;  
* download rate;  
* failed operations;  
* latency;  
* replication status futuro;  
* version count;  
* scan backlog;  
* expired temporary objects.  
   
⸻  
   
## 211. Métricas de colas  
Cada cola deberá medir:  
* queue depth;  
* oldest message age;  
* processing rate;  
* success rate;  
* failure rate;  
* retry count;  
* dead-letter count;  
* consumer count;  
* processing duration;  
* stalled jobs.  
   
⸻  
   
## 212. Métricas de workers  
* jobs started;  
* jobs completed;  
* jobs failed;  
* retries;  
* timeout;  
* average duration;  
* current concurrency;  
* idle capacity;  
* memory;  
* last successful job.  
   
⸻  
   
## 213. Métricas del Scheduler  
* scheduled jobs;  
* executions;  
* missed runs;  
* late runs;  
* failures;  
* duplicate prevention;  
* duration;  
* next run;  
* lock status.  
Una tarea programada silenciosamente detenida deberá generar alerta.  
   
⸻  
   
## 214. Métricas de integraciones externas  
Por proveedor:  
* request volume;  
* success rate;  
* latency;  
* timeout rate;  
* authentication errors;  
* rate limit responses;  
* webhook delay;  
* webhook failures;  
* retries;  
* circuit breaker status.  
   
⸻  
   
## 215. Métricas de Stripe  
* checkout creation;  
* payment success;  
* payment failure;  
* webhook delay;  
* duplicate webhooks;  
* reconciliation pending;  
* refund success;  
* refund failure;  
* disputed payments;  
* provider outage indications.  
   
⸻  
   
## 216. Métricas de comunicaciones  
Para email, WhatsApp, SMS y canales futuros:  
* messages queued;  
* messages sent;  
* delivery;  
* failure;  
* bounce;  
* provider rejection;  
* opt-out;  
* retry;  
* queue age;  
* template failure.  
   
⸻  
   
## 217. Métricas del AI Hub  
* agent runs;  
* success;  
* failure;  
* timeout;  
* model routing;  
* fallback usage;  
* tool calls;  
* blocked tool calls;  
* review required;  
* review approved;  
* review rejected;  
* latency;  
* token usage;  
* estimated cost;  
* hallucination incidents;  
* prompt injection detections.  
   
⸻  
   
## 218. Métricas del nodo GPU  
* online status;  
* heartbeat;  
* GPU utilization;  
* VRAM used;  
* temperature;  
* power draw cuando esté disponible;  
* model loaded;  
* queue depth;  
* inference latency;  
* job failures;  
* storage;  
* connection status.  
   
⸻  
   
## 219. Métricas del Browser Worker  
* executions;  
* approvals;  
* success;  
* partial success;  
* failure;  
* blocked domains;  
* timeout;  
* session creation;  
* session destruction;  
* screenshots;  
* provider changes;  
* human confirmation wait.  
   
⸻  
   
## 220. Métricas de seguridad  
* failed logins;  
* MFA failures;  
* account locks;  
* rate-limit blocks;  
* WAF blocks;  
* denied authorizations;  
* suspicious exports;  
* malware;  
* SSRF blocks;  
* secret scanning findings;  
* vulnerable images;  
* break-glass usage;  
* prompt injection alerts.  
   
⸻  
   
## 221. Métricas de negocio operativas  
Podrán utilizarse para detectar problemas técnicos.  
Ejemplos:  
* service orders creadas;  
* payments completed;  
* forms submitted;  
* documents uploaded;  
* appointments scheduled;  
* approvals completed;  
* tasks created;  
* referrals generated.  
Una caída repentina puede indicar un fallo técnico.  
   
⸻  
   
## 222. Cardinalidad de métricas  
No deberán utilizarse labels de alta cardinalidad como:  
* user ID;  
* client ID;  
* document ID;  
* payment ID;  
* full URL;  
* email;  
* phone;  
* free text.  
Esto podría hacer que Prometheus o el sistema equivalente crezca sin control.  
Los identificadores detallados deberán permanecer en logs y traces autorizados.  
   
⸻  
   
## 223. Distributed Tracing  
El tracing deberá seguir una operación a través de múltiples servicios.  
Ejemplo:  
```
Client submits form
→ API validates
→ Form Service stores
→ Workflow starts
→ Task created
→ Notification queued
→ Email provider called

```
Cada paso deberá representarse mediante spans.  
   
⸻  
   
## 224. Span  
Cada span deberá incluir:  
* operation name;  
* start;  
* end;  
* duration;  
* service;  
* status;  
* dependency;  
* safe attributes;  
* parent span;  
* error code.  
   
⸻  
   
## 225. Trazas de integraciones  
Una llamada externa deberá mostrar:  
* provider;  
* logical operation;  
* latency;  
* status;  
* retry;  
* circuit breaker;  
* response category.  
No guardar payloads completos en el trace.  
   
⸻  
   
## 226. Trazas de workflows  
Los workflows largos deberán generar spans para:  
* stage entered;  
* validation;  
* task creation;  
* approval request;  
* wait state;  
* external action;  
* compensation;  
* completion.  
   
⸻  
   
## 227. Trazas de IA  
Una ejecución podrá incluir:  
```
Agent routing
→ context scope
→ RAG retrieval
→ model inference
→ tool proposal
→ tool execution
→ output validation
→ review creation

```
El contenido textual deberá protegerse.  
   
⸻  
   
## 228. Sampling  
No será necesario almacenar todas las trazas indefinidamente.  
Podrá aplicarse:  
* head sampling;  
* tail sampling;  
* error-biased sampling;  
* latency-biased sampling;  
* security event sampling;  
* critical workflow retention.  
Las trazas de error y seguridad deberán tener mayor prioridad.  
   
⸻  
   
## 229. Health checks  
Cada servicio deberá implementar:  
```
/health/live
/health/ready
/health/dependencies

```
La nomenclatura final podrá adaptarse al framework.  
   
⸻  
   
## 230. Liveness  
Indica si el proceso está vivo.  
No deberá depender de todos los proveedores externos.  
Un fallo temporal de Stripe no deberá reiniciar el Backend constantemente.  
   
⸻  
   
## 231. Readiness  
Indica si el servicio puede recibir tráfico.  
Podrá comprobar:  
* configuración;  
* database connection;  
* critical dependencies;  
* migrations;  
* queue connection;  
* required secrets.  
   
⸻  
   
## 232. Dependency Health  
Deberá mostrar estado agregado de:  
* PostgreSQL;  
* Redis;  
* MinIO;  
* queue;  
* providers;  
* AI node;  
* notification services.  
El endpoint administrativo deberá estar protegido.  
   
⸻  
   
## 233. Estados de salud  
```
healthy
degraded
unhealthy
unknown
maintenance

```
El estado degraded deberá permitir operación parcial cuando sea seguro.  
   
⸻  
   
## 234. Synthetic Monitoring  
Se ejecutarán pruebas automáticas desde fuera de la aplicación.  
Ejemplos:  
* página pública carga;  
* login responde;  
* portal responde;  
* health endpoint;  
* checkout sandbox;  
* upload sandbox;  
* AI public FAQ;  
* appointment availability.  
No ejecutar acciones reales que creen cargos o filings.  
   
⸻  
   
## 235. Uptime Monitoring  
Deberá supervisarse:  
* dominio;  
* certificado;  
* DNS;  
* reverse proxy;  
* frontend;  
* API;  
* portal;  
* status page futura.  
Las comprobaciones deberán realizarse desde más de un punto cuando el negocio crezca.  
   
⸻  
   
## 236. SLI  
Los Service Level Indicators deberán medir resultados reales.  
Ejemplos:  
* porcentaje de requests exitosos;  
* latencia de API;  
* disponibilidad;  
* webhook processing time;  
* job completion rate;  
* document processing time;  
* AI response success.  
   
⸻  
   
## 237. SLO  
Se definirán objetivos internos.  
Ejemplos conceptuales:  
```
API availability target

Payment webhook processing target

Document processing target

Critical queue age target

Authentication success target

```
Los valores concretos deberán aprobarse según capacidad y costos.  
   
⸻  
   
## 238. SLA  
Los SLA contractuales no deberán confundirse con SLO técnicos.  
## SLO  
Objetivo interno.  
## SLA  
Compromiso formal con consecuencias definidas.  
El MVP podrá funcionar inicialmente con SLO internos sin prometer SLA público.  
   
⸻  
   
## 239. Error budgets  
Cada SLO podrá tener un error budget.  
Esto permitirá decidir:  
* continuar releases;  
* pausar cambios;  
* priorizar estabilidad;  
* invertir en capacidad;  
* corregir deuda técnica.  
   
⸻  
   
## 240. Dashboards  
Grafana o la herramienta seleccionada deberá incluir dashboards por área.  
Dashboards mínimos:  
```
Platform Overview
Infrastructure
Backend APIs
Frontend Experience
PostgreSQL
Redis
Object Storage
Queues and Workers
External Integrations
Payments
Communications
AI Hub
GPU Node
Browser Worker
Security
Deployments
Business Operations

```
   
⸻  
   
## 241. Dashboard general  
Deberá mostrar:  
* disponibilidad;  
* errores;  
* latencia;  
* tráfico;  
* servicios degradados;  
* colas;  
* integraciones;  
* pagos;  
* AI status;  
* GPU status;  
* incidentes;  
* último deployment.  
   
⸻  
   
## 242. Dashboard de deployment  
Mostrar:  
* versión activa;  
* commit;  
* deployment ID;  
* fecha;  
* environment;  
* pipeline;  
* health;  
* error rate antes y después;  
* rollback status;  
* feature flags activadas.  
   
⸻  
   
## 243. Dashboard de seguridad  
Mostrar:  
* login failures;  
* MFA failures;  
* WAF blocks;  
* rate-limit blocks;  
* malware findings;  
* vulnerable images;  
* secret findings;  
* denied permissions;  
* break-glass events;  
* security incidents.  
El acceso deberá estar restringido.  
   
⸻  
   
## 244. Alertas  
Una alerta deberá representar una condición accionable.  
No deberán crearse alertas para cada evento individual sin contexto.  
Toda alerta deberá incluir:  
* nombre;  
* severidad;  
* servicio;  
* condición;  
* duración;  
* impacto;  
* runbook;  
* dashboard;  
* correlation context;  
* owner.  
   
⸻  
   
## 245. Severidades  
```
SEV-1 Critical
SEV-2 High
SEV-3 Moderate
SEV-4 Low
Informational

```
## SEV-1  
Interrupción grave, riesgo de seguridad, dinero o pérdida de datos.  
## SEV-2  
Degradación importante o función crítica afectada.  
## SEV-3  
Problema limitado con workaround.  
## SEV-4  
Problema menor o preventivo.  
   
⸻  
   
## 246. Condiciones iniciales de alerta  
Ejemplos:  
* frontend no disponible;  
* API no disponible;  
* error rate elevado;  
* latencia elevada;  
* PostgreSQL sin conexiones;  
* espacio bajo;  
* backup fallido;  
* cola crítica atrasada;  
* dead-letter creciendo;  
* scheduler detenido;  
* Stripe webhook atrasado;  
* authentication failures anómalos;  
* GPU overheating;  
* nodo GPU desconectado durante tarea;  
* AI tool blocked repetidamente;  
* malware detectado;  
* certificado próximo a vencer;  
* deployment failure;  
* rollback triggered;  
* kill switch activado.  
   
⸻  
   
## 247. Anti-noise y deduplicación  
Las alertas deberán:  
* agruparse;  
* deduplicarse;  
* tener cooldown;  
* evitar notificaciones repetidas;  
* reconocer dependencias;  
* evitar tormentas;  
* silenciarse durante mantenimiento autorizado.  
Ejemplo:  
Si PostgreSQL está caído, no enviar cien alertas diferentes de cada endpoint dependiente.  
   
⸻  
   
## 248. Instrucciones finales para Codex  
Antes de implementar observabilidad:  
1. Lee los módulos 1 al 25.  
2. Lee las partes 1 a 5 del Módulo 26.  
3. Inspecciona logs existentes.  
4. Inspecciona métricas existentes.  
5. Inspecciona health checks existentes.  
6. Inspecciona dashboards existentes.  
7. No crees sistemas paralelos de logging.  
8. Define una convención de telemetría común.  
9. Implementa correlation IDs.  
10. Implementa request IDs.  
11. Propaga contexto entre servicios.  
12. Implementa OpenTelemetry o abstracción equivalente.  
13. Implementa Collector.  
14. Implementa logs estructurados.  
15. Redacta PII.  
16. No registres secretos.  
17. Separa logs operativos y auditoría.  
18. Centraliza logs.  
19. Protege acceso a logs.  
20. Implementa rotación.  
21. Implementa retención por categoría.  
22. Implementa métricas RED.  
23. Implementa métricas USE.  
24. Implementa métricas de PostgreSQL.  
25. Implementa métricas de Redis.  
26. Implementa métricas de MinIO.  
27. Implementa métricas de colas.  
28. Implementa métricas de workers.  
29. Implementa métricas del Scheduler.  
30. Implementa métricas de proveedores.  
31. Implementa métricas de Stripe.  
32. Implementa métricas de comunicaciones.  
33. Implementa métricas del AI Hub.  
34. Implementa métricas del nodo GPU.  
35. Implementa métricas del Browser Worker.  
36. Implementa métricas de seguridad.  
37. Evita labels de alta cardinalidad.  
38. Implementa distributed tracing.  
39. Protege contenido de traces.  
40. Implementa sampling.  
41. Implementa liveness.  
42. Implementa readiness.  
43. Implementa dependency health.  
44. Implementa synthetic monitoring.  
45. Implementa uptime checks.  
46. Define SLIs.  
47. Define SLOs realistas.  
48. No prometas SLA sin aprobación.  
49. Implementa dashboards.  
50. Implementa dashboard general.  
51. Implementa dashboard de deployment.  
52. Implementa dashboard de seguridad.  
53. Implementa alertas accionables.  
54. Define severidades.  
55. Implementa deduplicación.  
56. Implementa supresión durante mantenimiento.  
57. Vincula cada alerta a un runbook.  
58. No registres payloads completos por comodidad.  
59. No utilices logs como base de datos.  
60. No marques observabilidad como completa sin simular fallos.  
61. Prueba caída de PostgreSQL.  
62. Prueba caída de Redis.  
63. Prueba caída de MinIO.  
64. Prueba proveedor externo lento.  
65. Prueba cola bloqueada.  
66. Prueba scheduler detenido.  
67. Prueba deployment defectuoso.  
68. Prueba nodo GPU offline.  
69. Prueba alerta de seguridad.  
70. Documenta las métricas y dashboards.  
Antes de entregar, verifica:  
* ¿Una solicitud puede seguirse entre servicios?  
* ¿Los logs están estructurados?  
* ¿Los logs no contienen secretos ni PII innecesaria?  
* ¿Las métricas permiten detectar errores y lentitud?  
* ¿Las colas muestran profundidad y edad?  
* ¿Los workers muestran fallos y reintentos?  
* ¿Las integraciones externas tienen métricas propias?  
* ¿Stripe puede supervisarse sin guardar datos de tarjeta?  
* ¿El AI Hub informa costos, latencia y bloqueos?  
* ¿El nodo GPU informa temperatura, VRAM y disponibilidad?  
* ¿Existen health checks correctos?  
* ¿Liveness y readiness están separados?  
* ¿Existen dashboards operativos?  
* ¿Las alertas son accionables?  
* ¿Existe deduplicación de alertas?  
* ¿Cada alerta incluye owner y runbook?  
* ¿Se puede identificar el deployment que introdujo un error?  
* ¿La caída de una dependencia genera estado degradado correctamente?  
* ¿Los incidentes críticos pueden detectarse antes de recibir quejas?  
* ¿La implementación reutiliza la infraestructura existente?  
  
  
  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 6 — Backups, Restauración, Disaster Recovery y Continuidad del Negocio  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 5 **Secciones incluidas:** 249–342 **Audiencia:** Codex, desarrolladores, DevOps, administradores, seguridad, operaciones, cumplimiento y owner **Idioma del código:** Inglés **Modelo operativo:** Backups verificables, recuperación documentada y continuidad basada en riesgo  
   
⸻  
   
## 249. Objetivo  
Esta parte define cómo SG Solutions deberá proteger, restaurar y reconstruir su información e infraestructura ante:  
* errores humanos;  
* eliminación accidental;  
* corrupción de datos;  
* fallos de software;  
* fallos de hardware;  
* despliegues defectuosos;  
* pérdida del servidor;  
* pérdida del almacenamiento;  
* ransomware;  
* credenciales comprometidas;  
* fallos de proveedores;  
* pérdida del nodo GPU;  
* daños físicos;  
* interrupciones de red;  
* desastre regional;  
* errores de migración;  
* eliminación maliciosa;  
* pérdida parcial o total de producción.  
El sistema deberá responder:  
* ¿Qué información puede perderse?  
* ¿Cuánto tiempo de datos puede perderse?  
* ¿Cuánto tiempo puede estar detenido el servicio?  
* ¿Dónde están las copias?  
* ¿Quién puede restaurarlas?  
* ¿Cómo se verifica que funcionan?  
* ¿Cómo se reconstruye la infraestructura?  
* ¿Qué servicios deberán recuperarse primero?  
* ¿Cómo se evita restaurar datos comprometidos?  
* ¿Cómo se comunica un incidente?  
Un backup no deberá considerarse útil hasta que una restauración haya sido probada.  
   
⸻  
   
## 250. Principio central  
La continuidad deberá seguir este modelo:  
```
Prevenir
→ Detectar
→ Contener
→ Preservar evidencia
→ Recuperar
→ Validar
→ Reanudar operación
→ Reconciliar
→ Revisar
→ Mejorar

```
No será suficiente:  
```
Crear archivo ZIP
→ asumir que existe un backup

```
   
⸻  
   
## 251. Diferencia entre conceptos  
## Backup  
Copia recuperable de información.  
## Snapshot  
Imagen de un volumen, base de datos o sistema en un momento determinado.  
## Replicación  
Copia continua o casi continua utilizada para disponibilidad.  
## Archivo  
Información conservada durante periodos prolongados.  
## Restore  
Proceso de recuperar información desde una copia.  
## Recovery  
Proceso completo para restablecer operación.  
## Disaster Recovery  
Plan para recuperar sistemas después de una interrupción grave.  
## Business Continuity  
Capacidad del negocio para continuar prestando funciones esenciales durante una interrupción.  
## High Availability  
Capacidad de reducir o evitar interrupciones mediante redundancia.  
Replicación no sustituye backup.  
Un error o ataque puede replicarse también.  
   
⸻  
   
## 252. Objetivos principales  
* Evitar pérdida irreversible de datos.  
* Recuperar servicios críticos.  
* Mantener copias cifradas.  
* Mantener copias fuera del servidor principal.  
* Evitar que un atacante elimine todas las copias.  
* Probar restauraciones.  
* Definir prioridades.  
* Definir RPO.  
* Definir RTO.  
* Automatizar backups.  
* Supervisar resultados.  
* Documentar procedimientos.  
* Mantener responsables.  
* Conservar evidencia.  
* Facilitar reconstrucción completa.  
* Reducir dependencia de una sola máquina.  
* Mantener continuidad aunque el nodo GPU falle.  
   
⸻  
   
## 253. Alcance de protección  
El sistema deberá proteger:  
```
PostgreSQL
Object Storage
Document metadata
Redis configuration where relevant
Queue state when supported
Audit records
Application configuration
Infrastructure as Code
Docker configuration
Deployment manifests
Environment configuration references
Knowledge bases
Embeddings and vector indexes
AI agent definitions
Skill versions
Prompt versions
Workflow definitions
Task templates
Approval policies
Form definitions
Catalogs
Reports
Monitoring configuration
Dashboards
Alert rules
Runbooks
Certificates and key references
Source code
Container image metadata
Operational documentation

```
   
⸻  
   
## 254. Datos que no deberán depender de backups tradicionales  
Algunos elementos deberán poder reconstruirse desde fuentes controladas.  
Ejemplos:  
* código fuente desde Git;  
* imágenes Docker desde el registry;  
* infraestructura desde Infrastructure as Code;  
* dashboards desde archivos versionados;  
* migraciones desde el repositorio;  
* configuración no secreta desde Git;  
* agentes y workflows desde definiciones versionadas.  
No deberá dependerse de una copia manual del servidor.  
   
⸻  
   
## 255. Estrategia 3-2-1  
La plataforma deberá aproximarse al principio:  
```
3 copias de la información
2 tipos de almacenamiento
1 copia fuera del entorno principal

```
Para información crítica se recomienda añadir:  
```
1 copia inmutable o aislada

```
La implementación inicial podrá ser proporcional al tamaño del negocio, pero deberá evitar un único punto de pérdida.  
   
⸻  
   
## 256. Copia primaria, secundaria y aislada  
## Copia primaria  
Datos de producción.  
## Copia secundaria  
Backup automatizado en almacenamiento separado.  
## Copia aislada  
Copia protegida contra eliminación o modificación desde las credenciales normales de producción.  
La copia aislada podrá usar:  
* object lock;  
* immutable storage;  
* cuenta cloud separada;  
* repositorio offline;  
* almacenamiento desconectado;  
* proveedor secundario.  
   
⸻  
   
## 257. RPO  
Recovery Point Objective representa la cantidad máxima de datos que el negocio acepta perder medida en tiempo.  
Ejemplo conceptual:  
```
RPO de 15 minutos

```
significa que, ante un desastre, podrían perderse hasta aproximadamente 15 minutos de cambios.  
Los valores deberán definirse por sistema.  
   
⸻  
   
## 258. RTO  
Recovery Time Objective representa el tiempo objetivo para restablecer una función.  
Ejemplo conceptual:  
```
RTO de 4 horas

```
significa que el objetivo es restablecer el servicio dentro de ese periodo.  
RTO no deberá confundirse con una garantía contractual.  
   
⸻  
   
## 259. Clasificación de criticidad  
Los sistemas deberán clasificarse:  
```
Tier 0 — Seguridad y acceso de emergencia
Tier 1 — Operación crítica
Tier 2 — Operación importante
Tier 3 — Operación de soporte
Tier 4 — Reconstruible o no crítico

```
   
⸻  
   
## 260. Tier 0  
Podrá incluir:  
* acceso al Secret Manager;  
* credenciales de recuperación;  
* backups;  
* DNS;  
* certificados;  
* repositorio;  
* infraestructura como código;  
* canales de comunicación de incidentes.  
Si estos elementos no están disponibles, la recuperación completa puede quedar bloqueada.  
   
⸻  
   
## 261. Tier 1  
Podrá incluir:  
* autenticación;  
* PostgreSQL;  
* backend API;  
* portal del cliente;  
* documentos críticos;  
* auditoría;  
* pagos y reconciliación;  
* workflows activos;  
* aprobaciones pendientes;  
* tareas críticas.  
   
⸻  
   
## 262. Tier 2  
Podrá incluir:  
* comunicaciones;  
* citas;  
* CRM;  
* formularios;  
* marketplace;  
* reportes operativos;  
* AI Hub básico;  
* knowledge base.  
   
⸻  
   
## 263. Tier 3  
Podrá incluir:  
* analytics;  
* dashboards históricos;  
* ambientes de prueba;  
* evaluaciones de IA;  
* trabajos batch;  
* funciones administrativas no urgentes.  
   
⸻  
   
## 264. Tier 4  
Podrá incluir información:  
* regenerable;  
* temporal;  
* cacheada;  
* derivada;  
* no esencial.  
Ejemplos:  
* caché;  
* previews;  
* thumbnails;  
* artefactos temporales;  
* índices regenerables;  
* modelos descargables nuevamente.  
   
⸻  
   
## 265. Matriz de recuperación  
Cada componente deberá tener:  
```
Component
Criticality Tier
Data Owner
Technical Owner
Backup Method
Backup Frequency
Retention
Encryption
RPO
RTO
Restore Procedure
Last Restore Test
Dependencies

```
Esta matriz deberá mantenerse actualizada.  
   
⸻  
   
## 266. Backup Policy  
Deberá existir una política formal con:  
* alcance;  
* frecuencia;  
* retención;  
* cifrado;  
* ubicación;  
* responsables;  
* pruebas;  
* acceso;  
* eliminación;  
* excepciones;  
* legal hold;  
* respuesta ante fallos;  
* requisitos de proveedores.  
   
⸻  
   
## 267. Backup Job  
Cada trabajo deberá registrar:  
```
id
backupType
resourceType
resourceId
environment
startedAt
completedAt
status
sizeBytes
checksum
encryptionKeyVersion
storageLocationReference
retentionClass
errorCode
restoreTestStatus
createdAt

```
   
⸻  
   
## 268. Estados de backup  
```
scheduled
running
completed
completed_with_warning
failed
cancelled
expired
verification_failed
quarantined
deleted

```
Un trabajo completed no significa automáticamente que pueda restaurarse.  
   
⸻  
   
## 269. Tipos de backup  
```
full
incremental
differential
transaction_log
snapshot
configuration
metadata
export
immutable_archive

```
La estrategia dependerá del componente.  
   
⸻  
   
## 270. Backups completos  
Un backup completo deberá contener toda la información necesaria del recurso.  
Ventajas:  
* restauración más simple;  
* menor dependencia de cadenas.  
Desventajas:  
* mayor tamaño;  
* más tiempo;  
* mayor costo.  
Deberán combinarse con otros métodos.  
   
⸻  
   
## 271. Backups incrementales  
Guardar cambios desde el último backup correspondiente.  
Ventajas:  
* menor tamaño;  
* mayor frecuencia.  
Riesgos:  
* restauración más compleja;  
* dependencia de múltiples archivos;  
* mayor riesgo si una parte de la cadena falla.  
   
⸻  
   
## 272. Backups de transacciones  
PostgreSQL deberá quedar preparado para utilizar mecanismos de recuperación punto en el tiempo.  
Esto permitirá recuperar la base a un momento anterior a:  
* eliminación accidental;  
* migración defectuosa;  
* corrupción;  
* incidente operativo.  
El mecanismo deberá validarse mediante pruebas reales.  
   
⸻  
   
## 273. Recuperación punto en el tiempo  
La plataforma deberá poder seleccionar un momento de recuperación autorizado.  
Ejemplo:  
```
Recover PostgreSQL to:
2026-08-06 01:42:00 UTC

```
Antes de restaurar sobre producción:  
1. Restaurar en ambiente aislado.  
2. Verificar consistencia.  
3. Confirmar el punto correcto.  
4. Preservar producción afectada.  
5. Obtener autorización.  
6. Ejecutar recuperación controlada.  
   
⸻  
   
## 274. Backup de PostgreSQL  
La estrategia deberá considerar:  
* backup lógico;  
* backup físico;  
* transaction logs;  
* snapshots;  
* cifrado;  
* checksums;  
* retención;  
* restauración aislada;  
* consistencia.  
No depender únicamente de:  
```
pg_dump ocasional ejecutado manualmente

```
   
⸻  
   
## 275. Backup lógico  
Podrá utilizarse para:  
* portabilidad;  
* recuperación selectiva;  
* migraciones;  
* verificación;  
* ambientes de prueba anonimizados.  
Deberá incluir:  
* schema;  
* data;  
* extensions;  
* roles necesarios de forma segura;  
* migration version;  
* metadata.  
   
⸻  
   
## 276. Backup físico  
Podrá utilizarse para:  
* bases grandes;  
* recuperación rápida;  
* Point-in-Time Recovery;  
* continuidad avanzada.  
Deberá mantenerse compatible con la versión correspondiente de PostgreSQL.  
   
⸻  
   
## 277. Consistencia de base de datos  
El backup deberá asegurar consistencia transaccional.  
No deberán copiarse archivos activos del volumen de PostgreSQL como si fueran documentos normales.  
Se utilizarán herramientas y métodos compatibles con PostgreSQL.  
   
⸻  
   
## 278. Verificación de PostgreSQL  
Después de cada backup crítico:  
* verificar que el archivo exista;  
* verificar tamaño razonable;  
* validar checksum;  
* validar cifrado;  
* comprobar metadata;  
* comprobar cadena de logs;  
* registrar resultado.  
Periódicamente deberá realizarse una restauración completa.  
   
⸻  
   
## 279. Restauración selectiva  
Cuando sea técnicamente seguro, la plataforma podrá recuperar:  
* tabla;  
* registro;  
* esquema;  
* cliente;  
* configuración;  
* workflow definition.  
La restauración selectiva deberá realizarse en un ambiente aislado antes de insertar datos en producción.  
No ejecutar copias directas sin reconciliación.  
   
⸻  
   
## 280. Restauración y eventos  
Al restaurar datos antiguos deberá considerarse que podrían reaparecer:  
* tareas;  
* pagos pendientes;  
* mensajes;  
* jobs;  
* webhooks;  
* approvals;  
* submissions;  
* notificaciones.  
La recuperación deberá evitar reejecutar acciones externas ya completadas.  
   
⸻  
   
## 281. Protección contra ejecuciones duplicadas  
Después de una restauración se deberán validar:  
* idempotency records;  
* provider references;  
* webhook event IDs;  
* execution authorizations;  
* payment statuses;  
* filing references;  
* communication delivery records.  
No se deberán volver a ejecutar acciones únicamente porque reaparezcan como pendientes.  
   
⸻  
   
## 282. Backup de object storage  
MinIO u object storage deberá proteger:  
* documentos;  
* contratos;  
* firmas;  
* evidencias;  
* reportes;  
* imágenes;  
* grabaciones;  
* exports;  
* incident evidence.  
La estrategia deberá incluir:  
* versioning;  
* replication futura;  
* lifecycle;  
* object lock cuando corresponda;  
* checksums;  
* cifrado.  
   
⸻  
   
## 283. Versionado de objetos  
Los objetos críticos deberán conservar versiones cuando:  
* son reemplazados;  
* son corregidos;  
* se actualizan;  
* se firman;  
* se procesan.  
La eliminación lógica no deberá borrar inmediatamente versiones recuperables.  
   
⸻  
   
## 284. Object Lock  
Para información crítica podrá utilizarse almacenamiento inmutable.  
Ejemplos:  
* audit exports;  
* evidence;  
* backup manifests;  
* incident records;  
* signed documents;  
* backups esenciales.  
La retención inmutable deberá configurarse cuidadosamente para controlar costos y obligaciones legales.  
   
⸻  
   
## 285. Backup de documentos  
El backup de archivos deberá mantener:  
* object ID;  
* document ID;  
* version ID;  
* checksum;  
* classification;  
* encryption metadata;  
* ownership;  
* retention policy;  
* storage path reference.  
No será suficiente copiar blobs sin metadata.  
   
⸻  
   
## 286. Coherencia entre PostgreSQL y storage  
Deberá existir un procedimiento para verificar:  
* documentos referenciados que no existen;  
* objetos sin referencia;  
* versiones faltantes;  
* checksums incompatibles;  
* metadata incompleta.  
Los backups de base y storage deberán poder relacionarse mediante manifests o ventanas coordinadas.  
   
⸻  
   
## 287. Backup de Redis  
Redis no deberá ser la fuente oficial de datos críticos.  
La estrategia podrá proteger:  
* configuración;  
* persisted queue state cuando aplique;  
* locks recuperables;  
* rate-limit configuration;  
* session strategy.  
En muchos escenarios Redis deberá reconstruirse desde PostgreSQL y servicios de dominio.  
   
⸻  
   
## 288. Restauración de Redis  
Antes de restaurar un snapshot antiguo deberá evaluarse el riesgo de reintroducir:  
* sesiones expiradas;  
* locks antiguos;  
* jobs duplicados;  
* rate limits incorrectos;  
* cache desactualizada.  
La opción preferida podrá ser reconstruir Redis vacío y repoblar datos seguros.  
   
⸻  
   
## 289. Backup de colas  
Las colas persistentes deberán tener:  
* durability;  
* acknowledgements;  
* dead-letter;  
* retention;  
* replay control;  
* idempotency.  
La estrategia dependerá del sistema de mensajería elegido.  
No se deberá asumir que restaurar la base de una cola es suficiente para reanudarla correctamente.  
   
⸻  
   
## 290. Recuperación de colas  
Después de una interrupción:  
1. Pausar consumers sensibles.  
2. Inspeccionar mensajes.  
3. Identificar operaciones externas.  
4. Confirmar idempotency.  
5. Separar mensajes corruptos.  
6. Reanudar gradualmente.  
7. Supervisar duplicados.  
   
⸻  
   
## 291. Backup del AI Hub  
Deberán protegerse:  
* Agent Definitions;  
* Agent Versions;  
* Skill Definitions;  
* Skill Versions;  
* Prompt Versions;  
* Tool Definitions;  
* Tool Grants;  
* Routing Policies;  
* Knowledge Source metadata;  
* Evaluation Suites;  
* deployment configuration;  
* incident records;  
* cost records;  
* approval links.  
   
⸻  
   
## 292. Modelos locales  
Los pesos de modelos descargables podrán reconstruirse desde una fuente verificada.  
No siempre será necesario copiarlos en cada backup.  
Deberán conservarse:  
* modelo y versión;  
* hash;  
* source;  
* license;  
* quantization;  
* runtime configuration;  
* deployment configuration.  
Los modelos ajustados internamente sí deberán protegerse.  
   
⸻  
   
## 293. Backup de knowledge bases  
Deberán protegerse:  
* fuente original;  
* versión;  
* metadata;  
* aprobación;  
* chunks;  
* embeddings;  
* índices;  
* permisos;  
* tax year;  
* jurisdicción;  
* vigencia.  
La fuente original y metadata tendrán mayor prioridad que los embeddings regenerables.  
   
⸻  
   
## 294. Vector store  
El vector store deberá clasificarse como:  
```
reconstructible

```
cuando pueda regenerarse desde fuentes aprobadas.  
Aun así, podrán mantenerse snapshots para acelerar recuperación.  
Nunca deberá ser la única ubicación de conocimiento.  
   
⸻  
   
## 295. Regeneración de embeddings  
Deberá existir un job que permita:  
```
Approved sources
→ Parse
→ Chunk
→ Embed
→ Index
→ Validate

```
La regeneración deberá respetar:  
* versiones;  
* permisos;  
* sensibilidad;  
* modelo de embeddings;  
* checksums.  
   
⸻  
   
## 296. Backup de prompts y skills  
Las definiciones deberán:  
* almacenarse estructuradamente;  
* versionarse;  
* exportarse;  
* vincularse al repositorio cuando corresponda;  
* poder restaurarse sin depender de conversaciones históricas.  
No deberán existir prompts críticos únicamente dentro de una interfaz administrativa.  
   
⸻  
   
## 297. Backup de workflows  
Deberán protegerse:  
* Workflow Definitions;  
* versions;  
* stage definitions;  
* transition rules;  
* compensation rules;  
* active workflow instances;  
* timers;  
* event references;  
* idempotency state.  
Las definiciones deberán poder reconstruirse desde configuración versionada.  
   
⸻  
   
## 298. Timers y schedules  
Después de restaurar:  
* revisar timers vencidos;  
* evitar ejecuciones masivas;  
* aplicar grace period;  
* recalcular próximos eventos;  
* detectar duplicados;  
* escalar obligaciones críticas.  
No ejecutar automáticamente todos los jobs atrasados sin control.  
   
⸻  
   
## 299. Backup de configuraciones  
Deberán protegerse:  
* Docker Compose;  
* deployment manifests;  
* Nginx configuration;  
* network policies;  
* monitoring configuration;  
* dashboards;  
* alert rules;  
* feature flag definitions;  
* scheduler definitions;  
* backup policies;  
* retention policies;  
* integration configuration no secreta.  
   
⸻  
   
## 300. Infrastructure as Code  
La infraestructura deberá definirse mediante código cuando sea posible.  
Ejemplos:  
* servidores;  
* redes;  
* firewalls;  
* buckets;  
* databases;  
* IAM;  
* monitoring;  
* DNS;  
* certificates;  
* policies.  
Esto permitirá reconstruir el entorno sin depender de memoria humana.  
   
⸻  
   
## 301. Estado de Infrastructure as Code  
Si la herramienta utiliza state, este deberá:  
* almacenarse remotamente;  
* cifrarse;  
* bloquearse;  
* versionarse;  
* respaldarse;  
* limitarse por entorno;  
* no guardarse en equipos personales como única copia.  
   
⸻  
   
## 302. Backup de secretos  
Los secretos no deberán copiarse en archivos de backup normales sin controles reforzados.  
El Secret Manager deberá tener:  
* su propio mecanismo de respaldo;  
* exportación de emergencia cifrada cuando corresponda;  
* recuperación documentada;  
* separación de claves;  
* control de acceso;  
* rotación posterior a incidente.  
   
⸻  
   
## 303. Recuperación de secretos  
Ante pérdida del Secret Manager:  
1. Validar identidad de recuperación.  
2. Acceder a credenciales de emergencia.  
3. Restaurar el servicio.  
4. Verificar integridad.  
5. Rotar secretos críticos.  
6. Actualizar servicios.  
7. revocar credenciales anteriores.  
8. auditar el proceso.  
   
⸻  
   
## 304. Backup de certificados y claves  
Deberá conservarse de forma segura:  
* metadata;  
* certificate chain;  
* expiration;  
* issuer;  
* associated service;  
* recovery method.  
Las private keys deberán tener controles de seguridad superiores.  
Cuando sea posible, se deberán regenerar certificados en lugar de trasladar claves antiguas.  
   
⸻  
   
## 305. Backup de logs y auditoría  
Deberán diferenciarse:  
## Logs operativos  
Podrán tener menor retención.  
## Auditoría  
Deberá conservarse según política de negocio y cumplimiento.  
## Evidencia de incidentes  
Podrá requerir retención protegida y legal hold.  
   
⸻  
   
## 306. Copias de auditoría  
Los registros importantes deberán poder replicarse o archivarse en almacenamiento separado.  
El sistema comprometido no deberá tener capacidad ilimitada para eliminar su propio historial.  
   
⸻  
   
## 307. Backup de dashboards y alertas  
Las configuraciones de:  
* Grafana;  
* Prometheus;  
* OpenTelemetry;  
* alertas;  
* exporters;  
* runbooks;  
deberán estar versionadas o exportadas.  
No depender de configuraciones creadas manualmente en una interfaz.  
   
⸻  
   
## 308. Backup del repositorio  
GitHub será la fuente principal del código, pero deberá existir una estrategia para:  
* repositorio espejo;  
* exportación periódica;  
* protección de branches;  
* recuperación de issues críticos;  
* documentación;  
* releases;  
* tags.  
No depender de una única cuenta administrativa.  
   
⸻  
   
## 309. Container Registry  
Las imágenes importantes deberán:  
* estar versionadas;  
* tener digest;  
* tener política de retención;  
* poder reconstruirse;  
* conservar releases activas;  
* conservar versión previa para rollback.  
El código y pipeline deberán permitir regenerar imágenes.  
   
⸻  
   
## 310. Ambientes de backup  
Los backups de producción no deberán restaurarse directamente en development sin:  
* autorización;  
* anonimización;  
* reducción;  
* control de acceso;  
* propósito documentado.  
Los datos reales no deberán convertirse en datos de prueba ordinarios.  
   
⸻  
   
## 311. Anonimización para pruebas  
Cuando sea necesario crear datasets de prueba:  
* eliminar identidad;  
* tokenizar;  
* sustituir documentos;  
* reemplazar emails;  
* reemplazar teléfonos;  
* eliminar secretos;  
* evitar reidentificación;  
* registrar dataset y expiración.  
   
⸻  
   
## 312. Cifrado de backups  
Todos los backups sensibles deberán cifrarse:  
* en tránsito;  
* en reposo;  
* antes de almacenarse cuando corresponda.  
Las claves deberán mantenerse separadas del backup.  
   
⸻  
   
## 313. Checksums  
Cada backup deberá tener checksum o mecanismo equivalente.  
El checksum permitirá detectar:  
* corrupción;  
* transferencia incompleta;  
* alteración;  
* archivo truncado.  
La verificación deberá automatizarse.  
   
⸻  
   
## 314. Backup Manifest  
Cada conjunto deberá generar un manifest.  
Ejemplo conceptual:  
```
{
  "backupId": "BKP-2026-08-06-001",
  "environment": "production",
  "createdAt": "2026-08-06T07:00:00Z",
  "resources": [
    {
      "type": "postgresql",
      "version": "17",
      "checksum": "sha256:...",
      "status": "verified"
    },
    {
      "type": "object_storage",
      "snapshotReference": "OBJ-SNAP-991",
      "status": "verified"
    }
  ],
  "encryptionKeyVersion": "KEY-8",
  "retentionClass": "critical-90d"
}

```
   
⸻  
   
## 315. Catálogo de backups  
Deberá existir un catálogo consultable con:  
* backup ID;  
* fecha;  
* ambiente;  
* recurso;  
* ubicación;  
* tamaño;  
* status;  
* retención;  
* cifrado;  
* verification;  
* restore tests;  
* expiración.  
No depender de buscar archivos manualmente.  
   
⸻  
   
## 316. Acceso a backups  
Solo usuarios y servicios autorizados podrán:  
* listar;  
* descargar;  
* restaurar;  
* eliminar;  
* cambiar retención;  
* acceder a claves.  
El acceso deberá requerir:  
* MFA;  
* propósito;  
* auditoría;  
* reautenticación para operaciones críticas.  
   
⸻  
   
## 317. Separación de funciones  
Idealmente:  
* un servicio crea backups;  
* otro rol autoriza restauraciones críticas;  
* otro sistema almacena copias;  
* auditoría registra eventos.  
Una credencial de producción comprometida no deberá permitir borrar todas las copias.  
   
⸻  
   
## 318. Eliminación de backups  
La eliminación deberá respetar:  
* retención;  
* legal hold;  
* object lock;  
* política;  
* autorización;  
* auditoría.  
No permitir eliminación masiva mediante una acción ordinaria.  
   
⸻  
   
## 319. Retención  
Podrán definirse clases:  
```
hourly_short_term
daily
weekly
monthly
annual
immutable_critical
legal_hold

```
Los periodos definitivos dependerán de:  
* volumen;  
* costo;  
* tipo de servicio;  
* obligación;  
* riesgo;  
* contratos;  
* privacidad.  
   
⸻  
   
## 320. Política de ciclo de vida  
El storage deberá automatizar:  
* transición a almacenamiento más económico;  
* compresión;  
* archivado;  
* expiración;  
* eliminación permitida;  
* conservación inmutable;  
* revisión de costos.  
   
⸻  
   
## 321. Monitoreo de backups  
Métricas:  
* jobs completed;  
* jobs failed;  
* backup age;  
* backup size;  
* duration;  
* storage usage;  
* verification failures;  
* missing backups;  
* restore test age;  
* RPO risk;  
* expiring retention;  
* immutable copy status.  
   
⸻  
   
## 322. Alertas de backup  
Generar alerta cuando:  
* un backup crítico falle;  
* el backup más reciente supere el RPO;  
* checksum falle;  
* almacenamiento se llene;  
* una copia inmutable no exista;  
* la clave no esté disponible;  
* la restauración de prueba falle;  
* el catálogo no coincida;  
* una eliminación sea solicitada;  
* cambie una política.  
   
⸻  
   
## 323. Restauraciones de prueba  
Las restauraciones deberán probarse de forma periódica.  
Tipos:  
```
file_restore_test
database_restore_test
point_in_time_restore_test
full_environment_restore_test
application_recovery_test
disaster_recovery_exercise

```
   
⸻  
   
## 324. Restore Test Record  
```
id
backupId
testType
environment
requestedBy
approvedBy
startedAt
completedAt
status
dataIntegrityStatus
applicationValidationStatus
measuredRpo
measuredRto
issues
evidenceReference
createdAt

```
   
⸻  
   
## 325. Restauración de archivo  
Deberá probar:  
* localización del documento;  
* versión correcta;  
* checksum;  
* metadata;  
* decrypt;  
* acceso;  
* vínculo con PostgreSQL.  
   
⸻  
   
## 326. Restauración de base de datos  
Deberá probar:  
* backup;  
* transaction logs;  
* extensions;  
* migrations;  
* users;  
* permissions;  
* application compatibility;  
* row counts;  
* constraints;  
* critical queries.  
   
⸻  
   
## 327. Validación funcional posterior  
Una restauración no estará completa hasta verificar:  
* login;  
* cliente;  
* organization;  
* service order;  
* document access;  
* tasks;  
* approval;  
* payment history;  
* audit;  
* workflows;  
* forms;  
* AI configuration.  
   
⸻  
   
## 328. Ambiente aislado de recuperación  
Las pruebas deberán ejecutarse en una red aislada.  
No deberán:  
* enviar emails reales;  
* enviar WhatsApp;  
* ejecutar refunds;  
* presentar filings;  
* llamar APIs de producción;  
* procesar webhooks;  
* enviar applications;  
* activar browser workers.  
   
⸻  
   
## 329. Safe Restore Mode  
La aplicación deberá quedar preparada para un modo de restauración.  
Características:  
```
External writes disabled
Notifications disabled
Payments read-only
Browser workers disabled
AI external tools disabled
Webhooks quarantined
Schedulers paused
Workers restricted
Admin-only access

```
   
⸻  
   
## 330. Orden de recuperación  
Orden conceptual:  
```
1. Seguridad y acceso
2. Redes y DNS
3. Secret Manager
4. Storage y backups
5. PostgreSQL
6. Object storage
7. Authentication
8. Backend API
9. Audit
10. Workflows and queues
11. Client portal
12. Payments and reconciliation
13. Communications
14. AI Hub basic services
15. Secondary features

```
El orden final deberá documentarse por dependencias.  
   
⸻  
   
## 331. Runbooks  
Deberán existir procedimientos para:  
* PostgreSQL corruption;  
* accidental delete;  
* object storage loss;  
* ransomware;  
* server loss;  
* region outage;  
* bad migration;  
* compromised secret;  
* GitHub unavailable;  
* container registry unavailable;  
* GPU node loss;  
* payment provider outage;  
* total production loss.  
   
⸻  
   
## 332. Runbook mínimo  
Cada runbook deberá contener:  
```
Purpose
Trigger
Severity
Owner
Required permissions
Safety checks
Dependencies
Recovery steps
Validation steps
Rollback
Communication
Evidence
Escalation
Post-incident actions

```
   
⸻  
   
## 333. Error humano  
Ante eliminación accidental:  
1. Detener procesos relacionados.  
2. Identificar alcance.  
3. Preservar evidencia.  
4. Evitar cambios adicionales.  
5. Seleccionar punto de recuperación.  
6. Restaurar en aislamiento.  
7. Comparar.  
8. Aprobar merge o restore.  
9. Reconciliar eventos externos.  
10. Documentar.  
   
⸻  
   
## 334. Migración defectuosa  
Flujo:  
```
Detect failure
→ stop deployment
→ block writes if needed
→ assess backward compatibility
→ rollback application
→ rollback or forward-fix schema
→ validate data
→ restore if corruption exists
→ monitor

```
No asumir que toda migración puede revertirse automáticamente.  
   
⸻  
   
## 335. Corrupción de datos  
El sistema deberá:  
* identificar cuándo comenzó;  
* determinar recursos afectados;  
* detener writers;  
* preservar la base dañada;  
* restaurar copia;  
* aplicar transaction logs hasta punto seguro;  
* reconciliar cambios válidos posteriores;  
* verificar integridad.  
   
⸻  
   
## 336. Ransomware  
Procedimiento conceptual:  
```
Isolate affected systems
→ disable compromised credentials
→ preserve evidence
→ activate incident response
→ validate immutable backups
→ rebuild clean infrastructure
→ rotate secrets
→ restore data
→ verify integrity
→ reopen gradually

```
No restaurar sobre hosts potencialmente comprometidos.  
   
⸻  
   
## 337. Servidor principal perdido  
La plataforma deberá poder reconstruirse usando:  
* Infrastructure as Code;  
* Docker images;  
* repository;  
* Secret Manager recovery;  
* PostgreSQL backup;  
* object storage backup;  
* DNS access;  
* certificates;  
* runbooks.  
No depender de la recuperación del disco original.  
   
⸻  
   
## 338. Nodo GPU perdido  
La pérdida del nodo GPU no deberá detener funciones básicas.  
Acciones:  
* marcar node offline;  
* cancelar jobs inseguros;  
* preservar queue;  
* usar fallback permitido;  
* reconstruir nodo;  
* descargar modelos verificados;  
* restaurar configuraciones;  
* reanudar gradualmente.  
Los documentos temporales del nodo no deberán ser la única copia.  
   
⸻  
   
## 339. Pérdida del proveedor cloud  
Deberá existir inventario de dependencias externas y estrategias como:  
* proveedor alterno;  
* proceso manual;  
* modo degradado;  
* exportación de datos;  
* backup fuera del proveedor;  
* DNS controlado separadamente;  
* fallback local.  
No todos los servicios requerirán failover inmediato, pero deberán tener un plan.  
   
⸻  
   
## 340. Pérdida total de producción  
Ejercicio conceptual:  
```
Assume:
- production server unavailable;
- primary storage unavailable;
- normal credentials revoked.

Recover using:
- emergency identity;
- isolated backup account;
- repository mirror;
- Infrastructure as Code;
- external backup;
- recovery runbooks.

```
Esta prueba deberá realizarse periódicamente de manera controlada.  
   
⸻  
   
## 341. Comunicación de continuidad  
Durante una interrupción deberá existir:  
* canal interno alternativo;  
* lista de responsables;  
* árbol de escalamiento;  
* mensajes preparados;  
* status page futura;  
* comunicación a clientes cuando corresponda;  
* actualización periódica;  
* cierre del incidente.  
No deberá prometerse un tiempo de recuperación sin evidencia.  
   
⸻  
   
## 342. Instrucciones finales para Codex  
Antes de implementar backups y Disaster Recovery:  
1. Lee los módulos 1 al 25.  
2. Lee las partes 1 a 6 del Módulo 26.  
3. Inventaría todos los datos y sistemas.  
4. Clasifica cada componente por criticidad.  
5. Define owner técnico y de negocio.  
6. Define RPO.  
7. Define RTO.  
8. No trates replicación como backup.  
9. Implementa estrategia 3-2-1 proporcional.  
10. Crea una copia aislada o inmutable para datos críticos.  
11. Implementa backups automáticos.  
12. Implementa catálogo de backups.  
13. Implementa manifests.  
14. Implementa checksums.  
15. Implementa cifrado.  
16. Separa claves y backups.  
17. Implementa backup lógico de PostgreSQL.  
18. Implementa backup físico cuando corresponda.  
19. Implementa Point-in-Time Recovery.  
20. Prueba restauración punto en el tiempo.  
21. Protege transaction logs.  
22. No copies archivos activos de PostgreSQL manualmente.  
23. Implementa versioning en object storage.  
24. Implementa backup de metadata documental.  
25. Verifica coherencia entre PostgreSQL y storage.  
26. Trata Redis como reconstruible cuando corresponda.  
27. Protege las colas persistentes.  
28. Implementa recuperación segura de mensajes.  
29. Protege idempotency records.  
30. Evita duplicar acciones después de restaurar.  
31. Protege AI Agent Definitions.  
32. Protege Skills.  
33. Protege Prompts.  
34. Protege Workflows.  
35. Protege Approval Policies.  
36. Protege Form Definitions.  
37. Protege Knowledge Sources.  
38. Permite regenerar embeddings.  
39. No uses el vector store como única fuente.  
40. Versiona Infrastructure as Code.  
41. Protege su state.  
42. Protege configuraciones.  
43. Implementa recuperación del Secret Manager.  
44. Rota secretos después de incidentes relevantes.  
45. Protege logs de auditoría.  
46. Versiona dashboards y alertas.  
47. Mantén mirror del repositorio.  
48. Mantén imágenes de rollback.  
49. No uses datos reales en testing sin anonimización.  
50. Implementa retention classes.  
51. Implementa lifecycle.  
52. Limita acceso a backups.  
53. Requiere MFA.  
54. Audita downloads y restores.  
55. Separa capacidad de crear y eliminar backups.  
56. Implementa monitoreo.  
57. Implementa alertas.  
58. Implementa restore tests.  
59. Implementa Safe Restore Mode.  
60. Pausa integraciones externas durante pruebas.  
61. Prueba recuperación de archivos.  
62. Prueba recuperación de PostgreSQL.  
63. Prueba PITR.  
64. Prueba reconstrucción completa.  
65. Mide RPO real.  
66. Mide RTO real.  
67. Crea runbooks.  
68. Prueba pérdida del servidor.  
69. Prueba pérdida del nodo GPU.  
70. Prueba credenciales comprometidas.  
71. Prueba ransomware mediante simulación segura.  
72. Documenta dependencias.  
73. Documenta orden de recuperación.  
74. Documenta comunicación.  
75. No marques un backup como válido sin verificación.  
76. No marques Disaster Recovery como listo sin una restauración completa.  
77. No almacenes todas las copias bajo la misma credencial.  
78. No permitas que producción elimine libremente copias inmutables.  
79. No restaures datos antiguos sin reconciliar acciones externas.  
80. Mantén evidencia de cada ejercicio.  
Antes de entregar, verifica:  
* ¿Existe más de una copia de los datos críticos?  
* ¿Existe una copia fuera del servidor principal?  
* ¿Existe una copia protegida contra eliminación?  
* ¿PostgreSQL puede recuperarse a un punto específico?  
* ¿Los documentos conservan metadata y versiones?  
* ¿La base y object storage pueden reconciliarse?  
* ¿Redis puede reconstruirse sin afectar datos oficiales?  
* ¿Las colas pueden reanudarse sin duplicar acciones?  
* ¿Los idempotency records sobreviven?  
* ¿Los workflows y approvals pueden restaurarse?  
* ¿Las fuentes del AI Hub pueden reconstruir embeddings?  
* ¿La infraestructura puede reconstruirse desde código?  
* ¿Los secretos tienen un procedimiento de recuperación?  
* ¿Los backups están cifrados?  
* ¿Las claves están separadas?  
* ¿Los checksums se verifican?  
* ¿Los backups fallidos generan alerta?  
* ¿Las restauraciones se prueban?  
* ¿Existe Safe Restore Mode?  
* ¿Las pruebas no ejecutan acciones externas?  
* ¿Existe un orden de recuperación?  
* ¿Existen runbooks?  
* ¿El nodo GPU puede perderse sin detener la plataforma?  
* ¿SG Solutions puede reconstruirse si desaparece el servidor principal?  
* ¿El RPO y RTO medidos coinciden con los objetivos?  
  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 7 — Infraestructura de IA, Servidor Permanente, Nodo GPU, Model Routing y Operación Híbrida  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 6 **Secciones incluidas:** 343–440 **Audiencia:** Codex, desarrolladores, DevOps, AI Engineers, administradores, seguridad, operaciones y owner **Idioma del código:** Inglés **Modelo operativo:** Infraestructura híbrida local-first, tolerante a fallos y supervisada  
   
⸻  
   
## 343. Objetivo  
Esta parte define cómo deberá operar la infraestructura de inteligencia artificial de SG Solutions.  
La arquitectura deberá combinar:  
```
Servidor permanente de bajo consumo
+
Nodo gamer con GPU
+
Proveedores cloud autorizados
+
Procesamiento humano de respaldo

```
El objetivo será aprovechar modelos locales y capacidad propia sin convertir ninguna computadora personal en un punto único de fallo.  
La plataforma deberá continuar atendiendo funciones básicas aunque:  
* el nodo gamer esté apagado;  
* la GPU esté ocupada;  
* un modelo no cargue;  
* el proveedor cloud falle;  
* Internet se interrumpa parcialmente;  
* exista un límite de costos;  
* una ejecución avanzada tenga que esperar;  
* una fuente de conocimiento no esté disponible;  
* una herramienta externa falle.  
   
⸻  
   
## 344. Principio central  
La disponibilidad de SG Solutions no deberá depender de un único modelo, proveedor o dispositivo.  
El flujo deberá ser:  
```
Request
→ Classify
→ Determine sensitivity
→ Determine complexity
→ Select execution tier
→ Check availability
→ Check cost policy
→ Route
→ Execute
→ Validate
→ Fallback or human escalation

```
No deberá utilizarse:  
```
Request
→ Send everything to the largest model

```
   
⸻  
   
## 345. Capas de infraestructura  
La infraestructura deberá dividirse en cuatro capas:  
```
Tier A — Always-On Lightweight AI
Tier B — Local GPU Advanced AI
Tier C — Authorized Cloud AI
Tier D — Human Review or Manual Processing

```
Cada tarea deberá poder escalar o degradarse entre capas según política.  
   
⸻  
   
## 346. Tier A — IA permanente  
El servidor permanente deberá estar disponible las 24 horas.  
Responsabilidades:  
* chat público;  
* preguntas frecuentes;  
* clasificación;  
* detección de intención;  
* routing;  
* traducción básica;  
* resúmenes pequeños;  
* extracción sencilla;  
* embeddings;  
* RAG ligero;  
* creación de leads;  
* citas;  
* tareas de bajo riesgo;  
* detección de handoff;  
* monitoreo del nodo GPU;  
* procesamiento de colas;  
* fallback controlado.  
   
⸻  
   
## 347. Tier B — Nodo GPU  
El nodo GPU deberá utilizarse para:  
* razonamiento avanzado;  
* análisis de documentos extensos;  
* generación de código;  
* revisión profunda;  
* procesamiento multimodal;  
* comparación de expedientes;  
* análisis multi-documento;  
* modelos grandes;  
* evaluaciones;  
* batch processing;  
* reindexación;  
* generación de reportes complejos;  
* experimentos internos autorizados.  
No deberá utilizarse automáticamente para cualquier conversación.  
   
⸻  
   
## 348. Tier C — Proveedores cloud  
Los proveedores cloud podrán utilizarse para:  
* capacidad temporal;  
* fallback;  
* modelos especializados;  
* tareas que requieran mayor calidad;  
* picos de demanda;  
* voz;  
* visión;  
* embeddings;  
* tareas donde la política permita procesamiento externo.  
Su uso deberá depender de:  
* sensibilidad;  
* consentimiento;  
* contrato;  
* costo;  
* disponibilidad;  
* región;  
* política de retención;  
* autorización administrativa.  
   
⸻  
   
## 349. Tier D — Revisión humana  
Cuando ninguna ruta automática sea segura o suficiente:  
```
Create task
→ preserve context
→ assign specialist
→ notify requester
→ continue manually

```
La plataforma no deberá inventar una respuesta para evitar crear un handoff.  
   
⸻  
   
## 350. Arquitectura conceptual  
```
Channels and Workflows
        ↓
AI Gateway
        ↓
Policy and Scope Engine
        ↓
Model Router
        ├── Always-On AI Server
        ├── GPU Node
        ├── Authorized Cloud Providers
        └── Human Review Queue
        ↓
Tool Gateway
        ↓
Domain Services
        ↓
Output Validation
        ↓
Review and Approval

```
   
⸻  
   
## 351. Servidor permanente  
El servidor permanente deberá ejecutar los componentes esenciales.  
Ejemplo conceptual:  
```
ai-gateway
model-router
lightweight-model-runtime
embedding-service
rag-service
queue-dispatcher
node-monitor
output-validator
cost-controller

```
Estos componentes podrán estar distribuidos en contenedores separados.  
   
⸻  
   
## 352. Requisitos del servidor permanente  
Deberá priorizar:  
* estabilidad;  
* bajo consumo;  
* operación continua;  
* reinicio automático;  
* almacenamiento rápido;  
* suficiente RAM;  
* seguridad;  
* monitoreo;  
* red estable;  
* UPS cuando sea viable;  
* mantenimiento sencillo.  
No deberá dimensionarse suponiendo que ejecutará siempre los modelos más grandes.  
   
⸻  
   
## 353. Funciones que deberán funcionar sin GPU  
Aunque el nodo GPU esté apagado, deberán continuar:  
* autenticación;  
* portal;  
* CRM;  
* pagos;  
* documentos;  
* tareas;  
* aprobaciones;  
* workflows;  
* citas;  
* mensajes;  
* chat básico;  
* clasificación;  
* FAQ;  
* creación de leads;  
* routing;  
* creación de handoffs;  
* procesamiento administrativo.  
   
⸻  
   
## 354. Modo de capacidad reducida  
Cuando solo esté disponible el servidor permanente:  
```
Platform status:
Operational

Advanced AI status:
Limited

```
La interfaz deberá diferenciar:  
* plataforma fuera de servicio;  
* IA avanzada no disponible;  
* tarea avanzada en cola;  
* servicio parcialmente degradado.  
   
⸻  
   
## 355. Nodo GPU  
El nodo GPU será una identidad técnica independiente.  
No deberá tratarse como:  
* una extensión confiable automática de la red;  
* un equipo con acceso total;  
* una base de datos secundaria;  
* almacenamiento permanente;  
* un administrador de producción.  
Deberá registrarse como:  
```
AiComputeNode

```
   
⸻  
   
## 356. Tipos de nodos  
```
always_on_cpu
always_on_low_power_gpu
gaming_gpu
cloud_gpu
cloud_api
embedding_node
speech_node
evaluation_node
custom

```
La arquitectura deberá permitir añadir nuevos nodos.  
   
⸻  
   
## 357. Estados del nodo  
```
registering
online
idle
warming
loading_model
busy
saturated
degraded
draining
maintenance
offline
quarantined
unknown

```
   
⸻  
   
## 358. Registro del nodo  
Antes de procesar trabajos, el nodo deberá registrar:  
* identidad;  
* certificado;  
* capacidades;  
* sistema operativo;  
* runtime;  
* GPU;  
* VRAM;  
* RAM;  
* almacenamiento disponible;  
* modelos instalados;  
* versiones;  
* herramientas;  
* ubicación lógica;  
* política de datos;  
* última verificación.  
   
⸻  
   
## 359. AiComputeNode  
Campos conceptuales:  
```
id
code
nodeType
displayName
status
trustLevel
capabilitySet
operatingSystem
runtimeVersion
gpuVendor
gpuModel
vramBytes
memoryBytes
storageAvailableBytes
networkProfile
dataPolicy
powerPolicy
currentModelId
currentJobId
queueDepth
lastHeartbeatAt
registeredAt
updatedAt

```
   
⸻  
   
## 360. Identidad del nodo  
Cada nodo deberá utilizar:  
* credencial propia;  
* certificado;  
* token de corta duración;  
* autorización limitada;  
* rotación;  
* revocación;  
* registro de actividad.  
No utilizar credenciales personales del owner como identidad técnica.  
   
⸻  
   
## 361. Conexión del nodo GPU  
La conexión deberá realizarse mediante:  
* VPN;  
* red privada;  
* mTLS;  
* túnel seguro;  
* outbound connection iniciada por el nodo;  
* solución equivalente aprobada.  
No exponer directamente un puerto de inferencia a Internet.  
   
⸻  
   
## 362. Conexión outbound  
Preferiblemente, el nodo deberá iniciar una conexión saliente segura hacia el servidor.  
Ventajas:  
* evita abrir puertos;  
* facilita NAT;  
* reduce exposición;  
* simplifica revocación;  
* permite heartbeats;  
* facilita control central.  
   
⸻  
   
## 363. Heartbeat  
El nodo deberá enviar heartbeat periódico.  
Datos permitidos:  
```
status
timestamp
gpuUtilization
vramUsed
memoryUsed
temperature
powerDraw
queueDepth
loadedModel
activeJob
runtimeHealth

```
No deberá incluir datos de clientes.  
   
⸻  
   
## 364. Heartbeat perdido  
Si se pierde el heartbeat:  
```
online
→ unknown
→ offline

```
El tiempo para cada transición deberá ser configurable.  
Los trabajos activos deberán marcarse:  
```
execution_state_unknown

```
antes de reintentarlos.  
   
⸻  
   
## 365. Detección de trabajos en estado desconocido  
Si el nodo desaparece durante un trabajo:  
1. No asumir fracaso inmediato.  
2. Esperar timeout.  
3. Consultar job ledger.  
4. Verificar output.  
5. Verificar efectos externos.  
6. Determinar si es reintentable.  
7. Aplicar idempotencia.  
8. Reencolar o escalar.  
   
⸻  
   
## 366. Registro de capacidades  
Capacidades posibles:  
```
text_generation
structured_output
tool_use
coding
vision
ocr_assistance
document_analysis
embeddings
reranking
speech_to_text
text_to_speech
fine_tuning
evaluation
batch_inference

```
El router no deberá enviar una tarea a un nodo que no declare la capacidad necesaria.  
   
⸻  
   
## 367. Runtime de modelos  
La arquitectura podrá soportar:  
* Ollama;  
* llama.cpp;  
* vLLM;  
* ONNX Runtime;  
* TensorRT;  
* runtimes especializados;  
* proveedores cloud.  
La selección dependerá del hardware y del tipo de modelo.  
El dominio de SG Solutions no deberá depender de una API específica de runtime.  
   
⸻  
   
## 368. Adaptador de runtime  
Crear una abstracción conceptual:  
```
ModelRuntimeProvider

```
Implementaciones:  
```
OllamaRuntimeProvider
LlamaCppRuntimeProvider
VllmRuntimeProvider
OnnxRuntimeProvider
CloudModelRuntimeProvider

```
   
⸻  
   
## 369. Model Registry  
Todos los modelos disponibles deberán registrarse.  
Cada registro deberá incluir:  
```
modelCode
modelFamily
provider
runtime
version
quantization
capabilities
minimumVram
minimumRam
contextWindow
license
source
checksum
dataPolicy
status
approvedUses
prohibitedUses

```
   
⸻  
   
## 370. Estados de modelo  
```
discovered
pending_review
approved
downloading
available
loading
active
degraded
disabled
superseded
quarantined
retired

```
Un modelo descargado no deberá quedar automáticamente aprobado para producción.  
   
⸻  
   
## 371. Verificación de modelos  
Antes de activar un modelo:  
* verificar fuente;  
* verificar checksum;  
* revisar licencia;  
* revisar formato;  
* analizar riesgos;  
* ejecutar evaluaciones;  
* probar rendimiento;  
* probar privacidad;  
* probar tools;  
* probar idioma;  
* probar prompt injection;  
* aprobar usos.  
   
⸻  
   
## 372. Model Artifact  
Campos:  
```
id
modelDefinitionId
runtimeType
version
quantization
sourceReference
checksum
sizeBytes
licenseReference
downloadedAt
verifiedAt
verificationStatus
storagePathReference
createdAt

```
   
⸻  
   
## 373. Modelos no confiables  
Un modelo proveniente de una fuente desconocida deberá permanecer:  
```
quarantined

```
No podrá acceder a:  
* datos reales;  
* tools;  
* producción;  
* documentos;  
* redes internas.  
   
⸻  
   
## 374. Carga de modelos  
La carga deberá considerar:  
* VRAM;  
* RAM;  
* otros modelos;  
* prioridad;  
* tiempo;  
* temperatura;  
* tareas activas;  
* contexto;  
* costo de cambio.  
El router deberá evitar descargar y cargar modelos repetidamente sin necesidad.  
   
⸻  
   
## 375. Model Warm Pool  
Podrá mantenerse un conjunto de modelos cargados.  
Ejemplo:  
```
small_general_model
embedding_model
coding_model
advanced_reasoning_model

```
La composición dependerá de capacidad y demanda.  
   
⸻  
   
## 376. Descarga de modelo  
Un modelo podrá descargarse de memoria cuando:  
* esté inactivo;  
* exista presión de VRAM;  
* llegue una tarea prioritaria;  
* cambie la ventana operativa;  
* se active mantenimiento.  
La descarga no deberá eliminar el artefacto del disco.  
   
⸻  
   
## 377. Programación de capacidad  
Podrá definirse:  
```
business_hours_profile
night_batch_profile
owner_active_profile
energy_saving_profile
maintenance_profile

```
Cada perfil podrá controlar:  
* modelos cargados;  
* concurrencia;  
* consumo;  
* temperatura;  
* nube permitida;  
* prioridad.  
   
⸻  
   
## 378. Model Routing  
El router deberá considerar:  
```
Agent
Skill
Purpose
Risk
Sensitivity
Complexity
Required capabilities
Context size
Language
Latency target
Node availability
Model quality
Cost
Energy policy
Queue age

```
   
⸻  
   
## 379. Clasificación de complejidad  
```
trivial
low
moderate
high
very_high
specialized

```
Ejemplos:  
## Trivial  
FAQ o clasificación.  
## Moderate  
Resumen de expediente.  
## High  
Análisis de múltiples documentos.  
## Specialized  
Código, taxes complejos, visión o voz.  
   
⸻  
   
## 380. Política de sensibilidad  
```
public
internal
confidential
financial
credit
tax
identity
restricted
local_only

```
La sensibilidad podrá excluir proveedores o nodos.  
   
⸻  
   
## 381. Local-only  
Las tareas local_only solo podrán ejecutarse en nodos autorizados.  
Ejemplos:  
* identidad;  
* documentos restringidos;  
* full credit report;  
* tax return completa;  
* secretos;  
* credenciales.  
Si no existe capacidad local:  
```
queue
or
human review

```
No cloud automático.  
   
⸻  
   
## 382. Routing Decision  
Cada decisión deberá registrar:  
```
requestId
agentId
purpose
complexity
sensitivity
requiredCapabilities
candidateNodes
selectedNode
selectedModel
fallbackPolicy
decisionReason
estimatedCost
estimatedWait
createdAt

```
   
⸻  
   
## 383. Routing explicable  
El panel interno podrá mostrar:  
Se utilizó el modelo local avanzado porque la tarea contenía información tributaria y requería análisis de documentos extensos.  
No mostrar detalles técnicos innecesarios al cliente.  
   
⸻  
   
## 384. Routing determinista y asistido  
Las políticas críticas deberán ser deterministas.  
La IA podrá ayudar a clasificar complejidad, pero no podrá:  
* cambiar sensibilidad;  
* autorizar cloud;  
* añadir herramientas;  
* ignorar límites;  
* alterar políticas.  
   
⸻  
   
## 385. Fallback Chain  
Ejemplo conceptual:  
```
Primary:
Local advanced model

Secondary:
Authorized cloud model with redaction

Tertiary:
Lightweight local model with limited result

Final:
Human specialist queue

```
Cada agente deberá tener una cadena aprobada.  
   
⸻  
   
## 386. Cloud fallback bloqueado  
El fallback cloud deberá bloquearse cuando:  
* datos local-only;  
* consentimiento ausente;  
* proveedor no aprobado;  
* límite alcanzado;  
* incidente activo;  
* región incorrecta;  
* contrato vencido;  
* kill switch activado.  
   
⸻  
   
## 387. Modo sin conexión externa  
La plataforma deberá poder operar en un modo donde:  
* cloud AI esté desactivado;  
* browsing esté desactivado;  
* proveedores externos de modelos estén desactivados;  
* solo funcionen nodos locales;  
* tareas no disponibles pasen a cola.  
   
⸻  
   
## 388. AI Job Queue  
Las solicitudes no interactivas deberán procesarse mediante una cola.  
Tipos:  
```
interactive
near_real_time
background
batch
maintenance
evaluation
embedding
indexing
coding
document_analysis

```
   
⸻  
   
## 389. Prioridades de trabajo  
```
critical
urgent
high
normal
low
batch
maintenance

```
Ejemplos:  
* atención autenticada en vivo: high;  
* aprobación bloqueada: urgent;  
* reindexación: batch;  
* evaluación nocturna: maintenance.  
   
⸻  
   
## 390. AI Job  
Campos conceptuales:  
```
id
jobType
agentRunId
requestingService
clientId
serviceOrderId
priority
sensitivity
requiredCapabilities
preferredModelId
preferredNodeId
status
queuedAt
availableAt
startedAt
completedAt
attemptCount
maxAttempts
timeoutAt
idempotencyKey
outputReference
errorCode
createdAt
updatedAt

```
   
⸻  
   
## 391. Estados de AI Job  
```
created
queued
routing
waiting_for_node
waiting_for_model
running
streaming
waiting_for_tool
waiting_for_approval
completed
completed_with_warning
failed
timed_out
cancelled
dead_lettered
unknown

```
   
⸻  
   
## 392. Fair Scheduling  
El scheduler deberá evitar que:  
* un cliente monopolice la GPU;  
* un batch bloquee atención interactiva;  
* una evaluación detenga producción;  
* un agente cree miles de jobs;  
* una tarea enorme bloquee todas las demás.  
   
⸻  
   
## 393. Límites por consumidor  
Podrán definirse límites por:  
* cliente;  
* usuario;  
* agente;  
* servicio;  
* canal;  
* modelo;  
* nodo;  
* día;  
* hora;  
* plan;  
* prioridad.  
   
⸻  
   
## 394. Concurrencia  
Cada nodo deberá declarar:  
```
maximumConcurrentJobs
maximumInteractiveJobs
maximumBatchJobs
maximumVisionJobs
maximumContextTokens

```
La concurrencia no deberá depender únicamente de la cantidad de GPU.  
   
⸻  
   
## 395. Backpressure  
Cuando la capacidad esté llena:  
* no aceptar trabajos ilimitados;  
* aumentar espera;  
* aplicar rate limit;  
* mover batch;  
* rechazar tareas opcionales;  
* usar fallback;  
* escalar;  
* informar estado.  
   
⸻  
   
## 396. Queue Age  
La edad de la tarea deberá influir en prioridad.  
Una tarea normal no deberá esperar indefinidamente porque llegan continuamente tareas high.  
Podrá implementarse:  
```
priority aging

```
   
⸻  
   
## 397. Timeouts  
Deberán existir timeouts separados para:  
* routing;  
* node assignment;  
* model loading;  
* inference;  
* tool calls;  
* output validation;  
* streaming;  
* whole job.  
No utilizar un único timeout global.  
   
⸻  
   
## 398. Cancelación  
El usuario o sistema podrá cancelar trabajos cuando:  
* no hayan producido efectos;  
* la política lo permita;  
* no estén en una etapa irreversible.  
La cancelación deberá propagarse al nodo.  
   
⸻  
   
## 399. Reintentos  
Un trabajo podrá reintentarse cuando:  
* timeout temporal;  
* nodo desconectado;  
* runtime reiniciado;  
* proveedor rate limited;  
* modelo no cargó;  
* error transitorio.  
No reintentar automáticamente:  
* validación fallida;  
* política bloqueada;  
* datos inválidos;  
* acción externa incierta;  
* output inseguro.  
   
⸻  
   
## 400. Idempotencia  
Todos los jobs deberán tener:  
```
idempotencyKey

```
Especialmente cuando puedan:  
* crear documentos;  
* crear tareas;  
* crear mensajes;  
* crear approval requests;  
* actualizar perfiles;  
* llamar herramientas.  
   
⸻  
   
## 401. Dead-Letter Queue  
Después de exceder reintentos:  
```
job
→ dead_letter
→ review task
→ operator decision

```
La cola no deberá ocultar trabajos fallidos.  
   
⸻  
   
## 402. Resultados parciales  
Un job podrá generar:  
* resumen parcial;  
* páginas procesadas;  
* secciones faltantes;  
* warnings;  
* confidence;  
* error.  
El sistema deberá distinguir:  
```
completed
completed_with_warning
partially_completed
failed

```
   
⸻  
   
## 403. Streaming  
Las respuestas interactivas podrán utilizar streaming.  
El streaming deberá:  
* respetar cancelación;  
* filtrar output;  
* evitar tool exposure;  
* evitar datos sensibles;  
* manejar desconexión;  
* conservar resultado final.  
   
⸻  
   
## 404. Desconexión del usuario  
Si el usuario cierra la conversación:  
* el job podrá cancelarse;  
* continuar en background;  
* guardar draft;  
* crear task;  
según el tipo de solicitud.  
No deberán continuar indefinidamente trabajos costosos sin razón.  
   
⸻  
   
## 405. Datos enviados al nodo  
El nodo deberá recibir únicamente:  
* contexto necesario;  
* referencias temporales;  
* payload mínimo;  
* instrucciones;  
* policy snapshot;  
* tool scopes;  
* job metadata.  
No deberá recibir una copia completa del cliente.  
   
⸻  
   
## 406. Data Scope Package  
Campos:  
```
jobId
purpose
authorizedResources
redactedContext
sourceReferences
sensitivity
retention
allowedTools
outputSchema
expiresAt

```
   
⸻  
   
## 407. Referencias temporales  
Cuando el nodo necesite documentos, deberá utilizar:  
* URL temporal;  
* token de un solo uso;  
* proxy de documentos;  
* streaming controlado.  
No deberá recibir credenciales permanentes de MinIO.  
   
⸻  
   
## 408. Limpieza del nodo  
Después de cada trabajo:  
* eliminar archivos temporales;  
* destruir contexto;  
* cerrar sesión;  
* revocar URLs;  
* limpiar cache sensible;  
* liberar memoria;  
* registrar resultado.  
   
⸻  
   
## 409. Persistencia local  
El nodo GPU no deberá conservar:  
* documentos de clientes;  
* prompts con PII;  
* output restringido;  
* tokens;  
* secretos;  
* sesiones;  
* credenciales;  
más tiempo del necesario.  
   
⸻  
   
## 410. Almacenamiento del nodo  
Podrá dividirse en:  
```
model_storage
runtime_cache
temporary_job_storage
evaluation_storage
system_logs

```
temporary_job_storage deberá tener limpieza automática.  
   
⸻  
   
## 411. Cifrado del nodo  
El equipo deberá usar:  
* cifrado de disco;  
* cuenta de sistema dedicada;  
* bloqueo automático;  
* firewall;  
* actualizaciones;  
* antivirus o controles equivalentes;  
* acceso administrativo limitado.  
   
⸻  
   
## 412. Uso personal del nodo gamer  
Si el nodo también se utiliza como computadora personal:  
* aislar runtime;  
* usar contenedores;  
* utilizar cuenta separada;  
* evitar compartir carpetas;  
* bloquear acceso del runtime a archivos personales;  
* separar navegador personal;  
* separar credenciales;  
* pausar workloads durante actividad de riesgo.  
   
⸻  
   
## 413. Conflicto entre juego y procesamiento  
Podrá existir una política:  
```
owner_using_gpu

```
Comportamientos posibles:  
* detener batch;  
* reducir concurrencia;  
* descargar modelos;  
* mantener solo jobs críticos;  
* mover tareas a cola;  
* usar cloud permitido.  
   
⸻  
   
## 414. Detección de actividad local  
El nodo podrá declarar:  
```
interactive_use
gaming
idle
scheduled_ai
maintenance

```
La detección deberá respetar privacidad y no capturar actividad personal innecesaria.  
   
⸻  
   
## 415. Power Policy  
Estados:  
```
always_available
business_hours
on_demand
night_batch
energy_saving
manual_only
maintenance

```
   
⸻  
   
## 416. Consumo energético  
La plataforma deberá registrar cuando sea posible:  
* tiempo encendido;  
* GPU time;  
* power draw;  
* batch duration;  
* costo estimado;  
* temperatura;  
* eficiencia por modelo.  
El costo energético será aproximado, no un valor contable definitivo.  
   
⸻  
   
## 417. Energy Budget  
Podrán definirse presupuestos:  
```
dailyGpuHours
monthlyGpuHours
maximumPowerDraw
maximumNightBatchDuration
maximumTemperature

```
   
⸻  
   
## 418. Protección térmica  
El nodo deberá supervisar:  
* temperatura GPU;  
* temperatura CPU;  
* ventiladores;  
* throttling;  
* temperatura del almacenamiento cuando esté disponible.  
Al superar límites:  
```
reduce concurrency
→ pause batch
→ unload model
→ drain node
→ shutdown if critical

```
   
⸻  
   
## 419. Estado saturated  
El nodo quedará saturated cuando:  
* VRAM insuficiente;  
* queue depth elevada;  
* temperatura alta;  
* concurrency máxima;  
* RAM insuficiente;  
* storage bajo;  
* runtime degradado.  
El router deberá dejar de asignarle nuevos trabajos no críticos.  
   
⸻  
   
## 420. Draining  
Antes de mantenimiento:  
```
online
→ draining
→ finish active jobs
→ reject new jobs
→ maintenance

```
No apagar el nodo abruptamente si existen trabajos críticos.  
   
⸻  
   
## 421. Wake-on-LAN futuro  
El sistema podrá implementar Wake-on-LAN para trabajos autorizados.  
Flujo conceptual:  
```
Advanced job queued
→ power policy checked
→ wake authorization
→ send wake signal
→ wait for secure heartbeat
→ load runtime
→ process job

```
   
⸻  
   
## 422. Restricciones de Wake-on-LAN  
Deberá considerar:  
* red local;  
* VPN;  
* router;  
* permisos;  
* horario;  
* costo;  
* seguridad;  
* presencia del owner;  
* mantenimiento;  
* máximo de encendidos;  
* timeout.  
No deberá exponer la red doméstica públicamente.  
   
⸻  
   
## 423. Wake Authorization  
Campos:  
```
id
nodeId
reason
requestedByType
requestedById
jobId
powerPolicy
authorizedAt
expiresAt
status
createdAt

```
   
⸻  
   
## 424. Arranque seguro  
Después de encender:  
1. Iniciar sistema.  
2. Iniciar red segura.  
3. Validar hora.  
4. Validar certificados.  
5. Iniciar node agent.  
6. Enviar heartbeat.  
7. Validar runtime.  
8. Verificar modelos.  
9. Declarar capacidades.  
10. Aceptar jobs.  
   
⸻  
   
## 425. Apagado automático  
El nodo podrá apagarse cuando:  
* cola vacía;  
* periodo de inactividad;  
* no existen jobs críticos;  
* no está siendo utilizado;  
* power policy lo permite;  
* backups temporales completados;  
* cleanup completado.  
   
⸻  
   
## 426. Apagado fallido  
Si el nodo no responde al apagado:  
* marcar warning;  
* no enviar más jobs;  
* notificar;  
* preservar logs;  
* permitir intervención manual.  
No ejecutar comandos destructivos sin autorización.  
   
⸻  
   
## 427. Mantenimiento del nodo  
Incluir:  
* actualizaciones;  
* drivers;  
* runtime;  
* modelos;  
* certificados;  
* limpieza;  
* pruebas;  
* temperatura;  
* almacenamiento;  
* benchmark;  
* seguridad.  
   
⸻  
   
## 428. Drivers de GPU  
Los drivers deberán:  
* utilizar versiones compatibles;  
* probarse;  
* documentarse;  
* no actualizarse automáticamente en medio de trabajos;  
* tener rollback;  
* asociarse a runtimes.  
   
⸻  
   
## 429. Compatibilidad  
Antes de actualizar:  
```
GPU Driver
Runtime
Model Format
Container Image
Operating System

```
deberán probarse juntos.  
   
⸻  
   
## 430. Benchmark del nodo  
Se deberán medir:  
* tokens por segundo;  
* time to first token;  
* memory use;  
* VRAM;  
* context length;  
* power;  
* temperature;  
* concurrency;  
* error rate.  
Los benchmarks deberán usar datasets ficticios.  
   
⸻  
   
## 431. Node Qualification  
Un nodo no deberá entrar en producción hasta superar:  
* connectivity test;  
* identity test;  
* model test;  
* privacy test;  
* tool isolation test;  
* temporary file cleanup test;  
* failure recovery;  
* thermal test;  
* queue test;  
* benchmark;  
* kill switch test.  
   
⸻  
   
## 432. Cloud Provider Policy  
Cada proveedor cloud deberá registrar:  
```
provider
approvedModels
allowedDataClasses
prohibitedDataClasses
regions
retentionPolicy
trainingPolicy
contractStatus
costLimits
rateLimits
fallbackPriority
killSwitch

```
   
⸻  
   
## 433. Proveedores múltiples  
El sistema podrá usar varios proveedores.  
No deberá asumir que todos:  
* aceptan las mismas herramientas;  
* tienen las mismas políticas;  
* ofrecen la misma privacidad;  
* usan el mismo formato;  
* tienen la misma calidad;  
* permiten los mismos datos.  
   
⸻  
   
## 434. Cost Control  
Antes de enviar a cloud deberá verificarse:  
* estimated tokens;  
* model price;  
* daily budget;  
* monthly budget;  
* client budget;  
* service budget;  
* fallback alternatives;  
* business value;  
* urgency.  
   
⸻  
   
## 435. Presupuestos de IA  
Podrán definirse por:  
```
global
provider
model
agent
skill
service
client
channel
environment

```
   
⸻  
   
## 436. Límite alcanzado  
Cuando se alcance un presupuesto:  
```
use local model
→ reduce context
→ use cheaper model
→ queue job
→ request owner approval
→ human handling

```
La elección dependerá de la política.  
   
⸻  
   
## 437. AI Infrastructure Dashboard  
Deberá mostrar:  
* servidor permanente;  
* nodo GPU;  
* cloud providers;  
* modelos cargados;  
* queue depth;  
* jobs;  
* latency;  
* errors;  
* costs;  
* energy;  
* temperature;  
* fallbacks;  
* storage;  
* kill switches;  
* maintenance.  
   
⸻  
   
## 438. Alertas  
Alertas mínimas:  
* servidor AI permanente offline;  
* router offline;  
* node heartbeat lost;  
* GPU overheating;  
* VRAM saturation;  
* disk low;  
* runtime crash;  
* model load failure;  
* queue age high;  
* dead-letter growing;  
* cloud limit reached;  
* provider outage;  
* unauthorized cloud routing;  
* local-only job blocked;  
* cleanup failure;  
* certificate expiring;  
* unusual cost increase;  
* Wake-on-LAN failure.  
   
⸻  
   
## 439. Pruebas y criterios de aceptación  
Probar:  
1. Chat básico sin nodo GPU.  
2. Routing al servidor permanente.  
3. Routing al nodo GPU.  
4. GPU apagada.  
5. GPU saturada.  
6. GPU desconectada durante ejecución.  
7. Cloud permitido.  
8. Cloud bloqueado.  
9. Datos local-only.  
10. Límite de costos.  
11. Modelo no disponible.  
12. Modelo corrupto.  
13. Runtime fallido.  
14. Cola saturada.  
15. Prioridad.  
16. Fair scheduling.  
17. Job cancelado.  
18. Job reintentado.  
19. Job dead-lettered.  
20. Limpieza de archivos.  
21. Revocación de URLs.  
22. Node draining.  
23. Maintenance.  
24. Protección térmica.  
25. Uso personal simultáneo.  
26. Wake-on-LAN futuro mediante simulación.  
27. Apagado automático.  
28. Fallback humano.  
29. Kill switch.  
30. Recuperación después de reinicio.  
El módulo estará listo cuando:  
* la plataforma funcione sin GPU;  
* el nodo GPU sea opcional;  
* cada nodo tenga identidad;  
* no existan puertos públicos de inferencia;  
* exista routing por sensibilidad;  
* local-only se respete;  
* los jobs estén en colas persistentes;  
* exista idempotencia;  
* exista fair scheduling;  
* existan límites;  
* exista backpressure;  
* existan fallbacks;  
* los datos temporales se eliminen;  
* la energía y temperatura se supervisen;  
* cloud requiera política;  
* existan presupuestos;  
* existan dashboards;  
* existan alertas;  
* existan kill switches;  
* la pérdida del nodo no pierda trabajos.  
   
⸻  
   
## 440. Instrucciones finales para Codex  
Antes de implementar la infraestructura de IA:  
1. Lee el Módulo 25 completo.  
2. Lee las partes 1 a 7 del Módulo 26.  
3. Inspecciona la infraestructura AI existente.  
4. No crees un segundo AI Gateway.  
5. No crees un segundo Model Router.  
6. Mantén el servidor permanente como base.  
7. Mantén el nodo GPU como capacidad opcional.  
8. No dependas de la GPU para funciones críticas.  
9. Implementa AI Compute Nodes.  
10. Implementa identidad por nodo.  
11. Implementa certificados.  
12. Implementa conexiones privadas.  
13. No expongas Ollama o runtimes a Internet.  
14. Implementa heartbeat.  
15. Implementa estados de nodo.  
16. Implementa capability registration.  
17. Implementa Model Registry.  
18. Verifica fuentes y checksums.  
19. Revisa licencias.  
20. No actives modelos no evaluados.  
21. Implementa runtime adapters.  
22. No acoples el dominio a Ollama.  
23. Implementa carga y descarga de modelos.  
24. Implementa warm pools.  
25. Implementa Model Routing.  
26. Considera sensibilidad.  
27. Considera complejidad.  
28. Considera costo.  
29. Considera latencia.  
30. Considera energía.  
31. Implementa local-only.  
32. Implementa Routing Decision records.  
33. Implementa fallback chains.  
34. No envíes datos restringidos a cloud.  
35. Implementa modo sin cloud.  
36. Implementa AI Job Queue.  
37. Implementa prioridades.  
38. Implementa fair scheduling.  
39. Implementa concurrency limits.  
40. Implementa backpressure.  
41. Implementa queue aging.  
42. Implementa timeouts separados.  
43. Implementa cancelación.  
44. Implementa reintentos controlados.  
45. Implementa idempotencia.  
46. Implementa dead-letter.  
47. Implementa resultados parciales.  
48. Implementa streaming seguro.  
49. Minimiza datos enviados al nodo.  
50. Implementa Data Scope Package.  
51. Usa URLs temporales.  
52. No entregues credenciales de storage.  
53. Implementa cleanup.  
54. No conserves PII en el nodo.  
55. Cifra el disco.  
56. Aísla la cuenta de servicio.  
57. Separa uso personal y runtime.  
58. Implementa políticas para actividad de gaming.  
59. Implementa Power Policy.  
60. Registra consumo estimado.  
61. Implementa Energy Budget.  
62. Implementa protección térmica.  
63. Implementa saturated.  
64. Implementa draining.  
65. Prepara Wake-on-LAN como fase futura.  
66. No expongas la red doméstica.  
67. Implementa arranque seguro.  
68. Implementa apagado controlado.  
69. Implementa mantenimiento.  
70. Versiona drivers y runtimes.  
71. Ejecuta benchmarks.  
72. Implementa Node Qualification.  
73. Implementa Cloud Provider Policies.  
74. Define clases de datos permitidas.  
75. Implementa cost control.  
76. Implementa presupuestos.  
77. Implementa dashboards.  
78. Implementa alertas.  
79. Implementa kill switches.  
80. Prueba GPU offline.  
81. Prueba desconexión durante un job.  
82. Prueba local-only.  
83. Prueba cloud blocked.  
84. Prueba presupuestos.  
85. Prueba saturación.  
86. Prueba limpieza.  
87. Prueba revocación.  
88. Prueba recuperación.  
89. Documenta cada nodo.  
90. Documenta cada modelo.  
91. Documenta cada provider.  
92. Documenta cada fallback.  
93. No marques el nodo como listo únicamente porque responde a un prompt.  
94. No uses datos reales durante benchmarks.  
95. No almacenes documentos permanentemente en la PC gamer.  
96. No permitas acceso directo del nodo a PostgreSQL.  
97. No permitas al nodo cambiar políticas.  
98. No permitas al nodo autoautorizar cloud.  
99. Mantén observabilidad completa.  
100. Mantén SG Solutions operativa incluso si toda la infraestructura avanzada de IA está fuera de servicio.  
Antes de entregar, verifica:  
* ¿SG Solutions funciona con el nodo GPU apagado?  
* ¿El chat público puede utilizar un modelo ligero?  
* ¿Las tareas complejas pueden esperar en cola?  
* ¿Cada nodo tiene identidad independiente?  
* ¿Los runtimes no están expuestos públicamente?  
* ¿Los modelos tienen versión, checksum y licencia?  
* ¿El router respeta sensibilidad y local-only?  
* ¿Cloud está bloqueado por defecto para datos restringidos?  
* ¿Los trabajos tienen idempotency key?  
* ¿Las colas aplican prioridad y fair scheduling?  
* ¿Existe backpressure?  
* ¿Los jobs desconocidos no se reintentan ciegamente?  
* ¿Los archivos temporales se eliminan?  
* ¿Las URLs temporales expiran?  
* ¿La PC gamer no conserva expedientes?  
* ¿El uso personal puede pausar tareas batch?  
* ¿La temperatura puede detener workloads?  
* ¿El nodo puede entrar en draining?  
* ¿Wake-on-LAN queda preparado sin exponer la red?  
* ¿El costo cloud está limitado?  
* ¿Existen dashboards y alertas?  
* ¿La pérdida del nodo no pierde datos oficiales?  
* ¿La infraestructura reutiliza AI Hub, Tasks, Approvals y Workflows?  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 8 — Integraciones Externas, Proveedores, Webhooks, Adaptadores y Resiliencia de Terceros  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 7 **Secciones incluidas:** 441–545 **Audiencia:** Codex, desarrolladores, DevOps, Integration Engineers, seguridad, operaciones, cumplimiento y owner **Idioma del código:** Inglés **Modelo operativo:** Integraciones desacopladas, verificables, reemplazables e idempotentes  
   
⸻  
   
## 441. Objetivo  
Esta parte define cómo SG Solutions deberá conectarse con proveedores externos sin convertir ninguna integración en un punto único de fallo.  
La plataforma podrá integrarse con:  
* Stripe;  
* Twilio;  
* proveedores de email;  
* WhatsApp;  
* Meta;  
* Google OAuth;  
* Google Calendar;  
* Google Maps;  
* DocuSeal;  
* IdentityIQ;  
* Tradeline Supply;  
* CreditCardBroker;  
* proveedores tributarios;  
* APIs gubernamentales;  
* proveedores de firma;  
* proveedores de telefonía;  
* proveedores de IA;  
* proveedores de verificación;  
* lenders;  
* bureaus;  
* partners de marketplace;  
* servicios futuros.  
La arquitectura deberá responder:  
* ¿Qué proveedor ejecuta cada capacidad?  
* ¿Qué datos recibe?  
* ¿Qué credenciales utiliza?  
* ¿Qué ambiente está activo?  
* ¿Cómo se verifica un webhook?  
* ¿Cómo se evitan duplicados?  
* ¿Cómo se reintenta?  
* ¿Qué ocurre si el proveedor falla?  
* ¿Cómo se cambia de proveedor?  
* ¿Qué acciones requieren consentimiento?  
* ¿Qué acciones requieren aprobación?  
* ¿Cómo se reconcilian estados?  
* ¿Cómo se conserva evidencia?  
* ¿Cómo se monitorean costos y límites?  
   
⸻  
   
## 442. Principio central  
Toda integración deberá seguir:  
```
Domain Service
→ Provider Abstraction
→ Integration Policy
→ Credential Resolution
→ Request Validation
→ Provider Adapter
→ External Provider
→ Response Normalization
→ Evidence
→ Audit

```
No deberá seguir:  
```
Frontend
→ External Provider API

```
salvo SDKs públicos expresamente diseñados para frontend y con backend de verificación.  
   
⸻  
   
## 443. Separación de responsabilidades  
El dominio deberá conocer capacidades.  
Ejemplos:  
```
Payment Provider
Messaging Provider
Identity Provider
Signature Provider
Tax Provider
Marketplace Partner

```
El dominio no deberá depender directamente de:  
```
Stripe-specific objects
Twilio-specific statuses
Meta-specific payloads
Partner-specific field names

```
   
⸻  
   
## 444. Provider Abstraction  
Cada categoría deberá implementar una interfaz común.  
Ejemplo conceptual:  
```
IPaymentProvider
IMessagingProvider
IIdentityProvider
ISignatureProvider
ITaxProvider
IPartnerReferralProvider
IDocumentExchangeProvider
IVerificationProvider

```
Los adaptadores específicos deberán implementar esas interfaces.  
   
⸻  
   
## 445. Objetivos de desacoplamiento  
La arquitectura deberá permitir:  
* cambiar proveedor;  
* usar varios proveedores;  
* configurar fallback;  
* separar ambientes;  
* probar mediante sandbox;  
* aplicar políticas diferentes;  
* desactivar una integración;  
* limitar scopes;  
* cambiar credenciales;  
* comparar costos;  
* evitar lógica dispersa.  
   
⸻  
   
## 446. Integration Provider  
Entidad conceptual:  
```
id
code
displayName
providerCategory
status
environment
capabilitySet
dataPolicy
credentialReference
healthStatus
contractStatus
supportReference
documentationReference
currentConfigurationVersionId
createdAt
updatedAt

```
   
⸻  
   
## 447. Categorías de proveedor  
```
payment
email
sms
whatsapp
telephony
social_media
identity
oauth
signature
tax
credit_monitoring
tradeline_marketplace
credit_card_marketplace
lender
home_buying
document_exchange
government_portal
ai
storage
mapping
analytics
verification
custom

```
   
⸻  
   
## 448. Estados del proveedor  
```
draft
pending_review
sandbox
active
degraded
rate_limited
paused
suspended
contract_expired
credential_error
maintenance
retired

```
Un proveedor degraded podrá aceptar operaciones limitadas según política.  
   
⸻  
   
## 449. Capabilities  
Cada proveedor deberá declarar capacidades.  
Ejemplo:  
```
create_checkout
capture_payment
refund_payment
send_email
send_sms
send_whatsapp
place_call
verify_identity
create_signature_request
submit_tax_payload
create_partner_referral
receive_webhook

```
El sistema no deberá asumir capacidades no registradas.  
   
⸻  
   
## 450. Provider Configuration Version  
Toda configuración importante deberá versionarse.  
Campos:  
```
id
providerId
versionNumber
environment
configurationSnapshot
changeSummary
status
approvedBy
approvedAt
effectiveFrom
effectiveTo
createdAt

```
No editar configuraciones activas sin crear una nueva versión cuando afecte comportamiento.  
   
⸻  
   
## 451. Ambientes externos  
Cada integración deberá separar:  
```
development
sandbox
staging
production

```
Nunca deberán utilizarse credenciales de producción en pruebas ordinarias.  
   
⸻  
   
## 452. Sandbox  
El sandbox deberá permitir probar:  
* autenticación;  
* requests;  
* webhooks;  
* errores;  
* reintentos;  
* rate limits;  
* fallos;  
* estados;  
* reconciliación;  
* expiración;  
* idempotencia.  
Un sandbox no deberá considerarse idéntico a producción.  
   
⸻  
   
## 453. Simulador interno  
Cuando un proveedor no ofrezca sandbox suficiente, podrá implementarse un simulador interno.  
El simulador deberá:  
* usar datos ficticios;  
* generar estados realistas;  
* generar webhooks duplicados;  
* generar eventos fuera de orden;  
* generar timeouts;  
* generar rate limits;  
* generar fallos parciales.  
No deberá marcarse como integración real.  
   
⸻  
   
## 454. Credenciales  
Cada proveedor deberá utilizar credenciales:  
* separadas por ambiente;  
* almacenadas en Secret Manager;  
* con scopes mínimos;  
* rotables;  
* revocables;  
* auditables;  
* asociadas a un owner técnico.  
   
⸻  
   
## 455. Credential Reference  
La configuración deberá almacenar:  
```
credentialReference

```
No el secreto.  
El adaptador resolverá el secreto únicamente durante ejecución autorizada.  
   
⸻  
   
## 456. Rotación  
La rotación deberá considerar:  
* claves activas y nuevas;  
* periodo de transición;  
* webhook secrets;  
* OAuth refresh tokens;  
* service accounts;  
* certificados;  
* pruebas;  
* rollback;  
* revocación anterior.  
   
⸻  
   
## 457. Credencial comprometida  
Flujo:  
```
Detect
→ Pause affected integration
→ Revoke credential
→ Activate fallback if safe
→ Generate replacement
→ Update Secret Manager
→ Validate
→ Resume gradually
→ Review audit

```
   
⸻  
   
## 458. OAuth  
Las integraciones OAuth deberán utilizar:  
* authorization code flow;  
* PKCE cuando corresponda;  
* state;  
* nonce;  
* redirect allowlist;  
* scopes mínimos;  
* token expiration;  
* refresh token protection;  
* revocation;  
* audit.  
   
⸻  
   
## 459. OAuth Token Store  
Los tokens deberán:  
* cifrarse;  
* asociarse con usuario u organización;  
* incluir scopes;  
* incluir proveedor;  
* incluir expiración;  
* incluir estado;  
* poder revocarse;  
* no exponerse al frontend innecesariamente.  
   
⸻  
   
## 460. Google OAuth  
Google OAuth podrá utilizarse para:  
* autenticación;  
* Calendar;  
* contactos;  
* servicios futuros autorizados.  
El acceso a una capacidad no deberá otorgar acceso automático a otras.  
Ejemplo:  
```
Google Login
≠
Google Calendar Access

```
   
⸻  
   
## 461. Account Linking  
Cuando un usuario inicia con Google y ya existe una cuenta:  
* verificar email;  
* evitar duplicados;  
* requerir confirmación;  
* registrar linking;  
* permitir unlink seguro;  
* mantener método alternativo de acceso cuando corresponda.  
   
⸻  
   
## 462. Webhook Architecture  
Todos los webhooks deberán ingresar mediante una capa dedicada.  
Flujo:  
```
Provider
→ Webhook Endpoint
→ Signature Verification
→ Timestamp Validation
→ Event Deduplication
→ Raw Evidence Storage
→ Inbox Record
→ Async Processing
→ Domain Event
→ Reconciliation

```
   
⸻  
   
## 463. Webhook Endpoint  
Cada endpoint deberá:  
* identificar proveedor;  
* limitar tamaño;  
* validar método;  
* aplicar timeout corto;  
* verificar firma;  
* registrar event ID;  
* responder rápidamente;  
* procesar de forma asíncrona;  
* no ejecutar lógica extensa dentro de la request.  
   
⸻  
   
## 464. Verificación de firmas  
El webhook deberá verificarse utilizando el método oficial del proveedor.  
No aceptar:  
* header inventado;  
* token en query string como única protección;  
* payload transformado antes de verificar;  
* firma sin timestamp cuando el proveedor lo soporte.  
   
⸻  
   
## 465. Replay Protection  
Aplicar:  
* timestamp;  
* tolerance window;  
* event ID;  
* nonce cuando exista;  
* deduplication;  
* processed status;  
* payload hash.  
   
⸻  
   
## 466. Raw Webhook Evidence  
Podrá conservarse una copia cifrada y limitada del evento original para:  
* auditoría;  
* debugging;  
* reconciliación;  
* disputas;  
* soporte.  
La retención dependerá de sensibilidad y política.  
   
⸻  
   
## 467. Integration Inbox  
Entidad conceptual:  
```
id
providerId
environment
externalEventId
eventType
receivedAt
signatureStatus
payloadHash
rawPayloadReference
status
attemptCount
processedAt
errorCode
correlationId
createdAt
updatedAt

```
   
⸻  
   
## 468. Estados del inbox  
```
received
verified
rejected
duplicate
queued
processing
processed
processed_with_warning
failed
dead_lettered
quarantined

```
   
⸻  
   
## 469. Eventos duplicados  
Un webhook duplicado deberá:  
* detectarse;  
* responder de forma compatible;  
* no duplicar efectos;  
* mantener evidencia;  
* registrar duplicate count.  
   
⸻  
   
## 470. Eventos fuera de orden  
El sistema deberá manejar casos como:  
```
payment_refunded

```
recibido antes de que el evento:  
```
payment_succeeded

```
haya sido procesado internamente.  
La solución deberá basarse en:  
* timestamps;  
* provider state query;  
* internal version;  
* reconciliation;  
* state machine.  
   
⸻  
   
## 471. Webhook Retry  
El proveedor podrá reenviar eventos.  
El endpoint deberá ser idempotente.  
Los reintentos internos deberán diferenciarse de los reintentos del proveedor.  
   
⸻  
   
## 472. Dead-Letter Webhooks  
Después de fallos repetidos:  
```
event
→ dead-letter
→ integration recovery task
→ operator review

```
No descartar silenciosamente.  
   
⸻  
   
## 473. Outbound Request  
Toda solicitud externa deberá registrar:  
```
provider
operation
internalResource
requestVersion
idempotencyKey
timeout
status
externalReference
attemptCount
createdAt
completedAt

```
   
⸻  
   
## 474. Timeouts  
Deberán definirse:  
* connect timeout;  
* read timeout;  
* whole operation timeout;  
* async job timeout;  
* confirmation timeout.  
No esperar indefinidamente a un proveedor.  
   
⸻  
   
## 475. Reintentos  
Se reintentará únicamente cuando el error sea probablemente temporal.  
Ejemplos:  
* timeout;  
* HTTP 429;  
* HTTP 502;  
* HTTP 503;  
* connection reset.  
No reintentar automáticamente:  
* invalid credentials;  
* validation error;  
* permission denied;  
* unsupported operation;  
* rejected application;  
* duplicate submission incierta.  
   
⸻  
   
## 476. Exponential Backoff  
Los reintentos deberán usar:  
* exponential backoff;  
* jitter;  
* máximo de intentos;  
* límite de tiempo;  
* circuit breaker;  
* idempotency key.  
   
⸻  
   
## 477. Circuit Breaker  
Estados:  
```
closed
open
half_open

```
## Closed  
Operación normal.  
## Open  
Las llamadas están temporalmente bloqueadas.  
## Half-open  
Se permite una cantidad limitada de pruebas.  
   
⸻  
   
## 478. Circuit Breaker Policy  
Cada proveedor deberá definir:  
```
failureThreshold
minimumRequestCount
openDuration
halfOpenLimit
successThreshold
fallbackAction
alertSeverity

```
   
⸻  
   
## 479. Bulkheads  
Las integraciones deberán aislar recursos.  
Ejemplo:  
Una caída de Twilio no deberá consumir todos los threads del Backend ni afectar Stripe.  
Se utilizarán:  
* connection pools separados;  
* queues separadas;  
* concurrency limits;  
* workers separados;  
* timeouts separados.  
   
⸻  
   
## 480. Provider Rate Limits  
Cada proveedor deberá registrar:  
* límites conocidos;  
* headers;  
* ventanas;  
* cuotas;  
* uso;  
* remaining;  
* reset time;  
* límites contractuales.  
El sistema deberá evitar alcanzar límites de forma innecesaria.  
   
⸻  
   
## 481. Rate Limit Queueing  
Cuando se alcance un límite:  
```
pause low-priority requests
→ queue
→ respect retry-after
→ preserve order where required
→ alert if business impact

```
   
⸻  
   
## 482. Normalización de respuestas  
Los adaptadores deberán convertir respuestas externas a modelos internos.  
Ejemplo:  
```
Stripe: succeeded
Partner A: completed
Provider B: accepted

```
podrán normalizarse a:  
```
completed

```
sin perder el estado original.  
   
⸻  
   
## 483. Estado externo y estado interno  
Guardar:  
```
normalizedStatus
externalStatus
externalStatusRawReference

```
El estado interno no deberá depender de comparar strings dispersos.  
   
⸻  
   
## 484. Error Mapping  
Cada adaptador deberá mapear errores a códigos internos.  
Ejemplo:  
```
PROVIDER_AUTHENTICATION_FAILED
PROVIDER_RATE_LIMITED
PROVIDER_TIMEOUT
PROVIDER_VALIDATION_FAILED
PROVIDER_UNAVAILABLE
PROVIDER_REJECTED
PROVIDER_STATE_UNKNOWN

```
   
⸻  
   
## 485. Estado desconocido  
Si una request externa puede haberse ejecutado, pero no existe confirmación:  
```
status = unknown

```
No marcarla como fallida ni reintentar ciegamente.  
Deberá iniciarse reconciliación.  
   
⸻  
   
## 486. Reconciliation  
La reconciliación deberá comparar:  
```
Internal state
↔
Provider state

```
Podrá ejecutarse:  
* después de timeout;  
* periódicamente;  
* después de restauración;  
* después de webhook faltante;  
* ante discrepancia;  
* manualmente.  
   
⸻  
   
## 487. Reconciliation Record  
```
id
providerId
resourceType
resourceId
externalReference
internalStatus
externalStatus
result
differenceType
actionTaken
reviewRequired
createdAt
completedAt

```
   
⸻  
   
## 488. Reconciliation Outcomes  
```
matched
internal_update_required
external_action_required
manual_review_required
duplicate_detected
unknown

```
   
⸻  
   
## 489. Idempotencia externa  
Cuando el proveedor soporte idempotency keys, deberán utilizarse.  
La clave deberá derivarse de:  
```
internalResource
+ operation
+ version

```
No generar una clave distinta en cada reintento.  
   
⸻  
   
## 490. Evidencia de ejecución  
Las operaciones sensibles deberán conservar:  
* provider reference;  
* request reference;  
* response reference;  
* timestamps;  
* status;  
* idempotency key;  
* approval reference;  
* consent reference;  
* document reference;  
* reconciliation status.  
   
⸻  
   
## 491. Data Mapping  
Cada integración deberá documentar:  
```
Internal field
External field
Data type
Required
Transformation
Sensitivity
Consent requirement
Retention
Source of truth

```
   
⸻  
   
## 492. Schema Versioning  
Si un proveedor cambia schema:  
* crear adapter version;  
* mantener compatibilidad;  
* probar;  
* registrar effective date;  
* migrar;  
* retirar versión anterior.  
No modificar silenciosamente mappings activos.  
   
⸻  
   
## 493. Data Minimization  
Enviar únicamente los campos necesarios.  
No enviar:  
* expediente completo;  
* todos los documentos;  
* todos los miembros;  
* full profile;  
* reportes;  
* notas internas;  
si la operación requiere solo una parte.  
   
⸻  
   
## 494. Consentimiento y Data Sharing  
Antes de compartir datos con partners:  
* verificar consentimiento;  
* verificar DataSharingGrant;  
* verificar campos;  
* verificar documentos;  
* verificar propósito;  
* verificar expiración;  
* verificar revocación;  
* verificar Approval cuando aplique.  
   
⸻  
   
## 495. Revocación  
La revocación deberá detener futuros envíos.  
No podrá borrar necesariamente datos ya compartidos por el partner, pero deberá:  
* registrar revocación;  
* notificar al partner cuando corresponda;  
* cerrar grants;  
* bloquear nuevos jobs;  
* documentar limitaciones.  
   
⸻  
   
## 496. Residency y región  
Cada proveedor deberá declarar:  
* región;  
* data location;  
* processing location;  
* failover region;  
* restricciones;  
* contrato.  
Los datos restringidos deberán respetar la política definida.  
   
⸻  
   
## 497. Retención del proveedor  
Deberá documentarse:  
* si conserva requests;  
* cuánto tiempo;  
* si utiliza datos para entrenamiento;  
* cómo elimina;  
* cómo exporta;  
* cómo responde a revocación;  
* cómo notifica incidentes.  
No asumir condiciones favorables sin evidencia contractual.  
   
⸻  
   
## 498. Vendor Risk Record  
Campos:  
```
providerId
riskLevel
dataClasses
businessCriticality
securityReviewStatus
privacyReviewStatus
contractStatus
insuranceStatus
incidentHistory
lastReviewAt
nextReviewAt
approvedBy

```
   
⸻  
   
## 499. Revisión de proveedor  
Antes de activar producción:  
* revisar seguridad;  
* revisar privacidad;  
* revisar disponibilidad;  
* revisar soporte;  
* revisar costos;  
* revisar documentación;  
* revisar sandbox;  
* revisar rate limits;  
* revisar webhooks;  
* revisar exportación;  
* revisar terminación;  
* revisar contrato.  
   
⸻  
   
## 500. Stripe  
Stripe deberá integrarse mediante el Módulo de Billing.  
Podrá gestionar:  
* checkout;  
* payment intents;  
* customer references;  
* subscriptions futuras;  
* refunds;  
* disputes;  
* webhooks;  
* reconciliation.  
Stripe seguirá siendo proveedor.  
SG Solutions seguirá siendo fuente de verdad del estado operativo interno.  
   
⸻  
   
## 501. Stripe Client Architecture  
```
Billing Service
→ IPaymentProvider
→ Stripe Adapter
→ Stripe

```
Otros módulos no deberán llamar directamente a Stripe.  
   
⸻  
   
## 502. Stripe Webhooks  
Eventos podrán incluir:  
* checkout completed;  
* payment succeeded;  
* payment failed;  
* refund;  
* dispute;  
* subscription;  
* charge changes.  
Los nombres exactos dependerán de la versión oficial configurada.  
   
⸻  
   
## 503. Confirmación de pago  
Un webhook válido podrá confirmar:  
```
payment provider status

```
No deberá aprobar automáticamente:  
* service start;  
* filing;  
* tax preparation;  
* credit dispute;  
* partner application.  
El Módulo 24 seguirá controlando acciones sensibles.  
   
⸻  
   
## 504. Refund  
Flujo:  
```
Refund request
→ Billing review
→ Approval
→ Stripe Adapter
→ Provider response
→ Webhook
→ Reconciliation
→ Entitlement adjustment

```
No emitir refunds desde frontend.  
   
⸻  
   
## 505. Twilio  
Twilio podrá utilizarse para:  
* SMS;  
* WhatsApp según configuración;  
* telefonía;  
* voice;  
* verification cuando esté aprobado.  
Cada capacidad deberá tener configuración y credenciales separadas cuando sea posible.  
   
⸻  
   
## 506. Twilio Message Status  
Los estados externos deberán normalizarse.  
Ejemplos internos:  
```
queued
sent
delivered
failed
undelivered
unknown

```
Se conservará el estado original del proveedor.  
   
⸻  
   
## 507. Twilio Webhooks  
Deberán verificarse y procesarse para:  
* delivery;  
* failure;  
* inbound message;  
* call status;  
* recording status;  
* opt-out;  
* verification result.  
   
⸻  
   
## 508. WhatsApp  
La integración deberá:  
* utilizar templates aprobados cuando corresponda;  
* respetar ventanas de conversación;  
* respetar opt-out;  
* limitar PII;  
* mover documentos sensibles al portal;  
* verificar webhooks;  
* registrar delivery;  
* controlar costos.  
   
⸻  
   
## 509. WhatsApp Handoff  
Cuando la conversación requiera información sensible:  
```
WhatsApp
→ secure portal link
→ authenticated session

```
No recopilar SSN, credenciales o tarjetas mediante chat.  
   
⸻  
   
## 510. Email Provider  
La arquitectura deberá permitir cambiar entre proveedores.  
Interfaz:  
```
IEmailProvider

```
Capacidades:  
* transactional email;  
* templates;  
* attachments controlados;  
* delivery status;  
* bounce;  
* complaint;  
* unsubscribe;  
* inbound processing futuro.  
   
⸻  
   
## 511. Email Security  
Deberá configurarse:  
* SPF;  
* DKIM;  
* DMARC;  
* TLS;  
* sender domains;  
* bounce handling;  
* complaint handling;  
* suppression list.  
   
⸻  
   
## 512. Email Attachments  
Preferir:  
```
secure portal link

```
en lugar de adjuntar documentos sensibles.  
Cuando se permita attachment:  
* escanear;  
* cifrar cuando corresponda;  
* limitar tamaño;  
* registrar envío;  
* aplicar retención.  
   
⸻  
   
## 513. Meta y redes sociales  
Las integraciones con Meta podrán gestionar:  
* mensajes;  
* comentarios;  
* leads;  
* page events;  
* templates;  
* social support.  
No deberán:  
* consultar expedientes;  
* exponer relación de cliente;  
* recibir datos restringidos;  
* ejecutar servicios.  
   
⸻  
   
## 514. Social Webhooks  
Deberán:  
* verificar proveedor;  
* deduplicar;  
* identificar canal;  
* detectar spam;  
* aplicar rate limits;  
* crear actividad CRM;  
* escalar quejas;  
* respetar privacidad.  
   
⸻  
   
## 515. Google Calendar  
La integración podrá utilizarse para:  
* disponibilidad;  
* eventos;  
* recordatorios;  
* sincronización;  
* reuniones.  
La fuente operativa final deberá definirse en el Módulo 13.  
   
⸻  
   
## 516. Calendar Conflict  
Ante conflicto entre Google Calendar y SG Solutions:  
```
detect conflict
→ prevent double booking
→ create reconciliation task
→ notify staff

```
No sobrescribir silenciosamente.  
   
⸻  
   
## 517. DocuSeal o proveedor de firma  
La integración deberá gestionar:  
* templates;  
* signature requests;  
* signer identity;  
* reminders;  
* completion;  
* decline;  
* certificate;  
* signed document;  
* webhook;  
* evidence.  
   
⸻  
   
## 518. Firma completada  
Una firma deberá validarse mediante:  
* webhook;  
* provider API;  
* document hash;  
* signer reference;  
* completion status;  
* certificate.  
No confiar únicamente en redirect del navegador.  
   
⸻  
   
## 519. IdentityIQ  
La integración deberá utilizar únicamente métodos oficialmente permitidos.  
Preferencia:  
* OAuth;  
* API;  
* redirect;  
* partner link;  
* proveedor-approved embed.  
No asumir que:  
* iframe;  
* scraping;  
* credential capture;  
* automated browser login;  
están permitidos.  
   
⸻  
   
## 520. Credenciales de IdentityIQ  
SG Solutions no deberá almacenar:  
* username;  
* password;  
* security answers;  
* MFA codes;  
del cliente para acceder a IdentityIQ, salvo que exista un flujo contractual y legal expresamente autorizado y diseñado para ello.  
   
⸻  
   
## 521. IdentityIQ Data Flow  
Flujo preferido:  
```
Client authorizes
→ provider-approved connection
→ provider returns authorized data or status
→ SG Solutions stores permitted references

```
   
⸻  
   
## 522. Tradeline Supply  
La integración deberá funcionar como marketplace o referral controlado.  
Podrá:  
* mostrar productos;  
* registrar interés;  
* redirigir;  
* crear referral;  
* recibir conversion event;  
* reconciliar comisión.  
No deberá:  
* garantizar score increase;  
* presentar tradelines como solución universal;  
* ocultar riesgos;  
* ejecutar compra sin consentimiento.  
   
⸻  
   
## 523. Tradeline Referral  
Campos:  
```
referralId
partnerId
productId
clientId
consentId
disclosureVersion
redirectReference
externalReference
status
conversionStatus
commissionStatus
createdAt
updatedAt

```
   
⸻  
   
## 524. CreditCardBroker  
La integración podrá:  
* mostrar categorías;  
* generar redirect seguro;  
* registrar referral;  
* recibir conversion;  
* registrar compensation disclosure;  
* conciliar comisión.  
No deberá presentar:  
* prequalified;  
* approved;  
* guaranteed;  
sin evidencia oficial.  
   
⸻  
   
## 525. Redirect Security  
Los redirects deberán:  
* generarse en backend;  
* usar allowlist;  
* evitar URLs proporcionadas libremente;  
* incluir tracking limitado;  
* evitar PII en query string;  
* expirar cuando corresponda;  
* registrar click.  
   
⸻  
   
## 526. Proveedores tributarios  
La arquitectura deberá permitir:  
* tax calculation provider;  
* tax preparation provider;  
* e-file provider;  
* transcript provider;  
* document provider;  
* state provider.  
No asumir que un único proveedor cubre todas las funciones.  
   
⸻  
   
## 527. Tax Provider Policy  
Cada proveedor deberá declarar:  
```
supportedTaxYears
supportedJurisdictions
supportedForms
supportedEntityTypes
eFileCapabilities
dataClasses
retention
sandboxCapabilities
approvalRequirements

```
   
⸻  
   
## 528. Tax Submission  
Flujo:  
```
Return prepared
→ Validation
→ Human review
→ Client signature
→ Approval
→ Tax Provider Adapter
→ Submission
→ Acknowledgement
→ Reconciliation

```
La integración no podrá saltarse etapas.  
   
⸻  
   
## 529. Government Portals  
Cuando no exista API oficial, podrá utilizarse browser worker aprobado.  
Flujo:  
```
Domain action prepared
→ Approval
→ Browser action plan
→ Execution authorization
→ Browser worker
→ Evidence
→ Reconciliation

```
No crear scraping no autorizado como integración normal.  
   
⸻  
   
## 530. Partner APIs  
Cada partner deberá tener un adaptador independiente.  
No crear un único adaptador genérico que asuma que todos los partners funcionan igual.  
Se podrá reutilizar infraestructura común para:  
* autenticación;  
* retries;  
* webhooks;  
* mapping;  
* logging;  
* circuit breakers.  
   
⸻  
   
## 531. Provider Selection  
Cuando existan varios proveedores, la selección podrá considerar:  
* capability;  
* disponibilidad;  
* costo;  
* calidad;  
* región;  
* riesgo;  
* rate limits;  
* cliente;  
* servicio;  
* contrato;  
* idioma;  
* fallback.  
   
⸻  
   
## 532. Selección determinista  
La selección de proveedores para acciones sensibles deberá ser determinista y auditable.  
La IA podrá recomendar.  
No podrá cambiar proveedor libremente.  
   
⸻  
   
## 533. Provider Routing Decision  
```
id
capability
requestedBy
resourceType
resourceId
candidateProviders
selectedProvider
decisionReason
costEstimate
riskLevel
policyVersion
createdAt

```
   
⸻  
   
## 534. Failover  
El failover solo deberá ocurrir cuando:  
* ambos proveedores soporten la misma capacidad;  
* los datos puedan compartirse;  
* el consentimiento lo permita;  
* el contrato lo permita;  
* el estado externo sea conocido;  
* la operación sea idempotente.  
No realizar failover ciego después de un timeout incierto.  
   
⸻  
   
## 535. Fallback manual  
Cuando no exista failover seguro:  
* crear tarea;  
* preservar request;  
* informar estado;  
* permitir proceso manual;  
* reconciliar;  
* no duplicar acción.  
   
⸻  
   
## 536. Kill Switches  
Deberán existir para:  
```
stripe_payments
stripe_refunds
twilio_sms
twilio_whatsapp
voice_calls
email_delivery
google_oauth
calendar_sync
identityiq
tradeline_supply
creditcardbroker
tax_submission
partner_data_sharing
government_browser_worker

```
   
⸻  
   
## 537. Feature Flags  
Las integraciones podrán activarse por:  
* ambiente;  
* cliente;  
* servicio;  
* estado;  
* canal;  
* porcentaje;  
* partner;  
* employee group.  
   
⸻  
   
## 538. Observabilidad  
Cada integración deberá exponer:  
* health;  
* latency;  
* success;  
* failure;  
* timeout;  
* rate limit;  
* retry;  
* circuit breaker;  
* webhook delay;  
* reconciliation;  
* cost;  
* credential status.  
   
⸻  
   
## 539. Dashboard de integraciones  
Deberá mostrar:  
* proveedores activos;  
* estado;  
* última operación;  
* error rate;  
* webhook backlog;  
* dead-letter;  
* credentials expiring;  
* rate limits;  
* circuit breakers;  
* reconciliation differences;  
* costos;  
* contract review date;  
* incidents.  
   
⸻  
   
## 540. Alertas  
Alertas mínimas:  
* provider unavailable;  
* credential failure;  
* webhook signature failure;  
* webhook backlog;  
* duplicate spike;  
* event ordering issue;  
* reconciliation mismatch;  
* rate limit near;  
* circuit breaker open;  
* tax acknowledgement delayed;  
* Stripe reconciliation pending;  
* Twilio delivery failure spike;  
* OAuth refresh failure;  
* partner contract expired;  
* data-sharing policy violation;  
* unexpected cost increase.  
   
⸻  
   
## 541. Runbooks  
Deberán existir runbooks para:  
* Stripe unavailable;  
* Stripe webhook delayed;  
* refund unknown;  
* Twilio outage;  
* WhatsApp template rejected;  
* email bounce spike;  
* Google OAuth failure;  
* Calendar conflict;  
* signature webhook missing;  
* IdentityIQ unavailable;  
* partner redirect broken;  
* tax provider timeout;  
* government portal changed;  
* credentials compromised;  
* reconciliation mismatch;  
* contract termination.  
   
⸻  
   
## 542. Testing funcional  
Probar:  
1. Sandbox.  
2. Credencial válida.  
3. Credencial inválida.  
4. Webhook válido.  
5. Webhook inválido.  
6. Webhook duplicado.  
7. Webhook fuera de orden.  
8. Timeout.  
9. Rate limit.  
10. Provider unavailable.  
11. Circuit breaker.  
12. Retry.  
13. Dead-letter.  
14. Reconciliation.  
15. Status unknown.  
16. Idempotency.  
17. Credential rotation.  
18. Kill switch.  
19. Failover permitido.  
20. Failover bloqueado.  
21. Consentimiento ausente.  
22. Approval ausente.  
23. Data minimization.  
24. Environment isolation.  
25. Provider retirement.  
   
⸻  
   
## 543. Testing por proveedor  
## Stripe  
* checkout;  
* payment success;  
* payment failure;  
* duplicate webhook;  
* refund;  
* dispute;  
* reconciliation.  
## Twilio  
* SMS;  
* WhatsApp;  
* delivery;  
* inbound;  
* opt-out;  
* call status;  
* provider failure.  
## Google  
* login;  
* linking;  
* invalid state;  
* token refresh;  
* revocation;  
* Calendar conflict.  
## Firma  
* request;  
* signed;  
* declined;  
* expired;  
* missing webhook;  
* document hash.  
## Marketplace  
* redirect;  
* tracking;  
* conversion;  
* consent;  
* commission;  
* partner outage.  
## Tax  
* validation;  
* approval missing;  
* submission;  
* acknowledgement;  
* rejection;  
* unknown state;  
* duplicate prevention.  
   
⸻  
   
## 544. Criterios de aceptación  
La Parte 8 estará lista cuando:  
1. Exista un Provider Registry.  
2. Cada proveedor tenga categoría.  
3. Cada proveedor tenga capabilities.  
4. Existan configuraciones versionadas.  
5. Los ambientes estén separados.  
6. Las credenciales estén en Secret Manager.  
7. Exista rotación.  
8. Exista OAuth seguro.  
9. Exista capa de webhooks.  
10. Las firmas se verifiquen.  
11. Exista replay protection.  
12. Exista Integration Inbox.  
13. Exista deduplicación.  
14. Exista manejo de eventos fuera de orden.  
15. Exista dead-letter.  
16. Existan timeouts.  
17. Existan reintentos controlados.  
18. Exista exponential backoff.  
19. Existan circuit breakers.  
20. Existan bulkheads.  
21. Exista manejo de rate limits.  
22. Exista normalización.  
23. Exista mapping de errores.  
24. Exista estado unknown.  
25. Exista reconciliation.  
26. Exista idempotencia.  
27. Exista evidencia.  
28. Exista data mapping.  
29. Exista schema versioning.  
30. Exista data minimization.  
31. Se verifique consentimiento.  
32. Se verifique Approval.  
33. Exista vendor risk.  
34. Stripe esté aislado en Billing.  
35. Twilio esté aislado en Communications.  
36. Google OAuth esté separado de Calendar access.  
37. Firmas se validen por provider.  
38. IdentityIQ use métodos permitidos.  
39. No se almacenen credenciales de IdentityIQ del cliente.  
40. Tradeline Supply opere como referral controlado.  
41. CreditCardBroker utilice redirects seguros.  
42. Tax providers respeten tax year y jurisdicción.  
43. Government portals usen Browser Worker aprobado.  
44. Exista provider selection.  
45. Exista failover controlado.  
46. Exista fallback manual.  
47. Existan kill switches.  
48. Existan feature flags.  
49. Exista observabilidad.  
50. Existan runbooks.  
51. Se prueben sandboxes.  
52. Se prueben fallos.  
53. Se pruebe reconciliación.  
54. Se pruebe credential rotation.  
55. La caída de un proveedor no detenga toda la plataforma.  
   
⸻  
   
## 545. Instrucciones finales para Codex  
Antes de implementar integraciones:  
1. Lee los módulos 1 al 25.  
2. Lee las partes 1 a 8 del Módulo 26.  
3. Inspecciona todas las integraciones existentes.  
4. No permitas llamadas directas desde módulos dispersos.  
5. Implementa Provider Abstractions.  
6. Implementa Provider Registry.  
7. Registra capabilities.  
8. Registra data policies.  
9. Versiona configuraciones.  
10. Separa ambientes.  
11. No uses producción para testing.  
12. Implementa simuladores donde sea necesario.  
13. Almacena secretos en Secret Manager.  
14. Usa credential references.  
15. Implementa rotación.  
16. Implementa revocación.  
17. Implementa OAuth seguro.  
18. Usa state y nonce.  
19. Protege refresh tokens.  
20. Implementa account linking seguro.  
21. Implementa Webhook Gateway.  
22. Verifica firmas.  
23. Verifica timestamps.  
24. Implementa replay protection.  
25. Implementa Integration Inbox.  
26. Preserva evidencia de forma segura.  
27. Responde rápido a webhooks.  
28. Procesa asíncronamente.  
29. Implementa deduplicación.  
30. Maneja eventos fuera de orden.  
31. Implementa dead-letter.  
32. Implementa timeouts.  
33. Implementa retries selectivos.  
34. Implementa exponential backoff.  
35. Implementa circuit breakers.  
36. Implementa bulkheads.  
37. Implementa rate-limit handling.  
38. Normaliza estados.  
39. Conserva estado externo.  
40. Implementa error mapping.  
41. Implementa estado unknown.  
42. No reintentes una operación incierta.  
43. Implementa reconciliation.  
44. Usa idempotency keys.  
45. Implementa evidencia.  
46. Documenta field mappings.  
47. Versiona schemas.  
48. Minimiza datos.  
49. Verifica consentimiento.  
50. Verifica DataSharingGrant.  
51. Verifica Approval.  
52. Registra vendor risk.  
53. Integra Stripe solo mediante Billing.  
54. Confirma pagos mediante webhook.  
55. No inicies servicios automáticamente.  
56. Ejecuta refunds mediante Approval.  
57. Integra Twilio mediante Communications.  
58. Respeta opt-out.  
59. Mueve PII al portal seguro.  
60. Configura seguridad de email.  
61. Evita attachments sensibles.  
62. Separa Google Login de Google Calendar.  
63. Valida firmas mediante proveedor.  
64. No asumas métodos no permitidos en IdentityIQ.  
65. No almacenes credenciales del cliente.  
66. Implementa Tradeline Supply como referral.  
67. Implementa CreditCardBroker mediante redirect seguro.  
68. No garantices resultados.  
69. Modela tax providers por tax year.  
70. Modela jurisdicciones.  
71. No envíes tax returns sin Approval.  
72. Usa Browser Worker solo cuando no exista API autorizada.  
73. No realices scraping arbitrario.  
74. Implementa adapters separados por partner.  
75. Implementa provider routing auditable.  
76. Implementa failover únicamente cuando sea seguro.  
77. Implementa fallback manual.  
78. Implementa kill switches.  
79. Implementa feature flags.  
80. Implementa métricas.  
81. Implementa dashboards.  
82. Implementa alertas.  
83. Implementa runbooks.  
84. Prueba webhooks duplicados.  
85. Prueba eventos fuera de orden.  
86. Prueba credenciales inválidas.  
87. Prueba rate limits.  
88. Prueba timeouts.  
89. Prueba circuit breakers.  
90. Prueba reconciliación.  
91. Prueba rotación.  
92. Prueba caída total.  
93. No marques una integración como completa solo porque devuelve HTTP 200.  
94. No marques un webhook como procesado antes de completar el dominio.  
95. No guardes payloads sensibles en logs.  
96. No permitas que un proveedor externo sea la única fuente de verdad interna.  
97. No permitas que la IA cambie proveedor o política.  
98. Documenta contratos y dependencias.  
99. Mantén cada integración reemplazable.  
100. Mantén SG Solutions operativa en modo degradado cuando un proveedor falle.  
Antes de entregar, verifica:  
* ¿Cada proveedor está detrás de un adaptador?  
* ¿Los módulos no llaman directamente a proveedores?  
* ¿Los secretos permanecen fuera del código?  
* ¿Los webhooks verifican firma y timestamp?  
* ¿Los eventos duplicados son idempotentes?  
* ¿Los eventos fuera de orden se reconcilian?  
* ¿Un timeout incierto no causa doble ejecución?  
* ¿Los circuit breakers aíslan fallos?  
* ¿Los rate limits se respetan?  
* ¿El estado externo se conserva?  
* ¿Existe un estado unknown?  
* ¿Existe reconciliación?  
* ¿Los datos compartidos tienen consentimiento?  
* ¿Las acciones sensibles tienen Approval?  
* ¿Stripe no inicia servicios automáticamente?  
* ¿Twilio respeta opt-out?  
* ¿Google Login no concede acceso a Calendar automáticamente?  
* ¿IdentityIQ usa únicamente métodos permitidos?  
* ¿Los partners de marketplace no reciben más datos de los necesarios?  
* ¿Tax Provider respeta tax year y jurisdicción?  
* ¿Los redirects están en allowlist?  
* ¿El Browser Worker requiere autorización?  
* ¿Existen kill switches?  
* ¿Existen métricas y runbooks?  
* ¿La caída de un proveedor no tumba toda SG Solutions?  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 9 — Rendimiento, Caché, Optimización de Datos, Pruebas de Carga y Escalabilidad  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 8 **Secciones incluidas:** 546–648 **Audiencia:** Codex, desarrolladores, arquitectos, DevOps, Database Engineers, AI Engineers, operaciones y owner **Idioma del código:** Inglés **Modelo operativo:** Rendimiento medible, escalabilidad progresiva y optimización basada en evidencia  
   
⸻  
   
## 546. Objetivo  
Esta parte define cómo SG Solutions deberá mantener:  
* tiempos de respuesta razonables;  
* estabilidad;  
* capacidad de crecimiento;  
* uso eficiente de infraestructura;  
* procesamiento predecible;  
* protección contra saturación;  
* aislamiento entre cargas;  
* recuperación ante picos;  
* costos operativos controlados.  
La plataforma deberá poder crecer desde una operación pequeña hasta atender:  
* miles de clientes;  
* múltiples empleados;  
* cientos de servicios activos;  
* grandes volúmenes de documentos;  
* múltiples agentes de IA;  
* integraciones simultáneas;  
* procesos batch;  
* campañas;  
* notificaciones;  
* workflows de larga duración.  
El rendimiento deberá medirse.  
No deberá optimizarse únicamente por percepción.  
   
⸻  
   
## 547. Principio central  
Toda optimización deberá seguir:  
```
Measure
→ Identify bottleneck
→ Form hypothesis
→ Test
→ Optimize
→ Validate
→ Monitor

```
No deberá seguir:  
```
Guess
→ add cache everywhere
→ create complexity

```
   
⸻  
   
## 548. Prioridades de rendimiento  
El orden general será:  
1. Correctitud.  
2. Seguridad.  
3. Integridad de datos.  
4. Disponibilidad.  
5. Rendimiento.  
6. Reducción de costos.  
7. Conveniencia técnica.  
Nunca deberá sacrificarse autorización o auditoría para reducir milisegundos.  
   
⸻  
   
## 549. Tipos de rendimiento  
La plataforma deberá medir por separado:  
```
User-perceived performance
API performance
Database performance
Queue performance
Worker performance
External provider performance
AI performance
Document processing performance
Infrastructure performance

```
Una aplicación podrá tener un backend rápido y una experiencia lenta debido al frontend o a proveedores.  
   
⸻  
   
## 550. Métricas de latencia  
Deberán medirse al menos:  
```
p50
p90
p95
p99
maximum

```
El promedio no será suficiente.  
Un promedio bajo puede ocultar una cantidad importante de requests muy lentas.  
   
⸻  
   
## 551. Objetivos iniciales  
Los objetivos definitivos deberán validarse con pruebas reales.  
Objetivos conceptuales iniciales:  
```
Public page:
Fast interactive experience under normal network conditions.

Authenticated navigation:
Primary content visible without unnecessary blocking.

Simple read API:
p95 below approximately 500 ms when served internally.

Complex read API:
p95 below approximately 1.5 seconds.

Simple write operation:
Confirmation below approximately 1 second when no external provider is required.

Dashboard:
Useful initial content below approximately 3 seconds.

Search:
Initial results below approximately 2 seconds.

Interactive AI:
Fast acknowledgement and streaming start when capacity is available.

```
Estos valores serán objetivos internos, no promesas contractuales.  
   
⸻  
   
## 552. Latencia total  
La latencia deberá descomponerse:  
```
DNS
+
TLS
+
Network
+
Reverse Proxy
+
Backend
+
Authorization
+
Database
+
Cache
+
External Provider
+
Serialization
+
Frontend Rendering

```
Optimizar únicamente el backend podrá no resolver el problema real.  
   
⸻  
   
## 553. Performance Budget  
Cada área deberá definir presupuestos.  
Ejemplo:  
```
Frontend JavaScript
Image weight
API latency
Database query count
Database execution time
External calls
AI context size
Document processing time

```
Los presupuestos deberán formar parte de CI cuando sea viable.  
   
⸻  
   
## 554. Rendimiento por ambiente  
## Development  
Facilita depuración.  
## Testing  
Valida funciones.  
## Staging  
Debe aproximarse a producción.  
## Production  
Representa resultados reales.  
Las pruebas de carga importantes no deberán basarse únicamente en Development.  
   
⸻  
   
## 555. Arquitectura stateless  
Los servicios que deban escalar horizontalmente serán stateless.  
Ejemplos:  
* Backend API;  
* Frontend server;  
* AI Gateway;  
* workers;  
* integration processors;  
* notification processors.  
No deberán depender de:  
* memoria local para sesiones;  
* archivos locales permanentes;  
* locks locales;  
* estado no compartido;  
* directorios temporales no controlados.  
   
⸻  
   
## 556. Estado compartido  
El estado oficial deberá mantenerse en:  
```
PostgreSQL
Object Storage
Approved Queue System
Redis for temporary state

```
Nunca dentro de una instancia específica del Backend.  
   
⸻  
   
## 557. Escalabilidad vertical  
Consiste en añadir:  
* CPU;  
* RAM;  
* almacenamiento;  
* GPU;  
* conexiones;  
* capacidad de red;  
a un servidor.  
Será útil durante las primeras etapas.  
Tiene límites físicos y económicos.  
   
⸻  
   
## 558. Escalabilidad horizontal  
Consiste en añadir instancias.  
Ejemplo:  
```
1 Backend
→ 3 Backends
→ 8 Backends

```
Deberá ser la estrategia principal para componentes stateless cuando la plataforma crezca.  
   
⸻  
   
## 559. Estrategia progresiva  
La plataforma no deberá comenzar con infraestructura innecesariamente compleja.  
Fases:  
```
Phase 1:
Single production host with isolated containers.

Phase 2:
Separate data and application resources.

Phase 3:
Multiple application instances.

Phase 4:
Managed services or orchestration.

Phase 5:
Regional or multi-cluster architecture when justified.

```
   
⸻  
   
## 560. Scale Trigger  
El escalado deberá responder a señales como:  
* CPU sostenida;  
* memory pressure;  
* p95 latency;  
* queue depth;  
* queue age;  
* active connections;  
* database saturation;  
* error rate;  
* traffic;  
* AI job backlog;  
* document backlog.  
No deberá basarse únicamente en CPU.  
   
⸻  
   
## 561. Autoscaling futuro  
La arquitectura deberá quedar preparada para autoscaling.  
Podrán utilizarse:  
* CPU;  
* RAM;  
* request rate;  
* queue depth;  
* custom metrics;  
* scheduled scaling.  
No será obligatorio para el MVP.  
   
⸻  
   
## 562. Scale-Out Safety  
Antes de replicar un servicio deberá verificarse:  
* idempotencia;  
* locks distribuidos;  
* session storage;  
* concurrency;  
* leader election;  
* scheduler behavior;  
* duplicate job prevention;  
* shared configuration.  
   
⸻  
   
## 563. Balanceo de carga  
El reverse proxy o load balancer deberá distribuir tráfico entre instancias saludables.  
Criterios posibles:  
```
round_robin
least_connections
weighted
health_aware

```
La estrategia deberá ser configurable.  
   
⸻  
   
## 564. Health-aware routing  
El balanceador no deberá enviar tráfico a instancias:  
* unhealthy;  
* not ready;  
* draining;  
* upgrading;  
* overloaded;  
* quarantined.  
   
⸻  
   
## 565. Session affinity  
La aplicación deberá evitar depender de sticky sessions.  
Si se utilizan temporalmente:  
* deberán documentarse;  
* no deberán ser requisito permanente;  
* la sesión oficial deberá permanecer compartida o verificable.  
   
⸻  
   
## 566. Connection draining  
Antes de retirar una instancia:  
```
Mark not ready
→ stop new requests
→ finish active requests
→ stop consumers
→ release resources
→ terminate

```
   
⸻  
   
## 567. Redis  
Redis podrá utilizarse para:  
* caché;  
* rate limiting;  
* sesiones;  
* locks;  
* short-lived state;  
* distributed coordination;  
* selected queue functions.  
No será la fuente oficial de información empresarial.  
   
⸻  
   
## 568. Cache Policy  
Toda caché deberá definir:  
```
cacheName
dataType
owner
keyStrategy
ttl
invalidationStrategy
sensitivity
maximumSize
fallbackBehavior
metrics

```
No crear cachés sin política.  
   
⸻  
   
## 569. Datos apropiados para caché  
Ejemplos:  
* catálogos públicos;  
* configuraciones publicables;  
* listas de estados;  
* FAQs aprobadas;  
* feature flags;  
* plantillas;  
* resultados agregados;  
* datos de referencia;  
* permisos compilados de corta duración;  
* páginas públicas.  
   
⸻  
   
## 570. Datos sensibles en caché  
Los datos sensibles deberán:  
* evitarse cuando sea posible;  
* cifrarse cuando corresponda;  
* usar TTL corto;  
* aislarse por cliente;  
* no compartirse entre tenants;  
* eliminarse al revocar acceso;  
* no persistirse innecesariamente.  
   
⸻  
   
## 571. Datos que no deberán cachearse libremente  
* contraseñas;  
* secretos;  
* MFA codes;  
* full SSN;  
* reportes de crédito completos;  
* tax returns completas;  
* payment credentials;  
* signed document contents;  
* execution authorizations;  
* private keys.  
   
⸻  
   
## 572. Cache Keys  
Las claves deberán incluir contexto suficiente.  
Ejemplo conceptual:  
```
environment
tenant
resource
resourceVersion
language
permissionScope

```
No utilizar una clave global para datos específicos de cliente.  
   
⸻  
   
## 573. Tenant Isolation en caché  
Una respuesta de un cliente nunca deberá entregarse a otro por una clave incompleta.  
La caché deberá probarse explícitamente contra:  
* cross-client leakage;  
* language leakage;  
* role leakage;  
* organization leakage;  
* environment leakage.  
   
⸻  
   
## 574. TTL  
El tiempo de vida deberá depender de:  
* volatilidad;  
* sensibilidad;  
* costo de regeneración;  
* impacto de staleness;  
* invalidación.  
No usar el mismo TTL para toda la plataforma.  
   
⸻  
   
## 575. Cache Invalidation  
Estrategias:  
```
time_based
event_based
version_based
manual
write_through
cache_aside

```
La estrategia preferida deberá documentarse por recurso.  
   
⸻  
   
## 576. Event-based invalidation  
Cuando cambie un recurso:  
```
Domain change
→ Outbox event
→ Cache invalidation consumer
→ Remove or replace cached entries

```
La invalidación no deberá depender únicamente de recordar hacerlo manualmente.  
   
⸻  
   
## 577. Cache Stampede  
Cuando una entrada popular expire, no deberán ejecutarse cientos de regeneraciones simultáneas.  
Técnicas:  
* distributed lock;  
* request coalescing;  
* stale-while-revalidate;  
* jittered TTL;  
* background refresh.  
   
⸻  
   
## 578. Stale-while-revalidate  
Podrá utilizarse para datos no sensibles y tolerantes a antigüedad.  
Flujo:  
```
Return slightly stale data
→ refresh in background
→ replace cache

```
No utilizar para:  
* pagos;  
* aprobaciones;  
* permisos críticos;  
* filings;  
* estados legales;  
* datos financieros sensibles.  
   
⸻  
   
## 579. Cache Failure  
Si Redis falla:  
* la plataforma deberá degradarse;  
* consultar la fuente oficial;  
* aplicar rate limits alternativos cuando sea posible;  
* evitar fallos masivos;  
* alertar;  
* no perder datos oficiales.  
   
⸻  
   
## 580. Cache Metrics  
Medir:  
* hit rate;  
* miss rate;  
* evictions;  
* latency;  
* memory;  
* key count;  
* failures;  
* stale responses;  
* invalidations;  
* stampede prevented.  
   
⸻  
   
## 581. CDN  
Una CDN podrá utilizarse para:  
* assets;  
* imágenes públicas;  
* JavaScript;  
* CSS;  
* fuentes autorizadas;  
* páginas públicas cacheables;  
* descargas públicas aprobadas.  
   
⸻  
   
## 582. Contenido privado y CDN  
Los documentos privados no deberán publicarse como objetos CDN abiertos.  
Cuando se utilice CDN para recursos privados:  
* signed URLs;  
* short expiration;  
* authorization;  
* no public listing;  
* cache control restrictivo;  
* revocation strategy.  
   
⸻  
   
## 583. Edge Caching  
Podrá utilizarse para:  
* contenido público;  
* landing pages;  
* help center;  
* FAQs;  
* static catalog;  
* public announcements.  
No para dashboards privados sin diseño específico.  
   
⸻  
   
## 584. Cache-Control  
Las respuestas deberán definir correctamente:  
```
public
private
no-store
no-cache
max-age
s-maxage
stale-while-revalidate

```
Los endpoints sensibles deberán usar controles restrictivos.  
   
⸻  
   
## 585. Compresión  
Podrá aplicarse:  
* Brotli;  
* gzip;  
* compresión del proveedor;  
* compresión de documentos cuando corresponda.  
No comprimir nuevamente archivos ya comprimidos sin beneficio.  
   
⸻  
   
## 586. Compresión y seguridad  
Las respuestas que mezclen secretos y contenido controlado por usuarios deberán revisarse ante riesgos de side-channel.  
No habilitar compresión indiscriminadamente en todos los contextos sensibles.  
   
⸻  
   
## 587. Optimización de imágenes  
Las imágenes deberán:  
* dimensionarse;  
* comprimirse;  
* usar formatos modernos;  
* cargarse de forma diferida;  
* generar thumbnails;  
* evitar full resolution cuando no sea necesario;  
* conservar original cuando sea requerido.  
   
⸻  
   
## 588. Frontend Performance  
El frontend deberá:  
* dividir bundles;  
* cargar módulos bajo demanda;  
* minimizar JavaScript;  
* evitar renders innecesarios;  
* usar server rendering cuando beneficie;  
* evitar waterfalls;  
* prefetch controlado;  
* usar skeletons;  
* manejar errores parciales.  
   
⸻  
   
## 589. Rendimiento percibido  
La experiencia podrá mejorar mediante:  
* contenido inicial útil;  
* carga progresiva;  
* optimistic UI solo cuando sea seguro;  
* estados claros;  
* streaming;  
* placeholders;  
* background refresh.  
No mostrar éxito antes de confirmar acciones críticas.  
   
⸻  
   
## 590. Optimistic UI  
Podrá utilizarse para:  
* preferencias;  
* orden visual;  
* acciones reversibles;  
* cambios locales de bajo riesgo.  
No utilizar para:  
* pago confirmado;  
* filing enviado;  
* refund emitido;  
* aprobación completada;  
* documento firmado;  
* partner application enviada.  
   
⸻  
   
## 591. Lazy Loading  
Cargar bajo demanda:  
* secciones secundarias;  
* historial;  
* documentos;  
* gráficos;  
* componentes pesados;  
* paneles avanzados;  
* editores.  
El contenido esencial no deberá quedar oculto indefinidamente.  
   
⸻  
   
## 592. Pagination  
Toda lista potencialmente grande deberá utilizar:  
* pagination;  
* cursor pagination;  
* limit;  
* stable ordering;  
* filters;  
* search.  
No descargar miles de registros para paginar en frontend.  
   
⸻  
   
## 593. Cursor Pagination  
Se recomienda para:  
* actividades;  
* mensajes;  
* auditoría;  
* tasks;  
* documents;  
* workflows;  
* integration events;  
* AI runs.  
Deberá evitar saltos o duplicados ante nuevos registros.  
   
⸻  
   
## 594. Offset Pagination  
Podrá utilizarse en listas pequeñas y estables.  
No será ideal para tablas muy grandes o con cambios frecuentes.  
   
⸻  
   
## 595. Límites de respuesta  
Cada endpoint deberá limitar:  
* cantidad de registros;  
* tamaño de payload;  
* profundidad;  
* campos;  
* tiempo de ejecución;  
* filtros.  
No permitir:  
```
limit = 1000000

```
   
⸻  
   
## 596. Field Selection  
Los endpoints podrán soportar proyecciones controladas.  
Ejemplo:  
```
summary view
detail view
admin view

```
No devolver objetos completos cuando solo se necesita un resumen.  
   
⸻  
   
## 597. Serialización  
La plataforma deberá:  
* evitar ciclos;  
* evitar payloads redundantes;  
* utilizar formatos consistentes;  
* controlar fechas;  
* evitar información interna;  
* usar streaming para exports grandes.  
   
⸻  
   
## 598. PostgreSQL como fuente principal  
PostgreSQL deberá optimizarse antes de considerar tecnologías más complejas.  
Prioridades:  
1. Modelo correcto.  
2. Consultas correctas.  
3. Índices.  
4. Pooling.  
5. Archivado.  
6. Partición.  
7. Replicación.  
8. Sharding futuro.  
   
⸻  
   
## 599. Query Ownership  
Cada consulta importante deberá tener un módulo responsable.  
No deberán existir consultas SQL complejas copiadas en múltiples áreas.  
   
⸻  
   
## 600. Query Budget  
Cada operación deberá definir un presupuesto aproximado:  
* cantidad de queries;  
* duración;  
* filas examinadas;  
* tamaño de respuesta;  
* locks;  
* memoria.  
   
⸻  
   
## 601. Problema N+1  
El sistema deberá detectar consultas repetidas por registro.  
Ejemplo:  
```
Load 100 clients
→ execute 100 additional queries

```
Deberá resolverse mediante:  
* joins;  
* batching;  
* projections;  
* preloading controlado;  
* DataLoader pattern cuando aplique.  
   
⸻  
   
## 602. Índices  
Los índices deberán diseñarse según:  
* filtros;  
* joins;  
* ordering;  
* uniqueness;  
* tenant boundaries;  
* active records;  
* timestamps;  
* external references.  
No crear índices sin revisar impacto de escritura.  
   
⸻  
   
## 603. Índices compuestos  
El orden de columnas deberá corresponder a consultas reales.  
Ejemplo conceptual:  
```
tenant_id
status
created_at

```
La decisión deberá validarse mediante query plans.  
   
⸻  
   
## 604. Índices parciales  
Podrán utilizarse para:  
* records activos;  
* tasks abiertas;  
* approvals pendientes;  
* jobs no completados;  
* documentos no eliminados;  
* reconciliaciones pendientes.  
   
⸻  
   
## 605. Índices únicos  
Deberán proteger:  
* idempotency keys;  
* external event IDs;  
* provider references cuando aplique;  
* usernames;  
* normalized emails según reglas;  
* entity codes;  
* version combinations.  
   
⸻  
   
## 606. Query Plans  
Las consultas críticas deberán revisarse con:  
```
EXPLAIN
EXPLAIN ANALYZE

```
en ambientes seguros.  
No ejecutar análisis destructivo o pesado indiscriminadamente en producción.  
   
⸻  
   
## 607. Slow Query Log  
PostgreSQL deberá registrar consultas lentas de forma controlada.  
Los registros deberán:  
* ocultar PII;  
* evitar payloads;  
* vincularse al servicio;  
* permitir identificar query fingerprint;  
* generar métricas.  
   
⸻  
   
## 608. Query Fingerprint  
Las consultas deberán agruparse por patrón.  
Esto permitirá identificar:  
* query más costosa;  
* mayor volumen;  
* regresiones;  
* consumo total;  
* módulos problemáticos.  
   
⸻  
   
## 609. Timeouts de base de datos  
Configurar:  
* connection timeout;  
* statement timeout;  
* lock timeout;  
* idle transaction timeout;  
* transaction duration limits.  
No permitir queries indefinidas.  
   
⸻  
   
## 610. Connection Pooling  
La aplicación deberá utilizar pools.  
Cada servicio deberá definir:  
* minimum connections;  
* maximum connections;  
* idle timeout;  
* lifetime;  
* acquisition timeout;  
* health check.  
   
⸻  
   
## 611. Pool Budget  
La suma de todos los pools no deberá exceder la capacidad de PostgreSQL.  
Ejemplo:  
```
Backend replicas
+
Workers
+
Scheduler
+
AI services
+
Admin tools

```
deberán compartir un presupuesto planificado.  
   
⸻  
   
## 612. Pool Saturation  
Cuando el pool se sature:  
* aplicar backpressure;  
* rechazar con error controlado;  
* reducir workers;  
* alertar;  
* investigar queries largas.  
No crear conexiones ilimitadas.  
   
⸻  
   
## 613. PgBouncer o equivalente  
Podrá incorporarse cuando:  
* existan muchas instancias;  
* haya conexiones cortas;  
* PostgreSQL se aproxime a límites;  
* la carga lo justifique.  
No será obligatorio desde el MVP.  
   
⸻  
   
## 614. Transacciones  
Las transacciones deberán ser:  
* cortas;  
* consistentes;  
* limitadas;  
* libres de llamadas externas.  
No mantener una transacción abierta mientras se espera:  
* Stripe;  
* Twilio;  
* IA;  
* browser worker;  
* usuario;  
* aprobación.  
   
⸻  
   
## 615. Locks  
Los locks deberán supervisarse.  
Evitar:  
* actualizaciones masivas;  
* orden inconsistente;  
* transacciones largas;  
* selects innecesarios con lock;  
* procesos batch sin límites.  
   
⸻  
   
## 616. Deadlocks  
El sistema deberá:  
* detectar;  
* registrar;  
* reintentar cuando sea seguro;  
* identificar operaciones;  
* corregir orden de acceso;  
* medir frecuencia.  
   
⸻  
   
## 617. Batch Updates  
Los trabajos masivos deberán procesar por lotes.  
Ejemplo:  
```
500,000 records
→ batches of controlled size

```
No bloquear toda una tabla mediante una única operación gigantesca.  
   
⸻  
   
## 618. Bulk Inserts  
Podrán utilizarse para:  
* imports;  
* analytics;  
* embeddings metadata;  
* migrations;  
* batch results.  
Siempre con validación, límites y transacciones controladas.  
   
⸻  
   
## 619. Archivado  
Los registros históricos podrán moverse a almacenamiento o particiones apropiadas.  
Ejemplos:  
* logs antiguos;  
* eventos de integraciones;  
* traces;  
* AI runs;  
* audit exports;  
* completed jobs;  
* old notifications.  
No eliminar información sujeta a retención.  
   
⸻  
   
## 620. Particionamiento  
PostgreSQL podrá usar particiones para tablas de gran volumen.  
Candidatas futuras:  
* audit events;  
* activity events;  
* integration inbox;  
* message delivery events;  
* AI runs;  
* metrics metadata;  
* job history.  
   
⸻  
   
## 621. Partición por tiempo  
Podrá utilizarse por:  
* mes;  
* trimestre;  
* año;  
según volumen.  
Deberá incluir automatización para crear y mantener particiones.  
   
⸻  
   
## 622. Read Replicas  
Podrán añadirse para:  
* reportes;  
* analytics;  
* búsquedas de lectura;  
* exports;  
* dashboards pesados;  
* disaster recovery.  
No deberán usarse para lecturas que requieran consistencia inmediata sin considerar replication lag.  
   
⸻  
   
## 623. Replication Lag  
La aplicación deberá saber cuándo una réplica está atrasada.  
No consultar una réplica para verificar inmediatamente:  
* pago recién confirmado;  
* aprobación recién creada;  
* permiso recién revocado;  
* documento recién firmado.  
   
⸻  
   
## 624. Sharding  
Sharding no deberá implementarse en el MVP.  
Solo deberá considerarse cuando:  
* particiones no sean suficientes;  
* una sola instancia no soporte volumen;  
* existan límites probados;  
* el costo operacional esté justificado.  
   
⸻  
   
## 625. Sharding futuro  
Una estrategia futura podrá considerar:  
* tenant;  
* region;  
* customer range;  
* service category.  
La arquitectura actual deberá evitar dependencias innecesarias con IDs secuenciales globales que dificulten migraciones.  
   
⸻  
   
## 626. Búsqueda  
Las búsquedas iniciales podrán utilizar PostgreSQL.  
Podrá añadirse un motor especializado cuando existan necesidades reales de:  
* full-text avanzado;  
* typo tolerance;  
* relevancia;  
* facetas;  
* grandes volúmenes;  
* búsqueda documental.  
   
⸻  
   
## 627. Search Index  
Un índice de búsqueda deberá considerarse derivado.  
La fuente oficial seguirá siendo PostgreSQL u object storage.  
El índice deberá poder reconstruirse.  
   
⸻  
   
## 628. Debouncing  
Las búsquedas en frontend deberán:  
* esperar un intervalo corto;  
* cancelar requests anteriores;  
* limitar longitud;  
* evitar request por cada tecla;  
* proteger endpoints.  
   
⸻  
   
## 629. Procesamiento asíncrono  
Las tareas que no requieran respuesta inmediata deberán moverse a workers.  
Ejemplos:  
* PDF;  
* email;  
* OCR complementario;  
* embeddings;  
* reports;  
* exports;  
* imports;  
* partner synchronization;  
* image conversion;  
* notifications;  
* batch analysis.  
   
⸻  
   
## 630. Sync versus Async  
## Síncrono  
Cuando el usuario necesita resultado inmediato.  
## Asíncrono  
Cuando el trabajo:  
* toma tiempo;  
* puede reintentarse;  
* depende de proveedor;  
* consume muchos recursos;  
* puede notificarse después.  
   
⸻  
   
## 631. Acknowledgement rápido  
Para trabajos asíncronos:  
```
Request accepted
→ job created
→ user receives tracking status

```
No mantener una request HTTP abierta durante varios minutos.  
   
⸻  
   
## 632. Colas separadas  
Crear colas por tipo y riesgo.  
Ejemplos:  
```
notifications
documents
integrations
payments
ai_interactive
ai_batch
browser_actions
exports
maintenance

```
Un backlog de reportes no deberá bloquear pagos.  
   
⸻  
   
## 633. Worker Pools  
Cada cola deberá tener:  
* concurrency;  
* priority;  
* timeout;  
* retry;  
* dead-letter;  
* resource limits;  
* scaling policy.  
   
⸻  
   
## 634. Backpressure de workers  
Si la cola crece:  
* reducir intake opcional;  
* escalar workers;  
* pausar batch;  
* aumentar espera;  
* alertar;  
* activar modo degradado.  
   
⸻  
   
## 635. Tareas CPU-bound  
Ejemplos:  
* compresión;  
* PDF;  
* image processing;  
* parsing;  
* encryption;  
* local inference.  
Deberán aislarse de procesos de API.  
   
⸻  
   
## 636. Tareas I/O-bound  
Ejemplos:  
* provider calls;  
* storage;  
* database;  
* network;  
* email.  
Podrán utilizar concurrencia mayor, siempre con límites.  
   
⸻  
   
## 637. Exportaciones grandes  
Los exports deberán:  
```
Create job
→ generate file
→ store securely
→ notify user
→ provide expiring link
→ delete according to retention

```
No generar archivos enormes dentro de la request.  
   
⸻  
   
## 638. Importaciones grandes  
Flujo:  
```
Upload
→ quarantine
→ validate
→ preview
→ approval
→ batch import
→ error report
→ reconciliation

```
   
⸻  
   
## 639. Document Processing Pipeline  
```
Upload
→ malware scan
→ metadata extraction
→ type validation
→ conversion
→ classification
→ indexing
→ final storage

```
Cada etapa deberá tener métricas y reintentos.  
   
⸻  
   
## 640. AI Performance  
La IA deberá medir:  
* time to first token;  
* total latency;  
* tokens per second;  
* queue wait;  
* model load time;  
* RAG time;  
* tool time;  
* validation time;  
* review wait.  
   
⸻  
   
## 641. Reducción de contexto  
Antes de utilizar modelos grandes:  
* seleccionar fuentes relevantes;  
* resumir historial;  
* eliminar duplicados;  
* limitar documentos;  
* recuperar por permisos;  
* aplicar context budget.  
No enviar todo el expediente por conveniencia.  
   
⸻  
   
## 642. Model Batching  
Para tareas no interactivas podrá agruparse inferencia.  
Ejemplos:  
* embeddings;  
* classification;  
* evaluations;  
* document pages.  
No utilizar batching que aumente demasiado la latencia del chat.  
   
⸻  
   
## 643. Pruebas de rendimiento  
Tipos:  
```
baseline_test
load_test
stress_test
spike_test
soak_test
capacity_test
failover_test

```
   
⸻  
   
## 644. Baseline Test  
Determina el rendimiento normal de una versión.  
Deberá ejecutarse antes de comparar optimizaciones.  
   
⸻  
   
## 645. Load Test  
Simula volumen esperado.  
Ejemplos:  
* usuarios simultáneos;  
* dashboard requests;  
* document uploads;  
* form submissions;  
* webhook processing;  
* AI jobs.  
   
⸻  
   
## 646. Stress Test  
Aumenta carga hasta superar capacidad.  
Objetivos:  
* encontrar límite;  
* verificar backpressure;  
* verificar degradación;  
* verificar recuperación;  
* evitar corrupción.  
   
⸻  
   
## 647. Spike Test  
Simula aumento repentino.  
Ejemplos:  
* campaña;  
* deadline tributario;  
* webhook burst;  
* notificación masiva;  
* social media post viral;  
* partner batch.  
   
⸻  
   
## 648. Soak Test  
Mantiene carga durante horas o días.  
Permite detectar:  
* memory leaks;  
* connection leaks;  
* queue accumulation;  
* cache growth;  
* disk growth;  
* thermal issues;  
* degraded performance.  
   
⸻  
   
## 649. Datos de pruebas  
Las pruebas de carga deberán usar:  
* datos ficticios;  
* documentos sintéticos;  
* cuentas sandbox;  
* emails no reales;  
* proveedores simulados;  
* identidades generadas.  
No usar información real de clientes.  
   
⸻  
   
## 650. Entorno de pruebas de carga  
Deberá parecerse a producción en:  
* arquitectura;  
* versiones;  
* límites;  
* database configuration;  
* network;  
* workers;  
* integrations simuladas.  
No ejecutar pruebas destructivas directamente en producción.  
   
⸻  
   
## 651. Escenarios críticos  
Probar:  
1. Login.  
2. Portal.  
3. Dashboard.  
4. Client search.  
5. Document upload.  
6. Form submission.  
7. Payment webhook.  
8. Task creation.  
9. Approval queue.  
10. Notification queue.  
11. Partner webhook.  
12. AI chat.  
13. AI batch.  
14. Export.  
15. Scheduler burst.  
16. Database failover futuro.  
   
⸻  
   
## 652. Criterios de prueba  
Medir:  
* throughput;  
* latency;  
* error rate;  
* saturation;  
* CPU;  
* RAM;  
* database;  
* Redis;  
* queues;  
* network;  
* storage;  
* provider simulation;  
* recovery time.  
   
⸻  
   
## 653. Performance Regression  
El pipeline deberá comparar versiones.  
Bloquear o advertir cuando:  
* p95 empeore;  
* payload aumente;  
* query count aumente;  
* memory aumente;  
* bundle aumente;  
* throughput caiga;  
* error rate aumente.  
   
⸻  
   
## 654. Thresholds  
Los límites deberán incluir tolerancias.  
No bloquear un deployment por variación mínima no significativa.  
   
⸻  
   
## 655. Capacity Planning  
La plataforma deberá estimar:  
```
current capacity
current utilization
growth rate
headroom
projected exhaustion date
recommended action

```
   
⸻  
   
## 656. Headroom  
Deberá conservarse capacidad libre para:  
* picos;  
* despliegues;  
* fallos;  
* retries;  
* batch;  
* incidentes.  
Operar continuamente al 100% será una condición de riesgo.  
   
⸻  
   
## 657. Forecasting  
Podrán proyectarse:  
* storage;  
* database;  
* queue traffic;  
* users;  
* documents;  
* AI jobs;  
* GPU hours;  
* provider costs;  
* bandwidth.  
   
⸻  
   
## 658. Storage Growth  
Medir por:  
* PostgreSQL;  
* documents;  
* backups;  
* logs;  
* traces;  
* models;  
* embeddings;  
* exports;  
* temporary files.  
   
⸻  
   
## 659. Cost per Workload  
Podrá estimarse:  
```
cost per client
cost per service order
cost per document
cost per AI run
cost per message
cost per integration call

```
La estimación ayudará a ajustar precios y capacidad.  
   
⸻  
   
## 660. Mode Degraded  
Cuando la plataforma se aproxime a saturación podrá:  
* pausar reportes;  
* pausar reindexación;  
* reducir IA avanzada;  
* limitar exports;  
* retrasar notificaciones no urgentes;  
* reducir concurrencia batch;  
* priorizar pagos;  
* priorizar autenticación;  
* priorizar servicios activos.  
   
⸻  
   
## 661. Priority Matrix  
Prioridad conceptual:  
```
1. Security
2. Authentication
3. Payments and reconciliation
4. Client access
5. Active service workflows
6. Approvals and deadlines
7. Communications
8. AI interactive
9. Reporting
10. Batch and maintenance

```
   
⸻  
   
## 662. Load Shedding  
Cuando sea necesario podrán rechazarse temporalmente trabajos no críticos.  
La respuesta deberá:  
* ser clara;  
* incluir retry guidance;  
* preservar requests importantes;  
* no mostrar éxito falso;  
* registrar evento.  
   
⸻  
   
## 663. Rate Limiting interno  
Además de protección externa, podrán existir límites para:  
* report generation;  
* exports;  
* AI jobs;  
* search;  
* uploads;  
* bulk actions;  
* integration retries.  
   
⸻  
   
## 664. Quotas  
Las cuotas podrán definirse por:  
* usuario;  
* cliente;  
* plan;  
* empleado;  
* integración;  
* agente;  
* ambiente;  
* periodo.  
   
⸻  
   
## 665. Performance Dashboard  
Deberá mostrar:  
* traffic;  
* p50;  
* p95;  
* p99;  
* error rate;  
* slow endpoints;  
* slow queries;  
* cache hit;  
* database connections;  
* queue age;  
* worker saturation;  
* frontend metrics;  
* AI latency;  
* capacity;  
* storage growth.  
   
⸻  
   
## 666. Alertas de rendimiento  
Alertas:  
* API p95 elevado;  
* error rate elevado;  
* database pool saturation;  
* slow query spike;  
* deadlocks;  
* Redis evictions;  
* cache hit collapse;  
* queue age elevada;  
* worker saturation;  
* storage low;  
* frontend error spike;  
* document backlog;  
* AI queue delay;  
* GPU saturation;  
* capacity headroom bajo.  
   
⸻  
   
## 667. Runbooks  
Deberán existir runbooks para:  
* API lenta;  
* dashboard lento;  
* database saturation;  
* pool exhaustion;  
* slow queries;  
* Redis unavailable;  
* cache stampede;  
* queue backlog;  
* worker leak;  
* storage saturation;  
* frontend regression;  
* AI latency;  
* provider slowdown;  
* traffic spike.  
   
⸻  
   
## 668. Anti-patterns  
No deberán implementarse:  
* cachear todo;  
* ocultar datos viejos como actuales;  
* queries sin límites;  
* cargar tablas completas;  
* archivos en memoria sin límite;  
* transacciones largas;  
* llamadas externas dentro de transacciones;  
* workers ilimitados;  
* retries infinitos;  
* conexiones ilimitadas;  
* escalado sin métricas;  
* sharding prematuro;  
* optimización sin baseline.  
   
⸻  
   
## 669. Criterios de aceptación  
La Parte 9 estará lista cuando:  
1. Existan objetivos de rendimiento.  
2. Se midan percentiles.  
3. Los servicios sean stateless cuando deban escalar.  
4. Exista balanceo de carga preparado.  
5. Exista connection draining.  
6. Redis no sea fuente oficial.  
7. Cada caché tenga política.  
8. Se proteja tenant isolation.  
9. Exista invalidación.  
10. Se evite cache stampede.  
11. Exista comportamiento ante caída de Redis.  
12. La CDN se limite a contenido apropiado.  
13. Los documentos privados no sean públicos.  
14. Existan cache headers.  
15. El frontend utilice carga progresiva.  
16. No exista optimistic success en acciones críticas.  
17. Todas las listas grandes estén paginadas.  
18. Los endpoints tengan límites.  
19. PostgreSQL tenga query budgets.  
20. Se detecte N+1.  
21. Existan índices validados.  
22. Existan query plans.  
23. Exista slow query monitoring.  
24. Existan timeouts.  
25. Exista pooling.  
26. La suma de pools sea segura.  
27. No existan transacciones esperando proveedores.  
28. Se detecten locks.  
29. Los batches tengan límites.  
30. Exista archivado.  
31. Particionamiento quede preparado.  
32. Read replicas queden como fase futura.  
33. No se implemente sharding prematuro.  
34. Los índices derivados sean reconstruibles.  
35. Exista procesamiento asíncrono.  
36. Existan colas separadas.  
37. Exista backpressure.  
38. Existan exports asíncronos.  
39. Existan imports seguros.  
40. Se mida AI performance.  
41. Se limite contexto.  
42. Existan pruebas de carga.  
43. Existan pruebas de estrés.  
44. Existan pruebas spike.  
45. Existan pruebas soak.  
46. Se utilicen datos sintéticos.  
47. Se detecten regresiones.  
48. Exista capacity planning.  
49. Exista headroom.  
50. Exista modo degradado.  
51. Exista load shedding.  
52. Existan dashboards.  
53. Existan alertas.  
54. Existan runbooks.  
55. La plataforma pueda crecer sin reescribir todos los módulos.  
   
⸻  
   
## 670. Instrucciones finales para Codex  
Antes de implementar rendimiento y escalabilidad:  
1. Lee los módulos 1 al 25.  
2. Lee las partes 1 a 9 del Módulo 26.  
3. Inspecciona la arquitectura actual.  
4. Mide antes de optimizar.  
5. Define baselines.  
6. Define objetivos internos.  
7. Instrumenta p50, p95 y p99.  
8. Separa latencia de frontend, backend, database y providers.  
9. Mantén servicios stateless.  
10. No almacenes estado oficial localmente.  
11. Implementa health-aware load balancing.  
12. Implementa connection draining.  
13. Evita depender de sticky sessions.  
14. Utiliza Redis solo para estado temporal.  
15. Define políticas de caché.  
16. Define TTL.  
17. Define invalidación.  
18. Protege tenant isolation.  
19. No cachees secretos.  
20. No cachees datos críticos sin política.  
21. Implementa protección contra cache stampede.  
22. Implementa fallback si Redis falla.  
23. Implementa métricas de caché.  
24. Configura CDN solo para contenido apropiado.  
25. Protege contenido privado.  
26. Configura Cache-Control.  
27. Optimiza imágenes.  
28. Reduce bundles.  
29. Implementa lazy loading.  
30. No uses optimistic UI para acciones críticas.  
31. Implementa paginación.  
32. Prefiere cursor pagination cuando corresponda.  
33. Limita payloads.  
34. Implementa proyecciones.  
35. No devuelvas entidades completas innecesariamente.  
36. Optimiza PostgreSQL antes de introducir más bases.  
37. Define query ownership.  
38. Define query budgets.  
39. Detecta N+1.  
40. Diseña índices con evidencia.  
41. Revisa query plans.  
42. Implementa slow query monitoring.  
43. Implementa query fingerprints.  
44. Configura timeouts.  
45. Configura connection pools.  
46. Calcula el pool budget total.  
47. Implementa backpressure ante pool saturation.  
48. Considera PgBouncer solo cuando sea necesario.  
49. Mantén transacciones cortas.  
50. No hagas provider calls dentro de transacciones.  
51. Supervisa locks.  
52. Detecta deadlocks.  
53. Implementa batch processing.  
54. Implementa bulk operations controladas.  
55. Implementa archivado.  
56. Prepara particionamiento.  
57. No uses read replicas para consistencia inmediata.  
58. No implementes sharding sin evidencia.  
59. Mantén search index reconstruible.  
60. Implementa debouncing.  
61. Mueve tareas largas a workers.  
62. Separa procesamiento síncrono y asíncrono.  
63. Devuelve acknowledgement rápido.  
64. Separa colas.  
65. Define worker pools.  
66. Implementa backpressure.  
67. Aísla tareas CPU-bound.  
68. Limita tareas I/O-bound.  
69. Implementa exports asíncronos.  
70. Implementa imports por etapas.  
71. Instrumenta document pipelines.  
72. Instrumenta AI latency.  
73. Reduce contexto.  
74. Implementa batching solo donde beneficie.  
75. Crea baseline tests.  
76. Crea load tests.  
77. Crea stress tests.  
78. Crea spike tests.  
79. Crea soak tests.  
80. Usa datos sintéticos.  
81. No ejecutes pruebas destructivas en producción.  
82. Implementa performance regression checks.  
83. Define tolerancias.  
84. Implementa capacity planning.  
85. Calcula headroom.  
86. Proyecta storage.  
87. Proyecta costos.  
88. Implementa modo degradado.  
89. Define priority matrix.  
90. Implementa load shedding.  
91. Implementa cuotas.  
92. Implementa dashboard.  
93. Implementa alertas.  
94. Implementa runbooks.  
95. Prueba caída de Redis.  
96. Prueba pool saturation.  
97. Prueba queue backlog.  
98. Prueba traffic spike.  
99. Prueba storage pressure.  
100. No marques rendimiento como completo sin pruebas sostenidas.  
Antes de entregar, verifica:  
* ¿Se mide p95 y p99?  
* ¿El dashboard identifica el componente lento?  
* ¿Los servicios pueden replicarse?  
* ¿El balanceador retira instancias no saludables?  
* ¿La caché está aislada por cliente?  
* ¿La caída de Redis no pierde datos?  
* ¿Los documentos privados no quedan públicos en CDN?  
* ¿Las listas grandes están paginadas?  
* ¿Los endpoints limitan tamaño?  
* ¿Las consultas críticas tienen índices?  
* ¿Se detectan consultas N+1?  
* ¿Existen timeouts de base de datos?  
* ¿El número total de conexiones está controlado?  
* ¿Las transacciones permanecen cortas?  
* ¿Los procesos masivos trabajan por lotes?  
* ¿Las colas críticas están separadas?  
* ¿Existe backpressure?  
* ¿Los exports se generan fuera de la request?  
* ¿La IA reduce contexto antes de inferencia?  
* ¿Existen pruebas de carga, estrés, spike y soak?  
* ¿Las pruebas utilizan datos sintéticos?  
* ¿El pipeline detecta regresiones?  
* ¿Existe capacidad libre para picos?  
* ¿La plataforma puede entrar en modo degradado?  
* ¿Las acciones críticas conservan prioridad?  
* ¿La arquitectura evita sharding prematuro?  
  
  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
## Parte 10 — Operación Diaria, Mantenimiento, Incidentes, Costos, Roadmap y Cierre del Módulo  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 26 — Parte 9 **Secciones incluidas:** 671–790 **Audiencia:** Codex, owner, administradores, desarrolladores, DevOps, seguridad, operaciones, soporte y responsables de cumplimiento **Idioma del código:** Inglés **Modelo operativo:** Operación controlada, automatización auditable y mejora continua  
   
⸻  
   
## 671. Objetivo  
Esta parte define cómo SG Solutions deberá operarse diariamente después de entrar en producción.  
Incluye:  
* mantenimiento;  
* tareas programadas;  
* gestión de cambios;  
* feature flags;  
* soporte técnico;  
* respuesta a incidentes;  
* gestión de costos;  
* revisiones operativas;  
* controles de acceso;  
* preparación de releases;  
* checklists;  
* roadmap de infraestructura;  
* criterios finales de aceptación.  
El objetivo será evitar que la plataforma dependa de:  
* memoria humana;  
* cambios improvisados;  
* accesos directos a producción;  
* tareas manuales repetitivas;  
* una sola persona;  
* procedimientos no documentados;  
* acciones sensibles sin aprobación;  
* infraestructura sin monitoreo.  
   
⸻  
   
## 672. Principio operativo  
La operación deberá seguir:  
```
Observe
→ Prioritize
→ Execute safely
→ Verify
→ Record
→ Review
→ Improve

```
No deberá seguir:  
```
Notice a problem
→ modify production manually
→ hope it works

```
   
⸻  
   
## 673. Centro de Operaciones  
La plataforma deberá contar con un centro administrativo de operaciones.  
Este centro podrá mostrar:  
* estado general;  
* incidentes;  
* alertas;  
* backups;  
* deployments;  
* colas;  
* integraciones;  
* costos;  
* tareas programadas;  
* capacidad;  
* seguridad;  
* mantenimiento;  
* feature flags;  
* AI infrastructure;  
* GPU node;  
* workflows detenidos;  
* reconciliaciones pendientes.  
   
⸻  
   
## 674. Operational Status  
Estados generales:  
```
operational
degraded
partially_unavailable
maintenance
major_outage
security_incident
recovery_in_progress

```
El estado deberá determinarse mediante evidencia técnica y no solo mediante selección manual.  
   
⸻  
   
## 675. Resumen para el owner  
El owner deberá poder consultar un resumen sencillo:  
* plataforma disponible;  
* problemas activos;  
* clientes afectados;  
* pagos pendientes de reconciliación;  
* integraciones degradadas;  
* tareas críticas atrasadas;  
* costos del día;  
* estado del nodo GPU;  
* último backup verificado;  
* último deployment;  
* riesgos próximos.  
No deberá requerirse interpretar dashboards técnicos complejos para conocer la salud general.  
   
⸻  
   
## 676. Operación diaria  
Las operaciones diarias podrán incluir:  
* revisión de alertas;  
* revisión de colas;  
* revisión de pagos;  
* revisión de integraciones;  
* revisión de backups;  
* revisión de tareas vencidas;  
* revisión de approvals;  
* revisión de incidentes;  
* revisión de seguridad;  
* revisión de costos;  
* revisión del nodo GPU;  
* revisión de capacidad.  
   
⸻  
   
## 677. Daily Operations Checklist  
Checklist conceptual:  
```
Platform health reviewed
Critical alerts reviewed
Backups verified
Payment reconciliation reviewed
Dead-letter queues reviewed
Critical tasks reviewed
Approval backlog reviewed
External providers reviewed
Security events reviewed
Storage capacity reviewed
AI costs reviewed
GPU status reviewed

```
El checklist deberá registrar quién lo completó.  
   
⸻  
   
## 678. Operación semanal  
La revisión semanal deberá incluir:  
* tendencias;  
* errores repetidos;  
* performance;  
* costos;  
* crecimiento;  
* capacidad;  
* dependencias vulnerables;  
* restore tests pendientes;  
* permisos administrativos;  
* feature flags antiguas;  
* tareas manuales repetidas;  
* incidentes menores;  
* deuda técnica operativa.  
   
⸻  
   
## 679. Operación mensual  
La revisión mensual deberá incluir:  
* disponibilidad;  
* SLOs;  
* error budgets;  
* incidentes;  
* costos por servicio;  
* costos por proveedor;  
* crecimiento de almacenamiento;  
* consumo de IA;  
* utilización de GPU;  
* estado de backups;  
* pruebas de recuperación;  
* contratos de proveedores;  
* accesos administrativos;  
* secretos próximos a rotar;  
* certificados próximos a expirar;  
* roadmap de capacidad.  
   
⸻  
   
## 680. Operational Review Record  
Campos conceptuales:  
```
id
reviewType
periodStart
periodEnd
status
reviewedBy
completedAt
platformSummary
incidentSummary
costSummary
capacitySummary
securitySummary
actionItems
evidenceReferences
createdAt

```
   
⸻  
   
## 681. Action Items  
Toda revisión podrá generar acciones.  
Cada acción deberá incluir:  
* responsable;  
* prioridad;  
* fecha límite;  
* riesgo;  
* evidencia;  
* módulo afectado;  
* estado;  
* resultado.  
No deberán quedar únicamente en notas de reunión.  
   
⸻  
   
## 682. Scheduler central  
La plataforma deberá contar con un scheduler central o coordinado.  
Responsabilidades:  
* tareas recurrentes;  
* recordatorios;  
* sincronizaciones;  
* backups;  
* limpieza;  
* reconciliaciones;  
* renovaciones;  
* reportes;  
* revisiones;  
* alertas preventivas;  
* mantenimiento de índices.  
   
⸻  
   
## 683. Diferencia entre Scheduler y Workflow  
## Scheduler  
Determina cuándo iniciar un trabajo.  
## Workflow  
Determina cómo se ejecuta el proceso empresarial.  
Ejemplo:  
```
Scheduler:
Run daily at 08:00 UTC.

Workflow:
Identify overdue client tasks and create follow-ups.

```
   
⸻  
   
## 684. Scheduled Job Definition  
Campos:  
```
id
code
displayName
jobType
scheduleExpression
timeZone
enabled
owner
priority
timeout
retryPolicy
concurrencyPolicy
misfirePolicy
environment
handlerReference
lastRunAt
nextRunAt
createdAt
updatedAt

```
   
⸻  
   
## 685. Timezone del scheduler  
Los schedulers técnicos deberán operar preferiblemente en UTC.  
Las reglas de negocio podrán utilizar:  
* zona del cliente;  
* zona de la oficina;  
* jurisdicción;  
* calendario comercial;  
* horario de verano.  
La conversión deberá ser explícita.  
   
⸻  
   
## 686. Expresiones de calendario  
Los jobs podrán usar:  
* cron;  
* intervalo;  
* fecha única;  
* calendario comercial;  
* evento de dominio;  
* política de vencimiento.  
Las expresiones deberán validarse antes de publicarse.  
   
⸻  
   
## 687. Misfire Policy  
Cuando un job no se ejecute a tiempo:  
```
skip
run_once
run_immediately
reschedule
manual_review

```
La política dependerá del tipo de trabajo.  
   
⸻  
   
## 688. Misfires críticos  
No deberán ejecutarse automáticamente y en masa todos los jobs vencidos después de una interrupción.  
Ejemplos de riesgo:  
* cientos de emails;  
* renovaciones;  
* browser actions;  
* partner submissions;  
* recordatorios duplicados;  
* llamadas;  
* AI batch jobs.  
   
⸻  
   
## 689. Concurrency Policy  
Opciones:  
```
allow
forbid
replace
queue
single_instance

```
Un backup o reconciliación crítica podrá requerir una sola instancia activa.  
   
⸻  
   
## 690. Distributed Lock  
Los jobs únicos deberán utilizar locks distribuidos o mecanismos equivalentes.  
El lock deberá:  
* expirar;  
* renovarse;  
* registrar owner;  
* evitar ejecución duplicada;  
* recuperarse de procesos caídos.  
   
⸻  
   
## 691. Job Execution Record  
```
id
jobDefinitionId
scheduledFor
startedAt
completedAt
status
attempt
nodeId
correlationId
resultReference
errorCode
metrics
createdAt

```
   
⸻  
   
## 692. Estados de ejecución  
```
scheduled
acquiring_lock
running
completed
completed_with_warning
failed
timed_out
cancelled
skipped
misfired
dead_lettered
unknown

```
   
⸻  
   
## 693. Tareas programadas iniciales  
Podrán incluir:  
* backups;  
* backup verification;  
* document retention;  
* temporary file cleanup;  
* expired link cleanup;  
* stale session cleanup;  
* payment reconciliation;  
* provider reconciliation;  
* webhook recovery;  
* queue health;  
* overdue task review;  
* appointment reminders;  
* renewal reminders;  
* certificate expiration checks;  
* secret rotation reminders;  
* vulnerability scanning;  
* AI cost aggregation;  
* GPU maintenance;  
* knowledge base freshness review;  
* workflow stuck detection.  
   
⸻  
   
## 694. Jobs sensibles  
Los jobs no deberán ejecutar automáticamente:  
* refunds;  
* tax filings;  
* credit disputes;  
* lender applications;  
* partner submissions;  
* service activations;  
* legal submissions;  
* browser actions sensibles;  
sin la aprobación requerida.  
   
⸻  
   
## 695. Pago y activación de servicio  
El scheduler o un webhook podrá detectar un pago confirmado.  
El estado resultante deberá ser:  
```
payment_confirmed_pending_internal_service_start

```
No:  
```
service_active

```
La activación seguirá requiriendo la validación interna definida en los módulos de Billing, Servicios y Aprobaciones.  
   
⸻  
   
## 696. Automatización de mantenimiento  
Podrá automatizarse:  
* limpieza;  
* rotación;  
* verificación;  
* compactación;  
* archivado;  
* actualización de índices;  
* renovación de certificados;  
* generación de reportes;  
* revisión de expiraciones.  
Las acciones destructivas deberán tener límites y auditoría.  
   
⸻  
   
## 697. Maintenance Window  
Deberán definirse ventanas de mantenimiento.  
Campos:  
```
id
environment
startsAt
endsAt
scope
reason
expectedImpact
approvedBy
communicationPlan
rollbackPlan
status
createdAt

```
   
⸻  
   
## 698. Estados de mantenimiento  
```
planned
approved
announced
active
extended
completed
cancelled
failed

```
   
⸻  
   
## 699. Mantenimiento planificado  
Antes de comenzar:  
1. Revisar alcance.  
2. Revisar backups.  
3. Revisar rollback.  
4. Validar responsables.  
5. Comunicar impacto.  
6. Pausar jobs afectados.  
7. Preparar monitoreo.  
8. Confirmar ventana.  
   
⸻  
   
## 700. Mantenimiento de emergencia  
Podrá utilizarse ante:  
* vulnerabilidad crítica;  
* pérdida de datos;  
* ataque;  
* fallo grave;  
* corrupción;  
* proveedor comprometido;  
* certificado vencido;  
* infraestructura inestable.  
Deberá documentarse incluso si la aprobación ocurre después por urgencia.  
   
⸻  
   
## 701. Maintenance Mode  
La aplicación podrá entrar en modo de mantenimiento.  
Características:  
* banner;  
* acceso administrativo;  
* bloqueo de writes seleccionados;  
* portal en read-only;  
* pagos bloqueados cuando sea necesario;  
* webhooks conservados;  
* colas pausadas;  
* scheduler restringido;  
* status visible.  
   
⸻  
   
## 702. Read-only Mode  
La plataforma podrá permitir:  
* login;  
* consulta de documentos;  
* consulta de servicios;  
* consulta de mensajes;  
* consulta de pagos;  
mientras bloquea operaciones de escritura.  
   
⸻  
   
## 703. Cambios en producción  
Todo cambio deberá clasificarse:  
```
standard
normal
emergency
high_risk
security
infrastructure
data
provider

```
   
⸻  
   
## 704. Standard Change  
Cambio repetible y previamente aprobado.  
Ejemplos:  
* renovación automática de certificado;  
* deployment rutinario;  
* rotación programada;  
* actualización de configuración conocida.  
   
⸻  
   
## 705. Normal Change  
Requiere:  
* revisión;  
* pruebas;  
* aprobación;  
* rollback;  
* monitoreo.  
   
⸻  
   
## 706. Emergency Change  
Se utilizará para restaurar seguridad o disponibilidad.  
Deberá requerir:  
* motivo;  
* responsable;  
* alcance;  
* evidencia;  
* revisión posterior;  
* documentación.  
   
⸻  
   
## 707. High-Risk Change  
Ejemplos:  
* migración grande;  
* cambio de cifrado;  
* cambio de proveedor de pagos;  
* cambio de autorización;  
* modificación de retención;  
* restauración;  
* cambio de DNS;  
* modificación del AI routing;  
* acceso a datos restringidos.  
   
⸻  
   
## 708. Change Record  
```
id
changeType
title
description
riskLevel
environment
affectedServices
requestedBy
approvedBy
plannedStart
plannedEnd
rollbackPlan
validationPlan
status
deploymentId
incidentId
createdAt
updatedAt

```
   
⸻  
   
## 709. Estados del cambio  
```
draft
pending_review
approved
scheduled
in_progress
validating
completed
completed_with_warning
failed
rolled_back
cancelled

```
   
⸻  
   
## 710. Feature Flags  
Las feature flags permitirán separar:  
```
deployment
from
feature activation

```
Una funcionalidad podrá estar desplegada pero desactivada.  
   
⸻  
   
## 711. Tipos de feature flags  
```
release
operational
experiment
permission
provider
kill_switch
migration
maintenance
capacity

```
   
⸻  
   
## 712. Feature Flag Definition  
```
id
key
displayName
description
flagType
defaultValue
environment
owner
riskLevel
expirationDate
createdAt
updatedAt

```
   
⸻  
   
## 713. Targeting  
Una flag podrá activarse por:  
* ambiente;  
* usuario;  
* rol;  
* cliente;  
* organización;  
* servicio;  
* porcentaje;  
* plan;  
* región;  
* grupo interno;  
* proveedor.  
   
⸻  
   
## 714. Flags sensibles  
Las flags que afecten:  
* pagos;  
* permisos;  
* tax filing;  
* identity data;  
* browser workers;  
* AI cloud routing;  
* refunds;  
* data sharing;  
deberán requerir aprobación y auditoría.  
   
⸻  
   
## 715. Evaluación de flags  
La evaluación deberá:  
* ser rápida;  
* tener cache segura;  
* utilizar defaults;  
* ser consistente;  
* registrar cambios;  
* fallar de forma segura.  
   
⸻  
   
## 716. Flag Failure  
Cuando no pueda resolverse una flag:  
* usar default seguro;  
* no activar acciones sensibles;  
* registrar error;  
* alertar cuando exista impacto.  
   
⸻  
   
## 717. Flags temporales  
Toda flag temporal deberá tener:  
* owner;  
* fecha de expiración;  
* plan de eliminación;  
* documentación;  
* ticket relacionado.  
   
⸻  
   
## 718. Flag Debt  
Las flags antiguas deberán revisarse.  
Una flag olvidada puede:  
* aumentar complejidad;  
* causar caminos inconsistentes;  
* crear riesgos;  
* dificultar pruebas;  
* ocultar código muerto.  
   
⸻  
   
## 719. Kill Switches operativos  
Deberán existir controles para desactivar rápidamente:  
* pagos;  
* refunds;  
* emails;  
* SMS;  
* WhatsApp;  
* voz;  
* tax submission;  
* partner sharing;  
* browser worker;  
* cloud AI;  
* GPU jobs;  
* document processing;  
* exports;  
* scheduler;  
* integraciones específicas.  
   
⸻  
   
## 720. Kill Switch Activation  
Deberá requerir:  
* autenticación;  
* permiso;  
* motivo;  
* scope;  
* duración;  
* auditoría;  
* notificación;  
* plan de recuperación.  
   
⸻  
   
## 721. Owner Override  
El owner podrá disponer de override para situaciones excepcionales.  
Deberá requerir:  
* reautenticación;  
* MFA;  
* motivo obligatorio;  
* advertencia;  
* alcance limitado;  
* expiración;  
* auditoría;  
* notificación.  
No deberá eliminar controles de seguridad permanentemente.  
   
⸻  
   
## 722. Break-Glass Access  
Acceso de emergencia destinado a:  
* recuperación;  
* incidente crítico;  
* pérdida de acceso normal;  
* restauración de seguridad.  
No deberá utilizarse para conveniencia.  
   
⸻  
   
## 723. Break-Glass Record  
```
id
identityId
reason
scope
requestedAt
activatedAt
expiresAt
status
reviewedAt
evidenceReference
createdAt

```
   
⸻  
   
## 724. Revisión de accesos  
Deberá realizarse periódicamente una revisión de:  
* administradores;  
* empleados;  
* cuentas de servicio;  
* integraciones;  
* agentes;  
* herramientas;  
* secretos;  
* accesos a producción;  
* accesos a backups;  
* accesos al nodo GPU.  
   
⸻  
   
## 725. Access Review  
La revisión deberá identificar:  
* usuarios inactivos;  
* permisos excesivos;  
* cuentas sin owner;  
* cuentas compartidas;  
* tokens antiguos;  
* scopes innecesarios;  
* empleados que cambiaron de función;  
* accesos temporales vencidos.  
   
⸻  
   
## 726. Offboarding  
Cuando una persona deje de trabajar con SG Solutions:  
```
Disable account
→ revoke sessions
→ revoke tokens
→ remove groups
→ rotate shared secrets if any
→ transfer ownership
→ preserve audit
→ verify completion

```
   
⸻  
   
## 727. Onboarding técnico  
Antes de dar acceso:  
* validar identidad;  
* asignar rol mínimo;  
* activar MFA;  
* aceptar políticas;  
* asignar equipo;  
* registrar dispositivo cuando corresponda;  
* capacitar;  
* definir expiración de accesos temporales.  
   
⸻  
   
## 728. Gestión de parches  
Los parches deberán clasificarse por:  
* severidad;  
* exposición;  
* exploit disponible;  
* componente;  
* impacto;  
* compatibilidad;  
* urgencia.  
   
⸻  
   
## 729. Parches críticos  
Un parche crítico podrá activar:  
* emergency change;  
* ventana de emergencia;  
* feature disablement;  
* proveedor alterno;  
* deployment acelerado;  
* revisión posterior.  
   
⸻  
   
## 730. Dependabot y herramientas equivalentes  
Podrán utilizarse para:  
* detectar versiones;  
* crear PR;  
* informar vulnerabilidades;  
* actualizar lockfiles;  
* revisar imágenes.  
Las actualizaciones no deberán fusionarse sin pruebas.  
   
⸻  
   
## 731. Actualizaciones automáticas  
Podrán automatizarse en ambientes no productivos.  
Producción deberá requerir:  
* tests;  
* revisión;  
* validación;  
* rollback;  
* monitoreo.  
   
⸻  
   
## 732. Inventario de activos  
Deberá mantenerse un inventario de:  
* servidores;  
* dominios;  
* certificados;  
* bases de datos;  
* buckets;  
* repositorios;  
* registries;  
* GPU nodes;  
* proveedores;  
* cuentas;  
* secretos;  
* dispositivos;  
* licencias;  
* modelos;  
* runtimes.  
   
⸻  
   
## 733. Asset Record  
```
id
assetType
name
environment
owner
criticality
provider
region
status
version
supportExpiration
lastReviewedAt
createdAt
updatedAt

```
   
⸻  
   
## 734. Shadow Infrastructure  
No deberán existir:  
* servidores desconocidos;  
* buckets personales;  
* scripts no versionados;  
* bases paralelas;  
* APIs ocultas;  
* cuentas de proveedores sin registrar;  
* modelos sin inventario.  
   
⸻  
   
## 735. Gestión de costos  
La plataforma deberá implementar principios de FinOps.  
Objetivos:  
* conocer costos;  
* asignarlos;  
* detectar anomalías;  
* reducir desperdicio;  
* proyectar crecimiento;  
* apoyar decisiones;  
* vincular costo con valor.  
   
⸻  
   
## 736. Categorías de costo  
```
compute
database
storage
bandwidth
backups
monitoring
email
sms
whatsapp
voice
payments
ai_cloud
gpu_energy
software_licenses
security
domain_and_dns
partner_fees
support

```
   
⸻  
   
## 737. Cost Record  
```
id
provider
category
service
environment
period
quantity
unit
unitCost
totalCost
currency
estimated
sourceReference
createdAt

```
   
⸻  
   
## 738. Cost Allocation  
Los costos podrán asignarse por:  
* módulo;  
* servicio;  
* cliente;  
* canal;  
* agente;  
* proveedor;  
* ambiente;  
* campaña;  
* workload.  
No todos los costos podrán atribuirse con exactitud.  
   
⸻  
   
## 739. Costos estimados  
Los costos marcados como estimados deberán identificarse claramente.  
Ejemplos:  
* consumo eléctrico;  
* costo por GPU;  
* costo compartido de servidor;  
* depreciación de hardware;  
* tiempo de personal.  
   
⸻  
   
## 740. Budget  
Podrán definirse presupuestos:  
```
global monthly
provider monthly
AI monthly
communications monthly
infrastructure monthly
environment monthly
service budget
experimental budget

```
   
⸻  
   
## 741. Budget Alert  
Alertas:  
* 50%;  
* 75%;  
* 90%;  
* 100%;  
* proyección de exceso;  
* crecimiento anómalo;  
* proveedor inesperado;  
* ambiente de pruebas costoso.  
Los porcentajes serán configurables.  
   
⸻  
   
## 742. Cost Anomaly  
Deberá detectarse:  
* aumento repentino;  
* consumo fuera de horario;  
* loops;  
* retries;  
* storage inesperado;  
* AI context excesivo;  
* mensajes duplicados;  
* recursos olvidados;  
* logs sin control;  
* backups redundantes.  
   
⸻  
   
## 743. Cost Optimization  
Podrá incluir:  
* apagar nodos;  
* ajustar retención;  
* comprimir;  
* archivar;  
* reducir modelos;  
* usar procesamiento local;  
* optimizar queries;  
* eliminar recursos inactivos;  
* agrupar batch;  
* ajustar workers;  
* utilizar CDN;  
* renegociar proveedores.  
   
⸻  
   
## 744. Costos versus confiabilidad  
La reducción de costos no deberá eliminar:  
* backups;  
* monitoreo;  
* seguridad;  
* redundancia crítica;  
* auditoría;  
* capacidad de recuperación.  
   
⸻  
   
## 745. Incident Management  
La plataforma deberá contar con un proceso formal para incidentes.  
Flujo:  
```
Detect
→ Declare
→ Classify
→ Assign
→ Contain
→ Communicate
→ Resolve
→ Recover
→ Reconcile
→ Review

```
   
⸻  
   
## 746. Tipos de incidente  
```
availability
performance
security
privacy
data_integrity
payment
integration
ai
infrastructure
deployment
compliance
operational

```
   
⸻  
   
## 747. Incident Record  
```
id
incidentNumber
title
incidentType
severity
status
startedAt
detectedAt
declaredAt
resolvedAt
owner
affectedServices
affectedClientsEstimate
dataImpact
financialImpact
securityImpact
rootCause
timelineReference
communicationReference
postmortemReference
createdAt
updatedAt

```
   
⸻  
   
## 748. Estados del incidente  
```
detected
triaging
declared
investigating
contained
mitigating
monitoring
resolved
closed
reopened

```
   
⸻  
   
## 749. Severidades  
```
SEV-1 Critical
SEV-2 High
SEV-3 Moderate
SEV-4 Low

```
La severidad deberá considerar:  
* disponibilidad;  
* datos;  
* dinero;  
* seguridad;  
* cantidad de clientes;  
* obligaciones;  
* duración;  
* workaround.  
   
⸻  
   
## 750. SEV-1  
Ejemplos:  
* pérdida potencial de datos;  
* acceso no autorizado;  
* pagos duplicados;  
* exposición de información;  
* caída total;  
* backups comprometidos;  
* filing incorrecto masivo;  
* corrupción crítica.  
   
⸻  
   
## 751. Incident Commander  
Cada incidente importante deberá tener un responsable de coordinación.  
Funciones:  
* mantener visión general;  
* asignar trabajo;  
* evitar acciones contradictorias;  
* controlar comunicación;  
* registrar decisiones;  
* decidir escalamiento.  
   
⸻  
   
## 752. Roles de incidente  
Podrán incluir:  
```
Incident Commander
Technical Lead
Security Lead
Operations Lead
Communications Lead
Business Owner
Recorder

```
En una empresa pequeña, una persona podrá cubrir varios roles, pero las responsabilidades deberán seguir existiendo.  
   
⸻  
   
## 753. Incident Timeline  
Deberá registrar:  
* detección;  
* alerta;  
* decisiones;  
* cambios;  
* mitigaciones;  
* comunicaciones;  
* recovery;  
* cierre.  
Las fechas deberán utilizar UTC.  
   
⸻  
   
## 754. Contención  
La contención podrá incluir:  
* kill switch;  
* bloqueo de cuenta;  
* revocación;  
* aislamiento;  
* pausa de integración;  
* read-only mode;  
* rollback;  
* bloqueo de writes;  
* desconexión de nodo;  
* suspensión de scheduler.  
   
⸻  
   
## 755. Comunicación interna  
Durante un incidente deberá existir un canal específico.  
El canal no deberá depender exclusivamente del sistema afectado.  
   
⸻  
   
## 756. Comunicación al cliente  
Cuando corresponda deberá ser:  
* clara;  
* factual;  
* sin especulación;  
* sin detalles inseguros;  
* con impacto conocido;  
* con acciones necesarias;  
* con actualizaciones.  
   
⸻  
   
## 757. Status Page  
Fase futura:  
* estado público;  
* incidentes;  
* mantenimiento;  
* componentes;  
* historial;  
* suscripciones;  
* actualizaciones.  
No deberá revelar arquitectura sensible.  
   
⸻  
   
## 758. Postmortem  
Todo incidente importante deberá generar un análisis.  
Debe incluir:  
* resumen;  
* impacto;  
* timeline;  
* causa;  
* factores contribuyentes;  
* detección;  
* respuesta;  
* qué funcionó;  
* qué falló;  
* acciones;  
* responsables;  
* fechas.  
   
⸻  
   
## 759. Postmortem sin culpas  
El objetivo será mejorar el sistema.  
No ocultará errores humanos, pero analizará:  
* controles;  
* interfaces;  
* capacitación;  
* procesos;  
* automatización;  
* permisos;  
* presión;  
* documentación.  
   
⸻  
   
## 760. Corrective Action  
Cada acción deberá:  
* corregir causa;  
* reducir recurrencia;  
* mejorar detección;  
* mejorar recuperación;  
* tener owner;  
* tener prioridad;  
* tener fecha.  
   
⸻  
   
## 761. Problem Management  
Los problemas repetidos deberán agruparse.  
Ejemplo:  
```
Five separate timeout incidents
→ one systemic provider timeout problem

```
   
⸻  
   
## 762. Known Error  
Un problema conocido podrá registrar:  
* síntomas;  
* causa;  
* workaround;  
* riesgos;  
* servicios;  
* solución futura;  
* owner.  
   
⸻  
   
## 763. Service Desk técnico  
La plataforma podrá recibir reportes de:  
* clientes;  
* empleados;  
* alertas;  
* proveedores;  
* auditorías;  
* AI detection;  
* monitoreo.  
Todos deberán entrar en un sistema de seguimiento.  
   
⸻  
   
## 764. Support Ticket técnico  
Campos:  
```
id
source
requester
category
priority
service
environment
description
status
assignedTo
incidentId
clientImpact
createdAt
updatedAt

```
   
⸻  
   
## 765. Separación de soporte y expediente  
Un ticket técnico no deberá convertirse en la ubicación principal de información financiera o tributaria del cliente.  
Las referencias deberán apuntar a los módulos oficiales.  
   
⸻  
   
## 766. Runbook Library  
Deberá existir una biblioteca central.  
Categorías:  
* disponibilidad;  
* database;  
* storage;  
* backups;  
* integrations;  
* payments;  
* communications;  
* AI;  
* GPU;  
* security;  
* deployments;  
* performance;  
* disaster recovery.  
   
⸻  
   
## 767. Runbook Versioning  
Cada runbook deberá tener:  
* versión;  
* owner;  
* fecha;  
* estado;  
* prueba;  
* última revisión;  
* próxima revisión.  
   
⸻  
   
## 768. Automation Safety  
Una automatización operativa deberá incluir:  
* scope;  
* limit;  
* timeout;  
* retry;  
* dry run;  
* audit;  
* rollback;  
* kill switch;  
* owner.  
   
⸻  
   
## 769. Dry Run  
Las automatizaciones peligrosas deberán poder mostrar:  
* recursos afectados;  
* cantidad;  
* acciones;  
* warnings;  
* dependencias;  
* resultado esperado.  
No ejecutar cambios masivos sin vista previa.  
   
⸻  
   
## 770. Operaciones masivas  
Ejemplos:  
* cancelar jobs;  
* archivar datos;  
* limpiar documentos;  
* rotar claves;  
* desactivar usuarios;  
* cambiar flags;  
* reintentar webhooks.  
Deberán requerir:  
* filtros;  
* límite;  
* preview;  
* aprobación;  
* confirmación;  
* auditoría.  
   
⸻  
   
## 771. AI Operations Assistant  
La IA podrá ayudar al owner a:  
* resumir incidentes;  
* explicar métricas;  
* identificar patrones;  
* preparar runbooks;  
* proponer consultas;  
* preparar cambios;  
* generar reportes;  
* revisar costos;  
* detectar riesgos.  
   
⸻  
   
## 772. Límites del AI Operations Assistant  
No podrá:  
* desplegar;  
* restaurar;  
* eliminar backups;  
* activar break-glass;  
* rotar secretos;  
* cambiar permisos;  
* ejecutar refunds;  
* desactivar seguridad;  
* cambiar routing sensible;  
sin herramientas controladas y aprobación humana.  
   
⸻  
   
## 773. Production Readiness Review  
Antes del lanzamiento deberá realizarse una revisión integral.  
Áreas:  
* arquitectura;  
* seguridad;  
* privacidad;  
* datos;  
* backups;  
* recuperación;  
* rendimiento;  
* monitoreo;  
* integraciones;  
* pagos;  
* AI;  
* operaciones;  
* soporte;  
* documentación.  
   
⸻  
   
## 774. Checklist de infraestructura  
* Dominios configurados.  
* DNS protegido.  
* TLS activo.  
* Firewalls configurados.  
* Puertos mínimos.  
* Redes segmentadas.  
* Contenedores sin root.  
* Recursos limitados.  
* Health checks activos.  
* Secret Manager activo.  
* Backups activos.  
* Monitoring activo.  
   
⸻  
   
## 775. Checklist de aplicación  
* Autenticación probada.  
* MFA probada.  
* Autorización por recurso.  
* Protección IDOR.  
* Logs sin PII.  
* Auditoría.  
* Rate limiting.  
* Error handling.  
* Feature flags.  
* Kill switches.  
* Modo mantenimiento.  
* Modo degradado.  
   
⸻  
   
## 776. Checklist de base de datos  
* Roles mínimos.  
* No superuser para aplicación.  
* Migraciones probadas.  
* Índices revisados.  
* Timeouts.  
* Pool budget.  
* Backup.  
* PITR.  
* Restore test.  
* Cifrado.  
* Alertas de capacidad.  
   
⸻  
   
## 777. Checklist de documentos  
* Storage privado.  
* URLs temporales.  
* Antivirus.  
* Quarantine.  
* Versioning.  
* Checksums.  
* Retención.  
* Backup.  
* Restauración.  
* Autorización por documento.  
   
⸻  
   
## 778. Checklist de pagos  
* Sandbox probado.  
* Producción separada.  
* Webhook verificado.  
* Idempotencia.  
* Reconciliación.  
* Estado unknown.  
* Refund Approval.  
* Disputes.  
* Alertas.  
* Payment confirmation sin activación automática.  
   
⸻  
   
## 779. Checklist de integraciones  
* Provider Registry.  
* Credenciales seguras.  
* Webhooks.  
* Timeouts.  
* Retries.  
* Circuit breakers.  
* Rate limits.  
* Reconciliation.  
* Kill switches.  
* Runbooks.  
* Vendor review.  
   
⸻  
   
## 780. Checklist de IA  
* AI Gateway único.  
* Model Router único.  
* Model Registry.  
* Agent versions.  
* Skill versions.  
* Tool allowlists.  
* Global denylist.  
* Local-only.  
* Cloud policies.  
* Cost limits.  
* GPU optional.  
* Node identity.  
* Queue.  
* Idempotencia.  
* Human review.  
* Kill switches.  
   
⸻  
   
## 781. Checklist de Disaster Recovery  
* Estrategia 3-2-1.  
* Copia externa.  
* Copia inmutable.  
* PITR.  
* Object storage backup.  
* Secret recovery.  
* Infrastructure as Code.  
* Restore test.  
* Safe Restore Mode.  
* Runbooks.  
* RPO medido.  
* RTO medido.  
   
⸻  
   
## 782. Checklist de observabilidad  
* Logs estructurados.  
* Métricas.  
* Traces.  
* Correlation IDs.  
* Dashboards.  
* Alertas.  
* SLOs.  
* Uptime checks.  
* Synthetic tests.  
* Incident workflow.  
* Cost dashboard.  
* Capacity dashboard.  
   
⸻  
   
## 783. Go-Live Approval  
El lanzamiento deberá requerir aprobación formal del owner.  
La aprobación deberá confirmar:  
* riesgos aceptados;  
* controles activos;  
* limitaciones conocidas;  
* rollback;  
* responsables;  
* soporte;  
* monitoreo;  
* comunicación.  
   
⸻  
   
## 784. Go-Live Record  
```
id
releaseVersion
environment
approvedBy
approvedAt
knownRisks
acceptedExceptions
rollbackVersion
monitoringPlan
supportPlan
status
createdAt

```
   
⸻  
   
## 785. Hypercare  
Después del lanzamiento deberá existir un periodo de supervisión reforzada.  
Durante Hypercare:  
* mayor monitoreo;  
* revisión frecuente;  
* soporte priorizado;  
* freeze parcial;  
* rollback preparado;  
* cambios limitados;  
* revisión diaria.  
   
⸻  
   
## 786. Exit Criteria de Hypercare  
Finalizar cuando:  
* estabilidad suficiente;  
* errores críticos resueltos;  
* pagos reconciliados;  
* colas normales;  
* integraciones estables;  
* performance dentro de objetivos;  
* soporte controlado;  
* backups verificados.  
   
⸻  
   
## 787. Roadmap de infraestructura  
## Fase 1 — Desarrollo controlado  
* Docker Compose.  
* Development local.  
* PostgreSQL.  
* Redis.  
* object storage.  
* CI básico.  
* pruebas.  
* logs.  
* secrets locales protegidos.  
## Fase 2 — MVP en producción  
* servidor principal;  
* HTTPS;  
* backups;  
* monitoring;  
* staging;  
* pipelines;  
* Stripe;  
* comunicaciones;  
* AI server básico;  
* nodo GPU opcional.  
## Fase 3 — Estabilización  
* dashboards;  
* SLOs;  
* alertas;  
* PITR;  
* restore tests;  
* provider resilience;  
* cost control;  
* feature flags;  
* incident management.  
## Fase 4 — Escalado  
* servicios separados;  
* database hosting dedicado;  
* múltiples workers;  
* load balancer;  
* CDN;  
* read replicas cuando se justifiquen;  
* orquestación avanzada.  
## Fase 5 — Plataforma nacional  
* alta disponibilidad;  
* múltiples regiones cuando sea necesario;  
* enterprise security;  
* vendor redundancy;  
* autoscaling;  
* advanced compliance;  
* status page;  
* formal on-call.  
## Fase 6 — Multiempresa  
* tenant infrastructure policies;  
* custom domains;  
* tenant quotas;  
* tenant billing;  
* tenant-level feature flags;  
* enterprise integrations;  
* isolated workloads cuando se requieran.  
   
⸻  
   
## 788. Criterios finales de aceptación del Módulo 26  
El Módulo 26 estará completo cuando:  
1. La infraestructura esté documentada.  
2. Existan ambientes separados.  
3. Docker sea reproducible.  
4. Producción no dependa de configuraciones manuales.  
5. Exista CI/CD.  
6. Existan quality gates.  
7. Exista rollback.  
8. Exista seguridad Zero Trust.  
9. Exista Secret Manager.  
10. Exista cifrado.  
11. Existan redes segmentadas.  
12. Exista observabilidad.  
13. Existan logs estructurados.  
14. Existan métricas.  
15. Existan traces.  
16. Existan dashboards.  
17. Existan alertas.  
18. Existan backups.  
19. Exista PITR.  
20. Existan restore tests.  
21. Exista Disaster Recovery.  
22. La GPU sea opcional.  
23. Exista model routing.  
24. Exista control de costos de IA.  
25. Las integraciones estén desacopladas.  
26. Los webhooks sean idempotentes.  
27. Exista reconciliación.  
28. Existan circuit breakers.  
29. Exista cache policy.  
30. Exista optimización de PostgreSQL.  
31. Existan pruebas de carga.  
32. Exista capacity planning.  
33. Exista scheduler controlado.  
34. Existan feature flags.  
35. Existan kill switches.  
36. Exista change management.  
37. Exista incident management.  
38. Existan runbooks.  
39. Existan revisiones de acceso.  
40. Exista gestión de costos.  
41. Exista Production Readiness Review.  
42. Existan checklists.  
43. Exista Go-Live Approval.  
44. Exista Hypercare.  
45. Exista roadmap de crecimiento.  
46. No existan dependencias críticas de una computadora personal.  
47. No exista activación automática de servicios por pago.  
48. La IA no pueda ejecutar acciones sensibles libremente.  
49. Los proveedores puedan desactivarse sin tumbar toda la plataforma.  
50. SG Solutions pueda recuperarse desde infraestructura limpia.  
   
⸻  
   
## 789. Instrucciones maestras para Codex  
Antes de implementar cualquier parte del Módulo 26:  
1. Lee los módulos 1 al 25.  
2. Lee las diez partes del Módulo 26.  
3. Inspecciona el código existente.  
4. Inspecciona la infraestructura existente.  
5. No crees sistemas duplicados.  
6. No crees una nueva app independiente.  
7. Reutiliza Authentication.  
8. Reutiliza Authorization.  
9. Reutiliza Audit.  
10. Reutiliza Workflows.  
11. Reutiliza Tasks.  
12. Reutiliza Approvals.  
13. Reutiliza Billing.  
14. Reutiliza Documents.  
15. Reutiliza Messaging.  
16. Reutiliza AI Hub.  
17. Reutiliza Marketplace.  
18. Reutiliza CRM.  
19. Mantén una única fuente de verdad.  
20. Mantén PostgreSQL como base relacional principal.  
21. Mantén object storage para documentos.  
22. Mantén Redis como estado temporal.  
23. Mantén todos los servicios contenedorizados.  
24. Mantén secretos fuera de Git.  
25. Mantén ambientes aislados.  
26. Mantén producción protegida.  
27. Mantén deployments auditados.  
28. Mantén rollback.  
29. Mantén backups.  
30. Prueba restauraciones.  
31. Implementa observabilidad antes de declarar producción lista.  
32. Implementa alertas accionables.  
33. Implementa métricas de negocio y técnicas.  
34. Implementa runbooks.  
35. Implementa scheduler central.  
36. Implementa locks distribuidos.  
37. Implementa misfire policies.  
38. No ejecutes acciones sensibles mediante cron sin Approval.  
39. No actives servicios automáticamente al confirmar pagos.  
40. Implementa feature flags.  
41. Implementa kill switches.  
42. Implementa owner override limitado.  
43. Implementa break-glass.  
44. Requiere MFA.  
45. Requiere reautenticación.  
46. Implementa revisiones de acceso.  
47. Implementa offboarding.  
48. Mantén inventario.  
49. Evita shadow infrastructure.  
50. Implementa gestión de costos.  
51. Implementa presupuestos.  
52. Implementa anomalías.  
53. Implementa incident records.  
54. Implementa severidades.  
55. Implementa timelines.  
56. Implementa postmortems.  
57. Implementa corrective actions.  
58. Implementa Problem Management.  
59. Implementa biblioteca de runbooks.  
60. Versiona runbooks.  
61. Implementa dry run.  
62. Protege operaciones masivas.  
63. Permite a la IA preparar acciones.  
64. No permitas que la IA se autoapruebe.  
65. No permitas acceso SQL directo a modelos.  
66. No permitas que modelos vean secretos.  
67. No permitas que el nodo GPU acceda a toda la red.  
68. Mantén el nodo GPU opcional.  
69. Implementa cloud AI policies.  
70. Implementa local-only.  
71. Implementa data minimization.  
72. Implementa provider adapters.  
73. Implementa webhooks seguros.  
74. Implementa idempotencia.  
75. Implementa reconciliation.  
76. Implementa circuit breakers.  
77. Implementa performance budgets.  
78. Implementa pruebas de carga.  
79. Implementa modo degradado.  
80. Implementa load shedding.  
81. Implementa Production Readiness Review.  
82. Implementa checklists.  
83. Implementa Go-Live Approval.  
84. Implementa Hypercare.  
85. Documenta excepciones.  
86. Documenta deuda técnica.  
87. Documenta riesgos.  
88. Documenta decisiones.  
89. No ocultes fallos.  
90. No marques una función como completa sin pruebas.  
91. No utilices datos reales en pruebas de carga.  
92. No utilices credenciales de producción en desarrollo.  
93. No realices cambios manuales sin registro.  
94. No elimines controles para acelerar desarrollo.  
95. No crees complejidad empresarial sin necesidad actual.  
96. Mantén preparación para escalar.  
97. Prioriza seguridad y mantenibilidad.  
98. Diseña para miles de clientes.  
99. Mantén SG Solutions operativa durante degradaciones.  
100. Entrega cada implementación con pruebas, documentación, observabilidad y rollback.  
   
⸻  
   
## 790. Cierre del Módulo 26  
Con esta Parte 10 queda finalizado:  
## MÓDULO 26 — DEVSECOPS, INFRAESTRUCTURA, DESPLIEGUE Y OPERACIONES  
El módulo define cómo SG Solutions deberá:  
* ejecutarse;  
* desplegarse;  
* protegerse;  
* observarse;  
* respaldarse;  
* recuperarse;  
* conectarse con terceros;  
* operar inteligencia artificial;  
* escalar;  
* controlar costos;  
* manejar incidentes;  
* mantenerse en producción.  
La plataforma deberá poder continuar funcionando aunque:  
* falle una integración;  
* el nodo GPU esté apagado;  
* un deployment falle;  
* Redis esté temporalmente fuera de servicio;  
* exista un backlog;  
* un proveedor esté degradado;  
* se necesite restaurar información;  
* una capacidad avanzada de IA no esté disponible.  
La arquitectura final deberá conservar un principio fundamental:  
SG Solutions puede utilizar automatización e inteligencia artificial para acelerar la operación, pero las decisiones sensibles, legales, financieras, tributarias o de alto impacto permanecerán bajo controles deterministas, permisos explícitos y aprobación humana.  
Este módulo no deberá interpretarse como obligación de construir toda la infraestructura avanzada durante el MVP.  
Deberá utilizarse como:  
* arquitectura objetivo;  
* guía de implementación;  
* marco de seguridad;  
* criterio de aceptación;  
* roadmap técnico;  
* referencia operativa para el crecimiento futuro.  
  
  
  
