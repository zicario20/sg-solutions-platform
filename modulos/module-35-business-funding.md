# SG Solutions Platform — Módulo 35: Business Funding

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 35. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus seis partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, Funding Intake, Funding Profile, uso de fondos, fundability, readiness y evaluación inicial | 4206–4270 | **COMPLETE** |
| 2 | Financial profile, cash flow, revenue, expenses, debt, DSCR, documentos financieros y underwriting readiness | 4271–4335 | **COMPLETE** |
| 3 | Funding Product Registry, SBA, microloans, LOC, term loans, equipment, cards y programas alternativos | 4336–4400 | **COMPLETE** |
| 4 | Matching, lender/partner eligibility, packaging, referrals, applications, tracking, decisions y offers | 4401–4465 | **COMPLETE** |
| 5 | Client portal, comparisons, recommendations, consent, disclosures, commissions, follow-up y funding lifecycle | 4466–4530 | **COMPLETE** |
| 6 | Partners, automation, AI, compliance, security, admin, analytics, migration, continuity, E2E y cierre | 4531–4595 | **COMPLETE** |

**Estado global del Módulo 35:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Funding Intake, Funding Profile, Uso de Fondos, Fundability, Readiness y Evaluación Inicial

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 34 — Business Compliance  
**Secciones incluidas:** 4206–4270  
**Audiencia:** Owner, Codex, funding specialists, financial analysts, reviewers, partner managers, compliance, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Business Funding preparation, education, readiness analysis, document packaging, product comparison y referrals; sin garantías de aprobación, tasas, montos o términos

---

## 4206. Objetivo del Módulo 35

El Módulo 35 permitirá a SG Solutions ayudar a pequeñas empresas a:

- entender su funding readiness;
- organizar información financiera;
- identificar gaps;
- preparar documentación;
- evaluar productos potenciales;
- comparar opciones;
- conectarse con lenders/providers/partners;
- rastrear aplicaciones;
- analizar decisiones y offers;
- mantener historial de funding.

SG Solutions no deberá presentarse automáticamente como lender.

---

## 4207. Principio central

```text
Business profile
→ funding need
→ financial profile
→ readiness
→ eligibility screening
→ product matching
→ document package
→ client consent
→ lender/referral/application
→ decision
→ offer comparison
→ client choice
```

Nunca:

```text
basic intake
→ guaranteed approval
```

---

## 4208. Business Funding Role Boundary

La plataforma deberá distinguir:

```text
education
readiness_analysis
document_preparation
application_assistance
marketplace_referral
partner_coordination
lender_direct_service_future
```

Cada producto deberá declarar el rol real de SG Solutions.

---

## 4209. No Approval Guarantee

La UI, IA, emails, SMS, scripts y dashboards no deberán afirmar:

```text
guaranteed approval
guaranteed funding
guaranteed rate
guaranteed limit
guaranteed SBA approval
guaranteed lender match
```

Podrá comunicarse:

```text
potential fit
likely requirement
readiness
preliminary match
partner availability
```

---

## 4210. Reutilización obligatoria

El módulo deberá reutilizar:

- Clients;
- Organizations;
- Persons;
- Service Catalog;
- Service Orders;
- Case Files;
- Documents;
- Tasks;
- Approvals;
- Marketplace;
- Partners;
- Billing;
- Messaging;
- Appointments;
- Forms;
- AI Hub;
- Audit;
- Analytics;
- Módulo 31 Bookkeeping;
- Módulo 32 Business Formation;
- Módulo 33 EIN;
- Módulo 34 Compliance;
- Módulo 30 Tax.

---

## 4211. Business Funding Service Catalog

Tipos iniciales:

```text
funding_readiness_assessment
business_funding_preparation
business_credit_readiness
loan_document_preparation
lender_matching
sba_preparation
microloan_preparation
line_of_credit_preparation
term_loan_preparation
equipment_financing_preparation
business_card_readiness
funding_referral
custom_funding_service
```

---

## 4212. Delivery Model

Cada servicio deberá usar:

```text
sg_advisory_preparation
sg_managed_with_partner
marketplace_referral
education_only
client_self_apply
future_direct_integration
```

---

## 4213. Funding Engagement

Campos:

```text
id
clientId
organizationId
serviceOrderId
serviceType
deliveryModel
assignedFundingSpecialistId
assignedReviewerId
status
openedAt
completedAt
createdAt
updatedAt
```

---

## 4214. Funding Case

Campos:

```text
id
caseNumber
engagementId
organizationId
fundingProfileId
requestedAmount
fundingPurpose
status
priority
assignedTo
reviewerId
createdAt
updatedAt
completedAt
```

---

## 4215. Funding Case Status

```text
draft
intake_pending
profile_review
documents_pending
financial_review
readiness_review
client_action_required
product_matching
package_preparation
ready_for_referral
referred
application_in_progress
offers_available
decision_pending
funded
declined
paused
cancelled
completed
archived
```

---

## 4216. Funding Intake

El intake deberá recopilar:

```text
Business Identity
Ownership
Business History
Funding Need
Use of Funds
Requested Amount
Timing
Revenue
Cash Flow
Existing Debt
Banking
Credit Context
Documents
Collateral Context
Preferences
Consent
```

---

## 4217. Intake Progressive Disclosure

El sistema no deberá pedir todos los campos posibles al inicio.

Pipeline:

```text
basic need
→ business identity
→ preliminary readiness
→ relevant product path
→ deeper financial questions
```

Esto reduce fricción.

---

## 4218. Intake Source

Cada dato deberá conservar:

```text
value
sourceType
sourceReference
clientConfirmed
verifiedByStaff
verifiedAt
```

Sources:

```text
business_formation
ein
bookkeeping
tax
compliance
client_input
uploaded_document
banking_data_future
partner_import
staff_entry
```

---

## 4219. Funding Profile

Campos:

```text
id
organizationId
profileVersion
businessIdentity
ownershipSummary
businessAge
industry
businessLocations
revenueSummary
cashFlowSummary
debtSummary
bankingSummary
creditContext
complianceSummary
fundingNeed
status
createdAt
updatedAt
```

---

## 4220. Funding Profile Versioning

Cambios materiales deberán crear nueva versión.

Ejemplos:

- requested amount;
- revenue;
- debt;
- ownership;
- industry;
- time in business;
- bank account;
- funding purpose;
- compliance status.

---

## 4221. Business Identity Readiness

La plataforma deberá evaluar:

```text
legal_entity_confirmed
EIN_verified
business_address_confirmed
ownership_confirmed
registered_agent_status
compliance_status
banking_status
bookkeeping_status
```

No todos serán obligatorios para todos los productos.

---

## 4222. Identity Readiness Status

```text
complete
mostly_complete
incomplete
conflict
verification_required
not_applicable
```

---

## 4223. Organization Age

Deberá distinguir:

```text
formationDate
effectiveDate
businessStartDate
firstRevenueDate
timeInBusiness
```

No deberán tratarse como equivalentes.

---

## 4224. Time in Business

El valor deberá calcularse desde la fecha relevante definida por el producto/lender.

Campos:

```text
basisDateType
basisDate
asOfDate
monthsInBusiness
source
```

---

## 4225. Industry Profile

Campos:

```text
industryCategory
businessActivity
naicsCodeOptional
regulatedIndustryFlags
seasonality
source
reviewStatus
```

---

## 4226. Industry Risk Context

La plataforma podrá mostrar:

```text
commonly_supported
product_dependent
restricted_by_some_providers
special_review
unknown
```

No deberá afirmar que un industry está prohibido universalmente sin current provider rules.

---

## 4227. Ownership Profile

Campos:

```text
ownerId
ownershipPercentage
ownershipType
controlRole
citizenshipOrResidencyContextWhenRequired
source
verificationStatus
```

Solo deberán recopilarse atributos sensibles si un producto concreto los requiere y el uso está permitido.

---

## 4228. Ownership Consistency

El módulo deberá comparar:

```text
Organization ownership
vs
Formation records
vs
Tax records
vs
Funding intake
```

Conflictos deberán generar finding.

---

## 4229. Funding Need

Campos:

```text
requestedAmount
minimumUsefulAmount
idealAmount
maximumDesiredAmount
currency
timingNeed
urgency
fundingPurpose
secondaryPurposes
```

---

## 4230. Requested Amount

El sistema deberá separar:

```text
requestedAmount
eligibleEstimate
matchedProductRange
offeredAmount
fundedAmount
```

Nunca deberán confundirse.

---

## 4231. Funding Purpose

Tipos iniciales:

```text
working_capital
equipment
vehicle
inventory
payroll
expansion
marketing
real_estate_business_use
refinance_business_debt
startup_costs
acquisition
construction
emergency_cash_flow
other
```

---

## 4232. Purpose Detail

Campos:

```text
purposeCode
description
amountAllocated
timing
vendorOrAssetReference
supportingDocumentIds
clientConfirmed
```

---

## 4233. Multiple Uses of Funds

Una solicitud podrá dividirse:

```text
$20,000 total
→ $10,000 equipment
→ $6,000 inventory
→ $4,000 working capital
```

El total deberá reconciliar.

---

## 4234. Use-of-Funds Validation

Validaciones:

```text
sum allocations <= requested amount
purpose supported by product
no prohibited use detected
evidence when required
client confirmation
```

---

## 4235. Funding Timing

Valores:

```text
immediate
within_7_days
within_30_days
within_90_days
planning_3_to_6_months
future_planning
```

Deberá influir en matching, no en promesas de funding speed.

---

## 4236. Urgency Boundary

Una necesidad urgente no deberá justificar:

- bypass de disclosures;
- false approval claims;
- unsuitable product;
- hidden fees;
- unauthorized data sharing.

---

## 4237. Preliminary Business Readiness

La evaluación inicial podrá medir:

```text
business_identity
financial_records
banking
tax_records
compliance
credit_context
funding_purpose_clarity
document_availability
```

---

## 4238. Readiness Dimension

Campos:

```text
dimensionCode
status
scoreOptional
reason
sourceReferences
missingItems
recommendedActions
```

---

## 4239. Readiness Status

```text
ready
mostly_ready
needs_work
blocked
not_evaluated
not_applicable
```

---

## 4240. Readiness versus Eligibility

La plataforma deberá separar:

```text
readiness
```

de:

```text
eligibility
```

Readiness indica qué tan preparado está el expediente.

Eligibility depende de reglas específicas del producto/lender.

---

## 4241. Fundability Concept

`Fundability` deberá significar una evaluación interna de preparación y factores relevantes.

No deberá significar:

```text
approval probability guaranteed
creditworthiness certification
lender commitment
```

---

## 4242. Fundability Dimensions

Ejemplos:

```text
entity_foundation
business_identity
banking_history
revenue_history
cash_flow
debt_load
credit_context
bookkeeping_quality
tax_documentation
compliance
time_in_business
collateral_context
```

---

## 4243. Fundability Assessment

Campos:

```text
id
organizationId
fundingCaseId
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

## 4244. Fundability Bands

```text
foundation_incomplete
early_stage
developing
application_ready_for_selected_products
stronger_profile
manual_review_required
```

No deberán mostrarse como score crediticio oficial.

---

## 4245. No Single Universal Fundability Score

La plataforma deberá evitar un número único que sugiera precisión falsa.

Si existe score interno deberá:

- documentar metodología;
- mostrar dimensiones;
- no presentarlo como lender score;
- versionarse;
- calibrarse.

---

## 4246. Blocking Factors

Ejemplos:

```text
identity_conflict
missing_ein
unverified_ownership
missing_business_bank_account
insufficient_financial_records
unresolved_tax_document_gap
compliance_issue
unsupported_use_of_funds
missing_required_document
product_specific_blocker
```

---

## 4247. Improvement Opportunity

Campos:

```text
id
fundingCaseId
category
description
priority
estimatedEffort
destinationModule
actionType
status
```

---

## 4248. Improvement Categories

```text
business_identity
banking
bookkeeping
revenue_documentation
tax_documents
debt_management
credit_profile
compliance
business_plan
collateral_documentation
funding_purpose
```

---

## 4249. Cross-Module Improvement Handoff

Ejemplos:

```text
missing bookkeeping
→ Módulo 31

formation inconsistency
→ Módulo 32

EIN issue
→ Módulo 33

compliance issue
→ Módulo 34

tax documents
→ Módulo 30
```

---

## 4250. Funding Readiness Checklist

Checklist podrá incluir:

```text
formation_docs
EIN
ownership
business_address
business_bank_account
bank_statements
P&L
balance_sheet
tax_returns
debt_schedule
use_of_funds
business_plan_when_needed
licenses_when_relevant
good_standing_when_relevant
identity_documents
```

La obligatoriedad deberá depender del producto.

---

## 4251. Checklist Requirement Status

```text
required_now
required_for_selected_product
conditional
recommended
optional
not_applicable
```

---

## 4252. Document Inventory

Campos:

```text
documentType
documentId
period
source
verificationStatus
freshnessStatus
productApplicability
```

---

## 4253. Document Freshness

Estados:

```text
current
aging
stale
unknown
not_applicable
```

Freshness rules deberán ser configurables por producto.

---

## 4254. Funding Profile Finding

Tipos:

```text
missing_data
conflicting_data
stale_document
ownership_mismatch
revenue_mismatch
debt_mismatch
banking_mismatch
compliance_issue
unsupported_purpose
identity_issue
```

---

## 4255. Finding Record

Campos:

```text
id
fundingCaseId
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

## 4256. Finding Status

```text
open
under_review
client_action_required
resolved
accepted_with_documented_reason
not_applicable
```

---

## 4257. Client Action Request

Podrá solicitar:

- missing statement;
- ownership confirmation;
- bank account information;
- explanation of debt;
- use-of-funds breakdown;
- tax document;
- license;
- business plan;
- invoice/quote.

Cada request deberá ser específico.

---

## 4258. Funding Preference Profile

Campos:

```text
preferredAmount
minimumAmount
maximumAcceptablePayment
preferredTerm
speedPriority
costPriority
fixedOrVariablePreference
collateralPreference
personalGuaranteePreference
productPreferences
excludedProductTypes
```

Estas preferencias son filtros, no requisitos del lender.

---

## 4259. Cost Sensitivity

El cliente podrá indicar:

```text
lowest_cost_priority
balanced
speed_priority
flexibility_priority
unknown
```

Esto ayudará a ordenar opciones.

---

## 4260. Collateral Context

Campos:

```text
hasCollateral
collateralTypes
estimatedValues
ownershipStatus
existingLiens
documentsAvailable
```

No deberá asignarse valor final sin evidencia/appraisal apropiado.

---

## 4261. Personal Guarantee Context

El intake podrá registrar:

```text
willing
not_preferred
not_willing
unknown
```

El sistema deberá explicar que los requisitos dependen del producto/lender.

---

## 4262. Credit Context Boundary

La plataforma podrá recopilar:

- self-reported range;
- consented credit data;
- business credit indicators;
- adverse-factor context.

No deberá fabricar scores ni afirmar aprobación solo por un score.

---

## 4263. Credit Data Consent

Antes de obtener datos crediticios externos deberá existir:

```text
consentId
purpose
provider
dataScope
authorizedAt
expiresAt
status
```

---

## 4264. Preliminary Funding Path

Después del intake podrá clasificarse:

```text
needs_foundation_work
needs_financial_documents
ready_for_product_screening
ready_for_selected_referrals
professional_review_required
```

---

## 4265. Funding Readiness Summary

El cliente deberá ver:

- what is complete;
- what is missing;
- what may block some products;
- recommended next steps;
- what SG Solutions can help prepare.

No deberá mostrar "approved" antes de una lender decision.

---

## 4266. Internal Review

El funding specialist deberá revisar:

- identity;
- funding need;
- purpose;
- time in business;
- ownership;
- banking;
- financial-document status;
- compliance;
- blockers;
- preferences.

---

## 4267. Review Record

Campos:

```text
id
fundingCaseId
fundingProfileVersion
assessmentVersion
reviewerId
findings
decision
reviewedAt
```

Decision:

```text
continue
client_action_required
cross_module_remediation
ready_for_financial_analysis
stop
professional_review_required
```

---

## 4268. Permissions, APIs, Events and Workflows

### Permisos

```text
funding.case.read
funding.case.create
funding.case.manage

funding.profile.read
funding.profile.manage
funding.profile.review

funding.readiness.read
funding.readiness.evaluate

funding.finding.read
funding.finding.manage

funding.credit_context.read
funding.credit_consent.manage
```

### APIs

```text
POST /api/funding/cases
GET  /api/funding/cases/{id}

POST /api/funding/cases/{id}/intake
POST /api/funding/cases/{id}/profiles
POST /api/funding/cases/{id}/readiness-assessments
POST /api/funding/cases/{id}/fundability-assessments

GET  /api/funding/cases/{id}/checklist
POST /api/funding/cases/{id}/findings
POST /api/funding/cases/{id}/client-actions
POST /api/funding/cases/{id}/reviews
```

### Eventos

