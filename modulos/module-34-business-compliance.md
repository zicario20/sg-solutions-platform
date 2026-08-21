# SG Solutions Platform — Módulo 34: Business Compliance

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 34. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus cuatro partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, Compliance Profile, Requirement Registry, calendarios, deadlines, annual/biennial reports y monitoreo | 3946–4010 | **COMPLETE** |
| 2 | Licencias, permisos, registered agent, cambios corporativos, foreign qualification y filings de mantenimiento | 4011–4075 | **COMPLETE** |
| 3 | Notices, renewals, ownership-reporting condicional, remediation, escalations, client portal y cross-module handoffs | 4076–4140 | **COMPLETE** |
| 4 | Partners, automation, AI, security, admin, analytics, migration, continuity, E2E y cierre | 4141–4205 | **COMPLETE** |

**Estado global del Módulo 34:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Compliance Profile, Requirement Registry, Calendarios, Deadlines, Annual/Biennial Reports y Monitoreo

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 33 — EIN y Documentos Empresariales  
**Secciones incluidas:** 3946–4010  
**Audiencia:** Owner, Codex, compliance specialists, formation specialists, tax preparers, administrators, reviewers, operations, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Compliance basado en obligaciones versionadas por jurisdicción, calendario trazable, evidencia de cumplimiento, revisión humana y actualización continua de requisitos cambiantes

---

## 3946. Objetivo del Módulo 34

El Módulo 34 administrará las obligaciones recurrentes y de mantenimiento empresarial posteriores a la formación.

Deberá cubrir:

- entity compliance profile;
- jurisdiction obligations;
- annual/biennial reports;
- registered-agent continuity;
- licenses and permits;
- renewals;
- amendments;
- state changes;
- foreign qualification;
- notices;
- ownership-reporting obligations cuando legalmente correspondan;
- deadlines;
- reminders;
- evidence;
- remediation;
- partner coordination;
- compliance analytics.

---

## 3947. Principio central

```text
Verified entity profile
→ current requirements
→ applicable obligations
→ deadlines
→ tasks
→ evidence
→ verification
→ completion
→ next recurrence
```

Nunca:

```text
company formed
→ assume compliant forever
```

---

## 3948. Compliance Is Dynamic

Las obligaciones pueden cambiar por:

- jurisdiction;
- entity type;
- formation date;
- business activity;
- physical location;
- employee status;
- licenses;
- ownership changes;
- registered-agent changes;
- tax elections;
- regulatory changes.

El módulo deberá evitar reglas permanentes hardcoded sin versioning.

---

## 3949. Reutilización obligatoria

Deberán reutilizarse:

- Organizations;
- Persons;
- Documents;
- Tasks;
- Approvals;
- Notifications;
- Calendar/Deadline primitives;
- Workflow Engine;
- Provider Registry;
- Partner Registry;
- Audit;
- Analytics;
- AI Hub;
- Módulo 32 Business Formation;
- Módulo 33 EIN;
- Módulo 30 Tax;
- Módulo 31 Bookkeeping.

---

## 3950. Compliance Service Catalog

Tipos iniciales:

```text
annual_compliance_monitoring
annual_report_filing
biennial_report_filing
registered_agent_renewal_coordination
business_license_monitoring
business_license_renewal
state_amendment_support
foreign_qualification_support
entity_information_update
compliance_cleanup
notice_response_support
custom_compliance_service
```

---

## 3951. Delivery Model

Cada servicio deberá declarar:

```text
sg_service
sg_managed_with_partner
marketplace_referral
client_self_service_assisted
education_only
future_or_conditional
```

La UI deberá explicar quién realiza el filing o acción.

---

## 3952. Compliance Engagement

Campos:

```text
id
clientId
organizationId
serviceOrderId
serviceType
deliveryModel
monitoringFrequency
assignedSpecialistId
assignedReviewerId
status
openedAt
renewalAt
closedAt
createdAt
updatedAt
```

---

## 3953. Compliance Case

Un engagement podrá generar uno o varios Compliance Cases.

Campos:

```text
id
caseNumber
organizationId
engagementId
requirementId
obligationId
jurisdictionCode
status
priority
dueDate
assignedTo
reviewerId
createdAt
completedAt
```

---

## 3954. Compliance Case Status

```text
draft
monitoring
upcoming
action_required
client_action_required
preparing
review_pending
ready_to_file
submitted
processing
completed
overdue
blocked
cancelled
archived
```

---

## 3955. Organization Compliance Profile

Cada Organization deberá tener un perfil consolidado.

Campos:

```text
organizationId
entityType
formationJurisdiction
formationDate
effectiveDate
stateEntityIdentifier
registeredAgentReference
principalAddress
businessLocations
businessActivities
employeeStates
taxJurisdictions
foreignQualifications
licenses
ownershipReportingProfile
status
version
```

---

## 3956. Compliance Profile Sources

Datos podrán provenir de:

```text
business_formation
ein_module
tax_module
bookkeeping
client_confirmation
official_filing
license_record
partner_record
staff_verification
```

Cada dato deberá conservar source y verification status.

---

## 3957. Compliance Profile Versioning

Cambios materiales deberán crear nueva versión.

Ejemplos:

- address change;
- ownership change;
- manager/officer change;
- registered-agent change;
- new business location;
- new state activity;
- employee expansion;
- new license.

---

## 3958. Compliance Snapshot

Cada evaluación deberá usar un snapshot:

```text
id
organizationId
profileVersion
evaluatedAt
requirementSetVersion
jurisdictions
activityCodes
sourceReferences
createdAt
```

Esto permitirá reconstruir por qué una obligación fue considerada aplicable.

---

## 3959. Requirement Registry

Será el repositorio central de obligaciones.

Campos:

```text
id
requirementCode
requirementType
jurisdictionScope
entityTypes
businessActivities
triggerRules
recurrenceRule
deadlineRule
filingAuthority
filingMethod
feeReference
sourceReferences
effectiveFrom
effectiveTo
status
version
```

---

## 3960. Requirement Types

```text
annual_report
biennial_report
periodic_report
franchise_related_filing
registered_agent_requirement
license
permit
renewal
ownership_reporting
foreign_qualification
entity_amendment
address_update
officer_manager_update
tax_registration_related
employer_registration_related
other
```

---

## 3961. Requirement Status

```text
draft
under_review
active
superseded
temporarily_suspended
retired
unknown
```

Solo requirements activos y vigentes deberán alimentar deadlines automáticos.

---

## 3962. Requirement Source

Cada requirement deberá tener fuentes verificables.

Campos:

```text
sourceType
sourceAuthority
sourceUrlOrReference
retrievedAt
verifiedAt
verifiedBy
effectiveDate
notes
```

Preferencia:

```text
official government source
→ official regulatory source
→ approved provider source
→ professional guidance
→ secondary source
```

---

## 3963. Requirement Freshness

Estados:

```text
current_verified
current_with_caveat
verification_due
stale
unknown
```

Una obligación stale no deberá presentarse como certeza sin revisión.

---

## 3964. Requirement Verification Cadence

Podrá variar según:

- jurisdiction volatility;
- requirement type;
- known regulatory change;
- filing season;
- provider dependency.

Ejemplo conceptual:

```text
high_change_requirement → frequent verification
stable_requirement → periodic verification
```

---

## 3965. Requirement Version

Toda modificación deberá conservar:

```text
previousVersionId
newVersionId
changeType
changedFields
effectiveDate
verificationSource
reviewedBy
```

---

## 3966. Requirement Change Types

```text
fee_change
deadline_change
form_change
filing_method_change
eligibility_change
entity_scope_change
jurisdiction_change
new_requirement
requirement_suspended
requirement_removed
clarification
```

---

## 3967. Effective-Date Logic

El engine deberá considerar:

```text
requirementEffectiveDate
organizationFormationDate
obligationPeriod
filingDate
transitionRule
```

No deberá aplicar automáticamente una regla nueva a periodos anteriores.

---

## 3968. Applicability Engine

Entrada:

```text
Compliance Snapshot
+
Requirement Version
```

Salida:

```text
applicable
possibly_applicable
not_applicable
insufficient_information
professional_review_required
```

---

## 3969. Applicability Record

Campos:

```text
id
organizationId
requirementVersionId
complianceSnapshotId
applicabilityStatus
reasoningSummary
sourceReferences
confidence
reviewStatus
evaluatedAt
```

---

## 3970. No Unsupported Legal Conclusion

Si la regla requiere interpretación jurídica no soportada:

```text
professional_review_required
```

La IA no deberá convertir incertidumbre en una conclusión definitiva.

---

## 3971. Compliance Obligation

Cuando un requirement resulte aplicable deberá crearse una obligación.

Campos:

```text
id
organizationId
requirementVersionId
requirementType
jurisdictionCode
periodStart
periodEnd
dueDate
graceDate
status
responsibleParty
serviceScope
createdAt
completedAt
```

---

## 3972. Obligation Status

```text
scheduled
upcoming
action_required
client_action_required
preparing
review_pending
ready_to_file
submitted
processing
completed
overdue
waived
not_applicable
superseded
```

---

## 3973. Obligation Uniqueness

Una obligación recurrente deberá ser única por:

```text
organizationId
requirementVersionFamily
obligationPeriod
jurisdiction
```

Retries no deberán crear duplicados.

---

## 3974. Deadline Engine

El Deadline Engine deberá calcular fechas mediante reglas versionadas.

Inputs posibles:

```text
formationAnniversary
fixedCalendarDate
fiscalYearEnd
taxYearEnd
licenseIssueDate
registrationDate
eventDate
customRule
```

---

## 3975. Deadline Rule Types

```text
fixed_date
anniversary
month_end
days_after_event
months_after_event
periodic_interval
state_specific_formula
manual_verified
```

---

## 3976. Deadline Calculation Record

Campos:

```text
id
obligationId
ruleVersionId
inputDates
calculatedDueDate
timezone
calculationTrace
verifiedAt
status
```

El cálculo deberá ser reproducible.

---

## 3977. Due Date Confidence

```text
verified
high
review_required
unknown
```

Una fecha `unknown` deberá generar tarea de investigación, no un deadline ficticio.

---

## 3978. Holiday / Weekend Adjustment

Cuando la autoridad aplique reglas de ajuste por:

- weekend;
- federal holiday;
- state holiday;

deberán estar definidas por requirement/rule y no asumirse universalmente.

---

## 3979. Compliance Calendar

Cada Organization deberá tener calendario consolidado con:

- obligations;
- due dates;
- renewal windows;
- client actions;
- internal review dates;
- filing dates;
- expected confirmation dates.

---

## 3980. Calendar Event

Campos:

```text
id
organizationId
obligationId
eventType
title
startAt
dueAt
timezone
priority
status
source
createdAt
updatedAt
```

---

## 3981. Calendar Event Types

```text
filing_due
renewal_due
review_due
client_action_due
payment_due
document_due
verification_due
followup_due
monitoring_checkpoint
```

---

## 3982. Reminder Policy

Deberá ser configurable.

Ejemplo:

```text
90_days_before
60_days_before
30_days_before
14_days_before
7_days_before
1_day_before
due_date
overdue
```

No todos los requirements necesitan la misma secuencia.

---

## 3983. Reminder Channels

```text
in_app
email
sms_when_consented
staff_task
dashboard_alert
partner_notification
```

Sensitive details deberán evitarse en canales inseguros.

---

## 3984. Reminder Deduplication

Cada reminder deberá usar key:

```text
obligationId
reminderPolicyId
scheduledOffset
channel
recipient
```

Retries no deberán enviar mensajes duplicados.

---

## 3985. Client Responsibility

Cada obligation deberá indicar:

```text
sg_responsible
client_responsible
partner_responsible
shared
monitoring_only
```

La UI deberá ser explícita.

---

## 3986. Service Scope Status

