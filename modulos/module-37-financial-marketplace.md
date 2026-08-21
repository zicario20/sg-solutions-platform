# SG Solutions Platform — Módulo 37: Financial Marketplace

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 37. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus cinco partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, marketplace taxonomy, catalog, listings, offers, providers, availability, discovery, search y browse | 4986–5050 | **COMPLETE** |
| 2 | Eligibility context, marketplace matching, comparison, ranking inputs, personalization boundaries, disclosures y recommendation handoff | 5051–5115 | **COMPLETE** |
| 3 | Referral/application journeys, lead routing, consent, attribution, partner handoffs, status synchronization y conversion tracking | 5116–5180 | **COMPLETE** |
| 4 | Client marketplace portal, saved items, journeys, commissions, economics, partner operations, disputes, quality y lifecycle | 5181–5245 | **COMPLETE** |
| 5 | Integrations, automation, AI, governance, security, admin, analytics, migration, continuity, E2E y cierre | 5246–5310 | **COMPLETE** |

**Estado global del Módulo 37:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Marketplace Taxonomy, Catalog, Listings, Offers, Providers, Availability, Discovery, Search y Browse

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 36 — Home Buying Assistance Nationwide  
**Secciones incluidas:** 4986–5050  
**Audiencia:** Owner, Codex, product managers, marketplace operators, partner managers, compliance, analysts, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Marketplace multi-producto que agrega, organiza, descubre y refiere productos/servicios financieros y empresariales; los terms y decisiones oficiales permanecen bajo el provider/domain source correspondiente

---

## 4986. Objetivo del Módulo 37

El Módulo 37 creará una capa de marketplace sobre la plataforma SG Solutions para permitir:

- descubrir productos y servicios;
- buscar;
- filtrar;
- comparar;
- guardar opciones;
- entender requisitos;
- iniciar referrals;
- continuar journeys;
- conectar con providers/partners;
- medir conversion;
- gobernar listings y compensation.

El marketplace deberá reutilizar domain registries existentes en vez de duplicarlos.

---

## 4987. Marketplace Principle

```text
verified catalog source
→ normalized marketplace listing
→ discovery
→ transparent comparison
→ client choice
→ consent
→ partner/domain handoff
→ tracked outcome
```

Nunca:

```text
sponsored placement
→ undisclosed "best product"
```

---

## 4988. Marketplace Role Boundary

SG Solutions podrá operar como:

```text
educator
marketplace_operator
comparison_platform
referral_partner
application_assistance_coordinator
service_provider_for_SG_services
```

No deberá presentarse automáticamente como:

```text
bank
lender
mortgage_originator
credit_card_issuer
insurance_carrier
CRA
investment_adviser
```

---

## 4989. Marketplace Domain Boundary

El marketplace no deberá convertirse en source of truth de reglas complejas que ya pertenecen a otros módulos.

Ejemplos:

```text
Business Funding terms → Módulo 35
Home Buying programs → Módulo 36
Tax services → Módulo 30
Bookkeeping → Módulo 31
Business Formation → Módulo 32
EIN → Módulo 33
Compliance → Módulo 34
```

Marketplace mantiene referencias/versiones publicables.

---

## 4990. Reutilización obligatoria

Reutilizar:

- Clients;
- Persons;
- Organizations;
- Service Catalog;
- Service Orders;
- Partners;
- Providers;
- Documents;
- Forms;
- Tasks;
- Approvals;
- Messaging;
- Billing;
- Consent;
- Audit;
- Analytics;
- AI Hub;
- domain product/program registries.

---

## 4991. Marketplace Catalog

El catálogo deberá agrupar:

```text
SG_services
third_party_products
third_party_services
programs
referral_offers
educational_resources
bundles_future
```

---

## 4992. Marketplace Category

Campos:

```text
id
categoryCode
parentCategoryId
displayName
description
iconReference
sortOrder
status
createdAt
updatedAt
```

---

## 4993. Initial Marketplace Categories

```text
business_funding
business_credit_cards
business_banking
personal_credit_cards
personal_banking
home_buying
mortgage_and_DPA
credit_building
credit_monitoring
business_formation
business_compliance
bookkeeping
tax_preparation
insurance
financial_education
other
```

Algunas categorías podrán lanzarse después del MVP.

---

## 4994. Category Hierarchy

Ejemplo:

```text
Business
├── Funding
├── Credit Cards
├── Banking
├── Formation
├── Compliance
└── Bookkeeping

Personal
├── Credit Cards
├── Banking
├── Home Buying
├── Credit Building
└── Insurance
```

La hierarchy deberá ser configurable.

---

## 4995. Marketplace Item

Entidad genérica:

```text
id
itemType
domain
domainResourceId
domainResourceVersion
providerId
categoryId
status
createdAt
updatedAt
```

---

## 4996. Marketplace Item Types

```text
SG_service
financial_product
financial_program
partner_service
educational_resource
referral_offer
bundle_future
```

---

## 4997. Domain Reference Principle

`MarketplaceItem` deberá referenciar la entidad fuente.

Ejemplos:

```text
M35 FundingProductVersion
M36 HousingProgramVersion
ServiceCatalogItem
PartnerService
```

No copiar silenciosamente terms que puedan quedar stale.

---

## 4998. Marketplace Listing

Campos:

```text
id
marketplaceItemId
listingVersion
title
shortDescription
longDescription
highlights
limitations
disclosures
availability
CTAConfig
localeContent
status
effectiveFrom
effectiveTo
```

---

## 4999. Listing versus Product

La plataforma deberá distinguir:

```text
product/program/service facts
```

de:

```text
marketing/presentation listing
```

El listing no podrá contradecir el source product.

---

## 5000. Listing Status

```text
draft
review
approved
published
paused
expired
retired
rejected
```

Solo `published` podrá aparecer públicamente.

---

## 5001. Listing Versioning

Nueva versión ante cambio material de:

- title/description;
- costs;
- promotional claims;
- eligibility summary;
- CTA;
- disclosures;
- provider;
- availability;
- compensation disclosure.

---

## 5002. Listing Source Snapshot

Campos:

```text
domainResourceId
domainResourceVersion
sourceVerifiedAt
listingGeneratedAt
sourceFreshnessStatus
```

---

## 5003. Listing Freshness Gate

Antes de publish o render material:

```text
source exists
source version current
provider active
listing approved
required disclosures current
```

---

## 5004. Marketplace Provider Profile

Campos:

```text
providerId
displayName
legalName
providerType
logoReference
description
jurisdictions
serviceCategories
verificationStatus
partnerStatus
supportChannels
publicDisclosures
```

---

## 5005. Provider Types

```text
SG_Solutions
bank
credit_union
lender
mortgage_provider
card_issuer
fintech
insurance_provider
tax_provider
bookkeeping_provider
registered_agent_provider
formation_provider
credit_monitoring_provider
education_provider
other
```

---

## 5006. Provider Verification

Estados:

```text
not_verified
verification_in_progress
verified
verification_due
restricted
suspended
terminated
unknown
```

---

## 5007. Provider Public Profile Boundary

La página pública no deberá mostrar:

- internal risk notes;
- private contract details;
- credentials/secrets;
- nonpublic compensation;
- confidential performance data.

---

## 5008. Marketplace Offer

Una oferta marketplace representa una presentación comercial/publicable.

Campos:

```text
id
marketplaceItemId
providerId
offerVersion
headline
benefitSummary
pricingSummary
termsSummary
eligibilitySummary
CTA
effectiveFrom
effectiveTo
status
```

---

## 5009. Offer versus Lender Offer

`MarketplaceOffer` no es equivalente a:

```text
personalized lender offer
```

de M35/M36.

Marketplace offer es general/publicable.

Personalized external offer requiere source específico del provider.

---

## 5010. Offer Status

```text
draft
active
limited
paused
expired
retired
verification_required
```

---

## 5011. Promotional Offer

Campos:

```text
promotionType
promotionValue
eligibilityConditions
startDate
endDate
source
disclosureVersion
```

No deberá mostrarse después de expiration.

---

## 5012. Pricing Summary

El marketplace deberá permitir:

```text
free
subscription
one_time_fee
percentage_fee
APR_or_rate_context
factor_rate_context
annual_fee
variable_pricing
provider_quote_required
unknown
```

---

## 5013. Pricing Accuracy Boundary

Cuando pricing sea variable o client-specific:

```text
"From"
"Range"
"Provider quote required"
```

según source.

Nunca inventar un precio único.

---

## 5014. Eligibility Summary

Podrá mostrar:

```text
common_requirements
published_minimums
geography
business_or_personal_context
time_in_business
income_or_revenue_context
credit_context
property_context
other
```

pero no sustituye domain screening.

---

## 5015. Availability Record

Campos:

```text
marketplaceItemId
jurisdiction
audience
channel
startAt
endAt
status
inventoryOrFundingContext
source
```

---

## 5016. Availability Status

```text
available
limited
waitlist
temporarily_unavailable
funding_exhausted
not_available
verification_required
unknown
```

---

## 5017. Audience Segment

Ejemplos:

```text
individual
homebuyer
business_owner
startup
established_business
self_employed
existing_SG_client
new_client
```

Segment es context, no protected-class targeting.

---

## 5018. Marketplace Eligibility Boundary

Parte 1 solo modela eligibility summaries.

La evaluación individual detallada deberá ocurrir mediante:

```text
domain screening
```

y en Parte 2.

---

## 5019. Listing Disclosure Set

Cada listing podrá requerir:

```text
provider_identity
SG_role
not_a_guarantee
pricing_disclosure
compensation_disclosure
data_sharing_notice
eligibility_disclaimer
sponsored_placement
affiliate_relationship
other
```

---

## 5020. Disclosure Version Reference

Campos:

```text
disclosureCode
disclosureVersion
requiredForListing
requiredBeforeCTA
requiredBeforeReferral
```

---

## 5021. Listing Content Governance

Contenido deberá pasar:

```text
draft
→ source check
→ compliance review when required
→ approval
→ publish
```

---

## 5022. Prohibited Listing Claims

No permitir:

```text
guaranteed approval
guaranteed credit increase
guaranteed deletion
best rate guaranteed
everyone qualifies
free money
instant approval
0% down guaranteed
```

salvo lenguaje literal y lawful de source con context/disclosure apropiado.

---

## 5023. Marketplace Localization

Cada listing podrá tener:

```text
en-US
es-US
```

con fallback controlado.

Terms financieros sensibles no deberán traducirse de manera que cambie significado.

---

## 5024. Content Translation Record

Campos:

```text
listingVersionId
locale
translationSource
reviewStatus
reviewedBy
reviewedAt
```

---

## 5025. Marketplace Browse

Vistas iniciales:

```text
Featured
For Your Business
For Your Personal Finances
Buy a Home
Build Credit
Start a Business
Manage Your Business
Taxes
Explore All
```

---

## 5026. Browse Collection

Campos:

```text
id
collectionCode
title
description
itemIds
rankingMode
startAt
endAt
status
```

---

## 5027. Collection Ranking Modes

```text
manual
editorial
relevance
popularity
recent
personalized_future
sponsored_with_disclosure
```

---

## 5028. Sponsored Placement Boundary

Sponsored placement deberá:

- estar claramente identificado;
- no presentarse como objective best match;
- conservar campaign/compensation reference;
- cumplir marketplace policy.

---

## 5029. Marketplace Search

Search deberá soportar:

- keyword;
- category;
- provider;
- product type;
- geography;
- business/personal context;
- price/fee context;
- feature;
- availability.

---

## 5030. Search Index Document

Campos:

```text
marketplaceItemId
listingVersionId
title
description
categoryTokens
providerTokens
featureTokens
geographyTokens
audienceTokens
availability
updatedAt
```

---

## 5031. Search Source Integrity

El search index es derived data.

Cuando listing se retire:

```text
listing unpublished
→ index removal
```

deberá ser eventual pero auditable.

---

## 5032. Search Result

Campos:

```text
marketplaceItemId
listingVersionId
relevanceScore
matchedFields
sponsoredFlag
availabilityStatus
sourceFreshnessStatus
```

---

## 5033. Search Ranking Boundary

Search ranking podrá usar relevance/quality.

No deberá ocultar sponsored ranking.

---

## 5034. Marketplace Filters

Ejemplos:

```text
category
provider
state
business_or_personal
fee_type
product_family
funding_amount_range
homebuyer_program_type
service_delivery_model
availability
```

---

## 5035. Dynamic Filter Principle

Los filters deberán derivarse de:

```text
current active catalog
```

para evitar mostrar opciones imposibles.

---

## 5036. Marketplace Sort

```text
recommended_future
relevance
alphabetical
lowest_known_fee
highest_rating_future
newest
featured
```

Sort deberá explicar su lógica cuando pueda influir materialmente.

---

## 5037. Featured Item

Campos:

```text
marketplaceItemId
placement
startAt
endAt
reason
sponsoredFlag
campaignIdOptional
approvedBy
```

---

## 5038. Marketplace Badge

Tipos:

```text
SG_service
verified_provider
new
popular
limited_time
no_known_fee
requires_quote
sponsored
education_required
manual_review
```

Badges deberán tener deterministic rules.

---

## 5039. Marketplace Detail Page

Secciones:

```text
Overview
Provider
How It Works
Key Features
Costs
Eligibility Context
Required Documents
Limitations
Disclosures
FAQ
Next Step
```

---

## 5040. Detail Page Source Lineage

Cada sección material deberá poder rastrearse a:

```text
domain source
provider source
approved editorial content
disclosure registry
```

---

## 5041. Marketplace CTA Types

```text
learn_more
check_potential_fit
compare
save
start_SG_service
request_referral
visit_provider
start_application_future
contact_specialist
```

---

