## MÓDULO 31 — BOOKKEEPING Y CONTABILIDAD  
## Parte 1 — Fundamentos, Libros, Chart of Accounts, Periodos y Configuración Contable  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 30 **Secciones incluidas:** 3166–3230 **Audiencia:** Owner, Codex, bookkeepers, tax preparers, reviewers, administradores, clientes empresariales y Data Analysts **Idioma del código:** Inglés **Idioma de la interfaz:** Español e inglés **Modelo operativo:** Bookkeeping inicialmente limitado, basado en doble partida, trazabilidad completa y preparado para futuras integraciones con software contable externo  
   
⸻  
   
## 3166. Estructura del Módulo 31  
El Módulo 31 tendrá cuatro partes.  
## Parte 1  
Fundamentos, libros, Chart of Accounts, periodos y configuración.  
## Parte 2  
Transacciones, ingresos, gastos, categorización, reglas y reconciliación.  
## Parte 3  
Cierres, ajustes, reportes financieros, preparación fiscal y controles.  
## Parte 4  
Integraciones contables, automatización, administración, seguridad, analytics y cierre.  
   
⸻  
   
## 3167. Objetivo  
El módulo permitirá a SG Solutions ofrecer inicialmente servicios de bookkeeping para pequeños negocios sin intentar reemplazar desde el primer día una plataforma contable empresarial completa.  
Deberá soportar:  
* ingresos;  
* gastos;  
* cuentas;  
* categorización;  
* reconciliación;  
* journal entries;  
* reportes;  
* periodos;  
* cierres;  
* preparación tributaria;  
* exportación;  
* integraciones futuras.  
   
⸻  
   
## 3168. Principio central  
```
Source evidence
→ transaction
→ classification
→ accounting entry
→ reconciliation
→ review
→ reporting
→ tax preparation

```
Nunca:  
```
Bank transaction
→ guessed category
→ final books without review

```
   
⸻  
   
## 3169. Alcance inicial  
La primera versión estará orientada a:  
* sole proprietors;  
* single-member LLCs;  
* pequeñas LLCs;  
* pequeños negocios;  
* contractors;  
* gig workers;  
* service businesses;  
* otros perfiles simples soportados.  
   
⸻  
   
## 3170. Alcance futuro  
La arquitectura deberá permitir posteriormente:  
* accrual accounting más avanzado;  
* accounts receivable;  
* accounts payable;  
* inventory;  
* payroll journals;  
* fixed assets;  
* multi-entity accounting;  
* departments;  
* classes;  
* projects;  
* consolidation;  
* accounting-software synchronization.  
   
⸻  
   
## 3171. No reemplazo prematuro  
SG Solutions Platform no deberá intentar replicar inicialmente todas las funciones de:  
* QuickBooks;  
* Xero;  
* NetSuite;  
* Sage;  
* otros ERPs.  
El objetivo inicial es administrar el workflow de bookkeeping y producir datos contables limpios y trazables.  
   
⸻  
   
## 3172. Reutilización obligatoria  
El módulo deberá reutilizar:  
* Clients;  
* Organizations;  
* Service Catalog;  
* Service Orders;  
* Case Files;  
* Documents;  
* Tasks;  
* Approvals;  
* Billing;  
* Banking Integrations cuando existan;  
* AI Hub;  
* Tax Cases;  
* Audit;  
* Analytics.  
   
⸻  
   
## 3173. Bookkeeping Service Catalog  
Tipos iniciales:  
```
monthly_bookkeeping
quarterly_bookkeeping
annual_cleanup
catch_up_bookkeeping
bookkeeping_cleanup
tax_ready_books
transaction_categorization
bank_reconciliation
financial_reporting
custom_bookkeeping_service

```
   
⸻  
   
## 3174. Servicio mensual  
Podrá incluir:  
* transaction intake;  
* categorization;  
* reconciliations;  
* bookkeeping questions;  
* monthly close;  
* basic reports.  
El alcance exacto deberá configurarse por producto.  
   
⸻  
   
## 3175. Catch-Up Bookkeeping  
Deberá permitir trabajar varios periodos atrasados.  
Campos importantes:  
* start period;  
* end period;  
* estimated transaction volume;  
* accounts involved;  
* missing statements;  
* prior books availability;  
* tax deadlines.  
   
⸻  
   
## 3176. Cleanup Bookkeeping  
Se utilizará cuando existan libros anteriores pero contengan:  
* duplicates;  
* uncategorized transactions;  
* unreconciled accounts;  
* incorrect balances;  
* mixed personal/business transactions;  
* opening-balance issues;  
* inconsistencies.  
   
⸻  
   
## 3177. Tax-Ready Books  
El servicio deberá producir un expediente preparado para el Módulo 30.  
No significa que la declaración tributaria esté automáticamente preparada.  
   
⸻  
   
## 3178. Bookkeeping Engagement  
Deberá extender el Engagement existente.  
Campos específicos:  
```
bookkeepingFrequency
accountingBasis
bookStartDate
fiscalYearEnd
includedAccounts
includedEntities
monthlyTransactionAllowance
reportingFrequency
closePolicyId
taxIntegrationEnabled
externalAccountingSystem

```
   
⸻  
   
## 3179. Bookkeeping Case  
Cada engagement podrá generar un Bookkeeping Case operativo.  
Campos:  
```
id
caseNumber
engagementId
organizationId
serviceOrderId
accountingBookId
assignedBookkeeperId
assignedReviewerId
currentPeriodId
status
createdAt
updatedAt
closedAt

```
   
⸻  
   
## 3180. Bookkeeping Case Status  
```
draft
setup_pending
opening_balances_pending
active
period_processing
questions_pending
review_pending
client_action_required
paused
completed
cancelled
archived

```
   
⸻  
   
## 3181. Accounting Entity  
La unidad contable deberá corresponder a una entidad o actividad identificable.  
Campos:  
```
id
organizationId
legalEntityType
displayName
taxIdentifierToken
defaultCurrency
country
baseJurisdiction
fiscalYearEnd
status

```
   
⸻  
   
## 3182. Separación de entidades  
Los libros de diferentes entidades no deberán mezclarse.  
Ejemplo:  
```
SG Transport LLC
≠
Personal activity
≠
SG Solutions LLC

```
Cada entidad deberá tener sus propios libros.  
   
⸻  
   
## 3183. Business versus Personal  
El sistema deberá poder identificar:  
```
business
personal
mixed
unknown

```
Una transacción personal dentro de una cuenta empresarial deberá categorizarse apropiadamente y no tratarse automáticamente como gasto deducible.  
   
⸻  
   
## 3184. Accounting Book  
El Accounting Book será el contenedor contable principal.  
Campos:  
```
id
accountingEntityId
bookName
bookType
accountingBasis
baseCurrency
fiscalYearEnd
chartOfAccountsVersionId
status
openedAt
closedAt
createdAt

```
   
⸻  
   
## 3185. Book Types  
```
primary
tax_basis
management
cleanup
historical_import
external_mirror

```
Inicialmente se utilizará principalmente primary.  
   
⸻  
   
## 3186. Book Status  
```
setup
active
temporarily_locked
closed
archived
migration_only

```
   
⸻  
   
## 3187. Double-Entry Foundation  
Aunque la interfaz sea sencilla, el modelo contable interno deberá estar preparado para doble partida.  
Cada posted accounting transaction deberá mantener:  
```
total_debits = total_credits

```
   
⸻  
   
## 3188. Journal Entry  
Campos conceptuales:  
```
id
accountingBookId
journalNumber
entryDate
postingPeriodId
description
sourceType
sourceReferenceId
status
preparedBy
reviewedBy
postedAt
createdAt

```
   
⸻  
   
## 3189. Journal Entry Line  
Campos:  
```
id
journalEntryId
accountId
debitAmount
creditAmount
memo
clientOrVendorReference
classReference
taxMappingCode
sourceEvidenceReference

```
   
⸻  
   
## 3190. Journal Status  
```
draft
proposed
review_required
approved
posted
reversed
voided
superseded

```
   
⸻  
   
## 3191. Posted Entry Immutability  
Un asiento posted no deberá modificarse destructivamente.  
La corrección deberá realizarse mediante:  
* reversal;  
* adjusting entry;  
* superseding workflow.  
   
⸻  
   
## 3192. Chart of Accounts  
Cada libro deberá tener un Chart of Accounts estructurado.  
Categorías principales:  
```
asset
liability
equity
income
expense
other_income
other_expense

```
   
⸻  
   
## 3193. Account Record  
Campos:  
```
id
accountingBookId
accountNumber
accountName
accountType
accountSubtype
parentAccountId
normalBalance
currency
taxMappingCode
isReconciliationAccount
isSystemAccount
status
createdAt
updatedAt

```
   
⸻  
   
## 3194. Account Status  
```
draft
active
inactive
archived
blocked

```
Una cuenta con historial no deberá eliminarse destructivamente.  
   
⸻  
   
## 3195. Account Hierarchy  
Deberán permitirse subcuentas.  
Ejemplo:  
```
Expenses
└── Vehicle
    ├── Fuel
    ├── Repairs
    ├── Insurance
    └── Tolls

```
   
⸻  
   
## 3196. System Accounts  
Ciertas cuentas podrán estar protegidas:  
```
Opening Balance Equity
Uncategorized Income
Uncategorized Expense
Owner Contribution
Owner Draw
Retained Earnings
Suspense

```
Su disponibilidad dependerá del entity type.  
   
⸻  
   
## 3197. Suspense Account  
Cuando no sea posible clasificar una transacción deberá utilizarse un mecanismo temporal.  
Nunca deberá mantenerse permanentemente sin revisión.  
   
⸻  
   
## 3198. Uncategorized Transactions  
El sistema deberá diferenciar entre:  
```
uncategorized
needs_client_input
needs_bookkeeper_review
suspense

```
No todo lo desconocido deberá terminar en la misma cuenta.  
   
⸻  
   
## 3199. Chart Template  
Podrán existir templates para:  
* consulting;  
* trucking;  
* rideshare;  
* construction;  
* retail;  
* online seller;  
* restaurant;  
* professional services;  
* generic small business.  
   
⸻  
   
## 3200. Template Customization  
La plantilla deberá poder adaptarse sin perder:  
* base template;  
* added accounts;  
* disabled accounts;  
* mappings;  
* version history.  
   
⸻  
   
## 3201. Chart Versioning  
Campos:  
```
id
accountingBookId
versionNumber
basedOnVersionId
effectiveAt
createdBy
approvedBy
status

```
   
⸻  
   
## 3202. Accounting Basis  
Valores iniciales:  
```
cash
accrual
modified_cash
external_system_defined

```
La disponibilidad deberá depender del servicio y capacidad.  
   
⸻  
   
## 3203. Cash Basis  
En cash basis, el reconocimiento operativo deberá centrarse en cobros y pagos efectivamente registrados, sujeto a las reglas y ajustes aplicables.  
   
⸻  
   
## 3204. Accrual Basis  
La arquitectura deberá soportar accrual, aunque funciones avanzadas de AR/AP puedan llegar en fases posteriores.  
   
⸻  
   
## 3205. Basis Change  
Cambiar accounting basis será una acción material.  
Deberá requerir:  
* reason;  
* effective period;  
* impact assessment;  
* reviewer;  
* approval;  
* versioning.  
   
⸻  
   
## 3206. Base Currency  
Cada Accounting Book tendrá una moneda base.  
Inicialmente:  
```
USD

```
La arquitectura deberá permitir monedas adicionales en el futuro.  
   
⸻  
   
## 3207. Foreign Currency  
Una transacción extranjera futura deberá conservar:  
* original currency;  
* original amount;  
* exchange rate;  
* base-currency amount;  
* rate source;  
* rate date.  
   
⸻  
   
## 3208. Fiscal Year  
Cada Accounting Book deberá definir:  
* fiscal year start;  
* fiscal year end;  
* tax-year relationship;  
* period calendar.  
   
⸻  
   
## 3209. Accounting Period  
Campos:  
```
id
accountingBookId
periodType
periodNumber
startDate
endDate
fiscalYear
status
closeVersion
createdAt

```
   
⸻  
   
## 3210. Period Types  
```
monthly
quarterly
annual
custom

```
La versión inicial deberá priorizar periodos mensuales.  
   
⸻  
   
## 3211. Period Status  
```
future
open
processing
review
soft_closed
closed
reopened

```
   
⸻  
   
## 3212. Soft Close  
Un soft_closed deberá permitir correcciones controladas pero indicar que la revisión principal fue completada.  
   
⸻  
   
## 3213. Hard Close  
Un periodo closed deberá impedir cambios ordinarios.  
Las modificaciones deberán utilizar:  
* reopen approval;  
* adjusting entry;  
* prior-period adjustment workflow.  
   
⸻  
   
## 3214. Reopening Period  
Campos:  
```
periodId
reason
requestedBy
approvedBy
openedAt
expectedRecloseAt
status

```
   
