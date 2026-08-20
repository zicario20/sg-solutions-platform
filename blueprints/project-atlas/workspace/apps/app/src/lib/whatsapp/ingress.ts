import { createHash } from "node:crypto";
import type { MetaCredentialResolver } from "./credentials.ts";
import type {
  CanonicalProviderEnvelope,
  UnsupportedVerifiedEnvelope,
  WhatsAppProviderAdapter,
} from "./meta-contracts.ts";
import { verifyMetaChallenge, verifyMetaWebhook } from "./meta-webhook.ts";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
const CORRELATION_ID = /^[A-Za-z0-9][A-Za-z0-9_:-]{2,127}$/u;
const CONTENT_LENGTH = /^(?:0|[1-9][0-9]*)$/u;

export interface IngressClock {
  now(): number;
  setTimeout(callback: () => void, delayMilliseconds: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface IngressSemaphore {
  tryAcquire(): (() => void) | null;
}

export interface IngressRateBudget {
  tryConsume(nowMilliseconds: number): boolean;
}

export type MetaWebhookConnectionAuthority = {
  readonly authorityReceiptId: string;
  readonly authorityVersion: number;
  readonly owner: "communications";
  readonly operation: "meta_webhook_connection";
  readonly connectionId: string;
  readonly businessAccountId: string;
  readonly phoneNumberId: string;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly owningConnectionCount: number;
};

export interface MetaWebhookConnectionAuthorityResolver {
  resolveWebhookConnectionAuthority(
    connectionId: string,
  ): Promise<MetaWebhookConnectionAuthority>;
}

export type DurableInboundAcceptanceCommand = {
  readonly authority: MetaWebhookConnectionAuthority;
  readonly connectionId: string;
  readonly providerEventId: string;
  readonly providerBodyDigest: string;
  readonly envelope: CanonicalProviderEnvelope;
  readonly correlationId: string;
};

export type DurableInboundAcceptanceResult =
  | { readonly status: "accepted" | "duplicate" }
  | { readonly status: "replay_mismatch" };

export type IngressTelemetryEvent = {
  readonly operation: "webhook";
  readonly result: string;
  readonly correlationId: string;
};

export type WhatsAppIngressDependencies = {
  readonly limits: {
    readonly providerTrafficAllowed: boolean;
    readonly maxRawBodyBytes: number;
    readonly readTimeoutMilliseconds: number;
    readonly totalTimeoutMilliseconds: number;
  };
  readonly clock: IngressClock;
  readonly createCorrelationId: () => string;
  readonly semaphore: IngressSemaphore;
  readonly rateBudget: IngressRateBudget;
  readonly authorityResolver: MetaWebhookConnectionAuthorityResolver;
  readonly credentials: Pick<MetaCredentialResolver, "resolveVerificationSecret">;
  readonly adapter: Pick<WhatsAppProviderAdapter, "normalizeVerifiedEvent">;
  readonly acceptInbound: (
    command: DurableInboundAcceptanceCommand,
  ) => Promise<DurableInboundAcceptanceResult>;
  readonly telemetry: { readonly record: (event: IngressTelemetryEvent) => void };
};

export type WhatsAppIngressContext = { readonly connectionId: string };
export type WhatsAppIngressHandler = (
  request: Request,
  context: WhatsAppIngressContext,
) => Promise<Response>;

type FailureCode =
  | "authority_rejected"
  | "concurrency_exhausted"
  | "content_encoding_rejected"
  | "content_length_invalid"
  | "content_type_rejected"
  | "dependency_unavailable"
  | "invalid_connection"
  | "payload_rejected"
  | "payload_too_large"
  | "provider_disabled"
  | "rate_exhausted"
  | "read_timeout"
  | "replay_mismatch"
  | "signature_rejected"
  | "total_timeout"
  | "verification_rejected";

class IngressFailure extends Error {
  constructor(
    readonly code: FailureCode,
    readonly status: number,
    readonly responseBody: "invalid" | "unavailable",
  ) {
    super(code);
    this.name = "IngressFailure";
  }
}

function requirePositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive safe integer`);
  }
}

export function createIngressSemaphore(limit: number): IngressSemaphore {
  requirePositiveSafeInteger(limit, "semaphore limit");
  let active = 0;

  return Object.freeze({
    tryAcquire(): (() => void) | null {
      if (active >= limit) return null;
      active += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        active -= 1;
      };
    },
  });
}

export function createFixedWindowRateBudget(
  limit: number,
  windowMilliseconds: number,
): IngressRateBudget {
  requirePositiveSafeInteger(limit, "rate limit");
  requirePositiveSafeInteger(windowMilliseconds, "rate window");
  let windowStartedAt: number | null = null;
  let consumed = 0;

  return Object.freeze({
    tryConsume(nowMilliseconds: number): boolean {
      if (!Number.isFinite(nowMilliseconds)) return false;
      if (
        windowStartedAt === null ||
        nowMilliseconds < windowStartedAt ||
        nowMilliseconds - windowStartedAt >= windowMilliseconds
      ) {
        windowStartedAt = nowMilliseconds;
        consumed = 0;
      }
      if (consumed >= limit) return false;
      consumed += 1;
      return true;
    },
  });
}

function safeTelemetry(
  dependencies: WhatsAppIngressDependencies,
  result: string,
  correlationId: string,
): void {
  try {
    dependencies.telemetry.record({ operation: "webhook", result, correlationId });
  } catch {
    // Telemetry is minimized and cannot alter ingress acknowledgement semantics.
  }
}

function response(
  dependencies: WhatsAppIngressDependencies,
  correlationId: string,
  status: number,
  body: string,
  result: string,
  extraHeaders?: Readonly<Record<string, string>>,
): Response {
  safeTelemetry(dependencies, result, correlationId);
  return new Response(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "x-atlas-correlation-id": correlationId,
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function failureResponse(
  dependencies: WhatsAppIngressDependencies,
  correlationId: string,
  failure: IngressFailure,
): Response {
  return response(
    dependencies,
    correlationId,
    failure.status,
    failure.responseBody,
    failure.code,
  );
}

function validateAuthority(
  authority: MetaWebhookConnectionAuthority,
  connectionId: string,
  nowMilliseconds: number,
): boolean {
  return (
    authority.owner === "communications" &&
    authority.operation === "meta_webhook_connection" &&
    IDENTIFIER.test(authority.authorityReceiptId) &&
    Number.isSafeInteger(authority.authorityVersion) &&
    authority.authorityVersion > 0 &&
    authority.connectionId === connectionId &&
    IDENTIFIER.test(authority.connectionId) &&
    PROVIDER_IDENTIFIER.test(authority.businessAccountId) &&
    PROVIDER_IDENTIFIER.test(authority.phoneNumberId) &&
    authority.issuedAt instanceof Date &&
    authority.expiresAt instanceof Date &&
    !Number.isNaN(authority.issuedAt.valueOf()) &&
    !Number.isNaN(authority.expiresAt.valueOf()) &&
    authority.issuedAt.valueOf() <= nowMilliseconds &&
    authority.expiresAt.valueOf() > nowMilliseconds &&
    authority.owningConnectionCount === 1
  );
}

function remainingMilliseconds(deadline: number, clock: IngressClock): number {
  return Math.max(0, deadline - clock.now());
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMilliseconds: number,
  clock: IngressClock,
  failure: IngressFailure,
): Promise<T> {
  if (timeoutMilliseconds <= 0) throw failure;
  let handle: unknown;
  const timeout = new Promise<never>((_resolve, reject) => {
    handle = clock.setTimeout(() => reject(failure), timeoutMilliseconds);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clock.clearTimeout(handle);
  }
}

function withinTotal<T>(
  operation: Promise<T>,
  deadline: number,
  clock: IngressClock,
): Promise<T> {
  return withTimeout(
    operation,
    remainingMilliseconds(deadline, clock),
    clock,
    new IngressFailure("total_timeout", 504, "unavailable"),
  );
}

function validatePostHeaders(request: Request, maxRawBodyBytes: number): number | null {
  if (request.headers.get("content-type") !== "application/json") {
    throw new IngressFailure("content_type_rejected", 415, "invalid");
  }
  const encoding = request.headers.get("content-encoding");
  if (encoding !== null && encoding !== "identity") {
    throw new IngressFailure("content_encoding_rejected", 415, "invalid");
  }
  const declared = request.headers.get("content-length");
  if (declared === null) return null;
  if (!CONTENT_LENGTH.test(declared)) {
    throw new IngressFailure("content_length_invalid", 400, "invalid");
  }
  const declaredBytes = Number(declared);
  if (!Number.isSafeInteger(declaredBytes)) {
    throw new IngressFailure("content_length_invalid", 400, "invalid");
  }
  if (declaredBytes > maxRawBodyBytes) {
    throw new IngressFailure("payload_too_large", 413, "invalid");
  }
  return declaredBytes;
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // Cancellation failure cannot expose request data or replace the bounded response.
  }
}

async function readRawBody(
  request: Request,
  declaredBytes: number | null,
  dependencies: WhatsAppIngressDependencies,
  deadline: number,
): Promise<Uint8Array> {
  const reader = request.body?.getReader();
  if (!reader) {
    if (declaredBytes !== null && declaredBytes !== 0) {
      throw new IngressFailure("content_length_invalid", 400, "invalid");
    }
    return new Uint8Array();
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const totalRemaining = remainingMilliseconds(deadline, dependencies.clock);
      const readTimeout = Math.min(
        dependencies.limits.readTimeoutMilliseconds,
        totalRemaining,
      );
      const timeoutFailure =
        totalRemaining <= dependencies.limits.readTimeoutMilliseconds
          ? new IngressFailure("total_timeout", 504, "unavailable")
          : new IngressFailure("read_timeout", 408, "unavailable");
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await withTimeout(
          reader.read(),
          readTimeout,
          dependencies.clock,
          timeoutFailure,
        );
      } catch (error) {
        await cancelReader(reader);
        throw error;
      }
      if (result.done) break;
      if (!(result.value instanceof Uint8Array)) {
        await cancelReader(reader);
        throw new IngressFailure("payload_rejected", 400, "invalid");
      }
      if (result.value.byteLength > dependencies.limits.maxRawBodyBytes - byteLength) {
        await cancelReader(reader);
        throw new IngressFailure("payload_too_large", 413, "invalid");
      }
      const snapshot = Uint8Array.from(result.value);
      chunks.push(snapshot);
      byteLength += snapshot.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  if (declaredBytes !== null && declaredBytes !== byteLength) {
    throw new IngressFailure("content_length_invalid", 400, "invalid");
  }
  const raw = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    raw.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return raw;
}

function isCanonicalEnvelope(
  envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
): envelope is CanonicalProviderEnvelope {
  return envelope.kind !== "unsupported_verified";
}

function createSafeCorrelationId(dependencies: WhatsAppIngressDependencies): string {
  try {
    const candidate = dependencies.createCorrelationId();
    if (CORRELATION_ID.test(candidate)) return candidate;
  } catch {
    // The fixed fallback contains no request-derived data.
  }
  return "correlation_unavailable";
}

export function createWhatsAppIngressHandler(
  dependencies: WhatsAppIngressDependencies,
): WhatsAppIngressHandler {
  requirePositiveSafeInteger(dependencies.limits.maxRawBodyBytes, "max raw body bytes");
  requirePositiveSafeInteger(dependencies.limits.readTimeoutMilliseconds, "read timeout");
  requirePositiveSafeInteger(dependencies.limits.totalTimeoutMilliseconds, "total timeout");

  return async (request, context) => {
    const correlationId = createSafeCorrelationId(dependencies);
    if (request.method !== "GET" && request.method !== "POST") {
      return response(dependencies, correlationId, 405, "method not allowed", "method_rejected", {
        allow: "GET, POST",
      });
    }
    if (!dependencies.limits.providerTrafficAllowed) {
      return response(dependencies, correlationId, 503, "unavailable", "provider_disabled");
    }
    if (!IDENTIFIER.test(context.connectionId)) {
      return failureResponse(
        dependencies,
        correlationId,
        new IngressFailure("invalid_connection", 400, "invalid"),
      );
    }

    let declaredBytes: number | null = null;
    try {
      if (request.method === "POST") {
        declaredBytes = validatePostHeaders(request, dependencies.limits.maxRawBodyBytes);
      }
    } catch (error) {
      if (error instanceof IngressFailure) {
        return failureResponse(dependencies, correlationId, error);
      }
      return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
    }

    const release = dependencies.semaphore.tryAcquire();
    if (!release) {
      return failureResponse(
        dependencies,
        correlationId,
        new IngressFailure("concurrency_exhausted", 503, "unavailable"),
      );
    }
    try {
      if (!dependencies.rateBudget.tryConsume(dependencies.clock.now())) {
        return failureResponse(
          dependencies,
          correlationId,
          new IngressFailure("rate_exhausted", 429, "unavailable"),
        );
      }

      const deadline = dependencies.clock.now() + dependencies.limits.totalTimeoutMilliseconds;
      try {
        const authority = await withinTotal(
          dependencies.authorityResolver.resolveWebhookConnectionAuthority(context.connectionId),
          deadline,
          dependencies.clock,
        );
        if (!validateAuthority(authority, context.connectionId, dependencies.clock.now())) {
          throw new IngressFailure("authority_rejected", 403, "invalid");
        }
        const secret = await withinTotal(
          dependencies.credentials.resolveVerificationSecret(context.connectionId),
          deadline,
          dependencies.clock,
        );

        if (request.method === "GET") {
          const challenge = verifyMetaChallenge(new URL(request.url).searchParams, secret.verifyToken);
          if (!challenge.accepted) {
            throw new IngressFailure("verification_rejected", 403, "invalid");
          }
          return response(
            dependencies,
            correlationId,
            200,
            challenge.challenge,
            "challenge_accepted",
          );
        }

        const raw = await readRawBody(request, declaredBytes, dependencies, deadline);
        const verification = verifyMetaWebhook({
          raw,
          signatureHeader: request.headers.get("x-hub-signature-256") ?? undefined,
          appSecret: secret.appSecret,
          maxRawBodyBytes: dependencies.limits.maxRawBodyBytes,
          connectionId: context.connectionId,
          businessAccountId: authority.businessAccountId,
          phoneNumberId: authority.phoneNumberId,
          correlationId,
          verifiedAt: new Date(dependencies.clock.now()),
        });
        if (verification.status !== "verified") {
          throw new IngressFailure("signature_rejected", 403, "invalid");
        }

        const envelope = await withinTotal(
          dependencies.adapter.normalizeVerifiedEvent(raw, verification.context),
          deadline,
          dependencies.clock,
        );
        if (!isCanonicalEnvelope(envelope)) {
          throw new IngressFailure("payload_rejected", 400, "invalid");
        }

        const acceptance = await withinTotal(
          dependencies.acceptInbound({
            authority,
            connectionId: context.connectionId,
            providerEventId: envelope.externalEventReference,
            providerBodyDigest: createHash("sha256").update(raw).digest("hex"),
            envelope,
            correlationId,
          }),
          deadline,
          dependencies.clock,
        );
        if (acceptance.status === "accepted" || acceptance.status === "duplicate") {
          return response(dependencies, correlationId, 200, "accepted", acceptance.status);
        }
        throw new IngressFailure("replay_mismatch", 409, "invalid");
      } catch (error) {
        if (error instanceof IngressFailure) {
          return failureResponse(dependencies, correlationId, error);
        }
        return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
      }
    } finally {
      release();
    }
  };
}
