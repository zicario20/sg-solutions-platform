# SG Solutions Platform — Módulo 32: Business Formation

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 32. No es un resumen.
> Se irá ampliando dentro del mismo `.md` conforme se completen las cinco partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, catálogo, intake, entidad, jurisdicción, nombre, propietarios, management, registered agent y direcciones | 3426–3490 | **COMPLETE** |
| 2 | Requisitos estatales, documentos de formación, Articles/Certificate, revisión y preparación de filing | 3491–3555 | **COMPLETE** |
| 3 | Filing estatal, pagos, submission tracking, rechazo, aprobación, documentos finales y Operating Agreement | 3556–3620 | **COMPLETE** |
| 4 | Post-formation, organizational actions, records, banking readiness, licencias iniciales y handoffs | 3621–3685 | **COMPLETE** |
| 5 | Partners, automatización, compliance, seguridad, analytics, admin, migración, E2E y cierre | 3686–3750 | **COMPLETE** |

**Estado global del Módulo 32:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Intake, Entidad, Jurisdicción, Nombre, Propietarios y Registered Agent

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 31  
**Secciones incluidas:** 3426–3490  
**Audiencia:** Owner, Codex, formation specialists, reviewers, administrators, compliance, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Servicio de business formation coordinado por SG Solutions, con requisitos versionados por jurisdicción, revisión humana para acciones materiales y soporte para ejecución directa o mediante partners autorizados

---

## 3426. Objetivo del Módulo 32

El Módulo 32 permitirá administrar de extremo a extremo la formación inicial de una entidad empresarial soportada por SG Solutions.

El módulo deberá poder manejar:

- selección del servicio;
- intake del cliente;
- selección del entity type;
- jurisdicción;
- disponibilidad y propuestas de nombre;
- owners/members/shareholders;
- management structure;
- registered agent;
- principal/business/mailing address;
- documentos de formación;
- revisión;
- filing;
- aprobación estatal;
- documentos finales;
- post-formation;
- handoffs a EIN, Compliance, Banking, Funding, Bookkeeping y Taxes.

---

## 3427. Principio central

```text
Client intent
→ eligibility/scope
→ entity + jurisdiction
→ formation data
→ name
→ ownership/management
→ registered agent + addresses
→ filing requirements
→ document preparation
→ review
→ filing authorization
→ state submission
→ approval/rejection handling
→ final records
→ post-formation handoffs
```

Nunca:

```text
Client clicks "Start LLC"
→ AI invents legal data
→ filing submitted automatically
```

---

## 3428. Alcance inicial

La primera versión deberá soportar principalmente:

```text
limited_liability_company
corporation
```

con arquitectura preparada para:

```text
nonprofit_corporation
professional_entity
partnership_registration
foreign_qualification
series_llc
other_supported_entity
```

La disponibilidad real dependerá de la jurisdicción, servicio, partner y capacidades activas.

---

## 3429. No asesoría legal automática

SG Solutions deberá distinguir entre:

- preparación administrativa;
- coordinación de filing;
- educación general;
- servicios realizados por partner;
- situaciones que requieren abogado u otro profesional autorizado.

La plataforma no deberá presentar automáticamente SG Solutions como law firm ni afirmar que brinda legal advice cuando no corresponda.

---

## 3430. Reutilización obligatoria

El módulo deberá reutilizar:

- Clients;
- Organizations;
- Service Catalog;
- Service Orders;
- Case Files;
- Documents;
- Forms;
- Tasks;
- Approvals;
- Payments/Billing;
- Messaging;
- Notifications;
- E-Signature;
- Provider Registry;
- Integration Registry;
- AI Hub;
- Audit;
- Analytics.

No deberá crear duplicados funcionales.

---

## 3431. Business Formation Service Catalog

Tipos conceptuales iniciales:

```text
llc_formation
corporation_formation
nonprofit_formation_future
foreign_qualification_future
professional_entity_future
formation_document_preparation
formation_filing_service
registered_agent_coordination
operating_agreement_service
organizational_documents_service
formation_package
custom_formation_service
```

---

## 3432. Delivery Model

Cada producto deberá indicar uno de los modelos generales de SG Solutions:

```text
sg_service
sg_managed_with_partner
marketplace_referral
education_only
future_or_conditional
```

Esto determinará:

- quién presta el servicio;
- quién presenta el filing;
- quién cobra government fees;
- qué disclosures aparecen;
- qué documentos puede generar la plataforma;
- qué acciones requieren partner.

---

## 3433. Formation Product

Campos conceptuales:

```text
id
serviceCode
entityTypes
supportedJurisdictions
deliveryModel
basePrice
governmentFeePolicy
registeredAgentIncluded
operatingAgreementIncluded
expeditedOptionSupported
reviewRequired
partnerId
status
version
```

---

## 3434. Formation Case

Cada orden de formación deberá generar un Formation Case.

Campos:

```text
id
caseNumber
clientId
organizationId
serviceOrderId
formationProductId
entityType
formationJurisdiction
caseStatus
assignedSpecialistId
assignedReviewerId
partnerId
createdAt
updatedAt
completedAt
```

---

## 3435. Formation Case Status

```text
draft
intake_pending
intake_in_progress
eligibility_review
name_review
formation_data_pending
document_preparation
internal_review
client_review
signature_pending
payment_pending
ready_to_file
filing_in_progress
state_processing
state_action_required
approved
rejected
post_formation
completed
cancelled
archived
```

---

## 3436. State Machine Governance

Las transiciones críticas deberán estar controladas.

Ejemplos:

```text
ready_to_file
→ filing_in_progress
```

solo si existen:

- intake completo;
- required fields completos;
- required documents;
- review approval;
- client authorization;
- required signatures;
- government fee/payment readiness;
- filing method disponible.

---

## 3437. Formation Intake

El intake deberá recopilar únicamente la información necesaria según:

- entity type;
- jurisdiction;
- filing requirements;
- selected package;
- ownership structure;
- registered-agent choice;
- applicable partner requirements.

---

## 3438. Progressive Intake

El formulario no deberá mostrar todas las preguntas posibles de una vez.

Ejemplo:

```text
Entity = LLC
→ preguntar members + management

Entity = Corporation
→ preguntar shareholders/incorporator/director-related setup cuando corresponda
```

---

## 3439. Formation Intake Record

Campos:

```text
id
formationCaseId
schemaVersion
currentStep
completionPercent
status
startedAt
submittedAt
lastSavedAt
```

---

## 3440. Intake Status

```text
not_started
in_progress
client_action_required
ready_for_review
changes_requested
approved
superseded
```

---

## 3441. Entity Type Selection

La UI deberá explicar de manera educativa las opciones soportadas sin garantizar que una estructura sea la óptima legal o fiscalmente.

Podrá mostrar factores como:

- ownership;
- management;
- administrative complexity;
- general tax considerations;
- funding considerations;
- continuity;
- filing requirements.

---

## 3442. Entity Selection Decision

Campos:

```text
formationCaseId
selectedEntityType
selectionSource
clientAcknowledgement
professionalAdviceRecommended
reasonSummary
confirmedAt
```

---

## 3443. AI Entity Education

La IA podrá:

- explicar diferencias generales;
- resumir respuestas del intake;
- señalar preguntas pendientes;
- indicar que podría ser conveniente consultar a tax/legal professional.

No deberá:

- decidir definitivamente la forma jurídica del cliente;
- afirmar consecuencias fiscales garantizadas;
- inventar requisitos estatales.

---

## 3444. Jurisdiction Selection

La plataforma deberá distinguir entre:

```text
formation_state
principal_business_state
mailing_state
registered_agent_state
foreign_qualification_states_future
```

Estos valores no deberán asumirse idénticos.

---

## 3445. Jurisdiction Decision

Campos:

```text
formationCaseId
country
formationState
principalBusinessState
reasonForFormationState
foreignQualificationPotential
reviewStatus
```

---

## 3446. Out-of-State Formation Warning

Si el cliente intenta formar una entidad en un estado diferente al lugar principal donde operará, el sistema deberá poder mostrar un aviso educativo sobre posibles obligaciones adicionales.

No deberá sugerir automáticamente un estado por marketing o supuestos beneficios sin contexto suficiente.

---

## 3447. Jurisdiction Rule Registry

Los requisitos estatales deberán mantenerse como datos versionados.

Campos conceptuales:

```text
id
jurisdictionCode
entityType
ruleCategory
ruleKey
ruleValue
effectiveFrom
effectiveTo
sourceReference
verificationStatus
version
```

---

## 3448. Rule Categories

```text
name
registered_agent
address
organizer
incorporator
ownership_disclosure
management
filing_document
signature
fee
publication
annual_compliance
other
```

---

## 3449. Current Requirement Verification

Los requisitos estatales susceptibles a cambios no deberán hardcodearse como verdades permanentes.

La implementación deberá permitir:

- effective dates;
- source references;
- verification timestamps;
- reviewer confirmation;
- provider updates.

---

## 3450. Formation Name

Cada Formation Case deberá incluir un Name Workspace.

Campos:

```text
formationCaseId
preferredName
alternateName1
alternateName2
finalSelectedName
nameStatus
nameReviewedAt
```

---

## 3451. Name Candidate

Campos:

```text
id
formationCaseId
candidateName
normalizedName
rank
source
status
conflictReason
createdAt
```

---

## 3452. Name Candidate Status

```text
proposed
format_invalid
restricted_word_review
distinguishability_review
possible_conflict
available_unverified
availability_verified
reserved
selected
rejected
expired
```

---

## 3453. Name Validation Layers

El sistema deberá separar:

1. formato;
2. entity designator;
3. restricted words;
4. state business-name search;
5. distinguishability;
6. trademark/domain considerations opcionales.

Una validación no deberá presentarse como garantía absoluta de derechos sobre el nombre.

---

## 3454. Entity Designator

Ejemplos conceptuales:

```text
LLC
L.L.C.
Limited Liability Company
Inc.
Corporation
Corp.
```

La disponibilidad deberá depender de entity type y jurisdiction rules.

---

## 3455. Restricted Word Review

Palabras reguladas o que puedan requerir autorización adicional deberán generar:

```text
restricted_word_review
```

El listado deberá provenir del Jurisdiction Rule Registry.

---

## 3456. Name Search Result

Campos:

```text
candidateId
jurisdiction
searchMethod
searchedAt
resultStatus
matchingEntities
sourceReference
reviewedBy
```

---

## 3457. Name Search Result Status

```text
not_searched
possible_available
possible_conflict
unavailable
requires_manual_review
verified_available_at_search_time
```

La plataforma deberá aclarar que disponibilidad puede cambiar antes del filing.

---

## 3458. Name Reservation

Cuando una jurisdicción y servicio lo soporten, deberá poder registrarse:

```text
reservationRequired
reservationOptional
reservationNumber
reservedAt
expiresAt
reservationDocumentId
```

---

## 3459. Alternate Names

Antes del filing podrá solicitarse al cliente múltiples alternativas para reducir retrasos por rechazo de nombre.

La prioridad deberá preservarse.

---

## 3460. Business Purpose

El intake deberá poder recopilar el business purpose requerido para formación.

Campos:

```text
businessPurposeType
businessPurposeText
industryCode
activityDescription
regulatedActivityFlag
```

---

## 3461. Business Purpose Types

```text
general_lawful_purpose
specific_activity
regulated_activity
custom
```

La disponibilidad dependerá de jurisdicción.

---

## 3462. Regulated Activity Flag

Actividades como ciertas profesiones o industrias reguladas deberán generar revisión.

El módulo no deberá asumir que formar la entidad equivale a obtener licencias profesionales o comerciales.

---

## 3463. Formation Party Model

La plataforma deberá soportar roles conceptuales como:

```text
member
manager
shareholder
director
officer
organizer
incorporator
authorized_person
beneficial_owner_reference
```

La aplicabilidad dependerá de entity type y jurisdiction.

---

## 3464. Formation Party Record

Campos:

```text
id
formationCaseId
partyType
personId
organizationId
legalName
ownershipPercent
votingPercent
managementRole
startDate
status
```

---

## 3465. Party Identity Reuse

Si la persona ya existe en Clients/Contacts, deberá reutilizarse la identidad central y no crearse copias inconsistentes.

Los datos específicos del Formation Case deberán almacenarse como relaciones/roles.

---

## 3466. Ownership Structure

Para entidades soportadas deberá poder capturarse:

- number of owners;
- ownership percentage;
- ownership units/shares cuando aplique;
- voting rights cuando aplique;
- initial contribution references cuando aplique;
- effective dates.

---

## 3467. Ownership Validation

Cuando se utilicen percentages deberá validarse, según el modelo aplicable:

```text
totalOwnershipPercent = 100%
```

salvo estructuras que explícitamente permitan otro modelo.

---

## 3468. Ownership History

Cambios posteriores no deberán sobrescribir la estructura original.

Campos conceptuales:

```text
ownershipVersion
validFrom
validTo
changeReason
approvedBy
```

Aunque cambios post-formation se manejarán principalmente en módulos futuros/Compliance, el modelo deberá estar preparado.

---

## 3469. LLC Management Structure

Opciones conceptuales:

```text
member_managed
manager_managed
jurisdiction_specific
```

---

## 3470. Management Selection

Campos:

```text
formationCaseId
managementType
selectedManagers
clientConfirmed
reviewStatus
```

---

## 3471. Corporation Governance Intake

Cuando el entity type sea corporation, la arquitectura deberá permitir recopilar cuando corresponda:

- incorporator;
- initial directors;
- officers;
- authorized shares;
- share classes;
- par value;
- shareholder references.

Los requisitos exactos se definirán en las partes posteriores mediante jurisdiction rules.

---

## 3472. Organizer / Incorporator

La plataforma deberá identificar claramente quién actuará como organizer/incorporator cuando ese rol sea requerido.

Valores posibles:

```text
client
sg_solutions_authorized_role
partner
third_party
other_authorized_person
```

Nunca deberá asignarse automáticamente SG Solutions sin authority y delivery model compatible.

---

## 3473. Organizer Authorization

Campos:

```text
formationCaseId
organizerType
organizerPartyId
authorityBasis
clientAuthorizationId
status
```

---

## 3474. Registered Agent Requirement

El sistema deberá verificar si la jurisdicción/entity type exige registered agent.

Opciones de cumplimiento:

```text
client_provided
third_party_provider
sg_managed_partner
not_required
```

---

## 3475. Registered Agent Record

Campos:

```text
id
formationCaseId
agentType
personId
providerId
legalName
streetAddress
city
state
postalCode
consentStatus
serviceStartDate
serviceEndDate
status
```

---

## 3476. Registered Agent Consent

Cuando sea requerido deberá conservarse evidencia de consentimiento o aceptación.

Estados:

```text
not_required
pending
received
verified
rejected
expired
```

---

## 3477. Registered Agent Address Validation

El sistema deberá validar requisitos de dirección según jurisdiction rules.

Ejemplos de checks posibles:

- same formation state;
- physical street address;
- no unsupported PO Box;
- service availability;
- postal normalization.

No deberán hardcodearse reglas universales.

---

## 3478. Registered Agent Provider Integration

La arquitectura deberá permitir partners de registered agent mediante Provider Registry.

Capacidades posibles:

```text
quote
order
activate
retrieve_agent_details
retrieve_documents
renew
cancel
status
```

---

## 3479. Principal Business Address

Campos:

```text
addressLine1
addressLine2
city
state
postalCode
country
addressType
verificationStatus
```

---

## 3480. Address Types

```text
principal_business
mailing
registered_agent
organizer
member
manager
corporate_records
```

Una misma dirección podrá cumplir múltiples roles mediante referencias, sin duplicar datos innecesariamente.

---

## 3481. Address Privacy Notice

Antes de presentar información que pueda convertirse en registro público, la plataforma deberá advertir al cliente cuando corresponda.

No deberá prometer privacidad si la información será pública por filing o por reglas estatales.

---

## 3482. Virtual Address / CMRA Handling

La plataforma deberá poder marcar:

```text
residential
commercial
virtual_office
cmra
registered_agent_address
unknown
```

Esto permitirá aplicar reglas futuras de bancos, states y partners sin asumir que cualquier dirección sirve para cualquier propósito.

---

## 3483. Address Verification

Campos:

```text
addressId
verificationProvider
normalizedAddress
verificationStatus
verifiedAt
warnings
```

Estados:

```text
unverified
normalized
verified
warning
rejected
manual_review
```

---

## 3484. Formation Contact Information

Deberá distinguirse entre:

- public business contact;
- internal client contact;
- state filing contact;
- service-of-process contact;
- billing contact.

No deberá exponerse un dato interno públicamente por defecto.

---

## 3485. Missing Information Engine

El sistema deberá calcular información faltante dinámicamente según:

```text
entityType
+ jurisdiction
+ product
+ deliveryModel
+ registeredAgentChoice
+ ownershipStructure
= requiredFormationData
```

---

## 3486. Formation Readiness Score

Podrá existir un score operacional, no legal, que indique progreso.

Ejemplo conceptual:

```text
identity_complete
entity_selected
jurisdiction_selected
name_ready
ownership_complete
management_complete
registered_agent_complete
addresses_complete
required_documents_available
```

Resultado:

```text
0–100% formation readiness
```

No deberá confundirse con aprobación estatal.

---

## 3487. Client Review Summary

Antes de pasar a preparación documental deberá mostrarse un resumen al cliente con:

- selected entity;
- state;
- proposed legal name;
- business purpose;
- owners;
- management;
- organizer/incorporator;
- registered agent;
- addresses;
- known warnings;
- next steps.

---

## 3488. Human Review Gate

Antes de generar documentos finales para filing deberá existir un review gate cuando la policy lo requiera.

El reviewer deberá comprobar:

- entity type;
- jurisdiction;
- name status;
- party roles;
- ownership;
- management;
- registered agent;
- addresses;
- restricted activity warnings;
- missing data;
- delivery model.

---

## 3489. Permisos, APIs, eventos y workflows de Parte 1

### Permisos conceptuales

```text
formation.catalog.read
formation.catalog.manage

formation.case.read
formation.case.create
formation.case.assign
formation.case.manage

formation.intake.read
formation.intake.complete
formation.intake.review

formation.entity.select
formation.jurisdiction.select
formation.name.read
formation.name.manage
formation.name.review

formation.party.read
formation.party.manage
formation.ownership.manage
formation.management.manage

formation.registered_agent.read
formation.registered_agent.manage
formation.address.manage

formation.setup.review
```

### APIs conceptuales

```text
GET    /api/formation/services
POST   /api/formation/cases
GET    /api/formation/cases/{id}

GET    /api/formation/cases/{id}/intake
POST   /api/formation/cases/{id}/intake
POST   /api/formation/cases/{id}/entity-selection
POST   /api/formation/cases/{id}/jurisdiction

GET    /api/formation/cases/{id}/names
POST   /api/formation/cases/{id}/names
POST   /api/formation/names/{id}/search
POST   /api/formation/names/{id}/select

GET    /api/formation/cases/{id}/parties
POST   /api/formation/cases/{id}/parties
POST   /api/formation/cases/{id}/ownership
POST   /api/formation/cases/{id}/management

POST   /api/formation/cases/{id}/registered-agent
POST   /api/formation/cases/{id}/addresses
POST   /api/formation/cases/{id}/setup-review
```

### Eventos de dominio

```text
FormationCaseCreated
FormationIntakeStarted
FormationIntakeSubmitted
FormationEntitySelected
FormationJurisdictionSelected
FormationNameCandidateAdded
FormationNameSearchCompleted
FormationNameSelected
FormationPartyAdded
FormationOwnershipConfigured
FormationManagementConfigured
FormationOrganizerConfigured
FormationRegisteredAgentConfigured
FormationAddressVerified
FormationSetupReviewRequested
FormationSetupReviewApproved
FormationSetupChangesRequested
```

### Workflows iniciales

```text
Formation Intake Workflow
Entity Selection Workflow
Jurisdiction Review Workflow
Formation Name Workflow
Ownership and Management Workflow
Registered Agent Workflow
Address Verification Workflow
Formation Setup Review Workflow
```

---

## 3490. Pruebas, criterios de aceptación e instrucciones para Codex

### Pruebas obligatorias

1. Crear LLC Formation Service.
2. Crear Corporation Formation Service.
3. Configurar delivery model `sg_service`.
4. Configurar `sg_managed_with_partner`.
5. Crear Formation Case.
6. Ejecutar progressive intake.
7. Seleccionar LLC.
8. Seleccionar Corporation.
9. Registrar client acknowledgement.
10. Seleccionar formation state.
11. Distinguir principal business state.
12. Generar out-of-state warning.
13. Crear jurisdiction rule.
14. Versionar jurisdiction rule.
15. Registrar preferred legal name.
16. Registrar alternate names.
17. Validar entity designator.
18. Detectar restricted word.
19. Ejecutar name search.
20. Guardar source reference.
21. Marcar availability at search time.
22. Seleccionar final name.
23. Crear business purpose.
24. Detectar regulated activity flag.
25. Crear member.
26. Crear manager.
27. Crear shareholder reference.
28. Crear organizer/incorporator.
29. Registrar ownership percentages.
30. Validar total ownership cuando aplique.
31. Configurar member-managed LLC.
32. Configurar manager-managed LLC.
33. Registrar corporation governance intake.
34. Configurar client-provided registered agent.
35. Configurar partner registered agent.
36. Registrar consent.
37. Validar registered-agent address.
38. Crear principal business address.
39. Crear mailing address.
40. Clasificar virtual/CMRA address.
41. Normalizar address.
42. Generar privacy warning.
43. Calcular missing information.
44. Calcular Formation Readiness Score.
45. Generar Client Review Summary.
46. Crear Setup Review.
47. Solicitar cambios.
48. Aprobar Setup Review.
49. Probar RBAC/ABAC.
50. Probar immutable audit.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Business Formation Service Catalog.
2. Existan delivery models.
3. Exista Formation Product.
4. Exista Formation Case.
5. Exista state machine controlado.
6. Exista progressive intake.
7. Exista Entity Type Selection.
8. La IA no decida estructura jurídica final.
9. Exista Jurisdiction Selection.
10. Formation state y principal-business state sean distintos conceptualmente.
11. Exista Jurisdiction Rule Registry.
12. Las reglas sean versionadas y tengan vigencia.
13. Exista Name Workspace.
14. Existan alternate names.
15. Exista entity-designator validation.
16. Exista restricted-word review.
17. Exista name-search lineage.
18. La disponibilidad no se presente como garantía eterna.
19. Exista business-purpose intake.
20. Exista regulated-activity flag.
21. Exista Formation Party Model.
22. Exista ownership structure.
23. Exista ownership validation.
24. Exista ownership history preparada para futuro.
25. Exista LLC management structure.
26. Exista Corporation Governance Intake.
27. Exista Organizer/Incorporator model.
28. Exista Organizer Authorization.
29. Exista Registered Agent model.
30. Exista consent tracking.
31. Exista provider integration abstraction.
32. Exista principal business address.
33. Existan múltiples address roles.
34. Exista privacy warning.
35. Exista virtual/CMRA classification.
36. Exista address verification.
37. Los contactos públicos e internos sean distintos.
38. Exista Missing Information Engine.
39. Exista Formation Readiness Score.
40. Exista Client Review Summary.
41. Exista Human Review Gate.
42. Existan permisos.
43. Existan APIs.
44. Existan domain events.
45. Existan workflows.
46. Toda decisión material sea trazable.
47. No se inventen requisitos estatales.
48. No se presente SG Solutions como law firm por defecto.
49. No se expongan datos internos públicamente por defecto.
50. La Parte 1 pueda alimentar la preparación documental de Parte 2.

### Instrucciones para Codex

Antes de implementar:

1. Lee los módulos core relacionados.
2. Reutiliza Clients y Organizations.
3. Reutiliza Service Catalog y Service Orders.
4. Reutiliza Documents, Forms, Tasks y Approvals.
5. Reutiliza Provider Registry e Integration Registry.
6. Reutiliza Audit.
7. Implementa Formation Product.
8. Implementa Formation Case.
9. Implementa state machine explícito.
10. Implementa progressive intake.
11. Implementa entity-type configuration.
12. No codifiques asesoría legal como output autoritativo.
13. Implementa jurisdiction separation.
14. Implementa Jurisdiction Rule Registry.
15. Versiona reglas por effective date.
16. Exige source references para reglas cambiantes.
17. Implementa Name Workspace.
18. Implementa alternate names.
19. Implementa name validation layers separadas.
20. No trates name availability como garantía.
21. Implementa business-purpose intake.
22. Implementa regulated-activity review flag.
23. Implementa Formation Party Model.
24. Reutiliza identidades centrales.
25. Implementa ownership model.
26. Implementa management model.
27. Implementa corporation governance placeholders soportados por configuración.
28. Implementa Organizer/Incorporator.
29. Exige authority para roles de SG Solutions/partner.
30. Implementa Registered Agent model.
31. Implementa consent.
32. Implementa provider abstraction.
33. Implementa address roles.
34. Implementa privacy/public-record warnings.
35. Implementa CMRA/virtual classification.
36. Implementa address verification abstraction.
37. Separa public contact de internal contact.
38. Implementa Missing Information Engine.
39. Implementa Formation Readiness Score solo como progreso operativo.
40. Implementa Client Review Summary.
41. Implementa Human Review Gate.
42. Implementa permissions.
43. Implementa APIs.
44. Implementa domain events.
45. Implementa workflows.
46. Implementa audit inmutable.
47. No permitas filing desde Parte 1.
48. No permitas que IA invente party/ownership data.
49. No permitas que un provider sea requerido para que funcione el dominio.
50. No marques Parte 1 como lista sin completar Formation Case → intake → entity/jurisdiction → name → parties → registered agent/address → setup review.

### Verificación final de Parte 1

Antes de entregar, confirma:

- ¿El cliente puede crear un Formation Case sin filing prematuro?
- ¿Entity type y jurisdiction quedan explícitamente confirmados?
- ¿Los requisitos estatales viven en un registry versionado?
- ¿El nombre tiene candidate history y source lineage?
- ¿Owners y managers se modelan como roles, no copias de identidad?
- ¿El registered agent conserva consent y provider relationship?
- ¿Las direcciones distinguen uso público e interno?
- ¿El sistema advierte cuando una dirección puede quedar en public record?
- ¿La IA solo educa/sugiere?
- ¿El Setup Review bloquea avanzar si faltan datos materiales?
- ¿Toda acción queda auditada?

---
---

# Parte 2 — Requisitos Estatales, Documentos de Formación, Articles/Certificate, Revisión y Preparación de Filing

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 32 — Parte 1  
**Secciones incluidas:** 3491–3555  
**Audiencia:** Owner, Codex, formation specialists, reviewers, compliance, administrators, partners y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Requisitos estatales versionados, generación documental determinística, revisión humana, autorización explícita y preparación de paquetes de filing sin presentación automática

---

## 3491. Objetivo de la Parte 2

Esta parte define cómo SG Solutions deberá transformar la información confirmada en la Parte 1 en un paquete de formación completo, validado y listo para presentación.

Deberá cubrir:

- requisitos estatales;
- formularios y documentos oficiales;
- Articles of Organization;
- Articles of Incorporation;
- Certificates of Formation cuando corresponda;
- campos estatales obligatorios y condicionales;
- anexos y supplemental provisions;
- effective dates;
- expedited options;
- government fees;
- generación de drafts;
- validación;
- internal review;
- client review;
- e-signature cuando corresponda;
- filing authorization;
- creación del Filing Package.

La Parte 2 termina cuando el expediente alcanza:

```text
ready_to_file
```

pero **no presenta todavía el filing estatal**.

---

## 3492. Principio central

```text
Confirmed formation data
→ jurisdiction requirements
→ filing field mapping
→ deterministic document draft
→ validation
→ internal review
→ client review
→ signature/authorization
→ filing package
→ ready-to-file gate
```

Nunca:

```text
LLM-generated legal-looking document
→ assume correct
→ submit to state
```

---

## 3493. Jurisdiction Requirements Snapshot

Cada Formation Case deberá utilizar un snapshot identificable de los requisitos aplicables a la jurisdicción y entity type.

Campos conceptuales:

```text
id
formationCaseId
jurisdictionCode
entityType
requirementSetVersionId
effectiveDate
capturedAt
capturedBy
sourceReferences
status
```

El objetivo es poder demostrar posteriormente **qué reglas utilizó la plataforma cuando preparó el filing**.

---

## 3494. Formation Requirement Registry

El registro deberá modelar requisitos como datos configurables y no dispersarlos por la aplicación.

Campos:

```text
id
jurisdictionCode
entityType
requirementCode
requirementType
labelKey
descriptionKey
requiredCondition
validationRule
publicRecordImpact
sourceReferenceId
effectiveFrom
effectiveTo
status
version
```

Tipos iniciales:

```text
required_field
conditional_field
prohibited_value
document_requirement
signature_requirement
consent_requirement
fee_requirement
publication_requirement_future
post_formation_requirement
review_requirement
```

---

## 3495. Effective-Dated Rules

Toda regla estatal cambiante deberá soportar:

```text
effectiveFrom
effectiveTo
supersedesVersionId
```

Un cambio futuro no deberá alterar silenciosamente un Formation Case ya preparado bajo una versión anterior.

---

## 3496. Requirement Source References

Toda regla material deberá poder vincularse con una fuente verificable, por ejemplo:

- Secretary of State;
- Department of State;
- Corporations Division;
- statute/regulation reference cuando proceda;
- official form instructions;
- partner-maintained verified source.

Campos conceptuales:

```text
id
jurisdictionCode
sourceType
title
urlOrReference
retrievedAt
verifiedAt
verifiedBy
contentHash
status
```

La plataforma deberá distinguir entre:

```text
official_source
verified_partner_source
internal_operational_note
```

---

## 3497. Filing Office Registry

Cada jurisdicción podrá asociarse con una autoridad de filing.

Campos:

```text
id
jurisdictionCode
officeName
officeType
website
filingPortalReference
mailingAddress
supportedSubmissionMethods
businessHoursReference
status
```

Métodos posibles:

```text
online_portal
api
partner_portal
mail
in_person
fax_future
other
```

---

## 3498. Formation Document Type

Tipos conceptuales:

```text
articles_of_organization
certificate_of_formation
articles_of_incorporation
certificate_of_incorporation
statement_of_organization
initial_report
cover_sheet
consent_form
supplemental_provision
state_specific_attachment
other_required_document
```

El nombre visible deberá adaptarse a la terminología real de la jurisdicción.

---

## 3499. Document Template Registry

Los documentos generados por SG Solutions deberán provenir de templates versionados.

Campos:

```text
id
documentType
jurisdictionCode
entityType
templateVersion
format
fieldSchemaVersion
sourceFormVersion
approvedBy
approvedAt
effectiveFrom
effectiveTo
status
```

No deberá existir un único template genérico pretendiendo servir para todos los estados.

---

## 3500. Template Versioning

Toda modificación de template deberá crear una nueva versión.

No se deberá sobrescribir el template utilizado por un filing histórico.

El Formation Case deberá conservar:

```text
templateId
templateVersion
sourceFormVersion
```

---

## 3501. Formation Document Record

Campos:

```text
id
formationCaseId
documentType
templateId
templateVersion
documentVersion
status
storageReference
contentHash
generatedAt
generatedBy
reviewedBy
signedAt
supersededById
```

---

## 3502. Filing Field Mapping

La plataforma deberá separar datos de dominio de campos específicos del formulario estatal.

Ejemplo:

```text
organization.legalName
→ Illinois LLC Articles field X

registeredAgent.name
→ Illinois LLC Articles field Y
```

Campos conceptuales:

```text
id
jurisdictionCode
entityType
formVersion
filingFieldCode
sourcePath
transformRule
requiredCondition
validationRule
```

---

## 3503. Required, Optional y Conditional Fields

Cada campo deberá indicar:

```text
required
optional
conditional
prohibited
```

Un campo condicional deberá incluir una regla explícita.

Ejemplo conceptual:

```text
if managementStructure == manager_managed
→ require manager disclosure fields when jurisdiction requires them
```

---

## 3504. Legal Name Placement

El nombre confirmado deberá insertarse exactamente según:

- approved candidate;
- required entity designator;
- punctuation rules;
- character restrictions;
- capitalization policy.

La plataforma no deberá modificar silenciosamente el nombre durante generación documental.

---

## 3505. Business Purpose Provision

La plataforma deberá soportar:

```text
general_lawful_purpose
custom_business_purpose
state_required_specific_purpose
regulated_activity_review
```

Cuando se utilice texto custom:

- deberá conservarse la versión escrita por el cliente;
- deberá registrarse cualquier edición;
- podrá requerir reviewer;
- podrá generar legal-review flag si excede el scope administrativo.

---

## 3506. Duration Provision

Valores conceptuales:

```text
perpetual
fixed_term
state_default
custom_review_required
```

Si la jurisdicción utiliza perpetual por defecto, la UI deberá explicarlo sin inventar una fecha.

---

## 3507. Registered Agent and Office Fields

La generación documental deberá usar solamente el Registered Agent confirmado en Parte 1.

Deberá validar:

- agent type;
- legal/name requirements;
- registered office address;
- jurisdiction match;
- consent status cuando aplique;
- provider status si es partner.

---

## 3508. Organizer / Incorporator Fields

La plataforma deberá determinar quién aparece como organizer/incorporator según:

- entity type;
- jurisdiction;
- delivery model;
- client authorization;
- partner arrangement.

SG Solutions, un empleado o un partner no deberá aparecer automáticamente como organizer/incorporator sin authority documentada.

---

## 3509. Member / Manager Disclosure Fields

Para LLCs deberá soportarse configuración de disclosure sobre:

```text
members
managers
none_at_formation
state_specific_roles
```

La disponibilidad dependerá del requirement set.

Información que no sea requerida públicamente no deberá incluirse por defecto en documentos públicos.

---

## 3510. Corporation Governance Fields

Para corporations deberá soportarse cuando proceda:

- incorporator;
- initial directors;
- shares;
- classes;
- par value;
- registered office;
- purpose;
- additional provisions.

No deberá asumirse que todos los estados piden exactamente los mismos datos.

---

## 3511. Authorized Shares and Capital Structure

Campos conceptuales:

```text
authorizedShares
shareClass
parValue
noParValue
seriesReference
rightsReference
```

Configuraciones complejas deberán poder activar:

```text
professional_review_required
```

La plataforma no deberá diseñar automáticamente una estructura de capital compleja como si fuera asesoría legal.

---

## 3512. Regulated / Professional Entity Flags

Si la actividad o entity type puede requerir aprobación profesional/regulatoria, deberá generarse un flag.

Ejemplos conceptuales:

```text
professional_license_possible
restricted_profession
financial_services_review
healthcare_review
legal_services_review
state_specific_regulatory_review
```

Esto deberá bloquear el filing automático hasta resolución.

---

## 3513. Supplemental Provisions

Deberá permitirse añadir cláusulas adicionales únicamente mediante workflow controlado.

Campos:

```text
id
formationCaseId
provisionType
clientProvidedText
normalizedText
source
reviewStatus
legalReviewFlag
includedInDocumentId
```

---

## 3514. Effective Date

Opciones:

```text
upon_filing
upon_acceptance
specified_date
state_default
```

La UI deberá explicar claramente qué opción está siendo solicitada sin prometer fecha de aprobación.