⸻  
   
## 3215. Opening Balance  
Todo libro que comience con actividad previa deberá registrar saldos iniciales.  
Campos:  
```
accountId
effectiveDate
amount
sourceType
sourceDocumentId
verificationStatus
preparedBy
reviewedBy

```
   
⸻  
   
## 3216. Opening Balance Sources  
Podrán provenir de:  
```
prior_accounting_system
prior_financial_statement
bank_statement
tax_return
client_records
manual_reconstruction
unknown

```
   
⸻  
   
## 3217. Opening Balance Verification  
Estados:  
```
unverified
partially_verified
verified
requires_review
rejected

```
   
⸻  
   
## 3218. Historical Import  
Cuando el cliente tenga información previa, deberá distinguirse entre:  
* full historical import;  
* beginning balances only;  
* selected-period import;  
* tax-summary import.  
   
⸻  
   
## 3219. Migration Cutoff Date  
Todo cambio desde un sistema anterior deberá tener:  
```
legacySystem
cutoffDate
firstManagedPeriod
openingBalanceDate
migrationStatus

```
   
⸻  
   
## 3220. Bank and Financial Accounts Registry  
El módulo deberá registrar las cuentas financieras incluidas en el Engagement.  
Tipos:  
```
checking
savings
credit_card
loan
line_of_credit
payment_processor
cash
merchant_account
other

```
   
⸻  
   
## 3221. Financial Account Record  
Campos:  
```
id
accountingBookId
institutionName
displayName
accountType
maskedAccountNumber
ledgerAccountId
connectionType
statementFrequency
reconciliationEnabled
status
createdAt

```
   
⸻  
   
## 3222. Account Ownership  
La plataforma deberá confirmar si la cuenta es:  
```
business_owned
personal_used_for_business
mixed_use
third_party
unknown

```
Esto deberá influir en el workflow de revisión.  
   
⸻  
   
## 3223. Financial Account Connection Type  
```
manual_statement
file_import
bank_feed
accounting_provider_sync
payment_processor_api
manual_entry

```
La Parte 2 definirá la ingestión detallada.  
   
⸻  
   
## 3224. Client Setup Checklist  
El onboarding deberá solicitar:  
* entity information;  
* accounting basis;  
* fiscal year;  
* financial accounts;  
* prior books;  
* bank statements;  
* credit-card statements;  
* opening balances;  
* tax returns relevantes;  
* bookkeeping preferences;  
* reporting frequency.  
   
⸻  
   
## 3225. Bookkeeping Setup Review  
Antes de activar el libro deberá verificarse:  
* entity;  
* book;  
* chart;  
* periods;  
* accounts;  
* balances;  
* scope;  
* ownership;  
* assigned bookkeeper;  
* assigned reviewer.  
   
⸻  
   
## 3226. Setup Status  
```
not_started
client_information_pending
configuration
opening_balance_review
ready_for_review
approved
active
blocked

```
   
⸻  
   
## 3227. Roles y separación de funciones  
Roles conceptuales:  
```
bookkeeping_client
bookkeeper
senior_bookkeeper
bookkeeping_reviewer
accounting_specialist
tax_preparer
bookkeeping_manager
bookkeeping_read_only

```
El cliente no deberá poder post journal entries directamente.  
   
⸻  
   
## 3228. AI dentro de Bookkeeping  
La IA podrá:  
* sugerir chart template;  
* sugerir account mappings;  
* identificar inconsistencias;  
* resumir setup;  
* detectar información faltante;  
* recomendar preguntas.  
No podrá:  
* publicar asientos materiales sin review;  
* modificar periodos cerrados;  
* decidir deducibilidad fiscal final;  
* alterar opening balances confirmados.  
   
⸻  
   
## 3229. Permisos, APIs, eventos y workflows iniciales  
## Permisos conceptuales  
```
bookkeeping.catalog.read
bookkeeping.catalog.manage

bookkeeping.case.read
bookkeeping.case.create
bookkeeping.case.assign
bookkeeping.case.manage

bookkeeping.book.read
bookkeeping.book.create
bookkeeping.book.configure

bookkeeping.chart.read
bookkeeping.chart.manage
bookkeeping.account.manage

bookkeeping.journal.read
bookkeeping.journal.prepare
bookkeeping.journal.review
bookkeeping.journal.post

bookkeeping.period.read
bookkeeping.period.manage
bookkeeping.period.reopen

bookkeeping.opening_balance.manage
bookkeeping.setup.review

```
## APIs conceptuales  
```
GET    /api/bookkeeping/services
POST   /api/bookkeeping/cases

POST   /api/bookkeeping/books
GET    /api/bookkeeping/books/{id}
POST   /api/bookkeeping/books/{id}/setup

GET    /api/bookkeeping/books/{id}/chart
POST   /api/bookkeeping/books/{id}/accounts
POST   /api/bookkeeping/books/{id}/chart-versions

POST   /api/bookkeeping/books/{id}/periods
POST   /api/bookkeeping/periods/{id}/reopen

POST   /api/bookkeeping/books/{id}/opening-balances
POST   /api/bookkeeping/books/{id}/financial-accounts

POST   /api/bookkeeping/cases/{id}/setup-review

```
## Eventos de dominio  
```
BookkeepingCaseCreated
AccountingBookCreated
ChartOfAccountsInitialized
ChartOfAccountsVersionCreated
AccountingPeriodCreated
AccountingPeriodClosed
AccountingPeriodReopened
OpeningBalanceCreated
OpeningBalanceVerified
FinancialAccountAdded
BookkeepingSetupReviewRequested
BookkeepingSetupApproved
BookkeepingBookActivated

```
## Workflows  
```
Bookkeeping Engagement Setup Workflow
Accounting Book Setup Workflow
Chart of Accounts Configuration Workflow
Opening Balance Workflow
Financial Account Setup Workflow
Bookkeeping Setup Review Workflow
Accounting Period Management Workflow

```
   
⸻  
   
## 3230. Pruebas, criterios de aceptación e instrucciones para Codex  
## Pruebas obligatorias  
1. Crear Monthly Bookkeeping Service.  
2. Crear Catch-Up Service.  
3. Crear Cleanup Service.  
4. Crear Bookkeeping Engagement.  
5. Crear Accounting Entity.  
6. Crear Accounting Book.  
7. Bloquear mezcla entre entidades.  
8. Seleccionar cash basis.  
9. Seleccionar accrual basis.  
10. Crear Chart of Accounts.  
11. Crear account.  
12. Crear subaccount.  
13. Proteger system account.  
14. Inactivar una cuenta con historial.  
15. Crear chart template.  
16. Personalizar template.  
17. Crear Chart Version.  
18. Crear Journal Entry draft.  
19. Crear debit y credit equilibrados.  
20. Bloquear asiento desequilibrado.  
21. Postear Journal Entry.  
22. Bloquear edición destructiva.  
23. Crear reversal.  
24. Crear fiscal year.  
25. Crear periodos mensuales.  
26. Soft-close period.  
27. Hard-close period.  
28. Bloquear edición ordinaria.  
29. Reabrir con approval.  
30. Crear Opening Balance.  
31. Vincular source document.  
32. Verificar Opening Balance.  
33. Crear historical import.  
34. Definir migration cutoff.  
35. Crear checking account.  
36. Crear credit-card account.  
37. Crear payment-processor account.  
38. Mapear financial account a ledger.  
39. Definir ownership.  
40. Definir connection type.  
41. Completar Setup Checklist.  
42. Bloquear activación incompleta.  
43. Aprobar setup.  
44. Activar Accounting Book.  
45. Probar bookkeeper role.  
46. Probar reviewer role.  
47. Bloquear client posting.  
48. Probar AI suggestions.  
49. Probar immutable audit.  
50. Probar español e inglés.  
## Criterios de aceptación  
La Parte 1 estará completa cuando:  
1. El Módulo 31 esté limitado a cuatro partes.  
2. Exista Bookkeeping Service Catalog.  
3. Exista Bookkeeping Engagement.  
4. Exista Bookkeeping Case.  
5. Exista Accounting Entity.  
6. Se separen entidades.  
7. Exista business/personal classification.  
8. Exista Accounting Book.  
9. Exista double-entry foundation.  
10. Existan Journal Entries.  
11. Existan Journal Lines.  
12. Se cumpla debit = credit.  
13. Los posted entries sean inmutables.  
14. Exista Chart of Accounts.  
15. Existan account hierarchies.  
16. Existan system accounts.  
17. Exista Suspense handling.  
18. Existan Chart Templates.  
19. Exista Chart Versioning.  
20. Exista Accounting Basis.  
21. Exista control para basis changes.  
22. Exista Base Currency.  
23. Exista arquitectura futura multi-currency.  
24. Exista Fiscal Year.  
25. Existan Accounting Periods.  
26. Exista Soft Close.  
27. Exista Hard Close.  
28. Exista controlled reopening.  
29. Existan Opening Balances.  
30. Existan Opening Balance Sources.  
31. Exista Opening Balance Verification.  
32. Exista Historical Import.  
33. Exista Migration Cutoff.  
34. Exista Financial Account Registry.  
35. Exista ownership classification.  
36. Existan connection types.  
37. Exista Setup Checklist.  
38. Exista Setup Review.  
39. Existan roles.  
40. Toda configuración sea trazable.  
## Instrucciones para Codex  
Antes de implementar:  
1. Lee los módulos relacionados.  
2. Reutiliza Organizations.  
3. Reutiliza Service Orders.  
4. Reutiliza Documents.  
5. Reutiliza Tasks.  
6. Reutiliza Approvals.  
7. Reutiliza Audit.  
8. No construyas un ERP completo.  
9. Implementa Bookkeeping Services.  
10. Implementa Bookkeeping Engagement.  
11. Implementa Bookkeeping Case.  
12. Implementa Accounting Entity.  
13. Impide mezclar entidades.  
14. Implementa Accounting Book.  
15. Implementa double-entry foundation.  
16. Implementa Journal Entries.  
17. Implementa Journal Lines.  
18. Bloquea entries desbalanceados.  
19. Implementa immutable posting.  
20. Implementa reversals.  
21. Implementa Chart of Accounts.  
22. Implementa Account Hierarchy.  
23. Implementa protected System Accounts.  
24. Implementa Suspense.  
25. Implementa templates.  
26. Implementa Chart Versioning.  
27. Implementa Accounting Basis.  
28. Controla basis changes.  
29. Implementa Base Currency.  
30. Prepara estructura multi-currency.  
31. Implementa Fiscal Years.  
32. Implementa Accounting Periods.  
33. Implementa Soft Close.  
34. Implementa Hard Close.  
35. Implementa Reopening Approval.  
36. Implementa Opening Balances.  
37. Implementa source references.  
38. Implementa verification.  
39. Implementa historical imports.  
40. Implementa migration cutoff.  
41. Implementa Financial Accounts.  
42. Implementa ownership.  
43. Implementa connection types.  
44. Implementa Setup Checklist.  
45. Implementa Setup Review.  
46. Implementa roles.  
47. Limita IA a sugerencias.  
48. Implementa permissions.  
49. Implementa APIs.  
50. Implementa events.  
51. Implementa workflows.  
52. Implementa immutable audit.  
53. No permitas posting directo por clientes.  
54. No permitas borrar cuentas con historial.  
55. No permitas modificar posted entries.  
56. No permitas mezclar libros de entidades.  
57. No permitas activar libros sin setup review.  
58. No marques esta parte como lista sin probar desde creación del libro hasta activación.  
Antes de entregar, verifica:  
* ¿Cada entidad mantiene su propio libro?  
* ¿Cada asiento está balanceado?  
* ¿Los posted entries son inmutables?  
* ¿El Chart of Accounts está versionado?  
* ¿Los periodos cerrados están protegidos?  
* ¿Los saldos iniciales conservan evidencia?  
* ¿Cada cuenta financiera indica ownership?  
* ¿Existe migration cutoff?  
* ¿La IA solo propone y no contabiliza materialmente sin review?  
* ¿El libro solo se activa después del Setup Review?  
* ¿Toda configuración queda auditada?  
  
  
  
## MÓDULO 31 — BOOKKEEPING Y CONTABILIDAD  
## Parte 2 — Transacciones, Bank Feeds, Ingresos, Gastos, Categorización, Transferencias y Reconciliación  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 31 — Parte 1 **Secciones incluidas:** 3231–3295 **Audiencia:** Owner, Codex, bookkeepers, reviewers, clientes empresariales, tax preparers y administradores **Idioma del código:** Inglés **Idioma de la interfaz:** Español e inglés **Modelo operativo:** Ingestión multifuente, deduplicación, categorización asistida, doble partida, transfer matching y reconciliación con evidencia  
   
⸻  
   
