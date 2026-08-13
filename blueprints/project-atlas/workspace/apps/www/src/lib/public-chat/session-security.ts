export const PUBLIC_CHAT_COOKIE_NAME = "__Host-atlas_public_chat";
export const PUBLIC_CHAT_CSRF_HEADER = "x-atlas-chat-csrf";

export type PublicChatSessionRecord = {
  id: string;
  sessionHash: string;
  csrfHash: string;
  correlationId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
};

export interface PublicChatSessionStore {
  create(record: PublicChatSessionRecord): Promise<void>;
  findBySessionHash(sessionHash: string): Promise<PublicChatSessionRecord | null>;
  rotateSecrets(
    currentSessionHash: string,
    next: { sessionHash: string; csrfHash: string; expiresAt: Date; updatedAt: Date },
  ): Promise<PublicChatSessionRecord | null>;
  revoke(sessionHash: string, revokedAt: Date): Promise<boolean>;
}

export type MemoryPublicChatSessionStore = PublicChatSessionStore & {
  snapshot(): Promise<PublicChatSessionRecord[]>;
  revokeByCookieValue(cookieValue: string, at: Date): Promise<void>;
};

export type AuthenticatedPublicChatSession = {
  sessionHash: string;
  correlationId: string;
};

export type PublicChatSessionSecurity = {
  bootstrap(): Promise<{
    cookieValue: string;
    csrfToken: string;
    correlationId: string;
    expiresAt: Date;
  }>;
  authenticate(
    request: Request,
    options: { requireCsrf: boolean },
  ): Promise<
    | { ok: true; session: AuthenticatedPublicChatSession }
    | { ok: false; code: "session_invalid" | "csrf_invalid" }
  >;
  rotate(
    request: Request,
    options?: { requireCsrf?: boolean },
  ): Promise<
    | {
        ok: true;
        cookieValue: string;
        csrfToken: string;
        correlationId: string;
        expiresAt: Date;
      }
    | { ok: false }
  >;
  terminate(request: Request): Promise<boolean>;
};

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function readCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const matches = header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${PUBLIC_CHAT_COOKIE_NAME}=`));
  if (matches.length !== 1) return null;
  const value = matches[0]?.slice(PUBLIC_CHAT_COOKIE_NAME.length + 1) ?? "";
  return /^[A-Za-z0-9_-]{32,128}$/u.test(value) ? value : null;
}

function defaultRandomId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createMemoryPublicChatSessionStore(): MemoryPublicChatSessionStore {
  const records = new Map<string, PublicChatSessionRecord>();
  return {
    async create(record) {
      records.set(record.sessionHash, structuredClone(record));
    },
    async findBySessionHash(sessionHash) {
      const record = records.get(sessionHash);
      return record ? structuredClone(record) : null;
    },
    async rotateSecrets(currentSessionHash, next) {
      const record = records.get(currentSessionHash);
      if (!record || record.revokedAt) return null;
      records.delete(currentSessionHash);
      const rotated = {
        ...record,
        sessionHash: next.sessionHash,
        csrfHash: next.csrfHash,
        expiresAt: next.expiresAt,
      };
      records.set(rotated.sessionHash, rotated);
      return structuredClone(rotated);
    },
    async revoke(sessionHash, revokedAt) {
      const record = records.get(sessionHash);
      if (!record || record.revokedAt) return false;
      records.set(sessionHash, { ...record, revokedAt });
      return true;
    },
    async snapshot() {
      return [...records.values()].map((record) => structuredClone(record));
    },
    async revokeByCookieValue(cookieValue, at) {
      const record = records.get(await sha256(cookieValue));
      if (record) records.set(record.sessionHash, { ...record, revokedAt: at });
    },
  };
}

export function createPublicChatSessionSecurity(input: {
  store: PublicChatSessionStore;
  ttlSeconds: number;
  now?: () => Date;
  randomId?: () => string;
}): PublicChatSessionSecurity {
  const now = input.now ?? (() => new Date());
  const randomId = input.randomId ?? defaultRandomId;
  const authenticate: PublicChatSessionSecurity["authenticate"] = async (request, options) => {
    const cookieValue = readCookie(request);
    if (!cookieValue) return { ok: false, code: "session_invalid" };
    const sessionHash = await sha256(cookieValue);
    const record = await input.store.findBySessionHash(sessionHash);
    if (!record || record.revokedAt || record.expiresAt.getTime() <= now().getTime()) {
      return { ok: false, code: "session_invalid" };
    }
    if (options.requireCsrf) {
      const csrfToken = request.headers.get(PUBLIC_CHAT_CSRF_HEADER);
      if (!csrfToken || csrfToken.length > 128) return { ok: false, code: "csrf_invalid" };
      const csrfHash = await sha256(csrfToken);
      if (!constantTimeEqual(csrfHash, record.csrfHash)) {
        return { ok: false, code: "csrf_invalid" };
      }
    }
    return {
      ok: true,
      session: { sessionHash: record.sessionHash, correlationId: record.correlationId },
    };
  };
  return {
    async bootstrap() {
      const createdAt = now();
      const cookieValue = randomId();
      const csrfToken = randomId();
      const correlationId = randomId();
      const expiresAt = new Date(createdAt.getTime() + input.ttlSeconds * 1_000);
      await input.store.create({
        id: `session_${randomId()}`,
        sessionHash: await sha256(cookieValue),
        csrfHash: await sha256(csrfToken),
        correlationId,
        expiresAt,
        revokedAt: null,
        createdAt,
      });
      return { cookieValue, csrfToken, correlationId, expiresAt };
    },

    authenticate,

    async rotate(request, options) {
      const authenticated = await authenticate(request, {
        requireCsrf: options?.requireCsrf ?? true,
      });
      if (!authenticated.ok) return { ok: false };
      const cookieValue = randomId();
      const csrfToken = randomId();
      const updatedAt = now();
      const expiresAt = new Date(updatedAt.getTime() + input.ttlSeconds * 1_000);
      const rotated = await input.store.rotateSecrets(authenticated.session.sessionHash, {
        sessionHash: await sha256(cookieValue),
        csrfHash: await sha256(csrfToken),
        expiresAt,
        updatedAt,
      });
      return rotated
        ? {
            ok: true,
            cookieValue,
            csrfToken,
            correlationId: rotated.correlationId,
            expiresAt,
          }
        : { ok: false };
    },

    async terminate(request) {
      const authenticated = await authenticate(request, { requireCsrf: true });
      return authenticated.ok
        ? input.store.revoke(authenticated.session.sessionHash, now())
        : false;
    },
  };
}

export function serializePublicChatCookie(cookieValue: string, maxAgeSeconds: number): string {
  return `${PUBLIC_CHAT_COOKIE_NAME}=${cookieValue}; Secure; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function expirePublicChatCookie(): string {
  return `${PUBLIC_CHAT_COOKIE_NAME}=deleted; Secure; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
