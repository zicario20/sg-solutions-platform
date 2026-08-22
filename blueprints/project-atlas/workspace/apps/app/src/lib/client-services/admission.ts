export type ClientServicesAdmissionAction = "client_services_list_get" | "client_services_detail_get" | "client_services_ssr";

export interface ClientServicesAdmissionPort {
  admit(input: { action: ClientServicesAdmissionAction; request: Request }): Promise<boolean>;
}

export function createFailClosedClientServicesAdmission(): ClientServicesAdmissionPort {
  return { admit: async () => false };
}