---

## 3515. Delayed Effective Date

Cuando la jurisdicción lo soporte:

```text
delayedEffectiveDate
allowedByRuleVersion
maximumDelayRule
validationStatus
```

Una fecha fuera de los límites permitidos deberá ser bloqueada antes de generar el Filing Package.

---

## 3516. Expedited Filing Option

El sistema deberá soportar opciones configurables como:

```text
standard
expedited
same_day_when_available
custom_state_option
```

Cada opción deberá conservar:

- government fee;
- expected service category;
- official description;
- availability;
- source reference;
- effective dates.

Nunca deberá presentarse un tiempo estimado como garantía.

---

## 3517. State-Specific Questions

El Requirement Registry deberá poder generar preguntas adicionales sin modificar el código principal.

Ejemplos:

- county cuando proceda;
- NAICS/industry classification;
- initial report data;
- publication-related information;
- professional-license question;
- veteran/minority program flag cuando legalmente pertinente;
- state-specific attestation.

---

## 3518. State Question Answer Record

Campos:

```text
id
formationCaseId
requirementId
questionCode
answerValue
answerSource
answeredBy
answeredAt
verifiedBy
verificationStatus
```

El sistema deberá conservar quién proporcionó cada respuesta material.

---

## 3519. Document Generation Pipeline

Flujo:

```text
confirmed case data
→ requirement snapshot
→ field mapping
→ validation
→ template selection
→ deterministic merge
→ draft document
→ document hash/version
→ review
```

---

## 3520. Draft Generation

El primer documento generado deberá quedar en:

```text
draft
```

Nunca deberá considerarse filing-ready únicamente porque pudo renderizarse.

---

## 3521. Deterministic Document Generation

Para campos legales/administrativos estructurados deberá preferirse generación determinística.

Ejemplo:

```text
legalName = confirmedLegalName
registeredAgent = confirmedRegisteredAgent
address = confirmedRegisteredOffice
```

No:

```text
LLM, guess a polished version of these fields
```

---

## 3522. AI Role in Formation Documents

La IA podrá:

- explicar campos en lenguaje simple;
- detectar posibles inconsistencias;
- resumir diferencias entre drafts;
- sugerir preguntas faltantes;
- clasificar supplemental text para review;
- generar internal review summaries.

---

## 3523. Prohibited AI Actions

La IA no podrá:

- inventar legal names;
- inventar owners;
- inventar registered agents;
- crear firmas;
- seleccionar silenciosamente capital structure compleja;
- afirmar legal sufficiency;
- modificar datos confirmados sin aprobación;
- autorizar filing;
- presentar documentos al estado.

---

## 3524. Formation Validation Engine

Antes de revisión deberá validar al menos:

```text
required_fields
conditional_fields
field_format
cross_field_consistency
jurisdiction_rules
document_template_version
fee_schedule_version
consent_requirements
signature_requirements
```

---

## 3525. Semantic Validation

Además de formato, deberá poder detectar inconsistencias como:

```text
manager_managed LLC
but no manager information where required
```

o:

```text
registered agent address
outside required jurisdiction
```

Estas detecciones deberán crear findings, no corregirse silenciosamente.

---

## 3526. Cross-Field Validation

Ejemplos:

- entity type coincide con document type;
- jurisdiction coincide con registered office;
- selected expedited option existe para ese filing;
- effective date es válida;
- member/manager disclosures coinciden con management structure;
- corporation shares cumplen el schema soportado.

---

## 3527. Jurisdiction Compliance Validation

Cada validación deberá identificar:

```text
requirementId
requirementVersion
validationResult
severity
messageKey
sourceReferenceId
```

No deberá existir una validación estatal crítica sin lineage hacia la regla que la originó.

---

## 3528. Filing Fee Schedule

Campos:

```text
id
jurisdictionCode
entityType
filingType
baseGovernmentFee
expeditedOptions
additionalMandatoryFees
currency
effectiveFrom
effectiveTo
sourceReferenceId
verifiedAt
status
```

---

## 3529. Government Fees

Los government fees deberán mantenerse separados de los fees cobrados por SG Solutions.

Ejemplo de breakdown:

```text
SG Solutions service fee
Government filing fee
Registered agent fee
Optional expedited government fee
Optional partner fee
```

El cliente deberá poder entender qué cobra cada parte.

---

## 3530. Optional and Expedited Fees

Todo optional fee deberá incluir:

```text
optional = true
selectedBy
selectedAt
sourceReference
```

No deberá añadirse automáticamente un servicio expedited o adicional sin consentimiento.

---

## 3531. Formation Fee Quote

Campos:

```text
id
formationCaseId
serviceFee
governmentFee
expeditedFee
partnerFee
otherFee
taxAmountIfApplicable
totalAmount
currency
feeScheduleVersionId
expiresAt
status
```

---

## 3532. Fee Freshness Validation

Antes de aceptar autorización para filing deberá verificarse que:

```text
currentFeeScheduleVersion
==
quoteFeeScheduleVersion
```

Si cambió el fee estatal, deberá generarse un requote o review.

---

## 3533. Fee Payment Routing

La plataforma deberá distinguir conceptualmente:

```text
paid_to_sg_solutions
paid_to_state_directly
paid_through_partner
reimbursable_government_fee
```

El routing exacto dependerá del delivery model y de la implementación legal/operativa.

---

## 3534. Internal Formation Review

Antes de enviar al cliente para aprobación final deberá existir una revisión interna cuando la policy lo requiera.

Deberá revisar:

- entity type;
- jurisdiction;
- legal name;
- owners/roles;
- management structure;
- registered agent;
- addresses;
- state-specific fields;
- document version;
- fees;
- signatures requeridas;
- supplemental provisions;
- blockers.

---

## 3535. Internal Review Checklist

Campos conceptuales:

```text
id
formationCaseId
checkCode
status
severity
evidenceReference
completedBy
completedAt
notes
```

Checks iniciales:

```text
entity_confirmed
jurisdiction_confirmed
name_confirmed
party_data_complete
registered_agent_confirmed
addresses_validated
requirements_complete
document_rendered
fees_current
no_blocking_findings
```

---

## 3536. Formation Review Finding

Tipos:

```text
missing_data
invalid_field
jurisdiction_mismatch
name_issue
party_issue
registered_agent_issue
address_issue
fee_issue
document_issue
signature_issue
regulated_activity_issue
supplemental_provision_issue
other
```

---

## 3537. Finding Status

```text
open
assigned
client_action_required
specialist_action_required
resolved
accepted_exception
rejected
superseded
```

Un blocking finding abierto deberá impedir `ready_to_file`.

---

## 3538. Client Document Review

El cliente deberá poder revisar un resumen entendible de lo que será presentado.

Deberá mostrar al menos:

- entity type;
- state/jurisdiction;
- legal name;
- registered agent;
- public addresses;
- ownership/management disclosures incluidos;
- effective date;
- expedited option;
- government fee;
- documents que se presentarán.

---

## 3539. Client Confirmation

El sistema deberá registrar confirmación explícita de datos materiales.

Campos:

```text
id
formationCaseId
confirmationVersion
documentVersionIds
confirmedFieldsHash
confirmedBy
confirmedAt
ipOrSessionReference
status
```

Si cambia un dato material después de confirmación, deberá invalidarse la confirmación anterior según policy.

---

## 3540. E-Signature Requirement

Cuando un documento requiera firma, deberá reutilizarse el módulo central de E-Signature.

Deberá soportarse:

```text
client_signature
organizer_signature
incorporator_signature
registered_agent_consent_signature
partner_signature
state_specific_signature
```

La disponibilidad dependerá de la jurisdicción y submission method.

---

## 3541. Signature Audit

Cada firma deberá conservar:

- signer identity;
- signer role;
- document version;
- signature method;
- signed timestamp;
- consent/intent;
- audit reference;
- final document hash.

Una firma nunca deberá reutilizarse en una versión diferente del documento sin autorización válida.

---

## 3542. Filing Authorization

Antes de presentar un filing, SG Solutions deberá obtener una autorización explícita cuando sea requerida por el workflow.

Campos:

```text
id
formationCaseId
authorizationType
filingPackageVersion
feeQuoteId
authorizedAmount
authorizedBy
authorizedAt
expiresAt
status
```

---

## 3543. Filing Authorization Status

```text
not_requested
pending
approved
rejected
expired
revoked
invalidated_by_change
```

---

## 3544. Ready-to-File Gate

Un Formation Case solamente podrá alcanzar:

```text
ready_to_file
```

cuando todos los requisitos aplicables estén satisfechos.

Gate conceptual:

```text
setup review approved
+
current requirement snapshot
+
valid filing document
+
no blocking findings
+
current fee quote
+
required signatures complete
+
client confirmation valid
+
filing authorization approved
=
ready_to_file
```

---

## 3545. Filing Package

El Filing Package será el artefacto operacional que consume la Parte 3.

Campos:

```text
id
formationCaseId
packageVersion
jurisdictionCode
entityType
documentIds
attachmentIds
requirementSnapshotId
feeQuoteId
authorizationId
submissionMethod
partnerId
status
createdAt
approvedAt
```

---

## 3546. Filing Package Manifest

El package deberá contener un manifest estructurado:

```text
caseNumber
legalName
entityType
jurisdiction
filingType
documentVersions
attachments
requiredSignatures
feeBreakdown
submissionMethod
sourceRuleVersions
preparedBy
reviewedBy
clientConfirmedAt
authorizedAt
```

---

## 3547. Sensitive Data Minimization

El Filing Package deberá incluir únicamente información necesaria para la presentación.

No deberá incluir innecesariamente:

- SSN;
- full tax identifiers;
- banking information;
- unrelated personal addresses;
- internal compliance notes;
- internal risk scores.

---

## 3548. Partner Filing Handoff

Si `deliveryModel == sg_managed_with_partner`, el Filing Package deberá poder entregarse al partner mediante una interfaz controlada.

Deberá registrar:

```text
partnerId
packageVersion
handoffAt
acknowledgedAt
partnerReference
status
```

---

## 3549. Partner Readiness Validation

Antes de handoff deberá confirmarse:

- partner active;
- service supported;
- jurisdiction supported;
- credentials/configuration valid;
- current SLA available;
- package version compatible;
- delivery authorization valid.

---

## 3550. No Automatic Filing in Parte 2

Esta parte **no deberá presentar filings estatales**.

Acciones prohibidas aquí:

```text
submit_to_state
pay_state_fee
mark_state_approved
create_fake_state_confirmation
```

Su responsabilidad termina en:

```text
ready_to_file
```

y creación de un Filing Package válido.

---

## 3551. Permisos de Parte 2

Permisos conceptuales:

```text
formation.requirement.read
formation.requirement.manage
formation.requirement.verify

formation.document.read
formation.document.generate
formation.document.review
formation.document.supersede

formation.fee.read
formation.fee.manage
formation.fee.quote

formation.review.read
formation.review.perform
formation.review.resolve_finding

formation.signature.read
formation.authorization.request
formation.authorization.read

formation.filing_package.read
formation.filing_package.create
formation.filing_package.approve
formation.partner_handoff.prepare
```

Acciones de alto impacto deberán aplicar least privilege y separación de funciones.

---

## 3552. APIs de Parte 2

APIs conceptuales:

```text
GET  /api/formation/jurisdictions/{code}/requirements
GET  /api/formation/cases/{id}/requirements
POST /api/formation/cases/{id}/requirements/snapshot

POST /api/formation/cases/{id}/documents/generate
GET  /api/formation/cases/{id}/documents
POST /api/formation/documents/{id}/review
POST /api/formation/documents/{id}/supersede

GET  /api/formation/cases/{id}/fees
POST /api/formation/cases/{id}/fee-quotes

POST /api/formation/cases/{id}/reviews
POST /api/formation/review-findings/{id}/resolve

POST /api/formation/cases/{id}/client-confirmations
POST /api/formation/cases/{id}/filing-authorizations

POST /api/formation/cases/{id}/filing-packages
GET  /api/formation/filing-packages/{id}
POST /api/formation/filing-packages/{id}/approve
```

Las APIs de submission al estado pertenecen a Parte 3.

---

## 3553. Eventos de Dominio de Parte 2

```text
FormationRequirementSnapshotCreated
FormationRequirementVersionChanged
FormationDocumentDraftGenerated
FormationDocumentValidationFailed
FormationDocumentReadyForReview
FormationDocumentReviewed
FormationReviewFindingCreated
FormationReviewFindingResolved
FormationFeeQuoteCreated
FormationFeeQuoteInvalidated
FormationClientReviewRequested
FormationClientConfirmed
FormationSignatureCompleted
FormationFilingAuthorizationRequested
FormationFilingAuthorizationApproved
FormationFilingAuthorizationRevoked
FormationFilingPackageCreated
FormationFilingPackageApproved
FormationCaseReadyToFile
```

Todos deberán pasar por la infraestructura central de eventos/outbox correspondiente.

---

## 3554. Workflows de Parte 2

Workflows iniciales:

```text
Formation Requirement Snapshot Workflow
Formation Document Generation Workflow
Formation Document Validation Workflow
Formation Internal Review Workflow
Formation Client Review Workflow
Formation Fee Quote Workflow
Formation Signature Workflow
Formation Filing Authorization Workflow
Formation Filing Package Workflow
Formation Partner Pre-Handoff Workflow
```

### Formation Document Workflow

```text
formation_data_complete
→ requirements_captured
→ draft_generated
→ validation
→ internal_review
→ changes_if_required
→ client_review
→ confirmation
→ signatures
→ authorization
→ package_generation
→ ready_to_file
```

### Invalidating Changes Workflow

Si cambia después de aprobación:

```text
legal name
registered agent
public address
ownership/management disclosure
state-specific material answer
effective date
filing option
fee schedule
```

el sistema deberá evaluar automáticamente qué artefactos quedan inválidos:

```text
document draft
client confirmation
signature
authorization
filing package
```

No deberá continuar utilizando versiones obsoletas.

---

## 3555. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Requirement Snapshot para LLC.
2. Crear Requirement Snapshot para corporation.
3. Validar effective-dated requirement.
4. Vincular official source.
5. Detectar requirement sin source verificable.
6. Crear Filing Office.
7. Seleccionar document type correcto.
8. Crear jurisdiction-specific template.
9. Crear nueva template version sin sobrescribir anterior.
10. Generar Formation Document Record.
11. Mapear domain field a filing field.
12. Bloquear required field faltante.
13. Evaluar conditional field.
14. Insertar legal name confirmado sin alteración.
15. Procesar general lawful purpose.
16. Procesar custom purpose con review.
17. Procesar duration.
18. Validar Registered Agent fields.
19. Validar Organizer/Incorporator authority.
20. Procesar LLC member/manager disclosure.
21. Procesar corporation governance fields.
22. Procesar authorized shares.
23. Activar professional-review flag para estructura compleja.
24. Detectar regulated activity.
25. Crear supplemental provision.
26. Validar effective date.
27. Bloquear invalid delayed effective date.
28. Crear expedited option.
29. Registrar state-specific question.
30. Conservar answer source.
31. Generar draft mediante deterministic merge.
32. Confirmar que IA no altera datos confirmados.
33. Ejecutar Formation Validation Engine.
34. Detectar semantic inconsistency.
35. Detectar cross-field inconsistency.
36. Vincular validation result a requirement version.
37. Crear Filing Fee Schedule.
38. Separar government fee de service fee.
39. Crear optional expedited fee con consent.
40. Crear Fee Quote.
41. Invalidar quote cuando cambia fee schedule.
42. Ejecutar Internal Review.
43. Crear blocking finding.
44. Resolver finding.
45. Bloquear `ready_to_file` con finding abierto.
46. Crear Client Document Review.
47. Registrar Client Confirmation.
48. Invalidar confirmation por cambio material.
49. Firmar documento requerido.
50. Confirmar signature audit y document hash.
51. Crear Filing Authorization.
52. Revocar Filing Authorization.
53. Invalidar authorization por cambio material.
54. Ejecutar Ready-to-File Gate.
55. Crear Filing Package.
56. Validar Filing Package Manifest.
57. Confirmar data minimization.
58. Crear partner pre-handoff.
59. Bloquear handoff a partner inactive.
60. Confirmar que Parte 2 no llama state submission API.
61. Probar permisos.
62. Probar APIs.
63. Probar eventos/outbox.
64. Probar audit inmutable.
65. Probar español e inglés.

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. Exista Requirement Snapshot por Formation Case.
2. Exista Requirement Registry versionado.
3. Las reglas sean effective-dated.
4. Las reglas materiales puedan tener source references.
5. Exista Filing Office Registry.
6. Existan Formation Document Types configurables.
7. Exista Document Template Registry.
8. Templates sean versionados.
9. Exista Formation Document Record.
10. Exista Filing Field Mapping.
11. Existan required/optional/conditional fields.
12. Legal name provenga del dato confirmado.
13. Business purpose sea controlado.
14. Duration sea configurable.
15. Registered Agent se valide contra Parte 1.
16. Organizer/Incorporator requiera authority válida.
17. Exista disclosure configurable de members/managers.
18. Exista soporte de corporation governance fields.
19. Exista capital-structure support dentro del scope definido.
20. Existan professional/regulatory review flags.
21. Existan Supplemental Provisions gobernadas.
22. Exista Effective Date handling.
23. Exista Delayed Effective Date validation.
24. Existan expedited options configurables.
25. Existan State-Specific Questions.
26. Cada respuesta material conserve lineage.
27. Exista Document Generation Pipeline.
28. La generación estructurada sea determinística.
29. IA no invente datos legales/materiales.
30. Exista Formation Validation Engine.
31. Exista semantic validation.
32. Exista cross-field validation.
33. Validaciones críticas tengan requirement lineage.
34. Exista Filing Fee Schedule versionado.
35. Government fees estén separados de SG fees.
36. Optional fees requieran selection/consent.
37. Exista Formation Fee Quote.
38. Exista Fee Freshness Validation.
39. Exista Fee Payment Routing model.
40. Exista Internal Formation Review.
41. Exista Internal Review Checklist.
42. Existan Formation Review Findings.
43. Blocking findings impidan avanzar.
44. Exista Client Document Review.
45. Exista Client Confirmation versionada.
46. Cambios materiales invaliden confirmations cuando corresponda.
47. Exista E-Signature integration.
48. Firmas estén ligadas a document version/hash.
49. Exista Filing Authorization.
50. Filing Authorization sea revocable/invalidable.
51. Exista Ready-to-File Gate.
52. Exista Filing Package.
53. Exista Filing Package Manifest.
54. Exista Sensitive Data Minimization.
55. Exista Partner Filing Handoff preparation.
56. Exista Partner Readiness Validation.
57. Parte 2 no presente filings.
58. Existan permisos específicos.
59. Existan APIs específicas.
60. Existan eventos específicos.
61. Existan workflows específicos.
62. Cambios materiales invaliden artefactos downstream apropiados.
63. Toda generación documental sea trazable.
64. Toda autorización material sea auditable.
65. El Formation Case pueda terminar inequívocamente en `ready_to_file`.