```text
FundingCaseCreated
FundingIntakeCompleted
FundingProfileCreated
FundingProfileChanged
FundingReadinessEvaluated
FundabilityAssessmentCreated
FundingBlockerDetected
FundingImprovementOpportunityCreated
FundingClientActionRequested
FundingCrossModuleHandoffCreated
FundingProfileReviewed
FundingCaseReadyForFinancialAnalysis
```

### Workflows

```text
Funding Intake Workflow
Funding Profile Workflow
Funding Readiness Workflow
Fundability Assessment Workflow
Funding Finding Workflow
Funding Improvement Workflow
Funding Client Action Workflow
Funding Review Workflow
```

---

## 4269. Pruebas de Parte 1

Pruebas obligatorias:

1. Crear Funding Case.
2. Crear Funding Engagement.
3. Reutilizar Organization data.
4. Reutilizar EIN status.
5. Reutilizar Compliance status.
6. Crear Funding Profile.
7. Versionar Funding Profile.
8. Crear identity-readiness result.
9. Separar formation/business-start dates.
10. Calcular time in business.
11. Crear industry profile.
12. Registrar ownership profile.
13. Detectar ownership mismatch.
14. Crear Funding Need.
15. Separar requested/eligible/offered/funded amount.
16. Crear multiple use-of-funds allocations.
17. Validar allocation total.
18. Registrar timing.
19. Crear readiness dimensions.
20. Separar readiness de eligibility.
21. Crear Fundability Assessment.
22. Mostrar band sin garantía.
23. Crear blocking factor.
24. Crear improvement opportunity.
25. Crear cross-module remediation handoff.
26. Crear Funding Readiness Checklist.
27. Diferenciar required/conditional/optional.
28. Crear Document Inventory.
29. Marcar document stale.
30. Crear Funding Finding.
31. Resolver finding.
32. Crear specific Client Action.
33. Crear Funding Preference Profile.
34. Registrar cost sensitivity.
35. Registrar collateral context.
36. Registrar PG preference.
37. Registrar credit context.
38. Bloquear external credit data sin consent.
39. Crear credit consent.
40. Crear preliminary funding path.
41. Crear Funding Readiness Summary.
42. Bloquear approval language.
43. Ejecutar Internal Review.
44. Crear Review Record.
45. Generar ready-for-financial-analysis.
46. Probar permissions.
47. Probar APIs.
48. Probar events/outbox.
49. Probar workflows.
50. Probar audit.
51. Probar tenant isolation.
52. Probar source lineage.
53. Probar document freshness.
54. Probar profile versioning.
55. Probar funding-purpose validation.
56. Probar unsupported purpose blocker.
57. Probar identity conflict.
58. Probar incomplete profile.
59. Probar professional-review state.
60. Probar bilingual UI labels.

## 4270. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Funding Service Catalog.
2. Exista Delivery Model.
3. Exista Funding Engagement.
4. Exista Funding Case.
5. Exista Funding Intake.
6. Intake use progressive disclosure.
7. Cada field tenga source.
8. Exista Funding Profile.
9. Exista profile versioning.
10. Exista Business Identity Readiness.
11. Fechas de negocio estén separadas.
12. Exista Time in Business.
13. Exista Industry Profile.
14. Exista Ownership Profile.
15. Exista ownership consistency check.
16. Exista Funding Need.
17. Requested/eligible/offered/funded estén separados.
18. Exista Funding Purpose.
19. Exista multi-purpose allocation.
20. Exista Use-of-Funds Validation.
21. Exista Funding Timing.
22. Urgency no permita bypass.
23. Exista Preliminary Readiness.
24. Existan Readiness Dimensions.
25. Readiness y eligibility estén separados.
26. Exista Fundability concept no garantista.
27. Existan Fundability Dimensions.
28. Exista Fundability Assessment.
29. Existan Bands.
30. No exista universal lender-like score engañoso.
31. Existan Blocking Factors.
32. Existan Improvement Opportunities.
33. Existan Cross-Module Handoffs.
34. Exista Funding Readiness Checklist.
35. Checklist sea product-dependent.
36. Exista Document Inventory.
37. Exista Document Freshness.
38. Existan Funding Findings.
39. Exista Client Action Request.
40. Exista Funding Preference Profile.
41. Exista Cost Sensitivity.
42. Exista Collateral Context.
43. Exista Personal Guarantee Context.
44. Exista Credit Context boundary.
45. Exista Credit Data Consent.
46. Exista Preliminary Funding Path.
47. Exista Funding Readiness Summary.
48. No exista approval guarantee.
49. Exista Internal Review.
50. Exista Review Record.
51. Existan permisos/APIs/events/workflows.
52. Toda evaluación tenga source.
53. Toda incertidumbre pueda quedar explícita.
54. Ningún product eligibility sea inferido todavía sin reglas de Parte 3.
55. Parte 1 termine lista para Financial Analysis en Parte 2.

### Instrucciones para Codex

1. Lee Módulos 30–34 para reutilizar data y handoffs.
2. Reutiliza Organizations.
3. Reutiliza Documents.
4. Reutiliza Tasks/Approvals.
5. Reutiliza Marketplace/Partners.
6. Reutiliza Audit.
7. Implementa Funding Case.
8. Implementa progressive Intake.
9. Conserva field source lineage.
10. Implementa Funding Profile versionado.
11. Separa todas las fechas del negocio.
12. Implementa identity readiness.
13. Implementa time-in-business derivation.
14. Implementa Industry Profile.
15. Implementa Ownership Profile.
16. Implementa ownership consistency.
17. Implementa Funding Need.
18. Separa requested/eligible/offered/funded.
19. Implementa Use-of-Funds allocations.
20. Implementa purpose validation.
21. Implementa timing/urgency.
22. Nunca permitas urgency bypass.
23. Implementa Readiness Dimensions.
24. Separa Readiness de Eligibility.
25. Implementa Fundability Assessment explicable.
26. No presentes score interno como lender score.
27. Implementa Blocking Factors.
28. Implementa Improvement Opportunities.
29. Implementa cross-module remediation.
30. Implementa dynamic Funding Checklist.
31. Implementa Document Inventory/Freshness.
32. Implementa Findings.
33. Implementa Client Actions.
34. Implementa Funding Preferences.
35. Implementa collateral/PG context.
36. Implementa Credit Context.
37. No obtengas credit data sin consent.
38. Implementa Preliminary Funding Path.
39. Implementa Readiness Summary.
40. Prohíbe approval/rate/amount guarantees.
41. Implementa Internal Review.
42. Implementa permissions/APIs/events/workflows.
43. Implementa immutable audit.
44. No marques Parte 1 completa si Funding Profile puede perder source lineage.

### Verificación final de Parte 1

- ¿El módulo distingue preparación/referral de lending?
- ¿Funding need y use of funds están claros?
- ¿Requested amount no se confunde con offer?
- ¿Readiness y eligibility están separados?
- ¿Fundability no se presenta como garantía?
- ¿Los blockers son explicables?
- ¿Los documentos tienen freshness?
- ¿Credit data requiere consent?
- ¿Cross-module remediation reutiliza módulos existentes?
- ¿La UI evita promesas de aprobación?
- ¿Toda evaluación puede rastrearse a sus sources?
- ¿Toda acción queda auditada?

---

# Parte 2 — Financial Profile, Cash Flow, Revenue, Expenses, Debt, DSCR, Documentos Financieros y Underwriting Readiness

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 35 — Parte 1  
**Secciones incluidas:** 4271–4335  
**Audiencia:** Owner, Codex, funding specialists, financial analysts, bookkeepers, tax preparers, reviewers, partner managers y compliance  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Análisis financiero explicable y source-backed para preparar un expediente de funding, sin sustituir underwriting del lender ni prometer aprobación

## 4271. Objetivo de Parte 2

Esta parte convierte el Funding Profile inicial en un expediente financiero estructurado.

Deberá cubrir:

- revenue;
- expenses;
- gross profit;
- operating profit;
- net income;
- cash flow;
- bank activity;
- debt obligations;
- debt service;
- DSCR;
- liquidity;
- owner contributions/draws;
- tax returns;
- P&L;
- balance sheet;
- cash-flow statement cuando exista;
- debt schedule;
- document reconciliation;
- underwriting readiness.

## 4272. Financial Analysis Principle

```text
source documents
→ normalize
→ reconcile
→ calculate
→ explain
→ review
→ underwriting readiness
```

Nunca:

```text
self-reported revenue
→ treat as verified revenue
```

## 4273. Financial Profile

Campos:

```text
id
organizationId
fundingCaseId
profileVersion
periodStart
periodEnd
accountingBasis
currency
revenue
expenses
grossProfit
operatingIncome
netIncome
cashFlowSummary
debtSummary
liquiditySummary
sourceReferences
verificationStatus
createdAt
```

## 4274. Financial Profile Versioning

Toda modificación material deberá crear una nueva versión.

Cambios materiales:

- revenue period;
- tax return;
- bank statements;
- debt balances;
- P&L;
- owner contribution;
- major expense correction;
- new loan;
- reconciliation change.

## 4275. Financial Data Sources

Prioridad conceptual:

```text
verified bookkeeping
tax return
bank statements
processor statements
accounting export
lender statement
client document
client self-report
```

La prioridad real dependerá del metric.

## 4276. Source Confidence

Estados:

```text
verified_system
verified_document
reconciled
client_reported
estimated
conflicting
unknown
```

## 4277. Reporting Periods

Deberá soportar:

```text
current_month
year_to_date
trailing_3_months
trailing_6_months
trailing_12_months
prior_year
prior_2_years
custom_period
```

## 4278. Period Comparability

Comparaciones deberán usar períodos consistentes.

Ejemplo:

```text
Jan–Jun 2026
vs
Jan–Jun 2025
```

cuando se compare crecimiento YTD.

## 4279. Revenue Record

Campos:

```text
period
grossRevenue
netRevenue
revenueSource
verificationStatus
sourceDocumentIds
adjustments
```

## 4280. Revenue Reconciliation

El sistema deberá poder comparar:

```text
P&L revenue
vs
bank deposits
vs
tax return revenue
vs
processor sales
```

Las diferencias deberán explicarse, no ocultarse.

## 4281. Revenue Variance Finding

Campos:

```text
period
sourceA
sourceB
amountDifference
percentageDifference
explanation
status
```

## 4282. Revenue Trend

Podrá medir:

```text
month_over_month
quarter_over_quarter
year_over_year
trailing_average
seasonality
```

No deberá extrapolar sin indicar assumptions.

## 4283. Revenue Stability

Bands:

```text
stable
moderately_variable
highly_variable
seasonal
insufficient_history
```

La metodología deberá ser documentada.

## 4284. Expense Profile

Categorías:

```text
cost_of_goods
payroll
rent
utilities
insurance
marketing
vehicle
professional_services
software
taxes
interest
depreciation
other_operating
owner_related_review
```

## 4285. Expense Source

Cada amount deberá conservar:

```text
source
period
classification
verificationStatus
adjustmentReference
```

## 4286. Expense Normalization

El análisis podrá separar:

```text
recurring_operating_expense
one_time_expense
non_cash_expense
owner_discretionary_item
unverified_adjustment
```

Ajustes deberán ser transparentes.

## 4287. Add-Back Boundary

Los add-backs no deberán aplicarse automáticamente como hechos.

Cada uno requiere:

```text
type
amount
period
reason
source
reviewStatus
lenderAcceptanceUnknown = true
```

## 4288. Gross Profit

Cuando aplique:

```text
grossProfit = netRevenue - costOfGoodsSold
```

Deberá conservar source y period.

## 4289. Gross Margin

Cuando sea meaningful:

```text
grossMargin = grossProfit / netRevenue
```

Debe manejar división por cero y data incompleta.

## 4290. Operating Income

Campos:

```text
grossProfit
operatingExpenses
operatingIncome
adjustments
period
source
```

## 4291. Net Income

Deberá distinguir:

```text
bookNetIncome
taxNetIncome
normalizedNetIncome
```

No deberán usarse como equivalentes sin reconciliation.

## 4292. Cash Flow Profile

Campos:

```text
cashInflows
cashOutflows
netOperatingCashFlow
debtPayments
ownerContributions
ownerDistributions
endingLiquidity
period
source
```

## 4293. Cash Flow Source Hierarchy

Podrá usar:

- bookkeeping cash flow;
- bank transaction analysis;
- accounting statements;
- client-provided schedule.

La source deberá ser visible.

## 4294. Bank Statement Profile

Por account:

```text
accountId
institution
accountType
statementPeriod
beginningBalance
endingBalance
totalCredits
totalDebits
averageBalance
negativeDays
nsfCount
sourceDocumentId
verificationStatus
```

## 4295. Average Daily Balance

Si existe transaction-level data podrá calcularse exactamente.

Si solo existe statement summary, deberá marcarse:

```text
statement_based_estimate
```

cuando corresponda.

## 4296. Deposit Analysis

Deberá distinguir:

```text
business_revenue_deposit
transfer
owner_contribution
loan_proceeds
refund
other_inflow
unknown
```

Transfers y loan proceeds no deberán contarse automáticamente como revenue.

## 4297. Negative Balance / NSF Signals

Campos:

```text
negativeBalanceDays
nsfEvents
returnedPayments
overdraftEvents
period
source
```

Estos son data points, no lender decisions.

## 4298. Liquidity Profile

Campos:

```text
cashBalance
averageBankBalance
currentAssets
currentLiabilities
availableCredit
restrictedCash
liquidityDate
source
```

## 4299. Current Ratio

Cuando haya balance sheet suficientemente confiable:

```text
currentRatio = currentAssets / currentLiabilities
```

El sistema deberá indicar si el ratio es unavailable por data incompleta.

## 4300. Debt Schedule

Cada liability:

```text
creditor
debtType
originalAmount
currentBalance
monthlyPayment
interestRate
maturityDate
securedFlag
collateralReference
personalGuaranteeFlag
source
verificationStatus
```

## 4301. Debt Types

```text
term_loan
line_of_credit
business_credit_card
equipment_loan
vehicle_loan
merchant_cash_advance
factoring_obligation
mortgage_business
tax_debt
owner_related_debt
other
```

## 4302. Debt Reconciliation

Comparar:

```text
bookkeeping liabilities
vs
bank debits
vs
credit statements
vs
client debt schedule
vs
tax balance when relevant
```

## 4303. Debt Service

Campos:

```text
monthlyDebtService
annualDebtService
includedLiabilities
excludedLiabilities
calculationDate
sourceReferences
```

## 4304. Debt Service Inclusion Rules

La inclusión deberá depender del product/lender rule.

El core deberá conservar un `baseDebtService` y permitir overlays específicos de producto.

## 4305. DSCR Concept

DSCR deberá tratarse como métrica analítica, no como garantía de aprobación.

Conceptualmente:

```text
cashFlowAvailableForDebtService
/
debtService
```

La definición exacta de numerator/denominator podrá variar por lender/product.

## 4306. DSCR Calculation Record

Campos:

```text
id
fundingCaseId
methodologyCode
period
cashFlowAvailable
debtService
dscr
adjustments
sourceReferences
calculationVersion
reviewStatus
createdAt
```

## 4307. DSCR Methodology Registry

Ejemplos:

```text
internal_standard
lender_specific
sba_related_when_current
custom_partner
```

Cada metodología deberá documentar:

- numerator;
- denominator;
- add-backs;
- exclusions;
- period;
- rounding.

## 4308. DSCR Data Quality

Estados:

```text
high_confidence
moderate_confidence
low_confidence
insufficient_data
conflicting_data
```

## 4309. DSCR Display Boundary

La UI podrá decir:

```text
"DSCR calculado bajo metodología X"
```

No:

```text
"Este DSCR garantiza aprobación"
```

## 4310. Debt-to-Revenue Context

Podrá calcularse:

```text
totalDebt / annualizedRevenue
```

cuando meaningful.

Deberá etiquetarse como internal analytical metric si no corresponde a una métrica oficial del lender.

## 4311. Payment Burden Context

Podrá mostrar:

```text
monthlyDebtPayments
/
averageMonthlyRevenue
```

con metodología y limitations.

## 4312. Tax Return Record

Campos:

```text
documentId
taxYear
returnType
entityTaxClassification
filingStatus
revenue
taxableIncome
netIncomeRelevant
verificationStatus
source
```

## 4313. Tax Return Types

Podrá soportar:

```text
Schedule_C_context
Form_1065_context
Form_1120_context
Form_1120S_context
other_supported_business_return
```

La extracción detallada deberá depender del módulo Tax/Document Intelligence.

## 4314. Tax Return Freshness

Estados:

```text
current_required_year
prior_year
older_history
extension_or_pending
missing
not_applicable
```

## 4315. P&L Record

Campos:

```text
documentId
periodStart
periodEnd
accountingBasis
revenue
cogs
grossProfit
operatingExpenses
operatingIncome
netIncome
verificationStatus
```

## 4316. Balance Sheet Record

Campos:

```text
documentId
asOfDate
cash
accountsReceivable
inventory
otherCurrentAssets
fixedAssets
totalAssets
currentLiabilities
longTermLiabilities
equity
verificationStatus
```

