import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import {
  createPublicFormsSql,
  PostgresFormOutboxStore,
  PostgresPublicFormsRepository,
} from "@atlas/database";
import {
  createProviderDisabledPublicFormPorts,
  PublicFormsLifecycleService,
  PublicFormsService,
  SyntheticFormOutboxStore,
  type AnswerProtectionPort,
  type DraftProtectionPort,
  type FormOutboxStore,
  type PublicFormsRepository,
} from "@atlas/domain";

import {
  createFormAdmissionHandlers,
  createMemoryFormRateLimiter,
  createSignedFormAdmissionTokens,
  type FormAdmissionOperation,
  type FormRateLimiter,
  type PublicFormsFacadePort,
} from "./admission.ts";

type Clock = Readonly<{ now(): Date }>;

export type ProviderDisabledPublicFormsRuntimeConfig = Readonly<{
  canonicalOrigin: string;
  repository: PublicFormsRepository;
  outboxStore: FormOutboxStore;
  admissionScope?: "local" | "public";
  rateLimiter?: FormRateLimiter;
  networkBucket?: (request: Request, operation: FormAdmissionOperation) => Promise<string | undefined>;
  clock?: Clock;
  secrets: Readonly<{
    admission: string;
    networkBucket: string;
    digest: string;
    encryptionKeyBase64: string;
    encryptionKeyReference: string;
  }>;
}>;

