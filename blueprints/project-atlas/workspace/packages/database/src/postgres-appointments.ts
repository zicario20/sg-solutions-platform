import type {
  AppointmentActor,
  AppointmentModality,
  AppointmentStatus,
  ClientAppointmentDto,
  ClientAppointmentTypeDto,
} from "@atlas/appointments";
import type postgres from "postgres";

type RootSql = postgres.Sql;
type Sql = RootSql | postgres.TransactionSql;
type TypeRow = {
  id: string;
  code: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  minimum_notice_minutes: number;
  maximum_advance_days: number;
  modalities: string[];
  active: boolean;
};
type WindowRow = {
  assignee_ref: string;
  start_at_utc: Date;
  end_at_utc: Date;
  time_zone: string;
};
type HoldRow = {
  id: string;
  type_id: string;
  assignee_ref: string;
  start_at_utc: Date;
  end_at_utc: Date;
  expires_at: Date;
  state: string;
};

const modalities = new Set<AppointmentModality>([
  "phone",
  "video",
  "in_person",
  "portal_call",
  "callback",
]);
const ref = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
const isValidZone = (value: string) => {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};
const validDate = (value: Date) => Number.isFinite(value.getTime());
const isAllowedModality = (value: string): value is AppointmentModality =>
  modalities.has(value as AppointmentModality);
const safeCommandKey = (value: string) => /^[A-Za-z0-9_.-]{8,128}$/u.test(value);

export class PostgresAppointmentGateway {
  constructor(
    private readonly sql: RootSql,
    private readonly now = () => new Date(),
  ) {}

  private async lockCapacity(sql: Sql, assigneeRef: string) {
    await sql`select pg_advisory_xact_lock(hashtextextended(${`m013-capacity:${assigneeRef}`}, 0))`;
  }

  private async lockReceipt(
    sql: Sql,
    actor: AppointmentActor,
    operation: string,
    idempotencyKey: string,
  ) {
    await sql`select pg_advisory_xact_lock(hashtextextended(${`m013-receipt:${actor.accountId}:${operation}:${idempotencyKey}`}, 0))`;
  }

  private async typeForCode(sql: Sql, typeCode: string) {
    return (
      await sql<TypeRow[]>`
        select id, code, duration_minutes, buffer_before_minutes, buffer_after_minutes,
          minimum_notice_minutes, maximum_advance_days, modalities, active
        from appointment_types where code=${typeCode} and active=true limit 1
      `
    )[0];
  }

