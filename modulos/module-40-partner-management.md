# SG Solutions Platform — Módulo 40: Partner Management

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 40. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus cuatro partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, Partner Registry, onboarding, due diligence, contacts, capabilities, jurisdictions, contracts, documents, authorizations y lifecycle | 5766–5830 | **COMPLETE** |
| 2 | Partner portal, referrals, assignments, SLAs, communications, document exchange, operational workflows, support y escalations | 5831–5895 | **COMPLETE** |
| 3 | Economics, commissions, billing, settlements, performance, quality, complaints, disputes, remediation, suspension y offboarding | 5896–5960 | **COMPLETE** |
| 4 | Integrations, automation, AI, compliance, security, admin, analytics, migration, continuity, E2E y cierre | 5961–6025 | **COMPLETE** |

**Estado global del Módulo 40:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Partner Registry, Onboarding, Due Diligence, Contacts, Capabilities, Jurisdictions, Contracts, Documents, Authorizations y Lifecycle

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 39 — CreditCardBroker Integration  
**Secciones incluidas:** 5766–5830  
**Audiencia:** Owner, Codex, partner managers, compliance, operations, finance, security, support y administrators  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Partner Management centralizado para toda SG Solutions, reutilizable por Marketplace, Business Funding, Home Buying, CreditCardBroker y futuros verticales, con capacidades, jurisdicciones, contratos, autorizaciones y evidencia versionadas

## 5766. Objetivo del Módulo 40

El Módulo 40 deberá centralizar la administración de partners externos de SG Solutions.

Deberá permitir:

- registrar;
- verificar;
- clasificar;
- onboard;
- documentar;
- configurar capabilities;
- controlar jurisdictions;
- asociar contratos;
- controlar authorizations;
- administrar contacts;
- manejar lifecycle;
- proveer una fuente única para módulos consumidores.

## 5767. Partner Management Principle

```text
verified partner
→ verified capability
→ authorized jurisdiction
→ active contract/relationship
→ scoped access
→ operational use
→ monitoring
```

Nunca:

```text
partner exists
→ all services allowed everywhere
```

## 5768. Central Partner Registry

El módulo deberá ser source of truth para:

```text
Partner
Partner Organization
Partner Contact
Partner Capability
Partner Jurisdiction
Partner Agreement
Partner Authorization
Partner Document
Partner Status
Partner Relationship
```

## 5769. Reutilización Cross-Module

Módulos consumidores:

```text
M35 Business Funding
M36 Home Buying Assistance
M37 Financial Marketplace
M39 CreditCardBroker Integration
future insurance/investment/service modules
```

Estos módulos referenciarán Partner IDs en vez de mantener partner copies.

## 5770. Partner Record

Campos:

```text
id
organizationId
partnerCode
legalName
displayName
DBAOptional
partnerType
relationshipType
status
verificationStatus
riskTier
createdAt
updatedAt
```

## 5771. Partner Types

```text
lender
bank
credit_union
mortgage_provider
loan_officer_network
real_estate_brokerage
real_estate_agent
insurance_agency
insurance_carrier
title_company
settlement_provider
attorney
home_inspector
housing_counselor
state_or_local_program_admin
affiliate_network
fintech
tax_provider
bookkeeping_provider
registered_agent_provider
formation_provider
credit_monitoring_provider
merchant_services_provider
software_vendor
marketing_partner
other
```

## 5772. Relationship Types

```text
referral_partner
affiliate_partner
service_provider
technology_provider
data_provider
program_administrator
distribution_partner
strategic_partner
vendor
contractor
other
```

Un partner podrá tener múltiples relaciones versionadas.

## 5773. Partner Status

```text
prospect
onboarding
pending_verification
active
limited
remediation
paused
suspended
offboarding
terminated
retired
unknown
```

## 5774. Verification Status

```text
not_started
in_progress
verified
partially_verified
verification_due
verification_expired
failed
unknown
```

## 5775. Partner Risk Tier

```text
low
moderate
high
critical
unknown
```

Risk tier deberá derivarse de policy, no de opinión libre.

## 5776. Partner Profile

Campos adicionales:

```text
description
website
supportEmail
supportPhone
primaryLanguage
supportedLanguages
timeZone
country
headquartersState
publicBranding
internalNotes
```

## 5777. Partner Onboarding Case

Campos:

```text
id
partnerId
onboardingType
status
ownerId
startedAt
targetCompletionAt
completedAt
blockingFindings
```

## 5778. Onboarding Types

```text
new_partner
new_relationship
new_capability
new_jurisdiction
new_integration
reactivation
```

## 5779. Onboarding Status

```text
draft
collecting_information
due_diligence
contracting
configuration
testing
approval
active
blocked
cancelled
```

## 5780. Onboarding Checklist

Checklist configurable:

```text
identity
business_registration
licenses
insurance
tax_documents
banking_for_partner_payments
contracts
security_review
privacy_review
capability_review
jurisdiction_review
integration_review
training
go_live_approval
```

## 5781. Onboarding Checklist Item

Campos:

```text
id
onboardingCaseId
requirementCode
required
status
responsibleParty
dueDate
evidenceDocumentIds
verifiedBy
verifiedAt
```

## 5782. Checklist Status

```text
not_started
requested
received
under_review
verified
rejected
waived_with_reason
expired
not_applicable
```

## 5783. Due Diligence Record

Campos:

```text
id
partnerId
dueDiligenceType
scope
status
findings
reviewedBy
reviewedAt
nextReviewAt
```

## 5784. Due Diligence Types

```text
business_identity
licensing
regulatory
insurance
financial_stability_context
security
privacy
reputation
operational_capacity
technology
contractual
other
```

## 5785. Business Identity Verification

Podrá registrar:

```text
legalNameMatch
entityType
formationJurisdiction
registrationStatus
registrationReference
verifiedAt
source
```

## 5786. Licensing / Authorization Verification

Campos:

```text
id
partnerId
licenseType
licenseNumberOrReference
jurisdiction
status
issuedAtOptional
expiresAtOptional
verificationSource
verifiedAt
```

## 5787. License Status

```text
active
inactive
pending
expired
suspended
revoked
not_required
unknown
```

## 5788. Insurance / Coverage Verification

Cuando aplique:

```text
coverageType
carrier
policyReference
coverageLimitContext
effectiveFrom
expiresAt
verificationStatus
documentId
```

## 5789. Tax Documentation

Ejemplos:

```text
W9
W8
other_required_tax_form
```

Guardar status/reference, minimizando taxpayer identifiers.

## 5790. Tax Document Status

```text
not_required
requested
received
verified
rejected
expired
update_required
```

## 5791. Partner Contact

Campos:

```text
id
partnerId
firstName
lastName
title
department
email
phone
status
preferredLanguage
timeZone
```

## 5792. Contact Roles

```text
executive
relationship_manager
operations
sales
support
finance
compliance
legal
security
technical
billing
marketing
other
```

## 5793. Primary Contact Assignment

Por function:

```text
primaryRelationshipContact
primaryOperationsContact
primaryFinanceContact
primaryTechnicalContact
primaryComplianceContact
```

## 5794. Contact Status

```text
active
inactive
left_organization
unverified
do_not_contact
```

## 5795. Partner Capability

Campos:

```text
id
partnerId
capabilityCode
domain
status
effectiveFrom
effectiveTo
source
verifiedAt
```

## 5796. Capability Examples

```text
accept_referral
accept_application
provide_prequalification
provide_preapproval
provide_offer
provide_status_updates
provide_documents
provide_conversion_status
provide_insurance_quote
provide_title_service
provide_inspection
provide_tax_service
provide_bookkeeping
provide_business_formation
provide_credit_monitoring
API
webhook
secure_file_exchange
```

## 5797. Capability Status

```text
proposed
testing
active
limited
paused
disabled
expired
unknown
```

## 5798. Capability Conditions

Campos:

```text
capabilityId
conditions
jurisdictionRestrictions
productRestrictions
volumeRestrictions
channelRestrictions
approvalRequirements
```

## 5799. Partner Jurisdiction

Campos:

```text
id
partnerId
country
state
countyOptional
cityOptional
postalCodeContextOptional
scopeType
status
source
verifiedAt
```

## 5800. Jurisdiction Scope Types

```text
national
statewide
county
city
postal_range
custom
```

## 5801. Jurisdiction Status

```text
active
limited
pending
expired
suspended
not_authorized
unknown
```

## 5802. Jurisdiction-Capability Matrix

La plataforma deberá poder expresar:

```text
partner
+
capability
+
jurisdiction
+
product/program
```

Ejemplo:

```text
Partner A
→ mortgage referral
→ Illinois
→ FHA + Conventional
```

sin asumir cobertura nacional.

## 5803. Partner Product / Program Participation

Campos:

```text
partnerId
domainResourceId
domainResourceType
status
effectiveFrom
effectiveTo
source
```

## 5804. Participation Status

```text
active
limited
pending
paused
ended
unknown
```

## 5805. Partner Agreement

Campos:

```text
id
partnerId
agreementType
agreementNumberOrCode
status
effectiveFrom
effectiveTo
autoRenewalContext
documentId
ownerId
```

## 5806. Agreement Types

```text
referral
affiliate
service
technology
data
marketing
NDA
DPA_privacy
business_associate_if_applicable
master_services
statement_of_work
other
```

## 5807. Agreement Status

```text
draft
negotiation
pending_signature
active
expiring
expired
terminated
superseded
```

## 5808. Agreement Version

Campos:

```text
agreementId
version
documentId
effectiveFrom
effectiveTo
signedAt
signedByReferences
contentHash
```

## 5809. Commercial Terms Reference

Commercial terms podrán registrar:

```text
commissionModel
feeModel
paymentTerms
minimums
volumeTiers
chargebackTerms
other
```

Sin hacerlos visibles a client-facing surfaces por default.

## 5810. Referral / Compensation Relationship

Campos:

```text
partnerId
compensationType
basis
disclosureRequirement
effectiveFrom
effectiveTo
agreementVersionId
status
```

## 5811. Partner Authorization

Entidad:

```text
PartnerAuthorization
```

Campos:

```text
id
partnerId
authorizationType
scope
jurisdiction
status
effectiveFrom
effectiveTo
source
approvedBy
```

