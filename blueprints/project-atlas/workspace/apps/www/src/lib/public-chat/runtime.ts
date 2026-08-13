import { createHmac } from "node:crypto";
import { type PublicChatConfig, readPublicChatConfig } from "@atlas/config";
import {
  createPostgresConversationRepository,
  createPostgresPublicChatRateLimiter,
  createPostgresPublicChatStore,
  createPublicChatSql,
  extendPublicChatSession,
  findPublicChatSessionByHash,
  type PublicChatSql,
  registerPublicChatSession,
  revokePublicChatSession,
  rotatePublicChatSessionSecrets,
} from "@atlas/database";
import {
  type AuditEvent,
  type ChatCommandResult,
  createConversationService,
  type ModerationResult,
  UnavailableHandoffPort,
} from "@atlas/domain";
import { inspectProhibitedChatContent } from "@atlas/validation";
import { HELP_CONTENT } from "../../content/help-center/index.ts";
import { createDeterministicOrientationProvider } from "./deterministic-orientation.ts";
import {
  createBootstrapHandler,
  createConversationHandlers,
  createMemoryRateLimiter,
  type PublicChatGatewayService,
  type PublicChatSecurityTelemetry,
} from "./handlers.ts";
import { createM002KnowledgeProvider } from "./m002-knowledge-provider.ts";
import {
  createMemoryPublicChatSessionStore,
  createPublicChatSessionSecurity,
  type PublicChatSessionStore,
} from "./session-security.ts";

type Runtime = {
  bootstrap: (request: Request) => Promise<Response>;
  handlers: ReturnType<typeof createConversationHandlers>;
};

export function publicChatGatewayConfiguration(
  config: Pick<PublicChatConfig, "sessionTtlSeconds" | "maxMessageCharacters">,
): { sessionTtlSeconds: number; maxMessageCharacters: number } {
  return {
    sessionTtlSeconds: config.sessionTtlSeconds,
    maxMessageCharacters: config.maxMessageCharacters,
  };
}

function environment(): Record<string, string | undefined> {
  return {
    PUBLIC_CHAT_STATE: import.meta.env.PUBLIC_CHAT_STATE,
    PUBLIC_CHAT_ENABLED: import.meta.env.PUBLIC_CHAT_ENABLED,
    PUBLIC_CHAT_CANONICAL_ORIGIN: import.meta.env.PUBLIC_CHAT_CANONICAL_ORIGIN,
    PUBLIC_CHAT_SESSION_TTL_SECONDS: import.meta.env.PUBLIC_CHAT_SESSION_TTL_SECONDS,
    PUBLIC_CHAT_ABSOLUTE_LIFETIME_SECONDS: import.meta.env.PUBLIC_CHAT_ABSOLUTE_LIFETIME_SECONDS,
    PUBLIC_CHAT_MAX_CONVERSATION_MESSAGES: import.meta.env.PUBLIC_CHAT_MAX_CONVERSATION_MESSAGES,
    PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS: import.meta.env.PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS,
    PUBLIC_CHAT_ACTIVATION_READY_APPROVAL: import.meta.env.PUBLIC_CHAT_ACTIVATION_READY_APPROVAL,
    PUBLIC_CHAT_OPERATIONAL_APPROVAL: import.meta.env.PUBLIC_CHAT_OPERATIONAL_APPROVAL,
    CHAT_COMMAND_FINGERPRINT_SECRET: import.meta.env.CHAT_COMMAND_FINGERPRINT_SECRET,
  };
}

export function resolvePublicChatCommandFingerprintSecret(input: {
  enabled: boolean;
  runtimeState: "disabled" | "local" | "staging" | "activation_ready" | "operational";
  configuredSecret?: string;
  randomSecret?: () => string;
}): string {
  const configured = input.configuredSecret?.trim();
  if (configured && configured.length >= 32) return configured;
  if (input.enabled && input.runtimeState !== "local") {
    throw new Error("CHAT_COMMAND_FINGERPRINT_SECRET_INVALID");
  }
  if (configured) throw new Error("CHAT_COMMAND_FINGERPRINT_SECRET_INVALID");
  return (input.randomSecret ?? (() => crypto.randomUUID() + crypto.randomUUID()))();
}

export function createPublicChatCommandFingerprint(secret: string) {
  return {
    digest(canonicalPayload: string): string {
      return createHmac("sha256", secret).update(canonicalPayload, "utf8").digest("hex");
    },
  };
}

export function resolvePublicChatNetworkBucketSecret(input: {
  enabled: boolean;
  runtimeState: "disabled" | "local" | "staging" | "activation_ready" | "operational";
  configuredSecret?: string;
  randomSecret?: () => string;
}): string {
  const configured = input.configuredSecret?.trim();
  if (configured && configured.length >= 32) return configured;
  if (input.enabled && input.runtimeState !== "local") {
    throw new Error("CHAT_RATE_LIMIT_SECRET_INVALID");
  }
  if (configured) throw new Error("CHAT_RATE_LIMIT_SECRET_INVALID");
  return (input.randomSecret ?? (() => crypto.randomUUID() + crypto.randomUUID()))();
}

function disabledService(): PublicChatGatewayService {
  const unavailable = async (): Promise<ChatCommandResult> => ({
    ok: false,
    code: "assistant_unavailable",
  });
  return {
    start: unavailable,
    get: unavailable,
    acceptMessage: unavailable,
    requestHandoff: unavailable,
    close: unavailable,
  };
}

