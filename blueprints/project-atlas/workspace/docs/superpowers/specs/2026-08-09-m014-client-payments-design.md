# M014 Client Payments and Billing — UX/UI and experience specification

- Owner: Codex Architecture Agent using UI/UX Pro Max
- Final approver: Product Owner
- Status: Product/Architecture design candidate; no visual Build gate
- Surfaces: Client Portal, bounded Public quote/payment handoff and Admin billing contribution
- Brand baseline: Manrope, Inter, navy/cobalt/cyan/green/gold, light-first, subtle motion
- Accessibility: WCAG 2.2 AA and reduced-motion support

## 1. Experience objective

The M014 experience must make money state understandable without making the client interpret Stripe,
accounting or internal operations. In one scan a client should know:

1. what service/obligation this is;
2. the exact approved amount and currency;
3. whether action is required;
4. whether the provider is still processing or SG Solutions has confirmed the financial fact;
5. whether the service is still pending human review;
6. the one safest next action.

The governing experience sentence is:

> Payment can satisfy a financial requirement; SG Solutions still reviews and authorizes the
> service separately.

The portal never resembles a bank account, wallet, credit offer or self-service refund console.

## 2. Brand and art direction

The current SG Solutions logo combines growth, business, credit and home ownership with metallic
blue, green and gold. The product translates that meaning into a restrained financial-services
interface rather than reproducing the logo's gradients, flares and density throughout the UI.

### Typography

- Manrope: page titles, amount totals, section headings and decisive status labels.
- Inter: body, line-item labels, metadata, help text, forms and controls.
- Tabular numerals are enabled for aligned money columns when available.
- Amount hierarchy never relies on extreme display type; trust comes from clarity and alignment.

### Color roles

- Navy `#0A2540`: primary text, page frame and high-trust headings.
- Cobalt `#0B63CE`: primary action, active navigation and focused interactive emphasis.
- Green `#2E7D32`: confirmed success only when accompanied by a text/icon state.
- Surface `#F7F9FC`: quiet section backgrounds and card grouping.
- Cyan `#00A3E0`: decorative data accent/progress detail, not normal light-surface text.
- Gold `#B7791F`: restrained quote/fee accent or brand detail, not normal light-surface text.

Cyan and gold are decorative accents on light backgrounds; they are not the sole essential boundary
or normal text. Normal text must meet 4.5:1 and large text/icons/control boundaries 3:1. Exact token
combinations require automated and manual contrast validation before Build.

### Shape, depth and imagery

- 12–16px card radius, quiet 1px borders and soft shallow shadow only for layered handoff surfaces.
- Financial rows stay flat and aligned; excessive floating cards would reduce scanability.
- Use simple line icons for receipt, calendar, shield, document and support.
- No stock cash piles, credit-score gauges, celebratory confetti, fake bank seals or guaranteed-
  outcome imagery.
- Logo use is limited to shell/receipt branding and follows clear-space requirements; no image
  stretching or improvised recoloring.

### Motion

- 160–220ms opacity/position transitions for accordion/detail changes.
- Processing uses a calm indeterminate indicator plus live text; no infinite high-motion spinner.
- Confirmed state may use a single subtle check transition, never confetti.
- `prefers-reduced-motion` removes nonessential movement and preserves immediate state change.

## 3. Information architecture and conceptual routes

Exact route names remain a Build decision. The experience requires these canonical destinations:

```text
/client/payments
  ├── payment/obligation detail
  ├── quote review/acceptance
  ├── provider return verification
  ├── invoice/receipt handoff
  └── billing support handoff
```

