---
paths:
  - "apps/app/**"
  - "packages/auth/**"
  - "packages/domain/**"
---

# Security rules

- Cyber Neo is required before the release gate for auth/RLS/Storage, Stripe, documents or sensitive data, migrations, CI/deploy, telemetry and AI access to client data.
- Cyber Neo is read-only: it does not run the application, install or fix dependencies, modify the project or reveal secret values. A separate corrector applies confirmed findings with regression tests and requests re-audit.

- Separa identidad, rol interno y acceso al expediente.
- El correo o la condición de cliente nunca conceden acceso implícito a recursos.
- Todo caso, documento, factura y cita de cliente requiere una concesión explícita y revocable.
- Aplica autorización en dominio y Postgres/RLS; la interfaz solo refleja la decisión.
- Registra decisiones sensibles sin secretos ni contenido privado.
