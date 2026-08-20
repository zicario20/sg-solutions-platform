export type WhatsAppRuntimeState = "disabled" | "local" | "staging";

export type WhatsAppProvider = "meta_cloud";

export type WhatsAppConfig = {
  enabled: boolean;
  runtimeState: WhatsAppRuntimeState;
  provider: WhatsAppProvider;
  graphApiVersion: string | null;
  webhookMaxBytes: number;
  webhookReadTimeoutMilliseconds: number;
  webhookTotalTimeoutMilliseconds: number;
  webhookConcurrencyLimit: number;
  webhookRateLimitPerMinute: number;
  mediaDownloadEnabled: false;
  marketingEnabled: false;
  preliminaryIntakeEnabled: false;
  providerTrafficAllowed: false;
};

type WhatsAppEnvironment = Readonly<Record<string, string | undefined>>;

const RUNTIME_STATES = new Set<WhatsAppRuntimeState>(["disabled", "local", "staging"]);
const GRAPH_API_VERSION_PATTERN = /^v[1-9][0-9]*\.[0-9]+$/;

const DEFAULT_WEBHOOK_MAX_BYTES = 262_144;
const MINIMUM_WEBHOOK_MAX_BYTES = 1_024;
const MAXIMUM_WEBHOOK_MAX_BYTES = 1_048_576;
const DEFAULT_WEBHOOK_READ_TIMEOUT_MILLISECONDS = 5_000;
const MINIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS = 100;
const MAXIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS = 10_000;
const DEFAULT_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS = 10_000;
const MINIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS = 100;
const MAXIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS = 30_000;
const DEFAULT_WEBHOOK_CONCURRENCY_LIMIT = 8;
const MINIMUM_WEBHOOK_CONCURRENCY_LIMIT = 1;
const MAXIMUM_WEBHOOK_CONCURRENCY_LIMIT = 32;
const DEFAULT_WEBHOOK_RATE_LIMIT_PER_MINUTE = 60;
const MINIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE = 1;
const MAXIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE = 120;

function readOptional(env: WhatsAppEnvironment, name: string): string | undefined {
  const value = env[name];
  return value === "" ? undefined : value;
}

function readRuntimeState(env: WhatsAppEnvironment): WhatsAppRuntimeState {
  const value = readOptional(env, "WHATSAPP_RUNTIME_STATE") ?? "disabled";

  if (!RUNTIME_STATES.has(value as WhatsAppRuntimeState)) {
    throw new Error("WHATSAPP_RUNTIME_STATE must be a supported runtime state");
  }

  return value as WhatsAppRuntimeState;
}

function readEnabled(env: WhatsAppEnvironment): boolean {
  const value = readOptional(env, "WHATSAPP_ENABLED");

  if (value === undefined) {
    return false;
  }

  if (value !== "true" && value !== "false") {
    throw new Error('WHATSAPP_ENABLED must be "true" or "false"');
  }

  return value === "true";
}

function readProvider(env: WhatsAppEnvironment): WhatsAppProvider {
  const value = readOptional(env, "WHATSAPP_PROVIDER") ?? "meta_cloud";

  if (value !== "meta_cloud") {
    throw new Error("WHATSAPP_PROVIDER must be meta_cloud");
  }

  return value;
}

function readGraphApiVersion(
  env: WhatsAppEnvironment,
  runtimeState: WhatsAppRuntimeState,
): string | null {
  const value = readOptional(env, "WHATSAPP_GRAPH_API_VERSION");

  if (value === undefined) {
    if (runtimeState === "disabled") {
      return null;
    }

    throw new Error("WHATSAPP_GRAPH_API_VERSION is required unless disabled");
  }

  if (!GRAPH_API_VERSION_PATTERN.test(value)) {
    throw new Error("WHATSAPP_GRAPH_API_VERSION must be an explicit Graph API version");
  }

  return value;
}

function readBoundedInteger(
  env: WhatsAppEnvironment,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = readOptional(env, name);

  if (value === undefined) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be an integer`);
  }

  const parsed = Number(value);

  if (parsed < minimum) {
    throw new Error(`${name} must be at least ${minimum}`);
  }

  if (parsed > maximum) {
    throw new Error(`${name} must be at most ${maximum}`);
  }

  return parsed;
}

export function readWhatsAppConfig(env: WhatsAppEnvironment): WhatsAppConfig {
  const runtimeState = readRuntimeState(env);
  const requestedEnabled = readEnabled(env);

  return {
    enabled: requestedEnabled && (runtimeState === "local" || runtimeState === "staging"),
    runtimeState,
    provider: readProvider(env),
    graphApiVersion: readGraphApiVersion(env, runtimeState),
    webhookMaxBytes: readBoundedInteger(
      env,
      "WHATSAPP_WEBHOOK_MAX_BYTES",
      DEFAULT_WEBHOOK_MAX_BYTES,
      MINIMUM_WEBHOOK_MAX_BYTES,
      MAXIMUM_WEBHOOK_MAX_BYTES,
    ),
    webhookReadTimeoutMilliseconds: readBoundedInteger(
      env,
      "WHATSAPP_WEBHOOK_READ_TIMEOUT_MILLISECONDS",
      DEFAULT_WEBHOOK_READ_TIMEOUT_MILLISECONDS,
      MINIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS,
      MAXIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS,
    ),
    webhookTotalTimeoutMilliseconds: readBoundedInteger(
      env,
      "WHATSAPP_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS",
      DEFAULT_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS,
      MINIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS,
      MAXIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS,
    ),
    webhookConcurrencyLimit: readBoundedInteger(
      env,
      "WHATSAPP_WEBHOOK_CONCURRENCY_LIMIT",
      DEFAULT_WEBHOOK_CONCURRENCY_LIMIT,
      MINIMUM_WEBHOOK_CONCURRENCY_LIMIT,
      MAXIMUM_WEBHOOK_CONCURRENCY_LIMIT,
    ),
    webhookRateLimitPerMinute: readBoundedInteger(
      env,
      "WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE",
      DEFAULT_WEBHOOK_RATE_LIMIT_PER_MINUTE,
      MINIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE,
      MAXIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE,
    ),
    mediaDownloadEnabled: false,
    marketingEnabled: false,
    preliminaryIntakeEnabled: false,
    providerTrafficAllowed: false,
  };
}
