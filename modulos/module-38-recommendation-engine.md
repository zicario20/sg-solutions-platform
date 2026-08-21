# SG Solutions Platform — Módulo 38: Recommendation Engine

> **Archivo fuente para Codex**
>
> Este archivo es la fuente de verdad del Módulo 38. No es un resumen.
> Se ampliará dentro del mismo `.md` conforme se completen sus cuatro partes.

## Manifest

| Parte | Alcance | Secciones | Estado |
|---|---|---:|---|
| 1 | Fundamentos, Recommendation Request, context/candidates, objectives, preferences, constraints, signals, scoring y policy architecture | 5311–5375 | **COMPLETE** |
| 2 | Recommendation generation, ranking, multi-objective tradeoffs, explanations, confidence, alternatives, suitability y client decision support | 5376–5440 | **COMPLETE** |
| 3 | Personalization, feedback, learning loops, evaluation, experimentation, fairness, drift, quality assurance y human review | 5441–5505 | **COMPLETE** |
| 4 | AI integration, governance, security, admin, analytics, migration, continuity, E2E y cierre | 5506–5570 | **COMPLETE** |

**Estado global del Módulo 38:** `MODULE COMPLETE`

---

# Parte 1 — Fundamentos, Recommendation Request, Context/Candidates, Objectives, Preferences, Constraints, Signals, Scoring y Policy Architecture

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 1  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 37 — Financial Marketplace  
**Secciones incluidas:** 5311–5375  
**Audiencia:** Owner, Codex, product managers, data/ML engineers, analysts, marketplace operators, compliance, reviewers y support  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Recommendation Engine multi-domain, explicable, versionado y policy-driven que ordena candidatos ya válidos/filtrados por los módulos fuente sin sustituir eligibility, underwriting, provider decisions ni client choice

---

## 5311. Objetivo del Módulo 38

El Módulo 38 deberá transformar un conjunto de opciones potencialmente relevantes en recomendaciones explicables y priorizadas.

Pipeline:

```text
goal
→ context
→ candidate set
→ constraints
→ objectives
→ signals
→ scoring
→ ranking
→ recommendation
→ explanation
→ client decision
```

---

## 5312. Recommendation Engine Principle

El motor deberá responder:

```text
"Entre estas opciones actualmente disponibles y potencialmente aplicables,
¿cuáles encajan mejor con los objetivos y preferencias declaradas?"
```

No:

```text
"¿Cuál será aprobada?"
```

---

## 5313. Core Boundary

Separar estrictamente:

```text
Eligibility Engine
≠
Recommendation Engine
≠
Provider/Lender Decision
```

Eligibility determina posibilidad bajo reglas conocidas.

Recommendation prioriza candidatos.

Provider/lender toma decisiones externas cuando corresponda.

---

## 5314. Módulo 37 Boundary

M37 entrega:

```text
candidate items
match status
comparison fields
source freshness
risk flags
ranking inputs
client context
```

M38 devuelve:

```text
ordered recommendations
tradeoffs
explanations
confidence
alternatives
decision support
```

---

## 5315. Reutilización obligatoria

Reutilizar:

- M37 Marketplace Items;
- M37 Eligibility Context;
- M37 Match Records;
- M37 Comparison data;
- M37 Disclosure Engine;
- M35 Funding Product data;
- M36 Homebuying Program data;
- Client/Organization profiles;
- Consent;
- Audit;
- Analytics;
- AI Hub;
- Policy Registry.

---

## 5316. Recommendation Request

Campos:

```text
id
clientIdOptional
sessionId
goal
domain
candidateSetId
contextSnapshotId
objectiveProfileId
preferenceProfileId
constraintSetId
policyVersion
requestedAt
status
```

---

## 5317. Recommendation Request Status

```text
draft
validating
ready
running
completed
completed_with_warnings
needs_information
manual_review_required
failed
cancelled
expired
```

---

## 5318. Recommendation Goal

Ejemplos:

```text
find_business_funding
compare_funding_options
find_homebuying_program
minimize_cash_to_close
minimize_known_cost
prioritize_speed
prioritize_low_monthly_payment
find_business_service
choose_marketplace_option
general_financial_product_discovery
```

---

## 5319. Goal Versioning

Cada goal deberá tener:

```text
goalCode
goalVersion
supportedDomains
requiredContext
allowedObjectives
allowedSignals
defaultPolicy
effectiveFrom
effectiveTo
```

---

## 5320. Recommendation Context Snapshot

Campos:

```text
id
clientIdOptional
organizationIdOptional
sourceContextIds
facts
preferences
constraints
consentState
locale
jurisdiction
createdAt
```

Snapshot deberá ser inmutable.

---

## 5321. Context Fact

Cada fact material:

```text
field
value
source
sourceVersion
verificationStatus
freshnessStatus
observedAt
```

---

## 5322. Verification Status

```text
domain_verified
provider_verified
SG_verified
client_reported
derived
estimated
conflicting
unknown
```

---

## 5323. Context Freshness

```text
current
aging
stale
unknown
not_applicable
```

---

## 5324. Context Minimization

Recommendation deberá usar únicamente facts necesarios para:

```text
goal
candidate comparison
preference matching
risk/suitability context
```

No deberá leer indiscriminadamente toda la plataforma.

---

## 5325. Candidate Set

Campos:

```text
id
requestId
candidateIds
candidateVersions
sourceModule
generatedAt
expiresAt
status
```

---

## 5326. Candidate Source

Tipos:

```text
marketplace_match
domain_screening
client_selected
specialist_selected
comparison_workspace
editorial_allowed_set
hybrid
```

---

## 5327. Candidate Eligibility Gate

Antes de scoring:

```text
candidate available
source current
eligibility status allowed
provider active
required disclosure available
```

---

## 5328. Candidate Eligibility Status Allowed

Podrán continuar:

```text
potential_fit
potential_fit_with_conditions
needs_information_if_policy_allows
manual_review_required_if_policy_allows
```

No continuar automáticamente:

```text
not_available
not_eligible_under_current_rules
provider_suspended
source_stale_blocking
```

---

## 5329. Candidate Set Immutability

Cada recommendation run deberá conservar el exact candidate set usado.

No deberá reconstruirse retroactivamente con current catalog.

---

## 5330. Candidate Feature Snapshot

Por candidate:

```text
candidateId
sourceVersion
normalizedFeatures
riskFlags
availability
matchSignals
knownCosts
unknownFields
createdAt
```

---

## 5331. Feature Registry

Cada feature:

```text
featureCode
definition
dataType
source
normalizationMethod
missingValuePolicy
allowedDomains
version
```

---

## 5332. Feature Families

```text
relevance
eligibility_context
cost
speed
amount_or_capacity
term
payment_burden
cash_requirement
risk
complexity
provider_quality
availability
client_preference_fit
document_readiness
service_delivery
```

---

## 5333. Feature Source Priority

Preferencia conceptual:

```text
domain_verified
provider_verified
official_source
SG_verified
client_reported
derived
estimated
unknown
```

---

## 5334. Missing Feature Policy

Cada feature deberá definir:

```text
ignore
neutral
penalize_with_explanation
block
manual_review
```

Nunca aplicar un default silencioso.

---

## 5335. Unknown versus Zero

El system deberá diferenciar:

```text
unknown
```

de:

```text
0
```

especialmente en:

- fees;
- APR/rate;
- assistance amount;
- payment;
- collateral;
- required cash;
- timeline.

---

## 5336. Recommendation Objective Profile

Campos:

```text
id
requestId
primaryObjective
secondaryObjectives
objectiveWeights
hardPriorities
softPriorities
createdAt
```

---

## 5337. Supported Objectives

```text
maximize_relevance
maximize_fit
minimize_known_cost
minimize_monthly_payment
minimize_cash_required
maximize_available_amount
maximize_assistance
minimize_time_to_next_step
minimize_collateral
minimize_personal_guarantee
maximize_term
maximize_provider_quality
minimize_complexity
```

Solo usar donde semanticamente aplique.

---

## 5338. Objective Weight

Cada weight:

```text
objectiveCode
weight
source
explicitOrDefault
policyVersion
```

---

## 5339. Explicit Preference Priority

Cuando el cliente declare una preferencia explícita, esta deberá diferenciarse de:

```text
system_default
inferred_preference
editorial_preference
```

---

## 5340. Preference Profile

Campos:

```text
id
clientIdOptional
requestId
costPriority
speedPriority
amountPriority
paymentPriority
termPriority
collateralPreference
providerPreference
deliveryPreference
complexityTolerance
otherPreferences
createdAt
```

---

## 5341. Preference Source

```text
client_explicit
client_saved
session_explicit
specialist_confirmed
derived
default
```

---

## 5342. Preference Confidence

```text
explicit
high
medium
low
unknown
```

Derived preference deberá tener menor authority que explicit preference.

---

## 5343. Preference Conflict

Ejemplo:

```text
lowest_cost
+
fastest_funding
+
no_collateral
+
maximum_amount
```

El motor deberá poder detectar objectives incompatibles.

---

## 5344. Preference Conflict Record

Campos:

```text
requestId
conflictingObjectives
tradeoffExplanation
clientDecisionRequired
resolvedWeights
status
```

---

## 5345. Hard Constraint

Ejemplos:

```text
state
product_family
maximum_fee
minimum_amount
maximum_cash_to_close
no_personal_guarantee
specific_occupancy
provider_exclusion
timeline_deadline
```

Solo si el field tiene semántica válida para el domain.

---

## 5346. Soft Constraint

Ejemplos:

```text
prefer_no_annual_fee
prefer_lower_payment
prefer_faster_process
prefer_existing_partner
prefer_online
prefer_bilingual_support
```

---

## 5347. Constraint Set

Campos:

```text
id
requestId
hardConstraints
softConstraints
source
version
createdAt
```

---

## 5348. Constraint Evaluation

Resultado por candidate:

```text
pass
pass_with_unknowns
soft_violation
hard_violation
not_applicable
```

---

## 5349. Hard Constraint Boundary

Candidate con:

```text
hard_violation
```

no deberá rankearse como recommendation salvo explicit manual override autorizado.

---

## 5350. Constraint Unknown

Si hard constraint depende de unknown field:

```text
needs_information
```

o:

```text
manual_review_required
```

según policy.

No asumir pass.

---

## 5351. Recommendation Policy

Campos:

```text
id
policyCode
domain
goal
policyVersion
candidateGateRules
objectiveDefaults
featureWeights
riskRules
tieBreakRules
explanationRules
effectiveFrom
effectiveTo
status
```

---

## 5352. Policy Status

```text
draft
testing
approved
active
paused
deprecated
retired
```

Solo `active` en production.

---

## 5353. Policy Versioning

Cambio material exige nueva versión:

- candidate gates;
- weights;
- risk penalties;
- tie-breakers;
- sponsored treatment;
- provider quality;
- explanation rules;
- default objectives.

---

## 5354. Scoring Model

Conceptualmente:

```text
candidate
→ feature normalization
→ constraint gate
→ objective scoring
→ risk adjustments
→ policy adjustments
→ final score
```

