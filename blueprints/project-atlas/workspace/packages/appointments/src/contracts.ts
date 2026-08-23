export type AppointmentActor = Readonly<{
  accountId: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
}>;
export type AppointmentStatus =
  | "requested"
  | "pending_confirmation"
  | "confirmed"
  | "cancelled_by_client"
  | "cancelled_by_staff"
  | "concluded";
export type AppointmentModality = "phone" | "video" | "in_person" | "portal_call" | "callback";
export type AppointmentType = Readonly<{
  code: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  requiresAuthentication: boolean;
  active: boolean;
  modalities: readonly AppointmentModality[];
  version: number;
}>;
export type AvailabilityWindow = Readonly<{
  opaqueRef: string;
  typeCode: string;
  assigneeRef: string;
  startAtUtc: Date;
  endAtUtc: Date;
  timeZone: string;
  active: boolean;
}>;
export type Appointment = Readonly<{
  opaqueRef: string;
  typeCode: string;
  ownerAccountId: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
  assigneeRef: string;
  startAtUtc: Date;
  endAtUtc: Date;
  clientTimeZone: string;
  staffTimeZone: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}>;
export type AppointmentHold = Readonly<{
  opaqueRef: string;
  typeCode: string;
  ownerAccountId: string;
  contextRef: string;
  assigneeRef: string;
  startAtUtc: Date;
  endAtUtc: Date;
  expiresAt: Date;
  state: "active" | "consumed" | "released" | "expired";
  inputDigest: string;
}>;
export type ClientAppointmentDto = Readonly<{
  opaqueRef: string;
  typeCode: string;
  startAtUtc: string;
  endAtUtc: string;
  timeZone: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
}>;
