---
name: phase-completion
description: Cierra una fase de Project Atlas con evidencia verificable y actualiza la documentación viva.
---

# Phase Completion Report

Usa esta skill únicamente cuando todas las tareas de una fase estén implementadas y sus verificaciones hayan terminado correctamente.

1. Lee `AGENTS.md`, `PROJECT_STATE.md`, `PROJECT_MEMORY.md`, `DECISIONS.md` y el PRD del módulo.
2. Ejecuta los comandos de verificación declarados en la fase; no sustituyas resultados por afirmaciones.
3. Crea `docs/phases/PCR-AAAA-MM-DD-fase.md` con: estado, fecha, versión, responsable, objetivo, funcionalidades, archivos creados y modificados, datos y migraciones, APIs, UI, seguridad, pruebas, rendimiento, accesibilidad, SEO, riesgos, limitaciones, pendientes, dependencias y checklist final.
4. Actualiza `PROJECT_STATE.md` con el estado actual y `PROJECT_MEMORY.md` de forma append-only.
5. Actualiza `CHANGELOG.md` y `ROADMAP.md` cuando corresponda.
6. No declares completada una fase con pruebas fallidas, pendientes materiales o evidencia ausente.

El reporte debe diferenciar explícitamente lo realizado, lo validado, lo omitido y el siguiente paso autorizado.