---

## 5355. Score Record

Campos:

```text
requestId
candidateId
featureScores
objectiveScores
riskAdjustments
policyAdjustments
rawScore
finalScore
scoreVersion
createdAt
```

---

## 5356. Score Boundary

`finalScore`:

- es internal;
- no es approval probability;
- no es credit score;
- no es provider underwriting score;
- no deberá exponerse sin context.

---

## 5357. Feature Normalization

Métodos posibles:

```text
binary
min_max
bucketed
rank_based
domain_specific
manual_mapping
not_normalized
```

Cada uno versionado.

---

## 5358. Cost Scoring

Cost scoring deberá respetar metric compatibility.

No mezclar silenciosamente:

```text
APR
factor rate
annual fee
one-time fee
monthly fee
cash to close
```

---

## 5359. Cost Unknown Handling

Si cost es unknown:

- mostrar unknown;
- evitar premiarlo como "lowest cost";
- aplicar policy explícita;
- explicar limitation.

---

## 5360. Speed Scoring

Speed podrá usar:

```text
published_estimate
provider_estimate
historical_observed_time
unknown
```

Debe mostrar source/confidence.

---

## 5361. Provider Quality Scoring

Podrá usar:

```text
verification
freshness
SLA
error_rate
complaints
conversion_reporting_quality
technical_reliability
```

No compensation.

---

## 5362. Availability Scoring

Estados:

```text
available
limited
waitlist
temporarily_unavailable
verification_required
unknown
```

Disponibilidad puede gatear o penalizar según policy.

---

## 5363. Risk Signal Registry

Tipos:

```text
high_cost
short_term
frequent_payment
collateral_required
personal_guarantee
unknown_pricing
complex_terms
stale_source
manual_review
assistance_repayment_obligation
variable_rate_context
other
```

---

## 5364. Risk Adjustment

Cada risk signal deberá definir:

```text
penalty
warning_only
block
manual_review
not_applicable
```

por policy/domain.

---

## 5365. Suitability Context

Recommendation podrá considerar:

```text
client_goal
cash_flow_context
payment_tolerance
time_horizon
complexity_tolerance
risk_flags
```

sin presentarse automáticamente como fiduciary/investment advice.

---

## 5366. Sponsored Candidate Boundary

Sponsored status podrá influir únicamente en surfaces/policies permitidas.

Deberá permanecer separado de:

```text
organic suitability score
organic recommendation score
```

---

## 5367. Commission Boundary

Partner compensation no deberá ser una hidden positive feature del recommendation score.

Si economics influyen en una surface autorizada:

```text
explicit policy
+
disclosure
+
separate sponsored/commercial signal
+
audit
```

---

## 5368. Editorial Candidate Boundary

Editorial inclusion podrá:

- crear candidate set;
- create featured collection;
- annotate rationale.

No deberá falsificar eligibility o score.

---

## 5369. Tie-Break Rule

Campos:

```text
ruleCode
priority
conditions
tieBreakField
direction
version
```

Ejemplos permitidos:

- fresher source;
- lower known fee;
- higher verified availability;
- client explicit preference.

---

## 5370. Deterministic Recommendation Run

Dado:

```text
same context snapshot
same candidate set
same policy version
same feature versions
```

el deterministic scorer deberá producir el mismo resultado salvo componentes explícitamente stochastic/experimental.

---

## 5371. Recommendation Run Record

Campos:

```text
id
requestId
contextSnapshotId
candidateSetId
policyVersion
featureRegistryVersion
scoringVersion
startedAt
completedAt
status
```

---

## 5372. Run Reproducibility

La plataforma deberá poder reconstruir:

```text
inputs
features
constraints
weights
policy
scores
ranking
```

de un historical recommendation run.

---

## 5373. Recommendation Finding

Tipos:

```text
stale_candidate
missing_feature
constraint_conflict
preference_conflict
score_anomaly
unsupported_objective
sponsored_signal_leak
commission_signal_leak
non_reproducible_run
source_version_mismatch
```

---

## 5374. Permissions, APIs, Events and Workflows

### Permisos

```text
recommendation.request.read
recommendation.request.create

recommendation.context.read
recommendation.context.create

recommendation.candidate_set.read
recommendation.candidate_set.create

recommendation.preference.read
recommendation.preference.manage

recommendation.constraint.read
recommendation.constraint.manage

recommendation.policy.read
recommendation.policy.manage
recommendation.policy.publish

recommendation.run.read
recommendation.run.execute
```

### APIs

```text
POST /api/recommendations/requests
POST /api/recommendations/context-snapshots
POST /api/recommendations/candidate-sets

POST /api/recommendations/objective-profiles
POST /api/recommendations/preference-profiles
POST /api/recommendations/constraint-sets

GET  /api/recommendations/policies
POST /api/recommendations/policies
POST /api/recommendations/policies/{id}/versions

POST /api/recommendations/runs
GET  /api/recommendations/runs/{id}
```

### Eventos

```text
RecommendationRequestCreated
RecommendationContextSnapshotted
RecommendationCandidateSetCreated
RecommendationCandidateRejectedByGate
RecommendationPreferenceConflictDetected
RecommendationConstraintConflictDetected
RecommendationPolicyPublished
RecommendationRunStarted
RecommendationRunCompleted
RecommendationRunFailed
RecommendationFindingCreated
```

### Workflows

```text
Recommendation Request Workflow
Context Snapshot Workflow
Candidate Set Workflow
Preference Resolution Workflow
Constraint Evaluation Workflow
Recommendation Policy Workflow
Scoring Workflow
Recommendation Finding Workflow
```

---

## 5375. Pruebas, Criterios de Aceptación e Instrucciones para Codex

### Pruebas obligatorias

1. Crear Recommendation Request.
2. Crear goal.
3. Versionar goal.
4. Crear Context Snapshot.
5. Registrar source/version por fact.
6. Diferenciar verified/client-reported/estimated.
7. Aplicar context minimization.
8. Crear Candidate Set desde M37.
9. Crear client-selected Candidate Set.
10. Gatear unavailable candidate.
11. Gatear stale candidate.
12. Preservar immutable candidate set.
13. Crear Candidate Feature Snapshot.
14. Crear Feature Registry.
15. Aplicar missing-feature policy.
16. Diferenciar unknown de zero.
17. Crear Objective Profile.
18. Aplicar multiple objectives.
19. Registrar objective weights.
20. Priorizar explicit preference.
21. Crear Preference Profile.
22. Crear derived preference.
23. Detectar preference conflict.
24. Crear conflict record.
25. Crear Hard Constraint.
26. Crear Soft Constraint.
27. Evaluar hard violation.
28. Manejar hard constraint unknown.
29. Crear Recommendation Policy.
30. Versionar policy.
31. Ejecutar scoring.
32. Crear Score Record.
33. Confirmar score no se expone como approval probability.
34. Probar min-max normalization.
35. Probar domain-specific normalization.
36. Bloquear invalid cost comparison.
37. Manejar unknown cost.
38. Crear speed score.
39. Crear provider-quality score.
40. Verificar compensation ausente de provider quality.
41. Crear availability score.
42. Crear Risk Signal.
43. Aplicar risk adjustment.
44. Crear suitability context.
45. Separar sponsored signal.
46. Detectar sponsored signal leak.
47. Separar commission signal.
48. Detectar commission signal leak.
49. Crear editorial candidate set.
50. Crear tie-break.
51. Probar deterministic run.
52. Crear Recommendation Run Record.
53. Reproducir historical run.
54. Crear stale-candidate finding.
55. Crear score-anomaly finding.
56. Probar permissions.
57. Probar APIs.
58. Probar events/outbox.
59. Probar workflows.
60. Probar immutable audit.

### Criterios de aceptación

La Parte 1 estará completa cuando:

1. Exista Recommendation Request.
2. Existan request statuses.
3. Existan Goals versionados.
4. Exista Context Snapshot inmutable.
5. Cada fact tenga source/version.
6. Exista context minimization.
7. Exista Candidate Set.
8. Existan candidate sources.
9. Exista Candidate Eligibility Gate.
10. Exista allowed-status policy.
11. Candidate set sea immutable.
12. Exista Candidate Feature Snapshot.
13. Exista Feature Registry.
14. Existan Feature Families.
15. Exista source priority.
16. Exista Missing Feature Policy.
17. Unknown y zero estén separados.
18. Exista Objective Profile.
19. Existan Supported Objectives.
20. Existan Objective Weights.
21. Explicit preferences tengan prioridad.
22. Exista Preference Profile.
23. Exista Preference Source.
24. Exista Preference Confidence.
25. Exista Preference Conflict.
26. Exista Hard Constraint.
27. Exista Soft Constraint.
28. Exista Constraint Set.
29. Exista Constraint Evaluation.
30. Hard violations puedan bloquear.
31. Unknown hard constraints no pasen silenciosamente.
32. Exista Recommendation Policy.
33. Exista Policy Status.
34. Exista Policy Versioning.
35. Exista Scoring Model.
36. Exista Score Record.
37. Score no sea approval/credit/provider score.
38. Exista Feature Normalization.
39. Cost scoring respete métricas.
40. Unknown cost no gane silenciosamente.
41. Exista Speed Scoring.
42. Exista Provider Quality Scoring.
43. Compensation no forme parte oculta del quality score.
44. Exista Availability Scoring.
45. Exista Risk Signal Registry.
46. Exista Risk Adjustment.
47. Exista Suitability Context.
48. Sponsored signal esté separado.
49. Commission signal esté separado.
50. Editorial candidate no falsifique score.
51. Exista Tie-Break Rule.
52. Exista deterministic run.
53. Exista Recommendation Run Record.
54. Exista run reproducibility.
55. Existan Recommendation Findings.
56. Existan permisos/APIs/events/workflows.
57. M38 no duplique eligibility logic.
58. M38 no tome provider decisions.
59. Toda recommendation input sea auditable.
60. Parte 1 termine lista para Recommendation Generation de Parte 2.

### Instrucciones para Codex

1. Lee M37 completo antes de implementar M38.
2. Reutiliza M37 candidate/match/comparison records.
3. No copies eligibility logic.
4. Implementa RecommendationRequest.
5. Implementa immutable ContextSnapshot.
6. Implementa CandidateSet inmutable.
7. Implementa Feature Registry versionado.
8. Mantén source/version/freshness por feature.
9. Diferencia unknown de zero.
10. Implementa ObjectiveProfile.
11. Implementa PreferenceProfile.
12. Explicit preference debe superar derived/default preference.
13. Implementa Preference Conflict.
14. Implementa Hard/Soft Constraints.
15. Unknown hard constraint no debe pass silenciosamente.
16. Implementa RecommendationPolicy versionada.
17. Implementa deterministic scoring.
18. Implementa ScoreRecord.
19. Nunca llames score "approval probability".
20. Implementa domain-aware normalization.
21. No mezcles APR/factor/fees indebidamente.
22. Implementa Risk Signal Registry.
23. Separa sponsored/economic signals del organic score.
24. Implementa Tie-Breaks versionados.
25. Implementa reproducible RecommendationRun.
26. Implementa Findings.
27. Implementa permissions/APIs/events/workflows.
28. Implementa immutable audit.
29. No marques Parte 1 completa si recommendation runs no pueden reproducirse o si compensation puede contaminar silenciosamente el organic score.