```text
included
optional_add_on
not_included
partner_service
client_self_file
monitor_only
```

Una obligación legal no implica que el filing esté incluido en el plan comprado.

---

## 3987. Annual Report Requirement

El sistema deberá soportar reportes denominados, según jurisdicción:

```text
annual_report
annual_statement
periodic_report
statement_of_information
other_equivalent
```

El nombre oficial deberá conservarse.

---

## 3988. Biennial Report Requirement

Deberá soportarse recurrencia cada dos años cuando corresponda.

El engine deberá conservar:

```text
filingCycle
baseYear
dueDateRule
nextDueDate
```

---

## 3989. Periodic Report Metadata

Campos:

```text
requirementId
officialName
frequency
filingAuthority
filingMethod
currentFormReference
governmentFee
expeditedOptions
sourceReferences
```

---

## 3990. Annual/Biennial Report Intake

Datos potenciales:

```text
legalName
stateEntityIdentifier
principalAddress
mailingAddress
registeredAgent
membersManagers
directorsOfficers
businessPurpose
contactInformation
otherStateRequiredFields
```

La lista exacta deberá provenir del Requirement Registry vigente.

---

## 3991. Prefill Strategy

La plataforma deberá prellenar desde master data verificada.

Cada field deberá mostrar:

```text
currentValue
source
lastVerifiedAt
clientConfirmationRequired
```

---

## 3992. Change Detection During Report Prep

Si el cliente cambia un dato durante un periodic report:

```text
current master data
≠
client provided value
```

deberá evaluarse si:

- el report puede efectuar el cambio;
- se necesita amendment separado;
- se requiere client confirmation;
- se requiere professional review.

---

## 3993. Report Preparation Record

Campos:

```text
id
obligationId
requirementVersionId
reportDataVersion
formVersion
preparedBy
reviewedBy
status
createdAt
updatedAt
```

---

## 3994. Report Preparation Status

```text
draft
client_input_required
internal_review
correction_required
ready_to_file
submitted
accepted
rejected
superseded
```

---

## 3995. Periodic Report Review

Antes de `ready_to_file` deberá verificarse:

- legal name;
- state identifier;
- registered agent;
- addresses;
- management/officers;
- form version;
- fee;
- deadline;
- authorization;
- material changes;
- no blockers.

---

## 3996. Annual Report Authorization

La autorización deberá vincularse a:

```text
obligationId
reportDataVersion
reportHash
governmentFeeReference
deliveryModel
authorizedBy
authorizedAt
```

Cambios materiales deberán invalidarla cuando corresponda.

---

## 3997. Filing Package

Contenido:

```text
organizationSnapshot
requirementVersion
obligation
reportDataVersion
formVersion
supportingDocuments
reviewRecord
authorization
governmentFeeQuote
packageHash
```

El package deberá ser inmutable.

---

## 3998. Ready-to-File Gate

Condiciones:

```text
requirement_current
due_date_verified
required_fields_complete
client_confirmations_complete
review_approved
authorization_valid
fee_current
no_blocking_findings
```

Resultado:

```text
ready
warning
blocked
```

---

## 3999. Filing Responsibility Boundary

Parte 1 deberá preparar el workflow hasta `ready_to_file`.

La ejecución detallada de filings, renewals, amendments y partner submissions se amplía en Parte 2.

---

## 4000. Compliance Monitoring Run

El sistema deberá ejecutar evaluaciones periódicas.

Campos:

```text
id
organizationId
complianceSnapshotId
requirementSetVersion
startedAt
completedAt
requirementsEvaluated
newObligationsCreated
changesDetected
findingsCreated
status
```

---

## 4001. Monitoring Run Status

```text
queued
running
completed
completed_with_warnings
failed
cancelled
```

---

## 4002. New Obligation Detection

Cuando un monitoring run detecte una nueva obligación:

```text
requirement becomes applicable
→ create obligation
→ calculate deadline
→ create calendar events
→ assign responsibility
→ notify
```

---

## 4003. Removed / Suspended Requirement

Si un requirement deja de aplicar:

- no borrar history;
- marcar future obligations;
- revisar open cases;
- conservar reason/source;
- no cancelar filing submitted.

---

## 4004. Compliance Finding

Tipos iniciales:

```text
stale_requirement
unknown_due_date
missing_entity_data
registered_agent_mismatch
address_mismatch
management_mismatch
license_unknown
overdue_obligation
unverified_completion
source_conflict
```

---

## 4005. Compliance Finding Record

Campos:

```text
id
organizationId
obligationId
findingType
severity
description
sourceReferences
blocking
status
assignedTo
createdAt
resolvedAt
```

---

## 4006. Finding Severity

```text
informational
low
medium
high
critical
```

Severidad no deberá equivaler automáticamente a una conclusión legal.

---

## 4007. Evidence of Compliance

Una obligación no deberá marcarse completa sin evidencia apropiada.

Tipos:

```text
official_receipt
accepted_filing
certificate
license
renewal_confirmation
provider_verified_confirmation
manual_verified_official_record
other
```

---

## 4008. Completion Record

Campos:

```text
id
obligationId
completedAt
completionType
evidenceDocumentIds
externalReference
verifiedBy
verificationStatus
nextRecurrenceCreated
createdAt
```

---

## 4009. Permissions, APIs, Events and Workflows

### Permisos

```text
compliance.profile.read
compliance.profile.manage

compliance.requirement.read
compliance.requirement.manage
compliance.requirement.verify

compliance.obligation.read
compliance.obligation.manage

compliance.calendar.read
compliance.calendar.manage

compliance.report.prepare
compliance.report.review
compliance.report.ready_to_file

compliance.monitoring.run
compliance.finding.read
compliance.finding.resolve
```

### APIs

```text
GET  /api/compliance/organizations/{id}/profile
POST /api/compliance/organizations/{id}/snapshots

GET  /api/compliance/requirements
POST /api/compliance/requirements
POST /api/compliance/requirements/{id}/versions

GET  /api/compliance/organizations/{id}/obligations
POST /api/compliance/organizations/{id}/evaluate
GET  /api/compliance/organizations/{id}/calendar

POST /api/compliance/obligations/{id}/report-preparation
POST /api/compliance/report-preparations/{id}/review
POST /api/compliance/report-preparations/{id}/ready-to-file

POST /api/compliance/monitoring-runs
```

### Eventos

```text
ComplianceProfileCreated
ComplianceProfileChanged
ComplianceSnapshotCreated
ComplianceRequirementPublished
ComplianceRequirementChanged
ComplianceApplicabilityEvaluated
ComplianceObligationCreated
ComplianceDeadlineCalculated
ComplianceReminderScheduled
ComplianceReportPrepared
ComplianceReportReadyToFile
ComplianceMonitoringCompleted
ComplianceFindingCreated
ComplianceObligationCompleted
```

### Workflows

```text
Compliance Profile Workflow
Requirement Verification Workflow
Applicability Evaluation Workflow
Compliance Obligation Workflow
Deadline Calculation Workflow
Compliance Calendar Workflow
Annual Report Preparation Workflow
Compliance Monitoring Workflow
Compliance Finding Workflow
```

---

## 4010. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Compliance Profile desde Organization.
2. Importar Formation data.
3. Importar EIN status.
4. Versionar Compliance Profile.
5. Crear Compliance Snapshot.
6. Crear Requirement.
7. Versionar Requirement.
8. Marcar Requirement stale.
9. Verificar Requirement.
10. Registrar source oficial.
11. Crear change type.
12. Aplicar effective date.
13. Ejecutar Applicability Engine.
14. Crear applicable result.
15. Crear possibly-applicable result.
16. Crear professional-review result.
17. Crear Compliance Obligation.
18. Evitar obligation duplicada.
19. Calcular fixed deadline.
20. Calcular anniversary deadline.
21. Calcular event-relative deadline.
22. Crear unknown due-date finding.
23. Aplicar weekend/holiday rule configurada.
24. Crear Compliance Calendar.
25. Crear filing-due event.
26. Crear reminder policy.
27. Evitar reminder duplicado.
28. Separar client/SG/partner responsibility.
29. Separar included/not-included.
30. Crear annual report obligation.
31. Crear biennial report obligation.
32. Crear Periodic Report metadata.
33. Prefill desde master data.
34. Detectar master-data mismatch.
35. Crear Report Preparation.
36. Ejecutar report review.
37. Crear authorization.
38. Invalidar authorization tras material change.
39. Crear immutable Filing Package.
40. Bloquear Ready-to-File por stale requirement.
41. Bloquear Ready-to-File por unknown deadline.
42. Aprobar Ready-to-File.
43. Ejecutar Monitoring Run.
44. Detectar nueva obligation.
45. Crear calendar/reminders desde monitoring.
46. Procesar removed requirement.
47. Crear Compliance Finding.
48. Clasificar severity.
49. Adjuntar Evidence of Compliance.
50. Completar obligation con evidence.
51. Crear next recurrence.
52. Probar permissions.
53. Probar APIs.
54. Probar events/outbox.
55. Probar workflows.
56. Probar audit de requirement change.
57. Probar audit de due-date calculation.
58. Probar audit de report preparation.
59. Probar source lineage.
60. Probar tenant isolation.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Compliance Service Catalog.
2. Exista Delivery Model.
3. Exista Compliance Engagement.
4. Exista Compliance Case.
5. Exista Organization Compliance Profile.
6. Exista profile versioning.
7. Exista Compliance Snapshot.
8. Exista Requirement Registry.
9. Existan Requirement Types.
10. Exista Requirement Status.
11. Existan source references.
12. Exista Requirement Freshness.
13. Exista verification cadence.
14. Exista Requirement Versioning.
15. Existan change types.
16. Exista effective-date logic.
17. Exista Applicability Engine.
18. Exista Applicability Record.
19. Exista professional-review state.
20. Exista Compliance Obligation.
21. Exista obligation uniqueness.
22. Exista Deadline Engine.
23. Existan deadline-rule types.
24. Exista calculation trace.
25. Exista due-date confidence.
26. Holiday/weekend adjustment sea configurable.
27. Exista Compliance Calendar.
28. Existan calendar-event types.
29. Exista Reminder Policy.
30. Exista reminder deduplication.
31. Exista responsibility ownership.
32. Exista Service Scope Status.
33. Exista annual-report support.
34. Exista biennial-report support.
35. Exista Periodic Report metadata.
36. Exista Report Intake.
37. Exista prefill strategy.
38. Exista change detection.
39. Exista Report Preparation.
40. Exista report review.
41. Exista authorization.
42. Exista immutable Filing Package.
43. Exista Ready-to-File Gate.
44. Exista Compliance Monitoring Run.
45. Exista new-obligation detection.
46. Removed requirements conserven history.
47. Existan Compliance Findings.
48. Exista Evidence of Compliance.
49. Exista Completion Record.
50. Existan permisos/APIs/events/workflows.
51. Toda obligación tenga requirement source.
52. Toda fecha tenga cálculo o verificación.
53. Toda completion tenga evidence.
54. No se hardcodeen obligaciones cambiantes.
55. Parte 1 termine lista para filing/renewal execution en Parte 2.

### Instrucciones para Codex

