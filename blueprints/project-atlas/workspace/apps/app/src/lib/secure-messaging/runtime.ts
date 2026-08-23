import {
  PostgresSecureMessagingDocumentAccess,
  PostgresSecureMessagingRepository,
} from "@atlas/database";
import { createAesGcmMessageCipher, SecureMessagingService } from "@atlas/secure-messaging";
import postgres from "postgres";
import { createConfiguredDashboardRuntime } from "../dashboard/configured-runtime.ts";
export type SecureMessagingRuntime =
  | Readonly<{
      kind: "ready";
      canonicalOrigin: string;
      service: SecureMessagingService;
      resolveActor: ReturnType<typeof createConfiguredDashboardRuntime>["resolveMessagingActor"];
      verifyCsrf(sessionHandle: string, token: string): boolean;
    }>
  | Readonly<{ kind: "unavailable" }>;
export function createConfiguredSecureMessagingRuntime(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): SecureMessagingRuntime {
  const dashboard = createConfiguredDashboardRuntime(environment);
  const key = Buffer.from(environment.M012_MESSAGE_ENCRYPTION_KEY ?? "", "base64url");
  if (
    environment.M012_SECURE_MESSAGING_ENABLED !== "true" ||
    !/^postgres(?:ql)?:\/\//u.test(environment.DATABASE_URL ?? "") ||
    key.byteLength !== 32 ||
    !dashboard.canonicalOrigin
  )
    return { kind: "unavailable" };
  const sql = postgres(environment.DATABASE_URL as string, { max: 4, prepare: false });
  const service = new SecureMessagingService({
    repository: new PostgresSecureMessagingRepository(sql),
    cipher: createAesGcmMessageCipher(key),
    documentAccess: new PostgresSecureMessagingDocumentAccess(sql),
  });
  return {
    kind: "ready",
    canonicalOrigin: dashboard.canonicalOrigin,
    service,
    resolveActor: dashboard.resolveMessagingActor,
    verifyCsrf: dashboard.verifyCsrf,
  };
}
