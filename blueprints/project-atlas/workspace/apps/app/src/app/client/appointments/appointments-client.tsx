"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Modality = "phone" | "video" | "in_person" | "portal_call" | "callback";
type Item = Readonly<{
  opaqueRef: string;
  typeCode: string;
  startAtUtc: string;
  endAtUtc: string;
  timeZone: string;
  modality: Modality;
  status: string;
  version: number;
}>;
type AppointmentType = Readonly<{ code: string; modalities: readonly Modality[] }>;
type Slot = Readonly<{
  assigneeRef: string;
  startAtUtc: string;
  endAtUtc: string;
  timeZone: string;
}>;
type Copy = Readonly<Record<string, string>>;

const copy: Record<"es" | "en", Copy> = {
  es: {
    unavailable: "Las citas no están disponibles en este momento.",
    loading: "Cargando tus citas de forma segura...",
    none: "No tienes citas programadas.",
    book: "Agendar una cita",
    reschedule: "Reprogramar",
    cancel: "Cancelar cita",
    chooseType: "Elige el tipo de cita",
    chooseModality: "Elige la modalidad",
    findSlots: "Ver disponibilidad",
    slots: "Horarios disponibles",
    noSlots: "No hay horarios disponibles en este rango. Intenta más tarde o contacta a soporte.",
    selected: "Elige un horario para continuar.",
    booked: "Tu cita fue confirmada.",
    rescheduled: "Tu cita fue reprogramada.",
    cancelled: "Tu cita fue cancelada.",
    actionFailed: "No pudimos completar la acción. Actualiza la página e inténtalo nuevamente.",
    manage: "Gestionar cita",
    appointments: "Tus citas",
    pending: "Procesando...",
    cancelHint: "Solo puedes cancelar una cita futura que esté activa.",
  },
  en: {
    unavailable: "Appointments are not available right now.",
    loading: "Loading your appointments securely...",
    none: "You do not have any scheduled appointments.",
    book: "Book an appointment",
    reschedule: "Reschedule",
    cancel: "Cancel appointment",
    chooseType: "Choose an appointment type",
    chooseModality: "Choose a format",
    findSlots: "View availability",
    slots: "Available times",
    noSlots: "There are no available times in this range. Try again later or contact support.",
    selected: "Choose a time to continue.",
    booked: "Your appointment was confirmed.",
    rescheduled: "Your appointment was rescheduled.",
    cancelled: "Your appointment was cancelled.",
    actionFailed: "We could not complete that action. Refresh the page and try again.",
    manage: "Manage appointment",
    appointments: "Your appointments",
    pending: "Working...",
    cancelHint: "You can only cancel a future appointment that is active.",
  },
};

const displayType = (code: string) =>
  code.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const commandKey = () => crypto.randomUUID().replaceAll("-", "");
const active = (status: string) =>
  ["requested", "pending_confirmation", "confirmed"].includes(status);