1. Lee Módulos 32 y 33 antes de implementar handoffs.
2. Reutiliza Organization.
3. Reutiliza Documents.
4. Reutiliza Tasks.
5. Reutiliza Approvals.
6. Reutiliza Notifications.
7. Reutiliza Workflow Engine.
8. Reutiliza Audit.
9. Implementa Compliance Profile.
10. Implementa profile versioning.
11. Implementa Compliance Snapshot.
12. Implementa Requirement Registry.
13. No hardcodees requisitos estatales cambiantes.
14. Implementa sources y freshness.
15. Implementa Requirement Versioning.
16. Implementa effective dates.
17. Implementa Applicability Engine.
18. Permite `professional_review_required`.
19. Implementa Obligation uniqueness.
20. Implementa Deadline Engine reproducible.
21. Implementa holiday/weekend policy por requirement.
22. Implementa Calendar.
23. Implementa Reminder Policy.
24. Implementa reminder idempotency.
25. Separa legal obligation de purchased-service scope.
26. Implementa annual/biennial report model.
27. Implementa dynamic field requirements.
28. Prefill solo desde verified master data.
29. Detecta material changes.
30. Implementa report preparation/review.
31. Implementa authorization hash/version.
32. Implementa immutable Filing Package.
33. Implementa Ready-to-File Gate.
34. Implementa Monitoring Runs.
35. Implementa new-obligation detection.
36. Conserva history cuando requirement cambia.
37. Implementa Findings.
38. Exige evidence para completion.
39. Implementa next recurrence.
40. Implementa permissions/APIs/events/workflows.
41. Implementa immutable audit.
42. No marques Parte 1 completa si una due date puede existir sin source o calculation trace.

### Verificación final de Parte 1

- ¿Cada obligation proviene de un Requirement versionado?
- ¿Cada Requirement tiene source y freshness?
- ¿El engine respeta effective dates?
- ¿La aplicabilidad puede quedar incierta sin inventar respuesta?
- ¿Las obligaciones recurrentes no se duplican?
- ¿Las fechas son reproducibles?
- ¿Los reminders son idempotentes?
- ¿La UI diferencia obligación legal de servicio comprado?
- ¿Annual/Biennial Report usa datos verificados?
- ¿Cambios materiales invalidan review/authorization cuando corresponde?
- ¿Ready-to-File bloquea stale requirements?
- ¿Completion requiere evidencia?
- ¿Toda acción queda auditada?

---

# Parte 2 — Licencias, Permisos, Registered Agent, Cambios Corporativos, Foreign Qualification y Filings de Mantenimiento

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 34 — Parte 1  
**Secciones incluidas:** 4011–4075  
**Audiencia:** Owner, Codex, compliance specialists, formation specialists, reviewers, administrators, partners, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Maintenance compliance coordinado mediante requirements versionados, filings controlados, partners desacoplados, evidencias oficiales, revisión humana y handoffs trazables

## 4011. Objetivo de Parte 2

Esta parte define cómo la plataforma administra obligaciones de mantenimiento posteriores a la formación relacionadas con:

- business licenses;
- permits;
- registered agent;
- principal/business address;
- members/managers/officers/directors;
- amendments;
- assumed names/DBAs;
- foreign qualification;
- withdrawals;
- certificates;
- reinstatement-related support;
- other maintenance filings.

El objetivo es que cualquier cambio material pueda:

```text
detect
→ evaluate requirement
→ prepare filing
→ authorize
→ submit
→ track
→ verify
→ update master data
```

## 4012. Maintenance Compliance Principle

```text
Verified change
→ applicable requirement
→ maintenance case
→ filing package
→ submission
→ official evidence
→ master-data update
→ recurring compliance refresh
```

Nunca:

```text
client edits profile
→ official state record assumed changed
```

## 4013. Maintenance Case

Campos:

```text
id
organizationId
complianceCaseId
maintenanceType
jurisdictionCode
triggerEventId
requirementVersionId
status
assignedTo
reviewerId
createdAt
completedAt
```

## 4014. Maintenance Types

```text
registered_agent_change
registered_office_change
principal_address_change
mailing_address_change
member_change
manager_change
officer_change
director_change
legal_name_change
assumed_name_registration
assumed_name_renewal
business_purpose_change
articles_amendment
certificate_request
foreign_qualification
foreign_withdrawal
reinstatement_support
dissolution_handoff
other
```

## 4015. Trigger Event

Un Maintenance Case deberá originarse por un evento.

Fuentes:

```text
client_request
formation_update
compliance_monitoring
official_notice
partner_event
tax_module
bookkeeping_module
funding_requirement
staff_detection
```

## 4016. Change Request Record

Campos:

```text
id
organizationId
changeType
requestedBy
requestedValue
currentVerifiedValue
effectiveDateRequested
reason
supportingDocuments
status
createdAt
```

## 4017. Change Request Status

```text
draft
client_confirmation_required
under_review
filing_required
filing_not_required
professional_review_required
cancelled
completed
```

## 4018. Change Applicability Review

Antes de cambiar master data deberá evaluarse si el cambio requiere:

- state filing;
- local filing;
- tax update;
- registered-agent update;
- license update;
- bank/provider notification;
- internal-only update;
- professional review.

## 4019. No Premature Master Update

Un cambio que requiera filing oficial deberá manejar:

```text
requested value
```

separado de:

```text
official verified value
```

hasta recibir evidencia de aceptación.

## 4020. Registered Agent Requirement

El módulo deberá mantener:

```text
agentName
agentType
registeredOfficeAddress
jurisdiction
serviceProvider
effectiveFrom
effectiveTo
verificationStatus
renewalStatus
```

## 4021. Registered Agent Status

```text
active_verified
active_unverified
change_pending
renewal_pending
service_expiring
resigned
invalid
unknown
```

## 4022. Registered Agent Continuity Monitoring

La plataforma deberá detectar:

- provider service ending;
- missing renewal;
- agent resignation;
- invalid address;
- jurisdiction mismatch;
- pending change not completed.

## 4023. Registered Agent Renewal

Cuando sea partner service:

```text
service renewal
→ fee quote
→ client authorization
→ partner renewal
→ partner confirmation
→ compliance evidence
```

El renewal del partner deberá mantenerse separado del government filing cuando sean acciones diferentes.

## 4024. Registered Agent Change

Un cambio deberá registrar:

```text
oldAgent
newAgent
effectiveDate
stateFilingRequired
consentRequired
partnerReference
filingReference
verificationStatus
```

## 4025. Agent Consent

Cuando la jurisdicción exija consentimiento:

- document version;
- signer;
- authorization;
- signedAt;
- evidence;
- scope.

No se deberá fabricar consentimiento.

## 4026. Address Change Management

Tipos:

```text
principal_business_address
mailing_address
registered_office
officer_address
member_manager_address
license_location
tax_mailing_address
```

Cada tipo puede tener requisitos distintos.

## 4027. Address Change Propagation

El sistema deberá evaluar destinos:

```text
state_entity_record
registered_agent_record
IRS_or_tax_record
licenses
banking
bookkeeping
funding
insurance
internal_master_data
```

No deberá propagarse automáticamente a todos sin rules.

## 4028. Address Change Status

```text
requested
review_required
filing_required
submitted
officially_updated
internal_only_updated
partially_updated
blocked
```

## 4029. Management Change

Deberá soportar cambios de:

```text
member
manager
director
officer
authorized_person
```

y conservar effective dates.

## 4030. Management Change Validation

Validaciones:

- governance authority;
- source resolution/consent;
- effective date;
- ownership impact;
- filing requirement;
- tax impact;
- license impact;
- banking authority impact.

## 4031. Ownership Change Boundary

Cambios de ownership no deberán tratarse como simples profile edits.

Deberán activar:

```text
governance_review
tax_review
compliance_review
document_update
possible_state_filing
possible_banking_update
```

## 4032. Ownership Change Record

Campos:

```text
id
organizationId
changeType
priorOwnershipSnapshot
newOwnershipSnapshot
effectiveDate
sourceDocuments
approvalRecord
taxReviewStatus
complianceReviewStatus
status
```

## 4033. Legal Name Change

Un cambio de legal name deberá manejar:

```text
requestedName
nameSearchReference
stateFilingRequirement
amendmentPackage
approvalRecord
effectiveDate
downstreamUpdates
```

No se actualizará `Organization.legalName` hasta verificar aprobación.

## 4034. Name Change Downstream Impact

Después de aprobación podrá crear handoffs a:

- EIN/IRS support;
- tax;
- bookkeeping;
- bank;
- licenses;
- insurance;
- funding;
- contracts;
- marketplace.

## 4035. Articles Amendment

El sistema deberá soportar preparación de amendment cuando cambien datos incluidos en documentos constitutivos.

Campos:

```text
amendmentType
affectedProvision
oldValue
newValue
effectiveDate
governanceApproval
jurisdictionRequirement
filingPackageId
```

## 4036. Amendment Types

```text
legal_name
business_purpose
management
share_structure
registered_office
other_state_supported_change
```

No todas aplican a todos los entity types.

## 4037. Amendment Review

Antes de Ready-to-File:

- confirm authority;
- validate current official record;
- identify exact provision;
- verify form/version;
- verify fee;
- confirm client;
- review downstream effects.

## 4038. Amendment Filing Package

Contenido:

```text
organizationSnapshot
requirementVersion
currentOfficialEvidence
changeRequest
governanceApproval
formVersion
authorization
feeQuote
packageHash
```

## 4039. Assumed Name / DBA Registry

Campos:

```text
id
organizationId
tradeName
jurisdiction
registrationAuthority
registrationStatus
registrationDate
expirationDate
renewalRequirement
documentIds
status
```

## 4040. DBA Status

```text
research_pending
available_or_acceptable
filing_required
submitted
active
renewal_due
expired
cancelled
unknown
```

## 4041. DBA Requirement Evaluation

La plataforma deberá evaluar:

- state requirement;
- county requirement;
- city/local requirement;
- publication requirement cuando aplique;
- renewal period;
- name restrictions.

No deberá asumir que un DBA estatal cubre toda obligación local.

## 4042. DBA Renewal

Cuando sea recurrente:

```text
active DBA
→ renewal obligation
→ deadline
→ reminder
→ preparation
→ filing
→ evidence
→ next recurrence
```

## 4043. Business License Record

Campos:

```text
id
organizationId
licenseType
jurisdiction
issuingAuthority
licenseNumberToken
issueDate
expirationDate
renewalRule
status
documentIds
```

## 4044. License Status

```text
screening
application_required
application_in_progress
active
renewal_due
expired
suspended
revoked
not_applicable
unknown
```

El sistema no deberá afirmar `revoked` salvo evidence.

## 4045. License Requirement Evaluation

Inputs:

```text
businessActivity
businessLocation
jurisdiction
employeeActivity
regulatedServiceFlags
existingLicenses
```

Output:

```text
likely_required
possibly_required
not_likely_required
professional_review_required
insufficient_information
```

## 4046. License Application Case

Campos:

```text
id
organizationId
licenseRequirementId
licenseType
jurisdiction
status
applicationVersion
assignedTo
reviewerId
createdAt
completedAt
```

## 4047. License Application Status

```text
draft
client_input_required
document_collection
review_pending
ready_to_submit
submitted
processing
approved
denied
additional_information_required
cancelled
```

## 4048. License Document Checklist

Puede incluir:

```text
formation_documents
ein_confirmation
ownership_information
professional_credentials
insurance_certificate
bond
location_document
tax_registration
background_requirement_reference
other
```

Los requisitos deberán ser dinámicos.

## 4049. Permit Support

Permits deberán seguir el mismo patrón:

```text
Requirement
→ Applicability
→ Case
→ Documents
→ Authorization
→ Submission
→ Evidence
→ Renewal
```

## 4050. License and Permit Renewal

Toda license/permit con expiration deberá generar:

```text
renewal obligation
renewal window
reminders
required documents
fee reference
completion evidence
next expiration
```

## 4051. License Fee Transparency

Separar:

```text
government_or_authority_fee
partner_fee
SG_service_fee
bond_or_insurance_cost
other_third_party_cost
```

## 4052. Foreign Qualification Concept

Cuando una entidad opera en una jurisdicción distinta de su formación, la plataforma podrá evaluar si existe necesidad de foreign qualification.

Resultado:

```text
not_evaluated
possibly_required
likely_required
not_likely_required
professional_review_required
```

No deberá asumir que cualquier actividad en otro estado requiere qualification.

## 4053. Foreign Qualification Inputs

