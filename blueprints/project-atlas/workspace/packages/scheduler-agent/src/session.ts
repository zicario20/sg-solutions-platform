import type {
  ReceptionSchedulerSessionInput,
  SchedulerBookingRequest,
  SchedulerBookingRequestInput,
  SchedulerHumanHandoff,
  SchedulerHumanHandoffInput,
  SchedulerSession,
} from "./contracts.js";
import { resolveSchedulerTimeZoneContext } from "./time-zone.js";

export function createReceptionSchedulerSession(
  input: ReceptionSchedulerSessionInput,
): SchedulerSession {
  if (
    input.receptionHandoff.target !== "scheduling" ||
    input.receptionHandoff.status !== "prepared" ||
    input.receptionHandoff.executionPermitted
  ) {
    throw new Error("M049 handoff is not an executable scheduler session input.");
  }
  return {
    id: input.id,
    surface: "public_web",
    channel: "web",
    locale: input.receptionHandoff.locale,
    status: "created",
    sourceHandoffReference: input.receptionHandoff.id,
    timeZoneContext: resolveSchedulerTimeZoneContext({}),
    openedAt: input.createdAt,
    lastActivityAt: input.createdAt,
    expiresAt: input.expiresAt,
  };
}

export function createSchedulerBookingRequest(
  input: SchedulerBookingRequestInput,
): SchedulerBookingRequest {
  return {
    ...input,
    status: "prepared",
    executionPermitted: false,
  };
}

export function createSchedulerHumanHandoff(
  input: SchedulerHumanHandoffInput,
): SchedulerHumanHandoff {
  return {
    ...input,
    target: "human_scheduler",
    status: "prepared",
    dispatchPermitted: false,
    executionPermitted: false,
  };
}
