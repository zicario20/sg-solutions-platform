# UX/UI Guidelines

- Owner: Product Owner
- Maintainer: Design specialist through Codex using UI/UX Pro Max
- Status: Approved direction; detailed page/flow handoff remains gated
- Update rule: synchronize design tokens, module PRDs and accessibility evidence

## Experience direction

SG Solutions must feel like a premium financial-services company and a modern software product, not
a generic credit site. Use generous whitespace, concise copy, strong hierarchy, trustworthy
imagery/illustration and subtle purposeful movement. Public pages optimize clarity/trust/conversion;
the portal optimizes current status and next action; admin optimizes efficient, safe work.

## Token architecture

Use primitive → semantic → component layers. Raw values live only in primitives; components consume
semantic/component tokens. Dark-theme semantic tokens are defined for future compatibility but dark
mode is not published in v1.

- Manrope for headings; Inter for body/UI.
- Navy `#0A2540`, cobalt `#0B63CE`, cyan `#00A3E0`, green `#2E7D32`, gold `#B7791F`, surface
  `#F7F9FC`.
- Cyan/gold are accents, not normal text on white/surface without verified contrast.
- Spacing uses a documented 4px-based scale; component size and density adapt by surface.
- Motion generally uses 150–240ms transform/opacity transitions and honors reduced motion.

## Accessibility and responsive behavior

Meet WCAG 2.2 AA. Normal text requires 4.5:1; large text, focus and UI component boundaries require
3:1. Support keyboard, visible focus, screen readers, 44×44px targets, accessible errors/loading,
200% zoom and reflow at 320px. No state or instruction relies only on color, hover, drag or motion.

## Component handoff

Buttons, fields, cards, tables, badges, alerts, dialogs, navigation, timelines, uploads, date/time
controls and financial states specify default/hover/active/focus/disabled/loading/error/success as
applicable. Before an important UI is implemented, UI/UX Pro Max must persist the approved master
system and page/flow overrides with responsive and bilingual evidence.

Existing logo imagery requires vectorization, small-size lockups, monochrome variants and approved
asset provenance before production release; the supplied raster images are reference inputs, not
the final responsive asset package.
