import type { SchedulerTimeZoneContext, SchedulerTimeZoneSource } from "./contracts.js";

export interface SchedulerTimeZoneInput {
  readonly userSelectedTimeZone?: string;
  readonly verifiedProfileTimeZone?: string;
  readonly calendarTimeZone?: string;
  readonly deviceHintTimeZone?: string;
  readonly resolvedAt?: string;
}

function validTimeZone(value: string | undefined): value is string {
  if (!value) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function selectTimeZone(
  input: SchedulerTimeZoneInput,
): readonly [string | undefined, SchedulerTimeZoneSource] {
  if (validTimeZone(input.userSelectedTimeZone))
    return [input.userSelectedTimeZone, "user_selected"];
  if (validTimeZone(input.verifiedProfileTimeZone)) {
    return [input.verifiedProfileTimeZone, "verified_profile"];
  }
  if (validTimeZone(input.calendarTimeZone)) return [input.calendarTimeZone, "calendar_policy"];
  if (validTimeZone(input.deviceHintTimeZone)) return [input.deviceHintTimeZone, "device_hint"];
  return [undefined, "unknown"];
}

export function resolveSchedulerTimeZoneContext(
  input: SchedulerTimeZoneInput,
): SchedulerTimeZoneContext {
  const [selected, source] = selectTimeZone(input);
  const confirmed = source === "user_selected" || source === "verified_profile";
  return {
    ...(selected
      ? { userTimeZone: selected, displayTimeZone: selected }
      : { displayTimeZone: "UTC" }),
    ...(validTimeZone(input.calendarTimeZone) ? { calendarTimeZone: input.calendarTimeZone } : {}),
    source,
    confidenceStatus: confirmed
      ? source === "user_selected"
        ? "confirmed"
        : "verified"
      : selected
        ? "hint"
        : "unknown",
    confirmationRequired: !confirmed,
    bookingPermitted: confirmed,
    ...(input.resolvedAt ? { resolvedAt: input.resolvedAt } : {}),
  };
}