## 3231. Objetivo  
Esta parte define cómo SG Solutions deberá:  
* importar transacciones;  
* procesar bank feeds;  
* aceptar archivos;  
* normalizar merchants;  
* identificar ingresos;  
* identificar gastos;  
* reconocer transferencias;  
* categorizar;  
* aplicar reglas;  
* solicitar información;  
* detectar duplicados;  
* generar propuestas contables;  
* reconciliar cuentas;  
* resolver diferencias.  
La plataforma deberá responder:  
* ¿De dónde llegó la transacción?  
* ¿Ya había sido importada?  
* ¿Quién fue el merchant?  
* ¿Es ingreso, gasto o transferencia?  
* ¿Es personal o empresarial?  
* ¿Qué categoría corresponde?  
* ¿Qué evidencia existe?  
* ¿La IA sugirió o decidió?  
* ¿La cuenta está reconciliada?  
* ¿Qué diferencia queda pendiente?  
   
⸻  
   
## 3232. Principio central  
```
Source transaction
→ normalization
→ duplicate detection
→ transaction type
→ categorization
→ review
→ accounting entry
→ reconciliation

```
No deberá seguir:  
```
Bank description
→ AI guess
→ posted expense

```
   
⸻  
   
## 3233. Transaction Source  
Fuentes iniciales:  
```
bank_feed
credit_card_feed
payment_processor
csv_import
xlsx_import
ofx_import
qbo_import
statement_import
manual_entry
external_accounting_sync

```
   
⸻  
   
## 3234. Source Transaction Record  
Campos:  
```
id
financialAccountId
sourceType
sourceTransactionId
postedDate
authorizedDate
descriptionRaw
amount
currency
transactionDirection
runningBalance
sourcePayloadReference
importBatchId
status
createdAt

```
   
⸻  
   
## 3235. Source Immutability  
La transacción recibida desde una fuente deberá conservarse sin modificaciones destructivas.  
Correcciones internas deberán almacenarse por separado.  
   
⸻  
   
## 3236. Import Batch  
Campos:  
```
id
accountingBookId
financialAccountId
sourceType
fileReference
periodStart
periodEnd
transactionCount
importedAt
status
createdBy

```
   
⸻  
   
## 3237. Import Batch Status  
```
uploaded
validating
processing
completed
completed_with_warnings
failed
cancelled
superseded

```
   
⸻  
   
## 3238. File Import Validation  
Antes de procesar deberá comprobarse:  
* account;  
* date range;  
* currency;  
* columns;  
* amount format;  
* duplicates;  
* encoding;  
* malformed rows;  
* unsupported transactions.  
   
⸻  
   
## 3239. Bank Feed  
Un Bank Feed deberá representar una conexión de solo lectura o alcance mínimo autorizado.  
No deberá guardar:  
* username;  
* password;  
* security answers.  
Las credenciales deberán manejarse mediante el proveedor autorizado.  
   
⸻  
   
## 3240. Feed Status  
```
not_connected
connecting
active
syncing
reauthentication_required
degraded
disconnected
failed

```
   
⸻  
   
## 3241. Feed Sync Record  
Campos:  
```
id
financialAccountId
syncStartedAt
syncCompletedAt
transactionsReceived
duplicatesSkipped
earliestTransactionDate
latestTransactionDate
status
errorReference

```
   
⸻  
   
## 3242. Idempotent Import  
La misma transacción no deberá crearse dos veces por:  
* retry;  
* webhook duplicado;  
* file re-upload;  
* provider resync;  
* manual import.  
   
⸻  
   
## 3243. Duplicate Detection  
Podrá utilizar:  
* provider transaction ID;  
* account;  
* date;  
* amount;  
* merchant;  
* description;  
* check number;  
* hash;  
* similarity.  
   
⸻  
   
## 3244. Duplicate Status  
```
unique
possible_duplicate
confirmed_duplicate
related_transaction
superseded

```
   
⸻  
   
## 3245. Posted versus Pending  
Deberán distinguirse:  
```
pending
posted
reversed
cancelled

```
Las transacciones pending no deberán contabilizarse como definitivas salvo política expresa.  
   
⸻  
   
## 3246. Pending-to-Posted Matching  
Cuando una pending se convierta en posted deberá vincularse y no crear un gasto duplicado.  
   
⸻  
   
## 3247. Transaction Normalization  
El sistema deberá normalizar:  
* merchant;  
* description;  
* amount sign;  
* date;  
* transaction type;  
* payment channel;  
* location cuando sea útil.  
   
⸻  
   
## 3248. Merchant Record  
Campos:  
```
id
canonicalName
merchantCategory
aliases
website
defaultAccountSuggestion
riskFlags
status
createdAt

```
   
⸻  
   
## 3249. Merchant Alias  
Ejemplos:  
```
WM SUPERCENTER #1234
WALMART 1234
WAL-MART
→ Walmart

```
El texto original deberá conservarse.  
   
⸻  
   
## 3250. Merchant Normalization Confidence  
```
high
moderate
low
unknown

```
La normalización no deberá determinar por sí sola la categoría contable.  
   
⸻  
   
## 3251. Transaction Direction  
```
inflow
outflow
neutral
unknown

```
   
⸻  
   
## 3252. Economic Transaction Type  
Clasificación operacional:  
```
income
expense
transfer
owner_contribution
owner_draw
loan_proceeds
loan_payment
credit_card_payment
refund
reimbursement
tax_payment
payroll_related
asset_purchase
unknown

```
   
⸻  
   
## 3253. Income Recognition  
Un inflow no deberá clasificarse automáticamente como revenue.  
Podría tratarse de:  
* owner contribution;  
* transfer;  
* loan proceeds;  
* refund;  
* reimbursement;  
* customer payment;  
* interest;  
* other income.  
   
⸻  
   
## 3254. Income Record  
Campos conceptuales:  
```
transactionId
incomeType
customerReference
invoiceReference
grossAmount
fees
netAmount
incomeAccountId
evidenceReference
reviewStatus

```
   
⸻  
   
## 3255. Payment Processor Deposits  
Un depósito de Stripe, Square, PayPal u otro processor podrá representar:  
```
gross sales
-
fees
-
refunds
-
adjustments
=
net deposit

```
No deberá registrarse automáticamente el net deposit completo como revenue.  
   
⸻  
   
## 3256. Processor Settlement  
Campos:  
```
id
processorAccountId
settlementId
grossSales
fees
refunds
adjustments
netDeposit
depositTransactionId
status

```
   
⸻  
   
## 3257. Expense Recognition  
Un outflow tampoco deberá clasificarse automáticamente como gasto deducible.  
Podría ser:  
* transfer;  
* loan principal;  
* owner draw;  
* asset purchase;  
* tax payment;  
* personal purchase;  
* business expense.  
   
⸻  
   
## 3258. Expense Record  
Campos conceptuales:  
```
transactionId
expenseType
vendorId
expenseAccountId
businessUsePercent
receiptReference
reimbursable
taxMappingCode
reviewStatus

```
   
⸻  
   
## 3259. Personal Expense  
Una transacción personal pagada desde cuenta empresarial deberá poder clasificarse, según la entidad, como:  
```
owner_draw
distribution
shareholder_related
personal_expense_review

```
No deberá registrarse automáticamente como business expense.  
   
⸻  
   
## 3260. Mixed-Use Expense  
Ejemplos:  
* phone;  
* internet;  
* vehicle;  
* home office;  
* subscriptions;  
* travel.  
Deberá permitirse:  
```
businessUsePercent
personalUsePercent
allocationMethod
supportingEvidence
reviewer

```
   
⸻  
   
## 3261. Split Transaction  
Una transacción podrá dividirse entre múltiples cuentas.  
Ejemplo:  
```
Office Store $250

Office Supplies       $150
Computer Equipment    $100

```
La suma de splits deberá ser igual al total.  
   
⸻  
   
## 3262. Transaction Split Record  
Campos:  
```
id
transactionId
ledgerAccountId
amount
percent
memo
taxMappingCode
evidenceReference

```
   
⸻  
   
## 3263. Refund Handling  
Un refund deberá intentar vincularse con:  
* original expense;  
* original sale;  
* merchant;  
* transaction;  
* accounting period.  
   
⸻  
   
## 3264. Reimbursements  
Deberán distinguirse:  
* employee reimbursement;  
* owner reimbursement;  
* customer reimbursement;  
* expense reimbursement;  
* unknown reimbursement.  
   
⸻  
   
## 3265. Loan Proceeds  
La recepción de un préstamo deberá registrarse como liability-related inflow y no como revenue.  
   
⸻  
   
## 3266. Loan Payments  
Un pago de préstamo podrá dividirse en:  
```
principal
interest
fees

```
El principal no deberá registrarse como gasto operativo.  
   
⸻  
   
## 3267. Credit Card Payments  
Un pago desde checking hacia una tarjeta empresarial deberá normalmente tratarse como transferencia entre cuentas, no como un gasto nuevo.  
   
⸻  
   
## 3268. Transfer Detection  
El motor deberá buscar pares compatibles mediante:  
* amount;  
* date proximity;  
* source account;  
* destination account;  
* description;  
* transfer identifiers.  
   
⸻  
   
## 3269. Transfer Match  
Campos:  
```
id
sourceTransactionId
destinationTransactionId
matchScore
matchReasons
status
reviewedBy
createdAt

```
   
⸻  
   
## 3270. Transfer Status  
```
proposed
matched
review_required
confirmed
rejected
partial

```
   
⸻  
   
## 3271. Duplicate Income Prevention  
Un movimiento entre dos cuentas conectadas no deberá incrementar revenue.  
Este control deberá formar parte de las pruebas críticas.  
   
⸻  
   
## 3272. Transaction Classification  
Cada transacción deberá conservar:  
```
economicType
ledgerAccountId
taxMappingCode
businessPersonalStatus
classificationSource
confidence
reviewStatus

```
   
⸻  
   
## 3273. Classification Source  
```
manual_bookkeeper
client_confirmation
rule
historical_pattern
ai_suggestion
external_accounting_system
system_mapping

```
   
⸻  
   
## 3274. Categorization Confidence  
```
verified
high
moderate
low
unknown

```
high no equivale a verified.  
   
⸻  
   
## 3275. Categorization Rule  
Campos:  
```
id
accountingBookId
ruleName
priority
conditions
actions
scope
confidencePolicy
requiresReview
effectiveAt
status
createdAt

```
   
⸻  
   
## 3276. Rule Conditions  
Podrán utilizar:  
* merchant;  
* description;  
* amount range;  
* account;  
* transaction direction;  
* recurring pattern;  
* payment channel;  
* processor.  
   
⸻  
   
## 3277. Rule Actions  
Una regla podrá:  
* suggest account;  
* suggest transaction type;  
* assign vendor;  
* mark review required;  
* create client question;  
* suggest split.  
Inicialmente no deberá publicar automáticamente asientos materiales salvo reglas previamente aprobadas y dentro de un riesgo controlado.  
   
⸻  
   
## 3278. Rule Priority  
Cuando varias reglas coincidan deberá utilizarse:  
```
priority
specificity
confidence
effectiveDate

```
Los conflictos deberán generar review.  
   
⸻  
   
## 3279. Learning from Historical Decisions  
El sistema podrá aprender patrones de categorizaciones previamente confirmadas.  
Deberá conservar:  
* historical examples;  
* confidence;  
* client/entity scope;  
* exceptions.  
   
⸻  
   
## 3280. Client Question  
Cuando la clasificación requiera contexto deberá enviarse una pregunta como:  
```
“¿Este pago de $486.22 a Home Depot fue para el negocio?”

```
El cliente podrá responder:  
* business;  
* personal;  
* mixed;  
* transfer;  
* don’t know;  
* explanation.  
   
⸻  
   
## 3281. Transaction Question Record  
Campos:  
```
id
transactionId
questionType
questionText
clientResponse
supportingDocumentIds
status
createdAt
answeredAt
reviewedAt

```
   
⸻  
   
## 3282. Receipt Matching  
Cuando existan receipts, deberá intentarse el matching mediante:  
* merchant;  
* date;  
* amount;  
* card/account;  
* receipt total.  
   
⸻  
   
## 3283. Receipt Match Status  
```
not_requested
no_match
possible_match
matched
confirmed
rejected

```
   
⸻  
   
## 3284. Proposed Journal Entry  
Una categorización aceptada deberá generar o actualizar una propuesta de asiento.  
El asiento deberá mantener lineage hacia la transacción original.  
   
⸻  
   
## 3285. Auto-Posting Policy  
La plataforma deberá soportar niveles:  
```
never_auto_post
auto_post_low_risk
auto_post_approved_rules_only
external_system_controls_posting

```
La configuración inicial recomendada:  
```
never_auto_post

```
para decisiones materiales.  
   
⸻  
   
## 3286. Reconciliation  
La reconciliación deberá comparar:  
```
beginning balance
+
activity
=
ending book balance

```
contra el balance de la fuente externa.  
   
⸻  
   