## 5812. Authorization Types

```text
receive_referrals
receive_client_data
use_API
use_webhooks
use_brand
market_offer
sponsored_placement
access_partner_portal
receive_documents
submit_status
submit_conversion
other
```

## 5813. Authorization Status

```text
requested
approved
limited
suspended
revoked
expired
denied
unknown
```

## 5814. Authorization Gate

Antes de material action:

```text
partner active
capability active
jurisdiction active
authorization active
agreement active
```

si cualquiera es required.

## 5815. Partner Document

Campos:

```text
id
partnerId
documentType
documentId
status
effectiveFromOptional
expiresAtOptional
verifiedBy
verifiedAt
```

## 5816. Partner Document Types

```text
formation_document
license
insurance_certificate
tax_form
agreement
NDA
security_questionnaire
privacy_addendum
banking_verification
marketing_approval
training_certificate
other
```

## 5817. Document Status

```text
requested
received
under_review
verified
rejected
expired
superseded
not_required
```

## 5818. Document Expiration Monitoring

Documentos con expiry deberán generar:

```text
renewal_reminder
verification_due
capability_or_status_review
```

antes de expiration.

## 5819. Partner Relationship Record

Campos:

```text
id
partnerId
relationshipType
relationshipOwnerId
startDate
endDateOptional
status
strategicTierOptional
notes
```

## 5820. Relationship Status

```text
prospect
active
limited
remediation
paused
ended
```

## 5821. Parent / Child Partner Relationships

Soportar:

```text
parentOrganization
subsidiary
branch
franchise
agent
individual_under_organization
network_member
```

## 5822. Individual Partner Context

Para personas individuales cuando corresponda:

```text
personId
organizationId
role
individualAuthorization
individualLicense
status
```

Ejemplo:

```text
loan officer
real estate agent
insurance agent
```

## 5823. Partner Brand Record

Campos:

```text
partnerId
brandName
logoAssetId
brandGuidelineDocumentIdOptional
approvedUsage
status
```

## 5824. Brand Usage Authorization

Usar logo/nombre en marketplace solo si:

```text
brand authorization active
```

cuando required.

## 5825. Partner Communication Preferences

Campos:

```text
partnerId
operationsEmail
supportEmail
billingEmail
preferredChannel
preferredLanguage
notificationTypes
quietHoursOptional
```

## 5826. Partner Internal Notes Boundary

Internal notes:

- nunca client-facing;
- access controlled;
- no defamatory/unverified language;
- factual/source-backed cuando material;
- auditable.

## 5827. Partner Finding

Tipos:

```text
missing_document
expired_license
expired_insurance
agreement_expiring
capability_mismatch
jurisdiction_mismatch
authorization_missing
brand_usage_issue
contact_invalid
due_diligence_issue
```

## 5828. Partner Finding Status

```text
open
under_review
partner_action_required
internal_action_required
resolved
accepted_with_reason
not_applicable
```

## 5829. Permissions, APIs, Events and Workflows

### Permisos

```text
partner.read
partner.create
partner.manage
partner.verify

partner.contact.read
partner.contact.manage

partner.capability.read
partner.capability.manage

partner.jurisdiction.read
partner.jurisdiction.manage

partner.agreement.read
partner.agreement.manage

partner.authorization.read
partner.authorization.manage

partner.document.read
partner.document.manage

partner.finding.read
partner.finding.manage
```

### APIs

```text
POST /api/partners
GET  /api/partners
GET  /api/partners/{id}
PATCH /api/partners/{id}

POST /api/partners/{id}/onboarding-cases
POST /api/partners/{id}/contacts
POST /api/partners/{id}/capabilities
POST /api/partners/{id}/jurisdictions
POST /api/partners/{id}/agreements
POST /api/partners/{id}/authorizations
POST /api/partners/{id}/documents
POST /api/partners/{id}/findings
```

### Eventos

```text
PartnerCreated
PartnerOnboardingStarted
PartnerVerificationCompleted
PartnerStatusChanged
PartnerContactCreated
PartnerCapabilityActivated
PartnerCapabilityPaused
PartnerJurisdictionActivated
PartnerAgreementActivated
PartnerAgreementExpiring
PartnerAuthorizationGranted
PartnerAuthorizationRevoked
PartnerDocumentVerified
PartnerDocumentExpired
PartnerFindingCreated
```

### Workflows

```text
Partner Onboarding Workflow
Partner Due Diligence Workflow
Partner Verification Workflow
Partner Capability Workflow
Partner Jurisdiction Workflow
Partner Agreement Workflow
Partner Authorization Workflow
Partner Document Renewal Workflow
Partner Finding Workflow
```

## 5830. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Partner.
2. Crear multiple partner types.
3. Crear multiple relationship types.
4. Cambiar partner status.
5. Crear risk tier.
6. Crear Partner Profile.
7. Crear Onboarding Case.
8. Crear onboarding checklist.
9. Completar checklist item.
10. Crear Due Diligence Record.
11. Verificar business identity.
12. Crear license verification.
13. Expirar license.
14. Crear insurance verification.
15. Crear tax-document status.
16. Crear Partner Contact.
17. Asignar contact roles.
18. Marcar primary contacts.
19. Crear Partner Capability.
20. Limitar capability.
21. Crear capability conditions.
22. Crear Partner Jurisdiction.
23. Marcar jurisdiction limited.
24. Construir jurisdiction-capability matrix.
25. Crear product/program participation.
26. Crear Partner Agreement.
27. Versionar agreement.
28. Expirar agreement.
29. Crear Commercial Terms Reference.
30. Crear compensation relationship.
31. Crear Partner Authorization.
32. Revocar authorization.
33. Probar Authorization Gate.
34. Crear Partner Document.
35. Expirar document.
36. Crear renewal reminder.
37. Crear Partner Relationship.
38. Crear parent/child relationship.
39. Crear individual partner context.
40. Crear Partner Brand.
41. Bloquear unauthorized brand use.
42. Crear communication preferences.
43. Probar internal-note permissions.
44. Crear missing-document finding.
45. Crear jurisdiction-mismatch finding.
46. Resolver finding.
47. Probar M35 partner reference.
48. Probar M36 partner reference.
49. Probar M37 partner reference.
50. Probar M39 partner reference.
51. Probar tenant isolation.
52. Probar partner-level isolation.
53. Probar field masking.
54. Probar immutable audit.
55. Probar permission checks.
56. Probar APIs.
57. Probar events/outbox.
58. Probar workflows.
59. Probar bilingual UI.
60. Probar expiry-driven status review.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Central Partner Registry.
2. Exista Partner Record.
3. Existan Partner Types.
4. Existan Relationship Types.
5. Exista Partner Status.
6. Exista Verification Status.
7. Exista Partner Risk Tier.
8. Exista Partner Profile.
9. Exista Onboarding Case.
10. Existan Onboarding Types.
11. Exista Onboarding Status.
12. Exista configurable Checklist.
13. Exista Checklist Item.
14. Exista Due Diligence Record.
15. Existan Due Diligence Types.
16. Exista Business Identity Verification.
17. Exista License Verification.
18. Exista Insurance Verification.
19. Exista Tax Documentation context.
20. Exista Partner Contact.
21. Existan Contact Roles.
22. Existan Primary Contacts.
23. Exista Contact Status.
24. Exista Partner Capability.
25. Existan Capability Examples/Statuses.
26. Existan Capability Conditions.
27. Exista Partner Jurisdiction.
28. Existan Jurisdiction Scope/Status.
29. Exista Jurisdiction-Capability Matrix.
30. Exista Product/Program Participation.
31. Exista Partner Agreement.
32. Existan Agreement Types.
33. Exista Agreement Versioning.
34. Existan Commercial Terms references.
35. Exista compensation relationship.
36. Exista Partner Authorization.
37. Existan Authorization Types/Statuses.
38. Exista Authorization Gate.
39. Exista Partner Document.
40. Existan Document Types/Statuses.
41. Exista expiration monitoring.
42. Exista Partner Relationship.
43. Exista parent/child model.
44. Exista Individual Partner Context.
45. Exista Partner Brand.
46. Exista Brand Usage Authorization.
47. Existan Communication Preferences.
48. Internal notes estén protegidas.
49. Existan Partner Findings.
50. Exista Finding Status.
51. Existan permisos/APIs/events/workflows.
52. M35/M36/M37/M39 puedan referenciar el mismo Partner.
53. Un partner no pueda actuar fuera de capability/jurisdiction/authorization.
54. Expired critical evidence pueda bloquear/limitar uso.
55. Toda material verification tenga source.
56. Toda material authorization sea auditable.
57. Parte 1 termine lista para Partner Portal/Operations de Parte 2.

### Instrucciones para Codex

1. Lee M35–M39 relevantes antes de implementar.
2. Implementa Partner como shared core aggregate.
3. No crees partner tables duplicadas por module.
4. Implementa PartnerType/RelationshipType extensibles.
5. Implementa status/verification/risk tier.
6. Implementa OnboardingCase/Checklist.
7. Implementa DueDiligence.
8. Implementa licenses/insurance/tax references.
9. Reutiliza Contacts/Organizations/Persons.
10. Implementa PartnerCapability.
11. Implementa PartnerJurisdiction.
12. Implementa capability-jurisdiction matrix.
13. Implementa product/program participation.
14. Implementa versioned PartnerAgreement.
15. Protege commercial terms.
16. Implementa PartnerAuthorization.
17. Enforce Authorization Gate.
18. Implementa PartnerDocuments/expiry monitoring.
19. Implementa relationships/parent-child/individuals.
20. Implementa Brand authorization.
21. Implementa communication preferences.
22. Protege internal notes.
23. Implementa Findings.
24. Implementa permissions/APIs/events/workflows.
25. Implementa immutable audit.
26. No marques Parte 1 completa si módulos consumidores pueden usar un partner sin validar capability, jurisdiction y authorization.

### Verificación final de Parte 1

