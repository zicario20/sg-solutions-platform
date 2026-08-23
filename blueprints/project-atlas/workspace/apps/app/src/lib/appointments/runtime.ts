import { PostgresAppointmentGateway } from "@atlas/database";
import postgres from "postgres";
import { createConfiguredDashboardRuntime } from "../dashboard/configured-runtime.ts";

const gateways = new Map<string, PostgresAppointmentGateway>();
export type AppointmentRuntime =
  | Readonly<{
      kind: "ready";
      gateway: PostgresAppointmentGateway;
      resolveActor: ReturnType<typeof createConfiguredDashboardRuntime>["resolveMessagingActor"];
      canonicalOrigin: string;
      verifyCsrf(session: string, token: string): boolean;
    }>
  | Readonly<{ kind: "unavailable" }>;
export function createConfiguredAppointmentRuntime(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): AppointmentRuntime {
  const dashboard = createConfiguredDashboardRuntime(environment);
  if (
    environment.M013_APPOINTMENTS_ENABLED !== "true" ||
    !/^postgres(?:ql)?:\/\//u.test(environment.DATABASE_URL ?? "") ||
    !dashboard.canonicalOrigin
  )
    return { kind: "unavailable" };
  const databaseUrl = environment.DATABASE_URL as string;
  let gateway = gateways.get(databaseUrl);
  if (!gateway) {
    gateway = new PostgresAppointmentGateway(postgres(databaseUrl, { max: 4, prepare: false }));
    gateways.set(databaseUrl, gateway);
  }
  return {
    kind: "ready",
    gateway,
    resolveActor: dashboard.resolveMessagingActor,
    canonicalOrigin: dashboard.canonicalOrigin,
    verifyCsrf: dashboard.verifyCsrf,
  };
}
