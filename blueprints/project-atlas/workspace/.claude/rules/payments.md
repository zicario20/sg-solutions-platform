---
paths:
  - "packages/domain/src/billing.ts"
  - "packages/domain/src/payments.ts"
  - "apps/app/app/api/webhooks/stripe/**"
---

# Payment rules

- Stripe es autoridad del estado financiero externo; Postgres conserva el estado operacional local.
- Verifica firma y persiste cada evento antes de procesarlo.
- Tolera eventos duplicados y fuera de orden mediante claves de idempotencia y transiciones monotónicas.
- Usa idempotency keys al crear o modificar recursos de Stripe.
- Implementa reconciliación y una recuperación manual auditable; nunca registres secretos ni datos completos del medio de pago.