- ¿Existe un solo Partner Registry reutilizable?
- ¿Partner type y relationship type están separados?
- ¿Onboarding/due diligence son auditables?
- ¿Licenses/insurance/tax docs pueden expirar?
- ¿Capabilities tienen conditions?
- ¿Jurisdiction no se asume nationwide?
- ¿Agreements están versionados?
- ¿Commercial terms están protegidos?
- ¿Authorizations gatean material actions?
- ¿Partner documents tienen expiry monitoring?
- ¿Individuals y organizations pueden relacionarse?
- ¿Brand use puede bloquearse?
- ¿M35–M39 pueden compartir el mismo Partner ID?
- ¿Toda acción material queda auditada?

---

# Parte 2 — Partner Portal, Referrals, Assignments, SLAs, Communications, Document Exchange, Operational Workflows, Support y Escalations

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 40 — Parte 1  
**Secciones incluidas:** 5831–5895  
**Audiencia:** Owner, Codex, partner operations, partner managers, support, compliance, marketplace operations, funding/homebuying specialists y partner users  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Portal multi-tenant para partners con acceso mínimo necesario, referrals/assignments trazables, SLAs por etapa, mensajería segura, document exchange controlado, soporte, escalations y preservación estricta de ownership entre SG, partner y módulos fuente

## 5831. Objetivo de Parte 2

Esta parte define cómo partners activos interactúan operacionalmente con SG.

Deberá cubrir:

- Partner Portal;
- access provisioning;
- referral inbox;
- assignments;
- acceptance/decline;
- capacity;
- status updates;
- SLAs;
- messages;
- document exchange;
- tasks;
- appointments;
- operational workflows;
- support;
- escalations;
- incident-style operational handling.

## 5832. Partner Portal Principle

```text
authorized partner user
→ scoped partner resources
→ assigned/referral work
→ explicit actions
→ evidence/status
→ audit
```

Nunca:

```text
partner user
→ broad access to all SG clients
```

## 5833. Partner Portal

Secciones:

```text
Overview
Referrals
Assignments
Cases
Tasks
Appointments
Messages
Documents
SLA
Support
Profile
Team
Capabilities
Availability
Notifications
```

## 5834. Partner User

Campos:

```text
id
partnerId
personId
email
role
status
MFAStatus
lastLoginAt
createdAt
```

## 5835. Partner User Roles

```text
partner_admin
partner_manager
partner_operations
partner_sales
partner_support
partner_finance
partner_compliance
partner_technical
partner_readonly
```

## 5836. Partner User Status

```text
invited
active
locked
suspended
disabled
left_organization
```

## 5837. Partner Access Provisioning

Flujo:

```text
partner active
→ portal authorization active
→ invite user
→ verify identity/email
→ MFA
→ role assignment
→ scoped access
```

## 5838. Partner Access Revocation

Revocar cuando:

- partner user leaves;
- authorization expires;
- partner suspended;
- security incident;
- role no longer required.

Revocation deberá ser inmediata para new access.

## 5839. Partner Resource Scope

Access deberá limitarse por:

```text
partnerId
assignedReferralIds
assignedCaseIds
capability
jurisdiction
role
purpose
```

## 5840. Cross-Partner Isolation

Un partner jamás deberá poder:

- buscar referrals de otro partner;
- leer documents de otro partner;
- ver commission terms de otro partner;
- ver internal SG notes no autorizadas;
- inferir client portfolio global.

## 5841. Partner Overview Dashboard

Mostrar:

```text
newReferrals
openAssignments
clientActionsWaiting
partnerActionsDue
SLAAtRisk
upcomingAppointments
unreadMessages
documentRequests
supportCases
```

## 5842. Referral Inbox

Reutiliza referrals de M35/M36/M37/M39 cuando corresponda.

Campos:

```text
referralId
sourceModule
clientDisplayContext
serviceOrProduct
jurisdiction
createdAt
responseDueAt
status
assignedPartnerUserId
```

## 5843. Referral Client Display Context

Por default mostrar solo:

```text
clientNameOrAllowedDisplay
highLevelNeed
locationContext
language
contactPermission
relevantSummary
```

Datos sensibles solo si necesarios y autorizados.

## 5844. Referral Status

```text
new
reviewing
accepted
declined
client_contact_pending
client_contacted
information_requested
in_progress
completed
closed
expired
cancelled
```

## 5845. Referral Acceptance

Campos:

```text
referralId
acceptedBy
acceptedAt
externalReferenceOptional
capacityReservationOptional
notesOptional
```

## 5846. Referral Decline

Campos:

```text
referralId
declinedBy
declinedAt
reasonCode
reasonTextOptional
source
```

No fabricar reason.

## 5847. Decline Reason Codes

```text
outside_jurisdiction
capability_unavailable
capacity_full
product_not_supported
client_not_reached
eligibility_or_program_context
duplicate
conflict
other
unknown
```

## 5848. Referral Reassignment

Cuando decline/timeout:

```text
referral
→ preserve original partner attempt
→ evaluate alternate authorized partner
→ client consent/choice check
→ reassign
```

## 5849. Assignment Record

Campos:

```text
id
partnerId
partnerUserIdOptional
sourceModule
sourceResourceId
assignmentType
priority
status
assignedAt
dueAt
completedAt
```

## 5850. Assignment Types

```text
referral_review
client_contact
document_review
status_update
appointment
condition_response
quote_or_offer
support_request
compliance_response
technical_action
other
```

## 5851. Assignment Status

```text
queued
assigned
accepted
in_progress
blocked
waiting_on_client
waiting_on_SG
completed
cancelled
overdue
```

## 5852. Assignment Ownership

Cada assignment deberá tener:

```text
one current owner
```

y history de reassignment.

## 5853. Partner Capacity Record

Campos:

```text
partnerId
capabilityId
jurisdictionIdOptional
capacityPeriod
maxAssignments
currentAssignments
status
updatedAt
```

## 5854. Capacity Status

```text
open
limited
full
waitlist
paused
unknown
```

## 5855. Capacity Gate

Antes de new assignment:

```text
partner active
capability active
jurisdiction valid
authorization active
capacity available
```

## 5856. SLA Definition

Campos:

```text
id
partnerIdOptional
capabilityCode
SLAType
targetDuration
businessHoursPolicy
pauseRules
effectiveFrom
effectiveTo
```

## 5857. SLA Types

```text
referral_acknowledgment
client_contact
document_review
status_update
quote_response
support_response
escalation_response
```

## 5858. SLA Clock

Campos:

```text
resourceId
SLAType
startedAt
pausedAtOptional
resumedAtOptional
dueAt
completedAtOptional
status
```

## 5859. SLA Status

```text
on_track
watch
at_risk
breached
paused
completed
not_applicable
```

## 5860. SLA Pause Reasons

```text
waiting_on_client
waiting_on_SG
waiting_on_external_authority
scheduled_future_event
approved_exception
```

## 5861. SLA Breach Workflow

```text
breach
→ partner alert
→ SG alert
→ escalation
→ remediation task
→ performance record
```

## 5862. Partner Status Update

Campos:

```text
id
partnerId
sourceResourceId
rawStatus
normalizedStatus
notes
supportingReference
submittedBy
submittedAt
```

## 5863. Raw Status Preservation

Siempre conservar:

```text
rawStatus
rawCode
rawMessage
```

antes de normalize.

## 5864. Status Update Validation

Validar:

```text
partner authorized
resource assigned
status transition allowed
supporting evidence if required
```

## 5865. Partner Task

Podrá crearse en shared Task primitive con:

```text
partnerId
partnerUserId
sourceResource
taskType
dueAt
status
visibility
```

## 5866. Task Visibility

```text
partner_visible
SG_internal
shared
client_visible_if_supported
```

No asumir que todo task es visible a todos.

## 5867. Partner Appointment

Reutilizar Appointments.

Campos adicionales:

```text
partnerId
partnerUserId
sourceResourceId
appointmentType
externalMeetingReferenceOptional
status
```

## 5868. Appointment Types

```text
client_consultation
partner_review
document_review
closing_or_transaction
support_call
training
integration_call
other
```

## 5869. Secure Message Thread

Campos:

```text
id
partnerId
sourceResourceId
participants
visibility
status
createdAt
```

## 5870. Message Visibility

```text
partner_and_SG
partner_SG_and_client
SG_internal
partner_internal_if_supported
```

## 5871. Communication Boundary

Partner communication deberá respetar:

- client consent;
- contact preferences;
- purpose;
- quiet hours where configured;
- required disclosures;
- no unauthorized marketing.

## 5872. Message Audit

Guardar:

```text
sender
recipients
channel
timestamp
deliveryStatus
threadId
attachments
```

## 5873. Partner Document Request

Campos:

```text
id
partnerId
sourceResourceId
documentType
requestedFrom
purpose
dueAt
status
requestedBy
```

## 5874. Document Request Status

```text
draft
requested
received
under_review
accepted
rejected
superseded
cancelled
```

## 5875. Document Exchange Principle

```text
request
→ authorized upload/share
→ malware/security scan
→ classification
→ scoped access
→ review
→ audit
```

## 5876. Partner Shared Document

Campos:

```text
documentId
partnerId
sourceResourceId
sharingPurpose
sharedBy
sharedAt
expiresAtOptional
accessScope
```

## 5877. Document Access Scope

```text
specific_partner
specific_partner_users
specific_case
specific_task
time_limited
```

## 5878. Document Download Audit

Registrar:

```text
documentId
partnerUserId
downloadedAt
purpose
deviceOrSessionReference
```

cuando policy lo requiera.

## 5879. Secure Upload Link

Campos:

```text
id
partnerId
documentRequestId
tokenHash
expiresAt
maxUploads
status
```

No incluir sensitive metadata en URL.

## 5880. Operational Workflow Instance

Campos:

```text
id
partnerId
workflowType
sourceModule
sourceResourceId
currentStep
status
startedAt
completedAt
```

## 5881. Workflow Types

```text
referral
application_support
document_collection
status_sync
quote_or_offer
closing_coordination
service_delivery
integration_support
compliance_remediation
other
```

## 5882. Workflow Step

Campos:

```text
workflowId
stepCode
ownerType
ownerId
dueAt
status
requiredEvidence
completedAt
```

## 5883. Workflow Step Ownership

```text
SG
partner
client
external_party
system
```

## 5884. Operational Exception

Tipos:

```text
partner_unresponsive
client_unreachable
missing_document
status_conflict
capacity_issue
jurisdiction_issue
authorization_issue
integration_issue
SLA_breach
other
```