## 5042. CTA Eligibility

El CTA disponible dependerá de:

```text
itemType
deliveryModel
providerCapability
clientState
consentState
jurisdiction
availability
```

---

## 5043. External Link Governance

Links externos deberán:

- provenir de verified provider config;
- usar allowlist;
- poder expirar/versionarse;
- registrar click attribution cuando permitido;
- evitar open redirects.

---

## 5044. Save / Favorite Record

Campos:

```text
id
clientId
marketplaceItemId
listingVersionId
savedAt
status
```

---

## 5045. Recently Viewed Record

Podrá guardar:

```text
clientId
marketplaceItemId
viewedAt
sourceSurface
```

sujeto a privacy settings/retention.

---

## 5046. Marketplace Session Context

Campos:

```text
sessionId
clientIdOptional
anonymousSessionIdOptional
locale
jurisdictionContext
entryPoint
categoryContext
consentState
createdAt
```

---

## 5047. Anonymous Browse Boundary

La plataforma podrá permitir browse anónimo.

No deberá:

- solicitar sensitive data innecesariamente;
- crear eligibility conclusions personalizadas sin facts;
- mezclar anonymous identity con client profile sin consent/appropriate login.

---

## 5048. Marketplace Content Finding

Tipos:

```text
stale_source
pricing_mismatch
availability_mismatch
missing_disclosure
provider_status_issue
translation_issue
broken_CTA
unsupported_claim
duplicate_listing
domain_reference_missing
```

---

## 5049. Permissions, APIs, Events and Workflows

### Permisos

```text
marketplace.catalog.read
marketplace.catalog.manage

marketplace.category.read
marketplace.category.manage

marketplace.item.read
marketplace.item.manage

marketplace.listing.read
marketplace.listing.create
marketplace.listing.review
marketplace.listing.publish

marketplace.provider.read
marketplace.provider.manage

marketplace.offer.read
marketplace.offer.manage

marketplace.collection.read
marketplace.collection.manage
```

### APIs

```text
GET  /api/marketplace/categories
GET  /api/marketplace/items
GET  /api/marketplace/items/{id}

POST /api/marketplace/items
POST /api/marketplace/listings
POST /api/marketplace/listings/{id}/versions
POST /api/marketplace/listings/{id}/publish

GET  /api/marketplace/providers/{id}
GET  /api/marketplace/search
GET  /api/marketplace/collections

POST /api/marketplace/items/{id}/save
DELETE /api/marketplace/items/{id}/save
```

### Eventos

```text
MarketplaceItemCreated
MarketplaceListingCreated
MarketplaceListingApproved
MarketplaceListingPublished
MarketplaceListingPaused
MarketplaceListingExpired
MarketplaceSourceMarkedStale
MarketplaceProviderStatusChanged
MarketplaceOfferActivated
MarketplaceOfferExpired
MarketplaceItemSaved
MarketplaceItemViewed
MarketplaceContentFindingCreated
```

### Workflows

```text
Marketplace Catalog Workflow
Listing Publication Workflow
Listing Freshness Workflow
Provider Verification Workflow
Offer Lifecycle Workflow
Collection Workflow
Search Index Workflow
Marketplace Content Review Workflow
```

## 5050. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Marketplace Category.
2. Crear nested category.
3. Crear Marketplace Item.
4. Referenciar M35 Funding Product.
5. Referenciar M36 Housing Program.
6. Referenciar SG Service.
7. Crear Listing.
8. Versionar Listing.
9. Separar listing/product facts.
10. Bloquear stale source.
11. Crear Provider Profile.
12. Marcar provider verification due.
13. Crear Marketplace Offer.
14. Separar Marketplace Offer de personalized lender offer.
15. Crear promotion.
16. Expirar promotion.
17. Crear variable pricing summary.
18. Crear eligibility summary.
19. Crear availability rule.
20. Marcar funding exhausted.
21. Crear audience segment.
22. Crear disclosure set.
23. Bloquear missing disclosure.
24. Ejecutar content review.
25. Bloquear unsupported guarantee claim.
26. Crear Spanish translation.
27. Crear Browse Collection.
28. Crear editorial collection.
29. Crear sponsored collection item.
30. Mostrar sponsored disclosure.
31. Indexar listing.
32. Buscar por keyword.
33. Filtrar por state.
34. Filtrar por provider.
35. Filtrar por category.
36. Eliminar retired listing del search index.
37. Mostrar Search Result metadata.
38. Probar dynamic filters.
39. Probar sort.
40. Crear Featured Item.
41. Crear badges.
42. Renderizar detail page.
43. Validar source lineage.
44. Renderizar CTA.
45. Bloquear CTA por unavailable provider.
46. Validar external allowlisted link.
47. Crear Saved Item.
48. Eliminar Saved Item.
49. Crear Recently Viewed.
50. Crear anonymous marketplace session.
51. Bloquear personalized eligibility sin facts.
52. Crear stale-source finding.
53. Crear broken-CTA finding.
54. Probar permissions.
55. Probar APIs.
56. Probar events/outbox.
57. Probar workflows.
58. Probar immutable audit.
59. Probar tenant/privacy isolation.
60. Probar bilingual listing.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Marketplace Catalog.
2. Exista Category hierarchy.
3. Exista Marketplace Item.
4. Existan Item Types.
5. Exista domain-reference principle.
6. Exista Marketplace Listing.
7. Listing y product facts estén separados.
8. Exista Listing Status.
9. Exista Listing Versioning.
10. Exista source snapshot.
11. Exista freshness gate.
12. Exista Provider Profile.
13. Exista Provider Verification.
14. Public profile excluya internal confidential data.
15. Exista Marketplace Offer.
16. Marketplace Offer esté separado de personalized lender offer.
17. Exista promotional-offer support.
18. Exista Pricing Summary.
19. Variable pricing pueda quedar unknown/quote-required.
20. Exista Eligibility Summary.
21. Exista Availability Record.
22. Existan Availability Statuses.
23. Exista Audience Segment.
24. Eligibility individual detallada quede fuera de Parte 1.
25. Exista Listing Disclosure Set.
26. Exista disclosure version reference.
27. Exista Content Governance.
28. Existan prohibited claims.
29. Exista Localization.
30. Exista Translation Record.
31. Exista Marketplace Browse.
32. Exista Browse Collection.
33. Existan Collection Ranking Modes.
34. Sponsored placement sea disclosed.
35. Exista Marketplace Search.
36. Exista Search Index.
37. Search index preserve source integrity.
38. Exista Search Result.
39. Search ranking no oculte sponsored results.
40. Existan dynamic Filters.
41. Exista Sort.
42. Exista Featured Item.
43. Existan Badges.
44. Exista Detail Page.
45. Detail Page tenga source lineage.
46. Existan CTA Types.
47. CTA dependa de capability/availability.
48. External links sean allowlisted.
49. Exista Save/Favorite.
50. Exista Recently Viewed.
51. Exista Marketplace Session Context.
52. Exista anonymous browse.
53. Existan Marketplace Content Findings.
54. Existan permisos/APIs/events/workflows.
55. Parte 1 termine lista para Eligibility/Comparison de Parte 2.

### Instrucciones para Codex

1. Lee Módulos 30–36 antes de implementar domain references.
2. No dupliques FundingProduct/HousingProgram data.
3. Implementa generic MarketplaceItem.
4. Implementa domainResourceId/domainResourceVersion.
5. Implementa Listing separado de product facts.
6. Versiona listings.
7. Implementa source snapshot/freshness.
8. Implementa Provider Public Profile.
9. Implementa MarketplaceOffer separado de personalized offers.
10. Implementa pricing summary con explicit unknown.
11. Implementa availability.
12. Implementa disclosure sets.
13. Bloquea prohibited claims.
14. Implementa en-US/es-US.
15. Implementa collections.
16. Marca sponsored placement.
17. Implementa search index derived.
18. Elimina/oculta unpublished items correctamente.
19. Implementa filters/sort.
20. Implementa detail page con lineage.
21. Implementa capability-aware CTAs.
22. Implementa allowlisted external links.
23. Implementa Save/Recently Viewed.
24. Implementa anonymous browse con privacy boundary.
25. Implementa Content Findings.
26. Implementa permissions/APIs/events/workflows.
27. Implementa immutable audit.
28. No marques Parte 1 completa si un listing puede publicarse con source stale o disclosure faltante.

### Verificación final de Parte 1

- ¿Marketplace reutiliza domain registries?
- ¿Listing y source product están separados?
- ¿Cada listing tiene version/freshness?
- ¿Providers tienen verification status?
- ¿Marketplace offer no se confunde con personalized offer?
- ¿Pricing variable puede mostrarse honestamente?
- ¿Availability puede expirar?
- ¿Sponsored placement se identifica?
- ¿Search index se actualiza al retirar listings?
- ¿CTA respeta provider capability?
- ¿Anonymous browse evita sensitive profiling?
- ¿Toda claim material tiene source?
- ¿Toda publicación queda auditada?

---

# Parte 2 — Eligibility Context, Marketplace Matching, Comparison, Ranking Inputs, Personalization Boundaries, Disclosures y Recommendation Handoff

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 37 — Parte 1  
**Secciones incluidas:** 5051–5115  
**Audiencia:** Owner, Codex, product managers, marketplace operators, data analysts, partner managers, compliance, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Marketplace matching explicable y no decisorio que reutiliza domain-specific eligibility engines, compara información normalizada, personaliza únicamente con datos permitidos y entrega señales estructuradas al futuro Módulo 38 Recommendation Engine

## 5051. Objetivo de Parte 2

Esta parte transforma el marketplace desde un catálogo de browse/search en una experiencia de:

```text
client context
→ domain eligibility context
→ marketplace matching
→ comparison
→ ranking
→ explanation
→ disclosure
→ recommendation handoff
```

sin duplicar underwriting ni eligibility logic de los módulos fuente.

## 5052. Eligibility Context Principle

Marketplace deberá preguntar:

```text
"¿Qué sabemos suficientemente para identificar opciones potenciales?"
```

y no:

```text
"¿Podemos aprobar al cliente?"
```

## 5053. Marketplace Eligibility Context

Campos:

```text
id
clientId
organizationIdOptional
sessionId
contextVersion
financialContext
businessContext
homebuyingContext
geographyContext
preferenceContext
consentContext
sourceReferences
createdAt
```

## 5054. Context Sources

Podrá reutilizar:

```text
client profile
organization profile
M35 Funding Profile
M36 Homebuyer Profile
M30 Tax context
M31 Bookkeeping context
client answers
anonymous session answers
provider/program public rules
```

## 5055. Context Source Priority

Datos verificados deberán diferenciarse de:

```text
self_reported
estimated
derived
provider_verified
SG_verified
domain_verified
unknown
```

## 5056. Context Versioning

Cambios materiales deberán crear nueva versión:

- state;
- business type;
- income/revenue;
- requested amount;
- purchase goal;
- credit context;
- time in business;
- homeowner status;
- provider preference;
- fees/cost preference.

## 5057. Context Minimization

Marketplace deberá solicitar solo datos necesarios para:

```text
discovery
screening
comparison
referral readiness
```

No deberá pedir SSN, bank account number o tax documents durante simple browse.

## 5058. Anonymous Eligibility Context

Para anonymous users podrá existir:

```text
anonymousContextId
state
category
highLevelAnswers
preferences
expiresAt
```

sin crear una client identity automáticamente.

## 5059. Authenticated Context Upgrade

Cuando anonymous user inicia sesión:

```text
anonymous context
→ review
→ consent
→ merge selected facts
→ authenticated context version
```

No merge silencioso.

## 5060. Domain Screening Adapter

Marketplace deberá llamar adapters como:

```text
screenBusinessFunding()
screenHomebuyingPrograms()
screenSGServices()
screenPartnerService()
```

en vez de reimplementar las reglas.

## 5061. Domain Screening Contract

Input:

```text
clientContextSnapshot
domainResourceVersion
requestedPurpose
```

Output:

```text
potentialFitStatus
matchedRules
failedRules
unknownRules
conditions
sourceReferences
screeningVersion
```

## 5062. Marketplace Potential Fit Status

Normalización:

```text
potential_fit
potential_fit_with_conditions
needs_information
unlikely_fit
not_available
manual_review_required
unknown
```

Nunca:

```text
approved
guaranteed
```

## 5063. Screening Freshness Gate

Antes de usar un result:

```text
context current
domain resource current
domain rule current
provider current
screening not expired
```

## 5064. Marketplace Match Record

Campos:

```text
id
clientIdOptional
sessionId
marketplaceItemId
listingVersionId
domainScreeningIdOptional
potentialFitStatus
matchFactors
unknownFactors
riskFlags
createdAt
```

## 5065. Match Factors

Ejemplos:

```text
geography
business_stage
time_in_business
revenue
funding_need
homebuyer_goal
property_context
program_interest
cost_preference
language
service_need
```

## 5066. Unknown Factor Handling

Unknown deberá permanecer:

```text
unknown
```

No convertirlo en favorable ni desfavorable sin basis.

## 5067. Match Explanation

La UI deberá poder explicar:

- why this item appeared;
- what data was used;
- what remains unknown;
- what condition may apply;
- which source/domain produced the fit result.

## 5068. Marketplace Match Confidence

Opcional:

```text
high
medium
low
insufficient_information
```

No deberá interpretarse como approval probability.

## 5069. Match Expiration

Campos:

```text
evaluatedAt
expiresAt
resourceVersion
contextVersion
```

Si cualquiera cambia materialmente, rematch.

## 5070. Comparison Workspace

El marketplace deberá permitir seleccionar:

```text
2..N items
```

para comparación side-by-side.

## 5071. Comparison Schema

Campos normalizados:

```text
provider
category
productOrServiceType
costStructure
knownFees
termOrDuration
eligibilityContext
benefits
limitations
availability
deliveryModel
nextStep
disclosures
```

## 5072. Domain-Specific Comparison Fields

Ejemplos:

Business Funding:

```text
amount
term
paymentFrequency
APR_or_factor
fees
collateral
PG
```

Homebuying:

```text
programType
downPayment
assistanceType
incomeLimitContext
purchasePriceLimit
occupancy
```

Services:

```text
serviceFee
deliveryTimeEstimate
includedServices
partnerDependency
```

## 5073. Comparison Field Provenance

Cada field material deberá contener:

```text
value
source
sourceVersion
verifiedAt
status
```

## 5074. Missing Comparison Value

Mostrar:

```text
Not provided
Varies by provider
Requires quote
Requires screening
Unknown
```

No usar `0` como placeholder.

## 5075. Cost Comparison Boundary

El marketplace deberá evitar comparar métricas distintas como si fueran equivalentes.

Ejemplo:

```text
annual_fee
vs
APR
vs
factor_rate
vs
one_time_service_fee
```

## 5076. Normalized Cost Context

Cuando sea posible podrá calcular:

```text
estimated_cost
```

solo con:

```text
approved methodology
explicit assumptions
source fields
confidence
```

## 5077. Comparison Warning

Cuando los products no sean directamente comparables:

```text
comparisonWarning = true
```

y explicar por qué.

## 5078. Comparison Record

Campos:

```text
id
clientIdOptional
sessionId
marketplaceItemIds
listingVersionIds
comparisonSchemaVersion
createdAt
```

## 5079. Saved Comparison

Authenticated client podrá guardar comparison.

Campos:

```text
comparisonId
savedAt
nameOptional
status
```

## 5080. Ranking Inputs

Marketplace ranking podrá considerar:

```text
relevance
potentialFit
clientPreferences
availability
sourceFreshness
providerQuality
costContext
featureFit
deliverySpeedEstimate
editorialPriority
sponsoredPlacement
```

## 5081. Ranking Input Separation

El engine deberá separar:

```text
organicRankingSignals
sponsoredSignals
editorialSignals
personalizationSignals
```

## 5082. Ranking Version

Campos:

```text
rankingModelVersion
featureSetVersion
policyVersion
createdAt
```

## 5083. Organic Ranking

Deberá optimizar:

```text
relevance
usefulness
fit
quality
freshness
```

sin compensation oculta.

## 5084. Sponsored Ranking

Sponsored results:

- podrán ocupar defined placements;
- deberán identificarse;
- no alterarán silently el organic score;
- deberán registrar campaign.

## 5085. Editorial Ranking

Curated lists deberán registrar:

```text
editorialReason
approvedBy
effectiveFrom
effectiveTo
```

## 5086. Provider Quality Signal

Podrá incluir:

```text
verificationStatus
dataFreshness
operationalAvailability
errorRate
clientExperienceMetrics
complaintRateFuture
```

No deberá basarse en datos no validados.

## 5087. Popularity Signal

Podrá considerar:

```text
views
saves
CTA_clicks
completed_referrals
```

con anti-gaming controls.

## 5088. Personalization Principle

Personalization deberá ser:

```text
helpful
transparent
consent-aware
minimized
reversible
```

## 5089. Personalization Inputs

Permitidos según consent/purpose:

```text
saved_items
recently_viewed
selected_categories
explicit_preferences
known_service_needs
verified_domain_context
language
jurisdiction
```

## 5090. Personalization Exclusions

No usar sin lawful explicit need/policy:

- protected attributes;
- sensitive health data;
- political beliefs;
- unrelated private data;
- raw tax return contents for general ads;
- bank transaction details for unrelated promotion.

## 5091. Financial Data Personalization Boundary

Financial data de módulos internos podrá usarse únicamente cuando:

```text
client expects personalized financial marketplace help
+
purpose is documented
+
access is authorized
```

No para generic ad targeting.

## 5092. Personalization Consent

Campos:

```text
consentId
purpose
dataCategories
surfaces
authorizedAt
expiresAt
withdrawalStatus
```

## 5093. Personalization Off Mode

Cliente podrá desactivar personalization.

Entonces:

```text
browse/search
→ contextual/non-personalized ranking
```

sin perder acceso al marketplace.

## 5094. Personalization Explanation

La UI podrá mostrar:

```text
"Shown because you selected Business Funding and indicated your business is in Illinois."
```

sin revelar sensitive internal logic.

## 5095. Ranking Explanation Record

Campos:

```text
marketplaceItemId
rankingPosition
organicFactors
personalizationFactors
sponsoredFlag
editorialFlag
modelVersion
createdAt
```

## 5096. Ranking Auditability

Para material personalized/sponsored placements deberá poder reconstruirse:

```text
input snapshot
ranking version
policy
result
disclosures
```

## 5097. Marketplace Disclosure Engine

Antes de surfaces/actions deberá determinar:

```text
required disclosures
```

según:

- item;
- provider;
- category;
- sponsored status;
- referral compensation;
- personalization;
- jurisdiction;
- CTA type.

## 5098. Marketplace Disclosure Types

```text
SG_role
provider_identity
not_guaranteed
eligibility_preliminary
sponsored
affiliate_or_referral_compensation
personalization
data_sharing
external_site
pricing_estimate
other
```

## 5099. Disclosure Placement

Podrá requerirse:

```text
listing_card
detail_page
comparison
before_CTA
before_referral
before_data_share
```

## 5100. Disclosure Acknowledgment

Campos:

```text
clientId
disclosureVersion
surface
presentedAt
acknowledgedAtOptional
requiredFlag
```

## 5101. Recommendation Candidate Handoff

Parte 2 deberá producir candidates estructurados para Módulo 38.

Campos:

```text
marketplaceItemId
matchStatus
rankingSignals
comparisonFields
riskFlags
clientPreferences
sourceReferences
freshness
```

## 5102. Módulo 38 Boundary

Módulo 37:

```text
catalog
screening
comparison
ranking inputs
```

Módulo 38:

```text
recommendation reasoning
multi-objective ranking
personalized recommendation policy
explanation strategy
```

No duplicar ambos engines.

## 5103. Recommendation Request Record

Campos:

```text
id
clientId
sessionId
goal
candidateItemIds
contextVersion
constraints
preferenceWeights
createdAt
```

## 5104. Recommendation Response Reference

Módulo 37 deberá almacenar solo referencia:

```text
recommendationId
recommendationVersion
createdAt
```

y renderizar output aprobado de M38.

## 5105. Recommendation Safety Flags

Antes del handoff podrá adjuntar:

```text
high_cost
short_term
sponsored
affiliate
stale_data
manual_review
complex_product
unknown_pricing
```

## 5106. Marketplace "Why This?" UI

Todo recommended/ranked item podrá mostrar:

- match reason;
- source freshness;
- sponsored/affiliate status;
- major tradeoff;
- next step.

## 5107. No Universal Best Product

La plataforma no deberá usar:

```text
Best overall
```

sin defined methodology/context.

Preferir:

```text
Best fit for your selected priorities
Lowest known fee among compared items
Potential fit based on current information
```

## 5108. Eligibility Update Trigger

Cambios en:

- profile;
- geography;
- income/revenue;
- business age;
- funding need;
- homebuyer goal;
- provider rules;

deberán invalidar/recompute relevant matches.

## 5109. Catalog Update Trigger

Cuando source product/program cambia:

```text
domain event
→ listing freshness review
→ match invalidation
→ comparison refresh
→ recommendation invalidation
```

## 5110. Client Feedback Signal

Opcionalmente:

```text
not_relevant
too_expensive
not_available
already_have
prefer_other
helpful
```

Podrá informar personalization sin alterar source facts.

## 5111. Feedback Governance

Feedback:

- no cambia eligibility;
- no cambia provider terms;
- no se interpreta como protected attribute;
- debe poder borrarse según policy.

## 5112. Marketplace Match Finding

Tipos:

```text
stale_match
source_version_mismatch
missing_disclosure
ranking_explanation_missing
personalization_without_consent
comparison_field_conflict
sponsored_flag_missing
recommendation_handoff_error
```

## 5113. Permissions, APIs, Events and Workflows

### Permisos

```text
marketplace.context.read
marketplace.context.manage

marketplace.screening.read
marketplace.screening.run

marketplace.match.read
marketplace.match.manage

marketplace.comparison.read
marketplace.comparison.create

marketplace.ranking.read
marketplace.ranking.explain

marketplace.personalization.read
marketplace.personalization.manage

marketplace.disclosure.read
marketplace.recommendation_handoff.create
```

### APIs

```text
POST /api/marketplace/eligibility-contexts
POST /api/marketplace/screenings
GET  /api/marketplace/matches

POST /api/marketplace/comparisons
GET  /api/marketplace/comparisons/{id}
POST /api/marketplace/comparisons/{id}/save

GET  /api/marketplace/rankings
GET  /api/marketplace/rankings/{id}/explanation

POST /api/marketplace/personalization-consents
POST /api/marketplace/recommendation-requests
POST /api/marketplace/feedback
```

### Eventos

```text
MarketplaceEligibilityContextCreated
MarketplaceEligibilityContextUpdated
MarketplaceScreeningCompleted
MarketplaceMatchCreated
MarketplaceMatchInvalidated
MarketplaceComparisonCreated
MarketplaceComparisonSaved
MarketplaceRankingGenerated
MarketplaceSponsoredPlacementRendered
MarketplacePersonalizationConsentChanged
MarketplaceDisclosurePresented
MarketplaceRecommendationRequested
MarketplaceRecommendationInvalidated
MarketplaceFeedbackSubmitted
MarketplaceMatchFindingCreated
```

### Workflows

```text
Marketplace Eligibility Context Workflow
Domain Screening Workflow
Marketplace Matching Workflow
Comparison Workflow
Ranking Workflow
Personalization Workflow
Disclosure Workflow
Recommendation Handoff Workflow
Match Invalidation Workflow
Feedback Workflow
```

## 5114. Pruebas de Parte 2

Pruebas obligatorias:

1. Crear Eligibility Context.
2. Versionar context.
3. Crear anonymous context.
4. Upgrade anonymous context con consent.
5. Llamar M35 screening adapter.
6. Llamar M36 screening adapter.
7. Normalizar potential-fit status.
8. Aplicar freshness gate.
9. Crear Marketplace Match.
10. Mantener unknown factor.
11. Crear match explanation.
12. Crear match confidence.
13. Expirar match.
14. Crear Comparison Workspace.
15. Comparar funding products.
16. Comparar homebuying programs.
17. Comparar SG services.
18. Conservar field provenance.
19. Mostrar unknown correctamente.
20. Bloquear misleading cost comparison.
21. Crear normalized cost estimate.
22. Mostrar comparison warning.
23. Guardar comparison.
24. Crear ranking inputs.
25. Separar organic/sponsored/editorial/personalization.
26. Versionar ranking.
27. Crear organic ranking.
28. Crear sponsored placement.
29. Crear editorial ranking.
30. Crear provider quality signal.
31. Crear popularity signal.
32. Crear personalization inputs.
33. Bloquear protected attribute.
34. Bloquear unrelated tax-data marketing.
35. Crear personalization consent.
36. Desactivar personalization.
37. Crear personalization explanation.
38. Crear Ranking Explanation Record.
39. Reconstruir ranking audit.
40. Crear Disclosure Engine result.
41. Mostrar sponsored disclosure.
42. Mostrar affiliate disclosure.
43. Registrar acknowledgment.
44. Crear Recommendation Candidate Handoff.
45. Crear Recommendation Request.
46. Crear M38 reference.
47. Crear safety flags.
48. Renderizar Why This.
49. Bloquear universal-best claim.
50. Invalidar match tras profile change.
51. Invalidar tras product-version change.
52. Crear client feedback.
53. Probar feedback governance.
54. Crear stale-match finding.
55. Crear personalization-without-consent finding.
56. Probar permissions.
57. Probar APIs.
58. Probar events/outbox.
59. Probar workflows.
60. Probar immutable audit.

## 5115. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. Exista Marketplace Eligibility Context.
2. Existan context sources/statuses.
3. Exista Context Versioning.
4. Exista data minimization.
5. Exista anonymous context.
6. Exista authenticated context upgrade.
7. Exista Domain Screening Adapter.
8. Exista Domain Screening Contract.
9. Exista normalized Potential Fit Status.
10. Exista freshness gate.
11. Exista Marketplace Match.
12. Existan Match Factors.
13. Unknown permanezca unknown.
14. Exista Match Explanation.
15. Exista optional Match Confidence.
16. Exista Match Expiration.
17. Exista Comparison Workspace.
18. Exista Comparison Schema.
19. Existan domain-specific fields.
20. Exista comparison provenance.
21. Missing values no se conviertan en cero.
22. Exista cost-comparison boundary.
23. Exista normalized-cost context.
24. Exista comparison warning.
25. Exista Comparison Record.
26. Exista Saved Comparison.
27. Existan Ranking Inputs.
28. Organic/sponsored/editorial/personalization estén separados.
29. Exista Ranking Version.
30. Exista Organic Ranking.
31. Sponsored ranking sea disclosed.
32. Exista Editorial Ranking.
33. Exista Provider Quality Signal.
34. Exista Popularity Signal.
35. Exista Personalization Principle.
36. Existan allowed personalization inputs.
37. Existan personalization exclusions.
38. Financial-data personalization tenga purpose boundary.
39. Exista Personalization Consent.
40. Exista Personalization Off Mode.
41. Exista Personalization Explanation.
42. Exista Ranking Explanation Record.
43. Ranking sea auditable.
44. Exista Marketplace Disclosure Engine.
45. Existan Disclosure Types.
46. Exista disclosure placement.
47. Exista acknowledgment.
48. Exista Recommendation Candidate Handoff.
49. M37/M38 boundaries estén claras.
50. Exista Recommendation Request.
51. Exista Recommendation Response Reference.
52. Existan Recommendation Safety Flags.
53. Exista Why This UI.
54. No exista universal-best claim sin methodology.
55. Existan eligibility/catalog update triggers.
56. Exista Client Feedback.
57. Feedback no altere source facts.
58. Existan Marketplace Match Findings.
59. Existan permisos/APIs/events/workflows.
60. Parte 2 termine lista para Referral/Application Journeys de Parte 3.