```text
formationJurisdiction
targetJurisdiction
physicalPresence
employees
officeOrWarehouse
ongoingOperations
contracts
salesActivity
regulatedActivity
clientResponses
```

## 4054. Foreign Qualification Case

Campos:

```text
id
organizationId
homeJurisdiction
targetJurisdiction
requirementVersionId
qualificationStatus
certificateRequirement
registeredAgentRequirement
filingPackageId
status
createdAt
```

## 4055. Certificate of Good Standing Requirement

Cuando foreign qualification lo requiera deberá gestionarse:

```text
certificateType
issuingJurisdiction
issueDate
freshnessWindow
documentId
verificationStatus
```

No deberá reutilizarse un certificate stale si la target jurisdiction exige vigencia.

## 4056. Foreign Registered Agent

La qualification podrá requerir un registered agent en target jurisdiction.

Deberá poder:

- use client-provided agent;
- offer partner;
- track consent;
- track service renewal;
- keep jurisdiction-specific record.

## 4057. Foreign Qualification Filing Package

Contenido:

```text
homeEntityEvidence
goodStandingCertificate
targetJurisdictionRequirement
registeredAgent
applicationData
reviewRecord
authorization
fees
packageHash
```

## 4058. Foreign Qualification Approval

Tras aprobación deberá crear:

```text
foreignQualificationRecord
targetStateEntityIdentifier
effectiveDate
officialDocumentIds
newComplianceProfileVersion
newRecurringObligations
```

## 4059. Foreign Qualification Record

Campos:

```text
id
organizationId
homeJurisdiction
foreignJurisdiction
foreignEntityIdentifier
qualificationDate
status
registeredAgentReference
officialDocuments
createdAt
```

## 4060. Foreign Qualification Downstream Effects

Deberá evaluar:

- annual reports;
- franchise/state fees;
- licenses;
- registered agent renewal;
- tax registrations;
- employer registrations;
- bookkeeping segmentation;
- compliance calendar.

## 4061. Foreign Withdrawal

Cuando la entidad deje de operar en foreign jurisdiction podrá abrirse workflow de withdrawal.

No deberá simplemente borrar el qualification record.

## 4062. Foreign Withdrawal Record

Campos:

```text
qualificationId
withdrawalReason
effectiveDateRequested
filingRequirement
taxClearanceRequirement
authorization
submissionReference
approvalDocument
status
```

## 4063. Certificate Requests

Tipos conceptuales:

```text
good_standing
existence
status
certified_copy
formation_copy
other
```

El nombre oficial depende de la jurisdicción.

## 4064. Certificate Request Record

Campos:

```text
id
organizationId
jurisdiction
certificateType
purpose
requestedBy
feeReference
status
documentId
createdAt
completedAt
```

## 4065. Reinstatement Support

Cuando una entity pierda good standing o sea administrativamente disuelta, el módulo podrá ofrecer support.

Estados:

```text
issue_detected
requirements_research
amounts_due_review
documents_required
client_action_required
ready_to_file
submitted
reinstated
failed
professional_review_required
```

## 4066. Reinstatement Requirement Package

Deberá poder reunir:

- missing reports;
- unpaid government fees;
- penalties;
- tax clearance requirements;
- registered agent status;
- reinstatement form;
- evidence.

Las cifras deberán provenir de current verified sources.

## 4067. Good Standing Status

El sistema podrá registrar:

```text
good_standing_verified
active_status_verified
not_in_good_standing
administratively_dissolved
status_unknown
verification_required
```

No deberán inferirse estados negativos sin source oficial.

## 4068. Maintenance Filing Submission

Cada filing de Parte 2 deberá reutilizar un modelo común.

Campos:

```text
id
maintenanceCaseId
filingPackageId
submissionMode
providerId
partnerId
idempotencyKey
externalReference
status
submittedAt
completedAt
```

## 4069. Maintenance Submission Status

```text
draft
ready
submitting
submitted
processing
additional_information_required
rejected
approved
failed
cancelled
unknown
```

## 4070. Maintenance Filing Idempotency

Retries deberán comprobar:

- external reference;
- provider status;
- official status;
- prior receipt;
- package hash.

No deberá existir duplicate filing por retry.

## 4071. Official Evidence and Master Update

Después de approval:

```text
official evidence
→ verify
→ create completion record
→ update master data
→ update compliance profile
→ recalculate obligations
```

El master update deberá ocurrir solo después de verification cuando el cambio sea oficial.

## 4072. Cross-Module Update Handoffs

Cambios relevantes deberán generar handoffs a:

```text
business_formation
ein
tax
bookkeeping
funding
marketplace
banking
insurance
```

según impacto.

## 4073. Permissions, APIs, Events and Workflows

### Permisos

```text
compliance.maintenance.read
compliance.maintenance.manage
compliance.maintenance.review
compliance.maintenance.submit

compliance.registered_agent.read
compliance.registered_agent.manage

compliance.license.read
compliance.license.manage

compliance.foreign_qualification.read
compliance.foreign_qualification.manage

compliance.certificate_request.manage
compliance.reinstatement.manage
```

### APIs

```text
POST /api/compliance/organizations/{id}/change-requests
POST /api/compliance/organizations/{id}/maintenance-cases
POST /api/compliance/maintenance-cases/{id}/review
POST /api/compliance/maintenance-cases/{id}/filing-package
POST /api/compliance/maintenance-cases/{id}/submit

POST /api/compliance/organizations/{id}/registered-agent-changes
POST /api/compliance/organizations/{id}/license-cases

POST /api/compliance/organizations/{id}/foreign-qualification-cases
POST /api/compliance/foreign-qualifications/{id}/withdrawal

POST /api/compliance/organizations/{id}/certificate-requests
POST /api/compliance/organizations/{id}/reinstatement-cases
```

### Eventos

```text
ComplianceChangeRequested
ComplianceMaintenanceCaseCreated
RegisteredAgentChangeRequested
RegisteredAgentChanged
ComplianceAddressChangeRequested
ComplianceManagementChangeRequested
ComplianceOwnershipChangeDetected
ComplianceLegalNameChangeRequested
ComplianceAmendmentPrepared
ComplianceDBARegistered
ComplianceLicenseCaseCreated
ComplianceLicenseRenewalDue
ComplianceForeignQualificationCreated
ComplianceForeignQualificationApproved
ComplianceForeignWithdrawalRequested
ComplianceCertificateRequested
ComplianceReinstatementStarted
ComplianceMaintenanceFilingSubmitted
ComplianceMaintenanceFilingApproved
ComplianceMasterDataUpdated
```

### Workflows

```text
Compliance Change Request Workflow
Registered Agent Change Workflow
Address Change Workflow
Management Change Workflow
Ownership Change Review Workflow
Legal Name Change Workflow
Articles Amendment Workflow
DBA Workflow
License and Permit Workflow
License Renewal Workflow
Foreign Qualification Workflow
Foreign Withdrawal Workflow
Certificate Request Workflow
Reinstatement Workflow
Maintenance Filing Workflow
```

## 4074. Pruebas de Parte 2

Pruebas obligatorias:

1. Crear Maintenance Case.
2. Crear Change Request.
3. Evaluar filing required.
4. Evitar premature master update.
5. Registrar Registered Agent.
6. Detectar service expiring.
7. Crear RA renewal.
8. Separar partner/state fee.
9. Crear RA change.
10. Exigir consent cuando aplica.
11. Crear principal-address change.
12. Evaluar propagation destinations.
13. Crear management change.
14. Validar governance authority.
15. Crear ownership change.
16. Activar tax/compliance review.
17. Crear legal-name change.
18. Bloquear master legal-name update hasta approval.
19. Crear amendment.
20. Crear Amendment Filing Package.
21. Crear DBA record.
22. Evaluar state/local DBA requirements.
23. Crear DBA renewal.
24. Crear Business License Record.
25. Evaluar license applicability.
26. Crear License Application Case.
27. Crear dynamic license checklist.
28. Crear permit case.
29. Crear license renewal obligation.
30. Separar license fees.
31. Evaluar foreign qualification.
32. Crear possibly-required result.
33. Crear professional-review result.
34. Crear Foreign Qualification Case.
35. Validar good-standing certificate freshness.
36. Añadir foreign registered agent.
37. Crear qualification package.
38. Registrar approval.
39. Crear Foreign Qualification Record.
40. Crear new recurring obligations.
41. Crear foreign withdrawal.
42. Crear Certificate Request.
43. Crear Reinstatement Case.
44. Verificar current amounts/requirements.
45. Registrar good-standing status.
46. Crear Maintenance Filing Submission.
47. Probar idempotency.
48. Simular unknown outcome.
49. Verificar official evidence.
50. Actualizar master data.
51. Recalcular Compliance Profile.
52. Crear cross-module handoffs.
53. Probar permissions.
54. Probar APIs.
55. Probar events/outbox.
56. Probar workflows.
57. Probar audit de ownership change.
58. Probar audit de license renewal.
59. Probar audit de foreign qualification.
60. Probar tenant isolation.

## 4075. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. Exista Maintenance Case.
2. Exista Change Request.
3. Exista applicability review.
4. Master data no cambie prematuramente.
5. Exista Registered Agent record.
6. Exista RA continuity monitoring.
7. Exista RA renewal.
8. Exista RA change.
9. Exista agent consent support.
10. Exista Address Change Management.
11. Exista propagation evaluation.
12. Exista Management Change.
13. Exista governance validation.
14. Exista Ownership Change Review.
15. Exista Ownership Change Record.
16. Exista Legal Name Change workflow.
17. Existan downstream name-change handoffs.
18. Exista Articles Amendment.
19. Existan amendment types.
20. Exista Amendment Filing Package.
21. Exista DBA Registry.
22. Exista DBA requirement evaluation.
23. Exista DBA renewal.
24. Exista Business License Record.
25. Exista license applicability evaluation.
26. Exista License Application Case.
27. Exista dynamic document checklist.
28. Exista Permit support.
29. Exista License/Permit Renewal.
30. Exista fee transparency.
31. Exista Foreign Qualification evaluation.
32. Existan qualification inputs.
33. Exista Foreign Qualification Case.
34. Exista Good Standing certificate freshness.
35. Exista foreign registered-agent support.
36. Exista Qualification Filing Package.
37. Exista Qualification Approval handling.
38. Exista Foreign Qualification Record.
39. Existan downstream recurring obligations.
40. Exista Foreign Withdrawal.
41. Exista Certificate Request.
42. Exista Reinstatement Support.
43. Exista Good Standing Status.
44. Exista common Maintenance Filing Submission.
45. Exista filing idempotency.
46. Exista official-evidence verification.
47. Master data se actualice después de verification.
48. Existan cross-module handoffs.
49. Existan permisos/APIs/events/workflows.
50. Toda maintenance action tenga source y audit.
51. No se afirme licencia/qualification sin support.
52. No se borre history al cambiar datos.
53. No se dupliquen filings por retry.
54. No se mezclen government y SG fees.
55. Parte 2 termine lista para notices/remediation de Parte 3.

### Instrucciones para Codex

