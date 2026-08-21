# SG Solutions Platform — Módulo 39: CreditCardBroker Integration

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 39. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus tres partes.
>
> **Principio de actualidad:** cualquier regla, método de integración, oferta, comisión, disclosure, categoría, issuer, URL, creative o requisito de CreditCardBroker deberá manejarse como dato externo versionado y verificable. No hardcodear hechos comerciales cambiantes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, partner account, integration modes, offer/feed ingestion, catalog mapping, approved content, disclosures, links, availability y tracking | 5571–5635 | **COMPLETE** |
| 2 | Client discovery, recommendation handoff, click/referral/application journeys, attribution, conversion, commissions, reconciliation y partner operations | 5636–5700 | **COMPLETE** |
| 3 | Automation, AI, compliance, security, admin, analytics, migration, continuity, E2E y cierre | 5701–5765 | **COMPLETE** |

**Estado global del Módulo 39:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Partner Account, Integration Modes, Offer/Feed Ingestion, Catalog Mapping, Approved Content, Disclosures, Links, Availability y Tracking

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 38 — Recommendation Engine  
**Secciones incluidas:** 5571–5635  
**Audiencia:** Owner, Codex, marketplace operators, partner managers, compliance, marketing operations, data engineers, support y analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** CreditCardBroker.com se integra como affiliate/marketing partner dentro del Módulo 37 Financial Marketplace, preservando sus offers, creatives, disclosures, links y partner rules como source-controlled external data. SG Solutions organiza, presenta y refiere; no se convierte por ello en card issuer, lender ni underwriting decision-maker.

## 5571. Objetivo del Módulo 39

El Módulo 39 deberá integrar CreditCardBroker dentro de SG Solutions para poder:

- importar/sincronizar offers permitidas;
- mapear offers al Financial Marketplace;
- mostrar content aprobado;
- mostrar disclosures;
- dirigir al cliente al destination permitido;
- conservar tracking/attribution;
- rastrear conversion outcomes cuando exista data;
- reconciliar commissions;
- auditar partner compliance.

## 5572. CreditCardBroker Integration Principle

```text
CreditCardBroker source
→ approved integration channel
→ normalized external offer
→ SG marketplace listing/reference
→ disclosure
→ client action
→ affiliate tracking
→ external outcome
→ reconciliation
```

Nunca:

```text
scraped offer
→ rewritten claims
→ SG-created affiliate creative
→ unverified application link
```

## 5573. Role Boundary

SG Solutions deberá ser tratado como:

```text
affiliate_or_business_marketing_partner
marketplace_operator
client_education_and_referral_platform
```

según agreement vigente.

No deberá implicar automáticamente que SG sea:

```text
issuer
bank
lender
underwriter
credit_reporting_agency
CreditCardBroker itself
```

## 5574. External Rules Registry

Crear:

```text
CreditCardBrokerRuleSnapshot
```

Campos:

```text
id
sourceUrl
sourceType
ruleVersion
retrievedAt
effectiveAtOptional
contentHash
status
reviewedBy
reviewedAt
```

## 5575. Current Public Integration Modes

La arquitectura deberá soportar, subject to current partner authorization:

```text
CreditCardBroker automated JavaScript
CreditCardBroker API
CreditCardBroker hosted affiliate landing page
approved custom marketing method
```

La disponibilidad real de cada mode deberá validarse en partner account/rules.

## 5576. Integration Mode Registry

Campos:

```text
id
integrationMode
authorizationStatus
approvedDomains
approvedSurfaces
effectiveFrom
effectiveTo
sourceRuleSnapshotId
status
```

## 5577. Integration Authorization Status

```text
not_requested
requested
approved
limited
suspended
revoked
expired
unknown
```

No usar API solo porque el platform soporta API técnicamente.

## 5578. Approved Domain Registry

CreditCardBroker podrá requerir conocer/autorizar locations donde se muestran offers.

Registrar:

```text
domain
subdomain
pathPatternOptional
surfaceType
approvalStatus
approvedAt
sourceReference
```

## 5579. Approved Surface Types

```text
SG_marketplace
SG_client_portal
approved_landing_page
approved_article
approved_review
approved_email_one_to_one
other_explicitly_approved
```

## 5580. Marketing Method Boundary

Métodos nuevos como:

```text
review
article
video
custom_campaign
embedded_recommendation_page
```

deberán pasar `partner_approval_required` cuando las reglas vigentes así lo exijan.

## 5581. Partner Account Record

Campos:

```text
id
partnerOrganizationId
externalPartnerAccountId
accountDisplayName
legalEntityName
status
onboardingDate
taxFormStatus
primaryContactReference
integrationModeIds
createdAt
updatedAt
```

## 5582. Partner Account Status

```text
onboarding
active
restricted
paused
suspended
terminated
unknown
```

## 5583. Tax / Business Documentation Context

Cuando el partner program lo requiera, registrar references como:

```text
W9_status
business_name_match_status
tax_document_reference
verification_date
```

Sin exponer tax identifiers innecesariamente.

## 5584. CreditCardBroker Provider Record

Crear/usar Partner Registry record:

```text
providerType = affiliate_network
```

con:

```text
legalName
DBA
publicName
supportChannels
verificationStatus
partnerStatus
```

## 5585. Advertiser versus Affiliate Network

La plataforma deberá separar:

```text
CreditCardBroker = affiliate network / marketing partner
```

de:

```text
Advertiser / issuer / product provider
```

para cada offer.

## 5586. Advertiser Record

Campos:

```text
id
networkProviderId
externalAdvertiserIdOptional
legalName
displayName
providerType
status
source
```

## 5587. Offer Source Record

Entidad canónica:

```text
CreditCardBrokerOfferSource
```

Campos:

```text
id
externalOfferId
externalCategory
advertiserId
sourceMethod
sourcePayloadReference
sourceVersion
retrievedAt
status
```

## 5588. Source Methods

```text
API
automated_feed
approved_JavaScript_metadata
hosted_landing_page_metadata
manual_partner_export
manual_verified_entry
```

No usar scraping no autorizado como integración principal.

## 5589. Offer Source Preservation

Guardar raw/source payload cuando contract/policy permita:

```text
rawPayloadHash
rawPayloadReference
retrievedAt
sourceMethod
```

Normalización no deberá borrar source.

## 5590. CreditCardBroker Offer

Campos normalizados:

```text
id
externalOfferId
offerType
productFamily
advertiserId
title
status
sourceVersion
effectiveFromOptional
effectiveToOptional
createdAt
updatedAt
```

## 5591. Supported Product Families

Arquitectura deberá poder mapear categorías como:

```text
consumer_credit_card
secured_credit_card
business_credit_card
personal_loan
auto_loan
mortgage_related
business_loan
credit_monitoring
credit_builder
rental_reporting
checking
savings
merchant_services
insurance
other_financial_product
```

No asumir que todas estén siempre disponibles.

## 5592. Credit Card Offer Subtypes

```text
secured
unsecured
rewards
business
store_or_catalog_context
credit_building
other
```

según source actual.

## 5593. Offer Status

```text
draft
active
limited
paused
expired
retired
source_unavailable
verification_required
```

## 5594. Offer Freshness

Campos:

```text
lastSourceCheckAt
freshnessStatus
refreshDueAt
sourceRuleVersion
```

Estados:

```text
current
aging
stale
unknown
```

## 5595. Offer Freshness Gate

Antes de render:

```text
offer active
advertiser active
partner account active
integration method authorized
source current
required disclosure current
tracking destination valid
```

## 5596. Marketplace Mapping

Cada offer deberá mapearse a:

```text
M37 MarketplaceItem
```

Campos:

```text
marketplaceItemId
creditCardBrokerOfferId
mappingVersion
createdAt
status
```

## 5597. Marketplace Mapping Boundary

M39 posee integration-specific data.

M37 posee:

```text
marketplace discovery
listing shell
search
saved items
journeys
```

M38 posee:

```text
recommendation logic
```

M39 no duplicará esos engines.

## 5598. Offer Content Package

Campos:

```text
headline
bodyCopy
featureBullets
creativeAssets
CTA_label
disclosureText
importantTermsReference
source
sourceVersion
```

## 5599. Approved Content Principle

Cuando partner rules requieran partner-provided content:

```text
provider content
→ preserve
→ render
```

No:

```text
provider content
→ AI rewrite
→ publish as approved offer content
```

## 5600. AI Content Restriction

AI podrá:

- summarize internally;
- classify offer;
- map categories;
- detect missing fields.

AI no deberá publicar rewritten CreditCardBroker offer claims cuando partner rules exijan supplied/approved content.

## 5601. Creative Asset Record