## 4317. Cash Flow Statement Record

Cuando exista:

```text
operatingCashFlow
investingCashFlow
financingCashFlow
netChangeInCash
period
verificationStatus
```

## 4318. Interim Financials

La plataforma deberá soportar:

```text
year_to_date_P&L
current_balance_sheet
recent_cash_flow
```

con freshness configurable por lender/product.

## 4319. Financial Statement Consistency

Validaciones:

```text
balance_sheet_balances
P&L_period_valid
cash_reconciles_when_possible
debt_schedule_matches_liabilities
revenue_matches_supporting_sources
```

## 4320. Balance Sheet Equation Check

Cuando data esté completa:

```text
assets = liabilities + equity
```

Diferencias deberán generar finding.

## 4321. Financial Document Finding

Tipos:

```text
missing_period
stale_statement
unbalanced_balance_sheet
revenue_conflict
debt_conflict
cash_conflict
tax_return_conflict
unverified_adjustment
missing_signature_when_required
other
```

## 4322. Financial Finding Severity

```text
informational
low
medium
high
blocking
```

## 4323. Financial Package

Contenido:

```text
fundingProfileVersion
financialProfileVersion
bankStatements
P&L
balanceSheet
taxReturns
debtSchedule
cashFlowAnalysis
DSCRRecords
findings
sourceIndex
createdAt
```

## 4324. Financial Package Versioning

Cada package deberá ser inmutable y tener:

```text
packageVersion
packageHash
createdAt
supersedesPackageId
```

## 4325. Underwriting Readiness

Dimensiones:

```text
identity_ready
financial_history_ready
revenue_supported
cash_flow_supported
debt_supported
tax_docs_ready
bank_docs_ready
financial_statements_ready
use_of_funds_ready
compliance_ready
```

## 4326. Underwriting Readiness Status

```text
not_ready
partially_ready
ready_for_selected_products
ready_for_matching
manual_review_required
```

## 4327. Underwriting Readiness Finding

Ejemplos:

```text
insufficient_history
missing_tax_return
missing_bank_statements
unreconciled_revenue
high_debt_burden_context
missing_balance_sheet
stale_interim_financials
```

## 4328. Underwriting Readiness Summary

El cliente deberá ver:

- financial documents complete;
- missing documents;
- mismatches;
- major analytical factors;
- next actions.

No deberá recibir una lender decision simulada.

## 4329. Analyst Review

El analyst deberá revisar:

- periods;
- source confidence;
- revenue reconciliation;
- expenses;
- add-backs;
- debt schedule;
- DSCR methodology;
- tax returns;
- statements;
- findings.

## 4330. Analyst Review Record

Campos:

```text
id
fundingCaseId
financialProfileVersion
financialPackageId
reviewerId
reviewDecision
notes
findings
reviewedAt
```

Decision:

```text
needs_client_documents
needs_bookkeeping_cleanup
needs_tax_documents
ready_for_product_registry_screening
professional_review_required
stop
```

## 4331. Cross-Module Financial Handoffs

Ejemplos:

```text
unreconciled books → Módulo 31
missing tax return → Módulo 30
entity mismatch → Módulo 32
EIN mismatch → Módulo 33
compliance blocker → Módulo 34
```

## 4332. Permissions, APIs, Events and Workflows

### Permisos

```text
funding.financial_profile.read
funding.financial_profile.manage
funding.financial_profile.review

funding.bank_analysis.read
funding.debt_schedule.read
funding.debt_schedule.manage

funding.dscr.read
funding.dscr.calculate
funding.dscr.review

funding.financial_package.read
funding.financial_package.create

funding.underwriting_readiness.read
funding.underwriting_readiness.evaluate
```

### APIs

```text
POST /api/funding/cases/{id}/financial-profiles
POST /api/funding/cases/{id}/revenue-reconciliations
POST /api/funding/cases/{id}/bank-analysis
POST /api/funding/cases/{id}/debt-schedules

POST /api/funding/cases/{id}/dscr-calculations
GET  /api/funding/dscr-methodologies

POST /api/funding/cases/{id}/financial-packages
POST /api/funding/cases/{id}/underwriting-readiness
POST /api/funding/cases/{id}/financial-reviews
```

### Eventos

```text
FundingFinancialProfileCreated
FundingRevenueVarianceDetected
FundingBankAnalysisCompleted
FundingDebtScheduleCreated
FundingDSCRCalculated
FundingFinancialFindingCreated
FundingFinancialPackageCreated
FundingUnderwritingReadinessEvaluated
FundingFinancialReviewCompleted
FundingCaseReadyForProductScreening
```

### Workflows

```text
Funding Financial Profile Workflow
Revenue Reconciliation Workflow
Bank Analysis Workflow
Debt Schedule Workflow
DSCR Workflow
Financial Package Workflow
Underwriting Readiness Workflow
Financial Analyst Review Workflow
```

## 4333. Pruebas de Parte 2

Pruebas obligatorias:

1. Crear Financial Profile.
2. Versionar profile.
3. Registrar source confidence.
4. Crear TTM period.
5. Comparar YTD correctamente.
6. Registrar Revenue Record.
7. Reconciliar P&L vs bank deposits.
8. Excluir transfer de revenue.
9. Excluir loan proceeds de revenue.
10. Crear revenue variance.
11. Calcular revenue trend.
12. Clasificar revenue stability.
13. Crear Expense Profile.
14. Normalizar one-time expense.
15. Registrar add-back como review-required.
16. Calcular gross profit.
17. Calcular gross margin.
18. Calcular operating income.
19. Separar book/tax/normalized net income.
20. Crear Cash Flow Profile.
21. Crear Bank Statement Profile.
22. Calcular/estimar average balance con label correcto.
23. Registrar NSF/negative days.
24. Crear Liquidity Profile.
25. Calcular Current Ratio.
26. Crear Debt Schedule.
27. Reconciliar debt.
28. Calcular debt service.
29. Crear base vs lender-specific inclusion rule.
30. Calcular DSCR.
31. Versionar DSCR methodology.
32. Manejar debtService=0.
33. Crear DSCR confidence.
34. Evitar guarantee language.
35. Crear debt-to-revenue context.
36. Crear payment burden context.
37. Crear Tax Return Record.
38. Soportar multiple return types.
39. Marcar tax return freshness.
40. Crear P&L Record.
41. Crear Balance Sheet Record.
42. Crear Cash Flow Statement Record.
43. Crear interim financials.
44. Validar P&L period.
45. Validar balance-sheet equation.
46. Detectar debt conflict.
47. Crear Financial Finding.
48. Crear Financial Package.
49. Validar immutable package hash.
50. Evaluar Underwriting Readiness.
51. Crear missing-bank-statements finding.
52. Crear client-facing summary.
53. Ejecutar Analyst Review.
54. Crear cross-module bookkeeping handoff.
55. Crear cross-module tax handoff.
56. Probar permissions.
57. Probar APIs.
58. Probar events/outbox.
59. Probar workflows.
60. Probar audit/source lineage.

## 4334. Criterios de Aceptación de Parte 2

La Parte 2 estará completa cuando:

1. Exista Financial Profile.
2. Exista profile versioning.
3. Exista source confidence.
4. Existan reporting periods.
5. Exista period comparability.
6. Exista Revenue Record.
7. Exista Revenue Reconciliation.
8. Existan variance findings.
9. Exista trend analysis.
10. Exista stability context.
11. Exista Expense Profile.
12. Exista expense normalization.
13. Add-backs requieran transparency/review.
14. Exista Gross Profit.
15. Exista Gross Margin.
16. Exista Operating Income.
17. Net income variants estén separados.
18. Exista Cash Flow Profile.
19. Exista Bank Statement Profile.
20. Exista deposit classification.
21. Transfers/loan proceeds no se cuenten como revenue automáticamente.
22. Existan NSF/negative balance signals.
23. Exista Liquidity Profile.
24. Exista Current Ratio cuando data lo permita.
25. Exista Debt Schedule.
26. Exista Debt Reconciliation.
27. Exista Debt Service.
28. Existan product-specific inclusion overlays.
29. Exista DSCR concept.
30. Exista DSCR Calculation Record.
31. Exista Methodology Registry.
32. Exista DSCR Data Quality.
33. DSCR no implique approval.
34. Existan debt-to-revenue/payment-burden context.
35. Exista Tax Return Record.
36. Exista tax-return freshness.
37. Exista P&L Record.
38. Exista Balance Sheet Record.
39. Exista Cash Flow Statement support.
40. Existan Interim Financials.
41. Exista Financial Statement Consistency.
42. Exista balance-sheet equation check.
43. Existan Financial Findings.
44. Exista Financial Package.
45. Financial Package sea inmutable.
46. Exista Underwriting Readiness.
47. Existan readiness findings.
48. Exista client summary.
49. Exista Analyst Review.
50. Exista Analyst Review Record.
51. Existan cross-module financial handoffs.
52. Existan permisos/APIs/events/workflows.
53. Toda cifra material tenga period/source.
54. Toda ratio tenga methodology.
55. Parte 2 termine lista para Product Registry de Parte 3.

## 4335. Instrucciones para Codex y Cierre de Parte 2

1. Lee Parte 1 completa.
2. Reutiliza Módulo 31 para bookkeeping cuando exista.
3. Reutiliza Módulo 30 para tax documents.
4. No dupliques financial statements innecesariamente.
5. Implementa Financial Profile versionado.
6. Implementa source confidence.
7. Implementa consistent reporting periods.
8. Implementa Revenue Reconciliation.
9. Separa deposits de revenue.
10. No cuentes transfers como revenue.
11. No cuentes loan proceeds como revenue.
12. Implementa Expense Normalization.
13. Trata add-backs como adjustments revisables.
14. Implementa profit metrics.
15. Separa book/tax/normalized income.
16. Implementa Cash Flow Profile.
17. Implementa Bank Statement Profile.
18. Etiqueta estimates.
19. Implementa Liquidity.
20. Implementa Debt Schedule.
21. Implementa Debt Reconciliation.
22. Implementa base debt service.
23. Permite product-specific debt overlays.
24. Implementa DSCR Methodology Registry.
25. Nunca hardcodees un DSCR universal.
26. Implementa calculation trace.
27. Implementa DSCR confidence.
28. Prohíbe lender-approval language.
29. Implementa tax-return records.
30. Implementa P&L/Balance Sheet/Cash Flow records.
31. Implementa interim-financial freshness.
32. Implementa consistency checks.
33. Implementa Financial Findings.
34. Implementa immutable Financial Package.
35. Implementa Underwriting Readiness.
36. Implementa client summary.
37. Implementa Analyst Review.
38. Implementa cross-module cleanup handoffs.
39. Implementa permissions/APIs/events/workflows.
40. Implementa immutable audit.
41. No marques Parte 2 completa si un cálculo financiero material carece de period, source o methodology.

### Verificación final de Parte 2

- ¿Revenue distingue deposits, transfers y loan proceeds?
- ¿Los períodos son comparables?
- ¿Add-backs son transparentes?
- ¿Book, tax y normalized income están separados?
- ¿Debt schedule está reconciliado?
- ¿DSCR identifica su metodología?
- ¿Ratios manejan datos faltantes?
- ¿Tax returns y interim financials tienen freshness?
- ¿Balance Sheet puede validarse?
- ¿Financial Package es inmutable?
- ¿Underwriting Readiness no simula decisión del lender?
- ¿Los gaps pueden enviarse a Bookkeeping/Tax?
- ¿Toda cifra importante tiene source?
- ¿Toda acción queda auditada?

---

# Parte 3 — Funding Product Registry, SBA, Microloans, LOC, Term Loans, Equipment Financing, Business Cards y Programas Alternativos

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 35 — Parte 2  
**Secciones incluidas:** 4336–4400  
**Audiencia:** Owner, Codex, funding specialists, financial analysts, partner managers, compliance, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Catálogo versionado de productos y criterios de elegibilidad por lender/partner, con reglas explicables, comparación objetiva y separación estricta entre información del producto, screening preliminar y decisión real del financiador

## 4336. Objetivo de Parte 3

Esta parte define el catálogo estructurado de productos de financiamiento que alimentará:

- product education;
- preliminary screening;
- matching;
- document requirements;
- lender/provider routing;
- offer comparison;
- client recommendations.

El catálogo deberá soportar productos que cambian con el tiempo sin requerir reescribir la lógica central.

## 4337. Funding Product Registry

Campos:

```text
id
productCode
providerId
partnerId
productFamily
productName
displayName
description
deliveryModel
availabilityStatus
effectiveFrom
effectiveTo
productVersion
createdAt
updatedAt
```

## 4338. Product Families

Valores iniciales:

```text
sba_related
microloan
term_loan
line_of_credit
equipment_financing
vehicle_financing
business_credit_card
charge_card
secured_business_credit
revenue_based_financing
merchant_cash_advance
invoice_financing
factoring
purchase_order_financing
real_estate_business_financing
startup_financing
community_lender_program
grant_or_non_debt_program
other
```

## 4339. Product Availability Status

```text
draft
active
limited
paused
temporarily_unavailable
retired
partner_review_required
unknown
```

Solo productos `active` o explícitamente `limited` podrán participar en matching automático.

## 4340. Product Versioning

Cualquier cambio material deberá crear nueva versión:

- minimum/maximum amount;
- APR/rate structure;
- term;
- fees;
- collateral;
- guarantee requirements;
- credit thresholds;
- time-in-business;
- revenue requirements;
- jurisdiction;
- restricted industries;
- document requirements.

## 4341. Product Source Record

Campos:

```text
sourceType
provider
sourceReference
retrievedAt
verifiedAt
verifiedBy
effectiveDate
confidence
```

Preferencia:

```text
direct lender/provider data
→ official program source
→ contracted partner data
→ approved marketplace feed
→ verified staff research
```

## 4342. Product Freshness

Estados:

```text
current_verified
current_with_caveat
verification_due
stale
unknown
```

Un producto stale deberá bloquear matching material hasta review, según policy.

## 4343. Product Delivery Model

Valores:

```text
marketplace_referral
partner_application
client_self_apply
sg_preparation_only
sg_managed_referral
future_direct_application
education_only
```

## 4344. Provider Role Transparency

Para cada producto deberá mostrarse claramente:

- quién presta;
- quién procesa;
- quién recibe la aplicación;
- quién toma la decisión;
- quién cobra fees;
- cuál es el rol de SG Solutions.

## 4345. Product Amount Range

Campos:

```text
minimumAmount
maximumAmount
typicalRangeOptional
currency
amountSource
amountFreshness
```

`typicalRange` nunca deberá presentarse como cantidad garantizada.

## 4346. Product Term Structure

Campos:

```text
minimumTerm
maximumTerm
termUnit
amortizationType
renewableFlag
revolvingFlag
balloonPossible
source
```

## 4347. Product Pricing Structure

Tipos:

```text
fixed_interest
variable_interest
prime_or_index_based
factor_rate
flat_fee
discount_rate
fee_plus_interest
provider_specific
unknown
```

## 4348. Pricing Fields

Campos:

```text
rateMin
rateMax
rateIndex
rateSpread
factorRateRange
originationFee
annualFee
otherFees
pricingAsOf
source
```

La plataforma deberá soportar `unknown` en vez de inventar pricing.

## 4349. APR / Cost Boundary

Cuando APR esté disponible deberá mostrarse como dato del provider.

Cuando no esté:

- no deberá derivarse engañosamente;
- podrán mostrarse fees/rate structures;
- podrá existir cost estimate claramente etiquetado;
- lender disclosure oficial tendrá prioridad.

## 4350. Repayment Structure

Valores:

```text
monthly
biweekly
weekly
daily
percentage_of_sales
revolving_minimum_payment
custom
```

El frequency deberá ser visible para evitar comparaciones engañosas.

## 4351. Collateral Requirement

Estados:

```text
not_typically_required
may_be_required
required
asset_specific
provider_discretion
unknown
```

## 4352. Personal Guarantee Requirement

Estados:

```text
not_required
may_be_required
required_for_some_owners
typically_required
provider_discretion
unknown
```

La plataforma no deberá asumir PG universal sin source.

## 4353. Time-in-Business Rule

Campos:

```text
minimumMonths
preferredMonths
basisDateType
ruleType
source
effectiveDate
```

## 4354. Revenue Requirement

Campos:

```text
minimumMonthlyRevenue
minimumAnnualRevenue
minimumTrailingRevenue
periodDefinition
verificationMethod
source
```

No deberán convertirse self-reported figures en verified eligibility automáticamente.

## 4355. Credit Requirement Context

Campos:

```text
personalCreditRequired
businessCreditRequired
minimumScoreIfPublished
preferredScoreIfPublished
creditModel
hardPullPossible
softPullPossible
source
```

No deberá inventarse un threshold si el provider no lo publica.

## 4356. Ownership / Guarantor Rule

El producto podrá requerir reglas sobre:

```text
minimumOwnershipForGuaranty
requiredOwnersToGuarantee
controllingOwner
residentOrCitizenshipRuleWhenLegallyApplicable
otherOwnershipRequirement
```