### Instrucciones para Codex

1. Lee Parte 1 completa.
2. Reutiliza M35/M36 screening engines mediante adapters.
3. No copies eligibility rules al marketplace.
4. Implementa versioned Eligibility Context.
5. Minimiza datos.
6. Implementa anonymous context.
7. Requiere consent para merge con identity.
8. Implementa normalized fit statuses.
9. Implementa source freshness gate.
10. Implementa Match Record/Explanation.
11. Mantén unknown como unknown.
12. Implementa comparison schema extensible por domain.
13. Conserva provenance por field.
14. No compares fee/rate/factor como equivalentes.
15. Implementa saved comparisons.
16. Separa ranking signal families.
17. Versiona ranking models/policies.
18. Marca sponsored results.
19. Implementa personalization con consent.
20. Bloquea protected/sensitive unrelated personalization.
21. Implementa Personalization Off Mode.
22. Implementa ranking explanations.
23. Implementa Disclosure Engine.
24. Implementa M38 handoff, no M38 logic.
25. Implementa safety flags.
26. Implementa invalidation on source/context change.
27. Implementa feedback.
28. Implementa Match Findings.
29. Implementa permissions/APIs/events/workflows.
30. Implementa immutable audit.
31. No marques Parte 2 completa si sponsored/personalized ranking no puede explicarse o si eligibility rules están duplicadas.

### Verificación final de Parte 2

- ¿Marketplace usa domain screening en lugar de duplicarlo?
- ¿Context data está minimized y versionada?
- ¿Anonymous → authenticated requiere review/consent?
- ¿Unknown permanece unknown?
- ¿Comparison fields conservan source/version?
- ¿Cost comparisons evitan métricas incompatibles?
- ¿Organic/sponsored/editorial/personalization están separados?
- ¿Sensitive financial data no se usa para unrelated targeting?
- ¿Personalization puede apagarse?
- ¿Ranking puede explicarse?
- ¿Disclosures cambian según surface/CTA?
- ¿M38 recibe structured candidates sin duplicar su logic?
- ¿Toda acción material queda auditada?

---

# Parte 3 — Referral/Application Journeys, Lead Routing, Consent, Attribution, Partner Handoffs, Status Synchronization y Conversion Tracking

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 37 — Parte 2  
**Secciones incluidas:** 5116–5180  
**Audiencia:** Owner, Codex, marketplace operators, partner managers, sales/operations, compliance, analysts, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Journeys trazables y consentidos desde marketplace intent hasta referral/application outcome, con attribution, idempotency, minimum-necessary sharing, partner/domain handoffs y sincronización de estados externos

## 5116. Objetivo de Parte 3

Esta parte define cómo una intención dentro del marketplace se convierte en una acción operacional.

Pipeline:

```text
listing / comparison / recommendation
→ CTA
→ eligibility/context check
→ disclosure
→ consent
→ lead/referral/application handoff
→ partner/domain status
→ conversion outcome
```

## 5117. Marketplace Journey

Campos:

```text
id
clientIdOptional
sessionId
journeyType
marketplaceItemId
listingVersionId
domain
domainResourceId
status
startedAt
completedAt
createdAt
updatedAt
```

## 5118. Journey Types

```text
learn_more
save_and_return
potential_fit_check
specialist_contact
SG_service_purchase
partner_referral
external_application
embedded_application_future
domain_case_creation
education_enrollment
other
```

## 5119. Journey Status

```text
started
context_pending
disclosure_pending
consent_pending
ready_for_handoff
handoff_in_progress
partner_received
action_in_progress
converted
not_converted
client_abandoned
failed
cancelled
unknown
```

## 5120. Journey Source Snapshot

Campos:

```text
listingVersionId
marketplaceItemVersion
rankingExplanationIdOptional
recommendationIdOptional
comparisonIdOptional
campaignIdOptional
sourceSurface
createdAt
```

Esto permitirá reconstruir por qué comenzó el journey.

## 5121. CTA Invocation Record

Campos:

```text
id
journeyId
CTAType
marketplaceItemId
surface
position
sponsoredFlag
clickedAt
clientIdOptional
sessionId
```

## 5122. Pre-Handoff Gate

Antes de una referral/application:

```text
item available
provider active
source current
required screening current
disclosures presented
consent valid
required fields complete
```

## 5123. Handoff Readiness Result

```text
ready
client_action_required
needs_screening
needs_disclosure
needs_consent
provider_unavailable
source_stale
manual_review_required
blocked
```

## 5124. Lead Record

Para partners que trabajan con leads:

```text
id
journeyId
clientId
providerId
partnerId
marketplaceItemId
leadType
leadDataVersion
status
createdAt
```

## 5125. Lead Types

```text
information_request
contact_request
qualified_referral_context
application_interest
appointment_request
service_interest
```

No deberá llamarse `qualified lead` si no existe defined qualification method.

## 5126. Lead Data Scope

Campos compartibles:

```text
contact
high_level_need
jurisdiction
business_context
homebuyer_context
preferred_contact
selected_product
other_approved_fields
```

No incluir sensitive data por default.

## 5127. Referral Record

Campos:

```text
id
journeyId
clientId
providerId
partnerId
marketplaceItemId
domainResourceVersion
referralType
consentId
disclosureVersion
referralTrackingId
status
createdAt
sentAt
receivedAt
```

## 5128. Referral Types

```text
warm_referral
secure_link_referral
API_referral
manual_partner_referral
domain_case_handoff
client_self_referral
```

## 5129. Referral Status

```text
draft
ready
sending
sent
received
accepted
client_contacted
converted
declined_by_partner
client_declined
expired
failed
unknown
closed
```

## 5130. Referral Idempotency

Idempotency key deberá considerar:

```text
clientId
providerId
marketplaceItemId
domainResourceVersion
journeyIntent
consentId
```

para evitar duplicate referrals.

## 5131. Referral Retry Boundary

Si outcome es unknown:

```text
do not blind retry
→ verify partner state
→ reconcile
→ retry only when safe
```

## 5132. Application Handoff Boundary

Marketplace podrá iniciar una application journey, pero:

- domain module sigue siendo source of truth;
- provider/lender decide;
- marketplace no inventa application status;
- regulated actions siguen domain/partner policy.

## 5133. Domain Case Creation Handoff

Ejemplos:

```text
Business Funding item → M35 Funding Case
Home Buying item → M36 Homebuyer Case
Tax service → M30 Tax Case
Bookkeeping service → M31 Engagement/Case
Formation → M32 Formation Case
Compliance → M34 Compliance Case
```

## 5134. Cross-Module Handoff Record

Campos:

```text
id
sourceModule
sourceResourceId
destinationModule
destinationResourceIdOptional
handoffType
payloadVersion
idempotencyKey
status
createdAt
completedAt
```

## 5135. Handoff Status

```text
pending
validated
created
accepted
rejected
failed
retry_required
completed
cancelled
```

## 5136. Handoff Payload Boundary

Payload deberá incluir solo:

```text
minimum required facts
source references
consent
client intent
marketplace context
```

No duplicar full financial profile si destination module puede leerlo autorizado.

## 5137. Consent Before Handoff

Consent deberá especificar:

```text
destination
purpose
dataCategories
marketplaceItem
expiration
authorizedAt
status
```

## 5138. Consent Reuse

Un existing consent podrá reutilizarse solo si:

```text
same purpose
same or narrower data scope
same destination/provider
still active
policy allows reuse
```

## 5139. Consent Expansion

Si se necesita más data:

```text
existing consent
→ new scope request
→ client review
→ new/superseding consent
```

## 5140. External Redirect Journey

Para `visit_provider`:

```text
verified destination
→ disclosure
→ attribution token
→ redirect
```

No deberá pasar sensitive data en query string.

## 5141. Secure Referral Link

Campos:

```text
providerId
destinationUrl
signedToken
expiresAt
scopes
singleUseFlag
```

## 5142. Attribution Record

Campos:

```text
id
journeyId
clientIdOptional
sessionId
marketplaceItemId
listingVersionId
providerId
campaignIdOptional
source
medium
placement
clickId
createdAt
```

## 5143. Attribution Sources

```text
organic_marketplace
search
browse_collection
comparison
recommendation
sponsored
email
SMS
social
direct
partner_campaign
other
```

## 5144. Attribution Boundary

Attribution mide origen de journey/conversion.

No deberá sobrescribir source facts del producto ni eligibility.

## 5145. Attribution Model

Inicial:

```text
last_marketplace_touch
first_marketplace_touch
direct_referral
```

Futuros:

```text
multi_touch
weighted
```

Todo model deberá versionarse.

## 5146. Attribution Window

Campos:

```text
modelVersion
lookbackWindow
startAt
endAt
```

No usar ventanas indefinidas.

## 5147. Conversion Event

Tipos:

```text
lead_created
referral_sent
partner_received
client_contacted
application_started
application_submitted
service_order_created
offer_received
funded
preapproved
closed_home_purchase
service_completed
other_domain_conversion
```

## 5148. Conversion Record

Campos:

```text
id
journeyId
conversionType
domain
domainResourceId
providerId
occurredAt
source
verificationStatus
attributionModelVersion
```

## 5149. Verified Conversion

Estados:

```text
unverified
partner_reported
domain_verified
payment_verified
document_verified
manual_verified
conflicting
```

## 5150. Conversion Deduplication

Una conversion deberá deduplicarse por:

```text
domain
domainResourceId
conversionType
providerId
```

más provider event reference cuando exista.

## 5151. Status Synchronization

Marketplace deberá consumir status desde:

```text
domain module
partner API
partner webhook
secure partner feed
verified staff update
```

## 5152. Normalized Journey Status Mapping

Ejemplo:

```text
M35 application submitted
→ marketplace action_in_progress

M35 funded
→ marketplace converted

M36 preapproved
→ marketplace converted_for_preapproval_goal
```

Mapping deberá ser versionado.

## 5153. Raw Partner Status Preservation

Siempre guardar:

```text
rawStatus
rawCode
rawMessage
receivedAt
mappingVersion
```

## 5154. Sync Status

```text
current
delayed
degraded
stale
conflicting
unknown
```

## 5155. Status Reconciliation

Cuando internal/domain/partner statuses difieran:

```text
collect sources
→ apply source priority
→ preserve conflict
→ human review if material
→ update normalized state
```

## 5156. Source Priority for Outcome

Conceptualmente:

```text
domain_verified
provider_verified
official_document
partner_reported
manual_verified
inferred
```

`inferred` no deberá cerrar material outcome automáticamente.

## 5157. Partner Contact Record

Campos:

```text
referralId
contactAttemptAt
contactChannel
contactStatus
partnerAgentReference
notes
source
```

## 5158. Client Contact Preferences

Marketplace handoffs deberán respetar:

```text
emailAllowed
smsAllowed
phoneAllowed
inAppAllowed
preferredLanguage
quietHours
```

## 5159. Appointment Handoff

Podrá crear:

```text
partnerAppointment
specialistAppointment
consultation
```

reutilizando Appointments.

## 5160. Partner Appointment Record

Campos:

```text
journeyId
partnerId
appointmentId
appointmentType
scheduledAt
status
externalReference
```

## 5161. Lead Routing Engine

Routing podrá considerar:

```text
providerCapability
jurisdiction
product/program
language
availability
clientPreference
partnerCapacity
SLA
quality
contractualRoutingRules
```

## 5162. Lead Routing Boundary

No deberá:

- discriminar por protected attributes;
- ocultar sponsored/paid routing when material;
- route to suspended provider;
- bypass client-selected provider without explanation.

## 5163. Routing Rule

Campos:

```text
ruleId
priority
conditions
destination
effectiveFrom
effectiveTo
source
approvedBy
```

## 5164. Routing Decision Record

Campos:

```text
journeyId
eligibleDestinations
selectedDestination
routingFactors
excludedDestinations
ruleVersion
decidedAt
```

## 5165. Capacity Management

Partner podrá publicar:

```text
open
limited
waitlist
closed
```

y optional daily/weekly capacity.

## 5166. Overflow Routing

Cuando provider preferred no tenga capacity:

```text
show unavailable
→ offer alternate providers
→ preserve client choice
```

No auto-switch silently para material financial referral.

## 5167. Partner Acceptance

Campos:

```text
referralId
acceptedAt
partnerUserReference
externalLeadId
status
```

## 5168. Partner Decline

Campos:

```text
referralId
declinedAt
reasonCode
reasonText
clientVisibleFlag
source
```

No fabricar decline reason.

## 5169. Client Abandonment

Journey podrá marcar:

```text
client_abandoned
```

solo tras defined inactivity/process criteria.

No confundir con partner decline.

## 5170. Journey Resume

Cliente podrá reanudar:

```text
saved journey
→ freshness check
→ context refresh
→ disclosure/consent refresh if required
→ resume
```

## 5171. Referral Expiration

Campos:

```text
expiresAt
expirationReason
renewalAllowed
status
```

## 5172. Conversion Funnel

Stages:

```text
view
CTA
journey_started
context_complete
consent
handoff
partner_received
application_or_service_started
verified_conversion
```

