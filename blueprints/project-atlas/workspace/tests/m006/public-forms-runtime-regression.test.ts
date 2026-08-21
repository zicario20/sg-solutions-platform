import { describe, expect, it } from "vitest";

import { MemoryPublicFormsRepository } from "../../packages/domain/src/public-forms/repository.ts";
import { SyntheticFormOutboxStore } from "../../packages/domain/src/public-forms/synthetic-ports.ts";
import { createProviderDisabledPublicFormsRuntime } from "../../apps/www/src/lib/public-forms/runtime.ts";
import { REVIEW_NOW, reviewDefinition } from "./public-forms-review-fixtures.ts";

const ORIGIN = "https://www.sgsllc.com";

function request(path: string, body: Record<string, unknown>, input: { cookie?: string; csrf?: string } = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "x-vercel-forwarded-for": "192.0.2.10",
      ...(input.cookie ? { cookie: input.cookie } : {}),
      ...(input.csrf ? { "x-atlas-csrf": input.csrf } : {}),
    },
    body: JSON.stringify(body),
  });
}

function configuredRuntime() {
  const repository = new MemoryPublicFormsRepository({ definitions: [reviewDefinition()] });
  const outboxStore = new SyntheticFormOutboxStore();
  const runtime = createProviderDisabledPublicFormsRuntime({
    canonicalOrigin: ORIGIN,
    repository,
    outboxStore,
    clock: { now: () => REVIEW_NOW },
    secrets: {
      admission: "admission-secret-".padEnd(64, "a"),
      networkBucket: "bucket-secret-".padEnd(64, "b"),
      digest: "digest-secret-".padEnd(64, "c"),
      encryptionKeyBase64: Buffer.alloc(32, 7).toString("base64"),
      encryptionKeyReference: "local-m006-v1",
    },
  });
  return { repository, outboxStore, runtime };
}

async function bootstrap(runtime: ReturnType<typeof createProviderDisabledPublicFormsRuntime>, cookie?: string) {
  const response = await runtime.bootstrap(
    request(
      "/api/public/forms/bootstrap",
      { formCode: "contact", formVersion: "1.0.0", locale: "es", purpose: "lead_request" },
      cookie ? { cookie } : {},
    ),
  );
  expect(response.status).toBe(200);
  const grant = (await response.json()) as { nonce: string; csrfToken: string };
  const responseCookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  if (!responseCookie) throw new Error("missing test session cookie");
  return { grant, cookie: responseCookie };
}

describe("M006 configured provider-disabled runtime", () => {
  it("accepts and processes a published form without activating external providers", async () => {
    const { repository, outboxStore, runtime } = configuredRuntime();
    const session = await bootstrap(runtime);

    const response = await runtime.submit(
      request(
        "/api/public/forms/submit",
        {
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: session.grant.nonce,
          idempotencyKey: "idem_runtime_01234567",
          answers: { name: "Sami" },
          consents: { privacy_policy: true },
          honeypot: "",
        },
        { cookie: session.cookie, csrf: session.grant.csrfToken },
      ),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ ok: true, status: "accepted" });
    expect(repository.acceptedSubmissions).toHaveLength(1);
    expect(outboxStore.snapshot(repository.acceptedSubmissions[0]!.submissionId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: "completed", receipt: expect.objectContaining({ status: "pending" }) }),
      ]),
    );
  });

  it("saves and resumes an encrypted draft only in the bound opaque session", async () => {
    const { repository, runtime } = configuredRuntime();
    const session = await bootstrap(runtime);
    const save = await runtime.saveDraft(
      request(
        "/api/public/forms/draft/save",
        {
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: session.grant.nonce,
          answers: { name: "Sami" },
        },
        { cookie: session.cookie, csrf: session.grant.csrfToken },
      ),
    );
    expect(save.status).toBe(200);
    const saved = (await save.json()) as { draftReference: string };
    expect(saved.draftReference).toMatch(/^form_draft_[A-Za-z0-9_-]{16,128}$/u);
    expect(repository.drafts[0]?.ciphertext).not.toContain("Sami");

    const sameSession = await bootstrap(runtime, session.cookie);
    const resumed = await runtime.resumeDraft(
      request(
        "/api/public/forms/draft/resume",
        {
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: sameSession.grant.nonce,
          draftReference: saved.draftReference,
        },
        { cookie: sameSession.cookie, csrf: sameSession.grant.csrfToken },
      ),
    );
    expect(resumed.status).toBe(200);
    expect(await resumed.json()).toMatchObject({ ok: true, answers: { name: "Sami" } });

    const otherSession = await bootstrap(runtime);
    const denied = await runtime.resumeDraft(
      request(
        "/api/public/forms/draft/resume",
        {
          formCode: "contact",
          formVersion: "1.0.0",
          locale: "es",
          nonce: otherSession.grant.nonce,
          draftReference: saved.draftReference,
        },
        { cookie: otherSession.cookie, csrf: otherSession.grant.csrfToken },
      ),
    );
    expect(denied.status).toBe(400);
  });
});
