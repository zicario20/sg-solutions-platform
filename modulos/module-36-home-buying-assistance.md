# SG Solutions Platform — Módulo 36: Home Buying Assistance Nationwide

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 36. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus seis partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, Homebuyer Intake, Household/Profile, objetivo de compra, property intent, readiness y plan inicial | 4596–4660 | **COMPLETE** |
| 2 | Income, employment, assets, debts, credit context, affordability, DTI, reserves y financial-document readiness | 4661–4725 | **COMPLETE** |
| 3 | Mortgage/Assistance Program Registry: conventional, FHA, VA, USDA, state/local DPA, grants y eligibility rules | 4726–4790 | **COMPLETE** |
| 4 | Matching, lender/partner routing, prequalification/preapproval support, property eligibility, offers y purchase readiness | 4791–4855 | **COMPLETE** |
| 5 | Homebuyer portal, property journey, inspections/appraisal/title/insurance/closing coordination y post-closing handoffs | 4856–4920 | **COMPLETE** |
| 6 | Partners, automation, AI, compliance, security, admin, analytics, migration, continuity, E2E y cierre | 4921–4985 | **COMPLETE** |

**Estado global del Módulo 36:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Homebuyer Intake, Household/Profile, Objetivo de Compra, Property Intent, Readiness y Plan Inicial

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 35 — Business Funding  
**Secciones incluidas:** 4596–4660  
**Audiencia:** Owner, Codex, homebuyer specialists, financial coaches, housing-program specialists, partner managers, compliance, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Cobertura:** Nationwide, con reglas versionadas por programa, estado, condado, ciudad, lender/provider y fecha efectiva  
**Modelo operativo:** Educación, readiness, document preparation, program discovery, coordination y referral; no mortgage underwriting ni promesas de aprobación salvo que una futura capability/licencia expresamente autorizada lo permita

---

## 4596. Objetivo del Módulo 36

El Módulo 36 ayudará a una persona u hogar a organizar y recorrer el proceso de compra de vivienda desde preparación inicial hasta cierre.

Deberá soportar:

- homebuyer intake;
- household profile;
- purchase goals;
- readiness;
- affordability context;
- credit/document preparation;
- mortgage-product discovery;
- down-payment assistance;
- grants/programs;
- lender referrals;
- real-estate-professional coordination;
- property journey;
- closing readiness;
- post-closing handoffs.

---

## 4597. Principio central

```text
Homebuyer profile
→ financial readiness
→ program eligibility
→ lender/program matching
→ preapproval support
→ property search
→ contract
→ underwriting/closing coordination
→ verified closing
→ post-closing plan
```

Nunca:

```text
basic profile
→ guaranteed mortgage approval
```

---

## 4598. Role Boundary

SG Solutions deberá distinguir:

```text
education
homebuyer_readiness
document_preparation
program_discovery
application_assistance
lender_referral
housing_counselor_referral
real_estate_partner_referral
closing_coordination_support
future_licensed_service
```

---

## 4599. Mortgage Licensing Boundary

Mientras SG Solutions no opere bajo la licencia/authority requerida para una actividad:

- no deberá actuar como mortgage lender;
- no deberá emitir una aprobación crediticia;
- no deberá fijar una tasa;
- no deberá negociar términos como si fuera lender/originator;
- no deberá representar que un lender aprobará la solicitud;
- deberá dirigir actos regulados al profesional autorizado correspondiente.

---

## 4600. Nationwide Architecture Principle

La lógica deberá separar:

```text
Federal Program Rules
+
State Rules
+
County/City Programs
+
Lender Overlays
+
Property-Specific Rules
+
Household Facts
```

No deberá existir una única regla nacional hardcoded para todo.

---

## 4601. Reutilización obligatoria

Reutilizar:

- Clients;
- Persons;
- Households;
- Organizations cuando exista self-employment/business ownership;
- Documents;
- Tasks;
- Approvals;
- Forms;
- Messaging;
- Appointments;
- Marketplace;
- Partners;
- Billing;
- AI Hub;
- Audit;
- Analytics;
- Módulo 30 Tax;
- Módulo 31 Bookkeeping;
- Módulo 35 Business Funding cuando exista business ownership relevante.

---

## 4602. Home Buying Service Catalog

Tipos iniciales:

```text
homebuyer_readiness_assessment
first_time_homebuyer_preparation
mortgage_document_preparation
down_payment_assistance_discovery
housing_program_discovery
USDA_readiness
FHA_readiness
VA_readiness
conventional_readiness
credit_readiness_for_homebuying
lender_referral
housing_counselor_referral
purchase_process_coordination
custom_homebuyer_service
```

---

## 4603. Delivery Model

```text
sg_education_and_preparation
sg_managed_with_partner
marketplace_referral
housing_counselor_referral
client_self_service
future_licensed_service
```

Cada servicio deberá mostrar el rol de cada parte.

---

## 4604. Homebuyer Engagement

Campos:

```text
id
clientId
householdId
serviceOrderId
serviceType
deliveryModel
assignedSpecialistId
reviewerId
status
openedAt
completedAt
createdAt
updatedAt
```

---

## 4605. Homebuyer Case

Campos:

```text
id
caseNumber
engagementId
clientId
householdId
homebuyerProfileId
purchaseGoalId
status
priority
assignedTo
reviewerId
createdAt
updatedAt
completedAt
```

---

## 4606. Homebuyer Case Status

```text
draft
intake_pending
profile_review
financial_readiness
credit_readiness
program_discovery
lender_matching
preapproval_in_progress
purchase_ready
property_search
under_contract
closing_preparation
closed
paused
cancelled
archived
```

---

## 4607. Homebuyer Intake

Bloques:

```text
Personal Identity
Household
Current Housing
Purchase Goal
Target Geography
Property Intent
Income
Employment
Assets
Debts
Credit Context
Homeownership History
Program Preferences
Timeline
Documents
Consent
```

---

## 4608. Progressive Intake

Pipeline:

```text
basic purchase goal
→ household
→ target area
→ first readiness
→ financial questions
→ program-specific questions
```

Evitar pedir información sensible sin necesidad.

---

## 4609. Homebuyer Profile

Campos:

```text
id
clientId
householdId
profileVersion
primaryApplicantId
coApplicantIds
currentHousingStatus
homeownershipHistory
targetGeographies
propertyIntent
financialReadinessSummary
creditContext
programContext
status
createdAt
updatedAt
```

---

## 4610. Homebuyer Profile Versioning

Crear nueva versión ante cambios materiales:

- applicant/co-applicant;
- household size;
- income;
- employment;
- target geography;
- purchase price target;
- property type;
- occupancy intent;
- assets;
- debts;
- homeownership history.

---

## 4611. Household Record

Campos:

```text
id
primaryClientId
members
householdSize
dependentsCount
incomeMembers
nonBorrowingMembers
currentAddress
createdAt
updatedAt
```

La composición exacta usada para un programa deberá depender de la definición de ese programa.

---

## 4612. Borrower versus Household Member

Distinguir:

```text
borrower
co_borrower
non_borrowing_spouse
dependent
other_household_member
```

No todos los household members forman parte del loan application.

---

## 4613. Household Definition Boundary

Para programas con income limits, la definición de household/program income puede diferir de borrower income.

El sistema deberá permitir:

```text
programHouseholdDefinition
```

versionada por programa.

---

## 4614. Applicant Role

Campos:

```text
personId
role
ownershipIntent
occupancyIntent
incomeUsedForQualification
creditUsedForQualification
status
```

---

## 4615. Identity Verification Context

La plataforma podrá verificar:

- name;
- DOB when required;
- current address;
- contact info;
- identity document;
- tax identifier under sensitive controls.

Solo cuando el workflow lo requiera.

---

## 4616. Current Housing Status

```text
renting
living_with_family
owning
owning_with_mortgage
temporary_housing
other
```

---

## 4617. Current Housing Expense

Campos:

```text
monthlyRent
monthlyMortgage
taxes
insurance
HOA
utilitiesOptional
source
verificationStatus
```

---

## 4618. Homeownership History

Campos:

```text
currentlyOwnsHome
previouslyOwnedHome
lastOwnershipEndDate
propertyTypes
ownershipInterest
dispositionStatus
source
```

---

## 4619. First-Time Homebuyer Context

La plataforma deberá tratar `first_time_homebuyer` como una definición program-specific.

Estados:

```text
not_evaluated
potentially_qualifies
does_not_qualify_under_selected_definition
needs_information
manual_review_required
```

---

## 4620. Purchase Goal

Campos:

```text
id
homebuyerCaseId
targetPurchasePrice
minimumPrice
maximumPrice
desiredMonthlyHousingCost
cashAvailableForPurchase
targetClosingDate
timeline
purchasePurpose
status
```

---

## 4621. Purchase Purpose

```text
primary_residence
second_home_future_support
investment_property_future_support
multi_unit_owner_occupied
manufactured_home
new_construction
existing_home
other
```

MVP deberá priorizar owner-occupied primary residence.

---

## 4622. Occupancy Intent

```text
owner_occupied_primary
owner_occupied_multi_unit
second_home
investment
unknown
```

Program matching deberá respetar occupancy rules.

---

## 4623. Target Geography

Campos:

```text
country
state
county
city
ZIP
specificAreas
ruralPreference
commuteConstraints
schoolOrOtherPreferences
```

---

## 4624. Geography Resolution

El system deberá convertir location intent en:

```text
state
county
municipality
ZIP
census_or_program_geography_when_needed
```

para program eligibility.

---

## 4625. Rural Eligibility Context

Para programas que dependan de rural/property-area eligibility:

```text
potential_area_fit
address_required
eligible_under_current_area_map
not_eligible_under_current_area_map
verification_required
```

No deberá asumirse rural solo por city population o apariencia.

---

## 4626. Property Intent

Campos:

```text
propertyType
unitCount
newOrExisting
manufacturedFlag
condoFlag
plannedUse
repairsExpected
landIncluded
mixedUseFlag
unknowns
```

---

## 4627. Property Types

```text
single_family
townhome
condominium
two_to_four_unit
manufactured_home
modular_home
new_construction
other_supported
```

---

## 4628. Unit Count

Deberá mantenerse explícito:

```text
1
2
3
4
5_plus_or_commercial_context
unknown
```

Algunos residential programs solo aplican a determinados unit counts.

---

## 4629. Mixed-Use Context

Si existe business/commercial use:

```text
mixedUseFlag
commercialPercentageEstimated
residentialUse
businessUse
reviewStatus
```

Program rules determinarán elegibilidad.

---

## 4630. Property Condition Intent

```text
move_in_ready
minor_repairs
major_repairs
rehab
unknown
```

Esto podrá activar programas/productos de renovation en fases posteriores.

---

## 4631. Purchase Timeline

```text
immediately
within_30_days
1_to_3_months
3_to_6_months
6_to_12_months
more_than_12_months
exploring
```

---

## 4632. Readiness versus Urgency

Una fecha objetivo cercana no deberá:

- eliminar document requirements;
- justificar datos falsos;
- forzar programa inadecuado;
- convertir estimate en approval.

---

## 4633. Homebuyer Readiness Dimensions

```text
identity
household
income
employment
assets
debts
credit
housing_history
purchase_goal
property_intent
documents
program_knowledge
```

---

## 4634. Readiness Dimension Record

Campos:

```text
dimensionCode
status
reason
sourceReferences
missingItems
recommendedActions
reviewedAt
```

---

## 4635. Readiness Status

```text
ready
mostly_ready
needs_work
blocked
not_evaluated
not_applicable
```

---

## 4636. Mortgage Readiness versus Eligibility

Separar:

```text
readiness
```

de:

```text
programEligibility
lenderEligibility
underwritingDecision
```

Son conceptos diferentes.

---

## 4637. Homebuyer Readiness Assessment

Campos:

```text
id
homebuyerCaseId
profileVersion
assessmentVersion
dimensions
overallBand
blockingFactors
improvementOpportunities
sourceReferences
reviewStatus
createdAt
```

---

## 4638. Readiness Bands

```text
foundation_incomplete
preparation_stage
financial_readiness_needed
program_screening_ready
lender_referral_ready
manual_review_required
```

No se presentarán como mortgage approval score.

---

## 4639. Blocking Factors

Ejemplos:

```text
identity_issue
income_not_documented
employment_gap_needs_review
asset_documentation_missing
debt_information_missing
credit_data_missing
recent_major_credit_event_requires_program_review
purchase_goal_unclear
occupancy_unclear
property_type_unknown
program_specific_blocker
```

---

## 4640. Improvement Opportunity

Campos:

```text
id
homebuyerCaseId
category
description
priority
estimatedEffort
destinationModule
actionType
status
```

---

## 4641. Improvement Categories

```text
credit
income_documentation
employment_documentation
assets
debt_management
savings
tax_documents
self_employment_records
purchase_budget
program_education
property_goal
```

---

## 4642. Cross-Module Improvement Handoffs

Ejemplos:

```text
tax return/document issue → Módulo 30
self-employed books → Módulo 31
business-income support → Módulo 31/35 context
document collection → shared Documents
```

---

## 4643. Homebuyer Document Checklist

Puede incluir:

```text
identity
tax_returns
W2s_or_1099s
paystubs
employment_verification
bank_statements
asset_statements
retirement_accounts
debt_statements
rent_history
divorce_or_support_documents_when_relevant
business_financials_when_self_employed
gift_fund_documents_when_relevant
other
```

La obligatoriedad deberá depender del selected program/lender.

---

## 4644. Checklist Requirement Status

```text
required_now
required_for_selected_program
conditional
recommended
optional
not_applicable
```

---

## 4645. Document Inventory

Campos:

```text
documentType
documentId
period
applicantId
source
verificationStatus
freshnessStatus
programApplicability
```

---

## 4646. Document Freshness

```text
current
aging
stale
unknown
not_applicable
```

Freshness deberá configurarse por document type/program/lender.

---

## 4647. Homebuyer Finding

Tipos:

```text
missing_data
conflicting_data
stale_document
identity_mismatch
household_mismatch
income_mismatch
asset_mismatch
debt_mismatch
occupancy_issue
property_intent_issue
program_definition_uncertain
```

---

## 4648. Finding Record

Campos:

```text
id
homebuyerCaseId
findingType
severity
description
affectedFields
sourceReferences
blocking
status
assignedTo
createdAt
resolvedAt
```

---

## 4649. Finding Status

```text
open
under_review
client_action_required
partner_action_required
resolved
accepted_with_documented_reason
not_applicable
```

---

## 4650. Client Action Request

Tipos:

```text
confirm_household
upload_income_document
upload_asset_document
confirm_debt
confirm_homeownership_history
select_target_area
clarify_property_type
sign_consent
schedule_consultation
other
```

---

## 4651. Homebuyer Preference Profile

Campos:

```text
targetPrice
maximumComfortablePayment
downPaymentPreference
cashReservePreference
closingCostPreference
fixedOrAdjustablePreference
programPreferences
excludedProgramTypes
propertyPreferences
timelinePreference
```

Estas son preferencias del cliente, no eligibility rules.

---

## 4652. Down Payment Preference

```text
lowest_possible
specific_percentage
specific_amount
flexible
unknown
```

La plataforma no deberá asumir 0% down availability.

---

## 4653. Cash Available for Purchase

Deberá separar:

```text
verifiedLiquidAssets
potentialGiftFunds
expectedSaleProceeds
retirementFundsPotential
unverifiedFunds
```

No todo asset puede usarse automáticamente.

---

## 4654. Gift Funds Context

Campos:

```text
potentialGiftAmount
donorRelationship
fundsReceived
sourceDocumentStatus
programEligibilityUnknown
```

La aceptación dependerá del programa/lender.

---

## 4655. Seller / Third-Party Assistance Context

El system podrá registrar:

```text
sellerConcessionInterest
builderIncentive
lenderCreditInterest
DPAInterest
grantInterest
```

Los límites deberán provenir del programa vigente.

---

## 4656. Preliminary Homebuyer Path

Resultado:

```text
needs_foundation_work
needs_financial_readiness
ready_for_credit_and_affordability_analysis
ready_for_program_discovery
manual_review_required
```

---

## 4657. Homebuyer Readiness Summary

Vista cliente:

- goal;
- timeline;
- readiness dimensions;
- missing documents;
- major blockers;
- next steps;
- what SG Solutions can help with;
- what requires lender/housing professional.

---

## 4658. Internal Review

El specialist deberá revisar:

- household;
- applicant roles;
- homeownership history;
- target geography;
- occupancy;
- property intent;
- timeline;
- current documentation;
- blockers;
- client preferences.

---

## 4659. Permissions, APIs, Events and Workflows

### Permisos

```text
homebuying.case.read
homebuying.case.create
homebuying.case.manage

homebuying.profile.read
homebuying.profile.manage
homebuying.profile.review

homebuying.household.read
homebuying.household.manage

homebuying.readiness.read
homebuying.readiness.evaluate

homebuying.finding.read
homebuying.finding.manage
```

### APIs

```text
POST /api/homebuying/cases
GET  /api/homebuying/cases/{id}

POST /api/homebuying/cases/{id}/intake
POST /api/homebuying/cases/{id}/profiles
POST /api/homebuying/cases/{id}/households
POST /api/homebuying/cases/{id}/purchase-goals

POST /api/homebuying/cases/{id}/readiness-assessments
GET  /api/homebuying/cases/{id}/checklist
POST /api/homebuying/cases/{id}/findings
POST /api/homebuying/cases/{id}/client-actions
POST /api/homebuying/cases/{id}/reviews
```

