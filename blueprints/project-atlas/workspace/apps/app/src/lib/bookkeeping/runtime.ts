import { PostgresBookkeepingGateway, PostgresBookkeepingPermissionGateway } from "@atlas/database";
import postgres from "postgres";
import { createConfiguredDashboardRuntime } from "../dashboard/configured-runtime.ts";

const gateways = new Map<
  string,
  Readonly<{
    gateway: PostgresBookkeepingGateway;
    permissions: PostgresBookkeepingPermissionGateway;
  }>
>();

export type BookkeepingRuntime =
  | Readonly<{
      kind: "ready";
      gateway: PostgresBookkeepingGateway;
      permissions: PostgresBookkeepingPermissionGateway;
      resolveActor: ReturnType<typeof createConfiguredDashboardRuntime>["resolveMessagingActor"];
      canonicalOrigin: string;
      verifyCsrf(session: string, token: string): boolean;
    }>
  | Readonly<{ kind: "unavailable" }>;

export function createConfiguredBookkeepingRuntime(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): BookkeepingRuntime {
  const dashboard = createConfiguredDashboardRuntime(environment);
  if (
    environment.M031_BOOKKEEPING_ENABLED !== "true" ||
    !/^postgres(?:ql)?:\/\//u.test(environment.DATABASE_URL ?? "") ||
    !dashboard.canonicalOrigin
  )
    return { kind: "unavailable" };
  const databaseUrl = environment.DATABASE_URL as string;
  let services = gateways.get(databaseUrl);
  if (!services) {
    const sql = postgres(databaseUrl, { max: 4, prepare: false });
    services = {
      gateway: new PostgresBookkeepingGateway(sql),
      permissions: new PostgresBookkeepingPermissionGateway(sql),
    };
    gateways.set(databaseUrl, services);
  }
  return {
    kind: "ready",
    ...services,
    resolveActor: dashboard.resolveMessagingActor,
    canonicalOrigin: dashboard.canonicalOrigin,
    verifyCsrf: dashboard.verifyCsrf,
  };
}

export const resolveBookkeepingRuntime = createConfiguredBookkeepingRuntime;
