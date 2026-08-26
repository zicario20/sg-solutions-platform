import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type {
  AcceptPublicFormCommand,
  AcceptPublicFormResult,
  ResumePublicFormDraftResult,
  RevokePublicFormConsentCommand,
  RevokePublicFormConsentResult,
  SavePublicFormDraftCommand,
  SavePublicFormDraftResult,
} from "@atlas/domain";
import { parsePublicSubmissionEnvelope } from "@atlas/validation";

const COOKIE_NAME = "__Host-atlas-public-forms";
const MAX_BODY_BYTES = 32 * 1024;
const SAFE_CODE = /^[a-z][a-z0-9_]{1,63}$/u;
const SAFE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const PURPOSES = new Set([
  "lead_request",
  "callback_request",
  "appointment_preference",
  "service_interest",
]);

type ResumePublicFormDraftCommand = Readonly<{
  draftReference: string;
  sessionBinding: string;
}>;

export interface PublicFormsFacadePort {
  acceptPublicSubmission(command: AcceptPublicFormCommand): Promise<AcceptPublicFormResult>;
  saveDraft(command: SavePublicFormDraftCommand): Promise<SavePublicFormDraftResult>;
  resumeDraft(command: ResumePublicFormDraftCommand): Promise<ResumePublicFormDraftResult>;
  revokeConsent(command: RevokePublicFormConsentCommand): Promise<RevokePublicFormConsentResult>;
}

export interface FormAdmissionTokens {
  issue(input: {
    formCode: string;
    formVersion: string;
    locale: "es" | "en";
    purpose: string;
    sessionToken?: string;
  }): { nonce: string; csrfToken: string; sessionToken: string; expiresInSeconds: number };
  verify(input: {
    nonce: string;
    csrfToken: string;
    sessionToken: string;
    formCode: string;
    formVersion: string;
    locale: "es" | "en";
  }): { valid: true; sessionBinding: string } | { valid: false };
}

export type FormAdmissionOperation =
  | "bootstrap"
  | "submit"
  | "draft_save"
  | "draft_resume"
  | "consent_revoke";

export interface FormRateLimiter {
  readonly scope: "local" | "shared";
  allow(input: { bucket: string; operation: FormAdmissionOperation; now: Date }): Promise<boolean>;
}

type SignedPayload = {
  v: 1;
  formCode: string;
  formVersion: string;
  locale: "es" | "en";
  purpose: string;
  sessionDigest: string;
  csrfDigest: string;
  issuedAt: number;
  expiresAt: number;
};