Los atributos sensibles solo se recopilarán cuando sean necesarios.

## 4357. Geographic Eligibility

Campos:

```text
countries
states
territories
counties
serviceAreas
excludedAreas
remoteAvailability
```

## 4358. Industry Eligibility

Estructura:

```text
supportedIndustries
restrictedIndustries
prohibitedIndustries
specialReviewIndustries
NAICSRules
source
```

Las listas deberán ser provider-specific.

## 4359. Use-of-Funds Eligibility

Por producto:

```text
allowedPurposes
restrictedPurposes
prohibitedPurposes
specialReviewPurposes
```

Esto se comparará con el Funding Need de Parte 1.

## 4360. Document Requirement Set

Campos:

```text
productVersionId
documentType
requirementStatus
periodRequired
freshnessRule
conditionalRule
source
```

## 4361. Required Document Types

Ejemplos:

```text
formation_documents
EIN_confirmation
ownership_information
bank_statements
P&L
balance_sheet
tax_returns
debt_schedule
business_plan
use_of_funds
purchase_order
invoice
equipment_quote
lease
license
good_standing
identity
personal_financial_statement
other
```

## 4362. Product Eligibility Rule Engine

Cada producto deberá almacenar reglas estructuradas:

```text
ruleId
field
operator
thresholdOrValue
severity
hardOrSoft
source
effectiveDate
```

## 4363. Rule Types

```text
hard_eligibility
soft_preference
documentation
pricing_context
manual_review
disclosure
```

## 4364. Hard versus Soft Rule

`hard_eligibility`:
- failure may exclude the product under current provider rule.

`soft_preference`:
- product may still be possible.

La UI deberá diferenciar ambas.

## 4365. Unknown Data Handling

Si un dato requerido falta:

```text
unknown
```

No deberá convertirse en `fail`.

Resultado posible:

```text
needs_information
```

## 4366. Product Screening Result

Estados:

```text
potential_match
potential_match_with_conditions
needs_information
unlikely_match
not_eligible_under_current_rules
manual_review_required
product_unavailable
```

## 4367. Screening Explanation

Cada resultado deberá incluir:

```text
matchedRules
failedRules
unknownRules
softFactors
sourceReferences
productVersion
evaluatedAt
```

## 4368. No Final Underwriting Decision

El screening interno nunca deberá usar:

```text
approved
denied
```

como decisión final del lender.

Esos estados solo podrán provenir de un lender/provider decision en Parte 4.

## 4369. SBA-Related Product Family

La arquitectura deberá soportar programas respaldados o relacionados con SBA mediante configuraciones versionadas.

Podrá representar, según disponibilidad vigente:

```text
sba_7a_related
sba_504_related
sba_microloan_related
other_current_sba_program
```

Los requisitos exactos deberán provenir de current program/provider data.

## 4370. SBA Program Registry

Campos:

```text
programCode
officialProgramName
programType
administrator
lenderDeliveryModel
eligibleUses
ineligibleUses
programRulesVersion
sourceReferences
effectiveFrom
effectiveTo
status
```

## 4371. SBA Rule Layering

La evaluación deberá separar:

```text
program-level rules
+
lender-level rules
+
product-level overlays
```

Cumplir una regla SBA no significa cumplir la política de un lender.

## 4372. SBA Preparation Profile

Podrá incluir:

```text
businessSizeContext
forProfitStatus
operatingLocation
useOfFunds
ownership
managementExperience
equityInjectionContext
collateralContext
creditElsewhereContextWhenApplicable
financialHistory
```

Solo se utilizarán campos vigentes/relevantes.

## 4373. SBA Readiness Result

Estados:

```text
foundation_incomplete
needs_documents
potential_program_fit
lender_screening_ready
professional_review_required
currently_not_supported
```

No deberá decir `SBA approved`.

## 4374. SBA Document Package Readiness

Podrá requerir dinámicamente:

- business financials;
- tax returns;
- debt schedule;
- ownership;
- personal financial information when applicable;
- business plan;
- projections;
- purchase agreement;
- equipment/real-estate documents;
- other lender/program documents.

## 4375. Microloan Product Family

El registry deberá soportar microloan products de:

- community lenders;
- nonprofits;
- CDFI-like institutions;
- program intermediaries;
- banks/fintechs cuando corresponda.

Las reglas deberán ser provider-specific.

## 4376. Microloan Characteristics

Podrá almacenar:

```text
amountRange
term
pricing
trainingRequirement
technicalAssistance
geographicFocus
startupEligibility
collateralOrGuarantee
```

## 4377. Line of Credit Product Family

Deberá soportar:

```text
revolving_line_of_credit
non_revolving_line
secured_line
unsecured_line
bank_LOC
fintech_LOC
```

## 4378. LOC Fields

Campos:

```text
creditLimitRange
drawMinimum
drawFee
unusedLineFee
interestOnDrawnBalance
repaymentFrequency
renewalTerm
lineReviewFrequency
```

## 4379. Term Loan Product Family

Tipos:

```text
short_term
medium_term
long_term
secured_term
unsecured_term
bank_term
fintech_term
community_lender_term
```

## 4380. Term Loan Fields

```text
principalRange
termRange
amortization
paymentFrequency
rateStructure
originationFees
prepaymentTerms
collateral
guarantee
```

## 4381. Equipment Financing Product Family

Tipos:

```text
equipment_loan
equipment_lease
capital_lease_context
finance_lease_context
vendor_financing
```

La clasificación final deberá seguir términos del provider y accounting/legal requirements vigentes.

## 4382. Equipment Financing Fields

```text
equipmentType
newOrUsed
equipmentAgeLimit
purchasePrice
downPayment
advanceRate
term
residualOrBuyout
vendorRequirement
equipmentLien
```

## 4383. Vehicle Financing for Business

Podrá tratarse como subfamilia de equipment financing.

Campos adicionales:

```text
vehicleType
commercialUse
VINWhenAvailable
purchasePrice
mileage
vehicleAge
dealerOrPrivateParty
```

## 4384. Business Credit Card Family

Tipos:

```text
traditional_business_credit_card
secured_business_card
charge_card
corporate_card
revenue_underwritten_card
```

## 4385. Business Card Fields

```text
annualFee
introOffer
purchaseAPR
balanceTransferAPR
cashAdvanceAPR
rewardsStructure
foreignTransactionFee
employeeCardPolicy
personalGuaranteeRule
creditPullType
```

Todos deberán estar versionados/fresh.

## 4386. Business Card Approval Boundary

Preliminary screening podrá indicar:

```text
potential_fit
needs_information
unlikely_match
```

Nunca deberá presentar credit limit o approval como seguro.

## 4387. Revenue-Based Financing

Campos:

```text
advanceAmount
repaymentCap
percentageOfRevenue
expectedDuration
minimumRevenue
depositFrequency
pricingMethod
```

La UI deberá explicar el costo con claridad.

## 4388. Merchant Cash Advance

Si la plataforma muestra MCA:

- identificarlo claramente como categoría distinta de term loan;
- mostrar repayment mechanism;
- mostrar factor/cost disclosures disponibles;
- evitar describirlo engañosamente como low-cost loan;
- activar suitability/cost warnings.

## 4389. Invoice Financing

Campos:

```text
advanceRate
eligibleInvoiceAge
customerConcentrationRules
recourseType
feeStructure
verificationMethod
```

## 4390. Factoring

Campos:

```text
recourse
nonRecourseContext
advanceRate
discountFee
reserve
customerEligibility
noticeOfAssignment
contractTerm
```

## 4391. Purchase Order Financing

Podrá evaluar:

```text
verifiedPurchaseOrder
supplierCost
grossMargin
customerQuality
fulfillmentCycle
supplierPaymentNeed
```

## 4392. Startup Financing

El registry deberá distinguir productos que permiten:

```text
pre_revenue
less_than_6_months
less_than_12_months
```

de productos con minimum time-in-business.

No deberá asumir que startup = ineligible para todos.

## 4393. Community / Mission-Based Programs

Podrán incluir:

- community development lenders;
- nonprofit programs;
- local economic-development programs;
- minority/women/veteran-focused programs when legally appropriate;
- rural programs;
- local grants/non-debt support.

Criterios deberán provenir de fuentes actuales.

## 4394. Grants and Non-Debt Programs

Deberán separarse de loans.

Campos:

```text
awardType
applicationWindow
eligibility
competitiveFlag
matchingRequirement
restrictedUses
reportingRequirements
source
```

Nunca deberá prometerse award.

## 4395. Product Suitability Flags

Ejemplos:

```text
high_cost
frequent_payment
short_term
collateral_required
personal_guarantee
variable_rate
prepayment_cost
complex_fee_structure
requires_strong_documents
startup_friendly
seasonal_fit
```

## 4396. Product Risk / Disclosure Profile

Campos:

```text
productVersionId
riskFlags
requiredDisclosures
comparisonWarnings
professionalReviewFlags
clientAcknowledgmentRequired
```

## 4397. Product Comparison Normalization

Para comparar productos diferentes deberá normalizar, cuando sea posible:

```text
amount
estimatedPayment
paymentFrequency
term
rateOrFactor
knownFees
estimatedTotalCost
collateral
PG
fundingSpeedEstimate
```

Los estimates deberán estar etiquetados.

## 4398. Permissions, APIs, Events and Workflows

### Permisos

```text
funding.product.read
funding.product.manage
funding.product.publish
funding.product.verify

funding.product_rule.read
funding.product_rule.manage

funding.screening.read
funding.screening.run

funding.program.read
funding.program.manage
```

### APIs

```text
GET  /api/funding/products
POST /api/funding/products
POST /api/funding/products/{id}/versions
POST /api/funding/products/{id}/verify

GET  /api/funding/products/{id}/rules
POST /api/funding/products/{id}/rules

POST /api/funding/cases/{id}/product-screenings
GET  /api/funding/cases/{id}/product-screenings

GET  /api/funding/programs
POST /api/funding/programs
```

### Eventos

```text
FundingProductCreated
FundingProductVersionPublished
FundingProductVerified
FundingProductMarkedStale
FundingProductRuleChanged
FundingProductScreeningCompleted
FundingPotentialMatchFound
FundingProductExcludedByHardRule
FundingProductNeedsInformation
FundingProgramUpdated
```

### Workflows

```text
Funding Product Publication Workflow
Funding Product Verification Workflow
Funding Product Rule Workflow
Funding Product Screening Workflow
SBA Program Configuration Workflow
Product Freshness Workflow
```

## 4399. Pruebas de Parte 3

Pruebas obligatorias:

1. Crear Funding Product.
2. Versionar product.
3. Marcar product stale.
4. Bloquear stale product en matching.
5. Crear source record.
6. Crear delivery model.
7. Registrar amount range.
8. Registrar term.
9. Registrar pricing.
10. Registrar unknown pricing.
11. Registrar repayment frequency.
12. Registrar collateral rule.
13. Registrar PG rule.
14. Registrar time-in-business rule.
15. Registrar revenue rule.
16. Registrar credit rule.
17. Registrar ownership rule.
18. Registrar geography.
19. Registrar industry rules.
20. Registrar use-of-funds rules.
21. Crear dynamic document requirement.
22. Crear eligibility rule.
23. Diferenciar hard/soft.
24. Procesar missing data como needs_information.
25. Crear potential match.
26. Crear unlikely match.
27. Crear not-eligible-under-current-rules.
28. Explicar screening.
29. Bloquear lender-like approval language.
30. Crear SBA program record.
31. Aplicar program + lender layers.
32. Crear SBA readiness.
33. Crear SBA document readiness.
34. Crear microloan product.
35. Crear LOC product.
36. Crear term-loan product.
37. Crear equipment product.
38. Crear business-vehicle product.
39. Crear business-card product.
40. Bloquear guaranteed credit limit.
41. Crear revenue-based product.
42. Crear MCA disclosure flags.
43. Crear invoice-financing product.
44. Crear factoring product.
45. Crear PO-financing product.
46. Crear startup product.
47. Crear community program.
48. Crear grant/non-debt program.
49. Crear suitability flags.
50. Crear disclosure profile.
51. Normalizar comparison fields.
52. Etiquetar estimated total cost.
53. Probar source freshness.
54. Probar effective dates.
55. Probar provider-specific industry restriction.
56. Probar allowed/prohibited use.
57. Probar geography restriction.
58. Probar unknown credit threshold.
59. Probar permissions.
60. Probar APIs/events/workflows.

## 4400. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 3 estará completa cuando:

1. Exista Funding Product Registry.
2. Existan Product Families.
3. Exista availability status.
4. Exista product versioning.
5. Existan product sources.
6. Exista product freshness.
7. Exista delivery model.
8. Exista provider-role transparency.
9. Exista amount range.
10. Exista term structure.
11. Exista pricing structure.
12. Exista repayment structure.
13. Exista collateral rule.
14. Exista PG rule.
15. Exista time-in-business rule.
16. Exista revenue rule.
17. Exista credit context.
18. Exista ownership/guarantor rule.
19. Exista geographic eligibility.
20. Exista industry eligibility.
21. Exista use-of-funds eligibility.
22. Exista dynamic document requirement set.
23. Exista eligibility rule engine.
24. Hard y soft rules estén separadas.
25. Missing data produzca needs_information.
26. Exista Product Screening Result.
27. Exista Screening Explanation.
28. Screening no use approved/denied como lender decision.
29. Exista SBA-related family.
30. Exista SBA Program Registry.
31. Exista program/lender/product layering.
32. Exista SBA Readiness.
33. Exista SBA document readiness.
34. Exista Microloan family.
35. Exista LOC family.
36. Exista Term Loan family.
37. Exista Equipment family.
38. Exista business-vehicle support.
39. Exista Business Credit Card family.
40. Cards no prometan approval/limit.
41. Exista Revenue-Based Financing.
42. MCA tenga disclosure/suitability warnings.
43. Exista Invoice Financing.
44. Exista Factoring.
45. Exista Purchase Order Financing.
46. Exista Startup Financing.
47. Existan Community/Mission programs.
48. Grants estén separados de debt products.
49. Existan Product Suitability Flags.
50. Exista Product Risk/Disclosure Profile.
51. Exista normalized comparison schema.
52. Current facts estén versionados.
53. Unknown data nunca se invente.
54. Existan permisos/APIs/events/workflows.
55. Parte 3 termine lista para Matching/Applications de Parte 4.

### Instrucciones para Codex

1. Lee Partes 1 y 2 completas.
2. Implementa Funding Product Registry independiente del lender UI.
3. Versiona todos los términos materiales.
4. Implementa source/freshness.
5. No hardcodees product terms que cambian.
6. Implementa delivery model.
7. Implementa amount/term/pricing schemas.
8. Permite `unknown` explícito.
9. Implementa collateral/PG rules.
10. Implementa time-in-business/revenue/credit rules.
11. Implementa geography/industry/use-of-funds rules.
12. Implementa dynamic document requirements.
13. Implementa Eligibility Rule Engine.
14. Separa hard/soft/manual-review rules.
15. Missing data debe ser `needs_information`, no fail.
16. Implementa explainable screening.
17. Nunca uses screening como lender decision.
18. Implementa SBA program layer separado.
19. Aplica lender overlays.
20. No hardcodees requisitos SBA cambiantes.
21. Implementa microloan/LOC/term/equipment/card families.
22. Implementa alternative-finance families.
23. Implementa grant/non-debt separation.
24. Implementa suitability flags.
25. Implementa disclosure profiles.
26. Implementa normalized comparison.
27. Etiqueta estimates.
28. Implementa permissions/APIs/events/workflows.
29. Implementa immutable audit.
30. No marques Parte 3 completa si un producto puede entrar a matching sin current source/version.

### Verificación final de Parte 3

- ¿Cada product tiene version/source/freshness?
- ¿Hard y soft rules están separadas?
- ¿Unknown data permanece unknown?
- ¿Screening explica por qué hubo match o exclusion?
- ¿SBA program rules están separadas de lender overlays?
- ¿Products alternativos tienen disclosures apropiados?
- ¿Cards no prometen aprobación ni limit?
- ¿MCA no se presenta engañosamente como term loan?
- ¿Grants están separados de debt products?
- ¿Comparisons normalizan frequency/cost/term?
- ¿Toda rule material es trazable?
- ¿Toda acción queda auditada?

---

# Parte 4 — Matching, Lender/Partner Eligibility, Packaging, Referrals, Applications, Tracking, Decisions y Offers

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 35 — Parte 3  
**Secciones incluidas:** 4401–4465  
**Audiencia:** Owner, Codex, funding specialists, analysts, partner managers, compliance, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Matching explicable y versionado entre Funding Profile y products/lenders, con consent, minimum-necessary data sharing, application packaging, referral/application tracking y preservation de lender decisions/offers como datos externos verificables

## 4401. Objetivo de Parte 4

Esta parte define cómo la plataforma pasa de:

```text
Funding Profile
+
Financial Package
+
Product Registry
```

a:

```text
screening
→ ranked potential matches
→ lender/partner selection
→ application package
→ consent
→ referral/application
→ tracking
→ decision
→ offers
```