### Instrucciones para Codex

Antes de implementar:

1. Lee la Parte 1 completa.
2. Reutiliza Formation Case.
3. Reutiliza Jurisdiction Rule Registry de Parte 1.
4. Reutiliza Documents.
5. Reutiliza Forms.
6. Reutiliza Approvals.
7. Reutiliza E-Signature.
8. Reutiliza Billing/Payments.
9. Reutiliza Provider Registry.
10. Reutiliza Integration Registry.
11. Reutiliza Audit.
12. Implementa Requirement Snapshot.
13. Implementa Requirement Registry effective-dated.
14. Implementa source references.
15. No hardcodees requisitos estatales dentro de componentes UI.
16. Implementa Filing Office Registry.
17. Implementa Formation Document Types.
18. Implementa Document Template Registry.
19. Versiona templates y forms.
20. Implementa Formation Document Record.
21. Implementa Filing Field Mapping.
22. Implementa conditional-field engine.
23. Usa datos confirmados como source values.
24. Implementa business-purpose controls.
25. Implementa duration controls.
26. Implementa registered-agent validation.
27. Implementa organizer/incorporator authority checks.
28. Implementa LLC disclosure mappings.
29. Implementa corporation governance mappings.
30. Limita capital-structure automation.
31. Implementa regulated/professional review flags.
32. Implementa Supplemental Provisions.
33. Implementa Effective Date validation.
34. Implementa expedited filing options como configuración.
35. Implementa State-Specific Questions.
36. Conserva answer lineage.
37. Implementa deterministic Document Generation Pipeline.
38. No uses LLM como source of truth para filing fields.
39. Implementa Formation Validation Engine.
40. Implementa semantic validations.
41. Implementa cross-field validations.
42. Vincula validation results a requirement versions.
43. Implementa Filing Fee Schedule.
44. Versiona fees por effective dates.
45. Separa government fees y service fees.
46. Implementa optional-fee consent.
47. Implementa Fee Quotes.
48. Implementa fee freshness check.
49. Implementa payment-routing abstraction.
50. Implementa Internal Review.
51. Implementa Review Checklist y Findings.
52. Implementa blocking findings.
53. Implementa Client Document Review.
54. Implementa Client Confirmation.
55. Implementa invalidation por cambios materiales.
56. Integra E-Signature.
57. Vincula firma a document hash/version.
58. Implementa Filing Authorization.
59. Implementa Ready-to-File Gate.
60. Implementa Filing Package.
61. Implementa Filing Package Manifest.
62. Minimiza sensitive data.
63. Implementa Partner Pre-Handoff.
64. Implementa Partner Readiness Validation.
65. No implementes state submission dentro de Parte 2.
66. Implementa permissions.
67. Implementa APIs.
68. Implementa events/outbox.
69. Implementa workflows.
70. Implementa audit inmutable.
71. No permitas que IA firme documentos.
72. No permitas que IA autorice filing.
73. No permitas que un fee desactualizado llegue a filing authorization.
74. No permitas ready-to-file con blockers.
75. No marques Parte 2 como lista sin completar requirements → document → validation → review → client confirmation → signature → authorization → filing package.

### Verificación final de Parte 2

Antes de entregar, confirma:

- ¿Cada Formation Case conserva las reglas exactas que utilizó?
- ¿Cada requisito estatal cambiante tiene versión y effective date?
- ¿Los templates no se sobrescriben históricamente?
- ¿Los campos del filing se obtienen de datos confirmados?
- ¿La IA está fuera del camino crítico de autoridad legal/material?
- ¿Las validaciones críticas tienen source lineage?
- ¿Government fees y SG fees aparecen separados?
- ¿Un cambio de fee invalida un quote antiguo?
- ¿Los findings bloqueantes impiden avanzar?
- ¿El cliente confirma exactamente la versión que será utilizada?
- ¿La firma corresponde al documento correcto?
- ¿La autorización corresponde al package y fee correctos?
- ¿El package contiene solo datos necesarios?
- ¿La Parte 2 termina en `ready_to_file` sin presentar nada al estado?
- ¿Toda acción material queda auditada?

---

# Parte 3 — Filing Estatal, Pagos, Submission Tracking, Rechazo, Aprobación, Documentos Finales y Operating Agreement

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 32 — Parte 2  
**Secciones incluidas:** 3556–3620  
**Audiencia:** Owner, Codex, formation specialists, reviewers, administrators, operations, partners, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Filing estatal ejecutado únicamente desde un package autorizado y vigente, con pagos trazables, idempotencia, seguimiento del estado, manejo controlado de rechazos, verificación de aprobación y generación versionada de documentos finales

## 3556. Objetivo de Parte 3

Esta parte define cómo un Formation Case que terminó la Parte 2 en `ready_to_file` avanza hacia submission, processing, rejection/correction o approval.

Deberá administrar:

- ejecución del filing;
- método de submission;
- government fee payment;
- submission tracking;
- receipts;
- status normalization;
- rejections;
- corrections;
- resubmissions;
- approvals;
- state entity identifiers;
- stamped/approved documents;
- final formation package;
- Operating Agreement;
- client delivery.

## 3557. Principio central de filing

```text
Ready-to-File Package
→ final freshness checks
→ authorization validation
→ payment authorization
→ controlled submission
→ submission receipt
→ state processing
→ status tracking
→ rejection or approval
→ verified final records
→ final document package
```

Nunca:

```text
draft formation data
→ direct portal submission
```

ni:

```text
rejection
→ AI guesses correction
→ silent resubmission
```

## 3558. Filing Execution Modes

Modos conceptuales:

```text
direct_api
provider_api
partner_managed
controlled_browser_worker
manual_staff_submission
client_self_file_assisted
```

Cada jurisdicción/provider deberá declarar cuáles están habilitados.

## 3559. State Filing Submission

Campos:

```text
id
formationCaseId
filingPackageId
jurisdictionCode
entityType
filingOfficeId
submissionMode
providerConnectionId
partnerId
idempotencyKey
governmentFeeQuoteId
authorizationId
status
submittedAt
submittedBy
externalSubmissionId
createdAt
updatedAt
```

Cada intento deberá ser independiente e inmutable por versión.

## 3560. Filing Submission Status

```text
draft
queued
pre_submit_validation
payment_pending
ready_to_submit
submitting
submitted
processing
additional_information_requested
rejected
correction_required
ready_to_resubmit
resubmitting
approved
withdrawal_requested
withdrawn
failed
cancelled
unknown
```

## 3561. Filing Channel Record

Campos:

```text
id
jurisdictionCode
filingOfficeId
entityType
channelType
providerCode
supportsOnlineSubmission
supportsStatusLookup
supportsExpedited
supportsAttachments
supportsElectronicPayment
status
effectiveFrom
effectiveTo
```

La selección deberá provenir de configuración versionada.

## 3562. Filing Adapter Contract

Cada adapter deberá implementar, si aplica:

```text
validatePackage()
quoteGovernmentFee()
createSubmission()
submit()
getSubmissionStatus()
downloadReceipt()
downloadApprovedDocuments()
respondToCorrectionRequest()
cancelIfSupported()
```

La lógica de dominio no deberá depender de un portal estatal específico.

## 3563. Direct API Submission

Cuando exista API:

- autenticación segura;
- idempotency;
- request hash;
- response reference;
- secretos fuera del Formation Case;
- retries registrados;
- payload derivado del Filing Package autorizado.

## 3564. Controlled Portal / Browser Submission

Cuando sea necesario utilizar un portal web:

- allowlist de dominios;
- secret management;
- sesión aislada;
- evidencia cuando proceda;
- human checkpoint para datos materiales;
- timeout;
- retry limitado;
- audit trail.

La IA no deberá navegar y presentar filings libremente.

## 3565. Partner-Managed Filing

Campos del handoff:

```text
handoffId
formationCaseId
filingPackageId
partnerId
deliveryMethod
sentAt
acceptedAt
partnerCaseReference
governmentFeeResponsibility
serviceFeeResponsibility
status
```

El partner deberá confirmar recepción.

## 3566. Manual Staff Submission

El usuario autorizado deberá:

- abrir el Filing Package final;
- reautenticarse cuando aplique;
- confirmar jurisdiction;
- confirmar entity type;
- confirmar legal name;
- confirmar government fee;
- registrar submission evidence.

## 3567. Pre-Submit Revalidation

Antes de enviar:

- Filing Package vigente;
- Requirement Snapshot vigente;
- authorization vigente;
- signatures completas;
- fee quote vigente;
- registered agent válido;
- legal name consistente;
- attachments completos;
- required fields completos;
- blocking findings resueltos;
- payment readiness.

Resultado:

```text
pass
warning
blocked
```

`blocked` impide submission.

## 3568. Filing Authorization Freshness

La autorización deberá vincularse a:

```text
filingPackageId
filingPackageHash
governmentFeeQuoteId
authorizedAmount
submissionMode
authorizedAt
```

Cambios materiales deberán requerir nueva autorización según policy.

## 3569. Government Fee Quote Freshness

Validaciones:

```text
quote.status == valid
currentTime <= quote.expiresAt
jurisdiction == quote.jurisdiction
entityType == quote.entityType
filingOption == quote.filingOption
```

Una quote expirada no podrá cobrarse silenciosamente.

## 3570. Payment Execution

El workflow deberá separar:

```text
customer payment authorization
government fee funding
government fee execution
SG Solutions service fee
partner fee
```

## 3571. Government Fee Payment Record

Campos:

```text
id
formationCaseId
submissionId
jurisdictionCode
feeType
quotedAmount
paidAmount
paymentMethodType
paymentProviderReference
stateReceiptReference
paymentStatus
paidAt
refundedAt
createdAt
```

No se almacenará raw card data.

## 3572. Separation of Government and SG Fees

Categorías:

```text
government_filing_fee
expedited_government_fee
registered_agent_partner_fee
SG_service_fee
other_optional_fee
```

Una tarifa de SG Solutions nunca se etiquetará como government fee.

## 3573. Submission Idempotency

Clave conceptual:

```text
hash(
  formationCaseId
  + filingPackageHash
  + jurisdiction
  + filingOption
  + authorizationId
)
```

Antes de reintentar deberá comprobarse si el estado pudo recibir el filing.

## 3574. Submission Lock

Durante `submitting`, el Filing Package deberá quedar bloqueado.

Cambios materiales:

```text
stop current attempt
→ create new package version
→ revalidate
→ reauthorize when required
```

## 3575. State Confirmation Number

Campos:

```text
confirmationNumber
externalSubmissionId
receivedAt
source
evidenceDocumentId
```

## 3576. Submission Receipt

Deberá almacenarse cualquier:

- receipt;
- acknowledgment;
- payment confirmation;
- submission confirmation page;
- provider acknowledgment;
- partner acknowledgment.

## 3577. Submission Timeline

Timeline mínima:

```text
ready_to_file
payment_authorized
submitting
submitted
state_received
processing
status_updated
rejected_or_approved
final_documents_received
```

## 3578. Filing Status Tracking

Orden de preferencia:

1. webhook/provider event;
2. official API;
3. partner status feed;
4. controlled polling;
5. manual verification.

## 3579. Webhooks and Polling

Webhooks:

- authenticated;
- idempotent;
- deduplicated;
- Inbox;
- audit.

Polling:

- rate limits;
- backoff;
- scheduled next check;
- failure threshold;
- human escalation.

## 3580. Manual Status Verification

Campos:

```text
submissionId
checkedAt
checkedBy
sourceUrlOrReference
externalStatusObserved
normalizedStatus
evidenceDocumentId
notes
```

## 3581. External Status Normalization

Conservar:

```text
externalStatusRaw
externalStatusCode
normalizedStatus
mappingVersion
```

Nunca sobrescribir el valor externo original.

## 3582. Processing-Time Estimate

Podrá calcularse por:

- jurisdiction;
- filing option;
- provider estimate;
- partner estimate;
- historical data.

Siempre deberá etiquetarse como `estimate`, nunca garantía.

## 3583. Expedited Filing Tracking

Campos:

```text
expeditedOptionCode
quotedProcessingWindow
governmentFee
providerFee
submittedAsExpedited
stateConfirmation
```

## 3584. Filing Status Discrepancy

Ejemplo:

```text
provider = approved
official portal = processing
```

Crear:

```text
filing_status_discrepancy
```

y bloquear downstream irreversible hasta resolver.

## 3585. Filing Rejection Record

Campos:

```text
id
submissionId
rejectionCode
externalReason
normalizedReason
receivedAt
responseDeadline
rejectionDocumentId
severity
requiresClientInput
status
createdAt
```

## 3586. Rejection Taxonomy

```text
name_issue
registered_agent_issue
address_issue
missing_information
invalid_field
signature_issue
payment_issue
fee_issue
attachment_issue
entity_type_issue
purpose_or_provision_issue
duplicate_or_existing_entity_issue
portal_or_provider_error
state_specific_requirement
unknown
```

## 3587. Rejection Evidence

Vincular:

- rejection notice;
- state message;
- provider message;
- screenshot cuando proceda;
- timestamp;
- external reference number.

## 3588. Rejection Review

Clasificación operacional:

```text
clerical_fix
client_confirmation_required
new_signature_required
new_authorization_required
additional_fee_required
legal_or_professional_review_required
partner_action_required
```

La IA podrá resumir, no decidir silenciosamente.

## 3589. Corrective Action Plan

Campos:

```text
id
rejectionId
requiredChanges
responsibleParty
documentsAffected
feeImpact
authorizationImpact
signatureImpact
deadline
reviewStatus
createdAt
```

## 3590. Client Input After Rejection

La solicitud al cliente deberá ser específica y explicar exactamente qué dato falta o debe corregirse.

## 3591. Regenerated Filing Documents

```text
old document version
→ superseded
new document version
→ generated
→ reviewed
→ confirmed/signed as required
```

La versión rechazada se conserva.

## 3592. Additional Fees After Rejection

Valores:

```text
no_additional_fee
new_government_fee
partner_resubmission_fee
optional_service_fee
unknown_pending_confirmation
```

Todo nuevo cargo deberá seguir su autorización correspondiente.

## 3593. Resubmission

Crear un nuevo `StateFilingSubmission`.

Campos adicionales:

```text
previousSubmissionId
rejectionId
correctiveActionPlanId
resubmissionSequence
```

## 3594. Multiple Rejection History

Ejemplo:

```text
Submission #1
→ Rejection #1
→ Correction #1
→ Submission #2
→ Rejection #2
→ Correction #2
→ Submission #3
```

## 3595. Rejection Escalation

Escalar si:

- rejection repetido;
- deadline cercano;
- causa fuera de scope;
- conflicto regulatorio;
- partner sin respuesta;
- modificación material ambigua.

## 3596. No Silent Substitution

No sustituir automáticamente:

- legal name;
- registered agent;
- owner/member;
- manager;
- incorporator;
- business purpose;
- share structure;
- effective date.

Cambios materiales requieren review y nueva confirmación/autorización cuando aplique.

## 3597. Approval Detection

Solo pasar a `approved` con evidencia suficiente:

- official approval response;
- approved entity record;
- stamped formation document;
- certificate;
- partner-confirmed official approval;
- verified official lookup.

## 3598. Formation Approval Record

Campos:

```text
id
formationCaseId
submissionId
jurisdictionCode
approvalDate
effectiveDate
stateEntityId
approvedLegalName
approvalSource
approvalDocumentIds
verifiedAt
verifiedBy
status
createdAt
```

## 3599. Approval Date versus Effective Date

Distinguir:

```text
approvalDate
effectiveDate
filingDate
submissionDate
```

No asumir que son iguales.

## 3600. State Entity Identifier

Tipos:

```text
file_number
entity_number
charter_number
document_number
registration_number
other
```

Campos:

```text
identifierType
identifierValue
issuingAuthority
verifiedAt
```

## 3601. Approved Legal Name

`approvedLegalName` deberá provenir de evidencia oficial.

Si difiere del requested name:

- crear discrepancy;
- revisar;
- no sobrescribir Organization.legalName silenciosamente.

## 3602. Approved / Stamped Formation Documents

Tipos:

```text
stamped_articles
filed_articles
certificate_of_formation
certificate_of_organization
certificate_of_incorporation
state_receipt
official_acknowledgment
other_official_document
```

## 3603. Approval Document Verification

Validar cuando sea posible:

- jurisdiction;
- legal name;
- state/entity identifier;
- filing/effective date;
- document type;
- page count/hash;
- source;
- case match.

## 3604. Final Formation Record

Campos:

```text
formationCaseId
organizationId
legalName
entityType
jurisdiction
formationDate
effectiveDate
stateEntityIdentifier
registeredAgentReference
principalAddressReference
ownershipSnapshotReference
managementSnapshotReference
approvalRecordId
```

## 3605. Final Formation Document Package

Podrá incluir:

- official filed/stamped document;
- certificate/approval;
- state receipt;
- filing summary;
- registered agent docs;
- Operating Agreement;
- bylaws/initial governance docs cuando aplique;
- next-steps summary.

Cada item deberá indicar:

```text
official
SG_generated
partner_generated
informational
```

## 3606. Final Document Versioning and Retention

Cada documento final deberá:

- ser inmutable por versión;
- conservar hash;
- conservar source;
- conservar timestamps;
- conservar superseded relationships;
- respetar retention/legal hold.

## 3607. Operating Agreement Applicability

Valores:

```text
included_in_service
optional_add_on
partner_provided
client_provided
professional_review_required
not_applicable
```

## 3608. Operating Agreement Generator

Pipeline:

```text
confirmed formation data
→ governance inputs
→ applicable template version
→ conditional clauses
→ deterministic generation
→ validation
→ internal review when required
→ client review
→ signatures
→ final version
```

## 3609. Operating Agreement Data Sources

Usar:

- approved Organization record;
- approved legal name;
- effective formation date;
- members;
- ownership snapshot;
- management structure;
- principal office;
- registered agent reference;
- capital/contribution inputs;
- confirmed governance selections.

## 3610. Operating Agreement Template Registry

Campos:

```text
id
templateCode
jurisdictionScope
entitySubtype
managementType
memberCountScope
version
effectiveFrom
effectiveTo
reviewStatus
sourceReferences
status
```

Ejemplos:

```text
single_member_member_managed
multi_member_member_managed
multi_member_manager_managed
```

## 3611. Management Provisions

Reflejar consistentemente:

```text
member_managed
manager_managed
```

Podrá incluir authority, voting framework, manager appointment, limitations y records responsibilities.

## 3612. Member and Ownership Schedule

Campos:

```text
memberId
memberName
ownershipPercentage
membershipUnits
effectiveDate
status
```

No mezclar modelos incompatibles de ownership.

## 3613. Capital Contributions

Campos:

```text
memberId
contributionType
cashAmount
propertyDescription
agreedValue
contributionDate
futureCommitment
evidenceReference
```

Clasificación:

```text
initial_contribution
future_commitment
loan_to_company
unknown_requires_review
```

## 3614. Allocations and Distributions

Las reglas económicas deberán provenir de configuraciones soportadas.

Configuraciones complejas deberán activar:

```text
professional_review_required
```

## 3615. Transfers, Admission, Withdrawal and Buyout Provisions

El template podrá contemplar:

- transfer restrictions;
- admission of new members;
- voluntary withdrawal;
- death/incapacity;
- dissolution triggers;
- buyout process.

Personalizaciones materiales deberán quedar como `custom_governance_terms`.

## 3616. Operating Agreement Signature Workflow

Campos:

```text
documentId
documentVersion
documentHash
requiredSignerIds
signatureOrder
signatureStatus
signedAt
completedAt
```

Cambios posteriores deberán invalidar firmas afectadas.

## 3617. Corporation Governance Documents

Preparado para:

- bylaws;
- incorporator action;
- initial director action;
- organizational resolutions;
- initial share authorization records.

El detalle ampliado se desarrolla en Parte 4.

## 3618. Client Final Delivery

El cliente deberá recibir:

- approval confirmation;
- official state documents;
- formation summary;
- Operating Agreement/bylaws incluidos;
- receipts;
- next-step checklist;
- completed vs pending services.

Estados:

```text
final_package_preparing
ready_for_client
published_to_client
client_viewed
superseded
```

## 3619. Permisos, APIs, Eventos y Workflows de Parte 3

### Permisos

```text
business_formation.filing.read
business_formation.filing.submit
business_formation.filing.status.read
business_formation.filing.status.manage

business_formation.payment.read
business_formation.payment.execute

business_formation.rejection.read
business_formation.rejection.review
business_formation.rejection.correct
business_formation.rejection.resubmit

business_formation.approval.read
business_formation.approval.verify

business_formation.final_documents.read
business_formation.final_documents.manage

business_formation.operating_agreement.read
business_formation.operating_agreement.generate
business_formation.operating_agreement.review
business_formation.operating_agreement.sign
```

### APIs

```text
POST /api/business-formation/cases/{id}/filing-submissions
GET  /api/business-formation/filing-submissions/{id}
POST /api/business-formation/filing-submissions/{id}/submit
POST /api/business-formation/filing-submissions/{id}/refresh-status

POST /api/business-formation/filing-submissions/{id}/government-fee-payments
GET  /api/business-formation/filing-submissions/{id}/receipts

GET  /api/business-formation/filing-submissions/{id}/rejections
POST /api/business-formation/rejections/{id}/corrective-plans
POST /api/business-formation/rejections/{id}/resubmit

POST /api/business-formation/cases/{id}/approval-verifications
GET  /api/business-formation/cases/{id}/final-documents

POST /api/business-formation/cases/{id}/operating-agreements
POST /api/business-formation/operating-agreements/{id}/review
POST /api/business-formation/operating-agreements/{id}/signature-request

POST /api/business-formation/cases/{id}/final-package
POST /api/business-formation/cases/{id}/publish-final-package
```

### Eventos

```text
FormationFilingSubmissionCreated
FormationFilingPreSubmitValidated
FormationGovernmentFeePaid
FormationFilingSubmitted
FormationFilingReceiptReceived
FormationFilingStatusChanged
FormationFilingRejected
FormationCorrectiveActionPlanCreated
FormationFilingResubmitted
FormationFilingApproved
FormationApprovalVerified
FormationStateEntityIdentifierRecorded
FormationOfficialDocumentReceived
FormationFinalPackageGenerated
FormationOperatingAgreementGenerated
FormationOperatingAgreementSigned
FormationFinalPackagePublished
```

### Workflows

```text
Formation Filing Submission Workflow
Government Fee Payment Workflow
Formation Filing Tracking Workflow
Formation Rejection Resolution Workflow
Formation Resubmission Workflow
Formation Approval Verification Workflow
Formation Final Document Workflow
Operating Agreement Workflow
Formation Final Package Delivery Workflow
```

## 3620. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear State Filing Submission desde `ready_to_file`.
2. Bloquear submission desde case no autorizado.
3. Seleccionar filing channel.
4. Ejecutar pre-submit revalidation.
5. Bloquear fee quote expirada.
6. Bloquear authorization cuyo package hash cambió.
7. Ejecutar government fee payment.
8. Separar government fee de SG fee.
9. Crear idempotency key.
10. Reintentar sin duplicar submission.
11. Bloquear edición material durante `submitting`.
12. Registrar external submission ID.
13. Registrar confirmation number.
14. Guardar receipt.
15. Crear timeline.
16. Procesar webhook duplicado idempotentemente.
17. Ejecutar polling con backoff.
18. Registrar manual status verification.
19. Conservar raw external status.
20. Normalizar status.
21. Mostrar estimate como estimación.
22. Registrar expedited option.
23. Detectar status discrepancy.
24. Crear rejection record.
25. Conservar rejection text original.
26. Clasificar rejection.
27. Vincular evidence.
28. Crear rejection review.
29. Crear Corrective Action Plan.
30. Solicitar client input específico.
31. Regenerar documento.
32. Conservar versión rechazada.
33. Detectar additional fee.
34. Obtener autorización adicional cuando aplique.
35. Crear nuevo submission de resubmission.
36. Vincular previousSubmissionId.
37. Conservar múltiples rejections.
38. Crear escalation.
39. Bloquear silent substitution.
40. Detectar approval.
41. Crear Formation Approval Record.
42. Separar approval/effective date.
43. Registrar State Entity Identifier.
44. Detectar approved-name discrepancy.
45. Importar official documents.
46. Verificar documentos.
47. Bloquear finalization con mismatch.
48. Crear Final Formation Record.
49. Crear Final Formation Package.
50. Versionar final documents.
51. Evaluar OA applicability.
52. Generar single-member OA.
53. Generar multi-member OA.
54. Generar manager-managed OA.
55. Usar solo approved/confirmed data.
56. Versionar OA template.
57. Generar ownership schedule.
58. Registrar capital contributions.
59. Activar professional review para términos complejos.
60. Solicitar firmas.
61. Invalidar firmas tras cambio material.
62. Preparar corporation governance docs.
63. Publicar final package.
64. Registrar client viewed.
65. Probar audit trail completo.

### Criterios de aceptación

La Parte 3 estará completa cuando:

1. Exista State Filing Submission.
2. Existan múltiples execution modes.
3. Exista Filing Channel Registry.
4. Exista adapter architecture.
5. Exista pre-submit revalidation.
6. Authorization esté vinculada al package exacto.
7. Exista fee freshness check.
8. Government y SG fees estén separadas.
9. Exista Government Fee Payment Record.
10. Exista submission idempotency.
11. Exista submission locking.
12. Exista confirmation/reference tracking.
13. Existan receipts.
14. Exista timeline.
15. Exista status tracking.
16. Existan webhooks/polling/manual verification.
17. Se conserve external raw status.
18. Exista status normalization.
19. Processing time se presente como estimate.
20. Exista expedited tracking.
21. Exista discrepancy handling.
22. Exista Filing Rejection Record.
23. Exista rejection taxonomy.
24. Todo rejection conserve evidencia.
25. Exista Rejection Review.
26. Exista Corrective Action Plan.
27. Exista client-input workflow.
28. Exista document regeneration.
29. Exista additional-fee handling.
30. Resubmission cree nuevo intento.
31. Exista rejection history.
32. Exista escalation.
33. No exista silent substitution.
34. Exista Approval Detection.
35. Exista Formation Approval Record.
36. Approval/effective/filing dates estén separadas.
37. Exista State Entity Identifier.
38. Approved legal name tenga source oficial.
39. Existan official formation documents.
40. Exista document verification.
41. Exista Final Formation Record.
42. Exista Final Formation Package.
43. Final documents estén versionados.
44. Exista OA applicability.
45. Exista deterministic OA generator.
46. OA utilice approved/confirmed data.
47. Exista OA Template Registry.
48. Management provisions sean consistentes.
49. Exista ownership schedule.
50. Existan capital contributions.
51. Términos complejos activen review.
52. Exista OA signature workflow.
53. Firmas estén vinculadas a hash/version.
54. Exista soporte de governance docs.
55. Exista client final delivery.
56. Existan permisos.
57. Existan APIs.
58. Existan eventos.
59. Existan workflows.
60. Todo submission sea trazable al Filing Package.
61. Todo fee sea trazable.
62. Todo rejection sea trazable.
63. Toda aprobación sea verificable.
64. Toda versión final sea inmutable.
65. Parte 3 termine con package final listo para post-formation.

### Instrucciones para Codex

1. Lee Partes 1 y 2.
2. Reutiliza Formation Case.
3. Reutiliza Filing Package.
4. Reutiliza Filing Authorization.
5. Reutiliza Requirement Snapshot.
6. Reutiliza Provider Registry.
7. Reutiliza Integration Registry.
8. Reutiliza Billing/Payments.
9. Reutiliza Documents.
10. Reutiliza E-Signature.
11. Reutiliza Audit.
12. Implementa State Filing Submission versionado.
13. Implementa Filing Channel Registry.
14. Implementa adapters.
15. No acoples dominio a portal estatal.
16. Implementa controlled browser worker solo cuando sea necesario.
17. Implementa partner-managed filing.
18. Implementa manual staff submission.
19. Implementa pre-submit validation.
20. Verifica authorization freshness.
21. Verifica fee freshness.
22. Separa government y SG fees.
23. Implementa Government Fee Payment Record.
24. Nunca almacenes raw card data.
25. Implementa idempotency.
26. Implementa submission lock.
27. Implementa confirmation/receipt capture.
28. Implementa immutable timeline.
29. Implementa webhook processing.
30. Implementa polling fallback.
31. Implementa manual verification.
32. Conserva raw external status.
33. Etiqueta processing time como estimate.
34. Implementa expedited tracking.
35. Implementa discrepancy handling.
36. Implementa Filing Rejection.
37. Conserva rejection evidence.
38. Implementa Rejection Review.
39. Implementa Corrective Action Plan.
40. Implementa client input.
41. Regenera documentos por versión.
42. No sobrescribas documentos rechazados.
43. Implementa additional-fee authorization.
44. Implementa resubmission como nuevo intento.
45. Conserva submission chain.
46. Implementa escalation.
47. Prohíbe silent substitutions.
48. Implementa Approval Detection.
49. Implementa Formation Approval Record.
50. Separa fechas.
51. Implementa State Entity Identifier.
52. Implementa approved-name discrepancy handling.
53. Implementa official document ingestion.
54. Implementa document verification.
55. Implementa Final Formation Record.
56. Implementa Final Formation Package.
57. Versiona final documents.
58. Implementa OA applicability.
59. Implementa deterministic OA generator.
60. Implementa OA Template Registry.
61. Usa datos approved/confirmed.
62. Implementa governance provisions.
63. Implementa ownership schedule.
64. Implementa capital contributions.
65. Envía términos complejos a professional review.
66. Implementa E-Signature.
67. Invalida firmas si cambia document hash.
68. Prepara corporation governance docs.
69. Implementa client final delivery.
70. Implementa permissions/APIs/events/workflows/audit.
71. No marques Parte 3 lista sin completar ready-to-file → submission → status → rejection/approval → verified final package.

### Verificación final

- ¿Solo puede presentarse el package exacto autorizado?
- ¿La fee quote sigue vigente?
- ¿Un retry evita filing duplicado?
- ¿El package queda bloqueado durante submission?
- ¿Cada submission conserva confirmation y receipt?
- ¿Los estados externos conservan raw value?
- ¿Los rechazos nunca se corrigen silenciosamente?
- ¿Cada resubmission es un nuevo intento?
- ¿Los documentos rechazados se conservan?
- ¿La aprobación tiene evidencia oficial?
- ¿Approval Date y Effective Date están separadas?
- ¿El State Entity Identifier tiene source?
- ¿Los documentos finales corresponden al case correcto?
- ¿El Operating Agreement usa datos aprobados?
- ¿Las firmas pertenecen a la versión exacta?
- ¿El cliente recibe un package final trazable?
- ¿Toda acción material queda auditada?

---

# Parte 4 — Post-Formation, Organizational Actions, Records, Banking Readiness, Licencias Iniciales y Handoffs

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 32 — Parte 3  
**Secciones incluidas:** 3621–3685  
**Audiencia:** Owner, Codex, formation specialists, reviewers, compliance, tax, bookkeeping, funding, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Post-formation coordinado, trazable y modular; cada acción posterior a la aprobación deberá derivarse del registro oficial aprobado, separar servicios incluidos de servicios pendientes y crear handoffs explícitos hacia los módulos correspondientes

## 3621. Objetivo de Parte 4

Esta parte define lo que sucede después de que la entidad ha sido oficialmente aprobada.

Deberá cubrir:

- activation del Organization record;
- organizational actions;
- ownership/governance records;
- company record book;
- initial resolutions/consents;
- banking readiness;
- EIN handoff;
- licensing readiness;
- state/local registrations;
- DBA/trade-name screening;
- compliance calendar;
- annual-report readiness;
- bookkeeping handoff;
- tax handoff;
- funding handoff;
- client post-formation workspace;
- next-step orchestration.

La aprobación estatal no deberá interpretarse como que todas las obligaciones posteriores están completas.

## 3622. Principio central post-formation

```text
Verified state approval
→ activate organization
→ establish governance records
→ build company record book
→ identify pending registrations
→ prepare banking readiness
→ create module handoffs
→ publish client next steps
→ monitor completion
```

Nunca:

```text
state approval
→ mark everything complete
```

## 3623. Post-Formation Workspace

Cada Formation Case aprobado deberá abrir un Post-Formation Workspace.

Deberá mostrar:

- entity identity;
- state entity identifier;
- formation/effective date;
- ownership;
- management;
- official documents;
- governance documents;
- EIN status;
- banking readiness;
- licensing status;
- compliance readiness;
- tax handoff;
- bookkeeping handoff;
- funding readiness;
- open tasks;
- client actions.

## 3624. Post-Formation Status

Estados:

```text
not_started
initializing
governance_pending
records_pending
registrations_pending
client_action_required
handoffs_in_progress
ready_for_completion
completed
blocked
archived
```

`completed` no deberá utilizarse mientras exista un deliverable obligatorio del servicio principal sin resolver.

## 3625. Post-Formation Plan

Campos:

```text
id
formationCaseId
organizationId
effectiveDate
requiredActions
optionalActions
handoffs
clientTasks
internalTasks
blockingItems
status
createdAt
completedAt
```

El plan deberá generarse desde requirements versionados y alcance contratado.

## 3626. Organization Activation

Al aprobarse la formación, el Organization record deberá pasar de estado provisional a entidad activa.

Campos mínimos confirmados:

```text
legalName
entityType
formationJurisdiction
formationDate
effectiveDate
stateEntityIdentifier
registeredAgentReference
principalAddressReference
ownershipSnapshotReference
managementSnapshotReference
formationApprovalRecordId
```

Solo podrán usarse datos aprobados/verificados.

## 3627. Organization Activation Gate

Antes de activar deberá comprobarse:

- Formation Approval verificada;
- approved legal name;
- official identifier;
- jurisdiction;
- effective date;
- no unresolved approval discrepancy;
- ownership snapshot disponible;
- management snapshot disponible;
- official formation document disponible cuando corresponda.

## 3628. Company Record Book

Cada Organization deberá disponer de un record book lógico.

Categorías:

```text
formation
governance
ownership
tax
banking
licenses
compliance
contracts
resolutions
amendments
annual_records
```

El record book podrá ser virtual y no deberá duplicar documentos innecesariamente.

## 3629. Record Book Index

Campos:

```text
id
organizationId
recordType
documentId
documentVersion
effectiveDate
status
sourceModule
addedAt
addedBy
```

El índice deberá apuntar al documento fuente original.

## 3630. Governance Snapshot

La plataforma deberá crear un snapshot inicial de gobierno.

Campos:

```text
organizationId
entityType
managementType
members
managers
directors
officers
authorizedPersons
effectiveDate
sourceDocuments
version
```

El snapshot deberá poder evolucionar mediante cambios posteriores sin borrar el estado inicial.

## 3631. LLC Initial Organizational Consent

Para LLCs soportadas podrá generarse un initial consent/resolution que documente, según aplique:

- aceptación de Articles/Certificate;
- adopción del Operating Agreement;
- confirmation de members;
- appointment de managers;
- authorization para EIN;
- authorization para banking;
- fiscal/accounting selections;
- initial business actions.

Deberá utilizar templates versionados.

## 3632. Corporation Organizational Action

Para corporations podrá prepararse:

- incorporator action;
- initial board consent;
- appointment of directors;
- appointment of officers;
- adoption of bylaws;
- banking authorization;
- share issuance authorization;
- fiscal-year decisions;
- other initial resolutions.

Las acciones disponibles dependerán de entity type y scope contratado.

## 3633. Organizational Action Record

Campos:

```text
id
organizationId
actionType
governanceBody
effectiveDate
documentId
documentHash
requiredApprovers
approvalStatus
signatureStatus
createdAt
```

## 3634. Bylaws Finalization

Cuando corresponda, los bylaws deberán:

- provenir de template aplicable;
- usar approved organization data;
- estar versionados;
- pasar validation;
- soportar client/internal review;
- conservar signatures/consents cuando sean requeridos.

Personalizaciones materiales deberán activar review adicional.

## 3635. Ownership Register

Cada entidad deberá tener un registro interno de ownership.

Campos:

```text
id
organizationId
ownerType
ownerId
ownerName
ownershipInstrument
ownershipPercentage
unitsOrShares
effectiveFrom
effectiveTo
sourceDocumentId
status
```

No deberá sustituir registros oficiales requeridos por ley cuando exista un sistema separado.

## 3636. LLC Member Ledger

Para LLCs podrá registrar:

```text
memberId
admissionDate
ownershipPercentage
units
initialContribution
additionalContributions
transfers
withdrawalDate
status
```

Los cambios futuros deberán quedar versionados.

## 3637. Corporation Stock Ledger

Para corporations deberá estar preparado para:

```text
shareClass
authorizedShares
issuedShares
certificateOrBookEntryId
shareholderId
issueDate
consideration
transferHistory
status
```

No deberán emitirse shares automáticamente sin authorization/governance action correspondiente.

## 3638. Equity Consistency Validation

El sistema deberá validar:

- ownership total cuando use porcentajes;
- issued shares <= authorized shares;
- owner identity consistency;
- effective dates;
- duplicate ownership records;
- governance approval;
- consistency con Operating Agreement/bylaws/resolutions.

Conflictos deberán bloquear downstream relevante.

## 3639. Officers, Directors, Managers and Authorized Persons

Deberán registrarse por separado.

Campos:

```text
personId
roleType
title
effectiveFrom
effectiveTo
appointingActionId
authorityScope
status
```

No deberá inferirse que un member es manager u officer sin evidencia.

## 3640. Authority Matrix

La plataforma podrá mantener:

```text
can_open_bank_account
can_sign_contracts
can_authorize_payments
can_manage_tax_matters
can_manage_bookkeeping
can_manage_filing_changes
can_invite_users
```

La matriz deberá provenir de governance records o delegaciones explícitas.

## 3641. EIN Handoff

La solicitud/gestión del EIN deberá salir del Módulo 32 hacia el Módulo 33.

El handoff deberá incluir:

```text
organizationId
approvedLegalName
entityType
formationDate
principalAddress
mailingAddress
responsiblePartyCandidate
ownershipSnapshot
managementSnapshot
stateEntityIdentifier
sourceDocuments
requestedStartDate
```

El Módulo 32 no deberá inventar ni simular un EIN.

## 3642. EIN Status Visibility

Aunque la ejecución pertenezca al Módulo 33, Business Formation deberá mostrar:

```text
not_requested
handoff_ready
in_progress
client_action_required
issued
failed
not_applicable
```

Si el EIN aún no existe, deberá decir claramente `pending`.

## 3643. Banking Readiness

La plataforma deberá producir una evaluación de readiness, no una garantía de apertura.

Estados:

```text
not_started
missing_ein
missing_governance_document
missing_owner_information
ready
bank_selected
application_in_progress
opened
declined_or_unavailable
```

## 3644. Banking Readiness Checklist

Checklist conceptual:

- official formation document;
- approved legal name;
- state entity identifier;
- EIN cuando requerido;
- Operating Agreement/bylaws;
- ownership information;
- authorized signer;
- principal business address;
- identification documents;
- banking resolution cuando corresponda;
- expected business activity information.

Los requisitos exactos dependen de cada institution.

## 3645. Banking Package

El cliente podrá generar un package organizado con:

```text
formation_certificate_or_articles
ein_confirmation_when_available
operating_agreement_or_bylaws
initial_resolution
ownership_summary
authorized_signer_summary
state_entity_information
```

No deberá incluir PII innecesaria sin purpose.

## 3646. Bank Provider Handoff

Si SG Solutions integra bancos/fintechs mediante Marketplace, deberá crear un handoff explícito.

Campos:

```text
organizationId
productId
partnerId
consentId
dataScope
generatedPackageId
referralTrackingId
status
createdAt
```

SG Solutions no deberá presentarse como banco cuando actúe como marketplace/referral source.

## 3647. No Banking Approval Guarantee

La UI, IA y comunicaciones deberán evitar:

```text
guaranteed approval
guaranteed account opening
guaranteed limits
guaranteed terms
```

El resultado depende de la institución financiera.

## 3648. Initial License Screening

Después de la formación deberá evaluarse si la actividad declarada puede requerir:

- state license;
- local business license;
- professional license;
- industry permit;
- sales-tax registration;
- employer registration;
- federal registration;
- other permit.

El screening deberá producir tareas, no conclusiones legales absolutas cuando haya incertidumbre.

## 3649. License Requirement Registry

Campos:

```text
id
jurisdictionScope
businessActivityCode
licenseType
issuingAuthority
requirementDescription
eligibilityNotes
filingMethod
feeReference
renewalPattern
sourceReference
effectiveFrom
effectiveTo
status
```

La información deberá poder versionarse.

## 3650. License Research Freshness

Debido a que licencias, fees y requisitos cambian, antes de presentar una recomendación material deberá comprobarse la vigencia del requirement.

Estados:

```text
current_verified
current_with_caveat
verification_required
stale
unknown
```

## 3651. License Screening Result

Campos:

```text
organizationId
activity
jurisdiction
potentialRequirementId
applicabilityStatus
confidence
researchStatus
reasoningSummary
clientQuestionIds
reviewStatus
```

## 3652. License Applicability Status

```text
likely_required
possibly_required
likely_not_required
not_applicable
professional_review_required
insufficient_information
```

La IA no deberá transformar `possibly_required` en obligación definitiva sin source/review.

## 3653. License Task

Cuando corresponda, deberá crearse una Task con:

- issuing authority;
- requirement;
- deadline;
- responsible party;
- documents;
- fee estimate/reference;
- current status;
- evidence;
- renewal implications.

## 3654. Sales Tax / Seller Registration Screening

La plataforma deberá estar preparada para detectar actividades que puedan requerir sales-tax/seller registration.

Resultado:

```text
not_evaluated
potentially_required
registration_handoff_ready
registered
not_applicable
professional_review_required
```

La ejecución detallada podrá pertenecer a Tax/Compliance según diseño final.

## 3655. Employer Registration Screening

Si el cliente indica que tendrá employees o payroll, deberá crear handoffs para requisitos aplicables.

Podrá incluir:

- payroll tax registrations;
- state unemployment account;
- workers' compensation readiness;
- payroll provider setup;
- employment compliance tasks.

No deberá asumir que todos aplican en todos los casos.

## 3656. Payroll Handoff

Campos:

```text
organizationId
employeeIntent
plannedFirstPayrollDate
stateJurisdictions
payrollProviderPreference
taxRegistrationNeeds
documentReferences
status
```

El módulo de formation solo prepara el handoff.

## 3657. Registered Agent Continuity

Después de formation deberá confirmarse:

- registered agent vigente;
- service provider;
- service start date;
- renewal date si aplica;
- client vs partner responsibility;
- contact/update path.

## 3658. Registered Agent Handoff

Si el servicio es proporcionado por partner:

```text
partnerId
serviceOrderId
organizationId
jurisdiction
startDate
renewalDate
externalAccountReference
status
```

La plataforma deberá separar partner fee de state fee.

## 3659. Compliance Module Handoff

El Módulo 32 deberá crear el handoff al Módulo 34.

Contenido:

```text
organizationId
entityType
jurisdiction
formationDate
effectiveDate
stateEntityIdentifier
registeredAgent
fiscalYearEndIfKnown
initialComplianceRequirements
licenseScreeningResults
sourceDocuments
```

## 3660. Initial Compliance Calendar

Antes de finalizar Business Formation deberá existir un calendario inicial con eventos conocidos o pendientes de verificación.

Tipos:

```text
annual_report
biennial_report
franchise_tax_related
registered_agent_renewal
license_renewal
permit_renewal
tax_registration_followup
other
```

Las fechas deberán provenir del Módulo 34/Requirement Registry.

## 3661. Annual Report Readiness

La plataforma deberá mostrar:

```text
requirement_identified
due_date_known
verification_required
handoff_complete
not_applicable
```

No deberá inventar una due date cuando la regla estatal esté desactualizada o incompleta.

## 3662. BOI / Ownership Reporting Conditional Handoff

La plataforma deberá soportar obligaciones de ownership reporting únicamente:

```text
when legally applicable
```

La determinación deberá depender de reglas actuales y del Módulo 34.

Estados:

```text
not_evaluated
not_applicable
potentially_applicable
compliance_review_required
handoff_created
```

No deberán hardcodearse obligaciones históricas como universales.

## 3663. DBA / Assumed Name Screening

Si el negocio quiere operar con un nombre distinto al legal, deberá crearse un screening.

Campos:

```text
organizationId
legalName
desiredTradeName
jurisdictions
intendedUse
registrationPotentiallyRequired
searchStatus
handoffStatus
```

## 3664. DBA Handoff

La ejecución podrá tratarse como:

```text
business_formation_add_on
compliance_service
partner_managed
client_self_file
```

El sistema deberá identificar claramente el delivery model.

## 3665. Tax Setup Handoff

El Módulo 32 podrá enviar datos iniciales al ecosistema tributario:

```text
organizationId
entityType
formationDate
ownership
fiscalYearPreference
businessActivity
EINStatus
stateJurisdictions
```

No deberá seleccionar automáticamente una elección tributaria material sin workflow específico.

## 3666. Tax Election Awareness

El cliente podrá ver que ciertas elecciones tributarias pueden existir, pero:

- deberán explicarse sin garantía de beneficio;
- podrán requerir tax professional review;
- deberán considerar deadlines vigentes;
- no deberán activarse solo porque la entidad se formó.

## 3667. Bookkeeping Handoff

Handoff al Módulo 31:

```text
organizationId
approvedLegalName
entityType
formationDate
effectiveDate
ownershipSnapshot
managementSnapshot
EINStatus
initialBankingStatus
businessActivity
requestedBookStartDate
sourceDocuments
```

## 3668. Initial Accounting Setup Readiness

Estados:

```text
not_requested
waiting_for_bank_account
waiting_for_ein
ready_for_bookkeeping_setup
handoff_created
active_in_bookkeeping
```

El bookkeeping podrá comenzar incluso si ciertos items están pendientes cuando la policy lo permita.

## 3669. Business Funding Handoff

El Módulo 32 podrá crear un handoff al Módulo 35 cuando el cliente solicite funding.

Datos permitidos:

```text
organizationId
formationDate
entityType
ownership
EINStatus
bankingStatus
bookkeepingStatus
businessActivity
requestedFundingPurpose
```

No deberá generar una approval prediction desde formation solamente.

## 3670. Fundability Readiness Indicator

Podrá mostrar:

```text
foundation_incomplete
basic_business_identity_ready
banking_pending
financial_records_pending
funding_assessment_ready
```

Esto será un readiness indicator, no una promesa crediticia.

## 3671. Insurance Marketplace Handoff

Cuando sea relevante, podrá ofrecerse handoff para productos de insurance marketplace.

Deberá registrar:

```text
consent
partner
productCategory
organizationId
dataScope
referralTracking
status
```

SG Solutions no deberá presentarse como insurer si actúa como marketplace/referral source.

## 3672. Client Post-Formation Portal

La vista del cliente deberá mostrar categorías:

```text
Formation Completed
Documents
EIN
Banking
Licenses
Compliance
Bookkeeping
Taxes
Funding
Other Recommended Next Steps
```

Cada item deberá indicar claramente:

```text
completed
in_progress
action_required
optional
not_applicable
not_included
```

## 3673. Next-Step Card

Campos:

```text
id
organizationId
stepType
title
description
reason
priority
requiredOrOptional
owner
deadline
destinationModule
status
createdAt
completedAt
```

## 3674. Required versus Optional

La interfaz deberá distinguir visualmente entre:

```text
required
conditional
recommended
optional
informational
```

Una oferta comercial adicional no deberá presentarse como obligación legal.

## 3675. Client Action Request

Podrá utilizarse para:

- sign governance document;
- provide owner ID;
- confirm business activity;
- select banking option;
- answer license question;
- provide EIN-required information;
- upload missing document.

Cada request deberá ser específico y rastreable.

## 3676. Cross-Module Handoff Record

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
rejectedAt
```

## 3677. Handoff Status

```text
draft
ready
sent
received
accepted
questions_returned
rejected
cancelled
completed
superseded
```

## 3678. Handoff Idempotency

Un mismo evento no deberá crear múltiples cases downstream.

Ejemplo:

```text
FormationApproved
→ one EIN handoff
→ one Compliance handoff
```

Retries deberán reutilizar el handoff existente.

## 3679. Shared Data versus Copies

Datos maestros como:

- Organization;
- Person;
- ownership;
- addresses;
- official documents;

deberán referenciarse desde módulos downstream.

No deberán generarse copias divergentes innecesariamente.

## 3680. Post-Formation Human Review Gates

Deberá requerirse review humano para:

- ownership inconsistency;
- custom governance provisions;
- ambiguous license applicability;
- material tax election decision;
- conflicting authority record;
- unclear registered-agent status;
- legal/compliance ambiguity.

## 3681. AI Assistance in Post-Formation

La IA podrá:

- resumir next steps;
- identificar información faltante;
- sugerir license screening questions;
- explicar documentos;
- sugerir handoffs;
- detectar inconsistencias;
- priorizar tasks.

Deberá utilizar datos confirmados y sources vigentes.

## 3682. AI Prohibited Actions

La IA no deberá:

- inventar EIN;
- declarar una licencia definitivamente requerida sin soporte;
- presentar filings adicionales sin authorization;
- modificar ownership;
- emitir shares;
- crear governance authority sin source;
- seleccionar tax election final;
- garantizar bank account/funding approval;
- marcar compliance complete sin evidencia.

## 3683. Permisos, APIs, Eventos y Workflows de Parte 4

### Permisos

```text
business_formation.post_formation.read
business_formation.post_formation.manage

business_formation.governance.read
business_formation.governance.prepare
business_formation.governance.review

business_formation.ownership.read
business_formation.ownership.manage

business_formation.banking_readiness.read
business_formation.banking_readiness.manage

business_formation.license_screening.read
business_formation.license_screening.manage

business_formation.handoff.read
business_formation.handoff.create
business_formation.handoff.accept
```

### APIs

```text
POST /api/business-formation/cases/{id}/post-formation-plan
GET  /api/business-formation/cases/{id}/post-formation

POST /api/business-formation/organizations/{id}/governance-snapshots
POST /api/business-formation/organizations/{id}/organizational-actions
GET  /api/business-formation/organizations/{id}/record-book

POST /api/business-formation/organizations/{id}/banking-readiness
POST /api/business-formation/organizations/{id}/license-screenings

POST /api/business-formation/cases/{id}/handoffs/ein
POST /api/business-formation/cases/{id}/handoffs/compliance
POST /api/business-formation/cases/{id}/handoffs/bookkeeping
POST /api/business-formation/cases/{id}/handoffs/tax
POST /api/business-formation/cases/{id}/handoffs/funding