## 3287. Reconciliation Session  
Campos:  
```
id
financialAccountId
accountingPeriodId
statementStartDate
statementEndDate
statementBeginningBalance
statementEndingBalance
bookEndingBalance
difference
status
preparedBy
reviewedBy
createdAt
completedAt

```
   
⸻  
   
## 3288. Reconciliation Status  
```
not_started
in_progress
difference_remaining
ready_for_review
reconciled
rejected
reopened

```
   
⸻  
   
## 3289. Reconciliation Item  
Cada movimiento podrá quedar:  
```
cleared
uncleared
missing_in_books
missing_in_statement
duplicate
timing_difference
requires_investigation

```
   
⸻  
   
## 3290. Reconciliation Difference  
Una diferencia diferente de cero deberá impedir marcar la sesión como reconciled, salvo una política explícita de tolerancia documentada.  
   
⸻  
   
## 3291. Reconciliation Adjustment  
Un ajuste deberá registrar:  
* amount;  
* reason;  
* supporting evidence;  
* ledger account;  
* preparedBy;  
* reviewedBy;  
* approval.  
No deberá utilizarse simplemente para “hacer cuadrar” la cuenta.  
   
⸻  
   
## 3292. Reconciliation Lock  
Después de aprobar una reconciliación:  
* items reconciled deberán quedar protegidos;  
* cambios posteriores deberán generar alerta;  
* reconciliación afectada deberá poder reabrirse;  
* period close deberá considerar su estado.  
   
⸻  
   
## 3293. Transaction Workspace  
El bookkeeper deberá poder filtrar:  
```
uncategorized
needs_review
client_question
possible_transfer
possible_duplicate
missing_receipt
personal
mixed
ready_to_post
posted

```
Y por:  
* account;  
* month;  
* merchant;  
* amount;  
* category;  
* confidence.  
   
⸻  
   
## 3294. Permisos, APIs, eventos y workflows  
## Permisos conceptuales  
```
bookkeeping.transaction.read
bookkeeping.transaction.import
bookkeeping.transaction.classify
bookkeeping.transaction.split
bookkeeping.transaction.review

bookkeeping.feed.read
bookkeeping.feed.manage
bookkeeping.feed.sync

bookkeeping.rule.read
bookkeeping.rule.manage
bookkeeping.rule.approve

bookkeeping.transfer.match
bookkeeping.receipt.match

bookkeeping.reconciliation.read
bookkeeping.reconciliation.prepare
bookkeeping.reconciliation.review
bookkeeping.reconciliation.reopen

```
## APIs conceptuales  
```
POST   /api/bookkeeping/accounts/{id}/imports
POST   /api/bookkeeping/accounts/{id}/sync
GET    /api/bookkeeping/accounts/{id}/transactions

POST   /api/bookkeeping/transactions/{id}/classifications
POST   /api/bookkeeping/transactions/{id}/splits
POST   /api/bookkeeping/transactions/{id}/questions

POST   /api/bookkeeping/transfers/matches
POST   /api/bookkeeping/receipts/matches

GET    /api/bookkeeping/books/{id}/categorization-rules
POST   /api/bookkeeping/books/{id}/categorization-rules

POST   /api/bookkeeping/accounts/{id}/reconciliations
POST   /api/bookkeeping/reconciliations/{id}/review
POST   /api/bookkeeping/reconciliations/{id}/reopen

```
## Eventos de dominio  
```
BookkeepingImportStarted
BookkeepingImportCompleted
BookkeepingDuplicateDetected
BookkeepingTransactionNormalized
BookkeepingTransactionClassificationSuggested
BookkeepingTransactionClassified
BookkeepingClientQuestionCreated
BookkeepingTransferProposed
BookkeepingTransferConfirmed
BookkeepingReceiptMatched
BookkeepingCategorizationRuleCreated
BookkeepingReconciliationStarted
BookkeepingReconciliationDifferenceDetected
BookkeepingReconciliationCompleted
BookkeepingReconciliationReopened

```
## Workflows iniciales  
```
Bookkeeping Transaction Import Workflow
Bank Feed Sync Workflow
Transaction Normalization Workflow
Duplicate Review Workflow
Transaction Categorization Workflow
Client Transaction Question Workflow
Transfer Matching Workflow
Receipt Matching Workflow
Categorization Rule Approval Workflow
Bank Reconciliation Workflow

```
   
⸻  
   
## 3295. Pruebas, criterios de aceptación e instrucciones para Codex  
## Pruebas obligatorias  
1. Importar CSV.  
2. Importar XLSX.  
3. Crear Import Batch.  
4. Detectar malformed row.  
5. Ejecutar Bank Feed sync.  
6. Manejar reauthentication required.  
7. Repetir sync sin duplicar.  
8. Detectar duplicate provider ID.  
9. Detectar possible duplicate por similarity.  
10. Vincular pending con posted.  
11. Normalizar merchant.  
12. Conservar raw description.  
13. Crear income transaction.  
14. Evitar inflow=income automático.  
15. Crear processor settlement.  
16. Separar gross sales y fees.  
17. Crear business expense.  
18. Detectar personal expense.  
19. Crear mixed-use allocation.  
20. Crear split transaction.  
21. Vincular refund.  
22. Clasificar loan proceeds.  
23. Separar loan principal e interest.  
24. Detectar credit-card payment como transfer.  
25. Crear Transfer Match.  
26. Evitar duplicate revenue.  
27. Crear transaction classification.  
28. Registrar classification source.  
29. Crear categorization rule.  
30. Resolver conflicto entre rules.  
31. Crear historical suggestion.  
32. Crear Client Question.  
33. Procesar respuesta.  
34. Vincular receipt.  
35. Crear proposed journal entry.  
36. Confirmar source lineage.  
37. Bloquear auto-post no autorizado.  
38. Crear Reconciliation Session.  
39. Cargar statement balances.  
40. Marcar items cleared.  
41. Detectar missing transaction.  
42. Detectar duplicate.  
43. Detectar timing difference.  
44. Bloquear reconciliation con diferencia.  
45. Crear approved adjustment.  
46. Reconciliar a cero.  
47. Bloquear modificación silenciosa.  
48. Reabrir reconciliation.  
49. Probar permisos.  
50. Probar auditoría.  
## Criterios de aceptación  
La Parte 2 estará completa cuando:  
1. Exista multichannel transaction ingestion.  
2. Existan Import Batches.  
3. Exista Bank Feed support.  
4. Exista idempotencia.  
5. Exista Duplicate Detection.  
6. Se distingan pending y posted.  
7. Exista merchant normalization.  
8. Se conserve raw description.  
9. Exista transaction direction.  
10. Existan economic transaction types.  
11. Inflow no equivalga automáticamente a income.  
12. Outflow no equivalga automáticamente a expense.  
13. Exista processor settlement.  
14. Exista personal-expense handling.  
15. Exista mixed-use allocation.  
16. Existan splits.  
17. Exista refund matching.  
18. Exista reimbursement handling.  
19. Loan proceeds no sean revenue.  
20. Loan principal no sea expense.  
21. Credit-card payments puedan ser transferencias.  
22. Exista Transfer Detection.  
23. Se evite duplicate income.  
24. Exista transaction classification.  
25. Exista classification source.  
26. Exista confidence.  
27. Existan categorization rules.  
28. Exista conflict handling.  
29. Exista historical learning.  
30. Existan Client Questions.  
31. Exista receipt matching.  
32. Existan Proposed Journal Entries.  
33. Exista configurable Auto-Posting Policy.  
34. Existan Reconciliation Sessions.  
35. Existan Reconciliation Items.  
36. Las diferencias impidan cierre.  
37. Los ajustes requieran explicación.  
38. Exista reconciliation locking.  
39. Exista Transaction Workspace.  
40. Toda clasificación sea trazable.  
## Instrucciones para Codex  
Antes de implementar:  
1. Lee el Módulo 31 Parte 1.  
2. Reutiliza Financial Account Registry.  
3. Reutiliza Documents.  
4. Reutiliza Tasks.  
5. Reutiliza Messaging.  
6. Reutiliza Approvals.  
7. Reutiliza Audit.  
8. Implementa Source Transactions.  
9. Conserva source payload.  
10. Implementa Import Batches.  
11. Implementa file validation.  
12. Implementa Bank Feed abstraction.  
13. Nunca almacenes banking passwords.  
14. Implementa Feed Sync Records.  
15. Implementa idempotency.  
16. Implementa Duplicate Detection.  
17. Implementa pending-to-posted matching.  
18. Implementa transaction normalization.  
19. Implementa Merchant Registry.  
20. Conserva raw descriptions.  
21. Implementa economic types.  
22. No conviertas todo inflow en revenue.  
23. No conviertas todo outflow en expense.  
24. Implementa processor settlements.  
25. Implementa personal/business handling.  
26. Implementa mixed-use allocation.  
27. Implementa splits.  
28. Implementa refunds.  
29. Implementa reimbursements.  
30. Implementa loan accounting classification.  
31. Implementa credit-card transfer handling.  
32. Implementa Transfer Matching.  
33. Evita duplicate revenue.  
34. Implementa classification records.  
35. Implementa confidence.  
36. Implementa Categorization Rules.  
37. Implementa rule priorities.  
38. Implementa rule conflicts.  
39. Implementa historical suggestions.  
40. Implementa Client Questions.  
41. Implementa receipt matching.  
42. Implementa Proposed Journal Entries.  
43. Implementa Auto-Posting Policy.  
44. Default material transactions to human review.  
45. Implementa Reconciliation Sessions.  
46. Implementa Reconciliation Items.  
47. Impide reconciled si difference != 0 salvo tolerancia gobernada.  
48. Implementa approved adjustments.  
49. Implementa reconciliation lock.  
50. Implementa reopening.  
51. Implementa Transaction Workspace.  
52. Implementa permissions.  
53. Implementa APIs.  
54. Implementa events.  
55. Implementa workflows.  
56. Implementa audit.  
57. No permitas que IA publique asientos materiales por defecto.  
58. No permitas transferencias duplicar revenue o expenses.  
59. No permitas “plug adjustments” sin evidencia.  
60. No marques esta parte como lista sin completar import → classification → posting proposal → reconciliation.  
Antes de entregar, verifica:  
* ¿La fuente original nunca se sobrescribe?  
* ¿Los imports repetidos son idempotentes?  
* ¿Pending y posted no se duplican?  
* ¿Merchant normalization conserva el texto original?  
* ¿Ingresos y gastos se distinguen de préstamos y transferencias?  
* ¿Los depósitos de payment processors se registran gross-to-net correctamente?  
* ¿Los gastos personales no se vuelven deducciones automáticamente?  
* ¿Las reglas solo automatizan dentro de su scope?  
* ¿La IA produce sugerencias con confidence?  
* ¿Las transferencias entre cuentas no duplican resultados?  
* ¿Cada reconciliación llega a cero o documenta una tolerancia aprobada?  
* ¿Los ajustes tienen evidencia?  
* ¿Toda clasificación y cambio queda auditado?  
  
  
  
## MÓDULO 31 — BOOKKEEPING Y CONTABILIDAD  
## Parte 3 — Cierres, Ajustes, Estados Financieros, Reportes y Preparación Fiscal  
**Versión:** 1.0.0 **Estado:** Especificación inicial **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 31 — Parte 2 **Secciones incluidas:** 3296–3360 **Audiencia:** Owner, Codex, bookkeepers, reviewers, tax preparers, administradores y clientes empresariales **Idioma del código:** Inglés **Idioma de la interfaz:** Español e inglés **Modelo operativo:** Cierre basado en evidencia, ajustes controlados, reportes reproducibles y handoff tributario sin convertir bookkeeping en preparación fiscal automática  
   
⸻  
   
## 3296. Objetivo  
Esta parte define cómo SG Solutions deberá:  
* cerrar periodos;  
* revisar transacciones;  
* preparar adjusting entries;  
* reclasificar;  
* documentar accruals cuando estén soportados;  
* administrar depreciation summaries;  
* generar Trial Balance;  
* generar General Ledger;  
* producir P&L;  
* producir Balance Sheet;  
* producir Cash Flow;  
* comparar periodos;  
* detectar variaciones;  
* preparar Tax-Ready Books;  
* entregar información al Módulo 30.  
La plataforma deberá responder:  
* ¿El periodo está listo para cerrar?  
* ¿Todas las cuentas están reconciliadas?  
* ¿Existen transacciones sin clasificar?  
* ¿Qué ajustes se realizaron?  
* ¿Quién los aprobó?  
* ¿Cuáles son los resultados del negocio?  
* ¿Qué cambió frente al periodo anterior?  
* ¿Qué información está lista para taxes?  
* ¿De dónde proviene cada cifra?  
   
⸻  
   
## 3297. Principio central  
```
Transactions
→ reconciliations
→ cleanup
→ adjustments
→ review
→ period close
→ financial reports
→ tax-ready handoff

```
Nunca:  
```
Month ended
→ auto-close
→ reports published

```
   