1. Lee Parte 1 completa.
2. Reutiliza Compliance Requirement Registry.
3. Reutiliza Organization.
4. Reutiliza Documents.
5. Reutiliza Tasks/Approvals.
6. Reutiliza Partner Registry.
7. Reutiliza Provider Registry.
8. Reutiliza Audit.
9. Implementa generic Maintenance Case.
10. Implementa Change Request.
11. Mantén requested vs official values separados.
12. Implementa Registered Agent monitoring.
13. Implementa RA renewal/change.
14. Implementa agent consent.
15. Implementa address propagation rules.
16. Implementa management/ownership review.
17. No trates ownership como simple field edit.
18. Implementa legal-name change.
19. Implementa amendment workflow.
20. Implementa DBA Registry.
21. Evalúa state/local DBA requirements separadamente.
22. Implementa License Record.
23. Implementa dynamic License Requirements.
24. Implementa License/Permit Renewals.
25. Implementa Foreign Qualification evaluation.
26. Permite `professional_review_required`.
27. Implementa Good Standing freshness.
28. Implementa target-state registered-agent handling.
29. Implementa qualification filing package.
30. Implementa foreign qualification record.
31. Recalcula recurring obligations tras qualification.
32. Implementa Foreign Withdrawal.
33. Implementa Certificate Requests.
34. Implementa Reinstatement.
35. Usa current verified sources para amounts/requirements.
36. Implementa Maintenance Filing Submission.
37. Implementa idempotency.
38. Implementa unknown-outcome handling.
39. Actualiza master data solo con official evidence.
40. Implementa cross-module handoffs.
41. Implementa permissions/APIs/events/workflows.
42. Implementa immutable audit.
43. No marques Parte 2 completa si client-requested data puede reemplazar official master data sin verification.

### Verificación final de Parte 2

- ¿Requested y official values están separados?
- ¿Registered Agent continuity se monitorea?
- ¿Cambios de address evalúan todos los destinos?
- ¿Ownership changes activan governance/tax/compliance review?
- ¿Legal name no cambia hasta approval?
- ¿DBA distingue state/local requirements?
- ¿License requirements son dinámicos?
- ¿Foreign qualification permite incertidumbre?
- ¿Good Standing certificate tiene freshness?
- ¿Qualification crea nuevas recurring obligations?
- ¿Reinstatement usa datos actuales?
- ¿Maintenance filings son idempotentes?
- ¿Master data solo se actualiza con evidence?
- ¿Toda acción queda auditada?

---

# Parte 3 — Notices, Renewals, Ownership-Reporting Condicional, Remediation, Escalations, Client Portal y Cross-Module Handoffs

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 34 — Parte 2  
**Secciones incluidas:** 4076–4140  
**Audiencia:** Owner, Codex, compliance specialists, formation specialists, tax preparers, reviewers, partner managers, support, administrators y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Gestión reactiva y preventiva de notices, renewals, ownership-reporting condicional y remediation, con escalaciones, evidencia, client portal y handoffs idempotentes

## 4076. Objetivo de Parte 3

Esta parte define cómo el módulo administra:

- official notices;
- renewal queues;
- missed obligations;
- overdue remediation;
- rejected filings;
- ownership-reporting obligations cuando sean legalmente aplicables;
- client actions;
- partner escalations;
- compliance incidents;
- remediation plans;
- evidence collection;
- client portal;
- cross-module handoffs.

El sistema deberá distinguir entre:

```text
monitoring
action required
remediation
professional review
completed
```

## 4077. Official Notice Record

Campos:

```text
id
organizationId
jurisdictionCode
issuingAuthority
noticeType
noticeDate
receivedAt
responseDueDate
externalReference
documentId
severity
status
createdAt
```

## 4078. Notice Types

```text
annual_report_notice
delinquency_notice
registered_agent_notice
license_notice
renewal_notice
rejection_notice
administrative_dissolution_notice
tax_related_notice
ownership_reporting_notice
information_request
penalty_notice
other
```

## 4079. Notice Source

Fuentes:

```text
client_upload
mail_scan
partner
official_portal
provider_api
government_email
staff_entry
other_verified_source
```

El source original deberá conservarse.

## 4080. Notice Verification

Antes de activar una acción material deberá comprobarse:

- organization match;
- jurisdiction;
- issuing authority;
- external reference;
- notice date;
- response deadline;
- document integrity.

Notices dudosos deberán marcarse `verification_required`.

## 4081. Notice Status

```text
received
verification_required
verified
action_required
client_action_required
partner_action_required
under_review
responded
resolved
closed
invalid
superseded
```

## 4082. Notice Severity

```text
informational
low
medium
high
critical
```

La severidad deberá reflejar impacto operativo y deadline, sin pretender ser opinión legal.

## 4083. Notice Deadline Extraction

La plataforma podrá extraer una fecha potencial mediante IA/OCR/document parsing, pero deberá conservar:

```text
extractedDueDate
confidence
sourceLocation
humanVerifiedDueDate
verificationStatus
```

Una fecha no verificada no deberá activar filing automático.

## 4084. Notice Response Task

Todo notice actionable deberá generar Task con:

```text
noticeId
requiredAction
responsibleParty
dueDate
documentsNeeded
reviewNeeded
status
```

## 4085. Notice Response Package

Cuando exista respuesta formal:

```text
notice
→ requirement
→ evidence
→ proposed response
→ review
→ authorization
→ submission
→ confirmation
```

## 4086. Notice Response Authorization

Una respuesta material deberá vincular:

```text
noticeId
responseVersion
responseHash
authorizedBy
authorizationScope
authorizedAt
```

## 4087. Notice Resolution Evidence

Tipos:

```text
official_acceptance
payment_confirmation
filing_receipt
reinstatement_confirmation
license_confirmation
provider_verified_resolution
manual_verified_official_status
```

## 4088. Renewal Queue

La plataforma deberá mantener una queue consolidada para:

- licenses;
- permits;
- registered-agent services;
- DBAs;
- recurring certificates;
- partner subscriptions;
- other compliance services.

## 4089. Renewal Record

Campos:

```text
id
organizationId
sourceRecordType
sourceRecordId
renewalType
renewalWindowStart
dueDate
expirationDate
feeReference
status
createdAt
completedAt
```

## 4090. Renewal Status

```text
scheduled
window_open
client_action_required
preparing
review_pending
ready_to_submit
submitted
completed
expired
cancelled
not_renewing
unknown
```

## 4091. Renewal Window

El sistema deberá distinguir:

```text
renewalWindowStart
dueDate
expirationDate
gracePeriodEnd
```

No deberán tratarse como una sola fecha.

## 4092. Renewal Risk

Estados:

```text
on_track
attention_needed
at_risk
overdue
expired
unknown
```

El cálculo deberá ser reproducible.

## 4093. Renewal Reminder Escalation

Ejemplo:

```text
60 days
→ reminder

30 days
→ reminder + staff task

14 days
→ priority increase

7 days
→ escalation

due date
→ urgent

after due date
→ remediation workflow
```

La política será configurable.

## 4094. Renewal Non-Action

Si el cliente decide no renovar:

```text
decisionRecord
reason
effectiveDate
downstreamImpact
acknowledgment
```

La plataforma deberá advertir consecuencias conocidas sin inventar resultados.

## 4095. Overdue Obligation

Una obligation pasa a overdue únicamente según:

- verified due date;
- current status;
- no accepted completion evidence;
- applicable grace rules.

## 4096. Overdue Case

Campos:

```text
id
obligationId
daysOverdue
gracePeriodStatus
penaltyRisk
goodStandingRisk
remediationStatus
assignedTo
createdAt
```

## 4097. Remediation Workflow

```text
detect overdue/problem
→ verify current status
→ identify missing action
→ verify current requirements/fees
→ create remediation plan
→ client approval
→ execute
→ verify resolution
```

## 4098. Remediation Plan

Campos:

```text
id
organizationId
obligationId
issueType
requiredActions
requiredDocuments
estimatedGovernmentFees
partnerFees
SGFees
dependencies
deadline
reviewStatus
createdAt
```

## 4099. Remediation Types

```text
late_filing
missed_renewal
rejected_filing
registered_agent_problem
license_expiration
good_standing_issue
administrative_dissolution
ownership_reporting_issue
unresolved_notice
data_mismatch
other
```

## 4100. Penalty and Fee Verification

Penalties, reinstatement fees y late fees deberán marcarse:

```text
verified_current
estimate
verification_required
unknown
```

No deberán presentarse valores stale como definitivos.

## 4101. Rejected Compliance Filing

Campos:

```text
id
submissionId
externalReason
normalizedReason
rejectionCode
receivedAt
responseDueDate
documentId
status
```

## 4102. Rejection Categories

```text
missing_information
invalid_information
fee_issue
signature_issue
document_issue
registered_agent_issue
entity_status_issue
form_version_issue
duplicate_filing
other
```

## 4103. Corrective Action after Rejection

La plataforma deberá determinar:

```text
clerical_fix
new_client_input
new_document
new_signature
new_authorization
new_fee
professional_review
partner_escalation
```

## 4104. Resubmission Governance

Todo resubmission deberá:

- crear nuevo submission record;
- conservar previousSubmissionId;
- conservar rejection;
- usar current requirement;
- verificar fee;
- refrescar authorization cuando corresponda;
- usar idempotency.

## 4105. Ownership Reporting Profile

El sistema deberá mantener un perfil separado para obligaciones de beneficial/ownership reporting cuando correspondan.

Campos:

```text
organizationId
entityType
formationDate
jurisdiction
exemptionStatus
potentialReportingStatus
requirementVersionId
reviewStatus
lastEvaluatedAt
```

## 4106. Conditional Ownership-Reporting Principle

La plataforma solo deberá crear una obligación cuando exista:

```text
current verified requirement
+
applicable entity facts
+
effective-date logic
```

Nunca deberá asumir universalidad.

## 4107. Ownership Reporting Status

```text
not_evaluated
not_applicable
potentially_applicable
applicable
exempt
professional_review_required
filing_pending
filed
update_required
```

## 4108. Ownership Reporting Requirement Source

Deberá registrar:

```text
authority
requirementVersion
effectiveFrom
effectiveTo
sourceReference
verifiedAt
verifiedBy
```

## 4109. Ownership Reporting Exemption

Campos:

```text
exemptionCode
exemptionDescription
evidence
effectiveFrom
effectiveTo
reviewStatus
```

No deberá asignarse exemption solo por AI inference.

## 4110. Reporting Person / Beneficial Owner Data Boundary

Cuando sea legalmente aplicable, datos altamente sensibles deberán manejarse con:

- minimum necessary fields;
- encryption;
- tokenization;
- field-level permissions;
- purpose limitation;
- strict retention.

## 4111. Ownership Reporting Case

Campos:

```text
id
organizationId
requirementVersionId
reportType
reportingPeriod
status
assignedTo
reviewerId
createdAt
completedAt
```

## 4112. Ownership Reporting Case Status

```text
draft
applicability_review
client_input_required
document_collection
review_pending
ready_to_file
submitted
accepted
rejected
update_required
exempt
not_applicable
```

## 4113. Ownership Change Monitoring

Cambios que podrán disparar re-evaluación:

- new owner;
- removed owner;
- ownership percentage change;
- control-person change;
- address/identity data change;
- exemption status change.

## 4114. Ownership Reporting Update Trigger

El engine deberá crear:

```text
potential_update_requirement
```

y luego evaluar la regla vigente.

No deberá asumir un deadline fijo sin Requirement Registry.

## 4115. Ownership Reporting Filing Package

Contenido conceptual:

```text
organizationSnapshot
ownershipSnapshot
requirementVersion
applicabilityRecord
supportingEvidence
reportDataVersion
reviewRecord
authorization
packageHash
```

## 4116. Ownership Reporting Authorization

La authorization deberá vincularse al:

```text
reportDataVersion
reportHash
authorizedBy
authorizedAt
deliveryModel
```

## 4117. Ownership Reporting Evidence

Completion requerirá evidence como:

```text
official_receipt
accepted_submission
provider_verified_confirmation
official_status
```

## 4118. Professional Review Escalation

Deberá generarse cuando:

- applicability sea ambigua;
- exemption sea dudosa;
- ownership/control facts sean complejos;
- notice tenga consecuencias materiales inciertas;
- reinstatement sea complejo;
- multi-jurisdiction conflict exista;
- customer dispute facts.

## 4119. Escalation Record

Campos:

```text
id
organizationId
caseId
escalationType
severity
reason
assignedTo
createdAt
dueAt
status
resolution
resolvedAt
```

