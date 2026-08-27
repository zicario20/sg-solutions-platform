import { describe, expect, it } from "vitest";

import {
  assessSchedulerPreconditions,
  createReceptionSchedulerSession,
  createSchedulerBookingRequest,
  createSchedulerHumanHandoff,
  createSchedulerRuntime,
  M051_SCHEDULER_AGENT_FLAGS,
  resolveSchedulerTimeZoneContext,
} from "../../packages/scheduler-agent/src/index.ts";

describe("M051 Scheduler Agent controlled foundation", () => {
  it("keeps every provider, booking, notification, and automation control disabled", () => {
    expect(Object.values(M051_SCHEDULER_AGENT_FLAGS).every((flag) => !flag)).toBe(true);
  });

  it("requires an explicit or verified time zone before a booking can proceed", () => {
    expect(
      resolveSchedulerTimeZoneContext({
        calendarTimeZone: "America/Chicago",
        deviceHintTimeZone: "America/New_York",
      }),
    ).toMatchObject({
      bookingPermitted: false,
      confirmationRequired: true,
      source: "calendar_policy",
    });

    expect(
      resolveSchedulerTimeZoneContext({
        calendarTimeZone: "America/Chicago",
        userSelectedTimeZone: "America/Los_Angeles",
      }),
    ).toMatchObject({
      bookingPermitted: true,
      confirmationRequired: false,
      source: "user_selected",
    });
  });

  it("keeps a booking request distinct from an authoritative appointment", () => {
    const request = createSchedulerBookingRequest({
      appointmentTypeReference: "appointment-type:credit-review@1",
      id: "booking-request-1",
      idempotencyKey: "booking-request-1:book",
      schedulerSessionId: "scheduler-session-1",
      selectedSlotToken: "slot:opaque-token",
      subjectReference: "client:opaque-reference",
      timeZone: "America/Chicago",
    });

    expect(request.status).toBe("prepared");
    expect(request.executionPermitted).toBe(false);
    expect(request.authoritativeAppointmentReference).toBeUndefined();
  });

  it("blocks a booking command when current availability cannot be authoritatively verified", () => {
    expect(
      assessSchedulerPreconditions({
        appointmentTypeActive: true,
        authoritativeAvailabilityAvailable: false,
        identityAssurance: "authenticated_account",
        ownershipAuthorized: true,
        prerequisitesSatisfied: true,
        timeZoneConfirmed: true,
      }),
    ).toMatchObject({
      allowed: false,
      reasonCodes: expect.arrayContaining(["authoritative_availability_unavailable"]),
    });
  });

  it("converts a prepared M049 scheduling handoff into a minimal session only", () => {
    const session = createReceptionSchedulerSession({
      createdAt: "2026-08-27T12:00:00.000Z",
      expiresAt: "2026-08-28T12:00:00.000Z",
      id: "scheduler-session-1",
      receptionHandoff: {
        createdAt: "2026-08-27T12:00:00.000Z",
        executionPermitted: false,
        expiresAt: "2026-08-28T12:00:00.000Z",
        factReferences: ["interest:appointment"],
        id: "reception-handoff-1",
        intent: "general_service_information",
        locale: "es",
        sessionReference: "reception-session-1",
        sourceReferences: ["public-chat:message-digest"],
        status: "prepared",
        target: "scheduling",
      },
    });

    expect(session.surface).toBe("public_web");
    expect(session.status).toBe("created");
    expect(session.sourceHandoffReference).toBe("reception-handoff-1");
  });

  it("creates a client-safe human handoff without calendar identifiers or dispatch", () => {
    const handoff = createSchedulerHumanHandoff({
      appointmentTypeReference: "appointment-type:consultation@1",
      clientSafeSummary: "Necesita ayuda para seleccionar una hora.",
      id: "scheduler-handoff-1",
      locale: "es",
      reason: "calendar_unavailable",
      schedulerSessionId: "scheduler-session-1",
      sourceReferences: ["request:scheduler-session-1"],
      timeZone: "America/Chicago",
    });

    expect(handoff.dispatchPermitted).toBe(false);
    expect(handoff.executionPermitted).toBe(false);
    expect(handoff).not.toHaveProperty("calendarId");
  });

  it("returns a disabled runtime response instead of calling a calendar or creating a booking", () => {
    const result = createSchedulerRuntime().prepareAction({
      requestedAction: "create_booking",
      schedulerSessionReference: "scheduler-session-1",
    });

    expect(result).toMatchObject({
      executionPermitted: false,
      providerCallsPerformed: false,
      status: "disabled",
      writesPerformed: false,
    });
  });
});