⸻  
   
## 3298. Reutilización obligatoria  
La implementación deberá reutilizar:  
* Accounting Books;  
* Accounting Periods;  
* Journal Entries;  
* Reconciliations;  
* Documents;  
* Tasks;  
* Approvals;  
* Comments;  
* Tax Cases;  
* Analytics;  
* Audit;  
* AI Hub.  
   
⸻  
   
## 3299. Period Close Workspace  
El bookkeeper deberá visualizar:  
* financial accounts;  
* reconciliation status;  
* uncategorized transactions;  
* open questions;  
* missing statements;  
* outstanding receipts;  
* proposed adjustments;  
* review findings;  
* close checklist;  
* report readiness.  
   
⸻  
   
## 3300. Close Checklist  
Elementos iniciales:  
```
all_transactions_imported
duplicate_review_complete
transfers_reviewed
uncategorized_resolved
client_questions_resolved
bank_accounts_reconciled
credit_cards_reconciled
processor_accounts_reconciled
loan_balances_reviewed
owner_activity_reviewed
adjustments_completed
review_completed

```
   
⸻  
   
## 3301. Close Checklist Item  
Campos:  
```
id
accountingPeriodId
checkCode
status
assignedTo
required
evidenceReference
completedBy
completedAt
reviewedBy
createdAt

```
   
⸻  
   
## 3302. Checklist Status  
```
not_started
in_progress
blocked
complete
waived
not_applicable

```
   
⸻  
   
## 3303. Close Blockers  
Un periodo deberá quedar bloqueado si existen:  
* unreconciled material accounts;  
* missing required statement;  
* material uncategorized transactions;  
* unapproved adjustments;  
* unresolved balance discrepancy;  
* open critical review finding.  
   
⸻  
   
## 3304. Materiality Policy  
La plataforma deberá permitir configurar thresholds para:  
* transaction amount;  
* account balance;  
* reconciliation variance;  
* adjustment;  
* report variance.  
Estos thresholds deberán ser versionados.  
   
⸻  
   
## 3305. Bookkeeping Materiality  
Materialidad operacional no deberá interpretarse automáticamente como materialidad tributaria, legal o de auditoría.  
   
⸻  
   
## 3306. Adjusting Journal Entry  
Tipos:  
```
reclassification
accrual
deferral
depreciation
amortization
loan_adjustment
owner_equity_adjustment
processor_adjustment
opening_balance_correction
prior_period_adjustment
other

```
   
⸻  
   
## 3307. Adjustment Record  
Campos:  
```
id
accountingPeriodId
journalEntryId
adjustmentType
reason
sourceReferences
materiality
preparedBy
reviewedBy
approvalStatus
createdAt

```
   
⸻  
   
## 3308. Adjustment Evidence  
Todo ajuste material deberá estar respaldado por:  
* statement;  
* invoice;  
* receipt;  
* contract;  
* loan statement;  
* prior books;  
* tax document;  
* client explanation;  
* calculation workpaper.  
   
⸻  
   
## 3309. Reclassification  
Una reclasificación deberá mover un monto entre cuentas sin modificar arbitrariamente el monto económico original.  
   
⸻  
   
## 3310. Reclassification Example  
```
Repairs Expense       -$2,000
Equipment Asset       +$2,000

```
Deberá conservarse el motivo y la fuente.  
   
⸻  
   
## 3311. Accrual Adjustment  
Cuando el libro utilice accrual o modified cash y el servicio lo soporte, podrán registrarse:  
* accrued revenue;  
* accrued expense;  
* prepaid expense;  
* deferred revenue;  
* payable;  
* receivable.  
   
⸻  
   
## 3312. Accrual Restriction  
No deberán generarse accruals únicamente por inferencia de IA sin:  
* source;  
* period;  
* amount;  
* rationale;  
* bookkeeper review.  
   
⸻  
   
## 3313. Depreciation Summary  
El módulo podrá mantener depreciation entries provenientes de:  
* fixed-asset schedule interno;  
* tax-preparation system;  
* accounting provider;  
* approved manual calculation.  
   
⸻  
   
## 3314. Book versus Tax Depreciation  
La plataforma deberá permitir que:  
```
book_depreciation
≠
tax_depreciation

```
cuando corresponda.  
No deberá asumir que ambos valores son idénticos.  
   
⸻  
   
## 3315. Loan Balance Review  
Antes del cierre deberá poder compararse:  
```
book loan balance
vs
lender statement balance

```
Las diferencias podrán requerir separación entre principal, interest y fees.  
   
⸻  
   
## 3316. Credit Card Liability Review  
El saldo del ledger deberá reconciliarse con el statement correspondiente.  
   
⸻  
   
## 3317. Owner Equity Review  
Deberán revisarse:  
* owner contributions;  
* owner draws;  
* distributions;  
* shareholder-related transactions;  
* personal expenses;  
* reimbursements.  
   
⸻  
   
## 3318. Equity Classification  
La clasificación deberá depender del entity type.  
No deberá utilizarse la misma lógica automáticamente para:  
* sole proprietor;  
* partnership;  
* S-Corporation;  
* C-Corporation.  
   
⸻  
   
## 3319. Suspense Cleanup  
Antes del hard close deberán resolverse los saldos materiales en:  
* Suspense;  
* Uncategorized Income;  
* Uncategorized Expense;  
* temporary clearing accounts.  
   
⸻  
   
## 3320. Prior-Period Adjustment  
Una modificación que afecte un periodo ya cerrado deberá:  
* identificar periodo original;  
* explicar reason;  
* evaluar impacto;  
* requerir approval;  
* conservar original;  
* actualizar report versions.  
   
⸻  
   
## 3321. Close Review  
Antes del cierre un reviewer deberá poder revisar:  
* checklist;  
* reconciliations;  
* adjustments;  
* unusual transactions;  
* owner activity;  
* variances;  
* report preview.  
   
⸻  
   
## 3322. Close Review Record  
Campos:  
```
id
accountingPeriodId
reviewType
reviewerId
checklistVersionId
status
findingsCount
startedAt
completedAt
createdAt

```
   
⸻  
   
## 3323. Close Review Status  
```
not_started
in_progress
changes_required
re_review
approved
rejected

```
   
⸻  
   
## 3324. Close Finding  
Tipos:  
```
unreconciled_account
missing_evidence
incorrect_category
transfer_issue
owner_activity_issue
loan_balance_issue
unusual_transaction
report_variance
tax_mapping_issue
other

```
   
⸻  
   
## 3325. Finding Resolution  
Cada finding deberá:  
* asignarse;  
* corregirse;  
* documentarse;  
* ser confirmado por reviewer;  
* quedar vinculado con evidencia.  
   
⸻  
   
## 3326. Soft Close Workflow  
Al aprobar el close review:  
```
processing
→ review
→ soft_closed

```
El periodo podrá generar reportes oficiales internos.  
   
⸻  
   
## 3327. Hard Close Workflow  
Un hard close podrá realizarse después de:  
* soft close;  
* review approval;  
* client questions resolved;  
* required reports generated;  
* no blocking findings.  
   
⸻  
   
## 3328. Close Version  
Cada cierre deberá generar:  
```
id
accountingPeriodId
closeVersionNumber
trialBalanceSnapshotId
reportSetId
closedBy
approvedBy
closedAt
status

```
   
⸻  
   
## 3329. Report Versioning  
Todo reporte deberá identificar:  
* accounting book;  
* period;  
* close version;  
* generation date;  
* accounting basis;  
* currency;  
* report definition version.  
   
⸻  
   
## 3330. Trial Balance  
El Trial Balance deberá mostrar:  
* account;  
* debit balance;  
* credit balance;  
* total debits;  
* total credits.  
Debe validarse que:  
```
total debits = total credits

```
   
⸻  
   
## 3331. Trial Balance Snapshot  
Campos:  
```
id
accountingBookId
accountingPeriodId
closeVersionId
asOfDate
totalDebits
totalCredits
status
createdAt

```
   
⸻  
   
## 3332. General Ledger  
El General Ledger deberá permitir consultar:  
* account;  
* beginning balance;  
* journal entries;  
* debits;  
* credits;  
* ending balance;  
* source lineage.  
   
⸻  
   
## 3333. Profit and Loss Statement  
El P&L deberá estructurar al menos:  
```
Revenue
- Cost of Goods Sold
= Gross Profit
- Operating Expenses
= Operating Income
+/- Other Income/Expense
= Net Income

```
Las líneas mostradas dependerán del Chart of Accounts.  
   
⸻  
   
## 3334. P&L Filters  
Filtros:  
* month;  
* quarter;  
* year;  
* custom period;  
* cash/accrual basis cuando sea aplicable;  
* comparison period.  
   
⸻  
   
## 3335. Balance Sheet  
Deberá presentar:  
```
Assets
=
Liabilities
+
Equity

```
El sistema deberá validar la ecuación contable.  
   
⸻  
   
## 3336. Balance Sheet Validation  
Si:  
```
Assets != Liabilities + Equity

```
deberá crearse blocking diagnostic.  
   
⸻  
   
## 3337. Statement of Cash Flows  
La plataforma deberá estar preparada para mostrar flujos:  
```
operating
investing
financing

```
La primera versión podrá utilizar metodología limitada conforme al alcance del bookkeeping.  
   
⸻  
   
## 3338. Cash Flow Limitation  
No deberá confundirse:  
```
bank account movement

```
con:  
```
formal cash flow statement classification

```
sin reglas contables adecuadas.  
   
⸻  
   
## 3339. Owner Activity Report  
Para pequeños negocios podrá generarse un resumen de:  
* contributions;  
* draws;  
* distributions;  
* reimbursements;  
* personal charges;  
* equity adjustments.  
   
⸻  
   
## 3340. Expense by Category Report  
Deberá permitir analizar:  
* category;  
* amount;  
* percentage of expenses;  
* period;  
* prior-period variance.  
   
⸻  
   
## 3341. Revenue Summary  
Podrá mostrar:  
* gross revenue;  
* revenue by source;  
* processor settlements;  
* refunds;  
* other income;  
* period comparison.  
   
⸻  
   
## 3342. Comparative Reports  
Comparaciones:  
```
current_month_vs_prior_month
current_quarter_vs_prior_quarter
current_year_vs_prior_year
actual_vs_custom_baseline

```
   
⸻  
   
## 3343. Variance Record  
Campos:  
```
id
reportId
accountId
currentValue
comparisonValue
absoluteVariance
percentageVariance
materialityStatus
explanationStatus
createdAt

```
   
⸻  
   
## 3344. Variance Analysis  
Variaciones materiales deberán poder generar:  
* internal review;  
* client question;  
* explanatory note;  
* anomaly investigation.  
   
⸻  
   
## 3345. Unusual Transaction Review  
Señales:  
* unusually large amount;  
* new merchant;  
* duplicate amount;  
* unusual owner transaction;  
* unexpected cash withdrawal;  
* unusual revenue reversal;  
* period-end transaction spike.  
Las señales deberán generar revisión, no acusación.  
   
⸻  
   
## 3346. AI Financial Summary  
La IA podrá preparar:  
* resumen mensual;  
* principales cambios;  
* top expenses;  
* revenue trend;  
* unusual items;  
* questions.  
   
⸻  
   
## 3347. AI Limitation  
La IA no deberá:  
* certificar estados financieros;  
* afirmar auditoría;  
* determinar fraude;  
* modificar reportes finales;  
* cerrar periodos;  
* emitir opinión contable profesional.  
   
⸻  
   
## 3348. Client Report Package  
Podrá incluir:  
* P&L;  
* Balance Sheet;  
* Cash Flow cuando esté soportado;  
* expense summary;  
* revenue summary;  
* owner activity;  
* management notes.  
   
⸻  
   
## 3349. Report Package Status  
```
draft
internal_review
approved
published_to_client
superseded
withdrawn

```
   
⸻  
   
## 3350. Client Commentary  
El bookkeeper podrá añadir notas como:  
* significant changes;  
* missing documentation;  
* unusual items;  
* recommendations for recordkeeping;  
* items requiring tax review.  
No deberá convertirlas automáticamente en tax advice.  
   
⸻  
   
## 3351. Tax-Ready Package  
El handoff al Módulo 30 deberá incluir:  
* final Trial Balance;  
* General Ledger;  
* P&L;  
* Balance Sheet;  
* owner activity;  
* tax mappings;  
* asset schedule references;  
* loan summaries;  
* reconciliation status;  
* supporting documents;  
* unresolved tax questions.  
   
⸻  
   
## 3352. Tax Mapping  
Cada ledger account podrá mapearse conceptualmente a:  
```
Schedule C category
Form 1065 category
Form 1120-S category
Form 1120 category
tax workpaper category
unmapped

```
según entity type.  
   
⸻  
   