Campos:

```text
id
offerId
assetType
sourceUrlOrReference
sourceHashOptional
dimensionsOptional
altTextFromSourceOptional
status
effectiveFromOptional
effectiveToOptional
```

## 5602. Creative Asset Types

```text
logo
card_image
banner
badge
disclosure_asset
other
```

## 5603. Creative Asset Boundary

No editar:

- issuer logo;
- card artwork;
- rate graphic;
- promotional graphic;
- partner disclosure graphic;

sin authorization.

## 5604. Offer Terms Snapshot

Campos posibles:

```text
APR_context
annualFee
introAPR
introPeriod
balanceTransferContext
creditNeededLabel
securityDepositContext
rewardContext
otherTerms
```

Todos deben venir de source actual.

## 5605. Terms Unknown Policy

Si term no está disponible:

```text
unknown
not_provided
see_provider_terms
```

No inferir.

## 5606. Important Terms Link

Cada card/financial offer podrá contener:

```text
importantTermsUrl
termsVersionOptional
retrievedAt
status
```

Destination deberá ser allowlisted/verificada.

## 5607. Affiliate Destination Link

Campos:

```text
id
offerId
externalTrackingUrl
destinationHost
trackingCodeReference
effectiveFrom
effectiveTo
status
```

## 5608. Affiliate Link Security

La plataforma deberá:

- allowlist domains;
- prevent open redirect;
- not expose secrets;
- preserve exact tracking parameters;
- record click;
- prevent unauthorized rewriting.

## 5609. Tracking Parameter Registry

Campos:

```text
parameterName
purpose
requiredFlag
source
sensitivity
forwardingRule
```

## 5610. Client Identifier Boundary

No enviar:

```text
SSN
raw credit report
bank account
tax ID
sensitive internal IDs
```

en affiliate URL query parameters.

## 5611. Tracking Token

Cuando sea permitido:

```text
opaqueTrackingToken
```

que mapee internamente a:

```text
journeyId
clickId
campaignId
```

sin revelar client PII.

## 5612. Hosted Landing Page Integration

Campos:

```text
landingPageId
externalUrl
categoryContext
offerContext
affiliateContext
status
verifiedAt
```

## 5613. Hosted Landing Page Boundary

SG podrá dirigir a hosted partner page cuando esté authorized.

La página externa deberá mostrarse como:

```text
external partner experience
```

y no como una SG-owned underwriting page.

## 5614. JavaScript Integration Record

Campos:

```text
scriptId
approvedDomain
scriptSource
scriptVersionOptional
placement
status
verifiedAt
```

## 5615. JavaScript Security Boundary

Third-party JavaScript deberá:

- ejecutarse solo en approved surfaces;
- pasar CSP/security review;
- no obtener SG session secrets;
- no acceder a unrelated client data;
- poder deshabilitarse rápidamente.

## 5616. JavaScript Isolation Strategy

Preferir cuando técnicamente viable:

```text
sandboxed container
isolated page boundary
strict CSP
minimal DOM exposure
```

según integration compatibility.

## 5617. API Integration Record

Campos:

```text
apiConnectionId
authorizationStatus
baseEnvironment
credentialReference
capabilities
rateLimitContext
lastSuccessfulCallAt
status
```

## 5618. API Capability Discovery

No asumir endpoints.

Registrar solo capabilities realmente concedidas/documentadas:

```text
offers_read
categories_read
links_read
conversion_read
commission_read
other
```

## 5619. API Schema Version

Campos:

```text
schemaVersion
documentedAt
effectiveAt
breakingChangeFlag
sourceReference
```

## 5620. API Ingestion Workflow

```text
authenticate
→ fetch authorized data
→ store source snapshot
→ validate
→ normalize
→ diff
→ publish/update mapping
→ audit
```

## 5621. Feed Diff

Detectar:

```text
new_offer
removed_offer
terms_changed
creative_changed
link_changed
advertiser_changed
status_changed
disclosure_changed
```

## 5622. Material Change Gate

Cambios materiales deberán:

```text
pause_or_flag affected marketplace listing
→ refresh source
→ verify disclosures
→ publish new version
```

según policy.

## 5623. Offer Availability

Campos:

```text
offerId
jurisdictionOptional
audienceContext
availabilityStatus
startAtOptional
endAtOptional
source
```

## 5624. Availability Status

```text
available
limited
temporarily_unavailable
not_available
expired
verification_required
unknown
```

## 5625. Geography Boundary

No inferir nationwide availability.

Cuando source no especifique:

```text
geography = unknown_or_source_defined
```

## 5626. Credit Needed Label

Labels como:

```text
bad
fair
good
excellent
no_credit
N/A
```

deberán tratarse como partner/advertiser marketing context, no como SG eligibility conclusion.

## 5627. Approval Claim Boundary

Claims publicadas por advertiser/network deberán conservar:

```text
exact source context
disclosure
source version
```

SG no deberá convertir marketing statistics en personal approval probability.

## 5628. Disclosure Package

Campos:

```text
affiliateDisclosure
advertiserDisclosure
offerDisclosure
importantTermsDisclosure
SGRoleDisclosure
externalSiteDisclosure
sourceVersion
```

## 5629. Affiliate Compensation Disclosure

Marketplace deberá poder comunicar que:

```text
SG may receive compensation
```

cuando corresponda.

La wording final deberá provenir de approved compliance template/partner requirements.

## 5630. Disclosure Placement

Podrá requerirse en:

```text
offer card
offer detail
comparison
recommendation
before CTA
external redirect
```

## 5631. Offer Display Record

Campos:

```text
id
offerId
marketplaceItemId
listingVersionId
surface
position
creativeAssetId
disclosureVersion
renderedAt
clientIdOptional
sessionId
```

## 5632. Display Integrity Check

Antes de render:

```text
content package matches source
creative valid
link valid
disclosures present
offer active
partner active
```

## 5633. Compliance / Integration Finding

Tipos:

```text
unapproved_content
unapproved_surface
unapproved_integration_mode
stale_offer
terms_mismatch
creative_mismatch
invalid_affiliate_link
missing_affiliate_disclosure
missing_offer_disclosure
unauthorized_API_use
third_party_script_risk
```

## 5634. Permissions, APIs, Events and Workflows

### Permisos

```text
ccb.partner_account.read
ccb.partner_account.manage

ccb.rules.read
ccb.rules.verify

ccb.offer_source.read
ccb.offer.read
ccb.offer.sync
ccb.offer.map

ccb.content.read
ccb.content.verify

ccb.link.read
ccb.link.verify

ccb.integration.read
ccb.integration.manage
ccb.integration.authorize

ccb.finding.read
ccb.finding.manage
```

### APIs

```text
GET  /api/integrations/creditcardbroker/status
POST /api/integrations/creditcardbroker/rule-snapshots

POST /api/integrations/creditcardbroker/sync
GET  /api/integrations/creditcardbroker/offers
GET  /api/integrations/creditcardbroker/offers/{id}

POST /api/integrations/creditcardbroker/offers/{id}/marketplace-map
POST /api/integrations/creditcardbroker/offers/{id}/verify-content
POST /api/integrations/creditcardbroker/offers/{id}/verify-link

GET  /api/integrations/creditcardbroker/findings
```

### Eventos

```text
CreditCardBrokerRuleSnapshotCreated
CreditCardBrokerIntegrationAuthorized
CreditCardBrokerPartnerAccountActivated
CreditCardBrokerOfferIngested
CreditCardBrokerOfferChanged
CreditCardBrokerOfferExpired
CreditCardBrokerOfferMapped
CreditCardBrokerCreativeChanged
CreditCardBrokerAffiliateLinkChanged
CreditCardBrokerDisclosureChanged
CreditCardBrokerListingBlocked
CreditCardBrokerFindingCreated
```

### Workflows

```text
CreditCardBroker Partner Onboarding Workflow
CreditCardBroker Rule Verification Workflow
CreditCardBroker Offer Sync Workflow
CreditCardBroker Marketplace Mapping Workflow
CreditCardBroker Content Verification Workflow
CreditCardBroker Link Verification Workflow
CreditCardBroker Material Change Workflow
CreditCardBroker Finding Workflow
```

