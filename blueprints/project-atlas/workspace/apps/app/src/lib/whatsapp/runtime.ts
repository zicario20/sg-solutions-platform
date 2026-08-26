import { randomUUID } from "node:crypto";
import { readWhatsAppConfig } from "@atlas/config";
import {
  createFixedWindowRateBudget,
  createIngressSemaphore,
  createWhatsAppIngressHandler,
  type IngressClock,
  type WhatsAppIngressHandler,
} from "./ingress.ts";

const config = readWhatsAppConfig(process.env);

const runtimeClock: IngressClock = Object.freeze({
  now: () => Date.now(),
  setTimeout: (callback: () => void, delayMilliseconds: number): unknown =>
    globalThis.setTimeout(callback, delayMilliseconds),
  clearTimeout: (handle: unknown): void =>
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
});

const unavailable = async (): Promise<never> => {
  throw new Error("whatsapp_provider_traffic_unavailable");
};

export type WhatsAppRouteContext = {
  readonly params: Promise<{ readonly connectionId: string }>;
};

export type WhatsAppRouteHandler = (
  request: Request,
  context: WhatsAppRouteContext,
) => Promise<Response>;

export function createWhatsAppRouteHandler(handler: WhatsAppIngressHandler): WhatsAppRouteHandler {
  return async (request, context) => {
    const { connectionId } = await context.params;
    return handler(request, { connectionId });
  };
}

export const whatsAppRuntimeHandler: WhatsAppIngressHandler = createWhatsAppIngressHandler({
  limits: {
    providerTrafficAllowed: config.providerTrafficAllowed,
    maxRawBodyBytes: config.webhookMaxBytes,
    readTimeoutMilliseconds: config.webhookReadTimeoutMilliseconds,
    totalTimeoutMilliseconds: config.webhookTotalTimeoutMilliseconds,
  },
  clock: runtimeClock,
  createCorrelationId: () => `correlation_${randomUUID().replaceAll("-", "")}`,
  semaphore: createIngressSemaphore(config.webhookConcurrencyLimit),
  rateBudget: createFixedWindowRateBudget(config.webhookRateLimitPerMinute, 60_000),
  authorityResolver: { resolveWebhookConnectionAuthority: unavailable },
  credentials: { resolveVerificationSecret: unavailable },
  adapter: { normalizeVerifiedEvent: unavailable },
  acceptInbound: unavailable,
  telemetry: { record: () => undefined },
});