## 3353. Tax Mapping Status  
```
not_mapped
proposed
review_required
approved
rejected
not_applicable

```
   
⸻  
   
## 3354. Bookkeeping-to-Tax Handoff  
Campos:  
```
id
accountingBookId
fiscalYear
taxYear
relatedTaxCaseId
closeVersionId
taxReadyPackageId
handoffStatus
preparedBy
acceptedByTaxTeam
createdAt

```
   
⸻  
   
## 3355. Handoff Status  
```
not_started
preparing
ready
sent_to_tax
tax_review
questions_returned
accepted
superseded

```
   
⸻  
   
## 3356. Tax Team Questions  
El Módulo 30 deberá poder devolver preguntas sobre:  
* expenses;  
* assets;  
* owner activity;  
* loans;  
* revenue;  
* tax mappings;  
* supporting evidence.  
Las respuestas deberán conservarse en ambos expedientes mediante referencias, no copias descontroladas.  
   
⸻  
   
## 3357. No Automatic Tax Filing  
Aceptar un Tax-Ready Package deberá:  
* crear o actualizar Tax Facts;  
* crear workpapers;  
* iniciar tax review.  
No deberá:  
```
auto_prepare
auto_approve
auto_file

```
una declaración.  
   
⸻  
   
## 3358. Year-End Close  
El cierre anual deberá comprobar adicionalmente:  
* todos los meses;  
* final reconciliations;  
* equity;  
* assets;  
* loans;  
* tax mappings;  
* prior-period changes;  
* tax handoff readiness.  
   
⸻  
   
## 3359. Permisos, APIs, eventos y workflows  
## Permisos conceptuales  
```
bookkeeping.close.read
bookkeeping.close.prepare
bookkeeping.close.review
bookkeeping.close.approve

bookkeeping.adjustment.prepare
bookkeeping.adjustment.review
bookkeeping.adjustment.post

bookkeeping.report.read
bookkeeping.report.generate
bookkeeping.report.publish

bookkeeping.tax_mapping.read
bookkeeping.tax_mapping.manage
bookkeeping.tax_handoff.prepare
bookkeeping.tax_handoff.accept

```
## APIs conceptuales  
```
GET    /api/bookkeeping/periods/{id}/close-workspace
POST   /api/bookkeeping/periods/{id}/close-checklists
POST   /api/bookkeeping/periods/{id}/adjustments
POST   /api/bookkeeping/periods/{id}/close-reviews
POST   /api/bookkeeping/periods/{id}/soft-close
POST   /api/bookkeeping/periods/{id}/hard-close

POST   /api/bookkeeping/books/{id}/reports/trial-balance
POST   /api/bookkeeping/books/{id}/reports/general-ledger
POST   /api/bookkeeping/books/{id}/reports/profit-loss
POST   /api/bookkeeping/books/{id}/reports/balance-sheet
POST   /api/bookkeeping/books/{id}/reports/cash-flow

POST   /api/bookkeeping/books/{id}/tax-mappings
POST   /api/bookkeeping/books/{id}/tax-ready-packages
POST   /api/bookkeeping/tax-ready-packages/{id}/handoff

```
## Eventos de dominio  
```
BookkeepingCloseStarted
BookkeepingCloseBlockerDetected
BookkeepingAdjustmentPrepared
BookkeepingAdjustmentApproved
BookkeepingCloseReviewStarted
BookkeepingCloseReviewApproved
BookkeepingPeriodSoftClosed
BookkeepingPeriodHardClosed
BookkeepingTrialBalanceGenerated
BookkeepingFinancialReportGenerated
BookkeepingVarianceDetected
BookkeepingTaxReadyPackageGenerated
BookkeepingTaxHandoffSent
BookkeepingTaxHandoffAccepted
BookkeepingYearEndClosed

```
## Workflows iniciales  
```
Bookkeeping Period Close Workflow
Bookkeeping Adjustment Workflow
Bookkeeping Close Review Workflow
Bookkeeping Financial Reporting Workflow
Bookkeeping Variance Review Workflow
Bookkeeping Tax Mapping Workflow
Bookkeeping Tax-Ready Handoff Workflow
Bookkeeping Year-End Close Workflow

```
   
⸻  
   
## 3360. Pruebas, criterios de aceptación e instrucciones para Codex  
## Pruebas obligatorias  
1. Crear Close Checklist.  
2. Detectar unreconciled account.  
3. Detectar uncategorized transaction.  
4. Bloquear close.  
5. Resolver blocker.  
6. Crear materiality policy.  
7. Crear reclassification.  
8. Crear accrual adjustment.  
9. Exigir source evidence.  
10. Crear depreciation adjustment.  
11. Separar book y tax depreciation.  
12. Revisar loan balance.  
13. Revisar credit-card liability.  
14. Revisar owner activity.  
15. Limpiar Suspense.  
16. Crear prior-period adjustment.  
17. Crear Close Review.  
18. Crear finding.  
19. Resolver finding.  
20. Soft-close period.  
21. Hard-close period.  
22. Crear Close Version.  
23. Generar Trial Balance.  
24. Confirmar debits=credits.  
25. Generar General Ledger.  
26. Generar P&L.  
27. Generar Balance Sheet.  
28. Confirmar accounting equation.  
29. Crear blocking diagnostic por imbalance.  
30. Generar Cash Flow soportado.  
31. Generar Owner Activity Report.  
32. Generar Expense Report.  
33. Generar Revenue Summary.  
34. Crear comparative report.  
35. Calcular variance.  
36. Detectar material variance.  
37. Crear unusual transaction review.  
38. Generar AI financial summary.  
39. Bloquear AI certification.  
40. Crear Client Report Package.  
41. Publicar report package.  
42. Crear tax mappings.  
43. Mapear Schedule C.  
44. Crear Tax-Ready Package.  
45. Crear handoff al Módulo 30.  
46. Crear tax-team question.  
47. Responder question.  
48. Confirmar que handoff no genera filing.  
49. Ejecutar year-end close.  
50. Probar auditoría y permisos.  
## Criterios de aceptación  
La Parte 3 estará completa cuando:  
1. Exista Close Workspace.  
2. Exista Close Checklist.  
3. Existan Close Blockers.  
4. Exista materiality policy.  
5. Existan Adjusting Entries.  
6. Todo ajuste material tenga evidence.  
7. Existan reclassifications.  
8. Exista accrual support limitado.  
9. Exista depreciation summary.  
10. Book y tax depreciation puedan diferir.  
11. Exista loan review.  
12. Exista credit-card liability review.  
13. Exista owner-equity review.  
14. Suspense se revise antes del cierre.  
15. Existan prior-period adjustments.  
16. Exista Close Review.  
17. Existan review findings.  
18. Exista Soft Close.  
19. Exista Hard Close.  
20. Existan Close Versions.  
21. Exista report versioning.  
22. Exista Trial Balance.  
23. Debits y credits cuadren.  
24. Exista General Ledger.  
25. Exista P&L.  
26. Exista Balance Sheet.  
27. La ecuación contable se valide.  
28. Exista Cash Flow cuando esté soportado.  
29. Exista Owner Activity Report.  
30. Existan expense y revenue reports.  
31. Existan comparative reports.  
32. Exista variance analysis.  
33. Exista unusual-transaction review.  
34. IA pueda resumir pero no certificar.  
35. Exista Client Report Package.  
36. Exista Tax-Ready Package.  
37. Existan Tax Mappings.  
38. Exista Bookkeeping-to-Tax Handoff.  
39. No exista automatic tax filing.  
40. Exista Year-End Close.  
## Instrucciones para Codex  
Antes de implementar:  
1. Lee las partes 1 y 2.  
2. Reutiliza Accounting Periods.  
3. Reutiliza Journal Entries.  
4. Reutiliza Reconciliations.  
5. Reutiliza Approvals.  
6. Reutiliza Documents.  
7. Reutiliza Tax Cases.  
8. Implementa Close Workspace.  
9. Implementa Close Checklist.  
10. Implementa Close Blockers.  
11. Implementa Materiality Policies.  
12. Implementa Adjusting Entries.  
13. Exige source evidence.  
14. Implementa reclassifications.  
15. Implementa accrual support de forma controlada.  
16. Implementa depreciation summaries.  
17. Separa book/tax depreciation.  
18. Implementa loan-balance review.  
19. Implementa credit-card review.  
20. Implementa owner-equity review.  
21. Implementa Suspense cleanup.  
22. Implementa prior-period adjustments.  
23. Implementa Close Review.  
24. Implementa findings.  
25. Implementa Soft Close.  
26. Implementa Hard Close.  
27. Implementa Close Versions.  
28. Implementa report versioning.  
29. Implementa Trial Balance.  
30. Verifica debit=credit.  
31. Implementa General Ledger.  
32. Implementa P&L.  
33. Implementa Balance Sheet.  
34. Verifica accounting equation.  
35. Implementa Cash Flow solamente dentro de scope soportado.  
36. Implementa Owner Activity Report.  
37. Implementa expense/revenue reporting.  
38. Implementa comparative reporting.  
39. Implementa variance analysis.  
40. Implementa unusual-transaction review.  
41. Limita AI summaries.  
42. Implementa Client Report Package.  
43. Implementa Tax Mapping.  
44. Implementa Tax-Ready Package.  
45. Implementa Módulo 30 handoff.  
46. Implementa returned tax questions.  
47. No copies documentos innecesariamente.  
48. Implementa Year-End Close.  
49. Implementa permissions.  
50. Implementa APIs.  
51. Implementa events.  
52. Implementa workflows.  
53. Implementa immutable audit.  
54. No cierres periodos con blockers.  
55. No uses plug adjustments.  
56. No permitas IA aprobar ajustes.  
57. No certifiques reportes como audited.  
58. No conviertas Tax-Ready Package en filing automático.  
59. No sobrescribas reportes de cierres anteriores.  
60. No marques esta parte como lista sin completar reconciliación → close → report → tax handoff.  
Antes de entregar, verifica:  
* ¿El cierre exige reconciliaciones?  
* ¿Los ajustes materiales conservan evidencia?  
* ¿Los periodos anteriores no se alteran silenciosamente?  
* ¿Trial Balance cuadra?  
* ¿Balance Sheet cumple la ecuación contable?  
* ¿Los reportes conservan versión y accounting basis?  
* ¿Las variaciones materiales generan revisión?  
* ¿La IA solo explica y resume?  
* ¿El Tax-Ready Package conserva source lineage?  
* ¿El Módulo 30 puede devolver preguntas?  
* ¿El handoff no presenta automáticamente impuestos?  
* ¿Toda acción queda auditada?  
  
  
  
## MÓDULO 31 — BOOKKEEPING Y CONTABILIDAD  
## Parte 4 — Integraciones, Automatización, Administración, Seguridad, Analytics y Cierre  
**Versión:** 1.0.0 **Estado:** Especificación final del módulo **Proyecto:** SG Solutions Platform **Continuación de:** Módulo 31 — Parte 3 **Secciones incluidas:** 3361–3425 **Audiencia:** Owner, Codex, bookkeepers, reviewers, tax preparers, administradores, seguridad, integraciones y Data Analysts **Idioma del código:** Inglés **Idioma de la interfaz:** Español e inglés **Modelo operativo:** Bookkeeping híbrido, integración controlada con plataformas externas, automatización asistida y ledger trazable  
   
⸻  
   
## 3361. Objetivo  
Esta parte cierra el Módulo 31 definiendo:  
* integraciones con sistemas contables;  
* sincronización;  
* conflictos;  
* automatización;  
* IA;  
* administración;  
* seguridad;  
* exportaciones;  
* observabilidad;  
* continuidad;  
* analytics;  
* migración;  
* roadmap;  
* pruebas end-to-end.  
El módulo deberá poder funcionar:  
```
standalone

```
o como capa operacional conectada a:  
```
QuickBooks
Xero
other supported accounting platforms

```
sin perder trazabilidad.  
   
⸻  
   
## 3362. Principio arquitectónico  
```
SG Solutions Bookkeeping
        │
        ├── Internal Ledger
        │
        └── External Accounting System

```
El sistema deberá saber siempre cuál actúa como:  
```
source_of_truth
mirror
integration_target
read_only_source

```
   
⸻  
   
## 3363. Integration Registry  
Todas las integraciones deberán reutilizar el Integration Registry general.  
Tipos iniciales:  
```
accounting_platform
bank_data_provider
payment_processor
receipt_provider
payroll_provider
commerce_platform
expense_platform
tax_platform

```
   
⸻  
   
## 3364. Accounting Integration  
Campos:  
```
id
accountingBookId
providerType
providerConnectionId
externalCompanyId
syncMode
sourceOfTruth
supportedCapabilities
status
lastSuccessfulSyncAt
createdAt
updatedAt

```
   
⸻  
   