GET  /api/business-formation/organizations/{id}/next-steps
POST /api/business-formation/next-steps/{id}/complete
```

### Eventos

```text
FormationPostFormationPlanCreated
FormationOrganizationActivated
FormationGovernanceSnapshotCreated
FormationOrganizationalActionCompleted
FormationOwnershipRegisterInitialized
FormationRecordBookInitialized
FormationBankingReadinessEvaluated
FormationLicenseScreeningCompleted
FormationEINHandoffCreated
FormationComplianceHandoffCreated
FormationBookkeepingHandoffCreated
FormationTaxHandoffCreated
FormationFundingHandoffCreated
FormationNextStepCreated
FormationPostFormationCompleted
```

### Workflows

```text
Post-Formation Initialization Workflow
Organization Activation Workflow
Initial Governance Workflow
Company Record Book Workflow
Banking Readiness Workflow
License Screening Workflow
EIN Handoff Workflow
Compliance Handoff Workflow
Bookkeeping Handoff Workflow
Tax Handoff Workflow
Funding Handoff Workflow
Post-Formation Completion Workflow
```

## 3684. Pruebas de Parte 4

Pruebas obligatorias:

1. Crear Post-Formation Plan tras approval.
2. Bloquear plan si approval no está verificada.
3. Activar Organization con datos aprobados.
4. Bloquear activation con discrepancy.
5. Crear record book.
6. Crear record-book index sin duplicar documentos.
7. Crear governance snapshot.
8. Crear LLC initial consent.
9. Crear corporation organizational action.
10. Versionar bylaws.
11. Crear ownership register.
12. Crear LLC member ledger.
13. Crear corporation stock ledger.
14. Bloquear issued shares > authorized shares.
15. Detectar ownership inconsistency.
16. Registrar officers/directors/managers.
17. Crear authority matrix.
18. Crear EIN handoff.
19. Mostrar EIN `pending` sin inventar número.
20. Crear banking-readiness assessment.
21. Detectar missing EIN.
22. Detectar missing governance document.
23. Generar Banking Package.
24. Crear bank-provider handoff con consent.
25. Bloquear guarantee language.
26. Ejecutar initial license screening.
27. Crear License Requirement Registry item.
28. Detectar stale requirement.
29. Crear ambiguous license result.
30. Crear License Task.
31. Ejecutar sales-tax screening.
32. Ejecutar employer screening.
33. Crear payroll handoff.
34. Confirmar registered-agent continuity.
35. Crear registered-agent partner handoff.
36. Crear Compliance handoff.
37. Crear initial compliance calendar.
38. Registrar annual-report readiness.
39. Evaluar conditional ownership-reporting handoff.
40. Crear DBA screening.
41. Crear DBA handoff.
42. Crear Tax Setup handoff.
43. Bloquear automatic tax election.
44. Crear Bookkeeping handoff.
45. Mostrar Accounting Setup readiness.
46. Crear Funding handoff.
47. Mostrar fundability readiness sin approval prediction.
48. Crear Insurance Marketplace handoff.
49. Mostrar post-formation portal.
50. Crear Next-Step Card.
51. Distinguir required/optional.
52. Crear Client Action Request.
53. Crear Cross-Module Handoff.
54. Reintentar handoff idempotentemente.
55. Evitar duplicate downstream case.
56. Verificar shared data references.
57. Activar human review por ownership inconsistency.
58. Probar AI next-step summary.
59. Bloquear AI license conclusion sin source.
60. Bloquear AI ownership modification.
61. Probar permisos.
62. Probar APIs.
63. Probar eventos/outbox.
64. Probar workflows.
65. Probar immutable audit.

## 3685. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 4 estará completa cuando:

1. Exista Post-Formation Workspace.
2. Exista Post-Formation Plan.
3. Organization se active solo con approval verificada.
4. Exista activation gate.
5. Exista Company Record Book.
6. Exista Record Book Index.
7. Exista Governance Snapshot.
8. Exista LLC initial consent.
9. Exista corporation organizational action.
10. Bylaws puedan finalizarse/versionarse.
11. Exista Ownership Register.
12. Exista LLC Member Ledger.
13. Exista Corporation Stock Ledger.
14. Exista equity consistency validation.
15. Existan officer/director/manager records.
16. Exista Authority Matrix.
17. Exista EIN handoff.
18. EIN status sea visible.
19. No se invente EIN.
20. Exista Banking Readiness.
21. Exista Banking Checklist.
22. Exista Banking Package.
23. Exista bank-provider handoff.
24. No exista banking approval guarantee.
25. Exista Initial License Screening.
26. Exista License Requirement Registry.
27. Exista freshness control.
28. Exista License Screening Result.
29. Exista applicability taxonomy.
30. Exista License Task.
31. Exista sales-tax screening.
32. Exista employer screening.
33. Exista payroll handoff.
34. Exista Registered Agent Continuity.
35. Exista registered-agent handoff.
36. Exista Compliance handoff.
37. Exista Initial Compliance Calendar.
38. Exista Annual Report readiness.
39. Ownership reporting sea conditional/current.
40. Exista DBA screening.
41. Exista DBA handoff.
42. Exista Tax Setup handoff.
43. Tax elections no sean automáticas.
44. Exista Bookkeeping handoff.
45. Exista Accounting Setup readiness.
46. Exista Business Funding handoff.
47. Fundability sea readiness, no garantía.
48. Exista Insurance Marketplace handoff.
49. Exista Client Post-Formation Portal.
50. Existan Next-Step Cards.
51. Required y optional estén separados.
52. Existan Client Action Requests.
53. Exista Cross-Module Handoff Record.
54. Handoffs sean idempotentes.
55. No existan copias divergentes de master data.
56. Existan Human Review Gates.
57. IA pueda asistir.
58. IA tenga prohibiciones explícitas.
59. Existan permisos.
60. Existan APIs.
61. Existan eventos.
62. Existan workflows.
63. Existan pruebas.
64. Toda acción sea trazable.
65. Parte 4 termine lista para administración y cierre final del módulo.

### Instrucciones para Codex

1. Lee Partes 1–3 completas.
2. Reutiliza Organization.
3. Reutiliza Person.
4. Reutiliza Documents.
5. Reutiliza Tasks.
6. Reutiliza Approvals.
7. Reutiliza Service Orders.
8. Reutiliza Marketplace/Partners.
9. Reutiliza Audit.
10. Reutiliza Workflow Engine.
11. Implementa Post-Formation Workspace.
12. Implementa Post-Formation Plan.
13. Implementa Organization Activation Gate.
14. Usa únicamente approved formation data.
15. Implementa Record Book como índice, no como sistema duplicado.
16. Implementa Governance Snapshots.
17. Implementa LLC initial consent.
18. Implementa corporation organizational actions.
19. Versiona bylaws/governance documents.
20. Implementa Ownership Register.
21. Implementa member/share ledgers.
22. Implementa equity consistency validation.
23. Implementa role/authority records.
24. Implementa EIN Handoff al Módulo 33.
25. Nunca simules EIN.
26. Implementa Banking Readiness.
27. Implementa Banking Package.
28. Implementa bank Marketplace handoff.
29. Prohíbe approval guarantees.
30. Implementa License Requirement Registry.
31. Implementa freshness.
32. Implementa License Screening.
33. Implementa ambiguous-result review.
34. Implementa Sales Tax screening.
35. Implementa Employer screening.
36. Implementa Payroll handoff.
37. Implementa Registered Agent Continuity.
38. Implementa Compliance handoff al Módulo 34.
39. Implementa initial compliance calendar.
40. No hardcodees obligaciones legales cambiantes.
41. Implementa conditional ownership-reporting handoff.
42. Implementa DBA screening/handoff.
43. Implementa Tax handoff.
44. No elijas tax elections automáticamente.
45. Implementa Bookkeeping handoff al Módulo 31.
46. Implementa Funding handoff al Módulo 35.
47. Implementa Insurance Marketplace handoff.
48. Implementa Client Post-Formation Portal.
49. Implementa Next-Step Cards.
50. Distingue required/conditional/recommended/optional/informational.
51. Implementa Client Action Requests.
52. Implementa generic Cross-Module Handoff.
53. Implementa handoff idempotency.
54. Reutiliza master data, evita copias.
55. Implementa human review gates.
56. Limita IA a suggestions/explanations.
57. No permitas IA modificar ownership.
58. No permitas IA afirmar licensure definitivo sin support.
59. Implementa permissions.
60. Implementa APIs.
61. Implementa events/outbox.
62. Implementa workflows.
63. Implementa immutable audit.
64. No marques Parte 4 lista sin probar approval → post-formation → governance → readiness → handoffs.
65. Mantén Parte 5 separada para partners, automation, security, analytics, admin, migration, E2E y cierre.

### Verificación final de Parte 4

- ¿Organization usa solo datos aprobados?
- ¿El record book referencia documentos sin duplicarlos?
- ¿Ownership/governance tienen versión?
- ¿EIN se deriva mediante handoff y nunca se inventa?
- ¿Banking readiness no promete aprobación?
- ¿Licencias usan requirements vigentes?
- ¿Obligaciones cambiantes no están hardcodeadas?
- ¿Compliance recibe un handoff completo?
- ¿Bookkeeping/Tax/Funding reciben los datos correctos?
- ¿Los handoffs son idempotentes?
- ¿Required y optional están claramente separados?
- ¿La IA no modifica ownership ni toma decisiones legales finales?
- ¿Toda acción queda auditada?

---

# Parte 5 — Partners, Automatización, Compliance, Seguridad, Analytics, Administración, Migración, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 5  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 32 — Parte 4  
**Secciones incluidas:** 3686–3750  
**Audiencia:** Owner, Codex, formation specialists, operations, compliance, security, administrators, partner managers, support y Data Analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Business Formation gobernado por requirements versionados, ejecución directa o mediante partners, automatización supervisada, seguridad de mínimo privilegio, trazabilidad integral y continuidad operacional

## 3686. Objetivo de Parte 5

Esta parte cierra el Módulo 32 definiendo:

- Partner Management;
- provider abstractions;
- service delivery models;
- automation engine;
- AI assistance;
- compliance controls;
- legal/compliance boundaries;
- administration;
- work queues;
- SLAs;
- security;
- fraud/abuse controls;
- audit;
- observability;
- analytics;
- migration;
- continuity;
- data portability;
- E2E tests;
- roadmap;
- final acceptance.

## 3687. Principio Operativo Final

```text
Client intent
→ scoped service
→ verified requirements
→ controlled execution
→ official evidence
→ post-formation handoffs
→ compliance monitoring
→ audit + analytics
```

El sistema deberá distinguir siempre entre:

```text
what SG Solutions performs
what a partner performs
what the government decides
what the client must do
what remains informational
```

## 3688. Delivery Model Registry

Valores:

```text
sg_service
sg_managed_with_partner
marketplace_referral
client_self_service
education_only
future_or_conditional
```

Cada Service Offering deberá declarar un delivery model explícito.

## 3689. Delivery Model Rules

`sg_service`:
- SG Solutions ejecuta el workflow dentro de su scope permitido.

`sg_managed_with_partner`:
- SG Solutions coordina, pero el partner ejecuta parte del servicio.

`marketplace_referral`:
- SG Solutions conecta al cliente con un tercero.

`client_self_service`:
- SG Solutions prepara información/documentos, pero el cliente presenta.

`education_only`:
- solo contenido educativo.

`future_or_conditional`:
- funcionalidad no disponible o dependiente de condiciones futuras.

## 3690. No Role Misrepresentation

La plataforma no deberá representar a SG Solutions como:

- state filing office;
- Secretary of State;
- government agency;
- law firm;
- bank;
- lender;
- insurer;
- registered agent provider cuando no lo sea;
- licensed professional cuando no corresponda.

La UI deberá reflejar el rol real por servicio.

## 3691. Partner Registry Integration

Business Formation deberá reutilizar el Partner Registry general.

Campos relevantes:

```text
partnerId
partnerName
partnerType
jurisdictions
services
capabilities
credentialsReference
contractStatus
slaProfileId
commissionModel
dataProcessingTerms
status
```

## 3692. Partner Types

```text
registered_agent
filing_provider
legal_service_partner
banking_partner
insurance_partner
tax_partner
bookkeeping_partner
funding_partner
identity_verification_provider
document_signature_provider
other
```

## 3693. Partner Capability Matrix

Por partner deberá declararse:

```text
formationFiling
nameSearch
registeredAgent
documentGeneration
governmentFeeCollection
statusTracking
documentRetrieval
resubmission
postFormation
API
webhooks
manualPortal
```

No deberá asumirse que todos los partners soportan las mismas capacidades.

## 3694. Partner Selection Policy

La selección podrá considerar:

- jurisdiction;
- entity type;
- service availability;
- cost;
- SLA;
- reliability;
- compliance status;
- client preference;
- fallback availability.

La decisión deberá quedar explicable y auditable.

## 3695. Partner Service Order

Campos:

```text
id
formationCaseId
partnerId
serviceType
scope
jurisdiction
quotedPartnerCost
governmentFeeResponsibility
clientChargeReference
status
externalReference
createdAt
completedAt
```

## 3696. Partner Service Order Status

```text
draft
quoted
approved
submitted_to_partner
accepted
in_progress
client_action_required
completed
failed
cancelled
refunded
```

## 3697. Partner SLA

Deberá soportar:

```text
acceptanceTimeTarget
submissionTimeTarget
statusUpdateCadence
documentDeliveryTarget
rejectionResponseTarget
supportEscalationTarget
```

Incumplimientos deberán generar alertas internas.

## 3698. Partner Failure and Fallback

Si un partner falla:

```text
detect failure
→ preserve current case state
→ stop duplicate submissions
→ evaluate fallback provider
→ human review
→ reauthorize when material
→ resume
```

No deberá cambiarse de partner silenciosamente cuando implique nuevas fees, términos o autorizaciones.

## 3699. Partner Data Sharing

Antes de compartir información deberá existir:

- purpose;
- partner;
- data scope;
- client consent cuando aplique;
- retention expectation;
- sharing timestamp;
- audit event.

Solo deberán compartirse los datos necesarios.

## 3700. Partner Commission Tracking

Cuando exista comisión/referral:

```text
partnerId
serviceOrderId
referralTrackingId
commissionType
expectedAmount
earnedStatus
paidStatus
disclosureReference
```

La comisión no deberá alterar la presentación objetiva del servicio.

## 3701. Automation Engine

El módulo podrá automatizar:

- task creation;
- reminders;
- requirement refresh;
- document assembly;
- consistency checks;
- status polling;
- receipt ingestion;
- next-step generation;
- handoff creation;
- SLA alerts;
- dashboard updates.

## 3702. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 3703. Informational Automation

Ejemplos:

- generate checklist;
- summarize case;
- calculate task aging;
- detect missing field;
- generate reminder;
- update dashboard;
- prepare draft communication.

No cambia datos materiales de filing.

## 3704. Low-Risk Automation

Podrá incluir:

- assign tag;
- route work queue;
- generate client action request from deterministic rule;
- attach official receipt to known submission;
- update normalized provider status.

Toda acción deberá ser reversible y auditable.

## 3705. Moderate-Risk Automation

Ejemplos:

- generate formation documents;
- propose requirement applicability;
- propose partner;
- propose registered-agent path;
- propose post-formation handoffs.

Deberá requerir review o policy gate antes de producir efectos materiales.

## 3706. High-Risk Automation

Acciones como:

- submit filing;
- charge government fee;
- resubmit rejected filing;
- modify ownership;
- change registered agent;
- create amended governance record;
- accept material provider conflict.

Requieren authorization/human review según policy.

## 3707. Prohibited Automation

La plataforma no deberá automáticamente:

- fabricate signatures;
- fabricate government approvals;
- invent state entity identifiers;
- falsify addresses;
- hide rejection notices;
- alter official documents;
- bypass client authorization;
- select legal strategy outside approved scope;
- impersonate a government user;
- submit knowingly false information.

## 3708. AI Assistant Scope

La IA podrá:

- explain formation steps;
- summarize requirements;
- identify missing information;
- draft client questions;
- summarize rejection notices;
- compare confirmed data for inconsistencies;
- draft non-binding next steps;
- suggest work-queue priority;
- explain partner roles.

## 3709. AI Grounding Requirements

Cuando la respuesta dependa de:

- current state requirements;
- fees;
- processing times;
- forms;
- licensing rules;
- ownership reporting;
- annual reports;
- provider availability;

la IA deberá utilizar current verified sources/configuration, no memoria general.

## 3710. AI Output Contract

Outputs materiales deberán estructurarse:

```text
recommendation
confidence
sourceReferences
requirementVersion
assumptions
missingInformation
humanReviewRequired
```

Una suggestion sin source deberá quedar como no verificada.

## 3711. AI Legal Boundary

La IA no deberá presentar contenido como:

- individualized legal opinion;
- attorney-client advice;
- guarantee of legal sufficiency;
- guarantee of government acceptance.

Podrá ofrecer información general y coordinar workflows dentro del scope aprobado.

## 3712. AI Rejection Assistant

Al recibir rejection podrá generar:

```text
officialReasonSummary
affectedFields
potentialCorrectionPaths
requiredClientQuestions
newDocumentNeeded
newAuthorizationPotentiallyNeeded
professionalReviewFlag
```

El texto oficial siempre deberá conservarse.

## 3713. AI Quality Feedback

Las correcciones humanas podrán alimentar:

- better prompts;
- better examples;
- confidence calibration;
- rule improvements;
- partner selection analytics.

No deberán convertirse automáticamente en nuevas reglas productivas sin governance.

## 3714. Compliance Control Framework

Controles mínimos:

- requirement freshness;
- role transparency;
- authorization checks;
- signature integrity;
- document version integrity;
- fee transparency;
- partner disclosure;
- source evidence;
- conflict handling;
- retention;
- audit.

## 3715. Compliance Finding

Campos:

```text
id
formationCaseId
findingType
severity
description
sourceReference
affectedResource
blocking
assignedTo
status
createdAt
resolvedAt
```

## 3716. Compliance Finding Types

```text
stale_requirement
missing_authorization
signature_mismatch
fee_disclosure_issue
partner_role_issue
document_version_issue
ownership_inconsistency
address_inconsistency
state_requirement_conflict
unverified_approval
data_sharing_issue
other
```

## 3717. Compliance Finding Status

```text
open
under_review
client_action_required
partner_action_required
resolved
accepted_with_documented_risk
not_applicable
```

Material findings deberán bloquear pasos definidos por policy.

## 3718. State Requirement Change Detection

El sistema deberá poder detectar cambios entre versions:

```text
old requirement
vs
new requirement
```

y evaluar:

- affected jurisdictions;
- open cases;
- ready-to-file packages;
- already-submitted cases;
- post-formation obligations.

## 3719. Requirement Change Impact

Campos:

```text
requirementVersionId
changeType
effectiveDate
affectedCaseIds
impactLevel
actionRequired
reviewedBy
status
```

No deberán modificarse retrospectivamente records oficiales ya completados sin motivo.

## 3720. Grandfathering and Effective Dates

Cuando una regla cambie, el engine deberá considerar:

- filing date;
- effective date;
- submission status;
- jurisdiction guidance;
- transition rules.

No deberá asumir que la regla actual aplica retroactivamente.

## 3721. Administrative Console

Secciones:

```text
Overview
Formation Cases
Ready to File
Submitted
Rejections
Approvals
Post-Formation
Partners
Requirements
Templates
Work Queues
SLAs
Compliance
Analytics
Security
Configuration
```

## 3722. Formation Operations Dashboard

Deberá mostrar:

- active cases;
- intake backlog;
- ready-to-file count;
- submissions today;
- processing cases;
- rejections;
- approvals;
- average cycle time;
- partner backlog;
- overdue client actions;
- compliance blockers;
- post-formation backlog.

## 3723. Work Queues

```text
intake_review
name_review
registered_agent_review
document_review
signature_pending
ready_to_file_review
submission
status_followup
rejection_review
approval_verification
post_formation
license_screening
partner_escalation
compliance_review
```

## 3724. Assignment Engine

Podrá considerar:

- jurisdiction;
- entity type;
- complexity;
- language;
- user permissions;
- reviewer skill;
- workload;
- SLA deadline;
- partner specialization.

## 3725. SLA Tracking

SLAs conceptuales:

```text
intake_review_sla
document_review_sla
ready_to_file_sla
submission_sla
rejection_response_sla
approval_verification_sla
final_package_sla
post_formation_sla
```

Debe medirse tiempo activo y tiempo bloqueado por cliente/partner separadamente cuando sea posible.

## 3726. Security Model

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

## 3727. Sensitive Formation Data

Especialmente sensibles:

- SSN/ITIN-like identifiers;
- identity documents;
- dates of birth;
- residential addresses;
- ownership details;
- signatures;
- banking readiness data;
- partner credentials;
- tax identifiers.

Deberán minimizarse, tokenizarse o enmascararse según necesidad.

## 3728. Field-Level Masking

Ejemplos:

```text
Tax ID
***-**-4821

