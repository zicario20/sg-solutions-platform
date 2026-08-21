import { describe, expect, it } from "vitest";
import {
  createFormAdmissionHandlers,
  createMemoryFormRateLimiter,
  createSignedFormAdmissionTokens,
} from "../../apps/www/src/lib/public-forms/admission.ts";
import type { AcceptPublicFormCommand } from "@atlas/domain";

const origin = "https://www.sgsllc.com";

function request(path: string, body: string, headers: Record<string, string> = {}): Request {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: {
      origin,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

function harness() {
  const received: AcceptPublicFormCommand[] = [];
  const tokens = createSignedFormAdmissionTokens({
    secret: "test-only-admission-secret-with-at-least-32-bytes",
    clock: { now: () => new Date("2026-08-20T20:00:00.000Z") },
    randomToken: (() => {
      let sequence = 0;
      return () => `opaque_${String(++sequence).padStart(32, "0")}`;
    })(),
    ttlSeconds: 600,
  });
  const handlers = createFormAdmissionHandlers({
    canonicalOrigin: origin,
    tokens,
    rateLimiter: createMemoryFormRateLimiter({ limit: 20, windowSeconds: 60 }),
    networkBucket: async () => "f".repeat(64),
    facade: {
      async acceptPublicSubmission(command) {
        received.push(command);
        return {
          status: "accepted",
          receiptId: "form_receipt_0000000000000001",
          issuedAt: new Date("2026-08-20T20:00:00.000Z"),
        };
      },
    },
  });
  return { handlers, received };
}

async function bootstrap(harness: ReturnType<typeof harness>) {
  const response = await harness.handlers.bootstrap(
    request(
      "/api/public/forms/bootstrap",
      JSON.stringify({
        formCode: "contact",
        formVersion: "1.0.0",
        locale: "es",
        purpose: "lead_request",
      }),
    ),
  );
  const payload = await response.json() as { nonce: string; csrfToken: string };
  const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  return { response, payload, cookie };
}

describe("M006 public form admission gateway", () => {
  it("issues a scoped bootstrap and forwards only the allowlisted command", async () => {
    const instance = harness();
    const boot = await bootstrap(instance);
    expect(boot.response.status).toBe(200);
    expect(boot.response.headers.get("set-cookie")).toContain("HttpOnly");

    const response = await instance.handlers.submit(
      request(
        "/api/public/forms/submit",
        JSON.stringify({
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: boot.payload.nonce,
          idempotencyKey: "idem_0123456789abcdef",
          answers: { email: "person@example.com" },
          consents: { service_contact: true },
          attribution: { landingPage: "/contact" },
          honeypot: "",
        }),
        { cookie: boot.cookie, "x-atlas-csrf": boot.payload.csrfToken },
      ),
    );

    expect(response.status).toBe(202);
    expect(instance.received).toHaveLength(1);
    expect(instance.received[0]).toMatchObject({ formCode: "contact", locale: "es" });
    expect(instance.received[0]).not.toHaveProperty("price");
  });

  it("rejects foreign origins and invalid CSRF with the same generic shape", async () => {
    const instance = harness();
    const boot = await bootstrap(instance);
    const body = JSON.stringify({
      formCode: "contact",
      formVersion: "1.0.0",
      locale: "es",
      nonce: boot.payload.nonce,
      idempotencyKey: "idem_0123456789abcdef",
      answers: { email: "person@example.com" },
      consents: { service_contact: true },
    });
    const foreign = await instance.handlers.submit(
      request("/api/public/forms/submit", body, {
        origin: "https://attacker.example",
        cookie: boot.cookie,
        "x-atlas-csrf": boot.payload.csrfToken,
      }),
    );
    const badCsrf = await instance.handlers.submit(
      request("/api/public/forms/submit", body, {
        cookie: boot.cookie,
        "x-atlas-csrf": "wrong",
      }),
    );
    expect(await foreign.json()).toEqual({ ok: false, code: "invalid_request" });
    expect(await badCsrf.json()).toEqual({ ok: false, code: "invalid_request" });
    expect(instance.received).toHaveLength(0);
  });

  it("absorbs honeypot submissions without forwarding them", async () => {
    const instance = harness();
    const boot = await bootstrap(instance);
    const response = await instance.handlers.submit(
      request(
        "/api/public/forms/submit",
        JSON.stringify({
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: boot.payload.nonce,
          idempotencyKey: "idem_0123456789abcdef",
          answers: { email: "person@example.com" },
          consents: { service_contact: true },
          honeypot: "filled-by-bot",
        }),
        { cookie: boot.cookie, "x-atlas-csrf": boot.payload.csrfToken },
      ),
    );
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, code: "request_received_for_review" });
    expect(instance.received).toHaveLength(0);
  });

  it("rejects duplicate JSON keys and mass-assigned authority", async () => {
    const instance = harness();
    const boot = await bootstrap(instance);
    const duplicate = await instance.handlers.submit(
      request(
        "/api/public/forms/submit",
        `{"formCode":"contact","formCode":"callback","formVersion":"1.0.0","locale":"es","nonce":${JSON.stringify(boot.payload.nonce)},"idempotencyKey":"idem_0123456789abcdef","answers":{"email":"person@example.com"},"consents":{"service_contact":true}}`,
        { cookie: boot.cookie, "x-atlas-csrf": boot.payload.csrfToken },
      ),
    );
    const massAssigned = await instance.handlers.submit(
      request(
        "/api/public/forms/submit",
        JSON.stringify({
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: boot.payload.nonce,
          idempotencyKey: "idem_0123456789abcdef",
          answers: { email: "person@example.com" },
          consents: { service_contact: true },
          price: 1,
          status: "payment_confirmed",
        }),
        { cookie: boot.cookie, "x-atlas-csrf": boot.payload.csrfToken },
      ),
    );
    expect(duplicate.status).toBe(400);
    expect(massAssigned.status).toBe(400);
    expect(instance.received).toHaveLength(0);
  });
});