## 3365. Providers iniciales  
La arquitectura deberá estar preparada para:  
```
quickbooks_online
xero
quickbooks_desktop_import
generic_csv
generic_api
custom_provider

```
No será obligatorio implementar todos en la primera release.  
   
⸻  
   
## 3366. Integration Status  
```
not_connected
connecting
active
syncing
reauthentication_required
degraded
paused
disconnected
failed

```
   
⸻  
   
## 3367. Sync Modes  
```
import_only
export_only
bidirectional
read_only_mirror
manual_sync

```
La primera integración deberá preferir:  
```
import_only

```
o:  
```
controlled_export

```
antes de habilitar bidirectional sync complejo.  
   
⸻  
   
## 3368. Source of Truth  
Valores:  
```
sg_solutions
external_provider
hybrid_with_field_ownership

```
No deberá existir ambigüedad sobre qué sistema controla cada dato.  
   
⸻  
   
## 3369. Field Ownership  
En modo híbrido podrá configurarse:  
```
transactions → external
categorization → SG Solutions
journal posting → external
review → SG Solutions
reports → external or SG Solutions
tax handoff → SG Solutions

```
   
⸻  
   
## 3370. External Account Mapping  
Campos:  
```
id
accountingBookId
internalAccountId
externalAccountId
externalAccountName
mappingStatus
mappingConfidence
reviewedBy
createdAt

```
   
⸻  
   
## 3371. Mapping Status  
```
unmapped
proposed
review_required
mapped
conflicted
retired

```
   
⸻  
   
## 3372. Transaction Mapping  
Las transacciones externas deberán conservar:  
* provider transaction ID;  
* internal transaction ID;  
* external account;  
* internal account;  
* provider timestamp;  
* sync version;  
* reconciliation state.  
   
⸻  
   
## 3373. Sync Cursor  
Cada integración deberá conservar un cursor o checkpoint para evitar reimportar todo el historial.  
Campos:  
```
integrationId
resourceType
cursor
lastSyncedAt
lastSuccessfulObjectId
status

```
   
⸻  
   
## 3374. Idempotent Synchronization  
Una sincronización repetida deberá producir:  
```
same external record
→ same internal record

```
y nunca duplicados.  
   
⸻  
   
## 3375. Sync Conflict  
Tipos:  
```
category_conflict
amount_conflict
deleted_externally
modified_after_close
account_mapping_conflict
duplicate_external_record
posting_conflict

```
   
⸻  
   
## 3376. Conflict Record  
Campos:  
```
id
integrationId
resourceType
internalResourceId
externalResourceId
conflictType
internalValue
externalValue
resolutionStatus
resolvedBy
createdAt

```
   
⸻  
   
## 3377. Conflict Resolution  
Opciones:  
```
keep_internal
accept_external
merge
create_adjustment
ignore_external_change
manual_resolution

```
Toda resolución material deberá quedar auditada.  
   
⸻  
   
## 3378. Closed-Period Protection  
Una modificación externa sobre un periodo cerrado deberá:  
* generar conflicto;  
* evitar cambio silencioso;  
* requerir review;  
* evaluar reopening;  
* conservar snapshot anterior.  
   
⸻  
   
## 3379. External Deletion  
Una eliminación en QuickBooks/Xero no deberá borrar automáticamente el registro interno.  
Deberá almacenarse como evento:  
```
external_deleted

```
y entrar a revisión.  
   
⸻  
   
## 3380. External Posting  
Cuando SG Solutions envíe un asiento a un sistema externo deberá conservar:  
```
internalJournalEntryId
externalJournalEntryId
payloadHash
submittedAt
providerResponse
postingStatus

```
   
⸻  
   
## 3381. Posting Status  
```
not_sent
queued
submitted
accepted
rejected
unknown
reversed

```
   
⸻  
   
## 3382. Webhook Processing  
Cuando el provider soporte webhooks deberán ser:  
* autenticados;  
* validados;  
* timestamped;  
* idempotentes;  
* deduplicados;  
* enviados al Inbox;  
* auditados.  
   
⸻  
   
## 3383. Provider Polling  
Si no existen webhooks, deberá utilizarse polling controlado con:  
* rate limits;  
* cursor;  
* backoff;  
* retry;  
* failure threshold.  
   
⸻  
   
## 3384. Integration Failure  
Un fallo no deberá alterar el ledger incorrectamente.  
Deberá:  
* preservar último estado válido;  
* registrar error;  
* reintentar cuando proceda;  
* generar alerta;  
* permitir operación manual temporal.  
   
⸻  
   
## 3385. Integration Health  
Estados:  
```
healthy
warning
degraded
critical
offline

```
   
⸻  
   
## 3386. Automatización permitida  
Podrá automatizarse:  
* importación;  
* duplicate detection;  
* merchant normalization;  
* transaction matching;  
* transfer suggestions;  
* receipt matching;  
* categorization suggestions;  
* reminders;  
* reconciliation preparation;  
* anomaly detection;  
* report generation draft.  
   
⸻  
   
## 3387. Automatización condicionada  
Podrá automatizarse después de reglas aprobadas:  
```
known merchant
+
low amount
+
historical pattern
+
no tax ambiguity
+
open period

```
para crear:  
```
ready_for_review

```
Nunca deberá eliminar el review requerido por policy.  
   
⸻  
   
## 3388. Automatización prohibida por defecto  
No deberá ejecutarse automáticamente:  
* material journal posting;  
* prior-period adjustment;  
* opening-balance change;  
* hard close;  
* reopening;  
* write-off;  
* material owner-equity reclassification;  
* tax treatment final.  
   
⸻  
   
## 3389. AI Categorization Engine  
La IA podrá utilizar:  
* merchant;  
* description;  
* history;  
* similar transactions;  
* client profile;  
* account context;  
* prior bookkeeper decisions.  
Deberá producir:  
```
suggestedAccount
suggestedEconomicType
confidence
reasoningSummary
similarExamples

```
   
⸻  
   
## 3390. AI Confidence Gates  
Ejemplo:  
```
confidence >= 0.95
→ low-risk suggestion may enter fast review

0.75–0.94
→ standard review

< 0.75
→ manual classification required

```
Los thresholds deberán ser configurables.  
   
⸻  
   
## 3391. No AI Tax Deductibility Decision  
La IA podrá indicar:  
```
possible_tax_review_required

```
pero no deberá decidir definitivamente que un gasto es deducible.  
   
⸻  
   
## 3392. AI Anomaly Detection  
Podrá detectar:  
* unusual merchant;  
* amount spike;  
* revenue drop;  
* duplicate payment;  
* unusual owner activity;  
* unexpected transfer;  
* category drift;  
* reconciliation anomaly.  
   
⸻  
   
## 3393. Anomaly Result  
Campos:  
```
id
accountingBookId
transactionId
anomalyType
severity
confidence
baselineReference
description
reviewStatus
createdAt

```
   
⸻  
   
## 3394. Bookkeeping Administration Console  
Secciones:  
```
Overview
Clients
Books
Transactions
Rules
Reconciliations
Close
Reports
Tax Handoffs
Integrations
Work Queues
Analytics
Configuration
Security

```
   
⸻  
   
## 3395. Administrative Dashboard  
Deberá mostrar:  
* active books;  
* transactions pending;  
* uncategorized count;  
* questions pending;  
* unreconciled accounts;  
* periods awaiting close;  
* close blockers;  
* integration failures;  
* tax handoffs;  
* SLA risks.  
   
⸻  
   
## 3396. Bookkeeping Work Queues  
```
setup_review
transaction_review
client_questions
transfer_review
duplicate_review
reconciliation
adjustment_review
period_close
tax_handoff
integration_conflicts

```
   
⸻  
   
## 3397. Capacity Management  
La capacidad deberá considerar:  
* transaction volume;  
* account count;  
* monthly frequency;  
* complexity;  
* number of businesses;  
* reconciliation count;  
* backlog;  
* close deadlines.  
   
⸻  
   
## 3398. Bookkeeper Assignment  
Deberá considerar:  
```
skill
industry
entity_type
accounting_basis
transaction_volume
tax_integration
current_capacity

```
   
⸻  
   
## 3399. Security Model  
Deberá aplicar:  
* MFA;  
* RBAC;  
* ABAC;  
* resource-level access;  
* field-level access;  
* purpose-based access;  
* least privilege;  
* reauthentication;  
* immutable audit.  
   
⸻  
   
## 3400. Banking Data Protection  
Deberán protegerse:  
* account numbers;  
* statements;  
* bank-feed tokens;  
* processor credentials;  
* loan data;  
* financial exports.  
   
⸻  
   
## 3401. Bank Credentials  
SG Solutions Platform no deberá almacenar:  
* online banking passwords;  
* security questions;  
* MFA secrets del cliente.  
Las conexiones deberán usar proveedores o mechanisms autorizados.  
   
⸻  
   
## 3402. Financial Data Export  
Un export deberá registrar:  
```
requestedBy
purpose
book
period
dataTypes
maskingPolicy
expiresAt
generatedAt
downloadEvents

```
   
⸻  
   
## 3403. Export Formats  
Inicialmente:  
```
CSV
XLSX
PDF
tax_package
accounting_provider_export

```
   
⸻  
   
## 3404. Bulk Export Restrictions  
Un usuario no deberá poder descargar todos los libros del sistema salvo permiso explícito.  
Los exports masivos deberán requerir:  
* elevated permission;  
* reauthentication;  
* reason;  
* audit.  
   
⸻  
   
## 3405. Retention  
La retención podrá variar según:  
* books;  
* statements;  
* receipts;  
* journal entries;  
* reconciliations;  
* reports;  
* Tax-Ready Packages;  
* integration logs.  
No deberán eliminarse registros sujetos a Legal Hold.  
   
⸻  
   
## 3406. Bookkeeping Security Incident  
Tipos:  
```
cross_client_access
financial_account_exposure
bank_statement_exposure
unauthorized_export
credential_exposure
ledger_tampering
unauthorized_posting
integration_compromise

```
   
⸻  
   
## 3407. Unauthorized Ledger Change  
Un cambio no autorizado deberá:  
* bloquear session;  
* preservar evidence;  
* identificar recursos afectados;  
* abrir incident;  
* evaluar reversals;  
* notificar Compliance;  
* crear remediation.  
   
⸻  
   
## 3408. Audit Trail  
Deberá registrar:  
* imports;  
* classifications;  
* AI suggestions;  
* client answers;  
* rules;  
* journal entries;  
* adjustments;  
* reconciliations;  
* closes;  
* reports;  
* exports;  
* integrations;  
* tax handoffs.  
   
⸻  
   
## 3409. Operational Metrics  
```
transactions_imported
transactions_auto_suggested
transactions_manually_reviewed
uncategorized_rate
average_categorization_time
transfer_match_rate
receipt_match_rate
reconciliation_completion_rate
average_days_to_close
integration_failure_rate

```
   
⸻  
   
## 3410. Quality Metrics  
```
reclassification_rate
review_correction_rate
reconciliation_difference_rate
period_reopen_rate
tax_team_question_rate
uncategorized_at_close
material_adjustment_rate
duplicate_detection_rate

```
   
⸻  
   
## 3411. Client Metrics  
```
client_question_response_time
missing_document_rate
monthly_report_delivery_time
books_ready_for_tax_on_time
client_satisfaction

```
   
⸻  
   
## 3412. Bookkeeping Dashboards  
Dashboards iniciales:  
```
Bookkeeping Executive Dashboard
Bookkeeping Operations Dashboard
Transaction Quality Dashboard
Reconciliation Dashboard
Period Close Dashboard
Tax Readiness Dashboard
Integration Health Dashboard

```
   
⸻  
   
## 3413. KPI Governance  
Cada KPI deberá conservar:  
* definition;  
* owner;  
* numerator;  
* denominator;  
* source;  
* filters;  
* refresh cadence;  
* quality status.  
   
⸻  
   
## 3414. Alertas  
Alertas iniciales:  
```
bank_feed_disconnected
large_uncategorized_balance
reconciliation_overdue
period_close_overdue
integration_sync_failure
suspense_balance_material
tax_handoff_delayed
credential_expiring
unusual_owner_activity

```
   
⸻  
   
## 3415. Runbooks  
Runbooks mínimos:  
```
Bank Feed Failure
Accounting Integration Failure
Duplicate Import
Reconciliation Difference
Closed Period Changed Externally
Unauthorized Posting
Tax Handoff Failure
Bookkeeping Data Exposure

```
   
⸻  
   
## 3416. Business Continuity  
Durante un outage deberá poder:  
* consultar books;  
* ver period deadlines;  
* continuar manual classification;  
* registrar journal drafts;  
* almacenar imports pendientes;  
* preservar evidence;  
* reanudar sync sin duplicados.  
   
⸻  
   
## 3417. Backup Scope  
Deberá incluir:  
* Accounting Books;  
* Chart of Accounts;  
* source transactions;  
* classifications;  
* journal entries;  
* reconciliations;  
* close versions;  
* reports;  
* tax handoffs;  
* mappings;  
* integration metadata;  
* audit.  
   