### Verificación final de Parte 1

- ¿Eligibility, recommendation y provider decision están separados?
- ¿M38 recibe candidate sets de M37?
- ¿Context snapshots son inmutables?
- ¿Cada feature tiene source/version/freshness?
- ¿Unknown no se convierte en zero?
- ¿Preferencias explícitas tienen prioridad?
- ¿Hard constraints bloquean correctamente?
- ¿Scoring policy está versionada?
- ¿Cost metrics incompatibles no se mezclan?
- ¿Sponsored/commission signals están separados?
- ¿Recommendation runs son reproducibles?
- ¿Toda acción queda auditada?

---

# Parte 2 — Recommendation Generation, Ranking, Multi-Objective Tradeoffs, Explanations, Confidence, Alternatives, Suitability y Client Decision Support

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 2  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 38 — Parte 1  
**Secciones incluidas:** 5376–5440  
**Audiencia:** Owner, Codex, product managers, data/ML engineers, marketplace operators, compliance, analysts, reviewers, support y clientes  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Recommendation generation determinística y explicable sobre candidatos ya filtrados, con tradeoffs multiobjetivo, uncertainty explícita, suitability contextual, alternativas y client choice preservado

## 5376. Objetivo de Parte 2

Esta parte define cómo un `RecommendationRun` produce recomendaciones utilizables.

Pipeline:

```text
scored candidates
→ ranking
→ tradeoff analysis
→ suitability checks
→ confidence
→ alternatives
→ explanation
→ client-facing recommendation
→ client decision support
```

## 5377. Recommendation Output

Campos:

```text
id
recommendationRunId
requestId
status
primaryRecommendationIdOptional
recommendedCandidateIds
alternativeCandidateIds
recommendationVersion
createdAt
expiresAt
```

## 5378. Recommendation Output Status

```text
completed
completed_with_warnings
needs_information
no_suitable_candidate
manual_review_required
expired
superseded
```

## 5379. Ranked Candidate

Campos:

```text
candidateId
rank
finalScore
scoreBand
objectivePerformance
tradeoffs
riskSignals
confidence
explanationId
```

## 5380. Ranking Principle

Ranking deberá ordenar por:

```text
policy
+
client goal
+
explicit preferences
+
constraints
+
candidate facts
+
risk/suitability context
```

No por hidden partner compensation.

## 5381. Ranking Stability

Pequeños cambios irrelevantes en una feature no deberán causar cambios extremos de ranking sin razón metodológica.

El system deberá medir:

```text
rankingStability
```

## 5382. Ranking Band

```text
top_fit
strong_fit
reasonable_fit
conditional_fit
weak_fit
manual_review
```

No usar:

```text
approved
guaranteed
```

## 5383. Primary Recommendation

Una recommendation podrá tener:

```text
primaryRecommendation
```

solo cuando exista diferencia suficientemente explicable frente a alternativas.

Si no:

```text
multiple_good_options
```

## 5384. No Forced Winner

Cuando candidates sean materialmente equivalentes:

```text
show_top_options
```

en vez de fabricar un ganador.

## 5385. Multi-Objective Optimization

El motor deberá soportar tradeoffs entre:

```text
cost
speed
amount
payment burden
cash required
term
collateral
personal guarantee
complexity
provider quality
```

según domain.

## 5386. Objective Performance Record

Campos:

```text
candidateId
objectiveCode
normalizedScore
rawValue
source
confidence
```

## 5387. Tradeoff Record

Campos:

```text
candidateId
advantage
disadvantage
affectedObjective
magnitude
sourceReferences
clientImpact
```

## 5388. Tradeoff Explanation

Ejemplo conceptual:

```text
Option A:
lower known cost
but
slower estimated funding

Option B:
faster estimated funding
but
higher known cost
```

La UI deberá preservar ambas dimensiones.

## 5389. Pareto Frontier Context

Cuando sea útil, el engine podrá identificar candidates no dominados:

```text
paretoOptimal = true
```

sin obligar a escoger uno.

## 5390. Dominated Candidate

Un candidate podrá marcarse:

```text
dominated
```

solo si otro candidate es igual o mejor en todas las dimensiones comparables y mejor en al menos una, bajo el mismo context.

## 5391. Comparison Completeness

Antes de afirmar dominancia:

```text
requiredComparableFieldsKnown
```

deberá ser suficiente.

Unknowns bloquean conclusiones fuertes.

## 5392. Recommendation Explanation

Campos:

```text
id
recommendationRunId
candidateId
summary
topPositiveFactors
topNegativeFactors
tradeoffs
unknowns
riskWarnings
sources
generatedBy
reviewStatus
```

## 5393. Explanation Layers

La plataforma deberá soportar:

```text
short
standard
detailed
specialist
audit
```

## 5394. Short Explanation

Ejemplo:

```text
"Esta opción aparece primero porque coincide con tu prioridad de menor costo conocido y no requiere collateral según la información actual."
```

Siempre limitada a facts realmente conocidos.

## 5395. Detailed Explanation

Podrá incluir:

- objectives;
- weights;
- candidate values;
- comparisons;
- risk flags;
- unknown values;
- source freshness;
- policy version.

## 5396. Explanation Fidelity

Explanation deberá describir el verdadero motivo del ranking.

No deberá generar una narrativa posterior que contradiga scoring inputs.

## 5397. Explanation Source Lineage

Cada material statement deberá rastrear:

```text
candidate feature
domain source
marketplace listing
client preference
policy rule
```

## 5398. Unknown Explanation

Unknown deberá aparecer explícitamente cuando material.

Ejemplo:

```text
"El costo total no está disponible todavía, por lo que no se usó como una ventaja."
```

## 5399. Confidence Model

Confidence deberá reflejar calidad de la recommendation, no probability of approval.

Podrá considerar:

```text
data completeness
source verification
source freshness
candidate comparability
objective clarity
preference clarity
policy certainty
```

## 5400. Confidence Levels

```text
high
moderate
low
insufficient_information
manual_review_required
```

## 5401. Confidence Record

Campos:

```text
recommendationRunId
candidateIdOptional
overallConfidence
factorConfidence
missingDataImpact
staleDataImpact
conflictImpact
createdAt
```

## 5402. Confidence Boundary

Nunca mostrar:

```text
"90% chance of approval"
```

si el value es recommendation confidence.

UI deberá etiquetar:

```text
recommendation confidence
```

## 5403. Recommendation Warning

Tipos:

```text
unknown_pricing
stale_data
high_cost
short_term
frequent_payment
collateral
personal_guarantee
assistance_repayment
limited_availability
manual_review
complex_terms
```

## 5404. Warning Severity

```text
info
attention
important
blocking
```

## 5405. Suitability Assessment

Campos:

```text
id
requestId
candidateId
goalAlignment
paymentOrCostContext
riskContext
complexityContext
timeHorizonContext
knownConflicts
status
createdAt
```

## 5406. Suitability Status

```text
appears_suitable_for_stated_goal
appears_suitable_with_tradeoffs
needs_more_information
potential_mismatch
manual_review_required
blocked
```

No significa provider approval.

## 5407. Suitability Rule Registry

Cada rule:

```text
ruleCode
domain
condition
effect
severity
explanationTemplate
version
```

## 5408. High-Cost Product Suitability

Cuando candidate tenga:

```text
high_cost
```

el engine deberá:

- show warning;
- compare lower-cost known alternatives when available;
- show payment frequency;
- explain material fees;
- avoid ranking solely on speed.

## 5409. Payment Burden Suitability

Cuando payment data exista:

```text
paymentAmount
paymentFrequency
incomeOrCashFlowContext
```

podrá crear burden context.

No sustituye lender underwriting.

## 5410. Collateral / Personal Guarantee Suitability

Si cliente indicó:

```text
avoid_collateral
avoid_personal_guarantee
```

candidate con ese requirement deberá:

- recibir tradeoff/penalty;
- ser visible si no hard constrained;
- explicar claramente el conflict.

## 5411. Assistance Obligation Suitability

Para DPA/forgivable/deferred assistance:

```text
occupancy obligation
repayment trigger
forgiveness timeline
sale/refinance trigger
```

deberán entrar al explanation.

## 5412. Alternative Recommendation Set

Campos:

```text
recommendationId
alternativeCandidateIds
selectionReason
diversityPolicy
createdAt
```

## 5413. Alternative Diversity

Alternatives deberán aportar options distintas, por ejemplo:

```text
lowest_known_cost
fastest_known_option
lowest_cash_requirement
simplest_process
best_verified_availability
```

cuando semánticamente válidas.

## 5414. Alternative Boundary

No mostrar alternativas que:

- violen hard constraints;
- estén unavailable;
- tengan blocking stale data;
- sean prohibited by policy.

## 5415. "Why Not This?" Explanation

Cliente podrá preguntar por candidate no recomendado.

Respuesta podrá mostrar:

- lower fit;
- failed soft preference;
- higher known cost;
- more risk;
- missing data;
- availability limitation.

## 5416. Counterfactual Explanation

El engine podrá responder:

```text
"Si priorizaras velocidad sobre costo, Option B subiría en el ranking."
```

solo recomputando con policy válida.

## 5417. What-If Scenario

Campos:

```text
id
baseRecommendationRunId
changedPreferences
changedConstraints
changedObjectives
scenarioPolicyVersion
createdAt
```

## 5418. What-If Boundary

What-if no deberá alterar original recommendation run.

Deberá crear:

```text
new scenario/run
```

## 5419. Sensitivity Analysis

Podrá medir:

```text
rankSensitivityToCostWeight
rankSensitivityToSpeedWeight
rankSensitivityToUnknownResolution
```

para detectar recommendations frágiles.

## 5420. Recommendation Robustness

Bandas:

```text
robust
moderately_sensitive
highly_sensitive
insufficient_information
```

## 5421. Recommendation Expiration

La recommendation deberá expirar cuando:

- candidate source expire;
- listing/product changes materially;
- client context changes;
- preference changes;
- provider unavailable;
- policy invalidated.

## 5422. Recommendation Invalidation Record

Campos:

```text
recommendationId
reason
sourceEvent
invalidatedAt
replacementRunIdOptional
```

## 5423. Client Decision Workspace

Secciones:

```text
Recommended
Alternatives
Compare
Why This
Tradeoffs
Costs
Risks
Unknowns
Disclosures
Next Step
```

## 5424. Client Decision Record

Campos:

```text
id
clientId
recommendationId
selectedCandidateIdOptional
decision
reasonOptional
decidedAt
```

## 5425. Client Decision Types

```text
selected_recommended
selected_alternative
selected_other
need_more_information
defer
decline_all
request_specialist
```

## 5426. Client Choice Principle

Recommendation deberá:

```text
inform
not coerce
```

Cliente podrá elegir una alternativa permitida aunque no sea rank #1.

## 5427. Recommendation Acknowledgment

