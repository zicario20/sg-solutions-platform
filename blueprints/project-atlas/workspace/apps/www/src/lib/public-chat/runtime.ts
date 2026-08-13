import { readPublicChatConfig } from "@atlas/config";
import {
  createPostgresConversationRepository,
  createPostgresPublicChatRateLimiter,
  createPostgresPublicChatStore,
  createPublicChatSql,
  findPublicChatSessionByHash,
  type PublicChatSql,
  registerPublicChatSession,
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

function environment(): Record<string, string | undefined> {
  return {
    PUBLIC_CHAT_STATE: import.meta.env.PUBLIC_CHAT_STATE,
    PUBLIC_CHAT_ENABLED: import.meta.env.PUBLIC_CHAT_ENABLED,
    PUBLIC_CHAT_CANONICAL_ORIGIN: import.meta.env.PUBLIC_CHAT_CANONICAL_ORIGIN,
    PUBLIC_CHAT_SESSION_TTL_SECONDS: import.meta.env.PUBLIC_CHAT_SESSION_TTL_SECONDS,
    PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS: import.meta.env.PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS,
    PUBLIC_CHAT_ACTIVATION_READY_APPROVAL: import.meta.env.PUBLIC_CHAT_ACTIVATION_READY_APPROVAL,
    PUBLIC_CHAT_OPERATIONAL_APPROVAL: import.meta.env.PUBLIC_CHAT_OPERATIONAL_APPROVAL,
  };
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
  };
}

function createRuntime(): Runtime {
  const config = readPublicChatConfig(environment());
  const networkBucketSecret =
    import.meta.env.PUBLIC_CHAT_RATE_LIMIT_SECRET ?? crypto.randomUUID() + crypto.randomUUID();
  if (config.enabled && config.runtimeState === "staging" && networkBucketSecret.length < 32) {
    throw new Error("PUBLIC_CHAT_RATE_LIMIT_SECRET_INVALID");
  }
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
      sessionTtlSeconds: config.sessionTtlSeconds,
      networkBucketSecret,
    };
    return {
      bootstrap: createBootstrapHandler(common),
      handlers: createConversationHandlers({ ...common, service: disabledService() }),
    };
  }

  const databaseUrl = import.meta.env.PUBLIC_CHAT_DATABASE_URL;
  if (!databaseUrl) throw new Error("PUBLIC_CHAT_DATABASE_UNAVAILABLE");
  const sql = createPublicChatSql(databaseUrl);
  const knowledge = createM002KnowledgeProvider(HELP_CONTENT, new Date());
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
    sessionTtlSeconds: config.sessionTtlSeconds,
    commandLeaseSeconds: 30,
    commandWaitMilliseconds: 1_500,
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
    sessionTtlSeconds: config.sessionTtlSeconds,
    networkBucketSecret,
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