⸻  
   
## 3418. Migration Framework  
Para clientes con libros existentes deberá soportarse:  
```
QuickBooks
Xero
CSV
Excel
legacy bookkeeping records

```
Proceso:  
```
inventory
→ map
→ import
→ validate
→ reconcile
→ opening balance confirmation
→ cutover

```
   
⸻  
   
## 3419. Migration Validation  
Antes del cutover deberá verificarse:  
* account balances;  
* Trial Balance;  
* Chart of Accounts;  
* bank accounts;  
* transaction date range;  
* outstanding issues;  
* duplicates;  
* cutoff date.  
   
⸻  
   
## 3420. Seed Data  
Codex deberá preparar:  
* bookkeeping service types;  
* economic transaction types;  
* account types;  
* system accounts;  
* connection types;  
* period statuses;  
* adjustment types;  
* reconciliation statuses;  
* work queues;  
* anomaly types;  
* integration statuses.  
   
⸻  
   
## 3421. Roadmap  
## Fase 1 — Manual Controlled Bookkeeping  
* Accounting Books;  
* Chart of Accounts;  
* imports;  
* transaction classification;  
* reconciliation;  
* reporting;  
* Tax-Ready Packages.  
## Fase 2 — Smart Automation  
* categorization rules;  
* merchant normalization;  
* transfer matching;  
* receipt matching;  
* AI suggestions;  
* anomaly detection.  
## Fase 3 — Accounting Integrations  
* QuickBooks;  
* Xero;  
* payment processors;  
* bank providers;  
* controlled synchronization.  
## Fase 4 — Advanced Accounting  
* AR;  
* AP;  
* payroll journals;  
* assets;  
* inventory;  
* project/class tracking;  
* advanced cash flow;  
* multi-entity capabilities.  
   
⸻  
   
## 3422. Permisos, APIs, eventos y workflows  
## Permisos  
```
bookkeeping.integration.read
bookkeeping.integration.manage
bookkeeping.integration.sync
bookkeeping.integration.resolve_conflict

bookkeeping.automation.read
bookkeeping.automation.manage
bookkeeping.ai.review

bookkeeping.admin.read
bookkeeping.admin.manage
bookkeeping.export.create
bookkeeping.analytics.read
bookkeeping.security.read
bookkeeping.audit.read
bookkeeping.module_admin

```
## APIs  
```
POST /api/bookkeeping/books/{id}/integrations
GET  /api/bookkeeping/integrations/{id}
POST /api/bookkeeping/integrations/{id}/sync
POST /api/bookkeeping/integrations/{id}/disconnect

GET  /api/bookkeeping/integrations/{id}/conflicts
POST /api/bookkeeping/integration-conflicts/{id}/resolve

POST /api/bookkeeping/books/{id}/ai-categorization
POST /api/bookkeeping/books/{id}/anomaly-detection

GET  /api/bookkeeping/admin/overview
GET  /api/bookkeeping/admin/work-queues
GET  /api/bookkeeping/analytics
POST /api/bookkeeping/books/{id}/exports

```
## Eventos  
```
BookkeepingIntegrationConnected
BookkeepingIntegrationSyncStarted
BookkeepingIntegrationSyncCompleted
BookkeepingIntegrationSyncFailed
BookkeepingIntegrationConflictDetected
BookkeepingIntegrationConflictResolved

BookkeepingAICategorizationSuggested
BookkeepingAnomalyDetected

BookkeepingExportGenerated
BookkeepingSecurityIncidentCreated
BookkeepingLegacyMigrationStarted
BookkeepingLegacyMigrationCompleted

```
## Workflows  
```
Bookkeeping Integration Setup Workflow
Bookkeeping Sync Workflow
Bookkeeping Integration Conflict Workflow
Bookkeeping AI Review Workflow
Bookkeeping Anomaly Review Workflow
Bookkeeping Export Workflow
Bookkeeping Security Incident Workflow
Bookkeeping Migration Workflow

```
   
⸻  
   
## 3423. Pruebas End-to-End  
## Escenario 1 — Bookkeeping mensual  
```
Engagement
→ Book Setup
→ Bank Import
→ Categorization
→ Client Questions
→ Reconciliation
→ Adjustments
→ Review
→ Close
→ P&L / Balance Sheet
→ Client Delivery

```
## Escenario 2 — Tax Handoff  
```
Year-End Close
→ Tax Mapping
→ Tax-Ready Package
→ Module 30
→ Tax Questions
→ Resolution
→ Tax Team Acceptance

```
## Escenario 3 — QuickBooks Sync  
```
Connect
→ Map Accounts
→ Import Transactions
→ Detect Duplicate
→ Classify
→ Export Approved Adjustment
→ Receive Provider Confirmation

```
## Escenario 4 — External Conflict  
```
Closed Period
→ transaction changed externally
→ conflict detected
→ book protected
→ human review
→ adjustment or reopening
→ resolved

```
## Escenario 5 — Bank Feed Failure  
```
Feed disconnects
→ alert
→ manual statement import
→ bookkeeping continues
→ feed reconnects
→ idempotent resync
→ duplicates prevented

```
## Escenario 6 — Security Incident  
```
Unauthorized export attempt
→ access denied
→ alert
→ incident
→ evidence preserved
→ investigation
→ corrective action

```
   
⸻  
   
## 3424. Criterios finales de aceptación del Módulo 31  
El Módulo 31 estará completo cuando:  
1. Exista Bookkeeping Service Catalog.  
2. Exista Bookkeeping Engagement.  
3. Exista Bookkeeping Case.  
4. Exista Accounting Entity.  
5. Las entidades estén aisladas.  
6. Exista Accounting Book.  
7. Exista double-entry foundation.  
8. Exista Chart of Accounts.  
9. Existan Journal Entries.  
10. Los asientos posteados sean inmutables.  
11. Existan Accounting Periods.  
12. Existan Opening Balances.  
13. Exista Financial Account Registry.  
14. Exista transaction ingestion.  
15. Existan bank feeds.  
16. Exista idempotencia.  
17. Exista duplicate detection.  
18. Exista merchant normalization.  
19. Se distingan income, expense y transfer.  
20. Loan proceeds no sean revenue.  
21. Loan principal no sea expense.  
22. Exista processor settlement.  
23. Exista personal/business separation.  
24. Existan mixed-use allocations.  
25. Existan splits.  
26. Exista transfer matching.  
27. Existan categorization rules.  
28. Exista AI suggestion con confidence.  
29. Existan Client Questions.  
30. Exista receipt matching.  
31. Exista reconciliation.  
32. No se permitan plug adjustments.  
33. Exista Period Close.  
34. Existan adjusting entries.  
35. Exista Close Review.  
36. Exista Trial Balance.  
37. Exista General Ledger.  
38. Exista Profit and Loss.  
39. Exista Balance Sheet.  
40. Se valide la ecuación contable.  
41. Exista Cash Flow dentro del scope soportado.  
42. Existan comparative reports.  
43. Exista variance analysis.  
44. Exista Client Report Package.  
45. Exista Tax Mapping.  
46. Exista Tax-Ready Package.  
47. Exista integración directa con Módulo 30.  
48. Tax handoff no genere filing automático.  
49. Exista Accounting Integration Registry.  
50. Exista source-of-truth configuration.  
51. Exista account mapping.  
52. Exista sync idempotente.  
53. Existan sync conflicts.  
54. Periodos cerrados estén protegidos de cambios externos.  
55. Existan webhooks o polling controlado.  
56. Exista Integration Health.  
57. Exista automatización limitada.  
58. IA no publique asientos materiales por defecto.  
59. IA no determine deducibilidad final.  
60. Exista anomaly detection.  
61. Exista Administration Console.  
62. Existan Work Queues.  
63. Exista Capacity Management.  
64. Exista RBAC/ABAC.  
65. Exista field-level protection.  
66. No se almacenen banking passwords.  
67. Exista Export Governance.  
68. Exista retention.  
69. Existan Security Incidents.  
70. Exista immutable audit.  
71. Existan operational metrics.  
72. Existan quality metrics.  
73. Existan dashboards.  
74. Existan alerts.  
75. Existan runbooks.  
76. Exista Business Continuity.  
77. Existan backups.  
78. Exista Migration Framework.  
79. Exista migration validation.  
80. Exista seed data.  
81. Exista roadmap.  
82. Existan permisos.  
83. Existan APIs.  
84. Existan eventos.  
85. Existan workflows.  
86. Existan pruebas end-to-end.  
87. Exista bilingüismo.  
88. Toda cifra tenga lineage.  
89. Toda modificación material sea trazable.  
90. El módulo pueda operar standalone o integrado.  
   
⸻  
   
## 3425. Instrucciones finales para Codex y cierre  
Antes de implementar:  
1. Lee las cuatro partes del Módulo 31.  
2. Reutiliza Organizations.  
3. Reutiliza Service Orders.  
4. Reutiliza Documents.  
5. Reutiliza Tasks.  
6. Reutiliza Approvals.  
7. Reutiliza Audit.  
8. Reutiliza Tax Cases.  
9. Reutiliza Integration Registry.  
10. No construyas un ERP completo.  
11. Implementa Accounting Integration abstraction.  
12. Implementa QuickBooks/Xero adapters como providers.  
13. No acoples lógica del dominio directamente a un provider.  
14. Implementa sync modes.  
15. Implementa source-of-truth configuration.  
16. Implementa field ownership.  
17. Implementa account mapping.  
18. Implementa Sync Cursor.  
19. Implementa idempotent synchronization.  
20. Implementa conflict detection.  
21. Implementa conflict resolution.  
22. Protege closed periods.  
23. No elimines datos internos porque se borren externamente.  
24. Implementa External Posting Records.  
25. Implementa authenticated webhooks.  
26. Implementa polling fallback.  
27. Implementa Integration Health.  
28. Implementa automation rules.  
29. Limita auto-posting.  
30. Implementa AI Categorization.  
31. Implementa confidence gates.  
32. Implementa AI Anomaly Detection.  
33. No permitas AI tax deductibility decisions.  
34. Implementa Administration Console.  
35. Implementa Work Queues.  
36. Implementa Capacity Management.  
37. Implementa bookkeeper assignment.  
38. Implementa least privilege.  
39. Implementa reauthentication.  
40. Protege banking data.  
41. No almacenes passwords bancarios.  
42. Implementa Export Governance.  
43. Implementa retention.  
44. Implementa Legal Hold integration.  
45. Implementa Security Incident workflows.  
46. Implementa Unauthorized Ledger Change handling.  
47. Implementa immutable audit.  
48. Implementa operational metrics.  
49. Implementa quality metrics.  
50. Implementa client metrics.  
51. Implementa dashboards.  
52. Implementa KPI governance.  
53. Implementa alerts.  
54. Implementa runbooks.  
55. Implementa Business Continuity.  
56. Implementa backups.  
57. Implementa Migration Framework.  
58. Implementa migration validation.  
59. Implementa seed data.  
60. Implementa roadmap por fases.  
61. Implementa permissions.  
62. Implementa APIs.  
63. Implementa events.  
64. Implementa workflows.  
65. Implementa end-to-end tests.  
66. No permitas duplicate sync.  
67. No permitas cambios externos silenciosos en closed periods.  
68. No permitas AI material posting por defecto.  
69. No permitas bulk exports sin elevated permission.  
70. No permitas borrar journal history.  
71. No permitas tax filing desde bookkeeping.  
72. No marques el módulo listo sin completar los seis escenarios end-to-end.  
## Verificación final  
Antes de cerrar, confirma:  
* ¿Puede funcionar sin QuickBooks/Xero?  
* ¿Puede integrarse después sin reescribir el ledger?  
* ¿Cada provider está aislado detrás de un adapter?  
* ¿Existe un Source of Truth claro?  
* ¿Los syncs son idempotentes?  
* ¿Los periodos cerrados están protegidos?  
* ¿Los conflictos externos requieren resolución?  
* ¿La IA solo sugiere dentro de límites?  
* ¿Los datos bancarios están protegidos?  
* ¿Los exports están gobernados?  
* ¿Puede continuar el bookkeeping durante un outage?  
* ¿Una migración reconcilia balances antes del cutover?  
* ¿El Tax-Ready Package llega correctamente al Módulo 30?  
* ¿Los seis escenarios end-to-end funcionan?  
* ¿Toda acción material queda auditada?  
## Estado final del Módulo 31  
```
MÓDULO 31:
BOOKKEEPING Y CONTABILIDAD

PARTES:
1. Fundamentos, libros, Chart of Accounts y periodos
2. Transacciones, categorización y reconciliación
3. Cierres, reportes y preparación fiscal
4. Integraciones, automatización, seguridad y cierre

ESTADO:
ESPECIFICACIÓN COMPLETA

```
  
  