Cuando policy requiera:

```text
disclosuresPresented
warningsPresented
clientAcknowledgment
timestamp
```

## 5428. Specialist Review

Casos de review:

```text
high_cost
conflicting data
manual eligibility review
high sensitivity
low confidence
client request
complex multi-product comparison
```

## 5429. Specialist Recommendation Record

Campos:

```text
id
recommendationId
specialistId
reviewDecision
selectedCandidateIdOptional
rationale
overrides
reviewedAt
```

## 5430. Specialist Override

Override deberá:

- requerir permission;
- registrar reason;
- preservar original ranking;
- no alterar source facts;
- poder ser audited.

## 5431. Override Types

```text
promote_candidate
demote_candidate
exclude_candidate
require_more_information
replace_recommendation
```

## 5432. Override Boundary

No permitir override para:

- convertir ineligible en eligible;
- fabricar provider approval;
- ocultar required disclosure;
- borrar risk flag sin source.

## 5433. Recommendation Presentation Modes

```text
single_top_choice
top_three
tradeoff_matrix
comparison_first
specialist_review_first
no_recommendation
```

Policy podrá escoger modo.

## 5434. No Recommendation Outcome

Cuando no haya candidate apropiado:

```text
no_suitable_candidate
```

La UI deberá explicar:

- why;
- what data is missing;
- what next steps exist;
- whether broader search is possible.

## 5435. Recommendation Result Snapshot

Debe preservar:

```text
ranked candidates
scores
explanations
confidence
warnings
alternatives
disclosures
client-visible version
```

## 5436. Recommendation Export / Share

Podrá generar client-safe summary:

```text
recommendation
alternatives
tradeoffs
known costs
warnings
sources
generatedAt
```

sin internal scoring secrets innecesarios.

## 5437. Recommendation Finding Types

```text
explanation_score_mismatch
confidence_overstated
invalid_alternative
hard_constraint_bypass
missing_warning
stale_recommendation
override_without_reason
client_choice_blocked
what_if_mutated_original
```

## 5438. Permissions, APIs, Events and Workflows

### Permisos

```text
recommendation.output.read
recommendation.output.generate

recommendation.explanation.read
recommendation.explanation.generate

recommendation.suitability.read
recommendation.suitability.evaluate

recommendation.what_if.create
recommendation.client_decision.read
recommendation.client_decision.manage

recommendation.specialist_review.read
recommendation.specialist_review.manage
recommendation.override.execute
```

### APIs

```text
POST /api/recommendations/runs/{id}/generate
GET  /api/recommendations/{id}

GET  /api/recommendations/{id}/explanations
GET  /api/recommendations/{id}/alternatives

POST /api/recommendations/{id}/what-if
POST /api/recommendations/{id}/client-decisions

POST /api/recommendations/{id}/specialist-reviews
POST /api/recommendations/{id}/overrides
POST /api/recommendations/{id}/invalidate
```

### Eventos

```text
RecommendationGenerated
RecommendationPrimaryCandidateSelected
RecommendationMultipleGoodOptionsDetected
RecommendationWarningCreated
RecommendationSuitabilityEvaluated
RecommendationAlternativeSetCreated
RecommendationWhatIfCreated
RecommendationInvalidated
RecommendationClientDecisionRecorded
RecommendationSpecialistReviewCompleted
RecommendationOverrideApplied
RecommendationNoSuitableCandidate
RecommendationFindingCreated
```

### Workflows

```text
Recommendation Generation Workflow
Multi-Objective Tradeoff Workflow
Explanation Workflow
Confidence Workflow
Suitability Workflow
Alternative Generation Workflow
What-If Workflow
Recommendation Invalidation Workflow
Client Decision Workflow
Specialist Review Workflow
Override Workflow
```

## 5439. Pruebas de Parte 2

Pruebas obligatorias:

1. Generar Recommendation Output.
2. Crear ranked candidates.
3. Crear rank bands.
4. Seleccionar primary recommendation.
5. Detectar multiple-good-options.
6. Ejecutar multi-objective ranking.
7. Crear Objective Performance Record.
8. Crear Tradeoff Record.
9. Mostrar two-way tradeoff.
10. Detectar Pareto-optimal candidate.
11. Bloquear dominance con unknown fields.
12. Crear Recommendation Explanation.
13. Crear short explanation.
14. Crear detailed explanation.
15. Verificar explanation fidelity.
16. Verificar source lineage.
17. Explicar unknown value.
18. Calcular recommendation confidence.
19. Crear Confidence Record.
20. Bloquear approval-probability language.
21. Crear recommendation warning.
22. Crear Suitability Assessment.
23. Crear high-cost suitability warning.
24. Crear payment-burden context.
25. Evaluar collateral preference conflict.
26. Evaluar personal-guarantee conflict.
27. Evaluar DPA repayment obligations.
28. Crear Alternative Recommendation Set.
29. Probar alternative diversity.
30. Bloquear invalid alternatives.
31. Renderizar Why Not This.
32. Crear counterfactual explanation.
33. Crear What-If Scenario.
34. Verificar original run unchanged.
35. Ejecutar sensitivity analysis.
36. Crear robustness band.
37. Expirar recommendation.
38. Invalidar after source change.
39. Invalidar after preference change.
40. Renderizar Client Decision Workspace.
41. Registrar recommended selection.
42. Registrar alternative selection.
43. Registrar defer.
44. Registrar decline all.
45. Preservar client choice.
46. Registrar acknowledgment.
47. Crear Specialist Review.
48. Aplicar specialist override.
49. Preservar original ranking.
50. Bloquear eligibility override.
51. Bloquear hidden disclosure.
52. Crear presentation modes.
53. Crear no-suitable-candidate outcome.
54. Crear Result Snapshot.
55. Crear client-safe export.
56. Crear explanation-score mismatch finding.
57. Crear stale-recommendation finding.
58. Probar permissions/APIs/events.
59. Probar workflows.
60. Probar immutable audit.

## 5440. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 2 estará completa cuando:

1. Exista Recommendation Output.
2. Existan output statuses.
3. Exista Ranked Candidate.
4. Exista Ranking Principle.
5. Exista Ranking Stability context.
6. Existan Ranking Bands.
7. Primary recommendation requiera basis.
8. Exista No Forced Winner.
9. Exista multi-objective optimization.
10. Exista Objective Performance Record.
11. Exista Tradeoff Record.
12. Exista Tradeoff Explanation.
13. Exista Pareto context.
14. Dominance requiera sufficient comparable data.
15. Exista Recommendation Explanation.
16. Existan explanation layers.
17. Exista short explanation.
18. Exista detailed explanation.
19. Explanation tenga fidelity.
20. Explanation tenga source lineage.
21. Unknowns sean visibles.
22. Exista Confidence Model.
23. Existan Confidence Levels.
24. Exista Confidence Record.
25. Confidence no sea approval probability.
26. Existan Recommendation Warnings.
27. Exista Warning Severity.
28. Exista Suitability Assessment.
29. Existan Suitability Statuses.
30. Exista Suitability Rule Registry.
31. High-cost products tengan suitability controls.
32. Exista payment-burden context.
33. Collateral/PG preferences influyan correctamente.
34. Assistance obligations sean explicadas.
35. Exista Alternative Recommendation Set.
36. Exista Alternative Diversity.
37. Invalid alternatives sean bloqueadas.
38. Exista Why Not This.
39. Exista Counterfactual Explanation.
40. Exista What-If Scenario.
41. What-if preserve original run.
42. Exista Sensitivity Analysis.
43. Exista Recommendation Robustness.
44. Exista Recommendation Expiration.
45. Exista Invalidation Record.
46. Exista Client Decision Workspace.
47. Exista Client Decision Record.
48. Existan Client Decision Types.
49. Client choice sea preservado.
50. Exista Recommendation Acknowledgment.
51. Exista Specialist Review.
52. Exista Specialist Override.
53. Override preserve original ranking.
54. Override no pueda alterar eligibility/source truth.
55. Existan Presentation Modes.
56. Exista No Recommendation Outcome.
57. Exista Result Snapshot.
58. Exista client-safe Export/Share.
59. Existan Recommendation Findings.
60. Existan permisos/APIs/events/workflows.
61. Toda explanation sea auditable.
62. Parte 2 termine lista para Personalization/Learning Loops de Parte 3.

### Instrucciones para Codex

1. Lee Parte 1 completa.
2. Implementa RecommendationOutput.
3. Implementa ranked candidates.
4. No fuerces un ganador entre options equivalentes.
5. Implementa multi-objective tradeoffs.
6. Implementa Pareto context solo con comparable data suficiente.
7. Implementa Explanation object separado del UI text.
8. Haz explanations fieles al scoring real.
9. Conserva source lineage.
10. Expón unknowns materialmente relevantes.
11. Implementa Recommendation Confidence.
12. Nunca conviertas confidence en approval probability.
13. Implementa Warnings.
14. Implementa Suitability Assessment.
15. Agrega special handling para high-cost products.
16. Implementa payment burden como context, no underwriting.
17. Implementa alternatives diversas.
18. No incluyas candidates que violan hard constraints.
19. Implementa Why Not This.
20. Implementa recomputed counterfactuals.
21. Implementa What-If como new run.
22. Implementa sensitivity/robustness.
23. Implementa invalidation/expiration.
24. Implementa Client Decision Workspace.
25. Preserva client choice.
26. Implementa Specialist Review.
27. Overrides deben ser explicit/authorized/audited.
28. Nunca permitas override de source truth/eligibility.
29. Implementa no-suitable-candidate.
30. Implementa Result Snapshot.
31. Implementa client-safe exports.
32. Implementa Findings.
33. Implementa permissions/APIs/events/workflows.
34. Implementa immutable audit.
35. No marques Parte 2 completa si explanation no puede reconciliarse con score/ranking o si client choice puede ser bloqueado por commercial preference.

### Verificación final de Parte 2

- ¿Ranking final refleja objectives/preferences reales?
- ¿Candidates equivalentes pueden mostrarse como múltiples buenas opciones?
- ¿Tradeoffs son visibles?
- ¿Unknowns bloquean conclusiones fuertes?
- ¿Explanations son fieles al scoring?
- ¿Confidence no parece approval probability?
- ¿High-cost/PG/collateral obligations son visibles?
- ¿Alternatives cumplen hard constraints?
- ¿What-if crea un nuevo run?
- ¿Recommendations se invalidan cuando cambian inputs?
- ¿Cliente puede elegir una alternativa?
- ¿Specialist override conserva original ranking y audit?
- ¿Toda acción material queda auditada?

---

# Parte 3 — Personalization, Feedback, Learning Loops, Evaluation, Experimentation, Fairness, Drift, Quality Assurance y Human Review

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 3  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 38 — Parte 2  
**Secciones incluidas:** 5441–5505  
**Audiencia:** Owner, Codex, product managers, data scientists, ML engineers, analysts, marketplace operators, compliance, reviewers, support y QA  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Personalization controlada y consent-aware con feedback loops gobernados, evaluation offline/online, experimentation segura, fairness controls, drift monitoring, QA y human review; ningún loop deberá autooptimizar hacia approval, hidden compensation o protected-trait targeting