### Eventos

```text
HomebuyerCaseCreated
HomebuyerIntakeCompleted
HomebuyerProfileCreated
HomebuyerProfileChanged
HomebuyerHouseholdChanged
HomebuyerPurchaseGoalCreated
HomebuyerReadinessEvaluated
HomebuyerBlockerDetected
HomebuyerImprovementOpportunityCreated
HomebuyerClientActionRequested
HomebuyerCaseReadyForFinancialAnalysis
```

### Workflows

```text
Homebuyer Intake Workflow
Homebuyer Profile Workflow
Household Review Workflow
Purchase Goal Workflow
Homebuyer Readiness Workflow
Homebuyer Finding Workflow
Homebuyer Improvement Workflow
Homebuyer Review Workflow
```

---

## 4660. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Homebuyer Engagement.
2. Crear Homebuyer Case.
3. Ejecutar progressive intake.
4. Crear Homebuyer Profile.
5. Versionar profile.
6. Crear Household.
7. Diferenciar borrower de household member.
8. Crear co-borrower.
9. Registrar current housing.
10. Registrar housing expense.
11. Crear homeownership history.
12. Evaluar first-time status como program-specific.
13. Crear Purchase Goal.
14. Registrar price range.
15. Registrar desired housing cost.
16. Registrar primary occupancy.
17. Registrar target geography.
18. Resolver county/city/ZIP.
19. Crear rural verification-required state.
20. Crear Property Intent.
21. Registrar unit count.
22. Registrar mixed-use flag.
23. Registrar property condition.
24. Registrar purchase timeline.
25. Crear readiness dimensions.
26. Separar readiness/eligibility/underwriting.
27. Crear Readiness Assessment.
28. Crear blocking factor.
29. Crear improvement opportunity.
30. Crear Tax handoff.
31. Crear Bookkeeping handoff.
32. Crear Homebuyer Checklist.
33. Diferenciar required/conditional/optional.
34. Crear Document Inventory.
35. Marcar stale document.
36. Crear Homebuyer Finding.
37. Resolver finding.
38. Crear Client Action.
39. Crear Homebuyer Preferences.
40. Registrar down-payment preference.
41. Registrar verified liquid assets.
42. Registrar unverified funds separadamente.
43. Crear gift-funds context.
44. Crear seller/DPA interest.
45. Crear preliminary path.
46. Crear client readiness summary.
47. Ejecutar internal review.
48. Bloquear approval guarantee language.
49. Probar source lineage.
50. Probar profile versioning.
51. Probar permissions.
52. Probar APIs.
53. Probar events/outbox.
54. Probar workflows.
55. Probar immutable audit.
56. Probar tenant isolation.
57. Probar bilingual UI.
58. Probar missing geography.
59. Probar unknown occupancy.
60. Probar manual-review state.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Home Buying Service Catalog.
2. Exista Delivery Model.
3. Exista Homebuyer Engagement.
4. Exista Homebuyer Case.
5. Exista progressive Homebuyer Intake.
6. Exista Homebuyer Profile.
7. Exista profile versioning.
8. Exista Household Record.
9. Borrowers y household members estén separados.
10. Exista program-specific household definition.
11. Existan Applicant Roles.
12. Exista Current Housing Status.
13. Exista Homeownership History.
14. First-time-homebuyer sea program-specific.
15. Exista Purchase Goal.
16. Exista Purchase Purpose.
17. Exista Occupancy Intent.
18. Exista Target Geography.
19. Exista geography resolution.
20. Rural eligibility no se infiera superficialmente.
21. Exista Property Intent.
22. Existan Property Types.
23. Exista Unit Count.
24. Exista Mixed-Use Context.
25. Exista Property Condition Intent.
26. Exista Purchase Timeline.
27. Urgency no permita bypass.
28. Existan Readiness Dimensions.
29. Exista Readiness Assessment.
30. Readiness/eligibility/underwriting estén separados.
31. Existan Blocking Factors.
32. Existan Improvement Opportunities.
33. Existan cross-module handoffs.
34. Exista dynamic Document Checklist.
35. Exista Document Inventory.
36. Exista Document Freshness.
37. Existan Homebuyer Findings.
38. Exista Client Action Request.
39. Exista Preference Profile.
40. Exista Down Payment Preference.
41. Cash available esté clasificado por source/status.
42. Exista Gift Funds Context.
43. Exista seller/DPA interest context.
44. Exista Preliminary Homebuyer Path.
45. Exista Homebuyer Readiness Summary.
46. Exista Internal Review.
47. SG role esté claramente limitado.
48. No existan mortgage approval guarantees.
49. Existan permisos/APIs/events/workflows.
50. Toda evaluación tenga source lineage.
51. Toda incertidumbre pueda quedar explícita.
52. La plataforma sea nationwide mediante reglas versionadas.
53. No se hardcodeen límites/program rules cambiantes.
54. La UI sea bilingüe.
55. Parte 1 termine lista para Financial Readiness de Parte 2.

### Instrucciones para Codex

1. Lee Módulos 30, 31 y 35 antes de implementar integraciones.
2. Reutiliza Clients/Persons/Documents/Tasks/Approvals.
3. Crea Household como primitive reutilizable si aún no existe.
4. Implementa Homebuyer Case.
5. Implementa progressive intake.
6. Mantén field source lineage.
7. Implementa Homebuyer Profile versionado.
8. Separa borrower de household member.
9. Permite program-specific household definitions.
10. Implementa homeownership history.
11. No hardcodees first-time-homebuyer universal.
12. Implementa Purchase Goal.
13. Implementa Occupancy Intent.
14. Implementa target-geography normalization.
15. No infieras rural eligibility sin program/address verification.
16. Implementa Property Intent.
17. Implementa unit-count/mixed-use context.
18. Implementa Readiness Dimensions.
19. Separa Readiness/Eligibility/Underwriting.
20. Implementa Blocking Factors.
21. Implementa Improvement Opportunities.
22. Implementa cross-module Tax/Bookkeeping handoffs.
23. Implementa dynamic Checklist.
24. Implementa Document Freshness.
25. Implementa Findings.
26. Implementa Client Actions.
27. Implementa Preferences.
28. Separa verified liquid assets de potential/unverified funds.
29. Implementa gift-funds context.
30. Implementa DPA/seller assistance interest sin asumir eligibility.
31. Implementa Preliminary Path.
32. Implementa client-facing Readiness Summary.
33. Prohíbe lender-like approval language.
34. Implementa permissions/APIs/events/workflows.
35. Implementa immutable audit.
36. No marques Parte 1 completa si un applicant/household fact puede perder source/version.

### Verificación final de Parte 1

- ¿SG Solutions se mantiene dentro de su rol?
- ¿Household y borrowers están separados?
- ¿First-time-homebuyer depende del programa?
- ¿Occupancy y property intent están claros?
- ¿Target geography está normalizada?
- ¿Rural eligibility requiere verificación real?
- ¿Readiness está separada de eligibility y underwriting?
- ¿Cash available distingue verified/potential/unverified?
- ¿Document requirements pueden cambiar por programa?
- ¿No existen promesas de aprobación?
- ¿Toda evaluación puede rastrearse a sus sources?
- ¿Toda acción material queda auditada?

---

# Parte 2 — Income, Employment, Assets, Debts, Credit Context, Affordability, DTI, Reserves y Financial-Document Readiness

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 36 — Parte 1  
**Secciones incluidas:** 4661–4725  
**Audiencia:** Owner, Codex, homebuyer specialists, financial analysts, housing-program specialists, reviewers, tax/bookkeeping specialists, partner managers y compliance  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Financial readiness explicable y source-backed para homebuying; cálculos internos no sustituyen underwriting del lender y todos los thresholds específicos deberán provenir del programa/lender vigente

## 4661. Objetivo de Parte 2

Esta parte convierte el Homebuyer Profile en un expediente financiero estructurado.

Deberá cubrir:

- employment history;
- income;
- variable income;
- self-employment;
- assets;
- funds to close;
- reserves;
- debts;
- recurring obligations;
- credit context;
- housing expense;
- affordability;
- DTI;
- payment scenarios;
- document readiness;
- financial findings;
- analyst review.

## 4662. Financial Readiness Principle

```text
verified documents
→ normalize household/borrower facts
→ calculate
→ reconcile
→ explain
→ review
→ readiness
```

Nunca:

```text
self-reported income
→ mortgage qualification fact
```

## 4663. Borrower Financial Profile

Campos:

```text
id
homebuyerCaseId
applicantId
profileVersion
employmentSummary
incomeSummary
assetSummary
debtSummary
creditContext
housingExpense
fundsToCloseSummary
reserveSummary
sourceReferences
verificationStatus
createdAt
```

## 4664. Financial Profile Versioning

Crear nueva versión cuando cambie materialmente:

- employer;
- job status;
- income;
- debt;
- assets;
- bank balance;
- credit context;
- support/alimony obligations;
- self-employment profile;
- purchase assumptions.

## 4665. Employment Record

Campos:

```text
id
applicantId
employerName
employmentType
jobTitle
startDate
endDate
currentFlag
hoursOrSchedule
basePayType
status
source
verificationStatus
```

## 4666. Employment Types

```text
W2_full_time
W2_part_time
hourly
salary
commission
bonus
overtime
seasonal
temporary
contract
self_employed
retired
unemployed
other
```

## 4667. Employment History

La plataforma deberá poder construir:

```text
current employment
prior employment
gaps
overlaps
job changes
industry continuity
```

sin concluir automáticamente que un gap descalifica.

## 4668. Employment Gap Record

Campos:

```text
startDate
endDate
durationDays
reason
source
documentationStatus
reviewStatus
```

## 4669. Income Source Record

Tipos:

```text
salary
hourly_wages
overtime
bonus
commission
self_employment
rental_income
retirement
social_security
disability_income_context
child_support_or_alimony_when_client_elects_and_program_allows
investment_income
other
```

## 4670. Income Source Fields

```text
applicantId
incomeType
grossAmount
frequency
startDate
historyLength
continuanceContext
sourceDocuments
verificationStatus
```

## 4671. Gross versus Net Income

El módulo deberá distinguir:

```text
grossIncome
netTakeHome
taxableIncome
qualifyingIncomeEstimate
```

No deberán usarse como equivalentes.

## 4672. Income Normalization

Frecuencias:

```text
hourly
weekly
biweekly
semimonthly
monthly
annual
irregular
```

La normalización deberá conservar metodología.

## 4673. Annualized Income Calculation

Podrá calcularse:

```text
annualizedIncome
```

con:

```text
methodologyCode
sourcePeriod
hoursAssumption
payFrequency
adjustments
```

No deberá usarse una assumption implícita.

## 4674. Variable Income

Tipos:

```text
overtime
bonus
commission
tips
seasonal
irregular_hours
other_variable
```

Deberá conservar history y volatility.

## 4675. Variable Income Assessment

Estados:

```text
history_sufficient_for_review
history_limited
declining
stable
increasing
insufficient_information
manual_review_required
```

Los lender/program rules decidirán su treatment final.

## 4676. Self-Employment Profile

Campos:

```text
applicantId
businessOrganizationIdOptional
businessName
ownershipPercentage
businessStartDate
industry
taxClassification
incomeHistory
bookkeepingStatus
taxReturnStatus
businessBankingStatus
reviewStatus
```

## 4677. Self-Employment Data Sources

Podrá reutilizar:

- Módulo 30 Tax;
- Módulo 31 Bookkeeping;
- Módulo 32 Business Formation;
- Módulo 33 EIN;
- Módulo 34 Compliance;
- Módulo 35 Business Funding context.

## 4678. Self-Employment Income Boundary

La plataforma podrá calcular un:

```text
qualifyingIncomeEstimate
```

solo como estimate interno con methodology explícita.

No deberá presentarse como lender-calculated qualifying income.

## 4679. Self-Employment Financial Documents

Checklist potencial:

```text
personal_tax_returns
business_tax_returns
year_to_date_P&L
balance_sheet
business_bank_statements
K1_or_equivalent_context
1099s
business_license_when_relevant
other
```

La lista final dependerá de lender/program.

## 4680. Income Consistency Check

Comparar:

```text
paystubs
W2_or_1099
tax_returns
bank_deposits
employer_verification
bookkeeping
client_input
```

Conflictos deberán crear finding.

## 4681. Income Finding Types

```text
missing_income_document
income_mismatch
declining_variable_income
employment_gap
unverified_employment
self_employment_document_gap
continuance_uncertain
other
```

## 4682. Asset Account Record

Campos:

```text
id
applicantId
institution
accountType
ownershipType
currentBalance
availableBalance
statementDate
sourceDocumentId
verificationStatus
```

## 4683. Asset Types

```text
checking
savings
money_market
CD
brokerage
retirement
cash_value_asset_context
business_account
gift_funds
sale_proceeds
other
```

## 4684. Liquid versus Non-Liquid Assets

Clasificar:

```text
liquid
conditionally_liquid
non_liquid
restricted
unknown
```

No todo asset deberá contarse automáticamente para closing.

## 4685. Funds to Close

Campos:

```text
downPayment
estimatedClosingCosts
prepaids
discountPointsIfAny
reservesRequiredIfAny
lessVerifiedCredits
lessVerifiedAssistance
estimatedFundsToClose
```

Este cálculo deberá marcarse estimate hasta existir lender/closing disclosure.

## 4686. Funds-to-Close Source

Fuentes posibles:

```text
borrower_assets
gift_funds
DPA
grant
seller_credit
lender_credit
sale_proceeds
other_verified_source
```

## 4687. Asset Sufficiency Status

```text
sufficient_for_current_estimate
potentially_sufficient
insufficient
needs_verification
unknown
```

## 4688. Large Deposit Review

La plataforma podrá identificar:

```text
unusual_or_large_deposit
```

y crear task de source documentation.

No deberá asumir que el deposit es ineligible.

## 4689. Gift Funds Record

Campos:

```text
donor
relationship
amount
receivedFlag
depositDate
giftLetterDocumentId
transferEvidence
programRuleStatus
verificationStatus
```

## 4690. Reserve Calculation

Campos:

```text
verifiedEligibleAssets
estimatedHousingPayment
reserveMonths
methodologyCode
calculationDate
```

Program/lender rules determinarán qué assets cuentan.

## 4691. Reserve Status

```text
not_evaluated
appears_sufficient
appears_insufficient
needs_information
not_required_under_selected_rule
manual_review_required
```

## 4692. Liability Record

Campos:

```text
id
applicantId
liabilityType
creditor
currentBalance
monthlyPayment
remainingTerm
securedFlag
source
verificationStatus
```

## 4693. Liability Types

```text
mortgage
auto_loan
student_loan
credit_card
personal_loan
installment_loan
business_debt_personally_obligated
child_support
alimony
tax_payment_plan
judgment_or_other_obligation_context
other
```

## 4694. Recurring Obligation Rule

La inclusion en DTI deberá depender de:

```text
program rule
+
lender overlay
+
remaining term
+
documented payment
```

No deberá hardcodearse universalmente.

## 4695. Debt Reconciliation

Comparar:

```text
credit report
client disclosure
bank debits
loan statements
tax records when relevant
```

Diferencias deberán quedar explícitas.

## 4696. Credit Context Record

Campos:

```text
applicantId
creditDataSource
scoreModelWhenKnown
scoreValues
tradelineSummary
derogatorySummary
inquiries
creditAgeSummary
utilizationContext
consentId
pulledAt
```

## 4697. Credit Data Consent

Antes de obtener datos externos:

```text
purpose
provider
softOrHardPullWhenKnown
dataScope
authorizedAt
expiresAt
status
```

## 4698. Credit Score Boundary

La plataforma deberá distinguir:

```text
consumer_score
mortgage_specific_score_when_provided
educational_score
self_reported_score
```

No deberá asumir que todos son equivalentes.

## 4699. Credit Event Context

Podrá registrar:

```text
late_payment
collection
charge_off
bankruptcy
foreclosure
short_sale
repossession
tax_lien_context
judgment_context
dispute
other
```

La evaluación de waiting periods deberá ser program-specific y current.

## 4700. Credit Readiness Summary

Podrá mostrar:

- current known score context;
- utilization;
- derogatory events;
- missing credit data;
- improvement opportunities;
- program-specific questions.

No deberá prometer score increase ni approval.

## 4701. Housing Payment Components

El sistema deberá modelar:

```text
principal
interest
propertyTaxes
homeownersInsurance
mortgageInsurance
HOA
specialAssessments
otherRequiredHousingCosts
```

## 4702. Estimated Housing Payment

Campos:

```text
purchasePrice
loanAmountEstimate
interestRateAssumption
termAssumption
propertyTaxEstimate
insuranceEstimate
mortgageInsuranceEstimate
HOAEstimate
totalEstimatedMonthlyHousingPayment
assumptionDate
```

## 4703. Rate Assumption Boundary

Las tasas usadas en scenarios deberán etiquetarse:

```text
illustrative
market_reference
lender_quote
locked_rate
unknown
```

Nunca una assumption deberá mostrarse como rate offer.

## 4704. Affordability Scenario

Campos:

```text
id
homebuyerCaseId
scenarioName
purchasePrice
downPayment
loanAmount
estimatedHousingPayment
grossMonthlyIncome
monthlyDebtObligations
frontEndRatioOptional
backEndDTI
cashToCloseEstimate
reserveEstimate
assumptions
createdAt
```

## 4705. Affordability versus Qualification

La UI deberá distinguir:

```text
comfortable_budget
internal_affordability_scenario
program_limit
lender_qualification
```