## 5635. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Rule Snapshot.
2. Versionar partner rules.
3. Crear integration mode.
4. Bloquear unapproved API mode.
5. Crear approved domain.
6. Bloquear unapproved surface.
7. Crear Partner Account.
8. Crear tax-document status reference.
9. Crear CreditCardBroker provider.
10. Crear advertiser separado.
11. Crear Offer Source.
12. Ingerir API/mock source.
13. Ingerir manual verified source.
14. Conservar source payload/hash.
15. Crear normalized Offer.
16. Mapear product family.
17. Expirar offer.
18. Marcar offer stale.
19. Bloquear stale render.
20. Crear Marketplace Mapping.
21. Crear Content Package.
22. Bloquear AI-rewritten public offer copy.
23. Crear Creative Asset.
24. Bloquear unapproved creative edit.
25. Crear Terms Snapshot.
26. Mantener unknown term.
27. Crear Important Terms Link.
28. Crear Affiliate Destination Link.
29. Bloquear non-allowlisted destination.
30. Preservar tracking parameters.
31. Bloquear PII in URL.
32. Crear opaque tracking token.
33. Crear hosted landing page.
34. Crear JavaScript Integration Record.
35. Aplicar third-party script restrictions.
36. Crear API Integration Record.
37. Registrar only authorized capabilities.
38. Versionar API schema.
39. Ejecutar ingestion workflow.
40. Detectar new offer.
41. Detectar changed terms.
42. Detectar changed link.
43. Aplicar material-change gate.
44. Crear availability record.
45. Mantener unknown geography.
46. Importar credit-needed label.
47. Confirmar label no es SG eligibility.
48. Preservar advertiser approval claim context.
49. Crear Disclosure Package.
50. Renderizar compensation disclosure.
51. Verificar disclosure placement.
52. Crear Offer Display Record.
53. Ejecutar display integrity check.
54. Crear unapproved-content finding.
55. Crear invalid-link finding.
56. Crear unauthorized-API finding.
57. Probar permissions.
58. Probar APIs.
59. Probar events/outbox.
60. Probar workflows.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista External Rules Registry.
2. Existan integration modes versionables.
3. API requiera authorization real.
4. Exista Approved Domain Registry.
5. Existan approved surface types.
6. Custom marketing methods puedan requerir approval.
7. Exista Partner Account Record.
8. Exista account status.
9. Exista tax/business-document context.
10. CreditCardBroker esté separado de advertisers.
11. Exista Advertiser Record.
12. Exista Offer Source Record.
13. Existan source methods.
14. Raw/source data pueda preservarse.
15. Exista normalized CreditCardBroker Offer.
16. Existan product-family mappings.
17. Existan credit-card subtypes.
18. Exista Offer Status.
19. Exista Offer Freshness.
20. Exista freshness gate.
21. Exista M37 Marketplace Mapping.
22. M39/M37/M38 boundaries estén claras.
23. Exista Offer Content Package.
24. Partner-provided content no se reescriba indebidamente.
25. Exista AI content restriction.
26. Exista Creative Asset Record.
27. Creative edits requieran authorization.
28. Exista Offer Terms Snapshot.
29. Unknown terms permanezcan unknown.
30. Exista Important Terms Link.
31. Exista Affiliate Destination Link.
32. Links estén allowlisted.
33. Exista Tracking Parameter Registry.
34. Sensitive PII no viaje en URL.
35. Exista opaque tracking token.
36. Exista hosted landing-page model.
37. Hosted page se identifique como external experience.
38. Exista JavaScript Integration Record.
39. Third-party script tenga security boundary.
40. Exista API Integration Record.
41. API capabilities se descubran/no inventen.
42. Exista API schema version.
43. Exista ingestion workflow.
44. Exista feed diff.
45. Exista material-change gate.
46. Exista Offer Availability.
47. Geography unknown no se infiera.
48. Credit-needed labels no sean SG eligibility.
49. Approval claims conserven source/disclosure.
50. Exista Disclosure Package.
51. Exista affiliate-compensation disclosure capability.
52. Exista disclosure placement.
53. Exista Offer Display Record.
54. Exista Display Integrity Check.
55. Existan Integration/Compliance Findings.
56. Existan permisos/APIs/events/workflows.
57. Toda offer tenga source/version.
58. Toda external link sea verificable.
59. Toda material display sea auditable.
60. Parte 1 termine lista para Journey/Attribution/Commission de Parte 2.

### Instrucciones para Codex

1. Lee M37 y M38 completos antes de implementar.
2. Trata CreditCardBroker como external affiliate network.
3. No hardcodees current offers.
4. Implementa versioned RuleSnapshots.
5. Implementa IntegrationMode authorization.
6. Implementa ApprovedDomains/Surfaces.
7. No uses API si partner no la ha autorizado.
8. Implementa PartnerAccount.
9. Separa network y advertiser.
10. Implementa OfferSource + normalized Offer.
11. Conserva source lineage.
12. Implementa MarketplaceMapping a M37.
13. No dupliques M37 discovery.
14. No dupliques M38 recommendation logic.
15. Implementa partner-provided ContentPackage.
16. Bloquea AI public rewrite cuando policy lo prohíba.
17. Implementa CreativeAsset integrity.
18. Implementa TermsSnapshot con unknown explícito.
19. Implementa allowlisted affiliate links.
20. Usa opaque tracking tokens, no PII.
21. Implementa hosted-page / JS / API modes separadamente.
22. Aísla third-party JS.
23. Implementa API capability discovery.
24. Implementa sync/diff/material-change gates.
25. Implementa availability sin asumir nationwide.
26. No conviertas credit-needed label en approval prediction.
27. Implementa DisclosurePackage.
28. Implementa DisplayRecord/IntegrityCheck.
29. Implementa Findings.
30. Implementa permissions/APIs/events/workflows.
31. Implementa immutable audit.
32. No marques Parte 1 completa si SG puede publicar una oferta con copy/link/disclosure no verificables.

### Verificación final de Parte 1

- ¿CreditCardBroker y advertiser están separados?
- ¿Integration mode requiere authorization?
- ¿Approved domains/surfaces están versionados?
- ¿Offers vienen de source autorizado?
- ¿M39 mapea a M37 en vez de duplicarlo?
- ¿M38 sigue siendo el recommendation engine?
- ¿AI no reescribe claims restringidos?
- ¿Terms desconocidos permanecen unknown?
- ¿Affiliate links están allowlisted?
- ¿No hay PII sensible en URLs?
- ¿Credit-needed labels no son approval predictions?
- ¿Disclosures se muestran en surfaces correctas?
- ¿Material changes bloquean/refresh listings?
- ¿Toda display queda auditada?

---

# Parte 2 — Client Discovery, Recommendation Handoff, Click/Referral/Application Journeys, Attribution, Conversion, Commissions, Reconciliation y Partner Operations

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 39 — Parte 1  
**Secciones incluidas:** 5636–5700  
**Audiencia:** Owner, Codex, marketplace operators, partner managers, affiliate operations, finance, compliance, support y analysts  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** CreditCardBroker funciona como external affiliate/marketing partner dentro del journey del Módulo 37 y del ranking/recommendation del Módulo 38. SG preserva client choice, disclosures, tracking, source lineage y outcome uncertainty; issuer/network decisions y application experience permanecen externos salvo integración expresamente autorizada.

## 5636. Objetivo de Parte 2

Esta parte define el journey operacional desde que una offer de CreditCardBroker aparece en SG hasta que exista un outcome económico o de conversión verificable.

Pipeline:

```text
M37 discovery
→ M38 recommendation context
→ CCB offer display
→ disclosure
→ click / referral
→ external destination
→ external application context
→ status/conversion signal
→ attribution
→ commission candidate
→ reconciliation
→ partner operations
```

## 5637. Client Discovery Boundary

La discovery deberá ocurrir principalmente mediante:

```text
M37 Marketplace
```

M39 aporta:

```text
CCB offer source
approved content
link
tracking
network metadata
```

No deberá crear un marketplace paralelo.

## 5638. Offer Discovery Eligibility

Antes de mostrar una CCB offer:

```text
offer active
source current
provider/network active
advertiser active
surface approved
link valid
disclosures current
jurisdiction compatible if known
```

## 5639. Recommendation Handoff from M38

M38 podrá incluir una CCB offer como candidate solo si M39 devuelve:

```text
marketplaceItemId
offerId
sourceVersion
availability
knownTerms
riskFlags
disclosureRequirements
trackingCapability
```

## 5640. Recommendation Boundary

M39 no deberá:

- calcular organic recommendation score;
- afirmar que una tarjeta es "la mejor";
- predecir issuer approval;
- inferir credit limit;
- inferir APR personal;
- sustituir M38 explanations.

## 5641. Credit Card Recommendation Safety Context

Cuando candidate sea una tarjeta, M39 deberá poder exponer a M38:

```text
annualFeeContext
APRContext
introOfferContext
balanceTransferContext
securityDepositContext
rewardsContext
creditNeededLabelFromSource
importantTermsReference
unknownFields
```

## 5642. Credit Needed Label Boundary

Un partner label como:

```text
Fair Credit
Good Credit
Excellent Credit
```

deberá mostrarse como:

```text
provider/network-provided credit profile label
```

No como:

```text
you qualify
```

## 5643. Client Offer View Record

Campos:

```text
id
clientIdOptional
sessionId
offerId
marketplaceItemId
listingVersionId
recommendationIdOptional
surface
position
renderedAt
```

## 5644. Pre-Click Disclosure Gate

Antes del external CTA, verificar:

```text
affiliate relationship disclosure
SG role disclosure
external destination disclosure
important terms access
sponsored status if applicable
```

## 5645. CTA Types

```text
learn_more
view_offer
see_terms
apply_now_external
visit_partner_landing_page
compare
save
```

La wording final deberá respetar source/partner policy.

## 5646. Click Record

Campos:

```text
id
clientIdOptional
sessionId
offerViewId
offerId
marketplaceItemId
CTAType
trackingToken
clickedAt
destinationLinkId
```

## 5647. Click Idempotency / Dedup

Analytics deberá evitar contar accidentalmente múltiples browser retries como distinct high-value clicks.

Dedup configurable por:

```text
sessionId
offerId
CTAType
shortTimeWindow
```

sin borrar events legítimos.

## 5648. External Redirect Gate

Antes del redirect:

```text
link active
destination allowlisted
offer active
display version current
tracking token valid
required disclosures presented
```

## 5649. External Application Journey

Crear:

```text
CreditCardBrokerApplicationJourney
```

aunque SG no controle la application externa.

Campos:

```text
id
clientIdOptional
sessionId
offerId
clickId
marketplaceJourneyId
externalReferenceOptional
status
startedAt
lastUpdatedAt
```

## 5650. Application Journey Status

```text
redirected
external_application_possible
application_started_reported
application_submitted_reported
decision_reported
approved_reported
declined_reported
converted_reported
unknown
expired
closed
```

Todos los `_reported` deberán conservar source.

## 5651. Approval Boundary

SG no deberá convertir:

```text
click
landing-page visit
application start
partner tracking event
```

en:

```text
approved
```

sin explicit trustworthy external evidence.

## 5652. Issuer Decision Record

Cuando partner/network entregue data:

```text
id
journeyId
decisionStatus
rawDecisionStatus
source
receivedAt
externalReference
verificationStatus
```

## 5653. Decision Status

```text
approved_reported
declined_reported
pending_reported
needs_more_information_reported
unknown
```

SG no deberá modificar raw reason/status.

## 5654. Credit Limit Boundary

Si issuer/network devuelve credit limit:

```text
reportedCreditLimit
source
receivedAt
```

No estimar/fabricar cuando no exista.

## 5655. APR / Terms after Approval Boundary

Personalized terms posteriores a una decisión deberán venir de:

```text
issuer/network/client-provided official source
```

No reemplazar con public offer terms si difieren.

## 5656. Attribution Record

Reutilizar M37 attribution con CCB fields:

```text
networkProviderId
offerId
externalOfferId
advertiserId
trackingToken
clickId
campaignIdOptional
sourceSurface
```

## 5657. Attribution Source Priority

Prioridad conceptual:

```text
network_verified_conversion
network_tracking_record
domain_verified_client outcome
payment_or_commission record
manual verified evidence
inferred
```

`inferred` no deberá generar earned commission.

## 5658. Conversion Event Types

```text
click
qualified_click_if_defined
application_started_reported
application_submitted_reported
approved_reported
account_opened_reported
funded_or_activated_reported
commissionable_conversion_reported
other_partner_defined_conversion
```

## 5659. Conversion Definition Registry

Cada tipo deberá tener:

```text
conversionCode
definition
partnerRuleSnapshotId
qualifyingEvidence
commissionableFlag
effectiveFrom
effectiveTo
```

No hardcodear "approval = commission".

## 5660. Conversion Record

Campos:

```text
id
journeyId
offerId
conversionType
externalConversionIdOptional
occurredAt
reportedAt
source
verificationStatus
rawPayloadReferenceOptional
```

## 5661. Conversion Verification Status

```text
unverified
network_reported
network_verified
financially_reconciled
manual_verified
conflicting
reversed
```

## 5662. Conversion Deduplication

Dedup keys podrán usar:

```text
externalConversionId
trackingToken
offerId
conversionType
conversionDate
```

según partner data.

## 5663. Unknown Conversion Outcome

Si el cliente salió a un external site y no vuelve data:

```text
outcome = unknown
```

No inferir decline.

## 5664. Client-Reported Outcome

Cliente podrá informar:

```text
approved
declined
pending
did_not_apply
unknown
```

pero deberá etiquetarse:

```text
client_reported
```

hasta corroboración cuando sea material.

## 5665. Attribution Window

Campos:

```text
offerIdOrProgram
conversionType
lookbackWindow
ruleVersion
source
effectiveFrom
effectiveTo
```

## 5666. Multi-Touch Context

M39 deberá preservar touches como:

```text
view
comparison
recommendation
click
return_click
external_redirect
```

sin inventar partner commission logic.

## 5667. Commission Candidate

Cuando exista probable qualifying event:

```text
CreditCardBrokerCommissionCandidate
```

Campos:

```text
id
conversionId
offerId
partnerAccountId
expectedCommissionRuleId
status
createdAt
```

## 5668. Commission Rule

Campos:

```text
id
offerIdOptional
categoryOptional
conversionType
commissionType
amountOrRate
currency
effectiveFrom
effectiveTo
sourceRuleSnapshotId
status
```

Commercial values deberán venir de private authorized source cuando corresponda.

## 5669. Commission Rule Status

```text
draft
verified
active
expired
superseded
disputed
unknown
```

## 5670. Commission Calculation

Pipeline:

```text
verified conversion
→ active commission rule
→ calculate
→ expected commission
→ await partner statement/payment
→ reconcile
```

## 5671. Expected versus Earned versus Paid

Separar:

```text
expectedCommission
earnedCommission
approvedByPartnerCommission
paidCommission
reversedCommission
```

## 5672. Commission Recognition Boundary

No marcar `earned` solo por:

```text
click
redirect
client-reported approval
```

salvo que partner contract/rule defina explícitamente ese event como commissionable y exista evidence requerida.

## 5673. Commission Record

Reutilizar M37 Commission Record con:

```text
networkProviderId
CCBOfferId
externalConversionId
commissionRuleId
partnerStatementReference
```

## 5674. Partner Statement Record

Campos:

```text
id
partnerAccountId
statementPeriodStart
statementPeriodEnd
statementDate
statementReference
grossCommission
adjustments
netCommission
currency
status
```

## 5675. Statement Line

Campos:

```text
statementId
externalOfferIdOptional
externalConversionIdOptional
trackingReferenceOptional
conversionDateOptional
commissionAmount
adjustmentAmount
reasonCodeOptional
rawDescription
```

## 5676. Reconciliation Run

Campos:

```text
id
statementId
runVersion
matchedLines
unmatchedLines
amountMatched
amountUnmatched
status
startedAt
completedAt
```

## 5677. Reconciliation Matching

Match signals:

```text
externalConversionId
trackingToken
offerId
conversionDate
commissionAmount
clientOpaqueReference
```

Nunca usar sensitive client PII si no es necesario.

## 5678. Reconciliation Status

```text
pending
running
matched
partially_matched
unmatched
conflicting
manual_review
completed
```

## 5679. Reconciliation Exception

Tipos:

```text
missing_conversion
duplicate_statement_line
commission_amount_mismatch
unknown_offer
unknown_tracking_token
conversion_reversed
date_mismatch
currency_mismatch
```

## 5680. Commission Adjustment

Registrar:

```text
correction
bonus
chargeback
reversal
manual_partner_adjustment
other
```

Preservar original amount.

## 5681. Chargeback / Reversal

Cuando partner retire una commission:

```text
original commission
→ reversal event
→ negative adjustment
→ revenue correction
→ audit
```

## 5682. Revenue Handoff to M37

M39 deberá enviar a M37 economics:

```text
commissionId
verifiedAmount
paidAmount
status
networkProviderId
offerId
```

No duplicar revenue accounting.

## 5683. Partner Operations Dashboard

Vistas:

```text
Account Status
Integration Health
Offers
Clicks
Applications / Journeys
Conversions
Commissions
Statements
Reconciliation
Findings
Support
```

## 5684. Offer Performance View

Por offer:

```text
views
clicks
CTR
external_journeys
reported_applications
reported_conversions
commission_candidates
verified_commissions
```

## 5685. Funnel Integrity

Separar:

```text
view
click
redirect
application_reported
approval_reported
conversion
commission
payment
```