## 5441. Objetivo de Parte 3

Esta parte define cómo mejorar recomendaciones con el tiempo sin perder control.

Pipeline:

```text
client interaction
→ feedback
→ quality signal
→ governed learning dataset
→ evaluation
→ approved model/policy update
→ monitored deployment
→ drift/fairness review
```

Nunca:

```text
clicks
→ automatic policy mutation in production
```

## 5442. Personalization Principle

Personalization deberá ser:

```text
purpose-limited
consent-aware
explainable
reversible
minimized
auditable
```

## 5443. Personalization Profile

Campos:

```text
id
clientId
profileVersion
explicitPreferences
derivedPreferences
excludedCategories
interactionSummary
consentId
status
createdAt
updatedAt
```

## 5444. Personalization Profile Status

```text
active
limited
disabled_by_client
consent_expired
under_review
archived
```

## 5445. Explicit versus Derived Preferences

Separar:

```text
explicit
derived
default
```

Prioridad:

```text
explicit > derived > default
```

salvo hard policy/safety constraints.

## 5446. Derived Preference Record

Campos:

```text
preferenceCode
derivedValue
evidenceSignals
confidence
modelVersion
derivedAt
expiresAt
```

## 5447. Derived Preference Expiration

Derived preferences deberán expirar o degradarse cuando:

- no haya recent supporting signals;
- client behavior cambie;
- client explicit preference contradiga;
- consent expire.

## 5448. Personalization Consent

Campos:

```text
consentId
clientId
purpose
dataCategories
surfaces
authorizedAt
expiresAt
withdrawnAt
status
```

## 5449. Personalization Consent Withdrawal

Al retirar consent:

```text
stop future personalized processing
→ disable derived personalization
→ preserve required audit/history
→ revert to non-personalized/default policy
```

## 5450. Sensitive Data Exclusion

No usar para personalization general:

- SSN/tax identifiers;
- raw credit report contents;
- tax return line items;
- bank transaction details;
- health data;
- political beliefs;
- unrelated private communications;
- protected traits unless lawful explicit program logic requires them.

## 5451. Feedback Taxonomy

Tipos:

```text
helpful
not_helpful
not_relevant
too_expensive
too_slow
too_complex
wrong_goal
already_have
prefer_alternative
missing_information
misleading
other
```

## 5452. Feedback Record

Campos:

```text
id
clientIdOptional
recommendationId
candidateIdOptional
feedbackType
freeTextOptional
createdAt
sourceSurface
```

## 5453. Explicit Feedback Priority

Explicit feedback deberá tener mayor peso que inferred behavior para la misma preference.

## 5454. Behavioral Signals

Opcionales:

```text
view
save
compare
expand_explanation
click_CTA
start_journey
complete_journey
select_alternative
dismiss
return_visit
```

## 5455. Behavioral Signal Boundary

Un behavior:

```text
click_CTA
```

no significa automáticamente:

```text
client_prefers_product
client_was_satisfied
product_was_suitable
```

## 5456. Outcome Signals

Podrán incluir:

```text
verified_conversion
journey_abandonment
provider_decline
client_decline
service_completion
funded
home_purchase_closed
```

Outcome deberá preservar source/verification.

## 5457. Feedback Signal Quality

Cada signal deberá tener:

```text
signalType
verificationStatus
confidence
source
weightPolicy
```

## 5458. Feedback Aggregation

La plataforma podrá crear:

```text
candidate_feedback_summary
recommendation_feedback_summary
client_preference_update_candidate
```

sin alterar source product facts.

## 5459. Learning Loop Boundary

Production learning deberá seguir:

```text
collect
→ validate
→ curate
→ evaluate
→ approve
→ deploy
```

No online self-modification directa.

## 5460. Training / Evaluation Dataset Record

Campos:

```text
id
datasetVersion
purpose
timeRange
includedDomains
labelDefinition
featureSetVersion
samplingMethod
exclusions
createdAt
approvedBy
```

## 5461. Dataset Lineage

Cada dataset deberá registrar:

```text
sourceTables
sourceVersions
transforms
filters
labelLogic
snapshotDate
```

## 5462. Label Definition

Ejemplos permitidos:

```text
client_selected
client_reported_helpful
verified_conversion
completed_journey
specialist_approved_quality
```

No usar `approved by lender` como universal recommendation-success label sin domain context.

## 5463. Label Leakage Control

No usar information disponible solo después del decision point para entrenar un model destinado al earlier decision point.

## 5464. Selection Bias Control

Dataset deberá identificar bias potencial por:

```text
only_clicked_items
only_completed_referrals
partner_reporting_gaps
missing_client_feedback
historical_policy_bias
```

## 5465. Offline Evaluation

Antes de deploy:

```text
accuracy_or_relevance_metrics
ranking_metrics
coverage
calibration_context
fairness_checks
stability
explanation_fidelity
safety_checks
```

## 5466. Ranking Evaluation Metrics

Podrán incluir:

```text
NDCG
MAP
MRR
precision_at_K
recall_at_K
coverage
diversity
```

solo donde correspondan a valid labels.

## 5467. Business Outcome Metrics Boundary

Podrá medirse:

```text
verified_conversion_rate
journey_completion_rate
client_helpfulness_rate
```

pero no optimizar exclusivamente conversion si deteriora suitability/transparency.

## 5468. Recommendation Quality Scorecard

Dimensiones:

```text
relevance
suitability
cost_transparency
explanation_quality
freshness
client_choice_preservation
complaint_rate
manual_override_rate
```

## 5469. Baseline Model / Policy

Toda nueva version deberá compararse contra:

```text
current_production_baseline
```

y registrar delta.

## 5470. Evaluation Threshold Registry

Campos:

```text
metricCode
minimumAcceptable
maximumRegression
domain
goal
policyVersion
effectiveDate
```

## 5471. Release Gate

Nueva policy/model solo podrá pasar a production si:

```text
offline thresholds pass
safety checks pass
fairness review pass when required
explanation fidelity pass
human approval complete
```

## 5472. Experiment Registry

Campos:

```text
id
experimentCode
hypothesis
population
controlPolicy
treatmentPolicy
allocation
startAt
endAt
status
owner
```

## 5473. Experiment Status

```text
draft
review
approved
running
paused
stopped
completed
invalidated
```

## 5474. Experiment Eligibility

Experiments no deberán incluir cases que policy excluya por:

- high-risk product;
- low confidence;
- manual review;
- sensitive eligibility context;
- compliance restriction.

## 5475. Randomization Unit

Podrá ser:

```text
client
session
request
organization
```

según experiment design.

Evitar cross-treatment contamination.

## 5476. Experiment Guardrails

Ejemplos:

```text
complaint_rate
hard_constraint_violation
missing_disclosure_rate
high_cost_exposure
client_opt_out_rate
manual_override_rate
security_or_privacy_incident
```

## 5477. Early Stop Rule

Experiment deberá poder detenerse por:

- guardrail breach;
- material safety issue;
- data-quality failure;
- unexpected bias;
- severe negative client impact.

## 5478. Experiment Exposure Record

Campos:

```text
experimentId
unitId
variant
assignedAt
recommendationRequestId
```

Assignment deberá ser reproducible.

## 5479. Experiment Analysis

Deberá separar:

```text
primary_metric
secondary_metrics
guardrails
confidence_interval
sample_size
segment_breakdown
data_quality_notes
```

## 5480. Fairness Principle

El motor deberá evitar discriminatory or proxy-driven ranking.

Fairness review deberá considerar:

```text
who sees what
who is excluded
quality of recommendation
error rates
manual overrides
complaints
```

## 5481. Protected Attribute Boundary

Protected traits no deberán utilizarse como ranking features salvo que:

```text
lawful program criterion
+
explicit policy
+
compliance approval
+
minimal scope
```

Incluso entonces, deberán tratarse como eligibility/program logic, no commercial optimization signal.

## 5482. Proxy Feature Review

Features potencialmente correlacionadas deberán poder marcarse:

```text
proxy_risk
```

para human/compliance review.

## 5483. Fairness Evaluation Record

Campos:

```text
id
modelOrPolicyVersion
populationDefinition
metrics
segments
findings
limitations
reviewedBy
reviewedAt
status
```

## 5484. Fairness Findings

Tipos:

```text
exposure_disparity
ranking_quality_disparity
false_exclusion_disparity
manual_override_disparity
complaint_disparity
data_coverage_disparity
proxy_feature_risk
```

## 5485. Fairness Interpretation Boundary

Una disparity metric no deberá presentarse como legal conclusion automática.

Debe ser:

```text
monitoring signal
→ review
→ investigation
```

## 5486. Drift Monitoring

Tipos:

```text
feature_drift
candidate_mix_drift
provider_mix_drift
outcome_drift
preference_drift
policy_effect_drift
explanation_drift
```

## 5487. Drift Metric Record

Campos:

```text
metricCode
baselineWindow
currentWindow
value
threshold
severity
detectedAt
```

## 5488. Drift Severity

```text
info
watch
investigate
blocking
```

## 5489. Drift Response

```text
detect
→ identify source
→ assess impact
→ compare baseline
→ pause/rollback if needed
→ retrain/reconfigure only after review
```

## 5490. Model / Policy Rollback

Deberá poder revertir a:

```text
last_known_good_version
```

preservando historical runs.

## 5491. Quality Assurance Review

QA deberá verificar:

- deterministic reproducibility;
- constraint enforcement;
- sponsored separation;
- commission isolation;
- explanation fidelity;
- unknown handling;
- source freshness;
- client-choice preservation;
- correct disclosures.

## 5492. QA Test Suite Version

Campos:

```text
suiteVersion
domainCoverage
goalCoverage
testCount
createdAt
approvedAt
```

## 5493. Golden Recommendation Cases

Dataset curado con expected behavior:

```text
context
candidateSet
policy
expectedTopSet
requiredWarnings
forbiddenOutputs
```

## 5494. Regression Testing

Cada release deberá probar:

```text
previous golden cases
new bug cases
edge cases
high-risk cases
no-recommendation cases
```

## 5495. Shadow Evaluation

Nueva policy/model podrá ejecutarse en:

```text
shadow_mode
```

sin afectar client-visible output.

## 5496. Human Review Queue

Casos:

```text
low_confidence
high_cost
high_sensitivity
data_conflict
fairness_flag
proxy_risk
manual_eligibility
override_requested
complaint_linked
```

## 5497. Human Review Record

Campos:

```text
id
recommendationId
reviewReason
reviewerId
reviewDecision
notes
createdAt
completedAt
```

## 5498. Human Review Decision

```text
approve_output
approve_with_warning
require_more_information
rerun_with_updated_context
override_with_reason
block_recommendation
escalate
```

## 5499. Reviewer Independence

Cuando sea necesario por policy:

```text
creator != reviewer
```

para high-impact changes, experiments o sensitive cases.

## 5500. Feedback to Policy Change

Un recurring feedback pattern podrá crear:

```text
policy_change_proposal
```

pero nunca modificar production policy automáticamente.

