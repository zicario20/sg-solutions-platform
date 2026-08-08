# Module Status and Gates

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Approved governance model
- Update rule: cambiar estados o gates solo mediante decisión registrada y sincronización con AGENTS y PCR

## Estados

`Registered → Specified → Ready → In Progress → Verification → PO Acceptance → Operational`

| Estado | Significado | Evidencia mínima |
|---|---|---|
| Registered | Capacidad inventariada con horizonte y dependencias conceptuales. | Fila completa en el catálogo. No autoriza implementar. |
| Specified | PRD del módulo aprobado. | Requisitos, alcance, riesgos, datos, approvals y criterios de aceptación. |
| Ready | Gates previos cerrados y tarea autorizada. | Arquitectura, UX/UI cuando aplique, seguridad y dependencias listas. |
| In Progress | Trabajo activo en alcance aprobado. | Propietario, trazabilidad y evidencia de proceso. |
| Verification | Implementación terminada, bajo pruebas y auditorías. | Checks automatizados, revisión independiente y Cyber Neo cuando aplica. |
| PO Acceptance | Resultado presentado al Product Owner. | Evidencia, limitaciones y decisiones pendientes. |
| Operational | Capacidad aceptada y operable. | PCR, runbook/rollback, monitoreo y documentación viva actualizada. |

## Gates

| Gate | Pregunta de control | Bloquea si falta |
|---|---|---|
| Product | ¿El problema, usuario, resultado y alcance están aprobados? | PRD o decisión del Product Owner. |
| Architecture | ¿Reutiliza primitivas, respeta límites y documenta providers/datos? | ADR requerido o dependencias ambiguas. |
| UX/Security | ¿La experiencia importante está aprobada y los riesgos/approvals están definidos? | Handoff UI/UX o threat/privacy review aplicable. |
| Build | ¿El Product Owner autorizó explícitamente `GENERATE` y el alcance de cambio controlado? | Estado distinto de Ready, `GENERATE` no autorizado o tarea no autorizada. |
| Quality | ¿Pruebas, accesibilidad, rendimiento y auditorías independientes aportan evidencia fresca? | Gate fallido, hallazgo material sin resolver o autoauditoría. |
| Release | ¿Es recuperable, observable y aceptado? | Falta PCR, rollback, documentación viva o aprobación requerida. |

## Cierre obligatorio

Cada módulo que alcanza `Operational` produce un Phase Completion Report y actualiza `PROJECT_STATE.md`, `PROJECT_MEMORY.md`, `DECISIONS.md` si hubo decisión y `CHANGELOG.md`. Ningún agente puede interpretar `Registered` o `Specified` como permiso implícito para escribir código.
