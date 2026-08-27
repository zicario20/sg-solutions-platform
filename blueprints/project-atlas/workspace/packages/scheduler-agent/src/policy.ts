import type {
  SchedulerIdentityAssurance,
  SchedulerPreconditionAssessment,
  SchedulerPreconditionInput,
} from "./contracts.js";

export const M051_SCHEDULER_AGENT_FLAGS = {
  M051_SCHEDULER_AGENT_ENABLED: false,
  M051_CALENDAR_PROVIDER_CALLS_ENABLED: false,
  M051_AVAILABILITY_SEARCH_ENABLED: false,
  M051_SLOT_HOLD_EXECUTION_ENABLED: false,
  M051_BOOKING_EXECUTION_ENABLED: false,
  M051_RESCHEDULE_EXECUTION_ENABLED: false,
  M051_CANCELLATION_EXECUTION_ENABLED: false,
  M051_WAITLIST_DISPATCH_ENABLED: false,
  M051_NOTIFICATION_DISPATCH_ENABLED: false,
  M051_CONFERENCE_CREATION_ENABLED: false,
  M051_HANDOFF_DISPATCH_ENABLED: false,
  M051_AI_EXECUTION_ENABLED: false,
} as const;

export const M051_CANONICAL_BOUNDARIES = {
  agentControlPlane: "M47 Internal AI Hub",
  supervisor: "M48 Supervisor Agent",
  reception: "M49 Reception Agent",
  intake: "M50 Intake Agent",
  appointments: "M13 Client Appointments",
  internalCalendar: "M24 Internal Calendar",
  notifications: "M25/M26 Communications",
  paymentGate: "M44 Payment Verification",
  entitlements: "M45 Service Entitlements",
  consent: "M78 Consent Management",
  providerAbstraction: "M41 Provider Abstraction",
} as const;

export const M051_PROHIBITED_ACTIONS = [
  "invent_availability",
  "create_authoritative_appointment_state",
  "direct_vendor_calendar_access",
  "confirm_booking_without_authoritative_event",
  "bypass_identity_ownership_or_entitlement",
  "create_fees_or_refunds",
  "approve_scheduling_exceptions",
  "grant_entitlements_or_confirm_payments",
  "create_conference_links_outside_an_authorized_provider",
  "dispatch_notifications_or_handoffs",
  "store_private_chain_of_thought",
] as const;

const sufficientIdentity = new Set<SchedulerIdentityAssurance>([
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertM051RuntimeDisabled(): void {
  if (Object.values(M051_SCHEDULER_AGENT_FLAGS).some((flag) => flag)) {
    throw new Error("M051 scheduler-agent execution flags must remain disabled.");
  }
}

export function assessSchedulerPreconditions(
  input: SchedulerPreconditionInput,
): SchedulerPreconditionAssessment {
  const reasonCodes: string[] = [];
  if (!input.appointmentTypeActive) reasonCodes.push("appointment_type_inactive");
  if (!input.authoritativeAvailabilityAvailable) {
    reasonCodes.push("authoritative_availability_unavailable");
  }
  if (!sufficientIdentity.has(input.identityAssurance)) {
    reasonCodes.push("identity_assurance_insufficient");
  }
  if (!input.ownershipAuthorized) reasonCodes.push("ownership_not_authorized");
  if (!input.prerequisitesSatisfied) reasonCodes.push("prerequisites_not_satisfied");
  if (!input.timeZoneConfirmed) reasonCodes.push("time_zone_confirmation_required");
  return {
    allowed: reasonCodes.length === 0,
    executionPermitted: false,
    reasonCodes,
  };
}
