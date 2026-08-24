import {
  type AdminDashboardAuthorizationPort,
  type AdminDashboardOwnerPort,
  type AdminDashboardQueryResult,
  AdminDashboardQueryService,
} from "@atlas/admin-dashboard";

const unavailableAuthorization: AdminDashboardAuthorizationPort = Object.freeze({
  authorize: async () => undefined,
  revalidate: async () => false,
});
const unavailableOwner: AdminDashboardOwnerPort = Object.freeze({
  query: async () => {
    throw new Error("ADMIN_DASHBOARD_OWNER_DISABLED");
  },
});
export function createConfiguredAdminDashboardRuntime(): Pick<AdminDashboardQueryService, "query"> {
  return new AdminDashboardQueryService(unavailableAuthorization, unavailableOwner);
}
export async function loadConfiguredAdminDashboard(
  input: Readonly<{ sessionHandle: string; locale: "es" | "en" }>,
): Promise<AdminDashboardQueryResult> {
  return createConfiguredAdminDashboardRuntime().query(input);
}