## 5885. Exception Record

Campos:

```text
id
partnerId
sourceResourceId
exceptionType
severity
description
status
owner
createdAt
resolvedAt
```

## 5886. Partner Support Case

Campos:

```text
id
partnerId
sourceResourceIdOptional
issueType
priority
status
assignedTeam
externalTicketReferenceOptional
createdAt
resolvedAt
```

## 5887. Support Issue Types

```text
portal_access
referral
assignment
document
status_sync
billing
commission
integration
API
webhook
security
compliance
general
```

## 5888. Support Case Status

```text
new
triage
assigned
waiting_on_partner
waiting_on_SG
resolved
closed
escalated
```

## 5889. Escalation Record

Campos:

```text
id
partnerId
sourceResourceId
escalationType
severity
trigger
escalatedTo
createdAt
status
resolvedAt
```

## 5890. Escalation Types

```text
SLA
client_impact
compliance
security
financial
technical
relationship
executive
```

## 5891. Escalation Severity

```text
low
moderate
high
critical
```

## 5892. Escalation Chain

Configurable:

```text
partner_user
→ partner_manager
→ SG_partner_manager
→ operations_lead
→ compliance/security/finance
→ executive
```

según issue type.

## 5893. Operational Finding Types

```text
unauthorized_access_attempt
referral_not_acknowledged
capacity_overflow
SLA_breach
invalid_status_transition
document_access_issue
missing_required_evidence
unresolved_exception
support_backlog
escalation_overdue
```

## 5894. Permissions, APIs, Events and Workflows

### Permisos

```text
partner_portal.login
partner_portal.dashboard.read

partner_referral.read
partner_referral.accept
partner_referral.decline

partner_assignment.read
partner_assignment.manage

partner_SLA.read
partner_status.submit

partner_message.read
partner_message.send

partner_document.request
partner_document.read
partner_document.upload

partner_support.read
partner_support.create
partner_support.manage

partner_escalation.read
partner_escalation.manage
```

### APIs

```text
GET  /api/partner-portal/overview
GET  /api/partner-portal/referrals
POST /api/partner-portal/referrals/{id}/accept
POST /api/partner-portal/referrals/{id}/decline

GET  /api/partner-portal/assignments
POST /api/partner-portal/status-updates

POST /api/partner-portal/messages
POST /api/partner-portal/document-requests
POST /api/partner-portal/uploads

POST /api/partner-portal/support-cases
POST /api/partners/{id}/escalations
```

### Eventos

```text
PartnerUserInvited
PartnerUserActivated
PartnerUserAccessRevoked
PartnerReferralReceived
PartnerReferralAccepted
PartnerReferralDeclined
PartnerAssignmentCreated
PartnerCapacityChanged
PartnerSLARiskDetected
PartnerSLABreached
PartnerStatusSubmitted
PartnerMessageSent
PartnerDocumentRequested
PartnerDocumentShared
PartnerOperationalExceptionCreated
PartnerSupportCaseCreated
PartnerEscalationCreated
```

### Workflows

```text
Partner Portal Access Workflow
Partner Referral Workflow
Partner Assignment Workflow
Partner Capacity Workflow
Partner SLA Workflow
Partner Status Update Workflow
Partner Messaging Workflow
Partner Document Exchange Workflow
Partner Operational Workflow
Partner Support Workflow
Partner Escalation Workflow
```

## 5895. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Partner User.
2. Invite partner user.
3. Require MFA.
4. Revoke access.
5. Test partner resource scope.
6. Block cross-partner referral access.
7. Render Partner Overview.
8. Render Referral Inbox.
9. Limit client display context.
10. Accept referral.
11. Decline referral.
12. Preserve decline reason.
13. Reassign referral.
14. Preserve original partner attempt.
15. Create Assignment.
16. Reassign assignment.
17. Create Partner Capacity.
18. Block assignment at full capacity.
19. Create SLA Definition.
20. Create SLA Clock.
21. Pause SLA.
22. Trigger SLA risk.
23. Trigger SLA breach.
24. Create Partner Status Update.
25. Preserve raw status.
26. Block invalid status transition.
27. Create Partner Task.
28. Test task visibility.
29. Create Partner Appointment.
30. Create Secure Message Thread.
31. Test message visibility.
32. Enforce contact preferences.
33. Create Document Request.
34. Upload document.
35. Apply scoped document access.
36. Audit document download.
37. Create secure upload link.
38. Expire secure upload link.
39. Create Operational Workflow.
40. Create workflow steps.
41. Assign SG step.
42. Assign partner step.
43. Create Operational Exception.
44. Create partner-unresponsive exception.
45. Create Support Case.
46. Escalate support case.
47. Create Escalation Record.
48. Trigger critical escalation.
49. Test escalation chain.
50. Create operational finding.
51. Test source module linkage M35.
52. Test source module linkage M36.
53. Test source module linkage M37.
54. Test source module linkage M39.
55. Test partner/client data isolation.
56. Test permissions.
57. Test APIs.
58. Test events/outbox.
59. Test workflows.
60. Test immutable audit.

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. Exista Partner Portal.
2. Exista Partner User.
3. Existan partner-user roles.
4. Exista Partner User Status.
5. Exista access provisioning.
6. Exista access revocation.
7. Exista Partner Resource Scope.
8. Exista cross-partner isolation.
9. Exista Partner Overview Dashboard.
10. Exista Referral Inbox.
11. Client display context esté minimizado.
12. Exista Referral Status.
13. Exista Referral Acceptance.
14. Exista Referral Decline.
15. Existan decline reasons.
16. Exista Referral Reassignment.
17. Exista Assignment Record.
18. Existan Assignment Types.
19. Exista Assignment Status.
20. Exista assignment ownership.
21. Exista Partner Capacity.
22. Exista Capacity Status.
23. Exista Capacity Gate.
24. Exista SLA Definition.
25. Existan SLA Types.
26. Exista SLA Clock.
27. Exista SLA Status.
28. Existan pause reasons.
29. Exista SLA Breach Workflow.
30. Exista Partner Status Update.
31. Raw status se preserve.
32. Exista status validation.
33. Exista Partner Task.
34. Exista Task Visibility.
35. Exista Partner Appointment.
36. Exista Secure Message Thread.
37. Exista Message Visibility.
38. Exista communication boundary.
39. Exista Message Audit.
40. Exista Partner Document Request.
41. Exista Document Exchange Principle.
42. Exista Partner Shared Document.
43. Exista Document Access Scope.
44. Exista Download Audit.
45. Exista Secure Upload Link.
46. Exista Operational Workflow Instance.
47. Existan Workflow Types.
48. Exista Workflow Step.
49. Exista Step Ownership.
50. Existan Operational Exceptions.
51. Exista Exception Record.
52. Exista Partner Support Case.
53. Existan Support Issue Types.
54. Exista Support Status.
55. Exista Escalation Record.
56. Existan Escalation Types.
57. Exista Escalation Severity.
58. Exista configurable Escalation Chain.
59. Existan Operational Findings.
60. Existan permisos/APIs/events/workflows.
61. Toda partner action quede scoped/auditada.
62. Parte 2 termine lista para Economics/Quality/Disputes de Parte 3.

### Instrucciones para Codex

1. Lee Parte 1 completa.
2. Build Partner Portal on shared Partner IDs.
3. Enforce partner tenant isolation at query/resource layer.
4. Implement partner user provisioning + MFA.
5. Implement immediate access revocation.
6. Reuse referral records from source modules.
7. Minimize client context.
8. Preserve referral attempt history.
9. Implement Assignment/Capacity.
10. Implement SLA definitions/clocks/pause rules.
11. Preserve raw partner statuses.
12. Validate status transitions.
13. Reuse Tasks/Appointments/Messaging.
14. Implement explicit visibility scopes.
15. Implement document requests/sharing.
16. Use secure time-limited upload tokens.
17. Audit sensitive downloads.
18. Implement OperationalWorkflow/Steps.
19. Implement exceptions/support/escalations.
20. Implement configurable escalation chain.
21. Implement Findings.
22. Implement permissions/APIs/events/workflows.
23. Implement immutable audit.
24. No marques Parte 2 completa si a partner user can enumerate another partner's referrals/documents or if status updates can bypass assignment/authorization checks.

### Verificación final de Parte 2

- ¿Partner users solo ven recursos de su partner?
- ¿Referrals preservan original partner attempts?
- ¿Capacity puede bloquear assignments?
- ¿SLAs tienen pause rules?
- ¿Raw statuses se preservan?
- ¿Tasks/messages/docs tienen visibility explícita?
- ¿Document sharing es scoped y auditable?
- ¿Secure upload links expiran?
- ¿Operational exceptions disparan work?
- ¿Support/escalation chain es configurable?
- ¿M35/M36/M37/M39 pueden reutilizar el portal?
- ¿Toda acción material queda auditada?

---

# Parte 3 — Economics, Commissions, Billing, Settlements, Performance, Quality, Complaints, Disputes, Remediation, Suspension y Offboarding

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 40 — Parte 2  
**Secciones incluidas:** 5896–5960  
**Audiencia:** Owner, Codex, partner managers, finance, accounting, operations, compliance, support, quality reviewers y administrators  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Economics y lifecycle de partners totalmente trazables, contract-backed y separados de organic ranking/recommendation; performance/quality basada en definiciones verificables; complaints/disputes con evidencia preservada; remediation, suspension y offboarding seguros sin romper journeys activos

## 5896. Objetivo de Parte 3

Esta parte define:

- partner economics;
- commissions;
- referral compensation;
- billing;
- partner invoices/statements;
- settlements;
- payment reconciliation;
- performance;
- quality;
- complaints;
- disputes;
- remediation;
- suspension;
- termination;
- offboarding;
- retention.

## 5897. Partner Economics Principle

Economics deberán seguir:

```text
active agreement
→ qualifying event
→ verified evidence
→ calculation rule
→ approval
→ invoice/statement
→ settlement
→ reconciliation
→ audit
```

## 5898. Economics Boundary

Separar:

```text
partner operational performance
≠
partner compensation
≠
marketplace organic ranking
```

Compensation no deberá contaminar silenciosamente quality/ranking.

## 5899. Partner Economic Relationship

Campos:

```text
id
partnerId
agreementVersionId
economicModel
currency
effectiveFrom
effectiveTo
status
```

## 5900. Economic Models

```text
no_compensation
referral_fee
lead_fee
qualified_event_fee
commission
revenue_share
fixed_monthly_fee
usage_fee
service_fee
hybrid
other
```

## 5901. Partner Compensation Rule

Campos:

```text
id
partnerId
agreementVersionId
ruleCode
qualifyingEvent
calculationType
amountOrRate
currency
conditions
effectiveFrom
effectiveTo
status
```

## 5902. Compensation Rule Status

```text
draft
verified
active
paused
expired
superseded
disputed
retired
```

## 5903. Qualifying Event Registry

Ejemplos:

```text
referral_received
qualified_lead_defined
appointment_completed
application_submitted
service_completed
funded
closed_transaction
verified_conversion
subscription_active
other_contract_defined_event
```

Cada event deberá tener definition/version.

## 5904. Qualifying Event Boundary

No asumir que:

```text
click
lead
referral
application
approval
funding
closing
```

son económicamente equivalentes.

## 5905. Partner Commission Record

Campos:

```text
id
partnerId
sourceModule
sourceResourceId
qualifyingEventId
compensationRuleId
expectedAmount
earnedAmount
approvedAmount
paidAmount
reversedAmount
currency
status
createdAt
updatedAt
```

## 5906. Commission Status

```text
potential
pending_evidence
pending_verification
earned
pending_approval
approved
invoiced
scheduled_for_payment
paid
partially_paid
reversed
disputed
cancelled
written_off
```

## 5907. Commission Recognition Gate

Para `earned`:

```text
agreement active
rule active
qualifying event verified
required evidence present
no blocking dispute
calculation successful
```

## 5908. Commission Calculation Record

Campos:

```text
commissionId
inputValues
calculationRuleVersion
calculatedAmount
roundingMethod
calculatedBy
calculatedAt
```

## 5909. Commission Adjustment

Tipos:

```text
correction
bonus
partial_reversal
full_reversal
chargeback
manual_adjustment_with_approval
other
```

Preservar original.

## 5910. Revenue Share Context

Campos:

```text
grossBase
excludedAmounts
eligibleBase
rate
calculatedShare
source
```

No usar financing principal/credit limit/grant amount como SG revenue base salvo contract lo defina explícita y legalmente.

## 5911. Partner Billing Account

Campos:

```text
id
partnerId
billingEntityName
billingContactId
billingEmail
paymentTerms
currency
taxStatusReference
status
```

## 5912. Billing Account Status

```text
active
on_hold
verification_required
closed
```

## 5913. Partner Invoice

Campos:

```text
id
partnerId
invoiceNumber
periodStart
periodEnd
invoiceDate
dueDate
currency
subtotal
adjustments
total
status
documentIdOptional
```

## 5914. Invoice Status

```text
draft
review
issued
partially_paid
paid
past_due
disputed
void
cancelled
```

## 5915. Invoice Line

Campos:

```text
invoiceId
lineType
sourceResourceId
description
quantity
unitAmount
lineAmount
taxContextOptional
```

## 5916. Partner Statement

Campos:

```text
id
partnerId
periodStart
periodEnd
statementDate
openingBalance
earned
adjustments
payments
closingBalance
status
```

## 5917. Settlement Record

Campos:

```text
id
partnerId
settlementPeriod
grossAmount
adjustments
netAmount
currency
paymentMethodReference
status
scheduledAt
paidAtOptional
```

## 5918. Settlement Status

```text
pending
approved
scheduled
processing
paid
partially_paid
failed
on_hold
reversed
```

## 5919. Partner Payment Record

Campos:

```text
id
partnerId
settlementId
paymentReference
amount
currency
paymentDate
status
source
```

## 5920. Payment Status

```text
initiated
processing
settled
failed
returned
reversed
unknown
```

## 5921. Settlement Reconciliation

Comparar:

```text
approved commissions
invoice/statement lines
settlement
payment
banking/accounting confirmation
```

## 5922. Reconciliation Run

Campos:

```text
id
partnerId
period
matchedItems
unmatchedItems
amountMatched
amountUnmatched
status
createdAt
completedAt
```

## 5923. Reconciliation Exception

Tipos:

```text
missing_commission
duplicate_commission
amount_mismatch
missing_payment
payment_amount_mismatch
unmatched_invoice_line
reversal_mismatch
currency_mismatch
```

## 5924. Partner Performance Principle

Performance deberá medir operational reality con definitions versionadas.

No deberá ser:

```text
opaque subjective score
```

## 5925. Partner Performance Record

Campos:

```text
partnerId
periodStart
periodEnd
metricVersion
metrics
dataCompleteness
createdAt
```

## 5926. Operational Performance Metrics

```text
referral_acceptance_rate
referral_response_time
client_contact_time
status_update_timeliness
assignment_completion_rate
SLA_breach_rate
support_response_time
```

## 5927. Outcome Performance Metrics

Según domain:

```text
verified_conversion_rate
service_completion_rate
funding_rate_context
closing_rate_context
client_followthrough_rate
```

Siempre con denominators definidos.

## 5928. Data Quality Performance Metrics

```text
status_accuracy
conversion_reporting_accuracy
duplicate_event_rate
missing_evidence_rate
integration_error_rate
data_freshness
```

## 5929. Client Experience Metrics

```text
complaint_rate
support_escalation_rate
client_feedback_rate
not_relevant_feedback
communication_issue_rate
```

## 5930. Quality Scorecard

Dimensiones posibles:

```text
operational_reliability
data_quality
client_experience
compliance_health
technical_health
responsiveness
```

## 5931. Quality Score Boundary

Quality score deberá:

- tener methodology;
- tener version;
- mostrar data completeness;
- permitir manual review;
- no incorporar compensation;
- no publicarse externamente sin policy.

## 5932. Partner Quality Finding

Tipos:

```text
repeated_SLA_breach
high_complaint_rate
status_accuracy_issue
missing_conversion_evidence
data_quality_regression
integration_instability
authorization_issue
compliance_issue
security_issue
```

## 5933. Quality Finding Severity

```text
info
low
moderate
high
critical
```

## 5934. Partner Complaint Record

Campos:

```text
id
partnerId
clientIdOptional
sourceModule
sourceResourceIdOptional
complaintType
description
severity
status
createdAt
resolvedAt
```

## 5935. Complaint Types

```text
unauthorized_contact
misleading_information
unexpected_fee
poor_service
privacy_issue
discrimination_concern
status_mismatch
document_issue
delay
other
```

## 5936. Complaint Status

```text
received
triage
under_review
partner_response_requested
remediation
resolved
closed
escalated
```

## 5937. Complaint Routing

Según type/severity:

```text
support
partner_management
operations
compliance
privacy
security
legal_review_future
executive
```

## 5938. Partner Dispute Record

Campos:

```text
id
partnerId
disputeType
sourceResourceIdOptional
amountOptional
reason
evidenceReferences
status
openedAt
resolvedAt
```

## 5939. Dispute Types

```text
referral_ownership
duplicate_referral
attribution
commission_amount
invoice
payment
chargeback
SLA_measurement
quality_finding
contract_interpretation
other
```

## 5940. Dispute Status

```text
open
evidence_requested
under_review
partner_response
SG_review
resolved
partial_resolution
rejected
cancelled
closed
```

## 5941. Dispute Evidence Principle

Preservar:

```text
original event
partner evidence
SG evidence
contract/rule version
timestamps
final resolution
```

No sobrescribir history.

## 5942. Attribution Dispute

Deberá reconciliar:

```text
referral history
tracking IDs
timestamps
client journey
partner records
conversion records
```

## 5943. Commission Dispute

Deberá comparar:

```text
qualifying event
rule version
calculation inputs
expected amount
partner amount
adjustments
```

## 5944. Partner Remediation Plan

Campos:

```text
id
partnerId
findingIds
complaintIdsOptional
requiredActions
owner
dueDate
status
reviewDate
```

## 5945. Remediation Status

```text
draft
active
waiting_on_partner
waiting_on_SG
verified
failed
extended
closed
```

## 5946. Corrective Action

Ejemplos:

```text
update_documentation
renew_license
fix_integration
improve_SLA
retrain_staff
correct_marketing
correct_privacy_process
reconcile_data
security_remediation
```

## 5947. Partner Review Meeting

Campos:

```text
partnerId
reviewPeriod
agenda
performanceSummary
openFindings
remediationStatus
decisions
nextReviewAt
```

## 5948. Partner Suspension Trigger

Podrá originarse por:

- critical security issue;
- expired required license;
- revoked authorization;
- material compliance issue;
- severe client harm;
- repeated unresolved breach;
- agreement suspension/termination.

Debe ser policy-driven.

## 5949. Suspension Types

```text
full
new_referrals_only
specific_capability
specific_jurisdiction
portal_access
integration_only
payments_hold
```

## 5950. Suspension Record

Campos:

```text
id
partnerId
suspensionType
reason
scope
effectiveAt
status
approvedBy
reviewAt
resolvedAtOptional
```

## 5951. Suspension Propagation

Suspension deberá propagarse a:

```text
routing
marketplace availability
new referrals
new assignments
partner portal access if applicable
integration actions
recommendation candidate availability
```

según scope.

## 5952. Active Client Journey Protection

Suspension no deberá borrar active journeys.

Flujo:

```text
identify affected journeys
→ freeze risky new actions
→ determine safe continuation
→ reroute when permitted
→ notify responsible parties
→ preserve history
```

## 5953. Partner Termination

Termination deberá requerir:

```text
authority
effective date
reason
agreement status update
authorization revocation
access revocation
integration shutdown
offboarding plan
```

## 5954. Offboarding Case

Campos:

```text
id
partnerId
terminationOrExitReason
status
ownerId
effectiveDate
openJourneys
openFinancialItems
openDisputes
retentionRequirements
completedAt
```

## 5955. Offboarding Checklist

```text
stop_new_referrals
stop_new_assignments
disable_access
revoke_credentials
disable_integrations
close_or_transfer_active_work
reconcile_commissions
resolve_or_transfer_disputes
final_statement
document_retention
brand_removal
data_return_or_deletion_review
```

## 5956. Data Retention after Offboarding

