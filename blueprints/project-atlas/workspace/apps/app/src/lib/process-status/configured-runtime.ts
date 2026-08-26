import {
  type AuthorizedProcessRoot,
  ClientProcessStatusQueryService,
  type ProcessAuthPort,
  type ProcessEligibilityPolicyPort,
  type ProcessOwnerPorts,
  type ProcessSourceRegistry,
  type ProcessTimelineCursorPort,
} from "@atlas/client-process-status";
import type {
  AuthorizedServiceChoicePort,
  AuthorizedServiceRootPort,
} from "@atlas/client-services";
import type { ProcessStatusAdmissionPort } from "./admission.ts";
import type { ProcessStatusHttpDependencies } from "./http.ts";
export interface ProcessStatusRuntimeConfiguration {
  admission: ProcessStatusAdmissionPort;
  auth: ProcessAuthPort;
  choices: AuthorizedServiceChoicePort;
  roots: AuthorizedServiceRootPort<AuthorizedProcessRoot>;
  registry: ProcessSourceRegistry;
  owners?: ProcessOwnerPorts;
  eligibility: ProcessEligibilityPolicyPort;
  timelineCursors?: ProcessTimelineCursorPort;
}
export function createConfiguredProcessStatusRuntime(
  configuration?: ProcessStatusRuntimeConfiguration,
): ProcessStatusHttpDependencies {
  if (!configuration) return { admit: async () => false };
  const query = new ClientProcessStatusQueryService({
    auth: configuration.auth,
    choices: configuration.choices,
    roots: configuration.roots,
    registry: configuration.registry,
    owners: configuration.owners,
    eligibility: configuration.eligibility,
    timelineCursors: configuration.timelineCursors,
    ownerTimeoutMs: 400,
  });
  return { admit: (action, request) => configuration.admission.admit({ action, request }), query };
}
export async function getConfiguredProcessStatusRuntime() {
  return createConfiguredProcessStatusRuntime();
}
