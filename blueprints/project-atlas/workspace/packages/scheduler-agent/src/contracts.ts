import type { ReceptionHandoffPackage } from "@atlas/reception-agent";

export type SchedulerSurface =
  | "public_web"
  | "client_portal"
  | "admin_assisted"
  | "agent_assisted"
  | "backend_event"
  | "voice_assisted_future";

export type SchedulerChannel =
  | "web"
  | "client_portal"
  | "staff_console"
  | "chat"
  | "voice_future"
  | "whatsapp_future";

export type SchedulerSessionStatus =
  | "created"
  | "identifying_appointment_type"
  | "collecting_minimum_context"
  | "searching_availability"
  | "options_presented"
  | "slot_selected"
  | "hold_pending"
  | "booking_pending"
  | "confirmation_pending"
  | "human_assistance_pending"
  | "completed"
  | "abandoned"
  | "expired"
  | "blocked";

export type SchedulerIdentityAssurance =
  | "anonymous"
  | "contact_channel_verified"
  | "authenticated_account"
  | "step_up_verified"
  | "staff_verified"
  | "authorized_representative_verified"
  | "unknown";

export type SchedulerTimeZoneSource =
  | "user_selected"
  | "verified_profile"
  | "calendar_policy"
  | "device_hint"
  | "unknown";

export type SchedulerTimeZoneConfidence = "confirmed" | "verified" | "hint" | "unknown";

export interface SchedulerAgentConfiguration {
  readonly id: string;
  readonly agentDefinitionReference: string;
  readonly agentVersionReference: string;
  readonly appointmentRegistryVersionReference: string;
  readonly availabilityPolicyVersionReference: string;
  readonly toolPolicyVersionReference: string;
  readonly status: "disabled" | "testing" | "approved" | "active";
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
}

export interface SchedulerTimeZoneContext {
  readonly userTimeZone?: string;
  readonly calendarTimeZone?: string;
  readonly displayTimeZone: string;
  readonly source: SchedulerTimeZoneSource;
  readonly confidenceStatus: SchedulerTimeZoneConfidence;
  readonly confirmationRequired: boolean;
  readonly bookingPermitted: boolean;
  readonly resolvedAt?: string;
}

export interface SchedulerSession {
  readonly id: string;
  readonly surface: SchedulerSurface;
  readonly channel: SchedulerChannel;
  readonly locale: "en" | "es";
  readonly status: SchedulerSessionStatus;
  readonly sourceHandoffReference?: string;
  readonly appointmentTypeReference?: string;
  readonly subjectReference?: string;
  readonly timeZoneContext: SchedulerTimeZoneContext;
  readonly openedAt: string;
  readonly lastActivityAt: string;
  readonly expiresAt: string;
  readonly authoritativeAppointmentReference?: string;
}

export interface ReceptionSchedulerSessionInput {
  readonly id: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly receptionHandoff: ReceptionHandoffPackage;
}

export interface SchedulerBookingRequestInput {
  readonly id: string;
  readonly schedulerSessionId: string;
  readonly appointmentTypeReference: string;
  readonly selectedSlotToken: string;
  readonly subjectReference: string;
  readonly timeZone: string;
  readonly idempotencyKey: string;
}

export interface SchedulerBookingRequest {
  readonly id: string;
  readonly schedulerSessionId: string;
  readonly appointmentTypeReference: string;
  readonly selectedSlotToken: string;
  readonly subjectReference: string;
  readonly timeZone: string;
  readonly idempotencyKey: string;
  readonly status: "prepared";
  readonly executionPermitted: false;
  readonly authoritativeAppointmentReference?: string;
}

export interface SchedulerPreconditionInput {
  readonly appointmentTypeActive: boolean;
  readonly authoritativeAvailabilityAvailable: boolean;
  readonly identityAssurance: SchedulerIdentityAssurance;
  readonly ownershipAuthorized: boolean;
  readonly prerequisitesSatisfied: boolean;
  readonly timeZoneConfirmed: boolean;
}

export interface SchedulerPreconditionAssessment {
  readonly allowed: boolean;
  readonly executionPermitted: false;
  readonly reasonCodes: readonly string[];
}

export interface SchedulerHumanHandoffInput {
  readonly id: string;
  readonly schedulerSessionId: string;
  readonly reason:
    | "calendar_unavailable"
    | "time_zone_ambiguity"
    | "prerequisite_blocked"
    | "authorization_required"
    | "policy_exception"
    | "client_requested"
    | "other";
  readonly appointmentTypeReference?: string;
  readonly timeZone?: string;
  readonly locale: "en" | "es";
  readonly clientSafeSummary: string;
  readonly sourceReferences: readonly string[];
}

export interface SchedulerHumanHandoff {
  readonly id: string;
  readonly schedulerSessionId: string;
  readonly target: "human_scheduler" | "supervisor" | "customer_support_agent";
  readonly reason: SchedulerHumanHandoffInput["reason"];
  readonly appointmentTypeReference?: string;
  readonly timeZone?: string;
  readonly locale: "en" | "es";
  readonly clientSafeSummary: string;
  readonly sourceReferences: readonly string[];
  readonly status: "prepared";
  readonly dispatchPermitted: false;
  readonly executionPermitted: false;
}

export interface SchedulerRuntimeResult {
  readonly status: "disabled";
  readonly requestedAction: string;
  readonly executionPermitted: false;
  readonly writesPerformed: false;
  readonly providerCallsPerformed: false;
  readonly notificationDispatchPerformed: false;
  readonly nextSafeAction: "request_authorized_runtime_activation";
}

export interface SchedulerRuntime {
  readonly prepareAction: (input: {
    readonly schedulerSessionReference: string;
    readonly requestedAction: string;
  }) => SchedulerRuntimeResult;
}