Retain according to:

```text
legal
contractual
tax
audit
security
client_service
```

requirements.

No delete required evidence merely because relationship ended.

## 5957. Partner Reactivation

Reactivation deberá requerir:

```text
new verification
current documents
current agreement
current authorization
risk review
approval
```

No simplemente cambiar status a active.

## 5958. Economics / Lifecycle Findings

Tipos:

```text
commission_without_rule
commission_without_evidence
unreconciled_balance
past_due_partner_invoice
payment_failure
quality_regression
complaint_spike
remediation_overdue
suspension_not_propagated
offboarding_incomplete
```

## 5959. Permissions, APIs, Events and Workflows

### Permisos

```text
partner_economics.read
partner_economics.manage

partner_commission.read
partner_commission.calculate
partner_commission.approve

partner_invoice.read
partner_invoice.manage
partner_settlement.read
partner_settlement.manage

partner_performance.read
partner_quality.read
partner_quality.manage

partner_complaint.read
partner_complaint.manage
partner_dispute.read
partner_dispute.manage

partner_remediation.read
partner_remediation.manage

partner_suspend.execute
partner_terminate.execute
partner_offboarding.manage
```

### APIs

```text
POST /api/partners/{id}/compensation-rules
POST /api/partners/{id}/commissions
POST /api/partners/{id}/commissions/{commissionId}/calculate

POST /api/partners/{id}/invoices
POST /api/partners/{id}/settlements
POST /api/partners/{id}/reconciliation-runs

GET  /api/partners/{id}/performance
POST /api/partners/{id}/quality-findings

POST /api/partners/{id}/complaints
POST /api/partners/{id}/disputes
POST /api/partners/{id}/remediation-plans

POST /api/partners/{id}/suspensions
POST /api/partners/{id}/offboarding-cases
```

### Eventos

```text
PartnerCompensationRuleActivated
PartnerCommissionCreated
PartnerCommissionEarned
PartnerCommissionApproved
PartnerCommissionReversed
PartnerInvoiceIssued
PartnerSettlementCreated
PartnerPaymentSettled
PartnerReconciliationCompleted
PartnerQualityFindingCreated
PartnerComplaintCreated
PartnerDisputeCreated
PartnerRemediationStarted
PartnerSuspended
PartnerTerminationInitiated
PartnerOffboardingStarted
PartnerOffboardingCompleted
PartnerReactivated
```

### Workflows

```text
Partner Commission Workflow
Partner Billing Workflow
Partner Settlement Workflow
Partner Reconciliation Workflow
Partner Performance Workflow
Partner Quality Workflow
Partner Complaint Workflow
Partner Dispute Workflow
Partner Remediation Workflow
Partner Suspension Workflow
Partner Termination Workflow
Partner Offboarding Workflow
Partner Reactivation Workflow
```

## 5960. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Create Partner Economic Relationship.
2. Create referral-fee model.
3. Create revenue-share model.
4. Create Compensation Rule.
5. Expire compensation rule.
6. Create Qualifying Event definition.
7. Block undefined qualifying event.
8. Create Partner Commission.
9. Block earned without evidence.
10. Calculate commission.
11. Adjust commission.
12. Reverse commission.
13. Create Partner Billing Account.
14. Create Invoice.
15. Create Invoice Lines.
16. Create Partner Statement.
17. Create Settlement.
18. Create Payment Record.
19. Reconcile settlement.
20. Create reconciliation exception.
21. Create Partner Performance Record.
22. Calculate operational metrics.
23. Calculate outcome metrics with denominator.
24. Calculate data quality metrics.
25. Calculate client experience metrics.
26. Create Quality Scorecard.
27. Verify compensation excluded from quality score.
28. Create Quality Finding.
29. Create Client Complaint.
30. Route privacy complaint.
31. Create Partner Dispute.
32. Create attribution dispute.
33. Create commission dispute.
34. Preserve original evidence.
35. Create Remediation Plan.
36. Add corrective action.
37. Create Partner Review Meeting.
38. Trigger suspension from expired license.
39. Create limited suspension.
40. Propagate suspension to routing.
41. Propagate suspension to marketplace.
42. Block new referrals.
43. Preserve active client journeys.
44. Create termination.
45. Revoke authorizations.
46. Create Offboarding Case.
47. Execute offboarding checklist.
48. Reconcile final commissions.
49. Remove brand usage.
50. Preserve required retention data.
51. Reactivate only after re-verification.
52. Create economics finding.
53. Create offboarding-incomplete finding.
54. Test M37 economics handoff.
55. Test M39 commission reference.
56. Test permissions.
57. Test APIs.
58. Test events/outbox.
59. Test workflows.
60. Test immutable audit.

### Criterios de aceptación

La Parte 3 estará completa cuando:

1. Exista Partner Economic Relationship.
2. Existan Economic Models.
3. Exista Compensation Rule.
4. Exista Rule Status.
5. Exista Qualifying Event Registry.
6. Qualifying events estén versionados.
7. Exista Partner Commission Record.
8. Exista Commission Status.
9. Exista Commission Recognition Gate.
10. Exista Commission Calculation Record.
11. Existan adjustments/reversals.
12. Exista Revenue Share Context.
13. Exista Partner Billing Account.
14. Exista Partner Invoice.
15. Exista Invoice Status.
16. Exista Invoice Line.
17. Exista Partner Statement.
18. Exista Settlement Record.
19. Exista Settlement Status.
20. Exista Partner Payment Record.
21. Exista Settlement Reconciliation.
22. Exista Reconciliation Run.
23. Existan Reconciliation Exceptions.
24. Exista Partner Performance Principle.
25. Exista Partner Performance Record.
26. Existan operational metrics.
27. Existan outcome metrics.
28. Existan data quality metrics.
29. Existan client experience metrics.
30. Exista Quality Scorecard.
31. Quality score excluya compensation.
32. Exista Partner Quality Finding.
33. Exista Finding Severity.
34. Exista Partner Complaint.
35. Existan Complaint Types.
36. Exista Complaint Routing.
37. Exista Partner Dispute.
38. Existan Dispute Types.
39. Exista Dispute Status.
40. Dispute evidence se preserve.
41. Exista Attribution Dispute.
42. Exista Commission Dispute.
43. Exista Remediation Plan.
44. Exista Remediation Status.
45. Existan Corrective Actions.
46. Exista Partner Review Meeting.
47. Existan Suspension Triggers.
48. Existan Suspension Types.
49. Exista Suspension Record.
50. Suspension se propague.
51. Active journeys estén protegidos.
52. Exista Partner Termination.
53. Exista Offboarding Case.
54. Exista Offboarding Checklist.
55. Exista retention after offboarding.
56. Exista Reactivation workflow.
57. Existan Economics/Lifecycle Findings.
58. Existan permisos/APIs/events/workflows.
59. Toda economic event tenga source/rule/version.
60. Toda suspension/termination sea auditada.
61. Parte 3 termine lista para Integrations/Automation/AI/Security de Parte 4.

### Instrucciones para Codex

1. Lee Partes 1–2 completas.
2. Reuse M37/M39 economics where applicable.
3. Implement EconomicRelationship/CompensationRule.
4. Version qualifying events.
5. Never mark earned without verified evidence.
6. Preserve original commission through adjustments.
7. Implement Billing/Invoices/Statements/Settlements.
8. Implement reconciliation and exceptions.
9. Define metric denominators explicitly.
10. Implement QualityScorecard without compensation.
11. Implement Complaints/Disputes with evidence preservation.
12. Implement Remediation.
13. Implement scoped suspension types.
14. Propagate suspension to routing/marketplace/referrals/integrations.
15. Preserve active journeys.
16. Implement Termination/Offboarding.
17. Reconcile final economics.
18. Apply retention rules.
19. Require re-verification for reactivation.
20. Implement Findings.
21. Implement permissions/APIs/events/workflows.
22. Implement immutable audit.
23. No marques Parte 3 completa si compensation can influence quality/ranking invisibly, or if suspended partners can keep receiving new referrals.

### Verificación final de Parte 3

- ¿Economic rules están contract-backed y versionadas?
- ¿Commission requiere qualifying evidence?
- ¿Expected/earned/approved/paid/reversed están separados?
- ¿Invoices/statements/settlements se reconcilian?
- ¿Performance metrics tienen denominators?
- ¿Quality score excluye compensation?
- ¿Complaints/disputes preservan evidencia?
- ¿Remediation tiene owner/due date/status?
- ¿Suspension puede limitar solo capability/jurisdiction?
- ¿Suspension bloquea new traffic donde corresponda?
- ¿Active journeys se protegen?
- ¿Offboarding revoca access/integrations y reconcilia economics?
- ¿Reactivation requiere nueva verificación?
- ¿Toda acción material queda auditada?

---

# Parte 4 — Integrations, Automation, AI, Compliance, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 40 — Parte 3  
**Secciones incluidas:** 5961–6025  
**Audiencia:** Owner, Codex, partner operations, compliance, security, finance, engineering, data/analytics, support y administrators  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Partner Management centralizado, multi-tenant, auditable y policy-driven, con integrations desacopladas, automation supervisada, AI grounded, seguridad de mínimo privilegio, analytics gobernados, continuity y recuperación segura

## 5961. Objetivo de Parte 4

Esta parte cierra el Módulo 40 definiendo:

- partner integrations;
- adapters;
- webhooks/polling;
- idempotency;
- automation;
- AI;
- compliance;
- security;
- administration;
- observability;
- analytics;
- data quality;
- migration;
- portability;
- business continuity;
- disaster recovery;
- E2E;
- criterios finales de aceptación.

## 5962. Partner Integration Architecture

Principio:

```text
external partner system
→ partner adapter
→ normalized partner contract
→ Partner Management
→ source module
```

Los módulos consumidores no deberán implementar integraciones directas duplicadas cuando el adapter común sea reutilizable.

## 5963. Partner Adapter Registry

Campos:

```text
id
partnerId
adapterCode
adapterType
capabilities
environment
status
version
effectiveFrom
effectiveTo
```

## 5964. Adapter Capabilities

```text
referral_submission
assignment_sync
status_sync
document_exchange
appointment_sync
conversion_sync
commission_sync
invoice_sync
payment_sync
catalog_or_product_sync
webhook_receive
polling
secure_file_exchange
```