No colapsar funnel.

## 5686. Partner Health

Campos:

```text
accountStatus
offerFeedHealth
linkHealth
conversionFeedHealth
commissionFeedHealth
lastSuccessfulSync
openFindings
```

## 5687. Operational SLA

Podrá medir:

```text
offer_refresh_lag
link_failure_resolution_time
conversion_sync_lag
statement_reconciliation_time
finding_resolution_time
```

## 5688. Partner Support Case

Campos:

```text
id
partnerAccountId
issueType
externalTicketReferenceOptional
priority
status
createdAt
resolvedAt
```

## 5689. Support Case Types

```text
account_access
offer_feed
affiliate_link
tracking
conversion
commission
statement
API
JavaScript
compliance
other
```

## 5690. Tracking Dispute

Campos:

```text
id
clickId
conversionIdOptional
statementLineIdOptional
disputeReason
evidenceReferences
status
openedAt
resolvedAt
```

## 5691. Commission Dispute

Campos:

```text
id
commissionId
expectedAmount
partnerAmount
difference
reason
evidence
status
```

## 5692. Dispute Boundary

SG deberá preservar:

```text
internal expected calculation
partner statement
partner response
final resolution
```

sin sobrescribir evidencia original.

## 5693. Client Privacy Boundary

Partner tracking deberá aplicar:

- data minimization;
- opaque identifiers;
- consent/purpose rules;
- no unnecessary sensitive fields;
- retention controls.

## 5694. Client Contact Boundary

CreditCardBroker/advertiser contact permissions deberán seguir el actual partner/application flow.

SG no deberá declarar que controla downstream advertiser communications si no es cierto.

## 5695. Conversion / Commission Finding Types

```text
missing_click_attribution
duplicate_conversion
unknown_conversion
conversion_status_conflict
missing_commission_rule
commission_mismatch
unmatched_statement_line
unexpected_chargeback
tracking_token_mismatch
stale_conversion_definition
```

## 5696. Work Queues

```text
CCB_offer_sync_review
CCB_link_issue
CCB_conversion_review
CCB_reconciliation
CCB_commission_review
CCB_dispute
CCB_partner_support
CCB_compliance_review
```

## 5697. Permissions

```text
ccb.journey.read
ccb.journey.manage

ccb.click.read
ccb.attribution.read

ccb.conversion.read
ccb.conversion.verify

ccb.commission.read
ccb.commission.calculate
ccb.commission.reconcile

ccb.statement.read
ccb.statement.import

ccb.dispute.read
ccb.dispute.manage

ccb.partner_ops.read
ccb.partner_ops.manage
```

## 5698. APIs, Events and Workflows

### APIs

```text
POST /api/integrations/creditcardbroker/clicks
POST /api/integrations/creditcardbroker/redirects/validate

POST /api/integrations/creditcardbroker/journeys
POST /api/integrations/creditcardbroker/conversions
POST /api/integrations/creditcardbroker/conversions/{id}/verify

POST /api/integrations/creditcardbroker/commission-candidates
POST /api/integrations/creditcardbroker/statements
POST /api/integrations/creditcardbroker/reconciliation-runs

POST /api/integrations/creditcardbroker/disputes
GET  /api/integrations/creditcardbroker/operations
```

### Eventos

```text
CreditCardBrokerOfferViewed
CreditCardBrokerOfferClicked
CreditCardBrokerExternalRedirected
CreditCardBrokerApplicationJourneyCreated
CreditCardBrokerDecisionReported
CreditCardBrokerConversionReported
CreditCardBrokerConversionVerified
CreditCardBrokerCommissionCandidateCreated
CreditCardBrokerCommissionCalculated
CreditCardBrokerStatementImported
CreditCardBrokerReconciliationCompleted
CreditCardBrokerCommissionReversed
CreditCardBrokerDisputeCreated
CreditCardBrokerPartnerHealthChanged
CreditCardBrokerFindingCreated
```

### Workflows

```text
CreditCardBroker Discovery Workflow
CreditCardBroker Pre-Click Disclosure Workflow
CreditCardBroker External Redirect Workflow
CreditCardBroker Application Journey Workflow
CreditCardBroker Conversion Workflow
CreditCardBroker Attribution Workflow
CreditCardBroker Commission Workflow
CreditCardBroker Statement Reconciliation Workflow
CreditCardBroker Dispute Workflow
CreditCardBroker Partner Operations Workflow
```

## 5699. Pruebas de Parte 2

Pruebas obligatorias:

1. Discover active CCB offer through M37.
2. Pass CCB candidate to M38.
3. Verify M39 does not rank candidate.
4. Render credit-card safety context.
5. Render provider credit-needed label correctly.
6. Create Offer View Record.
7. Enforce pre-click disclosure gate.
8. Create Click Record.
9. Deduplicate browser-retry click.
10. Validate external redirect.
11. Block invalid link.
12. Create Application Journey.
13. Keep unknown external outcome.
14. Block click→approved inference.
15. Create Issuer Decision Record.
16. Preserve raw decision.
17. Record reported credit limit.
18. Keep personalized APR unknown without source.
19. Create Attribution Record.
20. Apply source priority.
21. Create Conversion Definition.
22. Version conversion definition.
23. Create Conversion Record.
24. Verify network-reported conversion.
25. Deduplicate conversion.
26. Record unknown outcome.
27. Record client-reported approval separately.
28. Create attribution window.
29. Preserve multi-touch context.
30. Create Commission Candidate.
31. Create Commission Rule.
32. Expire Commission Rule.
33. Calculate expected commission.
34. Separate expected/earned/paid.
35. Block earned without qualifying evidence.
36. Create M37 Commission Record reference.
37. Import Partner Statement.
38. Import Statement Lines.
39. Run reconciliation.
40. Match by external conversion ID.
41. Match by opaque tracking token.
42. Create unmatched-line exception.
43. Create amount-mismatch exception.
44. Record commission adjustment.
45. Record chargeback.
46. Hand off revenue to M37.
47. Render Partner Operations Dashboard.
48. Render offer performance funnel.
49. Verify funnel integrity.
50. Compute Partner Health.
51. Create support case.
52. Create tracking dispute.
53. Create commission dispute.
54. Preserve evidence.
55. Enforce privacy boundary.
56. Create conversion finding.
57. Test work queues.
58. Test permissions/APIs/events.
59. Test workflows/outbox.
60. Test immutable audit.

## 5700. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. CCB discovery ocurra a través de M37.
2. M38 reciba CCB candidate context.
3. M39 no implemente ranking.
4. Exista card recommendation safety context.
5. Credit-needed label preserve network source.
6. Exista Client Offer View Record.
7. Exista Pre-Click Disclosure Gate.
8. Existan CTA Types.
9. Exista Click Record.
10. Exista click deduplication.
11. Exista External Redirect Gate.
12. Exista Application Journey.
13. Existan application statuses.
14. Approval no se infiera desde click/application start.
15. Exista Issuer Decision Record.
16. Raw issuer/network decision se preserve.
17. Credit limit solo provenga de source.
18. Personalized terms solo provengan de source.
19. Exista Attribution Record.
20. Exista Attribution Source Priority.
21. Existan Conversion Event Types.
22. Exista Conversion Definition Registry.
23. Exista Conversion Record.
24. Exista Conversion Verification Status.
25. Exista Conversion Deduplication.
26. Unknown outcome permanezca unknown.
27. Client-reported outcome esté etiquetado.
28. Exista Attribution Window.
29. Exista Multi-Touch Context.
30. Exista Commission Candidate.
31. Exista Commission Rule.
32. Exista Commission Rule Status.
33. Exista Commission Calculation.
34. Expected/Earned/Paid estén separados.
35. Commission recognition requiera qualifying evidence.
36. Exista M37 Commission Record handoff.
37. Exista Partner Statement Record.
38. Exista Statement Line.
39. Exista Reconciliation Run.
40. Exista Reconciliation Matching.
41. Existan reconciliation statuses.
42. Existan reconciliation exceptions.
43. Existan commission adjustments.
44. Exista chargeback/reversal handling.
45. Exista revenue handoff to M37.
46. Exista Partner Operations Dashboard.
47. Exista Offer Performance View.
48. Funnel stages permanezcan separados.
49. Exista Partner Health.
50. Existan Operational SLAs.
51. Exista Partner Support Case.
52. Existan Support Case Types.
53. Exista Tracking Dispute.
54. Exista Commission Dispute.
55. Disputes preserven evidence.
56. Exista Client Privacy Boundary.
57. Exista downstream contact boundary.
58. Existan Conversion/Commission Findings.
59. Existan Work Queues.
60. Existan permisos/APIs/events/workflows.
61. Toda commission tenga source/rule/version.
62. Toda conversion material tenga verification status.
63. Toda external outcome uncertainty sea visible.
64. Parte 2 termine lista para Automation/Compliance/Security de Parte 3.