function digest(secret: string, purpose: string, value: string): string {
  return createHmac("sha256", secret).update(`${purpose}\u0000${value}`).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSignedFormAdmissionTokens(input: {
  secret: string;
  clock: { now(): Date };
  randomToken?: () => string;
  ttlSeconds: number;
}): FormAdmissionTokens {
  if (Buffer.byteLength(input.secret) < 32 || input.ttlSeconds < 60 || input.ttlSeconds > 1_800) {
    throw new Error("PUBLIC_FORMS_ADMISSION_CONFIGURATION_INVALID");
  }
  const randomToken = input.randomToken ?? (() => randomBytes(24).toString("base64url"));
  const grants = new Map<string, SignedPayload>();
  const grantKey = (nonce: string) => digest(input.secret, "nonce", nonce);
  const purgeExpired = (now: number) => {
    for (const [key, grant] of grants) {
      if (grant.expiresAt <= now) grants.delete(key);
    }
  };

  return {
    issue(binding) {
      const now = Math.floor(input.clock.now().getTime() / 1_000);
      const { sessionToken: existingSessionToken, ...grantBinding } = binding;
      const sessionToken =
        existingSessionToken &&
        existingSessionToken.length >= 20 &&
        existingSessionToken.length <= 180 &&
        /^[A-Za-z0-9_-]+$/u.test(existingSessionToken)
          ? existingSessionToken
          : randomToken();
      const csrfToken = randomToken();
      const nonce = randomToken();
      const payload: SignedPayload = {
        v: 1,
        ...grantBinding,
        sessionDigest: digest(input.secret, "session", sessionToken),
        csrfDigest: digest(input.secret, "csrf", csrfToken),
        issuedAt: now,
        expiresAt: now + input.ttlSeconds,
      };
      purgeExpired(now);
      if (grants.size >= 4_096) grants.delete(grants.keys().next().value as string);
      grants.set(grantKey(nonce), payload);
      return {
        nonce,
        csrfToken,
        sessionToken,
        expiresInSeconds: input.ttlSeconds,
      };
    },
    verify(candidate) {
      try {
        const now = Math.floor(input.clock.now().getTime() / 1_000);
        purgeExpired(now);
        const payload = grants.get(grantKey(candidate.nonce));
        if (
          !payload ||
          payload.v !== 1 ||
          payload.formCode !== candidate.formCode ||
          payload.formVersion !== candidate.formVersion ||
          payload.locale !== candidate.locale ||
          payload.issuedAt > now + 30 ||
          payload.expiresAt <= now ||
          payload.expiresAt - payload.issuedAt !== input.ttlSeconds ||
          !safeEqual(
            payload.sessionDigest,
            digest(input.secret, "session", candidate.sessionToken),
          ) ||
          !safeEqual(payload.csrfDigest, digest(input.secret, "csrf", candidate.csrfToken))
        ) {
          return { valid: false };
        }
        return { valid: true, sessionBinding: payload.sessionDigest };
      } catch {
        return { valid: false };
      }
    },
  };
}

export function createMemoryFormRateLimiter(input: {
  limit: number;
  windowSeconds: number;
  maxBuckets?: number;
}): FormRateLimiter {
  if (input.limit < 1 || input.windowSeconds < 1)
    throw new Error("PUBLIC_FORMS_RATE_LIMIT_INVALID");
  const buckets = new Map<string, { count: number; expiresAt: number }>();
  const maxBuckets = input.maxBuckets ?? 4_096;
  return {
    scope: "local" as const,
    async allow({ bucket, operation, now }) {
      if (!/^[0-9a-f]{64}$/u.test(bucket)) return false;
      const partition = `${operation}:${bucket}`;
      const currentTime = now.getTime();
      const current = buckets.get(partition);
      if (!current || current.expiresAt <= currentTime) {
        if (buckets.size >= maxBuckets) {
          for (const [key, value] of buckets) {
            if (value.expiresAt <= currentTime) buckets.delete(key);
          }
          if (buckets.size >= maxBuckets) buckets.delete(buckets.keys().next().value as string);
        }
        buckets.set(partition, { count: 1, expiresAt: currentTime + input.windowSeconds * 1_000 });
        return true;
      }
      current.count += 1;
      return current.count <= input.limit;
    },
  };
}

function requestIsSameOrigin(request: Request, canonicalOrigin: string): boolean {
  let canonical: URL;
  try {
    canonical = new URL(canonicalOrigin);
  } catch {
    return false;
  }
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const fetchMode = request.headers.get("sec-fetch-mode");
  return (
    request.method === "POST" &&
    origin === canonical.origin &&
    new URL(request.url).origin === canonical.origin &&
    fetchSite === "same-origin" &&
    (fetchMode === "cors" || fetchMode === "same-origin") &&
    request.headers.get("content-encoding") === null &&
    /^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(request.headers.get("content-type") ?? "")
  );
}

function skipWhitespace(source: string, cursor: { value: number }): void {
  while (/\s/u.test(source[cursor.value] ?? "")) cursor.value += 1;
}

function scanString(source: string, cursor: { value: number }): string {
  const start = cursor.value;
  cursor.value += 1;
  while (cursor.value < source.length) {
    const character = source[cursor.value];
    if (character === "\\") {
      cursor.value += 2;
      continue;
    }
    cursor.value += 1;
    if (character === '"') return JSON.parse(source.slice(start, cursor.value)) as string;
  }
  throw new Error("invalid json");
}

function scanValue(source: string, cursor: { value: number }, depth: number): void {
  if (depth > 16) throw new Error("invalid json");
  skipWhitespace(source, cursor);
  const character = source[cursor.value];
  if (character === '"') {
    scanString(source, cursor);
    return;
  }
  if (character === "{") {
    cursor.value += 1;
    const keys = new Set<string>();
    skipWhitespace(source, cursor);
    if (source[cursor.value] === "}") {
      cursor.value += 1;
      return;
    }
    while (cursor.value < source.length) {
      skipWhitespace(source, cursor);
      if (source[cursor.value] !== '"') throw new Error("invalid json");
      const key = scanString(source, cursor);
      if (keys.has(key)) throw new Error("duplicate json key");
      keys.add(key);
      skipWhitespace(source, cursor);
      if (source[cursor.value] !== ":") throw new Error("invalid json");
      cursor.value += 1;
      scanValue(source, cursor, depth + 1);
      skipWhitespace(source, cursor);
      if (source[cursor.value] === "}") {
        cursor.value += 1;
        return;
      }
      if (source[cursor.value] !== ",") throw new Error("invalid json");
      cursor.value += 1;
    }
    throw new Error("invalid json");
  }
  if (character === "[") {
    cursor.value += 1;
    skipWhitespace(source, cursor);
    if (source[cursor.value] === "]") {
      cursor.value += 1;
      return;
    }
    while (cursor.value < source.length) {
      scanValue(source, cursor, depth + 1);
      skipWhitespace(source, cursor);
      if (source[cursor.value] === "]") {
        cursor.value += 1;
        return;
      }
      if (source[cursor.value] !== ",") throw new Error("invalid json");
      cursor.value += 1;
    }
    throw new Error("invalid json");
  }
  const start = cursor.value;
  while (cursor.value < source.length && !/[\s,}\]]/u.test(source[cursor.value] ?? "")) {
    cursor.value += 1;
  }
  if (cursor.value === start) throw new Error("invalid json");
}

