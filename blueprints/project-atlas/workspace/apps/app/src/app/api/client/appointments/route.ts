import type { AppointmentModality } from "@atlas/appointments";
import {
  admitAppointmentRequest,
  appointmentResponse,
  readAppointmentCommand,
  validMutationProof,
} from "./admission.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const text = (value: unknown, maximum = 160) =>
  typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\r\n]/u.test(value)
    ? value
    : undefined;
const version = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
const modality = (value: unknown): AppointmentModality | undefined =>
  value === "phone" ||
  value === "video" ||
  value === "in_person" ||
  value === "portal_call" ||
  value === "callback"
    ? value
    : undefined;

export async function GET(request: Request) {
  const input = await admitAppointmentRequest(request);
  if (input.kind === "unavailable")
    return appointmentResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return appointmentResponse({ error: "not_found" }, 404);
  return new URL(request.url).searchParams.get("view") === "types"
    ? appointmentResponse({ items: await input.runtime.gateway.listTypes() })
    : appointmentResponse(await input.runtime.gateway.list(input.actor));
}

export async function POST(request: Request) {
  const input = await admitAppointmentRequest(request);
  if (input.kind === "unavailable")
    return appointmentResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return appointmentResponse({ error: "not_found" }, 404);
  if (!validMutationProof(request, input))
    return appointmentResponse({ error: "invalid_request" }, 403);
  const command = await readAppointmentCommand(request);
  if (command.kind === "unsupported") return appointmentResponse({ error: "invalid_request" }, 415);
  if (command.kind === "too_large") return appointmentResponse({ error: "invalid_request" }, 413);
  if (command.kind !== "ok") return appointmentResponse({ error: "invalid_request" }, 400);
  const action = text(command.value.action, 24);
  if (action === "hold") {
    const typeCode = text(command.value.typeCode, 64);
    const assigneeRef = text(command.value.assigneeRef, 128);
    const startAtUtc = text(command.value.startAtUtc, 64);
    const endAtUtc = text(command.value.endAtUtc, 64);
    const timeZone = text(command.value.timeZone, 64);
    if (!typeCode || !assigneeRef || !startAtUtc || !endAtUtc || !timeZone)
      return appointmentResponse({ error: "invalid_request" }, 400);
    return appointmentResponse(
      await input.runtime.gateway.createHold({
        actor: input.actor,
        typeCode,
        assigneeRef,
        startAtUtc,
        endAtUtc,
        timeZone,
      }),
      201,
    );
  }
  if (action === "book") {
    const holdRef = text(command.value.holdRef, 128);
    const clientTimeZone = text(command.value.clientTimeZone, 64);
    const selectedModality = modality(command.value.modality);
    const idempotencyKey = text(command.value.idempotencyKey, 128);
    if (!holdRef || !clientTimeZone || !selectedModality || !idempotencyKey)
      return appointmentResponse({ error: "invalid_request" }, 400);
    return appointmentResponse(
      await input.runtime.gateway.book({
        actor: input.actor,
        holdRef,
        clientTimeZone,
        modality: selectedModality,
        idempotencyKey,
      }),
      201,
    );
  }
  if (action === "reschedule") {
    const appointmentRef = text(command.value.appointmentRef, 128);
    const expectedVersion = version(command.value.expectedVersion);
    const holdRef = text(command.value.holdRef, 128);
    const clientTimeZone = text(command.value.clientTimeZone, 64);
    const selectedModality = modality(command.value.modality);
    const idempotencyKey = text(command.value.idempotencyKey, 128);
    if (
      !appointmentRef ||
      !expectedVersion ||
      !holdRef ||
      !clientTimeZone ||
      !selectedModality ||
      !idempotencyKey
    )
      return appointmentResponse({ error: "invalid_request" }, 400);
    return appointmentResponse(
      await input.runtime.gateway.reschedule({
        actor: input.actor,
        appointmentRef,
        expectedVersion,
        holdRef,
        clientTimeZone,
        modality: selectedModality,
        idempotencyKey,
      }),
    );
  }
  if (action === "cancel") {
    const appointmentRef = text(command.value.appointmentRef, 128);
    const expectedVersion = version(command.value.expectedVersion);
    if (!appointmentRef || !expectedVersion)
      return appointmentResponse({ error: "invalid_request" }, 400);
    return appointmentResponse(
      await input.runtime.gateway.cancel({ actor: input.actor, appointmentRef, expectedVersion }),
    );
  }
  return appointmentResponse({ error: "invalid_request" }, 400);
}
