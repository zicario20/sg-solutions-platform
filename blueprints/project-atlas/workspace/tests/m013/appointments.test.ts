import { AppointmentService, MemoryAppointmentRepository } from "@atlas/appointments";
import { describe, expect, it } from "vitest";

const actor = {
  accountId: "account-a",
  contextRef: "ctx-a",
  authorizationEpoch: "1",
  policyEpoch: "1",
};
const setup = () => {
  const service = new AppointmentService(
    new MemoryAppointmentRepository(),
    () => new Date("2026-08-23T12:00:00.000Z"),
  );
  service.registerType({
    code: "credit_consultation",
    durationMinutes: 30,
    bufferBeforeMinutes: 10,
    bufferAfterMinutes: 10,
    minimumNoticeMinutes: 0,
    maximumAdvanceDays: 30,
    requiresAuthentication: true,
    active: true,
    modalities: ["phone"],
    version: 1,
  });
  service.addAvailability({
    opaqueRef: "window-a",
    typeCode: "credit_consultation",
    assigneeRef: "team-credit",
    startAtUtc: new Date("2026-08-24T14:00:00.000Z"),
    endAtUtc: new Date("2026-08-24T16:00:00.000Z"),
    timeZone: "America/Chicago",
    active: true,
  });
  return service;
};
describe("M013 appointments", () => {
  it("derives internal availability and prevents a second booking of the same held interval", async () => {
    const service = setup();
    const slots = await service.listSlots({
      actor,
      typeCode: "credit_consultation",
      from: new Date("2026-08-24T14:00:00.000Z"),
      to: new Date("2026-08-24T16:00:00.000Z"),
      timeZone: "America/Chicago",
    });
    expect(slots.kind).toBe("available");
    if (slots.kind !== "available") return;
    const slot = slots.slots[0];
    if (!slot) throw new Error("missing_slot");
    const hold = await service.createHold({
      actor,
      typeCode: "credit_consultation",
      assigneeRef: slot.assigneeRef,
      startAtUtc: slot.startAtUtc,
      endAtUtc: slot.endAtUtc,
      timeZone: "America/Chicago",
    });
    expect(hold.kind).toBe("held");
    if (hold.kind !== "held") return;
    const first = await service.book({
      actor,
      holdRef: hold.holdRef,
      clientTimeZone: "America/Chicago",
      modality: "phone",
      idempotencyKey: "book-1",
    });
    expect(first.kind).toBe("booked");
    const duplicate = await service.book({
      actor,
      holdRef: hold.holdRef,
      clientTimeZone: "America/Chicago",
      modality: "phone",
      idempotencyKey: "book-2",
    });
    expect(duplicate.kind).not.toBe("booked");
  });
  it("does not disclose another context appointment and supports idempotent retry", async () => {
    const service = setup();
    const slots = await service.listSlots({
      actor,
      typeCode: "credit_consultation",
      from: new Date("2026-08-24T14:00:00.000Z"),
      to: new Date("2026-08-24T16:00:00.000Z"),
      timeZone: "America/Chicago",
    });
    if (slots.kind !== "available") throw new Error("slots");
    const slot = slots.slots[0];
    if (!slot) throw new Error("missing_slot");
    const hold = await service.createHold({
      actor,
      typeCode: "credit_consultation",
      assigneeRef: slot.assigneeRef,
      startAtUtc: slot.startAtUtc,
      endAtUtc: slot.endAtUtc,
      timeZone: "America/Chicago",
    });
    if (hold.kind !== "held") throw new Error("hold");
    const booked = await service.book({
      actor,
      holdRef: hold.holdRef,
      clientTimeZone: "America/Chicago",
      modality: "phone",
      idempotencyKey: "same",
    });
    const retried = await service.book({
      actor,
      holdRef: hold.holdRef,
      clientTimeZone: "America/Chicago",
      modality: "phone",
      idempotencyKey: "same",
    });
    expect(retried).toEqual(booked);
    const other = await service.listClient({ actor: { ...actor, contextRef: "ctx-b" } });
    expect(other.items).toHaveLength(0);
  });
  it("binds a hold to current authorization and atomically reschedules a future appointment", async () => {
    const service = setup();
    const available = await service.listSlots({
      actor,
      typeCode: "credit_consultation",
      from: new Date("2026-08-24T14:00:00.000Z"),
      to: new Date("2026-08-24T16:00:00.000Z"),
      timeZone: "America/Chicago",
    });
    if (available.kind !== "available") throw new Error("slots");
    const originalSlot = available.slots[0];
    const laterSlot = available.slots[2];
    if (!originalSlot || !laterSlot) throw new Error("missing_slots");
    const originalHold = await service.createHold({
      actor,
      typeCode: "credit_consultation",
      assigneeRef: originalSlot.assigneeRef,
      startAtUtc: originalSlot.startAtUtc,
      endAtUtc: originalSlot.endAtUtc,
      timeZone: originalSlot.timeZone,
    });
    if (originalHold.kind !== "held") throw new Error("original_hold");
    expect(
      await service.book({
        actor: { ...actor, policyEpoch: "2" },
        holdRef: originalHold.holdRef,
        clientTimeZone: "America/Chicago",
        modality: "phone",
        idempotencyKey: "revoked-hold",
      }),
    ).toEqual({ kind: "not_found" });
    const booked = await service.book({
      actor,
      holdRef: originalHold.holdRef,
      clientTimeZone: "America/Chicago",
      modality: "phone",
      idempotencyKey: "original-book",
    });
    if (booked.kind !== "booked") throw new Error("booked");
    const replacementHold = await service.createHold({
      actor,
      typeCode: "credit_consultation",
      assigneeRef: laterSlot.assigneeRef,
      startAtUtc: laterSlot.startAtUtc,
      endAtUtc: laterSlot.endAtUtc,
      timeZone: laterSlot.timeZone,
    });
    if (replacementHold.kind !== "held") throw new Error("replacement_hold");
    expect(
      await service.reschedule({
        actor,
        appointmentRef: booked.appointmentRef,
        expectedVersion: 1,
        holdRef: replacementHold.holdRef,
        clientTimeZone: "America/Chicago",
        modality: "phone",
        idempotencyKey: "reschedule-1",
      }),
    ).toEqual({ kind: "rescheduled", appointmentRef: booked.appointmentRef });
    const clientAppointments = await service.listClient({ actor });
    expect(clientAppointments.items[0]).toMatchObject({
      opaqueRef: booked.appointmentRef,
      startAtUtc: laterSlot.startAtUtc,
      version: 2,
    });
  });
});