## 4120. Escalation Types

```text
professional_review
compliance_manager
partner_escalation
security
billing
client_success
data_quality
provider_incident
```

## 4121. Escalation SLA

Cada escalation deberá tener:

```text
acknowledgmentTarget
resolutionTarget
severity
businessHoursPolicy
```

## 4122. Client Action Request

Campos:

```text
id
organizationId
caseId
actionType
title
description
requiredDocuments
dueDate
priority
status
createdAt
completedAt
```

## 4123. Client Action Types

```text
confirm_information
upload_document
sign_authorization
pay_fee
select_option
provide_identity
confirm_ownership
respond_to_notice
renew_service
other
```

## 4124. Client Action Status

```text
open
viewed
in_progress
submitted
needs_correction
completed
expired
cancelled
```

## 4125. Compliance Client Portal

Secciones:

```text
Compliance Overview
Upcoming Deadlines
Action Required
Filed / Completed
Licenses & Permits
Registered Agent
Notices
Ownership Reporting
Documents
History
```

## 4126. Compliance Health Summary

La UI podrá mostrar:

```text
on_track
attention_needed
action_required
overdue
review_required
unknown
```

No deberá presentarse como una certificación legal absoluta.

## 4127. Health Summary Derivation

Debe derivarse de:

- known open obligations;
- verified due dates;
- overdue items;
- notices;
- unresolved blockers;
- stale requirements;
- pending client actions.

## 4128. Compliance Timeline

Deberá consolidar:

```text
requirement_detected
obligation_created
reminder_sent
client_action
filing_prepared
submitted
accepted
rejected
notice_received
remediated
completed
```

## 4129. Client Document Center

Podrá mostrar:

- filing receipts;
- licenses;
- certificates;
- notices;
- renewal confirmations;
- official state documents;
- ownership-reporting confirmations when applicable.

## 4130. Cross-Module Handoff Record

Campos:

```text
id
sourceModule
sourceCaseId
destinationModule
destinationCaseId
organizationId
handoffType
payloadVersion
payloadHash
status
createdAt
acceptedAt
completedAt
```

## 4131. Handoff Destinations

```text
business_formation
ein
tax
bookkeeping
funding
marketplace
banking
insurance
payroll
documents
```

## 4132. Handoff Idempotency

Retries deberán reutilizar el handoff existente cuando:

```text
same source event
+
same destination
+
same payload version
```

## 4133. Tax Handoffs

Ejemplos:

- ownership change;
- legal name change;
- address change;
- foreign qualification;
- dissolution/reinstatement;
- notice with tax impact.

## 4134. Bookkeeping Handoffs

Ejemplos:

- new state activity;
- foreign qualification;
- new license/location;
- legal-name change;
- ownership change;
- business closure.

## 4135. EIN Handoffs

Ejemplos:

- legal-name change;
- responsible-party change;
- address change;
- official organization update.

El Módulo 33 deberá determinar la acción tributaria específica vigente.

## 4136. Funding / Banking Handoffs

Cambios que puedan afectar:

- legal name;
- ownership;
- authorized signer;
- good standing;
- registered address;
- entity status;

deberán generar alerts/handoffs cuando sean relevantes.

## 4137. Permissions, APIs, Events and Workflows

### Permisos

```text
compliance.notice.read
compliance.notice.manage
compliance.notice.respond

compliance.renewal.read
compliance.renewal.manage

compliance.remediation.read
compliance.remediation.manage

compliance.ownership_reporting.read
compliance.ownership_reporting.manage
compliance.ownership_reporting.review

compliance.escalation.read
compliance.escalation.manage

compliance.client_action.manage
compliance.handoff.read
compliance.handoff.create
```

### APIs

```text
POST /api/compliance/organizations/{id}/notices
POST /api/compliance/notices/{id}/verify
POST /api/compliance/notices/{id}/response-package

GET  /api/compliance/organizations/{id}/renewals
POST /api/compliance/renewals/{id}/prepare

POST /api/compliance/obligations/{id}/remediation-plans
POST /api/compliance/filings/{id}/corrective-actions

POST /api/compliance/organizations/{id}/ownership-reporting/evaluate
POST /api/compliance/organizations/{id}/ownership-reporting/cases

POST /api/compliance/escalations
POST /api/compliance/client-actions
POST /api/compliance/handoffs
```

### Eventos

```text
ComplianceNoticeReceived
ComplianceNoticeVerified
ComplianceNoticeActionRequired
ComplianceRenewalWindowOpened
ComplianceRenewalAtRisk
ComplianceObligationOverdue
ComplianceRemediationPlanCreated
ComplianceFilingRejected
ComplianceCorrectiveActionCreated
ComplianceOwnershipReportingEvaluated
ComplianceOwnershipReportingCaseCreated
ComplianceOwnershipReportingUpdateDetected
ComplianceEscalationCreated
ComplianceClientActionRequested
ComplianceHandoffCreated
```

### Workflows

```text
Compliance Notice Workflow
Compliance Renewal Workflow
Overdue Remediation Workflow
Rejected Filing Workflow
Ownership Reporting Evaluation Workflow
Ownership Reporting Filing Workflow
Compliance Escalation Workflow
Client Action Workflow
Cross-Module Handoff Workflow
```

## 4138. Pruebas de Parte 3

Pruebas obligatorias:

1. Crear Official Notice.
2. Verificar notice contra Organization.
3. Detectar invalid notice.
4. Extraer due date con confidence.
5. Bloquear deadline no verificada.
6. Crear Notice Response Task.
7. Crear response package.
8. Vincular authorization al response hash.
9. Adjuntar resolution evidence.
10. Crear Renewal Record.
11. Diferenciar renewal window/due/expiration.
12. Calcular renewal risk.
13. Ejecutar reminder escalation.
14. Registrar non-renewal decision.
15. Detectar overdue obligation.
16. Crear Overdue Case.
17. Crear Remediation Plan.
18. Verificar penalties actuales.
19. Crear rejected filing.
20. Clasificar rejection.
21. Crear corrective action.
22. Crear resubmission gobernado.
23. Crear Ownership Reporting Profile.
24. Evaluar not-applicable.
25. Evaluar potentially-applicable.
26. Evaluar applicable.
27. Registrar exemption con evidence.
28. Proteger sensitive ownership data.
29. Crear Ownership Reporting Case.
30. Detectar ownership change.
31. Crear potential update requirement.
32. Crear reporting package.
33. Crear authorization.
34. Adjuntar completion evidence.
35. Crear professional-review escalation.
36. Crear Escalation Record.
37. Aplicar SLA.
38. Crear Client Action Request.
39. Cambiar status viewed/completed.
40. Renderizar Compliance Client Portal.
41. Calcular health summary.
42. Evitar legal-certification language.
43. Crear Compliance Timeline.
44. Mostrar Client Document Center.
45. Crear cross-module handoff.
46. Reintentar handoff sin duplicar.
47. Crear Tax handoff.
48. Crear Bookkeeping handoff.
49. Crear EIN handoff.
50. Crear Funding/Banking handoff.
51. Probar permisos.
52. Probar APIs.
53. Probar events/outbox.
54. Probar workflows.
55. Probar immutable audit.
56. Probar requirement freshness antes de ownership reporting.
57. Probar notice deadline conflict.
58. Probar overdue remediation.
59. Probar partner escalation.
60. Probar tenant isolation.

## 4139. Criterios de Aceptación de Parte 3

La Parte 3 estará completa cuando:

1. Exista Official Notice Record.
2. Existan Notice Types.
3. Exista notice source.
4. Exista verification.
5. Exista status.
6. Exista severity.
7. Deadline extraction requiera verification.
8. Exista Notice Response Task.
9. Exista Response Package.
10. Exista authorization.
11. Exista resolution evidence.
12. Exista Renewal Queue.
13. Exista Renewal Record.
14. Exista renewal status.
15. Window/due/expiration estén separados.
16. Exista renewal risk.
17. Exista reminder escalation.
18. Exista non-renewal record.
19. Exista Overdue Case.
20. Exista Remediation Workflow.
21. Exista Remediation Plan.
22. Fees/penalties tengan freshness.
23. Exista rejected-filing handling.
24. Exista rejection taxonomy.
25. Exista Corrective Action.
26. Resubmission preserve history.
27. Exista Ownership Reporting Profile.
28. Ownership reporting sea conditional.
29. Exista status taxonomy.
30. Exista current source.
31. Exista exemption record.
32. Sensitive ownership data esté protegido.
33. Exista Ownership Reporting Case.
34. Ownership changes disparen re-evaluation.
35. Deadlines no estén hardcoded universalmente.
36. Exista Filing Package.
37. Exista authorization.
38. Completion requiera evidence.
39. Exista professional-review escalation.
40. Exista generic Escalation Record.
41. Exista escalation SLA.
42. Exista Client Action Request.
43. Exista Client Portal.
44. Exista Health Summary.
45. Health Summary no sea certificación legal.
46. Exista Compliance Timeline.
47. Exista Client Document Center.
48. Exista Cross-Module Handoff.
49. Handoffs sean idempotentes.
50. Existan Tax/Bookkeeping/EIN/Funding handoffs.
51. Existan permisos/APIs/events/workflows.
52. Toda notice tenga source.
53. Toda remediation tenga evidence.
54. Toda ownership obligation use rule vigente.
55. Parte 3 termine lista para administración/seguridad/analytics de Parte 4.

## 4140. Instrucciones para Codex y Cierre de Parte 3

1. Lee Partes 1 y 2 completas.
2. Reutiliza Compliance Obligation.
3. Reutiliza Requirement Registry.
4. Reutiliza Documents.
5. Reutiliza Tasks/Approvals.
6. Reutiliza Notifications.
7. Reutiliza Partner Registry.
8. Reutiliza Audit.
9. Implementa Official Notice.
10. Implementa notice verification.
11. No uses extracted deadline sin verification.
12. Implementa Notice Response Package.
13. Implementa Renewal Queue.
14. Mantén window/due/expiration separados.
15. Implementa renewal risk.
16. Implementa reminder escalation.
17. Implementa Overdue Case.
18. Implementa Remediation Plan.
19. Verifica fees/penalties antes de mostrarlas como definitivas.
20. Implementa rejected-filing workflow.
21. Implementa Corrective Action.
22. Implementa resubmission versionado.
23. Implementa Ownership Reporting Profile separado.
24. No hardcodees ownership-reporting universal.
25. Usa current verified requirements.
26. Implementa exemption evidence.
27. Protege beneficial-owner data.
28. Implementa ownership-change re-evaluation.
29. Implementa reporting filing package.
30. Implementa authorization hash.
31. Exige completion evidence.
32. Implementa professional-review escalation.
33. Implementa generic Escalation Record.
34. Implementa Client Action Request.
35. Implementa Compliance Client Portal.
36. Implementa Health Summary con lenguaje no absoluto.
37. Implementa Timeline.
38. Implementa Document Center.
39. Implementa Cross-Module Handoffs.
40. Implementa handoff idempotency.
41. Implementa permissions/APIs/events/workflows.
42. Implementa immutable audit.
43. No marques Parte 3 completa si una obligation sensible puede generarse desde una regla stale.

### Verificación final de Parte 3

- ¿Los notices se verifican antes de actuar?
- ¿Deadlines extraídas por IA requieren confirmación?
- ¿Renewal window, due date y expiration permanecen separadas?
- ¿Overdue genera remediation?
- ¿Penalties actuales se verifican?
- ¿Rejections conservan el mensaje oficial?
- ¿Resubmissions preservan history?
- ¿Ownership reporting depende de current requirement?
- ¿Exemptions tienen evidence?
- ¿Sensitive ownership data está protegida?
- ¿Escalations tienen SLA?
- ¿Client Portal distingue action required de completed?
- ¿Health Summary evita afirmar “legalmente compliant” de forma absoluta?
- ¿Handoffs downstream son idempotentes?
- ¿Toda acción queda auditada?