function encryptedValueBoundary(input: {
  key: Buffer;
  keyReference: string;
  digestSecret: string;
}): { answerProtection: AnswerProtectionPort; draftProtection: DraftProtectionPort } {
  if (input.key.byteLength !== 32 || Buffer.byteLength(input.digestSecret) < 32) {
    throw new Error("PUBLIC_FORMS_ENCRYPTION_CONFIGURATION_INVALID");
  }

  const seal = (plaintext: string, context: string): string => {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", input.key, nonce);
    cipher.setAAD(Buffer.from(context, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return [nonce, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
  };
  const open = (payload: string, context: string): string => {
    const parts = payload.split(".").map((part) => Buffer.from(part, "base64url"));
    if (parts.length !== 3 || parts[0]?.byteLength !== 12 || parts[1]?.byteLength !== 16) {
      throw new Error("PUBLIC_FORM_DRAFT_CIPHERTEXT_INVALID");
    }
    const decipher = createDecipheriv("aes-256-gcm", input.key, parts[0]);
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(parts[1]);
    return Buffer.concat([decipher.update(parts[2] ?? Buffer.alloc(0)), decipher.final()]).toString(
      "utf8",
    );
  };
  const matchDigest = (fieldType: "email" | "tel", value: unknown) =>
    createHmac("sha256", input.digestSecret)
      .update(`public-forms:contact-match:v1\u0000${fieldType}\u0000${JSON.stringify(value)}`)
      .digest("hex");

  return {
    answerProtection: {
      async protect(value) {
        const context = [
          "m006.answer.v1",
          value.submissionId,
          value.formCode,
          value.formVersion,
          value.locale,
          value.fieldCode,
          value.sensitivity,
          input.keyReference,
        ].join("\u0000");
        return {
          ciphertext: seal(JSON.stringify(value.value), context),
          keyReference: input.keyReference,
          encryptionContextVersion: "m006.answer.v1" as const,
          ...(value.matchDigestRequired && (value.fieldType === "email" || value.fieldType === "tel")
            ? { matchDigest: matchDigest(value.fieldType, value.value) }
            : {}),
        };
      },
    },
    draftProtection: {
      async seal(value) {
        return {
          ciphertext: seal(value.plaintext, value.context),
          keyReference: input.keyReference,
        };
      },
      async open(value) {
        if (value.keyReference !== input.keyReference) {
          throw new Error("PUBLIC_FORM_DRAFT_KEY_REFERENCE_INVALID");
        }
        return open(value.ciphertext, value.context);
      },
    },
  };
}

function localOutboxRepository(
  repository: PublicFormsRepository,
  outboxStore: FormOutboxStore,
): PublicFormsRepository {
  if (!(outboxStore instanceof SyntheticFormOutboxStore)) return repository;
  return new Proxy(repository, {
    get(target, property, receiver) {
      if (property === "commitAcceptedSubmission") {
        return async (input: Parameters<PublicFormsRepository["commitAcceptedSubmission"]>[0]) => {
          const receipt = await target.commitAcceptedSubmission(input);
          await outboxStore.enqueue({
            submissionRef: input.submission.submissionId,
            commands: input.submission.outbox,
            grantedConsentTypes: input.submission.consents
              .filter((consent) => consent.granted)
              .map((consent) => consent.consentType),
            now: input.submission.acceptedAt,
          });
          return receipt;
        };
      }
      const value = Reflect.get(target, property, receiver) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export function createProviderDisabledPublicFormsRuntime(
  config: ProviderDisabledPublicFormsRuntimeConfig,
) {
  const admissionScope = config.admissionScope ?? "local";
  if (
    admissionScope === "public" &&
    (!config.rateLimiter || config.rateLimiter.scope !== "shared" || !config.networkBucket)
  ) {
    throw new Error("PUBLIC_FORMS_SHARED_ADMISSION_REQUIRED");
  }
  const clock = config.clock ?? { now: () => new Date() };
  const key = Buffer.from(config.secrets.encryptionKeyBase64, "base64");
  const protection = encryptedValueBoundary({
    key,
    keyReference: config.secrets.encryptionKeyReference,
    digestSecret: config.secrets.digest,
  });
  const digest = {
    async digest(value: string): Promise<string> {
      return createHmac("sha256", config.secrets.digest).update(value).digest("hex");
    },
  };
  const ids = {
    next(kind: string): string {
      const value = randomUUID();
      return kind === "form_draft" ? `form_draft_${value.replaceAll("-", "")}` : value;
    },
  };
  const repository = localOutboxRepository(config.repository, config.outboxStore);
  const service = new PublicFormsService({
    repository,
    clock,
    ids,
    digest,
    answerProtection: protection.answerProtection,
  });
  const lifecycle = new PublicFormsLifecycleService({
    repository,
    clock,
    ids,
    digest,
    draftProtection: protection.draftProtection,
    draftTtlMs: 24 * 60 * 60 * 1_000,
  });
  const ports = createProviderDisabledPublicFormPorts();
  const facade: PublicFormsFacadePort = {
    async acceptPublicSubmission(command) {
      return service.accept(command);
    },
    saveDraft: (command) => lifecycle.saveDraft(command),
    resumeDraft: (command) => lifecycle.resumeDraft(command),
    revokeConsent: (command) => lifecycle.revokeConsent(command),
  };
  const handlers = createFormAdmissionHandlers({
    canonicalOrigin: config.canonicalOrigin,
    tokens: createSignedFormAdmissionTokens({
      secret: config.secrets.admission,
      clock,
      ttlSeconds: 900,
    }),
    rateLimiter: config.rateLimiter ?? createMemoryFormRateLimiter({ limit: 20, windowSeconds: 60 }),
    async networkBucket(request, operation) {
      const identity = config.networkBucket
        ? await config.networkBucket(request, operation)
        : "provider-disabled-local";
      return identity
        ? createHmac("sha256", config.secrets.networkBucket)
            .update(`m006:admission:v1\u0000${operation}\u0000${identity}`)
            .digest("hex")
        : undefined;
    },
    facade,
    clock,
  });
  return Object.freeze({ ...handlers, ports });
}

const unavailableFacade: PublicFormsFacadePort = {
  async acceptPublicSubmission() {
    return { status: "unavailable", code: "form_unavailable" };
  },
  async saveDraft() {
    return { status: "unavailable" };
  },
  async resumeDraft() {
    return { status: "unavailable" };
  },
  async revokeConsent() {
    return { status: "unavailable" };
  },
};

let unavailableRuntime: ReturnType<typeof createFormAdmissionHandlers> | undefined;
let configuredRuntime: ReturnType<typeof createProviderDisabledPublicFormsRuntime> | undefined;

export function configureAttestedPublicFormsRuntime(
  config: ProviderDisabledPublicFormsRuntimeConfig & Readonly<{ admissionScope: "public" }>,
) {
  configuredRuntime ??= createProviderDisabledPublicFormsRuntime(config);
  return configuredRuntime;
}

function configuredProviderDisabledRuntime(): ReturnType<typeof createProviderDisabledPublicFormsRuntime> | undefined {
  if (import.meta.env.PUBLIC_FORMS_DATABASE_URL) {
    throw new Error("PUBLIC_FORMS_DATABASE_CREDENTIAL_MUST_BE_SERVER_ONLY");
  }
  const databaseUrl = import.meta.env.FORMS_DATABASE_URL;
  const admission = import.meta.env.FORMS_ADMISSION_SECRET;
  const networkBucket = import.meta.env.FORMS_NETWORK_BUCKET_SECRET;
  const digest = import.meta.env.FORMS_DIGEST_SECRET;
  const encryptionKeyBase64 = import.meta.env.FORMS_ENCRYPTION_KEY_BASE64;
  const encryptionKeyReference = import.meta.env.FORMS_ENCRYPTION_KEY_REFERENCE;
  if (
    !databaseUrl ||
    !admission ||
    !networkBucket ||
    !digest ||
    !encryptionKeyBase64 ||
    !encryptionKeyReference
  ) {
    return undefined;
  }
  const sql = createPublicFormsSql(databaseUrl);
  return createProviderDisabledPublicFormsRuntime({
    canonicalOrigin: import.meta.env.PUBLIC_ORIGIN ?? "https://www.sgsolutions.com",
    repository: new PostgresPublicFormsRepository(sql),
    outboxStore: new PostgresFormOutboxStore(sql, { workerId: "www_public_forms" }),
    secrets: {
      admission,
      networkBucket,
      digest,
      encryptionKeyBase64,
      encryptionKeyReference,
    },
  });
}

export function getPublicFormsRuntime() {
  if (configuredRuntime) return configuredRuntime;
  unavailableRuntime ??= createFormAdmissionHandlers({
    canonicalOrigin: import.meta.env.PUBLIC_ORIGIN ?? "https://www.sgsolutions.com",
    tokens: createSignedFormAdmissionTokens({
      secret: randomBytes(32).toString("base64url"),
      clock: { now: () => new Date() },
      ttlSeconds: 300,
    }),
    rateLimiter: createMemoryFormRateLimiter({ limit: 1, windowSeconds: 60 }),
    async networkBucket() {
      return createHmac("sha256", randomBytes(32)).update("unconfigured").digest("hex");
    },
    facade: unavailableFacade,
  });
  return unavailableRuntime;
}
