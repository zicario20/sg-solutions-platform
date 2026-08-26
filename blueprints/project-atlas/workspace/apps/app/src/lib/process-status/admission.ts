export const PROCESS_STATUS_ADMISSION_ACTIONS = [
  "process_status_landing_get",
  "process_status_detail_get",
  "process_status_ssr",
] as const;
export type ProcessStatusAdmissionAction = (typeof PROCESS_STATUS_ADMISSION_ACTIONS)[number];
export interface ProcessStatusAdmissionPort {
  admit(input: { action: ProcessStatusAdmissionAction; request: Request }): Promise<boolean>;
}
export function createFailClosedProcessStatusAdmission(): ProcessStatusAdmissionPort {
  return { admit: async () => false };
}
export function createProcessStatusAdmissionAdapter(
  admit: (action: ProcessStatusAdmissionAction, request: Request) => Promise<boolean>,
): ProcessStatusAdmissionPort {
  return {
    admit: async ({ action, request }) =>
      PROCESS_STATUS_ADMISSION_ACTIONS.includes(action) && (await admit(action, request)),
  };
}
