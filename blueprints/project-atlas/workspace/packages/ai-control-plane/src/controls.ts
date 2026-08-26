import type { AIHubRuntimeControls } from "./contracts.ts";

const controls: AIHubRuntimeControls = Object.freeze({
  aiHubEnabled: false,
  modelProviderCallsEnabled: false,
  toolExecutionEnabled: false,
  jobDispatchEnabled: false,
  externalEgressEnabled: false,
  automaticMemoryWritesEnabled: false,
  supervisorDelegationEnabled: false,
});

export function getAIHubRuntimeControls(): AIHubRuntimeControls {
  return controls;
}