El cliente puede calificar para más de lo que considera cómodo.

## 4706. DTI Concept

La plataforma deberá soportar:

```text
housing_ratio
total_debt_to_income_ratio
```

pero las definiciones exactas dependen del programa/lender.

## 4707. DTI Calculation Record

Campos:

```text
id
homebuyerCaseId
methodologyCode
grossQualifyingIncomeEstimate
housingPayment
otherMonthlyDebt
frontEndRatio
backEndRatio
sourceReferences
calculationVersion
reviewStatus
createdAt
```

## 4708. DTI Methodology Registry

Ejemplos:

```text
internal_standard
conventional_program_specific
FHA_program_specific
VA_program_specific
USDA_program_specific
lender_overlay
custom_partner
```

Cada methodology deberá versionarse.

## 4709. DTI Threshold Boundary

No deberán hardcodearse thresholds eternos.

Cada threshold deberá provenir de:

```text
programRuleVersion
lenderOverlayVersion
automatedUnderwritingContextWhenAvailable
manualUnderwritingContext
```

## 4710. DTI Data Quality

```text
high_confidence
moderate_confidence
low_confidence
insufficient_data
conflicting_data
```

## 4711. Residual Income Context

Para programas que lo requieran, el módulo deberá soportar:

```text
householdSize
region
netIncomeContext
majorObligations
residualIncomeEstimate
methodologyVersion
```

sin asumir que aplica universalmente.

## 4712. Payment Shock Context

Podrá calcular:

```text
estimatedFutureHousingPayment
-
currentHousingPayment
```

y percentage change.

Será una métrica de counseling/readiness, no lender decision universal.

## 4713. Reserve Scenario

Podrá mostrar:

```text
verified reserves
estimated post-closing reserves
months of housing payment
program requirement when known
```

## 4714. Closing Cost Estimate

Categorías:

```text
lender_costs
title_or_settlement
prepaids
escrows
government_recording
taxes
inspection_not_in_closing
other
```

Deberá ser estimate hasta closing disclosure/settlement statement.

## 4715. Down Payment Scenario

Podrá comparar:

```text
0_percent_when_program_supported
low_down_payment
custom_percent
custom_amount
```

pero solo mostrará opciones realmente soportadas por selected/current programs.

## 4716. Assistance Impact Scenario

Cuando exista DPA/grant potencial:

```text
purchasePrice
baseCashToClose
potentialAssistance
borrowerContribution
estimatedNetCashNeeded
repaymentOrLienContext
forgivenessContext
```

Los términos deberán venir del programa.

## 4717. Financial Document Package

Contenido:

```text
homebuyerProfileVersion
borrowerFinancialProfiles
incomeDocuments
employmentDocuments
assetStatements
liabilityDocuments
creditContextReferences
taxDocuments
selfEmploymentDocuments
calculations
findings
sourceIndex
```

## 4718. Financial Package Versioning

Campos:

```text
packageVersion
packageHash
createdAt
supersedesPackageId
```

El package deberá ser inmutable.

## 4719. Financial Readiness Dimensions

```text
employment_documented
income_supported
assets_supported
funds_to_close_supported
reserves_supported
debts_supported
credit_context_available
tax_documents_ready
self_employment_ready
affordability_scenarios_ready
```

## 4720. Financial Readiness Status

```text
not_ready
partially_ready
ready_for_program_screening
ready_for_lender_referral
manual_review_required
```

## 4721. Financial Readiness Finding

Ejemplos:

```text
missing_paystub
missing_tax_return
income_mismatch
asset_source_needed
gift_document_gap
debt_payment_unknown
credit_consent_missing
self_employment_records_incomplete
DTI_data_incomplete
```

## 4722. Analyst Review Record

Campos:

```text
id
homebuyerCaseId
financialPackageId
reviewerId
reviewDecision
findings
notes
reviewedAt
```

Decision:

```text
needs_client_documents
needs_tax_support
needs_bookkeeping_support
needs_credit_review
ready_for_program_registry_screening
manual_review_required
stop
```

## 4723. Cross-Module Financial Handoffs

Ejemplos:

```text
missing tax docs → Módulo 30
self-employed bookkeeping gap → Módulo 31
business ownership/entity issue → Módulos 32–35
document request → shared Documents/Tasks
```

## 4724. Permissions, APIs, Events and Workflows

### Permisos

```text
homebuying.financial_profile.read
homebuying.financial_profile.manage
homebuying.financial_profile.review

homebuying.income.read
homebuying.asset.read
homebuying.debt.read

homebuying.credit_context.read
homebuying.credit_consent.manage

homebuying.affordability.read
homebuying.affordability.calculate

homebuying.dti.read
homebuying.dti.calculate
homebuying.dti.review

homebuying.financial_package.read
homebuying.financial_package.create
```

### APIs

```text
POST /api/homebuying/cases/{id}/financial-profiles
POST /api/homebuying/cases/{id}/employment-records
POST /api/homebuying/cases/{id}/income-sources
POST /api/homebuying/cases/{id}/asset-accounts
POST /api/homebuying/cases/{id}/liabilities

POST /api/homebuying/cases/{id}/credit-consents
POST /api/homebuying/cases/{id}/affordability-scenarios
POST /api/homebuying/cases/{id}/dti-calculations

POST /api/homebuying/cases/{id}/financial-packages
POST /api/homebuying/cases/{id}/financial-readiness
POST /api/homebuying/cases/{id}/financial-reviews
```

### Eventos

```text
HomebuyerFinancialProfileCreated
HomebuyerEmploymentChanged
HomebuyerIncomeMismatchDetected
HomebuyerAssetSourceReviewRequired
HomebuyerDebtReconciled
HomebuyerCreditConsentAccepted
HomebuyerAffordabilityScenarioCreated
HomebuyerDTICalculated
HomebuyerFinancialPackageCreated
HomebuyerFinancialReadinessEvaluated
HomebuyerCaseReadyForProgramScreening
```

### Workflows

```text
Homebuyer Employment Workflow
Homebuyer Income Workflow
Homebuyer Asset Workflow
Homebuyer Debt Workflow
Homebuyer Credit Consent Workflow
Affordability Scenario Workflow
DTI Workflow
Homebuyer Financial Package Workflow
Financial Readiness Workflow
Financial Analyst Review Workflow
```

## 4725. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Borrower Financial Profile.
2. Versionar profile.
3. Crear Employment Record.
4. Detectar employment gap.
5. Crear salary income.
6. Crear hourly income.
7. Crear variable income.
8. Crear self-employment profile.
9. Reutilizar Módulo 31.
10. Reutilizar Módulo 30.
11. Normalizar pay frequencies.
12. Registrar calculation methodology.
13. Crear income mismatch.
14. Crear Asset Account.
15. Clasificar liquid/non-liquid.
16. Calcular estimated funds to close.
17. Separar borrower/gift/DPA sources.
18. Crear large-deposit review.
19. Crear Gift Funds Record.
20. Calcular reserve scenario.
21. Crear Liability Record.
22. Reconciliar debts.
23. Aplicar product-specific debt inclusion.
24. Crear Credit Context.
25. Bloquear credit pull sin consent.
26. Diferenciar educational/mortgage/self-reported score.
27. Crear credit-event context.
28. Crear Credit Readiness Summary.
29. Modelar PITI/HOA components.
30. Crear housing-payment estimate.
31. Etiquetar illustrative rate.
32. Crear Affordability Scenario.
33. Separar affordability de qualification.
34. Crear DTI record.
35. Versionar DTI methodology.
36. Manejar missing income.
37. Manejar unknown debt payment.
38. Crear residual-income context.
39. Crear payment-shock context.
40. Crear closing-cost estimate.
41. Crear down-payment scenario.
42. Crear assistance-impact scenario.
43. Crear Financial Document Package.
44. Verificar package hash.
45. Evaluar Financial Readiness.
46. Crear missing-tax-return finding.
47. Crear Analyst Review.
48. Crear Tax handoff.
49. Crear Bookkeeping handoff.
50. Probar source lineage.
51. Probar document freshness.
52. Probar permissions.
53. Probar APIs.
54. Probar events/outbox.
55. Probar workflows.
56. Probar audit.
57. Probar tenant isolation.
58. Probar bilingual UI.
59. Probar program-specific DTI methodology.
60. Probar no-approval language.

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. Exista Borrower Financial Profile.
2. Exista versioning.
3. Exista Employment Record.
4. Exista employment history/gap support.
5. Existan Income Sources.
6. Gross/net/taxable/qualifying estimate estén separados.
7. Exista Income Normalization.
8. Exista Variable Income.
9. Exista Self-Employment Profile.
10. Exista self-employment source integration.
11. Exista income consistency check.
12. Existan Income Findings.
13. Exista Asset Account.
14. Assets estén clasificados por liquidity.
15. Exista Funds-to-Close estimate.
16. Existan source categories.
17. Exista Asset Sufficiency.
18. Exista Large Deposit Review.
19. Exista Gift Funds Record.
20. Exista Reserve Calculation.
21. Exista Liability Record.
22. Existan Liability Types.
23. Debt inclusion sea program-specific.
24. Exista Debt Reconciliation.
25. Exista Credit Context.
26. Exista Credit Data Consent.
27. Score types estén separados.
28. Credit events sean program-specific.
29. Exista Credit Readiness Summary.
30. Exista Housing Payment model.
31. Exista Estimated Housing Payment.
32. Rate assumptions estén etiquetadas.
33. Exista Affordability Scenario.
34. Affordability y qualification estén separadas.
35. Exista DTI Concept.
36. Exista DTI Calculation Record.
37. Exista DTI Methodology Registry.
38. Thresholds no estén hardcoded.
39. Exista DTI Data Quality.
40. Exista Residual Income Context.
41. Exista Payment Shock Context.
42. Exista Reserve Scenario.
43. Exista Closing Cost Estimate.
44. Exista Down Payment Scenario.
45. Exista Assistance Impact Scenario.
46. Exista Financial Document Package.
47. Package sea inmutable.
48. Existan Financial Readiness Dimensions.
49. Exista Financial Readiness Status.
50. Existan Financial Findings.
51. Exista Analyst Review.
52. Existan cross-module handoffs.
53. Existan permisos/APIs/events/workflows.
54. Toda cifra tenga source/methodology.
55. Parte 2 termine lista para Program Registry de Parte 3.

### Instrucciones para Codex

1. Lee Parte 1 completa.
2. Reutiliza Módulo 30 para tax docs.
3. Reutiliza Módulo 31 para self-employed books.
4. Implementa borrower financial profiles versionados.
5. Implementa employment history.
6. Implementa income sources normalizados.
7. Separa gross/net/taxable/qualifying estimate.
8. Implementa variable income history.
9. Implementa self-employment profile.
10. No presentes qualifying-income estimate como lender fact.
11. Implementa income consistency.
12. Implementa Assets.
13. Separa liquid/conditional/non-liquid.
14. Implementa Funds to Close.
15. Implementa Gift Funds.
16. Implementa Reserve Calculations.
17. Implementa Liabilities.
18. Implementa program-specific debt inclusion overlays.
19. Implementa Credit Context.
20. No obtengas credit data sin consent.
21. Diferencia score types.
22. Implementa credit events sin universal waiting periods.
23. Implementa Housing Payment components.
24. Implementa Affordability Scenarios.
25. Etiqueta rate assumptions.
26. Separa affordability de lender qualification.
27. Implementa DTI Methodology Registry.
28. No hardcodees thresholds universales.
29. Implementa residual-income context.
30. Implementa payment shock.
31. Implementa closing-cost/down-payment scenarios.
32. Implementa assistance-impact scenarios.
33. Implementa immutable Financial Package.
34. Implementa Financial Readiness.
35. Implementa Findings.
36. Implementa Analyst Review.
37. Implementa cross-module handoffs.
38. Implementa permissions/APIs/events/workflows.
39. Implementa immutable audit.
40. No marques Parte 2 completa si un cálculo material carece de source/methodology.

### Verificación final de Parte 2

- ¿Employment/income están versionados y source-backed?
- ¿Variable/self-employed income no se trata como automáticamente qualifying?
- ¿Assets separan liquid y restricted?
- ¿Funds to close distingue gifts/DPA/credits?
- ¿Debt inclusion depende del programa?
- ¿Credit data requiere consent?
- ¿Score types están separados?
- ¿Housing payment incluye todos los componentes conocidos?
- ¿Rate assumptions están claramente etiquetadas?
- ¿Affordability y qualification están separadas?
- ¿DTI identifica metodología?
- ¿Thresholds dependen de program/lender version?
- ¿Financial Package es inmutable?
- ¿Toda acción queda auditada?

---

# Parte 3 — Mortgage/Assistance Program Registry: Conventional, FHA, VA, USDA, State/Local DPA, Grants y Eligibility Rules

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 36 — Parte 2  
**Secciones incluidas:** 4726–4790  
**Audiencia:** Owner, Codex, homebuyer specialists, housing-program analysts, lender/partner managers, compliance, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Registry versionado de mortgage products y assistance programs, con reglas federales, estatales, locales y lender overlays separadas; screening preliminar explicable sin representar una decisión de underwriting

## 4726. Objetivo de Parte 3

Esta parte define el catálogo estructurado de:

- conventional mortgage programs;
- FHA-related programs;
- VA-related programs;
- USDA-related programs;
- state housing finance programs;
- county/city assistance;
- down-payment assistance;
- closing-cost assistance;
- grants;
- forgivable loans;
- deferred-payment assistance;
- community programs;
- lender overlays.

El objetivo es permitir program discovery y preliminary eligibility screening nationwide.

## 4727. Housing Program Registry

Campos:

```text
id
programCode
officialName
programFamily
administrator
sponsorType
jurisdictionScope
deliveryModel
availabilityStatus
effectiveFrom
effectiveTo
programVersion
sourceReferences
createdAt
updatedAt
```

## 4728. Program Families

```text
conventional
FHA_related
VA_related
USDA_related
state_HFA
county_program
city_program
DPA
closing_cost_assistance
grant
forgivable_second
deferred_second
repayable_second
community_program
employer_assistance
tribal_or_special_program
other
```

## 4729. Program Availability Status

```text
draft
active
limited
funding_exhausted
temporarily_paused
verification_required
retired
unknown
```

No deberá mostrarse un programa como disponible si su funding/status está stale o desconocido.

## 4730. Program Source Record

Campos:

```text
sourceType
authority
sourceReference
retrievedAt
verifiedAt
verifiedBy
effectiveDate
confidence
```

Preferencia:

```text
official federal/state/local source
→ official housing finance agency
→ official lender/provider data
→ contracted partner source
→ verified staff research
```

## 4731. Program Freshness

```text
current_verified
current_with_caveat
verification_due
stale
unknown
```

Program matching material deberá bloquear o degradar programas stale.

## 4732. Program Versioning

Cambios materiales deberán crear nueva versión:

- income limits;
- purchase-price limits;
- property eligibility;
- geography;
- first-time-homebuyer definition;
- occupancy;
- loan limits;
- assistance amount;
- repayment/forgiveness terms;
- lender participation;
- funding availability;
- required education;
- minimum borrower contribution;
- fees.

## 4733. Jurisdiction Scope

Tipos:

```text
nationwide
state
county
city
ZIP
census_tract
rural_area
designated_target_area
tribal_area
custom_geography
```

## 4734. Geography Eligibility Rule

Campos:

```text
jurisdictionType
jurisdictionIds
inclusionRule
exclusionRule
mapVersion
source
effectiveDate
```

## 4735. Property Address Eligibility

Cuando el programa dependa de address específico:

```text
propertyAddress
geocodedLocation
programMapVersion
eligibilityResult
verifiedAt
source
```

## 4736. Program Eligibility Rule Engine

Cada program version deberá tener rules estructuradas:

```text
ruleId
field
operator
thresholdOrValue
ruleType
severity
source
effectiveDate
```

## 4737. Rule Types

```text
hard_eligibility
soft_preference
documentation
education_requirement
property_requirement
lender_overlay
manual_review
disclosure
```

## 4738. Eligibility Result

```text
potentially_eligible
potentially_eligible_with_conditions
needs_information
not_eligible_under_current_rules
manual_review_required
program_unavailable
```

No usar `approved`.

## 4739. Eligibility Explanation

Cada screening deberá conservar:

```text
matchedRules
failedRules
unknownRules
conditions
sourceReferences
programVersion
evaluatedAt
```

## 4740. Conventional Program Family

La arquitectura deberá soportar distintos conventional programs y lender overlays.

Campos conceptuales:

```text
agencyOrInvestorContext
occupancyRules
propertyRules
LTVContext
MIContext
creditContext
DTIContext
reserveContext
loanLimitContext
```

Los thresholds específicos deberán venir de rules versionadas.

## 4741. Conventional Program Variants

Podrán incluir:

```text
standard_conventional
low_down_payment_conventional
first_time_buyer_variant
community_or_income_targeted_variant
high_balance_context
other_supported_variant
```

## 4742. Conventional Mortgage Insurance Context

Campos:

```text
MIRequiredRule
cancellationContext
pricingSource
borrowerPaidOrLenderPaidContext
```

No deberá estimarse pricing sin source.

## 4743. FHA Program Family

El registry deberá soportar FHA-related products mediante current verified rules.

Campos:

```text
programType
occupancyRequirement
propertyEligibility
mortgageInsuranceContext
loanLimitContext
creditRuleContext
DTIRuleContext
manualUnderwritingContext
```

## 4744. FHA Property Context

Podrá incluir:

```text
single_family
approved_condo_context
two_to_four_units
manufactured_home_context
rehab_program_context
```

según current program rules.

## 4745. FHA Mortgage Insurance Fields

Campos:

```text
upfrontMIPContext
annualMIPContext
durationContext
source
effectiveDate
```

Valores exactos deberán provenir del program registry vigente.

## 4746. VA Program Family

El registry deberá soportar VA-related products y eligibility context.

Campos:

```text
serviceEligibilityContext
COEStatus
entitlementContext
occupancyRequirement
fundingFeeContext
loanLimitContext
propertyEligibility
lenderOverlayContext
```

## 4747. VA Service Eligibility Boundary

SG Solutions podrá:

- collect service-history context;
- assist with document readiness;
- track COE status when client/provider supplies it.

No deberá adjudicar veteran eligibility por sí sola.

## 4748. VA Certificate of Eligibility Record

Campos:

```text
status
documentId
entitlementContext
verifiedAt
source
```

Estados:

```text
not_requested
pending
received
verification_required
```

## 4749. VA Funding Fee Context

La plataforma deberá tratar funding-fee amount/exemption como rule-driven y source-backed.

No deberá asumir exemption.

## 4750. USDA Program Family

El registry deberá soportar:

```text
USDA_guaranteed_context
USDA_direct_context
other_current_rural_housing_program
```

como programas separados cuando corresponda.

## 4751. USDA Guaranteed versus Direct

El sistema deberá mantener reglas, application path y eligibility separados.

Nunca deberán fusionarse como si fueran el mismo producto.

## 4752. USDA Geographic Eligibility

Deberá usar:

```text
current property eligibility source/map
```

y address verification cuando corresponda.

## 4753. USDA Household Income Context

La plataforma deberá soportar:

```text
program household income
adjustments
household size
income limit area
limit version
```

sin reutilizar automáticamente borrower qualifying income.

## 4754. USDA Direct Program Context

Podrá modelar:

```text
income_category
payment_assistance_context
property_requirement
household_definition
asset_context
repayment_context
application_channel
```

Todos deberán ser versionados/current.

## 4755. State Housing Finance Agency Registry

Cada state HFA podrá contener múltiples programs.

Campos:

```text
agencyId
state
agencyName
programIds
participatingLenderRequirement
educationRequirement
reservationProcess
source
status
```

## 4756. State Program Types

```text
first_mortgage
DPA
closing_cost_assistance
MCC_or_tax_credit_context
grant
forgivable_second
deferred_second
repayable_second
special_population_program
target_area_program
```

## 4757. County and City Program Registry

Campos adicionales:

```text
county
city
serviceArea
fundingCycle
applicationWindow
residencyRequirement
employmentRequirement
propertyLocationRequirement
adminAgency
```

## 4758. Down Payment Assistance Program

Campos:

```text
assistanceType
maximumAmount
percentageOfPurchasePrice
percentageOfLoanAmount
minimumBorrowerContribution
repaymentType
interestRateIfAny
term
forgivenessSchedule
subordinationRules
saleOrRefinanceTrigger
occupancyPeriod
source
```

## 4759. DPA Repayment Types

```text
grant
forgivable
deferred
repayable_monthly
due_on_sale
due_on_refinance
shared_appreciation_context
other
```

La UI deberá explicar claramente que DPA no siempre significa dinero gratis.

## 4760. Assistance Amount Boundary

Separar:

```text
maximumProgramAssistance
estimatedEligibleAssistance
reservedAssistance
approvedAssistance
fundedAssistance
```

## 4761. Income Limit Rule

Campos:

```text
incomeMeasure
householdDefinition
AMIContext
maximumIncome
geography
householdSize
effectiveDate
source
```

## 4762. Purchase Price Limit Rule

Campos:

```text
maximumPurchasePrice
propertyType
unitCount
targetAreaContext
geography
effectiveDate
source
```

## 4763. First-Time Homebuyer Rule

Campos:

```text
lookbackPeriod
ownershipInterestsCounted
exceptions
targetAreaException
specialPopulationException
source
```

No deberá existir una definición universal.

## 4764. Occupancy Requirement Rule

```text
primary_residence_required
owner_occupancy_period
occupancy_start_deadline
non_occupant_co_borrower_context
```

## 4765. Borrower Contribution Rule

Campos:

```text
minimumAmount
minimumPercentage
sourceTypesAllowed
giftAllowed
sellerCreditInteraction
programVersion
```

## 4766. Homebuyer Education Requirement

Campos:

```text
requiredFlag
courseType
approvedProviders
completionDeadline
certificateFreshness
deliveryMode
source
```

## 4767. Counseling Requirement

Separar:

```text
homebuyer_education
housing_counseling
program_orientation
```

No deberán tratarse como equivalentes.

## 4768. Property Type Rule

Podrá permitir/prohibir:

```text
single_family
condo
townhome
two_to_four_units
manufactured
new_construction
rehab
mixed_use
```

según program version.

## 4769. Property Condition Rule

Campos:

```text
minimumPropertyStandardsContext
repairEscrowAllowed
rehabAllowed
appraisalRequirement
inspectionRequirementContext
source
```

## 4770. Loan Limit Context

Para programas con límites:

```text
baseLimit
highCostAreaLimit
unitCount
countyOrArea
effectiveYear
source
```

No deberá hardcodearse un valor permanente.

## 4771. Credit Rule Context

Campos:

```text
minimumPublishedScore
alternativeCreditAllowed
manualUnderwritingContext
majorCreditEventRules
source
effectiveDate
```

Lender overlays podrán ser más restrictivos.

## 4772. DTI Rule Context

Campos:

```text
baseGuideline
flexibilityContext
automatedUnderwritingContext
manualUnderwritingContext
lenderOverlayAllowed
source
```

No deberá convertirse en un threshold universal.

## 4773. Reserve Requirement Rule

Campos:

```text
requiredMonths
propertyType
unitCount
riskContext
source
```

## 4774. Seller Contribution Rule

Campos:

```text
maximumContribution
basis
occupancy
LTVContext
programType
source
```

## 4775. Lender Credit Rule

Campos:

```text
allowedFlag
pricingInteraction
maximumContext
source
```

## 4776. Subordinate Financing Compatibility

Cada first-mortgage program podrá declarar:

```text
compatibleAssistanceProgramIds
subordinationAllowed
combinedLTVContext
repaymentRestrictions
approvalNeeded
```

## 4777. Program Stacking

El engine deberá evaluar compatibilidad entre:

```text
first mortgage
+
DPA
+
grant
+
seller credit
+
lender credit
```

No asumirá que todos pueden combinarse.

## 4778. Program Stack Record

Campos:

```text
id
homebuyerCaseId
primaryProgramVersionId
assistanceProgramVersionIds
compatibilityResults
conditions
unknowns
createdAt
```

## 4779. Grant / Non-Repayable Assistance

Campos:

```text
awardAmount
applicationWindow
competitiveFlag
householdRequirements
propertyRequirements
recaptureContext
postClosingRequirements
source
```

`grant` no deberá significar automáticamente “sin condiciones”.

## 4780. Forgivable Assistance

Campos:

```text
principalAmount
forgivenessPeriod
forgivenessMethod
occupancyRequirement
saleTrigger
refinanceTrigger
defaultTriggerContext
source
```

## 4781. Deferred Assistance

Campos:

```text
principalAmount
paymentDeferredUntil
interestAccrual
maturity
saleTrigger
refinanceTrigger
source
```

## 4782. Community / Employer Assistance

El registry podrá soportar:

```text
employer_assistance
hospital_or_teacher_program
local_workforce_program
community_land_or_shared_equity_context
special_local_initiative
```

con rules separadas.

## 4783. Special Population Programs

Podrán existir programs dirigidos a categorías permitidas por law/program design.

La plataforma deberá:

- usar exact program criteria;
- evitar inferir protected attributes innecesariamente;
- pedir sensitive data solo cuando indispensable;
- mantener compliance review.

## 4784. Program Document Requirement Set

Ejemplos:

```text
income_docs
asset_docs
tax_returns
first_time_buyer_affidavit
homebuyer_education_certificate
COE
property_eligibility
purchase_contract
gift_documents
residency_or_employment_docs
other
```

## 4785. Program Screening Result

Campos:

```text
programVersionId
result
matchedRules
failedRules
unknownRules
conditions
requiredDocuments
sourceReferences
evaluatedAt
```

## 4786. Program Screening Freshness Gate

Antes de mostrar un program como actionable:

```text
program current
funding status current
income limit current
geography current
property rules current
lender participation current
```

## 4787. No Program Guarantee

La UI deberá evitar:

```text
"You qualify"
"You will receive $X"
"0% down guaranteed"
```

Preferir:

```text
"Potential fit under current rules"
"Estimated assistance subject to verification"
```

## 4788. Permissions, APIs, Events and Workflows

### Permisos

```text
homebuying.program.read
homebuying.program.manage
homebuying.program.publish
homebuying.program.verify

homebuying.program_rule.read
homebuying.program_rule.manage

homebuying.program_screening.read
homebuying.program_screening.run
```

### APIs

```text
GET  /api/homebuying/programs
POST /api/homebuying/programs
POST /api/homebuying/programs/{id}/versions
POST /api/homebuying/programs/{id}/verify

GET  /api/homebuying/programs/{id}/rules
POST /api/homebuying/programs/{id}/rules

POST /api/homebuying/cases/{id}/program-screenings
POST /api/homebuying/cases/{id}/program-stacks
```

### Eventos

```text
HomebuyingProgramCreated
HomebuyingProgramVersionPublished
HomebuyingProgramVerified
HomebuyingProgramMarkedStale
HomebuyingProgramRuleChanged
HomebuyingProgramScreeningCompleted
HomebuyingPotentialProgramMatchFound
HomebuyingProgramNeedsInformation
HomebuyingProgramStackCreated
```

### Workflows

```text
Housing Program Publication Workflow
Housing Program Verification Workflow
Program Eligibility Rule Workflow
Program Screening Workflow
Program Stack Compatibility Workflow
Program Freshness Workflow
```

## 4789. Pruebas de Parte 3

Pruebas obligatorias:

1. Crear Housing Program.
2. Versionar program.
3. Marcar stale.
4. Bloquear stale program.
5. Crear federal source.
6. Crear state source.
7. Crear county/city program.
8. Crear geography rule.
9. Evaluar address-specific eligibility.
10. Crear hard rule.
11. Crear soft rule.
12. Procesar unknown data.
13. Crear potentially eligible result.
14. Crear not eligible under current rules.
15. Crear manual review result.
16. Crear conventional program.
17. Crear low-down conventional variant.
18. Crear FHA program.
19. Crear FHA property rules.
20. Crear VA program.
21. Crear COE status.
22. Crear USDA Guaranteed.
23. Crear USDA Direct separado.
24. Evaluar USDA property geography.
25. Crear USDA household-income definition.
26. Crear state HFA.
27. Crear DPA.
28. Crear grant.
29. Crear forgivable second.
30. Crear deferred second.
31. Crear income-limit rule.
32. Crear purchase-price rule.
33. Crear first-time rule.
34. Crear occupancy rule.
35. Crear borrower-contribution rule.
36. Crear education requirement.
37. Separar counseling/education.
38. Crear property-type rule.
39. Crear condition/appraisal rule.
40. Crear loan-limit context.
41. Crear credit-rule context.
42. Crear DTI-rule context.
43. Crear reserve rule.
44. Crear seller-contribution rule.
45. Crear lender-credit rule.
46. Evaluar subordinate compatibility.
47. Crear Program Stack.
48. Bloquear incompatible assistance.
49. Crear community/employer program.
50. Crear special-population rule with limited data.
51. Crear document requirement set.
52. Crear screening result.
53. Aplicar freshness gate.
54. Bloquear guarantee wording.
55. Probar permissions.
56. Probar APIs.
57. Probar events/outbox.
58. Probar workflows.
59. Probar source lineage.
60. Probar effective dates.

## 4790. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 3 estará completa cuando:

1. Exista Housing Program Registry.
2. Existan Program Families.
3. Exista availability status.
4. Existan sources.
5. Exista freshness.
6. Exista versioning.
7. Exista jurisdiction scope.
8. Exista geography rule.
9. Exista address eligibility.
10. Exista Program Eligibility Rule Engine.
11. Existan rule types.
12. Exista explainable eligibility result.
13. Exista Conventional family.
14. Existan conventional variants.
15. Exista mortgage-insurance context.
16. Exista FHA family.
17. Exista FHA property context.
18. Exista FHA insurance context.
19. Exista VA family.
20. Exista VA eligibility boundary.
21. Exista COE record.
22. Exista VA funding-fee context.
23. Exista USDA family.
24. Guaranteed y Direct estén separados.
25. USDA geography sea address/source-backed.
26. USDA household income esté separado de qualifying income.
27. Exista USDA Direct context.
28. Exista State HFA Registry.
29. Existan state program types.
30. Exista county/city registry.
31. Exista DPA model.
32. Existan DPA repayment types.
33. Assistance max/estimated/reserved/approved/funded estén separados.
34. Exista income-limit rule.
35. Exista purchase-price rule.
36. First-time definition sea program-specific.
37. Exista occupancy rule.
38. Exista borrower contribution rule.
39. Exista education requirement.
40. Counseling y education estén separados.
41. Exista property-type rule.
42. Exista property-condition rule.
43. Exista loan-limit context.
44. Exista credit-rule context.
45. Exista DTI-rule context.
46. Exista reserve rule.
47. Exista seller-contribution rule.
48. Exista lender-credit rule.
49. Exista subordinate-financing compatibility.
50. Exista program stacking.
51. Exista Grant model.
52. Exista Forgivable Assistance.
53. Exista Deferred Assistance.
54. Existan Community/Employer programs.
55. Sensitive criteria se minimicen.
56. Exista Program Document Requirement Set.
57. Exista Program Screening Result.
58. Exista freshness gate.
59. No existan program guarantees.
60. Existan permisos/APIs/events/workflows.
61. Toda rule material tenga source/version.
62. Toda amount/limit tenga effective date.
63. Program funding availability pueda expirar.
64. Lender overlays permanezcan separados.
65. Parte 3 termine lista para Matching/Lender Routing de Parte 4.

### Instrucciones para Codex

1. Lee Partes 1–2 completas.
2. Implementa Housing Program Registry genérico.
3. Versiona all program terms.
4. Implementa source/freshness.
5. No hardcodees federal/state/local limits.
6. Implementa geography resolution.
7. Implementa address-level eligibility.
8. Implementa Program Eligibility Rule Engine.
9. Separa hard/soft/manual-review rules.
10. Mantén unknown data como unknown.
11. Implementa Conventional family.
12. Implementa FHA family con current rules.
13. Implementa VA family con COE context.
14. Implementa USDA Guaranteed/Direct por separado.
15. Implementa state HFA registry.
16. Implementa county/city programs.
17. Implementa DPA repayment models.
18. Separa max/estimated/reserved/approved/funded assistance.
19. Implementa income/purchase-price limits.
20. No hardcodees first-time-homebuyer universal.
21. Implementa occupancy/contribution/education rules.
22. Implementa property/loan-limit/credit/DTI/reserve rules.
23. Implementa subordinate compatibility.
24. Implementa Program Stacking.
25. Implementa Grants/Forgivable/Deferred.
26. Implementa Community/Employer programs.
27. Minimiza sensitive-data collection.
28. Implementa dynamic document requirements.
29. Implementa Screening Freshness Gate.
30. Prohíbe guarantee language.
31. Implementa permissions/APIs/events/workflows.
32. Implementa immutable audit.
33. No marques Parte 3 completa si un program puede entrar a matching con rules stale o sin source.

### Verificación final de Parte 3

- ¿Federal/state/local rules están separadas?
- ¿Cada program tiene version/source/freshness?
- ¿Conventional/FHA/VA/USDA están modelados separadamente?
- ¿USDA Direct y Guaranteed no están fusionados?
- ¿First-time-homebuyer depende del program?
- ¿DPA explica repayment/forgiveness?
- ¿Income y purchase-price limits tienen geography/effective date?
- ¿Program stacking verifica compatibilidad?
- ¿Funding availability puede bloquear un program?
- ¿Lender overlays están separados?
- ¿No existe guarantee language?
- ¿Toda evaluación queda auditada?

---

# Parte 4 — Matching, Lender/Partner Routing, Prequalification/Preapproval Support, Property Eligibility, Offers y Purchase Readiness

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 36 — Parte 3  
**Secciones incluidas:** 4791–4855  
**Audiencia:** Owner, Codex, homebuyer specialists, lender/partner managers, housing-program analysts, real-estate coordinators, compliance, reviewers y support  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Matching explicable entre borrower profile, programs, lender overlays y property facts; coordinación de prequalification/preapproval y purchase readiness sin sustituir underwriting ni originación regulada

## 4791. Objetivo de Parte 4

Esta parte define cómo la plataforma pasa de:

```text
Homebuyer Profile
+
Financial Package
+
Program Registry
```

a:

```text
program matching
→ lender/partner routing
→ prequalification/preapproval support
→ property-specific eligibility
→ offer/term tracking
→ purchase readiness
```

## 4792. Matching Principle

El matching deberá ser:

```text
rules-driven
source-backed
versioned
explainable
non-guaranteed
```

No deberá producir una lender decision.

## 4793. Matching Input Snapshot

Campos:

```text
id
homebuyerCaseId
homebuyerProfileVersion
financialPackageId
financialReadinessVersion
programRegistryVersion
propertySnapshotIdOptional
createdAt
```