## 4402. Matching Principle

El matching deberá ser:

```text
rules-driven
source-backed
explainable
versioned
non-guaranteed
```

No deberá ser una promesa de aprobación.

## 4403. Matching Input Snapshot

Campos:

```text
id
fundingCaseId
fundingProfileVersion
financialProfileVersion
financialPackageId
readinessAssessmentId
productRegistryVersion
createdAt
```

## 4404. Matching Run

Campos:

```text
id
fundingCaseId
inputSnapshotId
matchingEngineVersion
startedAt
completedAt
productsEvaluated
matchesGenerated
status
```

## 4405. Matching Run Status

```text
queued
running
completed
completed_with_warnings
failed
cancelled
```

## 4406. Match Candidate

Campos:

```text
id
matchingRunId
productVersionId
providerId
partnerId
screeningResultId
rank
matchBand
matchReasonSummary
blockingFactors
conditions
unknowns
createdAt
```

## 4407. Match Bands

```text
strong_preliminary_fit
potential_fit
conditional_fit
needs_information
low_fit
not_currently_eligible
manual_review_required
```

No usar:

```text
approved
preapproved
guaranteed
```

salvo que provengan explícitamente del lender bajo un programa real.

## 4408. Matching Score Boundary

Si se usa score interno:

```text
fitScore
```

deberá:

- ser explicable;
- no presentarse como lender score;
- no implicar approval probability;
- versionarse;
- incluir underlying factors.

## 4409. Match Explanation

Cada candidate deberá poder explicar:

```text
matched hard rules
matched soft rules
failed rules
unknown fields
document gaps
pricing freshness
product risks
provider availability
```

## 4410. Match Ranking

El ranking podrá considerar:

- hard eligibility;
- soft fit;
- requested amount;
- use of funds;
- timing;
- estimated cost;
- payment frequency;
- term;
- collateral preference;
- PG preference;
- document readiness;
- client preferences.

## 4411. Ranking Preference Weights

Los pesos deberán ser configurables.

Ejemplo:

```text
costPriority
speedPriority
amountFit
termFit
documentReadiness
riskPreference
```

## 4412. Client Preference versus Eligibility

Las preferencias deberán afectar ranking, pero no alterar reglas reales del lender.

Ejemplo:

```text
client dislikes PG
```

no convierte un producto con PG requerido en no existente; simplemente reduce suitability/ranking.

## 4413. Lender / Provider Registry Link

Cada product deberá estar asociado a:

```text
providerId
providerType
partnerIdOptional
applicationChannel
decisionAuthority
```

## 4414. Lender Eligibility Overlay

Además del Product Eligibility Rule Engine podrá existir:

```text
provider-level eligibility rules
```

que se apliquen sobre múltiples products.

## 4415. Eligibility Evaluation Record

Campos:

```text
id
fundingCaseId
providerId
productVersionId
ruleSetVersion
result
failedHardRules
failedSoftRules
unknownRules
sourceReferences
evaluatedAt
```

## 4416. Eligibility Evaluation Result

```text
potentially_eligible
potentially_eligible_with_conditions
needs_information
not_eligible_under_current_rules
manual_review_required
product_unavailable
```

## 4417. Eligibility Freshness Gate

Antes de referral/application deberá comprobarse:

```text
product current
provider rules current
financial snapshot current
documents current
client consent current
```

## 4418. Lender-Specific Document Requirements

El system deberá combinar:

```text
product requirements
+
provider overlay
+
application stage requirements
```

para generar checklist final.

## 4419. Application Package

Campos:

```text
id
fundingCaseId
providerId
productVersionId
matchingRunId
financialPackageId
documentChecklistVersion
applicationDataVersion
packageHash
status
createdAt
```

## 4420. Application Package Status

```text
draft
documents_missing
client_review
internal_review
ready_for_consent
ready_for_referral
referred
submitted
superseded
cancelled
```

## 4421. Package Contents

Podrá incluir:

```text
business_profile
ownership
funding_need
use_of_funds
financial_summary
bank_statements
P&L
balance_sheet
tax_returns
debt_schedule
business_plan
collateral_docs
licenses
good_standing
identity_docs
other_provider_requirements
```

## 4422. Minimum Necessary Data Principle

El package deberá contener únicamente la información requerida para:

```text
selected product
+
selected provider
+
selected application stage
```

No compartir todo el vault por defecto.

## 4423. Sensitive Data Mapping

Campos sensibles deberán mapearse explícitamente:

```text
full_tax_id
owner_ssn_or_itin
identity_document
DOB
residential_address
bank_account_number
```

y requerir permissions/consent adecuados.

## 4424. Application Data Version

Toda application deberá tener:

```text
applicationDataVersion
dataHash
sourceSnapshotIds
createdAt
```

Cambios materiales deberán crear nueva versión.

## 4425. Client Application Review

Antes de compartir datos deberá mostrar:

- product/provider;
- requested amount;
- purpose;
- business info;
- owner/guarantor info;
- documents being shared;
- known fees/disclosures;
- SG role;
- lender role.

## 4426. Client Consent Record

Campos:

```text
id
fundingCaseId
providerId
productVersionId
applicationDataVersion
dataScope
purpose
deliveryModel
disclosureVersion
authorizedBy
authorizedAt
expiresAt
status
```

## 4427. Consent Status

```text
draft
presented
accepted
declined
expired
withdrawn
superseded
```

## 4428. Material Change after Consent

Si cambia:

- lender/provider;
- product;
- requested amount materially;
- data scope;
- guarantee requirement;
- application data;
- disclosures;

deberá revisarse si el consent debe renovarse.

## 4429. Referral Record

Campos:

```text
id
fundingCaseId
providerId
partnerId
productVersionId
applicationPackageId
consentId
referralTrackingId
status
createdAt
acceptedAt
```

## 4430. Referral Status

```text
draft
ready
sent
received
accepted
declined_by_provider
client_action_required
converted_to_application
closed
failed
```

## 4431. Application Record

Campos:

```text
id
fundingCaseId
providerId
productVersionId
applicationPackageId
externalApplicationId
applicationChannel
status
submittedAt
decisionAt
createdAt
updatedAt
```

## 4432. Application Channels

```text
provider_api
partner_api
secure_referral_link
embedded_application_future
manual_partner_portal
client_self_apply
staff_assisted
```

## 4433. Application Adapter Contract

Cuando exista integración:

```text
validatePackage()
createApplication()
submitApplication()
getStatus()
retrieveDecision()
retrieveOffers()
uploadDocument()
respondToRequest()
```

## 4434. Application Idempotency

Un retry deberá usar:

```text
fundingCaseId
+
providerId
+
productVersionId
+
applicationDataVersion
+
consentId
```

para evitar duplicate application.

## 4435. Application Submission Lock

Durante:

```text
submitting
submitted
under_review
```

el package enviado será inmutable.

Cambios deberán crear nueva version/supplement.

## 4436. Application Status

Normalized:

```text
draft
ready_to_submit
submitting
submitted
received
under_review
additional_information_required
conditional_approval
approved
declined
withdrawn
expired
cancelled
funded
unknown
```

Estos estados deberán provenir o mapearse desde provider responses.

## 4437. Raw Provider Status

Siempre conservar:

```text
rawStatus
rawCode
rawMessage
receivedAt
mappingVersion
```

## 4438. Application Timeline

Eventos:

```text
created
consented
referred
submitted
received
under_review
document_requested
decision_received
offer_received
accepted_or_declined
funded_or_closed
```

## 4439. Additional Information Request

Campos:

```text
id
applicationId
requestType
requestedFields
requestedDocuments
externalMessage
receivedAt
dueAt
status
```

## 4440. Additional Information Workflow

```text
provider request
→ map request
→ client/internal task
→ collect
→ review
→ client consent if scope changes
→ send
→ track
```

## 4441. Application Decision Record

Campos:

```text
id
applicationId
decisionType
decisionSource
rawDecision
decisionDate
reasonCodes
reasonText
documentId
verifiedAt
```

## 4442. Decision Types

```text
approved
conditional_approval
declined
more_information_needed
withdrawn
expired
unknown
```

Solo provider/lender decisions podrán usar `approved` o `declined`.

## 4443. Decline Reason Preservation

La plataforma deberá conservar:

- raw decline reason;
- provider code;
- adverse-action document reference cuando exista;
- normalized categories para analytics.

No deberá alterar el contenido oficial.

## 4444. Decline Reason Categories

```text
credit
revenue
cash_flow
time_in_business
industry
debt
documentation
identity
compliance
collateral
policy
unknown
```

## 4445. Decline Follow-Up Boundary

La plataforma podrá:

- explain provider-stated reasons;
- identify documents/gaps;
- suggest future readiness improvements;
- suggest alternate products where appropriate.

No deberá afirmar que un change garantiza future approval.

## 4446. Conditional Approval Record

Campos:

```text
applicationId
conditions
requiredDocuments
requiredActions
expirationDate
status
```

## 4447. Offer Record

Campos:

```text
id
applicationId
providerId
productVersionId
offerAmount
currency
term
paymentAmount
paymentFrequency
rateType
rate
aprWhenProvided
factorRateWhenApplicable
fees
collateralRequirement
personalGuaranteeRequirement
prepaymentTerms
offerExpiration
sourceDocumentId
verifiedAt
```

## 4448. Offer Source Priority

Preferencia:

```text
official lender offer
→ provider API
→ signed/official term sheet
→ verified partner transmission
→ manual verified entry
```

## 4449. Offer Verification

Antes de presentar como verified:

- provider match;
- applicant match;
- amount;
- term;
- payment;
- pricing;
- fees;
- expiration;
- source document.

## 4450. Offer Status

```text
received
verification_required
verified
client_review
accepted
declined
expired
withdrawn_by_provider
superseded
```

## 4451. Offer Comparison Record

Campos:

```text
id
fundingCaseId
offerIds
normalizationVersion
comparisonDate
createdBy
```

## 4452. Offer Normalization

Comparar:

```text
amount
net_funding_after_fees
payment
payment_frequency
term
APR_when_available
factor_rate
known_fees
estimated_total_cost
collateral
PG
prepayment_terms
expiration
```

No convertir factor rate a APR salvo metodología aprobada y disclosure claro.

## 4453. Estimated Total Cost

Cuando pueda calcularse:

```text
principal
+ known financing charges
+ known mandatory fees
```

deberá mostrar methodology y exclusions.

## 4454. Offer Comparison Boundary

La plataforma no deberá ocultar:

- high frequency payments;
- origination fees;
- prepayment costs;
- collateral;
- PG;
- variable-rate exposure;
- factor-rate structure.

## 4455. Offer Recommendation

La plataforma podrá ordenar:

```text
lowest_estimated_cost
lowest_payment
longest_term
fastest_available
least_collateral
best_preference_fit
```

pero deberá explicar el criterio.

## 4456. Client Selection Record

Campos:

```text
id
fundingCaseId
selectedOfferId
decision
reasonOptional
acknowledgmentVersion
selectedAt
```

## 4457. Offer Acceptance Boundary

Aceptar una oferta deberá seguir el provider/lender process.

SG Solutions podrá:

- facilitate;
- route;
- document client choice.

No deberá ejecutar un funding contract fuera de su authorized role.

## 4458. Funding Confirmation Record

Cuando un lender confirme funding:

```text
id
applicationId
offerId
fundedAmount
fundedAt
providerReference
confirmationDocumentId
verificationStatus
```

## 4459. Funded Amount versus Offer Amount

Deberán mantenerse separados:

```text
requestedAmount
offeredAmount
acceptedAmount
fundedAmount
netDisbursedAmount
```

## 4460. Funding Case Outcome

Valores:

```text
funded
approved_not_accepted
declined
withdrawn
expired
no_suitable_match
client_paused
incomplete
other
```

## 4461. Application / Offer Audit

Deberá registrar:

- matching input;
- match output;
- product version;
- consent;
- data shared;
- application package hash;
- provider status;
- decision;
- offer;
- client selection;
- funding confirmation.

## 4462. Permissions, APIs, Events and Workflows

### Permisos

```text
funding.matching.read
funding.matching.run
funding.matching.review

funding.application_package.read
funding.application_package.create
funding.application_package.review

funding.referral.read
funding.referral.create

funding.application.read
funding.application.create
funding.application.submit
funding.application.status.manage

funding.decision.read
funding.offer.read
funding.offer.verify
funding.offer.compare
```

### APIs

```text
POST /api/funding/cases/{id}/matching-runs
GET  /api/funding/cases/{id}/matches

POST /api/funding/cases/{id}/application-packages
POST /api/funding/cases/{id}/consents
POST /api/funding/cases/{id}/referrals

POST /api/funding/cases/{id}/applications
POST /api/funding/applications/{id}/submit
POST /api/funding/applications/{id}/refresh-status
POST /api/funding/applications/{id}/additional-information

POST /api/funding/applications/{id}/decisions
POST /api/funding/applications/{id}/offers
POST /api/funding/cases/{id}/offer-comparisons
POST /api/funding/cases/{id}/client-selections
POST /api/funding/applications/{id}/funding-confirmations
```

### Eventos

```text
FundingMatchingRunCompleted
FundingMatchCandidateCreated
FundingApplicationPackageCreated
FundingConsentAccepted
FundingReferralCreated
FundingApplicationCreated
FundingApplicationSubmitted
FundingApplicationStatusChanged
FundingAdditionalInformationRequested
FundingDecisionReceived
FundingOfferReceived
FundingOfferVerified
FundingOfferComparisonCreated
FundingOfferSelected
FundingConfirmed
```

### Workflows

```text
Funding Matching Workflow
Funding Application Package Workflow
Funding Consent Workflow
Funding Referral Workflow
Funding Application Workflow
Funding Additional Information Workflow
Funding Decision Workflow
Funding Offer Verification Workflow
Funding Offer Comparison Workflow
Funding Confirmation Workflow
```

## 4463. Pruebas de Parte 4

Pruebas obligatorias:

1. Crear Matching Input Snapshot.
2. Ejecutar Matching Run.
3. Crear Match Candidate.
4. Crear strong preliminary fit.
5. Crear needs-information result.
6. Bloquear approval wording.
7. Crear explainable match.
8. Aplicar ranking preferences.
9. Mantener eligibility separada de preference.
10. Aplicar provider-level overlay.
11. Crear Eligibility Evaluation Record.
12. Bloquear stale product.
13. Bloquear stale provider rule.
14. Combinar document requirements.
15. Crear Application Package.
16. Aplicar minimum-necessary data.
17. Marcar sensitive fields.
18. Versionar application data.
19. Renderizar client review.
20. Crear Client Consent.
21. Invalidar/refresh consent por material change.
22. Crear Referral Record.
23. Crear Application Record.
24. Probar provider API channel.
25. Probar client-self-apply channel.
26. Probar adapter contract.
27. Probar application idempotency.
28. Bloquear duplicate application.
29. Crear submission lock.
30. Normalizar provider status.
31. Conservar raw status.
32. Crear application timeline.
33. Crear Additional Information Request.
34. Ejecutar follow-up workflow.
35. Crear Decision Record.
36. Registrar lender-approved decision.
37. Registrar lender-declined decision.
38. Conservar raw decline reason.
39. Crear normalized decline category.
40. Crear conditional approval.
41. Crear Offer Record.
42. Verificar offer source.
43. Crear Offer Comparison.
44. Normalizar payment frequency.
45. Mostrar factor rate correctamente.
46. Calcular estimated total cost con methodology.
47. Mostrar PG/collateral/prepayment.
48. Crear recommendation ordering.
49. Crear Client Selection Record.
50. Crear Funding Confirmation.
51. Separar requested/offered/accepted/funded.
52. Crear Funding Case Outcome.
53. Probar audit trail.
54. Probar permissions.
55. Probar APIs.
56. Probar events/outbox.
57. Probar workflows.
58. Probar tenant isolation.
59. Probar consent data scope.
60. Probar expired offer handling.

## 4464. Criterios de Aceptación de Parte 4

La Parte 4 estará completa cuando:

1. Exista Matching Input Snapshot.
2. Exista Matching Run.
3. Exista Match Candidate.
4. Existan Match Bands.
5. Internal score no se presente como lender score.
6. Exista Match Explanation.
7. Exista Ranking.
8. Client preferences no alteren lender rules.
9. Exista provider registry link.
10. Exista provider eligibility overlay.
11. Exista Eligibility Evaluation Record.
12. Exista freshness gate.
13. Existan lender-specific document requirements.
14. Exista Application Package.
15. Exista package status.
16. Exista minimum-necessary data principle.
17. Exista sensitive-data mapping.
18. Exista application data versioning.
19. Exista Client Application Review.
20. Exista Client Consent.
21. Exista consent status.
22. Material changes puedan requerir consent refresh.
23. Exista Referral Record.
24. Exista referral status.
25. Exista Application Record.
26. Existan application channels.
27. Exista Adapter Contract.
28. Exista application idempotency.
29. Exista submission lock.
30. Exista normalized application status.
31. Raw provider status se conserve.
32. Exista Application Timeline.
33. Exista Additional Information Request.
34. Exista follow-up workflow.
35. Exista Decision Record.
36. Approved/declined solo provengan del lender/provider.
37. Decline reasons se preserven.
38. Existan normalized decline categories.
39. Exista Conditional Approval Record.
40. Exista Offer Record.
41. Exista offer source priority.
42. Exista offer verification.
43. Exista offer status.
44. Exista Offer Comparison.
45. Exista offer normalization.
46. Estimated total cost tenga methodology.
47. No se oculten fees/PG/collateral/payment frequency.
48. Exista Offer Recommendation criteria.
49. Exista Client Selection Record.
50. Exista Offer Acceptance boundary.
51. Exista Funding Confirmation.
52. Requested/offered/accepted/funded estén separados.
53. Exista Funding Case Outcome.
54. Exista complete audit.
55. Existan permissions/APIs/events/workflows.
56. Parte 4 termine lista para Client Portal/lifecycle de Parte 5.

## 4465. Instrucciones para Codex y Cierre de Parte 4

1. Lee Partes 1–3 completas.
2. Usa immutable Matching Input Snapshot.
3. Implementa explainable Matching Run.
4. No uses approval probabilities engañosas.
5. Implementa preference weighting separado de eligibility.
6. Implementa provider overlays.
7. Implementa freshness gate.
8. Construye lender-specific document checklist.
9. Implementa Application Package versionado.
10. Aplica minimum-necessary sharing.
11. Implementa sensitive field mapping.
12. Implementa Client Review.
13. Implementa Consent con data scope.
14. Refresca consent tras material changes.
15. Implementa Referral Record.
16. Implementa Application Record.
17. Implementa provider adapters.
18. Implementa application idempotency.
19. Implementa submission lock.
20. Conserva raw provider statuses.
21. Implementa Additional Information Workflow.
22. Solo provider decisions pueden marcar approved/declined.
23. Conserva raw decline reasons.
24. Implementa Offer Record.
25. Verifica offer contra source.
26. Implementa normalized comparisons.
27. No conviertas factor rate a APR sin methodology aprobada.
28. Muestra all known fees/payment frequency/PG/collateral.
29. Implementa Client Selection.
30. Implementa Funding Confirmation.
31. Separa requested/offered/accepted/funded/net disbursed.
32. Implementa permissions/APIs/events/workflows.
33. Implementa immutable audit.
34. No marques Parte 4 completa si una application puede salir sin consent o package hash.

### Verificación final de Parte 4

- ¿Matching es explicable?
- ¿Stale products/rules bloquean referral?
- ¿Preferences están separadas de eligibility?
- ¿Application package comparte solo minimum necessary?
- ¿Sensitive data requiere scope/consent?
- ¿Retries no duplican applications?
- ¿Raw provider statuses se conservan?
- ¿Approved/declined provienen únicamente del provider?
- ¿Decline reasons se preservan?
- ¿Offers se verifican?
- ¿Comparison muestra costo, frequency, PG y collateral?
- ¿Requested, offered y funded amounts están separados?
- ¿Toda acción queda auditada?

---

# Parte 5 — Client Portal, Comparisons, Recommendations, Consent, Disclosures, Commissions, Follow-Up y Funding Lifecycle

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 5  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 35 — Parte 4  
**Secciones incluidas:** 4466–4530  
**Audiencia:** Owner, Codex, funding specialists, client success, partner managers, compliance, analysts, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Experiencia de cliente transparente para comparar opciones, entender costos y condiciones, consentir data sharing, registrar referrals/commissions y administrar el lifecycle posterior a la decisión sin representar a SG Solutions como lender cuando no lo sea

## 4466. Objetivo de Parte 5

Esta parte define la experiencia del cliente desde que existen potential matches u offers hasta el seguimiento posterior al funding.

Deberá cubrir:

- Funding Client Portal;
- readiness summary;
- product education;
- match explanations;
- offer comparison;
- recommendations;
- disclosures;
- consent;
- partner/referral transparency;
- commission tracking;
- client decisions;
- post-decision follow-up;
- funded-loan lifecycle;
- renewal/refinance readiness;
- decline recovery;
- satisfaction;
- document access.

## 4467. Client Portal Principle

```text
verified case data
→ understandable status
→ transparent options
→ clear risks/costs
→ informed client choice
→ documented decision
→ follow-up
```

Nunca:

```text
highest commission
→ hidden recommendation
```

## 4468. Funding Client Portal

Secciones:

```text
Overview
Readiness
Documents
Potential Matches
Applications
Requests
Decisions
Offers
Comparisons
Selected Option
Funding Status
Next Steps
History
Messages
```

## 4469. Portal Case Overview

Deberá mostrar:

```text
requestedAmount
fundingPurpose
caseStatus
readinessStatus
documentsStatus
applicationsInProgress
offersAvailable
clientActionsPending
assignedSpecialist
lastUpdatedAt
```

## 4470. Client-Friendly Status Labels

Estados técnicos deberán traducirse a labels simples.

Ejemplos:

```text
intake_pending → Información pendiente
readiness_review → Revisando tu preparación
product_matching → Buscando opciones potenciales
application_in_progress → Solicitud en proceso
offers_available → Tienes opciones para revisar
funded → Financiamiento confirmado
```

## 4471. Readiness View

La UI deberá explicar por dimensión:

- complete;
- needs attention;
- missing;
- blocker;
- not applicable.

Deberá incluir next action cuando exista.

## 4472. Readiness Explanation

Ejemplo conceptual:

```text
Bank statements: Complete
Tax returns: Missing
Debt schedule: Needs confirmation
Business compliance: Verified
```

No deberá traducirse a “probabilidad de aprobación” salvo fuente lender explícita.

## 4473. Potential Matches View

Por match deberá mostrar:

```text
provider
product family
potential amount range
term range
pricing structure
payment frequency
collateral context
PG context
why it may fit
what remains unknown
```

## 4474. Match Disclaimer

Cada potential match deberá indicar que:

- es preliminary;
- depende de provider underwriting;
- terms pueden cambiar;
- no es una aprobación;
- availability puede cambiar.

## 4475. Product Education Card

Campos:

```text
productFamily
howItWorks
typicalUseCases
paymentStructure
costStructure
commonRequirements
keyRisks
bestFor
lessSuitableFor
```

Contenido deberá provenir de templates/versiones aprobadas.

## 4476. Comparison Workspace

El cliente podrá comparar varias opciones lado a lado.

Columnas principales:

```text
Provider
Product
Amount
Net Proceeds
Payment
Frequency
Term
Rate/APR/Factor
Known Fees
Estimated Total Cost
Collateral
Personal Guarantee
Prepayment Terms
Expiration
```

## 4477. Comparison Normalization Rule

La UI deberá evitar comparar directamente:

```text
daily payment
vs
monthly payment
```

sin mostrar frequency claramente.

Cuando sea posible podrá añadir equivalent monthly context como estimate etiquetado.

## 4478. Net Proceeds

Campos:

```text
grossAmount
upfrontFees
withheldAmounts
otherKnownDeductions
netProceeds
calculationVersion
```

No deberán asumirse deductions desconocidas.

## 4479. Total Cost Disclosure

Cuando pueda calcularse:

```text
knownFinancingCost
knownMandatoryFees
estimatedTotalRepayment
```

Debe distinguir:

```text
verified
estimated
unknown
```

## 4480. Rate and Factor Presentation

Reglas:

- APR se muestra cuando provider lo provea o exista metodología aprobada;
- interest rate no deberá llamarse APR;
- factor rate deberá llamarse factor rate;
- flat fees deberán mostrarse separadamente.

## 4481. Payment Frequency Warning

Productos con:

```text
daily
weekly
percentage_of_sales
```

deberán mostrar la frecuencia de forma prominente.

## 4482. Collateral Disclosure

Deberá mostrar:

```text
none_known
may_be_required
specific_asset
general_business_assets
unknown
```

según offer/product.

## 4483. Personal Guarantee Disclosure

Estados:

```text
not_required
required
required_for_specific_owners
may_be_required
unknown
```

No deberá ocultarse por convenience comercial.

## 4484. Prepayment Disclosure

Campos:

```text
prepaymentAllowed
prepaymentPenalty
discountForEarlyPayoff
minimumFinanceCharge
providerSpecificTerms
source
```

## 4485. Recommendation Engine Boundary

La plataforma podrá generar recommendations, pero deberá distinguir:

```text
system_ranked
specialist_recommended
client_preference_sorted
```

## 4486. Recommendation Record

Campos:

```text
id
fundingCaseId
recommendationType
recommendedOfferIds
rankingCriteria
reasoningSummary
riskFlags
sourceReferences
createdBy
createdAt
```

## 4487. Recommendation Criteria

Podrá considerar:

```text
estimated_cost
payment_affordability
term
net_proceeds
funding_speed
collateral
PG
prepayment_terms
client_preferences
business_cash_flow
```

## 4488. Recommendation Explanation

Cada recommendation deberá responder:

- por qué aparece arriba;
- qué tradeoffs existen;
- qué riesgos se conocen;
- qué datos faltan;
- qué criterios se priorizaron.

## 4489. No Commission-Driven Hidden Ranking

Si SG Solutions puede recibir compensation de un partner:

- el ranking no deberá ocultar ese hecho;
- commission no deberá ser factor secreto;
- cualquier sponsored/preferred placement deberá identificarse según policy.

## 4490. Disclosure Registry

Campos:

```text
id
disclosureCode
disclosureType
jurisdictionScope
productFamilies
deliveryModels
contentVersion
effectiveFrom
effectiveTo
status
```

## 4491. Disclosure Types

```text
sg_role
not_a_lender
no_guarantee
partner_referral
compensation
data_sharing
credit_pull
pricing_estimate
high_cost_product
daily_or_weekly_payment
collateral
personal_guarantee
prepayment
other
```

## 4492. Disclosure Presentation Record

Campos:

```text
id
fundingCaseId
disclosureVersionId
presentedTo
presentedAt
channel
acknowledgmentRequired
acknowledgedAt
```

## 4493. Client Consent Center

El portal deberá centralizar:

```text
data_sharing_consents
credit_consents
application_consents
partner_referral_consents
communication_consents
withdrawals
```

## 4494. Consent Withdrawal

Cuando legal/operationalmente posible:

```text
active consent
→ client withdrawal
→ stop future sharing
→ preserve prior authorized actions
→ notify affected workflow
→ audit
```

No deberá borrar historial.

## 4495. Credit Pull Transparency

Antes de una acción crediticia deberá indicarse cuando se conozca:

```text
soft_pull
hard_pull
provider_may_decide
unknown
```

Nunca deberá garantizarse que una inquiry será soft si no está confirmado.

## 4496. Partner Referral Disclosure

Deberá mostrar:

- partner/lender identity;
- SG Solutions role;
- data to be shared;
- possible compensation when required;
- whether application happens externally;
- privacy/terms links or references.

## 4497. Commission Record

Campos:

```text
id
fundingCaseId
partnerId
providerId
referralId
applicationId
productVersionId
commissionType
commissionBasis
expectedAmount
earnedAmount
paidAmount
status
createdAt
```

## 4498. Commission Types

```text
flat_referral_fee
percentage_of_funded_amount
percentage_of_revenue
tiered
marketing_fee
other_contractual
none
```

## 4499. Commission Status

```text
not_applicable
potential
earned_pending_verification
earned
invoiced
paid
reversed
disputed
cancelled
```

## 4500. Commission Recognition Boundary

Una comisión no deberá marcarse `earned` solo porque:

```text
referral sent
```

La regla deberá seguir el contrato del partner.

## 4501. Commission Audit

Deberá conservar:

```text
contractReference
calculationBasis
fundedAmountReference
calculationVersion
approvedBy
paymentReference
```

## 4502. Conflict-of-Interest Control

Si compensation pudiera afectar recommendation:

- disclosure;
- independent ranking logic;
- compliance review;
- audit.

La plataforma deberá poder demostrar cómo se generó el ranking.

## 4503. Client Decision Workspace

Opciones:

```text
accept_offer
decline_offer
keep_comparing
pause
request_specialist_help
```

## 4504. Client Decision Record

Campos:

```text
id
fundingCaseId
offerId
decision
reasonOptional
acknowledgmentVersion
madeBy
madeAt
```

## 4505. Offer Acceptance Checklist

Antes de aceptar:

- offer verified;
- not expired;
- current terms displayed;
- known fees displayed;
- payment frequency displayed;
- collateral/PG displayed;
- client acknowledgment;
- provider acceptance path known.

## 4506. External Acceptance Flow

Cuando la aceptación ocurra fuera de SG Solutions:

```text
client selects
→ secure provider link
→ provider completes acceptance
→ SG tracks status
```

No deberá simularse aceptación final si el provider no la confirmó.

## 4507. Declined Offer by Client

El sistema deberá registrar:

```text
offerId
declinedAt
reasonOptional
futureFollowUpAllowed
```

Sin penalizar automáticamente ranking futuro.

## 4508. Application Withdrawal

Campos:

```text
applicationId
requestedBy
withdrawalReason
requestedAt
providerConfirmation
status
```

## 4509. Funding Confirmed Client View

Cuando verified:

```text
Funded Amount
Net Proceeds if known
Funded Date
Provider
Product
Payment
First Payment Date if provided
Key Documents
Next Steps
```

## 4510. Post-Funding Plan

Campos:

```text
id
fundingCaseId
fundingConfirmationId
paymentStartDate
expectedMaturityDate
reportingTasks
financialMonitoringTasks
renewalEligibilityDate
refinanceReviewDate
documentTasks
status
createdAt
```

## 4511. Funding Lifecycle Status

```text
funded_active
monitoring
renewal_window
refinance_review
paid_off
restructured
default_reported_by_provider
unknown
closed
```

SG Solutions deberá evitar inferir default sin provider/source.

## 4512. Payment Schedule Reference

Cuando provider suministre schedule:

```text
paymentAmount
frequency
firstPaymentDate
maturityDate
autopayStatusWhenAvailable
sourceDocumentId
```

El provider schedule será source of truth.

## 4513. Funding Document Vault

Podrá incluir:

- application;
- consent;
- disclosures;
- decision letter;
- offer/term sheet;
- signed agreement reference;
- funding confirmation;
- payment schedule;
- payoff information;
- renewal offers.

## 4514. Post-Funding Bookkeeping Handoff

Al Módulo 31:

```text
fundingConfirmationId
provider
fundedAmount
netProceeds
fundedDate
debtType
paymentScheduleReference
feeBreakdown
documentReferences
```

## 4515. Post-Funding Tax Handoff

Cuando sea relevante:

```text
financingType
fundedDate
knownFees
interestStructure
assetPurchaseContext
refinanceContext
documentReferences
```

Tax treatment deberá determinarse en Tax module/professional workflow.

## 4516. Debt Schedule Update

Tras funding verificado:

```text
existing debt schedule
→ add verified liability
→ effective date
→ source document
→ reconcile with bookkeeping
```

## 4517. Funding Use Follow-Up

Para productos donde sea útil/contractualmente requerido podrá existir:

```text
useOfFundsPlan
actualUseEvidence
variance
followUpStatus
```

No deberá crearse monitoring invasivo sin purpose.

## 4518. Renewal Readiness

Podrá evaluarse antes de maturity/renewal:

```text
payment_history_if_available
updated_revenue
cash_flow
debt
banking
compliance
current_documents
provider_renewal_rules
```

## 4519. Refinance Readiness

Podrá activarse cuando:

- client requests;
- existing financing cost is high;
- maturity approaches;
- business financial profile improves;
- provider offers refinance.

No deberá prometer ahorro hasta comparar terms.

## 4520. Decline Recovery Plan

Después de lender decline:

```text
provider-stated reasons
→ verified gaps
→ actionable improvements
→ timeline
→ alternative product screening
```

## 4521. Decline Recovery Boundary

No deberá:

- dispute accurate lender decision as false;
- promise deletion/change;
- promise approval after waiting;
- fabricate a workaround.

## 4522. Follow-Up Cadence

Podrá configurarse:

```text
7_days
30_days
60_days
90_days
6_months
custom
```

según outcome y client consent.

## 4523. Client Communication Preferences

Campos:

```text
emailAllowed
smsAllowed
inAppAllowed
phoneAllowed
marketingAllowed
preferredLanguage
quietHours
```

## 4524. Funding Specialist Follow-Up

El specialist podrá registrar:

- notes;
- client questions;
- provider updates;
- future funding need;
- satisfaction;
- next action.

Notes sensibles deberán seguir access policy.

## 4525. Client Satisfaction Record

Campos:

```text
fundingCaseId
stage
rating
feedback
providerFeedback
SGServiceFeedback
submittedAt
```

## 4526. Outcome Review

Después del cierre:

```text
requested amount
vs
matched products
vs
offers
vs
selected offer
vs
funded amount
```

permitirá evaluar calidad del proceso.

## 4527. Permissions, APIs, Events and Workflows

### Permisos