Government ID
********3194
```

Los valores completos solo deberán ser accesibles con permiso y purpose apropiados.

## 3729. Document Security

Documentos deberán soportar:

- encryption at rest/in transit;
- malware scanning;
- access logging;
- version integrity;
- hash verification;
- retention;
- legal hold;
- restricted download policy.

## 3730. Signature Security

Las firmas deberán conservar:

```text
signerIdentity
signatureMethod
documentId
documentVersion
documentHash
signedAt
authenticationEvidence
ipOrDeviceMetadataWhenPermitted
```

No se reutilizará una firma para otra versión.

## 3731. Privileged Actions

Acciones como:

- submit filing;
- resolve material conflict;
- override blocking requirement;
- reopen completed case;
- export sensitive data;
- change partner credentials;

deberán requerir elevated permission y reauthentication cuando corresponda.

## 3732. Owner Break-Glass

El Owner podrá tener mecanismo excepcional:

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

No deberá ser una forma ordinaria de saltarse controles.

## 3733. Security Incident Types

```text
cross_client_access
identity_document_exposure
unauthorized_export
signature_misuse
unauthorized_filing
partner_credential_compromise
official_document_tampering
government_fee_payment_abuse
privilege_misuse
```

## 3734. Fraud and Abuse Signals

Señales potenciales:

- repeated identity mismatch;
- suspicious address reuse;
- unusual bulk formations;
- repeated payment failures;
- multiple accounts sharing unverifiable ownership;
- suspicious document changes;
- unauthorized signer behavior.

Las señales deberán generar review, no una acusación automática.

## 3735. Observability

Métricas técnicas:

```text
filing_adapter_error_rate
submission_retry_rate
webhook_failure_rate
status_poll_latency
document_generation_failure_rate
signature_failure_rate
partner_api_failure_rate
requirement_refresh_failure_rate
```

## 3736. Operational Alerts

Alertas:

- ready-to-file case aging;
- government fee quote expiring;
- filing stuck in submitting;
- rejection deadline approaching;
- provider degraded;
- partner SLA breach;
- approval discrepancy;
- unsigned governance document;
- post-formation handoff overdue;
- stale requirement used by open case.

## 3737. Formation Analytics

Dashboards:

```text
Business Formation Executive Dashboard
Formation Operations Dashboard
State Performance Dashboard
Partner Performance Dashboard
Rejection Analysis Dashboard
Cycle Time Dashboard
Post-Formation Conversion Dashboard
Compliance Quality Dashboard
```

## 3738. Core KPIs

```text
formation_cases_started
formation_cases_completed
ready_to_file_conversion_rate
submission_success_rate
approval_rate
rejection_rate
first_pass_acceptance_rate
average_time_to_ready_to_file
average_time_to_submission
average_state_processing_time
average_total_cycle_time
```

## 3739. Partner KPIs

```text
partner_acceptance_time
partner_submission_time
partner_error_rate
partner_rejection_rate
partner_status_update_compliance
partner_document_delivery_time
partner_sla_breach_rate
partner_cost_per_case
```

## 3740. Quality KPIs

```text
document_correction_rate
authorization_refresh_rate
signature_mismatch_rate
approval_discrepancy_rate
reopened_case_rate
compliance_finding_rate
post_formation_handoff_error_rate
duplicate_submission_prevention_count
```

Velocidad no deberá medirse sin calidad.

## 3741. Revenue and Service KPIs

Podrá medirse:

```text
formation_service_revenue
average_revenue_per_case
government_fees_passed_through
partner_costs
gross_margin_by_service
attach_rate_registered_agent
attach_rate_ein
attach_rate_bookkeeping
attach_rate_compliance
attach_rate_funding
```

Las government fees no deberán contarse como SG revenue si solo son pass-through.

## 3742. Data Governance for Analytics

Analytics deberá:

- usar definitions versionadas;
- excluir PII cuando no sea necesaria;
- aplicar tenant/client isolation;
- conservar metric lineage;
- registrar refresh time;
- diferenciar operational vs financial metrics.

## 3743. Data Portability

El cliente deberá poder obtener, dentro del scope permitido:

- formation summary;
- official documents;
- generated governance documents;
- receipts;
- activity timeline;
- ownership records;
- post-formation checklist;
- handoff status.

## 3744. Migration Into Business Formation

Para casos iniciados fuera de SG Solutions:

```text
identify current stage
→ collect evidence
→ verify official status
→ import organization data
→ import documents
→ map requirements
→ create migration snapshot
→ continue workflow
```

No deberán recrearse events históricos como si hubieran ocurrido dentro de SG Solutions.

## 3745. Migration Record

Campos:

```text
id
organizationId
sourceSystem
sourceCaseReference
migrationStage
cutoffDate
importedResources
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 3746. Migration Out and Case Closure

Al cerrar o transferir un case deberá producirse:

- final status;
- source documents;
- official filings;
- receipts;
- governance docs;
- open obligations;
- partner status;
- handoff status.

La salida no deberá eliminar inmediatamente records sujetos a retention/legal hold.

## 3747. Business Continuity

Ante outage:

```text
preserve last verified case state
→ stop risky submissions
→ queue outbound actions
→ keep read-only/client status available when possible
→ allow controlled manual operations
→ restore
→ reconcile queued actions
→ prevent duplicates
```

## 3748. Roadmap del Módulo 32

### Fase 1 — Controlled Formation Core

- intake;
- name;
- ownership;
- registered agent;
- deterministic documents;
- ready-to-file package;
- manual/partner filing;
- approval records.

### Fase 2 — Operational Automation

- provider adapters;
- status polling;
- rejection workflows;
- post-formation portal;
- handoffs;
- analytics.

### Fase 3 — Deeper Integrations

- selected state APIs;
- advanced partner APIs;
- registered agent integrations;
- marketplace connections;
- automated requirement refresh.

### Fase 4 — Advanced Governance

- amendments;
- foreign qualifications;
- conversions;
- dissolutions;
- advanced ownership/governance workflows;
- additional entity types.

## 3749. End-to-End Tests

### Escenario 1 — Single-Member LLC

```text
client intake
→ jurisdiction/entity selection
→ name
→ member
→ registered agent
→ documents
→ review
→ authorization
→ ready_to_file
→ submission
→ approval
→ Operating Agreement
→ EIN/compliance/bookkeeping handoffs
→ completed
```

### Escenario 2 — Multi-Member LLC

```text
multi-member intake
→ ownership validation
→ management selection
→ filing
→ approval
→ multi-member Operating Agreement
→ ownership register
→ post-formation actions
```

### Escenario 3 — Corporation

```text
corporation intake
→ share structure
→ incorporator
→ filing
→ approval
→ bylaws
→ incorporator action
→ board action
→ officers
→ stock ledger readiness
```

### Escenario 4 — Rejection and Resubmission

```text
submission
→ state rejection
→ rejection evidence
→ corrective action
→ client confirmation
→ regenerated package
→ new authorization if required
→ resubmission
→ approval
```

### Escenario 5 — Partner Failure

```text
partner filing
→ partner degraded
→ case preserved
→ duplicate-submission check
→ escalation
→ fallback reviewed
→ client authorization if material
→ alternate execution
→ completion
```

### Escenario 6 — Requirement Change Before Filing

```text
ready_to_file
→ state requirement changes
→ stale snapshot detected
→ filing blocked
→ requirement refreshed
→ package regenerated
→ review
→ authorization refreshed
→ filing
```

### Escenario 7 — Cross-Module Handoffs

```text
formation approved
→ EIN handoff
→ compliance handoff
→ bookkeeping handoff
→ funding readiness
→ each destination accepts once
→ no duplicate cases
```

### Escenario 8 — Security Incident

```text
unauthorized sensitive export
→ deny
→ alert
→ incident
→ preserve evidence
→ revoke/limit access
→ investigation
→ remediation
```

## 3750. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 32

El Módulo 32 estará completo cuando:

1. Exista Business Formation Service Catalog.
2. Exista Formation Engagement.
3. Exista Formation Case.
4. Exista entity-type support controlado.
5. Exista jurisdiction selection.
6. Exista name workflow.
7. Exista name evidence.
8. Exista ownership intake.
9. Exista management structure.
10. Exista Registered Agent workflow.
11. Existan address controls.
12. Exista Requirement Registry.
13. Requirements estén versionados.
14. Existan requirement snapshots.
15. Exista document/template registry.
16. Exista deterministic document generation.
17. Exista document validation.
18. Exista review.
19. Existan signatures/authorizations.
20. Exista Ready-to-File Gate.
21. Exista State Filing Submission.
22. Exista Filing Channel Registry.
23. Existan adapters.
24. Exista pre-submit revalidation.
25. Exista fee freshness.
26. Government y SG fees estén separadas.
27. Exista payment record.
28. Exista submission idempotency.
29. Exista submission locking.
30. Existan receipts.
31. Exista status tracking.
32. Exista raw status preservation.
33. Exista rejection workflow.
34. Exista corrective action.
35. Resubmission cree nuevo intento.
36. Exista approval verification.
37. Exista Formation Approval Record.
38. Exista State Entity Identifier.
39. Existan official final documents.
40. Exista Final Formation Record.
41. Exista Final Formation Package.
42. Exista Operating Agreement workflow.
43. Exista governance document support.
44. Exista Post-Formation Workspace.
45. Exista Organization Activation Gate.
46. Exista Company Record Book.
47. Exista Governance Snapshot.
48. Exista Ownership Register.
49. Existan ownership ledgers.
50. Exista Authority Matrix.
51. Exista EIN handoff al Módulo 33.
52. Exista Banking Readiness.
53. Exista Banking Package.
54. Exista License Screening.
55. Exista License Requirement Registry.
56. Exista Compliance handoff al Módulo 34.
57. Exista Bookkeeping handoff al Módulo 31.
58. Exista Tax handoff.
59. Exista Funding handoff al Módulo 35.
60. Existan Next-Step Cards.
61. Required y optional estén separados.
62. Exista Cross-Module Handoff.
63. Handoffs sean idempotentes.
64. Exista Delivery Model Registry.
65. No exista role misrepresentation.
66. Exista Partner Registry integration.
67. Exista Partner Capability Matrix.
68. Exista Partner SLA.
69. Exista partner fallback gobernado.
70. Exista data-sharing governance.
71. Exista Automation Engine.
72. Existan automation risk levels.
73. Acciones high-risk requieran gates.
74. Existan prohibited automations.
75. IA tenga scope definido.
76. IA use current verified requirements.
77. IA no emita legal opinions como autoridad.
78. Exista Compliance Finding.
79. Exista requirement-change impact analysis.
80. Exista Administrative Console.
81. Existan Work Queues.
82. Exista Assignment Engine.
83. Exista SLA Tracking.
84. Exista MFA/RBAC/ABAC.
85. Exista field-level masking.
86. Exista document security.
87. Exista signature integrity.
88. Existan privileged-action controls.
89. Exista break-glass gobernado.
90. Exista security incident handling.
91. Existan fraud/abuse signals como review flags.
92. Exista observability.
93. Existan operational alerts.
94. Existan dashboards.
95. Existan core KPIs.
96. Existan partner KPIs.
97. Existan quality KPIs.
98. Government pass-through fees no se confundan con revenue.
99. Exista data portability.
100. Exista migration in/out.
101. Exista Business Continuity.
102. Exista roadmap.
103. Existan E2E tests.
104. Exista immutable audit.
105. Toda acción material tenga actor, timestamp y source.
106. Toda aprobación tenga evidencia verificable.
107. Toda fee sea transparente.
108. Toda versión documental sea rastreable.
109. Ningún filing se duplique por retry.
110. Ningún rejection se oculte.
111. Ninguna firma se reutilice para otra versión.
112. Ninguna obligación cambiante quede hardcodeada sin versioning.
113. Ningún handoff downstream se duplique.
114. Ningún partner reciba más datos de los necesarios.
115. Ningún estado `completed` oculte obligaciones obligatorias pendientes.
116. La plataforma funcione en español e inglés.
117. El código utilice identifiers en inglés.
118. Codex pueda implementar el módulo por boundaries claros.
119. Las cinco partes estén integradas.
120. El módulo pueda operar de forma trazable end-to-end.

### Instrucciones finales para Codex

1. Lee las cinco partes completas antes de implementar.
2. Conserva los números de sección como referencia del PRD.
3. Reutiliza Organizations, Persons, Documents, Tasks, Approvals, Billing, Marketplace, Partners, Audit y Workflow Engine.
4. No construyas sistemas paralelos para funciones ya existentes.
5. Separa dominio de Business Formation de providers estatales/partners.
6. Usa adapters.
7. Usa Requirement Registry versionado.
8. Mantén effective dates.
9. Genera documents deterministicamente.
10. Usa IA para suggestions/explanations, no como fuente de verdad.
11. Implementa human gates para acciones materiales.
12. Implementa submission idempotency.
13. Implementa immutable submission history.
14. Conserva rejections y approvals oficiales.
15. Protege signed document versions.
16. Implementa post-formation handoffs idempotentes.
17. Implementa Partner Registry integration.
18. Implementa partner capability/health/SLA.
19. Implementa automation risk levels.
20. Implementa Compliance Findings.
21. Implementa requirement change impact.
22. Implementa Admin Console y Work Queues.
23. Implementa MFA/RBAC/ABAC y field-level controls.
24. Implementa immutable audit.
25. Implementa observability y alerts.
26. Implementa analytics con metric governance.
27. Implementa migration and portability.
28. Implementa Business Continuity.
29. Ejecuta todos los E2E tests.
30. No marques el módulo listo si cualquier sección crítica está stubbed sin una decisión explícita de roadmap.

### Verificación final para entrega

- ¿El intake produce un Formation Case consistente?
- ¿Los requisitos pertenecen a la jurisdicción y versión correctas?
- ¿Los documentos usan exactamente los datos confirmados?
- ¿El Filing Package autorizado es el mismo que se presenta?
- ¿Fees gubernamentales y comerciales están separadas?
- ¿Retries no duplican filings?
- ¿Rejections y resubmissions mantienen su cadena completa?
- ¿Approval tiene evidencia oficial?
- ¿Los documentos finales están verificados?
- ¿Operating Agreement/governance usan datos aprobados?
- ¿Organization se activa únicamente después de approval?
- ¿EIN, Compliance, Bookkeeping y Funding reciben handoffs correctos?
- ¿Los handoffs son idempotentes?
- ¿Partners están aislados mediante adapters/capabilities?
- ¿La IA no toma decisiones legales/materiales por sí sola?
- ¿Requirements cambiantes pueden actualizarse sin reescribir código?
- ¿Los datos sensibles están protegidos?
- ¿Toda acción privilegiada está auditada?
- ¿Analytics distingue productividad de calidad?
- ¿El módulo puede recuperarse de outages sin duplicar acciones?
- ¿Los ocho escenarios E2E pasan?

# Estado Final del Módulo 32

```text
MÓDULO 32:
BUSINESS FORMATION

PARTES:
1. Fundamentos, Intake, Entidad, Jurisdicción, Nombre, Propietarios y Registered Agent
2. Requisitos Estatales, Documentos, Review y Ready-to-File
3. Filing, Pagos, Rechazos, Aprobación y Documentos Finales
4. Post-Formation, Governance, Banking Readiness, Licencias y Handoffs
5. Partners, Automatización, Compliance, Seguridad, Analytics y Cierre

SECCIONES:
3426–3750

ESTADO:
MODULE COMPLETE
```