function moderationProvider() {
  return {
    async classify(input: { text: string }): Promise<ModerationResult> {
      try {
        const inspection = inspectProhibitedChatContent(input.text);
        return inspection.allowed
          ? { decision: "allow" }
          : { decision: "reject", reason: inspection.reason };
      } catch {
        return { decision: "reject", reason: "unknown" };
      }
    },
  };
}

function idFactory() {
  return {
    next(prefix: "conversation" | "message") {
      return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
    },
  };
}

function securityTelemetry(): PublicChatSecurityTelemetry {
  return {
    async record(event) {
      globalThis.console.warn("[public-chat-security]", JSON.stringify(event));
    },
  };
}

function postgresSessionStore(sql: PublicChatSql): PublicChatSessionStore {
  return {
    async create(record) {
      await registerPublicChatSession(sql, {
        id: record.id,
        sessionHash: record.sessionHash,
        csrfHash: record.csrfHash,
        correlationId: record.correlationId,
        expiresAt: record.expiresAt,
        now: record.createdAt,
      });
    },
    findBySessionHash: (sessionHash) => findPublicChatSessionByHash(sql, sessionHash),
    rotateSecrets: (currentSessionHash, next) =>
      rotatePublicChatSessionSecrets(sql, { currentSessionHash, ...next }),
    extend: (sessionHash, expiresAt, updatedAt) =>
      extendPublicChatSession(sql, sessionHash, expiresAt, updatedAt),
    revoke: (sessionHash, revokedAt) => revokePublicChatSession(sql, sessionHash, revokedAt),
  };
}

function createRuntime(): Runtime {
  const config = readPublicChatConfig(environment());
  const networkBucketSecret = resolvePublicChatNetworkBucketSecret({
    enabled: config.enabled,
    runtimeState: config.runtimeState,
    configuredSecret: import.meta.env.CHAT_RATE_LIMIT_SECRET,
  });
  const commandFingerprintSecret = resolvePublicChatCommandFingerprintSecret({
    enabled: config.enabled,
    runtimeState: config.runtimeState,
    configuredSecret: import.meta.env.CHAT_COMMAND_FINGERPRINT_SECRET,
  });
  if (!config.enabled) {
    const sessions = createPublicChatSessionSecurity({
      store: createMemoryPublicChatSessionStore(),
      ttlSeconds: config.sessionTtlSeconds,
    });
    const common = {
      canonicalOrigin: config.canonicalOrigin,
      enabled: false,
      sessions,
      rateLimiter: createMemoryRateLimiter({ limit: 1, windowSeconds: 60 }),
      ...publicChatGatewayConfiguration(config),
      networkBucketSecret,
      securityTelemetry: securityTelemetry(),
    };
    return {
      bootstrap: createBootstrapHandler(common),
      handlers: createConversationHandlers({ ...common, service: disabledService() }),
    };
  }

  if (import.meta.env.PUBLIC_CHAT_DATABASE_URL) {
    throw new Error("PUBLIC_CHAT_DATABASE_CREDENTIAL_MUST_BE_SERVER_ONLY");
  }
  const databaseUrl = import.meta.env.CHAT_DATABASE_URL;
  if (!databaseUrl) throw new Error("PUBLIC_CHAT_DATABASE_UNAVAILABLE");
  const sql = createPublicChatSql(databaseUrl);
  const knowledge = createM002KnowledgeProvider(HELP_CONTENT, () => new Date());
  const store = createPostgresPublicChatStore(sql);
  const service = createConversationService({
    repository: createPostgresConversationRepository(store, {
      transcriptPersistence: config.transcriptPersistence,
    }),
    knowledge,
    moderation: moderationProvider(),
    model: createDeterministicOrientationProvider(knowledge),
    handoff: new UnavailableHandoffPort(),
    audit: { async record(_event: AuditEvent) {} },
    clock: { now: () => new Date() },
    ids: idFactory(),
    commandFingerprint: createPublicChatCommandFingerprint(commandFingerprintSecret),
    sessionTtlSeconds: config.sessionTtlSeconds,
    absoluteLifetimeSeconds: config.absoluteLifetimeSeconds,
    maxConversationMessages: config.maxConversationMessages,
    commandLeaseSeconds: 45,
    commandWaitMilliseconds: 1_500,
    providerTimeoutMilliseconds: 8_000,
  });
  const sessions = createPublicChatSessionSecurity({
    store: postgresSessionStore(sql),
    ttlSeconds: config.sessionTtlSeconds,
  });
  const common = {
    canonicalOrigin: config.canonicalOrigin,
    enabled: true,
    sessions,
    rateLimiter: createPostgresPublicChatRateLimiter(sql, { limit: 30, windowSeconds: 60 }),
    ...publicChatGatewayConfiguration(config),
    networkBucketSecret,
    securityTelemetry: securityTelemetry(),
  };
  return {
    bootstrap: createBootstrapHandler(common),
    handlers: createConversationHandlers({ ...common, service }),
  };
}

let runtime: Runtime | undefined;

export function getPublicChatRuntime(): Runtime {
  runtime ??= createRuntime();
  return runtime;
}

export function resetPublicChatRuntimeForTests(): void {
  runtime = undefined;
}