A PAY-016-approved public flow may use one clean localized quote/payment entry plus a generic clean
return. Provider IDs, customer IDs, amount, email, service-sensitive text and card facts never enter
an SG route. Public entry capability and provider return handle are separate purpose-bound values.
GET/HEAD renders only an inert generic landing and cannot inspect protected content, consume a token,
accept a quote, create Checkout or mutate state. An explicit user-initiated POST/OTP exchange uses
exact Origin, Fetch Metadata and CSRF/bootstrap controls to establish only an opaque host-only
SameSite session. Before personalized content or third-party subresources, the flow performs a clean
redirect/history replacement under `Referrer-Policy: no-referrer`; token transport is excluded or
redacted from edge/app logs, analytics, errors, caches and service workers. Cleanup is mandatory,
never best effort.

The permanent client navigation remains simple:

```text
Home
Mis servicios / My Services
Estado / Process Status
Documentos / Documents
Citas / Appointments
Mensajes / Messages
Pagos / Payments
Ayuda / Help
Configuración / Settings
```

M014 adds no top-level navigation for Quotes, Invoices, Refunds, Disputes or Stripe. They are states
and detail sections inside Payments.

## 4. Payments landing page

### Header

- Eyebrow: `Portal del cliente / Client portal`.
- H1: `Pagos y facturación / Payments & billing`.
- Supporting copy: one sentence about reviewing obligations, confirmed payments and documents.
- Optional privacy-safe help action: `Contactar facturación / Contact billing`.

### Priority summary

At most one priority financial action appears above history:

- `Review quote`;
- `Pay securely`;
- `Payment is processing`;
- `Action needed` with a safe support path;
- no card when no financial action exists.

It uses M014's deterministic client-safe action, not browser inference or live Stripe fan-out.
Payment priority does not outrank M008 globally by itself; M008 owns cross-domain priority.

### Sections

1. `Requires attention` — only authorized actionable obligations.
2. `Recent activity` — bounded reconciled payment/invoice/refund facts.
3. `Documents` — authorized invoices/receipts, linked rather than duplicated.

Filters remain minimal in Release 1A: `All`, `Pending`, `Completed`. Refund/dispute can appear as
status chips inside existing entries; separate tabs are deferred until volume justifies them.

### Privacy behavior

- No total account balance or lifetime spending by default.
- No client/provider identifiers, internal notes, dispute reasons or precise service-sensitive text.
- Amounts are visible only after authorization and may be suppressed by PAY-014 on shared/sensitive
  summary surfaces.
- Personalized HTML/JSON is private/no-store and excluded from session replay.

## 5. Billing card

A card or mobile list item contains:

1. approved safe service label;
2. public billing reference;
3. semantic status icon + text;
4. exact amount/currency or approved safe omission;
5. optional due fact if PAY-014 permits it;
6. freshness/processing note when relevant;
7. one primary action and at most one secondary detail action.

Example structure, never literal unapproved pricing:

```text
Business formation
Reference •••• 4821

Deposit due                         — [approved currency]
Status                              Payment pending

[Pay securely]                      [View details]
```

No fake price, example card number or unapproved Illinois filing fee appears in production copy or
fixtures presented as factual.

## 6. Quote review and acceptance

The quote screen follows a top-to-bottom decision sequence:

1. safe service/scope summary;
2. typed line items grouped as SG service fee, government/provider fee, discount and tax when
   approved;
3. subtotal, adjustment and total with currency;
4. payment schedule/deposit statement only if PAY-003 closes;
5. validity date/time with display zone;
6. bilingual terms/disclosures and version evidence;
7. acceptance control;
8. `Accept and continue` or equivalent single primary action.

Rules:

- Quote acceptance and payment remain visibly separate steps.
- Terms are never hidden behind a prechecked checkbox.
- The client can download/view an accessible copy only through an authorized document/handoff.
- An expired/superseded quote disables acceptance and routes to support/new quote.
- Any server/version conflict reloads the complete quote; it never silently accepts another price.
- Locale switch preserves the same exact quote/version and updates only approved presentation.

## 7. Payment detail

### Summary band

- semantic status;
- total obligation;
- confirmed allocation;
- amount remaining when allowed;
- trusted `as of`/freshness text;
- separate service status: `Pending internal review`, not inferred `In progress`.

