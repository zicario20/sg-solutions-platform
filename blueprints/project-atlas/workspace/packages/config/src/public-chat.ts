export type ChatRuntimeState =
  | "disabled"
  | "local"
  | "staging"
  | "activation_ready"
  | "operational";

export type PublicChatConfig = {
  enabled: boolean;
  runtimeState: ChatRuntimeState;
  canonicalOrigin: string;
  sessionTtlSeconds: number;
  maxMessageCharacters: number;
  transcriptPersistence: "metadata_only";
  modelMode: "disabled" | "deterministic";
};

type PublicChatEnvironment = Readonly<Record<string, string | undefined>>;

const RUNTIME_STATES = new Set<ChatRuntimeState>([
  "disabled",
  "local",
  "staging",
  "activation_ready",
  "operational",
]);

const DEFAULT_CANONICAL_ORIGIN = "https://www.sgsllc.com";
const DEFAULT_SESSION_TTL_SECONDS = 1_800;
const MAX_SESSION_TTL_SECONDS = 86_400;
const DEFAULT_MAX_MESSAGE_CHARACTERS = 2_000;

function readBoolean(env: PublicChatEnvironment, name: string, fallback = false): boolean {
  const value = env[name];

  if (value === undefined) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${name} must be "true" or "false"`);
}

function readPositiveBoundedInteger(
  env: PublicChatEnvironment,
  name: string,
  fallback: number,
  maximum: number,
): number {
  const value = env[name];

  if (value === undefined) {
    return fallback;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number(value);

  if (parsed > maximum) {
    throw new Error(`${name} must be at most ${maximum}`);
  }

  return parsed;
}

function readRuntimeState(env: PublicChatEnvironment): ChatRuntimeState {
  const value = env.PUBLIC_CHAT_STATE ?? "disabled";

  if (!RUNTIME_STATES.has(value as ChatRuntimeState)) {
    throw new Error("PUBLIC_CHAT_STATE must be a supported runtime state");
  }

  return value as ChatRuntimeState;
}

function readCanonicalOrigin(env: PublicChatEnvironment, runtimeState: ChatRuntimeState): string {
  const value = env.PUBLIC_CHAT_CANONICAL_ORIGIN ?? DEFAULT_CANONICAL_ORIGIN;
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("PUBLIC_CHAT_CANONICAL_ORIGIN must be a clean HTTPS origin");
  }

  const isLocalHttp =
    runtimeState === "local" &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  const isCleanOrigin =
    (url.protocol === "https:" || isLocalHttp) &&
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash &&
    value === url.origin;

  if (!isCleanOrigin) {
    throw new Error("PUBLIC_CHAT_CANONICAL_ORIGIN must be a clean HTTPS origin");
  }

  return url.origin;
}

export function readPublicChatConfig(env: PublicChatEnvironment): PublicChatConfig {
  const runtimeState = readRuntimeState(env);
  const requestedEnabled = readBoolean(env, "PUBLIC_CHAT_ENABLED");
  const activationReadyApproved = readBoolean(env, "PUBLIC_CHAT_ACTIVATION_READY_APPROVAL");
  const operationalApproved = readBoolean(env, "PUBLIC_CHAT_OPERATIONAL_APPROVAL");

  if (runtimeState === "activation_ready" && !activationReadyApproved) {
    throw new Error("PUBLIC_CHAT_ACTIVATION_READY_APPROVAL is required");
  }

  if (runtimeState === "operational" && !operationalApproved) {
    throw new Error("PUBLIC_CHAT_OPERATIONAL_APPROVAL is required");
  }

  const enabled = requestedEnabled && (runtimeState === "local" || runtimeState === "staging");

  return {
    enabled,
    runtimeState,
    canonicalOrigin: readCanonicalOrigin(env, runtimeState),
    sessionTtlSeconds: readPositiveBoundedInteger(
      env,
      "PUBLIC_CHAT_SESSION_TTL_SECONDS",
      DEFAULT_SESSION_TTL_SECONDS,
      MAX_SESSION_TTL_SECONDS,
    ),
    maxMessageCharacters: readPositiveBoundedInteger(
      env,
      "PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS",
      DEFAULT_MAX_MESSAGE_CHARACTERS,
      DEFAULT_MAX_MESSAGE_CHARACTERS,
    ),
    transcriptPersistence: "metadata_only",
    modelMode: enabled ? "deterministic" : "disabled",
  };
}
