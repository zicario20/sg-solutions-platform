# SG Solutions Platform — Módulo 33: EIN y Documentos Empresariales

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 33. No es un resumen.
> Se irá ampliando dentro del mismo `.md` conforme se completen las tres partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, servicio EIN, intake, responsible party, eligibility, SS-4 data model, review y Ready-to-Submit | 3751–3815 | **COMPLETE** |
| 2 | Submission, authorization, IRS/provider channels, tracking, errores, correcciones, EIN issuance y CP 575/147C | 3816–3880 | **COMPLETE** |
| 3 | Document vault, post-EIN handoffs, integrations, security, admin, analytics, migration, E2E y cierre | 3881–3945 | **COMPLETE** |

**Estado global del Módulo 33:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Intake, Responsible Party, Eligibility, SS-4 Data Model, Review y Ready-to-Submit

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 32 — Business Formation  
**Secciones incluidas:** 3751–3815  
**Audiencia:** Owner, Codex, EIN specialists, tax preparers, formation specialists, reviewers, compliance, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Preparación y coordinación de solicitudes EIN mediante datos confirmados, reglas versionadas, autorización explícita, revisión humana y trazabilidad completa

---

## 3751. Objetivo del Módulo 33

El Módulo 33 permitirá administrar el proceso de obtención y documentación de un Employer Identification Number para entidades y actividades soportadas por SG Solutions.

Deberá cubrir:

- service catalog;
- intake;
- responsible party;
- entity identity;
- SS-4 data model;
- eligibility;
- reason for applying;
- principal activity;
- addresses;
- third-party designee;
- authorization;
- review;
- submission package;
- status tracking;
- issuance;
- confirmation documents;
- secure storage;
- handoffs hacia otros módulos.

---

## 3752. Principio central

```text
Verified organization data
→ EIN intake
→ responsible party
→ requirement validation
→ SS-4 data set
→ human review
→ authorization
→ Ready-to-Submit Package
→ submission
→ IRS response
→ EIN confirmation
→ downstream handoffs
```

Nunca:

```text
formed company
→ invent EIN
```

ni:

```text
partial intake
→ submit automatically
```

---

## 3753. Relación con el Módulo 32

El Módulo 32 deberá poder crear un EIN handoff con:

```text
organizationId
approvedLegalName
entityType
formationDate
effectiveDate
formationJurisdiction
stateEntityIdentifier
principalAddress
mailingAddress
ownershipSnapshot
managementSnapshot
sourceDocuments
```

Módulo 33 deberá reutilizar esta información en vez de volver a pedirla cuando esté confirmada y vigente.

---

## 3754. Alcance inicial

El MVP deberá soportar prioritariamente:

```text
single_member_llc
multi_member_llc
corporation
partnership
sole_proprietorship_when_supported
other_supported_business_entity
```

Casos fuera del scope deberán marcarse:

```text
professional_review_required
unsupported
```

---

## 3755. Service Catalog

Servicios conceptuales:

```text
ein_application
ein_application_with_business_formation
ein_replacement_confirmation_support
ein_record_update_coordination
ein_document_retrieval_support
custom_ein_service
```

Cada servicio deberá tener scope y delivery model explícitos.

---

## 3756. Delivery Models

```text
sg_service
sg_managed_with_partner
client_self_service_assisted
education_only
future_or_conditional
```

La UI deberá explicar claramente quién realiza cada acción.

---

## 3757. EIN Engagement

Campos:

```text
id
clientId
organizationId
serviceOrderId
serviceType
deliveryModel
assignedSpecialistId
assignedReviewerId
status
openedAt
completedAt
createdAt
updatedAt
```

---

## 3758. EIN Case

Campos:

```text
id
caseNumber
engagementId
organizationId
sourceFormationCaseId
applicationRecordId
responsiblePartyId
currentPackageVersionId
status
createdAt
updatedAt
completedAt
```

---

## 3759. EIN Case Status

```text
draft
intake_pending
responsible_party_pending
eligibility_review
data_review
client_action_required
review_pending
authorization_pending
ready_to_submit
submitted
processing
additional_information_required
issued
failed
cancelled
archived
```

---

## 3760. No Duplicate EIN Case

El sistema deberá comprobar si ya existe:

- EIN issued;
- EIN case active;
- prior EIN case;
- imported EIN record;
- external provider case.

Si existe potencial duplicado deberá crear:

```text
possible_duplicate_ein_case
```

antes de iniciar otra solicitud.

---

## 3761. Organization Identity Snapshot

Al abrir un EIN Case deberá crearse un snapshot de:

```text
legalName
tradeName
entityType
formationJurisdiction
formationDate
effectiveDate
stateEntityIdentifier
principalAddress
mailingAddress
ownership
management
```

Este snapshot deberá ser versionado.

---

## 3762. Approved Data Preference

Datos provenientes de:

```text
verified formation approval
approved organization record
signed governance documents
```

deberán tener prioridad sobre:

```text
draft intake
free-text client entry
AI suggestion
```

---

## 3763. EIN Intake

El intake deberá recopilar solo los datos necesarios para el servicio.

Secciones iniciales:

```text
Entity Identity
Responsible Party
Addresses
Reason for Applying
Business Start
Principal Activity
Employees
Tax Classification Context
Third-Party Designee
Authorization
Supporting Documents
```

---

## 3764. Intake Source

Cada field deberá conservar:

```text
value
sourceType
sourceReference
confirmedByClient
verifiedByStaff
verifiedAt
```

Sources:

```text
formation_module
client_input
uploaded_document
tax_module
bookkeeping_module
staff_entry
partner_import
external_source
```

---

## 3765. Responsible Party Concept

El sistema deberá mantener el concepto de `Responsible Party` como una persona o entidad identificada conforme a las reglas aplicables al caso.

No deberá inferirse automáticamente solo por:

- ownership percentage;
- manager title;
- signer role;
- organizer/incorporator role.

---

## 3766. Responsible Party Record

Campos:

```text
id
einCaseId
personId
entityId
responsiblePartyType
legalName
taxIdentifierToken
relationshipToEntity
controlBasis
country
addressReference
verificationStatus
createdAt
```

---

## 3767. Responsible Party Types

```text
individual
government_entity
exempt_entity
other_supported_type
unknown_requires_review
```

La taxonomía exacta deberá ser configurable y alineada con requisitos vigentes.

---

## 3768. Responsible Party Verification

Deberá verificar:

- identity;
- relationship to business;
- authority;
- tax identifier availability when required;
- data consistency;
- duplicate use warnings cuando corresponda;
- client confirmation.

---

## 3769. Tax Identifier Handling

Los identificadores tributarios sensibles deberán almacenarse mediante:

```text
tokenization
encryption
masking
restricted_access
purpose_based_access
```

No deberán aparecer completos en logs, analytics o audit messages ordinarios.

---

## 3770. Responsible Party Conflict

Ejemplos:

```text
ownership_data_conflict
authority_conflict
name_mismatch
identifier_mismatch
multiple_candidates
missing_required_identifier
```

Conflictos materiales deberán bloquear Ready-to-Submit.

---

## 3771. Applicant Entity Type

El sistema deberá mapear el entity type interno a una clasificación soportada para el EIN application data set.

Campos:

```text
internalEntityType
applicationEntityType
applicationSubtype
mappingVersion
reviewStatus
```

---

## 3772. Entity Type Mapping Registry

Deberá existir un registry versionado para:

```text
single_member_llc
multi_member_llc
partnership
corporation
s_corporation_context
sole_proprietor
trust_future
estate_future
nonprofit_future
other
```

La presencia de una categoría futura no significa que esté habilitada en producción.

---

## 3773. Tax Classification Context

El módulo podrá recopilar información necesaria para routing y application preparation, pero no deberá tomar automáticamente elecciones tributarias materiales.

Estados:

```text
not_evaluated
client_stated
tax_professional_reviewed
existing_election
professional_review_required
```

---

## 3774. Reason for Applying

Valores conceptuales:

```text
started_new_business
hired_employees
banking_purpose_when_applicable
changed_organization_type
purchased_active_business
created_trust_future
created_pension_plan_future
other_supported_reason
unknown_requires_review
```

La taxonomía final deberá corresponder al formulario/requisito vigente.

---

## 3775. Reason Details

Campos:

```text
reasonCode
reasonDescription
effectiveDate
source
clientConfirmed
reviewStatus
```

---

## 3776. Business Start Date

Deberá distinguirse entre:

```text
formationDate
effectiveDate
businessStartDate
firstPayrollDate
firstRevenueDate
```

No deberán asumirse iguales.

---

## 3777. Principal Business Activity

Campos:

```text
industryCategory
activityDescription
primaryProductOrService
naicsCodeOptional
source
reviewStatus
```

La descripción deberá ser suficientemente específica sin inventar actividad.

---

## 3778. Activity Classification Assistance

La IA podrá sugerir:

- industry;
- business activity summary;
- NAICS-like mapping;
- questions.

Deberá mostrar:

```text
suggestion
confidence
sourceContext
humanReviewRequired
```

No deberá modificar el application data set material sin review.

---

## 3779. Principal Address

El application data set deberá distinguir:

```text
principalBusinessAddress
mailingAddress
responsiblePartyAddress
registeredAgentAddress
```

No deberán copiarse entre sí automáticamente salvo confirmación.

---

## 3780. Address Validation

Validaciones:

- required fields;
- country;
- state/territory when applicable;
- postal code format;
- PO Box rules según field;
- consistency;
- normalization;
- source.

---

## 3781. Mailing Address

Podrá ser igual al principal address, pero deberá conservarse una confirmación explícita:

```text
sameAsPrincipal = true|false
```

---

## 3782. Foreign Address Support

La arquitectura deberá permitir foreign address cuando el caso soportado lo permita.

Campos adicionales:

```text
countryCode
provinceRegion
postalCode
addressFormatVersion
```

Casos no soportados deberán dirigirse a review.

---

## 3783. Trade Name / DBA

Si existe un trade name:

```text
legalName
tradeName
```

deberán mantenerse separados.

El EIN record deberá usar cada uno únicamente en el field aplicable.

---

## 3784. Prior EIN Question

El intake deberá preguntar si:

- la entidad ya tuvo EIN;
- el responsible party recuerda un EIN previo relacionado;
- existe EIN para una entidad anterior;
- existe documentación previa.

El sistema deberá evitar duplicar un EIN existente por error.

---

## 3785. Existing EIN Detection

Sources potenciales:

- client confirmation;
- prior SG Solutions case;
- uploaded IRS letter;
- tax records;
- bookkeeping records;
- imported organization data.

Resultado:

```text
no_known_ein
possible_existing_ein
verified_existing_ein
unknown
```

---

## 3786. Existing EIN Gate

Si existe `verified_existing_ein`, el workflow deberá detener una solicitud nueva y cambiar hacia:

```text
record_existing_ein
replacement_confirmation_support
professional_review
```

según el caso.

---

## 3787. Employee Intent

Campos:

```text
expectsEmployees
expectedEmployeeCount
expectedFirstPayrollDate
employeeStates
agriculturalEmployeesFlag
householdEmployeesFlag
unknown
```

El módulo deberá preguntar solo lo necesario para el formulario vigente.

---

## 3788. Employment Tax Context

La información deberá servir para:

- EIN application;
- payroll handoff;
- employer registration handoff.

No deberá crear payroll accounts automáticamente.

---

## 3789. Fiscal / Accounting Context

Campos:

```text
fiscalYearEnd
accountingYearPreference
existingBookkeepingSetup
taxProfessionalReference
```

No deberá crear una elección fiscal material sin workflow separado.

---

## 3790. Excise / Special Tax Screening

La arquitectura deberá permitir screening de preguntas especiales cuando el formulario vigente lo requiera.

Resultado:

```text
not_applicable
client_confirmed_no
client_confirmed_yes
requires_special_review
not_evaluated
```

---

## 3791. Third-Party Designee

El sistema deberá poder registrar si el cliente autoriza a un tercero a interactuar respecto de la solicitud cuando el proceso lo permita.

Campos:

```text
designeeType
designeeName
organization
phone
authorizationScope
authorizationExpiry
status
```

---

## 3792. Third-Party Designee Boundary

Un Third-Party Designee no deberá confundirse automáticamente con:

- responsible party;
- preparer;
- owner;
- manager;
- authorized signer.

Cada rol deberá permanecer separado.

---

## 3793. Application Contact

Campos:

```text
primaryContactPersonId
phone
email
preferredLanguage
preferredContactMethod
timezone
```

---

## 3794. Supporting Documents Checklist

Podrá incluir:

```text
approved_formation_document
state_certificate
operating_agreement
bylaws
ownership_document
responsible_party_id
address_evidence
prior_ein_letter
other_supporting_document
```

No todos deberán ser obligatorios en todos los casos.

---

## 3795. Document Requirement Rule

Cada requirement deberá indicar:

```text
required
conditional
recommended
optional
not_applicable
```

La UI no deberá presentar un optional item como requisito gubernamental.

---

## 3796. SS-4 Application Record

La plataforma deberá mantener un data model estructurado equivalente a los fields necesarios para producir un SS-4 o su data set vigente.

Campos conceptuales:

```text
id
einCaseId
applicationVersion
legalName
tradeName
executorTrusteeCareOf
mailingAddress
streetAddress
countyState
responsibleParty
entityType
reasonForApplying
businessStartDate
closingMonth
employeeInformation
principalActivity
specialQuestions
thirdPartyDesignee
signer
status
createdAt
updatedAt
```

---

## 3797. Form Version Registry

El sistema deberá registrar:

```text
formCode
formVersion
effectiveFrom
effectiveTo
sourceUrl
fieldSchemaVersion
instructionsVersion
status
```

Ejemplo conceptual:

```text
SS-4
```

El formulario vigente deberá verificarse antes de usarlo.

---

## 3798. No Hardcoded Form Forever

Codex no deberá implementar un SS-4 como estructura inmóvil que requiera reescribir el módulo si cambia.

Deberá separarse:

```text
domain data
→ form mapping
→ form version
```

---

## 3799. SS-4 Field Mapping

Cada field deberá mapear:

```text
internalField
formVersion
formField
transformation
validation
sourcePriority
```

---

## 3800. Derived Fields

Campos derivados simples podrán calcularse determinísticamente.

Ejemplo:

```text
sameMailingAddress
displayName
normalizedPhone
```

Pero información legal/material no deberá inventarse mediante derivación.

---

## 3801. Application Draft

El sistema deberá poder generar:

```text
application_data_preview
SS4_draft
client_review_summary
```

antes de authorization.

La preview deberá marcar claramente:

```text
DRAFT
NOT SUBMITTED
```

---

## 3802. Client Review Summary

El cliente deberá revisar en lenguaje simple:

- legal name;
- entity type;
- responsible party;
- addresses;
- reason;
- business start;
- principal activity;
- employee intent;
- designee;
- signer.

No será necesario mostrar únicamente el formulario técnico.

---

## 3803. Data Consistency Engine

Deberá comparar:

```text
Formation Module
vs
Organization Master
vs
EIN Intake
vs
Uploaded Documents
```

y producir findings.

---

## 3804. Consistency Finding Types

```text
legal_name_mismatch
entity_type_mismatch
formation_date_mismatch
address_mismatch
responsible_party_mismatch
ownership_mismatch
management_mismatch
business_activity_mismatch
existing_ein_conflict
document_conflict
```

---

## 3805. EIN Review Finding

Campos:

```text
id
einCaseId
findingType
severity
description
affectedFields
sourceReferences
blocking
assignedTo
status
createdAt
resolvedAt
```

---

## 3806. Review Finding Status

```text
open
under_review
client_action_required
resolved
accepted_with_documented_reason
not_applicable
```

Blocking findings deberán resolverse antes de Ready-to-Submit.

---

## 3807. Human Review

El reviewer deberá validar al menos:

- entity identity;
- responsible party;
- reason for applying;
- addresses;
- existing EIN risk;
- required questions;
- signer;
- form version;
- supporting evidence.

---

## 3808. Review Separation of Duties

Cuando la operación lo requiera, el preparer y reviewer deberán ser distintos.

Roles:

```text
ein_preparer
ein_reviewer
ein_manager
tax_professional
compliance_reviewer
read_only
```

---

## 3809. Signer Record

Campos:

```text
id
einCaseId
personId
signerRole
authorityBasis
signatureMethod
signatureStatus
signedApplicationVersion
signedApplicationHash
signedAt
```

---

## 3810. Signer Authority Validation

La plataforma deberá validar que el signer tenga base de autoridad suficiente según:

- entity type;
- governance data;
- client authorization;
- current application rules.

La IA no deberá asumir authority.

---

## 3811. Client Authorization

La autorización deberá indicar claramente:

- qué servicio se realizará;
- qué datos se enviarán;
- quién realizará la submission;
- government role;
- SG Solutions role;
- partner role cuando exista;
- fees;
- consent;
- expiration/withdrawal when applicable.

---

## 3812. Authorization Record

Campos:

```text
id
einCaseId
applicationVersion
applicationHash
authorizedBy
authorizationType
deliveryModel
feeReference
signedAt
expiresAt
status
createdAt
```

Si cambia materialmente el application data set, la authorization deberá revisarse.

---

## 3813. Ready-to-Submit Package

Contenido:

```text
einCaseId
organizationSnapshotVersion
applicationRecordVersion
formVersion
responsiblePartyRecord
supportingDocumentReferences
reviewRecord
authorizationId
applicationHash
deliveryModel
createdAt
```

El package deberá ser inmutable.

---

## 3814. Ready-to-Submit Gate

Condiciones mínimas:

```text
organization_verified
responsible_party_verified
no_existing_ein_blocker
required_fields_complete
required_documents_complete
form_version_current
review_approved
signer_authority_valid
authorization_valid
no_blocking_findings
```

Resultado:

```text
ready
blocked
warning
```

Solo `ready` podrá entrar a submission.

---

## 3815. Permisos, APIs, Eventos, Pruebas, Criterios e Instrucciones para Codex

### Permisos conceptuales