## 5173. Funnel Drop-Off Reason

```text
client_abandoned
missing_information
eligibility_issue
provider_unavailable
consent_declined
pricing_or_terms
technical_failure
partner_declined
unknown
```

## 5174. Conversion Quality

La plataforma deberá distinguir:

```text
click_conversion
lead_conversion
application_conversion
verified_business_outcome
```

para evitar vanity metrics.

## 5175. Marketplace Revenue Attribution Reference

Cuando conversion genere revenue/commission:

```text
conversionId
revenueRecordId
commissionRecordId
```

Los cálculos económicos se desarrollan en Parte 4.

## 5176. Fraud / Abuse Signals

Ejemplos:

```text
duplicate_referral_pattern
bot_CTA_activity
fake_lead_pattern
self_referral_abuse
attribution_tampering
partner_status_manipulation
```

## 5177. Referral / Conversion Finding

Tipos:

```text
duplicate_referral
consent_scope_mismatch
provider_unavailable
unknown_external_outcome
status_conflict
attribution_mismatch
conversion_duplicate
partner_decline_reason_missing
routing_policy_violation
```

## 5178. Permissions, APIs, Events and Workflows

### Permisos

```text
marketplace.journey.read
marketplace.journey.manage

marketplace.lead.read
marketplace.lead.create

marketplace.referral.read
marketplace.referral.create
marketplace.referral.manage

marketplace.handoff.read
marketplace.handoff.create

marketplace.attribution.read
marketplace.conversion.read
marketplace.conversion.manage

marketplace.routing.read
marketplace.routing.manage
```

### APIs

```text
POST /api/marketplace/journeys
POST /api/marketplace/journeys/{id}/CTA
POST /api/marketplace/journeys/{id}/handoff-readiness

POST /api/marketplace/leads
POST /api/marketplace/referrals
POST /api/marketplace/handoffs

POST /api/marketplace/referrals/{id}/retry
POST /api/marketplace/referrals/{id}/reconcile

POST /api/marketplace/attribution
POST /api/marketplace/conversions

GET  /api/marketplace/journeys/{id}/status
POST /api/marketplace/journeys/{id}/resume

POST /api/marketplace/routing/decisions
```

### Eventos

```text
MarketplaceJourneyStarted
MarketplaceCTAClicked
MarketplaceHandoffReadinessEvaluated
MarketplaceLeadCreated
MarketplaceReferralCreated
MarketplaceReferralSent
MarketplaceReferralReceived
MarketplaceReferralAccepted
MarketplaceReferralDeclined
MarketplaceDomainHandoffCreated
MarketplaceConsentExpanded
MarketplaceExternalRedirectStarted
MarketplaceAttributionCreated
MarketplaceConversionRecorded
MarketplaceConversionVerified
MarketplaceStatusConflictDetected
MarketplaceJourneyResumed
MarketplaceRoutingDecisionCreated
MarketplaceJourneyConverted
```

### Workflows

```text
Marketplace Journey Workflow
Pre-Handoff Gate Workflow
Lead Workflow
Referral Workflow
Domain Handoff Workflow
Consent Expansion Workflow
External Redirect Workflow
Attribution Workflow
Conversion Verification Workflow
Status Synchronization Workflow
Status Reconciliation Workflow
Lead Routing Workflow
Journey Resume Workflow
```

## 5179. Pruebas de Parte 3

Pruebas obligatorias:

1. Crear Marketplace Journey.
2. Crear CTA Invocation.
3. Ejecutar Pre-Handoff Gate.
4. Bloquear stale listing.
5. Bloquear unavailable provider.
6. Crear Lead Record.
7. Validar lead data minimization.
8. Crear Referral.
9. Probar referral idempotency.
10. Bloquear duplicate referral.
11. Probar unknown outcome.
12. Bloquear blind retry.
13. Crear M35 domain handoff.
14. Crear M36 domain handoff.
15. Crear SG Service handoff.
16. Probar handoff idempotency.
17. Limitar handoff payload.
18. Crear consent.
19. Reutilizar same-scope consent.
20. Expandir consent.
21. Crear external redirect.
22. Verificar no sensitive query parameters.
23. Crear signed secure referral link.
24. Crear Attribution Record.
25. Registrar organic attribution.
26. Registrar sponsored attribution.
27. Versionar attribution model.
28. Crear Conversion Event.
29. Crear verified conversion.
30. Deduplicar conversion.
31. Sincronizar domain status.
32. Sincronizar partner status.
33. Conservar raw status.
34. Crear sync degraded state.
35. Detectar status conflict.
36. Reconciliar source priority.
37. Crear partner contact.
38. Respetar contact preferences.
39. Crear partner appointment.
40. Ejecutar Lead Routing.
41. Bloquear suspended provider.
42. Crear Routing Decision Record.
43. Aplicar partner capacity.
44. Probar overflow routing.
45. Preservar client choice.
46. Registrar partner acceptance.
47. Registrar partner decline.
48. Conservar raw decline reason.
49. Crear client abandonment.
50. Reanudar journey.
51. Refresh stale context on resume.
52. Expirar referral.
53. Crear funnel.
54. Registrar drop-off reason.
55. Diferenciar click vs verified outcome.
56. Crear fraud signal.
57. Crear referral finding.
58. Probar permissions/APIs/events.
59. Probar workflows.
60. Probar immutable audit.

## 5180. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 3 estará completa cuando:

1. Exista Marketplace Journey.
2. Existan Journey Types.
3. Exista Journey Status.
4. Exista Journey Source Snapshot.
5. Exista CTA Invocation Record.
6. Exista Pre-Handoff Gate.
7. Exista Handoff Readiness Result.
8. Exista Lead Record.
9. Existan Lead Types.
10. Lead data sea minimum necessary.
11. Exista Referral Record.
12. Existan Referral Types.
13. Exista Referral Status.
14. Exista Referral Idempotency.
15. Unknown outcome bloquee blind retry.
16. Exista Application Handoff Boundary.
17. Existan domain-case handoffs.
18. Exista Cross-Module Handoff Record.
19. Handoff payload sea minimal.
20. Exista Consent Before Handoff.
21. Exista consent reuse policy.
22. Exista consent expansion.
23. Exista External Redirect Journey.
24. Exista Secure Referral Link.
25. Exista Attribution Record.
26. Existan Attribution Sources.
27. Attribution no altere source facts.
28. Exista Attribution Model.
29. Exista Attribution Window.
30. Existan Conversion Events.
31. Exista Conversion Record.
32. Exista verification status.
33. Exista conversion deduplication.
34. Exista Status Synchronization.
35. Exista normalized status mapping.
36. Raw partner status se preserve.
37. Exista Sync Status.
38. Exista Status Reconciliation.
39. Exista outcome source priority.
40. Exista Partner Contact Record.
41. Se respeten communication preferences.
42. Exista Appointment Handoff.
43. Exista Lead Routing Engine.
44. Routing preserve fair/non-protected criteria.
45. Exista Routing Rule.
46. Exista Routing Decision Record.
47. Exista partner capacity.
48. Overflow preserve client choice.
49. Exista Partner Acceptance.
50. Exista Partner Decline.
51. Client abandonment sea distinto a partner decline.
52. Exista Journey Resume.
53. Exista Referral Expiration.
54. Exista Conversion Funnel.
55. Existan Drop-Off Reasons.
56. Exista Conversion Quality.
57. Exista revenue attribution reference.
58. Existan fraud/abuse signals.
59. Existan Referral/Conversion Findings.
60. Existan permisos/APIs/events/workflows.
61. Toda external action sea auditable.
62. Parte 3 termine lista para Marketplace Economics/Partner Operations de Parte 4.

### Instrucciones para Codex

1. Lee Partes 1–2 completas.
2. Implementa Marketplace Journey como aggregate.
3. Guarda immutable source snapshot.
4. Implementa CTA Invocation.
5. Implementa Pre-Handoff Gate.
6. Minimiza lead/referral data.
7. Implementa Referral idempotency.
8. Nunca blind retry unknown outcomes.
9. Implementa generic Cross-Module Handoff.
10. Reutiliza destination domain data cuando autorizado.
11. Implementa scoped consent.
12. Implementa consent expansion.
13. Implementa safe external redirects.
14. Nunca pongas sensitive data en query params.
15. Implementa attribution versionada.
16. Implementa verified conversions.
17. Deduplica conversions.
18. Implementa raw/normalized partner statuses.
19. Implementa source-priority reconciliation.
20. Implementa partner contact/appointments.
21. Implementa fair Lead Routing.
22. Bloquea suspended/unavailable partners.
23. Implementa capacity/overflow con client choice.
24. Conserva raw partner decline reasons.
25. Implementa abandonment/resume/expiration.
26. Implementa funnel quality levels.
27. Implementa fraud signals/findings.
28. Implementa permissions/APIs/events/workflows.
29. Implementa immutable audit.
30. No marques Parte 3 completa si referral retries pueden duplicar leads o si consent/data scope no puede reconstruirse.

### Verificación final de Parte 3

- ¿Cada journey conserva el listing/ranking/recommendation que lo originó?
- ¿Pre-Handoff Gate verifica freshness, disclosure y consent?
- ¿Leads/referrals comparten minimum necessary?
- ¿Retries son idempotentes?
- ¿Unknown external outcome no dispara duplicate referral?
- ¿Domain handoffs reutilizan los módulos fuente?
- ¿Attribution está separada de eligibility?
- ¿Conversions requieren source/verification?
- ¿Raw partner statuses se preservan?
- ¿Status conflicts pueden reconciliarse?
- ¿Routing respeta client choice y partner capacity?
- ¿Abandonment/decline/technical failure están diferenciados?
- ¿Toda acción material queda auditada?

---

# Parte 4 — Client Marketplace Portal, Saved Items, Journeys, Commissions, Economics, Partner Operations, Disputes, Quality y Lifecycle

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 37 — Parte 3  
**Secciones incluidas:** 5181–5245  
**Audiencia:** Owner, Codex, marketplace operators, partner managers, finance, compliance, client success, support, analysts y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Marketplace centrado en cliente y partner, con lifecycle visible, economics/commissions trazables, calidad medible y resolución de disputes, sin permitir que compensation o revenue oculten riesgos o alteren indebidamente el ranking

## 5181. Objetivo de Parte 4

Esta parte define la operación continua del marketplace después de discovery/referral.

Deberá cubrir:

- Client Marketplace Portal;
- saved items;
- saved comparisons;
- active journeys;
- referral/application status;
- provider interactions;
- commissions;
- marketplace revenue;
- economics;
- partner operations;
- quality controls;
- disputes;
- reversals;
- lifecycle;
- client support.

## 5182. Client Marketplace Portal Principle

```text
client intent
→ saved context
→ active journeys
→ verified status
→ next action
→ outcome
```

El portal deberá evitar obligar al cliente a reconstruir cada journey desde cero.

## 5183. Client Marketplace Portal

Secciones:

```text
For You
Saved
Comparisons
Active Journeys
Applications / Referrals
Offers / Results
Services
Messages
Documents
History
Preferences
Consents
```

## 5184. Marketplace Home View

Podrá mostrar:

```text
activeJourneys
pendingClientActions
savedItems
recentComparisons
recentlyViewed
recommendedItemsReference
statusUpdates
newRelevantItems
```

Todo personalized content deberá respetar consent/settings.

## 5185. Saved Item Workspace

Campos:

```text
savedItemId
marketplaceItemId
listingVersionId
savedAt
notesOptional
folderOptional
status
lastReviewedAt
```

## 5186. Saved Item Freshness

Cuando listing/source cambie:

```text
saved item
→ show changed/stale indicator
→ preserve prior saved version reference
→ offer latest version
```

## 5187. Saved Item Status

```text
active
changed
unavailable
expired
retired
removed_by_client
```

## 5188. Saved Comparison Lifecycle

Campos:

```text
comparisonId
name
itemIds
savedVersions
currentVersions
changedItems
createdAt
updatedAt
status
```

## 5189. Comparison Change Detection

Detectar:

```text
price_or_fee_change
availability_change
provider_change
term_change
eligibility_summary_change
disclosure_change
source_stale
```

## 5190. Active Journey Card

Deberá mostrar:

```text
item
provider
journeyType
currentStatus
nextAction
responsibleParty
lastUpdate
estimatedNextUpdateWhenAvailable
```

## 5191. Journey Timeline

Eventos:

```text
started
screened
consent_given
referral_sent
provider_received
client_contacted
application_started
decision_or_outcome
converted_or_closed
```

## 5192. Journey Client Action

Tipos:

```text
provide_information
review_disclosure
update_consent
schedule_call
visit_provider
continue_application
upload_document
review_offer
contact_support
```

## 5193. Marketplace Message Thread

Cada journey podrá tener thread que reúna:

- SG messages;
- system status;
- partner updates when supported;
- client replies;
- action requests.

No deberá mezclar confidential partner-only notes.

## 5194. Marketplace Document Center

Podrá mostrar referencias a:

```text
consents
disclosures
referral confirmations
application documents
provider decisions
offers
service documents
receipts
```

respetando domain ownership.

## 5195. Marketplace History

Historial:

```text
views
saves
comparisons
recommendations
journeys
referrals
applications
conversions
client decisions
consent changes
```

según retention/privacy policy.

## 5196. Client Marketplace Preferences

Campos:

```text
preferredCategories
excludedCategories
costPriority
speedPriority
providerPreferences
contactPreferences
personalizationEnabled
language
notificationPreferences
```

## 5197. Notification Preferences

Por evento:

```text
journey_update
partner_contact
client_action_due
offer_or_result
saved_item_changed
new_relevant_item
marketing
```

