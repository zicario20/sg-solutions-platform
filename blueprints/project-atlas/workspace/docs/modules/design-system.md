# Module PRD — Design System

- Owner: Codex Architecture Agent
- Design method: UI/UX Pro Max through Codex
- Final approver: Product Owner
- Status: Approved visual baseline; detailed visual handoff and Build gate still required
- Catalog modules: M086–M088

## Purpose and value

Create one accessible visual language for the public site, client portal and admin workspace. The
brand should feel financially confident, modern, spacious and trustworthy—professional service plus
high-quality software, not a generic credit-repair template.

## Scope

- Three token layers: primitive → semantic → component.
- Typography, color, spacing, radius, elevation, motion, breakpoint and z-index primitives.
- Semantic surface/text/action/status/focus/disabled tokens.
- Component tokens and full states for buttons, fields, cards, tables, badges, alerts, dialogs,
  navigation, status timelines, file uploads and date/time controls.
- Responsive, bilingual and WCAG 2.2 AA requirements.
- Light-first theme; dark tokens defined but dark mode not published in v1.

## Approved primitives

- Heading: Manrope. Body/UI: Inter.
- Navy `#0A2540`; cobalt `#0B63CE`; cyan `#00A3E0`; green `#2E7D32`; gold `#B7791F`;
  surface `#F7F9FC`; dark ink derived for AA contrast.
- Spacing follows a documented 4px-based scale.
- Motion is subtle, generally 150–240ms, transform/opacity focused and disabled/reduced for
  `prefers-reduced-motion`.

Raw brand hex values belong only in primitive tokens. Semantic/component code may not hardcode
colors. Cyan and gold are accents and are not normal text on white/surface unless contrast testing
proves the exact token pair.

## Component states

Every interactive component specifies default, hover, active, focus-visible, disabled, loading,
error and success where applicable. State priority is disabled → loading → active → focus → hover →
default. State is never communicated by color alone. Focus indicators and component boundaries meet
3:1; body text meets 4.5:1.

## UX and accessibility

At 320px and 200% zoom, content reflows without losing core operations. Keyboard order is logical,
targets are at least 44×44px, errors are announced and associated with fields, loading changes use
appropriate live regions, and tables have mobile alternatives without removing information.
Important flows expose a visible next action and progressive disclosure.

## Bilingual requirements

Components support English/Spanish expansion without clipping. Do not place essential copy inside
images. Dates, currency and numbers use locale-aware formatting while stored codes/tokens remain
locale-neutral.

## Out of scope and acceptance

Final page mockups, a published dark theme and production logo vectorization are separate approved
design deliverables. Before UI implementation, UI/UX Pro Max must produce a persisted master design
system and relevant page/flow overrides. Acceptance requires token validation, contrast evidence,
keyboard/screen-reader review, responsive screenshots and Product Owner approval.