---

# Parte 4 — Partners, Automation, AI, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 34 — Parte 3  
**Secciones incluidas:** 4141–4205  
**Audiencia:** Owner, Codex, compliance specialists, partner managers, administrators, security, operations, reviewers, support y Data Analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Compliance gobernado por requisitos versionados, partners desacoplados, automatización supervisada, seguridad de mínimo privilegio, observabilidad, métricas de calidad y continuidad operacional

## 4141. Objetivo de Parte 4

Esta parte cierra el Módulo 34 definiendo:

- partner/provider management;
- automation;
- AI assistance;
- compliance governance;
- admin console;
- work queues;
- SLAs;
- security;
- sensitive data controls;
- audit;
- observability;
- analytics;
- migration;
- data portability;
- business continuity;
- E2E tests;
- final acceptance.

## 4142. Partner Integration Principle

```text
Compliance requirement
→ service need
→ partner capability
→ scope
→ authorization
→ controlled handoff
→ status/evidence
→ completion
```

Nunca:

```text
partner exists
→ send all client data
```

## 4143. Partner Types

```text
registered_agent
filing_provider
license_provider
legal_service_partner
tax_partner
identity_verification_provider
document_provider
secure_delivery_provider
other
```

## 4144. Partner Capability Matrix

Campos conceptuales:

```text
annualReportFiling
registeredAgentService
registeredAgentChange
licenseApplication
licenseRenewal
foreignQualification
reinstatement
certificateRequest
ownershipReportingSupport
noticeResponseSupport
API
webhooks
manualPortal
```

## 4145. Partner Jurisdiction Coverage

Cada partner deberá declarar:

```text
supportedJurisdictions
supportedEntityTypes
supportedRequirementTypes
effectiveFrom
effectiveTo
status
```

## 4146. Partner Compliance Status

```text
active
limited
under_review
temporarily_suspended
terminated
unknown
```

Un partner suspendido no deberá recibir nuevos handoffs.

## 4147. Partner Service Order

Campos:

```text
id
organizationId
complianceCaseId
partnerId
serviceType
scope
jurisdiction
quotedPartnerCost
governmentFeeResponsibility
clientChargeReference
externalReference
status
createdAt
completedAt
```

## 4148. Partner Service Order Status

```text
draft
quoted
approved
sent
accepted
in_progress
client_action_required
completed
failed
cancelled
refunded
```

## 4149. Partner SLA

Podrá incluir:

```text
acceptanceTarget
submissionTarget
statusUpdateCadence
documentDeliveryTarget
rejectionResponseTarget
supportResponseTarget
```

## 4150. Partner SLA Breach

Cuando exista incumplimiento:

```text
detect
→ alert
→ escalation
→ preserve case state
→ evaluate fallback
→ human review
```

## 4151. Partner Failure and Fallback

Fallback deberá evitar:

- duplicate filing;
- duplicate fee;
- duplicate client charge;
- lost documents;
- conflicting submission states.

Cambio de partner material deberá requerir review y, cuando aplique, nueva client authorization.

## 4152. Partner Data Sharing

Antes de compartir:

```text
partner
purpose
dataScope
consent
retentionExpectation
transmissionMethod
auditEvent
```

Solo datos mínimos necesarios.

## 4153. Partner Cost and Fee Transparency

Separar:

```text
government_fee
partner_fee
SG_service_fee
third_party_cost
```

No deberán mezclarse.

## 4154. Automation Engine

El módulo podrá automatizar:

- monitoring runs;
- requirement refresh reminders;
- obligation creation;
- deadline calculation;
- reminders;
- work-queue routing;
- notice classification draft;
- renewal generation;
- handoff creation;
- status polling;
- dashboard updates;
- SLA alerts.

## 4155. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 4156. Informational Automation

Ejemplos:

- summarize compliance status;
- calculate aging;
- display next deadlines;
- identify stale requirement;
- draft client reminder;
- prepare dashboard metrics.

## 4157. Low-Risk Automation

Ejemplos:

- create task;
- schedule reminder;
- create recurrence;
- update normalized partner status;
- attach known official receipt;
- route case.

## 4158. Moderate-Risk Automation

Ejemplos:

- propose applicability;
- prepare annual-report draft;
- propose license requirement;
- propose remediation steps;
- propose partner.

Deberá requerir review antes de material effect.

## 4159. High-Risk Automation

Acciones como:

- submit filing;
- resubmit after rejection;
- send sensitive ownership data;
- override stale requirement blocker;
- mark official status resolved;
- update official master data;
- change registered agent.

Requieren human gate/authorization.

## 4160. Prohibited Automation

No deberá:

- fabricate official status;
- fabricate license;
- fabricate receipt;
- alter official notice;
- hide overdue obligation;
- bypass authorization;
- submit knowingly false information;
- invent ownership-reporting applicability;
- impersonate government systems.

## 4161. AI Assistant Scope

La IA podrá:

- summarize open obligations;
- draft reminders;
- summarize notices;
- identify missing data;
- suggest applicability questions;
- compare current vs prior requirements;
- suggest remediation options;
- prioritize work queues.

## 4162. AI Grounding Requirement

Para información actual como:

- deadlines;
- fees;
- forms;
- ownership reporting;
- license rules;
- state filing requirements;
- registered-agent rules;

la IA deberá usar current verified sources/configuration.

## 4163. AI Output Contract

Outputs materiales:

```text
recommendation
confidence
sourceReferences
requirementVersion
assumptions
missingInformation
humanReviewRequired
```

## 4164. AI Prohibited Decisions

La IA no deberá por sí sola:

- declare legal compliance;
- determine final exemption;
- approve high-risk filing;
- waive blocker;
- mark official completion;
- change ownership;
- change registered agent;
- issue legal opinion as authority.

## 4165. Compliance Governance Board / Review Function

La arquitectura deberá permitir una función de governance para:

- approve requirement updates;
- review stale rules;
- review partner issues;
- approve policy changes;
- review high-risk overrides;
- monitor quality.

No requiere necesariamente un comité formal en MVP.

## 4166. Requirement Publication Workflow

```text
research
→ source verification
→ draft
→ review
→ approve
→ publish
→ effective date
→ impact analysis
```

## 4167. Requirement Impact Analysis

Cuando se publique una nueva versión deberá evaluar:

- open obligations;
- ready-to-file cases;
- overdue cases;
- notices;
- renewals;
- ownership-reporting cases;
- client communications.

## 4168. Admin Console

Secciones:

```text
Overview
Organizations
Compliance Profiles
Requirements
Obligations
Calendar
Annual Reports
Licenses
Registered Agent
Foreign Qualifications
Notices
Renewals
Remediation
Ownership Reporting
Partners
Work Queues
SLAs
Analytics
Security
Configuration
```

## 4169. Operations Dashboard

Métricas/tiles:

- active organizations;
- upcoming deadlines;
- action-required cases;
- overdue obligations;
- ready-to-file;
- submitted;
- notices awaiting review;
- renewals at risk;
- remediation cases;
- ownership-reporting reviews;
- partner incidents;
- stale requirements.

## 4170. Work Queues

```text
requirement_review
applicability_review
annual_report_review
ready_to_file
license_review
registered_agent_review
foreign_qualification_review
notice_review
renewal_review
overdue_remediation
ownership_reporting_review
partner_escalation
security_review
```

## 4171. Assignment Engine

Podrá considerar:

- jurisdiction;
- requirement type;
- entity type;
- complexity;
- professional-review flag;
- user permissions;
- workload;
- language;
- SLA deadline.

## 4172. SLA Tracking

SLAs:

```text
requirement_review_sla
applicability_review_sla
annual_report_sla
license_review_sla
notice_response_sla
renewal_sla
remediation_sla
ownership_reporting_review_sla
partner_escalation_sla
```

## 4173. SLA Clock Pausing

Cuando corresponda, el sistema deberá diferenciar:

```text
active_internal_time
client_blocked_time
partner_blocked_time
government_processing_time
```

para evitar métricas engañosas.

## 4174. Security Model

Aplicar:

- MFA;
- RBAC;
- ABAC;
- resource-level access;
- field-level access;
- purpose-based access;
- least privilege;
- reauthentication;
- session controls;
- immutable audit.

## 4175. Sensitive Compliance Data

Incluye potencialmente:

- ownership data;
- government identifiers;
- license numbers;
- identity documents;
- tax-related notices;
- signatures;
- partner credentials;
- residential addresses.

## 4176. Field-Level Masking

Ejemplos:

```text
License number: ******3812
Tax identifier: ***-**-4821
```

El valor completo solo deberá mostrarse cuando sea necesario.

## 4177. Sensitive Document Access

Podrá requerir:

```text
permission
purpose
reauthentication
temporary access
audit
```

## 4178. Export Governance

Exports deberán registrar:

```text
requestedBy
scope
purpose
destination
maskingPolicy
generatedAt
expiresAt
downloadEvents
```

Bulk exports deberán requerir elevated permission.

## 4179. Privileged Actions

Ejemplos:

- override blocker;
- reopen completed obligation;
- alter requirement effective dates;
- approve partner fallback;
- export sensitive data;
- mark manual official verification;
- change retention policy.

## 4180. Owner Break-Glass

Workflow:

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

No será un bypass cotidiano.

## 4181. Security Incident Types

```text
cross_client_access
unauthorized_export
ownership_data_exposure
official_notice_tampering
license_document_exposure
partner_credential_compromise
unauthorized_filing
privilege_misuse
```

## 4182. Security Incident Response

```text
detect
→ contain
→ preserve evidence
→ restrict access
→ assess scope
→ compliance/security review
→ remediation
→ post-incident review
```

## 4183. Audit Trail

Deberá cubrir:

- requirement creation/change;
- applicability decisions;
- deadline calculations;
- reminders;
- filings;
- rejections;
- official notices;
- renewals;
- ownership-reporting cases;
- remediation;
- partner handoffs;
- master-data changes;
- exports;
- overrides.

## 4184. Observability

Métricas técnicas:

```text
requirement_refresh_failure_rate
deadline_calculation_error_rate
reminder_delivery_failure_rate
partner_api_failure_rate
webhook_failure_rate
filing_submission_error_rate
document_ingestion_failure_rate
handoff_failure_rate
```

## 4185. Operational Alerts

Alertas:

- stale requirement in active case;
- deadline calculation failed;
- reminder failed;
- filing stuck;
- notice deadline approaching;
- renewal at risk;
- overdue unresolved;
- partner degraded;
- ownership-reporting case blocked;
- sensitive export anomaly.

## 4186. Analytics Dashboards

```text
Compliance Executive Dashboard
Compliance Operations Dashboard
Deadline Risk Dashboard
Annual Report Dashboard
License and Permit Dashboard
Registered Agent Dashboard
Notice and Remediation Dashboard
Ownership Reporting Dashboard
Partner Performance Dashboard
Compliance Quality Dashboard
```

## 4187. Core KPIs

```text
organizations_monitored
open_obligations
upcoming_obligations
overdue_obligations
completion_rate
on_time_completion_rate
ready_to_file_rate
submission_success_rate
average_days_to_complete
```

## 4188. Quality KPIs

```text
stale_requirement_block_count
deadline_correction_rate
rejected_filing_rate
remediation_rate
reopened_obligation_rate
unverified_completion_rate
notice_mismatch_rate
duplicate_filing_prevented_count
```

## 4189. Renewal KPIs

```text
renewals_due
renewals_completed
renewals_completed_on_time
renewals_expired
renewal_client_action_delay
renewal_partner_delay
```

## 4190. Partner KPIs

```text
partner_acceptance_time
partner_submission_time
partner_error_rate
partner_sla_breach_rate
partner_rejection_rate
partner_document_delivery_time
partner_cost_per_case
```

