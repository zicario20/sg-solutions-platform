import { admitAppointmentRequest, appointmentResponse } from "../admission.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const bounded = (value: string | null, maximum: number) =>
  value && value.length <= maximum && !/[\r\n]/u.test(value) ? value : undefined;

export async function GET(request: Request) {
  const input = await admitAppointmentRequest(request);
  if (input.kind === "unavailable")
    return appointmentResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return appointmentResponse({ error: "not_found" }, 404);
  const url = new URL(request.url);
  const typeCode = bounded(url.searchParams.get("type"), 64);
  const fromRaw = bounded(url.searchParams.get("from"), 64);
  const toRaw = bounded(url.searchParams.get("to"), 64);
  const timeZone = bounded(url.searchParams.get("timeZone"), 64);
  const from = fromRaw ? new Date(fromRaw) : undefined;
  const to = toRaw ? new Date(toRaw) : undefined;
  if (
    !typeCode ||
    !timeZone ||
    !from ||
    !to ||
    !Number.isFinite(from.getTime()) ||
    !Number.isFinite(to.getTime()) ||
    from >= to ||
    to.getTime() - from.getTime() > 32 * 86_400_000
  )
    return appointmentResponse({ error: "invalid_request" }, 400);
  return appointmentResponse(
    await input.runtime.gateway.slots({ actor: input.actor, typeCode, from, to, timeZone }),
  );
}
