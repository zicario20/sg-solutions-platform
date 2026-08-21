import { createHmac, randomBytes } from "node:crypto";
import {
  createFormAdmissionHandlers,
  createMemoryFormRateLimiter,
  createSignedFormAdmissionTokens,
  type PublicFormsFacadePort,
} from "./admission.ts";

const canonicalOrigin = "https://www.sgsllc.com";
const admissionSecret = randomBytes(32).toString("hex");
const bucketSecret = randomBytes(32).toString("hex");

const disabledFacade: PublicFormsFacadePort = {
  async acceptPublicSubmission() {
    return { status: "unavailable", code: "form_unavailable" };
  },
};

let runtime: ReturnType<typeof createFormAdmissionHandlers> | undefined;

export function getPublicFormsRuntime() {
  runtime ??= createFormAdmissionHandlers({
    canonicalOrigin,
    tokens: createSignedFormAdmissionTokens({
      secret: admissionSecret,
      clock: { now: () => new Date() },
      ttlSeconds: 600,
    }),
    rateLimiter: createMemoryFormRateLimiter({ limit: 20, windowSeconds: 60 }),
    networkBucket: async (request) => {
      const networkHint = request.headers.get("x-vercel-forwarded-for") ?? "unavailable";
      return createHmac("sha256", bucketSecret)
        .update(`public-forms:network-bucket:v1\u0000${networkHint}`)
        .digest("hex");
    },
    facade: disabledFacade,
  });
  return runtime;
}

export function resetPublicFormsRuntimeForTests(): void {
  runtime = undefined;
}
