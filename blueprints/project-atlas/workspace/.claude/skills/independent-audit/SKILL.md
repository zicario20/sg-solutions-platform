---
name: independent-audit
description: Audita de forma independiente un cambio de Project Atlas sin modificar código durante la revisión inicial.
---

# Independent Audit

No asumas que la implementación es correcta ni la apruebes solo porque las pruebas pasan.

1. Lee `AGENTS.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATE.md`, el PRD del módulo y las decisiones arquitectónicas aplicables.
2. Inspecciona el diff completo y confirma el alcance autorizado.
3. Revisa requisitos, arquitectura, seguridad, privacidad, autorización, integridad, idempotencia, errores, concurrencia, rendimiento, accesibilidad, duplicación, pruebas, documentación y compatibilidad.
4. No modifiques archivos durante la auditoría inicial.
5. Para cada hallazgo informa severidad (`blocker`, `high`, `medium`, `low`), archivo y ubicación, problema, evidencia, comportamiento esperado, corrección recomendada y prueba de regresión.
6. Si no hay hallazgos materiales, enumera lo inspeccionado y la evidencia que sostiene la aprobación.

Tras las correcciones, repite la revisión sobre el diff acumulado y confirma que cada hallazgo fue corregido o rechazado con evidencia.