### Line items

Accessible description list/table with:

- item label;
- ownership/type badge where needed (`SG Solutions fee`, `Government fee`);
- amount/currency;
- adjustment/discount;
- total.

### Activity

Client-safe facts only:

- quote accepted;
- Checkout started (optional/minimized);
- payment processing/confirmed/failed;
- invoice issued/paid;
- refund requested/processing/confirmed when approved;
- dispute status only under PAY-007/PAY-014 copy.

Provider event IDs, internal review, webhook attempts, failure codes and staff identities are absent.

### Actions

- `Pay securely` only for an eligible open obligation.
- `Try again` creates/recovers a server operation; it never duplicates an obligation.
- `View receipt/invoice` is an authorized no-store handoff.
- `Contact billing` creates a bounded support route, not a refund promise.

## 8. Hosted Checkout handoff

Before redirect:

- show exact server-projected total/currency and approved line items;
- label Stripe as the secure payment provider without claiming unsupported compliance;
- state that card data is entered on Stripe's hosted page;
- warn not to send card details through messages or calls;
- provide an accessible cancel/back action that does not cancel the service.

The handoff button remains disabled only while the server creates/recovers the operation. Repeated
activation uses the same idempotent command. It does not display the Checkout URL, provider session
or client secret.

Immediately before navigation, the server validates the destination against the exact activated
HTTPS provider scheme, host/path policy and provider object bound to the authorized operation.
User-supplied, unbound or database-tampered destinations fail closed; no generic redirect parameter
is accepted. Scanner/prefetch, forwarded-link, replay, concurrent exchange, browser back/history,
referrer and access-log cases are required design/security tests.

Opening provider content in the same tab is preferred for continuity unless accessibility/security
testing proves a new window necessary. If a new window is used, its behavior is announced before
activation.

## 9. Return verification experience

The return page has three authoritative projections:

### Verifying

- heading: `Estamos verificando tu pago / We're verifying your payment`;
- calm progress indicator and live-region update;
- explanation that provider confirmation may take a moment;
- safe `Return to payments` and support path after a bounded wait.

### Confirmed

- heading: `Pago confirmado / Payment confirmed`;
- amount/receipt only if the actor remains authorized;
- separate next step: `SG Solutions will review your service before work begins`;
- no claim of filing, credit result, appointment confirmation or service start.

### Not completed or unavailable

- neutral copy: `We could not confirm this payment yet`;
- `Try payment again` only if current obligation state permits;
- no raw decline reason or blame;
- generic support route.

The success/cancel query/route never chooses these states. The page reads reconciled Postgres. Polling
is bounded, backoff-based, visibility-aware and stops on navigation/background threshold.

## 10. Invoices and receipts

### List presentation

- document type;
- safe service label;
- issue/payment date;
- exact authorized amount/currency;
- status;
- one `View` or `Download` action.

### Handoff

- exact resource authorization and freshness check occurs on activation;
- loading copy says the secure document is being prepared;
- expired/revoked provider destination is regenerated/recovered server-side;
- no permanent URL is copied to ordinary UI, logs or browser storage;
- SG-generated bytes use M011's private delivery/audit contract.

The receipt clearly states it is payment evidence and not the service agreement. Invoice numbering,
tax and legal content await PAY-004/PAY-010.

## 11. Refund and dispute presentation

Release 1A may show only provider-reported facts and a billing-support action. A self-service refund
button is prohibited until PAY-006.

### Refund

Semantic states:

- `Requested`;
- `Under review`;
- `Submitted to payment provider`;
- `Processing`;
- `Refund confirmed`;
- `Could not be completed — contact billing`.

Never say `Refunded` at internal approval/submission time.

### Dispute

Use neutral, non-accusatory language. Internal evidence, reason, deadlines and operating decisions
stay in Admin. Client-facing controls/copy require PAY-007/PAY-014 and may default to support only.

## 12. Processing, failure and reconciliation language