## 4794. Matching Run

Campos:

```text
id
homebuyerCaseId
inputSnapshotId
matchingEngineVersion
startedAt
completedAt
programsEvaluated
matchesGenerated
status
```

## 4795. Matching Run Status

```text
queued
running
completed
completed_with_warnings
failed
cancelled
```

## 4796. Match Candidate

Campos:

```text
id
matchingRunId
programVersionId
providerIdOptional
partnerIdOptional
screeningResultId
rank
matchBand
matchReasonSummary
conditions
unknowns
blockingFactors
createdAt
```

## 4797. Match Bands

```text
strong_preliminary_fit
potential_fit
conditional_fit
needs_information
low_fit
not_eligible_under_current_rules
manual_review_required
program_unavailable
```

No usar `approved`.

## 4798. Match Explanation

Cada candidate deberá mostrar:

```text
matchedRules
failedRules
unknownRules
geographyFit
incomeLimitFit
purchasePriceFit
occupancyFit
propertyTypeFit
assistanceCompatibility
documentGaps
sourceReferences
```

## 4799. Match Ranking

Podrá considerar:

- borrower preferences;
- minimum cash requirement;
- assistance amount;
- estimated payment;
- property type;
- geography;
- timing;
- lender availability;
- documentation readiness;
- program compatibility;
- known costs.

## 4800. Ranking Boundary

El ranking no deberá:

- ocultar lender limitations;
- ignorar client preferences;
- favorecer partner compensation sin disclosure;
- presentar high rank como approval probability.

## 4801. Lender Registry Link

Cada mortgage program/product podrá asociarse a:

```text
lenderId
providerId
partnerId
applicationChannel
licensedJurisdictions
participatingProgramIds
status
```

## 4802. Lender Status

```text
active
limited
onboarding
temporarily_unavailable
suspended
terminated
unknown
```

## 4803. Lender Jurisdiction Coverage

Campos:

```text
states
territories
countyRestrictions
programRestrictions
loanOfficerCoverage
effectiveFrom
effectiveTo
```

## 4804. Lender Overlay Registry

Campos:

```text
id
lenderId
programVersionId
overlayVersion
creditOverlay
DTIOverlay
reserveOverlay
propertyOverlay
incomeOverlay
documentationOverlay
effectiveFrom
effectiveTo
source
```

## 4805. Overlay Freshness Gate

Antes de routing:

```text
program current
+
lender overlay current
+
lender active
```

Si alguno está stale:

```text
manual_review_required
```

## 4806. Lender Eligibility Evaluation

Resultado:

```text
potentially_eligible
potentially_eligible_with_conditions
needs_information
not_eligible_under_current_overlay
manual_review_required
lender_unavailable
```

## 4807. Lender Match Explanation

Debe separar:

```text
program_rule
lender_overlay
client_preference
property_condition
unknown
```

## 4808. Lender Referral Record

Campos:

```text
id
homebuyerCaseId
lenderId
loanOfficerIdOptional
programVersionId
consentId
referralTrackingId
status
createdAt
acceptedAt
```

## 4809. Lender Referral Status

```text
draft
ready
sent
received
accepted
client_contacted
application_started
closed
failed
```

## 4810. Mortgage Referral Consent

Antes de compartir borrower data:

```text
lender
purpose
program
dataScope
creditContextSharing
documentsShared
authorizedAt
expiresAt
status
```

## 4811. Minimum Necessary Sharing

Solo compartir:

```text
selected lender
+
selected purpose
+
selected stage
```

No compartir full document vault por defecto.

## 4812. Prequalification Support

La plataforma podrá ayudar a:

- organize intake;
- prepare documents;
- calculate internal scenarios;
- route to lender;
- track lender prequalification result.

No deberá emitir su propia mortgage prequalification como si fuera lender.

## 4813. Prequalification Record

Campos:

```text
id
homebuyerCaseId
lenderId
programVersionId
source
amountContext
estimatedPaymentContext
status
issuedAt
expiresAt
documentId
verifiedAt
```

## 4814. Prequalification Status

```text
not_started
submitted_to_lender
received
verification_required
expired
superseded
declined_or_not_issued
```

## 4815. Preapproval Support

La plataforma podrá preparar y rastrear:

```text
lender_application
documents
credit_authorization
income/assets
conditions
preapproval_letter
expiration
```

## 4816. Preapproval Record

Campos:

```text
id
homebuyerCaseId
lenderId
programVersionId
preapprovalAmount
purchasePriceLimitContext
conditions
issuedAt
expiresAt
documentId
verificationStatus
```

## 4817. Preapproval Boundary

Solo un lender/authorized party podrá originar un true preapproval cuando corresponda.

SG Solutions deberá etiquetar:

```text
lender_issued
```

vs

```text
internal_readiness_estimate
```

## 4818. Preapproval Expiration

La plataforma deberá monitorear:

```text
issuedAt
expiresAt
creditRefreshNeeded
documentRefreshNeeded
lenderRefreshNeeded
```

## 4819. Preapproval Conditions

Ejemplos:

```text
updated_paystubs
updated_bank_statements
property_eligibility
appraisal
insurance
title
clear_to_close_conditions
other
```

## 4820. Purchase Readiness Status

```text
not_ready
financially_preparing
program_screened
lender_referred
prequalified
preapproved
property_search_ready
under_contract
closing_ready
```

`prequalified/preapproved` solo cuando exista lender source verificada.

## 4821. Property Search Readiness

Requisitos conceptuales:

```text
budget_range
target_geography
occupancy
property_type
program_constraints
lender_status
cash_to_close_context
agent_or_search_plan
```

## 4822. Real Estate Agent Referral

Campos:

```text
id
homebuyerCaseId
agentPartnerId
brokerage
serviceArea
language
propertySpecialties
referralDisclosureId
status
createdAt
```

## 4823. Agent Referral Boundary

SG Solutions deberá:

- disclose referral relationship;
- not represent itself as broker/agent unless authorized;
- not hide referral compensation;
- allow client choice where applicable.

## 4824. Property Candidate Record

Campos:

```text
id
homebuyerCaseId
address
listingReference
askingPrice
propertyType
unitCount
yearBuilt
HOA
taxEstimate
insuranceEstimate
conditionContext
status
createdAt
```

## 4825. Property Candidate Status

```text
saved
reviewing
potential_fit
program_issue
offer_planned
offer_submitted
under_contract
rejected
withdrawn
closed
```

## 4826. Property Eligibility Snapshot

Campos:

```text
id
propertyCandidateId
programVersionId
addressEligibility
propertyTypeEligibility
unitCountEligibility
purchasePriceEligibility
conditionEligibility
condoEligibilityIfApplicable
manufacturedEligibilityIfApplicable
sourceReferences
evaluatedAt
```

## 4827. Property Geography Verification

Deberá poder verificar:

- USDA area;
- state/local assistance geography;
- target areas;
- county limits;
- municipal restrictions.

Address-specific rules deberán usar current maps/sources.

## 4828. Purchase Price Eligibility

Comparar:

```text
propertyPrice
vs
programPurchasePriceLimit
vs
lenderPreapprovalContext
vs
clientComfortBudget
```

Son límites diferentes.

## 4829. Property Tax Estimate

Campos:

```text
currentTax
estimatedPostPurchaseTax
homesteadOrExemptionContext
source
assumptionDate
confidence
```

No deberá asumir que current tax será future tax.

## 4830. Homeowners Insurance Estimate

Campos:

```text
annualPremiumEstimate
monthlyEquivalent
coverageAssumption
source
quoteDate
status
```

## 4831. HOA / Association Context

Campos:

```text
monthlyHOA
specialAssessment
condoAssociationFlag
associationApprovalContext
documentStatus
```

## 4832. Condo Eligibility Context

Cuando aplique:

```text
projectApprovalStatus
warrantabilityContext
programEligibility
lenderOverlay
source
```

No deberá inferirse solo por property type.

## 4833. Manufactured Home Eligibility Context

Campos:

```text
constructionType
HUDCodeContext
foundationContext
landOwnershipContext
titleConversionContext
programEligibility
source
```

## 4834. Multi-Unit Property Context

Para 2–4 units:

```text
unitCount
ownerOccupancy
rentalIncomePotential
reserveRequirementContext
selfSufficiencyRuleContext
programVersion
```

## 4835. Rental Income Estimate Boundary

Potential rent podrá provenir de:

```text
lease
appraisal_market_rent
existing_tenant_docs
client_estimate
```

y deberá conservar confidence/source.

## 4836. Property Condition / Repair Flag

Estados:

```text
standard
minor_repairs
significant_repairs
health_safety_issue_context
rehab_program_candidate
unknown
```

## 4837. Renovation Program Handoff

Si property condition requiere rehab:

```text
property
→ renovation program screening
→ lender/program review
→ repair budget/docs
```

No asumir que standard financing aceptará la property.

## 4838. Offer Preparation Support

La plataforma podrá ayudar a organizar:

- purchase price;
- earnest money;
- financing type;
- requested seller concessions;
- closing date;
- contingencies;
- property details.

El real-estate professional deberá manejar actos regulados correspondientes.

## 4839. Purchase Offer Record

Campos:

```text
id
propertyCandidateId
offerPrice
earnestMoney
sellerConcessionRequested
closingDateRequested
financingProgramContext
status
sourceDocumentId
createdAt
```

## 4840. Purchase Offer Status

```text
draft
prepared_with_agent
submitted
countered
accepted
rejected
withdrawn
expired
```

## 4841. Accepted Contract Record

Campos:

```text
id
propertyCandidateId
purchasePrice
contractDate
closingDate
earnestMoney
sellerCredits
financingContingency
inspectionContingency
appraisalContingency
documentId
verificationStatus
```

## 4842. Contract Change Impact

Material changes deberán rerun:

- affordability;
- funds to close;
- DTI scenario;
- DPA;
- purchase-price eligibility;
- lender conditions.

## 4843. Updated Funds-to-Close Scenario

Después de accepted contract:

```text
actualPurchasePrice
actualSellerCredits
actualEarnestMoney
estimatedLenderCredits
estimatedAssistance
updatedClosingCosts
updatedFundsToClose
```

## 4844. Loan Estimate Record

Cuando el lender entregue un Loan Estimate:

```text
documentId
lenderId
loanAmount
interestRate
APR
monthlyPrincipalInterest
estimatedTaxesInsurance
mortgageInsurance
closingCosts
cashToClose
issuedAt
verificationStatus
```

## 4845. Loan Estimate Boundary

La plataforma podrá:

- summarize;
- compare;
- flag changes/questions;
- preserve source.

No deberá alterarlo ni representarlo como documento propio.

## 4846. Loan Estimate Comparison

Podrá comparar lender offers por:

```text
loanAmount
rate
APR
points
originationCharges
lenderCredits
monthlyPayment
cashToClose
loanTerm
rateLockStatus
```

## 4847. Rate Lock Record

Campos:

```text
lenderId
rate
lockDate
expirationDate
lockPeriod
extensionTerms
sourceDocumentId
status
```

## 4848. Rate Lock Status

```text
not_locked
locked
expiring
expired
extended
unknown
```

## 4849. Assistance Reservation Record

Para DPA/grants con reservation:

```text
programId
reservationId
reservedAmount
reservedAt
expiresAt
conditions
status
source
```

## 4850. Assistance Reservation Status

```text
not_requested
pending
reserved
conditions_pending
expired
cancelled
funded
unknown
```

## 4851. Purchase Readiness Checklist

Antes de contract/closing path:

```text
lender_status
program_status
property_eligibility
funds_to_close
assistance_status
documents_current
insurance_plan
inspection_plan
title_or_settlement_plan
agent_coordination
```

## 4852. Purchase Readiness Gate

Resultado:

```text
ready
ready_with_conditions
client_action_required
partner_action_required
blocked
manual_review_required
```

## 4853. Permissions, APIs, Events and Workflows

### Permisos

```text
homebuying.matching.read
homebuying.matching.run
homebuying.matching.review

homebuying.lender_referral.read
homebuying.lender_referral.create

homebuying.prequalification.read
homebuying.preapproval.read

homebuying.property.read
homebuying.property.manage
homebuying.property.evaluate

homebuying.purchase_offer.read
homebuying.purchase_offer.manage

homebuying.loan_estimate.read
homebuying.loan_estimate.compare
```

### APIs

```text
POST /api/homebuying/cases/{id}/matching-runs
GET  /api/homebuying/cases/{id}/matches

POST /api/homebuying/cases/{id}/lender-referrals
POST /api/homebuying/cases/{id}/prequalifications
POST /api/homebuying/cases/{id}/preapprovals

POST /api/homebuying/cases/{id}/properties
POST /api/homebuying/properties/{id}/eligibility
POST /api/homebuying/properties/{id}/purchase-offers
POST /api/homebuying/properties/{id}/contracts

POST /api/homebuying/cases/{id}/loan-estimates
POST /api/homebuying/cases/{id}/loan-estimate-comparisons
POST /api/homebuying/cases/{id}/assistance-reservations
POST /api/homebuying/cases/{id}/purchase-readiness
```

### Eventos

```text
HomebuyerMatchingRunCompleted
HomebuyerProgramMatchCreated
HomebuyerLenderReferralCreated
HomebuyerPrequalificationReceived
HomebuyerPreapprovalReceived
HomebuyerPropertyAdded
HomebuyerPropertyEligibilityEvaluated
HomebuyerOfferPrepared
HomebuyerOfferAccepted
HomebuyerContractRecorded
HomebuyerLoanEstimateReceived
HomebuyerRateLocked
HomebuyerAssistanceReserved
HomebuyerPurchaseReadinessEvaluated
```

### Workflows

```text
Homebuyer Matching Workflow
Lender Referral Workflow
Prequalification Tracking Workflow
Preapproval Tracking Workflow
Property Candidate Workflow
Property Eligibility Workflow
Purchase Offer Workflow
Contract Intake Workflow
Loan Estimate Review Workflow
Assistance Reservation Workflow
Purchase Readiness Workflow
```

## 4854. Pruebas de Parte 4

Pruebas obligatorias:

1. Crear Matching Input Snapshot.
2. Ejecutar Matching Run.
3. Crear Match Candidate.
4. Crear explainable match.
5. Bloquear approved language.
6. Aplicar client preferences.
7. Crear lender registry link.
8. Crear lender overlay.
9. Bloquear stale overlay.
10. Crear lender eligibility evaluation.
11. Crear Lender Referral.
12. Crear referral consent.
13. Aplicar minimum-necessary sharing.
14. Registrar lender-issued prequalification.
15. Bloquear internal estimate como lender prequal.
16. Registrar lender-issued preapproval.
17. Monitorear preapproval expiration.
18. Registrar conditions.
19. Crear Purchase Readiness status.
20. Crear Agent Referral.
21. Crear referral disclosure.
22. Crear Property Candidate.
23. Crear Property Eligibility Snapshot.
24. Verificar USDA geography.
25. Verificar local DPA geography.
26. Comparar property price limits.
27. Crear property-tax estimate.
28. Crear insurance estimate.
29. Crear HOA context.
30. Crear condo eligibility context.
31. Crear manufactured eligibility context.
32. Crear multi-unit context.
33. Crear rental-income estimate with source.
34. Crear repair flag.
35. Crear renovation handoff.
36. Crear Purchase Offer Record.
37. Crear Accepted Contract Record.
38. Rerun affordability after contract change.
39. Actualizar funds-to-close.
40. Crear Loan Estimate Record.
41. Comparar Loan Estimates.
42. Crear Rate Lock Record.
43. Crear assistance reservation.
44. Manejar expired reservation.
45. Crear Purchase Readiness Checklist.
46. Ejecutar Purchase Readiness Gate.
47. Probar permissions.
48. Probar APIs.
49. Probar events/outbox.
50. Probar workflows.
51. Probar immutable audit.
52. Probar tenant isolation.
53. Probar lender-source verification.
54. Probar source lineage.
55. Probar stale property rule.
56. Probar unknown condo status.
57. Probar preapproval expiration.
58. Probar contract price above program limit.
59. Probar bilingual UI.
60. Probar manual-review state.

## 4855. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 4 estará completa cuando:

1. Exista Matching Input Snapshot.
2. Exista Matching Run.
3. Exista Match Candidate.
4. Existan Match Bands.
5. Exista Match Explanation.
6. Exista Ranking.
7. Ranking no implique approval probability.
8. Exista Lender Registry Link.
9. Exista Lender Status.
10. Exista jurisdiction coverage.
11. Exista Lender Overlay Registry.
12. Exista overlay freshness gate.
13. Exista Lender Eligibility Evaluation.
14. Exista lender match explanation.
15. Exista Lender Referral Record.
16. Exista referral status.
17. Exista Mortgage Referral Consent.
18. Exista minimum-necessary sharing.
19. Exista Prequalification Support.
20. Exista lender-issued Prequalification Record.
21. Exista Preapproval Support.
22. Exista lender-issued Preapproval Record.
23. Exista preapproval expiration tracking.
24. Existan preapproval conditions.
25. Exista Purchase Readiness Status.
26. Exista Property Search Readiness.
27. Exista Real Estate Agent Referral.
28. Referral role/compensation sea transparente.
29. Exista Property Candidate.
30. Exista Property Eligibility Snapshot.
31. Exista property geography verification.
32. Exista purchase-price eligibility.
33. Exista tax estimate.
34. Exista insurance estimate.
35. Exista HOA context.
36. Exista condo eligibility context.
37. Exista manufactured-home context.
38. Exista multi-unit context.
39. Rental-income estimate tenga source.
40. Exista property-condition flag.
41. Exista renovation handoff.
42. Exista Offer Preparation Support.
43. Exista Purchase Offer Record.
44. Exista Accepted Contract Record.
45. Contract changes rerun calculations.
46. Exista updated funds-to-close.
47. Exista Loan Estimate Record.
48. Exista Loan Estimate Comparison.
49. Exista Rate Lock Record.
50. Exista Assistance Reservation.
51. Exista Purchase Readiness Checklist.
52. Exista Purchase Readiness Gate.
53. Existan permisos/APIs/events/workflows.
54. Lender-issued statuses tengan source.
55. No exista lender-like decision fabricada.
56. Parte 4 termine lista para Closing Journey de Parte 5.