function parseJsonWithoutDuplicateKeys(source: string): Record<string, unknown> {
  const cursor = { value: 0 };
  scanValue(source, cursor, 0);
  skipWhitespace(source, cursor);
  if (cursor.value !== source.length) throw new Error("invalid json");
  const value = JSON.parse(source) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid json");
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error("invalid json");
  return value as Record<string, unknown>;
}

async function readBoundedJson(request: Request): Promise<Record<string, unknown>> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/u.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw new Error("payload too large");
  }
  if (!request.body) throw new Error("body required");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("payload too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return parseJsonWithoutDuplicateKeys(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function cookieValue(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === COOKIE_NAME) return value.join("=");
  }
  return undefined;
}

function json(status: number, payload: Record<string, unknown>, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function deriveAttribution(request: Request, canonicalOrigin: string) {
  try {
    const canonical = new URL(canonicalOrigin);
    const referrer = request.headers.get("referer");
    if (!referrer) return undefined;
    const source = new URL(referrer);
    if (source.origin !== canonical.origin || !/^\/[A-Za-z0-9/_-]{0,180}$/u.test(source.pathname)) {
      return undefined;
    }
    return Object.freeze({
      referrer: `${source.origin}${source.pathname}`,
      landingPage: source.pathname,
    });
  } catch {
    return undefined;
  }
}

const invalid = () => json(400, { ok: false, code: "invalid_request" });
const review = () => json(202, { ok: true, code: "request_received_for_review" });

function parseBootstrap(value: Record<string, unknown>): {
  formCode: string;
  formVersion: string;
  locale: "es" | "en";
  purpose: string;
} {
  if (
    Object.keys(value).some(
      (key) => !["formCode", "formVersion", "locale", "purpose"].includes(key),
    ) ||
    typeof value.formCode !== "string" ||
    !SAFE_CODE.test(value.formCode) ||
    typeof value.formVersion !== "string" ||
    !SAFE_VERSION.test(value.formVersion) ||
    (value.locale !== "es" && value.locale !== "en") ||
    typeof value.purpose !== "string" ||
    !PURPOSES.has(value.purpose)
  ) {
    throw new Error("invalid bootstrap");
  }
  return {
    formCode: value.formCode,
    formVersion: value.formVersion,
    locale: value.locale,
    purpose: value.purpose,
  };
}

export function createFormAdmissionHandlers(dependencies: {
  canonicalOrigin: string;
  tokens: FormAdmissionTokens;
  rateLimiter: FormRateLimiter;
  networkBucket(request: Request, operation: FormAdmissionOperation): Promise<string | undefined>;
  facade: PublicFormsFacadePort;
  clock?: { now(): Date };
  correlationId?: () => string;
}) {
  const clock = dependencies.clock ?? { now: () => new Date() };
  const correlationId =
    dependencies.correlationId ?? (() => `form_correlation_${randomBytes(16).toString("hex")}`);

  async function admitted(
    request: Request,
    operation: FormAdmissionOperation,
  ): Promise<string | undefined> {
    if (!requestIsSameOrigin(request, dependencies.canonicalOrigin)) return undefined;
    try {
      const bucket = await dependencies.networkBucket(request, operation);
      return bucket &&
        (await dependencies.rateLimiter.allow({ bucket, operation, now: clock.now() }))
        ? bucket
        : undefined;
    } catch {
      return undefined;
    }
  }

  return {
    async bootstrap(request: Request): Promise<Response> {
      if (!(await admitted(request, "bootstrap"))) return invalid();
      try {
        const binding = parseBootstrap(await readBoundedJson(request));
        const existingSessionToken = cookieValue(request);
        const issued = dependencies.tokens.issue({
          ...binding,
          ...(existingSessionToken ? { sessionToken: existingSessionToken } : {}),
        });
        return json(
          200,
          {
            nonce: issued.nonce,
            csrfToken: issued.csrfToken,
            expiresInSeconds: issued.expiresInSeconds,
          },
          {
            "set-cookie": `${COOKIE_NAME}=${issued.sessionToken}; Path=/; Max-Age=${issued.expiresInSeconds}; HttpOnly; Secure; SameSite=Lax`,
          },
        );
      } catch {
        return invalid();
      }
    },

    async submit(request: Request): Promise<Response> {
      if (!(await admitted(request, "submit"))) return invalid();
      let raw: Record<string, unknown>;
      try {
        raw = await readBoundedJson(request);
      } catch {
        return invalid();
      }
      if (typeof raw.honeypot === "string" && raw.honeypot.length > 0) return review();
      try {
        const envelope = parsePublicSubmissionEnvelope(raw);
        const sessionToken = cookieValue(request);
        const csrfToken = request.headers.get("x-atlas-csrf");
        if (!sessionToken || !csrfToken || csrfToken.length > 180) return invalid();
        const binding = dependencies.tokens.verify({
          nonce: envelope.nonce,
          csrfToken,
          sessionToken,
          formCode: envelope.formCode,
          formVersion: envelope.formVersion,
          locale: envelope.locale,
        });
        if (!binding.valid) return invalid();
        const attribution = deriveAttribution(request, dependencies.canonicalOrigin);
        const result = await dependencies.facade.acceptPublicSubmission({
          formCode: envelope.formCode,
          formVersion: envelope.formVersion,
          locale: envelope.locale,
          nonce: envelope.nonce,
          sessionBinding: binding.sessionBinding,
          idempotencyKey: envelope.idempotencyKey,
          correlationId: correlationId(),
          answers: envelope.answers,
          consents: envelope.consents,
          ...(attribution ? { attribution } : {}),
        });
        if (result.status === "accepted") {
          return json(202, { ok: true, status: "accepted", receiptId: result.receiptId });
        }
        if (result.status === "request_received_for_review") return review();
        if (result.status === "rejected") return invalid();
        return json(503, { ok: false, code: "temporarily_unavailable" });
      } catch {
        return invalid();
      }
    },

    async saveDraft(request: Request): Promise<Response> {
      if (!(await admitted(request, "draft_save"))) return invalid();
      try {
        const raw = await readBoundedJson(request);
        if (
          Object.keys(raw).some(
            (key) =>
              ![
                "formCode",
                "formVersion",
                "locale",
                "nonce",
                "answers",
                "draftReference",
                "honeypot",
              ].includes(key),
          ) ||
          typeof raw.formCode !== "string" ||
          !SAFE_CODE.test(raw.formCode) ||
          typeof raw.formVersion !== "string" ||
          !SAFE_VERSION.test(raw.formVersion) ||
          (raw.locale !== "es" && raw.locale !== "en") ||
          typeof raw.nonce !== "string" ||
          raw.nonce.length > 180 ||
          !raw.answers ||
          typeof raw.answers !== "object" ||
          Array.isArray(raw.answers) ||
          (raw.draftReference !== undefined && typeof raw.draftReference !== "string")
        ) {
          return invalid();
        }
        if (typeof raw.honeypot === "string" && raw.honeypot.length > 0) return review();
        const binding = verifyWorkflowGrant(request, raw);
        if (!binding) return invalid();
        const validatedAnswers = parsePublicSubmissionEnvelope({
          formCode: raw.formCode,
          formVersion: raw.formVersion,
          locale: raw.locale,
          nonce: raw.nonce,
          idempotencyKey: raw.nonce.replaceAll("_", "-"),
          answers: raw.answers,
          consents: {},
        }).answers;
        const result = await dependencies.facade.saveDraft({
          formCode: raw.formCode,
          formVersion: raw.formVersion,
          locale: raw.locale,
          sessionBinding: binding,
          answers: validatedAnswers,
          ...(typeof raw.draftReference === "string" ? { draftReference: raw.draftReference } : {}),
        });
        if (result.status === "saved") {
          return json(200, {
            ok: true,
            status: result.status,
            draftReference: result.draftReference,
            expiresAt: result.expiresAt.toISOString(),
          });
        }
        if (result.status === "unavailable") {
          return json(503, { ok: false, code: "temporarily_unavailable" });
        }
        return invalid();
      } catch {
        return invalid();
      }
    },

    async resumeDraft(request: Request): Promise<Response> {
      if (!(await admitted(request, "draft_resume"))) return invalid();
      try {
        const raw = await readBoundedJson(request);
        if (
          Object.keys(raw).some(
            (key) =>
              !["formCode", "formVersion", "locale", "nonce", "draftReference"].includes(key),
          ) ||
          typeof raw.formCode !== "string" ||
          !SAFE_CODE.test(raw.formCode) ||
          typeof raw.formVersion !== "string" ||
          !SAFE_VERSION.test(raw.formVersion) ||
          (raw.locale !== "es" && raw.locale !== "en") ||
          typeof raw.nonce !== "string" ||
          raw.nonce.length > 180 ||
          typeof raw.draftReference !== "string"
        ) {
          return invalid();
        }
        const binding = verifyWorkflowGrant(request, raw);
        if (!binding) return invalid();
        const result = await dependencies.facade.resumeDraft({
          sessionBinding: binding,
          draftReference: raw.draftReference,
        });
        if (result.status === "resumed") {
          return json(200, {
            ok: true,
            status: result.status,
            answers: result.answers,
            expiresAt: result.expiresAt.toISOString(),
          });
        }
        if (result.status === "expired") return json(410, { ok: false, code: "draft_expired" });
        if (result.status === "unavailable") {
          return json(503, { ok: false, code: "temporarily_unavailable" });
        }
        return invalid();
      } catch {
        return invalid();
      }
    },

    async revokeConsent(request: Request): Promise<Response> {
      if (!(await admitted(request, "consent_revoke"))) return invalid();
      try {
        const raw = await readBoundedJson(request);
        if (
          Object.keys(raw).some(
            (key) =>
              ![
                "formCode",
                "formVersion",
                "locale",
                "nonce",
                "submissionReceiptId",
                "consentType",
                "consentVersion",
                "idempotencyKey",
              ].includes(key),
          ) ||
          typeof raw.formCode !== "string" ||
          !SAFE_CODE.test(raw.formCode) ||
          typeof raw.formVersion !== "string" ||
          !SAFE_VERSION.test(raw.formVersion) ||
          (raw.locale !== "es" && raw.locale !== "en") ||
          typeof raw.nonce !== "string" ||
          raw.nonce.length > 180 ||
          typeof raw.submissionReceiptId !== "string" ||
          typeof raw.consentType !== "string" ||
          typeof raw.consentVersion !== "string" ||
          typeof raw.idempotencyKey !== "string"
        ) {
          return invalid();
        }
        const binding = verifyWorkflowGrant(request, raw);
        if (!binding) return invalid();
        const result = await dependencies.facade.revokeConsent({
          submissionReceiptId: raw.submissionReceiptId,
          consentType: raw.consentType,
          consentVersion: raw.consentVersion,
          idempotencyKey: raw.idempotencyKey,
          sessionBinding: binding,
        });
        if (result.status === "revoked" || result.status === "replayed") {
          return json(202, { ok: true, status: result.status, revocationId: result.revocationId });
        }
        if (result.status === "unavailable") {
          return json(503, { ok: false, code: "temporarily_unavailable" });
        }
        return invalid();
      } catch {
        return invalid();
      }
    },
  };

  function verifyWorkflowGrant(request: Request, raw: Record<string, unknown>): string | undefined {
    const sessionToken = cookieValue(request);
    const csrfToken = request.headers.get("x-atlas-csrf");
    if (
      !sessionToken ||
      !csrfToken ||
      csrfToken.length > 180 ||
      typeof raw.formCode !== "string" ||
      typeof raw.formVersion !== "string" ||
      (raw.locale !== "es" && raw.locale !== "en") ||
      typeof raw.nonce !== "string"
    ) {
      return undefined;
    }
    const result = dependencies.tokens.verify({
      nonce: raw.nonce,
      csrfToken,
      sessionToken,
      formCode: raw.formCode,
      formVersion: raw.formVersion,
      locale: raw.locale,
    });
    return result.valid ? result.sessionBinding : undefined;
  }
}

export function publicFormsOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "POST, OPTIONS",
      "cache-control": "no-store",
    },
  });
}
