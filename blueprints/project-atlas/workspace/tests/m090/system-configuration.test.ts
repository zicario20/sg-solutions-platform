import { describe, expect, it } from "vitest";

import {
  createConfigurationChangeSet,
  createConfigurationDefinition,
  createFeatureFlagDefinition,
  createSystemConfiguration,
  proposeConfigurationValue,
  requestConfigurationActivation,
} from "../../packages/system-configuration/src/index";

describe("M090 system configuration controlled foundation", () => {
  it("stores a safe configuration reference without resolving it", () => {
    const configuration = createSystemConfiguration({
      permission: "system_configuration.definition.create",
      code: "PLATFORM_BASELINE",
    });
    const definition = createConfigurationDefinition({
      permission: "system_configuration.definition.create",
      configurationKey: "payments.checkout.enabled",
      configuration,
      scope: "module",
      valueType: "boolean",
      sensitivity: "standard",
    });
    const candidate = proposeConfigurationValue({
      permission: "system_configuration.value.propose",
      candidateCode: "CHECKOUT_DISABLED",
      definition,
      valueReference: "config-value:checkout-disabled-v1",
    });

    expect(candidate.rawSecretStored).toBe(false);
    expect(candidate.runtimeResolved).toBe(false);
    expect(configuration.runtimeResolutionEnabled).toBe(false);
  });

  it("rejects raw secrets and executable code in configuration candidates", () => {
    const configuration = createSystemConfiguration({
      permission: "system_configuration.definition.create",
      code: "SECURITY_BASELINE",
    });
    const definition = createConfigurationDefinition({
      permission: "system_configuration.definition.create",
      configurationKey: "provider.profile.reference",
      configuration,
      scope: "provider_profile",
      valueType: "secret_reference",
      sensitivity: "sensitive_reference",
    });

    expect(() =>
      proposeConfigurationValue({
        permission: "system_configuration.value.propose",
        candidateCode: "UNSAFE_PROVIDER_REFERENCE",
        definition,
        valueReference: "secret-ref:provider",
        includesRawSecret: true,
      }),
    ).toThrow("not raw secrets or executable code");
  });

  it("does not let feature flags grant authorization or activate a change set", () => {
    const configuration = createSystemConfiguration({
      permission: "system_configuration.definition.create",
      code: "AUTH_BASELINE",
    });

    expect(() =>
      createFeatureFlagDefinition({
        permission: "system_configuration.feature_flag.create",
        flagCode: "UNSAFE_AUTH_FLAG",
        configuration,
        grantsAuthorization: true,
      }),
    ).toThrow("cannot grant authorization");

    const changeSet = createConfigurationChangeSet({
      permission: "system_configuration.change_set.create",
      changeSetCode: "CHANGESET_001",
      configuration,
    });
    const result = requestConfigurationActivation({
      permission: "system_configuration.activation.request",
      changeSet,
    });

    expect(result.status).toBe("blocked_runtime_disabled");
    expect(result.activated).toBe(false);
  });
});
