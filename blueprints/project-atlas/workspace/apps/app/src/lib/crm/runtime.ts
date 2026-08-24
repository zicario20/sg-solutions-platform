import {
  type CrmAuthorizationPort,
  type CrmProjectionPort,
  CrmWorkspaceQueryService,
  type CrmWorkspaceResult,
} from "@atlas/crm";

const unavailableAuthorization: CrmAuthorizationPort = Object.freeze({
  authorize: async () => undefined,
  revalidate: async () => false,
});
const unavailableProjections: CrmProjectionPort = Object.freeze({
  query: async () => {
    throw new Error("CRM_OWNER_PROJECTIONS_DISABLED");
  },
});
export function createConfiguredCrmRuntime(): Pick<CrmWorkspaceQueryService, "query"> {
  return new CrmWorkspaceQueryService(unavailableAuthorization, unavailableProjections);
}
export async function loadConfiguredCrm(
  input: Readonly<{ sessionHandle: string; locale: "es" | "en" }>,
): Promise<CrmWorkspaceResult> {
  return createConfiguredCrmRuntime().query(input);
}