### Instrucciones para Codex

1. Lee Parte 1 completa.
2. Integra discovery con M37.
3. Integra recommendation candidate handoff con M38.
4. No dupliques ranking.
5. Implementa CCB Offer View/Click/Redirect.
6. Enforce disclosures antes del external CTA.
7. Implementa ApplicationJourney aun si external.
8. Nunca infieras approval desde click/redirect.
9. Preserve raw external decision/status.
10. No inventes credit limit/APR personalized.
11. Implementa attribution with opaque token.
12. Implementa versioned ConversionDefinition.
13. Implementa conversion verification/dedup.
14. Mantén unknown outcome.
15. Separa client-reported outcome.
16. Implementa CommissionCandidate/Rule.
17. Separa expected/earned/paid.
18. Exige qualifying evidence.
19. Reutiliza M37 Commission/Revenue records.
20. Implementa statement import.
21. Implementa reconciliation.
22. Minimiza PII durante matching.
23. Implementa exceptions.
24. Implementa chargebacks/reversals.
25. Implementa partner dashboard/health.
26. Implementa support/disputes.
27. Preserve original evidence.
28. Implementa findings/work queues.
29. Implementa permissions/APIs/events/workflows.
30. Implementa immutable audit.
31. No marques Parte 2 completa si a click puede convertirse en approval/commission sin external verified evidence.

### Verificación final de Parte 2

- ¿M37 sigue siendo discovery/marketplace?
- ¿M38 sigue siendo recommendation engine?
- ¿M39 solo aporta CCB integration context?
- ¿Disclosures aparecen antes del redirect?
- ¿Clicks no se confunden con applications/approvals?
- ¿Issuer decisions preservan raw source?
- ¿Unknown outcomes permanecen unknown?
- ¿Attribution usa opaque tokens?
- ¿Conversions se deduplican?
- ¿Commission depende de rule + qualifying event?
- ¿Expected/earned/paid están separados?
- ¿Statements pueden reconciliarse?
- ¿Chargebacks conservan history?
- ¿Partner operations y disputes son auditables?

---

# Parte 3 — Automation, AI, Compliance, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 39 — Parte 2  
**Secciones incluidas:** 5701–5765  
**Audiencia:** Owner, Codex, marketplace operators, affiliate operations, partner managers, compliance, security, finance, data/analytics, support y engineering  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Integración gobernada con CreditCardBroker basada en source integrity, authorization, approved partner methods, safe automation, AI limitada, privacy, audit, reconciliation y continuidad operativa

## 5701. Objetivo de Parte 3

Esta parte cierra el Módulo 39 definiendo:

- automation;
- AI boundaries;
- compliance governance;
- partner-rule lifecycle;
- security;
- privileged access;
- administration;
- work queues;
- observability;
- analytics;
- data quality;
- migration;
- portability;
- business continuity;
- disaster recovery;
- E2E;
- aceptación final.

## 5702. Automation Principle

Automation deberá seguir:

```text
verified source
→ approved rule
→ deterministic action
→ audit
```

y no:

```text
external change
→ blind automatic publish
```

## 5703. Automation Risk Levels

```text
informational
low_risk
moderate_risk
high_risk
prohibited
```

## 5704. Informational Automation

Ejemplos:

- detect stale offers;
- identify link failures;
- summarize sync changes;
- calculate reconciliation variance;
- flag expired rules;
- update dashboard metrics.

## 5705. Low-Risk Automation

Ejemplos:

- create review task;
- mark source stale;
- pause expired offer;
- refresh known status;
- create support case;
- queue reconciliation.

## 5706. Moderate-Risk Automation

Ejemplos:

- map new offer to existing category;
- propose marketplace mapping;
- prepare updated disclosure package;
- calculate expected commission;
- propose statement matching.

Requiere reviewability.

## 5707. High-Risk Automation

Requiere human/authorized gate:

- publish new offer;
- activate new affiliate link;
- enable new integration mode;
- approve custom marketing surface;
- approve commission reconciliation;
- suspend partner integration;
- export sensitive partner/client data.

## 5708. Prohibited Automation

No deberá:

- fabricate offer terms;
- fabricate issuer approval;
- rewrite partner content as approved content when not permitted;
- bypass disclosure;
- auto-submit card applications;
- alter affiliate tracking;
- silently replace partner destination;
- auto-recognize commission without qualifying evidence.

## 5709. Scheduled Sync Jobs

Jobs:

```text
rule_snapshot_refresh
offer_sync
link_health_check
disclosure_freshness_check
creative_integrity_check
conversion_sync
statement_sync
commission_reconciliation
analytics_refresh
```

## 5710. Sync Job Record

Campos:

```text
id
jobType
startedAt
completedAt
status
recordsProcessed
recordsChanged
recordsFailed
checkpoint
errorSummary
```

## 5711. Sync Job Status

```text
scheduled
running
completed
completed_with_warnings
failed
cancelled
paused
```

## 5712. Sync Failure Policy

Ante failure:

```text
preserve last verified source
→ mark freshness degraded
→ stop risky publication/action
→ retry with backoff
→ escalate when threshold exceeded
```

## 5713. AI Assistant Scope

AI podrá:

- summarize source changes;
- classify incoming offers;
- detect likely category mapping;
- summarize reconciliation exceptions;
- draft internal review notes;
- summarize support/dispute history;
- identify missing disclosure fields.

## 5714. AI Content Boundary

AI no deberá publicar directamente:

```text
offer headline
APR claim
fee claim
approval claim
credit-needed claim
affiliate disclosure
issuer terms
```

cuando authoritative/approved partner content sea requerido.

## 5715. AI Grounding

AI deberá usar:

```text
RuleSnapshot
OfferSource
OfferContentPackage
TermsSnapshot
DisclosurePackage
Partner Statement
Conversion Record
Commission Rule
```

según task.

## 5716. AI Output Contract

Campos:

```text
taskType
summary
sourceReferences
confidence
unknowns
riskFlags
needsHumanReview
generatedAt
```

## 5717. AI Unsupported Claim Control

Si AI produce un material fact sin source:

```text
block_or_flag
```

Tipos:

```text
unsupported_rate
unsupported_fee
unsupported_reward
unsupported_approval
unsupported_credit_label
unsupported_commission
unsupported_partner_rule
```

## 5718. AI External Action Boundary

AI no deberá:

- call CreditCardBroker endpoints directly;
- activate links;
- submit applications;
- modify partner account;
- mark conversions verified;
- approve commissions.

Solo approved tools/workflows.

## 5719. Partner Rule Governance

Cada rule relevante deberá tener:

```text
source
snapshot
effective context
review status
owner
last verified
next review
```

## 5720. Rule Change Detection

Cambios a:

- permitted marketing;
- API authorization;
- content rules;
- disclosures;
- tracking;
- commissions;
- payment conditions;
- offer availability;

deberán generar review.

## 5721. Compliance Review Record

Campos:

```text
id
ruleSnapshotId
affectedOffers
affectedSurfaces
reviewType
findingIds
decision
reviewedBy
reviewedAt
```

## 5722. Compliance Finding Types

```text
unapproved_marketing_method
unapproved_content
stale_disclosure
stale_partner_rule
invalid_link
tracking_rule_violation
missing_compensation_disclosure
unsupported_claim
unauthorized_API_use
privacy_scope_issue
```

## 5723. Compliance Finding Status

```text
open
under_review
client_or_partner_action
remediation
resolved
accepted_with_documented_reason
not_applicable
```

## 5724. Marketing Surface Governance

Cada surface deberá tener:

```text
surfaceId
surfaceType
domain
path
approvalStatus
approvedContentMode
disclosureSet
effectiveFrom
effectiveTo
```

## 5725. Content Provenance Requirement

Toda offer client-facing deberá poder rastrear:

```text
displayed text
→ content package
→ source snapshot
→ partner/advertiser source
```

## 5726. Disclosure Provenance Requirement

Toda disclosure deberá rastrear:

```text
display instance
→ disclosure version
→ partner/compliance source
→ effective dates
```

## 5727. Link Provenance Requirement

Todo affiliate CTA deberá rastrear:

```text
display
→ affiliate link record
→ tracking configuration
→ partner authorization
```

## 5728. Security Model

Aplicar:

- MFA;
- RBAC;
- ABAC;
- tenant isolation;
- partner isolation;
- resource-level access;
- field-level access;
- least privilege;
- reauthentication;
- immutable audit.