| Canonical situation | Spanish | English | Primary action |
|---|---|---|---|
| Obligation open | Pago pendiente | Payment pending | Pagar de forma segura / Pay securely |
| Provider processing | Pago en procesamiento | Payment processing | Esperar / no duplicate action |
| Confirmed | Pago confirmado | Payment confirmed | Ver recibo / View receipt |
| Failure, retry allowed | El pago no se completó | Payment wasn't completed | Intentar de nuevo / Try again |
| Provider unavailable | No podemos verificarlo ahora | We can't verify it right now | Volver más tarde / Contact billing |
| Reconciliation needed | Estamos revisando el estado | We're reviewing the status | Contact billing if urgent |
| Quote expired | La cotización venció | The quote expired | Solicitar actualización / Request update |
| Refund processing | Reembolso en procesamiento | Refund processing | No duplicate request |

`Failed`, `declined`, `fraud`, `chargeback lost` and provider error codes are not copied verbatim
without approved client-safe mapping.

## 13. Empty, loading, partial and error states

### No billing records

`Aún no tienes pagos registrados / You don't have any payments yet.`

Do not create a sales CTA or imply the user lacks an active service; M009 owns contracted services.

### No pending payments

`No tienes pagos pendientes / You have no pending payments.`

This state appears only from a complete authorized source. Unavailable billing cannot become this
empty state.

### Partial/stale

Show the last confirmed safe fact plus `We're checking for an update`. Disable actions whose safety
depends on current provider state and offer support/retry.

### Hidden/unauthorized

Use the same not-found shell as an absent private resource. No count, title, amount or ownership hint.

### Error summary

Validation errors appear at the top and inline, associate to controls, preserve safe input and move
focus to the summary. Financial/provider internals are replaced by a stable localized message and
correlation reference suitable for support.

## 14. Admin billing contribution

Admin navigation may place billing inside `Services`, `Payments` or `Reports` according to M086; it
does not add a separate Stripe application shell.

### Finance queue

- processing beyond freshness budget;
- amount/currency/object mismatch;
- unknown/unallocated provider object;
- refund/dispute action required;
- external-payment verification after PAY-008;
- post-restore reconciliation.

### Detail layout

1. immutable obligation and line-item snapshot;
2. provider fact timeline;
3. allocation/current exposure;
4. service order and human authorization shown separately;
5. approval/reconciliation tasks;
6. minimized audit references;
7. exact permitted command area.

Dangerous actions use review screens, reason codes, expected version, amount confirmation and
separate approver when policy requires. UI role hiding is convenience only; domain/RLS enforcement
is mandatory.

### Provider diagnostics

Provider IDs may be revealed only to exact finance/support roles and remain copy-restricted where
practical. Raw webhook payload, secrets, full URLs/card data and protected dispute evidence are never
ordinary Admin UI.

## 15. Responsive behavior

### Mobile 320–767px

- One column, 16px side padding and bottom-safe primary action.
- Money summary precedes detail; line items use label/value rows rather than clipped tables.
- Status and amount do not compete on one narrow line.
- Touch targets are at least 44×44 CSS px; no horizontal scroll at 320px.
- Sticky payment CTA appears only when content/terms acknowledgement remains visible and accessible.

### Tablet 768–1023px

- Two-column detail when reading order remains logical: summary/action and line items/activity.
- Finance table may preserve selected columns; overflow becomes controlled card/detail navigation.

### Desktop 1024px+

- Maximum readable content width around 1120–1200px.
- Landing may use priority card plus activity panel; detail may use 8/4 grid.
- Money columns align numerically; help/action rail never obscures terms.

All breakpoints preserve DOM reading order and do not hide financially material content.

## 16. Accessibility

- One H1 and logical headings; no heading used solely for visual size.
- Money uses readable localized text plus machine-consistent currency; symbols alone do not identify
  currency.