## 5198. Journey Notification Deduplication

No enviar múltiples notificaciones por el mismo external event.

Dedup:

```text
journeyId
eventType
externalEventId_or_hash
channel
```

## 5199. Commission Principle

Commission/revenue deberá ser:

```text
contract-backed
conversion-backed
calculated
verified
approved
auditable
```

No simplemente inferido de clicks.

## 5200. Marketplace Commission Record

Campos:

```text
id
partnerId
providerId
journeyId
referralId
conversionId
marketplaceItemId
commissionType
commissionBasis
expectedAmount
earnedAmount
paidAmount
currency
status
createdAt
updatedAt
```

## 5201. Commission Types

```text
flat_referral
qualified_lead
application
funded_or_closed_outcome
percentage_of_transaction
revenue_share
subscription_share
marketing_fee
other_contractual
none
```

## 5202. Commission Basis

Campos:

```text
basisType
basisValue
contractVersion
calculationRuleVersion
qualifyingEvent
effectiveFrom
effectiveTo
```

## 5203. Commission Status

```text
not_applicable
potential
pending_conversion
pending_verification
earned
approved
invoiced
paid
reversed
disputed
cancelled
```

## 5204. Commission Recognition Gate

Para marcar `earned`:

```text
qualifying conversion exists
contract rule matches
conversion verified
amount calculated
no blocking dispute
```

## 5205. Commission Calculation Record

Campos:

```text
commissionId
inputValues
ruleVersion
calculatedAmount
calculatedAt
calculatedBy
roundingMethod
```

## 5206. Commission Adjustment

Tipos:

```text
correction
partial_reversal
full_reversal
bonus
contract_adjustment
manual_with_approval
```

Toda adjustment deberá preservar original amount.

## 5207. Marketplace Revenue Record

Campos:

```text
id
revenueType
serviceOrderIdOptional
commissionIdOptional
conversionIdOptional
grossRevenue
refunds
netRevenue
recognizedAt
status
```

## 5208. Marketplace Revenue Types

```text
SG_service_revenue
referral_commission
affiliate_revenue
partner_marketing_revenue
subscription_revenue_future
other
```

No contar:

```text
loan principal
mortgage amount
credit limit
grant amount
DPA amount
```

como SG revenue.

## 5209. Revenue Recognition Boundary

Revenue deberá depender de:

```text
actual service/payment
or
contract-defined earned commission event
```

No de marketplace impressions o unverified referrals.

## 5210. Marketplace Unit Economics

Métricas:

```text
revenue_per_journey
revenue_per_verified_conversion
partner_acquisition_cost_future
support_cost_per_journey
gross_margin_by_category
refund_or_reversal_rate
```

## 5211. Partner Contract Reference

Cada economic rule deberá poder rastrearse a:

```text
partnerContractId
contractVersion
effectiveDates
commercialTermsReference
```

## 5212. Partner Operations Workspace

Secciones:

```text
Partner Profile
Capabilities
Products / Listings
Referrals
Conversions
SLAs
Commissions
Invoices
Disputes
Quality
Incidents
Configuration
```

## 5213. Partner User Access

Roles:

```text
partner_admin
partner_operations
partner_sales
partner_finance
partner_support
partner_readonly
```

Con tenant/partner isolation estricta.

## 5214. Partner Referral Inbox

Partner podrá ver solo referrals autorizadas para ese partner.

Campos:

```text
referralId
clientDisplayContext
marketplaceItem
needSummary
contactPermission
createdAt
SLA
status
```

## 5215. Partner Referral Actions

```text
accept
decline
request_information
mark_contacted
provide_status
provide_conversion
close
```

según capability.

## 5216. Partner Status Submission

Toda update deberá guardar:

```text
partnerUserId
rawStatus
normalizedStatus
notes
supportingReference
submittedAt
```

## 5217. Partner Conversion Submission

Campos:

```text
referralId
conversionType
externalResourceId
conversionDate
amountContextOptional
supportingEvidence
submittedBy
```

No marcar verified automáticamente si policy requiere evidence.

## 5218. Partner Evidence Requirement

Según conversion:

```text
provider_reference
official_status
document
API_event
payment_record
other
```

## 5219. Partner SLA Performance

Medir:

```text
referral_acknowledgment_time
client_contact_time
status_update_latency
conversion_reporting_latency
support_response_time
```

## 5220. Partner Quality Score Boundary

Si existe internal quality score:

- methodology versionada;
- no usar datos no validados;
- separar quality de paid placement;
- permitir manual review;
- no publicarlo como factual rating sin policy.

## 5221. Partner Quality Dimensions

```text
data_freshness
referral_acceptance
response_time
conversion_reporting_accuracy
client_experience
complaints
disputes
technical_reliability
compliance_findings
```

## 5222. Marketplace Complaint Record

Campos:

```text
id
clientId
journeyIdOptional
partnerIdOptional
marketplaceItemIdOptional
complaintType
description
severity
status
createdAt
resolvedAt
```

## 5223. Complaint Types

```text
misleading_listing
unexpected_fee
partner_contact_issue
privacy_issue
incorrect_status
poor_service
unauthorized_contact
sponsored_disclosure_issue
other
```

## 5224. Complaint Status

```text
received
triage
under_review
partner_response_requested
client_followup
resolved
closed
escalated
```

## 5225. Complaint Routing

Según type/severity:

```text
support
marketplace_operations
partner_management
compliance
privacy
security
legal_review_future
```

## 5226. Marketplace Dispute Record

Disputes económicas u operativas:

```text
id
disputeType
partnerId
commissionIdOptional
conversionIdOptional
journeyIdOptional
amountOptional
reason
evidence
status
openedAt
resolvedAt
```

## 5227. Dispute Types

```text
commission_amount
conversion_attribution
duplicate_lead
invalid_lead
conversion_reversal
service_quality
contract_interpretation
other
```

## 5228. Dispute Status

```text
open
evidence_requested
under_review
partner_response
SG_review
resolved_for_partner
resolved_for_SG
partial_resolution
cancelled
```

## 5229. Attribution Dispute

Deberá comparar:

```text
marketplace attribution
partner records
domain records
timestamps
click/referral identifiers
conversion evidence
```

sin sobrescribir evidencia original.

## 5230. Commission Reversal

Cuando contract permita:

```text
earned commission
→ qualifying event reversed/cancelled
→ reversal record
→ revenue adjustment
→ audit
```

## 5231. Refund Context

Para SG-paid services:

```text
payment
serviceOrder
refundAmount
reason
refundStatus
processedAt
```

Reutilizar Billing/Stripe records.

## 5232. Marketplace Quality Finding

Tipos:

```text
high_complaint_rate
partner_SLA_breach
conversion_reporting_conflict
commission_anomaly
listing_accuracy_issue
referral_quality_issue
provider_status_issue
privacy_or_contact_issue
```

## 5233. Partner Remediation Plan

Campos:

```text
partnerId
findingIds
requiredActions
owner
dueDate
status
reviewDate
```

## 5234. Partner Suspension Trigger

Podrá originarse por:

- expired authorization;
- security issue;
- repeated misleading data;
- severe privacy issue;
- material compliance issue;
- contractual breach;
- persistent operational failure.

Debe requerir policy/review apropiada.

## 5235. Marketplace Lifecycle State

Por item/provider relationship:

```text
onboarding
active
growth
limited
remediation
suspended
offboarding
retired
```

## 5236. Listing Offboarding

Al retirar item/provider:

```text
stop new discovery
→ disable new CTA/referral
→ preserve active journeys
→ notify affected users when needed
→ retain history
```

## 5237. Active Journey Protection

Retirar un listing no deberá borrar active referral/application.

El journey deberá pasar a:

```text
existing_client_supported
```

cuando partner/domain lo permita.

## 5238. Client Data Deletion / Privacy Request Context

Marketplace deberá integrarse con platform privacy workflows para:

- access;
- correction;
- deletion where allowed;
- personalization opt-out;
- marketing opt-out.

Legal/contractual records podrán requerir retention.

## 5239. Support Case

Campos:

```text
id
clientId
journeyIdOptional
marketplaceItemIdOptional
partnerIdOptional
issueType
priority
status
assignedTo
createdAt
resolvedAt
```

## 5240. Support Case Types

```text
journey_status
partner_contact
listing_question
comparison_question
consent
privacy
billing
commission_partner_only
technical_issue
complaint
other
```

## 5241. Marketplace Service Recovery

Ante client-impacting failure:

```text
acknowledge issue
→ determine source
→ preserve state
→ correct data
→ restore journey
→ communicate
→ record remediation
```

## 5242. Permissions, APIs, Events and Workflows

### Permisos

```text
marketplace.portal.read
marketplace.saved.manage
marketplace.journey_client.read

marketplace.commission.read
marketplace.commission.manage
marketplace.commission.approve

marketplace.revenue.read
marketplace.economics.read

marketplace.partner_ops.read
marketplace.partner_ops.manage

marketplace.complaint.read
marketplace.complaint.manage
marketplace.dispute.read
marketplace.dispute.manage

marketplace.quality.read
marketplace.quality.manage
```

### APIs

```text
GET  /api/marketplace/portal
GET  /api/marketplace/saved
GET  /api/marketplace/journeys

POST /api/marketplace/commissions
POST /api/marketplace/commissions/{id}/calculate
POST /api/marketplace/commissions/{id}/approve
POST /api/marketplace/commissions/{id}/adjustments

GET  /api/marketplace/partners/{id}/operations
POST /api/marketplace/partners/{id}/referrals/{referralId}/actions
POST /api/marketplace/partners/{id}/conversions

POST /api/marketplace/complaints
POST /api/marketplace/disputes
POST /api/marketplace/quality/findings
POST /api/marketplace/support-cases
```

### Eventos

```text
MarketplaceSavedItemChanged
MarketplaceSavedComparisonChanged
MarketplaceJourneyClientActionCreated
MarketplaceCommissionCreated
MarketplaceCommissionCalculated
MarketplaceCommissionEarned
MarketplaceCommissionAdjusted
MarketplaceRevenueRecognized
MarketplacePartnerReferralAccepted
MarketplacePartnerStatusSubmitted
MarketplacePartnerConversionSubmitted
MarketplaceComplaintCreated
MarketplaceDisputeCreated
MarketplaceCommissionReversed
MarketplaceQualityFindingCreated
MarketplacePartnerRemediationStarted
MarketplacePartnerSuspended
MarketplaceListingOffboarded
MarketplaceSupportCaseCreated
```

### Workflows

```text
Marketplace Client Portal Workflow
Saved Item Freshness Workflow
Journey Notification Workflow
Commission Workflow
Marketplace Revenue Workflow
Partner Operations Workflow
Partner Quality Workflow
Complaint Workflow
Dispute Workflow
Commission Reversal Workflow
Partner Remediation Workflow
Listing Offboarding Workflow
Support Workflow
```

## 5243. Pruebas de Parte 4

Pruebas obligatorias:

1. Renderizar Client Marketplace Portal.
2. Mostrar saved items.
3. Detectar saved listing change.
4. Actualizar saved comparison.
5. Crear Active Journey Card.
6. Renderizar journey timeline.
7. Crear client action.
8. Crear journey message thread.
9. Renderizar document references.
10. Renderizar marketplace history.
11. Cambiar marketplace preferences.
12. Desactivar notifications específicas.
13. Deduplicar journey notification.
14. Crear Commission Record.
15. Crear flat-referral commission.
16. Crear funded-outcome commission.
17. Crear commission basis.
18. Bloquear earned sin verified conversion.
19. Calcular commission.
20. Crear commission adjustment.
21. Crear Marketplace Revenue Record.
22. Excluir loan principal de revenue.
23. Excluir mortgage amount de revenue.
24. Calcular unit economics.
25. Vincular Partner Contract.
26. Renderizar Partner Operations Workspace.
27. Probar partner tenant isolation.
28. Renderizar partner Referral Inbox.
29. Partner acepta referral.
30. Partner solicita info.
31. Partner envía raw status.
32. Partner reporta conversion.
33. Bloquear automatic verification without evidence.
34. Medir SLA.
35. Calcular internal quality dimensions.
36. Crear Complaint Record.
37. Crear unexpected-fee complaint.
38. Route privacy complaint.
39. Crear Marketplace Dispute.
40. Crear attribution dispute.
41. Preservar source evidence.
42. Crear commission reversal.
43. Ajustar marketplace revenue.
44. Crear SG-service refund reference.
45. Crear Quality Finding.
46. Crear Partner Remediation Plan.
47. Suspender partner.
48. Bloquear nuevas referrals al suspended partner.
49. Offboard listing.
50. Preservar active journey.
51. Crear privacy request context.
52. Crear Support Case.
53. Ejecutar service recovery.
54. Probar permissions.
55. Probar APIs.
56. Probar events/outbox.
57. Probar workflows.
58. Probar immutable audit.
59. Probar bilingual portal.
60. Probar complaint/dispute SLA.

## 5244. Criterios de Aceptación de Parte 4

La Parte 4 estará completa cuando:

1. Exista Client Marketplace Portal.
2. Exista Marketplace Home View.
3. Exista Saved Item Workspace.
4. Exista saved-item freshness.
5. Exista Saved Comparison Lifecycle.
6. Exista Comparison Change Detection.
7. Exista Active Journey Card.
8. Exista Journey Timeline.
9. Existan Client Actions.
10. Exista Message Thread.
11. Exista Document Center.
12. Exista Marketplace History.
13. Existan Client Preferences.
14. Existan Notification Preferences.
15. Exista notification deduplication.
16. Exista Commission Principle.
17. Exista Marketplace Commission Record.
18. Existan Commission Types.
19. Exista Commission Basis.
20. Exista Commission Status.
21. Exista Commission Recognition Gate.
22. Exista Commission Calculation Record.
23. Existan Commission Adjustments.
24. Exista Marketplace Revenue Record.
25. Existan Revenue Types.
26. Financing principal/limits/assistance no sean SG revenue.
27. Exista Revenue Recognition Boundary.
28. Existan Unit Economics.
29. Exista Partner Contract Reference.
30. Exista Partner Operations Workspace.
31. Existan partner roles/access.
32. Exista Partner Referral Inbox.
33. Existan Partner Referral Actions.
34. Exista Partner Status Submission.
35. Exista Partner Conversion Submission.
36. Exista Partner Evidence Requirement.
37. Existan SLA metrics.
38. Exista Partner Quality boundary.
39. Existan Partner Quality Dimensions.
40. Exista Marketplace Complaint.
41. Existan Complaint Types.
42. Exista Complaint Routing.
43. Exista Marketplace Dispute.
44. Existan Dispute Types.
45. Exista Attribution Dispute workflow.
46. Exista Commission Reversal.
47. Exista Refund Context.
48. Existan Marketplace Quality Findings.
49. Exista Partner Remediation Plan.
50. Exista Partner Suspension Trigger.
51. Exista Marketplace Lifecycle State.
52. Exista Listing Offboarding.
53. Active journeys sean protegidos.
54. Exista privacy-request integration.
55. Exista Support Case.
56. Exista Service Recovery.
57. Existan permisos/APIs/events/workflows.
58. Toda commission/revenue tenga source.
59. Toda dispute preserve original evidence.
60. Parte 4 termine lista para Automation/Security/Analytics de Parte 5.

## 5245. Instrucciones para Codex y Cierre de Parte 4

1. Lee Partes 1–3 completas.
2. Implementa Client Portal sobre existing records.
3. No copies domain documents innecesariamente.
4. Implementa saved-version freshness.
5. Implementa change detection.
6. Implementa Journey Timeline.
7. Implementa client actions/messages.
8. Respeta notification preferences.
9. Deduplica notifications.
10. Implementa Commission aggregate.
11. Exige verified qualifying event.
12. Versiona commission calculation rules.
13. Conserva original commission antes de adjustments.
14. Implementa Marketplace Revenue.
15. Excluye financing principal/credit limits/grants/DPA de SG revenue.
16. Implementa unit economics.
17. Reutiliza Partner Contract.
18. Implementa strict partner isolation.
19. Implementa Partner Referral Inbox/actions.
20. Conserva raw partner statuses.
21. Exige evidence para verified conversion cuando policy lo requiera.
22. Implementa SLA/Quality.
23. Implementa Complaint workflow.
24. Implementa Dispute workflow.
25. Conserva attribution evidence.
26. Implementa commission reversals/revenue adjustments.
27. Reutiliza Billing para refunds.
28. Implementa Partner Remediation/Suspension.
29. Bloquea new referrals tras suspension.
30. Preserve active journeys durante offboarding.
31. Integra privacy requests.
32. Implementa Support/Service Recovery.
33. Implementa permissions/APIs/events/workflows.
34. Implementa immutable audit.
35. No marques Parte 4 completa si commission puede reconocerse sin verified conversion o si partner users pueden ver referrals de otros partners.

### Verificación final de Parte 4

- ¿El portal conserva saved items/comparisons con version history?
- ¿Active journeys muestran status y next action?
- ¿Notifications se deduplican?
- ¿Commission recognition depende del contrato y conversion verificada?
- ¿Financing amounts no se cuentan como SG revenue?
- ¿Partner users están aislados?
- ¿Partner-reported conversions pueden requerir evidence?
- ¿Complaints/disputes preservan evidencia?
- ¿Commission reversal ajusta revenue sin borrar el original?
- ¿Suspended partners dejan de recibir referrals?
- ¿Offboarding protege journeys activos?
- ¿Toda acción material queda auditada?

---

# Parte 5 — Integrations, Automation, AI, Governance, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 5  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 37 — Parte 4  
**Secciones incluidas:** 5246–5310  
**Audiencia:** Owner, Codex, marketplace operators, partner managers, compliance, security, administrators, analysts, support y engineering  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Marketplace multi-domain gobernado por sources versionados, partner capabilities, automation supervisada, AI grounded, privacy/consent, explainability, audit, observability y safe recovery

## 5246. Objetivo de Parte 5

Esta parte cierra el Módulo 37 definiendo:

- integrations;
- provider adapters;
- automation;
- AI;
- marketplace governance;
- sponsored-placement controls;
- security;
- privileged access;
- admin;
- observability;
- analytics;
- data quality;
- migration;
- portability;
- business continuity;
- disaster recovery;
- E2E;
- aceptación final.

## 5247. Integration Architecture Principle

```text
domain source
→ adapter
→ normalized contract
→ marketplace layer
→ client surface
```

El marketplace no deberá convertirse en source of truth de products/programs externos.

## 5248. Integration Adapter Registry

Campos:

```text
id
adapterCode
providerIdOptional
domain
capabilities
authenticationMethod
status
version
effectiveFrom
effectiveTo
```

## 5249. Integration Capabilities

```text
catalog_sync
product_sync
availability_sync
pricing_sync
eligibility_screening
referral_submission
application_handoff
status_sync
conversion_sync
commission_sync
document_exchange
webhooks
polling
```

## 5250. Adapter Status

```text
development
testing
active
degraded
paused
deprecated
retired
unknown
```

## 5251. Provider API Credential Governance

Credentials deberán:

- cifrarse;
- rotarse;
- limitarse por scope;
- no aparecer en logs;
- poder revocarse;
- asociarse a provider/environment;
- quedar auditadas.

## 5252. Webhook Inbox

Flujo:

```text
authenticate
→ store raw event
→ deduplicate
→ normalize
→ validate source
→ process idempotently
→ audit
```

## 5253. Webhook Security

Validar cuando aplique:

```text
signature
timestamp
replayWindow
source
eventId
environment
```

## 5254. Polling Fallback

Cuando no exista webhook confiable:

- scheduled polling;
- cursor/checkpoint;
- rate limiting;
- exponential backoff;
- jitter;
- retry threshold;
- escalation.

## 5255. Integration Failure Policy

Ante failure:

```text
preserve last verified state
→ mark freshness/health issue
→ stop risky action
→ retry only when safe
→ reconcile
→ notify operations
```

## 5256. External Action Idempotency

External writes deberán usar:

```text
idempotencyKey
requestHash
providerId
actionType
createdAt
```

para evitar duplicate referral/application.

## 5257. Unknown External Outcome

Cuando timeout ocurra después de submission:

```text
outcome_unknown
```

No asumir failure ni retry inmediato.

## 5258. Marketplace Automation Engine

Automatizaciones permitidas:

- source freshness checks;
- listing expiration;
- promotion expiration;
- search reindex;
- match invalidation;
- saved-item change alerts;
- referral status sync;
- partner SLA alerts;
- commission candidate generation;
- analytics refresh.

## 5259. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 5260. Informational / Low-Risk Automation

Ejemplos:

- refresh search index;
- mark stale listing;
- create task;
- send non-sensitive reminder;
- refresh dashboard;
- detect expired promotion;
- route work queue.

## 5261. Moderate-Risk Automation

Ejemplos:

- rerun matching;
- suggest alternative provider;
- flag quality issues;
- calculate expected commission;
- prepare dispute evidence package.

Deberá ser explainable y reviewable.

## 5262. High-Risk Automation

Requiere authorization/human gate:

- share new sensitive data;
- submit referral/application;
- override stale-source blocker;
- approve commission;
- suspend partner;
- publish high-impact sponsored campaign;
- reveal restricted data.

## 5263. Prohibited Automation

No deberá:

- fabricate product terms;
- fabricate approval;
- fabricate personalized offers;
- bypass consent;
- hide sponsored placement;
- hide compensation;
- auto-accept financial products;
- silently redirect to a higher-paying provider;
- alter external provider documents.

## 5264. AI Assistant Scope

La IA podrá:

- summarize marketplace items;
- explain comparisons;
- summarize known tradeoffs;
- draft listing copy from verified source;
- detect stale/conflicting content;
- explain why an item appeared;
- summarize partner status;
- assist support/dispute review.

## 5265. AI Grounding

AI output material deberá usar:

```text
approved listing version
domain source
provider source
disclosure registry
partner contract context when authorized
```

No memory-only claims para changing financial terms.

## 5266. AI Listing Draft Boundary

AI podrá crear draft marketing copy.

Antes de publish:

```text
AI draft
→ source validation
→ claim validation
→ disclosure check
→ human/compliance approval when required
```

## 5267. AI Recommendation Boundary

AI no deberá reemplazar M38 Recommendation Engine.

M37 AI podrá explicar:

```text
catalog/match/comparison facts
```

pero personalized recommendation policy pertenece a M38.

## 5268. AI Prohibited Outputs

No deberá:

- inventar eligibility;
- inventar rates/fees;
- afirmar guaranteed approval;
- llamar "best" sin methodology;
- ocultar sponsorship;
- inferir sensitive/protected traits para ranking;
- revelar confidential partner economics al cliente.

## 5269. AI Output Contract

Campos:

```text
outputType
content
sourceReferences
listingVersions
confidence
assumptions
unknowns
humanReviewRequired
generatedAt
```

## 5270. AI Evaluation Framework

Evaluar:

- factual grounding;
- freshness;
- disclosure accuracy;
- ranking explanation consistency;
- unsafe claims;
- privacy leakage;
- hallucinated pricing;
- unsupported guarantees.

## 5271. Marketplace Governance Framework

Governance deberá cubrir:

- catalog accuracy;
- provider verification;
- disclosure policy;
- sponsored content;
- personalization;
- referral practices;
- compensation;
- complaint/dispute handling;
- AI;
- analytics quality.

## 5272. Sponsored Content Governance

Cada sponsored placement deberá tener:

```text
campaignId
sponsor
placement
startAt
endAt
disclosureVersion
approvalStatus
budgetContextOptional
```

## 5273. Sponsored Placement Control

Sponsored placement:

- deberá estar labeled;
- no puede ocultar organic result;
- no puede fingir personalized recommendation;
- no deberá modificar eligibility;
- deberá respetar provider/item availability.

## 5274. Compensation Conflict Control

Si compensation puede crear conflicto:

```text
identify
→ disclose when required
→ separate from organic score
→ audit ranking
→ review complaints
```

## 5275. Marketplace Claim Registry

Claims sensibles:

```text
approval_claim
pricing_claim
savings_claim
credit_claim
speed_claim
availability_claim
eligibility_claim
guarantee_claim
comparison_claim
```

Cada claim podrá requerir source/effective dates.

## 5276. Claim Validation Gate

Antes de publication:

```text
claim
→ source
→ source freshness
→ wording policy
→ disclosure
→ approval
```

## 5277. Security Model

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

## 5278. Sensitive Marketplace Data

Incluye:

- financial profile references;
- credit context;
- lender/provider application data;
- partner contracts;
- commission terms;
- conversion evidence;
- personal identifiers;
- confidential complaints/disputes;
- integration credentials.

## 5279. Field-Level Masking

Ejemplos:

```text
Account: ******4821
Tax ID: ***-**-3920
Partner Contract: CONTRACT-****-291
```

## 5280. Data Access Purpose

Material access deberá registrar:

```text
userId
resourceId
purpose
scope
action
timestamp
```

## 5281. Export Governance

Exports deberán registrar:

```text
requestedBy
purpose
dataScope
maskingPolicy
destination
generatedAt
expiresAt
downloadEvents
```

## 5282. Privileged Actions

Ejemplos:

- publish listing;
- override freshness blocker;
- reveal confidential commercial terms;
- approve/reverse commission;
- suspend partner;
- change routing rules;
- export sensitive marketplace data;
- alter sponsored campaign policy.

## 5283. Owner Break-Glass

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

## 5284. Security Incident Types

```text
cross_client_access
cross_partner_access
unauthorized_data_share
provider_credential_compromise
attribution_tampering
commission_manipulation
routing_manipulation
sponsored_disclosure_failure
sensitive_export
privilege_misuse
```

## 5285. Security Incident Response

```text
detect
→ contain
→ preserve evidence
→ restrict access
→ assess scope
→ compliance/security review
→ remediate
→ post-incident analysis
```

## 5286. Administration Console

Secciones:

```text
Marketplace Overview
Catalog
Categories
Listings
Providers
Offers
Collections
Search
Matching
Comparisons
Journeys
Referrals
Conversions
Routing
Partners
Commissions
Revenue
Complaints
Disputes
Quality
AI
Security
Analytics
Configuration
```

## 5287. Marketplace Work Queues

```text
listing_review
source_freshness
provider_verification
disclosure_review
match_review
referral_exception
status_reconciliation
conversion_verification
commission_review
complaint_triage
dispute_review
partner_remediation
security_review
```

## 5288. Assignment / SLA Engine

Podrá considerar:

- queue;
- category;
- partner;
- severity;
- jurisdiction;
- language;
- expertise;
- workload;
- SLA deadline.

## 5289. Observability

Métricas técnicas:

```text
catalog_sync_failure_rate
search_index_lag
listing_freshness_failure_rate
matching_failure_rate
referral_failure_rate
webhook_failure_rate
status_sync_lag
conversion_sync_failure_rate
commission_calc_failure_rate
notification_failure_rate
```

## 5290. Operational Alerts

Alertas:

- stale published listing;
- expired promotion still visible;
- suspended provider still routable;
- missing sponsored disclosure;
- duplicate referral risk;
- unknown external outcome;
- status conflict;
- commission anomaly;
- partner SLA breach;
- personalization without consent;
- search index drift.

## 5291. Marketplace Analytics Dashboards

