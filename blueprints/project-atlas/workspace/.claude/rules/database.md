---
paths:
  - "packages/database/**"
  - "supabase/**"
---

# Database rules

- Drizzle es la única autoridad de esquema y migraciones.
- No alteres tablas, columnas, índices ni políticas desde el dashboard de Supabase.
- Toda migración debe ser reproducible, revisable y compatible con rollback o recuperación documentada.
- Las políticas RLS se versionan junto con el esquema y se prueban con identidades autorizadas y no autorizadas.
- Postgres conserva los estados duraderos; ningún coordinador externo es fuente de verdad.
