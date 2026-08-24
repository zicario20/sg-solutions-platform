import {
  type ClientManagementAuthorizationPort,
  type ClientManagementProjectionPort,
  ClientManagementQueryService,
  type ClientManagementResult,
} from "@atlas/client-management";

const unavailableAuthorization: ClientManagementAuthorizationPort = Object.freeze({
  authorize: async () => undefined,
  revalidate: async () => false,
});
const unavailableProjections: ClientManagementProjectionPort = Object.freeze({
  query: async () => {
    throw new Error("CLIENT_MANAGEMENT_OWNER_PROJECTIONS_DISABLED");
  },
});
export function createConfiguredClientManagementRuntime(): Pick<
  ClientManagementQueryService,
  "query"
> {
  return new ClientManagementQueryService(unavailableAuthorization, unavailableProjections);
}
export async function loadConfiguredClientManagement(
  input: Readonly<{ sessionHandle: string; locale: "es" | "en" }>,
): Promise<ClientManagementResult> {
  return createConfiguredClientManagementRuntime().query(input);
}
