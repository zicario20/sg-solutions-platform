import { describe, expect, it } from "vitest";

import {
  createExperienceStateDefinition,
  createInteractionContract,
  createUserJourneyDefinition,
  createUxPrinciplesConfiguration,
  evaluateUserJourney,
} from "../../packages/ux-principles/src/index";

describe("M088 UX principles controlled foundation", () => {
  it("keeps provider and human wait states explicit without rendering them", () => {
    const configuration = createUxPrinciplesConfiguration({
      permission: "ux.configuration.create",
      code: "CLIENT_JOURNEY_BASELINE",
    });
    const journey = createUserJourneyDefinition({
      permission: "ux.journey.create",
      journeyCode: "CLIENT_DOCUMENT_REVIEW",
      configuration,
      stage: "async_wait",
    });
    const state = createExperienceStateDefinition({
      permission: "ux.state.create",
      stateCode: "WAITING_ON_PROVIDER",
      journey,
      kind: "waiting_on_provider",
    });

    expect(state.kind).toBe("waiting_on_provider");
    expect(state.stateRendered).toBe(false);
    expect(journey.runtimeEnabled).toBe(false);
  });

  it("rejects a confirmation that claims to be approval", () => {
    const configuration = createUxPrinciplesConfiguration({
      permission: "ux.configuration.create",
      code: "PAYMENT_JOURNEY_BASELINE",
    });
    const journey = createUserJourneyDefinition({
      permission: "ux.journey.create",
      journeyCode: "PAYMENT_REVIEW",
      configuration,
      stage: "review",
    });

    expect(() =>
      createInteractionContract({
        permission: "ux.interaction.create",
        contractCode: "UNSAFE_CONFIRMATION",
        journey,
        treatsConfirmationAsApproval: true,
      }),
    ).toThrow("cannot substitute approval or authorization");
  });

  it("does not evaluate a journey or read user data while runtime is disabled", () => {
    const configuration = createUxPrinciplesConfiguration({
      permission: "ux.configuration.create",
      code: "SUPPORT_JOURNEY_BASELINE",
    });
    const journey = createUserJourneyDefinition({
      permission: "ux.journey.create",
      journeyCode: "SUPPORT_HANDOFF",
      configuration,
      stage: "human_review",
    });
    const result = evaluateUserJourney({ permission: "ux.journey.evaluate", journey });

    expect(result.status).toBe("blocked_runtime_disabled");
    expect(result.evaluated).toBe(false);
    expect(result.userDataRead).toBe(false);
  });
});
