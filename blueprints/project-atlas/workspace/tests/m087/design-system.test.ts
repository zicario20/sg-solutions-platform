import { describe, expect, it } from "vitest";

import {
  createDesignComponentDefinition,
  createDesignSystemConfiguration,
  prepareComponentRender,
  requestDesignRelease,
} from "../../packages/design-system/src/index";

describe("M087 design system controlled foundation", () => {
  it("preserves the current visual system and does not render components", () => {
    const configuration = createDesignSystemConfiguration({
      permission: "design.system.configure",
      code: "SG_APPROVED_BASELINE",
    });
    const component = createDesignComponentDefinition({
      permission: "design.component.create",
      componentCode: "CLIENT_ACTION_CARD",
      configuration,
      category: "data_display",
      accessibilityContractReference: "a11y:action-card-v1",
    });
    const render = prepareComponentRender({ permission: "design.component.render", component });

    expect(configuration.tokenSource).toBe("@atlas/design-tokens");
    expect(configuration.currentVisualSystemPreserved).toBe(true);
    expect(render.status).toBe("blocked_runtime_disabled");
    expect(render.rendered).toBe(false);
  });

  it("rejects styling as a substitute for authorization", () => {
    const configuration = createDesignSystemConfiguration({
      permission: "design.system.configure",
      code: "SG_BASELINE",
    });

    expect(() =>
      createDesignComponentDefinition({
        permission: "design.component.create",
        componentCode: "UNSAFE_ADMIN_BUTTON",
        configuration,
        category: "form",
        accessibilityContractReference: "a11y:button-v1",
        usesVisualStateAsAuthorization: true,
      }),
    ).toThrow("cannot substitute authorization");
  });

  it("requires review before any design release could activate", () => {
    const configuration = createDesignSystemConfiguration({
      permission: "design.system.configure",
      code: "SG_RELEASE_BASELINE",
    });
    const release = requestDesignRelease({
      permission: "design.release.request",
      releaseCode: "RELEASE_001",
      configuration,
    });

    expect(release.status).toBe("review_required");
    expect(release.packageActivated).toBe(false);
    expect(release.accessibilityReviewCompleted).toBe(false);
  });
});
