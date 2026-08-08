---
paths:
  - "apps/www/**"
  - "apps/app/**"
  - "packages/ui/**"
  - "packages/design-tokens/**"
---

# UI rules

- Before implementing a visual surface, use UI/UX Pro Max to detect the stack, generate and persist `design-system/project-atlas/MASTER.md`, and document page overrides.
- Apply its priorities in order: accessibility, touch/interaction, performance, style consistency, responsive layout, typography/color, motion, forms, navigation and charts.
- Before delivering UI, use the canonical `references/pro-rules.md` checklist; interactive controls are at least 44x44px and motion respects `prefers-reduced-motion`.

- Usa tokens semánticos y componentes compartidos; no dupliques valores visuales sin justificación.
- Todo flujo importante funciona en inglés y español.
- Cumple WCAG 2.2 AA, navegación por teclado, foco visible, etiquetas, estados de error y reducción de movimiento.
- El cian y el dorado no se usan como texto normal sobre blanco por contraste insuficiente.
- El portal prioriza claridad de estado, privacidad y acción siguiente; el sitio público prioriza confianza y conversión.