export function AppointmentsClient({
  locale,
  csrfToken,
}: {
  locale: "es" | "en";
  csrfToken?: string;
}) {
  const words = copy[locale];
  const [items, setItems] = useState<readonly Item[] | undefined>();
  const [types, setTypes] = useState<readonly AppointmentType[]>([]);
  const [typeCode, setTypeCode] = useState("");
  const [selectedModality, setSelectedModality] = useState<Modality | undefined>();
  const [slots, setSlots] = useState<readonly Slot[] | undefined>();
  const [rescheduling, setRescheduling] = useState<Item | undefined>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const selectedType = useMemo(
    () => types.find((type) => type.code === typeCode),
    [types, typeCode],
  );

  const load = useCallback(async () => {
    setFailed(false);
    const [appointments, appointmentTypes] = await Promise.all([
      fetch("/api/client/appointments", { cache: "no-store", credentials: "same-origin" }),
      fetch("/api/client/appointments?view=types", {
        cache: "no-store",
        credentials: "same-origin",
      }),
    ]);
    const appointmentBody = await appointments.json().catch(() => undefined);
    const typeBody = await appointmentTypes.json().catch(() => undefined);
    if (
      !appointments.ok ||
      !appointmentTypes.ok ||
      !Array.isArray(appointmentBody?.items) ||
      !Array.isArray(typeBody?.items)
    ) {
      setFailed(true);
      return;
    }
    setItems(appointmentBody.items as Item[]);
    setTypes(typeBody.items as AppointmentType[]);
  }, []);

  useEffect(() => {
    void load().catch(() => setFailed(true));
  }, [load]);

  const loadSlots = useCallback(
    async (nextTypeCode: string, target?: Item) => {
      const now = Date.now();
      const from = new Date(now + 86_400_000).toISOString();
      const to = new Date(now + 8 * 86_400_000).toISOString();
      setBusy(true);
      setNotice("");
      try {
        const query = new URLSearchParams({
          type: nextTypeCode,
          from,
          to,
          timeZone: browserTimeZone(),
        });
        const response = await fetch(`/api/client/appointments/availability?${query.toString()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const body = await response.json().catch(() => undefined);
        if (!response.ok || !Array.isArray(body?.slots))
          throw new Error("availability_unavailable");
        setTypeCode(nextTypeCode);
        const configured = types.find((type) => type.code === nextTypeCode);
        setSelectedModality(configured?.modalities[0] ?? target?.modality);
        setRescheduling(target);
        setSlots(body.slots as Slot[]);
      } catch {
        setNotice(words.actionFailed ?? "");
      } finally {
        setBusy(false);
      }
    },
    [types, words.actionFailed],
  );

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!csrfToken) throw new Error("csrf_missing");
      const response = await fetch("/api/client/appointments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-atlas-csrf": csrfToken },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => undefined);
      if (!response.ok) throw new Error("command_failed");
      return body as { kind?: string; holdRef?: string };
    },
    [csrfToken],
  );

  const chooseSlot = useCallback(
    async (slot: Slot) => {
      if (!typeCode || !selectedModality) return;
      setBusy(true);
      setNotice("");
      try {
        const hold = await post({
          action: "hold",
          typeCode,
          assigneeRef: slot.assigneeRef,
          startAtUtc: slot.startAtUtc,
          endAtUtc: slot.endAtUtc,
          timeZone: slot.timeZone,
        });
        if (hold.kind !== "held" || !hold.holdRef) throw new Error("hold_unavailable");
        const result = rescheduling
          ? await post({
              action: "reschedule",
              appointmentRef: rescheduling.opaqueRef,
              expectedVersion: rescheduling.version,
              holdRef: hold.holdRef,
              clientTimeZone: browserTimeZone(),
              modality: selectedModality,
              idempotencyKey: commandKey(),
            })
          : await post({
              action: "book",
              holdRef: hold.holdRef,
              clientTimeZone: browserTimeZone(),
              modality: selectedModality,
              idempotencyKey: commandKey(),
            });
        if (result.kind !== "booked" && result.kind !== "rescheduled")
          throw new Error("booking_unavailable");
        setNotice((rescheduling ? words.rescheduled : words.booked) ?? "");
        setSlots(undefined);
        setRescheduling(undefined);
        await load();
      } catch {
        setNotice(words.actionFailed ?? "");
      } finally {
        setBusy(false);
      }
    },
    [
      load,
      post,
      rescheduling,
      selectedModality,
      typeCode,
      words.booked,
      words.rescheduled,
      words.actionFailed,
    ],
  );

  const cancel = useCallback(
    async (item: Item) => {
      setBusy(true);
      setNotice("");
      try {
        const result = await post({
          action: "cancel",
          appointmentRef: item.opaqueRef,
          expectedVersion: item.version,
        });
        if (result.kind !== "cancelled") throw new Error("cancel_unavailable");
        setNotice(words.cancelled ?? "");
        await load();
      } catch {
        setNotice(words.actionFailed ?? "");
      } finally {
        setBusy(false);
      }
    },
    [load, post, words.cancelled, words.actionFailed],
  );

  if (failed) return <p role="status">{words.unavailable}</p>;
  if (!items) return <p role="status">{words.loading}</p>;
  return (
    <div>
      <p aria-live="polite" role="status">
        {notice || (busy ? words.pending : "")}
      </p>
      <section aria-labelledby="appointment-booking-title">
        <h2 id="appointment-booking-title">{rescheduling ? words.reschedule : words.book}</h2>
        <fieldset disabled={busy || !csrfToken}>
          <label htmlFor="appointment-type">{words.chooseType}</label>
          <select
            id="appointment-type"
            value={typeCode}
            onChange={(event) => {
              setTypeCode(event.target.value);
              setSelectedModality(
                types.find((type) => type.code === event.target.value)?.modalities[0],
              );
            }}
          >
            <option value="">{words.chooseType}</option>
            {types.map((type) => (
              <option key={type.code} value={type.code}>
                {displayType(type.code)}
              </option>
            ))}
          </select>
          <label htmlFor="appointment-modality">{words.chooseModality}</label>
          <select
            id="appointment-modality"
            value={selectedModality ?? ""}
            onChange={(event) => setSelectedModality(event.target.value as Modality)}
            disabled={!selectedType}
          >
            {(selectedType?.modalities ?? []).map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => typeCode && void loadSlots(typeCode, rescheduling)}
            disabled={!typeCode || !selectedModality}
          >
            {words.findSlots}
          </button>
        </fieldset>
        {slots ? (
          <div aria-live="polite">
            <h3>{words.slots}</h3>
            {slots.length === 0 ? (
              <p>{words.noSlots}</p>
            ) : (
              <ul>
                {slots.map((slot) => (
                  <li key={`${slot.assigneeRef}:${slot.startAtUtc}`}>
                    <button type="button" onClick={() => void chooseSlot(slot)} disabled={busy}>
                      <time dateTime={slot.startAtUtc}>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: slot.timeZone,
                        }).format(new Date(slot.startAtUtc))}
                      </time>{" "}
                      ({slot.timeZone})
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p>{words.selected}</p>
        )}
      </section>
      <section aria-labelledby="appointments-list-title">
        <h2 id="appointments-list-title">{words.appointments}</h2>
        {items.length === 0 ? (
          <p>{words.none}</p>
        ) : (
          <ul aria-label={words.appointments}>
            {items.map((item) => (
              <li key={item.opaqueRef}>
                <strong>{displayType(item.typeCode)}</strong>
                <time dateTime={item.startAtUtc}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: item.timeZone,
                  }).format(new Date(item.startAtUtc))}
                </time>
                <span>
                  {item.timeZone} · {item.modality.replaceAll("_", " ")} · {item.status}
                </span>
                {active(item.status) && new Date(item.startAtUtc) > new Date() ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => void loadSlots(item.typeCode, item)}
                      disabled={busy || !csrfToken}
                    >
                      {words.reschedule}
                    </button>
                    <button
                      type="button"
                      onClick={() => void cancel(item)}
                      disabled={busy || !csrfToken}
                    >
                      {words.cancel}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p>{words.cancelHint}</p>
      </section>
    </div>
  );
}