## 4191. Ownership Reporting KPIs

Solo cuando dicha obligación esté legalmente habilitada/aplicable:

```text
cases_evaluated
cases_applicable
cases_exempt
cases_professional_review
filings_completed
updates_required
rejections
```

## 4192. Revenue and Service KPIs

Podrá medirse:

```text
compliance_service_revenue
average_revenue_per_organization
annual_report_service_attach_rate
license_service_attach_rate
registered_agent_service_attach_rate
renewal_service_attach_rate
partner_costs
gross_margin
```

Government fees deberán mantenerse separadas de SG revenue si son pass-through.

## 4193. Metric Governance

Cada KPI deberá tener:

```text
metricName
definition
numerator
denominator
filters
timeWindow
owner
version
sourceTables
lastValidatedAt
```

## 4194. Data Portability

El cliente podrá obtener:

- Compliance Profile summary;
- current obligations;
- completed obligations;
- filing receipts;
- licenses;
- certificates;
- notices;
- renewal history;
- remediation history;
- timeline;
- source documents dentro del scope permitido.

## 4195. Migration Into Compliance

Para entidades preexistentes:

```text
collect entity profile
→ verify official status
→ import active licenses
→ import registered agent
→ import foreign qualifications
→ identify known obligations
→ create migration snapshot
→ begin monitoring
```

## 4196. Migration Record

Campos:

```text
id
organizationId
sourceSystem
cutoffDate
importedRequirements
importedObligations
importedDocuments
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 4197. Historical Obligation Import

Obligaciones históricas deberán poder marcarse:

```text
historical_completed
historical_unknown
historical_overdue
not_imported
```

No deberán fingir que fueron procesadas por SG Solutions.

## 4198. Migration Out

La salida deberá poder producir:

- requirement list;
- obligation list;
- deadlines;
- licenses;
- registered-agent record;
- notices;
- completion evidence;
- open remediation items.

## 4199. Business Continuity

Ante outage:

```text
preserve last verified state
→ stop risky submissions
→ keep calendar/read-only visibility
→ queue low-risk reminders/tasks
→ restore
→ reconcile queued actions
→ verify submission outcomes
→ prevent duplicates
```

## 4200. Disaster Recovery Priority

Prioridad:

1. active submissions with unknown outcome;
2. deadlines due/overdue;
3. critical notices;
4. ownership-reporting deadlines if applicable;
5. renewals at risk;
6. routine monitoring.

## 4201. Roadmap del Módulo 34

### Fase 1
- Compliance Profiles;
- Requirements;
- obligations;
- calendars;
- annual/biennial reports;
- manual evidence.

### Fase 2
- licenses;
- registered agent;
- amendments;
- foreign qualification;
- notices;
- renewals.

### Fase 3
- provider integrations;
- automated status;
- advanced ownership-reporting workflows when applicable;
- partner network.

### Fase 4
- predictive risk;
- deeper government integrations;
- advanced multi-state compliance;
- enterprise governance.

## 4202. End-to-End Test 1 — Annual Compliance

```text
formation complete
→ compliance handoff
→ requirement applies
→ annual report obligation
→ deadline
→ reminders
→ preparation
→ review
→ authorization
→ filing
→ evidence
→ completion
→ next recurrence
```

## 4203. End-to-End Test 2 — Change / Foreign / License

### Registered Agent Change

```text
client request
→ requirement
→ consent
→ filing package
→ submit
→ approval
→ master update
→ monitoring refresh
```

### Foreign Qualification

```text
new-state activity
→ applicability review
→ qualification case
→ good standing certificate
→ registered agent
→ filing
→ approval
→ new recurring obligations
```

### License Renewal

```text
license active
→ renewal window
→ reminders
→ client action
→ submission
→ evidence
→ new expiration
```

## 4204. End-to-End Test 3 — Notice, Remediation, Ownership Reporting and Security

### Notice / Remediation

```text
official notice
→ verify
→ deadline
→ remediation
→ response
→ evidence
→ resolved
```

### Ownership Reporting

```text
profile change
→ current requirement evaluation
→ applicable/exempt/review
→ filing if required
→ evidence
→ monitoring
```

### Security

```text
unauthorized sensitive export
→ deny
→ alert
→ incident
→ evidence
→ restrict access
→ remediation
```

## 4205. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 34

El Módulo 34 estará completo cuando:

1. Exista Compliance Service Catalog.
2. Exista Compliance Engagement.
3. Exista Compliance Case.
4. Exista Compliance Profile.
5. Exista profile versioning.
6. Exista Compliance Snapshot.
7. Exista Requirement Registry.
8. Requirements tengan source/freshness/version.
9. Exista effective-date logic.
10. Exista Applicability Engine.
11. Exista Compliance Obligation.
12. Exista obligation uniqueness.
13. Exista Deadline Engine.
14. Exista due-date confidence.
15. Exista Compliance Calendar.
16. Exista Reminder Policy.
17. Reminders sean idempotentes.
18. Responsibility y service scope estén separados.
19. Exista annual-report support.
20. Exista biennial-report support.
21. Exista report preparation.
22. Exista report review.
23. Exista authorization.
24. Exista immutable filing package.
25. Exista Ready-to-File Gate.
26. Exista Monitoring Run.
27. Existan Findings.
28. Completion requiera evidence.
29. Exista Maintenance Case.
30. Requested y official values estén separados.
31. Exista Registered Agent monitoring.
32. Exista RA renewal/change.
33. Exista address-change propagation.
34. Exista management-change support.
35. Ownership changes activen review.
36. Exista legal-name-change workflow.
37. Exista amendment workflow.
38. Exista DBA Registry.
39. Exista License Record.
40. Exista License Application.
41. Exista License/Permit Renewal.
42. Exista Foreign Qualification.
43. Exista Good Standing freshness.
44. Exista Foreign Withdrawal.
45. Exista Certificate Request.
46. Exista Reinstatement Support.
47. Exista Maintenance Filing Submission.
48. Maintenance filings sean idempotentes.
49. Master data se actualice con evidence.
50. Exista Official Notice.
51. Notices se verifiquen.
52. Deadline extraction requiera verification.
53. Exista Renewal Queue.
54. Exista Overdue Remediation.
55. Fees/penalties tengan freshness.
56. Exista rejected-filing workflow.
57. Resubmission preserve history.
58. Ownership reporting sea conditional/current.
59. Existan exemption records.
60. Sensitive ownership data esté protegida.
61. Existan Escalations.
62. Exista Client Action workflow.
63. Exista Client Portal.
64. Exista Health Summary no absoluto.
65. Exista Timeline.
66. Exista Document Center.
67. Existan Cross-Module Handoffs.
68. Handoffs sean idempotentes.
69. Exista Partner Capability Matrix.
70. Exista Partner SLA.
71. Exista partner fallback.
72. Exista data-sharing governance.
73. Exista Automation Engine.
74. Existan risk levels.
75. High-risk actions requieran gates.
76. Existan prohibited automations.
77. IA use current verified requirements.
78. IA no declare legal compliance.
79. Exista Requirement Publication Workflow.
80. Exista impact analysis.
81. Exista Admin Console.
82. Existan Work Queues.
83. Exista Assignment Engine.
84. Exista SLA Tracking.
85. Exista MFA/RBAC/ABAC.
86. Exista field-level masking.
87. Exista sensitive document access control.
88. Exista Export Governance.
89. Existan privileged-action controls.
90. Exista break-glass gobernado.
91. Exista Security Incident workflow.
92. Exista immutable Audit Trail.
93. Exista Observability.
94. Existan Alerts.
95. Existan Analytics Dashboards.
96. Existan core KPIs.
97. Existan quality KPIs.
98. Existan renewal KPIs.
99. Existan partner KPIs.
100. Ownership-reporting KPIs sean condicionales.
101. Exista Metric Governance.
102. Exista Data Portability.
103. Exista Migration In.
104. Exista Migration Out.
105. Exista Business Continuity.
106. Exista Disaster Recovery priority.
107. Exista roadmap.
108. Existan E2E tests.
109. Toda obligation tenga source.
110. Toda due date sea trazable.
111. Toda completion tenga evidence.
112. Ningún filing se duplique por retry.
113. Ninguna regla cambiante quede hardcoded sin versioning.
114. Ningún client-requested value sobrescriba official data sin verification.
115. Ningún partner reciba datos fuera de scope.
116. Ninguna IA convierta incertidumbre en una obligación definitiva.
117. La plataforma funcione en español e inglés.
118. El código use identifiers en inglés.
119. Las cuatro partes estén integradas.
120. El módulo opere end-to-end de forma trazable.

### Instrucciones finales para Codex

1. Lee las cuatro partes completas.
2. Lee Módulos 32 y 33 para handoffs.
3. Reutiliza Organizations, Persons, Documents, Tasks, Approvals, Notifications, Partners, Providers, Audit y Workflow Engine.
4. No construyas calendarios, documents o partner records paralelos.
5. Implementa Requirement Registry versionado.
6. Usa sources/effective dates.
7. Implementa Applicability Engine.
8. Mantén incertidumbre explícita.
9. Implementa Obligation uniqueness.
10. Implementa Deadline Engine reproducible.
11. Implementa Reminder idempotency.
12. Separa legal requirement de purchased service.
13. Implementa periodic-report workflows.
14. Implementa maintenance workflows.
15. Mantén requested vs official values.
16. Implementa licenses/permits dynamically.
17. Implementa foreign qualification.
18. Implementa notices/renewals/remediation.
19. Implementa conditional ownership reporting.
20. Usa current verified rules.
21. Implementa Cross-Module Handoffs idempotentes.
22. Implementa partner capability/SLA/fallback.
23. Implementa data-minimization.
24. Implementa automation risk levels.
25. Implementa AI grounding.
26. No permitas AI final legal conclusions.
27. Implementa Requirement Publication and impact analysis.
28. Implementa Admin Console/Queues/SLAs.
29. Implementa MFA/RBAC/ABAC.
30. Implementa field/document access.
31. Implementa Export Governance.
32. Implementa Break-Glass.
33. Implementa Security Incident handling.
34. Implementa immutable audit.
35. Implementa observability/alerts.
36. Implementa analytics + metric governance.
37. Implementa migration/portability.
38. Implementa continuity/recovery.
39. Ejecuta E2E scenarios.
40. No marques el módulo listo si cualquier obligation puede existir sin source, date trace o completion evidence.

### Verificación final para entrega

- ¿Cada requirement tiene source, version y freshness?
- ¿Cada obligation puede reconstruirse?
- ¿Deadlines son reproducibles?
- ¿Reminders y filings son idempotentes?
- ¿Annual reports usan datos verificados?
- ¿Requested data permanece separado de official data?
- ¿Licenses/foreign qualification permiten incertidumbre?
- ¿Notices se verifican?
- ¿Remediation usa current fees/requirements?
- ¿Ownership reporting es condicional a reglas vigentes?
- ¿Partners reciben solo minimum necessary?
- ¿AI está grounded y limitada?
- ¿High-risk actions requieren gates?
- ¿Sensitive data está protegida?
- ¿Toda exportación material queda auditada?
- ¿Analytics mide calidad además de velocidad?
- ¿Business Continuity evita duplicate submissions?
- ¿Los escenarios E2E pasan?

# Estado Final del Módulo 34

```text
MÓDULO 34:
BUSINESS COMPLIANCE

PARTES:
1. Fundamentos, Requirement Registry, Calendarios y Annual/Biennial Reports
2. Licencias, Registered Agent, Cambios, Foreign Qualification y Maintenance
3. Notices, Renewals, Ownership Reporting, Remediation y Handoffs
4. Partners, Automation, AI, Security, Analytics y Cierre

SECCIONES:
3946–4205

ESTADO:
MODULE COMPLETE
```