```text
ein.case.read
ein.case.create
ein.case.manage

ein.intake.read
ein.intake.manage

ein.responsible_party.read
ein.responsible_party.manage
ein.sensitive_identifier.read

ein.application.read
ein.application.prepare
ein.application.review

ein.authorization.read
ein.authorization.manage

ein.ready_to_submit.read
ein.ready_to_submit.approve
```

### APIs conceptuales

```text
POST /api/ein/cases
GET  /api/ein/cases/{id}
POST /api/ein/cases/{id}/intake
POST /api/ein/cases/{id}/responsible-party

POST /api/ein/cases/{id}/applications
GET  /api/ein/applications/{id}
POST /api/ein/applications/{id}/validate
POST /api/ein/applications/{id}/review

POST /api/ein/cases/{id}/authorizations
POST /api/ein/cases/{id}/ready-to-submit-package
GET  /api/ein/cases/{id}/readiness
```

### Eventos

```text
EINCaseCreated
EINIntakeCompleted
EINResponsiblePartyAdded
EINResponsiblePartyVerified
EINExistingNumberConflictDetected
EINApplicationDraftCreated
EINConsistencyFindingCreated
EINApplicationReviewApproved
EINAuthorizationCompleted
EINReadyToSubmitPackageCreated
EINCaseReadyToSubmit
```

### Workflows

```text
EIN Intake Workflow
Responsible Party Verification Workflow
Existing EIN Detection Workflow
SS-4 Preparation Workflow
EIN Consistency Review Workflow
EIN Authorization Workflow
EIN Ready-to-Submit Workflow
```

### Pruebas obligatorias

1. Crear EIN Case desde Formation handoff.
2. Reutilizar approved Organization data.
3. Crear Organization Identity Snapshot.
4. Detectar EIN Case duplicado.
5. Crear Responsible Party.
6. Enmascarar tax identifier.
7. Bloquear missing responsible-party identifier cuando aplique.
8. Detectar responsible-party conflict.
9. Mapear entity type.
10. Registrar tax-classification context.
11. Registrar reason for applying.
12. Separar formation/business-start dates.
13. Registrar principal business activity.
14. Probar AI activity suggestion sin auto-write.
15. Separar principal/mailing/RA addresses.
16. Validar foreign-address handling.
17. Separar legal/trade name.
18. Preguntar prior EIN.
19. Detectar existing EIN.
20. Bloquear nueva aplicación con verified existing EIN.
21. Registrar employee intent.
22. Registrar fiscal/accounting context.
23. Registrar special-tax screening.
24. Registrar Third-Party Designee.
25. Separar designee/responsible party.
26. Crear document checklist.
27. Distinguir required/optional.
28. Crear SS-4 Application Record.
29. Crear Form Version Registry.
30. Mapear domain data a form version.
31. Generar application preview.
32. Marcar preview como DRAFT.
33. Crear client review summary.
34. Ejecutar consistency engine.
35. Detectar legal-name mismatch.
36. Detectar address mismatch.
37. Crear review finding.
38. Resolver finding.
39. Ejecutar human review.
40. Probar separation of duties.
41. Crear Signer Record.
42. Validar signer authority.
43. Crear Client Authorization.
44. Vincular authorization al application hash.
45. Invalidar authorization tras cambio material.
46. Crear Ready-to-Submit Package.
47. Verificar package immutability.
48. Bloquear readiness por form version stale.
49. Bloquear readiness por finding.
50. Aprobar readiness cuando todo cumple.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Service Catalog EIN.
2. Exista EIN Engagement.
3. Exista EIN Case.
4. Exista duplicate-case detection.
5. Exista Organization Identity Snapshot.
6. Se reutilicen datos de Formation.
7. Exista structured intake.
8. Exista Responsible Party Record.
9. Sensitive identifiers estén protegidos.
10. Exista Responsible Party Verification.
11. Existan conflict types.
12. Exista entity-type mapping.
13. Tax classification no sea elegida automáticamente.
14. Exista Reason for Applying.
15. Fechas relevantes estén separadas.
16. Exista principal-activity data.
17. IA solo sugiera activity mapping.
18. Addresses estén separados.
19. Exista foreign-address readiness.
20. Legal y trade name estén separados.
21. Exista prior-EIN screening.
22. Exista existing-EIN gate.
23. Exista employee-intent intake.
24. Exista fiscal/accounting context.
25. Exista special-tax screening.
26. Exista Third-Party Designee.
27. Designee y Responsible Party sean roles distintos.
28. Exista Supporting Documents Checklist.
29. Required/optional estén separados.
30. Exista SS-4 Application Record.
31. Exista Form Version Registry.
32. Form mapping esté desacoplado del dominio.
33. Exista Application Draft.
34. Draft esté claramente marcado.
35. Exista Client Review Summary.
36. Exista Data Consistency Engine.
37. Existan Review Findings.
38. Exista Human Review.
39. Exista separation of duties configurable.
40. Exista Signer Record.
41. Exista Signer Authority Validation.
42. Exista Client Authorization.
43. Authorization esté vinculada al application hash.
44. Exista Ready-to-Submit Package.
45. Package sea inmutable.
46. Exista Ready-to-Submit Gate.
47. No se pueda submit con blockers.
48. Existan permisos.
49. Existan APIs/eventos/workflows.
50. Toda decisión material tenga source/audit.

### Instrucciones para Codex

1. Lee el Módulo 32 antes de implementar el handoff.
2. Reutiliza Organizations y Persons.
3. Reutiliza Documents.
4. Reutiliza Tasks y Approvals.
5. Reutiliza E-Signature.
6. Reutiliza Audit.
7. No copies master data innecesariamente.
8. Implementa EIN Case.
9. Implementa Organization Snapshot.
10. Implementa duplicate EIN detection.
11. Implementa Responsible Party.
12. Tokeniza/encripta identifiers.
13. Implementa conflict handling.
14. Implementa Entity Type Mapping Registry.
15. No selecciones tax elections automáticamente.
16. Implementa Reason for Applying.
17. Mantén fechas separadas.
18. Implementa principal activity.
19. Limita AI a suggestions.
20. Implementa address separation.
21. Implementa prior EIN screening.
22. Bloquea new application si existe EIN verificado.
23. Implementa employee/fiscal/special screening.
24. Implementa Third-Party Designee separado.
25. Implementa document checklist.
26. Implementa SS-4 Application Record.
27. Implementa Form Version Registry.
28. No hardcodees una versión eterna de SS-4.
29. Implementa field mapping.
30. Implementa draft preview.
31. Implementa client review.
32. Implementa consistency engine.
33. Implementa findings.
34. Implementa reviewer workflow.
35. Implementa signer authority.
36. Implementa authorization con hash.
37. Implementa immutable Ready-to-Submit Package.
38. Implementa readiness gate.
39. Implementa permissions/APIs/events/workflows.
40. No marques Parte 1 completa si un case puede llegar a `ready_to_submit` con un blocker material.

---

# Parte 2 — Submission, Authorization Operacional, IRS/Provider Channels, Tracking, Errores, Correcciones, EIN Issuance y Documentos de Confirmación

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 33 — Parte 1  
**Secciones incluidas:** 3816–3880  
**Audiencia:** Owner, Codex, EIN specialists, reviewers, tax preparers, compliance, operations, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Submission controlado desde un Ready-to-Submit Package inmutable, con canales desacoplados, idempotencia, trazabilidad de respuesta, manejo de errores y verificación documental del EIN antes de activar downstream systems

## 3816. Objetivo de Parte 2

Esta parte define cómo un EIN Case pasa desde:

```text
ready_to_submit
```

hacia:

```text
submitted
→ processing
→ issued
```

o, cuando corresponda:

```text
submitted
→ additional_information_required
→ corrected
→ resubmitted
```

También cubre:

- submission channels;
- operational authorization;
- provider adapters;
- idempotency;
- response tracking;
- manual/assisted paths;
- errors;
- corrections;
- duplicate-risk protection;
- EIN issuance;
- confirmation documents;
- CP 575 / replacement-confirmation support;
- final verification.

## 3817. Principio central de submission

```text
Ready-to-Submit Package
→ freshness validation
→ authorization validation
→ controlled channel
→ submission
→ receipt/reference
→ status tracking
→ IRS/provider response
→ issued or corrective workflow
→ verified EIN record
```

Nunca:

```text
editable intake
→ direct submission
```

## 3818. Submission Record

Campos:

```text
id
einCaseId
readyToSubmitPackageId
submissionMode
providerId
partnerId
idempotencyKey
status
submittedBy
submittedAt
externalReference
responseReference
createdAt
updatedAt
```

Cada intento deberá conservarse como registro independiente.

## 3819. Submission Status

```text
draft
queued
pre_submit_validation
ready
submitting
submitted
processing
additional_information_required
correction_required
ready_to_resubmit
resubmitting
issued
failed
cancelled
unknown
```

## 3820. Submission Modes

Modos conceptuales:

```text
official_online_channel
provider_api
partner_managed
authorized_staff_assisted
client_self_submit_assisted
mail_or_fax_future
manual_other_supported
```

El sistema deberá declarar claramente cuál está disponible para cada case.

## 3821. Channel Registry

Campos:

```text
id
channelCode
channelType
supportedApplicantTypes
supportedCountries
supportsImmediateIssuance
supportsStatusLookup
supportsAttachments
supportsThirdPartyDesignee
requiresManualInteraction
status
effectiveFrom
effectiveTo
```

## 3822. Channel Capability Matrix

Cada channel deberá declarar:

```text
prepareSubmission
submit
getStatus
receiveImmediateResult
receiveErrorCode
downloadConfirmation
supportCorrection
supportResubmission
supportThirdPartyDesignee
```

No deberán asumirse capacidades universales.

## 3823. Provider Adapter Contract

Cada adapter deberá implementar, cuando corresponda:

```text
validatePackage()
preparePayload()
submit()
getStatus()
normalizeResponse()
retrieveConfirmation()
handleCorrection()
cancelIfSupported()
```

La lógica de dominio no deberá depender de un provider específico.

## 3824. Pre-Submit Revalidation

Antes de enviar deberá confirmarse:

- Ready-to-Submit Package vigente;
- application version vigente;
- form mapping vigente;
- responsible party verificado;
- signer authority vigente;
- authorization vigente;
- no existing-EIN blocker;
- no unresolved blocking finding;
- delivery model vigente;
- provider/channel disponible.

Resultado:

```text
pass
warning
blocked
```

## 3825. Package Hash Validation

El sistema deberá verificar:

```text
currentApplicationHash
==
authorizedApplicationHash
==
readyToSubmitPackage.applicationHash
```

Si no coinciden, el submission deberá bloquearse.

## 3826. Operational Authorization

Además de la autorización del cliente, la ejecución deberá comprobar:

```text
userPermission
caseAssignment
submissionScope
providerPermission
reauthenticationIfRequired
```

Una autorización del cliente no sustituye controles internos de acceso.

## 3827. Submission Idempotency

La clave podrá derivarse conceptualmente de:

```text
hash(
  einCaseId
  + readyToSubmitPackageId
  + applicationHash
  + submissionMode
)
```

Un retry no deberá crear solicitudes duplicadas.

## 3828. Submission Lock

Cuando el status sea:

```text
submitting
submitted
processing
```

el package enviado deberá permanecer inmutable.

Cambios requeridos deberán generar una nueva version/application package.

## 3829. External Reference

Cuando el channel devuelva referencia, deberá almacenarse:

```text
externalReference
providerReference
submissionTimestamp
responseCode
responseHash
```

## 3830. Submission Receipt

Podrá incluir:

- confirmation page;
- provider receipt;
- transmission confirmation;
- partner acknowledgment;
- timestamp evidence.

La ausencia de un receipt no deberá interpretarse automáticamente como fracaso.

## 3831. Submission Timeline

Eventos:

```text
ready_to_submit
pre_submit_validated
submitting
submitted
response_received
processing
additional_information_required
issued_or_failed
final_verification
```

Cada evento deberá conservar actor/source.

## 3832. Immediate Response Handling

Cuando un channel produzca respuesta inmediata, deberá clasificarse como:

```text
issued
rejected
additional_information_required
technical_failure
unknown
```

El valor original deberá conservarse.

## 3833. Response Normalization

Campos:

```text
externalStatusRaw
externalCode
normalizedStatus
messageRaw
mappingVersion
receivedAt
```

No deberá perderse el mensaje original.

## 3834. Technical Failure

Ejemplos:

```text
timeout
network_error
provider_unavailable
session_expired
validation_transport_error
unknown_provider_failure
```

Un fallo técnico no deberá implicar automáticamente que la solicitud no fue recibida.

## 3835. Unknown Submission Outcome

Si ocurre un error después de enviar datos y no puede saberse si fueron recibidos:

```text
unknown_submission_outcome
```

deberá bloquearse un retry automático hasta verificar el estado.

## 3836. Duplicate Application Protection

Antes de resubmission/retry deberá verificarse:

- external reference;
- provider logs;
- response history;
- issued EIN evidence;
- prior EIN records;
- case timeline.

## 3837. Additional Information Request

Campos:

```text
id
submissionId
requestType
externalReason
requestedFields
requestedDocuments
receivedAt
responseDeadline
status
createdAt
```

## 3838. Additional Information Status

```text
open
client_action_required
staff_review
ready_to_respond
responded
resolved
expired
```

## 3839. Client Follow-Up Request

La UI deberá explicar exactamente qué dato/documento se requiere.

Ejemplo:

```text
"Necesitamos confirmar la dirección del Responsible Party antes de continuar."
```

No deberá usar mensajes genéricos si se conoce el motivo concreto.

## 3840. Correction Record

Campos:

```text
id
einCaseId
submissionId
affectedFields
oldValuesHash
newValuesHash
reason
sourceReferences
requiresNewAuthorization
requiresNewSignature
status
createdAt
```

## 3841. Material Correction

Cambios materiales incluyen potencialmente:

- legal name;
- entity type;
- responsible party;
- tax identifier;
- reason for applying;
- business start date;
- principal address;
- signer;
- key special-tax responses.

Deberán activar review adicional.

## 3842. Non-Material Correction

Ejemplos potenciales:

- formatting;
- normalized phone;
- punctuation;
- non-substantive display cleanup.

La policy deberá determinar cuáles no requieren nueva autorización.

## 3843. New Authorization After Correction

Si cambia materialmente el application data set:

```text
old authorization
→ superseded
new application hash
→ new client review
→ new authorization
```

## 3844. Resubmission Record

Un resubmission deberá crear un nuevo Submission Record con:

```text
previousSubmissionId
correctionRecordId
resubmissionSequence
```

No deberá sobrescribirse el intento anterior.

## 3845. Submission Chain

Ejemplo:

```text
Submission #1
→ Additional Info
→ Correction #1
→ Submission #2
→ Technical Verification
→ Issued
```

La cadena completa deberá ser visible.

## 3846. Failure Taxonomy

```text
technical_failure
eligibility_failure
data_mismatch
responsible_party_issue
existing_ein_conflict
authorization_issue
identity_issue
provider_issue
unknown
```

## 3847. Failure Review

Todo failure material deberá determinar:

```text
retry_allowed
correction_required
client_action_required
professional_review_required
provider_escalation_required
stop_case
```

## 3848. Provider Escalation

Campos:

```text
id
submissionId
providerId
issueType
severity
openedAt
externalTicketReference
status
resolution
resolvedAt
```

## 3849. No Silent EIN Replacement

Si aparece un EIN diferente al esperado o potencialmente vinculado a otra entidad:

- no activar;
- crear discrepancy;
- verificar legal name;
- verificar responsible party;
- verificar official evidence;
- escalate.

## 3850. EIN Issuance Record

Campos:

```text
id
einCaseId
submissionId
organizationId
einToken
maskedEin
issuedDate
effectiveDateIfApplicable
issuer
sourceType
sourceDocumentIds
verifiedAt
verifiedBy
status
createdAt
```

## 3851. EIN Storage

El EIN completo deberá:

- tokenizarse;
- cifrarse;
- enmascararse por defecto;
- excluirse de logs;
- excluirse de analytics no autorizados;
- restringirse por field-level permission.

## 3852. EIN Verification

Antes de marcar `issued` deberá comprobarse, cuando sea posible:

- legal name;
- EIN;
- entity identity;
- source;
- issue/confirmation date;
- source document;
- case match.

## 3853. EIN Discrepancy

Tipos:

```text
legal_name_mismatch
entity_mismatch
responsible_party_mismatch
duplicate_ein_record
document_mismatch
source_uncertain
```

Un discrepancy bloqueará downstream sensible.

## 3854. Official Confirmation Document

Tipos conceptuales:

```text
cp_575
online_ein_confirmation
official_ein_assignment_notice
provider_confirmed_official_document
other_verified_irs_document
```

El tipo real dependerá del channel y respuesta disponible.

## 3855. CP 575 Record

Campos:

```text
documentId
einCaseId
organizationId
documentType
receivedAt
source
documentHash
verificationStatus
```

El sistema no deberá fabricar una CP 575.

## 3856. Replacement Confirmation Support

Cuando el cliente necesita confirmar un EIN ya emitido y no dispone del documento original, el service workflow podrá derivar a:

```text
ein_replacement_confirmation_support
```

El módulo deberá separar este servicio de una nueva EIN application.

## 3857. 147C Support Record

La plataforma deberá estar preparada para administrar evidencia de una carta de confirmación/replacement obtenida por el canal correspondiente.

Campos:

```text
documentId
organizationId
einCaseId
requestReference
receivedAt
verificationStatus
```

No deberá afirmar que siempre se obtiene por un método único; el proceso deberá verificarse según reglas vigentes.

## 3858. Existing EIN Import

Cuando el cliente ya tenga EIN:

```text
collect official evidence
→ verify
→ create EIN Issuance Record
→ mark source = imported_existing
→ skip new application
```

## 3859. Imported EIN Confidence

Estados:

```text
unverified_client_reported
document_supported
verified
conflict
```

Solo `verified` deberá activar downstream sensible automáticamente.

## 3860. Organization Master Update

Tras verificación deberá actualizarse el Organization master mediante referencia segura:

```text
organization.einReference = EINIssuanceRecord.id
```

No se deberá copiar el EIN completo en múltiples tablas.