### Instrucciones para Codex

1. Lee Partes 1–3 completas.
2. Implementa immutable Matching Input Snapshot.
3. Implementa explainable matching.
4. Separa program rules/lender overlays/preferences/property facts.
5. No uses approval-probability language.
6. Implementa Lender Registry link.
7. Implementa overlay version/freshness.
8. Implementa Lender Referral.
9. Implementa scoped consent.
10. Implementa minimum-necessary sharing.
11. Solo lender source puede crear true prequalification/preapproval.
12. Implementa expiration/conditions.
13. Implementa Purchase Readiness.
14. Implementa agent referral con disclosures.
15. Implementa Property Candidate.
16. Implementa property-specific program checks.
17. Verifica USDA/local geographies con current sources.
18. Implementa price/tax/insurance/HOA contexts.
19. Implementa condo/manufactured/multi-unit contexts.
20. Implementa repair/renovation handoff.
21. Implementa Offer/Contract records.
22. Rerun affordability/assistance después de material contract change.
23. Implementa Loan Estimate ingestion/comparison.
24. Nunca alteres lender Loan Estimate.
25. Implementa Rate Lock.
26. Implementa Assistance Reservation.
27. Implementa Purchase Readiness Gate.
28. Implementa permissions/APIs/events/workflows.
29. Implementa immutable audit.
30. No marques Parte 4 completa si SG puede generar un preapproval sin lender source.

### Verificación final de Parte 4

- ¿Matching explica program/lender/property factors?
- ¿Lender overlays están versionados?
- ¿Referral sharing tiene consent y minimum necessary?
- ¿Prequal/preapproval vienen del lender?
- ¿Property eligibility usa address/current rules?
- ¿Tax/insurance estimates están etiquetados?
- ¿Condo/manufactured/multi-unit tienen context específico?
- ¿Contract changes recalculan affordability?
- ¿Loan Estimates se preservan como lender docs?
- ¿Rate lock tiene source/expiration?
- ¿Assistance reservation se monitorea?
- ¿Purchase Readiness diferencia ready/blocked/conditions?
- ¿Toda acción queda auditada?

---

# Parte 5 — Homebuyer Portal, Property Journey, Inspections, Appraisal, Title, Insurance, Closing Coordination y Post-Closing Handoffs

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 5  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 36 — Parte 4  
**Secciones incluidas:** 4856–4920  
**Audiencia:** Owner, Codex, homebuyer specialists, lender/partner managers, real-estate coordinators, title/insurance partners, compliance, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Portal centrado en el cliente para coordinar el journey desde property search hasta closing y post-closing, preservando límites de rol entre SG Solutions, lender, real-estate agent, inspector, appraiser, title/settlement, insurer y otros profesionales

## 4856. Objetivo de Parte 5

Esta parte define la experiencia desde que el cliente entra en property search o under contract hasta después del closing.

Deberá cubrir:

- Homebuyer Client Portal;
- property pipeline;
- contract milestones;
- inspection;
- appraisal;
- title/settlement;
- homeowners insurance;
- lender conditions;
- DPA/grant conditions;
- closing disclosure;
- cash-to-close;
- final walk-through;
- closing;
- document vault;
- post-closing plan;
- downstream handoffs.

## 4857. Client Portal Principle

```text
verified milestone
→ clear client status
→ specific next action
→ responsible party
→ deadline
→ evidence
```

Nunca:

```text
complex closing process
→ vague "everything is fine"
```

## 4858. Homebuyer Client Portal

Secciones:

```text
Overview
Readiness
Programs
Lender
Properties
Under Contract
Tasks
Documents
Inspection
Appraisal
Insurance
Title / Closing
Assistance
Closing Costs
Closing Day
Post-Closing
Messages
History
```

## 4859. Portal Overview

Campos visibles:

```text
homebuyerCaseStatus
purchaseReadinessStatus
selectedProperty
contractStatus
lenderStatus
programStatus
closingDate
cashToCloseStatus
openClientActions
nextMilestone
assignedSpecialist
lastUpdatedAt
```

## 4860. Client-Friendly Milestones

Ejemplos:

```text
Preparing finances
Ready to shop
Property selected
Offer submitted
Under contract
Inspection period
Appraisal in progress
Loan conditions
Closing preparation
Clear to close reported by lender
Closing scheduled
Closed
```

## 4861. Milestone Record

Campos:

```text
id
homebuyerCaseId
propertyCandidateId
milestoneType
status
responsibleParty
targetDate
completedAt
source
evidenceDocumentIds
```

## 4862. Milestone Status

```text
not_started
upcoming
in_progress
client_action_required
partner_action_required
completed
blocked
waived
cancelled
unknown
```

## 4863. Responsibility Boundary

Cada task/milestone deberá asignar:

```text
client
SG_specialist
lender
loan_officer
real_estate_agent
inspector
appraiser
title_or_settlement
insurance_agent
program_administrator
other_partner
```

## 4864. Property Journey Board

Pipeline:

```text
saved
reviewing
touring
potential_fit
offer_planned
offer_submitted
countered
under_contract
closing
closed
rejected_or_withdrawn
```

## 4865. Property Comparison View

Podrá comparar:

```text
price
estimated_payment
estimated_taxes
estimated_insurance
HOA
cash_to_close
program_fit
property_type
unit_count
condition
commute_or_client_preferences
```

Estimates deberán estar etiquetados.

## 4866. Under-Contract Workspace

Cuando exista Accepted Contract deberá crear:

```text
contract timeline
inspection deadline
financing contingency deadline
appraisal milestone
title milestone
insurance deadline
lender conditions
assistance deadlines
closing date
final walk-through
```

## 4867. Contract Deadline Record

Campos:

```text
id
acceptedContractId
deadlineType
dueAt
sourceDocumentId
extractedValue
verifiedValue
verificationStatus
responsibleParty
status
```

## 4868. Contract Deadline Extraction Boundary

IA/document parsing podrá sugerir deadlines, pero:

```text
extracted deadline
→ human/authorized verification
→ active calendar
```

No activar critical deadline automáticamente desde una extracción no verificada.

## 4869. Earnest Money Record

Campos:

```text
amount
dueDate
paidAt
paymentMethodReference
escrowHolder
receiptDocumentId
verificationStatus
```

## 4870. Earnest Money Source Tracking

Cuando sea relevante para underwriting:

```text
accountSource
withdrawalEvidence
depositReceipt
giftContext
reconciliationStatus
```

## 4871. Inspection Record

Campos:

```text
id
propertyCandidateId
inspectionType
inspectorPartnerIdOptional
scheduledAt
completedAt
reportDocumentId
status
clientDecisionStatus
```

## 4872. Inspection Types

```text
general_home
radon
termite_or_pest
sewer_scope
well
septic
mold
structural
roof
HVAC
other
```

Requirements/practices pueden variar por property/program/location.

## 4873. Inspection Status

```text
not_scheduled
scheduled
completed
report_received
client_review
negotiation_or_action
resolved
waived_by_client_context
cancelled
```

## 4874. Inspection Finding

Campos:

```text
inspectionId
category
severity
description
estimatedRepairContext
professionalRecommendation
clientAction
status
```

SG Solutions no deberá actuar como inspector.

## 4875. Repair / Negotiation Coordination

La plataforma podrá registrar:

```text
repair_requested
seller_credit_requested
price_adjustment_requested
as_is_acceptance
specialist_review
```

Las negociaciones deberán manejarse por parties/professionals autorizados.

## 4876. Material Property Change

Un material repair/credit/price change deberá poder rerun:

- affordability;
- funds to close;
- program eligibility;
- loan amount;
- appraisal considerations;
- DPA calculations.

## 4877. Appraisal Record

Campos:

```text
id
propertyCandidateId
lenderId
appraisalOrderReference
orderedAt
inspectionAt
completedAt
appraisedValue
documentId
status
source
```

## 4878. Appraisal Status

```text
not_ordered
ordered
scheduled
inspection_complete
report_pending
completed
revision_requested
reconsideration_context
cancelled
unknown
```

## 4879. Appraisal Value Boundary

`appraisedValue` deberá venir de lender/appraiser source.

SG Solutions no deberá fabricar o modificar value.

## 4880. Appraisal Gap Context

Campos:

```text
contractPrice
appraisedValue
gapAmount
appraisalContingency
availableCashContext
renegotiationStatus
lenderReviewStatus
```

## 4881. Appraisal Condition / Repair Requirement

Cuando el report/lender identifique repair conditions:

```text
condition
responsibleParty
requiredBeforeClosing
completionEvidence
reinspectionRequired
status
```

## 4882. Title / Settlement Case

Campos:

```text
id
homebuyerCaseId
propertyCandidateId
titlePartnerId
settlementProviderId
status
openedAt
closingDate
documentIds
```

## 4883. Title Status

```text
ordered
search_in_progress
commitment_received
issues_detected
issue_resolution
clear_for_closing_context
closed
cancelled
unknown
```

## 4884. Title Commitment Record

Campos:

```text
documentId
effectiveDate
exceptions
requirements
vestingContext
reviewStatus
source
```

La revisión legal final deberá recaer en profesionales apropiados.

## 4885. Title Issue

Tipos:

```text
lien
judgment
ownership_issue
legal_description_issue
tax_issue
estate_or_probate_context
HOA_issue
other
```

## 4886. Title Issue Resolution Tracking

Campos:

```text
titleIssueId
responsibleParty
requiredAction
deadline
supportingDocuments
status
resolvedAt
```

## 4887. Homeowners Insurance Case

Campos:

```text
id
homebuyerCaseId
propertyCandidateId
insurancePartnerIdOptional
coverageType
quoteStatus
policyStatus
effectiveDate
premium
documentId
```

## 4888. Insurance Quote Status

```text
not_started
quotes_requested
quotes_received
client_review
selected
binder_requested
binder_received
policy_active
unable_to_place
```

## 4889. Insurance Comparison

Podrá comparar:

```text
annualPremium
deductible
dwellingCoverage
liabilityCoverage
additionalCoverages
carrier
effectiveDate
```

La plataforma deberá evitar recomendar únicamente por compensation.

## 4890. Insurance Binder Record

Campos:

```text
carrier
policyNumberToken
effectiveDate
annualPremium
mortgageeClauseStatus
documentId
verificationStatus
```

## 4891. Flood Insurance Context

Cuando property/lender lo requiera:

```text
floodZoneContext
determinationSource
coverageRequiredContext
quoteStatus
policyStatus
```

No inferir requirement solo por visual map sin authoritative determination.

## 4892. Lender Condition Record

Campos:

```text
id
homebuyerCaseId
lenderId
conditionType
description
requestedDocuments
dueDate
status
sourceMessage
createdAt
resolvedAt
```

## 4893. Lender Condition Status

```text
open
client_action_required
partner_action_required
submitted
under_review
cleared
rejected_or_revised
waived_by_lender
unknown
```

## 4894. Condition Response Workflow

```text
lender condition
→ normalize
→ assign task
→ collect document/data
→ internal quality check
→ client authorization if new scope
→ lender submission
→ track
```

## 4895. Clear-to-Close Boundary

La plataforma solo podrá mostrar:

```text
clear_to_close_reported_by_lender
```

si existe lender source.

Nunca deberá generar este estado internamente.

## 4896. Closing Disclosure Record

Campos:

```text
id
homebuyerCaseId
lenderId
documentId
issuedAt
loanAmount
rate
APR
monthlyPayment
closingCosts
cashToClose
credits
prepaids
escrows
verificationStatus
```

## 4897. Closing Disclosure Comparison

Podrá comparar contra:

```text
prior Loan Estimate
accepted contract
assistance reservation
known credits
expected cash to close
```

y flaggear changes para revisión.

## 4898. Closing Cost Variance Finding

Tipos:

```text
cash_to_close_change
rate_change
payment_change
fee_change
credit_change
assistance_change
tax_or_insurance_change
unknown
```

## 4899. Final Cash-to-Close Record

Campos:

```text
verifiedAmount
sourceDocumentId
dueDate
acceptablePaymentInstructionsSource
verificationStatus
confirmedAt
```

## 4900. Wire Fraud Safety Control

La plataforma deberá advertir:

- no confiar en wiring instructions cambiadas por email sin verificación;
- verificar instrucciones con settlement/title party mediante approved channel;
- tratar cambios inesperados como high-risk alert.

La plataforma no deberá inventar wiring instructions.

## 4901. Assistance Finalization

Para DPA/grants:

```text
reservation
→ conditions
→ final approval/source
→ closing integration
→ funded amount
→ post-closing obligations
```

## 4902. Assistance Closing Record

Campos:

```text
programId
approvedAssistance
fundedAssistance
lienOrSecondMortgageContext
forgivenessTerms
repaymentTerms
occupancyRequirement
documentIds
verificationStatus
```

## 4903. Final Walk-Through Record

Campos:

```text
scheduledAt
completedAt
agentReference
clientStatus
issuesFound
issueResolution
evidenceOptional
```

## 4904. Closing Appointment

Campos:

```text
closingDate
closingTime
locationOrRemoteContext
settlementProvider
signingMethod
requiredIdentification
fundsInstructionStatus
status
```

## 4905. Closing Status

```text
scheduled
ready_with_conditions
client_action_required
signing_complete
funding_pending
recording_pending
closed_verified
delayed
cancelled
```

## 4906. Closing Verification

`closed_verified` requerirá evidence como:

```text
settlement_confirmation
final_closing_document
recording_confirmation_context
lender_funding_confirmation
title_partner_confirmation
```

## 4907. Closing Document Vault

Podrá incluir:

```text
final_closing_disclosure
promissory_note_reference
mortgage_or_deed_of_trust_reference
deed
settlement_statement
title_policy
insurance_policy
DPA_documents
inspection
appraisal
warranties
other
```

Access deberá seguir sensitivity rules.

## 4908. Property Ownership Record

Tras closing verified:

```text
id
clientId
propertyAddress
ownershipStartDate
ownershipType
purchasePrice
loanReferences
programReferences
documentReferences
status
```

## 4909. Post-Closing Plan

Campos:

```text
id
homebuyerCaseId
propertyOwnershipId
firstPaymentDate
servicerReference
taxEscrowContext
insuranceRenewalDate
homeMaintenanceTasks
DPAObligations
occupancyObligations
refinanceReviewDate
status
createdAt
```

## 4910. Mortgage Servicer Record

Cuando se conozca:

```text
servicerName
loanReferenceToken
paymentPortalReference
firstPaymentDate
sourceDocumentId
verificationStatus
```

La plataforma no deberá solicitar credenciales bancarias innecesarias.

## 4911. First Payment Reminder

Podrá crear:

```text
firstPaymentDue
reminderSchedule
servicerReference
clientAcknowledgment
```

## 4912. Escrow / Tax / Insurance Tracking Context

Podrá registrar:

```text
escrowedTaxes
escrowedInsurance
nonEscrowedItems
insuranceRenewal
propertyTaxReview
```

sin convertirse en mortgage servicing system.

## 4913. DPA Post-Closing Obligation Tracking

Ejemplos:

```text
occupancy_period
forgiveness_schedule
sale_trigger
refinance_trigger
annual_certification_if_required
other
```

Siempre rule/source-backed.

## 4914. Home Maintenance Starter Plan

Opcionalmente:

```text
seasonal_tasks
warranty_documents
utility_setup
emergency_contacts
maintenance_budget
```

separado de legal/loan compliance.

## 4915. Post-Closing Financial Handoffs

Posibles destinos:

```text
financial_planning_future
tax
insurance
budgeting
credit_monitoring
home_maintenance
```

## 4916. Tax Handoff

Al Módulo 30:

```text
propertyOwnershipId
purchaseDate
purchasePrice
loanContext
closingDocumentReferences
propertyTaxContext
pointsOrInterestDocumentsWhenRelevant
```

El Módulo 30 determinará tax treatment.

## 4917. Insurance Handoff

Cuando exista marketplace/partner:

```text
propertyOwnershipId
activePolicyReference
renewalDate
coverageSummary
consent
```

## 4918. Permissions, APIs, Events and Workflows

### Permisos

```text
homebuying.portal.read
homebuying.milestone.read
homebuying.milestone.manage

homebuying.inspection.read
homebuying.inspection.manage

homebuying.appraisal.read
homebuying.appraisal.manage

homebuying.title.read
homebuying.title.manage

homebuying.insurance.read
homebuying.insurance.manage

homebuying.lender_condition.read
homebuying.lender_condition.manage

homebuying.closing.read
homebuying.closing.manage
homebuying.post_closing.read
homebuying.post_closing.manage
```

### APIs