  private async slotsFor(
    sql: Sql,
    input: { typeCode: string; from: Date; to: Date; timeZone: string },
  ) {
    if (
      !validDate(input.from) ||
      !validDate(input.to) ||
      input.from >= input.to ||
      !isValidZone(input.timeZone)
    )
      return { kind: "unavailable" as const, slots: [] as const };
    const type = await this.typeForCode(sql, input.typeCode);
    if (!type) return { kind: "unavailable" as const, slots: [] as const };
    const now = this.now();
    const earliest = new Date(now.getTime() + type.minimum_notice_minutes * 60_000);
    const latest = new Date(now.getTime() + type.maximum_advance_days * 86_400_000);
    const queriedFrom = new Date(input.from.getTime() - type.buffer_after_minutes * 60_000);
    const queriedTo = new Date(input.to.getTime() + type.buffer_before_minutes * 60_000);
    const windows = await sql<WindowRow[]>`
      select assignee_ref, start_at_utc, end_at_utc, time_zone from appointment_availability_windows
      where type_id=${type.id} and active=true and end_at_utc>${input.from} and start_at_utc<${input.to}
    `;
    const appointments = await sql<
      { assignee_ref: string; start_at_utc: Date; end_at_utc: Date }[]
    >`
      select assignee_ref,start_at_utc,end_at_utc from appointments
      where status in ('requested','pending_confirmation','confirmed')
        and end_at_utc>${queriedFrom} and start_at_utc<${queriedTo}
    `;
    const holds = await sql<{ assignee_ref: string; start_at_utc: Date; end_at_utc: Date }[]>`
      select assignee_ref,start_at_utc,end_at_utc from appointment_holds
      where state='active' and expires_at>${now} and end_at_utc>${queriedFrom} and start_at_utc<${queriedTo}
    `;
    const slots: { assigneeRef: string; startAtUtc: string; endAtUtc: string; timeZone: string }[] =
      [];
    for (const window of windows) {
      for (
        let start = new Date(
          Math.max(window.start_at_utc.getTime(), input.from.getTime(), earliest.getTime()),
        );
        start.getTime() + type.duration_minutes * 60_000 <=
        Math.min(window.end_at_utc.getTime(), input.to.getTime(), latest.getTime());
        start = new Date(start.getTime() + type.duration_minutes * 60_000)
      ) {
        const end = new Date(start.getTime() + type.duration_minutes * 60_000);
        const occupiedStart = new Date(start.getTime() - type.buffer_before_minutes * 60_000);
        const occupiedEnd = new Date(end.getTime() + type.buffer_after_minutes * 60_000);
        const blocked = [...appointments, ...holds].some(
          (entry) =>
            entry.assignee_ref === window.assignee_ref &&
            occupiedStart < entry.end_at_utc &&
            occupiedEnd > entry.start_at_utc,
        );
        if (!blocked)
          slots.push({
            assigneeRef: window.assignee_ref,
            startAtUtc: start.toISOString(),
            endAtUtc: end.toISOString(),
            timeZone: window.time_zone,
          });
      }
    }
    return { kind: "available" as const, slots: slots.slice(0, 120) };
  }

  async slots(input: {
    actor: AppointmentActor;
    typeCode: string;
    from: Date;
    to: Date;
    timeZone: string;
  }) {
    return this.slotsFor(this.sql, input);
  }

  async listTypes(): Promise<readonly ClientAppointmentTypeDto[]> {
    const rows = await this.sql<{ code: string; modalities: string[] }[]>`
      select code, modalities from appointment_types where active=true and requires_authentication=true order by code
    `;
    return rows.map((row) => ({
      code: row.code,
      modalities: row.modalities.filter(isAllowedModality),
    }));
  }

  async list(actor: AppointmentActor) {
    const rows = await this.sql<
      {
        id: string;
        type_code: string;
        start_at_utc: Date;
        end_at_utc: Date;
        client_time_zone: string;
        modality: AppointmentModality;
        status: AppointmentStatus;
        version: number;
      }[]
    >`
      select a.id,t.code as type_code,a.start_at_utc,a.end_at_utc,a.client_time_zone,a.modality,a.status,a.version
      from appointments a join appointment_types t on t.id=a.type_id
      where a.owner_account_id=${actor.accountId} and a.context_ref=${actor.contextRef}
        and a.authorization_epoch=${Number(actor.authorizationEpoch)} and a.policy_epoch=${Number(actor.policyEpoch)}
      order by a.start_at_utc
    `;
    const items: ClientAppointmentDto[] = rows.map((row) => ({
      opaqueRef: row.id,
      typeCode: row.type_code,
      startAtUtc: row.start_at_utc.toISOString(),
      endAtUtc: row.end_at_utc.toISOString(),
      timeZone: row.client_time_zone,
      modality: row.modality,
      status: row.status,
      version: row.version,
    }));
    return { kind: "found" as const, items };
  }