## 3861. EIN Case Completion Gate

Condiciones:

```text
ein_issued_or_existing_verified
ein_document_verified
organization_linked
no_blocking_discrepancy
final_package_ready
required_handoffs_created
```

## 3862. Final EIN Package

Podrá incluir:

- EIN summary;
- official confirmation document;
- application copy when appropriate;
- authorization record;
- client-facing instructions;
- downstream next steps.

Datos sensibles deberán enmascararse cuando no sea necesario mostrarlos completos.

## 3863. Client Portal Display

El cliente deberá ver:

```text
EIN Status
Issued / Pending / Action Required
Masked EIN
Official Document
Next Steps
```

El full EIN deberá requerir control adicional si la policy lo establece.

## 3864. Client Download Security

Descargas sensibles deberán registrar:

```text
userId
documentId
purpose
timestamp
ipOrDeviceMetadataWhenPermitted
```

Podrá requerirse reauthentication.

## 3865. EIN Notification

Cuando se emita/verifique:

- notificar al cliente;
- indicar que el documento está disponible;
- indicar next steps;
- evitar incluir EIN completo en email/SMS no seguro.

## 3866. Post-Issuance Correction Awareness

Si el cliente reporta que información del EIN record/documento requiere corrección:

```text
correction_support_case
```

No deberá editarse el documento oficial dentro de SG Solutions.

## 3867. Name Change after EIN

Un cambio posterior del legal name deberá:

- registrarse en Organization governance/compliance;
- evaluar IRS update requirements vigentes;
- no alterar retroactivamente el original issuance record;
- crear new documentation workflow si aplica.

## 3868. Address Change after EIN

El módulo deberá crear un update-support handoff cuando la dirección cambie y sea necesario actualizar registros tributarios.

La regla exacta deberá provenir de requisitos vigentes.

## 3869. Responsible Party Change Awareness

Si cambia el Responsible Party después de issuance:

- conservar original;
- registrar new responsible-party state;
- evaluar update requirement;
- crear compliance/tax task si aplica.

## 3870. Permissions de Submission e Issuance

```text
ein.submission.read
ein.submission.create
ein.submission.execute
ein.submission.retry
ein.submission.status.manage

ein.correction.read
ein.correction.manage
ein.resubmission.execute

ein.issuance.read
ein.issuance.verify
ein.sensitive_identifier.read
ein.confirmation_document.read
ein.confirmation_document.manage
```

## 3871. APIs de Submission

```text
POST /api/ein/cases/{id}/submissions
GET  /api/ein/submissions/{id}
POST /api/ein/submissions/{id}/execute
POST /api/ein/submissions/{id}/refresh-status

POST /api/ein/submissions/{id}/additional-information
POST /api/ein/submissions/{id}/corrections
POST /api/ein/submissions/{id}/resubmit
```

## 3872. APIs de Issuance

```text
POST /api/ein/cases/{id}/issuance-records
POST /api/ein/issuance-records/{id}/verify

GET  /api/ein/cases/{id}/confirmation-documents
POST /api/ein/cases/{id}/existing-ein-import
POST /api/ein/cases/{id}/final-package
```

## 3873. Eventos de Submission

```text
EINSubmissionCreated
EINPreSubmitValidated
EINSubmissionStarted
EINSubmissionSent
EINSubmissionResponseReceived
EINSubmissionOutcomeUnknown
EINAdditionalInformationRequested
EINCorrectionCreated
EINResubmissionCreated
EINSubmissionFailed
```

## 3874. Eventos de Issuance

```text
EINIssued
EINIssuanceRecordCreated
EINVerificationCompleted
EINDiscrepancyDetected
EINConfirmationDocumentReceived
EINExistingNumberImported
EINFinalPackageCreated
EINCaseCompleted
```

## 3875. Workflows

```text
EIN Submission Workflow
EIN Unknown Outcome Verification Workflow
EIN Additional Information Workflow
EIN Correction Workflow
EIN Resubmission Workflow
EIN Provider Escalation Workflow
EIN Issuance Verification Workflow
EIN Existing Number Import Workflow
EIN Final Package Workflow
```

## 3876. Pruebas de Submission

Pruebas obligatorias:

1. Crear submission desde Ready-to-Submit.
2. Bloquear submission sin readiness.
3. Seleccionar channel.
4. Validar adapter capability.
5. Ejecutar pre-submit revalidation.
6. Bloquear hash mismatch.
7. Validar operational authorization.
8. Crear idempotency key.
9. Reintentar sin duplicar.
10. Bloquear edición durante processing.
11. Registrar external reference.
12. Guardar receipt.
13. Crear timeline.
14. Normalizar immediate response.
15. Conservar raw response.
16. Simular technical failure.
17. Crear unknown outcome.
18. Bloquear retry automático con unknown outcome.
19. Ejecutar duplicate protection.
20. Crear additional-information request.

## 3877. Pruebas de Correction y Resubmission

21. Crear client follow-up específico.
22. Crear Correction Record.
23. Detectar material correction.
24. Detectar non-material correction.
25. Invalidar authorization tras material change.
26. Crear new application hash.
27. Crear nuevo resubmission record.
28. Vincular previousSubmissionId.
29. Conservar submission chain.
30. Clasificar failure.
31. Crear Failure Review.
32. Crear provider escalation.
33. Bloquear silent EIN replacement.

## 3878. Pruebas de Issuance y Documents

34. Crear EIN Issuance Record.
35. Enmascarar EIN.
36. Restringir full EIN por permission.
37. Verificar EIN contra source document.
38. Detectar legal-name mismatch.
39. Crear discrepancy.
40. Ingerir CP 575/official confirmation.
41. Bloquear fabricated confirmation.
42. Crear replacement-confirmation support case.
43. Registrar 147C support document cuando exista.
44. Importar existing EIN.
45. Diferenciar client-reported de verified.
46. Actualizar Organization mediante reference.
47. Crear Final EIN Package.
48. Mostrar masked EIN al cliente.
49. Registrar sensitive download.
50. Enviar notification sin full EIN.
51. Crear post-issuance correction support.
52. Conservar original issuance tras name change.
53. Crear address-change handoff.
54. Crear responsible-party-change handoff.
55. Probar audit completo.

## 3879. Criterios de Aceptación de Parte 2

La Parte 2 estará completa cuando:

1. Exista Submission Record.
2. Exista Submission Status.
3. Existan múltiples modes.
4. Exista Channel Registry.
5. Exista Capability Matrix.
6. Exista Provider Adapter Contract.
7. Exista pre-submit revalidation.
8. Se valide application hash.
9. Exista operational authorization.
10. Exista idempotency.
11. Exista submission lock.
12. Exista external reference.
13. Existan receipts.
14. Exista timeline.
15. Exista response normalization.
16. Se conserve raw response.
17. Exista technical-failure handling.
18. Exista unknown-outcome handling.
19. Exista duplicate protection.
20. Exista Additional Information Request.
21. Exista client follow-up.
22. Exista Correction Record.
23. Material y non-material estén separados.
24. Material correction pueda invalidar authorization.
25. Resubmission cree nuevo intento.
26. Exista submission chain.
27. Exista Failure Taxonomy.
28. Exista Provider Escalation.
29. No exista silent EIN replacement.
30. Exista EIN Issuance Record.
31. EIN completo esté protegido.
32. Exista EIN Verification.
33. Exista discrepancy handling.
34. Existan official confirmation-document types.
35. Exista CP 575 record support.
36. Exista replacement-confirmation support.
37. Exista 147C support.
38. Exista Existing EIN Import.
39. Exista confidence status para imported EIN.
40. Organization se actualice por reference.
41. Exista completion gate.
42. Exista Final EIN Package.
43. Exista secure client display.
44. Exista secure download logging.
45. Notifications no expongan full EIN.
46. Exista post-issuance correction awareness.
47. Name/address/responsible-party changes no sobrescriban issuance history.
48. Existan permisos.
49. Existan APIs/eventos/workflows.
50. Toda emisión pueda rastrearse a source.

## 3880. Instrucciones para Codex y Cierre de Parte 2

Antes de implementar:

1. Lee Parte 1 completa.
2. Reutiliza Ready-to-Submit Package.
3. Reutiliza Authorization.
4. Reutiliza Provider Registry.
5. Reutiliza Integration Registry.
6. Reutiliza Documents.
7. Reutiliza Notifications.
8. Reutiliza Audit.
9. Implementa Submission Record versionado.
10. Implementa Channel Registry.
11. Implementa Provider Adapters.
12. No acoples el dominio a un channel concreto.
13. Implementa pre-submit revalidation.
14. Implementa hash validation.
15. Implementa operational authorization.
16. Implementa submission idempotency.
17. Implementa submission lock.
18. Implementa external references/receipts.
19. Implementa immutable timeline.
20. Implementa response normalization conservando raw response.
21. Implementa technical failure handling.
22. Implementa unknown outcome workflow.
23. No hagas blind retries.
24. Implementa duplicate application protection.
25. Implementa Additional Information Requests.
26. Implementa Correction Records.
27. Separa material/non-material.
28. Refresca authorization cuando corresponda.
29. Implementa resubmission como nuevo intento.
30. Conserva submission chain.
31. Implementa Failure Taxonomy.
32. Implementa Provider Escalation.
33. Bloquea EIN mismatch.
34. Implementa EIN Issuance Record.
35. Tokeniza/encripta EIN.
36. Implementa field-level permissions.
37. Implementa EIN Verification.
38. Implementa discrepancy handling.
39. Implementa official confirmation docs.
40. Nunca fabriques CP 575/147C.
41. Implementa replacement-confirmation support.
42. Implementa Existing EIN Import.
43. Distingue reported vs verified.
44. Actualiza Organization por reference.
45. Implementa Final EIN Package.
46. Implementa secure portal display.
47. Implementa download audit.
48. Nunca incluyas full EIN en mensajes inseguros.
49. Conserva issuance history tras cambios futuros.
50. Implementa permissions/APIs/events/workflows.
51. No marques Parte 2 completa si un EIN puede activarse sin evidencia verificable.

