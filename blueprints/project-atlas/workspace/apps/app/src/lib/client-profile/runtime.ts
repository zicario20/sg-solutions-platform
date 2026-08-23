import { type ProfileActor, ProfileService } from "@atlas/client-profile";
import { PostgresProfileRepository } from "@atlas/database";
import postgres from "postgres";
import { createConfiguredDashboardRuntime } from "../dashboard/configured-runtime.ts";

export function createConfiguredProfileRuntime() {
  const dashboard = createConfiguredDashboardRuntime();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (
    process.env.M015_SELF_SERVICE_GOALS_ENABLED !== "true" ||
    !/^postgres(?:ql)?:\/\//u.test(databaseUrl) ||
    !dashboard.canonicalOrigin
  )
    return { kind: "unavailable" as const };
  const database = postgres(databaseUrl, { max: 1, prepare: false });
  return {
    kind: "ready" as const,
    canonicalOrigin: dashboard.canonicalOrigin,
    dashboard,
    service: new ProfileService(new PostgresProfileRepository(database)),
  };
}
export async function resolveProfileActor(
  runtime: ReturnType<typeof createConfiguredProfileRuntime>,
  input: Readonly<{ sessionHandle: string; requestedContext?: string; locale: "es" | "en" }>,
): Promise<ProfileActor | undefined> {
  if (runtime.kind !== "ready") return undefined;
  const result = await runtime.dashboard.resolveMessagingActor(input);
  if (result.kind !== "authorized" || result.actor.contextType !== "personal") return undefined;
  return {
    accountId: result.actor.accountId,
    clientRef: result.actor.accountId,
    contextRef: result.actor.contextRef,
    contextType: "personal",
    authorizationEpoch: result.actor.authorizationEpoch,
    policyEpoch: result.actor.policyEpoch,
    selfProfileGrant: true,
    consentGranted: false,
    allowedPurposes: ["self_service"],
  };
}
