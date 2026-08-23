import type { AppointmentOutboxEvent } from "./contracts.ts";

/** Provider adapters only project an already-committed appointment. */
export type CalendarProvider = Readonly<{
  project(event: AppointmentOutboxEvent): Promise<"accepted" | "unavailable">;
  reconcile(appointmentRef: string): Promise<"projected" | "unavailable">;
}>;

export type AppointmentNotificationPort = Readonly<{
  enqueue(event: AppointmentOutboxEvent): Promise<"accepted" | "unavailable">;
}>;

export const unavailableCalendarProvider: CalendarProvider = Object.freeze({
  project: async () => "unavailable" as const,
  reconcile: async () => "unavailable" as const,
});

export const unavailableAppointmentNotificationPort: AppointmentNotificationPort = Object.freeze({
  enqueue: async () => "unavailable" as const,
});
