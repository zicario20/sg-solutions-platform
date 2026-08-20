export const DESIGN_TOKENS_PACKAGE_ID = "@atlas/design-tokens";

export const designTokens = {
  primitive: {
    color: {
      navy: "#0A2540",
      cobalt: "#0B63CE",
      cyan: "#00A3E0",
      green: "#2E7D32",
      gold: "#B7791F",
      surface: "#F7F9FC",
      white: "#FFFFFF",
      slate: "#334155",
      border: "#D9E2EC",
      error: "#B42318",
    },
    font: {
      heading: '"Manrope Variable", Manrope, "Inter Variable", Inter, system-ui, sans-serif',
      body: '"Inter Variable", Inter, system-ui, sans-serif',
    },
    radius: {
      control: "12px",
      card: "20px",
      pill: "999px",
    },
  },
  semantic: {
    text: {
      heading: "#0A2540",
      body: "#334155",
      inverse: "#FFFFFF",
    },
    action: {
      primary: "#0B63CE",
      primaryHover: "#084EAA",
      focus: "#00A3E0",
    },
    progress: {
      positive: "#2E7D32",
    },
    surface: {
      canvas: "#FFFFFF",
      subtle: "#F7F9FC",
      strong: "#0A2540",
    },
    border: {
      subtle: "#D9E2EC",
    },
  },
  component: {
    control: {
      minSize: "44px",
      radius: "12px",
    },
    card: {
      radius: "20px",
    },
  },
} as const;

export function toCssVariables(): string {
  return [
    `--color-brand-navy: ${designTokens.primitive.color.navy};`,
    `--color-brand-cobalt: ${designTokens.primitive.color.cobalt};`,
    `--color-brand-cyan: ${designTokens.primitive.color.cyan};`,
    `--color-brand-green: ${designTokens.primitive.color.green};`,
    `--color-brand-gold: ${designTokens.primitive.color.gold};`,
    `--color-surface-subtle: ${designTokens.semantic.surface.subtle};`,
    `--color-text-heading: ${designTokens.semantic.text.heading};`,
    `--color-text-body: ${designTokens.semantic.text.body};`,
    `--color-action-primary: ${designTokens.semantic.action.primary};`,
    `--color-action-primary-hover: ${designTokens.semantic.action.primaryHover};`,
    `--color-focus: ${designTokens.semantic.action.focus};`,
    `--color-progress-positive: ${designTokens.semantic.progress.positive};`,
    `--color-border-subtle: ${designTokens.semantic.border.subtle};`,
    `--font-heading: ${designTokens.primitive.font.heading};`,
    `--font-body: ${designTokens.primitive.font.body};`,
    `--control-min-size: ${designTokens.component.control.minSize};`,
    `--radius-control: ${designTokens.component.control.radius};`,
    `--radius-card: ${designTokens.component.card.radius};`,
  ].join("\n");
}