```text
GET  /api/homebuying/cases/{id}/portal
POST /api/homebuying/cases/{id}/milestones
POST /api/homebuying/contracts/{id}/deadlines

POST /api/homebuying/properties/{id}/inspections
POST /api/homebuying/properties/{id}/appraisals
POST /api/homebuying/cases/{id}/title-cases
POST /api/homebuying/cases/{id}/insurance-cases

POST /api/homebuying/cases/{id}/lender-conditions
POST /api/homebuying/cases/{id}/closing-disclosures
POST /api/homebuying/cases/{id}/closing-records
POST /api/homebuying/cases/{id}/post-closing-plans
```

### Eventos

```text
HomebuyerMilestoneCreated
HomebuyerContractDeadlineVerified
HomebuyerEarnestMoneyVerified
HomebuyerInspectionCompleted
HomebuyerAppraisalCompleted
HomebuyerAppraisalGapDetected
HomebuyerTitleIssueDetected
HomebuyerInsuranceSelected
HomebuyerLenderConditionCreated
HomebuyerLenderConditionCleared
HomebuyerClearToCloseReported
HomebuyerClosingDisclosureReceived
HomebuyerCashToCloseVerified
HomebuyerClosingScheduled
HomebuyerClosingVerified
HomebuyerPostClosingPlanCreated
```

### Workflows

```text
Homebuyer Portal Workflow
Contract Milestone Workflow
Inspection Workflow
Appraisal Workflow
Title Workflow
Insurance Workflow
Lender Condition Workflow
Closing Disclosure Review Workflow
Cash-to-Close Workflow
Closing Workflow
Post-Closing Workflow
```

## 4919. Pruebas de Parte 5

Pruebas obligatorias:

1. Renderizar Homebuyer Portal.
2. Crear client-friendly milestone.
3. Asignar responsible party.
4. Crear Property Journey Board.
5. Comparar properties.
6. Crear Under-Contract Workspace.
7. Extraer contract deadline.
8. Bloquear unverified critical deadline.
9. Crear Earnest Money Record.
10. Rastrear earnest-money source.
11. Crear general inspection.
12. Crear specialty inspection.
13. Crear Inspection Finding.
14. Registrar repair request.
15. Rerun affordability after material credit/change.
16. Crear Appraisal Record.
17. Registrar lender/appraiser value.
18. Crear appraisal gap.
19. Crear appraisal condition.
20. Crear Title Case.
21. Crear title commitment.
22. Crear title issue.
23. Resolver title issue.
24. Crear Insurance Case.
25. Comparar insurance quotes.
26. Crear binder.
27. Crear flood context.
28. Crear Lender Condition.
29. Resolver condition.
30. Bloquear internal clear-to-close.
31. Registrar lender-reported clear-to-close.
32. Crear Closing Disclosure Record.
33. Comparar CD vs LE.
34. Crear cost variance finding.
35. Crear Final Cash-to-Close.
36. Activar wire-fraud warning.
37. Crear Assistance Closing Record.
38. Crear Final Walk-Through.
39. Crear Closing Appointment.
40. Crear delayed closing.
41. Verificar closing con evidence.
42. Crear Closing Document Vault.
43. Crear Property Ownership Record.
44. Crear Post-Closing Plan.
45. Crear Mortgage Servicer Record.
46. Crear first-payment reminder.
47. Crear escrow/tax context.
48. Crear DPA post-closing obligation.
49. Crear maintenance starter plan.
50. Crear Tax handoff.
51. Crear Insurance handoff.
52. Probar permissions.
53. Probar APIs.
54. Probar events/outbox.
55. Probar workflows.
56. Probar immutable audit.
57. Probar tenant isolation.
58. Probar sensitive document access.
59. Probar bilingual portal.
60. Probar closing-date change propagation.

## 4920. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 5 estará completa cuando:

1. Exista Homebuyer Client Portal.
2. Exista portal overview.
3. Existan client-friendly milestones.
4. Exista Milestone Record.
5. Exista responsibility boundary.
6. Exista Property Journey Board.
7. Exista property comparison.
8. Exista Under-Contract Workspace.
9. Exista Contract Deadline Record.
10. Critical deadline extraction requiera verification.
11. Exista Earnest Money Record.
12. Exista earnest-money source tracking.
13. Exista Inspection Record.
14. Existan inspection types.
15. Existan Inspection Findings.
16. Exista repair/negotiation coordination.
17. Material changes rerun calculations.
18. Exista Appraisal Record.
19. Appraisal value tenga external source.
20. Exista Appraisal Gap Context.
21. Existan appraisal repair conditions.
22. Exista Title/Settlement Case.
23. Exista Title Status.
24. Exista Title Commitment.
25. Existan Title Issues.
26. Exista issue-resolution tracking.
27. Exista Homeowners Insurance Case.
28. Exista quote status.
29. Exista insurance comparison.
30. Exista Binder Record.
31. Exista Flood Context.
32. Exista Lender Condition Record.
33. Exista condition workflow.
34. Clear-to-close solo provenga de lender.
35. Exista Closing Disclosure Record.
36. Exista CD comparison.
37. Existan cost variance findings.
38. Exista Final Cash-to-Close.
39. Exista wire-fraud safety control.
40. Exista Assistance Finalization.
41. Exista Assistance Closing Record.
42. Exista Final Walk-Through.
43. Exista Closing Appointment.
44. Exista Closing Status.
45. Closed verified requiera evidence.
46. Exista Closing Document Vault.
47. Exista Property Ownership Record.
48. Exista Post-Closing Plan.
49. Exista Servicer Record.
50. Exista First Payment Reminder.
51. Exista Escrow/Tax/Insurance context.
52. Exista DPA post-closing tracking.
53. Exista Home Maintenance Starter Plan.
54. Existan post-closing handoffs.
55. Exista Tax Handoff.
56. Exista Insurance Handoff.
57. Existan permisos/APIs/events/workflows.
58. Toda milestone material tenga source/evidence.
59. La UI preserve role boundaries.
60. Parte 5 termine lista para governance/security/analytics de Parte 6.

### Instrucciones para Codex

1. Lee Partes 1–4 completas.
2. Implementa Portal sobre shared records, no copies.
3. Implementa Milestones.
4. Implementa explicit responsible party.
5. Implementa Property Journey Board.
6. Implementa Under-Contract Workspace.
7. No actives critical deadlines desde AI extraction sin verification.
8. Implementa earnest-money tracking.
9. Implementa inspection coordination sin asumir inspector role.
10. Implementa appraisal records con source externo.
11. Implementa appraisal-gap workflow.
12. Implementa Title/Settlement Case.
13. No emitas legal title opinions.
14. Implementa Insurance Case/quotes/binder.
15. Implementa lender conditions.
16. Solo lender source puede crear clear-to-close.
17. Implementa Closing Disclosure ingestion.
18. Compara CD vs LE sin alterar lender docs.
19. Implementa Cash-to-Close verification.
20. Implementa wire-fraud controls.
21. Implementa assistance finalization.
22. Implementa walk-through/closing.
23. Exige evidence para closed_verified.
24. Reutiliza Documents para closing vault.
25. Implementa Property Ownership Record.
26. Implementa Post-Closing Plan.
27. Implementa servicer/first-payment context.
28. Implementa DPA post-closing rules versionadas.
29. Implementa Tax/Insurance handoffs.
30. Implementa permissions/APIs/events/workflows.
31. Implementa immutable audit.
32. No marques Parte 5 completa si SG puede marcar clear-to-close o closed sin external evidence.

### Verificación final de Parte 5

- ¿El portal muestra quién es responsable de cada acción?
- ¿Contract deadlines son verificadas?
- ¿Inspection/appraisal/title/insurance mantienen role boundaries?
- ¿Appraisal value viene del source correcto?
- ¿Lender conditions quedan trazadas?
- ¿Clear-to-close viene del lender?
- ¿CD se compara sin modificarlo?
- ¿Cash-to-close viene de document source?
- ¿Wire-fraud controls están activos?
- ¿Closing verified requiere evidence?
- ¿Post-closing conserva DPA/servicer/tax context?
- ¿Toda acción queda auditada?

---

# Parte 6 — Partners, Automation, AI, Compliance, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 6  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 36 — Parte 5  
**Secciones incluidas:** 4921–4985  
**Audiencia:** Owner, Codex, homebuyer specialists, housing-program analysts, lender/partner managers, compliance, security, operations, administrators, support y Data Analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Home Buying Assistance nationwide basada en programas, lenders, partners y property rules versionados, con automatización supervisada, IA grounded, controles de rol/licensing, seguridad por mínimo privilegio, trazabilidad y continuidad operativa

## 4921. Objetivo de Parte 6

Esta parte cierra el Módulo 36 definiendo:

- partner/provider governance;
- lender integrations;
- housing-program integrations;
- agent/title/insurance/inspection partner coordination;
- automation;
- AI;
- mortgage-role boundaries;
- compliance;
- security;
- privileged access;
- administration;
- work queues;
- SLAs;
- observability;
- analytics;
- migration;
- data portability;
- business continuity;
- disaster recovery;
- E2E;
- aceptación final.

## 4922. Partner Governance Principle

```text
verified partner
→ verified capability
→ current jurisdiction/program coverage
→ scoped data sharing
→ tracked action
→ external evidence
→ audit
```

Nunca:

```text
partner exists
→ all capabilities assumed
```

## 4923. Partner Types

```text
mortgage_lender
mortgage_broker
loan_officer
housing_counseling_agency
real_estate_brokerage
real_estate_agent
title_company
settlement_agent
closing_attorney
home_inspector
appraiser
insurance_agency
insurance_carrier
DPA_program_administrator
state_HFA
local_housing_agency
homebuilder
other
```

## 4924. Partner Registry Link

Campos:

```text
partnerId
partnerType
legalName
displayName
jurisdictions
licensesOrAuthorizationsContext
programParticipation
serviceAreas
capabilities
integrationStatus
contractStatus
compensationModel
status
```

## 4925. Partner Verification Status

```text
not_verified
verification_in_progress
verified
verification_expired
restricted
suspended
terminated
unknown
```

## 4926. Jurisdiction / Authority Verification

Cuando sea necesario por role:

```text
licenseType
licenseNumberOrReference
jurisdiction
status
verifiedAt
expiresAt
source
```

La plataforma no deberá representar a un partner como autorizado sin source vigente.

## 4927. Partner Capability Matrix

Por partner:

```text
acceptReferral
acceptApplication
providePrequalification
providePreapproval
provideLoanEstimate
provideStatusUpdates
provideAppraisalStatus
provideClosingStatus
provideInsuranceQuote
provideInspectionScheduling
provideTitleUpdates
provideDPAReservation
provideDocuments
webhooks
API
secureLink
manualPortal
```

## 4928. Partner Status

```text
active
limited
onboarding
temporarily_unavailable
suspended
terminated
unknown
```

Partners suspendidos no recibirán nuevas referrals.

## 4929. Partner SLA

Podrá incluir:

```text
referralResponseTarget
clientContactTarget
documentReviewTarget
preapprovalTargetEstimate
conditionResponseTarget
closingUpdateTarget
supportEscalationTarget
```

Targets no contractuales deberán etiquetarse como estimates.

## 4930. Partner Health

```text
healthy
degraded
partially_available
unavailable
unknown
```

## 4931. Partner Failure / Fallback

Ante failure:

```text
preserve current case state
→ stop duplicate external action
→ verify external outcome
→ notify specialist
→ evaluate alternate partner
→ refresh client consent if needed
→ resume safely
```

## 4932. Data Sharing Governance

Antes de compartir:

```text
partner
purpose
program
property
dataScope
consent
disclosure
transmissionMethod
retentionExpectation
audit
```

Solo minimum necessary.

## 4933. Partner Credential Security

API credentials/secrets deberán:

- almacenarse cifrados;
- tener scope limitado;
- rotarse;
- no aparecer en logs;
- permitir revocation;
- quedar auditados.

## 4934. External Event Inbox

Para webhooks/events:

```text
authenticate
→ persist raw event
→ deduplicate
→ normalize
→ process idempotently
→ audit
```

## 4935. External Event Idempotency

Dedup keys:

```text
partnerId
externalEventId
eventType
```

o payload hash si no existe event ID confiable.

## 4936. Polling Fallback

Cuando no haya webhooks:

- scheduled polling;
- rate limiting;
- backoff;
- last-known status;
- retry limit;
- escalation.

## 4937. Automation Engine

Automatizaciones permitidas:

- readiness refresh;
- stale-program detection;
- lender-overlay refresh;
- match rerun;
- document reminders;
- preapproval expiration alerts;
- contract deadline reminders;
- condition aging;
- appraisal/title/insurance status polling;
- closing reminders;
- DPA obligation reminders;
- analytics refresh.

## 4938. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 4939. Informational Automation

Ejemplos:

- summarize case;
- show next milestone;
- highlight stale docs;
- calculate deadline aging;
- refresh dashboards;
- draft status update.

## 4940. Low-Risk Automation

Ejemplos:

- create task;
- schedule reminder;
- update normalized external status;
- attach verified document;
- route queue;
- create idempotent handoff.

## 4941. Moderate-Risk Automation

Ejemplos:

- rerun program screening;
- rerun lender matching;
- propose affordability scenario;
- propose program stack;
- suggest missing documents;
- propose next-best partner.

Deberán conservar explainability.

## 4942. High-Risk Automation

Requiere human/authorization gate:

- send mortgage application data;
- trigger credit pull;
- share new sensitive data scope;
- submit DPA application;
- override program blocker;
- mark lender preapproval received manually;
- mark clear-to-close;
- mark closed_verified.

## 4943. Prohibited Automation

No deberá:

- fabricate preapproval;
- fabricate lender decision;
- fabricate rate lock;
- fabricate appraisal;
- fabricate title clearance;
- fabricate insurance binder;
- fabricate clear-to-close;
- fabricate closing;
- bypass consent;
- alter lender/closing documents;
- promise mortgage approval.

## 4944. AI Assistant Scope

La IA podrá:

- summarize homebuyer readiness;
- explain mortgage/program differences;
- explain DPA structures;
- suggest missing docs;
- summarize lender conditions;
- compare Loan Estimates;
- summarize Closing Disclosure changes;
- identify likely process blockers;
- draft client questions;
- summarize partner updates.

## 4945. AI Grounding Requirements

Para:

- current program rules;
- current income/purchase-price limits;
- lender overlays;
- loan limits;
- DPA terms;
- program funding availability;
- geography eligibility;
- current fees/terms;

la IA deberá usar verified current registry/partner sources.

## 4946. AI Output Contract

Material outputs deberán incluir:

```text
answerOrRecommendation
confidence
sourceReferences
programVersion
lenderOverlayVersion
propertySnapshotVersion
assumptions
unknowns
humanReviewRequired
```

## 4947. AI Prohibited Decisions

La IA no podrá:

- issue mortgage approval;
- issue preapproval;
- decide fair-lending protected-class eligibility outside explicit program rules;
- approve appraisal value;
- approve title;
- approve insurance;
- declare clear-to-close;
- accept contractual terms for client.

## 4948. Mortgage / Homebuying Compliance Framework

Controles:

- role disclosure;
- no-guarantee language;
- current program sources;
- consent before sharing;
- credit-pull transparency;
- referral compensation transparency;
- fair and consistent matching criteria;
- document integrity;
- lender-issued decision preservation;
- disclosure preservation;
- audit.

## 4949. Fair Matching Control

Matching deberá usar:

```text
program eligibility
lender overlays
financial facts
property facts
client preferences
```

y no deberá usar protected attributes salvo cuando una lawful program criterion los requiera y compliance lo permita.

## 4950. Compliance Finding

Campos:

```text
id
homebuyerCaseId
findingType
severity
description
affectedResource
sourceReferences
blocking
status
assignedTo
createdAt
resolvedAt
```

## 4951. Compliance Finding Types

```text
stale_program
stale_lender_overlay
missing_consent
role_disclosure_missing
referral_compensation_issue
credit_pull_disclosure_issue
sensitive_data_scope_issue
protected_attribute_use_issue
unverified_preapproval
unverified_clear_to_close
closing_document_mismatch
partner_authorization_issue
other
```

## 4952. Compliance Finding Status

```text
open
under_review
client_action_required
partner_action_required
resolved
accepted_with_documented_reason
not_applicable
```

## 4953. Referral Compensation Governance

Si SG Solutions recibe compensation:

- contract reference;
- disclosure rule;
- amount/basis;
- conflict review;
- audit;
- no hidden ranking influence.

## 4954. Administrative Console

Secciones:

```text
Overview
Homebuyer Cases
Readiness
Financial Review
Programs
Lenders
Partners
Matching
Preapprovals
Properties
Under Contract
Inspections
Appraisals
Title
Insurance
Closing
DPA
Work Queues
SLAs
Compliance
Analytics
Security
Configuration
```

## 4955. Homebuying Operations Dashboard

Deberá mostrar:

- active cases;
- intake backlog;
- financial-review backlog;
- program-screening ready;
- lender referrals;
- preapprovals;
- property-search ready;
- under-contract;
- appraisal pending;
- title issues;
- insurance pending;
- closing within 7 days;
- DPA conditions;
- stale programs;
- compliance blockers.

## 4956. Work Queues

```text
intake_review
financial_review
program_review
matching_review
lender_referral
preapproval_followup
property_review
contract_deadlines
inspection_followup
appraisal_followup
title_issue
insurance_followup
lender_conditions
DPA_conditions
closing_review
post_closing
compliance_review
partner_escalation
```

## 4957. Assignment Engine

Podrá considerar:

- state/jurisdiction;
- program type;
- lender;
- language;
- property type;
- self-employment complexity;
- case stage;
- specialist permissions;
- workload;
- SLA deadline.