### Verificación final

- ¿Solo puede submitirse el package exacto autorizado?
- ¿Un retry evita duplicados?
- ¿Unknown outcome bloquea blind resubmission?
- ¿Los errores externos conservan su texto original?
- ¿Material corrections generan nueva revisión/autorización cuando corresponde?
- ¿Cada resubmission es un nuevo record?
- ¿El EIN completo está tokenizado/enmascarado?
- ¿La emisión requiere evidencia verificable?
- ¿Un mismatch bloquea downstream?
- ¿Los documentos oficiales nunca se fabrican?
- ¿Existing EIN evita nueva solicitud?
- ¿Organization referencia un único issuance record?
- ¿El portal muestra el dato de forma segura?
- ¿Toda acción queda auditada?

---

# Parte 3 — Document Vault, Post-EIN Handoffs, Integrations, Security, Administration, Analytics, Migration, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 33 — Parte 2  
**Secciones incluidas:** 3881–3945  
**Audiencia:** Owner, Codex, EIN specialists, tax preparers, formation specialists, bookkeepers, compliance, security, operations, administrators, partner managers y Data Analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** EIN y documentos empresariales administrados como records sensibles, versionados y trazables, con handoffs idempotentes a módulos downstream, integraciones desacopladas, mínimo privilegio, continuidad operacional y cierre verificable

## 3881. Objetivo de Parte 3

Esta parte cierra el Módulo 33 definiendo:

- secure document vault;
- EIN record retention;
- document classification;
- post-EIN workflows;
- downstream handoffs;
- banking readiness;
- bookkeeping integration;
- tax integration;
- compliance integration;
- funding readiness;
- partner/provider integration;
- automation;
- AI boundaries;
- security;
- admin console;
- work queues;
- SLAs;
- analytics;
- migration;
- portability;
- business continuity;
- E2E tests;
- final acceptance.

## 3882. Principio central post-EIN

```text
Verified EIN
→ secure record
→ official document vault
→ organization linkage
→ downstream readiness
→ module handoffs
→ monitoring
→ audit + analytics
```

Nunca:

```text
client says EIN = X
→ copy everywhere
→ trust forever
```

## 3883. EIN Document Vault

Cada Organization deberá poder acceder a una vista lógica de documentos relacionados con EIN.

Categorías:

```text
application
authorization
submission_receipt
irs_confirmation
replacement_confirmation
supporting_identity
supporting_formation
correction
other
```

El vault deberá referenciar documentos del sistema central, no duplicarlos innecesariamente.

## 3884. EIN Document Index

Campos:

```text
id
organizationId
einCaseId
documentId
documentType
documentVersion
source
verificationStatus
sensitivityLevel
effectiveDate
addedAt
addedBy
```

## 3885. Document Verification Status

```text
unverified
client_provided
source_verified
official_verified
conflict
superseded
```

Solo documentos `official_verified` o `source_verified` según policy podrán activar acciones sensibles automáticamente.

## 3886. Document Sensitivity Levels

```text
standard_business
sensitive_business
restricted_tax_identifier
identity_restricted
highly_restricted
```

El acceso deberá depender de role, purpose y field/document policy.

## 3887. Official EIN Document Classification

Tipos conceptuales:

```text
cp_575
official_online_confirmation
147c_or_replacement_confirmation
irs_notice_other
provider_verified_official_confirmation
```

La clasificación deberá conservar el document source real.

## 3888. Document Hash Integrity

Cada documento final deberá conservar:

```text
sha256Hash
fileSize
pageCountWhenAvailable
mimeType
receivedAt
source
```

Cambios al archivo deberán generar una nueva versión o incident.

## 3889. Document Immutability

Un documento oficial verificado no deberá editarse dentro del sistema.

Correcciones deberán gestionarse mediante:

```text
new official document
new support case
new version reference
```

## 3890. Document Retention

Retention deberá aplicar por:

- application data;
- authorization;
- official confirmation;
- identity evidence;
- audit;
- partner records;
- correction cases.

Legal Hold deberá impedir purga cuando aplique.

## 3891. Organization EIN Reference

El Organization master deberá contener solo una referencia segura:

```text
einIssuanceRecordId
```

No deberán existir múltiples copias del EIN completo distribuidas por el sistema.

## 3892. EIN Read Model

Para interfaces autorizadas podrá exponerse:

```text
maskedEin
verificationStatus
issuedDate
sourceDocumentType
lastVerifiedAt
```

El full EIN solo deberá resolverse bajo permiso específico.

## 3893. Post-EIN Workspace

La vista posterior a emisión deberá mostrar:

```text
EIN Issued
Official Confirmation
Banking Readiness
Bookkeeping
Tax Setup
Compliance
Payroll/Employer Setup
Funding
Other Next Steps
```

Cada item deberá indicar:

```text
completed
in_progress
action_required
optional
not_applicable
not_included
```

## 3894. Post-EIN Plan

Campos:

```text
id
organizationId
einCaseId
einIssuanceRecordId
requiredActions
optionalActions
handoffs
clientTasks
internalTasks
status
createdAt
completedAt
```

## 3895. Banking Handoff

El Módulo 33 deberá poder actualizar el Banking Readiness iniciado en Módulo 32.

Payload:

```text
organizationId
approvedLegalName
entityType
stateEntityIdentifier
einIssuanceRecordId
maskedEin
officialConfirmationDocumentId
ownershipSnapshotReference
authorizedSignerReferences
```

No deberá enviarse full EIN a un partner sin purpose y consent.

## 3896. Banking Readiness Update

Estados:

```text
missing_ein
ein_verified
documents_ready
bank_selected
application_in_progress
opened
declined_or_unavailable
```

La emisión del EIN podrá resolver únicamente el blocker `missing_ein`.

## 3897. Bookkeeping Handoff

Al Módulo 31 deberá enviarse:

```text
organizationId
einIssuanceRecordId
maskedEin
verificationStatus
formationDate
entityType
bookStartDateIfKnown
sourceDocumentReferences
```

El bookkeeping no necesita almacenar el full EIN para la mayoría de operaciones.

## 3898. Tax Handoff

Al Módulo 30 deberá enviarse:

```text
organizationId
einIssuanceRecordId
maskedEin
verificationStatus
entityType
responsiblePartyReference
formationDate
businessStartDate
sourceDocumentReferences
```

Tax podrá resolver el full EIN únicamente bajo permisos apropiados.

## 3899. Compliance Handoff

Al Módulo 34 deberá enviarse:

```text
organizationId
einIssuanceRecordId
issuedDate
verificationStatus
responsiblePartyReference
knownPostEINUpdateNeeds
sourceDocuments
```

Esto permitirá futuras obligaciones relacionadas con cambios de address/responsible party cuando sean aplicables.

## 3900. Payroll / Employer Handoff

Si el intake indicó employees:

```text
organizationId
einIssuanceRecordId
plannedFirstPayrollDate
employeeStates
expectedEmployeeCount
taxSetupStatus
```

El handoff deberá crear un case/task downstream, no registrar payroll automáticamente.

## 3901. Funding Handoff

Al Módulo 35 podrá enviarse:

```text
organizationId
formationDate
einVerificationStatus
bankingStatus
bookkeepingStatus
businessActivity
requestedFundingPurpose
```

Un EIN emitido no deberá interpretarse como fundability ni approval.

## 3902. Marketplace Handoff

Cuando un producto/partner requiera EIN, el Marketplace podrá solicitar:

```text
ein_verified = true
```

y solo recibir el dato completo si:

- es necesario;
- existe consent;
- el partner está autorizado;
- existe secure transfer channel.

## 3903. Cross-Module Handoff Record

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

## 3904. Handoff Idempotency

Ejemplo:

```text
EINIssued
→ one bookkeeping handoff
→ one tax handoff
→ one compliance handoff
```

Retries deberán reutilizar el handoff existente.

## 3905. Handoff Status

```text
draft
ready
sent
received
accepted
questions_returned
rejected
completed
cancelled
superseded
```

## 3906. Handoff Questions

El destination module deberá poder devolver:

- missing document;
- mismatch;
- stale data;
- permission issue;
- client clarification.

La respuesta deberá conservarse en el mismo handoff record.

## 3907. Integration Registry

El módulo deberá reutilizar:

- Provider Registry;
- Partner Registry;
- Integration Registry;
- Secret Management;
- Webhook Inbox;
- Outbox.

No deberán construirse conexiones ad hoc.

## 3908. EIN Provider Types

```text
filing_provider
tax_service_provider
identity_verification_provider
document_provider
signature_provider
secure_delivery_provider
other
```

## 3909. Provider Capability Matrix

Campos conceptuales:

```text
prepareApplication
submitApplication
statusLookup
immediateIssuance
correctionSupport
replacementConfirmationSupport
documentRetrieval
webhooks
API
manualPortal
```

## 3910. Provider Connection Security

Las integraciones deberán:

- usar credentials centralizados;
- rotar secrets;
- limitar scopes;
- registrar access;
- soportar revocation;
- no exponer secrets en logs.

## 3911. Webhook Handling

Webhooks deberán:

```text
authenticate
→ deduplicate
→ persist raw event
→ normalize
→ process idempotently
→ audit
```

Eventos desconocidos deberán ir a review.

## 3912. Polling Fallback

Cuando no haya webhook:

- scheduled polling;
- rate limits;
- exponential backoff;
- status cursor;
- failure threshold;
- escalation.

## 3913. Automation Engine

Podrá automatizar:

- case routing;
- reminders;
- document indexing;
- masked read-model updates;
- handoff creation;
- status refresh;
- SLA alerts;
- dashboard refresh;
- duplicate detection;
- post-EIN next-step cards.

## 3914. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 3915. Low-Risk EIN Automation

Ejemplos:

- create reminder;
- attach verified receipt;
- update masked status;
- route work queue;
- create deterministic handoff;
- flag missing document.

## 3916. High-Risk EIN Automation

Requieren human/authorization gate:

- submit/resubmit;
- reveal full EIN;
- send full EIN externally;
- change Responsible Party record;
- mark official document verified;
- resolve identity mismatch;
- override existing-EIN blocker.

## 3917. Prohibited EIN Automation

No deberá:

- fabricate EIN;
- fabricate CP 575/147C;
- alter official document;
- send EIN to arbitrary destination;
- bypass authorization;
- reuse signer identity;
- hide error response;
- mark client-reported EIN as verified without evidence.

## 3918. AI Assistant Scope

La IA podrá:

- summarize case;
- explain status;
- draft client questions;
- compare documents;
- suggest next steps;
- summarize errors;
- flag potential mismatches.

## 3919. AI Grounding

Para current IRS procedures/forms/instructions, la IA deberá utilizar:

```text
current verified requirement/configuration
```

No deberá basarse solamente en memoria de entrenamiento.

## 3920. AI Sensitive Data Boundary

La IA no deberá recibir full EIN o identity data salvo que:

- sea estrictamente necesario;
- el approved tool preserve seguridad;
- exista purpose;
- el workflow esté permitido.

Cuando sea posible deberá utilizar masked/tokenized data.

## 3921. Administration Console

Secciones:

```text
Overview
EIN Cases
Ready to Submit
Submitted
Additional Information
Issued
Existing EIN Imports
Documents
Handoffs
Providers
Work Queues
SLAs
Analytics
Security
Configuration
```

## 3922. EIN Operations Dashboard

Deberá mostrar:

- active cases;
- intake backlog;
- responsible-party blockers;
- ready-to-submit;
- submitted;
- unknown outcomes;
- additional-information cases;
- issuance count;
- document-verification backlog;
- handoff backlog;
- provider incidents;
- SLA risk.

## 3923. Work Queues

```text
intake_review
responsible_party_review
existing_ein_review
application_review
authorization_pending
ready_to_submit
unknown_outcome_review
additional_information
correction_review
issuance_verification
document_verification
handoff_review
provider_escalation
```

## 3924. Assignment Engine

Podrá considerar:

- service type;
- case complexity;
- language;
- staff permission;
- reviewer skill;
- workload;
- sensitive-data access;
- SLA deadline.

## 3925. SLA Tracking

Métricas operacionales:

```text
intake_review_sla
responsible_party_review_sla
application_review_sla
submission_sla
unknown_outcome_resolution_sla
additional_information_response_sla
issuance_verification_sla
final_package_sla
```

Tiempo bloqueado por cliente/provider deberá separarse cuando sea posible.

## 3926. Security Model

Aplicar:

- MFA;
- RBAC;
- ABAC;
- resource-level access;
- field-level access;
- purpose-based access;
- least privilege;
- reauthentication;
- immutable audit.

## 3927. Sensitive Fields

Campos de protección reforzada:

```text
fullEIN
responsiblePartyTaxIdentifier
governmentIdentityDocument
signatureEvidence
restrictedIRSConfirmation
providerCredentials
```

## 3928. Full EIN Reveal

Acceso al EIN completo deberá:

```text
check permission
→ verify purpose
→ reauthenticate when policy requires
→ reveal temporarily
→ audit reveal event
```

La UI deberá volver a masked state al salir del contexto.

## 3929. Export Governance

Exports que incluyan EIN deberán registrar:

```text
requestedBy
purpose
destination
dataScope
maskingPolicy
generatedAt
expiresAt
downloadEvents
```

Bulk export deberá requerir elevated permission.

## 3930. Security Incident Types

```text
ein_exposure
responsible_party_identifier_exposure
unauthorized_export
cross_client_access
official_document_tampering
signature_misuse
provider_credential_compromise
unauthorized_external_sharing
```

## 3931. Security Incident Response

Workflow:

```text
detect
→ contain
→ preserve evidence
→ revoke access if needed
→ assess affected records
→ notify internal security/compliance
→ remediation
→ post-incident review
```

## 3932. Audit Trail

Deberá incluir:

- intake changes;
- responsible-party changes;
- document access;
- application versions;
- authorizations;
- submissions;
- retries;
- provider responses;
- corrections;
- issuance verification;
- full-EIN reveals;
- exports;
- handoffs;
- admin overrides.

## 3933. Observability

Métricas técnicas:

```text
submission_failure_rate
unknown_outcome_rate
provider_latency
webhook_failure_rate
document_ingestion_failure_rate
verification_queue_latency
handoff_failure_rate
sensitive_access_error_rate
```

## 3934. Alerts

Alertas:

- Ready-to-Submit aging;
- unknown outcome unresolved;
- additional-information deadline;
- provider degraded;
- duplicate-EIN risk;
- document mismatch;
- verification backlog;
- handoff failure;
- suspicious sensitive export;
- repeated full-EIN reveals.

## 3935. Analytics Dashboards

```text
EIN Executive Dashboard
EIN Operations Dashboard
Submission Quality Dashboard
Issuance Dashboard
Existing EIN Dashboard
Provider Performance Dashboard
Document Verification Dashboard
Post-EIN Conversion Dashboard
Security Access Dashboard
```

## 3936. Core KPIs

```text
ein_cases_started
ein_cases_completed
ready_to_submit_rate
submission_success_rate
issuance_rate
additional_information_rate
correction_rate
unknown_outcome_rate
average_time_to_ready
average_time_to_submit
average_time_to_verified_issuance
```

## 3937. Quality KPIs

```text
duplicate_application_prevented_count
existing_ein_detection_rate
responsible_party_correction_rate
document_mismatch_rate
authorization_refresh_rate
resubmission_rate
issuance_discrepancy_rate
verification_error_rate
```

## 3938. Provider KPIs

```text
provider_success_rate
provider_error_rate
provider_latency
provider_unknown_outcome_rate
provider_document_delivery_time
provider_escalation_rate
```

## 3939. Post-EIN Business KPIs

Podrá medirse:

```text
banking_handoff_rate
bookkeeping_handoff_rate
tax_handoff_rate
compliance_handoff_rate
funding_handoff_rate
post_ein_service_attach_rate
```

Un handoff no deberá contarse como conversión final hasta que el destino lo acepte según definición KPI.

## 3940. Data Portability

El cliente podrá obtener, dentro del scope permitido:

- EIN summary;
- masked EIN;
- official confirmation document;
- application copy when appropriate;
- submission timeline;
- correction history;
- final package.

El full EIN deberá seguir reglas de secure reveal/export.

## 3941. Migration Into Module 33

Para EINs gestionados fuera de SG Solutions:

```text
collect client data
→ search existing internal records
→ collect official evidence
→ verify
→ create imported issuance record
→ link organization
→ create document index
→ generate downstream readiness
```

No deberán inventarse submissions históricos.

## 3942. Migration Record

Campos:

```text
id
organizationId
sourceSystem
sourceType
sourceCaseReference
importedEinRecordId
documentIds
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 3943. Business Continuity

Ante outage:

```text
preserve last verified state
→ stop risky submissions
→ queue low-risk work
→ preserve client visibility
→ restore provider access
→ reconcile responses
→ check unknown outcomes
→ prevent duplicate submission
```

Unknown submission outcomes deberán tener prioridad durante recuperación.

## 3944. End-to-End Tests

### Escenario 1 — EIN desde Business Formation

```text
formation approved
→ EIN handoff
→ intake reuse
→ responsible party
→ SS-4 data set
→ review
→ authorization
→ ready_to_submit
→ submission
→ issued
→ official document
→ downstream handoffs
```

### Escenario 2 — Existing EIN

```text
client requests EIN service
→ existing EIN suspected
→ official letter uploaded
→ verified
→ new application blocked
→ imported issuance record
→ organization linked
```

### Escenario 3 — Unknown Submission Outcome

```text
submit
→ network failure after send
→ outcome unknown
→ automatic retry blocked
→ provider/official verification
→ issued or safe retry
```

### Escenario 4 — Material Correction

```text
submitted
→ data issue
→ correction
→ application hash changes
→ old authorization superseded
→ new review/authorization
→ resubmission
→ issued
```

### Escenario 5 — Sensitive Data Access

```text
user requests full EIN
→ permission
→ purpose
→ reauthentication
→ temporary reveal
→ audit
```

### Escenario 6 — Provider Failure

```text
provider degraded
→ alert
→ case preserved
→ no blind retry
→ fallback reviewed
→ execution resumed
```

### Escenario 7 — Post-EIN Handoffs

```text
EIN verified
→ banking
→ bookkeeping
→ tax
→ compliance
→ payroll/funding where applicable
→ idempotent destination acceptance
```

### Escenario 8 — Security Incident

```text
unauthorized EIN export
→ deny
→ alert
→ incident
→ evidence preserved
→ access restricted
→ investigation
→ remediation
```

## 3945. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 33

El Módulo 33 estará completo cuando:

1. Exista EIN Service Catalog.
2. Exista EIN Engagement.
3. Exista EIN Case.
4. Exista duplicate-case detection.
5. Exista Organization Identity Snapshot.
6. Se reutilicen datos de Módulo 32.
7. Exista EIN Intake.
8. Exista Responsible Party.
9. Exista identifier protection.
10. Exista Responsible Party Verification.
11. Exista entity-type mapping.
12. Exista tax-classification context sin elección automática.
13. Exista Reason for Applying.
14. Fechas relevantes estén separadas.
15. Exista principal business activity.
16. Exista address separation.
17. Exista prior-EIN screening.
18. Exista existing-EIN gate.
19. Exista employee-intent intake.
20. Exista Third-Party Designee separado.
21. Exista Supporting Documents Checklist.
22. Exista SS-4 Application Record.
23. Exista Form Version Registry.
24. Exista form mapping desacoplado.
25. Exista Application Draft.
26. Exista Client Review Summary.
27. Exista Data Consistency Engine.
28. Existan Review Findings.
29. Exista Human Review.
30. Exista Signer Authority Validation.
31. Exista Client Authorization.
32. Exista Ready-to-Submit Package.
33. Exista Ready-to-Submit Gate.
34. Exista Submission Record.
35. Exista Channel Registry.
36. Exista Provider Adapter Contract.
37. Exista pre-submit revalidation.
38. Exista hash validation.
39. Exista operational authorization.
40. Exista submission idempotency.
41. Exista submission lock.
42. Existan external references/receipts.
43. Exista immutable timeline.
44. Exista response normalization.
45. Raw responses se conserven.
46. Exista technical-failure handling.
47. Exista unknown-outcome handling.
48. No existan blind retries.
49. Exista duplicate-application protection.
50. Exista Additional Information workflow.
51. Exista Correction Record.
52. Material corrections refresquen authorization cuando corresponda.
53. Resubmission cree nuevo record.
54. Exista Submission Chain.
55. Exista Provider Escalation.
56. No exista silent EIN replacement.
57. Exista EIN Issuance Record.
58. Full EIN esté tokenizado/cifrado.
59. Exista EIN Verification.
60. Exista discrepancy handling.
61. Exista official-confirmation document support.
62. No se fabriquen CP 575/147C.
63. Exista replacement-confirmation support.
64. Exista Existing EIN Import.
65. Imported EIN distinga reported/verified.
66. Organization use EIN reference única.
67. Exista Final EIN Package.
68. Exista EIN Document Vault.
69. Exista Document Index.
70. Exista document sensitivity classification.
71. Exista document hash integrity.
72. Official documents sean inmutables.
73. Exista Post-EIN Workspace.
74. Exista Post-EIN Plan.
75. Exista Banking Handoff.
76. Exista Bookkeeping Handoff.
77. Exista Tax Handoff.
78. Exista Compliance Handoff.
79. Exista Payroll/Employer Handoff.
80. Exista Funding Handoff.
81. Exista Marketplace secure handoff.
82. Exista generic Cross-Module Handoff.
83. Handoffs sean idempotentes.
84. Exista Integration Registry reuse.
85. Exista Provider Capability Matrix.
86. Exista webhook processing.
87. Exista polling fallback.
88. Exista Automation Engine.
89. Existan automation risk levels.
90. High-risk actions requieran gate.
91. Existan prohibited automations.
92. IA tenga scope y grounding.
93. IA no reciba sensitive data innecesariamente.
94. Exista Admin Console.
95. Existan Work Queues.
96. Exista Assignment Engine.
97. Exista SLA Tracking.
98. Exista MFA/RBAC/ABAC.
99. Exista purpose-based access.
100. Exista Full EIN Reveal control.
101. Exista Export Governance.
102. Exista Security Incident handling.
103. Exista immutable audit.
104. Exista observability.
105. Existan alerts.
106. Existan analytics dashboards.
107. Existan core KPIs.
108. Existan quality KPIs.
109. Existan provider KPIs.
110. Existan post-EIN KPIs.
111. Exista Data Portability.
112. Exista Migration In.
113. Exista Business Continuity.
114. Existan E2E tests.
115. Toda emisión sea rastreable a evidencia.
116. Toda corrección conserve historial.
117. Todo sensitive reveal quede auditado.
118. Ningún duplicate submission ocurra por retry.
119. Ningún downstream module necesite copiar full EIN innecesariamente.
120. Las tres partes estén integradas end-to-end.

### Instrucciones finales para Codex

1. Lee las tres partes completas.
2. Lee Módulo 32 para Formation handoff.
3. Reutiliza Organizations.
4. Reutiliza Persons.
5. Reutiliza Documents.
6. Reutiliza E-Signature.
7. Reutiliza Tasks/Approvals.
8. Reutiliza Partner/Provider Registry.
9. Reutiliza Integration Registry.
10. Reutiliza Secret Management.
11. Reutiliza Webhook Inbox/Outbox.
12. Reutiliza Audit.
13. Mantén full EIN en un único secure record.
14. Usa token/reference en módulos downstream.
15. Implementa EIN Document Vault como índice, no como duplicación.
16. Implementa document integrity/hash.
17. Implementa document verification.
18. Implementa post-EIN workspace.
19. Implementa downstream handoffs idempotentes.
20. Implementa Banking, Bookkeeping, Tax, Compliance, Payroll y Funding handoffs.
21. No compartas full EIN salvo necesidad/purpose/consent.
22. Implementa provider capability matrix.
23. Implementa webhook/polling.
24. Implementa automation risk levels.
25. Prohíbe fabricated EIN/documents.
26. Limita AI a suggestions/explanations.
27. Ground current IRS procedures in verified sources/configuration.
28. Implementa Admin Console.
29. Implementa Work Queues.
30. Implementa SLA.
31. Implementa MFA/RBAC/ABAC/field access.
32. Implementa temporary Full EIN Reveal.
33. Implementa Export Governance.
34. Implementa Security Incidents.
35. Implementa immutable audit.
36. Implementa observability/alerts.
37. Implementa analytics con metric definitions.
38. Implementa migration.
39. Implementa continuity.
40. Ejecuta todos los E2E tests.
41. No marques el módulo listo si puede emitirse/verificarse un EIN sin source.
42. No marques el módulo listo si un retry puede duplicar submission.
43. No marques el módulo listo si full EIN aparece en logs o analytics.
44. No marques el módulo listo si downstream copies pueden divergir.
45. No marques el módulo listo si un official document puede modificarse destructivamente.

### Verificación final para entrega

- ¿Formation puede crear un EIN handoff sin duplicar datos?
- ¿Responsible Party está validado?
- ¿El form version es vigente y desacoplado?
- ¿El application hash coincide con la authorization?
- ¿Retries son idempotentes?
- ¿Unknown outcome evita blind retry?
- ¿Existing EIN bloquea una nueva solicitud?
- ¿Issuance requiere evidencia verificable?
- ¿El EIN completo está cifrado/tokenizado?
- ¿Official documents son inmutables?
- ¿Full EIN reveal requiere permisos/purpose?
- ¿Downstream modules reciben references seguras?
- ¿Handoffs son idempotentes?
- ¿Providers están desacoplados?
- ¿La IA no inventa datos ni documentos?
- ¿Current procedures dependen de requirements versionados?
- ¿Sensitive exports están gobernados?
- ¿Toda acción material queda auditada?
- ¿Los ocho E2E scenarios pasan?

# Estado Final del Módulo 33

```text
MÓDULO 33:
EIN Y DOCUMENTOS EMPRESARIALES

PARTES:
1. Fundamentos, Intake, Responsible Party, SS-4, Review y Ready-to-Submit
2. Submission, Corrections, EIN Issuance y Confirmation Documents
3. Document Vault, Handoffs, Integrations, Security, Analytics y Cierre

SECCIONES:
3751–3945

ESTADO:
MODULE COMPLETE
```