## 5729. Sensitive Data Classes

```text
client_identity
tracking_mapping
conversion_evidence
partner_credentials
partner_contract_terms
commission_rules
tax_documents
statement_data
support_disputes
security_secrets
```

## 5730. Tracking Token Security

Opaque tracking token deberá:

- ser non-guessable;
- expirar cuando aplique;
- no codificar PII;
- mapear server-side;
- quedar auditable.

## 5731. API Credential Security

Credenciales deberán:

```text
encrypt_at_rest
scope
rotate
revoke
mask
exclude_from_logs
```

## 5732. Third-Party Script Security

Controles:

```text
approved_source
CSP
integrity_or_version_tracking_when_available
surface isolation
minimal data exposure
kill_switch
```

## 5733. Export Governance

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

## 5734. Privileged Actions

Ejemplos:

- reveal partner credential metadata;
- enable integration mode;
- approve marketplace surface;
- publish/re-enable offer;
- override stale blocker;
- approve reconciliation;
- alter commission rule;
- export raw statement data.

## 5735. Owner Break-Glass

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

## 5736. Security Incident Types

```text
affiliate_link_hijack
tracking_token_exposure
credential_compromise
third_party_script_compromise
unauthorized_offer_publication
unauthorized_API_access
cross_client_tracking_mapping_access
commission_manipulation
statement_exposure
privilege_misuse
```

## 5737. Security Incident Response

```text
detect
→ disable risky integration
→ preserve evidence
→ rotate/revoke credentials if needed
→ block affected links/surfaces
→ assess exposure
→ remediate
→ restore verified state
```

## 5738. Administration Console

Secciones:

```text
Partner Account
Rule Snapshots
Integration Modes
Approved Domains
Approved Surfaces
Advertisers
Offers
Content
Creatives
Terms
Links
JavaScript
API
Clicks
Journeys
Conversions
Commissions
Statements
Reconciliation
Disputes
Findings
Security
Analytics
Configuration
```

## 5739. Work Queues

```text
rule_review
offer_sync_review
content_review
link_review
surface_approval
conversion_review
commission_review
statement_reconciliation
dispute_review
compliance_review
security_review
partner_support
```

## 5740. Assignment / SLA Engine

Podrá considerar:

- issue type;
- severity;
- integration mode;
- offer;
- advertiser;
- partner account;
- compliance relevance;
- security relevance;
- financial impact;
- SLA.

## 5741. Observability

Métricas técnicas:

```text
rule_refresh_failure_rate
offer_sync_failure_rate
offer_sync_lag
link_health_failure_rate
API_failure_rate
script_error_rate
conversion_sync_failure_rate
statement_import_failure_rate
reconciliation_failure_rate
```

## 5742. Operational Alerts

Alertas:

- stale active offer;
- invalid affiliate link;
- unapproved surface rendering;
- missing disclosure;
- API authorization expired;
- partner account restricted;
- conversion feed delayed;
- reconciliation variance;
- unexpected chargeback spike;
- third-party script issue.

## 5743. Analytics Dashboards

```text
CCB Executive Dashboard
Offer Health Dashboard
Offer Performance Dashboard
Click / Redirect Dashboard
Application Journey Dashboard
Conversion Dashboard
Commission Dashboard
Reconciliation Dashboard
Partner Health Dashboard
Compliance Dashboard
Security Dashboard
```

## 5744. Offer KPIs

```text
active_offers
stale_offer_rate
offer_change_rate
invalid_link_rate
missing_disclosure_rate
offer_sync_lag
```

## 5745. Traffic KPIs

```text
offer_views
offer_clicks
CTR
external_redirects
unique_click_context
return_click_rate
```

## 5746. Journey KPIs

```text
external_journeys
reported_application_starts
reported_submissions
reported_decisions
unknown_outcome_rate
```

No tratar reported status como verified issuer truth automáticamente.

## 5747. Conversion KPIs

```text
reported_conversions
verified_conversions
conversion_duplicate_rate
conversion_conflict_rate
conversion_sync_lag
```

## 5748. Commission KPIs

```text
expected_commission
earned_commission
partner_approved_commission
paid_commission
reversed_commission
commission_variance
```

## 5749. Reconciliation KPIs

```text
matched_statement_rate
unmatched_line_rate
amount_match_rate
manual_review_rate
average_reconciliation_time
```

## 5750. Quality / Compliance KPIs

```text
unsupported_claim_count
unapproved_surface_count
stale_rule_count
disclosure_issue_rate
tracking_issue_rate
API_authorization_issue_count
```

## 5751. Security KPIs

```text
credential_incidents
affiliate_link_incidents
tracking_token_incidents
third_party_script_incidents
privileged_access_events
break_glass_events
```

## 5752. Metric Governance

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

## 5753. Data Quality Controls

Checks:

- duplicate offers;
- orphan advertiser;
- orphan marketplace mapping;
- stale source snapshot;
- invalid link;
- missing disclosure;
- conversion without click/context when required;
- duplicate conversion;
- commission without rule;
- statement line without reconciliation status.

## 5754. Data Quality Finding

Campos:

```text
id
findingType
severity
resourceType
resourceId
sourceReferences
blocking
status
createdAt
resolvedAt
```

## 5755. Data Portability

Client-safe export podrá incluir:

- viewed/saved offer references;
- click/referral history where appropriate;
- externally reported application outcome references;
- client-reported outcome;
- disclosures presented.

No incluir partner commercial secrets.

## 5756. Internal Partner Export

Authorized export podrá incluir:

```text
offers
source versions
tracking records
conversions
commission calculations
statement reconciliation
findings
audit references
```

## 5757. Migration In

Pipeline:

```text
import partner account
→ import approved integration config
→ import offers/source snapshots
→ import mappings
→ import tracking references
→ import conversion/commission history
→ create migration snapshot
→ reconcile
```

## 5758. Migration Record

Campos:

```text
id
sourceSystem
cutoffDate
importedOffers
importedLinks
importedClicks
importedConversions
importedCommissions
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 5759. Migration Out

Export deberá preservar:

```text
rule snapshots
integration authorizations
offer source lineage
content versions
link versions
tracking references
conversion records
commission rules
reconciliation records
audit references
```

## 5760. Business Continuity

Ante outage:

```text
preserve last verified offers
→ disable risky CTA if link/source cannot be trusted
→ keep informational view when safe
→ queue low-risk sync work
→ restore integration
→ reconcile unknown outcomes
```

## 5761. Disaster Recovery Priority

Prioridad:

1. affiliate link integrity;
2. integration credentials/auth;
3. active-offer validity;
4. disclosures;
5. conversion/commission data;
6. statements/reconciliation;
7. analytics.

## 5762. Recovery Verification

Antes de full resume:

```text
verify partner account status
verify approved integration mode
verify rule snapshot
verify affiliate links
verify active offers
verify disclosures
verify tracking mapping
verify audit continuity
```

## 5763. End-to-End Tests

### Scenario 1 — Offer Discovery to External Application

```text
CCB sync
→ M37 mapping
→ M38 recommendation
→ disclosure
→ click
→ redirect
→ external application
→ outcome unknown
```

Unknown permanece unknown.

### Scenario 2 — Verified Conversion and Commission

```text
click
→ network conversion
→ verify
→ commission rule
→ expected commission
→ partner statement
→ reconciliation
→ paid
→ M37 revenue handoff
```

### Scenario 3 — Offer Terms Change

```text
source terms change
→ diff
→ listing flagged
→ disclosure/content review
→ new version
→ publish
```

### Scenario 4 — Invalid Affiliate Link

```text
link health fails
→ CTA blocked
→ alert
→ partner support
→ replacement verified
→ restore
```

### Scenario 5 — Unapproved Marketing Surface

```text
new surface created
→ no approval
→ render blocked
→ compliance finding
→ approval or rejection
```

### Scenario 6 — Chargeback

```text
commission paid
→ partner chargeback
→ reversal
→ revenue correction
→ audit
```

### Scenario 7 — API Credential Compromise

```text
credential incident
→ revoke
→ pause API
→ preserve evidence
→ rotate
→ verify
→ resume
```

### Scenario 8 — AI Unsupported Claim

```text
AI drafts summary
→ unsupported APR claim detected
→ client-facing output blocked
→ human review
```

## 5764. Final Test Matrix

Módulo completo deberá probar:

1. partner onboarding;
2. rule snapshot;
3. integration authorization;
4. approved domains;
5. approved surfaces;
6. offer ingestion;
7. advertiser mapping;
8. source lineage;
9. content integrity;
10. creative integrity;
11. terms freshness;
12. affiliate link validity;
13. tracking privacy;
14. JavaScript isolation;
15. API authorization;
16. offer diff;
17. marketplace mapping;
18. recommendation handoff;
19. disclosures;
20. click;
21. redirect;
22. external journey;
23. raw decision preservation;
24. conversion verification;
25. conversion dedup;
26. unknown outcome;
27. commission rules;
28. commission calculation;
29. statement import;
30. reconciliation;
31. chargeback;
32. disputes;
33. automation;
34. AI boundaries;
35. compliance review;
36. security;
37. break-glass;
38. admin;
39. work queues;
40. observability;
41. analytics;
42. data quality;
43. migration;
44. portability;
45. business continuity;
46. disaster recovery;
47. tenant/client isolation;
48. partner secret protection;
49. immutable audit;
50. bilingual UI.

## 5765. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 39

El Módulo 39 estará completo cuando:

1. Exista Rule Snapshot Registry.
2. Integration modes sean versionados.
3. API usage requiera actual authorization.
4. Existan approved domains/surfaces.
5. Exista Partner Account.
6. CreditCardBroker y advertisers estén separados.
7. Exista Offer Source.
8. Source payload/lineage se preserve.
9. Exista normalized Offer.
10. Product families sean extensibles.
11. Exista freshness gate.
12. Exista M37 mapping.
13. M39 no duplique M37 discovery.
14. M39 no duplique M38 ranking.
15. Exista approved Content Package.
16. AI no publique restricted rewritten claims.
17. Exista Creative Asset integrity.
18. Exista Terms Snapshot.
19. Unknown terms permanezcan unknown.
20. Exista Important Terms link.
21. Exista Affiliate Link.
22. Links estén allowlisted.
23. No haya sensitive PII en tracking URL.
24. Exista opaque tracking token.
25. Existan hosted-page/JS/API modes.
26. Third-party JS tenga security boundary.
27. API capabilities no se inventen.
28. Exista feed diff.
29. Material changes disparen review.
30. Geography no se asuma.
31. Credit-needed labels no sean SG eligibility.
32. Approval claims conserven source.
33. Exista Disclosure Package.
34. Exista Display Integrity Check.
35. Exista discovery/recommendation handoff.
36. Exista Offer View Record.
37. Exista Pre-Click Disclosure Gate.
38. Exista Click Record.
39. Exista External Redirect Gate.
40. Exista Application Journey.
41. Click no implique approval.
42. Exista Issuer Decision Record.
43. Raw decision se preserve.
44. Credit limit/APR personalized requieran source.
45. Exista Attribution.
46. Exista Conversion Definition Registry.
47. Exista Conversion Record.
48. Exista conversion verification.
49. Exista conversion deduplication.
50. Unknown outcome permanezca unknown.
51. Client-reported outcome esté etiquetado.
52. Exista Commission Candidate.
53. Exista Commission Rule.
54. Expected/Earned/Paid estén separados.
55. Commission requiera qualifying evidence.
56. Exista Partner Statement.
57. Exista Reconciliation Run.
58. Existan reconciliation exceptions.
59. Exista Chargeback/Reversal.
60. Exista M37 revenue handoff.
61. Exista Partner Operations Dashboard.
62. Funnel stages estén separados.
63. Exista Partner Health.
64. Existan Support/Disputes.
65. Disputes preserven evidence.
66. Exista Automation Engine.
67. Existan risk levels.
68. High-risk automation requiera gate.
69. Existan prohibited automations.
70. Exista scheduled sync.
71. Exista AI Assistant scope.
72. AI esté grounded.
73. AI no ejecute external partner actions.
74. Exista Partner Rule Governance.
75. Exista Compliance Review.
76. Exista Marketing Surface Governance.
77. Content/disclosure/link provenance sea reconstruible.
78. Exista MFA/RBAC/ABAC.
79. Exista tracking-token security.
80. Exista API credential security.
81. Exista third-party-script security.
82. Exista Export Governance.
83. Exista Break-Glass.
84. Exista Security Incident Workflow.
85. Exista Admin Console.
86. Existan Work Queues.
87. Exista Observability.
88. Existan Operational Alerts.
89. Existan Analytics Dashboards.
90. Exista Metric Governance.
91. Existan Data Quality Controls.
92. Exista Data Portability.
93. Exista Migration In/Out.
94. Exista Business Continuity.
95. Exista Disaster Recovery.
96. Recovery verifique partner/link/rule integrity.
97. Existan E2E tests.
98. Toda offer tenga source/version.
99. Todo affiliate link tenga provenance.
100. Toda conversion tenga verification status.
101. Toda commission tenga rule/version/source.
102. Toda external uncertainty sea visible.
103. Todo privileged access quede auditado.
104. Ninguna AI invente terms/approval.
105. Ningún stale offer se renderice como current.
106. Ningún unapproved surface publique offers.
107. Ningún retry duplique material conversion/action.
108. La UI sea bilingüe.
109. Code identifiers estén en inglés.
110. Las tres partes estén integradas.
111. El módulo sea implementable por Codex.
112. M37/M38/M39 boundaries permanezcan claras.
113. El módulo opere end-to-end con source integrity.
114. Partner commercial data esté protegida.
115. Estado final sea MODULE COMPLETE.

### Instrucciones finales para Codex

1. Lee las tres partes completas.
2. Lee M37 y M38 completos.
3. Mantén CreditCardBroker como external affiliate/network integration.
4. Versiona RuleSnapshots.
5. Requiere authorization para integration modes.
6. Implementa Approved Domains/Surfaces.
7. Separa network/advertiser.
8. Conserva OfferSource raw lineage.
9. Mapea a M37.
10. Handoff recommendation context a M38.
11. No dupliques marketplace/ranking.
12. Implementa approved content/creative integrity.
13. No reescribas restricted offer claims.
14. Mantén unknown terms.
15. Implementa allowlisted affiliate links.
16. Usa opaque tracking IDs.
17. Aísla third-party JS.
18. Implementa authorized API capability discovery.
19. Implementa diff/material-change gate.
20. Implementa disclosures.
21. Implementa click/redirect/application journey.
22. Nunca infieras approval desde click.
23. Preserve issuer/network raw decisions.
24. Implementa conversions/versioned definitions.
25. Deduplica conversions.
26. Mantén unknown outcomes.
27. Implementa Commission Rules.
28. Separa expected/earned/paid.
29. Exige qualifying evidence.
30. Implementa statement/reconciliation/chargeback.
31. Reutiliza M37 economics.
32. Implementa partner operations/support/disputes.
33. Implementa automation risk levels.
34. Implementa AI grounded/no external actions.
35. Implementa partner-rule/compliance governance.
36. Implementa content/link/disclosure provenance.
37. Implementa MFA/RBAC/ABAC.
38. Implementa credential/tracking/script security.
39. Implementa Export Governance.
40. Implementa Break-Glass.
41. Implementa immutable Audit.
42. Implementa Admin/Queues/SLA.
43. Implementa Observability/Alerts.
44. Implementa Analytics/Metric Governance.
45. Implementa Data Quality.
46. Implementa Migration/Portability.
47. Implementa Continuity/Recovery.
48. Ejecuta Final Test Matrix.
49. No marques módulo listo si stale/unapproved offers pueden publicarse.
50. No marques módulo listo si click puede convertirse en approval/commission sin external evidence.

### Verificación final para entrega

- ¿Integration modes requieren authorization?
- ¿CreditCardBroker y advertiser son entidades distintas?
- ¿Offer content/terms/links tienen source lineage?
- ¿M37 y M38 conservan sus responsabilidades?
- ¿No hay PII sensible en affiliate URLs?
- ¿Third-party JS está aislado?
- ¿API usa solo capabilities concedidas?
- ¿Disclosures aparecen antes del redirect?
- ¿Unknown external outcome permanece unknown?
- ¿Commission depende de qualifying evidence?
- ¿Statements y chargebacks son reconciliables?
- ¿AI no fabrica terms/approval?
- ¿Partner rules pueden cambiar sin hardcode?
- ¿Security protege credentials/tracking/commission data?
- ¿Continuity bloquea CTAs inseguros?
- ¿Los ocho escenarios E2E pasan?

# Estado Final del Módulo 39

```text
MÓDULO 39:
CREDITCARDBROKER INTEGRATION

PARTES:
1. Partner Account, Integration Modes, Offers, Content, Links, Availability y Tracking
2. Discovery, Recommendation Handoff, Journeys, Attribution, Conversions, Commissions y Reconciliation
3. Automation, AI, Compliance, Security, Admin, Analytics, Migration, Continuity y Cierre

SECCIONES:
5571–5765

ESTADO:
MODULE COMPLETE
```

