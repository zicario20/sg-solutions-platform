import type {
  Appointment,
  AppointmentActor,
  AppointmentHold,
  AppointmentModality,
  AppointmentType,
  AvailabilityWindow,
  ClientAppointmentDto,
} from "./contracts.ts";
const overlap = (a: Date, b: Date, c: Date, d: Date) => a < c && b > d;
const validZone = (value: string) => {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};
const present = (value: string) => value.length > 0 && value.length < 161 && !/[\r\n]/u.test(value);
const digest = (parts: readonly string[]) => parts.join("|");
export class MemoryAppointmentRepository {
  readonly types = new Map<string, AppointmentType>();
  readonly windows = new Map<string, AvailabilityWindow>();
  readonly appointments = new Map<string, Appointment>();
  readonly holds = new Map<string, AppointmentHold>();
  readonly idempotency = new Map<string, { digest: string; appointmentRef: string }>();
  readonly audit: { appointmentRef: string; action: string; actorRef: string; at: Date }[] = [];
}
export class AppointmentService {
  private sequence = 0;
  constructor(
    private readonly data: MemoryAppointmentRepository,
    private readonly now = () => new Date(),
  ) {}
  private ref(prefix: string) {
    this.sequence++;
    return `${prefix}_${this.sequence.toString(36).padStart(16, "0")}`;
  }
  private owns(
    actor: AppointmentActor,
    item: {
      ownerAccountId: string;
      contextRef: string;
      authorizationEpoch: string;
      policyEpoch: string;
    },
  ) {
    return (
      actor.accountId === item.ownerAccountId &&
      actor.contextRef === item.contextRef &&
      actor.authorizationEpoch === item.authorizationEpoch &&
      actor.policyEpoch === item.policyEpoch
    );
  }
  private occupy(type: AppointmentType, start: Date, end: Date) {
    return [
      new Date(start.getTime() - type.bufferBeforeMinutes * 60000),
      new Date(end.getTime() + type.bufferAfterMinutes * 60000),
    ] as const;
  }
  registerType(type: AppointmentType) {
    if (
      !present(type.code) ||
      !type.active ||
      type.durationMinutes < 5 ||
      type.bufferBeforeMinutes < 0 ||
      type.bufferAfterMinutes < 0 ||
      type.minimumNoticeMinutes < 0 ||
      type.maximumAdvanceDays < 1 ||
      type.modalities.length === 0
    )
      throw new Error("invalid_appointment_type");
    this.data.types.set(type.code, type);
  }
  addAvailability(window: AvailabilityWindow) {
    if (
      !this.data.types.has(window.typeCode) ||
      !validZone(window.timeZone) ||
      window.startAtUtc >= window.endAtUtc
    )
      throw new Error("invalid_availability");
    this.data.windows.set(window.opaqueRef, window);
  }
  async listSlots(
    input: Readonly<{
      actor: AppointmentActor;
      typeCode: string;
      from: Date;
      to: Date;
      timeZone: string;
    }>,
  ) {
    const type = this.data.types.get(input.typeCode);
    if (!type || !validZone(input.timeZone) || input.from >= input.to)
      return { kind: "unavailable" as const, slots: [] as const };
    const now = this.now(),
      earliest = new Date(now.getTime() + type.minimumNoticeMinutes * 60000),
      latest = new Date(now.getTime() + type.maximumAdvanceDays * 86400000);
    const slots: {
      opaqueRef: string;
      assigneeRef: string;
      startAtUtc: string;
      endAtUtc: string;
      timeZone: string;
    }[] = [];
    for (const window of this.data.windows.values()) {
      if (!window.active || window.typeCode !== type.code) continue;
      for (
        let start = new Date(
          Math.max(window.startAtUtc.getTime(), input.from.getTime(), earliest.getTime()),
        );
        start.getTime() + type.durationMinutes * 60000 <=
        Math.min(window.endAtUtc.getTime(), input.to.getTime(), latest.getTime());
        start = new Date(start.getTime() + type.durationMinutes * 60000)
      ) {
        const end = new Date(start.getTime() + type.durationMinutes * 60000),
          [occupiedStart, occupiedEnd] = this.occupy(type, start, end);
        const blocked =
          [...this.data.appointments.values()]
            .filter(
              (a) => a.assigneeRef === window.assigneeRef && !a.status.startsWith("cancelled"),
            )
            .some((a) => overlap(occupiedStart, occupiedEnd, a.startAtUtc, a.endAtUtc)) ||
          [...this.data.holds.values()]
            .filter(
              (h) =>
                h.state === "active" && h.expiresAt > now && h.assigneeRef === window.assigneeRef,
            )
            .some((h) => overlap(occupiedStart, occupiedEnd, h.startAtUtc, h.endAtUtc));
        if (!blocked)
          slots.push({
            opaqueRef: this.ref("slot1"),
            assigneeRef: window.assigneeRef,
            startAtUtc: start.toISOString(),
            endAtUtc: end.toISOString(),
            timeZone: window.timeZone,
          });
      }
    }
    return { kind: "available" as const, slots };
  }
  async createHold(
    input: Readonly<{
      actor: AppointmentActor;
      typeCode: string;
      assigneeRef: string;
      startAtUtc: string;
      endAtUtc: string;
      timeZone: string;
    }>,
  ) {
    const slots = await this.listSlots({
      actor: input.actor,
      typeCode: input.typeCode,
      from: new Date(input.startAtUtc),
      to: new Date(input.endAtUtc),
      timeZone: input.timeZone,
    });
    const match =
      slots.kind === "available" &&
      slots.slots.find(
        (slot) =>
          slot.assigneeRef === input.assigneeRef &&
          slot.startAtUtc === input.startAtUtc &&
          slot.endAtUtc === input.endAtUtc,
      );
    if (!match) return { kind: "unavailable" as const };
    const hold: AppointmentHold = {
      opaqueRef: this.ref("hold1"),
      typeCode: input.typeCode,
      ownerAccountId: input.actor.accountId,
      contextRef: input.actor.contextRef,
      assigneeRef: input.assigneeRef,
      startAtUtc: new Date(input.startAtUtc),
      endAtUtc: new Date(input.endAtUtc),
      expiresAt: new Date(this.now().getTime() + 5 * 60000),
      state: "active",
      inputDigest: digest([input.typeCode, input.assigneeRef, input.startAtUtc, input.endAtUtc]),
    };
    this.data.holds.set(hold.opaqueRef, hold);
    return {
      kind: "held" as const,
      holdRef: hold.opaqueRef,
      expiresAt: hold.expiresAt.toISOString(),
    };
  }
  async book(
    input: Readonly<{
      actor: AppointmentActor;
      holdRef: string;
      clientTimeZone: string;
      modality: AppointmentModality;
      idempotencyKey: string;
    }>,
  ) {
    const hold = this.data.holds.get(input.holdRef),
      type = hold && this.data.types.get(hold.typeCode),
      key = `${input.actor.accountId}:${input.idempotencyKey}`;
    if (
      !hold ||
      !type ||
      !this.owns(input.actor, {
        ...hold,
        authorizationEpoch: input.actor.authorizationEpoch,
        policyEpoch: input.actor.policyEpoch,
      }) ||
      !validZone(input.clientTimeZone) ||
      !type.modalities.includes(input.modality) ||
      !present(input.idempotencyKey)
    )
      return { kind: "not_found" as const };
    const inputDigest = digest([hold.opaqueRef, input.clientTimeZone, input.modality]);
    const prior = this.data.idempotency.get(key);
    if (prior)
      return prior.digest === inputDigest
        ? { kind: "booked" as const, appointmentRef: prior.appointmentRef }
        : { kind: "conflict" as const };
    if (hold.state !== "active" || hold.expiresAt <= this.now())
      return { kind: "unavailable" as const };
    const [occupiedStart, occupiedEnd] = this.occupy(type, hold.startAtUtc, hold.endAtUtc);
    if (
      [...this.data.appointments.values()].some(
        (a) =>
          a.assigneeRef === hold.assigneeRef &&
          !a.status.startsWith("cancelled") &&
          overlap(occupiedStart, occupiedEnd, a.startAtUtc, a.endAtUtc),
      )
    )
      return { kind: "unavailable" as const };
    const at = this.now(),
      appointment: Appointment = {
        opaqueRef: this.ref("apt1"),
        typeCode: hold.typeCode,
        ownerAccountId: input.actor.accountId,
        contextRef: input.actor.contextRef,
        authorizationEpoch: input.actor.authorizationEpoch,
        policyEpoch: input.actor.policyEpoch,
        assigneeRef: hold.assigneeRef,
        startAtUtc: hold.startAtUtc,
        endAtUtc: hold.endAtUtc,
        clientTimeZone: input.clientTimeZone,
        staffTimeZone: "America/Chicago",
        modality: input.modality,
        status: "confirmed",
        version: 1,
        createdAt: at,
        updatedAt: at,
      };
    this.data.appointments.set(appointment.opaqueRef, appointment);
    this.data.holds.set(hold.opaqueRef, { ...hold, state: "consumed" });
    this.data.idempotency.set(key, { digest: inputDigest, appointmentRef: appointment.opaqueRef });
    this.data.audit.push({
      appointmentRef: appointment.opaqueRef,
      action: "booked",
      actorRef: input.actor.accountId,
      at,
    });
    return { kind: "booked" as const, appointmentRef: appointment.opaqueRef };
  }
  async listClient(input: Readonly<{ actor: AppointmentActor }>) {
    const items: ClientAppointmentDto[] = [...this.data.appointments.values()]
      .filter((a) => this.owns(input.actor, a))
      .sort((a, b) => a.startAtUtc.getTime() - b.startAtUtc.getTime())
      .map((a) => ({
        opaqueRef: a.opaqueRef,
        typeCode: a.typeCode,
        startAtUtc: a.startAtUtc.toISOString(),
        endAtUtc: a.endAtUtc.toISOString(),
        timeZone: a.clientTimeZone,
        modality: a.modality,
        status: a.status,
      }));
    return { kind: "found" as const, items };
  }
  async cancel(input: Readonly<{ actor: AppointmentActor; appointmentRef: string }>) {
    const appointment = this.data.appointments.get(input.appointmentRef);
    if (
      !appointment ||
      !this.owns(input.actor, appointment) ||
      appointment.startAtUtc <= this.now() ||
      !["requested", "pending_confirmation", "confirmed"].includes(appointment.status)
    )
      return { kind: "not_found" as const };
    this.data.appointments.set(appointment.opaqueRef, {
      ...appointment,
      status: "cancelled_by_client",
      version: appointment.version + 1,
      updatedAt: this.now(),
    });
    this.data.audit.push({
      appointmentRef: appointment.opaqueRef,
      action: "cancelled_by_client",
      actorRef: input.actor.accountId,
      at: this.now(),
    });
    return { kind: "cancelled" as const };
  }
}