## 5965. Integration Authentication / Credential Record

Campos:

```text
id
partnerId
adapterId
authType
credentialReference
scope
environment
status
rotatedAt
expiresAtOptional
```

Nunca almacenar secrets en plaintext.

## 5966. Webhook Inbox

Flujo:

```text
authenticate
→ store raw event
→ deduplicate
→ validate source
→ normalize
→ route
→ process idempotently
→ audit
```

## 5967. Webhook Security

Validar cuando aplique:

```text
signature
timestamp
replayWindow
sourceIP_or_network_context
eventId
environment
schemaVersion
```

## 5968. Polling / File Exchange Fallback

Cuando no haya webhook/API:

- scheduled polling;
- SFTP/secure file exchange;
- cursor/checkpoint;
- rate limiting;
- retry/backoff;
- reconciliation;
- alerting.

## 5969. External Action Idempotency

Toda material write externa deberá usar:

```text
partnerId
actionType
sourceResourceId
idempotencyKey
requestHash
createdAt
```

para impedir duplicate referrals, updates o payments.

## 5970. Unknown External Outcome

Ante timeout luego de submission:

```text
outcome_unknown
```

No marcar automáticamente success/failure ni hacer blind retry.

Debe:

```text
reconcile
→ confirm
→ retry only if safe
```

## 5971. Partner Automation Engine

Automatizaciones permitidas:

- document expiry reminders;
- license review reminders;
- SLA alerts;
- partner capacity alerts;
- data freshness checks;
- integration health checks;
- reconciliation candidate generation;
- quality finding generation;
- offboarding checklist tasks.

## 5972. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 5973. Informational / Low-Risk Automation

Ejemplos:

- create reminder;
- refresh dashboard;
- flag expiring agreement;
- mark integration degraded;
- create SLA task;
- open review queue item.

## 5974. Moderate-Risk Automation

Ejemplos:

- propose capability change;
- propose partner reassignment;
- calculate expected commission;
- prepare remediation plan draft;
- propose document verification.

No ejecutar final high-impact decision.

## 5975. High-Risk Automation

Requiere human/authorized gate:

- activate partner;
- grant new authorization;
- expand jurisdiction;
- approve commission;
- suspend partner;
- terminate partner;
- release sensitive export;
- override expired critical evidence.

## 5976. Prohibited Automation

No deberá:

- fabricate partner verification;
- auto-waive missing licenses;
- auto-approve contracts;
- auto-share new sensitive data;
- silently reroute clients for compensation;
- erase complaint/dispute evidence;
- reactivate partner without verification.

## 5977. AI Assistant Scope

AI podrá:

- summarize partner profile;
- summarize due diligence;
- summarize SLA/performance;
- classify support cases;
- draft internal remediation;
- summarize disputes;
- detect missing information;
- summarize integration failures;
- draft partner review notes.

## 5978. AI Grounding

AI deberá usar:

```text
Partner Record
Capability
Jurisdiction
Agreement
Authorization
Document
Performance Record
Quality Finding
Complaint
Dispute
Integration Health
```

con source/version/freshness.

## 5979. AI Decision Boundary

AI no deberá:

- approve partner;
- verify license;
- grant authorization;
- sign agreement;
- suspend/terminate partner;
- approve payment/commission;
- decide legal/compliance outcome.

Puede recomendar/revisar, sujeto a human gate.

## 5980. AI Output Contract

Campos:

```text
taskType
summary
sourceReferences
unknowns
riskFlags
confidence
recommendedNextActions
humanReviewRequired
generatedAt
```

## 5981. AI Finding Types

```text
unsupported_partner_fact
stale_source_used
missing_authorization
missing_license_context
unsupported_quality_claim
unsupported_compliance_claim
economic_conflict_not_disclosed
insufficient_evidence
```

## 5982. Partner Compliance Governance

Compliance deberá cubrir:

- licensing;
- jurisdiction;
- data-sharing authority;
- marketing authorization;
- referral practices;
- client communication;
- required disclosures;
- privacy/security obligations;
- contract obligations.

## 5983. License / Authorization Refresh Governance

Critical evidence con expiry deberá:

```text
remind
→ reverify
→ downgrade/limit if overdue
→ suspend affected capability when required
```

No mantener capability activa indefinidamente con expired evidence.

## 5984. Privacy / Communication / Marketing Governance

Antes de:

```text
share client data
send partner marketing
allow client contact
use partner brand
```

verificar:

```text
purpose
consent
authorization
agreement
communication preference
brand permission
```

## 5985. Compensation Conflict Governance

Compensation deberá permanecer separada de:

```text
organic partner routing
organic marketplace ranking
recommendation suitability
quality score
```

Si economics influyen en una authorized commercial surface, deberá haber:

```text
explicit rule
disclosure
audit
```

## 5986. Security Model

Aplicar:

- MFA;
- RBAC;
- ABAC;
- tenant isolation;
- partner isolation;
- resource-level access;
- field-level access;
- purpose limitation;
- least privilege;
- reauthentication;
- immutable audit.

## 5987. Sensitive Partner Data

Incluye:

```text
partner_credentials
contracts
commercial_terms
tax_documents
banking/payment_references
client_referrals
conversion_evidence
complaints
disputes
security_findings
internal_notes
```

## 5988. Field-Level Masking

Ejemplos:

```text
Tax ID: ***-**-3920
Bank: ******4821
Credential: secret_ref_***
Contract Terms: restricted
```

## 5989. Purpose-Based Access

Material read deberá registrar:

```text
userId
partnerId
resourceId
purpose
scope
timestamp
```

Purposes:

```text
onboarding
operations
finance
compliance
support
security
audit
```

## 5990. Partner Portal Security

Controles:

- MFA;
- session controls;
- partner-bound authorization;
- no cross-partner enumeration;
- least privilege;
- file scanning;
- download audit;
- rapid access revocation.

## 5991. API / Integration Security

Controles:

```text
credential isolation
scoped tokens
rate limits
allowlisted endpoints
schema validation
request signing when supported
replay protection
kill switch
```

## 5992. Privileged Actions

Ejemplos:

- approve partner;
- grant authorization;
- expand capability/jurisdiction;
- publish agreement change;
- reveal restricted commercial terms;
- approve settlement;
- suspend/terminate/reactivate;
- export sensitive partner data.

## 5993. Owner Break-Glass

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

No crea permanent bypass.

## 5994. Security Incident Types

```text
cross_partner_access
unauthorized_client_data_access
credential_compromise
partner_portal_account_takeover
unauthorized_API_access
document_exposure
commission_manipulation
agreement_tampering
audit_tampering_attempt
privilege_misuse
```

## 5995. Security Incident Response

```text
detect
→ contain
→ revoke/disable
→ preserve evidence
→ assess affected partners/clients
→ rotate credentials
→ remediate
→ restore verified state
→ post-incident review
```

## 5996. Partner Administration Console

Secciones:

```text
Overview
Partners
Onboarding
Verification
Contacts
Capabilities
Jurisdictions
Agreements
Authorizations
Documents
Portal Users
Referrals
Assignments
SLA
Messages
Integrations
Economics
Performance
Quality
Complaints
Disputes
Remediation
Suspensions
Offboarding
Security
Analytics
Configuration
```

## 5997. Central Work Queues

```text
partner_onboarding
verification_due
license_expiry
agreement_expiry
authorization_review
referral_exception
SLA_breach
document_review
integration_issue
commission_review
reconciliation
complaint
dispute
remediation
suspension_review
offboarding
security_review
```

## 5998. Queue Assignment / SLA Engine

Podrá considerar:

- partner type;
- relationship;
- capability;
- jurisdiction;
- severity;
- financial impact;
- compliance/security risk;
- language;
- expertise;
- workload;
- SLA.

## 5999. Observability

Métricas técnicas:

```text
partner_portal_error_rate
webhook_failure_rate
polling_failure_rate
sync_lag
credential_expiry_rate
document_processing_failure_rate
assignment_sync_failure_rate
commission_reconciliation_failure_rate
```

## 6000. Operational Alerts

Alertas:

- expired critical license;
- expired authorization still in use;
- suspended partner receiving new referral;
- cross-partner access attempt;
- stale agreement;
- capacity overflow;
- unresolved critical complaint;
- payment anomaly;
- integration outage;
- offboarding incomplete.

## 6001. Partner Analytics Dashboards

```text
Partner Executive Dashboard
Onboarding Dashboard
Verification Dashboard
Operations Dashboard
SLA Dashboard
Capacity Dashboard
Integration Health Dashboard
Economics Dashboard
Performance Dashboard
Quality Dashboard
Complaint / Dispute Dashboard
Lifecycle Dashboard
```

## 6002. Onboarding KPIs

```text
partners_in_onboarding
median_onboarding_time
verification_completion_rate
blocked_onboarding_rate
document_rejection_rate
time_to_go_live
```

## 6003. Operational KPIs

```text
referral_acceptance_rate
assignment_completion_rate
response_time
client_contact_time
SLA_breach_rate
capacity_utilization
support_case_rate
```

## 6004. Quality KPIs

```text
quality_findings
complaint_rate
dispute_rate
status_accuracy
missing_evidence_rate
remediation_success_rate
repeat_finding_rate
```

## 6005. Economics KPIs

```text
earned_commissions
approved_commissions
paid_commissions
reversed_commissions
partner_invoice_balance
settlement_variance
reconciliation_exception_rate
```

## 6006. Lifecycle KPIs

```text
active_partner_count
limited_partner_count
suspended_partner_count
offboarding_count
reactivation_count
authorization_expiry_rate
agreement_expiry_rate
```

## 6007. Integration KPIs

```text
active_integrations
integration_uptime
webhook_success_rate
polling_success_rate
sync_lag
unknown_external_outcome_rate
credential_rotation_compliance
```

## 6008. Metric Governance

Cada KPI deberá incluir:

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

## 6009. Data Quality Controls

Checks:

- duplicate Partner;
- orphan organization/person;
- active capability without authorization;
- active jurisdiction with expired license;
- agreement/version mismatch;
- stale critical document;
- cross-partner assignment mismatch;
- commission without qualifying event;
- suspended partner still routable;
- offboarding access still active.