  async createHold(input: {
    actor: AppointmentActor;
    typeCode: string;
    assigneeRef: string;
    startAtUtc: string;
    endAtUtc: string;
    timeZone: string;
  }) {
    const from = new Date(input.startAtUtc);
    const to = new Date(input.endAtUtc);
    if (!validDate(from) || !validDate(to) || !isValidZone(input.timeZone) || from >= to)
      return { kind: "unavailable" as const };
    return this.sql.begin(async (tx) => {
      await this.lockCapacity(tx, input.assigneeRef);
      const slots = await this.slotsFor(tx, {
        typeCode: input.typeCode,
        from,
        to,
        timeZone: input.timeZone,
      });
      const selected =
        slots.kind === "available" &&
        slots.slots.find(
          (slot) =>
            slot.assigneeRef === input.assigneeRef &&
            slot.startAtUtc === input.startAtUtc &&
            slot.endAtUtc === input.endAtUtc,
        );
      if (!selected) return { kind: "unavailable" as const };
      const type = await this.typeForCode(tx, input.typeCode);
      if (!type) return { kind: "unavailable" as const };
      const now = this.now();
      const holdRef = ref("hold1");
      const expiresAt = new Date(now.getTime() + 5 * 60_000);
      await tx`
        insert into appointment_holds (id,type_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,assignee_ref,start_at_utc,end_at_utc,expires_at,state,input_digest,created_at)
        values (${holdRef},${type.id},${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${input.assigneeRef},${from},${to},${expiresAt},'active',${[input.typeCode, input.assigneeRef, input.startAtUtc, input.endAtUtc].join("|")},${now})
      `;
      return { kind: "held" as const, holdRef, expiresAt: expiresAt.toISOString() };
    });
  }

  private async enqueueHandoffs(sql: Sql, appointmentRef: string, now: Date) {
    for (const eventName of [
      "appointment_projection_requested",
      "appointment_notification_requested",
    ] as const)
      await sql`insert into appointment_handoff_outbox (id,appointment_id,event_name,state,created_at) values (${ref("apto1")},${appointmentRef},${eventName},'pending',${now})`;
  }

  async book(input: {
    actor: AppointmentActor;
    holdRef: string;
    clientTimeZone: string;
    modality: AppointmentModality;
    idempotencyKey: string;
  }) {
    if (
      !isValidZone(input.clientTimeZone) ||
      !isAllowedModality(input.modality) ||
      !safeCommandKey(input.idempotencyKey)
    )
      return { kind: "not_found" as const };
    const now = this.now();
    const digest = [input.holdRef, input.clientTimeZone, input.modality].join("|");
    return this.sql.begin(async (tx) => {
      await this.lockReceipt(tx, input.actor, "book", input.idempotencyKey);
      const prior = (
        await tx<{ input_digest: string; appointment_id: string }[]>`
        select input_digest,appointment_id from appointment_booking_receipts
        where owner_account_id=${input.actor.accountId} and operation='book' and idempotency_key=${input.idempotencyKey} limit 1
      `
      )[0];
      if (prior)
        return prior.input_digest === digest
          ? { kind: "booked" as const, appointmentRef: prior.appointment_id }
          : { kind: "conflict" as const };
      const hold = (
        await tx<(HoldRow & { authorization_epoch: number; policy_epoch: number })[]>`
        select id,type_id,assignee_ref,start_at_utc,end_at_utc,expires_at,state,authorization_epoch,policy_epoch from appointment_holds
        where id=${input.holdRef} and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)} and policy_epoch=${Number(input.actor.policyEpoch)} for update
      `
      )[0];
      if (hold?.state !== "active" || hold.expires_at <= now)
        return { kind: "unavailable" as const };
      await this.lockCapacity(tx, hold.assignee_ref);
      const type = (
        await tx<
          TypeRow[]
        >`select id,code,duration_minutes,buffer_before_minutes,buffer_after_minutes,minimum_notice_minutes,maximum_advance_days,modalities,active from appointment_types where id=${hold.type_id} and active=true limit 1`
      )[0];
      if (!type?.modalities.includes(input.modality)) return { kind: "unavailable" as const };
      const occupiedStart = new Date(
        hold.start_at_utc.getTime() - type.buffer_before_minutes * 60_000,
      );
      const occupiedEnd = new Date(hold.end_at_utc.getTime() + type.buffer_after_minutes * 60_000);
      const conflicts = await tx<{ id: string }[]>`
        select id from appointments where assignee_ref=${hold.assignee_ref} and status in ('requested','pending_confirmation','confirmed') and start_at_utc<${occupiedEnd} and end_at_utc>${occupiedStart}
        union all
        select id from appointment_holds where id<>${hold.id} and assignee_ref=${hold.assignee_ref} and state='active' and expires_at>${now} and start_at_utc<${occupiedEnd} and end_at_utc>${occupiedStart}
        limit 1
      `;
      if (conflicts.length > 0) return { kind: "unavailable" as const };
      const appointmentRef = ref("apt1");
      await tx`
        insert into appointments (id,type_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,assignee_ref,start_at_utc,end_at_utc,client_time_zone,staff_time_zone,modality,status,version,created_at,updated_at)
        values (${appointmentRef},${hold.type_id},${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${hold.assignee_ref},${hold.start_at_utc},${hold.end_at_utc},${input.clientTimeZone},'America/Chicago',${input.modality},'confirmed',1,${now},${now})
      `;
      await tx`update appointment_holds set state='consumed' where id=${hold.id}`;
      await tx`insert into appointment_booking_receipts (id,owner_account_id,idempotency_key,input_digest,operation,appointment_id,created_at) values (${ref("aptr1")},${input.actor.accountId},${input.idempotencyKey},${digest},'book',${appointmentRef},${now})`;
      await tx`insert into appointment_audit_events (id,appointment_id,event_name,actor_account_id,created_at) values (${ref("apta1")},${appointmentRef},'booked',${input.actor.accountId},${now})`;
      await this.enqueueHandoffs(tx, appointmentRef, now);
      return { kind: "booked" as const, appointmentRef };
    });
  }