- Status changes use `aria-live="polite"`; errors requiring immediate action use a controlled alert.
- Progress indicators have accessible names and a bounded update strategy.
- Tables have captions/headers; mobile transformations preserve label/value semantics.
- Focus is visible, not color-only and restored after dialogs/provider return.
- Dialogs are reserved for confirmation, trap/restore focus and never contain essential long terms.
- Links and buttons use action-specific names (`View invoice 1042`, not repeated `View`).
- Acceptance checkboxes are not prechecked and have full accessible term association.
- Timeout/expiry warning is announced and allows extension/recovery when policy permits.
- 200%/400% zoom, 320px reflow, screen readers, keyboard-only, high contrast and reduced motion are
  included in future acceptance tests.

## 17. Bilingual content contract

- Spanish and English share one locale-neutral financial state and exact amount.
- Quote terms/disclosures are approved as versioned pairs; missing parity blocks sending/acceptance.
- Dates name the time zone when material; money always names currency where symbol is ambiguous.
- Translation does not alter price type, obligation, refundability, due date or provider status.
- Provider/legal copy remains attributed and is not machine-translated as an SG legal representation.
- Locale change preserves resource, version, idempotency and form/acceptance state.
- Error and support language is written for plain-language financial comprehension, not literal SDK
  terminology.

## 18. Analytics and privacy

Candidate coarse events after PAY-014/analytics approval:

- `billing_landing_viewed`;
- `billing_item_opened`;
- `quote_review_opened`;
- `checkout_handoff_requested`;
- `payment_return_state_viewed` with coarse semantic state;
- `billing_document_handoff_requested`;
- `billing_support_requested`.

Prohibited payloads include user/client/service/payment/provider IDs, amount, currency tied to
identity, quote terms, invoice/refund/dispute details, payment-method summary, URL, failure code,
email/contact, free text and session replay. Financial conversion/reporting uses authorized internal
operational facts, not client analytics.

## 19. Component inventory for a future Build gate

- `BillingPageHeader`
- `FinancialPriorityCard`
- `BillingStatusChip`
- `MoneyValue`
- `BillingItemCard`
- `BillingList`
- `QuoteSummary`
- `BillingLineItemList`
- `TermsAcknowledgement`
- `CheckoutHandoffPanel`
- `PaymentReturnStatus`
- `FinancialFreshnessNotice`
- `PaymentActivityTimeline`
- `BillingDocumentList`
- `SecureDocumentHandoff`
- `BillingSupportAction`
- `FinancialEmptyState`
- `FinancialUnavailableState`
- `AdminFinanceQueue`
- `AdminFinancialSnapshot`
- `DangerousFinancialActionReview`

Components consume typed Client/Public/Staff DTOs and cannot import provider SDKs, compute canonical
amounts, mutate state directly or authorize by visibility.

## 20. Design acceptance checklist

- [ ] Product Owner approves the M014 experience direction.
- [ ] PAY-001–PAY-020 copy/policy/activation dependencies remain explicit.
- [ ] Payments landing reveals one safe priority and no false empty/zero state.
- [ ] Quote clearly separates line items, fees, total, terms, acceptance and payment.
- [ ] Provider return verifies Postgres state and never marks payment.
- [ ] Payment confirmed and service approval/start are visually and semantically separate.
- [ ] Refund approval/submission/provider completion are distinct.
- [ ] Client/Public/Staff designs expose no internal/provider/security fields.
- [ ] Provider destinations are transient, no-store and not displayed/copied.
- [ ] No dark patterns, hidden fees, forced extras or fake urgency.
- [ ] ES/EN semantic parity and versioned terms are reviewed.
- [ ] Mobile 320px, desktop, keyboard, screen reader, zoom and reduced motion are validated.
- [ ] Normal text contrast 4.5:1 and large text/icon/control contrast 3:1 are measured.
- [ ] Cyan/gold remain decorative on light surfaces.
- [ ] No product behavior, route, component or Stripe integration is claimed by this design.