## 4958. SLA Tracking

Conceptos:

```text
intake_review_sla
financial_review_sla
program_screening_sla
lender_referral_sla
preapproval_followup_sla
property_review_sla
contract_deadline_sla
condition_response_sla
closing_review_sla
```

## 4959. SLA Clock Segmentation

Separar:

```text
internal_active_time
client_blocked_time
lender_blocked_time
partner_blocked_time
underwriting_time
property_transaction_time
```

## 4960. Security Model

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

## 4961. Sensitive Homebuying Data

Incluye:

- tax identifiers;
- credit data;
- tax returns;
- paystubs;
- bank statements;
- asset accounts;
- debt documents;
- identity docs;
- divorce/support docs when relevant;
- lender application data;
- appraisal/title/closing documents.

## 4962. Field-Level Masking

Ejemplos:

```text
Bank: ******4821
Tax ID: ***-**-3920
Loan Ref: ********1288
```

## 4963. Sensitive Document Access

Acceso podrá requerir:

```text
permission
purpose
reauthentication
temporary session
audit
```

## 4964. Credit Data Isolation

Credit data deberá:

- estar segregada cuando corresponda;
- seguir consent scope;
- no usarse para unrelated marketing;
- tener stricter access;
- conservar source/provider.

## 4965. Data Retention

Retention deberá variar por:

- intake;
- tax/financial docs;
- credit data;
- applications;
- lender disclosures;
- property records;
- title/insurance docs;
- closing docs;
- consents;
- referral records;
- audit/legal hold.

## 4966. Export Governance

Campos:

```text
requestedBy
purpose
dataScope
destination
maskingPolicy
generatedAt
expiresAt
downloadEvents
```

## 4967. Privileged Actions

Ejemplos:

- reveal full tax ID;
- export bank/tax package;
- override program blocker;
- mark preapproval verified;
- mark clear-to-close verified;
- mark closing verified;
- alter partner authorization;
- alter referral compensation;
- reopen completed case.

## 4968. Owner Break-Glass

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

## 4969. Security Incident Types

```text
cross_client_access
credit_data_exposure
bank_document_exposure
tax_document_exposure
unauthorized_referral
unauthorized_credit_pull
unauthorized_data_sharing
partner_credential_compromise
closing_document_tampering
wire_instruction_risk
privilege_misuse
```

## 4970. Security Incident Response

```text
detect
→ contain
→ preserve evidence
→ restrict access
→ assess scope
→ compliance/security review
→ remediation
→ post-incident analysis
```

## 4971. Audit Trail

Deberá registrar:

- profile versions;
- income/asset/debt calculations;
- program versions;
- lender overlays;
- matching runs;
- consents;
- data shared;
- referrals;
- lender prequal/preapproval;
- property snapshots;
- contract deadlines;
- inspection/appraisal/title/insurance updates;
- Loan Estimates;
- Closing Disclosures;
- clear-to-close source;
- closing verification;
- partner compensation;
- sensitive access;
- exports;
- overrides.

## 4972. Observability

Métricas técnicas:

```text
program_screening_failure_rate
matching_failure_rate
partner_api_failure_rate
webhook_failure_rate
credit_integration_failure_rate
document_ingestion_failure_rate
deadline_processing_failure_rate
closing_sync_failure_rate
handoff_failure_rate
```

## 4973. Operational Alerts

Alertas:

- stale program used in active case;
- lender overlay stale;
- preapproval expiring;
- contract deadline near;
- lender condition aging;
- appraisal delay;
- title issue unresolved;
- insurance binder missing;
- assistance reservation expiring;
- closing disclosure mismatch;
- cash-to-close mismatch;
- clear-to-close source missing;
- partner authorization expired;
- wire instruction anomaly.

## 4974. Analytics Dashboards

```text
Homebuying Executive Dashboard
Homebuyer Readiness Dashboard
Financial Readiness Dashboard
Program Match Dashboard
Lender Performance Dashboard
Property Journey Dashboard
Under-Contract Dashboard
Closing Dashboard
DPA Dashboard
Partner Performance Dashboard
Compliance Quality Dashboard
Post-Closing Dashboard
```

## 4975. Core Funnel KPIs

```text
cases_started
profiles_completed
financial_packages_completed
program_screenings_completed
lender_referrals_sent
prequalifications_received
preapprovals_received
property_search_ready
offers_submitted
contracts_accepted
closings_verified
```

## 4976. Conversion KPIs

```text
intake_to_readiness_rate
readiness_to_program_screening_rate
program_match_to_lender_referral_rate
referral_to_preapproval_rate
preapproval_to_contract_rate
contract_to_closing_rate
overall_case_to_closing_rate
```

Cada metric deberá definir denominator.

## 4977. Program / Assistance KPIs

```text
program_match_count
DPA_match_count
DPA_reservation_count
DPA_funded_count
average_assistance_amount
grant_match_count
forgivable_assistance_count
program_expiration_loss_count
```

## 4978. Lender / Partner KPIs

```text
referral_acceptance_rate
client_contact_time
preapproval_rate
average_preapproval_time
condition_response_time
closing_rate
partner_error_rate
partner_SLA_breach_rate
```

No usar estas métricas para prácticas discriminatorias.

## 4979. Property / Closing KPIs

```text
average_days_to_property
offer_acceptance_rate
average_days_under_contract
inspection_issue_rate
appraisal_gap_rate
title_issue_rate
closing_delay_rate
average_cash_to_close_variance
```

## 4980. Quality KPIs

```text
document_correction_rate
income_mismatch_rate
asset_source_review_rate
stale_program_block_count
unverified_preapproval_block_count
clear_to_close_source_issue_count
closing_document_variance_rate
duplicate_referral_prevented_count
```

## 4981. Metric Governance

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

## 4982. Data Portability and Migration

### Portability

El cliente podrá obtener:

- case summary;
- readiness summaries;
- program matches;
- lender referrals;
- property records;
- contract milestones;
- inspection/appraisal/title/insurance references;
- Loan Estimate/Closing Disclosure references;
- closing summary;
- post-closing plan.

### Migration In

```text
import client/household
→ verify identity
→ import existing lender/property context
→ import documents
→ map milestones
→ create migration snapshot
→ continue workflow
```

No inventar historic events.

## 4983. Migration Record and Migration Out

Campos:

```text
id
clientId
sourceSystem
cutoffDate
importedCases
importedPrograms
importedLenderRecords
importedProperties
importedClosingRecords
verificationStatus
unresolvedIssues
createdAt
completedAt
```

Migration Out deberá respetar consent, retention y document sensitivity.

## 4984. Business Continuity, Disaster Recovery y E2E Tests

### Business Continuity

Ante outage:

```text
preserve last verified state
→ stop risky external actions
→ keep read-only portal when possible
→ queue low-risk work
→ restore integrations
→ reconcile external statuses
→ verify unknown outcomes
→ prevent duplicate actions
```

### Recovery Priority

1. contract deadlines;
2. closing deadlines;
3. clear-to-close/closing status;
4. lender conditions;
5. DPA reservation expirations;
6. active referrals/preapprovals;
7. routine program matching.

### E2E Scenario 1 — Preparation to Closing

```text
intake
→ financial readiness
→ program screening
→ lender referral
→ lender preapproval
→ property
→ contract
→ inspection
→ appraisal
→ title
→ insurance
→ lender conditions
→ CD
→ closing
→ post-closing
```

### E2E Scenario 2 — USDA / DPA

```text
profile
→ geography verification
→ household-income evaluation
→ USDA program screening
→ DPA compatibility
→ lender referral
→ reservation
→ property
→ closing
```

### E2E Scenario 3 — Self-Employed Buyer

```text
self-employed profile
→ M31/M30 handoff
→ financial package
→ program screening
→ lender referral
```

### E2E Scenario 4 — Appraisal Gap

```text
contract
→ appraisal below price
→ gap detected
→ affordability rerun
→ client/agent/lender actions
→ updated contract or stop
```

### E2E Scenario 5 — Stale Program

```text
program match
→ rule becomes stale
→ referral blocked
→ refresh
→ rematch
```

### E2E Scenario 6 — Closing Delay

```text
closing scheduled
→ title/condition delay
→ milestone updated
→ downstream dates updated
→ client notified
```

### E2E Scenario 7 — Unauthorized Credit Pull Attempt

```text
credit action requested
→ no valid consent
→ blocked
→ compliance finding
→ audit
```

### E2E Scenario 8 — Wire Fraud Risk

```text
unexpected wiring change
→ risk alert
→ transaction instructions blocked from trust
→ verified-channel confirmation required
→ audit
```

## 4985. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 36

El Módulo 36 estará completo cuando:

1. Exista Home Buying Service Catalog.
2. Exista Homebuyer Engagement.
3. Exista Homebuyer Case.
4. Exista progressive Intake.
5. Exista Homebuyer Profile.
6. Exista profile versioning.
7. Exista Household.
8. Borrower y household member estén separados.
9. First-time definition sea program-specific.
10. Exista Purchase Goal.
11. Exista Occupancy Intent.
12. Exista Target Geography.
13. Rural eligibility requiera source/address verification.
14. Exista Property Intent.
15. Exista Readiness Assessment.
16. Readiness/eligibility/underwriting estén separados.
17. Existan Blocking Factors.
18. Exista dynamic Document Checklist.
19. Exista Borrower Financial Profile.
20. Exista Employment History.
21. Exista normalized Income.
22. Self-employment reutilice Tax/Bookkeeping.
23. Existan Assets.
24. Exista Funds-to-Close estimate.
25. Exista Gift Funds Record.
26. Existan Reserves.
27. Existan Liabilities.
28. Exista Debt Reconciliation.
29. Exista Credit Consent.
30. Score types estén separados.
31. Exista Housing Payment model.
32. Exista Affordability Scenario.
33. Affordability y qualification estén separadas.
34. Exista DTI Methodology Registry.
35. Thresholds estén versionados.
36. Exista Financial Package.
37. Exista Financial Readiness.
38. Exista Housing Program Registry.
39. Programs tengan source/version/freshness.
40. Existan Conventional/FHA/VA/USDA families.
41. USDA Direct y Guaranteed estén separados.
42. Existan state/local programs.
43. Exista DPA model.
44. DPA repayment type sea visible.
45. Assistance max/estimated/reserved/approved/funded estén separados.
46. First-time rules estén versionadas.
47. Exista Program Stacking.
48. Exista Program Screening.
49. No existan program guarantees.
50. Exista Matching Input Snapshot.
51. Exista explainable Matching.
52. Exista Lender Overlay Registry.
53. Exista lender freshness gate.
54. Exista Lender Referral.
55. Exista scoped consent.
56. Exista minimum-necessary sharing.
57. Prequal/preapproval solo provengan del lender.
58. Exista Property Candidate.
59. Exista Property Eligibility Snapshot.
60. Exista Loan Estimate Record.
61. Exista Loan Estimate Comparison.
62. Exista Rate Lock Record.
63. Exista DPA Reservation.
64. Exista Purchase Readiness Gate.
65. Exista Homebuyer Portal.
66. Existan Milestones.
67. Critical deadlines requieran verification.
68. Exista Inspection Workflow.
69. Exista Appraisal Workflow.
70. Appraisal value venga de external source.
71. Exista Title/Settlement Workflow.
72. Exista Insurance Workflow.
73. Exista Lender Conditions Workflow.
74. Clear-to-close solo provenga del lender.
75. Exista Closing Disclosure Record.
76. Exista Closing Disclosure Comparison.
77. Exista Final Cash-to-Close.
78. Exista Wire Fraud Safety Control.
79. Exista Closing Verification.
80. Exista Closing Document Vault.
81. Exista Property Ownership Record.
82. Exista Post-Closing Plan.
83. Exista Servicer context.
84. Exista DPA post-closing tracking.
85. Exista Tax Handoff.
86. Exista Insurance Handoff.
87. Exista Partner Registry integration.
88. Exista partner verification.
89. Exista capability matrix.
90. Exista partner health/SLA.
91. Exista safe failure fallback.
92. Exista data-sharing governance.
93. Exista credential security.
94. Exista webhook/event inbox.
95. Exista polling fallback.
96. Exista Automation Engine.
97. Existan automation risk levels.
98. High-risk actions requieran gates.
99. Existan prohibited automations.
100. IA use current verified sources.
101. IA no emita approval/preapproval.
102. Exista Homebuying Compliance Framework.
103. Exista Fair Matching Control.
104. Existan Compliance Findings.
105. Referral compensation sea transparente.
106. Exista Admin Console.
107. Existan Work Queues.
108. Exista Assignment Engine.
109. Exista SLA Tracking.
110. Exista MFA/RBAC/ABAC.
111. Exista sensitive-data isolation.
112. Exista Export Governance.
113. Exista Break-Glass.
114. Exista Security Incident Workflow.
115. Exista immutable Audit Trail.
116. Exista Observability.
117. Existan Operational Alerts.
118. Existan Analytics Dashboards.
119. Exista Metric Governance.
120. Exista Data Portability.
121. Exista Migration In/Out.
122. Exista Business Continuity.
123. Exista Disaster Recovery priority.
124. Existan E2E tests.
125. Toda program rule tenga source/version.
126. Todo lender-issued status tenga source.
127. Todo credit action tenga consent.
128. Todo critical deadline tenga verified value.
129. Todo closing status tenga external evidence.
130. Toda sensitive access quede auditada.
131. Ningún retry duplique referrals/actions.
132. Ninguna IA prometa mortgage approval.
133. La plataforma funcione nationwide.
134. La UI sea bilingüe.
135. Code identifiers estén en inglés.
136. Las seis partes estén integradas.
137. SG Solutions preserve role/licensing boundaries.
138. El módulo sea implementable por Codex.
139. El journey sea trazable de intake a post-closing.
140. El módulo opere end-to-end con evidence y audit.

### Instrucciones finales para Codex

1. Lee las seis partes completas.
2. Reutiliza Módulos 30, 31 y 35.
3. Reutiliza Clients, Persons, Households, Documents, Tasks, Approvals, Marketplace, Partners, Messaging y Audit.
4. Mantén Homebuying domain separado de lender/partner adapters.
5. Versiona Homebuyer Profile.
6. Versiona Financial Package.
7. Versiona Program Registry.
8. Versiona lender overlays.
9. Conserva source/freshness.
10. No hardcodees program limits que cambian.
11. Mantén Readiness separado de Eligibility.
12. Mantén Eligibility separado de lender decision.
13. Implementa explainable matching.
14. Implementa scoped consent.
15. Implementa minimum-necessary sharing.
16. Solo lender source crea prequalification/preapproval.
17. Conserva Loan Estimates/Closing Disclosures como external docs.
18. Implementa property-specific eligibility.
19. Implementa verified critical deadlines.
20. Implementa inspection/appraisal/title/insurance workflows.
21. Solo lender source crea clear-to-close.
22. Exige evidence para closed_verified.
23. Implementa post-closing handoffs.
24. Implementa Partner Capability/Health/SLA.
25. Implementa webhook/polling.
26. Implementa automation risk levels.
27. Limita IA.
28. Implementa Fair Matching Control.
29. Implementa Compliance Findings.
30. Implementa compensation transparency.
31. Implementa Admin/Queues.
32. Implementa MFA/RBAC/ABAC.
33. Implementa sensitive-data isolation.
34. Implementa Export Governance.
35. Implementa immutable Audit.
36. Implementa Observability/Alerts.
37. Implementa Analytics + Metric Governance.
38. Implementa Migration/Portability.
39. Implementa Continuity/Recovery.
40. Ejecuta todos los E2E tests.
41. No marques el módulo listo si SG puede emitir approval/preapproval.
42. No marques el módulo listo si credit data puede obtenerse sin consent.
43. No marques el módulo listo si stale program/lender overlays pueden routearse.
44. No marques el módulo listo si clear-to-close/closing pueden marcarse sin source.
45. No marques el módulo listo si sensitive data aparece en logs/analytics.

### Verificación final para entrega

- ¿Household, borrower y program-income definitions están separados?
- ¿Affordability, eligibility y lender underwriting son conceptos distintos?
- ¿Conventional/FHA/VA/USDA/state/local rules están versionados?
- ¿DPA explica repayment/forgiveness?
- ¿Lender overlays están current?
- ¿Preapproval viene del lender?
- ¿Property eligibility usa current address rules?
- ¿Contract deadlines son verificadas?
- ¿Inspection/appraisal/title/insurance preservan role boundaries?
- ¿Clear-to-close viene del lender?
- ¿Closing verified requiere evidence?
- ¿Wire-fraud control está activo?
- ¿AI usa current verified program data?
- ¿Fair matching evita uso indebido de protected attributes?
- ¿Sensitive data está protegida?
- ¿Business Continuity evita duplicate external actions?
- ¿Los ocho escenarios E2E pasan?

# Estado Final del Módulo 36

```text
MÓDULO 36:
HOME BUYING ASSISTANCE NATIONWIDE

PARTES:
1. Homebuyer Intake, Household, Purchase Goal y Readiness
2. Income, Employment, Assets, Debts, Credit, Affordability y DTI
3. Mortgage / Assistance Program Registry
4. Matching, Lender Routing, Preapproval, Property Eligibility y Purchase Readiness
5. Client Portal, Inspection, Appraisal, Title, Insurance, Closing y Post-Closing
6. Partners, Automation, AI, Compliance, Security, Analytics y Cierre

SECCIONES:
4596–4985

ESTADO:
MODULE COMPLETE
```