  async reschedule(input: {
    actor: AppointmentActor;
    appointmentRef: string;
    expectedVersion: number;
    holdRef: string;
    clientTimeZone: string;
    modality: AppointmentModality;
    idempotencyKey: string;
  }) {
    if (
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 1 ||
      !isValidZone(input.clientTimeZone) ||
      !isAllowedModality(input.modality) ||
      !safeCommandKey(input.idempotencyKey)
    )
      return { kind: "not_found" as const };
    const now = this.now();
    const digest = [
      input.appointmentRef,
      input.expectedVersion,
      input.holdRef,
      input.clientTimeZone,
      input.modality,
    ].join("|");
    return this.sql.begin(async (tx) => {
      await this.lockReceipt(tx, input.actor, "reschedule", input.idempotencyKey);
      const prior = (
        await tx<{ input_digest: string; appointment_id: string }[]>`
        select input_digest,appointment_id from appointment_booking_receipts
        where owner_account_id=${input.actor.accountId} and operation='reschedule' and idempotency_key=${input.idempotencyKey} limit 1
      `
      )[0];
      if (prior)
        return prior.input_digest === digest
          ? { kind: "rescheduled" as const, appointmentRef: prior.appointment_id }
          : { kind: "conflict" as const };
      const original = (
        await tx<
          { id: string; type_id: string; start_at_utc: Date; end_at_utc: Date; version: number }[]
        >`
        select id,type_id,start_at_utc,end_at_utc,version from appointments
        where id=${input.appointmentRef} and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)} and policy_epoch=${Number(input.actor.policyEpoch)}
          and version=${input.expectedVersion} and status in ('requested','pending_confirmation','confirmed') and start_at_utc>${now} for update
      `
      )[0];
      const hold = (
        await tx<HoldRow[]>`
        select id,type_id,assignee_ref,start_at_utc,end_at_utc,expires_at,state from appointment_holds
        where id=${input.holdRef} and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)} and policy_epoch=${Number(input.actor.policyEpoch)} for update
      `
      )[0];
      if (
        !original ||
        !hold ||
        original.type_id !== hold.type_id ||
        hold.state !== "active" ||
        hold.expires_at <= now
      )
        return { kind: "unavailable" as const };
      await this.lockCapacity(tx, hold.assignee_ref);
      const type = (
        await tx<
          TypeRow[]
        >`select id,code,duration_minutes,buffer_before_minutes,buffer_after_minutes,minimum_notice_minutes,maximum_advance_days,modalities,active from appointment_types where id=${hold.type_id} and active=true limit 1`
      )[0];
      if (!type?.modalities.includes(input.modality)) return { kind: "unavailable" as const };
      const occupiedStart = new Date(
        hold.start_at_utc.getTime() - type.buffer_before_minutes * 60_000,
      );
      const occupiedEnd = new Date(hold.end_at_utc.getTime() + type.buffer_after_minutes * 60_000);
      const conflicts = await tx<{ id: string }[]>`
        select id from appointments where id<>${original.id} and assignee_ref=${hold.assignee_ref} and status in ('requested','pending_confirmation','confirmed') and start_at_utc<${occupiedEnd} and end_at_utc>${occupiedStart}
        union all
        select id from appointment_holds where id<>${hold.id} and assignee_ref=${hold.assignee_ref} and state='active' and expires_at>${now} and start_at_utc<${occupiedEnd} and end_at_utc>${occupiedStart}
        limit 1
      `;
      if (conflicts.length > 0) return { kind: "unavailable" as const };
      await tx`insert into appointment_schedule_revisions (id,appointment_id,previous_start_at_utc,previous_end_at_utc,next_start_at_utc,next_end_at_utc,previous_version,created_at) values (${ref("aptrv1")},${original.id},${original.start_at_utc},${original.end_at_utc},${hold.start_at_utc},${hold.end_at_utc},${original.version},${now})`;
      await tx`update appointments set assignee_ref=${hold.assignee_ref},start_at_utc=${hold.start_at_utc},end_at_utc=${hold.end_at_utc},client_time_zone=${input.clientTimeZone},modality=${input.modality},version=version+1,updated_at=${now} where id=${original.id} and version=${original.version}`;
      await tx`update appointment_holds set state='consumed' where id=${hold.id}`;
      await tx`insert into appointment_booking_receipts (id,owner_account_id,idempotency_key,input_digest,operation,appointment_id,created_at) values (${ref("aptr1")},${input.actor.accountId},${input.idempotencyKey},${digest},'reschedule',${original.id},${now})`;
      await tx`insert into appointment_audit_events (id,appointment_id,event_name,actor_account_id,created_at) values (${ref("apta1")},${original.id},'rescheduled',${input.actor.accountId},${now})`;
      await this.enqueueHandoffs(tx, original.id, now);
      return { kind: "rescheduled" as const, appointmentRef: original.id };
    });
  }

  async cancel(input: {
    actor: AppointmentActor;
    appointmentRef: string;
    expectedVersion: number;
  }) {
    if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1)
      return { kind: "not_found" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      const rows = await tx<{ id: string }[]>`
        update appointments set status='cancelled_by_client',version=version+1,updated_at=${now}
        where id=${input.appointmentRef} and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)} and policy_epoch=${Number(input.actor.policyEpoch)}
          and version=${input.expectedVersion} and start_at_utc>${now} and status in ('requested','pending_confirmation','confirmed') returning id
      `;
      if (rows.length !== 1) return { kind: "not_found" as const };
      await tx`insert into appointment_audit_events (id,appointment_id,event_name,actor_account_id,created_at) values (${ref("apta1")},${input.appointmentRef},'cancelled_by_client',${input.actor.accountId},${now})`;
      await this.enqueueHandoffs(tx, input.appointmentRef, now);
      return { kind: "cancelled" as const };
    });
  }
}