```text
funding.portal.read
funding.comparison.read
funding.recommendation.read
funding.recommendation.create

funding.disclosure.read
funding.disclosure.manage
funding.consent.read
funding.consent.manage

funding.commission.read
funding.commission.manage
funding.commission.approve

funding.lifecycle.read
funding.lifecycle.manage
```

### APIs

```text
GET  /api/funding/cases/{id}/portal
GET  /api/funding/cases/{id}/comparisons
POST /api/funding/cases/{id}/recommendations

GET  /api/funding/cases/{id}/disclosures
POST /api/funding/cases/{id}/disclosure-presentations
GET  /api/funding/cases/{id}/consents
POST /api/funding/consents/{id}/withdraw

POST /api/funding/cases/{id}/commissions
POST /api/funding/cases/{id}/client-decisions

POST /api/funding/cases/{id}/post-funding-plan
GET  /api/funding/cases/{id}/lifecycle
POST /api/funding/cases/{id}/follow-ups
```

### Eventos

```text
FundingPortalUpdated
FundingRecommendationCreated
FundingDisclosurePresented
FundingConsentWithdrawn
FundingPartnerReferralDisclosed
FundingCommissionCreated
FundingCommissionEarned
FundingClientDecisionRecorded
FundingOfferAcceptanceStarted
FundingApplicationWithdrawn
FundingPostFundingPlanCreated
FundingDebtScheduleUpdateRequested
FundingRenewalReadinessStarted
FundingRefinanceReviewStarted
FundingDeclineRecoveryPlanCreated
FundingFollowUpScheduled
FundingSatisfactionSubmitted
```

### Workflows

```text
Funding Client Portal Workflow
Funding Comparison Workflow
Funding Recommendation Workflow
Funding Disclosure Workflow
Funding Consent Management Workflow
Funding Commission Workflow
Funding Client Decision Workflow
Post-Funding Lifecycle Workflow
Funding Renewal Readiness Workflow
Funding Refinance Review Workflow
Funding Decline Recovery Workflow
Funding Follow-Up Workflow
```

## 4528. Pruebas de Parte 5

Pruebas obligatorias:

1. Renderizar Funding Client Portal.
2. Mostrar client-friendly statuses.
3. Mostrar readiness dimensions.
4. Mostrar preliminary matches con disclaimer.
5. Crear Product Education Card.
6. Comparar offers.
7. Mostrar payment frequency.
8. Calcular net proceeds.
9. Etiquetar estimated cost.
10. Mostrar APR/rate/factor correctamente.
11. Mostrar collateral.
12. Mostrar PG.
13. Mostrar prepayment.
14. Crear system-ranked recommendation.
15. Crear specialist recommendation.
16. Explicar recommendation.
17. Bloquear hidden commission ranking.
18. Crear Disclosure Registry.
19. Presentar disclosure.
20. Registrar acknowledgment.
21. Mostrar Consent Center.
22. Retirar consent.
23. Bloquear future sharing tras withdrawal.
24. Mostrar hard/soft pull transparency.
25. Crear Partner Referral Disclosure.
26. Crear Commission Record.
27. Calcular commission según contract.
28. Bloquear premature earned status.
29. Crear conflict-of-interest review.
30. Crear Client Decision Workspace.
31. Registrar accept.
32. Registrar decline.
33. Validar Offer Acceptance Checklist.
34. Ejecutar external acceptance flow.
35. Registrar Application Withdrawal.
36. Mostrar verified funding confirmation.
37. Crear Post-Funding Plan.
38. Crear Funding Lifecycle.
39. Mostrar payment schedule source.
40. Crear Funding Document Vault references.
41. Crear Bookkeeping handoff.
42. Crear Tax handoff.
43. Actualizar Debt Schedule.
44. Crear Use-of-Funds Follow-Up.
45. Crear Renewal Readiness.
46. Crear Refinance Readiness.
47. Crear Decline Recovery Plan.
48. Bloquear future-approval guarantee.
49. Programar follow-up.
50. Respetar communication preferences.
51. Crear specialist follow-up note.
52. Crear satisfaction record.
53. Crear outcome review.
54. Probar permissions.
55. Probar APIs.
56. Probar events/outbox.
57. Probar workflows.
58. Probar audit.
59. Probar tenant isolation.
60. Probar bilingual portal.

## 4529. Criterios de Aceptación de Parte 5

La Parte 5 estará completa cuando:

1. Exista Funding Client Portal.
2. Existan client-friendly statuses.
3. Exista Readiness View.
4. Exista Potential Matches View.
5. Exista Match Disclaimer.
6. Exista Product Education.
7. Exista Comparison Workspace.
8. Exista comparison normalization.
9. Exista Net Proceeds.
10. Exista Total Cost Disclosure.
11. Rate/APR/factor estén diferenciados.
12. Exista Payment Frequency Warning.
13. Exista Collateral Disclosure.
14. Exista PG Disclosure.
15. Exista Prepayment Disclosure.
16. Exista Recommendation Engine boundary.
17. Exista Recommendation Record.
18. Existan Recommendation Criteria.
19. Exista Recommendation Explanation.
20. Hidden commission ranking esté prohibido.
21. Exista Disclosure Registry.
22. Existan Disclosure Types.
23. Exista Disclosure Presentation Record.
24. Exista Consent Center.
25. Exista Consent Withdrawal.
26. Exista Credit Pull Transparency.
27. Exista Partner Referral Disclosure.
28. Exista Commission Record.
29. Existan Commission Types.
30. Exista Commission Status.
31. Commission recognition siga contract.
32. Exista Commission Audit.
33. Exista conflict-of-interest control.
34. Exista Client Decision Workspace.
35. Exista Client Decision Record.
36. Exista Offer Acceptance Checklist.
37. Exista External Acceptance Flow.
38. Exista declined-offer handling.
39. Exista Application Withdrawal.
40. Exista Funding Confirmed View.
41. Exista Post-Funding Plan.
42. Exista Funding Lifecycle.
43. Exista Payment Schedule Reference.
44. Exista Funding Document Vault.
45. Exista Bookkeeping Handoff.
46. Exista Tax Handoff.
47. Exista Debt Schedule Update.
48. Exista Use-of-Funds Follow-Up.
49. Exista Renewal Readiness.
50. Exista Refinance Readiness.
51. Exista Decline Recovery.
52. No exista future-approval guarantee.
53. Exista Follow-Up Cadence.
54. Existan Communication Preferences.
55. Exista specialist follow-up.
56. Exista Client Satisfaction.
57. Exista Outcome Review.
58. Existan permissions/APIs/events/workflows.
59. Toda recommendation sea explicable.
60. Parte 5 termine lista para governance/security/analytics de Parte 6.

## 4530. Instrucciones para Codex y Cierre de Parte 5

1. Lee Partes 1–4 completas.
2. Implementa Client Portal sobre records existentes.
3. No dupliques offers/applications.
4. Implementa client-friendly labels separados de statuses técnicos.
5. Implementa Product Education versionada.
6. Implementa normalized comparisons.
7. Mantén rate/APR/factor separados.
8. Muestra payment frequency prominentemente.
9. Implementa net proceeds.
10. Implementa total-cost methodology.
11. Implementa collateral/PG/prepayment disclosures.
12. Implementa explainable recommendations.
13. Separa ranking de commission incentives.
14. Implementa Disclosure Registry.
15. Implementa disclosure acknowledgment.
16. Implementa Consent Center/Withdrawal.
17. Implementa credit-pull transparency.
18. Implementa Partner Referral Disclosure.
19. Implementa Commission Records/contract basis.
20. Implementa conflict-of-interest audit.
21. Implementa Client Decision.
22. Verifica offer antes de acceptance.
23. Implementa external-provider acceptance.
24. Implementa withdrawal flow.
25. Implementa Post-Funding Plan.
26. Implementa lifecycle statuses.
27. Reutiliza Documents para funding vault.
28. Implementa Bookkeeping/Tax handoffs.
29. Actualiza debt schedule mediante verified funding.
30. Implementa Renewal/Refinance readiness.
31. Implementa Decline Recovery.
32. No prometas future approval.
33. Implementa follow-up cadence.
34. Respeta communication consent/preferences.
35. Implementa satisfaction/outcome review.
36. Implementa permissions/APIs/events/workflows.
37. Implementa immutable audit.
38. No marques Parte 5 completa si compensation puede alterar ranking sin disclosure/audit.

### Verificación final de Parte 5

- ¿El portal explica el proceso en lenguaje simple?
- ¿Potential matches están claramente marcados como preliminares?
- ¿Offer comparison muestra net proceeds, cost, frequency, collateral y PG?
- ¿Recommendations son explicables?
- ¿Compensation está separada del ranking?
- ¿Disclosures y consents están versionados?
- ¿Consent withdrawal detiene future sharing?
- ¿Client decisions quedan auditadas?
- ¿Funding confirmation proviene de source verificable?
- ¿Post-funding actualiza Bookkeeping/Debt Schedule?
- ¿Renewal/refinance son readiness, no garantías?
- ¿Decline recovery evita promesas?
- ¿Toda acción queda auditada?

---

# Parte 6 — Partners, Automation, AI, Compliance, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 6  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 35 — Parte 5  
**Secciones incluidas:** 4531–4595  
**Audiencia:** Owner, Codex, funding specialists, partner managers, compliance, security, operations, administrators, support y Data Analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Business Funding gobernado por partner/provider rules versionadas, automatización supervisada, IA explicable, consentimiento, seguridad de mínimo privilegio, trazabilidad financiera y operativa, observabilidad, métricas y continuidad

## 4531. Objetivo de Parte 6

Esta parte cierra el Módulo 35 definiendo:

- partner/provider governance;
- lender/provider integrations;
- automation;
- AI assistance;
- compliance boundaries;
- consumer/business-finance disclosures;
- security;
- privileged access;
- audit;
- administration;
- work queues;
- SLAs;
- observability;
- analytics;
- migration;
- data portability;
- business continuity;
- disaster recovery;
- end-to-end tests;
- final acceptance.

## 4532. Partner / Provider Governance Principle

```text
verified partner
→ verified product
→ current rules
→ scoped data sharing
→ tracked referral/application
→ external decision
→ verified outcome
```

Nunca:

```text
partner connected
→ all products trusted forever
```

## 4533. Provider Registry Integration

El módulo deberá reutilizar el Provider/Partner Registry general.

Campos relevantes:

```text
providerId
providerName
providerType
partnerIdOptional
jurisdictions
productFamilies
applicationChannels
decisionAuthority
contractStatus
integrationStatus
dataProcessingTerms
compensationModel
status
```

## 4534. Provider Types

```text
bank
credit_union
CDFI_or_community_lender
nonprofit_lender
fintech_lender
SBA_participating_lender
equipment_finance_provider
card_issuer
factoring_provider
alternative_finance_provider
marketplace_partner
referral_partner
other
```

## 4535. Provider Status

```text
active
limited
onboarding
under_review
temporarily_suspended
terminated
unknown
```

Providers suspendidos no deberán recibir nuevas referrals/applications.

## 4536. Provider Capability Matrix

Campos:

```text
productDiscovery
preliminaryScreening
applicationSubmission
statusLookup
documentUpload
additionalInformation
decisionRetrieval
offerRetrieval
fundingConfirmation
webhooks
API
secureLink
manualPortal
```

## 4537. Provider Health

Estados:

```text
healthy
degraded
partially_available
unavailable
unknown
```

El health deberá influir en routing, pero no alterar eligibility rules.

## 4538. Provider SLA

Podrá incluir:

```text
referralAcceptanceTarget
applicationAcknowledgmentTarget
documentRequestResponseTarget
statusUpdateCadence
decisionTargetEstimate
offerDeliveryTarget
supportEscalationTarget
```

Processing times deberán etiquetarse como estimates cuando no sean contractuales.

## 4539. Provider Failure and Fallback

Ante failure:

```text
preserve application state
→ stop duplicate submission
→ verify external outcome
→ evaluate alternate provider
→ human review
→ refresh consent when material
→ resume
```

## 4540. Partner Data Sharing Governance

Antes de compartir:

```text
provider
purpose
product
dataScope
consent
transmissionMethod
retentionExpectation
disclosureVersion
audit
```

Solo `minimum necessary`.

## 4541. Provider Credential Security

Credentials/API secrets deberán:

- almacenarse centralmente;
- cifrarse;
- rotarse;
- limitarse por scope;
- nunca aparecer en logs;
- poder revocarse;
- registrar access.

## 4542. Webhook Inbox

Provider webhooks deberán:

```text
authenticate
→ persist raw event
→ deduplicate
→ normalize
→ process idempotently
→ audit
```

## 4543. Webhook Idempotency

Dedup keys podrán usar:

```text
providerId
externalEventId
eventType
```

o payload hash cuando no exista event ID confiable.

## 4544. Polling Fallback

Cuando no haya webhook:

- scheduled polling;
- rate limiting;
- exponential backoff;
- last-known cursor/status;
- max retry threshold;
- escalation.

## 4545. Automation Engine

Automatizaciones permitidas:

- readiness refresh;
- stale-product detection;
- match rerun;
- reminders;
- document requests;
- provider status polling;
- offer-expiration warnings;
- follow-up scheduling;
- dashboard updates;
- post-funding task creation.

## 4546. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 4547. Informational Automation

Ejemplos:

- summarize case;
- calculate aging;
- show current readiness;
- identify stale docs;
- draft status message;
- refresh analytics.

## 4548. Low-Risk Automation

Ejemplos:

- create task;
- schedule reminder;
- update normalized provider status;
- attach verified receipt;
- generate idempotent handoff;
- route work queue.

## 4549. Moderate-Risk Automation

Ejemplos:

- rerun matching;
- propose product list;
- propose document package;
- propose recommendation;
- propose decline recovery plan.

Deberá mantener explainability y review when material.

## 4550. High-Risk Automation

Requiere human/authorization gate:

- submit application;
- resubmit;
- trigger hard credit action;
- reveal sensitive tax/identity data;
- share new data scope;
- accept offer;
- override eligibility blocker;
- mark funding confirmed manually.

## 4551. Prohibited Automation

No deberá:

- fabricate lender decisions;
- fabricate offers;
- fabricate funded amount;
- bypass consent;
- hide fees;
- hide commissions;
- alter provider documents;
- submit knowingly false financial data;
- generate fake credit scores;
- promise approval.

## 4552. AI Assistant Scope

La IA podrá:

- summarize funding readiness;
- explain product differences;
- suggest missing documents;
- summarize lender requests;
- compare verified offers;
- draft questions;
- suggest remediation;
- prioritize cases;
- summarize decline reasons.

## 4553. AI Grounding Requirements

Para:

- current product terms;
- SBA/program rules;
- lender eligibility;
- rates;
- fees;
- document requirements;
- application availability;

la IA deberá usar current verified registry/provider sources.

## 4554. AI Output Contract

Material outputs deberán incluir:

```text
recommendation
confidence
sourceReferences
productVersion
providerRuleVersion
assumptions
unknowns
humanReviewRequired
```

## 4555. AI Recommendation Boundary

La IA no deberá:

- rank based on hidden commission;
- claim lender approval;
- invent missing underwriting criteria;
- present stale rate as current;
- recommend unsuitable high-cost product without risk disclosure;
- accept terms for client.

## 4556. Funding Compliance Framework

Controles mínimos:

- accurate role disclosure;
- no-guarantee language;
- consent before external sharing;
- credit-pull transparency;
- fee transparency;
- compensation transparency;
- current product data;
- application-data integrity;
- offer-source verification;
- adverse/decline reason preservation;
- audit.

## 4557. Compliance Finding

Campos:

```text
id
fundingCaseId
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

## 4558. Funding Compliance Finding Types

```text
stale_product
stale_provider_rule
missing_consent
disclosure_missing
commission_conflict
application_data_mismatch
offer_verification_issue
pricing_mismatch
credit_pull_disclosure_issue
sensitive_data_scope_issue
provider_status_issue
other
```

## 4559. Compliance Finding Status

```text
open
under_review
client_action_required
partner_action_required
resolved
accepted_with_documented_reason
not_applicable
```

## 4560. High-Cost Product Control

Products marcados:

```text
high_cost
daily_payment
weekly_payment
factor_rate
short_term
complex_fee_structure
```

deberán activar disclosure y suitability review definidos por policy.

## 4561. Recommendation Conflict Review

Cuando:

```text
high commission
+
recommended product
```

el sistema deberá poder mostrar:

- independent ranking factors;
- compensation disclosure;
- reviewer;
- audit trail.

## 4562. Administrative Console

Secciones:

```text
Overview
Funding Cases
Readiness
Financial Review
Products
Providers
Matching
Applications
Decisions
Offers
Commissions
Post-Funding
Work Queues
SLAs
Compliance
Analytics
Security
Configuration
```

## 4563. Funding Operations Dashboard

Deberá mostrar:

- active cases;
- intake backlog;
- financial-review backlog;
- ready-for-matching;
- matches generated;
- referrals;
- applications;
- pending lender requests;
- offers;
- funded cases;
- declines;
- provider issues;
- stale products;
- compliance blockers.

## 4564. Work Queues

```text
intake_review
financial_review
document_review
product_review
matching_review
consent_pending
ready_for_referral
application_followup
additional_information
offer_verification
client_decision
funding_confirmation
commission_review
post_funding
compliance_review
provider_escalation
```

## 4565. Assignment Engine

Podrá considerar:

- funding amount;
- product family;
- provider;
- case complexity;
- financial complexity;
- language;
- user permissions;
- specialist skill;
- workload;
- SLA deadline.

## 4566. SLA Tracking

SLAs conceptuales:

```text
intake_review_sla
financial_review_sla
matching_sla
application_package_sla
provider_followup_sla
offer_verification_sla
client_decision_followup_sla
funding_confirmation_sla
commission_review_sla
```

## 4567. SLA Clock Segmentation

Medir por separado:

```text
internal_active_time
client_blocked_time
provider_blocked_time
underwriting_time
```

## 4568. Security Model

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

## 4569. Sensitive Funding Data

Incluye:

- owner tax identifiers;
- credit data;
- bank statements;
- account numbers;
- tax returns;
- personal financial statements;
- identity documents;
- lender decisions;
- signed offers/agreements.

## 4570. Field-Level Masking

Ejemplos:

```text
Account: ******4821
Tax ID: ***-**-3920
```

Valores completos solo bajo purpose autorizado.

## 4571. Sensitive Document Access

Acceso podrá requerir:

```text
permission
purpose
reauthentication
temporary session
audit
```

## 4572. Credit Data Isolation

Credit data deberá:

- almacenarse separadamente cuando corresponda;
- tener access policy reforzada;
- no usarse para unrelated marketing;
- respetar consent scope;
- registrar provider/source.

## 4573. Data Retention

Retention deberá variar por:

- application records;
- consents;
- credit data;
- tax documents;
- bank documents;
- lender decisions;
- offers;
- commission records;
- audit/legal hold.

## 4574. Export Governance

Exports deberán registrar:

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

## 4575. Privileged Actions

Ejemplos:

- reveal full sensitive identifier;
- export tax/bank package;
- override blocker;
- manually verify offer;
- alter provider configuration;
- manually confirm funding;
- alter commission status;
- reopen completed case.

## 4576. Owner Break-Glass

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

## 4577. Security Incident Types

```text
cross_client_access
credit_data_exposure
bank_document_exposure
tax_document_exposure
unauthorized_application
unauthorized_data_sharing
provider_credential_compromise
offer_document_tampering
commission_manipulation
privilege_misuse
```

## 4578. Security Incident Response

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

## 4579. Audit Trail

Deberá registrar:

- funding profile versions;
- financial calculations;
- product/rule versions;
- matching runs;
- recommendations;
- consents;
- data shared;
- applications;
- provider responses;
- decisions;
- offers;
- client selections;
- funding confirmations;
- commissions;
- sensitive reveals;
- exports;
- overrides.

## 4580. Observability

Métricas técnicas:

```text
matching_failure_rate
provider_api_failure_rate
webhook_failure_rate
application_submission_error_rate
status_poll_failure_rate
document_upload_failure_rate
offer_ingestion_failure_rate
handoff_failure_rate
```

## 4581. Operational Alerts

Alertas:

- stale product used in open case;
- provider degraded;
- application stuck;
- unknown submission outcome;
- lender document request aging;
- offer expiring;
- consent expired;
- sensitive export anomaly;
- commission discrepancy;
- funding confirmation mismatch.

## 4582. Analytics Dashboards

```text
Funding Executive Dashboard
Funding Operations Dashboard
Readiness Dashboard
Financial Quality Dashboard
Product Match Dashboard
Provider Performance Dashboard
Application Funnel Dashboard
Offer Comparison Dashboard
Funding Outcome Dashboard
Commission Dashboard
Post-Funding Dashboard
Compliance Quality Dashboard
```

## 4583. Core Funnel KPIs

```text
funding_cases_started
funding_profiles_completed
financial_packages_completed
cases_ready_for_matching
matches_generated
referrals_sent
applications_submitted
offers_received
offers_accepted
cases_funded
```

## 4584. Conversion KPIs

```text
intake_to_readiness_rate
readiness_to_match_rate
match_to_application_rate
application_to_offer_rate
offer_to_acceptance_rate
acceptance_to_funding_rate
overall_funding_rate
```

Todas deberán definir denominator explícito.

## 4585. Funding Outcome KPIs

```text
requested_amount_total
offered_amount_total
accepted_amount_total
funded_amount_total
net_disbursed_amount_total
average_funded_amount
median_funded_amount
```

## 4586. Quality KPIs

```text
document_correction_rate
financial_reconciliation_issue_rate
stale_product_block_count
duplicate_application_prevented_count
offer_verification_issue_rate
consent_refresh_rate
provider_status_mismatch_rate
reopened_case_rate
```

## 4587. Provider KPIs

```text
provider_referral_acceptance_rate
provider_application_conversion_rate
provider_offer_rate
provider_funding_rate
provider_response_time
provider_document_request_rate
provider_decline_rate
provider_error_rate
provider_sla_breach_rate
```

## 4588. Product KPIs

```text
product_match_count
product_application_count
product_offer_count
product_funding_count
average_offer_amount
average_known_cost
decline_reason_distribution
```

## 4589. Revenue / Commission KPIs

```text
SG_service_revenue
partner_referral_revenue
commission_earned
commission_paid
commission_reversed
revenue_per_funded_case
gross_margin_by_service
```

Funding principal nunca deberá contarse como SG revenue.

## 4590. Metric Governance

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

## 4591. Data Portability and Migration

### Data Portability

El cliente podrá obtener:

- funding case summary;
- readiness summary;
- document checklist;
- applications;
- decisions;
- offers;
- comparison records;
- selected offer;
- funding confirmation;
- post-funding plan.

### Migration In

```text
import organization
→ verify business identity
→ import existing financing
→ import applications/offers when evidenced
→ map documents
→ create migration snapshot
→ continue workflow
```

No deberán inventarse historic events.

## 4592. Migration Record and Migration Out

Campos:

```text
id
organizationId
sourceSystem
cutoffDate
importedCases
importedApplications
importedOffers
importedFundingRecords
verificationStatus
unresolvedIssues
createdAt
completedAt
```

Migration Out deberá producir records y evidence dentro del scope/retention policy.

## 4593. Business Continuity and Disaster Recovery

Ante outage:

```text
preserve last verified state
→ stop risky applications
→ queue low-risk work
→ maintain read-only portal when possible
→ restore integrations
→ reconcile provider statuses
→ verify unknown outcomes
→ prevent duplicate submission
```

Prioridad de recuperación:

1. unknown submission outcomes;
2. pending offer expirations;
3. provider document deadlines;
4. funding confirmations;
5. active applications;
6. routine matching.

## 4594. End-to-End Tests

### Escenario 1 — Funding Preparation to Funded

```text
intake
→ Funding Profile
→ Financial Profile
→ readiness
→ product screening
→ matching
→ application package
→ consent
→ application
→ offer
→ comparison
→ selection
→ funding confirmation
→ bookkeeping handoff
```

### Escenario 2 — Missing Financials

```text
intake
→ missing bookkeeping
→ M31 handoff
→ books updated
→ financial package rebuilt
→ matching
```

### Escenario 3 — Stale Product Rule

```text
match candidate
→ product stale
→ referral blocked
→ product refreshed
→ rematch
```

### Escenario 4 — Lender Decline

```text
application
→ lender decline
→ raw reason preserved
→ decline recovery plan
→ client improvements
→ future screening
```

### Escenario 5 — Multiple Offers

```text
multiple offers
→ verify
→ normalize
→ compare
→ explain tradeoffs
→ client choice
```

### Escenario 6 — Provider Failure

```text
submission
→ provider outage
→ outcome unknown
→ blind retry blocked
→ verification
→ fallback if safe
```

### Escenario 7 — Commission Conflict

```text
high-commission product
→ recommendation
→ independent ranking factors
→ disclosure
→ review
→ audit
```

### Escenario 8 — Security Incident

```text
unauthorized bank-document export
→ deny
→ alert
→ incident
→ preserve evidence
→ restrict access
→ remediation
```

## 4595. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 35

El Módulo 35 estará completo cuando:

1. Exista Funding Service Catalog.
2. Exista Funding Engagement.
3. Exista Funding Case.
4. Exista Funding Intake.
5. Exista Funding Profile.
6. Exista profile versioning.
7. Exista identity readiness.
8. Exista Funding Need.
9. Exista Use-of-Funds model.
10. Requested/eligible/offered/funded estén separados.
11. Exista Fundability Assessment.
12. Fundability no implique approval.
13. Existan Blocking Factors.
14. Existan Improvement Opportunities.
15. Exista dynamic Funding Checklist.
16. Exista Document Inventory/Freshness.
17. Exista Credit Consent.
18. Exista Financial Profile.
19. Exista Revenue Reconciliation.
20. Transfers/loan proceeds no se cuenten como revenue.
21. Exista Expense Normalization.
22. Add-backs sean transparentes.
23. Exista Cash Flow Profile.
24. Exista Bank Statement Profile.
25. Exista Debt Schedule.
26. Exista Debt Reconciliation.
27. Exista DSCR Methodology Registry.
28. DSCR tenga calculation trace.
29. Exista Tax Return Record.
30. Existan P&L/Balance Sheet/Cash Flow records.
31. Exista Financial Package.
32. Exista Underwriting Readiness.
33. Exista Funding Product Registry.
34. Products tengan source/version/freshness.
35. Exista Product Eligibility Rule Engine.
36. Hard/soft rules estén separadas.
37. Missing data no se convierta en fail.
38. Exista explainable Product Screening.
39. Exista SBA Program layer.
40. Existan microloan/LOC/term/equipment/card families.
41. Existan alternative financing families.
42. Grants estén separados de debt.
43. Existan Product Risk/Disclosure Profiles.
44. Exista Matching Input Snapshot.
45. Exista Matching Run.
46. Exista Match Explanation.
47. Preference y eligibility estén separadas.
48. Exista provider overlay.
49. Exista eligibility freshness gate.
50. Exista Application Package.
51. Minimum-necessary sharing esté implementado.
52. Sensitive data tenga explicit mapping.
53. Exista Client Consent.
54. Exista Referral Record.
55. Exista Application Record.
56. Exista application idempotency.
57. Raw provider statuses se conserven.
58. Exista Additional Information workflow.
59. Approved/declined solo provengan del lender/provider.
60. Decline reasons se preserven.
61. Exista Offer Record.
62. Exista Offer Verification.
63. Exista normalized Offer Comparison.
64. Costs/fees/frequency/PG/collateral sean visibles.
65. Exista Client Selection.
66. Exista Funding Confirmation.
67. Requested/offered/accepted/funded/net-disbursed estén separados.
68. Exista Funding Client Portal.
69. Exista Product Education.
70. Exista Recommendation Record.
71. Recommendations sean explicables.
72. Hidden commission ranking esté prohibido.
73. Exista Disclosure Registry.
74. Exista Consent Center.
75. Exista credit-pull transparency.
76. Exista Partner Referral Disclosure.
77. Exista Commission Record.
78. Commission recognition siga contract.
79. Exista conflict-of-interest control.
80. Exista Post-Funding Plan.
81. Exista Funding Lifecycle.
82. Exista Bookkeeping Handoff.
83. Exista Tax Handoff.
84. Exista Debt Schedule Update.
85. Exista Renewal Readiness.
86. Exista Refinance Readiness.
87. Exista Decline Recovery.
88. No exista future approval guarantee.
89. Exista Provider Registry integration.
90. Exista Provider Capability Matrix.
91. Exista Provider Health/SLA.
92. Exista safe fallback.
93. Exista data-sharing governance.
94. Exista credential security.
95. Exista webhook inbox/idempotency.
96. Exista polling fallback.
97. Exista Automation Engine.
98. Existan automation risk levels.
99. High-risk actions requieran gates.
100. Existan prohibited automations.
101. IA use current verified product/provider data.
102. IA no invente approvals/offers.
103. Exista Funding Compliance Framework.
104. Existan Compliance Findings.
105. Exista high-cost product control.
106. Exista recommendation conflict review.
107. Exista Admin Console.
108. Existan Work Queues.
109. Exista Assignment Engine.
110. Exista SLA Tracking.
111. Exista MFA/RBAC/ABAC.
112. Exista sensitive-data isolation.
113. Exista Export Governance.
114. Exista Break-Glass.
115. Exista Security Incident workflow.
116. Exista immutable Audit Trail.
117. Exista Observability.
118. Existan Alerts.
119. Existan Analytics Dashboards.
120. Exista Metric Governance.
121. Funding principal no se cuente como SG revenue.
122. Exista Data Portability.
123. Exista Migration In/Out.
124. Exista Business Continuity.
125. Exista Disaster Recovery priority.
126. Existan E2E tests.
127. Toda cifra material tenga source/period.
128. Toda product rule tenga version/source.
129. Toda application tenga consent/package hash.
130. Toda lender decision preserve raw source.
131. Toda offer esté verificable.
132. Toda commission sea auditable.
133. Toda sensitive access quede registrado.
134. Ningún retry duplique application.
135. Ninguna IA prometa aprobación.
136. La plataforma funcione en español e inglés.
137. El código use identifiers en inglés.
138. Las seis partes estén integradas.
139. El módulo sea implementable por Codex con boundaries claros.
140. El módulo opere end-to-end de forma trazable.

### Instrucciones finales para Codex

1. Lee las seis partes completas.
2. Reutiliza Módulos 30–34.
3. Reutiliza Organizations, Persons, Documents, Tasks, Approvals, Marketplace, Partners, Billing, Messaging y Audit.
4. Mantén Funding domain separado de Provider adapters.
5. Versiona Funding Profiles.
6. Versiona Financial Packages.
7. Versiona Product Registry.
8. Versiona provider rules.
9. Conserva sources/freshness.
10. No hardcodees lender/product terms cambiantes.
11. Mantén Readiness separado de Eligibility.
12. Mantén Eligibility separado de actual lender decision.
13. Implementa explainable matching.
14. Implementa minimum-necessary sharing.
15. Implementa scoped consent.
16. Implementa application idempotency.
17. Conserva raw provider responses.
18. Implementa verified offers.
19. Implementa transparent comparisons.
20. Implementa recommendation explainability.
21. Mantén commission fuera del hidden ranking.
22. Implementa post-funding handoffs.
23. Implementa Provider Capability/Health/SLA.
24. Implementa webhook inbox/polling.
25. Implementa automation risk levels.
26. Limita AI.
27. Implementa compliance findings.
28. Implementa high-cost disclosures.
29. Implementa Admin Console/Queues.
30. Implementa MFA/RBAC/ABAC.
31. Implementa sensitive-data isolation.
32. Implementa Export Governance.
33. Implementa immutable Audit.
34. Implementa Observability/Alerts.
35. Implementa Analytics + Metric Governance.
36. Implementa Migration/Portability.
37. Implementa Continuity/Recovery.
38. Ejecuta todos los E2E tests.
39. No marques el módulo listo si hay approval guarantees.
40. No marques el módulo listo si una application puede salir sin consent.
41. No marques el módulo listo si un retry puede crear duplicate application.
42. No marques el módulo listo si un offer puede mostrarse verified sin source.
43. No marques el módulo listo si commission puede alterar recommendation sin disclosure.
44. No marques el módulo listo si sensitive data aparece en logs/analytics.

### Verificación final para entrega

- ¿Funding Profile conserva source lineage?
- ¿Financial Package es reconciliado/versionado?
- ¿Product Registry es current y versionado?
- ¿Readiness, eligibility y lender decision están separados?
- ¿Matching es explicable?
- ¿Consent cubre exactamente los datos compartidos?
- ¿Applications son idempotentes?
- ¿Raw provider statuses/decisions se preservan?
- ¿Offers son verificadas?
- ¿Comparisons muestran verdadero payment frequency y known costs?
- ¿Recommendations explican tradeoffs?
- ¿Commission no controla hidden ranking?
- ¿High-cost products muestran warnings?
- ¿Post-funding actualiza debt/bookkeeping?
- ¿IA usa current verified product rules?
- ¿Sensitive data está protegida?
- ¿Funding principal se excluye de SG revenue?
- ¿Business Continuity evita duplicate submissions?
- ¿Los ocho escenarios E2E pasan?

# Estado Final del Módulo 35

```text
MÓDULO 35:
BUSINESS FUNDING

PARTES:
1. Funding Intake, Profile, Fundability y Readiness
2. Financial Profile, Cash Flow, Debt, DSCR y Underwriting Readiness
3. Product Registry, SBA, Loans, LOC, Equipment, Cards y Alternatives
4. Matching, Applications, Decisions y Offers
5. Client Portal, Comparisons, Disclosures, Commissions y Lifecycle
6. Partners, Automation, AI, Compliance, Security, Analytics y Cierre

SECCIONES:
4206–4595

ESTADO:
MODULE COMPLETE
```