```text
Executive Marketplace Dashboard
Catalog Health Dashboard
Discovery Dashboard
Search Dashboard
Matching Dashboard
Comparison Dashboard
Journey Funnel Dashboard
Referral Dashboard
Conversion Dashboard
Partner Performance Dashboard
Commission / Revenue Dashboard
Quality / Complaint Dashboard
Sponsored Content Dashboard
```

## 5292. Discovery KPIs

```text
marketplace_sessions
item_views
searches
zero_result_search_rate
saved_item_rate
comparison_creation_rate
CTA_rate
```

## 5293. Funnel KPIs

```text
journeys_started
contexts_completed
consents_completed
referrals_sent
partner_received
applications_started
verified_conversions
```

## 5294. Conversion KPIs

```text
view_to_CTA_rate
CTA_to_journey_rate
journey_to_referral_rate
referral_to_partner_received_rate
referral_to_verified_conversion_rate
overall_session_to_conversion_rate
```

Cada denominator deberá definirse.

## 5295. Catalog / Quality KPIs

```text
published_listings
stale_listing_rate
broken_CTA_rate
provider_verification_due_rate
missing_disclosure_rate
complaint_rate
dispute_rate
listing_correction_rate
```

## 5296. Partner KPIs

```text
referral_acceptance_rate
contact_rate
response_time
conversion_rate
status_sync_timeliness
complaint_rate
dispute_rate
SLA_breach_rate
technical_error_rate
```

## 5297. Economics KPIs

```text
SG_service_revenue
referral_commission_revenue
affiliate_revenue
revenue_per_verified_conversion
gross_margin_by_category
commission_reversal_rate
partner_revenue_concentration
```

## 5298. Sponsored Content KPIs

```text
sponsored_impressions
sponsored_CTA_rate
sponsored_referral_rate
sponsored_conversion_rate
organic_vs_sponsored_mix
```

Deberán analizarse sin confundir paid placement con organic recommendation quality.

## 5299. Personalization / Recommendation Quality KPIs

Podrá medir:

```text
personalized_item_save_rate
personalized_CTA_rate
not_relevant_feedback_rate
recommendation_followthrough_rate
```

sin usar protected attributes como optimization target.

## 5300. Metric Governance

Cada KPI:

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

## 5301. Data Quality Controls

Checks:

- orphan domain references;
- duplicate listings;
- stale source snapshots;
- conflicting prices;
- missing disclosures;
- invalid provider status;
- missing referral attribution;
- duplicate conversion;
- commission without qualifying event;
- inconsistent journey status.

## 5302. Data Quality Finding

Campos:

```text
id
findingType
severity
resourceType
resourceId
description
sourceReferences
blocking
status
createdAt
resolvedAt
```

## 5303. Data Portability

El cliente podrá obtener, sujeto a policy:

- saved items;
- saved comparisons;
- marketplace preferences;
- journeys;
- referral history;
- consent history;
- conversion/outcome references;
- support/complaint records as applicable.

## 5304. Migration In

Pipeline:

```text
import catalog/provider data
→ map domain references
→ verify source/version
→ import active journeys
→ preserve external IDs
→ create migration snapshot
→ reconcile
```

No inventar historical source lineage.

## 5305. Migration Record

Campos:

```text
id
sourceSystem
cutoffDate
importedItems
importedListings
importedProviders
importedJourneys
importedReferrals
importedConversions
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 5306. Migration Out

Export deberá preservar:

```text
domain references
listing versions
source snapshots
consents
journey events
referrals
conversions
commission references
audit references
```

según access/retention.

## 5307. Business Continuity

Ante outage:

```text
preserve last verified catalog
→ mark freshness
→ disable risky submissions if uncertain
→ maintain read-only browse when safe
→ queue low-risk actions
→ restore adapters
→ reconcile external outcomes
```

## 5308. Disaster Recovery Priority

Prioridad:

1. unknown referral/application outcomes;
2. active client journeys;
3. provider status/availability;
4. catalog/source freshness;
5. conversion/commission reconciliation;
6. search/index rebuild;
7. routine analytics.

## 5309. End-to-End Tests

### Scenario 1 — Organic discovery to verified conversion

```text
browse
→ listing
→ potential fit
→ comparison
→ consent
→ referral
→ partner received
→ verified conversion
→ commission evaluation
```

### Scenario 2 — Sponsored item

```text
sponsored placement
→ disclosure
→ CTA
→ referral
→ attribution
→ conversion
```

Sponsored status permanece visible/auditable.

### Scenario 3 — Stale source

```text
published listing
→ source becomes stale
→ listing degraded/blocked
→ matches invalidated
→ source refreshed
→ republish/rematch
```

### Scenario 4 — Unknown referral outcome

```text
submission timeout
→ outcome_unknown
→ no blind retry
→ partner reconciliation
→ final status
```

### Scenario 5 — Personalization disabled

```text
client opts out
→ personalization removed
→ browse/search still functional
```

### Scenario 6 — Commission reversal

```text
verified conversion
→ commission earned
→ qualifying event reversed
→ commission reversal
→ revenue adjustment
```

### Scenario 7 — Suspended partner

```text
partner suspended
→ new referrals blocked
→ active journeys preserved
→ client informed when needed
```

### Scenario 8 — Security / routing manipulation

```text
unauthorized routing change
→ denied
→ alert
→ incident
→ evidence preserved
```

## 5310. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 37

El Módulo 37 estará completo cuando:

1. Exista Marketplace Catalog.
2. Exista Category hierarchy.
3. Exista generic Marketplace Item.
4. Marketplace reutilice domain sources.
5. Exista Marketplace Listing.
6. Listing y product facts estén separados.
7. Exista Listing Versioning.
8. Exista source snapshot/freshness.
9. Exista Provider Profile.
10. Exista Provider Verification.
11. Exista Marketplace Offer.
12. Marketplace Offer y personalized offer estén separados.
13. Exista Pricing Summary.
14. Exista Availability.
15. Exista Listing Disclosure Set.
16. Exista Content Governance.
17. Existan prohibited claims.
18. Exista Localization.
19. Exista Browse.
20. Existan Collections.
21. Sponsored placement sea disclosed.
22. Exista Search.
23. Exista derived Search Index.
24. Existan Filters/Sort.
25. Exista Detail Page.
26. Existan capability-aware CTAs.
27. Exista Anonymous Browse.
28. Exista Eligibility Context.
29. Exista Context Versioning.
30. Exista data minimization.
31. Existan Domain Screening Adapters.
32. Exista normalized Potential Fit.
33. Exista Match Record.
34. Exista Match Explanation.
35. Unknown permanezca unknown.
36. Exista Comparison Workspace.
37. Comparison fields tengan provenance.
38. Cost comparisons sean honestas.
39. Existan Ranking Inputs.
40. Organic/sponsored/editorial/personalized estén separados.
41. Exista Ranking Version.
42. Exista Personalization Consent.
43. Personalization pueda apagarse.
44. Exista Ranking Explanation.
45. Exista Disclosure Engine.
46. Exista M38 Recommendation Handoff.
47. Existan Recommendation Safety Flags.
48. Exista Marketplace Journey.
49. Exista Pre-Handoff Gate.
50. Exista Lead Record.
51. Exista Referral Record.
52. Exista Referral Idempotency.
53. Unknown outcome bloquee blind retry.
54. Existan Cross-Module Handoffs.
55. Exista scoped consent.
56. Exista safe external redirect.
57. Exista Attribution.
58. Existan verified Conversion Records.
59. Exista conversion deduplication.
60. Exista Status Synchronization.
61. Raw partner statuses se preserven.
62. Exista Lead Routing.
63. Routing preserve client choice.
64. Exista Journey Resume.
65. Exista Conversion Funnel.
66. Exista Client Marketplace Portal.
67. Existan Saved Items.
68. Existan Saved Comparisons.
69. Existan Active Journeys.
70. Existan notification preferences/dedup.
71. Exista Commission Record.
72. Commission dependa de verified qualifying event.
73. Exista Marketplace Revenue.
74. Financing principal/credit limits/grants/DPA no sean SG revenue.
75. Existan Unit Economics.
76. Exista Partner Operations Workspace.
77. Exista strict partner isolation.
78. Existan partner status/conversion submissions.
79. Exista evidence requirement.
80. Exista Partner Quality.
81. Existan Complaints.
82. Existan Disputes.
83. Exista Commission Reversal.
84. Exista Partner Remediation.
85. Suspended partners no reciban new referrals.
86. Offboarding preserve active journeys.
87. Existan Integration Adapters.
88. Exista webhook inbox.
89. Exista polling fallback.
90. Exista external idempotency.
91. Exista Automation Engine.
92. Existan automation risk levels.
93. High-risk automation requiera gate.
94. Existan prohibited automations.
95. AI esté grounded.
96. AI no duplique M38.
97. Exista Marketplace Governance.
98. Exista Sponsored Content Governance.
99. Exista Compensation Conflict Control.
100. Exista Claim Registry/Gate.
101. Exista MFA/RBAC/ABAC.
102. Exista tenant/partner isolation.
103. Exista Export Governance.
104. Exista Break-Glass.
105. Exista Security Incident Workflow.
106. Exista Admin Console.
107. Existan Work Queues/SLA.
108. Exista Observability.
109. Existan Operational Alerts.
110. Existan Analytics Dashboards.
111. Exista Metric Governance.
112. Existan Data Quality Controls.
113. Exista Data Portability.
114. Exista Migration In/Out.
115. Exista Business Continuity.
116. Exista Disaster Recovery priority.
117. Existan E2E tests.
118. Toda listing material tenga source/version.
119. Toda referral tenga consent/attribution.
120. Toda conversion tenga verification status.
121. Toda commission tenga contract/rule/version.
122. Toda sponsored placement sea visible.
123. Toda personalized ranking sea explicable.
124. Ninguna IA prometa approval.
125. Ningún retry duplique external actions.
126. Toda sensitive access quede auditada.
127. La UI funcione en español e inglés.
128. Code identifiers estén en inglés.
129. Las cinco partes estén integradas.
130. El módulo sea implementable por Codex end-to-end.

### Instrucciones finales para Codex

1. Lee las cinco partes completas.
2. Reutiliza domain registries de M30–M36.
3. No dupliques product/program source of truth.
4. Implementa generic MarketplaceItem.
5. Implementa versioned Listings/Offers.
6. Implementa source freshness gates.
7. Implementa Provider Verification.
8. Implementa Browse/Search/Collections.
9. Implementa Sponsored disclosures.
10. Implementa Eligibility Context.
11. Implementa Domain Screening Adapters.
12. Mantén unknown como unknown.
13. Implementa Comparison provenance.
14. Separa organic/sponsored/editorial/personalization signals.
15. Implementa Personalization Consent/Off Mode.
16. Implementa Ranking Explanation.
17. Implementa Disclosure Engine.
18. Handoff recommendation candidates a M38; no dupliques M38.
19. Implementa Marketplace Journey.
20. Implementa Pre-Handoff Gate.
21. Implementa Referral idempotency.
22. No blind retry unknown outcomes.
23. Implementa Cross-Module Handoffs.
24. Implementa scoped consent.
25. Implementa Attribution/Conversions.
26. Preserva raw partner statuses.
27. Implementa Lead Routing con client choice.
28. Implementa Client Portal.
29. Implementa Commission/Revenue.
30. Nunca cuentes financing principal/limits/grants como SG revenue.
31. Implementa Partner Operations e isolation.
32. Implementa Complaints/Disputes.
33. Implementa Remediation/Suspension.
34. Implementa adapters/webhooks/polling.
35. Implementa automation risk levels.
36. Limita AI a grounded assistance.
37. Implementa claim/sponsored governance.
38. Implementa MFA/RBAC/ABAC.
39. Implementa Export Governance.
40. Implementa immutable Audit.
41. Implementa Observability/Alerts.
42. Implementa Analytics/Metric Governance.
43. Implementa Data Quality.
44. Implementa Migration/Portability.
45. Implementa Business Continuity.
46. Ejecuta los E2E tests.
47. No marques módulo listo si sponsored results pueden ocultarse.
48. No marques módulo listo si partner compensation puede alterar organic ranking silenciosamente.
49. No marques módulo listo si referral retries pueden duplicarse.
50. No marques módulo listo si personalized ranking carece de consent/explanation.

### Verificación final para entrega

- ¿Marketplace referencia los domain sources correctos?
- ¿Listings tienen source/version/freshness?
- ¿Sponsored content está claramente marcado?
- ¿Personalization es consent-aware y reversible?
- ¿Comparisons conservan provenance?
- ¿M37 no duplica M38?
- ¿Referrals son idempotentes?
- ¿Unknown external outcomes se reconcilian antes de retry?
- ¿Conversions son verificadas?
- ¿Commission requiere contract + qualifying event?
- ¿Partners están aislados?
- ¿Claims sensibles requieren source?
- ¿AI está grounded?
- ¿Security protege client/partner/commercial data?
- ¿Analytics distingue impressions, leads y verified outcomes?
- ¿BCP evita duplicate external actions?
- ¿Los ocho escenarios E2E pasan?

# Estado Final del Módulo 37

```text
MÓDULO 37:
FINANCIAL MARKETPLACE

PARTES:
1. Catalog, Listings, Offers, Providers, Search y Browse
2. Eligibility, Matching, Comparison, Ranking y Recommendation Handoff
3. Journeys, Referrals, Consent, Attribution, Routing y Conversions
4. Client Portal, Commissions, Economics, Partner Operations, Disputes y Lifecycle
5. Integrations, Automation, AI, Governance, Security, Analytics y Cierre

SECCIONES:
4986–5310

ESTADO:
MODULE COMPLETE
```