## 5501. Policy Change Proposal

Campos:

```text
id
sourceSignals
affectedGoals
proposedChange
expectedImpact
riskAssessment
evaluationPlan
status
createdAt
```

## 5502. Recommendation Quality Finding

Tipos:

```text
feedback_spike
quality_regression
fairness_signal
drift_detected
experiment_guardrail_breach
label_leakage
selection_bias
explanation_regression
override_spike
dataset_quality_issue
```

## 5503. Permissions, APIs, Events and Workflows

### Permisos

```text
recommendation.personalization.read
recommendation.personalization.manage
recommendation.feedback.read
recommendation.feedback.create

recommendation.dataset.read
recommendation.dataset.manage

recommendation.evaluation.read
recommendation.evaluation.execute

recommendation.experiment.read
recommendation.experiment.manage
recommendation.experiment.approve

recommendation.fairness.read
recommendation.fairness.review

recommendation.drift.read
recommendation.drift.manage

recommendation.QA.read
recommendation.QA.execute

recommendation.human_review.read
recommendation.human_review.manage
```

### APIs

```text
POST /api/recommendations/personalization-profiles
POST /api/recommendations/feedback
POST /api/recommendations/datasets

POST /api/recommendations/evaluations
POST /api/recommendations/experiments
POST /api/recommendations/experiments/{id}/exposures
POST /api/recommendations/experiments/{id}/analyze

POST /api/recommendations/fairness/evaluations
POST /api/recommendations/drift/checks
POST /api/recommendations/QA/runs

GET  /api/recommendations/human-review
POST /api/recommendations/{id}/human-review
POST /api/recommendations/policy-change-proposals
```

### Eventos

```text
RecommendationPersonalizationProfileUpdated
RecommendationPersonalizationConsentWithdrawn
RecommendationFeedbackRecorded
RecommendationDatasetCreated
RecommendationOfflineEvaluationCompleted
RecommendationReleaseGatePassed
RecommendationExperimentStarted
RecommendationExperimentGuardrailBreached
RecommendationExperimentStopped
RecommendationFairnessFindingCreated
RecommendationDriftDetected
RecommendationPolicyRolledBack
RecommendationQARunCompleted
RecommendationHumanReviewRequested
RecommendationHumanReviewCompleted
RecommendationPolicyChangeProposed
RecommendationQualityFindingCreated
```

### Workflows

```text
Personalization Workflow
Feedback Workflow
Dataset Governance Workflow
Offline Evaluation Workflow
Release Gate Workflow
Experiment Workflow
Fairness Review Workflow
Drift Monitoring Workflow
Rollback Workflow
QA Workflow
Human Review Workflow
Policy Change Proposal Workflow
```

## 5504. Pruebas de Parte 3

Pruebas obligatorias:

1. Crear Personalization Profile.
2. Priorizar explicit preference.
3. Crear Derived Preference.
4. Expirar derived preference.
5. Crear personalization consent.
6. Retirar consent.
7. Revertir a non-personalized mode.
8. Bloquear sensitive-data personalization.
9. Crear explicit feedback.
10. Crear behavioral signal.
11. Bloquear click=preference assumption.
12. Crear verified outcome signal.
13. Calificar signal quality.
14. Crear feedback aggregation.
15. Probar governed learning loop.
16. Crear Dataset Record.
17. Verificar dataset lineage.
18. Crear label definition.
19. Detectar label leakage.
20. Detectar selection bias.
21. Ejecutar offline evaluation.
22. Calcular ranking metrics.
23. Crear quality scorecard.
24. Comparar baseline.
25. Aplicar evaluation threshold.
26. Probar Release Gate.
27. Crear Experiment.
28. Aprobar Experiment.
29. Bloquear excluded high-risk case.
30. Asignar reproducible variant.
31. Activar guardrail.
32. Early-stop experiment.
33. Crear Experiment Exposure.
34. Analizar experiment.
35. Crear Fairness Evaluation.
36. Bloquear protected attribute as commercial signal.
37. Crear proxy-risk finding.
38. Crear fairness disparity signal.
39. Confirmar no legal conclusion automatic.
40. Detectar feature drift.
41. Detectar outcome drift.
42. Crear drift severity.
43. Ejecutar drift response.
44. Rollback policy.
45. Ejecutar QA review.
46. Versionar QA suite.
47. Crear Golden Case.
48. Ejecutar regression test.
49. Ejecutar shadow evaluation.
50. Crear Human Review case.
51. Aplicar approve-with-warning.
52. Aplicar block recommendation.
53. Probar reviewer independence.
54. Crear Policy Change Proposal.
55. Bloquear auto-production mutation.
56. Crear quality-regression finding.
57. Crear override-spike finding.
58. Probar permissions/APIs/events.
59. Probar workflows.
60. Probar immutable audit.

## 5505. Criterios de Aceptación e Instrucciones para Codex

### Criterios de aceptación

La Parte 3 estará completa cuando:

1. Exista Personalization Profile.
2. Existan profile statuses.
3. Explicit/derived/default estén separados.
4. Derived preferences tengan confidence/expiry.
5. Exista Personalization Consent.
6. Consent withdrawal desactive future personalization.
7. Existan sensitive-data exclusions.
8. Exista Feedback Taxonomy.
9. Exista Feedback Record.
10. Explicit feedback tenga prioridad.
11. Existan Behavioral Signals.
12. Behavior no se trate como preference truth.
13. Existan Outcome Signals.
14. Exista Feedback Signal Quality.
15. Exista Feedback Aggregation.
16. Exista Learning Loop Boundary.
17. Exista Dataset Record.
18. Exista Dataset Lineage.
19. Exista Label Definition.
20. Exista Label Leakage Control.
21. Exista Selection Bias Control.
22. Exista Offline Evaluation.
23. Existan ranking metrics.
24. Exista Business Outcome boundary.
25. Exista Quality Scorecard.
26. Exista baseline comparison.
27. Exista Evaluation Threshold Registry.
28. Exista Release Gate.
29. Exista Experiment Registry.
30. Existan experiment statuses.
31. Exista Experiment Eligibility.
32. Exista Randomization Unit.
33. Existan Experiment Guardrails.
34. Exista Early Stop Rule.
35. Exista Exposure Record.
36. Exista Experiment Analysis.
37. Exista Fairness Principle.
38. Protected attributes estén limitados.
39. Exista Proxy Feature Review.
40. Exista Fairness Evaluation Record.
41. Existan Fairness Findings.
42. Fairness metric no sea legal conclusion automática.
43. Exista Drift Monitoring.
44. Exista Drift Metric Record.
45. Exista Drift Severity.
46. Exista Drift Response.
47. Exista Rollback.
48. Exista QA Review.
49. Exista QA Test Suite Version.
50. Existan Golden Recommendation Cases.
51. Exista Regression Testing.
52. Exista Shadow Evaluation.
53. Exista Human Review Queue.
54. Exista Human Review Record.
55. Existan review decisions.
56. Exista reviewer independence cuando aplique.
57. Feedback no modifique production policy automáticamente.
58. Exista Policy Change Proposal.
59. Existan Recommendation Quality Findings.
60. Existan permisos/APIs/events/workflows.
61. Parte 3 termine lista para Governance/Security/AI/Analytics de Parte 4.

### Instrucciones para Codex

1. Lee Partes 1–2 completas.
2. Implementa explicit/derived/default preference precedence.
3. Expira derived preferences.
4. Implementa personalization consent/withdrawal.
5. Bloquea sensitive unrelated personalization.
6. Implementa Feedback taxonomy/records.
7. No interpretes clicks como satisfaction truth.
8. Preserve outcome verification.
9. Implementa governed learning datasets.
10. Conserva dataset lineage.
11. Implementa leakage/bias checks.
12. Implementa offline evaluation.
13. Implementa scorecards/baselines/thresholds.
14. Implementa Release Gate.
15. Implementa Experiment Registry.
16. Implementa reproducible assignment.
17. Implementa guardrails/early stop.
18. Implementa fairness review.
19. No uses protected traits como commercial optimization.
20. Implementa proxy-feature review.
21. Implementa drift monitoring.
22. Implementa rollback.
23. Implementa QA suites/golden cases/regression.
24. Implementa shadow mode.
25. Implementa Human Review.
26. Implementa reviewer independence when policy requires it.
27. Implementa Policy Change Proposal.
28. Nunca auto-mutates production policy from feedback.
29. Implementa Findings.
30. Implementa permissions/APIs/events/workflows.
31. Implementa immutable audit.
32. No marques Parte 3 completa si experiment deployment puede saltarse release gates o si personalization continúa después de consent withdrawal.

### Verificación final de Parte 3

- ¿Explicit preferences superan derived/default?
- ¿Consent withdrawal detiene personalization futura?
- ¿Sensitive data queda fuera de unrelated personalization?
- ¿Behavioral signals no se convierten en truth automáticamente?
- ¿Datasets tienen lineage y label definitions?
- ¿Leakage/selection bias tienen controles?
- ¿Nueva policy requiere evaluation/release gate?
- ¿Experiments tienen guardrails y early stop?
- ¿Fairness review evita protected-trait commercial optimization?
- ¿Drift puede causar rollback?
- ¿QA incluye golden/regression/shadow testing?
- ¿Human review existe para high-risk/low-confidence cases?
- ¿Feedback nunca muta production policy directamente?
- ¿Toda acción material queda auditada?

---

# Parte 4 — AI Integration, Governance, Security, Administration, Analytics, Migration, Continuity, E2E y Cierre

**Versión:** 1.0.0  
**Estado:** Especificación completa de Parte 4  
**Proyecto:** SG Solutions Platform  
**Continuación de:** Módulo 38 — Parte 3  
**Secciones incluidas:** 5506–5570  
**Audiencia:** Owner, Codex, product managers, ML/data engineers, compliance, security, administrators, analysts, marketplace operators, QA y support  
**Idioma del código:** Inglés  
**Idioma de la interfaz:** Español e inglés  
**Modelo operativo:** Recommendation Engine gobernado, explicable y reproducible, con AI limitada a asistencia grounded, políticas versionadas, seguridad por mínimo privilegio, analytics controlados, rollback, continuidad y trazabilidad completa

## 5506. Objetivo de Parte 4

Esta parte cierra el Módulo 38 definiendo:

- AI integration;
- model/policy governance;
- prompt/tool boundaries;
- security;
- access controls;
- privileged operations;
- administration;
- observability;
- analytics;
- lineage;
- migration;
- portability;
- business continuity;
- disaster recovery;
- E2E;
- aceptación final.

## 5507. AI Integration Principle

La AI deberá operar como:

```text
grounded assistant
+
explanation helper
+
analysis helper
```

No como:

```text
unbounded autonomous recommender
```

La recommendation final deberá permanecer gobernada por policy, candidate set y auditable scoring logic.

## 5508. AI versus Deterministic Engine Boundary

Separar:

```text
deterministic / policy engine
→ candidate gates
→ scoring
→ ranking
→ constraints
→ risk rules
```

de:

```text
AI
→ summarize
→ explain
→ draft
→ classify text
→ suggest questions
→ synthesize tradeoffs
```

AI no deberá sobrescribir deterministic outputs sin authorized workflow.

## 5509. AI Use Cases

Permitidos:

```text
recommendation_explanation
comparison_summary
tradeoff_summary
unknowns_summary
client_question_drafting
specialist_review_assistance
feedback_summary
quality_finding_summary
policy_change_proposal_draft
```

## 5510. AI Grounding Requirements

Toda AI response material deberá usar:

```text
RecommendationRun snapshot
CandidateSet snapshot
Feature snapshots
Policy version
Source references
Warnings
Disclosures
Client preferences
```

No deberá basarse solo en model memory para terms financieros cambiantes.

## 5511. AI Context Builder

Campos:

```text
recommendationRunId
allowedSources
allowedFields
maskedFields
clientPurpose
locale
maxContextVersion
createdAt
```

## 5512. AI Data Minimization

El context builder deberá excluir por default:

- full SSN/tax identifiers;
- full account numbers;
- raw credit reports;
- unrelated tax-return fields;
- unrelated bank transactions;
- unrelated partner contract economics;
- secrets/credentials.

## 5513. AI Tool Boundary

AI podrá acceder únicamente a approved tools/functions.

No deberá:

```text
execute arbitrary SQL
read unrestricted DB tables
access secrets
call external providers directly
submit applications/referrals
change recommendation policy
```

## 5514. AI Prompt Registry

Campos:

```text
promptCode
promptVersion
purpose
allowedInputs
outputSchema
prohibitedContent
effectiveFrom
effectiveTo
status
```

## 5515. AI Prompt Status

```text
draft
testing
approved
active
paused
deprecated
retired
```

## 5516. AI Structured Output Contract

Ejemplo:

```text
summary
topFactors
tradeoffs
unknowns
warnings
sourceReferences
confidence
needsHumanReview
```

Outputs materialmente usados por UI deberán validarse contra schema.

## 5517. AI Hallucination Control

Si AI menciona:

- rate;
- fee;
- eligibility criterion;
- product term;
- provider;
- program rule;
- approval;
- availability;

deberá existir source verificable.

Sin source:

```text
unknown
```

## 5518. AI Unsupported Claim Finding

Tipos:

```text
hallucinated_term
unsupported_rate
unsupported_fee
unsupported_eligibility
unsupported_provider_fact
approval_like_language
missing_source
disclosure_omission
```

## 5519. AI Explanation Fidelity Check

AI explanation deberá compararse con:

```text
actual score factors
actual constraints
actual risk flags
actual policy
```

Si contradice el engine:

```text
block client-facing output
```

## 5520. AI Confidence Boundary

AI-generated confidence no deberá sustituir:

```text
Recommendation Confidence
```

del engine.

Debe distinguirse:

```text
language_generation_confidence
vs
recommendation_confidence
```

## 5521. AI Human Review Triggers

Review obligatorio cuando:

```text
low recommendation confidence
high-cost candidate
manual-review eligibility
conflicting sources
fairness finding
AI unsupported claim
specialist override
complex multi-domain case
```

## 5522. AI Logging Boundary

Logs podrán registrar:

```text
promptVersion
inputReferenceIds
outputHash
modelVersion
latency
safetyFlags
```

No deberán guardar sensitive raw prompts indiscriminadamente.

## 5523. Model Registry

Campos:

```text
modelId
modelType
modelVersion
provider
purpose
status
evaluationRecordId
approvedAt
retiredAt
```

## 5524. Model Types

```text
LLM
ranking_model
classification_model
embedding_model
heuristic_policy
hybrid
```

## 5525. Model Status

```text
development
offline_evaluation
shadow
limited_release
production
paused
rolled_back
retired
```

## 5526. Model / Policy Governance

Toda production change deberá conservar:

```text
changeRequest
riskAssessment
evaluation
fairnessReviewIfRequired
approval
deployment
monitoring
rollbackPlan
```

## 5527. Change Approval Matrix

Dependiendo del riesgo:

```text
low_risk → product/engineering
moderate_risk → product + data/ML
high_risk → product + data/ML + compliance
critical → owner/security/compliance as configured
```

## 5528. Production Deployment Record

Campos:

```text
version
environment
deployedAt
deployedBy
approvalIds
rollbackVersion
experimentIdOptional
status
```

## 5529. Shadow / Limited Release

Nueva versión podrá lanzarse como:

```text
shadow
limited_percentage
specific_domain
specific_goal
internal_only
```

antes de full production.

## 5530. Governance Finding

Tipos:

```text
unapproved_model
unapproved_policy
missing_evaluation
missing_fairness_review
missing_rollback_plan
prompt_version_mismatch
production_drift
unauthorized_override
```

## 5531. Security Model

Aplicar:

- MFA;
- RBAC;
- ABAC;
- tenant isolation;
- field-level access;
- purpose-based access;
- least privilege;
- reauthentication;
- immutable audit.

## 5532. Recommendation Data Sensitivity

Clasificaciones:

```text
public_catalog
client_profile
financial_context
credit_context
business_financials
homebuying_context
partner_confidential
model_internal
security_sensitive
```

## 5533. Field-Level Access

Ejemplo:

```text
recommendation analyst
→ aggregated features
→ no full sensitive identifier

specialist
→ case-specific allowed context

security/admin
→ privileged only when justified
```

## 5534. Data Masking

Ejemplos:

```text
Tax ID: ***-**-3920
Account: ******4821
Client ID: pseudonymous analytics ID
```

## 5535. Purpose-Based Access

Cada material read deberá indicar:

```text
recommendation_generation
specialist_review
quality_analysis
experiment_analysis
support
security_investigation
```

## 5536. Privileged Actions

Ejemplos:

- publish policy;
- deploy model;
- override production gate;
- access confidential feature;
- export recommendation dataset;
- change fairness threshold;
- rollback production;
- reveal sensitive case detail.

## 5537. Owner Break-Glass

```text
reauthenticate
→ MFA
→ reason
→ scope
→ expiry
→ warning
→ immutable audit
```

No deberá convertirse en permanent bypass.

## 5538. Security Incident Types

```text
cross_client_access
unauthorized_feature_access
dataset_exfiltration
model_prompt_leak
protected_attribute_misuse
policy_tampering
ranking_manipulation
audit_tampering_attempt
credential_compromise
privilege_misuse
```

## 5539. Security Incident Response

```text
detect
→ contain
→ preserve evidence
→ restrict access
→ assess affected recommendations
→ rollback/disable if needed
→ remediate
→ post-incident review
```

## 5540. Administration Console

Secciones:

```text
Recommendation Overview
Requests
Candidate Sets
Policies
Feature Registry
Objectives
Constraints
Runs
Outputs
Explanations
Suitability
Personalization
Feedback
Datasets
Evaluations
Experiments
Fairness
Drift
QA
Human Review
AI Prompts
Models
Security
Analytics
Configuration
```

## 5541. Recommendation Work Queues

```text
low_confidence_review
high_cost_review
manual_eligibility_review
fairness_review
drift_investigation
AI_claim_review
override_review
experiment_review
dataset_quality_review
policy_change_review
security_review
```

## 5542. Assignment Engine

Podrá considerar:

- domain;
- goal;
- risk level;
- review reason;
- jurisdiction;
- specialist skill;
- compliance requirement;
- workload;
- SLA.

## 5543. SLA Tracking

SLAs:

```text
low_confidence_review_sla
high_cost_review_sla
fairness_review_sla
AI_claim_review_sla
override_review_sla
experiment_review_sla
security_review_sla
```

## 5544. Observability

Métricas técnicas:

```text
recommendation_run_latency
recommendation_run_failure_rate
feature_fetch_failure_rate
policy_resolution_failure_rate
explanation_generation_failure_rate
AI_fidelity_failure_rate
invalidation_lag
experiment_assignment_error_rate
drift_job_failure_rate
```

## 5545. Operational Alerts

Alertas:

- recommendation run failed;
- stale candidate used;
- hard constraint bypass;
- sponsored/commission signal leak;
- AI explanation mismatch;
- unsupported AI claim;
- personalization without consent;
- fairness guardrail breach;
- drift blocking threshold;
- experiment guardrail breach;
- unauthorized policy change.

## 5546. Recommendation Analytics Dashboards

```text
Recommendation Executive Dashboard
Recommendation Quality Dashboard
Goal Performance Dashboard
Coverage Dashboard
Confidence Dashboard
Suitability Dashboard
Explanation Quality Dashboard
Personalization Dashboard
Experiment Dashboard
Fairness Dashboard
Drift Dashboard
Human Review Dashboard
AI Quality Dashboard
```

## 5547. Core Recommendation KPIs

```text
recommendation_requests
completed_recommendations
no_suitable_candidate_rate
manual_review_rate
average_candidates_per_run
average_top_set_size
recommendation_expiration_rate
```

## 5548. Client Decision KPIs

```text
recommended_selection_rate
alternative_selection_rate
need_more_information_rate
defer_rate
decline_all_rate
specialist_request_rate
```

## 5549. Quality KPIs

```text
explanation_fidelity_rate
unknown_visibility_rate
hard_constraint_violation_rate
warning_coverage_rate
stale_candidate_rate
override_rate
client_not_relevant_rate
complaint_linked_rate
```

## 5550. Confidence / Robustness KPIs

```text
high_confidence_share
low_confidence_share
high_sensitivity_share
robust_recommendation_share
manual_review_due_to_uncertainty_rate
```

## 5551. Experiment KPIs

```text
experiment_count
guardrail_breach_rate
early_stop_rate
treatment_win_rate
invalidated_experiment_rate
```

No deberán usarse sin statistical/contextual interpretation.

## 5552. Fairness / Governance KPIs

```text
fairness_review_count
proxy_risk_findings
policy_rollbacks
unapproved_change_attempts
protected_attribute_access_events
manual_override_disparity_flags
```

## 5553. AI Quality KPIs

```text
AI_source_coverage_rate
AI_fidelity_pass_rate
AI_unsupported_claim_rate
AI_human_review_rate
AI_output_rejection_rate
```

## 5554. Metric Governance

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

## 5555. Recommendation Data Lineage

Deberá poder rastrear:

```text
client/context facts
→ feature transforms
→ candidate set
→ policy
→ score
→ ranking
→ explanation
→ client decision
→ feedback/outcome
```

## 5556. Data Quality Checks

Checks:

- missing source version;
- invalid candidate reference;
- duplicate recommendation run;
- stale feature snapshot;
- mismatched policy version;
- score/explanation mismatch;
- missing disclosure;
- orphan feedback;
- missing consent;
- experiment assignment inconsistency.

## 5557. Data Quality Finding

Campos:

```text
id
findingType
severity
resourceId
sourceReferences
blocking
status
createdAt
resolvedAt
```

## 5558. Recommendation Export / Portability

Client-safe export podrá incluir:

- goal;
- recommendation summary;
- alternatives;
- tradeoffs;
- warnings;
- known assumptions;
- source dates;
- client decision.

No deberá incluir proprietary internal model secrets innecesarios.