## 6010. Data Quality Finding

Campos:

```text
id
findingType
severity
partnerId
resourceType
resourceId
sourceReferences
blocking
status
createdAt
resolvedAt
```

## 6011. Export / Portability Governance

Authorized exports podrán incluir:

```text
partner profile
contacts
capabilities
jurisdictions
agreements metadata
authorizations
documents metadata
performance
complaints/disputes
economics
audit references
```

Aplicar masking y purpose controls.

## 6012. Migration In

Pipeline:

```text
import organizations
→ deduplicate partners
→ map contacts
→ import capabilities/jurisdictions
→ import agreements/authorizations
→ import operational history
→ import economics
→ migration snapshot
→ reconciliation
```

## 6013. Migration Record

Campos:

```text
id
sourceSystem
cutoffDate
partnersImported
contactsImported
agreementsImported
referralsImported
economicRecordsImported
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 6014. Migration Out

Export deberá preservar:

```text
partner IDs
organization/person references
relationship history
capability/jurisdiction history
agreement versions
authorization history
operational events
economics
quality/lifecycle events
audit references
```

## 6015. Business Continuity

Ante outage:

```text
preserve partner registry
→ preserve active assignments
→ stop risky new routing if authorization cannot be verified
→ queue safe low-risk work
→ restore integrations
→ reconcile unknown external outcomes
```

## 6016. Disaster Recovery Priority

Prioridad:

1. partner access/security;
2. active referrals/assignments;
3. capabilities/jurisdictions/authorizations;
4. active client journeys;
5. integrations/status sync;
6. commissions/settlements;
7. analytics.

## 6017. Recovery Verification

Antes de full resume:

```text
verify Partner status
verify critical licenses
verify agreements
verify authorizations
verify portal access
verify integration credentials
verify routing blocks
verify audit continuity
```

## 6018. E2E Scenario 1 — Onboarding to Referral

```text
prospect partner
→ onboarding
→ due diligence
→ agreement
→ authorization
→ capability/jurisdiction
→ portal user
→ referral
→ accept
→ status updates
→ completion
```

## 6019. E2E Scenario 2 — Suspension During Active Work

```text
critical license expires
→ capability suspension
→ new referrals blocked
→ active journeys identified
→ safe continuation/reroute
→ client/SG coordination
→ audit
```

## 6020. E2E Scenario 3 — Commission and Dispute

```text
verified qualifying event
→ commission
→ invoice/statement
→ settlement mismatch
→ dispute
→ evidence review
→ adjustment
→ reconciliation
```

## 6021. E2E Scenario 4 — Integration Security Incident

```text
credential compromised
→ integration kill switch
→ access revoke
→ evidence preserve
→ credential rotation
→ verification
→ controlled resume
```

## 6022. E2E Scenario 5 — Offboarding and Reactivation

```text
termination
→ stop new work
→ transfer/close active work
→ revoke portal/integrations
→ reconcile economics
→ retention
→ later reactivation request
→ full re-verification
```

## 6023. Final Test Matrix

Módulo completo deberá probar:

1. partner creation;
2. partner type/relationship;
3. onboarding;
4. due diligence;
5. licenses;
6. insurance;
7. tax docs;
8. contacts;
9. capabilities;
10. jurisdictions;
11. agreements;
12. authorizations;
13. documents;
14. partner portal;
15. user provisioning/revocation;
16. cross-partner isolation;
17. referrals;
18. assignments;
19. capacity;
20. SLAs;
21. statuses;
22. messaging;
23. appointments;
24. document exchange;
25. support;
26. escalations;
27. commissions;
28. billing;
29. settlements;
30. reconciliation;
31. performance;
32. quality;
33. complaints;
34. disputes;
35. remediation;
36. suspension;
37. offboarding;
38. integrations;
39. webhooks;
40. idempotency;
41. automation;
42. AI boundaries;
43. compliance;
44. security;
45. break-glass;
46. admin;
47. observability;
48. analytics;
49. data quality;
50. migration;
51. portability;
52. continuity;
53. disaster recovery;
54. M35 integration;
55. M36 integration;
56. M37 integration;
57. M39 integration;
58. immutable audit;
59. bilingual UI;
60. negative/security cases.

## 6024. Criterios Finales de Aceptación

El Módulo 40 estará completo cuando:

1. Exista Central Partner Registry.
2. M35/M36/M37/M39 reutilicen Partner IDs.
3. Partner types y relationship types estén separados.
4. Exista onboarding/due diligence.
5. Licenses/insurance/tax docs sean verificables.
6. Existan Partner Contacts.
7. Existan capabilities.
8. Existan jurisdictions.
9. Exista capability-jurisdiction matrix.
10. Existan agreements versionados.
11. Commercial terms estén protegidos.
12. Existan authorizations.
13. Material actions pasen Authorization Gate.
14. Exista Partner Portal.
15. Partner users tengan MFA/scoped access.
16. Cross-partner isolation sea estricta.
17. Existan referrals/assignments/capacity.
18. Existan SLA clocks/pause rules.
19. Raw partner statuses se preserven.
20. Exista secure messaging.
21. Exista scoped document exchange.
22. Existan support/escalations.
23. Existan compensation rules.
24. Commission requiera verified qualifying event.
25. Expected/earned/approved/paid/reversed estén separados.
26. Existan invoices/statements/settlements.
27. Exista reconciliation.
28. Performance metrics tengan denominators.
29. Quality score no use compensation.
30. Existan complaints/disputes.
31. Dispute evidence se preserve.
32. Exista remediation.
33. Existan scoped suspensions.
34. Suspension se propague a routing/marketplace/referrals.
35. Active client journeys estén protegidos.
36. Exista termination/offboarding.
37. Reactivation requiera re-verification.
38. Existan integration adapters.
39. Webhooks/polling sean seguros.
40. External actions sean idempotentes.
41. Unknown outcomes se reconcilien.
42. Exista Automation Engine.
43. High-risk automation requiera gate.
44. Existan prohibited automations.
45. AI esté grounded.
46. AI no tome high-impact decisions.
47. Exista compliance governance.
48. Exista compensation conflict firewall.
49. Exista MFA/RBAC/ABAC.
50. Exista field/purpose-level access.
51. Exista Break-Glass.
52. Exista Security Incident Workflow.
53. Exista Admin Console.
54. Existan Work Queues.
55. Exista Observability.
56. Existan Alerts/Dashboards.
57. Exista Metric Governance.
58. Existan Data Quality Controls.
59. Exista Migration In/Out.
60. Exista Business Continuity/DR.
61. Recovery verifique authorization/access/integration integrity.
62. Existan E2E scenarios.
63. Toda material partner action sea auditable.
64. Las cuatro partes estén integradas.
65. Estado final sea `MODULE COMPLETE`.

## 6025. Instrucciones Finales para Codex y Cierre del Módulo 40

### Instrucciones finales para Codex

1. Lee las cuatro partes completas.
2. Lee M35, M36, M37 y M39 para reutilización correcta.
3. Implementa Partner como shared core aggregate.
4. No dupliques partner registries por vertical.
5. Implementa onboarding/due diligence/document expiry.
6. Implementa capability + jurisdiction + authorization gates.
7. Versiona agreements y commercial terms.
8. Implementa Partner Portal con strict tenant isolation.
9. Implementa referrals/assignments/capacity/SLA.
10. Preserve raw partner statuses.
11. Implementa secure messages/documents.
12. Implementa support/escalations.
13. Implementa contract-backed economics.
14. Nunca reconozcas commission sin qualifying evidence.
15. Implementa billing/settlement/reconciliation.
16. Separa quality de compensation.
17. Implementa complaint/dispute evidence preservation.
18. Implementa remediation/suspension/offboarding.
19. Propaga suspension a todos los módulos consumidores.
20. Preserve active journeys.
21. Implementa adapters/webhooks/polling.
22. Implementa idempotency/unknown-outcome reconciliation.
23. Implementa automation risk levels.
24. Limita AI a grounded assistance.
25. Implementa compliance/privacy/marketing governance.
26. Implementa MFA/RBAC/ABAC/purpose access.
27. Implementa credential/portal security.
28. Implementa Break-Glass.
29. Implementa immutable Audit.
30. Implementa Admin/Queues/SLA.
31. Implementa Observability/Alerts.
32. Implementa Analytics/Metric Governance.
33. Implementa Data Quality.
34. Implementa Migration/Portability.
35. Implementa Continuity/Recovery.
36. Ejecuta Final Test Matrix.
37. No marques módulo listo si partner access puede cruzar tenants.
38. No marques módulo listo si partner puede recibir work sin capability/jurisdiction/authorization válidas.
39. No marques módulo listo si compensation puede alterar organic ranking/quality silenciosamente.
40. No marques módulo listo si suspended/offboarded partners pueden seguir recibiendo new work.

### Verificación final

- ¿Existe un único Partner Registry?
- ¿M35/M36/M37/M39 reutilizan Partner IDs?
- ¿Capabilities/jurisdictions/authorizations gatean actions?
- ¿Portal partner está aislado por tenant?
- ¿SLAs/capacity/statuses son auditables?
- ¿Documents/messages tienen scope?
- ¿Economics son contract-backed?
- ¿Quality excluye compensation?
- ¿Complaints/disputes conservan evidencia?
- ¿Suspension se propaga sin destruir active journeys?
- ¿Integrations son idempotentes?
- ¿Unknown outcomes se reconcilian?
- ¿AI no aprueba partners/commissions/suspensions?
- ¿Security protege partner/client/commercial data?
- ¿Recovery verifica access/authorization/integration state?
- ¿Los E2E scenarios pasan?

# Estado Final del Módulo 40

```text
MÓDULO 40:
PARTNER MANAGEMENT

PARTES:
1. Partner Registry, Onboarding, Due Diligence, Capabilities, Jurisdictions, Agreements y Authorizations
2. Partner Portal, Referrals, Assignments, SLA, Communications, Documents, Support y Escalations
3. Economics, Commissions, Billing, Performance, Quality, Complaints, Disputes, Suspension y Offboarding
4. Integrations, Automation, AI, Compliance, Security, Analytics, Continuity y Cierre

SECCIONES:
5766–6025

ESTADO:
MODULE COMPLETE
```

