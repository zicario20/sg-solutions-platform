import {
  type OrganizationAuthorizationPort,
  OrganizationManagementQueryService,
  type OrganizationManagementResult,
  type OrganizationProjectionPort,
} from "@atlas/organization-management";

const unavailableAuthorization: OrganizationAuthorizationPort = Object.freeze({
  authorize: async () => undefined,
  revalidate: async () => false,
});
const unavailableProjections: OrganizationProjectionPort = Object.freeze({
  query: async () => {
    throw new Error("ORGANIZATION_MANAGEMENT_OWNER_PROJECTIONS_DISABLED");
  },
});
export function createConfiguredOrganizationManagementRuntime(): Pick<
  OrganizationManagementQueryService,
  "query"
> {
  return new OrganizationManagementQueryService(unavailableAuthorization, unavailableProjections);
}
export async function loadConfiguredOrganizationManagement(
  input: Readonly<{ sessionHandle: string; locale: "es" | "en" }>,
): Promise<OrganizationManagementResult> {
  return createConfiguredOrganizationManagementRuntime().query(input);
}