## 5559. Internal Audit Export

Authorized export podrá incluir:

```text
contextSnapshot
candidateSet
featureSnapshot
policyVersion
scores
ranking
explanation
overrides
consents
auditEvents
```

## 5560. Migration In

Pipeline:

```text
import policy/model metadata
→ map feature registry
→ validate source versions
→ import historical runs
→ preserve immutable IDs
→ mark unverifiable history
→ create migration snapshot
```

## 5561. Migration Record

Campos:

```text
id
sourceSystem
cutoffDate
importedPolicies
importedModels
importedRuns
importedFeedback
importedExperiments
verificationStatus
unresolvedIssues
createdAt
completedAt
```

## 5562. Migration Out

Export deberá preservar:

```text
policy versions
feature versions
candidate references
run snapshots
recommendation outputs
feedback
evaluation references
experiment references
fairness/drift findings
audit references
```

según access/retention.

## 5563. Business Continuity

Ante outage:

```text
preserve last known good policy
→ stop unsafe new runs if dependencies unavailable
→ serve cached historical recommendation only with freshness warning when allowed
→ queue low-risk work
→ restore dependencies
→ reconcile
```

## 5564. Disaster Recovery Priority

Prioridad:

1. policy/config integrity;
2. active recommendation requests;
3. invalidation events;
4. consent/personalization state;
5. high-risk human reviews;
6. experiment state;
7. analytics.

## 5565. Recovery Safety

Después de recovery:

```text
verify policy hashes
verify feature registry versions
verify model versions
verify candidate source availability
verify audit continuity
```

antes de resume full production.

## 5566. End-to-End Scenario 1 — Business Funding Recommendation

```text
M37 candidates
→ M38 request
→ context snapshot
→ constraints
→ scoring
→ tradeoffs
→ recommendation
→ explanation
→ client selects alternative
→ M37 journey
```

Client choice deberá preservarse.

## 5567. End-to-End Scenario 2 — Homebuying Recommendation

```text
homebuying program candidates
→ objective: minimize cash to close
→ DPA/repayment tradeoffs
→ top options
→ warnings
→ client asks what-if
→ new run
→ decision
```

## 5568. End-to-End Scenario 3 — High-Cost / Low-Confidence / Fairness

```text
high-cost candidate
→ warning
→ low confidence
→ human review
→ fairness signal
→ review
→ recommendation blocked or approved-with-warning
```

## 5569. End-to-End Scenario 4 — Drift / AI / Rollback / Recovery

```text
new policy deployment
→ shadow/limited release
→ drift detected
→ AI explanation mismatch
→ guardrail breach
→ rollback
→ historical runs preserved
→ recovery verification
```

## 5570. Criterios Finales de Aceptación, Instrucciones para Codex y Cierre

### Criterios finales del Módulo 38

El Módulo 38 estará completo cuando:

1. Exista Recommendation Request.
2. Exista Goal Registry.
3. Exista immutable Context Snapshot.
4. Exista Candidate Set.
5. Candidate Set sea immutable.
6. Exista Candidate Eligibility Gate.
7. M38 no duplique eligibility.
8. Exista Feature Registry.
9. Cada feature tenga source/version.
10. Unknown y zero estén separados.
11. Exista Objective Profile.
12. Exista Preference Profile.
13. Explicit preference tenga prioridad.
14. Exista Preference Conflict.
15. Existan Hard/Soft Constraints.
16. Unknown hard constraint no pase silenciosamente.
17. Exista Recommendation Policy.
18. Policy sea versionada.
19. Exista Scoring Model.
20. Score no sea approval probability.
21. Exista Risk Signal Registry.
22. Sponsored signal esté separado.
23. Commission signal esté separado.
24. Exista deterministic run.
25. Historical run sea reproducible.
26. Exista Recommendation Output.
27. Exista Ranked Candidate.
28. Exista No Forced Winner.
29. Exista multi-objective tradeoff.
30. Exista Pareto context.
31. Exista Recommendation Explanation.
32. Explanation sea fiel al score.
33. Unknowns sean visibles.
34. Exista Recommendation Confidence.
35. Confidence no sea approval probability.
36. Existan Warnings.
37. Exista Suitability Assessment.
38. High-cost products tengan controls.
39. Existan Alternative Recommendations.
40. Exista Why Not This.
41. Exista What-If.
42. What-if preserve original run.
43. Exista Sensitivity/Robustness.
44. Exista Invalidation.
45. Exista Client Decision Workspace.
46. Client choice esté preservado.
47. Exista Specialist Review.
48. Override preserve original ranking.
49. Override no cambie source truth/eligibility.
50. Exista Personalization Profile.
51. Exista Personalization Consent.
52. Consent withdrawal detenga future personalization.
53. Sensitive data tenga exclusions.
54. Exista Feedback taxonomy.
55. Behavioral signals no sean truth automática.
56. Exista governed learning loop.
57. Exista Dataset Lineage.
58. Exista label leakage control.
59. Exista selection bias control.
60. Exista Offline Evaluation.
61. Exista Release Gate.
62. Exista Experiment Registry.
63. Existan guardrails/early stop.
64. Exista Fairness Review.
65. Protected traits no sean commercial optimization features.
66. Exista Proxy Feature Review.
67. Exista Drift Monitoring.
68. Exista Rollback.
69. Exista QA Suite.
70. Existan Golden Cases.
71. Exista Shadow Evaluation.
72. Exista Human Review.
73. Feedback no mute production policy directamente.
74. Exista AI Integration.
75. AI esté grounded.
76. AI tenga context minimization.
77. AI use approved tools.
78. Exista Prompt Registry.
79. AI output siga schema.
80. AI unsupported claims se detecten.
81. AI explanation fidelity se valide.
82. AI confidence esté separado de recommendation confidence.
83. Exista Model Registry.
84. Exista Model/Policy Governance.
85. Exista Change Approval Matrix.
86. Exista Deployment Record.
87. Exista Shadow/Limited Release.
88. Existan Governance Findings.
89. Exista MFA/RBAC/ABAC.
90. Exista purpose-based access.
91. Exista field-level masking.
92. Exista Break-Glass.
93. Exista Security Incident Workflow.
94. Exista Admin Console.
95. Existan Work Queues.
96. Exista SLA Tracking.
97. Exista Observability.
98. Existan Operational Alerts.
99. Existan Recommendation Dashboards.
100. Exista Metric Governance.
101. Exista Recommendation Data Lineage.
102. Existan Data Quality Checks.
103. Exista Client-safe Export.
104. Exista Internal Audit Export.
105. Exista Migration In/Out.
106. Exista Business Continuity.
107. Exista Disaster Recovery.
108. Recovery verifique policy/model integrity.
109. Existan E2E scenarios.
110. Toda recommendation sea source-backed.
111. Toda policy/model production version esté aprobada.
112. Toda personalized recommendation tenga valid consent.
113. Toda human override tenga reason.
114. Toda AI material claim tenga source.
115. Toda sensitive access quede auditada.
116. Toda experiment treatment sea reproducible.
117. Ningún loop auto-modifique production policy.
118. Ninguna compensation contamine organic recommendation.
119. Ningún score se presente como approval chance.
120. La UI sea bilingüe.
121. Code identifiers estén en inglés.
122. Las cuatro partes estén integradas.
123. El módulo sea implementable por Codex.
124. Recommendation → decision → M37 handoff sea trazable.
125. El módulo opere end-to-end con governance y audit.

### Instrucciones finales para Codex

1. Lee las cuatro partes completas.
2. Lee M37 completo.
3. No dupliques eligibility logic.
4. Mantén immutable ContextSnapshot/CandidateSet.
5. Implementa Feature Registry versionado.
6. Mantén source/freshness por feature.
7. Mantén unknown separado de zero.
8. Implementa Objective/Preference/Constraint architecture.
9. Implementa versioned RecommendationPolicy.
10. Implementa deterministic/reproducible scoring.
11. Nunca llames score approval probability.
12. Separa sponsored/commission signals.
13. Implementa multi-objective tradeoffs.
14. Implementa Explanation Fidelity.
15. Implementa Confidence correctamente.
16. Implementa Suitability/Warnings.
17. Implementa alternatives/what-if/sensitivity.
18. Preserve Client Choice.
19. Implementa Specialist Review/Overrides.
20. Implementa Personalization Consent.
21. Stop personalization after consent withdrawal.
22. Implementa Feedback/Learning Dataset governance.
23. Implementa leakage/bias controls.
24. Implementa Offline Evaluation/Release Gate.
25. Implementa Experiments con guardrails.
26. Implementa Fairness/Proxy review.
27. Implementa Drift/Rollback.
28. Implementa QA/Golden/Shadow.
29. Implementa Human Review.
30. Implementa AI como grounded assistant.
31. No permitas AI direct DB/SQL/external actions.
32. Implementa Prompt/Model Registry.
33. Validate AI output schemas.
34. Detecta unsupported AI claims.
35. Implementa model/policy deployment governance.
36. Implementa MFA/RBAC/ABAC.
37. Implementa purpose-based access/masking.
38. Implementa Break-Glass.
39. Implementa immutable Audit.
40. Implementa Admin/Queues/SLA.
41. Implementa Observability/Alerts.
42. Implementa Analytics/Metric Governance.
43. Implementa Data Quality/Lineage.
44. Implementa Migration/Portability.
45. Implementa Continuity/Recovery.
46. Ejecuta E2E tests.
47. No marques módulo listo si AI puede cambiar ranking/eligibility directamente.
48. No marques módulo listo si feedback puede auto-mutates production.
49. No marques módulo listo si policy/model deployment puede saltarse evaluation/approval.
50. No marques módulo listo si commercial compensation puede contaminar organic recommendation.

### Verificación final para entrega

- ¿Eligibility y recommendation siguen separados?
- ¿Runs históricos son reproducibles?
- ¿Explanations reflejan el scoring real?
- ¿Unknowns permanecen visibles?
- ¿Confidence no se interpreta como approval chance?
- ¿Sponsored/commission signals están separados?
- ¿Personalization es consent-aware?
- ¿Feedback loops requieren evaluation/approval?
- ¿Experiments tienen guardrails?
- ¿Fairness/proxy review existe?
- ¿Drift puede provocar rollback?
- ¿AI está grounded y limitada?
- ¿Model/policy changes están gobernados?
- ¿Security protege features/datasets/client data?
- ¿Analytics tienen metric definitions?
- ¿Recovery verifica policy/model integrity?
- ¿Los E2E scenarios pasan?

# Estado Final del Módulo 38

```text
MÓDULO 38:
RECOMMENDATION ENGINE

PARTES:
1. Requests, Context, Candidates, Objectives, Preferences, Constraints, Scoring y Policy
2. Ranking, Tradeoffs, Explanations, Confidence, Alternatives, Suitability y Decision Support
3. Personalization, Feedback, Learning, Evaluation, Experiments, Fairness, Drift y QA
4. AI, Governance, Security, Admin, Analytics, Migration, Continuity y Cierre

SECCIONES:
5311–5570

ESTADO:
MODULE COMPLETE
```

